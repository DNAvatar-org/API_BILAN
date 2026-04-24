// ============================================================================
// File: API_BILAN/co2/calculations_co2.js - Cycle CO2 océan-atmosphère
// Desc: En français, dans l'architecture, je suis le module de partition CO₂ (atmosphère ↔ océan) appelé par le cycle principal.
// Version 1.2.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [April 24, 2026]
// Logs:
// - v1.2.1: Ajout CONFIG_COMPUTE.co2OceanPartitionFactor01 comme multiplicateur contractuel de la
//           partition CO₂ océan-atmosphère. 1 = comportement v1.2.0 ; 0 = test off strict via eff=0.
// - v1.2.0: POMPE TOUJOURS ACTIVE (bench = visu). NO-OPs HYSTERESIS.active / co2OceanPartitionInRadiativeConvergence RETIRÉS.
//           Nouvelle clé EPOCH['🌊🏭'] (facteur pompe océanique par époque ∈ [0, +∞[) — multiplie effPump01.
//           0 désactive la pompe pour l'époque (pas de mer liquide : ⚫ 🔥 🦠). 0.15 Protérozoïque (Urey lent pré-Rodinia).
//           0.5 Sturtien (Rodinia break-up accélère silicate weathering). 2.0 Marinoen (déglaciation catastrophique,
//           Higgins & Schrag 2003). 1.0 ≥ Paléozoïque (Urey stable). 1.3 Carbonifère (forêts→altération accélérée,
//           Berner & Kothavala 2001 GEOCARB III). 0.7 P/T (Trapps sibériens saturent océan, Walker Hays Kasting 1981).
//           L'équilibre à l'init d'époque est garanti par initForConfig qui seed ⚖️🌊🏭 = ratio_ref × ⚖️🏭 (T=T_ref
//           ⇒ ratio_T = ratio_ref ⇒ pump net flux = 0 au pas 0). Pump se re-active dès qu'⚖️🏭 dévie (anthropique,
//           user click, tranche 🏭📊) ou que T dévie de T_ref (convergence radiative).
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
    // v1.2.0 : POMPE TOUJOURS ACTIVE (user "bench = visu"). Plus de NO-OP global ; les contrôles d'activation
    // sont maintenant : (1) EPOCH['🌊🏭'] facteur par époque (0 = pas de mer / Urey éteint), (2) hasOceanWater
    // (pas d'eau liquide ⇒ rien à faire), (3) effPump01 (jauge UI). L'équilibre à l'init est garanti par
    // initForConfig qui seed ⚖️🌊🏭 = ratio_ref × ⚖️🏭 ⇒ net flux = 0 au pas 0 en l'absence de perturbation.

    // On ne s'active que s'il y a de l'eau liquide disponible à l'origine
    const hasOceanWater = DATA['⚖️']['⚖️💧'] > 0;

    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const epochId = DATA['📜']['🗿'];

    const T_curr = DATA['🧮']['🧮🌡️'];
    const T_ref = EPOCH['🌡️🧮'];

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

    // Jauges UI — source CONFIG_COMPUTE (jauges hystérésis). Ces clés peuvent être absentes
    // si aucune jauge n'a écrit dedans (bench pur), d'où fallback légitime (pas défensif contre bug).
    function clamp01(x, fallback) {
        const n = Number(x);
        return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
    }
    const pump01 = clamp01(CC.co2OceanPumpOverride01, 1.0);
    const scale01 = clamp01(CC.co2OceanScale01, 0.1);
    const effPumpBase = clamp01(CC.co2OceanEffPump01, pump01 * scale01);
    const partitionFactor01 = Math.max(0, Number(CC.co2OceanPartitionFactor01));
    // epochPumpFactor peut dépasser 1 (déglaciation Marinoen ×2) → pas de clamp supérieur.
    const effPump01 = effPumpBase * epochPumpFactor * partitionFactor01;

    // IMPORTANT: pump=0 doit être un no-op strict.
    // Sinon, le simple "passage" dans la fonction peut créer une mémoire (⚖️🌊🏭) qui diverge entre visu_ et search.
    // v1.2.0 : eff peut être 0 via epochPumpFactor=0 (⚫ 🔥 🦠 ⛄) OU via base=0 (jauge fermée).
    if (effPump01 <= 0) {
        if (typeof window.pdTrace === 'function') window.pdTrace(
            'co2',
            'calculations_co2.js',
            'NO-OP eff=' + effPump01.toFixed(3)
                + ' base=' + effPumpBase.toFixed(3)
                + ' epoch×=' + epochPumpFactor.toFixed(2)
                + ' pump=' + pump01.toFixed(3)
                + ' scale=' + scale01.toFixed(3)
                + ' factor=' + partitionFactor01.toFixed(3)
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
                + ' base=' + effPumpBase.toFixed(3)
                + ' epoch×=' + epochPumpFactor.toFixed(2)
                + ' pump=' + pump01.toFixed(3)
                + ' scale=' + scale01.toFixed(3)
                + ' factor=' + partitionFactor01.toFixed(3)
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
