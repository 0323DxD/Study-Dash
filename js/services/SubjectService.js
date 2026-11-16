/**
 * SubjectService.js
 * CRUD service for Subjects in STUDY DASH.
 * Depends on the DB module at ../db.js
 */

import DB from '../db.js';

const SubjectService = {

  /**
   * Returns all subjects from the database.
   * @returns {Promise<Array>}
   */
  async getAllSubjects() {
    try {
      return await DB.getAll('subjects');
    } catch (err) {
      console.error('[SubjectService] getAllSubjects failed:', err);
      return [];
    }
  },

  /**
   * Returns a single subject by ID.
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getSubjectById(id) {
    try {
      return await DB.getById('subjects', id) ?? null;
    } catch (err) {
      console.error(`[SubjectService] getSubjectById(${id}) failed:`, err);
      return null;
    }
  },

  /**
   * Creates a new subject and persists it.
   * @param {string} name
   * @param {string} color  — hex color string, e.g. '#4CAF50'
   * @param {string} icon   — emoji or icon identifier, e.g. '💻'
   * @returns {Promise<Object>} the newly created subject record
   */
  async createSubject(name, color = '#6C63FF', icon = '📚') {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Subject name is required.');
    }
    const subject = {
      id: DB.generateId(),
      name: name.trim(),
      color,
      icon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await DB.put('subjects', subject);
      return subject;
    } catch (err) {
      console.error('[SubjectService] createSubject failed:', err);
      throw err;
    }
  },

  /**
   * Updates an existing subject with the supplied fields.
   * @param {string|number} id
   * @param {Object} data  — partial fields to merge
   * @returns {Promise<Object>} the updated subject
   */
  async updateSubject(id, data = {}) {
    try {
      const existing = await DB.getById('subjects', id);
      if (!existing) throw new Error(`Subject ${id} not found.`);
      const updated = {
        ...existing,
        ...data,
        id,                      // prevent id override
        updatedAt: Date.now(),
      };
      await DB.put('subjects', updated);
      return updated;
    } catch (err) {
      console.error(`[SubjectService] updateSubject(${id}) failed:`, err);
      throw err;
    }
  },

  /**
   * Deletes a subject and cascades to its lessons and questions.
   * @param {string|number} id
   * @returns {Promise<{ deletedLessons: number, deletedQuestions: number }>}
   */
  async deleteSubject(id) {
    try {
      // Cascade delete questions
      const questions = await DB.getByIndex('questions', 'subjectId', id);
      for (const q of questions) {
        await DB.delete('questions', q.id);
      }

      // Cascade delete lessons
      const lessons = await DB.getByIndex('lessons', 'subjectId', id);
      for (const l of lessons) {
        await DB.delete('lessons', l.id);
      }

      await DB.delete('subjects', id);

      return {
        deletedLessons: lessons.length,
        deletedQuestions: questions.length,
      };
    } catch (err) {
      console.error(`[SubjectService] deleteSubject(${id}) failed:`, err);
      throw err;
    }
  },

  /**
   * Returns aggregated stats for a subject.
   * @param {string|number} id
   * @returns {Promise<{ lessonCount: number, questionCount: number, accuracy: number }>}
   */
  async getSubjectStats(id) {
    try {
      const lessons   = await DB.getByIndex('lessons',   'subjectId', id);
      const questions = await DB.getByIndex('questions', 'subjectId', id);

      // Pull progress answers for these questions
      const progress = await DB.getById('progress', 'player') ?? {};
      const log      = progress.answerLog ?? [];

      const relevantIds = new Set(questions.map(q => q.id));
      const relevant    = log.filter(entry => relevantIds.has(entry.questionId));
      const correct     = relevant.filter(e => e.correct).length;
      const accuracy    = relevant.length > 0
        ? Math.round((correct / relevant.length) * 100)
        : 0;

      return {
        lessonCount:   lessons.length,
        questionCount: questions.length,
        accuracy,
      };
    } catch (err) {
      console.error(`[SubjectService] getSubjectStats(${id}) failed:`, err);
      return { lessonCount: 0, questionCount: 0, accuracy: 0 };
    }
  },
};

export default SubjectService;
