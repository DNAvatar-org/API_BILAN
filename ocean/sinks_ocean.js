// ============================================================================
// File: API_BILAN/ocean/sinks_ocean.js - Puits océanique du CO₂ injecté
// Desc: Les trois réservoirs océaniques (couche de mélange, thermocline, profond) et leur relaxation.
//       Rien d'autre : la partition Henry de fond vit dans co2/calculations_co2.js, le puits
//       terrestre dans land/sinks_land.js. Un fichier par puits, ils n'ont pas la même physique.
// Version 1.2.5
// - v1.2.5 (2026-11-04): OCEAN_SINK.poserBoxesKg — les réservoirs d'un calcul gardé remis tels quels (progression au F5).
// - v1.2.4 (2026-10-29): T_réf de Van 't Hoff = T̄ de la Terre actuelle, où les ratio_i sont mesurés (INTERIEUR.CONST.T_S0).
// - v1.2.3 (2026-10-29): écarts de zone lus par MERIDIEN.ecarts, zones par EARTH.ZONES (moyenneGlobe) : leur seule source.
// Date: [November 4, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// ============================================================================

'use strict';

/**
 * Contenu des réservoirs océaniques (kg CO₂), même ordre que CARBON_SINKS.oceanBoxes.
 * Hors DATA à dessein : neuf endroits du modèle remettent 📜🔺⚖️🌊🏭 à 0 pour purger le puits océan
 * (setEpoch, scie, hysteresis, search…) sans connaître ce découpage. Plutôt que d'aller les modifier
 * tous — et d'en oublier un —, syncOceanBoxes() se recale sur ce total à chaque appel : total 0 ⇒ tout
 * à zéro, total ≠ somme ⇒ remise à l'échelle. Le découpage est un détail du puits, pas un état du modèle.
 */
var oceanBoxKg = window.CONFIG_COMPUTE.CARBON_SINKS.oceanBoxes.map(function () { return 0; });

/** Réaligne les réservoirs sur 📜🔺⚖️🌊🏭 (seule source de vérité du total absorbé). */
function syncOceanBoxes(totalKg, boxes) {
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
 * Terre moderne (clic frise 📱, T̄ = 15,42 °C, T₂ = −24,1 °C) : ×1,013 pondéré par aire contre ×0,971 à la moyenne, soit +4,4 %
 * d'absorption (la zone polaire, à −4,1 °C, prise au plancher du gel de l'eau de mer).
 *
 * Zones et écarts de température : ceux du bilan méridien (MERIDIEN.ecarts, physics/meridien.js) et les zones
 * EARTH.ZONES (moyenne sur le globe, EARTH.moyenneGlobe) — les mêmes que pour l'albédo de glace, pas une seconde source.
 * Unités : facteur de Van 't Hoff exp[2400 K · (1/T − 1/T_réf)], sans dimension, T en KELVINS (T_zone = T̄ − dT ;
 * dT est une différence de température, identique en K et en °C). Plancher à la température de gel de l'eau de mer :
 * sous la banquise il n'y a plus d'échange gazeux. T_réf = la T̄ où les capacités ratio_i et le facteur de Revelle sont
 * mesurés, la Terre actuelle (INTERIEUR.CONST.T_S0, la même que pour le partage de fond) — pas la T de l'époque.
 *
 * ⚠️ Pondération par AIRE, faute de mieux : l'absorption se concentre en réalité sur les sites de
 * formation d'eau profonde (Atlantique Nord, océan Austral), plus étroits que la zone polaire entière.
 * C'est donc une borne BASSE de l'effet.
 */
function zonalSolubilityFactor() {
    const DATA = window.DATA;
    const ecart = window.MERIDIEN.ecarts();   // { pol, mid, trop } [K], dT = T̄ − T_zone
    const T_glob = DATA['🧮']['🧮🌡️'];
    const T_ref = window.INTERIEUR.CONST.T_S0;
    const freeze = window.EARTH.T_FREEZE_SEAWATER_K;
    const vh = function (dT) {
        return Math.exp(2400.0 * (1.0 / Math.max(freeze, T_glob - dT) - 1.0 / T_ref));
    };
    return window.EARTH.moyenneGlobe({ pol: vh(ecart.pol), mid: vh(ecart.mid), trop: vh(ecart.trop) });
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
    const EPOCH = DATA['📅'];
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
    var s = 0;
    for (var i = 0; i < oceanBoxKg.length; i++) s += oceanBoxKg[i];
    return s;
}

/** Contenu par réservoir (kg CO₂) — diagnostic / affichage, et l'état que garde la progression (CO2 static/ui/progression.js). */
function oceanSinkBoxesKg() {
    return oceanBoxKg.slice();
}

/** Les réservoirs remis tels qu'un calcul gardé les a laissés (kg CO₂, même ordre ; CO2 static/ui/progression.js) : sans
 *  eux, syncOceanBoxes trouverait des réservoirs vides pour un total non nul, et le répartirait aux capacités. */
function poserOceanSinkBoxesKg(kg) {
    oceanBoxKg = kg.slice();
}

window.OCEAN_SINK = {};
window.OCEAN_SINK.syncOceanBoxes = syncOceanBoxes;
window.OCEAN_SINK.assertOceanCapacity = assertOceanCapacity;
window.OCEAN_SINK.advanceOceanSinkStep = advanceOceanSinkStep;
window.OCEAN_SINK.zonalSolubilityFactor = zonalSolubilityFactor;
window.OCEAN_SINK.totalKg = oceanSinkTotalKg;
window.OCEAN_SINK.boxesKg = oceanSinkBoxesKg;
window.OCEAN_SINK.poserBoxesKg = poserOceanSinkBoxesKg;
