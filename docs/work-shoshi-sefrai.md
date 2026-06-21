# קובץ עבודה — שושי ספראי

**פרויקט:** אפליקציית צ'אט Fullstack (Node.js + Angular + MongoDB)  
**שותפה:** תמר זיסמן  
**תפקיד:** Primary ב-Groups, Messages/Chat | Secondary ב-Auth, Invitations, Profile  
**תכנון ראשי:** [work-plan.md](work-plan.md)

> **גישה:** קודם כל **השרת** — שיעבוד טוב מקצה לקצה (API + DB + Socket). רק אחרי
> שהשרת יציב ובדוק — עוברים ל**צד לקוח**.

---

## סמן מיקום

| | |
|---|---|
| **שלב נוכחי** | Slice 4 — Messages + Real-time (Primary) |
| **Branch פעיל** | `main` מעודכן · `feature/chat-realtime` |
| **משימה עכשיו** | Messages CRUD + Socket.io + Media · יום 8 — Responsive + Docs |
| **עודכן לאחרונה** | 2026-06-21 |
| **עודכן על ידי** | תמר (סנכרון) |

> עדכני את הטבלה + סמני ✓ בכל סוף יום.

---

## דדליין ולוח ימים

**הגשה: יום שני 22/06/2026.**  
ימי עבודה (ללא שישי ושבת): **8 ימים**.

| # | יום | תאריך | פוקוס |
|---|---|---|---|
| 1 | חמישי | 11/06 (היום) | שרת — Groups: middleware + controller |
| 2 | ראשון | 14/06 | שרת — Groups: routes + wiring + בדיקות |
| 3 | שני | 15/06 | שרת — Messages: controller + routes |
| 4 | שלישי | 16/06 | שרת — Upload (Cloudinary) + Rate-limiter |
| 5 | רביעי | 17/06 | שרת — Socket.io events + בדיקת שרת מלאה ✅ **השרת עובד** |
| 6 | חמישי | 18/06 | לקוח — Groups (service + list/card/form) + Auth (secondary) |
| 7 | ראשון | 21/06 | לקוח — Chat (room/list/form + file preview) + Profile |
| 8 | שני | 22/06 | גימור — Responsive mobile + Docs + Demo + PR סופי |

---

## עקרון העבודה שלך

את **בעלים ראשית (~70%)** על Groups ו-Messages/Real-time.  
ה-Secondary שלך (Auth, Invitations, Profile) = Review + משימות צד-לקוח מוגדרות בלבד —
**לא** נוגעת בסמכויות של תמר (User/Invitation models, auth/error middleware, NavBar,
SocketService client, MessageItem, MemberPanel, remove-member API, avatar של משתמש).

**Branches שלך:** `feature/groups` (פעיל) · `feature/chat-realtime` · `feature/polish` (משותף)

**קונבנציות בפועל:** TypeScript בשני הצדדים · `kebab-case` · מודלים `group-model.ts` ·
קומפוננטות ללא סיומת (`group-list.ts`) · Joi בשרת · Signals + `inject()` ב-Angular ·
PR → CI ירוק → Review מתמר → Squash merge.

**כבר בוצע:** Monorepo + CI · TypeScript בשרת · `ConnectionService` + `/api/health` +
Socket.io bootstrap · `group-model.ts` ✓ · `message-model.ts` ✓.

---

# חלק א׳ — שרת (ימים 1–5)

## יום 1 — חמישי 11/06 — Groups: middleware + controller

- [ ] `server/src/middleware/group-middleware.ts`
  - [ ] `isGroupMember` — בודק שהמשתמש ב-`members`
  - [ ] `isGroupAdmin` — בודק שהמשתמש הוא `adminId`
- [ ] `server/src/controllers/group-controller.ts` (התחלה)
  - [ ] `getMyGroups` (`findForUser`)
  - [ ] `createGroup` (Joi `validateGroup`, adminId מה-token)
  - [ ] `getGroupById`

**סוף יום:** מודל Group כבר קיים → middleware + 3 פעולות ראשונות מוכנות.

## יום 2 — ראשון 14/06 — Groups: routes + wiring + בדיקות

- [x] השלמת `group-controller.ts`: `updateGroup` (admin), `deleteGroup` (admin), `leaveGroup`
- [x] `server/src/routes/group-routes.ts` — חיבור controllers + middleware
- [x] חיבור הראוטר ב-`server/src/app.ts` תחת `/api/groups`
- [x] בדיקות ב-Thunder Client: CRUD מלא + leave + הרשאות admin
- [x] טיפול בשגיאות + status codes נכונים (201/400/403/404)

**סוף יום:** Groups API עובד מקצה לקצה ובדוק.

## יום 3 — שני 15/06 — Messages: controller + routes

- [ ] `server/src/controllers/message-controller.ts`
  - [ ] `getMessages` (`findByGroup`, pagination לפי `before`)
  - [ ] `createMessage` (Joi `validateMessage`, senderId מה-token)
  - [ ] `updateMessage` (owner only)
  - [ ] `deleteMessage` (owner או admin)
- [ ] Routes: `/api/groups/:id/messages` (+ `PUT/DELETE /api/messages/:id`)
- [ ] בדיקות ב-Thunder Client: שליחה/עריכה/מחיקה + הרשאות

**סוף יום:** Messages API (טקסט) עובד.

## יום 4 — שלישי 16/06 — Upload (Cloudinary) + Rate-limiter

- [ ] הוספת `CLOUDINARY_*` ל-`env.ts` + מילוי `.env`
- [ ] `server/src/middleware/upload-middleware.ts` — Multer + CloudinaryStorage
  - [ ] `multer-storage-cloudinary` עם `resource_type: 'auto'`, `folder: 'chat-attachments'`
  - [ ] `fileFilter` + `limits.fileSize = 10MB`
  - [ ] ייצוא `uploadMessageFiles` + עזר מיפוי `req.files` ל-`IAttachment[]`
- [ ] חיבור upload ל-route של יצירת הודעה (attachments → `req.body`)
- [ ] `server/src/middleware/rate-limiter-middleware.ts`
  - [ ] **`createRateLimiter(max, windowMs)`** — middleware creator (חובת הקורס שלך)
  - [ ] הפעלה על endpoint של הודעות
- [ ] בדיקה: העלאת תמונה/אודיו/PDF (url מ-Cloudinary) + חסימת חריגה מהקצב

**סוף יום:** העלאת קבצים ל-Cloudinary + rate-limiter עובדים.

## יום 5 — רביעי 17/06 — Socket.io events + בדיקת שרת מלאה

- [x] הרחבת `server/src/sockets/index.ts` מעבר ל-bootstrap:
  - [x] `joinGroup`, `leaveGroup`
  - [x] שידור `newMessage`, `messageUpdated`, `messageDeleted` לחדר הקבוצה
- [x] חיבור controllers ל-emit אירועים אחרי שמירה ב-DB
- [x] בדיקת שרת מלאה: Auth (stub) → Groups → Messages → Socket real-time
- [x] `npm run lint` + `npm run typecheck` נקיים

**🎯 סוף יום 5: השרת עובד טוב ובדוק — מעבר לצד לקוח.**

---

# חלק ב׳ — לקוח (ימים 6–7)

## יום 6 — חמישי 18/06 — Groups (לקוח) + Auth (secondary)

### Groups — Primary שלך
- [x] `features/groups/group.ts` — service + Signal store (רשימת קבוצות)
- [x] `features/groups/group-list.ts` — route `/groups`
- [x] `features/groups/group-card.ts`
- [x] `features/groups/group-form.ts` — shared: `/groups/new` + `/groups/:id/edit`
- [x] Lazy routes ב-`app.routes.ts`

### Auth — Secondary שלך (Auth עצמו של תמר)
- [x] `features/auth/login.ts` + Reactive Forms validation
- [x] `core/guards/auth-guard.ts` (functional)
- [x] `core/interceptors/auth-interceptor.ts` — attach JWT
- [x] Review: `register.ts`, `auth.ts` (תמר)

**סוף יום:** התחברות + צפייה/יצירה/עריכה/מחיקה/יציאה מקבוצה בדפדפן. ✅ (דחוס ל-18/06)

## יום 7 — ראשון 21/06 — Chat (לקוח) + Profile *(דחוס ל-18/06)*

### Chat — Primary שלך
- [x] `features/chat/message.ts` — service + Signal (real-time updates)
- [x] `features/chat/chat-room.ts` — `/groups/:id`
- [x] `features/chat/message-list.ts`
- [x] `features/chat/message-form.ts` — text + file picker + preview
- [x] File preview: image / audio player / PDF link
- [x] Validation: סוג + גודל קובץ
- [x] Review: `socket.ts`, `message-item.ts` (תמר)

### Profile — Secondary שלך
- [x] `features/profile/profile.ts` — route `/profile` + עדכון username
- [x] Group avatar URL field ב-`group-form.ts` (upload מלא — יום 8)

**סוף יום:** צ'אט real-time + שליחת קבצים + פרופיל עובדים. ✅ (דחוס ל-18/06)

---

# חלק ג׳ — גימור (יום 8)

## יום 8 — שני 22/06 — Responsive + Docs + Demo (יום הגשה)

- [ ] **Responsive — Mobile:** hamburger + full-width chat
- [ ] `docs/database-analysis.md` — collections: groups, messages
- [ ] `docs/screens-analysis.md` — מסכי Chat + Invitations
- [ ] `docs/server-analysis.md` — תרשים פעולות Regular User (Mermaid)
- [ ] `client/README.md`
- [ ] ייצוא MongoDB / Thunder Client collection
- [ ] **Demo prep:** Chat flow + Invitations flow
- [ ] PR אחרון + reviews → merge ל-`main`

---

## סיכום אחריות לפי שכבה

| שכבה | שלך | של תמר (לא שלך) |
|---|---|---|
| **MongoDB** | Group, Message | User, Invitation |
| **API** | Groups, Messages | Auth, Invitations, remove member |
| **Middleware** | isGroupAdmin, isGroupMember, createRateLimiter, Multer + Cloudinary | authMiddleware, errorLogger |
| **Components** | Login, Groups (List/Card/Form), Chat (Room/List/Form), Profile | Register, NavBar, Invitations, MessageItem, MemberPanel |
| **Services** | Group, Message | Auth, Invitation, Socket (client) |
| **Upload** | Message attachments, Group avatar | Avatar (user profile) |
| **Socket.io** | Server setup + room events | Client integration |
| **Responsive** | Mobile (hamburger) | Desktop (sidebar) |
| **Docs** | Regular user analysis, groups+messages DB, Chat+Invitations screens | Admin analysis, users+invitations DB, Auth+Groups screens |

---

## Checklist הגשה — מה את אחראית להציג

- [x] Login + AuthGuard + interceptor
- [x] Groups CRUD + GroupForm (add/edit) + יציאה
- [x] צ'אט real-time + שליחת קבצים
- [x] Profile + group avatar URL (upload מלא — יום 8)
- [ ] isGroupAdmin + createRateLimiter — הסבר
- [ ] Socket.io server events

---

## ספריות npm — שלך להתקין

**Server:** `socket.io` · `multer` · `@types/multer` · `cloudinary` · `multer-storage-cloudinary` · `joi` (בשימוש) · `express-rate-limit` (אופציונלי — אפשר creator ידני)  
**Client:** `socket.io-client` (מותקן) · מומלץ `date-fns` לתאריכי הודעות
