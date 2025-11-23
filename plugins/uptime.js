module.exports = {
  command: 'uptime',
  description: 'Check bot uptime',
  category: 'main',
  react: '⏱️',
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;

    // Uptime calculation
    const uptime = process.uptime(); // seconds
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const menumsg = `*👑 SILVA-MD MINI BOT UPTIME 👑*\n\n*⏱️ UPTIME:* ${hours}h ${minutes}m ${seconds}s\n\n*🔥 Bot is running smoothly!*`;

    await socket.sendMessage(sender, {
      image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
      caption: menumsg,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MINI BOT',
          serverMessageId: 143,
        },
      },
    });

    const uptimeMessage = `*👑 UPTIME :❯ ${hours}h ${minutes}m ${seconds}s 👑*`;

    await socket.sendMessage(sender, { text: uptimeMessage }, { quoted: msg });
  }
};
