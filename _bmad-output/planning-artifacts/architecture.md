---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
  status: 'complete'
  lastStep: 8
  completedAt: '2026-03-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-luma-2026-03-02.md
  - _bmad-output/project-context.md
  - docs/index.md
  - docs/architecture-backend.md
  - docs/architecture-frontend.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/integration-architecture.md
  - docs/development-guide.md
  - docs/deployment-guide.md
workflowType: 'architecture'
project_name: 'luma'
user_name: 'Duma'
date: '2026-03-03'
---

# Architecture Decision Document — La Luma

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**FR Map (56 FRs):**

| Capability Area | Component | Build Type |
|---|---|---|
| Identity & Membership | Auth + GDPR data pipeline | Adapt (Keycloak exists) |
| Community & Content | Groups, Feed, Posts, Search | Adapt + extend |
| Community Safety & Moderation | AI pipeline + moderation queue | 🔴 New |
| Events (Luma Spaces) | Event management + waitlist | 🔴 New |
| Brand Partnerships | Editorial workflow + partner portal | 🔴 New |
| Subscriptions & Access | Stripe + tier enforcement | Adapt |
| Notifications & Engagement | FCM/APNs + WebSocket + surveys | Adapt + extend |
| Administration & Operations | Admin dashboard + audit export | Adapt + extend |

**NFRs — architectural impact:**
- Real-time: Socket.io already in place — extend for moderation + live feed
- Keycloak JIT exists; anonymous post isolation requires new encrypted isolated store
- GDPR erasure + export — new data lifecycle pipeline required
- Scalability: Docker Compose is local-dev only; production infrastructure undefined
- AI sentiment API: entirely new component; DPA required before any real user data

---

### Existing Architecture Baseline

- **Backend:** Node.js/Express 4 + Prisma 6 + PostgreSQL 15 + Socket.io 4 (port 3000)
- **Frontend:** React 19 + Vite 7 + React Router 7 + Capacitor 8 (port 5173)
- **Auth:** Keycloak SSO with JIT user provisioning
- **14 existing route modules, 20 Prisma models**

**La Luma delta:**
- 🟡 Adapt: auth, groups, feed, posts, messaging, notifications, subscriptions, admin
- 🔴 New: AI moderation pipeline, Luma Spaces events, brand partner portal, GDPR data lifecycle, anonymous post isolation store
- 🗑️ Retire: Marketplace — disabled (routes + frontend) in MVP; deletion deferred to Growth phase after confirmed no dependencies

---

### Technical Constraints & Dependencies

- **Keycloak role extension:** 5-role RBAC (member, moderator, editorial, admin, brand partner) requires Keycloak realm config + JIT provisioning adaptation; affects all protected endpoints
- **⚠️ Anonymous post isolation:** highest legal risk component — court-order-compliant data architecture required; legal design review before build
- AI sentiment API DPA: 4–6 week lead time before real user data processed
- Capacitor iOS push notification reliability → Flutter migration is Phase 2
- GDPR rights (erasure + export): new endpoints required; not currently in codebase

**Open question — resolve in Step 4:**
> Production hosting target is undefined. This affects database connection pooling, WebSocket clustering, and horizontal scaling architecture. Must be decided before infrastructure decisions.

---

### Cross-Cutting Concerns

1. **Identity & trust** — anonymous posting, safeguarding links, 5-role RBAC — affects every component
2. **GDPR compliance** — minimisation, erasure, export — affects data models, APIs, storage layer
3. **Real-time** — Socket.io extension for moderation, feed, notifications — cross-cuts backend + frontend
4. **Trauma-informed design** — error states, empty states, notification copy, content warnings, onboarding — affects error boundary architecture and frontend component library
5. **Safety-critical prioritisation** — moderation queue must stay accessible during incidents — affects infrastructure and deployment design

---

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack mobile-first community platform** — existing Luma codebase is the starter (brownfield).

### Stack Confirmation (No New Starter Required)

**Language:** TypeScript strict throughout (backend + frontend)

**Backend:**
- Node.js + Express 4 — retained for MVP; Express 5 upgrade deferred post-launch
- Prisma 6 ORM → PostgreSQL 15
- Socket.io 4 (real-time WebSocket)
- Zod (schema validation) · Vitest + Supertest (testing)

**Frontend:**
- React 19 + Vite 7
- React Router 7 — SPA/library mode; SSR not in scope; Capacitor build assumes client-side routing throughout
- Capacitor 8 (iOS/Android packaging) · keycloak-js · Vitest + Testing Library
- **State management:** React Context for auth state; React Query for all new server state modules; existing server state pattern to be confirmed via codebase audit

**Auth:** Keycloak SSO + JIT user provisioning — 5-role RBAC extension required

**Code Organisation:**
- Backend: `routes/ → controllers/ → services/`
- Frontend: `pages/ + services/ + context/`
- New modules follow the same layered pattern as existing modules

### Key Architectural Notes

**AI Moderation Pipeline — worker pattern:** The AI sentiment pipeline does not fit the standard CRUD route pattern. Posts trigger async AI evaluation via a dedicated moderation service worker — separate from the Express route layer. Engineers must not implement AI calls as synchronous route handlers.

**Prisma Model Audit — first implementation task:** Existing 20 Prisma models require field additions and migrations before new features can be built (User: role field; Post: anonymous flag + identity link reference; Group: moderation settings). This audit is the first implementation task.

---

## Core Architectural Decisions

### Data Architecture

- **Database:** PostgreSQL 15 via Prisma 6 + CloudNativePG operator on k3s
- **Keycloak database:** Same CloudNativePG cluster, database `keycloak_db`
- **Anonymous post identity store:** Isolated Postgres schema with field-level encryption — court-order compliant; identity links inaccessible in standard query paths; legal design review required before build
- **GDPR data lifecycle:** Soft delete + async data export pipeline; new `UserDataRequest` model
- **Caching & queue backend:** Redis via Bitnami Helm chart in-cluster on k3s
- **Migrations:** Prisma migrate (existing pattern, extended for new models)

### Authentication & Security

- **Auth:** Keycloak + 5-role RBAC via realm roles; JIT provisioning assigns `member` on first login
- **API security:** JWT middleware on all routes; role guard middleware per endpoint
- **Anonymous post isolation:** Identity link never returned in standard API responses
- **Encryption:** AES-256 at rest (anonymous identity store); TLS 1.2+ in transit
- **Third-party data:** DPA in place before any external data processing; PII never sent to AI API
- **Secrets:** Kubernetes native Secrets (encrypted etcd) for MVP; Sealed Secrets evaluated in Growth phase

### API & Communication Patterns

- **API style:** REST — consistent with 14 existing route modules
- **Real-time:** Socket.io 4 — extend for moderation alerts, DM notifications, live feed updates
- **AI moderation queue:** BullMQ on Redis — posts enqueue `moderatePost` job on creation; dedicated worker processes jobs independently; 3× retry on failure; dead-letter queue escalates to manual-only moderation
- **Rate limiting:** Redis-backed rate limiter on post creation, report submission, and auth endpoints
- **Error response:** Standardised `{ error: string, code: string }` on all endpoints
- **Push notifications:** FCM (Android) + APNs (iOS); delivery logged; no silent failure

### Frontend Architecture

- **Rendering:** SPA/CSR — Vite + React Router 7 library mode; Capacitor build assumes client-side routing
- **Auth state:** React Context (existing `AuthContext`)
- **Server state:** React Query for all new modules; standardises caching, loading states, optimistic updates
- **UI state:** Local component state (useState/useReducer)
- **Error boundaries:** React Error Boundary per route + global fallback; raw errors never shown to users
- **Component library:** Custom, trauma-informed — error states, empty states, content warnings are first-class components
- **Styling:** Retain existing styling approach (audit to confirm); new components follow same system

### Infrastructure & Deployment

| Decision | Choice |
|---|---|
| Local dev | Docker Compose (existing) |
| Production | **k3s on single-node VPS** (DigitalOcean / Hetzner) |
| Database | CloudNativePG operator in-cluster |
| Cache + Job Queue | Bitnami Redis in-cluster |
| TLS | cert-manager + Let's Encrypt + Traefik (k3s default ingress) |
| Storage | local-path-provisioner → Longhorn (multi-node Growth) |
| CI/CD | GitHub Actions → GHCR (image registry) → kubectl rollout |
| Backups | pg_dump cron → object storage (Backblaze B2 or S3) |
| Secrets | Kubernetes native Secrets MVP; Sealed Secrets in Growth |
| Monitoring | Pino structured logging + Sentry error alerting |
| Scaling | Vertical scaling MVP; horizontal deferred to Growth |

**Reliability mitigation:** Single-node VPS has no built-in failover. Mitigation: daily pg_dump to object storage; node failure recovery runbook documented; 99.5% uptime target achievable at MVP user volume.

---

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database (Prisma):** `PascalCase` singular model names; `camelCase` columns and relation fields

**API endpoints:** `kebab-case` plural nouns → `/api/luma-spaces`; route params as `:id`; query params as `camelCase`

**TypeScript:** `camelCase.ts` for service/util files; `PascalCase.tsx` for React components; `UPPER_SNAKE_CASE` for constants; `PascalCase` for types/interfaces

**Environment variables:** `SCREAMING_SNAKE_CASE` with service prefix — `DB_*` · `KEYCLOAK_*` · `AI_*` · `STRIPE_*` · `REDIS_*` · `FCM_*` · `PUSH_*`

### Structure Conventions

**Backend module pattern:**
```
backend/src/
  routes/featureName.ts            ← Express router only
  controllers/featureController.ts ← request/response
  services/featureService.ts       ← business logic
  workers/featureWorker.ts         ← BullMQ workers
  jobs/featureJob.ts               ← BullMQ job definitions
```

**Frontend component pattern (co-located):**
```
frontend/src/components/ComponentName/
  index.tsx
  ComponentName.test.tsx
  types.ts
```

### API Format Standards

| Scenario | Format |
|---|---|
| Success | `{ "data": { ... } }` |
| Error | `{ "error": "Human message", "code": "SNAKE_CASE" }` |
| Feed/queue lists | `{ "data": [...], "nextCursor": "...", "hasMore": true }` |
| Admin lists | `{ "data": [...], "pagination": { "page", "total", "hasMore" } }` |

Feed/queue: cursor-based (`?cursor=&limit=`) · Admin: offset-based (`?page=&pageSize=`)

### Communication & Process Standards

**Socket.io events:** `namespace:action` → `moderation:flagged`, `message:new`

**BullMQ jobs:** `camelCase` verbs → `moderatePost`, `sendPushNotification`

**Moderation job state machine:**
```
pending → ai_flagged | ai_cleared
ai_flagged → human_review
human_review → removed | cleared | watchlisted
```

**Pino log levels:** ERROR: unhandled exceptions, failed external calls · WARN: validation failures, rate limit hits, retries · INFO: request lifecycle, job events · DEBUG: dev only

**Frontend forms:** React Hook Form + Zod resolver; mirrors backend schemas

### Mandatory Rules — All Agents Must Follow

1. `routes → controllers → services` for all backend features
2. React Query for all new frontend server state
3. `{ error, code }` for errors; `{ data }` for success
4. BullMQ for async jobs — never synchronous route handlers
5. Cursor pagination for feeds/queues; offset for admin lists
6. Never expose anonymous identity links in any API response
7. `SCREAMING_SNAKE_CASE` env vars with service prefix
8. Co-locate component tests and types in component folder
9. Pino logging at correct level (ERROR/WARN/INFO/DEBUG)
10. React Hook Form + Zod resolver for all new frontend forms

---

## Project Structure & Boundaries

### Complete Project Directory Tree

```
luma/
├── .github/workflows/
│   ├── ci.yml                          ← build + test
│   └── deploy.yml                      ← GHCR push + kubectl rollout
├── k8s/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml         ← luma-backend image, Express entrypoint
│   ├── bullmq-worker-deployment.yaml   ← luma-backend image, worker entrypoint (shared image)
│   ├── frontend-deployment.yaml
│   ├── keycloak-deployment.yaml
│   ├── redis-deployment.yaml
│   ├── cloudnativepg-cluster.yaml      ← luma_db + keycloak_db databases
│   ├── ingress.yaml                    ← Traefik ingress
│   ├── cert-manager-issuer.yaml        ← Let's Encrypt
│   └── secrets/                        ← gitignored
│       └── README.md                   ← "kubectl create secret generic luma-backend-secrets --from-env-file=.env.production"
├── backend/
│   ├── Dockerfile                      ← single image used by both backend + worker
│   ├── prisma/
│   │   ├── schema.prisma               ← 20 existing + new models
│   │   └── migrations/
│   └── src/
│       ├── index.ts · app.ts · socket.ts
│       ├── config/env.ts
│       ├── middleware/
│       │   ├── auth.ts · rbac.ts · rateLimiter.ts
│       ├── routes/
│       │   ├── [14 existing routes]
│       │   ├── lumaSpaces.ts           ← 🔴 New
│       │   ├── editorial.ts            ← 🔴 New (internal editorial team)
│       │   ├── brandPartners.ts        ← 🔴 New (partner self-service)
│       │   └── gdpr.ts                 ← 🔴 New
│       ├── controllers/ services/      ← matching files per route
│       ├── workers/
│       │   └── moderationWorker.ts     ← BullMQ worker entrypoint
│       ├── jobs/
│       │   ├── moderatePostJob.ts · sendPushJob.ts · exportUserDataJob.ts
│       └── lib/
│           ├── bullmq.ts · keycloak.ts
│           └── anonymousStore.ts       ← isolated schema; services-only access
└── frontend/src/
    ├── context/AuthContext.tsx          ← existing Keycloak
    ├── services/                       ← React Query API wrappers
    ├── hooks/                          ← React Query hooks
    ├── pages/
    │   ├── [existing pages]
    │   ├── onboarding/                 ← 🔴 New — first-user journey (Nadia)
    │   ├── spaces/                     ← 🔴 New Luma Spaces
    │   ├── editorial/                  ← 🔴 New internal editorial workflow
    │   └── partnerships/               ← 🔴 New brand partner self-service
    └── components/
        └── ui/
            ├── ErrorState/ · EmptyState/ · ContentWarning/
```

### Key Structural Notes

- **Shared Docker image:** Backend and BullMQ worker use the same `luma-backend` image; different k8s Deployments override the container entrypoint — no second Dockerfile
- **K8s Secrets:** Created imperatively via `kubectl create secret generic luma-backend-secrets --from-env-file=.env.production`; never committed to git
- **`anonymousStore.ts`:** Accessible only from within `services/` — never imported by routes or controllers directly
- **Route split:** `partnerships.ts` → `editorial.ts` (internal staff) + `brandPartners.ts` (external partners)
- **Page split:** `pages/editorial/` (internal team UX) + `pages/partnerships/` (external partner UX)

### FR Capability Area → Directory Mapping

| Capability Area | Backend | Frontend |
|---|---|---|
| Identity & Membership | `routes/users.ts` + `services/gdprService.ts` | `pages/profile/` + `pages/onboarding/` |
| Community & Content | `routes/groups.ts`, `posts.ts`, `feed.ts` | `pages/groups/`, `pages/feed/` |
| Community Safety | `workers/moderationWorker.ts` + `services/moderationService.ts` | `pages/admin/moderation/` |
| Events (Luma Spaces) | `routes/lumaSpaces.ts` | `pages/spaces/` |
| Brand Partnerships | `routes/editorial.ts` + `routes/brandPartners.ts` | `pages/editorial/` + `pages/partnerships/` |
| Subscriptions | `routes/subscriptions.ts` | `pages/settings/` |
| Notifications | `routes/notifications.ts` + `jobs/sendPushJob.ts` | global notification center |
| Administration | `routes/admin.ts` + `jobs/exportUserDataJob.ts` | `pages/admin/` |

---

## Architecture Validation Results

### Coherence ✅

All technology choices are compatible — Express 4 + Prisma 6 + PostgreSQL 15 + Socket.io 4 + BullMQ + Keycloak are production-stable with no version conflicts. React 19 + Vite 7 + React Router 7 + Capacitor 8 + React Query are compatible. No contradictory decisions found.

### Requirements Coverage ✅

**All 56 FRs architecturally covered across 8 capability areas.**

| NFR | Coverage |
|---|---|
| Performance (200ms P95) | ✅ Redis caching; React Query optimistic updates |
| Security (OWASP Top 10) | ✅ JWT + RBAC + Zod + AES-256 |
| Privacy / GDPR | ✅ Isolated anonymous schema + GDPR route + export job |
| Scalability | ✅ k3s vertical MVP; BullMQ worker scales independently |
| Reliability (99.5%) | ✅ pg_dump backup + node failure runbook |
| Accessibility (WCAG 2.1 AA) | ✅ axe-core in CI pipeline + manual screen reader testing in staging before launch |
| Trauma-informed design | ✅ ErrorState / EmptyState / ContentWarning as first-class components |
| AI integration quality | ✅ BullMQ 3× retry + dead-letter queue; false positive rate tracked |

### Gap Analysis

**No critical gaps.**

**Legal actions — with timing (non-negotiable):**
- ⚠️ **AI DPA:** Initiate at project kickoff — ≥4 weeks before pre-launch cohort begins
- ⚠️ **Anonymous post legal review:** Must be signed off before that module enters the implementation queue

**Deferred to Growth:** Sealed Secrets · Flutter migration · Longhorn storage · Express 5 upgrade

### Architecture Readiness Assessment

**Status: ✅ READY FOR IMPLEMENTATION — Confidence: High**

### Completeness Checklist

- [x] Project context analysed — brownfield, 5 cross-cutting concerns
- [x] Stack confirmed — Express/React/Prisma/Socket.io/Keycloak/BullMQ/Redis
- [x] All critical decisions documented — hosting, auth, DB, caching, CI/CD, secrets
- [x] 10 mandatory implementation pattern rules
- [x] Full project directory tree with FR→directory mapping
- [x] 56 FRs + 8 NFR categories covered
- [x] Two legal gates flagged with timing

### First Implementation Task

> **Prisma model audit** — add `role` to `User`, `anonymousFlag` + identity link reference to `Post`, moderation settings to `Group` — write and run migrations before any other feature work begins.

### AI Agent Implementation Guidelines

- Follow all architectural decisions exactly as documented in this file
- Use the 10 mandatory implementation patterns across all components
- Respect `anonymousStore.ts` access boundary — services only, never routes
- Refer to this document for all architectural questions before making assumptions
- AI DPA and anonymous post legal review are hard gates — do not build those modules before they are cleared



