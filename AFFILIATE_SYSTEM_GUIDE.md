# 📊 PANDUAN AFFILIATE SYSTEM - Mawana Digital Services

## 🎯 Overview

Sistem affiliate memungkinkan Anda membuat landing page khusus untuk setiap affiliator dengan tracking otomatis dan Meta Pixel terintegrasi.

---

## 🔗 URL Structure

### Format URL Affiliate:
```
https://mawanads.com/affiliate/{nama-affiliator}
```

### Contoh URL:
- **Dimas**: `https://mawanads.com/affiliate/dimas`
- **Andi**: `https://mawanads.com/affiliate/andi`
- **Sarah**: `https://mawanads.com/affiliate/sarah`

**Case Insensitive**: URL akan otomatis convert ke lowercase

---

## 📝 Form Fields

Landing page affiliate memiliki 4 field:

1. **Nama Lengkap** (required)
2. **Asal Lembaga/Perusahaan** (required)
3. **Jumlah Spent Ads Per Bulan** (dropdown, required)
   - Di bawah Rp 5 juta
   - Rp 5 juta - Rp 10 juta
   - Rp 10 juta - Rp 25 juta
   - Rp 25 juta - Rp 50 juta
   - Rp 50 juta - Rp 100 juta
   - Di atas Rp 100 juta
4. **Pesan/Kebutuhan** (textarea, required)

---

## 📱 Meta Pixel Integration

### Setup Meta Pixel per Affiliator

Edit file: `/app/frontend/src/pages/AffiliateLanding.jsx`

Cari baris 13-16:
```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '1234567890', // Ganti dengan Pixel ID real untuk Dimas
  'default': '' // Pixel ID default jika ada
};
```

### Cara Tambah Pixel untuk Affiliator Baru:

```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '1234567890123',      // Pixel ID Dimas
  'andi': '9876543210987',       // Pixel ID Andi
  'sarah': '5555666677778',      // Pixel ID Sarah
  'default': '1111222233334'     // Pixel default untuk yang tidak punya custom
};
```

### Events yang Di-track:

1. **PageView** - Otomatis saat landing page dibuka
2. **Lead** - Saat form berhasil disubmit
3. **SubmitApplication** - Saat form berhasil disubmit

### Cara Dapatkan Meta Pixel ID:

1. Login ke Facebook Business Manager
2. Buka **Events Manager**
3. Pilih atau buat Pixel baru
4. Copy **Pixel ID** (angka 15-16 digit)
5. Paste ke konfigurasi `AFFILIATOR_PIXELS`

---

## 🗄️ Database

### Collection: `affiliate_leads`

Data tersimpan dengan struktur:
```json
{
  "id": "uuid",
  "name": "Nama User",
  "organization": "PT Example",
  "monthly_ad_spend": "Rp 10 juta - Rp 25 juta",
  "message": "Pesan dari user",
  "affiliator": "dimas",
  "submittedAt": "2025-01-29T12:30:00"
}
```

---

## 📊 Admin Dashboard

### Akses Dashboard:
```
https://mawanads.com/admin/dashboard
```

### Login:
- Password: `mawana2025admin` (ganti di `/app/frontend/src/context/AuthContext.jsx`)

### Features:

**Tab 1: Contact Form**
- Lihat semua submission dari homepage contact form
- Email, Phone, Organization
- Quick actions: WhatsApp & Email

**Tab 2: Affiliate Leads**
- Lihat semua submission dari affiliate landing pages
- **Badge Affiliator** - menunjukkan lead dari affiliator mana
- Organization, Monthly Ad Spend
- Sorting: Latest first

### Filter/Search by Affiliator:
Saat ini belum ada filter UI, tapi data sudah include field `affiliator`.

---

## 🎨 Customize Landing Page

### Edit Konten:

File: `/app/frontend/src/pages/AffiliateLanding.jsx`

**Hero Title** (baris 39-45):
```javascript
<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
  Scale Up Campaign Digital Anda Bersama 
  <span className="text-cyan-600">Mawana Digital Services</span>
</h1>
```

**Benefits** (baris 31-37):
```javascript
const benefits = [
  'Konsultasi strategi digital marketing gratis',
  'Akun whitelist Meta untuk campaign lebih stabil',
  // ... tambah/edit benefit di sini
];
```

**Dropdown Options** (baris 23-30):
```javascript
const spendOptions = [
  'Di bawah Rp 5 juta',
  // ... edit range budget
];
```

### Warna Brand:
Sudah menggunakan cyan-blue gradient sesuai brand Mawana.

---

## 🚀 Cara Tambah Affiliator Baru

### Step 1: Buat URL
Format: `https://mawanads.com/affiliate/{nama-affiliator}`

### Step 2: Setup Meta Pixel (Opsional)
Tambahkan di `AFFILIATOR_PIXELS` config

### Step 3: Share Link
Berikan URL ke affiliator untuk promosi

### Step 4: Monitor Dashboard
Login admin dashboard untuk lihat leads masuk

---

## 📈 Best Practices

### Untuk Affiliator:
1. **Gunakan UTM Parameters** untuk tracking lebih detail:
   ```
   https://mawanads.com/affiliate/dimas?utm_source=facebook&utm_campaign=promo1
   ```

2. **Pixel Custom Events** - track specific actions
3. **A/B Testing** - test different messaging

### Untuk Admin:
1. **Response Time** - hubungi leads dalam 24 jam
2. **CRM Integration** - export data ke CRM system
3. **Commission Tracking** - catat conversion per affiliator

---

## 🔧 API Endpoints

### Submit Affiliate Lead:
```
POST /api/affiliate-lead

Body:
{
  "name": "string",
  "organization": "string",
  "monthly_ad_spend": "string",
  "message": "string",
  "affiliator": "string"
}
```

### Get All Leads (Admin):
```
GET /api/affiliate-leads

Response:
[
  {
    "id": "uuid",
    "name": "...",
    "affiliator": "dimas",
    ...
  }
]
```

---

## 🎯 Use Cases

### NGO/Yayasan Campaign:
```
https://mawanads.com/affiliate/ngo-partner
```

### Corporate Partnership:
```
https://mawanads.com/affiliate/corporate-program
```

### Event Specific:
```
https://mawanads.com/affiliate/ramadan-campaign-2025
```

---

## ⚠️ Important Notes

1. **Pixel ID Wajib Valid**
   - Gunakan Pixel ID real dari Facebook
   - Test dengan Facebook Pixel Helper extension

2. **GDPR Compliance**
   - Inform users tentang tracking
   - Tambahkan Privacy Policy jika perlu

3. **Rate Limiting**
   - Backend sudah handle validation
   - Prevent spam submissions

4. **Mobile Responsive**
   - Landing page fully responsive
   - Test di berbagai device

---

## 📞 Support

**Technical Issues:**
- Check backend logs: `/var/log/supervisor/backend.err.log`
- Check frontend logs: Browser Console (F12)

**Business Questions:**
- Email: marissamarwahmadina@gmail.com
- WhatsApp: +62 896-5512-8024

---

## 🎁 Bonus: Commission Tracking

Untuk track commission, Anda bisa:

1. **Export Data** dari Admin Dashboard
2. **Count Conversions** per affiliator
3. **Calculate Commission** berdasarkan deal value

### Future Enhancement:
- Auto-commission calculator
- Real-time affiliate dashboard
- Payment integration

---

**Happy Affiliating! 🚀**

Track, Convert, Scale!
