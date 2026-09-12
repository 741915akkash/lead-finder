const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const { getValidationErrors } = require('./validate-parsed-job');

const promptPath = path.join(__dirname, 'prompt.txt');

function loadPrompt() {
  return fs.readFileSync(promptPath, 'utf8');
}

async function saveInvalidOllamaResponse(response, error, context = {}) {
  const dir = path.resolve(process.cwd(), 'logs', 'ollama-invalid');

  await fsp.mkdir(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${context.jobId ?? 'unknown'}.txt`;

  const content = [
    `Job ID: ${context.jobId ?? 'unknown'}`,
    `Posting ID: ${context.postingId ?? 'unknown'}`,
    `Stage: ${context.stage ?? 'unknown'}`,
    `Error: ${error.message}`,
    `Response length: ${response?.length ?? 0}`,
    '',
    '===== RAW OLLAMA RESPONSE =====',
    response ?? '',
    '',
    '===== END RESPONSE =====',
  ].join('\n');

  await fsp.writeFile(path.join(dir, filename), content, 'utf8');
}

async function callOllama(prompt) {
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaModel = process.env.OLLAMA_MODEL;

  if (!ollamaUrl) {
    throw new Error('OLLAMA_URL is not configured');
  }

  if (!ollamaModel) {
    throw new Error('OLLAMA_MODEL is not configured');
  }

  let response;

  try {
    response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        think: false,
        options: {
          num_ctx: Number(process.env.OLLAMA_NUM_CTX),
          num_predict: Number(process.env.OLLAMA_NUM_PREDICT),
        },
      }),
    });
  } catch (error) {
    const fetchError = new Error(`Ollama fetch failed: ${error.message}`);
    fetchError.code = 'OLLAMA_FETCH_FAILED';
    fetchError.temporary = true;

    throw fetchError;
  }

  if (!response.ok) {
    const errorText = await response.text();

    const error = new Error(`Ollama request failed (${response.status}): ${errorText}`);

    if (response.status >= 500) {
      error.code = 'OLLAMA_SERVER_ERROR';
      error.temporary = true;
    }

    throw error;
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error('Ollama returned an empty response');
  }

  return data.response;
}

function parseOllamaJson(response, context = {}) {
  try {
    return {
      parsed: JSON.parse(response),
      error: null,
    };
  } catch (error) {
    console.log('Parser returned invalid JSON:');
    console.log(`- ${error.message}`);

    saveInvalidOllamaResponse(response, error, context).catch((saveError) => {
      console.error('Failed to save invalid Ollama response:');
      console.error(saveError);
    });

    return {
      parsed: null,
      error: error.message,
    };
  }
}

function normalizeWorkplaceType(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (['remote', 'fully remote', 'work from home', 'wfh'].includes(normalized)) {
    return 'remote';
  }

  if (['hybrid', 'hybrid work', 'hybrid-working'].includes(normalized)) {
    return 'hybrid';
  }

  if (['onsite', 'on-site', 'on site', 'in-office', 'in office'].includes(normalized)) {
    return 'onsite';
  }

  /*
   * Ambiguous combinations must not be guessed.
   */
  if (normalized.includes(' or ')) {
    return normalized
      .split(/\s+or\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (normalized.includes('remote') && normalized.includes('hybrid')) {
    return null;
  }

  if (normalized.includes('onsite') && normalized.includes('hybrid')) {
    return null;
  }

  return value;
}

/*
 * Extract the original posting-date expression directly from
 * the raw job posting.
 *
 * IMPORTANT:
 *
 * This function deliberately looks for DATE CONTEXT rather than
 * simply looking for any date in the document.
 *
 * Job descriptions contain many unrelated dates:
 *
 *   - application deadlines
 *   - interview dates
 *   - start dates
 *   - years of experience
 *   - product/company history
 *   - dates mentioned in benefits
 *
 * Only dates associated with posting/listing/publication language
 * are considered posting dates.
 */
function extractPostedAtRaw(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  const text = rawText.replace(/\r\n/g, '\n');

  /*
   * Relative dates.
   *
   * Examples:
   *   Posted 6 days ago
   *   Posted 1 day ago
   *   Posted 3 hours ago
   *   Posted 20 minutes ago
   *   Posted yesterday
   *   Posted today
   *   Listed 4 days ago
   *   Published 2 weeks ago
   *   3 days ago
   *
   * The optional "about/approximately/over" wording is accepted,
   * but the returned value remains normalized to the useful
   * date expression.
   */
  const relativePatterns = [
    /\b(?:posted|listed|published|added|created)\s*:?\s*(?:(?:about|approximately|around|over)\s+)?(\d+\s+(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago)\b/i,

    /\b(?:posted|listed|published|added|created)\s*:?\s*(today|yesterday)\b/i,

    /\b(?:posted|listed|published|added)\s*:?\s*(\d+\+?\s+(?:day|days|week|weeks|month|months|year|years)\s+ago)\b/i,
  ];

  for (const pattern of relativePatterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  /*
   * Explicit dates associated with posting language.
   *
   * Examples:
   *   Posted: Aug 28, 2026
   *   Posted on August 28, 2026
   *   Posted August 28, 2026
   *   Published: September 1, 2026
   *   Date posted: 2026-08-28
   *   Job posted: 28 August 2026
   *
   * Keep the original date expression rather than converting it
   * here. resolvePostedAt() owns normalization.
   */
  const explicitPatterns = [
    /\b(?:date\s+posted|posting\s+date|posted\s+on|posted|job\s+posted|published\s+on|published|listed\s+on|listed)\s*:?\s*((?:\d{4}[-/]\d{1,2}[-/]\d{1,2})|(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})|(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}))\b/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  /*
   * Some sources use:
   *
   *   Date posted
   *   28 Aug 2026
   *
   * where the date is on the following line.
   */
  const multilineExplicitPatterns = [
    /\b(?:date\s+posted|posting\s+date|posted\s+on|job\s+posted|published\s+on|listed\s+on)\s*:?\s*\n\s*((?:\d{4}[-/]\d{1,2}[-/]\d{1,2})|(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})|(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}))\b/i,
  ];

  for (const pattern of multilineExplicitPatterns) {
    const match = text.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  /*
   * Do NOT return arbitrary dates.
   *
   * For example:
   *
   *   Apply by September 15, 2026
   *   Join us in October 2026
   *   Founded in 2018
   *
   * must not become posted_at_raw.
   */
  return null;
}

function normalizeParsedJob(job, rawText) {
  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return job;
  }

  const normalizedJob = {
    ...job,

    // Optional fields default to null when Ollama omits them.
    location: job.location ?? null,
    workplace_type: normalizeWorkplaceType(job.workplace_type),

    salary_original: job.salary_original ?? null,
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    salary_currency: job.salary_currency ?? null,

    posted_at_raw: job.posted_at_raw ?? null,
  };

  /*
   * Deterministic extraction is authoritative.
   *
   * If the raw posting contains a recognizable posting-date
   * expression, ALWAYS use it.
   *
   * This prevents the LLM from selecting an unrelated date
   * such as an application deadline or start date.
   *
   * If deterministic extraction cannot find one, preserve the
   * model's value as a fallback.
   */
  const extractedPostedAtRaw = extractPostedAtRaw(rawText);

  if (extractedPostedAtRaw) {
    normalizedJob.posted_at_raw = extractedPostedAtRaw;
  } else if (
    normalizedJob.posted_at_raw === undefined ||
    normalizedJob.posted_at_raw === null ||
    (typeof normalizedJob.posted_at_raw === 'string' && !normalizedJob.posted_at_raw.trim())
  ) {
    normalizedJob.posted_at_raw = null;
  }

  return normalizedJob;
}

async function parseJob(rawText, ollamaCaller = callOllama) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('rawText is required');
  }

  const systemPrompt = loadPrompt();

  // --------------------------------------------------
  // Attempt 1
  // --------------------------------------------------

  const prompt = `${systemPrompt}

Parse the following job posting.

<RAW_JOB_TEXT>
${rawText}
</RAW_JOB_TEXT>`;

  const firstResponse = await ollamaCaller(prompt);

  const firstResult = parseOllamaJson(firstResponse);

  let parsedJob = firstResult.parsed;
  let validationErrors = [];

  if (firstResult.error) {
    console.log('Parser returned invalid JSON:');
    console.log(`- ${firstResult.error}`);
  } else {
    parsedJob = normalizeParsedJob(parsedJob, rawText);

    validationErrors = getValidationErrors(parsedJob);

    if (validationErrors.length === 0) {
      return parsedJob;
    }

    console.log('Parser output failed validation:');

    for (const error of validationErrors) {
      console.log(`- ${error}`);
    }
  }

  // --------------------------------------------------
  // Attempt 2: repair
  // --------------------------------------------------

  let repairProblem;

  if (firstResult.error) {
    repairProblem = `JSON PARSE ERROR:
${firstResult.error}`;
  } else {
    repairProblem = `VALIDATION ERRORS:
${validationErrors.map((error) => `- ${error}`).join('\n')}`;
  }

  const previousOutput = firstResult.error ? firstResponse : JSON.stringify(parsedJob, null, 2);

  const repairPrompt = `${systemPrompt}

The previous parser attempt failed validation.p

Return a corrected, complete JSON object matching the schema above.

Rules:
- Return JSON only.
- Return every schema field.
- Do not add additional fields.
- Preserve valid information from the previous output.
- Fix the listed validation errors.
- Extract only information supported by the original job posting.
- Do not truncate the description.
- Unknown values must be JSON null, never the string "null".
- title must be a non-empty string.
- workplace_type may be "remote", "hybrid", "onsite", an array of these values, or null.
- posted_at_raw must contain only the original expression indicating when the job was posted/listed/published, or null.
- Do not use deadlines, closing dates, interview dates, start dates, founding dates, experience requirements, or unrelated dates for posted_at_raw.

VALIDATION ERRORS:
${repairProblem}

PREVIOUS OUTPUT:
${previousOutput}

ORIGINAL JOB POSTING:
<RAW_JOB_TEXT>
${rawText}
</RAW_JOB_TEXT>`;

  console.log('Attempting parser repair...');

  const secondResponse = await ollamaCaller(repairPrompt);

  const secondResult = parseOllamaJson(secondResponse);

  if (secondResult.error) {
    throw new Error(`Parser returned invalid JSON after repair: ${secondResult.error}`);
  }

  const repairedJob = normalizeParsedJob(secondResult.parsed, rawText);

  const repairErrors = getValidationErrors(repairedJob);

  if (repairErrors.length > 0) {
    throw new Error(`Parser output failed validation after repair:\n- ${repairErrors.join('\n- ')}`);
  }

  return repairedJob;
}

module.exports = {
  parseJob,
  callOllama,
  normalizeWorkplaceType,
  extractPostedAtRaw,
};
