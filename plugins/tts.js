const googleTTS = require("google-tts-api");
const axios = require("axios");

module.exports = {
  command: "tts",
  alias: ["say", "speak"],
  desc: "Convert text into voice (Text-To-Speech).",
  category: "fun",
  usage: ".tts <text>",
  filename: __filename,

  async execute(sock, msg, args) {
    try {
      const jid = msg.key.remoteJid;
      const q = args.join(" ");

      if (!q) {
        await sock.sendMessage(jid, {
          text: `*📢 Type the message you want to convert into voice!*\n\nExample:\n> .tts Hello World\n> .tts ur Assalamualaikum`,
        }, { quoted: msg });
        return;
      }

      // 🗣 Language detection
      let voiceLang = "en";
      if (args[0] === "ur" || args[0] === "urdu") voiceLang = "ur";

      // 🎧 Get TTS URL
      const ttsUrl = googleTTS.getAudioUrl(q, {
        lang: voiceLang,
        slow: false,
        host: "https://translate.google.com",
      });

      // 📥 Download audio
      const { data } = await axios.get(ttsUrl, { responseType: "arraybuffer" });
      const audioBuffer = Buffer.from(data, "binary");

      // 🎤 Send audio message
      await sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: "audio/mp4",
        ptt: false,
      }, { quoted: msg });
    } catch (err) {
      console.error("TTS Error:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Voice banate waqt error:* ${err.message}`,
      }, { quoted: msg });
    }
  },
};
