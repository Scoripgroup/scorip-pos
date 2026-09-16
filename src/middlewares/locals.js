const db = require('../config/database');

async function getStoreSettings() {
  try {
    const rows = await db('settings').select('key', 'value');
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    return settings;
  } catch (err) {
    return {};
  }
}

function clearSettingsCache() {
  // No-op, settings always query fresh
}

module.exports = async function localsMiddleware(req, res, next) {
  const user = req.session?.user || null;
  const isAdmin = Boolean(user && user.role === 'Admin');
  res.locals.user = user;
  res.locals.currentUser = user;
  res.locals.isAdmin = isAdmin;
  res.locals.canSeeCost = isAdmin; // Hanya Admin yang boleh melihat harga beli/modal, profit, dan margin
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.activePage = '';

  const settings = await getStoreSettings();
  settings.nama_aplikasi = settings.nama_toko || settings.nama_aplikasi || 'SCORIP POS';
  settings.sub_judul = settings.slogan || settings.sub_judul || 'Sistem POS Kasir & PO Import Barang';
  res.locals.settings = settings;
  res.locals.appName = settings.nama_aplikasi;

  // Dynamic Staff Permissions
  const defaultStaffPermissions = ['pos', 'produk', 'kategori', 'stok_opname', 'pelanggan'];
  let staffPerms = defaultStaffPermissions;
  if (settings.staff_permissions) {
    try {
      staffPerms = typeof settings.staff_permissions === 'string' ? JSON.parse(settings.staff_permissions) : settings.staff_permissions;
    } catch (e) {
      staffPerms = defaultStaffPermissions;
    }
  }
  res.locals.staffPermissions = staffPerms;

  // Helper canAccess untuk mengecek izin menu / modul
  res.locals.canAccess = (moduleKey) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return staffPerms.includes(moduleKey);
  };

  // Helper functions untuk EJS
  res.locals.formatRupiah = (number) => {
    return 'Rp ' + Number(number || 0).toLocaleString('id-ID');
  };

  res.locals.formatTanggal = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  next();
};

module.exports.clearSettingsCache = clearSettingsCache;
