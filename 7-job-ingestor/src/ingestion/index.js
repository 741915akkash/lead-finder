require('dotenv').config();

const { startIngestionWorker } = require('./process-captures');

startIngestionWorker().catch((err) => {
  console.error('Job ingestion worker failed:', err);

  process.exit(1);
});
