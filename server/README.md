# Server

Node.js + Express + Mongoose + JWT + Multer + Socket.io.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Structure

```
src/
├── config/        # DB connection, env config
├── models/        # User, Group, Invitation, Message
├── routes/
├── controllers/
├── middleware/    # auth, errorLogger, rateLimiter (custom)
├── services/
├── sockets/       # Socket.io setup + events
└── utils/
uploads/           # images, audio, pdf
```

## API Endpoints

See [../docs/work-plan.md](../docs/work-plan.md).
