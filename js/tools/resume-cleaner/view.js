// js/tools/resume-cleaner/view.js — DOM accessors only.

const dropZone = document.getElementById('drop');
const fileInput = document.getElementById('file-input');
const fileNameEl = document.getElementById('file-name');
const processBtn = document.getElementById('process-btn');
const statusEl = document.getElementById('status');

const optOmml = document.getElementById('opt-omml');
const optLatex = document.getElementById('opt-latex');
const optHidden = document.getElementById('opt-hidden');
const optTextbox = document.getElementById('opt-textbox');
const optTables = document.getElementById('opt-tables');
const optImages = document.getElementById('opt-images');
const optComments = document.getElementById('opt-comments');

const scoreCard = document.getElementById('score-card');
const scoreValue = document.getElementById('score-value');
const scoreLabel = document.getElementById('score-label');
const issuesList = document.getElementById('issues-list');
const previewPanel = document.getElementById('preview-panel');
const previewText = document.getElementById('preview-text');
const previewCount = document.getElementById('preview-count');
const copyPreviewBtn = document.getElementById('copy-preview-btn');

const statsEl = document.getElementById('stats');
const statBefore = document.getElementById('stat-before');
const statAfter = document.getElementById('stat-after');
const statRemoved = document.getElementById('stat-removed');
const statSaving = document.getElementById('stat-saving');

/* ---------- Reads ---------- */

export function getOptions() {
    return {
        omml: optOmml.checked,
        latex: optLatex.checked,
        hidden: optHidden.checked,
        textbox: optTextbox.checked,
        tables: optTables.checked,
        images: optImages.checked,
        comments: optComments.checked
    };
}

/* ---------- Writes ---------- */

export function setFileInfo(name) { fileNameEl.textContent = name; }
export function clearFileInfo() { fileNameEl.textContent = ''; }
export function setReady(ready) { processBtn.disabled = !ready; }

export function setStatus(type, msg) {
    statusEl.classList.remove('ok', 'err', 'info');
    if (type === 'ok' || type === 'err' || type === 'info') statusEl.classList.add(type);
    statusEl.textContent = msg || '';
}

export function renderAnalysis(issues, score, label, headers, footers) {
    // Score
    scoreCard.className = 'score-card show ' + label.cls;
    scoreValue.textContent = score;
    scoreLabel.textContent = label.label;

    // Issues list
    issuesList.innerHTML = '';

    if (issues.length === 0 && headers.length === 0 && footers.length === 0) {
        const clean = document.createElement('div');
        clean.className = 'issue-none';
        clean.textContent = '✓ No major ATS issues found';
        issuesList.appendChild(clean);
    }

    issues.forEach(issue => {
        const el = document.createElement('div');
        el.className = 'issue severity-' + issue.severity;
        el.innerHTML = `
      <span class="issue-badge">${issue.severity[0].toUpperCase()}</span>
      <div class="issue-body">
        <div class="issue-label">${issue.label} (${issue.count})</div>
        <div class="issue-message">${issue.message}</div>
      </div>
    `;
        issuesList.appendChild(el);
    });

    headers.forEach(h => {
        const el = document.createElement('div');
        el.className = 'issue severity-medium';
        el.innerHTML = `
      <span class="issue-badge">M</span>
      <div class="issue-body">
        <div class="issue-label">Header text found</div>
        <div class="issue-message">"${escapeHtml(h.text.slice(0, 80))}${h.text.length > 80 ? '…' : ''}" — ATS often skips header content</div>
      </div>
    `;
        issuesList.appendChild(el);
    });

    footers.forEach(f => {
        const el = document.createElement('div');
        el.className = 'issue severity-medium';
        el.innerHTML = `
      <span class="issue-badge">M</span>
      <div class="issue-body">
        <div class="issue-label">Footer text found</div>
        <div class="issue-message">"${escapeHtml(f.text.slice(0, 80))}${f.text.length > 80 ? '…' : ''}" — ATS often skips footer content</div>
      </div>
    `;
        issuesList.appendChild(el);
    });
}

export function renderPreview(text) {
    previewPanel.classList.add('show');
    previewText.textContent = text || '(empty — nothing would be extracted)';
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    previewCount.textContent = words + ' words';
}

export function hideAnalysis() {
    scoreCard.classList.remove('show');
    issuesList.innerHTML = '';
    previewPanel.classList.remove('show');
    previewText.textContent = '';
    previewCount.textContent = '';
}

export function showStats({ before, after, removed, savingPct }) {
    statBefore.textContent = before;
    statAfter.textContent = after;
    statRemoved.textContent = String(removed);
    statSaving.textContent = savingPct + '%';
    statsEl.classList.add('show');
}

export function hideStats() { statsEl.classList.remove('show'); }

export function flashCopyPreview() {
    if (!copyPreviewBtn) return;
    const original = copyPreviewBtn.textContent;
    copyPreviewBtn.textContent = 'Copied';
    copyPreviewBtn.classList.add('copied');
    setTimeout(() => {
        copyPreviewBtn.textContent = original;
        copyPreviewBtn.classList.remove('copied');
    }, 1500);
}

export function getPreviewText() { return previewText.textContent; }

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

/* ---------- Events ---------- */

export const events = {
    onFile: (handler) => {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const f = e.dataTransfer.files && e.dataTransfer.files[0];
            if (f) handler(f);
        });
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (f) handler(f);
            fileInput.value = '';
        });
    },

    onProcess: (handler) => processBtn.addEventListener('click', handler),

    onOptionChange: (handler) => {
        [optOmml, optLatex, optHidden, optTextbox, optTables, optImages, optComments]
            .forEach(el => el.addEventListener('change', handler));
    },

    onCopyPreview: (handler) => {
        if (copyPreviewBtn) copyPreviewBtn.addEventListener('click', handler);
    }
};