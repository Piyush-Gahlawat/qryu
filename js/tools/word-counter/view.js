// js/tools/word-counter/view.js — DOM accessors only.

const els = {
    input: document.getElementById('input'),
    statWords: document.getElementById('stat-words'),
    statChars: document.getElementById('stat-chars'),
    statNoSpace: document.getElementById('stat-chars-nospace'),
    statSent: document.getElementById('stat-sentences'),
    statPara: document.getElementById('stat-paragraphs'),
    statRead: document.getElementById('stat-reading'),
    btnUpper: document.getElementById('btn-upper'),
    btnLower: document.getElementById('btn-lower'),
    btnTitle: document.getElementById('btn-title'),
    btnSentence: document.getElementById('btn-sentence'),
    btnCopy: document.getElementById('btn-copy'),
    btnClear: document.getElementById('btn-clear')
};

export function getText() { return els.input.value; }
export function setText(t) { els.input.value = t; }
export function focusInput() { els.input.focus(); }
export function selectAll() {
    els.input.select();
    els.input.setSelectionRange(0, 999999);
}

export function renderStats(r) {
    els.statWords.textContent = r.words.toLocaleString();
    els.statChars.textContent = r.chars.toLocaleString();
    els.statNoSpace.textContent = r.charsNoSpace.toLocaleString();
    els.statSent.textContent = r.sentences.toLocaleString();
    els.statPara.textContent = r.paragraphs.toLocaleString();
    els.statRead.textContent = r.readLabel;
}

export function flashCopied() {
    els.btnCopy.textContent = 'Copied';
    els.btnCopy.classList.add('copied');
    setTimeout(() => {
        els.btnCopy.textContent = 'Copy';
        els.btnCopy.classList.remove('copied');
    }, 1500);
}

export const events = {
    onInput: (h) => els.input.addEventListener('input', h),
    onUpper: (h) => els.btnUpper.addEventListener('click', h),
    onLower: (h) => els.btnLower.addEventListener('click', h),
    onTitle: (h) => els.btnTitle.addEventListener('click', h),
    onSentence: (h) => els.btnSentence.addEventListener('click', h),
    onCopy: (h) => els.btnCopy.addEventListener('click', h),
    onClear: (h) => els.btnClear.addEventListener('click', h)
};