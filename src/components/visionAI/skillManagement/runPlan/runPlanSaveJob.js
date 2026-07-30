/** 运行计划异步保存 job：本地缓存，便于关闭弹窗后回来继续看进度 */
const STORAGE_KEY = 'run_plan_active_save_job';

export function loadActiveSaveJob() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const job = JSON.parse(raw);
    if (!job || !job.job_id) return null;
    return job;
  } catch (e) {
    return null;
  }
}

export function saveActiveSaveJob(job) {
  if (!job || !job.job_id) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      job_id: job.job_id,
      op: job.op || '',
      plan_id: job.plan_id || null,
      status: job.status || 'pending',
      phase: job.phase || '',
      message: job.message || '',
      current: job.current || 0,
      total: job.total || 0,
      percent: job.percent || 0,
      error: job.error || null,
      updated_at: Date.now()
    }));
  } catch (e) {
    // ignore quota / private mode
  }
}

export function clearActiveSaveJob(jobId) {
  try {
    if (jobId) {
      const cur = loadActiveSaveJob();
      if (cur && cur.job_id !== jobId) return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
