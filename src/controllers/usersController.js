const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const usersController = {
  async index(req, res) {
    try {
      const users = await db('users').orderBy('id', 'asc');

      // Ambil last login dari audit_log
      for (const u of users) {
        const lastLog = await db('audit_log')
          .where({ username: u.username, action: 'LOGIN' })
          .orderBy('id', 'desc')
          .first();
        u.last_login = lastLog ? lastLog.created_at : null;
      }

      res.render('pages/users/index', {
        title: 'Manajemen User — SCORIP POS',
        activePage: 'users',
        users
      });
    } catch (err) {
      console.error('Error list users:', err);
      req.flash('error', 'Gagal memuat daftar user.');
      res.redirect('/dashboard');
    }
  },

  async create(req, res) {
    try {
      const { username, nama, password, role, status } = req.body;

      if (!username || !password || !nama) {
        req.flash('error', 'Username, Nama, dan Password wajib diisi.');
        return res.redirect('/users');
      }

      const existing = await db('users').where({ username: username.trim() }).first();
      if (existing) {
        req.flash('error', `Username "${username.trim()}" sudah terdaftar.`);
        return res.redirect('/users');
      }

      const password_hash = await bcrypt.hash(password, 10);

      await db('users').insert({
        username: username.trim(),
        nama: nama.trim(),
        password_hash,
        role: role || 'Staff',
        status: status || 'aktif'
      });

      await logAction(req, 'CREATE_USER', `Membuat user baru: ${username.trim()} (${role})`);
      req.flash('success', `User "${username.trim()}" berhasil dibuat.`);
      res.redirect('/users');
    } catch (err) {
      console.error('Error create user:', err);
      req.flash('error', 'Gagal menambahkan user baru.');
      res.redirect('/users');
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { username, nama, role, status, password } = req.body;

      const user = await db('users').where({ id }).first();
      if (!user) {
        req.flash('error', 'User tidak ditemukan.');
        return res.redirect('/users');
      }

      const updateData = {
        nama: nama.trim(),
        role: role || user.role,
        status: status || user.status,
        updated_at: db.fn.now()
      };

      if (username && username.trim() !== user.username) {
        const check = await db('users').where({ username: username.trim() }).whereNot({ id }).first();
        if (check) {
          req.flash('error', `Username "${username.trim()}" sudah dipakai.`);
          return res.redirect('/users');
        }
        updateData.username = username.trim();
      }

      if (password && password.trim().length >= 6) {
        updateData.password_hash = await bcrypt.hash(password.trim(), 10);
      }

      await db('users').where({ id }).update(updateData);
      await logAction(req, 'UPDATE_USER', `Mengubah data user #${id}: ${user.username}`);

      req.flash('success', `Data user "${user.username}" berhasil diperbarui.`);
      res.redirect('/users');
    } catch (err) {
      console.error('Error update user:', err);
      req.flash('error', 'Gagal memperbarui user.');
      res.redirect('/users');
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.session?.user?.id;

      if (parseInt(id) === 1) {
        req.flash('error', 'User Administrator utama tidak dapat dihapus.');
        return res.redirect('/users');
      }

      if (parseInt(id) === currentUserId) {
        req.flash('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        return res.redirect('/users');
      }

      const user = await db('users').where({ id }).first();
      await db('users').where({ id }).del();
      await logAction(req, 'DELETE_USER', `Menghapus user #${id} (${user?.username})`);

      req.flash('success', 'User berhasil dihapus.');
      res.redirect('/users');
    } catch (err) {
      console.error('Error delete user:', err);
      req.flash('error', 'Gagal menghapus user.');
      res.redirect('/users');
    }
  },

  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.trim().length < 6) {
        req.flash('error', 'Kata sandi baru minimal 6 karakter.');
        return res.redirect('/users');
      }

      const user = await db('users').where({ id }).first();
      if (!user) {
        req.flash('error', 'User tidak ditemukan.');
        return res.redirect('/users');
      }

      const password_hash = await bcrypt.hash(new_password.trim(), 10);
      await db('users').where({ id }).update({
        password_hash,
        updated_at: db.fn.now()
      });

      await logAction(req, 'RESET_PASSWORD_USER', `Admin mereset kata sandi user #${id} (${user.username})`);
      req.flash('success', `Kata sandi untuk user "${user.username}" berhasil direset.`);
      res.redirect('/users');
    } catch (err) {
      console.error('Error reset password:', err);
      req.flash('error', 'Gagal mereset kata sandi.');
      res.redirect('/users');
    }
  }
};

module.exports = usersController;
