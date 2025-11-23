const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports = {
  command: "tiktok",
  alias: ["ttdl", "tt", "tiktokdl"],
  description: "Download TikTok videos without watermark ✨",
  category: "download",
  react: "🎵",
  usage: ".tiktok <TikTok URL>",
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const text = args.join(" ");
    let waitMsg;
    let tempFilePath;

    const menuMsg = `🎵 *Silva Mini Bot Vibes* ✨\n\nDrop your TikTok link to download without watermark!\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx\n\nSit tight, your video is on the way 🚀`;

    try {
      // React to show command received
      await socket.sendMessage(sender, { react: { text: "🥺", key: msg.key } });

      if (!text) {
        return await socket.sendMessage(sender, {
          image: { url: "https://files.catbox.moe/5uli5p.jpeg" },
          caption: menuMsg,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363200367779016@newsletter",
              newsletterName: "SILVA MINI BOT",
              serverMessageId: 143,
            },
          },
        }, { quoted: msg });
      }

      if (!text.includes("tiktok.com") && !text.includes("vt.tiktok.com")) {
        await socket.sendMessage(sender, { react: { text: "☹️", key: msg.key } });
        return await socket.sendMessage(sender, {
          text: "*Oops! That doesn’t look like a TikTok link 😅*",
        }, { quoted: msg });
      }

      // Notify user it’s processing
      waitMsg = await socket.sendMessage(sender, {
        text: "*⏳ TikTok vibes incoming… Downloading your video now!*\n*Hold tight 😎*",
      });

      // Expand shortened TikTok link (vt.tiktok.com)
      let resolvedUrl = text;
      if (text.startsWith("https://vt.tiktok.com")) {
        const redirected = await axios.get(text);
        resolvedUrl = redirected.request.res.responseUrl;
      }

      // API endpoints with format handlers
      const apiEndpoints = [
        {
          name: "Tiklydown",
          url: `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(resolvedUrl)}`,
          handler: (data) => {
            if (data?.video && data.video.noWatermark)
              return {
                videoUrl: data.video.noWatermark,
                author: data.author?.nickname || "Unknown",
              };
            if (data?.videoUrl)
              return {
                videoUrl: data.videoUrl,
                author: data.author || "Unknown",
              };
            return null;
          },
        },
        {
          name: "TikWM",
          url: `https://tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`,
          handler: (data) => {
            if (!data?.data?.play) return null;
            return {
              videoUrl: data.data.play,
              author: data.data.author || "Unknown",
            };
          },
        },
      ];

      let result = null;

      for (const endpoint of apiEndpoints) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 25000);

          const response = await axios.get(endpoint.url, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          clearTimeout(timeout);

          result = endpoint.handler(response.data);
          if (result?.videoUrl) break;
        } catch (err) {
          console.warn(`${endpoint.name} failed:`, err.message);
          continue;
        }
      }

      if (!result?.videoUrl) {
        if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });
        await socket.sendMessage(sender, { react: { text: "😔", key: msg.key } });
        return await socket.sendMessage(sender, {
          text: "*💔 Sorry! Couldn't fetch the video. Try again later!*",
        }, { quoted: msg });
      }

      // Create a temp file for the downloaded video
      tempFilePath = path.join(os.tmpdir(), `tiktok_${Date.now()}.mp4`);

      // Download the video as a stream
      const videoResponse = await axios({
        method: "get",
        url: result.videoUrl,
        responseType: "stream",
        timeout: 30000,
      });

      const writer = fs.createWriteStream(tempFilePath);
      await streamPipeline(videoResponse.data, writer);

      // Send video with caption
      const caption = `🎵 *TikTok Vibes Downloaded!* ✨\n\n👤 *Author:* ${result.author}\n🔗 *Original URL:* ${resolvedUrl}\n\n_Enjoy your video — powered by Silva Mini Bot!_`;

      await socket.sendMessage(sender, {
        video: fs.readFileSync(tempFilePath),
        caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363200367779016@newsletter",
            newsletterName: "SILVA MINI BOT",
            serverMessageId: 143,
          },
        },
      }, { quoted: msg });

      // Cleanup temp file
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      // Remove waiting message
      if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });

      // React success
      await socket.sendMessage(sender, { react: { text: "☺️", key: msg.key } });

    } catch (e) {
      console.error("TikTok command error:", e);
      if (waitMsg) await socket.sendMessage(sender, { delete: waitMsg.key });
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      await socket.sendMessage(sender, { react: { text: "😔", key: msg.key } });
      await socket.sendMessage(sender, {
        text: "*⚡ Something went wrong!*\nTry again later — your TikTok vibes matter 😎💫",
      }, { quoted: msg });
    }
  },
};
