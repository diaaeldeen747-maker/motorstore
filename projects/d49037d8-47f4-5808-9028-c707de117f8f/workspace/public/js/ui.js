// UI helpers: formatting, toast, DOM helpers

export function formatPrice(n) {
  return new Intl.NumberFormat('ar-EG').format(Number(n || 0)) + ' ج.م';
}

export function formatNumber(n) {
  return new Intl.NumberFormat('ar-EG').format(Number(n || 0));
}

export function formatDate(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T') + (String(s).includes('Z') ? '' : 'Z'));
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  el.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function skeletonCard() {
  return el('div', { class: 'product-card' }, [
    el('div', { class: 'skeleton', style: 'aspect-ratio:4/3;border-radius:0 0 0 0;' }),
    el('div', { class: 'product-body' }, [
      el('div', { class: 'skeleton', style: 'height:16px;width:80%;' }),
      el('div', { class: 'skeleton', style: 'height:16px;width:50%;' }),
      el('div', { class: 'skeleton', style: 'height:22px;width:40%;' }),
    ]),
  ]);
}

export function emptyState(message, icon = '📦') {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty-icon' }, icon),
    el('p', {}, message),
  ]);
}

export function loadingState() {
  return el('div', { class: 'loading' }, [
    el('div', { class: 'spinner' }),
    el('p', {}, 'جارٍ التحميل...'),
  ]);
}

export function errorState(message) {
  return el('div', { class: 'error-state' }, [
    el('div', { class: 'empty-icon' }, '⚠️'),
    el('p', {}, message || 'حدث خطأ أثناء التحميل'),
  ]);
}
