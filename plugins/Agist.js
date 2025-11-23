const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { exec } = require("child_process");
const execAsync = promisify(exec);

module.exports = {
  command: "dl",
  description: "Extract direct .rar link and send file via WhatsApp",
  use: ".dl <fuckingfast.co link>",

  async run(socket, msg, { text }) {
    const sender = msg.key.remoteJid;

    if (!text || !text.includes("fuckingfast.co")) {
      return socket.sendMessage(sender, { text: "❌ Provide a valid `fuckingfast.co` link." }, { quoted: msg });
    }

    const scraperURL = "https://gist.githubusercontent.com/mrhansamala/c8b0a9588383ac16b1ec52a9b17b355f/raw/7a44b860924069048458136d0797b6eea425ed8a/scraper.py";
    const scraperPath = path.join(__dirname, "scraper.py");

    try {
      // 1. Download scraper.py
      const resp = await axios.get(scraperURL, { responseType: "stream" });
      await new Promise((res, rej) =>
        resp.data.pipe(fs.createWriteStream(scraperPath)).on("finish", res).on("error", rej)
      );

      // 2. Execute Python script
      const { stdout, stderr } = await execAsync(`python3 "${scraperPath}" "${text}"`);
      if (stderr) {
        return socket.sendMessage(sender, { text: "❌ Script error: " + stderr }, { quoted: msg });
      }

      const directLink = stdout.trim();
      if (!directLink.startsWith("http")) {
        return socket.sendMessage(sender, { text: "❌ Couldn't extract direct download link." }, { quoted: msg });
      }

      // 3. Download .rar file
      const fname = decodeURIComponent(text.split("#")[1] || "game.rar");
      const filePath = path.join(__dirname, fname);

      const rarResp = await axios.get(directLink, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      await new Promise((res, rej) =>
        rarResp.data.pipe(fs.createWriteStream(filePath)).on("finish", res).on("error", rej)
      );

      // 4. Send the file via WhatsApp
      await socket.sendMessage(
        sender,
        {
          document: fs.readFileSync(filePath),
          fileName: fname,
          mimetype: "application/vnd.rar",
          caption: "✅ Here is your RAR file",
        },
        { quoted: msg }
      );

      // 5. Clean up
      fs.unlinkSync(filePath);
      fs.unlinkSync(scraperPath);
    } catch (e) {
      console.error(e);
      return socket.sendMessage(sender, { text: "❌ Error processing your request." }, { quoted: msg });
    }
  },
};
