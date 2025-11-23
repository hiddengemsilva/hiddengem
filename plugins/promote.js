module.exports = {
  command: "promote",
  alias: ["p", "makeadmin", "admin"],
  description: "Promotes a member to group admin",
  category: "admin",
  react: "🥺",
  usage: ".promote (reply or mention user)",
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const from = sender;
    const isGroup = sender.endsWith("@g.us");

    try {
      // 🥺 react on command
      await socket.sendMessage(from, { react: { text: "🥺", key: msg.key } });

      // ❌ Not group
      if (!isGroup) {
        await socket.sendMessage(from, { react: { text: "😫", key: msg.key } });
        return await socket.sendMessage(from, { text: "*THIS COMMAND SHOULD ONLY BE USED IN GROUPS ☺️*\n*DON’T USE IT IN PRIVATE 💫*", quoted: msg });
      }

      // Fetch group metadata
      const metadata = await socket.groupMetadata(from);
      const participants = metadata.participants;
      const groupAdmins = participants.filter(p => p.admin).map(a => a.id);
      const botNumber = socket.user.id.split(":")[0] + "@s.whatsapp.net";
      const isBotAdmins = groupAdmins.includes(botNumber);
      const isAdmins = groupAdmins.includes(msg.participant || msg.key.participant);

      // ❌ User not admin
      if (!isAdmins) {
        await socket.sendMessage(from, { react: { text: "😥", key: msg.key } });
        return await socket.sendMessage(from, { text: "*ONLY GROUP ADMINS CAN USE THIS COMMAND 🥺*\n*YOU ARE NOT AN ADMIN 💫*", quoted: msg });
      }

      // ❌ Bot not admin
      if (!isBotAdmins) {
        await socket.sendMessage(from, { react: { text: "😎", key: msg.key } });
        return await socket.sendMessage(from, { text: "*FIRST MAKE ME AN ADMIN IN THIS GROUP ☺️❤️*\n*THEN I CAN USE THIS COMMAND 💫*", quoted: msg });
      }

      // 🎯 Determine target user
      let number;
      if (quoted) {
        number = quoted.split("@")[0];
      } else if (args.length && args[0].includes("@")) {
        number = args[0].replace(/[@\s]/g, "");
      } else {
        await socket.sendMessage(from, { react: { text: "☺️", key: msg.key } });
        return await socket.sendMessage(from, {
          text: "*WHICH MEMBER DO YOU WANT TO MAKE AN ADMIN IN THIS GROUP? 🤔*\n*FIRST MENTION THAT MEMBER OR REPLY TO THEIR MESSAGE ☺️🌹*\n*THEN WRITE LIKE THIS 🥰*\n\n❮ADMIN❯\n\n*THEN THAT MEMBER WILL BECOME AN ADMIN IN THE GROUP 😇♥️*"
        }, { quoted: msg });
      }

      const jid = number + "@s.whatsapp.net";

      // 🧩 Skip if already admin
      if (groupAdmins.includes(jid)) {
        await socket.sendMessage(from, { react: { text: "🥺", key: msg.key } });
        return await socket.sendMessage(from, { text: "*THIS MEMBER IS ALREADY AN ADMIN ☺️*\n*NO NEED TO MAKE THEM AGAIN 💫*", quoted: msg });
      }

      // ✅ Promote member
      await socket.groupParticipantsUpdate(from, [jid], "promote");
      await socket.sendMessage(from, { react: { text: "☺️", key: msg.key } });
      await socket.sendMessage(from, {
        text: `*THIS ${number} HAS BEEN PROMOTED FROM SIMPLE MEMBER TO ADMIN 🥰🌹*\n*CONGRATULATIONS 💫*`,
        mentions: [jid],
        quoted: msg
      });

    } catch (error) {
      console.error("Promote Error:", error);
      await socket.sendMessage(from, { react: { text: "😔", key: msg.key } });
      await socket.sendMessage(from, { text: "*Please try again 🥺❤️*", quoted: msg });
    }
  }
};
