// js/tools/json-formatter/model.js — pure logic. No DOM.

const SAMPLE = JSON.stringify({
    name: "QRyu",
    version: "1.0.0",
    builtBy: "Shiryu",
    url: "https://qryu.shiryu.workers.dev",
    tools: [
        "QR Code Generator",
        "Password Generator",
        "Word Counter",
        "JSON Formatter",
        "ATS Resume Cleaner"
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

/** Byte size of a UTF-8 string (works for counting downloaded size too). */
export function byteSize(text) {
    return encoder.encode(text || '').length;
}

/**
 * Format JSON with indentation.
 * Returns:
 *   { ok: true, empty: true, output: '' }       — input was empty
 *   { ok: true, output: '...' }                  — formatted successfully
 *   { ok: false, error: 'message' }              — parse error
 */
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

/**
 * Minify JSON (no whitespace).
 * Same return shape as format().
 */
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

export { SAMPLE };