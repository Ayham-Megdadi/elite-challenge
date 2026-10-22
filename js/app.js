/* ============================================================
   app.js — الربط بين الواجهة والمحرك والبيانات
   ============================================================ */

import {
  loadBank, buildRound, makeSwapFinder, bankStats,
  STAGE_DEFS, MAX_SCORE, DIFFICULTY_LABELS,
} from './question-bank.js';
import { GameEngine } from './game-engine.js';
import * as S from './storage.js';
import { $, $$, showScreen, toast, openModal, closeModal, fmtDuration, download } from './ui.js';

/* ---------- الحالة ---------- */
const state = {
  bank: null,
  engine: null,
  settings: S.loadSettings(),
  selected: new Set(),
  usage: S.loadUsage(),
  usedTexts: new Set(),
  lastRound: null,
  timerId: null,
  remaining: 0,
};

/* ---------- أدوات مساعدة ---------- */
const categoryName = id => state.bank?.categories.find(c => c.id === id)?.name || id;

function setWarning(message, detail = '') {
  const box = $('#setupWarning');
  if (!message) { box.classList.add('hidden'); box.textContent = ''; return; }
  box.classList.remove('hidden');
  box.textContent = detail ? `${message}\n${detail}` : message;
}

/* ============================================================
   التهيئة
   ============================================================ */
async function init() {
  applySettingsToForm();
  bindEvents();
  renderBestScore();

  try {
    state.bank = await loadBank('data/questions.json');
    state.usedTexts = collectUsedTexts();
    renderHomeCategories();
    renderCategoryPicker();
    renderBankStats();
  } catch (err) {
    console.error(err);
    $('#bankStats').textContent = 'تعذر تحميل بنك الأسئلة: ' + err.message;
    toast(err.message, 'error', 7000);
  }
}

function collectUsedTexts() {
  const set = new Set();
  // نصوص الأسئلة المستخدمة سابقًا (تقريبي: من معرّفات الاستخدام)
  Object.keys(state.usage).forEach(id => {
    const q = state.bank?.byId.get(id);
    if (q?.textKey) set.add(q.textKey);
  });
  return set;
}

function applySettingsToForm() {
  const s = state.settings;
  const radio = document.querySelector(`input[name="mode"][value="${s.mode}"]`);
  if (radio) radio.checked = true;
  $('#playerName').value = s.playerName || 'النخبة';
  $('#team1Name').value = s.team1Name || 'الفريق الأول';
  $('#team2Name').value = s.team2Name || 'الفريق الثاني';
  $('#timerEnabled').checked = !!s.timer.enabled;
  $('#timerSeconds').value = s.timer.seconds || 45;
  $('#teamFields').classList.toggle('hidden', s.mode !== 'teams');
  $('#fieldPlayer').classList.toggle('hidden', s.mode === 'teams');
}

function readFormSettings() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'solo';
  return {
    mode,
    playerName: ($('#playerName').value || '').trim() || 'اللاعب',
    team1Name: ($('#team1Name').value || '').trim() || 'الفريق الأول',
    team2Name: ($('#team2Name').value || '').trim() || 'الفريق الثاني',
    timer: {
      enabled: $('#timerEnabled').checked,
      seconds: Math.min(180, Math.max(10, Number($('#timerSeconds').value) || 45)),
    },
    categories: [...state.selected],
  };
}

/* ============================================================
   الشاشة الرئيسية
   ============================================================ */
function renderHomeCategories() {
  const box = $('#homeCategories');
  box.innerHTML = '';
  if (!state.bank) return;
  const stats = bankStats(state.bank);
  for (const cat of state.bank.categories) {
    const n = stats.byCategory.get(cat.id)?.total || 0;
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = n ? `${cat.name} · ${n}` : cat.name;
    if (!n) chip.style.opacity = '.45';
    box.appendChild(chip);
  }
}

function renderBankStats() {
  if (!state.bank) return;
  const st = bankStats(state.bank);
  const parts = [
    `الأسئلة النشطة: ${st.active}`,
    `متعددة الخيارات/مفتوحة`,
    `سهلة ${st.byDifficulty.easy} · متوسطة ${st.byDifficulty.medium} · صعبة ${st.byDifficulty.hard} · صعبة للغاية ${st.byDifficulty.veryhard}`,
  ];
  if (st.review) parts.push(`بحاجة لمراجعة: ${st.review}`);
  if (st.archived) parts.push(`مؤرشفة: ${st.archived}`);
  $('#bankStats').textContent = parts.join(' — ');
}

function renderBestScore() {
  const { best } = S.loadResults();
  const box = $('#bestScore');
  if (!best) { box.textContent = 'لا توجد نتائج محفوظة بعد.'; return; }
  box.textContent = `${best.name} — ${best.score} / ${MAX_SCORE}`;
}

/* ============================================================
   إعداد الجولة
   ============================================================ */
function renderCategoryPicker() {
  const box = $('#categoryPicker');
  box.innerHTML = '';
  if (!state.bank) return;
  const stats = bankStats(state.bank);

  for (const cat of state.bank.categories) {
    const entry = stats.byCategory.get(cat.id) || { total: 0, easy: 0, medium: 0, hard: 0, veryhard: 0 };
    const id = `cat-${cat.id}`;

    const label = document.createElement('label');
    label.className = 'cat-card' + (state.selected.has(cat.id) ? ' is-selected' : '') + (entry.total === 0 ? ' is-disabled' : '');
    label.setAttribute('for', id);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = cat.id;
    input.checked = state.selected.has(cat.id);
    input.disabled = entry.total === 0;
    input.addEventListener('change', () => {
      if (input.checked) {
        if (state.selected.size >= 6) {
          input.checked = false;
          toast('يمكنك اختيار 6 فئات كحد أقصى.', 'error');
          return;
        }
        state.selected.add(cat.id);
      } else {
        state.selected.delete(cat.id);
      }
      renderCategoryPicker();
      setWarning('');
    });

    const name = document.createElement('span');
    name.textContent = cat.name;

    const count = document.createElement('span');
    count.className = 'cat-card__count';
    count.textContent = entry.total ? `${entry.total} سؤالًا` : 'لا أسئلة';

    label.append(input, name, count);
    box.appendChild(label);
  }
}

/* ============================================================
   بدء الجولة
   ============================================================ */
function startRound() {
  if (!state.bank) { toast('بنك الأسئلة غير محمّل.', 'error'); return; }

  const settings = readFormSettings();
  state.settings = settings;
  S.saveSettings(settings);

  if (!settings.categories.length) {
    setWarning('اختر فئة واحدة على الأقل قبل بدء الجولة.');
    return;
  }
  if (settings.categories.length > 6) {
    setWarning('لا يمكن اختيار أكثر من 6 فئات.');
    return;
  }

  state.usage = S.loadUsage();
  state.usedTexts = collectUsedTexts();
  const usedIds = new Set(Object.keys(state.usage));

  const result = buildRound(state.bank, {
    categoryIds: settings.categories,
    usedIds,
    usedTexts: state.usedTexts,
    usage: state.usage,
  });

  if (!result.ok) {
    setWarning(result.reason, result.detail || '');
    toast(result.reason, 'error', 6000);
    return;
  }

  setWarning('');

  const players = settings.mode === 'teams'
    ? [{ name: settings.team1Name }, { name: settings.team2Name }]
    : [{ name: settings.playerName }];

  try {
    state.engine = new GameEngine({
      mode: settings.mode,
      players,
      timer: settings.timer,
      questions: result.questions,
    });
  } catch (err) {
    console.error(err);
    toast('تعذر بدء الجولة: ' + err.message, 'error');
    return;
  }

  // تسجيل استخدام الأسئلة
  S.markQuestionsUsed(result.questions.map(q => q.id));
  state.usage = S.loadUsage();

  if (result.reusedCount > 0) {
    toast(`تنبيه: أُعيد استخدام ${result.reusedCount} سؤالًا من جولات سابقة لعدم توفر بدائل جديدة.`, 'info', 6000);
  }

  showScreen('screen-game');
  renderGame();
  startTimer();
}

/* ============================================================
   المؤقت
   ============================================================ */
function startTimer() {
  stopTimer();
  const e = state.engine;
  const el = $('#hudTimer');
  if (!e || !e.timer.enabled || !e.qState || e.qState.resolved) {
    el.classList.add('hidden');
    return;
  }
  state.remaining = e.timer.seconds;
  el.classList.remove('hidden');
  updateTimerUI();

  state.timerId = setInterval(() => {
    state.remaining -= 1;
    updateTimerUI();
    if (state.remaining <= 0) {
      stopTimer();
      const res = e.timeout();
      afterMutation(res);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

function updateTimerUI() {
  const el = $('#hudTimer');
  el.textContent = `${Math.max(0, state.remaining)} ث`;
  el.classList.toggle('is-low', state.remaining <= 10);
}

/* ============================================================
   عرض شاشة اللعب
   ============================================================ */
function renderGame() {
  const e = state.engine;
  if (!e) return;

  if (e.isFinished) { renderResults(); return; }

  const q = e.current;
  const s = e.qState;
  if (!q || !s) { renderResults(); return; }

  const def = STAGE_DEFS.find(d => d.stage === q.stage);

  $('#hudQNum').textContent = `${e.index + 1} / ${e.questions.length}`;
  $('#hudStage').textContent = def ? def.name : '—';
  $('#hudPoints').textContent = `${q.points} نقطة`;
  $('#hudTurn').textContent = e.mode === 'teams' ? e.players[e.turn].name : e.players[0].name;

  /* شريط النقاط */
  const bar = $('#scoreBar');
  bar.innerHTML = '';
  e.players.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'scorebar__item' + (e.mode === 'teams' && i === e.turn && !s.resolved ? ' is-active' : '');
    const nameEl = document.createElement('span');
    nameEl.className = 'scorebar__name';
    nameEl.textContent = p.name;
    const scoreEl = document.createElement('strong');
    scoreEl.className = 'scorebar__score';
    scoreEl.textContent = p.score;
    item.append(nameEl, scoreEl);
    bar.appendChild(item);
  });

  /* السؤال */
  $('#qCategory').textContent = categoryName(q.category);
  $('#qDifficulty').textContent = DIFFICULTY_LABELS[q.difficulty] || '';
  $('#qText').textContent = q.question;

  /* الخيارات */
  const opts = $('#qOptions');
  opts.innerHTML = '';
  if (q.type === 'mcq' && q.options.length) {
    q.options.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.dataset.action = 'choose';
      btn.dataset.index = String(i);
      btn.textContent = text;

      if (s.removedOptions.includes(i)) {
        btn.classList.add('is-removed');
        btn.disabled = true;
      }
      if (s.resolved) {
        btn.disabled = true;
        if (i === q.options.indexOf(q.correctAnswer)) btn.classList.add('is-correct');
        else if (i === s.selection || i === s.stealSelection) btn.classList.add('is-wrong');
      } else if (s.phase === 'primary' && s.selection !== null) {
        btn.disabled = true;
        if (i === s.selection) {
          btn.classList.add(i === q.options.indexOf(q.correctAnswer) ? 'is-correct' : 'is-wrong');
        }
      } else if (s.phase === 'steal' && s.stealSelection !== null) {
        btn.disabled = true;
      }

      opts.appendChild(btn);
    });
  }

  /* صندوق الإجابة */
  const answerBox = $('#qAnswer');
  if (s.revealed || s.resolved) {
    answerBox.classList.remove('hidden');
    answerBox.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'answer-box__label';
    label.textContent = 'الإجابة الصحيحة';
    const value = document.createElement('p');
    value.className = 'answer-box__value';
    value.textContent = q.correctAnswer;
    answerBox.append(label, value);

    if (q.explanation) {
      const ex = document.createElement('p');
      ex.className = 'answer-box__explain';
      ex.textContent = q.explanation;
      answerBox.appendChild(ex);
    }
    if (q.source) {
      const src = document.createElement('p');
      src.className = 'answer-box__source';
      src.textContent = `المصدر: ${q.source}`;
      answerBox.appendChild(src);
    }
  } else {
    answerBox.classList.add('hidden');
    answerBox.innerHTML = '';
  }

  /* إشعار السرقة */
  const notice = $('#turnNotice');
  if (e.mode === 'teams' && s.phase === 'steal' && !s.resolved) {
    notice.classList.remove('hidden');
    notice.textContent = `فرصة سرقة: ${e.players[s.stealPlayer].name} — الإجابة الصحيحة تمنح كامل نقاط السؤال (${q.points}).`;
  } else {
    notice.classList.add('hidden');
  }

  renderActions();
  renderTimerVisibility();
}

function renderTimerVisibility() {
  const e = state.engine;
  const el = $('#hudTimer');
  if (!e || !e.timer.enabled) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
}

function renderActions() {
  const e = state.engine;
  const q = e.current;
  const s = e.qState;
  const box = $('#gameActions');
  box.innerHTML = '';

  const addBtn = (label, action, cls = 'btn btn--gold', extra = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.dataset.action = action;
    b.textContent = label;
    Object.entries(extra).forEach(([k, v]) => { b.dataset[k] = v; });
    box.appendChild(b);
    return b;
  };

  /* وسائل المساعدة */
  const activePlayer = e.mode === 'teams'
    ? (s.phase === 'steal' ? s.stealPlayer : e.turn)
    : 0;

  if (!s.resolved && q.type === 'mcq' && q.stage >= 2) {
    const canFifty = e.canUseFifty(activePlayer);
    const p = e.players[activePlayer];
    addBtn(
      p.lifelines.fifty ? 'حذف إجابتين (مرة واحدة)' : 'حذف إجابتين — مُستخدَمة',
      'fifty',
      'btn lifeline' + (p.lifelines.fifty ? '' : ' is-used')
    ).disabled = !canFifty;
  }

  if (!s.resolved && q.stage >= 3) {
    const canSwap = e.canUseSwap(activePlayer);
    const p = e.players[activePlayer];
    addBtn(
      p.lifelines.swap ? 'تبديل السؤال (مرة واحدة)' : 'تبديل السؤال — مُستخدَم',
      'swap',
      'btn lifeline' + (p.lifelines.swap ? '' : ' is-used')
    ).disabled = !canSwap;
  }

  /* أزرار الحسم */
  if (s.resolved) {
    const isLast = e.index + 1 >= e.questions.length;
    addBtn(isLast ? 'عرض النتائج' : 'السؤال التالي', 'next', 'btn btn--gold btn--lg');
    return;
  }

  if (q.stage === 1) {
    if (!s.revealed) {
      addBtn('كشف الإجابة', 'reveal', 'btn btn--gold');
    } else if (s.phase === 'primary') {
      addBtn('إجابة صحيحة', 'judge-correct', 'btn btn--success');
      addBtn('إجابة خاطئة', 'judge-wrong', 'btn btn--danger');
    } else if (s.phase === 'steal') {
      const name = e.players[s.stealPlayer].name;
      addBtn(`إجابة صحيحة — ${name}`, 'steal-correct', 'btn btn--success');
      addBtn(`إجابة خاطئة — ${name}`, 'steal-wrong', 'btn btn--danger');
    }
  } else if (s.phase === 'steal' && s.stealSelection === null) {
    // ننتظر اختيار فريق السرقة من الخيارات
  }
}

/* ============================================================
   معالجة نتيجة أي تعديل على المحرك
   ============================================================ */
function afterMutation(result) {
  if (!result) { renderGame(); return; }
  if (result.ok === false) {
    toast(result.reason || 'تعذر تنفيذ العملية.', 'error', 5000);
    return;
  }
  if (result.resolved) {
    stopTimer();
  } else if (result.steal) {
    toast('فرصة سرقة للفريق المنافس!', 'info');
    startTimer();
  }
  renderGame();
}

/* ============================================================
   الأحداث
   ============================================================ */
function bindEvents() {
  document.addEventListener('click', async (ev) => {
    const target = ev.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const e = state.engine;

    switch (action) {
      /* ---- تنقل عام ---- */
      case 'go-home':
        stopTimer();
        showScreen('screen-home');
        renderBestScore();
        break;

      case 'help':
        openModal('طريقة اللعب', HELP_HTML);
        break;

      case 'close-modal':
        closeModal();
        break;

      case 'start':
        if (!state.bank) { toast('جارٍ تحميل بنك الأسئلة…', 'error'); return; }
        showScreen('screen-setup');
        renderCategoryPicker();
        break;

      case 'begin':
        startRound();
        break;

      /* ---- بيانات محلية ---- */
      case 'export-local': {
        const data = S.exportAll();
        download(`elite-challenge-backup-${Date.now()}.json`, JSON.stringify(data, null, 2));
        toast('تم تصدير نسخة احتياطية من البيانات المحلية.', 'success');
        break;
      }

      case 'reset-local': {
        openModal('تأكيد إعادة الضبط', `
          <p>سيتم حذف: الإعدادات المحفوظة، سجل الأسئلة المستخدمة، وسجل النتائج على هذا الجهاز.</p>
          <p><strong>لن يتأثر بنك الأسئلة الأصلي.</strong></p>
          <div class="row">
            <button type="button" class="btn btn--danger" id="confirmReset">نعم، أعد الضبط</button>
            <button type="button" class="btn btn--ghost" data-action="close-modal">إلغاء</button>
          </div>
        `);
        setTimeout(() => {
          $('#confirmReset')?.addEventListener('click', () => {
            S.resetAll();
            state.usage = {};
            state.usedTexts = new Set();
            state.settings = S.loadSettings();
            applySettingsToForm();
            renderBestScore();
            closeModal();
            toast('تمت إعادة ضبط البيانات المحلية.', 'success');
          }, { once: true });
        }, 0);
        break;
      }

      /* ---- داخل اللعب ---- */
      case 'reveal':
        if (!e) return;
        if (e.reveal().ok) { stopTimer(); renderGame(); }
        break;

      case 'judge-correct':
        afterMutation(e?.judge(true));
        break;

      case 'judge-wrong':
        afterMutation(e?.judge(false));
        break;

      case 'steal-correct':
        afterMutation(e?.judge(true));
        break;

      case 'steal-wrong':
        afterMutation(e?.judge(false));
        break;

      case 'choose':
        if (!e) return;
        afterMutation(e.choose(Number(target.dataset.index)));
        break;

      case 'fifty': {
        if (!e) return;
        const s = e.qState;
        const idx = e.mode === 'teams' ? (s.phase === 'steal' ? s.stealPlayer : e.turn) : 0;
        const res = e.useFifty(idx);
        if (res.ok) toast('حُذف خياران خاطئان.', 'success');
        afterMutation(res);
        break;
      }

      case 'swap': {
        if (!e) return;
        const s = e.qState;
        const idx = e.mode === 'teams' ? (s.phase === 'steal' ? s.stealPlayer : e.turn) : 0;
        const finder = makeSwapFinder(state.bank, {
          usedIds: new Set(Object.keys(state.usage)),
          usedTexts: state.usedTexts,
        });
        const res = e.useSwap(idx, finder);
        if (res.ok) {
          S.markQuestionsUsed([res.replacement.id]);
          state.usage = S.loadUsage();
          toast('تم تبديل السؤال بنجاح.', 'success');
          startTimer();
        }
        afterMutation(res);
        break;
      }

      case 'next': {
        if (!e) return;
        const res = e.next();
        if (!res.ok) { toast(res.reason, 'error'); return; }
        if (res.finished) { renderResults(); return; }
        renderGame();
        startTimer();
        break;
      }

      /* ---- النتائج ---- */
      case 'new-round':
        stopTimer();
        showScreen('screen-setup');
        renderCategoryPicker();
        break;

      case 'share':
        shareResult();
        break;

      case 'save-image':
        await saveResultImage();
        break;
    }
  });

  document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const mode = r.value;
      $('#teamFields').classList.toggle('hidden', mode !== 'teams');
      $('#fieldPlayer').classList.toggle('hidden', mode === 'teams');
    });
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });
}

/* ============================================================
   النتائج
   ============================================================ */
function renderResults() {
  const e = state.engine;
  if (!e) return;
  stopTimer();

  const summary = e.getSummary();
  state.lastRound = summary;

  /* حفظ النتيجة */
  const best = summary.players.reduce((a, b) => (b.score > a.score ? b : a), summary.players[0]);
  S.addResult({
    date: new Date().toISOString(),
    mode: summary.mode,
    bestName: best.name,
    bestScore: best.score,
    durationSec: summary.durationSec,
    textKeys: e.questions.map(q => q.textKey).filter(Boolean),
  });

  const title = summary.mode === 'teams'
    ? (summary.tie ? 'تعادل!' : `الفائز: ${summary.players[summary.winnerIndex].name}`)
    : `نتيجتك: ${summary.players[0].score} / ${MAX_SCORE}`;
  $('#resWinner').textContent = title;

  /* بطاقات النتائج */
  const scores = $('#resScores');
  scores.innerHTML = '';
  summary.players.forEach(p => {
    const pill = document.createElement('div');
    pill.className = 'result-pill';
    pill.textContent = `${p.name}:`;
    const strong = document.createElement('strong');
    strong.textContent = `${p.score}`;
    pill.appendChild(strong);
    scores.appendChild(pill);
  });

  /* إحصاءات عامة */
  const totalCorrect = summary.players.reduce((s, p) => s + p.correct, 0);
  const totalWrong = summary.players.reduce((s, p) => s + p.wrong, 0);
  const attempts = totalCorrect + totalWrong;
  $('#resCorrect').textContent = totalCorrect;
  $('#resWrong').textContent = totalWrong;
  $('#resRatio').textContent = attempts ? `${Math.round((totalCorrect / attempts) * 100)}%` : '—';
  $('#resDuration').textContent = fmtDuration(summary.durationSec);

  /* أفضل فئة */
  const catTotals = {};
  summary.players.forEach(p => {
    Object.entries(p.catPoints).forEach(([c, v]) => { catTotals[c] = (catTotals[c] || 0) + v; });
  });
  const bestCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  $('#resBestCat').textContent = bestCat ? `${categoryName(bestCat[0])} (${bestCat[1]})` : '—';

  /* النقاط بحسب المرحلة */
  const stagesBox = $('#resStages');
  stagesBox.innerHTML = '<h3>النقاط بحسب المرحلة</h3>';
  STAGE_DEFS.forEach(def => {
    const row = document.createElement('div');
    row.className = 'stage-row';
    const label = document.createElement('span');
    label.textContent = `${def.name} (${def.hint}) — ${def.points} × ${def.count}`;
    const value = document.createElement('strong');
    value.textContent = summary.players
      .map(p => `${p.name}: ${p.stagePoints[def.stage] || 0}`)
      .join(' · ');
    row.append(label, value);
    stagesBox.appendChild(row);
  });

  /* وسائل المساعدة */
  const lifeBox = $('#resLifelines');
  lifeBox.innerHTML = '<h3>وسائل المساعدة المستخدمة</h3>';
  const anyUsed = summary.players.some(p => p.lifelineLog.length > 0);
  if (!anyUsed) {
    lifeBox.innerHTML += '<p>لم تُستخدم أي وسيلة مساعدة في هذه الجولة.</p>';
  } else {
    summary.players.forEach(p => {
      if (!p.lifelineLog.length) return;
      const row = document.createElement('div');
      row.className = 'stage-row';
      const names = p.lifelineLog.map(l => (l.type === 'fifty' ? 'حذف إجابتين' : 'تبديل السؤال'));
      row.innerHTML = `<span>${p.name}</span><strong>${names.join(' · ')}</strong>`;
      lifeBox.appendChild(row);
    });
  }

  showScreen('screen-results');
}

function buildShareText() {
  const s = state.lastRound;
  if (!s) return '';
  if (s.mode === 'solo') {
    const p = s.players[0];
    return `🏆 تحدّي النخبة — ELITE CHALLENGE\n${p.name}: ${p.score} / ${MAX_SCORE} نقطة\n` +
           `صحيحة: ${p.correct} · خاطئة: ${p.wrong} · المدة: ${fmtDuration(s.durationSec)}`;
  }
  const lines = s.players.map(p => `${p.name}: ${p.score}`).join(' · ');
  return `🏆 تحدّي النخبة — ELITE CHALLENGE\n${lines}\nمن ${MAX_SCORE} نقطة · المدة: ${fmtDuration(s.durationSec)}`;
}

async function shareResult() {
  const text = buildShareText();
  if (!text) return;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'تحدّي النخبة', text, url: location.href });
      return;
    } catch { /* المستخدم ألغى المشاركة */ }
  }

  try {
    await navigator.clipboard.writeText(text + '\n' + location.href);
    toast('تم نسخ النتيجة إلى الحافظة.', 'success');
  } catch {
    openModal('نص المشاركة', `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>`);
  }
}

/* ============================================================
   حفظ صورة النتيجة (Canvas)
   ============================================================ */
async function saveResultImage() {
  const s = state.lastRound;
  if (!s) return;

  try {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    /* الخلفية */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a1020');
    grad.addColorStop(1, '#060a16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* إطار ذهبي */
    ctx.strokeStyle = 'rgba(212,175,55,.55)';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    /* الشعار (إن أمكن) */
    try {
      const img = await loadImage('assets/images/tahadi_ayham.png');
      const size = 220;
      ctx.drawImage(img, W / 2 - size / 2, 100, size, size);
    } catch {
      ctx.fillStyle = '#f2d27a';
      ctx.textAlign = 'center';
      ctx.font = '900 42px Tajawal, sans-serif';
      ctx.fillText('تحدّي النخبة', W / 2, 200);
    }

    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    ctx.fillStyle = '#f2d27a';
    ctx.font = '900 64px Tajawal, sans-serif';
    ctx.fillText('تحدّي النخبة', W / 2, 400);

    ctx.fillStyle = '#9fb0d0';
    ctx.font = '700 30px Tajawal, sans-serif';
    ctx.fillText('ELITE CHALLENGE', W / 2, 450);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px Tajawal, sans-serif';
    if (s.mode === 'solo') {
      const p = s.players[0];
      ctx.fillText(p.name, W / 2, 580);
      ctx.fillStyle = '#f2d27a';
      ctx.font = '900 96px Tajawal, sans-serif';
      ctx.fillText(`${p.score}`, W / 2, 700);
      ctx.fillStyle = '#9fb0d0';
      ctx.font = '700 34px Tajawal, sans-serif';
      ctx.fillText(`من ${MAX_SCORE} نقطة`, W / 2, 750);
      ctx.font = '500 32px Tajawal, sans-serif';
      ctx.fillText(`صحيحة: ${p.correct} · خاطئة: ${p.wrong}`, W / 2, 820);
    } else {
      s.players.forEach((p, i) => {
        const y = 600 + i * 140;
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 40px Tajawal, sans-serif';
        ctx.fillText(p.name, W / 2, y);
        ctx.fillStyle = '#f2d27a';
        ctx.font = '900 60px Tajawal, sans-serif';
        ctx.fillText(`${p.score}`, W / 2, y + 60);
      });
    }

    ctx.fillStyle = '#9fb0d0';
    ctx.font = '500 30px Tajawal, sans-serif';
    ctx.fillText(`المدة: ${fmtDuration(s.durationSec)}`, W / 2, H - 220);
    ctx.fillText(`أفضل فئة: ${$('#resBestCat').textContent}`, W / 2, H - 170);

    ctx.fillStyle = '#d4af37';
    ctx.font = '700 26px Tajawal, sans-serif';
    ctx.fillText('ELITE CHALLENGE', W / 2, H - 100);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `elite-challenge-result-${Date.now()}.png`;
    a.click();
    toast('تم حفظ صورة النتيجة.', 'success');
  } catch (err) {
    console.error(err);
    toast('تعذر إنشاء صورة النتيجة على هذا المتصفح. استخدم «مشاركة النتيجة» بدلًا منها.', 'error', 6000);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذر تحميل الصورة'));
    img.src = src;
  });
}

/* ============================================================
   نص المساعدة
   ============================================================ */
const HELP_HTML = `
  <p><strong>الهدف:</strong> 18 سؤالًا على 4 مراحل، والعلامة القصوى <strong>4000 نقطة</strong>.</p>
  <ul>
    <li><strong>المرحلة الأولى (1–6):</strong> أسئلة مفتوحة، يجيب الفريق شفهيًا، ويحكم المشرف بكشف الإجابة ثم «صحيحة/خاطئة».</li>
    <li><strong>المرحلة الثانية (7–12):</strong> أربعة خيارات، 200 نقطة، وتتوفر وسيلة «حذف إجابتين».</li>
    <li><strong>المرحلة الثالثة (13–16):</strong> 300 نقطة لكل سؤال، وتتوفر «حذف إجابتين» و«تبديل السؤال».</li>
    <li><strong>المرحلة النهائية (17–18):</strong> 500 نقطة لكل سؤال، بنفس الوسائل.</li>
  </ul>
  <p><strong>نمط الفريقين:</strong> يتناوب الفريقان، وإذا أخطأ الفريق صاحب الدور (أو انتهى وقته) يحصل المنافس على فرصة سرقة كامل نقاط السؤال.</p>
  <p><strong>الوسائل:</strong> كل فريق يملك وسائله الخاصة، وكل وسيلة تُستخدم مرة واحدة فقط في الجولة.</p>
  <p><strong>الخصوصية:</strong> لا حسابات ولا كلمات مرور. كل شيء يعمل في متصفحك، والبيانات محفوظة محليًا فقط.</p>
`;

/* ============================================================
   التشغيل
   ============================================================ */
init();