const axios = require("axios");

module.exports = {
  command: "fancy",
  alias: ["font", "style", "textfont", "fancyname", "ftext", "fancymsg", "fonts"],
  react: "🥺",
  desc: "Convert text into fancy fonts.",
  category: "tools",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const q = args.join(" ");

      if (!q) {
        return sock.sendMessage(from, {
          text:
            "*Do you want to make your name fancy and stylish? ☺️♥️*\n" +
            "*Then type this 🥰🌹*\n\n" +
            "*❮FANCY SILVA-MD❯*\n\n" +
            "*When you type this, your name will appear in fancy text ☺️♥️*",
        }, { quoted: msg });
      }

      const apiUrl = `https://www.dark-yasiya-api.site/other/font?text=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl);

      if (!res.data.status || !res.data.result) {
        await sock.sendMessage(from, { text: "*Please try again 🥺💓*" }, { quoted: msg });
        return;
      }

      const fonts = res.data.result.map(item => item.result).join("\n\n");

      const resultText = `*"*Your name in fancy text ☺️💞*\n\n${fonts}\n\n*👑 MINI SILVA-MD BOT 👑*`;

      await sock.sendMessage(from, { text: resultText }, { quoted: msg });
      await sock.sendMessage(from, { react: { text: "☺️", key: msg.key } });

    } catch (err) {
      console.error("Fancy Command Error:", err);
      await sock.sendMessage(msg.key.remoteJid, { text: `*❌ ERROR:* ${err.message}` }, { quoted: msg });
    }
  },
};
