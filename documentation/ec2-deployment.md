# Let's Glance EC2 Deployment

The production origin is `https://letsglance.in`. Nginx is the only public
process:

- `/` and `/api/*` go to Next.js on `127.0.0.1:3000`; `/api/*` must continue
  through the Next.js BFF.
- `/socket.io/*` goes directly to Express/Socket.IO on `127.0.0.1:4000` with
  WebSocket upgrade headers.
- Next.js calls Express privately at `http://127.0.0.1:4000`.

The checked-in example is
[`deployment/nginx/letsglance.in.conf`](../deployment/nginx/letsglance.in.conf).

## Production values

Keep these values outside Git, for example in a root-owned
`/etc/lets-glance/frontend.env` with mode `0600`:

```dotenv
BACKEND_API_ORIGIN=http://127.0.0.1:4000
NEXT_PUBLIC_SOCKET_ORIGIN=https://letsglance.in
```

`BACKEND_API_ORIGIN` is the existing server-only variable name used by the BFF.
Its value remains private and can be changed when the Next.js process restarts.
`NEXT_PUBLIC_SOCKET_ORIGIN` is intentionally public and is inlined into browser
JavaScript during `npm run build`; changing it requires a rebuild. Do not set
the development-only `DEV_LOGIN_EMAIL` or `DEV_LOGIN_PASSWORD` in production.

The Express deployment must use its existing configuration to:

- bind HTTP and Socket.IO to `127.0.0.1:4000`;
- accept the browser Socket.IO origin `https://letsglance.in`;
- issue the production authentication cookie over HTTPS.

The backend repository owns those variable names; do not invent frontend
aliases for them.

## Build and start

Next.js 16.3 standalone output is appropriate here because it traces the
production server into a small, self-contained runtime while preserving App
Router rendering, Proxy, image optimization, Server Actions, and Route
Handlers. `npm run build` also copies `.next/static` and an optional `public`
directory into the standalone tree, as required by the Next.js output guide.

Run the build with the public socket origin already present:

```bash
cd /srv/lets-glance/frontend
npm ci
NEXT_PUBLIC_SOCKET_ORIGIN=https://letsglance.in npm run build
BACKEND_API_ORIGIN=http://127.0.0.1:4000 npm run start
```

`npm run start` launches `.next/standalone/server.js` on
`127.0.0.1:3000`. Build and run with Node.js 20.9 or newer, matching the
installed Next.js engine requirement. The runtime still needs
`BACKEND_API_ORIGIN`; the `NEXT_PUBLIC_*` value at runtime cannot replace the
value baked into the build.

## systemd

Use the real Node and npm paths returned by `command -v node` and
`command -v npm`:

```ini
[Unit]
Description=Let's Glance Next.js frontend
After=network.target

[Service]
Type=simple
User=letsglance
Group=letsglance
WorkingDirectory=/srv/lets-glance/frontend
Environment=NODE_ENV=production
EnvironmentFile=/etc/lets-glance/frontend.env
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Install it as `/etc/systemd/system/lets-glance-frontend.service`, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lets-glance-frontend
sudo systemctl status lets-glance-frontend
```

`SIGTERM` gives Next.js time to drain in-flight work. Supervise Express with
its own service and confirm both listeners are loopback-only with
`ss -ltnp`.

## Nginx, DNS, and TLS

Point the `letsglance.in` A/AAAA records at the instance before requesting the
certificate. Install Nginx and Certbot, place the example under
`/etc/nginx/sites-available/letsglance.in`, enable it, and obtain the
certificate:

```bash
sudo apt-get install nginx certbot python3-certbot-nginx
sudo ln -s /etc/nginx/sites-available/letsglance.in /etc/nginx/sites-enabled/
sudo certbot --nginx -d letsglance.in
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
```

The TLS paths in the example become valid after Certbot issues the certificate.
If this is the first certificate, start with only its port-80 server block,
run Certbot, then enable the complete file. Nginx buffering is disabled for
Next.js streaming and Socket.IO.

The EC2 security group should expose only TCP 80 and 443 publicly. Restrict SSH
to trusted administrator addresses. Do not expose 3000, 4000, or the database;
both application services must bind to loopback.

## Verification and rollback

No dedicated frontend health route exists. Use the existing login page as a
shallow Next.js check and an existing backend-owned health endpoint if one is
available:

```bash
curl -fsS http://127.0.0.1:3000/login >/dev/null
curl -fsS https://letsglance.in/login >/dev/null
curl -i https://letsglance.in/api/v1/profile
```

The API check may return `401` without a cookie; that still proves Nginx routed
through Next.js to Express. Verify an authenticated Socket.IO connection in
the browser and inspect `journalctl -u lets-glance-frontend` plus Nginx logs.

Keep the prior build or release directory until verification completes. A
rollback restores the previous release, restarts the frontend service, reloads
Nginx only if its config changed, and repeats the checks above. Never rebuild
the old release during rollback because that could inline different
`NEXT_PUBLIC_*` values.
