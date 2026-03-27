# Kanna Bikes

Site for Kanna Bikes.

## Runtime

This app is configured to run as a Node.js SSR app.

- Node: `20+`
- Build: `npm run build`
- Start: `npm start`

`npm start` runs `react-router-serve build/server/index.js`, which is suitable for a Hostinger Node.js app or a PM2-managed VPS process.

## Environment

Copy `.env.example` to `.env` and set the production values for your domain and APIs.

The most important production variable is:

`VITE_SITE_URL=https://your-domain.tld`

Without it, canonical URLs, Open Graph URLs, `robots.txt`, and `sitemap.xml` will fall back to localhost values.

## Hostinger

For a Hostinger Node.js app:

1. Use Node.js `20` or newer.
2. Upload the app or pull it from Git.
3. Run `npm ci`.
4. Run `npm run build`.
5. Start the app with `npm start`.

For a Hostinger VPS with PM2 / CloudPanel:

1. Run `npm ci`.
2. Run `npm run build`.
3. Start with `pm2 start ecosystem.config.cjs`.

Hostinger's current VPS guidance is to run the app under Node/PM2 rather than deploy a static Pages artifact:
https://www.hostinger.com/support/9553137-how-to-set-up-a-node-js-application-using-hostinger-cloudpanel/

## Example Env

```
VITE_SITE_URL=https://kannabikes.com
VITE_WORDPRESS_API_BASE_URL=https://kannabikes.com/wp-json/kanna/v1
VITE_GOOGLE_AUTH_URL=https://kannabikes.com/wp-json/kanna-auth/v1/google/start
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

WordPress / plugin env:

```
KANNA_FRONTEND_BASE_URL=https://kannabikes.com
KANNA_AUTH_ALLOWED_FRONTEND_ORIGINS=https://kannabikes.com,https://www.kannabikes.com
KANNA_GOOGLE_CLIENT_ID=...
KANNA_GOOGLE_CLIENT_SECRET=...
KANNA_STRIPE_SECRET_KEY=sk_live_...
KANNA_STRIPE_WEBHOOK_SECRET=whsec_...
```

## Shortcuts

Test order:

`http://localhost:5174/order/2026032201`
