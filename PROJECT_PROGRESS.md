# 🏥 DOCTECH MVP — تقرير المشروع وحالة الإنجاز الشاملة (Brand Identity & Real-Time Ready)

> **DOCTECH:** نظام سحابي متكامل لإدارة العيادات والمراكز الطبية المتعددة (Multi-Tenant Clinic Management OS) مصمم ومبني لإعادة البيع والتسليم المباشر للأطباء والعيادات.

---

## 🔑 1. بيانات الحسابات الجاهزة للتجربة (Demo & Admin Credentials)

### 🩺 أ. حساب الطبيب (Doctor / Admin Lead):
* **البريد الإلكتروني:** `doctor@doctech.com`
* **كلمة المرور:** `password123` (أو زر 1-Click Doctor Demo)
* **الصلاحيات:** وصول كامل لإدارة العيادة، الكشوفات، تقارير المرضى، الروشتات، دعوة وإدارة السكرتارية، واستدعاء الاستقبال.
* **الرابط المباشر:** [http://localhost:3000/en/doctor/dashboard](http://localhost:3000/en/doctor/dashboard)

### 👩‍💼 ب. حساب السكرتيرة (Secretary / Front Desk):
* **البريد الإلكتروني:** `secretary@doctech.com`
* **كلمة المرور:** `password123` (أو زر 1-Click Secretary Demo)
* **الصلاحيات:** حجز وإدارة المواعيد CRUD، سجل المرضى EMR، فرز التقارير، محادثات الواتساب، والتواصل مع الطبيب.
* **الرابط المباشر:** [http://localhost:3000/en/secretary/dashboard](http://localhost:3000/en/secretary/dashboard)

---

## 🎨 2. تطبيق الهوية البصرية واللوجو المعتمد (Brand Guidelines)

* **اللوجو الرسمي (Exact Vector SVG):** تم رسم وبناء مكون `<Logo />` بمتجهات SVG مطابقة للأشكال الثلاثية المنحنية مع العقدة الخضراء المتصلة وكتابة `DOCTECH` بدقة متناهية.
* **الألوان الرسمية المعتمدة:**
  * `DOCTECH BLUE`: `#3368A0`
  * `DARK BLUE`: `#285783`
  * `HEALTHCARE TEAL`: `#36ADA3`
  * `SOFT ACCENT`: `#C8DFDB`
  * `WARM SUPPORT`: `#F2EFE7`
* **الوضع الليلي (Dark Mode):** دعم كامل للـ Dark Mode مع زر التبديل `ThemeToggle`.

---

## 🔄 3. تعديل دورة العمل (B2B Clinic Handover Workflow)

* **إلغاء التسجيل العام للأطباء (Public Doctor Sign-Up):** بما أن نموذج العمل يعتمد على تسليم النظام جاهزاً للعيادة بعد تزويد حساب الطبيب، تم إلغاء التسجيل المفتوح وتوجيه الأطباء مباشرة لتسجيل الدخول.
* **إدارة السكرتارية من الداخل:** الطبيب يقوم بدعوة وتفعيل حسابات السكرتارية من داخل لوحة التحكم (`/doctor/team/invite`).

---

## 🗄️ 4. كيفية إضافة طبيب جديد في قاعدة البيانات (Adding a Doctor to DB)

يمكنك إضافة طبيب وعيادة جديدة بأحد الطرق التالية:

### الطريقة 1: عبر سكريبت الـ CLI السريع
قم بتشغيل الأمر التالي في التيرمينال:
```bash
node scripts/seed-doctor.mjs --name "Dr. Tarek Omar" --email "tarek@clinic.com" --specialty "Cardiology" --clinic "Al-Amal Clinic"
```

### الطريقة 2: عبر لوحة تحكم Supabase Dashboard (SQL Editor)
1. افتح مشروعك على Supabase.
2. اذهب إلى **SQL Editor** ونفّذ الاستعلام التالي:
```sql
-- 1. إنشاء العيادة
INSERT INTO "Clinic" ("id", "name", "slug", "phone", "address")
VALUES ('cln-001', 'Al-Amal Specialized Clinic', 'al-amal', '+20 100 123 4567', 'Cairo, Egypt');

-- 2. إنشاء حساب الطبيب المالك
INSERT INTO "User" ("id", "email", "name", "role", "clinicId")
VALUES ('usr-doc-001', 'doctor@doctech.com', 'Dr. Ahmed Hossam', 'DOCTOR', 'cln-001');
```

---

## 📋 5. قائمة المهام القادمة بالترتيب (Prioritized Roadmap TO-DO List)

1. [x] **المرحلة 1:** بناء وتصميم الـ 33 شاشة كاملة (Doctor + Secretary + Auth).
2. [x] **المرحلة 2:** تطبيق الهوية البصرية الرسمية (Vector Logo + Brand Colors + Dark Mode).
3. [x] **المرحلة 3:** حماية المسارات (Auth Guards) ونظام الاستدعاء والتواصل اللحظي بالمنطق البشري.
4. [ ] **المرحلة 4 (التالية):** تفعيل قاعدة البيانات الحقيقية ومزامنة الـ CRUD (Supabase + Prisma).
5. [ ] **المرحلة 5:** الربط مع واتساب السحابي الحقيقي (Meta WhatsApp Business Cloud Webhooks).
6. [ ] **المرحلة 6:** بناء وتهيئة الوكيل الذكي (AI Clinical & Booking Agent) واختيار النموذج الأنسب (Hermes 3 / Gemini 2.5 Flash / DeepSeek).
7. [ ] **المرحلة 7:** الاختبار النهائي والنشر السحابي على Vercel.