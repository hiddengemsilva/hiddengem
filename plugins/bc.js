module.exports = {
  command: "bc",
  desc: "Broadcast a message to all chats",
  category: "owner",
  use: ".bc <message>",
  fromMe: true,
  filename: __filename,

  execute: async (sock, msg, args) => {
    const { remoteJid } = msg.key;
    const text = args.join(" ");

    if (!text) return sock.sendMessage(remoteJid, { text: "📝 Please provide a message to broadcast." }, { quoted: msg });

    const chats = await sock.groupFetchAllParticipating();
    const allIds = Object.keys(chats);

    for (let id of allIds) {
      await sock.sendMessage(id, { text }, { quoted: msg });
    }

    await sock.sendMessage(remoteJid, { text: `✅ Broadcasted message to ${allIds.length} groups.` }, { quoted: msg });
  }
};
