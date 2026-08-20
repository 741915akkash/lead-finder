const CORE_FAMILIAR = new Set([
  'javascript',
  'node.js',
  'node',
  'express.js',
  'express',
  'rest apis',
  'rest api',

  'vue.js',
  'vue',
  'nuxt.js',
  'nuxt',

  'postgresql',
  'postgres',
  'mysql',
  'mongodb',
  'supabase',

  'docker',
  'aws',
  'railway',
  'vercel',

  'git',
  'github',
  'github actions',
  'linux',
]);

const AI_FAMILIAR = new Set([
  'openai api',
  'ollama',
  'llm apis',
  'llm api',
  'rag',
  'vector databases',
  'vector database',
  'pgvector',
  'ai agents',
  'ai agent',
  'embeddings',
]);

const FAMILIAR_STACKS = new Set(['mern', 'mevn', 'pern', 'nuxt + node.js', 'nuxt + node']);

const REQUIRED_WEIGHT = 0.7;
const NICE_TO_HAVE_WEIGHT = 0.3;

function normalize(value) {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getFamiliarity(technology) {
  if (typeof technology !== 'string') {
    return 0;
  }

  const normalized = normalize(technology);

  if (CORE_FAMILIAR.has(normalized)) {
    return 1;
  }

  if (AI_FAMILIAR.has(normalized)) {
    return 0.9;
  }

  if (FAMILIAR_STACKS.has(normalized)) {
    return 1;
  }

  return 0;
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
    };
  }

  let requiredTotal = 0;
  let requiredWeight = 0;

  for (const technology of required) {
    requiredTotal += getFamiliarity(technology);
    requiredWeight += 1;
  }

  const requiredScore = requiredWeight === 0 ? null : requiredTotal / requiredWeight;

  let niceToHaveTotal = 0;
  let niceToHaveWeight = 0;

  for (const technology of niceToHave) {
    niceToHaveTotal += getFamiliarity(technology);
    niceToHaveWeight += 1;
  }

  const niceToHaveScore = niceToHaveWeight === 0 ? null : niceToHaveTotal / niceToHaveWeight;

  /*
   * Required technologies matter much more than
   * nice-to-have technologies.
   */

  let score;

  if (requiredScore != null && niceToHaveScore != null) {
    score = requiredScore * 0.7 + niceToHaveScore * 0.3;
  } else if (requiredScore != null) {
    score = requiredScore;
  } else {
    score = niceToHaveScore;
  }

  return {
    score,
    required_score: requiredScore,
    label: getTechnologyLabel(score),
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
  REQUIRED_WEIGHT,
  NICE_TO_HAVE_WEIGHT,
};
