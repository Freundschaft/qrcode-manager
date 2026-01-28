# QR Code Manager

Admin backend to manage QR codes with Keycloak OIDC login, friendly URLs, and redirect tracking.

## Requirements
- Node.js 20+
- Postgres
- Keycloak (OIDC client)

## Setup
1. Copy `.env.example` to `.env` and fill in values.
2. Run `npm install`.
3. Run Prisma migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Key URLs
- Admin: `/admin`
- Login: `/login`
- Public redirect (friendly slug): `/r/{slug}`
- Public redirect (code): `/q/{code}`

## Netlify
- Uses `@netlify/plugin-nextjs` via `netlify.toml`.
- Set environment variables in Netlify UI:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `KEYCLOAK_ISSUER`
  - `KEYCLOAK_CLIENT_ID`
  - `KEYCLOAK_CLIENT_SECRET`
