require('dotenv').config();

const { TAILORING_PROMPT_VERSION, buildTailoringPrompt } = require('./tailor-prompt');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 50000;

const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 1200;

/**
 * Call the Google Gemini API.
 *
 * Uses the Gemini Developer API directly through fetch so no
 * additional SDK dependency is required.
 */
async function callGemini({
  prompt,
  model = DEFAULT_MODEL,
  apiKey = DEFAULT_GEMINI_API_KEY,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
}) {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }

  if (!prompt) {
    throw new Error('Missing Gemini prompt.');
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  console.log(`[gemini] model=${model}`);
  console.log(`[gemini] prompt_chars=${prompt.length}`);
  console.log(`[gemini] max_output_tokens=${maxOutputTokens}`);
  console.log('[gemini] thinking=false');
  console.log('[gemini] sending request...');

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const startedAt = Date.now();

  try {
    let response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.1,
            maxOutputTokens,
          },
        }),

        signal: controller.signal,
      });
    } catch (error) {
      const elapsed = Date.now() - startedAt;

      if (error.name === 'AbortError') {
        throw new Error(
          `Gemini request timed out after ${timeoutMs}ms ` +
            `(elapsed=${elapsed}ms, model=${model}, ` +
            `prompt_chars=${prompt.length}).`,
        );
      }

      throw new Error(
        `Gemini connection failed after ${elapsed}ms: ` +
          `${error.message} ` +
          `(model=${model}, prompt_chars=${prompt.length})`,
      );
    }

    const elapsed = Date.now() - startedAt;

    console.log(`[gemini] HTTP ${response.status} after ${elapsed}ms`);

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Gemini returned HTTP ${response.status}: ${body}`);
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch (error) {
      throw new Error(`Gemini returned invalid JSON: ${error.message}\n\n` + `Response:\n${body}`);
    }

    const candidate = data?.candidates?.[0];

    const parts = candidate?.content?.parts || [];

    const text = parts
      .map((part) => part?.text || '')
      .join('')
      .trim();

    if (!text) {
      throw new Error(
        'Gemini response did not contain generated text.\n\n' + `Response:\n${JSON.stringify(data, null, 2)}`,
      );
    }

    console.log('[gemini] generation complete');
    console.log(`[gemini] response_chars=${text.length}`);

    if (data?.usageMetadata?.promptTokenCount != null) {
      console.log(`[gemini] prompt_tokens=${data.usageMetadata.promptTokenCount}`);
    }

    if (data?.usageMetadata?.candidatesTokenCount != null) {
      console.log(`[gemini] output_tokens=${data.usageMetadata.candidatesTokenCount}`);
    }

    if (candidate?.finishReason) {
      console.log(`[gemini] finish_reason=${candidate.finishReason}`);
    }

    console.log('\n[gemini] RAW RESPONSE START');
    console.log(text);
    console.log('[gemini] RAW RESPONSE END\n');

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tailor the master resume for one job.
 */
async function tailorResume({
  job,
  masterResume,
  model = DEFAULT_MODEL,
  apiKey = DEFAULT_GEMINI_API_KEY,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
}) {
  if (!job) {
    throw new Error('Missing job.');
  }

  if (!masterResume) {
    throw new Error('Missing master resume.');
  }

  const prompt = buildTailoringPrompt({
    job,
    masterResume,
  });

  console.log(`[tailor] job=${job.id || 'unknown'} ` + `${job.company || ''} — ${job.title || ''}`);

  console.log(`[tailor] prompt_chars=${prompt.length}`);

  const tailoredResume = await callGemini({
    prompt,
    model,
    apiKey,
    timeoutMs,
    maxOutputTokens,
  });

  if (!tailoredResume) {
    throw new Error('Tailoring model returned an empty resume.');
  }

  return {
    model,

    promptVersion: TAILORING_PROMPT_VERSION,

    tailoring: tailoredResume,
  };
}

module.exports = {
  DEFAULT_MODEL,
  DEFAULT_GEMINI_API_KEY,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_OUTPUT_TOKENS,
  tailorResume,
  callGemini,
};
