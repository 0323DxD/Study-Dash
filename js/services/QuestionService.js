/**
 * QuestionService.js
 * Full CRUD + search + game-utility service for Questions in STUDY DASH.
 * Depends on the DB module at ../db.js
 */

import DB from '../db.js';

const QuestionService = {

  /* ─────────────────────────── READ ─────────────────────────── */

  /** @returns {Promise<Array>} all questions */
  async getAllQuestions() {
    try {
      return await DB.getAll('questions');
    } catch (err) {
      console.error('[QuestionService] getAllQuestions failed:', err);
      return [];
    }
  },

  /**
   * @param {string|number} subjectId
   * @returns {Promise<Array>}
   */
  async getQuestionsBySubject(subjectId) {
    try {
      return await DB.getByIndex('questions', 'subjectId', subjectId);
    } catch (err) {
      console.error(`[QuestionService] getQuestionsBySubject(${subjectId}) failed:`, err);
      return [];
    }
  },

  /**
   * @param {string|number} lessonId
   * @returns {Promise<Array>}
   */
  async getQuestionsByLesson(lessonId) {
    try {
      return await DB.getByIndex('questions', 'lessonId', lessonId);
    } catch (err) {
      console.error(`[QuestionService] getQuestionsByLesson(${lessonId}) failed:`, err);
      return [];
    }
  },

  /**
   * Flexible multi-field filter.
   * @param {Object} filter
   * @param {string|number} [filter.subjectId]
   * @param {string|number} [filter.lessonId]
   * @param {string}        [filter.type]        — 'multiple_choice'|'true_false'|'fill_blank'|'ordering'
   * @param {string}        [filter.difficulty]  — 'easy'|'medium'|'hard'
   * @returns {Promise<Array>}
   */
  async getQuestionsByFilter({ subjectId, lessonId, type, difficulty } = {}) {
    try {
      let questions = await DB.getAll('questions');
      if (subjectId  != null) questions = questions.filter(q => q.subjectId  === subjectId);
      if (lessonId   != null) questions = questions.filter(q => q.lessonId   === lessonId);
      if (type       != null) questions = questions.filter(q => q.type       === type);
      if (difficulty != null) questions = questions.filter(q => q.difficulty === difficulty);
      return questions;
    } catch (err) {
      console.error('[QuestionService] getQuestionsByFilter failed:', err);
      return [];
    }
  },

  /**
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getQuestionById(id) {
    try {
      return await DB.getById('questions', id) ?? null;
    } catch (err) {
      console.error(`[QuestionService] getQuestionById(${id}) failed:`, err);
      return null;
    }
  },

  /* ─────────────────────────── WRITE ─────────────────────────── */

  /**
   * Creates a new question.
   *
   * Common fields:
   *   type        {string}  'multiple_choice' | 'true_false' | 'fill_blank' | 'ordering'
   *   question    {string}  the question text
   *   correctAnswer {string|string[]}
   *   explanation {string}
   *   difficulty  {string}  'easy' | 'medium' | 'hard'
   *   subjectId   {string|number}
   *   lessonId    {string|number}
   *
   * multiple_choice extras:
   *   choices     {Array<{label: string, text: string}>}
   *
   * ordering extras:
   *   items       {string[]}  items in correct order
   *
   * @param {Object} data
   * @returns {Promise<Object>} the new question
   */
  async createQuestion(data = {}) {
    if (!data.question || !data.question.trim()) {
      throw new Error('Question text is required.');
    }
    if (!data.type) throw new Error('Question type is required.');

    const question = {
      id: DB.generateId(),
      type:          data.type,
      question:      data.question.trim(),
      choices:       data.choices       ?? [],
      items:         data.items         ?? [],
      correctAnswer: data.correctAnswer ?? '',
      explanation:   data.explanation   ?? '',
      difficulty:    data.difficulty    ?? 'medium',
      subjectId:     data.subjectId     ?? null,
      lessonId:      data.lessonId      ?? null,
      tags:          data.tags          ?? [],
      timesAnswered: 0,
      timesCorrect:  0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await DB.put('questions', question);
      return question;
    } catch (err) {
      console.error('[QuestionService] createQuestion failed:', err);
      throw err;
    }
  },

  /**
   * Partially updates a question.
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateQuestion(id, data = {}) {
    try {
      const existing = await DB.getById('questions', id);
      if (!existing) throw new Error(`Question ${id} not found.`);
      const updated = { ...existing, ...data, id, updatedAt: Date.now() };
      await DB.put('questions', updated);
      return updated;
    } catch (err) {
      console.error(`[QuestionService] updateQuestion(${id}) failed:`, err);
      throw err;
    }
  },

  /**
   * Deletes a question.
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async deleteQuestion(id) {
    try {
      await DB.delete('questions', id);
      return true;
    } catch (err) {
      console.error(`[QuestionService] deleteQuestion(${id}) failed:`, err);
      return false;
    }
  },

  /**
   * Duplicates a question (new ID, resets stats).
   * @param {string|number} id
   * @returns {Promise<Object>} the duplicate
   */
  async duplicateQuestion(id) {
    try {
      const original = await DB.getById('questions', id);
      if (!original) throw new Error(`Question ${id} not found.`);
      const copy = {
        ...original,
        id:            DB.generateId(),
        question:      `${original.question} (copy)`,
        timesAnswered: 0,
        timesCorrect:  0,
        createdAt:     Date.now(),
        updatedAt:     Date.now(),
      };
      await DB.put('questions', copy);
      return copy;
    } catch (err) {
      console.error(`[QuestionService] duplicateQuestion(${id}) failed:`, err);
      throw err;
    }
  },

  /* ─────────────────────────── SEARCH ─────────────────────────── */

  /**
   * Full-text search over question text, explanation, and tags.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchQuestions(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    try {
      const all = await DB.getAll('questions');
      return all.filter(question => {
        const inText    = (question.question    ?? '').toLowerCase().includes(q);
        const inExplain = (question.explanation ?? '').toLowerCase().includes(q);
        const inTags    = (question.tags        ?? []).some(t => t.toLowerCase().includes(q));
        const inChoices = (question.choices     ?? []).some(c =>
          (c.text ?? '').toLowerCase().includes(q)
        );
        return inText || inExplain || inTags || inChoices;
      });
    } catch (err) {
      console.error('[QuestionService] searchQuestions failed:', err);
      return [];
    }
  },

  /* ─────────────────────────── GAME HELPERS ─────────────────────────── */

  /**
   * Returns `count` random questions, optionally filtered.
   * @param {number} count
   * @param {Object} [filter]  — same shape as getQuestionsByFilter
   * @returns {Promise<Array>}
   */
  async getRandomQuestions(count = 10, filter = {}) {
    try {
      let pool = Object.keys(filter).length
        ? await this.getQuestionsByFilter(filter)
        : await DB.getAll('questions');

      // Fisher-Yates shuffle then slice
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, count);
    } catch (err) {
      console.error('[QuestionService] getRandomQuestions failed:', err);
      return [];
    }
  },

  /**
   * Returns questions with the highest mistake rate (most missed).
   * @param {number} count
   * @returns {Promise<Array>}
   */
  async getWeakQuestions(count = 10) {
    try {
      const all = await DB.getAll('questions');
      const withMistakeRate = all
        .filter(q => q.timesAnswered > 0)
        .map(q => ({
          ...q,
          mistakeRate: 1 - (q.timesCorrect / q.timesAnswered),
        }))
        .sort((a, b) => b.mistakeRate - a.mistakeRate);

      // Also include questions never answered
      const neverAnswered = all.filter(q => q.timesAnswered === 0);
      const combined = [...withMistakeRate, ...neverAnswered];
      return combined.slice(0, count);
    } catch (err) {
      console.error('[QuestionService] getWeakQuestions failed:', err);
      return [];
    }
  },
};

export default QuestionService;
