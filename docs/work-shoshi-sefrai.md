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
| **שלב נוכחי** | יום 2 — Groups: routes + wiring + בדיקות (שרת) |
| **Branch פעיל** | `feature/groups` |
| **משימה עכשיו** | יום 3 — Messages: controller + routes |
| **עודכן לאחרונה** | 2026-06-14 |
| **עודכן על ידי** | שושי |

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
| 4 | שלישי | 16/06 | שרת — Upload (Multer) + Rate-limiter |
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

## יום 4 — שלישי 16/06 — Upload + Rate-limiter

- [ ] `server/src/middleware/upload-middleware.ts` — Multer
  - [ ] סוגים: image / audio / pdf · גודל מקס׳ 10MB · יעד `uploads/`
- [ ] חיבור upload ל-route של יצירת הודעה (attachments)
- [ ] `server/src/middleware/rate-limiter-middleware.ts`
  - [ ] **`createRateLimiter(max, windowMs)`** — middleware creator (חובת הקורס שלך)
  - [ ] הפעלה על endpoint של הודעות
- [ ] בדיקה: העלאת תמונה/אודיו/PDF + חסימת חריגה מהקצב

**סוף יום:** העלאת קבצים + rate-limiter עובדים.

## יום 5 — רביעי 17/06 — Socket.io events + בדיקת שרת מלאה

- [ ] הרחבת `server/src/sockets/index.ts` מעבר ל-bootstrap:
  - [ ] `joinGroup`, `leaveGroup`
  - [ ] שידור `newMessage`, `messageUpdated`, `messageDeleted` לחדר הקבוצה
- [ ] חיבור controllers ל-emit אירועים אחרי שמירה ב-DB
- [ ] בדיקת שרת מלאה: Auth (של תמר) → Groups → Messages → Socket real-time
- [ ] `npm run lint` + `npm run typecheck` נקיים

**🎯 סוף יום 5: השרת עובד טוב ובדוק — מעבר לצד לקוח.**

---

# חלק ב׳ — לקוח (ימים 6–7)

## יום 6 — חמישי 18/06 — Groups (לקוח) + Auth (secondary)

### Groups — Primary שלך
- [ ] `features/groups/group.ts` — service + Signal store (רשימת קבוצות)
- [ ] `features/groups/group-list.ts` — route `/groups`
- [ ] `features/groups/group-card.ts`
- [ ] `features/groups/group-form.ts` — shared: `/groups/new` + `/groups/:id/edit`
- [ ] Lazy routes ב-`app.routes.ts`

### Auth — Secondary שלך (Auth עצמו של תמר)
- [ ] `features/auth/login.ts` + Reactive Forms validation
- [ ] `core/guards/auth-guard.ts` (functional)
- [ ] `core/interceptors/auth-interceptor.ts` — attach JWT
- [ ] Review: `register.ts`, `auth.ts` (תמר)

**סוף יום:** התחברות + צפייה/יצירה/עריכה/מחיקה/יציאה מקבוצה בדפדפן.

## יום 7 — ראשון 21/06 — Chat (לקוח) + Profile

### Chat — Primary שלך
- [ ] `features/chat/message.ts` — service + Signal (real-time updates)
- [ ] `features/chat/chat-room.ts` — `/groups/:id`
- [ ] `features/chat/message-list.ts`
- [ ] `features/chat/message-form.ts` — text + file picker + preview
- [ ] File preview: image / audio player / PDF link
- [ ] Validation: סוג + גודל קובץ
- [ ] Review: `socket.ts`, `message-item.ts` (תמר)

### Profile — Secondary שלך
- [ ] `features/profile/profile.ts` — route `/profile` + עדכון username
- [ ] **Group avatar upload** ב-`group-form.ts`

**סוף יום:** צ'אט real-time + שליחת קבצים + פרופיל עובדים.

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
| **Middleware** | isGroupAdmin, isGroupMember, createRateLimiter, Multer | authMiddleware, errorLogger |
| **Components** | Login, Groups (List/Card/Form), Chat (Room/List/Form), Profile | Register, NavBar, Invitations, MessageItem, MemberPanel |
| **Services** | Group, Message | Auth, Invitation, Socket (client) |
| **Upload** | Message attachments, Group avatar | Avatar (user profile) |
| **Socket.io** | Server setup + room events | Client integration |
| **Responsive** | Mobile (hamburger) | Desktop (sidebar) |
| **Docs** | Regular user analysis, groups+messages DB, Chat+Invitations screens | Admin analysis, users+invitations DB, Auth+Groups screens |

---

## Checklist הגשה — מה את אחראית להציג

- [ ] Login + AuthGuard + interceptor
- [ ] Groups CRUD + GroupForm (add/edit) + יציאה
- [ ] צ'אט real-time + שליחת קבצים
- [ ] Profile + group avatar
- [ ] isGroupAdmin + createRateLimiter — הסבר
- [ ] Socket.io server events

---

## ספריות npm — שלך להתקין

**Server:** `socket.io` · `multer` · `joi` (בשימוש) · `express-rate-limit` (אופציונלי — אפשר creator ידני)  
**Client:** `socket.io-client` (מותקן) · מומלץ `date-fns` לתאריכי הודעות
