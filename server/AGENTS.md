# AGENTS.md — Server

Node.js + Express + Mongoose + JWT + Socket.io. **TypeScript, ESM** (`"type": "module"`),
Node ≥ 20. See the root `AGENTS.md` for global conventions.

> Toolchain: source runs directly with `tsx` (no build step needed for dev). `tsc`
> is type-check only (`noEmit`). Tests run on Jest via `ts-jest` (ESM). ESLint uses
> a flat TypeScript config (`eslint.config.ts`).

## Structure

```
src/
├── config/       # env, database connection
├── models/       # Mongoose schemas: User, Group, Invitation, Message
├── routes/       # Express routers (thin — delegate to controllers)
├── controllers/  # request handlers (one responsibility each)
├── middleware/   # auth, error-logger, validators, rate-limiter, upload (multer)
├── services/     # business logic, reusable across controllers (e.g. r2-service)
├── sockets/      # Socket.io setup + room/event handlers
└── utils/        # pure helpers
```

Attachments (images, audio, pdf) are uploaded to **Cloudflare R2** (S3-compatible) via
`@aws-sdk/client-s3`. Multer uses `memoryStorage` (buffer → R2); MongoDB stores only
`{ type, url, originalName }`. No local `uploads/` folder.

## Naming

- Files & folders: `kebab-case` (`auth-middleware.ts`, `group-controller.ts`).
- Mongoose models: singular `PascalCase` class, file `user-model.ts` (collection auto-pluralised).
- Functions/vars: `camelCase`; constants: `UPPER_SNAKE_CASE`; types/interfaces: `PascalCase`.
- One primary export per file; group route files by resource.

## Conventions

- **Layering:** `routes → controllers → services → models`. Keep routes/controllers thin.
- **Async:** `async/await` only; wrap handlers so errors reach the error middleware (no unhandled rejections).
- **Errors:** throw typed errors; a central error handler formats the JSON response. Never leak stack traces in production.
- **Validation:** validate every request body/params (e.g. `express-validator`) before hitting the DB.
- **Auth:** JWT in `Authorization: Bearer <token>`; `authMiddleware` verifies, `isGroupAdmin` authorises.
- **Middleware creators:** prefer factory functions: `const createRateLimiter = (max, windowMs) => (req, res, next) => {…}`.
- **Mongoose (required per model):** at least one `pre` hook (hash password), one `static` (e.g. `findByEmail`), and `toJSON` to hide `passwordHash`.
- **Config:** read all secrets/URLs from `process.env`; never hardcode. Keep `.env.example` current.
- **Responses:** consistent JSON shape; correct HTTP status codes (`201` create, `400` validation, `401/403` auth, `404`, `500`).

## API surface

REST under `/api` (`auth`, `groups`, `invitations`, `messages`). Real-time via Socket.io
events: `joinGroup`, `leaveGroup`, `newMessage`, `messageUpdated`, `messageDeleted`.
See `docs/work-plan.md` for the full endpoint list.

## Documentation

- English only. Add a short TSDoc block on non-trivial services/middleware explaining intent.
- Skip comments that restate the code.

## Commands

```bash
npm run connect    # one-off MongoDB connection check (tsx)
npm run seed:temp  # insert a sample document (tsx)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .   (npm run lint:fix to autofix)
npm test           # jest (ts-jest, ESM)
```
