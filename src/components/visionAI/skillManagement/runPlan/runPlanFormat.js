/**
 * 运行计划 / 运行任务 共用展示格式化工具
 */
export const WEEKDAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const ALERT_LEVELS = [
  { label: '一级预警', value: 1, short: '最高', tagType: 'danger' },
  { label: '二级预警', value: 2, short: '高', tagType: 'warning' },
  { label: '三级预警', value: 3, short: '中', tagType: '' },
  { label: '四级预警', value: 4, short: '低', tagType: 'info' }
];

export function alertLevelLabel(level) {
  const item = ALERT_LEVELS.find(l => l.value === Number(level));
  return item ? item.label : '-';
}

export function alertLevelTagType(level) {
  const item = ALERT_LEVELS.find(l => l.value === Number(level));
  return item ? item.tagType : 'info';
}

/** 运行频率：每周周一、周三… / 每天 */
export function formatWeekdays(cycle) {
  if (!cycle || !cycle.weekdays || !cycle.weekdays.length) return '每天';
  const days = [...cycle.weekdays].sort((a, b) => a - b);
  if (days.length === 7) return '每天';
  return '每周' + days.map(d => WEEKDAY_LABELS[d] || d).join('、');
}

/** 运行时段：01:30 - 23:59，多段用逗号分隔 */
export function formatPeriods(cycle) {
  const periods = (cycle && cycle.periods) || [];
  if (!periods.length) return '00:00 - 23:59';
  return periods.map(p => `${p.start || '00:00'} - ${p.end || '23:59'}`).join('，');
}

/** 运行周期一行展示（列表用） */
export function formatRunCycle(cycle) {
  if (!cycle || !cycle.weekdays || !cycle.weekdays.length) return '全天';
  return `${formatWeekdays(cycle)} ${formatPeriods(cycle)}`;
}

/** 抽帧频率：每X秒抽取Y帧 */
export function formatFrameExtraction(fe) {
  if (!fe) return '-';
  const interval = fe.interval_seconds || 1;
  const frames = fe.frames || 1;
  return `每${interval}秒抽取${frames}帧`;
}

/** 围栏是否已绘制 */
export function fenceDrawn(fence) {
  if (!fence) return false;
  const hasRegions = fence.regions && fence.regions.length > 0;
  const hasTripwires = fence.tripwires && fence.tripwires.length > 0;
  const hasPoints = fence.points && fence.points.length > 0;
  return !!(hasRegions || hasTripwires || hasPoints);
}

export function skillKindLabel(kind) {
  return { visual: '视觉', graph: '编排', llm: '大模型' }[kind] || '视觉';
}

export function skillKindTagType(kind) {
  // 视觉技能用 Element 默认蓝色标签（''），注意空串是 falsy，不能用 || 'info' 兜底
  return { visual: '', graph: 'success', llm: 'warning' }[kind] || '';
}
