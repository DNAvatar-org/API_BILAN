// File: API_BILAN/config/fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.3.15
// Date: [April 25, 2026] [14:00 UTC+1]
// logs :
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
    targets: [
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_BASE',
            min: 0.17,
            max: 0.23,
            default: 0.19,
            unit: 'fraction',
            note: 'base couverture nuageuse SW',
            source: 'CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_INDEX_GAIN',
            baryGroup: 'SCIENCE',
            min: 0.08,
            max: 0.14,
            default: 0.11,
            unit: 'ratio',
            note: 'gain index nuageux',
            source: 'Sundqvist (1989) + ajustement interne cloud_index -> fraction optique',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_INDEX_GAIN'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_BASE',
            min: 1.00,
            max: 1.20,
            default: 1.10,
            unit: 'ratio',
            note: 'efficacité optique de base',
            source: 'Twomey + AR6 aerosols, centrage moderne',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_BASE'
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
            key: 'SULFATE_CCN_EXPONENT',
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
        {
            group: 'RADIATIVE',
            key: 'H2O_EDS_SCALE',
            baryGroup: 'SCIENCE',
            // REMIS DANS LE BARYCENTRE (v1.3.13). Sorti en v1.3.12 puis figé à 0,82 — une valeur qui
            // ne vient de nulle part : le milieu d'une plage elle-même posée à la main. Le figer ne
            // le rendait pas plus juste, ça ne faisait que masquer qu'on l'ignore.
            // Il reste vrai que ce scalaire remplace trois physiques absentes (continuum MT_CKD,
            // overlap CO₂/H₂O, profil HR(z)) et qu'un multiplicateur constant ne peut porter aucune
            // rétroaction — rétroaction vapeur mesurée à −0,28 W/m²/K contre −1,8 attendus
            // (doc/DIAGNOSTIC_RETROACTION_VAPEUR.md). Mais tant que ces trois mécanismes ne sont pas
            // CODÉS, le seul énoncé honnête est « on ne sait pas », et c'est ce que dit la jauge.
            min: 1.00,       // bary 0 %  → κ_H₂O max (T haute)
            max: 0.60,       // bary 100 % → κ_H₂O min (T basse, cible littérature Schmidt 2010 ~75 W/m²). min>max volontaire pour cohérence avec autres targets du projet.
            default: 0.80,
            unit: 'ratio',
            note: 'multiplicateur global de κ_H₂O (EARTH.H2O_EDS_SCALE). Capture continuum MT_CKD non implémenté + overlap CO₂/H₂O + approximations HR(z). Scalaire global (pas de dépendance époque — feedback T déjà porté par Clausius-Clapeyron dans waterVaporMixingRatio).',
            source: 'Schmidt 2010 (attribution EDS H₂O ≈ 50 % de 155 W/m² ≈ 75 W/m²) ; Held & Soden 2006 (CC feedback 6–8 %/K) ; plage ~0.6–1.0 couvre les incertitudes continuum/overlap.',
            effect: 'positive',
            biblio_ref: 'H2O_EDS_SCALE'
        },
        {
            group: 'RADIATIVE',
            key: 'factorTropopause',
            min: 1.03,
            max: 1.0,
            default: 1.0261,
            unit: 'ratio',
            note: 'doc / biblio. Valeur live = CONFIG_COMPUTE.radiativeFactorTropopauseFixed (hors bary) ou interpolée si fixed=null.',
            source: 'Source runtime : configTimeline.radiativeFactorTropopauseFixed (défaut 1,0261) ; pas d’entrée baryGroup SCIENCE.',
            effect: 'mixed',
            biblio_ref: 'FACTOR_TROPOPAUSE_RT'
        },
        {
            group: 'HYSTERESIS',
            key: 'seaIceTransitionRangeK',
            min: 1,
            max: 6,
            default: 2.2,
            unit: 'K',
            note: 'largeur T sous T_gel : fraction mer gelée 0→1 (moteur calculations_albedo)',
            source: 'EBM cryosphère Budyko–Sellers ; transitions résolues typ. ~quelques K en paramétrisation agrégée ; plage UI scie ×1000',
            effect: 'mixed',
            biblio_ref: 'HYST_SEA_ICE_RANGE_K'
        },
        {
            group: 'HYSTERESIS',
            key: 'seaIceStrength01',
            min: 0,
            max: 1,
            default: 1,
            unit: 'fraction',
            note: 'intensité mer gelée sur couverture océan',
            source: 'Borne physique [0,1] ; 1 = rétroaction albédo maximale (jeux de paramètres type snowball)',
            effect: 'negative',
            biblio_ref: 'HYST_SEA_ICE_STRENGTH'
        },
        {
            group: 'HYSTERESIS',
            key: 'iceImpactFactor01',
            min: 0,
            max: 1,
            default: 0.7,
            unit: 'fraction',
            note: 'impact glace sur albédo (GREY)',
            source: 'AR6 WGI plages albédo glace/neige vs surface sombre ; preset lit. 0,7 entre nominal ~0,53 et max 1',
            effect: 'negative',
            biblio_ref: 'HYST_ICE_IMPACT'
        },
        {
            group: 'HYSTERESIS',
            key: 'co2OceanEffPump01',
            min: 0,
            max: 1,
            default: 0.1,
            unit: 'fraction',
            note: 'vitesse relaxation Henry atmos↔océan (Σ carbone conservé)',
            source: 'Zeebe & Wolf-Gladrow (2001) solubilité ; efficacité numérique 0–1 ; NO-OP si hystérésis active',
            effect: 'mixed',
            biblio_ref: 'HYST_CO2_OCEAN_EFF'
        }
    ]
};
