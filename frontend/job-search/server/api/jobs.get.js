import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search || '';

  const source = query.source || '';

  const status = query.status || '';

  const recommendation = query.recommendation || '';

  const days = Number(query.days || 30);

  const page = Number(query.page || 1);

  const pageSize = Number(query.pageSize || 50);

  const allowedSorts = ['fit_score', 'priority_score', 'posted_at'];

  const sort = allowedSorts.includes(query.sort) ? query.sort : 'fit_score';

  const order = query.order === 'asc' ? 'asc' : 'desc';

  const from = (page - 1) * pageSize;

  const to = from + pageSize - 1;

  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - days);

  const supabase = getSupabase();

  let db = supabase
    .from('job_postings')
    .select(
      `
            id,
            title,
            company,
            location,
            url,
            apply_url,
            source,
            status,
            posted_at,
            fit_score,
            priority_score,
            recommendation
          `,
      {
        count: 'exact',
      },
    )
    .or(`posted_at.gte.${cutoff.toISOString()},posted_at.is.null`);

  if (search) {
    db = db.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }

  if (source) {
    db = db.eq('source', source);
  }

  if (status) {
    db = db.eq('status', status);
  }

  if (recommendation) {
    db = db.eq('recommendation', recommendation);
  }

  const { data, count, error } = await db
    .order(sort, {
      ascending: order === 'asc',

      nullsFirst: false,
    })
    .range(from, to);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const jobs = data || [];

  const jobIds = jobs.map((job) => job.id);

  let applications = [];

  if (jobIds.length) {
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select(
        `
              id,
              job_posting_id,
              status,
              applied_at,
              application_url,
              resume_version,
              notes,
              created_at,
              updated_at,

              application_contacts (
                id,
                crm_lead_id,
                crm_quiz_id,
                created_at
              )
            `,
      )
      .in('job_posting_id', jobIds);

    if (applicationError) {
      throw createError({
        statusCode: 500,
        statusMessage: applicationError.message,
      });
    }

    applications = applicationData || [];
  }

  /*
   * Collect every CRM contact ID
   * across all applications.
   */
  const crmLeadIds = [
    ...new Set(
      applications
        .flatMap((application) => application.application_contacts || [])
        .map((contact) => contact.crm_lead_id)
        .filter(Boolean),
    ),
  ];

  let crmContacts = [];

  if (crmLeadIds.length) {
    crmContacts = await $fetch('/api/crm-contacts', {
      query: {
        ids: crmLeadIds.join(','),
      },
    });
  }

  const crmContactsById = new Map(crmContacts.map((contact) => [String(contact.id), contact]));

  const applicationsByJobId = new Map(
    applications.map((application) => {
      const contacts = (application.application_contacts || [])
        .map((link) => crmContactsById.get(String(link.crm_lead_id)))
        .filter(Boolean);

      return [
        application.job_posting_id,

        {
          ...application,

          contacts,
        },
      ];
    }),
  );

  const rows = jobs.map((job) => ({
    ...job,

    application: applicationsByJobId.get(job.id) || null,
  }));

  return {
    page,
    pageSize,
    total: count || 0,

    totalPages: Math.ceil((count || 0) / pageSize),

    rows,

    days,
  };
});
