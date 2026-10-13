// ============================================================================
// File: API_BILAN/physics/physics.js - Constantes et lois physiques fondamentales
// Desc: module de physique fondamentale
// Version 2.3.0
// - v2.3.0 (2026-10-12): EARTH.NUAGES — microphysique des nuages (Ackerman & Marley 2001 pour la structure verticale et la
//   glace, Martin et al. 1994 pour les gouttes, fraction mesurée MODIS King et al. 2013, deux-flux g = 0,85).
//   EARTH['🪩🍰']['🪩🍰⛅'] (r_c = 0,42, réglée) retirée : la réflectance du nuage est calculée (DATA['🪩']['🪩🍰⛅']).
//   (2026-10-13) Ackerman & Marley abandonné : nuage adiabatique limité par la pluie (14 µm), humidité moyenne de
//   Manabe & Wetherald, rayon de glace déclaré ; H2O_SURFACE_RH_01 = mesure ; EARTH.DIFFUSIVITE (1,66, Elsasser) ;
//   EARTH.fractionGelee : glace saisonnière pondérée par l'ensoleillement pour l'albédo.
// - v2.2.0 (2026-10-12): eau — saturation IAPWS (Wagner & Pruss 2002 / Wagner et al. 2011) et sa dérivée, tSatEau,
//   eauSansLiquide (état de phase : océan possible ou non) ; H_vap = 1/(Γ·d ln p_sat/dT), valide jusqu'au point
//   critique (fin de la borne « T < 600 K ») ; cp(T) des gaz (NIST-JANAF). Bloc MT_CKD scalaire (désactivé) retiré.
// Date: [October 10, 2026]
// logs :
// - v2.1.0: PAS DE GARDES. computeIceTempFactor(T, EPOCH) lit lui-même 🥶 et l'obliquité (ε courant 📜⚾, ε de
//   l'époque EPOCH['⚾'] sinon CONFIG_COMPUTE.obliquityDeg) : le bloc qui fabriquait ces options était recopié
//   4 fois (albedo ×2, h2o, flux). Plus d'options amp_* / f_* (aucune époque ne les déclare). Une seule source
//   par paramètre : fractions de zones pol/mid = CONFIG_COMPUTE (comme avant, ⚠️ 0,13/0,37 ≠ géométrie
//   0,134/0,366 — à trancher), trop = EARTH ; EARTH.OBLIQUITY_DEG_DEFAULT retirée (doublon de
//   CONFIG_COMPUTE.obliquityDeg). planckFunction et getWaterCycleTempBoundsFromPressure sans tests de
//   finitude ; CONST/CONV/EARTH/STATE/PHYS créés ici, sans `x = x || {}`.
// - v2.0.19: CONV.CCN_SULFATE_REF_KG 1,0e14 → 1,05e9 kg SO₄ — la référence sulfate de 🍰💭 suit la même
//   source que les masses d'époque (Tsigaridis et al. 2006 ACP 6:5143, Table 5 : nss-sulfate an 2000).
//   Ce n'est pas un recalage : ⚖️✈ cesse d'être un « proxy CCN » pour devenir une charge atmosphérique
//   en kg de SO₄ (configTimeline v1.4.89), et une référence est par définition dans l'unité de ce qu'elle
//   normalise. Effet : le terme sulfate de 🍰💭 vaut 0,100 sur 📱 (il valait 0,080) et 0,038 sur les
//   époques préindustrielles (il valait 0,001 — le proxy les avait rendues aveugles au sulfate).
// - v2.0.18: obliquité — redistribution méridienne de l'insolation annuelle (EARTH.zoneAnnualInsolation / obliquityZoneWarmingK) : ε > ε_époque → pôles plus chauds (ΔS·(1−α)/B, Budyko 1969). Corrige le SIGNE Milankovitch (avant : ε forte = refroidissement). Appliqué en ÉCART vs EPOCH['⚾'] → banc inchangé.
// - v2.0.17: EARTH['🪩🍰']['🪩🍰⛅'] 0.50 → 0.42 = réflectance r_c de la méthode d'addition 2 couches (calculations_albedo v1.2.64) ; même albédo nuageux moderne que l'ancien mélange linéaire à 0.50.
// - v2.0.16: EARTH['🪩🍰']['🪩🍰🏊'] = 0.50 — paramètre Briegleb/CCSM3 melt pond (bare ice + ponds, Perovich SHEBA 2002 ; NCAR/TN-463 §5). Consommé par calculations_albedo.js brieglebIceAlbedoLocal().
// - v2.0.15: computeIceTempFactor passe à 3 zones (polaire/mi-lat/TROPICAL). Ajout EARTH.POLAR_AMP_TROP_K=-5 K (tropical plus chaud que la moyenne globale), EARTH.SEASONAL_AMP_TROP_K=3 K (faible saisonnalité tropicale, Peixoto & Oort 1992 ch.7), EARTH.TROPICAL_ZONE_FRAC=0.50 (0°-30° lat., 2 hémisphères, géométrie sphérique sin(30°)=0.5). ice_tf devient la somme pondérée directe (f_pol×tf_pol + f_mid×tf_mid + f_trop×tf_trop), plus de normalisation par fsum : les 3 zones somment à 1.0 par construction. ICE_FORMULA_MAX_FRACTION passe de 0.46 (artefact Terre-moderne, cf. point 2 review Zorba) à 1.0 (physique correcte, autorise Snowball). Rétro-compat : à T_glob ≥ −4°C, tf_trop=0 → identique à avant avec normalisation ; au-dessous, la rampe tropicale (largeur 6 K) active la bifurcation Budyko-Sellers.
// - v2.0.14: EARTH.CH4_EDS_SCALE (défaut 1.0) + EARTH.CH4_HAZE_RATIO_THRESHOLD (0.1) ajoutés. CH4_EDS_SCALE parallèle à H2O_EDS_SCALE, tuning fin du line-by-line HITRAN (saturation bandes 3.3/7.7 µm, overlap H2O). CH4_HAZE_RATIO_THRESHOLD = seuil Haqq-Misra 2008 pour formation brume organique (pas encore câblé, hook SW futur).
// - v2.0.13: EARTH.OBLIQUITY_DEG_REF/DEFAULT (23.44°) + couplage ε dans computeIceTempFactor (amp_pol/amp_mid = SEASONAL_AMP_* × sin(ε)/sin(23.44°)). Plumbing EPOCH['⚾'] dans calculations_{albedo,flux,h2o}.
// - v2.0.12: H_vap passe de constante (2200 m) à fonction computeH2OScaleHeight() = R·T²/(L·Γ) (Clausius-Clapeyron + gradient adiabatique). Dépend de T courant et g de l'époque. EARTH.CP_AIR_MOIST_J_KG_K = 1005 ajouté. EARTH.H2O_SCALE_HEIGHT_M retiré.
// - v2.0.11: EARTH.H2O_SCALE_HEIGHT_M = 2200 (hauteur d'échelle H₂O effective, Clausius-Clapeyron ; ex-calcul hydrostatique R·T/(M·g) ≈ 13,6 km, irréaliste, surestimait PWV ×2,6).
// - v2.0.10: EARTH.H2O_EDS_SCALE défaut 0.60 (ex-0.92). Piloté par FINE_TUNING_BOUNDS.RADIATIVE via tuning.js. Recalcul dynamique sqrt(P_ratio)·CO2_factor retiré (radiative/calculations.js v1.2.5).
// - v2.0.9: EARTH['🪩🍰']['🪩🍰🎾'] albédo lave (ex-🪩🍰🌋)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Sections efficaces : hitran.js + lignes HITRAN. ΔF = convention affichage → climate.js, pas ici.
// - getH2OVaporEDSScale() — formule T,P,vapor,CO2 (pas d'époque), doc/API/VAPEUR_VS_NUAGES.md
// - Convention : Credence (%) + Plage lit. / écart-type en commentaire pour params tunables (éviter patch en aveugle). v2.0.3.
// - getH2OVaporEDSScale : 1.0→0.70 pour CO2≥400 ppm (cible EDS_H₂O ~72 W/m², lit. ~75).
// - v2.0.4 : atténuation thermique h2o_eds_scale (5–10%) au-dessus de 20°C pour limiter la sur-rétroaction chaude
// - v2.0.5 : règle simple h2o_eds_scale = 0.92 si T>290K, sinon 1.0
// - v2.0.6 : essai calibration 2025 (EDS H2O) : h2o_eds_scale = 0.92 en base, sans branchement epoch
// - v2.0.7 : CONV (convention) et EARTH (terrestre) extraits de CONST ; albédos 🪩🍰 dans EARTH, override par EPOCH['🪩🍰']
// - v2.0.9 : clé albédo lave 🪩🍰🎾 (remplace 🪩🍰🌋 pour cohérence avec 🍰🪩🎾)
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// var pour permettre plot.js et main.js de faire var CONST = window.CONST sans erreur
var CONST = window.CONST = {};

// ========== 1. FONDAMENTALES (universelles, sans ref terrestre) ==========
CONST.PLANCK_H = 6.62607015e-34;      // [J·s] Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // [m/s] c, m/s
CONST.BOLTZMANN_KB = 1.380649e-23;    // [J/K] Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // [W/(m²·K⁴)] Stefan-Boltzmann, W/(m²·K⁴)
CONST.SOLAR_CONSTANT = 1361;              // [W/m²] TSI W/m² (Kopp & Lean 2011, TSIS-1). 🔒 = L☉/(4π×AU²) = 3.828e26/(4π×1.496e11²)
CONST.MAX_PLANCK_SAFE = 1e30;         // [W/(m²·sr·m)] Cap Planck (W/(m²·sr·m)) pour workers / transfert radiatif

// ========== 2. PHYSIQUE DURE (propriétés intrinsèques) ==========
CONST.R_GAS = 8.314;  // [J/(mol·K)] Gaz parfaits, J/(mol·K)
CONST.M_N2 = 0.02801;   // [kg/mol] N₂ kg/mol
CONST.M_O2 = 0.03200;   // [kg/mol] O₂ kg/mol
CONST.M_CO2 = 0.04401;  // [kg/mol] CO₂ kg/mol
CONST.M_CH4 = 0.01604;  // [kg/mol] CH₄ kg/mol
CONST.M_H2O = 0.01802;  // [kg/mol] H₂O kg/mol
CONST.RHO_WATER = 1000;  // [kg/m³] Densité eau kg/m³
// ─── POINT TRIPLE DE L'EAU — la condition aux limites de Clausius-Clapeyron ───────────────
// C-C est une équation DIFFÉRENTIELLE : de/dT = L·e/(R_v·T²). L'intégrer donne ln e = −L/(R_v T) + C,
// et cette constante d'intégration doit être fixée par UN point de la courbe de coexistence.
// Ce point est une propriété de la SUBSTANCE, mesurée en laboratoire — pas un ancrage sur le
// climat actuel. C'est toute la différence avec les 288 K qu'on vient de retirer du plafond de vapeur.
//   Point triple de l'eau : 273,16 K et 611,657 Pa (IAPWS ; exact par définition du kelvin avant
//   la réforme SI de 2019, mesuré depuis).
// v-2026-09-23 : P0_WATER valait 611,2 Pa à T0_WATER = 273,15 K, c'est-à-dire la saturation à
//   0 °C — proche du point triple mais ni l'un ni l'autre exactement, et son commentaire annonçait
//   « point triple » sur une valeur qui n'en était pas une.
CONST.T_TRIPLE_WATER = 273.16;      // [K] K   — point triple de l'eau (IAPWS)
CONST.P_TRIPLE_WATER = 611.657;     // [Pa] Pa  — pression de vapeur au point triple (IAPWS)
CONST.L_VAPORIZATION = 2.5e6;  // [J/kg] Chaleur latente vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // [J/(kg·K)] R vapeur d'eau J/(kg·K)
CONST.CP_AIR = 1005;  // [J/(kg·K)] Capacité calorifique air sec J/(kg·K)
CONST.T_BOIL = 373.15;  // [K] Ébullition eau 1 atm (K)
CONST.T0_WATER = 273.15;  // [K] K — 0 °C, DÉFINITION de l'échelle Celsius. ⚠️ Ce n'est PAS le point
// triple (273,16 K, cf. CONST.T_TRIPLE_WATER) : l'ancien commentaire le disait à tort.
CONST.T_LAVA_START = 1000;   // [K] Transition lave (K)
CONST.T_LAVA_COMPLETE = 2373;  // [K] Lave complète (K)
CONST.LAMBDA_CO2_CENTER = 15.0e-6;   // [m] CO₂ 15 μm
CONST.LAMBDA_H2O_1 = 6.3e-6;  // [m]
CONST.LAMBDA_H2O_2 = 17.0e-6;  // [m]
CONST.LAMBDA_CH4_1 = 7.7e-6;  // [m]

// ========== 3. CONVERSION TEMPÉRATURE (DATA = K ; °C/°F = affichage) ==========
CONST.KELVIN_TO_CELSIUS = CONST.T0_WATER;  // [K] 273.15
CONST.K2C = function (K) { return K - CONST.KELVIN_TO_CELSIUS; };  // [ƒ K → °C]

// ─── 12 CONSTANTES MORTES RETIRÉES le 2026-09-23 ──────────────────────────────────────────
// Définies et jamais lues — ni dans le moteur, ni dans l'interface, ni dans les scripts inline
// des pages. Repérées par la page 🔎 Paramètres (demo/parametres.html), qui signale toute clé à
// zéro lecture. Liste : K2F, LAMBDA_CH4_2, L_V, M_AR, P0_WATER, ALPHA_OCEAN, SCALE_CLOUD,
// CH4_HAZE_RATIO_THRESHOLD, PRECIP_BASE_RATE, PRECIP_CLOUD_SCALE, PRECIP_PRESSURE_SCALE,
// T_NO_POLAR_ICE_K.
//   · L_V faisait double emploi avec L_VAPORIZATION (même grandeur, deux températures).
//   · P0_WATER n'était plus qu'un alias de P_TRIPLE_WATER depuis le passage au point triple.
//   · ALPHA_OCEAN (0,3) et SCALE_CLOUD (0,4) étaient déjà signalées sans source par l'audit —
//     et 0,3 n'est de toute façon pas un albédo d'océan (0,06–0,10 mesurés).
//   · T_NO_POLAR_ICE_K était marquée 🏷️ DEPRECATED par le code lui-même.
// Banc : aucun écart, par construction — rien ne les lisait.
// ========== CONV (convention : unités, références) ==========
var CONV = window.CONV = {};
CONV.AU_M = 1.496e11;  // [m]
CONV.STANDARD_ATMOSPHERE_PA = 101325;  // [Pa]
CONV.molar_mass_air_ref = 0.029;  // [kg/mol]
CONV.SECONDS_PER_DAY = 86400;  // [s]
CONV.TAU_VAPOR_GLOBAL_S = 10 * CONV.SECONDS_PER_DAY;  // [s]
CONV.P_ANN_SCALE_MM_AN = 200000;  // [mm/an]
// CONV.O2_REF_MASS (1e18 kg) et CONV.CH4_REF_MASS (1e13 kg) SUPPRIMÉES le 2026-09-22 :
// deux masses de référence sans source (des ordres de grandeur ronds) et surtout **lues nulle
// part** — grep sur tout le projet : zéro usage hors leur propre définition. Du code mort qui
// figurait à l'audit comme deux paramètres sans source de plus.
// CONV.CCN_O2_REF_KG (1,08e18 kg) et CONV.CCN_CH4_REF_KG (5,2e12 kg) SUPPRIMÉES le 2026-09-23,
// avec la formule 🍰💭 qui les consommait (calculations_albedo v1.2.66). Elles normalisaient un
// « proxy CCN » où l'O₂ et le CH₄ pesaient cinq fois le sulfate — or ni l'un ni l'autre n'intervient
// dans l'activation d'un noyau de condensation (théorie de Köhler 1936 ; κ-Köhler, Petters &
// Kreidenweis 2007). Il n'y avait pas de référence à corriger : il n'y avait pas de formule.
// CCN_SULFATE_REF_KG : charge de sulfate de RÉFÉRENCE dans 🍰💭, c'est-à-dire celle d'aujourd'hui —
//   exactement comme CCN_O2_REF_KG (1,08e18 = O₂ préindustriel) et CCN_CH4_REF_KG (5,2e12 ≈ CH₄ moderne).
//   Le terme 0,1 × (⚖️✈/CCN_SULFATE_REF_KG) se lit donc « sulfate relatif à aujourd'hui ».
//   1,05e9 kg SO₄ = nss-sulfate de l'an 2000 (Tsigaridis et al. 2006 ACP 6:5143, Table 5) : la même
//   source que EPOCH['📱']['⚖️✈'], pour que le rapport vaille 1,00 sur l'époque moderne.
//   ⚠️ L'ancienne valeur, 1,0e14, accompagnait le « proxy CCN » de configTimeline (📱 = 8,0e13) ;
//   elle n'avait pas de source et 📱 y donnait 0,80 au lieu de 1,00. Voir configTimeline.js v1.4.89,
//   encadré « MASSES DE SULFATE », et doc/MASSES_SULFATE_PAR_EPOQUE.md.
CONV.CCN_SULFATE_REF_KG = 1.05e9;  // [kg (de SO₄)]
// CONV.H2O_VAPOR_REF (0,01 kg/kg) SUPPRIMÉE le 2026-09-22 : sans source, et morte. Seule trace
// restante, un commentaire de calculations_albedo.js:222 qui dit que la formule qui l'utilisait
// « n'est plus utilisée ». Elle a survécu à sa propre formule.

// ========== EARTH (terrestre : seuils climat, cycle eau, albédos par défaut ; overridable par époque) ==========
// var pour permettre plot.js / main.js de faire var EARTH = window.EARTH sans erreur
var EARTH = window.EARTH = {};
// 🏷️ LEGACY — T_NO_POLAR_ICE_K = 293K était calibré comme seuil de T_GLOBALE (plus utilisé dans la formule 3-zones ;
// conservé pour rétro-compat outils externes / logs). La formule glace utilise désormais T_FREEZE_SEAWATER + dT.
EARTH.T_NO_POLAR_ICE_RANGE_K = 20;                             // [K] largeur de rampe ice_temp_factor (utilisée)
/** Plafond absolu ice_temp_factor. Depuis v2.0.15 = 1.0 (formule 3 zones normalisée par construction).
 *  Ancien 0.46 (≤ v2.0.14) : artefact Terre-moderne qui empêchait Snowball en capant la glace à 46%.
 *  Nouvelle formule (pol+mid+trop, Σf_z = 1.0) rend ce plafond physique et sûr à 1.0. */
EARTH.ICE_FORMULA_MAX_FRACTION = 1.0;  // [m²/m² (fraction de surface englacée)]
EARTH.T_ICE_TRANSITION_RANGE_K = 20;  // [K]

// ─── Amplification latitudinale (EBM 0D 3 zones, Budyko-Sellers) — v2.0.15 ─────
// Hypothèse physique : T moyenne globale ≠ T locale par latitude. La glace se forme là où T_locale < T_freeze.
// 3 zones pondérées par fraction de surface (géométrie sphérique, somme exacte = 1.0) :
//   Tropical    (0°–30°,  f_trop=0.500) : T_trop = T_glob − POLAR_AMP_TROP_K   (dT_trop < 0 : plus chaud)
//   Mi-latitude (30°–60°, f_mid=0.366)  : T_mid  = T_glob − POLAR_AMP_MID_K    (dT_mid  > 0 : plus froid)
//   Polaire     (60°–90°, f_pol=0.134)  : T_pol  = T_glob − POLAR_AMP_POL_K    (dT_pol  > 0 : plus froid)
// Seuil local glace → seuil global : T_thresh_z_high = T_FREEZE_SEAWATER_K + dT_z + amp_z_eff.
// Jusqu'à v2.0.14 : seulement pol+mid, avec cap artificiel 0.46 qui empêchait le Snowball.
//
// 🏷️ TUNING — valeurs Earth-modern (Budyko 1969 ; Sellers 1969 ; IPCC AR6 WG1 ch.7 & fig 4.18) :
//   POLAR_AMP_POL_K = 20 K (gradient tropiques→pôles ~40 K réel, amplification polaire Arctique observée ~2×)
//   POLAR_AMP_MID_K =  5 K (gradient tropiques→mi-lat ~10 K réel)
// 🏷️ FLOU SCIENTIFIQUE — ces valeurs dépendent en réalité de :
//   1) l'obliquité axiale ε (insolation annuelle pondérée par latitude) ;
//      - North & Coakley 1979 EBM 2D : gradient T = f(ε, S, A) — pour ε↑ → gradient↓ (pôles reçoivent plus en été)
//      - Loi approximée : ΔT_pol ∝ S(φ=90°)/S̄ ≈ (2/π)·sin(ε) — donc à ε=0°, ΔT_pol maximum ; à ε=90°, pôles « tropicaux »
//      - Formule possible future : POLAR_AMP_POL_K ≈ 20 × (sin(23.44°) / sin(ε)), non activée ici.
//   2) circulation atmosphérique/océanique (transport de chaleur méridien, ~5 PW Terre moderne)
//   3) rétroaction glace-albédo (déjà modélisée en aval)
//   4) épaisseur de l'atmosphère (Archéen P_atm ≠ moderne → transport différent)
// ─── Pas de constantes EARTH.POLAR_AMP_*_K ─────────────────────────────────────
// Source unique = configTimeline.js, EPOCH['🥶'] = { dT_pol, dT_mid, dT_trop }.
// computeIceTempFactor() throw si opts.dT_pol/dT_mid/dT_trop manquants. Crash-first cohérent
// avec "Règle regle-data-territoire : lecture directe, pas de fallback".
// Réfs Terre-moderne pour info (📱 EPOCH = { dT_pol: 20, dT_mid: 5, dT_trop: -5 }) :
//   POLAR_AMP_POL_K  = +20 K (gradient tropiques→pôles ~40 K réel, amplification polaire Arctique observée ~2×)
//   POLAR_AMP_MID_K  = +5 K  (gradient tropiques→mi-lat ~10 K réel)
//   POLAR_AMP_TROP_K = -5 K  (tropical ~5 K plus chaud que moyenne globale ; Peixoto & Oort 1992 ch.7)
// Fractions surface par zone, géométrie sphérique (sin φ₂ − sin φ₁ sur 2 hémisphères) :
//   Pol (60°–90°)  = 1 − sin 60°  = 0.134
//   Mid (30°–60°)  = sin 60° − sin 30° = 0.366
//   Trop (0°–30°)  = sin 30° − sin 0°  = 0.500
//   Σ = 1.000  (cap physique correct, remplace l'artefact ICE_FORMULA_MAX_FRACTION=0.46)
EARTH.POLAR_ZONE_FRAC    = 0.134;                              // [m²/m² (surface de la zone / surface du globe)] fraction surface polaire
EARTH.MIDLAT_ZONE_FRAC   = 0.366;                              // [m²/m² (surface de la zone / surface du globe)] fraction surface mi-latitude
EARTH.TROPICAL_ZONE_FRAC = 0.500;                              // [m²/m² (surface de la zone / surface du globe)] fraction surface tropicale (0°–30°)

// ─── Amplitude saisonnière : largeur physique de la rampe glace ────────────────
// Amplitude saisonnière pic-à-pic divisée par 2 (half-range été-hiver), CALIBRÉES à ε_REF.
// Sources : ERA5 reanalysis 1991-2020 (T_mensuelles min/max) ; Peixoto & Oort 1992 ch.7.
// 🏷️ FLOU SCIENTIFIQUE — l'amplitude dépend aussi de la capacité thermique (océan/continent),
// circulation atmosphérique, ère glaciaire vs interglaciaire. Valeurs ci-dessous = Terre-moderne.
EARTH.SEASONAL_AMP_POL_K  = 15;  // [K] pôle : amplitude annuelle 2× (été + 15 K, hiver − 15 K) autour de la moyenne
EARTH.SEASONAL_AMP_MID_K  = 25;  // [K] mi-lat continentale : amplitude plus large (effet continentalité)
// Tropical : faible saisonnalité (3 K pic-à-demi), dominée par océan chaud inertiel.
//   Réf. ERA5 1991-2020, Peixoto & Oort 1992 ch.7 : ΔT mensuel tropical ≈ ±3 K.
//   Combiné à dT_trop=-5 K → seuil haut T_trop_thresh_high = 271.15 + (-5) + 3 = 269.15 K (-4°C).
//   Rampe étroite (largeur 6 K) → pente forte → bifurcation Budyko-Sellers classique.
EARTH.SEASONAL_AMP_TROP_K = 3;   // [K] tropical : amplitude annuelle faible (océan thermique)
// Mi-latitudes OCÉANIQUES (2026-10-13) : SEASONAL_AMP_MID_K (25 K) est continental ; la surface de la mer des moyennes
// latitudes varie de quelques K seulement sur l'année et ne gèle pas. La zone 30–60° est pondérée par la part de
// continent de l'époque (1 − 🍰🗻🌊 ; 0,30 sur 📱, ≈ 0,28 mesurés dans les bandes 30–60° N+S).
// ⚠️ FOURCHETTE de mémoire : demi-amplitude annuelle de la température de surface de la mer aux moyennes latitudes
// ~3–5 K (Peixoto & Oort 1992 ch. 7, à vérifier) → 4.
EARTH.SEASONAL_AMP_MID_OCEAN_K = 4;  // [K]

// ─── Couplage obliquité ε (activé) ─────────────────────────────────────────────
// ε = obliquité axiale (clé epoch '⚾'). Terre 2025 : ε_REF = 23.44°.
// Loi : amp_z_eff = SEASONAL_AMP_z_K × sin(ε) / sin(ε_REF)   (ε→0 → pas de saison → amp_eff=0)
// Source : insolation annuelle latitude-dépendante f(ε) — Berger 1978, Laskar et al. 2004.
// Hypothèse Archéen : Williams 1993 suggère ε ~ 45–70° (expliquerait glaciations basse-latitude
// du Protérozoïque sans invoquer un Snowball global).
EARTH.OBLIQUITY_DEG_REF = 23.44;     // [°] référence où SEASONAL_AMP_*_K sont calibrés

// ─── Redistribution méridienne de l'insolation par ε (Milankovitch) — v2.0.18 ──────────────
// L'amplitude saisonnière ci-dessus ne dit QUE la moitié de l'histoire : une obliquité forte
// refroidit les hivers MAIS envoie surtout plus d'énergie ANNUELLE vers les pôles (et un peu
// moins aux tropiques ; la moyenne globale, elle, ne change pas d'un iota).
// C'est ce second terme qui gouverne Milankovitch : forte ε = étés polaires chauds = calottes
// qui fondent (déglaciation) ; faible ε = étés frais = la neige survit = glaciation.
// Sans lui, le modèle donnait le signe INVERSE (ε 24,5° → bascule froide au Quaternaire).
//
// S̄_z(ε) = insolation annuelle moyenne de la zone z (intégrale de l'insolation journalière sur
// l'année et sur la bande de latitude, pondérée par la surface). Calcul exact ci-dessous, mis en
// cache : la moyenne globale est invariante, seule la RÉPARTITION dépend de ε.
//   dS̄/dε ≈ +4,5 W/m² par degré au pôle, −1,3 aux tropiques, ~0 aux moyennes latitudes.
// Conversion en température de zone via l'EBM : ΔT_z = ΔS̄_z · (1 − α) / B
//   B = 2,0 W/m²/K (coefficient de refroidissement radiatif EBM, Budyko 1969 : 1,45–2,1)
//   α = 0,30 (albédo planétaire de référence).
// Réfs : Berger 1978 J. Atmos. Sci. 35:2362 ; Laskar et al. 2004 A&A 428:261 ; Budyko 1969 Tellus 21:611.
//
// ⚠️ APPLIQUÉ EN ÉCART SEULEMENT : ΔT_z = f(ε_courant) − f(ε_époque). Les 🥶 de chaque époque sont
// calibrés POUR son ε de config (ex. Archéen 45°) : à ε inchangé, le terme est nul et le banc ne bouge pas.
EARTH.EBM_B_W_PER_M2_K = 2.0;  // [W/(m²·K)]
EARTH.EBM_ALBEDO_REF = 0.30;  // [W/W (flux réfléchi / flux incident)]
// v-2026-09-23 : renommée depuis SOLAR_CONSTANT_REF_W — c'est un flux (W/m²), pas une puissance.
EARTH.SOLAR_CONSTANT_REF_W_PER_M2 = 1361;  // [W/m²]

/** Insolation journalière moyenne (W/m²) à la latitude lat pour une déclinaison dec (degrés). */
function dailyMeanInsolation(lat_deg, dec_deg) {
    var toRad = Math.PI / 180;
    var phi = lat_deg * toRad, dec = dec_deg * toRad;
    var x = -Math.tan(phi) * Math.tan(dec);
    var H = x >= 1 ? 0 : (x <= -1 ? Math.PI : Math.acos(x));
    return EARTH.SOLAR_CONSTANT_REF_W_PER_M2 / Math.PI
        * (H * Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.sin(H));
}

/** Insolation annuelle moyenne (W/m²) d'une bande de latitude [l0,l1]°, pondérée par la surface. */
function zoneAnnualMeanInsolation(l0_deg, l1_deg, obliquity_deg) {
    var toRad = Math.PI / 180;
    var nLat = 20, nDay = 73; // pas 5 jours : moyenne annuelle stable à < 0,05 W/m²
    var num = 0, den = 0;
    for (var i = 0; i < nLat; i++) {
        var lat = l0_deg + (l1_deg - l0_deg) * (i + 0.5) / nLat;
        var w = Math.cos(lat * toRad);
        var sum = 0;
        for (var d = 0; d < nDay; d++) {
            var lam = 2 * Math.PI * d / nDay;
            var dec = Math.asin(Math.sin(obliquity_deg * toRad) * Math.sin(lam)) / toRad;
            sum += dailyMeanInsolation(lat, dec);
        }
        num += (sum / nDay) * w;
        den += w;
    }
    return num / den;
}

var _zoneInsolationCache = {};
/** { pol, mid, trop } : insolation annuelle moyenne par zone (W/m²), mise en cache par ε. */
EARTH.zoneAnnualInsolation = function (obliquity_deg) {
    var key = Number(obliquity_deg).toFixed(4);
    if (!_zoneInsolationCache[key]) {
        _zoneInsolationCache[key] = {
            trop: zoneAnnualMeanInsolation(0, 30, obliquity_deg),   // f = 0.500
            mid:  zoneAnnualMeanInsolation(30, 60, obliquity_deg),  // f = 0.366
            pol:  zoneAnnualMeanInsolation(60, 90, obliquity_deg)   // f = 0.134
        };
    }
    return _zoneInsolationCache[key];
};

/** Écart de température de zone (K) dû au changement d'obliquité ε_ref → ε : ΔT = ΔS̄·(1−α)/B. */
EARTH.obliquityZoneWarmingK = function (obliquity_deg, obliquity_ref_deg) {
    if (obliquity_deg === obliquity_ref_deg) return { pol: 0, mid: 0, trop: 0 };
    var cur = EARTH.zoneAnnualInsolation(obliquity_deg);
    var ref = EARTH.zoneAnnualInsolation(obliquity_ref_deg);
    var k = (1 - EARTH.EBM_ALBEDO_REF) / EARTH.EBM_B_W_PER_M2_K;
    return {
        pol:  (cur.pol  - ref.pol)  * k,
        mid:  (cur.mid  - ref.mid)  * k,
        trop: (cur.trop - ref.trop) * k
    };
};

// ─── GLACE SAISONNIÈRE ET ENSOLEILLEMENT (2026-10-13) ─────────────────────────────────────────────────────────────
// La rampe de computeIceTempFactor donne la fraction de l'ANNÉE où une zone est sous le gel (T_zone ± amplitude
// saisonnière). Mais la glace saisonnière est là en hiver, quand le soleil est bas ou absent (nuit polaire) : son effet
// sur l'albédo est la fraction de l'ÉNERGIE solaire annuelle qui tombe sur elle, pas la fraction du temps. Calcul exact :
// insolation journalière (dailyMeanInsolation, géométrie orbitale) × [T(jour) < T_gel], T(jour) = T_zone + amp·sin(λ − δ),
// δ = retard des saisons thermiques sur le soleil. ⚠️ MESURE APPROCHÉE : maximum de température ~1 mois après le
// solstice sur les continents, ~2 mois sur l'océan → 1 mois retenu (borne basse).
EARTH.RETARD_SAISONS_JOURS = 30;  // [jour]
var _tableInsolation = {};
/** Insolation journalière S[lat][jour] d'une bande [l0,l1]° (hémisphère nord), en cache par ε. */
function tableInsolation(l0_deg, l1_deg, obliquity_deg) {
    var key = l0_deg + ':' + l1_deg + ':' + Number(obliquity_deg).toFixed(4);
    if (_tableInsolation[key]) return _tableInsolation[key];
    var toRad = Math.PI / 180;
    var nLat = 10, nDay = 73;
    var t = { poids: [], S: [] };
    for (var i = 0; i < nLat; i++) {
        var lat = l0_deg + (l1_deg - l0_deg) * (i + 0.5) / nLat;
        t.poids.push(Math.cos(lat * toRad));
        var ligne = [];
        for (var d = 0; d < nDay; d++) {
            var lam = 2 * Math.PI * d / nDay;
            ligne.push(dailyMeanInsolation(lat, Math.asin(Math.sin(obliquity_deg * toRad) * Math.sin(lam)) / toRad));
        }
        t.S.push(ligne);
    }
    _tableInsolation[key] = t;
    return t;
}
/** { temps, energie } : fractions de l'année et de l'énergie solaire annuelle d'une bande sous le gel. */
EARTH.fractionGelee = function (T_zone_K, amp_K, l0_deg, l1_deg, obliquity_deg) {
    var t = tableInsolation(l0_deg, l1_deg, obliquity_deg);
    var retard = 2 * Math.PI * EARTH.RETARD_SAISONS_JOURS / 365.25;
    var nDay = t.S[0].length;
    var tps = 0, nrj = 0, nrjTot = 0, n = 0;
    for (var i = 0; i < t.S.length; i++) {
        for (var d = 0; d < nDay; d++) {
            var gel = (T_zone_K + amp_K * Math.sin(2 * Math.PI * d / nDay - retard)) < EARTH.T_FREEZE_SEAWATER_K ? 1 : 0;
            tps += t.poids[i] * gel;
            n += t.poids[i];
            nrj += t.poids[i] * t.S[i][d] * gel;
            nrjTot += t.poids[i] * t.S[i][d];
        }
    }
    return { temps: tps / n, energie: nrj / nrjTot };
};

/**
 * EARTH.computeIceTempFactor(T_glob_K, EPOCH) : ice_temp_factor ∈ [0,1].
 * FONCTION UNIQUE — appelée par calculations_albedo.js, calculations_flux.js, calculations_h2o.js.
 *
 * MODÈLE PHYSIQUE (EBM 0D 3 zones × saisonnalité × obliquité) — v2.0.15 :
 *   En zone z ∈ {pol, mid, trop}, la T_locale annuelle vaut T_glob − dT_z :
 *     - Polaire (60°–90°, f=0.134) : dT_pol = +20 K (plus froid)
 *     - Mi-lat  (30°–60°, f=0.366) : dT_mid =  +5 K (plus froid)
 *     - Tropical (0°–30°, f=0.500) : dT_trop = −5 K (plus chaud, NÉGATIF)
 *
 *   Amplitude saisonnière effective : amp_z_eff = SEASONAL_AMP_z_K × sin(ε) / sin(ε_REF).
 *   La glace se forme dès T_locale_hiver < T_FREEZE_SEAWATER (T_locale − amp_eff < T_FREEZE).
 *   La glace devient permanente dès T_locale_été < T_FREEZE (T_locale + amp_eff < T_FREEZE).
 *
 *   ⇒ Seuil HAUT zone z (glace commence) : T_glob = T_FREEZE + dT_z + amp_z_eff
 *   ⇒ Seuil BAS  zone z (glace permanente) : T_glob = T_FREEZE + dT_z − amp_z_eff
 *   ⇒ Rampe linéaire largeur = 2·amp_z_eff (ε↑ → rampe plus large ; ε→0 → step function).
 *
 *   ice_tf = f_pol·tf_pol + f_mid·tf_mid + f_trop·tf_trop    (somme pondérée directe, Σf_z=1.0)
 *
 *   Physique Snowball Earth (Budyko-Sellers classique) : quand T_glob < ~−4°C, la rampe
 *   tropicale s'active, et la rétroaction glace-albédo peut dépasser le gain de 1 → bifurcation.
 *
 * EPOCH : l'entrée TIMELINE courante (🥶 obligatoire, ⚾ facultatif).
 *
 * @returns {{ice_tf, tf_pol, tf_mid, tf_trop,
 *            T_thresh_pol_high, T_thresh_pol_low, T_thresh_mid_high, T_thresh_mid_low,
 *            T_thresh_trop_high, T_thresh_trop_low,
 *            dT_pol, dT_mid, dT_trop, amp_pol, amp_mid, amp_trop,
 *            f_pol, f_mid, f_trop, obliquity_deg, obliquity_factor, dT_obliquity}}
 */
EARTH.computeIceTempFactor = function (T_glob_K, EPOCH) {
    var cc = window.CONFIG_COMPUTE;
    var f_pol = cc.polarZoneFraction;
    var f_mid = cc.midlatZoneFraction;
    var f_trop = EARTH.TROPICAL_ZONE_FRAC;
    // dT_pol / dT_mid / dT_trop : SOURCE UNIQUE = configTimeline.js EPOCH['🥶'].
    var dT_pol  = EPOCH['🥶'].dT_pol;
    var dT_mid  = EPOCH['🥶'].dT_mid;
    var dT_trop = EPOCH['🥶'].dT_trop;
    // Obliquité : ε de l'époque (celle où 🥶 est calibré) ; ε courant = 📜⚾ quand un état 🔁 la pose (Milankovitch).
    var obliquity_ref_deg = ('⚾' in EPOCH) ? EPOCH['⚾'] : cc.obliquityDeg;
    var obliquity_deg = (window.DATA['📜']['⚾'] > 0) ? window.DATA['📜']['⚾'] : obliquity_ref_deg;
    // Facteur sin(ε)/sin(ε_REF), borné à 0.
    var toRad = Math.PI / 180;
    var sinRef = Math.sin(EARTH.OBLIQUITY_DEG_REF * toRad);
    var obliquity_factor = Math.max(0, Math.sin(obliquity_deg * toRad) / sinRef);
    // Redistribution méridienne (Milankovitch) : ε au-dessus de l'ε de l'époque ⇒ pôles plus chauds,
    // tropiques un peu plus froids ⇒ dT_z (écart zone − global) corrigé. Nul si ε == ε_ref.
    var dT_oblq = EARTH.obliquityZoneWarmingK(obliquity_deg, obliquity_ref_deg);
    dT_pol  -= dT_oblq.pol;
    dT_mid  -= dT_oblq.mid;
    dT_trop -= dT_oblq.trop;
    // Amplitudes saisonnières effectives, dérivées de l'obliquité.
    var amp_pol  = EARTH.SEASONAL_AMP_POL_K  * obliquity_factor;
    var amp_mid  = EARTH.SEASONAL_AMP_MID_K  * obliquity_factor;
    var amp_trop = EARTH.SEASONAL_AMP_TROP_K * obliquity_factor;
    // Seuils haut (glace commence saisonnalement) et bas (glace permanente) pour les 3 zones.
    var T_thresh_pol_high  = EARTH.T_FREEZE_SEAWATER_K + dT_pol  + amp_pol;
    var T_thresh_pol_low   = EARTH.T_FREEZE_SEAWATER_K + dT_pol  - amp_pol;
    var T_thresh_mid_high  = EARTH.T_FREEZE_SEAWATER_K + dT_mid  + amp_mid;
    var T_thresh_mid_low   = EARTH.T_FREEZE_SEAWATER_K + dT_mid  - amp_mid;
    var T_thresh_trop_high = EARTH.T_FREEZE_SEAWATER_K + dT_trop + amp_trop;
    var T_thresh_trop_low  = EARTH.T_FREEZE_SEAWATER_K + dT_trop - amp_trop;
    // Rampe linéaire sur 2·amp_z_eff (largeur physique, dérivée de sin(ε)).
    var widthPol  = Math.max(1e-6, 2 * amp_pol);
    var widthMid  = Math.max(1e-6, 2 * amp_mid);
    var widthTrop = Math.max(1e-6, 2 * amp_trop);
    var tf_pol  = Math.max(0, Math.min(1, (T_thresh_pol_high  - T_glob_K) / widthPol));
    // Mi-latitudes : part continentale (amplitude amp_mid) + part océanique (amplitude SEASONAL_AMP_MID_OCEAN_K).
    var fContinent = 1 - EPOCH['🗻']['🍰🗻🌊'];
    var amp_mid_oc = EARTH.SEASONAL_AMP_MID_OCEAN_K * obliquity_factor;
    var tf_mid_oc = Math.max(0, Math.min(1, (EARTH.T_FREEZE_SEAWATER_K + dT_mid + amp_mid_oc - T_glob_K) / Math.max(1e-6, 2 * amp_mid_oc)));
    var tf_mid  = fContinent * Math.max(0, Math.min(1, (T_thresh_mid_high  - T_glob_K) / widthMid)) + (1 - fContinent) * tf_mid_oc;
    var tf_trop = Math.max(0, Math.min(1, (T_thresh_trop_high - T_glob_K) / widthTrop));
    // Somme pondérée directe : les 3 zones sommant à 1.0 par construction (géométrie sphérique),
    // ice_tf ∈ [0,1] est directement la fraction de surface glacée — plus besoin de normalisation.
    var ice_tf = f_pol * tf_pol + f_mid * tf_mid + f_trop * tf_trop;
    // Pondération par l'ensoleillement (EARTH.fractionGelee) : rapport énergie/temps de la glace, sur les 3 zones.
    // Ne sert qu'à l'ALBÉDO (calculations_albedo) ; l'étendue et la masse de glace restent ice_tf.
    var gPol = EARTH.fractionGelee(T_glob_K - dT_pol, amp_pol, 60, 90, obliquity_deg);
    var gMidC = EARTH.fractionGelee(T_glob_K - dT_mid, amp_mid, 30, 60, obliquity_deg);
    var gMidO = EARTH.fractionGelee(T_glob_K - dT_mid, amp_mid_oc, 30, 60, obliquity_deg);
    var gMid = { temps: fContinent * gMidC.temps + (1 - fContinent) * gMidO.temps,
                 energie: fContinent * gMidC.energie + (1 - fContinent) * gMidO.energie };
    var gTrop = EARTH.fractionGelee(T_glob_K - dT_trop, amp_trop, 0, 30, obliquity_deg);
    var gTemps = f_pol * gPol.temps + f_mid * gMid.temps + f_trop * gTrop.temps;
    var gEnergie = f_pol * gPol.energie + f_mid * gMid.energie + f_trop * gTrop.energie;
    return {
        ice_tf: ice_tf,
        // sans glace (gTemps = 0) le rapport est sans objet : 1
        rapport_ensoleillement: gTemps > 0 ? gEnergie / gTemps : 1,
        tf_pol: tf_pol, tf_mid: tf_mid, tf_trop: tf_trop,
        T_thresh_pol_high:  T_thresh_pol_high,  T_thresh_pol_low:  T_thresh_pol_low,
        T_thresh_mid_high:  T_thresh_mid_high,  T_thresh_mid_low:  T_thresh_mid_low,
        T_thresh_trop_high: T_thresh_trop_high, T_thresh_trop_low: T_thresh_trop_low,
        // compat rétro-facing (ancien champ exposé par calculations_albedo.js) :
        T_thresh_pol: T_thresh_pol_high, T_thresh_mid: T_thresh_mid_high,
        dT_pol: dT_pol, dT_mid: dT_mid, dT_trop: dT_trop,
        amp_pol: amp_pol, amp_mid: amp_mid, amp_trop: amp_trop,
        f_pol: f_pol, f_mid: f_mid, f_trop: f_trop,
        obliquity_deg: obliquity_deg, obliquity_factor: obliquity_factor,
        obliquity_ref_deg: obliquity_ref_deg, dT_obliquity: dT_oblq
    };
};
EARTH.EVAPORATION_E0 = 0.001;  // [kg/(m²·s)]
EARTH.EVAPORATION_T_REF = 288;  // [K]
EARTH.EVAPORATION_T_SCALE = 20;  // [K]
/** Cap vapeur dynamique Clausius-Clapeyron (ERA5/AIRS). calculations_h2o.js : c_c_max = REF × exp(RATE × (T - T_REF)). */
// ─── PLAFOND DE VAPEUR : plus de Clausius-Clapeyron linéarisée ────────────────────────────
// Supprimés le 2026-09-22 :
//   EARTH.H2O_VAPOR_CAP_REF                  = 0,0065 kg/kg
//   EARTH.H2O_VAPOR_CAP_RATE_PER_K           = 0,065  K⁻¹
//   EARTH.H2O_VAPOR_REALISTIC_MAX_REF        = 0,0052 kg/kg
//   EARTH.H2O_VAPOR_REALISTIC_MAX_RATE_PER_K = 0,013  K⁻¹
// Les deux premiers étaient les paramètres SANS SOURCE les plus sensibles du modèle (3,46 °C et
// 1,43 °C à +10 % au banc). Ils écrivaient :
//     c_c_max = 0,0065 · exp[ 0,065 · (T − 288) ]
// Or, avec les constantes de ce fichier :
//     L/(R_v·T²) à 288 K = 0,06531 K⁻¹   ← c'est le 0,065, à 0,5 % près
//     q_sat(288 K, 1 atm) = 0,010430 kg/kg ; 0,0065 / q_sat = 0,623
// Autrement dit ce n'étaient pas deux paramètres mais **Clausius-Clapeyron linéarisée autour de
// 288 K**, multipliée par un rapport constant. Une équation déguisée en constantes, et un modèle
// ancré sur la Terre d'aujourd'hui — juste à 288 K (+2 %), faux partout ailleurs :
//     −56 °C (⛄) : +376 %   ·   0 °C : +8 %   ·   +80 °C : +119 %
// C'est exactement là que ce modèle travaille.
//
// Remplacé par la C-C EXACTE, que calculations_h2o.js calculait déjà deux lignes plus haut
// (`max_vapor_mass_fraction` = q_sat, via calculateSaturatedVaporPressure). Il ne reste qu'un
// nombre, celui-ci, et il a un sens physique explicite au lieu d'être caché dans un exposant.
//
// H2O_SURFACE_RH_01 : HUMIDITÉ RELATIVE À LA SURFACE, sans dimension, dans [0,1].
//   q(surface) = H2O_SURFACE_RH_01 × q_sat(T_surface, P_surface)
// Le suffixe _01 dit la plage, comme seaIceStrength01 / iceImpactFactor01 ailleurs dans le projet.
// ⚠️ v-2026-09-23 : renommée depuis H2O_COLUMN_SAT_RATIO, qui était un CONTRESENS. 🍰🫧💧 est
// produite à la température ET à la pression de SURFACE ; ce rapport est donc une humidité
// relative de surface, pas un rapport de colonne. L'erreur de nom avait produit une erreur
// d'analyse (comparaison à 0,232, un rapport de colonne) — voir
// doc/DIAGNOSTIC_RETROACTION_VAPEUR.md § « la deuxième erreur, trouvée sur commande ».
// v-2026-10-13 : 0,623 n'avait pas de source (0,0065/q_sat(288 K), le 0,0065 venait de nulle part). Remplacé par la
// MESURE : humidité relative de surface moyenne globale 0,70–0,75 (ERA5, repère déjà noté ici) ; 0,77 dans le profil
// observé de Manabe & Wetherald (1967). ⚠️ FOURCHETTE 0,70–0,77 → milieu 0,735. Elle ancre aussi le profil
// d'humidité moyenne en altitude (radiative/calculations.js, EARTH.NUAGES.MW_P_RESIDU).
EARTH.H2O_SURFACE_RH_01 = 0.735;  // [Pa/Pa (humidité relative e/e_sat)]
// H2O_SURFACE_RH_INIT_01 (0,4986, SANS SOURCE, second plafond de la même grandeur en fin d'Init) retiré le
// 2026-10-13 : l'Init lit la même référence H2O_SURFACE_RH_01.
/** Feedback Iris simplifié (vapeur / iris_factor). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025 amplitude prudente. */
EARTH.IRIS_STRENGTH = 0.02;   // [sans dimension (coefficient de ΔT/IRIS_T_SCALE_K)] amplitude (sans dimension, × (T - T_REF) / IRIS_T_SCALE_K)
EARTH.IRIS_T_SCALE_K = 10;    // [K] échelle thermique (par 10 K)
EARTH.IRIS_FACTOR_MIN = 0.7;  // [sans dimension (plancher d'un facteur multiplicatif)] plancher iris_factor (évite sur-assèchement)
EARTH.T_FREEZE_SEAWATER_K = 271.15;  // [K]
EARTH.T_WATER_CYCLE_MIN_C = -10;  // [°C]
EARTH.T_WATER_CYCLE_MAX_C = 150;  // [°C]
EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1;  // [K/atm]
EARTH.T_WATER_CYCLE_MARGIN_GEL_K = 5;  // [K]
EARTH.T_WATER_CYCLE_EVAP_LOW_K = 323.15;  // [K]
EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM = 5;  // [K/atm]
/** Seuils pour recalcul partition eau (calculations_h2o.js) : recalcul seulement si ΔT > DELTA_T_K ou ΔP > DELTA_P_ATM. */
EARTH.WATER_PARTITION_DELTA_T_K = 5;  // [K]
EARTH.WATER_PARTITION_DELTA_P_ATM = 1;  // [atm]
/** Précip convective (calculations_h2o.js) : facteur temp = (T / T_REF)^EXP_T, facteur RH = (RH / RH_REF)^EXP_RH. Lit. Held & Soden 2006, IPCC AR6 ; réponse précip plus lente que C-C. */
EARTH.PRECIP_CONVECTIVE_T_REF_K = 288;   // [K] T ref (réutilise EVAPORATION_T_REF)
EARTH.PRECIP_CONVECTIVE_T_EXPONENT = 1.2; // [sans dimension (exposant)] adouci vs C-C (~7%/K) pour éviter sur-assèchement
EARTH.PRECIP_CONVECTIVE_RH_REF = 0.7;    // [Pa/Pa (humidité relative)] seuil RH convective typique (~70 %)
EARTH.PRECIP_CONVECTIVE_RH_EXPONENT = 1.0; // [sans dimension (exposant)] exposant facteur humidité (calib v1.0.8)
// EARTH.H2O_EDS_SCALE (multiplicateur de κ_H₂O, 0,60–1,00 au barycentre) retiré le 2026-10-13 : continuum, profil
// d'humidité et diffusivité codés, le ciel clair moderne tombe juste sans lui (fine_tuning_bounds v1.5.1).

// ─── Facteur κ_CH4 global dans EDS (pressure broadening / saturation bandes) ─────
// Parallèle à H2O_EDS_SCALE. Ajouté pour permettre un tuning fin du méthane sans toucher le line-by-line HITRAN.
// Défaut 1.0 : HITRAN natif (= cross_section × √(P/P_ref) déjà appliqué dans spectral_slice_worker).
// Réf. Haqq-Misra et al. 2008 (Astrobiology 8:1127) « A revised, hazy methane greenhouse » :
//   - CH4 en atmosphère CO2-riche (Archéen) : chauffage maximum ~9–11 K pour 1000–5000 ppm ;
//   - Saturation radiative IR au-delà de ~1000 ppm (bandes 3.3 / 7.7 µm opaques).
//   - Au-dessus de CH4/CO2 > 0.1 molaire : formation brume organique (Tholin) → anti-greenhouse SW
//     dominant → refroidissement net. Seuil strict ε ≈ 0.1 (non modélisé ici, à ajouter via SW).
//   - Pressure-broadening (déjà dans HITRAN + √(P/P_ref) du worker) couvre partiellement la
//     non-linéarité ; un scalar supplémentaire reste utile pour caler EDS_CH4 sur cible litt.
// Plage tolérée pour tuning : [0.3, 1.5] (0.3 = bandes fortement saturées / overlap H2O, 1.5 = bonus Haqq-Misra bandes mineures).
// NB : le seuil haze CH4/CO2 = 0.1 peut être vérifié dans calculateAlbedo (SW) plus tard.
EARTH.CH4_EDS_SCALE = 1.0;  // [sans dimension (facteur sur κ_CH₄)]

// EARTH.CIA_CO2_SCALE (1e-2, « ×100 TEST » du 2026-07-15) retiré le 2026-10-13 avec le profil inventé qu'il multipliait
// (radiative/calculations.js, en-tête CIA). La CIA mesurée (HITRAN CIA) reste à brancher.

// ─── Seuil de brume organique (Haqq-Misra 2008 Fig. 1) ─────────────────────────
// Rapport molaire CH4/CO2 au-delà duquel le méthane polymérise en Tholin (brume organique)
// qui absorbe le SW en stratosphère → anti-greenhouse. Au-dessous : pas de brume.
// Seuil Haqq-Misra 2008 : 0.1. NB : modèles plus récents (Arney et al. 2016) suggèrent plutôt 0.2.
// Actuellement INFORMATIF UNIQUEMENT — non-lu par le worker spectral. Hook futur pour SW haze.

// ─── CONTINUUM H₂O (self + foreign), spectral ────────────────────────────────────────────────
// Absorption continue de la vapeur entre les raies (dimères, ailes lointaines) — c'est elle qui ferme la fenêtre
// 8–12 µm dans une atmosphère humide, et qui fait la couverture d'une atmosphère de vapeur.
// Roberts, Selby & Biberman 1976, Appl. Opt. 15:2085 (forme reprise par Pierrehumbert 2010, Principles of
// Planetary Climate §4.4) :
//   C_s(ν, 296 K) = a + b·exp(−β ν)            [cm² molécule⁻¹ atm⁻¹]
//   κ = C_s(ν,T) · (e + γ_f·(P − e)) · n_H₂O     (e : pression partielle de vapeur [atm])
//   C_s(ν,T) = C_s(ν,296)·exp[T₀ (1/T − 1/296)]   (dépendance en T négative : plus fort à froid)
// DOMAINE DE LA MESURE : 400–1250 cm⁻¹ (8–25 µm). Ailleurs (fenêtres de 4 µm et du proche IR, qui comptent sur
// un océan de magma), le continuum n'est PAS représenté : absence déclarée, pas une valeur inventée.
// Remplace le « piégeage » MT_CKD scalaire (W/m² ∝ PWV², calé à 12 W/m², désactivé).
EARTH.CONTINUUM_H2O = {
    A: 1.25e-22,          // [cm² molécule⁻¹ atm⁻¹]
    B: 1.67e-19,          // [cm² molécule⁻¹ atm⁻¹]
    BETA: 7.87e-3,        // [cm]
    T0: 1800,             // [K]
    GAMMA_FOREIGN: 0.002, // [-] efficacité d'un collisionneur étranger rapportée à H₂O
    NU_MIN: 400,          // [cm⁻¹] domaine de la mesure
    NU_MAX: 1250          // [cm⁻¹]
};

// ─── FACTEUR DE DIFFUSIVITÉ ─────────────────────────────────────────────────────────────────────────────────────────
// Le transfert est calculé en flux, pas en luminance : un rayonnement isotrope qui traverse une couche d'épaisseur
// optique VERTICALE τ est transmis en 2E₃(τ) ≈ exp(−D·τ), D = 1,66 (Elsasser 1942 ; Goody & Yung 1989, Atmospheric
// Radiation §2.5 ; Liou 2002). Sans lui, chaque couche est traitée comme si tout le flux montait à la verticale :
// l'atmosphère paraît 1,66 fois trop transparente. Équation (angle moyen d'un flux isotrope), pas un réglage.
EARTH.DIFFUSIVITE = 1.66;  // [-]

// ─── NUAGES : nuage ADIABATIQUE de la parcelle, limité par la pluie ; fraction mesurée ──────────────────────────────
// La parcelle sature au niveau de condensation (base), son excès d'eau condense en montant ; les gouttes grossissent
// jusqu'au rayon d'initiation de la pluie (14 µm), où le nuage précipite (sommet). Épaisseur, eau et τ sortent de là.
// Essais rejetés (2026-10-13) : Ackerman & Marley 2001 (colonne 1D saturée de la base à la tropopause, W ≈ 2 kg/m²,
// 20× la mesure) ; schéma statistique de Sommeria & Deardorff (nuages étalés sur 5 km, eau dans le nuage 0,5–1,3 kg/m²).
// Dans les deux cas il manque l'INVERSION qui coupe les vrais nuages : c'est de la dynamique 3D, hors d'un modèle 1D.
EARTH.NUAGES = {
    // Humidité relative MOYENNE du gaz (le nuage n'en dépend pas) : Manabe & Wetherald (1967, J. Atmos. Sci. 24:241),
    // loi tirée des observations, standard des modèles radiatifs-convectifs 1D : r̄ = RH_s · (p/p_s − 0,02) / (1 − 0,02),
    // RH_s = humidité de surface du modèle (H2O_SURFACE_RH_01). ⚠️ MESURE (forme), pas une équation de la physique.
    MW_P_RESIDU: 0.02,         // [-]
    RHO_LIQUIDE: 1000,         // [kg/m³]
    RHO_GLACE: 917,            // [kg/m³]
    // ─── Gouttes liquides : rayon effectif de Martin, Johnson & Spice (1994, J. Atmos. Sci. 51:1823), mesures avion
    //     en stratocumulus : r_eff³ = 3·LWC / (4π ρ_w k N). k = (r_volumique / r_eff)³ dépend de la masse d'air :
    K_MARTIN_OCEAN: 0.80,      // [-] masse d'air maritime (Martin et al. 1994)
    K_MARTIN_CONTINENT: 0.67,  // [-] masse d'air continentale (Martin et al. 1994)
    //     N = nombre de gouttes. Sur océan, il est une JAUGE (DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3, fourchette MODIS
    //     de Bennartz 2007) ; sur continent, valeur typique des mesures avion (Gultepe & Isaac 2004, QJRMS 130, doi:10.1256/qj.03.120 :
    //     ~100 cm⁻³ maritime, ~200 cm⁻³ continental). Les deux sont la Terre actuelle : le rapport de CCN de l'époque
    //     (ALBEDO.rapportCCN, loi sulfate de McCoy 2018) les multiplie — Twomey sort alors seul, r_eff ∝ N^(−1/3).
    CDNC_CONTINENT_CM3: 200,   // [cm⁻³]
    // ─── Pluie : les gouttes coalescent et précipitent dès que leur rayon effectif atteint ~13–14 µm (seuil MESURÉ
    //     d'initiation de la pluie chaude : Rosenfeld & Gutman 1994, Atmos. Res. 34:259 ; Freud & Rosenfeld 2012,
    //     GRL 39:L12803 ; Braga et al. 2021, ACP 21:14079). Avec Martin et al., l'eau liquide qu'un nuage peut garder
    //     est donc LWC_pluie = (4π/3) ρ_w k N r_pluie³ ; au-delà elle tombe. Plus de gouttes → nuage plus chargé
    //     avant de pleuvoir. Le seuil est une JAUGE mesurée : DATA['🎚️'].CLOUD_SW.R_EFF_PLUIE (13 µm Braga et al. 2021,
    //     14 µm Rosenfeld & Gutman 1994 / Freud & Rosenfeld 2012).
    // ─── Glace : pas de loi physique simple de la taille des cristaux (habitus, agrégation). ⚠️ FOURCHETTE de mémoire
    //     des rayons effectifs MODIS de la glace, ~20–40 µm (King et al. 2013 fig. 13–14, à relever) → 30 µm.
    R_EFF_GLACE: 30e-6,        // [m]
    // ─── Phase : partition linéaire liquide/glace entre −40 °C et 0 °C (Hu & Stamnes 1993, J. Climate 6:728).
    T_TOUT_GLACE: 233.15,      // [K]
    T_TOUT_LIQUIDE: 273.15,    // [K]
    // ─── Diffusion solaire : facteur d'asymétrie des gouttes dans le visible (Hansen & Travis 1974, Space Sci. Rev.
    //     16:527 ; Lacis & Hansen 1974, J. Atmos. Sci. 31:118). Réflectance deux-flux d'un nuage conservatif :
    //     R = √3(1−g)τ / (2 + √3(1−g)τ) = 0,13 τ / (1 + 0,13 τ) pour g = 0,85.
    G_ASYMETRIE: 0.85,         // [-]
    // ─── FRACTIONS — MESURÉES, pas prévisibles en 1D (Windsor et al. 2022 §3.2 : la dynamique 3D qui les fixe n'a pas
    //     d'équation fermée dans une colonne). Évaluation GEWEX mise à jour (Stubenrauch et al. 2024, Surv. Geophys.
    //     45:1999), vue en colonne (CloudSat-CALIPSO + ISCCP corrigé) : bas 0,41 ± 0,05, moyens 0,23 ± 0,03, hauts 0,29
    //     (passifs) à 0,37 (lidar CALIPSO, cirrus fins compris) ; total 0,66 ± 0,04 (≈ recouvrement aléatoire des trois).
    //     Les nuages MOYENS ne sont pas représentés (⚠️ déclaré) : bas = population adiabatique, hauts = enclumes.
    F_BAS: 0.41,               // [m²/m²]
    F_HAUT: 0.37,              // [m²/m²] lidar : les cirrus fins comptent en infrarouge
    // ─── Nuages HAUTS (enclumes et cirrus) : glace au niveau T_ENCLUME du profil (sortie de la convection). Épaisseur optique visible : une enclume naît opaque et
    //     s'amincit à mesure que la glace tombe ; à amincissement exponentiel, une population en régime établi a ln τ
    //     uniformément réparti. CALIPSO (Stubenrauch et al. 2024 §3.1) : sur 0,37 de nuages hauts, 0,13 ont τ < 0,3 et
    //     0,09 sont opaques (τ ≳ 3), soit environ un tiers par décade ; ⚠️ bornes 0,03–30 ajustées sur ces tiers.
    // Altitude des enclumes : la convection se détend là où la vapeur devient trop rare pour refroidir l'air par
    // rayonnement ; ce niveau est fixé par la pression de vapeur saturante, donc par une TEMPÉRATURE (« fixed anvil
    // temperature », Hartmann & Larson 2002, GRL 29:1951). ⚠️ ~220 K de mémoire, à vérifier. Si la tropopause est plus
    // chaude, l'enclume est à la tropopause.
    T_ENCLUME: 220,            // [K]
    TAU_HAUT_MIN: 0.03,        // [-]
    TAU_HAUT_MAX: 30           // [-]
    // Contrôles (pas des entrées) : MODIS 0,67 (King et al. 2013) ; effets nuages CERES −47 (SW) / +26–28 (LW) W/m².
};
// Capacité calorifique massique de l'air humide (J/(kg·K)). Utilisé pour le gradient adiabatique Γ = g/Cp dans computeH2OScaleHeight().
// Valeur ±5 % stable entre atmosphère N₂+O₂ moderne, CO₂ dense (Hadéen) et N₂+CO₂ précoce. Cp_CO2 ≈ 840, Cp_H2O gas ≈ 1864, Cp_N2 ≈ 1040.
EARTH.CP_AIR_MOIST_J_KG_K = 1005;  // [J/(kg·K)]
EARTH['🪩🍰'] = {
    '🪩🍰🎾': 0.05, '🪩🍰🌊': 0.08, '🪩🍰🌳': 0.17, '🪩🍰🏜️': 0.30,
    '🪩🍰🧊': 0.70, '🪩🍰🌍': 0.18,
    // ⛅ retiré (2026-10-12) : la réflectance du nuage n'est plus une constante réglée (0,42) mais le résultat du
    // condensat calculé (deux-flux, EARTH.NUAGES) — DATA['🪩']['🪩🍰⛅'].
    // ❄️ = neige propre profonde (T_polaire ≤ −30 °C) — Warren & Wiscombe (1980) J. Atmos. Sci. 37:2734 ;
    // Warren (1982) Rev. Geophys. 20:67. Plage pristine snow 0.80–0.90 ; 0.85 = médiane broadband.
    '🪩🍰❄️': 0.85,
    // 🏊 = bare ice + melt ponds (segment haut Briegleb, T ≥ 0 °C) — Perovich (2002) SHEBA ; Briegleb et al. NCAR/TN-463 §5.
    '🪩🍰🏊': 0.50
};

// ========== STATE (état solver partagé : glace figée, etc.) ==========
var STATE = window.STATE = {};

// ========== PHYS (fonctions de physique exposées) ==========
var PHYS = window.PHYS = {};

// NOTE : C_MAX_CLOUD et ETA_CLOUD ne sont PAS des constantes universelles
// Elles dépendent de la pression atmosphérique, composition, gravité, température
// Elles sont calculées dynamiquement dans calculateCloudFormationIndex() ou calculateAlbedo()

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
// - Cap numérique : pour T très élevé (ex. Hadéen 2450 K) et λ court, term1/term2 peut overflow → plafonner
function planckFunction(lambda, T) {
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    const B = term1 / term2;   // term2 = +∞ (λT très petit) → B = 0, la vraie limite
    return Math.min(B, CONST.MAX_PLANCK_SAFE); // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

PHYS.planckFunction = planckFunction;

// ═══ EAU : COURBE DE SATURATION (IAPWS) ═══════════════════════════════════════════════════════
// Une seule loi p_sat(T), mesurée, du froid polaire au point critique — plus de Clausius-Clapeyron à L constante
// (valide près de 273 K, fausse de +8 % à 330 K et sans objet au-delà de 647 K).
//   · liquide–vapeur, 273,16 K ≤ T < T_c : Wagner & Pruss 2002, J. Phys. Chem. Ref. Data 31:387, éq. 2.5
//       ln(p/p_c) = (T_c/T)·(a₁τ + a₂τ^1,5 + a₃τ³ + a₄τ^3,5 + a₅τ⁴ + a₆τ^7,5),  τ = 1 − T/T_c
//   · glace–vapeur, T < 273,16 K : Wagner, Riethmann, Feistel & Harvey 2011, J. Phys. Chem. Ref. Data 40:043103, éq. 6
//       ln(p/p_t) = θ⁻¹·Σ aᵢ θ^bᵢ,  θ = T/T_t
//   · T ≥ T_c : il n'existe plus de liquide — aucune pression ne fait condenser l'eau (p_sat = +∞).
const EAU = {
    T_C: 647.096,          // [K]  point critique, IAPWS-95 (Wagner & Pruss 2002)
    P_C: 22.064e6,         // [Pa] point critique, IAPWS-95
    A: [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502],   // [-] Wagner & Pruss 2002
    N: [1, 1.5, 3, 3.5, 4, 7.5],
    SA: [-21.2144006, 27.3203819, -6.10598130],    // [-] Wagner et al. 2011
    SB: [0.00333333333, 1.20666667, 1.70333333]
};
PHYS.EAU = EAU;

/** [Pa] Pression de vapeur saturante de l'eau à T [K] (sur glace sous le point triple). +∞ au-delà de T_c. */
function pSatEau(T) {
    if (T >= EAU.T_C) return Infinity;
    if (T >= CONST.T_TRIPLE_WATER) {
        const tau = 1 - T / EAU.T_C;
        let f = 0;
        for (let i = 0; i < 6; i++) f += EAU.A[i] * Math.pow(tau, EAU.N[i]);
        return EAU.P_C * Math.exp(EAU.T_C / T * f);
    }
    const th = T / CONST.T_TRIPLE_WATER;
    let s = 0;
    for (let i = 0; i < 3; i++) s += EAU.SA[i] * Math.pow(th, EAU.SB[i]);
    return CONST.P_TRIPLE_WATER * Math.exp(s / th);
}
PHYS.pSatEau = pSatEau;


/** [1/K] d(ln p_sat)/dT, dérivée analytique des deux mêmes formules (T < T_c). */
function dLnPSatEau(T) {
    if (T >= CONST.T_TRIPLE_WATER) {
        const tau = 1 - T / EAU.T_C;
        let f = 0, df = 0;
        for (let i = 0; i < 6; i++) {
            f += EAU.A[i] * Math.pow(tau, EAU.N[i]);
            df += EAU.A[i] * EAU.N[i] * Math.pow(tau, EAU.N[i] - 1);
        }
        return -EAU.T_C * f / (T * T) - df / T;
    }
    const th = T / CONST.T_TRIPLE_WATER;
    let d = 0;
    for (let i = 0; i < 3; i++) d += EAU.SA[i] * (EAU.SB[i] - 1) * Math.pow(th, EAU.SB[i] - 2);
    return d / CONST.T_TRIPLE_WATER;
}
PHYS.dLnPSatEau = dLnPSatEau;

/** [K] Température de saturation à la pression partielle de vapeur p [Pa] (inverse de pSatEau, dichotomie sur
 *  la courbe monotone). p ≥ p_c : l'eau ne condense à aucune température → −∞ (aucune contrainte). */
function tSatEau(p) {
    if (p >= EAU.P_C) return -Infinity;
    let lo = 50, hi = EAU.T_C;   // 50 K : bas du domaine de Wagner et al. 2011
    for (let k = 0; k < 60; k++) {
        const mid = 0.5 * (lo + hi);
        if (pSatEau(mid) < p) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}
PHYS.tSatEau = tSatEau;

/**
 * L'eau peut-elle être LIQUIDE à la surface ? Non si T ≥ T_c, ou si la pression de vapeur que donnerait TOUTE l'eau
 * en l'air n'atteint pas la saturation à T (rien ne peut condenser : l'océan s'évapore entièrement). C'est l'état
 * de phase, pas un réglage : océan de magma, atmosphère de vapeur post-impact, emballement.
 * Masses : DATA['⚖️'] (⚖️🫧 = air SEC) ; surface et gravité de l'époque, comme ATM.calculatePressureAtm.
 */
function eauSansLiquide() {
    const DATA = window.DATA;
    const m = DATA['⚖️'];
    if (!(m['⚖️💧'] > 0)) return false;                 // pas d'eau : aucune phase à trancher
    const T = DATA['🧮']['🧮🌡️'];
    if (T >= EAU.T_C) return true;
    const EP = DATA['📅'];
    const aire = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
    const nEau = m['⚖️💧'] / CONST.M_H2O;
    const nSec = m['⚖️🏭'] / CONST.M_CO2 + m['⚖️🐄'] / CONST.M_CH4 + m['⚖️🫁'] / CONST.M_O2 + m['⚖️💨'] / CONST.M_N2;
    const pToutVapeur = (m['⚖️💧'] + m['⚖️🫧']) * EP['🍎'] / aire;          // [Pa] pression totale, toute l'eau en l'air
    return pSatEau(T) >= pToutVapeur * nEau / (nEau + nSec);
}
PHYS.eauSansLiquide = eauSansLiquide;

// ✅ HAUTEUR D'ÉCHELLE DE LA VAPEUR SATURÉE (régime avec océan) :
// - La vapeur suit la saturation le long du gradient Γ : p_v(z) = p_sat(T₀ − Γz)
//   ⇒ d(ln p_v)/dz = −Γ · d(ln p_sat)/dT  ⇒  H_vap = 1 / (Γ · d ln p_sat/dT), dérivée IAPWS ci-dessus.
// - C'est la forme exacte de R·T²/(L·Γ) : Clausius-Clapeyron n'est que l'approximation d(ln p_sat)/dT ≈ L/(R_v T²),
//   avec L de Bolton (1980) valide ~200–400 K. Ici, valide jusqu'au point critique (647 K) : l'ancienne borne
//   « T < 600 K, au-delà non modélisé » tombe. Au-delà, il n'y a plus de vapeur saturée — c'est le régime
//   eauSansLiquide(), qui a son propre profil (radiative/calculations.js, profilVapeurSeule).
// - Γ = g / Cp humide (EARTH.CP_AIR_MOIST_J_KG_K). Terre moderne (288 K) : H_vap ≈ 2,4 km (Manabe & Wetherald 1967).
function computeH2OScaleHeight() {
    const T = window.DATA['🧮']['🧮🌡️'];
    const g = window.TIMELINE[window.DATA['📜']['👉']]['🍎'];
    const Gamma = g / EARTH.CP_AIR_MOIST_J_KG_K;          // K/m
    return 1 / (Gamma * dLnPSatEau(T));                   // m
}

PHYS.computeH2OScaleHeight = computeH2OScaleHeight;

// ═══ CAPACITÉS THERMIQUES DES GAZ, f(T) ══════════════════════════════════════════════════════════
// cp molaire [J/mol/K] aux températures TCP : Chase 1998, NIST-JANAF Thermochemical Tables, 4ᵉ éd.
// (J. Phys. Chem. Ref. Data, Monograph 9). Interpolation linéaire ; hors table = erreur (crash, pas de repli).
// Sert au gradient adiabatique sec g/cp d'une atmosphère chaude (2 800 K : cp de H₂O ×1,6 par rapport à 300 K).
const TCP = [300, 600, 1000, 1500, 2000, 3000];   // [K]
const CP_MOLAIRE = {                               // [J/mol/K]
    H2O: [33.60, 36.33, 41.27, 47.07, 51.18, 55.75],
    CO2: [37.22, 47.32, 54.31, 58.38, 60.43, 62.23],
    N2:  [29.12, 30.11, 32.70, 34.85, 36.00, 37.03],
    O2:  [29.39, 32.09, 34.88, 36.56, 37.78, 39.88],
    CH4: [35.76, 52.22, 71.80, 86.19, 94.40, 101.4]
};
function cpMolaire(gaz, T) {
    const t = Math.max(TCP[0], T);   // sous 300 K, cp ≈ constant (gaz parfaits, modes de vibration gelés)
    if (t > TCP[TCP.length - 1]) throw new Error('[PHYS.cpMolaire] T = ' + T + ' K hors table JANAF (≤ 3000 K)');
    let i = 0;
    while (TCP[i + 1] < t) i++;
    const w = (t - TCP[i]) / (TCP[i + 1] - TCP[i]);
    return CP_MOLAIRE[gaz][i] + w * (CP_MOLAIRE[gaz][i + 1] - CP_MOLAIRE[gaz][i]);
}
PHYS.cpMolaire = cpMolaire;

// Borne basse/haute (K) pour "cycle eau actif", fonction de la pression (atm).
// Plage max -10°C à 150°C ; la pression resserre la fourchette (gel et évaporation).
function getWaterCycleTempBoundsFromPressure(P_atm) {
    const T_MIN_K = EARTH.T_WATER_CYCLE_MIN_C + CONST.KELVIN_TO_CELSIUS;
    const T_MAX_K = EARTH.T_WATER_CYCLE_MAX_C + CONST.KELVIN_TO_CELSIUS;
    // Quasi sans atmosphère (⚫) : la pression ne resserre plus rien.
    if (P_atm < 0.01) return { T_low_K: T_MIN_K, T_high_K: T_MAX_K };
    const T_freeze = EARTH.T_FREEZE_SEAWATER_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM;
    const T_low_K = Math.max(T_MIN_K, T_freeze - EARTH.T_WATER_CYCLE_MARGIN_GEL_K);
    const T_high_K = Math.max(EARTH.T_WATER_CYCLE_EVAP_LOW_K, Math.min(T_MAX_K, T_MAX_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM));
    return { T_low_K, T_high_K };
}
PHYS.getWaterCycleTempBoundsFromPressure = getWaterCycleTempBoundsFromPressure;

// Facteur d'échelle vapeur d'eau (gaz) pour EDS. Calculé depuis T, P, vapor, CO2 (pas d'époque).
// Réf Schmidt 2010 : vapeur ~50% EDS. Formule corrige sur-estimation (chevauchement H2O/CO2 15-17 µm).
// CO2 ≥ 400 ppm : scale = 0.70 (lit. EDS_H₂O ~75 W/m² vs tau-ratio ~103 → réduction 38%).
// CO2 < 400 ppm : scale = 0.5 × f_T × f_P × f_v (saturation, pression).
//
// --- Credence et plage ---
// Credence: ~60%. 0.70 cible EDS_H₂O ≈ 72 W/m² à T=15°C (lit. ~75). Plage lit. 0.3–1.0.
// H2O_EDS_SCALE : EARTH.H2O_EDS_SCALE (calculations.js).