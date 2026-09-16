require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

// Database initialization
const initDatabase = require('./db/init');

// Middlewares
const localsMiddleware = require('./middlewares/locals');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const posRoutes = require('./routes/pos');
const produkRoutes = require('./routes/produk');
const kategoriRoutes = require('./routes/kategori');
const stokOpnameRoutes = require('./routes/stokOpname');
const poImportRoutes = require('./routes/poImport');
const masterRoutes = require('./routes/master');
const pengaturanRoutes = require('./routes/pengaturan');
const usersRoutes = require('./routes/users');
const auditLogRoutes = require('./routes/auditLog');
const laporanRoutes = require('./routes/laporan');
const katalogRoutes = require('./routes/katalog');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// BODY PARSER & STATIC ASSETS
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================
// SESSION & FLASH MESSAGES
// ============================================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'scorip-pos-secret-production-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
      httpOnly: true
    }
  })
);

app.use(flash());

// ============================================================
// VIEW ENGINE SETUP
// ============================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ============================================================
// GLOBAL LOCALS & HELPERS
// ============================================================
app.use(localsMiddleware);

// ============================================================
// ROUTE REGISTRATION
// ============================================================
app.use('/', katalogRoutes); // /katalog publik
app.use('/', authRoutes); // /login, /logout
app.use('/', dashboardRoutes); // /dashboard
app.use('/', posRoutes); // /pos, /pos/transaksi, /pos/riwayat, /pos/transaksi/:id/struk
app.use('/', produkRoutes); // /produk
app.use('/', kategoriRoutes); // /kategori
app.use('/', stokOpnameRoutes); // /stok-opname
app.use('/', poImportRoutes); // /po-import
app.use('/', masterRoutes); // /supplier, /forwarder, /pelanggan
app.use('/', pengaturanRoutes); // /pengaturan
app.use('/', usersRoutes); // /users
app.use('/', auditLogRoutes); // /audit-log
app.use('/', laporanRoutes); // /laporan
app.use('/api', apiRoutes); // /api/...

// Root redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'Staff') {
      return res.redirect('/pos');
    }
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// PWA Assets
app.get('/manifest.webmanifest', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'manifest.webmanifest'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('pages/dashboard/index', {
    layout: false,
    title: '404 - Halaman Tidak Ditemukan',
    user: req.session?.user || { nama: 'User' },
    data: {
      total_produk: 0,
      transaksi_hari_ini: 0,
      pendapatan_bulan: 0,
      stok_alert: 0,
      transaksi_terakhir: [],
      penjualan_7hari: { labels: [], data: [] },
      penjualan_kategori: { labels: [], data: [] },
      produk_terlaris: { labels: [], data: [] }
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan internal server.' });
  }
  req.flash('error', 'Terjadi kesalahan sistem: ' + err.message);
  res.redirect('/dashboard');
});

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
  try {
    // Inisialisasi DB terlebih dahulu
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`\n✨ SCORIP POS Server berjalan aktif di http://localhost:${PORT}`);
      console.log(`📋 Login Admin: username: "admin", password: "admin123"`);
      console.log(`📋 Login Kasir: username: "kasir1", password: "kasir123"\n`);
    });
  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
