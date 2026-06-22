const axios = require('axios');

async function run() {
  const prompt = `
You are a lead qualification system for an AI automation agency.

Score this Reddit post from 0-100.

Scoring:

100 = Business owner with expensive problem and likely budget

80 = Strong business problem, likely needs software or automation

60 = Interesting problem but unclear buyer

40 = Mild inconvenience

0 = Not a lead

Return ONLY valid JSON.

{
  "score": 0,
  "reason": ""
}

Reddit Post:

Title:
I spend 15 hours every week manually updating spreadsheets and moving data between systems.
`;

  const response = await axios.post('http://127.0.0.1:11434/api/generate', {
    model: 'qwen3:4b',
    prompt,
    stream: false,
    format: 'json',
    think: false,
    options: {
      temperature: 0,
    },
  });

  console.log(response.data.response);

  try {
    const result = JSON.parse(response.data.response);

    console.log('\nParsed:');
    console.log(result);
  } catch (err) {
    console.error('Invalid JSON');
  }
}

run();
