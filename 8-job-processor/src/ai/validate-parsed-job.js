const EMPLOYMENT_TYPES = new Set(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'other']);

const WORKPLACE_TYPES = new Set(['remote', 'hybrid', 'onsite']);

const REQUIRED_FIELDS = [
  'title',
  'company',
  'location',
  'employment_type',
  'workplace_type',
  'salary_original',
  'salary_min',
  'salary_max',
  'salary_currency',
  'description',
  'posted_at_raw',
];

function isStringOrNull(value) {
  if (value === null) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const invalidNullStrings = ['null', 'undefined', 'none', 'n/a'];

  return !invalidNullStrings.includes(value.trim().toLowerCase());
}

function isNumberOrNull(value) {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function getValidationErrors(job) {
  const errors = [];

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return ['Parsed job must be a JSON object'];
  }

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(job, field)) {
      errors.push(`Missing field: ${field}`);
    }
  }

  // Don't continue if required fields are missing.
  if (errors.length > 0) {
    return errors;
  }

  // String fields
  const stringFields = [
    'title',
    'company',
    'location',
    'salary_original',
    'salary_currency',
    'description',
    'posted_at_raw',
  ];

  for (const field of stringFields) {
    if (!isStringOrNull(job[field])) {
      errors.push(`${field} must be a string or null`);
    }
  }

  // Employment type
  if (job.employment_type !== null && !EMPLOYMENT_TYPES.has(job.employment_type)) {
    errors.push(`employment_type has invalid value: ${job.employment_type}`);
  }

  // Workplace type
  if (job.workplace_type !== null && !WORKPLACE_TYPES.has(job.workplace_type)) {
    errors.push(`workplace_type has invalid value: ${job.workplace_type}`);
  }

  // Salary numbers
  if (!isNumberOrNull(job.salary_min)) {
    errors.push('salary_min must be a number or null');
  }

  if (!isNumberOrNull(job.salary_max)) {
    errors.push('salary_max must be a number or null');
  }

  // Salary cannot be negative
  if (job.salary_min !== null && job.salary_min < 0) {
    errors.push('salary_min cannot be negative');
  }

  if (job.salary_max !== null && job.salary_max < 0) {
    errors.push('salary_max cannot be negative');
  }

  // Minimum cannot exceed maximum
  if (job.salary_min !== null && job.salary_max !== null && job.salary_min > job.salary_max) {
    errors.push('salary_min cannot be greater than salary_max');
  }

  // Numeric salary consistency
  const hasNumericSalary = job.salary_min !== null || job.salary_max !== null;

  if (hasNumericSalary) {
    if (job.salary_min === null || job.salary_max === null) {
      errors.push('salary_min and salary_max are both required when numeric salary is present');
    }

    if (job.salary_currency === null) {
      errors.push('salary_currency is required when numeric salary is present');
    }

    if (job.salary_original === null) {
      errors.push('salary_original is required when numeric salary is present');
    }
  }

  return errors;
}

function validateParsedJob(job) {
  const errors = getValidationErrors(job);

  if (errors.length > 0) {
    throw new Error(`Invalid parsed job:\n- ${errors.join('\n- ')}`);
  }

  return true;
}

module.exports = {
  getValidationErrors,
  validateParsedJob,
};
