# מסמך עבודה — היום (חמישי 18/06/2026)

**ימים 6–7 מתוך 8 (דחוסים ליום אחד)** · שלב: **לקוח — Angular מקצה לקצה** · Slice: Groups + Messages/Chat (Primary: שושי), Auth/Profile (Secondary)
**מסמכים קשורים:** [work-plan.md](work-plan.md) · [work-shoshi-sefrai.md](work-shoshi-sefrai.md) · [work-tamar-zisman.md](work-tamar-zisman.md)

> **גישה:** השרת כבר עובד מקצה לקצה ובדוק (יום 5 ✅). היום עוברים **לצד לקוח** —
> ובוחרים לדחוס את **יום 6 (Groups + Auth)** ואת **יום 7 (Chat + Profile)** ליום אחד.
> המטרה: לסיים את כל ה-SPA היום, כך שמחר־מחרתיים (יום 8) נשארים רק Responsive + Docs + Demo.

> ⚠️ **עיצוב היום = בסיסי בלבד.** הפוקוס הוא על פונקציונליות מלאה (זרימות + חיבור לשרת),
> לא על מראה. מספיק Angular Material ברירת־מחדל + פריסה תקינה — בלי ליטוש צבעים, מרווחים,
> אנימציות או ריספונסיב מלוטש. **העיצוב הסופי ייעשה ביום נפרד** (במסגרת הגימור).

---

## למה לדחוס את שני הימים

כל שכבת הלקוח נשענת על אותו בסיס: `HttpClient` + interceptor שמצרף JWT, ניווט lazy,
ו-Signal stores. ברגע שמקימים את הבסיס הזה (Auth secondary), בניית Groups ו-Chat
הופכת לחזרה על אותו pattern (service + signal store → list → card/item → form).
לכן זרימה אחת רציפה — מ-Login דרך Groups ועד Chat real-time — חוסכת הקמות חוזרות
ומשאירה את יום 8 כולו לגימור.

---

## מטרת היום

להעמיד **לקוח Angular מלא ומחובר לשרת**: התחברות (Login + Guard + Interceptor),
ניהול קבוצות מלא (רשימה / יצירה / עריכה / מחיקה / יציאה), צ'אט בזמן אמת עם שליחת
טקסט וקבצים (תמונה / אודיו / PDF) ו-preview, ומסך פרופיל. בסוף היום אפשר לעבור את
כל הזרימה בדפדפן: **Login → רשימת קבוצות → יצירת/עריכת קבוצה → צ'אט real-time → פרופיל**.

|                   |                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Branch**        | `feature/client` (חדש — כל עבודת הלקוח של היום עליו)                                                                       |
| **לפני שמתחילים** | `git switch -c feature/client` (מבוסס על השרת המעודכן) · `nvm use` (Node 22 LTS) · `npm install` ב-`client/` · ודאי שהשרת רץ מקומית עבור בדיקות |
| **בסוף היום**     | `npm run lint` + `ng build` נקיים · `npm run test:ci` עובר · commit עם `feat:` · push ל-`feature/client` + PR             |

---

## נקודת פתיחה (מה כבר קיים בלקוח)

- `client/src/app/app.routes.ts` — רק `''` (agent-chat demo) ו-`debug`; **אין** routes ל-auth/groups/chat/profile ✓
- `client/src/app/app.config.ts` — `provideHttpClient()` **בלי** interceptors ✓
- `client/src/app/core/services/connection.service.ts` — Socket bootstrap קיים; **אין** auth-guard / auth-interceptor ✓
- `client/src/app/features/` — רק `agent` (demo) ו-`debug`; **אין** תיקיות `auth` / `groups` / `chat` / `profile` ✓
- השרת (REST + Socket.io) עובד מקצה לקצה ובדוק — הלקוח ניגש אליו דרך `env.clientOrigin` / API base ✓

---

## משימות היום (רשימה אחת רציפה)

### בסיס לקוח + Auth (Secondary — Auth עצמו של תמר)

- [x] `app.config.ts` — `provideHttpClient(withInterceptors([authInterceptor]))` + הגדרת API base
- [x] `core/interceptors/auth-interceptor.ts` — functional interceptor שמצרף JWT ל-headers
- [x] `core/guards/auth-guard.ts` — functional guard להגנה על routes פרטיים
- [x] `features/auth/login.ts` — Reactive Forms + validation, קריאה ל-`/api/auth/login`, שמירת token
- [x] Review: `register.ts` + `auth.ts` (Auth service + Signals של תמר) — נמשכו מ-feature/auth

### Groups (Primary שלך)

- [x] `features/groups/group.ts` — service + Signal store (רשימת קבוצות, CRUD, leave)
- [x] `features/groups/group-list.ts` — route `/groups` (`@for` + `track`, OnPush)
- [x] `features/groups/group-card.ts` — כרטיס קבוצה בודד (`input()`)
- [x] `features/groups/group-form.ts` — shared: `/groups/new` + `/groups/:id/edit` (Reactive Forms + validation)
- [x] Lazy routes ב-`app.routes.ts` (`loadComponent`) + הגנת `authGuard`

### Chat (Primary שלך)

- [x] `features/chat/message.ts` — service + Signal עם עדכוני real-time (`newMessage` / `messageUpdated` / `messageDeleted`)
- [x] `features/chat/chat-room.ts` — route `/groups/:id` + `joinGroup` / `leaveGroup` בכניסה/יציאה
- [x] `features/chat/message-list.ts` — רשימת הודעות (`@for` + `track`, גלילה)
- [x] `features/chat/message-form.ts` — שליחת טקסט + file picker + preview
- [x] File preview: image / audio player / PDF link + validation (סוג + גודל קובץ)
- [x] `socket.ts` + `message-item.ts` — נבנו כחלק מה-Chat slice

### Profile (Secondary שלך)

- [x] `features/profile/profile.ts` — route `/profile` + עדכון username
- [x] Group avatar URL field ב-`group-form.ts` (preview מובנה; upload מלא ביום 8)

### ניקיון וסגירה

- [x] `npm run lint` נקי + `ng build` עובר
- [x] `npm run test:ci` עובר (14/14)
- [ ] commit עם `feat:` (לקוח: Auth + Groups + Chat + Profile) · push ל-`feature/client` · פתיחת PR ל-review מתמר

---

## קריטריון "סיימתי"

- [x] Login עובד: התחברות שומרת JWT, ה-interceptor מצרף אותו, `authGuard` חוסם routes פרטיים
- [x] Groups: רשימה / יצירה / עריכה / מחיקה / יציאה מחוברים לשרת
- [x] Chat real-time: כניסה ל-`/groups/:id` מצרפת ל-room, Socket.io מנהל `newMessage` / `messageUpdated` / `messageDeleted`
- [x] שליחת קובץ (תמונה / אודיו / PDF) עם preview עובדת, validation חוסם סוג/גודל לא תקין
- [x] Profile: עדכון username מחובר, group avatar URL field
- [x] `npm run lint` + `ng build` + `npm run test:ci` (14/14) עוברים נקי — **הלקוח עובד מקצה לקצה** 🎯

---

## תזכורת סוף יום

1. עדכני את טבלת **סמן מיקום** ב-[work-shoshi-sefrai.md](work-shoshi-sefrai.md) (תאריך + משימה הבאה: **יום 8 — גימור: Responsive mobile + Docs + Demo + PR סופי**) — שימי לב שדילגנו על מסמך נפרד ליום 7.
2. סמני ✓ את משימות ימים 6+7 שהושלמו (גם בקובץ האישי).
3. Commit + push ל-`feature/client` + PR — שלב הלקוח נסגר, מחר־מחרתיים רק גימור (יום 8).
