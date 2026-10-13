// File: API_BILAN/demo/epoch_bench_tuning.js
// Desc: Panneau fine-tuning du banc : jauges séparées (FINE_TUNING_BOUNDS.jauges), détail par jauge avec la valeur
//       LIVE des cibles, synchronisation avec la page parente.
// Version 3.1.0
// - v3.1.0 (2026-10-13): sens de chaque jauge et cible (TUNING.sensJauge / sensCible : 🔺 🔻 ↕️).
// Date: 2026-10-13
// logs :
//   - v3.0.0: jauges FROID / CHAUD / SUBTIL / HYSTERESIS au lieu de la jauge unique ATM ; popup = explication et mesure
//     de chaque jauge, puis ses paramètres.
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

/** Détail : pour chaque jauge, son sens, son explication, la mesure qui l'a classée, puis ses cibles (valeur lue par la
 *  physique dans DATA['🎚️'], plage 0 % → 100 %, rôle, source). */
function benchRenderTargets() {
    const T = window.DATA['🎚️'];
    const F = window.FINE_TUNING_BOUNDS;
    return '<p class="bench-ft-note">Le barycentre unique a été éclaté le 2026-10-13 : avec la nouvelle physique des nuages, '
        + 'ses paramètres n\'allaient plus dans le même sens. Classement mesuré : bilan net à la température graine de sept '
        + 'époques, chaque paramètre de sa borne basse à sa borne haute, les autres à 50 %.</p>'
        + Object.keys(F.jauges).map(function (j) {
            const J = F.jauges[j];
            const lignes = F.targets.filter(function (t) { return t.baryGroup === j; }).map(function (t) {
                return '<tr>'
                    + '<td class="bench-ft-key" title="' + window.TUNING.sensCible(t).titre + '">' + window.TUNING.sensCible(t).logo + ' ' + t.group + '.<b>' + t.key + '</b></td>'
                    + '<td class="bench-ft-num">' + benchFormatTuningValue(T[t.group][t.key]) + '</td>'
                    + '<td class="bench-ft-num">' + benchFormatTuningValue(t.min) + ' → ' + benchFormatTuningValue(t.max) + '</td>'
                    + '<td class="bench-ft-note">' + t.note + ' — ' + t.source + '</td>'
                    + '</tr>';
            }).join('');
            return '<h3>' + J.logo + ' ' + j + ' ' + T.baryByGroup[j] + ' % ' + window.TUNING.sensJauge(j).logo + ' — ' + J.titre + ' (' + window.TUNING.sensJauge(j).titre + ')</h3>'
                + '<p class="bench-ft-note">' + J.explication + '</p>'
                + '<p class="bench-ft-note">📏 ' + J.mesure + '</p>'
                + '<table class="bench-ft-table"><thead><tr><th>Paramètre</th><th>Valeur</th><th>Plage 0 % → 100 %</th>'
                + '<th>Rôle — source</th></tr></thead><tbody>' + lignes + '</tbody></table>';
        }).join('');
}

/** Titre de la popup : combien de paramètres, sous combien de jauges. */
function benchDetailTitle() {
    const F = window.FINE_TUNING_BOUNDS;
    return '🧩 Fine-tuning — ' + F.targets.length + ' paramètres incertains, ' + Object.keys(F.jauges).length + ' jauges';
}

/** Construit l'en-tête (une jauge par rangée + bouton détail) et le contenu de la popup. */
function benchDisplayFineTuning() {
    const F = window.FINE_TUNING_BOUNDS;
    const bg = window.DATA['🎚️'].baryByGroup;
    document.getElementById('bench-ft-title-slot').innerHTML = '🧩 Fine-tuning '
        + Object.keys(F.jauges).map(function (j) {
            return '<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;margin-left:6px;">'
                + F.jauges[j].logo
                + '<input class="bench-ft-curseur" data-jauge="' + j + '" type="range" min="0" max="100" step="1" value="' + bg[j]
                + '" oninput="window.__BENCH_FT__.onInput(this.dataset.jauge, this.value)">'
                + '<span data-jauge-pct="' + j + '">' + bg[j] + '%</span>'
                + '<span title="' + window.TUNING.sensJauge(j).titre + '">' + window.TUNING.sensJauge(j).logo + '</span></span>';
        }).join('')
        + '<button type="button" class="bench-ft-btn bench-ft-toggle" onclick="window.__BENCH_FT__.ouvrirDetail(); return false;" title="Détail des paramètres">détail…</button>';
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Remet jauges et valeurs à jour sans reconstruire l'en-tête (pas de rebuild pendant un glissé). */
function benchSyncFineTuningSlidersFromBary() {
    const bg = window.DATA['🎚️'].baryByGroup;
    document.querySelectorAll('.bench-ft-curseur').forEach(function (el) { el.value = String(bg[el.dataset.jauge]); });
    document.querySelectorAll('[data-jauge-pct]').forEach(function (el) { el.textContent = bg[el.dataset.jaugePct] + '%'; });
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Le banc parle : sync:tuning vers la page parente (index.html → sync_panels.js), sans relancer de calcul. */
function benchEmitTuningToParent() {
    if (window.parent === window) return;   // banc ouvert seul : personne à prévenir
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: { baryByGroup: Object.assign({}, window.DATA['🎚️'].baryByGroup), run: false }
    }, '*');
}

/** Glissé d'une jauge. */
function benchOnFineTuningBaryInput(jauge, percentRaw) {
    const bary = {};
    bary[jauge] = Number(percentRaw);
    window.TUNING.applyTuningPayload({ baryByGroup: bary });
    benchSyncFineTuningSlidersFromBary();
    benchEmitTuningToParent();
}
