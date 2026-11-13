# Architecture — Lomi Media & Communication

## Current system (Phase 1)

```text
Visitor (mobile / tablet / desktop)
          │
          ▼
      HTTPS + CDN
          │
          ▼
  React / TypeScript SPA (client/)
          │  fetch('/api/contact')
          ▼
  Node.js / Express REST API (server/)
          │
          ├─ Helmet HTTP headers
          ├─ Origin allow-list (CORS)
          ├─ Strict Zod validation
          ├─ Rate limiting + honeypot
          │
          ▼
  SQLite leads DB (private server file)
```

During development, Vite proxies `/api/*` to http://localhost:4000. If frontend and backend are hosted separately, configure `VITE_API_BASE_URL` to the HTTPS backend origin and `CORS_ORIGINS` on the backend to the HTTPS frontend origin. No production domain has yet been chosen.

## API contracts

- `GET /api/health` returns `{ "ok": true, "service": "lomi-api" }`.
- `POST /api/contact` accepts JSON `{name, email, organization, service, message, website, consent: true}`. Required: name, email, message, consent. `website` is a hidden anti-bot field.
- Valid inquiries receive HTTP 201; errors are 400 (validation), 429 (rate limit) or 500 (internal error).
- No authentication or public admin routes are implemented. Employee access to raw leads is only through the restricted server terminal. Never open a public database viewer for this starter.

## Security and privacy

- User text is rendered by React, not inserted as unescaped HTML.
- SQL insert uses prepared statements to prevent SQL injection.
- Express serves JSON only; avoid leaking stack traces and customer data.
- Limit request body size and submission rate. A basic rate limiter is not a complete bot defense.
- Store production database on a **persistent private volume** and protect backups. Managed PostgreSQL is preferable before significant traffic.
- Keep `TRUST_PROXY=false` unless correctly configured behind a proxy. Misconfigured IP proxy trust can undermine rate limits.
- Use HTTPS, automatic security updates and appropriate backups. Restrict employee access, define deletion/retention procedures and consider a DPA as relevant.
- Draft privacy copy and sample creative work are not legal or business claims.

## Suggested Phase 2 (when business volume grows)

```text
Customers → CDN / WAF → React SSR / pre-rendered pages
                            │
                            ├─ Headless CMS (reviewed publishing workflow)
                            └─ Node API + access control
                                  │
                             PostgreSQL DB
                                  ├─ authenticated lead dashboard
                                  ├─ project / client records
                                  └─ audit events
                       + Object storage for media
                       + transactional email service
                       + logging, alerts, backups
```

Separate modules later into `inquiries`, `projects`, `clients`, `content`, `users`, `media`, `analytics` rather than building microservices prematurely. Upgrade only when real requirements justify extra operational overhead.

## International quality checklist

- Accessibility: target WCAG 2.2 AA; audit real pages with keyboard, screen-reader and automated testing.
- SEO: descriptive page metadata, correct route responses, sitemap, robots, image alt text, structured data where appropriate and indexing validation; React CSR can need pre-rendering/SSR for reliable SEO.
- Global audiences: language negotiation/explicit language URLs, locally translated content, directionality support where needed, `hreflang` and currency/timezone-aware content if relevant.
- Performance: compress assets, avoid huge media files, lazy-load below-the-fold images, monitor LCP/CLS/INP, CDN edge caching.
- Security: TLS, appropriate headers, origin restrictions, dependency checks, secret management, least privilege, secure hosting, backups and incident response.
- Operational excellence: staging/production separation, Git version control, automated checks and tested rollback plans.

Nothing here represents ISO certification or a compliance audit.
