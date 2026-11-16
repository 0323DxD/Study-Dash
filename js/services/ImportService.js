/**
 * ImportService.js — Robust import system for lessons, questions, and backups.
 * Supports JSON, CSV, TXT, and document text workflows with full client-side validation.
 */

import { DB } from '../db.js';
import { State } from '../state.js';

export const ImportService = {

  /**
   * Generates a starter CSV template string for questions.
   */
  generateCSVTemplate() {
    return `type,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,subject,lesson,difficulty
mcq,"What layer is responsible for logical IP addressing in the OSI model?",Data Link,Network,Transport,Application,B,"The Network Layer handles packet routing and logical IP addressing.","Information Technology","OSI Model & Layers",medium
truefalse,"TCP guarantees packet delivery whereas UDP is connectionless.",,,,,True,"TCP uses a 3-way handshake and retransmission to ensure delivery.","Information Technology","TCP/IP Protocol Suite",easy
identification,"What organelle is known as the powerhouse of the cell?",,,,,mitochondria,"Mitochondria synthesize ATP through cellular respiration.","General Science","Cell Biology & Organelles",easy
mcq,"Which security property in the CIA triad prevents unauthorized tampering?",Confidentiality,Integrity,Availability,Non-repudiation,B,"Integrity guarantees data is not altered or destroyed by unauthorized users.","Information Technology","Network Security Fundamentals",medium`;
  },

  /**
   * Generates a starter JSON template string.
   */
  generateJSONTemplate() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subjects: [
        { name: 'Computer Science', color: '#4361ee', icon: '💻' }
      ],
      lessons: [
        {
          subjectName: 'Computer Science',
          title: 'Algorithms & Big O',
          description: 'Time and space complexity fundamentals',
          difficulty: 'medium',
          content: 'Big O notation classifies algorithms according to how their run time or space requirements grow as the input size grows.'
        }
      ],
      questions: [
        {
          subjectName: 'Computer Science',
          lessonTitle: 'Algorithms & Big O',
          type: 'mcq',
          text: 'What is the average time complexity of Binary Search on a sorted array?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
          correctIndex: 2,
          explanation: 'Binary search halves the search space at each iteration, resulting in logarithmic O(log n) time.',
          difficulty: 'medium'
        }
      ]
    }, null, 2);
  },

  /**
   * Parse CSV string into array of rows respecting quotes and commas.
   */
  parseCSV(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  },

  /**
   * Imports questions from CSV content.
   * Expected columns: type, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, subject, lesson, difficulty
   */
  async importFromCSV(csvText, defaultSubjectId = null, defaultLessonId = null) {
    const rows = this.parseCSV(csvText.trim());
    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing data rows.');
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const colIndex = {
      type: headers.indexOf('type'),
      question: headers.indexOf('question'),
      optionA: headers.indexOf('optiona'),
      optionB: headers.indexOf('optionb'),
      optionC: headers.indexOf('optionc'),
      optionD: headers.indexOf('optiond'),
      correctAnswer: headers.indexOf('correctanswer'),
      explanation: headers.indexOf('explanation'),
      subject: headers.indexOf('subject'),
      lesson: headers.indexOf('lesson'),
      difficulty: headers.indexOf('difficulty')
    };

    if (colIndex.question === -1) {
      throw new Error('CSV missing required "question" column header.');
    }

    const subjects = await DB.getAll('subjects');
    const lessons = await DB.getAll('lessons');

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      try {
        const qText = (row[colIndex.question] || '').trim();
        if (!qText) {
          skipped++;
          continue;
        }

        const typeRaw = (colIndex.type !== -1 ? row[colIndex.type] : 'mcq').toLowerCase().trim();
        let type = 'mcq';
        if (typeRaw.includes('true') || typeRaw === 'tf') type = 'truefalse';
        else if (typeRaw.includes('ident') || typeRaw === 'id') type = 'identification';

        const subjectName = colIndex.subject !== -1 ? (row[colIndex.subject] || '').trim() : '';
        const lessonTitle = colIndex.lesson !== -1 ? (row[colIndex.lesson] || '').trim() : '';
        const difficulty = (colIndex.difficulty !== -1 ? (row[colIndex.difficulty] || '').toLowerCase().trim() : '') || 'medium';
        const explanation = colIndex.explanation !== -1 ? (row[colIndex.explanation] || '').trim() : '';
        const correctRaw = colIndex.correctAnswer !== -1 ? (row[colIndex.correctAnswer] || '').trim() : '';

        // Match or resolve subject
        let subjectId = defaultSubjectId;
        if (subjectName) {
          let foundSubject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
          if (!foundSubject) {
            const newId = await DB.add('subjects', {
              name: subjectName,
              color: '#4361ee',
              icon: '📚',
              createdAt: new Date().toISOString()
            });
            foundSubject = { id: newId, name: subjectName };
            subjects.push(foundSubject);
          }
          subjectId = foundSubject.id;
        } else if (!subjectId && subjects.length > 0) {
          subjectId = subjects[0].id;
        }

        // Match or resolve lesson
        let lessonId = defaultLessonId;
        if (lessonTitle && subjectId) {
          let foundLesson = lessons.find(l => l.subjectId === subjectId && l.title.toLowerCase() === lessonTitle.toLowerCase());
          if (!foundLesson) {
            const newLId = await DB.add('lessons', {
              subjectId,
              title: lessonTitle,
              description: 'Imported via CSV',
              difficulty,
              createdAt: new Date().toISOString()
            });
            foundLesson = { id: newLId, subjectId, title: lessonTitle };
            lessons.push(foundLesson);
          }
          lessonId = foundLesson.id;
        }

        const questionRecord = {
          subjectId: subjectId || 1,
          lessonId: lessonId || null,
          type,
          difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
          text: qText,
          explanation,
          points: 10,
          createdAt: new Date().toISOString()
        };

        if (type === 'mcq') {
          const optA = (row[colIndex.optionA] || '').trim();
          const optB = (row[colIndex.optionB] || '').trim();
          const optC = (row[colIndex.optionC] || '').trim();
          const optD = (row[colIndex.optionD] || '').trim();
          questionRecord.options = [optA, optB, optC, optD].filter(Boolean);
          if (questionRecord.options.length < 2) {
            questionRecord.options = [optA || 'Option A', optB || 'Option B', 'Option C', 'Option D'];
          }

          let correctIdx = 0;
          const cUpper = correctRaw.toUpperCase();
          if (cUpper === 'B' || cUpper === '1') correctIdx = 1;
          else if (cUpper === 'C' || cUpper === '2') correctIdx = 2;
          else if (cUpper === 'D' || cUpper === '3') correctIdx = 3;
          else {
            const matchIndex = questionRecord.options.findIndex(o => o.toLowerCase() === correctRaw.toLowerCase());
            if (matchIndex !== -1) correctIdx = matchIndex;
          }
          questionRecord.correctIndex = correctIdx;
        } else if (type === 'truefalse') {
          const lower = correctRaw.toLowerCase();
          questionRecord.correct = lower === 'true' || lower === 't' || lower === '1';
        } else if (type === 'identification') {
          questionRecord.correct = correctRaw;
          questionRecord.alternates = [];
        }

        await DB.add('questions', questionRecord);
        imported++;
      } catch (err) {
        skipped++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    await State.reloadCollection('subjects');
    await State.reloadCollection('lessons');
    await State.reloadCollection('questions');

    return { imported, skipped, errors };
  },

  /**
   * Imports full backup or JSON questions/lessons structure.
   */
  async importFromJSON(jsonString) {
    let data;
    try {
      data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message);
    }

    let importedSubjects = 0;
    let importedLessons = 0;
    let importedQuestions = 0;

    // 1. If it's a flat array of questions
    if (Array.isArray(data)) {
      for (const q of data) {
        if (q.text || q.question) {
          const record = {
            subjectId: q.subjectId || 1,
            lessonId: q.lessonId || null,
            type: q.type || 'mcq',
            difficulty: q.difficulty || 'medium',
            text: q.text || q.question,
            explanation: q.explanation || '',
            points: q.points || 10,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
            correct: q.correct,
            createdAt: new Date().toISOString()
          };
          await DB.add('questions', record);
          importedQuestions++;
        }
      }
      await State.reloadCollection('questions');
      return { importedSubjects: 0, importedLessons: 0, importedQuestions };
    }

    // 2. Structured backup: { subjects, lessons, questions }
    const subjectMap = new Map(); // old ID -> new ID
    if (Array.isArray(data.subjects)) {
      for (const s of data.subjects) {
        const oldId = s.id;
        const newRecord = {
          name: s.name || 'Untitled Subject',
          color: s.color || '#4361ee',
          icon: s.icon || '📚',
          createdAt: s.createdAt || new Date().toISOString()
        };
        const newId = await DB.add('subjects', newRecord);
        if (oldId !== undefined) subjectMap.set(oldId, newId);
        importedSubjects++;
      }
    }

    const lessonMap = new Map(); // old ID -> new ID
    if (Array.isArray(data.lessons)) {
      for (const l of data.lessons) {
        const oldId = l.id;
        const mappedSubjectId = subjectMap.get(l.subjectId) || l.subjectId || 1;
        const newRecord = {
          subjectId: mappedSubjectId,
          title: l.title || 'Untitled Lesson',
          description: l.description || '',
          objectives: l.objectives || '',
          content: l.content || l.notes || '',
          difficulty: l.difficulty || 'medium',
          createdAt: l.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const newId = await DB.add('lessons', newRecord);
        if (oldId !== undefined) lessonMap.set(oldId, newId);
        importedLessons++;
      }
    }

    if (Array.isArray(data.questions)) {
      for (const q of data.questions) {
        const mappedSubId = subjectMap.get(q.subjectId) || q.subjectId || 1;
        const mappedLesId = lessonMap.get(q.lessonId) || q.lessonId || null;
        const newRecord = {
          ...q,
          subjectId: mappedSubId,
          lessonId: mappedLesId,
          text: q.text || q.question,
          createdAt: q.createdAt || new Date().toISOString()
        };
        delete newRecord.id;
        await DB.add('questions', newRecord);
        importedQuestions++;
      }
    }

    await State.reloadCollection('subjects');
    await State.reloadCollection('lessons');
    await State.reloadCollection('questions');

    return { importedSubjects, importedLessons, importedQuestions };
  },

  /**
   * Imports from structured plain text (Q:, A:, B:, C:, D:, ANSWER:, EXPLAIN:)
   */
  async importFromTXT(txtContent, subjectId = null, lessonId = null) {
    const blocks = txtContent.split(/\n\s*\n/);
    let imported = 0;
    const errors = [];

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let qText = '';
      const options = [];
      let correctAnswer = '';
      let explanation = '';
      let type = 'mcq';

      for (const line of lines) {
        if (/^Q(uestion)?[:.]/i.test(line)) {
          qText = line.replace(/^Q(uestion)?[:.]\s*/i, '').trim();
        } else if (/^[A-D][:.)]/i.test(line)) {
          options.push(line.replace(/^[A-D][:.)]\s*/i, '').trim());
        } else if (/^ANSWER[:.]/i.test(line)) {
          correctAnswer = line.replace(/^ANSWER[:.]\s*/i, '').trim();
        } else if (/^EXPLAIN(ATION)?[:.]/i.test(line)) {
          explanation = line.replace(/^EXPLAIN(ATION)?[:.]\s*/i, '').trim();
        } else if (!qText) {
          qText = line;
        }
      }

      if (!qText) continue;

      if (options.length === 0) {
        if (/^(true|false)$/i.test(correctAnswer)) {
          type = 'truefalse';
        } else {
          type = 'identification';
        }
      }

      const record = {
        subjectId: subjectId || 1,
        lessonId: lessonId || null,
        type,
        difficulty: 'medium',
        text: qText,
        explanation,
        points: 10,
        createdAt: new Date().toISOString()
      };

      if (type === 'mcq') {
        record.options = options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'];
        let idx = 0;
        const upper = correctAnswer.toUpperCase();
        if (upper === 'B' || upper === '2') idx = 1;
        else if (upper === 'C' || upper === '3') idx = 2;
        else if (upper === 'D' || upper === '4') idx = 3;
        record.correctIndex = idx;
      } else if (type === 'truefalse') {
        record.correct = /^true$/i.test(correctAnswer);
      } else if (type === 'identification') {
        record.correct = correctAnswer || 'Answer';
        record.alternates = [];
      }

      await DB.add('questions', record);
      imported++;
    }

    await State.reloadCollection('questions');
    return { imported, errors };
  }
};

export default ImportService;
