// ============================================================================
// File: API_BILAN/physics/physics.js - Constantes et lois physiques fondamentales
// Desc: module de physique fondamentale
// Version 2.0.14
// Date: [April 23, 2026]
// logs :
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
var CONST = window.CONST = window.CONST || {};

// ========== 1. FONDAMENTALES (universelles, sans ref terrestre) ==========
CONST.PLANCK_H = 6.62607015e-34;      // Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // c, m/s
CONST.BOLTZMANN_KB = 1.380649e-23;    // Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // Stefan-Boltzmann, W/(m²·K⁴)
CONST.SOLAR_CONSTANT = 1361;              // TSI W/m² (Kopp & Lean 2011, TSIS-1). 🔒 = L☉/(4π×AU²) = 3.828e26/(4π×1.496e11²)
CONST.MAX_PLANCK_SAFE = 1e30;         // Cap Planck (W/(m²·sr·m)) pour workers / transfert radiatif

// ========== 2. PHYSIQUE DURE (propriétés intrinsèques) ==========
CONST.R_GAS = 8.314;  // Gaz parfaits, J/(mol·K)
CONST.M_N2 = 0.02801;   // N₂ kg/mol
CONST.M_O2 = 0.03200;   // O₂ kg/mol
CONST.M_CO2 = 0.04401;  // CO₂ kg/mol
CONST.M_CH4 = 0.01604;  // CH₄ kg/mol
CONST.M_H2O = 0.01802;  // H₂O kg/mol
CONST.M_AR = 0.03995;   // Ar kg/mol
CONST.RHO_WATER = 1000;  // Densité eau kg/m³
CONST.P0_WATER = 611.2;  // Pression point triple eau (Pa)
CONST.L_VAPORIZATION = 2.5e6;  // Chaleur latente vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // R vapeur d'eau J/(kg·K)
CONST.L_V = 40660;  // Chaleur latente (J/mol)
CONST.CP_AIR = 1005;  // Capacité calorifique air sec J/(kg·K)
CONST.T_BOIL = 373.15;  // Ébullition eau 1 atm (K)
CONST.T0_WATER = 273.15;  // Point triple eau (K) — seule occurrence 273.15
CONST.T_LAVA_START = 1000;   // Transition lave (K)
CONST.T_LAVA_COMPLETE = 2373;  // Lave complète (K)
CONST.LAMBDA_CO2_CENTER = 15.0e-6;   // CO₂ 15 μm
CONST.LAMBDA_H2O_1 = 6.3e-6;
CONST.LAMBDA_H2O_2 = 17.0e-6;
CONST.LAMBDA_CH4_1 = 7.7e-6;
CONST.LAMBDA_CH4_2 = 3.3e-6;

// ========== 3. CONVERSION TEMPÉRATURE (DATA = K ; °C/°F = affichage) ==========
CONST.KELVIN_TO_CELSIUS = CONST.T0_WATER;  // 273.15
CONST.K2C = function (K) { return K - CONST.KELVIN_TO_CELSIUS; };
CONST.K2F = function (K) { return (K - CONST.KELVIN_TO_CELSIUS) * 9 / 5 + 32; };

// ========== CONV (convention : unités, références) ==========
var CONV = window.CONV = window.CONV || {};
CONV.AU_M = 1.496e11;
CONV.STANDARD_ATMOSPHERE_PA = 101325;
CONV.molar_mass_air_ref = 0.029;
CONV.SECONDS_PER_DAY = 86400;
CONV.TAU_VAPOR_GLOBAL_S = 10 * CONV.SECONDS_PER_DAY;
CONV.P_ANN_SCALE_MM_AN = 200000;
CONV.O2_REF_MASS = 1e18;
CONV.CH4_REF_MASS = 1e13;
CONV.CCN_O2_REF_KG = 1.08e18;
CONV.CCN_CH4_REF_KG = 5.2e12;
CONV.CCN_SULFATE_REF_KG = 1.0e14;
CONV.H2O_VAPOR_REF = 0.01;
CONV.ALPHA_OCEAN = 0.3;
CONV.SCALE_CLOUD = 0.4;

// ========== EARTH (terrestre : seuils climat, cycle eau, albédos par défaut ; overridable par époque) ==========
// var pour permettre plot.js / main.js de faire var EARTH = window.EARTH sans erreur
var EARTH = window.EARTH = window.EARTH || {};
// 🏷️ LEGACY — T_NO_POLAR_ICE_K = 293K était calibré comme seuil de T_GLOBALE (plus utilisé dans la formule 3-zones ;
// conservé pour rétro-compat outils externes / logs). La formule glace utilise désormais T_FREEZE_SEAWATER + dT.
EARTH.T_NO_POLAR_ICE_K = CONST.KELVIN_TO_CELSIUS + 20;         // 🏷️ DEPRECATED (usage hors albédo/flux/h2o)
EARTH.T_NO_POLAR_ICE_RANGE_K = 20;                             // largeur de rampe ice_temp_factor (utilisée)
/** Fraction max de glace polaire depuis la formule thermique (ice_temp_factor × ce coef, plafonné par highlands). */
EARTH.ICE_FORMULA_MAX_FRACTION = 0.46;                         // 🏷️ TUNING (calib visu Terre moderne)
EARTH.T_ICE_TRANSITION_RANGE_K = 20;

// ─── Amplification polaire (EBM 0D 3-zones, Budyko-Sellers) ────────────────────
// Hypothèse physique : T moyenne globale ≠ T locale par latitude. La glace se forme là où T_locale < T_freeze.
// On approxime avec 2 zones froides pondérées par leur fraction de surface :
//   Mi-latitude (30°–60°) : T_mid = T_glob − POLAR_AMP_MID_K    (f_mid ≈ 0.37 des 2 hémisphères)
//   Polaire     (60°–90°) : T_pol = T_glob − POLAR_AMP_POL_K    (f_pol ≈ 0.13 des 2 calottes)
// La zone tropicale (0°–30°, f≈0.50) est implicitement plus chaude (sans glace) et n'intervient pas.
// Seuil local glace → seuil global : T_thresh_z = T_FREEZE_SEAWATER_K + POLAR_AMP_z_K.
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
// Pour l'instant : constantes Terre-moderne pour toutes les époques. À discuter avant d'introduire ε dans le calcul.
EARTH.POLAR_AMP_POL_K = 20;                                    // écart global→pôle annuel moyen (Terre 2025 ; 🏷️ CALIB observationnelle)
EARTH.POLAR_AMP_MID_K = 5;                                     // écart global→mi-lat annuel moyen (Terre 2025)
EARTH.POLAR_ZONE_FRAC = 0.13;                                  // fraction surface polaire (60°–90° sur 2 hémisphères)
EARTH.MIDLAT_ZONE_FRAC = 0.37;                                 // fraction surface mi-latitude (30°–60°)

// ─── Amplitude saisonnière : largeur physique de la rampe glace ────────────────
// Amplitude saisonnière pic-à-pic divisée par 2 (half-range été-hiver), CALIBRÉES à ε_REF.
// Sources : ERA5 reanalysis 1991-2020 (T_mensuelles min/max) ; Peixoto & Oort 1992 ch.7.
// 🏷️ FLOU SCIENTIFIQUE — l'amplitude dépend aussi de la capacité thermique (océan/continent),
// circulation atmosphérique, ère glaciaire vs interglaciaire. Valeurs ci-dessous = Terre-moderne.
EARTH.SEASONAL_AMP_POL_K = 15;  // pôle : amplitude annuelle 2× (été + 15 K, hiver − 15 K) autour de la moyenne
EARTH.SEASONAL_AMP_MID_K = 25;  // mi-lat continentale : amplitude plus large (effet continentalité)

// ─── Couplage obliquité ε (activé) ─────────────────────────────────────────────
// ε = obliquité axiale (clé epoch '⚾'). Terre 2025 : ε_REF = 23.44°.
// Loi : amp_z_eff = SEASONAL_AMP_z_K × sin(ε) / sin(ε_REF)   (ε→0 → pas de saison → amp_eff=0)
// Source : insolation annuelle latitude-dépendante f(ε) — Berger 1978, Laskar et al. 2004.
// Hypothèse Archéen : Williams 1993 suggère ε ~ 45–70° (expliquerait glaciations basse-latitude
// du Protérozoïque sans invoquer un Snowball global).
EARTH.OBLIQUITY_DEG_REF = 23.44;     // référence où SEASONAL_AMP_*_K sont calibrés
EARTH.OBLIQUITY_DEG_DEFAULT = 23.44; // défaut si l'epoch n'a pas de '⚾'

/**
 * EARTH.computeIceTempFactor(T_glob_K, opts?) : ice_temp_factor ∈ [0,1].
 * FONCTION UNIQUE — appelée par calculations_albedo.js, calculations_flux.js, calculations_h2o.js.
 *
 * MODÈLE PHYSIQUE (EBM 0D × saisonnalité × obliquité) :
 *   En zone z, la T_locale annuelle vaut T_glob − dT_z (écart moyen observé).
 *   Amplitude saisonnière effective : amp_z_eff = SEASONAL_AMP_z_K × sin(ε) / sin(ε_REF).
 *   La glace se forme dès T_locale_hiver < T_FREEZE_SEAWATER (T_locale − amp_eff < T_FREEZE).
 *   La glace devient permanente dès T_locale_été < T_FREEZE (T_locale + amp_eff < T_FREEZE).
 *
 *   ⇒ Seuil HAUT (glace commence) : T_glob = T_FREEZE + dT_z + amp_z_eff
 *   ⇒ Seuil BAS  (glace permanente) : T_glob = T_FREEZE + dT_z − amp_z_eff
 *   ⇒ Rampe linéaire largeur = 2·amp_z_eff (ε↑ → rampe plus large → snowball plus difficile).
 *
 * opts (override test de sensibilité) :
 *   { dT_pol, dT_mid, amp_pol, amp_mid, f_pol, f_mid, obliquity_deg }
 *   amp_pol/amp_mid directs écrasent le calcul sin(ε) (sinon dérivés d'obliquity_deg).
 *
 * @returns {{ice_tf, tf_pol, tf_mid, T_thresh_pol_high, T_thresh_pol_low,
 *            T_thresh_mid_high, T_thresh_mid_low, dT_pol, dT_mid, amp_pol, amp_mid,
 *            obliquity_deg, obliquity_factor}}
 */
EARTH.computeIceTempFactor = function (T_glob_K, opts) {
    opts = opts || {};
    var cc = (typeof window !== 'undefined' && window.CONFIG_COMPUTE) ? window.CONFIG_COMPUTE : {};
    var f_pol = Number.isFinite(Number(opts.f_pol)) ? Number(opts.f_pol)
              : (Number.isFinite(Number(cc.polarZoneFraction))  ? Number(cc.polarZoneFraction)  : EARTH.POLAR_ZONE_FRAC);
    var f_mid = Number.isFinite(Number(opts.f_mid)) ? Number(opts.f_mid)
              : (Number.isFinite(Number(cc.midlatZoneFraction)) ? Number(cc.midlatZoneFraction) : EARTH.MIDLAT_ZONE_FRAC);
    var dT_pol = Number.isFinite(Number(opts.dT_pol)) ? Number(opts.dT_pol)
              : (Number.isFinite(Number(cc.polarAmplificationK))  ? Number(cc.polarAmplificationK)  : EARTH.POLAR_AMP_POL_K);
    var dT_mid = Number.isFinite(Number(opts.dT_mid)) ? Number(opts.dT_mid)
              : (Number.isFinite(Number(cc.midlatAmplificationK)) ? Number(cc.midlatAmplificationK) : EARTH.POLAR_AMP_MID_K);
    // Obliquité : opts > CONFIG_COMPUTE global > EARTH default.
    var obliquity_deg = Number.isFinite(Number(opts.obliquity_deg)) ? Number(opts.obliquity_deg)
              : (Number.isFinite(Number(cc.obliquityDeg)) ? Number(cc.obliquityDeg) : EARTH.OBLIQUITY_DEG_DEFAULT);
    // Facteur sin(ε)/sin(ε_REF), borné à 0 (ε peut chaoser mais sin ne devient pas négatif ici).
    var toRad = Math.PI / 180;
    var sinRef = Math.sin(EARTH.OBLIQUITY_DEG_REF * toRad);
    var obliquity_factor = Math.max(0, Math.sin(obliquity_deg * toRad) / sinRef);
    // Amplitudes effectives : opts.amp_* écrasent le dérivé d'obliquité (pour tests sensibilité).
    var amp_pol_base = Number.isFinite(Number(cc.seasonalAmpPolK)) ? Number(cc.seasonalAmpPolK) : EARTH.SEASONAL_AMP_POL_K;
    var amp_mid_base = Number.isFinite(Number(cc.seasonalAmpMidK)) ? Number(cc.seasonalAmpMidK) : EARTH.SEASONAL_AMP_MID_K;
    var amp_pol = Number.isFinite(Number(opts.amp_pol)) ? Number(opts.amp_pol) : (amp_pol_base * obliquity_factor);
    var amp_mid = Number.isFinite(Number(opts.amp_mid)) ? Number(opts.amp_mid) : (amp_mid_base * obliquity_factor);
    // Seuils haut (glace commence saisonnalement) et bas (glace permanente).
    var T_thresh_pol_high = EARTH.T_FREEZE_SEAWATER_K + dT_pol + amp_pol;
    var T_thresh_pol_low  = EARTH.T_FREEZE_SEAWATER_K + dT_pol - amp_pol;
    var T_thresh_mid_high = EARTH.T_FREEZE_SEAWATER_K + dT_mid + amp_mid;
    var T_thresh_mid_low  = EARTH.T_FREEZE_SEAWATER_K + dT_mid - amp_mid;
    // Rampe linéaire sur 2·amp_z_eff (largeur physique, dérivée de sin(ε)).
    var widthPol = Math.max(1e-6, 2 * amp_pol);
    var widthMid = Math.max(1e-6, 2 * amp_mid);
    var tf_pol = Math.max(0, Math.min(1, (T_thresh_pol_high - T_glob_K) / widthPol));
    var tf_mid = Math.max(0, Math.min(1, (T_thresh_mid_high - T_glob_K) / widthMid));
    var fsum = f_pol + f_mid;
    var ice_tf = fsum > 0 ? (f_pol * tf_pol + f_mid * tf_mid) / fsum : 0;
    return {
        ice_tf: ice_tf,
        tf_pol: tf_pol, tf_mid: tf_mid,
        T_thresh_pol_high: T_thresh_pol_high, T_thresh_pol_low: T_thresh_pol_low,
        T_thresh_mid_high: T_thresh_mid_high, T_thresh_mid_low: T_thresh_mid_low,
        // compat rétro-facing (ancien champ exposé par calculations_albedo.js) :
        T_thresh_pol: T_thresh_pol_high, T_thresh_mid: T_thresh_mid_high,
        dT_pol: dT_pol, dT_mid: dT_mid, amp_pol: amp_pol, amp_mid: amp_mid,
        obliquity_deg: obliquity_deg, obliquity_factor: obliquity_factor
    };
};
EARTH.EVAPORATION_E0 = 0.001;
EARTH.EVAPORATION_T_REF = 288;
EARTH.EVAPORATION_T_SCALE = 20;
/** Cap vapeur dynamique Clausius-Clapeyron (ERA5/AIRS). calculations_h2o.js : c_c_max = REF × exp(RATE × (T - T_REF)). */
EARTH.H2O_VAPOR_CAP_REF = 0.0065;        // fraction massique vapeur à T_ref (~0.65 %, ERA5/AIRS)
EARTH.H2O_VAPOR_CAP_RATE_PER_K = 0.065;  // taux exponentiel /K — C-C ≈ Lv/(Rv×T²) ≈ 6.5 %/K à 288 K
/** Cap vapeur final Init (AIRS/ERA5). calculations_h2o.js : realistic_vapor_max = REF × exp(RATE × (T - T_REF)). */
EARTH.H2O_VAPOR_REALISTIC_MAX_REF = 0.0052;
EARTH.H2O_VAPOR_REALISTIC_MAX_RATE_PER_K = 0.013;
/** Feedback Iris simplifié (vapeur / iris_factor). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025 amplitude prudente. */
EARTH.IRIS_STRENGTH = 0.02;   // amplitude (sans dimension, × (T - T_REF) / IRIS_T_SCALE_K)
EARTH.IRIS_T_SCALE_K = 10;    // échelle thermique (par 10 K)
EARTH.IRIS_FACTOR_MIN = 0.7;  // plancher iris_factor (évite sur-assèchement)
EARTH.T_FREEZE_SEAWATER_K = 271.15;
EARTH.T_WATER_CYCLE_MIN_C = -10;
EARTH.T_WATER_CYCLE_MAX_C = 150;
EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1;
EARTH.T_WATER_CYCLE_MARGIN_GEL_K = 5;
EARTH.T_WATER_CYCLE_EVAP_LOW_K = 323.15;
EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM = 5;
/** Seuils pour recalcul partition eau (calculations_h2o.js) : recalcul seulement si ΔT > DELTA_T_K ou ΔP > DELTA_P_ATM. */
EARTH.WATER_PARTITION_DELTA_T_K = 5;
EARTH.WATER_PARTITION_DELTA_P_ATM = 1;
EARTH.PRECIP_BASE_RATE = 5e-6;
EARTH.PRECIP_PRESSURE_SCALE = 5e-6;
EARTH.PRECIP_CLOUD_SCALE = 1e-6;
/** Précip convective (calculations_h2o.js) : facteur temp = (T / T_REF)^EXP_T, facteur RH = (RH / RH_REF)^EXP_RH. Lit. Held & Soden 2006, IPCC AR6 ; réponse précip plus lente que C-C. */
EARTH.PRECIP_CONVECTIVE_T_REF_K = 288;   // T ref (réutilise EVAPORATION_T_REF)
EARTH.PRECIP_CONVECTIVE_T_EXPONENT = 1.2; // adouci vs C-C (~7%/K) pour éviter sur-assèchement
EARTH.PRECIP_CONVECTIVE_RH_REF = 0.7;    // seuil RH convective typique (~70 %)
EARTH.PRECIP_CONVECTIVE_RH_EXPONENT = 1.0; // exposant facteur humidité (calib v1.0.8)
// Facteur κ_H2O global dans EDS. Piloté par FINE_TUNING_BOUNDS.RADIATIVE.H2O_EDS_SCALE (baryGroup SCIENCE, sync via tuning.js).
// Défaut 0.60 = bary SCIENCE 100 % = cible Schmidt 2010 (EDS H₂O ~75 W/m²). Ex-recalcul dynamique sqrt(P_ratio)×CO2_factor retiré v2.0.10 (double-comptait pressure broadening HITRAN).
EARTH.H2O_EDS_SCALE = 0.60;

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
EARTH.CH4_EDS_SCALE = 1.0;

// ─── Seuil de brume organique (Haqq-Misra 2008 Fig. 1) ─────────────────────────
// Rapport molaire CH4/CO2 au-delà duquel le méthane polymérise en Tholin (brume organique)
// qui absorbe le SW en stratosphère → anti-greenhouse. Au-dessous : pas de brume.
// Seuil Haqq-Misra 2008 : 0.1. NB : modèles plus récents (Arney et al. 2016) suggèrent plutôt 0.2.
// Actuellement INFORMATIF UNIQUEMENT — non-lu par le worker spectral. Hook futur pour SW haze.
EARTH.CH4_HAZE_RATIO_THRESHOLD = 0.1;
// Capacité calorifique massique de l'air humide (J/(kg·K)). Utilisé pour le gradient adiabatique Γ = g/Cp dans computeH2OScaleHeight().
// Valeur ±5 % stable entre atmosphère N₂+O₂ moderne, CO₂ dense (Hadéen) et N₂+CO₂ précoce. Cp_CO2 ≈ 840, Cp_H2O gas ≈ 1864, Cp_N2 ≈ 1040.
EARTH.CP_AIR_MOIST_J_KG_K = 1005;
EARTH['🪩🍰'] = {
    '🪩🍰🎾': 0.05, '🪩🍰🌊': 0.08, '🪩🍰🌳': 0.17, '🪩🍰🏜️': 0.30,
    '🪩🍰🧊': 0.70, '🪩🍰⛅': 0.50, '🪩🍰🌍': 0.18
};

// ========== STATE (état solver partagé : glace figée, etc.) ==========
var STATE = window.STATE = window.STATE || {};

// ========== PHYS (fonctions de physique exposées) ==========
var PHYS = window.PHYS = window.PHYS || {};

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
    if (!Number.isFinite(lambda) || !Number.isFinite(T) || lambda <= 0 || T <= 0) return 0;
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    const B = (term2 > 0) ? term1 / term2 : 0;
    if (!Number.isFinite(B) || B < 0) return 0;
    return Math.min(B, CONST.MAX_PLANCK_SAFE); // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

PHYS.planckFunction = planckFunction;

// ✅ SCIENTIFIQUEMENT CERTAIN (Clausius-Clapeyron + gradient adiabatique) :
// - H_vap effectif (m) de la colonne de vapeur d'eau : r(z) = r₀·exp(-z/H_vap).
// - Dérivation : r_sat(T) ∝ p_sat(T)/p_air ; dp_sat/dT = L·p_sat/(R·T²) (Clausius-Clapeyron) ;
//   T(z) = T_0 − Γ·z (tropo adiabatique humide) ⇒ d(ln r_sat)/dz = −L·Γ/(R·T²) ⇒ H_vap = R·T²/(L·Γ).
// - L(T) ≈ 2.5e6 − 2400·(T−273.15) J/kg (Bolton 1980, valide ~200–400 K).
// - Γ = g / Cp_air (K/m). Cp_air humide ≈ 1005 J/(kg·K) (EARTH.CP_AIR_MOIST_J_KG_K).
// - Réf. : Manabe & Wetherald 1967 ; Held & Soden 2006 ; IPCC AR6 WG1 ch.7.
// - Terre moderne (T=288, g=9.81) → H_vap ≈ 2.4 km ; LGM (280) ≈ 2.2 km ; Hadéen chaud (500) ≈ 15 km.
// - NE PAS confondre avec la scale-height hydrostatique R·T/(M_H2O·g) ≈ 13.6 km (gaz pur H₂O) : juste en mécanique pure mais irréaliste car H₂O condense en altitude.
// - Domaine validité : T < 600 K (sous point critique H₂O à 647 K). Au-delà : régime supercritique non modélisé ici.
function computeH2OScaleHeight() {
    const T = window.DATA['🧮']['🧮🌡️'];
    const g = window.TIMELINE[window.DATA['📜']['👉']]['🍎'];
    const L_spec = 2.5e6 - 2400 * (T - 273.15);          // J/kg (Bolton 1980)
    const L_molar = L_spec * CONST.M_H2O;                 // J/mol
    const Gamma = g / EARTH.CP_AIR_MOIST_J_KG_K;          // K/m
    return CONST.R_GAS * T * T / (L_molar * Gamma);       // m
}

PHYS.computeH2OScaleHeight = computeH2OScaleHeight;

// Borne basse/haute (K) pour "cycle eau actif", fonction de la pression (atm).
// Plage max -10°C à 150°C ; la pression resserre la fourchette (gel et évaporation).
function getWaterCycleTempBoundsFromPressure(P_atm) {
    const T_MIN_K = EARTH.T_WATER_CYCLE_MIN_C + CONST.KELVIN_TO_CELSIUS;
    const T_MAX_K = EARTH.T_WATER_CYCLE_MAX_C + CONST.KELVIN_TO_CELSIUS;
    if (typeof P_atm !== 'number' || !Number.isFinite(P_atm) || P_atm < 0.01) {
        return { T_low_K: T_MIN_K, T_high_K: T_MAX_K };
    }
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