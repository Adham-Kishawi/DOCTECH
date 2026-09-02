# 🏥 DOCTECH — الدليل الشامل ووثيقة حالة المشروع الكاملة (Master Project Status & System Specs)

> **DOCTECH:** نظام سحابي متكامل لإدارة المراكز الطبية والعيادات المتعددة (Multi-Tenant Clinic Management OS) مصمم ومبني للإطلاق التجاري المباشر، مع عزل كامل للبيانات (Row-Level Multi-Tenancy)، ونظام حجز ذكي، وتكامل مباشر مع واتساب والذكاء الاصطناعي (Hermes AI).

---

## 📌 1. معلومات وبيانات المستودع (Project Repository)

* **المستودع الرسمي (GitHub):** [https://github.com/Adham-Kishawi/DOCTECH](https://github.com/Adham-Kishawi/DOCTECH)
* **المسار المحلي:** `D:\FULL-PROJECTS\DOCTECH` (متزامن 100% مع آخر Commit على `main`)
* **الفرع الأساسي:** `main`
* **أحدث Commit مرفوع:** `feat: complete multi-tenant clinic features, mobile responsiveness, Hermes AI booking, staff CRUD, direct comms, and finance modules` (44 ملف تم تحديثه ورفعه).
* **حالة الـ Build والـ Type-check:** ✅ `npx tsc --noEmit` ينتهي بـ **0 أخطاء (Exit Code: 0)**.

---

## 🔑 2. بيانات الحسابات المعتمدة للدخول والتجربة (Accounts & Credentials)

| الحساب | البريد الإلكتروني | كلمة المرور | الصلاحيات والدور | الرابط المباشر |
|---|---|---|---|---|
| **الطبيب (Doctor / Practice Owner)** | `doctor@doctech.com` | `password123` | إدارة العيادة، الكشوفات، إعدادات مواعيد العمل، الأرباح، إنشاء وإدارة السكرتارية وتحديد الصلاحيات، واستدعاء الاستقبال. | [فتح لوحة الطبيب](http://localhost:3000/en/doctor/dashboard) |
| **السكرتيرة (Secretary / Front Desk)** | `secretary@doctech.com` | `password123` | حجز وإدارة المواعيد، مراجعة طلبات حجز الـ AI، سجل المرضى EMR، الخزينة والتحصيل، محادثات الواتساب، والتواصل مع الطبيب. | [فتح لوحة السكرتيرة](http://localhost:3000/en/secretary/dashboard) |

> 💡 **الدخول السريع (1-Click Demo):** في صفحة تسجيل الدخول [`/sign-in`](http://localhost:3000/en/sign-in) يمكنك الضغط مباشرة على **Doctor View** أو **Secretary View** للدخول الفوري.

---

## 🚀 3. تفاصيل الميزات والأنظمة المنجزة بالكامل (Delivered Features Breakdown)

### 1. 📱 نظام التجاوب الكامل مع الهواتف الذكية (Mobile-First Architecture)
* **قائمة جانبية للموبايل [`MobileSidebar.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/layout/MobileSidebar.tsx):** قائمة Drawer سحابية تفتح بسلاسة من زر الهمبرغر في الهيدر مع خلفية معتمة ناعمة.
* **شريط الملاحة السفلي [`BottomNav.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/layout/BottomNav.tsx):** شريط ملاحة مثبت أسفل الشاشة على الهواتف والتابلت مع 5 عمليات رئيسية، ودعم هواتف النوتش (`safe-area-inset`).
* **الهوامش المرنة (Fluid Offsets):** الهوامش الثابتة للسايد بار الديسكتوب (`margin-left / margin-right: 210px`) تتحول تلقائيًا إلى `0px` على شاشات الموبايل (`<768px`) لمنع أي قص أو تداخل.

### 2. 🌙 تثبيت الوضع الليلي واللغة الإنجليزية (Dark Mode & English Enforced)
* تم تثبيت الـ **Dark Mode** بشكل دائم على مستوى التطبيق (`html.dark` وخلفية داكنة `#0B131E` و `#131E2E`).
* تم تعطيل مؤقت لمبدل الثيم [`ThemeToggle.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/shared/ThemeToggle.tsx) ومبدل اللغة [`LanguageSwitcher.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/shared/LanguageSwitcher.tsx) للاعتماد على واجهة إنجليزية احترافية بالكامل.

### 3. 👥 إدارة طاقم العيادة الكامل (Full Staff CRUD & Permissions)
* **الرابط:** [`/en/doctor/team`](http://localhost:3000/en/doctor/team)
* تم استبدال نظام "الدعوات" بنظام **إنشاء مباشر لحسابات السكرتارية (Direct Account Provisioning)**:
  * **Create:** إضافة موظف جديد (الاسم، البريد، الهاتف، كلمة المرور، والدور الوظيفي: Head Secretary, Receptionist, Clinical Assistant, Billing Officer).
  * **Permissions Matrix:** مصفوفة صلاحيات تفصيلية بالـ Checkbox (`Appointments`, `Patients EMR`, `Billing & Cashier`, `WhatsApp Comms`, `Medical Reports`).
  * **Update / Edit:** تعديل بيانات الموظف والصلاحيات في Modal مخصص.
  * **Status Toggle:** تجميد أو تفعيل الحساب فورًا (`ACTIVE` / `SUSPENDED`).
  * **Delete:** حذف الحساب مع نافذة تأكيد لمنع الحذف بالخطأ.

### 4. 💬 المحادثات والتواصل الداخلي المباشر (Staff Direct Comms & Team Chat)
* **الروابط:** [`/en/doctor/communications`](http://localhost:3000/en/doctor/communications) & [`/en/secretary/communications`](http://localhost:3000/en/secretary/communications)
* تم استبدال القناة الواحدة بنظام تواصل احترافي متعدد الأطراف:
  * **شريط جانبي للبحث والتنقل:** إمكانية البحث عن أي سكرتير أو طبيب بالاسم أو المنصب.
  * **قنوات محادثة فردية 1-on-1:** محادثة مخصصة لكل سكرتير (Sarah Jenkins, Dina Mansour, Hossam Zaki, Nurse Mariam, etc.) مع عدادات للرسائل غير المقروءة.
  * **قناة إعلانات العيادة العامة (📢 All Clinic Team Broadcast):** للإعلانات الجماعية.
  * **مؤشر التواجد اللحظي:** نقطة خضراء (`Online`) للأعضاء المتصلين.
  * **أزرار التعليمات السريرية السريعة (Quick Action Chips):** إرسال أوامر بنقرة واحدة (مثل: *"ادخلي المريض لغرفة 1"*, *"تجهيز نتائج الـ CBC"*, *"تجهيز رسم القلب"*).
  * **الاستدعاء والتنبيه الصامت:** زر الاستدعاء الطارئ لغرفة الكشف مع جرس صوتي (`Summon to Room 1`) وزر التنبيه الصامت للطبيب (`Send Quiet Note`).

### 5. 📅 نظام الجدولة والحجز ومنع الازدواجية (Booking System & Shift Matrix)
* **إعدادات مواعيد الطبيب [`/en/doctor/schedule/settings`](http://localhost:3000/en/doctor/schedule/settings):** تحديد أيام العمل الأسبوعية، ساعات البداية والنهاية، ومدة الكشف (15/20/30/45/60 دقيقة).
* **مسار حساب المواعيد المتاحة [`/api/appointments/available-slots`](file:///D:/FULL-PROJECTS/DOCTECH/app/api/appointments/available-slots/route.ts):** فحص المواعيد المتاحة ومنع الحجز المزدوج (Double-Booking Prevention).
* **فورم الحجز المحسن للسكرتيرة [`/en/secretary/appointments/new`](http://localhost:3000/en/secretary/appointments/new):** اختيار الطبيب، نوع الكشف، السعر، طريقة الدفع (Cash, Card, Transfer, Insurance)، وإرسال تأكيد بالواتساب تلقائيًا.

### 6. 🤖 طابور مراجعة حجوزات الذكاء الاصطناعي (Hermes AI Review Queue - Human in the Loop)
* **الرابط:** [`/en/secretary/appointments/pending`](http://localhost:3000/en/secretary/appointments/pending)
* الحجوزات القادمة عبر واتساب من الوكيل الذكي Hermes لا تُثبت نهائيًا بشكل آلي 100%، بل تدخل في طابور مراجعة بحالة `PENDING_REVIEW` مع نسبة ثقة الـ AI وتفاصيل الشكوى، لتعتمدها السكرتيرة أو تقترح موعدًا بديلًا بضغطة زر.

### 7. 👤 ملف المريض بـ 3 تبويبات شاملة (Patient Profile EMR & Attachments)
* **الرابط التجريبي:** [`/en/secretary/patients/PAT-001`](http://localhost:3000/en/secretary/patients/PAT-001)
  1. **Tab 1 - General Info:** البيانات الديموغرافية، تعديل الأمراض المزمنة، الحساسية الدوائية، والأدوية الحالية.
  2. **Tab 2 - Consultation Timeline ([`PatientTimeline.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/patients/PatientTimeline.tsx)):** سجل الكشوفات السابقة القابل للتوسيع، العلامات الحيوية (الضغط، النبض، الحرارة، السكر)، التشخيص، والروشتات.
  3. **Tab 3 - Attachments & Scans ([`FileUploader.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/patients/FileUploader.tsx)):** رافع ملفات Drag & Drop للأشعة والتحاليل والروشتات ومستندات الـ PDF مع معاينة بالـ Lightbox Modal.
* مسار الـ API: [`/api/patients/[id]/attachments`](file:///D:/FULL-PROJECTS/DOCTECH/app/api/patients/%5Bid%5D/attachments/route.ts).

### 8. 💰 الجزء المالي وإدارة الخزينة (Financial Dashboards)
* **خزينة السكرتيرة [`/en/secretary/finance`](http://localhost:3000/en/secretary/finance):** إجمالي المحصل، النقدية في الدرج (Cash Drawer)، مدفوعات الفيزا والمحافظ (Card/Digital)، المستحقات المعلقة، وتحصيل فوري للإيصالات.
* **أرباح الطبيب المنفصلة [`/en/doctor/finance`](http://localhost:3000/en/doctor/finance):** لوحة أرباح الطبيب المنفصلة مع رسم بياني أسبوعي تفاعلي (Recharts) وتوزيع الإيرادات حسب نوع الكشف (معزولة تمامًا عن باقي الأطباء).
* مسار الـ API: [`/api/finance/summary`](file:///D:/FULL-PROJECTS/DOCTECH/app/api/finance/summary/route.ts).

### 9. 🔔 مركز الإشعارات الفوري (Notification Bell)
* مكون الجرس في الهيدر [`NotificationBell.tsx`](file:///D:/FULL-PROJECTS/DOCTECH/components/layout/NotificationBell.tsx) مع عداد تفاعلي غير مقروء، تصنيف للتنبيهات (طلبات AI، حجوزات جديدة، استفسارات طارئة)، وخيار تعيين الكل كمقروء.
* مسار الـ API: [`/api/notifications`](file:///D:/FULL-PROJECTS/DOCTECH/app/api/notifications/route.ts) وخدمة [`lib/notificationService.ts`](file:///D:/FULL-PROJECTS/DOCTECH/lib/notificationService.ts).

### 10. 💬 تكامل الواتساب السحابي والذكاء الاصطناعي (Meta Cloud API + OpenRouter)
* **عميل Meta Cloud API الرسمي:** [`lib/whatsapp/metaClient.ts`](file:///D:/FULL-PROJECTS/DOCTECH/lib/whatsapp/metaClient.ts) لإرسال واستقبال الرسائل وقوالب التأكيد.
* **عميل OpenRouter الذكي:** [`lib/ai/openRouterClient.ts`](file:///D:/FULL-PROJECTS/DOCTECH/lib/ai/openRouterClient.ts) بموديل أساسي **Qwen 2.5/3.5 72B** وموديل بديل **GLM-4 9B** لخفض التكلفة وسرعة الاستجابة، مع ردود طوارئ تلقائية عند غياب المفاتيح.
* **وكيل الحجز الذكي Hermes:** [`lib/ai/hermesAgent.ts`](file:///D:/FULL-PROJECTS/DOCTECH/lib/ai/hermesAgent.ts) لاستخراج بيانات المرضى وتحديد المواعيد بالعامية المصرية.
* **معالج الـ Webhook:** [`/api/whatsapp/webhook`](file:///D:/FULL-PROJECTS/DOCTECH/app/api/whatsapp/webhook/route.ts) متوافق مع شروط التحقق الرسمية لشركة Meta.

---

## 🛠️ 4. المتغيرات البيئية المدعومة (`.env.example`)

```env
# Supabase Database & Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# PostgreSQL (Prisma)
DATABASE_URL=

# WhatsApp Business Cloud API (Meta)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=doctech_whatsapp_webhook_secret_2026

# OpenRouter AI Models (Hermes Agent)
OPENROUTER_API_KEY=
OPENROUTER_PRIMARY_MODEL=qwen/qwen-2.5-72b-instruct
OPENROUTER_FALLBACK_MODEL=thudm/glm-4-9b-chat
```

---

## 🧭 5. خريطة تشغيل ومسارات التطبيق (Quick Navigation Links)

| الشاشة | المسار (Route) | الوظيفة |
|---|---|---|
| **Doctor Dashboard** | `/en/doctor/dashboard` | لوحة تحكم الطبيب والعمليات السريرية اليومية |
| **Doctor Appointments** | `/en/doctor/appointments` | استعراض قائمة مواعيد وحجوزات الطبيب |
| **Doctor Schedule** | `/en/doctor/schedule` | جدول الكشوفات والورديات اليومية |
| **Doctor Shift Config** | `/en/doctor/schedule/settings` | إعداد أوقات العمل ومدد الكشف |
| **Doctor Team Management** | `/en/doctor/team` | إنشاء وتعديل وحذف حسابات السكرتارية وتحديد الصلاحيات |
| **Doctor Earnings** | `/en/doctor/finance` | أرباح الطبيب والتحليلات البيانية الأسبوعية |
| **Doctor Staff Comms** | `/en/doctor/communications` | محادثات الطبيب المباشرة مع طاقم السكرتارية |
| **Doctor Reports** | `/en/doctor/reports` | مراجعة تقارير واستفسارات المرضى والروشتات |
| **Secretary Dashboard** | `/en/secretary/dashboard` | لوحة تحكم الاستقبال والمكتب الأمامي |
| **Secretary Appointments** | `/en/secretary/appointments` | إدارة جدول المواعيد والحالات |
| **AI Booking Queue** | `/en/secretary/appointments/pending` | مراجعة واعتماد طلبات حجز الواتساب الذكية |
| **New Booking Form** | `/en/secretary/appointments/new` | حجز كشف جديد ومنع الازدواجية وتحديد السعر |
| **Patient Directory** | `/en/secretary/patients` | دليل وسجل المرضى العام |
| **Patient Profile & EMR** | `/en/secretary/patients/PAT-001` | ملف المريض (بيانات عامة، سجل زمني، أشعة وروشتات) |
| **Cashier & Billing** | `/en/secretary/finance` | الخزينة وتحصيل المبالغ النقدية والإلكترونية |
| **Secretary Comms** | `/en/secretary/communications` | محادثات السكرتيرة مع الأطباء وباقي الطاقم |
| **Secretary WhatsApp** | `/en/secretary/whatsapp` | صندوق محادثات الواتساب الرسمية |

---

## 📋 6. ما تم إنجازه وجدول الأعمال القادم (Work Status & Next Steps)

- [x] إتمام بناء كافة شاشات ومسارات النظام (Doctor + Secretary).
- [x] حل كافة مشاكل الـ Responsive على الموبايل والتابلت (`MobileSidebar` + `BottomNav`).
- [x] تثبيت الـ Dark Mode وتوحيد الهوية البصرية.
- [x] بناء نظام إدارة السكرتارية المباشر (Direct Staff Account CRUD & Permissions).
- [x] بناء نظام المحادثات المباشرة 1-on-1 بين الطبيب والسكرتارية مع البحث وقناة الإعلانات.
- [x] بناء نظام الحجز والجدولة وإعدادات فترات العمل ومنع الازدواجية.
- [x] بناء طابور مراجعة حجوزات الـ AI من واتساب (Human-in-the-Loop).
- [x] بناء ملف المريض الشامل EMR بـ 3 تبويبات (المعلومات، التايم لاين، ورافع الأشعة والروشتات).
- [x] بناء لوحات الخزينة وإيرادات الطبيب المنفصلة.
- [x] بناء عميل Meta WhatsApp Cloud وعميل OpenRouter (Qwen + GLM) والـ Webhooks.
- [x] ربط جرس الإشعارات والتواصل اللحظي عبر `BroadcastChannel` و `Supabase Realtime`.
- [x] عمل Commit و Push لكافة التعديلات (44 ملف) على المستودع `main`.

### 🎯 المهام المقترحة لبدء العمل في الجلسة القادمة (Next Session Backlog):
1. **ربط قاعدة البيانات الحقيقية:** تشغيل `prisma migrate` على PostgreSQL في Supabase وربط الجداول الفعلية.
2. **اختبار محادثات الواتساب الحية:** إدخال مفاتيح Meta WhatsApp Cloud API و OpenRouter في `.env.local` وتجربة الـ Webhook مع رقم واتساب تجريبي حقيقي.
3. **توليد الروشتات الإلكترونية والطباعة:** إضافة تصدير PDF للروشتات الطبية مع ختم العيادة وطباعتها بضغطة زر.
4. **تجهيز النشر النهائي (Deployment to Vercel/Production):** ضبط إعدادات الـ Production Build على Vercel وربط الدومين الخاص بـ DOCTECH.