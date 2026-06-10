# Bank Manager API

A REST api banking backend built with NestJS, Prisma ORM, and PostgreSQL. Supports account management, deposits, withdrawals, and transaction history.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (recommanded to run in WSL for easier setup on windows pc).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5433`, make sure to run it in the same folder as the docker-compose.yml file.

### 3. Run Prisma migrations

```bash
npm run db:migrate
```

This applies all migrations and generates the Prisma client. Re-run after any schema change.

To open Prisma Studio (DB browser):

```bash
npm run db:studio
```

---

## Running the App

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build && npm run start:prod
```

The API is available at `http://localhost:3000`.  
Swagger docs: `http://localhost:3000/api`

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

Tests are unit/integration tests using Jest with mocked dependencies — no running database required.


## Business Rules

- Withdrawals require the account to be **active**.
- Withdrawals require sufficient **balance**.
- Withdrawals are capped by the **daily withdrawal limit** which updates after every Withdrawal.
- Deposits and withdrawals are **atomic** — balance update and transaction record are committed together or not at all.
