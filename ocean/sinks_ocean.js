// ============================================================================
// File: API_BILAN/ocean/sinks_ocean.js - Puits océanique du CO₂ injecté
// Desc: Les trois réservoirs océaniques (couche de mélange, thermocline, profond) et leur relaxation.
//       Rien d'autre : la partition Henry de fond vit dans co2/calculations_co2.js, le puits
//       terrestre dans land/sinks_land.js. Un fichier par puits, ils n'ont pas la même physique.
// Version 1.1.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.1.0: solubilité pondérée par ZONE au lieu de la température moyenne globale. Le CO₂ anthropique
//   entre dans l'océan aux hautes latitudes froides, pas à la température moyenne de la planète.
//   Océan 2025 : 24,4 % → 25,7 % des émissions (mesuré ~26 %). Aucun paramètre nouveau : réutilise
//   EPOCH['🥶'] et les fractions de zone déjà présentes pour l'albédo de glace.
// - v1.0.0: extrait de co2/calculations_co2.js v1.2.7 (océan et forêts séparés en deux fichiers).
// ============================================================================

'use strict';

/**
 * Contenu des réservoirs océaniques (kg CO₂), même ordre que CARBON_SINKS.oceanBoxes.
 * Hors DATA à dessein : neuf endroits du modèle remettent 📜🔺⚖️🌊🏭 à 0 pour purger le puits océan
 * (setEpoch, scie, hysteresis, search…) sans connaître ce découpage. Plutôt que d'aller les modifier
 * tous — et d'en oublier un —, syncOceanBoxes() se recale sur ce total à chaque appel : total 0 ⇒ tout
 * à zéro, total ≠ somme ⇒ remise à l'échelle. Le découpage est un détail du puits, pas un état du modèle.
 */
var oceanBoxKg = null;

/** Réaligne les réservoirs sur 📜🔺⚖️🌊🏭 (seule source de vérité du total absorbé). */
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
 * Facteur de solubilité de Van 't Hoff, PONDÉRÉ PAR ZONE au lieu d'être pris à la température moyenne.
 *
 * Le CO₂ anthropique n'entre pas dans l'océan à la température moyenne de la planète : il entre aux
 * HAUTES LATITUDES, là où l'eau froide en dissout beaucoup plus et où se forment les eaux profondes.
 * C'est le mécanisme dominant du puits océanique — la pompe biologique, elle, est limitée par les
 * nutriments et non par le carbone, donc elle ne répond quasiment pas à une hausse du CO₂ (le plancton
 * n'est pas un puits anthropique, contrairement à l'intuition).
 *
 * exp(2400/T) est CONVEXE : la moyenne des exponentielles n'est pas l'exponentielle de la moyenne.
 * Prendre la T moyenne sous-estime donc structurellement la dissolution, quelle que soit la planète.
 * Terre moderne : ×1,075 pondéré par aire contre ×0,993 à la moyenne, soit +8 % d'absorption.
 *
 * Zones et écarts de température : EPOCH['🥶'] et CONFIG_COMPUTE.*ZoneFraction — les mêmes que pour
 * l'albédo de glace, pas une seconde source. Plancher à la température de gel de l'eau de mer :
 * sous la banquise il n'y a plus d'échange gazeux.
 *
 * ⚠️ Pondération par AIRE, faute de mieux : l'absorption se concentre en réalité sur les sites de
 * formation d'eau profonde (Atlantique Nord, océan Austral), plus étroits que la zone polaire entière.
 * C'est donc une borne BASSE de l'effet.
 */
function zonalSolubilityFactor() {
    const DATA = window.DATA;
    const CC = window.CONFIG_COMPUTE;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const ice = EPOCH['🥶'];
    if (!ice || !Number.isFinite(Number(ice.dT_pol))) {
        throw new Error("[sinks_ocean] EPOCH['🥶'] requis (dT_pol/dT_mid/dT_trop) — source unique configTimeline.js.");
    }
    const T_glob = DATA['🧮']['🧮🌡️'];
    const T_ref = EPOCH['🌡️🧮'];
    const freeze = window.EARTH.T_FREEZE_SEAWATER_K;
    const fPol = CC.polarZoneFraction;
    const fMid = CC.midlatZoneFraction;
    const fTrop = 1 - fPol - fMid;
    const vh = function (dT) {
        return Math.exp(2400.0 * (1.0 / Math.max(freeze, T_glob - dT) - 1.0 / T_ref));
    };
    return fPol * vh(Number(ice.dT_pol)) + fMid * vh(Number(ice.dT_mid)) + fTrop * vh(Number(ice.dT_trop));
}

/**
 * Un pas d'absorption océanique. Chaque réservoir relaxe vers k_i·A, A = excès resté dans l'air.
 * À l'équilibre ΣO = (Σratio/R)·A, soit exactement la partition de l'ancienne boîte unique :
 * même capacité, mais atteinte en 1 an / 50 ans / 350 ans selon le réservoir au lieu de 50 pour tout.
 * Écrit 📜🔺⚖️🌊🏭 (total absorbé) ; airExcess est fourni par l'orchestrateur.
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
    const vantHoff = zonalSolubilityFactor();
    let newTotal = 0;
    for (let i = 0; i < CS.oceanBoxes.length; i++) {
        const box = CS.oceanBoxes[i];
        const O_eq = (box.ratio / R) * vantHoff * airExcess;
        oceanBoxKg[i] = O_eq + (oceanBoxKg[i] - O_eq) * Math.exp(-dtYears / box.tauYears);
        newTotal += oceanBoxKg[i];
    }
    DATA['📜']['🔺⚖️🌊🏭'] = newTotal;
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
window.OCEAN_SINK.zonalSolubilityFactor = zonalSolubilityFactor;
window.OCEAN_SINK.totalKg = oceanSinkTotalKg;
window.OCEAN_SINK.boxesKg = oceanSinkBoxesKg;
