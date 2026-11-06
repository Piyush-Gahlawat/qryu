// js/tools/json-formatter/view.js — DOM accessors only.

const els = {
    input: document.getElementById('input'),
    output: document.getElementById('output'),
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

export function getInput() { return els.input.value; }
export function setInput(v) { els.input.value = v; }
export function getOutput() { return els.output.value; }
export function setOutput(v) { els.output.value = v; }
export function getIndent() { return els.indent.value; }
export function focusInput() { els.input.focus(); }

export function setMeta(inLabel, outLabel) {
    els.inMeta.textContent = inLabel;
    els.outMeta.textContent = outLabel;
}

export function setStatus(type, msg) {
    els.status.className = 'status' + (type ? ' ' + type : '');
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
}

export const events = {
    onInput: (h) => els.input.addEventListener('input', h),
    onIndentChange: (h) => els.indent.addEventListener('change', h),
    onFormat: (h) => els.btnFormat.addEventListener('click', h),
    onMinify: (h) => els.btnMinify.addEventListener('click', h),
    onSample: (h) => els.btnSample.addEventListener('click', h),
    onClear: (h) => els.btnClear.addEventListener('click', h),
    onCopy: (h) => els.btnCopy.addEventListener('click', h),
    onDownload: (h) => els.btnDownload.addEventListener('click', h)
};