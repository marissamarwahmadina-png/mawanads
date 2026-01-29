# 🔐 INFORMASI LOGIN ADMIN PANEL

## Password Admin Default
```
Username: (tidak ada, langsung password)
Password: mawana2025admin
```

⚠️ **PENTING: GANTI PASSWORD INI!**

## Cara Ganti Password

Edit file: `/app/frontend/src/context/AuthContext.jsx`

Cari baris 22:
```javascript
const ADMIN_PASSWORD = 'mawana2025admin'; // ⚠️ CHANGE THIS PASSWORD!
```

Ganti dengan password baru:
```javascript
const ADMIN_PASSWORD = 'password_baru_anda_disini';
```

Save file dan restart frontend jika perlu.

---

## Akses Admin Panel

### Development (Localhost)
```
http://localhost:3000/admin/login
```

### Production (Website)
```
https://mawanads.com/admin/login
```
atau
```
https://www.mawanads.com/admin/login
```

---

## Cara Login

1. Buka URL `/admin/login`
2. Masukkan password: `mawana2025admin` (atau password yang sudah diganti)
3. Klik "Login"
4. Akan redirect ke halaman `/admin/contacts`

---

## Fitur Admin Panel

### Halaman Contacts (`/admin/contacts`)

✅ **View Submissions**
- Lihat semua form submission dari website
- Data lengkap: nama, email, phone, organisasi, pesan, tanggal

✅ **Quick Actions**
- Button WhatsApp - langsung chat ke nomor customer
- Button Email - langsung buka email client
- Button Refresh - reload data terbaru
- Button Logout - keluar dari admin panel

✅ **Responsive Design**
- Tampilan bagus di desktop, tablet, dan mobile

---

## Keamanan

### Saat Ini
- ✅ Protected dengan password
- ✅ Login state tersimpan di localStorage
- ✅ Redirect otomatis ke login jika belum auth

### Yang Perlu Dilakukan (Production)

1. **WAJIB Ganti Password**
   - Password default `mawana2025admin` terlalu simple
   - Ganti dengan kombinasi huruf besar, kecil, angka, dan simbol
   - Contoh: `Mw#2025!Admin@Secure`

2. **Tambah HTTPS** (Jika belum)
   - Pastikan website menggunakan HTTPS
   - Password akan terenkripsi saat dikirim

3. **IP Whitelist** (Opsional)
   - Hanya allow IP kantor/tertentu akses admin
   - Bisa setup di Cloudflare atau server level

4. **Rate Limiting** (Opsional)
   - Batasi percobaan login (max 5x per 15 menit)
   - Cegah brute force attack

---

## Logout

Cara logout:
1. Di halaman admin, klik button **"Logout"** (merah) di kanan atas
2. Akan redirect ke halaman login
3. Session akan dihapus dari localStorage

---

## Troubleshooting

### Tidak Bisa Login Walaupun Password Benar
- Clear browser cache & localStorage
- Hard refresh: Ctrl + Shift + R (Windows) atau Cmd + Shift + R (Mac)
- Coba browser mode incognito

### Tiba-tiba Logout Sendiri
- Normal jika clear browser data atau ganti browser/device
- Login state tersimpan di localStorage browser

### Lupa Password
- Edit file `/app/frontend/src/context/AuthContext.jsx`
- Lihat baris 22 untuk password yang aktif
- Atau ganti dengan password baru

---

## Data Contact Form

### Via Admin Panel
URL: `/admin/contacts`

### Via API
```bash
curl https://mawanads.com/api/contacts
```

### Response Format
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "organization": "PT Example",
    "message": "Pesan dari customer",
    "submittedAt": "2025-01-29T12:30:00"
  }
]
```

---

## Contact Info untuk Support

**Email:** marissamarwahmadina@gmail.com
**WhatsApp:** +62 896-5512-8024

---

**Catatan:**
- Jangan share password admin ke publik
- Ganti password secara berkala (3-6 bulan sekali)
- Selalu logout setelah selesai menggunakan admin panel
- Jangan akses admin panel dari komputer publik/warnet

🔒 Keep it secure!
