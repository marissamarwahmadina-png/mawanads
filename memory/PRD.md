# Mawana Digital Services - PRD

## Problem Statement
Landing page & digital services platform untuk "Mawana Digital Services" dengan fitur admin dashboard, affiliate marketing, webinar ticketing, payment integration, dan whitelist cashback management.

## Core Features

### Landing Page & Affiliate System (Completed)
- Multi-section homepage (Hero, Services, Whitelist, Clients, Testimonials, Contact)
- Affiliate pages: /affiliate/dimas, /affiliate/aansopiyan
- Email notification via Resend ke admin
- Meta Pixel integration with Advanced Matching (Lead event dihapus dari affiliate page)

### Webinar System (Completed - Full Production)
- Landing page /webinar/psikologi-sedekah
- 3 Tier tiket: Individu Rp85k, Duo Rp149k, Lembaga Rp199k
- TriPay payment integration (LIVE - 15 channels)
- Email konfirmasi otomatis

### Admin System (Completed)
- Unified nav: Analytics | Leads & Kontak | Webinar | Whitelist CB | Input Spending
- JWT-protected admin area

### Whitelist Cashback Dashboard (Completed - April 2026)
- CRUD user whitelist (nama, email, telepon, CB%, referral, bank info)
- Informasi rekening: Nama Bank, Nama Rekening, Nomor Rekening
- Ringkasan per referral dengan kolom Sudah Bayar / Belum Bayar
- Edit Referral modal: edit user dalam satu referral group (CB%, bank, referral name)
- PDF download dengan filter periode (Semua Periode / Pilih Bulan range)
- Format PDF profesional: header gelap, summary cards (Total CB, Sudah Dibayar, Belum Dibayar), tabel detail dengan status PAID/UNPAID, Transfer Details
- Status pembayaran per spend entry: toggle Sudah/Belum Dibayar
- Filter status pembayaran: Semua Status / Ada Belum Dibayar / Semua Sudah Dibayar
- Filter & pencarian user (nama/email/telepon + dropdown referral + status)

### Input Spending Bulanan (Completed - April 2026)
- Halaman dedicated di /admin/whitelist/spends
- Month/year picker, inline edit spend per user
- Bar chart perbandingan ad spend per user
- Status pembayaran toggle (Sudah/Belum) per entry
- Upload bukti transfer, Export Excel
- Stats cards: Total Spend & Total Cashback per bulan

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, recharts, xlsx
- Backend: FastAPI, Motor (MongoDB), Resend, httpx, fpdf2
- Auth: JWT | Payment: TriPay

## DB Collections
- whitelist_users: {id, name, email, phone, cashback_percentage, referral, notes, bank_name, account_name, account_number, created_at, updated_at}
- monthly_spends: {id, user_id, month, year, spend_amount, cashback_percentage, cashback_amount, proof_url, notes, payment_status, created_at, updated_at}

## Pending / Backlog
- P2: Role-based access control (SUPER_ADMIN)
- P3: QR code tiket untuk absensi webinar
- P3: WhatsApp reminder H-1 ke peserta webinar
