function resolvePostedAt(postedAtRaw, discoveredAt) {
  if (!postedAtRaw) {
    return null;
  }

  const raw = postedAtRaw.trim().replace(/^posted\s+/i, '').toLowerCase();

  if (!discoveredAt) {
    throw new Error('discoveredAt is required to resolve posted_at');
  }

  const baseDate = new Date(discoveredAt);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error(`Invalid discovered_at: ${discoveredAt}`);
  }

  // Exact calendar date
  const explicitDate = new Date(postedAtRaw);

  if (!Number.isNaN(explicitDate.getTime()) && isExplicitDate(raw)) {
    return explicitDate.toISOString();
  }

  // "today"
  if (raw === 'today') {
    return baseDate.toISOString();
  }

  // "yesterday"
  if (raw === 'yesterday') {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - 1);

    return date.toISOString();
  }

  // "X days ago"
  const daysMatch = raw.match(/^(\d+)\s+days?\s+ago$/);

  if (daysMatch) {
    const days = Number(daysMatch[1]);

    const date = new Date(baseDate);
    date.setDate(date.getDate() - days);

    return date.toISOString();
  }

  // "X weeks ago"
  const weeksMatch = raw.match(/^(\d+)\s+weeks?\s+ago$/);

  if (weeksMatch) {
    const weeks = Number(weeksMatch[1]);

    const date = new Date(baseDate);
    date.setDate(date.getDate() - weeks * 7);

    return date.toISOString();
  }

  // "X hours ago"
  const hoursMatch = raw.match(/^(\d+)\s+hours?\s+ago$/);

  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);

    const date = new Date(baseDate);
    date.setHours(date.getHours() - hours);

    return date.toISOString();
  }

  // "X minutes ago"
  const minutesMatch = raw.match(/^(\d+)\s+minutes?\s+ago$/);

  if (minutesMatch) {
    const minutes = Number(minutesMatch[1]);

    const date = new Date(baseDate);
    date.setMinutes(date.getMinutes() - minutes);

    return date.toISOString();
  }

  return null;
}

function isExplicitDate(raw) {
  return (
    /\b\d{4}-\d{1,2}-\d{1,2}\b/.test(raw) ||
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(raw)
  );
}

module.exports = {
  resolvePostedAt,
};
