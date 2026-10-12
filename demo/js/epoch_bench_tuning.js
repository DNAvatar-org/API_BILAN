// File: API_BILAN/demo/epoch_bench_tuning.js
// Desc: Panneau fine-tuning du banc : jauge ATM (☁️+🔬), liste des cibles avec leur valeur LIVE, synchronisation
//       avec la page parente.
// Version 2.0.0
// Date: 2026-10-10
// logs :
//   - v2.0.0: PAS DE GARDES, référence unique. Les valeurs affichées sont lues dans DATA['🎚️'] (écrites par
//     API_BILAN/tuning.js) : le panneau ne réinterpole plus lui-même (sa copie d'interpolate ignorait `fixed`).
//     Plus de groupe SOLVER (aucune cible), plus de copie du barycentre depuis CONFIG_COMPUTE.baryByGroupDefault
//     (miroir supprimé : DATA['🎚️'] naît de DEFAULT.TUNING). Payload émis = { baryByGroup: { ATM, HYSTERESIS } }.
//   - v1.1.0: plus de petit ▶️ à côté des jauges (le calcul se lance par ▶ Époques / ▶ Tictimes).
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** Nombre lisible : entier tel quel, très grand / très petit en exposant, sinon 6 chiffres significatifs. */
function benchFormatTuningValue(value) {
    if (Number.isInteger(value)) return String(value);
    if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(3);
    return parseFloat(value.toFixed(6)).toString();
}

/** Liste des cibles FINE_TUNING_BOUNDS avec la valeur que la physique lit (DATA['🎚️']). */
function benchRenderTargets() {
    const T = window.DATA['🎚️'];
    return window.FINE_TUNING_BOUNDS.targets.map(function (target) {
        const live = T[target.group][target.key];
        const jauge = ('fixed' in target) ? 'fixe' : (('baryGroup' in target) ? target.baryGroup : target.group);
        return '<div class="bench-ft-line">' + target.group + '.' + target.key + ' 🔻 ' + benchFormatTuningValue(live)
            + ' [' + benchFormatTuningValue(target.min) + ' , ' + benchFormatTuningValue(target.max) + '] (' + jauge + ')'
            + ' — ' + target.note + '</div>';
    }).join('');
}

/** Construit l'en-tête (jauge ATM + bouton ±) et la liste des cibles. */
function benchDisplayFineTuning() {
    const titleSlot = document.getElementById('bench-ft-title-slot');
    const content = document.getElementById('bench-ft-content');
    const atm = window.DATA['🎚️'].baryByGroup.ATM;
    const isOpen = content.style.display !== 'none';
    titleSlot.innerHTML = '🧩 Fine-tuning 🪩 <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;margin-left:4px;" title="Même % pour CLOUD_SW (☁️) et SCIENCE (🔬)">🔺☁️🔬'
        + '<input id="bench-ft-slider-ATM-header" type="range" min="0" max="100" step="1" value="' + atm
        + '" oninput="window.__BENCH_FT__.onInput(this.value)">'
        + '<span id="bench-ft-value-ATM-header">' + atm + '%</span>🔻</span>'
        + '<button type="button" class="bench-ft-btn bench-ft-toggle" id="bench-ft-panel-toggle" onclick="window.__BENCH_FT__.togglePanel(); return false;">' + (isOpen ? '−' : '+') + '</button>';
    content.innerHTML = benchRenderTargets();
}

/** Remet la jauge et les valeurs à jour sans reconstruire l'en-tête (pas de rebuild pendant un glissé). */
function benchSyncFineTuningSlidersFromBary() {
    const atm = window.DATA['🎚️'].baryByGroup.ATM;
    document.getElementById('bench-ft-slider-ATM-header').value = String(atm);
    document.getElementById('bench-ft-value-ATM-header').textContent = atm + '%';
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Le banc parle : sync:tuning vers la page parente (index.html → sync_panels.js), sans relancer de calcul. */
function benchEmitTuningToParent() {
    if (window.parent === window) return;   // banc ouvert seul : personne à prévenir
    const bg = window.DATA['🎚️'].baryByGroup;
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: { baryByGroup: { ATM: bg.ATM, HYSTERESIS: bg.HYSTERESIS }, run: false }
    }, '*');
}

/** Glissé de la jauge ATM. */
function benchOnFineTuningBaryInput(percentRaw) {
    window.TUNING.applyTuningPayload({ baryByGroup: { ATM: Number(percentRaw) } });
    benchSyncFineTuningSlidersFromBary();
    benchEmitTuningToParent();
}
