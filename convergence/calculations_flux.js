// ============================================================================
// File: API_BILAN/convergence/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.98
// Date: [April 25, 2026]
// Logs:
// - v1.2.98: Init eau/nuages — cycleDeLeau applique partition CO₂ + composition ATM AVANT H2O,
//            sinon ATM.calculateAtmosphereComposition remettait 🍰🫧💧=0 après H2O. Avant flux Init,
//            recalcul albédo après refresh H2O Search pour aligner Init avec le 1er pas Search sans cap solver.
// - v1.2.97: Seed océan CO₂ multiplié par CONFIG_COMPUTE.co2OceanPartitionFactor01. 1 = comportement
//            v1.2.96 ; 0 = test off strict sans mémoire ⚖️🌊🏭 au démarrage.
// - v1.2.96: SEED ocean CO₂ à l'équilibre Henry analytique dans initForConfig (après ATM.calculatePressureAtm).
//            ⚖️🌊🏭 = ratio_ref × ⚖️🏭 (T=T_ref ⇒ ratio_T=ratio_ref, pump net flux=0 au pas 0). Garantit que le
//            bench radiatif ne déclenche pas la pompe à l'init d'époque (user: "pompe toujours active, juste à
//            l'équilibre sur les conditions init"). Désactivé si ⚖️💧=0 ou EPOCH['🌊🏭']=0 (⚫ 🔥 🦠 ⛄ ⇒ ⚖️🌊🏭=0).
//            Corrèle avec calculations_co2.js v1.2.0 qui retire le NO-OP co2OceanPartitionInRadiativeConvergence.
// - v1.2.95: verrous glace d'époque supprimés (user: "virer le verrou tout le temps"). initForConfig ne pose plus STATE.iceEpochFixedWaterState / iceEpochFixedAlbedoState / iceEpochFixedState. Les reset à null sont conservés (état propre pour lecteurs UI legacy api.js / sync_panels.js — ils afficheront simplement "n/a"). Le blend dt 🍰💧🧊 est désormais piloté à chaque pas par calculations_albedo.js v1.2.53 (facteur CONFIG_COMPUTE.iceBlendRelaxation01, défaut 1.0). ice_fixed_value continue d'être calculé pour le diagnostic [ice-nolock].
// - v1.2.94: (doc-only relais) physics.js v2.0.15 — ice_tf passe à 3 zones (pol+mid+trop, Σf=1.0). ICE_FORMULA_MAX_FRACTION devient 1.0 (artefact 0.46 supprimé), donc `ICE_FORMULA_MAX_FRACTION * ice_temp_factor` (ligne 341) reste no-op. Aucun changement de logique flux.
// - v1.2.93: (doc-only relais) intégration ch4_eds_scale côté radiative/calculations.js v1.2.6 + worker_pool v1.0.X + spectral_slice_worker — propagé EARTH.CH4_EDS_SCALE (défaut 1.0, Haqq-Misra 2008) jusqu'aux workers. Aucune logique convergence modifiée ici.
// - v1.2.92: (obliquité) plumbing EPOCH['⚾'] → EARTH.computeIceTempFactor(opts.obliquity_deg) pour ice_formula_epoch ; même contrat que albedo v1.2.49 / h2o v1.0.21.
// - v1.2.91: ice_formula_epoch UNIFIÉ avec albedo v1.2.48 — formule 3-zones ancrée sur T_FREEZE_SEAWATER + dT (EARTH.POLAR_AMP_POL_K/MID_K). Remplace l'ancienne formule mono-zone (T_NO_POLAR_ICE − T_epoch)/RANGE qui divergeait de la formule albédo et saturait à 1.0 dans la plage utile. Pas de dépendance par époque (constantes géophysiques globales).
// - v1.2.90: avant 1er calculateFluxForT0 — updateAtmosphereHeightFromCurrentT + calculateH2OParameters en phase Search (restauration phase). Corrige 🍰🫧💧≈0 après cycles (Init+précip ou spin-up+🔺⏳ long) → OLR trop haute / EDS H2O affiché 0% alors que C–C à T impose vapeur >0.
// - v1.2.89: expositions regroupées sous nouveau namespace window.CONVERGE (calculateT0, initForConfig, cycleDeLeau, updateConvergenceBounds, computeRadiativeTransfer, newDate, snapshotEdsForConvergence, clearConvergenceTrace, appendConvergenceStep). Doublons window.foo retirés. Consommateurs migrés : sync_panels.js, api.js, CO2/html/*.html. Appels internes H2O/ALBEDO/ATM/GEOLOGY migrés vers namespaces.
// - v1.2.88: retrait des console.warn DIAG temporaires (entry + step) ajoutés pour diagnostiquer la divergence scie/bench ; cause trouvée (worker_pool absent coté scie) et corrigée dans radiative/calculations.js v1.2.8 + loader_panels.js v1.1.19.
// - v1.2.87: lectures SOLVER migrées vers window.CONFIG_COMPUTE (source unique configTimeline.js v1.4.13). Retrait DATA['🎚️'].SOLVER / DEFAULT.TUNING.SOLVER. Clés : tolMinWm2, maxSearchStepK, maxSearchStepLargeK, largeDeltaFactor, firstSearchStepCapK, deltaTAccelerationDays.
// - v1.2.86: lectures live SOLVER migrées vers window.DATA['🎚️'].SOLVER (source unique, clonée depuis window.DEFAULT.TUNING.SOLVER par initDATA.js v1.1.0). Fin de window.TUNING. FIRST_SEARCH_STEP_CAP_K / DELTA_T_ACCELERATION_DAYS modifiables live via DATA['🎚️'].SOLVER.
// - v1.2.85: source unique window.TUNING.SOLVER pour les 4 lectures (tolérance, cap Search, cap 1er pas, DELTA_T_ACCELERATION_DAYS). Fin DATA['🎚️'].SOLVER (plus d'interpolation bary sur le solveur — calibration statique).
// - v1.2.84: retrait updateConvergenceBounds(dT_first_after_init) post-Init (ajout v1.2.80 soupçonné de changer le bassin de 📱 vers 21,2 °C) ; bornes posées par la boucle Search comme avant. Cap 1er pas conservé (neutre si FIRST_SEARCH_STEP_CAP_K=0, défaut). Logs diag gated logEdsDiagnostic : bornes/☯/phase
// - v1.2.83: plafond 1er pas — Number.isFinite(capRaw) && capRaw>0 (évite chaîne "8" coercée par >0 → bassin ~21 °C 📱)
// - v1.2.82: 1er pas après Init — plafond FIRST_SEARCH_STEP_CAP_K via Math.min(|dT|, lim) ; lim = cap si cap>0 sinon +∞ (un seul chemin, pas de if chaîne)
// - v1.2.81: FIRST_SEARCH_STEP_CAP_K — défaut 0 = désactivé (héritage : même bassin convergence qu’avant, ex. 📱 ~15,6 °C). Si >0 seul, plafond 1er pas + bornes Init (tradeoff : trajet Protérozoïque moins « en V »)
// - v1.2.80: après Init — cap optionnel 1er pas Search (🎚️.SOLVER.FIRST_SEARCH_STEP_CAP_K) pour bornes + incInit
// - v1.2.79: calculateT0 — tic×ΔT : NaN si 📿💫/🔺🌡️💫 non finis (undefined×0) ; garde finie comme getEpochDateConfig
// - v1.2.78: debugAPI → console.groupCollapsed computeRadiativeTransfer + log chaque itération boucle radiatif
// - v1.2.77: log partition CO2 océan → pdTrace
// - v1.2.66: calculateT0 nouveau run (previous vide) toujours T0=époque ; reset 🧮🌡️🔽/🔼 pour convergence reproductible visu/scie
// - v1.2.68: mode anim: yield 1 frame par cycle (await requestAnimationFrame) pour affichage inter progressif, éviter flush final
// - v1.2.69: computeRadiativeTransfer(callback, options): renderMode visu_/scie_ + attente bridge draw par cycle (visu_+anim)
// - v1.2.70: attente draw via window.VISUALWAIT.isDrawn(cycleToken) (globals rangées)
// - v1.2.71: supprime double émission compute:progress (visu_+anim→displayDichotomyStep direct ; scie_/non-anim→IO_LISTENER seul)
// - v1.2.72: supprime VISUALWAIT.isDrawn (boucle while morte) ; remplace par await RAF direct après displayDichotomyStep (seul async indispensable)
// - v1.2.73: bridge anim+visu_ via IO_LISTENER: compute:progress(payload spectral) -> plot:drawn -> await RAF
// - v1.2.74: initForConfig ne re-clamp plus le verrou albédo glace sur 🍰🗻🏔 ; conserve la glace de surface déjà calculée
// - v1.2.75: initForConfig — snapshot 📿☄️ avant getEpochDateConfig ; restaure si même 🗿 mais 📿☄️ remis à 0 (bug setEpoch / transition)
// - v1.2.76: await calculateFluxForT0() partout (async + workers) avant calculateRadiativeCapacities / getSpectralResultFromDATA
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Init atmosphere from epoch T (🌡️🧮) in both anim/non-anim so same equilibrium (Hadéen)
// - Phase Init cycle eau : utiliser T_epoch (pas T_solver) pour mêmes conditions initiales anim/sans anim
// - Cycle 1 : même calculs anim/sans anim (T_epoch + composition + H2O + albedo), une seule séquence, ref supprimée
// - Suppression computeRadiativeTransferLegacy (chemin mort) ; sans args → rejet, utiliser simulateRadiativeTransfer
// - updateConvergenceBounds(dT_opt) : bornes Init ; dT_opt = pas Search déjà calculé/cappé (1er pas après Init)
// - Premier cycle : phase Search + skip précip pour aligner ☁️/🍰🪩⛅ avec 1re itération radiatif
// - Init: next_T_C pour affichage => next_T°C ; franchissement T_input vs T_output (0°C ou T_boil) en sortie → redoWaterCycle
// - Dicho/bounds update après recalc flux (avant snapshot) pour affichage [🔽,🔼] et next_T°C corrects quand ☯=-1
// - Même bloc Dicho/bounds dans crossing ; yinYang = DATA['🧮']['🧮☯'] (source unique, pas Math.sign intermédiaire)
// - Boucle externe retirée : crossing géré en interne (cycleDeLeau + continue), pas de réinit index
// - Pas de push CycleEau après crossing : CycleEauCrossing suffit (évite doublon cycle 2, T cohérente avec => next°C)
// - CycleEauCrossing : T_crossing_C = T_next_K (explicite) pour cohérence avec => next°C
// - Dicho bounds au sign change : min/max(T_prev,T_curr) pour éviter inversion 🔽/🔼 (ex: crossing 37.9→187.9°C)
// - Crossing : ajout getEnabledStates + calculateAlbedo avant calculateFluxForT0 (albedo obsolète → Δ faux → pas de convergence)
// - Bloc post-T (sans crossing) : idem getEnabledStates+calculateAlbedo ; Dicho bounds min/max (éviter inversion comme en haut de boucle)
// - Bloc post-T : mise à jour bornes Dicho (Δ>0→🔽, Δ<0→🔼) manquait → Δ>0 mais T baissait ; retrait cycle1_T_C
// - calculateGasContributionsToEDS : décomposition EDS par gaz (CO2, H2O, CH4) en % ; affichage dans displayConvergence
// - Convention Δ : 🔺🧲 = flux_entrant - flux_sortant (Δ>0→réchauffer→🔽=T, Δ<0→refroidir→🔼=T)
// - expandBracketIfInvalid() : exécuté quelle que soit la phase si 🔽>=🔼 ; dT = |Δ|/(4σT³) (formule physique)
// - Fix oscillation Search : ne pas mettre à jour ☯ quand Δ×☯<0 (changement de signe) pour détecter passage en Dicho
// - ΔT proportionnel à Δ : computeSearchIncrement = Δ/(4σT³), cap maxStepK uniquement ; Init affiche next_T_C (T suivante)
// - computeSearchIncrement: Math.pow(Δ,1/3)=NaN si Δ<0 → sign(Δ)×|Δ|^(1/3)
// - calcul radiatif N : T affichée = température d'entrée (🧮🌡️⏮), pas la sortie après pas
// - next_T_C = T atteinte par le pas (Search et Dicho) pour cohérence cycle albédo
// - Tolérance flux : helper computeToleranceWm2 (source unique), borne min tolMinWm2
// - Dicho T===T_prev : arrêt seulement si convergé ; sinon élargir bracket pour débloquer
// - 3 Dicho même sens d'affilée → retour Search + expansion bornes (comme Search)
// - Crossing (0°C, T_boil) : phase=Search, 🧮🔄🪩++ pour index monotone (éviter cycle 6 puis 1)
// - T===T_prev : tolérance |T-T_prev|<0.01 K (éviter 39.3 vs 39.5°C faux positifs)
// - Search : garde Δ>0⇒T↑, Δ<0⇒T↓ (éviter next_T opposé au sens de Δ)
// - push delta_equilibre = 🧲🔺⏮ (Δ à l'entrée) pour affichage cohérent
// - Snapshot CycleEau après calculateAlbedo : 🧮🔄🪩 (index affichage) pour nouvelle div
// - Init : 🧮🔄🪩++ pour que premier cycle après Init = 1 (pas 0)
// - Crossing pushPayload : T_input=T_prev, next_T=T_crossing (afficher pas 224.6=>263.9°C, pas 263.9=>304.7)
// - v1.2.25 : waterPass→albedoIter/waterIter, waterPassCrossing supprimé
// - v1.2.26 : 💧 cycle eau utilise albedoIter (0,1,2..) ; calcul radiatif albedoIter=🧮🔄🪩-1
// - v1.2.27 : 🧮🔄🪩++ déplacé en fin de boucle (après push calcul radiatif) et entre pushPayload/CycleEauCrossing
// - CycleEauCrossing : T_transition_C, P_atm pour affichage 💧┴ = T°C [🎈=P atm]
// - pushPayload : albedoIter (🪩), waterIter (💧) ; waterPassCrossing supprimé
// - v1.2.28 : yinYangForPush = ☯ avant mise à jour ligne 709 pour afficher ☯ ancien (changement signe→Dicho visible)
// - v1.2.29 : 🧮🛑 raison arrêt (converged|max_iter|abort|crash|max_water) affichée dans convergence
// - v1.2.30 : push état convergé avant break pour cohérence affichage (Δ final listé)
// - v1.2.31 : phaseForStep = phase avant changement ; afficher phase réelle du pas (Search vs Dicho)
// - v1.2.32 : fix clampBracketToEpochMax (supprimé, non défini) ; logs DEBUG_ANALYSE CO2, cloud_index, CycleEau T/albedo/vapor
// - v1.2.33 : console.log complets (DEBUG_ANALYSE) pour copie/colle depuis la console
// - v1.2.34 : fix ReferenceError DATA in computeSearchIncrement + newDate (const DATA = window.DATA)
// - v1.2.35 : fix updateConvergenceBounds — définir les deux bornes (🔼 restait undefined → NaN)
// - v1.2.36 : DEBUG_ANALYSE_DETAIL + logDetailPremiersCalculs (CYCLE0, Init, CycleEau iter=0) pour transmettre à une autre IA
// - v1.2.37 : Search step : clamp explicite 80 K pour T>2000 K (Hadéen) pour éviter oscillation
// - v1.2.38 : initForConfig : T_epoch si |T_solver-T_epoch|≤20K (1800 OK), T réelle si transition extrême (Corps noir→Archéen)
// - v1.2.39 : cycleDeLeau : guard _lastCycleRef undefined avant accès albedo/vapor (runComputeInParent crossing)
// - v1.2.42 : postMessage compute:progress iframe→parent pour actualiser organigramme (core_flux_wm, atm_height_km, h2o, albedo)
// - v1.2.43 : logEdsBreakdownWithScale() — log EARTH.H2O_EDS_SCALE + répartition CO2/H2O/CH4% à chaque EDS breakdown
// - v1.2.44 : retrait logEdsBreakdownWithScale (verbeux) ; logConvergenceT() une seule fois à la convergence (T°C, albedo, flux, Δ, EDS %) ; CLOUD_LW_TAU_REF = 1 (calculations.js) selon lit. Stephens 1978 / Chylek 1982 — voir FORMULES_FLUX.md § τ nuages LW
// - v1.2.45 : commentaire arrêt convergence : 🔺🧲 = résidu (pas 0) ; 🧲🔬 = 4σT³×precision_K → plus T haute, plus tol grande → T cesse d’augmenter
// - v1.2.47 : updateAtmosphereHeightFromCurrentT() au début de chaque pas radiatif : même 📏🫧🧿 à 15,8°C en cold/warm start (Δ cohérent)
// - v1.2.48 : maxWaterAlbedoCyclesAtInit (5 par défaut) : converger météo à T_init avant premier flux pour même Δ qu'en cold start
// - v1.2.49 : data_snapshot Init/Search/Dicho/converged : ajout 🫧 (🍰🫧📿🌈) pour affichage correct dans debug (évite 0.000 vs 0.023–0.030)
// - v1.2.50 : reset _iceCoverageRampState dans initForConfig (nouveau run/epoch démarre sans inertie glace résiduelle)
// - v1.2.51 : initForConfig fixe _iceCoverageLock (🍰🪩🧊 initial) pour stabiliser Search sur bassin froid (waterPass=0)
// - v1.2.52 : reset _iceDurationBlendState/_iceEpochFixedState au début d'époque (glace d'époque recalculée une fois puis figée en solver)
// - v1.2.53 : spin-up climatologique paramétrable avant solver (climateSpinupCycles) avec snapshots CycleEau visibles
// - v1.2.54 : spin-up pondéré par quantités (⚖️🫧, ⚖️💧) pour neutralité corps noir sans if d'époque
// - v1.2.55 : initForConfig fixe _iceEpochFixedState en fin d'init (formule glace + override OVERRIDES['⛄'])
// - v1.2.56 : vérif cohérence glace (logs DATA vs EPOCH) ; continuité DATA par défaut, override epoch optionnel via config
// - v1.2.57 : continuité glace nettoyée physiquement (atm/eau/hautes terres) + log raw/effective pour éviter faux diagnostics
// - v1.2.58 : séparation verrous glace eau/albédo (_iceEpochFixedWaterState vs _iceEpochFixedAlbedoState) + log double
// - v1.2.59 : spin-up eau/albédo : sortie anticipée si cycleDeLeau(false) ne change plus l'état (évite tours inutiles)
// - v1.2.60 : paramètres solveur de tuning centralisé (static/tuning/model_tuning.js), sans changement de résultat
// - v1.2.61 : fallback synchrone local si window.TUNING absent (évite crash runtime)
// - v1.2.62 : bins = 980000/(19*|delta|+800) minoré 100 via getBinsFromDelta, init utilise delta précédent ou 0
// - v1.2.63 : hooks convergence définis ici en no-op (scie_compute.html les remplace si chargé) — évite crash runComputeInParent
// - v1.2.64 : à la convergence, sync DATA['📊'] avec 🔬🌈 si actualBins !== currentBins (Hadéen 1re iter → rendu 2000 bins)
// - v1.2.65 : source unique SOLVER : lecture DATA['🎚️'].SOLVER en priorité (computeToleranceWm2, computeSearchIncrement)
// - v1.2.67 : fix mode anim calculateT0 : suppression && !isNewRun (previous=[] à chaque epoch, bloquait toujours la branche anim)
// ============================================================================

// No-ops par défaut ; scie_compute.html les remplace par les implé réelles si la page est chargée.
var CONVERGE = window.CONVERGE = window.CONVERGE || {};
CONVERGE.clearConvergenceTrace = function () {};
CONVERGE.appendConvergenceStep = function () {};

// ============================================================================
// FONCTIONS DE CALCUL DE FLUX RADIATIF
// ============================================================================

/** bins = 1980000/(19*|delta|+800), minoré 100, plafonné maxSpectralBinsConvergence. */
function getBinsFromDelta(delta) {
    return Math.min(Math.max(100, Math.floor(1980000 / (19 * Math.abs(delta) + 800))), window.CONFIG_COMPUTE.maxSpectralBinsConvergence);
}

// 🔒 VARIABLES GLOBALES : window.enabledStates (créé par getEnabledStates()) remplace isH2O_eds, isCO2_eds, etc.
// Ces variables sont mises à jour UNIQUEMENT au clic sur les boutons (dans organigramme.js)
// Ne PAS vérifier directement le DOM, utiliser ces variables globales

// Fonction helper pour récupérer les logos : définie dans compute.js (chargé avant ce fichier)
// On utilise window.getLogo() exposé depuis compute.js

// Variables d'état : déclarées dans compute.js (chargé avant ce fichier)
// On utilise les variables globales définies dans compute.js
// old_T0, T0, Phase, signeDeltaFirst sont dans DATA['🧮'], flux_entrant est calculé localement

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

/** Log EDS breakdown + EARTH.H2O_EDS_SCALE pour debug (valeur H₂O vs scale). */
/** Log unique à la convergence : 1) W/m² (flux in/out, Δ, EDS total + par composant) ; 2) T°C, albedo, % EDS. */
function logConvergenceT() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    if (!DATA || !DATA['🧮'] || !DATA['🧲']) return;
    const T_C = (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(2);
    const delta = DATA['🧲']['🔺🧲'] != null ? DATA['🧲']['🔺🧲'].toFixed(3) : '—';
    const b = DATA['📛'];
    const edsTotal = b && b['🧲📛'] != null ? b['🧲📛'] : 0;
    const co2Pct = b && b['🍰📛🏭'] != null ? (b['🍰📛🏭'] * 100).toFixed(1) : '—';
    const h2oPct = b && b['🍰📛💧'] != null ? (b['🍰📛💧'] * 100).toFixed(1) : '—';
    if (CONFIG_COMPUTE.logEdsDiagnostic) {
        console.log('[convergence] T=' + T_C + '°C Δ=' + delta + ' EDS=' + edsTotal.toFixed(1) + ' CO2%=' + co2Pct + ' H2O%=' + h2oPct);
    }
    const deltaNum = DATA['🧲']['🔺🧲'] != null ? Number(DATA['🧲']['🔺🧲']) : NaN;
    if (Number.isFinite(deltaNum)) {
        const tol = DATA['🧮']['🧲🔬'];
        const sens = (tol != null && Math.abs(deltaNum) <= tol) ? 'équilibre (|Δ|≤tol)' : (deltaNum < 0 ? 'trop de sortie → refroidir' : (deltaNum > 0 ? 'pas assez de sortie → réchauffer' : 'équilibre'));
        if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[convergence] ' + delta + ' ' + sens);
    }
}

/** Construit l'objet DATA['📛'] : EDS total (🧲📛), parts [0,1] (🍰📛❀), W/m² par composant (🧲📛❀). */
function buildEdsBreakdown(b) {
    if (!b || b.EDS_Wm2 == null) return null;
    const E = b.EDS_Wm2;
    const pCloud = b.Clouds != null ? b.Clouds.pct : 0;
    return {
        '🧲📛': E,
        '🍰📛🏭': b.CO2.pct,
        '🍰📛💧': b.H2O.pct,
        '🍰📛🐄': b.CH4.pct,
        '🍰📛⛅': pCloud,
        '🧲📛🏭': E * b.CO2.pct,
        '🧲📛💧': E * b.H2O.pct,
        '🧲📛🐄': E * b.CH4.pct,
        '🧲📛⛅': E * pCloud
    };
}

/** Snapshot 📛 pour output convergence (sans 🔺📛💧). */
function snapshotEdsForConvergence() {
    const DATA = window.DATA;
    if (!DATA['📛']) return null;
    const snap = JSON.parse(JSON.stringify(DATA['📛']));
    delete snap['🔺📛💧'];
    return snap;
}

/** Tolérance flux (W/m²) = max(4σT³×precision_K, tolMinWm2). Source unique : window.CONFIG_COMPUTE. */
function computeToleranceWm2(T_K, precision_K) {
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const tolRaw = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(T_K, 3) * precision_K;
    return Math.max(tolRaw, CONFIG_COMPUTE.tolMinWm2);
}

// Calcule T0 initial. Nouveau run (previous vide) : toujours T0 = époque. En anim en cours (previous non vide) : garder T actuelle.
function calculateT0() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // En mode anim : partir toujours de la T0 actuelle du modèle, même si previous est vide (nouveau run).
    // previous est réinitialisé à [] à chaque epoch (sync_panels.js:237), donc !isNewRun
    // était toujours false au premier calcul — le mode anim ne fonctionnait jamais.
    if (DATA['🔘']['🔘🎞']) {
        DATA['🧮']['🧮🌡️🚩'] = DATA['🧮']['🧮🌡️']; // anim : garder T0 actuel
    } else {
        const ticRaw = DATA['📜']['📿💫'];
        const dTRaw = DATA['📜']['🔺🌡️💫'];
        const tic = (ticRaw != null && Number.isFinite(ticRaw)) ? ticRaw : 0;
        const dTtic = (dTRaw != null && Number.isFinite(dTRaw)) ? dTRaw : 0;
        const adjustment = dTtic * tic;
        DATA['🧮']['🧮🌡️🚩'] = DATA['📅']['🌡️🧮'] + adjustment; // sans anim : T0 = config époque
    }

    if (DATA['🧮']['🧮🌡️🚩'] <= 0) {
        console.error(`📛 [calculateT0] ❌ T0=${DATA['🧮']['🧮🌡️🚩']}`
            + ` | 🔘🎞=${DATA['🔘']['🔘🎞']}`
            + ` | 📅🌡️🧮=${DATA['📅'] && DATA['📅']['🌡️🧮']}`
            + ` | 📅=${JSON.stringify(DATA['📅'] && Object.keys(DATA['📅']).slice(0,5))}`
            + ` | 📜🔺🌡️💫=${DATA['📜']['🔺🌡️💫']} 📜📿💫=${DATA['📜']['📿💫']}`
            + ` | 📜🗿=${DATA['📜']['🗿']} 📜👉=${DATA['📜']['👉']}`
            + ` | TIMELINE[idx]🌡️🧮=${window.TIMELINE && window.TIMELINE[DATA['📜']['👉']] && window.TIMELINE[DATA['📜']['👉']]['🌡️🧮']}`
            + ` | TIMELINE[idx]📅=${window.TIMELINE && window.TIMELINE[DATA['📜']['👉']] && window.TIMELINE[DATA['📜']['👉']]['📅']}`);
        return false;
    }
    
    // Initialiser DATA directement (sera complété dans computeRadiativeTransfer)
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    DATA['🧮']['🧮⚧'] = 'Init'; // Phase d'initialisation
    DATA['🧮']['🧮☯'] = 0;
    DATA['🧮']['🧮🔄'] = 0; // Réinitialiser le compteur d'itérations
    delete DATA['🧮']['🧮🌡️🔽'];
    delete DATA['🧮']['🧮🌡️🔼'];
    DATA['🧲']['🧲☀️🔽'] = 0;
    DATA['🧲']['🧲🌕🔽'] = 0;
    DATA['🧲']['🧲🌑🔼'] = 0;
    DATA['🧲']['🧲🌈🔼'] = 0;
    DATA['🧲']['🧲🪩🔼'] = 0;
    DATA['🧲']['🔺🧲'] = 0;
    DATA['📛'] = null; // breakdown EDS par gaz (tau_i/tau dans calculateFluxForT0)

    // IMPORTANT: On met toujours à jour DATA['🧮']['🧮🌡️'] avec la valeur calculée
    // Si animation activée (🔘🎞 = true) : T0_base a été lu depuis DATA['🧮']['🧮🌡️'] (ligne 43)
    // Si animation désactivée (🔘🎞 = false) : T0 = DATA['📅']['🌡️🧮'] + adjustment (ligne 47)
    // On doit mettre à jour DATA['🧮']['🧮🌡️'] pour que la convergence utilise cette nouvelle valeur
    // Pour la convergence, c'est TOUJOURS DATA['🧮']['🧮🌡️'] qui est utilisé
    DATA['🧮']['🧮🌡️'] = DATA['🧮']['🧮🌡️🚩'];
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], DATA['📜']['🧲🔬']);
    
    return true;
}

//Réinitialise les variables lors d'un changement de date
function newDate() {
    const DATA = window.DATA;
    DATA['🧮']['🧮⚧'] = "Search";
    DATA['🧮']['🧮☯'] = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
// Fonction supprimée : getGasValuesFromConfig() n'était pas utilisée
// Les valeurs sont directement dans DATA['🫧'] après calculateAtmosphereComposition()

// ============================================================================
// initForConfig — Config sans aucun calcul radiatif (affichée dès le debug)
// ============================================================================
function initForConfig() {
    if (window.ABORT_COMPUTE) return false;
    const DATA = window.DATA;
    const CONST = window.CONST;
    const ALBEDO = window.ALBEDO;
    const ATM = window.ATM;
    const COMPUTE = window.COMPUTE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const OVERRIDES = window.OVERRIDES;
    const H2O = window.H2O;
    const STATE = window.STATE;
    if (!DATA || !window.TIMELINE) {
        if (typeof console !== 'undefined') console.error('[initForConfig][calculations_flux.js] DATA ou TIMELINE manquant');
        return false;
    }
    // getEpochDateConfig AVANT getSoleil/getNoyau : l'interpolation barycentrique
    // écrit DATA['☀️']['🔋☀️'] et DATA['🌕'], puis getSoleil/getNoyau en dérivent les flux.
    const _epochIdBeforeGedc = DATA['📜'] && DATA['📜']['🗿'];
    const _meteorTicsBefore = (DATA['📜'] && DATA['📜']['📿☄️'] != null && Number.isFinite(DATA['📜']['📿☄️'])) ? DATA['📜']['📿☄️'] : 0;
    COMPUTE.getEpochDateConfig();
    const _epochIdAfterGedc = DATA['📜'] && DATA['📜']['🗿'];
    if (_epochIdBeforeGedc === _epochIdAfterGedc && _meteorTicsBefore > 0 && (DATA['📜']['📿☄️'] === 0 || DATA['📜']['📿☄️'] == null)) {
        DATA['📜']['📿☄️'] = _meteorTicsBefore;
        COMPUTE.getEpochDateConfig();
    }
    if (!COMPUTE.getSoleil() || !COMPUTE.getNoyau()) {
        console.error('[initForConfig] getSoleil ou getNoyau invalide');
        return false;
    }
    if (!calculateT0()) {
        if (typeof console !== 'undefined') console.error('[initForConfig][calculations_flux.js] calculateT0 a échoué');
        return false;
    }
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    // T° sol : on ne modifie pas DATA['🧮']['🧮🌡️'] ici (calcul flux avec T cst ; modifiée uniquement en sortie de boucles).
    // v1.2.68 : verrou glace d'époque supprimé (user: "virer le verrou tout le temps").
    //           Le blend dt se ré-évalue à chaque pas dans calculations_albedo.js v1.2.54
    //           sous contrôle CONFIG_COMPUTE.iceInertiaFactor01 (exp : tau_eff = tau × factor,
    //           fraction_fonte = 1 − exp(−dt/tau_eff)). On continue à remettre
    //           les champs à null pour garder un état propre si d'anciens lecteurs UI (api.js,
    //           sync_panels.js) testent encore leur présence → ils afficheront "n/a" (inoffensif).
    STATE.iceDurationBlendState = null;
    STATE.iceEpochFixedState = null;          // legacy (plus posé)
    STATE.iceEpochFixedWaterState = null;     // plus posé (verrou supprimé)
    STATE.iceEpochFixedAlbedoState = null;    // plus posé (verrou supprimé)
    ATM.calculateAtmosphereComposition();
    ATM.calculatePressureAtm();
    // v1.2.96 : SEED OCÉAN CO₂ À L'ÉQUILIBRE HENRY (analytique, T = T_ref ⇒ ratio_T = ratio_ref).
    // Garantit que calculateCO2Partition donne flux net = 0 au pas 0 du bench (bench = visu).
    // Si perturbation ultérieure (anthropique via 🏭📊, clic user, T ≠ T_ref pendant convergence),
    // la pompe re-équilibre via conservation totale_carbon = ⚖️🏭 + ⚖️🌊🏭.
    // Produit = 0 si ⚖️💧=0 (⚫ 🔥 : pas de mer) OU si EPOCH['🌊🏭']=0 (⛄ : glace globale coupe Henry).
    // Crash-first : EPOCH['🌊🏭'], co2OceanRatioRef et co2OceanPartitionFactor01 DOIVENT être définis.
    const EPOCH_init = window.TIMELINE[DATA['📜']['👉']];
    const hasOceanWaterGate = (DATA['⚖️']['⚖️💧'] > 0) ? 1.0 : 0.0;
    const epochPumpGate = (Number(EPOCH_init['🌊🏭']) > 0) ? 1.0 : 0.0;
    const ratio_ref_init = Math.max(0.1, Number(CONFIG_COMPUTE.co2OceanRatioRef));
    const oceanPartitionFactor01 = Math.max(0, Number(CONFIG_COMPUTE.co2OceanPartitionFactor01));
    DATA['🌊'] = DATA['🌊'] || {};
    DATA['🌊']['⚖️🌊🏭'] = hasOceanWaterGate * epochPumpGate * oceanPartitionFactor01 * ratio_ref_init * DATA['⚖️']['⚖️🏭'];
    if (ALBEDO.calculateGeologySurfaces) ALBEDO.calculateGeologySurfaces();
    // Partition eau une fois avec T0 de la config (cache invalidé pour forcer le recalcul)
    // 🔒 WORKAROUND : En Init, calculateH2OParametersWithIteration converge vers 🍰🫧💧=0 (précip sans évap).
    // Utiliser Search (vapeur potentielle) pour avoir nuages/albédo cohérents dès le départ.
    const phasePrev = DATA['🧮']['🧮⚧'];//utile !!
    if (phasePrev === 'Init') DATA['🧮']['🧮⚧'] = 'Search';
    H2O._lastH2OParamsCache = null;
    H2O.calculateH2OParameters();
    if (phasePrev === 'Init') DATA['🧮']['🧮⚧'] = phasePrev;
    COMPUTE.getEnabledStates();
    ALBEDO.calculateAlbedo();
    // Verrou glaciaire pour tout le solver de cette époque
    const hasAtmWaterSupport = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧'] > 0 && DATA['⚖️']['⚖️💧'] > 0);
    // Surface max couvrable par la glace : hautes terres OU surface hydrosphère (océan gelé)
    const ice_surface_cap = Math.max(DATA['🗻']['🍰🗻🏔'], Math.max(0, Math.min(0.9,
        (DATA['⚖️']['⚖️💧'] > 0 ? (DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER) / (4 * Math.PI * Math.pow((EPOCH['📐'] || 6371) * 1000, 2)) : 0) / 10)));
    const ice_data_continuity = hasAtmWaterSupport ? Math.min(ice_surface_cap, DATA['💧']['🍰💧🧊']) : 0;
    // ice_temp_factor v1.2.92 : FONCTION UNIQUE (cf. physics.js EARTH.computeIceTempFactor).
    // Obliquité ε : lue sur EPOCH['⚾'], sinon fallback CONFIG_COMPUTE.obliquityDeg (23.44°).
    const _epochObliquity_flux = (EPOCH && Number.isFinite(Number(EPOCH['⚾']))) ? Number(EPOCH['⚾']) : undefined;
    const ice_temp_factor = EARTH.computeIceTempFactor(
        EPOCH['🌡️🧮'],
        _epochObliquity_flux !== undefined ? { obliquity_deg: _epochObliquity_flux } : undefined
    ).ice_tf;
    const ice_formula_epoch = Math.min(ice_surface_cap, EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor);
    // Priorité : EPOCH['⛄'] (per-epoch) > OVERRIDES['⛄'] (global) > continuité DATA
    const epochIceOverride = (EPOCH != null && EPOCH['⛄'] != null && Number.isFinite(Number(EPOCH['⛄']))) ? Number(EPOCH['⛄']) : null;
    const globalIceOverride = (OVERRIDES.useEpochIceFixed === true && OVERRIDES['⛄'] != null && Number.isFinite(Number(OVERRIDES['⛄']))) ? Number(OVERRIDES['⛄']) : null;
    const ice_fixed_value = epochIceOverride !== null ? epochIceOverride
        : globalIceOverride !== null ? globalIceOverride
        : ice_data_continuity;
    const albedo_ice_raw = DATA['🪩']['🍰🪩🧊'];
    const albedo_ice_effective = Math.max(0, albedo_ice_raw);
    // v1.2.68 : verrou glace supprimé (user: "virer le verrou tout le temps"). Plus de set de
    //           STATE.iceEpochFixedWaterState / iceEpochFixedAlbedoState / iceEpochFixedState.
    //           Le blend dt de calculations_albedo.js v1.2.53 pilote désormais 🍰💧🧊 à chaque pas.
    //           ice_fixed_value / albedo_ice_effective restent calculés pour le diagnostic.
    if (CONFIG_COMPUTE.logIceFixedDiagnostic) {
        console.log('[ice-nolock v1.2.68] epoch=' + DATA['📜']['🗿']
            + ' DATA_raw=' + DATA['💧']['🍰💧🧊'].toFixed(3)
            + ' DATA_effective=' + ice_data_continuity.toFixed(3)
            + ' ALBEDO_raw=' + albedo_ice_raw.toFixed(3)
            + ' ALBEDO_effective=' + albedo_ice_effective.toFixed(3)
            + ' OVERRIDES_ice=' + (OVERRIDES['⛄'] != null && Number.isFinite(OVERRIDES['⛄']) ? Number(OVERRIDES['⛄']).toFixed(3) : 'n/a')
            + ' EPOCH_formula=' + ice_formula_epoch.toFixed(3)
            + ' highlands=' + Math.max(0, DATA['🗻']['🍰🗻🏔']).toFixed(3)
            + ' atm_water=' + (hasAtmWaterSupport ? '1' : '0')
            + ' ice_fixed_value=' + Math.max(0, Math.min(ice_surface_cap, ice_fixed_value)).toFixed(3)
            + ' source=' + ((OVERRIDES.useEpochIceFixed === true && OVERRIDES['⛄'] != null && Number.isFinite(OVERRIDES['⛄'])) ? 'OVERRIDES' : 'DATA')
            + ' inertia=' + (CONFIG_COMPUTE.iceInertiaFactor01 != null ? CONFIG_COMPUTE.iceInertiaFactor01.toFixed(2) : 'n/a'));
    }
    // Premier run : pas de delta → 1e9 donne bins=100 ; run suivant : delta du run précédent
    DATA['🧮']['🔬🌈'] = getBinsFromDelta((DATA['🧲'] && DATA['🧲']['🔺🧲'] != null) ? DATA['🧲']['🔺🧲'] : 1e9);
    COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    STATE.iceCoverageRampState = null;
    STATE.iceCoverageLock = {
        epochId: DATA['📜']['🗿'],
        value: DATA['🪩']['🍰🪩🧊']
    };
    return true;
}

// ============================================================================
// cycleDeLeau — Cycle eau (h2o, précip, albedo, nuages). Retourne Promise<{ changed }>.
// isFirst: true = après config, on pousse le premier cycle dans Convergence.
// Async + yields pour que le bouton Stop soit cliquable pendant les calculs.
// ============================================================================
/** Met à jour 🧮🌡️🔽 et 🧮🌡️🔼 à partir de 🧮🌡️ et ☯ (signe Δ).
 * Convention Δ = flux_entrant - flux_sortant.
 * ☯=+1 : Δ>0, on reçoit plus qu'on émet → réchauffer → borne min (🔽) = T_curr.
 * ☯=-1 : Δ<0, on émet plus qu'on reçoit → refroidir → borne max (🔼) = T_curr. */
function updateConvergenceBounds(dT_override) {
    const DATA = window.DATA;
    const T_curr = DATA['🧮']['🧮🌡️'];
    const yinYang = DATA['🧮']['🧮☯'];
    const dT = (typeof dT_override === 'number' && Number.isFinite(dT_override))
        ? dT_override
        : computeSearchIncrement();
    // Δ = flux_entrant - flux_sortant : Δ>0 → réchauffer (🔽=T), Δ<0 → refroidir (🔼=T)
    if (yinYang > 0) {
        DATA['🧮']['🧮🌡️🔽'] = T_curr;
        DATA['🧮']['🧮🌡️🔼'] = T_curr + Math.max(1, Math.abs(dT));
    } else if (yinYang < 0) {
        DATA['🧮']['🧮🌡️🔼'] = T_curr;
        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T_curr - Math.abs(dT));
    }
}

/** Calcule l'incrément Search (incTemp) en K.
 * Formule physique : ΔT = Δ/(4σT³) (linéarisation Stefan-Boltzmann, dF/dT = 4σT³).
 * Cap max : CONFIG_COMPUTE.maxSearchStepK. Si |Δ| > largeDeltaFactor×tol : maxSearchStepLargeK.
 * Hadéen (T>2000K) : cap 80 K pour éviter oscillation.
 */
function computeSearchIncrement() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const sigmaT3 = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3);
    let res = DATA['🧲']['🔺🧲'] / sigmaT3;
    const cap = Math.min(CONFIG_COMPUTE.maxSearchStepLargeK,
        (Math.abs(DATA['🧲']['🔺🧲']) > CONFIG_COMPUTE.largeDeltaFactor * DATA['🧮']['🧲🔬'])
            ? CONFIG_COMPUTE.maxSearchStepLargeK
            : CONFIG_COMPUTE.maxSearchStepK);
    if (Math.abs(res) > cap) res = Math.sign(res) * cap;
    return res;
}

/** Expansion du bracket quand 🔽 >= 🔼. Formule physique : ΔT = |Δ|/(4σT³). Exécuté quelle que soit la phase. */
function expandBracketIfInvalid() {
    const DATA = window.DATA;
    if (DATA['🧮']['🧮🌡️🔽'] < DATA['🧮']['🧮🌡️🔼']) return; // Bracket valide, rien à faire

    //window.alert('[expandBracketIfInvalid] Bracket invalide: 🔽 >= 🔼. Correction en cours.');
    const dT_clamped = computeSearchIncrement();
    if (DATA['🧲']['🔺🧲'] > 0) {
        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + dT_clamped;
    } else {
        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'] + dT_clamped;
    }
}

async function cycleDeLeau(isFirst) {
    if (window.ABORT_COMPUTE) return { changed: false };
    const DATA = window.DATA;
    const CONST = window.CONST;
    const ALBEDO = window.ALBEDO;
    const COMPUTE = window.COMPUTE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const H2O = window.H2O;
    // ---> INJECTION CYCLE DU CARBONE (Pompe Océanique) <---
    if (window.CO2 && window.CO2.calculateCO2Partition) {
        var _co2Changed = window.CO2.calculateCO2Partition();
        if (typeof window !== 'undefined' && window.DEBUG_CO2_OCEAN && typeof window.pd === 'function') {
            try {
                var _m = (DATA && DATA['⚖️']) ? DATA['⚖️']['⚖️🏭'] : null;
                var _o = (DATA && DATA['🌊']) ? DATA['🌊']['⚖️🌊🏭'] : null;
                if (typeof window.pdTrace === 'function') window.pdTrace('cycleDeLeau', 'calculations_flux.js', 'CO2 ocean partition changed=' + (_co2Changed ? '1' : '0') + ' ⚖️🏭=' + (_m != null ? Number(_m).toExponential(3) : 'n/a') + ' 🌊⚖️🌊🏭=' + (_o != null ? Number(_o).toExponential(3) : 'n/a'));
            } catch (e) {}
        }
        window.ATM.calculateAtmosphereComposition();
        window.ATM.calculatePressureAtm();
    }

    // 🔒 Premier cycle : utiliser la même logique que la 1re itération Search (vapeur potentielle, pas d'itération précip).
    // Ordre important : calculateAtmosphereComposition() remet 🍰🫧💧 à 0 ; H2O doit donc passer après la composition ATM.
    const phasePrev = DATA['🧮']['🧮⚧'];
    if (isFirst && phasePrev === 'Init') {
        DATA['🧮']['🧮⚧'] = 'Search';
    }
    H2O.calculateH2OParameters();
    if (isFirst && phasePrev === 'Init') {
        DATA['🧮']['🧮⚧'] = phasePrev;
    }
    
    if (window.ABORT_COMPUTE) return { changed: false };
    COMPUTE.getEnabledStates();
    // Premier cycle : pas de calculatePrecipitationFeedback (comme la 1re itération Search)
    if (!isFirst) window.H2O.calculatePrecipitationFeedback();
    ALBEDO.calculateAlbedo();
    if (window.ABORT_COMPUTE) return { changed: false };
    ALBEDO.calculateCloudFormationIndex();

    if (isFirst) {
        if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
        const firstCyclePayload = {
            innerIter: null,
            albedoIter: 0,
            waterIter: 0,
            phase: 'CycleEau',
            temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
            data_snapshot: {
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
            }
        };
        window.CONVERGE.appendConvergenceStep(firstCyclePayload);
        if (callback) callback('convergenceStep', firstCyclePayload);
        dropLastStepSnapshot(DATA);
        COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
        return { changed: false };
    }

    const { T_low_K, T_high_K } = PHYS.getWaterCycleTempBoundsFromPressure(DATA['🫧']['🎈']);
    if (DATA['🧮']['🧮🌡️'] < T_low_K || DATA['🧮']['🧮🌡️'] > T_high_K) {
        COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
        return { changed: false };
    }
    if (!COMPUTE._lastCycleRef) {
        COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    }
    const changed = Math.abs(DATA['🪩']['🍰🪩📿'] - COMPUTE._lastCycleRef.albedo) > CONFIG_COMPUTE.cycleTolAlbedo
        || Math.abs(DATA['💧']['🍰🫧💧'] - COMPUTE._lastCycleRef.vapor) > CONFIG_COMPUTE.cycleTolVapor;
    COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    return { changed };
}

// ============================================================================
// computeRadiativeTransfer() — Radiatif seul. À appeler après initForConfig() et cycleDeLeau(true).
// 🧮🔄🌊 = cycle eau (0=après init, 1+=après crossing 0°C ou T_boil). Lu/écrit dans DATA.
// 🧮🔄☀️ = cycle radiatif (nombre de crossings). Crossing 0°C/T_boil géré en interne.
// Sans appel : rejet (utiliser simulateRadiativeTransfer() pour le calcul principal — chemin sans anim).
// ============================================================================
function dropLastStepSnapshot(DATA) {
    const p = DATA['🧮']['previous'];
    if (p.length && p[p.length - 1]) p[p.length - 1].data_snapshot = null;
}
async function computeRadiativeTransfer(callback, options) {
    const FUNC = window.FUNC_API_BILAN;
    const apiDbg = FUNC && typeof FUNC.isDebugAPI === 'function' && FUNC.isDebugAPI();
    var computeDbgGroup = false;
    try {
    if (window.ABORT_COMPUTE) return null;
    if (!options) options = {};
    const renderMode = options.renderMode === 'scie_' ? 'scie_' : 'visu_';
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const H2O = window.H2O;
    if (apiDbg) {
        console.groupCollapsed('[API_BILAN] computeRadiativeTransfer', renderMode, 'epoch=', DATA['📜']['🗿']);
        computeDbgGroup = true;
    }
    if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
    window.CONVERGE.clearConvergenceTrace();
    if (DATA['🧮']['🧮🔄🌊'] == null) DATA['🧮']['🧮🔄🌊'] = 0;
    const currentWaterPass = DATA['🧮']['🧮🔄🌊'];
    const maxWaterPass = 5;
    if (currentWaterPass === 0) {
        window._fromCrossing = false;
        DATA['🧮']['🧮🔄🪩'] = 0;
    }

    // Spin-up climatologique : cycles et refs confirmés en config (majuscules). Poids = ratio clampé [0,1].
    const spinupWeightAtm = Math.max(0, Math.min(1, DATA['⚖️']['⚖️🫧'] / CONFIG_COMPUTE.climateSpinupAtmMassRefKg));
    const spinupWeightWater = Math.max(0, Math.min(1, DATA['⚖️']['⚖️💧'] / CONFIG_COMPUTE.climateSpinupWaterMassRefKg));
    const climateSpinupCyclesEffective = Math.max(0, Math.round(CONFIG_COMPUTE.climateSpinupCycles * spinupWeightAtm * spinupWeightWater));
    if (apiDbg) console.log('[API_BILAN] pré-radiatif', 'spinupEff=' + climateSpinupCyclesEffective, 'waterPass=' + currentWaterPass, 'maxRadiatifIters=' + CONFIG_COMPUTE.maxRadiatifIters);
    if (currentWaterPass === 0) {
        if (climateSpinupCyclesEffective > 0) {
            const phasePrevSpinup = DATA['🧮']['🧮⚧'];
            DATA['🧮']['🧮⚧'] = 'Search';
            for (let w = 0; w < climateSpinupCyclesEffective; w++) {
                const resSpinup = await window.CONVERGE.cycleDeLeau(false);
                const T_C_init = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[spinup] CycleEau #' + (w + 1) + ' @' + T_C_init.toFixed(1) + '°C');
                const spinupPayload = {
                    innerIter: null,
                    albedoIter: w,
                    waterIter: 0,
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                        '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                        '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
                    }
                };
                window.CONVERGE.appendConvergenceStep(spinupPayload);
                if (callback) callback('convergenceStep', spinupPayload);
                dropLastStepSnapshot(DATA);
                if (!resSpinup.changed) break;
                if (window.ABORT_COMPUTE) return null;
            }
            DATA['🧮']['🧮⚧'] = phasePrevSpinup;
        } else {
            for (let w = 0; w < CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit; w++) {
                const resInit = await window.CONVERGE.cycleDeLeau(false);
                const T_C_init = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] Init @' + T_C_init.toFixed(1) + '°C');
                const initCyclePayload = {
                    innerIter: null,
                    albedoIter: w,
                    waterIter: 0,
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                        '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                        '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
                    }
                };
                window.CONVERGE.appendConvergenceStep(initCyclePayload);
                if (callback) callback('convergenceStep', initCyclePayload);
                dropLastStepSnapshot(DATA);
                if (!resInit.changed) break;
                if (window.ABORT_COMPUTE) return null;
            }
        }
    }

    if (currentWaterPass > 0 && (currentWaterPass > 1 || !window._fromCrossing)) {
        const cycleAfterCrossPayload = {
            innerIter: null,
            albedoIter: DATA['🧮']['🧮🔄🪩'],
            waterIter: DATA['🧮']['🧮🔄🌊'],
            phase: 'CycleEau',
            data_snapshot: {
                '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
            }
        };
        window.CONVERGE.appendConvergenceStep(cycleAfterCrossPayload);
        if (callback) callback('convergenceStep', cycleAfterCrossPayload);
        dropLastStepSnapshot(DATA);
        window._fromCrossing = false;
    }

    // Même grille verticale qu’aux pas Search (v1.2.47) ; vapeur C–C à T courante sans branche Init
    // (les cycles ci‑dessus peuvent laisser 🍰🫧💧≈0 : itération Init/précip ou précip feedback × 🔺⏳ long).
    window.ATM.updateAtmosphereHeightFromCurrentT();
    const phaseBeforeFirstFlux = DATA['🧮']['🧮⚧'];
    DATA['🧮']['🧮⚧'] = 'Search';
    H2O._lastH2OParamsCache = null;
    H2O.calculateH2OParameters();
    window.COMPUTE.getEnabledStates();
    window.ALBEDO.calculateAlbedo();
    DATA['🧮']['🧮⚧'] = phaseBeforeFirstFlux;

    const T_input_K = DATA['🧮']['🧮🌡️'];
    const albedo_init = (DATA['🪩'] && Number.isFinite(DATA['🪩']['🍰🪩📿'])) ? DATA['🪩']['🍰🪩📿'] : 0;
    const flux_solaire_absorbe_init = DATA['☀️']['🧲☀️🎱'] * (1 - albedo_init);
    const flux_entrant_init = flux_solaire_absorbe_init + DATA['🌕']['🧲🌕'];

    const calcFluxInitOk = await window.calculateFluxForT0();
    if (calcFluxInitOk !== true) return Promise.reject(new Error('calculateFluxForT0() a échoué'));
    const spectral_result_init = window.RADIATIVE.getSpectralResultFromDATA();
    if (spectral_result_init.lambda_range && spectral_result_init.z_range) {
        const bins = spectral_result_init.lambda_range.length;
        const layers = spectral_result_init.z_range.length;
        const estMB = (bins * layers * 5 * 8) / 1e6;
    }
    // Avertissement mémoire (une fois par session) : pas de garantie cross‑machine, informer si grosse grille
    if (!window._spectralMemoryWarned && spectral_result_init.lambda_range && spectral_result_init.z_range) {
        const bins = spectral_result_init.lambda_range.length;
        const layers = spectral_result_init.z_range.length;
        const estMB = (bins * layers * 5 * 8) / 1e6;
        if (estMB > 25) {
            console.warn('⚠️ Grille spectrale ~' + estMB.toFixed(0) + ' MB (bins=' + bins + ', couches=' + layers + '). Sur machine peu RAM ou crash (Brave code 5), réduire CONFIG_COMPUTE.maxSpectralBinsConvergence (ex. 50).');
            window._spectralMemoryWarned = true;
        }
    }
    window.RADIATIVE.calculateRadiativeCapacities();
    // Équilibre radiatif (sommet de l'atmosphère) :
    // - flux_entrant = solaire absorbé + géothermique (ce que la planète reçoit).
    // - flux_sortant_effectif = intégrale du spectre d'émission réel au sommet = aire sous la courbe "réelle"
    //   (ce qui s'échappe vers l'espace ; 🧲🌈🔼 = total_flux du transfert radiatif).
    // - À l'équilibre : flux_entrant = flux_sortant_effectif ⇒ Δ = 0.
    // La surface émet σT⁴ (corps noir à T) ; l'atmosphère absorbe une partie → ce qui sort au sommet
    // (aire sous la courbe réelle) est < σT⁴. Donc "aire courbe Planck T" ≠ "aire courbe réelle" en général ;
    // le delta est bien (flux_entrant − aire courbe réelle), pas la différence entre deux aires spectrales.
    const flux_sortant_effectif_init = spectral_result_init.total_flux;
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init;
    // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
    DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_init;
    DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
    // À l'équilibre TOA : flux_entrant = flux_sortant ⇒ 🔺🧲 ≈ 0 ; sinon 🧲🌈🔼 (OLR) ou flux solaire incohérent. Voir doc/API/SENS_CONVERGENCE_ET_VALEURS.md §2.1.
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    const h2oScale = EARTH.H2O_EDS_SCALE;
    const bins = DATA['🧮']['🔬🌈'];
    const nLayers = DATA['🧮']['🔬🫧'];
    const deltaZ = (DATA['📊'] && DATA['📊'].delta_z != null) ? DATA['📊'].delta_z : '—';
    if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[Init] OLR=' + flux_sortant_effectif_init.toFixed(2) + ' Δ=' + delta_equilibre_init.toFixed(2));
    const bInit = DATA['📊'] && DATA['📊'].eds_breakdown;
    DATA['📛'] = buildEdsBreakdown(bInit);
    if (DATA['📛']) window.H2O.calculateH2OGreenhouseForcing();
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], DATA['📜']['🧲🔬']);

    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄☀️'] = 0;
    const dT_first_after_init = computeSearchIncrement();
    // v1.2.88 : cap 1er pas Search (firstSearchStepCapK) supprimé — patch historique SB linéarisé, obsolète.
    // v1.2.84 : pas d'updateConvergenceBounds ici (revert v1.2.80). Bornes posées par la boucle Search lignes 815-823.
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init;
    DATA['📅']['🔺⏳'] = CONV.SECONDS_PER_DAY * window.CONFIG_COMPUTE.deltaTAccelerationDays;
    DATA['🧮']['🧮🛑'] = ''; // Réinit pour que le snapshot Init n'affiche pas l'ancien 'converged'

    const incInit = dT_first_after_init;
    const T_init_K = DATA['🧮']['🧮🌡️'];
    const initPayload = {
        innerIter: -1,
        albedoIter: 0,
        waterIter: 0,
        phase: 'Init',
        temperature_K: T_init_K,
        temperature_C: T_init_K - CONST.KELVIN_TO_CELSIUS,
        delta_equilibre: delta_equilibre_init,
        albedo: DATA['🪩']['🍰🪩📿'],
        yinYang: Math.sign(delta_equilibre_init),
        next_T_C: T_init_K + incInit - CONST.KELVIN_TO_CELSIUS,
        data_snapshot: {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': snapshotEdsForConvergence()
        }
    };
    window.CONVERGE.appendConvergenceStep(initPayload);
    if (callback) callback('convergenceStep', initPayload);
    dropLastStepSnapshot(DATA);
    if (Number.isFinite(delta_equilibre_init)) {
        const sensInit = delta_equilibre_init < 0 ? 'trop de sortie → refroidir' : (delta_equilibre_init > 0 ? 'pas assez de sortie → réchauffer' : 'équilibre');
        if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[Init] ' + sensInit);
    }
    DATA['🧮']['🧮🌡️'] = T_init_K + incInit;
    if (DATA['🧮']['🧮🔄🪩'] != null) DATA['🧮']['🧮🔄🪩']++; // Cycle eau s'incrémente à Init (premier cycle après = 1)
    try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }

    const maxInnerIters = CONFIG_COMPUTE.maxRadiatifIters;
    let innerConverged = false;
    DATA['🧮']['🧮🛑'] = null;
    let dichoSameDirCount = 0;
    let lastDichoSign = 0;
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        if (apiDbg) {
            var dFlux0 = DATA['🧲']['🔺🧲'];
            var tC0 = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            console.log('[API_BILAN] radiatif step', DATA['🧮']['🧮🔄☀️'], 'phase', DATA['🧮']['🧮⚧'], 'T_C', tC0.toFixed(2), 'Δ', (typeof dFlux0 === 'number' && isFinite(dFlux0)) ? dFlux0.toFixed(4) : String(dFlux0));
        }
        if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
        DATA['🧮']['🔬🌈'] = getBinsFromDelta(DATA['🧲']['🔺🧲']);
        // Mettre à jour hauteur atmosphère (📏🫧🧿, 📏🫧🛩) depuis T courante : même grille verticale à 15,8°C en cold/warm start
        window.ATM.updateAtmosphereHeightFromCurrentT();
        DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], DATA['📜']['🧲🔬']);
        // Météo : 2 ou N cycles eau/albédo par pas radiatif ; un snapshot CycleEau par cycle pour affichage
        const maxWaterAlbedo = CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep;
        if (maxWaterAlbedo <= 1) {
            window.H2O.calculateH2OParameters();
            window.COMPUTE.getEnabledStates();
            window.ALBEDO.calculateAlbedo();
            if (DATA['🧮']['🧮🔄🪩'] == null) DATA['🧮']['🧮🔄🪩'] = DATA['🧮']['🧮🔄🌊'];
            const T_C_oneStep = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            const albedoOneStep = (DATA['🪩']['🍰🪩📿'] != null) ? (DATA['🪩']['🍰🪩📿'] * 100).toFixed(2) : '-';
            const h2oOneStep = (DATA['💧']['🍰🫧💧'] != null) ? (DATA['💧']['🍰🫧💧'] * 100).toFixed(2) : '-';
            const co2MassStep = (DATA['⚖️'] && DATA['⚖️']['⚖️🏭'] != null) ? DATA['⚖️']['⚖️🏭'].toExponential(2) : '-';
            if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] radiatif @' + T_C_oneStep.toFixed(1) + '°C CO₂=' + co2MassStep + 'kg');
            const cyclePayload = {
                innerIter: null,
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                phase: 'CycleEau',
                data_snapshot: {
                    '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                    '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                    '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                    '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                    '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                    '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
                }
            };
            window.CONVERGE.appendConvergenceStep(cyclePayload);
            if (callback) callback('convergenceStep', cyclePayload);
            dropLastStepSnapshot(DATA);
        } else {
            const baseAlbedoIter = (DATA['🧮']['🧮🔄🪩'] != null ? DATA['🧮']['🧮🔄🪩'] : 0) * maxWaterAlbedo;
            for (let w = 0; w < maxWaterAlbedo; w++) {
                const res = await window.CONVERGE.cycleDeLeau(false);
                const T_C_step = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                const albedoPctStep = (DATA['🪩']['🍰🪩📿'] != null) ? (DATA['🪩']['🍰🪩📿'] * 100).toFixed(2) : '-';
                const h2oPctStep = (DATA['💧']['🍰🫧💧'] != null) ? (DATA['💧']['🍰🫧💧'] * 100).toFixed(2) : '-';
                const co2MassStep2 = (DATA['⚖️'] && DATA['⚖️']['⚖️🏭'] != null) ? DATA['⚖️']['⚖️🏭'].toExponential(2) : '-';
                if (CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] radiatif w=' + w + ' @' + T_C_step.toFixed(1) + '°C CO₂=' + co2MassStep2 + 'kg');
                const cyclePayloadW = {
                    innerIter: null,
                    albedoIter: baseAlbedoIter + w,
                    waterIter: DATA['🧮']['🧮🔄🌊'],
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                        '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
                        '🌊': DATA['🌊'] ? JSON.parse(JSON.stringify(DATA['🌊'])) : undefined
                    }
                };
                window.CONVERGE.appendConvergenceStep(cyclePayloadW);
                if (callback) callback('convergenceStep', cyclePayloadW);
                dropLastStepSnapshot(DATA);
                if (!res.changed) break;
                if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            }
        }
        await window.calculateFluxForT0();
        window.RADIATIVE.calculateRadiativeCapacities();
        const spectral_result = window.RADIATIVE.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.ALBEDO.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        DATA['🧲']['🧲🌈🔼'] = spectral_result.total_flux;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        // 🔺🧲 = entrant − sortant ; équilibre ⇒ ≈ 0. Si |🔺🧲| > tol mais converged, vérifier tol ou état affiché (doc §2.1).
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        const b = DATA['📊'] && DATA['📊'].eds_breakdown;
        DATA['📛'] = buildEdsBreakdown(b);
        if (DATA['📛']) window.H2O.calculateH2OGreenhouseForcing();
        // Phase AVANT mise à jour : pour affichage cohérent (phase utilisée pour le pas précédent)
        const phaseAtInput = DATA['🧮']['🧮⚧'];

        // Dicho : encadrer Δ=0. Δ=flux_entrant-flux_sortant : Δ>0→réchauffer(🔽=T), Δ<0→refroidir(🔼=T)
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔼'] <= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
            }
        }
        // ☯ = ancien signe(Δ). Passage en Dicho quand signe(Δ) change (Δ×☯<0). Affiché ☯ = signe(Δ) actuel (mis à jour en fin de boucle).
        const switchedToDicho = (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0);
        if (switchedToDicho) {
            DATA['🧮']['🧮⚧'] = 'Dicho';
            dichoSameDirCount = 1;
            lastDichoSign = Math.sign(DATA['🧲']['🔺🧲']);
            // Convention 🔽 = min T, 🔼 = max T. Utiliser min/max pour éviter inversion selon sens du pas.
            const T_prev = DATA['🧮']['🧮🌡️⏮'];
            const T_curr = DATA['🧮']['🧮🌡️'];
            DATA['🧮']['🧮🌡️🔽'] = Math.min(T_prev, T_curr);
            DATA['🧮']['🧮🌡️🔼'] = Math.max(T_prev, T_curr);
        }
        DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
        if (DATA['🧮']['🧮🔄☀️'] === 0) {
            DATA['🧮']['🧮⚧'] = 'Search';
            dichoSameDirCount = 0;
            lastDichoSign = 0;
        } else if (!switchedToDicho) {
            if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                const signDelta = Math.sign(DATA['🧲']['🔺🧲']);
                if (signDelta === lastDichoSign) dichoSameDirCount++;
                else { dichoSameDirCount = 1; lastDichoSign = signDelta; }
                if (dichoSameDirCount >= 3) {
                    DATA['🧮']['🧮⚧'] = 'Search';
                    DATA['🧮']['🧮☯'] = signDelta;
                    // Hadéen (T>2000K) : expansion réduite (30 K) pour éviter oscillation
                    const expK = (DATA['🧮']['🧮🌡️'] > 2000) ? 30 : 50;
                    if (signDelta > 0) {
                        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + expK;
                    } else {
                        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - expK);
                    }
                    if (CONFIG_COMPUTE.logEdsDiagnostic) {
                        const T_C_exp = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                        const bLowC = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
                        const bHighC = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
                        console.log('[conv-diag] bracket-expand Dicho→Search step=' + DATA['🧮']['🧮🔄☀️'] + ' T=' + T_C_exp.toFixed(2) + '°C Δ=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' signΔ=' + signDelta + ' expK=' + expK + ' → [' + bLowC.toFixed(2) + ', ' + bHighC.toFixed(2) + ']°C');
                    }
                    dichoSameDirCount = 0;
                    lastDichoSign = 0;
                }
            } else {
                DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
                dichoSameDirCount = 0;
                lastDichoSign = 0;
            }
            if (DATA['🧮']['🧮⚧'] !== 'Dicho') DATA['🧮']['🧮⚧'] = 'Search';
        }

        // ☯=0 en Search ⇒ Math.sign(Δ)=0 ⇒ Δ=0 : équilibre atteint. Si tol NaN, utiliser epsilon pour accepter Δ≈0.
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮☯'] === 0) {
            var deltaHere = DATA['🧲']['🔺🧲'];
            var tolHere = DATA['🧮']['🧲🔬'];
            var tolOk = typeof tolHere === 'number' && Number.isFinite(tolHere);
            if (Math.abs(deltaHere) <= (tolOk ? tolHere : 1e-9)) {
                innerConverged = true;
                DATA['🧮']['🧮🛑'] = 'converged';
            } else {
                var F = DATA['🧲'];
                console.error('Crash algo: ☯=0 en phase Search, Δ hors tol. step=' + DATA['🧮']['🧮🔄☀️'] + ' flux_entrant=' + (F['🧲☀️🔽'] + F['🧲🌕🔽']) + ' flux_sortant=' + F['🧲🌈🔼'] + ' 🔺🧲=' + F['🔺🧲'] + ' tol=' + tolHere);
                DATA['🧮']['🧮🛑'] = 'crash';
                return null;
            }
        }
        expandBracketIfInvalid();
        if (CONFIG_COMPUTE.logEdsDiagnostic) {
            const T_C_s = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            const bLoK = DATA['🧮']['🧮🌡️🔽'];
            const bHiK = DATA['🧮']['🧮🌡️🔼'];
            const bLoC = (typeof bLoK === 'number' && Number.isFinite(bLoK)) ? (bLoK - CONST.KELVIN_TO_CELSIUS).toFixed(2) : '—';
            const bHiC = (typeof bHiK === 'number' && Number.isFinite(bHiK)) ? (bHiK - CONST.KELVIN_TO_CELSIUS).toFixed(2) : '—';
            console.log('[conv-diag] step=' + DATA['🧮']['🧮🔄☀️'] + ' ⚧=' + DATA['🧮']['🧮⚧'] + ' ☯=' + DATA['🧮']['🧮☯'] + ' T=' + T_C_s.toFixed(2) + '°C Δ=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' 🧲📛=' + (DATA['📛'] && DATA['📛']['🧲📛'] != null ? DATA['📛']['🧲📛'].toFixed(2) : '—') + ' [🔽=' + bLoC + ', 🔼=' + bHiC + ']°C');
        }
        window.CONVERGENCE_DEBUG = { bins: DATA['🧮']['🔬🌈'], step: DATA['🧮']['🧮🔄☀️'], delta: DATA['🧲']['🔺🧲'] };
        try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }

        // Arrêt quand |Δ| ≤ tol. Si 🧲🔬 NaN (init manquante), fallback 1e-9 pour accepter Δ≈0.
        var tolConv = DATA['🧮']['🧲🔬'];
        if (Math.abs(DATA['🧲']['🔺🧲']) <= (typeof tolConv === 'number' && Number.isFinite(tolConv) ? tolConv : 1e-9)) {
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'converged';
            // Sync DATA['📊'] avec 🔬🌈 : si convergence dès la 1re itération, 📊 peut encore être à 100 bins (init)
            const currentBins = DATA['🧮']['🔬🌈'];
            const actualBins = (DATA['📊'] && DATA['📊'].lambda_range) ? DATA['📊'].lambda_range.length : 0;
            if (actualBins !== currentBins) {
                await window.calculateFluxForT0();
                window.RADIATIVE.calculateRadiativeCapacities();
                const spectral_sync = window.RADIATIVE.getSpectralResultFromDATA();
                DATA['🧲']['🧲🌈🔼'] = spectral_sync.total_flux;
                DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
                if (DATA['📊'] && DATA['📊'].eds_breakdown) {
                    DATA['📛'] = buildEdsBreakdown(DATA['📊'].eds_breakdown);
                    if (DATA['📛']) window.H2O.calculateH2OGreenhouseForcing();
                }
            }
            const maxBins = CONFIG_COMPUTE.maxSpectralBinsConvergence;
            const layers = (DATA['📊'] && DATA['📊'].z_range) ? DATA['📊'].z_range.length : 0;
            const estMBFinal = (maxBins * layers * 5 * 8) / 1e6;
            const skipFinalPassRAM = (typeof CONFIG_COMPUTE.spectralMaxMB === 'number' && estMBFinal > CONFIG_COMPUTE.spectralMaxMB);
            if (DATA['🧮']['🔬🌈'] < maxBins && !skipFinalPassRAM) {
                // Passe finale à résolution max pour courbe spectrale et EDS précis
                DATA['🧮']['🔬🌈'] = maxBins;
                await window.calculateFluxForT0();
                window.RADIATIVE.calculateRadiativeCapacities();
                const spectral_final = window.RADIATIVE.getSpectralResultFromDATA();
                DATA['🧲']['🧲🌈🔼'] = spectral_final.total_flux;
                DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
                DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
                if (DATA['📊'] && DATA['📊'].eds_breakdown) {
                    DATA['📛'] = buildEdsBreakdown(DATA['📊'].eds_breakdown);
                    if (DATA['📛']) window.H2O.calculateH2OGreenhouseForcing();
                }
            }
            window.CONVERGENCE_DEBUG = { bins: DATA['🧮']['🔬🌈'], step: DATA['🧮']['🧮🔄☀️'], delta: DATA['🧲']['🔺🧲'] };
            // Push état convergé pour cohérence affichage (sinon Arrêt montre Δ final non listé)
            const data_snapshot_conv = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': snapshotEdsForConvergence()
            };
            const pushConv = {
                innerIter: DATA['🧮']['🧮🔄☀️'],
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                temperature_K: DATA['🧮']['🧮🌡️'],
                temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
                delta_equilibre: DATA['🧲']['🔺🧲'],
                phase: DATA['🧮']['🧮⚧'],
                albedo: DATA['🪩']['🍰🪩📿'],
                yinYang: DATA['🧮']['🧮☯'],
                data_snapshot: data_snapshot_conv
            };
            pushConv.next_T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                pushConv.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
                pushConv.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
            }
            window.CONVERGE.appendConvergenceStep(pushConv);
            if (callback) callback('convergenceStep', pushConv);
            dropLastStepSnapshot(DATA);
            logConvergenceT(); // Log unique à la convergence pour régler T° (cible ~15°C)
        }
        if (innerConverged) break;

        // Sauvegarder Δ à l'entrée (avant pas) pour push cohérent : afficher Δ@T_input, pas Δ@T_output
        DATA['🧮']['🧲🔺⏮'] = DATA['🧲']['🔺🧲'];

        // Phase utilisée pour ce pas (avant tout changement) : afficher phase réelle du pas, pas celle du suivant
        const phaseForStep = DATA['🧮']['🧮⚧'];
        // ☯ figé à T_input (avant step) : pour push cohérent, ☯ affiché = ☯@T_input
        const yinYangForPush = DATA['🧮']['🧮☯'];

        // Calculer T_next AVANT de déplacer (pour snapshot cohérent : T, Δ, bounds, next_T)
        // Init : pas de déplacement (snapshot seul). Search/Dicho : déplacement ici (increment ou milieu bracket).
        let T_next_K = null;
        if (DATA['🧮']['🧮⚧'] === 'Search') {
            const increment = computeSearchIncrement();
            const T_curr_S = DATA['🧮']['🧮🌡️'];
            T_next_K = T_curr_S + increment;
            // Garde : Δ>0 ⇒ T augmente, Δ<0 ⇒ T diminue (éviter T_next opposé au sens de Δ)
            if ((DATA['🧲']['🔺🧲'] > 0 && T_next_K < T_curr_S) || (DATA['🧲']['🔺🧲'] < 0 && T_next_K > T_curr_S)) {
                const incAbs = Math.abs(increment);
                T_next_K = DATA['🧲']['🔺🧲'] > 0 ? T_curr_S + incAbs : T_curr_S - incAbs;
            }
            if (CONFIG_COMPUTE.maxSearchT_K != null && T_next_K > CONFIG_COMPUTE.maxSearchT_K)
                T_next_K = CONFIG_COMPUTE.maxSearchT_K;
            DATA['🧮']['🧮🌡️'] = T_next_K;
        } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'] && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'])
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
            else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'] && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'])
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
            T_next_K = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
            // Garde : Δ>0 ⇒ T augmente, Δ<0 ⇒ T diminue (sinon bracket incohérent → forcer Search)
            const T_curr = DATA['🧮']['🧮🌡️'];
            if ((DATA['🧲']['🔺🧲'] > 0 && T_next_K < T_curr) || (DATA['🧲']['🔺🧲'] < 0 && T_next_K > T_curr)) {
                const inc = computeSearchIncrement();
                T_next_K = T_curr + inc;
            }
            DATA['🧮']['🧮🌡️'] = T_next_K;
        }
        const T_boil = window.H2O.getBoilingPointKFromPressure(DATA['🫧']['🎈']);
        const crosses = (DATA['🧮']['🧮🌡️⏮'] < CONST.T0_WATER && T_next_K >= CONST.T0_WATER) || (DATA['🧮']['🧮🌡️⏮'] >= CONST.T0_WATER && T_next_K < CONST.T0_WATER)
            || (DATA['🧮']['🧮🌡️⏮'] < T_boil && T_next_K >= T_boil) || (DATA['🧮']['🧮🌡️⏮'] >= T_boil && T_next_K < T_boil);
        if (crosses && T_next_K != null && Number.isFinite(T_next_K)) {
            const T_prev_K = DATA['🧮']['🧮🌡️⏮'];
            const T_crossing_C = T_next_K - CONST.KELVIN_TO_CELSIUS;
            DATA['🧮']['🧮🔄☀️']++;
            window.H2O.calculateH2OParameters();
            window.COMPUTE.getEnabledStates();
            window.ALBEDO.calculateAlbedo();
            await window.calculateFluxForT0();
            window.RADIATIVE.calculateRadiativeCapacities();
            DATA['🧲']['🧲☀️🔽'] = window.ALBEDO.calculateSolarFluxAbsorbed();
            DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
            DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
            DATA['🧲']['🧲🌈🔼'] = window.RADIATIVE.getSpectralResultFromDATA().total_flux;
            DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
            DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
            const bCross = DATA['📊'] && DATA['📊'].eds_breakdown;
            DATA['📛'] = buildEdsBreakdown(bCross);
            if (DATA['📛']) window.H2O.calculateH2OGreenhouseForcing();
            // Même bloc Dicho/bounds qu'en flux normal : sinon snapshot incohérent (☯, [🔽,🔼])
            if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔼'] <= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
            }
        }
            const switchedCross = (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0);
            if (switchedCross) {
                const T_prev = DATA['🧮']['🧮🌡️⏮'];
                const T_curr = DATA['🧮']['🧮🌡️'];
                DATA['🧮']['🧮🌡️🔽'] = Math.min(T_prev, T_curr);
                DATA['🧮']['🧮🌡️🔼'] = Math.max(T_prev, T_curr);
            }
            // Crossing = changement d'état (0°C, T_boil) : toujours repasser en Search (nouveau régime eau)
            DATA['🧮']['🧮⚧'] = 'Search';
            DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
            dichoSameDirCount = 0;
            lastDichoSign = 0;
            expandBracketIfInvalid();
            const data_snapshot = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': snapshotEdsForConvergence()
            };
            const pushPayload = {
                innerIter: DATA['🧮']['🧮🔄☀️'] - 1,
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                temperature_K: T_prev_K,
                temperature_C: T_prev_K - CONST.KELVIN_TO_CELSIUS,
                delta_equilibre: (DATA['🧮']['🧲🔺⏮'] != null) ? DATA['🧮']['🧲🔺⏮'] : DATA['🧲']['🔺🧲'],
                phase: phaseForStep,
                albedo: DATA['🪩']['🍰🪩📿'],
                yinYang: DATA['🧮']['🧮☯'],
                data_snapshot
            };
            pushPayload.next_T_C = T_crossing_C;
            if (phaseForStep === 'Dicho') {
                pushPayload.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
                pushPayload.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
            }
            DATA['🧮']['previous'].push(pushPayload);
            window.CONVERGE.appendConvergenceStep(pushPayload);
            if (callback) callback('convergenceStep', pushPayload);
            dropLastStepSnapshot(DATA);
            if (DATA['🧮']['🧮🔄🪩'] != null) DATA['🧮']['🧮🔄🪩']++;
            const isTboilCross = (T_prev_K < T_boil && T_next_K >= T_boil) || (T_prev_K >= T_boil && T_next_K < T_boil);
            const P_atm = DATA['🫧']['🎈'];
            // À P≈0 atm : pas de liquide, seul solide↔gaz (0°C) a un sens. T_boil=100°C serait faux.
            const T_transition_C = (P_atm < 0.01) ? 0 : (isTboilCross ? (T_boil - CONST.KELVIN_TO_CELSIUS) : 0);
            const crossingPayload = {
                innerIter: -0.5,
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                phase: 'CycleEauCrossing',
                cycleNum: DATA['🧮']['🧮🔄🪩'],
                temperature_C: T_crossing_C,
                T_transition_C,
                P_atm,
                data_snapshot: {
                    '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                    '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                    '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
                }
            };
            window.CONVERGE.appendConvergenceStep(crossingPayload);
            if (callback) callback('convergenceStep', crossingPayload);
            dropLastStepSnapshot(DATA);
            H2O._lastH2OParamsCache = null;
            window._fromCrossing = true;
            window.CONVERGENCE_DEBUG = { bins: DATA['🧮']['🔬🌈'], step: DATA['🧮']['🧮🔄☀️'], delta: DATA['🧲']['🔺🧲'] };
            try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
            if (DATA['🧮']['🧮🔄🌊'] >= maxWaterPass) {
                DATA['🧮']['🧮🛑'] = 'max_water';
                return true;
            }
            const cycleResult = window.CONVERGE.cycleDeLeau ? await window.CONVERGE.cycleDeLeau(false) : { changed: false };
            window.displayConvergence();
            if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            DATA['🧮']['🧮🔄🌊']++;
            // Ne pas réinitialiser 🧮🔄🪩 : garder l'index monotone pour affichage
            // Pas de push CycleEau ici : CycleEauCrossing suffit (évite doublon "cycle 2" et T incohérente)
            continue;
        }
        // Arrêt si T inchangée (milieu bracket = T courante) ET convergé
        // Tolérance : |T - T_prev| < 0.01 K (éviter 39.3 vs 39.5°C considérés égaux par ===)
        const epsT_K = 0.01;
        if (Math.abs(DATA['🧮']['🧮🌡️'] - DATA['🧮']['🧮🌡️⏮']) < epsT_K) {
            if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) innerConverged = true;
            else {
                // Bloqué sans convergence : élargir le bracket pour pouvoir bouger
                const mid = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
                const eps = Math.max(0.5, (DATA['🧮']['🧮🌡️🔼'] - DATA['🧮']['🧮🌡️🔽']) * 0.5);
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = mid; DATA['🧮']['🧮🌡️🔼'] = mid + eps; }
                else { DATA['🧮']['🧮🌡️🔼'] = mid; DATA['🧮']['🧮🌡️🔽'] = mid - eps; }
            }
        }
        DATA['🧮']['🧮🔄☀️']++;

        // REFACTO : plus de post-step recalc water/albedo/flux/Δ ici.
        // La boucle suivante démarre par un recalc complet à T_next (lignes 755-824) :
        // water, albedo, flux et Δ sont évalués à T_next AVANT de décider du pas suivant.
        // Le bracket update + switch Dicho sont aussi faits en début de boucle (lignes 829-887).
        // => Ce bloc post-step faisait le même travail en double (2× coût de flux par itération).
        //
        // Snapshot figé à T_input (= DATA['🧮']['🧮🌡️⏮'] après sauvegarde ligne 850 de l'itération précédente) :
        // - T, Δ, water, albedo, ☯, phase, EDS : tous à T_input (state à l'entrée du pas)
        // - Bornes 🔽/🔼 : reflètent la tightening Dicho du step (utiles pour l'affichage midpoint utilisé)
        // On override snapshot['🧮']['🧮🌡️'] à T_input car DATA['🧮']['🧮🌡️'] vaut T_next après step.
        const data_snapshot = {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': snapshotEdsForConvergence()
        };
        // T affichée = température d'entrée du calcul radiatif (avant le pas), pas la sortie
        const T_input_iter = DATA['🧮']['🧮🌡️⏮'];
        data_snapshot['🧮']['🧮🌡️'] = T_input_iter; // cohérence : snapshot entier à T_input
        const pushPayload = {
            innerIter: DATA['🧮']['🧮🔄☀️'] - 1,
            albedoIter: DATA['🧮']['🧮🔄🪩'],
            waterIter: DATA['🧮']['🧮🔄🌊'],
            temperature_K: T_input_iter,
            temperature_C: T_input_iter - CONST.KELVIN_TO_CELSIUS,
            delta_equilibre: (DATA['🧮']['🧲🔺⏮'] != null) ? DATA['🧮']['🧲🔺⏮'] : DATA['🧲']['🔺🧲'],
            phase: phaseForStep,
            albedo: DATA['🪩']['🍰🪩📿'],
            yinYang: yinYangForPush,
            data_snapshot
        };
        if (phaseForStep === 'Dicho') {
            pushPayload.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
            pushPayload.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
        }
        // next_T_C = T atteinte par le pas (Search et Dicho)
        pushPayload.next_T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        window.CONVERGE.appendConvergenceStep(pushPayload);
        if (callback) callback('convergenceStep', pushPayload);
        dropLastStepSnapshot(DATA);
        DATA['🧮']['🧮🔄🪩']++;

        var payload = { iteration: DATA['🧮']['🧮🔄☀️'] - 1, T0: DATA['🧮']['🧮🌡️'], total_flux: spectral_result.total_flux, phase: phaseForStep };
        if (callback) callback('cycleCalcul', payload);
        var showSteps = DATA['🔘']['🔘🎞'] && window.isVisuPanelActive();
        if (showSteps) {
            /*
             * ================================================================
             * BRIDGE OBLIGATOIRE visuel+anim
             * ================================================================
             * NE PAS re-simplifier ce bloc en appel direct displayDichotomyStep().
             *
             * But recherché :
             * 1. le cycle de calcul envoie le résultat spectral courant à l'UI
             *    via IO_LISTENER.emit('compute:progress', payload)
             * 2. l'UI (loader_panels.js) reçoit ce payload, appelle
             *    displayDichotomyStep(), puis le plot se dessine
             * 3. displayDichotomyStep() renvoie IO_LISTENER.emit('plot:drawn', { iteration })
             * 4. SEULEMENT APRÈS ce retour, le calcul reprend le cycle suivant
             *
             * Pourquoi :
             * - en anim + visu_, si on appelle displayDichotomyStep() directement ici,
             *   le navigateur flush les draws tardivement et on perd l'enchaînement
             *   "un cycle -> un flux visible -> cycle suivant"
             * - le requestAnimationFrame seul ne suffit pas si on court-circuite
             *   le passage par l'UI / le plot
             *
             * Contrat :
             * - émission:   compute:progress(payload spectral complet)
             * - accusé:     plot:drawn(iteration identique)
             * - attente:    await plotDrawnPromise puis await RAF
             * ================================================================
             */
            payload.CO2_fraction = DATA['🫧']['🍰🫧🏭'];
            payload.result = spectral_result;
            payload.isInitial = false;
            const cycleIteration = payload.iteration;
            const plotDrawnPromise = new Promise(function (resolve) {
                const offPlotDrawn = function (drawPayload) {
                    if (drawPayload.iteration !== cycleIteration) return;
                    window.IO_LISTENER.off('plot:drawn', offPlotDrawn);
                    resolve();
                };
                window.IO_LISTENER.on('plot:drawn', offPlotDrawn);
            });
            window.IO_LISTENER.emit('compute:progress', payload);
            await plotDrawnPromise;
            await new Promise(function (resolve) { requestAnimationFrame(resolve); });
        } else {
            // scie_ ou sans anim : mise à jour légère (pas de draw spectral)
            var h2o_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
            var h2o_meteorites = (typeof window.RUNTIME_STATE.h2oTotalFromMeteorites !== 'undefined') ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
            window.RUNTIME_STATE.h2oVaporPercent = Math.min(100, Math.max(0, h2o_frac * 100 + h2o_meteorites));
            if (window.plotData) {
                window.plotData.ch4_ppm = (DATA['🫧']['🍰🫧🐄'] != null ? DATA['🫧']['🍰🫧🐄'] : 0) * 1e6;
            }
            DATA['📊'] = DATA['📊'] || {};
            DATA['📊'].total_flux = spectral_result.total_flux;
            if (window !== window.top) {
                var dataSubset = { '🧮': DATA['🧮'], '🪩': DATA['🪩'], '🫧': DATA['🫧'], '💧': DATA['💧'], '📛': snapshotEdsForConvergence(), '📜': DATA['📜'], '📊': DATA['📊'] };
                window.parent.postMessage({ type: 'cycleCalcul', DATA: dataSubset, h2oVaporPercent: window.RUNTIME_STATE.h2oVaporPercent }, '*');
            }
            if (callback) callback('cycleCalcul', { DATA: DATA, h2oVaporPercent: window.RUNTIME_STATE.h2oVaporPercent });
            // Émettre compute:progress une seule fois (chemin scie_/non-anim)
            if (window.IO_LISTENER) window.IO_LISTENER.emit('compute:progress', payload);
            const fpsOk = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
            if (fpsOk) {
                window.ORG.updateFluxLabels('cycleCalcul');
            }
        }
    }
    if (!DATA['🧮']['🧮🛑']) DATA['🧮']['🧮🛑'] = 'max_iter';
    if (apiDbg) console.log('[API_BILAN] compute fin', '🧮🛑=', DATA['🧮']['🧮🛑'], '🧮🔄☀️=', DATA['🧮']['🧮🔄☀️']);
    return true;
    } finally {
        if (computeDbgGroup) console.groupEnd();
    }
}

// Exposer les fonctions globalement. Aucune n'est dans window.DATA (DATA = données). Pas de window.FUNC.
// computeRadiativeTransfer accepte callback optionnel + options ({ renderMode: 'visu_'|'scie_' }). getEpochDateConfig dans compute.js.
CONVERGE.calculateT0 = calculateT0;
CONVERGE.initForConfig = initForConfig;
CONVERGE.cycleDeLeau = cycleDeLeau;
CONVERGE.updateConvergenceBounds = updateConvergenceBounds;
CONVERGE.computeRadiativeTransfer = computeRadiativeTransfer; // async (RAF yield indispensable), callback optionnel, options({renderMode})
CONVERGE.newDate = newDate;
CONVERGE.snapshotEdsForConvergence = snapshotEdsForConvergence;

