# Server

Node.js + Express + Mongoose + JWT + Multer + Cloudflare R2 + Socket.io. Written in
**TypeScript (ESM)**; source runs directly with `tsx` (no build step). See
[AGENTS.md](AGENTS.md) for conventions.

## Setup

```bash
cp .env.example .env
# Edit .env — set MONGO_URI to your MongoDB Atlas connection string
npm install
npm run connect
```

`npm run connect` tests the Atlas connection and exits.

## Structure

```
src/
├── config/        # DB connection, env config
├── models/        # User, Group, Invitation, Message
├── routes/
├── controllers/
├── middleware/    # auth, errorLogger, rateLimiter (custom)
├── services/      # business logic (e.g. r2-service — uploads to Cloudflare R2)
├── sockets/       # Socket.io setup + events
└── utils/
```

Attachments (images, audio, pdf) are streamed to **Cloudflare R2** (S3-compatible);
MongoDB stores only the metadata (`type`, `url`, `originalName`). No local upload folder.

## API Endpoints

See [../docs/work-plan.md](../docs/work-plan.md).
