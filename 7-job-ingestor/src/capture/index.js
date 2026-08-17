require('dotenv').config();

const { startClipboardWatcher } = require('./clipboard-watcher');

startClipboardWatcher().catch((err) => {
  console.error('Clipboard watcher failed:', err);

  process.exit(1);
});
