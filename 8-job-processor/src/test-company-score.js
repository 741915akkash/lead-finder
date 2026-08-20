const { calculateCompanyScore, getCompanyLabel } = require('./ai/company-score');

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

console.log('Testing company score...\n');

// --------------------------------------------------
// Company scoring
// --------------------------------------------------

test('Early-stage 1-10 company is a strong match', () => {
  const result = calculateCompanyScore({
    stage_label: 'early-stage',
    size_label: '1-10',
  });

  assertApprox(result.score, 1, 'Early-stage 1-10 should score 1');

  assertEqual(result.label, 'strong_match', 'Expected strong_match label');
});

test('Seed 11-50 company is a strong match', () => {
  const result = calculateCompanyScore({
    stage_label: 'seed',
    size_label: '11-50',
  });

  assertApprox(result.score, 1, 'Seed 11-50 should score 1');
});

test('Early-stage with unknown size uses stage score', () => {
  const result = calculateCompanyScore({
    stage_label: 'early-stage',
    size_label: 'unknown',
  });

  assertApprox(result.score, 1, 'Known early-stage with unknown size should score 1');
});

test('Unknown stage with 1-10 size uses size score', () => {
  const result = calculateCompanyScore({
    stage_label: 'unknown',
    size_label: '1-10',
  });

  assertApprox(result.score, 1, '1-10 company with unknown stage should score 1');
});

test('Growth 201-500 company gets a moderate score', () => {
  const result = calculateCompanyScore({
    stage_label: 'growth',
    size_label: '201-500',
  });

  assertApprox(result.score, 0.47, 'Expected weighted growth/company-size score');

  assertEqual(result.label, 'weak_match', 'Expected weak_match label');
});

test('Enterprise 1001+ company scores zero', () => {
  const result = calculateCompanyScore({
    stage_label: 'enterprise',
    size_label: '1001+',
  });

  assertApprox(result.score, 0, 'Enterprise 1001+ should score zero');

  assertEqual(result.label, 'poor_match', 'Expected poor_match label');
});

test('Unknown stage and size returns unknown', () => {
  const result = calculateCompanyScore({
    stage_label: 'unknown',
    size_label: 'unknown',
  });

  assertEqual(result.score, null, 'Unknown company should return null score');

  assertEqual(result.label, 'unknown', 'Unknown company should return unknown label');
});

// --------------------------------------------------
// Label boundaries
// --------------------------------------------------

test('Company score 0.9 is strong_match', () => {
  assertEqual(getCompanyLabel(0.9), 'strong_match', '0.9 should be strong_match');
});

test('Company score 0.6 is reasonable_match', () => {
  assertEqual(getCompanyLabel(0.6), 'reasonable_match', '0.6 should be reasonable_match');
});

test('Company score 0.3 is weak_match', () => {
  assertEqual(getCompanyLabel(0.3), 'weak_match', '0.3 should be weak_match');
});

test('Company score 0.2 is poor_match', () => {
  assertEqual(getCompanyLabel(0.2), 'poor_match', '0.2 should be poor_match');
});

console.log('\n✓ All company score tests passed');
