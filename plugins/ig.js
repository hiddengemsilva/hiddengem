const axios = require("axios");
const { igdl } = require("ruhend-scraper");

module.exports = {
  command: "instagram",
  alias: ["igdl", "ig", "insta"],
  description: "Download Instagram videos and reels without watermark ✨",
  category: "download",
  react: "📸",
  usage: ".ig <Instagram URL>",
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const url = args[0];
    let waitMsg;

    try {
      // Validate link
      if (!url || !url.includes("instagram.com")) {
        return await socket.sendMessage(
          sender,
          {
            image: { url: "https://files.catbox.moe/5uli5p.jpeg" },
            caption:
              "📸 *Silva MINI Instagram Downloader*\n\nDrop your link like this:\n`.ig https://www.instagram.com/reel/...`\n\nLet's fetch your vibe 🎬✨",
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363200367779016@newsletter",
                newsletterName: "SILVA MINI",
                serverMessageId: 143,
              },
            },
          },
          { quoted: msg }
        );
      }

      // Show “fetching” status
      await socket.sendMessage(sender, { react: { text: "⏳", key: msg.key } });
      waitMsg = await socket.sendMessage(
        sender,
        {
          text: "*⏳ Fetching Instagram vibes...*\nHang tight while we grab your reel 💫",
          contextInfo: {
            externalAdReply: {
              title: "Silva MINI Downloader",
              body: "Fetching Instagram content...",
              thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
              mediaType: 1,
            },
          },
        },
        { quoted: msg }
      );

      // Multiple backup APIs for reliability
      const apiEndpoints = [
        async () => {
          const result = await igdl(url);
          if (result?.data?.length) return result.data.map((d) => d.url);
          return null;
        },
        async () => {
          const res = await axios.get(
            `https://api.lord-apis.xyz/igdl?url=${encodeURIComponent(url)}`
          );
          if (res.data?.result?.length)
            return res.data.result.map((d) => d.url);
          return null;
        },
        async () => {
          const res = await axios.get(
            `https://api.akuari.my.id/downloader/igdl?link=${encodeURIComponent(
              url
            )}`
          );
          if (res.data?.url_list) return res.data.url_list;
          return null;
        },
      ];

      let mediaLinks = null;
      for (const fetchApi of apiEndpoints) {
        try {
          mediaLinks = await fetchApi();
          if (mediaLinks && mediaLinks.length > 0) break;
        } catch (err) {
          console.warn("API failed:", err.message);
          continue;
        }
      }

      if (!mediaLinks || mediaLinks.length === 0) {
        if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });
        await socket.sendMessage(sender, { react: { text: "😞", key: msg.key } });
        return await socket.sendMessage(
          sender,
          {
            text: "*💔 Sorry! Couldn't fetch any video from that link.*\nMaybe it's private or unavailable.",
          },
          { quoted: msg }
        );
      }

      // Limit to 3 videos to avoid spam
      const limit = Math.min(mediaLinks.length, 3);
      for (let i = 0; i < limit; i++) {
        await socket.sendMessage(
          sender,
          {
            video: { url: mediaLinks[i] },
            caption:
              `🎥 *Instagram Download Complete!* ✨\n\n🔗 *Source:* ${url}\n📦 *Video ${i + 1} of ${limit}*\n\n_Powered by Silva MD Bot_`,
            contextInfo: {
              externalAdReply: {
                title: "Silva MINI - Instagram Downloader",
                body: "Video fetched successfully 🎬",
                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                mediaType: 1,
              },
            },
          },
          { quoted: msg }
        );
      }

      // Cleanup
      if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });
      await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("Instagram Download Error:", err);
      if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });

      await socket.sendMessage(sender, { react: { text: "😔", key: msg.key } });
      await socket.sendMessage(
        sender,
        {
          text:
            "💀 *SILVA MINI MD ERROR:*\n" +
            (err.message || "Something went wrong fetching the video.") +
            "\n\nTry again later.",
          contextInfo: {
            externalAdReply: {
              title: "Download Failed",
              body: "Instagram service unavailable",
              thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
              mediaType: 1,
            },
          },
        },
        { quoted: msg }
      );
    }
  },
};
