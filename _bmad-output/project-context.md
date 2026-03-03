---
project_name: 'luma'
user_name: 'Duma'
date: '2026-03-02'
sections_completed: ['technology_stack', 'frontend_patterns', 'backend_patterns', 'database', 'auth', 'testing', 'architecture', 'naming_conventions']
existing_patterns_found: 42
---

# Project Context for AI Agents — Luma

_This file contains critical rules and patterns that AI agents MUST follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Project Overview

**Luma** is a mobile-first community platform for mothers. It is a monorepo with:
- `frontend/` — React 19 web app (also packaged as a mobile app via Capacitor)
- `backend/` — Node.js REST API with Express and Prisma

Both apps are TypeScript-first with strict mode enabled.

---

## Technology Stack & Versions

### Frontend (`frontend/`)
| Technology | Version | Notes |
|---|---|---|
| React | 19.2.0 | Functional components only. No class components. |
| react-router-dom | 7.13.0 | `<BrowserRouter>`, `<Routes>`, `<Route>` |
| TypeScript | ~5.9.3 | Strict mode — see strict rules below |
| Vite | 7.3.1 | Dev server and bundler |
| Vitest | 4.0.18 | Test framework (NOT Jest) |
| @testing-library/react | 16.3.2 | Component testing library |
| Axios | 1.13.5 | HTTP client — use `apiClient` from `services/api.ts`, NOT raw axios |
| Keycloak-js | 26.2.3 | Referenced but auth is custom JWT via custom `authService` |
| Socket.io-client | 4.8.3 | Real-time via `SocketContext` |
| Capacitor | 8.1.0 | iOS/Android packaging; affects base URL (`10.0.2.2` on Android) |
| lucide-react | 0.575.0 | Icon library — use lucide icons only |
| date-fns | 4.1.0 | Date formatting/manipulation |

### Backend (`backend/`)
| Technology | Version | Notes |
|---|---|---|
| Node.js | — | ESM modules via `tsx` for dev, compiled to `dist/` for prod |
| Express | 4.21.2 | REST API only |
| TypeScript | 5.7.3 | Strict mode — see strict rules below |
| Prisma | 6.1.0 | ORM — always use `prisma` singleton from `src/utils/prisma` |
| PostgreSQL | — | Only supported database |
| Vitest | 4.0.18 | Test framework |
| Supertest | 7.2.2 | API integration testing |
| Zod | 3.24.1 | Request validation schemas |
| Socket.io | 4.8.1 | Real-time messaging |
| JWT / jwks-rsa | 9.0.3 / 3.2.2 | Token validation against Keycloak via RS256 |
| bcrypt | 5.1.1 | Password hashing (legacy; Keycloak manages OAuth passwords) |
| Helmet | 8.1.0 | Security headers |
| express-rate-limit | 8.2.1 | Rate limiting |
| Multer | 2.0.2 | File uploads to `uploads/` directory |

---

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── App.tsx              # Root: routing + all context providers
├── main.tsx             # Entry point — do NOT modify without care
├── index.css            # Global styles — single CSS file approach
├── components/          # Shared reusable components (small set)
├── context/             # React context providers (auth, socket, group, toast)
├── pages/               # One file per page/route (PascalCase.tsx)
├── services/            # API service modules (one per domain)
├── types/               # Shared TypeScript interfaces/types
├── utils/               # Pure utility functions
└── test/                # Test setup and shared test utilities
```

### Context Providers (MANDATORY usage — do NOT duplicate state)
All providers are stacked in `App.tsx` in this exact order:
```
ToastProvider → AuthProvider → SocketProvider → GroupProvider → Routes
```
- **AuthContext** (`useAuth`): `user`, `isAuthenticated`, `isLoading`, `signIn`, `signUp`, `signOut`, `updateProfile`
- **SocketContext** (`useSocket`): Socket.io client connection
- **GroupContext** (`useGroup`): Group membership/listing state
- **ToastContext** (`useToast`): Toast notifications

### API Client Pattern — CRITICAL
- **Always import `apiClient`** from `../services/api` or `../../services/api` — NEVER create a new axios instance
- `apiClient` automatically:
  - Attaches `Bearer <token>` Authorization header
  - Silently refreshes expired tokens using `refreshToken` from `tokenStorage`
  - Redirects to `/signin` on 401 or refresh failure
- Base URL resolves to:
  - `http://10.0.2.2:3000` on Android Capacitor
  - `process.env.VITE_API_URL` if set
  - `http://localhost:3000` otherwise

### Service Layer Pattern
Each domain has a service file in `services/`: `*.service.ts`. Services use `apiClient`.
```typescript
// CORRECT pattern
import apiClient from './api';
export const groupsService = {
  getAll: () => apiClient.get('/groups'),
  // ...
};
```
- `auth.service.ts` — auth sign-in/sign-up/refresh/sign-out + `tokenStorage` (localStorage)
- `user.service.ts` — current user CRUD
- `groups.service.ts`, `posts.service.ts`, `content.service.ts`, etc.

### Authentication State — CRITICAL RULES
- `tokenStorage` stores `accessToken`, `refreshToken`, `expiresAt` in `localStorage`
- `isExpired()` checks if `expiresAt` < now
- **Roles** come from TWO sources merged: DB `role` field AND JWT `realm_access.roles`
- Admin check: `user.roles.includes('app-admin')` (NOT `user.role === 'admin'`)
- `ProtectedRoute` wraps all auth-required routes — shows `Skeleton` while loading
- `AdminRoute` wraps admin-only routes — additional role check on top of auth

### Component Patterns
- All components are `React.FC<Props>` — always type props explicitly
- Co-locate component CSS: `ComponentName.css` beside `ComponentName.tsx`
- Test files: `ComponentName.test.tsx` beside the component
- Skeleton component (`components/Skeleton.tsx`) for loading states
- `ErrorBoundary` component (`components/ErrorBoundary.tsx`) exists at root

### TypeScript Strict Rules (Frontend)
- `strict: true` — all fields must be typed
- `noUnusedLocals: true` — no dead variables
- `noUnusedParameters: true` — no dead function params
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — avoid experimental decorators
- `noUncheckedSideEffectImports: true`
- Test files are excluded from `tsconfig.app.json` — they compile under a separate config

---

## Backend Architecture

### Directory Structure
```
backend/src/
├── index.ts             # Express app setup, middleware, route registration
├── db.ts                # Prisma client singleton (re-export only)
├── socket.ts            # Socket.io setup and event handlers
├── controllers/         # Request handlers (one file per domain)
├── routes/              # Express router definitions (*.routes.ts)
├── middleware/          # auth.ts, rateLimiter.ts, subscription.ts, upload.ts
├── services/            # Business logic (if present)
└── utils/               # Shared helpers (prisma singleton, etc.)
```

### Route & Controller Pattern
```
routes/[domain].routes.ts  →  calls  →  controllers/[domain].controller.ts
```
- Routes import controller functions and apply middleware
- Controllers contain all business logic and Prisma calls
- Every route file is registered in `src/index.ts` under `/api/[domain]`

### Existing API Routes
```
POST/GET /api/auth/*           Auth (with authLimiter)
GET/PUT  /api/users/*          User profiles
GET/POST /api/groups/*         Groups CRUD + membership
GET/POST /api/posts/*          Group posts + comments + likes + polls
GET      /api/feed             Feed
GET/POST /api/content/*        My Luma content (admin CRUD + user read)
POST     /api/subscriptions/*  Subscription management
GET      /api/notifications/*  Notifications
GET/POST /api/messages/*       Direct messages + conversations
POST/GET /api/submissions/*    User content submissions
GET/POST /api/admin/*          Admin dashboard (requires app-admin role)
GET/POST /api/connections/*    Friend/connection system
GET/POST /api/polls/*          Polls on posts/content
GET/POST /api/marketplace/*    Marketplace listings
GET/POST /api/directory/*      Local business directory
GET      /health               Health check (no auth)
```

### Authentication & Authorization — CRITICAL
- Auth middleware is in `middleware/auth.ts`
- **`authenticate`**: Required auth — returns 401 if no/invalid token
- **`optionalAuthenticate`**: Soft auth — sets `req.user` if token present, continues either way
- **`requireRole(...roles)`**: Factory fn for RBAC — call AFTER `authenticate`
- Request type: always extend `AuthRequest` (not Express `Request`) in controllers that need `req.user`
- Keycloak realm: `luma-realm`; token algorithm: `RS256`
- **JIT Provisioning**: On every request, auth middleware creates/links the user in the local `users` table using the Keycloak `sub` claim as `keycloakId`
- Admin check uses `req.user.roles.includes('app-admin')`

```typescript
// CORRECT backend usage
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

router.get('/admin/stuff',
  authenticate,
  requireRole('app-admin'),
  async (req: AuthRequest, res) => {
    const userId = req.user!.userId; // userId is local DB UUID
  }
);
```

### Error Response Format — ALWAYS follow this shape
```typescript
// Error responses
res.status(4xx).json({
  error: 'Error Title',      // e.g., 'Not Found', 'Unauthorized', 'Bad Request'
  message: 'Human message',  // Descriptive message for client
  code: 'SCREAMING_SNAKE'    // Optional but preferred
});

// Success responses — use appropriate HTTP status
res.status(200).json({ data });
res.status(201).json({ data }); // for creates
```

### Prisma Usage — CRITICAL
- **Always import from `../utils/prisma`** (the singleton) — NEVER `new PrismaClient()`
- Prisma schema uses `snake_case` column names with `@map()` — JS fields are `camelCase`
- All IDs are `uuid()` strings (not integers)
- `onDelete: Cascade` on all child relations
- `onDelete: SetNull` when the parent's absence shouldn't delete children (posts, content)
- Run migrations: `npm run prisma:migrate`
- Generate client: `npm run prisma:generate`

### Zod Validation Pattern
```typescript
// In controllers, validate request body before Prisma calls
import { z } from 'zod';
const schema = z.object({ name: z.string().min(1) });
const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: 'Bad Request', message: parsed.error.message });
  return;
}
```

### File Uploads
- Middleware: `middleware/upload.ts` (Multer)
- Uploads stored at `backend/uploads/` — served statically at `/uploads`
- File URL in frontend: `${SERVER_URL}/uploads/filename`

### WebSockets (Socket.io)
- Setup is in `backend/src/socket.ts`
- Client connects using `SocketContext` in frontend
- Authentication token must be sent during handshake

---

## Database (PostgreSQL + Prisma)

### Key Models & Relationships
- **User** → has one `UserPreference` (location, lookingFor), one `Subscription`
- **Group** → has many `GroupMember`, `Post`
- **Post** → belongs to `Group`, may have one `Poll`
- **Content** — "My Luma" articles/videos — has `ContentComment`, `ContentLike`, `ContentBookmark`, may have `Poll`
- **Conversation** → has many `ConversationParticipant` (pivot), `Message`
- **Connection** — friend/follow system: `pending → accepted/declined`
- **Poll** — linked to either a `Post` OR `Content` (not both), has `PollOption`, `PollVote`
- **Notification** — has `userId` (recipient) and `actorId` (who triggered), `metadata: Json`
- **ContentSubmission** — user-submitted content awaiting admin approval

### Naming Conventions in Schema
- DB columns: `snake_case` (e.g., `created_at`, `profile_image_url`)
- Prisma fields: `camelCase` (e.g., `createdAt`, `profileImageUrl`)
- Table names: lowercase plural `snake_case` (via `@@map`)
- All IDs: UUID strings

---

## Testing

### Frontend Tests
- Runner: **Vitest** (not Jest) — config in `frontend/vite.config.ts`
- Environment: `jsdom`
- Setup file: `frontend/src/test/setup.ts`
- Test file pattern: `**/*.test.tsx` or `**/*.test.ts` (co-located with source)
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for interactions
- Mock pattern: `vi.mock(...)` not `jest.mock(...)`

### Backend Tests
- Runner: **Vitest** — config in `backend/vitest.config.ts`
- Pattern: `src/test/*.test.ts`
- `supertest` for API endpoint integration tests
- `vitest-mock-extended` for Prisma mocking

### Running Tests
```bash
# Frontend
cd frontend && npx vitest run
cd frontend && npx vitest run --coverage

# Backend
cd backend && npm test
cd backend && npm run test:coverage
```

---

## Naming Conventions

### Files
- Pages: `PascalCase.tsx` (e.g., `GroupDetail.tsx`)
- Components: `PascalCase.tsx` (e.g., `Skeleton.tsx`)
- Services: `camelCase.service.ts` (e.g., `user.service.ts`)
- Routes: `camelCase.routes.ts` (e.g., `groups.routes.ts`)
- Controllers: `camelCase.controller.ts` (e.g., `groups.controller.ts`)
- Tests: co-located `*.test.tsx` / `*.test.ts`
- CSS: co-located `ComponentName.css` for page/component-specific styles

### Code
- React components: `PascalCase` function names
- Hooks: `useCamelCase`
- Context files export both `Provider` and `useContextName` hook
- All interfaces/types: `PascalCase`
- Backend request interfaces: extend `AuthRequest` when accessing `req.user`

---

## Development Workflow

### Running Locally
```bash
# Backend
cd backend && npm run dev     # tsx watch on port 3000

# Frontend
cd frontend && npm run dev    # Vite dev server on port 5173
```

### Docker (Compose)
```bash
# Full stack with Keycloak + PostgreSQL
docker-compose up             # Production config
docker-compose -f docker-compose.dev.yml up  # Dev config
```

### Environment Variables
- Frontend: `VITE_API_URL` — override backend URL
- Backend: `DATABASE_URL`, `KEYCLOAK_URL`, `PORT`
- Keycloak runs on port `8080` by default

### Build
```bash
# Frontend
cd frontend && npm run build  # tsc -b && vite build → dist/

# Backend
cd backend && npm run build   # tsc → dist/
cd backend && npm start       # Run compiled dist/index.js
```

---

## Critical Rules for AI Agents

1. **NEVER create a new axios instance** — always use `apiClient` from `services/api.ts`
2. **NEVER use `new PrismaClient()`** — always import the singleton from `src/utils/prisma`
3. **Always use `AuthRequest`** (not `Request`) in controllers requiring `req.user`
4. **Check admin role** with `req.user.roles.includes('app-admin')` or `user.roles.includes('app-admin')` — NOT `role === 'admin'`
5. **Error responses** must match the `{ error, message, code }` shape
6. **Vitest not Jest** — use `vi.mock`, `vi.fn()`, not `jest.mock`, `jest.fn()`
7. **import type** for type-only imports (TypeScript verbatimModuleSyntax)
8. **No unused variables or parameters** — TypeScript will error
9. **UUIDs, not integers** for all IDs
10. **Capacitor** is installed — be aware of platform-dependent behavior (especially base URL in `api.ts`)
11. **Keycloak JIT provisioning** happens inside `authenticate` middleware — do NOT manually create users from auth routes
12. **Socket.io** real-time features must go through the backend `socket.ts` setup — do not add socket listeners in random controllers
13. **All new routes** must be registered in `backend/src/index.ts`
14. **Co-locate CSS and tests** with their component/page files
15. **No class components** in the frontend — hooks only
