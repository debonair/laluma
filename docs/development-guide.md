# Development Guide — Luma

> **Generated:** 2026-03-02

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Backend + frontend runtime |
| npm | 10+ | Package manager |
| Docker + Docker Compose | Latest | PostgreSQL + full-stack dev |
| Git | Any | Version control |

Optional:
- **Prisma Studio:** Included via `npm run prisma:studio`
- **Capacitor CLI:** For mobile development (`npm install -g @capacitor/cli`)
- **Android Studio / Xcode:** For mobile builds

---

## Quick Start (Docker — Recommended)

```bash
# Clone and start everything
git clone <repo-url>
cd luma

# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Stop services
docker-compose down

# Reset database (removes all data)
docker-compose down -v
```

**Service URLs (Docker):**
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

---

## Local Development (Without Docker)

### Step 1: Start Database

```bash
docker run --name luma-postgres \
  -e POSTGRES_USER=luma \
  -e POSTGRES_PASSWORD=luma_password \
  -e POSTGRES_DB=luma_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 2: Backend Setup

```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
npm run prisma:migrate

# Seed development data
npm run seed

# Start backend (hot reload)
npm run dev
# → Backend running on http://localhost:3000
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install

# Start frontend dev server
npm run dev
# → Frontend running on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```bash
DATABASE_URL="postgresql://luma:luma_password@localhost:5432/luma_db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Keycloak (if using SSO)
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="luma"
KEYCLOAK_CLIENT_ID="luma-backend"
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL="http://localhost:3000"
```

---

## Database Operations

```bash
cd backend

# Run pending migrations
npm run prisma:migrate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (visual DB browser)
npm run prisma:studio
# → Opens at http://localhost:5555

# Reset database (dev only — destroys data!)
npx prisma migrate reset

# Seed development data
npm run seed
```

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test                    # Run all tests once
npm run test:coverage       # Run tests with coverage report
```

**Test files location:** `backend/src/controllers/*.test.ts`

**Test framework:** Vitest + Supertest

Coverage report: `backend/coverage/`

---

### Frontend Tests

```bash
cd frontend
# (Vitest is configured but no explicit test script in package.json)
npx vitest run              # Run all tests once
npx vitest --coverage      # With coverage
```

**Test files location:** `frontend/src/**/*.test.ts(x)`, `frontend/src/test/`

Coverage report: `frontend/coverage/`

---

## Mobile Development (Capacitor)

```bash
cd frontend

# Build web app first
npm run build

# Sync to native platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (macOS only)
npx cap open ios

# Live reload for mobile dev
npx cap run android --livereload --external
```

---

## Code Conventions

### Backend
- **TypeScript** strict mode enabled
- **Controllers** handle HTTP logic + DB queries
- **Routes** are thin — mainly importing controllers and middleware
- **Validation:** Use Zod schemas for request validation
- **Error responses:** Always return `{ error, message, code }` shape
- **Auth middleware:** `authenticate` (required) or `optionalAuthenticate` (optional)

### Frontend
- **TypeScript** strict mode
- **Services** handle all API calls (never call Axios directly from components)
- **Context API** for shared state (no Redux)
- **CSS custom properties** for theming (defined in `index.css`)
- **Capacitor-safe:** Avoid browser-only APIs

---

## Common Tasks

### Add a new API endpoint

1. Create/update route in `backend/src/routes/XXX.routes.ts`
2. Create controller logic in `backend/src/controllers/XXX.controller.ts`
3. Register route in `backend/src/index.ts` if new module
4. Add service call in `frontend/src/services/XXXService.ts`
5. Add TypeScript types in `frontend/src/types/index.ts`

### Add a new database model

1. Add model to `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` with a descriptive name
3. Prisma client auto-regenerates — TypeScript types update immediately
4. Update seed file if needed

### Add a new frontend page

1. Create page component in `frontend/src/pages/XXX/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in relevant component

---

## Troubleshooting

**Port already in use:**
```bash
lsof -i :3000    # Find process on port 3000
kill -9 <PID>
```

**Database connection fails:**
- Ensure PostgreSQL is running: `docker ps`
- Check `DATABASE_URL` in `backend/.env`

**Frontend can't reach backend:**
- Check `CORS_ORIGIN` in `backend/.env` matches frontend URL
- Ensure backend is running on port 3000
- Check browser Network tab for CORS errors

**Prisma client out of sync:**
```bash
cd backend
npm run prisma:generate
```
