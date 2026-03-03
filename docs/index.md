# Luma — Documentation Index

> **Generated:** 2026-03-02 | **Tool:** BMAD Document Project Workflow v1.2.0 | **Scan Level:** Deep

---

## Project Overview

- **Type:** Multi-Part (Backend API + Frontend Web/Mobile App)
- **Primary Language:** TypeScript (both parts)
- **Architecture:** Layered REST API + WebSocket, React SPA + Capacitor Mobile
- **Database:** PostgreSQL 15 via Prisma ORM
- **Auth:** Keycloak SSO with JIT user provisioning

---

## Quick Reference

### Backend (`backend/`)

| Property | Value |
|---|---|
| **Type** | Node.js/Express REST API + Socket.io |
| **Root** | `backend/` |
| **Entry** | `backend/src/index.ts` |
| **Tech** | Express 4, Prisma 6, Socket.io 4, Keycloak, Zod |
| **Test** | Vitest + Supertest |
| **Port** | 3000 |

### Frontend (`frontend/`)

| Property | Value |
|---|---|
| **Type** | React 19 SPA + Capacitor Mobile |
| **Root** | `frontend/` |
| **Entry** | `frontend/src/main.tsx` |
| **Tech** | React 19, Vite 7, React Router 7, Capacitor 8, keycloak-js |
| **Test** | Vitest + Testing Library |
| **Port** | 5173 (dev) |

---

## Generated Documentation

| Document | Description |
|---|---|
| [Project Overview](./project-overview.md) | Executive summary, tech stack tables, feature list |
| [Architecture — Backend](./architecture-backend.md) | Express architecture, route modules, auth flow, Socket.io |
| [Architecture — Frontend](./architecture-frontend.md) | React structure, routing, Capacitor, state management |
| [Data Models](./data-models.md) | All 20 Prisma models with fields and relationships |
| [API Contracts](./api-contracts.md) | All 15 REST route modules + WebSocket events |
| [Source Tree](./source-tree-analysis.md) | Annotated directory tree for both parts |
| [Development Guide](./development-guide.md) | Setup, local dev, testing, common tasks |
| [Deployment Guide](./deployment-guide.md) | Docker Compose, production config, mobile deploy |
| [Integration Architecture](./integration-architecture.md) | REST + WebSocket + Keycloak integration flows |

---

## Existing Documentation

| Document | Description |
|---|---|
| [README.md](../README.md) | Quick start guide, project structure overview, API key endpoints |

---

## Getting Started

### For new developers

1. **Understand the project:** Read [Project Overview](./project-overview.md)
2. **Set up locally:** Follow [Development Guide](./development-guide.md)
3. **Understand the data:** Read [Data Models](./data-models.md)
4. **Explore APIs:** Browse [API Contracts](./api-contracts.md)

### For AI agents working on this codebase

- **File locations:** See [Source Tree](./source-tree-analysis.md)
- **Adding endpoints:** Backend routes in `backend/src/routes/`, controllers in `backend/src/controllers/`
- **Frontend API calls:** All API calls go through `frontend/src/services/`
- **Database changes:** Edit `backend/prisma/schema.prisma`, then run `npm run prisma:migrate`
- **Auth context:** `frontend/src/context/AuthContext.tsx` — Keycloak integration
- **Real-time:** `backend/src/socket.ts` + Socket.io-client in frontend

---

## Platform Feature Map

| Feature | Backend Route | Frontend Pages |
|---|---|---|
| Auth | `/api/auth` | `pages/auth/` |
| User Profiles | `/api/users` | `pages/profile/` |
| Community Groups | `/api/groups` | `pages/groups/` |
| Posts & Feed | `/api/posts`, `/api/feed` | `pages/feed/` |
| My Luma Content | `/api/content` | `pages/content/` |
| Content Submissions | `/api/submissions` | Embedded in content pages |
| Direct Messaging | `/api/messages` + Socket.io | `pages/messaging/` |
| Notifications | `/api/notifications` + Socket.io | Notification center |
| Connections | `/api/connections` | Profile pages |
| Polls | `/api/polls` | Embedded in posts/content |
| Marketplace | `/api/marketplace` | `pages/marketplace/` |
| Business Directory | `/api/directory` | `pages/directory/` |
| Subscriptions | `/api/subscriptions` | Settings / premium pages |
| Admin | `/api/admin` | `pages/admin/` |
