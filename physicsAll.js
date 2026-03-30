// File: API_BILAN/physicsAll.js - Physics combinées (physics, hitran, climate, calculations, compute)
// Desc: Concatenation automatique de : physics/physics.js + data/hitran_lines_*.js + spectroscopy/hitran.js + physics/climate.js + radiative/calculations.js + workers/worker_pool.js + h2o/calculations_h2o.js + albedo/calculations_albedo.js + atmosphere/calculations_atm.js + convergence/compute.js
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: Mar 08, 2026
// ============================================================================
// File: API_BILAN/physics/physics.js - Constantes et lois physiques fondamentales
// Desc: En français, dans l'architecture, je suis le module de physique fondamentale
// Version 2.0.7
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
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
// - v2.0.8 : H2O_EDS_SCALE calculé depuis DATA : 0.92 × sqrt(P_ratio) × CO2_factor (P_ratio=⚖️🫧/5.148e18, CO2_factor=max(0.7,1−2×🍰🫧🏭)). TODO quand validé : formules + doc/API.
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// var pour permettre plot.js et main.js de faire var CONST = window.CONST sans erreur
var CONST = window.CONST = window.CONST || {};

// ========== 1. FONDAMENTALES (universelles, sans ref terrestre) ==========
CONST.PLANCK_H = 6.62607015e-34;      // Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // c, m/s
CONST.BOLTZMANN_KB = 1.380649e-23;    // Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // Stefan-Boltzmann, W/(m²·K⁴)
CONST.SOLAR_CONSTANT = 1361;              // TSI W/m² (Kopp & Lean 2011, TSIS-1). 🔒 = L☉/(4π×AU²)
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
EARTH.T_NO_POLAR_ICE_K = CONST.KELVIN_TO_CELSIUS + 20;
EARTH.T_NO_POLAR_ICE_RANGE_K = 20;
/** Fraction max de glace polaire depuis la formule thermique (ice_temp_factor × ce coef, plafonné par highlands). */
EARTH.ICE_FORMULA_MAX_FRACTION = 0.46;
EARTH.T_ICE_TRANSITION_RANGE_K = 20;
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
// Facteur κ_H2O dans EDS (calculations.js). Valeur par défaut 0.92 ; recalculé depuis DATA quand disponible (formule P_ratio × CO2).
EARTH.H2O_EDS_SCALE = 0.92;
EARTH['🪩🍰'] = {
    '🪩🍰🌋': 0.05, '🪩🍰🌊': 0.08, '🪩🍰🌳': 0.12, '🪩🍰🏜️': 0.30,
    '🪩🍰🧊': 0.70, '🪩🍰⛅': 0.50, '🪩🍰🌍': 0.20
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

// File: API_BILAN/spectroscopy/hitran.js - Formules HITRAN (Q(T), S(T), γ(T,P), Voigt)
// Desc: En français, module de calcul LBL selon doc/HITRAN.txt (sections efficaces à partir des lignes).
// Version 1.1.1
// Date: 2025-02-06
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Initial: Q(T), S(T), γ_air/γ_self, γ_L total, γ_D, Voigt (réf. doc/HITRAN.txt).
// - v1.1: crossSectionCO2/H2O/CH4FromLines(λ,T,P), getLinesInRange, données window.HITRAN_LINES_*.
// - v1.2: getSpectralBinBoundsFromHITRAN(λ_min,λ_max,T,P) → { stepMax_m, nMin } pour bornes bins.
// - v1.1.1: partitionFunctionQ(T,molecule) approx par molécule (CO2/H2O/CH4), crossSectionFromLines passe molecule
// - v1.3: getSpectralRegionBoundsFromHITRAN(λ_min,λ_max) → { bounds_m, weights } pour grille adaptative (bornes = plages réelles des lignes).

(function (global) {
    'use strict';

    var CONST = global.CONST;
    if (!CONST) {
        console.error('[hitran.js] CONST non défini (charger physics.js avant hitran.js)');
    }

    // --- Constantes HITRAN (doc/HITRAN.txt) ---
    // Credence T_ref/P_ref: ~90%. Plage lit. T_ref 273–300 K (HITRAN 296 K standard) ; P_ref 0.5–2 atm.
    var HITRAN_C2_CMK = 1.4388;           // c₂ = hc/k ≈ 1.4388 cm·K
    var HITRAN_T_REF_K = 296;             // T_ref typique HITRAN (K). Plage lit. 273–300 K.
    var HITRAN_P_REF_ATM = 1;             // 1 atm. Plage lit. 0.5–2 atm.
    var PA_PER_ATM = 101325;
    var SQRT_LN2 = Math.sqrt(Math.LN2);
    var SQRT_PI = Math.sqrt(Math.PI);

    /**
     * Longueur d'onde λ (m) → nombre d'onde ν (cm⁻¹).
     * ν = 1/λ_cm avec λ_cm = λ_m × 100 ⇒ ν = 1/(λ_m × 100) = 0.01/λ_m.
     */
    function wavelengthToWavenumber(lambda_m) {
        return 0.01 / lambda_m;
    }

    /**
     * Nombre d'onde ν (cm⁻¹) → longueur d'onde λ (m).
     * λ_cm = 1/ν ⇒ λ_m = λ_cm/100 = 0.01/ν.
     */
    function wavenumberToWavelength(nu_cm) {
        return 0.01 / nu_cm;
    }

    /**
     * Pression P (Pa) → P (atm).
     */
    function pressurePaToAtm(P_Pa) {
        return P_Pa / PA_PER_ATM;
    }

    /**
     * Fonction de partition Q(T) (approximation compacte par molécule).
     * Suffisant pour 200–400 K et diagnostic ; évite le placeholder Q=1 constant.
     */
    function partitionFunctionQ(T_K, molecule) {
        var x = T_K / HITRAN_T_REF_K;
        if (molecule === 'CO2') return 286.09 * x;
        if (molecule === 'H2O') return 174.58 * Math.pow(x, 1.5);
        if (molecule === 'CH4') return 590.40 * Math.pow(x, 1.5);
        return 1;
    }

    /**
     * Intensité de ligne S(T) (cm⁻¹/(molécule·cm⁻²)) à partir de S(T_ref).
     * S(T) = S(T_ref) * (Q_ref/Q(T)) * exp(-c2*E''*(1/T - 1/T_ref)) * (1 - exp(-c2*ν/T)) / (1 - exp(-c2*ν/T_ref))
     * Réf. doc/HITRAN.txt.
     */
    function lineIntensityS(T_K, S_ref, Q_ref, Q_T, E_lower_cm, nu_ij_cm, T_ref_K) {
        var c2 = HITRAN_C2_CMK;
        var ratioQ = Q_ref / Q_T;
        var expBoltzmann = Math.exp(-c2 * E_lower_cm * (1 / T_K - 1 / T_ref_K));
        var expNuRef = Math.exp(-c2 * nu_ij_cm / T_ref_K);
        var expNuT = Math.exp(-c2 * nu_ij_cm / T_K);
        var ratioStimulated = (1 - expNuT) / (1 - expNuRef);
        return S_ref * ratioQ * expBoltzmann * ratioStimulated;
    }

    /**
     * Largeur Lorentz air : γ_air(T) = γ_air(T_ref) * (T_ref/T)^n_air. (cm⁻¹/atm)
     */
    function gammaLorentzAir(T_K, gamma_air_ref, n_air, T_ref_K) {
        return gamma_air_ref * Math.pow(T_ref_K / T_K, n_air);
    }

    /**
     * Largeur Lorentz self : γ_self(T) = γ_self(T_ref) * (T_ref/T)^n_self. (cm⁻¹/atm)
     */
    function gammaLorentzSelf(T_K, gamma_self_ref, n_self, T_ref_K) {
        return gamma_self_ref * Math.pow(T_ref_K / T_K, n_self);
    }

    /**
     * Largeur Lorentz totale : γ_L = P * [X_self*γ_self(T) + X_air*γ_air(T)].
     * P en atm, X_self + X_air = 1. Résultat en cm⁻¹.
     */
    function gammaLorentzTotal(P_atm, gamma_air_T, gamma_self_T, X_self, X_air) {
        return P_atm * (X_self * gamma_self_T + X_air * gamma_air_T);
    }

    /**
     * Largeur Doppler (HWHM) en cm⁻¹ : γ_D ≈ 3.58e-7 * ν * √(T/M).
     * ν en cm⁻¹, T en K, M en kg/mol. Réf. doc/HITRAN.txt.
     */
    function gammaDoppler(nu_cm, T_K, M_kg_mol) {
        return 3.58e-7 * nu_cm * Math.sqrt(T_K / M_kg_mol);
    }

    /**
     * Réel de la Faddeeva w(z), z = x + i*y. Approximation rationnelle (style Humlíček).
     * Utilisée pour Voigt normalisée : V(Δν) = Re(w(z)) / (γ_D * √π), z = (Δν + i*γ_L)/γ_D.
     */
    function faddeevaRe(x, y) {
        if (y < 1e-12) return Math.exp(-x * x);
        var s = Math.abs(x) + y;
        if (s > 15) return y / (x * x + y * y);
        var a = 1 / (4 * SQRT_PI);
        var b = [0.5, 1.5, 2.5, 3.5];
        var reW = 0;
        for (var i = 0; i < 4; i++) {
            var d = (b[i] - x) * (b[i] - x) + y * y;
            reW += a * (b[i] - x) / d;
        }
        return reW;
    }

    /**
     * Profil Voigt normalisé : ∫ f(Δν) dν = 1.
     * f(Δν) = Re(w(z)) / (γ_D * √π), z = (Δν + i*γ_L)/γ_D.
     * Δν, γ_L, γ_D en cm⁻¹. Retourne f en 1/cm⁻¹.
     */
    function voigtNormalized(delta_nu_cm, gamma_L_cm, gamma_D_cm) {
        if (gamma_D_cm < 1e-15 * gamma_L_cm) {
            return (gamma_L_cm / Math.PI) / (delta_nu_cm * delta_nu_cm + gamma_L_cm * gamma_L_cm);
        }
        if (gamma_L_cm < 1e-15 * gamma_D_cm) {
            var x = delta_nu_cm / gamma_D_cm;
            return Math.exp(-x * x) / (gamma_D_cm * SQRT_PI);
        }
        var x = delta_nu_cm / gamma_D_cm;
        var y = gamma_L_cm / gamma_D_cm;
        var reW = faddeevaRe(x, y);
        return reW / (gamma_D_cm * SQRT_PI);
    }

    /**
     * Contribution d'une ligne à la section efficace σ(ν) en cm²/molécule.
     * σ_line = S(T) * f(ν - ν_i) avec f = Voigt normalisée.
     * delta_nu = ν - ν_line (cm⁻¹), autres paramètres déjà scalés (S en cm⁻¹/(mol·cm⁻²), f en 1/cm⁻¹ → σ en cm²/mol).
     */
    function lineCrossSectionCm2(S_T, delta_nu_cm, gamma_L_cm, gamma_D_cm) {
        var f = voigtNormalized(delta_nu_cm, gamma_L_cm, gamma_D_cm);
        return S_T * f;
    }

    /**
     * Convertit σ en cm²/molécule → m²/molécule (pour cohérence avec calculations.js).
     */
    function sigmaCm2ToM2(sigma_cm2) {
        return sigma_cm2 * 1e-4;
    }

    // --- Sections efficaces à partir des lignes (données window.HITRAN_LINES_CO2 / H2O / CH4) ---
    var HALF_WINDOW_CM = 5;
    var _sortedCache = { CO2: null, H2O: null, CH4: null };

    function getSortedLines(key) {
        var cache = _sortedCache[key];
        if (cache) return cache;
        var raw = global["HITRAN_LINES_" + key];
        var arr = raw.slice(0);
        arr.sort(function (a, b) { return a.nu - b.nu; });
        _sortedCache[key] = arr;
        return arr;
    }

    function binarySearchGe(arr, nu_cm) {
        var lo = 0;
        var hi = arr.length;
        while (lo < hi) {
            var mid = (lo + hi) >>> 1;
            if (arr[mid].nu < nu_cm) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    function getLinesInRange(sorted, nu_cm, halfWindowCm) {
        var nuMin = nu_cm - halfWindowCm;
        var nuMax = nu_cm + halfWindowCm;
        var i0 = binarySearchGe(sorted, nuMin);
        var i1 = binarySearchGe(sorted, nuMax + 1e-9);
        var out = [];
        for (var i = i0; i < i1; i++) out.push(sorted[i]);
        return out;
    }

    /**
     * Section efficace σ(λ, T, P) en m²/molécule à partir des lignes (réf. doc/HITRAN.txt).
     * lines = tableau de lignes trié par nu. On parcourt [i0, i1[ sans allouer inRange pour limiter la mémoire.
     * X_self = fraction molaire du gaz (0 pour CO2/CH4 en air, >0 pour H2O humide). n_self non dans JSON → on utilise n_air.
     */
    function crossSectionFromLines(lines, lambda_m, T_K, P_Pa, M_kg_mol, X_self, molecule) {
        var nu_cm = wavelengthToWavenumber(lambda_m);
        var nuMin = nu_cm - HALF_WINDOW_CM;
        var nuMax = nu_cm + HALF_WINDOW_CM;
        var i0 = binarySearchGe(lines, nuMin);
        var i1 = binarySearchGe(lines, nuMax + 1e-9);
        var Q_ref = partitionFunctionQ(HITRAN_T_REF_K, molecule);
        var Q_T = partitionFunctionQ(T_K, molecule);
        var P_atm = pressurePaToAtm(P_Pa);
        var X_air = 1 - X_self;
        var sum_cm2 = 0;
        for (var k = i0; k < i1; k++) {
            var line = lines[k];
            var S_T = lineIntensityS(T_K, line.sw, Q_ref, Q_T, line.elower, line.nu, HITRAN_T_REF_K);
            var g_air_T = gammaLorentzAir(T_K, line.gamma_air, line.n_air, HITRAN_T_REF_K);
            var g_self_T = gammaLorentzSelf(T_K, line.gamma_self, line.n_air, HITRAN_T_REF_K);
            var gamma_L = gammaLorentzTotal(P_atm, g_air_T, g_self_T, X_self, X_air);
            var gamma_D = gammaDoppler(line.nu, T_K, M_kg_mol);
            var delta_nu = nu_cm - line.nu;
            sum_cm2 += lineCrossSectionCm2(S_T, delta_nu, gamma_L, gamma_D);
        }
        return sigmaCm2ToM2(sum_cm2);
    }

    function crossSectionCO2FromLines(lambda_m, T_K, P_Pa) {
        var lines = getSortedLines("CO2");
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CO2, 0, 'CO2');
    }

    function crossSectionH2OFromLines(lambda_m, T_K, P_Pa, X_self) {
        var lines = getSortedLines("H2O");
        var x = X_self;
        if (x === undefined) x = 0;
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_H2O, x, 'H2O');
    }

    function crossSectionCH4FromLines(lambda_m, T_K, P_Pa) {
        var lines = getSortedLines("CH4");
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CH4, 0, 'CH4');
    }

    /**
     * Bornes min/max de bins spectaux dérivées des largeurs de raie HITRAN (CO2, H2O, CH4).
     * Parcourt les lignes dans [lambda_min_m, lambda_max_m], estime la largeur (γ_L + γ_D) en cm⁻¹,
     * convertit en Δλ (m), garde le min → step_max_m. N_min = span / step_max_m.
     * T_K, P_Pa : référence pour γ (ex. 296 K, 1 atm). Retourne { stepMax_m, nMin } ou null si lignes indisponibles.
     */
    function getSpectralBinBoundsFromHITRAN(lambda_min_m, lambda_max_m, T_K, P_Pa) {
        if (!CONST || !global.HITRAN_LINES_CO2) return null;
        var nu_max_cm = wavelengthToWavenumber(lambda_min_m);
        var nu_min_cm = wavelengthToWavenumber(lambda_max_m);
        if (nu_min_cm >= nu_max_cm) return null;
        var P_atm = pressurePaToAtm(P_Pa);
        var step_min_m = Infinity;
        var gases = [
            { key: 'CO2', M: CONST.M_CO2, X_self: 0 },
            { key: 'H2O', M: CONST.M_H2O, X_self: 0.01 },
            { key: 'CH4', M: CONST.M_CH4, X_self: 0 }
        ];
        for (var g = 0; g < gases.length; g++) {
            var lines = getSortedLines(gases[g].key);
            if (!lines || lines.length === 0) continue;
            var X_air = 1 - gases[g].X_self;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.nu < nu_min_cm || line.nu > nu_max_cm) continue;
                var g_air_T = gammaLorentzAir(T_K, line.gamma_air, line.n_air, HITRAN_T_REF_K);
                var g_self_T = gammaLorentzSelf(T_K, line.gamma_self, line.n_air, HITRAN_T_REF_K);
                var gamma_L = gammaLorentzTotal(P_atm, g_air_T, g_self_T, gases[g].X_self, X_air);
                var gamma_D = gammaDoppler(line.nu, T_K, gases[g].M);
                var halfWidth_cm = gamma_L + gamma_D;
                var lambda_m = wavenumberToWavelength(line.nu);
                var delta_lambda_m = 100 * lambda_m * lambda_m * halfWidth_cm;
                if (delta_lambda_m > 0 && delta_lambda_m < step_min_m) step_min_m = delta_lambda_m;
            }
        }
        if (!isFinite(step_min_m) || step_min_m <= 0) return null;
        var span_m = lambda_max_m - lambda_min_m;
        var nMin = Math.max(2, Math.ceil(span_m / step_min_m));
        return { stepMax_m: step_min_m, nMin: nMin };
    }

    /**
     * Bornes de régions spectrales dérivées des plages réelles des lignes HITRAN (CO2, H2O, CH4).
     * Chaque gaz donne un intervalle [min λ, max λ] où il a des lignes ; on fusionne et trie pour obtenir
     * une liste de bornes. Les poids sont proportionnels au nombre de lignes dans chaque région (plus de lignes → résolution plus fine).
     * Retourne { bounds_m: number[], weights: number[] } ou null si lignes indisponibles.
     */
    function getSpectralRegionBoundsFromHITRAN(lambda_min_m, lambda_max_m) {
        if (!global.HITRAN_LINES_CO2) return null;
        var nu_max_cm = wavelengthToWavenumber(lambda_min_m);
        var nu_min_cm = wavelengthToWavenumber(lambda_max_m);
        if (nu_min_cm >= nu_max_cm) return null;
        var endpoints = [lambda_min_m, lambda_max_m];
        var gases = ['CO2', 'H2O', 'CH4'];
        for (var g = 0; g < gases.length; g++) {
            var lines = getSortedLines(gases[g]);
            if (!lines || lines.length === 0) continue;
            var nu_min = Infinity;
            var nu_max = -Infinity;
            for (var i = 0; i < lines.length; i++) {
                var nu = lines[i].nu;
                if (nu < nu_min_cm || nu > nu_max_cm) continue;
                if (nu < nu_min) nu_min = nu;
                if (nu > nu_max) nu_max = nu;
            }
            if (!isFinite(nu_min) || !isFinite(nu_max)) continue;
            var lam_min = wavenumberToWavelength(nu_max);
            var lam_max = wavenumberToWavelength(nu_min);
            endpoints.push(lam_min);
            endpoints.push(lam_max);
        }
        endpoints.sort(function (a, b) { return a - b; });
        var bounds_m = [endpoints[0]];
        for (var j = 1; j < endpoints.length; j++) {
            if (endpoints[j] - bounds_m[bounds_m.length - 1] > 1e-12) bounds_m.push(endpoints[j]);
        }
        if (bounds_m.length < 2) return null;
        var nRegions = bounds_m.length - 1;
        var weights = [];
        for (var r = 0; r < nRegions; r++) {
            var r_min = bounds_m[r];
            var r_max = bounds_m[r + 1];
            var nu_r_max = wavelengthToWavenumber(r_min);
            var nu_r_min = wavelengthToWavenumber(r_max);
            var count = 0;
            for (var g = 0; g < gases.length; g++) {
                var lines = getSortedLines(gases[g]);
                if (!lines) continue;
                for (var i = 0; i < lines.length; i++) {
                    var nu = lines[i].nu;
                    if (nu >= nu_r_min && nu <= nu_r_max) count++;
                }
            }
            weights.push(count > 0 ? count : 1);
        }
        var sumW = weights.reduce(function (s, w) { return s + w; }, 0);
        for (var r = 0; r < weights.length; r++) weights[r] = weights[r] / sumW;
        return { bounds_m: bounds_m, weights: weights };
    }

    // Export global (pas de optional chaining, pas de return dans garde)
    global.HITRAN = global.HITRAN || {};
    global.HITRAN.C2_CMK = HITRAN_C2_CMK;
    global.HITRAN.T_REF_K = HITRAN_T_REF_K;
    global.HITRAN.P_REF_ATM = HITRAN_P_REF_ATM;
    global.HITRAN.wavelengthToWavenumber = wavelengthToWavenumber;
    global.HITRAN.wavenumberToWavelength = wavenumberToWavelength;
    global.HITRAN.pressurePaToAtm = pressurePaToAtm;
    global.HITRAN.partitionFunctionQ = partitionFunctionQ;
    global.HITRAN.lineIntensityS = lineIntensityS;
    global.HITRAN.gammaLorentzAir = gammaLorentzAir;
    global.HITRAN.gammaLorentzSelf = gammaLorentzSelf;
    global.HITRAN.gammaLorentzTotal = gammaLorentzTotal;
    global.HITRAN.gammaDoppler = gammaDoppler;
    global.HITRAN.voigtNormalized = voigtNormalized;
    global.HITRAN.lineCrossSectionCm2 = lineCrossSectionCm2;
    global.HITRAN.sigmaCm2ToM2 = sigmaCm2ToM2;
    global.HITRAN.faddeevaRe = faddeevaRe;
    global.HITRAN.crossSectionFromLines = crossSectionFromLines;
    global.HITRAN.crossSectionCO2FromLines = crossSectionCO2FromLines;
    global.HITRAN.crossSectionH2OFromLines = crossSectionH2OFromLines;
    global.HITRAN.crossSectionCH4FromLines = crossSectionCH4FromLines;
    global.HITRAN.getSpectralBinBoundsFromHITRAN = getSpectralBinBoundsFromHITRAN;
    global.HITRAN.getSpectralRegionBoundsFromHITRAN = getSpectralRegionBoundsFromHITRAN;

})(typeof window !== 'undefined' ? window : this);
// ============================================================================
// File: API_BILAN/physics/climate.js - Forçages radiatifs (convention affichage) et climatologie
// Desc: ΔF = diagnostic conventionnel (terrestre / contemporain), pas utilisé pour le calcul de T. EDS/OLR = physique (calculations.js).
// Version 1.0.1
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

// Convention ΔF CO₂ (Myhre 1998, IPCC) — affichage uniquement, pas de calcul T.
// ΔF = α×ln(C/C₀) : diagnostic relatif à une référence, concept terrestre/contemporain.
const CONVENTION_CO2_FORCING_COEFF = 5.35;  // W/m². Plage lit. 4.0–6.5.
const CONVENTION_CO2_REF_PPM = 280;         // ppm pré-ind. (C₀). Convention IPCC.

// Constantes climatiques = window.CONST (physics.js) : STEFAN_BOLTZMANN, SOLAR_CONSTANT, TEMP_HABITABLE_*
// Température de référence sans effet de serre (T_eff)
// ⚠️ NE PAS HARDCODER 255K ! Cela dépend de l'albedo et de l'intensité solaire
// Sera calculé dynamiquement via la fonction getEffectiveTemperatureNoGreenhouse()
// const TEMP_REF_NO_CO2 = 255.0; // DEPRECATED

// Fonction pour obtenir la température effective sans effet de serre
// T_eff = (S * (1 - A) / 4σ)^(1/4)
function getEffectiveTemperatureNoGreenhouse() {
    if (typeof window === 'undefined') return 255.0;

    const CONST = window.CONST;
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const solar_constant = CONST.SOLAR_CONSTANT;

    // Récupérer l'albedo de base de l'époque courante
    let albedo_ref = 0.3; 
    if (window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Ajuster la constante solaire si définie
            if (typeof currentEpoch.solar_intensity === 'number') {
                // solar_intensity est un facteur (ex: 0.7 pour 70%)
                // Mais attention, SOLAR_CONSTANT est la valeur actuelle
                // Il faut vérifier si solar_constant est déjà ajusté ou si on doit le faire ici
                // Dans main.js, FluxManager met à jour SOLAR_CONSTANT. Supposons qu'il est à jour.
            }
            
            if (typeof currentEpoch.albedo_base === 'number') {
                albedo_ref = currentEpoch.albedo_base;
            }
        }
    }

    const flux_absorbed = (solar_constant / 4) * (1 - albedo_ref);
    const T_eff = Math.pow(flux_absorbed / STEFAN_BOLTZMANN, 0.25);
    
    return T_eff;
}

// ΔF CO₂ (convention affichage) : ΔF = α×ln(C/C₀). Pas utilisé pour T finale.
function calculateCO2Forcing(CO2_fraction) {
    if (CO2_fraction <= 0) return 0;
    const CO2_ref = CONVENTION_CO2_REF_PPM * 1e-6;
    return CONVENTION_CO2_FORCING_COEFF * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref);
}

// Fonction pour calculer le diagnostic ΔF CH4 (méthane, convention affichage)
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La formule ΔF = 0.036 * (√M - √M₀) est la formule standard pour le CH4 (Myhre et al. 1998)
// - Cette formule est acceptée par l'IPCC et utilisée dans tous les modèles climatiques
// - Le coefficient 0.036 W/m²/(ppb)¹/² est une valeur mesurée et validée expérimentalement
// - La référence pré-industrielle de 700 ppb (0.7 ppm) est une valeur paléoclimatique bien établie
// - Bande d'absorption principale : ~7.7 μm, avec un pic important à ~23 μm (1300 cm⁻¹)
// - Note : Le CH4 a un pouvoir de réchauffement global (PRG) ~25-30x supérieur au CO2 sur 100 ans
function calculateCH4Forcing(CH4_fraction) {
    const CH4_ref = 0.7e-6; // Référence pré-industrielle (0.7 ppm = 700 ppb) - ✅ scientifiquement accepté
    if (CH4_fraction <= 0) return 0;
    // Formule : ΔF = 0.036 * (√M - √M₀) où M est la concentration en ppb
    // Convertir ppm en ppb : 1 ppm = 1000 ppb
    const CH4_ppb = CH4_fraction * 1e6; // ppm → ppb
    const CH4_ref_ppb = CH4_ref * 1e6; // ppm → ppb
    return 0.036 * (Math.sqrt(Math.max(CH4_ppb, CH4_ref_ppb)) - Math.sqrt(CH4_ref_ppb)); // W/m²
}

// Fonction pour calculer le diagnostic ΔF H2O (vapeur d'eau, convention affichage)
// 
// ⚠️ IMPORTANT : DISTINCTION ENTRE VAPEUR D'EAU ET NUAGES ⚠️
// 
// L'effet de serre de H2O comprend DEUX composantes distinctes :
// 1. VAPEUR D'EAU (gaz dans l'atmosphère) :
//    - Représentée par le ratio de mélange r_H2O(z) = r0 * exp(-z/H_H2O)
//    - Au niveau de la mer : r0 ≈ 0.015 (1.5% de l'air en vapeur d'eau)
//    - C'est la présence d'eau sous forme gazeuse dans l'atmosphère (%)
//    - Cette vapeur absorbe le rayonnement IR (effet de serre)
//    - Calculée dans calculations.js via waterVaporMixingRatio() et waterVaporNumberDensity()
// 
// 2. NUAGES (gouttelettes d'eau condensée) :
//    - Représentée par cloud_coverage (0 à 1, 0% à 100% de couverture)
//    - Effet complexe : réchauffement (IR) + refroidissement (albedo)
//    - Calculée dans calculations.js via calculateCloudCoverage()
//    - Les nuages se forment quand la vapeur d'eau se condense
// 
// ⚠️ APPROXIMATION SIMPLIFIÉE POUR MODÉLISATION :
// - Le forçage H2O réel est complexe et dépend de nombreux facteurs (humidité, altitude, température)
// - En réalité, la vapeur d'eau contribue ~20-30 W/m² à l'effet de serre terrestre
// - Les nuages ont un effet net complexe qui dépend du type (cirrus vs stratus) et de l'altitude
// - Cette fonction est simplifiée pour le gameplay et évite l'emballement thermique
// 
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La vapeur d'eau est le principal gaz à effet de serre (contribution ~60% de l'effet de serre total)
// - Les nuages ont un effet net complexe qui dépend du type (cirrus vs stratus) et de l'altitude
// - La rétroaction vapeur d'eau-température est une rétroaction positive bien documentée
// 
// @param {boolean} h2o_enabled - Si true, la vapeur d'eau est activée (présence d'eau dans l'atmosphère)
// @param {number} cloud_coverage - Couverture nuageuse (0 à 1, 0% à 100%)
// @returns {number} Diagnostic ΔF total H2O (W/m², convention affichage) = vapeur + nuages
function calculateH2OForcing(h2o_enabled, cloud_coverage) {
    if (!h2o_enabled) return 0;
    // Forçage de base de la vapeur d'eau (présence d'eau gazeuse dans l'atmosphère)
    // Cette valeur représente l'effet de serre de la vapeur d'eau (~1.5% au niveau de la mer)
    const base_forcing = 15; // W/m² - réduit pour éviter l'emballement
    
    // Contribution supplémentaire des nuages (gouttelettes condensées)
    // Les nuages ajoutent un terme ΔF supplémentaire (effet IR > effet albedo dans ce modèle simplifié)
    const cloud_forcing_max = 5; // Contribution maximale des nuages (W/m²)
    const cloud_forcing = Math.min(cloud_forcing_max, cloud_coverage * cloud_forcing_max);
    
    // Forçage total = vapeur d'eau (gaz) + nuages (condensé)
    return base_forcing + cloud_forcing; // W/m²
}

// Fonction pour calculer le diagnostic ΔF de l'albedo (convention affichage)
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - Le forçage albedo est : ΔF_albedo = -S/4 * ΔA où S est la constante solaire et ΔA est le changement d'albedo
// - Référence : albedo de référence de l'époque courante (albedo_base)
// - Si albedo augmente, le forçage est négatif (refroidissement)
// - Si albedo diminue, le forçage est positif (réchauffement)
// 🔒 CORRECTION : Utiliser l'albedo_base de l'époque comme référence, pas toujours 0.3
function calculateAlbedoForcing(albedo) {
    if (albedo === null || albedo === undefined) return 0;
    
    // Récupérer l'albedo de référence de l'époque courante (albedo_base)
    let albedo_ref = 0.3; // Valeur par défaut (terrestre moyenne)
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch && typeof currentEpoch.albedo_base === 'number') {
            albedo_ref = currentEpoch.albedo_base;
        }
    }
    
    // Si albedo = albedo_ref, alors forçage = 0 (pas de changement)
    // Pour Corps noir : albedo_base = 0, donc si albedo = 0, forçage = 0
    if (Math.abs(albedo - albedo_ref) < 1e-6) {
        return 0;
    }
    
    const CONST = window.CONST;
    const SOLAR_FLUX_AVERAGE = CONST.SOLAR_CONSTANT / 4; // 341.5 W/m²

    // ΔF_albedo = -S/4 * (A - A_ref)
    // Négatif car une augmentation d'albedo réduit le flux absorbé (refroidissement)
    const delta_albedo = albedo - albedo_ref;
    const forcing = -SOLAR_FLUX_AVERAGE * delta_albedo;
    
    return forcing; // W/m²
}

// Exposer uniquement les appels (fonctions) ; pas de variables MAJUSCULE sur window (règle : CONST/DATA)
if (typeof window !== 'undefined') {
    window.getEffectiveTemperatureNoGreenhouse = getEffectiveTemperatureNoGreenhouse;
    window.calculateCO2Forcing = calculateCO2Forcing;
    window.calculateCH4Forcing = calculateCH4Forcing;
    window.calculateH2OForcing = calculateH2OForcing;
    window.calculateAlbedoForcing = calculateAlbedoForcing;
}

// File: API_BILAN/radiative/calculations.js - Calculs de transfert radiatif
// Desc: Module de calculs radiatifs
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// - v1.1.9: plafond couches (maxLayersConvergence 800) + sous-échantillonnage stockage (max 400×600 en DATA) pour limiter RAM
// - v1.2.0: format 3-flottants-par-λ (flux_init, ychange, flux_final) — supprime 4 matrices nZ×nL (×800 moins RAM) ; reconstruction 100 lignes dans getSpectralResultFromDATA
// Logs: v1.0.2 - kappa_H2O × H2O_VAPOR_EDS_SCALE (évite masquage CO2, doc/API/VAPEUR_VS_NUAGES.md)
// Logs: v1.0.3 - Attribution EDS Schmidt 2010 : transfert overlap/2 de H2O vers CO2 à chaque (couche,λ), total 100%
// Logs: v1.0.4 - Nuages EDS : τ_cloud (corps gris) ∝ 🍰🪩⛅ (albédo), réparti troposphère ; eds_breakdown.Clouds
// Logs: v1.0.5 - CLOUD_LW_TAU_REF = 1 (lit. Stephens 1978, Chylek 1982 : τ overcast ~ 0.5–2 ; ref=1 → τ=coverage)
// Logs: v1.0.6 - Attribution EDS : part par τ, overlap H2O–CO2 partagé réaliste (Schmidt), doc + commentaires
// Logs: v1.0.7 - Stratosphère delta_z_real = z_range[i]-z_range[i-1] ; commentaires pas spectral HITRAN, pas / n_layers
// Logs: v1.0.8 - τ nuages LW : ☁️ (CloudFormationIndex) + CLOUD_LW_TAU_REF (10→1.5, évite runaway H₂O)
// Logs: v1.0.9 - Attribution EDS nuages en contribution marginale (gaz + nuages découplés) pour éviter l'écrasement par τ_H2O dominant
// Logs: v1.0.10 - Attribution EDS par absorption propre de composant (1-exp(-τ_i)) avec normalisation globale ; nuages non écrasés par τ_tot
// Logs: v1.0.11 - Diagnostic aliasing CO2 bande 15µm (13–17µm) : table sigma/kappa + ratio modèle/théorie
// Logs: v1.0.12 - Grille spectrale λ adaptative (zones CO2/CH4/H2O densifiées) + lambda_weights non-uniformes
// Logs: v1.1.7 - displayDichotomyStep émet plot:drawn(iteration) après draw spectral pour bridge IO_LISTENER
// - v1.1.8: max bins spectral = déf en pixels axe X (PLOT_AXIS_X_PX), fallback CONFIG/2000 ; même seuil pour showSpectralBackground
// Logs: v1.0.13 - retrait gardes défensives CONFIG_COMPUTE sur les derniers ajouts (règle crash)
// Logs: v1.0.14 - Grille λ : retour aux bornes d'origine (calculs spectraux inchangés)
// Logs: v1.0.15 - CONFIG_COMPUTE.spectralGridHomogeneous : si true, poids ∝ largeur (répartition homogène)
// Logs: v1.0.16 - getSpectralResultFromDATA : effective_temperature depuis total_flux (évite crash createPlanckTrace)
// Logs: v1.1.1 - calculateFluxForT0 async + dispatch workers Transferable (N-1 workers, fallback série) ; fix: retrait auto-resume FPS organigramme.js
// Logs: v1.1.2 - anim mode: baseTemp = DATA['🧮']['🧮🌡️'] (source unique, pas plotData.temp_surface) ; retrait guards abusifs lines 1060-1067
// Logs: v1.1.3 - precisionFactor = 1 fixe (getPrecisionFactorFromFPS retiré FPS.js v1.2.0)
// Logs: v1.1.4 - displayDichotomyStep: retrait setTimeout(100) sur updateSpectralVisualization (évite flush tardif des draws inter)
// Logs: v1.1.5 - displayDichotomyStep pousse _cycleToken pour bridge draw ack (attente API en mode visu_+anim)
// - v1.1.6: supprime IO_LISTENER.emit('compute:progress') dans displayDichotomyStep — appel direct uniquement


function temperatureAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const z_trop = window.calculateTropopauseHeight();
    const Gamma = EPOCH.lapse_rate ? EPOCH.lapse_rate : -(EPOCH['🍎'] / CONST.CP_AIR);
    const T_trop = DATA['🧮']['🧮🌡️'] + Gamma * z_trop;

    if (z < z_trop) {
        return DATA['🧮']['🧮🌡️'] + Gamma * z;
    } else {
        return T_trop;
    }
}


function crossSectionCO2(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionCO2FromLines(wavelength, T_ref, P_ref);
}

function waterVaporMixingRatio(z, r0_override = null) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const r0 = r0_override !== null ? r0_override : DATA['💧']['🍰🫧💧'];
    const H_H2O = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (CONST.M_H2O * EPOCH['🍎']);

    return r0 * Math.exp(-z / H_H2O);
}

function crossSectionH2O(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionH2OFromLines(wavelength, T_ref, P_ref);
}

function waterVaporFractionAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    if (!DATA['🔘']['🔘💧📛']) return 0;

    // 🔒 Ne pas appeler calculateWaterPartition ici : appelé une fois par le caller (calculateH2OParameters avant calculateFluxForT0)
    const H_H2O = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (CONST.M_H2O * EPOCH['🍎']);
    return DATA['💧']['🍰🫧💧'] * Math.exp(-z / H_H2O);
}

// ============================================================================
// MÉTHANE (CH4)
// ============================================================================

// Section efficace CH4 à partir des lignes HITRAN (hitran.js + hitran_lines_CH4.js)
function crossSectionCH4(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionCH4FromLines(wavelength, T_ref, P_ref);
}

function methaneFractionAtZ(z) {
    const DATA = window.DATA;
    if (!DATA['🔘']['🔘🐄📛']) return 0;
    if (!DATA['🫧']['🍰🫧🐄']) return 0;
    return DATA['🫧']['🍰🫧🐄'];
}

function evaporationRate() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    return EARTH.EVAPORATION_E0 * Math.exp((DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE);
}


// Transfert radiatif : physique uniquement (pas de calcul relatif type forçage radiatif).
// Flux entrants/sortants absolus : π B_λ(T), τ = κ×Δz (HITRAN), transmission = exp(-τ), Kirchhoff.
// Convergence = équilibre flux_entrant (solaire absorbé + géothermique) vs flux_sortant (OLR).
// Les "forcing" (calculateCO2Forcing, etc.) sont calculés ailleurs pour affichage uniquement (climate.js).
async function calculateFluxForT0() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    // 🔒 Partition eau déjà mise à jour par le caller (calculateH2OParameters avant chaque calculateFluxForT0 dans la boucle radiatif)
    DATA['📊'] = {};
    
    // Credence ~70%. Plage lit. 20–100 m (LBL 20–50 m, GCM ~100 m). 30 m (après fix delta_z_real → épaisseur réelle par couche).
    const delta_z = 30;
    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    const delta_lambda = 0.1e-6;
    const z_max = DATA['🫧']['📏🫧🧿'] * 1000; // km → m
    
    // Précision fixe (getPrecisionFactorFromFPS retiré en FPS.js v1.2.0, remplacé par courbe Mémoire)
    const precisionFactor = 1;

    // Ajuster delta_z et delta_lambda (toujours à la valeur de base, pas de réduction)
    // Note : delta_z sous tropopause reste constant (pas d'optimisation)
    //const final_delta_lambda = delta_lambda; // Toujours utiliser delta_lambda de base (précision maximale)

    // ⚡ OPTIMISATION : Créer les grilles avec précision adaptative
    // Pour lambda : regrouper en plages de moyennes pour accélérer
    // Pour z : précision fine sous tropopause, grossière au-dessus
    
    
    // Calculer la tropopause pour déterminer les zones de précision (hauteur d'échelle H = R*T/(M*g))
    const z_trop_raw = window.calculateTropopauseHeight();
    const limit_std_atmosphere_z = 120000;
    const z_trop_precalc = Math.min(z_trop_raw, Math.min(z_max, limit_std_atmosphere_z));

    // Créer la grille lambda avec regroupement adaptatif (sauf si fullSpectre)
    const lambda_range = [];
    const lambda_weights = []; // Poids pour les moyennes pondérées

    // 💧 Résolution spectrale : plafond = CONFIG_COMPUTE.maxSpectralBinsConvergence (défaut 2000)
    // Credence ~70%. Plage lit. bins λ : 100–1000+ (LBL 200–500 typique). 150 = bas de plage ; augmenter si EDS insuffisant.
    const lambda_span = lambda_max - lambda_min;

    {
        const maxAllowedBins = (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence) || 2000;
        let expected_points = Math.max(2, Math.min(DATA['🧮']['🔬🌈'], 10000));
        const nMinHITRAN = window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN != null && Number.isFinite(window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN) ? window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN : 0;
        if (nMinHITRAN > 0) expected_points = Math.max(expected_points, Math.min(nMinHITRAN, 10000));
        expected_points = Math.max(24, Math.min(expected_points, maxAllowedBins)); // plafond = CONFIG

        function buildAdaptiveLambdaGrid(totalBins) {
            // Grille d'origine (bornes fixes) : utilisée pour les calculs spectraux ; HITRAN sert aux sections efficaces, pas aux bornes ici.
            const regions = [
                [0.1e-6, 4.0e-6, 0.05],
                [4.0e-6, 4.6e-6, 0.10],
                [4.6e-6, 7.0e-6, 0.05],
                [7.0e-6, 8.0e-6, 0.10],
                [8.0e-6, 12.0e-6, 0.08],
                [12.0e-6, 17.0e-6, 0.25],
                [17.0e-6, 25.0e-6, 0.15],
                [25.0e-6, 100.0e-6, 0.22]
            ];
            // Répartition homogène par défaut (poids = largeur en λ) → même Δλ/bin, bandes visuellement uniformes. Désactiver avec CONFIG spectralGridHomogeneous = false pour forcer plus de bins en IR thermique.
            const forceNonHomogeneous = (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.spectralGridHomogeneous === false);
            if (!forceNonHomogeneous) {
                for (let i = 0; i < regions.length; i++) {
                    regions[i][2] = regions[i][1] - regions[i][0];
                }
            }
            const filtered = regions.map(r => [Math.max(lambda_min, r[0]), Math.min(lambda_max, r[1]), r[2]]).filter(r => r[1] > r[0]);
            if (filtered.length === 0) return [];
            const weightSum = filtered.reduce((s, r) => s + r[2], 0);
            const normalized = filtered.map(r => [r[0], r[1], r[2] / weightSum]);
            // On construit des bins "bruts" avec points partagés aux jonctions.
            // Après suppression du premier point de chaque région (sauf la 1re),
            // on doit retomber exactement à totalBins.
            const overlap = normalized.length - 1;
            const rawTarget = totalBins + overlap;
            const bins = normalized.map(r => Math.max(3, Math.round(rawTarget * r[2])));
            let allocated = bins.reduce((s, n) => s + n, 0);
            while (allocated < rawTarget) {
                let idx = 0;
                let best = -1;
                for (let i = 0; i < normalized.length; i++) {
                    const score = normalized[i][2] / bins[i];
                    if (score > best) {
                        best = score;
                        idx = i;
                    }
                }
                bins[idx]++;
                allocated++;
            }
            while (allocated > rawTarget) {
                let idx = -1;
                let best = -1;
                for (let i = 0; i < normalized.length; i++) {
                    if (bins[i] <= 3) continue;
                    const score = bins[i] / normalized[i][2];
                    if (score > best) {
                        best = score;
                        idx = i;
                    }
                }
                if (idx < 0) break;
                bins[idx]--;
                allocated--;
            }
            const lambda = [];
            for (let i = 0; i < normalized.length; i++) {
                const lmin = normalized[i][0];
                const lmax = normalized[i][1];
                const nBins = bins[i];
                const step = (lmax - lmin) / (nBins - 1);
                for (let j = 0; j < nBins; j++) {
                    const lam = (j === nBins - 1) ? lmax : (lmin + j * step);
                    if (i > 0 && j === 0) continue; // point de jonction déjà pris par la région précédente
                    lambda.push(lam);
                }
            }
            if (lambda.length !== totalBins) {
                console.error('[buildAdaptiveLambdaGrid] ❌ longueur invalide: ' + lambda.length + ' attendu=' + totalBins);
                throw new Error('buildAdaptiveLambdaGrid longueur invalide');
            }
            if (Math.abs(lambda[lambda.length - 1] - lambda_max) > 1e-12) {
                lambda[lambda.length - 1] = lambda_max;
            }
            return lambda;
        }

        const adaptive_lambda = buildAdaptiveLambdaGrid(expected_points);
        for (let i = 0; i < adaptive_lambda.length; i++) lambda_range.push(adaptive_lambda[i]);
        const base_delta = lambda_range.length > 1 ? (lambda_range[lambda_range.length - 1] - lambda_range[0]) / (lambda_range.length - 1) : lambda_span;
        for (let i = 0; i < lambda_range.length; i++) {
            let local_delta;
            if (lambda_range.length === 1) {
                local_delta = lambda_span;
            } else if (i === 0) {
                local_delta = lambda_range[1] - lambda_range[0];
            } else if (i === lambda_range.length - 1) {
                local_delta = lambda_range[i] - lambda_range[i - 1];
            } else {
                local_delta = (lambda_range[i + 1] - lambda_range[i - 1]) * 0.5;
            }
            lambda_weights.push(local_delta / base_delta);
        }
    }

    // Largeur de bin réelle pour l'intégration : Σ π B_λ Δλ doit utiliser le pas de la grille, pas delta_lambda fixe
    // Sinon avec 50 bins (pas ~2 µm) on multipliait par 0.1 µm → flux total ~20× trop faible (visible/IR mal compté)
    // Idéal LBL : pas spectral piloté par HITRAN (largeur de raie γ_L, γ_D par raie) ; ici grille fixe N bins (🔬🌈).
    // Choix d'évolution : dériver pas max ou N min depuis HITRAN (🔬🌈 gardé mais idéalement rempli par HITRAN). HITRAN : précision par raie,
    // pas identique pour les 3 gaz (CO2, H2O, CH4 ont chacun leurs γ_L, γ_D). Nuages EDS : corps gris, pas de λ (τ uniforme) ; leur effet SW (albédo) est dans calculateAlbedo (🍰🪩⛅ × 🪩🍰⛅).
    const effective_delta_lambda = lambda_range.length > 1 ? (lambda_range[lambda_range.length - 1] - lambda_range[0]) / (lambda_range.length - 1) : lambda_span;

    // Créer la grille z à partir des hauteurs calculées (📏🫧🧿, tropopause). Si tout à 0 → z_max=1e-6, tropo=0 → une couche en une passe.
    const z_range = [];
    const delta_z_troposphere = delta_z;
    const raw_stratosphere = (delta_z * 5) / precisionFactor;
    const delta_z_stratosphere = Math.max(100, raw_stratosphere);
    const delta_z_exosphere = (z_max > 120000) ? 5000 : delta_z_stratosphere;

    if (z_trop_precalc > 0) {
        for (let z = 0; z < z_trop_precalc; z += delta_z_troposphere) {
            z_range.push(z);
        }
        // S'assurer que la tropopause est incluse
        if (z_range.length === 0 || z_range[z_range.length - 1] < z_trop_precalc) {
            z_range.push(z_trop_precalc);
        }
    } else {
        // Tropopause à z=0 ou négative : commencer par z=0
        z_range.push(0);
    }

    const limit_std_atmosphere = 120000;
    let current_z_max_loop = Math.min(z_max, limit_std_atmosphere);
    for (let z = z_trop_precalc + delta_z_stratosphere; z < current_z_max_loop; z += delta_z_stratosphere) {
        z_range.push(z);
    }

    // Si atmosphère massive, continuer au-delà de 120km avec un pas plus grand
    if (z_max > limit_std_atmosphere) {
        // S'assurer d'inclure la limite 120km
        if (z_range[z_range.length - 1] < limit_std_atmosphere) {
            z_range.push(limit_std_atmosphere);
        }

        for (let z = limit_std_atmosphere + delta_z_exosphere; z < z_max; z += delta_z_exosphere) {
            z_range.push(z);
        }
    }

    // S'assurer que z_max est inclus
    if (z_range.length === 0) {
        z_range.push(0);
    } else if (z_range[z_range.length - 1] < z_max) {
        z_range.push(z_max);
    }

    // Plafond couches pour limiter la RAM (4 matrices × nZ × nL peuvent dépasser 1–4 Go)
    const maxLayersConvergence = (window.CONFIG_COMPUTE && typeof window.CONFIG_COMPUTE.maxLayersConvergence === 'number')
        ? Math.max(100, window.CONFIG_COMPUTE.maxLayersConvergence) : 800;
    if (z_range.length > maxLayersConvergence) {
        const step = (z_range.length - 1) / (maxLayersConvergence - 1);
        const thinned = [];
        for (let k = 0; k < maxLayersConvergence; k++) {
            const idx = (k === maxLayersConvergence - 1) ? z_range.length - 1 : Math.min(Math.floor(k * step), z_range.length - 1);
            thinned.push(z_range[idx]);
        }
        z_range.length = 0;
        z_range.push(...thinned);
    }

    // ⚠️ IMPORTANT : S'assurer que lambda_range est complètement construit avant de créer upward_flux
    // Vérifier la cohérence des longueurs
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : Longueurs incompatibles - lambda_range: ${lambda_range.length}, lambda_weights: ${lambda_weights.length}`);
        throw new Error(`Longueurs incompatibles : lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }

    // (flux_init, ychange, YCHANGE_THR initialisés après earth_flux — voir ci-dessous)
    const final_lambda_length = lambda_range.length;
    let sum_blocked_CO2 = 0, sum_blocked_H2O = 0, sum_blocked_CH4 = 0, sum_blocked_clouds = 0;

    // Log du calcul spectral (désactivé pour réduire la taille des logs)
    // console.log(`📊 [calculateFluxForT0@calculations.js] Calcul spectral:`);
    // console.log(`   Nombre de couches atmosphériques: ${num_couches}`);
    // console.log(`   Nombre de plages spectrales: ${num_plages_spectre}`);
    // console.log(`   Produit (cases calculées): ${total_cases}`);

    // Condition limite : flux émis par la surface
    // ⚡ OPTIMISATION : Tenir compte des poids lambda pour les plages regroupées
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE avant earth_flux: lambda_range.length (${lambda_range.length}) != lambda_weights.length (${lambda_weights.length})`);
        throw new Error(`Longueurs incompatibles avant earth_flux: lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }
    const T_surf_flux = DATA['🧮']['🧮🌡️'];
    const earth_flux = lambda_range.map((lambda, idx) => {
        if (lambda_weights[idx] === undefined) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: lambda_weights[${idx}] manquant pour lambda_range[${idx}] = ${lambda}`);
            throw new Error(`lambda_weights[${idx}] requis`);
        }
        const B = PHYS.planckFunction(lambda, T_surf_flux);
        return Math.PI * B * effective_delta_lambda * lambda_weights[idx];
    });

    // Format 3-flottants-par-λ : flux_init = copie de earth_flux (défini juste au-dessus)
    // ychange = altitude de coupure par λ (init = z_max = pas de coupure observée)
    const flux_init = earth_flux.slice();
    const ychange = new Float64Array(final_lambda_length).fill(z_range[z_range.length - 1]);
    const YCHANGE_THR = 0.05; // 5 % de baisse = début absorption significative

    const lambda_9um = 9e-6; // 9 microns en mètres
    const flux_below_9um = earth_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um).reduce((sum, f) => sum + f, 0);
    const flux_total = earth_flux.reduce((sum, f) => sum + f, 0);

    // ⚡ OPTIMISATION : Calculer tropopause une seule fois
    const z_trop = window.calculateTropopauseHeight();
    const Gamma = -0.0065; // Gradient de température, K/m

    const T_trop = DATA['🧮']['🧮🌡️'] + Gamma * z_trop;

    // Trouver l'index de la tropopause dans z_range
    let i_trop = z_range.length; // Par défaut, pas de tropopause (tout avant)
    for (let i = 0; i < z_range.length; i++) {
        if (z_range[i] >= z_trop) {
            i_trop = i;
            break;
        }
    }

    // Nuages EDS : ☁️ × τ_ref. τ_LW ∝ CCN (🍰💭) : plus de noyaux → gouttelettes plus petites → τ plus grand.
    // Calibré : 🍰💭=1.0 → τ_ref=2.6 ; 🍰💭=0.4 → τ_ref=1.04.
    // Réf. : Stephens 1978 (τ overcast 0.5–2) ; Chylek & Ramaswamy 1982 (idem) ; Liou 1986 (stratus 5–20, cirrus 0.1–2) ; Loeb et al. 2018 CERES (CRE_LW ~27 W/m²).
    const cloud_index = (DATA['🪩'] != null && DATA['🪩']['☁️'] != null && Number.isFinite(DATA['🪩']['☁️'])) ? DATA['🪩']['☁️'] : 0;
    const ccn = (DATA['🫧'] != null && DATA['🫧']['🍰💭'] != null && Number.isFinite(DATA['🫧']['🍰💭'])) ? DATA['🫧']['🍰💭'] : 1;
    const CLOUD_LW_TAU_REF = 2.6 * ccn;
    const tau_cloud_total = Math.max(0, cloud_index * CLOUD_LW_TAU_REF);
    const tau_cloud_per_layer = i_trop > 0 ? tau_cloud_total / i_trop : 0;

    // ⚡ OPTIMISATION : Précalculer B_λ(T_trop) pour toutes les λ (après tropopause)
    const planck_trop = lambda_range.map(lambda =>
                PHYS.planckFunction(lambda, T_trop)
    );

    // ⚡ OPTIMISATION : Précalculer les sections efficaces (dépendent uniquement de λ)
    const cross_section_CO2 = lambda_range.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = lambda_range.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = lambda_range.map(lambda => crossSectionCH4(lambda));

    // DIAGNOSTIC CO2 (temporaire) : vérifier l'échantillonnage de la bande 15 µm.
    // Activé seulement en mode diagnostic pour éviter un bruit excessif en exécution normale.
    if (window.CONFIG_COMPUTE.logEdsDiagnostic) {
        const diag_co2 = [];
        const n_co2_surface = window.airNumberDensityAtZ(0) * DATA['🫧']['🍰🫧🏭'];
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            if (lambda >= 13e-6 && lambda <= 17e-6) {
                const sigma = cross_section_CO2[j];
                const kappa = sigma * n_co2_surface;
                diag_co2.push({
                    lambda_um: (lambda * 1e6).toFixed(3),
                    sigma: sigma.toExponential(3),
                    n_CO2: n_co2_surface.toExponential(3),
                    kappa: kappa.toExponential(3)
                });
            }
        }
        console.table(diag_co2);
        const sigma_co2_max_theorique = 1e-22; // m², ordre de grandeur pic 15 µm
        const kappa_co2_theorique = sigma_co2_max_theorique * n_co2_surface;
        let sigma_co2_max_modele = 0;
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            if (lambda >= 13e-6 && lambda <= 17e-6 && cross_section_CO2[j] > sigma_co2_max_modele) {
                sigma_co2_max_modele = cross_section_CO2[j];
            }
        }
        const kappa_co2_modele = sigma_co2_max_modele * n_co2_surface;
        const ratio_modele_theorie = kappa_co2_theorique > 0 ? (kappa_co2_modele / kappa_co2_theorique) : 0;
        console.log('[DIAG CO2] kappa_max modèle @15µm : ' + kappa_co2_modele.toExponential(3) + ' m⁻¹');
        console.log('[DIAG CO2] kappa_max théorique @15µm : ' + kappa_co2_theorique.toExponential(3) + ' m⁻¹');
        console.log('[DIAG CO2] ratio modèle/théorie : ' + ratio_modele_theorie.toFixed(3));
        console.log('[DIAG CO2] bins dans bande 13-17µm : ' + diag_co2.length + ' (sur ' + lambda_range.length + ' total)');
    }

    // H2O_EDS_SCALE : modulation physique (P, CO2) — cible 0.92 en 2025, plafonné à 1.0. TODO quand validé : formules + doc/API.
    const M_ATM_REF_KG = 5.148e18;
    const P_ratio = DATA['⚖️']['⚖️🫧'] / M_ATM_REF_KG;
    const CO2_factor = Math.max(0.7, 1.0 - (DATA['🫧']['🍰🫧🏭'] * 2.0));
    EARTH.H2O_EDS_SCALE = Math.min(1.0, 0.92 * Math.sqrt(Math.max(0, P_ratio)) * CO2_factor);
    console.log('[H2O_EDS_SCALE][calculateFluxForT0] P_ratio=' + P_ratio.toFixed(4) + ' CO2_factor=' + CO2_factor.toFixed(4) + ' H2O_EDS_SCALE=' + EARTH.H2O_EDS_SCALE.toFixed(4));

    const h2o_eds_scale = EARTH.H2O_EDS_SCALE;

    // h2o_enabled et ch4_enabled sont déjà lus depuis DATA au début de la fonction

    // Log supprimé (non essentiel)

    // Vérifier que earth_flux a la bonne longueur
    if (earth_flux.length !== lambda_range.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: earth_flux.length (${earth_flux.length}) != lambda_range.length (${lambda_range.length})`);
        throw new Error(`Longueurs incompatibles: earth_flux (${earth_flux.length}) != lambda_range (${lambda_range.length})`);
    }
    let flux_in = [...earth_flux];

    // 🔒 Caps numériques : tau≥0 (évite transmission=∞, em_flux=-∞) ; flux/bande borné (évite sum→∞)
    const TAU_EFF_MIN = 0;
    const TAU_EFF_MAX = 700;   // exp(-700) ≈ 0
    const MAX_FLUX_PER_BAND = 1e15;

    // 🔒 LOG : Vérifier les densités numériques à z=0 (première couche)
    const z_log = 0;
        const n_air_log = window.airNumberDensityAtZ(z_log);
    // Logs désactivés pour réduire la taille

    // ⚡ OPTIMISATION : Boucle avant tropopause (T varie avec z)
    const usePressureBroadening = window.CONFIG_COMPUTE.pressureBroadening;
    const P_REF = CONV.STANDARD_ATMOSPHERE_PA;

    // ── Dispatch parallèle (Transferable, N-1 workers) ─────────────────────────────────
    if (window.spectralWorkerPool && window.spectralWorkerPool.ready) {
        console.log('⚙️ [workers] dispatch ' + lambda_range.length + ' bins × ' + z_range.length + ' layers → ' + window.spectralWorkerPool.nWorkers + ' workers');
        const nL = lambda_range.length;
        const nZ = z_range.length;
        const layers_w = [];
        for (let li = 0; li < nZ; li++) {
            const lz = z_range[li];
            const lT = (li < i_trop) ? (DATA['🧮']['🧮🌡️'] + Gamma * lz) : T_trop;
            const ln_air = window.airNumberDensityAtZ(lz);
            const ln_CO2 = ln_air * DATA['🫧']['🍰🫧🏭'];
            const ln_H2O = ln_air * waterVaporFractionAtZ(lz);
            const ln_CH4 = ln_air * methaneFractionAtZ(lz);
            const lP_z = usePressureBroadening && window.pressureAtZ ? window.pressureAtZ(lz) : P_REF;
            const lpb = usePressureBroadening ? Math.min(2.0, Math.sqrt(Math.max(1, lP_z) / P_REF)) : 1.0;
            const ldz = (li + 1 < nZ) ? (z_range[li + 1] - z_range[li]) : delta_z_troposphere;
            layers_w.push({ T: lT, n_air: ln_air, n_CO2: ln_CO2, n_H2O: ln_H2O, n_CH4: ln_CH4, pressureBroadening: lpb, delta_z_real: ldz });
        }
        const { resultBuf, sums } = await window.spectralWorkerPool.dispatch({
            lambda_range, lambda_weights,
            cross_section_CO2, cross_section_H2O, cross_section_CH4,
            earth_flux, layers: layers_w, i_trop, h2o_eds_scale,
            tau_cloud_per_layer, effective_delta_lambda,
            T_surf: DATA['🧮']['🧮🌡️'],
            constants: { PLANCK_H: CONST.PLANCK_H, SPEED_OF_LIGHT: CONST.SPEED_OF_LIGHT, BOLTZMANN_KB: CONST.BOLTZMANN_KB, MAX_PLANCK_SAFE: CONST.MAX_PLANCK_SAFE }
        }, nZ, nL);
        sum_blocked_CO2 = sums.CO2; sum_blocked_H2O = sums.H2O;
        sum_blocked_CH4 = sums.CH4; sum_blocked_clouds = sums.clouds;
        // Extraire flux_final (dernière ligne de resultBuf) + calculer Ychange — O(nZ × nL), pas de copie 2D
        let OLR_w = 0;
        for (let j = 0; j < nL; j++) {
            const f = resultBuf[(nZ - 1) * nL + j];
            flux_in[j] = f;
            OLR_w += f;
        }
        const z_last_w = z_range[nZ - 1];
        for (let j = 0; j < nL; j++) {
            for (let i = 0; i < nZ; i++) {
                if (resultBuf[i * nL + j] < flux_init[j] * (1 - YCHANGE_THR)) {
                    ychange[j] = z_range[i];
                    break;
                }
            }
        }
        console.log('⚙️ [workers] done OLR=' + OLR_w.toFixed(2) + ' W/m²');
        // resultBuf non référencé après ici → GC peut collecter le Transferable
    } else {
    // ── Voie série (fallback) ────────────────────────────────────────────────────────
    for (let i = 0; i < i_trop; i++) {
        const z = z_range[i];
        const T = DATA['🧮']['🧮🌡️'] + Gamma * z; // Calcul direct, sans appel à temperature()
        // ⚡ OPTIMISATION : Calculer les densités numériques une seule fois par altitude (pas dans la boucle lambda)
        const n_air = window.airNumberDensityAtZ(z);
        const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
        const n_H2O = n_air * waterVaporFractionAtZ(z);
        const n_CH4 = n_air * methaneFractionAtZ(z);
        // Pressure broadening : σ_eff = σ × √(P/P_ref). Lorentz broadening, cap 2.0.
        const P_z = usePressureBroadening && window.pressureAtZ ? window.pressureAtZ(z) : P_REF;
        const pressureBroadening = usePressureBroadening ? Math.min(2.0, Math.sqrt(Math.max(1, P_z) / P_REF)) : 1.0;

        // Épaisseur réelle de la couche i → τ cohérent quel que soit delta_z (convergence quand précision augmente).
        const delta_z_real = (i + 1 < z_range.length) ? (z_range[i + 1] - z_range[i]) : delta_z_troposphere;

        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE troposphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles troposphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }

        const z_last = z_range[z_range.length - 1];
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            const sigma_broad = pressureBroadening;
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * sigma_broad * n_CO2 : 0;
            const kappa_H2O_raw = isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * sigma_broad * n_H2O : 0;
            const kappa_H2O = kappa_H2O_raw * h2o_eds_scale;
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * sigma_broad * n_CH4 : 0;
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;
            const tau_cloud_layer = tau_cloud_per_layer;
            const tau_raw = kappa * delta_z_real + tau_cloud_layer;
            const tau_eff = (Number.isFinite(tau_raw) && tau_raw >= 0) ? Math.min(tau_raw, TAU_EFF_MAX) : 0;

            const has_absorption = (DATA['🫧']['🍰🫧🏭'] > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10) || (tau_cloud_layer > 1e-10);
            let out_clamped;
            if (!has_absorption) {
                out_clamped = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, flux_in[j]));
            } else {
                const tau = Math.max(TAU_EFF_MIN, tau_eff);
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission;
                const em_flux = emissivity * Math.PI * PHYS.planckFunction(lambda, T) * effective_delta_lambda * lambda_weights[j];
                let out = flux_in[j] * transmission + em_flux;
                if (!Number.isFinite(out)) out = flux_in[j];
                out_clamped = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, out));
                const tau_CO2 = Math.max(0, kappa_CO2 * delta_z_real);
                const tau_H2O = Math.max(0, kappa_H2O * delta_z_real);
                const tau_CH4 = Math.max(0, kappa_CH4 * delta_z_real);
                sum_blocked_CO2 += flux_in[j] * (1 - Math.exp(-tau_CO2));
                sum_blocked_H2O += flux_in[j] * (1 - Math.exp(-tau_H2O));
                sum_blocked_CH4 += flux_in[j] * (1 - Math.exp(-tau_CH4));
                sum_blocked_clouds += flux_in[j] * (1 - Math.exp(-tau_cloud_layer));
            }
            flux_in[j] = out_clamped;
            // Tracking Ychange : première couche où le flux descend de > YCHANGE_THR vs surface
            if (ychange[j] >= z_last && out_clamped < flux_init[j] * (1 - YCHANGE_THR)) {
                ychange[j] = z_range[i];
            }
        }
    }

    // ⚡ OPTIMISATION : Boucle après tropopause (T constante = T_trop, B_λ précalculé)
    for (let i = i_trop; i < z_range.length; i++) {
        const z = z_range[i];
        // ⚡ OPTIMISATION : Calculer les densités numériques une seule fois par altitude (pas dans la boucle lambda)
        const n_air = window.airNumberDensityAtZ(z);
        const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
        const n_H2O = n_air * waterVaporFractionAtZ(z);
        const n_CH4 = n_air * methaneFractionAtZ(z);
        const P_z_s = usePressureBroadening && window.pressureAtZ ? window.pressureAtZ(z) : P_REF;
        const pressureBroadening_s = usePressureBroadening ? Math.min(2.0, Math.sqrt(Math.max(1, P_z_s) / P_REF)) : 1.0;

        // Épaisseur réelle de la couche i (z_range[i-1] → z_range[i]) : cohérent avec troposphère, pas de pas fixe stratosphère.
        const delta_z_real = i > 0 ? (z_range[i] - z_range[i - 1]) : delta_z_stratosphere;

        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE stratosphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles stratosphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }

        const z_last_s = z_range[z_range.length - 1];
        for (let j = 0; j < lambda_range.length; j++) {
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * pressureBroadening_s * n_CO2 : 0;
            const kappa_H2O = (isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * pressureBroadening_s * n_H2O : 0) * h2o_eds_scale;
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * pressureBroadening_s * n_CH4 : 0;
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;
            const tau_eff_s = (Number.isFinite(kappa * delta_z_real) && kappa * delta_z_real >= 0) ? Math.min(kappa * delta_z_real, TAU_EFF_MAX) : 0;
            const has_absorption = (DATA['🫧']['🍰🫧🏭'] > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10);
            let out_clamped_s;
            if (!has_absorption) {
                out_clamped_s = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, flux_in[j]));
            } else {
                const tau = Math.max(TAU_EFF_MIN, tau_eff_s);
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission;
                const em_flux = emissivity * Math.PI * planck_trop[j] * effective_delta_lambda * lambda_weights[j];
                let out_s = flux_in[j] * transmission + em_flux;
                if (!Number.isFinite(out_s)) out_s = flux_in[j];
                out_clamped_s = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, out_s));
                sum_blocked_CO2 += flux_in[j] * (1 - Math.exp(-Math.max(0, kappa_CO2 * delta_z_real)));
                sum_blocked_H2O += flux_in[j] * (1 - Math.exp(-Math.max(0, kappa_H2O * delta_z_real)));
                sum_blocked_CH4 += flux_in[j] * (1 - Math.exp(-Math.max(0, kappa_CH4 * delta_z_real)));
            }
            flux_in[j] = out_clamped_s;
            if (ychange[j] >= z_last_s && out_clamped_s < flux_init[j] * (1 - YCHANGE_THR)) {
                ychange[j] = z_range[i];
            }
        }
    }
    } // fin else (voie série)

    // Log supprimé (non essentiel)

    // flux_in contient le flux au sommet après propagation complète (OLR)
    if (!flux_in || flux_in.length === 0) throw new Error('[calculateFluxForT0] flux_in vide ou invalide après boucle');
    const total_flux = flux_in.reduce((sum, val) => sum + val, 0);
    const earth_flux_total = earth_flux.reduce((sum, val) => sum + val, 0);
    const EDS = earth_flux_total - total_flux;
    const sum_blocked = sum_blocked_CO2 + sum_blocked_H2O + sum_blocked_CH4 + sum_blocked_clouds;
    // pct ∈ [0, 1] : répartition relative des contributions bloquées (gaz + nuages marginaux).
    const pct = (v) => (sum_blocked > 1e-20 && Number.isFinite(v)) ? v / sum_blocked : 0;
    const eds_breakdown = {
        EDS_Wm2: EDS,
        CO2: { pct: pct(sum_blocked_CO2) },
        H2O: { pct: pct(sum_blocked_H2O) },
        CH4: { pct: pct(sum_blocked_CH4) },
        Clouds: { pct: pct(sum_blocked_clouds) }
    };

    // Log du delta (flux sortant - flux entrant initial)
    const delta_spectral = total_flux - earth_flux_total;
    // Log désactivé pour réduire la taille des logs
    // console.log(`📊 [calculateFluxForT0@calculations.js] Résultat calcul spectral:`);
    // console.log(`   Flux entrant initial (surface): ${earth_flux_total.toFixed(2)} W/m²`);
    // console.log(`   Flux sortant final (sommet atm): ${total_flux.toFixed(2)} W/m²`);
    // console.log(`   Delta (sortant - entrant): ${delta_spectral.toFixed(2)} W/m²`);

    // flux < 9μm au sommet (diagnostic, flux_in = OLR par λ)
    const lambda_9um_top = 9e-6;
    const top_flux_below_9um = flux_in.reduce((s, f, idx) => s + (lambda_range[idx] < lambda_9um_top ? f : 0), 0);
    const top_flux_total = total_flux;

    // 🔒 Stocker les résultats dans DATA (crash si DATA['📊'] n'existe pas)
    if (!DATA['📊']) throw new Error('[calculateFluxForT0] DATA[📊] requis avant écriture');
    if (window.HITRAN && window.HITRAN.getSpectralBinBoundsFromHITRAN) {
        const bounds = window.HITRAN.getSpectralBinBoundsFromHITRAN(lambda_min, lambda_max, window.HITRAN.T_REF_K || 296, CONV.STANDARD_ATMOSPHERE_PA);
        if (bounds) DATA['📊'].hitranBinBounds = bounds;
    }
    DATA['📊'].total_flux = total_flux;
    DATA['📊'].eds_breakdown = eds_breakdown;
    DATA['📊'].delta_z = delta_z;

    // Stockage compressé : 3 × nL flottants (flux_init, ychange, flux_final) au lieu de 4 × nZ × nL.
    // getSpectralResultFromDATA reconstruit upward_flux à la volée (100 lignes) pour plot.js.
    DATA['📊'].lambda_range = lambda_range;
    DATA['📊'].lambda_weights = lambda_weights;
    DATA['📊'].z_range = z_range;
    DATA['📊'].flux_init = flux_init;                  // 1D nL : intensité surface
    DATA['📊'].flux_final = flux_in.slice();            // 1D nL : intensité sommet (OLR par λ)
    DATA['📊'].ychange = Array.from(ychange);           // 1D nL : altitude coupure (m) par λ
    DATA['📊'].earth_flux = flux_init;                  // alias pour plot.js

    DATA['🧮']['🔬🌈'] = lambda_range.length;
    DATA['🧮']['🔬🫧'] = z_range.length;

    if (window.CONFIG_COMPUTE.logEdsDiagnostic) {
        // Log EDS désactivé (trop fréquent, une ligne par itération)
    }

    return true; // Succès
}

// Reconstruction de upward_flux à la volée depuis le format compressé (flux_init, ychange, flux_final).
// Produit DISPLAY_ROWS lignes pour plot.js sans stocker la matrice pleine en DATA.
// Profil par λ : intensityInit → (transition au Ychange) → intensityFinal (step function lissée linéairement).
// O(DISPLAY_ROWS × nL) = ~100 × 2000 = rapide ; backward-compatible avec plot.js (upward_flux[i][j] toujours valide).
function getSpectralResultFromDATA() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const total_flux = DATA['📊'].total_flux;
    const effective_temperature = (total_flux > 0 && CONST.STEFAN_BOLTZMANN) ? Math.pow(total_flux / CONST.STEFAN_BOLTZMANN, 0.25) : null;
    const { lambda_range, lambda_weights, z_range, flux_init, flux_final, ychange, earth_flux } = DATA['📊'];
    if (!lambda_range || !flux_init || !flux_final || !ychange) {
        // Données compressées pas encore disponibles (premier appel avant tout calcul)
        return { total_flux, effective_temperature, lambda_range: null, lambda_weights: null, z_range: null, upward_flux: null, optical_thickness: null, emitted_flux: null, absorbed_flux: null, earth_flux: null };
    }
    const nL = lambda_range.length;
    const z_max = z_range[z_range.length - 1];

    // Reconstruction : 100 lignes (z=0 → z=z_max), transition linéaire au Ychange par λ
    const DISPLAY_ROWS = 100;
    const upward_flux = new Array(DISPLAY_ROWS);
    const z_range_display = new Array(DISPLAY_ROWS);
    for (let di = 0; di < DISPLAY_ROWS; di++) {
        const z_rev = (di / Math.max(1, DISPLAY_ROWS - 1)) * z_max; // z=0 (surface) … z=z_max (sommet)
        z_range_display[di] = z_rev;
        const row = new Array(nL);
        for (let j = 0; j < nL; j++) {
            if (z_rev <= ychange[j]) {
                row[j] = flux_init[j]; // en dessous de la coupure : transparent, flux surface
            } else {
                const t = (z_rev - ychange[j]) / Math.max(1, z_max - ychange[j]);
                row[j] = flux_init[j] + t * (flux_final[j] - flux_init[j]); // interpolation linéaire vers OLR
            }
        }
        upward_flux[di] = row;
    }

    return {
        total_flux,
        effective_temperature,
        lambda_range,
        lambda_weights,
        z_range: z_range_display,
        upward_flux,          // 100 × nL reconstruit — backward-compatible plot.js
        optical_thickness: null,
        emitted_flux: null,
        absorbed_flux: null,
        earth_flux: flux_init
    };
}

window.getSpectralResultFromDATA = getSpectralResultFromDATA;

// ============================================================================
// FONCTION : CALCULER LES CAPACITÉS RADIATIVE IR (🍰🫧❀🌈)
// ============================================================================
// Calcule les capacités radiative IR normalisées pour H2O, CO2, CH4
// depuis les données spectrales stockées dans DATA['📊']
//
// FORMULE :
// 🍰🫧❀🌈 = ⟨ 1 - e^{-τ_❀(λ)} ⟩_{IR}
//          = ∫_{λ∈IR} ∫_{z=0}^{z_max} (1 - e^{-τ_❀(λ,z)}) · w(λ) dz dλ
//            ─────────────────────────────────────────────────────────────
//            ∫_{λ∈IR} w(λ) dλ
//
// où :
//   τ_❀(λ,z) = ∫_{z'=0}^{z} κ_❀(λ,z') dz' (épaisseur optique intégrée)
//   κ_❀(λ,z) = σ_❀(λ) × n_❀(z) (coefficient d'absorption)
//   w(λ) = poids radiatif (Planck à T_surface)
//
// Résultat normalisé ∈ [0,1], valable à toutes les époques
function calculateRadiativeCapacities() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    // 🔒 Initialiser toutes les capacités radiatives à 0
    DATA['🫧']['🍰🫧🏭🌈'] = 0;
    DATA['🫧']['🍰🫧💧🌈'] = 0;
    DATA['🫧']['🍰🫧🐄🌈'] = 0;
    DATA['🫧']['🍰🫧📿🌈'] = 0;
    
    // 🔒 CRASH si données manquantes (pas de fallback) - utiliser DATA directement
    // 🔒 FILTRER sur l'IR uniquement (λ > 0.7 μm = 0.7e-6 m)
    // L'IR commence à ~0.7-1 μm, on prend 0.7 μm comme limite
    const lambda_IR_min = 0.7e-6; // 0.7 μm en mètres
    const lambda_IR_indices = [];
    for (let j = 0; j < DATA['📊'].lambda_range.length; j++) {
        if (DATA['📊'].lambda_range[j] >= lambda_IR_min) {
            lambda_IR_indices.push(j);
        }
    }
    
    // Calculer le poids radiatif (Planck à T_surface) pour chaque longueur d'onde IR
    const lambda_weights_IR = lambda_IR_indices.map(idx => {
        return planckFunction(DATA['📊'].lambda_range[idx], DATA['🧮']['🧮🌡️']);
    });
    
    // Intégrale du poids radiatif sur IR (pour normalisation)
    const delta_lambda = DATA['📊'].lambda_range.length > 1 ? (DATA['📊'].lambda_range[DATA['📊'].lambda_range.length - 1] - DATA['📊'].lambda_range[0]) / (DATA['📊'].lambda_range.length - 1) : 1e-6;
    const weight_integral = lambda_weights_IR.reduce((sum, w) => sum + w, 0) * delta_lambda;
    
    // Précalculer les sections efficaces pour toutes les longueurs d'onde (calcul répétitif → garder const)
    const cross_section_CO2 = DATA['📊'].lambda_range.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = DATA['📊'].lambda_range.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = DATA['📊'].lambda_range.map(lambda => crossSectionCH4(lambda));
    const h2o_eds_scale_cap = EARTH.H2O_EDS_SCALE;
    
    // Initialiser les intégrales pondérées
    let integral_H2O = 0;
    let integral_CO2 = 0;
    let integral_CH4 = 0;
    
    // Calculer la densité numérique de l'air à chaque altitude
    const Gamma = -0.0065; // Gradient de température, K/m
    const airNumberDensity = (z) => {
        const T = DATA['🧮']['🧮🌡️'] + Gamma * z;
        const P = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA * Math.exp(-z / (CONST.R_GAS * T / (EPOCH['🍎'] * CONV.molar_mass_air_ref)));
        return P / (CONST.BOLTZMANN_KB * T);
    };
    
    // Pour chaque longueur d'onde IR uniquement
    for (let idx = 0; idx < lambda_IR_indices.length; idx++) {
        const j = lambda_IR_indices[idx];
        const w_lambda = lambda_weights_IR[idx];
        
        // Initialiser les épaisseurs optiques intégrées pour cette longueur d'onde
        let tau_H2O_lambda = 0;
        let tau_CO2_lambda = 0;
        let tau_CH4_lambda = 0;
        
        // Intégrer sur toutes les couches pour cette longueur d'onde
        for (let i = 0; i < DATA['📊'].z_range.length - 1; i++) {
            const z = DATA['📊'].z_range[i];
            const delta_z = DATA['📊'].z_range[i + 1] - DATA['📊'].z_range[i];
            
            // Densités numériques à cette altitude
            const n_air = window.airNumberDensityAtZ(z);
            const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
            const n_H2O = n_air * waterVaporFractionAtZ(z);
            const n_CH4 = n_air * methaneFractionAtZ(z);
            
            // Coefficients d'absorption pour cette longueur d'onde et cette altitude
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * n_CO2 : 0;
            const kappa_H2O_raw_cap = isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * n_H2O : 0;
            const kappa_H2O = kappa_H2O_raw_cap * h2o_eds_scale_cap;
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * n_CH4 : 0;

            // Épaisseur optique pour cette couche
            const delta_tau_CO2 = kappa_CO2 * delta_z;
            const delta_tau_H2O = kappa_H2O * delta_z;
            const delta_tau_CH4 = kappa_CH4 * delta_z;
            
            // Accumuler les épaisseurs optiques intégrées
            tau_CO2_lambda += delta_tau_CO2;
            tau_H2O_lambda += delta_tau_H2O;
            tau_CH4_lambda += delta_tau_CH4;
        }
        
        // Calculer (1 - exp(-tau)) pour chaque gaz
        const transmittance_CO2 = 1 - Math.exp(-tau_CO2_lambda);
        const transmittance_H2O = 1 - Math.exp(-tau_H2O_lambda);
        const transmittance_CH4 = 1 - Math.exp(-tau_CH4_lambda);
        
        // Accumuler les intégrales pondérées
        integral_CO2 += transmittance_CO2 * w_lambda * delta_lambda;
        integral_H2O += transmittance_H2O * w_lambda * delta_lambda;
        integral_CH4 += transmittance_CH4 * w_lambda * delta_lambda;
    }
    
    // Normaliser par l'intégrale du poids radiatif
    // 🔒 Si weight_integral = 0 (corps noir, pas d'IR), les capacités restent à 0
    if (weight_integral > 0) {
        DATA['🫧']['🍰🫧🏭🌈'] = Math.max(0, Math.min(1, integral_CO2 / weight_integral));
        DATA['🫧']['🍰🫧💧🌈'] = Math.max(0, Math.min(1, integral_H2O / weight_integral));
        DATA['🫧']['🍰🫧🐄🌈'] = Math.max(0, Math.min(1, integral_CH4 / weight_integral));
        DATA['🫧']['🍰🫧📿🌈'] = DATA['🫧']['🍰🫧🏭🌈'] + DATA['🫧']['🍰🫧💧🌈'] + DATA['🫧']['🍰🫧🐄🌈'];
    }
    // Sinon, les valeurs restent à 0 (déjà initialisées)
    
    return true;
}

window.calculateRadiativeCapacities = calculateRadiativeCapacities;

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false, options = {}) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // Récupérer H2O et CH4 pour le log
    // 🔒 CORRECTION : Utiliser DATA['💧']['🍰🫧💧'] comme source unique de vérité
    const h2o_total = DATA['💧']['🍰🫧💧'] * 100; // Fraction → %
    const ch4_ppm = (options && options.CH4_fraction != null) ? options.CH4_fraction * 1e6 : (DATA['🫧']['🍰🫧🐄'] != null ? DATA['🫧']['🍰🫧🐄'] * 1e6 : 0);
    
    // Log supprimé : affichage uniquement du mode (dichotomie/exponentielle) dans la boucle principale
    // if (iteration === 0 || isInitial) {
    //     console.log(`📛 [displayDichotomyStep@calculations.js] iter=${iteration} T0=${T0_test.toFixed(2)}K 🏭=${(CO2_fraction * 1e6).toFixed(0)}ppm 💧=${h2o_total.toFixed(1)}% 🐄=${ch4_ppm.toFixed(0)}ppm`);
    // }
    if (typeof window === 'undefined') return;

    // Créer un objet plotData temporaire pour l'affichage
    // ✅ SCIENTIFIQUEMENT CERTAIN : Loi de Stefan-Boltzmann T = (F/σ)^(1/4)
    // - Cette loi décrit la température effective d'un corps noir en équilibre radiatif
    // - Dérivée de la loi de Planck, elle est exacte pour un corps noir
    // - La constante σ = 5.67×10⁻⁸ W/(m²·K⁴) est une constante fondamentale
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;

    // ⚠️ DIFFÉRENCE ENTRE effective_temperature ET temp_surface :
    // - effective_temperature (temp_eff) = (flux_total / σ)^0.25
    //   → Température du corps noir équivalent qui émettrait le même flux total vers l'espace
    //   → Le flux émis vers l'espace vient de différentes altitudes (plus froid en altitude)
    // - temp_surface (T0_test) = Température réelle au sol calculée par dichotomie
    //   → Équilibre le bilan énergétique : flux solaire absorbé = flux terrestre émis
    //   → Dans une atmosphère avec effet de serre, la surface est plus chaude que la température effective
    //   → C'est l'effet de serre : la surface est plus chaude que ce que le flux émis vers l'espace suggère
    //   → La différence (temp_surface - effective_temperature) mesure l'intensité de l'effet de serre
    // 
    const h2o_enabled = DATA['🔘']['🔘💧📛'];
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH['🧲🌕'];
    const ch4_enabled = DATA['🔘']['🔘🐄📛'];
    const CH4_fraction = DATA['🫧']['🍰🫧🐄'];

    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → Le flux émis par la surface passe directement vers l'espace sans absorption
    //   → On utilise temp_surface directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const temp_eff = isBlackBody
        ? T0_test  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - CONST.KELVIN_TO_CELSIUS;
    const temp_eff_0 = 255.0; // Température effective sans CO2 (référence 255K)
    const albedo = result.albedo;
    const cloud_coverage = result.cloud_coverage;

    // Convention affichage uniquement (pas utilisé dans le calcul radiatif) : ΔF CO2/H2O/albedo pour labels.
    const forcing_CO2 = window.calculateCO2Forcing(CO2_fraction);
    const forcing_H2O = window.calculateH2OForcing(h2o_enabled, cloud_coverage);
    const forcing_Albedo = (albedo !== null) ? window.calculateAlbedoForcing(albedo) : 0;

    // Forçage total (affichage)
    const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;

    // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
    // ΔT° = T° actuelle - T° référence (255K)
    // C'est la différence directe de température, plus claire et compréhensible
    const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
    const delta_temp = T0_test - TEMP_REF_NO_CO2;

    // Zone habitable (affichage uniquement)
    const TEMP_HABITABLE_OPTIMAL = 288; // 15°C
    const TEMP_HABITABLE_MIN = 253;    // ~ -20°C
    const TEMP_HABITABLE_MAX = 323;    // ~ 50°C
    const delta_temp_habitable = T0_test - TEMP_HABITABLE_OPTIMAL;
    const life_viable = T0_test >= TEMP_HABITABLE_MIN && T0_test <= TEMP_HABITABLE_MAX;

    // Mettre à jour les informations à chaque étape
    window.updateDisplay({
            state: window.currentState, // Plantera si n'existe pas
            co2_ppm: CO2_fraction * 1e6,
            temp_surface: T0_test,
            temp_surface_c: temp_surface_c,
            temp_eff: temp_eff,
            temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
            delta_temp: delta_temp,
            delta_temp_habitable: delta_temp_habitable,
            life_viable: life_viable,
            forcing: forcing_total,
            forcing_CO2: forcing_CO2,
            forcing_H2O: forcing_H2O,
            forcing_Albedo: forcing_Albedo,
            albedo: albedo,
            cloud_coverage: cloud_coverage
        });

    // Mettre à jour les labels du flux pendant le calcul : écrire albedo/cloud dans DATA pour que updateFluxLabels (cycleCalcul) mette à jour le DOM (albedo_percent, etc.)
    DATA['📊'] = DATA['📊'] || {};
    DATA['📊'].total_flux = result.total_flux;
    if (DATA['🪩']) {
        if (albedo != null) DATA['🪩']['🍰🪩📿'] = albedo;
        if (cloud_coverage != null) DATA['🪩']['☁️'] = cloud_coverage;
    }
    if (window.IO_LISTENER) window.IO_LISTENER.emit('cycleCalcul');
    const fpsOk = (typeof window.fps === 'number' && window.fps >= (window.FPSalert || 25));
    if (fpsOk && typeof window.updateFluxLabels === 'function') {
        window.updateFluxLabels('cycleCalcul');
    }

    // 🔒 Mettre à jour la couleur avec la température actuelle (à chaque étape de dichotomie)
    const color_current = window.tempSurfaceToColor(temp_surface_c);
    window.updateBlackBodyColor(color_current);
    const legendEquilibre = document.querySelector('.legend-equilibre');
    if (legendEquilibre) legendEquilibre.style.color = color_current;

    const tempPlotData = {
        lambda_range: result.lambda_range,
        lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour normalisation correcte du flux
        z_range: result.z_range,
        current: {
            upward_flux: result.upward_flux,
            effective_temperature: temp_eff,
            emitted_flux: result.emitted_flux,
            absorbed_flux: result.absorbed_flux,
            earth_flux: result.earth_flux,
            lambda_range: result.lambda_range, // Nécessaire pour updateSpectralVisualization
            lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour updateSpectralVisualization
            z_range: result.z_range, // Nécessaire pour updateSpectralVisualization
            _cycleToken: iteration,
            albedo: albedo,
            cloud_coverage: cloud_coverage
        },
        co2_ppm: CO2_fraction * 1e6,
        temp_surface: T0_test, // Température de surface réelle (K) pour cohérence avec affichage
        temp_surface_c: temp_surface_c // Température de surface en °C pour mise à jour de la couleur en temps réel
    };

    // Courbe à chaque cycle (toujours mettre à jour)
    window.updatePlot(tempPlotData);
    if (typeof window.updateLegend === 'function') {
        window.updateLegend(tempPlotData);
    }

    // Visualisation spectrale à chaque cycle: appel direct (pas d'event bus, pas de file setTimeout)
    const canvas = document.getElementById('spectral-visualization');
    if (canvas) {
        canvas.style.setProperty('display', 'block', 'important');
        canvas.style.setProperty('visibility', 'visible', 'important');
        canvas.style.setProperty('opacity', '1', 'important');
        canvas.style.setProperty('z-index', '0', 'important');
        canvas.style.setProperty('position', 'absolute', 'important');
    }
    /*
     * ================================================================
     * ACK OBLIGATOIRE du bridge plot
     * ================================================================
     * displayDichotomyStep() est le point où l'UI a effectivement :
     * - mis à jour les courbes
     * - lancé le draw spectral du cycle courant
     *
     * Le calcul amont (calculations_flux.js) attend explicitement
     * IO_LISTENER.emit('plot:drawn', { iteration }) avec la même iteration.
     *
     * NE PAS supprimer cet emit.
     * NE PAS le déplacer avant updateSpectralVisualization().
     * Sinon le calcul repart trop tôt et les flux intermédiaires
     * se recompactent à la fin au lieu d'apparaître cycle par cycle.
     * ================================================================
     */
    if (tempPlotData.current) window.updateSpectralVisualization(tempPlotData.current);
    window.IO_LISTENER.emit('plot:drawn', { iteration: iteration });

    // Mettre à jour le statut
    if (typeof document !== 'undefined') {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            if (isInitial) {
                statusEl.textContent = `[Dichotomie] Étape initiale: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            } else {
                statusEl.textContent = `[Dichotomie] Itération ${iteration}: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            }
        }
    }
}

// Fonction helper pour récupérer l'état du bouton "anim"
// Retourne un seul boolean depuis la variable globale unique (seule référence)
// Fonction supprimée : utiliser directement window.enabledStates[window.ENABLED_STATES.ANIMATION.key]

async function simulateRadiativeTransfer() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    const CO2_fraction = DATA['🫧']['🍰🫧🏭'];
    const CH4_fraction = DATA['🫧']['🍰🫧🐄'];
    
    const t0_config = EPOCH['🌡️🧮'];
    const animEnabled = DATA['🔘']['🔘🎞'];
    // En mode anim : partir de la T0 actuelle du modèle (DATA = source unique, pas plotData)
    // En mode normal : partir de la T0 de référence de l'époque
    const baseTemp = animEnabled ? DATA['🧮']['🧮🌡️'] : t0_config;
    
    // (📿☄️ retiré — l'eau s'accumule directement dans 🔺⚖️💧, 📿💫 gère le temps)
    const ticTime = DATA['📜']['📿💫'];
    const deltaTicTime_per_tic = DATA['📜']['🔺🌡️💫'];
    
    const adjustment = deltaTicTime_per_tic * ticTime;
    const T0_initial = baseTemp + adjustment;

    if (T0_initial <= 0) {
        throw new Error(`T0_initial invalide: ${T0_initial}`);
    }
    
    const CO2_ppm = CO2_fraction * 1e6;
    const CH4_ppm = CH4_fraction * 1e6;
    const H2O_percent = DATA['💧']['🍰🧮🌧'] * 100;
    

    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    // 🔒 Utiliser le même pas constant que dans calculateFluxForT0() pour cohérence
    // DATA['🧮']['🔬🌈'] contient le nombre d'éléments (length), pas le pas
    // Le pas est toujours 0.1e-6 (comme dans calculateFluxForT0 ligne 97)
    const delta_lambda = 0.1e-6;
    
    // 🔒 SUPPRIMÉ : logCalculationPhase inutile
    
    // 🔒 Anticiper la couleur avec T0_initial dès le début
    
        const tempC_anticipated = T0_initial - CONST.KELVIN_TO_CELSIUS;
        const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
        window.updateBlackBodyColor(color_anticipated);
        
        // Mettre à jour legend-equilibre avec la couleur anticipée
        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
        if (legendEquilibre) {
            legendEquilibre.style.color = color_anticipated;
    }

    

    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // 🔒 Ajuster les bornes selon la température initiale (peut être très élevée pour Hadéen)
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O_check = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    const h2o_enabled_check = cellH2O_check && cellH2O_check.classList.contains('checked');

    // Si T0_initial est très élevé (ex: Hadéen post-impact), utiliser un intervalle plus large
    // 🔒 OPTIMISATION : Réduire l'intervalle si on part d'une T0 précédente connue (continuité)
    const prev_T0_for_range = window.plotData.temp_surface; // Plantera si n'existe pas
    const range_factor = (prev_T0_for_range !== null && prev_T0_for_range > 0) ? 0.5 : 1.0; // Réduire intervalle de 50% si continuité
    const INITIAL_RANGE = ((T0_initial > 1000) ? 200 : 50) * range_factor; // Intervalle adaptatif

    let T0_min = Math.max(200, T0_initial - INITIAL_RANGE); // Borne inférieure, minimum 200K
    // Borne supérieure : permettre jusqu'à 3000K pour Hadéen (juste après impact)
    const T0_max_limit = (T0_initial > 1000) ? 3000 : (h2o_enabled_check ? 400 : 350);
    let T0_max = Math.min(T0_max_limit, T0_initial + INITIAL_RANGE);
    let T0 = T0_initial;
    
    // 🔒 Calculer la tolérance depuis la précision de convergence (variable globale unique)
    // 🔒 IMPORTANT : tolerance (convergence) ≠ precision (échantillonnage atmosphère)
    // - tolerance : seuil de convergence pour delta_equilibre (flux_sortant - flux_entrant) en W/m²
    // - precision : taille des échantillons d'atmosphère (delta_z_stratosphere) contrôlée par precisionFactor (FPS)
    // 
    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
    // Explication :
    // - F = σT⁴ (loi de Stefan-Boltzmann, F = flux en W/m², T = température en K)
    // - dF/dT = 4σT³ (dérivée)
    // - Donc ΔF = 4σT³ × ΔT
    // - Pour une précision de precision_K en K, la tolérance en W/m² est : tolerance = 4σT³ × precision_K
    // Exemples :
    //   - À 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
    //   - À 255K avec precision_K=1K → tolerance = 4×5.67e-8×255³×1 ≈ 3.8 W/m²
    //   - À 255K avec precision_K=10K → tolerance = 4×5.67e-8×255³×10 ≈ 38 W/m²
    // Note : 1 K = 1 °C (même delta, juste décalage de 273.15), donc 0.1° = 0.1 K
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    
    const precision_K = DATA['🧮']['🧲🔬'];
    
    // Convertir la précision en K en tolérance de base en W/m² : ΔF = 4 * σ * T³ * ΔT
    // La tolérance sera recalculée à chaque itération avec T0_current (car la sensibilité change avec T)
    // Note : La précision est déjà initialisée dans setEpoch (log 🕰 🛠 [setEpoch@main.js] 🎚=0.1° 🔘 selected)
    // Note : La tolérance sera recalculée à chaque itération avec T0_current pour une précision correcte
    const tolerance_base = 4 * STEFAN_BOLTZMANN * Math.pow(T0_initial, 3) * precision_K;
    
    const max_iterations = 20;
    let iteration = 0;
    let result = null;

    // 🔒 GESTION DE L'OVERLAY DE CALCUL
    // Afficher l'overlay au début du calcul (si mode asynchrone)
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.setTimeout) {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'flex'; // Afficher (flex pour centrer)
            // Reset des points
            const dots = document.getElementById('calculation-dots');
            if (dots) dots.textContent = '';
        }
    }

    const shouldDisplaySteps = window.showDichotomySteps && window.isVisuPanelActive();

    if (shouldDisplaySteps) {
        // Créer un lambda_range temporaire pour afficher les courbes Planck avant la dichotomie
        // (utiliser les variables déjà déclarées ci-dessus)
        const temp_lambda_range = [];
        for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
            temp_lambda_range.push(lambda);
        }

        // Afficher les courbes Planck de référence avant la dichotomie
        {
            // Créer lambda_weights pour temp_lambda_range (poids unitaire pour pas constant)
            const temp_lambda_weights = temp_lambda_range.map(() => 1.0);
            
            // Créer un plotData temporaire avec seulement les courbes Planck
            const tempPlotData = {
                lambda_range: temp_lambda_range,
                lambda_weights: temp_lambda_weights, // ⚡ Nécessaire pour updatePlot
                current: null,
                co2_ppm: CO2_fraction * 1e6
            };
            window.updatePlot(tempPlotData);

            // S'assurer que la visualisation spectrale reste visible même sans nouvelles données
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
            }, 100);
        }
    } else {
        // Pour les calculs de référence, pas d'affichage graphique
    }
    
    // 🔒 IMPORTANT : Mettre à jour DATA['🧮']['🧮🌡️'] AVANT le calcul initial aussi !
    DATA['🧮']['🧮🌡️'] = T0_initial;
    DATA['🧮']['🧮⚧'] = 'Search'; // Éviter Init (cycle eau complet) ; recalcul vapeur à chaque T
    // 🔒 Résolution spectrale uniforme (test) ; init → doit exister
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    window.calculateH2OParameters();
    // Calculer la courbe initiale
    const calc_success_init = await calculateFluxForT0();
    if (!calc_success_init) {
        console.error('[performDichotomy] calculateFluxForT0() initial a échoué');
        return;
    }
    result = getSpectralResultFromDATA();
    if (!result) {
        console.error('[performDichotomy] Impossible de récupérer les résultats depuis DATA');
        return;
    }
    

    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
    // 🔒 Réutiliser shouldDisplaySteps déjà calculé ci-dessus (peut avoir changé via bouton anim)
    if (shouldDisplaySteps) {
        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_initial, result, 0, true, options);
    }

    // Reset des flux diff min/max pour la nouvelle dichotomie asynchrone
    window.flux_diff_min = -1e9;
    window.flux_diff_max = 1e9;

    return new Promise((resolve) => {
            let isCancelled = false;
            const timeoutIds = [];

            const performDichotomy = () => {
                // Vérifier si annulé
                if (window.cancelCalculation || isCancelled) {
                    return;
                }

                let T0_current = T0_initial;
                let iter = 0;
                let final_result = result;

                // 🔒 Initialiser les bornes pour la dichotomie classique
                // Ces bornes seront mises à jour par la phase exponentielle ou la dichotomie classique
                let T0_min = T0_initial - 50; // Borne inférieure initiale
                let T0_max = T0_initial + 50; // Borne supérieure initiale

                // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                let Phase = "Search";
                let signeDeltaFirst = 0;
                let old_T0 = T0_initial;
                let previousT0_for_convergence = null; // T0 précédente pour vérifier la convergence en température

                // 🔒 LOG : Début de la convergence
                console.log(`🚀 [performDichotomy] Début convergence - T0_initial = ${T0_initial.toFixed(2)}K (${(T0_initial - CONST.KELVIN_TO_CELSIUS).toFixed(2)}°C)`);
                console.log(`🚀 [performDichotomy] DATA['🧮']['🧮🌡️'] avant = ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);

                const iterate = async () => {
                    // Vérifier si annulé avant chaque itération
                    if (window.cancelCalculation || isCancelled) {
                        return;
                    }

                    if (iter >= max_iterations) {
                        // Maximum d'itérations atteint
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }

                    const shouldDisplaySteps = window.showDichotomySteps && window.isVisuPanelActive();
                    DATA['🧮']['🧮🌡️'] = T0_current;
                    window.calculateH2OParameters();
                    // Toujours recalculer pour avoir les valeurs à jour (le delta doit changer avec T0_current)
                    const calc_success = await calculateFluxForT0();
                    if (!calc_success) {
                        console.error('[iterate] calculateFluxForT0() a échoué');
                        return;
                    }
                    final_result = getSpectralResultFromDATA();
                    if (!final_result) {
                        console.error('[iterate] Impossible de récupérer les résultats depuis DATA');
                        return;
                    }
                    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
                    const geo_flux = EPOCH.geothermal_flux || null;
                    // 🔒 CORRECTION : Utiliser DATA directement, pas le bouton
                    const solar_flux_absorbed = window.calculateSolarFluxAbsorbed();

                    // 🔒 CORRECTION CRITIQUE : Inclure le flux géothermique dans le bilan énergétique !
                    // Équilibre : Flux Sortant = Flux Solaire Absorbé + Flux Géothermique
                    const total_flux_in = solar_flux_absorbed + (geo_flux || 0);
                    const flux_diff = final_result.total_flux - total_flux_in;
                    
                    // 🔒 ÉQUILIBRE RADIATIF : Les aires sous les courbes affichées doivent être égales
                    // Sur le graphique :
                    // - Courbe pointillée (...) = Planck à T_effective = σT_eff⁴
                    // - Courbe pleine (___) = émission réelle spectrale = total_flux
                    // Légende : "∫ ...= ∫___" signifie équilibre des aires sous ces deux courbes
                    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                    
                    // Calculer la température effective du corps noir (T° de la courbe pointillée affichée)
                    // T_eff = (total_flux / σ)^0.25
                    // 🔒 TOUJOURS calculer depuis total_flux (pas d'initialisation à T0)
                    const real_emission_flux = final_result.total_flux;
                    const T_effective = Math.pow(real_emission_flux / STEFAN_BOLTZMANN, 0.25);
                    
                    // Aire sous courbe pointillée (Planck à T_effective) : σT_eff⁴
                    const planck_effective_flux = STEFAN_BOLTZMANN * Math.pow(T_effective, 4);
                    
                    // Delta aire (équilibre des courbes affichées) : différence entre les aires sous les deux courbes
                    // ⚠️ IMPORTANT : delta_aire est TOUJOURS ~0 par définition mathématique !
                    // T_effective est calculé depuis real_emission_flux : T_eff = (real_emission_flux / σ)^0.25
                    // Donc planck_effective_flux = σT_eff⁴ = real_emission_flux (par construction)
                    // delta_aire = planck_effective_flux - real_emission_flux ≈ 0 (vérification de cohérence, pas de convergence)
                    // C'est l'équilibre mentionné dans la légende "∫ ...= ∫___"
                    const delta_aire = planck_effective_flux - real_emission_flux;
                    
                    // Delta équilibrage (pour convergence) : flux_sortant - flux_entrant
                    // C'est CE delta qui tend vers 0 pour la convergence (équilibre énergétique global)
                    const delta_equilibre = flux_diff;
                    // 🔒 CORRECTION : Recalculer la tolérance à chaque itération avec T0_current
                    // La sensibilité change avec la température : ΔF = 4 * σ * T³ * ΔT
                    // À 255K, 10K = 37.6 W/m², mais à 2470K, 10K = beaucoup plus grand (≈33000 W/m²)
                    // Il faut recalculer la tolérance avec T0_current pour une précision correcte
                    const tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    
                    // Delta EDS (Effet de Serre) : différence entre corps noir théorique à T0 et émission réelle
                    // Ce delta NE TEND PAS vers 0, c'est l'effet de serre (normal qu'il reste élevé)
                    // C'est la différence entre ce que la surface émet (σT0⁴) et ce qui sort réellement
                    const blackbody_flux_T0 = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
                    const delta_eds = blackbody_flux_T0 - real_emission_flux;
                    
                    // 🔒 CALCUL DIRECT D'AJUSTEMENT DE T0 (pour information/debug)
                    // Relation approximative : dT/dF ≈ 1/(4σT³) où F est le flux
                    // Pour un delta_equilibre donné, l'ajustement de T0 serait approximativement :
                    // T0_ajusté ≈ T0 - delta_equilibre / (4σT0³)
                    // Facteur de conversion : 4σT0³ (sensibilité de la température au flux)
                    // ⚠️ PROTECTION : Cette formule n'est valide que pour de petits ajustements
                    // Quand T0 est très basse, le dénominateur devient très petit et l'ajustement devient absurde
                    let T0_adjustment_direct = 0;
                    let T0_ajuste_theorique = T0_current;
                    if (T0_current > 50) { // Seulement si T0 > 50K (éviter les valeurs absurdes)
                        const sensitivity_factor = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        if (Math.abs(sensitivity_factor) > 1e-10) { // Éviter division par zéro
                            T0_adjustment_direct = -delta_equilibre / sensitivity_factor;
                            // Limiter l'ajustement à ±1000K pour éviter les valeurs absurdes
                            T0_adjustment_direct = Math.max(-1000, Math.min(1000, T0_adjustment_direct));
                            T0_ajuste_theorique = T0_current + T0_adjustment_direct;
                        }
                    }
                    
                    // Signe * sqrt(abs(delta)) pour l'équilibrage (utiliser delta_equilibre pour la phase exponentielle)
                    // C'est le delta qui doit tendre vers 0, pas delta_aire (qui est toujours ~0 par définition)
                    // 🔒 CORRECTION : Si delta_equilibre < 0, on émet moins qu'on reçoit → il faut AUGMENTER T
                    // Donc signe×√|delta| négatif signifie qu'on doit augmenter T (incrément positif)
                    const sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                    const signe_sqrt = delta_equilibre >= 0 ? 1 : -1; // Signe pour l'affichage
                    const sqrt_delta_signed = signe_sqrt * sqrt_delta;
                    
                    // 🔒 Afficher le log en commençant par Delta équilibre (valeur utilisée pour le calcul)
                    // Delta équilibre (→0) : flux_sortant - flux_entrant (convergence énergétique globale)
                    // Delta aire (→0) : équilibre des aires sous les courbes affichées (pointillée vs pleine) - TOUJOURS ~0 par définition
                    // Delta EDS : effet de serre (ne tend PAS vers 0, c'est normal)
                    // T0 ajusté théorique : calcul direct T0 - delta_equilibre/(4σT0³) pour référence
                    // Tolérance actuelle : recalculée avec T0_current (change avec la température)
                    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '🧮';
                    
                    // ⚠️ Vérifier si delta_equilibre est anormalement grand
                    if (Math.abs(delta_equilibre) > 10000) {
                        console.warn(`⚠️ [calculations.js] Delta équilibre anormalement grand: ${delta_equilibre.toFixed(2)} W/m² (flux_sortant=${final_result.total_flux.toFixed(2)} W/m², flux_entrant=${total_flux_in.toFixed(2)} W/m²)`);
                    }
                    
                    // Fonction pour log Delta équilibre
                    window.logDeltaEquilibre();
                    
                    // Afficher le calcul direct seulement si l'ajustement est raisonnable (T0 > 50K et ajustement < 100K)
                    // ⚠️ Cette formule linéaire n'est valide que pour de petits ajustements (ΔT << T)
                    // À 100K avec delta_equilibre = -233 W/m², l'ajustement serait -1013K (absurde)
                    // On n'affiche que si l'ajustement est < 100K (approximation valide)
                    // 🔒 Mettre à jour la couleur de legend-equilibre avec la température actuelle (pendant les calculs)
                    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function') {
                        const tempC_current = T0_current - CONST.KELVIN_TO_CELSIUS;
                        const color_current = window.tempSurfaceToColor(tempC_current);
                        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
                        if (legendEquilibre) {
                            legendEquilibre.style.color = color_current;
                        }
                    }
                    
                    // 🔒 Ajouter un point à chaque cycle/phase de calcul (exponentielle ou dichotomie)
                    // Avec une pause de 0.1s pour permettre l'affichage de la courbe
                    if (typeof document !== 'undefined') {
                        const dots = document.getElementById('calculation-dots');
                        if (dots) {
                            // Ajouter le point avec un délai de 0.1s pour permettre l'affichage
                            setTimeout(() => {
                                dots.innerHTML += '.';
                            }, 100);
                        }
                    }
                    
                    // 🔒 Vérifier la convergence IMMÉDIATEMENT après le calcul (avant phase exponentielle/dichotomie)
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // Si l'un des deux est satisfait, on converge (précision en température OU en flux)
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération (iter === 0)
                    // car previousT0_for_convergence = T0_initial = T0_current, donc |ΔT| = 0 toujours
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp = previousT0_for_convergence !== null && delta_T_convergence <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux || converged_by_temp) {
                        if (converged_by_temp && !converged_by_flux) {
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter + 1 }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }
                    
                    // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                    // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                    // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                    
                    // Initialiser signeDeltaFirst à la première itération
                    if (iter === 0) {
                        signeDeltaFirst = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                        old_T0 = T0_current;
                    }
                    
                    // Vérifier changement de signe : passer en Phase="Dicho"
                    const signeDelta = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                    if (Phase === "Search" && signeDeltaFirst !== 0 && signeDeltaFirst !== signeDelta) {
                        Phase = "Dicho";
                        // Initialiser les bornes pour la dichotomie
                        if (signeDeltaFirst < 0) {
                            // On était en dessous, maintenant au-dessus
                            T0_min = old_T0;
                            T0_max = T0_current;
                        } else {
                            // On était au-dessus, maintenant en dessous
                            T0_min = T0_current;
                            T0_max = old_T0;
                        }
                    }
                    
                    // Appliquer l'algorithme selon la phase
                    if (Phase === "Search") {
                        // Phase="Search" : incTemp (dT) = -delta / sensitivity
                        // Formule : dF/dT = 4σT³ => incTemp = -delta_equilibre / (4σT³)
                        // Si delta>0 (on émet trop) => diminuer T ; si delta<0 => augmenter T
                        old_T0 = T0_current;
                        const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                        const sensitivity = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        let T0_adjustment = -delta_equilibre / sensitivity; // incTemp
                        // 🔒 Limiter l'ajustement pour éviter des sauts trop importants (max ±50K par itération)
                        const T0_adjustment_unlimited = T0_adjustment;
                        T0_adjustment = Math.max(-50, Math.min(50, T0_adjustment));
                        T0_current = T0_current + T0_adjustment;
                        // 🔒 Protection : éviter les températures négatives ou trop basses
                        T0_current = Math.max(200, T0_current);
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_search = await calculateFluxForT0();
                        if (!calc_success_search) {
                            console.error('[Search] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Search] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, DATA['🔘']['🔘💧📛'], geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    } else if (Phase === "Dicho") {
                        // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                        old_T0 = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_dicho = await calculateFluxForT0();
                        if (!calc_success_dicho) {
                            console.error('[Dicho] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Dicho] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, DATA['🔘']['🔘💧📛'], geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                        // Mettre à jour les bornes selon le signe de delta_equilibre
                        if (delta_equilibre < 0) {
                            // On émet moins qu'on reçoit → augmenter T (T0_min = T0_current)
                            T0_min = T0_current;
                        } else {
                            // On émet trop → diminuer T (T0_max = T0_current)
                            T0_max = T0_current;
                        }
                        // Continuer normalement (le dessin sera fait dans la boucle principale)
                        window.incrementTimeline();
                        // Ne pas faire setTimeout ici, continuer normalement pour passer par le dessin
                        // (pas de return, on continue dans la boucle)
                    }
                    
                    // 🔒 Vérifier la convergence AVANT de continuer (peu importe la phase)
                    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
                    // Explication : F = σT⁴ (loi de Stefan-Boltzmann)
                    // dF/dT = 4σT³ (dérivée)
                    // Donc ΔF = 4σT³ × ΔT
                    // Pour une précision de precision_K en K, la tolérance en W/m² est 4σT³ × precision_K
                    // Exemple : à 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence_check = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_check = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_check = previousT0_for_convergence !== null && delta_T_convergence_check <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux_check || converged_by_temp_check) {
                        if (converged_by_temp_check && !converged_by_flux_check) {
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence pour permettre l'augmentation de précision
                        if (typeof window !== 'undefined') {
                            window.calculationConverged = true;
                            // Déclencher un événement personnalisé
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter + 1 }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }

                    // S'assurer que T0_min et T0_max sont bien définis pour la dichotomie
                    if (Phase === "Dicho" && (T0_min === undefined || T0_max === undefined || T0_min >= T0_max)) {
                        // Si les bornes ne sont pas définies, les initialiser
                        if (flux_diff > 0) {
                            // On émet trop, diminuer T0
                            T0_max = T0_current;
                            T0_min = Math.max(200, T0_current - 100); // Borne inférieure
                        } else {
                            // On émet pas assez, augmenter T0
                            T0_min = T0_current;
                            T0_max = Math.min(3000, T0_current + 100); // Borne supérieure
                        }
                    }

                    // 🔒 CASSER LA DOUBLE BOUCLE : incrémenter, dessiner, puis vérifier conditions
                    iter++;
                    
                    // Afficher chaque étape de la dichotomie seulement si demandé
                    // 🔒 Vérifier shouldDisplaySteps à chaque itération (peut changer via bouton anim)
                    const shouldDisplayStepsIter = window.showDichotomySteps && window.isVisuPanelActive();
                    
                    // 🔒 Vérifier conditions de sortie AVANT de dessiner (pour éviter de dessiner inutilement)
                    // 🔒 IMPORTANT : tolerance_current est pour la convergence (delta_equilibre), pas pour delta_aire
                    // delta_aire est toujours ~0 par définition (T_effective est calculé depuis total_flux)
                    // On utilise delta_equilibre pour la convergence, pas delta_aire
                    // tolerance_current est recalculé à chaque itération avec T0_current pour une précision correcte
                    // Deux critères de convergence : flux OU température
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_final = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_final = Math.abs(delta_equilibre) < tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_final = previousT0_for_convergence !== null && delta_T_final <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (iter > 20 || converged_by_flux_final || converged_by_temp_final) {
                        // Condition de sortie atteinte
                        if (iter > 20) {
                            console.log('[calculations.js] ⚠️ Maximum d\'itérations atteint (20)');
                        } else if (converged_by_temp_final && !converged_by_flux_final) {
                        } else {
                        }
                        
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }
                    
                    // Mettre à jour previousT0_for_convergence pour la prochaine itération (APRÈS vérification de convergence)
                    // Si on continue, on met à jour pour la prochaine comparaison
                    previousT0_for_convergence = T0_current;
                    
                    // 🔒 Dessiner après avoir vérifié qu'on continue (utiliser requestAnimationFrame pour laisser le navigateur rendre)
                    if (shouldDisplayStepsIter && !isCancelled) {
                        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_current, final_result, iter, false, options);
                        
                        // 🔒 Utiliser requestAnimationFrame pour laisser le navigateur dessiner avant de continuer
                        // Double RAF pour s'assurer que le rendu est fait
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Continuer après que le navigateur ait eu le temps de rendre
                                setTimeout(() => {
                                    iterate();
                                }, 50); // Petit délai supplémentaire pour laisser le temps de rendre
                            });
                        });
                        return; // Sortir pour laisser le temps de rendre
                    }

                    // Mettre à jour les labels du flux pendant le calcul
                    {
                        // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked)
                        const cellH2O_iter = document.getElementById('cell-h2o'); // Plantera si n'existe pas
                        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
                        const h2o_enabled = cellH2O_iter && cellH2O_iter.classList.contains('checked');

                        // 🔒 UTILISER geo_flux (variable locale déjà calculée correctement ci-dessus)
                        // au lieu de le recalculer (potentiellement mal) via getGeologicalPeriodByName
                        // let geo_flux = null; ... REMOVED

                        const albedo = window.calculateAlbedo();
                        const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
                        const co2_ppm = DATA['🫧']['🍰🫧🏭'] * 1e6;
                        const ch4_ppm = DATA['🫧']['🍰🫧🐄'] * 1e6;

                        // Mettre à jour les labels et la légende (K, °C, °F + couleur)
                        const fluxData = {
                            T0: T0_current,
                            temp_surface: T0_current,
                            temp_surface_c: T0_current - CONST.KELVIN_TO_CELSIUS,
                            total_flux: final_result.total_flux,
                            albedo: albedo,
                            cloud_coverage: cloud_coverage,
                            co2_ppm: co2_ppm,
                            ch4_ppm: ch4_ppm,
                            geo_flux: geo_flux,
                            planet_radius: (options && options.planet_radius) ? options.planet_radius : 6371000
                        };
                        const fpsOkInner = (typeof window.fps === 'number' && window.fps >= (window.FPSalert || 25));
                        if (fpsOkInner && typeof window.updateFluxLabels === 'function') {
                            window.updateFluxLabels('cycleCalcul');
                        }
                        if (typeof window.updateLegend === 'function') {
                            window.updateLegend(fluxData);
                        }
                    }

                    // 🔒 Vérification de convergence déjà faite plus haut (après incrément et dessin)

                    if (flux_diff > 0) {
                        // Flux trop élevé, diminuer T0
                        // 🔒 Mettre à jour T0_max seulement si on n'a pas encore de borne supérieure valide
                        if (T0_max > T0_current || T0_max === T0_initial + 50) {
                            T0_max = T0_current;
                        }

                        // ⚡ OPTIMISATION : Méthode Regula Falsi (Fausse Position) au lieu de Dichotomie simple
                        // Au lieu de prendre le milieu (T_min + T_max)/2, on utilise l'erreur relative
                        // pour estimer où le zéro se trouve probablement.
                        // Comme Flux ~ T^4, la fonction est monotone et convexe/concave, donc très prédictible.

                        // Sauvegarder la différence de flux pour les bornes (si disponible)
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9; // Valeur très négative par défaut
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;  // Valeur très positive par défaut

                        window.flux_diff_max = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            // Formule de la sécante : x = a - f(a) * (b - a) / (f(b) - f(a))
                            // Ici a = T0_min, b = T0_max
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            // Interpolation linéaire
                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ : Garder une marge par rapport aux bords (éviter stagnation)
                            // Ne pas aller trop près des bornes (min 10% de l'intervalle)
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            // Fallback Dichotomie classique si pas assez d'infos
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    } else {
                        // Flux trop faible, augmenter T0 (dichotomie classique)
                        T0_min = T0_current;

                        // Sauvegarder la différence de flux
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9;
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;

                        window.flux_diff_min = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    }

                    // Incrémenter le temps à chaque itération de dichotomie
                    window.incrementTimeline();

                    // Mettre à jour l'overlay (barre de progression avec .)
                    const dots = document.getElementById('calculation-dots');
                    if (dots) {
                        setTimeout(() => { dots.innerHTML += '.'; }, 100);
                    }

                    // Continuer avec un délai pour permettre la visualisation
                    if (shouldDisplaySteps && !isCancelled) {
                        const timeoutId = setTimeout(iterate, 100); // Délai de 0.1s pour visualiser chaque étape
                        timeoutIds.push(timeoutId);
                    } else if (!isCancelled) {
                        const timeoutId = setTimeout(iterate, 0); // Pas de délai si pas d'affichage (calculs de référence)
                        timeoutIds.push(timeoutId);
                    }
                };

                iterate();
            };

            const initialTimeoutId = setTimeout(performDichotomy, 500); // Attendre 500ms après l'affichage initial
            timeoutIds.push(initialTimeoutId);

            if (!window.calculationTimeouts) {
                window.calculationTimeouts = [];
            }
            window.calculationTimeouts.push(...timeoutIds);
        });
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    // 🔒 Réactiver l'affichage du spectre à la fin des calculs (même si FPS était bas pendant)
    if (typeof window !== 'undefined') {
        window.showSpectralBackground = true;
    }
    
    // Cacher l'overlay de calcul
    if (typeof document !== 'undefined') {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Stocker la T0 ajustée

    // Utiliser les résultats de la dernière itération
    const { lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = final_result;

    // Note importante : Ce modèle ne prend en compte QUE le CO2
    // Les 15°C réels de la Terre incluent aussi :
    // - Vapeur d'eau (H2O) : effet de serre majeur
    // - Méthane (CH4), protoxyde d'azote (N2O), etc.
    // - Nuages : effet de serre très important
    // Donc les températures calculées ici seront plus basses que la réalité
    //
    // Vérification avec la littérature :
    // - T_eff sans effet de serre : ~255 K (-18°C) ✓ (cohérent)
    // - T0 à 0 ppm : 255.28 K (-18.0°C) ✓
    // - T0 à 280 ppm : 266.21 K (-6.9°C) - effet de serre du CO2 seul
    // - T0 à 420 ppm : 266.80 K (-6.3°C) - effet de serre du CO2 seul
    // - Différence 420-280 ppm : 0.59 K (modèle complet) vs ~1.74 K (formule simplifiée)

    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.calculateGeothermalFlux ? window.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : false;
    // Dans finalizeResults, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise final_T0 directement pour éviter les erreurs numériques
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? final_T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // 🔒 FORCER le recalcul de la glace avant de calculer l'albedo
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.calculateH2OParameters(final_T0, h2o_total_percent, null);
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }

    const albedo = window.calculateAlbedo();
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(final_T0, 4);
    const eds = flux_surface - total_flux;
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence)
    const tempC_final = final_T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final = window.tempSurfaceToColor(tempC_final);
    window.updateBlackBodyColor(color_final);
    const legendEquilibre_f = document.querySelector('.legend-equilibre');
    if (legendEquilibre_f) legendEquilibre_f.style.color = color_final;
    
    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = final_T0;
    window.plotData.temp_surface_c = final_T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = final_T0;

    const final_result_obj = {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: final_T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: final_T0, // 🔒 Alias pour compatibilité
        temp_surface_c: final_T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };

    const maxBinsFinal = (window.FLUX && typeof window.FLUX.plotAxisXPx === 'number' && window.FLUX.plotAxisXPx > 0)
        ? Math.max(24, Math.floor(window.FLUX.plotAxisXPx))
        : (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence) || 2000;
    window.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsFinal);
    window.spectralConverged = true;
    window.spectralPrecisionTarget = 'max';
    
    {
        // 🔒 Utiliser un délai plus long pour s'assurer que updatePlot a fini
        setTimeout(() => {
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                // 🔒 FORCER la visibilité du canvas avec !important
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('z-index', '1', 'important');
                canvas.style.setProperty('position', 'absolute', 'important');
            }
            // Créer un objet avec les données nécessaires pour la visualisation
            const spectralData = {
                upward_flux: upward_flux,
                lambda_range: lambda_range,
                z_range: z_range
            };
            window.updateSpectralVisualization(spectralData);
            setTimeout(() => {
                const canvasCheck = document.getElementById('spectral-visualization');
                if (canvasCheck && (canvasCheck.style.display === 'none' || canvasCheck.style.visibility === 'hidden' || canvasCheck.style.opacity === '0')) {
                    console.warn('[finalizeResults] ⚠️ Canvas spectral caché après mise à jour, réactivation...');
                    canvasCheck.style.setProperty('display', 'block', 'important');
                    canvasCheck.style.setProperty('visibility', 'visible', 'important');
                    canvasCheck.style.setProperty('opacity', '1', 'important');
                    window.updateSpectralVisualization(spectralData);
                }
            }, 300);
        }, 250); // Délai plus long pour laisser updatePlot finir
    }

    resolve(final_result_obj);
}

// Fonction pour finaliser les résultats (mode synchrone)
function finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Récupérer h2o_enabled pour calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.calculateGeothermalFlux ? window.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.calculateH2OParameters(T0, h2o_total_percent, null);
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }
    
    const albedo = calculateAlbedo(T0, h2o_enabled, geo_flux);
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    const tempC_final_sync = T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final_sync = window.tempSurfaceToColor(tempC_final_sync);
    window.updateBlackBodyColor(color_final_sync);
    const legendEquilibre_sync = document.querySelector('.legend-equilibre');
    if (legendEquilibre_sync) legendEquilibre_sync.style.color = color_final_sync;

    const ch4_enabled = window.methaneEnabled;
    // Dans finalizeResultsSync, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise T0 directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(T0, 4);
    const eds = flux_surface - total_flux;
    
    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = T0;
    window.plotData.temp_surface_c = T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = T0;

    const maxBinsSync = (window.FLUX && typeof window.FLUX.plotAxisXPx === 'number' && window.FLUX.plotAxisXPx > 0)
        ? Math.max(24, Math.floor(window.FLUX.plotAxisXPx))
        : (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence) || 2000;
    window.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsSync);
    window.spectralConverged = true;
    window.spectralPrecisionTarget = 'max';
    setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
                // Créer un objet avec les données nécessaires pour la visualisation
                const spectralData = {
                    upward_flux: upward_flux,
                    lambda_range: lambda_range,
                    z_range: z_range
                };
                // 🔒 Recalculer avec précision maximale (1px) à la fin
                window.updateSpectralVisualization(spectralData);
    }, 150);

    return {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: T0, // 🔒 Alias pour compatibilité
        temp_surface_c: T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };
}

// ============================================================================
// EXPORT POUR UTILISATION
// ============================================================================

window.temperatureAtZ = temperatureAtZ;
window.simulateRadiativeTransfer = simulateRadiativeTransfer;
// File: API_BILAN/workers/worker_pool.js - Pool de workers spectraux (Transferable)
// Desc: Crée N-1 workers (1 CPU réservé au rendu), distribue les tranches lambda équitablement.
//       Expose window.spectralWorkerPool.dispatch(params, nZ, nL) → Promise<{resultBuf, sums}>.
//       Transferable objects : chaque worker alloue son Float32Array, transfère l'ownership au main thread
//       (zero-copy, pas de duplication mémoire). Fonctionne sans headers COOP/COEP → compatible prod.
// Version 1.1.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: March 08, 2026
// Logs:
// - v1.0.0 Initial: N-1 workers, SAB Float32 pour upward_flux, sums EDS via postMessage
// - v1.1.0 Transferable au lieu de SharedArrayBuffer (pas de headers COOP/COEP requis, compatible prod)
// - v1.1.1 Retrait typeof navigator guard (regle-js-crash)
// - v1.1.2 Plafond optionnel CONFIG_COMPUTE.maxWorkers (si défini) ; sinon nCPU - 1

(function () {
    'use strict';

    var nCPU = navigator.hardwareConcurrency;
    // 1 CPU réservé au rendu ; optionnel : CONFIG_COMPUTE.maxWorkers plafonne (ex. 4) si tu veux limiter
    var rawWorkers = Math.max(1, nCPU - 1);
    var maxCap = (window.CONFIG_COMPUTE && typeof window.CONFIG_COMPUTE.maxWorkers === 'number')
        ? Math.max(1, window.CONFIG_COMPUTE.maxWorkers) : rawWorkers;
    var nWorkers = Math.min(rawWorkers, maxCap);

    // Chemin relatif au document HTML qui charge ce script (depuis html/)
    var workerPath = '../API_BILAN/workers/spectral_slice_worker.js';

    var workers = [];
    for (var k = 0; k < nWorkers; k++) {
        workers.push(new Worker(workerPath));
    }

    console.log('[worker_pool.js] ' + nWorkers + ' workers spectraux créés (' + nCPU + ' CPUs, 1 réservé rendu) — mode Transferable');

    // dispatch: répartit les nL lambdas sur nWorkers tranches équitables.
    // Chaque worker calcule sa tranche et transfère son Float32Array[nZ * sliceSize] au main thread.
    // Le main thread fusionne les tranches dans resultBuf[nZ * nL].
    // Retourne Promise<{resultBuf: Float32Array, sums: {CO2, H2O, CH4, clouds}}>.
    function dispatch(params, nZ, nL) {
        var sliceSize = Math.ceil(nL / nWorkers);
        var doneCount = 0;
        var activeWorkers = 0;
        var sums = { CO2: 0, H2O: 0, CH4: 0, clouds: 0 };
        // Buffer de résultat final (flat, accumulé au fur et à mesure des réponses)
        var resultBuf = new Float32Array(nZ * nL);

        return new Promise(function (resolve, reject) {
            workers.forEach(function (worker, k) {
                var jStart = k * sliceSize;
                var jEnd = Math.min((k + 1) * sliceSize, nL);
                if (jStart >= nL) return;
                activeWorkers++;

                worker.onmessage = function (e) {
                    var msg = e.data;
                    if (msg.type === 'sliceTransferDone' && msg.id === k) {
                        // Fusionner la tranche transférée dans resultBuf
                        var sliceView = new Float32Array(msg.buf);
                        var sliceNL = msg.jEnd - msg.jStart;
                        for (var i = 0; i < nZ; i++) {
                            for (var j = 0; j < sliceNL; j++) {
                                resultBuf[i * nL + msg.jStart + j] = sliceView[i * sliceNL + j];
                            }
                        }
                        sums.CO2 += msg.sum_blocked_CO2;
                        sums.H2O += msg.sum_blocked_H2O;
                        sums.CH4 += msg.sum_blocked_CH4;
                        sums.clouds += msg.sum_blocked_clouds;
                        doneCount++;
                        if (doneCount === activeWorkers) {
                            resolve({ resultBuf: resultBuf, sums: sums });
                        }
                    } else if (msg.type === 'sliceError') {
                        reject(new Error('[worker_pool worker ' + k + '] ' + msg.error));
                    }
                };

                worker.postMessage({
                    type: 'slice_transfer',
                    id: k,
                    jStart: jStart,
                    jEnd: jEnd,
                    nZ: nZ,
                    // Tranches lambda pour ce worker (index local 0..jEnd-jStart-1)
                    lambda_range:      params.lambda_range.slice(jStart, jEnd),
                    lambda_weights:    params.lambda_weights.slice(jStart, jEnd),
                    cross_section_CO2: params.cross_section_CO2.slice(jStart, jEnd),
                    cross_section_H2O: params.cross_section_H2O.slice(jStart, jEnd),
                    cross_section_CH4: params.cross_section_CH4.slice(jStart, jEnd),
                    earth_flux:        params.earth_flux.slice(jStart, jEnd),
                    // Données z partagées (toutes les couches, lecture seule, petites ~50 couches)
                    layers:              params.layers,
                    i_trop:              params.i_trop,
                    h2o_eds_scale:       params.h2o_eds_scale,
                    tau_cloud_per_layer: params.tau_cloud_per_layer,
                    effective_delta_lambda: params.effective_delta_lambda,
                    T_surf:              params.T_surf,
                    constants:           params.constants
                });
                // Note : pas de Transferable sur les .slice() → ce sont des copies JS Array normales.
                // Seul le résultat (Float32Array buf) revient en Transferable depuis le worker.
            });

            if (activeWorkers === 0) {
                resolve({ resultBuf: resultBuf, sums: sums });
            }
        });
    }

    window.spectralWorkerPool = {
        ready: true,
        nWorkers: nWorkers,
        dispatch: dispatch
    };

    console.log('[worker_pool.js] spectralWorkerPool prêt. Mode Transferable (compatible prod, sans headers COOP/COEP).');
}());
// ============================================================================
// File: API_BILAN/h2o/calculations_h2o.js - Calculs H2O (vapeur et nuages)
// Desc: Séparation vapeur d'eau (effet de serre) et nuages (albedo)
// Version 1.0.14
// Date: [November 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1 : M_dry depuis masses (air sec) au lieu de M_air (dépendance circulaire) ; clamp 🍰🫧💧≤1
// - v1.0.2 : glace figée pendant Search/Dicho via _iceEpochFixedState (séparation échelles de temps)
// - v1.0.3 : cap vapeur global réaliste (0.55% masse) sur calcul direct + itératif pour limiter sur-EDS H2O
// - v1.0.4 : annotations explicites OBS vs EQ sur le cap vapeur et la fermeture de partition H2O
// - v1.0.5 : précipitation quadratique vs vapeur + cap vapeur dynamique C-C + feedback Iris simplifié
// - v1.0.6 : Iris calibré (0.07/10K) + précipitation convective temp/humidité (CMIP-like) + log Iris optionnel
// - v1.0.7 : ajout commentaire scientifique sur P_sat(T) (théorie C-C vs limitation dynamique convective observée)
// - v1.0.8 : recalage humide 2025 (c_c_max base 0.006, iris 0.03, exposants précip 1.2/1.0) avec justification biblio
// - v1.0.9 : fine-tuning léger 2025 (c_c_max base 0.0065, iris 0.02) pour remonter T sans perdre la stabilité
// - v1.0.10 : cap vapeur final observé (AIRS/ERA5, ~7%/K) en fin d'itération Init
// - v1.0.11 : propagation sulfate proxy 🍰🫧✈ depuis ⚖️✈ dans la composition atmosphérique avec vapeur
// - v1.0.13 : en Search/Dicho pas de cache H2O (recalcul vapeur à T courante) pour reproductibilité albedo_nuages (35.9% vs 35.3%)
// - v1.0.14 : logs cap vapeur C-C simplifiés en "[cycle] H2O cap @...°C"
// - v1.0.12 : sans atmosphère (⚖️🫧=0) avec ⚖️💧>0 (Corps noir météorites) : 🍰💧🧊=1 si T<0°C, sinon 🍰💧🌊=1 (didactique)
// ============================================================================

// TODO: Évolutions futures du cycle de l'eau
// - Évaporation des océans (fonction de la température de surface et de la couverture océanique)
// - Précipitations (condensation de la vapeur en fonction de l'altitude et de la température)
// - Ruissellement (retour de l'eau vers les océans via les rivières)
// - Stockage dans les calottes glaciaires (accumulation/fonte selon la température)
// - Bilan hydrique global (conservation de la masse d'eau totale)
// - Cycle saisonnier (variations annuelles de l'évaporation et des précipitations)
// - Impact du volcanisme sur l'apport d'eau (dégazage du manteau)
// Helper logs (stringifyScientificForLog) : static/compute/visu_/log_display.js (index) ou static/compute/scie_/log_display.js (iframe scie)

//Calcule la pression de vapeur saturante selon l'équation de Clausius-Clapeyron
// Formule: P_sat = P₀ × exp((L_v / R_v) × (1/T₀ - 1/T))
// Optionnel: L_v peut être ajusté avec la température: L_v = 2.501e6 - 2300 × (T - CONST.KELVIN_TO_CELSIUS)
// NOTE PHYSIQUE (OBS vs EQ):
// - La formule P_sat(T) est thermodynamiquement correcte.
// - Dans l'atmosphère réelle, la vapeur ne suit pas exactement cette courbe partout :
//   1) la condensation se produit à une température effective souvent plus basse que la surface
//      (lapse rate + niveau de condensation libre),
//   2) la convection exporte l'humidité en altitude, puis pertes par précipitation et/ou vers la stratosphère.
// - Résultat observé (AIRS, ERA5, CMIP6): la vapeur augmente typiquement d'environ 6.5-7% par degré C,
//   proche de Clausius-Clapeyron mais bridée par la dynamique convective.
function calculateSaturatedVaporPressure() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const temp_K = DATA['🧮']['🧮🌡️'];
    
    // 🔒 OPTIONNEL: Ajuster L_v avec la température pour plus de précision
    // L_v diminue légèrement avec la température (approximation linéaire)
    // À 273.15K: L_v = 2.501e6 J/kg
    // À 373.15K: L_v ≈ 2.257e6 J/kg (diminution d'environ 10%)
    // Formule: L_v = 2.501e6 - 2300 × (T - CONST.KELVIN_TO_CELSIUS)
    // Pour l'instant, on utilise L_v constant (CONST.L_VAPORIZATION = 2.5e6 J/kg)
    // Si besoin de plus de précision, décommenter la ligne suivante:
    // const L_v = 2.501e6 - 2300 * (temp_K - CONST.T0_WATER);
    const L_v = CONST.L_VAPORIZATION; // Utiliser la constante pour l'instant
    
    const exponent = (L_v / CONST.RV_WATER) * (1 / CONST.T0_WATER - 1 / temp_K);
    const P_sat = CONST.P0_WATER * Math.exp(exponent);
    return P_sat;
}

// Point d'ébullition de l'eau à la pression P (Clausius-Clapeyron inverse).
// P_atm en atm ; retourne T_boil en K. P_sat(T_boil) = P_total ⇒ 1/T_boil = 1/T0 - (R_v/L_v)*ln(P_total/P0).
function getBoilingPointKFromPressure(P_atm) {
    const CONST = window.CONST;
    const P_total_Pa = P_atm * CONV.STANDARD_ATMOSPHERE_PA;
    if (P_total_Pa <= 0) return CONST.T_BOIL;
    const ln_P = Math.log(P_total_Pa / CONST.P0_WATER);
    const inv_T = 1 / CONST.T0_WATER - (CONST.RV_WATER / CONST.L_VAPORIZATION) * ln_P;
    if (inv_T <= 0) return CONST.T_BOIL;
    return 1 / inv_T;
}

//Calcule la fraction volumique maximale de vapeur d'eau à saturation
function calculateMaxH2OVaporFraction() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    DATA['💧']['🍰🧮🌧'] = Math.min(P_sat / P_total, 1.0);
    
    return true;
}

// Calcule 🔺📛💧 = ΔF H₂O (W/m²), effet changement q_ref→q. Pas part EDS (🧲📛💧).
function calculateH2OGreenhouseForcing() {
    const DATA = window.DATA;
    if (!DATA['📛']) DATA['📛'] = {};
    const h2o_vapor_fraction = DATA['💧']['🍰🫧💧'];
    const temp_K = DATA['🧮']['🧮🌡️'];

    if (h2o_vapor_fraction <= 0) {
        DATA['📛']['🔺📛💧'] = 0;
        return true;
    }

    const H2O_REF_FRACTION = 100e-6; // 100 ppm (référence basse)
    const H2O_FORCING_COEFFICIENT = 6.0; // W/m² (α, ordre de grandeur litt. H2O vs CO2 5.35)
    const base_forcing = H2O_FORCING_COEFFICIENT * Math.log(Math.max(h2o_vapor_fraction, H2O_REF_FRACTION) / H2O_REF_FRACTION);
    const temp_factor = Math.min(temp_K / 288, 1.2);

    DATA['📛']['🔺📛💧'] = Math.max(base_forcing * temp_factor, 0); // W/m²
    return true;
}

//Calcule la contribution des nuages à l'albedo
function calculateCloudAlbedoContribution() {
    // Note: L'albedo des nuages est calculé directement dans calculateAlbedo()
    // Cette fonction est conservée pour compatibilité mais ne fait plus rien
    return true;
}

// 🔒 SUPPRIMÉ : estimateCloudCoverage() - Les nuages ne sont pas un stock d'eau
// Les nuages sont maintenant calculés via calculateCloudFormationIndex() dans calculations_albedo.js
// qui calcule ☁️ (CloudFormationIndex) puis 🍰🪩⛅ (couverture nuageuse pour albedo)

//Calcule la répartition eau vapeur / liquide / glace selon les conditions physiques
// 🔒 NOUVEAU : Utilise les surfaces géologiques pour contraindre la répartition
function calculateWaterPartition() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const STATE = window.STATE;
    const ALBEDO = window.ALBEDO;

    if (DATA['⚖️']['⚖️🫧'] == 0) {
        DATA['💧']['🍰🧮🌧'] = 0;
        DATA['💧']['🍰🫧💧'] = 0;
        if (DATA['⚖️']['⚖️💧'] == null || DATA['⚖️']['⚖️💧'] <= 0) {
            DATA['💧']['🍰💧🧊'] = 0;
            DATA['💧']['🍰💧🌊'] = 0;
            return true;
        }
        // Corps noir (ou sans atmosphère) avec eau météorites : toute l'eau en glace si T < 0°C, sinon océan (didactique)
        if (DATA['🧮']['🧮🌡️'] < CONST.T0_WATER) {
            DATA['💧']['🍰💧🧊'] = 1;
            DATA['💧']['🍰💧🌊'] = 0;
        } else {
            DATA['💧']['🍰💧🧊'] = 0;
            DATA['💧']['🍰💧🌊'] = 1;
        }
        return true;
    }
    
    // 🔒 h2o_total_fraction = fraction d'eau totale par rapport à la masse atmosphérique
    // Utilisé uniquement pour les calculs intermédiaires
    const h2o_total_fraction = DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'];
    
    // 🔒 ÉTAPE 1 : Obtenir les surfaces géologiques (doit être calculé avant)
    ALBEDO.calculateGeologySurfaces();

    // Pas d'atmosphère : pas de vapeur, mais on peut avoir de la glace si T < 0°C
    const hasNoAtmosphere = DATA['🫧']['🧪'] === 0 || DATA['🫧']['🎈'] === 0 || DATA['🫧']['🎈'] <= 0;
    if (hasNoAtmosphere) {
        // Sans atmosphère : toute l'eau est soit glace (si T < 0°C) soit liquide (océan)
        DATA['💧']['🍰🧮🌧'] = 0;  // Pas de vapeur sans atmosphère
        DATA['💧']['🍰🫧💧'] = 0;
        if (DATA['🧮']['🧮🌡️'] < CONST.T0_WATER && h2o_total_fraction > 0) {
            // T < 0°C : toute l'eau est glace
            DATA['💧']['🍰💧🧊'] = h2o_total_fraction;
            DATA['💧']['🍰💧🌊'] = 0;
        } else {
            // T >= 0°C : toute l'eau est liquide (océan)
            DATA['💧']['🍰💧🧊'] = 0;
            DATA['💧']['🍰💧🌊'] = h2o_total_fraction;
        }
        return true;
    }
    
    // Avec atmosphère : initialiser les valeurs avant calcul
    // 🔒 IMPORTANT : Ne PAS réinitialiser 🍰🫧💧 car elle est calculée par calculatePrecipitationFeedback()
    // ou par calculateH2OParametersWithIteration() et doit être préservée
    DATA['💧']['🍰💧🧊'] = 0;
    DATA['💧']['🍰💧🌊'] = 0;
    DATA['💧']['🍰🧮🌧'] = 0;
    // 🍰🫧💧 n'est PAS réinitialisée ici, elle est préservée depuis l'appel précédent

    // Calculer la pression de vapeur saturante
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;

    // Stocker la fraction molaire maximale (🍰🧮🌧)
    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;

    // 🔒 ÉTAPE 2 : Déterminer la glace selon la température ET les surfaces disponibles
    // La glace est limitée par les hautes terres disponibles (géologie)
    const has_polar_ice = DATA['🧮']['🧮🌡️'] < EARTH.T_NO_POLAR_ICE_K;
    const polar_ice_fraction_climate = has_polar_ice ? Math.max(0, Math.min(0.10, (EARTH.T_NO_POLAR_ICE_K - DATA['🧮']['🧮🌡️']) / EARTH.T_NO_POLAR_ICE_RANGE_K * 0.10)) : 0;
    
    // 🔒 CONTRAINTE GÉOLOGIQUE : La glace ne peut pas dépasser les hautes terres disponibles
    // polar_ice_fraction est une fraction de surface, limitée par highlands_fraction
    const polar_ice_fraction = Math.min(DATA['🗻']['🍰🗻🏔'], polar_ice_fraction_climate);
    
    // 🔒 CALCUL DE 🍰🫧💧 (fraction massique de vapeur d'eau dans l'atmosphère)
    // Formule : 🍰🫧💧 = max_vapor_fraction × (M_H2O / M_air)
    // Où :
    //   max_vapor_fraction = P_sat / P_total (fraction molaire maximale, ~0.017–0.02)
    //   M_H2O / M_air ≈ 0.018 / 0.029 ≈ 0.62
    //   Donc 🍰🫧💧 ≈ 0.017 × 0.62 ≈ 0.0105 (1.05%)
    // 🔒 VÉRIFICATION : M_air (🧪) doit être raisonnable (entre 0.016 et 0.050 kg/mol)
    const mass_ratio = CONST.M_H2O / DATA['🫧']['🧪']; // ~0.62 (0.01802 / 0.029 ≈ 0.621)
    
    // Calculer la fraction massique maximale (limite physique)
    // Formule : max_vapor_mass_fraction = max_vapor_fraction × (M_H2O / M_air)
    // À 288K : max_vapor_fraction ≈ 0.0171, M_H2O/M_air ≈ 0.62
    // Donc max_vapor_mass_fraction ≈ 0.0171 × 0.62 ≈ 0.0106 (1.06%)
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    
    // 🔒 LIMITE PHYSIQUE : La pression de vapeur saturante est TOUJOURS la contrainte principale
    // Même si l'eau disponible est supérieure, on ne peut pas dépasser la limite physique
    // available_water_fraction = fraction d'eau disponible par rapport à la masse atmosphérique
    const available_water_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'] : 0;

    // 🔒 IMPORTANT : calculateWaterPartition() ne doit PAS recalculer 🍰🫧💧
    // 🍰🫧💧 est calculée par calculatePrecipitationFeedback() (dans la boucle Init)
    // ou par calculateH2OParametersWithIteration() (en phase Init)
    // ou par calculateH2OParameters() (en phase non-Init)
    // calculateWaterPartition() doit seulement calculer 🍰💧🧊 et 🍰💧🌊 en utilisant la valeur existante de 🍰🫧💧
    // 🍰🫧💧 est préservée telle quelle (pas de réinitialisation, pas de recalcul)
    
    // Calculer la masse de vapeur d'eau (en kg) pour les calculs suivants
    const h2o_vapor_mass_kg = DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧'];
    
    // 🔒 RENORMALISATION : Les fractions de l'air sec doivent être ajustées pour que la somme totale = 1.0
    // 🔒 IMPORTANT : TOUJOURS recalculer depuis les masses pour éviter l'accumulation d'erreurs
    // Si 🍰🫧💧 > 0, alors les fractions de l'air sec doivent être multipliées par (1 - 🍰🫧💧)
    const dry_air_fraction = DATA['💧']['🍰🫧💧'] > 0 && DATA['💧']['🍰🫧💧'] < 1.0 ? (1.0 - DATA['💧']['🍰🫧💧']) : 1.0;
    
    // Calculer les fractions de l'air sec depuis les masses, puis multiplier par dry_air_fraction
    if (DATA['⚖️']['⚖️🫧'] > 0) {
        DATA['🫧']['🍰🫧🏭'] = (DATA['⚖️']['⚖️🏭'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧🐄'] = (DATA['⚖️']['⚖️🐄'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧🫁'] = (DATA['⚖️']['⚖️🫁'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧✈'] = (DATA['⚖️']['⚖️✈'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧💨'] = (DATA['⚖️']['⚖️💨'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
    } else {
        DATA['🫧']['🍰🫧🏭'] = 0;
        DATA['🫧']['🍰🫧🐄'] = 0;
        DATA['🫧']['🍰🫧🫁'] = 0;
        DATA['🫧']['🍰🫧✈'] = 0;
        DATA['🫧']['🍰🫧💨'] = 0;
    }
    
    // 🔒 CALCUL DE LA FRACTION DE VAPEUR PAR RAPPORT À LA MASSE TOTALE D'EAU
    // h2o_vapor_mass_kg est la masse de vapeur d'eau (en kg)
    // h2o_vapor_mass_fraction_of_total = fraction de vapeur par rapport à la masse totale d'eau (⚖️💧)
    // Cette fraction doit être entre 0 et 1, et 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total = 1.0
    const h2o_vapor_mass_fraction_of_total = DATA['⚖️']['⚖️💧'] > 0 ? (h2o_vapor_mass_kg / DATA['⚖️']['⚖️💧']) : 0;
    
    // 🔒 CALCUL DE LA FRACTION RESTANTE (LIQUIDE + GLACE) PAR RAPPORT À LA MASSE TOTALE D'EAU
    // remaining_after_vapor = 1.0 - h2o_vapor_mass_fraction_of_total
    // C'est la fraction de la masse totale d'eau qui n'est PAS en vapeur
    const remaining_after_vapor = Math.max(0, 1.0 - h2o_vapor_mass_fraction_of_total);
    
    // CORRECTION: L'eau de mer gèle à ~-2°C (EARTH.T_FREEZE_SEAWATER_K), pas 0°C
    // Et ça dépend de la pression (plus de pression = point de congélation plus bas)
    // Pour simplifier, utiliser -2°C comme point de congélation de l'eau de mer (EARTH.T_FREEZE_SEAWATER_K)
    const pressure_atm = DATA['🫧']['🎈'];
    // Ajuster selon la pression : plus de pression = point de congélation plus bas
    // À 1 atm : -2°C, à 2 atm : ~-3°C (approximation linéaire)
    const T_freeze_adjusted = EARTH.T_FREEZE_SEAWATER_K - (pressure_atm - 1) * 1.0; // -1°C par atm supplémentaire
    
    const phase = DATA['🧮']['🧮⚧'];
    const fixedIceState = STATE.iceEpochFixedWaterState || STATE.iceEpochFixedState;
    const lockIceInSolver = (phase === 'Search' || phase === 'Dicho') && fixedIceState && fixedIceState.epochId === DATA['📜']['🗿'];
    // Search/Dicho : glace figée à l'échelle époque (millénaires), vapeur/nuages restent dynamiques (jours).
    if (lockIceInSolver) {
        const fixed_ice_fraction = Math.max(0, Math.min(remaining_after_vapor, fixedIceState.value));
        DATA['💧']['🍰💧🧊'] = fixed_ice_fraction;
        DATA['💧']['🍰💧🌊'] = Math.max(0, remaining_after_vapor - fixed_ice_fraction);
    } else if (DATA['🧮']['🧮🌡️'] < T_freeze_adjusted) {
        // Si température < point de congélation ajusté : toute l'eau restante est glace
        DATA['💧']['🍰💧🧊'] = remaining_after_vapor;
        DATA['💧']['🍰💧🌊'] = 0;
    } else {
        // Si température >= point de congélation ajusté : glace aux pôles seulement
        DATA['💧']['🍰💧🧊'] = polar_ice_fraction;
        DATA['💧']['🍰💧🌊'] = Math.max(0, remaining_after_vapor - polar_ice_fraction);
    }

    // Transition liquide-glace (zone de transition entre -20°C et point de congélation ajusté)
    // const pressure_atm_transition = DATA['🫧']['🎈']; // inutilisé (nettoyage)
    // T_freeze_adjusted déjà calculé ligne 206, réutiliser cette valeur
    if (!lockIceInSolver && DATA['🧮']['🧮🌡️'] > T_freeze_adjusted - EARTH.T_ICE_TRANSITION_RANGE_K && DATA['🧮']['🧮🌡️'] < T_freeze_adjusted) {
        const transition_factor = (DATA['🧮']['🧮🌡️'] - (CONST.T0_WATER - EARTH.T_ICE_TRANSITION_RANGE_K)) / EARTH.T_ICE_TRANSITION_RANGE_K;
        const ice_before = DATA['💧']['🍰💧🧊'];
        const liquid_before = DATA['💧']['🍰💧🌊'];
        // Convertir une partie de la glace en liquide selon la température
        const ice_to_liquid = ice_before * (1 - transition_factor);
        DATA['💧']['🍰💧🌊'] = liquid_before + ice_to_liquid;
        DATA['💧']['🍰💧🧊'] = ice_before - ice_to_liquid;
    }

    // 🔒 NORMALISATION FINALE : 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total = 1.0
    // Toutes ces valeurs sont des fractions de la masse totale d'eau (⚖️💧)
    // h2o_vapor_mass_fraction_of_total est déjà calculé plus haut
    const total_liquid_ice = DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'];
    const expected_liquid_ice = Math.max(0, 1.0 - h2o_vapor_mass_fraction_of_total);
    
    // 🔒 LOGS DÉSACTIVÉS pour éviter les boucles infinies dans la console
    // Les logs sont maintenant conditionnels et limités
    // const phase = DATA['🧮']['🧮⚧'];
    // if (phase === 'Init') {
    //     console.log(`\n📊 [calculateWaterPartition] DÉTAILS CALCUL 💧:`);
    //     console.log(`   🍰🫧💧 = ${DATA['💧']['🍰🫧💧'].toFixed(3)} (fraction massique vapeur / masse atmosphérique)`);
    //     console.log(`   🍰🫧💧 (fraction / masse totale eau) = ${h2o_vapor_mass_fraction_of_total.toFixed(3)}`);
    //     console.log(`   🍰💧🧊 = ${DATA['💧']['🍰💧🧊'].toFixed(3)} (fraction glace / masse totale eau)`);
    //     console.log(`   🍰💧🌊 = ${DATA['💧']['🍰💧🌊'].toFixed(3)} (fraction liquide / masse totale eau)`);
    //     console.log(`   Total = ${(h2o_vapor_mass_fraction_of_total + DATA['💧']['🍰💧🧊'] + DATA['💧']['🍰💧🌊']).toFixed(3)} (doit être 1.0)`);
    // }
    
    // Normaliser liquide/glace pour que la somme = expected_liquid_ice
    if (total_liquid_ice > 0 && expected_liquid_ice > 0) {
        const scale = expected_liquid_ice / total_liquid_ice;
        DATA['💧']['🍰💧🌊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🌊'] * scale));
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🧊'] * scale));
    } else if (expected_liquid_ice <= 0) {
        // Toute l'eau est en vapeur
        DATA['💧']['🍰💧🌊'] = 0;
        DATA['💧']['🍰💧🧊'] = 0;
    }

    // 🔒 VÉRIFICATION FINALE : 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total doit être ≈ 1.0
    const final_sum = DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'] + h2o_vapor_mass_fraction_of_total;
    if (Math.abs(final_sum - 1.0) > 0.001) {
        // Ajuster pour garantir la normalisation exacte
        const correction = 1.0 / final_sum;
        DATA['💧']['🍰💧🌊'] *= correction;
        DATA['💧']['🍰💧🧊'] *= correction;
    }
    return true;
}

// 🔒 FONCTION : Feedback précipitation (appelée dans la boucle externe)
// Calcule 🍰🫧☔, 💭☔, ⏳☔, 🍰⚖️💦, puis met à jour 🍰🫧💧 et ajoute à 🍰💧🌊 ou 🍰💧🧊
function calculatePrecipitationFeedback() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const ALBEDO = window.ALBEDO;

    // 1. Calculer 🍰🫧☔, 💭☔, ⏳☔, 🍰⚖️💦 (via calculateCloudFormationIndex)
    ALBEDO.calculateCloudFormationIndex();
    
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    // const precip_threshold = DATA['💧']['💭☔']; // inutilisé (nettoyage)
    // const precip_time_constant = DATA['💧']['⏳☔']; // inutilisé (nettoyage)
    const precipitation_rate = DATA['💧']['🍰⚖️💦'];
    // const cloud_index = DATA['🪩']['☁️']; // inutilisé (nettoyage)

    // 2. Précipitations convectives renforcées (EARTH.PRECIP_CONVECTIVE_*). Lit. Held & Soden 2006, IPCC AR6 ; réponse plus lente que C-C.
    const temp_factor_precip = Math.pow(Math.max(0, DATA['🧮']['🧮🌡️'] / EARTH.PRECIP_CONVECTIVE_T_REF_K), EARTH.PRECIP_CONVECTIVE_T_EXPONENT);
    const humidity_ratio_precip = relative_humidity > 0 ? relative_humidity / EARTH.PRECIP_CONVECTIVE_RH_REF : 0;
    const humidity_factor_precip = Math.pow(Math.max(0, humidity_ratio_precip), EARTH.PRECIP_CONVECTIVE_RH_EXPONENT);
    const precip_rate_enhanced = precipitation_rate * temp_factor_precip * humidity_factor_precip;

    // 3. Mise à jour 🍰🫧💧 = 🍰⚖️💦 × Surface × 🔺⏳ / ⚖️🫧
    // VÉRIFICATION HOMOGÉNÉITÉ :
    // 🍰⚖️💦 : kg/m²/s (taux de précipitation)
    // Surface : m²
    // 🔺⏳ : s (temps)
    // ⚖️🫧 : kg (masse atmosphérique)
    // (🍰⚖️💦 × Surface × 🔺⏳) / ⚖️🫧 = (kg/m²/s × m² × s) / kg = kg / kg = sans dimension ✓
    const vapor_before = DATA['💧']['🍰🫧💧'];
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    let precipitation_loss_fraction = 0;
    
    // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
    const has_precipitation = precip_rate_enhanced > 0 && DATA['📅']['🔺⏳'] > 0 && atm_mass_total > 0;
    if (has_precipitation) {
        const EPOCH = window.TIMELINE[DATA['📜']['👉']];
        const planet_radius_km = EPOCH['📐'];
        const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2);
        const precipitation_mass_kg = precip_rate_enhanced * planet_surface_m2 * DATA['📅']['🔺⏳'];
        precipitation_loss_fraction = precipitation_mass_kg / atm_mass_total;
        
        DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before - precipitation_loss_fraction);
    }
    
    // 3. Ajouter la perte à 🍰💧🌊 ou 🍰💧🧊
    if (precipitation_loss_fraction > 0) {
        const precipitation_mass_kg_total = precipitation_loss_fraction * atm_mass_total;
        const precipitation_fraction_of_total_water = DATA['⚖️']['⚖️💧'] > 0 ? precipitation_mass_kg_total / DATA['⚖️']['⚖️💧'] : 0;
        
        const temp_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        if (temp_C < 0) {
            DATA['💧']['🍰💧🧊'] = Math.min(1.0, (DATA['💧']['🍰💧🧊'] || 0) + precipitation_fraction_of_total_water);
        } else {
            DATA['💧']['🍰💧🌊'] = Math.min(1.0, (DATA['💧']['🍰💧🌊'] || 0) + precipitation_fraction_of_total_water);
        }
    }
}

// 🔒 FONCTION D'ITÉRATION EN PHASE INIT : Calcul correct avec condensation
// Ordre recommandé :
// 1. Calculer 🍰🧮🌧 (saturation via T et P)
// 2. Calculer vapeur potentielle = min(disponible, saturation massique)
// 3. Calculer ☁️ (via RH)
// 4. Réduire la vapeur effective : 🍰🫧💧 = vapeur_potentielle × (1 - ☁️ × efficacité_condensation)
// 5. Mettre l'eau condensée dans 🌊 ou 🧊
// 6. Recalculer RH et ☁️ (itération)
function calculateH2OParametersWithIteration() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    //const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const ALBEDO = window.ALBEDO;
    const ATM = window.ATM;
    const COMPUTE = window.COMPUTE;
    //const EFFICIENCY_CONDENSATION = 0.9; // Efficacité de condensation (0.8-1.0)
    const MAX_ITERATIONS = 5;
    const TOLERANCE = 0.001;
    const ACCELERATION_THRESHOLD = 0.01; // Seuil pour passer de 🔺⏳×N jours à 1 jour (local, pas doublon SOLVER)
    if (DATA['🧮']['🧮⚧'] !== 'Init') {
        // En phase non-Init, utiliser l'ancien calcul
        return H2O.calculateH2OParameters();
    }
    
    // 🔒 ÉTAPE 1 : Préparer les calculs de base
    COMPUTE.getMasses();
    ATM.calculatePressureAtm();
    
    // 🔒 ÉTAPE 2 : Calculer 🍰🧮🌧 (saturation via T et P)
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;
    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;
    
    // 🔒 ÉTAPE 3 : Calculer vapeur potentielle = min(disponible, saturation massique)
    const M_dry = DATA['⚖️']['⚖️🫧'] > 0
        ? ((DATA['⚖️']['⚖️🏭'] || 0) * CONST.M_CO2 + (DATA['⚖️']['⚖️🐄'] || 0) * CONST.M_CH4 + (DATA['⚖️']['⚖️🫁'] || 0) * CONST.M_O2 + (DATA['⚖️']['⚖️💨'] || 0) * CONST.M_N2) / DATA['⚖️']['⚖️🫧']
        : CONV.molar_mass_air_ref;
    const mass_ratio = M_dry > 0 ? CONST.M_H2O / M_dry : 0;
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    const available_water_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'] : 0;
    const vapor_raw = Math.min(max_vapor_mass_fraction, available_water_fraction);
    // [OBS/CALIB] Cap vapeur dynamique (EARTH.H2O_VAPOR_CAP_* + EARTH.EVAPORATION_T_REF). Borné ≥0.
    const c_c_max = EARTH.H2O_VAPOR_CAP_REF * Math.exp(EARTH.H2O_VAPOR_CAP_RATE_PER_K * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF));
    // [EQ] Fermeture numérique : vapeur potentielle = min(cap_obs_dynamique, contrainte thermodynamique, eau disponible).
    let vapor_potentielle = Math.min(c_c_max, vapor_raw);
    // [OBS/CALIB] Feedback Iris (EARTH.IRIS_*). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025.
    const iris_factor_raw = 1.0 + EARTH.IRIS_STRENGTH * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.IRIS_T_SCALE_K;
    const iris_factor = Math.max(EARTH.IRIS_FACTOR_MIN, iris_factor_raw);
    vapor_potentielle = vapor_potentielle / iris_factor;
    
    // 🔒 INITIALISATION : Commencer avec la vapeur potentielle
    DATA['💧']['🍰🫧💧'] = vapor_potentielle;
    let previous_vapor = vapor_potentielle;
    
    // 🔒 ACCÉLÉRATION : Utiliser 🔺⏳×10 au début pour accélérer la convergence
    let use_acceleration = true;
    
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // 🔒 Ajuster 🔺⏳ selon l'état de convergence
        if (use_acceleration && iter > 0) {
            const delta_vapor_prev = Math.abs(previous_vapor - vapor_potentielle);
            if (delta_vapor_prev < ACCELERATION_THRESHOLD) {
                use_acceleration = false; // Passer à 🔺⏳ normal (1 jour)
            }
        }
        DATA['📅']['🔺⏳'] = use_acceleration ? CONV.SECONDS_PER_DAY * DATA['🎚️'].SOLVER.DELTA_T_ACCELERATION_DAYS : CONV.SECONDS_PER_DAY;
        
        // 🔒 ÉTAPE 1 : Calculer 🍰🫧☔ (RH) depuis la vapeur actuelle
        const q_sat = mass_ratio * max_vapor_fraction;
        const relative_humidity = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
        DATA['💧']['🍰🫧☔'] = relative_humidity;
        
        // 🔒 ÉTAPE 2 : Calculer 💭☔, ⏳☔, 🍰⚖️💦 (via calculateCloudFormationIndex)
        // ⚠️ IMPORTANT : calculateCloudFormationIndex() calcule 💭☔, ⏳☔, 🍰⚖️💦
        ALBEDO.calculateCloudFormationIndex();
        // const precip_threshold = DATA['💧']['💭☔'] || 0; // inutilisé (nettoyage)
        // const precip_time_constant = DATA['💧']['⏳☔'] || 0; // inutilisé (nettoyage)
        // const cloud_index = DATA['🪩']['☁️']; // inutilisé (nettoyage)

        // [OBS/CALIB] Précip convective (EARTH.PRECIP_CONVECTIVE_*). Lit. Held & Soden 2006, IPCC AR6.
        const temp_factor_precip_inner = Math.pow(Math.max(0, DATA['🧮']['🧮🌡️'] / EARTH.PRECIP_CONVECTIVE_T_REF_K), EARTH.PRECIP_CONVECTIVE_T_EXPONENT);
        const humidity_ratio_precip_inner = relative_humidity > 0 ? relative_humidity / EARTH.PRECIP_CONVECTIVE_RH_REF : 0;
        const humidity_factor_precip_inner = Math.pow(Math.max(0, humidity_ratio_precip_inner), EARTH.PRECIP_CONVECTIVE_RH_EXPONENT);
        const precip_rate_enhanced_inner = DATA['💧']['🍰⚖️💦'] * temp_factor_precip_inner * humidity_factor_precip_inner;

        // 🔒 ÉTAPE 3 : Mise à jour 🍰🫧💧 = 🍰🫧💧 - (🍰⚖️💦 × Surface × 🔺⏳) / ⚖️🫧
        const vapor_before_precipitation = DATA['💧']['🍰🫧💧'];
        let precipitation_loss_fraction = 0;
        // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
        const has_precipitation_inner = precip_rate_enhanced_inner > 0 && DATA['📅']['🔺⏳'] > 0 && DATA['⚖️']['⚖️🫧'] > 0;
        if (has_precipitation_inner) {
            const EPOCH = window.TIMELINE[DATA['📜']['👉']];
            const planet_radius_km = EPOCH['📐'];
            const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2); // Surface en m²
            const precipitation_mass_kg = precip_rate_enhanced_inner * planet_surface_m2 * DATA['📅']['🔺⏳']; // Masse précipitée en kg
            precipitation_loss_fraction = precipitation_mass_kg / DATA['⚖️']['⚖️🫧']; // Fraction massique précipitée
            
            DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before_precipitation - precipitation_loss_fraction);
        }
        
        // 🔒 ÉTAPE 4 : Ajouter la perte à 🍰💧🌊 ou 🍰💧🧊
        if (precipitation_loss_fraction > 0) {
            const precipitation_mass_kg_total = precipitation_loss_fraction * DATA['⚖️']['⚖️🫧'];
            const precipitation_fraction_of_total_water = DATA['⚖️']['⚖️💧'] > 0 ? precipitation_mass_kg_total / DATA['⚖️']['⚖️💧'] : 0;
            
            // Ajouter à 🌊 ou 🧊 selon la température
            const temp_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            if (temp_C < 0) {
                // T < 0°C : ajouter à la glace
                DATA['💧']['🍰💧🧊'] = Math.min(1.0, (DATA['💧']['🍰💧🧊'] || 0) + precipitation_fraction_of_total_water);
            } else {
                // T >= 0°C : ajouter à l'océan
                DATA['💧']['🍰💧🌊'] = Math.min(1.0, (DATA['💧']['🍰💧🌊'] || 0) + precipitation_fraction_of_total_water);
            }
        }
        
        // 🔒 ÉTAPE 5 : Recalculer la répartition eau (vapeur/liquide/glace) avec la nouvelle vapeur
        calculateWaterPartition();
        
        // Vérifier la convergence
        const delta_vapor = Math.abs(DATA['💧']['🍰🫧💧'] - previous_vapor);
        if (delta_vapor < TOLERANCE) break;
        
        previous_vapor = DATA['💧']['🍰🫧💧'];
    }

    // Dernier calcul de répartition avec la vapeur finale
    calculateWaterPartition();
    
    // Recalculer M_air avec les fractions incluant H2O
    ATM.calculateMolarMassAir();
    
    // Calculer les autres paramètres
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();

    // Limite dynamique réaliste observée (EARTH.H2O_VAPOR_REALISTIC_MAX_*, AIRS/ERA5) sur la vapeur finale Init.
    const realistic_vapor_max = EARTH.H2O_VAPOR_REALISTIC_MAX_REF * Math.exp(EARTH.H2O_VAPOR_REALISTIC_MAX_RATE_PER_K * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF));
    DATA['💧']['🍰🫧💧'] = Math.min(realistic_vapor_max, DATA['💧']['🍰🫧💧']);
    
    return true;
}

var H2O = window.H2O = window.H2O || {};

//Fonction principale : calcule tous les paramètres H2O
H2O.calculateH2OParameters = function () {
    const DATA = window.DATA;
    //const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    //const ALBEDO = window.ALBEDO;
    const ATM = window.ATM;
    const COMPUTE = window.COMPUTE;
    // En phase Init, utiliser l'itération (précipitation / convergence vapeur)
    if (DATA['🧮']['🧮⚧'] === 'Init') {
        return calculateH2OParametersWithIteration();
    }

    // En phase non-Init : recalcul seulement si (T, P) a changé de façon significative
    COMPUTE.getMasses();
    ATM.calculatePressureAtm();
    const T = DATA['🧮']['🧮🌡️'];
    const P = DATA['🫧']['🎈'];
    const sum_f = DATA['🫧']['🍰🫧🏭'] + DATA['🫧']['🍰🫧🐄'] + DATA['🫧']['🍰🫧🫁'] + DATA['🫧']['🍰🫧💨'] + DATA['💧']['🍰🫧💧'];
    const fractionsOk = sum_f > 0.5 && Math.abs(sum_f - 1) < 0.01;
    const phase = DATA['🧮']['🧮⚧'];
    const inSolver = (phase === 'Search' || phase === 'Dicho');
    const cache = H2O._lastH2OParamsCache;
    if (!inSolver && fractionsOk && cache &&
        Math.abs(T - cache.T) <= EARTH.WATER_PARTITION_DELTA_T_K &&
        Math.abs(P - cache.P) <= EARTH.WATER_PARTITION_DELTA_P_ATM) return true;

    // 🔒 Recalculer 🍰🫧💧 depuis T et P (vapeur potentielle) avant calculateWaterPartition
    // Sinon en anim, quand T change (dichotomie), on garde une 🍰🫧💧 obsolète → somme≠1, 🧪 faux
    const CONST = window.CONST;
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = P * CONV.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;
    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;
    // 🔒 M_dry depuis masses (air sec) : évite dépendance circulaire avec 🍰🫧💧 (M_air = f(🍰🫧💧) → 🍰🫧💧 = f(M_air))
    const M_dry = DATA['⚖️']['⚖️🫧'] > 0
        ? ((DATA['⚖️']['⚖️🏭'] || 0) * CONST.M_CO2 + (DATA['⚖️']['⚖️🐄'] || 0) * CONST.M_CH4 + (DATA['⚖️']['⚖️🫁'] || 0) * CONST.M_O2 + (DATA['⚖️']['⚖️💨'] || 0) * CONST.M_N2) / DATA['⚖️']['⚖️🫧']
        : CONV.molar_mass_air_ref;
    const mass_ratio = M_dry > 0 ? CONST.M_H2O / M_dry : 0;
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    const available_water_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'] : 0;
    const vapor_raw = Math.min(max_vapor_mass_fraction, available_water_fraction);
    // [OBS/CALIB] Cap vapeur dynamique (EARTH.H2O_VAPOR_CAP_* + EARTH.EVAPORATION_T_REF). Borné ≥0.
    const c_c_max = EARTH.H2O_VAPOR_CAP_REF * Math.exp(EARTH.H2O_VAPOR_CAP_RATE_PER_K * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF));
    // [EQ] Fermeture numérique : vapeur effective = min(cap_obs_dynamique, contrainte thermodynamique, eau disponible).
    let vapor_result = Math.min(c_c_max, vapor_raw);
    // [OBS/CALIB] Feedback Iris (EARTH.IRIS_*). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025.
    const iris_factor_raw = 1.0 + EARTH.IRIS_STRENGTH * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.IRIS_T_SCALE_K;
    const iris_factor = Math.max(EARTH.IRIS_FACTOR_MIN, iris_factor_raw);
    vapor_result = vapor_result / iris_factor;
    if (window.CONFIG_COMPUTE.logIrisDiagnostic) {
        console.log('[Iris] T=' + (T - CONST.KELVIN_TO_CELSIUS).toFixed(1)
            + 'C iris_factor=' + iris_factor.toFixed(3)
            + ' vapor=' + vapor_result.toFixed(5));
    }
    if (vapor_raw > c_c_max && typeof console !== 'undefined') {
        const T_C = T - CONST.KELVIN_TO_CELSIUS;
        console.log('[cycle] H2O cap @' + T_C.toFixed(1) + '°C');
    }
    DATA['💧']['🍰🫧💧'] = vapor_result;

    calculateWaterPartition();
    ATM.calculateMolarMassAir();
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();
    H2O._lastH2OParamsCache = { T, P };
    return true;
};
window.calculateH2OParameters = H2O.calculateH2OParameters;

// Exposer uniquement les fonctions utilisées ailleurs (calculations.js, main.js, calculations_albedo.js)
// Note: Ces fonctions sont déjà appelées dans calculateH2OParameters, donc les exposer permet de les réutiliser sans recalculer
window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
// 🔒 SUPPRIMÉ : window.estimateCloudCoverage - Les nuages ne sont pas un stock d'eau
window.calculateWaterPartition = calculateWaterPartition;
window.calculatePrecipitationFeedback = calculatePrecipitationFeedback;
window.getBoilingPointKFromPressure = getBoilingPointKFromPressure;
// File: API_BILAN/albedo/calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.2.27
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - epochId Archéen : 🦠 (🌋 réservé actions). Archéen utilise clouds modernes pour ~15°C.
// - 🍰⚖️💦 : formule P = W/τ (litt. 8–10 j), ⏳☔ = 1/τ_global ; rampe (RH−💭☔)/0,2 ; ref. Nature Rev. Earth Env. 2021, HESS 2017, GPCP ~2,7 mm/j.
// - v1.2.1 : rampe douce 🍰🪩🧊 en Search/Dicho (premières itérations) pour éviter saut de bassin albédo/glace
// - v1.2.2 : verrou optionnel glace initiale pendant Search du premier bassin (🧮🔄🌊=0) pour stabiliser le point fixe froid
// - v1.2.3 : retrait gardes défensives CONFIG_COMPUTE sur rampe glace (règle crash)
// - v1.2.4 : héritage glaciaire pondéré par durée d'époque (blend une fois/époque entre glace héritée et glace d'équilibre à T_config)
// - v1.2.5 : expose une glace d'époque figée (_iceEpochFixedState) pour bloquer le recalcul glace dans le solver radiatif
// - v1.2.6 : rampe glace renforcée au début Search (0.001 pendant 10 itérations), puis step nominal
// - v1.2.7 : verrou glace par époque en phase solver (Search/Dicho) via _iceEpochFixedState (anti-bistabilité)
// - v1.2.8 : proxy CCN continu (O2, T, CO2) pour 🍰🪩⛅ sans if d'époque + refs CERES/MODIS/FYSP en commentaires
// - v1.2.9 : proxy CCN enrichi (O2 + biomasse + facteur anthropique) + efficacité optique type Twomey
// - v1.2.10 : facteur anthropique progressif (1900→1980 puis déclin SO2) + sulfate_proxy ; commentaires justificatifs littérature
// - v1.2.11 : log updateLevelsConfig clarifié (vapeur init UI vs état cycle eau) + ajout masse totale H2O
// - v1.2.12 : priorité verrou glace d'époque sur _iceCoverageLock (évite 🧊=0.09 quand _iceEpochFixedState=0.022)
// - v1.2.13 : séparation verrou glace albédo (🍰🪩🧊) du verrou glace eau (🍰💧🧊) + log proxy nuages optionnel
// - v1.2.14 : calibration CCN normalisée sur un référentiel moderne (eta_cloud ~1 en 📱), logs cloud-proxy enrichis
// - v1.2.15 : nuages SW "version physique" (CCN+pression+oxydation+température), doc scientifique intégrée en commentaires
// - v1.2.16 : recalibration physique nuages SW (référence moderne explicite) pour retrouver 🍰🪩⛅~0.28-0.35 en 📱
// - v1.2.17 : annotation explicite OBS vs EQ dans le bloc nuages (traçabilité source des constantes)
// - v1.2.18 : formule forêt revue (land_frac + suitability thermique + modulation océanique) pour éviter 🌳=0 en moderne
// - v1.2.19 : fine-tuning forêt réaliste (31% terres, suitability thermique bornée) pour stabiliser CCN moderne
// - v1.2.20 : normalisation stricte des surfaces au sol + nuages traités en voile optique (pas en surface additionnelle)
// - v1.2.21 : retour calculateAlbedo aligné sur DATA['🪩']['🍰🪩📿'] (final_albedo_with_water) pour cohérence solveur/UI
// - v1.2.22 : SO₄²⁻ branché dans proxy CCN via DATA (⚖️✈, 🍰🫧✈) + log cloud-proxy enrichi
// - v1.2.23 : coefficients cloud SW externalisés vers static/tuning/model_tuning.js (iso-résultats)
// - v1.2.24 : fallback synchrone cloud tuning si window.TUNING absent
// - v1.2.25 : Corps noir avec ⚖️💧>0 → ice_cap_surface 0.9 pour 🍰🪩🧊 (glace météorites didactique)
// - v1.2.27 : ne pas écraser iceEpochFixedWaterState en Search/Dicho (bloc blend glace) pour reproductibilité visu vs scie
// - v1.2.26 : source unique CLOUD_SW : lecture DATA['🎚️'].CLOUD_SW en priorité (pas variable dupliquée)
// - v1.2.28 : ice_cap_surface piloté par la couche d'eau globale équivalente (⚖️💧 / surface planète), sans if spécial corps noir
// - v1.2.29 : contribution_glace recouplée au support de surface hydrique pour éviter un gros albédo avec une masse d'eau microscopique
//
// FORMULES ALBEDO :
// 🍰🪩📿 = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🌋,🌊,🌳,🌍,🏜️,🧊} + contribution_glace + contribution_nuages
//   où contribution_glace = (🪩🍰🧊 - albedo_base) × min(🍰💧🧊 × support_hydrique, 🍰🪩🧊) × 0.5
//   et contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅
// 🍰🪩🌋 = volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)
// 🍰🪩🌊 = ocean_coverage = (ocean_volume_m3 / (📏🌊 × 1000)) × 🐚 / (4π × 📐²)
//   où ocean_volume_m3 = (⚖️💧 × 🍰💧🌊) / 1000
// 🍰🪩🌳 = forest_coverage = f(T, ocean_coverage) : si T<30°C et ocean>0.1 alors min(0.5, ocean × (1-T/30))
// 🍰🪩🌍 = land_coverage = max(0, 1.0 - ocean - ice - forest) (continents, prairies, sols humides, albedo ~0.18)
// 🍰🪩🏜️ = desert_coverage = 1.0 - (🌋 + 🌊 + 🌳 + 🌍 + 🧊) (zones arides, albedo ~0.30)
// 🍰🪩🧊 = ice_coverage = min(0.9, 🍰💧🧊 × 0.9)
// 🍰🪩⛅ = cloud_coverage = C_max × ☁️ où C_max ≈ 0.7 et ☁️ = CloudFormationIndex

// ============================================================================
// COEFFICIENTS D'ALBÉDO PAR TYPE DE SURFACE
// ============================================================================
// Coefficients d'albédo déplacés dans CONST (propriétés physiques constantes)
// Utiliser CONST.ALBEDO_REFLECTOR_COEFF depuis physics.js

// ============================================================================
// FONCTION : CALCULER LES SURFACES GÉOLOGIQUES (COUCHE A)
// ============================================================================
// 🔒 NOUVEAU PIPELINE : Géologie → Surfaces → Stocks → Climat → Albedo
// Cette fonction fixe les surfaces à partir de la géologie/relief (quasi constants)
// Les surfaces déterminent ensuite les stocks d'eau, pas l'inverse

function calculateGeologySurfaces() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    const total = EPOCH['🗻']['🍰🗻🌊'] + EPOCH['🗻']['🍰🗻🏔'] + EPOCH['🗻']['🍰🗻🌍'];
    if (total > 1.0) {
        console.warn(`⚠️ [calculateGeologySurfaces] Somme > 1.0 (${total}), normalisation...`);
        const scale = 1.0 / total;
        DATA['🗻']['🍰🗻🌊'] = EPOCH['🗻']['🍰🗻🌊'] * scale;
        DATA['🗻']['🍰🗻🏔'] = EPOCH['🗻']['🍰🗻🏔'] * scale;
        DATA['🗻']['🍰🗻🌍'] = EPOCH['🗻']['🍰🗻🌍'] * scale;
    } else {
        DATA['🗻']['🍰🗻🌊'] = EPOCH['🗻']['🍰🗻🌊'];
        DATA['🗻']['🍰🗻🏔'] = EPOCH['🗻']['🍰🗻🏔'];
        DATA['🗻']['🍰🗻🌍'] = EPOCH['🗻']['🍰🗻🌍'];
    }
    
    return true;
}

// ============================================================================
// FONCTION : CALCULER L'INDEX DE FORMATION NUAGEUSE (☁️)
// ============================================================================
// ☁️ = CloudFormationIndex ∈ [0, 1] : potentiel de condensation (ni masse ni surface)
//
// FORMULE RÉELLE (implémentée) — Schéma Sundqvist 1989 :
// ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭
//   où 🍰🫧☔ = humidité relative (q/q_sat), 🍰💭 = CCN (0.3–1.0).
// À HR=98.9% : ☁️ ≈ 0.93 × 🍰💭. ☁️ n'utilise PAS 🍰🫧💧🌈 (cap. rad. IR, calculée ailleurs).
//
// Note : L'ancienne formule (🍰🫧💧/H2O_VAPOR_REF × f(T) × ...) n'est plus utilisée.

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    //const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // 🔒 CALCUL DE 🍰🫧☔ (Humidité relative moyenne globale)
    // FORMULE : 🍰🫧☔ = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧮🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧮🌧 = fraction massique saturante q_sat
    //   🍰🫧☔ = q / q_sat = humidité relative (RH)
    const q_sat = (CONST.M_H2O / DATA['🫧']['🧪']) * DATA['💧']['🍰🧮🌧'];  // Fraction massique saturante
    DATA['💧']['🍰🫧☔'] = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_factor = (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE;
    DATA['💧']['💭☔'] = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));

    // 🔒 CALCUL DE 🍰💭 (CCN - Efficacité condensation nuageuse)
    // FORMULE : 🍰💭 = clamp(0.4 + 0.5×(⚖️🫁/CCN_O2_REF + ⚖️🐄/CCN_CH4_REF) + 0.1×(⚖️✈/CCN_SULFATE_REF), 0.3, 1.0)
    const ccn_efficiency = Math.max(0.3, Math.min(1.0, 0.4 + 0.5 * (DATA['⚖️']['⚖️🫁'] / CONV.CCN_O2_REF_KG + DATA['⚖️']['⚖️🐄'] / CONV.CCN_CH4_REF_KG) + 0.1 * (DATA['⚖️']['⚖️✈'] / CONV.CCN_SULFATE_REF_KG)));
    DATA['🫧']['🍰💭'] = ccn_efficiency;
    
    // 🔒 FORMULE SUNDQVIST : ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭 (exposant 0.6 Sundqvist 1989)
    DATA['🪩']['☁️'] = Math.max(0, Math.min(1, (1 - Math.pow(1 - Math.min(DATA['💧']['🍰🫧☔'], 1), 0.6)) * DATA['🫧']['🍰💭']));
    
    // 🔒 CALCUL DE ⏳☔ (Inverse du temps de résidence global de la vapeur)
    // Littérature : temps de résidence vapeur ~8–10 j (Nature Rev. Earth Env. 2021; HESS 2017).
    // Relation : P = W/τ → taux précipitation (kg/m²/s) = colonne vapeur (kg/m²) / τ (s).
    DATA['💧']['⏳☔'] = 1 / CONV.TAU_VAPOR_GLOBAL_S;
    
    // 🔒 INITIALISATION DE 🔺⏳ (1 jour). En phase eau, tuning SOLVER.DELTA_T_ACCELERATION_DAYS (8–10 j) peut l’augmenter.
    DATA['📅']['🔺⏳'] = CONV.SECONDS_PER_DAY;
    
    // 🔒 CALCUL DE 🍰⚖️💦 (Taux de précipitation en kg/m²/s). P = W/τ ; rampe (RH−💭☔)/0.2. Réf. GPCP ~2,7 mm/j.
    const rh_excess = DATA['💧']['🍰🫧☔'] - DATA['💧']['💭☔'];
    const ramp = rh_excess <= 0 ? 0 : Math.min(1, rh_excess / 0.2);
    DATA['💧']['🍰⚖️💦'] = ramp * (DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧']) / (4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2)) / CONV.TAU_VAPOR_GLOBAL_S;

    return DATA['🪩']['☁️'];
}

// ============================================================================
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const ALBEDO = window.ALBEDO;
    const STATE = window.STATE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // Héritage glaciaire vs réinitialisation géologique :
    // époques courtes → forte inertie (glace héritée), époques longues → proche équilibre à T_config.
    function calcGlaceEquilibre(T_K) {
        const stock_factor = Math.max(0, (EARTH.T_NO_POLAR_ICE_K - T_K) / EARTH.T_NO_POLAR_ICE_RANGE_K);
        return Math.max(0, Math.min(1, 0.1 * stock_factor));
    }
    // Ne pas écraser le verrou glace posé par initForConfig en phase Search/Dicho (reproductibilité visu vs scie)
    const inSolverPhase = (DATA['🧮']['🧮⚧'] === 'Search' || DATA['🧮']['🧮⚧'] === 'Dicho');
    const epochLockAlreadySet = STATE.iceEpochFixedWaterState && STATE.iceEpochFixedWaterState.epochId === DATA['📜']['🗿'];
    if ((!STATE.iceDurationBlendState || STATE.iceDurationBlendState.epochId !== DATA['📜']['🗿']) && !(inSolverPhase && epochLockAlreadySet)) {
        const duree_ans = Math.abs(EPOCH['▶'] - EPOCH['◀']);
        const fraction_fonte = Math.max(0, Math.min(1, duree_ans / CONFIG_COMPUTE.tauGlaceAns));
        const glace_equilibre = calcGlaceEquilibre(EPOCH['🌡️🧮']);
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1, DATA['💧']['🍰💧🧊'] * (1 - fraction_fonte) + glace_equilibre * fraction_fonte));
        STATE.iceDurationBlendState = { epochId: DATA['📜']['🗿'] };
        STATE.iceEpochFixedWaterState = { epochId: DATA['📜']['🗿'], value: DATA['💧']['🍰💧🧊'] };
        STATE.iceEpochFixedState = STATE.iceEpochFixedWaterState; // compat
    }
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    ALBEDO.calculateGeologySurfaces();
    
    // 🔒 ÉTAPE 1.5 : Calculer volcano_coverage depuis la température de base de l'époque
    // À 2100°C (2373K), tout est lave → volcano_coverage = 1.0
    // Transition progressive : T < 1000K → 0, T > 2373K → 1.0
    const volcano_coverage = Math.max(0, Math.min(1.0, (DATA['📅']['🌡️🧮'] - CONST.T_LAVA_START) / (CONST.T_LAVA_COMPLETE - CONST.T_LAVA_START)));
    
    // 🔒 ÉTAPE 2 : Calculer la couverture océanique réelle depuis la géologie + stocks d'eau
    // La surface océanique est limitée par la géologie ET par la quantité d'eau disponible
    // Si volcano_coverage = 1.0, alors ocean_coverage = 0 (pas de mer possible)
    const planet_surface_m2 = 4 * Math.PI * EPOCH['📐'] * EPOCH['📐'];
    
    // Volume maximum que peut contenir le bassin océanique
    const ocean_basin_surface_m2 = DATA['🗻']['🍰🗻🌊'] * planet_surface_m2;
    const ocean_volume_max_m3 = (ocean_basin_surface_m2 / EPOCH['🐚']) * EPOCH['📏🌊'] * 1000;
    const ocean_mass_max_kg = ocean_volume_max_m3 * CONST.RHO_WATER;
    
    // Masse d'eau océanique réelle = min(stock_total, capacité_bassin)
    const ocean_mass_actual_kg = Math.min(DATA['⚖️']['⚖️💧'], ocean_mass_max_kg);
    
    // Surface océanique réelle (peut être < bassin si pas assez d'eau)
    const ocean_volume_actual_m3 = ocean_mass_actual_kg / CONST.RHO_WATER;
    const ocean_depth_m = EPOCH['📏🌊'] * 1000;
    const ocean_surface_actual_m2 = ocean_depth_m > 0
        ? (ocean_volume_actual_m3 / ocean_depth_m) * EPOCH['🐚']
        : 0;
    const ocean_coverage_base = Math.min(DATA['🗻']['🍰🗻🌊'], Math.max(0.0, ocean_surface_actual_m2 / planet_surface_m2));
    
    // Réduire ocean_coverage proportionnellement à volcano_coverage
    const ocean_coverage = ocean_coverage_base * (1.0 - volcano_coverage);
    
    // 🔒 Stocker ocean_coverage dans DATA AVANT calculateCloudFormationIndex()
    // calculateCloudFormationIndex() a besoin de DATA['🪩']['🍰🪩🌊'] pour calculer ☁️
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    
    let albedo_base = 0.0;
    
    // 🔒 ÉTAPE 3 : Calculer la couverture de glace depuis les hautes terres + climat
    // 🍰🪩🧊 est borné par le support physique disponible :
    // - hautes terres géologiques
    // - ou couche d'eau globale équivalente si l'astre a peu/pas de relief mais assez d'eau pour geler en surface
    const ice_temp_factor = Math.max(0, (EARTH.T_NO_POLAR_ICE_K - DATA['🧮']['🧮🌡️']) / EARTH.T_NO_POLAR_ICE_RANGE_K);
    const planet_surface_area_m2 = 4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2);
    const global_water_layer_m = (DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / planet_surface_area_m2;
    const hydrosphere_surface_support = Math.max(0, Math.min(0.9, global_water_layer_m / 10));
    const ice_cap_surface = Math.max(DATA['🗻']['🍰🗻🏔'], hydrosphere_surface_support);
    const ice_fraction_target = Math.min(ice_cap_surface, EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor);
    if (!STATE.iceCoverageRampState || STATE.iceCoverageRampState.epochId !== DATA['📜']['🗿']) {
        STATE.iceCoverageRampState = { epochId: DATA['📜']['🗿'], value: ice_fraction_target };
    }
    const isConvergencePhase = (DATA['🧮']['🧮⚧'] === 'Search' || DATA['🧮']['🧮⚧'] === 'Dicho');
    const albedoFixedState = STATE.iceEpochFixedAlbedoState;
    const hasEpochIceLock = isConvergencePhase && albedoFixedState && albedoFixedState.epochId === DATA['📜']['🗿'];
    DATA['🪩']['🍰🪩🧊'] = ice_fraction_target;
    if (hasEpochIceLock) {
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, albedoFixedState.value));
    }
    const freezeIceDuringSearch = CONFIG_COMPUTE.freezePolarIceDuringSearch !== false;
    const waterPass = (DATA['🧮'] && DATA['🧮']['🧮🔄🌊'] != null) ? DATA['🧮']['🧮🔄🌊'] : 0;
    const lock = STATE.iceCoverageLock;
    if (!hasEpochIceLock && freezeIceDuringSearch && isConvergencePhase && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿']) {
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, lock.value));
    }
    if (isConvergencePhase && DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampIters) && !hasEpochIceLock && !(freezeIceDuringSearch && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿'])) {
        const prevIce = STATE.iceCoverageRampState.value;
        const deltaIce = ice_fraction_target - prevIce;
        const rampStepActive = DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampEarlyIters) ? Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStepEarly) : Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStep);
        const deltaIceClamped = Math.max(-rampStepActive, Math.min(rampStepActive, deltaIce));
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, prevIce + deltaIceClamped));
    }
    STATE.iceCoverageRampState.value = DATA['🪩']['🍰🪩🧊'];
    
    // 🔒 volcano_coverage déjà calculé plus haut (ligne ~200)
    
    // 🔒 ÉTAPE 4 : Calculer forêts/déserts/terres depuis l'indice d'humidité climatique (H)
    // NOUVEAU SYSTÈME : Répartition automatique 🌳 / 🏜️ / 🌍 basée sur température et précipitations
    // Les biomes dépendent uniquement de température et pluie, robuste pour d'autres planètes
    //
    // 1. Calculer précipitations annuelles P_ann (mm/an)
    // P_ann ∝ 🍰🧮🌧 × 🍰🪩🌊 × F_conv × facteur_échelle
    // Où 🍰🧮🌧 = max vapor fraction (potentiel de précipitation)
    //    🍰🪩🌊 = couverture océanique (source d'évaporation)
    //    F_conv = facteur de convection (fonction de température)
    // 🔒 CORRECTION : Le facteur d'échelle était trop faible
    // Sur Terre : 🍰🧮🌧 ≈ 0.017, 🍰🪩🌊 ≈ 0.71, F_conv ≈ 1.0
    // P_ann_base = 0.017 × 0.71 × 1.0 = 0.01207
    // Pour obtenir H ≈ 1.0 à 15°C : H = P_ann / (1000 × exp(0.05 × 15)) = P_ann / 2117
    // Donc P_ann ≈ 2117 mm/an pour H = 1.0
    // Facteur d'échelle : 2117 / 0.01207 ≈ 175000
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (DATA['🧮']['🧮🌡️'] - 288.15) / 50));  // Facteur convection (T optimal ~15°C = 288.15 K)
    const P_ann = DATA['💧']['🍰🧮🌧'] * ocean_coverage * F_conv * CONV.P_ANN_SCALE_MM_AN;  // mm/an (tuning CONV.P_ANN_SCALE_MM_AN)

    // 🔒 ÉTAPE 4 : Calculer ☁️ (index de formation nuageuse) AVANT de calculer les biomes
    // calculateCloudFormationIndex() calcule aussi 🍰🫧☔ (humidité relative) nécessaire pour les biomes
    ALBEDO.calculateCloudFormationIndex();
    
    // 🔒 ÉTAPE 5 : Calculer les terres disponibles (🍰🪩🌍_)
    // FORMULE : 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊
    // Terres disponibles = surface totale - océans - glace
    const land_available = Math.max(0, 1.0 - DATA['🗻']['🍰🗻🌊'] - DATA['🪩']['🍰🪩🧊']);
    
    // 🔒 ÉTAPE 6 : Calculer forêts 🌳
    // Facteur 🌱 depuis config (0 avant -450 Ma, 0.31 après -400 Ma ; FAO 2020). Si 0 → 🍰🪩🌳 = 0.
    const forest_frac_ref = EPOCH['🌱'];
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    const temp_suitability = Math.max(0.4, Math.min(1.0, (DATA['🧮']['🧮🌡️'] - 268.15) / 25));
    const forest_potential = forest_frac_ref * land_available * temp_suitability;
    const forest_coverage = Math.min(land_available, forest_potential);
    
    // 🔒 ÉTAPE 7 : Calculer déserts 🏜️
    // FORMULE CORRIGÉE : 🍰🪩🏜️ = 🍰🪩🌍_ × (base_aridité + variabilité_régionale)
    // Les déserts sont des zones régionales avec conditions locales très différentes de la moyenne globale
    // En 2025 : Sahara a P_ann < 200 mm/an et RH < 0.3, mais moyenne globale P_ann ≈ 2600 mm/an et RH ≈ 0.83
    // Correction : Utiliser un facteur de variabilité régionale pour avoir ~20% de déserts même si moyenne globale est humide
    // Base : déserts si conditions moyennes sont arides
    const precip_factor_desert = Math.max(0, 1 - Math.min(1, P_ann / 1000)); // P_ann < 1000 mm/an → désert
    const humidity_factor_desert = Math.max(0, 1 - Math.min(1, relative_humidity / 0.6)); // RH < 0.6 → désert
    const desert_base = land_available * precip_factor_desert * humidity_factor_desert;
    
    // Variabilité régionale : même si moyenne globale est humide, il y a toujours des zones arides
    // Facteur basé sur la température (plus chaud → plus de variabilité) et l'inverse de l'humidité
    // En 2025 : ~20% de déserts sur les terres (Sahara, Gobi, etc.) même si moyenne globale est humide
    // Sur les terres disponibles (0.20), on veut ~0.06 de déserts (30% des terres)
    const temp_variability = Math.max(0.5, Math.min(1, (DATA['🧮']['🧮🌡️'] - (CONST.KELVIN_TO_CELSIUS + 5)) / 10)); // Plus de variabilité si T > 5°C, minimum 0.5
    const humidity_variability = Math.max(0.5, 1 - relative_humidity * 0.6); // Plus de variabilité si RH faible, minimum 0.5
    const VARIABILITY_FACTOR = 0.6; // 60% des terres disponibles peuvent être arides (pondéré par les facteurs)
    const variability_term = land_available * VARIABILITY_FACTOR * temp_variability * humidity_variability;
    
    // Si EPOCH['🍰🪩🏜️'] est défini (même si = 0.0), l'utiliser directement (override pour cas particuliers comme Corps noir)
    // Utiliser ?? au lieu de || car 0.0 est falsy mais est une valeur valide qu'on veut utiliser
    const desert_coverage = EPOCH['🍰🪩🏜️'] ?? Math.min(land_available, desert_base + variability_term);
    
    // 🔒 ÉTAPE 8 : Calculer terres restantes 🌍
    // FORMULE : 🍰🪩🌍 = 🍰🪩🌍_ - 🍰🪩🌳 - 🍰🪩🏜️
    // 🌍 absorbe automatiquement : steppes, prairies, toundras, montagnes
    const total_land_coverage = Math.max(0, land_available - forest_coverage - desert_coverage);
    
    // 🔒 VÉRIFICATION + NORMALISATION : les surfaces au sol doivent sommer à 1 (sans nuages)
    // Les nuages ⛅ sont traités comme un voile optique indépendant, pas comme une surface additionnelle.
    let volcano_surface = volcano_coverage;
    let ocean_surface = ocean_coverage;
    let forest_surface = forest_coverage;
    let ice_surface = DATA['🪩']['🍰🪩🧊'];
    let land_surface = total_land_coverage;
    let desert_surface = desert_coverage;
    const surface_sum = volcano_surface + ocean_surface + forest_surface + ice_surface + land_surface + desert_surface;
    if (Math.abs(surface_sum - 1.0) > 0.03) {
        console.warn(`⚠️ [calculateAlbedo] Somme surfaces=${surface_sum.toFixed(4)} -> normalisation`);
        const scale = 1.0 / surface_sum;
        volcano_surface = volcano_surface * scale;
        ocean_surface = ocean_surface * scale;
        forest_surface = forest_surface * scale;
        ice_surface = ice_surface * scale;
        land_surface = land_surface * scale;
        desert_surface = desert_surface * scale;
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🌋'] = volcano_surface;
    DATA['🪩']['🍰🪩🌊'] = ocean_surface;
    DATA['🪩']['🍰🪩🌳'] = forest_surface;
    DATA['🪩']['🍰🪩🧊'] = ice_surface;
    DATA['🪩']['🍰🪩🌍'] = land_surface;
    DATA['🪩']['🍰🪩🏜️'] = desert_surface;
    
    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = { ...EARTH['🪩🍰'], ...(EPOCH['🪩🍰'] || {}) };
    let weighted_albedo = 0;
    
    if (albedo_coeff) {
        weighted_albedo += volcano_surface * albedo_coeff['🪩🍰🌋'];
        weighted_albedo += ocean_surface * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += forest_surface * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += land_surface * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += desert_surface * albedo_coeff['🪩🍰🏜️'];
        weighted_albedo += ice_surface * albedo_coeff['🪩🍰🧊'];
    }
    
    albedo_base = weighted_albedo;
    
    let albedo = albedo_base;

    // 🔒 CONTRIBUTION H2O (GLACE) : Calculée séparément, n'affecte PAS la somme des surfaces
    // Mais elle doit rester bornée par le support de surface réellement disponible :
    // une masse d'eau infime ne doit pas produire un gros albédo global juste parce que 🍰💧🧊 = 1.
    const ice_albedo = albedo_coeff['🪩🍰🧊'];
    const ice_fraction_stock = Math.min(1.0, Math.max(0, DATA['💧']['🍰💧🧊']));
    const ice_impact_factor = 0.5;
    const ice_effective_fraction = Math.min(DATA['🪩']['🍰🪩🧊'], ice_fraction_stock * hydrosphere_surface_support);
    const ice_albedo_contribution = (ice_albedo - albedo_base) * ice_effective_fraction * ice_impact_factor;
    albedo = albedo_base + ice_albedo_contribution;

    // Contribution des nuages (H2O activé)
    // 🔒 REFONTE : Les nuages ne sont pas un stock d'eau, mais un phénomène optique
    // 🍰🪩⛅ n'est pas une proportion de surface au sol, mais une fraction optique moyenne vue par le Soleil
    //
    // FORMULE EXPLICITE :
    // 🍰🪩⛅ = C_max × eta_cloud × ☁️
    //
    // Où :
    //   C_max = 0.65 × pressure_factor (plafond physique ajusté par pression)
    //   eta_cloud = 0.40 × temp_factor_optique (efficacité optique ajustée par température)
    //   ☁️ = CloudFormationIndex (calculé par calculateCloudFormationIndex())
    //
    // Exemple Terre 1800 :
    //   P0 = 1.0 atm → pressure_factor = 1.0 → C_max = 0.65
    //   T = 14°C → temp_factor_optique ≈ 1.0 → eta_cloud = 0.40
    //   ☁️ = 1.0
    //   🍰🪩⛅ = 0.65 × 0.40 × 1.0 = 0.26
    //
    // Les nuages saturent vite : au-delà d'un certain seuil d'humidité, c'est l'optique — pas l'eau — qui limite leur effet
    let cloud_fraction = 0;
    if (DATA['🔘']['🔘💧📛'] && DATA['💧']['🍰🫧💧'] > 0) {
        // 🔒 calculateCloudFormationIndex() a déjà été appelé plus haut (ligne ~262)
        // On réutilise DATA['🪩']['☁️'] déjà calculé
        const cloud_index = DATA['🪩']['☁️'];
        // ====================== NUAGES - VERSION PHYSIQUE (pas de patch arbitraire) ======================
        // Références synthèse :
        // - Goldblatt & Zahnle (2011), Climate of the Past, FYSP : baisse low-clouds/CCN -> +10 à +25 W/m².
        // - Wolf & Toon (2013), Feulner et al. (2012) : GCM Archéen, faible CCN -> nuages SW moins réfléchissants.
        // - CERES EBAF + MODIS (2000-2025) : fraction optique SW effective moderne ~0.28-0.35.
        // - Twomey + AR6 aérosols : hausse CCN (SO2, VOCs, anthropique) -> albédo nuageux +10 à +30%.
        // Cette paramétrisation vise donc une efficacité basse en atmosphère peu oxydée/peu biotique,
        // et une efficacité proche/modérément au-dessus de 1 en moderne.

        // 1) Proxy CCN (conservé)
        // [OBS/CALIB] 0.15 et 0.85 calibrés pour rester dans les ordres de grandeur littérature FYSP/Twomey.
        const biomass_proxy = 1.0 + DATA['🎚️'].CLOUD_SW.BIOMASS_GAIN * DATA['🪩']['🍰🪩🌳'];
        let anthro_factor = 1.0;
        if (EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR) {
            anthro_factor = 1.0 + DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_MAX * Math.min(1, (EPOCH['▶'] - DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR) / DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_WINDOW_YEARS);
        }
        if (EPOCH['▶'] > DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_START_YEAR) {
            anthro_factor = anthro_factor * (1 - DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_MAX * Math.min(1, (EPOCH['▶'] - DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_START_YEAR) / DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_WINDOW_YEARS));
        }
        const sulfate_boost = (EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR)
            ? (1.0 + Math.min(DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_MAX, DATA['🫧']['🍰🫧✈'] * DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_SCALE))
            : 1.0;
        const ccn_proxy = (DATA['🎚️'].CLOUD_SW.CCN_BASE + DATA['🎚️'].CLOUD_SW.CCN_O2_WEIGHT * DATA['🫧']['🍰🫧🫁'] * biomass_proxy * anthro_factor) * sulfate_boost;
        // [OBS/CALIB] Référence moderne explicite : O2=21%, biomasse efficace ~3%, anthro courant.
        // On compare les époques en relatif, plutôt qu'en absolu, pour éviter d'écraser le moderne.
        const ccn_ref_modern = DATA['🎚️'].CLOUD_SW.CCN_BASE + DATA['🎚️'].CLOUD_SW.CCN_O2_WEIGHT * DATA['🎚️'].CLOUD_SW.MODERN_REF_O2 * (1.0 + DATA['🎚️'].CLOUD_SW.BIOMASS_GAIN * DATA['🎚️'].CLOUD_SW.MODERN_REF_FOREST) * anthro_factor;
        const ccn_ratio = ccn_proxy / ccn_ref_modern;

        // 2) Facteurs physiques d'efficacité nuageuse
        // [EQ] Forme analytique simple (pression/oxydation/température) pour la microphysique effective.
        const pressure_factor = Math.min(DATA['🎚️'].CLOUD_SW.PRESSURE_FACTOR_MAX, DATA['🫧']['🎈']);
        const oxidation_factor = Math.min(1.0, DATA['🎚️'].CLOUD_SW.OXIDATION_BASE + DATA['🎚️'].CLOUD_SW.OXIDATION_O2_GAIN * DATA['🫧']['🍰🫧🫁']);
        const temp_factor = Math.max(DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_MIN, Math.min(DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_MAX, DATA['🧮']['🧮🌡️'] / DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_REF_K));

        // 3) Efficacité optique réelle (Twomey + microphysique)
        // Centrage moderne autour de 1.0-1.2 ; états pauvres en CCN en dessous.
        // [OBS/CALIB] 1.10 et 0.45 choisis pour reproduire la plage moderne observée de couverture optique SW effective.
        let cloud_optical_efficiency = DATA['🎚️'].CLOUD_SW.OPTICAL_EFF_BASE + DATA['🎚️'].CLOUD_SW.OPTICAL_EFF_CCN_GAIN * (ccn_ratio - 1.0);
        // Oxydation déjà partiellement portée par ccn_proxy : on la garde mais en pondération douce.
        // [EQ] Pondération douce pour limiter la double comptabilisation.
        const oxidation_soft_factor = DATA['🎚️'].CLOUD_SW.OXIDATION_SOFT_BASE + DATA['🎚️'].CLOUD_SW.OXIDATION_SOFT_GAIN * oxidation_factor;
        cloud_optical_efficiency = cloud_optical_efficiency * pressure_factor * oxidation_soft_factor * temp_factor;

        // 4) Couverture optique SW effective (impact albédo)
        // [EQ] Fermeture diagnostique : cloud_index (dynamique) -> fraction optique efficace.
        cloud_fraction = (DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_BASE + DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_INDEX_GAIN * cloud_index) * cloud_optical_efficiency;

        // Limites physiques
        cloud_fraction = Math.max(0, Math.min(DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_MAX, cloud_fraction));
        if (CONFIG_COMPUTE.logCloudProxyDiagnostic) {
            console.log('[cloud-proxy] epoch=' + DATA['📜']['🗿']
                + ' T_C=' + CONST.K2C(DATA['🧮']['🧮🌡️']).toFixed(2)
                + ' cloud_idx=' + cloud_index.toFixed(3)
                + ' o2=' + DATA['🫧']['🍰🫧🫁'].toFixed(3)
                + ' forest=' + DATA['🪩']['🍰🪩🌳'].toFixed(3)
                + ' ccn=' + ccn_proxy.toFixed(3)
                + ' ccn_ref=' + ccn_ref_modern.toFixed(3)
                + ' ccn_ratio=' + ccn_ratio.toFixed(3)
                + ' so4=' + DATA['🫧']['🍰🫧✈'].toExponential(2)
                + ' so4_boost=' + sulfate_boost.toFixed(3)
                + ' anthro=' + anthro_factor.toFixed(3)
                + ' press=' + pressure_factor.toFixed(3)
                + ' oxy=' + oxidation_factor.toFixed(3)
                + ' temp=' + temp_factor.toFixed(3)
                + ' opt=' + cloud_optical_efficiency.toFixed(3)
                + ' cloud_frac=' + cloud_fraction.toFixed(3));
        }
        
        // Stocker la couverture nuageuse dans DATA['🪩']
        DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    } else {
        DATA['🪩']['🍰🪩⛅'] = 0;
    }

    // 🔒 FORMULE ALBEDO CORRIGÉE :
    // 🍰🪩📿 = 🍰🪩⛅ × 🪩🍰⛅ + Σ(🍰🪩❀ × 🪩🍰❀) | ❀ ∈ { 🌋,🌊,🌳,🏜️,🧊 }
    albedo = albedo * (1 - cloud_fraction) + albedo_coeff['🪩🍰⛅'] * cloud_fraction;

    const final_albedo = Math.max(0.0, Math.min(0.9, albedo));
    
    // 🔒 Facteur corps noir : si pas assez d'eau pour 10m de profondeur, réduire l'albedo
    // Calculer le volume d'eau disponible (m³)
    const water_volume_m3 = DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER;
    
    // Surface totale de la planète (m²) - réutiliser celle calculée ligne 217
    
    // Volume minimal requis pour 10 mètres de profondeur (m³)
    const min_depth_m = 10; // 10 mètres minimum
    const min_volume_required_m3 = planet_surface_m2 * min_depth_m;
    
    // Ratio : si ratio < 1, pas assez d'eau pour 10m de profondeur
    // Si ratio = 0 (pas d'eau), blackbody_factor = 0 (corps noir)
    const water_ratio = min_volume_required_m3 > 0 ? water_volume_m3 / min_volume_required_m3 : 0;
    
    // blackbody_factor : 0 si pas d'eau, 1 si assez d'eau pour 10m
    const blackbody_factor = Math.min(1, Math.max(0, water_ratio));
    
    // Appliquer au final_albedo
    const final_albedo_with_water = final_albedo * blackbody_factor;
    if (!Number.isFinite(final_albedo_with_water)) {
        throw new Error('[calculateAlbedo] 🍰🪩📿 non fini (NaN/Inf) — contrôler 🧮🌡️, surfaces, cloud_fraction. T_K=' + DATA['🧮']['🧮🌡️'] + ' albedo=' + albedo + ' cloud_fraction=' + cloud_fraction + ' final_albedo=' + final_albedo + ' blackbody_factor=' + blackbody_factor);
    }
    // 🔒 Les surfaces sont déjà stockées plus haut (lignes 249-254)
    // ice_fraction_base est la surface de glace, ice_fraction_stock est la fraction du stock d'eau
    DATA['🪩']['🍰🪩📿'] = final_albedo_with_water;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    return final_albedo_with_water;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    if (!DATA['🔘']['🔘💧📛']) {
        return 0;
    }

    // 🔒 REFONTE : calculateCloudCoverage() est maintenant DEPRECATED
    // Utiliser calculateCloudFormationIndex() + 🍰🪩⛅ = C_max × ☁️ à la place
    // Cette fonction est conservée pour compatibilité. Calculs en K (DATA officiel).
    const T_K = DATA['🧮']['🧮🌡️'];
    const T_COLD_K = 253.15;   // -20°C
    const T_0_K = 273.15;     // 0°C
    const T_REF_MAX_K = 303.15;  // 30°C

    if (T_K < T_COLD_K) {
        const cloud_at_cold = 0.05;
        const decay_rate = 0.1;
        const cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_K - T_COLD_K));
        return Math.min(1, Math.max(0, cloud_fraction));
    }
    if (T_K < T_0_K) {
        const cloud_at_0 = 0.2;
        const cloud_at_cold = 0.05;
        const cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_K - T_COLD_K) / 20);
        return Math.min(1, cloud_fraction);
    }
    const cloud_fraction_min = 0.2;
    const cloud_fraction_max_physical = 0.75;
    const cloud_fraction_max_limited = 0.6;
    const physical_fraction = (T_K >= T_REF_MAX_K)
        ? cloud_fraction_max_physical
        : cloud_fraction_min + (cloud_fraction_max_physical - cloud_fraction_min) * (T_K / T_REF_MAX_K);
    return Math.min(1, Math.min(cloud_fraction_max_limited, physical_fraction));
}

function calculateSolarFluxAbsorbed() {
    const DATA = window.DATA;
    // 🔒 CRASH si calculateAlbedo() échoue (pas de fallback)
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    const solar_flux_reflected_wm = solar_flux_average_wm * albedo;
    const solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm;
    return solar_flux_absorbed_wm;
}

var ALBEDO = window.ALBEDO = window.ALBEDO || {};
ALBEDO.calculateAlbedo = calculateAlbedo;
ALBEDO.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
ALBEDO.calculateCloudFormationIndex = calculateCloudFormationIndex;
ALBEDO.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
ALBEDO.calculateGeologySurfaces = calculateGeologySurfaces;
window.calculateAlbedo = calculateAlbedo;
window.calculateCloudCoverage = calculateCloudCoverage;
window.calculateCloudFormationIndex = calculateCloudFormationIndex;
window.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
window.calculateGeologySurfaces = calculateGeologySurfaces;

function updateLevelsConfig() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const total_atmosphere_mass_kg = DATA['⚖️']['⚖️🫧'];
    const molar_mass_air = DATA['🫧']['🧪'];
    const isCorpsNoir = DATA['📜']['🗿'] === '⚫';
    
    // Initialiser CO2 depuis EPOCH
    let co2_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🏭'] > 0) {
        const co2_fraction = window.co2KgToFraction(EPOCH['⚖️🏭'], total_atmosphere_mass_kg, molar_mass_air);
        co2_ppm = co2_fraction * 1e6;
    }
    
    // Initialiser CH4 depuis EPOCH
    let ch4_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🐄'] > 0) {
        const ch4_fraction = window.ch4KgToFraction(EPOCH['⚖️🐄'], total_atmosphere_mass_kg, molar_mass_air);
        ch4_ppm = ch4_fraction * 1e6;
    }
    
    // Initialiser H2O : ⚖️💧 = eau totale (océans), pas vapeur. Utiliser DATA['💧']['🍰🫧💧'] si dispo, sinon 0.
    let h2o_percent = 0;
    if (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null && DATA['💧']['🍰🫧💧'] > 0) {
        h2o_percent = DATA['💧']['🍰🫧💧'] * 100;
    }
    
    // Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    if (window.maximiseData) {
        const savedCO2 = window.savedCO2 || 0;
        const savedCH4 = window.savedCH4 || 0;
        const savedH2O = window.savedH2O || 0;
        co2_ppm = Math.max(savedCO2, co2_ppm);
        ch4_ppm = Math.max(savedCH4, ch4_ppm);
        h2o_percent = Math.max(savedH2O, h2o_percent);
    }
    
    // Mettre à jour plotData
    if (typeof plotData !== 'undefined') {
        plotData.co2_ppm = co2_ppm;
        plotData.ch4_ppm = ch4_ppm;
    }
    
    // Mettre à jour window.h2oVaporPercent
    window.h2oVaporPercent = h2o_percent;
    window.h2oTotalFromMeteorites = 0;
    
    const h2o_total_kg = DATA['⚖️']['⚖️💧'];
    console.log('📛 [updateLevelsConfig] 🏭=' + co2_ppm.toFixed(0) + 'ppm 🍰🫧💧(initUI)=' + h2o_percent.toFixed(1) + '% 🐄=' + ch4_ppm.toFixed(0) + 'ppm ⚖️💧=' + h2o_total_kg.toExponential(2) + 'kg');
}

// Exposer globalement pour utilisation dans main.js
window.updateLevelsConfig = updateLevelsConfig;

// File: API_BILAN/atmosphere/calculations_atm.js - Calculs composition atmosphérique
// Desc: En français, dans l'architecture, je suis le module de calculs atmosphériques
// Version 1.1.5
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Fix: use DATA['🧮']['🧮🌡️'] in calculateAtmosphereProperties (was typo 🌡️)
// - Suppression logs calculateMolarMassAir
// - co2KgToFraction, ch4KgToFraction (masse kg → fraction molaire pour updateLevelsConfig)
// - updateAtmosphereHeightFromCurrentT() : met à jour 📏🫧🧿 et 📏🫧🛩 depuis T courante (même grille verticale cold/warm start)
// - v1.1.4 : 🎈 inclut vapeur d'eau : P = (⚖️🫧 + masse_vapeur) × 🍎 / (4π×R²), masse_vapeur = ⚖️🫧×🍰🫧💧/(1−🍰🫧💧)
// - v1.1.5 : add sulfate proxy fraction 🍰🫧✈ from DATA['⚖️']['⚖️✈'] (separate from dry-air renormalization)
//
// ============================================================================
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

//Calcule les propriétés structurelles de l'atmosphère (utilise DATA directement)
function calculateAtmosphereProperties() {
    // console.log(`🫧 [calculateAtmosphereProperties@calculations_atm.js]`);
    const DATA = window.DATA;
    
    const temperature_K = DATA['🧮']['🧮🌡️'];
    window.calculateMolarMassAir();
    const molar_mass_kg_mol = DATA['🫧']['🧪'];

    const CONST = window.CONST;
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    // Éviter NaN si molar_mass_kg_mol ou gravity = 0
    const denominator = molar_mass_kg_mol * DATA['📅']['🍎'];
    const scale_height = (denominator > 0) ? (CONST.R_GAS * temperature_K) / denominator : 0;
    
    // Seuil pour atmosphère massive : ~5x la masse actuelle (5.15e18 kg) = 2.5e19 kg
    const is_massive = DATA['⚖️']['⚖️🫧'] > 2.5e19;
    
    // Calcul de z_max basé sur la pression au sol P0
    const planet_radius_m = DATA['📅']['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const atm_mass = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧']) ? DATA['⚖️']['⚖️🫧'] : 0;
    const P0 = atm_mass * DATA['📅']['🍎'] / surface_area;
    const P_limit = 0.01;

    // Tout à 0 (pas d'atmosphère) → une seule couche très fine, calcul en une passe (corps noir, 🧲🌈🔼 = σT⁴)
    if (atm_mass <= 0 || P0 <= 0) {
        return { z_max: 1e-6, scale_height: 0, is_massive: false };
    }

    // Éviter NaN si scale_height = 0 ou P0 invalide
    let z_max_theoretical = 0;
    if (scale_height > 0 && P0 > 0) {
        z_max_theoretical = scale_height * Math.log(Math.max(P0, 1e-5) / P_limit);
        z_max_theoretical = Math.max(0, z_max_theoretical);
    }

    let z_max = z_max_theoretical;
    if (P0 > 100) {
        z_max = Math.max(120000, z_max_theoretical);
    } else {
        z_max = Math.max(1, z_max_theoretical);
    }

    if (is_massive && z_max < 300000) {
        z_max = 300000;
    }

    if (z_max > 1000) {
        z_max = Math.ceil(z_max / 10000) * 10000;
    } else {
        z_max = Math.ceil(z_max);
    }

    if (!isFinite(z_max) || isNaN(z_max)) {
        z_max = 0;
    }

    return {
        z_max, // en mètres
        scale_height, // en mètres
        is_massive
    };
}


// ============================================================================
// FONCTIONS HELPER POUR CALCULER LES PARAMÈTRES DEPUIS LA CONFIG
// ============================================================================

//Calcule la masse molaire moyenne de l'air depuis les fractions actuelles (utilise DATA directement)
function calculateMolarMassAir() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // 🔒 UTILISER LES FRACTIONS ACTUELLES (après renormalisation avec H2O), pas les masses de l'époque
    // Les fractions sont déjà normalisées : 🍰🫧🏭 + 🍰🫧🐄 + 🍰🫧🫁 + 🍰🫧💨 + 🍰🫧💧 = 1.0
    const frac_CO2 = DATA['🫧']['🍰🫧🏭'] || 0;
    const frac_CH4 = DATA['🫧']['🍰🫧🐄'] || 0;
    const frac_O2 = DATA['🫧']['🍰🫧🫁'] || 0;
    const frac_N2 = DATA['🫧']['🍰🫧💨'] || 0;
    const frac_H2O = DATA['💧']['🍰🫧💧'] || 0;
    // Masse molaire moyenne pondérée par les fractions molaires (approximation : fractions volumiques ≈ fractions molaires)
    // M_air = Σ(fraction_i × M_i)
    const M_air = frac_CO2 * CONST.M_CO2 + 
                   frac_CH4 * CONST.M_CH4 + 
                   frac_O2 * CONST.M_O2 + 
                   frac_N2 * CONST.M_N2 + 
                   frac_H2O * CONST.M_H2O;
    
    // Si pas d'atmosphère, utiliser la valeur de référence
    DATA['🫧']['🧪'] = M_air > 0 ? M_air : CONV.molar_mass_air_ref;
    return true;
}

// Calcule la pression atmosphérique (utilise DATA directement).
// P = (masse totale × 🍎) / (4π × R²) ; masse totale = air sec (⚖️🫧) + vapeur d'eau.
// Vapeur : 🍰🫧💧 = fraction massique vapeur ⇒ masse_vapeur = ⚖️🫧 × 🍰🫧💧 / (1 − 🍰🫧💧).
// → 🎈 ~0.988–0.995 atm (2025) au lieu de ~0.976 si on ignorait la vapeur (📏🫧🛩, Clausius-Clapeyron cohérents).
function calculatePressureAtm() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const planet_radius_m = EPOCH['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const atm_mass_dry = DATA['⚖️']['⚖️🫧'];
    const frac_vapor = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
    const denom = Math.max(1e-10, 1 - frac_vapor);
    const mass_vapor = (frac_vapor > 0 && frac_vapor < 1) ? (atm_mass_dry * frac_vapor / denom) : 0;
    const atm_mass_total = atm_mass_dry + mass_vapor;
    const gravity = EPOCH['🍎'];
    const pressure_pa = (atm_mass_total * gravity) / surface_area;

    DATA['🫧']['🎈'] = (surface_area > 0 && isFinite(pressure_pa) && pressure_pa > 0) ? pressure_pa / CONV.STANDARD_ATMOSPHERE_PA : 0;

    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER COMPOSITION DEPUIS OBJET AVEC LOGOS
// ============================================================================

//Calcule la composition atmosphérique depuis DATA (met à jour DATA['🫧'])
function calculateAtmosphereComposition() {
    const DATA = window.DATA;
    // 🔒 CORRECTION : Les fractions sont calculées par rapport à ⚖️🫧 (masse atmosphérique totale)
    // ⚖️🫧 = ⚖️🏭 + ⚖️🐄 + ⚖️🫁 + ⚖️💨 (air sec, sans vapeur d'eau pour l'instant)
    // La vapeur d'eau sera ajoutée après dans calculateWaterPartition()
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    
    // 🔒 Protection contre undefined/NaN : traiter comme 0
    const mass_CO2 = isFinite(DATA['⚖️']['⚖️🏭']) ? DATA['⚖️']['⚖️🏭'] : 0;
    const mass_CH4 = isFinite(DATA['⚖️']['⚖️🐄']) ? DATA['⚖️']['⚖️🐄'] : 0;
    const mass_O2 = isFinite(DATA['⚖️']['⚖️🫁']) ? DATA['⚖️']['⚖️🫁'] : 0;
    const mass_N2 = isFinite(DATA['⚖️']['⚖️💨']) ? DATA['⚖️']['⚖️💨'] : 0;
    const mass_SULFATE = isFinite(DATA['⚖️']['⚖️✈']) ? DATA['⚖️']['⚖️✈'] : 0;
    
    // 🔒 GESTION CAS SANS ATMOSPHÈRE (corps noir, etc.) : toutes les fractions à 0
    if (atm_mass_total <= 0) {
        DATA['🫧']['🍰🫧🏭'] = 0;
        DATA['🫧']['🍰🫧🐄'] = 0;
        DATA['🫧']['🍰🫧🫁'] = 0;
        DATA['🫧']['🍰🫧💨'] = 0;
        DATA['🫧']['🍰🫧✈'] = 0;
        DATA['💧']['🍰🫧💧'] = 0;
    } else {
        // 🔒 FORMULES CORRIGÉES : Toutes les fractions sont calculées par rapport à ⚖️🫧
        // 🍰🫧🏭 = ⚖️🏭 / ⚖️🫧
        DATA['🫧']['🍰🫧🏭'] = mass_CO2 / atm_mass_total;
        // 🍰🫧🐄 = ⚖️🐄 / ⚖️🫧
        DATA['🫧']['🍰🫧🐄'] = mass_CH4 / atm_mass_total;
        
        // 🍰🫧🫁 = ⚖️🫁 / ⚖️🫧
        DATA['🫧']['🍰🫧🫁'] = mass_O2 / atm_mass_total;
        
        // 🍰🫧💨 = ⚖️💨 / ⚖️🫧
        DATA['🫧']['🍰🫧💨'] = mass_N2 / atm_mass_total;
        // 🍰🫧✈ = ⚖️✈ / ⚖️🫧 (proxy CCN ; hors renormalisation air sec)
        DATA['🫧']['🍰🫧✈'] = mass_SULFATE / atm_mass_total;
    }
        
    // H2O atmosphérique (vapeur) : sera calculé dans calculateWaterPartition()
    // 🍰🫧💧 = ⚖️💧 × 🍰🧮🌧 / ⚖️🫧 (sera calculé après)
    DATA['💧']['🍰🫧💧'] = 0;
        
    // Vérifier que la somme des fractions de l'air sec = 1.0 (avec tolérance)
    const total_fraction_dry = DATA['🫧']['🍰🫧🏭'] + DATA['🫧']['🍰🫧🐄'] + DATA['🫧']['🍰🫧🫁'] + DATA['🫧']['🍰🫧💨'];
    if (Math.abs(total_fraction_dry - 1.0) > 0.01) {
        // Ajuster N2 pour que la somme de l'air sec = 1.0
        DATA['🫧']['🍰🫧💨'] = Math.max(0, 1.0 - (DATA['🫧']['🍰🫧🏭'] + DATA['🫧']['🍰🫧🐄'] + DATA['🫧']['🍰🫧🫁']));
    }
    
    const props = window.calculateAtmosphereProperties();
    const altitude = props.z_max;
    const tropopause = calculateTropopauseHeight();
    
    // Mettre à jour DATA directement
    DATA['🫧']['📏🫧🧿'] = altitude / 1000;  // Altitude max en km
    DATA['🫧']['📏🫧🛩'] = tropopause / 1000;  // Tropopause en km
    
    return true;
}

/** Met à jour 📏🫧🧿 et 📏🫧🛩 à partir de la T courante (DATA['🧮']['🧮🌡️']).
 *  À appeler au début de chaque pas radiatif pour que cold start et warm start
 *  aient la même grille verticale à même T (évite Δ différent à 15,8°C). */
function updateAtmosphereHeightFromCurrentT() {
    const props = window.calculateAtmosphereProperties();
    const tropopause_m = calculateTropopauseHeight();
    window.DATA['🫧']['📏🫧🧿'] = props.z_max / 1000;
    window.DATA['🫧']['📏🫧🛩'] = tropopause_m / 1000;
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

function calculateTropopauseHeight() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const atm_mass = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧']) ? DATA['⚖️']['⚖️🫧'] : 0;
    if (atm_mass <= 0) return 0;
    return (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (DATA['🫧']['🧪'] * EPOCH['🍎']);
}

function pressureAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    if (DATA['⚖️']['⚖️🫧'] === 0) return 0;
    const P0_pa = (DATA['🫧']['🎈'] != null && DATA['🫧']['🎈'] > 0) ? DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA : (DATA['⚖️']['⚖️🫧'] * EPOCH['🍎']) / (4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2));
    const H = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (DATA['🫧']['🧪'] * EPOCH['🍎']);
    return P0_pa * Math.exp(-z / H);
}

function airNumberDensityAtZ(z) {
    const CONST = window.CONST;
    return pressureAtZ(z) / (CONST.BOLTZMANN_KB * window.temperatureAtZ(z));
}

/** Convertit masse CO2 (kg) en fraction molaire : (mass_CO2/M_CO2) / (mass_total/M_air) */
function co2KgToFraction(co2_kg, total_atm_kg, molar_mass_air) {
    const CONST = window.CONST;
    if (!total_atm_kg || total_atm_kg <= 0) return 0;
    const M_air = molar_mass_air && molar_mass_air > 0 ? molar_mass_air : CONV.molar_mass_air_ref;
    return (co2_kg * M_air) / (total_atm_kg * CONST.M_CO2);
}

/** Convertit masse CH4 (kg) en fraction molaire : (mass_CH4/M_CH4) / (mass_total/M_air) */
function ch4KgToFraction(ch4_kg, total_atm_kg, molar_mass_air) {
    const CONST = window.CONST;
    if (!total_atm_kg || total_atm_kg <= 0) return 0;
    const M_air = molar_mass_air && molar_mass_air > 0 ? molar_mass_air : CONV.molar_mass_air_ref;
    return (ch4_kg * M_air) / (total_atm_kg * CONST.M_CH4);
}

var ATM = window.ATM = window.ATM || {};
ATM.calculateAtmosphereProperties = calculateAtmosphereProperties;
ATM.calculateMolarMassAir = calculateMolarMassAir;
ATM.calculatePressureAtm = calculatePressureAtm;
ATM.calculateAtmosphereComposition = calculateAtmosphereComposition;
ATM.updateAtmosphereHeightFromCurrentT = updateAtmosphereHeightFromCurrentT;
ATM.calculateTropopauseHeight = calculateTropopauseHeight;
ATM.pressureAtZ = pressureAtZ;
ATM.airNumberDensityAtZ = airNumberDensityAtZ;
ATM.co2KgToFraction = co2KgToFraction;
ATM.ch4KgToFraction = ch4KgToFraction;
window.calculateAtmosphereProperties = calculateAtmosphereProperties;
window.calculateMolarMassAir = calculateMolarMassAir;
window.calculatePressureAtm = calculatePressureAtm;
window.calculateAtmosphereComposition = calculateAtmosphereComposition;
window.updateAtmosphereHeightFromCurrentT = updateAtmosphereHeightFromCurrentT;
window.calculateTropopauseHeight = calculateTropopauseHeight;
window.pressureAtZ = pressureAtZ;
window.airNumberDensityAtZ = airNumberDensityAtZ;
window.co2KgToFraction = co2KgToFraction;
window.ch4KgToFraction = ch4KgToFraction;
// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.0.1
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1: add sulfate mass key ⚖️✈ in DATA init from epoch (proxy CCN, separate from dry-air mass)
// ============================================================================

// ============================================================================
// FONCTION HELPER : getLogo() et getLogoKey() sont maintenant dans alphabet.js
// On utilise window.getLogo et window.getLogoKey exposés par alphabet.js
// Accès direct (plantera si n'existe pas, comme demandé)

// ============================================================================
// VARIABLES GLOBALES D'ÉTAT
// ============================================================================

// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de variable globale
// Phase est dans DATA['🧮']['🧮⚧'], pas besoin de variable globale
// signeDeltaFirst est dans DATA['🧮']['🧮☯'], pas besoin de variable globale
// flux_entrant est calculé localement dans computeRadiativeTransfer, pas besoin de variable globale

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// CONST est maintenant centralisé dans physics.js
// Plus besoin d'initialisation ici, CONST sera créé une seule fois dans physics.js

//Récupère les états activés (utilise DATA directement)
function getEnabledStates() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;

    // Source unique : organigramme flux-button-cell (cell-co2, cell-methane, cell-h2o, cell-albedo-btn)
    const co2Cell = document.getElementById('cell-co2');
    const ch4Cell = document.getElementById('cell-methane');
    const h2oCell = document.getElementById('cell-h2o');
    const albedoCell = document.getElementById('cell-albedo-btn');

    DATA['🔘']['🔘💧📛'] = h2oCell ? h2oCell.classList.contains('checked') : true;
    DATA['🔘']['🔘🐄📛'] = ch4Cell ? ch4Cell.classList.contains('checked') : true;
    DATA['🔘']['🔘🏭📛'] = co2Cell ? co2Cell.classList.contains('checked') : true;
    DATA['🔘']['🔘🪩'] = albedoCell ? albedoCell.classList.contains('checked') : true;
    // Anim : source de vérité = DATA (bouton animation est normal, pas on/off)
    DATA['🔘']['🔘🎞'] = DATA['🔘']['🔘🎞'] != null ? DATA['🔘']['🔘🎞'] : false;
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les masses en tenant compte des événements (meteor, etc.) :: utilise DATA directement
function getMasses() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    //const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis TIMELINE avec l'index depuis DATA
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    // ⚖️💧 = valeur initiale + delta pending (météorites), consommé à chaque appel
    let h2o_kg = EPOCH['⚖️💧'] || 0;
    h2o_kg += (DATA['📜']['🔺⚖️💧'] || 0);

    // Mettre à jour DATA directement
    var isYearIndexedM = EPOCH['🕰'] && Object.keys(EPOCH['🕰']).some(function(k) { return !isNaN(Number(k)); });
    if (isYearIndexedM) {
        // 📱 year-indexed : ⚖️🏭 est la variable de référence unique
        // Initialiser depuis EPOCH au chargement (📿💫=0), sinon consommer le delta pending
        var ticCountM = (DATA['📜']['📿💫'] || 0);
        if (ticCountM === 0) {
            DATA['⚖️']['⚖️🏭'] = isFinite(EPOCH['⚖️🏭']) ? EPOCH['⚖️🏭'] : 0;
        }
        DATA['⚖️']['⚖️🏭'] += (DATA['📜']['🔺⚖️🏭'] || 0);
        DATA['📜']['🔺⚖️🏭'] = 0; // consommé
    } else {
        DATA['⚖️']['⚖️🏭'] = isFinite(EPOCH['⚖️🏭']) ? EPOCH['⚖️🏭'] : 0;
    }
    DATA['⚖️']['⚖️🐄'] = isFinite(EPOCH['⚖️🐄']) ? EPOCH['⚖️🐄'] : 0;
    DATA['⚖️']['⚖️💧'] = h2o_kg;
    DATA['⚖️']['⚖️🫁'] = isFinite(EPOCH['⚖️🫁']) ? EPOCH['⚖️🫁'] : 0;
    DATA['⚖️']['⚖️💨'] = isFinite(EPOCH['⚖️💨']) ? EPOCH['⚖️💨'] : 0;
    DATA['⚖️']['⚖️✈'] = isFinite(EPOCH['⚖️✈']) ? EPOCH['⚖️✈'] : 0;

    // ⚖️🫧 = masse atmosphérique totale (air sec)
    if (EPOCH['⚖️🫧'] !== undefined && isFinite(EPOCH['⚖️🫧'])) {
        DATA['⚖️']['⚖️🫧'] = EPOCH['⚖️🫧'];
        if (!isFinite(EPOCH['⚖️💨']) || EPOCH['⚖️💨'] === undefined) {
            DATA['⚖️']['⚖️💨'] = Math.max(0, DATA['⚖️']['⚖️🫧'] - (DATA['⚖️']['⚖️🏭'] + DATA['⚖️']['⚖️🐄'] + DATA['⚖️']['⚖️🫁']));
        }
    } else {
        DATA['⚖️']['⚖️🫧'] = DATA['⚖️']['⚖️🏭'] + DATA['⚖️']['⚖️🐄'] + DATA['⚖️']['⚖️🫁'] + DATA['⚖️']['⚖️💨'];
    }

    // Retourner true car DATA a été modifié
    return true;
}

//Récupère la configuration de l'époque (utilise DATA directement)
function getEpochDateConfig() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    
    // Masse d'eau par météorite — depuis config ☄️ (Corps noir, Hadéen)
    // ⚠️ Ne pas écraser 📿💫 — compteur de temps exclusif des boutons
    if (EPOCH['🕰'] && EPOCH['🕰']['☄️']) {
        DATA['📜']['🔺⚖️💧☄️'] = EPOCH['🕰']['☄️']['🔺⚖️💧☄️'];
    }

    // Delta température et flux géothermique par TicTime — depuis config 💫
    let deltaTicTime_per_tic = 0;
    if (EPOCH['🕰'] && EPOCH['🕰']['💫']) {
        deltaTicTime_per_tic = EPOCH['🕰']['💫']['🔺🌡️💫'];
        const star = EPOCH['🕰']['💫']['🔺🧲🌕💫'];
        DATA['📜']['🔺🧲🌕💫'] = star ? { '▶': star['▶'], '◀': star['◀'] } : { '▶': 0, '◀': 0 };
    } else {
        DATA['📜']['🔺🧲🌕💫'] = { '▶': 0, '◀': 0 };
    }

    // Mettre à jour DATA directement (source unique de vérité)
    DATA['📜']['🌡️🧮'] = EPOCH['🌡️🧮'];
    DATA['📅']['🌡️🧮'] = EPOCH['🌡️🧮'];                  // Température attendue de l'époque
    DATA['📜']['🔺🌡️💫'] = deltaTicTime_per_tic;          // Delta température / ticTime
    DATA['📜']['🧲🔬'] = (typeof EPOCH['🧲🔬'] === 'number' && Number.isFinite(EPOCH['🧲🔬'])) ? EPOCH['🧲🔬'] : 0.01;
    DATA['📜']['👉'] = epochIndex;
    DATA['📜']['🗿'] = epochId;

    // 🔒 Date courante en années (pour Gough dans getSoleil)
    // 📿💫 = compteur de temps universel (géologique ET 📱)
    var deltaYearsFromTics = 0;
    var ticCount = (DATA['📜']['📿💫'] != null && Number.isFinite(DATA['📜']['📿💫'])) ? DATA['📜']['📿💫'] : 0;
    if (EPOCH['🕰'] && typeof EPOCH['🕰'] === 'object') {
        // Détecter format year-indexed (📱) vs géologique (💫/☄️)
        var isYearIndexedE = Object.keys(EPOCH['🕰']).some(function(k) { return !isNaN(Number(k)); });
        if (isYearIndexedE) {
            // 📱 : extraire 🔺⏳ du premier bouton du premier bucket année
            var firstYrKey = Object.keys(EPOCH['🕰']).filter(function(k) { return !isNaN(Number(k)); }).sort(function(a,b){return a-b;})[0];
            var firstActions = EPOCH['🕰'][firstYrKey];
            var dtMa = 0.000025; // fallback
            if (firstActions) {
                var fak = Object.keys(firstActions)[0];
                if (firstActions[fak] && typeof firstActions[fak]['🔺⏳'] === 'number') dtMa = firstActions[fak]['🔺⏳'];
            }
            deltaYearsFromTics = ticCount * dtMa * 1e6;
        } else {
            // Géologique : itérer les clés tic string (💫, ☄️…) — 📿💫 porte tout
            for (var tk of Object.keys(EPOCH['🕰'])) {
                if (tk === '🔀' || tk === '◀') continue;
                var cfg = EPOCH['🕰'][tk];
                if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                    deltaYearsFromTics += ticCount * cfg['🔺⏳'] * 1e6;
                    break; // 📿💫 est le seul compteur
                }
            }
        }
    }
    // Detect time direction: geological = backward (▶ > ◀), modern = forward (▶ < ◀)
    var epochEnd = (typeof EPOCH['◀'] === 'number' && Number.isFinite(EPOCH['◀'])) ? EPOCH['◀'] : null;
    var isForwardTime = (EPOCH['▶'] != null && epochEnd != null && EPOCH['▶'] < epochEnd);
    DATA['📜']['📅'] = (EPOCH['▶'] != null)
        ? (isForwardTime ? (EPOCH['▶'] || 0) + deltaYearsFromTics : (EPOCH['▶'] || 0) - deltaYearsFromTics)
        : 0;

    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();

    // Log CO₂ courant pour époques forward (📱 year-indexed ou autre)
    if (isForwardTime && DATA['⚖️'] && DATA['⚖️']['⚖️🫧'] > 0) {
        var ppm_approx = Math.round(
            (DATA['⚖️']['⚖️🏭'] * 0.029 / (DATA['⚖️']['⚖️🫧'] * 0.04401)) * 1e6
        );
        window._co2ProfileLog = '[⚖️🏭] ' + Math.round(DATA['📜']['📅'] || 0)
            + ' CE → ' + DATA['⚖️']['⚖️🏭'].toExponential(3)
            + ' kg (~' + ppm_approx + ' ppm)';
        window._co2ProfileLogInjected = false;
    }

    // Retourner true car DATA a été modifié
    return true;
}

// 🔒 FORMULE DE GOUGH (1981), Solar Physics 74:21
// L(t_ago) = L_SUN / (1 + 0.4 × t_ago_Ga / T_SUN_GA)
// NE PAS REMPLACER PAR UNE INTERPOLATION LINÉAIRE.
var GOUGH_L_SUN_W = 3.828e26;  // IAU 2015 Resolution B3
var GOUGH_T_SUN_GA = 4.57;     // Âge du Soleil en Ga
var GOUGH_COEFF = 0.4;         // Coefficient d'évolution (homologie stellaire H→He)

function goughLuminosity(t_ago_years) {
    var t_ago_Ga = t_ago_years / 1e9;
    return GOUGH_L_SUN_W / (1 + GOUGH_COEFF * t_ago_Ga / GOUGH_T_SUN_GA);
}

//Calcule les valeurs du soleil depuis la date courante via Gough (1981)
function getSoleil() {
    const DATA = window.DATA;
    if (!DATA || !DATA['📜']) throw new Error('getSoleil: DATA ou DATA[📜] manquant — getEpochDateConfig() non appelé ?');
    const dateYears = DATA['📜']['📅'];
    if (dateYears == null || !Number.isFinite(dateYears)) throw new Error('getSoleil: DATA[📜][📅] invalide (' + dateYears + ') — getEpochDateConfig() doit stocker la date en années');
    const P_watts = goughLuminosity(dateYears);
    if (!DATA['☀️']) DATA['☀️'] = {};
    DATA['☀️']['🔋☀️'] = P_watts;
    DATA['☀️']['🧲☀️'] = P_watts / (4 * Math.PI * CONV.AU_M * CONV.AU_M);
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    return true;
}

//Calcule les valeurs du noyau géothermique (utilise DATA directement)
function getNoyau() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    if (!DATA || !DATA['📜']) throw new Error('getNoyau: DATA ou DATA[📜] manquant — getEpochDateConfig() non appelé ?');
    if (!window.TIMELINE) throw new Error('getNoyau: window.TIMELINE manquant — configTimeline.js non chargé ?');
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = epochIndex >= 0 ? window.TIMELINE[epochIndex] : null;
    if (!EPOCH) throw new Error('getNoyau: époque "' + epochId + '" introuvable dans TIMELINE');
    if (!DATA['🌕']) DATA['🌕'] = {};
    // Flux géothermique en W/m² (depuis TIMELINE)
    if (EPOCH['🕰'] && EPOCH['🕰']['💫'] && EPOCH['🕰']['💫']['🔺🧲🌕💫']) {
        const geo = EPOCH['🕰']['💫']['🔺🧲🌕💫'];
        const tic = DATA['📜']['📿💫'];
        const durationMa = EPOCH['🕰']['💫']['🔺⏳'];
        const spanYears = Math.max(0, (EPOCH['▶'] || 0) - (EPOCH['◀'] || 0));
        const maxTics = durationMa > 0 && spanYears > 0 ? Math.max(1, Math.floor((spanYears / 1e6) / durationMa)) : 1;
        const f = Math.min(1, tic / maxTics);
        DATA['🌕']['🧲🌕'] = (geo['▶'] != null && geo['◀'] != null) ? geo['▶'] + f * (geo['◀'] - geo['▶']) : (geo['▶'] != null ? geo['▶'] : EPOCH['🧲🌕']);
    } else if (EPOCH['🧲🌕'] !== undefined) {
        // Flux directement dans l'époque (ex: Hadéen)
        DATA['🌕']['🧲🌕'] = EPOCH['🧲🌕'];
    } else {
        // Calculer depuis la puissance du noyau si disponible
        if (EPOCH['🔋🌕'] !== undefined) {
            const planet_radius_m = EPOCH['📐'] * 1000;
            const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
            DATA['🌕']['🧲🌕'] = surface_area > 0 ? EPOCH['🔋🌕'] / surface_area : 0.087;
        } else {
            // Valeur par défaut moderne : ~0.087 W/m²
            DATA['🌕']['🧲🌕'] = 0.087;
        }
    }
    
    // Puissance totale du noyau (en Watts) - depuis 🔋🌕
    DATA['🌕']['🔋🌕'] = EPOCH['🔋🌕'];
    
    // console.log(`🌕 [getNoyau@compute.js]`);
    // console.log(`noyau=${JSON.stringify(DATA['🌕'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
var COMPUTE = window.COMPUTE = window.COMPUTE || {};
COMPUTE.getEpochDateConfig = getEpochDateConfig;
COMPUTE.getDateConfig = getEpochDateConfig;
COMPUTE.getMasses = getMasses;
COMPUTE.getEnabledStates = getEnabledStates;
COMPUTE.getSoleil = getSoleil;
COMPUTE.getNoyau = getNoyau;
window.getEpochDateConfig = getEpochDateConfig;
window.getDateConfig = getEpochDateConfig;
window.getMasses = getMasses;
window.getEnabledStates = getEnabledStates;
window.getSoleil = getSoleil;
window.getNoyau = getNoyau;
// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de window.T0
// getLogo et getLogoKey sont exposés par alphabet.js

