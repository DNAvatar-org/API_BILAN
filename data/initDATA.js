// File: API_BILAN/data/initDATA.js - Initialisation DATA + window.DEFAULT (defaults uniques)
// Desc: En français, dans l'architecture, je suis la source unique des valeurs par défaut live interpolées
//       (window.DEFAULT.TUNING : baryByGroup / CLOUD_SW / HYSTERESIS / RADIATIVE ; window.DEFAULT.BOUNDS.HYSTERESIS
//       pour les plages UI). Je clone ces defaults dans DATA['🎚️'] au chargement : DATA est ensuite la seule
//       référence live lue par la physique (tuning.js/applyTuningPayload écrit dedans via FINE_TUNING_BOUNDS × baryByGroup).
//       Les paramètres SOLVER (statiques, non interpolés) vivent dans window.CONFIG_COMPUTE (configTimeline.js),
//       pas dans DATA/DEFAULT.
// Version 1.3.6
// Date: [April 25, 2026]
// Logs:
// - v1.3.6: baryByGroup.ATM / CLOUD_SW / SCIENCE défaut 13 % (calage utilisateur flou) ; miroir CONFIG_COMPUTE.baryByGroupDefault.
// - v1.3.5: RADIATIVE.factorTropopause = 1,0261 (aligné CONFIG_COMPUTE.radiativeFactorTropopauseFixed, hors bary).
// - v1.3.4: doc RADIATIVE.factorTropopause — plage FINE_TUNING resserrée 1,03–1,00 (v1.3.9) ; défaut numérique 1,03 inchangé.
// - v1.3.3: DEFAULT.TUNING.RADIATIVE.factorTropopause (interpolé FINE_TUNING_BOUNDS SCIENCE) — source unique lue par ATM.calculateTropopauseHeight ; CONFIG_COMPUTE.radiativeTropopauseExtensionFactor retiré.
// - v1.3.2: window.DEBUG_SYNC_PANELS / DEBUG_CONVERGENCE_BINS / DEBUG_TIMELINE_HIDDEN = false (source unique, évite rester true après session debug)
// - v1.3.1: CONFIG_COMPUTE.baryByGroupDefault = copie profonde de DEFAULT.TUNING.baryByGroup après init DATA['🎚️'] — ref unique utilisateur (plus de littéral dupliqué dans configTimeline qui écrasait CLOUD_SW/SCIENCE vs ATM au bench).
// - v1.3.0: création window.UI_STATE (flags UI) + window.RUNTIME_STATE (état d'exécution live). Regroupe les dizaines de window.minuscule épars (waterVaporEnabled, methaneEnabled, calculationConverged, fps, plotData, currentEpochName, spectralConverged, h2oVaporPercent…) sous deux namespaces source unique. Initialisation au tout début du boot (avant loader_panels charge les consommateurs).
// - v1.2.0: retrait bloc SOLVER de DEFAULT.TUNING (+ plus de DATA['🎚️'].SOLVER) → source unique SOLVER = window.CONFIG_COMPUTE (configTimeline.js clés tolMinWm2/maxSearchStepK/maxSearchStepLargeK/largeDeltaFactor/deltaTAccelerationDays/firstSearchStepCapK). DATA['🎚️'] = clone(DEFAULT.TUNING) = baryByGroup/CLOUD_SW/HYSTERESIS/RADIATIVE uniquement.
// - v1.1.0: window.DEFAULT.TUNING (source unique defaults : baryByGroup/CLOUD_SW/SOLVER/HYSTERESIS/RADIATIVE) + window.DEFAULT.BOUNDS.HYSTERESIS (plages UI). DATA['🎚️'] = clone(DEFAULT.TUNING). Retrait de window.TUNING (remplacé dans model_tuning.js + migrations lecteurs live).
// - v1.0.12: retrait DATA['🎚️'].SOLVER + baryByGroup.SOLVER + _solverDefault (déplacés vers window.TUNING.SOLVER, source unique lue par calculations_flux.js / calculations_h2o.js). Bary SOLVER jamais exposée en UI.
// - v1.0.11: FIRST_SEARCH_STEP_CAP_K 4 K (amortissement 1er pas après Init, plus fort que 8 K)
// - v1.0.10: SOLVER.FIRST_SEARCH_STEP_CAP_K 8 (1er pas après Init ; lissage trajet vs 0) ; aligné configsAll / TUNING / configTimeline fallback
// - v1.0.9: baryByGroup défaut CLOUD_SW 65 + SCIENCE 65 (bench / convergence ajustée ailleurs) ; aligné CONFIG_COMPUTE
// - v1.0.8: baryByGroup défaut CLOUD_SW 50 + SCIENCE 50 (jauge unique scie/bench) ; aligné CONFIG_COMPUTE.baryByGroupDefault
// - v1.0.7: baryByGroup défaut aligné CONFIG_COMPUTE — CLOUD_SW 100, SCIENCE 50, SOLVER 100, HYSTERESIS 100 ; H2O_EDS_SCALE 0.80 (= interp. SCIENCE 50 % sur cible min 1 / max 0.60)
// - v1.0.6: DATA['🎚️'].RADIATIVE.H2O_EDS_SCALE (défaut 0.60 = bary SCIENCE 100 % = valeur max fine_tuning_bounds)
// - v1.0.5: FIRST_SEARCH_STEP_CAP_K défaut 0 (désactivé ; aligné configsAll v1.0.17)
// - v1.0.4: SOLVER.FIRST_SEARCH_STEP_CAP_K (aligné configsAll / fine_tuning_bounds)
// - v1.0.3: DATA['🎚️'].HYSTERESIS + baryByGroup.HYSTERESIS (fillDataTuningFromBary / sync scie → parent)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: extraction init DATA depuis dico.js (KEYS → DATA, puis 🎚️)
// - v1.0.1: init DATA['🌊'] pour cycle CO2 océan
// - v1.0.2: init DATA['🌊']['⚖️🌊🏭']=0 (debug/affichage)

(function () {
    'use strict';

    // ============================================================================
    // window.DEFAULT — defaults uniques (source de clonage vers DATA['🎚️']).
    // Séparé en deux sous-objets :
    //   - DEFAULT.TUNING : valeurs scalaires live (copiées dans DATA['🎚️']).
    //   - DEFAULT.BOUNDS : plages {min, max, default, sens_threshold} pour interpolation UI
    //                      (pas dans DATA, lues directement par les panneaux).
    // ============================================================================
    window.DEFAULT = window.DEFAULT || {};

    window.DEFAULT.TUNING = {
        // Jauge unique ATM : même % CLOUD_SW et SCIENCE (initDATA v1.0.9).
        baryByGroup: { ATM: 13, CLOUD_SW: 13, SCIENCE: 13, HYSTERESIS: 100 },

        // Nuages SW : proxy CCN + efficacité optique (calibrations calculations_albedo.js).
        CLOUD_SW: {
            CCN_BASE: 0.15, CCN_O2_WEIGHT: 0.85, BIOMASS_GAIN: 4.0,
            ANTHRO_RISE_START_YEAR: 1900, ANTHRO_RISE_WINDOW_YEARS: 80, ANTHRO_RISE_MAX: 0.25,
            ANTHRO_DECAY_START_YEAR: 1980, ANTHRO_DECAY_WINDOW_YEARS: 40, ANTHRO_DECAY_MAX: 0.15,
            SULFATE_BOOST_SCALE: 700, SULFATE_BOOST_MAX: 0.45,
            MODERN_REF_O2: 0.21, MODERN_REF_FOREST: 0.03,
            PRESSURE_FACTOR_MAX: 1.2, OXIDATION_BASE: 0.3, OXIDATION_O2_GAIN: 4.0,
            // TEMP_FACTOR_* supprimés (v1.1.1) : remplacés par la partition de phase
            // Hu & Stamnes (1993) codée en dur dans calculations_albedo.js (calib stable).
            OPTICAL_EFF_BASE: 1.20, OPTICAL_EFF_CCN_GAIN: 0.60,
            OXIDATION_SOFT_BASE: 0.85, OXIDATION_SOFT_GAIN: 0.15,
            CLOUD_FRACTION_BASE: 0.23, CLOUD_FRACTION_INDEX_GAIN: 0.14, CLOUD_FRACTION_MAX: 0.75
        },

        // Note : paramètres SOLVER (tolérance, caps, FIRST_SEARCH_STEP_CAP_K, DELTA_T_ACCELERATION_DAYS) →
        // window.CONFIG_COMPUTE dans configTimeline.js. Statiques, pas interpolés → pas dans DATA/DEFAULT.

        // Hystérésis (scalaires live) — lus par scie_hysteresis_search.js (scan + dicho seuil CO₂),
        // interpolés par tuning.js/fillDataTuningFromBary depuis FINE_TUNING_BOUNDS groupe HYSTERESIS.
        // Les plages UI (seaIceTransitionRangeK.{min,max}, iceAlbedoCoeff.{min,max}…) sont dans DEFAULT.BOUNDS.HYSTERESIS.
        HYSTERESIS: {
            // Paramètres physiques (interpolés depuis FINE_TUNING_BOUNDS)
            seaIceTransitionRangeK: 2.2,
            seaIceStrength01: 1,
            iceImpactFactor01: 0.7,
            co2OceanEffPump01: 0.1,
            // Paramètres scan/dichotomie CO₂ (scie_hysteresis_search.js v2)
            epsilonT_C: 1,
            epsilonPpm: 1,
            convergencePpmMass: 1,
            brutalDeltaT_C: 3,
            // scanCo2MassFactor : ratio ×fac par pas scan. 0.5 → CO₂ /2 par pas (agressif, peu de pas pour traverser
            //   la zone bi-stable 1280→128 ppm). Ancien défaut 0.9 trop lent (22 pas pour atteindre 128 ppm).
            scanCo2MassFactor: 0.5,
            // scanFailRatio : plancher de la plage de scan en fraction de ⚖️🏭₀. 0.1 = stop si ⚖️🏭 < 10 % du baseline.
            //   Motivation : fourchette seuil snowball GCM 100-300 ppm = 8-24 % de 1280 ppm baseline Sturtien.
            //   Ancien code "½·⚖️🏭₀" (50 %) s'arrêtait 4× trop haut (640 ppm) avant d'atteindre la zone bi-stable.
            //   Références : Voigt & Marotzke 2010 ECHAM5 ; Voigt & Abbot 2012 ; Yang et al. 2012 CCSM3 ;
            //   Hörner et al. 2022 Clim. Past 18:2437. En mode positif (saut chaud), miroir = 1/scanFailRatio.
            scanFailRatio: 0.1,
            maxDichoSteps: 30,
            warmBranchHint_C: -5,
            coldBranchHint_C: -20,
            // Couplage CCN-CO₂ : ⚖️✈ = baseline × (x0/xNew)^ccnSulfateCoupling à chaque pas du scan.
            // 0 = désactivé ; 0.5 = racine carrée (softer) ; 1 = inverse linéaire.
            ccnSulfateCoupling: 0.5
            // dT_pol / dT_mid / dT_trop : SOURCE UNIQUE = configTimeline.js EPOCH['🥶'] (per-époque).
            // Migration v1.4.51 (depuis CONFIG_COMPUTE.polarAmplificationK global, supprimé).
            // Modulation supplémentaire par obliquité ⚾ (Laskar/Williams 1993) sur les amp_*.
        },

        // Radiatif : κ_H₂O global (FINE_TUNING_BOUNDS groupe RADIATIVE, baryGroup SCIENCE).
        // Propagé vers EARTH.H2O_EDS_SCALE par tuning.js/syncRadiativeConfig.
        // factorTropopause : × hauteur radiative effective (ATM.calculateTropopauseHeight), même jauge ATM que H2O_EDS.
        RADIATIVE: {
            H2O_EDS_SCALE: 0.80,
            factorTropopause: 1.0261
        }
    };

    // Plages UI hystérésis (min/max/sens) pour panneaux scie / search.
    // Références : Budyko 1969, Sellers 1969 (rétroaction glace-albédo) ; Hoffman & Schrag 2002, Pierrehumbert 2004 (Snowball Earth).
    window.DEFAULT.BOUNDS = window.DEFAULT.BOUNDS || {};
    window.DEFAULT.BOUNDS.HYSTERESIS = {
        seaIceTransitionRangeK:   { min: 1,    max: 80,  default: 20,  sens_threshold: '➘' },
        seaIceStrength01:         { min: 0.0,  max: 1.0, default: 1.0, sens_threshold: '➚' },
        co2OceanScale01:          { min: 0.0,  max: 1.0, default: 0.1, sens_threshold: '➚' },
        co2OceanPumpOverride01:   { min: 0.0,  max: 1.0, default: 1.0, sens_threshold: '➚' },
        co2OceanEffPump01:        { min: 0.0,  max: 1.0, default: 0.1, sens_threshold: '➚' },
        iceAlbedoCoeff:           { min: 0.50, max: 0.90, default: 0.70, sens_threshold: '➚' }
    };

    // ============================================================================
    // Création DATA depuis KEYS (dico.js) + clone DEFAULT.TUNING dans DATA['🎚️'].
    // ============================================================================
    var KEYS = window.KEYS;
    var DATA = {};
    var categoryKey, category, keysArray, fullKey;
    for (categoryKey in KEYS) {
        category = KEYS[categoryKey];
        DATA[categoryKey] = {};
        keysArray = Array.isArray(category) ? category : Object.values(category);
        for (fullKey of keysArray) {
            if (fullKey.startsWith('🔘')) {
                DATA[categoryKey][fullKey] = false;
            } else if (fullKey.includes('⚧')) {
                DATA[categoryKey][fullKey] = '';
            } else if (fullKey.includes('☯')) {
                DATA[categoryKey][fullKey] = 0;
            } else if (fullKey === '🔺🧲🌕💫') {
                DATA[categoryKey][fullKey] = { '▶': 0, '◀': 0 };
            } else {
                DATA[categoryKey][fullKey] = 0.0;
            }
        }
    }

    // DATA['🎚️'] = deep clone de DEFAULT.TUNING (source live de la physique).
    // Copie indépendante : modifier DATA['🎚️'] n'affecte pas DEFAULT (qui reste la graine).
    DATA['🎚️'] = JSON.parse(JSON.stringify(window.DEFAULT.TUNING));

    // Miroir legacy : un seul jeu de % jauge (ATM = CLOUD_SW = SCIENCE en usage unifié).
    // benchSyncBaryFromConfigCompute / docs anciennes lisent CONFIG_COMPUTE.baryByGroupDefault.
    if (window.CONFIG_COMPUTE && window.DEFAULT.TUNING && window.DEFAULT.TUNING.baryByGroup) {
        window.CONFIG_COMPUTE.baryByGroupDefault = JSON.parse(JSON.stringify(window.DEFAULT.TUNING.baryByGroup));
    }

    // Réservoir océan (cycle CO2) : non présent dans KEYS, on l'initialise ici.
    if (!DATA['🌊']) DATA['🌊'] = {};
    DATA['🌊']['⚖️🌊🏭'] = 0;

    window.DATA = DATA;

    // ============================================================================
    // window.UI_STATE — flags contrôlés par l'UI (toggles utilisateur, options).
    // ============================================================================
    window.UI_STATE = window.UI_STATE || {};
    // Toggles modules physiques activables par l'utilisateur (checkboxes panel).
    window.UI_STATE.waterVaporEnabled = true;
    window.UI_STATE.methaneEnabled = true;
    // Flags UI divers (anim, maximisation, debug).
    window.UI_STATE.maximiseData = false;
    window.UI_STATE.savedCO2 = 0;
    window.UI_STATE.savedCH4 = 0;
    window.UI_STATE.savedH2O = 0;
    window.UI_STATE.FPSalert = 25;     // seuil sous lequel updateFluxLabels est skippé
    window.UI_STATE.debugAPI = false;

    window.DEBUG_SYNC_PANELS = false;
    window.DEBUG_CONVERGENCE_BINS = false;
    window.DEBUG_TIMELINE_HIDDEN = false;

    // ============================================================================
    // window.RUNTIME_STATE — état live d'exécution (calculs en cours, mesures, caches).
    // ============================================================================
    window.RUNTIME_STATE = window.RUNTIME_STATE || {};
    // Convergence / calcul
    window.RUNTIME_STATE.calculationConverged = false;
    window.RUNTIME_STATE.calculationTimeouts = [];
    // Spectral
    window.RUNTIME_STATE.spectralConverged = false;
    window.RUNTIME_STATE.spectralPrecisionTarget = null;
    window.RUNTIME_STATE.showSpectralBackground = false;
    // H2O live (recalculés à chaque cycle)
    window.RUNTIME_STATE.h2oVaporPercent = 0;
    window.RUNTIME_STATE.h2oTotalFromMeteorites = 0;
    window.RUNTIME_STATE.h2oIceFractionFromCalculation = 0;
    // Époque courante
    window.RUNTIME_STATE.currentEpochName = null;
    // Mesure FPS (live, mise à jour par Three.js loop)
    window.RUNTIME_STATE.fps = 60;
    // T0 numérique (dernier T0 calculé, partagé plot/organigramme)
    window.RUNTIME_STATE.T0_num = 0;
    // Bonus volcan H2O (flag run-specific)
    window.RUNTIME_STATE.volcanoH2OBonus = 0;
})();
