/**
 * ExamChallengeMode.js — Timed Examination Simulator for Study Dash.
 * Features customizable question count, real countdown timer, answer tracking,
 * pass/fail scorecard, and detailed post-exam answer review.
 */

import { DB } from '../db.js';
import { GameQuestionService } from '../services/GameQuestionService.js';

export const ExamChallengeMode = {
  questions: [],
  currentIndex: 0,
  userAnswers: [],
  timeLeft: 300, // 5 minutes default
  timerInterval: null,
  isCompleted: false,

  async init(params = {}) {
    const container = document.getElementById('exam-mode-body');
    if (!container) return;

    this.currentIndex = 0;
    this.userAnswers = [];
    this.isCompleted = false;
    this.timeLeft = 300;

    let allQuestions = await DB.getAll('questions');
    if (params.lessonId) {
      allQuestions = allQuestions.filter(q => q.lessonId === params.lessonId);
    } else if (params.subjectId) {
      allQuestions = allQuestions.filter(q => q.subjectId === params.subjectId);
    }

    if (allQuestions.length === 0) {
      allQuestions = await DB.getAll('questions');
    }

    const shuffled = GameQuestionService.shuffle(allQuestions);
    const count = Math.min(shuffled.length, params.count || 10);
    this.questions = shuffled.slice(0, count).map(q => GameQuestionService.formatForGame(q));
    this.userAnswers = new Array(this.questions.length).fill(null);

    this.startTimer();
    this.renderQuestion();
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerEl = document.getElementById('exam-timer');
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerEl) {
        const mins = Math.floor(Math.max(0, this.timeLeft) / 60);
        const secs = Math.max(0, this.timeLeft) % 60;
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.submitExam();
      }
    }, 1000);
  },

  renderQuestion() {
    const container = document.getElementById('exam-mode-body');
    if (!container) return;

    if (this.questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <h3>No Exam Questions</h3>
          <p>Add questions in the Question Bank to generate an examination.</p>
          <button class="btn btn-primary" onclick="window.location.hash='#addQuestion'">Add Questions</button>
        </div>`;
      return;
    }

    const q = this.questions[this.currentIndex];
    const currentAns = this.userAnswers[this.currentIndex];

    container.innerHTML = `
      <div class="exam-container" style="max-width: 520px; margin: 0 auto;">
        <div class="exam-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span class="badge badge-primary">Question ${this.currentIndex + 1} of ${this.questions.length}</span>
          <span class="text-muted fs-xs">Points: ${q.points}</span>
        </div>

        <div class="card exam-card" style="padding: 20px; margin-bottom: 16px;">
          <h3 style="font-size: 17px; line-height: 1.4; color: #ffffff; margin-bottom: 20px;">
            ${this.escape(q.text)}
          </h3>

          <div class="exam-choices" style="display: flex; flex-direction: column; gap: 10px;">
            ${q.choices.map((c, i) => `
              <button class="exam-choice-btn ${currentAns === c.id ? 'selected' : ''}" data-choice-id="${c.id}" style="
                text-align: left;
                padding: 14px 16px;
                border-radius: 8px;
                background: ${currentAns === c.id ? 'rgba(67, 97, 238, 0.35)' : 'rgba(255, 255, 255, 0.05)'};
                border: 2px solid ${currentAns === c.id ? '#4361ee' : 'rgba(255, 255, 255, 0.12)'};
                color: #ffffff;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.15s ease;
              ">
                <span style="font-weight: bold; margin-right: 8px; color: #4cc9f0;">${['A', 'B', 'C', 'D'][i] || '•'}.</span>
                ${this.escape(c.text)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="exam-nav-bar" style="display: flex; justify-content: space-between; gap: 12px;">
          <button class="btn btn-secondary" id="btn-exam-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ← Previous
          </button>
          ${this.currentIndex < this.questions.length - 1 ? `
            <button class="btn btn-primary" id="btn-exam-next">Next →</button>
          ` : `
            <button class="btn btn-primary" id="btn-exam-submit" style="background: #38b000; border-color: #38b000;">
              Finish & Submit ✅
            </button>
          `}
        </div>
      </div>`;

    container.querySelectorAll('.exam-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceId = btn.dataset.choiceId;
        this.userAnswers[this.currentIndex] = choiceId === 'true' ? true : choiceId === 'false' ? false : parseInt(choiceId);
        this.renderQuestion();
      });
    });

    document.getElementById('btn-exam-prev')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderQuestion();
      }
    });

    document.getElementById('btn-exam-next')?.addEventListener('click', () => {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.renderQuestion();
      }
    });

    document.getElementById('btn-exam-submit')?.addEventListener('click', () => {
      this.submitExam();
    });
  },

  async submitExam() {
    clearInterval(this.timerInterval);
    this.isCompleted = true;

    let correctCount = 0;
    const reviewData = [];

    this.questions.forEach((q, idx) => {
      const userAns = this.userAnswers[idx];
      const selectedChoice = q.choices.find(c => c.id === userAns);
      const isCorrect = selectedChoice?.isCorrect || false;

      if (isCorrect) correctCount++;

      GameQuestionService.recordAnswer(q.id, isCorrect, 'exam');

      reviewData.push({
        question: q,
        userAns: selectedChoice ? selectedChoice.text : 'No Answer',
        isCorrect
      });
    });

    const total = this.questions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const passed = scorePct >= 75;

    // Persist score
    await DB.add('gameScores', {
      score: scorePct,
      correct: correctCount,
      total,
      mode: 'exam',
      passed,
      date: new Date().toISOString()
    });

    this.renderResult(scorePct, correctCount, total, passed, reviewData);
  },

  renderResult(scorePct, correctCount, total, passed, reviewData) {
    const container = document.getElementById('exam-mode-body');
    if (!container) return;

    container.innerHTML = `
      <div class="exam-result-container" style="max-width: 520px; margin: 0 auto;">
        <div class="card" style="text-align: center; padding: 28px 16px; margin-bottom: 20px; border: 2px solid ${passed ? '#38b000' : '#e63946'};">
          <div style="font-size: 52px; margin-bottom: 10px;">${passed ? '🏆' : '📚'}</div>
          <h2 style="font-size: 26px; color: ${passed ? '#38b000' : '#e63946'}; margin-bottom: 6px;">
            ${passed ? 'EXAMINATION PASSED!' : 'NEEDS PRACTICE'}
          </h2>
          <div style="font-size: 38px; font-weight: 900; color: #ffd166; margin-bottom: 12px;">${scorePct}%</div>
          <p class="text-muted">You answered <strong>${correctCount} out of ${total}</strong> questions correctly.</p>
          <div style="display: flex; gap: 12px; justify-content: center; margin-top: 18px;">
            <button class="btn btn-primary" id="btn-retake-exam">Retake Exam 🔄</button>
            <button class="btn btn-secondary" onclick="window.location.hash='#play'">All Modes</button>
          </div>
        </div>

        <h3 style="margin-bottom: 12px;">Detailed Item Review</h3>
        <div class="review-items" style="display: flex; flex-direction: column; gap: 12px;">
          ${reviewData.map((item, idx) => `
            <div class="card" style="padding: 16px; border-left: 4px solid ${item.isCorrect ? '#38b000' : '#e63946'};">
              <div style="font-weight: bold; margin-bottom: 6px; font-size: 15px;">
                ${idx + 1}. ${this.escape(item.question.text)}
              </div>
              <div style="font-size: 14px; margin-bottom: 4px;">
                Your Answer: <span style="color: ${item.isCorrect ? '#38b000' : '#e63946'}; font-weight: 600;">${this.escape(item.userAns)}</span>
              </div>
              ${!item.isCorrect ? `
                <div style="font-size: 14px; margin-bottom: 6px;">
                  Correct Answer: <span style="color: #38b000; font-weight: 600;">
                    ${this.escape(item.question.choices.find(c => c.isCorrect)?.text || '')}
                  </span>
                </div>
              ` : ''}
              <div style="font-size: 13px; color: #a0a0b0; background: rgba(255,255,255,0.04); padding: 8px; border-radius: 6px;">
                💡 <strong>Explanation:</strong> ${this.escape(item.question.explanation)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;

    document.getElementById('btn-retake-exam')?.addEventListener('click', () => {
      this.init();
    });
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default ExamChallengeMode;

