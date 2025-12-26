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
docker-compose up -d

# Verify containers are running
docker ps
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (creates tables)
pnpm db:migrate:dev

# Seed initial data (scenarios)
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

### 6. Verify

- Open GraphQL Playground: http://localhost:4000/graphql
- Test a query:

```graphql
query {
  getNonce(address: "0x1234567890123456789012345678901234567890") {
    nonce
    message
  }
}
```

## Full Setup Commands (Copy-Paste)

```bash
# One-liner setup
docker-compose up -d && pnpm install && pnpm db:generate && pnpm db:migrate:dev && pnpm db:seed && pnpm dev:api
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
| `docker-compose up -d` | Start PostgreSQL + Redis |
| `docker-compose down` | Stop containers |
| `docker-compose logs -f` | View container logs |

## Endpoints

### API

- GraphQL Playground: http://localhost:4000/graphql
- WebSocket: ws://localhost:4000/graphql

### Web

- Application: http://localhost:3000
- Landing Page: http://localhost:3000/
- Dashboard: http://localhost:3000/app
- Battle: http://localhost:3000/battle/[id]
- Replay: http://localhost:3000/replay/[id]

## Frontend Architecture

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated chart background, hero, how-it-works, FAQ |
| `/app` | Dashboard with battle list, stats, create battle form |
| `/battle/[id]` | Live battle view with chart, actions, timer |
| `/replay/[id]` | Battle replay with timeline scrubbing, verification |

### Key Components

- **Providers** (`src/app/providers.tsx`): WagmiProvider, QueryClient, UrqlProvider, ToastProvider
- **Layout** (`src/app/layout.tsx`): Header, Footer, Tailwind CSS, dark theme
- **GraphQL Client** (`src/lib/graphql/client.ts`): urql + graphql-ws with token management
- **Wallet Config** (`src/lib/wagmi/config.ts`): Multi-chain support (ETH, Polygon, Arbitrum, etc.)
- **Auth Store** (`src/stores/auth.store.ts`): Zustand store with persistence
- **Battle Store** (`src/stores/battle.store.ts`): Real-time battle state management

### UI Components

All UI components in `src/components/ui/`:
- Button (with loading, variants)
- Card (elevated, glass, outline)
- Modal (animated)
- Toast (success, error, warning, info)
- Badge (status indicators)
- Input (with icons, validation)
- Skeleton (loading states)

## GraphQL API Overview

### Public Operations (No Auth Required)

```graphql
# Get nonce for wallet signing
query GetNonce($address: String!) {
  getNonce(address: $address) {
    nonce
    message
  }
}

# Verify signature and get JWT
mutation VerifySignature($input: VerifySignatureInput!) {
  verifySignature(input: $input) {
    token
    user {
      id
      address
    }
  }
}
```

### Protected Operations (JWT Required)

```graphql
# Get current user
query Me {
  me {
    id
    address
    createdAt
  }
}

# List battles
query Battles($filter: BattlesFilterInput) {
  battles(filter: $filter) {
    battles {
      id
      status
      commitHash
      participants {
        user { address }
        side
      }
    }
    hasMore
    nextCursor
  }
}

# Create battle
mutation CreateBattle {
  createBattle(input: { startingBalance: 10000 }) {
    id
    status
    commitHash
  }
}

# Join battle
mutation JoinBattle($battleId: ID!) {
  joinBattle(input: { battleId: $battleId }) {
    id
    status
  }
}

# Submit action
mutation SubmitAction($input: SubmitActionInput!) {
  submitAction(input: $input)
}
```

### Subscriptions (WebSocket)

```graphql
# Subscribe to battle ticks
subscription BattleTick($battleId: ID!) {
  battleTick(battleId: $battleId) {
    battleId
    tick { ts open high low close volume }
    currentIndex
    totalTicks
    timeRemaining
  }
}

# Subscribe to battle state
subscription BattleState($battleId: ID!) {
  battleState(battleId: $battleId) {
    battleId
    status
    countdown
    message
  }
}

# Subscribe to battle result
subscription BattleResult($battleId: ID!) {
  battleResult(battleId: $battleId) {
    battleId
    winner { address }
    isDraw
    pnlA
    pnlB
    scenarioId
    revealSalt
  }
}
```

## WebSocket Connection

To connect with authentication:

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    authorization: 'Bearer YOUR_JWT_TOKEN',
  },
});
```

## Testing Battle MVP Flow

### Quick Test (Dev Auth)

The API supports dev auth via `x-dev-user` header for quick testing without wallet:

```bash
# Terminal 1: Start infrastructure and API
docker-compose up -d && pnpm dev:api

# Terminal 2: Create DB and seed (one-time)
pnpm db:migrate:dev && pnpm db:seed

# Terminal 3: Start web
pnpm dev:web
```

### Test via GraphQL Playground

Open http://localhost:4000/graphql

1. **List Scenarios**:

```graphql
query {
  scenarios {
    id
    symbol
    timeframe
    tickCount
    metadata {
      name
      difficulty
    }
  }
}
```

2. **Create Battle (User A)** - Add header `x-dev-user: user-a`:

```graphql
mutation {
  createBattle(input: { startingBalance: 10000 }) {
    id
    status
    commitHash
  }
}
```

3. **Join Battle (User B)** - Change header to `x-dev-user: user-b`:

```graphql
mutation {
  joinBattle(input: { battleId: "<BATTLE_ID>" }) {
    id
    status
    participants {
      side
      user { id }
    }
  }
}
```

4. **Subscribe to Ticks** (in separate tab):

```graphql
subscription {
  battleTick(battleId: "<BATTLE_ID>") {
    tick { close }
    currentIndex
    totalTicks
    players {
      oderId
      pnl
      position
      side
    }
  }
}
```

5. **Submit Actions** (as user-a or user-b):

```graphql
mutation {
  submitAction(input: { 
    battleId: "<BATTLE_ID>", 
    type: BUY, 
    quantity: 1 
  })
}
```

Action types: `BUY`, `SELL`, `CLOSE`

### Full Web UI Test

1. Open http://localhost:3000
2. Connect wallet (or use dev mode)
3. Go to Dashboard → select a scenario → Create Battle
4. Open second browser/incognito → Join the battle
5. Watch countdown → Battle starts automatically
6. Click BUY/SELL buttons → PnL updates live
7. Battle ends → Result modal shows winner

### Simulating Second Player

For single-browser testing, use GraphQL Playground to:
1. Create battle in web UI
2. Copy battle ID
3. In Playground, set header `x-dev-user: opponent-test`
4. Run `joinBattle` mutation

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
docker-compose down && docker-compose up -d
```

### Prisma Issues

```bash
# Regenerate client
pnpm db:generate

# Reset database (⚠️ deletes all data)
pnpm db:reset
```

### Redis Connection Issues

```bash
# Check Redis logs
docker logs tradeversus-redis

# Test connection
docker exec tradeversus-redis redis-cli ping
```

### GraphQL Schema Not Updating

```bash
# Restart the API server
# The schema.gql file is auto-generated on startup
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 4000 | API server port |
| `JWT_EXPIRES_IN` | 7d | JWT expiry time |
| `THROTTLE_TTL` | 60 | Rate limit window (seconds) |
| `THROTTLE_LIMIT` | 100 | Requests per window |
| `BATTLE_TICK_INTERVAL_MS` | 5000 | Time between ticks |
| `BATTLE_COUNTDOWN_SECONDS` | 10 | Countdown before battle |
| `ACTION_COOLDOWN_MS` | 1000 | Min time between actions |

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
- `JWT_SECRET` - Strong, unique secret (32+ characters)

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
