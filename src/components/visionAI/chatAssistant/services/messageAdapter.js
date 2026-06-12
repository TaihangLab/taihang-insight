import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * 消息模型（块时间线）：
 * 用户消息  { id, role: 'user', text }
 * 助手消息  { id, role: 'assistant', blocks: Block[], streaming, error }
 *
 * Block:
 * - { type: 'think', text, done }            思考过程
 * - { type: 'tool',  name, detail, done }    工具调用
 * - { type: 'text',  text, html }            正文（Markdown）
 *
 * 块按发生顺序排列，多轮工具调用时形如：think → tool → think → text
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    code(code, infostring) {
      const lang = (infostring || '').trim().split(/\s+/)[0] || '';
      return (
        `<div class="th-code-block">`
        + `<div class="th-code-head"><span class="th-code-lang">${escapeHtml(lang || 'code')}</span>`
        + `<span class="th-code-copy" role="button">复制</span></div>`
        + `<pre><code>${escapeHtml(code)}</code></pre>`
        + `</div>`
      );
    },
  },
});

export function renderMarkdown(text) {
  const raw = (text || '').trim();
  if (!raw) return '';
  return DOMPurify.sanitize(marked.parse(raw), {
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'strong', 'em', 'del', 'code', 'pre',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'blockquote', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
    ],
    ADD_ATTR: ['target', 'class', 'href', 'role', 'src', 'alt'],
  });
}

/* ---------------- 持久化消息中的思考标签 ---------------- */

const THINK_TAG_NAMES = '(?:think|redacted_reasoning|redacted_thinking)';
export const THINK_OPEN_RE = new RegExp(`<\\s*${THINK_TAG_NAMES}\\s*>`, 'i');
export const THINK_CLOSE_RE = new RegExp(`<\\s*\\/\\s*${THINK_TAG_NAMES}\\s*>`, 'i');
const THINK_FRAGMENT_RE = new RegExp(`<\\/?\\s*${THINK_TAG_NAMES}\\s*>`, 'gi');

function stripThinkTags(text) {
  return String(text || '').replace(THINK_FRAGMENT_RE, '').trim();
}

/** 解析后端入库格式：<think>思考</think>\n\n正文 */
export function parseStoredAssistantContent(text) {
  const raw = text || '';
  const open = raw.match(THINK_OPEN_RE);
  const close = raw.match(THINK_CLOSE_RE);

  if (open && close && close.index > open.index) {
    return {
      reasoning: raw.slice(open.index + open[0].length, close.index).trim(),
      answer: stripThinkTags(raw.slice(close.index + close[0].length)),
    };
  }
  if (!open && close) {
    return {
      reasoning: raw.slice(0, close.index).trim(),
      answer: stripThinkTags(raw.slice(close.index + close[0].length)),
    };
  }
  if (open && !close) {
    return { reasoning: raw.slice(open.index + open[0].length).trim(), answer: '' };
  }
  return { reasoning: '', answer: raw.trim() };
}

/* ---------------- 块构造 ---------------- */

export function makeThinkBlock(text = '', done = false) {
  return { type: 'think', text, done };
}

export function makeToolBlock(name = '', detail = '', done = false) {
  return { type: 'tool', name, detail, done };
}

export function makeTextBlock(text = '') {
  return { type: 'text', text, html: renderMarkdown(text) };
}

/** 提取助手消息的纯文本正文（复制 / 停止保存用） */
export function extractAnswerText(blocks) {
  return (blocks || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n')
    .trim();
}

/* ---------------- 历史消息 → UI 消息 ---------------- */

const TOOL_DETAIL_MAX = 200;
let fallbackSeq = 0;

function nextFallbackId(prefix) {
  fallbackSeq += 1;
  return `${prefix}-${Date.now()}-${fallbackSeq}`;
}

/**
 * 将后端 GET /messages 返回的消息列表转换为 UI 消息。
 * 两条 user 消息之间的全部 assistant / tool 消息合并为一条助手消息，
 * 还原为 think / tool / text 块时间线。
 */
export function apiMessagesToUi(apiMessages) {
  if (!Array.isArray(apiMessages)) return [];

  // 先收集全部工具执行结果（不依赖消息顺序，秒级时间戳排序可能打乱顺序）
  const toolResults = {};
  for (const m of apiMessages) {
    if (m.role === 'tool' && m.tool_call_id) {
      toolResults[m.tool_call_id] = (m.content || '').slice(0, TOOL_DETAIL_MAX);
    }
  }

  const out = [];
  let assistant = null;

  for (const m of apiMessages) {
    if (m.role === 'user') {
      const text = (m.content || '').trim();
      if (text) {
        out.push({ id: m.id || nextFallbackId('u'), role: 'user', text });
      }
      assistant = null;
      continue;
    }

    if (m.role === 'assistant') {
      if (!assistant) {
        assistant = {
          id: m.id || nextFallbackId('a'),
          role: 'assistant',
          blocks: [],
          streaming: false,
          error: false,
        };
        out.push(assistant);
      }

      const { reasoning, answer } = parseStoredAssistantContent(m.content || '');
      if (reasoning) assistant.blocks.push(makeThinkBlock(reasoning, true));
      if (answer) assistant.blocks.push(makeTextBlock(answer));

      if (Array.isArray(m.tool_calls)) {
        for (const tc of m.tool_calls) {
          const name = (tc && tc.function && tc.function.name) || '平台工具';
          const detail = (tc && tc.id && toolResults[tc.id]) || '';
          assistant.blocks.push(makeToolBlock(name, detail, true));
        }
      }
    }
  }

  // 丢弃完全没有内容的助手消息
  return out.filter((m) => m.role !== 'assistant' || m.blocks.length > 0);
}
