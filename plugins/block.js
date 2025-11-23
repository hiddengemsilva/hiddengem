module.exports = {
  command: "block",
  alias: ["b", "bl", "blo", "bloc", "blok", "blocks", "blocked", "bloks", "blk", "khatam", "bye"],
  description: "Block user (reply in group or direct in inbox)",
  category: "owner",
  react: "🤐",
  usage: ".block (reply to user or use in inbox)",
  execute: async (socket, msg, args) => {
    try {
      const sender = msg.key.remoteJid;
      const botOwner = socket.user.id.split(":")[0] + "@s.whatsapp.net";
      const fromMe = msg.key.fromMe;

      // React 🥺
      await socket.sendMessage(sender, { react: { text: "🤐", key: msg.key } });

      // Owner check
      if (!fromMe && msg.participant !== botOwner && msg.key.participant !== botOwner) {
        return await socket.sendMessage(sender, { text: "*THIS COMMAND IS ONLY FOR ME ☺️*\n*NO ONE ELSE CAN USE IT 💫*", quoted: msg });
      }

      // Determine JID
      let jid;
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

      if (quoted) {
        jid = quoted;
      } else if (sender.endsWith("@s.whatsapp.net")) {
        jid = sender;
      } else {
        await socket.sendMessage(sender, {
          text: "*IF YOU WANT TO BLOCK SOMEONE 🥺* \n *THEN WRITE LIKE THIS ☺️* \n\n`BLOCK`\n\n*THEN THAT PERSON WILL BE BLOCKED ☺️*"
        }, { quoted: msg });
        return;
      }

      // Message before block
      await socket.sendMessage(sender, { text: "*YOU WERE DISTURBING ME TOO MUCH 😒*\n*SO I BLOCKED YOU 💫*", quoted: msg });

      // Delay 1.5s then block
      setTimeout(async () => {
        await socket.updateBlockStatus(jid, "block");
        await socket.sendMessage(sender, { react: { text: "😡", key: msg.key } });
      }, 1500);

    } catch (error) {
      console.error("Block Error:", error);
      await socket.sendMessage(msg.key.remoteJid, { react: { text: "😔", key: msg.key } });
      await socket.sendMessage(msg.key.remoteJid, {
        text: "*YOU ARE NOT BLOCKED YET 😔*\n*TRY AGAIN IF YOU WANT 💫*"
      }, { quoted: msg });
    }
  }
};
