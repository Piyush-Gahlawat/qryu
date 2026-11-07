// js/tools/resume-templates/view.js

const previewEl = document.getElementById('resume-preview');
const templateBtns = document.querySelectorAll('.template-btn');

export function setTemplate(template) {
    previewEl.className = 'resume-preview template-' + template;
    templateBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === template);
    });
}

export function renderResume(data) {
    if (!data.name && data.sections.length === 0) {
        previewEl.innerHTML = '<p class="placeholder-text">Paste resume text above to see the preview.</p>';
        return;
    }

    let html = '';

    if (data.name) {
        html += `<div class="resume-name">${escapeHtml(data.name)}</div>`;
    }
    if (data.contact) {
        html += `<div class="resume-contact">${escapeHtml(data.contact)}</div>`;
    }

    data.sections.forEach(section => {
        html += `<div class="resume-section">`;
        html += `<div class="resume-section-heading">${escapeHtml(section.heading)}</div>`;
        html += `<div class="resume-section-content">${escapeHtml(section.content)}</div>`;
        html += `</div>`;
    });

    previewEl.innerHTML = html;
}

export function getPreviewText() {
    return previewEl.innerText;
}

export const events = {
    onTemplateSelect: (handler) => {
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => handler(btn.dataset.template));
        });
    },
    onDownloadPdf: (handler) => {
        document.getElementById('download-pdf-btn').addEventListener('click', handler);
    },
    onCopyText: (handler) => {
        document.getElementById('copy-text-btn').addEventListener('click', handler);
    }
};

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}