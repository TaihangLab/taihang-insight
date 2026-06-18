import { fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * 发起一次 SSE 聊天流（POST /api/v1/chat/chat）。
 *
 * 后端协议（OpenAI 兼容 chunk + 扩展字段）：
 * - data: {...choices[0].delta.content / delta.reasoning_content}  正文 / 思考增量
 * - data: {type: 'tool_start'|'tool_done', tool_name, detail}      工具事件
 * - data 中携带 conversation_id（首包必带，新会话据此拿到真实 ID）
 * - data: [DONE] 或 finish_reason === 'stop'                        结束
 * - ": heartbeat" 注释行由 fetchEventSource 自动忽略
 *
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {string} opts.token
 * @param {string} opts.message
 * @param {string|null} opts.conversationId
 * @param {(id: string) => void} [opts.onConversationId]
 * @param {(delta: {content: string, reasoning: string}) => void} [opts.onDelta]
 * @param {(event: {type: string, name: string, detail: string}) => void} [opts.onToolEvent]
 * @returns {{ abort: () => void, promise: Promise<{conversationId: string|null, aborted: boolean}> }}
 */
export function streamChat({
  baseUrl,
  token,
  message,
  conversationId,
  onConversationId,
  onDelta,
  onToolEvent,
}) {
  const controller = new AbortController();
  let convId = conversationId || null;
  let settled = false;

  const promise = new Promise((resolve, reject) => {
    const finish = (aborted = false) => {
      if (settled) return;
      settled = true;
      resolve({ conversationId: convId, aborted });
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    fetchEventSource(`${baseUrl}/api/v1/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { 'access-token': token } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
        stream: true,
      }),
      signal: controller.signal,
      openWhenHidden: true,
      onopen(response) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      },
      onmessage(ev) {
        const raw = (ev.data || '').trim();
        if (!raw) return;
        if (raw === '[DONE]') {
          finish();
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          return; // 不完整 chunk，忽略
        }

        if (parsed.conversation_id && parsed.conversation_id !== convId) {
          convId = parsed.conversation_id;
          if (onConversationId) onConversationId(convId);
        }

        if (parsed.type === 'tool_start' || parsed.type === 'tool_done') {
          if (onToolEvent) {
            onToolEvent({
              type: parsed.type,
              name: parsed.tool_name || '',
              detail: parsed.detail ? String(parsed.detail) : '',
            });
          }
          return;
        }

        const choice = parsed.choices && parsed.choices[0];
        const delta = (choice && choice.delta) || {};
        const content = delta.content || '';
        const reasoning = delta.reasoning_content || delta.reasoning || '';
        if ((content || reasoning) && onDelta) {
          onDelta({ content, reasoning });
        }

        if (choice && choice.finish_reason === 'stop') {
          finish();
        }
      },
      onclose() {
        finish();
      },
      onerror(err) {
        if (controller.signal.aborted) {
          finish(true);
        } else {
          fail(err);
        }
        // 抛出以阻止 fetchEventSource 自动重试
        throw err;
      },
    }).catch((err) => {
      if (controller.signal.aborted) finish(true);
      else fail(err);
    });
  });

  return {
    abort: () => controller.abort(),
    promise,
  };
}
