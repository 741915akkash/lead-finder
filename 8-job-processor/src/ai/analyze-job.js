const { buildAnalyzePrompt } = require('./analyze-prompt');
const { getValidationErrors } = require('./validate-job-analysis');
const { extractTechnologies } = require('./extract-technologies');

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

async function callOllama(prompt) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      think: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP error: ${response.status}`);
  }

  const data = await response.json();

  return data.response;
}

async function analyzeJob(job, targetRole, ollamaCaller = callOllama) {
  /*
   * Technology extraction is deterministic.
   *
   * Qwen does NOT discover technologies.
   * Qwen only classifies the technologies we already detected.
   */
  const detectedTechnologies = extractTechnologies(job.description ?? '');

  const prompt = buildAnalyzePrompt({
    targetRole,
    job,
    detectedTechnologies,
  });

  let previousOutput = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let rawOutput;

    if (attempt === 1) {
      rawOutput = await ollamaCaller(prompt);
    } else {
      const repairPrompt = `
The previous job analysis was invalid.

Fix it and return ONLY valid JSON matching the required schema.

Do not explain what was wrong.
Do not discuss the previous response.
Do not add markdown.
Do not invent information.

IMPORTANT TECHNOLOGY RULE:

The following technologies were deterministically detected in the job description:

${JSON.stringify(detectedTechnologies)}

You MUST only use technologies from this list.

You MUST NOT invent technologies.

Every technology in:
- technology.labels
- technology.required
- technology.nice_to_have

must come from the detected technology list.

A technology may belong to only one of:
- required
- nice_to_have

TARGET ROLE:
${targetRole}

JOB:
Title: ${job.title ?? null}
Company: ${job.company ?? null}
Location: ${job.location ?? null}
Employment Type: ${job.employment_type ?? null}
Workplace Type: ${job.workplace_type ?? null}

DESCRIPTION:
${job.description ?? null}

PREVIOUS OUTPUT:
${previousOutput}

Return ONLY the corrected JSON.
`;

      rawOutput = await ollamaCaller(repairPrompt);
    }

    previousOutput = rawOutput;

    let parsed;

    try {
      parsed = JSON.parse(rawOutput);
    } catch (error) {
      if (attempt === 2) {
        throw new Error(`Job analysis returned malformed JSON after 2 attempts: ${error.message}`);
      }

      continue;
    }

    const errors = getValidationErrors(parsed, detectedTechnologies);

    if (errors.length === 0) {
      return parsed;
    }

    if (attempt === 2) {
      throw new Error(`Job analysis validation failed after 2 attempts: ${errors.join('; ')}`);
    }
  }

  throw new Error('Job analysis failed');
}

module.exports = {
  analyzeJob,
  callOllama,
};
