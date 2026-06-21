# UI Elements & SCSS Design Plan

Inventory of every UI element currently present in the Angular client (`client/src/app`),
grouped by component, with each element's purpose. Use this as the reference map when
planning the SCSS design system (tokens, shared patterns, responsive rules).

> Scope: this reflects the components that actually exist on disk today. Some routes
> (`invitations`) are still placeholders. The agent assistant lives under `features/agent`.

---

## 1. Current design system (as already used in SCSS)

These values are already scattered across the component stylesheets. They are the de-facto
tokens to formalize into shared SCSS variables / Material theme.

### Color palette (dark theme)

| Role | Value | Used for |
|------|-------|----------|
| App background | `#0f172a` | `body`, page background |
| Surface / card | `#111827` | nav-bar, auth card, panels |
| Surface raised | `#1e293b` | agent bubble, composer input, borders |
| Border | `#334155`, `#1e293b` | inputs, dividers |
| Text primary | `#e2e8f0` | body text |
| Text muted | `#94a3b8` | subtitles, usernames |
| Text faint | `#64748b` | hints, placeholders, disabled |
| Primary (blue) | `#3b82f6` (hover `#2563eb`) | buttons, links, avatars, own message |
| Link | `#60a5fa` | text links |
| Error | `#f44336`, `#fca5a5` | danger actions, error text |
| Success | `#86efac` | agent action summary |
| Overlay tints | `rgb(255 255 255 / 0.05–0.2)` | message bg, hover states, borders |

### Other tokens

- **Material theme:** `mat.theme()` with `primary: $azure-palette`, `tertiary: $blue-palette`, `density: 0`, `color-scheme: dark`.
- **Typography:** `Inter` (fallback `Segoe UI`, `Roboto`, system). Material uses `Roboto`.
- **Radius:** `0.25rem` (small), `0.625rem` (inputs/buttons), `1rem` (cards/bubbles), `50%` (avatars).
- **Spacing:** mix of `rem` (auth/agent) and `px` (groups/chat/profile) — **inconsistent, should be unified**.
- **Naming convention:** BEM (`block__element--modifier`), component-scoped SCSS, no inline styles.

### Recurring patterns worth extracting into shared SCSS

- **Avatar circle** (initial fallback + image): profile, message-item, group-card.
- **Page header with back arrow + title**: chat-room, group-form, profile.
- **Centered card layout**: auth-card, debug card.
- **Loading / empty / error state blocks**: group-list, message-list.
- **Primary button** and **danger action** styling.
- **Form field column** (label + input + error).

---

## 2. Global shell

### `app` (`app-root`) — `app.html` / `app.scss`
Root layout wrapper.

| Element | Purpose |
|---------|---------|
| `:host` (flex column, `min-height: 100vh`) | Full-height app shell |
| `<app-nav-bar>` | Persistent top navigation |
| `.app-main` | Router outlet container, flex-grows to fill height |
| `<router-outlet>` | Renders the active routed view |

### `nav-bar` (`app-nav-bar`) — `nav-bar.html` / `nav-bar.scss`
Top toolbar; renders a logged-in vs guest variant.

| Element | Purpose |
|---------|---------|
| `.nav-bar` (`mat-toolbar`) | Toolbar surface |
| `.nav-bar--guest` | Modifier for logged-out state |
| `.nav-bar__brand` | App name "Group Chat" |
| `.nav-bar__spacer` | Flex spacer pushing links right |
| `.nav-bar__user` | Current username label |
| `.nav-bar__link--active` | Active route highlight (`routerLinkActive`) |
| Links: Groups / Invitations / Profile (auth) | Primary nav (logged in) |
| Logout button | Ends session |
| Links: Login / Register (guest) | Auth entry points (logged out) |

---

## 3. Auth feature (`features/auth`)

Shared styles live in `_auth-shared.scss` (the `.auth-card` block), imported by login/register.

### `login` (`app-login`) & `register` (`app-register`)
Centered authentication card. Register adds a Username field.

| Element | Purpose |
|---------|---------|
| `.auth-card` | Centered card container (max-width 24rem) |
| `.auth-card__header` (`h1` + `p`) | Title + subtitle |
| `.auth-card__form` | Reactive form column |
| `.auth-card__field` (label + `span` + `input`) | Single form field |
| `.auth-card__error` | Per-field validation message |
| `.auth-card__server-error` | Server-side error message |
| Submit `button` (with loading text) | Sign in / Register, disabled while submitting |
| `<app-google-sign-in>` | Google OAuth button |
| `.auth-card__footer` | Cross-link to the other auth page |
| `.auth-card__divider` ("or") | Separator before Google button |

### `google-sign-in` (`app-google-sign-in`) — `google-sign-in.html` / `.scss`
Google Identity Services button host.

| Element | Purpose |
|---------|---------|
| `.google-sign-in__divider` ("or") | Visual separator |
| `.google-sign-in` / `--busy` | Wrapper, busy modifier during sign-in |
| `.google-sign-in__setup-hint` | Shown when `GOOGLE_CLIENT_ID` is missing |
| `.google-sign-in__button` (`#buttonHost`) | Container Google renders its button into |

---

## 4. Groups feature (`features/groups`)

### `group-list` (`app-group-list`) — `group-list.html` / `.scss`
Grid of the user's groups with state handling.

| Element | Purpose |
|---------|---------|
| `.group-list` | Page container (max-width 900px) |
| `.group-list__header` (`h1` + FAB) | Title + "New Group" extended FAB |
| `.group-list__spinner` (`mat-spinner`) | Loading state |
| `.group-list__error` | Error message |
| `.group-list__empty` (icon + text + button) | Empty state / first-group CTA |
| `.group-list__grid` | Responsive auto-fill card grid |
| `<app-group-card>` (repeated) | One card per group |

### `group-card` (`app-group-card`) — `group-card.html` / `.scss`
Single group summary card (Material card).

| Element | Purpose |
|---------|---------|
| `.group-card` (`mat-card`) | Card surface |
| `mat-card-header` + `mat-card-avatar` | Group avatar (if any) |
| `mat-card-title` / `mat-card-subtitle` | Name / description |
| `.group-card__members` | Member count |
| `mat-card-actions` | Action row |
| "Open Chat" link | Navigates to chat room |
| `mat-menu` trigger (`more_vert`) | Overflow actions menu |
| Edit / Delete items (admin) | Admin-only actions |
| Leave item (non-admin) | Leave group |
| `.group-card__danger` | Destructive action color |

### `group-form` (`app-group-form`) — `group-form.html` / `.scss`
Create / edit group form (route reused for both).

| Element | Purpose |
|---------|---------|
| `.group-form` | Page container |
| `.group-form__header` (back arrow + `h1`) | Navigation + dynamic title |
| `.group-form__body` (form) | Reactive form |
| `mat-form-field` × 3 | Name / Description / Avatar URL |
| `mat-error` blocks | Validation feedback |
| `.group-form__preview` (`img`) | Live avatar URL preview |
| `.group-form__actions` | Cancel link + submit button |
| Submit button (`mat-spinner` while saving) | Create / Save changes |

---

## 5. Chat feature (`features/chat`)

### `chat-room` (`app-chat-room`) — `chat-room.html` / `.scss`
Full-height chat screen container.

| Element | Purpose |
|---------|---------|
| `.chat-room` (flex column, `100vh`) | Screen container |
| `.chat-room__header` (back arrow + title) | Group title + back nav |
| `.chat-room__title` | Group name / id |
| `<app-message-list>` | Scrollable message area |
| `<app-message-form>` | Composer at bottom |

### `message-list` (`app-message-list`) — `message-list.html` / `.scss`
Scrollable list of messages with state handling.

| Element | Purpose |
|---------|---------|
| `.message-list` (`#messageList`) | Scroll container |
| `.message-list__spinner` | Loading state |
| `.message-list__error` | Error state |
| `.message-list__empty` | "No messages yet" empty state |
| `<app-message-item>` (repeated) | One per message |

### `message-item` (`app-message-item`) — `message-item.html` / `.scss`
Single message bubble with inline edit and attachments.

| Element | Purpose |
|---------|---------|
| `.message-item` / `--own` | Message row; own-message tint |
| `.message-item__header` | Sender meta row |
| `.message-item__avatar` / `__avatar-fallback` | Sender image or initial circle |
| `.message-item__sender` | Sender name |
| `.message-item__time` (`matTooltip`) | Timestamp (full date on hover) |
| `.message-item__actions` | Edit/Delete (own, shown on hover) |
| `.message-item__edit` | Inline edit input + save/cancel |
| `.message-item__text` | Message body |
| `.message-item__attachments` | Attachment wrapper |
| `.message-item__image` | Image attachment |
| `.message-item__audio` | Audio player attachment |
| `.message-item__pdf` | PDF link attachment |

### `message-form` (`app-message-form`) — `message-form.html` / `.scss`
Message composer with file attachments.

| Element | Purpose |
|---------|---------|
| `.message-form` (form) | Composer container |
| `.message-form__previews` | Pending attachments row |
| `.message-form__file-chip` | Single pending file chip |
| `.message-form__thumb` | Image thumbnail preview |
| `.message-form__input-row` | Attach + textarea + send row |
| `.message-form__attach` (`attach_file`) | File picker label (image/audio/pdf, max 10 MB) |
| `.message-form__textarea` | Auto-grow message input (Enter to send) |
| Send button (`send` icon) | Submit, disabled when empty/sending |

---

## 6. Invitations feature (`features/invitations`)

### `invitations` (`app-invitations`) — `invitations.html` / `.scss`
**Placeholder only** (Slice 3 not yet built).

| Element | Purpose |
|---------|---------|
| `.page-placeholder` (`h1` + `p`) | Title + "coming soon" copy |

---

## 7. Profile feature (`features/profile`)

### `profile` (`app-profile`) — `profile.html` / `.scss`
View/edit current user, change avatar, logout.

| Element | Purpose |
|---------|---------|
| `.profile` | Page container (max-width 480px) |
| `.profile__header` (back arrow + `h1`) | Navigation + title |
| `.profile__info` | Avatar + email block |
| `.profile__avatar` (img or initial) | Large avatar circle |
| `.profile__avatar-actions` | Change / Cancel avatar buttons (hidden file input) |
| `.profile__email` | User email |
| `.profile__form` | Username edit form |
| `mat-form-field` (Username) + `mat-error` | Editable field + validation |
| `.profile__actions` | Save + Logout buttons |

---

## 8. Home feature (`features/home`)

### `home` (`app-home`) — `home.html` / `.scss`
Placeholder landing copy.

| Element | Purpose |
|---------|---------|
| `.home` | Centered container |
| `.home__placeholder` (`h1` + `p`) | Intro text |
| `.home__hint` | Hint about the AI assistant button |

---

## 9. Agent assistant (`features/agent`)

### `agent-chat` (`app-agent-chat`) — `agent-chat.html` / `.scss`
Natural-language assistant chat window (mixed Hebrew UI copy).

| Element | Purpose |
|---------|---------|
| `.agent-chat` | Chat window container (max-width 42rem) |
| `.agent-chat__header` (`h2` + `p`) | Title + dev-access note |
| `.agent-chat__messages` | Scrollable bubble list |
| `.agent-chat__empty` | Example-prompt empty state |
| `.agent-chat__bubble` / `--user` | Assistant vs user message bubble |
| `.agent-chat__bubble--typing` | Typing indicator ("…") |
| `.agent-chat__actions` | Summary of actions the agent ran (success-tinted) |
| `.agent-chat__error` | Error message |
| `.agent-chat__composer` | Input + send button row |

---

## 10. Debug feature (`features/debug`)

### `connection-debug` (`app-connection-debug`) — `connection-debug.html` / `.scss`
Dev-only client↔server connectivity checker.

| Element | Purpose |
|---------|---------|
| `.shell` / `.card` | Centered card layout |
| `.subtitle` | Description line |
| `.status-list` / `.status-row` | REST / Socket / DB status rows |
| `.label` | Row label |
| `.badge` (status-class bound) | Connection status indicator |
| `.health` (`<pre>`) | Raw health JSON dump |
| `.error` | Last error message |
| `.actions` | Re-check API / Reconnect socket buttons |

---

## 11. SCSS planning recommendations

1. **Centralize tokens** — create `client/src/app/styles/_tokens.scss` (or extend the Material
   theme) for the colors, spacing, radii and typography listed in §1. Replace hard-coded hex
   values across components with these.
2. **Unify spacing units** — pick `rem` everywhere (auth/agent already do; groups/chat/profile use `px`).
3. **Extract shared mixins/placeholders**:
   - `%avatar-circle` (size param) for profile / message-item / group-card.
   - `%page-header` (back arrow + title) for chat-room / group-form / profile.
   - `%state-block` for loading / empty / error blocks.
   - `%primary-button` and `%danger-text`.
4. **Responsive strategy** — per `client/AGENTS.md`: desktop sidebar + chat / mobile hamburger
   + full-width. Currently only the chat-room is full-height; define shared breakpoints.
5. **Material vs custom** — auth, agent and debug use hand-rolled inputs/buttons; groups, chat,
   profile use Angular Material. Decide one approach (or theme Material to match the custom dark
   palette) to keep the look consistent.
