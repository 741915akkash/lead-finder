require('dotenv').config();

const { ingestCompanies } = require('../services/company-ingest');

async function main() {
  console.log('======================================');
  console.log('COMPANY JOB INGESTION');
  console.log('======================================');

  const result = await ingestCompanies();

  console.log('\nCompany job ingestion completed.');
  console.log(result);
}

main().catch((err) => {
  console.error('Company job ingestion failed:', err);
  process.exit(1);
});
