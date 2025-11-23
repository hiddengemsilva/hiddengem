// ──────────────────────────────────────────────────────────────
//  SILVA MD – SLIDE MENU
// ──────────────────────────────────────────────────────────────
const config = require('../config');
const axios = require('axios');
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

const IMAGES = [
'https://files.catbox.moe/5uli5p.jpeg',
// Add more images later
];

/**
 * Read More Spoiler (WhatsApp Hack)
 */
const READ_MORE = '\u200B'.repeat(4001);

/**
 * Dynamic Uptime
 */
function getUptime() {
const uptime = process.uptime();
const hours = Math.floor(uptime / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);
return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Full Help Message (used only for building slides)
 */
const HELP_MESSAGE = `
# SILVA MD BOT
╭━━━〔 ⚡ SILVA MD BOT ⚡ 〕━━━┈⊷
┃⚙️ USER: ${config.BOT_NAME || 'Silva MD'}
┃🌐 MODE: PUBLIC
┃💠 PREFIX: ${config.PREFIX}
┃🧠 VERSION: 1.0.0
┃🕐 UPTIME: ${getUptime()}
╰━━━━━━━━━━━━━━━┈⊷

👋 Welcome to Silva MD — your digital powerhouse 💫
${READ_MORE}

# 📥 DOWNLOAD COMMANDS
╭━━━〔 🔽 DOWNLOAD 〕━━━┈⊷
┃📥 • SONG
┃📥 • VIDEO  
┃📥 • TIKTOK
┃📥 • FB
┃📥 • APK
┃📥 • IMG
╰━━━━━━━━━━━━━━━┈⊷

Download media from various platforms with ease!
${READ_MORE}

# 🔍 SEARCH COMMANDS
╭━━━〔 🔍 SEARCH 〕━━━┈⊷
┃🔎 • YTS
┃🔎 • LYRICS
╰━━━━━━━━━━━━━━━┈⊷

Search for movies, music lyrics and more!
${READ_MORE}

# 🧭 MAIN COMMANDS  
╭━━━〔 🧭 MAIN 〕━━━┈⊷
┃⚡ • ALIVE
┃⚡ • PING
┃⚡ • UPTIME
┃⚡ • SYSTEM
┃⚡ • HELP
┃⚡ • OWNER
╰━━━━━━━━━━━━━━━┈⊷

Essential bot commands and utilities!
${READ_MORE}

# 🛠️ EXTRA COMMANDS
╭━━━〔 🛠️ EXTRA 〕━━━┈⊷
┃✨ • VV
┃✨ • DELETE
╰━━━━━━━━━━━━━━━┈⊷

Additional utility commands!
${READ_MORE}

# 👥 GROUP COMMANDS
╭━━━〔 👥 GROUP 〕━━━┈⊷
┃💬 • HIDETAG
┃💬 • DELETE
┃💬 • MUTE
┃💬 • UNMUTE
╰━━━━━━━━━━━━━━━┈⊷

Manage your groups efficiently!
${READ_MORE}

# 🙋 USER COMMANDS
╭━━━〔 🙋 USER 〕━━━┈⊷
┃🔒 • BLOCK
┃🔓 • UNBLOCK
┃🧾 • AUTOBIO
╰━━━━━━━━━━━━━━━┈⊷

User management and utilities!
${READ_MORE}

# 🤖 AI COMMANDS
╭━━━〔 🤖 AI 〕━━━┈⊷
┃🧠 • AI
┃🧠 • GPT
╰━━━━━━━━━━━━━━━┈⊷

Artificial Intelligence powered features!
${READ_MORE}

# 🎙️ CONVERT COMMANDS
╭━━━〔 🎙️ CONVERT 〕━━━┈⊷
┃🔊 • TTS
╰━━━━━━━━━━━━━━━┈⊷

Text-to-speech and conversion tools!
${READ_MORE}

# 📞 CONTACT & SUPPORT
🔰 SILVA MD MINI BOT 🔰

💬 DEVELOPER:
https://github.com/SilvaTechB

📢 SUPPORT CHANNEL:
https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v

👥 SUPPORT GROUP:
https://chat.whatsapp.com/J1h8UQencpe7wTwvS7hHxj

Powered by SilvaTechB
`.trim();

/**
 * Pick Random Item from Array
 */
const pickRandom = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

/**
 * Validate URL via HEAD request
 */
const isValidUrl = async (url) => {
try {
const { status } = await axios.head(url, { timeout: 6000 });
return status >= 200 && status < 400;
} catch {
return false;
}
};

/**
 * SLIDE MENU - Interactive Carousel
 */
const sendSlideHelpMenu = async (sock, chatId, message, pushname = "there") => {
const quoted = message || null;

try {
// Replace placeholder with actual pushname
const personalizedHelpMessage = HELP_MESSAGE.replace('${config.BOT_NAME || \"Silva MD\"}', pushname);

const sections = personalizedHelpMessage.split('# ').filter(Boolean).map(s => '# ' + s);
const cards = [];

for (let i = 0; i < sections.length; i++) {  
  const section = sections[i];  
  const titleMatch = section.match(/# ([^\n]+)/);  
  const title = titleMatch ? titleMatch[1].trim() : `Section ${i + 1}`;  
  const imageUrl = IMAGES[i % IMAGES.length] || IMAGES[0];  

  let media = null;  
  try {  
    media = await prepareWAMessageMedia(  
      { image: { url: imageUrl } },  
      { upload: sock.waUploadToServer }  
    );  
  } catch (e) {  
    console.warn(`Image upload failed for slide ${i + 1}:`, e.message);  
  }  

  const header = proto.Message.InteractiveMessage.Header.create({  
    ...(media || {}),  
    title: `*${title}*`,  
    subtitle: "⚡ Silva MD Bot",  
    hasMediaAttachment: !!media,  
  });  

  const bodyText = section.replace(/^#[^\n]*\n/, '').trim().split('\n').slice(0, 25).join('\n');  

  cards.push({  
    header,  
    body: { text: bodyText },  
    nativeFlowMessage: {  
      buttons: [  
        {  
          name: "quick_reply",  
          buttonParamsJson: JSON.stringify({  
            display_text: `View ${i + 1}`,  
            id: `view_help_${i + 1}`  
          })  
        }  
      ]  
    }  
  });  
}  

const carouselMessage = generateWAMessageFromContent(  
  chatId,  
  {  
    viewOnceMessage: {  
      message: {  
        interactiveMessage: {  
          body: { text: "*🔄 Swipe to navigate menu*" },  
          footer: { text: "© SilvaTechB • Silva MD Bot" },  
          carouselMessage: { cards, messageVersion: 1 },  
          contextInfo: { 
            forwardingScore: 0, 
            isForwarded: false,
            mentionedJid: [message?.key?.participant || chatId],
          }  
        }  
      }  
    }  
  },  
  { quoted }  
);  

const sent = await sock.relayMessage(chatId, carouselMessage.message, {  
  messageId: carouselMessage.key.id  
});  

// Listener: React & Send Full Section on Button Press  
const listener = async (m) => {  
  const mek = m.messages[0];  
  if (!mek.message) return;  

  const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';  
  const isReply = mek.message?.extendedTextMessage?.contextInfo?.stanzaId === sent.key.id;  
  const from = mek.key.remoteJid;  

  if (!isReply || from !== chatId) return;  

  await sock.sendMessage(from, { react: { text: '✅', key: mek.key } });  

  const match = text.match(/view_help_(\d+)/);  
  if (match) {  
    const idx = parseInt(match[1]) - 1;  
    if (idx >= 0 && idx < sections.length) {  
      const selected = sections[idx];  
      const title = selected.match(/# ([^\n]+)/)?.[1]?.trim() || 'Menu';  
      const imageUrl = IMAGES[idx % IMAGES.length] || IMAGES[0];  

      await sock.sendMessage(from, {  
        image: { url: imageUrl },  
        caption: `*${title}*\n\n${selected.replace(/^#[^\n]*\n/, '').replace(READ_MORE, '').trim()}`  
      }, { quoted: mek });  
    }  
  }  

  sock.ev.off('messages.upsert', listener);  
};  

sock.ev.on('messages.upsert', listener);

} catch (error) {
console.error('Slide Menu Error:', error);
// Fallback to regular menu
const fallbackMenu = `
╭━━━〔 ⚡ SILVA MD BOT ⚡ 〕━━━┈⊷
┃⚙️ USER: ${pushname}
┃🌐 MODE: PUBLIC
┃💠 PREFIX: ${config.PREFIX}
┃🧠 VERSION: 1.0.0
╰━━━━━━━━━━━━━━━┈⊷

👋 Hey ${pushname}! Use .help [category] for specific commands!
Type .download, .search, .main, .group, .ai, etc.
`.trim();
  
await sock.sendMessage(chatId, { 
  image: { url: IMAGES[0] },
  caption: fallbackMenu 
}, { quoted });
}
};

/**
 * Main Menu Command – SLIDE MENU
 */
module.exports = {
command: "menu",
description: "To get the interactive slide menu.",
react: "🥰",
category: "main",
execute: async (socket, msg, args, number) => {
try {
const from = msg.key.remoteJid;
const sender = msg.key.participant || from;
const pushname = msg.pushName || "there";

// Send the interactive slide menu
await sendSlideHelpMenu(socket, sender, msg, pushname);

} catch (e) {  
  console.error(e);  
  await socket.sendMessage(msg.key.remoteJid, {   
    text: `❌ ERROR: ${e.message}`   
  }, { quoted: msg });  
}
}
};
