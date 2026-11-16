/**
 * reviewerScreen.js — Comprehensive Lesson Reviewer and Study Material Reader.
 * Displays full lesson content, learning objectives, notes, and attached questions.
 */

import { DB } from '../db.js';
import { State } from '../state.js';
import { Router } from '../router.js';

export const ReviewerScreen = {
  currentLesson: null,
  questions: [],
  currentQIndex: 0,

  async init(params = {}) {
    const titleEl = document.getElementById('reviewer-title');
    const bodyEl = document.getElementById('reviewer-body');
    const curEl = document.getElementById('reviewer-current');
    const totEl = document.getElementById('reviewer-total');
    const prevBtn = document.getElementById('btn-reviewer-prev');
    const nextBtn = document.getElementById('btn-reviewer-next');

    if (!bodyEl) return;

    const lessonId = params.lessonId || (State.get('lessons')[0]?.id);
    if (!lessonId) {
      bodyEl.innerHTML = `<div class="empty-state"><p>No lesson selected.</p></div>`;
      return;
    }

    this.currentLesson = await DB.get('lessons', lessonId);
    if (!this.currentLesson) {
      bodyEl.innerHTML = `<div class="empty-state"><p>Lesson not found.</p></div>`;
      return;
    }

    if (titleEl) titleEl.textContent = this.currentLesson.title;

    const allQuestions = await DB.getAll('questions');
    this.questions = allQuestions.filter(q => q.lessonId === lessonId);
    this.currentQIndex = 0;

    if (curEl) curEl.textContent = this.questions.length > 0 ? '1' : '0';
    if (totEl) totEl.textContent = String(this.questions.length);

    this.render();

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.currentQIndex > 0) {
          this.currentQIndex--;
          this.render();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.currentQIndex < this.questions.length - 1) {
          this.currentQIndex++;
          this.render();
        }
      };
    }
  },

  render() {
    const bodyEl = document.getElementById('reviewer-body');
    const curEl = document.getElementById('reviewer-current');
    const prevBtn = document.getElementById('btn-reviewer-prev');
    const nextBtn = document.getElementById('btn-reviewer-next');

    if (!bodyEl || !this.currentLesson) return;

    if (curEl) curEl.textContent = this.questions.length > 0 ? String(this.currentQIndex + 1) : '0';
    if (prevBtn) prevBtn.disabled = this.currentQIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentQIndex >= this.questions.length - 1;

    const currentQ = this.questions[this.currentQIndex];

    bodyEl.innerHTML = `
      <div class="reviewer-content" style="max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Lesson Material Card -->
        <div class="card" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge badge-primary">LESSON REVIEWER</span>
            <span class="badge badge-${this.currentLesson.difficulty || 'medium'}">${this.currentLesson.difficulty}</span>
          </div>
          <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 8px;">${this.escape(this.currentLesson.title)}</h2>
          ${this.currentLesson.description ? `
            <p class="text-muted" style="margin-bottom: 14px; font-size: 14px;">${this.escape(this.currentLesson.description)}</p>
          ` : ''}

          ${this.currentLesson.objectives ? `
            <div style="background: rgba(67, 97, 238, 0.1); border-left: 3px solid #4361ee; padding: 10px 14px; border-radius: 4px; margin-bottom: 14px; font-size: 13px;">
              <strong>🎯 Learning Objectives:</strong>
              <div style="margin-top: 4px; color: #ced4da;">${this.escape(this.currentLesson.objectives)}</div>
            </div>
          ` : ''}

          <div class="lesson-rich-content" style="color: #e0e0e0; font-size: 14px; line-height: 1.6; background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; white-space: pre-wrap;">
${this.escape(this.currentLesson.content || this.currentLesson.notes || 'No extended lesson text provided.')}
          </div>

          <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" id="btn-study-this-now">Study This in Runner 🏃</button>
            <button class="btn btn-secondary btn-sm" id="btn-flashcard-this">Open Flashcards 🃏</button>
          </div>
        </div>

        <!-- Attached Questions Section -->
        ${currentQ ? `
          <div class="card" style="padding: 20px; border: 1px solid rgba(255,255,255,0.12);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span class="badge badge-secondary">Question ${this.currentQIndex + 1} of ${this.questions.length}</span>
              <span class="badge badge-info">${currentQ.type.toUpperCase()}</span>
            </div>
            
            <h3 style="font-size: 16px; color: #ffffff; line-height: 1.4; margin-bottom: 14px;">
              ${this.escape(currentQ.text || currentQ.question || '')}
            </h3>

            ${currentQ.type === 'mcq' && Array.isArray(currentQ.options) ? `
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
                ${currentQ.options.map((opt, i) => `
                  <div style="padding: 10px 14px; border-radius: 6px; font-size: 14px; background: ${i === currentQ.correctIndex ? 'rgba(56, 176, 0, 0.15)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${i === currentQ.correctIndex ? '#38b000' : 'transparent'};">
                    <strong>${['A', 'B', 'C', 'D'][i]}.</strong> ${this.escape(opt)}
                    ${i === currentQ.correctIndex ? '<span style="color:#38b000; font-weight: bold; margin-left: 6px;">✓ Correct</span>' : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="font-size: 13px; color: #a0a0b0; background: rgba(255,255,255,0.04); padding: 10px; border-radius: 6px;">
              💡 <strong>Explanation:</strong> ${this.escape(currentQ.explanation || 'No explanation provided.')}
            </div>
          </div>
        ` : `
          <div class="card" style="padding: 16px; text-align: center;">
            <p class="text-muted">No questions attached to this lesson yet.</p>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#addQuestion'">+ Attach Question</button>
          </div>
        `}

      </div>`;

    document.getElementById('btn-study-this-now')?.addEventListener('click', () => {
      Router.navigate('game', { mode: 'custom', filter: { lessonId: this.currentLesson.id } });
    });

    document.getElementById('btn-flashcard-this')?.addEventListener('click', () => {
      Router.navigate('studyMode', { lessonId: this.currentLesson.id });
    });
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default ReviewerScreen;

