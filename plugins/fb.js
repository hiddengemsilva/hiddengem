const axios = require("axios");

function formatDuration(ms) {
  if (!ms) return "N/A";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

module.exports = {
  command: "facebook",
  alias: ["fb", "fbreel"],
  desc: "Download Facebook Reel/Video with HD/SD options",
  react: "📥",
  category: "download",

  execute: async (sock, msg, args) => {
    try {
      const from = msg.key.remoteJid;
      const url = args[0];
      const pushname = msg.pushName || "there";

      if (!url || !url.includes("facebook.com")) {
        return sock.sendMessage(from, {
          text: `❌ Please provide a valid Facebook video/reel URL!\nExample: *.facebook https://www.facebook.com/reel/xyz*`
        }, { quoted: msg });
      }

      // Fetch Facebook video info
      const apiRes = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
      const data = apiRes.data.data;

      if (!data || !data.urls || !Array.isArray(data.urls) || data.urls.length === 0) {
        return sock.sendMessage(from, { text: "❌ Video not available or private." }, { quoted: msg });
      }

      const hdVideo = data.urls[0];
      const sdVideo = data.urls[1] || null;
      const title = data.title || "N/A";
      const duration = formatDuration(data.duration);
      const views = data.views ?? "N/A";
      const reactions = data.reactions ?? "N/A";
      const comments = data.comments ?? "N/A";

      const caption = `
╭───────────────⭓
│ 👤 Requested by: ${pushname}
│ 🎬 Title: ${title}
│ ⏱ Duration: ${duration}
│ 👁 Views: ${views}
│ ❤️ Reactions: ${reactions}
│ 💬 Comments: ${comments}
│ 🔗 Source: ${url}
│
│ 🔢 Reply with:
│ ├ 1 → HD Video
│ ├ 2 → SD Video
│ ├ 3 → Audio only (Unavailable)
╰───────────────⭓`;

      const previewImg = "https://files.catbox.moe/5uli5p.jpeg";

      const sentMsg = await sock.sendMessage(from, { image: { url: previewImg }, caption }, { quoted: msg });
      const msgId = sentMsg.key.id;

      const listener = async (update) => {
        try {
          const mek = update.messages[0];
          if (!mek.message) return;
          if (mek.key.remoteJid !== from) return;
          const isReply = mek.message.extendedTextMessage?.contextInfo?.stanzaId === msgId;
          if (!isReply) return;

          const text = mek.message.conversation || mek.message.extendedTextMessage?.text;
          await sock.sendMessage(from, { react: { text: "✅", key: mek.key } });

          switch (text.trim()) {
            case "1":
              if (!hdVideo) return sock.sendMessage(from, { text: "❌ HD video not available." }, { quoted: mek });
              await sock.sendMessage(from, { video: { url: hdVideo }, caption: "✅ Facebook Video (HD)" }, { quoted: mek });
              break;
            case "2":
              if (!sdVideo) return sock.sendMessage(from, { text: "❌ SD video not available." }, { quoted: mek });
              await sock.sendMessage(from, { video: { url: sdVideo }, caption: "📼 Facebook Video (SD)" }, { quoted: mek });
              break;
            case "3":
              await sock.sendMessage(from, { text: "❌ Audio only not available for Facebook videos." }, { quoted: mek });
              break;
            default:
              await sock.sendMessage(from, { text: "❌ Invalid option. Reply 1, 2, or 3." }, { quoted: mek });
          }
        } catch (err) {
          console.error("Facebook reply error:", err);
        }
      };

      sock.ev.on("messages.upsert", listener);
      setTimeout(() => sock.ev.off("messages.upsert", listener), 2 * 60 * 1000);

    } catch (err) {
      console.error("Facebook command error:", err);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${err.message}` }, { quoted: msg });
    }
  }
};
