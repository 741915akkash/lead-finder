const { supabase } = require('../db/db');

const MAX_ATTEMPTS = 3;
const FIRST_RETRY_MINUTES = 15;
const SECOND_RETRY_MINUTES = 30;

async function claimNextJob() {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('jobs_2')
    .select('*')
    .eq('status', 'pending')
    .or(`retry_at.is.null,retry_at.lte.${now}`)
    .order('priority')
    .order('created_at')
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || !data.length) {
    return null;
  }

  const job = data[0];
  const nextAttempt = (job.attempts ?? 0) + 1;

  const { data: claimedJob, error: claimError } = await supabase
    .from('jobs_2')
    .update({
      status: 'processing',
      attempts: nextAttempt,
      retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  /*
   * Another worker may have claimed the job between
   * SELECT and UPDATE.
   */
  if (!claimedJob) {
    return null;
  }

  console.log(`Claimed job: ${claimedJob.id} (attempt ${nextAttempt}/${MAX_ATTEMPTS})`);

  return claimedJob;
}

async function completeJob(id, result) {
  const { error } = await supabase
    .from('jobs_2')
    .update({
      status: 'completed',
      result,
      error: null,
      retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

async function failJob(id, errorMessage, temporary = false) {
  const { data: job, error: getError } = await supabase
    .from('jobs_2')
    .select('id, attempts')
    .eq('id', id)
    .maybeSingle();

  if (getError) {
    throw getError;
  }

  if (!job) {
    throw new Error(`Queue job ${id} not found`);
  }

  const attempts = job.attempts ?? 0;

  /*
   * Temporary errors:
   *
   * attempt 1 → retry after 15 minutes
   * attempt 2 → retry after 30 minutes
   * attempt 3 → permanently failed
   */
  if (temporary && attempts < MAX_ATTEMPTS) {
    const retryMinutes = attempts === 1 ? FIRST_RETRY_MINUTES : SECOND_RETRY_MINUTES;

    const retryAt = new Date(Date.now() + retryMinutes * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('jobs_2')
      .update({
        status: 'pending',
        error: errorMessage,
        retry_at: retryAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    console.log(`Job ${id} will retry in ${retryMinutes} minutes (attempt ${attempts}/${MAX_ATTEMPTS}).`);

    return {
      retried: true,
      retry_at: retryAt,
      attempts,
    };
  }

  const { error } = await supabase
    .from('jobs_2')
    .update({
      status: 'failed',
      error: errorMessage,
      retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }

  console.log(`Job ${id} permanently failed after ${attempts} attempt(s).`);

  return {
    retried: false,
    attempts,
  };
}

/*
 * Requeue existing jobs that previously failed because
 * of a temporary Ollama/network "fetch failed" error.
 *
 * Runs automatically when the processor starts.
 */
async function requeueFetchFailedJobs() {
  const { data, error } = await supabase
    .from('jobs_2')
    .update({
      status: 'pending',
      attempts: 0,
      retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'failed')
    .ilike('error', '%fetch failed%')
    .select('id');

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    console.log(`Requeued ${data.length} existing fetch-failed job(s):`, data.map((job) => job.id).join(', '));
  }

  return data ?? [];
}

/*
 * Clean up old completed jobs that still contain a stale
 * "fetch failed" error from an earlier processor run.
 */
async function clearCompletedFetchErrors() {
  const { data, error } = await supabase
    .from('jobs_2')
    .update({
      error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'completed')
    .ilike('error', '%fetch failed%')
    .select('id');

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    console.log(
      `Cleared stale fetch-failed error from ${data.length} completed job(s):`,
      data.map((job) => job.id).join(', '),
    );
  }

  return data ?? [];
}

/*
 * Recover queue jobs that were left in "processing"
 * because the worker crashed or the machine restarted.
 *
 * 30 minutes is intentionally conservative.
 *
 * Attempts are preserved because a worker crash should
 * not reset the retry count.
 */
async function recoverStaleJobs(maxAgeMinutes = 30) {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('jobs_2')
    .update({
      status: 'pending',
      retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lt('updated_at', cutoff)
    .select('id');

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    console.log(`Recovered ${data.length} stale processing job(s):`, data.map((job) => job.id).join(', '));
  }

  return data ?? [];
}

module.exports = {
  claimNextJob,
  completeJob,
  failJob,
  requeueFetchFailedJobs,
  clearCompletedFetchErrors,
  recoverStaleJobs,
};
