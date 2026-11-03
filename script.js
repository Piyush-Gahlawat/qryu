// script.js — QR Code Generator

const input = document.getElementById('qr-input');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const qrContainer = document.getElementById('qr-container');
const errorMsg = document.getElementById('error-msg');

/* ---------- Helpers ---------- */

function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function clearError() {
    if (!errorMsg) return;
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
}

function buildFilename(value) {
    const safe = value
        .replace(/^https?:\/\//i, '')      // strip protocol
        .replace(/[^a-z0-9]/gi, '-')       // non-alphanumerics → dash
        .replace(/-+/g, '-')               // collapse dashes
        .slice(0, 30)                      // keep it short
        .replace(/^-+|-+$/g, '');          // trim edges
    return (safe || 'qr-code') + '.png';
}

/* ---------- Generate ---------- */

function generateQR() {
    clearError();

    if (typeof QRCode === 'undefined') {
        showError('QR library failed to load. Check your connection and refresh.');
        return;
    }

    const value = input.value.trim();

    if (!value) {
        showError('Please enter some text or a URL.');
        input.focus();
        return;
    }

    if (value.length > 2000) {
        showError('Text is too long — keep it under 2000 characters.');
        return;
    }

    // Reset previous output
    qrContainer.innerHTML = '';
    downloadBtn.style.display = 'none';

    try {
        new QRCode(qrContainer, {
            text: value,
            width: 320,
            height: 320,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H   // high error correction
        });

        // qrcodejs renders synchronously, but the <img> appears a tick later
        setTimeout(() => {
            const img = qrContainer.querySelector('img');
            if (img && img.src) {
                downloadBtn.style.display = 'inline-block';
                downloadBtn.dataset.filename = buildFilename(value);
            }
        }, 50);
    } catch (err) {
        console.error(err);
        showError('Could not generate QR code. Please try again.');
    }
}

/* ---------- Download ---------- */

function downloadQR() {
    const canvas = qrContainer.querySelector('canvas');
    const img = qrContainer.querySelector('img');
    const name = downloadBtn.dataset.filename || 'qr-code.png';

    let dataUrl = null;

    // Prefer canvas (crisp PNG), fall back to the img data-URL
    if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    } else if (img && img.src) {
        dataUrl = img.src;
    }

    if (!dataUrl) {
        showError('Nothing to download yet — generate a QR code first.');
        return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ---------- Wire up ---------- */

generateBtn.addEventListener('click', generateQR);

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateQR();
});

downloadBtn.addEventListener('click', downloadQR);