/**
 * MistakeReviewMode.js — Smart Reviewer & Mistake Tracker for Study Dash.
 * Displays all questions answered incorrectly in any mode, shows full explanations,
 * and allows re-quizzing to clear mistakes from memory.
 */

import { DB } from '../db.js';
import { GameQuestionService } from '../services/GameQuestionService.js';

export const MistakeReviewMode = {
  mistakes: [],

  async init() {
    const container = document.getElementById('mistake-review-body');
    if (!container) return;

    const mistakeLogs = await DB.getAll('mistakeLog');
    const allQuestions = await DB.getAll('questions');
    const subjects = await DB.getAll('subjects');
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    // Match unique questions in mistake log
    const questionIdMap = new Map();
    mistakeLogs.forEach(m => {
      const q = allQuestions.find(item => item.id === m.questionId);
      if (q) {
        questionIdMap.set(q.id, {
          ...q,
          logId: m.id,
          timestamp: m.timestamp
        });
      }
    });

    this.mistakes = Array.from(questionIdMap.values());
    this.render(subjectMap);
  },

  render(subjectMap = new Map()) {
    const container = document.getElementById('mistake-review-body');
    if (!container) return;

    if (this.mistakes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 16px; text-align: center;">
          <div style="font-size: 54px; margin-bottom: 12px;">🌟</div>
          <h3>Clean Slate! No Mistakes Recorded</h3>
          <p class="text-muted" style="max-width: 320px; margin: 0 auto 20px;">
            Any questions you answer incorrectly during runs or exams will automatically appear here for review.
          </p>
          <button class="btn btn-primary" onclick="window.location.hash='#play'">Go Play & Study</button>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="mistakes-container" style="max-width: 540px; margin: 0 auto;">
        <div class="card" style="padding: 14px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: rgba(230, 57, 70, 0.12); border: 1px solid #e63946;">
          <span style="font-weight: 600; color: #ff6b6b;">⚠️ ${this.mistakes.length} Questions to Master</span>
          <button class="btn btn-primary btn-sm" id="btn-practice-all-mistakes">Practice Run 🏃</button>
        </div>

        <div class="mistake-list" style="display: flex; flex-direction: column; gap: 14px;">
          ${this.mistakes.map(q => {
            const subjectName = subjectMap.get(q.subjectId) || 'General';
            let correctText = '';
            if (q.type === 'mcq' && Array.isArray(q.options)) {
              correctText = q.options[q.correctIndex] || 'Option A';
            } else if (q.type === 'truefalse') {
              correctText = q.correct ? 'True' : 'False';
            } else {
              correctText = q.correct || '';
            }

            return `
              <div class="card mistake-card" id="mistake-card-${q.id}" style="padding: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span class="badge badge-secondary">${this.escape(subjectName)}</span>
                  <span class="badge badge-${q.difficulty || 'medium'}">${q.difficulty}</span>
                </div>

                <h4 style="font-size: 15px; line-height: 1.4; color: #ffffff; margin-bottom: 12px;">
                  ${this.escape(q.text || q.question || '')}
                </h4>

                <div style="background: rgba(56, 176, 0, 0.12); border-left: 3px solid #38b000; padding: 10px 12px; border-radius: 4px; margin-bottom: 10px;">
                  <span style="font-size: 13px; color: #a0a0b0;">Correct Answer:</span>
                  <div style="font-weight: 600; color: #38b000; font-size: 14px; margin-top: 2px;">
                    ${this.escape(correctText)}
                  </div>
                </div>

                <div style="font-size: 13px; color: #ced4da; line-height: 1.4; margin-bottom: 14px; background: rgba(255,255,255,0.04); padding: 10px; border-radius: 6px;">
                  💡 <strong>Explanation:</strong> ${this.escape(q.explanation || 'No explanation provided.')}
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button class="btn btn-secondary btn-sm btn-clear-single" data-qid="${q.id}">
                    Mark Cleared ✓
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>`;

    // Clear single mistake
    container.querySelectorAll('.btn-clear-single').forEach(btn => {
      btn.addEventListener('click', async () => {
        const qid = parseInt(btn.dataset.qid);
        const allLogs = await DB.getAll('mistakeLog');
        for (const log of allLogs) {
          if (log.questionId === qid) {
            await DB.delete('mistakeLog', log.id);
          }
        }
        this.mistakes = this.mistakes.filter(m => m.id !== qid);
        this.render(subjectMap);
      });
    });

    // Practice all mistakes in endless runner
    document.getElementById('btn-practice-all-mistakes')?.addEventListener('click', () => {
      window.location.hash = '#game';
    });
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default MistakeReviewMode;

