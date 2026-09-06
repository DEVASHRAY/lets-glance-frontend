# Let's Glance Frontend

The Next.js 16.3 and React 19.2 frontend for
[`https://letsglance.in`](https://letsglance.in). Browser API requests stay
same-origin and pass through the Next.js Backend for Frontend (BFF); the
Express application remains the domain authority.

## Local development

```bash
npm run dev
```

The application reads these existing environment variables:

- `BACKEND_API_ORIGIN`: server-only Express origin, normally
  `http://127.0.0.1:4000` in same-host production.
- `NEXT_PUBLIC_SOCKET_ORIGIN`: browser Socket.IO origin. Production must build
  with `https://letsglance.in`.
- `DEV_LOGIN_EMAIL` and `DEV_LOGIN_PASSWORD`: optional development-only login
  prefills; never set them in production.

No environment or secret file is committed by this repository.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The production build emits a complete standalone runtime under
`.next/standalone`. `npm run start` binds it to `127.0.0.1:3000`.

## Documentation

- [EC2, Nginx, TLS, systemd, health, and rollback](./documentation/ec2-deployment.md)
- [BFF architecture and ownership](./documentation/bff-architecture.md)
- [Performance evidence](./PERFORMANCE.md)
