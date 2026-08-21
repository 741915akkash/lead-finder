import pkg from 'pg';

const { Pool } = pkg;

let pool = null;

export function getCrmPool() {
  if (pool) {
    return pool;
  }

  const config = useRuntimeConfig();

  if (!config.crmDatabaseUrl) {
    throw new Error('CRM_DATABASE_URL is not configured');
  }

  pool = new Pool({
    connectionString: config.crmDatabaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return pool;
}
