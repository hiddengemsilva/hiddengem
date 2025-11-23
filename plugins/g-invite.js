const fs = require("fs");

module.exports = {
  command: "invite",
  alias: ["glink", "grouplink"],
  react: "🥰",
  desc: "Get group invite link (Mini Bot Style)",
  category: "group",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");

      if (!isGroup) {
        return sock.sendMessage(from, { text: "*⚠️ Oops! This command only works in group chats 😊*" }, { quoted: msg });
      }

      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const groupMetadata = await sock.groupMetadata(from);
      const groupAdmins = groupMetadata.participants.filter(p => p.admin);
      const isBotAdmin = groupAdmins.some(p => p.id === botNumber);

      if (!isBotAdmin) {
        return sock.sendMessage(from, { text: "*⚠️ Please make me an admin first so I can get the group link ❤️*" }, { quoted: msg });
      }

      const inviteCode = await sock.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
      const groupName = groupMetadata.subject || "Group";

      await sock.sendMessage(from, {
        text: `*👑 ${groupName} OFFICIAL GROUP LINK 👑*\n\n🔗 ${inviteLink}\n\n🥰 Share this with your friends and tell them — "Join the Silva MD group, it’s awesome!" ❤️*`,
      }, { quoted: msg });
    } catch (e) {
      console.error("Invite command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ *ERROR:* ${e.message || "Unknown error"} 😢` }, { quoted: msg });
    }
  },
};
