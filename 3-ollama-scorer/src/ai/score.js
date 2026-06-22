require('dotenv').config();

const axios = require('axios');

async function scoreLead(post) {
  const prompt = `
You are a lead qualification system for an AI automation agency.

Score this Reddit post from 0-100.

100 = Business owner with painful expensive problem.

80 = Strong business problem, likely needs automation.

60 = Interesting problem but unclear buyer.

40 = Mild inconvenience.

0 = Not a lead.

Return ONLY valid JSON.

{
  "score": 0,
  "reason": ""
}

Title:
${post.title}

Subreddit:
${post.subreddit}
`;

  const response = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
    model: process.env.OLLAMA_MODEL,
    prompt,
    stream: false,
    format: 'json',
    think: false,
    options: {
      temperature: 0,
    },
  });

  try {
    return JSON.parse(response.data.response);
  } catch {
    return {
      score: 0,
      reason: 'invalid ai response',
    };
  }
}

module.exports = {
  scoreLead,
};
