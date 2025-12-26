# TradeVersus Runbook

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit .env files with your values
# Required: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID from https://cloud.walletconnect.com
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Verify containers are running
docker ps
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate:dev

# Seed initial data
pnpm db:seed
```

### 5. Start Development

```bash
# Start both API and Web in parallel
pnpm dev

# Or start individually
pnpm dev:api  # API at http://localhost:4000
pnpm dev:web  # Web at http://localhost:3000
```

## Common Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:api` | Start API only |
| `pnpm dev:web` | Start Web only |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | Type check all apps |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate:dev` | Create and apply migrations |
| `pnpm db:migrate` | Apply migrations (production) |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset database (⚠️ destructive) |

### Docker

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start PostgreSQL + Redis |
| `pnpm docker:down` | Stop containers |
| `pnpm docker:logs` | View container logs |

## Endpoints

### API

- GraphQL Playground: http://localhost:4000/graphql
- WebSocket: ws://localhost:4000/graphql

### Web

- Application: http://localhost:3000

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :4000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Ensure Docker containers are running
docker ps

# Check PostgreSQL logs
docker logs tradeversus-postgres

# Restart containers
pnpm docker:down && pnpm docker:up
```

### Prisma Issues

```bash
# Regenerate client
pnpm db:generate

# Reset database
pnpm db:reset
```

### Redis Connection Issues

```bash
# Check Redis logs
docker logs tradeversus-redis

# Test connection
docker exec tradeversus-redis redis-cli ping
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 4000 | API server port |
| `JWT_EXPIRES_IN` | 7d | JWT expiry time |
| `THROTTLE_TTL` | 60 | Rate limit window (seconds) |
| `THROTTLE_LIMIT` | 100 | Requests per window |

## Production Deployment

### Build

```bash
pnpm build
```

### Environment

Ensure production environment variables are set:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database URL
- `REDIS_URL` - Production Redis URL
- `JWT_SECRET` - Strong, unique secret
- `NEXT_PUBLIC_*` - Public environment variables

### Start

```bash
# API
cd apps/api && pnpm start:prod

# Web
cd apps/web && pnpm start
```

## Health Checks

### API

```bash
curl http://localhost:4000/graphql?query=%7B__typename%7D
```

### Database

```bash
docker exec tradeversus-postgres pg_isready -U tradeversus
```

### Redis

```bash
docker exec tradeversus-redis redis-cli ping
```
