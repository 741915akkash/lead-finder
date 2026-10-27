const { supabase } = require('../db/db');

function getDomain(url) {
  if (!url) return null;

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getInitialCompanyName(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');

    // ATS URLs
    if (hostname === 'jobs.ashbyhq.com') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    // Normal company URL
    return hostname.split('.')[0];
  } catch {
    return null;
  }
}

async function findCompanyByAtsUrl(atsUrl) {
  if (!atsUrl) return null;

  const { data, error } = await supabase.from('companies').select('*').eq('ats_url', atsUrl).maybeSingle();

  if (error) throw error;

  return data;
}

async function findCompanyByCareerUrl(careerUrl) {
  if (!careerUrl) return null;

  const { data, error } = await supabase.from('companies').select('*').eq('career_url', careerUrl).maybeSingle();

  if (error) throw error;

  return data;
}

async function registerCompany({
  name = null,
  domain = null,
  careerUrl = null,
  ats = null,
  boardName = null,
  atsUrl = null,
  discoverySource,
  atsStatus = 'detected',
}) {
  /*
   * A company must have at least one identity.
   */
  if (!careerUrl && !atsUrl) {
    throw new Error('Company must have either careerUrl or atsUrl');
  }

  if (!discoverySource) {
    throw new Error('discoverySource is required');
  }

  /*
   * ATS URL is the strongest identity when available.
   */
  if (atsUrl) {
    const existing = await findCompanyByAtsUrl(atsUrl);

    if (existing) {
      return updateExistingCompany(existing.id, {
        name,
        domain,
        careerUrl,
        ats,
        boardName,
        atsUrl,
        atsStatus,
      });
    }
  }

  /*
   * Otherwise try the career URL.
   */
  if (careerUrl) {
    const existing = await findCompanyByCareerUrl(careerUrl);

    if (existing) {
      return updateExistingCompany(existing.id, {
        name,
        domain,
        careerUrl,
        ats,
        boardName,
        atsUrl,
        atsStatus,
      });
    }
  }

  /*
   * No existing company.
   */
  const now = new Date().toISOString();

  const company = {
    name: name || getInitialCompanyName(careerUrl || atsUrl),

    domain: domain || getDomain(careerUrl || atsUrl),

    career_url: careerUrl,
    discovery_source: discoverySource,

    ats,
    ats_board_name: boardName,
    ats_url: atsUrl,

    ats_status: atsStatus,

    discovered_at: now,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('companies').insert(company).select().single();

  if (error) throw error;

  return data;
}

async function updateExistingCompany(companyId, { name, domain, careerUrl, ats, boardName, atsUrl, atsStatus }) {
  const updates = {
    updated_at: new Date().toISOString(),
  };

  /*
   * Only overwrite fields when we actually
   * discovered new information.
   */
  if (name) updates.name = name;
  if (domain) updates.domain = domain;
  if (careerUrl) updates.career_url = careerUrl;

  if (ats) updates.ats = ats;
  if (boardName) updates.ats_board_name = boardName;
  if (atsUrl) updates.ats_url = atsUrl;

  if (atsStatus) updates.ats_status = atsStatus;

  const { data, error } = await supabase.from('companies').update(updates).eq('id', companyId).select().single();

  if (error) throw error;

  return data;
}

module.exports = {
  getDomain,
  getInitialCompanyName,
  registerCompany,
};
