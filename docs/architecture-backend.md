# Architecture — Backend

> **Part:** `backend/` | **Type:** REST API + WebSocket Server | **Generated:** 2026-03-02

---

## Executive Summary

The Luma backend is a **Node.js/Express REST API** with real-time WebSocket capabilities via Socket.io. It follows a classic **layered architecture** (Routes → Controllers → Prisma ORM → PostgreSQL). Authentication is dual-mode: **Keycloak SSO** (OIDC/JWT via JWKS) for federated login and a **local bcrypt + JWT** strategy as fallback. Rate limiting, Helmet security headers, and Zod validation are applied globally.

---

## Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 22+ | ES modules via TypeScript |
| Language | TypeScript | ^5.7.3 | Strict mode |
| HTTP Framework | Express | ^4.21.2 | v4 (not v5) |
| ORM | Prisma | ^6.1.0 | Type-safe DB access |
| Database | PostgreSQL | 15 | Via Docker in dev |
| Auth — SSO | Keycloak + jwks-rsa | ^3.2.2 | OIDC JIT provisioning |
| Auth — Local | jsonwebtoken + bcrypt | ^9.x / ^5.x | Local fallback |
| Real-time | Socket.io | ^4.8.3 | Namespaced, room-based |
| Validation | Zod | ^3.24.1 | Request validation schemas |
| File Uploads | Multer | ^2.0.2 | Local uploads/ directory |
| Security | Helmet + express-rate-limit | ^8.x | Global + auth-specific |
| HTTP Client | Axios | ^1.13.5 | Outbound requests |
| Web Scraping | Cheerio | ^1.2.0 | URL metadata enrichment |
| Compression | compression | ^1.8.1 | Gzip middleware |
| Testing | Vitest + Supertest | ^4.0.18 | Unit + integration tests |
| Build | tsc / tsx | ^4.19.2 | Compile & dev watch |

---

## Architecture Pattern

```
HTTP Request
     │
     ▼
[Express Middleware Stack]
  - Helmet (security headers)
  - compression (gzip)
  - CORS
  - globalLimiter (rate limit)
  - express.json()
     │
     ▼
[Route Layer]  (src/routes/*.routes.ts)
  - Route path + HTTP method binding
  - Auth middleware injection
  - Request validation
     │
     ▼
[Controller Layer]  (src/controllers/*.controller.ts)
  - Business logic
  - Prisma DB queries
  - Response formatting
     │
     ▼
[Prisma ORM]  (src/db.ts + prisma/schema.prisma)
     │
     ▼
[PostgreSQL]

WebSocket (parallel path):
  - setupSocketIO(server)  (src/socket.ts)
  - Auth middleware on connection
  - Room management / event broadcasting
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/index.ts` | Entry point — Express app + Socket.io init + route registration |
| `src/socket.ts` | Socket.io server setup, event handlers, room management |
| `src/db.ts` | Prisma client singleton export |
| `src/middleware/auth.ts` | JWT/Keycloak authentication middleware |
| `src/middleware/rateLimiter.ts` | Global + auth-scoped rate limiters |
| `prisma/schema.prisma` | Full database schema (20 models) |
| `prisma/seed.ts` | Database seeder for dev data |

---

## API Route Modules

| Module | Base Path | Description |
|---|---|---|
| `auth.routes.ts` | `/api/auth` | Sign-up, sign-in, Keycloak JIT sync |
| `user.routes.ts` | `/api/users` | Profile CRUD, onboarding, preferences |
| `groups.routes.ts` | `/api/groups` | Group management, membership, discovery |
| `posts.routes.ts` | `/api/posts` | Group posts, comments, likes |
| `feed.routes.ts` | `/api/feed` | Aggregated activity feed |
| `content.routes.ts` | `/api/content` | Articles, videos, events (My Luma) |
| `submissions.routes.ts` | `/api/submissions` | User content submissions to editors |
| `subscription.routes.ts` | `/api/subscriptions` | Premium tier management (Stripe) |
| `notification.routes.ts` | `/api/notifications` | In-app notifications |
| `messages.routes.ts` | `/api/messages` | Conversations + direct messages |
| `connection.routes.ts` | `/api/connections` | User connections / friend requests |
| `polls.routes.ts` | `/api/polls` | Polls attached to posts or content |
| `marketplace.routes.ts` | `/api/marketplace` | P2P marketplace listings |
| `directory.routes.ts` | `/api/directory` | Local service directory + reviews |
| `admin.routes.ts` | `/api/admin` | Admin-only management endpoints |

---

## Authentication Flow

```
User Logins via Keycloak SSO
         │
         ▼
   Frontend receives Keycloak JWT
         │
         ▼
   Bearer token sent to backend
         │
         ▼
   auth.middleware.ts:
     1. Try to verify as Keycloak JWT (JWKS endpoint)
     2. If fails, try local JWT (JWT_SECRET)
     3. JIT provision: if Keycloak user doesn't exist in DB, create record
         │
         ▼
   req.user = { id, email, role, ... }
```

---

## Real-time Architecture (Socket.io)

```
Client connects → src/socket.ts
  - Auth middleware validates JWT on connection
  - User joins personal room: `user:${userId}`
  
Events Emitted to Clients:
  - new_message      → direct message received
  - conversation:new → new conversation created  
  - notification     → in-app notification pushed
  - typing           → typing indicator

Client Emits:
  - join_conversation  → join a conversation room
  - send_message       → send a direct message
  - mark_read          → mark messages as read
```

---

## Security Measures

| Measure | Implementation |
|---|---|
| Security Headers | Helmet middleware on all routes |
| Rate Limiting | Global limiter + stricter auth limiter |
| Request Validation | Zod schemas in controllers |
| Password Hashing | bcrypt with cost factor |
| JWT Signing | HS256 with `JWT_SECRET` env var |
| Keycloak JWKS | RS256 validation via `jwks-rsa` |
| CORS | Configured per environment via `CORS_ORIGIN` |
| File Uploads | Multer with size limits, served statically |

---

## Testing Strategy

| Type | Tool | Location |
|---|---|---|
| Unit | Vitest + `vitest-mock-extended` | `src/controllers/*.test.ts` |
| Integration | Supertest | `src/controllers/*.test.ts` |
| Config | `vitest.config.ts` | Root of backend/ |
| Coverage | `@vitest/coverage-v8` | `coverage/` dir |

**Test Files Found:**
- `auth.controller.test.ts`
- `connection.controller.test.ts`
- `content.controller.test.ts`
- `groups.controller.test.ts`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Local JWT signing secret |
| `JWT_EXPIRES_IN` | — | Token expiry (default `7d`) |
| `PORT` | — | Server port (default `3000`) |
| `NODE_ENV` | — | `development` / `production` |
| `CORS_ORIGIN` | — | Allowed frontend origin |
| `KEYCLOAK_*` | — | Keycloak realm/client config |

---

## Scripts

| Script | Command | Description |
|---|---|---|
| Dev | `npm run dev` | tsx watch with hot reload |
| Build | `npm run build` | TypeScript compile to `dist/` |
| Start | `npm start` | Run compiled `dist/index.js` |
| Test | `npm test` | Run Vitest test suite |
| Coverage | `npm run test:coverage` | Coverage report |
| DB Migrate | `npm run prisma:migrate` | Apply Prisma migrations |
| DB Seed | `npm run seed` | Seed development data |
| DB Studio | `npm run prisma:studio` | Prisma visual DB browser |
