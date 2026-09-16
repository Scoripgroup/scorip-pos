const db = require('../config/database');
const { logAction } = require('../middlewares/audit');

const masterController = {
  // ==========================================
  // SUPPLIER (Admin Only)
  // ==========================================
  async listSupplier(req, res) {
    try {
      const supplier = await db('supplier').orderBy('nama', 'asc');
      res.render('pages/supplier/index', {
        title: 'Master Supplier — SCORIP POS',
        activePage: 'supplier',
        supplier
      });
    } catch (err) {
      console.error('Error list supplier:', err);
      req.flash('error', 'Gagal memuat supplier.');
      res.redirect('/dashboard');
    }
  },

  async createSupplier(req, res) {
    try {
      const { nama, kontak, email, alamat } = req.body;
      await db('supplier').insert({
        nama: nama.trim(),
        kontak: kontak ? kontak.trim() : null,
        email: email ? email.trim() : null,
        alamat: alamat ? alamat.trim() : null
      });
      await logAction(req, 'CREATE_SUPPLIER', `Tambah supplier: ${nama.trim()}`);
      req.flash('success', `Supplier "${nama.trim()}" berhasil ditambahkan.`);
      res.redirect('/supplier');
    } catch (err) {
      console.error('Error create supplier:', err);
      req.flash('error', 'Gagal menambahkan supplier.');
      res.redirect('/supplier');
    }
  },

  async updateSupplier(req, res) {
    try {
      const { id } = req.params;
      const { nama, kontak, email, alamat } = req.body;
      await db('supplier').where({ id }).update({
        nama: nama.trim(),
        kontak: kontak ? kontak.trim() : null,
        email: email ? email.trim() : null,
        alamat: alamat ? alamat.trim() : null,
        updated_at: db.fn.now()
      });
      await logAction(req, 'UPDATE_SUPPLIER', `Update supplier #${id}: ${nama.trim()}`);
      req.flash('success', 'Data supplier berhasil diperbarui.');
      res.redirect('/supplier');
    } catch (err) {
      console.error('Error update supplier:', err);
      req.flash('error', 'Gagal memperbarui supplier.');
      res.redirect('/supplier');
    }
  },

  async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      const poCheck = await db('po_import').where({ supplier_id: id }).count('id as count').first();
      if (poCheck && poCheck.count > 0) {
        req.flash('error', 'Supplier tidak dapat dihapus karena memiliki riwayat PO Import.');
        return res.redirect('/supplier');
      }

      await db('supplier').where({ id }).del();
      await logAction(req, 'DELETE_SUPPLIER', `Hapus supplier #${id}`);
      req.flash('success', 'Supplier berhasil dihapus.');
      res.redirect('/supplier');
    } catch (err) {
      console.error('Error delete supplier:', err);
      req.flash('error', 'Gagal menghapus supplier.');
      res.redirect('/supplier');
    }
  },

  // ==========================================
  // FORWARDER (Admin Only)
  // ==========================================
  async listForwarder(req, res) {
    try {
      const forwarder = await db('forwarder').orderBy('nama', 'asc');
      res.render('pages/forwarder/index', {
        title: 'Master Forwarder — SCORIP POS',
        activePage: 'forwarder',
        forwarder
      });
    } catch (err) {
      console.error('Error list forwarder:', err);
      req.flash('error', 'Gagal memuat forwarder.');
      res.redirect('/dashboard');
    }
  },

  async createForwarder(req, res) {
    try {
      const { nama, kontak, alamat } = req.body;
      await db('forwarder').insert({
        nama: nama.trim(),
        kontak: kontak ? kontak.trim() : null,
        alamat: alamat ? alamat.trim() : null
      });
      await logAction(req, 'CREATE_FORWARDER', `Tambah forwarder: ${nama.trim()}`);
      req.flash('success', `Forwarder "${nama.trim()}" berhasil ditambahkan.`);
      res.redirect('/forwarder');
    } catch (err) {
      console.error('Error create forwarder:', err);
      req.flash('error', 'Gagal menambahkan forwarder.');
      res.redirect('/forwarder');
    }
  },

  async updateForwarder(req, res) {
    try {
      const { id } = req.params;
      const { nama, kontak, alamat } = req.body;
      await db('forwarder').where({ id }).update({
        nama: nama.trim(),
        kontak: kontak ? kontak.trim() : null,
        alamat: alamat ? alamat.trim() : null,
        updated_at: db.fn.now()
      });
      await logAction(req, 'UPDATE_FORWARDER', `Update forwarder #${id}: ${nama.trim()}`);
      req.flash('success', 'Data forwarder berhasil diperbarui.');
      res.redirect('/forwarder');
    } catch (err) {
      console.error('Error update forwarder:', err);
      req.flash('error', 'Gagal memperbarui forwarder.');
      res.redirect('/forwarder');
    }
  },

  async deleteForwarder(req, res) {
    try {
      const { id } = req.params;
      await db('forwarder').where({ id }).del();
      await logAction(req, 'DELETE_FORWARDER', `Hapus forwarder #${id}`);
      req.flash('success', 'Forwarder berhasil dihapus.');
      res.redirect('/forwarder');
    } catch (err) {
      console.error('Error delete forwarder:', err);
      req.flash('error', 'Gagal menghapus forwarder.');
      res.redirect('/forwarder');
    }
  },

  // ==========================================
  // PELANGGAN (Admin & Staff)
  // ==========================================
  async listPelanggan(req, res) {
    try {
      const pelanggan = await db('pelanggan')
        .leftJoin('transaksi', 'pelanggan.id', 'transaksi.pelanggan_id')
        .select(
          'pelanggan.*',
          db.raw('COUNT(transaksi.id) as total_transaksi')
        )
        .groupBy('pelanggan.id')
        .orderBy('pelanggan.id', 'asc');

      res.render('pages/pelanggan/index', {
        title: 'Master Pelanggan — SCORIP POS',
        activePage: 'pelanggan',
        pelanggan
      });
    } catch (err) {
      console.error('Error list pelanggan:', err);
      req.flash('error', 'Gagal memuat pelanggan.');
      res.redirect('/dashboard');
    }
  },

  async createPelanggan(req, res) {
    try {
      const { nama, no_hp, alamat } = req.body;
      await db('pelanggan').insert({
        nama: nama.trim(),
        no_hp: no_hp ? no_hp.trim() : null,
        alamat: alamat ? alamat.trim() : null
      });
      await logAction(req, 'CREATE_PELANGGAN', `Tambah pelanggan: ${nama.trim()}`);
      req.flash('success', `Pelanggan "${nama.trim()}" berhasil ditambahkan.`);
      res.redirect('/pelanggan');
    } catch (err) {
      console.error('Error create pelanggan:', err);
      req.flash('error', 'Gagal menambahkan pelanggan.');
      res.redirect('/pelanggan');
    }
  },

  async updatePelanggan(req, res) {
    try {
      const { id } = req.params;
      const { nama, no_hp, alamat } = req.body;
      await db('pelanggan').where({ id }).update({
        nama: nama.trim(),
        no_hp: no_hp ? no_hp.trim() : null,
        alamat: alamat ? alamat.trim() : null,
        updated_at: db.fn.now()
      });
      await logAction(req, 'UPDATE_PELANGGAN', `Update pelanggan #${id}: ${nama.trim()}`);
      req.flash('success', 'Data pelanggan berhasil diperbarui.');
      res.redirect('/pelanggan');
    } catch (err) {
      console.error('Error update pelanggan:', err);
      req.flash('error', 'Gagal memperbarui pelanggan.');
      res.redirect('/pelanggan');
    }
  },

  async deletePelanggan(req, res) {
    try {
      const { id } = req.params;
      if (parseInt(id) === 1) {
        req.flash('error', 'Pelanggan Umum adalah default sistem dan tidak dapat dihapus.');
        return res.redirect('/pelanggan');
      }

      await db('pelanggan').where({ id }).del();
      await logAction(req, 'DELETE_PELANGGAN', `Hapus pelanggan #${id}`);
      req.flash('success', 'Pelanggan berhasil dihapus.');
      res.redirect('/pelanggan');
    } catch (err) {
      console.error('Error delete pelanggan:', err);
      req.flash('error', 'Gagal menghapus pelanggan.');
      res.redirect('/pelanggan');
    }
  }
};

module.exports = masterController;
