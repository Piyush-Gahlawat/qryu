// js/tools/password/view.js — DOM accessors only. No business logic.

const els = {
    output: document.getElementById('output'),
    length: document.getElementById('length'),
    lenVal: document.getElementById('len-val'),
    upper: document.getElementById('opt-upper'),
    lower: document.getElementById('opt-lower'),
    numbers: document.getElementById('opt-numbers'),
    symbols: document.getElementById('opt-symbols'),
    ambiguous: document.getElementById('opt-ambiguous'),
    generateBtn: document.getElementById('generate-btn'),
    copyBtn: document.getElementById('copy-btn'),
    strength: document.getElementById('strength')
};

export function getOptions() {
    return {
        length: parseInt(els.length.value, 10),
        upper: els.upper.checked,
        lower: els.lower.checked,
        numbers: els.numbers.checked,
        symbols: els.symbols.checked,
        excludeAmbiguous: els.ambiguous.checked
    };
}

export function getLength() { return parseInt(els.length.value, 10); }

export function setLengthLabel(n) { els.lenVal.textContent = String(n); }

export function setPassword(text) {
    els.output.value = text;
    els.output.classList.toggle('placeholder', !text);
}

export function getPassword() { return els.output.value; }

export function setStrength(label, cls, bits) {
    els.strength.classList.remove('weak', 'good', 'strong');
    if (!label) {
        els.strength.textContent = '';
        return;
    }
    els.strength.textContent = `Strength: ${label} (~${bits} bits)`;
    els.strength.classList.add(cls);
}

let copyTimeout;
export function flashCopied() {
    clearTimeout(copyTimeout);
    els.copyBtn.textContent = 'Copied';
    els.copyBtn.classList.add('copied');
    copyTimeout = setTimeout(() => {
        els.copyBtn.textContent = 'Copy';
        els.copyBtn.classList.remove('copied');
    }, 1500);
}

export function selectOutput() {
    els.output.select();
    els.output.setSelectionRange(0, 99999);
}

export const events = {
    onLengthChange: (h) => els.length.addEventListener('input', h),
    onOptionChange: (h) => {
        [els.upper, els.lower, els.numbers, els.symbols, els.ambiguous]
            .forEach((el) => el.addEventListener('change', h));
    },
    onGenerate: (h) => els.generateBtn.addEventListener('click', h),
    onCopy: (h) => els.copyBtn.addEventListener('click', h)
};