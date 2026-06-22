const { getMessage } = require('../gmail/get-message');

const { parseEmail } = require('./parse-email');
const { importAlert } = require('./import-alert');

const { isEmailProcessed } = require('./is-email-processed');
const { markEmailProcessed } = require('./mark-email-processed');

const TARGET_PHRASE = 'f5bot found something';

async function syncEmail(messageId) {
  const processed = await isEmailProcessed(messageId);

  if (processed) {
    console.log(`Skipping processed email: ${messageId}`);

    return 0;
  }

  const message = await getMessage(messageId);

  if (!message.subject.toLowerCase().includes(TARGET_PHRASE)) {
    console.log(`Skipping unrelated email: ${messageId}`);
    return 0;
  }

  const alerts = parseEmail(message.body);

  for (const alert of alerts) {
    await importAlert(alert);

    console.log(`Saved ${alert.subreddit} | ${alert.title}`);
  }

  await markEmailProcessed(messageId);

  return alerts.length;
}

module.exports = {
  syncEmail,
};
