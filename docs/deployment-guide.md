# Deployment Guide — Luma

> **Generated:** 2026-03-02

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│           Docker Compose            │
│                                     │
│  ┌──────────────┐                   │
│  │  Frontend    │ :5173 → :80       │
│  │  (Nginx)     │                   │
│  └──────┬───────┘                   │
│         │ HTTP/WebSocket            │
│  ┌──────▼───────┐                   │
│  │  Backend     │ :3000             │
│  │  (Node.js)   │                   │
│  └──────┬───────┘                   │
│         │                           │
│  ┌──────▼───────┐                   │
│  │  PostgreSQL  │ :5432             │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

---

## Docker Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Production orchestration (all services) |
| `docker-compose.dev.yml` | Development overrides |
| `backend/Dockerfile` | Backend container image |
| `frontend/Dockerfile` | Frontend container image (Nginx) |
| `frontend/nginx.conf` | Nginx config for SPA routing |

---

## Production Deployment with Docker Compose

### Initial Deployment

```bash
# Clone repository
git clone <repo-url>
cd luma

# Create production environment file
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Build and start all services
docker-compose up --build -d

# Run database migrations (first deployment only)
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (if needed)
docker-compose exec backend npm run seed
```

### Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Health check
curl http://localhost:3000/health
```

---

## Services Configuration

### docker-compose.yml Structure

The Docker Compose file orchestrates three services:

| Service | Image | Port | Description |
|---|---|---|---|
| `postgres` | postgres:15-alpine | 5432 | Database |
| `backend` | Custom (Node.js) | 3000 | API server |
| `frontend` | Custom (Nginx) | 5173 | Static web app |

Services use a shared Docker network and `backend` depends on `postgres`.

---

## Environment Configuration

### Backend Production Variables

```bash
# database
DATABASE_URL="postgresql://USER:PASS@postgres:5432/luma_db"

# auth
JWT_SECRET="<strong-random-secret-min-32-chars>"
JWT_EXPIRES_IN="7d"

# server
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://your-domain.com"

# Keycloak
KEYCLOAK_URL="https://auth.your-domain.com"
KEYCLOAK_REALM="luma"
KEYCLOAK_CLIENT_ID="luma-backend"
```

> ⚠️ Never commit `.env` files to version control. Use Docker secrets or your platform's secrets manager in production.

---

## Updates & Redeployment

```bash
# Pull latest code
git pull

# Rebuild and restart containers
docker-compose up --build -d

# Apply any new migrations
docker-compose exec backend npx prisma migrate deploy

# Check logs
docker-compose logs -f backend
```

### Zero-downtime consideration

The current setup uses a simple `docker-compose up` restart. For true zero-downtime:
- Use a reverse proxy (Traefik, Nginx) in front of the app
- Deploy to a container orchestrator (Kubernetes, ECS) with rolling updates

---

## Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U luma -d luma_db

# Backup database
docker-compose exec postgres pg_dump -U luma luma_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U luma luma_db < backup.sql

# View migration status
docker-compose exec backend npx prisma migrate status

# Apply pending migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## Container Details

### Backend (`backend/Dockerfile`)

- Base: Node.js Alpine
- Build: `npm run build` (TypeScript → `dist/`)
- Run: `node dist/index.js`
- Serves: REST API + WebSocket on port 3000
- Mounts: `uploads/` directory for file persistence

### Frontend (`backend/Dockerfile`)

- Build stage: Node.js Alpine + `npm run build` → Vite dist
- Serve stage: Nginx Alpine serving `dist/`
- Config: `nginx.conf` handles SPA routing (all routes → `index.html`)
- Port: 80 (exposed as 5173 in compose)

---

## Mobile Deployment

### Android (Google Play Store)

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
# In Android Studio: Build → Generate Signed Bundle/APK
```

### iOS (Apple App Store)

```bash
cd frontend
npm run build
npx cap sync ios
npx cap open ios
# In Xcode: Product → Archive
```

---

## Monitoring & Logs

```bash
# All service logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Check health
curl http://localhost:3000/health

# Container resource usage
docker stats
```

---

## Stopping & Cleanup

```bash
# Stop all services (keep data)
docker-compose down

# Stop and remove all data (volumes)
docker-compose down -v

# Remove unused images
docker image prune
```

---

## Production Checklist

Before going live:

- [ ] Strong `JWT_SECRET` (minimum 32 random characters)
- [ ] `NODE_ENV=production` set in backend `.env`
- [ ] `CORS_ORIGIN` set to production frontend URL
- [ ] Database backed up before deployments
- [ ] Keycloak realm configured for production domain
- [ ] SSL/TLS termination at reverse proxy level
- [ ] `uploads/` directory has persistent volume for file storage
- [ ] Health check endpoint monitored (`GET /health`)
- [ ] Rate limiting tuned for production traffic
