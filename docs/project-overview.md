# Luma — Project Overview

> **Generated:** 2026-03-02 | **Scan Level:** Deep | **Type:** Multi-Part (Backend + Frontend)

---

## Executive Summary

**Luma** is a full-stack community platform designed for mothers, providing a suite of social features including community groups, content publishing, real-time messaging, a marketplace, and a local directory. It is built as a **separated frontend/backend architecture**, with a REST + WebSocket API and a React-based web/mobile application.

---

## Repository Structure

| Property | Value |
|---|---|
| **Repository Type** | Multi-Part (Separate directories, shared Docker Compose) |
| **Parts** | `backend/` (API), `frontend/` (Web + Mobile) |
| **Primary Languages** | TypeScript (both parts) |
| **Database** | PostgreSQL 15 via Prisma ORM |
| **Auth Provider** | Keycloak (with JIT user provisioning) |
| **Containerization** | Docker + Docker Compose |

---

## Technology Summary

### Backend (`backend/`)

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Language | TypeScript | ^5.7.3 |
| Framework | Express | ^4.21.2 |
| ORM | Prisma | ^6.1.0 |
| Database | PostgreSQL | 15 |
| Auth (SSO) | Keycloak + jwks-rsa | ^26.x |
| Auth (JWT) | jsonwebtoken | ^9.0.3 |
| Real-time | Socket.io | ^4.8.3 |
| Validation | Zod | ^3.24.1 |
| File Upload | Multer | ^2.0.2 |
| Security | Helmet, express-rate-limit | ^8.x |
| Password | bcrypt | ^5.1.1 |
| Testing | Vitest + Supertest | ^4.0.18 |
| Build | tsc (tsx for dev) | — |
| Subscription | Stripe (via Subscription model) | — |

### Frontend (`frontend/`)

| Category | Technology | Version |
|---|---|---|
| Language | TypeScript | ~5.9.3 |
| UI Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.3.1 |
| Routing | React Router DOM | ^7.13.0 |
| Mobile | Capacitor (iOS + Android) | ^8.1.0 |
| Auth (SSO) | keycloak-js | ^26.2.3 |
| Real-time | Socket.io-client | ^4.8.3 |
| HTTP Client | Axios | ^1.13.5 |
| Icons | Lucide React | ^0.575.0 |
| Date Utils | date-fns | ^4.1.0 |
| Testing | Vitest + Testing Library | ^4.0.18 |

---

## Architecture Classification

- **Pattern:** Layered Architecture (Controller → Service → Repository via Prisma)
- **Communication:** REST API (HTTP) + WebSocket (Socket.io) for real-time features
- **Authentication:** Keycloak SSO with JIT provisioning + local JWT fallback
- **Deployment:** Docker Compose orchestrating `frontend`, `backend`, `postgres` services
- **Mobile:** Capacitor wrapping the Vite React app for iOS/Android

---

## Platform Features

| Feature | Backend Module | Frontend Pages |
|---|---|---|
| Authentication | `auth.routes.ts` | SignIn, SignUp, Onboarding |
| User Profiles | `user.routes.ts` | Profile, Settings |
| Community Groups | `groups.routes.ts` | Groups, GroupDetail |
| Posts & Comments | `posts.routes.ts` | Post creation, Post detail |
| Content / My Luma | `content.routes.ts` | Articles, Videos, Events |
| Content Submissions | `submissions.routes.ts` | Submit content form |
| Activity Feed | `feed.routes.ts` | Home feed |
| Real-time Messages | `messages.routes.ts` + Socket.io | Messaging, Conversations |
| Notifications | `notification.routes.ts` | Notification center |
| Connections | `connection.routes.ts` | Connect with users |
| Polls | `polls.routes.ts` | Embedded in posts/content |
| Marketplace | `marketplace.routes.ts` | Buy/sell items |
| Directory | `directory.routes.ts` | Local service listings |
| Subscriptions | `subscription.routes.ts` | Premium tier management |
| Admin | `admin.routes.ts` | Admin dashboard |

---

## Quick Navigation

- [Architecture — Backend](./architecture-backend.md)
- [Architecture — Frontend](./architecture-frontend.md)
- [Data Models (Prisma Schema)](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Source Tree](./source-tree-analysis.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Integration Architecture](./integration-architecture.md)
- [Index](./index.md)
