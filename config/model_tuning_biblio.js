// File: API_BILAN/config/model_tuning_biblio.js - Bibliographie et impact des reglages
// Desc: En francais, dans l'architecture, je documente les coefficients de tuning, leurs sources et leur effet thermique signe.
// Version 1.0.1
// Date: [April 02, 2026] [18:00 UTC+1]
// logs :
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
        CLOUD_FRACTION_BASE: {
            value: 0.19,
            source: "CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne",
            effect_on_warming_when_increased: "negative"
        },
        CLOUD_FRACTION_INDEX_GAIN: {
            value: 0.11,
            source: "Sundqvist (1989) + ajustement interne cloud_index -> fraction optique",
            effect_on_warming_when_increased: "negative"
        },
        OPTICAL_EFF_BASE: {
            value: 1.10,
            source: "Twomey + AR6 aerosols, centrage moderne",
            effect_on_warming_when_increased: "negative"
        },
        OPTICAL_EFF_CCN_GAIN: {
            value: 0.45,
            source: "Twomey effect (sensibilite de l'albedo nuageux aux CCN)",
            effect_on_warming_when_increased: "negative"
        },
        SULFATE_BOOST_SCALE: {
            value: 500,
            source: "Proxy sulfate interne SO4(2-) pour microphysique nuageuse",
            effect_on_warming_when_increased: "negative"
        },
        SULFATE_BOOST_MAX: {
            value: 0.35,
            source: "Borne numerique de securite (evite emballement du proxy)",
            effect_on_warming_when_increased: "negative"
        },
        TEMP_FACTOR_REF_K: {
            value: 288,
            source: "Reference climat moderne (~15C)",
            effect_on_warming_when_increased: "mixed"
        }
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
        },
        HYST_SEA_ICE_STRENGTH: {
            value: 1,
            source: "Amplitude rétroaction glace de mer sur fraction océanique [0,1]",
            effect_on_warming_when_increased: "negative"
        },
        HYST_ICE_IMPACT: {
            value: 0.7,
            source: "Couplage glace → albédo (CONFIG iceImpactFactor01) ; littérature albédo glace/neige vs océan AR6 WGI",
            effect_on_warming_when_increased: "negative"
        },
        HYST_CO2_OCEAN_EFF: {
            value: 0.1,
            source: "Relaxation Henry CO₂ atmosphère–océan (masse totale conservée) ; Zeebe & Wolf-Gladrow (2001)",
            effect_on_warming_when_increased: "mixed"
        }
    }
};
