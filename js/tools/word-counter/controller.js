// js/tools/word-counter/controller.js — wires Model + View.

import * as Model from './model.js';
import * as View from './view.js';
import { copyText } from '../../shared/helpers.js';

function refresh() {
    View.renderStats(Model.analyze(View.getText()));
}

function transform(fn) {
    View.setText(fn(View.getText()));
    refresh();
}

async function copyTextToClipboard() {
    const text = View.getText();
    if (!text) return;

    const ok = await copyText(text);
    if (ok) View.flashCopied();
    else View.selectAll();
}

function clearText() {
    if (View.getText() && !confirm('Clear all text?')) return;
    View.setText('');
    refresh();
    View.focusInput();
}

/* Wiring */
View.events.onInput(refresh);
View.events.onUpper(() => transform(Model.toUpper));
View.events.onLower(() => transform(Model.toLower));
View.events.onTitle(() => transform(Model.toTitleCase));
View.events.onSentence(() => transform(Model.toSentenceCase));
View.events.onCopy(copyTextToClipboard);
View.events.onClear(clearText);

/* Init */
refresh();