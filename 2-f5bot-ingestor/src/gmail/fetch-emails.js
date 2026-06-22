const { gmail } = require('./auth');

async function fetchEmails() {
  const result = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:admin@f5bot.com newer_than:2d',
  });

  return result.data.messages || [];
}

module.exports = { fetchEmails };
