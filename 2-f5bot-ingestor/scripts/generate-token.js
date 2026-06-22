const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));

const { client_id, client_secret, redirect_uris } = credentials.installed;

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\nOPEN THIS URL:\n');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nPaste code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    fs.writeFileSync('token.json', JSON.stringify(tokens, null, 2));

    console.log('\n✓ token.json created');

    rl.close();
  } catch (err) {
    console.error(err);
    rl.close();
  }
});
