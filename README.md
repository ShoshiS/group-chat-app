# Chat App — Node.js + Angular + MongoDB

Fullstack chat application — groups, users, invitations and messages (full CRUD).

**Team:** Tamar Zisman + Shoshi Sefrai

## Structure (Monorepo)

- `server/` — Node.js + Express + Mongoose + JWT + Socket.io
- `client/` — Angular 19 (standalone, Signals, Material)
- `docs/` — pre-submission analysis documents

## Getting Started

### Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Client

```bash
cd client
npm install
ng serve
```

See [docs/work-plan.md](docs/work-plan.md) for the full work plan.
