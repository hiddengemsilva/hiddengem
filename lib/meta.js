const { isMetaOn } = require('../plugins/meta.js');
const metaNumber = '13135550002@s.whatsapp.net';

socket.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0];
  if (!msg.message) return;

  // Auto Meta AI mode
  if (isMetaOn() && msg.key.remoteJid !== metaNumber && !msg.key.fromMe) {
    const userText = msg.message.conversation || msg.message?.extendedTextMessage?.text;
    if (!userText) return;

    // Forward to Meta AI
    await socket.sendMessage(metaNumber, { text: userText });

    // Listen and reply
    socket.ev.once('messages.upsert', async (metaResp) => {
      const metaMsg = metaResp.messages[0];
      if (metaMsg.key.remoteJid === metaNumber && !metaMsg.key.fromMe) {
        if (metaMsg.message?.conversation) {
          await socket.sendMessage(msg.key.remoteJid, { text: `🤖 *Meta AI:* ${metaMsg.message.conversation}` }, { quoted: msg });
        }
      }
    });
  }
});
