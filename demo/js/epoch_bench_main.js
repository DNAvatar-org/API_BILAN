// File: API_BILAN/demo/epoch_bench_main.js
// Desc: Pont vers la page parente, puis cablage de la page (initEpochBenchPage, appele par le loader).
// Version 2.1.0
// Date: 2026-10-12
// logs :
//   - v2.1.0: ouvrirDetail (popup du fine-tuning) remplace togglePanel.
//   - v2.0.0: PAS DE GARDES. Plus de test « ressources manquantes » (le loader garantit DATA, TIMELINE, CONST,
//     CONV), plus de `window.TUNING &&`, plus de window.DEBUG (journal de CO2/static/debug.js, jamais chargé
//     ici). Jauge unique ATM : __BENCH_FT__.onInput(valeur).
//   - v1.1.0: deux boutons ▶ (Époques / Tictimes) ; les petits ▶️ des jauges sont retirés (applyAndRun) :
//     une jauge règle, un bouton ▶ lance.
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.__BENCH_FT__ = {
    onInput: benchOnFineTuningBaryInput,
    ouvrirDetail: function () {
        document.getElementById('bench-ft-dialog').showModal();
    }
};

// Clic sur la piste d'une jauge loin du curseur : pas de saut de valeur (on ne bouge qu'en tirant le curseur).
document.addEventListener('mousedown', function (e) {
    const el = e.target;
    if (el.id !== 'bench-ft-slider-ATM-header') return;
    const r = el.getBoundingClientRect();
    const pct = (Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min));
    if (Math.abs(e.clientX - (r.left + pct * r.width)) > 15) e.preventDefault();
}, true);

// Réception sync:tuning depuis le parent (sync_panels.js → syncTuningToBench) : jauge et valeurs mises à jour
// sans reconstruire l'en-tête (l'écho de notre propre émission casserait sinon le glissé). Ne relance rien.
window.addEventListener('message', function (e) {
    if (e.data.type !== 'sync:tuning') return;
    window.TUNING.applyTuningPayload(e.data.payload);
    benchSyncFineTuningSlidersFromBary();
});

function initEpochBenchPage() {
    benchDisplayFineTuning();
    const dbgHint = window.UI_STATE.debugAPI
        ? ' — debugAPI : groupes [API_BILAN] calcul'
        : ' — ?debugAPI=true pour logs calcul groupés';
    document.getElementById('footer-info').textContent =
        'Prêt — ' + window.TIMELINE.length + ' époques chargées' + dbgHint;
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-run-tic').disabled = false;
    // Une erreur du moteur arrête le run et s'affiche (benchCrash), puis repart vers la console.
    document.getElementById('btn-run').addEventListener('click', function () { runAllEpochs().catch(benchCrash); });
    document.getElementById('btn-run-tic').addEventListener('click', function () { runTictimes().catch(benchCrash); });

    document.getElementById('results-body').addEventListener('click', function (ev) {
        const skipEl = ev.target.closest('.btn-skip-epoch');
        if (skipEl !== null) {
            window.ABORT_COMPUTE = true;
            console.log('[bench] ABORT_COMPUTE demandé — fin de l’époque en cours, passage à la suivante au prochain tick du solveur');
            return;
        }
        const btn = ev.target.closest('.btn-copy-row');
        if (btn === null) return;
        copyBenchRow(document.getElementById('row-' + btn.getAttribute('data-copy-row')));
    });
}
