function requiresMoreThanThreeYears(description) {
  if (!description || typeof description !== 'string') {
    return false;
  }

  const text = description.toLowerCase();

  const patterns = [
    /\b([4-9]|[1-9]\d+)\s*\+\s*years?\b/,
    /\b(?:minimum|at least)\s+(?:of\s+)?([4-9]|[1-9]\d+)\s+years?\b/,
    /\b([4-9]|[1-9]\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+)?experience\b/,
    /\b([4-9]|[1-9]\d+)\s*[-–]\s*(\d+)\s+years?\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

module.exports = {
  requiresMoreThanThreeYears,
};
