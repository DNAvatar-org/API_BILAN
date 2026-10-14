// File: API_BILAN/data/episteme.js
// Desc: LIENS ÉPISTÉMIQUES — source unique de « quelle référence fonde quelle valeur ou formule, et à quel titre ».
//       Le statut est porté par chaque USAGE (une valeur, une formule), pas par la référence : une même publication peut
//       donner une mesure ici (dates U-Pb) et une simulation là (température d'après-snowball). Lu par doc/equation.html,
//       doc/BIBLIOGRAPHIE.html et le dictionnaire (demo/dico.html), via doc/js/episteme_rendu.js — aucun n'en garde de copie.
//       Un lien : { cible, ref, statut, usage, quoi }
//         cible  : 'eq:<id de carte equation.html>' | 'dico:<clé DATA>' | 'config:<constante de configTimeline.js>'
//                  | 'histoire:<série de CO2/static/histoire/litterature.js>'
//         ref    : id de <article class="ref"> dans BIBLIOGRAPHIE.html, ou null (définition, aucune publication)
//         statut : axe 🧭 — ⚛ physique · 📡 mesure directe · 🦴 reconstruction · 💻 simulation publiée · ❔ extrapolé · ⚠️ sans source
//         usage  : axe 🛠 — 📌 posée · 🎚️ jauge · 🔧 calage · 🔢 numérique · 🎯 comparaison seulement (n'entre pas dans le calcul)
//         quoi   : ce qui est pris, en clair
//       Libellés des logos : data/alphabet.js (CHARS_DESC, window.EPISTEME). Les évaluations de consensus (GIEC) ne sont
//       jamais une entrée : 🎯 seulement — le modèle est là pour les valider ou les invalider.
// Version 1.0.0
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';

    window.EPISTEME.LIENS = [
        // ── Soleil ──────────────────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-luminosite-jeune-soleil', ref: 'gough1981', statut: '💻', usage: '📌', quoi: 'L(t) : approximation analytique des modèles solaires standard (à quelques % près sur 4 Ga)' },
        { cible: 'eq:eq-flux-recu-moyenne-sur', ref: 'koppLean2011', statut: '📡', usage: '📌', quoi: 'irradiance solaire totale 1 361 W/m² (radiomètres en orbite)' },
        { cible: 'eq:eq-flux-recu-moyenne-sur', ref: null, statut: '⚛', usage: '📌', quoi: 'facteur 4 = surface de la sphère / disque intercepté ; 1 UA exacte (UAI 2012)' },
        { cible: 'eq:eq-loi-planck', ref: null, statut: '⚛', usage: '📌', quoi: 'loi de Planck, h, k_B et c exactes (SI 2019)' },

        // ── Bilan méridien ──────────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-bilan-energie-meridien', ref: 'north1981', statut: '⚛', usage: '📌', quoi: 'modèle diffusif, solution à deux modes (éq. 22)' },
        { cible: 'eq:eq-bilan-energie-meridien', ref: 'north1981', statut: '📡', usage: '📌', quoi: 'B = 2,09 W/m²/°C (régression de l\'OLR observé) ; D = 0,649 calé par North sur le gradient observé' },
        { cible: 'eq:eq-bilan-energie-meridien', ref: 'north1981', statut: '📡', usage: '🎯', quoi: 'T₂ = −28,0 °C, gradient observé de l\'hémisphère nord — le modèle donne −22,1 °C' },

        // ── Eau, vapeur, profil ─────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-pression-vapeur-saturante-eau', ref: 'wagnerPruss2002', statut: '📡', usage: '📌', quoi: 'IAPWS sur le liquide (ajustement de mesures)' },
        { cible: 'eq:eq-pression-vapeur-saturante-eau', ref: 'wagner2011', statut: '📡', usage: '📌', quoi: 'sublimation sur la glace' },
        { cible: 'eq:eq-pression-vapeur-saturante-eau', ref: 'murphyKoop2005', statut: '📡', usage: '📌', quoi: 'eau surfondue' },
        { cible: 'eq:eq-humidite-moyenne-altitude', ref: 'manabeWetherald1967', statut: '📡', usage: '📌', quoi: 'profil d\'humidité relative tiré des observations, pas d\'une équation' },
        { cible: 'eq:eq-surface-fusion', ref: 'katz2003', statut: '📡', usage: '📌', quoi: 'fraction fondue de la péridotite à 0 GPa (ajustement d\'expériences)' },

        // ── Nuages ──────────────────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-fractions-nuages-bas-hauts', ref: 'stubenrauch2024', statut: '📡', usage: '🎚️', quoi: 'fractions de nuages bas / hauts (CloudSat-CALIPSO, ISCCP)' },
        { cible: 'eq:eq-nombre-gouttes', ref: 'bennartz2007', statut: '📡', usage: '🎚️', quoi: 'gouttes sur océan 40–89 cm⁻³ (MODIS)' },
        { cible: 'eq:eq-nombre-gouttes', ref: 'gultepeIsaac2004', statut: '📡', usage: '📌', quoi: 'gouttes sur continent (mesures avion)' },
        { cible: 'eq:eq-sommet-nuage-seuil-pluie', ref: 'rosenfeldGutman1994', statut: '📡', usage: '🎚️', quoi: 'seuil de pluie à r_eff 13–14 µm' },
        { cible: 'eq:eq-sommet-nuage-seuil-pluie', ref: 'freudRosenfeld2012', statut: '📡', usage: '🎚️', quoi: 'seuil de pluie à r_eff 13–14 µm' },
        { cible: 'eq:eq-sommet-nuage-seuil-pluie', ref: 'braga2021', statut: '📡', usage: '🎚️', quoi: 'seuil de pluie à r_eff 13–14 µm' },
        { cible: 'eq:eq-sommet-nuage-seuil-pluie', ref: null, statut: '❔', usage: '📌', quoi: 'sous 0 °C, la glace précipite dès qu\'elle se forme (hypothèse déclarée)' },
        { cible: 'eq:eq-noyaux-condensation-epoque', ref: 'mccoy2018', statut: '📡', usage: '🎚️', quoi: 'exposant sulfate → gouttes, quartiles [0,11 ; 0,29] sur 19 régions' },
        { cible: 'eq:eq-noyaux-condensation-epoque', ref: 'carn2017', statut: '📡', usage: '📌', quoi: 'soufre volcanique 11,5 Tg S/an' },
        { cible: 'eq:eq-noyaux-condensation-epoque', ref: 'lana2011', statut: '📡', usage: '📌', quoi: 'soufre du DMS 28,1 Tg S/an' },
        { cible: 'eq:eq-noyaux-condensation-epoque', ref: 'tsigaridis2006', statut: '💻', usage: '📌', quoi: 'charge de sulfate moderne et préindustrielle (modèle d\'aérosols)' },
        { cible: 'eq:eq-noyaux-condensation-epoque', ref: 'ar6ch7Erfaci', statut: '💻', usage: '🎯', quoi: 'ERFaci −1,0 [−1,7 ; −0,3] W/m² : évaluation, comparaison seulement' },

        // ── Glace, albédo ───────────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-albedo-glace-selon-temperature', ref: 'briegleb2004', statut: '💻', usage: '📌', quoi: 'paramétrisation de l\'albédo de la glace du modèle NCAR CCSM3' },
        { cible: 'eq:eq-inertie-calottes', ref: 'marshallClark2002', statut: '💻', usage: '🎚️', quoi: 'temps de réponse des calottes 10⁴–10⁵ ans' },
        { cible: 'eq:eq-amplitudes-saisonnieres', ref: null, statut: '⚠️', usage: '📌', quoi: 'amplitudes saisonnières posées « de mémoire » (ERA5 non relevé)' },
        { cible: 'eq:eq-bilan-energie-meridien', ref: 'ipccAR6WG1', statut: '💻', usage: '🎯', quoi: 'amplification arctique 2–4× : évaluation, comparaison seulement' },

        // ── Calottes (physics/calottes.js) ──────────────────────────────────────────────────────────────────────
        { cible: 'dico:🍰🗻🧊', ref: 'nye1952', statut: '⚛', usage: '📌', quoi: 'profil d\'une calotte parfaitement plastique, h₀ = √(2τ₀L/ρg)' },
        { cible: 'dico:🍰🗻🧊', ref: 'nye1952', statut: '📡', usage: '📌', quoi: 'seuil de cisaillement basal τ₀ = 100 kPa, milieu des 50–150 kPa mesurés' },
        { cible: 'dico:🍰🗻🧊', ref: 'braithwaite1995', statut: '📡', usage: '📌', quoi: 'facteurs degrés-jours : neige 3, glace 8 mm d\'eau par °C·jour' },
        { cible: 'dico:🍰🗻🧊', ref: 'reeh1991', statut: '💻', usage: '📌', quoi: 'bilan de masse par degrés-jours positifs, neige puis glace' },
        { cible: 'dico:🍰🗻🧊', ref: 'jouzelMerlivat1984', statut: '📡', usage: '📌', quoi: 'T de l\'inversion = 0,67 T_s + 88,9 K (relation mesurée en Antarctique)' },
        { cible: 'dico:🍰🗻🧊', ref: 'scoteseWright2018', statut: '🦴', usage: '📌', quoi: 'continent, socle et hautes terres par bande (PaleoDEM, tous les 5 Ma)' },
        { cible: 'dico:🍰🗻🧊', ref: 'arthern2006', statut: '📡', usage: '🎯', quoi: 'accumulation antarctique 143 ± 4 kg m⁻² an⁻¹ — le modèle donne ~23' },
        { cible: 'dico:🍰🗻🧊', ref: 'muttoniKent2026', statut: '🦴', usage: '🎯', quoi: 'terre et mer par ceinture et hémisphère (53 reconstructions) : contrôle des PaleoDEM' },
        { cible: 'dico:🍰🗻🧊', ref: 'decontoPollard2003', statut: '💻', usage: '🎯', quoi: 'naissance de la calotte antarctique sous ~2,8 × CO₂ préindustriel' },
        { cible: 'config:CALOTTES_ACTUELLES', ref: 'fretwell2013', statut: '📡', usage: '📌', quoi: 'Antarctique : 12,295e6 km² de glace posée (radar, Bedmap2 tableau 7)' },
        { cible: 'config:CALOTTES_ACTUELLES', ref: 'citterio2013', statut: '📡', usage: '📌', quoi: 'Groenland : 1 804 638 − 88 083 = 1 716 555 km² (cartographie aérophotogrammétrique)' },
        { cible: 'config:CALOTTES_OLIGOCENE', ref: 'wilson2013', statut: '💻', usage: '📌', quoi: 'volume antarctique de l\'Oligocène basal 33,4–35,9e6 km³ (modèle climat–calotte)' },
        { cible: 'config:CALOTTES_OLIGOCENE', ref: 'nye1952', statut: '⚛', usage: '📌', quoi: 'aire tirée du volume : V ∝ S^(5/4)' },
        { cible: 'config:CALOTTES_SNOWBALL', ref: 'hoffman2017', statut: '🦴', usage: '📌', quoi: 'continents englacés jusqu\'à l\'équateur (dépôts glaciaires aux basses paléolatitudes)' },
        { cible: 'config:CALOTTES_SNOWBALL', ref: null, statut: '❔', usage: '📌', quoi: 'toute la bande sous calotte : les zones sèches sans glace d\'un snowball sont ignorées' },
        { cible: 'config:CALOTTES_ACTUELLES', ref: 'dalton2020', statut: '🦴', usage: '🎯', quoi: '🛖 (11,7 ka) : ~9,9e6 km² Amérique du Nord + Groenland ; posé à l\'actuel en attendant le partage par bande (❔)' },

        // ── Gaz ─────────────────────────────────────────────────────────────────────────────────────────────────
        { cible: 'config:N2_1PAL_KG', ref: 'trenberthSmith2005', statut: '📡', usage: '📌', quoi: 'air sec 5,1352e18 kg × 0,7552 = 3,878e18 kg' },
        { cible: 'config:STURTIEN_CO2_KG', ref: null, statut: '⚠️', usage: '🔢', quoi: 'fourchette [500 ; 2 000] ppm non sourcée ; la valeur est la frontière mesurée sur le modèle (dichotomie)' },
        { cible: 'config:STURTIEN_CO2_KG', ref: 'macdonaldWordsworth2017', statut: '💻', usage: '🎯', quoi: 'CO₂ ambiant pré-Sturtien ≤ 3 000 ppm' },

        // ── Courbe Histoire ─────────────────────────────────────────────────────────────────────────────────────
        { cible: 'histoire:kt2018', ref: 'krissansenTotton2018', statut: '💻', usage: '🎯', quoi: 'T moyenne 4,0 Ga → 525 Ma : modèle du cycle du carbone contraint par proxys' },
        { cible: 'histoire:phanda', ref: 'judd2024', statut: '🦴', usage: '🎯', quoi: 'GMST par étage : assimilation de proxys dans un modèle' },
        { cible: 'histoire:cryogenien', ref: 'hoffman2017', statut: '📡', usage: '🎯', quoi: 'dates U-Pb / Re-Os : Sturtien 717 → 659 Ma, Marinoen 639 → 635,2 Ma, intervalle 9–19 Ma' },
        { cible: 'histoire:cryogenien', ref: 'pierrehumbert2005', statut: '💻', usage: '🎯', quoi: 'snowball [−73 ; −23] °C : moyennes annuelles ~200 K (hautes latitudes) et ~250 K (tropiques) du modèle' },
        { cible: 'histoire:cryogenien', ref: 'yang2017', statut: '💻', usage: '🎯', quoi: 'sortie de snowball [40 ; 60] °C : surface de la lentille d\'eau de fonte, pôles → équateur' },
        { cible: 'histoire:cryogenien', ref: 'bao2008', statut: '🦴', usage: '🎯', quoi: 'CO₂ ~10² PAL à la sortie du Marinoen (Δ¹⁷O des sulfates)' },
        { cible: 'histoire:cryogenien', ref: 'leHir2009', statut: '💻', usage: '🎯', quoi: 'retour du CO₂ au fond par l\'altération en quelques Ma' },
        { cible: 'histoire:cryogenien', ref: null, statut: '❔', usage: '🎯', quoi: '« 3 Ma » de retour au fond et intervalle non glaciaire : aucune courbe publiée, ordre de grandeur et KT2018 interpolé' }
    ];
})();
