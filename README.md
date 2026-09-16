# SCORIP POS — Sistem POS Kasir & PO Import Barang

Aplikasi manajemen operasional ritel terpadu berbasis web yang menghubungkan alur pengadaan barang import (**PO Import**) dengan penjualan titik kasir (**POS Kasir**) secara real-time.

---

## 🚀 Fitur Utama

1. **Dashboard Analitik**
   - Ringkasan omzet, laba kotor, jumlah transaksi, dan nilai inventaris.
   - Grafik penjualan produk terlaris dan tren transaksi (menggunakan Chart.js).
2. **POS Kasir (Point of Sale)**
   - Kasir cepat dengan pencarian instan dan scanner barcode/QR kamera (`html5-qrcode`).
   - Perhitungan diskon per item/total, kembalian, dan multi-metode pembayaran.
   - Cetak struk belanja thermal/printer standard & integrasi WhatsApp invoice.
3. **Katalog Publik (Online)**
   - Etalase produk publik di `/katalog` tanpa perlu login pelanggan.
4. **PO Import & Biaya Landed Cost (Khusus Admin)**
   - Manajemen pengadaan barang import supplier luar negeri (RMB ke IDR).
   - Kalkulasi otomatis Landed Cost (biaya forwarder, kurs RMB, dan ongkir lokal).
   - Tracking status pengiriman koli & riwayat resi ekspedisi forwarder.
5. **Inventaris & Manajemen Produk**
   - Manajemen SKU, nama, kategori, harga beli, harga jual, dan stok minimum.
   - Cetak label barcode menggunakan `JsBarcode`.
   - Proteksi data harga beli & laba kotor (hanya bisa dilihat oleh Admin).
6. **Stok Opname**
   - Penyesuaian stok berkala (stok sistem vs stok fisik) dilengkapi riwayat dan catatan selisih.
7. **Master Data & Kontak**
   - Data Pelanggan, Supplier, dan Mitra Ekspedisi Forwarder.
8. **Keamanan & Audit Log**
   - Autentikasi sesi (`express-session`), enkripsi password dengan `bcrypt`.
   - Rate limiting untuk proteksi brute force login.
   - Kontrol akses berbasis peran (**Admin** & **Kasir**).
   - Pencatatan jejak audit (Audit Log) setiap aktivitas penting.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Backend Framework:** Express.js
- **Database & ORM:** SQLite (Knex.js query builder)
- **Template Engine:** EJS (`express-ejs-layouts`)
- **Frontend UI:** Bootstrap 5, Bootstrap Icons
- **Libraries:** Chart.js, html5-qrcode, JsBarcode, bcryptjs

---

## 📋 Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan komputer Anda telah terinstal:
- [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan)
- [npm](https://www.npmjs.com/) (terpasang otomatis bersama Node.js)

---

## ⚙️ Panduan Instalasi

1. **Clone Repositori dari GitHub**
   Buka terminal/PowerShell dan jalankan perintah clone:
   ```bash
   git clone https://github.com/Scoripgroup/scorip-pos.git
   cd scorip-pos
   ```

2. **Install Dependensi**
   Jalankan perintah berikut untuk mengunduh seluruh paket dependensi:
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan (`.env`)**
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   # Di Linux / macOS:
   cp .env.example .env

   # Di Windows (PowerShell):
   copy .env.example .env
   ```
   Sesuaikan isinya jika diperlukan:
   ```env
   PORT=3000
   NODE_ENV=developmentA
   SESSION_SECRET=scorip-pos-secret-key-change-in-production
   ```

4. **Inisialisasi Database**
   Database SQLite beserta skema tabel dan akun default akan **dibuat otomatis** saat pertama kali aplikasi dijalankan. File database disimpan di `./data/scorip-pos.sqlite`.

---

## 🖥️ Cara Menjalankan Aplikasi

### Mode Pengembangan (Live Reload via Nodemon):
```bash
npm run dev
```

### Mode Standar / Produksi:
```bash
npm start
```

Setelah server berhasil berjalan, buka browser dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Akun Default Login

Sistem dilengkapi dua akun bawaan untuk pengujian role:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses penuh ke seluruh menu (PO Import, Laporan, User, Pengaturan, dsb.) |
| **Kasir** | `kasir1` | `kasir123` | Akses operasional kasir (POS, Katalog, Data Produk & Pelanggan, Stok Opname) |

---

## 🌐 Panduan Deployment di Ubuntu Server / VPS (Dari Nol)

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi pada server VPS baru (Ubuntu 20.04 / 22.04 / 24.04 LTS):

### 1. Update Sistem & Install Paket Dasar
Login ke VPS via SSH, lalu jalankan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### 2. Install Node.js LTS (Versi 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi:
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 3. Clone Repositori (Private Repo)
Karena repositori berstatus **Private**, gunakan Personal Access Token (PAT) GitHub saat clone:
```bash
git clone https://github.com/Scoripgroup/scorip-pos.git
# Masukkan Username GitHub Anda
# Masukkan Personal Access Token (PAT) sebagai Password
```
Atau jika ingin langsung dengan token:
```bash
git clone https://<GITHUB_TOKEN>@github.com/Scoripgroup/scorip-pos.git
```

Masuk ke folder proyek:
```bash
cd scorip-pos
```

### 4. Install Dependensi Proyek
```bash
npm install
```

### 5. Konfigurasi Environment (`.env`)
```bash
cp .env.example .env
nano .env
```
Sesuaikan nilai di dalam `.env`:
```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=buat-string-acak-rahasia-panjang-di-sini
```
*(Tekan `Ctrl + O` lalu `Enter` untuk simpan, dan `Ctrl + X` untuk keluar dari nano).*

### 6. Jalankan Server dengan PM2 (Process Manager)
Agar aplikasi tetap aktif di background saat SSH ditutup atau server restart:
```bash
# Install PM2 global
sudo npm install -g pm2

# Jalankan aplikasi
pm2 start src/app.js --name "scorip-pos"

# Aktifkan auto-start saat VPS reboot
pm2 save
pm2 startup
# (Jalankan perintah yang disarankan di terminal jika diminta)
```

### 7. Buka Port Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp     # HTTP (Nginx)
sudo ufw allow 443/tcp    # HTTPS (SSL)
sudo ufw allow 3000/tcp   # Akses langsung port app (opsional)
sudo ufw enable
```

---

### 8. (Sangat Disarankan) Konfigurasi Nginx Reverse Proxy
Menggunakan Nginx memungkinkan Anda mengakses aplikasi via domain atau port 80/443 tanpa perlu mengetik `:3000`.

1. **Install Nginx:**
   ```bash
   sudo apt install -y nginx
   ```

2. **Buat File Konfigurasi Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/scorip-pos
   ```
   Tempelkan konfigurasi berikut (ganti `domain-anda.com` dengan domain Anda atau IP VPS):
   ```nginx
   server {
       listen 80;
       server_name domain-anda.com; # atau IP Server VPS jika belum punya domain

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Aktifkan Konfigurasi & Restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/scorip-pos /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 9. Pasang SSL Gratis (HTTPS) dengan Certbot
Jika Anda menggunakan domain:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com
```

### 10. Cara Update Aplikasi di Masa Mendatang
Jika ada pembaruan kode di GitHub:
```bash
cd ~/scorip-pos
git pull origin main
npm install
pm2 restart scorip-pos
```

---

## 📂 Struktur Direktori Utama

```
KASIR POS/
├── data/                  # File SQLite database
├── public/                # Static assets (CSS, JS, Gambar, Vendor)
├── src/
│   ├── config/            # Konfigurasi database & environment
│   ├── controllers/       # Logika controller per modul
│   ├── db/                # Skema migrasi & seed data awal
│   ├── middlewares/       # Auth guard, role check, rate limiter, audit
│   ├── routes/            # Rute Express per modul
│   ├── views/             # File template EJS (layouts, partials, pages)
│   └── app.js             # Entry point utama aplikasi Express
├── .env                   # Variabel environment
├── package.json           # Dependensi & script project
└── README.md              # Dokumentasi proyek
```

---

## 📄 Lisensi
Hak Cipta © 2026 **SCORIP POS**. All rights reserved.
