const { supabase } = require('../db/db');

async function claimNextJob() {
  const { data, error } = await supabase
    .from('jobs_2')
    .select('*')
    .eq('status', 'pending')
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

  const { data: claimedJob, error: claimError } = await supabase
    .from('jobs_2')
    .update({
      status: 'processing',
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

  console.log('Claimed job:', claimedJob.id);

  return claimedJob;
}

async function completeJob(id, result) {
  const { error } = await supabase
    .from('jobs_2')
    .update({
      status: 'completed',
      result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

async function failJob(id, errorMessage) {
  const { error } = await supabase
    .from('jobs_2')
    .update({
      status: 'failed',
      error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/*
 * Recover queue jobs that were left in "processing"
 * because the worker crashed or the machine restarted.
 *
 * 30 minutes is intentionally conservative.
 */
async function recoverStaleJobs(maxAgeMinutes = 30) {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('jobs_2')
    .update({
      status: 'pending',
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
  recoverStaleJobs,
};
