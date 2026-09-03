const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function resolvePostedAt(postedAtRaw, discoveredAt) {
  if (postedAtRaw === null || postedAtRaw === undefined || (typeof postedAtRaw === 'string' && !postedAtRaw.trim())) {
    return null;
  }

  if (typeof postedAtRaw !== 'string') {
    return null;
  }

  if (!discoveredAt) {
    throw new Error('discoveredAt is required to resolve posted_at');
  }

  const baseDate = new Date(discoveredAt);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error(`Invalid discovered_at: ${discoveredAt}`);
  }

  const raw = postedAtRaw
    .trim()
    .replace(/^posted\s+(?:on\s+)?/i, '')
    .replace(/^date\s+posted\s*:?\s*/i, '')
    .replace(/^posting\s+date\s*:?\s*/i, '')
    .trim()
    .toLowerCase();

  // today
  if (raw === 'today') {
    return baseDate.toISOString();
  }

  // yesterday
  if (raw === 'yesterday') {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - 1);

    return date.toISOString();
  }

  // X minutes/hours/days/weeks/months/years ago
  const relativeMatch = raw.match(
    /^(\d+)\+?\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago$/,
  );

  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];

    const date = new Date(baseDate);

    if (unit.startsWith('minute')) {
      date.setMinutes(date.getMinutes() - amount);
    } else if (unit.startsWith('hour')) {
      date.setHours(date.getHours() - amount);
    } else if (unit.startsWith('day')) {
      date.setDate(date.getDate() - amount);
    } else if (unit.startsWith('week')) {
      date.setDate(date.getDate() - amount * 7);
    } else if (unit.startsWith('month')) {
      date.setMonth(date.getMonth() - amount);
    } else if (unit.startsWith('year')) {
      date.setFullYear(date.getFullYear() - amount);
    } else {
      return null;
    }

    return date.toISOString();
  }

  // Explicit calendar date
  const explicitDate = parseExplicitDate(raw);

  if (explicitDate) {
    return explicitDate.toISOString();
  }

  return null;
}

function subtractCalendarDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);

  return result.toISOString();
}

/*
 * Parse explicit dates ourselves instead of relying on:
 *
 *   new Date("08/09/2026")
 *
 * because that is ambiguous between:
 *
 *   MM/DD/YYYY
 *   DD/MM/YYYY
 *
 * and can produce incorrect dates depending on format.
 */
function parseExplicitDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const raw = value
    .trim()
    .replace(/(\d)(st|nd|rd|th)\b/gi, '$1')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ');

  /*
   * YYYY-MM-DD / YYYY/MM/DD
   */
  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

  if (match) {
    return buildDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  /*
   * DD Month YYYY
   *
   * 28 August 2026
   * 28 Aug 2026
   */
  match = raw.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);

  if (match) {
    const day = Number(match[1]);
    const month = MONTHS[match[2].toLowerCase()];
    const year = Number(match[3]);

    if (month !== undefined) {
      return buildDate(year, month + 1, day);
    }
  }

  /*
   * Month DD YYYY
   *
   * August 28 2026
   * Aug 28 2026
   */
  match = raw.match(/^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/i);

  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    const day = Number(match[2]);
    const year = Number(match[3]);

    if (month !== undefined) {
      return buildDate(year, month + 1, day);
    }
  }

  /*
   * Numeric DD/MM/YYYY or DD-MM-YYYY.
   *
   * We deliberately interpret these as day/month/year because
   * job postings are commonly produced by non-US sources.
   *
   * Ambiguous values such as 08/09/2026 remain inherently
   * ambiguous, so do not attempt to be clever about them.
   */
  match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);

    /*
     * If one side makes the interpretation unambiguous:
     *
     * 28/08/2026 → 28 Aug
     * 08/28/2026 → 28 Aug
     */
    if (first > 12 && second <= 12) {
      return buildDate(year, second, first);
    }

    if (second > 12 && first <= 12) {
      return buildDate(year, first, second);
    }

    /*
     * Both values <= 12 means the date is ambiguous.
     *
     * Do not silently choose the wrong date.
     */
    return null;
  }

  return null;
}

function buildDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (year < 1970 || year > 2100) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  if (day < 1 || day > 31) {
    return null;
  }

  /*
   * Construct at UTC midnight so explicit calendar dates are
   * stable regardless of the server's timezone.
   */
  const date = new Date(Date.UTC(year, month - 1, day));

  /*
   * Reject invalid calendar dates such as:
   *
   * 31 February
   * 31 April
   */
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date;
}

module.exports = {
  resolvePostedAt,
  parseExplicitDate,
};
