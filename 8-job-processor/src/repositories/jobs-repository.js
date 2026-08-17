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
    .single();

  if (claimError) {
    throw claimError;
  }

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

module.exports = {
  claimNextJob,
  completeJob,
  failJob,
};
