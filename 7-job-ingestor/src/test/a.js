require('dotenv').config();

const { supabase } = require('../db/db');

async function main() {
  const { data, error } = await supabase
    .from('job_postings')
    .select('id, company, title, description, raw_text')
    .eq('source', 'ashby')
    .limit(100);

  if (error) throw error;

  console.log(`Fetched ${data.length} Ashby jobs`);

  const patterns = [
    /\b([4-9]|[1-9]\d+)\s*\+\s*years?\b/gi,

    /\b(?:minimum|at least)\s+(?:of\s+)?([4-9]|[1-9]\d+)\s+years?\b/gi,

    /\b([4-9]|[1-9]\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+)?experience\b/gi,

    /\b([4-9]|[1-9]\d+)\s*[-–]\s*(\d+)\s+years?\b/gi,
  ];

  let matchedJobs = 0;

  for (const job of data) {
    const description = job.description || job.raw_text || '';

    const matches = [];

    for (const pattern of patterns) {
      // Reset regex state because these regexes use /g
      pattern.lastIndex = 0;

      const found = description.match(pattern);

      if (found) {
        matches.push(...found);
      }
    }

    const uniqueMatches = [...new Set(matches)];

    if (uniqueMatches.length) {
      matchedJobs++;

      console.log('\n--------------------------------');
      console.log(`${job.id} | ${job.company}`);
      console.log(job.title);
      console.log('MATCHES:', uniqueMatches.join(' | '));
    }
  }

  console.log('\n======================================');
  console.log('EXPERIENCE MATCH SUMMARY');
  console.log('======================================');
  console.log(`Fetched jobs:       ${data.length}`);
  console.log(`Jobs with matches:  ${matchedJobs}`);
  console.log(`Jobs without match: ${data.length - matchedJobs}`);
  console.log('======================================');
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
