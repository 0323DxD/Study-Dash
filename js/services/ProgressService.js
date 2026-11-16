/**
 * ProgressService.js
 * Tracks all player progress, stats, streaks, achievements, and game sessions.
 * Depends on the DB module at ../db.js
 */

import DB from '../db.js';

// ── Default player progress shape ─────────────────────────────────────────────
const DEFAULT_PROGRESS = {
  id:            'player',
  coins:         0,
  totalAnswered: 0,
  correct:       0,
  incorrect:     0,
  streak:        0,
  bestStreak:    0,
  bestScore:     0,
  playTime:      0,          // seconds
  achievements:  [],
  answerLog:     [],         // { questionId, correct, timeSpent, mode, timestamp }
  mistakeLog:    [],         // { questionId, timestamp, subjectId, lessonId }
  gameSessions:  [],         // { id, score, coins, mode, answers, timestamp }
};

// ── Achievement definitions ───────────────────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_answer',   label: 'First Answer',    desc: 'Answer your first question',          check: p => p.totalAnswered >= 1    },
  { id: 'ten_correct',    label: 'On a Roll',        desc: 'Get 10 correct answers',              check: p => p.correct >= 10         },
  { id: 'fifty_correct',  label: 'Scholar',          desc: 'Get 50 correct answers',              check: p => p.correct >= 50         },
  { id: 'hundred_correct',label: 'Centurion',        desc: 'Get 100 correct answers',             check: p => p.correct >= 100        },
  { id: 'streak_5',       label: 'Hot Streak',       desc: 'Reach a 5-answer streak',             check: p => p.bestStreak >= 5       },
  { id: 'streak_10',      label: 'On Fire 🔥',       desc: 'Reach a 10-answer streak',            check: p => p.bestStreak >= 10      },
  { id: 'streak_25',      label: 'Unstoppable',      desc: 'Reach a 25-answer streak',            check: p => p.bestStreak >= 25      },
  { id: 'coins_100',      label: 'Coin Collector',   desc: 'Accumulate 100 coins',                check: p => p.coins >= 100          },
  { id: 'coins_1000',     label: 'Wealthy Scholar',  desc: 'Accumulate 1,000 coins',              check: p => p.coins >= 1000         },
  { id: 'perfect_game',   label: 'Perfect Run',      desc: 'Complete a session with 100% accuracy',
    check: p => (p.gameSessions ?? []).some(s => s.total > 0 && s.correct === s.total)            },
];

const ProgressService = {

  /* ─────────────────── READ ─────────────────── */

  /**
   * Returns the full player progress record.
   * Creates a default one if it doesn't exist yet.
   * @returns {Promise<Object>}
   */
  async getPlayerProgress() {
    try {
      const existing = await DB.getById('progress', 'player');
      if (existing) return existing;
      // First run — seed defaults
      await DB.put('progress', { ...DEFAULT_PROGRESS });
      return { ...DEFAULT_PROGRESS };
    } catch (err) {
      console.error('[ProgressService] getPlayerProgress failed:', err);
      return { ...DEFAULT_PROGRESS };
    }
  },

  /* ─────────────────── WRITE ─────────────────── */

  /**
   * Partial update — merges data into existing progress.
   * @param {Object} data
   * @returns {Promise<Object>} updated progress
   */
  async updateProgress(data = {}) {
    try {
      const existing = await this.getPlayerProgress();
      const updated  = { ...existing, ...data, id: 'player' };
      await DB.put('progress', updated);
      return updated;
    } catch (err) {
      console.error('[ProgressService] updateProgress failed:', err);
      throw err;
    }
  },

  /**
   * Adds coins to the player balance.
   * @param {number} amount
   * @returns {Promise<number>} new coin total
   */
  async addCoins(amount) {
    if (amount <= 0) return (await this.getPlayerProgress()).coins;
    try {
      const p = await this.getPlayerProgress();
      const updated = await this.updateProgress({ coins: p.coins + amount });
      return updated.coins;
    } catch (err) {
      console.error('[ProgressService] addCoins failed:', err);
      throw err;
    }
  },

  /**
   * Spends coins. Throws if insufficient balance.
   * @param {number} amount
   * @returns {Promise<number>} new coin total
   */
  async spendCoins(amount) {
    if (amount <= 0) return (await this.getPlayerProgress()).coins;
    try {
      const p = await this.getPlayerProgress();
      if (p.coins < amount) throw new Error(`Insufficient coins. Have ${p.coins}, need ${amount}.`);
      const updated = await this.updateProgress({ coins: p.coins - amount });
      return updated.coins;
    } catch (err) {
      console.error('[ProgressService] spendCoins failed:', err);
      throw err;
    }
  },

  /* ─────────────────── ANSWER TRACKING ─────────────────── */

  /**
   * Records a single answer event.
   * Updates totals, streak, and mistake log.
   * @param {Object} opts
   * @param {string|number} opts.questionId
   * @param {boolean}       opts.correct
   * @param {number}        [opts.timeSpent]  — ms
   * @param {string}        [opts.mode]       — game mode string
   * @returns {Promise<Object>} updated progress
   */
  async recordAnswer({ questionId, correct, timeSpent = 0, mode = 'free' } = {}) {
    try {
      const p = await this.getPlayerProgress();

      const entry = {
        questionId,
        correct: Boolean(correct),
        timeSpent,
        mode,
        timestamp: Date.now(),
      };

      const answerLog = [...(p.answerLog ?? []), entry];

      const totalAnswered = p.totalAnswered + 1;
      const correctCount  = p.correct   + (correct ? 1 : 0);
      const incorrectCount = p.incorrect + (correct ? 0 : 1);

      // Streak
      const streak    = correct ? p.streak + 1 : 0;
      const bestStreak = Math.max(p.bestStreak ?? 0, streak);

      // Mistake log
      let mistakeLog = [...(p.mistakeLog ?? [])];
      if (!correct) {
        // Avoid duplicate entries — just update timestamp
        mistakeLog = mistakeLog.filter(m => m.questionId !== questionId);
        mistakeLog.push({ questionId, timestamp: Date.now() });
      } else {
        // Clear from mistake log on correct answer (optional behaviour)
        // Comment out the next line to retain mistake until manually cleared
        mistakeLog = mistakeLog.filter(m => m.questionId !== questionId);
      }

      // Coin reward for correct answer
      const coinsEarned = correct ? 1 : 0;

      // Update question stats in questions store
      this._updateQuestionStats(questionId, correct).catch(() => {});

      const updated = await this.updateProgress({
        totalAnswered,
        correct:    correctCount,
        incorrect:  incorrectCount,
        streak,
        bestStreak,
        coins:      p.coins + coinsEarned,
        answerLog,
        mistakeLog,
      });

      return updated;
    } catch (err) {
      console.error('[ProgressService] recordAnswer failed:', err);
      throw err;
    }
  },

  /** Internal: bump timesAnswered / timesCorrect on the question record. */
  async _updateQuestionStats(questionId, correct) {
    try {
      const q = await DB.getById('questions', questionId);
      if (!q) return;
      await DB.put('questions', {
        ...q,
        timesAnswered: (q.timesAnswered ?? 0) + 1,
        timesCorrect:  (q.timesCorrect  ?? 0) + (correct ? 1 : 0),
        updatedAt:     Date.now(),
      });
    } catch (_) { /* non-critical */ }
  },

  /* ─────────────────── MISTAKE LOG ─────────────────── */

  /**
   * Returns all entries in the mistake log with their question records.
   * @returns {Promise<Array<{ questionId, timestamp, question: Object|null }>>}
   */
  async getMistakes() {
    try {
      const p = await this.getPlayerProgress();
      const log = p.mistakeLog ?? [];
      const enriched = await Promise.all(log.map(async entry => ({
        ...entry,
        question: await DB.getById('questions', entry.questionId).catch(() => null),
      })));
      return enriched;
    } catch (err) {
      console.error('[ProgressService] getMistakes failed:', err);
      return [];
    }
  },

  /**
   * Returns mistake log entries for a specific subject.
   * @param {string|number} subjectId
   * @returns {Promise<Array>}
   */
  async getMistakesBySubject(subjectId) {
    try {
      const all = await this.getMistakes();
      return all.filter(m => m.question?.subjectId === subjectId);
    } catch (err) {
      console.error(`[ProgressService] getMistakesBySubject(${subjectId}) failed:`, err);
      return [];
    }
  },

  /**
   * Removes a question from the mistake log.
   * @param {string|number} questionId
   * @returns {Promise<void>}
   */
  async clearMistake(questionId) {
    try {
      const p = await this.getPlayerProgress();
      const mistakeLog = (p.mistakeLog ?? []).filter(m => m.questionId !== questionId);
      await this.updateProgress({ mistakeLog });
    } catch (err) {
      console.error(`[ProgressService] clearMistake(${questionId}) failed:`, err);
      throw err;
    }
  },

  /* ─────────────────── ACCURACY ─────────────────── */

  /**
   * Returns accuracy percentage, optionally filtered by subject/lesson/mode.
   * @param {Object} [filter]
   * @param {string|number} [filter.subjectId]
   * @param {string|number} [filter.lessonId]
   * @param {string}        [filter.mode]
   * @returns {Promise<number>} 0–100
   */
  async getAccuracy(filter = {}) {
    try {
      const p   = await this.getPlayerProgress();
      let   log = p.answerLog ?? [];

      if (filter.mode      != null) log = log.filter(e => e.mode === filter.mode);

      // Filter by subject or lesson requires joining with questions
      if (filter.subjectId != null || filter.lessonId != null) {
        const allQ     = await DB.getAll('questions');
        const qMap     = new Map(allQ.map(q => [q.id, q]));
        log = log.filter(e => {
          const q = qMap.get(e.questionId);
          if (!q) return false;
          if (filter.subjectId != null && q.subjectId !== filter.subjectId) return false;
          if (filter.lessonId  != null && q.lessonId  !== filter.lessonId)  return false;
          return true;
        });
      }

      if (log.length === 0) return 0;
      const correct = log.filter(e => e.correct).length;
      return Math.round((correct / log.length) * 100);
    } catch (err) {
      console.error('[ProgressService] getAccuracy failed:', err);
      return 0;
    }
  },

  /* ─────────────────── STREAK ─────────────────── */

  /** @returns {Promise<number>} current streak */
  async getStreak() {
    try {
      const p = await this.getPlayerProgress();
      return p.streak ?? 0;
    } catch (err) {
      console.error('[ProgressService] getStreak failed:', err);
      return 0;
    }
  },

  /**
   * Updates the streak based on whether the last answer was correct.
   * @param {boolean} correct
   * @returns {Promise<{ streak: number, bestStreak: number }>}
   */
  async updateStreak(correct) {
    try {
      const p = await this.getPlayerProgress();
      const streak     = correct ? p.streak + 1 : 0;
      const bestStreak = Math.max(p.bestStreak ?? 0, streak);
      await this.updateProgress({ streak, bestStreak });
      return { streak, bestStreak };
    } catch (err) {
      console.error('[ProgressService] updateStreak failed:', err);
      throw err;
    }
  },

  /* ─────────────────── SESSIONS ─────────────────── */

  /**
   * Returns the most recent N game sessions.
   * @param {number} count
   * @returns {Promise<Array>}
   */
  async getRecentSessions(count = 5) {
    try {
      const p = await this.getPlayerProgress();
      const sessions = (p.gameSessions ?? [])
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp);
      return sessions.slice(0, count);
    } catch (err) {
      console.error('[ProgressService] getRecentSessions failed:', err);
      return [];
    }
  },

  /**
   * Saves a completed game session.
   * @param {Object} sessionData
   * @param {string} sessionData.mode
   * @param {number} sessionData.score
   * @param {number} sessionData.coins
   * @param {number} sessionData.correct
   * @param {number} sessionData.total
   * @param {Array}  [sessionData.answers]  — array of { questionId, correct }
   * @returns {Promise<Object>} the saved session
   */
  async saveGameSession(sessionData = {}) {
    try {
      const p = await this.getPlayerProgress();
      const session = {
        id:        DB.generateId(),
        mode:      sessionData.mode      ?? 'unknown',
        score:     sessionData.score     ?? 0,
        coins:     sessionData.coins     ?? 0,
        correct:   sessionData.correct   ?? 0,
        total:     sessionData.total     ?? 0,
        answers:   sessionData.answers   ?? [],
        subjectId: sessionData.subjectId ?? null,
        lessonId:  sessionData.lessonId  ?? null,
        timestamp: Date.now(),
      };

      const gameSessions = [...(p.gameSessions ?? []), session];
      const bestScore    = Math.max(p.bestScore ?? 0, session.score);

      await this.updateProgress({
        gameSessions,
        bestScore,
        coins: p.coins + (session.coins ?? 0),
      });

      // Check achievements after session
      await this.getAchievements();

      return session;
    } catch (err) {
      console.error('[ProgressService] saveGameSession failed:', err);
      throw err;
    }
  },

  /* ─────────────────── ACHIEVEMENTS ─────────────────── */

  /**
   * Checks all achievement conditions and awards any newly earned ones.
   * @returns {Promise<{ earned: Array, all: Array }>}
   */
  async getAchievements() {
    try {
      const p = await this.getPlayerProgress();
      const earnedIds = new Set(p.achievements ?? []);
      const newlyEarned = [];

      for (const def of ACHIEVEMENT_DEFS) {
        if (!earnedIds.has(def.id) && def.check(p)) {
          earnedIds.add(def.id);
          newlyEarned.push(def);
        }
      }

      if (newlyEarned.length > 0) {
        await this.updateProgress({ achievements: [...earnedIds] });
      }

      return {
        earned: [...earnedIds].map(id => ACHIEVEMENT_DEFS.find(d => d.id === id)).filter(Boolean),
        newlyEarned,
        all:    ACHIEVEMENT_DEFS.map(d => ({ ...d, earned: earnedIds.has(d.id) })),
      };
    } catch (err) {
      console.error('[ProgressService] getAchievements failed:', err);
      return { earned: [], newlyEarned: [], all: ACHIEVEMENT_DEFS.map(d => ({ ...d, earned: false })) };
    }
  },
};

export default ProgressService;
