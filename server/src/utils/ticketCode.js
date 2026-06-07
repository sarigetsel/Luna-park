const crypto = require('crypto');

function generateTicketCode() {
  return `LUNA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

module.exports = { generateTicketCode };
