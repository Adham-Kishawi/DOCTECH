# 🏥 DOCTECH — الدليل الشامل وتقرير حالة المشروع (Project Progress & System Specs)

> **DOCTECH:** نظام سحابي متكامل لإدارة المراكز الطبية والعيادات المتعددة (Multi-Tenant Clinic Management OS) مصمم ومبني لإعادة البيع والتسليم المباشر للأطباء والعيادات.

---

## 📌 1. روابط ومسارات المشروع (Project Info)

* **المستودع الرسمي (GitHub):** [https://github.com/Adham-Kishawi/DOCTECH](https://github.com/Adham-Kishawi/DOCTECH)
* **المسار في بيئة العمل:** `D:\FULL-PROJECTS\DOCTECK` (محدث ومتزامن 100%)
* **الفرع الأساسي:** `main`
* **الحالة الحالية:** إنجاز **المراحل 1 و 2 و 3 و 4 و 5 بالكامل** — بناء وتطوير الـ **33 شاشة**، تطبيق الهوية البصرية واللوجو للوضعين (Dark/Light)، حماية المسارات (Auth Guards)، التواصل اللحظي واستدعاء السكرتيرة، وربط مسارات الـ API مع قاعدة بيانات Supabase.

---

## 🔑 2. بيانات الحسابات المعتمدة للدخول والتجربة (Accounts & Credentials)

| الحساب | البريد الإلكتروني | كلمة المرور | الصلاحيات والدور | الرابط المباشر |
|---|---|---|---|---|
| **الطبيب (Doctor / Admin Lead)** | `doctor@doctech.com` | `password123` | إدارة العيادة، الكشوفات، التقارير الطبية، الروشتات، دعوة وإدارة السكرتارية، واستدعاء الاستقبال. | [فتح لوحة الطبيب](http://localhost:3000/en/doctor/dashboard) |
| **السكرتيرة (Secretary / Front Desk)** | `secretary@doctech.com` | `password123` | حجز وإدارة المواعيد CRUD، سجل المرضى EMR، فرز التقارير، محادثات الواتساب، والتواصل مع الطبيب. | [فتح لوحة السكرتيرة](http://localhost:3000/en/secretary/dashboard) |

> 💡 **ميزة الدخول السريع (1-Click Demo):** يمكنك في صفحة تسجيل الدخول [`/sign-in`](http://localhost:3000/en/sign-in) الضغط على زر **Doctor View** أو **Secretary View** للدخول المباشر وإنشاء جلسة صالحة فوراً.

---

## 🎨 3. الهوية البصرية واللوجو المعتمد (Brand Guidelines & Logo Concept)

### أ. فكرة اللوجو (Connected Workflow):
اللوجو يدمج حرفي **D** (Doc) و **T** (Tech) عبر مسار تدفق متصل:
1. **العقدة الخضراء (Healthcare Teal Node):** في الزاوية العلوية اليسرى (`#36ADA3`) ترمز للرعاية الصحية.
2. **الخط الرابط (Connector Bar):** يربط العقدة بمسار التدفق (`#36ADA3`).
3. **الأشكال الثلاثية المنحنية (Three Curved Segments):** تشكل الإطار العام للحرف وتتغير ألوانها بمرونة حسب المظهر.

### ب. اللوجو في الوضع الفاتح والداكن (Dark & Light Mode):
* **الوضع الفاتح (Light Mode):**
  * الأشكال المنحنية: `DOCTECH BLUE` (`#3368A0`)
  * العقدة والخط الرابط: `HEALTHCARE TEAL` (`#36ADA3`)
  * النص `DOCTECH`: كحلي داكن (`#3368A0`)
* **الوضع الليلي (Dark Mode):**
  * الأشكال المنحنية: **أبيض ناصع (`#FFFFFF`)**
  * العقدة والخط الرابط: `HEALTHCARE TEAL` (`#36ADA3`)
  * النص `DOCTECH`: **أبيض ناصع (`#FFFFFF`)**
  * الخلفيات: كحلي داكن فاخر (`#0B131E` و `#131E2E`)
* **زر التبديل:** مكون [`ThemeToggle.tsx`](file:///D:/FULL-PROJECTS/DOCTECK/components/shared/ThemeToggle.tsx) متاح في كافة الهيدرات.

---

## 🔒 4. حماية المسارات وإدارة الجلسات (Auth Guards & Session Security)

* **منع الدخول غير المصرح به:** تم تطبيق [`AuthGuard.tsx`](file:///D:/FULL-PROJECTS/DOCTECK/components/auth/AuthGuard.tsx) على كافة مسارات الطبيب والسكرتيرة. أي محاولة لفتح أي صفحة بدون جلسة مسجلة يعيد التوجيه فوراً إلى `/[locale]/sign-in`.
* **تسجيل الخروج (Sign Out):** قائمة المستخدم [`UserMenu.tsx`](file:///D:/FULL-PROJECTS/DOCTECK/components/layout/UserMenu.tsx) تتيح تسجيل الخروج ومسح الكوكيز والـ LocalStorage فوراً.

---

## ⚡ 5. نظام الاستدعاء والتواصل اللحظي بالمنطق البشري (Human Logic Real-Time)

* **استدعاء الطبيب للسكرتيرة (Doctor Summons Secretary):**
  * زر أحمر بارز في رأس شاشة الطبيب: `🚨 استدعاء السكرتيرة`.
  * يطلق **نافذة عاجلة ملء الشاشة** مع **جرس تنبيه صوتي (Audio Chime)** في شاشة السكرتيرة فوراً عبر `BroadcastChannel` لتنبيهها للحضور فوراً لغرفة الكشف.
* **تنبيه السكرتيرة للطبيب (Secretary Discreet Note to Doctor):**
  * زر في شاشة السكرتيرة: `تنبيه هادئ للطبيب`.
  * يرسل ملاحظة تظهر كـ **شريط إشعار علوي راقٍ ومخفف** في شاشة الطبيب دون صوت مزعج للحفاظ على هدوء غرفة الكشف وراحة المريض.
* **التزامن اللحظي للرسائل (Live Chat Sync):**
  * أي رسالة ترسل في شات الطبيب تظهر في نفس اللحظة في شات السكرتيرة دون الحاجة لعمل Refresh.

---

## 🔄 6. نموذج تسليم النظام (B2B Clinic Handover Workflow)

* **إلغاء التسجيل العام للأطباء (Public Sign-Up Removed):** العيادات تستلم النظام مجهزاً بحساب الطبيب المالك مباشرة.
* **إدارة وتعيين السكرتارية:** الطبيب يمتلك صلاحية دعوة وتعيين طاقم السكرتارية من داخل لوحة التحكم (`/doctor/team/invite`).

---

## 🗄️ 7. كيفية إضافة طبيب وعيادة جديدة في قاعدة البيانات (Adding a Doctor to DB)

### الطريقة 1: عبر سكريبت الـ CLI السريع
نفذ الأمر التالي في التيرمينال:
```bash
node scripts/seed-doctor.mjs --name "Dr. Tarek Omar" --email "tarek@clinic.com" --specialty "Cardiology" --clinic "Al-Amal Clinic"
```

### الطريقة 2: عبر لوحة تحكم Supabase Dashboard (SQL Editor)
1. ادخل إلى مشروعك على [Supabase](https://supabase.com/dashboard).
2. افتح **SQL Editor** ونفّذ الكود التالي:
```sql
-- 1. إنشاء العيادة
INSERT INTO "Clinic" ("id", "name", "slug", "phone", "address")
VALUES ('cln-001', 'Al-Amal Specialized Clinic', 'al-amal', '+20 100 123 4567', 'Cairo, Egypt');

-- 2. إنشاء حساب الطبيب المالك
INSERT INTO "User" ("id", "email", "name", "role", "clinicId")
VALUES ('usr-doc-001', 'doctor@doctech.com', 'Dr. Ahmed Hossam', 'DOCTOR', 'cln-001');
```

---

## 🌐 8. ربط مسارات الـ API مع قاعدة البيانات (Supabase API Layer)

تم بناء المسارات التالية في مجلد `app/api/`:
* `GET /api/appointments` & `POST /api/appointments`: جلب وحجز وإدارة المواعيد.
* `GET /api/patients` & `POST /api/patients`: جلب والبحث عن المرضى وتسجيل ملف جديد.
* `GET /api/reports` & `PATCH /api/reports`: فرز تقارير المرضى وإرسال الروشتات وقرار الطبيب.
* ملف الخدمة المباشر: [`lib/dataService.ts`](file:///D:/FULL-PROJECTS/DOCTECK/lib/dataService.ts).

---

## 🧪 9. تقرير الاختبار الشامل (QA Report)

```text
==========================================
  DOCTECH FULL ROUTE & UI AUDIT TESTER   
==========================================
Total Routes Tested: 58 (29 EN + 29 AR)
Passed: 58 (100% ✅)
Failed: 0 (0% ❌)
Production Build: ✅ npm run build passed with 0 errors
GitHub Repository: ✅ All changes pushed to origin/main
==========================================
```

---

## 📋 10. قائمة المهام وخريطة الطريق للمراحل القادمة (Prioritized Roadmap TO-DO)

1. [x] **المرحلة 1:** بناء وتصميم الـ 33 شاشة كاملة (Doctor + Secretary + Auth).
2. [x] **المرحلة 2:** تطبيق الهوية البصرية الرسمية (Vector Logo + Dark/Light Mode + Brand Colors).
3. [x] **المرحلة 3:** حماية المسارات (Auth Guards) ونظام الاستدعاء والتواصل اللحظي.
4. [x] **المرحلة 4:** تخصيص تجربة B2B Handover وحذف صفحة الـ Public Sign-up.
5. [x] **المرحلة 5:** تفعيل الـ API Endpoints وخدمات قاعدة البيانات (Supabase + Prisma).
6. [ ] **المرحلة 6 (الخطوة القادمة):** الربط مع واتساب السحابي الحقيقي (Meta WhatsApp Business Cloud API & Webhooks).
7. [ ] **المرحلة 7 (خطوة مؤجلة):** اختيار نموذج الذكاء الاصطناعي (Hermes 3 / Gemini / DeepSeek) وبناء وتدريب الوكيل الذكي للعيادة (AI Clinical & Booking Agent).
8. [ ] **المرحلة 8:** النشر والتشغيل النهائي على Vercel وربط الدومين المخصص.