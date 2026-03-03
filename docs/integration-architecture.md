# Integration Architecture — Luma

> **Generated:** 2026-03-02 | **Repository Type:** Multi-Part

---

## Overview

The Luma application consists of two separate services that communicate via two channels:

| Channel | Protocol | Purpose |
|---|---|---|
| **REST API** | HTTP (Axios → Express) | CRUD operations, data fetching |
| **WebSocket** | Socket.io | Real-time messaging, notifications |

Both are served from the same backend process (`backend/src/index.ts`) — Express handles HTTP routes and Socket.io is attached to the same HTTP server instance.

---

## Integration Points

```
┌──────────────────────┐                    ┌──────────────────────┐
│     FRONTEND         │                    │      BACKEND         │
│  (React / Capacitor) │                    │  (Express + Node.js) │
│                      │                    │                      │
│  src/services/*.ts   │ ◄──── REST ─────► │  src/routes/*.ts     │
│                      │  HTTP + Bearer JWT │  src/controllers/*.ts│
│                      │                    │                      │
│  Socket.io-client    │ ◄── WebSocket ──► │  src/socket.ts       │
│  (in App.tsx /       │  ws:// + JWT auth  │  Socket.io server    │
│   NotificationCtx)   │                    │                      │
└──────────────────────┘                    └──────────┬───────────┘
                                                       │ Prisma ORM
                                                       ▼
                                            ┌──────────────────────┐
                                            │     PostgreSQL 15     │
                                            └──────────────────────┘

Both services share:
  ┌──────────────────────┐
  │   Keycloak Server    │
  │  (Identity Provider) │
  └──────────────────────┘
       ↑              ↑
  frontend        backend
  (keycloak-js)  (jwks-rsa JWT verify)
```

---

## REST API Integration

### Communication Pattern

```typescript
// Frontend: src/services/groupService.ts (example pattern)
const response = await axios.get('/api/groups', {
  headers: { Authorization: `Bearer ${keycloak.token}` }
});

// Backend: src/routes/groups.routes.ts
router.get('/', authenticate, groupsController.listGroups);

// Backend: src/middleware/auth.ts
// Validates Bearer token → either Keycloak JWT or local JWT
// Sets req.user = { id, email, role }

// Backend: src/controllers/groups.controller.ts
export const listGroups = async (req, res) => {
  const groups = await prisma.group.findMany({ ... });
  res.json({ data: groups });
};
```

### Auth Token Flow

```
1. User logs in via Keycloak (frontend)
2. Keycloak issues JWT token
3. Frontend stores token in keycloak.token
4. All Axios requests include: Authorization: Bearer <token>
5. Backend auth.middleware validates JWT:
   a. Try Keycloak JWKS validation (RS256)
   b. Fall back to local JWT_SECRET validation (HS256)
6. JIT Provisioning: if Keycloak user not in DB → create user record
7. req.user populated → controller runs
```

---

## WebSocket Integration

### Socket.io Setup

```typescript
// Backend: src/socket.ts
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN }
});

io.use(socketAuthMiddleware);  // Validates JWT on connection

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);  // Personal room

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    // Save to DB via Prisma
    // Emit to conversation room
    io.to(`conversation:${data.conversationId}`).emit('new_message', message);
  });
});
```

### Frontend Socket Connection

```typescript
// Frontend: typically in App.tsx or a SocketContext
import { io } from 'socket.io-client';

const socket = io(process.env.VITE_API_URL, {
  auth: { token: keycloak.token }
});

socket.on('new_message', (message) => {
  // Update message state in component
});

socket.on('notification', (notification) => {
  // Update notification context
});
```

---

## Shared Authentication (Keycloak)

```
┌─────────────────────────────────────────────────────────┐
│                    Keycloak Server                       │
│  Realm: luma  |  Client: luma-frontend + luma-backend    │
└───────────┬─────────────────────────────────┬───────────┘
            │                                 │
            ▼ OIDC Login Flow                  ▼ JWKS Endpoint
     ┌──────────────┐                  ┌──────────────────┐
     │  Frontend    │                  │     Backend      │
     │  keycloak-js │                  │  jwks-rsa verify │
     └──────────────┘                  └──────────────────┘
           │ Keycloak JWT                      │ Validates same JWT
           └──────────────────────────────────►│
                     Authorization: Bearer <JWT>
```

---

## Data Flow Examples

### User Sends a Message (Real-time)

```
Frontend (MessageThread.tsx)
  ↓ user submits message
Socket.emit('send_message', { conversationId, content })
  ↓ WebSocket
Backend (socket.ts)
  ↓ auth validated
Prisma → INSERT into messages table
  ↓
Socket.to(`conversation:${id}`).emit('new_message', message)
  ↓ WebSocket
All connected participants receive new_message event
  ↓
Frontend updates message list in real-time
```

### User Views Content Feed (REST)

```
Frontend (HomePage.tsx)
  ↓ useEffect / on mount
contentService.getFeed()
  ↓ GET /api/feed + Bearer JWT
Backend (feed.routes.ts → feed.controller.ts)
  ↓ authenticate middleware validates JWT
Prisma query: posts from groups user has joined
  ↓
Response: { data: Post[] }
  ↓
Frontend renders feed items
```

---

## Integration Points Summary

| From | To | Method | Endpoint/Event | Auth |
|---|---|---|---|---|
| Frontend services | Backend REST | HTTP GET/POST/PUT/DELETE | `/api/*` | Bearer JWT |
| Frontend Socket | Backend Socket | WebSocket | Various events | JWT handshake |
| Backend | Keycloak | HTTP (JWKS validation) | `/.well-known/jwks.json` | — |
| Backend | PostgreSQL | Prisma ORM | TCP | DB credentials |
| Frontend | Keycloak | Browser OIDC | Keycloak login page | — |

---

## Port Reference

| Service | Dev Port | Prod Port | Notes |
|---|---|---|---|
| Frontend | 5173 | 80 (Nginx) | Vite dev server in dev |
| Backend | 3000 | 3000 | Same port dev/prod |
| PostgreSQL | 5432 | 5432 | Internal Docker network in prod |
| Keycloak | 8080 | 8080+ | External IdP |
