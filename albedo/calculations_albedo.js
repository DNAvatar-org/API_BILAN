// File: API_BILAN/albedo/calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.2.54
// Date: [April 24, 2026]
// logs :
// - v1.2.54: passage fraction_fonte LINÉAIRE → EXPONENTIELLE. Nouvelle formule : tau_eff = tauGlaceAns × iceInertiaFactor01 ; fraction_fonte = 1 − exp(−duree_ans/tau_eff). Rename CONFIG_COMPUTE.iceBlendRelaxation01 → iceInertiaFactor01 (cohérence sémantique : facteur multiplieur du temps caractéristique). Avantages : (1) intrinsèquement ∈ [0,1) (pas de clamp arbitraire qui écrête à 1 quand duree_ans dépasse tau × factor), (2) sémantique physique claire (half-life = ln(2) × tau_eff), (3) composable (cascades exp). factor=1.0 standard ; factor=0 → tau_eff=0 → fraction_fonte=1 (équilibre instantané, cas limite safe). Cf. configTimeline.js v1.4.28.
// - v1.2.53: verrou STATE.iceEpochFixedWaterState supprimé (user: "doit sauter", "virer le verrou tout le temps"). Le blend dt se ré-évalue désormais à CHAQUE pas (plus de garde epochId). T source = DATA['🧮']['🧮🌡️'] (T courante solver) au lieu de EPOCH['🌡️🧮'] (seed config) → feedback T→glace opérationnel dans scan hystérésis ⛄. Nouveau paramètre CONFIG_COMPUTE.iceBlendRelaxation01 (défaut 1.0) pour calibrer la temporalité sans désactiver brutalement le couplage (0.0 = blend off, 0.5 = amortissement Picard). STATE.iceEpochFixedState / iceDurationBlendState ne sont plus posés ici. Fix bug ⛄ : 🍰💧🧊 figé à 0.006 pendant tout le scan CO₂ à cause de calcGlaceEquilibre(T_seed=290K) verrouillé une fois. Ref : Hoffman & Schrag 2002 + Pierrehumbert 2005 (feedback glace-albédo doit suivre T dans la branche froide de la bifurcation).
// - v1.2.52: fix NaN cascade sulfate_boost — EPOCH['🧫'] sorti hors Math.min pour éviter 0×Infinity=NaN quand '⚖️🫧'=0 (⚫ Corps noir : pas d'atmosphère → 🍰🫧✈=⚖️✈/⚖️🫧=Infinity). Math.min(MAX, Infinity) = MAX (safe), mais Math.min(MAX, Infinity×0) = NaN (cascade via ccn_proxy → cloud_fraction → final_albedo). Nouveau : sulfate_boost = 1 + 🧫 × Math.min(MAX, 🍰🫧✈ × SCALE). Gate biosphère marine appliqué au *boost* (enhancement > 1.0), physiquement équivalent quand 🍰🫧✈ fini. Fix signalé par Zorba sur epoch-click setEpoch (main.js:2485).
// - v1.2.51: Briegleb étendu — seuil plateau α_snow_deep abaissé de −30°C → −10°C (Gardner & Sharp 2010 JGR 115:F01009 : α_fresh=0.84 à −10°C, standard CICE/CLM/MPAS-Seaice ; Flanner-Zender 2006 ; Domine 2008). 3 segments linéaires : [−∞,−10°C] plateau 0.85 ; [−10,−5°C] snow aging 0.85→0.70 ; [−5,0°C] melt pond onset 0.70→0.50 ; [0°C,+∞] melt 0.50. Effet : ⛄ Snowball atteignable dès T_pol ≤ −10°C (= T_glob ≤ +10°C avec amp 20 K) — active la rétroaction glace-albédo Pierrehumbert 2005 sur la gamme physique d'un scan hystérésis.
// - v1.2.50: sulfate_boost × EPOCH['🧫'] — gate biosphère MARINE sur le couplage DMS-CCN (hypothèse CLAW, Charlson-Lovelock-Andreae-Warren 1987 Nature 326:655). 🧫=0 (Hadéen/Corps noir) à 1 (moderne), avec 🧫=0.05 pour ⛄ Plein Snowball → DMS quasi-éteint sous banquise, couplage CCN-sulfate neutralisé, reste seul le sulfate volcanique direct. Lecture directe EPOCH['🧫'] sans fallback (regle-data-territoire.mdc : NaN-crash si clé absente). Couple avec configTimeline.js v1.4.25.
// - v1.2.49: plumbing 3e zone tropicale (physics.js v2.0.15) — ice_tf_trop + T_thresh_trop ajoutés aux logs diagnostics. Rétro-compat : `ICE_FORMULA_MAX_FRACTION × ice_temp_factor` devient `1.0 × ice_tf` (pas de changement API). La formule pol+mid+trop autorise Snowball (ice_tf → 1.0 quand T_glob < −4°C et que les 3 zones gèlent).
// - v1.2.48: ice_temp_factor UNIFIÉ — formule physiquement ancrée sur T_FREEZE_SEAWATER (fonte mer) + amplification polaire globale EARTH.POLAR_AMP_POL_K/MID_K (pas d'override par époque). Suppression des clés EPOCH['polarAmplificationK'/'midlatAmplificationK'] : constantes géophysiques (Terre-moderne), mêmes pour toutes les époques. Seuils : T_thresh_pol = T_FREEZE + dT_pol (≈18°C global) ; T_thresh_mid = T_FREEZE + dT_mid (≈3°C global). Correction du bug sémantique v1.2.47 où T_NO_POLAR_ICE_K (seuil global calibré à 20°C) était utilisé comme seuil LOCAL → ice_tf saturait toujours à 1.0 dans la plage utile.
// - v1.2.47: (déprécié par v1.2.48) amplification polaire epoch-spécifique.
// - v1.2.46: 3 zones latitudinales EBM 0D (Budyko-Sellers) — ice_temp_factor pondéré polaire/mi-latitude/tropiques. Rétroaction glace-albédo activée à T réaliste (T_glob − dT_pol < T_NO_POLAR_ICE_K).
// - v1.2.45: amplification polaire simple (T_K − POLAR_OFFSET) — remplacé par 3-zones en v1.2.46.
// - v1.2.44: expositions fonctions regroupées sous window.ALBEDO (doublons window.foo retirés). Ajout ALBEDO.updateLevelsConfig. Appelants migrés window.foo() → ALBEDO.foo() dans radiative/calculations.js, convergence/calculations_flux.js, ui/main.js, organigramme/organigramme.js.
// - v1.2.43: updateLevelsConfig — lecture directe DATA['⚖️']['⚖️🫧'] / DATA['🫧']['🧪'] (pas de const stale)
// - v1.2.42: diagnostics glace / albédo → pdTrace au lieu de pd
// - v1.2.41: CONFIG_COMPUTE.logIceFractionDiagnostic — journal chaîne complète vers 🍰🪩🧊 (polaire, mer gelée, verrous, surface finale)
// - v1.2.40: recherche HYSTERESIS.active — pas de verrou glace époque / gel polaire / rampe (🍰🪩🧊 suit T et CO₂ pour chute brutale)
// - v1.2.39: 🍰🪩📿 albédo effectif (voile inclus) ; 🧲☀️🔽 = S×(1−🍰🪩📿)
// - v1.2.36: clés lave 🍰🪩🎾 / 🪩🍰🎾 (ex-🍰🪩🌋 / 🪩🍰🌋) ; événement TIMELINE 🌋 inchangé
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
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
// - v1.2.30 : si 🍰🪩📿 final non fini (NaN/Inf) → throw explicite (pas de stockage silencieux dans DATA)
// - v1.2.31 : surface océanique réelle : si 📏🌊=0 (pas de colonne d’eau géométrique), éviter 0/0 → surface océanique 0 (ex. ⚫)
// - v1.2.32 : gel océan lissé (fonction de T), plus de bascule brutale ocean→glace (sans if d'époque)
// - v1.2.33 : conserve somme des surfaces (=1) après SEA_ICE_BLEND (fraction manquante → glace)
// - v1.2.34 : ice_impact_factor paramétrable via CONFIG_COMPUTE.iceImpactFactor01 (tests)
// - v1.2.35 : 🍰⚽ atténuation solaire absorbée en surface (événements 🌋 + jauge hyst) ; indép. τ LW nuages
// - v1.2.36 : clés DATA lave 🍰🪩🎾 / 🪩🍰🎾 (remplace 🌋 pour la fraction surface magmatique)
// - v1.2.37 : 🍰🪩⚽ dans DATA['🪩'] (puis aligné v1.2.38 : transmission = 1−🍰⚽) ; purge 🍰🪩🌋
// - v1.2.38 : 🍰⚽ obstruction, 🍰🪩⚽ = 1−🍰⚽ ; flux × transmission (priorité lecture 🍰⚽)
// - v1.2.46: ice_temp_factor — 3 zones latitudinales (Budyko-Sellers EBM 0D) : polaire (f=0.13, −20K) + mi-latitude (f=0.37, −5K) ; tropiques implicitement compensés (+9K). ice_temp_factor = moyenne pondérée normalisée des 2 zones froides. Remplace v1.2.45 mono-zone −15K qui causait gel immédiat à T_glob>20°C.
// - v1.2.45: ice_temp_factor — amplification polaire EBM 0D (Budyko-Sellers) : T_K_polar = T_K − CONFIG_COMPUTE.polarAmplificationK (défaut 15 K). Sans ce décalage, ice_temp_factor=0 à T_globale>20°C → rétroaction glace-albédo inactive, snowball impossible.
// - v1.2.39 : 🍰🪩📿 inclut voile (A_eff) ; calculateSolarFluxAbsorbed = S×(1−A_eff) sans double ×🍰🪩⚽
//
// FORMULES ALBEDO :
// A_geo = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🎾,🌊,🌳,🌍,🏜️,🧊} + contribution_glace + contribution_nuages
//   où contribution_glace = (🪩🍰🧊 - albedo_base) × min(🍰💧🧊 × support_hydrique, 🍰🪩🧊) × 0.5
//   et contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅
// 🍰🪩📿 (DATA) = 1 − (1−A_geo)(1−🍰⚽) après blackbody_factor sur A_geo
// 🍰🪩🎾 = volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)
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
    const A = Number(A_geom);
    if (!Number.isFinite(A)) return NaN;
    const a = Math.max(0, Math.min(1, A));
    const DATA = window.DATA;
    const w = DATA && DATA['🪩'];
    let obs = 0;
    if (w && Number.isFinite(w['🍰⚽'])) {
        obs = Math.max(0, Math.min(0.95, w['🍰⚽']));
    }
    return 1 - (1 - a) * (1 - obs);
}

// ============================================================================
// VOILE SW STRATOSPHÉRIQUE : 🍰⚽ (obstruction, source métier) ; 🍰🪩⚽ = 1−🍰⚽ (transmission)
// ============================================================================
function syncStratosphericVeil01(DATA) {
    if (!DATA || !DATA['📜']) return 0;
    if (!DATA['🪩']) DATA['🪩'] = {};
    const epochId = DATA['📜']['🗿'];
    const tl = window.TIMELINE;
    const idx = tl ? tl.findIndex(function (item) { return item['📅'] === epochId; }) : -1;
    const EPOCHv = idx >= 0 ? tl[idx] : null;
    const base = (EPOCHv && typeof EPOCHv['🍰⚽'] === 'number' && Number.isFinite(EPOCHv['🍰⚽'])) ? EPOCHv['🍰⚽'] : 0;
    const cum = (DATA['📜']['🔺🍰⚽'] != null && Number.isFinite(DATA['📜']['🔺🍰⚽'])) ? DATA['📜']['🔺🍰⚽'] : 0;
    const extra = (window.CONFIG_COMPUTE && Number.isFinite(window.CONFIG_COMPUTE.hystStratosphericVeilExtra01)) ? window.CONFIG_COMPUTE.hystStratosphericVeilExtra01 : 0;
    const obs = Math.min(0.95, Math.max(0, base + cum + extra));
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
// ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭
//   où 🍰🫧☔ = humidité relative (q/q_sat), 🍰💭 = CCN (0.3–1.0).
// À HR=98.9% : ☁️ ≈ 0.93 × 🍰💭. ☁️ n'utilise PAS 🍰🫧💧🌈 (cap. rad. IR, calculée ailleurs).
//
// Note : L'ancienne formule (🍰🫧💧/H2O_VAPOR_REF × f(T) × ...) n'est plus utilisée.

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

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
    DATA['🪩']['☁️'] = Math.max(0, Math.min(1, (1 - Math.pow(1 - Math.min(DATA['💧']['🍰🫧☔'], 1), 0.6)) * ccn_efficiency));
    
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

    syncStratosphericVeil01(DATA);

    // Héritage glaciaire vs réinitialisation géologique :
    // époques courtes → forte inertie (glace héritée), époques longues → proche équilibre à T_config.
    function calcGlaceEquilibre(T_K) {
        // Même logique que ice_temp_factor ci-dessous, mais utilisée pour blend héritage glaciaire (pas l'albédo instantané).
        // Régime 1 (T_K >= T_freeze) : calottes polaires ; max ~10% surface (highlands).
        //   Rampe linéaire pondérée par l'amplification polaire → seuil global T_thresh_pol = T_FREEZE + dT_pol.
        // Régime 2 (T_K <  T_freeze) : océan gèle → jusqu'à 90% surface en glace de mer, rampe sur 20 K.
        if (T_K >= EARTH.T_FREEZE_SEAWATER_K) {
            const T_thresh_pol = EARTH.T_FREEZE_SEAWATER_K + EARTH.POLAR_AMP_POL_K;
            const stock_factor = Math.max(0, Math.min(1, (T_thresh_pol - T_K) / EARTH.T_NO_POLAR_ICE_RANGE_K));
            return Math.max(0, Math.min(1, 0.1 * stock_factor));
        }
        const ocean_freeze_fraction = Math.min(1, Math.max(0, (EARTH.T_FREEZE_SEAWATER_K - T_K) / 20));
        return Math.max(0, Math.min(0.9, ocean_freeze_fraction * 0.9));
    }
    // v1.2.54 — Blend dt réévalué à CHAQUE pas (verrou iceEpochFixedWaterState supprimé).
    // Forme exponentielle : tau_eff = tauGlaceAns × iceInertiaFactor01
    //                       fraction_fonte = 1 − exp(−duree_ans / tau_eff), naturellement ∈ [0,1).
    //   • factor=1.0 → tau_eff = tauGlaceAns (temporalité géologique standard)
    //   • factor>1   → plus d'inertie (fonte/formation plus lente, tau_eff rallongé)
    //   • factor<1   → moins d'inertie (converge plus vite vers glace_equilibre)
    //   • factor=0   → tau_eff = 0 → fraction_fonte = 1 (équilibre instantané)
    // T source = T courante solver (permet feedback T→glace dans scan hystérésis).
    // Fallback seed config EPOCH['🌡️🧮'] uniquement si 🧮🌡️ absent (premier appel avant initDATA).
    const duree_ans = Math.abs(EPOCH['▶'] - EPOCH['◀']);
    const iceInertia = Math.max(0, Number.isFinite(CONFIG_COMPUTE.iceInertiaFactor01) ? CONFIG_COMPUTE.iceInertiaFactor01 : 1);
    const tau_eff = CONFIG_COMPUTE.tauGlaceAns * iceInertia;
    const fraction_fonte = (tau_eff > 0) ? (1 - Math.exp(-duree_ans / tau_eff)) : 1;
    const T_for_equil = (Number.isFinite(DATA['🧮']['🧮🌡️']) && DATA['🧮']['🧮🌡️'] > 0) ? DATA['🧮']['🧮🌡️'] : EPOCH['🌡️🧮'];
    const glace_equilibre = calcGlaceEquilibre(T_for_equil);
    DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1, DATA['💧']['🍰💧🧊'] * (1 - fraction_fonte) + glace_equilibre * fraction_fonte));
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    ALBEDO.calculateGeologySurfaces();
    
    // 🔒 ÉTAPE 1.5 : Calculer volcano_coverage depuis la température de base de l'époque
    // À 2100°C (2373K), tout est lave → volcano_coverage = 1.0
    // Transition progressive : T < 1000K → 0, T > 2373K → 1.0
    const volcano_coverage = Math.max(0, Math.min(1.0, (DATA['📅']['🌡️🧮'] - CONST.T_LAVA_START) / (CONST.T_LAVA_COMPLETE - CONST.T_LAVA_START)));
    
    // 🔒 ÉTAPE 2 : Calculer la couverture océanique réelle depuis la géologie + stocks d'eau
    // La surface océanique est limitée par la géologie ET par la quantité d'eau disponible
    // Si volcano_coverage = 1.0, alors ocean_coverage = 0 (pas de mer possible)
    const planet_surface_m2 = 4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2);
    
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
    const seaIceStrength01 = DATA['🎚️'].HYSTERESIS.seaIceStrength01;
    const seaIceFracRaw = seaIceRangeK > 0 ? Math.max(0, Math.min(1, (T_freeze - T_K) / seaIceRangeK)) : (T_K < T_freeze ? 1 : 0);
    const seaIceFrac = seaIceStrength01 * seaIceFracRaw;
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
    // ─── Amplification polaire 3 zones (EBM 0D) — v1.2.48 ───────────────────────
    // Appel à la FONCTION UNIQUE EARTH.computeIceTempFactor(T_glob_K) — définie dans physics.js.
    // Même source dans calculations_flux.js et calculations_h2o.js. Pas de duplication.
    // 🏷️ TUNING géophysique : dT_pol = 20 K, dT_mid = 5 K, RANGE = 20 K (Terre-moderne).
    // 🏷️ FLOU SCIENTIFIQUE : couplage obliquité / P_atm non activé (cf. physics.js).
    // ─────────────────────────────────────────────────────────────────────────────
    // Obliquité ε : lue sur l'objet epoch ('⚾'), sinon fallback CONFIG_COMPUTE.obliquityDeg (23.44°).
    const _epochObliquity = (EPOCH && Number.isFinite(Number(EPOCH['⚾']))) ? Number(EPOCH['⚾']) : undefined;
    const _iceTF = EARTH.computeIceTempFactor(
        DATA['🧮']['🧮🌡️'],
        _epochObliquity !== undefined ? { obliquity_deg: _epochObliquity } : undefined
    );
    const ice_temp_factor = _iceTF.ice_tf;
    const ice_tf_pol = _iceTF.tf_pol;
    const ice_tf_mid = _iceTF.tf_mid;
    const ice_tf_trop = _iceTF.tf_trop;  // v2.0.15 : 3e zone (physics.js)
    const T_thresh_pol = _iceTF.T_thresh_pol;
    const T_thresh_mid = _iceTF.T_thresh_mid;
    const T_thresh_trop = _iceTF.T_thresh_trop_high;
    // Debug topic-based : uniquement actif si DEBUG.setTopic('iceFactor') appelé (ou ?debug=iceFactor).
    if (typeof window !== 'undefined' && window.DEBUG && window.DEBUG.topic === 'iceFactor') {
        const _T_C = (DATA['🧮']['🧮🌡️'] - 273.15).toFixed(2);
        window.DEBUG.log(
            '[iceTF] epoch=' + (DATA['📜'] && DATA['📜']['🗿']) +
            ' T=' + _T_C + '°C' +
            ' ε=' + _iceTF.obliquity_deg.toFixed(2) + '° (×' + _iceTF.obliquity_factor.toFixed(3) + ')' +
            ' dT_pol=' + _iceTF.dT_pol + ' amp_pol=' + _iceTF.amp_pol.toFixed(2) +
            ' dT_mid=' + _iceTF.dT_mid + ' amp_mid=' + _iceTF.amp_mid.toFixed(2) +
            ' dT_trop=' + _iceTF.dT_trop + ' amp_trop=' + _iceTF.amp_trop.toFixed(2) +
            ' | tf_pol=' + _iceTF.tf_pol.toFixed(3) +
            ' tf_mid=' + _iceTF.tf_mid.toFixed(3) +
            ' tf_trop=' + _iceTF.tf_trop.toFixed(3) +
            ' -> ice_tf=' + _iceTF.ice_tf.toFixed(3)
        );
    }
    const planet_surface_area_m2 = 4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2);
    const global_water_layer_m = (DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / planet_surface_area_m2;
    let hydrosphere_surface_support = Math.max(0, Math.min(0.9, global_water_layer_m / 10));
    let ice_cap_surface = Math.max(DATA['🗻']['🍰🗻🏔'], hydrosphere_surface_support);
    let ice_fraction_target = Math.min(ice_cap_surface, EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor);
    const icePolarFormulaTarget = ice_fraction_target;

    // Mer gelée (lissé) : augmente le support/target de glace de manière progressive en fonction de seaIceFrac.
    // L'idée: quand l'océan gèle, la glace "optique" peut couvrir une large fraction sans tout convertir instantanément.
    if (hasOcean && seaIceFrac > 0) {
        hydrosphere_surface_support = Math.max(hydrosphere_surface_support, seaIceFrac);
        ice_cap_surface = Math.max(ice_cap_surface, seaIceFrac);
        ice_fraction_target = Math.max(ice_fraction_target, seaIceFrac);
    }
    const iceAfterSeaIceMerge = ice_fraction_target;

    if (!STATE.iceCoverageRampState || STATE.iceCoverageRampState.epochId !== DATA['📜']['🗿']) {
        STATE.iceCoverageRampState = { epochId: DATA['📜']['🗿'], value: ice_fraction_target };
    }
    const isConvergencePhase = (DATA['🧮']['🧮⚧'] === 'Search' || DATA['🧮']['🧮⚧'] === 'Dicho');
    // v1.2.53 : verrou albédo glace (iceEpochFixedAlbedoState) supprimé — plus posé par initForConfig.
    //           hasEpochIceLock reste défini pour préserver le flow des gardes ci-dessous (!hasEpochIceLock),
    //           mais vaut toujours false → dead code du bloc `if (hasEpochIceLock && !hystUnlockIce)`.
    const albedoFixedState = null;
    const hasEpochIceLock = false;
    // Scan CO₂ hystérésis : la glace doit suivre T (rétroaction albédo), sinon T ne peut pas chuter de ΔT_brut en un pas.
    const hystUnlockIce = typeof window !== 'undefined' && window.HYSTERESIS && window.HYSTERESIS.active;
    DATA['🪩']['🍰🪩🧊'] = ice_fraction_target;
    const freezeIceDuringSearch = CONFIG_COMPUTE.freezePolarIceDuringSearch !== false;
    const waterPass = (DATA['🧮'] && DATA['🧮']['🧮🔄🌊'] != null) ? DATA['🧮']['🧮🔄🌊'] : 0;
    const lock = STATE.iceCoverageLock;
    if (!hasEpochIceLock && freezeIceDuringSearch && !hystUnlockIce && isConvergencePhase && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿']) {
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, lock.value));
    }
    if (isConvergencePhase && !hystUnlockIce && DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampIters) && !hasEpochIceLock && !(freezeIceDuringSearch && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿'])) {
        const prevIce = STATE.iceCoverageRampState.value;
        const deltaIce = ice_fraction_target - prevIce;
        const rampStepActive = DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampEarlyIters) ? Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStepEarly) : Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStep);
        const deltaIceClamped = Math.max(-rampStepActive, Math.min(rampStepActive, deltaIce));
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, prevIce + deltaIceClamped));
    }
    STATE.iceCoverageRampState.value = DATA['🪩']['🍰🪩🧊'];
    const iceAfterLocksRamp = DATA['🪩']['🍰🪩🧊'];
    
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
    const relative_humidity = DATA['💧']['🍰🫧☔'];
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
        if (typeof window.pdTrace === 'function') {
            const STATE = window.STATE;
            const lock = (STATE && STATE.iceEpochFixedAlbedoState && STATE.iceEpochFixedAlbedoState.epochId === DATA['📜']['🗿'])
                ? STATE.iceEpochFixedAlbedoState.value
                : null;
            window.pdTrace(
                'alb',
                'calculations_albedo.js',
                'SEA_ICE_BLEND f=' + seaIceFrac.toFixed(3)
                    + ' rangeK=' + seaIceRangeK
                    + ' ep=' + DATA['📜']['🗿']
                    + ' phase=' + DATA['🧮']['🧮⚧']
                    + ' T_K=' + T_K.toFixed(2)
                    + ' lockA=' + (lock == null ? 'null' : Number(lock).toExponential(3))
            );
        }
    }
    const surface_sum = volcano_surface + ocean_surface + forest_surface + ice_surface + land_surface + desert_surface;
    if (Math.abs(surface_sum - 1.0) > 0.03) {
        console.warn(`⚠️ [calculateAlbedo] Somme surfaces=${surface_sum.toFixed(4)} -> normalisation`);
        console.warn(`   RAW: volcan=${volcano_surface.toFixed(4)} ocean=${ocean_surface.toFixed(4)} foret=${forest_surface.toFixed(4)} glace=${ice_surface.toFixed(4)} terre=${land_surface.toFixed(4)} desert=${desert_surface.toFixed(4)}`);
        console.warn(`   GEOL: 🍰🗻🌊=${DATA['🗻']['🍰🗻🌊'].toFixed(4)} 🍰🗻🏔=${DATA['🗻']['🍰🗻🏔'].toFixed(4)} 🍰🗻🌍=${DATA['🗻']['🍰🗻🌍'].toFixed(4)} ice_cap_surface=${ice_cap_surface.toFixed(4)} hydrosphere=${hydrosphere_surface_support.toFixed(4)}`);
        const scale = 1.0 / surface_sum;
        volcano_surface = volcano_surface * scale;
        ocean_surface = ocean_surface * scale;
        forest_surface = forest_surface * scale;
        ice_surface = ice_surface * scale;
        land_surface = land_surface * scale;
        desert_surface = desert_surface * scale;
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🎾'] = volcano_surface;
    DATA['🪩']['🍰🪩🌊'] = ocean_surface;
    DATA['🪩']['🍰🪩🌳'] = forest_surface;
    DATA['🪩']['🍰🪩🧊'] = ice_surface;
    DATA['🪩']['🍰🪩🌍'] = land_surface;
    DATA['🪩']['🍰🪩🏜️'] = desert_surface;
    if (Object.prototype.hasOwnProperty.call(DATA['🪩'], '🍰🪩🌋')) {
        delete DATA['🪩']['🍰🪩🌋'];
    }

    if (CONFIG_COMPUTE.logIceFractionDiagnostic) {
        const solI = DATA['🧮']['🧮🔄☀️'];
        const iceProdBare = EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor;
        const msg = '[calculateAlbedo][calculations_albedo.js] 🧊 ep=' + DATA['📜']['🗿']
            + ' phase=' + DATA['🧮']['🧮⚧']
            + ' T=' + T_K.toFixed(2) + 'K (' + (T_K - CONST.KELVIN_TO_CELSIUS).toFixed(2) + '°C)'
            + ' | T_freeze=' + T_freeze.toFixed(2) + ' seaRangeK=' + seaIceRangeK.toFixed(3)
            + ' seaRaw=' + seaIceFracRaw.toFixed(4) + ' seaF=' + seaIceFrac.toFixed(4)
            + ' | ice_temp_factor=' + ice_temp_factor.toFixed(4)
            + ' (tf_pol=' + ice_tf_pol.toFixed(3) + ' tf_mid=' + ice_tf_mid.toFixed(3) + ' tf_trop=' + ice_tf_trop.toFixed(3) + ')'
            + ' T_thresh_pol=' + T_thresh_pol.toFixed(2) + ' T_thresh_mid=' + T_thresh_mid.toFixed(2) + ' T_thresh_trop=' + T_thresh_trop.toFixed(2)
            + ' dTRange=' + EARTH.T_NO_POLAR_ICE_RANGE_K
            + ' ICEmax*factor=' + iceProdBare.toFixed(4)
            + ' | cap=' + ice_cap_surface.toFixed(4) + ' hydro=' + hydrosphere_surface_support.toFixed(4) + ' highland=' + DATA['🗻']['🍰🗻🏔'].toFixed(4)
            + ' | polarTarget=' + icePolarFormulaTarget.toFixed(4) + ' mergeSea=' + iceAfterSeaIceMerge.toFixed(4)
            + ' | afterLocks=' + iceAfterLocksRamp.toFixed(4) + ' iceSurfFinal=' + ice_surface.toFixed(4)
            + ' | hystUnlock=' + (hystUnlockIce ? '1' : '0') + ' epochIceLock=' + (hasEpochIceLock ? '1' : '0')
            + ' wPass=' + waterPass + ' solI=' + solI;
        if (typeof window.pdTrace === 'function') window.pdTrace('calculateAlbedo', 'calculations_albedo.js', msg);
        else console.log(msg);
    }

    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = { ...EARTH['🪩🍰'], ...(EPOCH['🪩🍰'] || {}) };

    // [EQ] Briegleb et al. (2004) — melt-pond sea ice albedo, ÉTENDU neige propre.
    // Réf : Briegleb B.P. et al., "Scientific description of the sea ice component in CCSM3",
    // NCAR/TN-463+STR, §5 ; Perovich (2002) SHEBA ; AR6 WG1 Annex VI (Cryosphere).
    // Seuil plateau snow_deep mis à jour de −30°C → −10°C suite à :
    //   Gardner & Sharp (2010) JGR 115:F01009 — α_fresh=0.84 à T=−10°C, chute linéaire 0.84→0.73 entre
    //     −10°C et 0°C. Paramétrisation standard CICE/CLM/MPAS-Seaice.
    //   Flanner & Zender (2006) J. Climate 19:5141 — grain growth rapide > −10°C, lent < −15°C.
    //   Domine et al. (2008) ACP 8:171 — SSA (specific surface area) de la neige de surface reste
    //     élevée à T < −15°C, chute rapide à T > −10°C.
    //   Warren & Wiscombe (1980) J. Atmos. Sci. 37:2734 — α pristine snow 0.85-0.90 (sans seuil T strict).
    // 3 segments (T_polaire croissante) :
    //   T_pol ≤ −10 °C : neige propre / fine-grain → α_snow_deep = EARTH['🪩🍰']['🪩🍰❄️'] (~0.85).
    //   −10 < T_pol ≤ −5 °C : métamorphisme thermique actif, α_snow_deep → α_cold (snow→firn).
    //   −5 < T_pol < 0 °C  : onset melt pond, α_cold → α_melt (Perovich 2002).
    //   T_pol ≥ 0 °C        : bare ice + melt ponds → α_melt = 0.50 (SHEBA, CICE default).
    // Feedback positif : T↓ → α↑ → T↓↓ (rétroaction glace-albédo, pilier du snowball Pierrehumbert 2005).
    //
    // Amplification polaire Budyko-Sellers (EBM 0D) : T_polaire = T_globale − polarAmplificationK.
    // Source de vérité GLOBALE : CONFIG_COMPUTE.polarAmplificationK (= EARTH.POLAR_AMP_POL_K, 20 K Earth-modern).
    // Pas d'override par époque (faire de la physique, pas du patch) — modulation par obliquité ⚾ uniquement,
    // via computeIceTempFactor dans physics.js (Laskar 1993, Williams 1993 EPSL 117:377).
    // Réf : Budyko (1969) Tellus 21:611, Sellers (1969) J. Appl. Meteor. 8:392 ; AR6 WG1 Ch.4 Arctic Amp ;
    // Holland & Bitz (2003) Clim. Dyn. 21:221 ; Pierrehumbert 2011 ch.5.
    const T_polar_K = DATA['🧮']['🧮🌡️'] - window.CONFIG_COMPUTE.polarAmplificationK;
    const iceAlbedoCold = albedo_coeff['🪩🍰🧊'];                 // ~0.70 (sea ice saisonnière, CCSM3)
    const iceAlbedoSnowDeep = albedo_coeff['🪩🍰❄️'];             // ~0.85 (neige propre Gardner-Sharp 2010)
    const iceAlbedoMelt = 0.50;                                   // bare ice + melt ponds (SHEBA)
    let iceAlbedoEff;
    if (T_polar_K <= 263.15) {
        // ≤ −10 °C : neige propre / pristine snow (plateau Gardner-Sharp 2010)
        iceAlbedoEff = iceAlbedoSnowDeep;
    } else if (T_polar_K <= 268.15) {
        // −10 → −5 °C : métamorphisme thermique → snow aging
        const t = (T_polar_K - 263.15) / 5.0;
        iceAlbedoEff = iceAlbedoSnowDeep + (iceAlbedoCold - iceAlbedoSnowDeep) * t;
    } else if (T_polar_K < 273.15) {
        // −5 → 0 °C : melt pond onset (Perovich 2002)
        const t = (T_polar_K - 268.15) / 5.0;
        iceAlbedoEff = iceAlbedoCold + (iceAlbedoMelt - iceAlbedoCold) * t;
    } else {
        // ≥ 0 °C : bare ice + melt ponds
        iceAlbedoEff = iceAlbedoMelt;
    }
    const iceAlbedoMeltProgress01 = Math.max(0, Math.min(1, (T_polar_K - 263.15) / 10.0));  // rétro-compat diag
    // ── Diagnostic hystérésis (stash) : glace
    window._hystDiag = window._hystDiag || {};
    window._hystDiag.T_polar_C = T_polar_K - 273.15;
    window._hystDiag.iceAlbedoCold = iceAlbedoCold;
    window._hystDiag.iceAlbedoSnowDeep = iceAlbedoSnowDeep;
    window._hystDiag.iceAlbedoMeltProgress01 = iceAlbedoMeltProgress01;
    window._hystDiag.iceAlbedoEff = iceAlbedoEff;

    let weighted_albedo = 0;

    if (albedo_coeff) {
        weighted_albedo += volcano_surface * albedo_coeff['🪩🍰🎾'];
        weighted_albedo += ocean_surface * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += forest_surface * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += land_surface * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += desert_surface * albedo_coeff['🪩🍰🏜️'];
        weighted_albedo += ice_surface * iceAlbedoEff;
    }

    albedo_base = weighted_albedo;

    let albedo = albedo_base;

    // 🔒 CONTRIBUTION H2O (GLACE) : Calculée séparément, n'affecte PAS la somme des surfaces
    // Mais elle doit rester bornée par le support de surface réellement disponible :
    // une masse d'eau infime ne doit pas produire un gros albédo global juste parce que 🍰💧🧊 = 1.
    const ice_albedo = iceAlbedoEff;
    const ice_fraction_stock = Math.min(1.0, Math.max(0, DATA['💧']['🍰💧🧊']));
    // 🏷️ Source unique : DATA['🎚️'].HYSTERESIS.iceImpactFactor01 (initDATA.js + FINE_TUNING_BOUNDS).
    // Règle regle-data-territoire : pas de fallback ni Number.isFinite.
    const ice_impact_factor = DATA['🎚️'].HYSTERESIS.iceImpactFactor01;
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
        // 🧫 = facteur biosphère MARINE (gate CLAW) — symétrique de 🌱 (biosphère terrestre).
        // Réf. princeps : Charlson, Lovelock, Andreae & Warren (1987) Nature 326:655-661
        //   "Oceanic phytoplankton, atmospheric sulphur, cloud albedo and climate" (hypothèse CLAW).
        // Chaîne physique proxy (4 étages) :
        //   1. Phytoplancton marin (⇐ EPOCH['🧫']) émet du diméthylsulfure (DMS) par catabolisme du DMSP.
        //   2. DMS → SO₂ → acide sulfurique H₂SO₄ par oxydation atmosphérique (OH, BrO).
        //   3. Sulfate (DATA['🫧']['🍰🫧✈']) nuclée des CCN marins de taille sous-micrométrique.
        //   4. CCN ↑ ⇒ nombre de gouttelettes ↑ ⇒ rayon effectif ↓ ⇒ albédo nuageux ↑ (Twomey 1977).
        // Refs complémentaires : Andreae & Crutzen 1997 (Science 276:1052), Vallina & Simó 2007 (Science
        // 315:506), Quinn & Bates 2011 (Nature 480:51, critique amplitude CLAW), Kloster 2006
        // (J. Geophys. Res.), Woodhouse 2010 (ACP 10:7545).
        // Paléo : Knoll 2003 Life on a Young Planet ; Falkowski 2004 Science 305:354 (évolution
        // plancton marin) ; Knoll & Follows 2016 Proc. R. Soc. B 283:20161755.
        //
        // Justification ⛄ Néoprotérozoïque (-735 Ma) : l'océan est gelé (glace de mer globale),
        // le plancton photosynthétique est quasi-absent de la colonne d'eau sous la banquise, et
        // les eucaryotes marins n'ont pas encore pleinement diversifié (avant radiation Cambrienne).
        // → 🧫 ≈ 0.05 : quasi-éteint le couplage DMS-CCN, seul reste le sulfate volcanique direct.
        //
        // C'est un PROXY paramétrique (pas de modèle DMS/DMSP dynamique couplé à la bio marine).
        // On peut donc jouer dessus sans remords — ajuster 🧫 pour chaque époque selon la paléo-
        // abondance plausible du plancton marin (0=stérile, 1=moderne pleinement opérationnel).
        //
        // NaN-crash policy : EPOCH['🧫'] lu sans fallback — si absent → NaN → crash explicite
        // (regle-data-territoire.mdc : pas de Number.isFinite guard, on veut savoir si ça manque).
        // Note v1.2.52 : EPOCH['🧫'] sorti hors du Math.min pour éviter 0 × Infinity = NaN
        // quand '⚖️🫧' = 0 (⚫ Corps noir, pas d'atmosphère) : 🍰🫧✈ = ⚖️✈/⚖️🫧 → Infinity,
        // Math.min(MAX, Infinity) = MAX (safe), mais Math.min(MAX, Infinity × 0) = NaN (cascade).
        // Le gate biosphère marine s'applique au *boost* (enhancement au-dessus de 1.0), pas à la
        // fraction sulfate elle-même — physiquement équivalent quand 🍰🫧✈ est fini.
        const sulfate_boost = (EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR)
            ? (1.0 + EPOCH['🧫'] * Math.min(DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_MAX, DATA['🫧']['🍰🫧✈'] * DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_SCALE))
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
        // [EQ] Hu & Stamnes (1993) — partition phase liquide/glace des nuages.
        // Réf : Hu Y.X. & Stamnes K., J. Climate 6, 728–742. Paramétrisation standard (CAM, CICE, AR6).
        // f_liq = 1 pour T ≥ 273.15 K (nuages liquides : gouttelettes ~10-15 μm, SW efficace ~1.0)
        // f_liq = 0 pour T ≤ 233.15 K (nuages glace : cristaux ~30-50 μm, SW efficace ~0.6)
        // Transition linéaire dans [-40°C, 0°C] ; plus de bornes arbitraires MIN/MAX.
        const f_liq = Math.max(0, Math.min(1, (DATA['🧮']['🧮🌡️'] - 233.15) / 40.0));
        const temp_factor = f_liq * 1.0 + (1 - f_liq) * 0.6;

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
        // ── Diagnostic hystérésis (stash) : nuages
        window._hystDiag = window._hystDiag || {};
        window._hystDiag.cloudIndex = cloud_index;
        window._hystDiag.ccnProxy = ccn_proxy;
        window._hystDiag.ccnRefModern = ccn_ref_modern;
        window._hystDiag.ccnRatio = ccn_ratio;
        window._hystDiag.sulfateBoost = sulfate_boost;
        window._hystDiag.anthroFactor = anthro_factor;
        window._hystDiag.pressureFactor = pressure_factor;
        window._hystDiag.oxidationFactor = oxidation_factor;
        window._hystDiag.tempFactor = temp_factor;
        window._hystDiag.fLiq = f_liq;
        window._hystDiag.cloudOptEff = cloud_optical_efficiency;
        window._hystDiag.cloudFraction = cloud_fraction;
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
    // 🍰🪩📿 = 🍰🪩⛅ × 🪩🍰⛅ + Σ(🍰🪩❀ × 🪩🍰❀) | ❀ ∈ { 🎾,🌊,🌳,🏜️,🧊 }
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
    const A_eff = applyVeilToPlanetaryAlbedo01(final_albedo_with_water);
    if (!Number.isFinite(A_eff)) {
        throw new Error('[calculateAlbedo] albédo effectif (voile) non fini — A_geo=' + final_albedo_with_water);
    }
    DATA['🪩']['🍰🪩📿'] = A_eff;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    // ── Diagnostic hystérésis (stash) : albédo agrégé
    window._hystDiag = window._hystDiag || {};
    window._hystDiag.weightedAlbedoBase = weighted_albedo;
    window._hystDiag.finalAlbedo = final_albedo;
    window._hystDiag.blackbodyFactor = blackbody_factor;
    window._hystDiag.aEff = A_eff;
    return A_eff;
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
    // 🔒 calculateAlbedo() renvoie 🍰🪩📿 = albédo effectif (A_geo + voile 🍰⚽) ; pas de second facteur 🍰🪩⚽
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    return solar_flux_average_wm * (1 - albedo);
}

var ALBEDO = window.ALBEDO = window.ALBEDO || {};
ALBEDO.syncStratosphericVeil01 = syncStratosphericVeil01;
ALBEDO.applyVeilToPlanetaryAlbedo01 = applyVeilToPlanetaryAlbedo01;
ALBEDO.calculateAlbedo = calculateAlbedo;
ALBEDO.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
ALBEDO.calculateCloudFormationIndex = calculateCloudFormationIndex;
ALBEDO.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
ALBEDO.calculateGeologySurfaces = calculateGeologySurfaces;
// Expositions : tout passe par window.ALBEDO (doublons window.foo retirés).

function updateLevelsConfig() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const isCorpsNoir = DATA['📜']['🗿'] === '⚫';
    
    // Initialiser CO2 depuis EPOCH
    let co2_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🏭'] > 0) {
        const co2_fraction = window.ATM.co2KgToFraction(EPOCH['⚖️🏭'], DATA['⚖️']['⚖️🫧'], DATA['🫧']['🧪']);
        co2_ppm = co2_fraction * 1e6;
    }
    
    // Initialiser CH4 depuis EPOCH
    let ch4_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🐄'] > 0) {
        const ch4_fraction = window.ATM.ch4KgToFraction(EPOCH['⚖️🐄'], DATA['⚖️']['⚖️🫧'], DATA['🫧']['🧪']);
        ch4_ppm = ch4_fraction * 1e6;
    }
    
    // Initialiser H2O : ⚖️💧 = eau totale (océans), pas vapeur. Utiliser DATA['💧']['🍰🫧💧'] si dispo, sinon 0.
    let h2o_percent = 0;
    if (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null && DATA['💧']['🍰🫧💧'] > 0) {
        h2o_percent = DATA['💧']['🍰🫧💧'] * 100;
    }
    
    // Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    if (window.UI_STATE.maximiseData) {
        const savedCO2 = window.UI_STATE.savedCO2;
        const savedCH4 = window.UI_STATE.savedCH4;
        const savedH2O = window.UI_STATE.savedH2O;
        co2_ppm = Math.max(savedCO2, co2_ppm);
        ch4_ppm = Math.max(savedCH4, ch4_ppm);
        h2o_percent = Math.max(savedH2O, h2o_percent);
    }
    
    // Mettre à jour plotData
    if (typeof plotData !== 'undefined') {
        plotData.co2_ppm = co2_ppm;
        plotData.ch4_ppm = ch4_ppm;
    }
    
    // Mettre à jour window.RUNTIME_STATE.h2oVaporPercent
    window.RUNTIME_STATE.h2oVaporPercent = h2o_percent;
    window.RUNTIME_STATE.h2oTotalFromMeteorites = 0;
    
    const h2o_total_kg = DATA['⚖️']['⚖️💧'];
    if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logLevelsConfig) {
        console.log('📛 [updateLevelsConfig] 🏭=' + co2_ppm.toFixed(0) + 'ppm 🍰🫧💧(initUI)=' + h2o_percent.toFixed(1) + '% 🐄=' + ch4_ppm.toFixed(0) + 'ppm ⚖️💧=' + h2o_total_kg.toExponential(2) + 'kg');
    }
}

ALBEDO.updateLevelsConfig = updateLevelsConfig;

