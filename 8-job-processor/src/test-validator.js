const { validateParsedJob } = require('./ai/validate-parsed-job');

function test(name, job, shouldPass) {
  try {
    validateParsedJob(job);

    if (shouldPass) {
      console.log(`PASS: ${name}`);
    } else {
      console.log(`FAIL: ${name} — expected rejection but it passed`);
    }
  } catch (error) {
    if (!shouldPass) {
      console.log(`PASS: ${name} — rejected correctly`);
      console.log(`  ${error.message.replace(/\n/g, '\n  ')}`);
    } else {
      console.log(`FAIL: ${name}`);
      console.log(`  ${error.message.replace(/\n/g, '\n  ')}`);
    }
  }
}

const validJob = {
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
  posted_at_raw: '5 days ago',
};

test('valid parsed job', validJob, true);

// 1. Missing field

const missingField = {
  ...validJob,
};

delete missingField.title;

test('missing title', missingField, false);

// 2. Wrong salary type

const wrongSalaryType = {
  ...validJob,
  salary_min: '1500000',
};

test('salary_min is string', wrongSalaryType, false);

// 3. Invalid employment type

const invalidEmploymentType = {
  ...validJob,
  employment_type: 'permanent',
};

test('invalid employment type', invalidEmploymentType, false);

// 4. Invalid workplace type

const invalidWorkplaceType = {
  ...validJob,
  workplace_type: 'work-from-home',
};

test('invalid workplace type', invalidWorkplaceType, false);

// 5. Invalid salary range

const invalidSalaryRange = {
  ...validJob,
  salary_min: 2000000,
  salary_max: 1500000,
};

test('salary min greater than max', invalidSalaryRange, false);

// 6. String "null"

const stringNull = {
  ...validJob,
  location: 'null',
};

test('location is string "null"', stringNull, false);

// 7. posted_at_raw string

const validPostedAtRaw = {
  ...validJob,
  posted_at_raw: '1 day ago',
};

test('valid posted_at_raw', validPostedAtRaw, true);

// 8. posted_at_raw can be null

const nullPostedAtRaw = {
  ...validJob,
  posted_at_raw: null,
};

test('null posted_at_raw', nullPostedAtRaw, true);

// 9. posted_at_raw string "null"

const stringNullPostedAtRaw = {
  ...validJob,
  posted_at_raw: 'null',
};

test('posted_at_raw is string "null"', stringNullPostedAtRaw, false);
