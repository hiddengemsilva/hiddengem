module.exports = {
  command: "owner",
  description: "Send the bot owner's real WhatsApp contact (auto-detected)",
  category: "info",

  async execute(sock, msg) {
    try {
      const jid = msg.key.remoteJid;

      // 🔍 Bot ka apna WhatsApp JID lo (e.g., 923078071982@s.whatsapp.net)
      const botJid = sock.user.id;
      const botNumber = botJid.split("@")[0]; // number extract

      // 🪪 FN empty rakho taake WhatsApp khud name show kare
      const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:
TEL;type=CELL;type=VOICE;waid=${botNumber}:+${botNumber}
END:VCARD
`.trim();

      // 📤 Send the contact card
      await sock.sendMessage(jid, {
        contacts: {
          displayName: "", // WhatsApp khud bot ka name show karega
          contacts: [{ vcard }],
        },
      });

    } catch (err) {
      console.error("❌ Owner command error:", err);
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Error sending owner contact!" }, { quoted: msg });
    }
  },
};
