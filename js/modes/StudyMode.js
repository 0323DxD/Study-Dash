/**
 * StudyMode.js — Pressure-free Flashcard and Reviewer Study Experience.
 * Allows students to flip through lessons, reveal answers and detailed explanations,
 * and track learning confidence (Got It / Still Learning).
 */

import { DB } from '../db.js';
import { State } from '../state.js';
import { GameQuestionService } from '../services/GameQuestionService.js';

export const StudyMode = {
  questions: [],
  currentIndex: 0,
  isFlipped: false,
  knownCount: 0,
  learningCount: 0,

  async init(params = {}) {
    const container = document.getElementById('study-mode-body');
    if (!container) return;

    this.currentIndex = 0;
    this.isFlipped = false;
    this.knownCount = 0;
    this.learningCount = 0;

    let allQuestions = await DB.getAll('questions');
    if (params.lessonId) {
      allQuestions = allQuestions.filter(q => q.lessonId === params.lessonId);
    } else if (params.subjectId) {
      allQuestions = allQuestions.filter(q => q.subjectId === params.subjectId);
    }

    if (allQuestions.length === 0) {
      allQuestions = await DB.getAll('questions');
    }

    this.questions = GameQuestionService.shuffle(allQuestions);
    this.render();
  },

  render() {
    const container = document.getElementById('study-mode-body');
    const meta = document.getElementById('study-progress-text');
    if (!container) return;

    if (this.questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📖</span>
          <h3>No Questions Found</h3>
          <p>Add lessons and questions in the Question Bank to start studying!</p>
          <button class="btn btn-primary" onclick="window.location.hash='#addQuestion'">+ Add Questions</button>
        </div>`;
      if (meta) meta.textContent = '0 / 0';
      return;
    }

    // Finished deck
    if (this.currentIndex >= this.questions.length) {
      const total = this.questions.length;
      const pct = Math.round((this.knownCount / total) * 100);
      container.innerHTML = `
        <div class="card study-summary-card" style="text-align: center; padding: 32px 16px;">
          <div style="font-size: 54px; margin-bottom: 12px;">🎉</div>
          <h2>Study Deck Complete!</h2>
          <p class="text-muted" style="margin-bottom: 24px;">You have reviewed all ${total} cards in this session.</p>
          
          <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
            <div class="card" style="background: rgba(56, 176, 0, 0.15); border: 1px solid #38b000; padding: 12px;">
              <span style="font-size: 24px; font-weight: bold; color: #38b000;">${this.knownCount}</span>
              <div style="font-size: 13px; color: #a0a0b0;">Mastered / Got It</div>
            </div>
            <div class="card" style="background: rgba(230, 57, 70, 0.15); border: 1px solid #e63946; padding: 12px;">
              <span style="font-size: 24px; font-weight: bold; color: #e63946;">${this.learningCount}</span>
              <div style="font-size: 13px; color: #a0a0b0;">Still Learning</div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-restart-study">Study Again 🔄</button>
            <button class="btn btn-secondary" onclick="window.location.hash='#play'">Return to Play</button>
          </div>
        </div>`;

      document.getElementById('btn-restart-study')?.addEventListener('click', () => {
        this.currentIndex = 0;
        this.knownCount = 0;
        this.learningCount = 0;
        this.questions = GameQuestionService.shuffle(this.questions);
        this.render();
      });
      return;
    }

    if (meta) {
      meta.textContent = `${this.currentIndex + 1} / ${this.questions.length}`;
    }

    const q = this.questions[this.currentIndex];
    const qText = q.text || q.question || '';
    const explanation = q.explanation || 'No explanation provided.';

    let answerDisplay = '';
    if (q.type === 'mcq' && Array.isArray(q.options)) {
      const idx = q.correctIndex !== undefined ? q.correctIndex : 0;
      answerDisplay = `<strong style="color:#38b000;">${q.options[idx]}</strong>`;
    } else if (q.type === 'truefalse') {
      answerDisplay = `<strong style="color:#38b000;">${q.correct ? 'True' : 'False'}</strong>`;
    } else if (q.type === 'identification') {
      answerDisplay = `<strong style="color:#38b000;">${q.correct}</strong>`;
    }

    container.innerHTML = `
      <div class="study-card-container" style="max-width: 480px; margin: 0 auto;">
        <div class="study-flashcard card ${this.isFlipped ? 'flipped' : ''}" id="study-card" style="cursor: pointer; min-height: 260px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 24px; transition: transform 0.25s ease; border: 2px solid #4361ee;">
          ${!this.isFlipped ? `
            <span class="badge badge-${q.difficulty || 'medium'}" style="margin-bottom: 16px;">${q.type?.toUpperCase()} • ${q.difficulty}</span>
            <h3 style="font-size: 19px; line-height: 1.4; color: #ffffff; margin-bottom: 24px;">${this.escape(qText)}</h3>
            <div style="font-size: 13px; color: #a0a0b0;">👆 Tap anywhere on card to reveal answer</div>
          ` : `
            <span class="badge badge-success" style="margin-bottom: 12px; background: #38b000; color: #fff;">ANSWER</span>
            <div style="font-size: 20px; margin-bottom: 16px;">${answerDisplay}</div>
            <div class="explanation-box" style="background: rgba(255,255,255,0.06); padding: 12px; border-radius: 8px; font-size: 14px; color: #ced4da; line-height: 1.4; text-align: left; width: 100%;">
              <strong>💡 Explanation:</strong> ${this.escape(explanation)}
            </div>
          `}
        </div>

        <div class="study-controls" style="display: flex; gap: 12px; margin-top: 20px;">
          <button class="btn btn-secondary btn-full" id="btn-study-learning" style="border-color: #e63946; color: #ff6b6b;">
            ❌ Still Learning
          </button>
          <button class="btn btn-primary btn-full" id="btn-study-known" style="background: #38b000; border-color: #38b000;">
            ✅ Got It!
          </button>
        </div>
      </div>`;

    document.getElementById('study-card')?.addEventListener('click', () => {
      this.isFlipped = !this.isFlipped;
      this.render();
    });

    document.getElementById('btn-study-learning')?.addEventListener('click', () => {
      this.learningCount++;
      this.isFlipped = false;
      this.currentIndex++;
      this.render();
    });

    document.getElementById('btn-study-known')?.addEventListener('click', () => {
      this.knownCount++;
      this.isFlipped = false;
      this.currentIndex++;
      this.render();
    });
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default StudyMode;

