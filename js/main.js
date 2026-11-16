/**
 * main.js — Study Dash application entry point.
 * Initialises the DB, loads state, sets up routing, wires UI,
 * bootstraps Phaser, and registers the service worker.
 */

import { DB }     from './db.js';
import { State }  from './state.js';
import { Router } from './router.js';
import { SeedData } from './services/SeedData.js';
import { gameManager } from './game/GameManager.js';
import { StudyMode } from './modes/StudyMode.js';
import { ExamChallengeMode } from './modes/ExamChallengeMode.js';
import { TimeAttackMode } from './modes/TimeAttackMode.js';
import { MistakeReviewMode } from './modes/MistakeReviewMode.js';
import { CustomReviewerRun } from './modes/CustomReviewerRun.js';
import { ReviewerScreen } from './screens/reviewerScreen.js';
import { ImportModal } from './modals/ImportModal.js';
import { ExportModal } from './modals/ExportModal.js';

/* ─────────────────────────────────────────────────────────
   TOAST UTILITY
───────────────────────────────────────────────────────── */
/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true"></span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('exiting');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(dismiss, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}

/* ─────────────────────────────────────────────────────────
   MODAL UTILITY
───────────────────────────────────────────────────────── */
/**
 * Open the shared modal.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string|HTMLElement} opts.body  — HTML string or DOM node
 * @param {Array<{label:string, action:Function, style?:string}>} [opts.buttons]
 */
export function openModal({ title, body, buttons = [] }) {
  const overlay  = document.getElementById('modal-overlay');
  const titleEl  = document.getElementById('modal-title');
  const bodyEl   = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  titleEl.textContent = title;

  if (typeof body === 'string') {
    bodyEl.innerHTML = body;
  } else if (body instanceof HTMLElement) {
    bodyEl.innerHTML = '';
    bodyEl.appendChild(body);
  }

  footerEl.innerHTML = '';
  for (const btn of buttons) {
    const el = document.createElement('button');
    el.className = `btn ${btn.style || 'btn-secondary'}`;
    el.textContent = btn.label;
    el.addEventListener('click', async () => {
      await btn.action();
    });
    footerEl.appendChild(el);
  }

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  State.setState({ ui: { ...State.get('ui'), modalOpen: true } }, true);
}

/** Close the shared modal. */
export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  State.setState({ ui: { ...State.get('ui'), modalOpen: false } }, true);
}

/* ─────────────────────────────────────────────────────────
   HTML ESCAPE
───────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────────
   PHASER INIT
───────────────────────────────────────────────────────── */
let _phaserGame = null;

function initPhaser() {
  if (typeof Phaser === 'undefined') {
    console.warn('[Main] Phaser not loaded yet');
    return null;
  }
  if (_phaserGame) return _phaserGame;

  // Boot scene — holds the game idle, waiting for play
  class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
      // Preload assets here in future
    }

    create() {
      // Camera background matches app theme
      this.cameras.main.setBackgroundColor('#1a1a2e');
      console.log('[Phaser] BootScene ready');
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width:  window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scale: {
      mode:          Phaser.Scale.RESIZE,
      autoCenter:    Phaser.Scale.CENTER_BOTH,
      width:         '100%',
      height:        '100%'
    },
    physics: {
      default: 'arcade',
      arcade:  { gravity: { y: 800 }, debug: false }
    },
    audio: {
      disableWebAudio: false,
      noAudio: false
    },
    scene: [BootScene],
    // Render on top of HTML UI only when game screen is active
    dom: { createContainer: false }
  };

  _phaserGame = new Phaser.Game(config);

  // Handle resize
  window.addEventListener('resize', () => {
    if (_phaserGame) {
      _phaserGame.scale.resize(window.innerWidth, window.innerHeight);
    }
  });

  console.log('[Phaser] Game initialised');
  return _phaserGame;
}

/* ─────────────────────────────────────────────────────────
   HOME SCREEN RENDER
───────────────────────────────────────────────────────── */
function renderHomeScreen() {
  const state    = State.getState();
  const progress = state.playerProgress;

  // Stats
  const streak   = document.getElementById('stat-streak');
  const answered = document.getElementById('stat-answered');
  const accuracy = document.getElementById('stat-accuracy');
  const coins    = document.getElementById('coin-count');

  if (streak)   streak.textContent   = progress.streak    || 0;
  if (answered) answered.textContent = progress.totalAnswered || 0;
  if (accuracy) {
    const pct = progress.totalAnswered > 0
      ? Math.round((progress.correct / progress.totalAnswered) * 100)
      : 0;
    accuracy.textContent = `${pct}%`;
  }
  if (coins) coins.textContent = progress.coins || 0;

  // Recent lessons — show last 3
  const recentContainer = document.getElementById('recent-lessons');
  if (recentContainer && state.lessons.length > 0) {
    const recent = [...state.lessons].reverse().slice(0, 3);
    recentContainer.innerHTML = recent.map(lesson => {
      const subject = state.subjects.find(s => s.id === lesson.subjectId);
      const color   = subject?.color || '#e94560';
      return `
        <div class="card lesson-card" data-lesson-id="${lesson.id}" role="button" tabindex="0"
             aria-label="Open lesson: ${escapeHtml(lesson.title)}">
          <div class="lesson-card-header">
            <span class="subject-dot" style="background:${color}" aria-hidden="true"></span>
            <span class="lesson-card-title">${escapeHtml(lesson.title)}</span>
            <span class="badge badge-${lesson.difficulty}">${lesson.difficulty}</span>
          </div>
          <div class="lesson-card-meta">
            <span class="text-muted fs-xs">${escapeHtml(subject?.name || 'Unknown')}</span>
          </div>
        </div>`;
    }).join('');

    // Bind click on lesson cards
    recentContainer.querySelectorAll('.lesson-card').forEach(card => {
      const handler = () => Router.navigate('reviewer', { lessonId: parseInt(card.dataset.lessonId) });
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
    });
  } else if (recentContainer && state.lessons.length === 0) {
    recentContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🌱</span>
        <p>No lessons yet. Start adding content!</p>
        <button class="btn btn-primary" id="btn-go-lessons">Add Lessons</button>
      </div>`;
    document.getElementById('btn-go-lessons')?.addEventListener('click', () => Router.navigate('lessons'));
  }
}

/* ─────────────────────────────────────────────────────────
   LESSON SCREEN
───────────────────────────────────────────────────────── */
function renderLessonsScreen() {
  const state = State.getState();

  // Subject filter chips
  const filterContainer = document.getElementById('subject-filter');
  if (filterContainer) {
    filterContainer.innerHTML = `
      <button class="chip active" data-subject-id="all">All</button>
      ${state.subjects.map(s => `
        <button class="chip" data-subject-id="${s.id}" style="--chip-color:${s.color}">
          ${escapeHtml(s.name)}
        </button>`).join('')}`;

    filterContainer.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filterContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderLessonList(chip.dataset.subjectId === 'all' ? null : parseInt(chip.dataset.subjectId));
    });
  }

  renderLessonList(null);
}

/** @param {number|null} subjectId */
function renderLessonList(subjectId) {
  const state     = State.getState();
  const lessons   = subjectId
    ? state.lessons.filter(l => l.subjectId === subjectId)
    : state.lessons;
  const container = document.getElementById('lesson-list');
  if (!container) return;

  if (lessons.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📚</span>
        <p>${subjectId ? 'No lessons in this subject.' : 'No lessons yet. Tap "+ Lesson" to add one!'}</p>
      </div>`;
    return;
  }

  container.innerHTML = lessons.map(lesson => {
    const subject = state.subjects.find(s => s.id === lesson.subjectId);
    const color   = subject?.color || '#e94560';
    const qCount  = state.questions.filter(q => q.lessonId === lesson.id).length;
    return `
      <div class="card lesson-card" data-lesson-id="${lesson.id}">
        <div class="lesson-card-header">
          <span class="subject-dot" style="background:${color}" aria-hidden="true"></span>
          <span class="lesson-card-title">${escapeHtml(lesson.title)}</span>
          <span class="badge badge-${lesson.difficulty}">${lesson.difficulty}</span>
        </div>
        <div class="lesson-card-meta">
          <span class="text-muted fs-xs">${escapeHtml(subject?.name || '—')}</span>
          <span class="badge badge-primary">${qCount} Q</span>
        </div>
        <div class="lesson-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="study" aria-label="Study ${escapeHtml(lesson.title)}">📖 Study</button>
          <button class="btn btn-secondary btn-sm" data-action="edit"  aria-label="Edit ${escapeHtml(lesson.title)}">✏️ Edit</button>
          <button class="btn btn-secondary btn-sm" data-action="delete" aria-label="Delete ${escapeHtml(lesson.title)}">🗑️</button>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.lesson-card').forEach(card => {
    const id = parseInt(card.dataset.lessonId);

    card.querySelector('[data-action="study"]')?.addEventListener('click', e => {
      e.stopPropagation();
      Router.navigate('studyMode', { lessonId: id });
    });
    card.querySelector('[data-action="edit"]')?.addEventListener('click', e => {
      e.stopPropagation();
      Router.navigate('addLesson', { editId: id });
    });
    card.querySelector('[data-action="delete"]')?.addEventListener('click', async e => {
      e.stopPropagation();
      openModal({
        title: 'Delete Lesson',
        body:  `<p>Are you sure you want to delete "<strong>${escapeHtml(State.getState().lessons.find(l=>l.id===id)?.title||'')}</strong>"?</p>`,
        buttons: [
          { label: 'Cancel', action: closeModal },
          { label: 'Delete', style: 'btn-danger', action: async () => {
            await DB.delete('lessons', id);
            await State.reloadCollection('lessons');
            closeModal();
            renderLessonList(subjectId);
            showToast('Lesson deleted', 'success');
          }}
        ]
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   QUESTION BANK SCREEN
───────────────────────────────────────────────────────── */
function renderQuestionBankScreen() {
  const state = State.getState();

  // Populate subject filter select
  const subjectSel = document.getElementById('filter-subject');
  if (subjectSel) {
    subjectSel.innerHTML = `<option value="">All Subjects</option>` +
      state.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  }

  renderQuestionList();

  // Filter change listeners
  ['filter-subject', 'filter-difficulty', 'filter-type'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderQuestionList);
  });
}

function renderQuestionList() {
  const state      = State.getState();
  const subjectId  = parseInt(document.getElementById('filter-subject')?.value || '0') || null;
  const difficulty = document.getElementById('filter-difficulty')?.value || '';
  const type       = document.getElementById('filter-type')?.value || '';

  let questions = [...state.questions];
  if (subjectId)  questions = questions.filter(q => q.subjectId  === subjectId);
  if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
  if (type)       questions = questions.filter(q => q.type       === type);

  const container = document.getElementById('question-list');
  if (!container) return;

  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">❓</span><p>No questions match your filters.</p></div>`;
    return;
  }

  container.innerHTML = questions.map(q => {
    const subject = state.subjects.find(s => s.id === q.subjectId);
    return `
      <div class="card question-card" data-question-id="${q.id}">
        <div class="question-card-header">
          <span class="question-card-text">${escapeHtml(q.text || q.question || '')}</span>
        </div>
        <div class="question-card-meta">
          <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
          <span class="badge badge-mcq">${q.type}</span>
          ${subject ? `<span class="text-muted fs-xs">${escapeHtml(subject.name)}</span>` : ''}
        </div>
        <div class="question-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit"   aria-label="Edit question">✏️</button>
          <button class="btn btn-secondary btn-sm" data-action="delete" aria-label="Delete question">🗑️</button>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.question-card').forEach(card => {
    const id = parseInt(card.dataset.questionId);
    card.querySelector('[data-action="edit"]')?.addEventListener('click', () =>
      Router.navigate('addQuestion', { editId: id })
    );
    card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      openModal({
        title: 'Delete Question',
        body:  '<p>Permanently delete this question?</p>',
        buttons: [
          { label: 'Cancel', action: closeModal },
          { label: 'Delete', style: 'btn-danger', action: async () => {
            await DB.delete('questions', id);
            await State.reloadCollection('questions');
            closeModal();
            renderQuestionList();
            showToast('Question deleted', 'success');
          }}
        ]
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   PROGRESS SCREEN
───────────────────────────────────────────────────────── */
function renderProgressScreen() {
  const p = State.get('playerProgress');

  const pct = p.totalAnswered > 0 ? Math.round((p.correct / p.totalAnswered) * 100) : 0;

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('prog-total',    p.totalAnswered || 0);
  setText('prog-correct',  p.correct       || 0);
  setText('prog-accuracy', `${pct}%`);
  setText('prog-streak',   p.bestStreak    || 0);

  const bar = document.getElementById('prog-bar');
  if (bar) bar.style.width = `${pct}%`;
  const barWrapper = bar?.parentElement;
  if (barWrapper) barWrapper.setAttribute('aria-valuenow', pct);

  // Load recent scores
  DB.getAllSorted('gameScores', 'date', 'desc').then(scores => {
    const container = document.getElementById('score-history');
    if (!container) return;
    if (scores.length === 0) {
      container.innerHTML = `<div class="empty-state small"><p>No scores yet.</p></div>`;
      return;
    }
    container.innerHTML = scores.slice(0, 10).map(s => `
      <div class="card score-history-row">
        <span class="score-date">${new Date(s.date).toLocaleDateString()}</span>
        <span class="score-mode">${escapeHtml(s.mode || 'Game')}</span>
        <span class="score-value">${s.score} pts</span>
      </div>`).join('');
  });
}

/* ─────────────────────────────────────────────────────────
   SETTINGS SCREEN
───────────────────────────────────────────────────────── */
function populateSettings() {
  const s = State.get('settings');

  const username = document.getElementById('setting-username');
  if (username) username.value = s.username || '';

  const sfx        = document.getElementById('setting-sfx');
  const music      = document.getElementById('setting-music');
  const vibration  = document.getElementById('setting-vibration');
  const dailyGoal  = document.getElementById('setting-daily-goal');
  const explns     = document.getElementById('setting-explanations');

  if (sfx)       sfx.checked       = s.sfx       !== false;
  if (music)     music.checked     = s.music      !== false;
  if (vibration) vibration.checked = s.vibration  !== false;
  if (explns)    explns.checked    = s.showExplanations !== false;
  if (dailyGoal) dailyGoal.value   = s.dailyGoal  || 20;
}

function wireSettingsForm() {
  const save = async () => {
    State.updateSettings({
      username:         document.getElementById('setting-username')?.value  || '',
      sfx:              document.getElementById('setting-sfx')?.checked     ?? true,
      music:            document.getElementById('setting-music')?.checked   ?? true,
      vibration:        document.getElementById('setting-vibration')?.checked ?? true,
      dailyGoal:        parseInt(document.getElementById('setting-daily-goal')?.value || '20'),
      showExplanations: document.getElementById('setting-explanations')?.checked ?? true
    });
    showToast('Settings saved', 'success');
  };

  ['setting-username', 'setting-sfx', 'setting-music', 'setting-vibration',
   'setting-daily-goal', 'setting-explanations'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', save);
  });

  document.getElementById('btn-clear-data')?.addEventListener('click', () => {
    openModal({
      title: 'Clear All Data',
      body:  '<p>This will permanently delete all your subjects, lessons, questions, and progress. This cannot be undone.</p>',
      buttons: [
        { label: 'Cancel', action: closeModal },
        { label: 'Delete Everything', style: 'btn-danger', action: async () => {
          await DB.destroy();
          closeModal();
          showToast('All data cleared. Reloading…', 'warning', 2000);
          setTimeout(() => window.location.reload(), 2000);
        }}
      ]
    });
  });
}

/* ─────────────────────────────────────────────────────────
   SUBJECT MANAGER SCREEN
───────────────────────────────────────────────────────── */
function renderSubjectManager() {
  const container = document.getElementById('subjects-list');
  const state     = State.getState();

  if (!container) return;

  if (state.subjects.length === 0) {
    container.innerHTML = `<div class="empty-state small"><p>No subjects yet.</p></div>`;
    return;
  }

  container.innerHTML = state.subjects.map(s => {
    const lCount = state.lessons.filter(l => l.subjectId === s.id).length;
    const qCount = state.questions.filter(q => q.subjectId === s.id).length;
    return `
      <div class="card subject-row" data-subject-id="${s.id}">
        <div class="subject-color-swatch" style="background:${s.color}" aria-hidden="true"></div>
        <div class="subject-row-info">
          <div class="subject-row-name">${escapeHtml(s.name)}</div>
          <div class="subject-row-count">${lCount} lessons · ${qCount} questions</div>
        </div>
        <button class="btn btn-secondary btn-sm" data-action="delete" aria-label="Delete subject ${escapeHtml(s.name)}">🗑️</button>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id      = parseInt(btn.closest('[data-subject-id]').dataset.subjectId);
      const subject = State.getState().subjects.find(s => s.id === id);
      openModal({
        title: 'Delete Subject',
        body:  `<p>Delete subject "<strong>${escapeHtml(subject?.name||'')}</strong>"? All linked lessons and questions will also be deleted.</p>`,
        buttons: [
          { label: 'Cancel', action: closeModal },
          { label: 'Delete', style: 'btn-danger', action: async () => {
            // Delete all linked questions and lessons
            const lessons   = State.get('lessons').filter(l => l.subjectId === id);
            const questions = State.get('questions').filter(q => q.subjectId === id);
            await Promise.all([
              DB.delete('subjects', id),
              ...lessons.map(l => DB.delete('lessons', l.id)),
              ...questions.map(q => DB.delete('questions', q.id))
            ]);
            await Promise.all([
              State.reloadCollection('subjects'),
              State.reloadCollection('lessons'),
              State.reloadCollection('questions')
            ]);
            closeModal();
            renderSubjectManager();
            showToast('Subject deleted', 'success');
          }}
        ]
      });
    });
  });
}

function wireSubjectForm() {
  const btn = document.getElementById('btn-save-subject');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const nameInput  = document.getElementById('new-subject-name');
    const colorInput = document.getElementById('new-subject-color');
    const name  = nameInput?.value.trim();
    const color = colorInput?.value || '#e94560';

    if (!name) { showToast('Enter a subject name', 'warning'); nameInput?.focus(); return; }

    await DB.add('subjects', { name, color, createdAt: new Date().toISOString() });
    await State.reloadCollection('subjects');
    nameInput.value = '';
    renderSubjectManager();
    showToast(`Subject "${name}" added`, 'success');
  });
}

/* ─────────────────────────────────────────────────────────
   LESSON FORM
───────────────────────────────────────────────────────── */
function populateLessonSubjectSelect() {
  const subjects = State.get('subjects');
  const sel      = document.getElementById('lesson-subject');
  if (!sel) return;
  sel.innerHTML = `<option value="">Choose a subject…</option>` +
    subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

async function loadLessonForEdit(id) {
  const lesson = await DB.get('lessons', id);
  if (!lesson) return;

  document.getElementById('lesson-form-title').textContent = 'Edit Lesson';
  document.getElementById('lesson-id').value           = lesson.id;
  document.getElementById('lesson-subject').value      = lesson.subjectId;
  document.getElementById('lesson-title').value        = lesson.title;
  document.getElementById('lesson-description').value  = lesson.description || '';
  document.getElementById('lesson-notes').value        = lesson.notes       || '';
  document.getElementById('lesson-difficulty').value   = lesson.difficulty  || 'medium';
}

function wireLessonForm() {
  const form = document.getElementById('lesson-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const id         = parseInt(document.getElementById('lesson-id')?.value || '0') || null;
    const subjectId  = parseInt(document.getElementById('lesson-subject')?.value || '0') || null;
    const title      = document.getElementById('lesson-title')?.value.trim();
    const description= document.getElementById('lesson-description')?.value.trim();
    const notes      = document.getElementById('lesson-notes')?.value.trim();
    const difficulty = document.getElementById('lesson-difficulty')?.value || 'medium';

    if (!subjectId) { showToast('Please select a subject', 'warning'); return; }
    if (!title)     { showToast('Lesson title is required', 'warning'); return; }

    const record = { subjectId, title, description, notes, difficulty, updatedAt: new Date().toISOString() };

    if (id) {
      await DB.put('lessons', { ...record, id });
    } else {
      record.createdAt = new Date().toISOString();
      await DB.add('lessons', record);
    }

    await State.reloadCollection('lessons');
    showToast(id ? 'Lesson updated' : 'Lesson added', 'success');
    Router.back();
  });

  document.getElementById('btn-cancel-lesson')?.addEventListener('click', () => Router.back());
}

/* ─────────────────────────────────────────────────────────
   QUESTION FORM
───────────────────────────────────────────────────────── */
function populateQuestionSubjectSelect() {
  const subjects = State.get('subjects');
  const sel      = document.getElementById('q-subject');
  if (!sel) return;
  sel.innerHTML = `<option value="">Choose a subject…</option>` +
    subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

function wireQuestionTypeChange() {
  const typeEl = document.getElementById('q-type');
  if (!typeEl) return;
  typeEl.addEventListener('change', () => renderAnswerFields(typeEl.value));
  renderAnswerFields(typeEl.value); // Initial render
}

function wireQuestionSubjectChange() {
  const subjectEl = document.getElementById('q-subject');
  if (!subjectEl) return;
  subjectEl.addEventListener('change', () => {
    const subjectId = parseInt(subjectEl.value) || null;
    const lessons   = subjectId ? State.get('lessons').filter(l => l.subjectId === subjectId) : [];
    const lessonSel = document.getElementById('q-lesson');
    if (!lessonSel) return;
    lessonSel.innerHTML = `<option value="">No specific lesson</option>` +
      lessons.map(l => `<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('');
  });
}

/** Render dynamic answer input fields based on question type. */
function renderAnswerFields(type) {
  const container = document.getElementById('q-answers-container');
  if (!container) return;

  if (type === 'mcq') {
    const letters = ['A', 'B', 'C', 'D'];
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Answer Options (click ✓ to mark correct)</label>
        ${letters.map((l, i) => `
          <div class="q-answer-row">
            <span class="text-muted" style="min-width:20px;text-align:center">${l}</span>
            <input class="form-input" type="text" id="q-opt-${i}" placeholder="Option ${l}" />
            <button type="button" class="q-answer-correct-btn" data-index="${i}" aria-label="Mark as correct">✓</button>
          </div>`).join('')}
        <input type="hidden" id="q-correct-index" value="0" />
      </div>`;

    container.querySelectorAll('.q-answer-correct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.q-answer-correct-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('q-correct-index').value = btn.dataset.index;
      });
    });
    // Default mark A as correct
    container.querySelector('.q-answer-correct-btn')?.classList.add('active');
  } else if (type === 'truefalse') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Correct Answer</label>
        <div class="radio-group" role="group">
          <label class="radio-label"><input type="radio" name="q-tf" value="true" checked /> True</label>
          <label class="radio-label"><input type="radio" name="q-tf" value="false" /> False</label>
        </div>
      </div>`;
  } else if (type === 'identification') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Correct Answer *</label>
        <input class="form-input" type="text" id="q-ident-answer" placeholder="Exact answer (case-insensitive)" />
      </div>
      <div class="form-group">
        <label class="form-label">Alternate Accepted Answers (optional, comma-separated)</label>
        <input class="form-input" type="text" id="q-ident-alts" placeholder="alt1, alt2, alt3" />
      </div>`;
  } else if (type === 'enumeration') {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">Items to Enumerate (one per line) *</label>
        <textarea class="form-textarea" id="q-enum-items" rows="4" placeholder="Item 1&#10;Item 2&#10;Item 3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Order Required?</label>
        <label class="radio-label" style="margin-top:4px">
          <input type="checkbox" id="q-enum-ordered" /> Order matters
        </label>
      </div>`;
  }
}

function wireQuestionForm() {
  const form = document.getElementById('question-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const id         = parseInt(document.getElementById('question-id')?.value || '0') || null;
    const subjectId  = parseInt(document.getElementById('q-subject')?.value || '0') || null;
    const lessonId   = parseInt(document.getElementById('q-lesson')?.value  || '0') || null;
    const type       = document.getElementById('q-type')?.value || 'mcq';
    const difficulty = document.getElementById('q-difficulty')?.value || 'medium';
    const text       = document.getElementById('q-text')?.value.trim();
    const explanation= document.getElementById('q-explanation')?.value.trim();
    const points     = parseInt(document.getElementById('q-points')?.value || '10');

    if (!subjectId) { showToast('Please select a subject',  'warning'); return; }
    if (!text)      { showToast('Question text is required','warning'); return; }

    // Collect type-specific answer data
    let answerData = {};
    if (type === 'mcq') {
      const opts = ['A','B','C','D'].map((_, i) =>
        document.getElementById(`q-opt-${i}`)?.value.trim() || ''
      );
      const correctIdx = parseInt(document.getElementById('q-correct-index')?.value || '0');
      if (opts.some(o => !o)) { showToast('Fill in all 4 answer options', 'warning'); return; }
      answerData = { options: opts, correctIndex: correctIdx };
    } else if (type === 'truefalse') {
      answerData = { correct: document.querySelector('input[name="q-tf"]:checked')?.value === 'true' };
    } else if (type === 'identification') {
      const ans = document.getElementById('q-ident-answer')?.value.trim();
      if (!ans) { showToast('Enter the correct answer', 'warning'); return; }
      const alts = (document.getElementById('q-ident-alts')?.value || '')
        .split(',').map(a => a.trim()).filter(Boolean);
      answerData = { correct: ans, alternates: alts };
    } else if (type === 'enumeration') {
      const items = (document.getElementById('q-enum-items')?.value || '')
        .split('\n').map(i => i.trim()).filter(Boolean);
      if (items.length < 2) { showToast('Add at least 2 items', 'warning'); return; }
      answerData = { items, ordered: document.getElementById('q-enum-ordered')?.checked || false };
    }

    const record = {
      subjectId, lessonId: lessonId || null, type, difficulty,
      text, explanation, points,
      ...answerData,
      updatedAt: new Date().toISOString()
    };

    if (id) {
      await DB.put('questions', { ...record, id });
    } else {
      record.createdAt = new Date().toISOString();
      await DB.add('questions', record);
    }

    await State.reloadCollection('questions');
    showToast(id ? 'Question updated' : 'Question added', 'success');
    Router.back();
  });

  document.getElementById('btn-cancel-question')?.addEventListener('click', () => Router.back());
}

/* ─────────────────────────────────────────────────────────
   QUICK PLAY / MODE CARD HANDLERS
───────────────────────────────────────────────────────── */
function wireQuickPlay() {
  document.querySelectorAll('[data-mode]').forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.dataset.mode;
      if (!mode) return;
      const questions = State.get('questions');
      if (questions.length === 0 && mode !== 'game') {
        showToast('Add some questions first!', 'warning');
        return;
      }
      Router.navigate(mode);
    });
  });
}

/* ─────────────────────────────────────────────────────────
   GLOBAL UI WIRING
───────────────────────────────────────────────────────── */
function wireGlobalUI() {
  // Modal close button
  document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Settings button on home
  document.getElementById('btn-settings')?.addEventListener('click', () => Router.navigate('settings'));

  // Manage subjects from lessons
  document.getElementById('btn-manage-subjects')?.addEventListener('click', () => Router.navigate('subjectManager'));

  // Add lesson buttons
  document.getElementById('btn-add-lesson')?.addEventListener('click', () => Router.navigate('addLesson'));
  document.getElementById('fab-add-lesson')?.addEventListener('click', () => Router.navigate('addLesson'));

  // Add question button
  document.getElementById('btn-add-question')?.addEventListener('click', () => Router.navigate('addQuestion'));

  // Import / Export in Question Bank & Settings
  document.getElementById('btn-import-questions')?.addEventListener('click', () => ImportModal.open());
  document.getElementById('btn-export-questions')?.addEventListener('click', () => ExportModal.open());
  document.getElementById('btn-settings-import')?.addEventListener('click', () => ImportModal.open());
  document.getElementById('btn-settings-export')?.addEventListener('click', () => ExportModal.open());

  // Game pause button
  document.getElementById('btn-pause-game')?.addEventListener('click', () => {
    openModal({
      title: 'Game Paused ⏸',
      body: '<p style="text-align:center;">Take a breath! Ready to resume running?</p>',
      buttons: [
        { label: 'Resume Run ▶', style: 'btn-primary', action: closeModal },
        {
          label: 'Restart Run 🔄',
          action: () => {
            closeModal();
            gameManager.startGame();
          }
        },
        {
          label: 'Exit to Dashboard 📚',
          style: 'btn-danger',
          action: () => {
            closeModal();
            gameManager.stopGame();
            Router.navigate('home');
          }
        }
      ]
    });
  });

  // Reset progress
  document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
    openModal({
      title: 'Reset Progress',
      body:  '<p>This will reset your coins, answered count, accuracy, and streaks. Your lessons and questions remain.</p>',
      buttons: [
        { label: 'Cancel', action: closeModal },
        { label: 'Reset', style: 'btn-danger', action: async () => {
          const fresh = {
            key: 'main', coins: 0, totalAnswered: 0, correct: 0,
            streak: 0, bestStreak: 0, dailyAnswered: 0,
            lastPlayDate: null, level: 1, xp: 0
          };
          await DB.put('playerProgress', fresh);
          State.setState({ playerProgress: fresh });
          closeModal();
          showToast('Progress reset', 'success');
          renderProgressScreen();
          renderHomeScreen();
        }}
      ]
    });
  });

  // Clear mistakes
  document.getElementById('btn-clear-mistakes')?.addEventListener('click', async () => {
    await DB.clear('mistakeLog');
    showToast('Mistake log cleared', 'success');
  });
}

/* ─────────────────────────────────────────────────────────
   ROUTER HOOKS
───────────────────────────────────────────────────────── */
function wireRouterHooks() {
  Router.afterEnter('home', () => renderHomeScreen());

  Router.afterEnter('lessons', () => renderLessonsScreen());

  Router.afterEnter('questionBank', () => renderQuestionBankScreen());

  Router.afterEnter('progress', () => renderProgressScreen());

  Router.afterEnter('settings', () => {
    populateSettings();
    wireSettingsForm();
  });

  Router.afterEnter('subjectManager', () => {
    renderSubjectManager();
    wireSubjectForm();
  });

  Router.afterEnter('addLesson', async (screen, params) => {
    document.getElementById('lesson-form-title').textContent = 'Add Lesson';
    document.getElementById('lesson-form')?.reset();
    document.getElementById('lesson-id').value = '';
    populateLessonSubjectSelect();
    if (params?.editId) {
      await loadLessonForEdit(params.editId);
    }
  });

  Router.afterEnter('addQuestion', async (screen, params) => {
    document.getElementById('question-form-title').textContent = 'Add Question';
    document.getElementById('question-form')?.reset();
    document.getElementById('question-id').value = '';
    populateQuestionSubjectSelect();
    wireQuestionSubjectChange();
    wireQuestionTypeChange();
    if (params?.editId) {
      const q = await DB.get('questions', params.editId);
      if (q) {
        document.getElementById('question-form-title').textContent = 'Edit Question';
        document.getElementById('question-id').value  = q.id;
        document.getElementById('q-subject').value    = q.subjectId;
        document.getElementById('q-type').value       = q.type;
        document.getElementById('q-difficulty').value = q.difficulty;
        document.getElementById('q-text').value       = q.text || q.question || '';
        document.getElementById('q-explanation').value= q.explanation || '';
        document.getElementById('q-points').value     = q.points || 10;
        renderAnswerFields(q.type);
      }
    }
  });

  Router.afterEnter('reviewer', (screen, params) => ReviewerScreen.init(params));

  Router.afterEnter('studyMode', (screen, params) => StudyMode.init(params));

  Router.afterEnter('examChallenge', (screen, params) => ExamChallengeMode.init(params));

  Router.afterEnter('timeAttack', (screen, params) => TimeAttackMode.init(params));

  Router.afterEnter('customRun', () => CustomReviewerRun.init());

  Router.afterEnter('mistakeReview', () => MistakeReviewMode.init());

  Router.afterEnter('game', (screen, params) => {
    document.getElementById('game-container')?.classList.add('active');
    gameManager.startGame(params?.mode || 'endless', params?.filter || {});
  });

  Router.beforeLeave('game', () => {
    document.getElementById('game-container')?.classList.remove('active');
    gameManager.stopGame();
  });
}

/* ─────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────── */
function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (!el) return;
  el.classList.add('hidden');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
async function boot() {
  try {
    console.log('[Main] Booting Study Dash…');

    // 1. Init IndexedDB
    await DB.init();

    // 2. Seed initial data if empty
    await SeedData.seedDatabase();

    // 3. Load persisted state
    await State.loadFromDB();

    // 3. Init Phaser (non-blocking)
    if (typeof Phaser !== 'undefined') {
      initPhaser();
    } else {
      // Phaser might still be loading from CDN; wait for it
      window.addEventListener('load', initPhaser, { once: true });
    }

    // 4. Wire UI before router init so hooks are ready
    wireLessonForm();
    wireQuestionForm();
    wireGlobalUI();
    wireQuickPlay();

    // 5. Init router (renders initial screen)
    wireRouterHooks();
    Router.init();

    // 6. Hide loading screen
    hideLoadingScreen();

    // 7. Watch for state changes that affect persistent UI
    State.watch('playerProgress', () => {
      if (Router.current === 'home')     renderHomeScreen();
      if (Router.current === 'progress') renderProgressScreen();
    });

    State.watch('subjects', () => {
      if (Router.current === 'lessons')        renderLessonsScreen();
      if (Router.current === 'subjectManager') renderSubjectManager();
    });

    State.watch('lessons', () => {
      if (Router.current === 'lessons') renderLessonsScreen();
      if (Router.current === 'home')    renderHomeScreen();
    });

    State.watch('questions', () => {
      if (Router.current === 'questionBank') renderQuestionBankScreen();
    });

    console.log('[Main] Boot complete ✓');
  } catch (err) {
    console.error('[Main] Boot error:', err);
    // Show a minimal error in place of loading screen
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.querySelector('.loading-text').textContent = 'Failed to start. Please refresh.';
      ls.querySelector('.loading-spinner').style.display = 'none';
    }
  }
}

/* ─────────────────────────────────────────────────────────
   ENTRY
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', boot);

/* ─────────────────────────────────────────────────────────
   PUBLIC EXPORTS (for use by other modules)
───────────────────────────────────────────────────────── */
export { escapeHtml, initPhaser };
