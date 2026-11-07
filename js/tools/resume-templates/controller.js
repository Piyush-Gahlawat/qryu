// js/tools/resume-templates/controller.js

import * as Model from './model.js';
import * as View from './view.js';
import { copyText } from '../../shared/helpers.js';

const inputEl = document.getElementById('resume-input');
const btnSubheading = document.getElementById('btn-subheading');
const btnBullet = document.getElementById('btn-bullet');

let currentTemplate = 'classic';
let currentData = { name: '', contact: '', sections: [] };

// ===== Core refresh =====

function refresh() {
    currentData = Model.parseResume(inputEl.value);
    View.renderResume(currentData);
    updateButtonStates();
}

function selectTemplate(template) {
    currentTemplate = template;
    View.setTemplate(template);
}

// ===== Cursor / selection helpers =====

function getSelectionLines() {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const text = inputEl.value;

    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const block = text.slice(lineStart, lineEnd);
    return {
        lineStart,
        lineEnd,
        block,
        lines: block.split('\n'),
        text
    };
}

function getCurrentLine() {
    const pos = inputEl.selectionStart;
    const text = inputEl.value;
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    let lineEnd = text.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = text.length;
    return text.slice(lineStart, lineEnd);
}

// ===== Format detection =====

function isFullyBold(line) {
    const t = line.trim();
    if (!/^\*\*.+\*\*$/.test(t)) return false;
    const inner = t.slice(2, -2);
    return !inner.includes('**');  // no nested bold
}

function hasInnerBold(line) {
    const t = line.trim();
    return t.includes('**') && !isFullyBold(line);
}

function isBullet(line) {
    return line.startsWith('- ');
}

// ===== Toggle: Subheading =====

function toggleSubheading() {
    const { lineStart, lineEnd, lines, text } = getSelectionLines();

    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length === 0) return;

    const allBold = nonEmpty.every(l => isFullyBold(l));

    const newLines = lines.map(l => {
        if (l.trim() === '') return l;

        if (allBold) {
            // Unwrap
            return l.trim().match(/^\*\*(.+)\*\*$/)[1];
        }

        // Wrap. Skip lines with inner bold to avoid corruption.
        if (hasInnerBold(l)) return l;

        let content = l.trim();
        if (content.startsWith('- ')) content = content.slice(2).trim();
        return `**${content}**`;
    });

    const newBlock = newLines.join('\n');
    inputEl.value = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);
    inputEl.selectionStart = lineStart;
    inputEl.selectionEnd = lineStart + newBlock.length;
    inputEl.focus();
    refresh();
}

// ===== Toggle: Bullet =====

function toggleBullet() {
    const { lineStart, lineEnd, lines, text } = getSelectionLines();

    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length === 0) return;

    const allBulleted = nonEmpty.every(l => isBullet(l));

    const newLines = lines.map(l => {
        if (l.trim() === '') return l;
        if (allBulleted) {
            return isBullet(l) ? l.slice(2) : l;
        } else {
            return isBullet(l) ? l : '- ' + l;
        }
    });

    const newBlock = newLines.join('\n');
    inputEl.value = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);
    inputEl.selectionStart = lineStart;
    inputEl.selectionEnd = lineStart + newBlock.length;
    inputEl.focus();
    refresh();
}

// ===== Button state sync =====

function updateButtonStates() {
    const line = getCurrentLine();
    const trimmed = line.trim();

    btnSubheading.classList.toggle('active', isFullyBold(line));
    btnBullet.classList.toggle('active', isBullet(line));
}

// ===== Copy + download =====

async function copyResumeText() {
    const text = View.getPreviewText();
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
        const btn = document.getElementById('copy-text-btn');
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1500);
    }
}

function downloadPdf() {
    window.print();
}

// ===== Wiring =====

inputEl.addEventListener('input', refresh);
inputEl.addEventListener('click', updateButtonStates);
inputEl.addEventListener('keyup', updateButtonStates);
inputEl.addEventListener('select', updateButtonStates);

btnSubheading.addEventListener('click', toggleSubheading);
btnBullet.addEventListener('click', toggleBullet);

View.events.onTemplateSelect(selectTemplate);
View.events.onDownloadPdf(downloadPdf);
View.events.onCopyText(copyResumeText);

// ===== Init =====
selectTemplate('classic');
refresh();