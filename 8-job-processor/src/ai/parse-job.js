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

  const response = await fetch(`${ollamaUrl}/api/generate`, {
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

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
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

async function parseJob(rawText, ollamaCaller = callOllama) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('rawText is required');
  }

  const systemPrompt = loadPrompt();

  // --------------------------------------------------
  // Attempt 1
  // --------------------------------------------------

  const prompt = `${systemPrompt}

Parse the following job posting:

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

For posted_at_raw, return the original posting-date expression as a string, or JSON null if there is no posting date.

Do not calculate or convert posted_at_raw.

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

  const repairedJob = secondResult.parsed;

  const repairErrors = getValidationErrors(repairedJob);

  if (repairErrors.length > 0) {
    throw new Error(`Parser output failed validation after repair:\n- ${repairErrors.join('\n- ')}`);
  }

  return repairedJob;
}

module.exports = {
  parseJob,
  callOllama,
};
