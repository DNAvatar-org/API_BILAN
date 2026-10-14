// File: API_BILAN/demo/scie_main.js - Démarrage de la page et pont postMessage
// Desc: Le DÉMARRAGE, en dernier : j'écoute les messages de la page parente, j'envoie le tuning initial et je
//       monte la page au DOMContentLoaded. Tout ce dont j'ai besoin est défini par les fichiers ci-dessus.
// Version 1.2.0
//   - v1.2.0 (2026-10-13): sync:tuning et réglage envoyé au parent = tout baryByGroup (jauges séparées).
// Date: 2026-10-12
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.


window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'resize-iframe') {
        const iframe = event.data.source === 'alphabet' 
            ? document.getElementById('alphabet-iframe')
            : document.getElementById('dico-iframe');
        if (iframe && event.data.height) {
            iframe.style.height = event.data.height + 'px';
        }
    }
    // Iframe de CO2 : l'état est celui du parent. À chaque époque qu'il pose (setEpoch → syncToScie), le miroir
    // prend la même (CLICS.passer : compteurs à zéro, comme chez lui) ; le reste arrive avec compute:done.
    if (event.data && event.data.type === 'sync:state') {
        window.CLICS.passer(event.data.payload.epochId);
        window.DATA['🔘']['🔘🎞'] = event.data.payload.animEnabled;
    }
    if (event.data && event.data.type === 'compute:done') {
        var DATA = event.data.DATA;
        if (DATA && window !== window.top) {
            Object.keys(DATA).forEach(function (k) { window.DATA[k] = DATA[k]; });
            // Ne pas réinitialiser baryByGroup.SOLVER : conserver le réglage utilisateur (ex. 100%)
            window.TUNING.fillDataTuningFromBary();
            displayResults(window.DATA);
            displayConvergence();
        }
    }
    if (event.data && event.data.type === 'convergence:clear') {
        clearConvergenceTrace();
    }
    if (event.data && event.data.type === 'convergence:append') {
        var step = event.data.step;
        if (step) appendConvergenceStep(step);
    }
    if (event.data && event.data.type === 'convergence:restore') {
        var stepsHtml = event.data.stepsHtml;
        if (Array.isArray(stepsHtml) && stepsHtml.length > 0) {
            clearConvergenceTrace();
            var stepsEl = document.getElementById('convergence-steps');
            if (stepsEl) stepsHtml.forEach(function (html) { stepsEl.insertAdjacentHTML('beforeend', html); });
            displayConvergence();
        }
    }
    if (event.data && event.data.type === 'sync:tuning') {
        window.TUNING.applyTuningPayload(event.data.payload);
        if (!syncFineTuningSlidersFromBary()) {
            displayFineTuning();
        }
    }
});

/** Le réglage courant, tel que l'attend le parent (sync:tuning). Une seule fabrique (il y en avait trois). */
function tuningPayload(run) {
    return { baryByGroup: Object.assign({}, window.DATA['🎚️'].baryByGroup), run: run };
}

// Démarrage, appelé par le loader commun quand tout est chargé. Deux hôtes, deux démarrages (chaque page dit le sien) :
/** Iframe de CO2 : réglage nominal envoyé au parent, qui fait le 1er calcul et pousse son DATA (compute:done). */
function initScieIframe() {
    window.TUNING.fillDataTuningFromBary();
    window.parent.postMessage({ type: 'sync:tuning', payload: tuningPayload(true) }, '*');
}

/** Page démo seule : frise, puis ⚫ préchargé (sans converger : c'est ▶️ qui converge). */
function initScieDemo() {
    window.TUNING.fillDataTuningFromBary();
    generateHorizontalTimeline();
    selectEpoch('⚫');
}
