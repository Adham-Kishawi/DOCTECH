# 🏥 DOCTECH — Multi-Tenant Clinic Management OS

**DOCTECH** is a modern, full-stack, multi-tenant Clinic Management System built with **Next.js 16 (App Router)**, **Prisma**, **Supabase**, **Meta WhatsApp Business Cloud API**, and **Hermes AI Booking Agent (OpenRouter)**.

---

## 🌟 Key Features

1. **📱 Mobile-First Responsive Design:** Sliding drawer `MobileSidebar`, fixed `BottomNav`, fluid offsets, and dedicated Dark Mode (`#0B131E`).
2. **👥 Direct Staff CRUD & Permissions:** Doctors can directly create secretary/assistant accounts with customized permission matrices (`/doctor/team`).
3. **💬 Staff Direct Comms & Team Chat:** Multi-staff searchable directory with 1-on-1 direct messaging, online presence indicators, unread counters, quick clinical action chips, and instant room summons (`/doctor/communications` & `/secretary/communications`).
4. **📅 Clinical Scheduling & Double-Booking Protection:** Configurable physician shifts and slot durations (`15/20/30/45/60 min`) with real-time available slot calculations.
5. **🤖 Hermes AI Booking Queue (Human-in-the-Loop):** Intelligent WhatsApp AI booking intake routed through a secretary review queue (`/secretary/appointments/pending`) before confirmation.
6. **👤 3-Tab Patient EMR & Attachments:**
   - **General Profile:** Demographics, editable chronic conditions, and drug allergies.
   - **Consultation Timeline (`PatientTimeline.tsx`):** Historical visits, vital metrics, and prescriptions.
   - **Medical Files & Scans (`FileUploader.tsx`):** Drag-and-drop X-rays, lab reports, and prescriptions with Lightbox preview.
7. **💰 Financial Management:** Reception cashier drawer (`/secretary/finance`) and physician isolated revenue charts (`/doctor/finance`).
8. **🔔 Notification Center:** Live notification bell with unread badges and multi-channel categorization.
9. **💬 Meta WhatsApp & OpenRouter AI:** Meta Cloud API webhook handler (`/api/whatsapp/webhook`) with **Qwen 3.5** primary model and **GLM-4** fallback.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server (Webpack)
npm run dev

# Check TypeScript
npx tsc --noEmit
```

Open [http://localhost:3000/en/doctor/dashboard](http://localhost:3000/en/doctor/dashboard) to view the Doctor dashboard.

---

## 🔑 Demo Credentials

- **Doctor:** `doctor@doctech.com` / `password123`
- **Secretary:** `secretary@doctech.com` / `password123`

---

For the full detailed specification, consult [`PROJECT_PROGRESS.md`](./PROJECT_PROGRESS.md).
