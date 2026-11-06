// File: API_BILAN/data/controles_mesures.js
// Desc: CONTRÔLES 🎯 de la Terre actuelle : des mesures, jamais des entrées du calcul. La sonde « contrôles 📱 »
//       (CO2/scripts/bench_headless/sondes/controles.js) imprime le modèle en face de chacune. Chaque valeur porte sa source,
//       sa période, son statut (alphabet : 📡 mesure directe, 💻 simulation ou réanalyse) et ce qu'elle mesure EXACTEMENT.
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';

window.CONTROLES_MESURES = {
    // ─── Flux au sommet de l'atmosphère, moyennes globales annuelles [W/m²] ────────────────────────────────────────────────
    // CERES EBAF Ed4.0, juillet 2005 – juin 2015, « with constraint » (Loeb et al. 2018, J. Climate 31:895, table 5) : flux
    // SW et LW ajustés dans leurs incertitudes pour que le net vaille 0,71 ± 0,10 W/m² (contenu de chaleur de l'océan,
    // Johnson et al. 2016). Incertitude régionale mensuelle 1σ : 2,5–3 W/m² tous ciels, 4,5–6 W/m² ciel clair (même article) ;
    // incertitude des moyennes globales elles-mêmes : non donnée dans cette table (❔).
    ceres: {
        statut: '📡',
        source: 'Loeb et al. 2018, J. Climate 31:895, table 5 (EBAF Ed4.0, with constraint)',
        periode: '2005-07 – 2015-06',
        solaire: 340.0,
        olr: 240.1,                 // LW tous ciels
        swReflechi: 99.1,           // SW tous ciels → albédo planétaire 99,1/340,0 = 0,291
        net: 0.71,                  // ± 0,10 (95 %)
        olrClair: 268.1,            // LW ciel clair : zones SANS nuages seulement (voir correction plus bas)
        swClair: 53.3,              // SW ciel clair → albédo du ciel clair 0,157
        creLW: 27.9,                // effet des nuages LW = olrClair − olr
        creSW: -45.8,               // effet des nuages SW
        creNet: -17.9
    },
    // Un modèle calcule son ciel clair en retirant les nuages de TOUTES les colonnes, nuageuses comprises, plus humides que les
    // zones claires que voit le satellite : son OLR clair est plus bas. Différence globale (Kato et al. 2013, J. Climate 26:2719,
    // table 2, cité par Loeb et al. 2018 §2c) : −1,25 W/m² en LW, +0,24 W/m² en SW. À AJOUTER aux valeurs CERES avant de les
    // comparer au ciel clair d'un modèle (olrClair 266,85, swClair 53,54 ; creLW 26,75, creSW −45,56).
    cielClairModele: {
        statut: '💻',
        source: 'Kato et al. 2013, J. Climate 26:2719, table 2 (via Loeb et al. 2018 §2c)',
        dOlrClair: -1.25,
        dSwClair: 0.24
    },

    // ─── Eau précipitable, moyenne globale [kg/m²] ──────────────────────────────────────────────────────────────────────────
    // Masse de vapeur de l'atmosphère, réanalyse ERA-40 (Trenberth & Smith 2005, J. Climate 18:864) : 1,25 × 10¹⁶ kg ± 0,1 dans le
    // manuscrit, 1,27 × 10¹⁶ kg dans le résumé — version publiée non lue (❔ sur le dernier chiffre). Rapportée à la surface du
    // globe 4π (6 371 km)² = 5,10 × 10¹⁴ m² : 24,5 – 24,9 kg/m², ± 2. 💻 : une réanalyse assimile des mesures dans un modèle.
    eauPrecipitable: {
        statut: '💻',
        source: 'Trenberth & Smith 2005, J. Climate 18:864 (ERA-40)',
        min: 24.5,
        max: 24.9,
        incertitude: 2.0
    }
};
