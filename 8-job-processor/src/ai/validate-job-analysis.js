const ROLE_LABELS = ['direct', 'adjacent', 'unrelated'];

const COMPANY_SIZE_LABELS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+', 'unknown'];

const COMPANY_STAGE_LABELS = ['pre-seed', 'seed', 'early-stage', 'growth', 'enterprise', 'unknown'];

function getValidationErrors(data, detectedTechnologies = null) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['output must be an object'];
  }

  /*
   * ROLE
   */

  if (!data.role || typeof data.role !== 'object') {
    errors.push('role must be an object');
  } else {
    if (!ROLE_LABELS.includes(data.role.label)) {
      errors.push(`role.label must be one of: ${ROLE_LABELS.join(', ')}`);
    }

    if (typeof data.role.reason !== 'string') {
      errors.push('role.reason must be a string');
    }
  }

  /*
   * TECHNOLOGY
   */

  if (!data.technology || typeof data.technology !== 'object') {
    errors.push('technology must be an object');
  } else {
    if (!Array.isArray(data.technology.labels)) {
      errors.push('technology.labels must be an array');
    } else if (data.technology.labels.some((label) => typeof label !== 'string' || label.trim() === '')) {
      errors.push('technology.labels must contain only non-empty strings');
    }

    if (!Array.isArray(data.technology.required)) {
      errors.push('technology.required must be an array');
    } else if (data.technology.required.some((label) => typeof label !== 'string' || label.trim() === '')) {
      errors.push('technology.required must contain only non-empty strings');
    }

    if (!Array.isArray(data.technology.nice_to_have)) {
      errors.push('technology.nice_to_have must be an array');
    } else if (data.technology.nice_to_have.some((label) => typeof label !== 'string' || label.trim() === '')) {
      errors.push('technology.nice_to_have must contain only non-empty strings');
    }

    if (typeof data.technology.reason !== 'string') {
      errors.push('technology.reason must be a string');
    }

    /*
     * AI MUST NOT RETURN TECHNOLOGY SCORE
     */

    if ('score' in data.technology) {
      errors.push('technology.score must not be present');
    }

    /*
     * TECHNOLOGY MUST COME FROM DETERMINISTIC EXTRACTION
     */

    if (detectedTechnologies && Array.isArray(detectedTechnologies)) {
      const detectedSet = new Set(detectedTechnologies.map((technology) => technology.toLowerCase()));

      if (Array.isArray(data.technology.labels)) {
        const unknownTechnologies = data.technology.labels.filter(
          (technology) => !detectedSet.has(technology.toLowerCase()),
        );

        if (unknownTechnologies.length > 0) {
          errors.push(`technology.labels contains technologies not detected in job: ${unknownTechnologies.join(', ')}`);
        }
      }

      if (Array.isArray(data.technology.required)) {
        const unknownRequired = data.technology.required.filter(
          (technology) => !detectedSet.has(technology.toLowerCase()),
        );

        if (unknownRequired.length > 0) {
          errors.push(`technology.required contains technologies not detected in job: ${unknownRequired.join(', ')}`);
        }
      }

      if (Array.isArray(data.technology.nice_to_have)) {
        const unknownNiceToHave = data.technology.nice_to_have.filter(
          (technology) => !detectedSet.has(technology.toLowerCase()),
        );

        if (unknownNiceToHave.length > 0) {
          errors.push(
            `technology.nice_to_have contains technologies not detected in job: ${unknownNiceToHave.join(', ')}`,
          );
        }
      }
    }

    /*
     * BUCKETS MUST BE SUBSETS OF LABELS
     */

    if (Array.isArray(data.technology.labels) && Array.isArray(data.technology.required)) {
      const labelSet = new Set(data.technology.labels.map((technology) => technology.toLowerCase()));

      const missingRequired = data.technology.required.filter((technology) => !labelSet.has(technology.toLowerCase()));

      if (missingRequired.length > 0) {
        errors.push(`technology.required contains technologies not present in labels: ${missingRequired.join(', ')}`);
      }
    }

    if (Array.isArray(data.technology.labels) && Array.isArray(data.technology.nice_to_have)) {
      const labelSet = new Set(data.technology.labels.map((technology) => technology.toLowerCase()));

      const missingNiceToHave = data.technology.nice_to_have.filter(
        (technology) => !labelSet.has(technology.toLowerCase()),
      );

      if (missingNiceToHave.length > 0) {
        errors.push(
          `technology.nice_to_have contains technologies not present in labels: ${missingNiceToHave.join(', ')}`,
        );
      }
    }

    /*
     * TECHNOLOGY CANNOT BE IN BOTH BUCKETS
     */

    if (Array.isArray(data.technology.required) && Array.isArray(data.technology.nice_to_have)) {
      const requiredSet = new Set(data.technology.required.map((technology) => technology.toLowerCase()));

      const duplicates = data.technology.nice_to_have.filter((technology) => requiredSet.has(technology.toLowerCase()));

      if (duplicates.length > 0) {
        errors.push(`technology cannot be both required and nice_to_have: ${duplicates.join(', ')}`);
      }
    }
  }

  /*
   * COMPANY
   */

  if (!data.company || typeof data.company !== 'object') {
    errors.push('company must be an object');
  } else {
    if (!COMPANY_SIZE_LABELS.includes(data.company.size_label)) {
      errors.push(`company.size_label must be one of: ${COMPANY_SIZE_LABELS.join(', ')}`);
    }

    if (!COMPANY_STAGE_LABELS.includes(data.company.stage_label)) {
      errors.push(`company.stage_label must be one of: ${COMPANY_STAGE_LABELS.join(', ')}`);
    }

    if (typeof data.company.reason !== 'string') {
      errors.push('company.reason must be a string');
    }

    /*
     * AI MUST NOT RETURN COMPANY SCORE
     */

    if ('score' in data.company) {
      errors.push('company.score must not be present');
    }
  }

  /*
   * WORK MUST NOT EXIST
   */

  if ('work' in data) {
    errors.push('work must not be present');
  }

  return errors;
}

function validateJobAnalysis(data, detectedTechnologies = null) {
  return getValidationErrors(data, detectedTechnologies).length === 0;
}

module.exports = {
  getValidationErrors,
  validateJobAnalysis,
  ROLE_LABELS,
  COMPANY_SIZE_LABELS,
  COMPANY_STAGE_LABELS,
};
