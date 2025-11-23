# [DEPLOY](https://dashboard.heroku.com/new?template=)
# 🤖 SILVA-MD MINI BOT

<div align="center">

![SILVA-MD](https://files.catbox.moe/5uli5p.jpeg)

### ✨ *Advanced WhatsApp Bot with Multi-Device Support* ✨

[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()
[![Baileys](https://img.shields.io/badge/Baileys-WhiskeySockets-green.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

*A powerful, feature-rich WhatsApp bot built with Node.js and Baileys library*

</div>

---

## 🚀 **Features Overview**

### 🤖 **Core Capabilities**
- ✅ **Multi-Device Support** - Run multiple bots simultaneously
- ✅ **Auto-Reconnect** - Automatic session restoration
- ✅ **Session Persistence** - Cloud backup via GitHub
- ✅ **Plugin System** - Modular command architecture
- ✅ **Group Management** - Advanced group features

### 🎯 **Smart Automation**
- 📱 **Auto Status Viewer** - Automatically views status updates
- ❤️ **Auto Status React** - Reacts to status with random emojis
- 🔔 **Welcome/Goodbye Messages** - Automated group greetings
- 📰 **Newsletter Handler** - Auto-follow and react to newsletters
- ⏺️ **Auto Recording** - Sets recording presence in chats

### 🛡️ **Security & Moderation**
- 🚫 **Anti-Link Protection** - Detect and remove group invites
- 👑 **Admin System** - Multi-level admin controls
- 🔐 **OTP Verification** - Secure configuration updates
- 📝 **Message Logger** - Track deleted messages

### 🌐 **Cloud Integration**
- ☁️ **GitHub Backup** - Automatic session backup
- 🔄 **Auto Restore** - Session recovery from cloud
- 📊 **Multi-Number Management** - Centralized control panel

---

## 📦 **Installation**

### **Prerequisites**
- Node.js 18 or higher
- GitHub Account
- WhatsApp Number

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/silva-md-mini.git
cd silva-md-mini
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create `.env` file:
```env
# Bot Configuration
WELCOME=true
AUTO_VIEW_STATUS=true
AUTO_VOICE=true
AUTO_LIKE_STATUS=true
AUTO_RECORDING=true
PREFIX=.

# GitHub Configuration  
GITHUB_TOKEN=your_github_token_here
OWNER=your_github_username
REPO=your_repo_name

# Admin & Channels
OWNER_NUMBER=94700000000
GROUP_INVITE_LINK=https://chat.whatsapp.com/yourgroup
CHANNEL_LINK=your_channel_link
GIST_URL=your_gist_url

# Server
HEROKU_APP_URL=your_app_url
```

### **4. Setup GitHub Secrets**
1. Generate GitHub Personal Access Token
2. Add token to environment variables
3. Configure repository for session storage

### **5. Start Bot**
```bash
# Development
npm start

# Production with PM2
pm2 start index.js --name "silva-md-bot"
```

---

## 🔧 **API Endpoints**

### **Bot Management**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/?number=947XXXXXXX` | GET | Pair new bot instance |
| `/active` | GET | List active sessions |
| `/connect-all` | GET | Connect all saved numbers |
| `/reconnect` | GET | Reconnect from GitHub sessions |

### **Configuration**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/update-config` | GET | Update bot configuration |
| `/verify-otp` | GET | Verify OTP for config changes |
| `/getabout` | GET | Get user about status |

---

## 🎮 **Bot Commands**

### **Basic Commands**
- `.help` - Show help menu
- `.ping` - Check bot status
- `.info` - Bot information

### **Admin Commands**  
- `.broadcast` - Broadcast message
- `.config` - Bot configuration
- `.restart` - Restart bot

### **Group Commands**
- `.welcome on/off` - Toggle welcome messages
- `.antilink on/off` - Toggle anti-link protection
- `.promote @user` - Promote to admin
- `.demote @user` - Demote from admin

---

## 🏗️ **Architecture**

### **Project Structure**
```
silva-md-mini/
├── lib/
│   ├── database.js
│   └── id_db.js
├── plugins/
│   ├── help.js
│   ├── ping.js
│   └── [command].js
├── session/
│   └── [session_files]
├── index.js
└── README.md
```

### **Key Components**
- **Session Manager** - Handles multi-device authentication
- **Plugin Loader** - Dynamic command loading
- **GitHub Sync** - Cloud session backup
- **Event Handlers** - Real-time message processing
- **Config Manager** - Dynamic configuration system

---

## ⚙️ **Configuration Options**

### **Bot Settings**
```javascript
const config = {
    WELCOME: true,              // Welcome messages
    AUTO_VIEW_STATUS: true,     // Auto view status
    AUTO_VOICE: true,           // Auto voice messages
    AUTO_LIKE_STATUS: true,     // Auto like status
    AUTO_RECORDING: true,       // Auto recording presence
    PREFIX: '.',               // Command prefix
    MAX_RETRIES: 3,            // Connection retries
    OTP_EXPIRY: 300000         // OTP expiration (5 mins)
};
```

### **Auto Reaction Emojis**
```javascript
AUTO_LIKE_EMOJI: ['🥹', '👍', '😍', '💗', '🎈', '🎉', '🥳', '😎', '🚀', '🔥']
```

---

## 🔒 **Security Features**

### **OTP Protection**
- 6-digit OTP for sensitive operations
- 5-minute expiration
- Secure delivery via WhatsApp

### **Admin Controls**
- Multi-admin support
- JSON-based admin list
- Restricted command access

### **Session Security**
- Encrypted session storage
- GitHub backup with tokens
- Automatic session cleanup

---

## 🌐 **Deployment**

### **Local Deployment**
```bash
npm install
node index.js
```

### **PM2 Deployment**
```bash
pm2 start index.js --name "silva-bot"
pm2 save
pm2 startup
```

### **Heroku Deployment**
```bash
git push heroku main
```

### **Environment Variables**
Ensure all required environment variables are set in your deployment platform.

---

## 🛠️ **Development**

### **Creating Plugins**
Create new commands in `plugins/` directory:

```javascript
module.exports = {
    command: 'ping',
    description: 'Check bot response time',
    execute: async (socket, msg, args, number) => {
        await socket.sendMessage(msg.key.remoteJid, {
            text: '🏓 Pong! Bot is active and responsive.'
        });
    }
};
```

### **Event Handlers**
- `messages.upsert` - Message processing
- `connection.update` - Connection management
- `group-participants.update` - Group events
- `messages.delete` - Message deletion tracking

---

## 📊 **Monitoring**

### **Health Check**
```bash
curl https://your-app.herokuapp.com/ping
```

### **Active Sessions**
```bash
curl https://your-app.herokuapp.com/active
```

### **Logs**
```bash
pm2 logs silva-bot
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Session Not Saving**
   - Check GitHub token permissions
   - Verify repository access
   - Check environment variables

2. **Connection Issues**
   - Verify phone number format
   - Check internet connection
   - Restart bot instance

3. **Plugin Errors**
   - Check plugin syntax
   - Verify command registration
   - Check error logs

### **Logs Location**
- Application logs: PM2 logs
- Session files: `./session/`
- Error tracking: Console output

---

## 🤝 **Contributing**

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### **Code Standards**
- Use consistent naming conventions
- Add comments for complex logic
- Test all plugins thoroughly
- Update documentation

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgements**

- **[Baileys](https://github.com/WhiskeySockets/Baileys)** - WhatsApp Web API
- **[Express.js](https://expressjs.com/)** - Web framework
- **[Octokit](https://octokit.github.io/)** - GitHub API client
- **All contributors and testers**

---

## 📞 **Support**

- **Developer:** Silva Tech
- **Website:** [silvatech.top](https://silvatech.top)
- **Issues:** [GitHub Issues](https://github.com/your-username/silva-md-mini/issues)
- **Documentation:** [Wiki](https://github.com/your-username/silva-md-mini/wiki)

---

<div align="center">

### **⭐ Star this repository if you find it helpful!**

**SILVA-MD MINI BOT** - *Powering your WhatsApp experience* 🤖

</div>
