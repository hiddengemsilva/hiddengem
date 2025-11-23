module.exports = {
  command: "unblock",
  alias: ["unb", "unbl", "unblo", "unblok", "unblocks", "unblocked", "unbloks", "unblk"],
  description: "Unblock user (reply in group or direct in inbox)",
  category: "owner",
  react: "☺️",
  usage: ".unblock (reply to user or use in inbox)",
  execute: async (socket, msg, args) => {
    try {
      const sender = msg.key.remoteJid;
      const botOwner = socket.user.id.split(":")[0] + "@s.whatsapp.net";
      const fromMe = msg.key.fromMe;

      // React
      await socket.sendMessage(sender, { react: { text: "☺️", key: msg.key } });

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
          text: "*IF YOU WANT TO UNBLOCK SOMEONE 🥺* \n *THEN WRITE LIKE THIS ☺️* \n\n`UNBLOCK`\n\n*THEN THAT PERSON WILL BE UNBLOCKED ☺️*"
        }, { quoted: msg });
        return;
      }

      // Unblock
      await socket.updateBlockStatus(jid, "unblock");
      await socket.sendMessage(sender, { react: { text: "🥰", key: msg.key } });
      await socket.sendMessage(sender, {
        text: `*I HAVE UNBLOCKED YOU ☺️*\n*PLEASE DON’T DISTURB ME AGAIN 🥰 OTHERWISE YOU WILL BE BLOCKED AGAIN 😒*`,
        mentions: [jid],
        quoted: msg
      });

    } catch (error) {
      console.error("Unblock Error:", error);
      await socket.sendMessage(msg.key.remoteJid, { react: { text: "🥺", key: msg.key } });
      await socket.sendMessage(msg.key.remoteJid, {
        text: "*YOU ARE NOT UNBLOCKED YET 😔*\n*PLEASE WAIT A LITTLE 💫*"
      }, { quoted: msg });
    }
  }
};
