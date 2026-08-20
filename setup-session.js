require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = Number.parseInt(process.env.API_ID, 10);
const apiHash = process.env.API_HASH?.trim();

if (!Number.isInteger(apiId) || apiId <= 0 || !apiHash) {
  console.error("Missing or invalid API_ID/API_HASH. Set them in .env or the shell environment.");
  process.exit(1);
}

(async () => {
  const client = new TelegramClient(
    new StringSession(""),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => await input.text("Telegram phone number: "),
    password: async () => await input.text("2FA password (if enabled): "),
    phoneCode: async () => await input.text("Telegram login code: "),
    onError: (err) => console.error("Telegram auth error:", err),
  });

  console.log("\nSESSION STRING:");
  console.log(client.session.save());
  console.log("\nCopy this entire value into Render as the SESSION environment variable.");
  await client.disconnect();
})();
