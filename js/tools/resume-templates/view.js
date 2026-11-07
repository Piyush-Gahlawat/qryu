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
        html += `<div class="resume-section-content">${renderSectionContent(section.content)}</div>`;
        html += `</div>`;
    });

    previewEl.innerHTML = html;
}

export function getPreviewText() {
    return previewEl.innerText;
}

// ===== Section content rendering =====

// Merge lines that are continuations of the previous line.
// A "continuation" is any line that does NOT start with a new-item marker
// (`-`, `**`, `#`, or `1.`), UNLESS the previous line ended with `**`
// (meaning the previous line was a bold-only heading-like item).
function mergeContinuations(lines) {
    const merged = [];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const isNewItem = /^[-•*·]\s|^\*\*|^#|^\d+[.)]\s/.test(line);
        const prevEndsWithBold = merged.length > 0 && /\*\*\s*$/.test(merged[merged.length - 1]);

        if (isNewItem || merged.length === 0 || prevEndsWithBold) {
            merged.push(line);
        } else {
            merged[merged.length - 1] += ' ' + line;
        }
    }
    return merged;
}

function renderSectionContent(content) {
    const lines = mergeContinuations(content.split('\n'));
    const parts = [];
    let bulletGroup = [];

    const flushBullets = () => {
        if (bulletGroup.length > 0) {
            parts.push('<ul>' + bulletGroup.map(b => `<li>${b}</li>`).join('') + '</ul>');
            bulletGroup = [];
        }
    };

    for (const line of lines) {
        const bulletMatch = line.match(/^[-•*·]\s+(.+)$/);
        if (bulletMatch) {
            bulletGroup.push(renderInlineFormatting(bulletMatch[1]));
            continue;
        }
        flushBullets();
        parts.push(`<p>${renderInlineFormatting(line)}</p>`);
    }
    flushBullets();

    return parts.join('');
}

// Convert **text** markdown to <strong>text</strong> after HTML-escaping.
// The escape happens first, so any user text is safe before we inject our tags.
function renderInlineFormatting(text) {
    let escaped = escapeHtml(text);
    // Bold: **...** → <strong>...</strong>
    escaped = escaped.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    return escaped;
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
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}