# System architecture — Version 2

- **Web:** React 19 / TypeScript / Vite under `client/`. API requests through same-origin `/api` in local development (Vite proxy) and recommended production deployment.
- **API:** Express 5 under `server/`, Helmet, CORS origin allowlist, JSON length limits, Zod request validation and route limiting.
- **Persistence:** `node:sqlite` database; contact inquiries, advertising requests, original articles, public portfolio projects, admin users, sessions, sponsored campaigns. Development SQLite is local, not appropriate for ephemeral hosts without a persistent volume.
- **Admin:** Password hashes via scrypt, server-side hashed session identifiers, HttpOnly SameSite Strict cookies and CSRF-token validation on mutations. First-time admin creation from server env. No public registration.
- **Advertising:** Campaigns only visible if active, payment_verified=true and within start/end dates. Displayed with a conspicuous Paid advertisement label and sponsored nofollow external links. Payment processing is NOT included.
- **News:** Original in-house editorial entries and outbound links to publisher websites only. No unauthorized mirroring of full third-party articles or news assets.
- **Multilingual:** Key navigation, headings and select copy translated into en/am/ti. Complete localization and review are future work.

This project is a development starter. Perform an independent security audit prior to publishing the management interface publicly.
