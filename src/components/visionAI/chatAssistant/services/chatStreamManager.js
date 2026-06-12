import { streamChat } from './chatStream';
import {
  makeThinkBlock,
  makeToolBlock,
  makeTextBlock,
  renderMarkdown,
  extractAnswerText,
  THINK_OPEN_RE,
  THINK_CLOSE_RE,
} from './messageAdapter';

/**
 * 多会话流式状态机（模块级单例）。
 *
 * - 每个进行中的 SSE 流对应一个 session，key 为 conversationId，
 *   新会话在拿到真实 ID 前使用 `pending:` 临时 key。
 * - UI 切换会话时 detach（流在后台继续），切回时 attach 恢复渲染。
 * - 增量内容累积为块时间线：think / tool / text 按发生顺序排列。
 */

const EMIT_THROTTLE_MS = 50;

const sessions = Object.create(null);
const globalListeners = [];

/* ---------------- 内部工具 ---------------- */

function findSession(idOrKey) {
  if (!idOrKey) {
    return Object.values(sessions).find((s) => s.status === 'streaming' && !s.conversationId) || null;
  }
  if (sessions[idOrKey]) return sessions[idOrKey];
  return Object.values(sessions).find((s) => s.conversationId === idOrKey) || null;
}

function getStreamingIds() {
  return Object.values(sessions)
    .filter((s) => s.status === 'streaming' && s.conversationId)
    .map((s) => s.conversationId);
}

function emitGlobal() {
  const ids = getStreamingIds();
  globalListeners.forEach((fn) => fn(ids));
}

function migrateSessionKey(session, conversationId) {
  if (!session || !conversationId || session.key === conversationId) return;
  delete sessions[session.key];
  session.key = conversationId;
  session.conversationId = conversationId;
  sessions[conversationId] = session;
}

/** 渲染当前块时间线的快照（深拷贝，避免 UI 直接持有内部对象） */
function snapshotBlocks(session) {
  return session.blocks.map((b) => {
    if (b.type === 'text') {
      return { type: 'text', text: b.text, html: b.html };
    }
    if (b.type === 'tool') {
      return { type: 'tool', name: b.name, detail: b.detail, done: b.done };
    }
    return { type: 'think', text: b.text, done: b.done };
  });
}

function buildPatch(session, streaming) {
  return {
    blocks: snapshotBlocks(session),
    streaming,
    error: session.status === 'error',
  };
}

function emitUpdate(session, { immediate = false } = {}) {
  if (!session.onUpdate) return;
  if (immediate) {
    if (session.emitTimer) {
      clearTimeout(session.emitTimer);
      session.emitTimer = null;
    }
    session.onUpdate(buildPatch(session, session.status === 'streaming'));
    return;
  }
  if (session.emitTimer) return;
  session.emitTimer = setTimeout(() => {
    session.emitTimer = null;
    if (session.onUpdate) {
      session.onUpdate(buildPatch(session, session.status === 'streaming'));
    }
  }, EMIT_THROTTLE_MS);
}

/* ---------------- 块累积规则 ---------------- */

function lastBlock(session) {
  return session.blocks[session.blocks.length - 1] || null;
}

function closeOpenThink(session) {
  const last = lastBlock(session);
  if (last && last.type === 'think' && !last.done) last.done = true;
}

function appendReasoning(session, piece) {
  const last = lastBlock(session);
  if (last && last.type === 'think' && !last.done) {
    last.text += last.text ? piece : piece.replace(/^\s+/, '');
  } else {
    session.blocks.push(makeThinkBlock(piece.replace(/^\s+/, ''), false));
  }
}

function appendText(session, piece) {
  if (!piece) return;
  const last = lastBlock(session);
  if (last && last.type === 'text') {
    last.text += piece;
    last.html = renderMarkdown(last.text);
  } else {
    const trimmed = piece.replace(/^\s+/, '');
    if (!trimmed) return;
    closeOpenThink(session);
    session.blocks.push(makeTextBlock(trimmed));
  }
}

/*
 * 部分模型不走 reasoning_content 通道，而是把思考内联在正文流里：
 * - 显式：<think>思考</think>正文
 * - 隐式（Qwen3 预填模板）：开标签在服务端 prompt 里，流中只有「思考</think>正文」
 *
 * 这里对 content 流做实时解析。隐式场景下，每轮回答开头的内容先按思考处理，
 * 遇到 </think> 即转入正文；若直到流结束都没有闭合标签（模型本轮未思考），
 * 在收尾时把该思考块还原为正文。
 */

const TAG_HOLDBACK_WINDOW = 30;

/** 切出可安全输出的前缀，结尾可能是半个标签的部分先扣住等下一个 chunk */
function splitSafe(text, flush) {
  if (flush) return [text, ''];
  const lt = text.lastIndexOf('<');
  if (lt >= 0 && lt >= text.length - TAG_HOLDBACK_WINDOW && text.indexOf('>', lt) === -1) {
    return [text.slice(0, lt), text.slice(lt)];
  }
  return [text, ''];
}

function drainContentTail(session, flush) {
  let tail = session.contentTail || '';

  for (;;) {
    if (session.inInlineThink) {
      const close = tail.match(THINK_CLOSE_RE);
      if (close) {
        appendReasoning(session, tail.slice(0, close.index));
        closeOpenThink(session);
        session.inInlineThink = false;
        tail = tail.slice(close.index + close[0].length);
        continue;
      }
      const [safe, rest] = splitSafe(tail, flush);
      appendReasoning(session, safe);
      tail = rest;
      break;
    }

    const open = tail.match(THINK_OPEN_RE);
    if (open) {
      appendText(session, tail.slice(0, open.index));
      closeOpenThink(session);
      session.blocks.push(makeThinkBlock('', false));
      session.inInlineThink = true;
      session.awaitingRoundStart = false;
      tail = tail.slice(open.index + open[0].length);
      continue;
    }

    const [safe, rest] = splitSafe(tail, flush);

    // 每轮回答的第一段正文：若无显式 <think> 且未走 reasoning 通道，
    // 按隐式思考处理（Qwen3 等模板把开标签放在 prompt 里）
    if (safe && session.awaitingRoundStart && !session.channelReasoning) {
      const block = makeThinkBlock('', false);
      block.implicit = true;
      closeOpenThink(session);
      session.blocks.push(block);
      session.inInlineThink = true;
      session.awaitingRoundStart = false;
      continue;
    }

    appendText(session, safe);
    tail = rest;
    break;
  }

  session.contentTail = tail;
}

/** 流结束仍未闭合的隐式思考块：模型本轮其实没思考，内容还原为正文 */
function restoreUnclosedImplicitThink(session) {
  if (!session.inInlineThink) return;
  session.inInlineThink = false;
  const last = lastBlock(session);
  if (last && last.type === 'think' && !last.done && last.implicit) {
    session.blocks.pop();
    appendText(session, last.text);
  }
}

function appendContent(session, piece) {
  session.contentTail = (session.contentTail || '') + piece;
  drainContentTail(session, false);
}

function applyToolEvent(session, event) {
  if (event.type === 'tool_start') {
    closeOpenThink(session);
    session.blocks.push(makeToolBlock(event.name || '平台工具', event.detail || '', false));
    return;
  }
  // tool_done：回填最近一个未完成的同名工具块
  for (let i = session.blocks.length - 1; i >= 0; i -= 1) {
    const b = session.blocks[i];
    if (b.type === 'tool' && !b.done && (!event.name || b.name === event.name)) {
      b.done = true;
      if (event.detail) b.detail = event.detail.slice(0, 200);
      return;
    }
  }
  session.blocks.push(makeToolBlock(event.name || '平台工具', (event.detail || '').slice(0, 200), true));
}

function finishSession(session, { aborted = false, error = false } = {}) {
  session.status = error ? 'error' : 'done';
  session.stream = null;
  drainContentTail(session, true);
  restoreUnclosedImplicitThink(session);
  session.inInlineThink = false;
  closeOpenThink(session);
  session.blocks.forEach((b) => {
    if (b.type === 'tool') b.done = true;
  });

  emitUpdate(session, { immediate: true });

  const onComplete = session.onComplete;
  const payload = {
    conversationId: session.conversationId,
    aborted,
    error,
  };

  session.onUpdate = null;
  session.onComplete = null;
  delete sessions[session.key];
  emitGlobal();

  if (onComplete) onComplete(payload);
}

/* ---------------- 对外 API ---------------- */

export function subscribeStreamingIds(fn) {
  globalListeners.push(fn);
  fn(getStreamingIds());
  return () => {
    const idx = globalListeners.indexOf(fn);
    if (idx >= 0) globalListeners.splice(idx, 1);
  };
}

export function isConversationStreaming(conversationId) {
  const session = findSession(conversationId);
  return !!(session && session.status === 'streaming');
}

/** 切回正在流式的会话时，取当前块快照恢复 UI */
export function getSessionSnapshot(conversationId) {
  const session = findSession(conversationId);
  if (!session || session.status !== 'streaming') return null;
  return buildPatch(session, true);
}

export function startStream({
  baseUrl,
  token,
  message,
  conversationId,
  assistantMessageId,
  onConversationId,
  onUpdate,
  onComplete,
}) {
  const sessionKey = conversationId || `pending:${Date.now()}`;
  const session = {
    key: sessionKey,
    conversationId: conversationId || null,
    status: 'streaming',
    blocks: [],
    contentTail: '',
    inInlineThink: false,
    awaitingRoundStart: true,
    channelReasoning: false,
    onUpdate: onUpdate || null,
    onComplete: onComplete || null,
    stream: null,
    assistantMessageId: assistantMessageId || '',
    emitTimer: null,
  };
  sessions[sessionKey] = session;

  const stream = streamChat({
    baseUrl,
    token,
    message,
    conversationId,
    onConversationId: (id) => {
      migrateSessionKey(session, id);
      if (onConversationId) onConversationId(id);
      emitGlobal();
    },
    onToolEvent: (event) => {
      // 工具事件意味着本轮回答结束，未消费的尾部缓冲先冲洗掉
      drainContentTail(session, true);
      session.inInlineThink = false;
      applyToolEvent(session, event);
      if (event.type === 'tool_done') {
        session.awaitingRoundStart = true;
      }
      emitUpdate(session, { immediate: true });
    },
    onDelta: ({ content, reasoning }) => {
      if (reasoning) {
        session.channelReasoning = true;
        appendReasoning(session, reasoning);
      }
      if (content) appendContent(session, content);
      emitUpdate(session);
    },
  });

  session.stream = stream;
  emitGlobal();

  stream.promise
    .then((result) => finishSession(session, { aborted: !!result.aborted }))
    .catch(() => finishSession(session, { error: true }));

  return session;
}

export function attachSession(idOrKey, { onUpdate, onComplete } = {}) {
  const session = findSession(idOrKey);
  if (!session || session.status !== 'streaming') return false;
  if (onUpdate) session.onUpdate = onUpdate;
  if (onComplete) session.onComplete = onComplete;
  emitUpdate(session, { immediate: true });
  return true;
}

export function detachSession(idOrKey) {
  const session = findSession(idOrKey);
  if (!session) return;
  session.onUpdate = null;
}

export function stopStream(idOrKey) {
  const session = findSession(idOrKey);
  if (session && session.stream) session.stream.abort();
}

/** 已生成的正文（停止时持久化用） */
export function getPartialText(idOrKey) {
  const session = findSession(idOrKey);
  return session ? extractAnswerText(session.blocks) : '';
}

export function getAssistantMessageId(idOrKey) {
  const session = findSession(idOrKey);
  return session ? session.assistantMessageId : '';
}
