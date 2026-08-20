import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async () => {
  const supabase = getSupabase();

  const [sources, statuses, recommendations] = await Promise.all([
    supabase.from('job_postings').select('source').not('source', 'is', null),

    supabase.from('job_postings').select('status').not('status', 'is', null),

    supabase.from('job_postings').select('recommendation').not('recommendation', 'is', null),
  ]);

  return {
    sources: [...new Set((sources.data || []).map((r) => r.source))].sort(),

    statuses: [...new Set((statuses.data || []).map((r) => r.status))].sort(),

    recommendations: [...new Set((recommendations.data || []).map((r) => r.recommendation))].sort(),
  };
});
