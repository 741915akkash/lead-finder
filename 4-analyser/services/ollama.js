const settings = require('../config/settings');

async function generate(prompt) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.ollamaModel,
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();

  return data.response;
}

module.exports = {
  generate,
};
