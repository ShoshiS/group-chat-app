# AGENTS.md — Client

Angular 20: **standalone, Signals, new control flow, Reactive Forms, Angular Material**.
No NgModules, no NgRx. See the root `AGENTS.md` for global conventions.

## Structure

```
src/app/
├── core/        # singletons: auth, guards, interceptors, app-level services
├── shared/      # reusable UI: buttons, cards, form controls, pipes
└── features/    # auth, groups, invitations, chat (lazy-loaded routes)
```

## Naming (Angular 20 — suffixless)

Follow the modern style guide: drop `.component`/`.service` suffixes, name by responsibility.

| Kind        | File                  | Class / symbol     | Selector / usage      |
|-------------|-----------------------|--------------------|-----------------------|
| Component   | `group-list.ts`       | `GroupList`        | `app-group-list`      |
| Service     | `auth.ts`             | `Auth`             | `inject(Auth)`        |
| Guard       | `auth-guard.ts`       | `authGuard` (fn)   | functional guard      |
| Interceptor | `auth-interceptor.ts` | `authInterceptor`  | functional interceptor|
| Pipe        | `time-ago-pipe.ts`    | `TimeAgoPipe`      | `\| timeAgo`          |
| Directive   | `autofocus.ts`        | `Autofocus`        | `[appAutofocus]`      |

- Templates/styles share the base name: `group-list.html`, `group-list.scss`.
- Files & folders: `kebab-case`. Component selectors: `app-` prefix; directive selectors: `app` camelCase prefix.

## Required modern syntax

- **Standalone everywhere** — components declare their own `imports: [...]`.
- **Native control flow** in templates: `@if`, `@else`, `@for (… ; track …)` (always `track`), `@switch`, `@defer`. Never `*ngIf` / `*ngFor` / `*ngSwitch`.
- **Signals for state:** `signal()`, `computed()`, `effect()`; derive, don't duplicate.
- **Signal I/O:** `input()` / `input.required()`, `output()`, `model()`, `viewChild()`, `contentChild()`. Avoid `@Input()` / `@Output()` decorators.
- **DI via `inject()`** instead of constructor parameter injection.
- **Change detection:** `ChangeDetectionStrategy.OnPush` on every component.
- **HTTP:** `provideHttpClient(withInterceptors([...]))`; services return typed Observables/signals.
- **Routing:** lazy `loadComponent` / `loadChildren`; functional guards/resolvers.
- **Forms:** typed Reactive Forms (`FormGroup`/`FormControl<T>`), never template-driven for real logic.
- **Images:** `NgOptimizedImage` for static images.
- **Async in templates:** prefer signals; use `async` pipe only for raw Observables.

### Example component

```ts
@Component({
  selector: 'app-group-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GroupCard],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList {
  private readonly groups = inject(GroupStore);
  readonly query = input('');
  readonly visible = computed(() =>
    this.groups.all().filter((g) => g.name.includes(this.query())),
  );
}
```

```html
@if (visible().length) {
  @for (group of visible(); track group.id) {
    <app-group-card [group]="group" />
  }
} @else {
  <p>No groups yet.</p>
}
```

## Styling

- Angular Material + component-scoped SCSS. **No inline styles.**
- Responsive: desktop sidebar + chat / mobile hamburger + full-width.

## Documentation

- English only. Short TSDoc on non-trivial services, signals stores, and guards — explain intent, not mechanics.

## Commands

```bash
ng serve        # dev server
npm run lint    # ng lint
ng build --configuration production
npm test        # ng test (watch mode, local dev)
npm run test:ci # ng test --watch=false --browsers=ChromeHeadless (single run / CI)
```
