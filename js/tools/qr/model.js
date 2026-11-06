// js/tools/qr/model.js — pure logic. No DOM access.

const MAX_LENGTH = 2000;

export function validateInput(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
        return { ok: false, error: 'Please enter some text or a URL.' };
    }
    if (trimmed.length > MAX_LENGTH) {
        return { ok: false, error: `Text is too long — keep it under ${MAX_LENGTH} characters.` };
    }
    return { ok: true, value: trimmed };
}

export function buildOptions(value) {
    return {
        text: value,
        width: 320,
        height: 320,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 'H'  // string — controller maps to QRCode.CorrectLevel[level]
    };
}

export function buildFilename(value) {
    const safe = value
        .replace(/^https?:\/\//i, '')
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .slice(0, 30)
        .replace(/^-+|-+$/g, '');
    return (safe || 'qr-code') + '.png';
}