# Architecture — Frontend

> **Part:** `frontend/` | **Type:** React SPA + Capacitor Mobile | **Generated:** 2026-03-02

---

## Executive Summary

The Luma frontend is a **React 19 single-page application** built with **Vite**. It is designed to run both as a web browser app and as a native mobile app (iOS/Android) via **Capacitor**. Authentication is handled by **Keycloak-js**, API communication via **Axios**, and real-time features via **Socket.io-client**. Routing uses **React Router DOM v7** with nested route structures. State management is done through **React Context API** (no external store like Redux).

---

## Technology Stack

| Category | Technology | Version | Notes |
|---|---|---|---|
| Language | TypeScript | ~5.9.3 | Strict config |
| UI Framework | React | ^19.2.0 | React 19 (stable) |
| Build Tool | Vite | ^7.3.1 | Fast HMR |
| Routing | React Router DOM | ^7.13.0 | v7 data router |
| Mobile | Capacitor | ^8.1.0 | iOS + Android |
| Auth | keycloak-js | ^26.2.3 | SSO integration |
| HTTP | Axios | ^1.13.5 | API client |
| Real-time | Socket.io-client | ^4.8.3 | WebSocket |
| Icons | Lucide React | ^0.575.0 | Icon library |
| Dates | date-fns | ^4.1.0 | Date formatting |
| Linting | ESLint | ^9.x | React hooks plugin |
| Testing | Vitest + @testing-library/react | ^4.0.18 | Unit tests |
| Test DOM | jsdom | ^28.1.0 | Browser emulation |
| API Docs | swagger-ui-express + yamljs | — | Embedded Swagger UI |

---

## Application Structure

```
frontend/src/
├── main.tsx              # App entry point + Keycloak init
├── App.tsx               # Root component + route definitions
├── App.css               # Global styles
├── index.css             # Base CSS variables + design tokens
│
├── components/           # Reusable shared UI components
│   ├── ErrorBoundary/    # Global error boundary
│   └── (8 others)
│
├── context/              # React Context providers (5 contexts)
│   ├── AuthContext       # User auth state + Keycloak
│   ├── NotificationContext
│   └── (others)
│
├── pages/                # Route-mapped page components (48 pages)
│   ├── auth/             # SignIn, SignUp, Onboarding
│   ├── groups/           # Groups list, detail, management
│   ├── content/          # My Luma articles, videos, events
│   ├── messaging/        # Conversations, direct messages
│   ├── marketplace/      # Listings, create listing
│   ├── directory/        # Local service directory
│   ├── profile/          # User profile, settings
│   ├── feed/             # Home feed
│   ├── admin/            # Admin dashboard
│   └── (many others)
│
├── services/             # API client layer (25 service files)
│   ├── authService.ts    # Auth endpoints
│   ├── groupService.ts   # Groups API
│   ├── contentService.ts # Content/My Luma API
│   ├── messageService.ts # Messaging API
│   └── (21 others)
│
├── types/                # TypeScript type definitions (2 files)
│   └── index.ts          # Shared interfaces
│
├── utils/                # Utility helpers (1 file)
│
├── test/                 # Test infrastructure (3 files)
│   ├── setup.ts
│   └── mocks/
│
└── assets/               # Static assets (images, SVGs)
```

---

## Architecture Pattern

```
User Action
    │
    ▼
[React Component] (pages/ or components/)
    │
    ├─ Local State: useState / useReducer
    │
    ├─ Shared State: useContext (context/)
    │
    ├─ API Call: services/*.ts (via Axios)
    │               │
    │               ▼
    │           [Backend REST API]
    │
    └─ Real-time: Socket.io-client events
                      │
                      ▼
                  [Backend WebSocket]
```

---

## Authentication Flow (Keycloak + React)

```
App Bootstrap (main.tsx):
  1. Initialize Keycloak instance
  2. keycloak.init() → silent SSO check
  3. If authenticated → set token in Axios defaults
  4. Backend creates/syncs user via JIT

AuthContext:
  - Exposes: user, isAuthenticated, logout, login
  - Keycloak token refresh handled automatically
  - Token attached to all Axios requests as Bearer header

Protected Routes:
  - Routes check isAuthenticated from AuthContext
  - Redirect to /signin if not authenticated
```

---

## Routing Structure

The app uses React Router DOM v7 with a data router pattern in `App.tsx`:

| Route | Page Component | Auth Required |
|---|---|---|
| `/` | Home/Feed | ✅ |
| `/signin` | SignIn | ❌ |
| `/signup` | SignUp | ❌ |
| `/onboarding` | Onboarding flow | ✅ |
| `/groups` | Groups list | ✅ |
| `/groups/:id` | Group detail | ✅ |
| `/content` | My Luma hub | ✅ |
| `/content/:id` | Content detail | ✅ |
| `/messages` | Conversations list | ✅ |
| `/messages/:id` | Conversation thread | ✅ |
| `/marketplace` | Marketplace listings | ✅ |
| `/directory` | Local directory | ✅ |
| `/profile/:id` | User profile | ✅ |
| `/settings` | User settings | ✅ |
| `/admin` | Admin dashboard | ✅ (admin role) |

---

## Capacitor Mobile Configuration

The frontend builds to native mobile via Capacitor:

```typescript
// capacitor.config.ts
{
  appId: 'com.luma.app',
  appName: 'Luma',
  webDir: 'dist',
  server: { url: 'http://localhost:5173' }  // dev only
}
```

**Platforms:** iOS + Android (configured in `android/` directory)

**Build Process for Mobile:**
```bash
npm run build          # Build Vite app to dist/
npx cap sync           # Sync web assets to native platforms
npx cap open android   # Open in Android Studio
npx cap open ios       # Open in Xcode
```

---

## State Management

Luma uses **React Context API** (no Redux) with 5 context providers:

| Context | Responsibility |
|---|---|
| `AuthContext` | User identity, Keycloak token, login/logout |
| `NotificationContext` | In-app notification state + Socket.io events |
| *(3 others)* | Feature-specific shared state |

---

## Service Layer (API Client)

All backend communication goes through typed service files in `src/services/`:

```typescript
// Pattern used across all services
const response = await axios.get<ApiResponse>('/api/endpoint', {
  headers: { Authorization: `Bearer ${keycloak.token}` }
});
```

25 service files covering all API domains:
- `authService.ts`, `groupService.ts`, `contentService.ts`
- `messageService.ts`, `notificationService.ts`, `connectionService.ts`
- `marketplaceService.ts`, `directoryService.ts`, `subscriptionService.ts`
- *(and 16 more)*

---

## Testing Strategy

| Type | Tool | Config |
|---|---|---|
| Unit | Vitest | Root `vite.config.ts` |
| Component | @testing-library/react | `vitest.config.ts` |
| DOM | jsdom | Environment: `jsdom` |
| Coverage | @vitest/coverage-v8 | `coverage/` dir |

Test files co-located with source: `*.test.tsx`, `*.test.ts`

---

## Build & Scripts

| Script | Command | Description |
|---|---|---|
| Dev | `npm run dev` | Vite dev server (port 5173) |
| Build | `npm run build` | tsc + Vite production build |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | ESLint check |

---

## Design System

- **CSS Variables:** Defined in `src/index.css` (color primitives, spacing tokens)
- **Global Styles:** `src/App.css`
- **Icons:** Lucide React component library
- **No UI Framework:** Custom CSS-based components (no MUI/Tailwind/Ant Design)
