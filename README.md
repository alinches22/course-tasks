# TradeVersus

**Skill-based PvP trading battles platform.**

Two users trade the same historical price scenario, streamed in real-time. Winner is determined purely by decision quality.

- No live market
- No order book
- No liquidity
- No MEV
- No bot advantage

TradeVersus lives between **trading**, **gaming**, and **Web3**.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
pnpm docker:up

# Setup database
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed

# Start development
pnpm dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:4000/graphql

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | NestJS, GraphQL, Prisma |
| Database | PostgreSQL, Redis |
| Auth | Wallet Sign-In (wagmi + WalletConnect) |
| Real-time | GraphQL Subscriptions (graphql-ws) |

---

## Project Structure

```
/
├── apps/
│   ├── api/          # NestJS GraphQL API
│   └── web/          # Next.js Frontend
├── packages/
│   └── shared/       # Shared types & utilities
└── docs/             # Documentation
```

---

## Documentation

- [Runbook](./docs/RUNBOOK.md) - Setup, commands, troubleshooting
- [Architecture](./docs/ARCHITECTURE.md) - System design

---

## Features

- **Provably Fair** - Commit-reveal scheme ensures scenario selection cannot be manipulated
- **Real-time Battles** - Live price streaming via WebSocket
- **Server-side Truth** - All actions timestamped and validated server-side
- **Points System** - Earn points for participation and wins
- **Replay System** - Review any battle with full action history

---

## License

UNLICENSED - Private and Proprietary
