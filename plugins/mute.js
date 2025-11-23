module.exports = {
  command: "mute",
  desc: "Mute the group (only admins can send messages)",
  category: "group",
  use: ".mute",
  fromMe: true,
  filename: __filename,

  execute: async (sock, msg) => {
    const { remoteJid } = msg.key;
    await sock.groupSettingUpdate(remoteJid, "announcement");
    await sock.sendMessage(remoteJid, { text: "*This group is now closed 🥺*\n*You can no longer chat in this group for now 😇*\n*It will be opened again very soon 🥰*" }, { quoted: msg });
  }
};
