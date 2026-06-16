# מסמך עבודה — היום (שלישי 16/06/2026)

**יום 4 מתוך 8** · שלב: **שרת — Upload (Cloudinary) + Rate-limiter** · Slice: Messages + Media (Primary: שושי)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** קודם השרת מקצה לקצה (API + DB + Socket), ורק אז הלקוח.
> אתמול (יום 3) הושלמה שכבת ההודעות (טקסט) בשרת: controller, middleware של בעלות, routes
> וחיווט מלא ב-`app.ts`. היום מוסיפים **העלאת קבצים (Multer + Cloudinary)** ל-attachments של הודעה
> ו-**rate-limiter** דרך factory `createRateLimiter(max, windowMs)`.

---

## למה Cloudinary ולא דיסק מקומי

הקובץ הפיזי לא נשמר על השרת אלא ב-**Cloudinary CDN**.
ב-MongoDB ממשיכים לשמור **רק metadata** (`type`, `url`, `originalName`) — בדיוק כמו ש-`message-model.ts`
כבר מוגדר. עם `multer-storage-cloudinary`, Multer מעלה את הקובץ ישירות ל-Cloudinary ומחזיר
`url` מוכן — אין צורך בשירות נפרד ואין קריאות-S3 ידניות.

---

## מטרת היום

להעמיד **העלאת קבצים ל-Cloudinary + rate-limiter עובדים ובדוקים** בשרת — צירוף קבצים
(image / audio / pdf, עד 10MB) להודעה דרך Multer → Cloudinary → שמירת ה-`url`
ב-DB, ו-middleware שמגביל את קצב הבקשות ל-endpoint של ההודעות. בסוף היום אפשר לשלוח
הודעה עם קובץ מצורף שנשמר ב-Cloudinary, וחריגה מהקצב נחסמת.


|                   |                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Branch**        | `feature/chat-realtime` (ממשיכים מאתמול — ההודעות כבר עליו)                                      |
| **לפני שמתחילים** | `git checkout feature/chat-realtime` · `nvm use` (Node 22 LTS) · `npm install multer @types/multer cloudinary multer-storage-cloudinary` ב-`server/` · ליצור חשבון Cloudinary (חינם) ולמלא את משתני ה-`CLOUDINARY_*` ב-`.env` |
| **בסוף היום**     | `npm run lint` + `npm run typecheck` נקיים · commit עם `feat:` · push ל-`feature/chat-realtime`  |


---

## נקודת פתיחה (מה כבר קיים)

- `server/src/models/message-model.ts` — `IAttachment` = `{ type: 'image'|'audio'|'pdf', url, originalName }`, validation עד 10 attachments, `validateMessage` (Joi) ✓
- `server/src/controllers/message-controller.ts` — `createMessage` שומר `...req.body` עם `groupId`/`senderId` ✓
- `server/src/routes/message-routes.ts` — `groupMessageRouter` (`POST /`) + `messageRouter` ✓
- `server/src/middleware/validate-middleware.ts` — `validateBody(schema)` (factory ל-Joi) ✓
- `server/src/config/env.ts` — גישה ממורכזת ומוטיפסת ל-`process.env` ✓
- `server/src/app.ts` — `/api/groups/:id/messages` + `/api/messages` מחוברים ✓
- `server/src/middleware/upload-middleware.ts`, `rate-limiter-middleware.ts`, ומשתני `CLOUDINARY_*` ב-`env.ts` ✓

---

## משימות היום

### 1. תצורת Cloudinary — `server/src/config/env.ts` + `.env`

- [x] להוסיף ל-`env.ts` בלוק `cloudinary`: `cloudName`, `apiKey`, `apiSecret`
- [x] למלא ב-`.env` את המשתנים (ראו `.env.example` המעודכן) — פרטים מ-Cloudinary Dashboard

### 2. Multer + Cloudinary — `server/src/middleware/upload-middleware.ts` (חדש)

- [x] הגדרת `CloudinaryStorage` מ-`multer-storage-cloudinary`:
  - `folder: 'chat-attachments'`
  - `resource_type: 'auto'` (תומך image / audio / pdf)
  - `allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'pdf']`
- [x] `fileFilter` נוסף ב-Multer — לדחות MIME שלא מתאים ל-`image/*`, `audio/*`, `application/pdf` (400)
- [x] `limits.fileSize = 10 * 1024 * 1024` (10MB)
- [x] לייצא `uploadMessageFiles` (`upload.array('files', 10)`)
- [x] עזר קטן שממפה `req.files` ל-`IAttachment[]`:
  - `type` לפי `mimetype` (`image/*` → `'image'`, `audio/*` → `'audio'`, `application/pdf` → `'pdf'`)
  - `url` = `file.path` (ה-`secure_url` שמחזיר Cloudinary)
  - `originalName` = `file.originalname`

### 3. חיווט upload ל-route יצירת הודעה — `server/src/routes/message-routes.ts`

- [x] להוסיף את `uploadMessageFiles` ל-`POST /api/groups/:id/messages` **לפני** ה-validation
- [x] למזג את ה-attachments מהקבצים לתוך גוף ההודעה לפני `createMessage`
- [x] לוודא שהזרימה תומכת גם בהודעת טקסט בלבד וגם בהודעה עם קובץ (ה-`.or('text','attachments')` נשמר)

### 4. Rate-limiter — `server/src/middleware/rate-limiter-middleware.ts` (חדש)

- [x] **`createRateLimiter(max, windowMs)`** — factory שמחזיר middleware (חובת הקורס שלך)
  - מעקב לפי מפתח (למשל `req.userId` או IP) בתוך חלון זמן
  - חריגה → **429** (`Too Many Requests`) עם הודעת JSON עקבית
- [x] הפעלה על endpoint יצירת ההודעות (לדוגמה `createRateLimiter(30, 60_000)`)

### 5. תצורה ובדיקות אינטגרציה

- [x] לוודא ש-`createApp` עדיין מרים נקי, ושגיאות Multer / Cloudinary מגיעות ל-`errorHandler` המרכזי
- [x] לוודא ש-`.env.example` מעודכן (Cloudinary) ושאין secrets ב-git

### 6. בדיקה ידנית (Thunder Client)

> שולחים את ה-header `X-Test-User-Id: <ObjectId תקין>` (stub auth עד שה-JWT של תמר ינחת).
> עבור העלאות משתמשים ב-`form-data` (שדה `files`).

- [x] העלאת תמונה (`image`) → 201 עם `attachments[0].type === 'image'`, וה-`url` מצביע ל-Cloudinary
- [x] העלאת אודיו (`audio`) ו-PDF (`pdf`) → 201, והקבצים נגישים דרך ה-`url`
- [x] קובץ מסוג לא נתמך → 400 · קובץ מעל 10MB → 400
- [x] שליחת בקשות מעבר לקצב המוגדר → **429**
- [x] הודעת טקסט בלבד (ללא קובץ) עדיין עובדת → 201

---

## קריטריון "סיימתי"

- [x] אפשר לצרף image / audio / pdf להודעה — הקובץ נשמר ב-**Cloudinary**, וה-`url` שלו נשמר כ-`attachments` תקין ב-DB
- [x] הקובץ נגיש בפועל דרך ה-`url` שחזר מ-Cloudinary
- [x] קבצים לא נתמכים / מעל 10MB נדחים (400)
- [x] `createRateLimiter(max, windowMs)` חוסם חריגה מהקצב (429) ומיושם על ההודעות
- [x] הודעת טקסט בלבד ממשיכה לעבוד
- [x] `npm run lint` + `npm run typecheck` עוברים נקי

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה: יום 5 — Socket.io events + בדיקת שרת מלאה)
2. סמני ✓ את משימות יום 4 שהושלמו
3. Commit + push ל-`feature/chat-realtime`
