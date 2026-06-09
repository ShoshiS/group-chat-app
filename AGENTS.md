# AGENTS.md — Group Chat App (Monorepo)

Guidance for AI agents and developers working in this repository. Read this first,
then the nested `server/AGENTS.md` and `client/AGENTS.md` for stack-specific rules.

## Project

Fullstack chat application: groups, users, invitations and messages (full CRUD),
with real-time messaging. Team: **Tamar Zisman** + **Shoshi Sefrai**.

- **Server:** Node.js + Express + Mongoose + JWT + Socket.io (TypeScript, ESM)
- **Client:** Angular 20 (standalone, Signals, Reactive Forms) + Angular Material
- **DB:** MongoDB (Atlas / Compass)
- **State:** Angular Signals + Services (no NgRx)
- **Runtime:** Node **22 LTS** — pinned in `.nvmrc` and enforced via `engines` in both `package.json` files. Run `nvm use` before working.

## Layout

```
group-chat-app/
├── server/   # API, sockets, models — see server/AGENTS.md
├── client/   # Angular SPA — see client/AGENTS.md
└── docs/     # hand-maintained Markdown (Mermaid diagrams) — see below
```

`docs/` is hand-edited **Markdown** with Mermaid diagrams: `work-plan.md` plus the three
pre-submission analysis docs (`server-analysis.md`, `database-analysis.md`,
`screens-analysis.md`). No generated or PDF artifacts — edit the `.md` files directly.

## Global conventions

- **Language:** all code, identifiers, comments, commits and docs in **English**, **LTR**.
- **Documentation:** document *why*, not *what*. Keep comments minimal and meaningful.
- **Files/folders:** `kebab-case` for files and folders across the repo.
- **Formatting:** rely on Prettier + ESLint; never hand-format. Fix lint before committing.
- **Tooling precedence:** Prettier owns formatting; ESLint owns code quality only (no stylistic rules). If the two ever disagree on formatting, **Prettier wins** — disable the conflicting ESLint rule instead of fighting it.
- **No secrets in git:** use `.env` (ignored) and keep `.env.example` up to date.
- **No dead code:** remove unused code instead of commenting it out.

## Commands

| Scope  | Run                          | Lint           | Test       |
|--------|------------------------------|----------------|------------|
| server | `npm run connect`*           | `npm run lint` | `npm test` |
| client | `ng serve`                   | `npm run lint` | `npm test` |

Run commands from the respective `server/` or `client/` folder.

\* `connect` is a one-off MongoDB connection smoke-test that exits (not a server). A real
`dev`/`start` script will be added once the Express entry point exists.

## Git workflow

- `main` is always deployable. Never commit directly to `main`.
- Branch per feature: `feature/<slice>` (e.g. `feature/auth`, `feature/chat-realtime`).
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Every branch → Pull Request → review by the partner → squash merge.
- Keep PRs small and scoped to one slice.
- **Merge conflicts:** rebase your feature branch on `main` before opening a PR to surface conflicts early. Whoever opens the PR resolves the conflict, but the file's **primary owner** (see ownership table) has final say on the resolution. When unsure, resolve it together rather than overwriting.

## Team ownership (Vertical Slices)

Each slice spans **DB → API → Client Service → UI**. Primary owner ~70%, secondary ~30%
(review + secondary tasks are mandatory).

| Slice            | Primary | Secondary |
|------------------|---------|-----------|
| Auth             | Tamar   | Shoshi    |
| Groups           | Shoshi  | Tamar     |
| Invitations      | Tamar   | Shoshi    |
| Messages + Media | Shoshi  | Tamar     |
| Admin + Profile  | Tamar   | Shoshi    |
| Polish + Docs    | both    | both      |

See `docs/work-plan.md` for the detailed slice breakdown and coverage matrix.
