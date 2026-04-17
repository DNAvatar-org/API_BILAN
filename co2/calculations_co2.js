// ============================================================================
// File: API_BILAN/co2/calculations_co2.js - Cycle CO2 océan-atmosphère
// Desc: En français, dans l'architecture, je suis le module de partition CO₂ (atmosphère ↔ océan) appelé par le cycle principal.
// Version 1.1.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [April 02, 2026] [23:50 UTC+1]
// Logs:
// - v1.1.1: traces load/NO-OP/APPLY via pdTrace (pd réservé aux erreurs)
// - v1.1.0: NO-OP si HYSTERESIS.active ou si co2OceanPartitionInRadiativeConvergence !== true (pompe hors convergence naturelle)
// - v1.0.9: pompe océan uniquement via CONFIG_COMPUTE (co2OceanEffPump01 + défauts pump/scale) ; plus de 🌊🏭🧲 dans TIMELINE
// - Doc: CONFIG_COMPUTE co2Ocean* défauts / plages ajustés après tests convergence ; UI = jauges hystérésis search / scie
// - Add ocean pump factor and conserve CO2 mass from current state
// - Make pump=0 a strict no-op (no memory side effects)
// - Add entry/exit debug logs (load + no-op)
// - Global attenuation scale (default 0.1) for safer tests
// - Make ratio_ref configurable (CONFIG_COMPUTE.co2OceanRatioRef)
// ============================================================================

// Log de chargement (permet de vérifier si l'inclusion du module change l'ordre ou overwrite des globals).
// Crash-first: pdTrace() doit exister côté visu_ (chargé via static/debug.js).
if (typeof window.pdTrace === 'function') window.pdTrace('load', 'calculations_co2.js', 'module loaded');

function calculateCO2Partition() {
    const DATA = window.DATA;
    // Crash-first: DATA['⚖️'] doit exister, sinon ça doit planter.

    const CC = window.CONFIG_COMPUTE || {};
    // Absorption CO₂ par la mer : prévue pour une séquence anthropique / fin de chaîne, pas pour la convergence
    // radiative naturelle ni la recherche hystérésis (voir CONFIG_COMPUTE.co2OceanPartitionInRadiativeConvergence).
    const HY = window.HYSTERESIS;
    switch (true) {
        case !!(HY && HY.active):
        case CC.co2OceanPartitionInRadiativeConvergence !== true:
            return true;
        default:
    }

    // On ne s'active que s'il y a de l'eau liquide disponible à l'origine
    const hasOceanWater = DATA['⚖️']['⚖️💧'] > 0;

    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const epochId = DATA['📜']['🗿'];

    const T_curr = DATA['🧮']['🧮🌡️'];
    const T_ref = EPOCH['🌡️🧮'];

    function clamp01(x, fallback) {
        const n = Number(x);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0, Math.min(1, n));
    }
    const pump01 = clamp01(CC.co2OceanPumpOverride01, 1.0);
    const scale01 = clamp01(CC.co2OceanScale01, 0.1);
    const effRaw = Number(CC.co2OceanEffPump01);
    const effPump01 = Number.isFinite(effRaw)
        ? Math.max(0, Math.min(1, effRaw))
        : (pump01 * scale01);

    // IMPORTANT: pump=0 doit être un no-op strict.
    // Sinon, le simple "passage" dans la fonction peut créer une mémoire (⚖️🌊🏭) qui diverge entre visu_ et search.
    if (effPump01 <= 0) {
        if (typeof window.pdTrace === 'function') window.pdTrace(
            'co2',
            'calculations_co2.js',
            'NO-OP eff=' + effPump01.toFixed(3)
                + ' pump=' + pump01.toFixed(3)
                + ' scale=' + scale01.toFixed(3)
                + ' ep=' + epochId
                + ' hasOceanWater=' + (hasOceanWater ? 1 : 0)
        );
        return true;
    }

    // Initialiser la section océan uniquement si on active le mécanisme.
    DATA['🌊'] = DATA['🌊'] || {};
    if (DATA['🌊']['⚖️🌊🏭'] == null) DATA['🌊']['⚖️🌊🏭'] = 0;

    if (hasOceanWater) {
        // Le refroidissement profond sous la glace permet toujours l'échange à l'équilibre.
        // L'eau liquide de l'océan ne descend pas en dessous de 271.15 K (~ -2°C).
        const T_ocean = Math.max(271.15, T_curr);

        // ----- LOI DE HENRY (Van 't Hoff) -----
        // Constante thermique typique de la solubilité du CO2: ~2400 K
        // Rapport d'équilibre Masse CO2_océan / Masse_CO2_atm = 50 (aujourd'hui)
        const ratio_ref = (window.CONFIG_COMPUTE && Number.isFinite(Number(window.CONFIG_COMPUTE.co2OceanRatioRef)))
            ? Math.max(0.1, Number(window.CONFIG_COMPUTE.co2OceanRatioRef))
            : 50.0;
        const delta_inv_T = (1.0 / T_ocean) - (1.0 / T_ref);
        const ratio_T = ratio_ref * Math.exp(2400.0 * delta_inv_T);

        // Conservation du carbone (état courant) pour éviter les sauts inter-époques
        const total_carbon_mass = DATA['⚖️']['⚖️🏭'] + (DATA['🌊']['⚖️🌊🏭'] || 0);

        // M_atm(T) = M_total / (1 + ratio_T)
        const eq_mass_atm = Math.max(0, total_carbon_mass / (1.0 + ratio_T));
        const new_mass_atm = DATA['⚖️']['⚖️🏭'] + effPump01 * (eq_mass_atm - DATA['⚖️']['⚖️🏭']);

        // On met à jour la masse atmosphérique et la masse totale d'air sec
        const old_mass_atm = DATA['⚖️']['⚖️🏭'];
        DATA['⚖️']['⚖️🏭'] = new_mass_atm;
        DATA['⚖️']['⚖️🫧'] += (new_mass_atm - old_mass_atm);

        // IMPORTANT : On signale à l'UI et logique la proportion marine
        DATA['🌊']['⚖️🌊🏭'] = total_carbon_mass - new_mass_atm;

        if (typeof window.pdTrace === 'function') window.pdTrace(
            'co2',
            'calculations_co2.js',
            'APPLY eff=' + effPump01.toFixed(3)
                + ' pump=' + pump01.toFixed(3)
                + ' scale=' + scale01.toFixed(3)
                + ' ep=' + epochId
                + ' T_K=' + T_curr.toFixed(2)
                + ' ratio_T=' + ratio_T.toExponential(3)
                + ' CO2_atm ' + old_mass_atm.toExponential(3) + '→' + new_mass_atm.toExponential(3)
                + ' CO2_ocean=' + DATA['🌊']['⚖️🌊🏭'].toExponential(3)
        );
    }

    return true;
}

window.CO2 = window.CO2 || {};
window.CO2.calculateCO2Partition = calculateCO2Partition;
