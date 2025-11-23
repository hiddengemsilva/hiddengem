const axios = require('axios');

// 🤖 AI / GPT Command — Mini Bot Version
module.exports = {
  command: 'ai',
  alias: ['gpt', 'ask', 'chatgpt', 'bing'],
  description: 'Chat with AI using your Heroku API',
  category: 'AI',
  react: '☺️',
  usage: '.ai <sawal>',
  
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const q = args.join(" ");
    
    // 🤔 agar user ne question nahi diya
    if (!q) {
      return await socket.sendMessage(sender, {
        text: "*DO YOU HAVE ANY QUESTION 🤔 AND YOU ARE NOT GETTING THE ANSWER 🥺*\n*SO I WILL FIND THE ANSWER FOR YOU 😇*\n\n*WRITE LIKE THIS ☺️👇*\n\n*GPT ❮YOUR QUESTION❯*\n*AI ❮YOUR QUESTION❯*\n\n*WHEN YOU WRITE LIKE THIS, YOU WILL GET YOUR ANSWER 😍❤️*"
      }, { quoted: msg });
    }

    try {
      // ⏳ reaction: thinking mode
      await socket.sendMessage(sender, { react: { text: "🤔", key: msg.key } });

      // 💬 waiting message
      const waitMsg = await socket.sendMessage(sender, { 
        text: "*SILVA INTELLIGENCE*"
      });

      // 🌍 API URL (tumhara heroku endpoint)
      const API_URL = "https://ai-api-key-699ac94e6fae.herokuapp.com/api/ask";

      // 📡 send user query
      const res = await axios.post(API_URL, { prompt: q });

      // 📩 agar reply mila
      if (res.data && res.data.reply) {
        await socket.sendMessage(sender, { 
          text: res.data.reply 
        }, { quoted: msg });
      } else {
        await socket.sendMessage(sender, { 
          text: "*YOU DID NOT GET THE ANSWER TO YOUR QUESTION 😔*"
        }, { quoted: msg });
      }

      // 🧹 waiting msg delete + success react
      await socket.sendMessage(sender, { react: { text: "😇", key: msg.key } });
      if (waitMsg?.key) await socket.sendMessage(sender, { delete: waitMsg.key });

    } catch (err) {
      console.error("❌ AI Command Error:", err);
      await socket.sendMessage(sender, { react: { text: "😔", key: msg.key } });
      await socket.sendMessage(sender, { 
        text: "❌ *AI SERVER DID NOT CONNECT 😔*\n*TRY AGAIN AFTER SOME TIME 🥺*" 
      }, { quoted: msg });
    }
  }
};
