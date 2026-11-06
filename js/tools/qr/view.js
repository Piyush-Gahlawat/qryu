// js/tools/qr/view.js — DOM accessors only. No business logic.

const els = {
    input: document.getElementById('qr-input'),
    generateBtn: document.getElementById('generate-btn'),
    downloadBtn: document.getElementById('download-btn'),
    qrContainer: document.getElementById('qr-container'),
    errorMsg: document.getElementById('error-msg')
};

export function getInput() { return els.input.value; }
export function focusInput() { els.input.focus(); }

export function showError(msg) {
    els.errorMsg.textContent = msg;
    els.errorMsg.style.display = 'block';
}
export function clearError() {
    els.errorMsg.textContent = '';
    els.errorMsg.style.display = 'none';
}

export function clearQR() { els.qrContainer.innerHTML = ''; }
export function getQRContainer() { return els.qrContainer; }

export function showDownloadButton(filename) {
    els.downloadBtn.style.display = 'block';
    els.downloadBtn.dataset.filename = filename;
}
export function hideDownloadButton() {
    els.downloadBtn.style.display = 'none';
}

export function getQRDataUrl() {
    const canvas = els.qrContainer.querySelector('canvas');
    if (canvas) return canvas.toDataURL('image/png');
    const img = els.qrContainer.querySelector('img');
    if (img && img.src) return img.src;
    return null;
}

export function getDownloadFilename() {
    return els.downloadBtn.dataset.filename || 'qr-code.png';
}

export const events = {
    onGenerate: (h) => els.generateBtn.addEventListener('click', h),
    onEnterKey: (h) => els.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') h();
    }),
    onDownload: (h) => els.downloadBtn.addEventListener('click', h)
};