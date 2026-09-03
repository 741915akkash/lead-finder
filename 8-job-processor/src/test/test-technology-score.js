const {
  calculateTechnologyScore,
  calculateBucketScore,
  getFamiliarity,
  getTechnologyLabel,
  REQUIRED_WEIGHT,
  NICE_TO_HAVE_WEIGHT,
} = require('../ai/technology-score');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertApprox(actual, expected, message, tolerance = 0.000001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

console.log('Testing technology score...\n');

// --------------------------------------------------
// Constants
// --------------------------------------------------

test('Required technologies have 70% weight', () => {
  assertEqual(REQUIRED_WEIGHT, 0.7, 'Required technology weight should be 0.7');
});

test('Nice-to-have technologies have 30% weight', () => {
  assertEqual(NICE_TO_HAVE_WEIGHT, 0.3, 'Nice-to-have technology weight should be 0.3');
});

// --------------------------------------------------
// Familiarity
// --------------------------------------------------

test('Core technology is fully familiar', () => {
  assertEqual(getFamiliarity('Node.js'), 1, 'Node.js should have familiarity 1');
});

test('AI technology is highly familiar', () => {
  assertEqual(getFamiliarity('LLM APIs'), 0.9, 'LLM APIs should have familiarity 0.9');
});

test('Unknown technology is unfamiliar', () => {
  assertEqual(getFamiliarity('Java'), 0, 'Java should have familiarity 0');
});

test('Technology matching is case insensitive', () => {
  assertEqual(getFamiliarity('POSTGRESQL'), 1, 'PostgreSQL matching should be case insensitive');
});

test('Familiar stack is fully familiar', () => {
  assertEqual(getFamiliarity('MERN'), 1, 'MERN should have familiarity 1');
});

// --------------------------------------------------
// Bucket scoring
// --------------------------------------------------

test('Required bucket calculates average familiarity', () => {
  const score = calculateBucketScore(['Node.js', 'PostgreSQL', 'React']);

  assertApprox(score, 2 / 3, 'Required bucket should average technology familiarity');
});

test('Empty bucket returns null', () => {
  assertEqual(calculateBucketScore([]), null, 'Empty bucket should return null');
});

// --------------------------------------------------
// 70 / 30 scoring
// --------------------------------------------------

test('All familiar required technologies score 1', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js', 'PostgreSQL', 'Docker'],
    nice_to_have: [],
  });

  assertApprox(result.score, 1, 'All familiar required technologies should score 1');

  assertEqual(result.label, 'highly_familiar', 'Expected highly_familiar label');
});

test('All unfamiliar required technologies score 0', () => {
  const result = calculateTechnologyScore({
    required: ['React', 'Python', 'FastAPI'],
    nice_to_have: [],
  });

  assertApprox(result.score, 0, 'All unfamiliar required technologies should score 0');

  assertEqual(result.label, 'unfamiliar', 'Expected unfamiliar label');
});

test('Two familiar and one unfamiliar required technology', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js', 'PostgreSQL', 'React'],
    nice_to_have: [],
  });

  assertApprox(result.score, 2 / 3, 'Expected two familiar technologies out of three');

  assertEqual(result.label, 'mixed', 'Expected mixed label');
});

test('Required bucket dominates nice-to-have bucket', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js'],
    nice_to_have: ['React'],
  });

  assertApprox(result.score, 0.7, 'Familiar required technology should receive 70% weight');

  assertEqual(result.label, 'strong_familiarity', 'Expected strong_familiarity at 0.7');
});

test('Familiar nice-to-have technologies contribute 30%', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js'],
    nice_to_have: ['Docker'],
  });

  assertApprox(result.score, 1, 'Both buckets fully familiar should score 1');
});

test('Unfamiliar nice-to-have technologies do not heavily penalize a familiar required stack', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js', 'PostgreSQL'],
    nice_to_have: ['React', 'Python', 'FastAPI', 'Kubernetes'],
  });

  assertApprox(result.score, 0.7, 'Fully familiar required stack should retain 70% score');

  assertEqual(result.label, 'strong_familiarity', 'Expected strong_familiarity label');
});

test('Familiar AI technology contributes according to its familiarity', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js'],
    nice_to_have: ['LLM APIs'],
  });

  const expected = 1 * 0.7 + 0.9 * 0.3;

  assertApprox(result.score, expected, 'LLM APIs should contribute 0.9 familiarity within the 30% nice-to-have bucket');
});

test('Only nice-to-have technologies can still produce a score', () => {
  const result = calculateTechnologyScore({
    required: [],
    nice_to_have: ['Node.js', 'React'],
  });

  assertApprox(result.score, 0.5, 'When required technologies are absent, score the available nice-to-have bucket');
});

test('No technologies returns unknown', () => {
  const result = calculateTechnologyScore({
    required: [],
    nice_to_have: [],
  });

  assertEqual(result.score, null, 'Missing technologies should produce null score');

  assertEqual(result.label, 'unknown', 'Missing technologies should produce unknown label');
});

// --------------------------------------------------
// Realistic job patterns
// --------------------------------------------------

test('Familiar full-stack job ranks highly despite unfamiliar React', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js', 'Express.js', 'REST APIs', 'PostgreSQL', 'React'],
    nice_to_have: ['AWS', 'Git'],
  });

  assert(result.score >= 0.7, 'A job with mostly familiar required technologies should rank highly');
});

test('Unfamiliar React/Python/FastAPI job ranks low', () => {
  const result = calculateTechnologyScore({
    required: ['React', 'Python', 'FastAPI'],
    nice_to_have: ['Kubernetes', 'Celery', 'Dask'],
  });

  assert(result.score < 0.3, 'Mostly unfamiliar technology stack should rank as mostly unfamiliar or lower');
});

test('Familiar Node/Postgres/LLM job ranks strongly', () => {
  const result = calculateTechnologyScore({
    required: ['Node.js', 'PostgreSQL', 'LLM APIs'],
    nice_to_have: ['AWS', 'Docker', 'React', 'Next.js', 'TypeScript', 'Python'],
  });

  assert(result.score >= 0.7, 'Strong familiar required stack should produce strong familiarity');
});

// --------------------------------------------------
// Label boundaries
// --------------------------------------------------

test('Technology label 0.9 is highly_familiar', () => {
  assertEqual(getTechnologyLabel(0.9), 'highly_familiar', '0.9 should be highly_familiar');
});

test('Technology label 0.75 is strong_familiarity', () => {
  assertEqual(getTechnologyLabel(0.75), 'strong_familiarity', '0.75 should be strong_familiarity');
});

test('Technology label 0.7 is strong_familiarity', () => {
  assertEqual(getTechnologyLabel(0.7), 'strong_familiarity', '0.7 should be strong_familiarity');
});

test('Technology label 0.5 is mixed', () => {
  assertEqual(getTechnologyLabel(0.5), 'mixed', '0.5 should be mixed');
});

test('Technology label 0.3 is mostly_unfamiliar', () => {
  assertEqual(getTechnologyLabel(0.3), 'mostly_unfamiliar', '0.3 should be mostly_unfamiliar');
});

test('Technology label 0.2 is unfamiliar', () => {
  assertEqual(getTechnologyLabel(0.2), 'unfamiliar', '0.2 should be unfamiliar');
});

console.log('\n✓ All technology score tests passed');
