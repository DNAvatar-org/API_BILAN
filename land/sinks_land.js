// ============================================================================
// File: API_BILAN/land/sinks_land.js - Puits terrestre du CO₂ injecté
// Desc: Fertilisation CO₂ de la biosphère terrestre (ΔNPP = NPP0·β·ln(C/C0), stockage L → ΔNPP·τ).
//       Séparé du puits océan (ocean/sinks_ocean.js) : ce sont deux physiques différentes, et ce
//       fichier va accueillir la structure d'âge des peuplements + le dépôt d'azote.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.0.0: extrait de co2/calculations_co2.js v1.2.7 (océan et forêts séparés en deux fichiers).
// ============================================================================

'use strict';

/**
 * Un pas de stockage terrestre. Fertilisation seule pour l'instant : ΔNPP = NPP0·β·ln(C/C0),
 * L relaxe vers L_eq = ΔNPP·τ avec τ = temps de résidence du carbone terrestre.
 * Écrit 📜🌳🔺⚖️🏭 (total stocké).
 *
 * @param {number} dtYears  durée du pas (années)
 * @param {number} C_mid    masse de CO₂ atmosphérique au milieu du pas (kg)
 * @param {number} C0       masse de CO₂ d'équilibre de l'époque (kg)
 */
function advanceLandSinkStep(dtYears, C_mid, C0) {
    const DATA = window.DATA;
    const CS = window.CONFIG_COMPUTE.CARBON_SINKS;
    const CONST = window.CONST;
    const GTC_TO_KG_CO2 = 1e12 * CONST.M_CO2 / 0.012011;
    const dNppKgPerYear = CS.landNpp0GtC * GTC_TO_KG_CO2 * CS.landBeta * Math.log(C_mid / C0);
    const L_eq = dNppKgPerYear * CS.landTauYears;
    DATA['📜']['🌳🔺⚖️🏭'] = L_eq + (DATA['📜']['🌳🔺⚖️🏭'] - L_eq) * Math.exp(-dtYears / CS.landTauYears);
}

window.LAND_SINK = window.LAND_SINK || {};
window.LAND_SINK.advanceLandSinkStep = advanceLandSinkStep;
