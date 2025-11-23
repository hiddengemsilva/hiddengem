require('dotenv').config();
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const cheerio = require('cheerio');
const { Octokit } = require('@octokit/rest');
const os = require('os');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
var { updateCMDStore, isbtnID, getCMDStore, getCmdForCmdId, connectdb, input, get, updb, updfb } = require("./lib/database");
var id_db = require('./lib/id_db');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    getContentType,
    proto,
    prepareWAMessageMedia,
    generateWAMessageFromContent
} = require('@whiskeysockets/baileys');

const config = {
    WELCOME: process.env.WELCOME === 'true',
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS === 'true',
    AUTO_VOICE: process.env.AUTO_VOICE === 'true',
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS === 'true',
    AUTO_RECORDING: process.env.AUTO_RECORDING === 'true',
    AUTO_TYPING: process.env.AUTO_TYPING === 'true',
    HEROKU_APP_URL: process.env.HEROKU_APP_URL,
    AUTO_LIKE_EMOJI: ['🥹', '👍', '😍', '💗', '🎈', '🎉', '🥳', '😎', '🚀', '🔥'],
    PREFIX: '.',
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK,
    ADMIN_LIST_PATH: './lib/admin.json',
    RCD_IMAGE_PATH: 'https://files.catbox.moe/5uli5p.jpeg',
    NEWSLETTER_JID: '120363200367779016@newsletter',
    NEWSLETTER_MESSAGE_ID: '428',
    OTP_EXPIRY: 300000,
    OWNER_NUMBER: process.env.OWNER_NUMBER,
    CHANNEL_LINK: process.env.CHANNEL_LINK,
    GIST_URL: process.env.GIST_URL || 'https://gist.githubusercontent.com/SilvaTechDev/8fdbbfb81639750b3170dc00103272c2/raw/6586958ef5a94d75e1dd38d70e857dbcb89b698d/silva.txt'
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.OWNER;
const repo = process.env.REPO;

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';
const NUMBER_LIST_PATH = './numbers.json';
const otpStore = new Map();
const initializedMessages = new Map();

// KEEP-ALIVE SYSTEM FOR RENDER
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
let keepAliveInterval;

function startKeepAlive() {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    
    keepAliveInterval = setInterval(async () => {
        try {
            // Self-ping to keep Render instance alive
            if (process.env.RENDER_EXTERNAL_URL) {
                await axios.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, { timeout: 10000 });
                console.log('✅ Keep-alive ping sent');
            }
            
            // Clean up inactive sockets
            const now = Date.now();
            for (const [number, socket] of activeSockets.entries()) {
                const creationTime = socketCreationTime.get(number);
                if (creationTime && (now - creationTime) > 24 * 60 * 60 * 1000) {
                    console.log(`🔄 Restarting 24h+ old socket: ${number}`);
                    socket.ws.close();
                    activeSockets.delete(number);
                    socketCreationTime.delete(number);
                    
                    const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                    await EmpirePair(number, mockRes);
                }
            }
        } catch (error) {
            console.log('⚠️ Keep-alive ping failed (might be starting up)');
        }
    }, KEEP_ALIVE_INTERVAL);
}

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// MODERN WELCOME MESSAGE TEMPLATES
const welcomeTemplates = [
    (userName, groupName, membersCount) => `🌟 *WELCOME TO THE FAMILY!* 🌟

╔═══════════════════════
║  🎉 *${userName}* 
║  just joined the group!
╠═══════════════════════
║  📛 *Group:* ${groupName}
║  👥 *Members:* ${membersCount}
║  🕐 *Time:* ${getSriLankaTimestamp()}
╚═══════════════════════

💫 *Welcome aboard! Feel free to introduce yourself and check the group rules!*`,

    (userName, groupName, membersCount) => `🚀 *NEW MEMBER ALERT!* 🚀

┌───────────────────────
│    🎊 *HELLO ${userName.toUpperCase()}!*
│    Welcome to ${groupName}!
├───────────────────────
│    📊 Group Stats:
│    👥 ${membersCount} amazing members
│    🕒 ${getSriLankaTimestamp()}
└───────────────────────

🌟 *We're excited to have you here! Don't be shy - say hello!*`,

    (userName, groupName, membersCount) => `💫 *WARM WELCOME!* 💫

◤✨━━━━━━━━━━━━✨◥
       🎯 ${userName}
   joined the community!
◣✨━━━━━━━━━━━━✨◢

🏷️ *Group:* ${groupName}
📈 *Member #:* ${membersCount}
⏰ *Joined:* ${getSriLankaTimestamp()}

💝 *Make yourself at home and enjoy your stay!*`
];

// MODERN GOODBYE MESSAGE TEMPLATES  
const goodbyeTemplates = [
    (userName, groupName, membersCount) => `😢 *FAREWELL FRIEND!* 😢

╔═══════════════════════
║  👋 *${userName}* 
║  has left the group
╠═══════════════════════
║  📛 *Group:* ${groupName}
║  👥 *Members Left:* ${membersCount}
║  🕐 *Time:* ${getSriLankaTimestamp()}
╚═══════════════════════

💔 *We'll miss you! Hope to see you again someday!*`,

    (userName, groupName, membersCount) => `👋 *UNTIL NEXT TIME!* 👋

┌───────────────────────
│    😥 *GOODBYE ${userName.toUpperCase()}!*
│    Thanks for being part of ${groupName}
├───────────────────────
│    📊 Group Stats:
│    👥 ${membersCount} members remaining
│    🕒 ${getSriLankaTimestamp()}
└───────────────────────

🌟 *Wishing you all the best in your future endeavors!*`,

    (userName, groupName, membersCount) => `💔 *SAD TO SEE YOU GO!* 💔

◤✨━━━━━━━━━━━━✨◥
       🎯 ${userName}
   left the community
◣✨━━━━━━━━━━━━✨◢

🏷️ *Group:* ${groupName}
📉 *Members Now:* ${membersCount}
⏰ *Left:* ${getSriLankaTimestamp()}

💝 *Thank you for the memories! Farewell!*`
];

function getRandomWelcome(userName, groupName, membersCount) {
    const template = welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];
    return template(userName, groupName, membersCount);
}

function getRandomGoodbye(userName, groupName, membersCount) {
    const template = goodbyeTemplates[Math.floor(Math.random() * goodbyeTemplates.length)];
    return template(userName, groupName, membersCount);
}

// SYSTEM SELF-CHECK FUNCTION
async function systemSelfCheck(socket, number) {
    try {
        const checkData = {
            'Instance': `+${number}`,
            'Connection': socket.user ? '🟢 ACTIVE' : '🔴 OFFLINE',
            'Memory': `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            'Uptime': moment.utc(process.uptime() * 1000).format("HH:mm:ss"),
            'Active Sessions': activeSockets.size,
            'Last Check': getSriLankaTimestamp()
        };

        console.log('🔍 System self-check performed:', checkData);
        
        // Send check result to admin if needed
        if (socket.user && Math.random() < 0.3) {
            const admins = loadAdmins();
            for (const admin of admins) {
                try {
                    await socket.sendMessage(
                        `${admin}@s.whatsapp.net`,
                        {
                            text: formatTechMessage('SYSTEM SELF-CHECK', checkData)
                        }
                    );
                } catch (error) {
                    console.error(`❌ Self-check report failed for ${admin}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('❌ Self-check failed:', error);
    }
}

function loadAdmins() {
    try {
        if (fs.existsSync(config.ADMIN_LIST_PATH)) {
            return JSON.parse(fs.readFileSync(config.ADMIN_LIST_PATH, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Failed to load admin list:', error);
        return [];
    }
}

function formatTechMessage(title, data) {
    const timestamp = getSriLankaTimestamp();
    return `🤖 *${title}*\n` +
           `╔═══════════════════\n` +
           `║ 📊 SYSTEM STATUS\n` +
           `╠═══════════════════\n` +
           Object.entries(data).map(([key, value]) => 
               `║ • ${key}: ${value}`
           ).join('\n') + `\n` +
           `╠═══════════════════\n` +
           `║ 🕐 ${timestamp}\n` +
           `╚═══════════════════\n` +
           `_Powered by SilvaTech Systems_`;
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSriLankaTimestamp() {
    return moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss');
}

async function cleanDuplicateFiles(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'session'
        });

        const sessionFiles = data.filter(file => 
            file.name.startsWith(`empire_${sanitizedNumber}_`) && file.name.endsWith('.json')
        ).sort((a, b) => {
            const timeA = parseInt(a.name.match(/empire_\d+_(\d+)\.json/)?.[1] || 0);
            const timeB = parseInt(b.name.match(/empire_\d+_(\d+)\.json/)?.[1] || 0);
            return timeB - timeA;
        });

        const configFiles = data.filter(file => 
            file.name === `config_${sanitizedNumber}.json`
        );

        if (sessionFiles.length > 1) {
            for (let i = 1; i < sessionFiles.length; i++) {
                await octokit.repos.deleteFile({
                    owner,
                    repo,
                    path: `session/${sessionFiles[i].name}`,
                    message: `Delete duplicate session file for ${sanitizedNumber}`,
                    sha: sessionFiles[i].sha
                });
                console.log(`🗑️ Deleted duplicate session: ${sessionFiles[i].name}`);
            }
        }

        if (configFiles.length > 0) {
            console.log(`⚙️ Config exists for: ${sanitizedNumber}`);
        }
    } catch (error) {
        console.error(`❌ Cleanup failed for ${number}:`, error);
    }
}

async function joinGroup(socket) {
    let retries = config.MAX_RETRIES;
    const inviteCodeMatch = config.GROUP_INVITE_LINK?.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
    if (!inviteCodeMatch) {
        console.error('❌ Invalid group invite format');
        return { status: 'failed', error: 'Invalid group invite link' };
    }
    const inviteCode = inviteCodeMatch[1];

    while (retries > 0) {
        try {
            const response = await socket.groupAcceptInvite(inviteCode);
            if (response?.gid) {
                console.log(`✅ Group joined: ${response.gid}`);
                return { status: 'success', gid: response.gid };
            }
            throw new Error('No group ID in response');
        } catch (error) {
            retries--;
            let errorMessage = error.message || 'Unknown error';
            if (error.message.includes('not-authorized')) {
                errorMessage = 'Bot authorization failed (possibly banned)';
            } else if (error.message.includes('conflict')) {
                errorMessage = 'Bot already in group';
            } else if (error.message.includes('gone')) {
                errorMessage = 'Group link expired';
            }
            if (retries === 0) {
                return { status: 'failed', error: errorMessage };
            }
            await delay(2000 * (config.MAX_RETRIES - retries));
        }
    }
    return { status: 'failed', error: 'Max retries reached' };
}

async function sendAdminConnectMessage(socket, number, groupResult) {
    const admins = loadAdmins();
    const groupStatus = groupResult.status === 'success'
        ? `✅ Connected (GID: ${groupResult.gid})`
        : `❌ Failed: ${groupResult.error}`;
    
    const systemData = {
        'Instance': `+${number}`,
        'Status': '🟢 ONLINE',
        'Group': groupStatus,
        'Platform': process.platform,
        'Uptime': moment.utc(process.uptime() * 1000).format("HH:mm:ss"),
        'Session': activeSockets.size
    };

    for (const admin of admins) {
        try {
            const message = await socket.sendMessage(
                `${admin}@s.whatsapp.net`,
                {
                    text: formatTechMessage('SYSTEM INITIALIZED', systemData)
                }
            );
            
            initializedMessages.set(`${admin}_${number}`, {
                messageKey: message.key,
                timestamp: Date.now()
            });
            
            setTimeout(async () => {
                try {
                    await socket.sendMessage(
                        `${admin}@s.whatsapp.net`,
                        { delete: message.key }
                    );
                    initializedMessages.delete(`${admin}_${number}`);
                    console.log(`🗑️ Auto-deleted initialized message for ${admin}`);
                } catch (deleteError) {
                    console.error(`❌ Failed to auto-delete message for ${admin}:`, deleteError);
                }
            }, 20000);
            
        } catch (error) {
            console.error(`❌ Admin alert failed for ${admin}:`, error);
        }
    }
}

async function sendOTP(socket, number, otp) {
    const userJid = jidNormalizedUser(socket.user.id);
    const otpData = {
        'OTP Code': otp,
        'Expires': '5 minutes',
        'Instance': `+${number}`,
        'Purpose': 'Config Update'
    };

    try {
        await socket.sendMessage(userJid, { 
            text: formatTechMessage('SECURITY VERIFICATION', otpData)
        });
        console.log(`🔐 OTP sent to ${number}`);
    } catch (error) {
        console.error(`❌ OTP delivery failed:`, error);
        throw error;
    }
}

async function updateStoryStatus(socket) {
    const statusData = {
        'System': 'SilvaTech Bot',
        'Status': '🟢 OPERATIONAL',
        'Version': '2.1.0',
        'Timestamp': getSriLankaTimestamp()
    };
    
    try {
        await socket.sendMessage('status@broadcast', { 
            text: formatTechMessage('SYSTEM STATUS', statusData)
        });
        console.log(`📊 Status updated`);
    } catch (error) {
        console.error('❌ Status update failed:', error);
    }
}

// AUTO-TYPING FEATURE
async function setupAutoTyping(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || 
            msg.key.remoteJid === 'status@broadcast' || 
            msg.key.remoteJid === config.NEWSLETTER_JID ||
            config.AUTO_TYPING !== 'true') return;

        try {
            await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
            await delay(2000);
            await socket.sendPresenceUpdate('paused', msg.key.remoteJid);
            
        } catch (error) {
            console.error('❌ Auto-typing error:', error);
        }
    });
}

// FIXED NEWSLETTER HANDLER
function setupNewsletterHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== config.NEWSLETTER_JID) return;

        try {
            const emojis = ['❤️', '🔥', '😀', '👍'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const messageId = message.key.id;

            if (!messageId) {
                console.log('❌ No message ID for newsletter');
                return;
            }

            console.log(`📰 Newsletter reaction: ${messageId}`);
            
            let retries = config.MAX_RETRIES;
            while (retries > 0) {
                try {
                    await socket.sendMessage(
                        config.NEWSLETTER_JID,
                        {
                            react: {
                                text: randomEmoji,
                                key: {
                                    id: messageId,
                                    remoteJid: config.NEWSLETTER_JID
                                }
                            }
                        }
                    );
                    console.log(`✅ Newsletter reacted: ${randomEmoji}`);
                    break;
                } catch (error) {
                    retries--;
                    console.warn(`Retry newsletter: ${retries} left`, error.message);
                    if (retries === 0) throw error;
                    await delay(2000);
                }
            }
        } catch (error) {
            console.error('❌ Newsletter error:', error);
        }
    });
}

// FIXED STATUS HANDLER
async function setupStatusHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key || message.key.remoteJid !== 'status@broadcast' || !message.key.participant) return;

        try {
            if (config.AUTO_RECORDING === 'true') {
                await socket.sendPresenceUpdate("recording", message.key.remoteJid);
            }

            if (config.AUTO_VIEW_STATUS === 'true') {
                await socket.readMessages([message.key]);
            }

            if (config.AUTO_LIKE_STATUS === 'true') {
                const randomEmoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
                await socket.sendMessage(
                    message.key.remoteJid,
                    { 
                        react: { 
                            text: randomEmoji, 
                            key: message.key 
                        } 
                    }
                );
            }
        } catch (error) {
            console.error('Status handler error:', error);
        }
    });
}

// FIXED ANTI-DELETE HANDLER
async function handleMessageRevocation(socket, number) {
    socket.ev.on('messages.delete', async ({ keys }) => {
        if (!keys || keys.length === 0) return;

        for (const messageKey of keys) {
            try {
                const userJid = jidNormalizedUser(socket.user.id);
                const deletionTime = getSriLankaTimestamp();
                
                const deletionData = {
                    'Action': 'Message Deleted',
                    'From': messageKey.remoteJid,
                    'Time': deletionTime,
                    'Instance': `+${number}`,
                    'Type': 'Security Alert'
                };

                await socket.sendMessage(userJid, {
                    text: formatTechMessage('ANTI-DELETE ALERT', deletionData)
                });
                console.log(`⚠️ Deletion alert: ${messageKey.id}`);
            } catch (error) {
                console.error('❌ Deletion alert failed:', error);
            }
        }
    });
}

async function resize(image, width, height) {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
}

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

const plugins = new Map();
const pluginDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginDir)) {
    fs.readdirSync(pluginDir).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const plugin = require(path.join(pluginDir, file));
                if (plugin.command) {
                    plugins.set(plugin.command, plugin);
                }
            } catch (error) {
                console.error(`❌ Failed to load plugin ${file}:`, error);
            }
        }
    });
}

// FIXED COMMAND HANDLER
function setupCommandHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (
                !msg.message ||
                msg.key.remoteJid === 'status@broadcast' ||
                msg.key.remoteJid === config.NEWSLETTER_JID
            )
                return;

            let command = null;
            let args = [];
            let sender = msg.key.remoteJid;
            let from = sender;

            if (config.AUTO_TYPING === 'true') {
                await socket.sendPresenceUpdate('composing', from);
            }

            if (msg.message.conversation || msg.message.extendedTextMessage?.text) {
                const text =
                    (msg.message.conversation || msg.message.extendedTextMessage.text || '').trim();
                if (text.startsWith(config.PREFIX)) {
                    const parts = text.slice(config.PREFIX.length).trim().split(/\s+/);
                    command = parts[0].toLowerCase();
                    args = parts.slice(1);
                }
            }
            else if (msg.message.buttonsResponseMessage) {
                const buttonId = msg.message.buttonsResponseMessage.selectedButtonId;
                if (buttonId && buttonId.startsWith(config.PREFIX)) {
                    const parts = buttonId.slice(config.PREFIX.length).trim().split(/\s+/);
                    command = parts[0].toLowerCase();
                    args = parts.slice(1);
                }
            }

            if (!command) {
                if (config.AUTO_TYPING === 'true') {
                    await socket.sendPresenceUpdate('paused', from);
                }
                return;
            }

            console.log(`🎯 Command: ${command} from ${from}`);

            if (plugins.has(command)) {
                const plugin = plugins.get(command);
                try {
                    await plugin.execute(socket, msg, args, number);
                } catch (err) {
                    console.error(`❌ Plugin "${command}" error:`, err);
                    
                    const errorData = {
                        'Command': command,
                        'Error': err.message || err,
                        'Status': 'Critical Failure',
                        'Action': 'Auto-reporting'
                    };

                    await socket.sendMessage(
                        from,
                        {
                            text: formatTechMessage('SYSTEM ERROR', errorData)
                        },
                        { quoted: msg }
                    );
                }
            }

            if (config.AUTO_TYPING === 'true') {
                await socket.sendPresenceUpdate('paused', from);
            }

        } catch (err) {
            console.error('❌ Command handler error:', err);
        }
    });
}

// MODERNIZED WELCOME AND GOODBYE HANDLERS
async function setupWelcomeHandlers(socket) {
    socket.ev.on('group-participants.update', async (update) => {
        try {
            const { id: groupId, participants, action } = update;

            if (config.WELCOME !== 'true') return;

            const metadata = await socket.groupMetadata(groupId);
            const groupName = metadata.subject;
            const membersCount = metadata.participants.length;

            for (const user of participants) {
                const userName = user.split('@')[0];
                
                if (action === 'add') {
                    const welcomeMessage = getRandomWelcome(userName, groupName, membersCount);
                    
                    await socket.sendMessage(groupId, {
                        text: welcomeMessage,
                        mentions: [user]
                    });
                    console.log(`✅ Modern welcome sent for ${userName} in ${groupName}`);
                }
                
                if (action === 'remove') {
                    const goodbyeMessage = getRandomGoodbye(userName, groupName, membersCount - 1);
                    
                    await socket.sendMessage(groupId, {
                        text: goodbyeMessage,
                        mentions: [user]
                    });
                    console.log(`✅ Modern goodbye sent for ${userName} in ${groupName}`);
                }
                
                await delay(1000);
            }

        } catch (err) {
            console.error('❌ Welcome handler error:', err);
        }
    });
}

function setupMessageHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;

        if (config.AUTO_RECORDING === 'true') {
            try {
                await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
            } catch (error) {
                console.error('❌ Recording presence failed:', error);
            }
        }
    });
}

async function deleteSessionFromGitHub(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'session'
        });

        const sessionFiles = data.filter(file =>
            file.name.includes(sanitizedNumber) && file.name.endsWith('.json')
        );

        for (const file of sessionFiles) {
            await octokit.repos.deleteFile({
                owner,
                repo,
                path: `session/${file.name}`,
                message: `Delete session for ${sanitizedNumber}`,
                sha: file.sha
            });
        }
    } catch (error) {
        console.error('❌ GitHub session delete failed:', error);
    }
}

async function restoreSession(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'session'
        });

        const sessionFiles = data.filter(file =>
            file.name === `creds_${sanitizedNumber}.json`
        );

        if (sessionFiles.length === 0) return null;

        const latestSession = sessionFiles[0];
        const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: `session/${latestSession.name}`
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Session restore failed:', error);
        return null;
    }
}

async function loadUserConfig(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const configPath = `session/config_${sanitizedNumber}.json`;
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: configPath
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return JSON.parse(content);
    } catch (error) {
        console.warn(`⚙️ No config for ${number}, using default`);
        return { ...config };
    }
}

async function updateUserConfig(number, newConfig) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const configPath = `session/config_${sanitizedNumber}.json`;
        let sha;

        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: configPath
            });
            sha = data.sha;
        } catch (error) {
            // File doesn't exist
        }

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: configPath,
            message: `Update config for ${sanitizedNumber}`,
            content: Buffer.from(JSON.stringify(newConfig, null, 2)).toString('base64'),
            sha
        });
        console.log(`⚙️ Config updated: ${sanitizedNumber}`);
    } catch (error) {
        console.error('❌ Config update failed:', error);
        throw error;
    }
}

// ENHANCED AUTO-RESTART WITH BETTER RELIABILITY
function setupAutoRestart(socket, number) {
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        console.log(`🔗 Connection update for ${number}:`, {
            connection,
            error: lastDisconnect?.error?.message,
            statusCode: lastDisconnect?.error?.output?.statusCode
        });

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            
            if (shouldReconnect) {
                console.log(`🔁 Auto-reconnecting ${number} in 15 seconds...`);
                await delay(15000);
                
                // Clean up
                activeSockets.delete(number.replace(/[^0-9]/g, ''));
                socketCreationTime.delete(number.replace(/[^0-9]/g, ''));
                
                const mockRes = { 
                    headersSent: false, 
                    send: () => {}, 
                    status: () => mockRes 
                };
                await EmpirePair(number, mockRes);
            } else {
                console.log(`❌ Permanent disconnect for ${number}, no reconnection`);
            }
        }
    });
}

// FIXED CHANNEL & NEWSLETTER FOLLOW
async function followChannelAndNewsletter(socket) {
    try {
        await socket.newsletterFollow(config.NEWSLETTER_JID);
        console.log('✅ Newsletter followed');
        
        let retries = 3;
        while (retries > 0) {
            try {
                await socket.sendMessage(
                    config.NEWSLETTER_JID,
                    {
                        react: {
                            text: '🚀',
                            key: {
                                id: config.NEWSLETTER_MESSAGE_ID,
                                remoteJid: config.NEWSLETTER_JID
                            }
                        }
                    }
                );
                console.log('✅ Newsletter reaction sent');
                break;
            } catch (reactError) {
                retries--;
                console.warn(`⚠️ Newsletter reaction failed, ${retries} retries left:`, reactError.message);
                if (retries === 0) {
                    console.log('⚠️ Newsletter reaction permanently failed');
                } else {
                    await delay(2000);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Channel/Newsletter follow failed:', error.message);
    }
}

// GIST UPDATE CHECKER
let lastGistContent = "";
async function checkAndSendGistUpdate(socket) {
    try {
        const response = await axios.get(config.GIST_URL, {
            headers: { "User-Agent": "SilvaTechBot/2.0" },
            timeout: 10000
        });

        const message = response.data.trim();
        if (!message || message === lastGistContent) return;

        lastGistContent = message;
        const jid = socket.user.id;

        const updateData = {
            'Type': 'System Update',
            'Priority': 'High',
            'Content': message.substring(0, 100) + '...',
            'Action': 'Required'
        };

        await socket.sendMessage(jid, {
            text: formatTechMessage('SYSTEM UPDATE', updateData)
        });

        console.log("✅ Gist update delivered");
    } catch (err) {
        console.error("❌ Gist check failed:", err.message);
    }
}

// ANTILINK SYSTEM
global.antilinkGroups = global.antilinkGroups || {};

async function EmpirePair(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    await cleanDuplicateFiles(sanitizedNumber);

    const restoredCreds = await restoreSession(sanitizedNumber);
    if (restoredCreds) {
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(restoredCreds, null, 2));
        console.log(`✅ Session restored: ${sanitizedNumber}`);
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'fatal' : 'debug' });

    try {
        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari')
        });

        socketCreationTime.set(sanitizedNumber, Date.now());
        
        // Setup all handlers
        setupWelcomeHandlers(socket);
        setupStatusHandlers(socket);
        setupCommandHandlers(socket, sanitizedNumber);
        setupMessageHandlers(socket);
        setupAutoRestart(socket, sanitizedNumber);
        setupNewsletterHandlers(socket);
        setupAutoTyping(socket);
        handleMessageRevocation(socket, sanitizedNumber);

        // 30-MINUTE SELF-CHECK
        const selfCheckInterval = setInterval(() => {
            if (socket.user) {
                systemSelfCheck(socket, sanitizedNumber);
            }
        }, 30 * 60 * 1000);

        socket.ev.on('connection.update', (update) => {
            if (update.connection === 'close') {
                clearInterval(selfCheckInterval);
            }
        });
        
        if (!socket.authState.creds.registered) {
            let retries = config.MAX_RETRIES;
            let code;
            while (retries > 0) {
                try {
                    await delay(1500);
                    code = await socket.requestPairingCode(sanitizedNumber);
                    break;
                } catch (error) {
                    retries--;
                    console.warn(`Pairing code retry: ${retries}`, error.message);
                    await delay(2000 * (config.MAX_RETRIES - retries));
                }
            }
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        socket.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = await fs.readFile(path.join(sessionPath, 'creds.json'), 'utf8');
            let sha;
            try {
                const { data } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: `session/creds_${sanitizedNumber}.json`
                });
                sha = data.sha;
            } catch (error) {
                // File doesn't exist
            }

            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: `session/creds_${sanitizedNumber}.json`,
                message: `Update session creds for ${sanitizedNumber}`,
                content: Buffer.from(fileContent).toString('base64'),
                sha
            });
            console.log(`💾 Creds saved: ${sanitizedNumber}`);
        });

        // Gist update checker
        socket.ev.on("connection.update", (update) => {
            if (update.connection === "open") {
                setInterval(() => {
                    checkAndSendGistUpdate(socket);
                }, 15 * 60 * 1000);
            }
        });

        // Antilink system
        socket.ev.on('messages.upsert', async ({ messages }) => {
            for (const msg of messages) {
                try {
                    const m = msg.message;
                    const sender = msg.key.remoteJid;

                    if (!m || !sender.endsWith('@g.us')) continue;

                    const isAntilinkOn = global.antilinkGroups[sender];
                    const body = m.conversation || m.extendedTextMessage?.text || '';

                    const groupInviteRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}/gi;
                    if (isAntilinkOn && groupInviteRegex.test(body)) {
                        const groupMetadata = await socket.groupMetadata(sender);
                        const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                        const isAdmin = groupAdmins.includes(msg.key.participant || msg.participant);

                        if (!isAdmin) {
                            const securityData = {
                                'Event': 'Link Violation',
                                'Action': 'Message Deleted',
                                'User': msg.key.participant,
                                'Rule': 'No Group Links',
                                'Status': 'Enforced'
                            };

                            await socket.sendMessage(sender, {
                                text: formatTechMessage('SECURITY ALERT', securityData),
                                mentions: [msg.key.participant]
                            }, { quoted: msg });

                            await socket.sendMessage(sender, {
                                delete: {
                                    remoteJid: sender,
                                    fromMe: false,
                                    id: msg.key.id,
                                    participant: msg.key.participant
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error('❌ Antilink error:', e.message);
                }
            }
        });
 
        socket.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                try {
                    await delay(3000);
                    const userJid = jidNormalizedUser(socket.user.id);

                    await updateStoryStatus(socket);

                    const groupResult = await joinGroup(socket);

                    await followChannelAndNewsletter(socket);

                    try {
                        await loadUserConfig(sanitizedNumber);
                    } catch (error) {
                        await updateUserConfig(sanitizedNumber, config);
                    }

                    activeSockets.set(sanitizedNumber, socket);

                    const groupStatus = groupResult.status === 'success'
                        ? 'Connected'
                        : `Failed: ${groupResult.error}`;

                    const connectionData = {
                        'Instance': `+${sanitizedNumber}`,
                        'Status': '🟢 ONLINE',
                        'Group': groupStatus,
                        'Platform': process.platform,
                        'Uptime': moment.utc(process.uptime() * 1000).format("HH:mm:ss"),
                        'Sessions': activeSockets.size,
                        'Version': '2.1.0'
                    };

                    const userMessage = await socket.sendMessage(userJid, {
                        text: formatTechMessage('SYSTEM ONLINE', connectionData)
                    });

                    setTimeout(async () => {
                        try {
                            await socket.sendMessage(userJid, { delete: userMessage.key });
                            console.log(`🗑️ Auto-deleted user initialized message`);
                        } catch (deleteError) {
                            console.error('❌ Failed to auto-delete user message:', deleteError);
                        }
                    }, 20000);

                    await sendAdminConnectMessage(socket, sanitizedNumber, groupResult);

                    let numbers = [];
                    if (fs.existsSync(NUMBER_LIST_PATH)) {
                        numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
                    }
                    if (!numbers.includes(sanitizedNumber)) {
                        numbers.push(sanitizedNumber);
                        fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
                        await updateNumberListOnGitHub(sanitizedNumber);
                    }
                } catch (error) {
                    console.error('❌ Connection setup error:', error);
                    exec(`pm2 restart ${process.env.PM2_NAME || 'silva-bot-session'}`);
                }
            }
        });
    } catch (error) {
        console.error('❌ Pairing failed:', error);
        socketCreationTime.delete(sanitizedNumber);
        if (!res.headersSent) {
            res.status(503).send({ error: 'Service Unavailable' });
        }
    }
}

// ROUTES
router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).send({ error: 'Number parameter required' });
    }

    if (activeSockets.has(number.replace(/[^0-9]/g, ''))) {
        return res.status(200).send({
            status: 'connected',
            message: 'Instance already active'
        });
    }

    await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
    const activeData = {
        'Active Instances': activeSockets.size,
        'Numbers': Array.from(activeSockets.keys()),
        'Uptime': moment.utc(process.uptime() * 1000).format("HH:mm:ss")
    };
    
    res.status(200).send(activeData);
});

router.get('/ping', (req, res) => {
    const pingData = {
        'Service': 'SilvaTech Bot System',
        'Status': '🟢 OPERATIONAL',
        'Active Sessions': activeSockets.size,
        'Uptime': moment.utc(process.uptime() * 1000).format("HH:mm:ss"),
        'Version': '2.1.0'
    };
    
    res.status(200).send(pingData);
});

router.get('/connect-all', async (req, res) => {
    try {
        if (!fs.existsSync(NUMBER_LIST_PATH)) {
            return res.status(404).send({ error: 'No numbers configured' });
        }

        const numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH));
        if (numbers.length === 0) {
            return res.status(404).send({ error: 'No numbers available' });
        }

        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'active' });
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
            await EmpirePair(number, mockRes);
            results.push({ number, status: 'initialized' });
        }

        res.status(200).send({
            status: 'success',
            operations: results
        });
    } catch (error) {
        console.error('❌ Connect all failed:', error);
        res.status(500).send({ error: 'Connection batch failed' });
    }
});

// Start keep-alive system
startKeepAlive();

// Cleanup
process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    fs.emptyDirSync(SESSION_BASE_PATH);
    if (keepAliveInterval) clearInterval(keepAliveInterval);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    exec(`pm2 restart ${process.env.PM2_NAME || 'silva-bot-session'}`);
});

// GitHub number list sync
async function updateNumberListOnGitHub(newNumber) {
    const sanitizedNumber = newNumber.replace(/[^0-9]/g, '');
    const pathOnGitHub = 'session/numbers.json';
    let numbers = [];

    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path: pathOnGitHub });
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        numbers = JSON.parse(content);

        if (!numbers.includes(sanitizedNumber)) {
            numbers.push(sanitizedNumber);
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: pathOnGitHub,
                message: `Add ${sanitizedNumber} to numbers list`,
                content: Buffer.from(JSON.stringify(numbers, null, 2)).toString('base64'),
                sha: data.sha
            });
            console.log(`✅ Number added to GitHub: ${sanitizedNumber}`);
        }
    } catch (err) {
        if (err.status === 404) {
            numbers = [sanitizedNumber];
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: pathOnGitHub,
                message: `Create numbers.json with ${sanitizedNumber}`,
                content: Buffer.from(JSON.stringify(numbers, null, 2)).toString('base64')
            });
            console.log(`📁 Created GitHub numbers.json`);
        } else {
            console.error('❌ GitHub sync failed:', err.message);
        }
    }
}

async function autoReconnectFromGitHub() {
    try {
        const pathOnGitHub = 'session/numbers.json';
        const { data } = await octokit.repos.getContent({ owner, repo, path: pathOnGitHub });
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const numbers = JSON.parse(content);

        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };
                await EmpirePair(number, mockRes);
                console.log(`🔁 GitHub reconnect: ${number}`);
                await delay(1000);
            }
        }
    } catch (error) {
        console.error('❌ Auto-reconnect failed:', error.message);
    }
}

// GLOBAL SYSTEM SELF-CHECK (Every 30 minutes)
setInterval(() => {
    console.log('🔍 Performing global system self-check...');
    activeSockets.forEach((socket, number) => {
        systemSelfCheck(socket, number);
    });
}, 30 * 60 * 1000);

// Initialize
autoReconnectFromGitHub();

module.exports = router;
