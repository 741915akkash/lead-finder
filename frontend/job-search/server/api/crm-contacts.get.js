import { getCrmPool } from '../utils/crmDb';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const quizId = String(config.crmQuizId || '').trim();

  if (!quizId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CRM_QUIZ_ID is not configured',
    });
  }

  const search = String(query.search || '').trim();

  const pool = getCrmPool();

  const values = [quizId];

  let searchClause = '';

  if (search) {
    values.push(`%${search}%`);

    searchClause = `
      AND (
        name ILIKE $2
        OR company ILIKE $2
        OR email ILIKE $2
      )
    `;
  }

  const result = await pool.query(
    `
      SELECT
        id,
        name,
        company,
        email,
        quiz_id
      FROM leads
      WHERE quiz_id = $1
      ${searchClause}
      ORDER BY created_at DESC
      LIMIT 100
    `,
    values,
  );

  return result.rows;
});
