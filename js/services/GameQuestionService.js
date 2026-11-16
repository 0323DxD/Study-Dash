/**
 * GameQuestionService.js — Feeds learning questions directly into gameplay.
 * Dynamically queries IndexedDB so any user-created lesson/question is instantly available.
 */

import { DB } from '../db.js';
import { State } from '../state.js';

export const GameQuestionService = {

  /**
   * Shuffles an array in-place using Fisher-Yates algorithm.
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /**
   * Formats a raw database question record into standardized game format.
   */
  formatForGame(rawQ) {
    if (!rawQ) return null;
    const type = rawQ.type || 'mcq';
    const text = rawQ.text || rawQ.question || 'Question';
    const explanation = rawQ.explanation || 'No explanation provided.';

    let choices = [];
    let correctValue = null;

    if (type === 'mcq') {
      const opts = Array.isArray(rawQ.options) ? rawQ.options : ['Option A', 'Option B', 'Option C', 'Option D'];
      choices = opts.map((opt, idx) => ({
        id: idx,
        text: String(opt),
        isCorrect: idx === rawQ.correctIndex
      }));
      correctValue = rawQ.correctIndex;
    } else if (type === 'truefalse') {
      choices = [
        { id: 'true', text: 'True', isCorrect: rawQ.correct === true },
        { id: 'false', text: 'False', isCorrect: rawQ.correct === false }
      ];
      correctValue = rawQ.correct;
    } else if (type === 'identification') {
      // In game runner, identification questions present the correct answer + 3 plausible distractors
      const correctAns = String(rawQ.correct || 'Answer').trim();
      const pool = ['Protocol', 'Network', 'Router', 'Firewall', 'Segment', 'Encryption', 'Cache', 'Switch', 'Address'];
      const distractors = pool.filter(p => p.toLowerCase() !== correctAns.toLowerCase()).slice(0, 3);
      const all = this.shuffle([correctAns, ...distractors]);
      choices = all.map((c, i) => ({
        id: i,
        text: c,
        isCorrect: c.toLowerCase() === correctAns.toLowerCase()
      }));
      correctValue = correctAns;
    }

    return {
      id: rawQ.id,
      subjectId: rawQ.subjectId,
      lessonId: rawQ.lessonId,
      type,
      difficulty: rawQ.difficulty || 'medium',
      text,
      choices,
      correctValue,
      explanation,
      points: rawQ.points || 10
    };
  },

  /**
   * Fetches and prepares questions for a game session based on mode and optional filter.
   * @param {'endless'|'exam'|'study'|'timeAttack'|'custom'|'mistakes'} mode
   * @param {Object} filter - { subjectId, lessonId, difficulty, count }
   * @returns {Promise<Array>} List of formatted questions
   */
  async getQuestionsForGame(mode = 'endless', filter = {}) {
    let questions = await DB.getAll('questions');

    // 1. If Mistake Review mode: get questions logged as mistakes
    if (mode === 'mistakes' || mode === 'mistakeReview') {
      const mistakeLogs = await DB.getAll('mistakeLog');
      const mistakeQIds = new Set(mistakeLogs.map(m => m.questionId));
      const mistakesFound = questions.filter(q => mistakeQIds.has(q.id));
      if (mistakesFound.length > 0) {
        questions = mistakesFound;
      }
    }

    // 2. Apply filters (subject, lesson, difficulty)
    if (filter.subjectId) {
      questions = questions.filter(q => q.subjectId === filter.subjectId);
    }
    if (filter.lessonId) {
      questions = questions.filter(q => q.lessonId === filter.lessonId);
    }
    if (filter.difficulty) {
      questions = questions.filter(q => q.difficulty === filter.difficulty);
    }

    // Fallback if no questions found under specific filter
    if (questions.length === 0) {
      questions = await DB.getAll('questions');
    }

    // 3. Shuffle questions
    const shuffled = this.shuffle(questions);

    // 4. Limit count if requested
    const count = filter.count || (mode === 'exam' ? 15 : mode === 'timeAttack' ? 30 : 50);
    const selected = shuffled.slice(0, count);

    return selected.map(q => this.formatForGame(q));
  },

  /**
   * Records an answer outcome in progress and mistake log.
   */
  async recordAnswer(questionId, isCorrect, mode = 'game') {
    try {
      // 1. Update overall player progress in State and DB
      const currentProgress = State.get('playerProgress') || {};
      const newTotal = (currentProgress.totalAnswered || 0) + 1;
      const newCorrect = (currentProgress.correct || 0) + (isCorrect ? 1 : 0);
      const newStreak = isCorrect ? (currentProgress.streak || 0) + 1 : 0;
      const bestStreak = Math.max(newStreak, currentProgress.bestStreak || 0);
      const coinsEarned = isCorrect ? 3 : 0;
      const newCoins = (currentProgress.coins || 0) + coinsEarned;

      const updatedProgress = {
        ...currentProgress,
        key: 'main',
        totalAnswered: newTotal,
        correct: newCorrect,
        streak: newStreak,
        bestStreak: bestStreak,
        coins: newCoins,
        lastPlayDate: new Date().toISOString()
      };

      await DB.put('playerProgress', updatedProgress);
      State.setState({ playerProgress: updatedProgress });

      // 2. Manage Mistake Log
      if (!isCorrect) {
        await DB.add('mistakeLog', {
          questionId,
          mode,
          timestamp: new Date().toISOString()
        });
      } else {
        // If answered correctly in mistake review mode, clear mistake entries for this question
        if (mode === 'mistakes' || mode === 'mistakeReview') {
          const allMistakes = await DB.getAll('mistakeLog');
          for (const m of allMistakes) {
            if (m.questionId === questionId) {
              await DB.delete('mistakeLog', m.id);
            }
          }
        }
      }

      return { coinsEarned, streak: newStreak };
    } catch (err) {
      console.error('[GameQuestionService] recordAnswer failed:', err);
    }
  }
};

export default GameQuestionService;

