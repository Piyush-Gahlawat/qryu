// js/tools/resume-cleaner/controller.js — wires Model + View.

import * as Model from './model.js';
import * as View from './view.js';
import { formatBytes, downloadBlob } from '../../shared/helpers.js';

let selectedFile = null;

/* ---------- File selection ---------- */

View.events.onFile((file) => {
    const validation = Model.validateFile(file);

    if (!validation.ok) {
        selectedFile = null;
        View.clearFileInfo();
        View.setReady(false);
        View.hideStats();
        View.setStatus('err', '✗ ' + validation.error);
        return;
    }

    selectedFile = file;
    View.setFileInfo(file.name);
    View.setReady(true);
    View.hideStats();
    View.setStatus('info', 'Ready — click "Clean & Download DOCX"');
});

/* ---------- Process ---------- */

View.events.onProcess(async () => {
    if (!selectedFile) return;

    View.setReady(false);
    View.hideStats();
    View.setStatus('info', 'Processing…');

    try {
        const options = View.getOptions();
        const buffer = await selectedFile.arrayBuffer();
        const result = await Model.processDocx(buffer, options);

        if (!result.ok) {
            View.setStatus('err', '✗ ' + result.error);
            View.setReady(true);
            return;
        }

        const before = selectedFile.size;
        const after = result.blob.size;
        const savingPct = before > 0
            ? Math.round((Math.max(0, before - after) / before) * 100)
            : 0;

        View.showStats({
            before: formatBytes(before),
            after: formatBytes(after),
            removed: result.removedCount,
            savingPct
        });

        downloadBlob(result.blob, Model.outputFilename(selectedFile.name));
        View.setStatus('ok', '✓ Done — cleaned file downloaded');
        View.setReady(true);
    } catch (err) {
        console.error(err);
        View.setStatus('err', '✗ ' + ((err && err.message) ? err.message : 'Something went wrong.'));
        View.setReady(true);
    }
});