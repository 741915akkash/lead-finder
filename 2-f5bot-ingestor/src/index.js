require('dotenv').config();

const { fetchEmails } = require('./gmail/fetch-emails');
const { syncEmail } = require('./f5bot/sync-email');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function run() {
  const emails = await fetchEmails();

  console.log(`Found ${emails.length} emails`);

  for (const email of emails) {
    try {
      await syncEmail(email.id);
    } catch (err) {
      console.error(err.message);
    }
  }

  console.log('F5Bot sync completed');
}

async function main() {
  while (true) {
    try {
      await run();
    } catch (err) {
      console.error('F5Bot ingestor failed:', err);
    }

    console.log('Sleeping for 15 minutes...');
    await sleep(15 * 60 * 1000);
  }
}

main().catch(console.error);
