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

## Account registration and email verification

- Existing administrator accounts and historical member accounts are preserved by the SQLite migration.
- Newly registered members must acknowledge the privacy notice and confirm their email through a one-time token before signing in. Confirmation expires after 24 hours; the `/account` page allows resending a new link.
- Public signup is unavailable until SMTP is configured; it does not create unusable accounts if email sending fails.
- Set `APP_BASE_URL=https://yourdomain.example` on the backend so confirmation and password-reset links lead to your actual HTTPS frontend.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` as private backend environment variables. Use an authenticated sender on a verified domain.
- Password reset links expire after 15 minutes, are stored as hashes, are single-use, and revoke existing sessions when redeemed.
- Replace the draft privacy notice and any sample administrator email before opening signup to the public.
- Before upgrading a live SQLite database: stop the server, create a consistent private database backup (including WAL handling or SQLite backup API), deploy the updated app, and run integration tests. Do not delete the original database.
- Test signup email delivery, token expiration, resends, regular login, administrator login, and permission isolation in a real browser. CI does not validate provider delivery.
- Review abuse controls, accessibility, privacy compliance, monitoring, and rollback procedures before production release.

## Public content and commercial integrations

- The newsroom search uses the existing database of original articles. External publishers are linked rather than copied; licensed syndication requires separate provider approval.
- The admin overview includes real database counts for article statuses, advertising campaigns, projects, inquiries, and registered users.
- Advertising payments are still offline/manual verification only. Invoicing, online payments, performance measurement, and financial compliance require separate reviewed implementation.
- Public deployment, domain purchase, provider contracts, or publication of real customer content must be explicitly approved.
