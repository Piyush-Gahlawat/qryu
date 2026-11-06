// js/tools/json-formatter/controller.js — wires Model + View.

import * as Model from './model.js';
import * as View from './view.js';
import { formatBytes, copyText, downloadBlob } from '../../shared/helpers.js';

function refreshMeta() {
    View.setMeta(
        formatBytes(Model.byteSize(View.getInput())),
        formatBytes(Model.byteSize(View.getOutput()))
    );
}

function doFormat() {
    const result = Model.format(View.getInput(), View.getIndent());

    if (result.empty) {
        View.setOutput('');
        View.clearStatus();
    } else if (result.ok) {
        View.setOutput(result.output);
        View.setStatus('ok', '✓ Valid JSON — formatted');
    } else {
        View.setOutput('');
        View.setStatus('err', '✗ ' + result.error);
    }
    refreshMeta();
}

function doMinify() {
    const result = Model.minify(View.getInput());

    if (result.empty) {
        View.setOutput('');
        View.clearStatus();
    } else if (result.ok) {
        View.setOutput(result.output);
        View.setStatus('ok', '✓ Valid JSON — minified');
    } else {
        View.setOutput('');
        View.setStatus('err', '✗ ' + result.error);
    }
    refreshMeta();
}

async function doCopy() {
    const text = View.getOutput();
    if (!text) {
        View.setStatus('err', 'Nothing to copy — format some JSON first');
        return;
    }
    const ok = await copyText(text);
    if (ok) View.flashCopy();
    else View.selectOutput();
}

function doDownload() {
    const text = View.getOutput() || View.getInput();
    if (!text) {
        View.setStatus('err', 'Nothing to download');
        return;
    }
    try {
        downloadBlob(new Blob([text], { type: 'application/json' }), 'formatted.json');
    } catch (e) {
        View.setStatus('err', 'Download failed');
    }
}

function doSample() {
    View.setInput(Model.SAMPLE);
    doFormat();
}

function doClear() {
    if (View.getInput() && !confirm('Clear input and output?')) return;
    View.clearAll();
    View.clearStatus();
    refreshMeta();
    View.focusInput();
}

/* Wiring */
View.events.onInput(() => {
    refreshMeta();
    View.clearStatus();
});
View.events.onIndentChange(() => {
    if (View.getOutput()) doFormat();
});
View.events.onFormat(doFormat);
View.events.onMinify(doMinify);
View.events.onCopy(doCopy);
View.events.onDownload(doDownload);
View.events.onSample(doSample);
View.events.onClear(doClear);

/* Init */
refreshMeta();