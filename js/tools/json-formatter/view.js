// js/tools/json-formatter/view.js — DOM accessors only.

import { highlight } from './model.js';

const els = {
    input: document.getElementById('input'),
    output: document.getElementById('output'),
    inputHL: document.getElementById('input-highlight'),
    outputHL: document.getElementById('output-highlight'),
    indent: document.getElementById('indent'),
    status: document.getElementById('status'),
    inMeta: document.getElementById('in-meta'),
    outMeta: document.getElementById('out-meta'),
    btnFormat: document.getElementById('btn-format'),
    btnMinify: document.getElementById('btn-minify'),
    btnSample: document.getElementById('btn-sample'),
    btnClear: document.getElementById('btn-clear'),
    btnCopy: document.getElementById('btn-copy'),
    btnDownload: document.getElementById('btn-download')
};

/* ---------- Highlight rendering ---------- */

function renderHighlight(el, text) {
    if (!el) return;
    el.innerHTML = highlight(text);
}

function syncScroll(textarea, pre) {
    if (!textarea || !pre) return;
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
}

/* ---------- Reads ---------- */

export function getInput() { return els.input.value; }
export function getOutput() { return els.output.value; }
export function getIndent() { return els.indent.value; }
export function focusInput() { els.input.focus(); }

/* ---------- Writes ---------- */

export function setInput(v) {
    els.input.value = v;
    renderHighlight(els.inputHL, v);
    syncScroll(els.input, els.inputHL);
}

export function setOutput(v) {
    els.output.value = v;
    renderHighlight(els.outputHL, v);
    // Reset output scroll to top when it changes
    els.output.scrollTop = 0;
    els.outputHL.scrollTop = 0;
}

export function refreshInputHighlight() {
    renderHighlight(els.inputHL, els.input.value);
}

export function setMeta(inLabel, outLabel) {
    els.inMeta.textContent = inLabel;
    els.outMeta.textContent = outLabel;
}

export function setStatus(type, msg) {
    els.status.classList.remove('ok', 'err', 'info');
    if (type === 'ok' || type === 'err' || type === 'info') els.status.classList.add(type);
    els.status.textContent = msg || '';
}

export function clearStatus() {
    els.status.className = 'status';
    els.status.textContent = '';
}

export function flashCopy() {
    els.btnCopy.textContent = 'Copied';
    els.btnCopy.classList.add('copied');
    setTimeout(() => {
        els.btnCopy.textContent = 'Copy';
        els.btnCopy.classList.remove('copied');
    }, 1500);
}

export function selectOutput() {
    els.output.select();
    els.output.setSelectionRange(0, 999999);
}

export function clearAll() {
    els.input.value = '';
    els.output.value = '';
    renderHighlight(els.inputHL, '');
    renderHighlight(els.outputHL, '');
}

/* ---------- Events ---------- */

export const events = {
    onInput: (h) => els.input.addEventListener('input', h),
    onInputScroll: (h) => els.input.addEventListener('scroll', h),
    onOutputScroll: (h) => els.output.addEventListener('scroll', h),
    onIndentChange: (h) => els.indent.addEventListener('change', h),
    onFormat: (h) => els.btnFormat.addEventListener('click', h),
    onMinify: (h) => els.btnMinify.addEventListener('click', h),
    onSample: (h) => els.btnSample.addEventListener('click', h),
    onClear: (h) => els.btnClear.addEventListener('click', h),
    onCopy: (h) => els.btnCopy.addEventListener('click', h),
    onDownload: (h) => els.btnDownload.addEventListener('click', h)
};

export function syncInputScroll() {
    syncScroll(els.input, els.inputHL);
}
export function syncOutputScroll() {
    syncScroll(els.output, els.outputHL);
}