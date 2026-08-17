const crypto = require('crypto');

function createJobId(source, url) {
  return crypto.createHash('sha256').update(`${source}:${url}`).digest('hex');
}

module.exports = {
  createJobId,
};
