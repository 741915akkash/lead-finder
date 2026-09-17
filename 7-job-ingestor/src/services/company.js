const { supabase } = require('../db/db');

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getInitialCompanyName(url) {
  const domain = getDomain(url);

  if (!domain) {
    return null;
  }

  return domain.split('.')[0];
}

async function upsertCompany(careerUrl) {
  const domain = getDomain(careerUrl);
  const name = getInitialCompanyName(careerUrl);

  const { data, error } = await supabase
    .from('companies')
    .upsert(
      {
        career_url: careerUrl,
        domain,
        name,
        discovery_source: 'manual',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'career_url',
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateCompanyATS(companyId, result) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: result.companyName || undefined,
      ats: result.ats,
      ats_board_name: result.boardName || null,
      ats_url: result.atsUrl || null,
      discovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  upsertCompany,
  updateCompanyATS,
};
