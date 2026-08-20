const STAGE_SCORES = {
  'pre-seed': 1.0,
  seed: 1.0,
  'early-stage': 1.0,
  growth: 0.5,
  enterprise: 0.0,
};

const SIZE_SCORES = {
  '1-10': 1.0,
  '11-50': 1.0,
  '51-200': 0.7,
  '201-500': 0.4,
  '501-1000': 0.2,
  '1001+': 0.0,
};

function calculateCompanyScore(company) {
  const stageScore = STAGE_SCORES[company?.stage_label];
  const sizeScore = SIZE_SCORES[company?.size_label];

  const hasStage = Number.isFinite(stageScore);
  const hasSize = Number.isFinite(sizeScore);

  if (!hasStage && !hasSize) {
    return {
      score: null,
      label: 'unknown',
    };
  }

  if (hasStage && !hasSize) {
    return {
      score: stageScore,
      label: getCompanyLabel(stageScore),
    };
  }

  if (!hasStage && hasSize) {
    return {
      score: sizeScore,
      label: getCompanyLabel(sizeScore),
    };
  }

  const score = stageScore * 0.7 + sizeScore * 0.3;

  return {
    score,
    label: getCompanyLabel(score),
  };
}

function getCompanyLabel(score) {
  if (score == null) {
    return 'unknown';
  }

  if (score >= 0.85) {
    return 'strong_match';
  }

  if (score >= 0.6) {
    return 'reasonable_match';
  }

  if (score >= 0.3) {
    return 'weak_match';
  }

  return 'poor_match';
}

module.exports = {
  calculateCompanyScore,
  getCompanyLabel,
};
