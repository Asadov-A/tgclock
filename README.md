# Telegram Time Updater — Node.js + Render

This project uses GramJS (Telegram MTProto API) to update the visible Telegram profile name every minute.

Example:

`Asad | 12:34`

then:

`Asad | 12:35`

## Important

This changes your Telegram **profile first name**, not the `@username`.

The `@username` is a separate Telegram field and should not be treated as a per-minute clock.
Real Telegram stickers cannot be placed inside a profile name, so the project uses emoji decorations instead.

## 1. Get Telegram API credentials

Open https://my.telegram.org/ and go to **API development tools**.

Create an application and copy:

- API ID
- API Hash

Never publish these values in GitHub.

## 2. Generate a StringSession locally

Install Node.js 18+.

Then:

```bash
npm install
```

Set environment variables.

The project loads a local `.env` file automatically. Copy `.env.example` to `.env` and fill in `API_ID` and `API_HASH`, or export them in your shell.

Git Bash:

```bash
cp .env.example .env
# Edit .env and fill in API_ID and API_HASH
```

Windows PowerShell:

```powershell
$env:API_ID="12345678"
$env:API_HASH="your_api_hash"
npm run session
```

If you use Git Bash and prefer shell variables instead of `.env`:

```bash
export API_ID=12345678
export API_HASH="your_api_hash"
npm run session
```

Linux/macOS:

```bash
export API_ID=12345678
export API_HASH="your_api_hash"
npm run session
```

Telegram will ask for your phone number, login code, and 2FA password if enabled.

At the end it prints:

```text
SESSION STRING:
...
```

Keep that string secret. It is effectively a login session for your Telegram account.

## 3. Test locally

Set:

```text
API_ID=...
API_HASH=...
SESSION=...
BASE_NAME=Asad
TIMEZONE=Asia/Tashkent
UPDATE_BIO=false
RAMADAN_START=2026-02-18
RAMADAN_END=2026-03-19
```

Then:

```bash
npm start
```

The profile name should update every minute.
The time uses 12-hour format, for example `10:20 AM` or `2:10 PM`. On December 31 and January 1 it adds `🎄✨`, on February 14 it adds the birthday decoration `🎂🎉🎁`, and on June 1 `🎈☀️`. During the configured Ramadan date range it adds `🌙✨`. Ramadan dates change every year, so update `RAMADAN_START` and `RAMADAN_END` annually.

## 4. Deploy to Render

Push the project to a private GitHub repository.

In Render:

1. New → Background Worker.
2. Connect the GitHub repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables:

```text
API_ID
API_HASH
SESSION
BASE_NAME
TIMEZONE
UPDATE_BIO
```

Use:

```text
TIMEZONE=Asia/Tashkent
```

and:

```text
UPDATE_BIO=false
```

for the default behavior.

Render Background Workers are intended for continuously running processes, so this is the appropriate Render service type. Check Render's current pricing before deploying: an always-on worker may not be included in the free tier.

For a genuinely free always-on option, use an Oracle Cloud Always Free VM or run the worker on a home computer/Raspberry Pi. A free web service that sleeps is unsuitable because the process must stay connected and update the name every minute. GitHub Actions is also not a good fit for this loop because scheduled jobs are not precise enough and may stop between runs.

## 5. Deploy to Hostless

`render.yaml` is a Render-specific Blueprint and Hostless will not normally read it. In Hostless, create a Node.js worker or Docker service manually:

```text
Build command: npm ci --omit=dev
Start command: npm start
Node version: 20
```

The repository now includes a `Dockerfile` for Hostless deployments that support Docker. Add the environment variables in the Hostless dashboard as protected values. Do not upload `.env`.

## 6. Security

Do NOT commit:

- `.env`
- SESSION
- API_HASH
- phone number
- login codes
- 2FA password

If a SESSION or other authorization credential leaks, revoke the Telegram session from Telegram's active sessions and generate a new one.

## Notes

The script aligns updates to the beginning of each minute rather than simply waiting exactly 60 seconds after startup, so the displayed time stays synchronized with the clock.

Render may restart or redeploy a worker. When it starts again, it will reconnect using the SESSION environment variable.
