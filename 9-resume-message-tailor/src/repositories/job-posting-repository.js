const { SUPABASE_URL, SUPABASE_KEY, FIT_SCORE_THRESHOLD } = require('../config/config');

async function fetchNextEligibleJob() {
  const params = new URLSearchParams();

  params.set(
    'select',
    [
      'id',
      'source',
      'source_job_id',
      'url',
      'apply_url',
      'title',
      'company',
      'location',
      'employment_type',
      'workplace_type',
      'salary_min',
      'salary_max',
      'salary_currency',
      'description',
      'posted_at',
      'fit_score',
      'priority_score',
      'recommendation',
      'ai_reason',
      'ai_red_flags',
      'technology_score',
      'technology_labels',
      'company_score',
      'company_size_label',
      'company_stage_label',
      'salary_score',
      'salary_label',
      'analysis',
      'analysis_version',
      'archived',
      'application_packet',
      'networking_packet',
    ].join(','),
  );

  params.set('fit_score', `gte.${FIT_SCORE_THRESHOLD}`);
  params.set('archived', 'eq.false');
  params.set('application_packet', 'is.null');

  params.set('order', 'fit_score.desc');
  params.set('limit', '1');

  const url = `${SUPABASE_URL.replace(/\/$/, '')}` + `/rest/v1/job_postings?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Supabase job query failed (${response.status}): ${body}`);
  }

  const rows = await response.json();

  return rows.length ? rows[0] : null;
}

async function savePackets({ jobId, applicationPacket, networkingPacket }) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}` + `/rest/v1/job_postings?id=eq.${encodeURIComponent(jobId)}`;

  const response = await fetch(url, {
    method: 'PATCH',

    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=minimal',
    },

    body: JSON.stringify({
      application_packet: applicationPacket,
      networking_packet: networkingPacket,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Supabase packet save failed (${response.status}): ${body}`);
  }
}

module.exports = {
  fetchNextEligibleJob,
  savePackets,
};
