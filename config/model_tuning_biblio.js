// File: API_BILAN/config/model_tuning_biblio.js - Bibliographie et impact des reglages
// Desc: En francais, dans l'architecture, je documente les coefficients de tuning, leurs sources et leur effet thermique signe.
// Version 1.0.3
// - v1.0.3 (2026-10-12): CLOUD_FRACTION_BASE / _INDEX_GAIN / OPTICAL_EFF_BASE → CDNC_OCEAN_CM3 (Bennartz 2007).
// Date: [October 12, 2026]
// logs :
// - v1.0.2: entrées retirées avec leurs paramètres : OPTICAL_EFF_CCN_GAIN (Twomey), HYST_SEA_ICE_STRENGTH,
//   HYST_ICE_IMPACT (identités à la jauge), HYST_CO2_OCEAN_EFF (jamais lue : CONFIG_COMPUTE fait foi).
// - v1.0.1: groupe HYSTERESIS (recherche seuil / cryosphère / CO₂ mer)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: catalogue des parametres CLOUD_SW/SOLVER avec references et effet +/- sur le rechauffement

window.TUNING_BIBLIO = {
    CLOUD_SW: {
        // CLOUD_FRACTION_BASE, CLOUD_FRACTION_INDEX_GAIN, OPTICAL_EFF_BASE retirés (2026-10-12) : la fraction nuageuse
        // est mesurée (King et al. 2013), la réflectance calculée depuis le condensat (EARTH.NUAGES, physics.js).
        CDNC_OCEAN_CM3: {
            value: 64.5,
            source: "Bennartz 2007 JGR 112:D02201 — nombre de gouttes des nuages bas marins par MODIS (Aqua, 2,5 ans) : 64-89 cm-3 (HN) et 40-67 cm-3 (HS) sur les oceans eloignes.",
            effect_on_warming_when_increased: "negative"
        },
        R_EFF_PLUIE: {
            value: 13.5e-6,
            source: "Braga et al. 2021 ACP 21:14079 (13 um) ; Rosenfeld & Gutman 1994 ; Freud & Rosenfeld 2012 (14 um) — rayon effectif d'initiation de la pluie chaude.",
            effect_on_warming_when_increased: "negative"
        },
        SULFATE_CCN_EXPONENT: {
            value: 0.22,
            source: "McCoy et al. 2018 ACP 18:2035 Table 1 — exposant a de CDNC proportionnel a (masse SO4)^a, mesure sur 19 regions : mediane 0.22, quartiles [0.11 , 0.29]. Forme : Boucher & Lohmann 1995 Tellus B 47:281.",
            effect_on_warming_when_increased: "epoch_dependent"
        }
        // SULFATE_BOOST_SCALE (500, « proxy sulfate interne ») et SULFATE_BOOST_MAX (0.35, « borne
        // numerique de securite ») retires 2026-09-22 : deux nombres inventes, mesures sans aucun
        // effet au banc, remplaces par la loi de puissance ci-dessus. Voir doc/DIAGNOSTIC_SULFATES_CCN.md.
        // TEMP_FACTOR_REF_K (et MIN/MAX) retirés v1.0.2 : partition de phase Hu & Stamnes (1993) ; depuis
        // 2026-10-12 elle porte sur chaque couche du profil nuageux (radiative/calculations.js).
    },
    SOLVER: {
        TOL_MIN_WM2: {
            value: 0.05,
            source: "Choix numerique de convergence (stabilite/temps de calcul)",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        MAX_SEARCH_STEP_K: {
            value: 100,
            source: "Choix numerique solveur Search",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        MAX_SEARCH_STEP_LARGE_K: {
            value: 150,
            source: "Choix numerique solveur Search (grands deltas)",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        LARGE_DELTA_FACTOR: {
            value: 10,
            source: "Seuil de bascule vers cap large du pas Search",
            effect_on_warming_when_increased: "neutral_on_physics"
        }
    },
    HYSTERESIS: {
        HYST_SEA_ICE_RANGE_K: {
            value: 2.2,
            source: "Largeur de transition mer gelée (K) : Budyko (1969), Sellers (1969) ; snowball / hysteresis EBM — Pierrehumbert (2010) ; UI scie 1000–6000 → 1–6 K",
            effect_on_warming_when_increased: "mixed"
        }
    }
};
