import { getCrmPool } from '../utils/crmDb';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const config = useRuntimeConfig();

  const quizId = String(config.crmQuizId || '').trim();

  if (!quizId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CRM_QUIZ_ID is not configured',
    });
  }

  const pool = getCrmPool();

  const idsParam = String(query.ids || '').trim();

  const company = String(query.company || '').trim();

  let result;

  /*
   * When application contact IDs are supplied,
   * retrieve exactly those CRM contacts.
   */
  if (idsParam) {
    const ids = idsParam
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id));

    if (!ids.length) {
      return [];
    }

    result = await pool.query(
      `
          SELECT
            leads.id,
            leads.name,
            leads.company,
            leads.email,
            leads.stage_id,
            pipeline_stages.name AS stage

          FROM leads

          LEFT JOIN pipeline_stages
            ON pipeline_stages.id =
               leads.stage_id

          WHERE leads.quiz_id = $1
            AND leads.id = ANY($2::bigint[])

          ORDER BY leads.name ASC
          `,
      [quizId, ids],
    );

    return result.rows;
  }

  /*
   * Optional company lookup.
   * This is useful for the CRM button / future UI.
   */
  if (company) {
    result = await pool.query(
      `
          SELECT
            leads.id,
            leads.name,
            leads.company,
            leads.email,
            leads.stage_id,
            pipeline_stages.name AS stage

          FROM leads

          LEFT JOIN pipeline_stages
            ON pipeline_stages.id =
               leads.stage_id

          WHERE leads.quiz_id = $1
            AND leads.company ILIKE $2

          ORDER BY leads.name ASC

          LIMIT 100
          `,
      [quizId, `%${company}%`],
    );

    return result.rows;
  }

  return [];
});
