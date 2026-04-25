// File: API_BILAN/radiative/calculations.js - Calculs de transfert radiatif
// Desc: Module de calculs radiatifs
// Version 1.3.5
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// - v1.3.5: miroir debugMirrorConfigLogToFile('logEdsDiagnostic', …) des lignes DIAG CO2 / workers / performDichotomy → _logs/eds.txt
// - v1.3.4: workers dispatch/done + début performDichotomy + max-iter — logs uniquement si CONFIG_COMPUTE.logEdsDiagnostic
//   (évite console sur chaque calculateFluxForT0 quand debugAPI/UI_STATE est false).
// - v1.3.3: calculateFluxForT0 — throw si intégrale OLR (total_flux) non finie + index du 1er bin NaN/λ
//   (même T solaire/entrant finis — cause typique: chaîne P(z)/n_air ou workers ; ATM v1.2.3 factorTropopause).
// - v1.3.2: temperatureAtZ revient au gradient effectif historique (EPOCH.lapse_rate ou −g/Cp).
//   Le test 0.0065 global refroidissait 2000 en réduisant l'absorption via airNumberDensityAtZ.
// - v1.3.1: Gradient troposphérique lu depuis CONFIG_COMPUTE.troposphericLapseRateKPerM afin d'aligner
//   la structure thermique radiative avec calculateTropopauseHeight() (WMO / U.S. Standard Atmosphere).
// - v1.3.0: intégration EARTH.CH4_EDS_SCALE (Haqq-Misra 2008) en parallèle de H2O_EDS_SCALE. Passé au dispatch des workers (spectral_slice_worker v1.0.X + worker_pool). Également appliqué dans calculateRadiativeCapacities (capacité IR normalisée CH4). Défaut 1.0 = HITRAN native, tunable [0.3, 1.5] pour caler EDS_CH4 sur littérature (saturation bandes 3.3/7.7 µm, overlap H2O). Seuil haze Haqq-Misra CH4/CO2 > 0.1 documenté dans physics.js mais pas encore câblé côté SW.
// - v1.2.9: expositions regroupées sous nouveau namespace window.RADIATIVE (getSpectralResultFromDATA, calculateRadiativeCapacities, temperatureAtZ, simulateRadiativeTransfer). Doublons window.foo retirés. Consommateurs migrés : convergence/calculations_flux.js, sync_panels.js, ui/main.js, atmosphere/calculations_atm.js, doc/epoch_bench.html. Appels H2O/ALBEDO/ATM/GEOLOGY/CLIMATE migrés vers namespaces correspondants.
// - v1.2.8: calculateFluxForT0 — retrait du fallback silencieux voie série (111 lignes). Si spectralWorkerPool absent/non-ready → throw (crash-first). Cause historique scie 15.28°C vs bench 15.35°C (📱 2000) : scie/visu (index.html) n'avait pas workers/worker_pool.js dans loader_panels.js → silencieusement voie série, ordre addition float différent (0.115 W/m² sur 348 W/m²). Fix loader : v1.1.19.
// - v1.2.7: waterVaporMixingRatio + waterVaporFractionAtZ utilisent window.PHYS.computeH2OScaleHeight() (= R·T²/(L·Γ), dépend T et g_epoch). Remplace la constante EARTH.H2O_SCALE_HEIGHT_M (retirée) pour couvrir Hadéen (P, T extrêmes). Voir physics.js v2.0.12.
// - v1.2.6: waterVaporMixingRatio + waterVaporFractionAtZ utilisent EARTH.H2O_SCALE_HEIGHT_M (=2200 m, Clausius-Clapeyron effectif) au lieu de R·T/(M_H2O·g) (≈13,6 km, hydrostatique pur — irréaliste car H₂O condense avec T(z), surestimait PWV ×2,6 et τ_H₂O d'autant).
// - v1.2.5: retrait recalcul dynamique EARTH.H2O_EDS_SCALE (0.92·√P_ratio·CO2_factor) — double-comptait pressure broadening HITRAN. Valeur pilotée par FINE_TUNING_BOUNDS.RADIATIVE.H2O_EDS_SCALE via tuning.js (sync SCIENCE bary).
// - v1.1.9: plafond couches (maxLayersConvergence 800) + sous-échantillonnage stockage (max 400×600 en DATA) pour limiter RAM
// - v1.2.0: format 3-flottants-par-λ (flux_init, ychange, flux_final) — supprime 4 matrices nZ×nL (×800 moins RAM) ; reconstruction 100 lignes dans getSpectralResultFromDATA
// - v1.2.1: 🔬🌈 absent/NaN → fallback bins (CONFIG maxSpectralBinsConvergence) ; calculateRadiativeCapacities sans lambda_range → no-op (capacités 0)
// - v1.2.2: getSpectralResultFromDATA — effective_temperature : si total_flux≤0 ou absent, même repli T_surface que sync_panels (évite null après Object.assign → plot)
// - v1.2.3: calculateRadiativeCapacities crash-first : suppression gardes isFinite dans kappa_CO2/H2O/CH4 (masquage silencieux de NaN en 0 → capacités 🌈 toujours nulles)
// - v1.2.4: calculateRadiativeCapacities — sonde firstBad {lambda,z,n_air,kappa,...} → __RAD_CAP_LAST_DBG__ pour localiser la 1re δτ non-finie ou négative (cause integral=-Infinity)
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
    const z_trop = window.ATM.calculateTropopauseHeight();
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
    const r0 = r0_override !== null ? r0_override : DATA['💧']['🍰🫧💧'];
    // H_vap = R·T²/(L·Γ) : dépend de T courant + g de l'époque. Voir physics.js v2.0.12.
    const H_H2O = window.PHYS.computeH2OScaleHeight();
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
    if (!DATA['🔘']['🔘💧📛']) return 0;

    // 🔒 Ne pas appeler calculateWaterPartition ici : appelé une fois par le caller (calculateH2OParameters avant calculateFluxForT0)
    // H_vap = R·T²/(L·Γ) — voir physics.js v2.0.12.
    const H_H2O = window.PHYS.computeH2OScaleHeight();
    return DATA['💧']['🍰🫧💧'] * Math.exp(-z / H_H2O);
}

// ════════════════════════════════════════════════════════════════════════════
// MT_CKD H₂O continuum (Mlawer et al. 2012 JQSRT v3.5 — paramétrique simplifié)
// ════════════════════════════════════════════════════════════════════════════
// PWV (Precipitable Water Vapor) [kg/m²] : intégrale de la densité massique H₂O.
//   ∫ ρ_H₂O(z) dz = ∫ n_air(z) × r(z) × M_H₂O / N_A dz
// Avec n_air(z) = n_0·exp(-z/H_air) et r(z) = r_0·exp(-z/H_H₂O) :
//   PWV = n_0 × r_0 × M_H₂O × k_B / R_GAS × H_eff   où H_eff = 1/(1/H_air + 1/H_H₂O)
// (k_B / R_GAS = 1/N_A ; on exprime sans Avogadro explicite)
function computePWV() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const r0 = DATA['💧'] && DATA['💧']['🍰🫧💧'];
    if (!Number.isFinite(r0) || r0 <= 0) return 0;
    const T = DATA['🧮'] && DATA['🧮']['🧮🌡️'];
    if (!Number.isFinite(T) || T <= 0) return 0;
    const M_air = (DATA['🫧'] && Number.isFinite(DATA['🫧']['🧪']) && DATA['🫧']['🧪'] > 0)
        ? DATA['🫧']['🧪'] : 0.02897;
    const epoch_idx = DATA['📜'] && DATA['📜']['👉'];
    const g = (window.TIMELINE && epoch_idx != null && window.TIMELINE[epoch_idx])
        ? window.TIMELINE[epoch_idx]['🍎'] : 9.81;
    const H_air = (CONST.R_GAS * T) / (M_air * g);
    const H_H2O = window.PHYS.computeH2OScaleHeight();
    if (!Number.isFinite(H_air) || H_air <= 0 || !Number.isFinite(H_H2O) || H_H2O <= 0) return 0;
    const H_eff = 1 / (1 / H_air + 1 / H_H2O);
    const n_air_0 = window.ATM.airNumberDensityAtZ(0);
    if (!Number.isFinite(n_air_0) || n_air_0 <= 0) return 0;
    // column [molec/m²] = n_air_0 × r_0 × H_eff ; mass [kg/m²] = column × M_H₂O / N_A ; N_A = R_GAS / k_B
    const PWV = n_air_0 * r0 * CONST.M_H2O * CONST.BOLTZMANN_KB * H_eff / CONST.R_GAS;
    return Math.max(0, PWV);
}

// MT_CKD continuum trap [W/m²] — Mlawer et al. 2012 JQSRT v3.5, forme paramétrique.
// trap = SCALE × PWV[g/cm²]² × (T_REF/T)^EXP × (P_total/P_ref)
//   - PWV² : self-broadening dominant (continuum self-mediated, fenêtre 8–12 µm)
//   - (T_REF/T)^4.25 : dépendance T moments dipolaires liés (Mlawer 2012)
//   - P_ratio : foreign-broadening linéaire en P, normalisé 1 atm
// Désactivé par défaut (EARTH.MT_CKD_ENABLED = false). Calibration : voir physics.js.
function computeMtCkdContinuumTrap() {
    const EARTH = window.EARTH;
    if (!EARTH || !EARTH.MT_CKD_ENABLED) return 0;
    const DATA = window.DATA;
    const T = DATA['🧮'] && DATA['🧮']['🧮🌡️'];
    if (!Number.isFinite(T) || T <= 0) return 0;
    const PWV_kg_m2 = computePWV();
    const PWV_g_cm2 = PWV_kg_m2 / 10;  // 1 kg/m² ≡ 0.1 g/cm²
    if (!(PWV_g_cm2 > 0)) return 0;
    const P_atm_Pa = window.ATM.pressureAtZ(0);
    const P_ref = (window.CONV && window.CONV.STANDARD_ATMOSPHERE_PA) || 101325;
    const P_ratio = (Number.isFinite(P_atm_Pa) && P_atm_Pa > 0) ? P_atm_Pa / P_ref : 1;
    const T_factor = Math.pow(EARTH.MT_CKD_T_REF_K / T, EARTH.MT_CKD_T_EXPONENT);
    const SCALE = Number.isFinite(EARTH.MT_CKD_SCALE) ? EARTH.MT_CKD_SCALE : 1.71;
    const trap = SCALE * PWV_g_cm2 * PWV_g_cm2 * T_factor * P_ratio;
    // Borne anti-emballement : aux T extrêmes (Hadéen 500 K + PWV énorme), PWV² peut diverger.
    // 80 W/m² ≈ 5× valeur Terre moderne, marge confortable.
    return Math.max(0, Math.min(80, trap));
}

// Exposer pour debug, plot, sync_panels.
if (typeof window !== 'undefined') {
    window.RADIATIVE = window.RADIATIVE || {};
    window.RADIATIVE.computePWV = computePWV;
    window.RADIATIVE.computeMtCkdContinuumTrap = computeMtCkdContinuumTrap;
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
    const z_trop_raw = window.ATM.calculateTropopauseHeight();
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
        const rawBins = DATA['🧮'] != null ? DATA['🧮']['🔬🌈'] : undefined;
        const nBinsFromData = Number(rawBins);
        const fallbackBins = Math.max(24, Math.min(maxAllowedBins, 500));
        let expected_points = (Number.isFinite(nBinsFromData) && nBinsFromData >= 1)
            ? Math.max(2, Math.min(nBinsFromData, 10000))
            : fallbackBins;
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
    const z_trop = window.ATM.calculateTropopauseHeight();
    const Gamma = -window.CONFIG_COMPUTE.troposphericLapseRateKPerM; // Gradient de température, K/m

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
        const n_co2_surface = window.ATM.airNumberDensityAtZ(0) * DATA['🫧']['🍰🫧🏭'];
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
        const mK1 = '[DIAG CO2] kappa_max modèle @15µm : ' + kappa_co2_modele.toExponential(3) + ' m⁻¹';
        const mK2 = '[DIAG CO2] kappa_max théorique @15µm : ' + kappa_co2_theorique.toExponential(3) + ' m⁻¹';
        const mK3 = '[DIAG CO2] ratio modèle/théorie : ' + ratio_modele_theorie.toFixed(3);
        const mK4 = '[DIAG CO2] bins dans bande 13-17µm : ' + diag_co2.length + ' (sur ' + lambda_range.length + ' total)';
        console.log(mK1);
        console.log(mK2);
        console.log(mK3);
        console.log(mK4);
        if (typeof window.debugMirrorConfigLogToFile === 'function') {
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', 'console.table diag_co2 (rows=' + diag_co2.length + ')');
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK1);
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK2);
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK3);
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK4);
        }
    }

    // EARTH.H2O_EDS_SCALE : paramètre fine-tuning (FINE_TUNING_BOUNDS.RADIATIVE.H2O_EDS_SCALE, baryGroup SCIENCE)
    // Propagé par tuning.js → syncRadiativeConfig(). Ex-recalcul dynamique 0.92·√P_ratio·CO2_factor retiré (double-comptait le pressure broadening déjà dans HITRAN).
    const h2o_eds_scale = EARTH.H2O_EDS_SCALE;
    // EARTH.CH4_EDS_SCALE : parallèle à H2O_EDS_SCALE. Défaut 1.0 (line-by-line HITRAN + √(P/P_ref) natif).
    // Pilotable via FINE_TUNING_BOUNDS.RADIATIVE.CH4_EDS_SCALE (si exposé) pour caler sur cible Haqq-Misra 2008.
    const ch4_eds_scale = (EARTH.CH4_EDS_SCALE != null && Number.isFinite(EARTH.CH4_EDS_SCALE)) ? EARTH.CH4_EDS_SCALE : 1.0;

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
        const n_air_log = window.ATM.airNumberDensityAtZ(z_log);
    // Logs désactivés pour réduire la taille

    // ⚡ OPTIMISATION : Boucle avant tropopause (T varie avec z)
    const usePressureBroadening = window.CONFIG_COMPUTE.pressureBroadening;
    const P_REF = CONV.STANDARD_ATMOSPHERE_PA;

    // ── Dispatch parallèle OBLIGATOIRE (Transferable, N-1 workers) ──────────────────
    // Pré-requis strict : workers/worker_pool.js chargé (scie/visu via loader_panels.js, bench via epoch_bench.html).
    // Ancienne voie série retirée : désynchro numérique silencieuse (ordre d'addition float) → scie 15.28°C vs bench 15.35°C
    // pour même config (📱 2000). Crash-first ici pour éviter que ça se reproduise.
    if (!window.spectralWorkerPool || !window.spectralWorkerPool.ready) {
        throw new Error('[calculateFluxForT0] spectralWorkerPool absent ou non-ready. Vérifier chargement API_BILAN/workers/worker_pool.js dans le loader.');
    }
    {
        if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
            const mWd = '⚙️ [workers] dispatch ' + lambda_range.length + ' bins × ' + z_range.length + ' layers → ' + window.spectralWorkerPool.nWorkers + ' workers';
            console.log(mWd);
            if (typeof window.debugMirrorConfigLogToFile === 'function') window.debugMirrorConfigLogToFile('logEdsDiagnostic', mWd);
        }
        const nL = lambda_range.length;
        const nZ = z_range.length;
        const layers_w = [];
        for (let li = 0; li < nZ; li++) {
            const lz = z_range[li];
            const lT = (li < i_trop) ? (DATA['🧮']['🧮🌡️'] + Gamma * lz) : T_trop;
            const ln_air = window.ATM.airNumberDensityAtZ(lz);
            const ln_CO2 = ln_air * DATA['🫧']['🍰🫧🏭'];
            const ln_H2O = ln_air * waterVaporFractionAtZ(lz);
            const ln_CH4 = ln_air * methaneFractionAtZ(lz);
            const lP_z = usePressureBroadening ? window.ATM.pressureAtZ(lz) : P_REF;
            const lpb = usePressureBroadening ? Math.min(2.0, Math.sqrt(Math.max(1, lP_z) / P_REF)) : 1.0;
            const ldz = (li + 1 < nZ) ? (z_range[li + 1] - z_range[li]) : delta_z_troposphere;
            layers_w.push({ T: lT, n_air: ln_air, n_CO2: ln_CO2, n_H2O: ln_H2O, n_CH4: ln_CH4, pressureBroadening: lpb, delta_z_real: ldz });
        }
        const { resultBuf, sums } = await window.spectralWorkerPool.dispatch({
            lambda_range, lambda_weights,
            cross_section_CO2, cross_section_H2O, cross_section_CH4,
            earth_flux, layers: layers_w, i_trop, h2o_eds_scale, ch4_eds_scale,
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
        if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
            const mWo = '⚙️ [workers] done OLR=' + OLR_w.toFixed(2) + ' W/m²';
            console.log(mWo);
            if (typeof window.debugMirrorConfigLogToFile === 'function') window.debugMirrorConfigLogToFile('logEdsDiagnostic', mWo);
        }
        // resultBuf non référencé après ici → GC peut collecter le Transferable
    }


    // flux_in contient le flux au sommet après propagation complète (OLR)
    if (!flux_in || flux_in.length === 0) throw new Error('[calculateFluxForT0] flux_in vide ou invalide après boucle');
    const total_flux_HITRAN = flux_in.reduce((sum, val) => sum + val, 0);
    if (!Number.isFinite(total_flux_HITRAN)) {
        let jNaN = -1;
        for (let j = 0; j < flux_in.length; j++) {
            if (Number.isNaN(flux_in[j])) { jNaN = j; break; }
        }
        const lamS = (jNaN >= 0 && lambda_range[jNaN] != null) ? (' lam_m=' + lambda_range[jNaN]) : '';
        throw new Error('[calculateFluxForT0] OLR (somme des bins) non fini — intégrale=' + total_flux_HITRAN
            + (jNaN >= 0 ? ' (1er bin NaN j=' + jNaN + lamS + ')' : ''));
    }
    // ─── MT_CKD H₂O continuum (Mlawer 2012) ────────────────────────────────────
    // Additif au piégeage HITRAN line-by-line. Capture l'absorption résiduelle dans la fenêtre
    // 8–12 µm où les lignes HITRAN saturent peu mais où le continuum self+foreign-broadening
    // de H₂O contribue ~10–15 W/m² sur Terre moderne. Formule paramétrique calibrée :
    //   trap ≈ SCALE × PWV[g/cm²]² × (T_ref/T)^4.25 × (P/P_ref)
    // Off par défaut. EARTH.MT_CKD_ENABLED dans physics.js v2.0.16+. Voir physics.js pour calibration.
    const mtCkdTrap = computeMtCkdContinuumTrap();
    const total_flux = Math.max(0, total_flux_HITRAN - mtCkdTrap);
    // ───────────────────────────────────────────────────────────────────────────
    const earth_flux_total = earth_flux.reduce((sum, val) => sum + val, 0);
    const EDS = earth_flux_total - total_flux;
    const sum_blocked_continuum = mtCkdTrap;
    // Le continuum MT_CKD est physiquement de la vapeur d'eau (self+foreign broadening) :
    // il est compté dans H2O pour l'attribution downstream (🧲📛💧). HITRAN_pct/Continuum_pct
    // exposés pour diagnostic. Σ(CO2,H2O,CH4,Clouds) = 1 par construction.
    const sum_blocked_H2O_total = sum_blocked_H2O + sum_blocked_continuum;
    const sum_blocked = sum_blocked_CO2 + sum_blocked_H2O_total + sum_blocked_CH4 + sum_blocked_clouds;
    const pct = (v) => (sum_blocked > 1e-20 && Number.isFinite(v)) ? v / sum_blocked : 0;
    const eds_breakdown = {
        EDS_Wm2: EDS,
        CO2: { pct: pct(sum_blocked_CO2) },
        H2O: {
            pct: pct(sum_blocked_H2O_total),
            HITRAN_pct: pct(sum_blocked_H2O),
            Continuum_pct: pct(sum_blocked_continuum),
            Continuum_Wm2: mtCkdTrap
        },
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
    const T_surf = (DATA['🧮'] && Number.isFinite(DATA['🧮']['🧮🌡️'])) ? DATA['🧮']['🧮🌡️'] : null;
    const effective_temperature = (Number.isFinite(total_flux) && total_flux > 0 && CONST.STEFAN_BOLTZMANN)
        ? Math.pow(total_flux / CONST.STEFAN_BOLTZMANN, 0.25)
        : T_surf;
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

var RADIATIVE = window.RADIATIVE = window.RADIATIVE || {};
RADIATIVE.getSpectralResultFromDATA = getSpectralResultFromDATA;

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
    
    const lr = DATA['📊'] && DATA['📊'].lambda_range;
    const zr = DATA['📊'] && DATA['📊'].z_range;
    if (!lr || !Array.isArray(lr) || lr.length === 0 || !zr || !Array.isArray(zr) || zr.length < 2) {
        console.warn('[calculateRadiativeCapacities] skip: DATA[📊].lambda_range ou z_range incomplet (attendre la fin de calculateFluxForT0)');
        return;
    }
    // 🔒 FILTRER sur l'IR uniquement (λ > 0.7 μm = 0.7e-6 m)
    // L'IR commence à ~0.7-1 μm, on prend 0.7 μm comme limite
    const lambda_IR_min = 0.7e-6; // 0.7 μm en mètres
    const lambda_IR_indices = [];
    for (let j = 0; j < lr.length; j++) {
        if (lr[j] >= lambda_IR_min) {
            lambda_IR_indices.push(j);
        }
    }
    
    // Calculer le poids radiatif (Planck à T_surface) pour chaque longueur d'onde IR
    const lambda_weights_IR = lambda_IR_indices.map(idx => {
        return planckFunction(lr[idx], DATA['🧮']['🧮🌡️']);
    });
    
    // Intégrale du poids radiatif sur IR (pour normalisation)
    const delta_lambda = lr.length > 1 ? (lr[lr.length - 1] - lr[0]) / (lr.length - 1) : 1e-6;
    const weight_integral = lambda_weights_IR.reduce((sum, w) => sum + w, 0) * delta_lambda;
    
    // Précalculer les sections efficaces pour toutes les longueurs d'onde (calcul répétitif → garder const)
    const cross_section_CO2 = lr.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = lr.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = lr.map(lambda => crossSectionCH4(lambda));
    const h2o_eds_scale_cap = EARTH.H2O_EDS_SCALE;
    const ch4_eds_scale_cap = (EARTH.CH4_EDS_SCALE != null && Number.isFinite(EARTH.CH4_EDS_SCALE)) ? EARTH.CH4_EDS_SCALE : 1.0;

    // Initialiser les intégrales pondérées
    let integral_H2O = 0;
    let integral_CO2 = 0;
    let integral_CH4 = 0;
    
    // Calculer la densité numérique de l'air à chaque altitude
    const Gamma = -window.CONFIG_COMPUTE.troposphericLapseRateKPerM; // Gradient de température, K/m
    const airNumberDensity = (z) => {
        const T = DATA['🧮']['🧮🌡️'] + Gamma * z;
        const P = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA * Math.exp(-z / (CONST.R_GAS * T / (EPOCH['🍎'] * CONV.molar_mass_air_ref)));
        return P / (CONST.BOLTZMANN_KB * T);
    };
    
    let __firstBad = null;
    function __noteBad(label, idx, j, i, values) {
        if (!__firstBad) __firstBad = Object.assign({ label: label, idx: idx, j: j, i: i }, values);
    }
    for (let idx = 0; idx < lambda_IR_indices.length; idx++) {
        const j = lambda_IR_indices[idx];
        const w_lambda = lambda_weights_IR[idx];
        
        let tau_H2O_lambda = 0;
        let tau_CO2_lambda = 0;
        let tau_CH4_lambda = 0;
        
        for (let i = 0; i < zr.length - 1; i++) {
            const z = zr[i];
            const delta_z = zr[i + 1] - zr[i];
            
            const n_air = window.ATM.airNumberDensityAtZ(z);
            const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
            const n_H2O = n_air * waterVaporFractionAtZ(z);
            const n_CH4 = n_air * methaneFractionAtZ(z);
            
            const kappa_CO2 = cross_section_CO2[j] * n_CO2;
            const kappa_H2O = cross_section_H2O[j] * n_H2O * h2o_eds_scale_cap;
            const kappa_CH4 = cross_section_CH4[j] * n_CH4 * ch4_eds_scale_cap;

            const delta_tau_CO2 = kappa_CO2 * delta_z;
            const delta_tau_H2O = kappa_H2O * delta_z;
            const delta_tau_CH4 = kappa_CH4 * delta_z;
            
            if (!isFinite(delta_tau_CO2) || delta_tau_CO2 < 0) {
                __noteBad('CO2', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_CO2: n_CO2,
                    cross_CO2: cross_section_CO2[j], kappa_CO2: kappa_CO2, delta_tau_CO2: delta_tau_CO2
                });
            }
            if (!isFinite(delta_tau_H2O) || delta_tau_H2O < 0) {
                __noteBad('H2O', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_H2O: n_H2O,
                    waterVaporFrac_z: waterVaporFractionAtZ(z),
                    cross_H2O: cross_section_H2O[j], h2o_eds_scale_cap: h2o_eds_scale_cap,
                    kappa_H2O: kappa_H2O, delta_tau_H2O: delta_tau_H2O
                });
            }
            if (!isFinite(delta_tau_CH4) || delta_tau_CH4 < 0) {
                __noteBad('CH4', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_CH4: n_CH4,
                    methaneFrac_z: methaneFractionAtZ(z),
                    cross_CH4: cross_section_CH4[j], kappa_CH4: kappa_CH4, delta_tau_CH4: delta_tau_CH4
                });
            }
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
    
    window.__RAD_CAP_LAST_DBG__ = {
        T_surf: DATA['🧮']['🧮🌡️'],
        IR_bins: lambda_IR_indices.length,
        lr_len: lr.length,
        weight_int: weight_integral,
        integral_CO2: integral_CO2,
        integral_H2O: integral_H2O,
        integral_CH4: integral_CH4,
        cross_CO2_sample: cross_section_CO2[Math.floor(cross_section_CO2.length / 2)],
        cross_H2O_sample: cross_section_H2O[Math.floor(cross_section_H2O.length / 2)],
        n_air_surf: window.ATM.airNumberDensityAtZ(0),
        CO2frac: DATA['🫧']['🍰🫧🏭'],
        H2Ofrac: DATA['💧']['🍰🫧💧'],
        firstBad: __firstBad
    };
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

RADIATIVE.calculateRadiativeCapacities = calculateRadiativeCapacities;

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
    const forcing_CO2 = window.CLIMATE.calculateCO2Forcing(CO2_fraction);
    const forcing_H2O = window.CLIMATE.calculateH2OForcing(h2o_enabled, cloud_coverage);
    const forcing_Albedo = (albedo !== null) ? window.CLIMATE.calculateAlbedoForcing(albedo) : 0;

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
        if (albedo != null) {
            DATA['🪩']['🍰🪩📿'] = window.ALBEDO.applyVeilToPlanetaryAlbedo01(albedo);
        } else if (albedo != null) {
            DATA['🪩']['🍰🪩📿'] = albedo;
        }
        if (cloud_coverage != null) DATA['🪩']['☁️'] = cloud_coverage;
    }
    if (window.IO_LISTENER) window.IO_LISTENER.emit('cycleCalcul');
    const fpsOk = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
    if (fpsOk) {
        window.ORG.updateFluxLabels('cycleCalcul');
    }

    // 🔒 Mettre à jour la couleur avec la température actuelle (à chaque étape de dichotomie)
    const color_current = window.PLOT.tempSurfaceToColor(temp_surface_c);
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
    window.PLOT.updatePlot(tempPlotData);
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
    if (tempPlotData.current) window.PLOT.updateSpectralVisualization(tempPlotData.current);
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
    
    const meteoriteCount = DATA['📜']['📿☄️'];
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
        const color_anticipated = window.PLOT.tempSurfaceToColor(tempC_anticipated);
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
            window.PLOT.updatePlot(tempPlotData);

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
    window.H2O.calculateH2OParameters();
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

                if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
                    const mPd1 = `🚀 [performDichotomy] Début convergence - T0_initial = ${T0_initial.toFixed(2)}K (${(T0_initial - CONST.KELVIN_TO_CELSIUS).toFixed(2)}°C)`;
                    const mPd2 = `🚀 [performDichotomy] DATA['🧮']['🧮🌡️'] avant = ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`;
                    console.log(mPd1);
                    console.log(mPd2);
                    if (typeof window.debugMirrorConfigLogToFile === 'function') {
                        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mPd1);
                        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mPd2);
                    }
                }

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
                    window.H2O.calculateH2OParameters();
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
                    const solar_flux_absorbed = window.ALBEDO.calculateSolarFluxAbsorbed();

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
                    if (typeof window !== 'undefined' && typeof window.PLOT.tempSurfaceToColor === 'function') {
                        const tempC_current = T0_current - CONST.KELVIN_TO_CELSIUS;
                        const color_current = window.PLOT.tempSurfaceToColor(tempC_current);
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
                        window.H2O.calculateH2OParameters();
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
                        window.RUNTIME_STATE.calculationConverged = true;
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
                        window.H2O.calculateH2OParameters();
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
                        window.H2O.calculateH2OParameters();
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
                        window.H2O.calculateH2OParameters();
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
                            window.RUNTIME_STATE.calculationConverged = true;
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
                        if (iter > 20 && window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
                            const mMi = '[calculations.js] ⚠️ Maximum d\'itérations atteint (20)';
                            console.log(mMi);
                            if (typeof window.debugMirrorConfigLogToFile === 'function') window.debugMirrorConfigLogToFile('logEdsDiagnostic', mMi);
                        } else if (converged_by_temp_final && !converged_by_flux_final) {
                        } else {
                        }
                        
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
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
                        window.RUNTIME_STATE.calculationConverged = true;
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

                        const albedo = window.ALBEDO.calculateAlbedo();
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
                        const fpsOkInner = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
                        if (fpsOkInner) {
                            window.ORG.updateFluxLabels('cycleCalcul');
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

            if (!window.RUNTIME_STATE.calculationTimeouts) {
                window.RUNTIME_STATE.calculationTimeouts = [];
            }
            window.RUNTIME_STATE.calculationTimeouts.push(...timeoutIds);
        });
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    // 🔒 Réactiver l'affichage du spectre à la fin des calculs (même si FPS était bas pendant)
    if (typeof window !== 'undefined') {
        window.RUNTIME_STATE.showSpectralBackground = true;
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
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.UI_STATE.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.GEOLOGY ? window.GEOLOGY.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = window.UI_STATE.methaneEnabled;
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
            const h2o_params = window.H2O.calculateH2OParameters(final_T0, h2o_total_percent, null);
            window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }

    const albedo = window.ALBEDO.calculateAlbedo();
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(final_T0, 4);
    const eds = flux_surface - total_flux;
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence)
    const tempC_final = final_T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final = window.PLOT.tempSurfaceToColor(tempC_final);
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
    window.RUNTIME_STATE.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsFinal);
    window.RUNTIME_STATE.spectralConverged = true;
    window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
    
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
            window.PLOT.updateSpectralVisualization(spectralData);
            setTimeout(() => {
                const canvasCheck = document.getElementById('spectral-visualization');
                if (canvasCheck && (canvasCheck.style.display === 'none' || canvasCheck.style.visibility === 'hidden' || canvasCheck.style.opacity === '0')) {
                    console.warn('[finalizeResults] ⚠️ Canvas spectral caché après mise à jour, réactivation...');
                    canvasCheck.style.setProperty('display', 'block', 'important');
                    canvasCheck.style.setProperty('visibility', 'visible', 'important');
                    canvasCheck.style.setProperty('opacity', '1', 'important');
                    window.PLOT.updateSpectralVisualization(spectralData);
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
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.UI_STATE.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.GEOLOGY ? window.GEOLOGY.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.H2O.calculateH2OParameters(T0, h2o_total_percent, null);
            window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }
    
    const albedo = calculateAlbedo(T0, h2o_enabled, geo_flux);
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    const tempC_final_sync = T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final_sync = window.PLOT.tempSurfaceToColor(tempC_final_sync);
    window.updateBlackBodyColor(color_final_sync);
    const legendEquilibre_sync = document.querySelector('.legend-equilibre');
    if (legendEquilibre_sync) legendEquilibre_sync.style.color = color_final_sync;

    const ch4_enabled = window.UI_STATE.methaneEnabled;
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
    window.RUNTIME_STATE.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsSync);
    window.RUNTIME_STATE.spectralConverged = true;
    window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
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
                window.PLOT.updateSpectralVisualization(spectralData);
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

RADIATIVE.temperatureAtZ = temperatureAtZ;
RADIATIVE.simulateRadiativeTransfer = simulateRadiativeTransfer;
