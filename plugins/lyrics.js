const fetch = require('node-fetch');
const fs = require('fs');

module.exports = {
  command: "lyrics",
  alias: ["lyric", "lirik"],
  react: "🎵",
  desc: "Get song lyrics (Mini-MD Style)",
  category: "music",

  async execute(sock, msg, args) {
    try {
      const text = args.join(" ");

      // agar user ne kuch nahi likha
      if (!text) {
        return sock.sendMessage(
          msg.key.remoteJid,
          {
            text: `*Do you want lyrics for any song 🤔*\n*Then type this ☺️*\n\n*LYRICS ❮SONG NAME❯*\n\n*When you type this 🙂 you’ll get the lyrics for that song 🥰❤️*`,
          },
          { quoted: msg }
        );
      }

      const api = `https://api.zenzxz.my.id/api/tools/lirik?title=${encodeURIComponent(text)}`;
      const res = await fetch(api);
      const json = await res.json();

      if (!json.success || !json.data?.result?.length) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "*Lyrics for this song couldn’t be found 🥺 Please try another song name 😇*" },
          { quoted: msg }
        );
      }

      const song = json.data.result[0];
      const title = song.trackName || song.name || text;
      const artist = song.artistName || "Unknown Artist";
      const album = song.albumName || "Unknown Album";
      const duration = song.duration ? `${song.duration}s` : "N/A";
      const lyrics = song.plainLyrics?.trim() || "No lyrics found 😢";
      const thumb = "https://files.catbox.moe/5uli5p.jpeg";

      const shortLyrics =
        lyrics.length > 900
          ? lyrics.substring(0, 900) + "\n\n...(reply *1* to get full lyrics as TXT file)"
          : lyrics;

      const caption = `
*👑 SILVA MINI-MD LYRICS 👑*

*🎵 NAME:* ${title}
*🎤 ARTIST:* ${artist}
*💿 ALBUM:* ${album}
*⏰ TIME:* ${duration}

*🎼 LYRICS:*
${shortLyrics}
`;

      const sentMsg = await sock.sendMessage(
        msg.key.remoteJid,
        { image: { url: thumb }, caption },
        { quoted: msg }
      );

      // "reply 1" to get full lyrics
      const listener = async (update) => {
        try {
          const up = update.messages?.[0];
          const body =
            up?.message?.conversation ||
            up?.message?.extendedTextMessage?.text ||
            "";

          if (body.trim() === "1" && up.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id) {
            const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
            fs.writeFileSync(fileName, `${title}\nby ${artist}\n\n${lyrics}`);

            await sock.sendMessage(
              msg.key.remoteJid,
              {
                document: fs.readFileSync(fileName),
                mimetype: "text/plain",
                fileName: `${title}.txt`,
                caption: `🎶 *${title}* Lyrics file by Mini-MD`,
              },
              { quoted: up }
            );

            fs.unlinkSync(fileName);
            sock.ev.off("messages.upsert", listener);
          }
        } catch (e) {
          console.log("Lyrics listener error:", e);
        }
      };

      sock.ev.on("messages.upsert", listener);
      setTimeout(() => sock.ev.off("messages.upsert", listener), 180000);
    } catch (err) {
      console.error("Lyrics Error:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `*❌ ERROR*\n\n*Oops! There seems to be a problem with my lyrics command 😥*\n\n*Error:* \`\`\`${err.message}\`\`\`\n\n> *SILVA-MD MINI BOT*`,
        },
        { quoted: msg }
      );
    }
  },
};
