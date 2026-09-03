const POLL_INTERVAL_MS = 5000;
const FIT_SCORE_THRESHOLD = 0.6;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function assertEnvironment() {
  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }

  if (!SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_KEY environment variable.');
  }
}

module.exports = {
  POLL_INTERVAL_MS,
  FIT_SCORE_THRESHOLD,
  SUPABASE_URL,
  SUPABASE_KEY,
  assertEnvironment,
};
