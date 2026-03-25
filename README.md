# Kanna Bikes

Site for Kanna Bikes.

## Shortcuts

Test order:

`http://localhost:5174/order/2026032201`

## Environment

Example .env:

```
VITE_WORDPRESS_API_BASE_URL=http://localhost/wp-json/kanna/v1
VITE_GOOGLE_AUTH_URL=http://localhost/wp-json/kanna-auth/v1/google/start
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

WordPress / plugin env:

```
KANNA_FRONTEND_BASE_URL=http://localhost:5173
KANNA_AUTH_ALLOWED_FRONTEND_ORIGINS=http://localhost:5173,https://kannabikes.com
KANNA_GOOGLE_CLIENT_ID=...
KANNA_GOOGLE_CLIENT_SECRET=...
KANNA_STRIPE_SECRET_KEY=sk_test_...
KANNA_STRIPE_WEBHOOK_SECRET=whsec_...
```
