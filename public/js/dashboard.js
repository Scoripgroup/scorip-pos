/**
 * SCORIP POS — Dashboard Charts (Chart.js)
 */

document.addEventListener('DOMContentLoaded', function () {
  const data = window.dashboardData;
  if (!data) return;

  const fontFamily = "'Inter', sans-serif";
  const gridColor = 'rgba(0,0,0,0.04)';

  Chart.defaults.font.family = fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#64748B';

  // --- Penjualan 7 Hari ---
  const ctxPenjualan = document.getElementById('chartPenjualan');
  if (ctxPenjualan) {
    new Chart(ctxPenjualan, {
      type: 'line',
      data: {
        labels: data.penjualan_7hari.labels,
        datasets: [{
          label: 'Penjualan (Rp)',
          data: data.penjualan_7hari.data,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4F46E5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            titleFont: { weight: '600' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) {
                return 'Rp ' + ctx.parsed.y.toLocaleString('id-ID');
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              callback: function(val) {
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'jt';
                if (val >= 1000) return (val / 1000) + 'rb';
                return val;
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  // --- Penjualan per Kategori ---
  const ctxKategori = document.getElementById('chartKategori');
  if (ctxKategori) {
    new Chart(ctxKategori, {
      type: 'doughnut',
      data: {
        labels: data.penjualan_kategori.labels,
        datasets: [{
          data: data.penjualan_kategori.data,
          backgroundColor: [
            '#4F46E5',
            '#7C3AED',
            '#06B6D4',
            '#10B981',
            '#F59E0B',
          ],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 },
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) {
                return ctx.label + ': Rp ' + ctx.parsed.toLocaleString('id-ID');
              }
            }
          }
        }
      }
    });
  }

  // --- Produk Terlaris ---
  const ctxTerlaris = document.getElementById('chartTerlaris');
  if (ctxTerlaris) {
    new Chart(ctxTerlaris, {
      type: 'bar',
      data: {
        labels: data.produk_terlaris.labels,
        datasets: [{
          label: 'Terjual',
          data: data.produk_terlaris.data,
          backgroundColor: [
            'rgba(79,70,229,0.8)',
            'rgba(124,58,237,0.8)',
            'rgba(6,182,212,0.8)',
            'rgba(16,185,129,0.8)',
            'rgba(245,158,11,0.8)',
          ],
          borderRadius: 6,
          barThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) {
                return ctx.parsed.x + ' unit terjual';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: '500' } }
          }
        }
      }
    });
  }
});
