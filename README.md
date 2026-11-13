# Lomi Media & Communication — Website Starter

A premium, responsive React/TypeScript and Node.js/Express business website. Prepared as an expandable starter for a media, communications, and creative services company.

**Status:** Development starter, **not a published production website**. Do not publish unverified company details, creative examples, or the draft privacy notice as final claims.

## Features

- Responsive Home, Services, Work, About, Contact and draft Privacy pages
- Original editable wordmark, design system and CSS illustrations (no stock-photo dependency)
- Accessible navigation, keyboard focus, semantic content and reduced-motion support
- Contact form connected to an Express API with validation, request limiting and spam honeypot
- Private starter SQLite database for saving inquiries on the API server
- Easy to extend into PostgreSQL, CMS, multilingual pages, client portal and full portfolio
- Basic schema unit tests, GitHub Actions verification and architecture/deployment documentation

## 1. Install prerequisites on Windows

1. Install Node.js **26 LTS** from https://nodejs.org/ (Node.js 24 LTS also works). Then open a NEW PowerShell terminal and verify `node --version` and `npm --version`.
2. Install Visual Studio Code: https://code.visualstudio.com/
3. Optional but recommended: Git https://git-scm.com/downloads

## 2. Save the project in an organized folder

The recommended Windows location is:

```text
C:\Users\YOUR_USERNAME\Documents\LomiMedia\lomi-media-platform\
```

In PowerShell, after downloading the ZIP to `Downloads`:

```powershell
New-Item -ItemType Directory -Force "$HOME\Documents\LomiMedia"
Expand-Archive -Path "$HOME\Downloads\lomi-media-platform.zip" -DestinationPath "$HOME\Documents\LomiMedia" -Force
cd "$HOME\Documents\LomiMedia\lomi-media-platform"
code .
```

If `code .` does not work, open VS Code manually and choose **File → Open Folder**.

## 3. Install and run

```powershell
# Run from the lomi-media-platform root:
npm install
npm run dev
```

Open the website in a browser at **http://localhost:5173**.

The API runs on **http://localhost:4000** and its health endpoint is **http://localhost:4000/api/health**.

The first submitted contact form creates `server/data/lomi-contacts.sqlite`. The `.sqlite` database is deliberately ignored by Git. Lead records survive local restarts.

Run in another terminal from the same root to see the 50 latest inquiry headers:

```powershell
npm run leads
```

**Important:** The form currently stores messages in SQLite but does **not** send email notifications. Check inquiries using `npm run leads` during development. Before going live, add secure staff notifications, administrative access and data-retention practices. The listing command intentionally omits message bodies.

## 4. Scripts

| Root script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite and Express concurrently |
| `npm run build` | Check TypeScript and build the frontend |
| `npm run check` | TypeScript checking and API schema tests |
| `npm run start:api` | Start only the API |
| `npm run leads` | View the latest stored inquiry summaries in terminal |

Backend environment variables are documented in `server/.env.example`.
Frontend environment variables are documented in `client/.env.example`.
Copy `.env.example` to `.env` if you need to customize settings; local defaults are already configured.

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Never commit `.env`, private keys or the SQLite file to source control.

## 5. Structure

```text
lomi-media-platform/
├── client/                     React + Vite + TypeScript
│   ├── public/                 Favicon, robots.txt
│   ├── src/
│   │   ├── components/         Reusable header/footer/work cards
│   │   ├── data/               Services, sample project content
│   │   ├── pages/              Home, Services, Work, About, Contact, Privacy
│   │   ├── App.tsx             Browser routes
│   │   ├── main.tsx            React entry point
│   │   └── styles.css          Responsive design system
│   └── vite.config.ts          Local API proxy
├── server/
│   ├── src/
│   │   ├── app.js             API routes, protections
│   │   ├── schema.js          Inquiry validation rules
│   │   ├── database.js        SQLite initialization
│   │   └── index.js           Node server entry point
│   ├── scripts/list-leads.js
│   └── tests/schema.test.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── BRAND-AND-CONTENT.md
│   └── ROADMAP.md
├── .github/workflows/ci.yml
├── package.json              npm workspaces and shared scripts
└── README.md
```

## 6. Edit content and visuals

| What to change | File |
| --- | --- |
| Service offerings and sample work | `client/src/data/content.ts` |
| Home page text and hero | `client/src/pages/Home.tsx` |
| About / values | `client/src/pages/About.tsx` |
| Form fields and service menu | `client/src/pages/Contact.tsx` and `server/src/schema.js` |
| Brand colors, layout and typography | `client/src/styles.css` |
| Footer navigation and social links | `client/src/components/Layout.tsx` |
| Search snippet / page head defaults | `client/index.html` |
| Company privacy notice | `client/src/pages/Privacy.tsx` (must be professionally reviewed) |

## 7. Expansion and release

Read `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/BRAND-AND-CONTENT.md` and `docs/ROADMAP.md` before publishing. A Vite SPA is an excellent interactive starter, but marketing websites that need strong multilingual SEO should later add server rendering or pre-rendering with per-page metadata, canonical URLs, sitemap and language tags.

**Verification note:** The project source has been prepared in this environment. Installing npm dependencies here was blocked by unavailable registry access. Install dependencies on your own machine and execute `npm run check` and `npm run build` before deployment. Do not represent this package as production audited.
