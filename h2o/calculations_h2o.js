// ============================================================================
// File: API_BILAN/h2o/calculations_h2o.js - Calculs H2O (vapeur et nuages)
// Desc: Séparation vapeur d'eau (effet de serre) et nuages (albedo)
// Version 1.4.4
// - v1.4.4 (2026-10-30): glace de mer latitude par latitude (épaisseur moyenne de la glace présente de chaque bande).
// - v1.4.3 (2026-10-29): glace de mer à la part gelée de l'année de la glace saisonnière de chaque bande (🪩.🍰📅🧊, celle de
//   physics/saisons.js), la même que son aire et son albédo.
// Date: [October 30, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
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
    // IAPWS (Wagner & Pruss 2002 ; glace : Wagner et al. 2011) — physics.js. +∞ au-delà du point critique.
    return window.PHYS.pSatEau(window.DATA['🧮']['🧮🌡️']);
}

// Point d'ébullition de l'eau à la pression totale P [atm] : la saturation IAPWS inversée. Au-delà de la pression
// critique (218 atm), l'eau ne bout plus : elle passe continûment au fluide supercritique (T_c).
// Réf : Wagner & Pruß 2002, J. Phys. Chem. Ref. Data 31:387 — doc/equation.html#eq-pression-vapeur-saturante-eau
function getBoilingPointKFromPressure(P_atm) {
    const P_Pa = P_atm * CONV.STANDARD_ATMOSPHERE_PA;
    return P_Pa >= window.PHYS.EAU.P_C ? window.PHYS.EAU.T_C : window.PHYS.tSatEau(P_Pa);
}

/**
 * Pas d'océan possible (PHYS.eauSansLiquide) : TOUTE l'eau est en vapeur. Fraction massique d'air humide
 * w = ⚖️💧 / (⚖️💧 + ⚖️🫧) (⚖️🫧 = air sec) ; ni liquide, ni glace, ni pluie. L'humidité relative de surface,
 * l'effet « Iris » et les précipitations sont des paramétrisations d'un monde à océan : elles ne s'appliquent pas.
 */
function poserToutVapeur() {
    const DATA = window.DATA;
    const m = DATA['⚖️'];
    const w = m['⚖️💧'] / (m['⚖️💧'] + m['⚖️🫧']);
    DATA['💧']['🍰🫧💧'] = w;
    partagerEau(0, m['⚖️💧']);
    DATA['💧']['🧲⚖️💦'] = 0;
    DATA['🫧']['🍰🫧🏭'] = m['⚖️🏭'] / m['⚖️🫧'] * (1 - w);
    DATA['🫧']['🍰🫧🐄'] = m['⚖️🐄'] / m['⚖️🫧'] * (1 - w);
    DATA['🫧']['🍰🫧🫁'] = m['⚖️🫁'] / m['⚖️🫧'] * (1 - w);
    DATA['🫧']['🍰🫧✈'] = m['⚖️✈'] / m['⚖️🫧'] * (1 - w);
    DATA['🫧']['🍰🫧💨'] = m['⚖️💨'] / m['⚖️🫧'] * (1 - w);
    window.ATM.calculatePressureAtm();
    window.ATM.calculateMolarMassAir();
    const P = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    const p_sat = calculateSaturatedVaporPressure();
    const x_v = (w / window.CONST.M_H2O) * DATA['🫧']['🧪'];   // fraction molaire de vapeur
    DATA['💧']['🍰🧪🌧'] = Math.min(1, p_sat / P);                // fraction molaire maximale (1 : aucune limite)
    DATA['💧']['🍰🌧💧'] = x_v * P / p_sat;                       // humidité relative (0 au-delà du point critique)
    calculateH2OGreenhouseForcing();
    window.H2O._lastH2OParamsCache = null;
}

/**
 * Partage de l'eau totale ⚖️💧 entre glace, vapeur et liquide : la SEULE écriture de 🍰💧🧊 et 🍰💧🌊 (parts MASSIQUES de ⚖️💧).
 * masseGlace, masseVapeur [kg] ; le liquide est le reste : 🍰💧🧊 + 🍰💧🌊 + vapeur/⚖️💧 = 1. Sans eau, il n'y a rien à partager.
 */
function partagerEau(masseGlace, masseVapeur) {
    const DATA = window.DATA, W = DATA['⚖️']['⚖️💧'];
    if (W === 0) {
        DATA['💧']['🍰💧🧊'] = 0;
        DATA['💧']['🍰💧🌊'] = 0;
        return;
    }
    const liquide = 1 - (masseGlace + masseVapeur) / W;
    if (liquide < -1e-9) throw new Error('[H2O.partagerEau] glace (' + masseGlace.toExponential(3) + ' kg) + vapeur (' + masseVapeur.toExponential(3)
        + ' kg) > eau totale ⚖️💧 (' + W.toExponential(3) + ' kg)');
    DATA['💧']['🍰💧🧊'] = masseGlace / W;
    DATA['💧']['🍰💧🌊'] = Math.max(0, liquide);   // borné à 0 : l'arrondi seul peut le rendre négatif (contrôlé ci-dessus)
}

/** Monde à océan : de l'eau liquide possible (PHYS.eauSansLiquide faux) et une atmosphère (masse d'air sec ⚖️🫧, masse molaire,
 *  pression). C'est le régime où calculateWaterPartition ne pose pas la glace : calculateAlbedo la pose, après le bilan méridien qui
 *  donne la glace de mer et les calottes (masse des calottes du pas, 🗻.🧮⚖️🗻🧊) ; hors de lui, il n'y a ni mer, ni calotte
 *  (physics/calottes.js), ni forêt (calculateAlbedo), et la glace ne fond pas (EARTH.glaceSaisonniere). La seule définition. */
function mondeOcean() {
    const DATA = window.DATA;
    return !window.PHYS.eauSansLiquide() && DATA['⚖️']['⚖️🫧'] > 0 && DATA['🫧']['🧪'] > 0 && DATA['🫧']['🎈'] > 0;
}

/**
 * [kg] Glace de mer de l'état : Σ_bandes ρ_i × (mer libre de la bande) × g × h, g = part de l'année où la mer de la bande est gelée
 * (DATA['🪩']['🍰📅🧊'][bande].mer, glace saisonnière de l'état : celle de physics/saisons.js, qui donne aussi l'aire et l'albédo de
 * la glace de mer, moyenne des t_i de ses latitudes) et h = épaisseur de Stefan √(2 k_i FDD_i / (ρ_i L_f)) de chaque latitude,
 * moyennée sur la glace présente (poids t_i ; saisons : boîtes de l'état, SAISONS.cycles) : g h = moyenne des t_i h_i. Mer libre de la bande : MERIDIEN.surfacesBandes (terre émergée de PALEOGEO à la date, calotte du pas posée sur
 * le plateau continental prise à la mer) ; aire de la bande : CALOTTES.aireBande.
 * ⚠️ DÉCLARÉ : l'épaisseur de fin de saison de gel est tenue sur toute la part gelée de l'année (borne haute d'une glace saisonnière) ;
 * une glace pérenne n'a que l'épaisseur d'une année de Stefan (borne basse : elle s'épaissit d'année en année).
 * Réf : Stefan 1891, Ann. Phys. Chem. 42:269 — doc/equation.html#eq-mer-gelee
 */
function masseGlaceMer(saisons) {
    const S = window.MERIDIEN.surfacesBandes(), g = window.DATA['🪩']['🍰📅🧊'];
    let m = 0;
    for (const b of window.CALOTTES.BANDES) {
        m += window.CONST.RHO_GLACE * window.CALOTTES.aireBande(b) * S[b.cle].mer * g[b.cle].mer * saisons[b.cle].h_glace;
    }
    return m;
}

//Calcule la fraction volumique maximale de vapeur d'eau à saturation
function calculateMaxH2OVaporFraction() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    DATA['💧']['🍰🧪🌧'] = Math.min(P_sat / P_total, 1.0);
    
    return true;
}

// Calcule 🔺📛💧 = ΔF H₂O (W/m²), effet changement q_ref→q. Pas part EDS (🧲📛💧).
function calculateH2OGreenhouseForcing() {
    const DATA = window.DATA;
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

//Calcule la répartition eau vapeur / liquide / glace selon les conditions physiques. Régimes : tout vapeur (pas de liquide possible),
// monde à océan (mondeOcean : glace et liquide posés par calculateAlbedo), corps noir / sans atmosphère (ici).
function calculateWaterPartition() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const ALBEDO = window.ALBEDO;

    if (window.PHYS.eauSansLiquide()) { poserToutVapeur(); return true; }

    ALBEDO.calculateGeologySurfaces();

    if (mondeOcean()) {
        // La vapeur 🍰🫧💧 est celle de calculatePrecipitationFeedback / calculateH2OParameters(WithIteration), préservée ici ;
        // glace et liquide (🍰💧🧊, 🍰💧🌊) sont posés par calculateAlbedo (partagerEau), après le bilan méridien qui donne la glace
        // de mer de l'état. Ici : saturation et parts de l'air sec.
        const P_sat = calculateSaturatedVaporPressure();
        const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
        DATA['💧']['🍰🧪🌧'] = Math.min(P_sat / P_total, 1.0);   // fraction molaire maximale
        // 🔒 RENORMALISATION : les fractions de l'air sec, recalculées depuis les masses (pas d'accumulation d'erreurs), sont
        // multipliées par (1 − 🍰🫧💧) pour que la somme totale fasse 1.
        const dry_air_fraction = 1.0 - DATA['💧']['🍰🫧💧'];
        DATA['🫧']['🍰🫧🏭'] = (DATA['⚖️']['⚖️🏭'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧🐄'] = (DATA['⚖️']['⚖️🐄'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧🫁'] = (DATA['⚖️']['⚖️🫁'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧✈'] = (DATA['⚖️']['⚖️✈'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        DATA['🫧']['🍰🫧💨'] = (DATA['⚖️']['⚖️💨'] / DATA['⚖️']['⚖️🫧']) * dry_air_fraction;
        return true;
    }

    // Sans atmosphère : pas de vapeur.
    DATA['💧']['🍰🧪🌧'] = 0;
    DATA['💧']['🍰🫧💧'] = 0;
    // Pas d'atmosphère : la masse d'air sec ⚖️🫧, posée depuis les masses de l'époque par COMPUTE.getMasses (appelé en tête de
    // calculateH2OParameters), est nulle.
    if (DATA['⚖️']['⚖️🫧'] === 0) {
        // Corps noir (ou sans atmosphère) avec eau météorites : glace si T < 0°C, stock borné + lié à ⚖️💧 (didactique)
        if (DATA['⚖️']['⚖️💧'] > 0 && DATA['🧮']['🧮🌡️'] < CONST.T0_WATER) {
            const M_ref = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
            const cap = window.CONFIG_COMPUTE.noAtmosphereMeteoriteIceCap01;
            const perPAL = window.CONFIG_COMPUTE.noAtmosphereMeteoriteIcePerPAL;
            const pal = M_ref > 0 ? DATA['⚖️']['⚖️💧'] / M_ref : 0;
            partagerEau(Math.min(cap, pal * perPAL) * DATA['⚖️']['⚖️💧'], 0);
        } else {
            partagerEau(0, 0);
        }
        window.RUNTIME_STATE.h2oIceFractionFromCalculation = DATA['💧']['🍰💧🧊'];
        return true;
    }
    // Masse d'air sans masse molaire ou sans pression : toute l'eau est glace sous 0 °C, liquide (océan) au-dessus.
    partagerEau(DATA['🧮']['🧮🌡️'] < CONST.T0_WATER ? DATA['⚖️']['⚖️💧'] : 0, 0);
    return true;
}

// 🔒 FONCTION : Feedback précipitation (appelée dans la boucle externe)
// Calcule 🍰🌧💧, 💭☔, 🧲⚖️💦, puis met à jour 🍰🫧💧 (la pluie retourne à l'eau de surface : partagerEau la compte dans le reste)
function calculatePrecipitationFeedback() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const ALBEDO = window.ALBEDO;

    // 1. Calculer 🍰🌧💧, 💭☔, 🧲⚖️💦 (via calculateCloudFormationIndex)
    ALBEDO.calculateCloudFormationIndex();
    if (window.PHYS.eauSansLiquide()) { DATA['💧']['🧲⚖️💦'] = 0; return; }   // aucune pluie sans liquide possible
    
    const relative_humidity = DATA['💧']['🍰🌧💧'];
    // const precip_threshold = DATA['💧']['💭☔']; // inutilisé (nettoyage)
    const precipitation_rate = DATA['💧']['🧲⚖️💦'];
    // const cloud_index = DATA['🪩']['☁️']; // inutilisé (nettoyage)

    // 2. Précipitations convectives renforcées (EARTH.PRECIP_CONVECTIVE_*). Lit. Held & Soden 2006, IPCC AR6 ; réponse plus lente que C-C.
    const temp_factor_precip = Math.pow(Math.max(0, DATA['🧮']['🧮🌡️'] / EARTH.PRECIP_CONVECTIVE_T_REF_K), EARTH.PRECIP_CONVECTIVE_T_EXPONENT);
    const humidity_ratio_precip = relative_humidity > 0 ? relative_humidity / EARTH.PRECIP_CONVECTIVE_RH_REF : 0;
    const humidity_factor_precip = Math.pow(Math.max(0, humidity_ratio_precip), EARTH.PRECIP_CONVECTIVE_RH_EXPONENT);
    const precip_rate_enhanced = precipitation_rate * temp_factor_precip * humidity_factor_precip;

    // 3. Mise à jour 🍰🫧💧 = 🧲⚖️💦 × Surface × 🔺⏳ / ⚖️🫧
    // VÉRIFICATION HOMOGÉNÉITÉ :
    // 🧲⚖️💦 : kg/m²/s (taux de précipitation)
    // Surface : m²
    // 🔺⏳ : s (temps)
    // ⚖️🫧 : kg (masse atmosphérique)
    // (🧲⚖️💦 × Surface × 🔺⏳) / ⚖️🫧 = (kg/m²/s × m² × s) / kg = kg / kg = sans dimension ✓
    const vapor_before = DATA['💧']['🍰🫧💧'];
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    let precipitation_loss_fraction = 0;
    
    // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
    const has_precipitation = precip_rate_enhanced > 0 && DATA['💧']['🔺⏳💦'] > 0 && atm_mass_total > 0;
    if (has_precipitation) {
        const EPOCH = DATA['📅'];
        const planet_radius_km = DATA['📜']['📐'];
        const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2);
        const precipitation_mass_kg = precip_rate_enhanced * planet_surface_m2 * DATA['💧']['🔺⏳💦'];
        precipitation_loss_fraction = precipitation_mass_kg / atm_mass_total;
        
        DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before - precipitation_loss_fraction);
    }
}

// 🔒 FONCTION D'ITÉRATION EN PHASE INIT : Calcul correct avec condensation
// Ordre recommandé :
// 1. Calculer 🍰🧪🌧 (saturation via T et P)
// 2. Calculer vapeur potentielle = min(disponible, saturation massique)
// 3. Calculer ☁️ (via RH)
// 4. Réduire la vapeur effective : 🍰🫧💧 = vapeur_potentielle × (1 - ☁️ × efficacité_condensation)
// 5. Mettre l'eau condensée dans 🌊 ou 🧊
// 6. Recalculer RH et ☁️ (itération)
// Réf : Manabe & Wetherald 1967, J. Atmos. Sci. 24:241 ; Dai 2006, J. Climate 19:3589 ; Hersbach et al. 2020, Q. J. R. Meteorol. Soc. 146:1999 — doc/equation.html#eq-vapeur-surface
function calculateH2OParametersWithIteration() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    //const EPOCH = DATA['📅'];
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
    
    // 🔒 ÉTAPE 2 : Calculer 🍰🧪🌧 (saturation via T et P)
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;
    DATA['💧']['🍰🧪🌧'] = max_vapor_fraction;
    
    // 🔒 ÉTAPE 3 : Calculer vapeur potentielle = min(disponible, saturation massique)
    const M_dry = dryMolarMass();
    const mass_ratio = CONST.M_H2O / M_dry;
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    const available_water_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'] : 0;
    const vapor_raw = Math.min(max_vapor_mass_fraction, available_water_fraction);
    // [EQ] Plafond de vapeur = rapport colonne/saturation × saturation EXACTE.
    // `max_vapor_mass_fraction` deux lignes plus haut EST q_sat(T) : P_sat(T)/P × M_H2O/M_air, avec
    // P_sat de calculateSaturatedVaporPressure() — Clausius-Clapeyron intégrée, sans linéarisation.
    // Avant le 2026-09-22 cette ligne recalculait la MÊME chose en linéarisé autour de 288 K
    // (0,0065 × exp[0,065 × (T−288)]), c'est-à-dire l'équation déguisée en deux constantes sans
    // source. Voir le bloc « PLAFOND DE VAPEUR » de physics.js.
    const c_c_max = DATA['🎚️'].H2O.H2O_SURFACE_RH_01 * max_vapor_mass_fraction;
    // [EQ] Fermeture numérique : vapeur potentielle = min(cap_obs_dynamique, contrainte thermodynamique, eau disponible).
    // Facteur « Iris » (vapeur / (1 + 0,02·(T − 288)/10), « calib 2025 ») RETIRÉ le 2026-10-13 : un réglage qui ôtait 9 %
    // de vapeur à 35 °C et coupait la rétroaction de la vapeur (l'iris de Lindzen porte sur les nuages, pas sur l'humidité).
    const vapor_potentielle = Math.min(c_c_max, vapor_raw);
    
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
        DATA['💧']['🔺⏳💦'] = use_acceleration ? CONV.SECONDS_PER_DAY * window.CONFIG_COMPUTE.deltaTAccelerationDays : CONV.SECONDS_PER_DAY;
        
        // 🔒 ÉTAPE 1 : Calculer 🍰🌧💧 (RH) depuis la vapeur actuelle
        const q_sat = mass_ratio * max_vapor_fraction;
        const relative_humidity = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
        DATA['💧']['🍰🌧💧'] = relative_humidity;
        
        // 🔒 ÉTAPE 2 : Calculer 💭☔, 🧲⚖️💦 (via calculateCloudFormationIndex)
        // ⚠️ IMPORTANT : calculateCloudFormationIndex() calcule 💭☔, 🧲⚖️💦
        ALBEDO.calculateCloudFormationIndex();
        // const precip_threshold = DATA['💧']['💭☔'] || 0; // inutilisé (nettoyage)
        // const cloud_index = DATA['🪩']['☁️']; // inutilisé (nettoyage)

        // [OBS/CALIB] Précip convective (EARTH.PRECIP_CONVECTIVE_*). Lit. Held & Soden 2006, IPCC AR6.
        const temp_factor_precip_inner = Math.pow(Math.max(0, DATA['🧮']['🧮🌡️'] / EARTH.PRECIP_CONVECTIVE_T_REF_K), EARTH.PRECIP_CONVECTIVE_T_EXPONENT);
        const humidity_ratio_precip_inner = relative_humidity > 0 ? relative_humidity / EARTH.PRECIP_CONVECTIVE_RH_REF : 0;
        const humidity_factor_precip_inner = Math.pow(Math.max(0, humidity_ratio_precip_inner), EARTH.PRECIP_CONVECTIVE_RH_EXPONENT);
        const precip_rate_enhanced_inner = DATA['💧']['🧲⚖️💦'] * temp_factor_precip_inner * humidity_factor_precip_inner;

        // 🔒 ÉTAPE 3 : Mise à jour 🍰🫧💧 = 🍰🫧💧 - (🧲⚖️💦 × Surface × 🔺⏳) / ⚖️🫧
        const vapor_before_precipitation = DATA['💧']['🍰🫧💧'];
        let precipitation_loss_fraction = 0;
        // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
        const has_precipitation_inner = precip_rate_enhanced_inner > 0 && DATA['💧']['🔺⏳💦'] > 0 && DATA['⚖️']['⚖️🫧'] > 0;
        if (has_precipitation_inner) {
            const EPOCH = DATA['📅'];
            const planet_radius_km = DATA['📜']['📐'];
            const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2); // Surface en m²
            const precipitation_mass_kg = precip_rate_enhanced_inner * planet_surface_m2 * DATA['💧']['🔺⏳💦']; // Masse précipitée en kg
            precipitation_loss_fraction = precipitation_mass_kg / DATA['⚖️']['⚖️🫧']; // Fraction massique précipitée
            
            DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before_precipitation - precipitation_loss_fraction);
        }
        // La pluie retourne à l'eau de surface : partagerEau la compte dans le reste (glace et liquide posés par calculateAlbedo).

        // 🔒 ÉTAPE 4 : Recalculer la saturation et les parts de l'air sec avec la nouvelle vapeur
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
    // [EQ] Même remplacement : rapport × saturation exacte, au lieu d'une exponentielle linéarisée
    // autour de 288 K dont le taux (0,013 K⁻¹) ne venait de nulle part et n'était pas Clausius-Clapeyron.
    const q_sat_init = DATA['💧']['🍰🧪🌧'] * (CONST.M_H2O / DATA['🫧']['🧪']);
    const realistic_vapor_max = DATA['🎚️'].H2O.H2O_SURFACE_RH_01 * q_sat_init;   // même référence que la vapeur hors Init
    DATA['💧']['🍰🫧💧'] = Math.min(realistic_vapor_max, DATA['💧']['🍰🫧💧']);
    
    return true;
}

/** M de l'air sec (kg/mol) à partir des masses ⚖️ : M = Σm / Σ(m/M) (masse totale / nombre de moles) ;
 *  sans atmosphère (⚫), M de référence. Avant le 2026-10-13 : Σ(m·M)/Σm, moyenne pondérée par la masse, fausse
 *  (29,08 au lieu de 28,96 g/mol sur 📱, et l'écart grandit avec le CO₂ : q_sat ∝ M_H₂O / M). */
function dryMolarMass() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const m = DATA['⚖️'];
    if (m['⚖️🫧'] === 0) return window.CONV.molar_mass_air_ref;
    const masse = m['⚖️🏭'] + m['⚖️🐄'] + m['⚖️🫁'] + m['⚖️💨'];
    const moles = m['⚖️🏭'] / CONST.M_CO2 + m['⚖️🐄'] / CONST.M_CH4 + m['⚖️🫁'] / CONST.M_O2 + m['⚖️💨'] / CONST.M_N2;
    return masse / moles;
}

var H2O = window.H2O = {};

//Fonction principale : calcule tous les paramètres H2O
// Réf : Manabe & Wetherald 1967, J. Atmos. Sci. 24:241 ; Dai 2006, J. Climate 19:3589 ; Hersbach et al. 2020, Q. J. R. Meteorol. Soc. 146:1999 — doc/equation.html#eq-vapeur-surface
H2O.calculateH2OParameters = function () {
    const DATA = window.DATA;
    //const EPOCH = DATA['📅'];
    //const ALBEDO = window.ALBEDO;
    const ATM = window.ATM;
    const COMPUTE = window.COMPUTE;
    // Sans océan possible : toute l'eau en vapeur (état de phase, avant toute paramétrisation d'un monde à océan).
    COMPUTE.getMasses();
    if (window.PHYS.eauSansLiquide()) { poserToutVapeur(); return true; }
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
    DATA['💧']['🍰🧪🌧'] = max_vapor_fraction;
    // 🔒 M_dry depuis masses (air sec) : évite dépendance circulaire avec 🍰🫧💧 (M_air = f(🍰🫧💧) → 🍰🫧💧 = f(M_air))
    const M_dry = dryMolarMass();
    const mass_ratio = CONST.M_H2O / M_dry;
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    const available_water_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'] : 0;
    const vapor_raw = Math.min(max_vapor_mass_fraction, available_water_fraction);
    // [EQ] Plafond de vapeur = rapport colonne/saturation × saturation EXACTE.
    // `max_vapor_mass_fraction` deux lignes plus haut EST q_sat(T) : P_sat(T)/P × M_H2O/M_air, avec
    // P_sat de calculateSaturatedVaporPressure() — Clausius-Clapeyron intégrée, sans linéarisation.
    // Avant le 2026-09-22 cette ligne recalculait la MÊME chose en linéarisé autour de 288 K
    // (0,0065 × exp[0,065 × (T−288)]), c'est-à-dire l'équation déguisée en deux constantes sans
    // source. Voir le bloc « PLAFOND DE VAPEUR » de physics.js.
    const c_c_max = DATA['🎚️'].H2O.H2O_SURFACE_RH_01 * max_vapor_mass_fraction;
    // [EQ] Fermeture numérique : vapeur effective = min(cap_obs_dynamique, contrainte thermodynamique, eau disponible).
    // Facteur « Iris » retiré le 2026-10-13 (voir calculateH2OParametersWithIteration).
    const vapor_result = Math.min(c_c_max, vapor_raw);
    // Log cap vapeur (bruyant) : ne log que si logEdsDiagnostic est activé.
    if (vapor_raw > c_c_max && window.CONFIG_COMPUTE.logEdsDiagnostic) {
        const T_C = T - CONST.KELVIN_TO_CELSIUS;
        const mCap = 'H2O cap @' + T_C.toFixed(1) + '°C';
        const line = '[cycle] ' + mCap;
        console.log(line);
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', line);
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
H2O.partagerEau = partagerEau;
H2O.mondeOcean = mondeOcean;
H2O.masseGlaceMer = masseGlaceMer;
H2O.calculatePrecipitationFeedback = calculatePrecipitationFeedback;
H2O.getBoilingPointKFromPressure = getBoilingPointKFromPressure;
