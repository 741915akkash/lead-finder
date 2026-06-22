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

async function getMessage(id) {
  const result = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  });

  const message = result.data;

  const textPart = message.payload.parts?.find((p) => p.mimeType === 'text/plain');

  const body = textPart ? decode(textPart.body.data) : '';

  const urls = body.match(/https:\/\/f5bot\.com\/url\?[^\s]+/g) || [];

  return {
    id: message.id,
    threadId: message.threadId,
    body,
    urls,
  };
}

module.exports = {
  getMessage,
};
