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

      if (mode === 'studyMode') {
        Router.navigate('studyMode', filter);
      } else if (mode === 'examChallenge') {
        Router.navigate('examChallenge', filter);
      } else if (mode === 'timeAttack') {
        Router.navigate('timeAttack', filter);
      } else {
        // Endless Runner
        Router.navigate('game', { mode: 'custom', filter });
        gameManager.startGame('custom', filter);
      }
    };
  },

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default CustomReviewerRun;

