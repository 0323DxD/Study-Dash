/**
 * ImportModal.js — User Interface for importing lessons and questions.
 * Supports CSV, JSON, TXT files, direct paste, format verification, and template downloads.
 */

import { ImportService } from '../services/ImportService.js';
import { ExportService } from '../services/ExportService.js';
import { openModal, closeModal, showToast } from '../main.js';
import { State } from '../state.js';

export const ImportModal = {
  open() {
    const subjects = State.get('subjects') || [];

    const bodyHtml = `
      <div class="import-modal-container" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="import-tabs" style="display: flex; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
          <button class="btn btn-secondary btn-sm active" id="tab-btn-file">📁 File Upload</button>
          <button class="btn btn-secondary btn-sm" id="tab-btn-paste">📋 Paste Data</button>
          <button class="btn btn-secondary btn-sm" id="tab-btn-templates">📥 Templates</button>
        </div>

        <!-- TAB 1: FILE UPLOAD -->
        <div id="tab-content-file" class="import-tab-pane">
          <p class="text-muted fs-xs" style="margin-bottom: 10px;">
            Select a <strong>.csv</strong>, <strong>.json</strong>, or <strong>.txt</strong> file.
            For document files (.docx or .pdf), copy and paste text into the Paste tab or save as text.
          </p>
          <div style="border: 2px dashed #4361ee; border-radius: 8px; padding: 24px; text-align: center; background: rgba(67, 97, 238, 0.05); cursor: pointer;" id="drop-zone">
            <div style="font-size: 32px; margin-bottom: 6px;">📂</div>
            <div style="font-size: 14px; font-weight: 600; color: #ffffff;">Choose a file or drag & drop here</div>
            <div class="text-muted fs-xs" style="margin-top: 4px;">CSV, JSON, or TXT</div>
            <input type="file" id="import-file-input" accept=".csv,.json,.txt" style="display: none;" />
          </div>
          <div id="file-info" style="margin-top: 10px; font-size: 13px; color: #4cc9f0; display: none;"></div>
        </div>

        <!-- TAB 2: PASTE DATA -->
        <div id="tab-content-paste" class="import-tab-pane" style="display: none;">
          <div class="form-group">
            <label class="form-label">Data Format</label>
            <select class="form-select" id="paste-format">
              <option value="csv">CSV Spreadsheet</option>
              <option value="json">JSON Backup / Structure</option>
              <option value="txt">Structured Text (Q: ... A: ... B: ... ANSWER: ...)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Paste Content Here</label>
            <textarea class="form-textarea" id="paste-textarea" rows="6" placeholder="Paste your CSV, JSON, or text here..."></textarea>
          </div>
        </div>

        <!-- TAB 3: TEMPLATES -->
        <div id="tab-content-templates" class="import-tab-pane" style="display: none;">
          <p class="text-muted fs-xs" style="margin-bottom: 14px;">
            Download these pre-formatted sample templates to easily populate your own questions in Excel or any text editor:
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary btn-full" id="btn-dl-csv-template" style="justify-content: center;">
              📄 Download CSV Template
            </button>
            <button class="btn btn-secondary btn-full" id="btn-dl-json-template" style="justify-content: center;">
              📋 Download JSON Template
            </button>
          </div>
        </div>

        <!-- Subject selection if importing loose questions -->
        <div class="form-group" style="margin-top: 6px;">
          <label class="form-label">Target Subject (for CSV / TXT)</label>
          <select class="form-select" id="import-target-subject">
            <option value="">Auto-detect / Use First Subject</option>
            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>

        <div id="import-status" style="font-size: 13px; line-height: 1.4; display: none;"></div>
      </div>
    `;

    openModal({
      title: 'Import Lessons & Questions',
      body: bodyHtml,
      buttons: [
        { label: 'Cancel', action: closeModal },
        {
          label: 'Import Data 📥',
          style: 'btn-primary',
          action: async () => {
            await this.executeImport();
          }
        }
      ]
    });

    this.wireEvents();
  },

  wireEvents() {
    const fileTab = document.getElementById('tab-btn-file');
    const pasteTab = document.getElementById('tab-btn-paste');
    const tplTab = document.getElementById('tab-btn-templates');

    const filePane = document.getElementById('tab-content-file');
    const pastePane = document.getElementById('tab-content-paste');
    const tplPane = document.getElementById('tab-content-templates');

    const setTab = (activeBtn, activePane) => {
      [fileTab, pasteTab, tplTab].forEach(b => b.classList.remove('active'));
      [filePane, pastePane, tplPane].forEach(p => p.style.display = 'none');
      activeBtn.classList.add('active');
      activePane.style.display = 'block';
    };

    fileTab?.addEventListener('click', () => setTab(fileTab, filePane));
    pasteTab?.addEventListener('click', () => setTab(pasteTab, pastePane));
    tplTab?.addEventListener('click', () => setTab(tplTab, tplPane));

    // File input trigger
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('import-file-input');
    const fileInfo = document.getElementById('file-info');

    dropZone?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && fileInfo) {
        fileInfo.style.display = 'block';
        fileInfo.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
      }
    });

    // Template downloads
    document.getElementById('btn-dl-csv-template')?.addEventListener('click', () => {
      ExportService.downloadFile('study-dash-template.csv', ImportService.generateCSVTemplate(), 'text/csv');
      showToast('CSV template downloaded', 'success');
    });

    document.getElementById('btn-dl-json-template')?.addEventListener('click', () => {
      ExportService.downloadFile('study-dash-template.json', ImportService.generateJSONTemplate(), 'application/json');
      showToast('JSON template downloaded', 'success');
    });
  },

  async executeImport() {
    const statusEl = document.getElementById('import-status');
    const targetSubjectId = parseInt(document.getElementById('import-target-subject')?.value || '0') || null;

    const fileInput = document.getElementById('import-file-input');
    const pasteText = document.getElementById('paste-textarea')?.value.trim();
    const pasteFormat = document.getElementById('paste-format')?.value || 'csv';

    let content = '';
    let format = 'csv';

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      content = await file.text();
      if (file.name.endsWith('.json')) format = 'json';
      else if (file.name.endsWith('.txt')) format = 'txt';
      else format = 'csv';
    } else if (pasteText) {
      content = pasteText;
      format = pasteFormat;
    } else {
      showToast('Please select a file or paste data to import.', 'warning');
      return;
    }

    try {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ffd166';
        statusEl.textContent = 'Processing and validating learning material...';
      }

      let res;
      if (format === 'json') {
        res = await ImportService.importFromJSON(content);
        showToast(`Imported ${res.importedQuestions || 0} questions!`, 'success');
      } else if (format === 'csv') {
        res = await ImportService.importFromCSV(content, targetSubjectId);
        showToast(`Imported ${res.imported} questions successfully!`, 'success');
      } else if (format === 'txt') {
        res = await ImportService.importFromTXT(content, targetSubjectId);
        showToast(`Imported ${res.imported} questions successfully!`, 'success');
      }

      closeModal();
    } catch (err) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#e63946';
        statusEl.textContent = `Import error: ${err.message}`;
      }
      showToast(`Import failed: ${err.message}`, 'error', 4000);
    }
  }
};

export default ImportModal;

