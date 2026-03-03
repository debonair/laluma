# Source Tree Analysis — Luma

> **Generated:** 2026-03-02 | **Repository Type:** Multi-Part

---

## Repository Root

```
luma/                              # Project root
├── README.md                      # Quick start guide
├── docker-compose.yml             # Production orchestration
├── docker-compose.dev.yml         # Development overrides
├── package.json                   # Root scripts (if any)
├── tsconfig.json                  # Root TypeScript config
├── openapitools.json              # OpenAPI generator config
│
├── backend/                       # ← Express API + WebSocket Server (Part: backend)
├── frontend/                      # ← React SPA + Capacitor Mobile (Part: frontend)
├── docs/                          # ← BMAD-generated documentation (this dir)
│
├── _bmad/                         # BMAD framework (AI-assisted dev tooling)
│   ├── bmm/                       # BMAD Module Manager
│   │   ├── config.yaml            # Project configuration
│   │   └── workflows/             # BMAD workflow definitions
│   └── core/                      # Core BMAD runtime
│
└── _bmad-output/                  # BMAD planning artifacts
    ├── planning-artifacts/
    └── implementation-artifacts/
```

---

## Backend (`backend/`)

```
backend/
├── package.json                   # Backend dependencies
├── tsconfig.json                  # TypeScript config (strict)
├── vitest.config.ts               # Test configuration
├── Dockerfile                     # Production Docker image
├── .env                           # Environment variables (gitignored)
│
├── src/                           # Source code
│   ├── index.ts                   # ★ Entry point — app bootstrap, route registration
│   ├── db.ts                      # Prisma client singleton
│   ├── socket.ts                  # Socket.io server setup & event handlers
│   │
│   ├── routes/                    # Route bindings (15 files)
│   │   ├── auth.routes.ts         # /api/auth
│   │   ├── user.routes.ts         # /api/users
│   │   ├── groups.routes.ts       # /api/groups
│   │   ├── posts.routes.ts        # /api/posts
│   │   ├── feed.routes.ts         # /api/feed
│   │   ├── content.routes.ts      # /api/content (My Luma articles/videos/events)
│   │   ├── submissions.routes.ts  # /api/submissions
│   │   ├── subscription.routes.ts # /api/subscriptions (Stripe)
│   │   ├── notification.routes.ts # /api/notifications
│   │   ├── messages.routes.ts     # /api/messages (REST + Socket.io)
│   │   ├── connection.routes.ts   # /api/connections
│   │   ├── polls.routes.ts        # /api/polls
│   │   ├── marketplace.routes.ts  # /api/marketplace
│   │   ├── directory.routes.ts    # /api/directory
│   │   └── admin.routes.ts        # /api/admin (admin-only)
│   │
│   ├── controllers/               # Business logic + DB queries (18 files)
│   │   ├── auth.controller.ts     # Auth logic (signup, signin, Keycloak JIT)
│   │   ├── user.controller.ts     # User CRUD, avatar upload
│   │   ├── groups.controller.ts   # Group management, membership
│   │   ├── posts.controller.ts    # Posts, comments, likes
│   │   ├── feed.controller.ts     # Activity feed aggregation
│   │   ├── content.controller.ts  # My Luma content (the largest controller)
│   │   ├── submissions.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── marketplace.controller.ts
│   │   ├── directory.controller.ts
│   │   ├── connection.controller.ts
│   │   ├── polls.controller.ts
│   │   └── admin.controller.ts
│   │   # + 4 *.test.ts files (co-located tests)
│   │
│   ├── middleware/                # Express middleware (4 files)
│   │   ├── auth.ts                # JWT/Keycloak authentication
│   │   ├── rateLimiter.ts         # Global + auth-specific rate limiting
│   │   └── (2 others)
│   │
│   ├── utils/                     # Utility helpers (4 files)
│   │   ├── jwt.ts                 # JWT sign/verify helpers
│   │   ├── password.ts            # bcrypt helpers
│   │   └── (2 others)
│   │
│   ├── services/                  # Optional service layer directory
│   └── test/                      # Test utilities (1 file)
│
├── prisma/                        # Database schema + migrations
│   ├── schema.prisma              # ★ Full DB schema (20 models)
│   ├── seed.ts                    # Development data seeder
│   ├── seed-content.ts            # Content-specific seeder
│   └── migrations/                # Migration history (6 migrations)
│
└── uploads/                       # File upload storage (gitignored)
```

**Critical Directories:**
- `src/routes/` — Start here to understand API surface
- `src/controllers/` — Business logic and DB queries
- `src/middleware/auth.ts` — Authentication entry point
- `prisma/schema.prisma` — Authoritative data model

---

## Frontend (`frontend/`)

```
frontend/
├── package.json                   # Frontend dependencies
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                 # Vite + React plugin config
├── eslint.config.js               # ESLint rules
├── capacitor.config.ts            # Capacitor mobile config
├── index.html                     # HTML entry point
├── Dockerfile                     # Production Docker image
├── nginx.conf                     # Nginx config for production container
│
├── src/                           # Source code
│   ├── main.tsx                   # ★ App entry — Keycloak init + React DOM mount
│   ├── App.tsx                    # ★ Root component — all route definitions
│   ├── index.css                  # Global styles + CSS custom properties
│   ├── App.css                    # App-level styles
│   │
│   ├── components/                # Reusable UI components (9 items)
│   │   ├── ErrorBoundary/         # Global error boundary (catches React errors)
│   │   └── (8 others)            # Shared navigation, layout components
│   │
│   ├── context/                   # React Context providers (5 contexts)
│   │   ├── AuthContext.tsx        # ★ Keycloak auth state, user identity
│   │   ├── NotificationContext.tsx# Notification state + Socket.io events
│   │   └── (3 others)
│   │
│   ├── pages/                     # Route-mapped page components (48 pages)
│   │   ├── auth/                  # SignIn, SignUp, Onboarding
│   │   ├── groups/                # Groups list, GroupDetail, GroupCreate
│   │   ├── content/               # My Luma: articles, videos, events
│   │   ├── messaging/             # Conversations, DirectMessage thread
│   │   ├── marketplace/           # Listings, CreateListing
│   │   ├── directory/             # LocalDirectory, ListingDetail
│   │   ├── profile/               # UserProfile, Settings
│   │   ├── feed/                  # Home (main feed)
│   │   ├── admin/                 # AdminDashboard
│   │   └── (various others)
│   │
│   ├── services/                  # API client layer (25 service files)
│   │   ├── authService.ts         # Auth endpoints
│   │   ├── groupService.ts        # Groups API
│   │   ├── contentService.ts      # My Luma content API (largest)
│   │   ├── messageService.ts      # Messaging API
│   │   ├── notificationService.ts # Notifications API
│   │   ├── connectionService.ts   # Connections API
│   │   ├── marketplaceService.ts  # Marketplace API
│   │   ├── directoryService.ts    # Directory API
│   │   ├── subscriptionService.ts # Subscription API
│   │   └── (16 others)
│   │
│   ├── types/                     # Shared TypeScript types (2 files)
│   │   └── index.ts               # All shared interfaces/types
│   │
│   ├── utils/                     # Helpers (1 file)
│   ├── assets/                    # Static assets (images, SVGs)
│   └── test/                      # Test setup (3 files)
│
├── public/                        # Static public assets (2 files)
└── android/                       # Android Capacitor project
```

**Critical Directories:**
- `src/main.tsx` — Start here for auth bootstrap
- `src/App.tsx` — Start here for routing
- `src/context/AuthContext.tsx` — User identity/auth
- `src/services/` — All backend communication
- `src/pages/` — Feature UI components

---

## How Parts Interface

```
frontend/src/services/   →   HTTP GET/POST/PUT/DELETE   →   backend/src/routes/
frontend/src/ (Socket)   →   WebSocket (ws://)          →   backend/src/socket.ts
```

Both parts share:
- **Auth Token:** Keycloak JWT issued by Keycloak server
- **Data Types:** Response shapes defined in `frontend/src/types/index.ts`
- **Ports:** Frontend on `:5173` (dev) / `:80` (prod), Backend on `:3000`
