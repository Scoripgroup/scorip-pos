/**
 * Authentication and Role-based Access Control Middlewares
 */

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa, silakan login kembali.' });
  }

  req.flash('error', 'Silakan login terlebih dahulu untuk mengakses sistem.');
  return res.redirect('/login');
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      }
      return res.redirect('/login');
    }

    if (req.session.user.role !== role) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Membutuhkan hak akses ' + role });
      }
      req.flash('error', 'Akses ditolak! Anda tidak memiliki izin untuk halaman tersebut.');
      return res.redirect('/dashboard');
    }

    next();
  };
}

function requirePermission(moduleKey) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
      }
      return res.redirect('/login');
    }

    // Admin selalu memiliki akses penuh ke semua modul
    if (req.session.user.role === 'Admin') {
      return next();
    }

    // Periksa izin non-admin (Staff)
    const staffPerms = res.locals.staffPermissions || ['pos', 'produk', 'kategori', 'stok_opname', 'pelanggan'];
    if (staffPerms.includes(moduleKey)) {
      return next();
    }

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Anda tidak memiliki izin untuk modul ini.' });
    }

    req.flash('error', 'Akses ditolak: Akun Anda tidak memiliki izin untuk mengakses halaman tersebut.');
    return res.redirect('/pos');
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission
};

