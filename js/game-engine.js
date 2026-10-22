/* ============================================================
   game-engine.js — محرك الجولة: النقاط، الأدوار، السرقة، الوسائل
   لا يتعامل هذا الملف مع DOM إطلاقًا.
   ============================================================ */

import { STAGE_DEFS, MAX_SCORE } from './question-bank.js';

const FIFTY_MIN_STAGE = 2;
const SWAP_MIN_STAGE = 3;

function createPlayer(name) {
  return {
    name,
    score: 0,
    correct: 0,
    wrong: 0,
    stagePoints: { 1: 0, 2: 0, 3: 0, 4: 0 },
    catPoints: {},
    lifelines: { fifty: true, swap: true },
    lifelineLog: [],
  };
}

export class GameEngine {
  constructor({ mode = 'solo', players = [], timer = { enabled: false, seconds: 45 }, questions = [] }) {
    if (!Array.isArray(questions) || questions.length !== 18) {
      throw new Error('يجب أن تحتوي الجولة على 18 سؤالًا بالضبط.');
    }
    this.mode = mode;
    this.players = players.map(p => createPlayer(p.name));
    this.timer = { enabled: !!timer.enabled, seconds: Math.max(10, Number(timer.seconds) || 45) };
    this.questions = questions.map(q => ({ ...q, resolved: false, winner: null }));
    this.index = 0;
    this.turn = 0;
    this.startedAt = Date.now();
    this.qState = null;
    this._beginQuestion();
  }

  /* ---------- الوصول للحالة ---------- */
  get current() { return this.questions[this.index] || null; }
  get currentPlayer() { return this.players[this.turn]; }
  get isFinished() { return this.index >= this.questions.length; }

  _beginQuestion() {
    const q = this.current;
    if (!q) { this.qState = null; return; }
    this.qState = {
      revealed: false,
      phase: 'primary',       // primary | steal | done
      stealPlayer: null,
      answered: false,
      resolved: false,
      removedOptions: [],
      fiftyUsedBy: null,
      timedOut: false,
      selection: null,        // فهرس اختيار الفريق الأساسي
      stealSelection: null,
    };
  }

  /* ---------- كشف الإجابة (المرحلة الأولى) ---------- */
  reveal() {
    const s = this.qState;
    if (!s || s.resolved || s.revealed) return { ok: false, reason: 'لا يمكن كشف الإجابة الآن.' };
    s.revealed = true;
    return { ok: true };
  }

  /* ---------- الحكم اليدوي (المرحلة الأولى) ---------- */
  judge(correct) {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return { ok: false, reason: 'السؤال محسوم مسبقًا.' };
    if (q.stage !== 1) return { ok: false, reason: 'الحكم اليدوي متاح في المرحلة الأولى فقط.' };

    if (s.phase === 'primary') {
      if (!s.revealed) return { ok: false, reason: 'اكشف الإجابة أولًا.' };
      if (correct) {
        this._resolve(this.turn);
        return { ok: true, resolved: true, correct: true };
      }
      this._markWrong(this.turn);
      if (this.mode === 'teams') {
        s.phase = 'steal';
        s.stealPlayer = 1 - this.turn;
        return { ok: true, steal: true, correct: false };
      }
      this._resolve(null);
      return { ok: true, resolved: true, correct: false };
    }

    if (s.phase === 'steal') {
      if (correct) {
        this._resolve(s.stealPlayer);
        return { ok: true, resolved: true, correct: true };
      }
      this._markWrong(s.stealPlayer);
      this._resolve(null);
      return { ok: true, resolved: true, correct: false };
    }

    return { ok: false, reason: 'حالة غير صالحة.' };
  }

  /* ---------- اختيار خيار (المرحلة الثانية وما بعدها) ---------- */
  choose(optionIndex) {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return { ok: false, reason: 'السؤال محسوم مسبقًا.' };
    if (q.type !== 'mcq') return { ok: false, reason: 'هذا السؤال لا يحتوي خيارات.' };
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= q.options.length) {
      return { ok: false, reason: 'خيار غير صالح.' };
    }
    if (s.removedOptions.includes(optionIndex)) {
      return { ok: false, reason: 'هذا الخيار محذوف بوسيلة المساعدة.' };
    }

    const isCorrect = optionIndex === q.options.indexOf(q.correctAnswer);

    if (s.phase === 'primary') {
      if (s.selection !== null) return { ok: false, reason: 'تم تثبيت إجابتك مسبقًا.' };
      s.selection = optionIndex;
      s.answered = true;
      if (isCorrect) {
        this._resolve(this.turn);
        return { ok: true, resolved: true, correct: true };
      }
      this._markWrong(this.turn);
      if (this.mode === 'teams') {
        s.phase = 'steal';
        s.stealPlayer = 1 - this.turn;
        return { ok: true, steal: true, correct: false };
      }
      this._resolve(null);
      return { ok: true, resolved: true, correct: false };
    }

    if (s.phase === 'steal') {
      if (s.stealSelection !== null) return { ok: false, reason: 'تم تثبيت إجابة السرقة.' };
      s.stealSelection = optionIndex;
      if (isCorrect) {
        this._resolve(s.stealPlayer);
        return { ok: true, resolved: true, correct: true };
      }
      this._markWrong(s.stealPlayer);
      this._resolve(null);
      return { ok: true, resolved: true, correct: false };
    }

    return { ok: false, reason: 'حالة غير صالحة.' };
  }

  /* ---------- انتهاء الوقت ---------- */
  timeout() {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return { ok: false, reason: 'السؤال محسوم مسبقًا.' };

    s.timedOut = true;

    if (s.phase === 'primary') {
      this._markWrong(this.turn);
      if (this.mode === 'teams') {
        s.phase = 'steal';
        s.stealPlayer = 1 - this.turn;
        s.revealed = false; // لا نكشف قبل منح فرصة السرقة
        return { ok: true, steal: true, timeout: true };
      }
      this._resolve(null);
      return { ok: true, resolved: true, timeout: true };
    }

    if (s.phase === 'steal') {
      this._markWrong(s.stealPlayer);
      this._resolve(null);
      return { ok: true, resolved: true, timeout: true };
    }

    return { ok: false, reason: 'حالة غير صالحة.' };
  }

  /* ---------- وسيلة: حذف إجابتين ---------- */
  canUseFifty(playerIndex) {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return false;
    if (q.stage < FIFTY_MIN_STAGE) return false;
    if (q.type !== 'mcq') return false;
    if (s.removedOptions.length > 0) return false;
    const active = s.phase === 'steal' ? s.stealPlayer : this.turn;
    if (active !== playerIndex) return false;
    return !!this.players[playerIndex]?.lifelines.fifty;
  }

  useFifty(playerIndex) {
    if (!this.canUseFifty(playerIndex)) {
      return { ok: false, reason: 'لا يمكن استخدام «حذف إجابتين» الآن.' };
    }
    const q = this.current;
    const s = this.qState;
    const correctIdx = q.options.indexOf(q.correctAnswer);
    const wrongIdx = q.options.map((_, i) => i).filter(i => i !== correctIdx);
    // حذف خيارين خاطئين عشوائيًا
    for (let i = wrongIdx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongIdx[i], wrongIdx[j]] = [wrongIdx[j], wrongIdx[i]];
    }
    s.removedOptions = wrongIdx.slice(0, 2);
    s.fiftyUsedBy = playerIndex;
    this.players[playerIndex].lifelines.fifty = false;
    this.players[playerIndex].lifelineLog.push({ type: 'fifty', questionId: q.id, at: Date.now() });
    return { ok: true, removed: s.removedOptions.slice() };
  }

  /* ---------- وسيلة: تبديل السؤال ---------- */
  canUseSwap(playerIndex) {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return false;
    if (q.stage < SWAP_MIN_STAGE) return false;
    if (s.phase !== 'primary') return false;
    if (s.answered || s.selection !== null) return false;
    if (s.revealed) return false;
    return !!this.players[playerIndex]?.lifelines.swap;
  }

  useSwap(playerIndex, finder) {
    if (!this.canUseSwap(playerIndex)) {
      return { ok: false, reason: 'لا يمكن استخدام «تبديل السؤال» الآن.' };
    }
    const old = this.current;
    const inRound = new Set(this.questions.map(q => q.id));
    const replacement = finder(old, inRound);

    if (!replacement) {
      return {
        ok: false,
        reason: 'لا يوجد سؤال بديل من الفئة نفسها وبنفس درجة الصعوبة وغير مستخدم في هذه الجولة. لم تُخصم الوسيلة ولم يتغير السؤال.',
      };
    }

    replacement.swappedFrom = old.id;
    this.players[playerIndex].lifelines.swap = false;
    this.players[playerIndex].lifelineLog.push({
      type: 'swap', from: old.id, to: replacement.id, at: Date.now(),
    });

    this.questions[this.index] = replacement;
    this._beginQuestion();
    return { ok: true, replacement };
  }

  /* ---------- الانتقال للسؤال التالي ---------- */
  next() {
    if (!this.qState || !this.qState.resolved) return { ok: false, reason: 'لم يُحسم السؤال بعد.' };
    if (this.mode === 'teams') this.turn = 1 - this.turn;
    this.index += 1;
    this._beginQuestion();
    return { ok: true, finished: this.isFinished };
  }

  /* ---------- داخلي ---------- */
  _award(playerIndex, question) {
    const p = this.players[playerIndex];
    p.score += question.points;
    p.correct += 1;
    p.stagePoints[question.stage] = (p.stagePoints[question.stage] || 0) + question.points;
    p.catPoints[question.category] = (p.catPoints[question.category] || 0) + question.points;
  }

  _markWrong(playerIndex) {
    this.players[playerIndex].wrong += 1;
  }

  _resolve(winnerIndex) {
    const q = this.current;
    const s = this.qState;
    if (!q || !s || s.resolved) return;
    s.resolved = true;
    s.phase = 'done';
    q.resolved = true;
    q.winner = winnerIndex ?? null;
    if (winnerIndex !== null && winnerIndex !== undefined) {
      this._award(winnerIndex, q);
    }
  }

  /* ---------- الملخص النهائي ---------- */
  getSummary() {
    const durationSec = Math.round((Date.now() - this.startedAt) / 1000);
    const players = this.players.map((p, i) => ({
      index: i,
      name: p.name,
      score: p.score,
      correct: p.correct,
      wrong: p.wrong,
      stagePoints: { ...p.stagePoints },
      catPoints: { ...p.catPoints },
      lifelineLog: p.lifelineLog.slice(),
      lifelinesLeft: { ...p.lifelines },
    }));

    let winnerIndex = 0;
    players.forEach((p, i) => { if (p.score > players[winnerIndex].score) winnerIndex = i; });
    const tie = players.length > 1 && players.every(p => p.score === players[winnerIndex].score);

    return {
      mode: this.mode,
      durationSec,
      players,
      winnerIndex,
      tie,
      totalQuestions: this.questions.length,
      maxScore: MAX_SCORE,
      questions: this.questions.map(q => ({
        id: q.id, stage: q.stage, category: q.category, points: q.points,
        resolved: q.resolved, winner: q.winner,
      })),
    };
  }
}

export { STAGE_DEFS, MAX_SCORE };