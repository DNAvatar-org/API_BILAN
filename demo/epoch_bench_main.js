// File: API_BILAN/demo/epoch_bench_main.js
// Desc: Pont vers la page parente, puis cablage de la page (initEpochBenchPage, appele par le loader).
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.__BENCH_FT__ = {
    onInput: function (groupKey, v) {
        benchOnFineTuningBaryInput(groupKey, v);
    },
    applyAndRun: function (groupKey, v) {
        if (groupKey === 'ATM') {
            benchApplyFineTuningAtmUnified(v, true);
        } else {
            benchApplyFineTuningBaryGroup(groupKey, v, true);
        }
        runAllEpochs();
    },
    togglePanel: function () {
        var content = document.getElementById('bench-ft-content');
        var btn = document.getElementById('bench-ft-panel-toggle');
        if (!content) return;
        var hidden = content.style.display === 'none' || !content.style.display;
        content.style.display = hidden ? 'block' : 'none';
        if (btn) btn.textContent = hidden ? '\u2212' : '+';
    },
    refresh: benchDisplayFineTuning
};

document.addEventListener('mousedown', function (e) {
    var el = e.target;
    if (!el || el.type !== 'range' || !el.id) return;
    var id = el.id;
    if (id.indexOf('bench-ft-bary-slider') !== 0 && id !== 'bench-ft-slider-ATM-header') return;
    var r = el.getBoundingClientRect();
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max) || 100;
    var val = parseFloat(el.value) || min;
    var pct = (max > min) ? (val - min) / (max - min) : 0;
    var thumbX = r.left + pct * r.width;
    if (Math.abs(e.clientX - thumbX) > 15) e.preventDefault();
}, true);

// v1.0.16 : réception sync:tuning depuis le parent (sync_panels.js → syncTuningToBench).
// v1.0.17 : update slider-seulement si déjà rendu (même pattern que scie) pour éviter rebuild DOM
// pendant l'écho d'une émission bench (benchEmitTuningToParent → parent → écho) qui casserait le drag.
// Fallback benchDisplayFineTuning si sliders absents (premier affichage).
// Ne relance PAS runAllEpochs (le bench relance sur clic ▶️ uniquement).
window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'sync:tuning') return;
    var p = e.data.payload;
    if (!p) return;
    if (window.TUNING && window.TUNING.applyTuningPayload) {
        window.TUNING.applyTuningPayload(p);
    }
    if (!benchSyncFineTuningSlidersFromBary()) {
        benchDisplayFineTuning();
    }
});

function initEpochBenchPage() {

var ok = window.DATA && window.TIMELINE && window.CONST && window.CONV;
var footer = document.getElementById('footer-info');
if (ok) {
    benchSyncBaryFromConfigCompute();
    if (window.TUNING && window.TUNING.fillDataTuningFromBary) window.TUNING.fillDataTuningFromBary();
    benchDisplayFineTuning();
    var dbgHint = window.UI_STATE.debugAPI
        ? ' \u2014 debugAPI : groupes [API_BILAN] calcul'
        : ' \u2014 ?debugAPI=true pour logs calcul group\u00e9s';
    var benchDbg = window.DEBUG_BENCH_LOG
        ? ' \u2014 debugBench \u2192 _logs/bench.txt (relancer le bench)'
        : ' \u2014 ?debugBench=1 pour _logs/bench.txt';
    footer.textContent = 'Pr\u00eat \u2014 ' + window.TIMELINE.length + ' \u00e9poques charg\u00e9es' + dbgHint + benchDbg;
    document.getElementById('btn-run').disabled = false;
} else {
    footer.textContent = '\u274c Ressources manquantes (DATA=' + !!window.DATA
        + ', TIMELINE=' + !!window.TIMELINE + ', CONST=' + !!window.CONST
        + ', CONV=' + !!window.CONV + ')';
}
document.getElementById('btn-run').addEventListener('click', function () {
    // Reset du fichier topic courant AVANT le run : garantit "que le dernier test" (p.ex. iceFactor.txt).
    if (window.DEBUG && window.DEBUG.topic) { window.DEBUG.reset(); }
    runAllEpochs();
});

document.getElementById('results-body').addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var skipEl = t.closest('.btn-skip-epoch');
    if (skipEl) {
        window.ABORT_COMPUTE = true;
        console.log('[bench] ABORT_COMPUTE demand\u00e9 \u2014 fin de l\u2019\u00e9poque en cours, passage \u00e0 la suivante au prochain tick du solveur');
        return;
    }
    var btn = t.closest('.btn-copy-row');
    if (!btn) return;
    var sid = btn.getAttribute('data-copy-row');
    var tr = sid ? document.getElementById('row-' + sid) : null;
    if (tr) copyBenchRow(tr);
});

}
