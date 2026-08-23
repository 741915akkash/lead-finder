const fs = require('fs');
const path = require('path');

/*
 * ============================================================
 * TECHNOLOGY GATE TEST
 * ============================================================
 *
 * Automatically:
 *
 * 1. Reads every JSON file in test-results/
 * 2. Finds model-analysis result files
 * 3. Applies the deterministic technology gate
 * 4. Writes a new result file into test-results/
 *
 * It does NOT call Ollama.
 *
 * Run:
 *
 *   node src/ai/test-technology-gate.js
 *
 *
 * Example:
 *
 * test-results/
 *
 *   technology-test-qwen3-4b.json
 *   technology-test-qwen3-8b.json
 *
 * becomes:
 *
 *   technology-gate-qwen3-4b.json
 *   technology-gate-qwen3-8b.json
 *
 * Original files are never modified.
 */

/*
 * ============================================================
 * DIRECTORIES
 * ============================================================
 */

const TEST_RESULTS_DIR = path.join(__dirname, '../../test-results');

/*
 * ============================================================
 * TECHNOLOGY POLICY
 * ============================================================
 */

/*
 * Technologies you are already familiar with.
 */

const FAMILIAR = new Set([
  'JavaScript',
  'Node.js',
  'Express.js',
  'REST APIs',

  'Vue.js',
  'Nuxt.js',

  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Supabase',

  'Docker',
  'AWS',
  'Railway',
  'Vercel',

  'Git',
  'GitHub',
  'GitHub Actions',
  'Linux',

  'OpenAI API',
  'Ollama',
  'LLM APIs',
  'RAG',
  'Vector databases',
  'pgvector',
  'AI agents',
  'Embeddings',

  'MEVN',
  'PERN',
  'Nuxt + Node.js',
]);

/*
 * Technologies you are willing to learn quickly.
 *
 * Keep this empty until you explicitly decide what belongs
 * here.
 */

const LEARN_QUICKLY = new Set([
  'React',
  'Next.js',
  'TypeScript',
  'Redis',
  'Prisma',
  'Drizzle ORM',
  'GraphQL',
  'NestJS',
  'Jest',
  'Playwright',
  'WebSockets',
  'Socket.IO',
]);

/*
 * Technologies you explicitly do NOT want to learn.
 *
 * If one of these is REQUIRED by the job,
 * the technology gate rejects the job.
 */

const EXCLUDED = new Set([
  'Angular',
  'AngularJS',

  'Python',
  'FastAPI',

  'Django',
  'Flask',

  'Ruby',
  'Rails',

  'Java',
  'Spring',

  'C#',
  '.NET',
  'ASP.NET',

  'Go',
  'Golang',

  'Rust',

  'PHP',
  'Laravel',
]);

/*
 * ============================================================
 * CLASSIFY TECHNOLOGY
 * ============================================================
 */

function classifyTechnology(technology) {
  if (FAMILIAR.has(technology)) {
    return 'familiar';
  }

  if (LEARN_QUICKLY.has(technology)) {
    return 'learn_quickly';
  }

  if (EXCLUDED.has(technology)) {
    return 'excluded';
  }

  return 'unknown';
}

/*
 * ============================================================
 * EVALUATE GATE
 * ============================================================
 */

function evaluateGate(required = []) {
  const classifications = required.map((technology) => ({
    technology,
    classification: classifyTechnology(technology),
  }));

  const familiar = classifications.filter((item) => item.classification === 'familiar').map((item) => item.technology);

  const learnQuickly = classifications
    .filter((item) => item.classification === 'learn_quickly')
    .map((item) => item.technology);

  const excluded = classifications.filter((item) => item.classification === 'excluded').map((item) => item.technology);

  const unknown = classifications.filter((item) => item.classification === 'unknown').map((item) => item.technology);

  /*
   * Gate logic:
   *
   * EXCLUDED required technology
   *        ↓
   *      REJECT
   *
   * UNKNOWN required technology
   *        ↓
   *      REVIEW
   *
   * Everything else
   *        ↓
   *      PASS
   */

  let decision;
  let reason;

  if (excluded.length > 0) {
    decision = 'REJECT';

    reason = `Excluded technology required: ${excluded.join(', ')}`;
  } else if (unknown.length > 0) {
    decision = 'REVIEW';

    reason = `Required technology not classified: ${unknown.join(', ')}`;
  } else {
    decision = 'PASS';

    reason = 'All required technologies are familiar or learn-quickly.';
  }

  return {
    decision,
    reason,

    required,

    familiar,

    learn_quickly: learnQuickly,

    excluded,

    unknown,

    classifications,
  };
}

/*
 * ============================================================
 * LOAD JSON
 * ============================================================
 */

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/*
 * ============================================================
 * PROCESS ONE MODEL RESULT FILE
 * ============================================================
 */

function processResultFile(filePath) {
  const data = loadJson(filePath);

  const jobs = [];

  let pass = 0;
  let reject = 0;
  let review = 0;
  let skipped = 0;

  for (const result of data.results || []) {
    const analysis = result.analysis;

    /*
     * If the model failed to analyze the job,
     * don't try to invent a technology decision.
     */

    if (!analysis) {
      jobs.push({
        job_id: result.job_id,
        title: result.title,
        company: result.company,

        decision: 'SKIP',

        reason: 'Model analysis failed',

        required: [],

        familiar: [],
        learn_quickly: [],
        excluded: [],
        unknown: [],
        classifications: [],
      });

      skipped++;

      continue;
    }

    const required = analysis.technology?.required || [];

    const gate = evaluateGate(required);

    if (gate.decision === 'PASS') {
      pass++;
    }

    if (gate.decision === 'REJECT') {
      reject++;
    }

    if (gate.decision === 'REVIEW') {
      review++;
    }

    jobs.push({
      job_id: result.job_id,

      title: result.title,

      company: result.company,

      decision: gate.decision,

      reason: gate.reason,

      required: gate.required,

      familiar: gate.familiar,

      learn_quickly: gate.learn_quickly,

      excluded: gate.excluded,

      unknown: gate.unknown,

      classifications: gate.classifications,
    });
  }

  /*
   * Output filename
   *
   * technology-test-qwen3-4b.json
   *
   * becomes
   *
   * technology-gate-qwen3-4b.json
   */

  const originalName = path.basename(filePath, '.json');

  const outputName = originalName.replace(/^technology-test-/, 'technology-gate-');

  /*
   * If the input doesn't start with
   * technology-test-, still create a
   * separate gate file.
   */

  const finalOutputName = outputName === originalName ? `technology-gate-${originalName}.json` : outputName;

  const outputPath = path.join(TEST_RESULTS_DIR, finalOutputName);

  const output = {
    generated_at: new Date().toISOString(),

    source_file: path.basename(filePath),

    model: data.model || 'unknown',

    target_role_version: data.target_role_version || null,

    job_count: data.job_count || jobs.length,

    summary: {
      pass,
      reject,
      review,
      skipped,
    },

    policy: {
      familiar: [...FAMILIAR].sort(),

      learn_quickly: [...LEARN_QUICKLY].sort(),

      excluded: [...EXCLUDED].sort(),
    },

    jobs,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  return {
    input: path.basename(filePath),

    output: path.basename(outputPath),

    model: data.model || 'unknown',

    summary: {
      pass,
      reject,
      review,
      skipped,
    },
  };
}

/*
 * ============================================================
 * FIND MODEL RESULT FILES
 * ============================================================
 */

function getResultFiles() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, {
      recursive: true,
    });

    return [];
  }

  return (
    fs
      .readdirSync(TEST_RESULTS_DIR)
      .filter((filename) => filename.endsWith('.json'))
      /*
       * Only process model test results.
       *
       * This prevents this script from reading
       * its own output files.
       */
      .filter((filename) => filename.startsWith('technology-test-'))
      .map((filename) => path.join(TEST_RESULTS_DIR, filename))
  );
}

/*
 * ============================================================
 * MAIN
 * ============================================================
 */

console.log('======================================');
console.log('TECHNOLOGY GATE TEST');
console.log('======================================');
console.log('');

const files = getResultFiles();

if (!files.length) {
  console.log('No technology-test-*.json files found.');

  console.log('');
  console.log(`Directory: ${TEST_RESULTS_DIR}`);

  process.exit(0);
}

console.log(`Found ${files.length} model result file(s).`);

console.log('');

const summaries = [];

for (const filePath of files) {
  try {
    const summary = processResultFile(filePath);

    summaries.push(summary);

    console.log(`✓ ${summary.input}`);

    console.log(`  Model: ${summary.model}`);

    console.log(`  PASS: ${summary.summary.pass}`);

    console.log(`  REJECT: ${summary.summary.reject}`);

    console.log(`  REVIEW: ${summary.summary.review}`);

    console.log(`  SKIP: ${summary.summary.skipped}`);

    console.log(`  → ${summary.output}`);

    console.log('');
  } catch (error) {
    console.error(`✗ ${path.basename(filePath)}`);

    console.error(`  ${error.message}`);

    console.log('');
  }
}

console.log('======================================');
console.log('TEST COMPLETE');
console.log('======================================');
console.log('');

console.log(`Processed: ${summaries.length}`);

console.log('');

console.log(`Results written to: ${TEST_RESULTS_DIR}`);

console.log('');
