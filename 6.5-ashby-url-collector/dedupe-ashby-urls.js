import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

const TARGET_FILE = path.join(ROOT_DIR, 'ashby-urls.txt');
const SOURCE_FILE = path.join(ROOT_DIR, 'ashby-urls-2.txt');

function readUrls(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function main() {
  const existingUrls = readUrls(TARGET_FILE);
  const newUrls = readUrls(SOURCE_FILE);

  const existingSet = new Set(existingUrls);

  const uniqueNewUrls = [...new Set(newUrls.filter((url) => !existingSet.has(url)))];

  if (uniqueNewUrls.length > 0) {
    const content = `${uniqueNewUrls.join('\n')}\n`;

    const existingContent = fs.readFileSync(TARGET_FILE, 'utf8');

    const needsNewline = existingUrls.length > 0 && !existingContent.endsWith('\n');

    const separator = needsNewline ? '\n' : '';

    fs.appendFileSync(TARGET_FILE, separator + content, 'utf8');

  }

  console.log('Ashby URL deduplication complete.');
  console.log(`Existing URLs: ${existingUrls.length}`);
  console.log(`URLs in source file: ${newUrls.length}`);
  console.log(`New unique URLs appended: ${uniqueNewUrls.length}`);
  console.log(`Duplicates skipped: ${newUrls.length - uniqueNewUrls.length}`);
}

main();
