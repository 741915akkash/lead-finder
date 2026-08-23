const { TECHNOLOGY_POLICY, TECHNOLOGY_ALIASES } = require('../config/target-role');

const REQUIRED_WEIGHT = 0.7;
const NICE_TO_HAVE_WEIGHT = 0.3;

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function buildTechnologySet(values = []) {
  return new Set(values.map(normalize));
}

const FAMILIAR = buildTechnologySet(TECHNOLOGY_POLICY.familiar);
const LEARN_QUICKLY = buildTechnologySet(TECHNOLOGY_POLICY.learn_quickly);
const EXCLUDED = buildTechnologySet(TECHNOLOGY_POLICY.excluded);
const ALIASES = Object.fromEntries(
  Object.entries(TECHNOLOGY_ALIASES || {}).map(([alias, technologies]) => [normalize(alias), technologies]),
);

function getFamiliarity(technology) {
  if (typeof technology !== 'string') {
    return 0;
  }

  const normalized = normalize(technology);

  if (FAMILIAR.has(normalized)) {
    return 1;
  }

  if (LEARN_QUICKLY.has(normalized)) {
    return 0.8;
  }

  return 0;
}

function getTechnologyComponents(technology) {
  if (typeof technology !== 'string') {
    return null;
  }

  return ALIASES[normalize(technology)] || null;
}

/*
 * Determine whether the required technology stack is acceptable.
 *
 * A required technology that is explicitly excluded is a hard
 * failure. Technologies that are familiar or learnable pass.
 */
function checkTechnologyGate(required = []) {
  if (!Array.isArray(required) || required.length === 0) {
    return {
      passed: true,
      reason: 'No required technologies identified.',
      excluded: [],
      learn_quickly: [],
      familiar: [],
    };
  }

  const excluded = [];
  const learnQuickly = [];
  const familiar = [];

  for (const technology of required) {
    const normalized = normalize(technology);

    const components = getTechnologyComponents(technology);

    if (components) {
      for (const component of components) {
        const componentNormalized = normalize(component);

        if (EXCLUDED.has(componentNormalized)) {
          excluded.push(component);
        } else if (LEARN_QUICKLY.has(componentNormalized)) {
          learnQuickly.push(component);
        } else if (FAMILIAR.has(componentNormalized)) {
          familiar.push(component);
        }
      }

      continue;
    }

    if (EXCLUDED.has(normalized)) {
      excluded.push(technology);
      continue;
    }

    if (LEARN_QUICKLY.has(normalized)) {
      learnQuickly.push(technology);
      continue;
    }

    if (FAMILIAR.has(normalized)) {
      familiar.push(technology);
    }
  }

  if (excluded.length > 0) {
    return {
      passed: false,
      reason: `Required technology is excluded: ${excluded.join(', ')}.`,
      excluded,
      learn_quickly: learnQuickly,
      familiar,
    };
  }

  return {
    passed: true,
    reason: 'Required technology stack is compatible with the technology policy.',
    excluded,
    learn_quickly: learnQuickly,
    familiar,
  };
}

function calculateBucketScore(technologies) {
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return null;
  }

  const total = technologies.reduce((sum, technology) => {
    return sum + getFamiliarity(technology);
  }, 0);

  return total / technologies.length;
}

function calculateTechnologyScore(analysis) {
  const required = Array.isArray(analysis?.required) ? analysis.required : [];

  const niceToHave = Array.isArray(analysis?.nice_to_have) ? analysis.nice_to_have : [];

  if (required.length === 0 && niceToHave.length === 0) {
    return {
      score: null,
      required_score: null,
      label: 'unknown',

      eligible: true,
      gate_passed: true,
      gate_reason: 'No required technologies identified.',
      excluded_required: [],
      learn_quickly_required: [],
      familiar_required: [],
    };
  }

  const gate = checkTechnologyGate(required);

  /*
   * Calculate the normal technology score even when the gate fails.
   * This keeps the raw technology score useful for diagnostics.
   */
  const requiredScore = required.length > 0 ? calculateBucketScore(required) : null;

  const niceToHaveScore = niceToHave.length > 0 ? calculateBucketScore(niceToHave) : null;

  let score;

  if (requiredScore != null && niceToHaveScore != null) {
    score = requiredScore * REQUIRED_WEIGHT + niceToHaveScore * NICE_TO_HAVE_WEIGHT;
  } else if (requiredScore != null) {
    score = requiredScore;
  } else {
    score = niceToHaveScore;
  }

  /*
   * Hard technology gate.
   *
   * If an explicitly excluded technology is required,
   * the job is not eligible for normal fit scoring.
   */
  if (!gate.passed) {
    return {
      score,
      required_score: requiredScore,
      label: getTechnologyLabel(score),

      eligible: false,
      gate_passed: false,
      gate_reason: gate.reason,
      excluded_required: gate.excluded,
      learn_quickly_required: gate.learn_quickly,
      familiar_required: gate.familiar,
    };
  }

  return {
    score,
    required_score: requiredScore,
    label: getTechnologyLabel(score),

    eligible: true,
    gate_passed: true,
    gate_reason: gate.reason,
    excluded_required: gate.excluded,
    learn_quickly_required: gate.learn_quickly,
    familiar_required: gate.familiar,
  };
}

function getTechnologyLabel(score) {
  if (score == null) {
    return 'unknown';
  }

  if (score >= 0.85) {
    return 'highly_familiar';
  }

  if (score >= 0.7) {
    return 'strong_familiarity';
  }

  if (score >= 0.5) {
    return 'mixed';
  }

  if (score >= 0.3) {
    return 'mostly_unfamiliar';
  }

  return 'unfamiliar';
}

module.exports = {
  calculateTechnologyScore,
  calculateBucketScore,
  getFamiliarity,
  getTechnologyLabel,
  checkTechnologyGate,
  REQUIRED_WEIGHT,
  NICE_TO_HAVE_WEIGHT,
};
