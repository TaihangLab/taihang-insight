/**
 * 点位录像回放：时间格式与片段查找。
 * 片段列表由 smart_engine /asset/recordings 从 gowvp 拉取。
 */

export function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

export function formatYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function formatHms(dateOrMs) {
  const d = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

export function formatHm(dateOrMs) {
  const d = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

export function dayStartMs(dateStr) {
  const parts = String(dateStr || '').split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

export function dayEndMs(dateStr) {
  return dayStartMs(dateStr) + 24 * 60 * 60 * 1000;
}

export function msOfDay(ms) {
  const d = new Date(ms);
  return d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds();
}

export function findClipAt(clips, ms) {
  const list = clips || [];
  for (let i = 0; i < list.length; i += 1) {
    if (ms >= list[i].startMs && ms < list[i].endMs) return list[i];
  }
  return null;
}

export function nearestClip(clips, ms) {
  const hit = findClipAt(clips, ms);
  if (hit) return hit;
  const list = clips || [];
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < list.length; i += 1) {
    const dist = ms < list[i].startMs ? list[i].startMs - ms : ms - list[i].endMs;
    if (dist < bestDist) {
      bestDist = dist;
      best = list[i];
    }
  }
  return best;
}
