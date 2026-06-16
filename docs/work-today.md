# מסמך עבודה — היום (שני 15/06/2026)

**יום 3 מתוך 8** · שלב: **שרת — Messages** · Slice: Messages (Primary: שושי)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** קודם השרת מקצה לקצה (API + DB + Socket), ורק אז הלקוח.
> אתמול (יום 2) נסגרה שכבת ה-Groups בשרת ו-`feature/groups` **מוזג ל-`main`**. היום הושלמה
> שכבת ההודעות (טקסט) בשרת: controller, middleware של בעלות, routes, וחיווט מלא.

---

## מטרת היום

להעמיד **Messages API (טקסט) עובד מקצה לקצה ובדוק** — שליפה עם pagination, יצירה,
עריכה (owner בלבד) ומחיקה (owner או admin) — עם הרשאות member/owner/admin נכונות
ו-status codes מדויקים.


|                   |                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Branch**        | `feature/chat-realtime` (מסתעף מ-`main` אחרי מיזוג `feature/groups`)                            |
| **לפני שמתחילים** | `git checkout main` + `git pull` · `nvm use` (Node 22 LTS) · `git checkout -b feature/chat-realtime` · `npm install` ב-`server/` |
| **בסוף היום**     | `npm run lint` + `npm run typecheck` נקיים · commit עם `feat:` · push ל-`feature/chat-realtime`  |


---

## נקודת פתיחה (מה כבר קיים)

- `server/src/models/message-model.ts` — `findByGroup` (pagination דרך `before`), `validateMessage` (Joi, `.or('text','attachments')`), `toJSON` ✓
- `server/src/middleware/group-middleware.ts` — `isGroupMember`, `isGroupAdmin` (טוענים את הקבוצה ל-`req.group`) ✓
- `server/src/middleware/validate-middleware.ts` — `validateBody(schema)` (factory ל-Joi) ✓
- `server/src/middleware/stub-auth-middleware.ts` — מזריק `req.userId` (עד שה-JWT של תמר ינחת) ✓
- `server/src/controllers/message-controller.ts` — `getMessages`, `createMessage`, `updateMessage`, `deleteMessage` ✓
- `server/src/middleware/message-middleware.ts` — `isMessageOwner`, `isMessageOwnerOrAdmin` ✓
- `server/src/routes/message-routes.ts` — `groupMessageRouter` + `messageRouter` ✓
- `server/src/app.ts` — `/api/groups/:id/messages` + `/api/messages` מחוברים ✓

---

## משימות היום

### 1. Controller — `server/src/controllers/message-controller.ts` (חדש)

- [x] `getMessages` — member בלבד
  - `Message.findByGroup(req.params.id, { before, limit })` (pagination דרך query `before`)
  - 200 עם רשימת ההודעות (oldest-first)
- [x] `createMessage` — member בלבד
  - `senderId` מה-token, `groupId` מה-`params` · 201 עם ההודעה
  - עיקרון קבוע: `senderId` נלקח מה-token בלבד — לעולם לא מ-body
- [x] `updateMessage` — owner בלבד
  - עדכון `text` על `req.message` ושמירה · 200 · 400 אם validation נכשל
- [x] `deleteMessage` — owner או admin של הקבוצה
  - מחיקה · החזרת **204** (ללא body)

### 2. Middleware — `server/src/middleware/message-middleware.ts` (חדש)

- [x] loader שטוען את ההודעה לפי `:id` ל-`req.message` (במתכונת `loadGroup`):
  - `:id` לא תקין → 400 · לא קיים → 404
- [x] `isMessageOwner` — `req.message.senderId` שווה ל-`req.userId` (אחרת 403)
- [x] בדיקת owner-or-admin למחיקה (owner או `adminId` של הקבוצה)

### 3. Routes — `server/src/routes/message-routes.ts` (חדש)

- [x] router מקונן (`mergeParams`) תחת קבוצה:
  - `GET /api/groups/:id/messages` → `isGroupMember, getMessages`
  - `POST /api/groups/:id/messages` → `isGroupMember, validateBody(validateMessage), createMessage`
- [x] router עליון להודעה בודדת:
  - `PUT /api/messages/:id` → owner, `validateBody(validateMessage), updateMessage`
  - `DELETE /api/messages/:id` → owner-or-admin, `deleteMessage`

### 4. חיווט app — `server/src/app.ts`

- [x] חיבור ה-routers החדשים (`/api/groups/:id/messages` + `/api/messages`)
- [x] טיפול עקבי ב-async errors (`next(err)` ל-`errorHandler` המרכזי)
- [x] status codes נכונים לאורך כל הזרימה: **200 / 201 / 204 / 400 / 403 / 404 / 500**

### 5. בדיקה ידנית (Thunder Client)

> שולחים את ה-header `X-Test-User-Id: <ObjectId תקין>` (stub auth עד שה-JWT של תמר ינחת).

- [ ] יצירת הודעת טקסט (201) → שליפה עם pagination (`before`) → 200
- [ ] עריכת הודעה שלי → 200 · עריכת הודעה של מישהו אחר → 403
- [ ] מחיקת הודעה שלי / כ-admin → 204 · מחיקה ע"י זר → 403
- [ ] גוף ריק (ללא `text` וללא `attachments`) → 400
- [ ] `:id` לא קיים → 404 · `:id` לא תקין → 400

---

## קריטריון "סיימתי"

- [ ] ארבע פעולות ההודעות (טקסט) עובדות מול ה-DB עם הרשאות member/owner/admin נכונים
- [ ] owner בלבד עורך · owner או admin מוחק · זר מקבל 403
- [ ] status codes תקינים (200/201/204/400/403/404)
- [x] `npm run lint` + `npm run typecheck` עוברים נקי

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה: יום 4 — Upload (Multer) + Rate-limiter)
2. סמני ✓ את משימות יום 3 שהושלמו
3. Commit + push ל-`feature/chat-realtime`
