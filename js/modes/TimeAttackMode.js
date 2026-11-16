/**
 * TimeAttackMode.js — Fast-Paced 60-Second Quiz Race for Study Dash.
 * Features instant question switching, combo multipliers, speed bonuses,
 * and penalty on mistakes.
 */

import { DB } from '../db.js';
import { GameQuestionService } from '../services/GameQuestionService.js';

export const TimeAttackMode = {
  questions: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  timeLeft: 60,
  timerInterval: null,
  isGameOver: false,

  async init(params = {}) {
    const container = document.getElementById('time-attack-body');
    if (!container) return;

    this.score = 0;
    this.streak = 0;
    this.timeLeft = 60;
    this.isGameOver = false;

    let allQuestions = await DB.getAll('questions');
    if (params.lessonId) {
      allQuestions = allQuestions.filter(q => q.lessonId === params.lessonId);
    } else if (params.subjectId) {
      allQuestions = allQuestions.filter(q => q.subjectId === params.subjectId);
    }

    if (allQuestions.length === 0) {
      allQuestions = await DB.getAll('questions');
    }

    this.questions = GameQuestionService.shuffle(allQuestions).map(q => GameQuestionService.formatForGame(q));
    this.currentIndex = 0;

    this.startTimer();
    this.renderQuestion();
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerEl = document.getElementById('ta-timer');
    const scoreEl = document.getElementById('ta-score');

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerEl) timerEl.textContent = Math.max(0, this.timeLeft);
      if (scoreEl) scoreEl.textContent = this.score;

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.endGame();
      }
    }, 1000);
  },

  renderQuestion() {
    const container = document.getElementById('time-attack-body');
    if (!container || this.isGameOver) return;

    if (this.questions.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No questions found.</p></div>`;
      return;
    }

    const q = this.questions[this.currentIndex % this.questions.length];

    container.innerHTML = `
      <div class="time-attack-container" style="max-width: 500px; margin: 0 auto;">
        ${this.streak >= 3 ? `
          <div style="text-align: center; color: #ffbe0b; font-weight: bold; margin-bottom: 8px;">
            🔥 ${this.streak} COMBO! (2X SCORE)
          </div>
        ` : ''}

        <div class="card" style="padding: 20px; margin-bottom: 16px; border: 2px solid #7209b7;">
          <h3 style="font-size: 18px; line-height: 1.4; color: #ffffff; margin-bottom: 20px; text-align: center;">
            ${this.escape(q.text)}
          </h3>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${q.choices.map(c => `
              <button class="ta-choice-btn" data-correct="${c.isCorrect}" style="
                padding: 16px;
                border-radius: 8px;
                background: #2b2b4c;
                border: 2px solid #484875;
                color: #ffffff;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.1s;
              ">
                ${this.escape(c.text)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>`;

    container.querySelectorAll('.ta-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        this.handleAnswer(q, isCorrect, btn);
      });
    });
  },

  handleAnswer(question, isCorrect, btn) {
    GameQuestionService.recordAnswer(question.id, isCorrect, 'timeAttack');

    if (isCorrect) {
      btn.style.background = '#38b000';
      const multiplier = this.streak >= 3 ? 2 : 1;
      this.score += 100 * multiplier;
      this.streak++;
    } else {
      btn.style.background = '#d90429';
      this.timeLeft = Math.max(0, this.timeLeft - 2); // 2s penalty
      this.streak = 0;
    }

    const scoreEl = document.getElementById('ta-score');
    if (scoreEl) scoreEl.textContent = this.score;

    setTimeout(() => {
      this.currentIndex++;
      this.renderQuestion();
    }, 180);
  },

  async endGame() {
    this.isGameOver = true;
    const container = document.getElementById('time-attack-body');
    if (!container) return;

    await DB.add('gameScores', {
      score: this.score,
      mode: 'timeAttack',
      date: new Date().toISOString()
    });

    container.innerHTML = `
      <div class="card" style="max-width: 500px; margin: 0 auto; text-align: center; padding: 32px 16px;">
        <div style="font-size: 54px; margin-bottom: 12px;">⚡</div>
        <h2>TIME UP!</h2>
        <p class="text-muted" style="margin-bottom: 20px;">Fast-paced quiz finished!</p>

        <div style="font-size: 42px; font-weight: 900; color: #ffd166; margin-bottom: 24px;">
          ${this.score} PTS
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-primary" id="btn-restart-ta">Play Again ⚡</button>
          <button class="btn btn-secondary" onclick="window.location.hash='#play'">All Modes</button>
        </div>
      </div>`;

    document.getElementById('btn-restart-ta')?.addEventListener('click', () => {
      this.init();
    });
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default TimeAttackMode;

