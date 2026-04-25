// ============================================================================
// File: API_BILAN/h2o/calculations_h2o.js - Calculs H2O (vapeur et nuages)
// Desc: Séparation vapeur d'eau (effet de serre) et nuages (albedo)
// Version 1.0.24
// Date: [April 25, 2026]
// logs :
// - v1.0.24: miroir debugMirrorConfigLogToFile — logIrisDiagnostic → iris.txt, logEdsDiagnostic (cap H2O) → eds.txt
// - v1.0.23: verrou lockIceInSolver supprimé (user: "virer le verrou tout le temps"). Plus de branche `if (lockIceInSolver)` figeant 🍰💧🧊/🍰💧🌊 en Search/Dicho : la glace suit désormais 🧮🌡️ à chaque pas (même branches qu'en Init). Conséquence : le feedback T→glace opère dans le scan hystérésis ⛄ (fix figeage 🍰💧🧊=0.006). Le pilotage temporalité millénaire est assuré en amont par calculations_albedo.js v1.2.53 (blend dt via CONFIG_COMPUTE.iceBlendRelaxation01).
// - v1.0.22: (doc-only relais) physics.js v2.0.15 — EARTH.computeIceTempFactor intègre désormais 3 zones (pol+mid+trop). h2o utilise uniquement `_iceTF_h2o.tf_pol` (cap calottes polaires 10%), inchangé. Le passage à 3 zones n'affecte donc pas ce module. Bloc gel océan (T < T_FREEZE) toujours géré ici.
// - v1.0.21: (obsolète marker v1.0.20 remplaçait en place)
// - v1.0.20: polar_ice_fraction_climate UNIFIÉ avec albedo v1.2.48 / flux v1.2.91 — formule 3-zones ancrée sur T_FREEZE_SEAWATER + dT_pol (EARTH.POLAR_AMP_POL_K). Remplace l'ancien seuil T_NO_POLAR_ICE_K = 293 K (seuil GLOBAL traité à tort comme seuil LOCAL). Bloc gel océan (T < T_FREEZE) inchangé. Pas d'override par époque.
// - v1.0.19: expositions fonctions regroupées sous window.H2O (plus de window.foo isolés). Clés ajoutées au namespace : calculateH2OGreenhouseForcing, calculateCloudAlbedoContribution, calculateWaterPartition, calculatePrecipitationFeedback, getBoilingPointKFromPressure. Appelants migrés window.foo() → H2O.foo() dans calculations_flux.js, radiative/calculations.js, ui/main.js, CO2/html/*.html.
// - v1.0.18: deltaTAccelerationDays lu depuis window.CONFIG_COMPUTE (source unique configTimeline.js v1.4.13). Retrait DATA['🎚️'].SOLVER.
// - v1.0.17: DELTA_T_ACCELERATION_DAYS lu depuis window.DATA['🎚️'].SOLVER (source unique, clonée depuis window.DEFAULT.TUNING.SOLVER par initDATA.js v1.1.0). Fin de window.TUNING.
// - v1.0.16: DELTA_T_ACCELERATION_DAYS lu depuis window.TUNING.SOLVER (source unique, fin DATA['🎚️'].SOLVER).
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
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
// - v1.0.15 : cap vapeur log → pdTrace
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
    //const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const STATE = window.STATE;
    const ALBEDO = window.ALBEDO;

    if (DATA['⚖️']['⚖️🫧'] == 0) {
        DATA['💧']['🍰🧮🌧'] = 0;
        DATA['💧']['🍰🫧💧'] = 0;
        if (DATA['⚖️']['⚖️💧'] <= 0) {
            DATA['💧']['🍰💧🧊'] = 0;
            DATA['💧']['🍰💧🌊'] = 0;
            return true;
        }else
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
    // Deux régimes :
    //   T_glob >= T_freeze_seawater : glace polaire sur hautes terres (calottes classiques)
    //   T_glob <  T_freeze_seawater : l'océan gèle → glace = highlands + surface océanique gelée
    //
    // v1.0.21 — FONCTION UNIQUE EARTH.computeIceTempFactor(T_glob, opts) — cf. physics.js.
    // Obliquité ε : lue sur l'objet epoch ('⚾'), sinon fallback CONFIG_COMPUTE.obliquityDeg (23.44°).
    // Cap à 10 % (fraction massique d'eau piégée en calottes polaires).
    const _EPOCH_h2o = window.TIMELINE && window.TIMELINE[DATA['📜'] && DATA['📜']['👉']];
    const _epochObliquity_h2o = (_EPOCH_h2o && Number.isFinite(Number(_EPOCH_h2o['⚾']))) ? Number(_EPOCH_h2o['⚾']) : undefined;
    // EPOCH['🥶'] : override per-époque des paramètres ice (cf. calculations_albedo.js v1.2.50).
    const _epochIce_h2o = (_EPOCH_h2o && _EPOCH_h2o['🥶'] && typeof _EPOCH_h2o['🥶'] === 'object') ? _EPOCH_h2o['🥶'] : null;
    const _iceOpts_h2o = {};
    if (_epochObliquity_h2o !== undefined) _iceOpts_h2o.obliquity_deg = _epochObliquity_h2o;
    if (_epochIce_h2o) {
        if (Number.isFinite(Number(_epochIce_h2o.dT_pol)))   _iceOpts_h2o.dT_pol   = Number(_epochIce_h2o.dT_pol);
        if (Number.isFinite(Number(_epochIce_h2o.dT_mid)))   _iceOpts_h2o.dT_mid   = Number(_epochIce_h2o.dT_mid);
        if (Number.isFinite(Number(_epochIce_h2o.dT_trop)))  _iceOpts_h2o.dT_trop  = Number(_epochIce_h2o.dT_trop);
        if (Number.isFinite(Number(_epochIce_h2o.amp_pol)))  _iceOpts_h2o.amp_pol  = Number(_epochIce_h2o.amp_pol);
        if (Number.isFinite(Number(_epochIce_h2o.amp_mid)))  _iceOpts_h2o.amp_mid  = Number(_epochIce_h2o.amp_mid);
        if (Number.isFinite(Number(_epochIce_h2o.amp_trop))) _iceOpts_h2o.amp_trop = Number(_epochIce_h2o.amp_trop);
    }
    const _iceTF_h2o = EARTH.computeIceTempFactor(
        DATA['🧮']['🧮🌡️'],
        Object.keys(_iceOpts_h2o).length > 0 ? _iceOpts_h2o : undefined
    );
    const has_polar_ice = _iceTF_h2o.tf_pol > 0;
    const polar_ice_fraction_climate = 0.10 * _iceTF_h2o.tf_pol;

    let polar_ice_fraction;
    if (DATA['🧮']['🧮🌡️'] >= EARTH.T_FREEZE_SEAWATER_K) {
        // Régime classique : calottes polaires limitées aux hautes terres
        polar_ice_fraction = Math.min(DATA['🗻']['🍰🗻🏔'], polar_ice_fraction_climate);
    } else {
        // Régime gel océan : proportion gelée croît linéairement sous T_freeze (~271 K)
        // À T_freeze - 20 K (~251 K) → 100% de la surface supportable est gelée
        // Surface supportable = max(highlands, hydrosphère) — hydrosphère = couche eau globale / 10m, cap 0.9
        const planet_surface_m2 = 4 * Math.PI * Math.pow((DATA['📜']['📐'] || 6371) * 1000, 2);
        const hydro_support = Math.max(0, Math.min(0.9,
            (DATA['⚖️']['⚖️💧'] > 0 ? (DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / planet_surface_m2 : 0) / 10));
        const max_ice_surface = Math.max(DATA['🗻']['🍰🗻🏔'], hydro_support);
        polar_ice_fraction = max_ice_surface * Math.max(0, Math.min(1,
            (EARTH.T_FREEZE_SEAWATER_K - DATA['🧮']['🧮🌡️']) / 20));
    }
    
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
    
    // v1.0.23 : verrou glace d'époque supprimé (user: "virer le verrou tout le temps").
    //           Plus de lockIceInSolver — la glace suit 🧮🌡️ à chaque pas, comme en Init, ce
    //           qui permet au feedback T→glace d'opérer dans le scan hystérésis ⛄.
    //           Le blend dt (échelle millénaire) est géré en amont par calculations_albedo.js
    //           v1.2.54 via CONFIG_COMPUTE.iceInertiaFactor01 (exp : tau_eff = tau × factor,
    //           fraction_fonte = 1 − exp(−dt/tau_eff)).
    const lockIceInSolver = false; // [v1.0.23] conservé pour compat transition v1.0.22
    if (DATA['🧮']['🧮🌡️'] < T_freeze_adjusted) {
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
    // [OBS/CALIB] Cap vapeur Clausius-Clapeyron exponentiel (ERA5/AIRS). Ne tombe jamais à zéro.
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
        DATA['📅']['🔺⏳'] = use_acceleration ? CONV.SECONDS_PER_DAY * window.CONFIG_COMPUTE.deltaTAccelerationDays : CONV.SECONDS_PER_DAY;
        
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

    // Limite dynamique réaliste observée Clausius-Clapeyron (AIRS/ERA5) sur la vapeur finale Init.
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
    // [OBS/CALIB] Cap vapeur Clausius-Clapeyron exponentiel (ERA5/AIRS). Ne tombe jamais à zéro.
    const c_c_max = EARTH.H2O_VAPOR_CAP_REF * Math.exp(EARTH.H2O_VAPOR_CAP_RATE_PER_K * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF));
    // [EQ] Fermeture numérique : vapeur effective = min(cap_obs_dynamique, contrainte thermodynamique, eau disponible).
    let vapor_result = Math.min(c_c_max, vapor_raw);
    // [OBS/CALIB] Feedback Iris (EARTH.IRIS_*). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025.
    const iris_factor_raw = 1.0 + EARTH.IRIS_STRENGTH * (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.IRIS_T_SCALE_K;
    const iris_factor = Math.max(EARTH.IRIS_FACTOR_MIN, iris_factor_raw);
    vapor_result = vapor_result / iris_factor;
    if (window.CONFIG_COMPUTE.logIrisDiagnostic) {
        const mIris = '[Iris] T=' + (T - CONST.KELVIN_TO_CELSIUS).toFixed(1)
            + 'C iris_factor=' + iris_factor.toFixed(3)
            + ' vapor=' + vapor_result.toFixed(5);
        console.log(mIris);
        if (typeof window.debugMirrorConfigLogToFile === 'function') {
            window.debugMirrorConfigLogToFile('logIrisDiagnostic', mIris);
        }
    }
    // Log cap vapeur (bruyant) : ne log que si logEdsDiagnostic est activé.
    if (vapor_raw > c_c_max && window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
        const T_C = T - CONST.KELVIN_TO_CELSIUS;
        const mCap = 'H2O cap @' + T_C.toFixed(1) + '°C';
        if (typeof window !== 'undefined' && typeof window.pdTrace === 'function') {
            window.pdTrace('calculateH2OParameters', 'calculations_h2o.js', mCap);
            if (typeof window.debugMirrorConfigLogToFile === 'function') {
                window.debugMirrorConfigLogToFile('logEdsDiagnostic', mCap);
            }
        } else {
            const line = '[cycle] ' + mCap;
            console.log(line);
            if (typeof window.debugMirrorConfigLogToFile === 'function') {
                window.debugMirrorConfigLogToFile('logEdsDiagnostic', line);
            }
        }
    }
    DATA['💧']['🍰🫧💧'] = vapor_result;

    calculateWaterPartition();
    ATM.calculateMolarMassAir();
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();
    H2O._lastH2OParamsCache = { T, P };
    return true;
};
// Toutes les fonctions exposées passent par le namespace window.H2O (source unique).
H2O.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
H2O.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
H2O.calculateWaterPartition = calculateWaterPartition;
H2O.calculatePrecipitationFeedback = calculatePrecipitationFeedback;
H2O.getBoilingPointKFromPressure = getBoilingPointKFromPressure;
