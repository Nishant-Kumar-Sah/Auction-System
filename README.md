# Auction System — Concurrency Study

A Node.js auction service built to explore and benchmark different concurrency control strategies for bid placement.

---

## Project Structure

```
auction-system/
├── auction-service/          # Main Express API
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── src/
│       ├── server.js         # Express app entry point
│       ├── clients/
│       │   └── postgres.js   # pg Pool connection
│       ├── config/
│       │   └── server.config.js
│       ├── controllers/
│       │   ├── index.js
│       │   ├── auctionController.js
│       │   ├── bidController.js
│       │   └── userController.js
│       ├── models/
│       │   ├── index.js
│       │   ├── auction.js    # Auction + Bid classes
│       │   └── user.js       # User class
│       ├── repository/
│       │   ├── index.js
│       │   ├── auctionRepository.js
│       │   ├── userRepository.js
│       │   └── testRepository.js
│       ├── routes/
│       │   ├── index.js
│       │   ├── auctionRoutes.js
│       │   ├── bidRoutes.js
│       │   ├── userRoutes.js
│       │   └── testRoutes.js
│       └── services/
│           ├── index.js
│           ├── auctionService.js
│           ├── bidService.js
│           └── userService.js
└── k6-auction-simulator/     # Load testing scripts
    ├── package.json
    ├── config.js
    ├── verify.js             # Post-test DB consistency checker
    ├── helpers/
    │   ├── setup.js          # Seed users and auctions before test
    │   └── utils.js          # Shared helpers (randomAmount, postJSON, etc.)
    └── scripts/
        ├── 01-sanity.js      # Smoke test: 1 user, 1 bid
        ├── 02-load.js        # Load test: 50 VUs, 30s, random auctions
        └── 03-concurrency.js # Stress test: 100 VUs hammering same auction
```

---

## Database Schema

```sql
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE auctions (
  id                   SERIAL PRIMARY KEY,
  title                TEXT NOT NULL,
  current_highest_bid  NUMERIC NOT NULL,
  version              INT NOT NULL DEFAULT 0
);

CREATE TABLE bids (
  id         SERIAL PRIMARY KEY,
  auction_id INT REFERENCES auctions(id),
  user_id    INT REFERENCES users(id),
  amount     NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

The `version` column on `auctions` is used for optimistic locking (Phase 3).

---

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user |

### Auctions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auctions` | Create a new auction |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bids/v1` | Place bid — no concurrency control |
| POST | `/api/bids/v2` | Place bid — pessimistic locking (FOR UPDATE) |

### Test Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/test/reset` | Truncate all tables (for testing only) |
| GET | `/health` | Health check + DB connectivity |

---

## Concurrency Approaches

### Problem Statement

In a live auction, multiple users can place bids simultaneously. Without proper concurrency control, a race condition can occur:

```
Current highest bid = $10
User A reads $10, decides to bid $100
User B reads $10, decides to bid $20

User A updates → highest bid = $100
User B updates → highest bid = $20  ❌ Wrong! $100 was overwritten
```

---

### V1 — No Concurrency Control (Naive)

**Endpoint:** `POST /api/bids/v1`

**Flow:**
1. Fetch `current_highest_bid` from `auctions` table
2. If `bid_amount > current_highest_bid`, update auctions and insert into bids
3. No locking — pure read-then-write

**Problem:** Race condition between step 1 and step 2. Two users can read the same value simultaneously and both pass the check, leading to an incorrect final state.

**Verified result:** 2 inconsistent auctions detected in load test (highest bid in `auctions` table did not match `MAX(amount)` in `bids` table).

---

### V2 — Pessimistic Locking (Current Implementation)

**Endpoint:** `POST /api/bids/v2`

**Flow:**
1. Open a PostgreSQL transaction (`BEGIN`)
2. `SELECT current_highest_bid FROM auctions WHERE id = $1 FOR UPDATE`
   - `FOR UPDATE` locks the row — no other transaction can read or write until this one commits
3. Check if `bid_amount > current_highest_bid`
4. If yes: `UPDATE auctions` + `INSERT INTO bids`
5. `COMMIT` (or `ROLLBACK` on error)

**How it solves the race condition:**
```
User A acquires lock on auction row
User B tries to read the same row → BLOCKED (waiting for lock)
User A commits → highest bid = $100
User B gets lock → reads $100 → $20 < $100 → bid rejected ✅
```

**Tradeoff:** Serializes all bids on the same auction. Under high concurrency, users queue up waiting for the lock, increasing latency.

**Verified result:** 0 inconsistent auctions in load test and concurrency stress test.

---

### V3 — Redis Cache (Planned — Phase 2)

**Endpoint:** `POST /api/bids/v3` *(coming soon)*

**Planned Flow:**
1. Check Redis for `auction:{id}:highest_bid`
2. If `bid_amount > cached_value` → update Redis immediately
3. Write to DB asynchronously

**Challenges:**
- Redis and PostgreSQL are not in the same transaction — they can go out of sync
- If Redis crashes, all cached state is lost
- Requires an outbox pattern or similar mechanism to guarantee DB sync

---

## Running the Service

### Prerequisites
- Node.js v18+
- PostgreSQL (via Docker)
- Redis (for Phase 2)

### Setup

```bash
# Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=auction_db \
  -p 5432:5432 \
  postgres:13

# Install dependencies
cd auction-service
npm install

# Create .env at auction-service root
echo 'PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auction_db
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auction_db"' > .env

# Run migrations (create tables manually or via psql)
# Start server
npm run dev
```

---

## Running Load Tests

### Prerequisites
- [k6](https://k6.io/docs/getting-started/installation/) installed locally

```bash
cd k6-auction-simulator
npm install  # installs pg for verify.js
```

### Available Scripts

```bash
# Smoke test (1 user, 1 bid)
npm run sanity:v1
npm run sanity:v2

# Load test (50 VUs, 30s, random auctions)
npm run load:v1
npm run load:v2

# Concurrency stress test (100 VUs, same auction)
npm run concurrency:v1
npm run concurrency:v2

# Verify DB consistency after any test
npm run verify
```

### How Tests Work

**setup phase** — before each test:
- Calls `POST /api/test/reset` to wipe all tables
- Creates 100 users and 50 auctions
- Returns IDs to use in the test

**03-concurrency.js has two scenarios:**
- `same_auction` — 100 VUs all bid on auction #1 simultaneously (worst case)
- `random_auction` — 100 VUs bid on random auctions (starts 30s after)

**verify.js** — run after any test to check consistency:
- Queries `auctions.current_highest_bid` vs `MAX(bids.amount)` for each auction
- Reports any auctions where these values don't match (indicates a concurrency bug)

---

## Test Results Summary

| Test | Version | Inconsistent Auctions | Notes |
|------|---------|----------------------|-------|
| Load (50 VUs, 30s) | v1 | 2 ❌ | Race condition detected |
| Load (50 VUs, 30s) | v2 | 0 ✅ | Locks prevent inconsistency |
| Concurrency (100 VUs) | v1 | 0 ✅ | Node.js event loop serialized at this scale |
| Concurrency (100 VUs) | v2 | 0 ✅ | Consistent with higher latency |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Express server port (default: 3001) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |
| `DATABASE_URL` | Full connection string (used by Prisma if needed) |

## Coming Up
Kafka integration, Redis caching, optimistic locking, migration to fastify from express
