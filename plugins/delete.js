
const getGroupAdmins = (participants) => {
	var admins = []
	for (let i of participants) {
		i.admin !== null  ? admins.push(i.id) : ''
	}
	return admins
}


module.exports = {
  command: "delete",
  desc: "Delete the replied message for everyone",
  category: "group",
  use: ".delete (reply to a message)",
  filename: __filename,
  fromMe: false,

  async execute(socket, msg, args) {



const stanzaId = msg.message.extendedTextMessage.contextInfo.stanzaId;
    const participant = msg.message.extendedTextMessage.contextInfo.participant;

const getGroupAdmins = (participants) => {
	var admins = []
	for (let i of participants) {
		i.admin !== null  ? admins.push(i.id) : ''
	}
	return admins
}


	  
    const from = msg.key.remoteJid;
const isGroup = from.endsWith('@g.us')
const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
            const isAdmins = isGroup ? groupAdmins.includes(from) : false


if (!isAdmins) {
await socket.sendMessage(from, { text: "*THIS COMMAND CAN ONLY BE USED BY ADMINS ☺️❤️*\n*OTHER USERS CANNOT USE IT 💫*" }, { quoted: msg });
               }
    

    if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
      return await socket.sendMessage(from, { text: "*WHICH MESSAGE DO YOU WANT TO DELETE? 😊 FIRST MENTION THAT MESSAGE 😇 AND THEN TYPE ❮DELETE❯ — THE MESSAGE WILL BE REMOVED 🥳*" }, { quoted: msg });
    }

    

	  
    try {
      await socket.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: stanzaId,
          participant: participant,
        },
      });
    } catch (err) {
      console.error("Delete Error:", err);
      await socket.sendMessage(from, { text: "❌ Failed to delete the message." }, { quoted: msg });
    }
  }
};
          
