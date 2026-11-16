/**
 * LessonService.js
 * CRUD + search service for Lessons in STUDY DASH.
 * Depends on the DB module at ../db.js
 */

import DB from '../db.js';

const LessonService = {

  /**
   * Returns all lessons.
   * @returns {Promise<Array>}
   */
  async getAllLessons() {
    try {
      return await DB.getAll('lessons');
    } catch (err) {
      console.error('[LessonService] getAllLessons failed:', err);
      return [];
    }
  },

  /**
   * Returns all lessons belonging to a subject.
   * @param {string|number} subjectId
   * @returns {Promise<Array>}
   */
  async getLessonsBySubject(subjectId) {
    try {
      return await DB.getByIndex('lessons', 'subjectId', subjectId);
    } catch (err) {
      console.error(`[LessonService] getLessonsBySubject(${subjectId}) failed:`, err);
      return [];
    }
  },

  /**
   * Returns a single lesson by ID.
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getLessonById(id) {
    try {
      return await DB.getById('lessons', id) ?? null;
    } catch (err) {
      console.error(`[LessonService] getLessonById(${id}) failed:`, err);
      return null;
    }
  },

  /**
   * Creates a new lesson.
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string|number} opts.subjectId
   * @param {string} [opts.description]
   * @param {string[]} [opts.objectives]  — learning objectives array
   * @param {string} [opts.content]       — rich text / markdown body
   * @param {string[]} [opts.topics]      — topic tags
   * @returns {Promise<Object>} the new lesson record
   */
  async createLesson({ title, subjectId, description = '', objectives = [], content = '', topics = [] }) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new Error('Lesson title is required.');
    }
    if (!subjectId) throw new Error('subjectId is required for a lesson.');

    const lesson = {
      id: DB.generateId(),
      title: title.trim(),
      subjectId,
      description: description.trim(),
      objectives: Array.isArray(objectives) ? objectives : [],
      content,
      topics: Array.isArray(topics) ? topics : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await DB.put('lessons', lesson);
      return lesson;
    } catch (err) {
      console.error('[LessonService] createLesson failed:', err);
      throw err;
    }
  },

  /**
   * Partially updates a lesson.
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateLesson(id, data = {}) {
    try {
      const existing = await DB.getById('lessons', id);
      if (!existing) throw new Error(`Lesson ${id} not found.`);
      const updated = {
        ...existing,
        ...data,
        id,
        updatedAt: Date.now(),
      };
      await DB.put('lessons', updated);
      return updated;
    } catch (err) {
      console.error(`[LessonService] updateLesson(${id}) failed:`, err);
      throw err;
    }
  },

  /**
   * Deletes a lesson and all its associated questions.
   * @param {string|number} id
   * @returns {Promise<{ deletedQuestions: number }>}
   */
  async deleteLesson(id) {
    try {
      const questions = await DB.getByIndex('questions', 'lessonId', id);
      for (const q of questions) {
        await DB.delete('questions', q.id);
      }
      await DB.delete('lessons', id);
      return { deletedQuestions: questions.length };
    } catch (err) {
      console.error(`[LessonService] deleteLesson(${id}) failed:`, err);
      throw err;
    }
  },

  /**
   * Fuzzy-searches lessons by title and content.
   * Returns lessons whose title or content contains the query (case-insensitive).
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchLessons(query) {
    if (!query || !query.trim()) return [];
    const q   = query.trim().toLowerCase();
    try {
      const all = await DB.getAll('lessons');
      return all.filter(lesson => {
        const inTitle   = (lesson.title   ?? '').toLowerCase().includes(q);
        const inContent = (lesson.content ?? '').toLowerCase().includes(q);
        const inDesc    = (lesson.description ?? '').toLowerCase().includes(q);
        const inTopics  = (lesson.topics ?? []).some(t => t.toLowerCase().includes(q));
        return inTitle || inContent || inDesc || inTopics;
      });
    } catch (err) {
      console.error('[LessonService] searchLessons failed:', err);
      return [];
    }
  },

  /**
   * Returns stats for a single lesson.
   * @param {string|number} id
   * @returns {Promise<{ questionCount: number, avgAccuracy: number, lastStudied: number|null }>}
   */
  async getLessonStats(id) {
    try {
      const questions = await DB.getByIndex('questions', 'lessonId', id);
      const qIds      = new Set(questions.map(q => q.id));

      const progress = await DB.getById('progress', 'player') ?? {};
      const log      = progress.answerLog ?? [];

      const relevant = log.filter(e => qIds.has(e.questionId));
      const correct  = relevant.filter(e => e.correct).length;
      const avgAccuracy = relevant.length > 0
        ? Math.round((correct / relevant.length) * 100)
        : 0;

      const sessions  = (progress.gameSessions ?? [])
        .filter(s => (s.lessonId === id || (s.questionIds ?? []).some(qid => qIds.has(qid))))
        .sort((a, b) => b.timestamp - a.timestamp);

      const lastStudied = sessions.length > 0 ? sessions[0].timestamp : null;

      return {
        questionCount: questions.length,
        avgAccuracy,
        lastStudied,
      };
    } catch (err) {
      console.error(`[LessonService] getLessonStats(${id}) failed:`, err);
      return { questionCount: 0, avgAccuracy: 0, lastStudied: null };
    }
  },
};

export default LessonService;
