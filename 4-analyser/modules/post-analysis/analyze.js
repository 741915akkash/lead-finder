const { generate } = require('../../services/ollama');
const { buildPrompt } = require('./prompt');

async function analyzePost(post) {
  const prompt = buildPrompt(post);

  const raw = await generate(prompt);

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON returned');
  }
}

module.exports = {
  analyzePost,
};
