const { cmd } = require('../command');

cmd({
  pattern: "kick",
  react: "👢",
  desc: "Remove a user from the group.",
  category: "group",
  filename: __filename
}, async (conn, m, store, { from, args, isGroup, isBotAdmins, reply }) => {
  if (!isGroup) return reply("⚠️ Oops! This command only works in group chats 😊");
  if (!isBotAdmins) return reply("❌ Please make me an admin first, then I’ll be able to remove members");

  let user;
  if (m.quoted) {
    user = m.quoted.sender;
  } else if (args[0]) {
    user = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  } else {
    return reply("⚠️ To remove a user, tag them or reply to their message, then type: .kick");
  }

  await conn.groupParticipantsUpdate(from, [user], "remove");
  await conn.sendMessage(from, { 
    text: `👢 *@${user.split('@')[0]}* ✅ The user has been removed from the group!`, 
    mentions: [user] 
  });
  await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
});
