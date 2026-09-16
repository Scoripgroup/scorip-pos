const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const authController = {
  showLogin(req, res) {
    if (req.session && req.session.user) {
      if (req.session.user.role === 'Staff') {
        return res.redirect('/pos');
      }
      return res.redirect('/dashboard');
    }
    res.render('pages/auth/login', {
      layout: 'layouts/auth',
      title: 'Login — SCORIP POS',
      error: req.flash('error'),
      success: req.flash('success')
    });
  },

  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'Silakan masukkan username dan password.');
      return res.redirect('/login');
    }

    try {
      const user = await db('users').where({ username }).first();

      if (!user) {
        req.flash('error', 'Username atau password tidak cocok.');
        return res.redirect('/login');
      }

      if (user.status !== 'aktif') {
        req.flash('error', 'Akun Anda berstatus nonaktif. Silakan hubungi Administrator.');
        return res.redirect('/login');
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        req.flash('error', 'Username atau password tidak cocok.');
        return res.redirect('/login');
      }

      // Login berhasil, simpan session
      req.session.user = {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role
      };

      await logAction(req, 'LOGIN', `User ${user.username} (${user.role}) berhasil masuk ke sistem.`);

      req.flash('success', `Selamat datang kembali, ${user.nama}!`);

      if (user.role === 'Staff') {
        return res.redirect('/pos');
      }
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      req.flash('error', 'Terjadi kesalahan sistem saat proses login.');
      return res.redirect('/login');
    }
  },

  async logout(req, res) {
    if (req.session && req.session.user) {
      await logAction(req, 'LOGOUT', `User ${req.session.user.username} logout.`);
      req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
      });
    } else {
      res.redirect('/login');
    }
  }
};

module.exports = authController;
