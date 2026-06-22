const fs = require('fs');
const { google } = require('googleapis');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const token = JSON.parse(fs.readFileSync('token.json'));

const { client_id, client_secret, redirect_uris } = credentials.installed;

const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

auth.setCredentials(token);

const gmail = google.gmail({
  version: 'v1',
  auth,
});

function decode(base64) {
  return Buffer.from(base64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function findPart(part, mimeType) {
  if (!part) return null;

  if (part.mimeType === mimeType && part.body?.data) {
    return part;
  }

  for (const child of part.parts || []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }

  return null;
}

async function getMessage(id) {
  const result = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  });

  const message = result.data;

  const subject = message.payload.headers?.find((h) => h.name === 'Subject')?.value || '';
  const textPart = findPart(message.payload, 'text/plain');
  const htmlPart = findPart(message.payload, 'text/html');

  const textBody = textPart ? decode(textPart.body.data) : '';
  const htmlBody = htmlPart ? decode(htmlPart.body.data) : '';

  const body = htmlBody || textBody;

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    body,
    htmlBody,
    textBody,
  };
}

module.exports = {
  getMessage,
};
