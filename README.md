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

## Hostinger Security TODO

After the app and WordPress are installed on Hostinger, complete this server-side checklist:

- Put the domain behind Cloudflare and enable proxying for the production DNS records.
- Add a Cloudflare WAF custom rule for `"/wp-login.php"` with `Managed Challenge`.
- Add a Cloudflare rate limiting rule for `POST /wp-login.php`, starting with `5 requests per 1 minute` per IP and a `1 hour` block.
- If admin access is only used by a known person or office IP, restrict `"/wp-admin/*"` by IP and exclude `"/wp-admin/admin-ajax.php"` from that block.
- Enable WordPress 2FA for all administrator accounts.
- Use unique admin accounts, remove any shared admin login, and avoid the `admin` username.
- Confirm the `REST API Only` plugin is active so the site does not expose normal WordPress frontend routes.
- Confirm XML-RPC is disabled and that `https://your-domain.tld/xmlrpc.php` does not return the normal XML-RPC endpoint response.
- Force HTTPS for the site and WordPress admin, then verify there is no mixed-content output.
- Set `DISALLOW_FILE_EDIT` in `wp-config.php` to disable the built-in plugin/theme file editor.
- Delete unused plugins, themes, and inactive admin users.
- Turn on automatic updates for WordPress core and trusted plugins where acceptable.
- Make sure backups are enabled in Hostinger and that database restore has been tested at least once.
- Add uptime/error monitoring and login/audit logging so admin access changes are visible.

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
