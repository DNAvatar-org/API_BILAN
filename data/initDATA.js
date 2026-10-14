// File: API_BILAN/data/initDATA.js - Initialisation DATA + window.DEFAULT (defaults uniques)
// Desc: En français, dans l'architecture, je suis la source unique des valeurs par défaut live interpolées
//       (window.DEFAULT.TUNING : baryByGroup / CLOUD_SW / HYSTERESIS / RADIATIVE ; window.DEFAULT.BOUNDS.HYSTERESIS
//       pour les plages UI). Je clone ces defaults dans DATA['🎚️'] au chargement : DATA est ensuite la seule
//       référence live lue par la physique (tuning.js/applyTuningPayload écrit dedans via FINE_TUNING_BOUNDS × baryByGroup).
//       Les paramètres SOLVER (statiques, non interpolés) vivent dans window.CONFIG_COMPUTE (configTimeline.js),
//       pas dans DATA/DEFAULT.
// Version 1.4.4
// - v1.4.4 (2026-10-13): CLOUD_SW sans le proxy CCN (CCN_BASE, CCN_O2_WEIGHT, BIOMASS_GAIN, ANTHRO_*, MODERN_REF_*).
// - v1.4.3 (2026-10-13): barycentre ATM 62 → 15 % ; jauge R_EFF_PLUIE.
// - v1.4.2 (2026-10-12): CLOUD_SW — 9 constantes réglées des nuages SW retirées ; CDNC_OCEAN_CM3 (mesurée, Bennartz 2007).
// Date: [October 10, 2026]
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

(function () {
    'use strict';

    // ============================================================================
    // window.DEFAULT — defaults uniques (source de clonage vers DATA['🎚️']).
    // Séparé en deux sous-objets :
    //   - DEFAULT.TUNING : valeurs scalaires live (copiées dans DATA['🎚️']).
    //   - DEFAULT.BOUNDS : plages {min, max, default, sens_threshold} pour interpolation UI
    //                      (pas dans DATA, lues directement par les panneaux).
    // ============================================================================
    window.DEFAULT = {};

    window.DEFAULT.TUNING = {
        // Jauge unique ATM : même % CLOUD_SW et SCIENCE (initDATA v1.0.9) — flou scientifique (titre visu).
        // v-2026-09-23 : 45 → 65 %. Les fourchettes du banc ayant été re-sourcées (PhanDA pour le
        // Phanérozoïque, GISTEMP+Jones pour le moderne), le barycentre est le levier LÉGITIME pour
        // recoller — c'est la jauge d'ignorance déclarée, et la déplacer À L'INTÉRIEUR de plages
        // mesurées n'est pas un calage sur le résultat. Convention : 100 % = valeur la plus
        // REFROIDISSANTE de chaque plage, 0 % = la plus réchauffante (vérifié au banc : 45 → 65 %
        // refroidit les 19 époques de 0,8 à 8,6 °C). Effet : 8 → 11 époques dans leur fourchette.
        // v-2026-09-23 (soir) : 65 → 60 %. Balayage 40–80 % au banc : 60 % minimise l'écart à 1800
        // et 2000 (RMS 0,08 °C aux milieux 13,5 / 14,4 °C, GISTEMP+Jones), sans perdre d'époque
        // dans sa fourchette (8/15 depuis la Sturtienne, contre 7/15 à 65 %).
        // v-2026-09-23 : 60 → 62 %. La correction de MODERN_REF_O2 (molaire → massique) réchauffe le
        // moderne de ~0,1 °C ; rebalayé 55–65 % par pas de 1 avec tictime : 62 % donne 1800 = 13,58 °C
        // et 2000 = 14,32 °C (RMS 0,083 °C), 8/15 époques dans leur fourchette depuis la Sturtienne.
        // v-2026-10-13 : 62 → 15 %. Le modèle a changé de physique (transfert solaire Lacis & Hansen, nuages bas
        // adiabatiques limités par la pluie + enclumes, fractions GEWEX). Les jauges ATM portent maintenant des
        // fourchettes MESURÉES (CDNC 40–89 cm⁻³, seuil de pluie 13–14 µm, exposant sulfate 0,11–0,29). Banc 15/20/25 %
        // sans CIA inventée : 15 % recolle 1800 (13,37 °C) et 2000 (14,36 °C), 11/21 époques dans leur fourchette.
        // v-2026-10-13 (soir) : jauges séparées (fine_tuning_bounds v1.6.x). Avec la spectroscopie complétée (raies de la
        // fenêtre, CO₂ 850–2500 cm⁻¹, CIA mesurée) : FROID 45 → 📱 15,8 / 🚂 14,7 ; FROID 55 → 📱 14,2 / 🚂 12,8.
        // FROID 50 entre les deux (attendu ≈ 📱 15,0 / 🚂 13,7).
        baryByGroup: { FROID: 45, CHAUD: 45, SUBTIL: 70, HYSTERESIS: 70 },   // 2026-10-14 : 📱 2000 à 14,5 °C (essai utilisateur)

        // Nuages SW : nombre de gouttes, seuil de pluie, fractions, exposant sulfate (jauges mesurées).
        // Une constante par ligne, son UNITÉ entre crochets en tête du commentaire : la page
        // 🔎 Paramètres (CO2/scripts/params_doc/generate.py) la lit là et REFUSE d'écrire si elle manque.
        CLOUD_SW: {
            // CCN_BASE, CCN_O2_WEIGHT, BIOMASS_GAIN, ANTHRO_RISE_* / ANTHRO_DECAY_*, MODERN_REF_O2, MODERN_REF_FOREST
            // retirés le 2026-10-13 avec le « proxy CCN » O₂ × biomasse × anthropique (sans physique : l'O₂ n'est pas un
            // CCN). Le rapport de CCN n'est plus que la loi sulfate mesurée (calculations_albedo.js → rapportCCN).
            // SULFATE_BOOST_SCALE / SULFATE_BOOST_MAX supprimés (2026-09-22) : le facteur linéaire
            // et son plafond posé à la main sont remplacés par la loi de puissance mesurée de
            // McCoy 2018 (aerosols/sulfate_ccn.js). Une loi de puissance sature toute seule.
            SULFATE_CCN_EXPONENT: 0.29,      // [sans dimension (exposant de McCoy 2018)] valeur d'amorce, réinterpolée par tuning.js au chargement
            // Nombre de gouttes des nuages sur OCÉAN, Terre actuelle — jauge de FINE_TUNING_BOUNDS (Bennartz 2007, MODIS :
            // 40–89 cm⁻³ sur les océans éloignés). Lu par le profil nuageux (radiative/calculations.js, EARTH.NUAGES).
            // v-2026-10-12 : remplace PRESSURE_FACTOR_MAX, OXIDATION_*, OPTICAL_EFF_BASE, OXIDATION_SOFT_*,
            // CLOUD_FRACTION_BASE / _INDEX_GAIN / _MAX — la fraction est mesurée, la réflectance calculée.
            CDNC_OCEAN_CM3: 89,              // [cm⁻³] valeur d'amorce, réinterpolée par tuning.js au chargement
            // Rayon effectif d'initiation de la pluie (sommet des nuages bas) — jauge mesurée 13–14 µm.
            R_EFF_PLUIE: 14e-6,              // [m] valeur d'amorce, réinterpolée par tuning.js au chargement
            // Fractions de nuages bas / hauts (GEWEX 2024) — jauges FROID / CHAUD ; interpolées par tuning.js.
            F_BAS: 0.41,                     // [m²/m²]
            F_HAUT: 0.33                     // [m²/m²]
        },

        // Note : paramètres SOLVER (tolérance, caps, FIRST_SEARCH_STEP_CAP_K, DELTA_T_ACCELERATION_DAYS) →
        // window.CONFIG_COMPUTE dans configTimeline.js. Statiques, pas interpolés → pas dans DATA/DEFAULT.

        // Hystérésis (scalaires live) — interpolés par tuning.js depuis FINE_TUNING_BOUNDS groupe HYSTERESIS ;
        // lus par calculations_albedo.js (glace de mer, impact glace). co2OceanEffPump01 : voir calculations_co2.js.
        HYSTERESIS: {
            // Paramètres physiques (interpolés depuis FINE_TUNING_BOUNDS)
            seaIceTransitionRangeK: 2.2
            // dT_pol / dT_mid / dT_trop : SOURCE UNIQUE = configTimeline.js EPOCH['🥶'] (per-époque).
            // Migration v1.4.51 (depuis CONFIG_COMPUTE.polarAmplificationK global, supprimé).
            // Modulation supplémentaire par obliquité ⚾ (Laskar/Williams 1993) sur les amp_*.
        },
        // RADIATIVE (H2O_EDS_SCALE) retiré le 2026-10-13 : le multiplicateur de κ_H₂O n'a plus d'objet (fine_tuning_bounds v1.5.1).
        // Humidité relative de surface (ex-EARTH.H2O_SURFACE_RH_01) — jauge SUBTIL ; interpolée par tuning.js.
        H2O: {
            H2O_SURFACE_RH_01: 0.735         // [Pa/Pa (humidité relative e/e_sat)]
        }
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
            } else {
                DATA[categoryKey][fullKey] = 0.0;
            }
        }
    }

    // Calottes : posées par CLICS.frise depuis la config de l'époque (physics/calottes.js). null d'ici là : un calcul lancé
    // sans clic frise crashe à la lecture au lieu de partir d'un état inventé.
    DATA['🗻']['🍰🗻🧊'] = null;
    DATA['🗻']['🧮🍰🗻🧊'] = null;   // posé par calculateAlbedo à chaque pas

    // DATA['🎚️'] = deep clone de DEFAULT.TUNING (source live de la physique).
    // Copie indépendante : modifier DATA['🎚️'] n'affecte pas DEFAULT (qui reste la graine).
    DATA['🎚️'] = JSON.parse(JSON.stringify(window.DEFAULT.TUNING));

    // Réservoir océan (cycle CO2) : non présent dans KEYS, on l'initialise ici.
    DATA['🌊'] = { '⚖️🌊🏭': 0 };

    // Flags runtime (anim plot) : hors dico KEYS — 🔘🎞 = false au boot (crash-first : objet toujours présent).
    DATA['🔘'] = { '🔘🎞': false };

    window.DATA = DATA;

    // ============================================================================
    // window.UI_STATE — flags contrôlés par l'UI (toggles utilisateur, options).
    // ============================================================================
    window.UI_STATE = {};
    // Toggles modules physiques activables par l'utilisateur (checkboxes panel).
    window.UI_STATE.waterVaporEnabled = true;
    window.UI_STATE.methaneEnabled = true;
    // Flags UI divers (debug).
    window.UI_STATE.FPSalert = 25;     // seuil sous lequel updateFluxLabels est skippé
    // ?debugAPI=1 (ou true) : logs groupés du moteur (api.js, calculations_flux.js).
    var debugParam = new URLSearchParams(window.location.search).get('debugAPI');
    window.UI_STATE.debugAPI = (debugParam === '1' || debugParam === 'true');

    window.DEBUG_SYNC_PANELS = false;
    window.DEBUG_CONVERGENCE_BINS = false;
    window.DEBUG_TIMELINE_HIDDEN = false;

    // ============================================================================
    // window.SYNC_STATE — état d'exécution partagé avec les pages hôtes (époque affichée, mode animation,
    // calcul en cours). Créé ICI et nulle part ailleurs : avant, chaque hôte fournissait le sien (l'iframe scie
    // de CO2 l'oubliait). window.ABORT_COMPUTE : interruption demandée par l'interface.
    // ============================================================================
    window.SYNC_STATE = {
        epochId: '⚫',
        animEnabled: false,
        ticTime: 0,
        calculationInProgress: false,
        lastRunRequestSource: 'unknown',
        runningCompute: null
    };
    window.ABORT_COMPUTE = false;

    // ============================================================================
    // window.RUNTIME_STATE — état live d'exécution (calculs en cours, mesures, caches).
    // ============================================================================
    window.RUNTIME_STATE = {};
    // Convergence / calcul
    window.RUNTIME_STATE.calculationConverged = false;
    window.RUNTIME_STATE.calculationTimeouts = [];
    // Spectral
    window.RUNTIME_STATE.spectralConverged = false;
    window.RUNTIME_STATE.spectralPrecisionTarget = null;
    window.RUNTIME_STATE.showSpectralBackground = false;
    // H2O live (recalculés à chaque cycle)
    window.RUNTIME_STATE.h2oVaporPercent = 0;
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
