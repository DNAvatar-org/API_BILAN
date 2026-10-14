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
// Version 1.1.0
// - v1.1.0 (2026-10-14): 2ᵉ lot — les cartes d'équations dont la source est dans la bibliographie.
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
        { cible: 'histoire:hadeen', ref: 'zahnle2010', statut: '💻', usage: '🎯', quoi: 'vapeur de roche 10²–10³ ans, océan de magma ~2 Ma, océan ~500 K sous ~100 bar de CO₂, retrait du CO₂ en 20 ou 100 Ma (fig. 3)' },
        { cible: 'histoire:hadeen', ref: 'sleepZahnleNeuhoff2001', statut: '💻', usage: '🎯', quoi: 'surface de l\'océan de magma après l\'impact géant' },
        { cible: 'histoire:hadeen', ref: 'wilde2001', statut: '🦴', usage: '🎯', quoi: 'eau liquide dès 4,4 Ga (δ¹⁸O des zircons de Jack Hills) → 0 < T < 100 °C' },
        { cible: 'histoire:hadeen', ref: null, statut: '❔', usage: '🎯', quoi: '±50 K autour des ~500 K de l\'océan chaud : largeur non publiée' },
        { cible: 'histoire:precambrien', ref: 'blake2010', statut: '🦴', usage: '🎯', quoi: 'océan archéen 26–35 °C, 3,5 → 3,2 Ga (δ¹⁸O des phosphates ; δ¹⁸O de l\'eau de mer débattu)' },
        { cible: 'histoire:precambrien', ref: 'hren2009', statut: '🦴', usage: '🎯', quoi: '≤ 40 °C à 3,42 Ga (δ¹⁸O–δD des cherts)' },
        { cible: 'histoire:precambrien', ref: 'gumsley2017', statut: '📡', usage: '🎯', quoi: 'première glaciation globale entre 2 460 et 2 426 Ma (U-Pb), instabilité jusqu\'à ~2 250–2 240 Ma' },
        { cible: 'histoire:precambrien', ref: 'hoffman2017', statut: '🦴', usage: '🎯', quoi: 'au moins un snowball au début du Paléoprotérozoïque (dépôts glaciaires)' },
        { cible: 'histoire:precambrien', ref: null, statut: '❔', usage: '🎯', quoi: 'Paléoprotérozoïque : borne basse du snowball cryogénien sous un Soleil plus faible ; épisodes non datés finement' },
        { cible: 'histoire:kt2018', ref: 'krissansenTotton2018', statut: '💻', usage: '🎯', quoi: 'T moyenne 4,0 Ga → 525 Ma : modèle du cycle du carbone contraint par proxys' },
        { cible: 'histoire:phanda', ref: 'judd2024', statut: '🦴', usage: '🎯', quoi: 'GMST par étage : assimilation de proxys dans un modèle' },
        { cible: 'histoire:cryogenien', ref: 'hoffman2017', statut: '📡', usage: '🎯', quoi: 'dates U-Pb / Re-Os : Sturtien 717 → 659 Ma, Marinoen 639 → 635,2 Ma, intervalle 9–19 Ma' },
        { cible: 'histoire:cryogenien', ref: 'pierrehumbert2005', statut: '💻', usage: '🎯', quoi: 'snowball [−73 ; −23] °C : moyennes annuelles ~200 K (hautes latitudes) et ~250 K (tropiques) du modèle' },
        { cible: 'histoire:cryogenien', ref: 'yang2017', statut: '💻', usage: '🎯', quoi: 'sortie de snowball [40 ; 60] °C : surface de la lentille d\'eau de fonte, pôles → équateur' },
        { cible: 'histoire:cryogenien', ref: 'bao2008', statut: '🦴', usage: '🎯', quoi: 'CO₂ ~10² PAL à la sortie du Marinoen (Δ¹⁷O des sulfates)' },
        { cible: 'histoire:cryogenien', ref: 'leHir2009', statut: '💻', usage: '🎯', quoi: 'retour du CO₂ au fond par l\'altération en quelques Ma' },
        { cible: 'histoire:cryogenien', ref: null, statut: '❔', usage: '🎯', quoi: '« 3 Ma » de retour au fond et intervalle non glaciaire : aucune courbe publiée, ordre de grandeur et KT2018 interpolé' },
        // ── Équations : bilan, solveur, intérieur, profil (2026-10-14, 2ᵉ lot) ──────────────────────────────────────
        { cible: 'eq:eq-equilibre-sommet-atmosphere', ref: null, statut: '⚛', usage: '📌', quoi: 'bilan d\'énergie au sommet, une seule inconnue T_s' },
        { cible: 'eq:eq-tolerance-recherche-racine', ref: null, statut: '⚛', usage: '🔢', quoi: 'tolérance 4σT_e³ δT ; pas ≤ 20 K pour s\'arrêter au premier équilibre rencontré' },
        { cible: 'eq:eq-refroidissement-interieur', ref: null, statut: '⚛', usage: '📌', quoi: 'C(T) dT/dt = H(t) − Q(T), intégré d\'un clic à l\'autre' },
        { cible: 'eq:eq-refroidissement-interieur', ref: null, statut: '❔', usage: '📌', quoi: 'manteau et noyau en un seul réservoir (approximation déclarée)' },
        { cible: 'eq:eq-convection-sous-couche-limite', ref: null, statut: '⚛', usage: '📌', quoi: 'théorie de la couche limite, Q ∝ ΔT^(1+β) η^(−β)' },
        { cible: 'eq:eq-ocean-magma-rayonnement-vide', ref: 'katz2003', statut: '📡', usage: '📌', quoi: 'solidus et liquidus de la péridotite à 0 GPa' },
        { cible: 'eq:eq-ocean-magma-rayonnement-vide', ref: null, statut: '⚛', usage: '📌', quoi: 'l\'OLR du transfert radiatif du modèle vide l\'intérieur' },
        { cible: 'eq:eq-rayon-planete-fonction-temperature', ref: null, statut: '⚛', usage: '📌', quoi: 'dilatation thermique et gonflement de fusion' },
        { cible: 'eq:eq-rayon-planete-fonction-temperature', ref: null, statut: '⚠️', usage: '📌', quoi: 'α_V 1–3·10⁻⁵ K⁻¹ et ΔV_f 0–7 % : fourchettes sans référence' },
        { cible: 'eq:eq-hydrostatique-adiabatique-seche', ref: null, statut: '⚛', usage: '📌', quoi: 'équilibre hydrostatique, adiabatique sèche' },
        { cible: 'eq:eq-hydrostatique-adiabatique-seche', ref: 'chase1998', statut: '📡', usage: '📌', quoi: 'c_p de chaque gaz (tables NIST-JANAF)' },
        { cible: 'eq:eq-adiabatique-humide-non-diluee', ref: 'pierrehumbert2010', statut: '⚛', usage: '📌', quoi: 'adiabatique humide non diluée (éq. 2.33)' },
        { cible: 'eq:eq-stratosphere-temperature-peau', ref: null, statut: '⚛', usage: '📌', quoi: 'température de peau d\'une couche grise mince' },
        { cible: 'eq:eq-stratosphere-temperature-peau', ref: null, statut: '❔', usage: '📌', quoi: 'approximation grise déclarée' },
        { cible: 'eq:eq-vapeur-surface', ref: 'manabeWetherald1967', statut: '📡', usage: '🎚️', quoi: 'humidité relative de surface 0,77 (borne de la jauge CHAUD)' },
        { cible: 'eq:eq-ocean-possible-ou-non', ref: null, statut: '⚛', usage: '📌', quoi: 'état de phase : au-delà, toute l\'eau est vapeur' },

        // ── Spectroscopie, transfert ──────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-intensite-raie-temperature-couche', ref: 'kochanov2016', statut: '📡', usage: '📌', quoi: 'raies HITRAN (CO₂, H₂O, CH₄) récupérées par HAPI' },
        { cible: 'eq:eq-intensite-raie-temperature-couche', ref: null, statut: '❔', usage: '📌', quoi: 'HITRAN et non HITEMP : bandes chaudes absentes au-delà de ~1 000 K' },
        { cible: 'eq:eq-fonctions-partition', ref: null, statut: '❔', usage: '📌', quoi: 'rotateur rigide seul, sans vibrations (écart à TIPS croissant avec T)' },
        { cible: 'eq:eq-profil-voigt-largeurs', ref: 'kochanov2016', statut: '📡', usage: '📌', quoi: 'coefficients d\'élargissement HITRAN' },
        { cible: 'eq:eq-profil-voigt-largeurs', ref: null, statut: '⚛', usage: '📌', quoi: 'largeur Doppler ; Voigt par l\'approximation de Humlíček' },
        { cible: 'eq:eq-elargissement-par-pression', ref: null, statut: '⚠️', usage: '🔧', quoi: '√(P/P₀) appliqué à toutes les raies sur des tables à 1 atm, marqué [OBS/CALIB]' },
        { cible: 'eq:eq-auto-elargissement-vapeur', ref: 'kochanov2016', statut: '📡', usage: '📌', quoi: 'rapport auto/air (≈ 5) tiré des raies HITRAN' },
        { cible: 'eq:eq-continuum-vapeur-eau', ref: 'roberts1976', statut: '📡', usage: '📌', quoi: 'continuum de la vapeur 400–1 250 cm⁻¹' },
        { cible: 'eq:eq-absorption-induite-par-collisions', ref: 'karman2019', statut: '📡', usage: '📌', quoi: 'table CIA CO₂–CO₂ mesurée (HITRAN CIA)' },
        { cible: 'eq:eq-absorption-induite-par-collisions', ref: null, statut: '❔', usage: '📌', quoi: 'hors de l\'intervalle de T mesuré : valeur du jeu le plus proche' },
        { cible: 'eq:eq-epaisseur-optique-une-couche', ref: null, statut: '⚛', usage: '📌', quoi: 'transmission d\'un flux isotrope, κ additionnés par longueur d\'onde' },
        { cible: 'eq:eq-equation-schwarzschild-flux-montant', ref: null, statut: '⚛', usage: '📌', quoi: 'équation de Schwarzschild, couches isothermes' },
        { cible: 'eq:eq-equation-schwarzschild-flux-montant', ref: null, statut: '❔', usage: '📌', quoi: 'surface noire (émissivité 1 ; l\'eau vaut ~0,96–0,99)' },
        { cible: 'eq:eq-olr-effet-serre-repartition', ref: null, statut: '⚛', usage: '📌', quoi: 'répartition de l\'effet de serre par retrait à T figée' },

        // ── Nuages, solaire ───────────────────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-nuage-bas-adiabatique-eau', ref: null, statut: '⚛', usage: '📌', quoi: 'la parcelle sature au niveau de condensation, l\'excès condense' },
        { cible: 'eq:eq-phase-liquide-glace', ref: 'huStamnes1993', statut: '💻', usage: '📌', quoi: 'partition liquide / glace linéaire entre −40 et 0 °C (paramétrisation)' },
        { cible: 'eq:eq-rayon-effectif-gouttes', ref: 'martinJohnsonSpice1994', statut: '📡', usage: '📌', quoi: 'rayon effectif ∝ (LWC / N)^⅓, mesures avion en stratocumulus' },
        { cible: 'eq:eq-epaisseurs-optiques-nuage', ref: null, statut: '⚛', usage: '📌', quoi: 'τ = 3 LWP / (2 ρ r_eff) pour des gouttes grandes devant λ' },
        { cible: 'eq:eq-rayon-cristaux-glace', ref: 'king2013', statut: '⚠️', usage: '📌', quoi: '20–40 µm « de mémoire » : à relever dans l\'article' },
        { cible: 'eq:eq-population-nuages-bas', ref: null, statut: '❔', usage: '📌', quoi: 'toutes les profondeurs également représentées (hypothèse de cycle de vie)' },
        { cible: 'eq:eq-couverture-partielle-dans-transfert', ref: null, statut: '❔', usage: '📌', quoi: 'recouvrement maximal-aléatoire (hypothèses standard)' },
        { cible: 'eq:eq-nuages-hauts-altitude-epaisseurs', ref: 'hartmannLarson2002', statut: '⚛', usage: '📌', quoi: 'température fixe des enclumes (loi physique)' },
        { cible: 'eq:eq-nuages-hauts-altitude-epaisseurs', ref: null, statut: '⚠️', usage: '📌', quoi: 'valeur de 220 K « de mémoire »' },
        { cible: 'eq:eq-nuages-hauts-altitude-epaisseurs', ref: 'stubenrauch2024', statut: '📡', usage: '📌', quoi: 'bornes de la distribution en ln τ ajustées sur les tiers CALIPSO' },
        { cible: 'eq:eq-schema', ref: 'lacisHansen1974', statut: '💻', usage: '📌', quoi: 'schéma solaire ajusté sur des calculs de diffusion multiple' },
        { cible: 'eq:eq-ozone-chemin-optique', ref: 'lacisHansen1974', statut: '💻', usage: '📌', quoi: 'absorption de l\'ozone (éq. 8, 9, 11, 12)' },
        { cible: 'eq:eq-colonne-ozone-selon-oxygene', ref: 'segura2003', statut: '💻', usage: '📌', quoi: '124 DU à 1 % d\'O₂ (modèle photochimique)' },
        { cible: 'eq:eq-colonne-ozone-selon-oxygene', ref: null, statut: '❔', usage: '📌', quoi: 'loi de puissance par deux points (facteur 2 d\'incertitude aux faibles O₂)' },
        { cible: 'eq:eq-diffusion-rayleigh', ref: 'lacisHansen1974', statut: '💻', usage: '📌', quoi: 'albédo de Rayleigh de la Terre actuelle (éq. 41)' },
        { cible: 'eq:eq-diffusion-rayleigh', ref: null, statut: '⚛', usage: '📌', quoi: 'étendu à une autre colonne par la loi d\'une couche conservative' },
        { cible: 'eq:eq-eau-precipitable-effective', ref: 'lacisHansen1974', statut: '💻', usage: '📌', quoi: 'mise à l\'échelle en pression et température (éq. 24)' },
        { cible: 'eq:eq-couche-diffusante-deux-flux', ref: 'sagan1967', statut: '⚛', usage: '📌', quoi: 'deux-flux d\'une couche diffusante' },
        { cible: 'eq:eq-addition-couches-moyenne-sur', ref: null, statut: '⚛', usage: '📌', quoi: 'addition des couches ; hémisphère éclairé en Gauss-Legendre 4 points' },
        { cible: 'eq:eq-voile-stratospherique', ref: 'macdonaldWordsworth2017', statut: '💻', usage: '📌', quoi: 'voile sulfaté de la province Franklin ≈ −10 W/m² (⛄ 🔺🍰⚽ = 0,05)' },

        // ── Surfaces, glace, eau, carbone ─────────────────────────────────────────────────────────────────────────
        { cible: 'eq:eq-melange-surfaces', ref: null, statut: '⚛', usage: '📌', quoi: 'albédo de surface = moyenne pondérée par les aires' },
        { cible: 'eq:eq-albedos-surfaces', ref: 'warrenWiscombe1980', statut: '📡', usage: '📌', quoi: 'albédo de la neige' },
        { cible: 'eq:eq-albedos-surfaces', ref: 'perovich2002', statut: '📡', usage: '📌', quoi: 'glace fondante (SHEBA)' },
        { cible: 'eq:eq-albedos-surfaces', ref: null, statut: '⚠️', usage: '📌', quoi: 'lave 0,05 et « boue de neige » 0,48 des snowballs' },
        { cible: 'eq:eq-glace-saisonniere-voit-soleil', ref: null, statut: '⚛', usage: '📌', quoi: 'insolation journalière exacte × [T(jour) < T_gel]' },
        { cible: 'eq:eq-trois-zones-latitude', ref: null, statut: '⚛', usage: '📌', quoi: 'aires géométriques des zones 0,134 / 0,366 / 0,5' },
        { cible: 'eq:eq-trois-zones-latitude', ref: null, statut: '❔', usage: '📌', quoi: 'fraction englacée en rampe linéaire sur l\'amplitude saisonnière' },
        { cible: 'eq:eq-mer-gelee', ref: null, statut: '⚠️', usage: '🎚️', quoi: 'largeur de la rampe de mer gelée (« quelques K », source faible)' },
        { cible: 'eq:eq-glace-equilibre-surface-eau', ref: null, statut: '⚠️', usage: '📌', quoi: '0,1 ; 0,9 ; 20 K ; 10 m' },
        { cible: 'eq:eq-forets-deserts', ref: null, statut: '⚠️', usage: '🔧', quoi: 'lois des forêts et des déserts, aucune source' },
        { cible: 'eq:eq-planete-sans-eau-albedo', ref: null, statut: '⚠️', usage: '📌', quoi: 'albédo nul sous 10 m d\'eau : voulu pour ⚫ (pédagogique), à porter par l\'époque' },
        { cible: 'eq:eq-partage-glace-liquide-hydrosphere', ref: null, statut: '⚠️', usage: '📌', quoi: 'rampes et coefficients du stock de glace affiché' },
        { cible: 'eq:eq-precipitations', ref: null, statut: '⚠️', usage: '📌', quoi: 'tout sauf le temps de résidence (n\'agit qu\'à l\'initialisation)' },
        { cible: 'eq:eq-partage-ocean-atmosphere', ref: 'sarmientoGruber2006', statut: '📡', usage: '📌', quoi: 'r = 38 000 / 760 GtC' },
        { cible: 'eq:eq-partage-ocean-atmosphere', ref: null, statut: '⚠️', usage: '📌', quoi: 'pas de relaxation 0,1 (mesuré inerte)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'broeckerPeng1982', statut: '📡', usage: '📌', quoi: 'océan en trois réservoirs (1 / 50 / 350 ans)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'sabine2004', statut: '📡', usage: '📌', quoi: 'puits océanique anthropique mesuré' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'eglestonSabineMorel2010', statut: '⚛', usage: '📌', quoi: 'facteur de Revelle (chimie des carbonates)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'norby2005', statut: '📡', usage: '📌', quoi: 'fertilisation CO₂ des jeunes forêts (FACE)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'jiang2020', statut: '📡', usage: '📌', quoi: 'forêt mature sans gain de biomasse (EucFACE)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'poulter2019gfad', statut: '📡', usage: '📌', quoi: 'âge des forêts (GFAD)' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'osullivan2019', statut: '💻', usage: '📌', quoi: 'dépôt d\'azote' },
        { cible: 'eq:eq-puits-co2-injecte', ref: 'pugh2019', statut: '💻', usage: '📌', quoi: 'repousse des forêts' },
        { cible: 'eq:eq-forcages-convention-organigramme', ref: 'myhre1998', statut: '💻', usage: '🎯', quoi: 'ΔF = 5,35 ln(C/C₀) : affichage seulement, le modèle calcule raie par raie' },
        { cible: 'eq:eq-capacites-radiatives-indice', ref: 'sundqvist1989', statut: '💻', usage: '🎯', quoi: 'indice de Sundqvist : diagnostic affiché, ne pilote plus la couverture' },
    ];
})();
