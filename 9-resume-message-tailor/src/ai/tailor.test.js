const { buildTailoringPrompt } = require('./tailor-prompt');

function test(name, fn) {
  try {
    fn();

    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.message);

    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const masterResume = `
# Akash Saini

## Experience

### Go Launch Scall — Founder

- Built full-stack SaaS products using JavaScript, Node.js, Vue.js and PostgreSQL.
- Built AI systems using OpenAI and Ollama.

## Technologies

JavaScript, Node.js, Vue.js, PostgreSQL, MongoDB
`;

const job = {
  title: 'Full Stack Engineer',
  company: 'GreenChoice',
  description: `
Build web applications using React.js and React Native.
Build backend APIs using Node.js and Express.js.
Work with PostgreSQL.
`,
};

test('builds a tailoring prompt', () => {
  const prompt = buildTailoringPrompt({
    job,
    masterResume,
  });

  assert(prompt.includes(masterResume.trim()), 'Master resume was not included.');

  assert(prompt.includes(job.description.trim()), 'Job description was not included.');
});

test('instructs model not to invent technologies', () => {
  const prompt = buildTailoringPrompt({
    job,
    masterResume,
  });

  assert(
    prompt.includes('Do NOT add a technology merely because it appears'),
    'Technology anti-invention rule is missing.',
  );
});

test('allows relevant technologies from master resume', () => {
  const prompt = buildTailoringPrompt({
    job,
    masterResume,
  });

  assert(
    prompt.includes('The master resume represents technologies the candidate genuinely'),
    'Master technology rule is missing.',
  );
});

test('requires markdown output', () => {
  const prompt = buildTailoringPrompt({
    job,
    masterResume,
  });

  assert(prompt.includes('Return ONLY the tailored resume in Markdown.'), 'Markdown output instruction is missing.');
});
