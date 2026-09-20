// ============================================================================
// File: API_BILAN/ocean/sinks_ocean.js - Puits océanique du CO₂ injecté
// Desc: Les trois réservoirs océaniques (couche de mélange, thermocline, profond) et leur relaxation.
//       Rien d'autre : la partition Henry de fond vit dans co2/calculations_co2.js, le puits
//       terrestre dans land/sinks_land.js. Un fichier par puits, ils n'ont pas la même physique.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.0.0: extrait de co2/calculations_co2.js v1.2.7 (océan et forêts séparés en deux fichiers).
// ============================================================================

'use strict';

/**
 * Contenu des réservoirs océaniques (kg CO₂), même ordre que CARBON_SINKS.oceanBoxes.
 * Hors DATA à dessein : neuf endroits du modèle remettent 📜🌊🔺⚖️🏭 à 0 pour purger le puits océan
 * (setEpoch, scie, hysteresis, search…) sans connaître ce découpage. Plutôt que d'aller les modifier
 * tous — et d'en oublier un —, syncOceanBoxes() se recale sur ce total à chaque appel : total 0 ⇒ tout
 * à zéro, total ≠ somme ⇒ remise à l'échelle. Le découpage est un détail du puits, pas un état du modèle.
 */
var oceanBoxKg = null;

/** Réaligne les réservoirs sur 📜🌊🔺⚖️🏭 (seule source de vérité du total absorbé). */
function syncOceanBoxes(totalKg, boxes) {
    if (!oceanBoxKg || oceanBoxKg.length !== boxes.length) oceanBoxKg = boxes.map(function () { return 0; });
    if (!(totalKg > 0)) { oceanBoxKg = boxes.map(function () { return 0; }); return; }
    var sum = 0;
    for (var i = 0; i < oceanBoxKg.length; i++) sum += oceanBoxKg[i];
    if (sum <= 0) {
        // Total non nul mais réservoirs vides (reprise d'un état posé hors d'ici) : répartir aux capacités.
        var cap = 0;
        for (var c = 0; c < boxes.length; c++) cap += boxes[c].ratio;
        for (var j = 0; j < boxes.length; j++) oceanBoxKg[j] = totalKg * boxes[j].ratio / cap;
        return;
    }
    if (Math.abs(sum - totalKg) > 1e-9 * Math.abs(totalKg)) {
        var f = totalKg / sum;
        for (var k = 0; k < oceanBoxKg.length; k++) oceanBoxKg[k] *= f;
    }
}

/** Crash-first : la capacité totale des réservoirs DOIT rester celle de co2OceanRatioRef. */
function assertOceanCapacity(boxes) {
    var capTotal = 0;
    for (var i = 0; i < boxes.length; i++) capTotal += boxes[i].ratio;
    if (Math.abs(capTotal - window.CONFIG_COMPUTE.co2OceanRatioRef) > 1e-6) {
        throw new Error('[sinks_ocean] Σ oceanBoxes.ratio = ' + capTotal
            + ' ≠ co2OceanRatioRef = ' + window.CONFIG_COMPUTE.co2OceanRatioRef
            + ' — la capacité totale de l\'océan doit rester inchangée (seuls les τ diffèrent).');
    }
}

/**
 * Un pas d'absorption océanique. Chaque réservoir relaxe vers k_i·A, A = excès resté dans l'air.
 * À l'équilibre ΣO = (Σratio/R)·A, soit exactement la partition de l'ancienne boîte unique :
 * même capacité, mais atteinte en 1 an / 50 ans / 350 ans selon le réservoir au lieu de 50 pour tout.
 * Écrit 📜🌊🔺⚖️🏭 (total absorbé) ; airExcess est fourni par l'orchestrateur.
 *
 * @param {number} dtYears    durée du pas (années)
 * @param {number} airExcess  E_cum − L − ΣO : excès de CO₂ resté dans l'air (kg)
 * @param {number} ppm_mid    CO₂ atmosphérique au milieu du pas (ppm, pour le facteur de Revelle)
 */
function advanceOceanSinkStep(dtYears, airExcess, ppm_mid) {
    const DATA = window.DATA;
    const CS = window.CONFIG_COMPUTE.CARBON_SINKS;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const R = CS.oceanRevelleRef + CS.oceanRevelleSlopePerPpm * (ppm_mid - CS.oceanRevelleRefPpm);
    const T = Math.max(271.15, DATA['🧮']['🧮🌡️']);
    const vantHoff = Math.exp(2400.0 * (1.0 / T - 1.0 / EPOCH['🌡️🧮']));
    let newTotal = 0;
    for (let i = 0; i < CS.oceanBoxes.length; i++) {
        const box = CS.oceanBoxes[i];
        const O_eq = (box.ratio / R) * vantHoff * airExcess;
        oceanBoxKg[i] = O_eq + (oceanBoxKg[i] - O_eq) * Math.exp(-dtYears / box.tauYears);
        newTotal += oceanBoxKg[i];
    }
    DATA['📜']['🌊🔺⚖️🏭'] = newTotal;
}

/** Total actuellement dans les réservoirs (kg CO₂). */
function oceanSinkTotalKg() {
    if (!oceanBoxKg) return 0;
    var s = 0;
    for (var i = 0; i < oceanBoxKg.length; i++) s += oceanBoxKg[i];
    return s;
}

/** Contenu par réservoir (kg CO₂) — diagnostic / affichage. */
function oceanSinkBoxesKg() {
    return oceanBoxKg ? oceanBoxKg.slice() : [];
}

window.OCEAN_SINK = window.OCEAN_SINK || {};
window.OCEAN_SINK.syncOceanBoxes = syncOceanBoxes;
window.OCEAN_SINK.assertOceanCapacity = assertOceanCapacity;
window.OCEAN_SINK.advanceOceanSinkStep = advanceOceanSinkStep;
window.OCEAN_SINK.totalKg = oceanSinkTotalKg;
window.OCEAN_SINK.boxesKg = oceanSinkBoxesKg;
