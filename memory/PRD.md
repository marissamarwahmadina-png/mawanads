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

### Webinar System (Completed - Phase 1+2)
- Landing page /webinar/psikologi-sedekah (conversion-optimized, dark theme)
  - Hero, Pain-Agitate-Solution, What You'll Learn, Speaker, Social Proof, Urgency, Ticket Form, FAQ, Final CTA
  - Sticky CTA mobile, countdown, sisa kursi
- 3 Tier tiket: Individu Rp85k, Duo Rp149k, Lembaga Rp199k
- Webinar: 11 Maret 2026, 10:00 WIB
- Registration form → Invoice generation → Payment page → Confirmation
- TriPay payment integration (code ready, waiting for credentials)
- TriPay callback/webhook endpoint with signature validation
- Admin webinar dashboard API ready

### Legal Pages (Completed)
- /ketentuan-layanan — Terms of Service
- /kebijakan-privasi — Privacy Policy
- Footer links on homepage

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, date-fns, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend (email), httpx (TriPay API)
- Auth: JWT
- DB: MongoDB (contacts, affiliate_leads, webinar_events, webinar_registrants, tripay_callback_logs)
- Payment: TriPay (pending configuration)

## Routes
- / — Homepage
- /admin/login, /admin/dashboard, /admin/contact — Admin
- /affiliate/:affiliator, /affiliate/:affiliator/thankyou — Affiliate
- /webinar/psikologi-sedekah — Webinar landing
- /webinar/psikologi-sedekah/pembayaran — Payment
- /webinar/psikologi-sedekah/konfirmasi — Confirmation
- /ketentuan-layanan, /kebijakan-privasi — Legal

## Pending
- TriPay API credentials (TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE)
- Admin webinar dashboard frontend pages
