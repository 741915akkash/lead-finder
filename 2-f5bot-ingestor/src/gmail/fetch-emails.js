const { gmail } = require('./auth');

async function fetchEmails() {
  const result = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:admin@f5bot.com subject:"F5Bot found something"',
  });

  return result.data.messages || [];
}

module.exports = { fetchEmails };
