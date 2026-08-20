const { analyzeJob } = require('./ai/analyze-job');
const { getValidationErrors } = require('./ai/validate-job-analysis');

const targetRole = `
I am looking for early-stage startup roles where I can work as
a full-stack/product engineer and take significant ownership.

Preferred work:
- Build MVPs and production features
- Full-stack JavaScript/Node.js
- Vue/Nuxt or similar frontend frameworks
- PostgreSQL
- AI/LLM integrations
- Work directly with founders
- Product + engineering ownership
- Early-stage startups

Not primarily looking for:
- Pure frontend roles
- Pure backend infrastructure roles
- QA/testing roles
- Highly specialized enterprise roles
- Roles with little product ownership
`;

const job = {
  title: 'Founding Full Stack Engineer',
  company: 'Vantrix Ventures',
  location: 'Bengaluru',
  employment_type: 'full-time',
  workplace_type: 'onsite',
  description: `
    Build core platform capabilities end-to-end.
    Work directly with the founder.
    Strong full stack engineering skills.
    Node.js, PostgreSQL and AI/LLM experience are valuable.
  `,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createValidResponse(overrides = {}) {
  return JSON.stringify({
    role: {
      label: 'direct',
      reason: 'The role is a founding full-stack engineering position.',
    },

    technology: {
      labels: ['Node.js', 'PostgreSQL', 'LLM APIs'],
      required: ['Node.js', 'PostgreSQL'],
      nice_to_have: ['LLM APIs'],
      reason: 'The job explicitly mentions Node.js, PostgreSQL and AI/LLM experience.',
    },

    company: {
      size_label: 'unknown',
      stage_label: 'early-stage',
      reason: 'The role is part of a founding team at an early-stage company.',
    },

    ...overrides,
  });
}

async function testValidResponse() {
  const mockResponse = createValidResponse();

  let calls = 0;

  const mockOllama = async () => {
    calls++;
    return mockResponse;
  };

  const result = await analyzeJob(job, targetRole, mockOllama);

  assert(calls === 1, 'Valid response should require only one Ollama call');

  assert(result.role.label === 'direct', 'Role should be direct');

  assert(!('work' in result), 'Work should not exist in the analysis contract');

  assert(!('score' in result.technology), 'Technology score must not be returned by AI');

  assert(result.technology.labels.includes('Node.js'), 'Technology labels should include Node.js');

  assert(result.technology.labels.includes('PostgreSQL'), 'Technology labels should include PostgreSQL');

  assert(result.technology.required.includes('Node.js'), 'Required technologies should include Node.js');

  assert(result.technology.required.includes('PostgreSQL'), 'Required technologies should include PostgreSQL');

  assert(result.technology.nice_to_have.includes('LLM APIs'), 'Nice-to-have technologies should include LLM APIs');

  assert(!('score' in result.company), 'Company score must not be returned by AI');

  assert(result.company.stage_label === 'early-stage', 'Company stage should be early-stage');

  console.log('✓ Valid response test passed');
}

async function testMalformedJsonRepair() {
  const validResponse = createValidResponse({
    role: {
      label: 'direct',
      reason: 'Full-stack engineering role.',
    },
  });

  let calls = 0;

  const mockOllama = async () => {
    calls++;

    if (calls === 1) {
      return '{"role":{"label":"direct"';
    }

    return validResponse;
  };

  const result = await analyzeJob(job, targetRole, mockOllama);

  assert(calls === 2, 'Malformed JSON should trigger exactly one repair call');

  assert(result.role.label === 'direct', 'Repair result should be returned');

  assert(result.technology.required.includes('Node.js'), 'Repair result should contain required technologies');

  console.log('✓ Malformed JSON repair test passed');
}

async function testValidationRepair() {
  const invalidResponse = JSON.stringify({
    role: {
      label: 'wrong',
      reason: 'Invalid role.',
    },

    technology: {
      labels: [],
      required: [],
      nice_to_have: [],
      reason: 'Invalid technology output.',
      score: 0.8,
    },

    company: {
      size_label: 'unknown',
      stage_label: 'unknown',
      reason: 'Valid company.',
      score: 0.8,
    },
  });

  const validResponse = createValidResponse({
    role: {
      label: 'adjacent',
      reason: 'Related engineering role.',
    },

    company: {
      size_label: '11-50',
      stage_label: 'seed',
      reason: 'Small startup.',
    },
  });

  let calls = 0;

  const mockOllama = async () => {
    calls++;

    if (calls === 1) {
      return invalidResponse;
    }

    return validResponse;
  };

  const result = await analyzeJob(job, targetRole, mockOllama);

  assert(calls === 2, 'Validation failure should trigger one repair call');

  assert(result.role.label === 'adjacent', 'Repaired role should be returned');

  assert(!('work' in result), 'Repaired response should not contain work');

  assert(!('score' in result.technology), 'Repaired response should not contain technology score');

  assert(!('score' in result.company), 'Repaired response should not contain company score');

  console.log('✓ Validation repair test passed');
}

async function testValidatorDirectly() {
  const invalid = {
    role: {
      label: 'invalid',
      reason: 'test',
    },
  };

  const errors = getValidationErrors(invalid);

  assert(errors.length > 0, 'Validator should detect invalid output');

  console.log('✓ Validator test passed');
}

async function testRejectsUndetectedTechnology() {
  const invalidResponse = JSON.stringify({
    role: {
      label: 'direct',
      reason: 'Full-stack engineering role.',
    },

    technology: {
      labels: ['Node.js', 'PostgreSQL', 'Next.js'],

      required: ['Node.js', 'PostgreSQL', 'Next.js'],

      nice_to_have: [],

      reason: 'Relevant technologies.',
    },

    company: {
      size_label: 'unknown',
      stage_label: 'early-stage',
      reason: 'Early-stage company.',
    },
  });

  const validResponse = createValidResponse();

  let calls = 0;

  const mockOllama = async () => {
    calls++;

    if (calls === 1) {
      return invalidResponse;
    }

    return validResponse;
  };

  const result = await analyzeJob(job, targetRole, mockOllama);

  assert(calls === 2, 'Undetected technology should trigger repair');

  assert(!result.technology.labels.includes('Next.js'), 'Repaired result must not contain undetected technology');

  console.log('✓ Undetected technology repair test passed');
}

async function testRejectsTechnologyInBothBuckets() {
  const invalid = {
    role: {
      label: 'direct',
      reason: 'Full-stack role.',
    },

    technology: {
      labels: ['Node.js', 'PostgreSQL'],
      required: ['Node.js'],
      nice_to_have: ['Node.js'],
      reason: 'Relevant technologies.',
    },

    company: {
      size_label: 'unknown',
      stage_label: 'early-stage',
      reason: 'Early-stage company.',
    },
  };

  const errors = getValidationErrors(invalid, ['Node.js', 'PostgreSQL']);

  assert(
    errors.some((error) => error.includes('both required and nice_to_have')),
    'Validator should reject technology appearing in both buckets',
  );

  console.log('✓ Duplicate technology bucket test passed');
}

async function testSecondFailure() {
  let calls = 0;

  const mockOllama = async () => {
    calls++;

    return '{"invalid": true}';
  };

  let failed = false;

  try {
    await analyzeJob(job, targetRole, mockOllama);
  } catch (error) {
    failed = true;
  }

  assert(failed, 'Analysis should fail after second invalid response');

  assert(calls === 2, 'Analysis should make maximum two Ollama calls');

  console.log('✓ Second failure test passed');
}

async function run() {
  await testValidResponse();
  await testMalformedJsonRepair();
  await testValidationRepair();
  await testValidatorDirectly();
  await testRejectsUndetectedTechnology();
  await testRejectsTechnologyInBothBuckets();
  await testSecondFailure();

  console.log('\n✓ All analyze-job tests passed');
}

run().catch((error) => {
  console.error('\n✗ Test failed');
  console.error(error);
  process.exit(1);
});
