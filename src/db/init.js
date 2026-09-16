const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log('🔄 Memeriksa & menginisialisasi skema database...');

  // 1. Users
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('nama').notNullable();
      table.string('role').defaultTo('Staff'); // 'Admin' | 'Staff'
      table.string('status').defaultTo('aktif'); // 'aktif' | 'nonaktif'
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel users dibuat');
  }

  // 2. Kategori
  if (!(await db.schema.hasTable('kategori'))) {
    await db.schema.createTable('kategori', (table) => {
      table.increments('id').primary();
      table.string('nama').notNullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel kategori dibuat');
  }

  // 3. Produk
  if (!(await db.schema.hasTable('produk'))) {
    await db.schema.createTable('produk', (table) => {
      table.increments('id').primary();
      table.string('sku').unique().notNullable();
      table.string('nama').notNullable();
      table.integer('kategori_id').unsigned().references('id').inTable('kategori').onDelete('SET NULL');
      table.string('foto').nullable();
      table.string('satuan').defaultTo('pcs');
      table.integer('harga_beli').defaultTo(0);
      table.integer('harga_jual').defaultTo(0);
      table.integer('stok').defaultTo(0);
      table.integer('stok_minimum').defaultTo(5);
      table.string('status').defaultTo('aktif'); // 'aktif' | 'nonaktif'
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel produk dibuat');
  }

  // 4. Pelanggan
  if (!(await db.schema.hasTable('pelanggan'))) {
    await db.schema.createTable('pelanggan', (table) => {
      table.increments('id').primary();
      table.string('nama').notNullable();
      table.string('no_hp').nullable();
      table.text('alamat').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel pelanggan dibuat');
  }

  // 5. Supplier
  if (!(await db.schema.hasTable('supplier'))) {
    await db.schema.createTable('supplier', (table) => {
      table.increments('id').primary();
      table.string('nama').notNullable();
      table.string('kontak').nullable();
      table.text('alamat').nullable();
      table.string('email').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel supplier dibuat');
  }

  // 6. Forwarder
  if (!(await db.schema.hasTable('forwarder'))) {
    await db.schema.createTable('forwarder', (table) => {
      table.increments('id').primary();
      table.string('nama').notNullable();
      table.string('kontak').nullable();
      table.text('alamat').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel forwarder dibuat');
  }

  // 7. PO Import
  if (!(await db.schema.hasTable('po_import'))) {
    await db.schema.createTable('po_import', (table) => {
      table.increments('id').primary();
      table.string('no_po').unique().notNullable();
      table.string('tanggal').notNullable();
      table.integer('supplier_id').unsigned().references('id').inTable('supplier').onDelete('RESTRICT');
      table.integer('forwarder_id').unsigned().nullable().references('id').inTable('forwarder').onDelete('SET NULL');
      table.float('kurs_rmb').defaultTo(0);
      table.integer('biaya_forwarder').defaultTo(0);
      table.integer('ongkir_lokal').defaultTo(0);
      table.string('base_type').defaultTo('kurs'); // 'kurs' | 'nominal_tf'
      table.integer('nominal_tf').defaultTo(0);
      table.float('total_rmb').defaultTo(0);
      table.integer('total_idr').defaultTo(0);
      table.integer('landed_cost').defaultTo(0);
      table.string('status').defaultTo('Draft'); // Draft, Dipesan, Dalam Perjalanan, Tiba di Forwarder, Diterima, Dibatalkan
      table.text('catatan').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel po_import dibuat');
  }

  // 8. PO Detail
  if (!(await db.schema.hasTable('po_detail'))) {
    await db.schema.createTable('po_detail', (table) => {
      table.increments('id').primary();
      table.integer('po_id').unsigned().notNullable().references('id').inTable('po_import').onDelete('CASCADE');
      table.integer('produk_id').unsigned().notNullable().references('id').inTable('produk').onDelete('RESTRICT');
      table.integer('qty').defaultTo(1);
      table.float('harga_rmb').defaultTo(0);
      table.integer('jumlah_koli').defaultTo(1);
      table.float('subtotal_rmb').defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel po_detail dibuat');
  }

  // 9. PO Status History
  if (!(await db.schema.hasTable('po_status_history'))) {
    await db.schema.createTable('po_status_history', (table) => {
      table.increments('id').primary();
      table.integer('po_id').unsigned().notNullable().references('id').inTable('po_import').onDelete('CASCADE');
      table.string('status').notNullable();
      table.string('tanggal').notNullable();
      table.string('nomor_resi').nullable();
      table.string('estimasi_tiba').nullable();
      table.text('catatan').nullable();
      table.string('created_by').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel po_status_history dibuat');
  }

  // 10. Transaksi
  if (!(await db.schema.hasTable('transaksi'))) {
    await db.schema.createTable('transaksi', (table) => {
      table.increments('id').primary();
      table.string('no_transaksi').unique().notNullable();
      table.string('tanggal').notNullable();
      table.integer('pelanggan_id').unsigned().nullable().references('id').inTable('pelanggan').onDelete('SET NULL');
      table.integer('kasir_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('kasir_nama').nullable();
      table.integer('subtotal').defaultTo(0);
      table.integer('diskon').defaultTo(0);
      table.integer('total').defaultTo(0);
      table.string('metode_bayar').defaultTo('Cash'); // Cash, Transfer, QRIS
      table.integer('bayar').defaultTo(0);
      table.integer('kembalian').defaultTo(0);
      table.string('status').defaultTo('selesai'); // selesai, diproses, batal
      table.string('resi').nullable();
      table.text('catatan').nullable();
      table.timestamps(true, true);
    });
    console.log('  ✅ Tabel transaksi dibuat');
  }

  // 11. Transaksi Detail
  if (!(await db.schema.hasTable('transaksi_detail'))) {
    await db.schema.createTable('transaksi_detail', (table) => {
      table.increments('id').primary();
      table.integer('transaksi_id').unsigned().notNullable().references('id').inTable('transaksi').onDelete('CASCADE');
      table.integer('produk_id').unsigned().notNullable().references('id').inTable('produk').onDelete('RESTRICT');
      table.string('nama_produk').notNullable();
      table.integer('qty').defaultTo(1);
      table.integer('harga').defaultTo(0);
      table.integer('harga_beli').defaultTo(0);
      table.integer('diskon').defaultTo(0);
      table.integer('subtotal').defaultTo(0);
      table.integer('laba_kotor').defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel transaksi_detail dibuat');
  }

  // 12. Stok Opname
  if (!(await db.schema.hasTable('stok_opname'))) {
    await db.schema.createTable('stok_opname', (table) => {
      table.increments('id').primary();
      table.string('tanggal').notNullable();
      table.integer('produk_id').unsigned().notNullable().references('id').inTable('produk').onDelete('RESTRICT');
      table.integer('stok_sistem').defaultTo(0);
      table.integer('stok_fisik').defaultTo(0);
      table.integer('selisih').defaultTo(0);
      table.text('keterangan').nullable();
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('user_nama').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel stok_opname dibuat');
  }

  // 13. Audit Log
  if (!(await db.schema.hasTable('audit_log'))) {
    await db.schema.createTable('audit_log', (table) => {
      table.increments('id').primary();
      table.string('username').nullable();
      table.string('action').notNullable();
      table.text('details').nullable();
      table.string('ip_address').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel audit_log dibuat');
  }

  // 14. Settings
  if (!(await db.schema.hasTable('settings'))) {
    await db.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.string('key').unique().notNullable();
      table.text('value').nullable();
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ Tabel settings dibuat');
  }

  // ============================================================
  // SEED INITIAL DATA IF EMPTY
  // ============================================================
  const userCount = await db('users').count('id as count').first();
  if (userCount && userCount.count === 0) {
    console.log('🌱 Menjalankan Seeder Data Awal...');

    // 1. Users
    const adminHash = await bcrypt.hash('admin123', 10);
    const kasirHash = await bcrypt.hash('kasir123', 10);
    await db('users').insert([
      { username: 'admin', password_hash: adminHash, nama: 'Administrator Toko', role: 'Admin', status: 'aktif' },
      { username: 'kasir1', password_hash: kasirHash, nama: 'Budi Kasir', role: 'Staff', status: 'aktif' },
      { username: 'kasir2', password_hash: kasirHash, nama: 'Siti Kasir', role: 'Staff', status: 'aktif' },
    ]);

    // 2. Settings
    await db('settings').insert([
      { key: 'nama_toko', value: 'SCORIP STORE' },
      { key: 'slogan', value: 'Sistem POS Kasir & PO Import Barang' },
      { key: 'alamat_toko', value: 'Jl. Mangga Dua Raya No. 88, Jakarta Pusat' },
      { key: 'telepon_toko', value: '0812-3456-7890' },
      { key: 'logo_url', value: '' },
      { key: 'struk_header', value: 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan' },
      { key: 'struk_footer', value: 'Simpan struk ini sebagai bukti pembayaran yang sah\nFollow IG: @scorip.store' },
      { key: 'wa_gateway_url', value: '' },
      { key: 'wa_api_key', value: '' },
      { key: 'wa_template_pos', value: 'Halo {nama_pelanggan}, terima kasih telah berbelanja di {nama_toko}. Total transaksi: Rp {total}. No. Transaksi: {no_transaksi}' },
      { key: 'wa_template_order', value: 'Halo, saya ingin memesan barang:\n{daftar_barang}\nTotal: Rp {total}' }
    ]);

    // 3. Kategori
    const katIds = await db('kategori').insert([
      { nama: 'Elektronik' },
      { nama: 'Fashion' },
      { nama: 'Aksesoris' },
      { nama: 'Gadget' },
      { nama: 'Peralatan Rumah' }
    ]).returning('id');

    // 4. Pelanggan
    await db('pelanggan').insert([
      { nama: 'Pelanggan Umum', no_hp: '-', alamat: '-' },
      { nama: 'Andi Wijaya', no_hp: '081234567890', alamat: 'Jl. Merdeka No. 10, Jakarta' },
      { nama: 'Siti Nurhaliza', no_hp: '082345678901', alamat: 'Jl. Sudirman No. 5, Bandung' },
      { nama: 'Toko Barokah', no_hp: '083456789012', alamat: 'Jl. Ahmad Yani No. 22, Surabaya' }
    ]);

    // 5. Supplier
    await db('supplier').insert([
      { nama: 'Guangzhou Electronics Co.', kontak: '+86 135 8888 9999', alamat: 'Guangzhou, China', email: 'sales@gzelectronics.cn' },
      { nama: 'Shenzhen Gadget Ltd.', kontak: '+86 136 7777 8888', alamat: 'Shenzhen, China', email: 'order@szgadget.cn' },
      { nama: 'Yiwu Fashion Trading', kontak: '+86 137 6666 7777', alamat: 'Yiwu, China', email: 'info@yiwufashion.cn' }
    ]);

    // 6. Forwarder
    await db('forwarder').insert([
      { nama: 'PT. Cargo Express Indo', kontak: '021-5555-6666', alamat: 'Jakarta Utara' },
      { nama: 'China-Indo Logistics', kontak: '021-7777-8888', alamat: 'Jakarta Barat' }
    ]);

    // 7. Produk
    await db('produk').insert([
      { sku: 'ELK-001', nama: 'Earphone Bluetooth TWS', kategori_id: 1, foto: null, satuan: 'pcs', harga_beli: 45000, harga_jual: 89000, stok: 150, stok_minimum: 20, status: 'aktif' },
      { sku: 'FSH-001', nama: 'Kaos Polos Premium Cotton', kategori_id: 2, foto: null, satuan: 'pcs', harga_beli: 35000, harga_jual: 75000, stok: 5, stok_minimum: 10, status: 'aktif' },
      { sku: 'AKS-001', nama: 'Casing iPhone 15 Clear', kategori_id: 3, foto: null, satuan: 'pcs', harga_beli: 15000, harga_jual: 45000, stok: 200, stok_minimum: 30, status: 'aktif' },
      { sku: 'GDG-001', nama: 'Smartwatch Sport Band', kategori_id: 4, foto: null, satuan: 'pcs', harga_beli: 120000, harga_jual: 250000, stok: 3, stok_minimum: 5, status: 'aktif' },
      { sku: 'ELK-002', nama: 'Charger Fast Charging 33W', kategori_id: 1, foto: null, satuan: 'pcs', harga_beli: 25000, harga_jual: 55000, stok: 80, stok_minimum: 15, status: 'aktif' },
      { sku: 'FSH-002', nama: 'Topi Baseball Cap', kategori_id: 2, foto: null, satuan: 'pcs', harga_beli: 18000, harga_jual: 40000, stok: 0, stok_minimum: 10, status: 'aktif' },
      { sku: 'AKS-002', nama: 'Tempered Glass Samsung A54', kategori_id: 3, foto: null, satuan: 'pcs', harga_beli: 5000, harga_jual: 20000, stok: 300, stok_minimum: 50, status: 'aktif' },
      { sku: 'ELK-003', nama: 'Speaker Bluetooth Portable', kategori_id: 1, foto: null, satuan: 'pcs', harga_beli: 75000, harga_jual: 150000, stok: 45, stok_minimum: 10, status: 'aktif' },
      { sku: 'GDG-002', nama: 'Power Bank 10000mAh', kategori_id: 4, foto: null, satuan: 'pcs', harga_beli: 60000, harga_jual: 120000, stok: 60, stok_minimum: 15, status: 'aktif' },
      { sku: 'PRH-001', nama: 'Lampu LED Strip 5M', kategori_id: 5, foto: null, satuan: 'pcs', harga_beli: 30000, harga_jual: 65000, stok: 25, stok_minimum: 10, status: 'nonaktif' },
    ]);

    // 8. Transaksi & Detail
    await db('transaksi').insert([
      { id: 1, no_transaksi: 'TRX-20250915-001', tanggal: '2025-09-15 10:30:00', pelanggan_id: 1, kasir_id: 1, kasir_nama: 'Administrator Toko', subtotal: 234000, diskon: 10000, total: 224000, metode_bayar: 'Cash', bayar: 250000, kembalian: 26000, status: 'selesai', resi: null },
      { id: 2, no_transaksi: 'TRX-20250915-002', tanggal: '2025-09-15 11:15:00', pelanggan_id: 2, kasir_id: 2, kasir_nama: 'Budi Kasir', subtotal: 450000, diskon: 0, total: 450000, metode_bayar: 'Transfer', bayar: 450000, kembalian: 0, status: 'selesai', resi: 'JNE-123456789' },
      { id: 3, no_transaksi: 'TRX-20250915-003', tanggal: '2025-09-15 14:20:00', pelanggan_id: 3, kasir_id: 1, kasir_nama: 'Administrator Toko', subtotal: 175000, diskon: 5000, total: 170000, metode_bayar: 'QRIS', bayar: 170000, kembalian: 0, status: 'selesai', resi: null },
      { id: 4, no_transaksi: 'TRX-20250916-001', tanggal: '2025-09-16 08:45:00', pelanggan_id: 4, kasir_id: 1, kasir_nama: 'Administrator Toko', subtotal: 890000, diskon: 50000, total: 840000, metode_bayar: 'Transfer', bayar: 840000, kembalian: 0, status: 'diproses', resi: null },
      { id: 5, no_transaksi: 'TRX-20250916-002', tanggal: '2025-09-16 09:10:00', pelanggan_id: 1, kasir_id: 2, kasir_nama: 'Budi Kasir', subtotal: 55000, diskon: 0, total: 55000, metode_bayar: 'Cash', bayar: 100000, kembalian: 45000, status: 'selesai', resi: null }
    ]);

    await db('transaksi_detail').insert([
      { transaksi_id: 4, produk_id: 1, nama_produk: 'Earphone Bluetooth TWS', qty: 3, harga: 89000, harga_beli: 45000, diskon: 0, subtotal: 267000, laba_kotor: (89000 - 45000) * 3 },
      { transaksi_id: 4, produk_id: 4, nama_produk: 'Smartwatch Sport Band', qty: 2, harga: 250000, harga_beli: 120000, diskon: 0, subtotal: 500000, laba_kotor: (250000 - 120000) * 2 },
      { transaksi_id: 4, produk_id: 5, nama_produk: 'Charger Fast Charging 33W', qty: 1, harga: 55000, harga_beli: 25000, diskon: 0, subtotal: 55000, laba_kotor: 55000 - 25000 },
      { transaksi_id: 4, produk_id: 7, nama_produk: 'Tempered Glass Samsung A54', qty: 4, harga: 20000, harga_beli: 5000, diskon: 2000, subtotal: 68000, laba_kotor: (18000 - 5000) * 4 }
    ]);

    // 9. PO Import & Detail
    await db('po_import').insert([
      { id: 1, no_po: 'PO-2025-001', tanggal: '2025-09-01', supplier_id: 1, forwarder_id: 1, kurs_rmb: 2250, biaya_forwarder: 500000, ongkir_lokal: 150000, base_type: 'kurs', nominal_tf: 0, total_rmb: 800, total_idr: 1800000, landed_cost: 2450000, status: 'Diterima', catatan: 'Barang sudah masuk gudang utama' },
      { id: 2, no_po: 'PO-2025-002', tanggal: '2025-09-10', supplier_id: 2, forwarder_id: 2, kurs_rmb: 2280, biaya_forwarder: 750000, ongkir_lokal: 200000, base_type: 'nominal_tf', nominal_tf: 3500000, total_rmb: 1500, total_idr: 3500000, landed_cost: 4450000, status: 'Dalam Perjalanan', catatan: 'Sedang proses bea cukai' },
      { id: 3, no_po: 'PO-2025-003', tanggal: '2025-09-14', supplier_id: 3, forwarder_id: null, kurs_rmb: 2300, biaya_forwarder: 0, ongkir_lokal: 0, base_type: 'kurs', nominal_tf: 0, total_rmb: 500, total_idr: 1150000, landed_cost: 1150000, status: 'Draft', catatan: 'Menunggu konfirmasi supplier' }
    ]);

    await db('po_detail').insert([
      { po_id: 1, produk_id: 1, qty: 50, harga_rmb: 10, jumlah_koli: 2, subtotal_rmb: 500 },
      { po_id: 1, produk_id: 5, qty: 60, harga_rmb: 5, jumlah_koli: 1, subtotal_rmb: 300 },
      { po_id: 2, produk_id: 4, qty: 30, harga_rmb: 50, jumlah_koli: 3, subtotal_rmb: 1500 },
      { po_id: 3, produk_id: 2, qty: 100, harga_rmb: 5, jumlah_koli: 2, subtotal_rmb: 500 }
    ]);

    await db('po_status_history').insert([
      { po_id: 1, status: 'Draft', tanggal: '2025-09-01 10:00:00', catatan: 'PO Dibuat', created_by: 'Administrator' },
      { po_id: 1, status: 'Dipesan', tanggal: '2025-09-02 14:00:00', catatan: 'DP ditransfer ke supplier', created_by: 'Administrator' },
      { po_id: 1, status: 'Dalam Perjalanan', tanggal: '2025-09-05 11:30:00', nomor_resi: 'CG-882190', estimasi_tiba: '2025-09-15', catatan: 'Dikirim via Cargo Laut', created_by: 'Administrator' },
      { po_id: 1, status: 'Diterima', tanggal: '2025-09-15 09:00:00', catatan: 'Barang tiba di gudang dan stok bertambah', created_by: 'Administrator' },
      { po_id: 2, status: 'Draft', tanggal: '2025-09-10 09:00:00', catatan: 'PO Dibuat', created_by: 'Administrator' },
      { po_id: 2, status: 'Dalam Perjalanan', tanggal: '2025-09-12 16:00:00', nomor_resi: 'CI-994321', estimasi_tiba: '2025-09-22', catatan: 'Air cargo Shenzhen', created_by: 'Administrator' }
    ]);

    // 10. Audit Log
    await db('audit_log').insert([
      { username: 'system', action: 'INIT_DATABASE', details: 'Database berhasil diinisialisasi dengan data awal', ip_address: '127.0.0.1' },
      { username: 'admin', action: 'LOGIN', details: 'User admin login berhasil', ip_address: '127.0.0.1' }
    ]);

    console.log('  ✅ Seeder data awal berhasil dimasukkan!');
  }

  console.log('✅ Inisialisasi database selesai.');
}

module.exports = initDatabase;

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Selesai!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Gagal inisialisasi database:', err);
      process.exit(1);
    });
}
