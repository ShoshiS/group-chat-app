# מסמך עבודה — היום (ראשון 14/06/2026)

**יום 2 מתוך 8** · שלב: **שרת — Groups** · Slice: Groups (Primary: שושי)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** קודם השרת מקצה לקצה (API + DB + Socket), ורק אז הלקוח.
> אתמול (יום 1) נבנו ה-middleware של ההרשאות + שלוש הפעולות הראשונות. היום סוגרים את
> שכבת ה-Groups בשרת: שלוש הפעולות הנותרות, חיווט מלא של ה-routes, ובדיקה מקצה לקצה.

---

## מטרת היום

להשלים את **group-controller** (update / delete / leave), **לחווט את כל ה-routes**
עם ה-middleware הנכון, ולוודא ש-**Groups API עובד מקצה לקצה ובדוק** — CRUD מלא,
יציאה מקבוצה, והרשאות admin עם status codes נכונים.


|                   |                                                                       |
| ----------------- | --------------------------------------------------------------------- |
| **Branch**        | `feature/groups`                                                      |
| **לפני שמתחילים** | `nvm use` (Node 22 LTS) · `npm install` ב-`server/` · `git pull`      |
| **בסוף היום**     | `npm run lint` + `npm run typecheck` נקיים · commit עם `feat:` · push |


---

## נקודת פתיחה (מה כבר קיים מאתמול)

- `server/src/controllers/group-controller.ts` — `getMyGroups`, `createGroup`, `getGroupById` ✓
- `server/src/middleware/group-middleware.ts` — `isGroupMember`, `isGroupAdmin` ✓ (טוענים את הקבוצה ל-`req.group`)
- `server/src/routes/group-routes.ts` — `GET /`, `POST /`, `GET /:id` ✓ (מחובר תחת `stubAuthMiddleware`)
- `server/src/app.ts` — `/api/groups` מחובר (כרגע ב-non-production בלבד)
- `server/src/models/group-model.ts` — `findForUser`, `validateGroup` (Joi, `stripUnknown`), `pre('save')` שמוסיף את היוצר ל-members ✓

---

## משימות היום

### 1. השלמת Controller — `server/src/controllers/group-controller.ts`

- [x] `updateGroup` — admin בלבד (אחרי `isGroupAdmin`)
  - `validateGroup.validate(req.body)` (Joi, `stripUnknown` — מסנן `adminId`/`members` מה-body)
  - עדכון `name` / `description` / `avatar` על `req.group` ושמירה
  - 200 עם הקבוצה המעודכנת · 400 אם validation נכשל
- [x] `deleteGroup` — admin בלבד (אחרי `isGroupAdmin`)
  - מחיקת הקבוצה · החזרת **204** (ללא body)
- [x] `leaveGroup` — חבר בלבד (אחרי `isGroupMember`)
  - הסרת `req.userId` מ-`members` ושמירה · 200
  - **חסימת יציאה של ה-admin** → 403 + הודעה ("admin must delete or transfer the group")
- [x] עיקרון קבוע: `adminId` נלקח מה-token בלבד — לעולם לא מ-body

### 2. חיווט Routes — `server/src/routes/group-routes.ts`

- [x] `PUT /:id` → `isGroupAdmin, updateGroup`
- [x] `DELETE /:id` → `isGroupAdmin, deleteGroup`
- [x] `POST /:id/leave` → `isGroupMember, leaveGroup`

> מפת ה-routes המלאה בסוף היום:
> `GET /` · `POST /` · `GET /:id` (member) · `PUT /:id` (admin) · `DELETE /:id` (admin) · `POST /:id/leave` (member)

### 3. חיווט app + טיפול בשגיאות — `server/src/app.ts`

- [x] לוודא ש-`/api/groups` מחובר (לשקול הסרת תנאי ה-`!isProduction` כך שיעבוד גם מעבר ל-dev)
- [x] טיפול עקבי ב-async errors בקונטרולרים (try/catch כל עוד אין error-middleware מרכזי של תמר)
- [x] status codes נכונים לאורך כל הזרימה: **200 / 201 / 204 / 400 / 403 / 404 / 500**

### 4. בדיקה ידנית (Thunder Client)

> שולחים את ה-header `X-Test-User-Id: <ObjectId תקין>` (stub auth עד שה-JWT של תמר ינחת).

- [x] CRUD מלא: `POST` (201) → `GET /` (רק שלי) → `GET /:id` → `PUT /:id` (200) → `DELETE /:id` (204)
- [x] `POST /:id/leave` ע"י חבר רגיל → 200 (הוסר מ-members)
- [x] ניסיון `leave` ע"י ה-admin → 403 (נחסם)
- [x] גישה/עדכון/מחיקה ע"י מי שאינו member/admin → 403
- [x] `:id` לא קיים → 404 · `:id` לא תקין → 400

---

## קריטריון "סיימתי"

- [x] שש פעולות ה-Groups עובדות מול ה-DB עם הרשאות נכונים
- [x] admin אינו יכול לצאת מהקבוצה (חייב למחוק) · משתמש זר מקבל 403
- [x] status codes תקינים (201/204/400/403/404)
- [x] `npm run lint` + `npm run typecheck` עוברים נקי

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה: יום 3 — Messages)
2. סמני ✓ את משימות יום 2 שהושלמו
3. Commit + push ל-`feature/groups`
