module.exports = {
  command: 'video',
  alias: ["ytmp4","mp4","ytv","vi","v","vid","vide","videos","ytvi","ytvid","ytvide","ytvideos","searchyt","download","get","need","search"],
  description: "Download YouTube MP4",
  category: "download",
  react: "🥺",
  usage: ".video <video name>",
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const text = args.join(" ");

    if (!text) {
      return await socket.sendMessage(sender, { text: "*IF YOU WANT TO DOWNLOAD ANY VIDEO 🥺*\n*THEN WRITE LIKE THIS 😇*\n\n*VIDEO ❮YOUR VIDEO NAME❯*\n\n*JUST TYPE THE COMMAND ❮VIDEO❯ AND THEN WRITE THE NAME OF THE VIDEO ☺️ THE VIDEO WILL BE DOWNLOADED AND SENT HERE 🥰💞*" }, { quoted: msg });
    }

    const yts = require('yt-search');
    const axios = require('axios');

    try {
      const search = await yts(text);
      if (!search.videos.length) return await socket.sendMessage(sender, { text: "*MUJHE APKI VIDEO NAHI MIL RAHI SORRY 🥺❤️*" }, { quoted: msg });

      const data = search.videos[0];
      const ytUrl = data.url;

      // Replace 'APIKEY' with your actual API key
      const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
      const { data: apiRes } = await axios.get(api);

      if (!apiRes?.status || !apiRes.result?.media?.video_url) {
        return await socket.sendMessage(sender, { text: "*YOUR VIDEO IS NOT DOWNLOADING 🥺*\n*PLEASE TRY AGAIN ☺️*" }, { quoted: msg });
      }

      const result = apiRes.result.media;

      const caption = `*⟪════════ ♢.✰.♢ ════════⟫*
*SILVA VIDEO NAME*
*${data.title}*

*👑 LINK :❯ ${data.url}*
*👑 VIEWS :❯ ${data.views}*
*👑 TIME :❯ ${data.timestamp}*

*👑 IMPORTANT TOPIC 👑*
*FIRST MENTION MY MESSAGE 😫 IF YOU WANT THE SIMPLE VIDEO TYPE ❮1❯ ☺️ AND IF YOU WANT THE VIDEO AS A FILE TYPE ❮2❯ 😇*

*❮1❯ MP4 VIDEO*
*❮2❯ FILE VIDEO*
*⟪════════ ♢.✰.♢ ════════⟫*
`;

      const sentMsg = await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption }, { quoted: msg });
      const messageID = sentMsg.key.id;

      socket.ev.on("messages.upsert", async (msgData) => {
        const receivedMsg = msgData.messages[0];
        if (!receivedMsg?.message) return;

        const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
        const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        const senderID = receivedMsg.key.remoteJid;

        if (isReplyToBot) {
          switch (receivedText.trim()) {
            case "1":
              await socket.sendMessage(senderID, { video: { url: result.video_url }, mimetype: "video/mp4" }, { quoted: receivedMsg });
              break;

            case "2":
              await socket.sendMessage(senderID, { document: { url: result.video_url }, mimetype: "video/mp4", fileName: `${data.title}.mp4` }, { quoted: receivedMsg });
              break;

            default:
              await socket.sendMessage(senderID, { text: "*PLEASE REPLY WITH 1 OR 2 🥺*\n*CHOOSE YOUR OPTION 💫!*" }, { quoted: receivedMsg });
          }
        }
      });

    } catch (error) {
      console.error("Video download error:", error);
      await socket.sendMessage(sender, { text: "*VIDEO DID NOT DOWNLOAD 😔*\n*PLEASE TRY AGAIN 💫*" }, { quoted: msg });
    }
  }
};
