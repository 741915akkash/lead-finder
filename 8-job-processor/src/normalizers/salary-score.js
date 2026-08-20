const DEFAULT_MINIMUM = 600000;
const DEFAULT_DESIRED = 1000000;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateSalaryScore(salaryMin, minimum = DEFAULT_MINIMUM, desired = DEFAULT_DESIRED) {
  if (salaryMin == null || Number.isNaN(Number(salaryMin))) {
    return {
      score: null,
      label: 'unknown',
    };
  }

  const salary = Number(salaryMin);

  if (salary < minimum) {
    return {
      score: 0,
      label: 'below_minimum',
    };
  }

  const score = clamp((salary - minimum) / (desired - minimum), 0, 1);

  if (salary < desired) {
    return {
      score,
      label: 'acceptable',
    };
  }

  if (salary === desired) {
    return {
      score: 1,
      label: 'desired_range',
    };
  }

  return {
    score: 1,
    label: 'above_desired',
  };
}

module.exports = {
  calculateSalaryScore,
  DEFAULT_MINIMUM,
  DEFAULT_DESIRED,
};
