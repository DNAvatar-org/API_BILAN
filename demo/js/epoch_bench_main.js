// File: API_BILAN/demo/epoch_bench_main.js
// Desc: Pont vers la page parente, puis cablage de la page (initEpochBenchPage, appele par le loader).
// Version 2.3.4
//   - v2.3.4: bouton clear → BENCH_ACTIONS.vider.
//   - v2.3.3: clic sur l'époque d'une ligne → BENCH_ACTIONS.voir (l'index recharge l'état de ce calcul).
//   - v2.3.2: nombre de CPU en parallèle (#bench-cpu, workers du pool) à droite de « détail… ».
//   - v2.3.1: __BENCH_FT__.pas(jauge, ±1) — boutons −1 / +1.
//   - v2.3.0: ▶ et ⏭ par BENCH_ACTIONS (page autonome : moteur local ; encart : vrais clics de l'index).
// Date: 2026-10-15
// logs :
//   - v2.2.0: jauges séparées — __BENCH_FT__.onInput(jauge, valeur) ; garde du clic sur toutes les jauges.
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.__BENCH_FT__ = {
    onInput: benchOnFineTuningBaryInput,
    pas: benchPasJauge,
    ouvrirDetail: function () {
        document.getElementById('bench-ft-dialog').showModal();
    }
};

// Clic sur la piste d'une jauge loin du curseur : pas de saut de valeur (on ne bouge qu'en tirant le curseur).
document.addEventListener('mousedown', function (e) {
    const el = e.target;
    if (!el.classList.contains('bench-ft-curseur')) return;
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
    // Calcul spectral en parallèle : workers du pool (workers/worker_pool.js), un cœur laissé au rendu.
    const pool = window.__API_BILAN_WORKER_POOL__;
    const cpu = document.getElementById('bench-cpu');
    cpu.textContent = pool.nWorkers + ' CPU en //';
    cpu.title = pool.nWorkers + ' workers spectraux en parallèle sur ' + navigator.hardwareConcurrency
        + ' threads annoncés par le navigateur (un réservé au rendu)';
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-run-tic').disabled = false;
    // Page autonome : le moteur de la page (une erreur arrête le run, benchCrash) ; encart : l'index fait de vrais clics
    // (BENCH_ACTIONS, epoch_bench_encart.js).
    document.getElementById('btn-run').addEventListener('click', BENCH_ACTIONS.epoque);
    document.getElementById('btn-run-tic').addEventListener('click', BENCH_ACTIONS.tictime);
    document.getElementById('btn-clear').addEventListener('click', BENCH_ACTIONS.vider);

    document.getElementById('results-body').addEventListener('click', function (ev) {
        const skipEl = ev.target.closest('.btn-skip-epoch');
        if (skipEl !== null) {
            BENCH_ACTIONS.passer();
            console.log('[bench] ⏭ demandé — fin du calcul en cours, passage au suivant au prochain tick du solveur');
            return;
        }
        // Clic sur l'époque d'une ligne, run terminé : l'index montre l'état de fin de ce calcul (encart).
        const epCell = ev.target.closest('td.col-epoch');
        if (epCell !== null && !document.getElementById('btn-run').disabled) {
            document.querySelectorAll('#results-body tr.vue').forEach(function (r) { r.classList.remove('vue'); });
            const tr = epCell.closest('tr');
            tr.classList.add('vue');
            BENCH_ACTIONS.voir(tr.dataset.rowKey);
            return;
        }
        const btn = ev.target.closest('.btn-copy-row');
        if (btn === null) return;
        copyBenchRow(document.getElementById('row-' + btn.getAttribute('data-copy-row')));
    });
}
