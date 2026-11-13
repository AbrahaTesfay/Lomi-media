# Lomi Media & Communication — upgrade existing GitHub website

This upgrade is intended for the existing local Git repository at:
`C:\Users\AM\Documents\LomiMedia\lomi-media-platform`
GitHub: `https://github.com/AbrahaTesfay/Lomi-media`

**Important:** No project is pushed or deployed by this package. Do not expose the admin dashboard to the public until it has been tested, reviewed and deployed with HTTPS on an appropriately configured same-origin frontend/API setup. Paid online checkout is NOT implemented.

## 1. Download and extract

Download `lomi-media-upgrade-v2.zip` and place it in Windows `Downloads`. Run PowerShell:

```powershell
$Stage = Join-Path $HOME 'Downloads\LomiUpgradeStage'
New-Item -ItemType Directory -Force $Stage | Out-Null
Expand-Archive -Path (Join-Path $HOME 'Downloads\lomi-media-upgrade-v2.zip') -DestinationPath $Stage -Force
cd (Join-Path $Stage 'lomi-media-platform-v2')
```

## 2. Apply upgrade safely

Run from extracted v2 directory:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\INSTALL-UPDATE.ps1
```

The script:
- Checks you have an existing `.git` repository.
- Refuses to overwrite a working tree that has uncommitted changes.
- Creates a local Git backup tag (`backup-before-lomi-v2-...`).
- Copies the upgrade source into your CURRENT repository without deleting files.
- Preserves `.git`, `node_modules`, secrets (`.env`), SQLite database and current `package-lock.json`.
- DOES NOT call `git push` or run any online payment provider.

## 3. Install dependencies and validate

```powershell
cd "$HOME\Documents\LomiMedia\lomi-media-platform"
npm install
npm run check
npm run build
```

If any command fails, fix the error before proceeding. Run the website:

```powershell
npm run dev
```

Browser: http://localhost:5173
Backend health: http://localhost:4000/api/health

## 4. Set up the administrator ONCE

In a NEW PowerShell window, while `npm run dev` is STOPPED, from project root:

```powershell
if (-not (Test-Path 'server\.env')) { Copy-Item 'server\.env.example' 'server\.env' }
$strongPassword = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
Write-Host 'Save this one-time administrator password securely:'
Write-Host $strongPassword
notepad 'server\.env'
```

In `server/.env`, replace the sample lines with your real private administrator email and the generated password:

```dotenv
ADMIN_EMAIL=YOUR_VERIFIED_EMAIL
ADMIN_PASSWORD=PASTE_YOUR_GENERATED_PASSWORD_HERE
```

**Do not** put your login password in ChatGPT, screenshots, issue trackers, GitHub, or public websites.

Start again with `npm run dev`. On the first startup, the server stores a securely derived password hash in the local SQLite DB and creates the initial administrator account. Open http://localhost:5173/admin and sign in. After the initial account exists, remove both `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `server/.env` (or comment out their lines) and restart the server; the admin user remains in the database. Back up the SQLite database securely.

If the server already created a user before your update, you must continue using that account; changing bootstrap variables will not reset its password.

## 5. WhatsApp business contact

If not present, copy `client/.env.example` to `client/.env`:

```powershell
if (-not (Test-Path 'client\.env')) { Copy-Item 'client\.env.example' 'client\.env' }
notepad 'client\.env'
```

Set `VITE_PUBLIC_WHATSAPP_NUMBER` to your VERIFIED business number, international country code included, digits only (example placeholder: `2519XXXXXXXX`). Do not include `+`, dashes, spaces or a guessed phone number. Restart `npm run dev` after changing Vite environment variables.

## 6. How to add news

Navigate to http://localhost:5173/admin, sign in, select **News & blog**, write a title, original article body, excerpt, category, and language. Select `published` and save. The story will appear at `/news` and get a detail URL. Only publish original or licensed content. The **External sources** section contains links to Reuters, AP, BBC and Deutsche Welle; it does not scrape, syndicate or copy those publishers, and it does not currently fetch live headlines.

## 7. How to run paid advertisements

An advertiser can send a request on `/advertise`. Go to `/admin` > **Ad inquiries** to review. Agree on pricing privately and VERIFY payment via your own business records. Then in **Paid campaigns** enter company, approved URL, headline, description, placement and schedule. Mark payment verified and set status to `active` only after approval. The placement appears with a prominent **Paid advertisement** label while dates are valid.

This project does NOT support payment card checkout, receipt generation, invoicing or automated payment verification. Add those only with a licensed provider and audited payment webhook integration.

## 8. How to add portfolio projects

Open `/admin` > **Portfolio**. Enter a client-approved project title, category, description and optional case-study URL. Set status `published`. It appears on `/work`. The original illustrative examples remain identified as concepts, not delivered client projects.

## 9. Multilingual content

Use the header selector (`EN`, `አማ`, `ትግ`). The initial upgrade translates key navigation and some hero/headline messages in English, Amharic, and Tigrinya. Many deeper sections and forms remain in English pending full translations and editorial review. Article content can be published in any of these three languages; this initial version does not auto-translate the article body.

## 10. Commit and push to the SAME GitHub repository

```powershell
cd "$HOME\Documents\LomiMedia\lomi-media-platform"
git remote -v
# If remote is wrong, set the correct ORIGINAL repository:
git remote set-url origin https://github.com/AbrahaTesfay/Lomi-media.git

git status
# Check that no .env, database, credentials, or other secrets are staged.
git add .
git diff --cached --name-only
git commit -m "Add Lomi newsroom, advertising, portfolio and admin features"
git push -u origin main
```

Open https://github.com/AbrahaTesfay/Lomi-media to confirm the files are present.

## 11. Useful file locations

- `client/src/data/content.ts`: service descriptions and sample portfolio concepts
- `client/src/pages/Home.tsx`: homepage
- `client/src/pages/Newsroom.tsx`: newsroom and publisher links
- `client/src/pages/ArticleDetail.tsx`: story detail page
- `client/src/pages/Advertise.tsx`: advertiser inquiry packages
- `client/src/pages/Admin.tsx`: CMS dashboard for writing, campaigns and portfolios
- `client/src/pages/Work.tsx`: portfolio page
- `client/src/pages/Contact.tsx`: inquiries and WhatsApp
- `client/src/components/SponsoredSlot.tsx`: clearly labeled live ad placements
- `client/src/components/WhatsAppLink.tsx`: official WhatsApp link
- `client/src/lib/i18n.tsx`: partial translations and language switcher
- `client/src/styles.css` and `client/src/features.css`: responsive site styles
- `server/src/app.js`: public and protected REST API routes
- `server/src/auth.js`: staff sessions and CSRF validation
- `server/src/database.js`: database and account bootstrap
- `server/src/schema.js`: input validation
- `server/.env`: server secrets (local only — ignored by Git)
- `client/.env`: frontend PUBLIC configuration (local only — ignored by Git)
- `server/data/lomi-contacts.sqlite`: local database (keep private; not in Git)

## 12. Production launch cautions

- Review the website and translate all pages before claiming complete multilingual support.
- Use HTTPS, a supported Node.js LTS release, persistent database storage and backups.
- Host frontend and API behind the same HTTPS site/domain (e.g. proxy `/api` to the Node server) because admin cookies use `SameSite=Strict`; split-site hosting needs a separate validated authentication deployment design.
- Add monitoring, email notifications, abuse prevention, privacy/retention policy, legal business information, and a real custom domain.
- Get legal/licensing review before syndicating paid or copyrighted news feeds.
- Paid ads must be unmistakably labeled and reviewed for accuracy and legal eligibility.
- Have the auth and payment logic security-reviewed before public deployment; this is a starter, not an audited CMS.
