# Mawana Digital Services - PRD

## Problem Statement
Landing page profesional untuk brand "Mawana Digital Services" dengan fitur admin dashboard, affiliate marketing system, dan analytics.

## Core Features (Completed)
- Multi-section landing page (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Client carousel marquee dengan 6 logo (termasuk Qudwah Indonesia)
- Floating WhatsApp button
- **Affiliate Marketing System:**
  - `/affiliate/dimas` (Pixel: 2975682082624536)
  - `/affiliate/aansopiyan` (Pixel: 4419483654961528)
  - Dark-themed persuasive landing page "Konsultasi Ads Gratis Khusus High Spender"
  - Smooth scroll CTA ke form
- **Analytics Dashboard** (/admin/dashboard):
  - Summary cards (Total Lead, Contact Form, Affiliate Leads)
  - Lead trend chart (Harian/Mingguan/Bulanan/Tahunan)
  - Date range filter (7 Hari, 30 Hari, 3 Bulan, 1 Tahun, Semua)
  - Affiliator performance (bar chart + ranking table)
- **Database Kontak** (/admin/contact):
  - Contact/Affiliate lead management tabs
  - Search filters, date range filter, Export to Excel
  - Quick-action buttons (WhatsApp, Email)
- JWT authentication for admin pages
- Email notifikasi otomatis via Resend ke marissamarwahmadina@gmail.com

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, date-fns, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend (email)
- Auth: JWT
- DB: MongoDB (contacts, affiliate_leads)

## Routes
- / - Landing page
- /admin/login - Admin login
- /admin/dashboard - Analytics (protected)
- /admin/contact - Database kontak (protected)
- /affiliate/:affiliator - Affiliate landing page

## API Endpoints
- POST /api/admin/login
- GET /api/contacts, POST /api/contact
- GET /api/affiliate-leads, POST /api/affiliate-lead
- GET /api/health

## 3rd Party Integrations
- Meta Pixel: dimas (2975682082624536), aansopiyan (4419483654961528)
- Resend: Email notifications

## Status
- All features implemented and tested (iteration 1-4: 100% pass)
- No pending bugs or tasks
