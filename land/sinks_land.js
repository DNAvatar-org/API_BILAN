// ============================================================================
// File: API_BILAN/land/sinks_land.js - Puits terrestre du CO₂ injecté
// Desc: Trois mécanismes distincts, chacun chiffré par une publication différente :
//       fertilisation CO₂ pondérée par l'âge des peuplements, dépôt d'azote, repousse forestière.
//       Séparé du puits océan (ocean/sinks_ocean.js) : deux physiques sans rapport.
// Version 1.1.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.1.0: 3 mécanismes séparés au lieu de la seule fertilisation. β pondéré par l'âge
//   (β_jeune sur les peuplements < 30 ans, β_mature sur le reste) : c'est ce qui fait disparaître
//   le biais d'échelle des FACE, dont les parcelles avaient 10-20 ans. Ajout du dépôt d'azote
//   et de la repousse. Terres 2025 : 21,8 % → 28,6 % des émissions (mesuré ~30 %).
// - v1.0.0: extrait de co2/calculations_co2.js v1.2.7.
// ============================================================================

'use strict';

/**
 * Les trois stocks (kg CO₂) et le temps écoulé depuis le début de l'époque (années).
 * Hors DATA pour la même raison que les réservoirs océaniques : neuf endroits du modèle remettent
 * 📜🔺⚖️🌳🏭 à 0 sans connaître ce découpage. syncLandStocks() se recale sur ce total à chaque appel.
 */
var landStocksKg = null;   // { fert, ndep, regrow }
var landElapsedYears = 0;

/** Réaligne les stocks sur 📜🔺⚖️🌳🏭 (seule source de vérité du total stocké). */
function syncLandStocks(totalKg) {
    if (!landStocksKg) landStocksKg = { fert: 0, ndep: 0, regrow: 0 };
    if (!(totalKg > 0)) {
        landStocksKg = { fert: 0, ndep: 0, regrow: 0 };
        landElapsedYears = 0;          // nouvelle époque : la repousse héritée repart de son flux initial
        return;
    }
    var sum = landStocksKg.fert + landStocksKg.ndep + landStocksKg.regrow;
    if (sum <= 0) { landStocksKg.fert = totalKg; return; }
    if (Math.abs(sum - totalKg) > 1e-9 * Math.abs(totalKg)) {
        var f = totalKg / sum;
        landStocksKg.fert *= f; landStocksKg.ndep *= f; landStocksKg.regrow *= f;
    }
}

/**
 * β effectif du couvert, pondéré par la structure d'âge.
 *
 * C'est le cœur du correctif. Les expériences FACE qui donnent β = 0,605 (Norby 2005) portaient sur
 * des peuplements de 10-20 ans, en pleine phase d'accumulation. Sur des forêts MATURES — EucFACE
 * (Jiang 2020) et Web-FACE (Körner 2005) — le CO₂ enrichi ne produit AUCUN gain de biomasse : le
 * carbone supplémentaire repart par la respiration du sol. Appliquer 0,605 à toute la forêt mondiale,
 * dont les deux tiers ne sont pas jeunes, sur-estime donc le puits. C'est le biais d'échelle connu
 * des FACE, et il disparaît dès qu'on sépare les deux populations.
 *
 * La fenêtre « jeune » est fixée à 30 ans : la NPP forestière culmine entre 10 et 40 ans puis
 * redescend (Tang 2014, généralisant Ryan 1997).
 */
function effectiveBeta() {
    var CS = window.CONFIG_COMPUTE.CARBON_SINKS;
    var f = CS.landYoungFraction0;
    return f * CS.landBetaYoung + (1 - f) * CS.landBetaMature;
}

/**
 * Un pas de stockage terrestre. Écrit 📜🔺⚖️🌳🏭 (total stocké), somme des trois mécanismes.
 *
 * @param {number} dtYears   durée du pas (années)
 * @param {number} C_mid     masse de CO₂ atmosphérique au milieu du pas (kg)
 * @param {number} C0        masse de CO₂ d'équilibre de l'époque (kg)
 * @param {number} emitStepKg CO₂ émis pendant ce pas (kg) — pilote le dépôt d'azote
 */
function advanceLandSinkStep(dtYears, C_mid, C0, emitStepKg) {
    var DATA = window.DATA;
    var CS = window.CONFIG_COMPUTE.CARBON_SINKS;
    var GTC_TO_KG_CO2 = 1e12 * window.CONST.M_CO2 / 0.012011;

    // 1. FERTILISATION CO₂ — ΔNPP = NPP0·β_eff·ln(C/C0), stock relaxant vers ΔNPP·τ.
    //    Seul des trois à dépendre du CO₂.
    var dNppKgPerYear = CS.landNpp0GtC * GTC_TO_KG_CO2 * effectiveBeta() * Math.log(C_mid / C0);
    var fertEq = dNppKgPerYear * CS.landTauYears;
    landStocksKg.fert = fertEq + (landStocksKg.fert - fertEq) * Math.exp(-dtYears / CS.landTauYears);

    // 2. DÉPÔT D'AZOTE — flux NET (il contient déjà ses pertes), donc on cumule sans relaxation.
    //    Indexé sur les émissions : l'azote réactif déposé est un co-produit de la combustion et de
    //    l'agriculture industrielle, il n'existe pas dans une époque sans activité humaine. Une
    //    injection volcanique de CO₂ ne dépose pas d'azote — d'où l'indexation plutôt qu'une constante.
    landStocksKg.ndep += CS.landNdepGtCPerGtCO2 * (emitStepKg / 1e12) * GTC_TO_KG_CO2;

    // 3. REPOUSSE FORESTIÈRE — flux hérité du XXᵉ siècle, décroissant à mesure que les peuplements
    //    se remplissent. Ne dépend ni du CO₂ ni de l'azote : c'est de la biomasse qui se reconstitue
    //    après des coupes passées. Indépendant par construction des deux termes ci-dessus.
    //    ⚠️ Ce terme est aujourd'hui une décroissance imposée. Quand le bouton 🪾 existera, il devra
    //    devenir la conséquence des coupes simulées : couper du mature remplit le pool jeune, qui
    //    reconstitue ensuite sa biomasse sur landRegrowthTauYears.
    landStocksKg.regrow += CS.landRegrowth0GtCPerYear * GTC_TO_KG_CO2
        * Math.exp(-landElapsedYears / CS.landRegrowthTauYears) * dtYears;

    landElapsedYears += dtYears;
    DATA['📜']['🔺⚖️🌳🏭'] = landStocksKg.fert + landStocksKg.ndep + landStocksKg.regrow;
}

/** Détail par mécanisme (kg CO₂) — diagnostic / affichage. */
function landStocks() {
    return landStocksKg ? { fert: landStocksKg.fert, ndep: landStocksKg.ndep, regrow: landStocksKg.regrow }
                        : { fert: 0, ndep: 0, regrow: 0 };
}

window.LAND_SINK = window.LAND_SINK || {};
window.LAND_SINK.syncLandStocks = syncLandStocks;
window.LAND_SINK.advanceLandSinkStep = advanceLandSinkStep;
window.LAND_SINK.effectiveBeta = effectiveBeta;
window.LAND_SINK.stocks = landStocks;
