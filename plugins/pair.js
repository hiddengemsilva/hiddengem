const axios = require("axios");
const config = require("../config");

// App URL - Updated to match your domain
const APP_BASE_URL = 'https://silvaconnect.silvatech.top';

module.exports = {
  command: "pair",
  desc: "Get pairing code for SILVA TECH AI bot",
  use: ".pair 254743706010",
  filename: __filename,
  category: "SETUP",
  owner: false,

  execute: async (socket, msg, args) => {
    try {
      // Modern message templates
      const messages = {
        welcome: `🤖 *SILVA TECH BOT SETUP* 🤖

✨ Ready to activate your personal AI assistant?

Simply send:
*.pair YOUR_NUMBER*

📱 *Example:*
\`.pair 254743706010\`

I'll generate your unique pairing code instantly!`,

        invalid: `❌ *Invalid Number Format*

Please provide a valid WhatsApp number with country code.

📍 *Format:* 
\`+[CountryCode][Number]\`

📋 *Examples:*
• \`+254743706010\`
• \`+1234567890\`
• \`+447123456789\``,

        processing: `⏳ *Processing Your Request...*

🔍 Validating number...
🔄 Connecting to SILVA TECH...
📱 Generating pairing code...

Please wait a moment...`,

        success: `✅ *PAIRING CODE GENERATED*

🎉 Your SILVA TECH Bot is ready for activation!

📋 *Your Pairing Code:*
\`{code}\`

🚀 *Next Steps:*
1. Open WhatsApp → Settings
2. Tap on "Linked Devices"
3. Select "Link a Device"
4. Enter the code above
5. Start using your AI assistant!`,

        error: `😔 *Connection Issue*

Unable to generate pairing code at the moment.

🔧 *Possible Reasons:*
• Server maintenance
• Network connectivity
• Invalid number format

🔄 Please try again in a few minutes.`
      };

      // Get sender details with modern destructuring
      const { key: { remoteJid, participant } = {} } = msg;
      const senderId = remoteJid || participant || "";
      const senderNumber = senderId.split("@")[0];

      // Extract phone number from args
      const phoneNumber = args.length > 0 ? args[0].trim().replace(/\s+/g, "") : "";

      // No number provided - show help
      if (!phoneNumber) {
        return await socket.sendMessage(
          remoteJid,
          { 
            text: messages.welcome,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363200367779016@newsletter',
                newsletterName: 'SILVA TECH',
                serverMessageId: 143
              }
            }
          },
          { quoted: msg }
        );
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return await socket.sendMessage(
          remoteJid,
          { 
            text: messages.invalid,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true
            }
          },
          { quoted: msg }
        );
      }

      // Send processing message
      await socket.sendMessage(
        remoteJid,
        { 
          text: messages.processing,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true
          }
        },
        { quoted: msg }
      );

      // Generate pairing code via API
      const apiUrl = `${APP_BASE_URL}/?number=${encodeURIComponent(phoneNumber.replace('+', ''))}`;
      
      console.log(`🔗 Generating pairing code for: ${phoneNumber}`);
      
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'SILVA-TECH-BOT/2.0.0',
          'Accept': 'application/json'
        }
      });

      // Handle API response
      if (!response.data?.code) {
        throw new Error('No pairing code received from server');
      }

      const pairingCode = response.data.code;
      
      console.log(`✅ Pairing code generated: ${pairingCode} for ${phoneNumber}`);

      // Send success message with pairing code
      await socket.sendMessage(
        remoteJid,
        { 
          text: messages.success.replace('{code}', pairingCode),
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'SILVA TECH',
              serverMessageId: 143
            }
          }
        },
        { quoted: msg }
      );

      // Optional: Send code as separate message for easy copy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await socket.sendMessage(
        remoteJid,
        { 
          text: `📋 *QUICK COPY:* \`${pairingCode}\``,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true
          }
        }
      );

      // Log successful pairing
      console.log(`🎯 Pairing completed for ${phoneNumber} by ${senderNumber}`);

    } catch (error) {
      console.error("❌ Pair command error:", error);
      
      const { key: { remoteJid } = {} } = msg;
      
      // Enhanced error handling
      let errorMessage = `😔 *Connection Issue*

We encountered an error while generating your pairing code.

🔧 *Technical Details:*
${error.message || 'Unknown error'}

🔄 Please try again in a few minutes.`;

      if (error.code === 'ECONNREFUSED') {
        errorMessage = `🌐 *Server Unavailable*

The SILVA TECH server is currently undergoing maintenance.

⏰ *Please try again in:*
• 5-10 minutes

We're working to restore service as quickly as possible.`;
      } else if (error.response?.status === 404) {
        errorMessage = `🔍 *Service Not Found*

The pairing service is temporarily unavailable.

📞 *Contact Support:*
Visit silvatech.top for assistance.`;
      }

      await socket.sendMessage(
        remoteJid,
        { 
          text: errorMessage,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true
          }
        },
        { quoted: msg }
      );
    }
  },

  // Additional helper methods for modern plugin structure
  help: () => {
    return {
      name: "pair",
      description: "Generate pairing code for SILVA TECH bot",
      usage: ".pair <number>",
      examples: [
        ".pair 254743706010",
        ".pair +254743706010"
      ],
      notes: [
        "🌍 Include country code with your number",
        "📱 Number should be 10-15 digits",
        "⚡ Code expires after 5 minutes"
      ]
    };
  },

  // Plugin metadata for modern bot systems
  metadata: {
    version: "2.0.0",
    author: "SILVA TECH",
    repository: "https://github.com/SilvaTechB/silva-md-bot",
    license: "MIT",
    compatibility: ["baileys", "whatsapp-web.js"],
    dependencies: ["axios"]
  }
};
