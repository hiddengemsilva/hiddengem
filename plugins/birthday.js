const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

let scheduled = [];

module.exports = {
  command: 'birthday',
  description: 'Schedule birthday wish: .birthday <toNumber> <YYYY-MM-DD> <hh:mmAM/PM> <caption>',
  category: 'fun',

  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (args.length < 4) {
      return await sock.sendMessage(jid, { text: 'Usage:\n.birthday <toNumber> <YYYY-MM-DD> <hh:mmAM/PM> <caption>' });
    }

    const toNumber = args[0];
    const dateStr = args[1];
    const timeStr = args[2];
    const caption = args.slice(3).join(' ');

    const sendTime = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD hh:mmA', 'Africa/Nairobi');
    if (!sendTime.isValid()) {
      return await sock.sendMessage(jid, { text: '❌ Invalid date/time format.' });
    }
    if (sendTime.isBefore(moment())) {
      return await sock.sendMessage(jid, { text: '❌ Date/time is in the past.' });
    }

    scheduled.push({
      to: toNumber + '@s.whatsapp.net',
      caption: caption + '\n\n_MINI SILVA MD_',
      sendAt: sendTime.valueOf(),
    });

    await sock.sendMessage(jid, { text: `✅ Birthday wish scheduled to ${toNumber} at ${sendTime.format('LLLL')}` });
  },
};



setInterval(async () => {
  const now = Date.now();
  for (let i = scheduled.length - 1; i >= 0; i--) {
    const item = scheduled[i];
    if (item.sendAt <= now) {
      try {
        await global.sock.sendMessage(item.to, { text: item.caption });
      } catch (e) {
        console.error('Failed to send birthday wish:', e);
      }
      scheduled.splice(i, 1);
    }
  }
}, 60 * 1000); 
        
