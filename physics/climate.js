// ============================================================================
// File: API_BILAN/physics/climate.js - Forçages radiatifs (convention affichage) et climatologie
// Desc: ΔF = diagnostic conventionnel (terrestre / contemporain), pas utilisé pour le calcul de T. EDS/OLR = physique (calculations.js).
// Version 1.1.0
// Date: [October 10, 2026]
// logs :
// - v1.1.0: PAS DE GARDES. L'albédo de référence « de l'époque » (GEOLOGY.getGeologicalPeriodByName(...).albedo_base)
//   n'a jamais existé : la recherche rendait un objet sans albedo_base, la référence valait toujours 0,3. Elle est
//   maintenant ce qu'elle était en fait : ALBEDO_REF = 0,3, sans détour. Tests `<= 0` / `null` / `< 1e-6` retirés
//   (max(C, C₀) les couvre ; le moteur passe toujours un albédo). ⚠️ T_eff et ΔF albédo utilisent le Soleil
//   ACTUEL (CONST.SOLAR_CONSTANT) quelle que soit l'époque — diagnostic d'affichage à revoir.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

// Convention ΔF CO₂ (Myhre 1998, IPCC) — affichage uniquement, pas de calcul T.
// ΔF = α×ln(C/C₀) : diagnostic relatif à une référence, concept terrestre/contemporain.
const CONVENTION_CO2_FORCING_COEFF = 5.35;  // W/m². Plage lit. 4.0–6.5.
const CONVENTION_CO2_REF_PPM = 280;         // ppm pré-ind. (C₀). Convention IPCC.
// Albédo de référence des diagnostics T_eff et ΔF albédo (Terre moderne, ~0,3).
const ALBEDO_REF = 0.3;

// Constantes climatiques = window.CONST (physics.js) : STEFAN_BOLTZMANN, SOLAR_CONSTANT, TEMP_HABITABLE_*
// Température de référence sans effet de serre (T_eff)
// ⚠️ NE PAS HARDCODER 255K ! Cela dépend de l'albedo et de l'intensité solaire
// Sera calculé dynamiquement via la fonction getEffectiveTemperatureNoGreenhouse()
// const TEMP_REF_NO_CO2 = 255.0; // DEPRECATED

// Fonction pour obtenir la température effective sans effet de serre
// T_eff = (S * (1 - A) / 4σ)^(1/4)
function getEffectiveTemperatureNoGreenhouse() {
    const CONST = window.CONST;
    const flux_absorbed = (CONST.SOLAR_CONSTANT / 4) * (1 - ALBEDO_REF);
    return Math.pow(flux_absorbed / CONST.STEFAN_BOLTZMANN, 0.25);
}

// ΔF CO₂ (convention affichage) : ΔF = α×ln(C/C₀). Pas utilisé pour T finale.
function calculateCO2Forcing(CO2_fraction) {
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
// - Référence : ALBEDO_REF (0,3)
// - Si albedo augmente, le forçage est négatif (refroidissement)
// - Si albedo diminue, le forçage est positif (réchauffement)
function calculateAlbedoForcing(albedo) {
    // ΔF_albedo = -S/4 * (A - A_ref) : négatif si l'albédo augmente (refroidissement).
    return -(window.CONST.SOLAR_CONSTANT / 4) * (albedo - ALBEDO_REF); // W/m²
}

// Namespace window.CLIMATE : forcings globaux (CO2, CH4, H2O, albedo) + T_effective sans effet de serre.
var CLIMATE = window.CLIMATE = {};
CLIMATE.getEffectiveTemperatureNoGreenhouse = getEffectiveTemperatureNoGreenhouse;
CLIMATE.calculateCO2Forcing = calculateCO2Forcing;
CLIMATE.calculateCH4Forcing = calculateCH4Forcing;
CLIMATE.calculateH2OForcing = calculateH2OForcing;
CLIMATE.calculateAlbedoForcing = calculateAlbedoForcing;

