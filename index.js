require("dotenv").config();

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

const API_ID = Number.parseInt(process.env.API_ID, 10);
const API_HASH = process.env.API_HASH?.trim();
const SESSION = process.env.SESSION || "";
const BASE_NAME = process.env.BASE_NAME || "Asad";
const TIMEZONE = process.env.TIMEZONE || "Asia/Tashkent";
const UPDATE_BIO = String(process.env.UPDATE_BIO).toLowerCase() === "true";
const RAMADAN_START = process.env.RAMADAN_START || "";
const RAMADAN_END = process.env.RAMADAN_END || "";

if (!Number.isInteger(API_ID) || API_ID <= 0 || !API_HASH || !SESSION) {
  console.error("Missing or invalid API_ID, API_HASH or SESSION. Set them in .env or Render environment variables.");
  process.exit(1);
}

const client = new TelegramClient(
  new StringSession(SESSION),
  API_ID,
  API_HASH,
  {
    connectionRetries: 5,
  }
);

function getTime() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${Number(values.hour)}:${values.minute}${values.dayPeriod.toLowerCase()}`;
}

function getDateInTimezone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getHolidayDecoration() {
  const date = getDateInTimezone();
  const monthDay = date.slice(5);

  if (monthDay === "12-31" || monthDay === "01-01") return " 🎄✨";
  if (monthDay === "02-14") return " 🎂🎉";
  if (monthDay === "06-01") return " 🎈☀️";
  if (RAMADAN_START && RAMADAN_END && date >= RAMADAN_START && date <= RAMADAN_END) {
    return " 🌙✨";
  }

  return "";
}

function msUntilNextMinute() {
  const now = new Date();
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 250;
}

async function updateProfile() {
  const time = getTime();
  const decoration = getHolidayDecoration();

  // Telegram allows updating firstName/about through account.UpdateProfile.
  // This changes the visible profile name, not the @username.
  const request = {
    firstName: `${BASE_NAME}${decoration} | ${time}`,
  };

  if (UPDATE_BIO) {
    request.about = `Current time: ${time}${decoration}`;
  }

  await client.invoke(new Api.account.UpdateProfile(request));
  console.log(`[${new Date().toISOString()}] Updated profile -> ${request.firstName}`);
}

async function main() {
  await client.connect();

  if (!(await client.checkAuthorization())) {
    throw new Error(
      "This SESSION is not authorized. Generate a StringSession locally with: npm run session"
    );
  }

  console.log(`Connected to Telegram. Timezone: ${TIMEZONE}`);

  await updateProfile();

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, msUntilNextMinute()));

    try {
      await updateProfile();
    } catch (error) {
      console.error("Update failed:", error?.message || error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function shutdown(signal) {
  console.log(`Received ${signal}. Disconnecting...`);
  try {
    await client.disconnect();
  } finally {
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
