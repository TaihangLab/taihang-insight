/** 太行助手全屏层 z-index=10000，悬浮球 10050；弹窗/消息需更高 */
export const CHAT_OVERLAY_Z_INDEX = 10100;

export function chatConfirm(vm, message, title = '提示') {
  return vm.$confirm(message, title, {
    type: 'warning',
    zIndex: CHAT_OVERLAY_Z_INDEX,
  });
}

export function chatPrompt(vm, message, title = '提示', inputValue = '') {
  return vm.$prompt(message, title, {
    inputValue,
    inputValidator: (v) => (!!(v && v.trim()) || '名称不能为空'),
    zIndex: CHAT_OVERLAY_Z_INDEX,
  });
}

export function chatMessage(vm, type, message) {
  return vm.$message({
    type,
    message,
    zIndex: CHAT_OVERLAY_Z_INDEX,
  });
}
