const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan direktori uploads tersedia
const produkDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'produk');
const logoDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'logo');

[produkDir, logoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage untuk Foto Produk
const storageProduk = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, produkDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

// Storage untuk Logo Toko
const storageLogo = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'store-logo' + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Hanya file gambar (JPG, PNG, WebP, GIF, SVG) yang diperbolehkan!'));
};

const uploadProduk = multer({
  storage: storageProduk,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter
});

const uploadLogo = multer({
  storage: storageLogo,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter
});

module.exports = {
  uploadProduk,
  uploadLogo
};
