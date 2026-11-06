// js/tools/password/controller.js — wires Model + View.

import * as Model from './model.js';
import * as View from './view.js';
import { copyText } from '../../shared/helpers.js';

function regenerate() {
    const result = Model.generate(View.getOptions());

    if (!result.ok) {
        View.setPassword('');
        View.setStrength('', '', 0);
        return;
    }

    View.setPassword(result.password);
    const s = Model.strength(result.password);
    View.setStrength(s.label, s.cls, s.bits);
}

async function copyPassword() {
    const pwd = View.getPassword();
    if (!pwd) return;

    const ok = await copyText(pwd);
    if (ok) {
        View.flashCopied();
    } else {
        // Fallback: select text so the user can Ctrl+C
        View.selectOutput();
    }
}

/* Wiring */
View.events.onLengthChange(() => {
    View.setLengthLabel(View.getLength());
    regenerate();
});
View.events.onOptionChange(regenerate);
View.events.onGenerate(regenerate);
View.events.onCopy(copyPassword);

/* Init */
View.setLengthLabel(View.getLength());
regenerate();