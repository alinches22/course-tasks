# TradeVersus Architecture

## Overview

TradeVersus is a skill-based PvP trading battles platform where two users trade the same historical price scenario streamed in real-time. The winner is determined purely by decision quality.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  │   (Next.js)  │  │   (Next.js)  │  │   (Next.js)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         │    HTTP/GraphQL │   WebSocket     │                   │
│         └────────────────┬┴─────────────────┘                   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      API LAYER                                   │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────┐        │
│  │                    NestJS API                        │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │        │
│  │  │   GraphQL   │  │  WebSocket  │  │    Auth     │  │        │
│  │  │  Resolvers  │  │   Gateway   │  │   Guards    │  │        │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │        │
│  │         │                │                │         │        │
│  │  ┌──────▼────────────────▼────────────────▼──────┐  │        │
│  │  │              Battle Engine                     │  │        │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │        │
│  │  │  │  Tick   │  │  State  │  │   PnL   │       │  │        │
│  │  │  │Streamer │  │ Machine │  │ Engine  │       │  │        │
│  │  │  └─────────┘  └─────────┘  └─────────┘       │  │        │
│  │  └───────────────────────────────────────────────┘  │        │
│  └─────────────────────────────────────────────────────┘        │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                     DATA LAYER                                   │
│         ┌─────────────────┴─────────────────┐                   │
│         │                                   │                   │
│  ┌──────▼──────┐                    ┌───────▼──────┐            │
│  │  PostgreSQL │                    │    Redis     │            │
│  │   (Prisma)  │                    │  (PubSub)    │            │
│  │             │                    │              │            │
│  │ - Users     │                    │ - Sessions   │            │
│  │ - Battles   │                    │ - Battle     │            │
│  │ - Scenarios │                    │   State      │            │
│  │ - Actions   │                    │ - PubSub     │            │
│  │ - Points    │                    │   Events     │            │
│  └─────────────┘                    └──────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend (@tradeversus/web)

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Canvas 2D | Chart rendering |
| urql | GraphQL client |
| graphql-ws | WebSocket subscriptions |
| wagmi | Wallet connections |
| zustand | State management |

### Backend (@tradeversus/api)

| Technology | Purpose |
|------------|---------|
| NestJS | Node.js framework |
| GraphQL | API layer (code-first) |
| graphql-ws | WebSocket transport |
| Prisma | Database ORM |
| PostgreSQL | Primary database |
| Redis | PubSub & caching |
| JWT | Authentication |
| ethers | Signature verification |

## Domain Model

### Core Entities

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │    Battle    │       │   Scenario   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ address      │◄──────│ creatorId    │       │ asset        │
│ nonce        │       │ opponentId   │──────►│ timeframe    │
│ createdAt    │       │ scenarioId   │       │ ticks[]      │
│ updatedAt    │       │ status       │       │ metadata     │
└──────────────┘       │ commitHash   │       │ createdAt    │
       ▲               │ revealSalt   │       └──────────────┘
       │               │ winnerId     │
       │               │ timestamps   │
       │               └──────────────┘
       │                      │
       │                      ▼
       │               ┌──────────────┐
       │               │    Action    │
       │               ├──────────────┤
       └───────────────│ userId       │
                       │ battleId     │
                       │ type         │
                       │ price        │
                       │ tickIndex    │
                       │ timestamp    │
                       └──────────────┘
```

### Battle Status State Machine

```
     ┌─────────┐
     │ WAITING │ ◄── Created by user
     └────┬────┘
          │ Opponent joins
          ▼
     ┌─────────┐
     │ MATCHED │ ◄── Both players ready
     └────┬────┘
          │ Countdown complete
          ▼
     ┌─────────┐
     │ RUNNING │ ◄── Ticks streaming
     └────┬────┘
          │ All ticks sent / Time up
          ▼
     ┌──────────┐
     │ FINISHED │ ◄── Results calculated
     └──────────┘

     (CANCELED can occur from WAITING or MATCHED)
```

## Authentication Flow

```
┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │  API   │          │   DB   │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │  getNonce(addr)   │                   │
    │──────────────────►│                   │
    │                   │  upsert nonce     │
    │                   │──────────────────►│
    │                   │◄──────────────────│
    │◄──────────────────│                   │
    │                   │                   │
    │  Sign message     │                   │
    │  (wallet)         │                   │
    │                   │                   │
    │ verifySignature   │                   │
    │  (addr, sig)      │                   │
    │──────────────────►│                   │
    │                   │  Verify EIP-191   │
    │                   │  Issue JWT        │
    │◄──────────────────│                   │
    │                   │                   │
    │  Authenticated    │                   │
    │  requests w/ JWT  │                   │
    │──────────────────►│                   │
```

## Real-Time Battle Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Player 1 │     │  Server  │     │  Redis   │     │ Player 2 │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ createBattle   │                │                │
     │───────────────►│                │                │
     │◄───────────────│ battle.WAITING│                │
     │                │                │                │
     │                │                │   joinBattle   │
     │                │◄───────────────┼───────────────│
     │                │                │                │
     │   battleState  │  publish       │  battleState   │
     │◄───────────────│───────────────►│───────────────►│
     │   (MATCHED)    │                │   (MATCHED)    │
     │                │                │                │
     │                │  countdown...  │                │
     │                │                │                │
     │   battleState  │  publish       │  battleState   │
     │◄───────────────│───────────────►│───────────────►│
     │   (RUNNING)    │                │   (RUNNING)    │
     │                │                │                │
     │                │ ┌────────────┐ │                │
     │   battleTick   │ │ Stream     │ │   battleTick   │
     │◄───────────────│ │ ticks from │ │───────────────►│
     │                │ │ scenario   │ │                │
     │ submitAction   │ └────────────┘ │                │
     │───────────────►│                │                │
     │                │  publish       │  battleTick    │
     │   battleTick   │───────────────►│  (w/ action)   │
     │◄───────────────│                │───────────────►│
     │                │                │                │
     │                │  ... ticks ... │                │
     │                │                │                │
     │  battleResult  │  publish       │  battleResult  │
     │◄───────────────│───────────────►│───────────────►│
     │                │                │                │
```

## Provably Fair System

### Commit-Reveal Scheme

1. **At Battle Creation:**
   ```
   salt = generateRandomSalt(32)
   commitHash = sha256(scenarioId + ":" + salt)
   ```
   - Server stores `scenarioId`, `salt`, and `commitHash`
   - Only `commitHash` is exposed to clients

2. **During Battle:**
   - Ticks are streamed from the pre-selected scenario
   - Neither player knows which scenario is being used

3. **After Battle:**
   - Server reveals `scenarioId` and `salt`
   - Clients can verify: `sha256(scenarioId + ":" + salt) === commitHash`

### Verification

```typescript
async function verifyCommitHash(
  scenarioId: string,
  salt: string,
  commitHash: string
): Promise<boolean> {
  const computed = await sha256(`${scenarioId}:${salt}`);
  return computed === commitHash;
}
```

## PnL Calculation

```typescript
function calculatePnL(
  position: 'LONG' | 'SHORT' | 'FLAT',
  entryPrice: number,
  currentPrice: number
): number {
  if (position === 'FLAT') return 0;
  
  const change = ((currentPrice - entryPrice) / entryPrice) * 100;
  return position === 'LONG' ? change : -change;
}
```

## Points System

| Event | Points |
|-------|--------|
| Win | 100 |
| Loss | 25 |
| Draw | 50 |
| PnL Bonus | Up to 50 (based on profit %) |

### Weekly Pool Distribution

- 10% of earned points go to weekly pool
- 5% team fee
- Weekly distribution to top performers

## Security Measures

1. **Rate Limiting** - Throttle requests per IP/user
2. **Action Cooldowns** - Minimum time between actions
3. **Server Timestamps** - All actions timestamped server-side
4. **Ownership Validation** - Users can only act on their battles
5. **JWT Validation** - All requests authenticated
6. **WebSocket Auth** - Connection init validates JWT

## Directory Structure

```
/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/     # Authentication module
│   │   │   ├── battle/   # Battle engine
│   │   │   ├── user/     # User management
│   │   │   ├── scenario/ # Scenario data
│   │   │   ├── points/   # Points system
│   │   │   └── replay/   # Replay system
│   │   └── prisma/       # Database schema
│   │
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/      # App Router pages
│           ├── components/ # React components
│           └── lib/      # Utilities & hooks
│
├── packages/
│   └── shared/           # Shared types & utils
│
└── docs/                 # Documentation
```

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers behind load balancer
- Redis for session sharing and PubSub
- PostgreSQL read replicas for queries

### Future Improvements

- Message queue for battle events
- Separate WebSocket servers
- CDN for static assets
- Database sharding by user ID
