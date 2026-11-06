// js/tools/word-counter/model.js — pure text analysis. No DOM.

const WORDS_PER_MIN = 225;

/**
 * Analyze a block of text.
 * Returns { words, chars, charsNoSpace, sentences, paragraphs, readLabel }
 */
export function analyze(text) {
    const trimmed = (text || '').trim();

    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;

    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    const sentences = trimmed
        ? ((trimmed.match(/[^.!?]+[.!?]+/g) || []).length || 1)
        : 0;

    const paragraphs = trimmed
        ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
        : 0;

    let readMin = 0;
    if (words > 0) readMin = Math.max(1, Math.round(words / WORDS_PER_MIN));
    const readLabel = readMin === 0 ? '0m' : (readMin < 1 ? '<1m' : readMin + 'm');

    return { words, chars, charsNoSpace, sentences, paragraphs, readLabel };
}

/* Text transformations */

export function toUpper(text) { return text.toUpperCase(); }
export function toLower(text) { return text.toLowerCase(); }

export function toTitleCase(text) {
    return text.replace(/\w\S*/g, (w) =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
}

export function toSentenceCase(text) {
    return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
}