// File: API_BILAN/config/fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.6.1
// - v1.6.1 (2026-10-13): classement remesuré après les corrections physiques : humidité de surface → CHAUD.
// - v1.6.0 (2026-10-13): barycentre unique éclaté en jauges FROID / CHAUD / SUBTIL / HYSTERESIS (classement mesuré) ;
//   cibles F_BAS, F_HAUT, H2O_SURFACE_RH_01 (fourchettes mesurées).
// - v1.5.2 (2026-10-13): R_EFF_PLUIE [13 ; 14] µm ajouté (seuil mesuré de la pluie chaude).
// - v1.5.1 (2026-10-13): H2O_EDS_SCALE retiré (4 → 3 cibles) — les physiques qu'il remplaçait sont codées.
// - v1.5.0 (2026-10-12): 6 → 4 cibles. CLOUD_FRACTION_BASE, CLOUD_FRACTION_INDEX_GAIN, OPTICAL_EFF_BASE retirés (fraction
//   mesurée, réflectance calculée — calculations_albedo v1.3.0) ; CDNC_OCEAN_CM3 ajouté (fourchette MODIS, Bennartz 2007).
// Date: [October 12, 2026]
// logs :
// - v1.4.0: 10 → 6 cibles. Retirées : co2OceanEffPump01 (jamais lue — la physique lit CONFIG_COMPUTE, 0,1) ;
//   seaIceStrength01 et iceImpactFactor01 (= 1 à la jauge HYSTERESIS 100 % : des multiplicateurs identité posés
//   sur des équations déjà là — rampe de mer gelée, contribution d'albédo de la glace) ; factorTropopause
//   (`fixed` : aucune jauge ne le bougeait → constante CONFIG_COMPUTE.factorTropopause). Le mécanisme `fixed`
//   disparaît avec lui. Restent les vraies inconnues : 3 nuages SW, l'exposant sulfate mesuré, κ_H₂O, la largeur
//   de la rampe de mer gelée. Aucun chiffre ne change.
// - v1.3.16: factorTropopause porte `fixed: 1.0261` et baryGroup SCIENCE (ex-CONFIG_COMPUTE.radiativeFactorTropopauseFixed,
//   lue à trois endroits avec des replis différents).
// - v1.3.15: SULFATE_BOOST_SCALE et SULFATE_BOOST_MAX SUPPRIMÉS, remplacés par SULFATE_CCN_EXPONENT.
//   Même règle que OPTICAL_EFF_CCN_GAIN en v1.3.14, appliquée une marche plus haut : on ne remplace
//   pas une valeur par une autre, on remplace la FORME. Le facteur linéaire 🍰🫧✈ × SCALE, borné à la
//   main par un Math.min(MAX, …), devient la loi de puissance mesurée de McCoy 2018 — qui sature
//   d'elle-même, donc le plafond n'a plus d'objet. Deux jauges inventées → une jauge mesurée.
//   Le barycentre ATM passe de 6 à 5 paramètres. Voir doc/DIAGNOSTIC_SULFATES_CCN.md.
// - v1.3.14: OPTICAL_EFF_CCN_GAIN retiré des targets — remplacé par la forme analytique de Twomey
//   dans calculations_albedo.js. Première application de la règle dans le bon sens : on sait le
//   calculer, donc il quitte le barycentre par le CODE (pas par `fixed`).
// - v1.3.13: SULFATE_BOOST_MAX et H2O_EDS_SCALE REMIS dans le barycentre. Les sorties v1.3.11/12
//   appliquaient la règle à l'envers : on avait figé les deux seuls paramètres sans aucun fondement,
//   c'est-à-dire exactement ceux qui doivent pouvoir varier. Règle corrigée — ce qu'on CONNAÎT se
//   calcule dans le code et quitte les targets ; ce qu'on IGNORE reste ici. Le mécanisme `fixed`
//   reste disponible pour une valeur déterminée AILLEURS, pas pour geler une inconnue.
// - v1.3.12: H2O_EDS_SCALE sorti du barycentre (fixed: 0.82 = sa valeur effective à 45 %). Sa note
//   nomme trois physiques absentes, pas une incertitude. Aucune formule de remplacement à ce jour :
//   on le fige pour que les six autres cibles redeviennent réglables sans l'entraîner. Voir TODO 1.
// - v1.3.11: SULFATE_BOOST_MAX sorti du barycentre (fixed: 0.3125 = sa valeur effective à 45 %).
//   Audit des 7 cibles CLOUD_SW/RADIATIVE : une plage n'est un barycentre légitime que si c'est une
//   vraie incertitude. Celle-ci était une borne numérique de sécurité, de l'aveu de sa propre source.
// - v1.3.10: RADIATIVE.factorTropopause — baryGroup retiré (fixe par CONFIG_COMPUTE.radiativeFactorTropopauseFixed, tuning v1.0.18).
// - v1.3.9: RADIATIVE.factorTropopause — plage resserrée 0 % → 1,03 ; 100 % → 1,00 (moins violente que 1,05–1,0) ; défaut 1,03.
// - v1.3.8: RADIATIVE.factorTropopause (baryGroup SCIENCE) — 0 % → 1,05 ; 100 % → 1,0 ; défaut doc 1,03 (~40 % ATM avec cette pente). Hauteur radiative RT/Mg × facteur (calculations_atm).
// - v1.3.7: retrait des 4 targets group:'SOLVER' (TOL_MIN_WM2, MAX_SEARCH_STEP_K, MAX_SEARCH_STEP_LARGE_K, LARGE_DELTA_FACTOR) : plus de bary SOLVER, calibration statique via window.TUNING.SOLVER (source unique).
// - v1.3.6: groupe RADIATIVE + cible H2O_EDS_SCALE (multiplicateur κ_H₂O global) — diagnostic : EDS H2O ~145 W/m² @ 0.92 vs ~75 W/m² litt. (Schmidt 2010). baryGroup SCIENCE ; min=1.00 max=0.60 volontaire (bary 100 % → valeur basse → T basse, convention projet).
// - v1.3.5: retrait cible FIRST_SEARCH_STEP_CAP_K (interp. jauge 0–100 % → min/max faussait le défaut ; plafond = DATA['🎚️'].SOLVER optionnel, défaut 0 hors configsAll)
// - v1.3.4: SOLVER.FIRST_SEARCH_STEP_CAP_K — plafond 1er pas après Init (atmosphère grise vs linéarisation 4σT³)
// - v1.3.3: groupe HYSTERESIS (mer gelée / CO₂ mer / impact glace) — bornes type littérature + preset scie_compute
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: cible CLOUD_SW.CLOUD_FRACTION_BASE avec 3 points d'essai (min/moy/max)
// - v1.1.0: plusieurs paramètres CLOUD_SW avec bornes min/max pour essais batch
// - v1.2.0: biblio intégrée dans chaque target (source + effet + référence)
// - v1.3.0: couverture complète biblio CLOUD_SW + SOLVER (toutes entrées avec bornes)
// - v1.3.1: default (nominal) par target ; 100% jauge = default (OPTICAL_EFF_CCN_GAIN etc. pris en compte)
// - v1.3.2: baryGroup SCIENCE pour CLOUD_FRACTION_INDEX_GAIN + OPTICAL_EFF_CCN_GAIN (jauge Science)

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
    // Convention du projet conservée pour FROID et CHAUD : 100 % = la valeur la plus REFROIDISSANTE de chaque plage.
    // SUBTIL : 100 % = borne haute de chaque plage (pas de sens unique).
    // `explication` et `mesure` sont affichées par les pages scientifique et banc (pas par la visu).
    jauges: {
        FROID: { logo: '☁️', titre: 'nuages qui refroidissent', sens: 'refroidit',
            explication: 'Paramètres qui refroidissent TOUJOURS quand ils augmentent : plus de gouttes (nuages plus brillants, '
                + 'Twomey), seuil de pluie plus grand (nuages bas plus épais), plus de nuages bas. 100 % = valeurs les plus froides.',
            mesure: 'Bilan net à la graine, borne basse → haute (W/m²) : CDNC −10 à −11 ; seuil de pluie −5 à −6 ; nuages bas −5 à −6 '
                + '(+3 sur ⛄ : nuages au-dessus de la glace). Jauge entière 0 → 100 % : −10 (🦠) à −21 (📱).' },
        CHAUD: { logo: '🌥', titre: 'ce qui réchauffe : nuages hauts, humidité', sens: 'réchauffe',
            explication: 'Nuages hauts (enclumes, cirrus : froids, ils piègent l\'infrarouge plus qu\'ils ne réfléchissent) et humidité '
                + 'relative de surface (plus de vapeur) : réchauffent TOUJOURS. 100 % = valeurs les plus froides (bornes basses).',
            mesure: 'Bilan net à la graine, borne basse → haute : nuages hauts 0,29 → 0,37 : +2 à +5 W/m² ; humidité 0,70 → 0,77 : '
                + '+1 à +1,8. (Avant le retrait du facteur « Iris », l\'humidité changeait de signe selon l\'époque : artefact.)' },
        SUBTIL: { logo: '🔀', titre: 'exposant sulfate : effet selon l\'époque', sens: 'selon l\'époque',
            explication: 'Exposant a de la loi gouttes ∝ (masse de sulfate)^a, rapportée à la charge actuelle : sans effet sur 📱, '
                + 'il réchauffe une époque moins chargée en sulfate qu\'aujourd\'hui et refroidirait une époque plus chargée. '
                + '100 % = borne haute.',
            mesure: 'Bilan net à la graine, 0,11 → 0,29 : 0 sur 📱, +0,8 à +1,5 W/m² avant l\'industrie.' },
        HYSTERESIS: { logo: '🧊', titre: 'rampe de la mer gelée', sens: 'au passage du gel',
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
            // 100 % = 89. Le continent (200 cm⁻³, Gultepe & Isaac 2004) et le rapport CCN de l'époque sont ailleurs.
            min: 40,
            max: 89,
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
            // (Rosenfeld & Gutman 1994 ; Freud & Rosenfeld 2012). Plus grand = nuages plus épais = plus froid : 100 % = 14.
            min: 13e-6,
            max: 14e-6,
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
            // Surv. Geophys. 45:1999, CloudSat-CALIPSO + ISCCP corrigé). Plus de nuages bas = plus froid : 100 % = 0,46.
            min: 0.36,
            max: 0.46,
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
            // (Stubenrauch et al. 2024 §3.1). Plus de nuages hauts = plus chaud : 100 % (le plus froid) = 0,29.
            min: 0.37,
            max: 0.29,
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
            // Wetherald 1967. Plus d'humidité = plus chaud sur toutes les époques testées : 100 % (le plus froid) = 0,70.
            min: 0.77,
            max: 0.70,
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
