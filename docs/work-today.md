# מסמך עבודה — היום (רביעי 17/06/2026)

**יום 5 מתוך 8** · שלב: **שרת — Socket.io events + בדיקת שרת מלאה** · Slice: Messages + Real-time (Primary: שושי)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** קודם השרת מקצה לקצה (API + DB + Socket), ורק אז הלקוח.
> אתמול (יום 4) הושלמה שכבת ההעלאות בשרת: Multer + Cloudinary ל-attachments,
> ו-`createRateLimiter(max, windowMs)` מופעל על endpoint ההודעות.
> היום סוגרים את שלב השרת — **אירועי Socket.io בזמן אמת** (חדרי קבוצה + שידור
> הודעות) ו-**בדיקת שרת מלאה** מקצה לקצה.

---

## למה real-time דרך חדרי קבוצה

כל הודעה צריכה להגיע **רק לחברי הקבוצה הרלוונטית**, לא לכל המחוברים.
לכן כל socket מצטרף ל-**room** לפי `groupId` (`socket.join(groupId)`), והשרת משדר
את האירועים עם `io.to(groupId).emit(...)`. כך שכבת ה-REST נשארת מקור האמת לשמירה
ב-DB, וה-Socket רק מודיע לחברי החדר על שינוי שכבר נשמר.

---

## מטרת היום

להעמיד **real-time מלא בשרת ובדוק** — הצטרפות/יציאה מחדר קבוצה, ושידור
`newMessage` / `messageUpdated` / `messageDeleted` לחברי הקבוצה אחרי שמירה ב-DB.
בסוף היום השרת עובד מקצה לקצה: Auth → Groups → Messages → אירועי Socket בזמן אמת,
ושלב השרת נסגר לקראת המעבר ללקוח (יום 6).


|                   |                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Branch**        | `feature/chat-realtime` (ממשיכים מאתמול — ההודעות וההעלאות כבר עליו)                             |
| **לפני שמתחילים** | `git checkout feature/chat-realtime` · `nvm use` (Node 22 LTS) · `npm install` ב-`server/` (לוודא ש-`socket.io` מותקן) |
| **בסוף היום**     | `npm run lint` + `npm run typecheck` נקיים · commit עם `feat:` · push ל-`feature/chat-realtime`  |


---

## נקודת פתיחה (מה כבר קיים)

- `server/src/sockets/index.ts` — `createSocketServer` עם lifecycle בלבד (`connection` / `disconnect` + `connected`); **אין** room events ✓
- `server/src/controllers/message-controller.ts` — `createMessage` / `updateMessage` / `deleteMessage` שומרים ב-DB אך **ללא** emit ✓
- `server/src/server.ts` — `createSocketServer(httpServer)` נקרא, אך ה-`io` החוזר לא נשמר ולא נחשף ל-app ✓
- `server/src/app.ts` — אין גישה ל-`io` ב-request flow ✓
- `server/src/middleware/upload-middleware.ts` + `rate-limiter-middleware.ts` — Multer/Cloudinary + `createRateLimiter` (יום 4) ✓
- `server/src/routes/message-routes.ts` — `messageRateLimiter = createRateLimiter(30, 60_000)` מחובר ל-`POST` ✓

---

## משימות היום

### 1. הרחבת אירועי Socket.io — `server/src/sockets/index.ts`

- [x] `socket.on('joinGroup', groupId)` → `socket.join(groupId)` (הצטרפות לחדר הקבוצה)
- [x] `socket.on('leaveGroup', groupId)` → `socket.leave(groupId)` (יציאה מהחדר)
- [x] להגדיר שמות אירועי השידור היוצאים: `newMessage`, `messageUpdated`, `messageDeleted` (לחדר `groupId`)
- [x] לשמור על ה-lifecycle הקיים (`connection` / `disconnect`) ועל ה-`cors` מ-`env.clientOrigin`

### 2. חשיפת `io` ל-controllers — `server/src/server.ts` + `server/src/app.ts`

- [x] ב-`server.ts`: לשמור את ה-`io` החוזר מ-`createSocketServer(httpServer)`
- [x] להצמיד אותו ל-app: `app.set('io', io)` (לפני `httpServer.listen`)
- [x] (אופציונלי) טיפוס עזר ב-`types/express.d.ts` או getter קטן, כדי לקרוא `io` ב-controllers בצורה מוטיפסת

### 3. שידור אירועים מה-controllers — `server/src/controllers/message-controller.ts`

- [x] `createMessage` — אחרי השמירה: `req.app.get('io').to(groupId).emit('newMessage', message)`
- [x] `updateMessage` — אחרי העדכון: `emit('messageUpdated', updated)` לחדר הקבוצה
- [x] `deleteMessage` — אחרי המחיקה: `emit('messageDeleted', { id, groupId })` לחדר הקבוצה
- [x] לוודא שה-emit קורה **רק אחרי** הצלחת פעולת ה-DB (לא לפני), ושכשלון לא חוסם את התגובה ל-HTTP

### 4. בדיקת שרת מלאה (מקצה לקצה)

> stub auth דרך `X-Test-User-Id: <ObjectId תקין>` עד שה-JWT של תמר ינחת.

- [x] זרימה מלאה: Auth (stub) → יצירת/צפייה בקבוצה (Groups) → שליחת הודעה (Messages) → קבלת `newMessage` בזמן אמת
- [x] לפתוח שני clients (או Socket client / חלון בדיקה), להצטרף לאותו `groupId`, ולוודא שהודעה חדשה מגיעה לשני הצדדים
- [x] עריכת הודעה → `messageUpdated` מגיע · מחיקת הודעה → `messageDeleted` מגיע
- [x] לוודא ששידור מגיע **רק** לחברי החדר הרלוונטי (מי שלא ב-room לא מקבל)

### 5. ניקיון וסגירת שלב השרת

- [x] `npm run lint` + `npm run typecheck` נקיים
- [x] commit עם `feat:` (אירועי Socket.io + שידור הודעות) · push ל-`feature/chat-realtime`

---

## קריטריון "סיימתי"

- [x] `joinGroup` / `leaveGroup` עובדים — socket מצטרף/יוצא מחדר לפי `groupId`
- [x] הודעה חדשה משודרת בזמן אמת לחברי הקבוצה (`newMessage`) אחרי שמירה ב-DB
- [x] עריכה/מחיקה משדרות `messageUpdated` / `messageDeleted` לחדר הקבוצה
- [x] השידור מגיע רק לחברי החדר הרלוונטי
- [x] הזרימה המלאה Auth → Groups → Messages → Socket עובדת מקצה לקצה
- [x] `npm run lint` + `npm run typecheck` עוברים נקי — **השרת עובד טוב ובדוק** 🎯

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה: יום 6 — לקוח: Groups (service + list/card/form) + Auth (secondary))
2. סמני ✓ את משימות יום 5 שהושלמו
3. Commit + push ל-`feature/chat-realtime` — שלב השרת נסגר, מחר עוברים לצד לקוח
