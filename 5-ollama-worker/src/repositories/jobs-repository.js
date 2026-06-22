const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function claimNextJob() {
  const { data } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'pending')
    .order('priority')
    .order('created_at')
    .limit(1);

  if (!data.length) {
    return null;
  }

  const job = data[0];

  await supabase
    .from('jobs')
    .update({
      status: 'processing',
    })
    .eq('id', job.id);

  console.log('Claimed job:', job.id);
  return job;
}

async function completeJob(id, result) {
  await supabase
    .from('jobs')
    .update({
      status: 'completed',
      result,
    })
    .eq('id', id);
}

async function failJob(id, error) {
  await supabase
    .from('jobs')
    .update({
      status: 'failed',
      error,
    })
    .eq('id', id);
}

module.exports = {
  claimNextJob,
  completeJob,
  failJob,
};
