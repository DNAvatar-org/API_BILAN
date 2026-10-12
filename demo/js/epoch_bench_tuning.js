// File: API_BILAN/demo/epoch_bench_tuning.js
// Desc: Panneau fine-tuning du banc : jauge ATM (☁️+🔬), liste des cibles avec leur valeur LIVE, synchronisation
//       avec la page parente.
// Version 2.1.0
// Date: 2026-10-12
// logs :
//   - v2.1.0: détail en popup (<dialog> large, tableau : paramètre, valeur, plage, jauge, rôle — la note se
//     déroule sur toute la largeur) au lieu d'une liste tassée sous l'en-tête. Plus de colonne « fixe ».
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

/** Tableau des cibles FINE_TUNING_BOUNDS avec la valeur que la physique lit (DATA['🎚️']). */
function benchRenderTargets() {
    const T = window.DATA['🎚️'];
    const lignes = window.FINE_TUNING_BOUNDS.targets.map(function (target) {
        const jauge = ('baryGroup' in target) ? target.baryGroup : target.group;
        return '<tr>'
            + '<td class="bench-ft-key">' + target.group + '.<b>' + target.key + '</b></td>'
            + '<td class="bench-ft-num">' + benchFormatTuningValue(T[target.group][target.key]) + '</td>'
            + '<td class="bench-ft-num">' + benchFormatTuningValue(target.min) + ' → ' + benchFormatTuningValue(target.max) + '</td>'
            + '<td class="bench-ft-jauge">' + jauge + ' ' + T.baryByGroup[jauge] + ' %</td>'
            + '<td class="bench-ft-note">' + target.note + '</td>'
            + '</tr>';
    }).join('');
    return '<table class="bench-ft-table"><thead><tr><th>Paramètre</th><th>Valeur</th><th>Plage 0 % → 100 %</th>'
        + '<th>Jauge</th><th>Rôle</th></tr></thead><tbody>' + lignes + '</tbody></table>';
}

/** Titre de la popup : combien de paramètres, sous quelle jauge. */
function benchDetailTitle() {
    return '🧩 Fine-tuning — ' + window.FINE_TUNING_BOUNDS.targets.length + ' paramètres incertains (jauge ATM '
        + window.DATA['🎚️'].baryByGroup.ATM + ' %)';
}

/** Construit l'en-tête (jauge ATM + bouton détail) et le contenu de la popup. */
function benchDisplayFineTuning() {
    const atm = window.DATA['🎚️'].baryByGroup.ATM;
    document.getElementById('bench-ft-title-slot').innerHTML = '🧩 Fine-tuning 🪩 <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;margin-left:4px;" title="Même % pour CLOUD_SW (☁️) et SCIENCE (🔬)">🔺☁️🔬'
        + '<input id="bench-ft-slider-ATM-header" type="range" min="0" max="100" step="1" value="' + atm
        + '" oninput="window.__BENCH_FT__.onInput(this.value)">'
        + '<span id="bench-ft-value-ATM-header">' + atm + '%</span>🔻</span>'
        + '<button type="button" class="bench-ft-btn bench-ft-toggle" onclick="window.__BENCH_FT__.ouvrirDetail(); return false;" title="Détail des paramètres">détail…</button>';
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Remet la jauge et les valeurs à jour sans reconstruire l'en-tête (pas de rebuild pendant un glissé). */
function benchSyncFineTuningSlidersFromBary() {
    const atm = window.DATA['🎚️'].baryByGroup.ATM;
    document.getElementById('bench-ft-slider-ATM-header').value = String(atm);
    document.getElementById('bench-ft-value-ATM-header').textContent = atm + '%';
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
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
