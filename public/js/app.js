/**
 * SCORIP POS — Global Client-Side JavaScript
 * Handles sidebar toggle, flash messages, delete confirmation, 
 * currency formatting, and common utilities.
 */

document.addEventListener('DOMContentLoaded', function () {
  initSidebar();
  initAlertAutoDismiss();
  initDeleteModal();
  initTooltips();
});

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('show');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
    });
  }
}

// ============================================================
// ALERT AUTO-DISMISS
// ============================================================
function initAlertAutoDismiss() {
  const alerts = document.querySelectorAll('.alert-flash');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      alert.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(function () {
        alert.remove();
      }, 300);
    }, 5000);
  });
}

// ============================================================
// DELETE CONFIRMATION MODAL
// ============================================================
function initDeleteModal() {
  const deleteModal = document.getElementById('deleteModal');
  if (!deleteModal) return;

  deleteModal.addEventListener('show.bs.modal', function (event) {
    const trigger = event.relatedTarget;
    if (!trigger) return;

    const itemName = trigger.getAttribute('data-name') || 'item ini';
    const deleteUrl = trigger.getAttribute('data-url') || '#';

    document.getElementById('deleteItemName').textContent = itemName + '?';
    document.getElementById('deleteForm').setAttribute('action', deleteUrl);
  });
}

// ============================================================
// TOOLTIPS
// ============================================================
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el);
  });
}

// ============================================================
// CURRENCY FORMATTER
// ============================================================
function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function parseRupiah(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/[^0-9-]/g, ''), 10) || 0;
}

// ============================================================
// DATE FORMATTER
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type) {
  type = type || 'success';
  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };

  const toast = document.createElement('div');
  toast.className = 'alert-flash alert-' + (type === 'error' ? 'danger' : type);
  toast.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;min-width:300px;max-width:420px;box-shadow:var(--shadow-xl);';
  toast.setAttribute('role', 'alert');
  toast.innerHTML =
    '<i class="bi ' + (icons[type] || icons.info) + '"></i>' +
    '<span>' + message + '</span>' +
    '<button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="Close"></button>';

  document.body.appendChild(toast);

  setTimeout(function () {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 4000);
}

// ============================================================
// AJAX UTILITY
// ============================================================
async function fetchJSON(url, options) {
  options = options || {};
  const defaults = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const config = Object.assign({}, defaults, options);

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Gagal memuat data: ' + error.message, 'error');
    throw error;
  }
}

// ============================================================
// DEBOUNCE UTILITY
// ============================================================
function debounce(func, wait) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      func.apply(context, args);
    }, wait);
  };
}

// ============================================================
// IMAGE PREVIEW
// ============================================================
function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}
