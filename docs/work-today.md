# מסמך עבודה — היום (חמישי 11/06/2026)

**יום 1 מתוך 8** · שלב: **שרת — Groups** · Slice: Groups (Primary: שושי)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** קודם השרת מקצה לקצה (API + DB + Socket), ורק אז הלקוח.
> היום בונים את שכבת ה-Groups בשרת מעל המודל שכבר קיים.

---

## מטרת היום

לסיים את **middleware של הרשאות הקבוצה** + **שלוש הפעולות הראשונות** ב-group-controller,
מעל `group-model.ts` שכבר מוכן (`findForUser`, `validateGroup`, `pre('save')` שמוסיף את היוצר ל-members).

| | |
|---|---|
| **Branch** | `feature/groups` |
| **לפני שמתחילים** | `nvm use` (Node 22 LTS) · `npm install` ב-`server/` |
| **בסוף היום** | `npm run lint` נקי · commit עם `feat:` · push |

---

## משימות היום

### 1. Middleware הרשאות — `server/src/middleware/group-middleware.ts`
- [ ] `isGroupMember` — טוען את הקבוצה לפי `req.params.id`, מאמת שה-userId מה-token נמצא ב-`members`
  - 404 אם הקבוצה לא קיימת · 403 אם המשתמש אינו חבר
- [ ] `isGroupAdmin` — מאמת שה-userId מה-token שווה ל-`adminId` של הקבוצה
  - 404 אם לא קיימת · 403 אם אינו מנהל
- [ ] לצרף את מסמך הקבוצה ל-`req` (למשל `req.group`) כדי לא לטעון פעמיים בקונטרולר

### 2. Group Controller (התחלה) — `server/src/controllers/group-controller.ts`
- [ ] `getMyGroups` — `Group.findForUser(userId)` (ה-static הקיים), userId מה-token
- [ ] `createGroup` — `validateGroup` (Joi, `stripUnknown`), `adminId` מה-token בלבד (לא מ-body)
  - מחזיר 201 עם הקבוצה שנוצרה (היוצר נכנס ל-members אוטומטית דרך ה-`pre('save')`)
- [ ] `getGroupById` — מחזיר קבוצה בודדת (אחרי `isGroupMember`), 404 אם לא קיימת

### 3. בדיקה ידנית מהירה (Thunder Client)
- [ ] `POST /api/groups` → 201 + היוצר ב-members
- [ ] `GET /api/groups` → מחזיר רק קבוצות שאני חבר בהן
- [ ] גישה לקבוצה של מישהו אחר → 403

> הראוטר עצמו (`group-routes.ts`) + חיבור ב-`app.ts` תחת `/api/groups` מתוכננים **למחר (יום 2)**.
> אם נשאר זמן — אפשר לחווט ראוטר זמני מינימלי כדי לבדוק את ה-3 פעולות מעל.

---

## קריטריון "סיימתי"

- [ ] `isGroupMember` + `isGroupAdmin` מחזירים 403/404 נכונים
- [ ] `getMyGroups` / `createGroup` / `getGroupById` עובדים מול ה-DB
- [ ] `adminId` נלקח מה-token בלבד — לא ניתן לזייף מ-body
- [ ] `npm run lint` עובר נקי

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה)
2. סמני ✓ את משימות יום 1 שהושלמו
3. Commit + push ל-`feature/groups`
