const { correctSalary } = require('./normalizers/salary');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function testThreeToFiveLakh() {
  const parsedJob = {
    salary_original: '₹3L – ₹5L',
    salary_min: 3000000,
    salary_max: 5000000,
    salary_currency: 'INR',
  };

  const corrected = correctSalary(parsedJob);

  assertEqual(corrected.salary_min, 300000, '₹3L should become ₹300000');

  assertEqual(corrected.salary_max, 500000, '₹5L should become ₹500000');

  console.log('✓ ₹3L – ₹5L correction passed');
}

function testCorrectExistingValue() {
  const parsedJob = {
    salary_original: '₹15L – ₹20L',
    salary_min: 1500000,
    salary_max: 2000000,
    salary_currency: 'INR',
  };

  const corrected = correctSalary(parsedJob);

  assertEqual(corrected.salary_min, 1500000, 'Correct ₹15L value should remain unchanged');

  assertEqual(corrected.salary_max, 2000000, 'Correct ₹20L value should remain unchanged');

  console.log('✓ Correct salary values remain unchanged');
}

function testNoSalary() {
  const parsedJob = {
    salary_original: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
  };

  const corrected = correctSalary(parsedJob);

  assertEqual(corrected.salary_min, null, 'Missing salary_min should remain null');

  assertEqual(corrected.salary_max, null, 'Missing salary_max should remain null');

  console.log('✓ Missing salary remains unchanged');
}

function run() {
  console.log('Testing salary corrector...\n');

  testThreeToFiveLakh();
  testCorrectExistingValue();
  testNoSalary();

  console.log('\n✓ All salary correction tests passed');
}

run();
