# Chat App — Node.js + Angular + MongoDB

Fullstack chat application — groups, users, invitations and messages (full CRUD).

**Team:** Tamar Zisman + Shoshi Sefrai

## Structure (Monorepo)

- `server/` — Node.js + Express + Mongoose + JWT + Socket.io
- `client/` — Angular 20 (standalone, Signals, Material)
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

## Continuous Deployment (Render)

The repo includes a [Render Blueprint](render.yaml) with two services:

| Service | Type | Root | Purpose |
|---------|------|------|---------|
| `group-chat-api` | Web (Node 22) | `server/` | REST API + Socket.io |
| `group-chat-client` | Static site | `client/` | Angular SPA |

### One-time setup

1. **MongoDB Atlas** — cluster + connection string (`MONGO_URI`).
2. **Render** — Dashboard → **New → Blueprint** → connect this GitHub repo.
3. Fill secret env vars when prompted: `MONGO_URI`, Cloudinary, `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`.
4. **Google OAuth** — add production origins:
   - `https://<group-chat-client>.onrender.com`
   - API URL is derived automatically from `API_HOST` at build time.
5. **Atlas Network Access** — allow Render (or `0.0.0.0/0` for demo).

After the first deploy, open the client URL and verify login, groups, and real-time chat.

### Optional: deploy hooks (after CI)

Render → each service → **Settings → Deploy Hook** → copy URL.

Add GitHub repository secrets:

- `RENDER_DEPLOY_HOOK_BACKEND`
- `RENDER_DEPLOY_HOOK_FRONTEND`

`.github/workflows/deploy.yml` triggers these hooks when CI passes on `main`. Render auto-deploy on push works without hooks; hooks add explicit **deploy-after-green-CI** control.

### Local production build

```bash
cd client
API_HOST=your-api.onrender.com npm run build
# output: dist/client/browser
```
