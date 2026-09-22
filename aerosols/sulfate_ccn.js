// ============================================================================
// File: API_BILAN/aerosols/sulfate_ccn.js - Sulfate → noyaux de condensation (CCN)
// Desc: La relation publiée entre masse de sulfate et nombre de gouttelettes nuageuses.
//       C'est une LOI DE PUISSANCE, pas un facteur linéaire. Fichier séparé parce que c'est une
//       physique à part : l'albédo décide de ce qu'il fait des CCN (Twomey), pas d'où ils viennent.
// Version 1.2.0
// Date: 2026-09-22
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
// - v1.2.0: BRANCHÉ dans calculations_albedo.js v1.2.65. SULFATE_BOOST_SCALE / SULFATE_BOOST_MAX et la
//   porte « ▶ >= 1900 » supprimés ; seule jauge restante = l'exposant a (quartiles mesurés McCoy 2018).
//   ERFaci vérifié au banc : −0,908 W/m² contre −0,97 (McCoy 2017a) et −1,0 [−1,7 ; −0,3] (AR6).
//   Le modèle produisait −0,037 W/m² la veille.
// - v1.1.0: contrat d'entrée TENU — les 19 ⚖️✈ sont passées à des charges atmosphériques réelles en kg
//   de SO₄, une source par époque (configTimeline v1.4.89 ; doc/MASSES_SULFATE_PAR_EPOQUE.md). Le rapport
//   📱/🚂 vaut 2,6 (Tsigaridis 2006) au lieu de 53, et 2,6^(−0,22) = 81 % de CDNC préindustriel, dans les
//   70-80 % mesurés. Reste à brancher dans calculations_albedo.js.
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
 * ─── ✅ CONTRAT D'ENTRÉE — TENU DEPUIS LE 2026-09-22 ───────────────────────────────────────
 * Il ne l'était pas quand ce fichier a été écrit : ⚖️✈ valait 8e13 kg pour 📱 (« proxy CCN
 * moderne », sa config le disait), soit ~76 000 × la charge atmosphérique réelle, et surtout
 * 📱/🚂 = 53 quand la mesure donne 2,6.
 *
 * Les 19 masses ont été refaites sur des charges physiques, une source par époque
 * (configTimeline.js v1.4.89, encadré « MASSES DE SULFATE » ; détail dans
 * doc/MASSES_SULFATE_PAR_EPOQUE.md) :
 *
 *     📱 Aujourd'hui      1,05e9 kg SO₄   Tsigaridis et al. 2006 ACP 6:5143, Table 5 (nss, an 2000)
 *     🚂 Industriel 1800  4,0e8  kg SO₄   même table, colonne préindustriel  →  rapport 2,6 ✅
 *     ⛄ Plein Snowball   1,2e8  kg SO₄   fond × part volcanique (DMS éteint sous banquise)
 *     ⚫ 🔥               0                pas d'atmosphère / rien ne condense à 2650 °C
 *     les 14 autres       4,0e8  kg SO₄   fond naturel préindustriel, faute de contrainte publiée
 *
 * Avec l'exposant médian 0,22, le rapport 2,6 donne un CDNC préindustriel à 2,6^(−0,22) = 81 % du
 * moderne — dans les 70-80 % mesurés. C'était le test à passer.
 *
 * ─── BRANCHÉ ───────────────────────────────────────────────────────────────────────────────
 * calculations_albedo.js v1.2.65 appelle sulfateCcnRatio() à la place du facteur linéaire.
 * SULFATE_BOOST_SCALE, SULFATE_BOOST_MAX et la porte « ▶ >= 1900 » ont disparu avec lui.
 * L'exposant a est la seule jauge restante : FINE_TUNING_BOUNDS.SULFATE_CCN_EXPONENT, bornes =
 * quartiles MESURÉS [0,11 ; 0,29] de McCoy 2018.
 *
 * Vérification faite, et ce n'est pas un calage — SW absorbé à T figée sur 📱, sulfate seul
 * variable, 4,0e8 → 1,05e9 kg :
 *     ERFaci du modèle = −0,908 W/m²
 *     McCoy et al. 2017a = −0,97 W/m²   ·   AR6 Ch. 7 = −1,0 [−1,7 ; −0,3] W/m²
 * Le modèle produisait −0,037 W/m² la veille. Masses de Tsigaridis 2006, exposant d'ici,
 * sensibilité de Twomey 1991 : trois sources indépendantes, aucun paramètre réglé sur le résultat.
 * Au banc 19 époques : hystérésis 1a (4,85 → 7,33) et 🦣 (9,35 → 13,63) reviennent dans leur
 * fourchette. Détail : doc/DIAGNOSTIC_SULFATES_CCN.md.
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
