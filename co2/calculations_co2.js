// ============================================================================
// File: API_BILAN/co2/calculations_co2.js - Cycle CO2 océan-atmosphère
// Desc: Partition CO₂ de fond (atmosphère ↔ océan, Henry) + orchestration des puits du CO₂ injecté.
//       Physique des puits : ocean/sinks_ocean.js (3 réservoirs) et land/sinks_land.js (biosphère).
// Version 1.4.4
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [October 30, 2026]
// Logs:
// - v1.4.4: commentaires : graine de l'océan à l'équilibre de Henry de la T de départ.
// - v1.4.3: r de référence lu tel quel (plus de plancher à 0,1).
// - v1.4.2: T_ref de Van 't Hoff = T̄ de la Terre actuelle, où r = 50 est mesuré (INTERIEUR.CONST.T_S0), et non la T de l'époque.
// ============================================================================

function calculateCO2Partition() {
    const DATA = window.DATA;
    // Crash-first: DATA['⚖️'] doit exister, sinon ça doit planter.

    const CC = window.CONFIG_COMPUTE;
    // Pompe toujours active, réglée par : (1) EPOCH['🌊🏭], facteur par époque (0 = pas de mer, Urey éteint), (2) hasOceanWater
    // (pas d'eau liquide ⇒ rien à faire), (3) effPump01. initForConfig sème ⚖️🌊🏭 à l'équilibre de Henry de la T de départ du
    // calcul (graine du clic, ou T courante en tictime ; convergence/calculations_flux.js) : le premier partage ne déplace rien.

    // On ne s'active que s'il y a de l'eau liquide disponible à l'origine
    const hasOceanWater = DATA['⚖️']['⚖️💧'] > 0;

    const EPOCH = DATA['📅'];
    const epochId = DATA['📜']['🗿'];

    const T_curr = DATA['🧮']['🧮🌡️'];
    // T_ref : la T̄ à laquelle r = co2OceanRatioRef est MESURÉ — la Terre actuelle (Sarmiento & Gruber 2006 : 38 000 / 760 GtC),
    // la même que celle où l'est Q₀ de l'intérieur : une valeur, INTERIEUR.CONST.T_S0 (GISTEMP, an 2000).
    const T_ref = window.INTERIEUR.CONST.T_S0;

    // Facteur pompe par époque ∈ [0, +∞[. Défini pour TOUTES les 19 époques dans configTimeline.js v1.4.30.
    // Crash-first : si EPOCH['🌊🏭'] manque → NaN se propage, plantage visible (pas de fallback silencieux).
    // Valeurs typiques :
    //   0     ⚫ 🔥 🦠     → pas d'océan liquide / Urey éteint (Hadéen, Archéen chaud)
    //   0.15  🪸          → Protérozoïque, Urey lent pré-Rodinia (Goddéris 2017)
    //   0.5   hysteresis 1a → Rodinia break-up, Franklin LIP accélère silicate weathering (Mills 2011)
    //   0.0   ⛄          → Plein Snowball : glace globale coupe Urey (Hoffman 2017)
    //   2.0   hysteresis 1b → Déglaciation Marinoen catastrophique (Higgins & Schrag 2003)
    //   1.0   🪼 🦕 🦤    → Urey stable Phanérozoïque (Walker Hays Kasting 1981)
    //   1.3   🍄          → Carbonifère, forêts → altération accélérée (Berner GEOCARB III 2001)
    //   0.7   💀          → P/T, Trapps sibériens saturent océan
    //   1.1   🐊 hyst2 🏔 → orogenèse himalayenne, Raymo & Ruddiman 1992
    //   1.0   🦣 🛖 🚂 📱 → Urey moderne (référence Henry)
    const epochPumpFactor = Math.max(0, Number(EPOCH['🌊🏭']));

    // Efficacité de pompe : CONFIG_COMPUTE.co2OceanEffPump01 (config 0,1 ; jauges des pages hystérésis / search).
    const effPumpBase = Math.max(0, Math.min(1, CC.co2OceanEffPump01));
    const partitionFactor01 = Math.max(0, CC.co2OceanPartitionFactor01);
    // epochPumpFactor peut dépasser 1 (déglaciation Marinoen ×2) → pas de clamp supérieur.
    const effPump01 = effPumpBase * epochPumpFactor * partitionFactor01;

    // IMPORTANT: pump=0 doit être un no-op strict.
    // Sinon, le simple "passage" dans la fonction peut créer une mémoire (⚖️🌊🏭) qui diverge entre visu_ et search.
    // v1.2.0 : eff peut être 0 via epochPumpFactor=0 (⚫ 🔥 🦠 ⛄) OU via base=0 (jauge fermée).
    if (effPump01 <= 0) {
        if (CC.logCo2PartitionDiagnostic === true) {
            const mNoop = 'NO-OP eff=' + effPump01.toFixed(3)
                + ' base=' + effPumpBase.toFixed(3)
                + ' epoch×=' + epochPumpFactor.toFixed(2)
                + ' factor=' + partitionFactor01.toFixed(3)
                + ' ep=' + epochId
                + ' hasOceanWater=' + (hasOceanWater ? 1 : 0);
            console.log(mNoop);
            window.debugMirrorConfigLogToFile('logCo2PartitionDiagnostic', mNoop);
        }
        return true;
    }

    if (hasOceanWater) {
        // Le refroidissement profond sous la glace permet toujours l'échange à l'équilibre.
        // L'eau liquide de l'océan ne descend pas en dessous de 271.15 K (~ -2°C).
        const T_ocean = Math.max(271.15, T_curr);

        // ----- LOI DE HENRY (Van 't Hoff) -----
        // Pente : d ln H / d(1/T) = 2400 K, solubilité du CO₂ mesurée vers 25 °C (Sander). Le T_ref de la loi n'est pas ces
        // 25 °C : c'est celui de la valeur qu'elle prolonge, r = 50 mesuré aujourd'hui (r = 50 posé à 298,15 K donnerait
        // r ≈ 67 à la T̄ actuelle).
        const ratio_ref = CC.co2OceanRatioRef;
        const delta_inv_T = (1.0 / T_ocean) - (1.0 / T_ref);
        const ratio_T = ratio_ref * Math.exp(2400.0 * delta_inv_T);

        // Conservation du carbone (état courant) pour éviter les sauts inter-époques
        const total_carbon_mass = DATA['⚖️']['⚖️🏭'] + DATA['🌊']['⚖️🌊🏭'];

        // M_atm(T) = M_total / (1 + ratio_T)
        const eq_mass_atm = Math.max(0, total_carbon_mass / (1.0 + ratio_T));
        const new_mass_atm = DATA['⚖️']['⚖️🏭'] + effPump01 * (eq_mass_atm - DATA['⚖️']['⚖️🏭']);

        // On met à jour la masse atmosphérique et la masse totale d'air sec
        const old_mass_atm = DATA['⚖️']['⚖️🏭'];
        DATA['⚖️']['⚖️🏭'] = new_mass_atm;
        window.COMPUTE.syncDryAtmosphereMassKg(DATA['⚖️']);

        // IMPORTANT : On signale à l'UI et logique la proportion marine
        DATA['🌊']['⚖️🌊🏭'] = total_carbon_mass - new_mass_atm;

        if (CC.logCo2PartitionDiagnostic === true) {
            const mApply = 'APPLY eff=' + effPump01.toFixed(3)
                + ' base=' + effPumpBase.toFixed(3)
                + ' epoch×=' + epochPumpFactor.toFixed(2)
                + ' factor=' + partitionFactor01.toFixed(3)
                + ' ep=' + epochId
                + ' T_K=' + T_curr.toFixed(2)
                + ' ratio_T=' + ratio_T.toExponential(3)
                + ' CO2_atm ' + old_mass_atm.toExponential(3) + '→' + new_mass_atm.toExponential(3)
                + ' CO2_ocean=' + DATA['🌊']['⚖️🌊🏭'].toExponential(3);
            console.log(mApply);
            window.debugMirrorConfigLogToFile('logCo2PartitionDiagnostic', mApply);
        }
    }

    return true;
}

/**
 * Puits de carbone du CO₂ INJECTÉ (📜🔺⚖️🏭 = E, kg CO₂) — appelé UNE fois par événement de durée dtYears.
 * État : O = 📜🔺⚖️🌊🏭 (absorbé océan, ocean/sinks_ocean.js), L = 📜🔺⚖️🌳🏭 (stocké forêts,
 * land/sinks_land.js). Atmosphère = ⚖️🏭 époque + E − O − L (compute.js getMasses).
 * Ce fichier n'ORCHESTRE que : il découpe le temps, calcule le CO₂ de milieu de pas, et appelle
 * les deux puits. Leur physique respective vit dans leur propre fichier.
 *
 * L'événement est INTÉGRÉ PAR PAS DE stepYears (1 an) : l'émission est étalée (émis/n par pas) et les deux
 * puits relaxent d'un pas à la fois. Un pas unique de 25 ans versait tout à l'instant zéro puis laissait les
 * puits agir 25 ans sur la totalité — le CO₂ de 2024 absorbé comme celui de 2000. Même équation, intégrale
 * juste. L'appelant (events.js) a déjà ajouté emittedKg à 📜🔺⚖️🏭 : on repart donc du cumul d'AVANT le clic.
 */
function advanceCarbonSinks(dtYears, emittedKg) {
    const CS = window.CONFIG_COMPUTE.CARBON_SINKS;
    const P = window.DATA['📜'];
    window.OCEAN_SINK.assertOceanCapacity(CS.oceanBoxes);
    window.OCEAN_SINK.syncOceanBoxes(P['🔺⚖️🌊🏭'], CS.oceanBoxes);
    window.LAND_SINK.syncLandStocks(P['🔺⚖️🌳🏭']);
    const nSteps = Math.max(1, Math.round(dtYears / CS.stepYears));
    const dt = dtYears / nSteps;
    const emitPerStep = emittedKg / nSteps;
    const E_before = P['🔺⚖️🏭'] - emittedKg;        // cumul émis avant ce clic
    for (let i = 0; i < nSteps; i++) {
        advanceCarbonSinksStep(dt, E_before + (i + 1) * emitPerStep, emitPerStep);
    }
}

/**
 * Un pas d'intégration des puits. E_cum = cumul émis À LA FIN du pas (kg CO₂), emitStep = ce qu'a versé le pas.
 * Ne touche pas à 📜🔺⚖️🏭 : seuls O (📜🔺⚖️🌊🏭) et L (📜🔺⚖️🌳🏭) avancent.
 * Forêts d'abord, océan ensuite : l'océan ne voit que ce que la biosphère n'a pas pris.
 */
function advanceCarbonSinksStep(dtYears, E_cum, emitStep) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const P = DATA['📜'];
    const C0 = EPOCH['⚖️🏭'];                        // équilibre de l'époque (kg)
    // CO₂ atmosphérique au MILIEU du pas (émission étalée sur dt)
    const C_mid = C0 + E_cum - emitStep / 2 - P['🔺⚖️🌊🏭'] - P['🔺⚖️🌳🏭'];
    // ppm via composition du dernier calcul (fraction massique × M_air / M_CO2)
    const ppmPerKg = (DATA['🫧']['🍰🫧🏭'] * 1e6 * DATA['🫧']['🧪'] / CONST.M_CO2) / DATA['⚖️']['⚖️🏭'];
    const ppm_mid = C_mid * ppmPerKg;

    window.LAND_SINK.advanceLandSinkStep(dtYears, C_mid, C0, emitStep);

    const airExcess = E_cum - P['🔺⚖️🌳🏭'] - window.OCEAN_SINK.totalKg();
    window.OCEAN_SINK.advanceOceanSinkStep(dtYears, airExcess, ppm_mid);
}

window.CO2 = {};
window.CO2.calculateCO2Partition = calculateCO2Partition;
window.CO2.advanceCarbonSinks = advanceCarbonSinks;
