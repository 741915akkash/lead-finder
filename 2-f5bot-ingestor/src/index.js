require('dotenv').config();

const { fetchEmails } = require('./gmail/fetch-emails');

const { syncEmail } = require('./f5bot/sync-email');

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

  process.exit(0);
}

run();
