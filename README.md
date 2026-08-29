# DOCTECH — Clinic Management System

A professional multi-tenant clinic management system for doctors and secretaries.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Auth:** Clerk (Organizations for multi-tenancy)
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **i18n:** next-intl (English + Arabic/RTL)
- **WhatsApp:** Meta Business Cloud API

## Features

### Doctor Portal
- Dashboard with stats and today's appointments
- Appointments viewer (Read-only)
- Schedule viewer (Read-only)
- Reports inbox & Medical Review
- Team management (Invite secretary)
- Internal communications
- Notifications

### Secretary Portal
- Dashboard with quick actions
- Full appointments CRUD (Create, View, Edit, Cancel)
- Schedule management
- Patients directory & profiles
- Reports inbox, triage, and doctor response
- WhatsApp Business conversations
- Internal communications with doctor
- Notifications

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Clerk, Supabase, and WhatsApp credentials

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables.

## Project Structure

```
app/[locale]/
├── (auth)/          # Authentication screens
├── (doctor)/        # Doctor portal screens  
└── (secretary)/     # Secretary portal screens
```
