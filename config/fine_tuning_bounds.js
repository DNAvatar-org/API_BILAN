// File: API_BILAN/config/fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.7.0
// - v1.7.0 (2026-10-13): FROID et CHAUD inversés — 100 % = le plus chaud (🔺, monter réchauffe) ; champ `sens` des jauges
//   retiré (le sens est calculé : TUNING.sensJauge). Valeurs à 50 % inchangées.
// - v1.6.1 (2026-10-13): classement remesuré après les corrections physiques : humidité de surface → CHAUD.
// - v1.6.0 (2026-10-13): barycentre unique éclaté en jauges FROID / CHAUD / SUBTIL / HYSTERESIS (classement mesuré) ;
//   cibles F_BAS, F_HAUT, H2O_SURFACE_RH_01 (fourchettes mesurées).
// Date: [October 12, 2026]
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

window.FINE_TUNING_BOUNDS = {
    // ── JAUGES (v1.6.0, 2026-10-13) : le barycentre unique ATM est éclaté. Avec la nouvelle physique des nuages, ses
    // paramètres n'allaient plus tous dans le même sens (banc : 📱 14,4 °C à 15 %, 15,8 à 0 %, −67 à 80 %, 7 à 82 %).
    // Classement MESURÉ (bilan net à la température graine de 📱 🚂 🪸 ⛄ 🦕 🐊 « hysteresis 2 », chaque paramètre de sa
    // borne basse à sa borne haute, les autres à 50 %) :
    //   FROID  — refroidit TOUJOURS (sauf ⛄, sans nuage liquide) : CDNC (−7 à −12 W/m²), seuil de pluie (−4 à −8),
    //            fraction de nuages bas (−5 à −8 ; +3 sur ⛄, nuages au-dessus de la glace) ;
    //   CHAUD  — réchauffe TOUJOURS : fraction de nuages hauts (+2 à +5), humidité de surface (+1 à +1,8 depuis le retrait
    //            du facteur « Iris » ; avant, son signe changeait selon l'époque — artefact) ;
    //   SUBTIL — le signe dépend de l'époque : exposant sulfate (0 sur 📱, +0,8 à +1,5 avant l'industrie) ;
    //   HYSTERESIS — rampe de la mer gelée : sans effet aux graines, n'agit qu'au passage du gel.
    // Convention (v1.7.0, 2026-10-13, demande de l'utilisateur) : FROID et CHAUD vont dans le même sens que le climat —
    // 100 % = la valeur la plus RÉCHAUFFANTE de chaque plage (🔺). Avant : 100 % = la plus refroidissante. Bornes inversées,
    // valeurs à 50 % inchangées (milieu des plages).
    // SUBTIL : 100 % = borne haute de chaque plage (pas de sens unique).
    // `explication` et `mesure` sont affichées par les pages scientifique et banc (pas par la visu).
    jauges: {
        FROID: { logo: '☁️', titre: 'nuages bas : gouttes, épaisseur, fraction',
            explication: 'Paramètres qui refroidissent TOUJOURS quand ils augmentent : plus de gouttes (nuages plus brillants, '
                + 'Twomey), seuil de pluie plus grand (nuages bas plus épais), plus de nuages bas. 100 % = valeurs les plus CHAUDES '
                + '(moins de gouttes, seuil 13 µm, 0,36 de nuages bas) : monter la jauge réchauffe.',
            mesure: 'Bilan net à la graine, borne basse → haute (W/m²) : CDNC −10 à −11 ; seuil de pluie −5 à −6 ; nuages bas −5 à −6 '
                + '(+3 sur ⛄ : nuages au-dessus de la glace). Jauge entière 0 → 100 % : +10 (🦠) à +21 (📱) W/m².' },
        CHAUD: { logo: '🌥', titre: 'nuages hauts et humidité',
            explication: 'Nuages hauts (enclumes, cirrus : froids, ils piègent l\'infrarouge plus qu\'ils ne réfléchissent) et humidité '
                + 'relative de surface (plus de vapeur) : réchauffent TOUJOURS. 100 % = valeurs les plus CHAUDES (0,37 ; 0,77) : '
                + 'monter la jauge réchauffe.',
            mesure: 'Bilan net à la graine, borne basse → haute : nuages hauts 0,29 → 0,37 : +2 à +5 W/m² ; humidité 0,70 → 0,77 : '
                + '+1 à +1,8. (Avant le retrait du facteur « Iris », l\'humidité changeait de signe selon l\'époque : artefact.)' },
        SUBTIL: { logo: '🔀', titre: 'exposant sulfate : effet incertain suivant le contexte',
            explication: 'Exposant a de la loi gouttes ∝ (masse de sulfate)^a, rapportée à la charge actuelle : sans effet sur 📱, '
                + 'il réchauffe une époque moins chargée en sulfate qu\'aujourd\'hui et refroidirait une époque plus chargée. '
                + '100 % = borne haute.',
            mesure: 'Bilan net à la graine, 0,11 → 0,29 : 0 sur 📱, +0,8 à +1,5 W/m² avant l\'industrie.' },
        HYSTERESIS: { logo: '🧊', titre: 'rampe de la mer gelée',
            explication: 'Largeur, sous le point de gel, de la rampe qui fait passer la mer de libre à gelée. Sans effet loin du gel ; '
                + 'elle règle les bascules (snowball, sorties).',
            mesure: 'Sans effet sur le bilan aux graines des sept époques testées.' }
    },
    targets: [
        // CLOUD_FRACTION_BASE [0,17 ; 0,23], CLOUD_FRACTION_INDEX_GAIN [0,08 ; 0,14], OPTICAL_EFF_BASE [1,00 ; 1,20]
        // RETIRÉS (v1.5.0) : trois plages posées à la main (« calibration interne », « ajustement interne »,
        // « centrage moderne ») pour une « fraction optique » qui mélangeait couverture et réflectance. La couverture est
        // MESURÉE (King et al. 2013, EARTH.NUAGES.F_OCEAN / F_CONTINENT), la réflectance CALCULÉE (deux-flux sur le
        // condensat du profil). Ce qui reste inconnu, et mesuré dans une fourchette : le nombre de gouttes.
        {
            group: 'CLOUD_SW',
            key: 'CDNC_OCEAN_CM3',
            baryGroup: 'FROID',
            // Nombre de gouttes des nuages bas sur océan, Terre actuelle. Bennartz 2007 (JGR 112:D02201), MODIS Aqua :
            // 64–89 cm⁻³ (hémisphère nord) et 40–67 cm⁻³ (hémisphère sud) sur les océans éloignés → [40 ; 89].
            // Plus de gouttes = gouttes plus petites (Martin et al. 1994) = nuage plus épais optiquement = plus froid :
            // 100 % = 40 (le plus chaud). Le continent (200 cm⁻³, Gultepe & Isaac 2004) et le rapport CCN de l'époque sont ailleurs.
            min: 89,
            max: 40,
            default: 64.5,
            unit: 'cm⁻³',
            note: 'nombre de gouttes des nuages bas marins (Terre actuelle)',
            source: 'Bennartz 2007 JGR 112:D02201 (MODIS Aqua) : 64–89 cm⁻³ HN, 40–67 cm⁻³ HS, océans éloignés.',
            effect: 'negative',
            biblio_ref: 'CDNC_OCEAN_CM3'
        },
        // OPTICAL_EFF_CCN_GAIN RETIRÉ (v1.3.14) — la sensibilité de l'albédo nuageux aux CCN ne se
        // règle pas, elle se CALCULE : Twomey (1991) donne ΔA/[A(1−A)] = Δ(ln N)/3, donc un gain de
        // (1−A)/3 lu sur l'albédo nuageux du modèle. Appliqué dans calculations_albedo.js.
        // L'ancienne valeur 0,45 sur une base 1,10 donnait 0,409 contre 0,193 : 2,1× trop. Et la
        // forme était linéaire en (ccn_ratio − 1) quand Twomey est logarithmique — équivalent près
        // de 1, faux partout ailleurs. Même traitement que TEMP_FACTOR_REF_K en son temps :
        // une grandeur qu'on sait calculer n'a rien à faire dans le barycentre.
        {
            group: 'CLOUD_SW',
            key: 'R_EFF_PLUIE',
            baryGroup: 'FROID',
            // Rayon effectif des gouttes au sommet d'un nuage quand la pluie chaude s'y déclenche : il fixe l'épaisseur
            // des nuages bas (radiative/calculations.js : LWC_pluie = (4π/3) ρ_w k N r³). MESURÉ, dans une fourchette :
            // 13 µm (Braga et al. 2021, ACP 21:14079, avions sur l'Amazonie et l'Atlantique tropical) à 14 µm
            // (Rosenfeld & Gutman 1994 ; Freud & Rosenfeld 2012). Plus grand = nuages plus épais = plus froid : 100 % (le plus chaud) = 13.
            min: 14e-6,
            max: 13e-6,
            default: 13.5e-6,
            unit: 'm',
            note: 'rayon effectif d\'initiation de la pluie chaude (sommet des nuages bas)',
            source: 'Braga et al. 2021 ACP 21:14079 (13 µm) ; Rosenfeld & Gutman 1994 Atmos. Res. 34:259 ; Freud & Rosenfeld 2012 GRL 39:L12803 (14 µm).',
            effect: 'negative',
            biblio_ref: 'R_EFF_PLUIE'
        },
        {
            group: 'CLOUD_SW',
            key: 'F_BAS',
            baryGroup: 'FROID',
            // Fraction de nuages BAS (vue en colonne, nuages masqués compris) : 0,41 ± 0,05 (Stubenrauch et al. 2024,
            // Surv. Geophys. 45:1999, CloudSat-CALIPSO + ISCCP corrigé). Plus de nuages bas = plus froid : 100 % (le plus chaud) = 0,36.
            min: 0.46,
            max: 0.36,
            default: 0.41,
            unit: 'm²/m²',
            note: 'fraction de nuages bas (en colonne)',
            source: 'Stubenrauch et al. 2024 Surv. Geophys. 45:1999 : CAL_col 0,41 ± 0,05.',
            effect: 'negative',
            biblio_ref: 'F_BAS'
        },
        {
            group: 'CLOUD_SW',
            key: 'F_HAUT',
            baryGroup: 'CHAUD',
            // Fraction de nuages HAUTS : 0,29 (capteurs passifs, ISCCP corrigé) à 0,37 (lidar CALIPSO, cirrus fins compris)
            // (Stubenrauch et al. 2024 §3.1). Plus de nuages hauts = plus chaud : 100 % (le plus chaud) = 0,37.
            min: 0.29,
            max: 0.37,
            default: 0.33,
            unit: 'm²/m²',
            note: 'fraction de nuages hauts (enclumes, cirrus)',
            source: 'Stubenrauch et al. 2024 Surv. Geophys. 45:1999 : CAH 0,29 (ISCCP-CVL) – 0,37 (CALIPSO-ST_top).',
            effect: 'positive',
            biblio_ref: 'F_HAUT'
        },
        {
            group: 'H2O',
            key: 'H2O_SURFACE_RH_01',
            baryGroup: 'CHAUD',
            // Humidité relative de surface, moyenne globale : 0,70–0,75 (ERA5) ; 0,77 dans le profil observé de Manabe &
            // Wetherald 1967. Plus d'humidité = plus chaud sur toutes les époques testées : 100 % (le plus chaud) = 0,77.
            min: 0.70,
            max: 0.77,
            default: 0.735,
            unit: 'Pa/Pa',
            note: 'humidité relative de surface',
            source: 'ERA5 (0,70–0,75) ; Manabe & Wetherald 1967 J. Atmos. Sci. 24:241 (0,77).',
            effect: 'positive',
            biblio_ref: 'H2O_SURFACE_RH_01'
        },
        {
            group: 'CLOUD_SW',
            key: 'SULFATE_CCN_EXPONENT',
            baryGroup: 'SUBTIL',
            // REMPLACE SULFATE_BOOST_SCALE [300,700] ET SULFATE_BOOST_MAX [0.20,0.45] (v1.3.15).
            // Les deux étaient des nombres inventés : « gain sulfate proxy » et « garde-fou numérique,
            // pas une grandeur mesurée », de l'aveu de leur propre champ `source`. Et tous deux
            // mesurés SANS EFFET au banc (0,00 °C d'écart entre leurs extrêmes).
            //
            // Ils sont remplacés par UN paramètre, qui est l'exposant a de la loi publiée
            //     CDNC / CDNC_ref = (m_SO₄ / m_ref)^a          Boucher & Lohmann 1995 ; McCoy 2018
            // appliquée dans calculations_albedo.js via AEROSOL.sulfateCcnRatio().
            //
            // Cette plage-ci est MESURÉE, pas posée : McCoy et al. 2018 (ACP 18:2035, Table 1) calent
            // la loi sur 19 régions — CDNC de MODIS, sulfate de MERRA2, 2003-2015, validés contre
            // campagnes aéroportées. Médiane 0,22, quartiles [0,11 ; 0,29], plage complète
            // [−0,02 ; 0,44]. La jauge décrit donc une dispersion RÉGIONALE OBSERVÉE : c'est le seul
            // cas du barycentre où les bornes viennent d'un tableau de mesures.
            // Quartiles retenus plutôt que la plage complète : les extrêmes (dont un exposant négatif)
            // sont des régions où le sulfate n'est pas le contrôle dominant du CDNC.
            //
            // Pas de direction de refroidissement affichable : elle dépend de l'époque. Sur 📱, plus de
            // sulfate qu'à la référence → a plus grand = plus de CCN = plus froid ; sur toute époque
            // pré-industrielle, MOINS de sulfate que la référence → a plus grand = moins de CCN = plus
            // chaud. Un « cools » unique serait faux la moitié du temps.
            min: 0.11,
            max: 0.29,
            default: 0.22,
            unit: 'exposant',
            note: 'exposant a de CDNC ∝ (masse SO₄)^a — dispersion sur 19 régions',
            source: 'McCoy et al. 2018 ACP 18:2035, Table 1 : médiane 0,22, quartiles [0,11 ; 0,29], plage [−0,02 ; 0,44]. Forme de Boucher & Lohmann 1995 Tellus B 47:281.',
            effect: 'epoch-dependent',
            biblio_ref: 'SULFATE_CCN_EXPONENT'
        },
        // TEMP_FACTOR_REF_K retiré : remplacé dans calculations_albedo.js par la
        // partition de phase Hu & Stamnes (1993). Plus de borne arbitraire sur T.
        // H2O_EDS_SCALE [1,00 ; 0,60] RETIRÉ (v1.5.1, 2026-10-13) : il remplaçait trois physiques absentes — continuum
        // (Roberts 1976, codé le 2026-10-12), profil d'humidité (Manabe & Wetherald, codé le 2026-10-13) et
        // recouvrement des raies CO₂/H₂O (automatique : les κ sont sommés par longueur d'onde). Avec le facteur de
        // diffusivité, le ciel clair à 288 K vaut 268,5 W/m² sans lui (CERES 266–269). Un multiplicateur à 1 ne
        // porte plus rien : il quitte le code.
        {
            group: 'HYSTERESIS',
            key: 'seaIceTransitionRangeK',
            baryGroup: 'HYSTERESIS',
            min: 1,
            max: 6,
            default: 2.2,
            unit: 'K',
            note: 'largeur T sous T_gel : fraction mer gelée 0→1 (moteur calculations_albedo)',
            source: 'EBM cryosphère Budyko–Sellers ; transitions résolues typ. ~quelques K en paramétrisation agrégée ; plage UI scie ×1000',
            effect: 'mixed',
            biblio_ref: 'HYST_SEA_ICE_RANGE_K'
        }
    ]
};
