// js/tools/resume-cleaner/controller.js — wires Model + View.

import * as Model from './model.js';
import * as View from './view.js';
import { formatBytes, downloadBlob, copyText } from '../../shared/helpers.js';

let selectedFile = null;
let lastBlob = null;

/* ---------- File selection ---------- */

View.events.onFile(async (file) => {
    const validation = Model.validateFile(file);

    if (!validation.ok) {
        selectedFile = null;
        lastBlob = null;
        View.clearFileInfo();
        View.setReady(false);
        View.hideStats();
        View.hideAnalysis();
        View.setStatus('err', '✗ ' + validation.error);
        return;
    }

    selectedFile = file;
    lastBlob = null;
    View.setFileInfo(file.name);
    View.setReady(false);
    View.hideStats();
    View.setStatus('info', 'Analyzing…');

    await analyze();
});

/* ---------- Analysis + clean ---------- */

async function analyze() {
    if (!selectedFile) return;

    try {
        const options = View.getOptions();
        const buffer = await selectedFile.arrayBuffer();
        const result = await Model.processDocx(buffer, options, true);

        if (!result.ok) {
            View.setStatus('err', '✗ ' + result.error);
            View.setReady(false);
            return;
        }

        const label = Model.scoreLabel(result.score);
        View.renderAnalysis(result.issues, result.score, label, result.headers, result.footers);
        View.renderPreview(result.preview);

        lastBlob = result.blob;

        View.showStats({
            before: formatBytes(selectedFile.size),
            after: formatBytes(result.blob.size),
            removed: result.removedCount,
            savingPct: selectedFile.size > 0
                ? Math.round((Math.max(0, selectedFile.size - result.blob.size) / selectedFile.size) * 100)
                : 0
        });

        View.setStatus('ok', '✓ Ready — adjust options or click Clean & Download');
        View.setReady(true);
    } catch (err) {
        console.error(err);
        View.setStatus('err', '✗ ' + ((err && err.message) ? err.message : 'Something went wrong.'));
        View.setReady(false);
    }
}

/* ---------- Download ---------- */

View.events.onProcess(async () => {
    if (!selectedFile || !lastBlob) return;

    downloadBlob(lastBlob, Model.outputFilename(selectedFile.name));
    View.setStatus('ok', '✓ Downloaded — ' + Model.outputFilename(selectedFile.name));
});

/* ---------- Option changes trigger re-analysis ---------- */

View.events.onOptionChange(analyze);

/* ---------- Copy plain text ---------- */

View.events.onCopyPreview(async () => {
    const text = View.getPreviewText();
    if (!text || text === '(empty — nothing would be extracted)') return;

    const ok = await copyText(text);
    if (ok) View.flashCopyPreview();
});