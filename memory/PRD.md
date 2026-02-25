# Mawana Digital Services - PRD

## Problem Statement
Landing page & digital services platform untuk "Mawana Digital Services" dengan fitur admin dashboard, affiliate marketing, webinar ticketing, dan payment integration.

## Core Features

### Landing Page & Affiliate System (Completed)
- Multi-section homepage (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Client carousel (6 logo termasuk Qudwah Indonesia)
- Floating WhatsApp button
- Affiliate pages: /affiliate/dimas, /affiliate/aansopiyan
- Email notification via Resend ke admin
- Analytics dashboard (/admin/dashboard) + Database kontak (/admin/contact)

### Webinar System (Completed - Full Production)
- Landing page /webinar/psikologi-sedekah (conversion-optimized)
- 3 Tier tiket: Individu Rp85k, Duo Rp149k, Lembaga Rp199k
- TriPay payment integration (LIVE - 15 channels: VA + E-Wallet)
- Email konfirmasi otomatis saat pembayaran berhasil (via Resend)
- TriPay callback/webhook handler with signature validation
- Admin webinar panel (/admin/webinar): Dashboard, Registrant (search/filter/export/edit status/hapus), Callback Logs

### Admin System (Completed)
- Unified navigation bar: Analytics | Leads & Kontak | Webinar
- Satu login untuk akses semua fitur admin
- Delete registrant dengan konfirmasi inline

### Legal Pages (Completed)
- /ketentuan-layanan, /kebijakan-privasi

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, date-fns, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend (email), httpx (TriPay API)
- Auth: JWT | Payment: TriPay (production, T48843)

## Routes
- / — Homepage
- /admin/login, /admin/dashboard, /admin/contact, /admin/webinar — Admin
- /affiliate/:affiliator, /affiliate/:affiliator/thankyou — Affiliate
- /webinar/psikologi-sedekah — Webinar landing
- /webinar/psikologi-sedekah/pembayaran — Payment
- /webinar/psikologi-sedekah/konfirmasi — Confirmation
- /ketentuan-layanan, /kebijakan-privasi — Legal

## Pending / Backlog
- P2: Role-based access control (SUPER_ADMIN)
- P3: QR code tiket untuk absensi di hari H
- P3: WhatsApp reminder H-1 ke peserta yang sudah bayar
