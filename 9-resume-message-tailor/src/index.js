const fs = require('fs');
const path = require('path');

const { tailorResume } = require('./ai/tailor');
const { validateTailoredResume } = require('./validation/validate-tailoring');

const MASTER_RESUME_PATH = path.join(__dirname, 'master-resume', 'master-resume.md');

/**
 * Load the canonical master resume.
 *
 * The master resume is the single source of truth for
 * candidate experience, projects, technologies, and education.
 */
function loadMasterResume() {
  if (!fs.existsSync(MASTER_RESUME_PATH)) {
    throw new Error(`Master resume not found: ${MASTER_RESUME_PATH}`);
  }

  const masterResume = fs.readFileSync(MASTER_RESUME_PATH, 'utf8').trim();

  if (!masterResume) {
    throw new Error('Master resume is empty.');
  }

  return masterResume;
}

/**
 * Main resume tailoring pipeline.
 *
 * The fit-scoring pipeline has already determined that the job
 * is relevant. Tailoring does not need the fit analysis.
 *
 * Flow:
 *
 * FIT-SCORED JOB
 *      ↓
 * job description + master resume
 *      ↓
 * AI selects + tailors relevant material
 *      ↓
 * validate tailored resume
 *      ↓
 * tailored-resume.md
 */
async function processJobApplication({ job, model, ollamaUrl }) {
  if (!job) {
    throw new Error('Missing job.');
  }

  if (!job.description) {
    throw new Error('Missing job description.');
  }

  const masterResume = loadMasterResume();

  const tailoringResult = await tailorResume({
    job,
    masterResume,
    model,
    ollamaUrl,
  });

  const validation = validateTailoredResume({
    tailoredResume: tailoringResult.tailoring,
    masterResume,
    job,
  });

  if (!validation.valid) {
    const errorDetails = validation.errors.map((error) => `- ${error}`).join('\n');

    throw new Error(`Tailored resume failed validation.\n\n${errorDetails}`);
  }

  return {
    status: 'ready_for_review',

    job,

    tailoring: tailoringResult.tailoring,

    model: tailoringResult.model,

    promptVersion: tailoringResult.promptVersion,

    validation,
  };
}

module.exports = {
  processJobApplication,
  loadMasterResume,
  MASTER_RESUME_PATH,
};
