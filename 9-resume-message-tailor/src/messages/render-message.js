/**
 * Generate the concise application message from the tailoring result.
 *
 * This is intentionally deterministic in v1.
 * The message should sound like the candidate, not like an AI cover letter.
 */

function normalize(value) {
  if (!value) {
    return '';
  }

  return String(value).trim();
}

function firstStrongMatches(tailoring, limit = 2) {
  return (tailoring?.matchedEvidence || [])
    .filter((item) => item.strength === 'strong' || item.strength === 'medium')
    .slice(0, limit);
}

function renderApplicationMessage({ job, tailoring }) {
  const company = normalize(job?.company) || 'your company';

  const role = normalize(job?.title) || 'this role';

  const matches = firstStrongMatches(tailoring);

  const opening = `I'm interested in the ${role} role at ${company}.`;

  let relevance = '';

  if (matches.length > 0) {
    const evidenceText = matches
      .map((item) => item.candidateEvidence)
      .filter(Boolean)
      .join('; ');

    relevance = ` My background includes ${evidenceText}.`;
  }

  const reasoning = normalize(tailoring?.summary?.reasoning);

  let interest = '';

  if (reasoning) {
    interest = ` ${reasoning}`;
  }

  return `${opening}${relevance}${interest}`.replace(/\s+/g, ' ').trim();
}

module.exports = {
  renderApplicationMessage,
};
