// ============================================================================
// File: API_BILAN/aerosols/sulfate_ccn.js - Sulfate → noyaux de condensation (CCN)
// Desc: La relation publiée entre masse de sulfate et nombre de gouttelettes nuageuses.
//       C'est une LOI DE PUISSANCE, pas un facteur linéaire. Fichier séparé parce que c'est une
//       physique à part : l'albédo décide de ce qu'il fait des CCN (Twomey), pas d'où ils viennent.
// Version 1.0.0
// Date: 2026-09-22
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.0.0: loi de puissance McCoy 2018 / Boucher & Lohmann 1995, en remplacement du proxy linéaire
//   🍰🫧✈ × SULFATE_BOOST_SCALE. ⚠️ PAS ENCORE BRANCHÉ — voir le contrat d'entrée plus bas.
// ============================================================================

'use strict';

/**
 * ─── LA LOI ────────────────────────────────────────────────────────────────────────────────
 *
 *     log₁₀(CDNC) = a · log₁₀(masse SO₄) + b
 *
 * Forme établie par Boucher & Lohmann (1995, Tellus B 47:281), toujours celle qu'on utilise
 * trente ans après. Calée sur MESURES par McCoy et al. (2018, ACP 18:2035) : nombre de
 * gouttelettes vu par MODIS, masses d'aérosols de la réanalyse MERRA2, 2003-2015, validés contre
 * des campagnes aéroportées (VOCALS-REX, MASE, CSET, CARMA, JASPER…).
 *
 * Exposant du sulfate a, mesuré sur 19 régions (McCoy 2018, Table 1) :
 *     médiane 0,22   ·   quartiles [0,11 ; 0,29]   ·   plage complète [−0,02 ; 0,44]
 *
 * ─── POURQUOI UNE PUISSANCE, ET PAS UNE DROITE ─────────────────────────────────────────────
 * L'activation des CCN sature : les premiers noyaux comptent beaucoup, les suivants de moins en
 * moins, parce qu'ils se disputent la même vapeur disponible. Un exposant de 0,22 veut dire que
 * DOUBLER le sulfate n'augmente le nombre de gouttelettes que de 16 %. Le proxy linéaire qu'on
 * remplace ne savait pas faire ça — d'où le Math.min(SULFATE_BOOST_MAX, …) posé à la main pour
 * l'empêcher de diverger. Une loi de puissance sature toute seule : ce plafond devient inutile.
 *
 * ─── POURQUOI UN RAPPORT ───────────────────────────────────────────────────────────────────
 * On n'écrit pas CDNC en valeur absolue mais CDNC/CDNC_ref = (m/m_ref)^a. Le terme b et toutes
 * les constantes d'unité disparaissent dans le rapport. Conséquence pratique : PAS BESOIN de
 * convertir ⚖️✈ en µg/m³, ni de connaître un CDNC de référence. Il suffit que ⚖️✈ soit
 * PROPORTIONNEL à une charge atmosphérique réelle de sulfate.
 *
 * ─── ⚠️ CONTRAT D'ENTRÉE — NON TENU AUJOURD'HUI ────────────────────────────────────────────
 * « Proportionnel à une charge réelle » est exactement ce que les ⚖️✈ actuels ne sont pas :
 *
 *   • 📱 vaut 8e13 kg. Étalé sur 1,5 km de couche limite, ça ferait 105 000 µg/m³ de sulfate,
 *     contre 1 à 10 µg/m³ mesurés dans l'air réel. La charge atmosphérique vraie est de l'ordre
 *     de 1 Tg = 1e9 kg : le chiffre du modèle est ~27 000× trop grand. Sa config le dit
 *     elle-même — « proxy CCN moderne ».
 *   • Et les RAPPORTS entre époques, seuls à compter ici, sont faux aussi : 📱/🚂 = 8e13/1,5e12
 *     = 53, alors que le rapport mesuré entre sulfate actuel et pré-industriel est de l'ordre
 *     de 3 à 5 (émissions de SO₂ : ~20 Tg S/an naturelles contre ~100 aujourd'hui).
 *
 * Brancher cette loi sur ces masses-là donnerait un CDNC pré-industriel à 40 % du moderne, quand
 * la mesure donne plutôt 70-80 %. Ce serait remplacer une erreur par une autre.
 *
 * Il faut donc D'ABORD refaire les ⚖️✈ des 19 époques sur des charges physiques. Tant que ce
 * n'est pas fait, ce module est écrit, testé, documenté — et pas appelé.
 *
 * Vérification qui viendra ensuite, indépendante du calage : le forçage qui doit en sortir est
 * de −0,97 W/m² (McCoy et al. 2017a), cohérent avec l'ERFaci de l'AR6, −1,0 [−1,7 ; −0,3] W/m².
 */

/**
 * Rapport de nombre de gouttelettes dû au sulfate, par rapport à une référence.
 *
 * @param {number} sulfateKg     masse de sulfate de l'époque (kg) — doit être PROPORTIONNELLE
 *                               à une charge atmosphérique réelle (cf. contrat ci-dessus)
 * @param {number} sulfateRefKg  masse de référence (même unité, même proportionnalité)
 * @param {number} exponent      a de la loi — McCoy 2018 : médiane 0,22, quartiles [0,11 ; 0,29]
 * @returns {number} CDNC / CDNC_ref
 */
function sulfateCcnRatio(sulfateKg, sulfateRefKg, exponent) {
    if (!(sulfateRefKg > 0)) {
        throw new Error('[sulfate_ccn] masse de référence nulle ou négative : ' + sulfateRefKg);
    }
    if (!Number.isFinite(exponent)) {
        throw new Error('[sulfate_ccn] exposant non fini : ' + exponent);
    }
    // Sulfate nul = pas d'apport sulfaté aux CCN. La loi de puissance y est singulière
    // (0^a = 0 pour a>0, mais log10(0) = −∞) : on renvoie 0 explicitement plutôt qu'un NaN.
    if (!(sulfateKg > 0)) return 0;
    return Math.pow(sulfateKg / sulfateRefKg, exponent);
}

/**
 * Forme logarithmique brute, pour diagnostic et pour comparer directement aux figures publiées.
 * Δlog₁₀(CDNC) = a · Δlog₁₀(masse SO₄)
 */
function sulfateCcnDeltaLog10(sulfateKg, sulfateRefKg, exponent) {
    if (!(sulfateKg > 0) || !(sulfateRefKg > 0)) return -Infinity;
    return exponent * Math.log10(sulfateKg / sulfateRefKg);
}

window.AEROSOL = window.AEROSOL || {};
window.AEROSOL.sulfateCcnRatio = sulfateCcnRatio;
window.AEROSOL.sulfateCcnDeltaLog10 = sulfateCcnDeltaLog10;
/** Exposants mesurés (McCoy 2018 Table 1, 19 régions) — pour les bornes de jauge et la doc. */
window.AEROSOL.MCCOY2018_SO4_EXPONENT = { median: 0.22, q1: 0.11, q3: 0.29, min: -0.02, max: 0.44 };
