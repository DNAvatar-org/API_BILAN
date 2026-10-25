// File: API_BILAN/albedo/calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.6.2
// - v1.6.2 (2026-10-22): albédos d'une calotte qui fond (neige mouillée, glace nue) passés au bilan méridien.
// - v1.6.1 (2026-10-14): calottes = état porté d'un clic à l'autre (config au clic frise), plus de graine sans glace.
// - v1.5.0 (2026-10-13): bilan méridien (MERIDIEN.resoudre) en tête de calculateAlbedo ; plus d'EPOCH['🥶'].
// Date: [October 22, 2026]
//   DESCEND en dessous partout ailleurs — l'ancien boost, toujours ≥ 1, faisait l'inverse.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - epochId Archéen : 🦠 (🌋 réservé actions). Archéen utilise clouds modernes pour ~15°C.
// - 🧲⚖️💦 : formule P = W/τ (litt. 8–10 j), ⏳☔ = 1/τ_global ; rampe (RH−💭☔)/0,2 ; ref. Nature Rev. Earth Env. 2021, HESS 2017, GPCP ~2,7 mm/j.
//
// FORMULES ALBEDO :
// A_geo = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🎾,🌊,🌳,🌍,🏜️,🧊} + contribution_glace + contribution_nuages
//   où contribution_glace = (🪩🍰🧊 - albedo_base) × min(🍰💧🧊 × support_hydrique, 🍰🪩🧊) × 0.5
//   et contribution_nuages = albedo × (1 - 🍰🪩⛅) + α_nuageux × 🍰🪩⛅, α_nuageux = r + (1−r)²·albedo/(1 − r·albedo), r = 🪩🍰⛅ (addition 2 couches, v1.2.64)
// 🍰🪩📿 (DATA) = 1 − (1−A_geo)(1−🍰⚽) après blackbody_factor sur A_geo
// 🍰🪩🎾 = volcano_coverage = fraction fondue de la péridotite à T_surface (solidus → liquidus, Katz 2003)
// 🍰🪩🌊 = ocean_coverage = (ocean_volume_m3 / (📏🌊 × 1000)) × 🐚 / (4π × 📐²)
//   où ocean_volume_m3 = (⚖️💧 × 🍰💧🌊) / 1000
// 🍰🪩🌳 = forest_coverage = f(T, ocean_coverage) : si T<30°C et ocean>0.1 alors min(0.5, ocean × (1-T/30))
// 🍰🪩🌍 = land_coverage = max(0, 1.0 - ocean - ice - forest) (continents, prairies, sols humides, albedo ~0.18)
// 🍰🪩🏜️ = desert_coverage = 1.0 - (🎾 + 🌊 + 🌳 + 🌍 + 🧊) (zones arides, albedo ~0.30)
// 🍰🪩🧊 = ice_coverage = min(0.9, 🍰💧🧊 × 0.9)
// 🍰🪩⛅ = cloud_coverage = C_max × ☁️ où C_max ≈ 0.7 et ☁️ = CloudFormationIndex
// 🍰⚽ ∈ [0,0.95] : obstruction voile SW sur le faisceau déjà modulé par A_geo (EPOCH+📜+CONFIG)
// 🍰🪩⚽ = 1 − 🍰⚽ : transmission de ce faisceau ; 🍰🪩📿 (DATA) = 1 − (1−A_geo)(1−🍰⚽) = albédo planétaire effectif

// ============================================================================
// Albédo effectif (surfaces + nuages + voile SW) : cohérence 🍰🪩📿 / 🧲☀️🔽 / 🧲🪩🔼
// ============================================================================
function applyVeilToPlanetaryAlbedo01(A_geom) {
    const a = Math.max(0, Math.min(1, A_geom));
    const obs = Math.max(0, Math.min(0.95, window.DATA['🪩']['🍰⚽']));
    return 1 - (1 - a) * (1 - obs);
}

// ============================================================================
// VOILE SW STRATOSPHÉRIQUE : 🍰⚽ (obstruction, source métier) ; 🍰🪩⚽ = 1−🍰⚽ (transmission)
// ============================================================================
// Voile = 📜🔺🍰⚽ (impulsion d'époque / rampe / action, compute.js + events.js).
// (Retirés : terme « racine EPOCH['🍰⚽'] », déclaré par aucune époque, et jauge hystStratosphericVeilExtra01
// de la page hystérésis supprimée — tous deux valaient toujours 0.)
function syncStratosphericVeil01(DATA) {
    const obs = Math.min(0.95, Math.max(0, DATA['📜']['🔺🍰⚽']));
    DATA['🪩']['🍰⚽'] = obs;
    DATA['🪩']['🍰🪩⚽'] = 1 - obs;
    return obs;
}

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
// ☁️ = 1 - Math.pow(1 - min(🍰🌧💧, 1), 0.6)     où 🍰🌧💧 = humidité relative (q/q_sat).
// Sundqvist (1989) : la couverture nuageuse ne dépend que de l'humidité relative.
// À HR=98.9% : ☁️ ≈ 0.93. ☁️ n'utilise PAS 🍰🫧💧🌈 (cap. rad. IR, calculée ailleurs).
// v-2026-09-23 : le facteur 🍰💭 (« efficacité CCN ») a été retiré — voir le bloc de suppression
// dans calculateCloudFormationIndex().
//
// Note : L'ancienne formule (🍰🫧💧/H2O_VAPOR_REF × f(T) × ...) n'est plus utilisée.

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // 🔒 CALCUL DE 🍰🌧💧 (Humidité relative moyenne globale)
    // FORMULE : 🍰🌧💧 = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧪🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧪🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧪🌧 = fraction massique saturante q_sat
    //   🍰🌧💧 = q / q_sat = humidité relative (RH)
    const q_sat = (CONST.M_H2O / DATA['🫧']['🧪']) * DATA['💧']['🍰🧪🌧'];  // Fraction massique saturante
    DATA['💧']['🍰🌧💧'] = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_factor = (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE;
    DATA['💧']['💭☔'] = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));

    // ── 🍰💭 SUPPRIMÉE le 2026-09-23 ────────────────────────────────────────────────────
    // Elle valait :
    //   🍰💭 = clamp(0,4 + 0,5×(⚖️🫁/réf + ⚖️🐄/réf) + 0,1×(⚖️✈/réf), 0,3, 1,0)
    // et multipliait la fraction nuageuse de Sundqvist. Trois raisons de la retirer, pas une :
    //
    // 1. ELLE N'A PAS DE PHYSIQUE. La fraction nuageuse n'est pas fonction des noyaux de
    //    condensation : elle est fixée par la dynamique et l'humidité. Sundqvist (1989, Mon. Wea.
    //    Rev. 117:1641) la paramétrise à partir de la SEULE humidité relative. Les CCN agissent
    //    sur le NOMBRE de gouttelettes — donc sur l'albédo nuageux (Twomey 1977/1991, déjà codé
    //    plus bas) et sur leur taille — pas sur la couverture.
    // 2. NI L'O₂ NI LE CH₄ NE SONT DES CCN. La chimie de l'activation est la théorie de Köhler
    //    (1936), modernisée en κ-Köhler (Petters & Kreidenweis 2007, ACP 7:1961) : terme de Kelvin
    //    (courbure) + terme de Raoult (soluté), avec κ mesuré par espèce — sulfate d'ammonium 0,61,
    //    sel de mer 1,1, organiques 0,1–0,2, suie ≈ 0. L'O₂ et le CH₄ n'y figurent pas. Il n'y avait
    //    donc rien à dériver : cette formule n'était l'approximation de rien.
    // 3. ELLE ÉTAIT MORTE. Sa valeur brute allait de 1,15 à 6058 selon l'époque : le clamp la
    //    figeait à 1,000 sur 18 époques sur 19 (doc/AUDIT_CONSTANTES_SANS_SOURCE.md). Elle
    //    multipliait Sundqvist par la constante 1.
    //
    // Ce que devient l'apport des CCN : il passe entièrement par la loi de puissance mesurée
    // sulfate → gouttelettes (McCoy et al. 2018) puis par Twomey, plus bas dans ce fichier.
    // ⚠️ Les autres espèces de CCN réelles — sel de mer, organiques, poussière, suie — ne sont pas
    // suivies par le modèle. McCoy 2018 publie leurs exposants ; il manque leurs masses.
    //
    // 🔒 FORMULE SUNDQVIST (1989) : ☁️ = 1 − (1 − min(🍰🌧💧, 1))^0.6, humidité relative seule.
    DATA['🪩']['☁️'] = Math.max(0, Math.min(1, 1 - Math.pow(1 - Math.min(DATA['💧']['🍰🌧💧'], 1), 0.6)));
    
    // ⏳☔ (= 1 / CONV.TAU_VAPOR_GLOBAL_S) retirée le 2026-09-23 : écrite ici, lue nulle part (ses deux
    // lecteurs étaient déjà commentés « inutilisé » dans calculations_h2o.js). τ reste lu directement
    // par 🧲⚖️💦 ci-dessous : P = W/τ (temps de résidence ~8–10 j, Nature Rev. Earth Env. 2021 ; HESS 2017).
    
    // 🔒 INITIALISATION DE 🔺⏳ (1 jour). En phase eau, tuning SOLVER.DELTA_T_ACCELERATION_DAYS (8–10 j) peut l’augmenter.
    DATA['📅']['🔺⏳'] = CONV.SECONDS_PER_DAY;
    
    // 🔒 CALCUL DE 🧲⚖️💦 (Taux de précipitation en kg/m²/s). P = W/τ ; rampe (RH−💭☔)/0.2. Réf. GPCP ~2,7 mm/j.
    const rh_excess = DATA['💧']['🍰🌧💧'] - DATA['💧']['💭☔'];
    const ramp = rh_excess <= 0 ? 0 : Math.min(1, rh_excess / 0.2);
    DATA['💧']['🧲⚖️💦'] = ramp * (DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧']) / (4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2)) / CONV.TAU_VAPOR_GLOBAL_S;

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
// [EQ] Briegleb mature (NCAR/TN-463) — état établi : aging + melt-pond selon T_locale.
function brieglebIceAlbedoMature(T_local_K, alphaSnowDeep, albedo_coeff) {
    const alphaCold = albedo_coeff['🪩🍰🧊'];
    const alphaMelt = albedo_coeff['🪩🍰🏊'];
    if (T_local_K <= 263.15) return alphaSnowDeep;
    if (T_local_K <= 268.15) {
        const t = (T_local_K - 263.15) / 5.0;
        return alphaSnowDeep + (alphaCold - alphaSnowDeep) * t;
    }
    if (T_local_K < 273.15) {
        const t = (T_local_K - 268.15) / 5.0;
        return alphaCold + (alphaMelt - alphaCold) * t;
    }
    return alphaMelt;
}

// Albédo glace zonale : neige fraîche (α_snow_deep) tant que le snowball n'est pas établi ;
// interpolation vers Briegleb mature quand f_global_ice → 1 (sublimation, melt-pond, glace nue).
function brieglebIceAlbedoLocal(T_local_K, alphaSnowDeep, albedo_coeff, establishment01) {
    // [v1.2.64] gate d'établissement v1.2.63 RETIRÉ : il plaquait 0.85 (neige fraîche) sur la glace polaire
    // moderne (T_pol ≈ −5 °C → Briegleb 0.70) → toutes les époques modernes −2 à −10 K hors fourchettes bench
    // (📱 13.2 °C, 🍄 10.8 °C…). La glace suit Briegleb (T_locale) ; establishment01 conservé en signature.
    // [v1.2.64] T_locale = moyenne ANNUELLE de zone ; la glace d'une zone plus chaude que −5 °C est SAISONNIÈRE
    // (présente l'hiver, froide). Son albédo pondéré par l'ensoleillement est celui de la glace établie
    // 🪩🍰🧊 (0.70, annuel Arctique 0.6–0.7), pas α_melt 0.50 d'une moyenne annuelle > 0 °C. Plafond T à
    // 268.15 K ⇒ α(T) MONOTONE et CONTINUE (plus froid ⇒ jamais plus sombre) : pas de racine parasite.
    return brieglebIceAlbedoMature(Math.min(T_local_K, 268.15), alphaSnowDeep, albedo_coeff);
}

// ============================================================================
// RAPPORT DE CCN DE L'ÉPOQUE (sans dimension, 1 = Terre actuelle)
// ============================================================================
// Multiplie le nombre de gouttes de la Terre actuelle (EARTH.NUAGES, DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3) dans le
// profil nuageux (radiative/calculations.js) : r_eff ∝ N^(−1/3), c'est Twomey (1977), sans coefficient à régler.
// Une seule loi, MESURÉE : CDNC / CDNC_ref = (m_SO₄ / m_ref)^a (forme de Boucher & Lohmann 1995, Tellus B 47:281 ;
// exposant a de McCoy et al. 2018, ACP 18:2035, Table 1 — CDNC MODIS, sulfate MERRA2, 19 régions, quartiles
// [0,11 ; 0,29], jauge SUBTIL). m_ref = charge moderne 1,05e9 kg SO₄ (Tsigaridis et al. 2006) : le rapport vaut 1 sur 📱.
// Sulfate efficace = part volcanique + part DMS modulée par la biosphère marine 🧫 de l'époque. Partage MESURÉ des deux
// sources naturelles : volcanisme 11,5 Tg S/an (Carn et al. 2017, Sci. Rep. 7:44095), DMS 28,1 Tg S/an (Lana et al. 2011,
// Glob. Biogeochem. Cycles 25:GB1004) → 0,29 / 0,71. ⚠️ 🧫 est posée par époque (paléo-abondance du plancton, sans mesure).
// Retiré le 2026-10-13 : le « proxy » (CCN_BASE + CCN_O2_WEIGHT·🍰🫧🫁·(1 + BIOMASS_GAIN·🍰🪩🌳)·anthro) / référence
// moderne, qui multipliait cette loi. L'O₂ n'est pas un noyau de condensation (activation de Köhler, κ-Köhler : Petters &
// Kreidenweis 2007, ACP 7:1961) ; les 0,15 / 0,85 / 4,0 étaient « calibrés », et la rampe anthropique 1900–1980 comparait
// des années du calendrier à EPOCH['▶'] (des âges géologiques). Il divisait le nombre de gouttes par ~2,5 sur toute
// époque sans oxygène. ⚠️ Les autres CCN réels (sel de mer, organiques, poussière) ne sont pas suivis : McCoy 2018 publie
// leurs exposants, il manque leurs masses par époque.
function rapportCCN() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const SO4_VOLCANIC_SHARE = 11.5 / (11.5 + 28.1);   // 0,290 — Carn 2017 / Lana 2011
    const sulfate_kg_effective = DATA['⚖️']['⚖️✈'] * (SO4_VOLCANIC_SHARE + (1 - SO4_VOLCANIC_SHARE) * EPOCH['🧫']);
    const ccn_ratio = window.AEROSOL.sulfateCcnRatio(
        sulfate_kg_effective,
        CONV.CCN_SULFATE_REF_KG,                       // 1,05e9 kg SO₄ = charge moderne (Tsigaridis 2006)
        DATA['🎚️'].CLOUD_SW.SULFATE_CCN_EXPONENT
    );
    window._hystDiag.ccnRatio = ccn_ratio;
    window._hystDiag.sulfateKgEffective = sulfate_kg_effective;
    return ccn_ratio;
}

/** [cm⁻³] Nombre de gouttes des nuages bas de la Terre ACTUELLE pour la surface courante : océan (jauge FROID, Bennartz
 *  2007) et continent (Gultepe & Isaac 2004) pondérés par l'océan libre. Sert au seuil de pluie (radiative/calculations.js). */
/** [m²/m²] Part de la planète sous masse d'air MARITIME : les bassins océaniques, GELÉS OU NON (🍰🗻🌊). Avant le
 *  2026-10-13, l'océan LIBRE (🍰🪩🌊) : la banquise comptait comme un continent (200 gouttes/cm³ au lieu de ~65), d'où des
 *  nuages plus épais et plus brillants à mesure que la mer gelait — une rétroaction artificielle vers le snowball. Au-dessus
 *  de la banquise, l'air reste maritime et pauvre en noyaux (nuages arctiques : Mauritsen et al. 2011, ACP 11:165). */
function fractionMaritime() {
    return window.DATA['🗻']['🍰🗻🌊'];
}
function nombreGouttesActuelCm3() {
    const DATA = window.DATA;
    const oc = fractionMaritime();
    return DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3 * oc + window.EARTH.NUAGES.CDNC_CONTINENT_CM3 * (1 - oc);
}
/** [cm⁻³] Nombre de gouttes de l'ÉPOQUE : actuel × rapport de CCN (loi sulfate). C'est celui qui fixe r_eff (Twomey). */
function nombreGouttesCm3() {
    return nombreGouttesActuelCm3() * rapportCCN();
}

function calculateAlbedo() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const ALBEDO = window.ALBEDO;
    const STATE = window.STATE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    syncStratosphericVeil01(DATA);
    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = ('🪩🍰' in EPOCH) ? { ...EARTH['🪩🍰'], ...EPOCH['🪩🍰'] } : { ...EARTH['🪩🍰'] };

    // [MUDBALL v1.2.64] Déglaciation 1b : la poussière volcanique/éolienne concentrée par sublimation sur des Ma
    // (Abbot & Pierrehumbert 2010, JGR 115:D03104) assombrit TOUTE la glace — neige profonde 🪩🍰❄️ ET glace nue 🪩🍰🧊.
    // Piloté par la CONFIG d'époque : EPOCH['🌫️❄️'] = albédo de la glace sale (nombre). Époque sans clé → glace propre.
    // La jauge du test hystérésis (CONFIG_COMPUTE.iceMudballAlbedo) ne surcharge QUE les époques qui déclarent la clé
    // (plus de détection par nom d'époque) → 1a / ⛄ / modernes intacts, bench = test = visu.
    if ('🌫️❄️' in EPOCH) {
        const _mudball = EPOCH['🌫️❄️'];
        if (albedo_coeff['🪩🍰❄️'] > _mudball) albedo_coeff['🪩🍰❄️'] = _mudball;
        if (albedo_coeff['🪩🍰🧊'] > _mudball) albedo_coeff['🪩🍰🧊'] = _mudball;
    }

    // Colonne nuageuse du profil (vapeur, nuages bas et hauts) : une fois par calcul — bilan méridien et albédo planétaire.
    const colonne = window.RADIATIVE.colonneNuageuse();

    // 🔒 BILAN MÉRIDIEN (physics/meridien.js, North et al. 1981) : écarts de température des zones CALCULÉS, posés dans
    // window.STATE.dTzones, que lit computeIceTempFactor plus bas. Surface libre de chaque zone = océan + terres de la
    // géologie ; glace de la zone = Briegleb à la température de la zone (mêmes lois que l'albédo de glace plus bas).
    const ocGeo = EPOCH['🗻']['🍰🗻🌊'];
    const albedoLibre = ocGeo * albedo_coeff['🪩🍰🌊'] + (1 - ocGeo) * albedo_coeff['🪩🍰🌍'];
    const neigeTrop = albedo_coeff['🪩🍰❄️'] - (albedo_coeff['🪩🍰❄️'] - albedo_coeff['🪩🍰🧊']) * Math.max(0, Math.min(1, DATA['🪩']['🍰🪩🧊']));
    const albedoGlaceZone = (cle, T_zone_K) => brieglebIceAlbedoLocal(T_zone_K,
        cle === 'trop' ? neigeTrop : albedo_coeff['🪩🍰❄️'], albedo_coeff, DATA['🪩']['🍰🪩🧊']);
    // Calottes continentales (physics/calottes.js) : état porté DATA['🗻']['🍰🗻🧊'] (config de l'époque au clic frise, état du
    // clic précédent au clic time), relaxé vers l'équilibre sur le temps écoulé depuis sa date. Résultat du pas : DATA['🗻']['🧮🍰🗻🧊'],
    // engagé en fin de convergence (calculations_flux.js → CALOTTES.engager).
    const dureeCalottes = DATA['🗻']['📅🗻🧊'] - window.INTERIEUR.ageCourant(DATA);
    // Calotte qui fond : neige mouillée (🪩🍰🧊, glace saisonnière) puis glace nue (🪩🍰🏊) — anomalie d'insolation de l'orbite.
    const meridien = window.MERIDIEN.resoudre(DATA['🧮']['🧮🌡️'], EPOCH, colonne, albedoLibre, albedoGlaceZone,
        albedo_coeff['🪩🍰❄️'], { neige: albedo_coeff['🪩🍰🧊'], glace: albedo_coeff['🪩🍰🏊'] }, DATA['🗻']['🍰🗻🧊'], dureeCalottes);
    window._hystDiag.meridien = meridien;
    const calottesPas = {};
    for (const b of window.CALOTTES.BANDES) calottesPas[b.cle] = meridien.calottes[b.cle].a;
    DATA['🗻']['🧮🍰🗻🧊'] = calottesPas;
    // Part du globe sous calotte permanente : Σ zones f_z × fraction moyenne des deux hémisphères.
    const calotte_surface = EARTH.POLAR_ZONE_FRAC * meridien.calottes.parZone.pol + EARTH.MIDLAT_ZONE_FRAC * meridien.calottes.parZone.mid
        + EARTH.TROPICAL_ZONE_FRAC * meridien.calottes.parZone.trop;

    // Héritage glaciaire vs réinitialisation géologique :
    // époques courtes → forte inertie (glace héritée), époques longues → proche équilibre à T_config.
    function calcGlaceEquilibre(T_K) {
        // Même logique que ice_temp_factor ci-dessous, mais utilisée pour blend héritage glaciaire (pas l'albédo instantané).
        // Régime 1 (T_K >= T_freeze) : calottes polaires ; max ~10% surface (highlands).
        //   Rampe linéaire pondérée par l'amplification polaire → seuil global T_thresh_pol = T_FREEZE + dT_pol.
        //   dT_pol du bilan méridien (window.STATE.dTzones, physics/meridien.js).
        // Régime 2 (T_K <  T_freeze) : océan gèle → jusqu'à 90% surface en glace de mer, rampe sur 20 K.
        if (T_K >= EARTH.T_FREEZE_SEAWATER_K) {
            const T_thresh_pol = EARTH.T_FREEZE_SEAWATER_K + window.STATE.dTzones.pol;   // bilan méridien
            const stock_factor = Math.max(0, Math.min(1, (T_thresh_pol - T_K) / EARTH.T_NO_POLAR_ICE_RANGE_K));
            return Math.max(0, Math.min(1, 0.1 * stock_factor));
        }
        // [v1.2.64] CONTINUITÉ au gel : sous T_freeze les calottes (0.1, stock_factor=1 puisque
        // T < T_thresh_pol) NE DISPARAISSENT PAS — la mer gelée s'y AJOUTE. Avant : 0.1 → 0.009 en passant
        // −2.0 → −2.2 °C = la glace fondait en refroidissant (albédo ↓ de 3 %, Δ +10 W/m²) → faux puits
        // qui piégeait la visu ⛄ à −2 °C et fabriquait la « surfusion » 1a pile à T_freeze.
        const ocean_freeze_fraction = Math.min(1, Math.max(0, (EARTH.T_FREEZE_SEAWATER_K - T_K) / 20));
        return Math.max(0.1, Math.min(0.9, ocean_freeze_fraction * 0.9));
    }
    // v1.2.54 — Blend dt réévalué à CHAQUE pas (verrou iceEpochFixedWaterState supprimé).
    // Forme exponentielle : tau_eff = tauGlaceAns × iceInertiaFactor01
    //                       fraction_fonte = 1 − exp(−duree_ans / tau_eff), naturellement ∈ [0,1).
    //   • factor=1.0 → tau_eff = tauGlaceAns (temporalité géologique standard)
    //   • factor>1   → plus d'inertie (fonte/formation plus lente, tau_eff rallongé)
    //   • factor<1   → moins d'inertie (converge plus vite vers glace_equilibre)
    //   • factor=0   → tau_eff = 0 → fraction_fonte = 1 (équilibre instantané)
    // T source = T courante solver (permet feedback T→glace dans scan hystérésis).
    const duree_ans = Math.abs(EPOCH['▶'] - EPOCH['◀']);
    const tau_eff = CONFIG_COMPUTE.tauGlaceAns * Math.max(0, CONFIG_COMPUTE.iceInertiaFactor01);
    // factor = 0 → tau_eff = 0 → équilibre instantané (vraie branche de la jauge, pas une garde).
    const fraction_fonte = (tau_eff > 0) ? (1 - Math.exp(-duree_ans / tau_eff)) : 1;
    const glace_equilibre = calcGlaceEquilibre(DATA['🧮']['🧮🌡️']);
    // calcGlaceEquilibre modélise mer/océan gelé (→ ~0,72 à T≈255 K). Sans atmosphère ou sans eau, ou en ⚫,
    // la partition vapeur/glace/liquide est portée par calculations_h2o.calculateWaterPartition uniquement.
    const applyIceStockBlend =
        DATA['📜']['🗿'] !== '⚫' &&
        DATA['⚖️']['⚖️🫧'] > 0 &&
        DATA['⚖️']['⚖️💧'] > 0;
    // v1.2.59 — Snapshot pré-Search ANCRÉ SUR LA T SEED DE L'ÉPOQUE (EPOCH['🌡️🧮']), pas sur l'état leaké
    // de DATA (qui dépend de l'ordre d'arrivée : clic timeline vs bench séquentiel → calibration cassée).
    // Le snapshot représente "état glace que l'époque hériterait si elle démarrait à sa T config" — repère
    // calibration-stable, indépendant du parcours utilisateur. Le blend lit FROM snapshot pendant Search/
    // Dicho ; N appels successifs donnent le MÊME résultat à T courante donnée. Donc fraction_fonte =
    // 1 - exp(-duree_ans/tau_eff) représente bien le pas géologique (◀-▶ ans), pas un pas numérique.
    // Pour le scan hystérésis ⛄, chaque pas CO₂ remet 🧮⚧='Init' → snapshot reste = glace_eq(T_seed) ;
    // le feedback T→glace dans la branche froide (Pierrehumbert 2005 JGR 110:D01111) opère via la cible
    // glace_equilibre(T_courant) dans le terme de droite du blend.
    const phaseAlb = DATA['🧮']['🧮⚧'];
    // Logger glace : appelé en phase Init (snapshot frais) + à chaque Search/Dicho (suivi convergence).
    // Activé via CONFIG_COMPUTE.logIceSnapshotDiagnostic → _logs/iceSnapshot.txt.
    function _logIceSnap(tag) {
        if (!CONFIG_COMPUTE.logIceSnapshotDiagnostic) return;
        const line = '[iceSnap] ' + tag
            + ' ep=' + DATA['📜']['🗿']
            + ' phase=' + phaseAlb
            + ' T_C=' + (DATA['🧮']['🧮🌡️'] - 273.15).toFixed(3)
            + ' T_seed_C=' + (EPOCH['🌡️🧮'] - 273.15).toFixed(3)
            + ' duree_ans=' + duree_ans.toFixed(0)
            + ' tau_eff=' + tau_eff.toFixed(0)
            + ' frac_fonte=' + fraction_fonte.toFixed(6)
            + ' iceMassSnap=' + STATE._iceMassSnapshotPreSearch01
            + ' iceSurfSnap=' + STATE._iceSurfSnapshotPreSearch01
            + ' iceMassNow=' + DATA['💧']['🍰💧🧊']
            + ' iceSurfNow=' + DATA['🪩']['🍰🪩🧊']
            + ' glaceEqCur=' + glace_equilibre
            + ' vapMass=' + DATA['💧']['🍰🫧💧']
            + ' alb=' + DATA['🪩']['🍰🪩📿']
            + ' cloud=' + DATA['🪩']['🍰🪩⛅']
            + ' trapTot=' + DATA['📛']['🧲📛']
            + ' trapH2O=' + DATA['📛']['🧲📛💧']
            + ' trapCO2=' + DATA['📛']['🧲📛🏭']
            + ' fluxDelta=' + DATA['🧲']['🔺🧲'];
        console.log(line);
        window.debugMirrorConfigLogToFile('logIceSnapshotDiagnostic', line);
    }
    if (phaseAlb === 'Init') {
        const T_seed_K = EPOCH['🌡️🧮'];
        STATE._iceMassSnapshotPreSearch01 = calcGlaceEquilibre(T_seed_K);
        // Pour 🍰🪩🧊 : recalcule l'équilibre surface à T_seed via la même formule que ligne ~411
        // (EARTH.ICE_FORMULA_MAX_FRACTION × ice_temp_factor at T_seed), capé par ice_cap_surface
        // calculé localement (highlands ∪ hydrosphère). Évalué ici parce que ice_cap_surface n'est
        // pas encore connu — recalcul léger inline.
        const _surfArea = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
        const _hydroSupportSeed = Math.max(0, Math.min(0.9, ((DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / _surfArea) / 10));
        const _iceCapSeed = Math.max(DATA['🗻']['🍰🗻🏔'], _hydroSupportSeed);
        const _iceTfSeed = EARTH.computeIceTempFactor(T_seed_K, EPOCH);
        STATE._iceSurfSnapshotPreSearch01 = Math.min(_iceCapSeed, EARTH.ICE_FORMULA_MAX_FRACTION * _iceTfSeed.ice_tf);
        _logIceSnap('SNAPSHOT_RESET');
    }
    // Snapshot posé à la phase Init de ce run (calculateT0 → initForConfig → ici) : toujours présent ensuite.
    if (applyIceStockBlend) {
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1, STATE._iceMassSnapshotPreSearch01 * (1 - fraction_fonte) + glace_equilibre * fraction_fonte));
    }
    if (phaseAlb !== 'Init') _logIceSnap('BLEND_APPLY');
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    ALBEDO.calculateGeologySurfaces();
    
    // 🔒 ÉTAPE 1.5 : surface en fusion = fraction fondue de la péridotite à la température de surface COURANTE, entre son
    // solidus et son liquidus à 0 GPa (Katz, Spiegelman & Langmuir 2003, G³ 4:1073) — la même loi que l'intérieur
    // (geology/interieur.js). Avant le 2026-10-13 : rampe 1000 K → 2373 K (CONST.T_LAVA_*, sans source ; 2100 °C n'est le
    // liquidus d'aucune roche terrestre), évaluée sur la T de GRAINE de l'époque (📅🌡️🧮) au lieu de l'état.
    const LAVE = window.INTERIEUR.CONST;
    const volcano_coverage = Math.max(0, Math.min(1.0, (DATA['🧮']['🧮🌡️'] - LAVE.T_SOLIDUS) / (LAVE.T_LIQUIDUS - LAVE.T_SOLIDUS)));
    
    // 🔒 ÉTAPE 2 : Calculer la couverture océanique réelle depuis la géologie + stocks d'eau
    // La surface océanique est limitée par la géologie ET par la quantité d'eau disponible
    // Si volcano_coverage = 1.0, alors ocean_coverage = 0 (pas de mer possible)
    const planet_surface_m2 = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
    
    // Volume maximum que peut contenir le bassin océanique
    const ocean_basin_surface_m2 = DATA['🗻']['🍰🗻🌊'] * planet_surface_m2;
    const ocean_volume_max_m3 = (ocean_basin_surface_m2 / EPOCH['🐚']) * (EPOCH['📏🌊'] * 1000);
    const ocean_mass_max_kg = ocean_volume_max_m3 * CONST.RHO_WATER;
    
    // Masse d'eau océanique réelle = min(stock_total, capacité_bassin)
    const ocean_mass_actual_kg = Math.min(DATA['⚖️']['⚖️💧'], ocean_mass_max_kg);
    
    // Surface océanique réelle (peut être < bassin si pas assez d'eau)
    const ocean_volume_actual_m3 = ocean_mass_actual_kg / CONST.RHO_WATER;
    const ocean_depth_m = EPOCH['📏🌊'] * 1000;
    // 📏🌊=0 ⇒ pas de profondeur océanique définie (ex. ⚫) : ne pas faire volume/0 ni 0/0
    const ocean_surface_actual_m2 = ocean_depth_m > 0
        ? (ocean_volume_actual_m3 / ocean_depth_m) * EPOCH['🐚']
        : 0;
    const ocean_coverage_base = Math.min(DATA['🗻']['🍰🗻🌊'], Math.max(0.0, ocean_surface_actual_m2 / planet_surface_m2));
    
    // Réduire ocean_coverage proportionnellement à volcano_coverage
    let ocean_coverage = ocean_coverage_base * (1.0 - volcano_coverage);

    // Gel océan lissé (pas de bascule brutale) :
    // Quand T passe sous T_freeze, une fraction croissante de l'océan devient "mer gelée" (glace de mer).
    // On ne supprime pas instantanément l'océan, on le convertit progressivement en glace optique.
    const T_K = DATA['🧮']['🧮🌡️'];
    const hasOcean = (DATA['⚖️']['⚖️💧'] > 0);
    const T_freeze = EARTH.T_FREEZE_SEAWATER_K;
    // 🏷️ Source unique : DATA['🎚️'].HYSTERESIS (initDATA.js → interpolé depuis FINE_TUNING_BOUNDS).
    // Règle regle-data-territoire : lecture directe, pas de Number.isFinite/fallback. Si invalide, crash.
    const seaIceRangeK = DATA['🎚️'].HYSTERESIS.seaIceTransitionRangeK;
    const seaIceFrac = seaIceRangeK > 0 ? Math.max(0, Math.min(1, (T_freeze - T_K) / seaIceRangeK)) : (T_K < T_freeze ? 1 : 0);
    // Part d'océan encore libre:
    if (hasOcean && seaIceFrac > 0) {
        ocean_coverage = ocean_coverage * (1.0 - seaIceFrac);
    }
    
    // 🔒 Stocker ocean_coverage dans DATA AVANT calculateCloudFormationIndex()
    // calculateCloudFormationIndex() a besoin de DATA['🪩']['🍰🪩🌊'] pour calculer ☁️
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    
    let albedo_base = 0.0;
    
    // 🔒 ÉTAPE 3 : Calculer la couverture de glace depuis les hautes terres + climat
    // 🍰🪩🧊 est borné par le support physique disponible :
    // - hautes terres géologiques
    // - ou couche d'eau globale équivalente si l'astre a peu/pas de relief mais assez d'eau pour geler en surface
    //
    // ─── Amplification polaire 3 zones (EBM 0D) ─────────────────────────────────
    // Appel à la FONCTION UNIQUE EARTH.computeIceTempFactor(T_glob_K) — définie dans physics.js.
    // Même source dans calculations_flux.js et calculations_h2o.js. Pas de duplication.
    // Écarts de zone dT CALCULÉS par le bilan méridien (window.STATE.dTzones, physics/meridien.js) ; l'obliquité règle
    // l'amplitude saisonnière (∝ sin ε, physics.js).
    // ─────────────────────────────────────────────────────────────────────────────
    // Les écarts de zone et l'obliquité sont lus par computeIceTempFactor lui-même.
    const _iceTF = EARTH.computeIceTempFactor(DATA['🧮']['🧮🌡️'], EPOCH);
    const ice_temp_factor = _iceTF.ice_tf;
    const ice_tf_pol = _iceTF.tf_pol;
    const ice_tf_mid = _iceTF.tf_mid;
    const ice_tf_trop = _iceTF.tf_trop;  // v2.0.15 : 3e zone (physics.js)
    const T_thresh_pol = _iceTF.T_thresh_pol;
    const T_thresh_mid = _iceTF.T_thresh_mid;
    const T_thresh_trop = _iceTF.T_thresh_trop_high;
    if (CONFIG_COMPUTE.logIceFactorDiagnostic) {
        const mIce = '[iceTF] epoch=' + DATA['📜']['🗿'] +
            ' T=' + (DATA['🧮']['🧮🌡️'] - 273.15).toFixed(2) + '°C' +
            ' ε=' + _iceTF.obliquity_deg.toFixed(2) + '° (×' + _iceTF.obliquity_factor.toFixed(3) + ')' +
            ' dT_pol=' + _iceTF.dT_pol + ' amp_pol=' + _iceTF.amp_pol.toFixed(2) +
            ' dT_mid=' + _iceTF.dT_mid + ' amp_mid=' + _iceTF.amp_mid.toFixed(2) +
            ' dT_trop=' + _iceTF.dT_trop + ' amp_trop=' + _iceTF.amp_trop.toFixed(2) +
            ' | tf_pol=' + _iceTF.tf_pol.toFixed(3) +
            ' tf_mid=' + _iceTF.tf_mid.toFixed(3) +
            ' tf_trop=' + _iceTF.tf_trop.toFixed(3) +
            ' -> ice_tf=' + _iceTF.ice_tf.toFixed(3);
        console.log(mIce);
        window.debugMirrorConfigLogToFile('logIceFactorDiagnostic', mIce);
    }
    const planet_surface_area_m2 = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
    const global_water_layer_m = (DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / planet_surface_area_m2;
    let hydrosphere_surface_support = Math.max(0, Math.min(0.9, global_water_layer_m / 10));
    let ice_cap_surface = Math.max(DATA['🗻']['🍰🗻🏔'], hydrosphere_surface_support);
    // v1.2.59 — équilibre asymptotique de la surface optique à T courante (formule pure-en-T inchangée),
    // mais on blend depuis snapshot pré-Search (cf. plus haut). Couplage masse↔surface : la surface ne peut
    // reculer plus vite que la masse fond (chaleur latente de fusion ~3.34×10⁵ J/kg).
    // Réf : Hansen et al. 2013 PTRSA 371:20120294 — séparation feedbacks rapides (vapeur, clouds) vs lents
    // (calottes), avec τ_calotte ~ 10⁴–10⁵ ans (Marshall & Clark 2002 GRL 29(24):2214). En l'absence de
    // snapshot (premier appel ou hors blend), on retombe sur l'équilibre instantané (rétro-compat).
    const ice_fraction_equilibre = Math.min(ice_cap_surface, EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor);
    // Snapshot posé à la phase Init de ce run : toujours présent ici.
    let ice_fraction_target = applyIceStockBlend
        ? Math.max(0, Math.min(ice_cap_surface, STATE._iceSurfSnapshotPreSearch01 * (1 - fraction_fonte) + ice_fraction_equilibre * fraction_fonte))
        : ice_fraction_equilibre;
    const icePolarFormulaTarget = ice_fraction_target;

    // Mer gelée (lissé) : augmente le support/target de glace de manière progressive en fonction de seaIceFrac.
    // L'idée: quand l'océan gèle, la glace "optique" peut couvrir une large fraction sans tout convertir instantanément.
    if (hasOcean && seaIceFrac > 0) {
        hydrosphere_surface_support = Math.max(hydrosphere_surface_support, seaIceFrac);
        ice_cap_surface = Math.max(ice_cap_surface, seaIceFrac);
        ice_fraction_target = Math.max(ice_fraction_target, seaIceFrac);
    }
    const iceAfterSeaIceMerge = ice_fraction_target;

    DATA['🪩']['🍰🪩🧊'] = ice_fraction_target;
    const iceAfterDynamicFeedback = DATA['🪩']['🍰🪩🧊'];
    
    // 🔒 volcano_coverage déjà calculé plus haut (ligne ~200)
    
    // 🔒 ÉTAPE 4 : Calculer forêts/déserts/terres depuis l'indice d'humidité climatique (H)
    // NOUVEAU SYSTÈME : Répartition automatique 🌳 / 🏜️ / 🌍 basée sur température et précipitations
    // Les biomes dépendent uniquement de température et pluie, robuste pour d'autres planètes
    //
    // 1. Calculer précipitations annuelles P_ann (mm/an)
    // P_ann ∝ 🍰🧪🌧 × 🍰🪩🌊 × F_conv × facteur_échelle
    // Où 🍰🧪🌧 = max vapor fraction (potentiel de précipitation)
    //    🍰🪩🌊 = couverture océanique (source d'évaporation)
    //    F_conv = facteur de convection (fonction de température)
    // 🔒 CORRECTION : Le facteur d'échelle était trop faible
    // Sur Terre : 🍰🧪🌧 ≈ 0.017, 🍰🪩🌊 ≈ 0.71, F_conv ≈ 1.0
    // P_ann_base = 0.017 × 0.71 × 1.0 = 0.01207
    // Pour obtenir H ≈ 1.0 à 15°C : H = P_ann / (1000 × exp(0.05 × 15)) = P_ann / 2117
    // Donc P_ann ≈ 2117 mm/an pour H = 1.0
    // Facteur d'échelle : 2117 / 0.01207 ≈ 175000
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (DATA['🧮']['🧮🌡️'] - 288.15) / 50));  // Facteur convection (T optimal ~15°C = 288.15 K)
    const P_ann = DATA['💧']['🍰🧪🌧'] * ocean_coverage * F_conv * CONV.P_ANN_SCALE_MM_AN;  // mm/an (tuning CONV.P_ANN_SCALE_MM_AN)

    // 🔒 ÉTAPE 4 : Calculer ☁️ (index de formation nuageuse) AVANT de calculer les biomes
    // calculateCloudFormationIndex() calcule aussi 🍰🌧💧 (humidité relative) nécessaire pour les biomes
    ALBEDO.calculateCloudFormationIndex();
    
    // 🔒 ÉTAPE 5 : Calculer les terres disponibles (🍰🪩🌍_)
    // FORMULE : 🍰🪩🌍_ = 1 - ocean_coverage_réel - 🍰🪩🧊
    // Utiliser ocean_coverage (surface réelle) au lieu du bassin géologique (🍰🗻🌊)
    // Si le bassin n'est pas rempli, la portion sèche revient aux terres (sinon trou dans la somme → normalisation abusive)
    const land_available = Math.max(0, 1.0 - ocean_coverage - DATA['🪩']['🍰🪩🧊']);
    
    // 🔒 ÉTAPE 6 : Calculer forêts 🌳
    // === FORÊT - VERSION RÉALISTE (pas de if d'époque) ===
    // Réf : FAO Global Forest Resources Assessment 2020 ~31% des terres émergées. Formule en K : (T_K - 268.15) / 25 = (°C + 5) / 25.
    // Corps noir (⚫) : pas de CO2/atmosphère pour plantes → forêt = 0 (à reprendre pour époques tardives)
    // 🌱 = facteur biosphère terrestre par époque (fraction max des terres pouvant porter végétation) :
    //   - Hadéen / Archéen / Protéro / ⛄ / 🪼 / Cambrien : ≈ 0 (pas de plantes terrestres avant Ordovicien ~−470 Ma)
    //   - Ordovicien / Silurien : rampe 0 → 0.1 → 0.3 (bryophytes, ptéridophytes)
    //   - Dévonien → moderne : 0.31 (forêts établies, cf. FAO 2020)
    // Réf paléobotanique : Kenrick & Crane 1997 (Nature), Gensel 2008 (Ann Rev E E&S),
    //                     Stein et al. 2012 (Gilboa, PNAS — Archaeopteris).
    const relative_humidity = DATA['💧']['🍰🌧💧'];
    const temp_suitability = Math.max(0.4, Math.min(1.0, (DATA['🧮']['🧮🌡️'] - 268.15) / 25));
    const forest_potential = EPOCH['🌱'] * land_available * temp_suitability;
    const forest_coverage = (DATA['📜']['🗿'] === '⚫') ? 0 : Math.min(land_available, forest_potential);
    
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

    // Mer gelée (lissé) : réduire progressivement les biomes au profit de la glace,
    // sans écraser brutalement toutes les surfaces.
    if (hasOcean && seaIceFrac > 0) {
        const keep = Math.max(0, 1.0 - seaIceFrac);
        forest_surface = forest_surface * keep;
        land_surface = land_surface * keep;
        desert_surface = desert_surface * keep;
        // La part "gelée" s'ajoute en glace optique (bornée par surface hors volcan).
        const seaIceSurface = Math.max(0, Math.min(1.0 - volcano_surface, seaIceFrac * (1.0 - volcano_surface)));
        ice_surface = Math.max(ice_surface, seaIceSurface);
        // IMPORTANT: le blend ci-dessus peut réduire la somme des surfaces (on retire de l'océan et des biomes),
        // sans pour autant réassigner toute la fraction à une surface. Physiquement, cette fraction devient de la glace de mer.
        // On la réinjecte ici pour garder une somme = 1 sans normalisation artificielle.
        const sumAfterBlend = volcano_surface + ocean_surface + forest_surface + ice_surface + land_surface + desert_surface;
        if (sumAfterBlend < 1.0) {
            const missing = Math.min(1.0 - volcano_surface, 1.0 - sumAfterBlend);
            if (missing > 0) {
                ice_surface = Math.max(0, Math.min(1.0 - volcano_surface, ice_surface + missing));
            }
        }
        if (CONFIG_COMPUTE.logIceFractionDiagnostic) {
            const mSea = 'SEA_ICE_BLEND f=' + seaIceFrac.toFixed(3)
                + ' rangeK=' + seaIceRangeK
                + ' ep=' + DATA['📜']['🗿']
                + ' phase=' + DATA['🧮']['🧮⚧']
                + ' T_K=' + T_K.toFixed(2);
            console.log(mSea);
            window.debugMirrorConfigLogToFile('logIceFractionDiagnostic', mSea);
        }
    }
    // Calottes permanentes : la glace totale est au moins leur surface ; ce qui dépasse la glace déjà comptée est pris sur les
    // terres libres, puis le désert, puis la forêt. ice_surface ne garde que la glace SAISONNIÈRE (pondérée par l'ensoleillement).
    let calotte_manque = Math.max(0, calotte_surface - ice_surface);
    for (const prendre of ['land', 'desert', 'forest']) {
        const dispo = prendre === 'land' ? land_surface : (prendre === 'desert' ? desert_surface : forest_surface);
        const pris = Math.min(dispo, calotte_manque);
        if (prendre === 'land') land_surface -= pris; else if (prendre === 'desert') desert_surface -= pris; else forest_surface -= pris;
        calotte_manque -= pris;
    }
    let calotte_effective = calotte_surface - calotte_manque;          // ce que les terres ont pu porter
    ice_surface = Math.max(0, Math.max(ice_surface, calotte_effective) - calotte_effective);
    const surface_sum = volcano_surface + ocean_surface + forest_surface + ice_surface + calotte_effective + land_surface + desert_surface;
    if (Math.abs(surface_sum - 1.0) > 0.03) {
        console.warn(`⚠️ [calculateAlbedo] Somme surfaces=${surface_sum.toFixed(4)} -> normalisation`);
        console.warn(`   RAW: volcan=${volcano_surface.toFixed(4)} ocean=${ocean_surface.toFixed(4)} foret=${forest_surface.toFixed(4)} glace=${ice_surface.toFixed(4)} terre=${land_surface.toFixed(4)} desert=${desert_surface.toFixed(4)}`);
        console.warn(`   GEOL: 🍰🗻🌊=${DATA['🗻']['🍰🗻🌊'].toFixed(4)} 🍰🗻🏔=${DATA['🗻']['🍰🗻🏔'].toFixed(4)} 🍰🗻🌍=${DATA['🗻']['🍰🗻🌍'].toFixed(4)} ice_cap_surface=${ice_cap_surface.toFixed(4)} hydrosphere=${hydrosphere_surface_support.toFixed(4)}`);
        const scale = 1.0 / surface_sum;
        volcano_surface = volcano_surface * scale;
        ocean_surface = ocean_surface * scale;
        forest_surface = forest_surface * scale;
        ice_surface = ice_surface * scale;
        calotte_effective = calotte_effective * scale;
        land_surface = land_surface * scale;
        desert_surface = desert_surface * scale;
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🎾'] = volcano_surface;
    DATA['🪩']['🍰🪩🌊'] = ocean_surface;
    DATA['🪩']['🍰🪩🌳'] = forest_surface;
    DATA['🪩']['🍰🪩🧊'] = ice_surface + calotte_effective;   // toute la glace : saisonnière + calottes permanentes
    DATA['🪩']['🍰🪩🌍'] = land_surface;
    DATA['🪩']['🍰🪩🏜️'] = desert_surface;

    if (CONFIG_COMPUTE.logIceFractionDiagnostic) {
        const solI = DATA['🧮']['🧮🔄☀️'];
        const iceProdBare = EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor;
        const msg = '[calculateAlbedo][calculations_albedo.js] 🧊 ep=' + DATA['📜']['🗿']
            + ' phase=' + DATA['🧮']['🧮⚧']
            + ' T=' + T_K.toFixed(2) + 'K (' + (T_K - CONST.KELVIN_TO_CELSIUS).toFixed(2) + '°C)'
            + ' | T_freeze=' + T_freeze.toFixed(2) + ' seaRangeK=' + seaIceRangeK.toFixed(3)
            + ' seaF=' + seaIceFrac.toFixed(4)
            + ' | ice_temp_factor=' + ice_temp_factor.toFixed(4)
            + ' (tf_pol=' + ice_tf_pol.toFixed(3) + ' tf_mid=' + ice_tf_mid.toFixed(3) + ' tf_trop=' + ice_tf_trop.toFixed(3) + ')'
            + ' T_thresh_pol=' + T_thresh_pol.toFixed(2) + ' T_thresh_mid=' + T_thresh_mid.toFixed(2) + ' T_thresh_trop=' + T_thresh_trop.toFixed(2)
            + ' dTRange=' + EARTH.T_NO_POLAR_ICE_RANGE_K
            + ' ICEmax*factor=' + iceProdBare.toFixed(4)
            + ' | cap=' + ice_cap_surface.toFixed(4) + ' hydro=' + hydrosphere_surface_support.toFixed(4) + ' highland=' + DATA['🗻']['🍰🗻🏔'].toFixed(4)
            + ' | polarTarget=' + icePolarFormulaTarget.toFixed(4) + ' mergeSea=' + iceAfterSeaIceMerge.toFixed(4)
            + ' | iceDynamic=' + iceAfterDynamicFeedback.toFixed(4) + ' iceSurfFinal=' + ice_surface.toFixed(4)
            + ' | feedback=common solI=' + solI;
        console.log(msg);
        window.debugMirrorConfigLogToFile('logIceFractionDiagnostic', msg);
    }

    // [EQ] Albédo glace zonale — EBM 0D 3 zones × Briegleb (2004) NCAR/TN-463 §5.
    // T_local_z = T_glob − dT_z (Budyko-Sellers ; dT_z du bilan méridien, via computeIceTempFactor).
    // α_glace = Σ_z (f_z·tf_z·α_Briegleb(T_z, α_snow_deep_z)) / Σ_z (f_z·tf_z).
    // Pol + mi-lat : α_snow_deep = 🪩🍰❄️ (accumulation neige propre, Gardner & Sharp 2010).
    // Tropiques : α_snow_deep = 🪩🍰🧊 (sublimation → glace nue / saisonnière, pas de neige pristine ;
    //   Pierrehumbert 2005 JGR ; Abbot & Pierrehumbert 2010 J. Climate — mudball sans tuning f_ice).
    const T_glob_K = DATA['🧮']['🧮🌡️'];
    const T_polar_K = T_glob_K - _iceTF.dT_pol;
    const T_midlat_K = T_glob_K - _iceTF.dT_mid;
    const T_tropical_K = T_glob_K - _iceTF.dT_trop;
    const iceAlbedoCold = albedo_coeff['🪩🍰🧊'];
    const iceAlbedoSnowDeepPolMid = albedo_coeff['🪩🍰❄️'];
    // [FIX v1.2.62] La glace tropicale n'est NUE/sombre que dans un snowball ÉTABLI (sublimation + poussière
    // sur des Ma). Fraîchement gelée (front d'avancée = entrée 1a), elle est NEIGEUSE comme aux pôles (0.85).
    // → on interpole le plateau tropical de la neige propre (0.85, glace neuve) vers la glace nue 🪩🍰🧊
    // (établie) selon la fraction de glace GLOBALE. C'est « la glace ajoutée reste à 0.85 un temps avant
    // de s'assombrir » : l'assombrissement suit l'ÉTABLISSEMENT du snowball, pas la T° locale (qui donnait
    // une glace neuve fausse-sombre « melt-pond » et tuait la bifurcation d'entrée).
    const f_global_ice = Math.max(0, Math.min(1, DATA['🪩']['🍰🪩🧊']));
    const iceAlbedoSnowDeepTrop = iceAlbedoSnowDeepPolMid - (iceAlbedoSnowDeepPolMid - albedo_coeff['🪩🍰🧊']) * f_global_ice;
    const iceAlbedoMelt = albedo_coeff['🪩🍰🏊'];
    // [FIX v1.2.61] Garde : une zone ne vote dans la moyenne d'albédo glace QUE si elle porte réellement
    // de la glace (T locale < gel). Sinon brieglebIceAlbedoLocal renvoie α_melt (0.50) pour une glace
    // INEXISTANTE → ça diluait l'albédo de la glace polaire réelle (0.85 → 0.65), réchauffait la branche
    // chaude de +11 K et tuait la bifurcation 1a. On ne moyenne que la glace PRÉSENTE :
    //   branche chaude → seule la zone polaire vote (0.85 neige, littérature) ;
    //   snowball → les 3 zones votent, la tropicale nue (grande surface, plateau bas) fait émerger le ~0.6.
    // (T_freeze déjà défini plus haut = EARTH.T_FREEZE_SEAWATER_K)
    const w_pol = _iceTF.f_pol * _iceTF.tf_pol;
    const w_mid = _iceTF.f_mid * _iceTF.tf_mid;
    const w_trop = _iceTF.f_trop * _iceTF.tf_trop;
    const w_sum = w_pol + w_mid + w_trop;
    const iceAlbedoPol = brieglebIceAlbedoLocal(T_polar_K, iceAlbedoSnowDeepPolMid, albedo_coeff, f_global_ice);
    const iceAlbedoMid = brieglebIceAlbedoLocal(T_midlat_K, iceAlbedoSnowDeepPolMid, albedo_coeff, f_global_ice);
    const iceAlbedoTrop = brieglebIceAlbedoLocal(T_tropical_K, iceAlbedoSnowDeepTrop, albedo_coeff, f_global_ice);
    let iceAlbedoEff;
    if (w_sum > 0) {
        iceAlbedoEff = (w_pol * iceAlbedoPol + w_mid * iceAlbedoMid + w_trop * iceAlbedoTrop) / w_sum;
    } else {
        iceAlbedoEff = iceAlbedoPol;
    }
    const iceAlbedoSnowDeep = (w_sum > 0)
        ? (w_pol * iceAlbedoSnowDeepPolMid + w_mid * iceAlbedoSnowDeepPolMid + w_trop * iceAlbedoSnowDeepTrop) / w_sum
        : iceAlbedoSnowDeepPolMid;
    const iceAlbedoMeltProgress01 = Math.max(0, Math.min(1, (T_polar_K - 263.15) / 10.0));
    window._hystDiag.T_polar_C = T_polar_K - 273.15;
    window._hystDiag.T_midlat_C = T_midlat_K - 273.15;
    window._hystDiag.T_tropical_C = T_tropical_K - 273.15;
    window._hystDiag.iceAlbedoCold = iceAlbedoCold;
    window._hystDiag.iceAlbedoSnowDeep = iceAlbedoSnowDeep;
    window._hystDiag.iceAlbedoPol = iceAlbedoPol;
    window._hystDiag.iceAlbedoMid = iceAlbedoMid;
    window._hystDiag.iceAlbedoTrop = iceAlbedoTrop;
    window._hystDiag.iceAlbedoMelt = iceAlbedoMelt;
    window._hystDiag.f_global_ice = f_global_ice;
    window._hystDiag.iceAlbedoMeltProgress01 = iceAlbedoMeltProgress01;
    window._hystDiag.iceAlbedoEff = iceAlbedoEff;

    let weighted_albedo = 0;

    if (albedo_coeff) {
        weighted_albedo += volcano_surface * albedo_coeff['🪩🍰🎾'];
        weighted_albedo += ocean_surface * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += forest_surface * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += land_surface * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += desert_surface * albedo_coeff['🪩🍰🏜️'];
        // Glace pondérée par l'ensoleillement (EARTH.fractionGelee) : la part r de la glace présente quand le soleil
        // brille réfléchit à iceAlbedoEff ; le reste de l'année la surface est libre — surtout de la mer (glace de mer
        // saisonnière), d'où l'albédo de l'océan (approximation déclarée : la neige sur continent découvre la terre, 0,18).
        const r_ens = _iceTF.rapport_ensoleillement;
        weighted_albedo += ice_surface * (r_ens * iceAlbedoEff + (1 - r_ens) * albedo_coeff['🪩🍰🌊']);
        weighted_albedo += calotte_effective * albedo_coeff['🪩🍰❄️'];   // calottes permanentes : neige toute l'année
        window._hystDiag.calotteSurface = calotte_effective;
        window._hystDiag.rapportEnsoleillementGlace = r_ens;
    }

    albedo_base = weighted_albedo;

    let albedo = albedo_base;

    // « CONTRIBUTION H2O (GLACE) » RETIRÉE le 2026-10-13 (présente depuis V1.0.0) : elle tirait encore l'albédo vers celui
    // de la glace, au prorata de la masse de glace (🍰💧🧊), alors que la surface de glace (🍰🪩🧊) est DÉJÀ dans le
    // mélange des surfaces ci-dessus — la glace comptait deux fois (la seconde sans pondération par l'ensoleillement).
    // Nulle en snowball (surface déjà toute en glace), elle amplifiait la bascule aux états intermédiaires : sur 🦣,
    // rétroaction glace–albédo ~1,9 W/m²/K entre 16 et 8 °C, et plus aucun équilibre tempéré.

    // ── NUAGES (2026-10-13) : fraction MESURÉE, réflectance CALCULÉE (nuage adiabatique limité par la pluie) ─────────
    // Remplace : 🍰🪩⛅ = (CLOUD_FRACTION_BASE + CLOUD_FRACTION_INDEX_GAIN·☁️) × OPTICAL_EFF_BASE × Twomey × pression ×
    // oxydation × température, plafonnée à 0,75, avec une réflectance FIXE r_c = 0,42 — une « fraction optique » réglée.
    //   · f = fraction GÉOMÉTRIQUE du ciel couvert, MESURÉE (King et al. 2013, MODIS) : 0,72 sur océan, 0,55 sur
    //     continent, pondérée par l'océan libre. La dynamique 3D qui la fixe (subsidence, inversions, convection)
    //     n'a pas d'équation fermée en 1D ; deux essais physiques ont échoué (RADIATIVE.profilAtmosphere, en-tête nuage).
    //   · R = réflectance du nuage, deux-flux conservatif (Lacis & Hansen 1974) : R = √3(1−g)τ / (2 + √3(1−g)τ),
    //     τ = τ_SW du nuage adiabatique de la parcelle, de sa base jusqu'au rayon de pluie (RADIATIVE.colonneNuageuse) —
    //     MÊME eau, MÊMES rayons que l'opacité IR. Twomey et Albrecht sont dans τ (N des CCN) ; plus aucun facteur
    //     pression / oxydation / température. ☁️ (Sundqvist) ne pilote plus la couverture.
    // Colonne : vapeur, nuages bas (population de la base au rayon de pluie) et hauts (enclumes), fractions mesurées
    // (physics.js EARTH.NUAGES), puis transfert SOLAIRE (radiative/solaire.js : Lacis & Hansen pour Rayleigh, ozone et nuages,
    // Chou & Suarez 1999 pour la vapeur) et surface. L'albédo de surface `albedo` devient l'albédo au sommet de l'atmosphère.
    // Remplace l'addition à 2 couches sans atmosphère (v1.2.64).
    const sol = window.SOLAIRE.albedo(albedo, colonne);
    const cloud_fraction = sol.couverture;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    window._hystDiag.preCloudAlbedo = albedo;            // albédo de SURFACE
    window._hystDiag.albedoCielClair = sol.Aclair;       // au sommet, ciel clair
    window._hystDiag.albedoCielBas = sol.Abas;           // au sommet, nuages bas seuls (population)
    window._hystDiag.albedoCielHaut = sol.Ahaut;         // au sommet, nuages hauts seuls (population)
    window._hystDiag.colonneOzone = sol.ozone;
    window._hystDiag.tauNuageSW = colonne.tauSW;         // nuage le plus profond (au seuil de pluie)
    window._hystDiag.tauNuageIR = colonne.tauIR;
    window._hystDiag.eauNuage = colonne.W;
    window._hystDiag.cloudFraction = cloud_fraction;
    window._hystDiag.cloudCoeff = sol.Abas;
    if (CONFIG_COMPUTE.logCloudProxyDiagnostic) {
        const mCloud = '[nuages] epoch=' + DATA['📜']['🗿']
            + ' T_C=' + CONST.K2C(DATA['🧮']['🧮🌡️']).toFixed(2)
            + ' f=' + cloud_fraction.toFixed(3)
            + ' base=' + colonne.base.toFixed(0) + 'm sommet=' + colonne.sommet.toFixed(0) + 'm'
            + ' W=' + (1000 * colonne.W).toFixed(1) + 'g/m²'
            + ' τ_SW=' + colonne.tauSW.toFixed(2)
            + ' A_sol=' + albedo.toFixed(3) + ' A_clair=' + sol.Aclair.toFixed(3) + ' A_bas=' + sol.Abas.toFixed(3) + ' A_haut=' + sol.Ahaut.toFixed(3)
            + ' ccn=' + window._hystDiag.ccnRatio.toFixed(3);
        console.log(mCloud);
        window.debugMirrorConfigLogToFile('logCloudProxyDiagnostic', mCloud);
    }
    // 🪩🍰⛅ : albédo des nuages BAS vus du sommet (population, absorption comprise).
    DATA['🪩']['🪩🍰⛅'] = sol.Abas;
    albedo = sol.A;

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
    const A_eff = applyVeilToPlanetaryAlbedo01(final_albedo_with_water);
    if (!Number.isFinite(A_eff)) {
        throw new Error('[calculateAlbedo] albédo effectif (voile) non fini — A_geo=' + final_albedo_with_water);
    }
    DATA['🪩']['🍰🪩📿'] = A_eff;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    // Facteur corps-noir exposé : sans lui, le détail affiché (couverture × coefficient) ne peut pas
    // reproduire 🍰🪩📿 — une couche d'eau de 2 m sur une bille de roche ne réfléchit pas comme une banquise.
    DATA['🪩']['🍰🪩💧'] = blackbody_factor;
    // Albédo de glace EFFECTIF (moyenne zonale Briegleb, cf. iceAlbedoEff) — c'est lui qui entre dans A_geo,
    // pas le coefficient de config 🪩🍰🧊. Exposé pour que l'affichage montre le nombre réellement utilisé.
    DATA['🪩']['🪩🍰🧊'] = iceAlbedoEff;
    // ── Diagnostic hystérésis (stash) : albédo agrégé
    window._hystDiag.weightedAlbedoBase = weighted_albedo;
    window._hystDiag.finalAlbedo = final_albedo;
    window._hystDiag.blackbodyFactor = blackbody_factor;
    window._hystDiag.aEff = A_eff;
    // [v1.2.65] Journalisation par appel RETIRÉE (FNTRACE + DATA_DUMP JSON complet de DATA vers _logs/<onglet>.txt) :
    // c'était un diagnostic temporaire du 16/07 pour comparer test vs visu — cause trouvée (Δ(T) non monotone,
    // cf. v1.2.64). Elle sérialisait DATA à CHAQUE calculateAlbedo (plusieurs centaines par convergence) → fichiers
    // énormes et ralentissement. Les diagnostics gardés sont tous GATÉS par CONFIG_COMPUTE.log* (_logIceSnap ci-dessus,
    // logIceFractionDiagnostic, logCloudProxyDiagnostic…), false par défaut.
    return A_eff;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
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
    // 🔒 calculateAlbedo() renvoie 🍰🪩📿 = albédo effectif (A_geo + voile 🍰⚽) ; pas de second facteur 🍰🪩⚽
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    return solar_flux_average_wm * (1 - albedo);
}

// Diagnostics lus par le panneau hystérésis (CO2/html/hysteresis_compute.html) : rempli à chaque calculateAlbedo.
window._hystDiag = {};

var ALBEDO = window.ALBEDO = {};
ALBEDO.syncStratosphericVeil01 = syncStratosphericVeil01;
ALBEDO.applyVeilToPlanetaryAlbedo01 = applyVeilToPlanetaryAlbedo01;
ALBEDO.calculateAlbedo = calculateAlbedo;
ALBEDO.rapportCCN = rapportCCN;
ALBEDO.fractionMaritime = fractionMaritime;
ALBEDO.nombreGouttesActuelCm3 = nombreGouttesActuelCm3;
ALBEDO.nombreGouttesCm3 = nombreGouttesCm3;
ALBEDO.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
ALBEDO.calculateCloudFormationIndex = calculateCloudFormationIndex;
ALBEDO.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
ALBEDO.calculateGeologySurfaces = calculateGeologySurfaces;
// Expositions : tout passe par window.ALBEDO (doublons window.foo retirés).



