const fs = require('fs');
const cheerio = require('cheerio');
const { gmail } = require('../gmail/auth');
const { fetchEmails } = require('../gmail/fetch-emails');

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

function parseF5Bot(html) {
  const $ = cheerio.load(html);

  const results = [];

  $('p[style*="margin-left"]').each((_, el) => {
    const p = $(el);
    const link = p.find('a').first();

    if (!link.length) return;

    const title = link.text().trim();
    const href = link.attr('href');
    const body = p.find('span').text().trim();
    const firstTextNode = p.contents().first().text();

    const sourceMatch = firstTextNode.match(/(Reddit Comments|Reddit Posts)\s+\(\/r\/([^)]+)\)/);

    const subreddit = sourceMatch?.[2] || null;

    const authorText = p.text();
    const authorMatch = authorText.match(/by\s+([A-Za-z0-9_-]+)/);

    const author = authorMatch?.[1] || null;

    results.push({
      subreddit,
      title,
      body,
      author,
      url: href,
    });
  });

  return results;
}

async function run() {
  const emails = await fetchEmails();

  console.log('Emails found:', emails.length);

  const firstEmail = emails[0];

  if (!firstEmail) {
    console.log('No matching emails found');
    return;
  }

  const result = await gmail.users.messages.get({
    userId: 'me',
    id: firstEmail.id,
    format: 'full',
  });

  const message = result.data;
  const subject = message.payload.headers?.find((h) => h.name === 'Subject')?.value || '';
  const htmlPart = findPart(message.payload, 'text/html');
  const rawHtml = htmlPart ? decode(htmlPart.body.data) : '';
  const outputPath = 'src/test/f5bot-raw-email.html';

  fs.writeFileSync(outputPath, rawHtml, 'utf8');
  const results = parseF5Bot(rawHtml);

  console.log('================');
  console.log('Subject:', subject);
  console.log('Wrote HTML body to:', outputPath);
  console.log('Parsed results:');
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
