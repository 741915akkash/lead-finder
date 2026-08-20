const { TECHNOLOGY_REGISTRY } = require('./technology-registry');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function containsTechnology(text, alias) {
  const normalizedText = normalizeText(text);
  const normalizedAlias = normalizeText(alias);

  const escaped = escapeRegex(normalizedAlias);

  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');

  return pattern.test(normalizedText);
}

function extractTechnologies(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const found = [];

  for (const [technology, aliases] of Object.entries(TECHNOLOGY_REGISTRY)) {
    const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);

    const matched = sortedAliases.some((alias) => containsTechnology(text, alias));

    if (matched) {
      found.push(technology);
    }
  }

  return found;
}

module.exports = {
  extractTechnologies,
};
