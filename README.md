# QR Code Manager

Admin backend to manage QR codes with Keycloak OIDC login, friendly URLs, and redirect tracking, backed by Netlify Blobs.

## Requirements
- Node.js 20+
- Keycloak (OIDC client)

## Setup
1. Copy `.env.example` to `.env` and fill in values.
2. Run `npm install`.
3. Start dev server:
   ```bash
   npm run dev
   ```

For local development with Netlify Blobs, set `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` in `.env`.

## Key URLs
- Admin: `/admin`
- Public redirect (friendly slug): `/r/{slug}`
- Public redirect (code): `/q/{code}`

## Netlify
- Uses `@netlify/plugin-nextjs` via `netlify.toml`.
- Set environment variables in Netlify UI:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `KEYCLOAK_ISSUER`
  - `KEYCLOAK_CLIENT_ID`
  - `KEYCLOAK_CLIENT_SECRET`
