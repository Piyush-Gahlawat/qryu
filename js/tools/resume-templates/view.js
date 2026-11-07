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
            // Auto-bold: if the bullet content is "Label: rest", bold the label
            const bulletContent = autoBoldLabel(bulletMatch[1]);
            bulletGroup.push(renderInlineFormatting(bulletContent));
            continue;
        }
        flushBullets();
        parts.push(`<p>${renderInlineFormatting(line)}</p>`);
    }
    flushBullets();

    return parts.join('');
}

/**
 * If `content` matches "Label: rest" (short label, no inner bold, colon
 * followed by whitespace), wrap the label in `**...**` so it renders bold.
 * Otherwise return content unchanged.
 */
function autoBoldLabel(content) {
    // Already has explicit bold at start — respect user's formatting
    if (/^\*\*/.test(content)) return content;

    const colonIdx = content.indexOf(':');
    if (colonIdx === -1) return content;

    // Colon too far from start — likely prose, not a label
    if (colonIdx > 50) return content;

    const label = content.slice(0, colonIdx).trim();
    if (!label) return content;
    if (label.includes('**')) return content;         // has user-emphasized words inside
    if (/[.!?;]$/.test(label)) return content;        // ends with sentence punctuation

    // Char after colon must be whitespace (or end) — rejects "10:30", "http://..."
    const afterColon = content.slice(colonIdx + 1);
    if (afterColon && !/^\s/.test(afterColon)) return content;

    return `**${label}:**${afterColon}`;
}

function renderInlineFormatting(text) {
    let escaped = escapeHtml(text);
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