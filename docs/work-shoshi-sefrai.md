# קובץ עבודה — שושי ספראי

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** תמר זיסמן  
**תפקיד:** Primary ב-Groups, Messages/Chat | Secondary ב-Auth, Invitations, Profile  
**תכנון ראשי:** [work-plan.md](work-plan.md)

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | שלב 0 — הקמה משותפת |
| **Slice פעיל** | — |
| **Branch פעיל** | `main` |
| **משימה עכשיו** | הקמת Monorepo עם תמר |
| **עודכן לאחרונה** | 2026-06-08 |
| **עודכן על ידי** | שושי |

> עדכני שדה זה בכל מעבר שלב — בסוף כל שבוע עבודה לפחות.

### איך לעדכן

1. בסיום משימה / מעבר Slice — עדכני את הטבלה + תאריך
2. הזיזי את `▶ **[שלב נוכחי]**` לכותרת השלב החדשה
3. עדכני גם את מסמך תמר + התכנון הראשי (סנכרון צוות)

---

## עקרון העבודה שלך

את **בעלים ראשית (~70%)** על Groups ו-Messages/Real-time.  
בכל slice אחר את **חייבת** לגעת בכל שכבה (DB, API, Middleware, Service, UI) — לפחות כ-Secondary (~30%).

**Branches שלך:**
- `feature/groups`
- `feature/chat-realtime`
- `feature/polish` (משותף)

---

## ▶ **[שלב נוכחי]** שלב 0 — הקמה משותפת (ימים 1–2, עם תמר)

- [ ] יצירת Monorepo + GitHub repo
- [ ] `server/`: Express scaffold, `.env`, חיבור MongoDB
- [ ] `client/`: `ng new` עם routing, Material, standalone
- [ ] `.env.example` ב-server וב-client
- [ ] תיקיית `docs/` עם templates
- [ ] הסכמה על naming conventions ו-branch strategy

---

## Slice 1 — Auth (שבוע 1) — **Secondary**

### Server

- [ ] Review: User model (תמר)
- [ ] **`static findByEmail()`** — וידוא/השלמה ב-User model
- [ ] Review: auth routes, controllers, JWT

### Client — **אחריותך העיקרית ב-Slice זה**

- [ ] **`LoginComponent`** + Reactive Forms validation
- [ ] **`AuthGuard`** — הגנה על routes
- [ ] **`authInterceptor`** — attach JWT token ל-Header
- [ ] Review: RegisterComponent, AuthService (תמר)
- [ ] Validation: email required, password required

### Middleware (שלך)

- [ ] Review: errorLogger (תמר)
- [ ] הכנה ל-`createRateLimiter` (יושלם ב-Slice 4)

### תוצר

- [ ] Login + redirect ל-groups
- [ ] Token נשלח בכל request
- [ ] PR review ל-`feature/auth` של תמר

---

## Slice 2 — Groups (שבוע 2) — **Primary**

### Server

- [ ] `server/src/models/Group.model.js`
  - שדות: name, description, adminId, members[], avatar
  - refs ל-User, validation, indexes
  - `static findForUser()`, `toJSON()`
- [ ] `server/src/middleware/group.middleware.js` — `isGroupAdmin`, `isGroupMember`
- [ ] `server/src/controllers/group.controller.js` — CRUD, leave, invite
- [ ] `server/src/routes/group.routes.js`
- [ ] Validation: name required, min 2 chars

### Client

- [ ] **`GroupService`** + Signal store (רשימת קבוצות)
- [ ] **`GroupListComponent`** — `/groups`
- [ ] **`GroupCardComponent`** — כרטיס קבוצה
- [ ] **`GroupFormComponent`** — shared form: `/groups/new` + `/groups/:id/edit`
- [ ] Review: NavBar links (תמר)

### תוצר

- [ ] יצירה, עריכה, מחיקה (admin), יציאה מקבוצה
- [ ] GroupForm עובד לפי id param (add vs edit)
- [ ] PR → Review על ידי תמר → Merge

---

## Slice 3 — Invitations (שבוע 3) — **Secondary**

### Server

- [ ] Review: Invitation model + endpoints (תמר)

### Client — **אחריותך**

- [ ] **`NavBar`** — badge/count להזמנות pending
- [ ] Review: InvitationList, InvitationActions (תמר)
- [ ] Review: InvitationService
- [ ] Confirm dialog לפני reject (אם לא נעשה)

### תוצר

- [ ] Badge מציג מספר הזמנות ב-NavBar
- [ ] PR review ל-`feature/invitations`

---

## Slice 4 — Messages + Real-time (שבועות 4–5) — **Primary**

### Server

- [ ] `server/src/models/Message.model.js`
  - text, groupId, senderId, attachments[] (image/audio/pdf)
  - `pre('save')`, `static findByGroup()`, `toJSON()`
- [ ] `server/src/controllers/message.controller.js` — CRUD
- [ ] `server/src/middleware/upload.middleware.js` — Multer (image, audio, PDF, max 10MB)
- [ ] `server/src/middleware/rateLimiter.middleware.js` — **`createRateLimiter(max, windowMs)`** (middleware creator)
- [ ] `server/src/sockets/index.js` — Socket.io setup
  - Events: `joinGroup`, `leaveGroup`, `newMessage`, `messageUpdated`, `messageDeleted`
- [ ] Routes: messages under `/api/groups/:id/messages`

### Client

- [ ] **`MessageService`** + Signal (real-time updates)
- [ ] **`ChatRoomComponent`** — `/groups/:id`
- [ ] **`MessageListComponent`**
- [ ] **`MessageFormComponent`** — text + file picker + preview
- [ ] File preview: image, audio player, PDF link
- [ ] Review: SocketService, MessageItem (תמר)
- [ ] Validation client: file type + size

### תוצר

- [ ] שליחת הודעות טקסט + קבצים
- [ ] צ'אט real-time עם Socket.io
- [ ] עריכה/מחיקה (owner) + מחיקה (admin)
- [ ] PR → Review על ידי תמר → Merge

---

## Slice 5 — Admin + Profile (שבוע 5) — **Secondary**

### Server

- [ ] Review: DELETE member endpoint (תמר)

### Client — **אחריותך**

- [ ] **`ProfileComponent`** — `/profile`
- [ ] **`ProfileForm`** — עדכון username
- [ ] **`AvatarUpload`** — review/שיפור flow של תמר
- [ ] **Group avatar upload** — ב-GroupForm

### תוצר

- [ ] Profile + avatar upload עובדים
- [ ] Group avatar ביצירה/עריכה
- [ ] PR review

---

## Slice 6 — גימור (שבוע 6) — **משותף**

### אחריותך

- [ ] **Responsive — Mobile:** hamburger menu + full-width chat
- [ ] **`docs/server-analysis.md`** — תרשים פעולות Regular User (Mermaid)
- [ ] **`docs/database-analysis.md`** — collections: groups, messages
- [ ] **`docs/screens-analysis.md`** — מסכי Chat + Invitations
- [ ] **`client/README.md`**
- [ ] ייצוא MongoDB / Thunder Client
- [ ] **Demo prep:** Chat flow + Invitations flow
- [ ] PR reviews לכל branches

---

## סיכום אחריות לפי שכבה

| שכבה | קבצים/נושאים שלך |
|---|---|
| **MongoDB** | Group, Message |
| **API** | Groups, Messages |
| **Middleware** | isGroupAdmin, isGroupMember, createRateLimiter, Multer upload |
| **Angular Components** | Login, Groups (List/Card/Form), Chat (Room/List/Form), Profile |
| **Services** | GroupService, MessageService |
| **Forms** | Login, Group, Message + file picker |
| **Upload** | Message attachments, Group avatar |
| **Socket.io** | Server setup + room events |
| **UI Responsive** | Mobile layout (hamburger) |
| **Docs** | Regular user server analysis, groups+messages DB, Chat+Invitations screens |

---

## Checklist הגשה — מה את אחראית להציג

- [ ] Login + AuthGuard + interceptor
- [ ] Groups CRUD + GroupForm (add/edit)
- [ ] יציאה מקבוצה
- [ ] צ'אט real-time + שליחת קבצים
- [ ] Profile + avatar + group avatar
- [ ] isGroupAdmin + createRateLimiter — הסבר
- [ ] Socket.io server events

**דדליין:** י"א כסלו תשפ"ו

---

## ספריות npm — שלך להתקין

**Server:**
- `socket.io`, `multer`, `winston` (אם לא הותקנו)

**Client:**
- `socket.io-client`
- ספרייה נוספת לבחירה (מומלץ: `date-fns` לתאריכי הודעות)
