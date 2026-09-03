require('dotenv').config();

const { supabase } = require('../db/db');
const { recoverStaleJobs } = require('../repositories/jobs-repository');

const TEST_JOB_TYPE = 'parse_job';
const TEST_JOB_POSTING_ID = 104;

async function run() {
  console.log('======================================');
  console.log('STALE JOB RECOVERY TEST');
  console.log('======================================');
  console.log();

  // --------------------------------------------
  // Create one deliberately stale processing job
  // --------------------------------------------

  const staleTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: insertedJob, error: insertError } = await supabase
    .from('jobs_2')
    .insert({
      job_type: TEST_JOB_TYPE,
      payload: {
        job_posting_id: TEST_JOB_POSTING_ID,
      },
      priority: 0,
      status: 'processing',
      updated_at: staleTime,
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  console.log(`Created test job: ${insertedJob.id}`);
  console.log(`Status: ${insertedJob.status}`);
  console.log(`Updated at: ${insertedJob.updated_at}`);
  console.log();

  // --------------------------------------------
  // Recover stale jobs
  // --------------------------------------------

  console.log('Running stale-job recovery...');

  const recoveredJobs = await recoverStaleJobs(30);

  console.log();

  // --------------------------------------------
  // Verify
  // --------------------------------------------

  const { data: recoveredJob, error: fetchError } = await supabase
    .from('jobs_2')
    .select('*')
    .eq('id', insertedJob.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  console.log('DATABASE RESULT');
  console.log('--------------------------------------');
  console.log({
    id: recoveredJob.id,
    status: recoveredJob.status,
    updated_at: recoveredJob.updated_at,
  });

  if (recoveredJob.status !== 'pending') {
    throw new Error(`Expected stale job to become pending, got: ${recoveredJob.status}`);
  }

  if (!recoveredJobs.some((job) => job.id === insertedJob.id)) {
    throw new Error('Recovered job was not returned by recoverStaleJobs()');
  }

  console.log();
  console.log('✓ Stale processing job recovered successfully');
  console.log();

  // --------------------------------------------
  // Cleanup
  // --------------------------------------------

  const { error: deleteError } = await supabase.from('jobs_2').delete().eq('id', insertedJob.id);

  if (deleteError) {
    throw deleteError;
  }

  console.log(`✓ Test job ${insertedJob.id} cleaned up`);
  console.log();
  console.log('✓ Stale job recovery test passed');
}

run().catch((error) => {
  console.error();
  console.error('✗ Stale job recovery test failed');
  console.error(error);
  process.exit(1);
});
