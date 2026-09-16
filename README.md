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
   NODE_ENV=development
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
