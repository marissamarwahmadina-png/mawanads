# 📍 CARA TANAM META PIXEL - Panduan Lengkap

## 🎯 Apa itu Meta Pixel?

Meta Pixel adalah kode tracking dari Facebook/Instagram yang memungkinkan Anda:
- Track visitor yang datang ke landing page
- Track konversi (form submission)
- Retargeting audience
- Optimasi iklan berdasarkan data user

---

## 📋 Prerequisites

Sebelum mulai, Anda harus punya:
1. **Facebook Business Manager** account
2. **Meta Pixel ID** (15-16 digit angka)

---

## 🔍 Cara Dapatkan Meta Pixel ID

### Step 1: Login ke Facebook Business Manager
```
https://business.facebook.com
```

### Step 2: Buka Events Manager
1. Klik menu **"Events Manager"** di sidebar
2. Atau langsung ke: `https://business.facebook.com/events_manager2`

### Step 3: Buat Pixel Baru (Jika Belum Ada)
1. Klik **"Connect Data Sources"**
2. Pilih **"Web"**
3. Pilih **"Facebook Pixel"**
4. Klik **"Connect"**
5. Masukkan nama pixel (contoh: "Mawana Affiliate - Dimas")
6. Klik **"Create Pixel"**

### Step 4: Dapatkan Pixel ID
1. Setelah pixel dibuat, akan muncul **Pixel ID** (contoh: `123456789012345`)
2. Copy Pixel ID ini
3. Simpan di tempat aman

**Screenshot di Events Manager:**
```
┌─────────────────────────────────────┐
│ Mawana Affiliate - Dimas            │
│ Pixel ID: 123456789012345           │ ← COPY INI
│ Status: Active                       │
└─────────────────────────────────────┘
```

---

## 🛠️ Cara Tanam Pixel di Landing Page Affiliate

### Metode 1: Update Konfigurasi (Recommended)

**File:** `/app/frontend/src/pages/AffiliateLanding.jsx`

**Lokasi:** Baris 13-16

**Sebelum:**
```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '1234567890', // Ganti dengan Pixel ID real untuk Dimas
  'default': '' // Pixel ID default jika ada
};
```

**Sesudah:**
```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '123456789012345', // ← PASTE Pixel ID Dimas di sini
  'default': '' 
};
```

**Contoh Multiple Affiliators:**
```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '123456789012345',
  'andi': '987654321098765',
  'sarah': '555666777888999',
  'default': '111222333444555' // Fallback pixel
};
```

**Save file** dan pixel otomatis aktif! ✅

---

## 🔄 Restart Frontend (Opsional)

Jika perubahan tidak terlihat, restart:

```bash
sudo supervisorctl restart frontend
```

Wait 10 detik, lalu test landing page.

---

## ✅ Cara Test Apakah Pixel Sudah Tertanam

### Method 1: Meta Pixel Helper (Chrome Extension)

1. **Install Extension:**
   - Buka Chrome Web Store
   - Cari: **"Meta Pixel Helper"**
   - Install extension

2. **Test Landing Page:**
   - Buka: `http://localhost:3000/affiliate/dimas`
   - Klik icon **Meta Pixel Helper** di toolbar Chrome
   - Akan muncul:
     ```
     ✅ PageView event detected
     Pixel ID: 123456789012345
     ```

3. **Test Form Submit:**
   - Isi form di landing page
   - Submit form
   - Pixel Helper akan show:
     ```
     ✅ Lead event detected
     ✅ SubmitApplication event detected
     ```

### Method 2: Facebook Events Manager

1. Buka **Events Manager** di Facebook Business Manager
2. Pilih pixel Anda (contoh: "Mawana Affiliate - Dimas")
3. Klik tab **"Test Events"**
4. Buka landing page di browser:
   ```
   http://localhost:3000/affiliate/dimas
   ```
5. Di Events Manager, akan real-time muncul:
   ```
   🟢 PageView - Just now
   ```
6. Submit form, akan muncul:
   ```
   🟢 Lead - Just now
   🟢 SubmitApplication - Just now
   ```

### Method 3: Browser Console

1. Buka landing page
2. Tekan **F12** (Developer Tools)
3. Klik tab **Console**
4. Ketik:
   ```javascript
   window.fbq
   ```
5. Jika pixel tertanam, akan muncul:
   ```javascript
   ƒ fbq() { [native code] }
   ```

---

## 📊 Events yang Otomatis Di-track

Landing page affiliate sudah setup tracking untuk:

### 1. PageView
- **Kapan:** User membuka landing page
- **Digunakan untuk:** Hitung traffic, retargeting

### 2. Lead
- **Kapan:** User submit form
- **Digunakan untuk:** Track konversi, optimize ads for leads

### 3. SubmitApplication
- **Kapan:** User submit form
- **Digunakan untuk:** Specific conversion tracking

---

## 🎨 Custom Events (Advanced)

Jika mau track event tambahan, edit file `AffiliateLanding.jsx`:

### Contoh: Track Button Click

```javascript
import { trackMetaEvent } from '../components/MetaPixel';

// Di dalam component
const handleButtonClick = () => {
  trackMetaEvent('ViewContent', {
    content_name: 'Pricing Section',
    content_category: 'Engagement'
  });
};
```

### Event Options:
- `ViewContent` - User lihat konten tertentu
- `AddToCart` - User tambah ke cart (e-commerce)
- `InitiateCheckout` - User mulai checkout
- `Purchase` - User beli (dengan value)

---

## 🔐 Keamanan & Privacy

### GDPR Compliance:
Jika target audience di EU, tambahkan:
1. **Cookie Consent Banner**
2. **Privacy Policy** dengan mention Meta Pixel
3. **Opt-out Option**

### Cara Disable Pixel untuk Testing:

Edit `AffiliateLanding.jsx`:
```javascript
const AFFILIATOR_PIXELS = {
  'dimas': '', // ← Kosongkan untuk disable
  'default': ''
};
```

---

## 🚨 Troubleshooting

### Pixel Tidak Terdeteksi?

**Checklist:**
1. ✅ Pixel ID benar? (15-16 digit)
2. ✅ Sudah save file & restart frontend?
3. ✅ Browser cache clear? (Ctrl + Shift + R)
4. ✅ AdBlocker disabled?
5. ✅ Inspect Console untuk error?

### Pixel Terdeteksi Tapi Event Tidak Muncul?

**Check:**
1. Form submit berhasil? (lihat toast notification)
2. Backend API berfungsi? (check network tab)
3. Meta Pixel Helper show event?

### Multiple Pixels untuk 1 Landing Page?

Edit `MetaPixel.jsx` untuk support multiple pixels:
```javascript
// Initialize multiple pixels
window.fbq('init', pixelId1);
window.fbq('init', pixelId2);
window.fbq('track', 'PageView');
```

---

## 📈 Best Practices

### 1. Pixel per Campaign
Buat pixel terpisah untuk setiap campaign besar:
- Pixel A: Ramadan Campaign
- Pixel B: Year End Campaign
- Pixel C: Regular Affiliate

### 2. Standard Events vs Custom Events
- **Standard Events** (Lead, Purchase) → Recommended
- **Custom Events** → Untuk tracking khusus

### 3. Test Before Launch
Selalu test pixel sebelum kasih link ke affiliator:
1. Test PageView
2. Test form submission
3. Verify di Events Manager

### 4. Monitor Daily
Check Events Manager setiap hari:
- Pixel masih active?
- Events masuk sesuai traffic?
- Ada anomaly?

---

## 🎯 URLs untuk Masing-masing Affiliator

Setelah pixel ditanam, URLs siap digunakan:

```
# Development
http://localhost:3000/affiliate/dimas
http://localhost:3000/affiliate/andi
http://localhost:3000/affiliate/sarah

# Production
https://mawanads.com/affiliate/dimas
https://mawanads.com/affiliate/andi
https://mawanads.com/affiliate/sarah
```

**Plus UTM Parameters (Optional):**
```
https://mawanads.com/affiliate/dimas?utm_source=facebook&utm_campaign=promo_jan
```

---

## 📞 Butuh Bantuan?

**Meta Pixel Issues:**
- Facebook Help Center: https://www.facebook.com/business/help/952192354843755
- Meta Pixel Setup Guide: https://www.facebook.com/business/help/314143102596705

**Technical Support:**
- Email: marissamarwahmadina@gmail.com
- WhatsApp: +62 896-5512-8024

---

## ✅ Quick Checklist

Sebelum launch, pastikan:
- [ ] Pixel ID sudah di-paste di `AffiliateLanding.jsx`
- [ ] File sudah di-save
- [ ] Frontend sudah di-restart (jika perlu)
- [ ] Test dengan Meta Pixel Helper
- [ ] Verify di Events Manager
- [ ] PageView event terdeteksi
- [ ] Lead event terdeteksi saat submit form
- [ ] URL affiliate sudah dibagikan ke affiliator

---

**Selamat! Pixel Anda sekarang sudah aktif! 🎉**

Track, Measure, Optimize! 📊
