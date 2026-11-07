// js/tools/resume-templates/controller.js

import * as Model from './model.js';
import * as View from './view.js';
import { copyText } from '../../shared/helpers.js';

const inputEl = document.getElementById('resume-input');

let currentTemplate = 'classic';
let currentData = { name: '', contact: '', sections: [] };

function refresh() {
    const text = inputEl.value;
    currentData = Model.parseResume(text);
    View.renderResume(currentData);
}

function selectTemplate(template) {
    currentTemplate = template;
    View.setTemplate(template);
}

function downloadPdf() {
    // Use browser print to PDF — ATS-safe because it's text-based
    window.print();
}

async function copyResumeText() {
    const text = View.getPreviewText();
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
        const btn = document.getElementById('copy-text-btn');
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1500);
    }
}

// Wiring
inputEl.addEventListener('input', refresh);

View.events.onTemplateSelect(selectTemplate);
View.events.onDownloadPdf(downloadPdf);
View.events.onCopyText(copyResumeText);

// Init
selectTemplate('classic');
refresh();