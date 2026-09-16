const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logAction } = require('../middlewares/audit');
const { clearSettingsCache } = require('../middlewares/locals');

async function setSetting(key, value) {
  const existing = await db('settings').where({ key }).first();
  if (existing) {
    await db('settings').where({ key }).update({ value: String(value || ''), updated_at: db.fn.now() });
  } else {
    await db('settings').insert({ key, value: String(value || '') });
  }
}

const pengaturanController = {
  async index(req, res) {
    try {
      const rows = await db('settings').select('key', 'value');
      const settings = {};
      rows.forEach((r) => {
        settings[r.key] = r.value;
      });

      // Normalize keys with defaults
      settings.nama_aplikasi = settings.nama_aplikasi || settings.nama_toko || 'SCORIP POS';
      settings.sub_judul = settings.sub_judul || settings.slogan || 'Sistem POS Kasir & PO Import';
      settings.header_struk = settings.header_struk || settings.struk_header || '';
      settings.footer_struk = settings.footer_struk || settings.struk_footer || '';
      settings.wa_api_url = settings.wa_api_url || settings.wa_gateway_url || '';
      settings.wa_api_key = settings.wa_api_key || '';
      settings.wa_template_pos = settings.wa_template_pos || '';
      settings.wa_template_order = settings.wa_template_order || '';

      // Fetch users with last_login from audit_log
      const users = await db('users').orderBy('id', 'asc');
      for (const u of users) {
        const lastLog = await db('audit_log')
          .where({ username: u.username, action: 'LOGIN' })
          .orderBy('id', 'desc')
          .first();
        u.last_login = lastLog ? lastLog.created_at : null;
      }

      res.render('pages/pengaturan/index', {
        title: 'Pengaturan — SCORIP POS',
        activePage: 'pengaturan',
        activeTab: req.query.tab || 'umum',
        settings,
        users,
        currentUser: req.session?.user || {}
      });
    } catch (err) {
      console.error('Error load settings:', err);
      req.flash('error', 'Gagal memuat pengaturan.');
      res.redirect('/dashboard');
    }
  },

  async updateUmum(req, res) {
    try {
      const { nama_aplikasi, sub_judul } = req.body;
      if (nama_aplikasi) {
        await setSetting('nama_aplikasi', nama_aplikasi.trim());
        await setSetting('nama_toko', nama_aplikasi.trim());
      }
      if (sub_judul) {
        await setSetting('sub_judul', sub_judul.trim());
        await setSetting('slogan', sub_judul.trim());
      }
      if (req.file) {
        await setSetting('logo_url', '/uploads/logo/' + req.file.filename);
      }

      clearSettingsCache();
      await logAction(req, 'UPDATE_SETTINGS_UMUM', 'Update identitas toko/aplikasi');
      req.flash('success', 'Pengaturan umum berhasil disimpan.');
      res.redirect('/pengaturan');
    } catch (err) {
      console.error('Error update pengaturan umum:', err);
      req.flash('error', 'Gagal menyimpan pengaturan umum.');
      res.redirect('/pengaturan');
    }
  },

  async updateStruk(req, res) {
    try {
      const { header_struk, footer_struk } = req.body;
      await setSetting('header_struk', header_struk || '');
      await setSetting('struk_header', header_struk || '');
      await setSetting('footer_struk', footer_struk || '');
      await setSetting('struk_footer', footer_struk || '');

      clearSettingsCache();
      await logAction(req, 'UPDATE_SETTINGS_STRUK', 'Update format header & footer struk kasir');
      req.flash('success', 'Pengaturan struk berhasil disimpan.');
      res.redirect('/pengaturan');
    } catch (err) {
      console.error('Error update pengaturan struk:', err);
      req.flash('error', 'Gagal menyimpan pengaturan struk.');
      res.redirect('/pengaturan');
    }
  },

  async updateWhatsApp(req, res) {
    try {
      const { wa_api_url, wa_api_key, wa_template_pos, wa_template_order } = req.body;
      await setSetting('wa_api_url', wa_api_url || '');
      await setSetting('wa_gateway_url', wa_api_url || '');
      if (wa_api_key && !wa_api_key.includes('***')) {
        await setSetting('wa_api_key', wa_api_key);
      }
      await setSetting('wa_template_pos', wa_template_pos || '');
      await setSetting('wa_template_order', wa_template_order || '');

      clearSettingsCache();
      await logAction(req, 'UPDATE_SETTINGS_WA', 'Update konfigurasi WhatsApp Gateway');
      req.flash('success', 'Pengaturan WhatsApp berhasil disimpan.');
      res.redirect('/pengaturan?tab=whatsapp');
    } catch (err) {
      console.error('Error update pengaturan WA:', err);
      req.flash('error', 'Gagal menyimpan konfigurasi WhatsApp.');
      res.redirect('/pengaturan?tab=whatsapp');
    }
  },

  // ==========================================
  // PENGELOLAAN AKUN USER & AKSES SISTEM
  // ==========================================

  async createUser(req, res) {
    try {
      const { username, nama, password, role, status } = req.body;

      if (!username || !nama || !password) {
        req.flash('error', 'Username, Nama Lengkap, dan Kata Sandi wajib diisi.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      if (password.length < 6) {
        req.flash('error', 'Kata sandi minimal 6 karakter.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const existing = await db('users').where({ username: username.trim() }).first();
      if (existing) {
        req.flash('error', `Username "${username.trim()}" sudah digunakan.`);
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const password_hash = await bcrypt.hash(password.trim(), 10);

      await db('users').insert({
        username: username.trim(),
        nama: nama.trim(),
        password_hash,
        role: role || 'Staff',
        status: status || 'aktif',
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });

      await logAction(req, 'CREATE_USER', `Membuat akun user: ${username.trim()} (${role || 'Staff'})`);
      req.flash('success', `Akun pengguna "${username.trim()}" berhasil dibuat.`);
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error create user:', err);
      req.flash('error', 'Gagal membuat akun pengguna baru.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, nama, role, status } = req.body;

      const user = await db('users').where({ id }).first();
      if (!user) {
        req.flash('error', 'Pengguna tidak ditemukan.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const updateData = {
        nama: nama ? nama.trim() : user.nama,
        role: role || user.role,
        status: status || user.status,
        updated_at: db.fn.now()
      };

      // Cegah user admin utama ID 1 dinonaktifkan atau diubah rolenya
      if (parseInt(id) === 1) {
        updateData.role = 'Admin';
        updateData.status = 'aktif';
      }

      if (username && username.trim() !== user.username) {
        const check = await db('users').where({ username: username.trim() }).whereNot({ id }).first();
        if (check) {
          req.flash('error', `Username "${username.trim()}" sudah digunakan pengguna lain.`);
          return res.redirect('/pengaturan?tab=pengguna');
        }
        updateData.username = username.trim();
      }

      await db('users').where({ id }).update(updateData);
      await logAction(req, 'UPDATE_USER', `Memperbarui akun user #${id}: ${user.username}`);

      req.flash('success', `Data pengguna "${user.username}" berhasil diperbarui.`);
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error update user:', err);
      req.flash('error', 'Gagal memperbarui data pengguna.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  },

  async resetPasswordUser(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.trim().length < 6) {
        req.flash('error', 'Kata sandi baru minimal 6 karakter.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const user = await db('users').where({ id }).first();
      if (!user) {
        req.flash('error', 'Pengguna tidak ditemukan.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const password_hash = await bcrypt.hash(new_password.trim(), 10);
      await db('users').where({ id }).update({
        password_hash,
        updated_at: db.fn.now()
      });

      await logAction(req, 'RESET_PASSWORD_USER', `Admin mereset kata sandi untuk akun user #${id} (${user.username})`);
      req.flash('success', `Kata sandi untuk pengguna "${user.username}" berhasil direset.`);
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error reset password user:', err);
      req.flash('error', 'Gagal mereset kata sandi pengguna.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  },

  async gantiPasswordMandiri(req, res) {
    try {
      const currentUserId = req.session?.user?.id;
      if (!currentUserId) {
        req.flash('error', 'Sesi tidak valid, silakan login kembali.');
        return res.redirect('/login');
      }

      const { password_lama, password_baru, konfirmasi_password } = req.body;

      if (!password_lama || !password_baru || !konfirmasi_password) {
        req.flash('error', 'Semua kolom kata sandi wajib diisi.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      if (password_baru.length < 6) {
        req.flash('error', 'Kata sandi baru minimal 6 karakter.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      if (password_baru !== konfirmasi_password) {
        req.flash('error', 'Konfirmasi kata sandi baru tidak cocok.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const user = await db('users').where({ id: currentUserId }).first();
      if (!user) {
        req.flash('error', 'Akun pengguna tidak ditemukan.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const validOld = await bcrypt.compare(password_lama, user.password_hash);
      if (!validOld) {
        req.flash('error', 'Kata sandi saat ini yang Anda masukkan salah.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const password_hash = await bcrypt.hash(password_baru.trim(), 10);
      await db('users').where({ id: currentUserId }).update({
        password_hash,
        updated_at: db.fn.now()
      });

      await logAction(req, 'CHANGE_OWN_PASSWORD', `Pengguna ${user.username} mengubah kata sandi sendiri`);
      req.flash('success', 'Kata sandi akun Anda berhasil diperbarui!');
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error change own password:', err);
      req.flash('error', 'Gagal mengubah kata sandi.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.session?.user?.id;

      if (parseInt(id) === 1) {
        req.flash('error', 'User Administrator utama sistem tidak dapat dihapus.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      if (parseInt(id) === currentUserId) {
        req.flash('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      const user = await db('users').where({ id }).first();
      if (!user) {
        req.flash('error', 'Pengguna tidak ditemukan.');
        return res.redirect('/pengaturan?tab=pengguna');
      }

      await db('users').where({ id }).del();
      await logAction(req, 'DELETE_USER', `Menghapus akun user #${id} (${user.username})`);

      req.flash('success', `Pengguna "${user.username}" berhasil dihapus dari sistem.`);
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error delete user:', err);
      req.flash('error', 'Gagal menghapus pengguna.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  },

  async updateHakAkses(req, res) {
    try {
      let permissions = req.body.permissions || [];
      if (!Array.isArray(permissions)) {
        permissions = [permissions];
      }

      await setSetting('staff_permissions', JSON.stringify(permissions));
      clearSettingsCache();
      await logAction(req, 'UPDATE_STAFF_PERMISSIONS', `Admin memperbarui hak akses pengguna non-admin (Staff): ${permissions.join(', ') || 'tidak ada'}`);

      req.flash('success', 'Hak akses untuk pengguna non-admin (Staff) berhasil diperbarui!');
      res.redirect('/pengaturan?tab=pengguna');
    } catch (err) {
      console.error('Error update hak akses:', err);
      req.flash('error', 'Gagal memperbarui hak akses.');
      res.redirect('/pengaturan?tab=pengguna');
    }
  }
};

module.exports = pengaturanController;
