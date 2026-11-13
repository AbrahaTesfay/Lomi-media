# Deployment — v2 notes

1. Verify `npm install`, `npm run check`, and `npm run build` locally.
2. Use Node LTS, persistent database storage/managed database, backups and monitoring.
3. Route both the built React frontend and Node API through ONE HTTPS origin: `https://yourdomain.example/` for React and `https://yourdomain.example/api/` to Express. SPA fallback must not redirect `/api` paths to `index.html`.
4. Set production `NODE_ENV=production`, `CORS_ORIGINS=https://yourdomain.example`, `TRUST_PROXY=true` only when behind a controlled proxy, and database paths to persistent storage.
5. Set initial `ADMIN_EMAIL` and `ADMIN_PASSWORD` on the first startup. Once the user is bootstrapped, remove the raw password environment variable and keep the database backed up.
6. If using split frontend/backend sites, the default SameSite Strict session cookie will not work cross-site. Deploy same-origin or redesign auth with a security specialist.
7. Verify business phone/WhatsApp and policies. Never publish the sample privacy notice as final.
8. License third-party news material before integrating live syndication feeds.
9. Advertising payments, provider integration, invoices and tax compliance must be implemented separately and tested.

**Never put secrets in Vite's `VITE_` variables or commit `.env` files.** Only use them for intentionally public settings, e.g. verified WhatsApp business number.
