const { calculateSalaryScore } = require('../normalizers/salary-score');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertApprox(actual, expected, message, tolerance = 0.0001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);

  if (a !== e) {
    throw new Error(`${message}\nExpected: ${e}\nActual: ${a}`);
  }
}

console.log('Testing salary score...');

// Below minimum
assertDeepEqual(
  calculateSalaryScore(500000),
  {
    score: 0,
    label: 'below_minimum',
  },
  '₹5L should be below minimum',
);

// Minimum
assertDeepEqual(
  calculateSalaryScore(600000),
  {
    score: 0,
    label: 'acceptable',
  },
  '₹6L should score 0',
);

// Middle
const middle = calculateSalaryScore(800000);

assertApprox(middle.score, 0.5, '₹8L should score 0.5');

assertEqual(middle.label, 'acceptable', '₹8L should be acceptable');

// Desired
assertDeepEqual(
  calculateSalaryScore(1000000),
  {
    score: 1,
    label: 'desired_range',
  },
  '₹10L should score 1',
);

// Above desired
assertDeepEqual(
  calculateSalaryScore(1500000),
  {
    score: 1,
    label: 'above_desired',
  },
  '₹15L should remain capped at 1',
);

// Unknown
assertDeepEqual(
  calculateSalaryScore(null),
  {
    score: null,
    label: 'unknown',
  },
  'Missing salary should be unknown',
);

console.log('✓ All salary score tests passed');
