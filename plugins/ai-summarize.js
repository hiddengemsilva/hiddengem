const fs = require('fs');
const pdfParse = require('pdf-parse');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  command: 'aisummary',
  description: 'Summarize document using Gemini AI',
  execute: async (socket, msg, args) => {
    const sender = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const doc = quoted?.documentMessage;

    if (!doc) {
      return socket.sendMessage(sender, { text: '📎 Please reply to a PDF or TXT file using .summary' });
    }

    const mime = doc.mimetype;
    const stream = await downloadContentFromMessage(doc, 'document');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    let textContent = '';
    if (mime === 'application/pdf') {
      const data = await pdfParse(buffer);
      textContent = data.text;
    } else if (mime === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else {
      return socket.sendMessage(sender, { text: '❌ Only PDF or TXT files are supported.' });
    }

    if (!textContent.trim()) {
      return socket.sendMessage(sender, { text: '❗ Document seems empty.' });
    }

    const summary = await getGeminiSummary(textContent);
    await socket.sendMessage(sender, {
      text: `🧠 *Silva AI Summary:*\n\n${summary}`,
      contextInfo: { forwardingScore: 999, isForwarded: true }
    });
  }
};

async function getGeminiSummary(text) {
  const API_KEY = 'AIzaSyCWP5przqNEqXkcJWN990C-qsbR1AIuBSo'; 
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  const body = {
    contents: [
      {
        parts: [{ text: `Summarize this:\n\n${text.slice(0, 10000)}` }]
      }
    ]
  };

  const res = await fetch(`${url}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary returned.';
}
