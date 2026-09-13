/**
 * 点位录像计划：星期/时段展示与默认值。
 * 真实计划存在 gowvp，经 smart_engine /asset/record-plans 读写。
 */

export const WEEK_DAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 7, label: '日' },
];

export function defaultPlan() {
  return {
    enabled: true,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    periods: [{ start: '00:00', end: '23:59' }],
    retainDays: 7,
  };
}

export function formatWeekdays(weekdays) {
  const set = new Set(weekdays || []);
  if (set.size === 7) return '每天';
  const labels = WEEK_DAYS.filter((d) => set.has(d.value)).map((d) => `周${d.label}`);
  return labels.join('、') || '未选';
}

export function formatPeriods(periods) {
  const list = (periods || []).filter((p) => p && p.start && p.end);
  if (!list.length) return '-';
  return list.map((p) => `${p.start} ~ ${p.end}`).join('，');
}

/** 是否已写入星期+时段 */
export function hasSchedule(plan) {
  return !!(plan && (plan.weekdays || []).length && (plan.periods || []).length);
}

/** 列表「录像配置状态」文案：always 单独标出来 */
export function configStatusText(row) {
  if (row && row.recordMode === 'always') return '全天录像';
  return row && row.configStatus === '已配置' ? '已配置' : '未配置';
}

export function mergePointWithPlan(point, plansMap) {
  const plan = (plansMap && plansMap[point.id]) || null;
  const mode = (plan && plan.recordMode) || 'none';
  const scheduled = hasSchedule(plan);
  const override = mode === 'always';
  return {
    ...point,
    configStatus: scheduled || override ? '已配置' : '未配置',
    planEnabled: override || (mode === 'plan' && !!(plan && plan.enabled)),
    recordMode: mode,
    plan,
  };
}
