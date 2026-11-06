// js/tools/resume-cleaner/model.js — pure DOCX/XML logic. No DOM access.
// Depends on global `JSZip` (loaded via <script> in the HTML).

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/* ---------- File validation ---------- */

export function validateFile(file) {
    if (!file) return { ok: false, error: 'No file selected.' };
    if (!file.name.toLowerCase().endsWith('.docx')) {
        return { ok: false, error: 'Please select a .docx file (not .pdf or .doc).' };
    }
    return { ok: true };
}

/* ---------- LaTeX text stripping ---------- */

export function stripLatex(text) {
    let t = text;

    // Display math $$...$$ — remove entirely (math isn't useful to ATS)
    t = t.replace(/\$\$[\s\S]*?\$\$/g, '');

    // Inline math $...$ — remove entirely
    t = t.replace(/\$[^$]*?\$/g, '');

    // Environment wrappers — drop the \begin/\end but KEEP content inside
    t = t.replace(/\\begin\{[^}]+\}/g, ' ');
    t = t.replace(/\\end\{[^}]+\}/g, ' ');

    // Commands with braces — keep content, drop command
    // Looped 3x to handle nested cases like \textbf{\textit{bold italic}}
    for (let i = 0; i < 3; i++) {
        t = t.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^{}]*)\}/g, '$1');
    }

    // Remaining brace-less commands (\item, \newline, etc.) — remove
    t = t.replace(/\\[a-zA-Z]+\*?/g, '');

    // Leftover stray backslashes
    t = t.replace(/\\/g, '');

    // Collapse whitespace
    t = t.replace(/\s{2,}/g, ' ').trim();

    return t;
}
/* ---------- XML helpers ---------- */

function removeElementsNS(doc, ns, tagName) {
    const els = Array.from(doc.getElementsByTagNameNS(ns, tagName));
    els.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
    });
    return els.length;
}

function removeElementsByTag(doc, tagName) {
    const els = Array.from(doc.getElementsByTagNameNS(WORD_NS, tagName));
    els.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
    });
    return els.length;
}

function removeHiddenRuns(doc) {
    const runs = Array.from(doc.getElementsByTagNameNS(WORD_NS, 'r'));
    let removed = 0;
    runs.forEach((run) => {
        const rPr = run.getElementsByTagNameNS(WORD_NS, 'rPr')[0];
        if (!rPr) return;
        const hasVanish =
            rPr.getElementsByTagNameNS(WORD_NS, 'vanish').length > 0 ||
            rPr.getElementsByTagNameNS(WORD_NS, 'webHidden').length > 0;
        if (hasVanish && run.parentNode) {
            run.parentNode.removeChild(run);
            removed++;
        }
    });
    return removed;
}

function stripLatexFromTextNodes(doc) {
    const textNodes = Array.from(doc.getElementsByTagNameNS(WORD_NS, 't'));
    let changed = 0;
    textNodes.forEach((node) => {
        const original = node.textContent || '';
        const cleaned = stripLatex(original);
        if (cleaned !== original) {
            node.textContent = cleaned;
            changed++;
        }
    });
    return changed;
}

/* ---------- Main processing ---------- */

/**
 * Clean a DOCX file's document.xml.
 * @param {ArrayBuffer} arrayBuffer — raw DOCX bytes
 * @param {object} options — { omml, latex, hidden, textbox }
 * @returns {Promise<{ ok: true, blob: Blob, removedCount: number }
 *                  | { ok: false, error: string }>}
 */
export async function processDocx(arrayBuffer, options) {
    if (typeof JSZip === 'undefined') {
        return { ok: false, error: 'JSZip failed to load. Check your connection and refresh.' };
    }

    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docFile = zip.file('word/document.xml');
        if (!docFile) {
            return { ok: false, error: 'This file does not look like a valid .docx (missing word/document.xml).' };
        }

        const xmlText = await docFile.async('text');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        if (xmlDoc.getElementsByTagName('parsererror')[0]) {
            return { ok: false, error: 'Could not parse document XML.' };
        }

        let totalRemoved = 0;

        if (options.omml) {
            totalRemoved += removeElementsNS(xmlDoc, MATH_NS, 'oMath');
            totalRemoved += removeElementsNS(xmlDoc, MATH_NS, 'oMathPara');
        }
        if (options.hidden) {
            totalRemoved += removeHiddenRuns(xmlDoc);
        }
        if (options.textbox) {
            totalRemoved += removeElementsByTag(xmlDoc, 'drawing');
            totalRemoved += removeElementsByTag(xmlDoc, 'pict');
            totalRemoved += removeElementsByTag(xmlDoc, 'object');
            totalRemoved += removeElementsByTag(xmlDoc, 'txbxContent');
        }
        if (options.latex) {
            stripLatexFromTextNodes(xmlDoc);
        }

        const serializer = new XMLSerializer();
        const cleanedXml = serializer.serializeToString(xmlDoc);
        zip.file('word/document.xml', cleanedXml);

        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE'
        });

        return { ok: true, blob, removedCount: totalRemoved };
    } catch (err) {
        console.error(err);
        return { ok: false, error: (err && err.message) ? err.message : 'Processing failed.' };
    }
}

/** Derive a "*-ats.docx" filename from an input filename. */
export function outputFilename(inputName) {
    return inputName.replace(/\.docx$/i, '') + '-ats.docx';
}