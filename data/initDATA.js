// File: API_BILAN/data/initDATA.js - Initialisation de l'objet DATA
// Desc: Crée DATA depuis KEYS (dico.js) et 🎚️ ; chargé après dico.js. Source unique d'init.
// Version 1.0.10
// Date: [April 18, 2026] [18:00 UTC+1]
// logs :
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
    var _baryDefault = { CLOUD_SW: 65, SCIENCE: 65, SOLVER: 100, HYSTERESIS: 100 };
    // Aligné window.CONFIG_COMPUTE.baryByGroupDefault. UI : une jauge ATM = même % pour CLOUD_SW et SCIENCE.
    var _solverDefault = { TOL_MIN_WM2: 0.10, MAX_SEARCH_STEP_K: 140, MAX_SEARCH_STEP_LARGE_K: 200, LARGE_DELTA_FACTOR: 16, DELTA_T_ACCELERATION_DAYS: 10, FIRST_SEARCH_STEP_CAP_K: 8 };  // 10 j (litt. 8–10 j) ; cap 1er pas Init (test vs yoyo ~13 K)
    // Valeurs nominales objets 🎚️ ; positions le long des plages = baryByGroup (ATM 65/65 par défaut).
    var _cloudSwDefault = {
        CCN_BASE: 0.15, CCN_O2_WEIGHT: 0.85, BIOMASS_GAIN: 4.0,
        ANTHRO_RISE_START_YEAR: 1900, ANTHRO_RISE_WINDOW_YEARS: 80, ANTHRO_RISE_MAX: 0.25,
        ANTHRO_DECAY_START_YEAR: 1980, ANTHRO_DECAY_WINDOW_YEARS: 40, ANTHRO_DECAY_MAX: 0.15,
        SULFATE_BOOST_SCALE: 700, SULFATE_BOOST_MAX: 0.45,
        MODERN_REF_O2: 0.21, MODERN_REF_FOREST: 0.03,
        PRESSURE_FACTOR_MAX: 1.2, OXIDATION_BASE: 0.3, OXIDATION_O2_GAIN: 4.0,
        TEMP_FACTOR_MIN: 0.6, TEMP_FACTOR_MAX: 1.3, TEMP_FACTOR_REF_K: 294,
        OPTICAL_EFF_BASE: 1.20, OPTICAL_EFF_CCN_GAIN: 0.60,
        OXIDATION_SOFT_BASE: 0.85, OXIDATION_SOFT_GAIN: 0.15,
        CLOUD_FRACTION_BASE: 0.23, CLOUD_FRACTION_INDEX_GAIN: 0.14, CLOUD_FRACTION_MAX: 0.75
    };
    // Aligné FINE_TUNING_BOUNDS groupe HYSTERESIS (defaults = 100 % bary)
    var _hystDefault = {
        seaIceTransitionRangeK: 2.2,
        seaIceStrength01: 1,
        iceImpactFactor01: 0.7,
        co2OceanEffPump01: 0.1
    };
    // Aligné FINE_TUNING_BOUNDS groupe RADIATIVE (bary SCIENCE 50 % : interp. linéaire 1.00 → 0.60)
    var _radiativeDefault = {
        H2O_EDS_SCALE: 0.80
    };
    DATA['🎚️'] = {
        baryByGroup: { CLOUD_SW: _baryDefault.CLOUD_SW, SCIENCE: _baryDefault.SCIENCE, SOLVER: _baryDefault.SOLVER, HYSTERESIS: _baryDefault.HYSTERESIS },
        CLOUD_SW: _cloudSwDefault,
        SOLVER: { TOL_MIN_WM2: _solverDefault.TOL_MIN_WM2, MAX_SEARCH_STEP_K: _solverDefault.MAX_SEARCH_STEP_K, MAX_SEARCH_STEP_LARGE_K: _solverDefault.MAX_SEARCH_STEP_LARGE_K, LARGE_DELTA_FACTOR: _solverDefault.LARGE_DELTA_FACTOR, DELTA_T_ACCELERATION_DAYS: _solverDefault.DELTA_T_ACCELERATION_DAYS, FIRST_SEARCH_STEP_CAP_K: _solverDefault.FIRST_SEARCH_STEP_CAP_K },
        HYSTERESIS: _hystDefault,
        RADIATIVE: _radiativeDefault
    };
    // Réservoir océan (cycle CO2) : non présent dans KEYS, on l'initialise ici.
    if (!DATA['🌊']) DATA['🌊'] = {};
    DATA['🌊']['⚖️🌊🏭'] = 0;
    window.DATA = DATA;
})();
