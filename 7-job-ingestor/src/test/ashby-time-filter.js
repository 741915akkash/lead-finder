const { fetchJobs } = require('../sources/ashby/fetch-jobs');

async function test() {
  const jobs = await fetchJobs('peec');

  console.log(`Returned jobs: ${jobs.length}`);

  for (const job of jobs.slice(0, 10)) {
    console.log({
      title: job.title,
      publishedAt: job.publishedAt,
    });
  }
}

test().catch(console.error);
