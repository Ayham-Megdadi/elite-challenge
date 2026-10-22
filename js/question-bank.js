/* ============================================================
   question-bank.js — تحميل بنك الأسئلة، التحقق منه، وبناء الجولة
   ============================================================ */

import { normalizeArabic } from './storage.js';

export const STAGE_DEFS = [
  { stage: 1, difficulty: 'easy',     points: 100, count: 6, name: 'المرحلة الأولى',   hint: 'سهلة' },
  { stage: 2, difficulty: 'medium',   points: 200, count: 6, name: 'المرحلة الثانية',  hint: 'متوسطة' },
  { stage: 3, difficulty: 'hard',     points: 300, count: 4, name: 'المرحلة الثالثة',  hint: 'صعبة جدًا' },
  { stage: 4, difficulty: 'veryhard', points: 500, count: 2, name: 'المرحلة النهائية', hint: 'صعبة للغاية' },
];

export const MAX_SCORE = STAGE_DEFS.reduce((sum, d) => sum + d.count * d.points, 0); // 4000

export const DIFFICULTY_LABELS = {
  easy: 'سهلة',
  medium: 'متوسطة',
  hard: 'صعبة جدًا',
  veryhard: 'صعبة للغاية',
};

const VALID_STATUS = new Set(['active', 'archived', 'review']);

/* ---------- التحقق من سؤال واحد ---------- */
export function validateQuestion(q, index = 0) {
  const errors = [];
  const at = `السؤال #${index + 1}`;
  if (!q || typeof q !== 'object' || Array.isArray(q)) {
    return [`${at}: ليس كائنًا صالحًا.`];
  }
  for (const field of ['id', 'category', 'difficulty', 'question', 'correctAnswer']) {
    if (typeof q[field] !== 'string' || !q[field].trim()) {
      errors.push(`${at}: الحقل «${field}» مطلوب ويجب أن يكون نصًا غير فارغ.`);
    }
  }
  if (q.difficulty && !DIFFICULTY_LABELS[q.difficulty]) {
    errors.push(`${at}: قيمة صعوبة غير معروفة (${q.difficulty}).`);
  }
  if (q.status && !VALID_STATUS.has(q.status)) {
    errors.push(`${at}: حالة غير معروفة (${q.status}).`);
  }
  const type = q.type || 'mcq';
  if (type !== 'open' && type !== 'mcq') {
    errors.push(`${at}: نوع السؤال يجب أن يكون open أو mcq.`);
  }
  if (type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${at}: الأسئلة متعددة الخيارات يجب أن تحتوي 4 خيارات بالضبط.`);
    } else {
      if (q.options.some(o => typeof o !== 'string' || !o.trim())) {
        errors.push(`${at}: خيار فارغ أو غير نصي.`);
      }
      if (new Set(q.options.map(o => normalizeArabic(o))).size !== 4) {
        errors.push(`${at}: توجد خيارات مكررة.`);
      }
      if (typeof q.correctAnswer === 'string' &&
          !q.options.some(o => normalizeArabic(o) === normalizeArabic(q.correctAnswer))) {
        errors.push(`${at}: الإجابة الصحيحة غير موجودة ضمن الخيارات.`);
      }
    }
  }
  return errors;
}

/* ---------- تجهيز البنك ---------- */
export function prepareBank(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('صيغة الملف غير صحيحة.');
  if (!Array.isArray(raw.questions)) throw new Error('الملف لا يحتوي على مصفوفة «questions».');

  const categories = Array.isArray(raw.categories) ? raw.categories : [];
  const categoryIds = new Set(categories.map(c => c.id));

  const questions = [];
  const byId = new Map();
  const errors = [];
  const seenTexts = new Map();

  raw.questions.forEach((q, i) => {
    const errs = validateQuestion(q, i);
    if (errs.length) { errors.push(...errs); return; }
    if (byId.has(q.id)) { errors.push(`معرّف مكرر: ${q.id}`); return; }
    if (categoryIds.size && !categoryIds.has(q.category)) {
      errors.push(`السؤال ${q.id}: فئة غير معروفة (${q.category}).`);
      return;
    }

    const textKey = normalizeArabic(q.question);
    const record = {
      ...q,
      type: q.type || 'mcq',
      status: q.status || 'active',
      options: Array.isArray(q.options) ? q.options.slice() : [],
      tags: Array.isArray(q.tags) ? q.tags : [],
      textKey,
    };

    if (record.status === 'active') {
      if (seenTexts.has(textKey)) {
        errors.push(`نص مكرر: ${q.id} يطابق ${seenTexts.get(textKey)}.`);
      } else {
        seenTexts.set(textKey, q.id);
      }
    }

    byId.set(record.id, record);
    questions.push(record);
  });

  if (errors.length) console.warn('[bank] مشاكل في البنك:', errors);

  return {
    schemaVersion: raw.schemaVersion || 1,
    updatedAt: raw.updatedAt || '',
    categories,
    questions,
    byId,
    errors,
  };
}

/* ---------- تحميل البنك ---------- */
export async function loadBank(url = 'data/questions.json') {
  let res;
  try {
    res = await fetch(url, { cache: 'no-cache' });
  } catch (err) {
    throw new Error('تعذر الوصول إلى ملف الأسئلة. شغّل المشروع عبر خادم محلي (راجع README).');
  }
  if (!res.ok) throw new Error(`تعذر تحميل بنك الأسئلة (HTTP ${res.status}).`);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error('ملف الأسئلة ليس JSON صالحًا.');
  }
  return prepareBank(data);
}

/* ---------- أدوات مساعدة ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toRoundQuestion(q, def) {
  return {
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    stage: def.stage,
    points: def.points,
    question: q.question,
    type: q.type,
    options: q.options.slice(),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    source: q.source || '',
    textKey: q.textKey,
    swappedFrom: null,
  };
}

function pickQuestions(pool, n, { takenIds, takenTexts, usage }) {
  const scored = pool.map(q => {
    const rec = usage[q.id];
    return {
      q,
      used: takenIds.has(q.id),
      dup: takenTexts.has(q.textKey),
      count: rec && Number(rec.count) ? Number(rec.count) : 0,
      last: rec && Number(rec.lastUsedAt) ? Number(rec.lastUsedAt) : 0,
      r: Math.random(),
    };
  });

  scored.sort((a, b) => {
    if (a.used !== b.used) return a.used ? 1 : -1;         // غير المستخدم أولًا
    if (a.dup !== b.dup) return a.dup ? 1 : -1;            // نص غير مكرر أولًا
    if (a.count !== b.count) return a.count - b.count;     // أقل استخدامًا
    if (a.last !== b.last) return a.last - b.last;         // الأقدم استخدامًا
    return a.r - b.r;
  });

  return scored.slice(0, n).map(s => s.q);
}

/* ---------- بناء الجولة ---------- */
export function buildRound(bank, { categoryIds, usedIds = new Set(), usedTexts = new Set(), usage = {} }) {
  const validCats = bank.categories.map(c => c.id);
  const cats = [...new Set(categoryIds)].filter(id => validCats.includes(id));

  if (!cats.length) {
    return { ok: false, reason: 'لم يتم اختيار أي فئة صالحة.' };
  }

  const active = bank.questions.filter(q => q.status === 'active');
  const takenIds = new Set(usedIds);
  const takenTexts = new Set(usedTexts);
  const collected = [];
  const shortages = [];
  let reusedCount = 0;

  for (const def of STAGE_DEFS) {
    const pools = new Map();
    for (const c of cats) {
      pools.set(c, active.filter(q => q.category === c && q.difficulty === def.difficulty));
    }
    const totalAvailable = [...pools.values()].reduce((s, a) => s + a.length, 0);
    if (totalAvailable < def.count) {
      shortages.push(`${def.name} (${DIFFICULTY_LABELS[def.difficulty]}): مطلوب ${def.count} سؤالًا، المتوفر ${totalAvailable}.`);
      continue;
    }

    // توزيع عادل بالتناوب
    const order = shuffle(cats);
    const quotas = new Map(cats.map(c => [c, 0]));
    let remaining = def.count;
    let guard = 0;
    while (remaining > 0 && guard++ < 500) {
      let progressed = false;
      for (const c of order) {
        if (remaining === 0) break;
        if (quotas.get(c) < pools.get(c).length) {
          quotas.set(c, quotas.get(c) + 1);
          remaining -= 1;
          progressed = true;
        }
      }
      if (!progressed) break;
    }
    if (remaining > 0) {
      shortages.push(`${def.name}: تعذر توزيع ${remaining} سؤالًا على الفئات المختارة.`);
      continue;
    }

    for (const c of cats) {
      const n = quotas.get(c);
      if (!n) continue;
      const chosen = pickQuestions(pools.get(c), n, { takenIds, takenTexts, usage });
      for (const q of chosen) {
        if (takenIds.has(q.id)) reusedCount += 1;
        takenIds.add(q.id);
        takenTexts.add(q.textKey);
        collected.push(toRoundQuestion(q, def));
      }
    }
  }

  if (shortages.length) {
    return {
      ok: false,
      reason: 'لا توجد أسئلة كافية لإكمال الجولة ضمن الفئات المختارة.',
      detail: shortages.join(' · '),
      shortages,
    };
  }

  // ترتيب المراحل + خلط داخل كل مرحلة
  const ordered = STAGE_DEFS.flatMap(def => shuffle(collected.filter(q => q.stage === def.stage)));

  return { ok: true, questions: ordered, reusedCount, total: ordered.length };
}

/* ---------- مولّد بديل «تبديل السؤال» ---------- */
export function makeSwapFinder(bank, { usedIds = new Set(), usedTexts = new Set() } = {}) {
  return function findReplacement(oldQuestion, inRoundIds) {
    const pool = bank.questions.filter(q =>
      q.status === 'active' &&
      q.category === oldQuestion.category &&
      q.difficulty === oldQuestion.difficulty &&
      q.id !== oldQuestion.id &&
      !inRoundIds.has(q.id) &&
      !usedIds.has(q.id) &&
      !usedTexts.has(q.textKey)
    );
    if (!pool.length) return null;
    const def = STAGE_DEFS.find(d => d.stage === oldQuestion.stage);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return toRoundQuestion(picked, def);
  };
}

/* ---------- إحصاءات البنك ---------- */
export function bankStats(bank) {
  const active = bank.questions.filter(q => q.status === 'active');
  const byCategory = new Map();
  const byDifficulty = { easy: 0, medium: 0, hard: 0, veryhard: 0 };

  for (const c of bank.categories) {
    byCategory.set(c.id, { easy: 0, medium: 0, hard: 0, veryhard: 0, total: 0 });
  }
  for (const q of active) {
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    const entry = byCategory.get(q.category);
    if (entry) { entry[q.difficulty] += 1; entry.total += 1; }
  }

  return {
    total: bank.questions.length,
    active: active.length,
    archived: bank.questions.filter(q => q.status === 'archived').length,
    review: bank.questions.filter(q => q.status === 'review').length,
    byCategory,
    byDifficulty,
  };
}