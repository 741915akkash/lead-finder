require('dotenv').config();

const { processNextJob } = require('../jobs/process-job');
const { supabase } = require('../db/db');

async function getLatestAnalyzedJob() {
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      company,
      status,
      fit_score,
      recommendation,
      ai_reason,
      ai_red_flags,
      analyzed_at
    `,
    )
    .eq('status', 'analyzed')
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function run() {
  console.log('======================================');
  console.log('REAL PROCESS-JOB INTEGRATION TEST');
  console.log('======================================');
  console.log();

  console.log('Running one queue job...');
  console.log();

  const processed = await processNextJob();

  console.log();
  console.log('processNextJob() returned:', processed);
  console.log();

  if (!processed) {
    throw new Error('No job was processed. Make sure there is a pending queue job.');
  }

  const job = await getLatestAnalyzedJob();

  if (!job) {
    throw new Error('No analyzed job found in job_postings.');
  }

  console.log('======================================');
  console.log('DATABASE RESULT');
  console.log('======================================');
  console.log();

  console.log(JSON.stringify(job, null, 2));

  console.log();
  console.log('======================================');
  console.log('VERIFICATION');
  console.log('======================================');
  console.log();

  const checks = [
    ['status', job.status === 'analyzed'],
    ['fit_score', job.fit_score !== null],
    ['recommendation', job.recommendation !== null],
    ['ai_reason', job.ai_reason !== null],
    ['ai_red_flags', job.ai_red_flags !== null],
    ['analyzed_at', job.analyzed_at !== null],
  ];

  let failed = false;

  for (const [name, passed] of checks) {
    if (passed) {
      console.log(`✓ ${name}`);
    } else {
      console.log(`✗ ${name}`);
      failed = true;
    }
  }

  console.log();

  if (failed) {
    throw new Error('One or more database verification checks failed.');
  }

  console.log('✓ Stage 2 integration test passed');
}

run().catch((error) => {
  console.error();
  console.error('✗ Integration test failed');
  console.error(error);
  process.exit(1);
});
