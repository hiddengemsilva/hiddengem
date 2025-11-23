const { cmd } = require('../command');

cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin", "dmt"],
    desc: "Demotes a group admin to a normal member",
    category: "admin",
    react: "🥺",
    filename: __filename
},
async (conn, mek, m, {
    from, quoted, q, isGroup, sender, botNumber, isBotAdmins, isAdmins, reply
}) => {

    // 🥺 react on command start
    await conn.sendMessage(from, { react: { text: "🥺", key: m.key } });

    // ⚠️ Group check
    if (!isGroup) {
        await conn.sendMessage(from, { react: { text: "😫", key: m.key } });
        return reply("*Please use this command only in groups ☺️❤️*");
    }

    // 👮 User admin check
    if (!isAdmins) {
        await conn.sendMessage(from, { react: { text: "😥", key: m.key } });
        return reply("*Only group admins can use this command 🥺*");
    }

    // 🤖 Bot admin check
    if (!isBotAdmins) {
        await conn.sendMessage(from, { react: { text: "😎", key: m.key } });
        return reply("*FIRST MAKE ME AN ADMIN IN THIS GROUP ☺️❤️*");
    }

    // 🧩 Number detection
    let number;
    if (m.quoted) {
        number = m.quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        await conn.sendMessage(from, { react: { text: "🥺", key: m.key } });
        return reply(`*Which admin do you want to dismiss 🥺* 
*Mention that admin or reply to their message ☺️* 
*Then type 🥺👇*\n\n
*❮DEMOTE❯*\n\n
*That admin will be removed from their admin position 😇🌹*`);
    }

    if (number === botNumber) {
        await conn.sendMessage(from, { react: { text: "😔", key: m.key } });
        return reply("*Sorry 😅 You can’t remove me from admin 🥺❤️*");
    }

    const jid = number + "@s.whatsapp.net";

    try {
        // 👇 Demote kar do
        await conn.groupParticipantsUpdate(from, [jid], "demote");

        await conn.sendMessage(from, { react: { text: "☹️", key: m.key } });
        reply(`*+${number} has been dismissed from admin 🥺💔*`, { mentions: [jid] });

    } catch (error) {
        console.error("❌ DEMOTE ERROR:", error);
        await conn.sendMessage(from, { react: { text: "😔", key: m.key } });
        reply("*Please try again 🥺❤️*");
    }
});
