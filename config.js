const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({
    path: './config.env'
});

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
    LANG: 'en',
    WELCOME: 'true',
    AUTO_VIEW_STATUS: 'true',
    AUTO_VOICE: 'true',
    AUTO_LIKE_STATUS: 'true',
    AUTO_RECORDING: 'true',
    HEROKU_APP_URL: 'https://silva-mini-bob-xmd.onrender.com/',
    AUTO_LIKE_EMOJI: ['💥', '👍', '😍', '💗', '🎈', '🎉', '🥳', '😎', '🚀', '🔥'],
    PREFIX: '.',
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: 'https://chat.whatsapp.com/J1h8UQencpe7wTwvS7hHxj',
    ADMIN_LIST_PATH: './lib/admin.json',
    RCD_IMAGE_PATH: 'https://files.catbox.moe/bkufwo.jpg',
    NEWSLETTER_JID: '120363200367779016@newsletter',
    NEWSLETTER_MESSAGE_ID: '428',
    OTP_EXPIRY: 300000,    OWNER_NUMBER: '254701513650',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v',
    GIST_URL: 'https://gist.githubusercontent.com/SilvaTechDev/8fdbbfb81639750b3170dc00103272c2/raw'
};

