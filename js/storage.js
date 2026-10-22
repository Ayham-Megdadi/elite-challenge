/* ============================================================
   storage.js — التخزين المحلي + تطبيع النص العربي
   كل التخزين مُغلَّف بـ try/catch لأن LocalStorage قد يفشل
   (وضع التصفح الخاص، امتلاء المساحة، سياسات المتصفح...).
   ============================================================ */

const PREFIX = 'ec';
export const SCHEMA_VERSION = 2;

export const KEYS = {
  settings: `${PREFIX}.settings.v${SCHEMA_VERSION}`,
  usage:    `${PREFIX}.usage.v1`,
  results:  `${PREFIX}.results.v1`,
};

/* ---------- قراءة/كتابة آمنة ---------- */
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn('[storage] تعذرت القراءة:', key, err);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[storage] تعذرت الكتابة:', key, err);
    return false;
  }
}

export function removeKey(key) {
  try { localStorage.removeItem(key); return true; }
  catch (err) { console.warn('[storage] تعذر الحذف:', key, err); return false; }
}

/* ---------- الإعدادات ---------- */
const DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  mode: 'solo',
  playerName: 'النخبة',
  team1Name: 'الفريق الأول',
  team2Name: 'الفريق الثاني',
  timer: { enabled: false, seconds: 45 },
  categories: [],
};

export function loadSettings() {
  const s = readJSON(KEYS.settings, null);
  if (!s || typeof s !== 'object') return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    timer: { ...DEFAULT_SETTINGS.timer, ...(s.timer || {}) },
    categories: Array.isArray(s.categories) ? s.categories : [],
  };
}

export function saveSettings(settings) {
  return writeJSON(KEYS.settings, { ...settings, schemaVersion: SCHEMA_VERSION });
}

/* ---------- سجل استخدام الأسئلة ---------- */
export function loadUsage() {
  const u = readJSON(KEYS.usage, {});
  return u && typeof u === 'object' && !Array.isArray(u) ? u : {};
}

export function saveUsage(usage) {
  return writeJSON(KEYS.usage, usage);
}

export function markQuestionsUsed(ids) {
  const usage = loadUsage();
  const now = Date.now();
  for (const id of ids) {
    const rec = usage[id] && typeof usage[id] === 'object' ? usage[id] : { count: 0, lastUsedAt: 0 };
    rec.count = (Number(rec.count) || 0) + 1;
    rec.lastUsedAt = now;
    usage[id] = rec;
  }
  return saveUsage(usage);
}

export function usedTextKeys() {
  // مفاتيح النصوص المحفوظة في سجل النتائج (احتياطي) — يُستخدم لمنع التكرار النصي
  const results = loadResults();
  const set = new Set();
  (results.history || []).forEach(r => {
    (r.textKeys || []).forEach(k => set.add(k));
  });
  return set;
}

/* ---------- النتائج ---------- */
export function loadResults() {
  const r = readJSON(KEYS.results, null);
  if (!r || typeof r !== 'object') return { history: [], best: null };
  return {
    history: Array.isArray(r.history) ? r.history : [],
    best: r.best && typeof r.best === 'object' ? r.best : null,
  };
}

export function saveResults(data) {
  return writeJSON(KEYS.results, data);
}

export function addResult(entry) {
  const data = loadResults();
  data.history.unshift(entry);
  data.history = data.history.slice(0, 60); // حد أقصى للسجل

  const best = data.best;
  const better =
    !best ||
    entry.bestScore > (best.score || 0) ||
    (entry.bestScore === (best.score || 0) && entry.date < (best.date || ''));
  if (better) {
    data.best = { name: entry.bestName, score: entry.bestScore, date: entry.date, mode: entry.mode };
  }
  saveResults(data);
  return data;
}

/* ---------- إعادة الضبط ---------- */
export function resetAll() {
  Object.values(KEYS).forEach(removeKey);
}

export function exportAll() {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    settings: loadSettings(),
    usage: loadUsage(),
    results: loadResults(),
  };
}

/* ============================================================
   تطبيع النص العربي
   حدود النظام: هذا تطبيع شكلي/إملائي فقط. لا يكتشف التشابه
   الدلالي (نفس المعنى بصياغة مختلفة). الهدف تقليل التكرار
   النصي المباشر والأخطاء الإملائية الشائعة.
   ============================================================ */
export function normalizeArabic(input) {
  if (!input) return '';
  let s = String(input).toLowerCase();

  // إزالة التشكيل والتطويل
  s = s.replace(/[\u064B-\u0652\u0670\u0653-\u0655\u0640]/g, '');
  // توحيد الألف
  s = s.replace(/[إأآٱ]/g, 'ا');
  // توحيد الياء والألف المقصورة
  s = s.replace(/ى/g, 'ي');
  // توحيد الهمزة على الواو والياء
  s = s.replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  // التاء المربوطة ← هاء
  s = s.replace(/ة/g, 'ه');
  // إزالة علامات الترقيم والرموز
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  // توحيد المسافات
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

export function isSimilarText(a, b) {
  const na = normalizeArabic(a);
  const nb = normalizeArabic(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // تشابه بسيط: احتواء أحد النصين للآخر (للنصوص القصيرة فقط)
  if (na.length > 25 && nb.length > 25 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}