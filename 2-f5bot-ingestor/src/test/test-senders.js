const { fetchEmails } = require('../gmail/fetch-emails');

const { getMessage } = require('../gmail/get-message');

async function run() {
  const emails = await fetchEmails();
  console.log('Emails found:', emails.length);

  console.log(emails);
  for (const email of emails) {
    const message = await getMessage(email.id);

    const from = message.payload.headers.find((h) => h.name === 'From');

    const subject = message.payload.headers.find((h) => h.name === 'Subject');

    console.log('----------------');
    console.log('FROM:', from?.value);
    console.log('SUBJECT:', subject?.value);
  }
}

run();
