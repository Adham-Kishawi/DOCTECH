# DOCTECH — خطة إصلاح المشروع والتحويل إلى CRM طبي
# DOCTECH — Remediation & Medical-CRM Conversion Master Plan

> **الحالة:** وثيقة تخطيط وتنفيذ. كل بند فيها مرتبط بمسار ملف حقيقي في الكود الحالي.
> **الهدف النهائي:** نظام إدارة عيادات متعدد المستأجرين يعمل على قاعدة بيانات حقيقية، آمن، مُختبر،
> ومُحوَّل إلى **CRM طبي** يغطي دورة حياة المريض كاملة (من أول استكشاف → المتابعة → إعادة التنشيط → تعظيم القيمة)
> وليس مجرد نظام حجز مواعيد.

> **قاعدة القراءة:** `file:line` تعني مرجع حقيقي في الكود الحالي.

---

## 📑 فهرس المحتويات

| # | القسم |
|---|---|
| [0](#0-ملخص-تنفيذي) | ملخص تنفيذي |
| [1](#1-تشخيص-الحالة-الحالية-حقيقة-الكود-لا-الوثائق) | تشخيص الحالة الحالية |
| [2](#2-المرحلة-0--الإصلاحات-الحرجة-p0) | المرحلة 0 — الإصلاحات الحرجة (P0) |
| [3](#3-البنية-التقنية-المرحلية--data-layer) | البنية التقنية المرحلية |
| [4](#4-تصميم-نموذج-البيانات-crm-الطبي) | نموذج بيانات CRM الطبي |
| [5](#5-الطبقة-المالية-المصروفات-ثابتة-متغيرة) | الطبقة المالية (ثابتة/متغيرة) |
| [6](#6-الصلاحيات-و-rbac-التنفيذ-الحقيقي) | الصلاحيات و RBAC |
| [7](#7-محرك-الجدولة-ومنع-الازدواجية) | محرك الجدولة |
| [8](#8-طبقة-crm-الت.Customer-Lifecycle) | طبقة CRM ودورة حياة العميل |
| [9](#9-الواجهات-والصفحات-المطلوبة) | الواجهات والصفحات |
| [10](#10-الواتساب-والذكاء-الاصطناعي) | الواتساب والذكاء الاصطناعي |
| [11](#11-العربية-والـ-rtl-والنصوص) | العربية و RTL والنصوص |
| [12](#12-الاختبارات-والجودة) | الاختبارات والجودة |
| [13](#13-النشر-والإنتاج) | النشر والإنتاج |
| [14](#14-خارطة-التنفيذ-المراحل) | خارطة التنفيذ |
| [15](#15-ملحق-جدول-التدقيق-الكامل) | ملحق جدول التدقيق |

---

<a id="0-ملخص-تنفيذي"></a>
## 0. ملخص تنفيذي

### المشكلة الجوهرية
المشروع **واجهة أنيقة فوق أساس غير مكتمل**. التقييم الحقيقي:

| الطبقة | النسبة الحقيقية | الحكم |
|---|---|---|
| واجهة المستخدم (UI/UX) | ~90% | ممتاز — مفيش إعادة كتابة |
| قاعدة البيانات | ~30% | 7 جداول من 14 مستخدمة فعليًا، صفر migrations |
| المصادقة والصلاحيات | ~40% | Clerk شغال، لكن الصلاحيات **ديكورية تمامًا** |
| الجدولة | ~35% | قراءة المواعيد تعمل، لكن **لا يوجد منع ازدواجية حقيقي** |
| EMR السريري | ~10% | **لا يوجد** — كل التفاصيل السريرية داخل مكونات React |
| CRM | **0%** | غير موجود نهائيًا |
| الأمان | ~25% | فجوات حرجة مفتوحة |

### ثلاث حقائق يجب فهمها قبل البدء

1. **`prisma/schema.prisma` كود ميت تمامًا.** صفر استيراد لـ `PrismaClient` في أي مكان. المخطط الفعلي هو `pg` DDL في `app/api/admin/setup-doctech/route.ts:51-143` (7 جداول فقط). الـ schema الـ Prisma (460 سطر) هو **توثيق غير متصل بالواقع**.
2. **المخطط غير مكتمل ويستخدم جداول غير موجودة.** `doctor_schedules` و `internal_messages` تُقرأ وتُكتب في 6 أماكن لكن **غير موجودة في الـ DDL إطلاقًا**. أي أن الجدولة والمحادثات الداخلية **معطّلة بالكامل في الإنتاج** حتى تُنشأ الجداول.
3. **الصلاحيات غير مُنفّذة إطلاقًا.** `permissions` تُخزَّن وتُعرض كـ chips تجميلية فقط. لا يوجد أي `hasPermission()` في المشروع، والسايد بار يعرض كل الأقسام لـ secretary حتى لو كان `permissions: []`.

### لماذا CRM وليس نظام عيادات عادي؟
نظام العيادات الحالي = **تشغيل** (حجز، تحصيل، جدولة، محادثات).
CRM = **علاقة ورقم أعمال**: من أين جاء المريض، لماذا رجع، لماذا لم يعد، كم يساوي على مدى عمره، ومتى نُعيد تنشيطه.
**هذه الطبقة غائبة تماماً**، وهي أعلى جزء في قيمة المنتج commercial-wise.

---

<a id="1-تشخيص-الحالة-الحالية-حقيقة-الكود-لا-الوثائق"></a>
## 1. تشخيص الحالة الحالية (حقيقة الكود لا الوثائق)

### 1.1 تعارض الوثائق مع الواقع

| ما تقوله الوثائق | الواقع في الكود |
|---|---|
| "Multi-Tenancy مع Row-Level isolation" | **لا يوجد RLS policy واحد.** لا يوجد ملف `.sql` واحد في المشروع. لا يوجد مجلد `supabase/`. لا يوجد `prisma/migrations`. |
| "Prisma + Supabase" | Prisma غير مستخدم. `schema.prisma` كود ميت. |
| "EMR: chronicle conditions + drug allergies" | **غير موجود كبيانات.** لا يوجد عمود في أي جدول. كل النصوص داخل JSX في `components/patients/PatientTimeline.tsx`. |
| "الأمراض المزمنة قابلة للتعديل" | لا يوجد endpoint يحفظها. |
| "FileUploader: Drag & Drop رفع أشعة وروشتات" | `patient_attachments.file_url` **نص فقط**. **صفر استخدام لـ `supabase.storage`** في المشروع كله. الرافع يطلب رابطًا ولا يرفع ملفًا. `fileSize: "2.1 MB"` ثابتة. |
| "بيانات دخول تجريبية `password123`" | **غير موجودة في الكود.** كلمة المرور الحقيقية في `setup-doctech/route.ts:169`: `DoctorTech@2026!`. |
| "IsRecurring: مصروف شهري متكرر (دوري) — يتم إدراجه تلقائياً كل شهر" | **لا شيء يُدرَج تلقائياً.** `is_recurring` boolean يُخزَّن ويُعرض كـ badge نصي فقط (`doctor/finance/page.tsx:821-825`). |
| "0 أخطاء TypeScript" | صحيح، لكنه لا يعني جاهزية الإنتاج. |

### 1.2 جداول الداتابيز الحقيقية (DDL هو المصدر الوحيد للحقيقة)

من `app/api/admin/setup-doctech/route.ts:51-143` — **هذه هي كل الجداول الموجودة**:

| # | الجدول | ملاحظات |
|---|---|---|
| 1 | `reports` | ✅ موجود |
| 2 | `expenses` | ⚠️ `amount DOUBLE PRECISION` — **فلوت نقدي** |
| 3 | `payment_transactions` | ⚠️ `amount DOUBLE PRECISION` — **فلوت نقدي** |
| 4 | `patient_attachments` | ⚠️ `file_url TEXT` بدون حجم/نوع تخزين |
| 5 | `notifications` | ⚠️ **بلا عمود `role`** لكن الكود يُمرر `role` |
| 6 | `whatsapp_conversations` | ⚠️ **لا يقرأه ولا يكتبه أي كود تشغيلي** (فقط DDL) |
| 7 | `whatsapp_messages` | ⚠️ نفس الملاحظة |

**جداول يستخدمها الكود لكنها غير منشأة (معطّلة الآن):**

| الجدول | يُستخدم في |
|---|---|
| `doctor_schedules` | `availabilityService.ts:60`، `appointments/route.ts:167`، `doctor/profile/route.ts:38`، `onboarding/doctor/route.ts:147` |
| `internal_messages` | `messages/route.ts:64,136,180`، `dataService.ts:151,234,323` |
| `clinics` | كل مكان |
| `doctors` / `secretaries` | كل مكان |
| `patients` / `appointments` | كل مكان |
| `appointment_types` | `appointment-types/route.ts` |

> **خلاصة:** الجدولة في `doctor/schedule/settings` والمحادثات الداخلية **لا تعمل على قاعدة بيانات حالية**.

### 1.3 الأخطاء الحرجة المكتشفة (مرقّمة للرجوع إليها)

| # | الخطأ | الموقع | الأثر |
|---|---|---|---|
| **E1** | Webhook لا يتحقق من `X-Hub-Signature` في POST | `app/api/whatsapp/webhook/route.ts` | **ثغرة أمنية حرجة** — أي حد يبعت رسائل على خط العيادة عند إضافة المفاتيح |
| **E2** | `NODE_TLS_REJECT_UNAUTHORIZED = "0"` | `setup-doctech/route.ts:28` + `ssl:{rejectUnauthorized:false}` `:40` | تعطيل تحقق TLS |
| **E3** | كلمة مرور ديمو مكشوفة في كود الاستجابة | `setup-doctech/route.ts:169,451` | تسريب credential عبر HTTP response |
| **E4** | Route تهيئة قاعدة البيانات متاح بـ GET بدون auth | `setup-doctech/route.ts:8` | أي حد ينفّذ DDL على الإنتاج |
| **E5** | `DELETE /api/finance/expenses` بلا أي auth | `finance/expenses/route.ts:147-165` | حذف مصروفات أي عيادة |
| **E6** | `?clinicId=` يقبل من العميل كـ fallback | عدة routes | **تجاوز عزل المستأجرين** |
| **E7** | لا يوجد index فريد يمنع الحجز المزدوج | لا شيء | **Double-booking مضمون تحت التزامن** |
| **E8** | لا يوجد `permissions` في `getClinicSession()` | `lib/clinicAuth.ts:46` | مستحيل فرض أي صلاحية |
| **E9** | مصروفات السكرتيرة بـ `doctor_id = null` | `finance/expenses/route.ts:86` | **كل مصروفات السكرتيرة مخفية عن P&L الطبيب** |
| **E10** | تقسيم P&L revenues ثابت 65/22/13 | `ProfitLossStatement.tsx:109,117,125` | **بيانات مالية مختلقة** |
| **E11** | `LAB` غير محسوب في P&L | `ProfitLossStatement.tsx:28-35` | البنود لا تطعم الإجمالي |
| **E12** | `titleAr = title` و `patientNameAr = name` | `ExpenseModal.tsx:49-50`، `transactions/route.ts:65` | **العربية = الإنجليزية** |
| **E13** | قسمة على صفر في بطاقة المصروفات | `doctor/finance/page.tsx:446` | عرض `NaN%` |
| **E14** | `(totalExpenses / grossRevenue) * 100` بلا guard | `doctor/finance/page.tsx:446` | نفس E13 |
| **E15** | مصروف doctor له id مختلف عن اللي في السيرفر | `page.tsx:203` vs `route.ts:80` | **الحذف بعد الإضافة يفشل بصمت** |
| **E16** | إيرادات doctor اليدوية تضيع | `doctor/finance/page.tsx:303-307` | لا `patientId`/`appointmentId` → FK يفشل → `console.warn` |
| **E17** | التعديل والحذف في صفحة الفريق غير منفّذين | `team/page.tsx:470,486` | لا يمكن سحب صلاحية ممنح |
| **E18** | مطابقة الأوقات بخادم ≠ توقيت العيادة | `availabilityService.ts:114-115` | **حسابات الحجز خاطئة** |
| **E19** | `PENDING_REVIEW` يحجز slot للأبد | `availabilityService.ts:97-98` | طابور واتساب معلّق يسرق مواعيد |
| **E20** | لا يوجد ترقيم فواتير متسلسل | لا شيء | لا يوجد invoice حقيقي |
| **E21** | لا يوجد خصم ولا استرداد | لا شيء | `REFUNDED` معرّف في enum وغير مستخدم |
| **E22** | 4 قوائم مختلفة لتصنيف المصروف | 4 ملفات | تضارب في التسميات |
| **E23** | `"cln-001"` ثابت كـ fallback | 10 مواضع | تسريب بيانات بين العيادات |
| **E24** | `BroadcastChannel` واحد عالمي | `realtimeService.ts:26` | كل تبويبات كل العيادات تشترك |
| **E25** | `types/index.ts` شبه ميت | 15 تعريف | 3 أنظمة أنواع متوازية |

---

<a id="2-المرحلة-0--الإصلاحات-الحرجة-p0"></a>
## 2. المرحلة 0 — الإصلاحات الحرجة (P0)

> **هذه المرحلة لا تقبل تأجيل.** أي منها يمنع النشر للإنتاج. **لا تبدأ تحويل CRM قبل إنهائها.**

### P0.1 — أمان الـ Webhook (E1)

**الملف:** `app/api/whatsapp/webhook/route.ts`

المشكلة: فرع GET يتحقق من `hub.verify_token` بشكل صحيح، لكن فرع POST — الذي يستدعي `processHermesMessage()` ويرسل ردود فعلية — **لا يتحقق من توقيع Meta إطلاقًا**. صفر استخدام لـ `createHmac` / `timingSafeEqual` في المشروع كله.

**الحل:**
```
أضف متغير بيئة: WHATSAPP_APP_SECRET
في فرع POST:
  1. اقرأ X-Hub-Signature-256 من الهيدر
  2. اقرأ body الخام كنص (Text, وليس JSON.parse — الـ hash على البايتات الخام)
  3. expected = "sha256=" + createHmac("sha256", APP_SECRET).update(rawBody).digest("hex")
  4. قارن بـ timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  5. أي اختلاف → 401 فورًا قبل أي معالجة
```
**ملاحظة:** يجب تغيير توقيع `POST(request)` ليستقبل raw body. في Next.js Route Handler يمكن استخدام `await request.text()` ويُحفظ كما هو دون تعديل.
**تحقق:** `curl` بدون توقيع → 401. بتوقيع خاطئ → 401. بتوقيع صحيح → 200.

### P0.2 — إغلاق/setup endpoint (E2, E3, E4)

**الملف:** `app/api/admin/setup-doctech/route.ts`

| التعديل | التفصيل |
|---|---|
| احمِ الـ endpoint | غيّر `export async function GET` (`:8`) إلى `POST` + تحقق من `ADMIN_SETUP_SECRET` header. |
| احذف TLS override | احذف `:28` و `:40`. استخدم cert صحيح من Supabase. |
| احذف كلمة المرور من الـ response | `:451` يعيد `password: doctorPassword`. احذفها تمامًا. |
| انقل الـ seed | لا تنشئ بيانات ديمو في مسار الإنتاج. اعمله seed منفصل. |
| لا تشغّل على production | أضف guard: `if (process.env.NODE_ENV === "production") return 403` إلا بـ secret. |

### P0.3 — إجبار المصادقة والصلاحيات (E5, E6, E8)

**إنشاء `lib/apiAuth.ts` — طبقة إجبار مركزية:**
```ts
//Pseudo-code for the guard used by every protected route
export async function requireSession(role?: "doctor" | "secretary") {
  const session = await getClinicSession();      // يرجع null إذا لا session
  if (!session) throw new ApiError(401, "Unauthorized");
  if (role && session.role !== role) throw new ApiError(403, "Forbidden");
  return session;
}
```

**قواعد إجبار:**
1. **كل API route** يبدأ بـ `const session = await requireSession()`.
2. **احذف كل** `?clinicId=` كـ fallback. الـ `clinicId` **يُشتق من الجلسة فقط**: `session.clinicId`.
3. **`finance/expenses` DELETE** → يتحقق من `clinicId` من الجلسة قبل الحذف.
4. **`getClinicSession()` يُحدّث ليجلب `permissions`:** أضف `"permissions"` لـ select في `clinicAuth.ts:46`.
5. **أضف `requirePermission(key)`** يُستخدم في كل route له صلاحية.

### P0.4 — منع الازدواجية الحقيقي (E7, E18, E19)

**الملفات:** `app/api/appointments/route.ts`، `lib/schedule/availabilityService.ts`

المشكلة الحالية: لا يوجد أي قيد في قاعدة البيانات. الفحص في `availabilityService.ts:111-120` هو **قراءة فقط** لعرض السلاوت. لو طلبين وصلوا في نفس اللحظة، كلاهما سيُحجز.

**الحل الصحيح — قيد على مستوى قاعدة البيانات:**
```
أضف للجدول appointments:
  - عمود appointment_start ( timestamptz )
  - عمود appointment_end   ( timestamptz )
  - Exclusion constraint على (doctor_id WITH =, tstzrange(appointment_start, appointment_end) WITH &&)
    WHERE status IN ('SCHEDULED','CONFIRMED')
```
هذا يجعل الازدواجية **مستحيلة** حتى تحت التزامن، لا مجرد احتمال.

**إصلاح المقارنة الزمنية (E18):**
السيرفر يعمل بـ UTC. `availabilityService.ts:114-115` يستخدم `appointmentDate.getHours()` = توقيت السيرفر. لكن الـ slots مبنية على wall-clock العيادة.
- أضف `clinic.timezone` (IANA، افتراضي `Africa/Cairo`).
- خزّن المواعيد كـ `timestamptz` UTC.
- كل المقارنات والتوليد يتم في `clinic.timezone` عبر مكتبة(date-fns-tz أو ما شابه).

**معالجة `PENDING_REVIEW` (E19):**
- أضف `expires_at` لطلب الحجز المعلّق (افتراضي 24 ساعة).
- `PENDING_REVIEW` **يحجز مؤقتاً** — أظهره كـ "soft hold" بلون مختلف.
- عند `expires_at` يُحرَّر تلقائياً (أضفه لفلتر في الفحص).

### P0.5 — احذف الكود الميت (E25)

احذف `prisma/schema.prisma` كـ source of truth. إمّا:
- **خيار A (موصى به):** اعتمد على `prisma` فعلياً — انقل الـ DDL لـ `prisma/schema.prisma` كاملاً وأضف migrations حقيقية، وحوّل الـ reads للـ Prisma client.
- **خيار B:** احذف مجلد `prisma` بالكامل ووعّش على Supabase REST + SQL migrations (`supabase/migrations/*.sql`).

> **توصيتي: خيار B.** المشروع أصلاً REST-based، و Supabase يعطيك RLS مجاناً وهو ما نحتاجه للـ multi-tenancy. Prisma لا يتعايش مع RLS بدون تعقيد.

**احذف أيضاً:**
- `stores/authStore.ts` كاملاً (session وهمية في localStorage تتعارض مع Clerk).
- `scripts/*.mjs` الـ 20 ملف (trasmigration history — انقلها لـ `scripts/archive/` أو احذف).
- `types/index.ts` الميت، واستبدله بنظام types واحد.

---

<a id="3-البنية-التقنية-المرحلية--data-layer"></a>
## 3. البنية التقنية المرحلية — Data Layer

### 3.1 Adopt SQL migrations (Supabase CLI)

أضف `supabase/migrations/` مع migrations حقيقية بدل DDL في route.

**أول migration — تصحيح الجداول الحالية:**

| التعديل | السبب |
|---|---|
| `expenses.amount DOUBLE PRECISION` → `BIGINT` (قروش) | **الفلوت غير صالح محاسبياً.** `0.1 + 0.2 !== 0.3`. |
| `payment_transactions.amount DOUBLE PRECISION` → `BIGINT` | نفس |
| أضف `expenses.invoice_ref` مع **unique** | ترقيم متسلسل (E20) |
| أضف `notification.role` | الكود يُمرره والجدول لا يقبله |
| أنشئ `doctor_schedules` | الجدولة معطّلة |
| أنشئ `internal_messages` | المحادثات معطّلة |
| أنشئ `clinics`, `doctors`, `secretaries`, `patients`, `appointments`, `appointment_types` | DDL لا ينشئها |
| أنشئ `whatsapp_conversations`, `whatsapp_messages` indexes | لا يقرؤهما الكود |

**تحويل النقود:** كل مبلغ في القاعدة = **قروش (integer)**. `/100` فقط عند العرض.
```ts
// lib/money.ts
export const toPiastres = (egp: number): number => Math.round(egp * 100);
export const fromPiastres = (piastres: number): number => piastres / 100;
export const formatMoney = (piastres: number, locale: Locale): string =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency", currency: "EGP", minimumFractionDigits: 2,
  }).format(fromPiastres(piastres));
```

### 3.2 RLS — عزل المستأجرين (ضروري للـ SaaS)

بدون RLS، الـ multi-tenancy **غير حقيقي**. استراتيجيتان متكاملتان:

**طبقة 1 — RLS Policies (الخط الدفاعي الأول):**
```sql
-- مثال على secretaries
ALTER TABLE secretaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secretaries_own_clinic" ON secretaries
  FOR ALL
  USING (
    clinic_id = (
      SELECT c.id FROM clinics c
      JOIN doctors d ON d.clinic_id = c.id
      WHERE d.clerk_user_id = auth.jwt() ->> 'sub'
      UNION
      SELECT c.id FROM clinics c
      JOIN secretaries s ON s.clinic_id = c.id
      WHERE s.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );
```
**طبقة 2 — service role في السيرفر:** `supabaseAdmin` (service role) يتجاوز RLS، لذلك **كل فحص الصلاحية والتحقق يجب أن يكون في كود السيرفر** — RLS هي شبكة أمان لا بديل عن التحقق البرمجي.

**جداول تحتاج RLS:** `clinics`, `doctors`, `secretaries`, `patients`, `appointments`, `reports`, `expenses`, `payment_transactions`, `notifications`, `internal_messages`, `patient_attachments`, `doctor_schedules`.

### 3.3 حذف ambiguities في البيانات التجريبية (E23)

احذف كل `"cln-001"` و `"org_doctech_demo"` و `"doc-doctech-demo"`.
- الـ clinic id **يأتي من الجلسة فقط**.
- البيانات التجريبية تُزرع في **seed منفصل** (`supabase/seed.sql`) ولا تُستدعى تلقائياً.

---

<a id="4-تصميم-نموذج-البيانات-crm-الطبي"></a>
## 4. نموذج البيانات — CRM الطبي (Medical CRM Domain Model)

### 4.0 الفلسفة: ما الذي يجعل DOCTECH "CRM" وليس "نظام عيادات"؟

| نظام العيادات الحالي (Transactional) | CRM الطبي (Relationship) |
|---|---|
| "موعد يوم الثلاثاء 10:30" | "ملف مريض عمره 3 سنوات، 8 زيارات، إنفاق 4200 EGP، آخر زيارة منذ 4 شهور، ضغطه مرتفع" |
| سجل الحجز | **قيمة المريض على مدى العمر (LTV)** |
| تسجيل دفعة | **تنبؤ بالإيراد** |
| قائمة مرضى | **شرائح (segments): داكر، ضغط، نساء، أطفال** |
| — | **حملة كمسح** + **معدل رجوع (retention)** + **كشف خامل (churn risk)** |

**القاعدة:** كل كيان جديد يجب أن يخدم سؤالاً تجارياً: *من أين جاء؟ هل رجع؟ لماذا؟ كم يساوي؟ متى أُعيد تنشيطه؟*

---

### 4.1 الطبقة السريرية — Clinical Foundation (EMR حقيقي)

> هذه الكيانات **مفقودة تماماً**. كل التفاصيل السريرية حالياً داخل JSX فقط.

#### 4.1.1 `encounters` (الزيارة السريرية — الـ Encounter)
الوحدة الذرّية الحقيقية. كل كشف = سطر واحد.Writable.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK → clinics` | **مطلوب — عزل** |
| `patient_id` | `TEXT FK → patients` | |
| `doctor_id` | `TEXT FK → doctors` | |
| `appointment_id` | `TEXT FK → appointments` nullable |nullable إذا بدون موعد |
| `encounter_type` | `ENUM` | `CONSULTATION`, `FOLLOW_UP`, `PROCEDURE`, `EMERGENCY`, `TELEHEALTH`, `HOME_VISIT` |
| `encounter_date` | `TIMESTAMPTZ` | |
| `chief_complaint` | `TEXT` | **الشكوى الرئيسية — بالعربي أو الإنجليزي** |
| `history` | `TEXT` | التاريخ المرضي |
| `examination` | `TEXT` | الفحص السريري |
| `diagnosis_summary` | `TEXT` | |
| `plan` | `TEXT` | خطة العلاج |
| `status` | `ENUM` | `DRAFT`, `SIGNED`, `AMENDED` |
| `signed_at` | `TIMESTAMPTZ` nullable | **التوقيع الطبي = سند قانوني** |
| `created_by_role` | `ENUM` | `doctor`, `secretary` |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

**لماذا مهم:** يحل محل `lib/doctor/historyData.ts` (mock) و`reports` (الذي Currently يخلط triage مع سريري). **الـ Triage (فرز) ≠ الـ Encounter (سجل سريري)** — يجب فصلهما.

#### 4.1.2 `diagnoses` (التشخيصات — ICD-10)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `encounter_id` | `TEXT FK → encounters` | |
| `clinic_id` | `TEXT FK` | عزل |
| `icd10_code` | `TEXT` | **كود ICD-10** (مثل `E11.9` diabetes) |
| `code_description` | `TEXT` | |
| `diagnosis_type` | `ENUM` | `PRIMARY`, `SECONDARY`, `Differential`, `COMPLICATION` |
| `is_chronic` | `BOOLEAN` | **هل يتحول لمزمن؟** |
| `onset_date` | `DATE` nullable | |
| `resolved_date` | `DATE` nullable | nullable = ما زال نشط |

**قيمة CRM:** بمرور الوقت يبني **سجل مرضى مزمن تلقائي** = مؤشر صحة العيادة ومحتوى للتسويق.

#### 4.1.3 `patient_chronic_conditions` (الأمراض المزمنة المستمرة)

> يعالج misrepresentation في README ("الأمراض المزمنة قابلة للتعديل").

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `icd10_code` / `name_en` / `name_ar` | `TEXT` | |
| `diagnosed_on` | `DATE` | |
| `status` | `ENUM` | `ACTIVE`, `IN_REMISSION`, `RESOLVED` |
| `monitoring_notes` | `TEXT` | |

#### 4.1.4 `patient_allergies` (الحساسية الدوائية — **سلامة Marquis**)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `substance` | `TEXT` | مثال: Penicillin |
| `allergy_type` | `ENUM` | `DRUG`, `FOOD`, `ENVIRONMENT`, `OTHER` |
| `severity` | `ENUM` | `MILD`, `MODERATE`, `SEVERE`, `ANAPHYLAXIS` |
| `reaction` | `TEXT` | ⚠️ **ضروري طبياً** |

**⚠️ الميزة الحاسمة:** عند إنشاء وصفة، النظام **يجب** يحذّر: "المريض حساس من X". هذا مفيش اليوم.

#### 4.1.5 `prescriptions` + `prescription_items`

**`prescriptions`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` / `encounter_id` | `TEXT FK` | |
| `issued_date` | `DATE` | |
| `valid_until` | `DATE` | **تاريخ انتهاء — ضروري** |
| `notes` | `TEXT` | تعليمات عامة |
| `status` | `ENUM` | `ACTIVE`, `COMPLETED`, `CANCELLED` |

**`prescription_items`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `prescription_id` | `TEXT FK` | |
| `drug_name_ar` | `TEXT` | ⚠️ **مطلوب — الدواء بالعربي** |
| `drug_name_en` | `TEXT` | |
| `dosage` | `TEXT` | مثال: "500 mg" |
| `frequency` | `TEXT` | مثال: "كل 8 ساعات" |
| `duration_days` | `INT` | |
| `route` | `ENUM` | `ORAL`, `IV`, `IM`, `TOPICAL`, `INHALATION`, `SUPPOSITORY` |
| `instructions` | `TEXT` | "بعد الأكل" |

> **ملاحظة:** نفس الـ Validation pasan على `prescription_items`: **لا تأخذ دواء حساس منه** (يربط بـ `patient_allergies`).

#### 4.1.6 `vital_readings` (العلامات الحيوية — **قابلة للبحث**)

> حالياً العلامات الحيوية داخل `PatientTimeline.tsx` كنص. تكون جدول.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` / `encounter_id` | `TEXT FK` | |
| `measured_at` | `TIMESTAMPTZ` | |
| `systolic` / `diastolic` | `INT` nullable | الضغط |
| `pulse` | `INT` nullable | |
| `temperature_c` | `DECIMAL(4,1)` nullable | |
| `blood_sugar` | `DECIMAL(5,1)` nullable | |
| `spo2` | `INT` nullable | |
| `weight_kg` / `height_cm` | `DECIMAL` nullable | |

**قيمة CRM:** رسم بياني untuk ضغط مريض على 5 سنوات → **أداة امتناع ممتاز** والمرضى يحبون يشوفوها.

#### 4.1.7 `lab_orders` + `lab_results` (التحاليل)

**`lab_orders`:** (طلب التحليل)
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` / `encounter_id` | `TEXT FK` | |
| `test_name_en` / `test_name_ar` | `TEXT` | |
| `ordered_on` | `DATE` | |
| `lab_vendor` | `TEXT` | المعمل المرسل |
| `cost` | `BIGINT` (قروش) | **تكلفة للتحليل — مهمة لحساب التكلفة** |
| `status` | `ENUM` | `ORDERED`, `SENT`, `IN_PROGRESS`, `RECEIVED`, `CANCELLED` |

**`lab_results`:** (نتيجة التحليل)
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `lab_order_id` | `TEXT FK` | |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `test_code` | `TEXT` | مثال: `WBC` |
| `value` | `DECIMAL` nullable | |
| `unit` | `TEXT` | |
| `ref_low` / `ref_high` | `DECIMAL` nullable | ⚠️ **المعدل الطبيعي — لكشف الشذوذ** |
| `is_abnormal` | `BOOLEAN` | **محسوب — يحدد الشذوذ** |
| `received_at` | `TIMESTAMPTZ` | |

**قيمة CRM:** ملف التحاليل PDF لمريض يسأل "هل تحاليلك جاهزة؟" يصبح **قابل للبحث**، ويستطيع الطبيب **مقارنة نتيجة اليوم بنتيجة الشهر الماضي**.

#### 4.1.8 `imaging_studies` (الأشعة)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` / `encounter_id` | `TEXT FK` | |
| `modality` | `ENUM` | `XRAY`, `CT`, `MRI`, `ULTRASOUND`, `MAMMOGRAPHY` |
| `body_part` | `TEXT` | |
| `findings` | `TEXT` | |
| `radiologist_name` | `TEXT` | |
| `report_url` | `TEXT` | رابط PDF |
| `performed_on` | `DATE` | |

#### 4.1.9 — تفصيل `patient_attachments` الحالي (إصلاح الفجوة)

المشكلة: `file_url` نص فقط، **صفر استخدام لـ `supabase.storage`**.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `storage_path` | `TEXT` | **مسار Supabase Storage** (ليس URL) |
| `storage_bucket` | `TEXT` | افتراضي `patient-files` |
| `file_size_bytes` | `BIGINT` | **حقيقي — يحل محل `fileSize: "2.1 MB"` الثابت** |
| `mime_type` | `TEXT` | |
| `sha256_hash` | `TEXT` | **لمنع التكرار** |
| `uploaded_by` | `TEXT FK` | من رفع الملف |
| `is_confidential` | `BOOLEAN` | **ملف محمول — حتى لا يظهر في massages** |

**المطلوب:** إنشاء bucket في Supabase Storage + **signed URLs** للوصول إليها. **لا تخزّن رابطاً دائماً** — signed URL صالح محدود المدة.

---

### 4.2 طبقة الـ CRM — Relationship Layer (الجديد بالكامل)

#### 4.2.1 `patient_lifecycle_stage` — دورة حياة المريض

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `stage` | `ENUM` | انظر أدناه |
| `changed_at` | `TIMESTAMPTZ` | |
| `changed_by` | `TEXT FK` | |
| `reason` | `TEXT` | **لماذا تغيّرت المرحلة؟ مهم للتحليل** |

**`stage` enum:**
| القيمة | المعنى | شرط الدخول التلقائي |
|---|---|---|
| `LEAD` | مهتم لم يصبح مريضاً | من واتساب/إعلان، بلا أول زيارة |
| `NEW` | أول زيارة مكتملة | أول `encounter` مدفوعة |
| `ACTIVE` | visiting بانتظام | زيارة خلال 90 يوم |
| `AT_RISK` | كان منتظم وبيبعد | آخر زيارة > 90 يوم + كان `ACTIVE` |
| `DORMANT` | خامل | آخر زيارة > 180 يوم |
| `LOST` | غادر | صريح أو > 365 يوم |
| `WIN_BACK` | نعيد تنشيطه | في حملة إعادة |

#### 4.2.2 `leads` (العملاء المحتملون — قبل أن يكونوا مرضى)

> **هذا أهم ما هو مفقود.** اليوم الترشيح عبر واتساب يذهب مباشرة لـ `patients`.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `full_name` / `phone` / `email` | `TEXT` | `phone` مفتاح البحث |
| `source` | `ENUM` | `WHATSAPP`, `INSTAGRAM`, `FACEBOOK`, `REFERRAL`, `WALK_IN`, `GOOGLE`, `MARHAM`, `OTHER` |
| `referred_by_patient_id` | `TEXT FK` nullable | **تتبع الإحالات — محرك النمو** |
| `interested_in` | `TEXT` | نوع الخدمة المطلوبة |
| `first_contact_at` | `TIMESTAMPTZ` | |
| `converted_at` | `TIMESTAMPTZ` nullable | **متى تحوّل لمريض؟** |
| `converted_patient_id` | `TEXT FK` nullable | |
| `status` | `ENUM` | `NEW`, `CONTACTED`, `QUALIFIED`, `BOOKED`, `CONVERTED`, `LOST` |
| `lost_reason` | `TEXT` nullable | |

#### 4.2.3 `referrals` — نظام الإحالة (Customer Advocacy)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `referrer_patient_id` | `TEXT FK` | **من إحال** |
| `referred_patient_id` | `TEXT FK` nullable | |
| `lead_id` | `TEXT FK` nullable | |
| `reward_type` | `ENUM` | `DISCOUNT`, `FREE_CONSULTATION`, `CASH`, `NONE` |
| `reward_value` | `BIGINT` | |
| `rewarded_at` | `TIMESTAMPTZ` nullable | **متى مُنح المكافأة؟** |

**قيمة CRM:** معدل التحويل من الإحالة = أقوى مؤشر على رضا المرضى.

#### 4.2.4 `patient_tags` + `patient_tags_map` (الشرائح)

**`patient_tags`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `name_ar` / `name_en` | `TEXT` | |
| `color` | `TEXT` | للعرض |
| `is_auto` | `BOOLEAN` | ** tagging تلقائي؟** |

**أنواع tags تلقائية مقترحة:**
| tag | القاعدة |
|---|---|
| `VIP` | إنفاق > 10000 EGP |
| `DIABETIC` | ICD-10 E11 |
| `HYPERTENSIVE` | ICD-10 I10 |
| `CHRONIC_PAIN` | شكاوى متكررة |
| `COSMETIC` | كشف تجميل |
| `PREGNANT` | من ICD-10 O |
| `PRIORITY` | يدوي من الطبيب |
| `FOLLOW_UP_DUE` | موعد متابعة متأخر |

#### 4.2.5 `activity_log` — سجل التفاعلات الموحّد (Activity Timeline)

> **هذا هو "قلب CRM".** اليوم لا يوجد سجل موحّد لما حدث مع المريض.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `patient_id` | `TEXT FK` nullable | |
| `lead_id` | `TEXT FK` nullable | |
| `actor_type` | `ENUM` | `DOCTOR`, `SECRETARY`, `SYSTEM`, `PATIENT`, `AI` |
| `actor_id` | `TEXT FK` nullable | |
| `activity_type` | `ENUM` | `CALL`, `WHATSAPP_SENT`, `WHATSAPP_RECEIVED`, `APPOINTMENT_BOOKED`, `APPOINTMENT_CANCELLED`, `VISIT_COMPLETED`, `PAYMENT`, `EMAIL`, `NOTE_ADDED`, `PRESCRIPTION_ISSUED`, `LEAD_CREATED`, `LEAD_CONVERTED`, `CAMPAIGN_SENT` |
| `subject` | `TEXT` | سطر واحد ملخص |
| `detail` | `JSONB` nullable | تفاصيل مرنة |
| `occurred_at` | `TIMESTAMPTZ` | |

**مثال استعلام CRM:**
```sql
-- كل ما حدث مع مريض في آخر سنة، مرتب زمنياً
SELECT * FROM activity_log
WHERE clinic_id = ? AND patient_id = ?
ORDER BY occurred_at DESC LIMIT 100;
```

#### 4.2.6 `follow_up_tasks` — محرك المتابعة (الأهم تجارياً)

> **أقوى_missing feature في النظام.** لا شيء يذكّر العيادة تنادمريضاً يعود.

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `patient_id` | `TEXT FK` | |
| `assigned_to_role` | `ENUM` | `DOCTOR`, `SECRETARY` |
| `assigned_to_user_id` | `TEXT FK` nullable | |
| `task_type` | `ENUM` | `CALL_BACK`, `REMINDER_CALL`, `ANNUAL_CHECKUP`, `FOLLOW_UP_VISIT`, `SEND_REPORT`, `REFILL_MEDICATION`, `DORMANT_WIN_BACK`, `BIRTHDAY_WISH`, `VACCINE_REMINDER` |
| `title_ar` / `title_en` | `TEXT` | |
| `due_at` | `TIMESTAMPTZ` | |
| `priority` | `ENUM` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | `ENUM` | `PENDING`, `IN_PROGRESS`, `DONE`, `SKIPPED`, `CANCELLED` |
| `completed_at` | `TIMESTAMPTZ` nullable | |
| `outcome` | `TEXT` nullable | **ماذا حدث؟ — يحسّن الجودة** |
| `auto_generated` | `BOOLEAN` | نظام أم بشري؟ |
| `generation_rule` | `TEXT` nullable | القاعدة اللي ولّدته |

**قواعد التوليد التلقائي المقترحة (CRM engine):**
| القاعدة | الشرط | المهمة |
|---|---|---|
| متابعة بعد العلاج | `encounter` من 7 أيام، `encounter_type = PROCEDURE` | اتصال للتأكد من النتيجة |
| إعادة فحص دوائية | مريض has chronic + آخر زيارة > 60 يوم | حجز متابعة |
| فحص سنوي | `DOB` يحل بعد 30 يوم | تهنئة + حجز فحص |
| تنشيط خامل | آخر زيارة > 120 يوم && إنفاق سابق > 500 | عرض إعادة |
| متابعة بعد استلام التحاليل | `lab_orders.status = RECEIVED` | إرسال النتيجة |
| تذكير دواء | وصفة تنتهي خلال 3 أيام | تجديد وصفة |

#### 4.2.7 `campaigns` + `campaign_recipients`

**`campaigns`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `name_ar` / `name_en` | `TEXT` | |
| `channel` | `ENUM` | `WHATSAPP`, `SMS`, `EMAIL` |
| `target_criteria` | `JSONB` | **الشريحة المستهدفة — تعريف** |
| `message_template_id` | `TEXT FK` | |
| `scheduled_at` | `TIMESTAMPTZ` | |
| `sent_at` | `TIMESTAMPTZ` nullable | |
| `status` | `ENUM` | `DRAFT`, `SCHEDULED`, `SENDING`, `SENT`, `CANCELLED` |
| `recipient_count` / `sent_count` / `delivered_count` / `failed_count` | `INT` | ⚠️ **إحصائيات حقيقية** |

**`campaign_recipients`:** (لتتبع من استلم فعلاً)
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `campaign_id` / `clinic_id` | `TEXT FK` | |
| `patient_id` / `lead_id` | `TEXT FK` | |
| `sent_at` / `delivered_at` / `read_at` | `TIMESTAMPTZ` nullable | |
| `status` | `ENUM` | `SENT`, `DELIVERED`, `READ`, `FAILED`, `REPLIED` |
| `responded_at` | `TIMESTAMPTZ` nullable | |

#### 4.2.8 `message_templates`

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `name` | `TEXT` | |
| `channel` | `ENUM` | `WHATSAPP`, `SMS`, `EMAIL` |
| `body_ar` / `body_en` | `TEXT` | |
| `variables` | `TEXT[]` | مثل `{{patient_name}}`, `{{doctor_name}}` |
| `category` | `ENUM` | `CONFIRMATION`, `REMINDER`, `RESULT_READY`, `PROMOTION`, `CAMPAIGN`, `FOLLOW_UP` |

#### 4.2.9 `patient_consents` (الامتثال القانوني — GDPR-esque)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `consent_type` | `ENUM` | `TREATMENT`, `DATA_PROCESSING`, `MARKETING_WHATSAPP`, `SHARE_WITH_LAB` |
| `granted` | `BOOLEAN` | |
| `granted_at` | `TIMESTAMPTZ` | |
| `revoked_at` | `TIMESTAMPTZ` nullable | |
| `evidence_url` | `TEXT` nullable | |

> ⚠️ **مهم:** بدون هذا، أي حملة WhatsApp تجاري مخالفة قانونياً في مصر والخليج.

#### 4.2.10 `audit_log` (سجل التدقيق الطبي/المالي — **إلزامي**)

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `actor_id` / `actor_role` | `TEXT` | |
| `entity_type` | `TEXT` | `PATIENT`, `ENCOUNTER`, `INVOICE`, `EXPENSE`... |
| `entity_id` | `TEXT` | |
| `action` | `ENUM` | `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `EXPORT`, `PRINT` |
| `old_value` / `new_value` | `JSONB` nullable | |
| `ip_address` | `TEXT` | |
| `occurred_at` | `TIMESTAMPTZ` | |

> **مطلوب قانونياً** لأي سجل طبي + مالي. وظيفته المزدوجة: الامتثال + بناء ثقة المريض.

---

<a id="5-الطبقة-المالية-المصروفات-ثابتة-متغيرة"></a>
## 5. الطبقة المالية — التمييز بين المصروفات الثابتة والمتغيرة

> **هذا القسم يجيب مباشرة على سؤالك الأساسي.** كل تفصيلة: من تعريف النوع، إلى قاعدة البيانات، إلى التقارير، إلى الواجهة.

### 5.0 تشخيص الوضع الحالي

**الحقيقة المُرعبة:** النظام لا يفرّق بين ثابت ومتغيّر **في أي مكان**. المصروفات كلها في جدول واحد `expenses` بدون تصنيف، و`is_recurring` مجرد boolean تجميلي.

**وأربع قوائم تصنيف متناقضة في أربعة ملفات:**

| التصنيف | الملف | القيم |
|---|---|---|
| **الطبيب (9 فئات)** | `components/doctor/finance/ExpenseModal.tsx:15-25` | `SALARIES`, `UTILITIES`, `RENT`, `SUPPLIES`, `LAB`, `MAINTENANCE`, `MARKETING`, `TAXES`, `MISC` |
| **السكرتيرة (4 فئات)** | `components/secretary/finance/SecretaryExpenseModal.tsx:29-34` | `UTILITIES`, `CLEANING`, `MAINTENANCE`, `MISC` |
| **الـ API (9 فئات بأسماء أخرى)** | `app/api/doctor/finance/route.ts:69-79` | نفس الـ 9 لكن **5 منهم بتسميات مختلفة** |
| **خريطة الألوان (8 فئات)** | `doctor/finance/page.tsx:68-77` | **بدون `LAB`** |

**النتيجة:**
- `CLEANING` **غير موجودة** في enum Prisma (`prisma/schema.prisma:444-454`) → ما تُدخله السكرتيرة لا يُحفظ.
- `LAB` موجودة في الـ doctor والـ API لكن **مفقودة في خريطة الألوان وفي P&L** → **مصروفات التحاليل لا تظهر في الأرباح والخسائر.**
- الـ API يرجّع `categoryNameEn: e.category` (`finance/expenses/route.ts:48-49`) → Secretary يستقبل `"UTILITIES"` كنص خام.
- doctor/secretary لا يستطيع رؤية نفس التصنيف بنفس الاسم.

### 5.1 التعريف المحاسبي الصحيح

**التصنيف ليس_label فقط — هو سلوك حسابي.** كل نوع له طريقة different في التقارير والحسابات.

| `behavior_type` | التعريف | أمثلة العيادة | أثره في التقارير |
|---|---|---|---|
| `FIXED` | **ثابت** — لا يتغير مع عدد المرضى | إيجار، مرتبات، اشتراك برمجيات، تأمين، صيانة دورية | يذهب لـ **المصروفات الثابتة** — أساس حساب **نقطة التعادل** |
| `SEMI_VARIABLE` | **شبه ثابت** — يتغير ببطء (موسمية/تدريجي) | كهرباء، ميا، إنترنت، صيانة | في الثابتة لكن مع **`variability_pct`** (مثل الكهرباء ±25%) |
| `VARIABLE` | **متغير** — يتحرك مع النشاط | مستلزمات طبية، قفازات، محاليل، إمداد توصيل | **تكلفة متغيرة** — يُقارن **بإيراد نفس الفترة** |
| `STEP_FIXED` | **سلّم/درج** — يقفز عند عتبة | إعلان، حملة، تجديد اشتراك، مورد جديد | في **STEP-FIXED** مع `step_threshold` |
| `CAPEX` | **رأس مال** — أصل دائم | جهاز، أثاث، نظام | **لا يُخصم دفعة واحدة** → إهلاك شهري |
| `TAX` | **ضريبة/رسوم** | ضرائب، رسوم حكومية | **يُعرض منفصلاً** — لا يُخلط بالضرائب بالتكلفة |

### 5.2 الجداول الجديدة

#### 5.2.1 `expense_categories` — من hardcoded إلى جدول

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | **null = تصنيف النظام (system)** |
| `code` | `TEXT` | `RENT`, `SALARIES`... |
| `name_en` | `TEXT` | |
| `name_ar` | `TEXT` | |
| `behavior_type` | `ENUM` | `FIXED`, `SEMI_VARIABLE`, `VARIABLE`, `STEP_FIXED`, `CAPEX`, `TAX` |
| `is_clinical_cost` | `BOOLEAN` | **هل يدخل تكلفة مباشرة (COGS)؟** — حاسم |
| `is_patient_care` | `BOOLEAN` | رمضان مرتبط بصحة المريض |
| `is_active` | `BOOLEAN` | **لإخفاء الفئات القديمة بدل حذفها (audit)** |
| `sort_order` | `INT` | |
| `parent_category_id` | `TEXT FK` nullable | لتجميع (مثلاً `SUPPLIES` → `INJECTABLES`, `GLOVES`) |
| `icon` / `color` | `TEXT` | للعرض |

**`is_clinical_cost` هو الحقل الأهم:** مستلزمات طبية تُعتمد **لكل مريض/كشف**، أما الصيانة فمصاريف إدارية. خلطهم يجعل صافي الربح **مضللاً تماماً**.

#### 5.2.2 `expense_templates` — محرّك المصروفات الثابتة (يحل وعود isRecurring المكسورة)

> **هذا هو الحل للوعد الكاذب في README** ("يُدرَج تلقائياً كل شهر").

| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `category_id` | `TEXT FK → expense_categories` | |
| `title_ar` / `title_en` | `TEXT` | |
| `amount` | `BIGINT` (قروش) | المبلغ الشهري |
| `frequency` | `ENUM` | `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUAL` |
| `due_day_of_month` | `INT` nullable | مثال: 1 = أول كل شهر |
| `weekday` | `INT` nullable | للأسبوعية |
| `start_date` / `end_date` | `DATE` nullable | عقد ينتهي |
| `payment_method` | `ENUM` | |
| `payee` | `TEXT` | |
| `contract_ref` | `TEXT` | رقم العقد |
| `auto_post` | `BOOLEAN` | **هل يُنشأ تلقائياً؟** |
| `posting_mode` | `ENUM` | `AUTO` (فوري), `CONFIRM` (ينتظر موافقة), `MANUAL` |
| `accounting_basis` | `ENUM` | `CASH` (عند الدفع), `ACCRUAL` (عند الاستحقاق) |
| `last_posted_period` | `TEXT` nullable | **YYYY-MM — لمنع التكرار** |
| `next_due_at` | `TIMESTAMPTZ` | |
| `is_active` | `BOOLEAN` | |

**محرك التوليد (idempotent):**
```
لكل فترة (e.g. 2026-10):
  للكل template where is_active AND next_due_at <= end_of_period:
    IF template.last_posted_period == '2026-10': تخطَّ  ← منع التكرار
    IF posting_mode == 'AUTO':
      INSERT INTO expenses (..., source_template_id, period_key)
      UPDATE expense_templates SET last_posted_period = '2026-10'
    ELSE:  ← CONFIRM
      INSERT INTO pending_expenses (template_id, period)  → يربط بموافقة المستخدم
```

**جدول `pending_expenses` (الموافقات):**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `clinic_id` / `template_id` | `TEXT FK` |
| `period_key` | `TEXT` (`2026-10`) |
| `amount` | `BIGINT` |
| `status` | `ENUM` (`PENDING`, `APPROVED`, `REJECTED`) |
| `approved_by` / `approved_at` | |

**جدول `expenses` — تعديل:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | **ترقيم تسلسلي** (`EXP-2026-10-0001`) |
| `category_id` | `TEXT FK` | بدل النص الحر |
| `behavior_type_snapshot` | `ENUM` | **نسخة وقت التسجيل** — لو تغيّر التصنيف لاحقاً، السجل القديم ما يتغيرش |
| `amount` | `BIGINT` | قروش — يحل مشكلة الأرقام العشرية |
| `is_recurring` | `BOOLEAN` | **محسوب** من وجود template، لا يُدخل يدوياً |
| `source_template_id` | `TEXT FK` nullable | **تتبع التوليد التلقائي** |
| `period_key` | `TEXT` | `YYYY-MM` — للتجميع السريع |
| `invoice_ref` | `TEXT` nullable | **ترقيم تسلسلي + unique** |
| `is_tax_deductible` | `BOOLEAN` | |
| `recorded_by_role` | `ENUM` | |
| `doctor_id` | `TEXT FK` nullable | **يمكن أن يكون null** — يجب أن يظهر في P&L (**يحل E9**) |

#### 5.2.3 `fixed_cost_breakdown` — مصروفات ثابتة مفصّلة شهرياً

لكل مصروف ثابت، الـ "تكلفة ثابتة شهرية" = المبلغ السنوي ÷ 12 (تسطيح).

| Column | Type | ملاحظات |
|---|---|---|
| `template_id` | `TEXT FK` | |
| `annual_amount` | `BIGINT` | |
| `monthly_amortized` | `BIGINT` | annual/12 |
| `variability_pct` | `DECIMAL(5,2)` | ±% للشبه ثابتة |

**مثال عملي:**
| البند | المبلغ | التكرار | شهرياً |
|---|---|---|---|
| إيجار | 120,000 EGP | شهري | 120,000 |
| مرتب سكرتيرتين | 36,000 EGP | شهري | 36,000 |
| اشتراك نظام إدارة | 12,000 EGP | سنوي | 1,000 |
| صيانة دورية | 60,000 EGP | سنوي | 5,000 |
| **إجمالي الثابت الشهري** | | | **162,000** |

### 5.3 حساب نقطة التعادل (Break-Even) — **الأهم لأصحاب العيادات**

> **هنا يظهر الفرق الحقيقي بين نظام عيادات و CRM.**

```
إيراد متوسط الكشف        = إيراد اليوم ÷ عدد كشوفات اليوم
هامش المساهمة للكشف     = (إيراد الكشف − التكلفة المباشرة للكشف) ÷ إيراد الكشف
عدد الكشوفات لل-breakeven = (إجمالي التكاليف الثابتة ÷ هامش المساهمة للكشف)
```

**مثال:**
| البند | القيمة |
|---|---|
| متوسط إيراد الكشف | 450 EGP |
| تكلفة مباشرة للكشف (مستلزمات + تحاليل) | 150 EGP |
| هامش المساهمة | 300 EGP (67%) |
| التكاليف الثابتة شهرياً | 162,000 EGP |
| **عدد كشوفات التعادل** | **540 كشف/شهر** |
| **18 كشف/يوم** | (بـ 30 يوم عمل) |

**عرض في الواجهة:** شريط تقدّم — كم كشف اليوم مقابل 18 المطلوب. **هذا يحوّل التطبيق من "نظام تسجيل" إلى "شريك عمل".**

### 5.4 التقارير المالية — إعادة بناء الـ P&L بالكامل

**المشكلة الحالية (E10, E11):**
- `ProfitLossStatement.tsx:109,117,125` — إيرادات **مختلقة** بتقسيم ثابت 65/22/13 من `grossRevenue`. يتجاهل `revenues[]` الحقيقية الممرّرة إليه.
- `:28-35` — يحسب 8 فئات، **`LAB` مفقود** → البنود لا تطعم الإجمالي.
- `:37` — `directCosts = suppliesTotal` فقط.
- `:218` — يدمج `TAXES` في بند "ضيافة ونظافة" — **خطأ محاسبي**.
- `page.tsx:446` — قسمة على صفر بلا حارس → `NaN%`.

**الهيكل الصحيح الجديد:**

```
══════════════════════════════════════════════
         DOCTECH — الأرباح والخسائر
         <اسم الشركة> — <الشهر/السنة>
══════════════════════════════════════════════

1. الإيرادات (Revenue)
   ├─ إيرادات الاستشارات (Consultations)
   │   ├─ كشوفات جديدة:          <رقم حقيقي>  (عدّ من encounters)
   │   └─ إعادات واستشارات:       <رقم حقيقي>
   ├─ إيرادات الإجراءات (Procedures)
   │   ├─ خياطة/جبس:             <رقم>
   │   └─ إجراءات أخرى:           <رقم>
   ├─ إيرادات التقارير الطبية:    <رقم>
   ├─ إيرادات المختبر (إن كان):    <رقم>
   ├─ إيرادات المنتجات:           <رقم>
   ├─ خصومات ممنوحة:            (<رقم>)  ← جديد
   └─ مردودات:                  (<رقم>)  ← جديد
   ───────────────────────────────────────
   إجمالي الإيرادات (Gross Revenue):  <رقم>

2. تكلفة الإيراد المباشرة (COGS)
   ├─ مستلزمات طبية:             <رقم>  [VARIABLE]
   ├─ تحاليل ومعمل:              <رقم>  [VARIABLE]
   ├─ توصيل/مندوبين:             <رقم>  [VARIABLE]
   └─ إجمالي COGS:               <رقم>

   ═══════════════════════════════════
   مجمل الربح (Gross Profit):      <رقم>
   هامش مجمل الربح:                 <نسبة>%
   ═══════════════════════════════════

3. المصروفات الثابتة (Fixed Overhead)  [FIXED]
   ├─ إيجار:                     <رقم>  (مُسطَّح شهرياً)
   ├─ مرتبات:                    <رقم>  (مُسطَّح شهرياً)
   ├─ كهرباء ومياه:               <رقم>  [SEMI_VARIABLE ±%]
   ├─ إنترنت وتليفون:             <رقم>
   ├─ صيانة دورية:               <رقم>  (مُسطَّح شهرياً)
   └─ إجمالي الثابت:              <رقم>

4. مصروفات إدارية متغيرة (Variable OpEx)
   ├─ تسويق وإعلانات:            <رقم>  [STEP_FIXED]
   ├─ برمجيات واشتراكات:         <رقم>
   ├─ ضرائب ورسوم:               <رقم>  [TAX]
   └─ نثرية وضيافة:              <رقم>
   ───────────────────────────────────────
   إجمالي المصروفات:             <رقم>

   ═══════════════════════════════════
   صافي الربح (Net Profit):       <رقم>
   هامش صافي الربح:                <نسبة>%
   ═══════════════════════════════════

5. تحليل إضافي
   ├─ عدد الكشوفات:              <رقم>
   ├─ متوسط الإيراد للكشف:        <رقم>
   ├─ تكلفة الكشف المباشرة:      <رقم>
   ├─ هامش المساهمة للكشف:        <رقم>
   └─ كشوفات نقطة التعادل:       <رقم>  ← CRM

6. مصروفات ثابتة مفصّلة (مرفق)
   └─ جدول الشهر بالتفصيل
```

**المتطلبات التقنية:**
- **كل الأرقام** من `expenses` + `encounters` + `invoices` — **صفر أرقام ثابتة في الكود**.
- كل قسم يعرض `[VARIABLE]` / `[FIXED]` / `[SEMI_VARIABLE]` — **الطبيب يفهم طبيعة مصروفه**.
- `LAB` يظهر ضمن COGS، `TAX` يظهر منفصلاً.
- مقارنة بالشهر الماضي والسنة السابقة.
- تنبيه: "تكلفة التحاليل مرتفعة" إذا تجاوز COGS/الإيراد 40% — **تنبيه مبكر ذكي**.

### 5.5 الفوترة (Invoices) — غير موجودة (E20, E21)

> اليوم الفاتورة = سطر نصي في مصروف. **غير مقبول تجارياً أو قانونياً.**

#### 5.5.1 جداول الفوترة

**`invoices`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `invoice_number` | `TEXT UNIQUE` | **`INV-2026-10-0042` — تسلسلي** |
| `clinic_id` / `patient_id` | `TEXT FK` | |
| `appointment_id` / `encounter_id` | `TEXT FK` nullable | |
| `issue_date` | `DATE` | |
| `due_date` | `DATE` nullable | |
| `subtotal` | `BIGINT` | قروش |
| `discount_type` | `ENUM` | `PERCENTAGE`, `FIXED`, `NONE` |
| `discount_value` | `BIGINT` | |
| `discount_amount` | `BIGINT` | محسوب |
| `tax_rate` | `DECIMAL(5,2)` | 0 افتراضياً |
| `tax_amount` | `BIGINT` | |
| `total` | `BIGINT` | |
| `paid_amount` | `BIGINT` | |
| `balance_due` | `BIGINT` | محسوب |
| `status` | `ENUM` | `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED` |
| `notes` | `TEXT` | |

**`invoice_items`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `invoice_id` | `TEXT FK` | |
| `item_type` | `ENUM` | `CONSULTATION`, `PROCEDURE`, `LAB_TEST`, `MEDICATION`, `REPORT`, `OTHER` |
| `description_ar` / `description_en` | `TEXT` | |
| `quantity` | `INT` default 1 | |
| `unit_price` | `BIGINT` | |
| `line_total` | `BIGINT` | |
| `appointment_type_id` | `TEXT FK` nullable | |

**`discounts` + `coupons`** (E21 — غير موجود):
**`discounts`:**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `clinic_id` | `TEXT FK` |
| `code` | `TEXT UNIQUE` |
| `type` | `ENUM` (`PERCENTAGE`, `FIXED_AMOUNT`, `FREE_CONSULTATION`) |
| `value` | `BIGINT` |
| `applies_to` | `ENUM` (`ALL`, `SPECIFIC_TYPES`) |
| `min_amount` | `BIGINT` nullable |
| `max_uses` / `used_count` | `INT` |
| `valid_from` / `valid_until` | `DATE` |
| `is_active` | `BOOLEAN` |

#### 5.5.2 تسلسل الترقيم الآمن (Concurrency-safe)

⚠️ **لا تستخدم `MAX(id) + 1` — سباق بين طلبين (race condition).**

```sql
-- Postgres sequence
CREATE SEQUENCE invoice_number_seq START 1;

-- في كل عيادة
invoice_number := 'INV-' || to_char(now(),'YYYY-MM') || '-' ||
                 lpad(nextval('invoice_number_seq')::text, 5, '0');
```
لو كل عيادة تحتاج تسلسل مستقل، استخدم جدول `counters (clinic_id, kind, last_value)` مع `UPDATE ... RETURNING`.

#### 5.5.3 الاسترداد (Refunds) — E21

**`refunds`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` / `invoice_id` / `transaction_id` | `TEXT FK` | |
| `amount` | `BIGINT` | ⚠️ **موجب دائماً** |
| `reason` | `TEXT` | |
| `method` | `ENUM` | نفس طريقة الدفع |
| `refund_reference` | `TEXT` | رقم العملية |
| `approved_by` / `approved_at` | `TEXT`/`TIMESTAMPTZ` | **الاسترداد يحتاج موافقة** |
| `created_at` | `TIMESTAMPTZ` | |

**قاعدة:** `PaymentTransaction.amount` يكون سالباً عند الاسترداد (double-entry مبسّط)، أو نستخدم `type = 'REFUND'` مع مبلغ موجب وطرحه في التقارير. **الأول أنظف محاسبياً.**

#### 5.5.4 الفواتير>(_الطباعة/التصدير)

| المطلوب | التفاصيل |
|---|---|
| قالب PDF | ختم العيادة (شعار، رقم تسجيل، عنوان، هاتف) |
| بيانات المريض | الاسم، الهاتف، **لا يظهر رقم الهوية كاملاً** |
| بنود الفاتورة | من `invoice_items` |
| الضريبة | إذا `tax_rate > 0` |
| شرط الدفع | " conformed خلال X يوم" |
| التوقيع | ختم + توقيع الطبيب |

> هذه كانت البند #3 في الـ "Next Session Backlog" في `PROJECT_PROGRESS.md` — هي الآن أولوية في الخطة.

### 5.6 `payment_transactions` — تصحيح

| المشكلة الحالية | التصحيح |
|---|---|
| `amount DOUBLE PRECISION` | → `BIGINT` (قروش) |
| لا يوجد `invoice_id` | أضفه — كل دفعة مرتبطة بفاتورة |
| لا يوجد `is_refund` | أضفه |
| `doctor_id: doctorId \|\| session?.user?.id` (`transactions/route.ts:168`) — **يخلط Clerk user id مع `doctors.id`** | اجلب الـ doctor record من `clinicAuth` دائماً |
| `status: "PAID"` hardcoded (`:174`) | منطقي |
| إضافة صفر `Math.min(totalDue, currentPaid + numAmount)` (`:150`) | ✅ جيد — يمنع الدفع الزائد |
| **لا يوجد refund path** | أضف (§5.5.3) |

### 5.7 خزينة النقد (Cash Drawer) — تحويلها إلى جلسات

> حالياً `cashInDrawer` = رقم محسوب (`finance/summary/route.ts:121-124`). **غير عملي للصيدلية.**

**`cash_sessions`:**
| Column | Type | ملاحظات |
|---|---|---|
| `id` | `TEXT PK` | |
| `clinic_id` | `TEXT FK` | |
| `secretary_id` | `TEXT FK` | |
| `opened_at` / `closed_at` | `TIMESTAMPTZ` | |
| `opening_float` | `BIGINT` | **المبلغ الافتتاحي في الدرج** |
| `expected_cash` | `BIGINT` | محسوب |
| `actual_cash` | `BIGINT` nullable | يُدخل عند الإقفال |
| `variance` | `BIGINT` nullable | **الفرق = actual − expected** |
| `status` | `ENUM` | `OPEN`, `CLOSED`, `RECONCILED` |
| `notes` | `TEXT` | |

**`cash_movements`:**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `cash_session_id` | `TEXT FK` |
| `clinic_id` | `TEXT FK` |
| `direction` | `ENUM` (`IN`, `OUT`) |
| `amount` | `BIGINT` |
| `category` | `TEXT` (مصروف، رواتب، طلب، إلخ) |
| `reference_type` / `reference_id` | `TEXT` nullable |
| `recorded_by` | `TEXT FK` |

> **عند الإقفال: الفرق > 1000 EGP → تنبيه إجباري للطبيب.** كشف الفاقدان.

### 5.8 ملخص ما يجب بناؤه في الطبقة المالية

| # | البند | يحل |
|---|---|---|
| F1 | جدول `expense_categories` مع `behavior_type` | E22، التمييز ثابت/متغير |
| F2 | جدول `expense_templates` + محرك التوليد | وعد `is_recurring` الكاذب |
| F3 | `amount` → `BIGINT` + `lib/money.ts` | أرقام عشرية غير صالحة محاسبياً |
| F4 | `behavior_type_snapshot` + `period_key` | تقارير صحيحة |
| F5 | مصروفات السكرتيرة تظهر في P&L | E9 |
| F6 | جداول `invoices` / `invoice_items` | E20 |
| F7 | ترقيم تسلسلي آمن | سباق الترقيم |
| F8 | `discounts` / `coupons` | غياب الخصم |
| F9 | `refunds` + `is_refund` | E21 |
| F10 | `cash_sessions` / `cash_movements` | خزينة حقيقية |
| F11 | إعادة بناء P&L بالكامل (7 أقسام) | E10, E11, E13 |
| F12 | قسم نقطة التعادل | قيمة CRM |
| F13 | `supplies` مرتبطة بالـ `encounter` | COGS حقيقي |
| F14 | تنبيه COGS/إيراد > 40% | تنبيه مبكر |

---

<a id="6-الصلاحيات-و-rbac-التنفيذ-الحقيقي"></a>
## 6. الصلاحيات و RBAC — التنفيذ الحقيقي

### 6.1 تشخيص: الصلاحيات ديكورية بالكامل

**الحقيقة:** لا يوجد أي تنفيذ للصلاحيات في المشروع. الدليل:

1. **`getClinicSession()` لا يجلب `permissions`** — `lib/clinicAuth.ts:46` يطلب `"id, clerk_user_id, email, name, avatar_url, clinic_id"`. **لا يمكن لأي route فحص صلاحية حتى لو أراد.**
2. **لا يوجد `hasPermission()` / `canAccess()`** — grep لكل `permissions.includes|hasPermission|canAccess` يعطي 20 نتيجة، كلها داخل الملفين نفسهما.
3. **السايد بار يعرض كل الأقسام بلا شرط** — `secretary/layout.tsx:34-86` يعرّف `navItems` كمصفوفة مسطحة من 9 عناصر، تُرسم بلا فلتر في `:196` وتُمرر كاملة إلى `MobileSidebar` (`:173`) و `BottomNav` (`:319`).
4. **الصلاحيات تُعرض كـ chips للقراءة فقط** — `secretary/profile/page.tsx:516-521`، `team/page.tsx:686-701`.
5. **لا يوجد `middleware.ts`** — glob لا يُرجع شيء. الحماية تعتمد كلياً على كل صفحة/ـ route تستدعي `auth()` بنفسها.
6. **`"all"` ديسبوت UI فقط** — `team/page.tsx:260-283` يضيف `"all"` تلقائياً، لكن لا شيء يوسّعها بعد ذلك.

**النتيجة العملية:** سكرتيرة بـ `permissions: []` ما زالت ترى وتفتح **الخزينة (finance) والمرضى والتقارير والواتساب.**

### 6.2 الصلاحيات الحالية وال president's الاستخدام

**المفاتيح الست:** `all`, `appointments`, `patients`, `billing`, `whatsapp`, `reports`
(`doctor/team/page.tsx:48-54` و `api/doctor/secretaries/route.ts:5-12` — نسخة مكررة)

**هذه القائمة grossly لا تكفي لنظام CRM.** يجب توسيعها.

### 6.3 نظام RBAC الجديد — صلاحيات دقيقة

**التصميم: `role` + granular `permissions`.**

**جدول `permissions` (كتالوج النظام):**
| Column | Type |
|---|---|
| `id` | `TEXT PK` — مثل `finance.view_revenue` |
| `module` | `TEXT` — `appointments`, `finance`, `patients`... |
| `action` | `TEXT` — `view`, `create`, `edit`, `delete`, `export` |
| `name_ar` / `name_en` | `TEXT` |
| `is_sensitive` | `BOOLEAN` — يحتاج صلاحيات معزّزة |
| `sort_order` | `INT` |

**جدول `secretary_permissions` (ربط):**
| Column | Type |
|---|---|
| `clinic_id` | `TEXT FK` |
| `secretary_id` | `TEXT FK` |
| `permission_id` | `TEXT FK` |
| `granted` | `BOOLEAN` |
| `granted_by` / `granted_at` | `TEXT` / `TIMESTAMPTZ` |

**جدول `roles` (أدوار جاهزة):**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `clinic_id` | `TEXT FK nullable` (null = نظام) |
| `name_ar` / `name_en` | `TEXT` |
| `is_system_role` | `BOOLEAN` |
| `role_permissions` | `JSONB` — مصفوفة `permission_id` |

### 6.4 الأدوار القياسية ومصفوفة الصلاحيات

**الأدوار:**
| الدور | الوصف |
|---|---|
| `CLINICAL_LEAD` / `DOCTOR` | الطبيب — كل شيء في عيادته |
| `HEAD_SECRETARY` | سكرتير أول — كل شيء عدا finances أهل |
| `RECEPTIONIST` | استقبال — مواعيد فقط |
| `CLINICAL_ASSISTANT` | مساعد — مواعيد + مرضى (قراءة) |
| `BILLING_OFFICER` | محاسب — مالية فقط |
| `MARKETING_OFFICER` | تسويق — CRM + WhatsApp |

**مصفوفة الصلاحيات الكاملة (28 صلاحية):**

| Module | view | create | edit | delete | export |
|---|---|---|---|---|---|
| **appointments** | ✓ | ✓ | ✓ | ✓ | |
| **patients** | ✓ | ✓ | ✓ | ⚠️ | ⚠️ |
| **patients.clinical** | ✓ | ✓ | ✓ | | |
| **prescriptions** | ✓ | ✓ | ✓ | | |
| **lab_results** | ✓ | ✓ | ✓ | | |
| **finance.invoices** | ✓ | ✓ | ✓ | ✓ | |
| **finance.collect** | ✓ | ✓ | | | |
| **finance.expenses** | ✓ | ✓ | ✓ | ⚠️ | |
| **finance.revenue** | ⚠️ | | | | ⚠️ |
| **finance.profit** | ⚠️ | | | | |
| **reports** | ✓ | ✓ | ✓ | | |
| **whatsapp** | ✓ | ✓ | | | |
| **crm.leads** | ✓ | ✓ | ✓ | | |
| **crm.tasks** | ✓ | ✓ | ✓ | | |
| **crm.campaigns** | ✓ | ✓ | ✓ | | ⚠️ |
| **staff** | ✓ | ⚠️ | ⚠️ | ⚠️ | |

**الرموز:** `⚠️` = صلاحية حساسة تحتاج موافقة ثانية أو تقييد (مثلاً `finance.profit` للطبيب فقط).

**جدول defaults للأدوار:**
| الدور | الصلاحيات الافتراضية |
|---|---|
| `RECEPTIONIST` | `appointments.*` + `patients.view` + `whatsapp.*` |
| `BILLING_OFFICER` | `finance.*` (ما عدا `finance.profit`) + `patients.view` + `appointments.view` |
| `CLINICAL_ASSISTANT` | `appointments.*` + `patients.*` + `reports.*` |
| `HEAD_SECRETARY` | كل شيء عدا `finance.profit` + `staff.view` |
| `MARKETING_OFFICER` | `crm.*` + `whatsapp.*` + `patients.view` |

### 6.5 التنفيذ — طبقة الإجبار

**إنشاء `lib/permissions.ts`:**
```ts
export function can(session: Session, permission: string): boolean {
  if (session.role === "doctor") return true;          // الطبيب له كل شيء
  if (session.permissions.includes("all")) return true;
  return session.permissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const session = await requireSession();
  if (!can(session, permission)) {
    throw new ApiError(403, `Missing permission: ${permission}`);
  }
  return session;
}
```

**الاستخدام في API routes:**
```ts
// مثال: secretary finance
export async function GET(request: Request) {
  const session = await requirePermission("finance.revenue");
  // clinicId من الجلسة فقط — لا ?clinicId من العميل
  const { data } = await supabaseAdmin
    .from("payment_transactions")
    .select("*")
    .eq("clinic_id", session.clinicId);
}
```

**الاستخدام في الواجهة — `components/auth/PermissionGate.tsx`:**
```tsx
<PermissionGate permission="finance.profit">
  <ProfitBreakdown />
</PermissionGate>
```
أو في السايد بار:
```ts
const navItems = ALL_NAV_ITEMS.filter(item =>
  item.permission ? can(session, item.permission) : true
);
```

**تحديث `getClinicSession()`:**
```ts
.select("id, clerk_user_id, email, name, avatar_url, clinic_id, permissions")
```

### 6.6 إصلاح نقص عمليات المصروفات (Expenses CRUD)

**المشكلة (E17):** `doctor/team/page.tsx:465-491` فيه `handleUpdateMember` و `handleDeleteMember` لكنهما يظهران `toast.info("...will be connected to the database when the update API is added")`. والـ route عندها `GET` و `POST` فقط — **لا `PUT` ولا `DELETE`**.

**الإضافة المطلوبة في `app/api/doctor/secretaries/route.ts`:**
| Method | الوظيفة |
|---|---|
| `GET` | موجود ✓ |
| `POST` | موجود ✓ (إنشاء) |
| `PUT` | **جديد** — تحديث الاسم/الهاتف/الصلاحيات/الحالة |
| `DELETE` | **جديد** — حذف Soft (`status = INACTIVE`) + حذف من Clerk |

**نقاط يجب الحذر منها:**
- **تعديل الصلاحيات**: يجب أن يعمل — حالياً لا يمكن سحب صلاحية ممنوحة.
- **تجميد الحساب**: `status: "SUSPENDED"` في الواجهة لكن الـ enum في Prisma هو `ACTIVE | INACTIVE` (`:74`) — **عدم تطابق**. وحقل DDL لا يوجد أصلاً. **وحّد التسمية.**
- **كلمة المرور**: عند `POST` يُطلب `password` إلزامي (`:118-132`) + 5 قواعد تحقق. عند `PUT` لا يُطلب. حافظ على نفس القواعد.
- **تكرار scope**: الفحص `:237-256` على **global** لا حسب العيادة — نفس البريد ممنوع في كل العيادات. **أصلحه ليصبح per-clinic**.

### 6.7 الواجهة — مصفوفة الصلاحيات

**صفحة إدارة الطاقم تُحدّث:**
- عرض الصلاحيات الفعّالة لكل موظف.
- **كل permission قابل للتبديل** مع توضيح بالعربي.
- **تحذير عند سحب صلاحية حساسة** (`finance.profit`).
- **عرض سجل الصلاحيات**: "من أعطى هذه الصلاحية ومتى".
- **تنبيه عند موظف بلا صلاحيات** — لا يستطيع العمل.

---

<a id="7-محرك-الجدولة-ومنع-الازدواجية"></a>
## 7. محرك الجدولة ومنع الازدواجية

### 7.1 تشخيص

**المشكلة الحرجة (E7):** لا يوجد أي قيد في قاعدة البيانات. `availabilityService.ts:111-120` فحص قراءة فقط لعرض السلاوت. لو وصل طلبان متزامنان، كلاهما ينجح.

**المشكلة الحرجة (E18):** `availabilityService.ts:114-115` يستخدم `appointmentDate.getHours()` — يحوّل لـ **توقيت السيرفر (UTC)**. لكن الـ slots مبنية على wall-clock العيادة (`start_time = "09:00"` نصوص). **فجوة التوقيت commune.**

**المشكلة (E19):** `ACTIVE_APPOINTMENT_STATUSES` (`:19-23`) = `SCHEDULED`, `CONFIRMED`, `COMPLETED`. و `:97-98` يفلتر `booking_status !== "REJECTED"`. إذن **`PENDING_REVIEW` يحجز slot**. بلا `expires_at` → طلب واتساب ملغى يسرق موعد للأبد.

**مشكلة أخرى:** `:70-78` fallback صامت لـ 09:00-17:00/30min إذا لم يُعدّ الطبيب جدولاً ليوم معين.

**`DoctorSchedule`:** `@@unique([doctorId, dayOfWeek])` — يوم واحد لكل طبيب. **لا يدعم ورديات متعددة** (صباحي/مسائي) أو إجازات.

### 7.2 التصميم الجديد

#### 7.2.1 جدول `doctor_shifts` — الورديات (بديل `doctor_schedules`)

```sql
CREATE TABLE doctor_shifts (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,          -- 0=الأحد ... 6=السبت
  start_time TEXT NOT NULL,          -- "09:00"
  end_time TEXT NOT NULL,            -- "17:00"
  slot_duration INT NOT NULL DEFAULT 30,
  shift_name TEXT,                   -- "صباحي", "مسائي"
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_overflow INT DEFAULT 0,        -- slots فوق الطاقة القصوى
  UNIQUE(doctor_id, day_of_week, shift_name)
);
```

#### 7.2.2 جدول `schedule_exceptions` (استثناءات وإجازات)

```sql
CREATE TABLE schedule_exceptions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL,   -- 'HOLIDAY','LEAVE','CONFERENCE','EXTRA_SHIFT'
  reason TEXT,
  start_time TEXT,               -- للـ EXTRA_SHIFT فقط
  end_time TEXT,
  created_at TIMESTAMPTZ
);
```

**مثال:** الطبيب أجازة 15 أغسطس → `schedule_exceptions` → لا مواعيد. عنده وردية إضافية 20 اغسطس → `EXTRA_SHIFT`.

#### 7.2.3 جدول `slot_blocks` (حجب يدوي)

```sql
CREATE TABLE slot_blocks (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  blocked_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_by TEXT NOT NULL
);
```

> **استخدام:** أكل/تدريب/مؤتمر. يحجز فترة محددة بدون موعد مريض.

#### 7.2.4 تغيير `appointments` — الأعمدة الحاسمة

| Column | Type | ملاحظات |
|---|---|---|
| `appointment_start` | `TIMESTAMPTZ` | **البداية الفعلية UTC** |
| `appointment_end` | `TIMESTAMPTZ` | **النهاية الفعلية UTC** |
| `slot_duration` | `INT` | طول السلاوت |
| `clinic_timezone` | `TEXT` | **IANA — وقت العيادة وقت الحجز** |
| `hold_expires_at` | `TIMESTAMPTZ` nullable | **لـ `PENDING_REVIEW`** |
| `booking_channel` | `ENUM` | `MANUAL`, `WHATSAPP`, `PHONE`, `ONLINE`, `WALK_IN` |

**⚠️ عند الحجز:**
1. تُقرأ `clinic.timezone` → يتحول وقت العيادة إلى UTC: `14:00 Africa/Cairo` → `12:00 UTC`.
2. `appointment_start` = UTC. عند العرض يتحول محلياً للعيادة.
3. لا نعتمد على ثقة التوقيت — **النظام كله UTC داخلياً، والعرض محلي**.

### 7.3 منع الازدواجية — القيد الحقيقي

**مستحيل أن يتكرر الحجز:**
```sql
ALTER TABLE appointments ADD COLUMN slot_range TSTZRANGE
  GENERATED ALWAYS AS (tstzrange(appointment_start, appointment_end, '[)')) STORED;

ALTER TABLE appointments ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    doctor_id WITH =,
    slot_range WITH &&
  ) WHERE (status IN ('SCHEDULED','CONFIRMED'));
```
يتطلب: `CREATE EXTENSION btree_gist;`

**النتيجة:** لو طلبان يصلان في نفس اللحظة، **قاعدة البيانات نفسها ترفض الثاني** مع `23P01 exclusion_violation`. لا race condition، لا تحقق يدوي.

**في API:**
```ts
try {
  await supabaseAdmin.from("appointments").insert(appointmentData);
} catch (err) {
  if (err.code === '23P01') {
    return NextResponse.json(
      { success: false, error: "Slot just got booked by someone else. Pick another time." },
      { status: 409 }
    );
  }
  throw err;
}
```

### 7.4 حجز مؤقت (Hold) لطلبات واتساب المعلّقة

```
عند وصول طلب واتساب:
  1. حجز مؤقت للـ slot → INSERT مع status='PENDING_REVIEW', hold_expires_at = now() + 24h
  2. في حالة سباق (`race condition`) نفس الـ exclusion constraint يحميك
  3. خلال 24h لم تُعتمد → حذف تلقائي
```

**⚠️ استثناء:** الـ `EXCLUDE` constraint يستثني فقط `SCHEDULED`/`CONFIRMED`. يجب أن **يتضمّن `PENDING_REVIEW`**:
```sql
WHERE (status IN ('SCHEDULED','CONFIRMED','PENDING_REVIEW'))
```

**مسح دوري:** cron كل ساعة يحذف `PENDING_REVIEW` منتهية.
```
DELETE FROM appointments
WHERE status = 'PENDING_REVIEW'
  AND hold_expires_at < NOW();
```

### 7.5 إصلاح حساب التوقيت (E18)

**المشكلة:** `availabilityService.ts:114-115` يستخدم `appointmentDate.getHours()`.

**الحل:**
```ts
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const clinicTz = await getClinicTimezone(clinicId);  // 'Africa/Cairo'

// Slot grid يُبنى في wall-clock العيادة
const slotStartLocal = timeToMinutes(startTime);  // 09:00 → 540

// المقارنة: حوّل الموعد إلى وقت العيادة
const aptStartLocal = toZonedTime(new Date(appointment.appointment_start), clinicTz);
const aptStartMinutes = aptStartLocal.getHours() * 60 + aptStartLocal.getMinutes();
```

**أو الأفضل:** استخدم `EXTRACT` من Postgres واختبر timezone-aware مباشرة.

### 7.6 إشعارات المواعيد (CRM)

عند إنشاء/تغيير/إلغاء موعد:

| الحدث | الإجراء |
|---|---|
| إنشاء | إرسال تأكيد واتساب فوري + إضافة `activity_log` |
| قبل 24 ساعة | تذكير (cron) — **إذا أعطى المريض موافقة** (`patient_consents`) |
| قبل ساعتين | تذكير SMS/واتساب |
| إلغاء | إشعار + تحديث `lifecycle_stage` إذا_first_visit |
| فحص سنوي | مهمة `follow_up_tasks` |

**⚠️ احترام الموافقة:** لا ترسل تذكيرات تسويقية لمن لم يوافق (`patient_consents`).

---

<a id="8-طبقة-crm-الت.Customer-Lifecycle"></a>
## 8. طبقة CRM — دورة حياة العميل (Patient Lifecycle)

### 8.1 لوحة CRM الرئيسية — **الشاشة الأكثر قيمة**

> **هذه الشاشة هي "CRM" الحقيقي.** كل الأرقام قابلة لل행을.

```
═══════════════════════════════════════════════════
            DOCTECH CRM — Pulse
═══════════════════════════════════════════════════

1. حالة القمع (Funnel)
   ┌──────────────────────────────────────────┐
   │ Leads (جديد)          23  ████████████   │
   │ Qualified (مؤهل)      15  ████████       │
   │ Booked (محجوز)         12  ██████         │
   │ Converted (مريض)       41  ██████████████ │
   │ Lost (مفقود)            4  ██             │
   └──────────────────────────────────────────┘
   معدل التحويل: 45.3%   |   متوسط وقت التحويل: 2.4 يوم

2. Vital Signs (المؤشرات الحياتية)
   ┌──────────────┬──────────────┬──────────────┐
   │ LTV          │ معدل الاحتفاظ │ Churn Risk   │
   │ 4,250 EGP    │ 68%          │ 12 مريض      │
   │ متوسط        │ سنوي         │ يحتاج متابعة │
   └──────────────┴──────────────┴──────────────┘

3. أكثر مصادر الفرز (Lead Sources)
   ┌─────────────────┬────────┬──────────┬──────────┐
   │ المصدر          │ Leads  │ Converted│ Rate     │
   │ WhatsApp        │ 45     │ 18       │ 40%      │
   │ Instagram       │ 28     │ 9        │ 32%      │
   │ إحالة مريض      │ 15     │ 11       │ 73% ⭐   │
   │ Walk-in         │ 12     │ 4        │ 33%      │
   │ Facebook        │ 8      │ 1        │ 12%      │
   └─────────────────┴────────┴──────────┴──────────┘

4. عملاء needing attention (أولوية)
   ┌─────────────────────────────────────────────────┐
   │ 🟥 VIP · Andreas · LTV 12,000 · آخر زيارة 6 شهور │
   │    💰 إعادة تنشيط: عرض فحص مجاني                  │
   │ 🟧 Diabetic · Fatima · آخر سكر 3 شهور · لم يأتِ   │
   │    📞 مهمة: اتصال متابعة (عاجل)                   │
   │ 🟨 ATRISK · Joseph · كان نشطاً · 4 شهور بدون زيارة │
   │    📅 اقتراح: عرض 20% على أول زيارة               │
   └─────────────────────────────────────────────────┘

5. Pipeline (بالأجراس)
   محادثة جديدة ──► تم التأكيد ──► كشف مجدول ──► كشف تم ──► متابعة
   ████ 5         ███ 4           ███ 8          ██████ 12    ████ 9
```

### 8.2 الـ Segments — الشرائح الذكية

**تعريفات جاهزة (تُحسب من البيانات):**
| Segment | التعريف | الاستخدام |
|---|---|---|
| `VIP` | LTV > 10,000 EGP | مواعيد أطول، عروض مميزة |
| `HIGH_VALUE_DORMANT` | LTV > 5,000 && لا زيارة > 180 يوم | **أولوية إعادة تنشيط** |
| `CHRONIC_CAREPATIENTS` | has chronic condition | متابعة دورية، قوائم تحاليل |
| `DIABETIC_UNCONTROLLED` | diabetic && آخر سكر > 180 يوم | تنبيه طبي + متابعة |
| `COSMETIC_INTERESTED` | skin/aesthetic procedures | تسويق تجميلي |
| `FOLLOW_UP_DUE` | has open `follow_up_tasks` | مهام اليوم |
| `BIRTHDAY_THIS_MONTH` | DOB في الشهر الحالي | تهنئة + عرض |
| `NO_SHOW_HISTORY` | NO_SHOW >= 3 | يتطلب تأكيد مسبق |
| `NEW_PATIENTS_30D` | أول زيارة < 30 يوم | **التجربة الأولى حاسمة** |

**التخصيص:** secretary يقدر يبني segment بـ conditions (مثلاً: `age > 40 AND tags includes 'DIABETIC' AND last_visit > 90 days`).

**التنفيذ:** `patient_segments` (محفوظ) + `segment_queries` (JSONB logic).

### 8.3 محرّك المهام التلقائي (Automation Engine)

**المهام التي تُولّد تلقائياً:**
| القاعدة | الشرط | المهمة | الأولوية |
|---|---|---|---|
| `FIRST_VISIT_FOLLOWUP` | أول visit + 3 أيام | "اتصال: كيف كانت تجربتك؟" | `MEDIUM` |
| `PROCEDURE_CHECKUP` | procedure + 7 أيام | "النتيجة؟ يحتاج مراجعة؟" | `HIGH` |
| `LAB_RESULT_READY` | lab received + 24 ساعة | "إرسال النتيجة" | `HIGH` |
| `MEDICATION_REFILL` | وصفة تنتهي + 3 أيام | "تجديد الوصفة" | `MEDIUM` |
| `CHRONIC_MONITORING` | chronic + لا زيارة > 60 يوم | "متابعة دورية" | `HIGH` |
| `ANNUAL_CHECKUP` | آخر فحص > 365 يوم | "فحص سنوي" | `LOW` |
| `DORMANT_WIN_BACK` | لا زيارة > 120 يوم + LTV > 1000 | "إعادة تنشيط بعرض" | `MEDIUM` |
| `BIRTHDAY_GREETING` | DOB + 7 أيام | "تهنئة" | `LOW` |
| `PRESCRIPTION_EXPIRED` | وصفة تجاوزت الصلاحية | "تجديد" | `MEDIUM` |
| `NO_SHOW_FOLLOWUP` | NO_SHOW | "إعادة جدولة" | `HIGH` |
| `REPEAT_VISIT` | procedure + التالي خلال أسبوعين | "متابعة ما إذا كنت مستمراً" | `MEDIUM` |

**التنفيذ:** `automation_rules` (JSONB conditions) + cron كل ساعة يجيب المهام المستحقة.

### 8.4 نظام التقييم (Reviews)

**`reviews`:**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `clinic_id` / `patient_id` | `TEXT FK` |
| `appointment_id` | `TEXT FK` nullable` |
| `overall_rating` | `INT` (1-5) |
| `wait_time_rating` / `doctor_rating` / `facility_rating` / `service_rating` | `INT` nullable` |
| `comment` | `TEXT` nullable` |
| `is_public` | `BOOLEAN` |
| `created_at` | `TIMESTAMPTZ` |

**⚠️ أرسل بعد الزيارة + 2 ساعة، مرة واحدة فقط لكل زيارة.**
**القيمة:** NPS (Net Promoter Score) + كشف مشاكل الخدمة مبكراً.

### 8.5 نظام الولاء (Loyalty)

**`loyalty_accounts`:**
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `clinic_id` / `patient_id` | `TEXT FK UNIQUE` |
| `points_balance` | `INT` |
| `lifetime_points` | `INT` |
| `tier` | `ENUM` (`BRONZE`, `SILVER`, `GOLD`, `PLATINUM`) |

**`loyalty_transactions`:** (كسب/إنفاق)
| Column | Type |
|---|---|
| `id` | `TEXT PK` |
| `account_id` | `TEXT FK` |
| `points` | `INT` (موجب/سالب) |
| `reason` | `TEXT` |
| `reference_type` / `reference_id` | `TEXT` nullable |

**الاستخدام:** كل 1000 نقطة = 50 EGP خصم. يخلق سبباً للعودة.

---

<a id="9-الواجهات-والصفحات-المطلوبة"></a>
## 9. الواجهات والصفحات المطلوبة

### 9.1 خريطة الصفحات الجديدة

**للمريض (`/en/secretary/patients/[id]`) — يضاف 5 تبويبات للـ 3 الحالية:**
```
1. General Info     (موجود — يُصلَح ليُحفظ فعلياً)
2. Timeline         (موجود — يُربط بالـ encounters الحقيقية)
3. Files & Scans    (موجود — يُصلَح لـ storage حقيقي)
4. 🆕 Clinical Records  — كل التشخيصات والوصفات والتحاليل
5. 🆕 Activity Timeline — سجل التفاعلات الموحّد
6. 🆕 Financial History — كل الفواتير والمدفوعات
7. 🆕 Tasks & Reminders — المهام القادمة
```

**للمالي (doctor):**
```
/en/doctor/finance                    (موجود — يُعاد بناؤه بالكامل)
/en/doctor/finance/invoices           🆕 إدارة الفواتير
/en/doctor/finance/expenses           🆕 تصنيف واضح ثابت/متغير
/en/doctor/finance/expenses/templates 🆕 المصروفات الثابتة المتكررة
/en/doctor/finance/cash-drawer        🆕 جلسات الخزينة
/en/doctor/finance/reports            🆕 تقارير مالية (أرباح، تعادل، ضريبة)
```

**للCRM (الجديد بالكامل — doctor + secretary):**
```
/en/doctor/crm                        🆕 لوحة CRM الرئيسية
/en/doctor/crm/leads                  🆕 العملاء المحتملون
/en/doctor/crm/leads/[id]             🆕 تفاصيل lead
/en/doctor/crm/pipeline               🆕 القمع (مرئي/kanban)
/en/doctor/crm/segments               🆕 الشرائح
/en/doctor/crm/segments/[id]          🆕 members
/en/doctor/crm/campaigns              🆕 الحملات
/en/doctor/crm/campaigns/[id]         🆕 محرر حملة
/en/doctor/crm/templates              🆕 قوالب الرسائل
/en/doctor/crm/tasks                  🆕 المهام
/en/doctor/crm/referrals              🆕 الإحالات
/en/doctor/crm/reviews                🆕 تقييمات المرضى
/en/doctor/crm/loyalty                🆕 الولاء
```

### 9.2 نموذج التصميم: إدارة المصروفات (توضيح الثابت/المتغير)

```
┌─────────────────────────────────────────────────────────────┐
│  [+ مصروف جديد]              🔍 ابحث...   [هذا الشهر ▾]   │
├─────────────────────────────────────────────────────────────┤
│  💰 إجمالي المصروفات هذا الشهر:  87,450 EGP                 │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │ ثابت 52,000  │ متغير 35,450 │ CAPEX 0      │              │
│  │ (59%)        │ (41%)        │              │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│  نوع البند          │ البند        │ المبلغ  │ التكرار  │     │
│ ────────────────────┼──────────────┼─────────┼──────────     │
│  🔒 ثابت            │ إيجار        │ 12,000  │ شهري 🔄  │ ⋮  │
│  🔒 ثابت            │ مرتبات       │ 8,500   │ شهري 🔄  │ ⋮  │
│  ⚡ شبه ثابت        │ كهرباء       │ 1,240   │ متغير    │ ⋮  │
│  📦 متغير           │ مستلزمات     │ 3,100   │ حسب الحاجة│ ⋮  │
│  🔬 متغير (COGS)    │ تحاليل       │ 4,200   │ حسب الحاجة│ ⋮  │
│  📈 متغير إداري     │ تسويق        │ 2,000   │ عند الحاجة│ ⋮  │
│  💸 ضريبة/رسوم      │ ضرائب        │ 5,900   │ —        │ ⋮  │
│  🎁 متغير           │ خصومات ممنوحة│ 3,500   │ —        │ ⋮  │
└─────────────────────────────────────────────────────────────┘
```

**النوافذ المنبثقة:**
- **مصروف ثابت** (نفس النموذج) — `🔁 التكرار` يفتح [شهري | أسبوعي | سنوي | مخصص] + يوم الاستحقاق + وضع النشر [تلقائي | needs موافقة]
- **مصروف متغير** — `النوع: [مستلزمات | تحاليل | إمداد | توصيل | تسويق | ضرائب | خصومات | استرداد]`

### 9.3 نموذج التصميم: بوابة الحجز (Scheduling)

```
┌─────────────────────────────────────────────────────────────┐
│  📅 Select Date: [الأحد 5 أكتوبر ▾]  ⏰ timezone: Africa/Cairo │
├─────────────────────────────────────────────────────────────┤
│  Dr. Ahmed  |  Morning 09:00–13:00  |  30 min per slot      │
│  ═══════════════════════════════════════════════             │
│   09:00   09:30   10:00   10:30   11:00   11:30   12:00     │
│   [مشفول] [متاح ] [متاح ] [محجوز] [متاح ] [متاح ] [متاح ]    │
│    ↑       ↑       ↑        ↑        ↑       ↑       ↑       │
│   #F3F4F6  #22C55E  #22C55E  #EF4444  #22C55E  #22C55E  #22C55E│
│                                                              │
│  Afternoon shift 16:00–20:00                                 │
│   16:00   16:30   17:00   17:30   18:00                    │
│   [متاح ] [متاح ] [متاح ] [متاح ] [متاح ]                   │
│                                                              │
│  🟡 Soft-hold (WhatsApp pending)                             │
│   19:00  [محجوز مؤقتاً — ينتهي 22:00 غداً]                  │
│                                                              │
│  🟦 Blocked (manual)                                         │
│   19:30  [محجوب — تدريب]                                    │
├─────────────────────────────────────────────────────────────┤
│  [← السابق]                      [التالي →]                  │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Wireframe: لوحة CRM (الجديدة)

```
┌─────────────────────────────────────────────────────────────┐
│  CRM Pulse          [هذا الشهر ▾]      [Last updated 2m ago] │
├─────────────────────────────────────────────────────────────┤
│  Leads 23 → Qualified 15 → Booked 12 → Converted 41 → Lost 4 │
│  ████████ 78% conversion from leads                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ LTV          │ Retention    │ Churn Risk   │ Revenue        │
│ 4,250 EGP    │ 68%          │ 12           │ 124,500 EGP    │
│ +8% ↑        │ +3% ↑        │ 🔴 3 urgent  │ +12% ↑         │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  Pipeline                                                        │
│  ┌────────────┬────────────┬────────────┬────────────┐         │
│  │ NEW (5)    │ CONTACTED  │ BOOKED (8) │ CONVERTED  │         │
│  ├────────────┼────────────┼────────────┼────────────┤         │
│  │ 🔴 Ahmed  │ 🟡 Sara   │ 🟢 Maria │ ✨ Fahma   │         │
│  │   2h ago   │   1d ago   │   3d ago  │   5d ago   │         │
│  │ 🟢 Joseph │ 🔴 Hoda   │ 🟢 Ali    │ ✨ Omar    │         │
│  │   4h ago   │   2d ago   │   1w ago  │   1w ago   │         │
│  └────────────┴────────────┴────────────┴────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  🔔 Needs attention (3)                                        │
│  🟥 VIP Andreas · last 6mo · LTV 12,000 → [Win-back offer]   │
│  🟧 Fatima · diabetic · glucose overdue → [📞 Call task]       │
│  🟨 Joseph · at-risk 4mo → [Book follow-up]                   │
├─────────────────────────────────────────────────────────────┤
│  Today's tasks (4)                                              │
│  ⏰ HIGH  Send lab results to Sara          [Complete] [Skip] │
│  ⏰ HIGH  Call Maria — procedure follow-up  [Complete] [Skip] │
│  📅 TODAY Birthday greeting: Omar            [Send]           │
│  📅 TODAY Confirm appointment: Hoda         [Confirm] [Cancel]│
└─────────────────────────────────────────────────────────────┘
```

---

<a id="10-الواتساب-والذكاء-الاصطناعي"></a>
## 10. الواتساب والذكاء الاصطناعي

### 10.1 الوضع الحالي

| الميزة | الحالة |
|---|---|
| Meta Cloud API client | `lib/whatsapp/metaClient.ts` — موجود |
| Webhook | موجود لكن **بلا تحقق توقيع (E1)** |
| Hermes AI agent | `lib/ai/hermesAgent.ts` — موجود |
| OpenRouter client | `lib/ai/openRouterClient.ts` — موجود |
| `OPENROUTER_API_KEY` | ❌ **غير موجود** → كل الردود من `generateSimulatedAIResponse` |
| `WHATSAPP_PHONE_NUMBER_ID` | ❌ **فارغ** |
| `WHATSAPP_ACCESS_TOKEN` | ❌ **فارغ** |
| جدولا `whatsapp_conversations` | ⚠️ **غير مستخدمة** — لا يقرأها ولا يكتبها كود تشغيلي |
| محادثة secretary | `secretary/whatsapp` — يحمّل localStorage |

### 10.2 Hermes AI — التحسينات المطلوبة

**اليوم:** يستخرج البيانات من نص عامية، ثم يجدول `PENDING_REVIEW`.

**ال improvements:**
1. **ربط بـ `leads`:** رسالة واتساب من رقم جديد → أنشئ `lead` تلقائياً (`source = WHATSAPP`) + `activity_log`، ولا تصل مباشرة لـ `patients`.
2. **التحقق من الهوية:** "هل أنت مسجل عندنا؟" — ابحث في `patients.phone`.
3. **كشف المتابعة:** طلب كشف دوري أو متابعة → مرشح لموعد.
4. **الردود متعددة اللغات:** العامية المصرية أولاً.
5. **fallback واضح:** عند فشل LLM → رسالة يدوية: "حاضر، هنتواصل معاك خلال ساعة".
6. **⚠️ لا ترسل رداً طبياً أبداً.** الـ AI يجمع ويحدد موعداً فقط. أي نص طبي من الـ LLM = **خطر قانوني**. القاعدة: "الردود الطبية من الطبيب فقط".

**استخراج الحقول (يؤكد الكود الحالي):**
`patientName`, `phone`, `requestedDate`, `requestedTime`, `symptoms`, `confidence`

### 10.3 WhatsApp → CRM — الربط الكامل

```
رسالة واردة
    ↓
verify signature (P0.1)
    ↓
هل الرقم موجود في patients؟
    ├─ نعم → حوّلها إلى محادثة → AI يقترح رد → سكرتير يراجع → إرسال
    └─ لا  → إنشاء lead جديد
              + source = WHATSAPP
              + activity_log = 'LEAD_CREATED'
              + follow_up_task = 'CALL_BACK' (priority HIGH)
              ↓
        Secretary ينظر → يؤهل → يحجز → patient's row يُنشأ
              → lead.converted_patient_id يُربط
              → lead.status = 'CONVERTED'
              → lead.converted_at = now()
```

**⚠️ الموافقة الإلزامية:** عند أول تواصل تسويقي، اطلب موافقة صريحة وإلا لا ترسل حملة.

### 10.4 Message Templates

| القالب | المتغيرات | يُرسل تلقائياً؟ |
|---|---|---|
| `APPOINTMENT_CONFIRMED` | `{{patient_name}}`, `{{date}}`, `{{time}}`, `{{doctor_name}}`, `{{clinic_address}}` | ✅ نعم |
| `APPOINTMENT_REMINDER_24H` | نفس | ✅ نعم (cron) |
| `APPOINTMENT_REMINDER_2H` | نفس | ✅ نعم |
| `APPOINTMENT_CANCELLED` | `{{patient_name}}`, `{{date}}`, `{{time}}` | ✅ نعم |
| `LAB_RESULTS_READY` | `{{patient_name}}`, `{{doctor_name}}` | ✅ نعم |
| `PRESCRIPTION_READY` | `{{patient_name}}`, `{{medicines}}` | ✅ نعم |
| `WELCOME_NEW_PATIENT` | `{{patient_name}}`, `{{clinic_name}}` | ✅ نعم |
| `LEAD_REPLY_CONFIRM` | `{{date}}`, `{{time}}` | ✅ نعم |
| `CAMPAIGN_OFFER` | `{{patient_name}}`, `{{offer}}` | ⚠️ **بموافقة فقط** |
| `BIRTHDAY_WISH` | `{{patient_name}}` | ⚠️ **بموافقة فقط** |
| `WIN_BACK_OFFER` | `{{patient_name}}`, `{{offer}}` | ⚠️ **بموافقة فقط** |
| `REACTIVATION` | `{{patient_name}}`, `{{months_away}}` | ⚠️ **بموافقة فقط** |

---

<a id="11-العربية-والـ-rtl-والنصوص"></a>
## 11. العربية و RTL والنصوص

### 11.1 تشخيص

| المشكلة | الموقع |
|---|---|
| `titleAr = title` | `ExpenseModal.tsx:49-50` — **العربية = الإنجليزية** |
| `patientNameAr = patients?.name` | `finance/transactions/route.ts:65` |
| `typeAr = apt.type \|\| "كشف"` | `finance/transactions/route.ts:68` |
| `typeAr = tx.type \|\| "خدمة طبية"` | `finance/transactions/route.ts:99` |
| `categoryNameEn: e.category, categoryNameAr: e.category` | `finance/expenses/route.ts:48-49` — **المفتاح الحرفي** |
| `isRTL` ternary في كل صفحة | ~30 صفحة |
| `"Sarah Jenkins • Al-Amal Clinic"` في header حي | `secretary/dashboard/page.tsx:42` |
| `"Dr. Ahmed Hossam"` fallback في الرسالة | `dataService.ts:166` |

**النتيجة:** النظام "يدعم العربية" شكلياً فقط. البيانات العربية إما فارغة أو نسخة من الإنجليزية.

### 11.2 الحل الصحيح — i18n حقيقي

**البنية المستهدفة:**
```
messages/
  en.json      (كامل — كل مفتاح)
  ar.json      (كامل — كل مفتاح)
```
**⚠️ اليوم 136 سطر فقط لكل لغة.** المطلوب: **~800+ مفتاح** لكل لغة.

**الاعتماد على `next-intl` (موجود):**
```ts
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');
export default withNextIntl(nextConfig);
```
```ts
// app/[locale]/layout.tsx — wrap with NextIntlClientProvider
```

**الاستخدام:**
```tsx
const t = useTranslations('finance.expenseCategory.RENT');
// → "Clinic Rent" / "إيجار العيادة"
```

**⚠️ لا تستخدم `isRTL ? ... : ...` في الكود.** هذا يفسد الـ i18n ويصعب الصيانة.

### 11.3 RTL الحقيقي

```tsx
// app/[locale]/layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

**Tailwind 4:**
```css
/* globals.css */
@layer base {
  [dir="rtl"] { text-align: right; }
  [dir="rtl"] .rtl-flip { transform: scaleX(-1); }
}
```

**أيقونات الاتجاه:** الأسهم، علامات التنقل، الأرقام (بعض الخطوط العربية).
```tsx
<ArrowRight className={isRTL ? "rotate-180" : ""} />
```

**التواريخ والأرقام:** `Intl.DateTimeFormat('ar-EG')` + `Intl.NumberFormat('ar-EG')` مع **أرقام هندية اختيارية**. للأرقام المالية، **الافضل اللاتينية** (`ar-EG-u-nu-latn`) لتجنب الالتباس في الفواتير.

### 11.4 النصوص الطبية بالعربية

**قاعدة بيانات أسماء الأدوية بالعربي (`prescription_items.drug_name_ar`)** — مطلوب، لأن الطبيب يكتب بالعربي والمريض يقرأ الوصفة.

**ICD-10 بالعربي:** يُفضَّل توفير قائمة ترجمة عربية موحدة، لكن يمكن استخدام الاسم الإنجليزي مع الكود.

---

<a id="12-الاختبارات-والجودة"></a>
## 12. الاختبارات والجودة

### 12.1 الوضع الحالي

**لا يوجد أي framework اختبار.** `scripts/test-runner.mjs` قد يكون runner بسيط بدون assertions.

`package.json` scripts: `dev`, `build`, `start`, `lint` — **لا `test`، لا `typecheck`**.

### 12.2 المطلوب

**أضف:**
```
devDependencies:
  - vitest          (unit + integration)
  - @playwright/test (E2E)
  - @vitest/coverage-v8
  - supertest       (API testing)
  - msw            (mock service worker)

scripts:
  - "test": "vitest run"
  - "test:watch": "vitest"
  - "test:e2e": "playwright test"
  - "test:coverage": "vitest run --coverage"
  - "typecheck": "tsc --noEmit"
  - "lint": "next lint"
```

### 12.3 تغطية الاختبارات المطلوبة

| المستوى | التغطية | الأولوية |
|---|---|---|
| **Unit** | `lib/money.ts`, `availabilityService`, `permissions`, `P&L calc` | **عالية** |
| **Integration** | كل API route مع mock DB | **عالية** |
| **E2E** | التدفقات الحرجة | **عالية** |

**اختبارات حرجة يجب كتابتها:**

```ts
// lib/money.test.ts
describe('money', () => {
  it('no floating point errors', () => {
    expect(fromPiastres(toPiastres(0.1) + toPiastres(0.2)))
      .toBe(0.3);  // يمر مع integers
  });
  it('rejects negative invoices', ...);
});

// lib/permissions.test.ts
describe('can()', () => {
  it('doctor has all permissions', ...);
  it('secretary cannot access finance.profit', ...);
  it('"all" expands to everything', ...);
});

// availabilityService.test.ts
describe('slots', () => {
  it('generates correct slot count', ...);
  it('respects clinic timezone (not server tz)', ...);   // E18
  it('excludes CANCELLED appointments', ...);
  it('handles PENDING_REVIEW soft holds with expiry', ...); // E19
  it('handles schedule exceptions (leave)', ...);
  it('handles multiple shifts per day', ...);
});

// finance P&L tests
describe('P&L', () => {
  it('includes LAB in COGS', ...);                        // E11
  it('does not fabricate revenue split', ...);             // E10
  it('handles zero revenue without NaN', ...);             // E13
  it('amortizes annual fixed costs monthly', ...);
  it('calculates break-even correctly', ...);
  it('shows secretary expenses in doctor P&L', ...);       // E9
  it('calculates discounts and refunds correctly', ...);

// security
describe('auth', () => {
  it('rejects webhook without valid signature', ...);     // E1
  it('rejects expenses DELETE without session', ...);      // E5
  it('ignores clinicId query param (uses session)', ...);  // E6
  it('blocks secretary from doctor finance.profit', ...);
  it('prevents cross-clinic data access', ...);
});
```

### 12.4 E2E Scenarios

| # | السيناريو |
|---|---|
| 1 | دخول الطبيب ← إنشاء سكرتيرة ← منح صلاحية ← دخول السكرتيرة ترى الواجهة الممنوحة فقط |
| 2 | Secretary يحاول فتح `/doctor/finance` → **يُمنع** |
| 3 | حجز موعد → حجز نفس الموعد من نافذة ثانية → **فشل 409** |
| 4 | طلب واتساب → lead ينشأ → سكرتير يؤهل → يحجز → يتحول لمريض |
| 5 | إنشاء فاتورة بخصم → دفع جزئي → الباقي → استرداد |
| 6 | إنشاء مصروف ثابت → ينشأ تلقائياً الشهر القادم |
| 7 | وصفة لمريض حساس من بنسلين → **تحذير** |
| 8 | مريض معرّض لـ churn → يظهر في CRM Needs Attention |

---

<a id="13-النشر-والإنتاج"></a>
## 13. النشر والإنتاج

### 13.1 متغيرات البيئة المطلوبة

```env
# ============ Database ============
DATABASE_URL=                    # ← موجود؟ تحقق
DIRECT_URL=
# ⛔ لا تستخدم NODE_TLS_REJECT_UNAUTHORIZED

# ============ Clerk ============
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# ============ Supabase ============
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=             # service_role — server only

# ============ WhatsApp ============
WHATSAPP_PHONE_NUMBER_ID=        # ← فارغ حالياً
WHATSAPP_ACCESS_TOKEN=           # ← فارغ حالياً
WHATSAPP_WEBHOOK_VERIFY_TOKEN=   # ⚠️ غير مبدّل
WHATSAPP_APP_SECRET=             # 🆕 للتحقق من التوقيع

# ============ AI ============
OPENROUTER_API_KEY=              # 🆕 ← غير موجود
OPENROUTER_PRIMARY_MODEL=
OPENROUTER_FALLBACK_MODEL=

# ============ Security ============
ADMIN_SETUP_SECRET=              # 🆕 لحماية setup route
NODE_ENV=production
```

### 13.2 Checklist قبل الإنتاج

| # | البند | |
|---|---|---|
| 1 | `npx tsc --noEmit` — 0 أخطاء | ☐ |
| 2 | `npm run lint` — 0 أخطاء | ☐ |
| 3 | `npm run test` — كلها تمر | ☐ |
| 4 | `npm run build` — ينجح | ☐ |
| 5 | RLS policies على كل الجداول | ☐ |
| 6 | Webhook signature verification | ☐ |
| 7 | `setup-doctech` محمي أو محذوف | ☐ |
| 8 | لا أسرار في الكود | ☐ |
| 9 | لا `?clinicId=` fallback | ☐ |
| 10 | RLS enabled على service role paths | ☐ |
| 11 | `.env.local` **غير** في git | ☐ |
| 12 | Error tracking (Sentry) | ☐ |
| 13 | Database backups | ☐ |
| 14 | Connection pooling (Supabase pooler) | ☐ |
| 15 | Custom domain + SSL | ☐ |

---

<a id="14-خارطة-التنفيذ-المراحل"></a>
## 14. خارطة التنفيذ — المراحل

> **القاعدة: لا مرحلة تبدأ قبل إنهاء التي قبلها. لا تحويل CRM قبل المرحلة 2.**

### المرحلة 0 — إصلاحات حرجة (P0) ⏱️ 3–5 أيام

| # | المهمة | الملفات |
|---|---|---|
| 0.1 | Webhook signature verification | `api/whatsapp/webhook/route.ts` |
| 0.2 | تأمين setup route + حذف TLS override + حذف كلمة المرور | `api/admin/setup-doctech/route.ts` |
| 0.3 | `lib/apiAuth.ts` + `requireSession` + `requirePermission` | 🆕 `lib/apiAuth.ts` |
| 0.4 | حذف `?clinicId=` fallback من كل routes | 7+ routes |
| 0.5 | `expenses DELETE` محمي | `api/finance/expenses/route.ts` |
| 0.6 | `SUPPLIED permissions` في `getClinicSession` | `lib/clinicAuth.ts` |

**🚧 بوابة الانتقال:** لا شيء ينتقل للمرحلة 1 قبل 0.1 و 0.2.

---

### المرحلة 1 — الأساس (Data Foundation) ⏱️ 1–2 أسبوع

| # | المهمة |
|---|---|
| 1.1 | SQL migrations (`supabase/migrations/`) |
| 1.2 | إنشاء الجداول المفقودة: `doctor_schedules`, `internal_messages` |
| 1.3 | تحويل `amount` → `BIGINT` + `lib/money.ts` |
| 1.4 | RLS policies على كل الجداول |
| 1.5 | حذف كل mock data من `dataService.ts` و `notificationService.ts` |
| 1.6 | حذف `stores/authStore.ts` + `scripts/*.mjs` |
| 1.7 | تصحيح `types/index.ts` — نظام واحد |
| 1.8 | حذف `prisma/` (خيار B) |
| 1.9 | إعداد Vitest + أول 50 اختبار |

**🚧 بوابة الانتقال:** كل API route إما جديد مع auth أو محذوف. صفر mock.

---

### المرحلة 2 — الفوترة والمالية الكاملة ⏱️ 2–3 أسابيع

| # | المهمة | يحل |
|---|---|---|
| 2.1 | `expense_categories` جدول + seed + UI selector | E22 |
| 2.2 | `expense_templates` + محرك التوليد | وعد `isRecurring` |
| 2.3 | `invoices` + `invoice_items` + ترقيم تسلسلي | E20 |
| 2.4 | `discounts` + `coupons` | خصم |
| 2.5 | `refunds` + `is_refund` | E21 |
| 2.6 | `cash_sessions` + `cash_movements` | خزينة حقيقية |
| 2.7 | إعادة بناء P&L (7 أقسام) | E10, E11, E13 |
| 2.8 | قسم نقطة التعادل | **قيمة CRM** |
| 2.9 | **مرفق: جدول المصروفات الثابتة شهرياً** | **الطلب الأساسي** |
| 2.10 | تصدير PDF للفواتير | |

**🚧 بوابة الانتقال:** P&L مبني 100% على بيانات حقيقية. صفر أرقام ثابتة.

---

### المرحلة 3 — الصلاحيات (RBAC) ⏱️ 1 أسبوع

| # | المهمة |
|---|---|
| 3.1 | جداول `permissions`, `roles`, `secretary_permissions` |
| 3.2 | 28 صلاحية + 6 أدوار + مصفوفة |
| 3.3 | `lib/permissions.ts` — `can()` / `requirePermission()` |
| 3.4 | `PermissionGate` component |
| 3.5 | فلترة السايد بار + الصفحات |
| 3.6 | `PUT`/`DELETE` في `/api/doctor/secretaries` |
| 3.7 | إصلاح duplication email scope (per-clinic) |
| 3.8 | توحيد `status` enum |

**🚧 بوابة الانتقال:** سكرتيرة بـ `permissions: []` لا يرى أي شيء. **مُختبر آلياً.**

---

### المرحلة 4 — الجدولة ⏱️ 1.5 أسبوع

| # | المهمة |
|---|---|
| 4.1 | `doctor_shifts` (ورديات متعددة) + `schedule_exceptions` + `slot_blocks` |
| 4.2 | `appointment_start`/`appointment_end` (timestamptz) + `clinic_timezone` |
| 4.3 | `EXCLUDE` constraint — منع ازدواجية حقيقي | E7 |
| 4.4 | إصلاح timezone في `availabilityService` | E18 |
| 4.5 | `PENDING_REVIEW` + `hold_expires_at` + cron تنظيف | E19 |
| 4.6 | إعادة بناء واجهة الـ slots (ألوان، حجز مؤقت، محجوب) |
| 4.7 | إشعارات المواعيد (تأكيد، تذكير، إلغاء) |

**🚧 بوابة الانتقال:** حجزان متزامنان → واحد فقط ينجح. مُختبر آلياً.

---

### المرحلة 5 — الـ EMR الحقيقي ⏱️ 2–3 أسابيع

| # | المهمة | يحل |
|---|---|---|
| 5.1 | `encounters` + توقيع رقمي | يفصل التقرز عن السريري |
| 5.2 | `diagnoses` (ICD-10) | |
| 5.3 | `patient_chronic_conditions` | ادعاء README |
| 5.4 | `patient_allergies` + **تحذير عند الوصفة** | ⚠️ سلامة |
| 5.5 | `prescriptions` + `prescription_items` (عربي) | يحل E12 جزئياً |
| 5.6 | `vital_readings` | من JSX إلى جدول |
| 5.7 | `lab_orders` + `lab_results` (مع `ref_low`/`ref_high`) | |
| 5.8 | `imaging_studies` | |
| 5.9 | **Supabase Storage** للمرفقات (bucket + signed URLs) | **صفر storage حالياً** |
| 5.10 | إعادة بناء `PatientTimeline.tsx` على البيانات الحقيقية | |
| 5.11 | `audit_log` | ⚠️ إلزامي |

**🚧 بوابة الانتقال:** كل التفاصيل السريرية في القاعدة، صفر نص داخل JSX.

---

### المرحلة 6 — CRM (الطبقة الجديدة) ⏱️ 3–4 أسابيع

| # | المهمة |
|---|---|
| 6.1 | `leads` + `lead_sources` + source attribution |
| 6.2 | `patient_lifecycle_stage` + history |
| 6.3 | `referrals` + مكافآت الإحالة |
| 6.4 | `patient_tags` + tags تلقائية |
| 6.5 | `activity_log` — سجل موحّد **← الأساس** |
| 6.6 | `follow_up_tasks` + قواعد التوليد التلقائي |
| 6.7 | `segments` + شرائح جاهزة |
| 6.8 | `campaigns` + `message_templates` + recipients |
| 6.9 | `reviews` + NPS |
| 6.10 | `loyalty_accounts` + transactions |
| 6.11 | **لوحة CRM الرئيسية** (`/doctor/crm`) |
| 6.12 | صفحات Leads / Pipeline / Segments / Campaigns / Tasks |
| 6.13 | `patient_consents` + احترامها |
| 6.14 | حساب LTV لكل مريض |

**🚧 بوابة الانتقال:** لوحة CRM تعمل ببيانات حقيقية.

---

### المرحلة 7 — الواتساب والذكاء الاصطناعي ⏱️ 1.5 أسبوع

| # | المهمة |
|---|---|
| 7.1 | تفعيل `whatsapp_conversations` + `whatsapp_messages` (مهملة) |
| 7.2 | تخزين المحادثات في DB (لا localStorage) |
| 7.3 | Hermes → `leads` + `activity_log` + task |
| 7.4 | قوالب الرسائل + متغيرات |
| 7.5 | موافقة marketing + احترامها |
| 7.6 | Campaign runner + tracking |
| 7.7 | إضافة `OPENROUTER_API_KEY` + نموذج حقيقي |
| 7.8 | **قاعدة: لا رد طبي من AI** |

**🚧 بوابة الانتقال:** حملة تجريبية، opt-out يعمل.

---

### المرحلة 8 — i18n و UX ⏱️ 1 أسبوع

| # | المهمة |
|---|---|
| 8.1 | `messages/ar.json` كامل (~800 مفتاح) |
| 8.2 | حذف `isRTL ? :` من كل الكود |
| 8.3 | `dir="rtl"` حقيقي |
| 8.4 | `Intl.NumberFormat('ar-EG')` للمال |
| 8.5 | توحيد `status` enums |
| 8.6 | مراجعة UX للـ 3 صفحات المالية |

---

### المرحلة 9 — الجاهزية للإنتاج ⏱️ 1 أسبوع

| # | المهمة |
|---|---|
| 9.0 | **تطبيق كل ملفات الترحيل يدوياً على Supabase** (`supabase/migrations/0000` → `0006` بالترتيب) — الخطوة اليدوية الوحيدة المؤجَّلة من المراحل 1–3. لا يوجد `DATABASE_URL`/`Supabase CLI` في البيئة الحالية، وكل استعلام على جدول جديد يحاول الآن توليد خطأ «apply migration» بدل 500. |
| 9.1 | Playwright E2E (8 سيناريوهات) |
| 9.2 | Sentry + error tracking |
| 9.3 | Analytics |
| 9.4 | Data backup |
| 9.5 | Full security audit |
| 9.6 | Performance (Lighthouse) |
| 9.7 | Vercel production build + domain |

> **ملاحظة:** طلب المالك (2026): تُجمَّع كل الخطوات اليدوية (تطبيق الترحيلات وتعبئة أسرار البيئة) في هذه المرحلة الأخيرة فقط؛ أثناء التنفيذ تُترك الباك-إند على وضع التدهور الآمن (`unavailable/503`) ولا تُطبَّق أي ترحيلات مباشرة على القاعدة.

---

<a id="15-ملحق-جدول-التدقيق-الكامل"></a>
## 15. ملحق — جدول التدقيق الكامل

### 15.1 ملخص الأخطاء

| # | الخطأ | الخطورة | المرحلة |
|---|---|---|---|
| E1 | Webhook بلا توقيع | 🔴 حرجة | 0 |
| E2 | TLS verification معطّل | 🔴 حرجة | 0 |
| E3 | كلمة مرور مكشوفة | 🔴 حرجة | 0 |
| E4 | setup route بلا auth | 🔴 حرجة | 0 |
| E5 | expenses DELETE بلا auth | 🔴 حرجة | 0 |
| E6 | `?clinicId=` bypass | 🔴 حرجة | 0 |
| E7 | لا منع ازدواجية | 🔴 حرجة | 4 |
| E8 | لا permissions في الجلسة | 🔴 حرجة | 0/3 |
| E9 | مصروفات السكرتيرة مخفية | 🔴 عالية | 2 |
| E10 | P&L بتقسيم ثابت 65/22/13 | 🔴 عالية | 2 |
| E11 | LAB مفقودة من P&L | 🟠 متوسطة | 2 |
| E12 | `titleAr = title` | 🟠 متوسطة | 5/8 |
| E13 | قسمة على صفر → NaN% | 🟡 منخفضة | 2 |
| E14 | لا guard على النسبة | 🟡 منخفضة | 2 |
| E15 | id expense لا يطابق السيرفر | 🟠 متوسطة | 2 |
| E16 | إيرادات يدوية تضيع | 🟠 متوسطة | 2 |
| E17 | تعديل/حذف الطاقم معطّل | 🟠 متوسطة | 3 |
| E18 | timezone mismatch | 🔴 عالية | 4 |
| E19 | PENDING_REVIEW يحجز للأبد | 🟠 متوسطة | 4 |
| E20 | لا ترقيم فواتير | 🟠 متوسطة | 2 |
| E21 | لا خصم ولا استرداد | 🟠 متوسطة | 2 |
| E22 | 4 قوائم تصنيف متناقضة | 🟡 منخفضة | 2 |
| E23 | `cln-001` ثابت | 🟠 متوسطة | 1 |
| E24 | BroadcastChannel عالمي | 🟡 منخفضة | 1 |
| E25 | types ميتة | 🟡 منخفضة | 1 |

### 15.2 عدد البراچ والواجهات

| البند | العدد | ملاحظات |
|---|---|---|
| صفحات | 48 | منها ~15 mock |
| API routes | 28 | منها 7 فقط DB-backed |
| جداول DB | 7 | 7 أخرى مستخدمة وغير منشأة |
| خطوط ثنائية | ~45,000 | `tsconfig.tsbuildinfo` |
| ملفات ميتة | ~25 | scripts, prisma, authStore |

### 15.3 Decisions Required قبل البدء

| القرار | الخيارات | التوصية |
|---|---|---|
| Prisma أم Supabase REST | (أ) اعتمد Prisma (ب) Supabase REST | **(ب)** — RLS مجانية، المشروع REST أصلاً |
| `{clinicId}` fallback | (أ) احذف (ب) validation في DB | **(أ)** ثم (ب) كطبقة ثانية |
| Supabase Auth أم Clerk | (أ) Clerk (ب) Supabase Auth | **(أ)** — شغال، لا تغيّر |
| dinero: float أم int | (أ) `DOUBLE PRECISION` (ب) `BIGINT` قروش | **(ب)** — إلزامي محاسبياً |
| RLS | (أ) Supabase RLS (ب) app-level فقط | **(أ) + (ب)** |
| أصوات AI | (أ) LLM حقيقي (ب) FAQ | **(أ)** مع موافقة |

---

## 🎯 الخطوة التالية المقترحة

**ابدأ بالمرحلة 0** — 6 مهام صغيرة، 3–5 أيام. بعدها يصبح المشروع آمناً وقابلاً للنشر على الإنترنت.

ثم **المرحلة 1** (الأساس) قبل أي شيء آخر — لأن CRM على أساس مكسور = CRM مكسور.

**أخبرني من أين تريد أن نبدأ.**

---

---