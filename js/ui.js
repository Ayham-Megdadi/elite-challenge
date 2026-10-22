/* ============================================================
   ui.js — أدوات واجهة صغيرة مشتركة
   ============================================================ */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0, 0); }
}

let toastTimer = null;
export function toast(message, type = 'info', ms = 3800) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast toast--${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

export function openModal(title, html) {
  const modal = $('#modal');
  if (!modal) return;
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  modal.classList.remove('hidden');
  const focusable = modal.querySelector('button');
  if (focusable) focusable.focus();
}

export function closeModal() {
  $('#modal')?.classList.add('hidden');
}

export function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h} س ${m} د`;
  if (m) return `${m} د ${String(sec).padStart(2, '0')} ث`;
  return `${sec} ث`;
}

export function download(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}