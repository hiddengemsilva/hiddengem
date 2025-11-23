module.exports = {
  command: "alive",
  description: "Check if bot is running",
  category: "info",

  async execute(sock, msg) {
    try {
      const jid = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const jidName = sender.split("@")[0];

      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();
      const speed = Math.floor(Math.random() * 90 + 10);

      const caption = `*HELLO☺️*
      *KEEP SMILLING😇*
      *WELCOME THIS IS SILVA MINI 🤲*
      *THANKS YOU FOR USING US ☺️*
      
      *👑 OWNER INFO 👑*
https://github.com/SilvaTechB

*👑 SUPPORT CHANNEL 👑*
https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v

*👑 SUPPORT GROUP 👑*
https://chat.whatsapp.com/J1h8UQencpe7wTwvS7hHxj
`;

      // Envoyer simplement le message avec l'image
      await sock.sendMessage(
        jid,
        {
          image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
          caption: caption
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error("❌ Error in alive command:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Error checking bot status",
      });
    }
  },
};
