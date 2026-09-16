/**
 * SCORIP POS — Laporan Charts JS
 */
document.addEventListener('DOMContentLoaded', function() {
  const data = window.dashboardData;
  if (!data) return;

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#64748B';

  // Penjualan Harian
  const ctx1 = document.getElementById('chartLapPenjualan');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: data.penjualan_7hari.labels,
        datasets: [{
          label: 'Penjualan',
          data: data.penjualan_7hari.data,
          backgroundColor: 'rgba(79,70,229,0.7)',
          borderRadius: 6,
          barThickness: 32,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor:'#0F172A', cornerRadius:8, callbacks:{ label:ctx=>'Rp '+ctx.parsed.y.toLocaleString('id-ID') } } },
        scales: { x:{ grid:{display:false} }, y:{ grid:{color:'rgba(0,0,0,0.04)'}, border:{display:false}, ticks:{ callback:v=>v>=1e6?(v/1e6).toFixed(1)+'jt':v>=1e3?(v/1e3)+'rb':v } } }
      }
    });
  }

  // Produk Terlaris
  const ctx2 = document.getElementById('chartLapTerlaris');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: data.produk_terlaris.labels,
        datasets: [{ data: data.produk_terlaris.data, backgroundColor:['#4F46E5','#7C3AED','#06B6D4','#10B981','#F59E0B'], borderRadius:6, barThickness:24 }]
      },
      options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{grid:{color:'rgba(0,0,0,0.04)'},border:{display:false}},y:{grid:{display:false}}} }
    });
  }

  // Kategori
  const ctx3 = document.getElementById('chartLapKategori');
  if (ctx3) {
    new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: data.penjualan_kategori.labels,
        datasets: [{ data: data.penjualan_kategori.data, backgroundColor:['#4F46E5','#7C3AED','#06B6D4','#10B981','#F59E0B'], borderWidth:0 }]
      },
      options: { responsive:true, maintainAspectRatio:false, cutout:'60%', plugins:{legend:{position:'bottom',labels:{padding:12,usePointStyle:true,pointStyle:'circle',font:{size:11}}}} }
    });
  }
});
