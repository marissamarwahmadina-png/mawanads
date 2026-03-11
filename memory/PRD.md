# Mawana Digital Services - PRD

## Problem Statement
Landing page & digital services platform untuk "Mawana Digital Services" dengan fitur admin dashboard, affiliate marketing, webinar ticketing, payment integration, dan whitelist cashback management.

## Core Features

### Landing Page & Affiliate System (Completed)
- Multi-section homepage (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Affiliate pages: /affiliate/dimas, /affiliate/aansopiyan
- Email notification via Resend ke admin
- Meta Pixel integration with Advanced Matching

### Webinar System (Completed - Full Production)
- Landing page /webinar/psikologi-sedekah with real speaker photos
- 3 Tier tiket: Individu Rp85k, Duo Rp149k, Lembaga Rp199k
- TriPay payment integration (LIVE - 15 channels: VA + E-Wallet)
- Email konfirmasi otomatis saat pembayaran berhasil (via Resend)

### Admin System (Completed)
- Unified navigation bar: Analytics | Leads & Kontak | Webinar | Whitelist CB | Input Spending
- Satu login untuk akses semua fitur admin
- Webinar Manager: Dashboard, Registrant (search/filter/export/edit status/delete), Callback Logs

### Whitelist Cashback Dashboard (Completed - March 2026)
- Dashboard di /admin/whitelist dengan statistik ringkasan
- CRUD user whitelist (nama, email, telepon, cashback %, referral, catatan)
- Informasi rekening: Nama Bank, Nama Rekening, Nomor Rekening
- Tracking ad spend bulanan per user dengan auto-kalkulasi cashback
- Upload bukti pembayaran (proof of payment) per entry spend
- Generate PDF laporan cashback per user dan per referral
- Ringkasan per referral dengan tabel agregasi
- Filter & pencarian user (nama/email/telepon + dropdown referral)

### Input Spending Bulanan (Completed - March 2026)
- Halaman dedicated di /admin/whitelist/spends
- Month/year picker dengan navigasi prev/next
- Tabel semua user whitelist dengan inline edit spend
- Auto-kalkulasi cashback berdasarkan persentase user
- Bar chart perbandingan ad spend per user
- Upload bukti transfer per entry
- Stats cards: Total Spend & Total Cashback per bulan

### Legal Pages (Completed)
- /ketentuan-layanan, /kebijakan-privasi

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, date-fns, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend (email), httpx (TriPay API), fpdf2 (PDF generation)
- Auth: JWT | Payment: TriPay (production, T48843)

## DB Collections
- contacts, affiliate_leads, webinar_events, webinar_registrants, tripay_callback_logs
- whitelist_users: {id, name, email, phone, cashback_percentage, referral, notes, bank_name, account_name, account_number, created_at, updated_at}
- monthly_spends: {id, user_id, month, year, spend_amount, cashback_percentage, cashback_amount, proof_url, notes, created_at, updated_at}

## Pending / Backlog
- P2: Role-based access control (SUPER_ADMIN)
- P3: QR code tiket untuk absensi di hari H
- P3: WhatsApp reminder H-1 ke peserta yang sudah bayar
