const { getMessage } = require('../gmail/get-message');

function decode(base64) {
  return Buffer.from(base64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

async function run() {
  const message = await getMessage('19edb137031d6f94');

  const textPart = message.payload.parts?.find((p) => p.mimeType === 'text/plain');

  if (!textPart) {
    console.log('No text part');
    return;
  }

  const body = decode(textPart.body.data);

  console.log(body);

  const urls = body.match(/https:\/\/f5bot\.com\/url\?[^\s]+/g) || [];

  console.log('\nURLs found:\n');

  console.log(urls);
}

run();
