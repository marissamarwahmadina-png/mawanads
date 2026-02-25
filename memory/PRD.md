# Mawana Digital Services - PRD

## Problem Statement
Landing page & digital services platform untuk "Mawana Digital Services" dengan fitur admin dashboard, affiliate marketing, webinar ticketing, dan payment integration.

## Core Features

### Landing Page & Affiliate System (Completed)
- Multi-section homepage (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Client carousel (6 logo termasuk Qudwah Indonesia)
- Floating WhatsApp button
- Affiliate pages: /affiliate/dimas (Pixel: 2975682082624536), /affiliate/aansopiyan (Pixel: 4419483654961528)
- Email notification via Resend ke admin
- Analytics dashboard (/admin/dashboard) + Database kontak (/admin/contact)

### Webinar System (Completed - Full Production)
- Landing page /webinar/psikologi-sedekah (conversion-optimized, light theme)
  - Hero, Pain-Agitate-Solution, What You'll Learn, Speaker, Social Proof, Urgency, Ticket Form, FAQ, Final CTA
  - Sticky CTA mobile, countdown, sisa kursi
- 3 Tier tiket: Individu Rp85k, Duo Rp149k, Lembaga Rp199k
- Webinar: 11 Maret 2026, 10:00 WIB
- Registration form → Invoice generation → Payment page → Confirmation
- TriPay payment integration (LIVE - production, merchant T48843)
  - 15 payment channels: 10 Virtual Account + 5 E-Wallet (OVO, QRIS, DANA, ShopeePay)
  - Transaction creation with HMAC-SHA256 signature
  - Callback/webhook handler with signature validation
  - Status update (PAID/EXPIRED/FAILED) from callback
- Admin webinar dashboard (/admin/webinar)
  - Dashboard tab: stats, event info, recent transactions
  - Registrants tab: search, filter, export CSV, manual status update
  - Callback logs tab: view TriPay webhook logs

### Legal Pages (Completed)
- /ketentuan-layanan — Terms of Service
- /kebijakan-privasi — Privacy Policy

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, date-fns, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend (email), httpx (TriPay API)
- Auth: JWT
- DB: MongoDB (contacts, affiliate_leads, webinar_events, webinar_registrants, tripay_callback_logs)
- Payment: TriPay (production, merchant T48843, IP whitelisted)

## Routes
- / — Homepage
- /admin/login, /admin/dashboard, /admin/contact — Admin
- /admin/webinar — Admin Webinar Manager
- /affiliate/:affiliator, /affiliate/:affiliator/thankyou — Affiliate
- /webinar/psikologi-sedekah — Webinar landing
- /webinar/psikologi-sedekah/pembayaran — Payment
- /webinar/psikologi-sedekah/konfirmasi — Confirmation
- /ketentuan-layanan, /kebijakan-privasi — Legal

## Pending / Backlog
- P2: Email konfirmasi otomatis ke peserta setelah pembayaran berhasil
- P2: Role-based access control (SUPER_ADMIN) untuk admin
- P3: QR code tiket untuk absensi di hari H
- P3: WhatsApp reminder H-1 ke peserta yang sudah bayar
