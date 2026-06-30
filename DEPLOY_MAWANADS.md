# Panduan Deploy mawanads (tanpa Emergent)

App ini full-stack, jadi dipisah ke 3 layanan gratis:

| Bagian | Layanan | URL nanti |
|---|---|---|
| Database (MongoDB) | MongoDB Atlas (M0 gratis) | connection string |
| Backend (FastAPI) | Render (free) | `https://mawanads-backend.onrender.com` |
| Frontend (React) | Vercel (free) | `https://mawanads.vercel.app` |

Alur: **Atlas → push ke GitHub → Render (backend) → Vercel (frontend) → sambungkan**.

---

## Langkah A — Database: MongoDB Atlas

1. Daftar di https://www.mongodb.com/cloud/atlas/register (gratis).
2. **Create a cluster** → pilih **M0 (Free)** → region terdekat (mis. Singapore).
3. **Database Access** → Add New Database User → buat username & password (catat).
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`).
   (Render IP-nya dinamis, jadi ini perlu.)
5. **Connect** → **Drivers** → salin connection string, bentuknya:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Ganti `USER` & `PASSWORD` dengan yang kamu buat di langkah 3.

> Ini connection string untuk env `MONGO_URL`. Database mulai **kosong** (data lama tidak ada).

---

## Langkah B — Push file deploy ke GitHub

File deploy (`render.yaml`, `requirements.txt` ramping, `vercel.json`, dll.) sudah disiapkan
di folder ini. Tinggal di-push ke repo `mawanads`. **Butuh autentikasi GitHub** — lihat
bagian "Autentikasi" di bawah, lalu:

```bash
cd mawanads-deploy
git add -A
git commit -m "chore: konfigurasi deploy Render + Vercel"
git push origin main
```

---

## Langkah C — Backend di Render

1. Daftar di https://render.com (login pakai GitHub).
2. **New → Blueprint** → pilih repo `mawanads`. Render baca `render.yaml` otomatis.
3. Render minta isi env var (yang `sync:false`):
   - `MONGO_URL` → connection string Atlas (Langkah A).
   - `ADMIN_PASSWORD` → password login admin (buat yang kuat).
   - `CORS_ORIGINS` & `REACT_APP_FRONTEND_URL` → **kosongkan dulu**, isi setelah Vercel jadi (Langkah E).
   - Email (Resend) & TriPay → boleh dikosongkan dulu (opsional).
4. **Apply / Create** → tunggu build (~3-5 menit).
5. Setelah hijau, catat URL-nya, mis. `https://mawanads-backend.onrender.com`.
   Tes: buka `https://mawanads-backend.onrender.com/api/health` → harus muncul `{"status":"healthy"...}`.

---

## Langkah D — Frontend di Vercel

1. Daftar di https://vercel.com (login pakai GitHub).
2. **Add New → Project** → import repo `mawanads`.
3. **Root Directory** → set ke **`frontend`** (penting!).
4. Framework: Create React App (auto). Build & output sudah diatur `vercel.json`.
5. **Environment Variables** → tambah:
   - `REACT_APP_BACKEND_URL` = URL backend Render (Langkah C), **tanpa** garis miring akhir, **tanpa** `/api`.
6. **Deploy** → tunggu (~2-3 menit). Catat URL, mis. `https://mawanads.vercel.app`.

---

## Langkah E — Sambungkan keduanya (CORS)

1. Balik ke **Render** → service backend → **Environment**:
   - `CORS_ORIGINS` = URL Vercel (mis. `https://mawanads.vercel.app`)
   - `REACT_APP_FRONTEND_URL` = URL Vercel yang sama
2. Save → Render redeploy otomatis.
3. Buka URL Vercel → coba login admin pakai `ADMIN_PASSWORD`. Selesai! 🎉

---

## Hal penting yang perlu kamu tahu

- **Render free "tidur"** setelah 15 menit idle. Buka pertama kali setelah idle = loading ~50 detik. Wajar.
- **File upload (bukti transfer) bersifat sementara** di Render free — hilang saat redeploy/restart.
  Kalau platform dipakai serius, nanti pindahkan upload ke cloud storage (S3/Cloudinary).
- **Email & pembayaran opsional**: app tetap jalan tanpa Resend/TriPay; isi key-nya saat siap.
- Login admin: endpoint `/api/admin/login`, password = `ADMIN_PASSWORD`. Jangan pakai default.

---

## Autentikasi GitHub (untuk `git push`)

Di komputer ini belum ada kredensial GitHub. Cara tercepat — **Personal Access Token (PAT)**:

1. Buka https://github.com/settings/tokens → **Generate new token (classic)**.
2. Centang scope **`repo`** → Generate → salin token (mulai `ghp_...`).
3. Saat `git push` minta Username & Password: isi Username = `marissamarwahmadina-png`,
   Password = **token** (bukan password GitHub).

(Token ini rahasia — jangan dibagikan ke siapa pun / jangan di-commit.)
