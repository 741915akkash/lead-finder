const { fetchEmails } = require('../gmail/fetch-emails');
const { getMessage } = require('../gmail/get-message');
const { parseEmail } = require('../f5bot/parse-email');
const { fetchRedditBody } = require('../f5bot/fetch-reddit-body');

async function run() {
  const emails = await fetchEmails();

  console.log('Emails found:', emails.length);

  const firstEmail = emails[0];

  if (!firstEmail) {
    console.log('No matching emails found');
    return;
  }

  const message = await getMessage(firstEmail.id);
  const alerts = parseEmail(message.body, message.urls).filter((alert) => alert.type === 'comments');

  console.log('================');
  console.log('Subject:', message.subject);
  console.log('Comments found:', alerts.length);

  for (const alert of alerts) {
    let fullBody = alert.body;

    if (alert.url) {
      try {
        const redditBody = await fetchRedditBody(alert.url);

        if (redditBody) {
          fullBody = redditBody;
        }
      } catch (err) {
        console.warn(`Could not fetch Reddit body for ${alert.url}: ${err.message}`);
      }
    }

    console.log('----------------');
    console.log('Title:', alert.title);
    console.log('Body:');
    console.log(fullBody);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
