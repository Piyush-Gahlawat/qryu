// js/tools/resume-cleaner/model.js — pure DOCX/XML logic. No DOM access.
// Depends on global `JSZip`.

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

/* ---------- File validation ---------- */

export function validateFile(file) {
    if (!file) return { ok: false, error: 'No file selected.' };
    if (!file.name.toLowerCase().endsWith('.docx')) {
        return { ok: false, error: 'Please select a .docx file (not .pdf or .doc).' };
    }
    return { ok: true };
}

/* ---------- LaTeX text stripping (preserves content) ---------- */

export function stripLatex(text) {
    let t = text;

    t = t.replace(/\$\$[\s\S]*?\$\$/g, '');
    t = t.replace(/\$[^$]*?\$/g, '');
    t = t.replace(/\\begin\{[^}]+\}/g, ' ');
    t = t.replace(/\\end\{[^}]+\}/g, ' ');

    for (let i = 0; i < 3; i++) {
        t = t.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^{}]*)\}/g, '$1');
    }

    t = t.replace(/\\[a-zA-Z]+\*?/g, '');
    t = t.replace(/\\/g, '');
    t = t.replace(/\s{2,}/g, ' ');
    return t;
}

/* ---------- ATS analysis (before cleaning) ---------- */

export function analyzeDocument(xmlDoc) {
    const issues = [];

    const tables = xmlDoc.getElementsByTagNameNS(WORD_NS, 'tbl').length;
    if (tables > 0) {
        issues.push({
            type: 'table',
            severity: 'high',
            count: tables,
            label: 'Tables',
            message: `${tables} table${tables > 1 ? 's' : ''} — ATS may scramble text order or skip content`
        });
    }

    const textboxes = xmlDoc.getElementsByTagNameNS(WORD_NS, 'txbxContent').length;
    if (textboxes > 0) {
        issues.push({
            type: 'textbox',
            severity: 'high',
            count: textboxes,
            label: 'Text boxes',
            message: `${textboxes} text box${textboxes > 1 ? 'es' : ''} — ATS often can't read content inside them`
        });
    }

    const drawings = xmlDoc.getElementsByTagNameNS(WORD_NS, 'drawing').length;
    if (drawings > 0) {
        issues.push({
            type: 'drawing',
            severity: 'medium',
            count: drawings,
            label: 'Images/shapes',
            message: `${drawings} image${drawings > 1 ? 's' : ''} or shape${drawings > 1 ? 's' : ''} — can interfere with parsing`
        });
    }

    const omml = xmlDoc.getElementsByTagNameNS(MATH_NS, 'oMath').length;
    if (omml > 0) {
        issues.push({
            type: 'omml',
            severity: 'high',
            count: omml,
            label: 'Math equations',
            message: `${omml} equation${omml > 1 ? 's' : ''} — ATS reads these as garbage characters`
        });
    }

    const runs = Array.from(xmlDoc.getElementsByTagNameNS(WORD_NS, 'r'));
    let hidden = 0;
    runs.forEach(r => {
        const rPr = r.getElementsByTagNameNS(WORD_NS, 'rPr')[0];
        if (rPr && (
            rPr.getElementsByTagNameNS(WORD_NS, 'vanish').length > 0 ||
            rPr.getElementsByTagNameNS(WORD_NS, 'webHidden').length > 0
        )) hidden++;
    });
    if (hidden > 0) {
        issues.push({
            type: 'hidden',
            severity: 'medium',
            count: hidden,
            label: 'Hidden text',
            message: `${hidden} hidden text run${hidden > 1 ? 's' : ''} — invisible to you, readable by ATS`
        });
    }

    const textNodes = Array.from(xmlDoc.getElementsByTagNameNS(WORD_NS, 't'));
    let latexCount = 0;
    textNodes.forEach(t => {
        if (/\\[a-zA-Z]+|\$[^$]+\$/.test(t.textContent)) latexCount++;
    });
    if (latexCount > 0) {
        issues.push({
            type: 'latex',
            severity: 'high',
            count: latexCount,
            label: 'LaTeX residue',
            message: `${latexCount} text run${latexCount > 1 ? 's' : ''} with visible LaTeX commands or math`
        });
    }

    const comments = xmlDoc.getElementsByTagNameNS(WORD_NS, 'commentReference').length;
    if (comments > 0) {
        issues.push({
            type: 'comment',
            severity: 'low',
            count: comments,
            label: 'Comments',
            message: `${comments} comment${comments > 1 ? 's' : ''} — should be removed before submitting`
        });
    }

    return issues;
}

export function computeScore(issues) {
    let score = 100;
    issues.forEach(issue => {
        const penalty = { high: 15, medium: 8, low: 3 }[issue.severity] || 0;
        score -= penalty * Math.min(issue.count, 3);
    });
    return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score) {
    if (score >= 90) return { label: 'Excellent', cls: 'excellent' };
    if (score >= 70) return { label: 'Good', cls: 'good' };
    if (score >= 50) return { label: 'Fair', cls: 'fair' };
    return { label: 'Needs Work', cls: 'poor' };
}

/* ---------- XML helpers ---------- */

function removeElementsNS(doc, ns, tagName) {
    const els = Array.from(doc.getElementsByTagNameNS(ns, tagName));
    els.forEach(el => { if (el.parentNode) el.parentNode.removeChild(el); });
    return els.length;
}

function removeElementsByTag(doc, tagName) {
    const els = Array.from(doc.getElementsByTagNameNS(WORD_NS, tagName));
    els.forEach(el => { if (el.parentNode) el.parentNode.removeChild(el); });
    return els.length;
}

function removeHiddenRuns(doc) {
    const runs = Array.from(doc.getElementsByTagNameNS(WORD_NS, 'r'));
    let removed = 0;
    runs.forEach(run => {
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
    textNodes.forEach(node => {
        const original = node.textContent || '';
        const cleaned = stripLatex(original);
        if (cleaned !== original) {
            node.textContent = cleaned;
            changed++;
        }
    });
    return changed;
}

/* ---------- Boundary-preserving text extraction ----------
 *
 * A DOCX paragraph is a sequence of runs, each holding <w:t> text plus
 * structural markers like <w:br/> (line break), <w:cr/>, and <w:tab/>.
 * Word routinely splits a single visible line across several runs — often
 * at formatting boundaries (a bold word, a spellcheck fix, a manual
 * revision). The <w:br/> that separates "with" from "5+ years" is NOT a
 * text node, so any code that gathers `<w:t>` elements and joins them with
 * the empty string will glue words together: "with5+", "yearsof",
 * "ManagerDS".
 *
 * The fix is to traverse the paragraph in document order, treat <w:t>,
 * <w:br>, <w:cr>, and <w:tab> uniformly, and insert a space at any
 * text-to-text boundary where two non-whitespace characters meet — unless
 * the following character is punctuation, which must not be preceded by a
 * space ("DS Solutions" + ", New Delhi" → "DS Solutions, New Delhi").
 */

function collectTextPieces(p) {
    const pieces = [];
    const doc = p.ownerDocument || p;

    const walker = doc.createTreeWalker(
        p,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                if (node.namespaceURI !== WORD_NS) return NodeFilter.FILTER_SKIP;
                const name = node.localName;
                if (name === 't' || name === 'br' || name === 'cr' || name === 'tab') {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        }
    );

    let node;
    while ((node = walker.nextNode())) {
        const name = node.localName;
        if (name === 't') {
            pieces.push({ type: 'text', text: node.textContent || '' });
        } else if (name === 'br' || name === 'cr') {
            pieces.push({ type: 'break' });
        } else if (name === 'tab') {
            pieces.push({ type: 'tab' });
        }
    }

    return pieces;
}

function assembleText(pieces, breakReplacement) {
    let out = '';
    let prevType = null;

    for (const piece of pieces) {
        if (piece.type === 'text') {
            const val = piece.text;
            if (prevType === 'text' && out.length > 0 && val.length > 0) {
                const prevChar = out[out.length - 1];
                const nextChar = val[0];
                const nextIsPunct = /[.,;:!?)\]]/.test(nextChar);
                if (/\S/.test(prevChar) && /\S/.test(nextChar) && !nextIsPunct) {
                    out += ' ';
                }
            }
            out += val;
            prevType = 'text';
        } else if (piece.type === 'break') {
            out += breakReplacement;
            prevType = 'break';
        } else if (piece.type === 'tab') {
            out += ' ';
            prevType = 'tab';
        }
    }

    return out;
}

// Single line of text from a paragraph, breaks collapsed to spaces.
function extractParagraphText(p) {
    return assembleText(collectTextPieces(p), ' ').trim();
}

// All paragraphs in a table cell, joined with a space. Paragraph boundaries
// inside a cell become spaces — a flattened table row is one line per row.
function extractCellText(cell) {
    const paragraphs = Array.from(cell.getElementsByTagNameNS(WORD_NS, 'p'));
    return paragraphs
        .map(extractParagraphText)
        .filter(t => t)
        .join(' ');
}

/* ---------- Table flattening (high-impact ATS fix) ---------- */

function makeParagraph(doc, text) {
    const p = doc.createElementNS(WORD_NS, 'w:p');
    const r = doc.createElementNS(WORD_NS, 'w:r');
    const t = doc.createElementNS(WORD_NS, 'w:t');
    t.textContent = text;
    t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    r.appendChild(t);
    p.appendChild(r);
    return p;
}

function flattenTables(doc) {
    // Only top-level tables — skip nested ones (their text is already captured by the parent)
    const tables = Array.from(doc.getElementsByTagNameNS(WORD_NS, 'tbl')).filter(tbl => {
        let p = tbl.parentNode;
        while (p) {
            if (p.localName === 'tbl' && p.namespaceURI === WORD_NS) return false;
            p = p.parentNode;
        }
        return true;
    });

    let count = 0;

    tables.forEach(tbl => {
        const parent = tbl.parentNode;
        if (!parent) return;

        const rows = Array.from(tbl.getElementsByTagNameNS(WORD_NS, 'tr'));

        rows.forEach(row => {
            const cells = Array.from(row.getElementsByTagNameNS(WORD_NS, 'tc'));
            const rowText = cells
                .map(extractCellText)
                .filter(t => t)
                .join(' | ');

            if (rowText) {
                parent.insertBefore(makeParagraph(doc, rowText), tbl);
            }
        });

        parent.removeChild(tbl);
        count++;
    });

    return count;
}

/* ---------- Plain text extraction (for preview) ---------- */

export function extractPlainText(xmlDoc) {
    const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(WORD_NS, 'p'));
    const lines = [];

    paragraphs.forEach(p => {
        const raw = assembleText(collectTextPieces(p), '\n');

        // Normalize: collapse runs of spaces/tabs, trim each line
        const normalized = raw
            .split('\n')
            .map(l => l.replace(/[ \t]+/g, ' ').trim())
            .filter(Boolean)
            .join('\n');

        if (normalized) lines.push(normalized);
    });

    return lines.join('\n');
}

/* ---------- Header / footer detection ---------- */

export async function detectHeadersFooters(zip) {
    const headers = [];
    const footers = [];

    for (const name of Object.keys(zip.files)) {
        if (name.startsWith('word/header') && name.endsWith('.xml')) {
            const content = await zip.file(name).async('text');
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'application/xml');
            const text = Array.from(doc.getElementsByTagNameNS(WORD_NS, 't'))
                .map(t => t.textContent)
                .join(' ')
                .trim();
            if (text) headers.push({ name, text });
        }
        if (name.startsWith('word/footer') && name.endsWith('.xml')) {
            const content = await zip.file(name).async('text');
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'application/xml');
            const text = Array.from(doc.getElementsByTagNameNS(WORD_NS, 't'))
                .map(t => t.textContent)
                .join(' ')
                .trim();
            if (text) footers.push({ name, text });
        }
    }

    return { headers, footers };
}

/* ---------- Main processing ---------- */

/**
 * @param {ArrayBuffer} arrayBuffer
 * @param {object} options — { omml, latex, hidden, textbox, tables, images, comments }
 * @param {boolean} returnPreview — if true, include preview text in result
 */
export async function processDocx(arrayBuffer, options, returnPreview = false) {
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

        // Analyze BEFORE modifying
        const issues = analyzeDocument(xmlDoc);
        const score = computeScore(issues);
        const { headers, footers } = await detectHeadersFooters(zip);

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
        if (options.tables) {
            totalRemoved += flattenTables(xmlDoc);
        }
        if (options.comments) {
            totalRemoved += removeElementsByTag(xmlDoc, 'commentReference');
            totalRemoved += removeElementsByTag(xmlDoc, 'commentRangeStart');
            totalRemoved += removeElementsByTag(xmlDoc, 'commentRangeEnd');
        }
        if (options.latex) {
            stripLatexFromTextNodes(xmlDoc);
        }

        const preview = returnPreview ? extractPlainText(xmlDoc) : null;

        const serializer = new XMLSerializer();
        const cleanedXml = serializer.serializeToString(xmlDoc);
        zip.file('word/document.xml', cleanedXml);

        // Optionally strip media files (images embedded in doc)
        if (options.images) {
            Object.keys(zip.files).forEach(name => {
                if (name.startsWith('word/media/')) {
                    zip.remove(name);
                }
            });
        }

        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE'
        });

        return {
            ok: true,
            blob,
            removedCount: totalRemoved,
            issues,
            score,
            preview,
            headers,
            footers
        };
    } catch (err) {
        console.error(err);
        return { ok: false, error: (err && err.message) ? err.message : 'Processing failed.' };
    }
}

export function outputFilename(inputName) {
    return inputName.replace(/\.docx$/i, '') + '-ats.docx';
}
