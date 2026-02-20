# Luma - Full Stack Application

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 5173, and 5432 available

### Running the Application

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database: localhost:5432

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

4. **Reset database (remove all data):**
   ```bash
   docker-compose down -v
   ```

## Local Development (Without Docker)

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run PostgreSQL (with Docker):**
   ```bash
   docker run --name luma-postgres \
     -e POSTGRES_USER=luma \
     -e POSTGRES_PASSWORD=luma_password \
     -e POSTGRES_DB=luma_db \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Project Structure

```
luma/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── utils/        # Helpers (JWT, password, etc.)
│   │   └── index.ts      # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.tsx
│   └── package.json
└── docker-compose.yml
```

## API Documentation

See `openapi.yaml` for complete API specification.

### Key Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `GET /api/users/me` - Get current user profile
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `GET /api/feed` - Get activity feed

## Database Management

### View database in Prisma Studio:
```bash
cd backend
npx prisma studio
```

### Create a new migration:
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Reset database:
```bash
cd backend
npx prisma migrate reset
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://luma:luma_password@localhost:5432/luma_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database credentials

### Frontend can't connect to backend
- Check CORS_ORIGIN in backend .env
- Ensure backend is running on port 3000
- Check browser console for errors
