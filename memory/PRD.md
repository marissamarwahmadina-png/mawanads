# Mawana Digital Services - PRD

## Problem Statement
Landing page profesional untuk brand "Mawana Digital Services" dengan fitur admin dashboard untuk manajemen leads dan analytics.

## Core Features (Completed)
- Multi-section landing page (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Floating WhatsApp button
- Affiliate marketing system (/affiliate/:name) dengan Meta Pixel tracking
- Affiliate page: form-only layout (tanpa hero section & benefits)
- **Analytics Dashboard** (/admin/dashboard):
  - Summary cards (Total Lead, Contact Form, Affiliate Leads)
  - Lead trend chart (Harian/Mingguan/Bulanan/Tahunan)
  - Date range filter (7 Hari, 30 Hari, 3 Bulan, 1 Tahun, Semua)
  - Affiliator performance (bar chart + ranking table)
- **Database Kontak** (/admin/contact):
  - Contact form & Affiliate lead management (tabs)
  - Search filters (nama, email, telepon, organisasi)
  - Date range filter
  - Export to Excel
  - Quick-action buttons (WhatsApp, Email) per lead
- JWT authentication for admin pages
- Email notifikasi otomatis ke admin via Resend saat ada lead baru
- Navigation between Analytics <-> Database Kontak

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, react-router-dom, axios, xlsx, date-fns, recharts
- Backend: FastAPI, Pydantic, Motor (async MongoDB), Resend (email)
- Auth: JWT (password: env ADMIN_PASSWORD)
- DB: MongoDB (contacts, affiliate_leads collections)
- Email: Resend API (sender: onboarding@resend.dev, admin: marissamarwahmadina@gmail.com)

## Architecture
```
/app/backend/server.py - All API routes + Resend email
/app/frontend/src/pages/AdminDashboard.jsx - Analytics dashboard (charts)
/app/frontend/src/pages/AdminContacts.jsx - Database kontak (management)
/app/frontend/src/pages/AdminLogin.jsx - Login page
/app/frontend/src/pages/Home.jsx - Landing page
/app/frontend/src/pages/AffiliateLanding.jsx - Affiliate page (form only)
/app/frontend/src/context/AuthContext.jsx - Auth state
/app/frontend/src/App.js - Routes
```

## Routes
- / - Landing page
- /admin/login - Admin login
- /admin/dashboard - Analytics dashboard (protected)
- /admin/contact - Database kontak (protected)
- /affiliate/:affiliator - Affiliate landing page

## API Endpoints
- POST /api/admin/login - Admin authentication
- GET /api/contacts - List contacts
- POST /api/contact - Submit contact form + email notification
- GET /api/affiliate-leads - List affiliate leads
- POST /api/affiliate-lead - Submit affiliate lead + email notification
- GET /api/health - Health check

## 3rd Party Integrations
- Meta Pixel: ID 2975682082624536 (affiliate tracking)
- Resend: Email notifications to admin (marissamarwahmadina@gmail.com)

## Status
- All features implemented and tested (iteration 1-3: 100% pass)
- No pending bugs or tasks

## Backlog
- No pending tasks
