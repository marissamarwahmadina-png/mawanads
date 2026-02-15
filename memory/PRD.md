# Mawana Digital Services - PRD

## Problem Statement
Landing page profesional untuk brand "Mawana Digital Services" dengan fitur admin dashboard untuk manajemen leads.

## Core Features (Completed)
- Multi-section landing page (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Floating WhatsApp button
- Affiliate marketing system (/affiliate/:name) dengan Meta Pixel tracking
- Affiliate page: form-only layout (tanpa hero section & benefits)
- Admin dashboard (/admin/dashboard) dengan JWT authentication
- Contact form & Affiliate lead management
- Export to Excel (contacts & affiliate leads)
- Search filters (nama, email, telepon, organisasi)
- Date range filter
- Quick-action buttons (WhatsApp, Email) per lead
- Email notifikasi otomatis ke admin via Resend saat ada lead baru

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, react-router-dom, axios, xlsx, date-fns
- Backend: FastAPI, Pydantic, Motor (async MongoDB), Resend (email)
- Auth: JWT (password: env ADMIN_PASSWORD)
- DB: MongoDB (contacts, affiliate_leads collections)
- Email: Resend API (sender: onboarding@resend.dev, admin: marissamarwahmadina@gmail.com)

## Architecture
```
/app/backend/server.py - All API routes + Resend email integration
/app/frontend/src/pages/AdminDashboard.jsx - Admin dashboard
/app/frontend/src/pages/Home.jsx - Landing page
/app/frontend/src/pages/AdminLogin.jsx - Login page
/app/frontend/src/pages/AffiliateLanding.jsx - Affiliate page (form only)
/app/frontend/src/context/AuthContext.jsx - Auth state
/app/frontend/src/App.js - Routes
```

## API Endpoints
- POST /api/admin/login - Admin authentication
- GET /api/contacts - List contacts
- POST /api/contact - Submit contact form + email notification
- GET /api/affiliate-leads - List affiliate leads
- POST /api/affiliate-lead - Submit affiliate lead + email notification
- GET /api/health - Health check

## 3rd Party Integrations
- Meta Pixel: ID 2975682082624536 (affiliate tracking)
- Resend: Email notifications to admin

## Status
- All features implemented and tested (iteration 1 & 2: 100% pass)
- No pending bugs or tasks

## Backlog
- No pending tasks
