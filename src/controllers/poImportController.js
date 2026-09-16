const db = require('../config/database');
const poService = require('../services/poService');
const { logAction } = require('../middlewares/audit');

const poImportController = {
  // List PO
  async index(req, res) {
    try {
      const poRows = await db('po_import')
        .leftJoin('supplier', 'po_import.supplier_id', 'supplier.id')
        .leftJoin('forwarder', 'po_import.forwarder_id', 'forwarder.id')
        .select(
          'po_import.*',
          'supplier.nama as supplier',
          'forwarder.nama as forwarder'
        )
        .orderBy('po_import.id', 'desc');

      res.render('pages/po-import/index', {
        title: 'PO Import — SCORIP POS',
        activePage: 'po-import',
        poList: poRows
      });
    } catch (err) {
      console.error('Error loading PO list:', err);
      req.flash('error', 'Gagal memuat daftar PO.');
      res.redirect('/dashboard');
    }
  },

  // Form Tambah PO
  async formTambah(req, res) {
    try {
      const supplier = await db('supplier').orderBy('nama', 'asc');
      const forwarder = await db('forwarder').orderBy('nama', 'asc');
      const produk = await db('produk').where('status', 'aktif').orderBy('nama', 'asc');

      // Default nomor PO
      const count = await db('po_import').count('id as count').first();
      const nextNum = (count ? count.count : 0) + 1;
      const year = new Date().getFullYear();
      const defaultNoPO = `PO-${year}-${String(nextNum).padStart(3, '0')}`;

      res.render('pages/po-import/form', {
        title: 'Buat PO Import — SCORIP POS',
        activePage: 'po-import',
        isEdit: false,
        po: { no_po: defaultNoPO, tanggal: new Date().toISOString().split('T')[0], kurs_rmb: 2250, biaya_forwarder: 0, ongkir_lokal: 0, base_type: 'kurs' },
        supplier,
        forwarder,
        produk
      });
    } catch (err) {
      console.error('Error form tambah PO:', err);
      req.flash('error', 'Gagal memuat formulir PO.');
      res.redirect('/po-import');
    }
  },

  // Simpan PO Baru (POST)
  async create(req, res) {
    try {
      const {
        no_po,
        tanggal,
        supplier_id,
        forwarder_id,
        kurs_rmb,
        biaya_forwarder,
        ongkir_lokal,
        base_type,
        nominal_tf,
        catatan,
        item_produk_id,
        item_qty,
        item_harga_rmb,
        item_koli
      } = req.body;

      // Susun item PO
      const items = [];
      const prodIds = Array.isArray(item_produk_id) ? item_produk_id : (item_produk_id ? [item_produk_id] : []);
      const qtys = Array.isArray(item_qty) ? item_qty : [item_qty];
      const hargas = Array.isArray(item_harga_rmb) ? item_harga_rmb : [item_harga_rmb];
      const kolis = Array.isArray(item_koli) ? item_koli : [item_koli];

      for (let i = 0; i < prodIds.length; i++) {
        if (prodIds[i]) {
          items.push({
            produk_id: parseInt(prodIds[i]),
            qty: parseInt(qtys[i]) || 1,
            harga_rmb: parseFloat(hargas[i]) || 0,
            jumlah_koli: parseInt(kolis[i]) || 1
          });
        }
      }

      if (items.length === 0) {
        req.flash('error', 'PO harus memiliki minimal 1 item produk.');
        return res.redirect('/po-import/baru');
      }

      // Hitung totals
      const totals = poService.calculateTotals(
        items,
        kurs_rmb,
        biaya_forwarder,
        ongkir_lokal,
        base_type,
        nominal_tf
      );

      await db.transaction(async (trx) => {
        const [poId] = await trx('po_import').insert({
          no_po,
          tanggal,
          supplier_id: parseInt(supplier_id),
          forwarder_id: forwarder_id ? parseInt(forwarder_id) : null,
          kurs_rmb: parseFloat(kurs_rmb) || 0,
          biaya_forwarder: parseInt(biaya_forwarder) || 0,
          ongkir_lokal: parseInt(ongkir_lokal) || 0,
          base_type: base_type || 'kurs',
          nominal_tf: parseInt(nominal_tf) || 0,
          total_rmb: totals.total_rmb,
          total_idr: totals.total_idr,
          landed_cost: totals.landed_cost,
          status: 'Draft',
          catatan: catatan || null
        });

        // Insert items
        for (const it of items) {
          await trx('po_detail').insert({
            po_id: poId,
            produk_id: it.produk_id,
            qty: it.qty,
            harga_rmb: it.harga_rmb,
            jumlah_koli: it.jumlah_koli,
            subtotal_rmb: it.subtotal_rmb
          });
        }

        // Status awal di history
        await trx('po_status_history').insert({
          po_id: poId,
          status: 'Draft',
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 19),
          catatan: 'PO baru dibuat',
          created_by: req.session?.user?.nama || 'Administrator'
        });
      });

      await logAction(req, 'CREATE_PO', `Membuat PO baru #${no_po} senilai Landed Cost Rp ${totals.landed_cost}`);
      req.flash('success', `PO ${no_po} berhasil dibuat!`);
      res.redirect('/po-import');
    } catch (err) {
      console.error('Error create PO:', err);
      req.flash('error', err.message || 'Gagal menyimpan PO baru.');
      res.redirect('/po-import/baru');
    }
  },

  // Detail PO
  async detail(req, res) {
    try {
      const { id } = req.params;
      const po = await db('po_import')
        .leftJoin('supplier', 'po_import.supplier_id', 'supplier.id')
        .leftJoin('forwarder', 'po_import.forwarder_id', 'forwarder.id')
        .select(
          'po_import.*',
          'supplier.nama as supplier',
          'forwarder.nama as forwarder'
        )
        .where('po_import.id', id)
        .first();

      if (!po) {
        req.flash('error', 'Data PO tidak ditemukan.');
        return res.redirect('/po-import');
      }

      const items = await db('po_detail')
        .join('produk', 'po_detail.produk_id', 'produk.id')
        .select('po_detail.*', 'produk.nama as nama_produk', 'produk.sku')
        .where('po_detail.po_id', id);

      const history = await db('po_status_history')
        .where('po_id', id)
        .orderBy('id', 'asc');

      const forwarders = await db('forwarder').orderBy('nama', 'asc');

      res.render('pages/po-import/detail', {
        title: `Detail PO ${po.no_po} — SCORIP POS`,
        activePage: 'po-import',
        po,
        items,
        detail: items,
        poDetail: items,
        history,
        statusHistory: history,
        forwarders
      });
    } catch (err) {
      console.error('Error detail PO:', err);
      req.flash('error', 'Gagal memuat detail PO.');
      res.redirect('/po-import');
    }
  },

  // Form Edit PO
  async formEdit(req, res) {
    try {
      const { id } = req.params;
      const po = await db('po_import').where({ id }).first();
      if (!po) {
        req.flash('error', 'PO tidak ditemukan.');
        return res.redirect('/po-import');
      }

      const supplier = await db('supplier').orderBy('nama', 'asc');
      const forwarder = await db('forwarder').orderBy('nama', 'asc');
      const produk = await db('produk').where('status', 'aktif').orderBy('nama', 'asc');
      const poDetail = await db('po_detail').where({ po_id: id });

      poDetail.forEach(it => {
        it.total_rmb = it.subtotal_rmb;
      });

      res.render('pages/po-import/form', {
        title: `Edit PO ${po.no_po} — SCORIP POS`,
        activePage: 'po-import',
        isEdit: true,
        po,
        supplier,
        forwarder,
        produk,
        poDetail
      });
    } catch (err) {
      console.error('Error form edit PO:', err);
      req.flash('error', 'Gagal membuka form edit PO.');
      res.redirect('/po-import');
    }
  },

  // Update PO (PUT / POST)
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        no_po,
        tanggal,
        supplier_id,
        forwarder_id,
        kurs_rmb,
        biaya_forwarder,
        ongkir_lokal,
        base_type,
        nominal_tf,
        catatan,
        item_produk_id,
        item_qty,
        item_harga_rmb,
        item_koli
      } = req.body;

      const items = [];
      const prodIds = Array.isArray(item_produk_id) ? item_produk_id : (item_produk_id ? [item_produk_id] : []);
      const qtys = Array.isArray(item_qty) ? item_qty : [item_qty];
      const hargas = Array.isArray(item_harga_rmb) ? item_harga_rmb : [item_harga_rmb];
      const kolis = Array.isArray(item_koli) ? item_koli : [item_koli];

      for (let i = 0; i < prodIds.length; i++) {
        if (prodIds[i]) {
          items.push({
            produk_id: parseInt(prodIds[i]),
            qty: parseInt(qtys[i]) || 1,
            harga_rmb: parseFloat(hargas[i]) || 0,
            jumlah_koli: parseInt(kolis[i]) || 1
          });
        }
      }

      const totals = poService.calculateTotals(
        items,
        kurs_rmb,
        biaya_forwarder,
        ongkir_lokal,
        base_type,
        nominal_tf
      );

      await db.transaction(async (trx) => {
        await trx('po_import').where({ id }).update({
          no_po,
          tanggal,
          supplier_id: parseInt(supplier_id),
          forwarder_id: forwarder_id ? parseInt(forwarder_id) : null,
          kurs_rmb: parseFloat(kurs_rmb) || 0,
          biaya_forwarder: parseInt(biaya_forwarder) || 0,
          ongkir_lokal: parseInt(ongkir_lokal) || 0,
          base_type: base_type || 'kurs',
          nominal_tf: parseInt(nominal_tf) || 0,
          total_rmb: totals.total_rmb,
          total_idr: totals.total_idr,
          landed_cost: totals.landed_cost,
          catatan: catatan || null,
          updated_at: db.fn.now()
        });

        // Replace detail items
        await trx('po_detail').where({ po_id: id }).del();
        for (const it of items) {
          await trx('po_detail').insert({
            po_id: id,
            produk_id: it.produk_id,
            qty: it.qty,
            harga_rmb: it.harga_rmb,
            jumlah_koli: it.jumlah_koli,
            subtotal_rmb: it.subtotal_rmb
          });
        }
      });

      await logAction(req, 'UPDATE_PO', `Memperbarui data PO #${no_po}`);
      req.flash('success', 'Data PO berhasil diperbarui.');
      res.redirect(`/po-import/${id}`);
    } catch (err) {
      console.error('Error update PO:', err);
      req.flash('error', 'Gagal memperbarui PO.');
      res.redirect(`/po-import/${req.params.id}/edit`);
    }
  },

  // Update Status PO
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, tanggal, nomor_resi, estimasi_tiba, catatan } = req.body;

      if (status === 'Diterima') {
        // Jika status diubah menjadi Diterima, tambahkan stok otomatis
        await poService.receivePO(id, req.session?.user);
      } else {
        await db('po_import').where({ id }).update({
          status,
          updated_at: db.fn.now()
        });

        const nowStr = tanggal || new Date().toISOString().replace('T', ' ').substring(0, 19);
        await db('po_status_history').insert({
          po_id: id,
          status,
          tanggal: nowStr,
          nomor_resi: nomor_resi || null,
          estimasi_tiba: estimasi_tiba || null,
          catatan: catatan || null,
          created_by: req.session?.user?.nama || 'Administrator'
        });
      }

      await logAction(req, 'UPDATE_STATUS_PO', `Ubah status PO #${id} menjadi ${status}`);
      req.flash('success', `Status PO berhasil diubah menjadi "${status}".`);
      res.redirect(`/po-import/${id}`);
    } catch (err) {
      console.error('Error update status PO:', err);
      req.flash('error', err.message || 'Gagal mengubah status PO.');
      res.redirect(`/po-import/${req.params.id}`);
    }
  },

  // Hapus PO
  async delete(req, res) {
    try {
      const { id } = req.params;
      const po = await db('po_import').where({ id }).first();

      if (!po) {
        req.flash('error', 'PO tidak ditemukan.');
        return res.redirect('/po-import');
      }

      if (po.status === 'Diterima') {
        req.flash('error', 'PO yang sudah berstatus Diterima tidak dapat dihapus demi integritas data stok.');
        return res.redirect('/po-import');
      }

      await db('po_import').where({ id }).del();
      await logAction(req, 'DELETE_PO', `Menghapus PO #${po.no_po}`);

      req.flash('success', `PO ${po.no_po} berhasil dihapus.`);
      res.redirect('/po-import');
    } catch (err) {
      console.error('Error delete PO:', err);
      req.flash('error', 'Gagal menghapus PO.');
      res.redirect('/po-import');
    }
  }
};

module.exports = poImportController;
