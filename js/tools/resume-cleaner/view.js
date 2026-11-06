// js/tools/resume-cleaner/view.js — DOM accessors only.

const dropZone = document.getElementById('drop');
const fileInput = document.getElementById('file-input');
const fileNameEl = document.getElementById('file-name');
const processBtn = document.getElementById('process-btn');
const statusEl = document.getElementById('status');
const statsEl = document.getElementById('stats');

const optOmml = document.getElementById('opt-omml');
const optLatex = document.getElementById('opt-latex');
const optHidden = document.getElementById('opt-hidden');
const optTextbox = document.getElementById('opt-textbox');

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
        textbox: optTextbox.checked
    };
}

/* ---------- Writes ---------- */

export function setFileInfo(name) {
    fileNameEl.textContent = name;
}
export function clearFileInfo() {
    fileNameEl.textContent = '';
}

export function setReady(ready) {
    processBtn.disabled = !ready;
}

export function setStatus(type, msg) {
    statusEl.classList.remove('ok', 'err', 'info');
    if (type === 'ok' || type === 'err' || type === 'info') {
        statusEl.classList.add(type);
    }
    statusEl.textContent = msg || '';
}

export function showStats({ before, after, removed, savingPct }) {
    statBefore.textContent = before;
    statAfter.textContent = after;
    statRemoved.textContent = String(removed);
    statSaving.textContent = savingPct + '%';
    statsEl.classList.add('show');
}

export function hideStats() {
    statsEl.classList.remove('show');
}

/* ---------- Events ---------- */

export const events = {
    onFile: (handler) => {
        // Drop zone interactions
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

        // Click-to-browse
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (f) handler(f);
            fileInput.value = ''; // allow re-selecting the same file
        });
    },

    onProcess: (handler) => processBtn.addEventListener('click', handler)
};