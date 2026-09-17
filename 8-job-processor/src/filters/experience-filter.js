function requiresMoreThanThreeYears(description) {
  if (!description || typeof description !== 'string') {
    return false;
  }

  const text = description.toLowerCase();

  const patterns = [
    // 4+ years, 5+ years, etc.
    /\b([4-9]|[1-9]\d+)\s*\+\s*years?\b/,

    // minimum 4 years, at least 4 years
    /\b(?:minimum|at least)\s+(?:of\s+)?([4-9]|[1-9]\d+)\s+years?\b/,

    // 4 years of experience, 5 years experience, etc.
    /\b([4-9]|[1-9]\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+)?experience\b/,

    // Ranges with minimum 4+ years:
    // 4-6, 5-8, 4-10, etc.
    /\b([4-9]|[1-9]\d+)\s*[-–]\s*(\d+)\s+years?\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

module.exports = {
  requiresMoreThanThreeYears,
};
