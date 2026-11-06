// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.13.0
// - v1.13.0 (2026-11-04): 📱 : 973 GtCO₂ mesurés en 2000 (🛢), puis chaque bouton multiplie la tranche précédente.
// - v1.12.0 (2026-11-03): plancher de la tolérance par époque (🧲🔬⌊) : 0,10 W/m², 0,01 pour 📱.
// - v1.11.0 (2026-11-02): fourchettes du banc à la date du clic (benchLitA, BENCH_LIT_DATEES : NOAA 2025 pour 📱).
// Date: [November 4, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': emoji époque, '▶': number, '◀': number, ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
//
// ============================================================================
// 🔒 LUMINOSITÉ SOLAIRE — calculée, jamais posée par époque
// Formule de Gough (1981), Solar Physics 74:21 — physique nucléaire stellaire :
//   L(t_ago) = L☉ / (1 + 0.4 × t_ago / 4.57)
//   L☉ = CONST.L_SOLEIL_W = 3.828e26 W (IAU 2015 Resolution B3)
//   t_ago = ÂGE courant en Ga ; 4.57 Ga = âge du Soleil
//   🧲☀️ = L / (4π × AU²) (× 1/√(1 − e²) de l'orbite), 🧲☀️🎱 = 🧲☀️ / 4 (géométrie sphérique)
// Confirmé par Bahcall, Pinsonneault & Basu (2001), ApJ 555:990 (Standard Solar Model).
// 🔋☀️ = L à l'âge courant, dans DATA['☀️'] (convergence/compute.js, getSoleil) : aucune époque n'en porte une copie.
// ============================================================================
//
// ---------------------------------------------------------------------------
// GRILLE LITTÉRATURE (repère / bench) — CSV synthèse ; 🌡️🧮 TIMELINE = amorce solveur (K), pas T finale.
// Fourchettes litt. bench : window.BENCH_LIT_BY_EPOCH_ID (assigné après window.TIMELINE) ; epoch_bench.html n’embarque plus de copie.
// Chaque entrée d’époque dans timeline[] reprend en commentaire les mêmes nombres (voir Archéen 🦠 modèle).
// Colonnes : T_init °C plage ; CO₂ ppm ; CH₄ ppm ; H₂O vapeur mol % (atmosphère) ; albédo 🍰🪩📿.
// Mapping époques TIMELINE ↔ libellés CSV : ⚫ Corps_noir ; 🔥 Hadéen ; 🦠 Archéen ; 🪸 Protérozoïque ;
//   hysteresis 1a Sturtienne ; ⛄ Plein_Snowball ; hysteresis 1b Sortie_Marinoen ; 🪼 Paléozoïque_marin ;
//   🍄 Paléozoïque_terre ; 💀 Limite_P/T ; 🦕 Mésozoïque ; 🦤 Cénozoïque ; 🐊 Éocène ; 🏔 Oligocène/Grande_Coupure ;
//   🦣 Quaternaire ; 🛖 Holocène ; 📱 Aujourd'hui.
// Époque,T_init_°C,CO2_ppm,CH4_ppm,H2O_vap_mol_%,Albedo_🪩
// Corps_noir,[-19, -17],[0, 1],[0, 0.1],[0, 0.01],[0.29, 0.31]
// Hadéen,[2000, 2500],[100000, 500000],[10, 100],[10, 20],[0.15, 0.35]
// Archéen,[5, 25],[50000, 150000],[1000, 10000],[0.5, 3.0],[0.20, 0.30]
//   → T surface : plage tempérée froide/modérée à ~4 Ga ; eau liquide probable mais contraintes exactes très débattues.
// Protérozoïque,[0, 15],[5000, 20000],[50, 500],[0.5, 1.5],[0.25, 0.35]
// Sturtienne,[5, 15],[500, 2000],[10, 50],[0.1, 1.0],[0.60, 0.85]
// Plein_Snowball,[-60, -50],[300, 1500],[0.1, 10],[0.01, 0.5],[0.80, 0.90]
// Sortie_Marinoen,[20, 50],[2000, 10000],[10, 100],[2.0, 5.0],[0.15, 0.25]
// Paléozoïque_marin,[15, 25],[1500, 5000],[5, 20],[1.0, 2.5],[0.20, 0.25]
// Paléozoïque_terre,[15, 25],[500, 3000],[5, 20],[1.0, 2.0],[0.20, 0.23]
// Limite_P/T,[21, 32],[1500, 4000],[20, 100],[1.5, 3.5],[0.18, 0.22]
// Mésozoïque,[21, 31],[1000, 2500],[10, 30],[1.5, 3.0],[0.18, 0.22]
// Cénozoïque,[12, 22],[400, 1000],[1, 5],[0.8, 1.5],[0.22, 0.28]
// Éocène,[20, 28],[800, 1500],[1, 5],[1.2, 2.5],[0.20, 0.25]
// Oligocène,[12, 18],[400, 700],[1, 2],[0.8, 1.2],[0.25, 0.30]
// Grande_Coupure,[10, 15],[300, 600],[1, 2],[0.7, 1.0],[0.28, 0.32]
// Quaternaire,[10, 16],[180, 300],[0.4, 0.8],[0.6, 1.0],[0.28, 0.33]
// Holocène,[13, 15],[260, 285],[0.6, 0.8],[0.8, 1.0],[0.29, 0.31]
// Aujourd'hui (an 2000),[14.5, 15.5],[365, 375],[1.70, 1.85],[1.0, 1.2],[0.29, 0.30]
// ---------------------------------------------------------------------------
// CONV ATM / humidité (rappel code) :
// - Profil vapeur : waterVaporFractionAtZ + PHYS.computeH2OScaleHeight() (R·T²/(L·Γ), Clausius-Clapeyron + adiabatique).
//   À T globale +1 K, la colonne H₂O suit ~7 %/K (Held & Soden 2006) via r₀ (🍰🫧💧) + H_vap(T) — pas de « garde » silencieuse.
// - Hadéen / sortie Snowball : atmosphère steam (τ_H₂O élevé) ; Archéen CH₄ massif : brumes organiques possibles (albédo vs EDS) — overlap dans radiative/calculations.js + hitran.js (Voigt ≥0).
// - Colonne bench « CONV ATM » : état post-convergence (DATA), pas la seule grille CSV ci-dessus.
// ---------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------
// 🔒 SCHÉMA BORNES HYSTÉRÉSIS (v1.4.23) — per-epoch min/max pour la jauge bary scie_hysteresis_bary.js (Step 3)
// Structure dans chaque entrée timeline[] :
//   '🔒': {
//       '⚖️🏭': { min, max, cools }, // CO₂ (kg)
//       '⚖️🐄': { min, max, cools }, // CH₄ (kg)
//       '⚖️💨': { min, max, cools }, // N₂  (kg) — dilution/pressure-broadening
//       '⚖️✈': { min, max, cools }, // sulfates (kg) — CCN/aérosols
//       '⚖️🫁': { min, max, cools }, // O₂  (kg)
//       '⚖️💧': { min, max, cools }, // H₂O hydrosphère (kg)
//   }
//   cools ∈ {'min','max'} : direction de refroidissement. 'min' pour GES (↓CO₂/CH₄ = froid), 'max' pour sulfates (↑CCN = froid par ⚖️✈→ε_CCN→albédo).
//   N₂ : 'min' = froid (moins de pressure-broadening / effet lapse rate) — ambigu, cf. Goldblatt 2009.
// Sources : GRILLE LITTÉRATURE CSV ci-dessus + épochs_bench.html + VALIDATION_CONFIG_GAZ.md.
// Priorité Step 2 : 🦠 Archéen, ⛄ Plein Snowball, 📱 Aujourd'hui. Autres époques : fallback global (Step 3).
// Sémantique bary 0→100 % : 0 % = refroidissement max (pousse vers cools), 100 % = réchauffement max (inverse).
// Pour une quantité q donnée, valeur = cools==='min' ? (bary=0 → min, bary=1 → max) : (bary=0 → max, bary=1 → min).
// L'algo hystérésis utilise ces bornes comme espace de recherche du point de bascule (Step 3 Sonnet).
// ---------------------------------------------------------------------------
//
// Réfs 🌡️🧮 (temp. surface) : Kienert & Feulner Clim. Past 9:1841 (2013) ; Charnay 2017 ; PNAS 2018 ;
// Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014. Valeurs au DÉBUT de chaque époque (parcours temporel à venir).
// Réfs masses gaz (⚖️🏭, ⚖️🐄) : doc/VALIDATION_CONFIG_GAZ.md
// ═══════════════════════════════════════════════════════════════════════════
// MASSES DE SULFATE ⚖️✈ — une charge atmosphérique réelle, en kg de SO₄
// ═══════════════════════════════════════════════════════════════════════════
// Jusqu'au 2026-09-22 cette clé portait un « proxy CCN » : 8,0e13 kg pour 📱, ~1e12 partout
// ailleurs, 5,0e14 pour 🦠. Aucun de ces nombres ne venait d'une source, et les RAPPORTS entre
// époques — la seule chose qui compte dans une loi sulfate→CCN, qui s'écrit en rapport — étaient
// faux d'un ordre de grandeur : 📱/🚂 = 53 contre 2,6 mesuré.
//
// Désormais ⚖️✈ = charge atmosphérique de sulfate, en kg de SO₄, à l'échelle réelle :
//
//   📱 Aujourd'hui      1,05e9 kg   Tsigaridis et al. 2006 ACP 6:5143, Table 5 (nss-SO₄, an 2000)
//   🚂 Industriel 1800  4,0e8  kg   même table, colonne « préindustriel »
//   ⛄ Plein Snowball   1,2e8  kg   fond naturel × part volcanique du soufre (dérivation sur sa fiche)
//   ⚫ Corps noir       0            pas d'atmosphère
//   🔥 Hadéen           0            ~2650 °C : rien ne condense
//   toutes les autres   4,0e8  kg   fond naturel préindustriel, FAUTE DE CONTRAINTE
//
// Le « faute de contrainte » est à prendre au mot, et c'est l'énoncé honnête : il n'existe pas de
// charge de sulfate atmosphérique publiée pour le Protérozoïque, le Paléozoïque, le Mésozoïque ni
// le Cénozoïque. Poser un chiffre différent par époque aurait été inventer. Ce qu'on sait, en
// revanche, c'est que le sulfate naturel vient de deux sources dont les ordres de grandeur n'ont
// pas de raison d'avoir changé d'un facteur 10 sur le Phanérozoïque :
//   volcanisme subaérien  23 ± 2 Tg SO₂/an = 11,5 Tg S/an  (Carn et al. 2017 Sci. Rep. 7:44095)
//   DMS marin             28,1 [17,6 ; 34,4] Tg S/an        (Lana et al. 2011 GBC 25:GB1004)
// La durée de vie du sulfate est de 4,12 j (Textor et al. 2006 ACP 6:1777, Table 10), donc la charge
// suit la source presque instantanément : pas de mémoire, pas d'accumulation possible.
//
// Vérification d'échelle, faite une fois : 179 Tg SO₄/an × 4,12 j / 365 = 2,02 Tg — c'est bien la
// charge de 1,99 Tg que Textor donne dans la même table. Source × durée de vie = charge, ✅.
//
// ⚠️ Événements ≠ fond. Un panache de LIP ou d'éruption dure des années, pas des dizaines de Ma :
// il n'a rien à faire dans une charge de fond moyennée sur une époque. Le voile sulfaté Franklin
// qui bascule le Sturtien est porté séparément par ⛄.🔺🍰⚽ = 0,05.
//
// Détail, dérivations et ce qui reste non contraint : doc/MASSES_SULFATE_PAR_EPOQUE.md
// ═══════════════════════════════════════════════════════════════════════════
// EAU ACCRÉTÉE : l'eau avec laquelle la Terre sort de l'impact géant. Pour la pédagogie, le corps noir ⚫ part SANS eau,
// et ce sont ses météorites qui l'apportent — un ☄️ à CHAQUE tic de ⚫, la même masse totale que 🔥 a au départ, une seule
// référence. Dans la réalité, l'essentiel de cette eau venait avec les briques de la Terre (chondrites à enstatite,
// Piani et al. 2020, Science 369:1110) : les ☄️ de ⚫ la figurent, elles ne prétendent pas à une chronologie.
// Valeur publiée : ~10²¹ kg d'H₂O dans l'atmosphère d'impact de la Terre en accrétion, « proche de la masse des océans
// actuels » (Matsui & Abe 1986, Nature 319:303) ; la Terre sort de l'impact géant avec ~ un océan, 270 bar de vapeur
// (Zahnle et al. 2010, Cold Spring Harb. Perspect. Biol. 2:a004895, fig. 3). → EAU_ACCRETEE_KG = UN OCÉAN.
// (v1.5.3 ; avant : 6e20 kg, calé sur une vapeur à 15 % mol dans 🔥 — ⚠️ sans source.)
// OCEAN_KG : masse d'un océan actuel = 270 bar × 4πR² / g = 2,7e7 Pa × 5,101e14 m² / 9,81 m s⁻² = 1,40e21 kg (pression
// équivalente de Zahnle et al. 2010) ; volume 1,335e9 km³ × ~1 030 kg m⁻³ = 1,37e21 kg (Charette & Smith 2010,
// Oceanography 23:112). Une seule référence : CONFIG_COMPUTE.earthTotalWaterMassKg la lit.
const OCEAN_KG = 1.4e21;
const EAU_ACCRETEE_KG = OCEAN_KG;   // [kg] = 🔥 ⚖️💧
// Eau CUMULÉE après le k-ième ☄️ de ⚫ (k = 1…N) : progression GÉOMÉTRIQUE de EAU_PREMIER_KG à EAU_ACCRETEE_KG — très peu
// au début, l'essentiel à la fin : la Terre accrète son eau tout du long, mais la plus grande part avec les derniers
// embryons venus de la ceinture externe (Morbidelli et al. 2000, Meteorit. Planet. Sci. 35:1309 ; ≤ 10 % avant que la
// Terre ait la moitié de sa masse). Forme 🧭 ❔ (pédagogique, aucune courbe cumulée publiée), usage 📌.
// EAU_PREMIER_KG = 1e17 kg ≈ 0,3 m d'eau globale sur ⚫ : l'albédo de l'eau sature à une couche de 10 m (🍰🪩💧, ~3e18 kg
// sur ⚫) ; une première météorite plus lourde gèlerait tout d'un coup et l'apport progressif ne se verrait pas.
const EAU_PREMIER_KG = 1.0e17;
const EAU_CUMUL_KG = (k, N) => EAU_ACCRETEE_KG * Math.pow(EAU_PREMIER_KG / EAU_ACCRETEE_KG, (N - k) / (N - 1));
const EAU_DU_CLIC_KG = (k, N) => EAU_CUMUL_KG(k, N) - (k > 1 ? EAU_CUMUL_KG(k - 1, N) : 0);
// ═══════════════════════════════════════════════════════════════════════════
// CALOTTES AU CLIC FRISE (EPOCH['🗻']['🍰🗻🧊']) : part de chaque bande de latitude, par hémisphère, sous calotte
// permanente à ▶ de l'époque. Le clic time les fait ensuite évoluer par leur bilan de masse (physics/calottes.js).
// Aire d'une bande polaire (60–90°) d'un hémisphère : 2πR²(1 − sin 60°) = 34,168e6 km² (R = 6 371 km).
// Une part de 1 = toute la bande : le continent de la bande (PaleoDEM) la plafonne.
//   Antarctique : 12,295e6 km² de glace posée, plates-formes exclues (Bedmap2, Fretwell et al. 2013, The Cryosphere 7:375,
//     tableau 7) → 0,35984 de la bande polaire sud (toute la calotte est au sud de 60° S).
//   Groenland : 1 804 638 km² englacés dont 88 083 km² de glaciers et calottes locales (Citterio & Ahlstrøm 2013,
//     The Cryosphere 7:445) → calotte 1 716 555 km² → 0,050239 de la bande polaire nord (au nord de 60° N).
//   Glaciers et petites calottes hors inlandsis (Arctique canadien, Svalbard, montagnes…) : non comptés.
// N₂ = 1 PAL : 5,1352e18 kg d'air sec (Trenberth & Smith 2005) × 0,7552 — une seule valeur pour toutes les époques sauf ⚫ 🔥.
const N2_1PAL_KG = 3.878e18;
// ─── LE PRÉSENT ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Origine des âges : ▶ et ◀ des époques géologiques sont des années avant AN_PRESENT ; 🛖 🚂 📱 sont en années du calendrier
// (INTERIEUR.ageDe). Une seule origine, lue par geology/interieur.js, physics/orbite.js, la courbe de l'onglet Histoire
// (CO2/static/histoire/litterature.js) et CO2/scripts/quaternaire/epica_etats.py.
window.AN_PRESENT = 2025;   // [an]
// Obliquité de la Terre actuelle (IAU 2009 ; la solution La2004 donne 23,439° en 2000) : l'obliquité DÉCLARÉE des époques
// antérieures à −51 Ma, hors de La2004, faute de reconstruction (❔), sauf 🦠.
window.OBLIQUITE_ACTUELLE_DEG = 23.44;   // [°]
// Base de l'Holocène, 11 700 ans b2k (ICS 2023) = −9 700 du calendrier : ▶ de 🛖 et, en âge, ◀ de 🦣 — une seule date.
const BASE_HOLOCENE_AN = -9700;   // [an calendaire]
// Quaternaire (🦣) : de sa base (ICS 2023, ▶) à celle de l'Holocène ; ses chemins de clics finissent exactement là.
const BASE_QUATERNAIRE_AGE = 2.58e6;   // [an avant AN_PRESENT]
const DUREE_QUATERNAIRE_MA = (BASE_QUATERNAIRE_AGE - (window.AN_PRESENT - BASE_HOLOCENE_AN)) / 1e6;
/** Séquence d'un chemin de 🦣 : les pas donnés [Ma], puis le dernier, ce qui reste jusqu'à la base de l'Holocène. */
const CHEMIN_QUATERNAIRE = (cle, pas) => pas.concat([DUREE_QUATERNAIRE_MA - pas.reduce((t, d) => t + d, 0)]).map((d) => ({ '🕰': cle, '🔺⏳': d }));
// Chemin 🐾 : un pas jusqu'à la plus vieille carotte de glace (EPICA Dome C, 800 ka), puis des pas de 5 ka — 8,2 dates par
// période d'obliquité (41 ka), 3,8 à 4,6 par période de précession (19–23 ka), au-dessus de 2 (Nyquist) — jusqu'au dernier qui
// reste dans 🦣 (15 ka) ; le clic suivant, plus court, finit à la base de l'Holocène. Dates des états 🔁 : CO2/scripts/quaternaire/
// epica_etats.py les relit ici.
const CAROTTES_AGE = 8e5;   // [an avant AN_PRESENT]
const PAS_CAROTTES_AN = 5000;   // [an]
const N_PAS_CAROTTES = Math.ceil((CAROTTES_AGE - (window.AN_PRESENT - BASE_HOLOCENE_AN)) / PAS_CAROTTES_AN) - 1;   // pas entiers dans 🦣
// Masses de la racine de 🦣 (2,58 Ma), lues par sa ligne et par le premier état 🔁 du chemin 🐾 : avant les carottes (800 ka), aucune
// mesure continue du CO₂ ; le premier pas de 🐾 garde celles de la racine jusqu'à 805 ka (❔), puis un pas de 5 ka entre dans 800 ka.
const QUATERNAIRE_CO2_KG = 2.1742e15;   // [kg] CO₂ ≈ 282 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024), Gélasien / Plaisancien
const QUATERNAIRE_CH4_KG = 1.9550e12;   // [kg] CH₄ ≈ 0,695 ppm : préindustriel moderne de Beerling et al. 2011 (encadré « CH₄ DES ÉPOQUES »)
// Sturtien : ☃ (hysteresis 1a, ◀ = 717 Ma) et ⛄ (▶ = 717 Ma) sont la MÊME planète au même instant — même CO₂, même CH₄,
// deux états (branche chaude / snowball). FRONTIÈRE mesurée le 2026-10-14, CO₂ et CH₄ descendus ENSEMBLE dans leurs fourchettes
// (CO₂ = 500 + 1 500 s, CH₄ = 10 + 40 s ppm d'air sec), dichotomie bornée à 12 pas, critère « frise = clic » : ☃ chaud au CLIC
// FRISE ET à l'arrivée par la CHAÎNE (frise 🪸, 💫 ×3 → ☃) :
//   s = 0,51196 → 1 267,9 ppm / 30,48 ppm : frise ☃ 7,16 °C, chaîne ☃ 7,09 °C (glace 0,14, vapeur 0,97 %) ; 🗻 → ⛄ −76,4 °C ;
//                 💫 (voile retiré) ⛄ −76,8 °C, reste gelé
//   s = 0,51182 → 1 267,7 ppm / 30,47 ppm : frise ☃ −73,6 °C (snowball)
// La chaîne seule tenait jusqu'à 1 130,6 ppm, mais la branche chaude n'y est plus qu'une tangente : le clic frise (premier pas
// plus grand) passait dessous. Remesurer après tout changement de physique.
// 2026-10-31 (calottes à trois boîtes, terre libre continentale, σ(T, P), FROID 62, 🪸 à 79,4 mbar), chaîne 🪸 → 1a → (🗻) ⛄ → 💫,
//   CO₂ seul, CH₄ inchangé : 4 200 ppm → 1a −67,3 °C (s'effondre) · 4 250 ppm → 1a 10,7 °C, ⛄ −70,3 °C, reste gelé (−67,2) au 💫.
//   ⚠️ Au-dessus de la fourchette du Sturtien [500 ; 2 000] ppm du banc : c'est le seuil du modèle, pas un choix.
const STURTIEN_CO2_KG = 2.601846e+16;   // [kg] 4 250 ppm d'air sec (avant 7.762073e15, 1 267,9 ppm)
const STURTIEN_CH4_KG = 6.800241e13;   // [kg] 30,48 ppm d'air sec
const CALOTTES_SANS = { S_pol: 0, N_pol: 0, S_mid: 0, N_mid: 0, S_trop: 0, N_trop: 0 };
const CALOTTES_ACTUELLES = { S_pol: 0.35984, N_pol: 0.050239, S_mid: 0, N_mid: 0, S_trop: 0, N_trop: 0 };
// Snowball (Sturtien, Marinoen) : continents englacés jusqu'à l'équateur (Hoffman et al. 2017, Science Advances
// 3:e1600983) — toute la bande, plafonnée par son continent. ⚠️ Les zones sèches sans glace d'un snowball sont ignorées.
const CALOTTES_SNOWBALL = { S_pol: 1, N_pol: 1, S_mid: 1, N_mid: 1, S_trop: 1, N_trop: 1 };
// Oligocène basal (33,9 Ma) : Antarctique de Wilson et al. 2013 (GRL 40:4305) — 33,4–35,9e6 km³ de glace, 1,3–1,4 × l'actuel
// (26,54e6 km³ posés, Bedmap2 tableau 7). Aire tirée du volume par le dôme plastique du moteur (physics/calottes.js), V ∝ S^(5/4)
// avec le τ fermé sur Bedmap2 : S = 12,295e6 × (34,65 / 26,54)^(4/5) = 15,22e6 km², 0,4454 de la bande (0,4325–0,4582 sur la
// fourchette du volume).
const CALOTTES_OLIGOCENE = { S_pol: 0.44540, N_pol: 0, S_mid: 0, N_mid: 0, S_trop: 0, N_trop: 0 };
// Une époque de la timeline par son 📅 : une valeur qu'une époque prend d'une autre se LIT chez elle (accesseur), elle n'est pas
// recopiée (🧫 de 🦕 et de 🦤).
const epoqueDe = (id) => timeline.find((e) => e['📅'] === id);
const timeline = [
    {// Corps noir
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4510e6, // v-2026-09-24 : vraie date — impact géant / formation de la Lune ~4,51 Ga (Barboni et al. 2017) (était 4.5e9) ‖ Fin
        '🧲🔬': 0.3,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.0,  // Mer de l'époque (❔ posée avant 540 Ma, la PaleoDEM s'arrête là) : pas de bassin
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de relief)
            '🍰🗻🌍': 1.0, // Terres basses (100% - surface rocheuse)
            '🍰🗻🧊': CALOTTES_SANS
        },
        '🪩🍰': {
            '🪩🍰🌍': 0.0  // Override coefficient albedo terres à 0 (corps noir absorbe tout)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 0, // co2_kg (Quantité de CO2 en kg)
        '⚖️🐄': 0, // ch4_kg (Quantité de CH4 en kg)
        '⚖️💧': 0, // h2o_kg (Quantité totale d'eau en kg)
        '⚖️🫁': 0, // o2_kg (Quantité de O2 en kg)
        // ⚖️✈ : 0 — pas d'atmosphère (⚖️🫧 = 0 sur cette fiche), donc pas d'aérosol. Ce n'est pas
        //   une valeur de littérature, c'est la définition du cas. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 0,
        '⚖️💨': 0, // n2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        // Événements interactifs : 🕰.order = la séquence des clics (CLICS, convergence/clics.js), pour toute interface.
        '🕰': {
            // Quatre ☄️, chacun portant SA masse d'eau (🔺⚖️💧☄️, croissante : EAU_DU_CLIC_KG), puis 🎇. Trois tics de 100 Ma,
            // le 4ᵉ jusqu'à 1 000 ans avant l'impact géant (◀ = 4 510 Ma) : 🎇 ne dure que ces 1 000 ans, le saut vers 🔥 est
            // vertical sur l'onglet Histoire.
            // Cumul : 1e17 → 2,4e18 → 5,8e19 → 1,4e21 kg (≈ 0,3 m → 7,4 m → 178 m → 4,3 km d'eau globale sur ⚫).
            'order': [100, 100, 100, 189.999].map((dt, i) => ({ '🕰': '☄️', '🔺⏳': dt, '🔺⚖️💧☄️': EAU_DU_CLIC_KG(i + 1, 4) }))
                .concat([{ '🕰': '🎇', '🔺⏳': 0.001 }]),
            '☄️': {},
            '🎇': {
                '⏩': '🔥', // Transition vers Hadéen
            },
        },
        // 🧫 = biosphère marine (gate CLAW, cf. calculations_albedo.js §Couplage DMS-CCN).
        // ⚫ Corps noir : pas d'océan, pas d'atmosphère, pas de vie → gate = 0 (tautologie).
        '🧫': 0.0,
        // 🌊🏭 = facteur pompe océanique CO₂ (Henry × Urey). 0 = désactivée (pas de mer liquide).
        // Réf : calculations_co2.js v1.2.0. Corps noir : pas d'atmosphère, pas de Henry possible.
        '🌊🏭': 0.0
    },
    {// Hadéen
        '📅': '🔥', // Hadéen — début, juste après impact formant la Lune (ordre 100–1000 ans)
        '▶': 4510e6, // v-2026-09-24 : vraie date — impact géant ~4,51 Ga (était 4.5e9)
        '◀': 4031e6, // v-2026-09-24 : vraie date — base de l'Archéen, ICS 2023 (était 4.0e9)
        '🧲🔬': 1.7,//596,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        // 🌡️🌕 : CONDITION INITIALE de l'intérieur (geology/interieur.js) — l'histoire thermique commence au ▶ de
        //   l'époque qui la porte (une seule). Après l'impact géant la surface EST l'océan de magma : 2300–2800 °C
        //   (Sleep, Zahnle & Neuhoff 2001, PNAS 98:3666) → milieu, 2550 °C. Le flux n'est plus posé (il était de
        //   2 MW/m², sans source) : tant que l'intérieur est fondu, il vaut OLR − solaire absorbé à cette T.
        '🌡️🌕': 2823.15,
        '📐': 6371, // [km] rayon FROID de référence (à T₀ de l'intérieur, aujourd'hui) ; le rayon courant 📜📐 en est tiré
        //   par la température de l'intérieur (geology/interieur.js, rayonKm) — 7008 km et −120 km/clic sont retirés.
        '🍎': 9.8, // Gravité en m/s²
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 1.0,  // Mer de l'époque (❔ posée avant 540 Ma) : tout le globe est bassin, à sec tant que l'eau est au-dessus de son point critique
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de continents stables)
            '🍰🗻🌍': 0.0, // Terres basses (0% - pas de continents)
            '🍰🗻🧊': CALOTTES_SANS
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        // [v1.4.82] T MOYENNE HADÉEN = GRANDEUR SANS SENS PHYSIQUE (ne pas revenir dessus) :
        //   surface = océan de magma, corps noir très brillant, rayonnement dominé par le flux géothermique (🧲🌕) ;
        //   une « T moyenne » de 2000–2500 °C dans la littérature n'est pas contraignante. Le bench la dépasse (~2650 °C)
        //   quand la composition suit la littérature : accepté, la T chute très vite ensuite par rayonnement (tics 💫).
        //   Priorité donnée à la COMPOSITION (grille CO₂ / H₂O vapeur), pas à la T.
        // [v1.4.82] CO₂ 5e17 (545 ppm) → 3.5e20 kg ≈ 70 bar ≈ 270 000 ppm mol (milieu grille [100k,500k]).
        //   Sleep, Zahnle & Neuhoff 2001 PNAS 98:3666 : 40–210 bar CO₂ après l'impact lunaire ; Zahnle et al. 2010 CSH Persp. Biol. 2:a004895.
        '⚖️🏭': 3.5e20, // co2_kg
        '⚖️🐄': 2.369e16, // v-2026-09-23 (était 5.0e15) : CH₄ ≈ 55 ppm air sec = milieu de [10,100] ‖ avant : ch4_kg (~1000 ppm)
        '⚖️💧': EAU_ACCRETEE_KG, // h2o_kg = l'eau apportée par les ☄️ de ⚫ = un océan (Matsui & Abe 1986 ; Zahnle et al. 2010) ;
        //   v1.5.3 : 6e20 → 1,4e21 (6e20 visait 15 % mol de vapeur, grille [10,20], sans source) ; ☄️ ajoute ensuite.
        '⚖️🫁': 0, // o2_kg
        // ⚖️✈ : 0 — le modèle sort cette époque à ~2650 °C. L'acide sulfurique ne condense pas :
        //   il n'y a ni gouttelette d'eau ni aérosol sulfaté à cette température. Le soufre est
        //   entièrement en phase gazeuse. Énoncé physique, pas une mesure. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 0,
        '⚖️💨': 5.29495e20,
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        magma_coverage: 1.0, // Spécifique Hadéen - TODO: trouver logo combo
        volcanoFactor: 10.0, // Spécifique Hadéen - TODO: trouver logo combo
        // Événements interactifs
        // Hadéen (▶ 4,51 Ga → ◀ 4,031 Ga). Gaz fixes ; l'intérieur refroidit par bilan d'énergie (geology/interieur.js).
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 0.001 }, { '🕰': '☄️', '🔺⏳': 0.1, '🔺⚖️💧☄️': 1.0e20 }, { '🕰': '☄️', '🔺⏳': 100, '🔺⚖️💧☄️': 1.0e20 }, { '🕰': '💫', '🔺⏳': 378.899 }],
            // v-2026-10-12 : pas croissants (1 ka, 100 ka, 100 Ma, puis le complément jusqu'à ◀ = 4,031 Ga) — l'océan de
            //   magma et sa couverture de vapeur durent de 1 à quelques Ma (Lebrun et al. 2013, JGR Planets 118:1155 ;
            //   Hamano et al. 2013, Nature 497:607) : avec un pas de 100 Ma, tout tenait dans le premier clic.
            //   ☄️ : eau apportée par les impacts pendant le « late veneer » (4,5 → 4,4 Ga), au 2ᵉ et au 3ᵉ clic.
            '💫': {
                '🔺🌡️💫': 0,  // v-2026-09-24 : était −300 K/tic, un refroidissement PRESCRIT ; le refroidissement sort du bilan d'énergie
            },
            '☄️': {}   // eau portée par chaque entrée de 🕰.order (🔺⚖️💧☄️ : 1e20 kg, ~7 % de l'eau initiale)
        },
        // 🧫 = biosphère marine (gate CLAW, cf. calculations_albedo.js §Couplage DMS-CCN).
        // 🔥 Hadéen : océan de magma à ~2500 K, pas de vie → pas de DMS → gate = 0.
        '🧫': 0.0,
        // 🌊🏭 : pompe CO₂→océan = 0. T_surf ~2500 K → pas d'eau liquide, Henry physiquement impossible.
        '🌊🏭': 0.0
    },
    {// Archéen
        '📅': '🦠', // Archéen — début (4 Ga) = Archéen précoce
        '▶': 4031e6, // v-2026-09-24 : vraie date — base de l'Archéen, ICS 2023 (était 4.0e9)
        '◀': 2.5e9,
        //
        // --- FOURCHETTES TOLÉRABLES (bench / litt. synthèse) — DUPLICATA de la ligne CSV « Archéen » dans la GRILLE du haut de ce fichier ---
        // Repère litt. Archéen : window.BENCH_LIT_BY_EPOCH_ID['🦠'] ci-dessous + bloc commentaire GRILLE dans ce fichier.
        //   T °C surface   : [5, 25]      — tempéré froid/modéré à ~4 Ga ; hypothèse chaude >30°C gardée R&D.
        //   CO₂ ppm          : [50000, 150000]
        //   CH₄ ppm          : [1000, 10000]
        //   H₂O vap. mol %   : [0.5, 3.0]
        //   Albédo effectif 🪩 : [0.20, 0.30] (colonne CSV « Albedo », pas une clé TIMELINE séparée)
        //
        '🧲🔬': 0.01,  // Précision stricte (tol ~0.4 W/m²) pour stabilité anim même époque
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        // ⚾ OBLIQUITÉ ε — plages acceptables (cf. commentaire global '⚾' en bas de fichier) :
        //   [22°, 24.5°] Terre moderne ; [0°, 60°] Terre sans Lune (Laskar 1993) ; [45°, 70°] Williams 1993.
        //   Facteur sin(ε)/sin(23.44°) : 23.44→1.00  35→1.44  45→1.78  54→2.04  60→2.18  70→2.36  90→2.51.
        //   Pourquoi pas ! → tester 54° (seuil Williams basse-lat.), 35° (intermédiaire), 0° (pas de saison).
        '⚾': 45.0, // ε Archéen = 45° (choix conservateur Williams 1993 : 45–70° sans Snowball global). amp saisonnière × 1.78.
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.85, // Mer de l'époque (❔ posée avant 540 Ma, la PaleoDEM s'arrête là) : moins de continents qu'aujourd'hui
            '🍰🗻🏔': 0.00, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15, // Terres basses (15% - premiers continents)
            '🍰🗻🧊': CALOTTES_SANS
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Simulation parameters - Quantités en kg. Recalib post-fix solaire 80% (272 W/m² vs ancien 320 W/m²)
        // Faint Young Sun Paradox : soleil ~74% à 4 Ga → CO₂+CH₄ élevés requis pour maintenir ~288 K.
        // ✅ CO₂ : 1.5e18 kg → ~0.19 bar CO₂ partiel (~8.7% molaire, ~87 000 ppm).
        //    Sleep & Zahnle 2001 (JGR) : 0.2–10 bar early Archean ✓
        //    Charnay et al. 2013 (GRL) : 0.1–0.5 bar requis pour eau liquide avec soleil faible ✓
        //    Charnay et al. 2020 (Space Sci. Rev.) : CO₂ 10–2500× PAL consensus ✓
        //    Krissansen-Totton et al. 2018 (Sci. Adv.) : ~0.1 bar à 4 Ga (cycle C-Si) ✓
        //    NB : contraintes paléosols (Rye 1995, Driese 2011) ← late Archean (< 3 Ga) seulement, pas applicables ici.
        // ✅ CH₄ : 3.0e16 kg → ~4 780 ppm molaire (~0.19% atm).
        //    Haqq-Misra et al. 2008 (Astrobiology) : jusqu'à 10 000 ppm, brume si CH₄/CO₂ > 0.1 ✓
        //    Pavlov et al. 2000 : 100–1 000 ppm ; Charnay 2020 : 100–17 000 ppm ✓
        // ✅ Ratio CH₄/CO₂ = 3.0e16 / 1.5e18 = 0.02 — sous le seuil de brume organique (0.1, Haqq-Misra 2008) ✓
        // ⚖️ = masses totales (kg). Grille CSV « Archéen » : CO₂ ppm [50k,150k] ; CH₄ [1k,10k] ; H₂O vapeur atm [0.5,3.0]% mol.
        // ppm calculés par demo/epoch_bench_format.js (fmtConvAtmSnapshot) : ppm_molaire = mass_frac × (M_air / M_gaz) × 1e6.
        // Repère rapide pour ajuster les masses (N₂ ≈ 9.918e18 dominant) : CO₂ 150k mol ppm ⇒ ≈ 2.75e18 kg ; CO₂ 50k mol ppm ⇒ ≈ 0.80e18 kg ; CH₄ 10k mol ppm ⇒ ≈ 6.7e16 kg ; CH₄ 1k mol ppm ⇒ ≈ 6.5e15 kg.
        //
        // ─── ESSAI MOYENNE DES FOURCHETTES (v1.4.40) ───────────────────────────
        // Valeurs au milieu des bornes 🔒 ci-dessous pour tester le banc sans extrêmes.
        // ─── v1.4.50 (2026-04-25) : CO₂ et CH₄ poussés au max CSV bench pour lutter contre faint sun 74% ───
        // Récupère ~+2 W/m² de forçage GES manquant vs branche froide. Pression N₂ inchangée (1.71 bar)
        // — si snowball persiste, prochaine étape : N₂ → 1.0e19 (2 bar, Som 2012 bornes hautes).
        '⚖️🏭': 7.1705e+17, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 7.396e17 // v-2026-10-13 : ×0,4 avec N₂ (même ≈ 100 000 ppm). Avant : 1.849e18, v-2026-09-23 (était 2.6e18) : CO₂ ≈ 100 000 ppm air sec = milieu de [50k,150k] ‖ avant : co2_kg — [v1.4.81] ~143k ppm (bench affichait 152k > max 150k). Était 2.75e18.
        '⚖️🐄': 1.4376e+16, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 1.4828e16 // v-2026-10-13 : ×0,4 avec N₂ (même ≈ 5 500 ppm). Avant : 3.707e16, v-2026-09-23 (était 6.3e16) : CH₄ ≈ 5 500 ppm air sec = milieu de [1k,10k] ‖ avant : ch4_kg — [v1.4.81] ~9 500 ppm (bench affichait 10 150 > max 10k). Était 6.7e16. CH₄/CO₂=0.024<0.1.
        '⚖️💧': 1.65e21, // h2o_kg hydrosphère — moyenne plage 🔒 [0.8e21, 2.5e21] ; vapeur atm reste dynamique.
        '⚖️🫁': 2.0e15, // o2_kg — traces pré-GOE [0, 1e16] ; ×0,4 avec N₂ (v-2026-10-13, était 5.0e15).
        // ⚖️💨 v-2026-10-13 : 1,0e19 (2,2 atm, le MAXIMUM, posé « pour lutter contre le faint sun », v1.4.50 / v1.4.76) →
        // 4,0e18, la borne basse de la fourchette déclarée ci-dessous (≈ 1 PAL). MESURES : N₂ 0,5–1,1 bar vers 3,0–3,5 Ga
        // (Marty et al. 2013, Science 342:101, inclusions fluides) ; pression totale 0,23 ± 0,23 bar vers 2,7 Ga (Som et al.
        // 2016, Nature Geosci. 9:448, vésicules). Aucune ne soutient 2,2 atm. CO₂, CH₄, O₂ réduits dans le même rapport : leurs
        // fractions molaires (le milieu des fourchettes de la config) ne changent pas. Sonde : 🦠 46,0 → 10,2 °C ([5 ; 25]).
        '⚖️💨': N2_1PAL_KG,
        // ⚖️✈ : 4,0e8 kg = FOND NATUREL PRÉINDUSTRIEL, faute de contrainte propre à l'Archéen.
        //   ⚠️ NON CONTRAINT, et il faut le dire : aucune charge de sulfate atmosphérique archéenne
        //   n'est publiée. Deux effets de signe opposé, tous deux non quantifiés, encadrent la vraie
        //   valeur : (i) le dégazage volcanique était vraisemblablement plus fort (Terre plus chaude) ;
        //   (ii) l'atmosphère anoxique route une part importante du soufre vers l'aérosol S8 plutôt
        //   que vers le sulfate — c'est la condition même du fractionnement indépendant de la masse
        //   observé dans les sédiments (Farquhar et al. 2000 Science 289:756 ; Pavlov & Kasting 2002
        //   Astrobiology 2:27). Le fond préindustriel est donc un repère, pas une mesure.
        //   L'ancienne valeur, 5,0e14 kg, valait 500 000 × la charge moderne mesurée : elle ne venait
        //   d'aucune source. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 4.0e8,
        // 🔒 Bornes hystérésis Archéen — cf. schéma commentaire global "🔒 SCHÉMA BORNES HYSTÉRÉSIS" + CSV « Archéen » [50k,150k]ppm CO₂, [1k,10k]ppm CH₄.
        //    Refs : Sleep & Zahnle 2001 (CO₂ 0.2–10 bar), Haqq-Misra 2008 (CH₄ ≤10k ppm ; haze si CH₄/CO₂ > 0.1), Som 2012/2016 (N₂ paléo 0.7–2.2 atm), Marty 2013 (N₂ Archéen ≈1–2× PAL).
        '🔒': {
            '⚖️🏭': { min: 0.80e18, max: 2.75e18, cools: 'min' }, // CO₂ : CSV [50k,150k] mol ppm
            '⚖️🐄': { min: 6.5e15,  max: 6.7e16,  cools: 'min' }, // CH₄ : CSV [1k,10k] mol ppm
            '⚖️💨': { min: 3.878e18,  max: 1.0e19,  cools: 'min' }, // N₂  : 1 PAL (3,878e18, 2026-10-13) → 2.5× PAL (Som 2012)
            // sulfates : bornes = dispersion PUBLIÉE des charges préindustrielles entre modèles,
            //   0,10–0,58 Tg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5, colonne « previous works »).
            //   C'est la seule fourchette honnête ici : on ne sait pas, et cette plage dit de combien.
            '⚖️✈': { min: 1.0e8,   max: 5.8e8,   cools: 'max' },
            '⚖️🫁': { min: 0,       max: 1.0e16,  cools: 'min' }, // O₂ : pré-GOE (traces seulement)
            '⚖️💧': { min: 0.8e21,  max: 2.5e21,  cools: 'min' }, // H₂O hydrosphère : ~57% → ~179% PAL
        },
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 531 }, { '🕰': '💫', '🔺⏳': 300 }, { '🕰': '💫', '🔺⏳': 700 }],
            // Clics à 3 500 Ma, 3 200 Ma, puis 2 500 Ma (passage à 🪸) — durée totale 1 531 Ma. Calés sur les bords de la
            //   fenêtre océan archéen 3,5 → 3,2 Ga (Blake et al. 2010, courbe de la littérature) : la montée et la descente.
            // v-2026-09-24 : 1531/3 → 2 clics à 1/3 et 2/3 de la rampe. ⚠️ Avec 511, le 2ᵉ clic atteignait 100 % de la rampe
            //   (CO₂ de fin d'Archéen ≈ 5 800 ppm) et la Terre GELAIT à 3,0 Ga.
            '💫': {
                '🔺🌡️💫': 0,     // pas de dérive T° par tic (équilibre ~288 K)
            },
            // Barycentre (📿💫+📿☄️)/maxTics → interpolation des params entre ▶ et ◀
            // 🔒 ☀️ n'est PAS dans 🔀 : luminosité calculée par Gough (1981) depuis la date, pas interpolée linéairement
            '🔀': ['⚖️'],   // v-2026-09-24 : '🌕' retiré — le flux intérieur sort du bilan d'énergie (geology/interieur.js)
            '◀': {
                '⚖️': { '⚖️💧': 1.3e21, '⚖️🏭': 3.5474e+16, '⚖️🐄': 2.1511e+14, '⚖️🫁': 0, '⚖️✈': 4.0e8, '⚖️💨': 3.8780e+18 }
            }
        },
        // 🧫 : 🦠 Archéen — océans anoxiques dominés par cyanobactéries procaryotes
        // (pas d'eucaryotes marins, DMSP producteurs quasi-absents). Knoll 2003, Falkowski 2004.
        // Tapis microbiens côtiers → flux DMS minimal (~5% moderne).
        '🧫': 0.05,
        // 🌊🏭 : v1.4.76 → 0 (était 0.05). Coupe le seed océan CO₂ Henry (⚖️🌊🏭 = co2OceanRatioRef × ⚖️🏭).
        // Le ratio 50 est MODERNE (océan tamponné pH 8, Sarmiento & Gruber 2006) ; à 0.19 bar pCO₂ archéen
        // l'océan est acide, DIC/pCO₂ ≪ 50 → le réservoir 50× (1.4e20 kg) est un puits fantôme qui aspire le
        // CO₂ atmosphérique dès que T baisse → amplificateur snowball. C-cycle archéen = tamponné carbonates
        // sédimentaires (Sleep & Zahnle 2001), pas DIC océan. Peu de continents → altération silicatée faible
        // (Lee et al. 2018, Nature 553:188). 0 = Urey/Henry éteints, comme l'assume calculations_flux.js (🦠 ⇒ ⚖️🌊🏭=0).
        '🌊🏭': 0
    },
    {// Protérozoïque
        '📅': '🪸', // Protérozoïque (multicellularité, eucaryotes, GOE)
        '▶': 2.5e9,
        '◀': 720e6, // v-2026-09-24 : vraie date — base du Cryogénien, ICS 2023 (était 750e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.75, // Mer de l'époque (❔ posée avant 540 Ma, la PaleoDEM s'arrête là) : continents en formation
            '🍰🗻🏔': 0.08, // Hautes terres (8% - relief modéré)
            '🍰🗻🌍': 0.17, // Terres basses (17% - continents émergents)
            '🍰🗻🧊': CALOTTES_SANS
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Lit. Proterozoic: CO2 10–200× actuel; paléosols ~2.2 Ga: 8000–9000 ppm. CH4 100–300 ppm.
        // v1.4.50 (2026-04-25): bump CO₂ 5e16→9.47e16 (6216→12000 ppm) et CH₄ 3e14→7.2e14 (102→250 ppm)
        // pour récupérer ~+13 W/m² de forçage GES manquant à 12.5°C (branche chaude).
        // Toujours dans CSV bench [5000,20000] CO₂ et [50,500] CH₄ (litt. paléosols + Wordsworth/Pierrehumbert 2013).
        // 🔧 CO₂ de 🪸 : pCO₂ = 79,4 mbar, moyenne géométrique de Kanzaki & Murakami 2015 (GCA 159:190, paléosols, 45–140 mbar à 2,46 Ga)
        //   — dans la mesure (9–140 mbar avec Sheldon 2006), mais CHOISIE en regardant le résultat : au milieu du recouvrement des deux
        //   méthodes (57 mbar), le clic 🦠 → 🪸 (700 Ma) laisse les calottes polaires atteindre leur équilibre et bascule en boule de neige
        //   (seuil vers 65 mbar) ; le modèle n'a pas encore le dégazage qui ferait sortir d'une boule de neige (CO₂ imposé par la config).
        '⚖️🏭': 6.2430e+17, // pCO₂ = 79,4 mbar (🔧 ci-dessus) ; avant 4.4818e+17 (57 mbar)
        '⚖️🐄': 5.4957e+14, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 7.20e14  // ch4_kg — 250 ppm (était 3.0e14 = 102 ppm)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🫁': 1.5e16,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5).
        //   Post-GOE l'atmosphère est oxydante : le SO₂ volcanique finit bien en sulfate, contrairement
        //   à l'Archéen. Aucune charge protérozoïque n'est publiée pour autant — faiblement contraint.
        //   L'ancienne valeur était 0, ce qui affirmait une absence de sulfate que rien ne soutient.
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 600 }, { '🕰': '💫', '🔺⏳': 600 }, { '🕰': '💫', '🔺⏳': 600 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 590 → 600 (2 clics (rampe 50 %, 100 % vers 1a), le 3ᵉ passe — 1780 Ma)
            // v-2026-07-14 : bary ACTIVÉ. 🔀 sans ◀ → cible auto = racine de l'époque suivante (hyst 1a).
            // Rampe les masses ⚖️ le long de 2500→750 Ma : CO₂ 12000→53 ppm, CH₄ 250→7 ppm, O₂ 1.5e16→5e15, etc.
            // Avant : pas de 🔀 → masses figées (saut brutal à −750 Ma constaté en visu). Cf. moteur compute.js même date.
            '🔀': ['⚖️'],
        },
        // Ancien 🕰 (sans bary) : { '💫': { '🔺🌡️💫': 0 } }
        // 🧫 : 🪸 Protérozoïque — post-GOE, premiers eucaryotes marins (acritarches ~1.8 Ga),
        // algues rouges ~1.2 Ga. Diversification lente, encore dominés par procaryotes.
        // Flux DMS ~10% moderne (avant radiation des phytoplanctons modernes).
        '🧫': 0.1,
        // 🌊🏭 : pompe Urey lente pré-Rodinia. Supercontinent Rodinia assemblé (~1.1 Ga → ~800 Ma)
        // limite la surface continentale exposée aux intempéries tropicales (Goddéris et al. 2017 Earth-Sci Rev).
        // Pas encore de plantes vasculaires → weathering par acides organiques très limité (Lenton & Watson 2011).
        '🌊🏭': 0.15
    },
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // ÉPOQUES D'HYSTÉRÉSIS — À LIRE AVANT DE TOUCHER À hysteresis 1a / ⛄ / hysteresis 1b / hysteresis 2
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // (écrit le 2026-09-23 à la demande de l'utilisateur : une session IA les a prises pour des
    //  époques ordinaires, a visé le milieu de leurs fourchettes, et a cassé la sortie du Snowball.)
    //
    // CE QU'ELLES SONT. Une époque d'hystérésis n'est PAS une période géologique à reproduire. C'est
    // une CONFIG FRONTIÈRE : l'ensemble des conditions (CO₂, voile, albédo de la glace…) où le climat
    // bascule « facilement » d'un état à l'autre — chaud → boule de neige (1a → ⛄), boule de neige →
    // chaud (⛄ → 1b), serre → calotte antarctique (hysteresis 2 → 🏔). Leurs dates sont
    // approximatives, leurs fourchettes aussi : elles situent l'épisode, elles ne sont pas des cibles.
    //
    // LE CRYOGÉNIEN A DEUX GLACIATIONS (v-2026-09-24, vraies dates Hoffman et al. 2017) :
    //   🪸 → ☃ 1a (720–717, frontière d'entrée) → 🗻 → ⛄ Sturtien (717–659) → 🌋 → 🌦 1b (659–639 : sortie
    //   Sturtienne, puis ses 💫 font glisser le CO₂ vers la frontière d'entrée du Marinoen) → 🏂 Marinoen
    //   (639–635,2) → 🌋 → ⛈ 1c (635,2–538,8, sortie Marinoenne) → 🪼. Avant, UN seul Snowball fusionnait les
    //   deux (1a 750 → ⛄ 720–690 → 1b « Sortie Marinoen » 690), faute visible sur l'onglet Histoire.
    //   Quatre frontières : entrée Sturtien (CO₂ de 1a = ⛄), sortie Sturtien (1b), entrée Marinoen (CO₂
    //   de 🏂, cible de la rampe de 1b), sortie Marinoen (1c).
    //
    // CE QUI LES TESTE. Pas leur graine. Recliquer une époque dans la frise la réinitialise depuis
    // 🌡️🧮 : c'est artificiel. Le vrai processus, c'est le TICTIME : il garde la T° COURANTE (l'état
    // où l'on arrive, glace comprise), change les conditions, et calcule. Une hystérésis se juge donc
    // sur le PASSAGE, joué depuis l'époque précédente :
    //     1a  : arriver chaud, puis 🗻 (voile SW)            → ⛄ doit s'effondrer (T ≪ 0, glace ~1)
    //     1b  : partir de ⛄ gelé, puis 💫 🌋 (CO₂, glace sale) → 1b doit SORTIR (T > 0, glace → 0)
    //     2   : partir de 🐊, puis ⛰                         → 🏔 : entrée en glaciation
    // Le banc headless le fait : CO2/scripts/bench_headless/bench19.js, section « passages ».
    // La T° de 1b depuis sa graine (≈ 28–29 °C) ne veut RIEN dire — seule compte la sortie depuis ⛄.
    //
    // CE QU'ON RÈGLE. Chaque config d'hystérésis se place JUSTE DE L'AUTRE CÔTÉ du seuil qu'elle doit
    // franchir, par une MESURE et non par la fourchette : une dichotomie scriptée (banc headless) trouve
    // le seuil, et la config se pose DESSUS — le dernier (ou premier) CO₂ qui bascule. Le but est de
    // MONTRER la bascule : quasi pas de changement de ppm, une T° radicalement différente.
    // TOUJOURS MESURER SUR LA CHAÎNE DE CLICS (bench19.js, « passages ») : frise sur l'époque d'avant, puis
    // chaque tictime comme l'interface (🔀 fait glisser les masses pendant les 💫 !). Un chemin raccourci
    // (graine → époque suivante) donne un autre seuil : au vrai clic, ⛄ tombait à 0 °C au lieu de −60.
    // Et régler les graines 🌡️🧮 sur la convergence AU CLIC : la frise doit donner la même chose, plus vite.
    // Mesuré le 2026-09-24 (bary 62 %, vraies dates), sur la chaîne de clics, dichotomie 0,05 % :
    //   entrée Sturtien  1a = ⛄ : 72,1 ppm → 1a −0,01 °C (glace 0,09) · 0,1 ppm de moins → −62,2 °C ;
    //                              puis 🗻 → ⛄ −65,0 °C ; 💫 (voile retiré) → ⛄ reste à −62,5 °C
    //   sortie Sturtien  1b     : 10 262,5 ppm → +29,5 °C · 10 259,9 ppm → −8,0 °C (glace 0,27)
    //   entrée Marinoen  🏂     : 1b fait glisser son CO₂ jusqu'à 2 556,7 ppm (23,5 °C) ; le voile de 🏂 fait
    //                              basculer à −61,9 °C · 2 557,3 ppm → il ne bascule plus (−0,01 °C)
    //                              ⚠️ 1b SEUL ne gèle jamais, même à 0 ppm : sa glace SALE (🌫️❄️ 0,48) empêche
    //                              l'emballement glace-albédo — c'est le voile qui fait la bascule.
    //   sortie Marinoen  1c     : 9 797,1 ppm → +29,6 °C · 9 794,6 ppm → −8,0 °C (glace 0,27)
    // Chaîne : 🪸 10,3 → 1a 0,0 → ⛄ −65,0 → −62,5 → 1b 29,5 → 27,5 → 23,5 → 🏂 −61,9 → −59,4 → 1c 29,6 → 🪼 21,0 °C
    // Entre −60 °C et −8 °C (glace partielle), on est SUR le basculement, pas « à côté » : c'est un
    // seuil pas encore franchi, pas une erreur de physique.
    //   hysteresis 2 : la bascule attendue est la NAISSANCE de la calotte antarctique (Oi-1 ; DeConto & Pollard
    //   2003, seuil ~2,8 × CO₂ préindustriel ≈ 780 ppm, 560–920 selon les modèles, Gasson et al. 2014). Elle
    //   vient de physics/calottes.js : une calotte naît quand le bilan d'une petite calotte posée sur les
    //   hautes terres polaires (socle sans glace, data/paleogeo_zones.js) devient positif. Seuil à mesurer
    //   sur la chaîne (sonde de naissance) avant d'y poser la config. Chantier ouvert, pas un réglage.
    //
    // CE QU'IL NE FAUT PAS FAIRE. Déplacer leur CO₂ ou leur graine pour viser le milieu d'une
    // fourchette, ou pour rapprocher T fin de T init : ces deux critères n'ont pas de sens ici.
    // Et ⛄ partage le CO₂ de 1a (« même planète, deux états ») : bouger l'un sans l'autre détruit la
    // bistabilité que 1a → ⛄ doit démontrer.
    // Tout changement de physique (barycentre, O₂, vapeur…) peut déplacer les seuils : les REMESURER.
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // hysteresis 1a = Pré–Boule de neige / entrée Sturtienne (750–720 Ma) : CO₂ élevé (⚖️🏭) ; graine T pour convergence AVANT le scan hystérésis.
    // L’instant hystérésis = quand on baisse un peu le CO₂ et que T s’effondre — c’est l’algo (scie_) qui le cherche.
    {//hysteresis 1a (entrée Sturtienne — bascule albédo↓)
        '📅': 'hysteresis 1a', // id stable (renommé v1.4.0 ; logo affichage ☃)
        hidden: true, // interne (non cliquable / non affiché dans la frise)
        '▶': 720e6, // v-2026-09-24 : vraie date — base du Cryogénien, ICS 2023 (était 750e6)
        '◀': 717e6, // v-2026-09-24 : vraie date — début du Sturtien (Hoffman et al. 2017) (était 720e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17, '🍰🗻🧊': CALOTTES_SANS },
        // CO₂ pré-snowball branche chaude. 1.0e16 kg = 1280 ppm (conv. via ⚖️💨=5.125e18 kg, M_air/M_CO2=0.659).
        // Fourchette lit. pré-Sturtienne warm branch : 1000-3000 ppm (Hoffman & Schrag 2002 ; Bao et al. 2008 ; Hoffman 2017).
        // NB : le seuil de bifurcation snowball est bien plus bas (100-300 ppm GCM — Voigt 2010, Hörner 2022) ;
        // c'est la recherche hystérésis (scie_hysteresis_search.js) qui descend jusque-là, pas ce baseline.
        // v1.4.75 : 8.594e14 (106 ppm) restauré = 🔒 max, domaine nominal du BaryAdapter (le 4.801e14
        // résiduel R&D mettait x0=65 ppm SOUS le seuil littérature 100-300 ppm — introuvable en scan descendant).
        // Si le 1er pas part déjà en branche froide (FAILED "déjà sur branche") : monter vers 1.0e16 (1280 ppm,
        // littérature warm branch) ET baisser HYSTERESIS.scanFailRatio 0.1 → ~0.02 (plancher 26 ppm).
        // v-2026-07-14 : abaissé à 53 ppm pour la DÉMO BISTABILITÉ 1a↔⛄ au seuil.
        //   C*≈51,5 ppm mesuré par le scan (_logs/hyst.txt : 52,0 ppm→−0,55 °C chaud / 51,1 ppm→−61 °C snowball, 1 ppm d'écart).
        //   Init posé ~1,5 ppm au-dessus du seuil (converge propre, évite l'oscillation du saddle-node exact).
        //   ⛄ aligné sur la même valeur → même CO₂, deux branches sélectionnées par la graine 🌡️🧮.
        //   Anciennes valeurs (calcul hyst TRÈS sensible — ne pas perdre) : 8.594e+14 (106 ppm, =🔒max) ; 4.801e14 (65 ppm R&D).
        // v-2026-07-14b : le seuil warm de la visu dépend des AUTRES gaz (mesuré : le scan tenait warm à 52 ppm
        //   parce que la bary co-variait CH₄→35 ppm / O₂→1.5e16 ; à 7 ppm CH₄ la visu tombait en snowball à 53 ppm).
        //   → on aligne hyst 1a sur le vecteur warm du scan, mais CH₄ borné à 30 ppm (haut litt.) + CO₂ 52→55 ppm en compensation.
        // v-2026-09-15 : 5.2e15 kg ≈ 640 ppm (fourchette lit. pré-Sturtienne [500,2000], grille CSV).
        //   Carte Δ(T) (albedo v1.2.64, nuages 2 couches) : branche chaude ≈ 7 °C à 640 ppm (504→5.4, 800→8.0) ; test hyst
        //   CO₂ seul → bascule snowball à ≈ 92–93 ppm (Brunetti 2023 ESD 14:533 : 95±5 ppm à 700 Ma ; Feulner & Kienert 2014 :
        //   100–130 ppm ; AOGCM 20–700 ppm).
        //   Déclencheur visu = voile sulfate Franklin (−10 W/m², Macdonald & Wordsworth 2017 GRL 44:1938) posé par ⛄ :
        //   à 640 ppm il supprime la branche chaude (marge ≈ 2.5 W/m²) → snowball ; le voile retombé, ⛄ RESTE gelé au
        //   MÊME CO₂ = hystérésis. Anciennes valeurs : 8.1e14 (100 ppm, « surfusion » artefact) ; 4.451e14 (55).
        // FRONTIÈRE DE 1a (encadré « ÉPOQUES D'HYSTÉRÉSIS ») — mesurée le 2026-09-23, bary 62 %, sur la CHAÎNE
        // DE CLICS : frise 🪸, 💫 ×2 (🔀 fait glisser les masses de 🪸 vers celles de 1a), 💫 → 1a. Dichotomie 0,2 % :
        //   86,1 ppm air sec → 1a = 0,00 °C (glace 0,09)   ·   86,0 ppm → 1a = −62,2 °C (glace 0,90)
        // 1a se pose sur le dernier CO₂ où il NE s'effondre PAS encore ; le voile de ⛄ (🗻) le fait tomber à
        // −64,9 °C, et ⛄ reste gelé (−62,3) quand son 💫 retire le voile. MÊME valeur que ⛄.
        // ⚠️ 86 ppm est très en dessous des estimations du Sturtien (centaines à milliers de ppm) : c'est la
        // SENSIBILITÉ du modèle qui place la bascule là (trop faible, cf. REPRISE.md), pas un choix.
        // Une 1re tentative (3 419 ppm) avait été mesurée sur un chemin RACCOURCI (graine de 🪸 → 1a sans les
        // clics 💫) : au vrai clic, ⛄ tombait à 0 °C au lieu de −60. Toujours mesurer sur la chaîne de clics.
        // v-2026-10-14 : STURTIEN_CO2_KG (en tête de fichier). Avant : 4,4085e14 = 72,1 ppm, frontière du 2026-09-24 hors fourchette.
        '⚖️🏭': STURTIEN_CO2_KG,
        // CH₄ : Fourchette lit. Néoprotérozoïque 1-30 ppm (Kasting 2005 ; Olson 2016 ; Daines & Lenton 2016).
        //   v-2026-07-14b : 8.57e13 = 30 ppm (haut de fourchette, serre nécessaire pour tenir la branche chaude à ~55 ppm CO₂).
        '⚖️🐄': STURTIEN_CH4_KG, // v-2026-10-14 (avant 6,48e13 = 29,1 ppm)
        // H₂O : océan Protérozoïque ≈ 1.2-1.4e21 kg (Pope et al. 2012). Inchangé.
        '⚖️💧': 1.2e21,
        // O₂ : v-2026-07-14b 1.5e16 (aligné vecteur warm scan = serre/nuages suppl. ; 1.3 % PAL, borne haute Sturtien).
        //   (Lyons et al. 2014 ; Planavsky et al. 2014 ; Sperling 2015). Ancien : 5.0e15 (0.4 % PAL).
        '⚖️🫁': 1.5e16,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5).
        //   La part réellement vue par la loi sulfate → CCN dépend de 🧫 (calculations_albedo v1.2.65) :
        //   ici 🧫 = 0,05 (plancton dilué, pré-glaciation) → 4,0e8 × (0,29 + 0,71 × 0,05) = 1,30e8 kg.
        //   ⚠️ Le voile sulfaté de la LIP Franklin n'est PAS ici : il est porté séparément par
        //   ⛄.🔺🍰⚽ = 0,05 (Macdonald & Wordsworth 2017). Pas de double comptage.
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        // 1a = branche CHAUDE pré-Sturtienne (≈ 7 °C). Le bouton volcan 🗻 est un DÉCLENCHEUR ERGONOMIQUE : son tooltip (desc du logo,
        // "Volcan — voile atmosphérique") annonce à l'utilisateur que le voile arrive, et le clic fait avancer la
        // frise vers ⛄ (Plein Snowball) où le voile s'applique RÉELLEMENT (clé racine 🔺🍰⚽=0.05 de ⛄, v-2026-09-15).
        // ⚠️ Choix ASSUMÉ, pas cohérent en interne : le voile n'est PAS dans ce bouton (pas de 🔺🍰⚽ ici), il est
        // dans la config de ⛄. C'est voulu pour la lisibilité utilisateur (« je clique le volcan → snowball »).
        // v-2026-07-16.
        '🕰': {
            'order': [{ '🕰': '🗻', '🔺⏳': 3 }],
            '🗻': {}, // v-2026-09-24 : 🔺⏳ 30 → 3 (durée 720→717)
        },
        // 🧫 : ☃ Entrée Sturtienne (750 Ma) — pré-glaciation, plancton marin dilué,
        // faibles émissions DMS (même ordre que ⛄). ~5% moderne.
        '🧫': 0.05,
        // 🌊🏭 : pompe Urey ACCÉLÉRÉE. Rodinia break-up (800-720 Ma) expose de vastes surfaces
        // continentales tropicales aux intempéries (Godderis et al. 2003, Donnadieu et al. 2004 Nature).
        // Franklin LIP (717 Ma) : basaltes frais très altérables (Macdonald 2010 Science 327:1241).
        // Pierrehumbert 2004 "deglaciation problem" : drawdown CO₂ × 3-5 vs moderne.
        '🌊🏭': 0.5,
        // 🔒 Segment contractuel hyst 1a ↔ fiche ⛄ (scie_hysteresis_bary v1.0.0) : min = extrémité froide
        // (⛄ 524–560), max = branche chaude 1a (lignes ci-dessus). createBaryAdapter uniquement si 🔒.⚖️🏭.
        // Sans ce bloc, seul CO₂ varie au scan/dicho — CH₄ etc. restent en baseline 1a, ce qui mélange états
        // incompatibles près du seuil (T saute ±60 °C à ⚖️🏭 presque identique).
        '🔒': {
            // NB v-2026-07-14 : init ⚖️🏭 abaissé à 4.289e14 (53 ppm) < min de ce segment.
            // Segment 🔒 volontairement NON re-centré : bornes = littérature. La concentration
            // effective au seuil se module par les autres gaz (O₂…), pas en baissant ces bornes.
            // Le scan n'est pas clampé par 🔒 (il extrapole), donc pas de blocage — juste à savoir.
            '⚖️🏭': { min: 7.923e+14, max: 8.594e+14, cools: 'min' },
            '⚖️🐄': { min: 1.0e+14, max: 2.0e+13, cools: 'min' },
            '⚖️💨': { min: 3.878e18, max: 3.878e18, cools: 'min' }, // N₂ = 1 PAL (2026-10-13)
            '⚖️🫁': { min: 1.5e+16, max: 5.0e+15, cools: 'min' },
            '⚖️💧': { min: 1.2e+21, max: 1.2e+21, cools: 'min' },
            // sulfates : segment DÉGÉNÉRÉ depuis v1.4.90 — 1a et ⛄ portent la même charge de fond,
            //   4,0e8 kg. Ce qui les sépare n'est plus la masse mais 🧫 (1a = 0,05 aussi… voir NB),
            //   appliqué dans calculations_albedo.js. min = max : la bary n'a plus rien à interpoler
            //   ici, et c'est l'énoncé correct — il n'y a pas d'incertitude de masse sur ce segment.
            '⚖️✈': { min: 4.0e+8, max: 4.0e+8, cools: 'min' }
        }
    },
    // ⛄ = Plein Snowball (720–690 Ma) : glaciation globale Néoprotérozoïque (Sturtien ~717 Ma)
    // Réfs : Hoffman et al. 1998 (Science), Pierrehumbert 2011, Hoffman & Schrag 2002
    // v1.4.61 : 🌡️🧮 + ⚖️🏭 = pas dicho **chaud** hyst1a (ex. ligne journal 📿=4, phase=dicho, T_conv≈−2,9 °C,
    // 4,621e14 kg) : c’est l’amorce qui sert à voir la bifurcation, pas l’attractif à −60 °C (📿=8) ni 210 K.
    // v1.4.60 (210 K + 4,58e14) = erreur sémantique. Masses d’appoint : [REPRO] @ ce pas (SYNC bouton ⛄).
    // Remplacement entrée TIMELINE Plein Snowball (⛄) — généré depuis l’état courant (DATA).
// Époque active (📜.🗿) au moment de l’export : hysteresis 1a.
// Coller dans API_BILAN/config/configTimeline.js : remplacer l'objet entier { '📅': '⛄', … } par ce bloc, puis recharger.

{//"⛄"
    "📅": "⛄",
    // Voile : racine 🔺🍰⚽ = impulsion à 📿💫===0 (compute) ; 🕰.💫.🍰⚽ = valeur 📜🔺🍰⚽ après chaque clic 💫 (events).
    // v-2026-09-15 : voile sulfate Franklin LIP (Macdonald & Wordsworth 2017 GRL 44:1938 : −10 à −12 W/m² pour
    // 500 Mt SO₂/an, suffisant à 3000 ppm) : 0.05 d’obstruction SW ≈ −10 W/m² sur la branche chaude. À 640 ppm il
    // supprime toute racine chaude (Δmax ≈ −2.5 W/m²) → bascule ; retiré au 1er 💫 (🕰.💫.🍰⚽=0) → ⛄ reste gelé = hystérésis. (ex-0.02)
    "🔺🍰⚽": 0.05,
    "▶": 717e6, // v-2026-09-24 : vraie date — début du Sturtien (Hoffman 2017) (était 72e7)
    "◀": 659e6, // v-2026-09-24 : vraie date — fin du Sturtien, U-Pb 659,3–658,5 (Hoffman 2017) (était 69e7)
    "🧲🔬": 0.01,
    "🧲🔬⌊": 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
    "📐": 6371,
    "🍎": 9.81,
    "⚾": window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
    "🗻": {
        "🍰🗻🌊": 0.75,
        "🍰🗻🏔": 0.08,
        "🍰🗻🌍": 0.17,
        "🍰🗻🧊": CALOTTES_SNOWBALL
    },
    // MÊMES CO₂ et CH₄ que hysteresis 1a : STURTIEN_* en tête de fichier (avant : copies, restées à l'ancien N₂).
    "⚖️🏭": STURTIEN_CO2_KG,
    "⚖️🐄": STURTIEN_CH4_KG,
    "⚖️💧": 1.2e21,
    "⚖️🫁": 15000000000000000,
    // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5),
    //   comme toutes les époques sans contrainte propre. La banquise globale coupe la source DMS —
    //   mais ce n'est plus écrit ici : la dérivation est passée dans calculations_albedo.js v1.2.65,
    //   où 🧫 (= 0,05 pour ⛄) module la part DMS du soufre avec le partage mesuré volcanique/DMS
    //   0,29/0,71 (Carn et al. 2017 Sci. Rep. 7:44095 + Lana et al. 2011 GBC 25:GB1004).
    //   Masse effective vue par la loi sulfate → CCN : 4,0e8 × (0,29 + 0,71 × 0,05) = 1,30e8 kg.
    //   Elle y vaut pour les 19 époques au lieu d'être codée en dur sur celle-ci.
    //   ⚠️ Le voile Franklin qui déclenche la bascule reste ailleurs : 🔺🍰⚽ = 0,05, ci-dessus.
    "⚖️✈": 400000000,
    "⚖️💨": N2_1PAL_KG, // v-2026-10-14 : 1 PAL (était 5,133e18, oublié le 2026-10-13 dans les blocs JSON)
    "🔒": {
        "⚖️🏭": {
            "min": 792300000000000,
            "max": 859400000000000,
            "cools": "min"
        },
        "⚖️🐄": {
            "min": 100000000000000,
            "max": 20000000000000,
            "cools": "min"
        },
        "⚖️💨": {
            "min": 5132968982000000000,
            "max": 5142979000000000000,
            "cools": "min"
        },
        "⚖️🫁": {
            "min": 15000000000000000,
            "max": 5000000000000000,
            "cools": "min"
        },
        "⚖️💧": {
            "min": 1.2e+21,
            "max": 1.2e+21,
            "cools": "min"
        },
        "⚖️✈": {
            "min": 400000000,
            "max": 400000000,
            "cools": "min"
        }
    },
    // v-2026-09-15 : 💫 (+10 Ma) = le voile retombe (🍰⚽=0), la planète reste gelée au même CO₂ (hystérésis visible) ;
    // puis 🌋 (+20 Ma) = volcanisme/poussière de sortie → époque suivante hysteresis 1b (CO₂ + glace sale dans SA config).
    "🕰": {
        // 🫠 Pré-sortie sturtienne : un tictime à 660 Ma, 1 Ma avant la sortie (659), pour que la courbe porte l'état gelé jusqu'à la bascule.
        //   Un tictime peut porter '📅' (logo, nom dans CHARS_DESC) comme une époque : l'Histoire l'affiche, pas la frise.
        'order': [{ '🕰': '💫', '🔺⏳': 29 }, { '🕰': '💫', '🔺⏳': 28, '📅': '🫠' }, { '🕰': '🌋', '🔺⏳': 1 }],
        "💫": {
            "🔺🌡️💫": 0,
            "🍰⚽": 0
        },
        "🌋": {} // v-2026-09-24 : 🔺⏳ 20 → 29 (seconde moitié → 1b)
    },
    "🧫": 0.05,
    "🌊🏭": 0.5
},
    // hysteresis 1b = Sortie Sturtienne (659–639 Ma, v-2026-09-24 ; était « Sortie Marinoen » 690–600) : déglaciation
    // brutale, hyper-greenhouse, puis l'interglaciaire cryogénien pendant lequel ses 💫 ramènent le CO₂ vers l'entrée
    // du Marinoen (🏂). La sortie Marinoenne proprement dite est hysteresis 1c.
    // Branche chaude post-Snowball, le scan hystérésis cherche le seuil de sortie (CO₂↑ → saut T).
    {//hysteresis 1b (sortie Sturtienne — hyst ↑)
        '📅': 'hysteresis 1b', // id stable (logo affichage 🌦 depuis le 2026-09-24 ; ⛈ passe à 1c)
        hidden: true,
        '▶': 659e6, // v-2026-09-24 : vraie date — fin du Sturtien (Hoffman 2017) (était 690e6)
        '◀': 639e6, // v-2026-09-24 : vraie date — début du Marinoen, ≥ 639,0 (Hoffman 2017) (était 600e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.10, '🍰🗻🌍': 0.15, '🍰🗻🧊': CALOTTES_SANS },
        // Hyper-greenhouse post-Marinoen : CO₂ très élevé = cause de la déglaciation (déstabilise la branche froide).
        // v1.4.77 : 7.0e17 kg ≈ 80 000 ppm mol (0.08 bar) — cœur fourchette sortie Marinoen 0.01–0.12 bar
        // (Pierrehumbert 2004, Hoffman 2017). Était 2.75e16 (3500 ppm) : incohérent avec ce commentaire + trop
        // bas pour déglacer (anim restait à −57 °C) et ne tenait même pas la branche chaude au bench.
        // v-2026-09-15 : 8.2e16 kg ≈ 9 900 ppm (0.01 bar, haut de la grille CSV Sortie Marinoen [2000,10000]).
        //   Sortie par glace SALE (clé 🌫️❄️ ci-dessous) : Abbot & Pierrehumbert 2010 (JGR 115:D03104) / Abbot & Halevy
        //   2010 → la poussière abaisse le CO₂ de déglaciation à 0.01–0.1 bar. Carte Δ(T) : à α_glace 0.48 la branche
        //   froide disparaît entre ~4 800 et ~9 300 ppm ; à 10 000 ppm seule la branche chaude existe (≈ 30 °C, bench
        //   [20,50]). Sans poussière la branche froide tient jusqu'à >14 % (GCM : >0.1–0.2 bar, Hu 2011). Anciens :
        //   1.31e18 (15 %, zone d'artefact d'inversion OLR >16 %), 7.0e17 (8 %).
        // FRONTIÈRE DE SORTIE (encadré « ÉPOQUES D'HYSTÉRÉSIS ») : ce CO₂ n'est PAS une cible de littérature,
        // c'est le seuil de sortie du Snowball, mesuré le 2026-09-23 (bary 62 %) sur la CHAÎNE DE CLICS
        // (🪸 … 1a → 🗻 ⛄ −64,9 → 💫 ⛄ −62,3 → 🌋 1b), dichotomie à 0,05 % :
        //                                   10 867,7 ppm air sec → −8,0 °C (glace 27 %, coincé)
        //                                   10 870,5 ppm air sec → +29,5 °C (glace 0)
        // 3 ppm, 37 °C : on se pose sur le PREMIER CO₂ qui sort. À REMESURER si la physique change.
        '⚖️🏭': 6.611924e+17, // v-2026-10-14 : FRONTIÈRE F2 (seuils_hysteresis.js v2.1, chaîne depuis ⚫, frise = clic, CO₂ et CH₄ ensemble dans [10 000 ; 100 000] / [10 ; 100] ppm) : 97 583 ppm → 1b sort (frise 36,7 °C, chaîne 36,8 °C) ; 97 561 ppm → reste englacé (−7,4 °C). Avant 6,3398e16 (10 263 ppm, ne sortait plus)
        //   (v1.2.64) pour 🪩🍰❄️ et 🪩🍰🧊 ; époques sans clé = glace propre. Plage mudball ~0.4–0.5.
        '🌫️❄️': 0.48,
        // ⚖️🏭🔺 = facteur de départ du scan hystérésis (<1 en scan positif) : 0.25 → ~2 500 ppm, sur la branche froide
        //   sale (≈ −9 °C) ; le scan CO₂↑ croise la sortie vers ~0.5–0.9 % puis dicho.
        '⚖️🏭🔺': 0.25,
        // ⚖️🏭🔝 = plafond du scan CO₂ hystérésis (kg). v-2026-07-16. C'est le régime de déglaciation 1b
        // (poussière volcanique) qui impose ce plafond, PAS un cas particulier codé dans le scan. Au-delà de
        // ~16 % CO₂ (~1.31e18 kg) l'OLR du modèle s'INVERSE (ajouter du CO₂ refroidit — artefact CO₂-gaz-majeur,
        // cf. probeOLRvsCO2AtFixedT) : le scan positif y plongeait et se sabotait (« FAILED » ~51 % = pas
        // physique). On plafonne au MINIMUM d'OLR ; le levier CO₂ y est de toute façon épuisé, la fin de la
        // déglaciation Marinoen passe par l'albédo (mudball). Le scan lit ce champ génériquement (clampX).
        '⚖️🏭🔝': 1.31e18,
        '⚖️🐄': 2.409799e+14, // v-2026-10-14 : 97,58 ppm, avec la frontière F2 (CO₂ ci-dessus). Avant 1,2379e14
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e16,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            // 🌨 Pré-snowball marinoen : tictime 0,1 Ma avant 🏂 (le 3ᵉ dépassait d'1 Ma, 638 au lieu de 639).
            'order': [{ '🕰': '💫', '🔺⏳': 7 }, { '🕰': '💫', '🔺⏳': 7 }, { '🕰': '💫', '🔺⏳': 5.9, '📅': '🌨' }, { '🕰': '💫', '🔺⏳': 0.1 }],
            // v-2026-09-24 : 🔀 fait glisser les masses de 1b vers celles de 🏂 pendant les 💫 (comme 🪸 → 1a) :
            //   sortie du Sturtien (CO₂ au seuil de sortie), puis retombée du CO₂ jusqu'à la frontière d'entrée
            //   du Marinoen. Le 3ᵉ 💫 (21 Ma ≥ 20) passe dans 🏂.
            '🔀': ['⚖️'],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 90 → 7 (2 clics (rampe vers 🏂), le 3ᵉ passe — 20 Ma)
        },
        // 🧫 : ⛈ Sortie Marinoen (690→600 Ma) — dégel post-snowball, hyper-greenhouse,
        // recolonisation marine progressive. Retour modéré du plancton. ~10% moderne.
        '🧫': 0.1,
        // 🌊🏭 : v1.4.77 → 0 (était 2.0). La pompe Urey/cap-carbonates est un drawdown POST-déglaciation ;
        // active pendant la tentative de fonte (T froide → Henry ↑ → CO₂ atm→océan) elle aspire le CO₂ censé
        // CAUSER la fonte = à l'envers, empêche la déglaciation en anim. Coupée pour laisser 1b déglacer.
        // Le vrai drawdown cap-carbonates (80 k → ~1 k ppm sur ~10 Ma ; Higgins & Schrag 2003, Hoffman 2017)
        // = raffinement ultérieur : réactiver la pompe seulement APRÈS déglaciation (gate T>0 ou nb de tics).
        '🌊🏭': 0
    },
{//"🏂" Snowball Marinoen — v-2026-09-24, 2ᵉ glaciation globale du Cryogénien (copie de ⛄, même logique)
    "📅": "🏂", // Snowball Marinoen (639 → 635,2 Ma, Hoffman et al. 2017)
    // Voile : racine 🔺🍰⚽ = impulsion à 📿💫===0 (compute) ; 🕰.💫.🍰⚽ = valeur 📜🔺🍰⚽ après chaque clic 💫 (events).
    // v-2026-09-15 : voile sulfate Franklin LIP (Macdonald & Wordsworth 2017 GRL 44:1938 : −10 à −12 W/m² pour
    // 500 Mt SO₂/an, suffisant à 3000 ppm) : 0.05 d’obstruction SW ≈ −10 W/m² sur la branche chaude. À 640 ppm il
    // supprime toute racine chaude (Δmax ≈ −2.5 W/m²) → bascule ; retiré au 1er 💫 (🕰.💫.🍰⚽=0) → ⛄ reste gelé = hystérésis. (ex-0.02)
    "🔺🍰⚽": 0.05,
    "▶": 639e6, // début du Marinoen, ≥ 639,0 Ma (Hoffman 2017)
    "◀": 635.2e6, // fin du Marinoen, U-Pb 635,2 Ma (Hoffman 2017)
    "🧲🔬": 0.01,
    "🧲🔬⌊": 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
    "📐": 6371,
    "🍎": 9.81,
    "⚾": window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
    "🗻": {
        "🍰🗻🌊": 0.75,
        "🍰🗻🏔": 0.08,
        "🍰🗻🌍": 0.17,
        "🍰🗻🧊": CALOTTES_SNOWBALL
    },
    // CO₂ = FRONTIÈRE D'ENTRÉE du Marinoen (1b fait glisser ses masses vers celles-ci pendant ses 💫) —
    //   à MESURER sur la chaîne de clics (encadré « ÉPOQUES D'HYSTÉRÉSIS »). Valeur provisoire = ⛄.
    "⚖️🏭": 1.56713e+16, // v-2026-10-14 : N₂ 1 PAL, ppm inchangés (2 556,7 ppm, frontière mesurée le 2026-09-24) ; avant 2.0725589e16
    "⚖️🐄": 1.1259e+13, // v-2026-10-14 : N₂ 1 PAL, CH₄ ≈ 5 ppm inchangé ; avant 1.489e13
    "⚖️💧": 1.2e21,
    "⚖️🫁": 15000000000000000,
    // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5),
    //   comme toutes les époques sans contrainte propre. La banquise globale coupe la source DMS —
    //   mais ce n'est plus écrit ici : la dérivation est passée dans calculations_albedo.js v1.2.65,
    //   où 🧫 (= 0,05 pour ⛄) module la part DMS du soufre avec le partage mesuré volcanique/DMS
    //   0,29/0,71 (Carn et al. 2017 Sci. Rep. 7:44095 + Lana et al. 2011 GBC 25:GB1004).
    //   Masse effective vue par la loi sulfate → CCN : 4,0e8 × (0,29 + 0,71 × 0,05) = 1,30e8 kg.
    //   Elle y vaut pour les 19 époques au lieu d'être codée en dur sur celle-ci.
    //   ⚠️ Le voile Franklin qui déclenche la bascule reste ailleurs : 🔺🍰⚽ = 0,05, ci-dessus.
    "⚖️✈": 400000000,
    "⚖️💨": N2_1PAL_KG, // v-2026-10-14 : 1 PAL (était 5,133e18, oublié le 2026-10-13 dans les blocs JSON)
    "🔒": {
        "⚖️🏭": {
            "min": 792300000000000,
            "max": 859400000000000,
            "cools": "min"
        },
        "⚖️🐄": {
            "min": 100000000000000,
            "max": 20000000000000,
            "cools": "min"
        },
        "⚖️💨": {
            "min": 5132968982000000000,
            "max": 5142979000000000000,
            "cools": "min"
        },
        "⚖️🫁": {
            "min": 15000000000000000,
            "max": 5000000000000000,
            "cools": "min"
        },
        "⚖️💧": {
            "min": 1.2e+21,
            "max": 1.2e+21,
            "cools": "min"
        },
        "⚖️✈": {
            "min": 400000000,
            "max": 400000000,
            "cools": "min"
        }
    },
    // v-2026-09-15 : 💫 (+10 Ma) = le voile retombe (🍰⚽=0), la planète reste gelée au même CO₂ (hystérésis visible) ;
    // puis 🌋 (+20 Ma) = volcanisme/poussière de sortie → époque suivante hysteresis 1b (CO₂ + glace sale dans SA config).
    "🕰": {
        // 🫗 Pré-sortie marinoen : tictime 0,1 Ma avant la sortie (1c).
        'order': [{ '🕰': '💫', '🔺⏳': 1.9 }, { '🕰': '💫', '🔺⏳': 1.8, '📅': '🫗' }, { '🕰': '🌋', '🔺⏳': 0.1 }],
        "💫": {
            "🔺🌡️💫": 0,
            "🍰⚽": 0
        },
        "🌋": {} // seconde moitié → hysteresis 1c (sortie Marinoenne)
    },
    "🧫": 0.05,
    "🌊🏭": 0.5
},
{//hysteresis 1c (sortie Marinoenne — hyst ↑) — v-2026-09-24, copie de 1b pour la 2ᵉ glaciation
        '📅': 'hysteresis 1c', // sortie Marinoenne (logo affichage ⛈)
        hidden: true,
        '▶': 635.2e6, // fin du Marinoen, U-Pb 635,2 Ma (Hoffman 2017)
        '◀': 538.8e6, // base du Cambrien, ICS 2023 (l'Édiacarien)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.10, '🍰🗻🌍': 0.15, '🍰🗻🧊': CALOTTES_SANS },
        // Hyper-greenhouse post-Marinoen : CO₂ très élevé = cause de la déglaciation (déstabilise la branche froide).
        // v1.4.77 : 7.0e17 kg ≈ 80 000 ppm mol (0.08 bar) — cœur fourchette sortie Marinoen 0.01–0.12 bar
        // (Pierrehumbert 2004, Hoffman 2017). Était 2.75e16 (3500 ppm) : incohérent avec ce commentaire + trop
        // bas pour déglacer (anim restait à −57 °C) et ne tenait même pas la branche chaude au bench.
        // v-2026-09-15 : 8.2e16 kg ≈ 9 900 ppm (0.01 bar, haut de la grille CSV Sortie Marinoen [2000,10000]).
        //   Sortie par glace SALE (clé 🌫️❄️ ci-dessous) : Abbot & Pierrehumbert 2010 (JGR 115:D03104) / Abbot & Halevy
        //   2010 → la poussière abaisse le CO₂ de déglaciation à 0.01–0.1 bar. Carte Δ(T) : à α_glace 0.48 la branche
        //   froide disparaît entre ~4 800 et ~9 300 ppm ; à 10 000 ppm seule la branche chaude existe (≈ 30 °C, bench
        //   [20,50]). Sans poussière la branche froide tient jusqu'à >14 % (GCM : >0.1–0.2 bar, Hu 2011). Anciens :
        //   1.31e18 (15 %, zone d'artefact d'inversion OLR >16 %), 7.0e17 (8 %).
        // FRONTIÈRE DE SORTIE (encadré « ÉPOQUES D'HYSTÉRÉSIS ») : ce CO₂ n'est PAS une cible de littérature,
        // c'est le seuil de sortie du Snowball, mesuré le 2026-09-23 (bary 62 %) sur la CHAÎNE DE CLICS
        // (🪸 … 1a → 🗻 ⛄ −64,9 → 💫 ⛄ −62,3 → 🌋 1b), dichotomie à 0,05 % :
        //                                   10 867,7 ppm air sec → −8,0 °C (glace 27 %, coincé)
        //                                   10 870,5 ppm air sec → +29,5 °C (glace 0)
        // 3 ppm, 37 °C : on se pose sur le PREMIER CO₂ qui sort. À REMESURER si la physique change.
        '⚖️🏭': 6.467038e+17, // v-2026-10-14 : FRONTIÈRE F4 (seuils_hysteresis.js v2, frise = clic, CO₂ et CH₄ ensemble dans [10 000 ; 100 000] / [10 ; 100] ppm) : 95 649 ppm → 1c sort (frise 37,1 °C, chaîne 36,7 °C), 🪼 chaud ; 95 627 ppm → reste englacé (−7,1 °C). Avant 6,0494e16 (9 797 ppm)
        //   (v1.2.64) pour 🪩🍰❄️ et 🪩🍰🧊 ; époques sans clé = glace propre. Plage mudball ~0.4–0.5.
        '🌫️❄️': 0.48,
        // ⚖️🏭🔺 = facteur de départ du scan hystérésis (<1 en scan positif) : 0.25 → ~2 500 ppm, sur la branche froide
        //   sale (≈ −9 °C) ; le scan CO₂↑ croise la sortie vers ~0.5–0.9 % puis dicho.
        '⚖️🏭🔺': 0.25,
        // ⚖️🏭🔝 = plafond du scan CO₂ hystérésis (kg). v-2026-07-16. C'est le régime de déglaciation 1b
        // (poussière volcanique) qui impose ce plafond, PAS un cas particulier codé dans le scan. Au-delà de
        // ~16 % CO₂ (~1.31e18 kg) l'OLR du modèle s'INVERSE (ajouter du CO₂ refroidit — artefact CO₂-gaz-majeur,
        // cf. probeOLRvsCO2AtFixedT) : le scan positif y plongeait et se sabotait (« FAILED » ~51 % = pas
        // physique). On plafonne au MINIMUM d'OLR ; le levier CO₂ y est de toute façon épuisé, la fin de la
        // déglaciation Marinoen passe par l'albédo (mudball). Le scan lit ce champ génériquement (clampX).
        '⚖️🏭🔝': 1.31e18,
        '⚖️🐄': 2.356994e+14, // v-2026-10-14 : 95,65 ppm, avec la frontière F4 (CO₂ ci-dessus). Avant 1,2379e14
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e16,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 96.4 }],
            '💫': { '🔺🌡️💫': 0 }, // durée 635,2 → 538,8
        },
        // 🧫 : ⛈ Sortie Marinoen (690→600 Ma) — dégel post-snowball, hyper-greenhouse,
        // recolonisation marine progressive. Retour modéré du plancton. ~10% moderne.
        '🧫': 0.1,
        // 🌊🏭 : v1.4.77 → 0 (était 2.0). La pompe Urey/cap-carbonates est un drawdown POST-déglaciation ;
        // active pendant la tentative de fonte (T froide → Henry ↑ → CO₂ atm→océan) elle aspire le CO₂ censé
        // CAUSER la fonte = à l'envers, empêche la déglaciation en anim. Coupée pour laisser 1b déglacer.
        // Le vrai drawdown cap-carbonates (80 k → ~1 k ppm sur ~10 Ma ; Higgins & Schrag 2003, Hoffman 2017)
        // = raffinement ultérieur : réactiver la pompe seulement APRÈS déglaciation (gate T>0 ou nb de tics).
        '🌊🏭': 0
    },
    // Paléozoïque scindé (v1.4.0) : 🪼 marin 600→420 + 🍄 terrestre 420→280 + 💀 P/T 280→250.
    // Ordre chronologique : … Protérozoïque → ☃/⛄/⛈ Snowball → 🪼 → 🍄 → 💀 → Mésozoïque …
    {// Paléozoïque marin 🪼
        '📅': '🪼', // Paléozoïque marin (600–420 Ma) — explosion cambrienne, Hirnantienne
        '▶': 538.8e6, // v-2026-09-24 : vraie date — base du Cambrien, ICS 2023 (était 600e6)
        '◀': 419.2e6, // v-2026-09-24 : vraie date — base du Dévonien, ICS 2023 (était 420e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.78, '🍰🗻🏔': 0.06, '🍰🗻🌍': 0.16, '🍰🗻🧊': CALOTTES_SANS },
        '⚖️🏭': 1.1494e+16, // ppm inchangés avec l'O₂ sourcé (2026-10-13) ; // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 1.38e16 // co2_kg — léger − (bench 🪼)
        '⚖️🐄': 1.7042e+12, // CH₄ ≈ 0,697 ppm d'air sec, celui de 🚂 (Law Dome 1750) : règle des époques sans CH₄ mesuré ni simulé (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.3e21,
        '⚖️🫁': 4.3900e+17, // O₂ = 9 % de l'air (milieu de [2 ; 16] % : 2–11 % Cambrien–Ordovicien moyen (Krause et al. 2018, Nat. Commun. 9:4081, GEOCARBSULFOR + proxys), > 16 % dès le Silurien (Glasspool & Gastaldo 2024)) ; avant 1.5e17 (13 % PAL, sans source, masqué par le N₂ « reste »)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 119.6 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 180 → 119.6 (durée 538,8→419,2)
        },
        // 🧫 : 🪼 Paléozoïque marin (600→420 Ma) — explosion cambrienne, radiation des
        // phytoplanctons modernes (acritarches puis dinoflagellés). Boucle CLAW progressivement
        // active. Falkowski 2004 Science 305:354. ~50% moderne.
        '🧫': 0.5,
        // 🌊🏭 : pompe Urey standard Phanérozoïque — Walker, Hays & Kasting 1981 JGR 86:9776
        // (feedback silicate weathering → CO₂ atm stable). Pas encore de plantes vasculaires.
        '🌊🏭': 1.0
    },
    {// Paléozoïque terrestre 🍄
        '📅': '🍄', // Paléozoïque terrestre (420–280 Ma) — Prototaxites, forêts Dévonien/Carbonifère, Karoo
        '▶': 419.2e6, // v-2026-09-24 : vraie date — base du Dévonien, ICS 2023 (était 420e6)
        '◀': 252.2e6, // v-2026-09-24 : vraie date — début de la crise P/T (trapps de Sibérie) (était 280e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.07, '🍰🗻🌍': 0.18, '🍰🗻🧊': CALOTTES_SANS },
        '⚖️🏭': 1.1351e+16, // CO₂ ≈ 1 451 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages Pragian/Lochkovian et Pridoli (comme la courbe cyan)
        '⚖️🐄': 1.0307e+13, // CH₄ ≈ 3,614 ppm d'air sec : Éocène 4 × CO₂ de Beerling et al. 2011, l'expérience la plus proche (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.2511e+18, // O₂ = 22 % de l'air (milieu de [14,5 ; 30] % : minimum dévonien 14,5 %, pic permo-carbonifère 25–30 % (Krause et al. 2018 ; Glasspool & Scott 2010, Nat. Geosci. 3:627, charbon de bois)) ; avant 2.0e17 (17 % PAL, sans source, masqué par le N₂ « reste »)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        // 4 clics de 41,75 Ma : 419,2 → 377,45 → 335,7 → 293,95 → 252,2 Ma (💀).
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 41.75 }, { '🕰': '💫', '🔺⏳': 41.75 }, { '🕰': '💫', '🔺⏳': 41.75 }, { '🕰': '💫', '🔺⏳': 41.75 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 35 → 41.75 (3 états 🔁 + transition — 167 Ma)
            // 🔁 États imposés par tic (index = 📿💫 − 1 ; au-delà, dernier état maintenu), même mécanisme que 🦣 : le CO₂ de PhanDA
            // à la date où le clic arrive (CO2_50 interpolé en ln entre les âges moyens des étages qui l'encadrent, comme la courbe cyan)
            // et le CH₄ de la règle de l'encadré « CH₄ DES ÉPOQUES » à ce CO₂ ; masses avec l'air de 🍄. Le drawdown du
            // Dévonien-Carbonifère (racines profondes, altération des silicates, enfouissement du charbon : Berner & Kothavala 2001 ;
            // Algeo & Scheckler 1998 ; Montañez et al. 2007 pour la LPIA) est dans PhanDA, qui assimile ces proxys.
            '🔁': [
                { '⚖️🏭': 7.7403e15, '⚖️🐄': 9.7760e12 },  // 377,45 Ma : 990 ppm (Frasnien / Givétien) / 3,43 ppm
                { '⚖️🏭': 3.3645e15, '⚖️🐄': 7.3507e12 },  // 335,70 Ma : 430 ppm (Serpukhovien / Viséen) / 2,58 ppm
                { '⚖️🏭': 3.8275e15, '⚖️🐄': 7.3511e12 }   // 293,95 Ma : 490 ppm (Sakmarien / Assélien) / 2,58 ppm
            ],
        },
        // 🧫 : 🍄 Paléozoïque terrestre (420→280 Ma) — Dévonien/Carbonifère,
        // diversification marine avancée, coccolithophoridés pas encore installés.
        // Flux DMS élevé mais pas encore saturé. ~70% moderne.
        '🧫': 0.7,
        // 🌊🏭 : pompe Urey AMPLIFIÉE. Apparition forêts Dévonien/Carbonifère → racines profondes +
        // acides humiques accélèrent weathering silicaté (Berner & Kothavala 2001 GEOCARB III,
        // Am J Sci 301:182). Algeo & Scheckler 1998 GSA Today 8:1 : "Devonian land plant crisis".
        // Enfouissement carbone organique (Karoo, Gondwana) → chute CO₂ → glaciation fin-Carbonifère.
        '🌊🏭': 1.3
    },
    {// Limite P/T 💀 (extinction massive, pas hystérésis)
        '📅': '💀', // Limite P/T (280–250 Ma) — Trapps sibériens, anoxie, hyperthermie
        '▶': 252.2e6, // v-2026-09-24 : vraie date — début de la crise P/T (était 280e6)
        '◀': 251.902e6, // v-2026-09-24 : vraie date — limite Permien/Trias, ICS 2023 (était 250e6)
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': { '🍰🗻🌊': 0.72, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.20, '🍰🗻🧊': CALOTTES_SANS },
        '⚖️🏭': 6.0746e+15, // CO₂ ≈ 757 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages Induen et Changhsingien (comme la courbe cyan)
        '⚖️🐄': 8.8613e+12, // CH₄ ≈ 3,03 ppm d'air sec : Éocène de Beerling et al. 2011, interpolé en ln CO₂ (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.35e21,
        '⚖️🫁': 1.4007e+18, // O₂ = 24 % de l'air (milieu de [18 ; 30] % : > 18 % après le pic permo-carbonifère, ~30 % au Trias (GEOCARBSULFOR), 18,5 % (inertinites) — Krause et al. 2018) ; avant 1.5e17 (13 % PAL, sans source, masqué par le N₂ « reste »)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — MALGRÉ les Trapps sibériens.
        //   Un panache sulfaté de LIP a une durée de vie de quelques années ; cette fiche couvre
        //   280→250 Ma. Moyenner un pic décennal sur 30 Ma redonne le fond, à la précision près.
        //   Le refroidissement volcanique, s'il doit apparaître, est un ÉVÉNEMENT (comme ⛄.🔺🍰⚽),
        //   pas une charge de fond. Voir l'encadré « MASSES DE SULFATE » en tête de fichier.
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 0.3 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 30 → 0.3 (durée de la crise)
        },
        // 🧫 : 💀 Limite P/T (280→250 Ma) — extinction massive marine (~96% espèces),
        // anoxie océanique (Canfield state), effondrement du plancton. ~30% moderne
        // (suppression partielle de CLAW pendant la crise).
        '🧫': 0.3,
        // 🌊🏭 : pompe Urey ATTÉNUÉE. Trapps sibériens (~252 Ma, 4e6 km³ basaltes) injectent
        // ~1e19 kg CO₂ + SO₂ en ~1 Ma → saturation acide océanique, effondrement carbonates
        // (Payne & Clapham 2012 Annu Rev Earth Planet Sci 40:89). Anoxie + forêts éradiquées
        // → weathering biotique chute (Algeo 2011). Hyperthermie entretenue ~5 Ma.
        '🌊🏭': 0.7
    },
    {// Mésozoïque 🦕
        '📅': '🦕', // Mésozoïque (252–66 Ma) — texture fonds/00200Ma.png (ancien 250Ma), événement 50 Ma
        // 🦕 Mésozoïque : serre chaude, pas de calottes polaires
        '⛄': 0,
        '▶': 251.902e6, // v-2026-09-24 : vraie date — limite Permien/Trias, ICS 2023 (était 250e6)
        '◀': 66.0e6, // v-2026-09-24 : vraie date — limite K/Pg, ICS 2023 (était 66e6)
        '🧲🔬': 0.1,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20,
            '🍰🗻🧊': CALOTTES_SANS
        },
        '⚖️🏭': 5.9883e+15, // CO₂ ≈ 746 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages Induen et Changhsingien (comme la courbe cyan)
        '⚖️🐄': 8.7992e+12, // CH₄ ≈ 3,01 ppm d'air sec : Éocène de Beerling et al. 2011, interpolé en ln CO₂ (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.33e21,
        '⚖️🫁': 1.4011e+18, // O₂ = 24 % de l'air (milieu de [18 ; 30] % : > 18 % tout le Mésozoïque, ~30 % au Trias (GEOCARBSULFOR), 18,5 % (inertinites) — Krause et al. 2018 ; pic mi-Crétacé (Glasspool & Scott 2010)) ; avant 0 (0 % PAL, sans source, masqué par le N₂ « reste »)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 100 }, { '🕰': '🎇', '🔺⏳': 0 }], // v-2026-10-12 : 🎇 K-Pg ferme l'époque (⏩ 🦤) ; il n'était jamais proposé (ACTION_BY_DATE 66 → 💫)
            '💫': {
                '🔺🌡️💫': -2,
            }, // Événement 50 Ma
            '🎇': { '⏩': '🦤' }, // Big impact (K-Pg) → Cénozoïque
            // 🔁 État du 💫 (151,9 Ma, Jurassique supérieur) : 🧫 de 📱, la boucle CLAW moderne — dinoflagellés et coccolithophoridés
            // apparus au Trias supérieur, dinoflagellés rayonnés au Jurassique inférieur (Falkowski et al. 2004, Science 305:354).
            '🔁': [
                { get '🧫'() { return epoqueDe('📱')['🧫']; } }
            ]
        },
        // 🧫 : celle de la DATE de la ligne, 251,902 Ma — le lendemain de la crise P/T : celle de 💀, lue (🔧 ❔ la valeur de la crise
        // appliquée à son lendemain). Le phytoplancton eucaryote moderne ne monte qu'à partir du Trias moyen : dinoflagellés et
        // coccolithophoridés apparaissent au Trias supérieur, les dinoflagellés rayonnent au Jurassique inférieur, et l'anoxie dure
        // plusieurs Ma après la crise (Falkowski et al. 2004, Science 305:354) ; les écosystèmes marins se reconstruisent par étapes
        // (Chen & Benton 2012, Nat. Geosci. 5:375) : la boucle CLAW pleine est celle du Jurassique–Crétacé, pas de la base du Trias.
        // Le 💫 de 151,9 Ma porte la sienne (état 🔁 ci-dessus).
        get '🧫'() { return epoqueDe('💀')['🧫']; },
        // 🌊🏭 : pompe Urey standard — serre chaude stable, feedback silicate actif mais
        // géographie (Gondwana/Laurasia → Pangée) maintient CO₂ atm élevé ~2500 ppm (Berner 2001).
        '🌊🏭': 1.0
    },
    {// Cénozoïque 🦤
        '📅': '🦤', // Cénozoïque — Paléocène / début Éocène (66–50 Ma) ; limite K-Pg (~66 Ma), CO₂ modéré ~650 ppm
        '▶': 66.0e6, // v-2026-09-24 : vraie date — limite K/Pg, ICS 2023 (était 66e6)
        '◀': 56.0e6, // v-2026-09-24 : vraie date — PETM / base de l'Éocène, ICS 2023 (était 50e6)
        '⛄': 0,
        '🧲🔬': 0.1,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20,
            '🍰🗻🧊': CALOTTES_SANS
        },
        '⚖️🏭': 6.7699e+15, // CO₂ ≈ 877 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages Sélandien/Danien et Maastrichtien (comme la courbe cyan)
        '⚖️🐄': 9.1435e+12, // CH₄ ≈ 3,25 ppm d'air sec : Éocène de Beerling et al. 2011, interpolé en ln CO₂ (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 10 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 16 → 10 (durée 66→56)
        },
        // 🧫 : celle de la DATE de la ligne, 66,0 Ma — le lendemain de la crise K-Pg : celle de 💀, lue (🔧 ❔ la valeur de la crise
        // P/T appliquée au lendemain de K-Pg). Le nannoplancton calcaire (coccolithophoridés) y perd l'essentiel de sa diversité ;
        // ses survivants sont des espèces néritiques ou opportunistes (Bown 2005, Geology 33:653). 🐊 (56 Ma) a la boucle moderne.
        get '🧫'() { return epoqueDe('💀')['🧫']; },
        // 🌊🏭 : pompe Urey standard post-K-Pg. Refroidissement progressif → altération accrue
        // aux moyennes latitudes. Pas encore de collision Inde/Asie (début ~50 Ma).
        '🌊🏭': 1.0
    },
    {// Éocène 🐊
        '📅': '🐊', // Éocène (50–35 Ma), pic thermique / CO₂ élevé (ordre PETM) ; puis décroissance (altération silicates, Himalaya)
        '▶': 56.0e6, // v-2026-09-24 : vraie date — PETM / base de l'Éocène, ICS 2023 (était 50e6)
        '◀': 34.4e6, // v-2026-09-24 : vraie date — début de la transition Éocène-Oligocène (était 35e6)
        '⛄': 0,
        '🧲🔬': 0.1,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '⚾': window.OBLIQUITE_ACTUELLE_DEG, // ❔ obliquité de l'époque, hors de la solution La2004 : celle d'aujourd'hui, faute de reconstruction
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20,
            '🍰🗻🧊': CALOTTES_SANS
        },
        '⚖️🏭': 9.5868e+15, // CO₂ ≈ 1 241 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages PETM et Thanétien (comme la courbe cyan)
        // CH₄ : Beerling et al. 2011 (PNAS 108:9770, tableau 1), modèle du système Terre de l'Éocène précoce (55 Ma) avec ses zones
        //   humides et sa chimie : 3 614 ppb à 4 × CO₂ (1 120 ppm), l'expérience la plus proche du CO₂ de l'époque (1 241 ppm), 💻.
        '⚖️🐄': 1.0176e+13, // CH₄ ≈ 3,614 ppm d'air sec (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 21.6 }],
            '💫': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 15 → 21.6 (durée 56→34,4)
        },
        // 🧫 : 🐊 Éocène (50→35 Ma) — PETM, CLAW moderne.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey AMPLIFIÉE à partir de l'Éocène moyen. Collision Inde/Asie (~50 Ma)
        // + orogenèse himalayenne exposent basaltes frais du Deccan + silicates tibétains →
        // weathering accru (Raymo & Ruddiman 1992 Nature 359:117 "uplift-weathering hypothesis").
        // Controversé : GEOCARBSULF (Berner 2006) minimise l'effet ; Misra & Froelich 2012 confirme
        // via δ⁷Li marin. Compromis : légère amplification.
        '🌊🏭': 1.1
    },
    {// hysteresis 2 (Eocène–Oligocène ~35–33 Ma — bascule calotte Antarctique, Oi-1)
        '📅': 'hysteresis 2', // id stable (logo affichage 🐧 ; ex ⛰ prélude glaciaire)
        hidden: true, // même rendu frise que hysteresis 1 (epoch-text, pas epoch-btn)
        '▶': 34.4e6, // v-2026-09-24 : vraie date — début de l'EOT (était 35e6)
        '◀': 33.9e6, // v-2026-09-24 : vraie date — limite Éocène/Oligocène, ICS 2023 (était 33e6)
        '⛄': 0.02,
        '🧲🔬': 0.08,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20,
            '🍰🗻🧊': CALOTTES_SANS
        },
        '⚖️🏭': 5.0481e+15, // ≈ 654 ppm d'air sec, sous la fourchette PhanDA Priabonien [711 ; 907] : config frontière, à poser par la dichotomie de naissance de l'Antarctique
        '⚖️🐄': 7.9104e+12, // CH₄ ≈ 2,811 ppm d'air sec : la règle de 🏔 au CO₂ de la frontière (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '⛰', '🔺⏳': 0.5 }],
            '⛰': { '🔺🌡️💫': 0 }, // v-2026-09-24 : 🔺⏳ 2 → 0.5 (durée 34,4→33,9)
        },
        // 🧫 : 🐧 hysteresis 2 (Eocène–Oligocène, Oi-1 ~34 Ma) — bascule calotte Antarctique,
        // phytoplancton pleinement installé.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey amplifiée (Himalaya toujours actif + refroidissement = plus d'altération).
        // Zachos et al. 2001 Science 292:686 : chute CO₂ ~1000 → 600 ppm sur 35-33 Ma.
        '🌊🏭': 1.1
    },
    // Grande Coupure → Miocène/Pliocène (33–2 Ma) : calotte Antarctique stable, puis glace Nord vers 3 Ma
    {// 🏔 Grande Coupure / Miocène–Pliocène
        '📅': '🏔',
        // 🏔 Grande Coupure : calotte Antarctique (~8.5% surface) — première glaciation polaire moderne
        '⛄': 0.085,
        '▶': 33.9e6, // v-2026-09-24 : vraie date — limite Éocène/Oligocène, ICS 2023 (était 33e6)
        '◀': 2.58e6, // v-2026-09-24 : vraie date — base du Quaternaire, ICS 2023 (était 2e6)
        '🧲🔬': 0.05,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.16, '🍰🗻🌍': 0.15, '🍰🗻🧊': CALOTTES_OLIGOCENE },
        '⚖️🏭': 5.6531e+15, // CO₂ ≈ 732 ppm d'air sec : CO2_50 de PhanDA (Judd et al. 2024) interpolé en ln entre les âges moyens des étages Rupélien et Priabonien (comme la courbe cyan)
        '⚖️🐄': 8.3859e+12, // CH₄ ≈ 2,98 ppm d'air sec : Éocène de Beerling et al. 2011, interpolé en ln CO₂ (encadré « CH₄ DES ÉPOQUES »)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 16 }, { '🕰': '💫', '🔺⏳': 16 }],
            '💫': { '🔺🌡️💫': 0 },
            '🔀': ['📜'],
            '◀': {
                // 🌡️🧮 : graine du clic, la courbe cyan à ◀ (accesseur en fin de fichier).
                '📜': { '🌡️🧮': null },
            },
        },
        // 🧫 : 🏔 Grande Coupure / Miocène–Pliocène — CLAW moderne active.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey amplifiée (Miocene Climate Optimum puis refroidissement).
        '🌊🏭': 1.1
    },
    // Quaternaire (2 Ma → 10 ka) : cycles glaciaires/interglaciaires, LGM (~20 ka), Milankovitch
    {// Quaternaire 🦣
        '📅': '🦣',
        '⛄': 0.11,
        '▶': BASE_QUATERNAIRE_AGE, // base du Quaternaire, ICS 2023
        '◀': window.AN_PRESENT - BASE_HOLOCENE_AN, // base de l'Holocène, ▶ de 🛖 en âge : 11 725 ans avant 2025 (11 700 b2k)
        '🧲🔬': 0.04,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.11, '🍰🗻🌍': 0.19, '🍰🗻🧊': CALOTTES_ACTUELLES }, // ⚠️ état actuel posé : pas de reconstruction d'aire à 2,58 Ma trouvée (Antarctique depuis 34 Ma, Groenland depuis ≥ 2,7 Ma)
        //'🗻': { '🍰🗻🌊': 0.66, '🍰🗻🏔': 0.19, '🍰🗻🌍': 0.15 },
        // Racine (2,58 Ma, avant la première carotte) : le CO₂ de PhanDA, comme la courbe cyan à cette date.
        '⚖️🏭': QUATERNAIRE_CO2_KG,   // CO₂ ≈ 282 ppm (QUATERNAIRE_CO2_KG)
        '⚖️🐄': QUATERNAIRE_CH4_KG,   // CH₄ ≈ 0,695 ppm (QUATERNAIRE_CH4_KG)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            // DEUX CHEMINS (🕰.🛤), au choix du premier clic, du même départ (frise de 🦣, 2,58 Ma) à la même arrivée (11,7 ka, passage
            // à 🛖) :
            //   🐾 pas à pas — un pas de 2,58 Ma à 805 ka au CO₂ et au CH₄ de la racine (avant les carottes de glace, aucune mesure
            //      continue ; un état d'arrivée ne vaut que pour son pas : la glace ne s'équilibre pas 1,8 Ma sur le seul maximum glaciaire
            //      de 800 ka), un pas de 5 ka jusqu'à 800 ka, puis des pas de 5 ka le long des carottes antarctiques (obliquité et
            //      précession échantillonnées au-dessus de Nyquist) jusqu'à 15 ka, puis l'entrée dans l'Holocène : 160 clics. La courbe orange peut suivre les cycles de la courbe cyan (Snyder 2016) ;
            //   🦘 le saut — de 2,58 Ma au dernier maximum glaciaire (21 ka) en un clic, puis la déglaciation : 2 clics. L'Holocène
            //      arrive par la physique, calottes portées depuis un état glaciaire, sans la graine de 🛖.
            // Chaque chemin porte sa séquence (order) et ses états (🔁) ; 🕰.order, 🔁 et 🖼 sont des accesseurs vers le chemin joué
            // (encadré « CHEMINS » en fin de fichier).
            // 🔁 : les masses de CO₂ et de CH₄ MESURÉES à la date où le clic arrive (→ 📜🔁⚖️, lues par getMasses), moyenne des mesures
            // à ± 1 ka, interpolation linéaire entre les deux mesures voisines quand il n'y en a aucune. CO₂ : composite antarctique de
            // Bereiter et al. 2015 (GRL 42:542, chronologie AICC2012) ; CH₄ : EPICA Dome C, Loulergue et al. 2008 (Nature 453:383,
            // EDC3) — fichiers NOAA NCEI antarctica2015co2composite.txt et edc-ch4-2008.txt. Âges des fichiers « avant 1950 » +
            // (AN_PRESENT − 1950). Masses : ppm d'air sec avec N₂ 1 PAL et O₂ de l'époque, masses molaires du moteur (CONST.M_*) — écrites
            // par CO2/scripts/quaternaire/epica_etats.py. L'obliquité n'est PAS posée ici : elle vient de
            // l'orbite à la date (physics/orbite.js). AUCUN texte ici : le récit de chaque clic vit dans CO2/static/texts/epochs_alt2sec.js.
            '🛤': {
                '🐾': {
                    'order': CHEMIN_QUATERNAIRE('🐾', [(BASE_QUATERNAIRE_AGE - CAROTTES_AGE - PAS_CAROTTES_AN) / 1e6, PAS_CAROTTES_AN / 1e6]
                        .concat(Array.from({ length: N_PAS_CAROTTES }, () => PAS_CAROTTES_AN / 1e6))),   // … puis 3,275 ka
                    '🔁': [
                    { '⚖️🏭': QUATERNAIRE_CO2_KG, '⚖️🐄': QUATERNAIRE_CH4_KG },   // 805 ka : celles de la racine (aucune mesure avant 800 ka)
                    { '⚖️🏭': 1.5405e+15, '⚖️🐄': 1.1223e+12 },   // 800 ka : 199,6 ppm / 399 ppb — CO₂ interpolé (aucune mesure à ± 1 ka)
                    { '⚖️🏭': 1.5953e+15, '⚖️🐄': 1.1926e+12 },   // 795 ka : 206,7 ppm / 424 ppb
                    { '⚖️🏭': 1.8047e+15, '⚖️🐄': 1.4683e+12 },   // 790 ka : 233,8 ppm / 522 ppb
                    { '⚖️🏭': 1.9975e+15, '⚖️🐄': 1.8547e+12 },   // 785 ka : 258,8 ppm / 659 ppb
                    { '⚖️🏭': 1.9615e+15, '⚖️🐄': 1.7290e+12 },   // 780 ka : 254,1 ppm / 615 ppb
                    { '⚖️🏭': 1.8507e+15, '⚖️🐄': 1.6315e+12 },   // 775 ka : 239,8 ppm / 580 ppb
                    { '⚖️🏭': 1.7446e+15, '⚖️🐄': 1.7144e+12 },   // 770 ka : 226,0 ppm / 610 ppb
                    { '⚖️🏭': 1.7556e+15, '⚖️🐄': 1.4454e+12 },   // 765 ka : 227,5 ppm / 514 ppb
                    { '⚖️🏭': 1.7345e+15, '⚖️🐄': 1.2658e+12 },   // 760 ka : 224,7 ppm / 450 ppb
                    { '⚖️🏭': 1.5596e+15, '⚖️🐄': 1.1884e+12 },   // 755 ka : 202,1 ppm / 422 ppb
                    { '⚖️🏭': 1.4687e+15, '⚖️🐄': 1.1120e+12 },   // 750 ka : 190,3 ppm / 395 ppb
                    { '⚖️🏭': 1.4520e+15, '⚖️🐄': 1.1954e+12 },   // 745 ka : 188,1 ppm / 425 ppb
                    { '⚖️🏭': 1.4262e+15, '⚖️🐄': 1.1504e+12 },   // 740 ka : 184,8 ppm / 409 ppb
                    { '⚖️🏭': 1.6579e+15, '⚖️🐄': 1.4683e+12 },   // 735 ka : 214,8 ppm / 522 ppb
                    { '⚖️🏭': 1.6273e+15, '⚖️🐄': 1.5414e+12 },   // 730 ka : 210,9 ppm / 548 ppb
                    { '⚖️🏭': 1.6361e+15, '⚖️🐄': 1.5189e+12 },   // 725 ka : 212,0 ppm / 540 ppb
                    { '⚖️🏭': 1.6204e+15, '⚖️🐄': 1.1378e+12 },   // 720 ka : 210,0 ppm / 404 ppb
                    { '⚖️🏭': 1.7470e+15, '⚖️🐄': 1.5733e+12 },   // 715 ka : 226,4 ppm / 559 ppb
                    { '⚖️🏭': 1.7825e+15, '⚖️🐄': 1.6268e+12 },   // 710 ka : 231,0 ppm / 578 ppb
                    { '⚖️🏭': 1.8101e+15, '⚖️🐄': 1.6643e+12 },   // 705 ka : 234,5 ppm / 592 ppb
                    { '⚖️🏭': 1.8370e+15, '⚖️🐄': 1.6444e+12 },   // 700 ka : 238,0 ppm / 585 ppb
                    { '⚖️🏭': 1.8457e+15, '⚖️🐄': 1.7824e+12 },   // 695 ka : 239,1 ppm / 634 ppb
                    { '⚖️🏭': 1.8018e+15, '⚖️🐄': 1.5538e+12 },   // 690 ka : 233,5 ppm / 552 ppb
                    { '⚖️🏭': 1.7219e+15, '⚖️🐄': 1.4317e+12 },   // 685 ka : 223,1 ppm / 509 ppb
                    { '⚖️🏭': 1.7917e+15, '⚖️🐄': 1.3624e+12 },   // 680 ka : 232,1 ppm / 484 ppb
                    { '⚖️🏭': 1.6271e+15, '⚖️🐄': 1.5688e+12 },   // 675 ka : 210,8 ppm / 558 ppb
                    { '⚖️🏭': 1.4631e+15, '⚖️🐄': 1.2446e+12 },   // 670 ka : 189,6 ppm / 442 ppb
                    { '⚖️🏭': 1.4386e+15, '⚖️🐄': 1.1645e+12 },   // 665 ka : 186,4 ppm / 414 ppb
                    { '⚖️🏭': 1.4444e+15, '⚖️🐄': 1.0098e+12 },   // 660 ka : 187,2 ppm / 359 ppb
                    { '⚖️🏭': 1.5235e+15, '⚖️🐄': 1.1167e+12 },   // 655 ka : 197,4 ppm / 397 ppb
                    { '⚖️🏭': 1.4873e+15, '⚖️🐄': 1.1645e+12 },   // 650 ka : 192,7 ppm / 414 ppb
                    { '⚖️🏭': 1.5093e+15, '⚖️🐄': 1.2067e+12 },   // 645 ka : 195,6 ppm / 429 ppb
                    { '⚖️🏭': 1.4626e+15, '⚖️🐄': 1.0492e+12 },   // 640 ka : 189,5 ppm / 373 ppb
                    { '⚖️🏭': 1.5021e+15, '⚖️🐄': 1.0154e+12 },   // 635 ka : 194,6 ppm / 361 ppb
                    { '⚖️🏭': 1.5579e+15, '⚖️🐄': 1.0014e+12 },   // 630 ka : 201,9 ppm / 356 ppb
                    { '⚖️🏭': 1.8251e+15, '⚖️🐄': 1.5218e+12 },   // 625 ka : 236,5 ppm / 541 ppb
                    { '⚖️🏭': 1.9070e+15, '⚖️🐄': 1.6934e+12 },   // 620 ka : 247,1 ppm / 602 ppb
                    { '⚖️🏭': 1.9640e+15, '⚖️🐄': 1.7398e+12 },   // 615 ka : 254,5 ppm / 618 ppb
                    { '⚖️🏭': 1.9950e+15, '⚖️🐄': 1.6540e+12 },   // 610 ka : 258,5 ppm / 588 ppb
                    { '⚖️🏭': 1.8665e+15, '⚖️🐄': 1.4571e+12 },   // 605 ka : 241,8 ppm / 518 ppb
                    { '⚖️🏭': 1.7572e+15, '⚖️🐄': 1.5021e+12 },   // 600 ka : 227,7 ppm / 534 ppb
                    { '⚖️🏭': 1.8241e+15, '⚖️🐄': 1.3596e+12 },   // 595 ka : 236,3 ppm / 483 ppb
                    { '⚖️🏭': 1.9067e+15, '⚖️🐄': 1.2771e+12 },   // 590 ka : 247,1 ppm / 454 ppb
                    { '⚖️🏭': 1.6257e+15, '⚖️🐄': 1.3361e+12 },   // 585 ka : 210,6 ppm / 475 ppb — CH₄ interpolé (aucune mesure à ± 1 ka)
                    { '⚖️🏭': 1.8963e+15, '⚖️🐄': 1.5844e+12 },   // 580 ka : 245,7 ppm / 563 ppb
                    { '⚖️🏭': 1.9383e+15, '⚖️🐄': 1.6920e+12 },   // 575 ka : 251,1 ppm / 602 ppb
                    { '⚖️🏭': 1.9393e+15, '⚖️🐄': 1.6563e+12 },   // 570 ka : 251,3 ppm / 589 ppb
                    { '⚖️🏭': 1.9237e+15, '⚖️🐄': 1.6180e+12 },   // 565 ka : 249,2 ppm / 575 ppb
                    { '⚖️🏭': 1.7842e+15, '⚖️🐄': 1.3974e+12 },   // 560 ka : 231,2 ppm / 497 ppb
                    { '⚖️🏭': 1.7355e+15, '⚖️🐄': 1.5154e+12 },   // 555 ka : 224,9 ppm / 539 ppb
                    { '⚖️🏭': 1.6076e+15, '⚖️🐄': 1.3051e+12 },   // 550 ka : 208,3 ppm / 464 ppb
                    { '⚖️🏭': 1.6145e+15, '⚖️🐄': 1.1884e+12 },   // 545 ka : 209,2 ppm / 422 ppb
                    { '⚖️🏭': 1.6180e+15, '⚖️🐄': 1.1308e+12 },   // 540 ka : 209,7 ppm / 402 ppb
                    { '⚖️🏭': 1.5038e+15, '⚖️🐄': 1.2629e+12 },   // 535 ka : 194,8 ppm / 449 ppb
                    { '⚖️🏭': 1.7130e+15, '⚖️🐄': 1.2531e+12 },   // 530 ka : 221,9 ppm / 446 ppb
                    { '⚖️🏭': 1.8237e+15, '⚖️🐄': 1.4908e+12 },   // 525 ka : 236,3 ppm / 530 ppb
                    { '⚖️🏭': 1.8999e+15, '⚖️🐄': 1.4740e+12 },   // 520 ka : 246,2 ppm / 524 ppb
                    { '⚖️🏭': 1.8495e+15, '⚖️🐄': 1.4100e+12 },   // 515 ka : 239,6 ppm / 501 ppb
                    { '⚖️🏭': 1.8284e+15, '⚖️🐄': 1.4810e+12 },   // 510 ka : 236,9 ppm / 526 ppb
                    { '⚖️🏭': 1.8014e+15, '⚖️🐄': 1.5330e+12 },   // 505 ka : 233,4 ppm / 545 ppb
                    { '⚖️🏭': 1.7805e+15, '⚖️🐄': 1.4130e+12 },   // 500 ka : 230,7 ppm / 502 ppb
                    { '⚖️🏭': 1.8418e+15, '⚖️🐄': 1.4318e+12 },   // 495 ka : 238,6 ppm / 509 ppb
                    { '⚖️🏭': 1.8949e+15, '⚖️🐄': 1.6221e+12 },   // 490 ka : 245,5 ppm / 577 ppb
                    { '⚖️🏭': 1.7854e+15, '⚖️🐄': 1.5527e+12 },   // 485 ka : 231,3 ppm / 552 ppb
                    { '⚖️🏭': 1.7508e+15, '⚖️🐄': 1.4317e+12 },   // 480 ka : 226,9 ppm / 509 ppb
                    { '⚖️🏭': 1.8786e+15, '⚖️🐄': 1.3769e+12 },   // 475 ka : 243,4 ppm / 490 ppb
                    { '⚖️🏭': 1.5898e+15, '⚖️🐄': 1.3009e+12 },   // 470 ka : 206,0 ppm / 462 ppb
                    { '⚖️🏭': 1.5824e+15, '⚖️🐄': 1.2517e+12 },   // 465 ka : 205,0 ppm / 445 ppb
                    { '⚖️🏭': 1.5848e+15, '⚖️🐄': 1.1715e+12 },   // 460 ka : 205,4 ppm / 416 ppb
                    { '⚖️🏭': 1.5312e+15, '⚖️🐄': 1.2686e+12 },   // 455 ka : 198,4 ppm / 451 ppb
                    { '⚖️🏭': 1.5813e+15, '⚖️🐄': 1.0717e+12 },   // 450 ka : 204,9 ppm / 381 ppb
                    { '⚖️🏭': 1.5366e+15, '⚖️🐄': 1.2510e+12 },   // 445 ka : 199,1 ppm / 445 ppb
                    { '⚖️🏭': 1.5512e+15, '⚖️🐄': 1.1321e+12 },   // 440 ka : 201,0 ppm / 402 ppb
                    { '⚖️🏭': 1.6022e+15, '⚖️🐄': 1.0717e+12 },   // 435 ka : 207,6 ppm / 381 ppb
                    { '⚖️🏭': 1.8716e+15, '⚖️🐄': 1.0921e+12 },   // 430 ka : 242,5 ppm / 388 ppb
                    { '⚖️🏭': 2.0757e+15, '⚖️🐄': 1.5886e+12 },   // 425 ka : 268,9 ppm / 565 ppb
                    { '⚖️🏭': 2.1063e+15, '⚖️🐄': 1.9213e+12 },   // 420 ka : 272,9 ppm / 683 ppb
                    { '⚖️🏭': 2.0704e+15, '⚖️🐄': 1.8397e+12 },   // 415 ka : 268,2 ppm / 654 ppb
                    { '⚖️🏭': 2.1507e+15, '⚖️🐄': 1.9899e+12 },   // 410 ka : 278,6 ppm / 707 ppb
                    { '⚖️🏭': 2.1495e+15, '⚖️🐄': 1.8887e+12 },   // 405 ka : 278,5 ppm / 671 ppb
                    { '⚖️🏭': 2.1623e+15, '⚖️🐄': 1.7154e+12 },   // 400 ka : 280,1 ppm / 610 ppb
                    { '⚖️🏭': 2.0619e+15, '⚖️🐄': 1.6400e+12 },   // 395 ka : 267,1 ppm / 583 ppb
                    { '⚖️🏭': 1.8971e+15, '⚖️🐄': 1.4674e+12 },   // 390 ka : 245,8 ppm / 522 ppb
                    { '⚖️🏭': 1.8523e+15, '⚖️🐄': 1.5855e+12 },   // 385 ka : 240,0 ppm / 564 ppb
                    { '⚖️🏭': 1.7664e+15, '⚖️🐄': 1.4564e+12 },   // 380 ka : 228,9 ppm / 518 ppb — CO₂ interpolé (aucune mesure à ± 1 ka)
                    { '⚖️🏭': 1.6570e+15, '⚖️🐄': 1.2161e+12 },   // 375 ka : 214,7 ppm / 432 ppb
                    { '⚖️🏭': 1.5731e+15, '⚖️🐄': 1.3783e+12 },   // 370 ka : 203,8 ppm / 490 ppb — CO₂ interpolé (aucune mesure à ± 1 ka)
                    { '⚖️🏭': 1.5528e+15, '⚖️🐄': 1.2423e+12 },   // 365 ka : 201,2 ppm / 442 ppb
                    { '⚖️🏭': 1.4629e+15, '⚖️🐄': 1.2085e+12 },   // 360 ka : 189,6 ppm / 430 ppb
                    { '⚖️🏭': 1.6153e+15, '⚖️🐄': 1.1373e+12 },   // 355 ka : 209,3 ppm / 404 ppb
                    { '⚖️🏭': 1.7002e+15, '⚖️🐄': 1.1673e+12 },   // 350 ka : 220,3 ppm / 415 ppb
                    { '⚖️🏭': 1.5837e+15, '⚖️🐄': 1.0590e+12 },   // 345 ka : 205,2 ppm / 376 ppb
                    { '⚖️🏭': 1.8412e+15, '⚖️🐄': 1.2749e+12 },   // 340 ka : 238,6 ppm / 453 ppb
                    { '⚖️🏭': 2.2176e+15, '⚖️🐄': 1.6613e+12 },   // 335 ka : 287,3 ppm / 591 ppb
                    { '⚖️🏭': 2.1109e+15, '⚖️🐄': 1.7968e+12 },   // 330 ka : 273,5 ppm / 639 ppb
                    { '⚖️🏭': 2.0098e+15, '⚖️🐄': 1.7201e+12 },   // 325 ka : 260,4 ppm / 612 ppb
                    { '⚖️🏭': 1.8878e+15, '⚖️🐄': 1.3776e+12 },   // 320 ka : 244,6 ppm / 490 ppb
                    { '⚖️🏭': 1.9691e+15, '⚖️🐄': 1.7084e+12 },   // 315 ka : 255,1 ppm / 607 ppb
                    { '⚖️🏭': 1.7679e+15, '⚖️🐄': 1.3228e+12 },   // 310 ka : 229,1 ppm / 470 ppb
                    { '⚖️🏭': 1.8809e+15, '⚖️🐄': 1.3699e+12 },   // 305 ka : 243,7 ppm / 487 ppb
                    { '⚖️🏭': 1.7574e+15, '⚖️🐄': 1.4126e+12 },   // 300 ka : 227,7 ppm / 502 ppb
                    { '⚖️🏭': 1.6184e+15, '⚖️🐄': 1.4809e+12 },   // 295 ka : 209,7 ppm / 526 ppb
                    { '⚖️🏭': 1.7570e+15, '⚖️🐄': 1.4993e+12 },   // 290 ka : 227,7 ppm / 533 ppb
                    { '⚖️🏭': 1.7851e+15, '⚖️🐄': 1.3427e+12 },   // 285 ka : 231,3 ppm / 477 ppb
                    { '⚖️🏭': 1.6033e+15, '⚖️🐄': 1.2787e+12 },   // 280 ka : 207,8 ppm / 455 ppb
                    { '⚖️🏭': 1.4972e+15, '⚖️🐄': 1.3158e+12 },   // 275 ka : 194,0 ppm / 468 ppb
                    { '⚖️🏭': 1.4717e+15, '⚖️🐄': 1.2615e+12 },   // 270 ka : 190,7 ppm / 448 ppb
                    { '⚖️🏭': 1.7604e+15, '⚖️🐄': 1.1612e+12 },   // 265 ka : 228,1 ppm / 413 ppb
                    { '⚖️🏭': 1.5956e+15, '⚖️🐄': 1.2624e+12 },   // 260 ka : 206,8 ppm / 449 ppb
                    { '⚖️🏭': 1.5080e+15, '⚖️🐄': 1.1877e+12 },   // 255 ka : 195,4 ppm / 422 ppb
                    { '⚖️🏭': 1.6570e+15, '⚖️🐄': 1.1651e+12 },   // 250 ka : 214,7 ppm / 414 ppb
                    { '⚖️🏭': 1.9345e+15, '⚖️🐄': 1.4318e+12 },   // 245 ka : 250,7 ppm / 509 ppb
                    { '⚖️🏭': 1.9133e+15, '⚖️🐄': 1.6529e+12 },   // 240 ka : 247,9 ppm / 588 ppb
                    { '⚖️🏭': 1.8830e+15, '⚖️🐄': 1.3284e+12 },   // 235 ka : 244,0 ppm / 472 ppb — CO₂ interpolé (aucune mesure à ± 1 ka)
                    { '⚖️🏭': 1.7326e+15, '⚖️🐄': 1.3104e+12 },   // 230 ka : 224,5 ppm / 466 ppb
                    { '⚖️🏭': 1.5868e+15, '⚖️🐄': 1.4373e+12 },   // 225 ka : 205,6 ppm / 511 ppb
                    { '⚖️🏭': 1.8562e+15, '⚖️🐄': 1.3888e+12 },   // 220 ka : 240,5 ppm / 494 ppb
                    { '⚖️🏭': 1.8855e+15, '⚖️🐄': 1.5100e+12 },   // 215 ka : 244,3 ppm / 537 ppb
                    { '⚖️🏭': 1.8807e+15, '⚖️🐄': 1.5651e+12 },   // 210 ka : 243,7 ppm / 556 ppb
                    { '⚖️🏭': 1.8380e+15, '⚖️🐄': 1.3685e+12 },   // 205 ka : 238,2 ppm / 486 ppb
                    { '⚖️🏭': 1.8724e+15, '⚖️🐄': 1.5902e+12 },   // 200 ka : 242,6 ppm / 565 ppb
                    { '⚖️🏭': 1.7230e+15, '⚖️🐄': 1.4552e+12 },   // 195 ka : 223,2 ppm / 517 ppb
                    { '⚖️🏭': 1.7851e+15, '⚖️🐄': 1.2424e+12 },   // 190 ka : 231,3 ppm / 442 ppb
                    { '⚖️🏭': 1.5412e+15, '⚖️🐄': 1.3586e+12 },   // 185 ka : 199,7 ppm / 483 ppb
                    { '⚖️🏭': 1.6030e+15, '⚖️🐄': 1.3248e+12 },   // 180 ka : 207,7 ppm / 471 ppb
                    { '⚖️🏭': 1.5192e+15, '⚖️🐄': 1.3070e+12 },   // 175 ka : 196,8 ppm / 465 ppb
                    { '⚖️🏭': 1.5173e+15, '⚖️🐄': 1.3023e+12 },   // 170 ka : 196,6 ppm / 463 ppb
                    { '⚖️🏭': 1.5165e+15, '⚖️🐄': 1.1490e+12 },   // 165 ka : 196,5 ppm / 408 ppb
                    { '⚖️🏭': 1.4393e+15, '⚖️🐄': 1.1757e+12 },   // 160 ka : 186,5 ppm / 418 ppb
                    { '⚖️🏭': 1.5150e+15, '⚖️🐄': 1.1110e+12 },   // 155 ka : 196,3 ppm / 395 ppb
                    { '⚖️🏭': 1.5601e+15, '⚖️🐄': 1.1800e+12 },   // 150 ka : 202,1 ppm / 420 ppb
                    { '⚖️🏭': 1.5128e+15, '⚖️🐄': 1.0942e+12 },   // 145 ka : 196,0 ppm / 389 ppb
                    { '⚖️🏭': 1.4876e+15, '⚖️🐄': 1.0614e+12 },   // 140 ka : 192,8 ppm / 377 ppb
                    { '⚖️🏭': 1.6395e+15, '⚖️🐄': 1.1617e+12 },   // 135 ka : 212,4 ppm / 413 ppb
                    { '⚖️🏭': 1.9907e+15, '⚖️🐄': 1.4692e+12 },   // 130 ka : 257,9 ppm / 522 ppb
                    { '⚖️🏭': 2.1413e+15, '⚖️🐄': 1.7894e+12 },   // 125 ka : 277,4 ppm / 636 ppb
                    { '⚖️🏭': 2.0991e+15, '⚖️🐄': 1.6372e+12 },   // 120 ka : 272,0 ppm / 582 ppb
                    { '⚖️🏭': 2.1092e+15, '⚖️🐄': 1.3676e+12 },   // 115 ka : 273,3 ppm / 486 ppb
                    { '⚖️🏭': 1.8916e+15, '⚖️🐄': 1.4116e+12 },   // 110 ka : 245,1 ppm / 502 ppb
                    { '⚖️🏭': 1.8866e+15, '⚖️🐄': 1.6606e+12 },   // 105 ka : 244,4 ppm / 590 ppb
                    { '⚖️🏭': 1.8947e+15, '⚖️🐄': 1.5007e+12 },   // 100 ka : 245,5 ppm / 534 ppb
                    { '⚖️🏭': 1.8819e+15, '⚖️🐄': 1.2556e+12 },   //  95 ka : 243,8 ppm / 446 ppb
                    { '⚖️🏭': 1.7704e+15, '⚖️🐄': 1.3061e+12 },   //  90 ka : 229,4 ppm / 464 ppb
                    { '⚖️🏭': 1.8459e+15, '⚖️🐄': 1.2665e+12 },   //  85 ka : 239,2 ppm / 450 ppb
                    { '⚖️🏭': 1.7841e+15, '⚖️🐄': 1.5158e+12 },   //  80 ka : 231,2 ppm / 539 ppb
                    { '⚖️🏭': 1.8759e+15, '⚖️🐄': 1.2449e+12 },   //  75 ka : 243,1 ppm / 443 ppb
                    { '⚖️🏭': 1.6450e+15, '⚖️🐄': 1.3227e+12 },   //  70 ka : 213,1 ppm / 470 ppb
                    { '⚖️🏭': 1.5582e+15, '⚖️🐄': 1.2798e+12 },   //  65 ka : 201,9 ppm / 455 ppb
                    { '⚖️🏭': 1.6997e+15, '⚖️🐄': 1.2111e+12 },   //  60 ka : 220,2 ppm / 431 ppb
                    { '⚖️🏭': 1.6564e+15, '⚖️🐄': 1.3477e+12 },   //  55 ka : 214,6 ppm / 479 ppb
                    { '⚖️🏭': 1.5746e+15, '⚖️🐄': 1.3330e+12 },   //  50 ka : 204,0 ppm / 474 ppb
                    { '⚖️🏭': 1.6260e+15, '⚖️🐄': 1.3122e+12 },   //  45 ka : 210,7 ppm / 466 ppb
                    { '⚖️🏭': 1.5463e+15, '⚖️🐄': 1.2091e+12 },   //  40 ka : 200,4 ppm / 430 ppb
                    { '⚖️🏭': 1.5427e+15, '⚖️🐄': 1.2940e+12 },   //  35 ka : 199,9 ppm / 460 ppb
                    { '⚖️🏭': 1.4618e+15, '⚖️🐄': 1.1074e+12 },   //  30 ka : 189,4 ppm / 394 ppb
                    { '⚖️🏭': 1.4170e+15, '⚖️🐄': 1.0404e+12 },   //  25 ka : 183,6 ppm / 370 ppb
                    { '⚖️🏭': 1.4804e+15, '⚖️🐄': 1.0368e+12 },   //  20 ka : 191,8 ppm / 369 ppb
                    { '⚖️🏭': 1.7960e+15, '⚖️🐄': 1.3480e+12 }    //  15 ka : 232,7 ppm / 479 ppb
                    ]
                },
                '🦘': {
                    'order': CHEMIN_QUATERNAIRE('🦘', [2.559]),   // … puis 9,275 ka
                    '🔁': [
                        { '⚖️🏭': 1.4658e+15, '⚖️🐄': 1.0348e+12 }    //  21 ka : 189,9 ppm / 368 ppb
                    ]
                }
            },
            '🐾': { '🔺🌡️💫': 0 },
            '🦘': { '🔺🌡️💫': 0 },
            // Interpolation linéaire 🌡️🧮 (graine solveur, 📜) de ▶ vers ◀ de 🦣, deux points de la courbe cyan.
            '🔀': ['📜'],
            '◀': {
                '📜': { '🌡️🧮': null },   // la courbe cyan à ◀ (accesseur en fin de fichier)
            },
        },
        // 🧫 : 🦣 Quaternaire — CLAW moderne, cycles Milankovitch.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne. Cycles glaciaires cf. Sigman & Boyle 2000 Nature 407:859
        // (CO₂ 180 ↔ 280 ppm interglaciaire/glaciaire via solubilité océanique accrue à T_cold).
        '🌊🏭': 1.0
    },
    // Holocène (10 ka → 1800) : interglaciaire, agriculture, stabilité climatique pré-industrielle
    {// Holocène 🛖
        '📅': '🛖',
        '⛄': 0.105,
        '▶': BASE_HOLOCENE_AN, // base de l'Holocène (11 700 b2k = −9700), ICS 2023
        '◀': 1750, // v-2026-09-24 : vraie date — préindustriel GIEC (était 1800)
        '🧲🔬': 0.03,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        //'🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        //'🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.13, '🍰🗻🌍': 0.17 },
        '🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.14, '🍰🗻🌍': 0.17, '🍰🗻🧊': CALOTTES_ACTUELLES }, // ⚠️ PROVISOIRE : à 11,7 ka les calottes nord-américaines + Groenland couvraient ~9,9e6 km² (Dalton et al. 2020, QSR 234:106223, tableau 1) — partage par bande à calculer des isochrones
        // CO₂ et CH₄ mesurés dans les carottes antarctiques à ▶ (11 725 ans avant 2025), comme les états 🔁 de 🦣 : moyenne des mesures
        //   à ± 1 ka (CO2/scripts/quaternaire/epica_etats.py, sa fonction mesure) — CO₂ : composite de Bereiter et al. 2015 (GRL 42:542),
        //   73 mesures ; CH₄ : EPICA Dome C, Loulergue et al. 2008 (Nature 453:383), 27 mesures, à cheval sur le saut du Dryas récent.
        '⚖️🏭': 1.9781e+15, // CO₂ ≈ 256,3 ppm d'air sec
        '⚖️🐄': 1.6428e+12, // CH₄ ≈ 0,584 ppm d'air sec
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 0.0039 }, { '🕰': '💫', '🔺⏳': 0.0039 }, { '🕰': '💫', '🔺⏳': 0.0039 }],
            '💫': { '🔺🌡️💫': 0 }, // 4 ka/tic : −10000 → −6000 → −2000 → fin (1800, borné) → 🚂 // v-2026-09-24 : 🔺⏳ 0.004 → 0.0039 (2 clics + transition — 11 450 ans)
        },
        // 🧫 : 🛖 Holocène — CLAW moderne, pré-industriel.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne pré-industrielle (équilibre stationnaire 280 ppm).
        '🌊🏭': 1.0
    },
    // Industriel (1750 → 2000) : révolution industrielle, CO₂ 277 → 370 ppm, début signal anthropique
    {// Industriel 🚂
        '📅': '🚂',
        '▶': 1750, // v-2026-09-24 : vraie date — préindustriel GIEC (était 1800)
        '◀': 2000,
        '🧲🔬': 0.01,
        '🧲🔬⌊': 0.10,   // [W/m²] plancher de la tolérance en flux de l'époque (computeToleranceWm2)
        '📐': 6371,
        '🍎': 9.81,
        '🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.13, '🍰🗻🌍': 0.17, '🍰🗻🧊': CALOTTES_ACTUELLES },
        //'🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.16, '🍰🗻🌍': 0.15 },
        '⚖️🏭': 2.1365e+15, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 2.139e15 // v-2026-09-24 : ≈ 276,8 ppm air sec = Law Dome 1750 (MacFarling Meure 2006) ‖ avant : 2.191e15
        '⚖️🐄': 1.9607e+12, // CH₄ ≈ 0,697 ppm d'air sec = Law Dome 1750 (MacFarling Meure et al. 2006)
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,   // O₂ = 21,0 % de l'air sec, celui de 📱 (mesure ; aucune source ne le baisse à cette date)
        // ⚖️✈ : 4,0e8 kg SO₄ = charge PRÉINDUSTRIELLE simulée (Tsigaridis et al. 2006 ACP 6:5143,
        //   Table 5 : nss-sulfate 0,40 Tg ; dispersion inter-modèles publiée 0,10–0,58 Tg).
        //   Leur « préindustriel » utilise les émissions anthropiques EDGAR-HYDE de 1860 ; cette
        //   fiche est datée 1750, où l'anthropique était encore plus faible — l'écart est très
        //   inférieur à la dispersion inter-modèles. Le sulfate industriel n'arrive qu'après 1850.
        '⚖️✈': 4.0e8,
        '⚖️💨': N2_1PAL_KG,
        '🕰': {
            'order': [{ '🕰': '💫', '🔺⏳': 0.000125 }, { '🕰': '💫', '🔺⏳': 0.000125 }],
            '💫': { '🔺🌡️💫': 0 }, // 125 ans par tic : 2 tics de 1750 à 2000
        },
        // 🧫 : 🚂 Industriel — CLAW moderne + début SO₂ anthropique (le vrai boost sulfate arrive via anthro_factor).
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne. Absorption océan ~25-30 % anthro (Le Quéré et al. 2018 ESSD 10:2141).
        '🌊🏭': 1.0
    },
    {// Aujourd'hui 📱
        '📅': '📱', // Aujourd'hui (▶=2000 : clic 📱 = position 2000 ; fin de frise = 2100 en organigramme)
        '▶': 2000,
        '◀': 2100, // ticTime forward : 2000+25a/tic → 2025 après 1 tic, 2100 terminus
        // Tolérance : le plancher mord, 0,01 W/m². Autour de l'actuel le bilan ne varie que de ≈ 0,6 W/m² par K (glace, vapeur,
        //   nuages), pas des 3,8 de Planck seul : 0,01 W/m² laisse ≈ 0,02 K sur T, là où 0,10 en laissait 0,16 — deux chemins
        //   arrivés en 1875 dans le même état finissent ensemble en 2000 et 2025.
        '🧲🔬': 0.002,
        '🧲🔬⌊': 0.01,   // [W/m²]
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Mer : après 540 Ma, la valeur sert au contrôle de somme ; la mer est celle de la carte (PaleoDEM)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20, // Terres basses (20% - continents modernes)
            '🍰🗻🧊': CALOTTES_ACTUELLES
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // 🍰🪩🏜️, 🍰🪩🌳, 🍰🪩🌍 : calculés par calculateAlbedo (désert, forêt sous la ligne des arbres, sol).
        // Simulation parameters - Quantités en kg
        // ⚠️ 369 ppm = fraction molaire d'air SEC (NOAA). Le modèle affiche de l'air HUMIDE (365 ppm) :
        //    ppm_sec = ppm_humide / (1 − x_H2O). Détail et vérif : atmosphere/calculations_atm.js,
        //    bloc « AIR SEC vs AIR HUMIDE ». Cette masse est juste — ne pas la retoucher pour recoller à 369.
        '⚖️🏭': 2.8555e+15, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 2.909e15 // v-2026-09-23 (était 2.887e15) : CO₂ ≈ 370 ppm air sec = NOAA an 2000 (369,7) = milieu de [365,375] ‖ avant : ~369 ppm CO2 an 2000 [OBS] NOAA (air sec)
        '⚖️🐄': 4.8982e+12, // 1 PAL N₂ (2026-10-13), ppm inchangés ; avant 4.99e12 // ~1750 ppb CH4 an 2000 [OBS] NOAA
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.18e18, // O2 ~23% masse air sec
        // ⚖️✈ : 1,05e9 kg SO₄ = charge atmosphérique MESURÉE/simulée d'aujourd'hui.
        //   Tsigaridis et al. 2006 ACP 6:5143, Table 5 : nss-sulfate 1,05 Tg (émissions an 2000),
        //   contre 0,40 Tg en préindustriel → rapport 2,6, énoncé tel quel dans leur texte.
        //   Recoupement indépendant : Textor et al. 2006 ACP 6:1777, Table 10 — 16 modèles AeroCom,
        //   charge SO₄ 1,99 Tg (δ=25 %), source 179 Tg SO₄/an, durée de vie 4,12 j ; leur chiffre
        //   inclut le sulfate porté par le sel de mer, que Tsigaridis exclut (nss). Et Schulz et al.
        //   2006 ACP 6:5225, Table 2 : la part anthropique vaut 55 % de l'épaisseur optique sulfatée
        //   actuelle, soit un rapport actuel/préindustriel de 2,2 — même ordre.
        //   ⚠️ L'ancienne valeur, 8,0e13 kg, était un « proxy CCN » sans dimension physique : 76 000 ×
        //   la charge réelle, et surtout un rapport 📱/🚂 de 53 quand la mesure donne 2,6.
        '⚖️✈': 1.05e9,
        '⚖️💨': N2_1PAL_KG,
        // 🔒 Bornes hystérésis Aujourd'hui — pré-industriel → RCP8.5 extreme.
        //    Refs : NOAA/GISS (CO₂ 2000 ≈369 ppm, 280 ppm pré-industriel), IPCC AR6 WG1 SSP5-8.5 (~1135 ppm @2100), CH₄ pré-ind ≈700 ppb → ~3500 ppb RCP8.5, Crutzen 2006 (SRM sulfates stratosphériques 1–5 Tg S/an → ~5e14 kg équivalent).
        //    Conversion mass/ppm @ M_atm=5.15e18 : 1 ppm CO₂ ≈ 7.83e12 kg ; 1 ppm CH₄ ≈ 2.84e12 kg.
        '🔒': {
            '⚖️🏭': { min: 2.19e15, max: 1.0e16, cools: 'min' }, // CO₂ : 280 ppm (pré-ind) → ~1280 ppm (RCP8.5+)
            '⚖️🐄': { min: 2.0e12,  max: 2.0e13, cools: 'min' }, // CH₄ : 700 ppb → 7 ppm
            '⚖️💨': { min: 3.85e18, max: 4.05e18, cools: 'min' }, // 1 PAL = 3,878e18 (2026-10-13) // N₂ : très stable (pas de réservoir rapide)
            // sulfates : min = fond naturel préindustriel 4,0e8 kg (Tsigaridis 2006) — arrêter toute
            //   émission anthropique ne descend pas plus bas. max = 1,62e10 kg : pic de charge
            //   sulfatée stratosphérique après le Pinatubo, 5,4 Tg de soufre (Sukhodolov et al. 2018
            //   GMD 11:2633, modèle en accord avec HIRS) × 96/32 = 16,2 Tg SO₄. C'est l'ordre de
            //   grandeur d'une géo-ingénierie sulfatée, que Crutzen (2006) calibre précisément sur
            //   le Pinatubo. L'ancien max, 5,0e14, était 30 000 × celui-là.
            '⚖️✈': { min: 4.0e8,   max: 1.62e10, cools: 'max' },
            '⚖️🫁': { min: 1.17e18, max: 1.19e18, cools: 'min' }, // O₂ : quasi-constant échelle humaine
            '⚖️💧': { min: 1.38e21, max: 1.42e21, cools: 'min' }, // H₂O hydrosphère : très stable
        },
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        // Échelle récente : 🔺⏳ = 0.000025 Ma → 25 ans par pas
        // 🕰 indexé par année : un clic injecte 🔺⚖️🏭 (masse CO₂) ; les puits océan et forêts en reprennent une part.
        // 🔺⚖️🏭 en kg de CO₂ émis sur la tranche de 25 ans (1 Gt = 1e12 kg ; affichage events.js = kg/1e12).
        // [v1.4.80] ×1000 : les valeurs étaient en « N·1e9 » (850e9 kg = 0,85 Gt) → aucun effet climatique.
        // Refs : Friedlingstein et al. 2023 ESSD 15:5301 (Global Carbon Budget) : fossile+usage des sols ≈ 40 GtCO₂/an
        //   → 2000–2025 = 973 GtCO₂ MESURÉS, pas une fourchette : cumul avec usage des sols du Global Carbon
        //   Budget, 2751,5 − 1778,1 GtCO₂ entre fin 1999 et fin 2024 (Friedlingstein et al. 2026 ESSD 18:3211,
        //   série cumulée diffusée par Our World in Data). 1 ppm CO₂ ≈ 7,8 GtCO₂ ; aéroportée mesurée ≈ 44 %
        //   (≈ +55 ppm, 369,5 → 424,6 ppm NOAA, en air SEC — cf. bloc « AIR SEC vs AIR HUMIDE »).
        //   ⚠️ Les 850e12 d'avant (bas d'une fourchette « 850–1000 » notée au jugé) compensaient par en dessous
        //   des puits alors trop faibles : 2025 tombait juste pour deux erreurs qui s'annulaient.
        '🕰': {
            // 🌙 CARTE DE NUIT superposée à la texture de jour : les lumières des villes n'apparaissent que sur
            // la face à l'ombre, EN MÊME TEMPS que le jour (pas d'alternance). Vaut pour toute l'époque (≥ 2000).
            // Image NASA « Earth at night » : la seule chose qui distingue visuellement l'ère industrielle vue de l'espace.
            '🌙': 'fonds/_002000n.png',
            '🔺⏳': 0.000025,   // [Ma] 25 ans par clic, toutes les tranches
            // 2000–2025 : les émissions MESURÉES, 973 GtCO₂ (cumul 2000–2024 du Global Carbon Budget). Le clic passe au suivant
            // la référence 🔺⚖️🏭⏮ = 1 000 GtCO₂ par tranche, le rythme actuel (≈ 40 GtCO₂/an ; 41,6 mesurés en 2024).
            2000: { '🛢': { '🔺⚖️🏭': 973e12, '🔺⚖️🏭⏮': 1000e12 } },
            // À partir de 2025, chaque bouton multiplie l'émission de la tranche précédente (📜🔺⚖️🏭⏮, CLICS.trancheActive) :
            // 🌈 la moitié, ⛽ les trois quarts, 🛢 la même, 🪾 une fois et demie. Des règles mécaniques, pas des prévisions ; les
            // facteurs restent à régler. Jusqu'à la borne de la frise (window.TIMELINE_FUTUR ◀ = 2300).
            2025: { '🌈': { '×': 0.5 }, '⛽': { '×': 0.75 }, '🛢': { '×': 1 }, '🪾': { '×': 1.5 } },
            '◀': {
                // ⚖️🏭 volontairement absent : CO₂ géré par accumulation manuelle (🔺⚖️🏭_cum)
                // ⚠️ TODO ⚖️🐄 CH4 2100 : ~3000 ppb → 8.6e12 kg (à recalibrer)
                '⚖️': { '⚖️💧': 1.4e21, '⚖️🐄': 8.4419e+12, '⚖️🫁': 1.18e18, '⚖️✈': 1.05e9, '⚖️💨': 3.8780e+18 }
            }
        },
        // 🧫 : 📱 Aujourd'hui — CLAW moderne + sulfate anthropique (SO₂ industriel → CCN).
        // Réfs : Charlson 1987 (CLAW), Twomey 1977, Quinn & Bates 2011, Woodhouse 2010.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey = référence Henry moderne. ratio_ref=50 (CONFIG_COMPUTE.co2OceanRatioRef).
        // Absorption océanique anthropique ~25-30 % (Le Quéré et al. 2018, Friedlingstein et al. 2023
        // Global Carbon Budget). cf. calculations_co2.js v1.2.0 : seed ⚖️🌊🏭=50·⚖️🏭 à l'init.
        '🌊🏭': 1.0
    }
];

window.TIMELINE = timeline;
// FUTUR (2100 → 2300) : un repère de la frise (logo non cliquable) et de l'Histoire, HORS du TIMELINE. Les clics de 📱
// continuent jusqu'à sa borne ◀ (tranche 2100 : 🌈 ⛽ 🛢 🪾, CLICS.trancheActive) ; ses masses 🔀 restent celles de 2100.
window.TIMELINE_FUTUR = { '📅': '🔮', '▶': 2100, '◀': 2300 };

/**
 * Index des époques : TIMELINE, plus les alias que lisent la géologie et l'interface
 * (type / name / id / startYears / endYears). C'est la même donnée ET les mêmes objets (accesseurs), pas une copie.
 *
 * Il vivait dans configOrganigramme.timeline, recopié par le loader de l'application : la géologie
 * (API_BILAN/geology) devait donc lire une config de DIAGRAMME pour résoudre une époque — l'API ne
 * pouvait pas tourner sans l'application. Il naît maintenant avec TIMELINE.
 *
 * Construit à la demande, pas au chargement : CHARS_DESC (data/alphabet.js) arrive après ce fichier.
 */
window.epochIndex = function () {
    // Nom = CHARS_DESC[id] (data/alphabet.js), qui couvre aussi les ids texte (hysteresis …) : une seule source.
    // (v-2026-10-14 : NOMS_HORS_ALPHABET en était une copie ; renommer 1a dans l'une seule cassait la frise.)
    // RÉFÉRENCE UNIQUE : on rend les entrées de TIMELINE ELLES-MÊMES, pas des copies. Les alias sont des
    // accesseurs non énumérables, lus à la demande dans 📅 / ▶ / ◀ / CHARS_DESC : rien n'est dupliqué, et ils
    // n'apparaissent ni dans Object.keys, ni dans un JSON, ni dans un { ...epoch }. Avant (v1.4.89), chaque
    // appel fabriquait des copies figées : une écriture (ex. geothermal_flux de 🔥) s'y perdait, et une
    // modification de TIMELINE en mémoire (tuning, dichotomie d'hystérésis) n'y arrivait pas.
    for (const item of window.TIMELINE) {
        if (Object.prototype.hasOwnProperty.call(item, 'type')) continue;   // déjà indexée
        Object.defineProperties(item, {
            type:       { get() { return this['📅'] ? 'epoch' : 'separator'; } },
            id:         { get() { return this['📅']; } },
            name:       { get() { return window.CHARS_DESC[this['📅']]; } },
            startYears: { get() { return this['▶']; } },
            endYears:   { get() { return this['◀']; } }
        });
    }
    return window.TIMELINE;
};

/**
 * Repères littérature (bench / colonnes T init + CONV ATM dans epoch_bench.html).
 * Clés = EPOCH['📅'] (identifiants TIMELINE + entrées hysteresis 1a/1b).
 * Recalculé en mémoire à chaque chargement de ce script — ne pas persister dans CSV ni cookie.
 * tC = °C surface ; co2/ch4 = ppm molaires ; h2oVap = % molaire vapeur atmosphérique.
 */
// ═══════════════════════════════════════════════════════════════════════════
// FOURCHETTES DE LITTÉRATURE DU BANC — et pourquoi elles sont des FOURCHETTES
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ La température moyenne ABSOLUE de la Terre est bien moins bien connue que ses ANOMALIES.
//    Les séries (GISTEMP, HadCRUT, ERA5) mesurent des écarts à ±0,05 °C près ; la valeur absolue,
//    elle, vaut ±0,5 °C (Jones et al. 1999, Rev. Geophys. 37:173). C'est CETTE incertitude-là que
//    la largeur des fourchettes doit porter — pas un intervalle serré autour d'un chiffre canonique.
//
// ─── L'ANCRAGE MODERNE, refait le 2026-09-23 sur données primaires ────────────────────────
//   anomalie an 2000 vs 1951-1980 : +0,39 °C     (NASA GISTEMP v4, GLB.Ts+dSST, série mesurée)
//   moyenne 1996-2004 (9 ans)     : +0,50 °C     (même série, dé-bruitée de l'ENSO)
//   absolu de référence 1951-1980 : 14,0 °C ± 0,5 (Jones et al. 1999 ; climatologie GISTEMP)
//   → an 2000 = 14,0 + 0,39 = 14,4 °C   ·   moyenne 1996-2004 = 14,5 °C
//
//   RECOUPEMENT par un chemin indépendant (réanalyse, pas stations) :
//     ERA5 / Copernicus : 1991-2020 = 14,4 °C en absolu
//     GISTEMP : anomalie 1991-2020 vs 1951-1980 = +0,613 ; 1961-1990 = +0,100
//     → 14,0 + 0,613 − 0,100 = 14,51 °C.  Les deux ancrages concordent à 0,11 °C.
//
//   ⚠️ LA CONFIG ÉTAIT CENTRÉE 0,50 °C TROP HAUT. 🌡️🧮 = 288,15 K = 15,00 °C et la fourchette
//   [14,5 ; 15,5] venaient du 288 K des manuels — le « 255 K + 33 K d'effet de serre » — pas
//   d'une mesure. 15 °C reste dans l'incertitude absolue, mais ce n'est pas le meilleur estimé.
//
// ─── LE PRÉINDUSTRIEL ─────────────────────────────────────────────────────────────────────
//   1850-1900 = 0,88 °C sous la moyenne 1991-2020 (Copernicus, ESOTC 2024) → 14,4 − 0,88 = 13,5 °C.
//
// ─── LE PHANÉROZOÏQUE : PhanDA ────────────────────────────────────────────────────────────
//   Judd et al. 2024, Science 385:eadk3705 — « A 485-million-year history of Earth's surface
//   temperature ». Assimilation de données : plus de 150 000 mesures proxy publiées (5 familles)
//   combinées à 850 simulations. Sortie utilisée ici : PhanDA_GMSTandCO2_percentiles.csv
//   (github.com/EJJudd/PhanDA, 5_Outputs), percentiles 5/50/95 de GMST par étage stratigraphique.
//
//   Méthode appliquée, mécanique : pour chaque époque, on prend l'étage qui contient son ▶ (la
//   config dit « valeurs au DÉBUT de chaque époque ») et on retient [GMST_05, GMST_95] arrondi.
//   Prendre l'étendue de TOUTE l'époque mélangerait variation temporelle et incertitude — 🦕
//   donnerait [9, 44], ce qui ne teste plus rien.
//
//   Écarts avec l'ancien tableau, et ils sont gros — les fourchettes paléo étaient trop FROIDES :
//     🍄 [15,25] → [26,39]   🦤 [12,22] → [25,32]   🐊 [20,28] → [30,37]   🏔 [12,18] → [21,25]
//     💀 [21,32] → [15,24]   🦕 [21,31] → [24,32]   🦣 [10,16] → [13,16]   🛖 [13,15] inchangée ✅
//   Cohérence d'échelle : PhanDA donne l'Holocène à 14,0 °C, ce qui recoupe le préindustriel
//   13,5 et l'an 2000 à 14,4 — tout le tableau est sur le même zéro absolu.
//
//   ⚠️ PhanDA s'arrête à 486,9 Ma. 🪼 (▶ = 600 Ma), 🦠, 🪸 et les trois états d'hystérésis
//   néoprotérozoïques ne sont PAS couverts : leurs fourchettes sont INCHANGÉES et restent
//   non re-sourcées. 🔥 Hadéen non plus — sa fourchette [2300, 2800] est un choix assumé, la
//   littérature ne contraignant pas la surface d'un océan de magma à 4,5 Ga.
//
//   ⚫ Corps noir fait exception dans l'autre sens : sa fourchette est CALCULABLE,
//   T_eq = [S(1−A)/4σ]^¼ = −18,5 °C pour S = 1361 W/m² et A = 0,293, bien dans [−19, −17]. ✅
//
// ─── LA GRAINE 🌡️🧮 ET LA FOURCHETTE tC SONT LA COURBE CYAN ─────────────────────────────────
//   Ni l'une ni l'autre n'est écrite dans ce fichier : à ▶ de chaque époque, 🌡️🧮 = la médiane et tC = la
//   bande de la courbe de la littérature que trace l'onglet Histoire (CO2/static/histoire/litterature.js,
//   L.a(t)) — accesseurs en fin de fichier. Le banc juge donc le modèle sur la bande que la page dessine.
//   Les états d'hystérésis y sont aussi : la courbe met la glace (−48 °C) sur ⛄ et 🏂, la serre de sortie
//   (50 °C) sur 1b et 1c ; leur graine SÉLECTIONNE UNE BRANCHE — la remesurer si la courbe change.
//   tCRepere : la fourchette des sources propres à chaque époque (PhanDA 5–95 % de l'étage à ▶, Copernicus,
//   GISTEMP…, ou ⚠️ non sourcée), avec son src. Le banc l'affiche en blanc à côté de tC pour voir l'écart ;
//   elle ne juge rien. Les fourchettes h2oVap (C-C « à tC ») sont calculées sur elle.
//
// ─── CHAQUE FOURCHETTE DIT D'OÙ ELLE VIENT : champ src (2026-09-23) ──────────────────────
//   Ne pas faire confiance aveuglément à une fourchette : chacune porte son statut et sa référence.
//     ✅  mesure / donnée publiée (PhanDA, carottes de glace, NOAA, GISTEMP…) — référence citée
//     🧮  équation (C-C, corps noir) appliquée à des grandeurs sourcées — la formule est citée
//     ⚠️  non sourcée : un ordre de grandeur hérité, à ne pas prendre pour une cible
//     🔀  hystérésis : repère de l'épisode, PAS une cible (voir l'encadré « ÉPOQUES D'HYSTÉRÉSIS »)
//
//   CO₂ DES ÉPOQUES DE PhanDA (racines de 🍄 💀 🦕 🦤 🐊 🏔 🦣, états 🔁 de 🍄) — une seule convention, celle de la courbe cyan :
//   la colonne CO2_50 de PhanDA_GMSTandCO2_percentiles.csv, interpolée en ln CO₂ entre les âges moyens (AverageAge) des deux
//   étages qui encadrent la date ; les fourchettes co2 du banc sont les colonnes CO2_05 et CO2_95 interpolées de même. Les bornes
//   d'étage de PhanDA ne sont pas celles de l'ICS (Pridoli 419,0–422,73 Ma) : « l'étage à ▶ » n'était pas défini à une borne.
//   hysteresis 2 garde son CO₂ (config frontière). Plus jeune que 800 ka, les carottes (🛖, états de 🦣) ; 🚂 et 📱, les mesures.
//
// ─── CH₄ DES ÉPOQUES ──────────────────────────────────────────────────────────────────────
//   Règle : la mesure à la date quand elle existe (carottes : 🛖 et les états de 🦣 ; Law Dome : 🚂 ; NOAA : 📱). Sinon, la
//   simulation publiée la plus proche : Beerling et al. 2011 (PNAS 108:9770, tableau 1) simulent des ÉTATS séparés, chacun avec
//   sa géographie et ses zones humides — préindustriel moderne 695 ppb ; Éocène précoce (55 Ma) 2 580 ppb à 2 × CO₂ (560 ppm) et
//   3 614 ppb à 4 × CO₂ (1 120 ppm) ; Crétacé supérieur (90 Ma) 3 304 ppb à 4 × CO₂. La source ne donne pas de loi CH₄(CO₂) ;
//   on n'en garde que ce qu'elle dit : de 🍄 à 🏔 (états 🔁 de 🍄 et hysteresis 2 compris), géographie de l'Éocène, interpolée
//   en ln CO₂ entre ses deux expériences et tenue à la plus proche hors de [560 ; 1 120] ppm (🍄 et 🐊 : 3,614 ppm ; états 🔁 2–3
//   de 🍄 : 2,58 ppm) — 💻, ❔ hors de la géographie et du CO₂ simulés ; 🦣 (géographie moderne) : 695 ppb. Le segment 1 × → 2 ×
//   change de géographie : ce n'est pas un effet du CO₂, il ne sert pas. hysteresis 2 suit la règle de 🏔 (une config frontière ne
//   change que son CO₂). Le modèle de boîte de Bartdorff et al. 2008 (Global Biogeochem. Cycles 22:GB1008) monte jusqu'à ~10 ppm
//   dans les marécages à charbon du Carbonifère — 📖, sa série par date n'est pas dans le dépôt. Le Précambrien (🔥 🦠 🪸, air
//   sans oxygène), 🪼 (avant les plantes terrestres : 0,697 ppm de 1750 ⚠️) et les configs frontières 1a, ⛄, 1b, 1c gardent
//   leur CH₄ ⚠️.
//   Fourchettes ch4 du banc de 🍄 à 🏔 : aucune mesure du CH₄ — la règle ci-dessus aux CO₂ 5 % et 95 % de PhanDA, 📖 : elles ne
//   contrôlent pas la config, qui en sort. 🚂 : fourchettes à ▶ = 1750 (Law Dome, MacFarling Meure et al. 2006).
//
//   h2oVap — AUCUNE mesure paléo n'existe. La littérature mesure le présent : humidité relative de
//   surface 75–80 % sur les océans, 70–80 % sur les terres, et q de surface +4,9 %/°C à l'échelle
//   globale (Dai 2006, J. Climate 19:3589) ; +7 %/K pour la colonne (Held & Soden 2006, J. Climate
//   19:5686). Les fourchettes sont donc CALCULÉES : x = RH · e_sat(T) / P, RH ∈ [0,70 ; 0,80],
//   T ∈ tC, e_sat de Murphy & Koop 2005 (eau liquide, glace sous 0 °C), P = pression de surface.
//   ⚠️ C'est la vapeur À LA T MOYENNE : la vraie moyenne globale est plus haute (e_sat est convexe,
//   les tropiques dominent) — Pierrehumbert 2005 (Snowball, GCM) : ~0,7 kg/m² subtropical. Le modèle
//   calcule la même grandeur 0D que la fourchette : la comparaison est homogène, pas la réalité.
//   Les anciennes fourchettes h2oVap, non sourcées, étaient incohérentes avec leur propre tC.
//
//   Historique des commentaires de l'ancien tableau :
//   🐧 hystérésis 2 (prélude glaciaire, 35 Ma) — absente du tableau jusqu'au 2026-09-23, d'où le « — » au banc.
//   🚂 1800 — tC v-2026-09-23 : [13 ; 15] → [13,0 ; 14,0]. Centre = 13,5 °C, le préindustriel
//   1850-1900 (Copernicus ESOTC 2024 : 0,88 °C sous 1991-2020 = 14,4 °C). Largeur ±0,5 comme 📱.
//   📱 ▶ = 2000 : repères = OBSERVATIONS an 2000 (NOAA : CO₂ 369,7 ppm Mauna Loa ; CH₄ 1,77 ppm global). 2025 (424 ppm) = résultat du clic 🛢 de 2000.
//   co2 [365, 375] : NOAA an 2000 = 369,7 ppm en AIR SEC. Le banc affiche l'air sec depuis le 2026-09-23
//   (demo/js/epoch_bench_format.js v1.1.0) ; avant, il sortait l'air humide et 📱 tombait à 363.
//   tC v-2026-09-23 : [14,5 ; 15,5] → [13,9 ; 14,9]. Centre = 14,4 °C (GISTEMP v4, anomalie 2000
//   +0,39 sur un absolu 1951-1980 de 14,0 °C), largeur = ±0,5 °C, l'incertitude PUBLIÉE sur
//   l'absolu (Jones et al. 1999). La moyenne 1996-2004, 14,5 °C, tombe dedans. Voir l'encadré.
// ═══════════════════════════════════════════════════════════════════════════
window.BENCH_LIT_BY_EPOCH_ID = {
    '⚫': { tCRepere: [-19, -17], co2: [0, 1], ch4: [0, 0.1], h2oVap: [0, 0.01],
        src: { tCRepere: "🧮 T_eq = [S(1−A)/4σ]^¼",
               co2: "🧮 pas d'atmosphère",
               ch4: "🧮 pas d'atmosphère",
               h2oVap: "🧮 pas d'eau" } },
    '🔥': { tCRepere: [2300, 2800], co2: [100000, 500000], ch4: [10, 100], h2oVap: [10, 20],
        src: { tCRepere: "⚠️ non sourcée (choix assumé : océan de magma)",
               co2: "⚠️ non sourcée",
               ch4: "⚠️ non sourcée",
               h2oVap: "⚠️ non sourcée (hors régime C-C : 2500 °C)" } },
    '🦠': { tCRepere: [5, 25], co2: [50000, 150000], ch4: [1000, 10000], h2oVap: [0.27, 1.1],
        src: { tCRepere: "⚠️ non sourcée (hors PhanDA)",
               co2: "⚠️ non sourcée",
               ch4: "⚠️ non sourcée",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🪸': { tCRepere: [0, 15], co2: [11000, 175000], ch4: [50, 500], h2oVap: [0.43, 1.36],
        src: { tCRepere: "⚠️ non sourcée (hors PhanDA)",
               co2: "✅ paléosols ~2,5 Ga : 45–140 mbar (Kanzaki & Murakami 2015, GCA 159:190) ; Sheldon 2006 2 à 5× moins → 9–140 mbar ≈ 11 000–175 000 ppm à ~0,8 atm (Charnay et al. 2020)",
               ch4: "⚠️ non sourcée",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    'hysteresis 1a': { tCRepere: [5, 15], co2: [500, 2000], ch4: [10, 50], h2oVap: [0.61, 1.37],
        src: { tCRepere: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               co2: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               ch4: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               h2oVap: "🔀 hystérésis : repère, PAS une cible (config frontière)" } },
    '⛄': { tCRepere: [-60, -50], co2: [300, 1500], ch4: [0.1, 10], h2oVap: [0.00076, 0.0032],
        src: { tCRepere: "⚠️ non sourcée (hors PhanDA)",
               co2: "⚠️ non sourcée — ⚠️ = CO₂ de 1a par construction",
               ch4: "⚠️ non sourcée",
               h2oVap: "🧮 C-C sur GLACE (Murphy & Koop 2005) × RH [0,70 ; 0,80] à tC — ⚠️ T moyenne 0D : Pierrehumbert 2005 (GCM) donne ~0,7 kg/m² d'eau précipitable subtropicale, bien plus" } },
    'hysteresis 1b': { tCRepere: [20, 50], co2: [10000, 100000], ch4: [10, 100], h2oVap: [1.61, 9.73],
        src: { tCRepere: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               co2: "💻 sortie de snowball : 0,01–0,1 en fraction de volume, selon l'albédo de la glace tropicale (Hoffman et al. 2017, Sci. Adv. 3:e1600983, d'après les modèles) ; ~10² PAL à la sortie Marinoenne (Δ¹⁷O, Bao et al. 2008) — v-2026-10-14, était [2 000 ; 10 000] non sourcé",
               ch4: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               h2oVap: "🔀 hystérésis : repère, PAS une cible (config frontière)" } },
    // v-2026-09-24 : 2ᵉ glaciation cryogénienne (Marinoen) — mêmes repères que ⛄ / 1b, non sourcés.
    '🏂': { tCRepere: [-60, -50], co2: [300, 1500], ch4: [0.1, 10], h2oVap: [0.00076, 0.0032],
        src: { tCRepere: "⚠️ non sourcée (hors PhanDA)",
               co2: "⚠️ non sourcée — ⚠️ = frontière d\'entrée du Marinoen (1b y glisse)",
               ch4: "⚠️ non sourcée",
               h2oVap: "🧮 C-C sur GLACE (Murphy & Koop 2005) × RH [0,70 ; 0,80] à tC — ⚠️ T moyenne 0D : Pierrehumbert 2005 (GCM) donne ~0,7 kg/m² d'eau précipitable subtropicale, bien plus" } },
    'hysteresis 1c': { tCRepere: [20, 50], co2: [10000, 100000], ch4: [10, 100], h2oVap: [1.61, 9.73],
        src: { tCRepere: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               co2: "💻 sortie de snowball : 0,01–0,1 en fraction de volume, selon l'albédo de la glace tropicale (Hoffman et al. 2017, Sci. Adv. 3:e1600983, d'après les modèles) ; ~10² PAL à la sortie Marinoenne (Δ¹⁷O, Bao et al. 2008) — v-2026-10-14, était [2 000 ; 10 000] non sourcé",
               ch4: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               h2oVap: "🔀 hystérésis : repère, PAS une cible (config frontière)" } },
    'hysteresis 2': { tCRepere: [25, 28], co2: [711, 907], ch4: [1, 5], h2oVap: [2.22, 3.03],
        src: { tCRepere: "🔀 hystérésis : repère, PAS une cible (config frontière) — PhanDA Priabonien",
               co2: "🔀 hystérésis : repère, PAS une cible (config frontière) — PhanDA Priabonien",
               ch4: "🔀 hystérésis : repère, PAS une cible (config frontière)",
               h2oVap: "🔀 hystérésis : repère, PAS une cible (config frontière)" } },
    '🪼': { tCRepere: [15, 25], co2: [1500, 5000], ch4: [5, 20], h2oVap: [1.19, 2.54],
        src: { tCRepere: "⚠️ non sourcée (▶ 600 Ma, hors PhanDA)",
               co2: "⚠️ non sourcée",
               ch4: "⚠️ non sourcée",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🍄': { tCRepere: [26, 39], co2: [472, 3991], ch4: [2.58, 3.614], h2oVap: [2.36, 5.6],
        src: { tCRepere: "✅ PhanDA GMST Pridoli",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Pragian/Lochkovian et Pridoli",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '💀': { tCRepere: [14.3, 20.7], co2: [463, 1600], ch4: [2.58, 3.614], h2oVap: [1.14, 1.95],
        src: { tCRepere: "✅ PhanDA GMST Changhsingien (▶ = 252,2 Ma)",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Induen et Changhsingien",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🦕': { tCRepere: [24, 32], co2: [456, 1619], ch4: [2.58, 3.614], h2oVap: [2.08, 3.79],
        src: { tCRepere: "✅ PhanDA GMST Induen",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Induen et Changhsingien",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🦤': { tCRepere: [25, 32], co2: [687, 1072], ch4: [2.88, 3.55], h2oVap: [2.22, 3.81],
        src: { tCRepere: "✅ PhanDA GMST Danien",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Sélandien/Danien et Maastrichtien",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🐊': { tCRepere: [30.3, 39.2], co2: [1049, 1491], ch4: [3.52, 3.614], h2oVap: [3.02, 5.66],
        src: { tCRepere: "✅ PhanDA GMST étage PETM (▶ = 56,0 Ma)",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre PETM et Thanétien",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🏔': { tCRepere: [21, 25], co2: [648, 823], ch4: [2.80, 3.15], h2oVap: [1.78, 2.59],
        src: { tCRepere: "✅ PhanDA GMST Rupélien",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Rupélien et Priabonien",
               ch4: "📖 aucune mesure du CH₄ : la règle de l'encadré « CH₄ DES ÉPOQUES » (Beerling et al. 2011, PNAS 108:9770, tableau 1 : interpolée en ln CO₂ entre 560 et 1 120 ppm, tenue à la plus proche au-delà) aux CO₂ 5 % et 95 % de PhanDA, ne contrôle pas la config",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🦣': { tCRepere: [13, 16], co2: [259, 306], ch4: [0.4, 0.8], h2oVap: [1.07, 1.49],
        src: { tCRepere: "✅ PhanDA GMST Gélasien",
               co2: "✅ PhanDA (Judd 2024) CO₂ 5–95 %, interpolés en ln à ▶ entre Gélasien et Plaisancien",
               ch4: "✅ EPICA Dome C 350–800 ppb sur les cycles (Loulergue 2008, Nature 453:383) — couvre les états 🔁",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🛖': { tCRepere: [13, 15], co2: [243, 270], ch4: [0.46, 0.70], h2oVap: [1.05, 1.37],
        src: { tCRepere: "✅ PhanDA GMST Holocène",
               co2: "✅ carottes antarctiques à ▶ ± 1 ka (composite de Bereiter et al. 2015) : étendue des mesures",
               ch4: "✅ EPICA Dome C à ▶ ± 1 ka (Loulergue et al. 2008) : étendue des mesures, à cheval sur le saut du Dryas récent",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '🚂': { tCRepere: [13, 14], co2: [272, 282], ch4: [0.67, 0.73], h2oVap: [1.07, 1.31],
        src: { tCRepere: "✅ Copernicus ESOTC 2024 (préindustriel 13,5 °C) ± 0,5 absolu (Jones 1999)",
               co2: "✅ Law Dome 1750 = 276,8 ppm (MacFarling Meure 2006, spline 20 ans) ± 5 (variabilité préindustrielle)",
               ch4: "✅ Law Dome 1750 = 0,697 ppm (même source) ± 0,03",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } },
    '📱': { tCRepere: [13.9, 14.9], co2: [365, 375], ch4: [1.7, 1.85], h2oVap: [1.11, 1.36],
        src: { tCRepere: "✅ GISTEMP v4 + Jones 1999 : 14,4 °C ± 0,5",
               co2: "✅ NOAA Mauna Loa 2000 = 369,7 ppm (air sec)",
               ch4: "✅ NOAA GML moyenne globale 2000 ≈ 1,77 ppm",
               h2oVap: "🧮 C-C (Murphy & Koop 2005) × RH mesurée [0,70 ; 0,80] (Dai 2006) à tC, P modèle" } }
};

// Fourchettes DATÉES : la littérature à l'année où un clic arrive (banc : window.benchLitA), mesures seulement — la mesure, à
// la largeur de la fourchette de l'époque à ▶.
(function () {
    const autour = (v, r) => [v - (r[1] - r[0]) / 2, v + (r[1] - r[0]) / 2];
    const B = window.BENCH_LIT_BY_EPOCH_ID;
    window.BENCH_LIT_DATEES = {
        '📱': {
            2025: { co2: autour(427.35, B['📱'].co2), ch4: autour(1.936, B['📱'].ch4),
                src: { co2: "✅ NOAA Mauna Loa 2025 = 427,35 ppm (air sec, moyenne annuelle), à la largeur de la fourchette de 2000",
                       ch4: "✅ NOAA GML moyenne globale 2025 = 1,936 ppm, à la largeur de la fourchette de 2000" } }
        }
    };
})();

// Paramètres de calcul (convergence radiatif)
// Convention de source :
// - [OBS/CALIB] : valeur issue d'observations/littérature ou calibration sur observations
// - [EQ/NUM]    : valeur de schéma numérique, solveur ou stratégie de convergence
window.CONFIG_COMPUTE = window.CONFIG_COMPUTE || {};

// Partition CO₂ atmosphère ↔ océan (Henry — Van 't Hoff, 2400 K).
// v1.4.30 : POMPE TOUJOURS ACTIVE (bench = visu). Flag co2OceanPartitionInRadiativeConvergence RETIRÉ
// (obsolète — remplacé par EPOCH['🌊🏭'] facteur par époque ∈ [0, +∞[ ; 0 = Urey éteint).
// L'équilibre à l'init est garanti par initForConfig (seed ⚖️🌊🏭 = ratio_ref × ⚖️🏭).
//
// co2OceanRatioRef : rapport Masse CO2_océan / Masse_CO2_atm de RÉFÉRENCE, à T_ref = T̄ de la Terre actuelle
// (INTERIEUR.CONST.T_S0, lue par co2/calculations_co2.js). 50 ≈ Terre moderne (Sarmiento & Gruber 2006, Ocean Biogeochemical
//   Dynamics, Tab. 10.2.1 : ~38 000 GtC océan / ~760 GtC atm des années 1990 → ratio ≈ 50). Crash-first (lu sans fallback).
window.CONFIG_COMPUTE.co2OceanRatioRef = 50;
// Flag de test pompe CO₂ océan : 1 = actif, 0 = coupé (seed océan inclus), >1 = amplification volontaire.
// ⚠️ [v1.4.83] Mesuré inerte : bench identique au centième avec 0 (initForConfig re-seed l'océan à chaque calcul,
//   getMasses réécrit ⚖️🏭 à chaque pas). L'absorption du CO₂ INJECTÉ est portée par CARBON_SINKS ci-dessous.
window.CONFIG_COMPUTE.co2OceanPartitionFactor01 = 1;
// Efficacité de la pompe Henry (fraction du pas vers l'équilibre) : seule source (la cible de fine-tuning du
// même nom, jamais lue, est retirée). 0,1 = la valeur que la physique utilisait (calculations_co2.js < v1.4.0).
window.CONFIG_COMPUTE.co2OceanEffPump01 = 0.1;

// ─── PUITS DE CARBONE (CO₂ injecté par événements, ex. 📱 ⛽/🛢/🪾) — v1.4.92 ────────────────
// Modèle de PERTURBATION : la composition de chaque époque (config) est un équilibre ; seul le CO₂ injecté E
// (📜🔺⚖️🏭) est partagé entre atmosphère, océan (O = 📜🔺⚖️🌊🏭) et forêts (L = 📜🔺⚖️🌳🏭).
// Atmosphère = ⚖️🏭 époque + E − O − L (conservation, compute.js getMasses). CO2.advanceCarbonSinks intègre
// l'événement par pas de stepYears, remis à 0 avec E au changement d'époque (setEpoch).
//
//  OCÉAN — TROIS RÉSERVOIRS. Chacun relaxe vers k_i·A, où A = excès resté dans l'air (E − L − ΣO) et
//    k_i = (ratio_i / R)·exp(2400·(1/T − 1/T_ref)). À l'équilibre ΣO = (Σratio/R)·A : la CAPACITÉ TOTALE
//    de l'océan est inchangée (Σratio = co2OceanRatioRef = 50, Sarmiento & Gruber 2006). Seuls les TEMPS
//    diffèrent — et c'était là l'erreur : une boîte unique à τ = 50 ans faisait ventiler l'océan ENTIER
//    (38 000 GtC) en un demi-siècle. Sur 100 ans elle avalait presque tout l'émis (fraction aéroportée
//    tombée à 1 % en 2100 sur ⛽) alors que la mesure la donne stable à 0,44 ± 0,06 depuis 65 ans
//    (Friedlingstein et al. 2023 ESSD 15:5301).
//      • couche de mélange 0–100 m — ~900 GtC de CID, soit ratio ≈ 1,2 ; équilibre gazeux air-mer en
//        ~1 an (Broecker & Peng 1982, Tracers in the Sea).
//      • thermocline 100–1000 m — ~7 600 GtC, ratio ≈ 10 ; ventilée en ~50 ans. C'est LA fourchette que
//        donnent les traceurs CFC et le radiocarbone des bombes (Sabine et al. 2004 Science 305:367), et
//        c'est là que se trouve l'essentiel du carbone anthropique mesuré. La v1.4.83 citait bien cette
//        référence, mais appliquait ses 50 ans à l'océan entier.
//      • océan profond > 1000 m — le reste (~29 000 GtC, ratio 38,8) ; renouvelé par la circulation
//        thermohaline, τ de l'ordre de 350 ans. C'est le paramètre le MOINS contraint des trois : il ne
//        joue presque pas sur 2000-2100 (7 % de relaxation en 25 ans) mais fixe le très long terme.
//    R = facteur de Revelle (chimie des carbonates mesurée) : ~10 vers 370 ppm, croît avec le CO₂ → saturation.
//      Sabine et al. 2004 ; Egleston, Sabine & Morel 2010 Glob. Biogeochem. Cycles 24:GB1002.
//    2400 K = Van 't Hoff solubilité CO₂ (eau plus chaude = moins de dissolution, même loi que calculateCO2Partition).
//
//  TERRES — TROIS MÉCANISMES DISTINCTS, un chiffre publié pour chacun, aucun calage.
//    Le puits terrestre mesuré n'est pas de la fertilisation CO₂ pure : la version d'avant ne modélisait
//    que celle-là et plafonnait à 21,9 % des émissions contre ~30 % mesurés.
//      1. FERTILISATION — ΔNPP = NPP0·β_eff·ln(C/C0), stock relaxant vers ΔNPP·τ.
//         NPP0 = 56 GtC/an (Field et al. 1998 Science 281:237) ; τ = 23 ans (Carvalhais et al. 2014
//         Nature 514:213). β_eff = f_jeune·β_jeune + (1−f_jeune)·β_mature — voir sinks_land.js.
//         β_jeune = 0,605 : Norby et al. 2005 PNAS 102:18052, +23 % de NPP à 550 ppm pour un ambiant
//           FACE de ~376 ppm → 0,23/ln(550/376). Ces parcelles avaient 10-20 ans.
//         β_mature = 0 : sur forêt MATURE le CO₂ enrichi ne donne aucun gain de biomasse — EucFACE
//           (Jiang et al. 2020 Nature 580:227 : +12 % de photosynthèse, rendus au sol par la respiration) et
//           Web-FACE (Körner et al. 2005 Science 309:1360). Le stock ne gagne rien : 0, la valeur mesurée.
//         f_jeune = 0,358 : part de forêt de moins de 30 ans en 2000, agrégée depuis GFADv1.1
//           (Poulter et al. 2019, PANGAEA doi:10.1594/PANGAEA.897392) par scripts/gfad_young_forest_fraction.py
//           du dépôt CO2. Bornes du jeu de données : 0,30 – 0,48. La fenêtre de 30 ans vient de Tang
//           et al. 2014 PNAS 111:8856 (la NPP culmine entre 10 et 40 ans puis redescend).
//         → β_eff = 0,217. Appliquer 0,605 à toute la forêt mondiale, dont les deux tiers ne sont pas
//           jeunes, c'était le biais d'échelle classique des FACE.
//      2. DÉPÔT D'AZOTE — 0,7 GtC/an après 2000, soit ~20 % du puits terrestre (O'Sullivan et al. 2019
//         Glob. Biogeochem. Cycles 33:163). Flux NET, cumulé sans relaxation. Indexé sur les émissions
//         (0,7 GtC pour 38,9 GtCO₂/an) : l'azote réactif est un co-produit de la combustion et de
//         l'agriculture, une injection volcanique n'en dépose pas.
//      3. REPOUSSE FORESTIÈRE — 1,30 GtC/an en 2001-2010 dans les peuplements en repousse après
//         perturbation passée, contre 0,85 en forêt primaire intacte (Pugh et al. 2019 PNAS 116:4382).
//         Héritage du XXᵉ siècle, indépendant du CO₂ et de l'azote ; décroît en 66 ans (temps de
//         reconstitution de la biomasse, même source).
//
//    Résultat 2000→2025 sans aucun ajustement : terres 28,6 % (fertilisation 10,2 · azote 6,6 ·
//    repousse 11,8) contre ~30 % mesurés, océan 23,5 % contre ~26 %. Les trois publications, prises
//    telles quelles, tombent à 1,4 point du total mesuré — c'est une VÉRIFICATION, pas un calage.
//
//  ⚠️ CE QUI RESTE OUVERT
//    Fraction aéroportée 47,9 % contre 44,3 % mesurés : il manque ~3,5 points de puits, répartis
//    entre océan et terres. Et le terme de repousse est pour l'instant une décroissance IMPOSÉE ;
//    quand le bouton 🪾 existera, il devra devenir la conséquence des coupes simulées (couper du
//    mature remplit le pool jeune, qui reconstitue sa biomasse sur landRegrowthTauYears).
window.CONFIG_COMPUTE.CARBON_SINKS = {
    // Pas d'intégration des deux puits (années). L'événement dure 🔺⏳ ; advanceCarbonSinks le découpe
    // en pas de stepYears, étale l'émission et relaxe pas à pas. 1 an = intégrale juste ; mettre 25
    // reproduit l'ancien pas unique (le CO₂ de fin de tranche absorbé comme celui du début — faux).
    stepYears: 1,
    // Σ ratio DOIT valoir co2OceanRatioRef (50) : même capacité totale, temps différents. Crash sinon.
    oceanBoxes: [
        { nom: 'couche de mélange', ratio: 1.2,  tauYears: 1 },
        { nom: 'thermocline',       ratio: 10.0, tauYears: 50 },
        { nom: 'océan profond',     ratio: 38.8, tauYears: 350 }
    ],
    oceanRevelleRef: 10,          // R à oceanRevelleRefPpm
    oceanRevelleRefPpm: 370,
    oceanRevelleSlopePerPpm: 0.014, // Egleston 2010 : R ≈ 10 (370 ppm) → ≈ 16 (800 ppm)
    landNpp0GtC: 56,              // Field 1998
    landTauYears: 23,             // Carvalhais 2014
    // Fertilisation pondérée par l'âge — c'est ce qui corrige le biais d'échelle des FACE.
    landBetaYoung: 0.605,         // Norby 2005 (parcelles de 10-20 ans)
    landBetaMature: 0,            // Jiang 2020 EucFACE + Körner 2005 Web-FACE : aucun gain de biomasse mesuré
    landYoungFraction0: 0.358,    // GFADv1.1 [0,30–0,48] — scripts/gfad_young_forest_fraction.py (dépôt CO2)
    // Dépôt d'azote : 0,7 GtC/an pour 38,9 GtCO₂/an émis (O'Sullivan 2019). Indexé sur les émissions
    // pour rester nul dans une époque sans combustion ni agriculture industrielle.
    landNdepGtCPerGtCO2: 0.7 / 38.9,
    // Repousse forestière héritée (Pugh 2019), décroissant sur le temps de reconstitution de biomasse.
    landRegrowth0GtCPerYear: 1.30,
    landRegrowthTauYears: 66
};
// Voile SW additionnel (0–1) depuis jauge hystérésis ⚽ ; s’ajoute à EPOCH[‘🍰⚽’] + 📜[‘🔺🍰⚽’] → DATA[‘🪩’][‘🍰⚽’] obstruction, DATA[‘🪩’][‘🍰🪩⚽’]=1−🍰⚽
// ─── Écarts des zones ────────────
// dT_* : CALCULÉS par le bilan méridien (physics/meridien.js, North 1981), lus par MERIDIEN.ecarts ; zones : EARTH.ZONES
// (physics/physics.js), la seule définition.
// ⚾ OBLIQUITÉ AXIALE ε (degrés), 📜⚾ : l'orbite à la date (La2004, −51 Ma → aujourd'hui, physics/orbite.js) ; avant −51 Ma, la
// clé '⚾' que chaque époque DÉCLARE (window.OBLIQUITE_ACTUELLE_DEG faute de reconstruction ; Archéen ε ~ 45–70°, hyp. Williams
// 1993) — convergence/compute.js crashe si elle manque.
// Effet : insolation journalière de chaque latitude, intégrée sur l'année, du bilan méridien (physics/meridien.js) et forçage des
// boîtes saisonnières (physics/saisons.js), d'où le cycle annuel de chaque bande et sa glace saisonnière.
//
// ─── BORNES PHYSIQUES ACCEPTABLES (et pourquoi pas ! — libre au dialogue avec le modèle) ───
//   ε = 0°   → aucune saison, pas de solstice (limite mathématique)
//   ε ≈ 23.44° → Terre actuelle (IAU 2009). Laskar 1993 : Lune stabilise à ±1.3° sur 5 Ga.
//   ε ∈ [22.0°, 24.5°]  → cycle Milankovitch moderne (41 ka, obliquity signal en δ¹⁸O marin).
//   ε ∈ [0°, 60°]        → plage "sans Lune" (Laskar, Joutel & Robutel 1993, Nature 361:615) :
//                           sans satellite stabilisateur l'axe terrestre diffuse chaotiquement.
//   ε ∈ [45°, 70°]        → hypothèse Williams 1993 (EPSL 117:377) pour expliquer glaciations
//                           basse-latitude du Néoprotérozoïque/Archéen SANS Snowball global.
//                           Argument de Williams : si ε > 54°, l'équateur reçoit MOINS d'insolation
//                           annuelle que les pôles → glaciations tropicales sans refroidir les hautes lat.
//                           L'insolation intégrée jour par jour rend cette inversion d'elle-même.
//   ε = 90°               → "planète couchée" (Uranus-like, 97.8°) ; saison extrême, un pôle en nuit
//                           permanente 6 mois.
//   ε > 90°               → rotation rétrograde — hors cadre ici.
// --- POURQUOI PAS ! --- Tester ε = 54° (seuil Williams), ε = 35° (intermédiaire), ε = 0° (neutre
// saison) pour isoler l'effet de la saisonnalité vs moyennes annuelles. Combinable avec CO₂/CH₄
// pour voir si la saisonnalité "suffit" ou si la physique radiative reste le vrai goulot.

// Valeurs par défaut des jauges fine-tuning (% ) : source unique window.DEFAULT.TUNING.baryByGroup (initDATA.js v1.3.1
// copie ici dans CONFIG_COMPUTE.baryByGroupDefault après DATA['🎚️']). Ne pas dupliquer de littéraux dans ce fichier.

// ===================== [OBS/CALIB] =====================
// Bins spectaux (N utilisé). 500 = courbe propre ; 100 donne courbe moins précise et convergence ~1.2°C (artefact). 🔬🌈 dans [N_min, N_max].
// N_min : optionnel (spectralBinsMinFromHITRAN). Réf. scripts/hitran_spectral_bin_bounds.py.
// 2000 = courbe spectrale lisse. Réduire à 1000 si crash Brave code 5 (RAM).
// edsAttributionByRemoval : l'attribution EDS par gaz (DATA['📛']) est calculée en RETIRANT chaque
// absorbeur à température figée et en lisant la remontée d'OLR — méthode Schmidt et al. 2010 (JGR
// 115:D20106) et Lacis et al. 2010 (Science 330:356), celle dont sortent les chiffres de la littérature.
// Coût : 4 passes spectrales de plus, UNE FOIS par époque à la convergence — pas à chaque itération.
// false → repli sur l'ancienne attribution `sum_blocked` du worker, qui somme les interceptions couche
// par couche : elle recompte 50 fois une bande saturée et une seule fois une fenêtre transparente, et
// donnait les nuages à 3 % de l'EDS quand le retrait en mesure 37 %. Voir doc/DIAGNOSTIC_ATTRIBUTION_EDS.md.
window.CONFIG_COMPUTE.edsAttributionByRemoval = true;
window.CONFIG_COMPUTE.maxSpectralBinsConvergence = 2000;            // [OBS/CALIB]
window.CONFIG_COMPUTE.initSpectralBinsConvergence = 200;            // [OBS/CALIB] N initial (anim : 200 → … → max ; passe finale à max après convergence)
// spectralMaxMB : si défini, pas de passe finale à maxBins si grille dépasserait ce seuil (évite Brave code 5). Ex. 25.
window.CONFIG_COMPUTE.spectralMaxMB = Infinity;                     // [OBS/CALIB] Infinity = pas de plafond ; 25 = skip passe finale si > 25 MB
// Workers spectraux : par défaut nWorkers = navigator.hardwareConcurrency - 1. Optionnel : maxWorkers (ex. 4) pour plafonner.
window.CONFIG_COMPUTE.maxWorkers = Infinity;   // [OBS/CALIB] Infinity = nCPU − 1 ; ex. 4 pour limiter
// Limite RAM (calculations.js) : plafond couches convergence + résolution stockée en DATA['📊'] (évite 1–4 Go heap).
window.CONFIG_COMPUTE.maxLayersConvergence = 800;                   // [OBS/CALIB] max couches atmosphère pour le calcul (z_range écrêté)

window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN = 0;               // [OBS/CALIB] 0 = pas de plancher HITRAN
// true = répartition homogène (poids ∝ largeur région → même densité bins/μm partout) ; false = grille d'origine (converge bien).
window.CONFIG_COMPUTE.spectralGridHomogeneous = true;             // [OBS/CALIB]
// Pondération physique du spin-up : cycles_effectifs = cycles × f(⚖️🫧) × f(⚖️💧). Refs confirmés >= 1 au set.

window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg = 1e18; // [OBS/CALIB]
window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg = 1e20; // [OBS/CALIB]
// Inertie de la glace : celle des calottes seules, τ calculé (physics/calottes.js) ; la glace saisonnière est à l'équilibre.
// Élargissement par la pression : sections efficaces des raies HITRAN à la (T, P) de chaque couche, tables σ(λ, T, P)
// (radiative/calculations.js, tablesSigma, coucheWorker) ; false : tables de 1 atm à toutes les couches.
window.CONFIG_COMPUTE.pressureBroadening = true;                   // [OBS/CALIB]
// factorTropopause (1,0261, [CALIB] « 1,03 + (1,0 − 1,03) × 0,13 ») retiré le 2026-10-13 : il ne réglait plus que la limite
// de la grille verticale fine (ATM.calculateTropopauseHeight = RT/Mg) ; la tropopause sort du profil.
// Gradient thermique : la loi adiabatique du profil (RADIATIVE.loiAdiabatique), aucune constante posée.
// Masse totale eau terrestre (kg), ref pour % météorites de glace (events.js)
window.CONFIG_COMPUTE.earthTotalWaterMassKg = OCEAN_KG;            // [OBS] un océan actuel (en tête de fichier)
// Sans atmosphère (⚫) : stock glace didactique 🍰💧🧊 = min(cap, (⚖️💧/earth)×perPAL) — pas 100 % d’un coup.
window.CONFIG_COMPUTE.noAtmosphereMeteoriteIceCap01 = 0.1;         // plafond 10 % de l’inventaire « phase glace »
window.CONFIG_COMPUTE.noAtmosphereMeteoriteIcePerPAL = 100;        // × fraction PAL eau (~1 clic ☄️ → ~2–3 %)

// ===================== [EQ/NUM] =====================
// — maxDichotomyIterations : boucle EXTERNE uniquement dans simulateRadiativeTransfer → performDichotomy (iterate dans calculations.js) ; chaque pas appelle calculateFluxForT0 une fois.
// — maxRadiatifIters : boucle INTERNE computeRadiativeTransfer (calculations_flux.js, compteur DATA['🧮']['🧮🔄☀️']) ; le panneau convergence affiche « 🌈 calcul radiatif N » avec N = innerIter+1 → c’est CE plafond qui fixe « 27 » etc.
window.CONFIG_COMPUTE.maxDichotomyIterations = 10;                 // [EQ/NUM] outer simulateRadiativeTransfer uniquement
window.CONFIG_COMPUTE.maxRadiatifIters = 101;                      // [EQ/NUM] inner Search/Dicho API (CONVERGE / scie)
// Plafond T en Search (K). null = pas de plafond (test).
window.CONFIG_COMPUTE.maxSearchT_K = Infinity;                     // [EQ/NUM] plafond du pas Search (K) ; Infinity = aucun
// Tolérances cycle eau (changement albedo/vapor pour relancer tour radiatif)
window.CONFIG_COMPUTE.cycleTolAlbedo = 1e-4;                       // [EQ/NUM]
window.CONFIG_COMPUTE.cycleTolVapor = 1e-6;                        // [EQ/NUM]
// Spin-up climatologique avant solver radiatif (cycles eau/albédo avant convergence). Confirmé >= 0 entier.
// v1.4.17 : réduit 8→1 (les 8 palliaient le bug H2O=0 à Init, désormais corrigé par calculateH2OParameters() avant calculateFluxForT0()).
window.CONFIG_COMPUTE.climateSpinupCycles = 1;                         // [EQ/NUM]
// Cycles eau/albédo par pas radiatif (1 = même résultat visu/scie 16.4°C 2025 ; 2 = visu peut dériver albédo → 15.2°C)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep = 1;             // [EQ/NUM]
// Cycles eau/albédo à l'Init uniquement (T fixe)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit = 1;              // [EQ/NUM]

// ===================== [SOLVER] ===================== source unique SOLVER (v1.4.13)
// Statiques (pas d'UI, pas d'interpolation bary) → CONFIG_COMPUTE directement, pas dans DATA/DEFAULT.
// Lus par calculations_flux.js (computeSearchIncrement, cap 1er pas Search) ; le plancher de tolérance est celui de
// chaque époque (🧲🔬⌊),
// physicsAll.js / calculations_h2o.js (🔺⏳ = accélération pas temps).
// Pas maximal de la recherche de racine (phase Search). Une planète qui refroidit (ou se réchauffe) traverse toutes les
// températures intermédiaires et s'arrête au PREMIER équilibre stable rencontré : le pas doit être plus fin que la fenêtre
// d'une branche chaude. v-2026-10-14 : 140 K (200 K si grand déséquilibre) → 20 K, un seul plafond. À 140 K, l'arrivée de 🔥
// (175 °C) dans 🦠 sautait la branche chaude (frise 15,05 °C) et tombait à −85 °C, gelant toute la chaîne de clics ; à 20 K,
// 🦠 arrive à 15,07 °C (frise = clic). Et jamais plus du double du pas précédent (computeSearchIncrement, calculations_flux.js).
window.CONFIG_COMPUTE.maxSearchStepK = 20;               // [K] [EQ/NUM]
window.CONFIG_COMPUTE.deltaTAccelerationDays = 10;       // [EQ/NUM] 🔺⏳ = 1 jour × this (si acceleration)
// v1.4.17 : firstSearchStepCapK supprimé (patch SB linéarisé historique, désormais obsolète).
// Le 1er pas Search est désormais pris tel quel depuis computeSearchIncrement().


// ===================== [OUTIL/DEBUG/UI] =====================
// Log diagnostic EDS (h2o_eds_scale, bins, delta_z, n_layers, earth_flux, OLR, EDS)
window.CONFIG_COMPUTE.logEdsDiagnostic = false;
// Lissage visuel du spectre (affichage uniquement, pas la physique/OLR)
window.CONFIG_COMPUTE.plotSmoothEnable = true;
window.CONFIG_COMPUTE.plotSmoothSigmaBins = 8.0;//5.6;
// Repères spectre (visu plot.js) : monter les [ ] molécules ; pile EDS + Soleil (image ☀️) centrée en λ
window.CONFIG_COMPUTE.spectralBandIndicatorLiftPx = 14;
window.CONFIG_COMPUTE.spectralEdsSunLambdaUm = 10;
window.CONFIG_COMPUTE.spectralEdsSunStackLiftPx = 26;
// Bandes [ ] spectre : PNG (charsImages) vs emoji ; ImgPxByEmoji = map clef emoji -> px (ex. une seule entree pour CH4)
window.CONFIG_COMPUTE.spectralBandLogoImgPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoEmojiPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoImgPxByEmoji = {};
// Logs diagnostics (défaut false — éviter spam console / ralentissement ; true pour debug ponctuel)
// true : une ligne par calculateAlbedo (T, mer gelée, facteur polaire, cibles, verrous hyst, 🍰🪩🧊 après normalisation surfaces)
window.CONFIG_COMPUTE.logIceFractionDiagnostic = false;
window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic = false;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = false;

window.CONFIG_COMPUTE.logIrisDiagnostic = false;
// pdTrace Henry (CO₂ océan-atmosphère) : load / NO-OP / APPLY
window.CONFIG_COMPUTE.logCo2PartitionDiagnostic = false;
// Fichiers _logs/ (post /_log) : miroir panneau hyst (appendLog) → hyst.txt ; blocs epoch compare → epoch.txt.
// Pas de ?debug= requis ; setTopic(…, { reset: false }).
// v-2026-09-16 : hyst.txt GARDÉ (c'est le journal du test hystérésis, une ligne par pas, celui qu'on relit) ;
//   epoch.txt passé à false (doublon calcul-seul du même contenu, écrit à chaque compute:done).
window.CONFIG_COMPUTE.logHystPanelToFile = true;
window.CONFIG_COMPUTE.logEpochCompareToFile = false;
// Panneau organigramme (breakdown albedo_percents, Corps noir vs surfaces 🪩) → _logs/albedoUi.txt ; sinon window.__ALBEDO_UI_LOG
// v-2026-09-16 : false par défaut (écriture à chaque rafraîchissement du panneau ; diagnostic ponctuel).
window.CONFIG_COMPUTE.logAlbedoUiDiagnostic = false;
// v1.2.59 albedo : snapshot pré-Search 🍰💧🧊/🍰🪩🧊 + blend dt + cible glace_equilibre — permet
// comparaison parcours visu vs bench séquentiel (calibration). _logs/iceSnapshot.txt.
// v-2026-09-16 : false par défaut — une ligne fichier à CHAQUE calculateAlbedo (des centaines par convergence).
window.CONFIG_COMPUTE.logIceSnapshotDiagnostic = false;
// 1 ligne synthétique par époque pendant un run bench multi-époques. Reset au démarrage du run
// (epoch_bench.html via window.logBenchReset()). _logs/bench.txt.
window.CONFIG_COMPUTE.logBenchPerEpoch = true;
// Notes R&D libres écrites par l'agent (window.logRnD). Reset à chaque F5 (wipeAll). _logs/rnd.txt.
window.CONFIG_COMPUTE.logRnDNotes = true;



// ═══════════════════════════════════════════════════════════════════════════
// GRAINE 🌡️🧮 ET FOURCHETTE tC = LA COURBE CYAN (encadré « LA GRAINE … » plus haut)
// window.HISTOIRE.litterature (CO2/static/histoire/litterature.js, chargé après ce fichier) : lue à l'accès, jamais
// recopiée. Âge : ▶ / ◀ géologiques sont déjà « avant le présent » (▶ > ◀) ; calendaires, AN_PRESENT − l'année. Graine de ◀ :
// là où l'époque l'interpole (🕰.◀.📜.🌡️🧮, 🏔 et 🦣).
// ═══════════════════════════════════════════════════════════════════════════
(function () {
    const age = (EP, an) => EP['▶'] > EP['◀'] ? an : window.AN_PRESENT - an;
    const cyan = (EP, an) => window.HISTOIRE.litterature.a(age(EP, an));
    for (const EP of window.TIMELINE) {
        Object.defineProperty(EP, '🌡️🧮', { enumerable: true, get: () => cyan(EP, EP['▶'])[2] + 273.15 });
        const W = EP['🕰'];
        if ('◀' in W && '📜' in W['◀'] && '🌡️🧮' in W['◀']['📜']) {
            Object.defineProperty(W['◀']['📜'], '🌡️🧮', { enumerable: true, get: () => cyan(EP, EP['◀'])[2] + 273.15 });
        }
        const B = window.BENCH_LIT_BY_EPOCH_ID[EP['📅']];
        Object.defineProperty(B, 'tC', { enumerable: true, get: () => { const c = cyan(EP, EP['▶']); return [c[1], c[3]]; } });
        Object.defineProperty(B.src, 'tC', { enumerable: true, get: () => '📈 bande de la courbe cyan d\'Histoire à ▶ : ' + cyan(EP, EP['▶'])[4] });
    }
    // Fourchettes d'une ligne du banc arrivée à date (unité de ▶ de son époque : âge ou année) : à ▶, celles de l'époque ;
    // ailleurs, la littérature À CETTE DATE — la courbe cyan (tC) et les fourchettes datées (BENCH_LIT_DATEES) —, une
    // fourchette de ▶ ne valant pas pour une autre date. Rien après AN_PRESENT : aucune mesure du futur.
    window.benchLitA = function (id, date) {
        const EP = window.TIMELINE.find((e) => e['📅'] === id);
        if (date === EP['▶']) return window.BENCH_LIT_BY_EPOCH_ID[id];
        const an = Math.round(date), L = { src: {} };
        if (age(EP, an) >= 0) {
            const c = cyan(EP, an);
            L.tC = [c[1], c[3]];
            L.src.tC = '📈 bande de la courbe cyan d\'Histoire à la date du clic : ' + c[4];
        }
        if (id in window.BENCH_LIT_DATEES && an in window.BENCH_LIT_DATEES[id]) {
            const D = window.BENCH_LIT_DATEES[id][an];
            for (const k of Object.keys(D.src)) { L[k] = D[k]; L.src[k] = D.src[k]; }
        }
        return L;
    };
})();

// ═══════════════════════════════════════════════════════════════════════════
// CHEMINS (🦣) : une époque dont 🕰 porte 🛤 = { clé : { order, 🔁 } } offre au premier clic un bouton par chemin ; chaque clic
// qui reste dans l'époque a son état 🔁 (le dernier passe à la suivante). Le chemin joué est la clé du dernier clic (📜🔘🕰), le
// premier de 🛤 avant tout clic (celui des bancs et des courbes d'Histoire). 🕰.order et
// 🕰.🔁 sont des accesseurs vers lui (une seule référence, non énumérables), et 🕰.🖼 en tire ses images : glaciaire quand la
// courbe cyan est sous 11 °C à la date où le clic arrive — le milieu entre le dernier maximum glaciaire (7,9 °C) et l'Holocène
// (14,0 °C) de Snyder 2016 —, interglaciaire sinon (index = 📿💫, l'image 0 étant celle de la frise).
// ═══════════════════════════════════════════════════════════════════════════
(function () {
    for (const EP of window.TIMELINE) {
        const W = EP['🕰'];
        if (!('🛤' in W)) continue;
        for (const [cle, S] of Object.entries(W['🛤'])) {
            if (S['🔁'].length !== S.order.length - 1) throw new Error('[TIMELINE] ' + EP['📅'] + ' chemin ' + cle + ' : ' + S['🔁'].length
                + ' états 🔁 pour ' + S.order.length + ' clics (un état par clic qui reste dans l\'époque : CO2/scripts/quaternaire/epica_etats.py)');
        }
        const chemin = () => W['🛤'][window.DATA['📜']['🔘🕰'] in W['🛤'] ? window.DATA['📜']['🔘🕰'] : Object.keys(W['🛤'])[0]];
        Object.defineProperty(W, 'order', { enumerable: false, get: () => chemin().order });
        Object.defineProperty(W, '🔁', { enumerable: false, get: () => chemin()['🔁'] });
        Object.defineProperty(W, '🖼', { enumerable: false, get: () => {
            let age = EP['▶'];
            const images = [age];
            for (const e of chemin().order) { age -= e['🔺⏳'] * 1e6; images.push(age); }
            return images.map((t) => window.HISTOIRE.litterature.a(t)[2] < 11 ? 'fonds/-00002Ma.png' : 'fonds/-00001Ma.png');
        } });
    }
})();
