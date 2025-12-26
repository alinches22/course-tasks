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
# Subscribe to battle ticks (includes live PnL for both players)
subscription BattleTick($battleId: ID!) {
  battleTick(battleId: $battleId) {
    battleId
    tick { ts open high low close volume }
    currentIndex
    totalTicks
    timeRemaining
    players {
      oderId
      pnl
      position
      side
    }
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

## Authentication

### Wallet Auth (Production)

1. **Get Nonce** - Request a challenge nonce:
```graphql
query {
  getNonce(address: "0x123...") {
    nonce
    message  # Sign this message with your wallet
  }
}
```

2. **Verify Signature** - Submit signed message to get JWT:
```graphql
mutation {
  verifySignature(input: {
    address: "0x123...",
    signature: "0xabc..."
  }) {
    token  # JWT for authenticated requests
    user {
      id
      address
    }
  }
}
```

3. **Use JWT** - Include in requests:
- HTTP: `Authorization: Bearer <token>` header
- WebSocket: `{ authorization: "Bearer <token>" }` in connectionParams

### Dev Auth (Development Only)

For local testing without wallet:

**HTTP Requests:**
```
Header: x-dev-user: alice
```

**WebSocket:**
```javascript
connectionParams: { 'x-dev-user': 'alice' }
```

⚠️ Dev auth is **disabled in production** (`NODE_ENV=production`)

### User Model

- Users are auto-created on first `verifySignature`
- `walletAddress` is unique per user
- User ID is a UUID, not the wallet address

## Server Fairness & Security

### Locked Battle Parameters

When a battle is created, the following params are locked and immutable:
- `tickIntervalMs` - Time between ticks
- `startingBalance` - Starting balance for both players
- `totalTicks` - Total number of ticks in the battle
- `serverSeed` - Random seed for deterministic replay

### Server-Authoritative State

The server is the **only source of truth** for:
- Current tick index and time
- Price data (tick OHLCV)
- Player positions and PnL calculations
- Liquidation (if implemented)

Clients cannot:
- See future ticks
- Modify time or tick index
- Calculate their own PnL authoritatively

### Rate Limiting

- Max 3 actions per second per user
- Duplicate action detection (same tick + action type)
- Per-action cooldown (configurable via `ACTION_COOLDOWN_MS`)

### Reconnection

If a client disconnects and reconnects:

```graphql
query {
  battleReconnect(id: "<BATTLE_ID>") {
    status
    currentTickIndex
    totalTicks
    timeRemaining
    recentTicks {
      tick { close }
      currentIndex
    }
    players {
      oderId
      pnl
      position
      side
    }
  }
}
```

This returns only:
- Current state (no future data)
- Recent tick window (last 5 ticks)
- Current player PnL and positions

### Provably Fair Verification

After battle finishes:
- `scenarioId` and `revealSalt` are revealed
- Commit hash can be verified: `sha256(scenarioId:revealSalt) === commitHash`
- Full tick data available for replay

## Points & Stake System

### Balance System

- New users receive **1,000 points** signup bonus
- Points are used to enter battles (stake)
- Current balance shown on dashboard

### Battle Stakes

Each battle has:
- `stakeAmount` - Points per player (default: 100)
- `feeBps` - Platform fee in basis points (default: 500 = 5%)

### Winner-Takes-All Logic

- **Winner**: Gets `2 × stake - fee`
- **Loser**: Gets 0 points
- **Draw**: Each gets stake back (no fee)

### Weekly Pool

- Platform fees accumulate in weekly pool
- Query with `weeklyPool` GraphQL query
- View pool history with `weeklyPoolHistory`

### Ledger System

All point movements tracked in `points_ledger` table:
- `SIGNUP_BONUS` - Initial signup credits
- `STAKE_DEPOSIT` - Deducted when joining battle
- `WIN_STAKE` - Winner payout
- `LOSS_STAKE` - Loser record (0 points)
- `DRAW` - Draw payout

## Replay System

### View Replay

Navigate to `/replay/[battleId]` after battle finishes.

### Replay API

```graphql
query {
  replay(battleId: "<ID>") {
    asset
    timeframe
    ticks {
      ts
      open
      high
      low
      close
      volume
    }
    actions {
      userId
      type
      price
      tickIndex
      serverTs
    }
    participants {
      userId
      address
      side
      finalPnl
    }
    result {
      winnerId
      isDraw
      pnlA
      pnlB
    }
    verification {
      scenarioId
      revealSalt
      commitHash
      isValid
    }
  }
}
```

### Replay Features

- Timeline scrubber with play/pause
- Playback speed control (0.5x - 4x)
- Action markers on chart (BUY/SELL/CLOSE)
- Provably fair verification

## Troubleshooting

### Common Issues

#### "Insufficient balance" when creating/joining battle

**Cause**: User doesn't have enough points to stake.

**Fix**: 
1. Check user's balance with `myTotalPoints` query
2. New users need to claim signup bonus (automatic on first login)
3. For testing, reduce stake amount in battle creation

#### Battle stuck in WAITING

**Cause**: Second player hasn't joined yet.

**Fix**:
1. Copy battle ID and share with opponent
2. For testing, use `x-dev-user` header with different user ID
3. Check battle status with `battle(id: "<ID>")` query

#### Subscription not receiving updates

**Cause**: WebSocket connection or auth issue.

**Fix**:
1. Check WebSocket URL is correct (`ws://localhost:4000/graphql`)
2. Verify token/auth is passed in `connectionParams`
3. Check browser console for connection errors
4. Ensure battle ID is correct

#### "Rate limit exceeded"

**Cause**: Too many actions submitted too quickly.

**Fix**:
1. Wait 1 second between actions
2. Max 3 actions per second allowed
3. Can't submit same action type on same tick

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

# If migration errors
cd apps/api && npx prisma migrate reset --force
```

### Redis Connection Issues

```bash
# Check Redis logs
docker logs tradeversus-redis

# Test connection
docker exec tradeversus-redis redis-cli ping

# Flush Redis (clears all data)
docker exec tradeversus-redis redis-cli FLUSHALL
```

### GraphQL Schema Not Updating

```bash
# Restart the API server
# The schema.gql file is auto-generated on startup

# Or manually generate
cd apps/api && pnpm build
```

### WebSocket Connection Fails

**Check**: 
1. API is running on correct port
2. CORS settings allow your origin
3. `graphql-ws` protocol is used (not legacy subscriptions-transport-ws)

```javascript
// Correct client setup
import { createClient } from 'graphql-ws';
const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    authorization: 'Bearer <token>',  // or x-dev-user for dev
  },
});
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

### Option 1: Vercel + Railway (Recommended)

#### Web (Vercel)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select `apps/web` as root directory

2. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_API_HTTP=https://your-api.railway.app
   NEXT_PUBLIC_API_WS=wss://your-api.railway.app
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

3. **Deploy**: Vercel auto-deploys on push to main

#### API (Railway)

1. **Create Project**:
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub

2. **Add Services**:
   - PostgreSQL database
   - Redis cache
   - API service (uses Dockerfile)

3. **Configure Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your_strong_secret_min_32_chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGINS=https://your-app.vercel.app
   ```

4. **Set Custom Domain** (optional)

### Option 2: Render

1. **Deploy via Blueprint**:
   - Go to [render.com](https://render.com)
   - New Blueprint → Connect repository
   - Uses `render.yaml` in root

2. **After Deployment**:
   - Set `CORS_ORIGINS` environment variable
   - Note the API URL for web app config

### Option 3: Docker Compose (Self-hosted)

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection | `redis://host:6379` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your_strong_secret_here...` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://app.tradeversus.com` |
| `NEXT_PUBLIC_API_HTTP` | API URL (web) | `https://api.tradeversus.com` |
| `NEXT_PUBLIC_API_WS` | WebSocket URL (web) | `wss://api.tradeversus.com` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect ID | `abc123...` |

### Build

```bash
pnpm build
```

### Start (Manual)

```bash
# API
cd apps/api && pnpm start:prod

# Web
cd apps/web && pnpm start
```

### Post-Deployment Checklist

1. ✅ Verify API health: `curl https://api.your-domain.com/graphql?query=%7B__typename%7D`
2. ✅ Verify web app loads
3. ✅ Test wallet connection
4. ✅ Create test battle
5. ✅ Verify real-time subscriptions work
6. ✅ Complete a full battle flow
7. ✅ Check replay works

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
