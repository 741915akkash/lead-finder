const { claimJob } = require('../queue/claim-job');
const { completeJob } = require('../queue/complete-job');
const { failJob } = require('../queue/fail-job');

const { getJobPostingById, updateParsedJob } = require('../repositories/job-postings-repository');

const { parseJob } = require('../ai/parse-job');
const { resolvePostedAt } = require('../normalizers/posted-at');

async function processNextJob() {
  const job = await claimJob();

  if (!job) {
    return false;
  }

  try {
    const jobPostingId = job.payload?.job_posting_id;

    if (!jobPostingId) {
      throw new Error('Missing job_posting_id in job payload');
    }

    const jobPosting = await getJobPostingById(jobPostingId);

    if (!jobPosting) {
      throw new Error(`Job posting ${jobPostingId} not found`);
    }

    if (!jobPosting.raw_text) {
      throw new Error(`Job posting ${jobPostingId} has no raw_text`);
    }

    console.log(`Processing job posting: ${jobPosting.id}`);

    console.log(`Title: ${jobPosting.title}`);
    console.log(`Source: ${jobPosting.source}`);

    // --------------------------------------------
    // Stage 1: Parse + validate + repair if needed
    // --------------------------------------------

    const parsedJob = await parseJob(jobPosting.raw_text);

    console.log('✓ Job parsed and validated');

    // --------------------------------------------
    // Resolve relative posting date
    // --------------------------------------------

    const postedAt = resolvePostedAt(parsedJob.posted_at_raw, jobPosting.discovered_at);

    console.log(`Posted date: ${parsedJob.posted_at_raw ?? 'unknown'} → ${postedAt ?? 'null'}`);

    // --------------------------------------------
    // Update job_postings
    // --------------------------------------------

    const updatedJob = await updateParsedJob(jobPosting.id, parsedJob, postedAt);

    console.log(`✓ Updated job posting: ${updatedJob.id}`);

    // --------------------------------------------
    // Complete queue job
    // --------------------------------------------

    const result = {
      job_posting_id: jobPosting.id,
      parsed_job: parsedJob,
      posted_at: postedAt,
    };

    await completeJob(job.id, result);

    console.log(`✓ Completed processing job: ${job.id}`);

    return true;
  } catch (err) {
    console.error(`✗ Job ${job.id} failed:`, err.message);

    try {
      await failJob(job.id, err.message);
    } catch (failError) {
      console.error(`✗ Failed to mark job ${job.id} as failed:`, failError.message);
    }

    return false;
  }
}

module.exports = {
  processNextJob,
};
