# Backend-for-Frontend Architecture

Status: implemented frontend boundary with a same-EC2 production topology.

## Purpose

The Next.js Backend for Frontend (BFF) gives the browser a same-origin, frontend-specific API while the Express application remains the source of truth for authentication and connection-domain behavior.

The BFF is not a second domain backend. It owns transport concerns: secure cookie forwarding, response shaping, cache policy, request cancellation, timeout enforcement, error normalization, and frontend observability.

## Implemented same-origin BFF

One dynamic Next.js Route Handler forwards `/api/*` to the fixed private Express origin. It preserves the backend URL contract, so the browser and Express both use paths such as `/api/v1/auth/login`.

This implementation is intentionally transport-only: it does not accept a destination origin from the browser or duplicate domain rules. Production Nginx routes both `/` and `/api/*` to Next.js, so authentication cookies remain same-origin and the BFF boundary stays intact. Only `/socket.io/*` bypasses Next.js and reaches Express directly.

## Historical baseline

![Historical direct-browser architecture](./diagrams/current-architecture.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
flowchart LR
    subgraph client ["Client"]
        browser["Web browser"]
    end
    subgraph service ["Application service"]
        expressBackend["Express API"]
    end
    subgraph datastore ["Data store"]
        mongoDb["MongoDB"]
    end

    browser -->|"Cross-origin HTTP"| expressBackend
    expressBackend -->|"Mongoose queries"| mongoDb
```

</details>

Current backend behavior and constraints:

- Every Express endpoint is mounted under `/api/v1`; the API has no CORS middleware.
- Authentication uses an opaque JWT in the `token` HTTP-only cookie.
- The cookie uses `SameSite=Lax`, path `/`, and `Secure` only in production.
- The access token and cookie expire after one day; no refresh flow exists.
- Protected routes read and verify the cookie in Express.
- Typed application errors return 401, 403, 404, 409, 422, or 500 as appropriate.
- Logout uses `POST /logout`.

## Production architecture

![Proposed target architecture](./diagrams/target-architecture.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
flowchart LR
    subgraph client ["Client"]
        browser["Web browser"]
    end
    subgraph gateway ["Public ingress"]
        nginx["Nginx on letsglance.in"]
    end
    subgraph service ["Application services"]
        nextBff["Next.js frontend and BFF"]
        expressBackend["Express domain API"]
    end
    subgraph datastore ["Data store"]
        mongoDb["MongoDB"]
    end
    browser -->|"Same-origin HTTPS"| nginx
    nginx -->|"/ and /api/*"| nextBff
    nginx -->|"/socket.io/* WebSocket"| expressBackend
    nextBff -->|"Private HTTP at 127.0.0.1:4000"| expressBackend
    expressBackend -->|"Mongoose queries"| mongoDb
```

</details>

Nginx is the only public service. Next.js listens on `127.0.0.1:3000` and Express/Socket.IO listens on `127.0.0.1:4000`.

## Ownership boundaries

Next.js BFF owns:

- Same-origin browser API routes.
- Forwarding opaque authentication cookies and upstream `Set-Cookie` headers.
- Frontend-specific payload reduction and response contracts.
- Request IDs, timing headers, timeout budgets, cancellation, and error envelopes.
- Explicit browser and CDN cache headers.
- CSRF and origin checks for cookie-authenticated mutations.

Express owns:

- JWT creation and verification.
- User, profile, feed, connection, and authorization rules.
- Canonical validation and HTTP status codes.
- MongoDB access and domain transactions.
- Rate-limit identity and domain-level abuse controls.

The BFF must not decode the JWT, query MongoDB, or duplicate connection-domain decisions.

## Login sequence

![Login sequence](./diagrams/login-sequence.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
sequenceDiagram
    participant Browser
    participant BFF as Next.js BFF
    participant API as Express API
    participant DB as MongoDB

    Browser->>BFF: POST /api/v1/auth/login
    BFF->>API: POST /api/v1/auth/login
    API->>DB: Find user
    DB-->>API: User record
    API-->>BFF: User payload and Set-Cookie
    BFF-->>Browser: Unchanged response and Set-Cookie
```

</details>

The browser stores the cookie for the frontend origin. It sends that cookie only to the BFF; the BFF forwards it to Express. Production requires HTTPS end to end.

## Authenticated feed sequence

![Authenticated feed sequence](./diagrams/feed-sequence.svg)

<details>
<summary>Mermaid source</summary>

```mermaid
sequenceDiagram
    participant Browser
    participant BFF as Next.js BFF
    participant API as Express API
    participant DB as MongoDB

    Browser->>BFF: GET /api/v1/feed with token cookie
    BFF->>API: GET /api/v1/feed with forwarded Cookie
    API->>API: Verify JWT and load user
    API->>DB: Query unseen profiles
    DB-->>API: Feed records
    API-->>BFF: Feed response
    BFF-->>Browser: Unchanged private response
```

</details>

Feed data is personalized. It must not enter a shared CDN cache. Initial policy should be `private, no-store` until a measured private-cache design is approved.

## Failure and latency policy

- Assign or propagate one request ID across browser, BFF, and Express.
- Apply a configured end-to-end latency budget and cancel upstream work when the browser disconnects.
- Return a gateway timeout when Express exceeds its budget.
- Never retry login, signup, swipe, or connection mutations automatically.
- Retry safe reads only for explicitly classified transient failures and only within the original latency budget.
- Do not expose Express stack traces, secrets, or internal error details.
- Record BFF duration, upstream duration, status, route, cache result, and response size without logging tokens or personal data.

## Required backend corrections

Before production integration:

- Define refresh or reauthentication behavior for the one-day token expiry.
- Add abuse protection and rate limiting at appropriate ingress and backend boundaries.

## BFF proxy surface

- Browser requests preserve the Express path: `/api/v1/*`.
- The proxy supports GET, HEAD, POST, PUT, PATCH, and DELETE.
- The destination origin always comes from server-only `BACKEND_API_ORIGIN`.
- Nginx must route `/api/*` to Next.js, not directly to Express.

Future route-specific BFF endpoints must use explicit contracts and policies. The generic transport proxy can be narrowed as those explicit endpoints replace it.
