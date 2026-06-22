const axios = require('axios');

console.log('Starting...');

async function run() {
  try {
    console.log('Sending request...');

    const response = await axios.post(
      'http://127.0.0.1:11434/api/generate',
      {
        model: 'qwen3:4b',
        prompt: 'say hello',
        stream: false,
      },
      {
        timeout: 30000,
      },
    );

    console.log('Got response');
    console.log(response.data);
  } catch (err) {
    console.error('ERROR:');
    console.error(err.message);
  }
}

run();
