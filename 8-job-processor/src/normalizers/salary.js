function normalizeIndianLakhSalary(value) {
  if (value === null || value === undefined) {
    return value;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number;
}

function correctSalary(parsedJob) {
  if (!parsedJob) {
    throw new Error('parsedJob is required');
  }

  const corrected = {
    ...parsedJob,
  };

  const original = parsedJob.salary_original;

  if (typeof original !== 'string' || !original.trim()) {
    return corrected;
  }

  /*
   * Indian salary expressions such as:
   *
   * ₹3L – ₹5L
   * ₹15L – ₹20L
   * ₹12L – ₹18L
   *
   * mean lakhs, not raw rupees.
   *
   * The parser should normally already return:
   *
   * ₹3L  -> 300000
   * ₹15L -> 1500000
   *
   * This corrector specifically fixes cases where
   * the model accidentally returns values 10x too large.
   */

  const lakhMatch = original.match(/₹\s*([\d.]+)\s*L/i);

  if (!lakhMatch) {
    return corrected;
  }

  const firstLakhValue = Number(lakhMatch[1]);

  if (!Number.isFinite(firstLakhValue)) {
    return corrected;
  }

  const expectedMin = firstLakhValue * 100000;

  /*
   * If the parsed value is exactly 10x the expected
   * lakh conversion, correct it.
   */
  if (corrected.salary_min !== null && Number(corrected.salary_min) === expectedMin * 10) {
    corrected.salary_min = expectedMin;
  }

  const rangeMatch = original.match(/₹\s*[\d.]+\s*L\s*[–—-]\s*₹?\s*([\d.]+)\s*L/i);

  if (rangeMatch) {
    const secondLakhValue = Number(rangeMatch[1]);

    if (Number.isFinite(secondLakhValue)) {
      const expectedMax = secondLakhValue * 100000;

      if (corrected.salary_max !== null && Number(corrected.salary_max) === expectedMax * 10) {
        corrected.salary_max = expectedMax;
      }
    }
  }

  return corrected;
}

module.exports = {
  correctSalary,
};
