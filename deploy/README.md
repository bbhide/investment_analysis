# Deploy notes

## Host nginx site

`deploy/nginx-site.conf` is the host-level nginx site for `investment_calculator.settleup.site`.
It's a plain HTTP reverse-proxy to the docker-compose web container on `127.0.0.1:8082`.
No auth at this layer — authentication is in the Vue app.

## Authentication

A single static password gates the app. Set it via the `APP_PASSWORD` env var
in `~/code/investment_analysis/.env` on the server:

```bash
APP_PASSWORD=ThankYouBhavesh
```

The API exposes:
- `POST /api/auth/login` — accepts `{ password }`, issues a signed `inv_auth` cookie
- `POST /api/auth/logout` — clears the cookie
- `GET  /api/auth/me`    — 200 if authed, 401 otherwise

The frontend has a global router guard that redirects unauthenticated users to `/login`.
Routes with `meta.public: true` (the `/shared/:token/...` paths) skip the guard so
clients can open shared report links without the password.

The corresponding API routes (`/api/scenarios*` etc.) are wrapped in a `requireAuth`
hook; public endpoints (`/api/auth/*`, `/api/calculate`, `/api/shared/*`, `/api/health`)
are outside that hook.

### Rotating the password

```bash
ssh ubuntu@<host> 'sed -i "s/^APP_PASSWORD=.*/APP_PASSWORD=new-pass/" \
  ~/code/investment_analysis/.env && \
  cd ~/code/investment_analysis && \
  docker compose -f docker-compose.prod.yml -p inv up -d api'
```

(The api container is restarted so it picks up the new env var. Existing sessions remain
valid until the signed cookie expires or the user logs out, because the cookie's signature
is bound to `COOKIE_SECRET`, not `APP_PASSWORD`. Rotate `COOKIE_SECRET` too if you want
to invalidate active sessions.)
