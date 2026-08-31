require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

const { buildTailoringPrompt } = require('./ai/tailor-prompt');
const { callOllama } = require('./ai/tailor');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

const TEST_JOB_ID = 106;

const MODELS = ['llama3.2:3b'];

const NUM_CTX = 4096;
const NUM_PREDICT = 700;
const TIMEOUT_MS = 240000;

const MASTER_RESUME_PATH = path.join(__dirname, 'master-resume', 'master-resume.md');

const OUTPUT_DIR = path.join(__dirname, '..', 'test-results');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function printHeader(title) {
  console.log('');
  console.log('='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
}

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

async function fetchJob() {
  const result = await supabase.from('job_postings').select('*').eq('id', TEST_JOB_ID).single();

  if (result.error) {
    throw new Error('Failed to fetch job ' + TEST_JOB_ID + ': ' + result.error.message);
  }

  if (!result.data) {
    throw new Error('Job ' + TEST_JOB_ID + ' was not found.');
  }

  return result.data;
}

function printJob(job) {
  console.log('');
  console.log('Company:      ' + (job.company || 'Unknown'));

  console.log('Title:        ' + (job.title || 'Unknown'));

  console.log('Fit score:    ' + (job.fit_score != null ? job.fit_score : 'n/a'));

  console.log('Description:  ' + (job.description ? job.description.length : 0) + ' chars');

  if (job.technology_labels) {
    console.log('Technologies: ' + JSON.stringify(job.technology_labels));
  }
}

function getFitAnalysis(job) {
  return {
    fit_score: job.fit_score,
    technology_score: job.technology_score,
    company_score: job.company_score,
    salary_score: job.salary_score,
    ai_reason: job.ai_reason,
    technology_labels: job.technology_labels,
  };
}

async function runModel(model, prompt) {
  const startedAt = Date.now();

  console.log('');
  console.log('-'.repeat(80));
  console.log('MODEL: ' + model);
  console.log('-'.repeat(80));

  console.log('[ollama] model=' + model);

  console.log('[ollama] context=' + NUM_CTX);

  console.log('[ollama] num_predict=' + NUM_PREDICT);

  console.log('[ollama] prompt_chars=' + prompt.length);

  console.log('[ollama] sending request...');

  try {
    const tailoredResume = await callOllama({
      prompt,
      model,
      ollamaUrl: OLLAMA_URL,
      timeoutMs: TIMEOUT_MS,
      numPredict: NUM_PREDICT,
    });

    const elapsed = Date.now() - startedAt;

    if (!tailoredResume) {
      throw new Error('Model returned an empty resume.');
    }

    return {
      success: true,
      elapsed,
      tailoredResume,
    };
  } catch (error) {
    return {
      success: false,
      elapsed: Date.now() - startedAt,
      error: error.message,
    };
  }
}

function saveTailoredResume(job, model, tailoredResume) {
  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });

  const safeModel = model.replace(/[^a-zA-Z0-9._-]/g, '-');

  const outputPath = path.join(OUTPUT_DIR, `job-${job.id}-${safeModel}-tailored-resume.md`);

  fs.writeFileSync(outputPath, tailoredResume.trim() + '\n', 'utf8');

  return outputPath;
}

function printResult(result) {
  console.log('');

  console.log('STATUS: ' + (result.success ? 'SUCCESS' : 'FAILED'));

  console.log('TIME: ' + (result.elapsed / 1000).toFixed(1) + 's');

  if (!result.success) {
    console.log('ERROR: ' + result.error);

    return;
  }

  console.log('');
  console.log('TAILORED RESUME');
  console.log('');
  console.log('='.repeat(80));
  console.log(result.tailoredResume);
  console.log('='.repeat(80));
}

async function main() {
  printHeader('9-resume-message-tailor — MODEL BENCHMARK');

  console.log('Job ID:       ' + TEST_JOB_ID);

  console.log('Context:      ' + NUM_CTX);

  console.log('Max output:   ' + NUM_PREDICT);

  console.log('Models:       ' + MODELS.join(', '));

  console.log('');
  console.log('Architecture:');

  console.log('master-resume.md + job description → tailored-resume.md');

  console.log('');
  console.log('READ-ONLY: no Supabase changes will be made.');

  printHeader('LOADING MASTER RESUME');

  const masterResume = loadMasterResume();

  console.log('Path:         ' + MASTER_RESUME_PATH);

  console.log('Characters:   ' + masterResume.length);

  printHeader('FETCHING REAL JOB');

  const job = await fetchJob();

  printJob(job);

  const fitAnalysis = getFitAnalysis(job);

  printHeader('BUILDING PROMPT');

  const prompt = buildTailoringPrompt({
    job,
    masterResume,
    fitAnalysis,
  });

  console.log('Prompt chars: ' + prompt.length);

  console.log('');
  console.log('Input sources:');

  console.log('1. src/master-resume/master-resume.md');

  console.log('2. job description');

  printHeader('RUNNING MODELS SEQUENTIALLY');

  const results = [];

  for (const model of MODELS) {
    const result = await runModel(model, prompt);

    results.push({
      model,
      ...result,
    });

    printResult(result);

    if (result.success) {
      const outputPath = saveTailoredResume(job, model, result.tailoredResume);

      results[results.length - 1].outputPath = outputPath;

      console.log('');
      console.log('Saved: ' + outputPath);
    }
  }

  printHeader('FINAL MODEL COMPARISON');

  console.log('MODEL                 STATUS    TIME');

  console.log('-'.repeat(80));

  for (const result of results) {
    console.log(
      result.model.padEnd(21) +
        ' ' +
        (result.success ? 'PASS' : 'FAIL').padEnd(9) +
        ' ' +
        (result.elapsed / 1000).toFixed(1) +
        's',
    );
  }

  printHeader('BENCHMARK COMPLETE');

  console.log('No changes were written to Supabase.');

  console.log('Tailored resumes were written to:');

  console.log(OUTPUT_DIR);
}

main().catch(function (error) {
  console.error('');
  console.error('FATAL ERROR:');
  console.error(error.message);

  if (process.env.DEBUG) {
    console.error(error.stack);
  }

  process.exit(1);
});
