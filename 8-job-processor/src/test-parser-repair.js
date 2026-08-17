const { parseJob } = require('./ai/parse-job');

const fakeResponses = [
  {
    title: 'Forward Deployed Engineer',
    company: 'AiStudio',
    location: 'null',
    employment_type: 'full-time',
    workplace_type: null,
    salary_original: '₹15L – ₹20L',
    salary_min: '1500000',
    salary_max: 2000000,
    salary_currency: 'INR',
    description: 'About AiStudio...',
    posted_at: null,
  },

  {
    title: 'Forward Deployed Engineer',
    company: 'AiStudio',
    location: null,
    employment_type: 'full-time',
    workplace_type: null,
    salary_original: '₹15L – ₹20L',
    salary_min: 1500000,
    salary_max: 2000000,
    salary_currency: 'INR',
    description: 'About AiStudio...',
    posted_at: null,
  },
];

let callCount = 0;

async function fakeOllama(prompt) {
  callCount++;

  console.log(`Ollama call #${callCount}`);

  if (callCount === 2) {
    console.log('Repair prompt received:', prompt.includes('VALIDATION ERRORS'));
  }

  return fakeResponses[callCount - 1];
}

async function main() {
  const rawText = `
Forward Deployed Engineer at AiStudio

₹15L – ₹20L

About AiStudio

AiStudio is an AI consultancy.

The Role:
Forward Deployed Engineer
`;

  const parsedJob = await parseJob(rawText, fakeOllama);

  console.log('\nFinal parsed job:\n');
  console.log(JSON.stringify(parsedJob, null, 2));

  console.log('\nTotal Ollama calls:', callCount);

  if (callCount !== 2) {
    throw new Error(`Expected 2 Ollama calls, got ${callCount}`);
  }

  if (parsedJob.location !== null) {
    throw new Error('Expected location to be null');
  }

  if (parsedJob.salary_min !== 1500000) {
    throw new Error('Expected salary_min to be a number');
  }

  console.log('\nREPAIR TEST PASSED');
}

main().catch((error) => {
  console.error('\nREPAIR TEST FAILED:');
  console.error(error);
  process.exit(1);
});
