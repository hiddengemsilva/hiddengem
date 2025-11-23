const fs = require('fs');
const path = require('path');
const contactPath = path.join(__dirname, 'contacts.json');

if (!fs.existsSync(contactPath)) fs.writeFileSync(contactPath, '{}');

async function saveContact(jid, name) {
  const contacts = JSON.parse(fs.readFileSync(contactPath, 'utf-8'));

  if (!contacts[jid]) {
    contacts[jid] = name || 'Unknown';
    fs.writeFileSync(contactPath, JSON.stringify(contacts, null, 2));
    console.log(`📥 Saved: ${jid} as ${name}`);
  }
}

module.exports = { saveContact };
