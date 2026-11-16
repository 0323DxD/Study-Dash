/**
 * ExportService.js — Full export system for lessons, questions, and backups.
 * Exports formatted JSON and CSV files and initiates instant client browser downloads.
 */

import { DB } from '../db.js';

export const ExportService = {

  /**
   * Helper to trigger a client browser file download.
   */
  downloadFile(filename, content, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Exports full database (subjects, lessons, questions, scores, progress) as JSON backup.
   */
  async exportAllData() {
    const subjects = await DB.getAll('subjects');
    const lessons = await DB.getAll('lessons');
    const questions = await DB.getAll('questions');
    const gameScores = await DB.getAll('gameScores');
    const playerProgress = await DB.get('playerProgress', 'main') || {};
    const settings = await DB.get('settings', 'main') || {};

    const backup = {
      app: 'StudyDash',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subjects,
      lessons,
      questions,
      gameScores,
      playerProgress,
      settings
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `study-dash-backup-${dateStr}.json`;
    this.downloadFile(filename, JSON.stringify(backup, null, 2), 'application/json');
    return backup;
  },

  /**
   * Exports a single subject along with its lessons and questions.
   */
  async exportSubject(subjectId) {
    const subject = await DB.get('subjects', subjectId);
    if (!subject) throw new Error('Subject not found');

    const allLessons = await DB.getAll('lessons');
    const lessons = allLessons.filter(l => l.subjectId === subjectId);
    const lessonIds = new Set(lessons.map(l => l.id));

    const allQuestions = await DB.getAll('questions');
    const questions = allQuestions.filter(q => q.subjectId === subjectId || (q.lessonId && lessonIds.has(q.lessonId)));

    const exportData = {
      app: 'StudyDash',
      type: 'subject_export',
      exportedAt: new Date().toISOString(),
      subject,
      lessons,
      questions
    };

    const safeName = subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.downloadFile(`study-dash-${safeName}.json`, JSON.stringify(exportData, null, 2));
    return exportData;
  },

  /**
   * Exports questions as a CSV spreadsheet.
   */
  async exportQuestionsAsCSV(filter = {}) {
    let questions = await DB.getAll('questions');
    const subjects = await DB.getAll('subjects');
    const lessons = await DB.getAll('lessons');

    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
    const lessonMap = new Map(lessons.map(l => [l.id, l.title]));

    if (filter.subjectId) {
      questions = questions.filter(q => q.subjectId === filter.subjectId);
    }
    if (filter.lessonId) {
      questions = questions.filter(q => q.lessonId === filter.lessonId);
    }

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'type',
      'question',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctAnswer',
      'explanation',
      'subject',
      'lesson',
      'difficulty'
    ];

    const rows = [headers.join(',')];

    for (const q of questions) {
      const type = q.type || 'mcq';
      const qText = q.text || q.question || '';
      let optA = '', optB = '', optC = '', optD = '';
      let correct = '';

      if (type === 'mcq' && Array.isArray(q.options)) {
        optA = q.options[0] || '';
        optB = q.options[1] || '';
        optC = q.options[2] || '';
        optD = q.options[3] || '';
        const idx = q.correctIndex !== undefined ? q.correctIndex : 0;
        correct = ['A', 'B', 'C', 'D'][idx] || 'A';
      } else if (type === 'truefalse') {
        correct = q.correct ? 'True' : 'False';
      } else if (type === 'identification') {
        correct = q.correct || '';
      }

      const row = [
        escapeCSV(type),
        escapeCSV(qText),
        escapeCSV(optA),
        escapeCSV(optB),
        escapeCSV(optC),
        escapeCSV(optD),
        escapeCSV(correct),
        escapeCSV(q.explanation || ''),
        escapeCSV(subjectMap.get(q.subjectId) || ''),
        escapeCSV(lessonMap.get(q.lessonId) || ''),
        escapeCSV(q.difficulty || 'medium')
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    const filename = `study-dash-questions-${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadFile(filename, csvContent, 'text/csv');
    return csvContent;
  }
};

export default ExportService;

