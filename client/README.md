# Client

Angular 20 — standalone components, Signals, Reactive Forms, Angular Material.

## Setup

```bash
npm install
ng serve
```

## Linting

ESLint is configured via the official `angular-eslint` integration
(flat config in `eslint.config.js`). Run it with:

```bash
npm run lint
```

CI runs `npm run lint`, `npm run build -- --configuration production`, and
`npm test -- --watch=false --browsers=ChromeHeadless` on every push/PR to `main`.

## Structure

```
src/app/
├── core/          # auth, interceptors, guards
├── shared/        # buttons, cards, shared form
└── features/
    ├── auth/
    ├── groups/
    ├── invitations/
    └── chat/
```

## Screens & Routes

See [../docs/work-plan.md](../docs/work-plan.md).
