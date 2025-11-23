module.exports = {
  command: "hidetag",
  desc: "Tag everyone in the group with custom message",
  category: "group", 
  use: ".hidetag [message]",
  fromMe: true,
  filename: __filename,

  execute: async (sock, msg, args) => {
    const { remoteJid } = msg.key;

    if (!remoteJid.endsWith("@g.us")) {
      return sock.sendMessage(remoteJid, { 
        text: "*⚠️ This command can only be used in groups 😊*" 
      }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(remoteJid);
      const participants = metadata.participants.map(p => p.id);
      
      const message = args.length > 0 ? args.join(" ") : "Hey everyone, please listen 🥺❤️";

      // Send message with hidden mentions but visible text
      await sock.sendMessage(remoteJid, {
        text: message,
        mentions: participants
      }, { quoted: msg });

    } catch (error) {
      console.error("Hidetag error:", error);
      await sock.sendMessage(remoteJid, { 
        text: "❌ Error tagging members." 
      }, { quoted: msg });
    }
  }
};
