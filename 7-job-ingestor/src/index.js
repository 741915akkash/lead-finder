// require('dotenv').config();

// const sources = require('./config/sources');

// async function run() {
//   console.log('Starting job ingestion...');

//   const enabledSources = Object.entries(sources)
//     .filter(([, config]) => config.enabled)
//     .map(([name, config]) => ({
//       name,
//       ...config,
//     }));

//   for (const source of enabledSources) {
//     console.log(`Source: ${source.name} | type: ${source.type}`);
//   }

//   console.log('Job ingestion completed');
// }

// async function main() {
//   while (true) {
//     try {
//       await run();
//     } catch (err) {
//       console.error('Job ingestor failed:', err);
//     }

//     console.log('Sleeping for 30 minutes...');

//     await new Promise((resolve) => {
//       setTimeout(resolve, 30 * 60 * 1000);
//     });
//   }
// }

// main().catch(console.error);
require('dotenv').config();

const sources = require('./config/sources');
const { fetchJobs } = require('./sources/greenhouse/fetch-jobs');
const { normalizeGreenhouseJob } = require('./sources/greenhouse/normalize-job');
const { ingestJobs } = require('./services/ingest-job');

async function runGreenhouse() {
  const config = sources.greenhouse;

  if (!config.enabled) {
    return;
  }

  for (const board of config.boards) {
    console.log(`\nFetching Greenhouse board: ${board.company} (${board.token})`);

    const rawJobs = await fetchJobs(board.token);

    console.log(`${board.company}: fetched ${rawJobs.length} jobs`);

    const jobs = rawJobs.map((job) => normalizeGreenhouseJob(job, board.company));

    const result = await ingestJobs(jobs);

    console.log(`${board.company}:`, result);
  }
}

async function main() {
  console.log('Starting Greenhouse ingestion...');

  await runGreenhouse();

  console.log('\nGreenhouse ingestion completed.');
}

main().catch((err) => {
  console.error('Greenhouse ingestion failed:', err);
  process.exit(1);
});