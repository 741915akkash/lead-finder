const fs = require('fs');
const path = require('path');

const { getValidationErrors } = require('./validate-parsed-job');

const promptPath = path.join(__dirname, 'prompt.txt');

function loadPrompt() {
  return fs.readFileSync(promptPath, 'utf8');
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

function parseOllamaJson(response) {
  try {
    return {
      parsed: JSON.parse(response),
      error: null,
    };
  } catch (error) {
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
   *
   * Example:
   * "onsite or remote"
   * "remote or onsite"
   * "remote/onsite"
   *
   * If the posting does not establish one specific workplace type,
   * store null.
   */
  if (normalized.includes('remote') && normalized.includes('onsite')) {
    return null;
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
 * Examples:
 *   "Posted 6 days ago"     → "6 days ago"
 *   "Posted yesterday"      → "yesterday"
 *   "Posted today"          → "today"
 *   "Posted 2 weeks ago"    → "2 weeks ago"
 *
 * This is deterministic and avoids asking the LLM to repair
 * a simple field that can be extracted directly from the source.
 */
function extractPostedAtRaw(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  const patterns = [
    /\bPosted\s+((?:\d+\s+)?(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago)\b/i,
    /\bPosted\s+(today|yesterday)\b/i,
  ];

  for (const pattern of patterns) {
    const match = rawText.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function normalizeParsedJob(job, rawText) {
  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return job;
  }

  const normalizedJob = {
    ...job,
    workplace_type: normalizeWorkplaceType(job.workplace_type),
  };

  /*
   * posted_at_raw is deterministic when the source contains
   * an explicit "Posted ..." expression.
   *
   * Use the model's value when it exists.
   * If the model omitted it, recover it from the raw posting.
   * If neither exists, keep it as null.
   */
  if (
    normalizedJob.posted_at_raw === undefined ||
    normalizedJob.posted_at_raw === null ||
    (typeof normalizedJob.posted_at_raw === 'string' && !normalizedJob.posted_at_raw.trim())
  ) {
    normalizedJob.posted_at_raw = extractPostedAtRaw(rawText);
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

IMPORTANT PARSING RULES:

- "title" is REQUIRED.
- "title" must be a non-empty string.
- Never return null for "title".
- Never return an empty string for "title".
- workplace_type must be exactly one of:
  - "remote"
  - "hybrid"
  - "onsite"
  - null
- Never combine workplace types.
- Never return values such as "onsite or remote", "remote or onsite", "remote/onsite", or "onsite/remote".
- If the posting does not establish one specific workplace type, return null.
- Do not guess.
- posted_at_raw should contain the original posting-date expression exactly as it appears in the job posting, such as "6 days ago", "yesterday", or "today".
- If there is no posting date, return null for posted_at_raw.

<RAW_JOB_TEXT>
${rawText}
</RAW_JOB_TEXT>`;

  const firstResponse = await ollamaCaller(prompt);

  const firstResult = parseOllamaJson(firstResponse);

  let parsedJob = firstResult.parsed;
  let validationErrors = [];

  // JSON parsing failed
  if (firstResult.error) {
    console.log('Parser returned invalid JSON:');
    console.log(`- ${firstResult.error}`);
  } else {
    parsedJob = normalizeParsedJob(parsedJob, rawText);

    // JSON parsed successfully, now validate it
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

The previous parser attempt failed.

You must now produce the corrected JSON object.

IMPORTANT:

- Return JSON only.
- Do not write explanations.
- Do not discuss the previous output.
- Do not say that you need to recheck the job.
- Do not describe what you changed.
- Do not apologize.
- Do not continue the conversation.
- Do not add commentary before or after the JSON.
- Return the complete JSON object specified by the schema.
- Do not add additional fields.
- Do not truncate the description.
- Extract only information supported by the original job posting.

TITLE RULE:

- "title" is REQUIRED.
- "title" must be a non-empty string.
- Never return null for "title".
- Never return an empty string for "title".

WORKPLACE TYPE RULE:

- workplace_type must be exactly one of:
  "remote"
  "hybrid"
  "onsite"
  null
- Never combine values.
- Never return "onsite or remote".
- Never return "remote or onsite".
- Never return "remote/onsite".
- Never return "onsite/remote".
- If the posting does not establish one specific workplace type, return null.
- Do not guess.

POSTING DATE RULE:

- posted_at_raw should contain the original posting-date expression from the job posting.
- Examples: "6 days ago", "yesterday", "today".
- If there is no posting date, return null.
- Do not calculate or convert posted_at_raw.

NULL VALUES ARE JSON VALUES, NOT STRINGS.

Correct:
"location": null

Incorrect:
"location": "null"

Correct:
"employment_type": null

Incorrect:
"employment_type": "null"

Correct:
"workplace_type": null

Incorrect:
"workplace_type": "null"

Correct:
"posted_at_raw": null

Incorrect:
"posted_at_raw": "null"

For enum fields such as employment_type and workplace_type, use JSON null when unknown.

The description must contain only substantive job-posting content.
Do not mention parsing, truncation, previous responses, or this repair process inside the description.

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
