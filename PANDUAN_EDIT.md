# 📚 Panduan Edit & Maintenance Website Mawana Digital Services

## 📋 Daftar Isi
1. [Edit Logo Client](#1-edit-logo-client)
2. [Tambah/Edit Konten](#2-tambahedit-konten)
3. [Akses Database Contact Form](#3-akses-database-contact-form)
4. [Struktur File Penting](#4-struktur-file-penting)

---

## 1. 📝 Edit Logo Client

### Lokasi File
```
/app/frontend/src/components/OurClients.jsx
```

### Cara Edit Logo
Buka file dan edit array `clients` di baris 5-30:

```javascript
const clients = [
  {
    name: 'Your Need In Turkey',
    logo: 'https://yourneedinturkey.com/wp-content/uploads/2024/11/cropped-LOGO-YNIT-192x192.png'
  },
  // ... tambah client baru di sini
];
```

### Untuk Tambah Client Baru:
```javascript
{
  name: 'Nama Client Baru',
  logo: 'https://url-logo-client.com/logo.png'
}
```

### Tips:
- Logo format PNG/SVG terbaik
- Ukuran logo ideal: 200x200px atau lebih
- Pastikan URL logo bisa diakses public

---

## 2. ✏️ Tambah/Edit Konten

### A. Edit Teks di Sections

**Hero Section** (`/app/frontend/src/components/HeroSection.jsx`)
- Edit headline, subheadline di baris 15-25

**About Section** (`/app/frontend/src/components/AboutSection.jsx`)
- Edit deskripsi perusahaan di baris 30-45

**Services** (`/app/frontend/src/components/ServicesOverview.jsx`)
- Edit layanan di array `services` baris 5-50

**Pricing** (`/app/frontend/src/components/PricingSection.jsx`)
- Edit paket & harga di array `packages` baris 5-45

### B. Edit Warna Brand

**File:** `/app/frontend/tailwind.config.js`

Cari section `colors` dan edit warna cyan/navy:
```javascript
cyan: {
  '500': '#06b6d4',  // Warna utama
  '600': '#0891b2',  // Hover state
}
```

### C. Edit Logo Header/Footer

**Header:** `/app/frontend/src/components/Header.jsx` (baris 15)
**Footer:** `/app/frontend/src/components/Footer.jsx` (baris 18)

Ganti URL:
```javascript
src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/z10loxce_Header%20mawanads.svg"
```

### D. Edit Kontak WhatsApp

Cari nomor WhatsApp di semua file:
```bash
# Di terminal
grep -r "6289655128024" /app/frontend/src/
```

Ganti dengan nomor baru di semua file yang muncul.

---

## 3. 🗄️ Akses Database Contact Form

### Cara 1: Via Halaman Admin (Recommended)

**URL:** `http://your-domain.com/admin/contacts`

**Atau localhost:** `http://localhost:3000/admin/contacts`

Fitur:
- ✅ Lihat semua submission form
- ✅ Detail lengkap (nama, email, phone, organisasi, pesan, tanggal)
- ✅ Button quick action: WhatsApp & Email
- ✅ Refresh data realtime

### Cara 2: Via API Direct

**Endpoint:** `GET /api/contacts`

**Menggunakan curl:**
```bash
curl http://localhost:8001/api/contacts
```

**Menggunakan browser:**
```
http://your-backend-url/api/contacts
```

**Response Format:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "organization": "Company Name",
    "message": "Pesan dari user",
    "submittedAt": "2025-01-29T10:30:00"
  }
]
```

### Cara 3: Via MongoDB Direct

**Connection String:** Check di `/app/backend/.env`

```bash
# Di terminal
mongo <MONGO_URL>

# Kemudian query
use mawanads_db
db.contacts.find().sort({submittedAt: -1})
```

---

## 4. 📁 Struktur File Penting

```
/app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # Header & Navigation
│   │   │   ├── Footer.jsx              # Footer
│   │   │   ├── HeroSection.jsx         # Hero section
│   │   │   ├── OurClients.jsx          # Logo client (EDIT DI SINI!)
│   │   │   ├── ContactSection.jsx      # Form kontak
│   │   │   ├── PricingSection.jsx      # Paket harga
│   │   │   ├── WhitelistDetail.jsx     # Detail whitelist
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Homepage
│   │   │   └── AdminContacts.jsx       # Admin page (DATA KONTAK!)
│   │   └── App.js                      # Routes
│   ├── .env                            # BACKEND URL (JANGAN EDIT!)
│   └── package.json                    # Dependencies
│
├── backend/
│   ├── server.py                       # API endpoints
│   ├── .env                            # MongoDB URL (JANGAN EDIT!)
│   └── requirements.txt                # Python dependencies
│
└── contracts.md                        # API documentation

```

---

## 5. 🔧 Restart Services (Jika Perlu)

### Restart Frontend
```bash
sudo supervisorctl restart frontend
```

### Restart Backend
```bash
sudo supervisorctl restart backend
```

### Check Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
# Frontend logs
tail -f /var/log/supervisor/frontend.out.log

# Backend logs
tail -f /var/log/supervisor/backend.out.log
```

---

## 6. 📞 Quick Actions

### Test Contact Form
1. Buka `http://localhost:3000`
2. Scroll ke bagian "Kontak"
3. Isi form dan submit
4. Check di `http://localhost:3000/admin/contacts`

### Add New Client Logo
1. Edit `/app/frontend/src/components/OurClients.jsx`
2. Tambah object baru di array `clients`
3. Save file (auto-reload)
4. Refresh browser

### Change WhatsApp Number
1. Find & Replace `6289655128024` with new number
2. Files to check:
   - Header.jsx
   - HeroSection.jsx
   - ContactSection.jsx
   - TrustCTA.jsx
   - WhitelistDetail.jsx
   - Footer.jsx

---

## 7. ⚠️ Yang TIDAK BOLEH Diubah

- ❌ `/app/frontend/.env` → REACT_APP_BACKEND_URL
- ❌ `/app/backend/.env` → MONGO_URL
- ❌ Port numbers (3000, 8001)
- ❌ API prefix `/api`
- ❌ supervisor configs

---

## 8. 💡 Tips Development

### Hot Reload Aktif
File frontend/backend otomatis reload saat disave. 
**Restart HANYA jika:**
- Install package baru
- Edit .env
- Error yang tidak hilang

### Check Compilation
```bash
# Frontend
tail -f /var/log/supervisor/frontend.out.log

# Backend
tail -f /var/log/supervisor/backend.err.log
```

### Clear Browser Cache
Jika perubahan tidak muncul, hard refresh:
- **Chrome/Edge:** Ctrl + Shift + R
- **Firefox:** Ctrl + F5
- **Safari:** Cmd + Shift + R

---

## 9. 📱 Contact Info Update

**Email:** marissamarwahmadina@gmail.com
**WhatsApp:** +62 896-5512-8024
**Register URL:** https://mawanads.adsolution.co.id/register

Untuk update info kontak, edit di:
- ContactSection.jsx (form section)
- Footer.jsx (footer info)

---

## 10. 🚀 Deployment Notes

Saat deploy ke production:
1. Update REACT_APP_BACKEND_URL di frontend/.env
2. Build frontend: `yarn build`
3. Pastikan MongoDB accessible dari production server
4. Set proper CORS di backend/server.py

---

**Happy Editing! 🎉**

Jika ada pertanyaan, check dokumentasi ini dulu atau hubungi developer.
