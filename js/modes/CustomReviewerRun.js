/**
 * CustomReviewerRun.js — Configurable Game Run Launcher for Study Dash.
 * Allows students to hand-pick their subject, lesson, difficulty, and question count,
 * then launches the endless runner (or study/exam mode) with ONLY those questions.
 */

import { DB } from '../db.js';
import { State } from '../state.js';
import { Router } from '../router.js';
import { gameManager } from '../game/GameManager.js';

export const CustomReviewerRun = {
  async init() {
    const subjectSelect = document.getElementById('cr-subject');
    if (!subjectSelect) return;

    const subjects = await DB.getAll('subjects');
    subjectSelect.innerHTML = `<option value="">All Subjects</option>` +
      subjects.map(s => `<option value="${s.id}">${this.escape(s.name)}</option>`).join('');

    const form = document.getElementById('custom-run-form');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();

      const subjectId = parseInt(document.getElementById('cr-subject')?.value || '0') || null;
      const difficulty = document.getElementById('cr-difficulty')?.value || null;
      const count = parseInt(document.getElementById('cr-count')?.value || '20');
      const mode = document.querySelector('input[name="cr-mode"]:checked')?.value || 'game';

      const filter = {
        subjectId,
        difficulty,
        count
      };

      // Launch the endless runner with custom subject/lesson filter and selected mode
      Router.navigate('game', { mode, filter });
      gameManager.startGame(mode, filter);
    };
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default CustomReviewerRun;

