const { correctSalary } = require('../normalizers/salary');
const { claimJob } = require('../queue/claim-job');
const { completeJob } = require('../queue/complete-job');
const { failJob } = require('../queue/fail-job');

const { getJobPostingById, updateParsedJob, updateJobAnalysis } = require('../repositories/job-postings-repository');

const { parseJob } = require('../ai/parse-job');
const { analyzeJob } = require('../ai/analyze-job');

const { calculateTechnologyScore } = require('../ai/technology-score');
const { calculateCompanyScore } = require('../ai/company-score');
const { calculateSalaryScore } = require('../normalizers/salary-score');

const { TARGET_ROLE } = require('../config/target-role');
const { resolvePostedAt } = require('../normalizers/posted-at');

function calculateFinalScore(technologyResult, companyScore, salaryScore) {
  // Hard technology gate.
  if (technologyResult?.eligible === false) {
    return 0;
  }

  if (technologyResult?.score == null) {
    return null;
  }

  const coreTechnologyScore = technologyResult.required_score;

  const effectiveCompanyScore = coreTechnologyScore != null && coreTechnologyScore >= 0.5 ? (companyScore ?? 0) : 0;

  const effectiveSalaryScore = salaryScore ?? 0;

  return technologyResult.score * 0.5 + effectiveCompanyScore * 0.25 + effectiveSalaryScore * 0.25;
}

function getRecommendation(score) {
  if (score == null) {
    return 'insufficient_data';
  }

  if (score >= 0.75) {
    return 'high_priority';
  }

  if (score >= 0.6) {
    return 'consider';
  }

  if (score >= 0.45) {
    return 'low_priority';
  }

  return 'skip';
}

function buildRedFlags({ role, technology, company, salary }) {
  const redFlags = [];

  if (role.label === 'unrelated') {
    redFlags.push('Role is unrelated to the target role');
  }

  if (role.label === 'adjacent') {
    redFlags.push('Role is adjacent rather than a direct match');
  }

  if (technology.score != null && technology.score < 0.3) {
    redFlags.push('Most required technologies are unfamiliar');
  }

  if (technology.score != null && technology.score >= 0.3 && technology.score < 0.5) {
    redFlags.push('Technology stack has substantial unfamiliarity');
  }

  if (salary.label === 'below_minimum') {
    redFlags.push('Salary is below target minimum');
  }

  if (company.label === 'mismatch') {
    redFlags.push('Company profile does not match target preference');
  }

  return redFlags;
}

function buildAiReason({ analysis, technology, company, salary }) {
  return [
    analysis.role?.reason,
    analysis.technology?.reason,
    analysis.company?.reason,

    `Technology score: ${technology.score ?? 'unknown'} (${technology.label}).`,
    `Company score: ${company.score ?? 'unknown'} (${company.label}).`,
    `Salary score: ${salary.score ?? 'unknown'} (${salary.label}).`,
  ]
    .filter(Boolean)
    .join(' ');
}

function isTemporaryError(error) {
  if (!error) {
    return false;
  }

  if (error.temporary === true) {
    return true;
  }

  if (error.code === 'OLLAMA_FETCH_FAILED') {
    return true;
  }

  if (error.code === 'OLLAMA_SERVER_ERROR') {
    return true;
  }

  if (error.name === 'TypeError' && error.message?.includes('fetch failed')) {
    return true;
  }

  if (error.message?.includes('fetch failed')) {
    return true;
  }

  return false;
}

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

    /*
     * IDEMPOTENCY GUARD
     *
     * A duplicate queue item must never cause an already
     * analyzed job to be parsed/analyzed again.
     */

    if (jobPosting.status === 'analyzed') {
      console.log(`Job posting ${jobPosting.id} is already analyzed. Skipping.`);

      await completeJob(job.id, {
        job_posting_id: jobPosting.id,
        skipped: true,
        reason: 'already_analyzed',
      });

      return true;
    }

    if (!jobPosting.raw_text) {
      throw new Error(`Job posting ${jobPostingId} has no raw_text`);
    }

    console.log(`Processing job posting: ${jobPosting.id}`);
    console.log(`Title: ${jobPosting.title}`);
    console.log(`Source: ${jobPosting.source}`);
    console.log(`Queue attempt: ${job.attempts ?? 1}`);

    // --------------------------------------------
    // Stage 1: Parse
    // --------------------------------------------

    const parsedJob = await parseJob(jobPosting.raw_text);

    /*
     * A job without a title is not processable.
     *
     * Do NOT fall back to the existing database title.
     * Do NOT save the parsed result.
     * This is a permanent data/parser failure.
     */
    if (!parsedJob.title || typeof parsedJob.title !== 'string' || !parsedJob.title.trim()) {
      throw new Error('Parsed job has no valid title');
    }

    console.log('✓ Job parsed and validated');

    // --------------------------------------------
    // Correct salary normalization
    // --------------------------------------------

    const correctedJob = correctSalary(parsedJob);

    if (correctedJob.salary_min !== parsedJob.salary_min || correctedJob.salary_max !== parsedJob.salary_max) {
      console.log(
        `Salary corrected: ${parsedJob.salary_min}–${parsedJob.salary_max} → ${correctedJob.salary_min}–${correctedJob.salary_max}`,
      );
    }

    // --------------------------------------------
    // Resolve relative posting date
    // --------------------------------------------

    const postedAt = resolvePostedAt(correctedJob.posted_at_raw, jobPosting.discovered_at);

    console.log(`Posted date: ${correctedJob.posted_at_raw ?? 'unknown'} → ${postedAt ?? 'null'}`);

    // --------------------------------------------
    // Save Stage 1
    // --------------------------------------------

    const updatedJob = await updateParsedJob(jobPosting.id, correctedJob, postedAt);

    console.log(`✓ Updated job posting: ${updatedJob.id}`);

    // --------------------------------------------
    // Stage 2: AI analysis
    // --------------------------------------------

    console.log('Starting Stage 2 analysis...');

    const analysis = await analyzeJob(updatedJob, TARGET_ROLE);

    console.log('✓ Job analyzed');

    // --------------------------------------------
    // Deterministic scoring
    // --------------------------------------------

    const technologyResult = calculateTechnologyScore(analysis.technology);

    const companyResult = calculateCompanyScore(analysis.company);

    const salaryResult = calculateSalaryScore(updatedJob.salary_min);

    const finalScore = calculateFinalScore(technologyResult, companyResult.score, salaryResult.score);

    const recommendation = getRecommendation(finalScore);

    const redFlags = buildRedFlags({
      role: analysis.role,
      technology: technologyResult,
      company: companyResult,
      salary: salaryResult,
    });

    const aiReason = buildAiReason({
      analysis,
      technology: technologyResult,
      company: companyResult,
      salary: salaryResult,
    });

    console.log('--------------------------------------');
    console.log('STAGE 2 SCORING');
    console.log('--------------------------------------');

    console.log(`Role: ${analysis.role.label}`);

    console.log(`Technology: ${technologyResult.score} (${technologyResult.label})`);

    console.log(`Company: ${companyResult.score} (${companyResult.label})`);

    console.log(`Salary: ${salaryResult.score} (${salaryResult.label})`);

    console.log(`Fit score: ${finalScore}`);
    console.log(`Recommendation: ${recommendation}`);

    if (redFlags.length > 0) {
      console.log(`Red flags: ${redFlags.join('; ')}`);
    } else {
      console.log('Red flags: none');
    }

    // --------------------------------------------
    // Save Stage 2
    // --------------------------------------------

    const analyzedJob = await updateJobAnalysis(jobPosting.id, {
      fit_score: finalScore,
      recommendation,
      ai_reason: aiReason,
      ai_red_flags: redFlags,
    });

    console.log(`✓ Saved Stage 2 analysis: ${analyzedJob.id}`);

    // --------------------------------------------
    // Complete queue job
    // --------------------------------------------

    const result = {
      job_posting_id: jobPosting.id,

      parsed_job: correctedJob,
      posted_at: postedAt,

      analysis,

      scores: {
        technology: technologyResult,
        company: companyResult,
        salary: salaryResult,
        final: finalScore,
      },

      recommendation,
      red_flags: redFlags,
    };

    await completeJob(job.id, result);

    console.log(`✓ Completed processing job: ${job.id}`);

    return true;
  } catch (err) {
    console.error(`✗ Job ${job.id} failed:`, err.message);

    try {
      if (isTemporaryError(err)) {
        await failJob(job.id, err.message, true);

        console.log(`↻ Job ${job.id} scheduled for retry.`);
      } else {
        await failJob(job.id, err.message, false);

        console.log(`✗ Job ${job.id} permanently failed.`);
      }
    } catch (failError) {
      console.error(`✗ Failed to update queue job ${job.id}:`, failError.message);
    }

    return false;
  }
}

module.exports = {
  processNextJob,
  calculateFinalScore,
  getRecommendation,
  buildRedFlags,
  buildAiReason,
  isTemporaryError,
};
