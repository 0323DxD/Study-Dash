/**
 * ExportModal.js — User Interface for exporting and backing up study materials.
 */

import { ExportService } from '../services/ExportService.js';
import { openModal, closeModal, showToast } from '../main.js';
import { State } from '../state.js';

export const ExportModal = {
  open() {
    const subjects = State.get('subjects') || [];

    const bodyHtml = `
      <div class="export-modal-container" style="display: flex; flex-direction: column; gap: 14px;">
        <p class="text-muted fs-xs">
          Export your lessons and questions to keep a backup or share with other students.
        </p>

        <div class="form-group">
          <label class="form-label">Export Type</label>
          <select class="form-select" id="export-type-select">
            <option value="all-json">Full Backup (All Subjects, Lessons, Questions, Progress - JSON)</option>
            <option value="questions-csv">Questions as CSV Spreadsheet</option>
            <option value="subject-json">Single Subject Package (JSON)</option>
          </select>
        </div>

        <div class="form-group" id="export-subject-group" style="display: none;">
          <label class="form-label">Select Subject</label>
          <select class="form-select" id="export-subject-id">
            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    openModal({
      title: 'Export Study Materials',
      body: bodyHtml,
      buttons: [
        { label: 'Cancel', action: closeModal },
        {
          label: 'Download Export 📤',
          style: 'btn-primary',
          action: async () => {
            const type = document.getElementById('export-type-select')?.value;
            try {
              if (type === 'all-json') {
                await ExportService.exportAllData();
                showToast('Full backup downloaded!', 'success');
              } else if (type === 'questions-csv') {
                await ExportService.exportQuestionsAsCSV();
                showToast('Questions CSV downloaded!', 'success');
              } else if (type === 'subject-json') {
                const subId = parseInt(document.getElementById('export-subject-id')?.value || '1');
                await ExportService.exportSubject(subId);
                showToast('Subject package downloaded!', 'success');
              }
              closeModal();
            } catch (err) {
              showToast(`Export error: ${err.message}`, 'error');
            }
          }
        }
      ]
    });

    const select = document.getElementById('export-type-select');
    const subGroup = document.getElementById('export-subject-group');
    select?.addEventListener('change', () => {
      if (subGroup) {
        subGroup.style.display = select.value === 'subject-json' ? 'block' : 'none';
      }
    });
  }
};

export default ExportModal;

