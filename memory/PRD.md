# Mawana Digital Services - PRD

## Problem Statement
Landing page profesional untuk brand "Mawana Digital Services" dengan fitur admin dashboard untuk manajemen leads.

## Core Features (Completed)
- Multi-section landing page (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Floating WhatsApp button
- Affiliate marketing system (/affiliate/:name) dengan Meta Pixel tracking
- Admin dashboard (/admin/dashboard) dengan JWT authentication
- Contact form & Affiliate lead management
- Export to Excel (contacts & affiliate leads)
- Search filters (nama, email, telepon, organisasi)
- Date range filter
- Quick-action buttons (WhatsApp, Email) per lead

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, react-router-dom, axios, xlsx, date-fns
- Backend: FastAPI, Pydantic, Motor (async MongoDB)
- Auth: JWT (password: env ADMIN_PASSWORD)
- DB: MongoDB (contacts, affiliate_leads collections)

## Architecture
```
/app/backend/server.py - All API routes
/app/frontend/src/pages/AdminDashboard.jsx - Admin dashboard
/app/frontend/src/pages/Home.jsx - Landing page
/app/frontend/src/pages/AdminLogin.jsx - Login page
/app/frontend/src/pages/AffiliateLanding.jsx - Affiliate page
/app/frontend/src/context/AuthContext.jsx - Auth state
/app/frontend/src/App.js - Routes
```

## API Endpoints
- POST /api/admin/login - Admin authentication
- GET /api/contacts - List contacts
- POST /api/contact - Submit contact form
- GET /api/affiliate-leads - List affiliate leads
- POST /api/affiliate-lead - Submit affiliate lead
- GET /api/health - Health check

## Status
- All features implemented and tested
- Bug "Gagal memuat data" fixed (null safety on filters)
- Testing: 100% backend (13/13), 100% frontend

## Backlog
- No pending tasks
