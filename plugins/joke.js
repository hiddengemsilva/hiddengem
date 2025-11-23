const axios = require('axios');

module.exports = {
  command: 'joke',
  description: 'Send a random joke',
  execute: async (socket, msg, args, number) => {
    const sender = msg.key.remoteJid;
    try {
      const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke');
      const joke = `😂 *${data.setup}*\n\n👉 ${data.punchline}`;
      await socket.sendMessage(sender, { text: joke }, { quoted: msg });
    } catch (err) {
      await socket.sendMessage(sender, { text: '❌ Failed to fetch joke.' }, { quoted: msg });
    }
  }
};
