// js/tools/json-formatter/model.js — pure logic. No DOM.

const SAMPLE = JSON.stringify({
    name: "Shiryu Kit",
    version: "1.0.0",
    tools: [
        "QR Code Generator",
        "Password Generator",
        "Word Counter",
        "JSON Formatter",
        "ATS Resume Cleaner",
        "Resume Templates"
    ],
    free: true,
    stats: { visitors: 0, uptime: 99.9, tags: ["json", "tools", "free"] }
});

const encoder = new TextEncoder();

function resolveIndent(raw) {
    if (raw === 'tab') return '\t';
    return parseInt(raw, 10) || 2;
}

function prettyError(e) {
    return (e && e.message) ? e.message : 'Invalid JSON';
}

export function byteSize(text) {
    return encoder.encode(text || '').length;
}

export function format(text, indentRaw) {
    const src = (text || '').trim();
    if (!src) return { ok: true, empty: true, output: '' };
    try {
        const obj = JSON.parse(src);
        return { ok: true, output: JSON.stringify(obj, null, resolveIndent(indentRaw)) };
    } catch (e) {
        return { ok: false, error: prettyError(e) };
    }
}

export function minify(text) {
    const src = (text || '').trim();
    if (!src) return { ok: true, empty: true, output: '' };
    try {
        const obj = JSON.parse(src);
        return { ok: true, output: JSON.stringify(obj) };
    } catch (e) {
        return { ok: false, error: prettyError(e) };
    }
}

/* ---------- Syntax highlighting ---------- */

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Token order matters: strings first (with optional trailing colon for keys),
// then numbers, keywords, punctuation.
const TOKEN_RE = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}\[\],:])/g;

/**
 * Convert raw text into HTML with token spans for syntax highlighting.
 * Works on both valid and invalid JSON — unmatched text stays uncolored.
 */
export function highlight(text) {
    if (!text) return '';

    let html = '';
    let lastIndex = 0;
    let match;

    TOKEN_RE.lastIndex = 0;

    while ((match = TOKEN_RE.exec(text)) !== null) {
        // Text before the match — plain, escaped
        if (match.index > lastIndex) {
            html += escapeHtml(text.slice(lastIndex, match.index));
        }

        const [, str, colon, num, bool, nul, punct] = match;

        if (str !== undefined) {
            if (colon !== undefined) {
                // Key: string + colon
                html += `<span class="json-key">${escapeHtml(str)}</span>`;
                html += `<span class="json-punctuation">${escapeHtml(colon)}</span>`;
            } else {
                html += `<span class="json-string">${escapeHtml(str)}</span>`;
            }
        } else if (num !== undefined) {
            html += `<span class="json-number">${escapeHtml(num)}</span>`;
        } else if (bool !== undefined) {
            html += `<span class="json-boolean">${escapeHtml(bool)}</span>`;
        } else if (nul !== undefined) {
            html += `<span class="json-null">${escapeHtml(nul)}</span>`;
        } else if (punct !== undefined) {
            html += `<span class="json-punctuation">${escapeHtml(punct)}</span>`;
        }

        lastIndex = TOKEN_RE.lastIndex;
    }

    if (lastIndex < text.length) {
        html += escapeHtml(text.slice(lastIndex));
    }

    // Trailing newline needs an extra one so the last line renders
    if (text.endsWith('\n')) html += '\n';

    return html;
}

export { SAMPLE };