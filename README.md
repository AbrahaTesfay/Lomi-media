# Lomi Media & Communication — Website v2 (Upgrade Source)

React + TypeScript + Vite frontend; Node.js + Express + SQLite backend.

**Open `UPGRADE-GUIDE.md` first.** To update an existing Windows GitHub project, run the included `INSTALL-UPDATE.ps1` from the extracted upgrade folder. Do not delete or replace the `.git`, `server/data`, or private `.env` files.

## What's new

- Expanded media and advertising service descriptions.
- Public portfolio that shows only admin-published, authorized projects; the pre-existing concepts are labeled as concepts.
- Original news/blog publishing and links to independent international news sources.
- Advertising request form and paid sponsor placements with mandatory editorial disclosure.
- Protected admin dashboard (news/blog, portfolio, campaigns, advertiser and project inquiries).
- English/Amharic/Tigrinya **partial** interface localization.
- Optional verified WhatsApp link on the contact page.
- Responsive page styling and navigation.

## Development commands

```powershell
npm install
npm run check
npm run build
npm run dev
```

Local website: http://localhost:5173
Local API health: http://localhost:4000/api/health
Admin page: http://localhost:5173/admin

Server bootstrap settings: see `server/.env.example`.
Optional WhatsApp configuration: see `client/.env.example`.

Do not commit `.env` or the SQLite database. No live headlines are copied from Reuters/AP/BBC/DW. No automated checkout is included. Production launch requires additional security, privacy, and deployment work.
