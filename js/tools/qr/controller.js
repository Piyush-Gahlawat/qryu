// js/tools/qr/controller.js — wires Model + View + library.

import * as Model from './model.js';
import * as View from './view.js';
import { downloadDataUrl } from '../../shared/helpers.js';

function generate() {
    View.clearError();

    const validation = Model.validateInput(View.getInput());
    if (!validation.ok) {
        View.showError(validation.error);
        View.focusInput();
        return;
    }

    if (typeof QRCode === 'undefined') {
        View.showError('QR library failed to load. Check your connection and refresh.');
        return;
    }

    View.clearQR();
    View.hideDownloadButton();

    try {
        const options = Model.buildOptions(validation.value);
        options.correctLevel = QRCode.CorrectLevel[options.correctLevel];
        new QRCode(View.getQRContainer(), options);

        setTimeout(() => {
            View.showDownloadButton(Model.buildFilename(validation.value));
        }, 50);
    } catch (err) {
        console.error(err);
        View.showError('Could not generate QR code. Please try again.');
    }
}

function downloadQR() {
    const dataUrl = View.getQRDataUrl();
    if (!dataUrl) {
        View.showError('Nothing to download yet — generate a QR code first.');
        return;
    }
    downloadDataUrl(dataUrl, View.getDownloadFilename());
}

View.events.onGenerate(generate);
View.events.onEnterKey(generate);
View.events.onDownload(downloadQR);