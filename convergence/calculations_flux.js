// ============================================================================
// File: API_BILAN/convergence/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.4.0
// - v1.4.0 (2026-10-12): pas de recherche = pente MESURÉE (sécante) ; à défaut, et pour la tolérance, rétroaction de
//   Planck au niveau d'émission 4σT_e³ (T_e = (OLR/σ)^¼) au lieu de 4σT_s³ (surface nue) — sous une atmosphère
//   épaisse, la tolérance valait ~6 000 W/m² et la recherche avançait de 4 K par pas.
// Date: [October 10, 2026]
// Logs:
// - v1.3.0: PAS DE GARDES. Supprimés : `if (callback)` (callback obligatoire), try/catch autour de
//   displayConvergence, `typeof debugMirrorConfigLogToFile` (logDiag, appelé seulement sous un drapeau log*),
//   fallbacks tol 0.1 / 1e-9, tests de finitude des détecteurs, `window.CO2 &&`, `window.IO_LISTENER &&`,
//   écriture dans window.plotData (objet de l'UI : c'est à l'UI de lire DATA). Code mort retiré :
//   updateConvergenceBounds, newDate, branche cycleDeLeau(isFirst=true) (jamais appelée, et elle lisait un
//   `callback` hors de portée), branche 🧮🔄🌊 > 0 à l'entrée (tous les appelants la remettent à 0),
//   _fromCrossing, verrou de glace « legacy » (STATE.iceEpochFixed*), OVERRIDES et diagnostic logIceFixed,
//   option renderMode (lue seulement par un log). « Crash algo » LÈVE une erreur au lieu de rendre null (null
//   = interruption pour les appelants : le crash était avalé). calculateT0 lève sur T0 ≤ 0 / NaN au lieu de
//   rendre false (initForConfig le lisait comme une interruption). DATA['📛'] n'est plus remis à null.
//   cycleEauStep() : un seul constructeur de l'instantané CycleEau (il était recopié 5 fois).
//   UN SEUL CANAL vers l'hôte : le callback. Événements 'convergenceStart' | 'convergenceStep' |
//   'convergenceRefresh' | 'cycleCalcul' (attendu : l'hôte peut rendre une promesse). Retirés du moteur :
//   CONVERGE.clearConvergenceTrace / appendConvergenceStep, window.displayConvergence, IO_LISTENER (+ pont
//   plot:drawn), isVisuPanelActive, ORG.updateFluxLabels, window.parent.postMessage, RUNTIME_STATE.h2oVaporPercent
//   (copie de DATA calculée pour l'UI), double émission de 'cycleCalcul' par pas.
// - v1.2.108: INTÉRIEUR (geology/interieur.js) — au 1er passage, l'état thermique de l'intérieur est amené à la
//   date courante (bilan d'énergie) ; tant qu'il est fondu, la surface EST le magma (T de départ = 🌡️🌕) et le
//   flux intérieur 🧲🌕 = OLR − solaire absorbé, lu sur le transfert radiatif de l'init. olrNetA(T) : OLR − S à
//   T imposée, pour intégrer le refroidissement de l'océan de magma.
// - v1.2.89: expositions regroupées sous nouveau namespace window.CONVERGE (calculateT0, initForConfig, cycleDeLeau, updateConvergenceBounds, computeRadiativeTransfer, newDate, snapshotEdsForConvergence, clearConvergenceTrace, appendConvergenceStep). Doublons window.foo retirés. Consommateurs migrés : sync_panels.js, api.js, CO2/html/*.html. Appels internes H2O/ALBEDO/ATM/GEOLOGY migrés vers namespaces.
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
// - CycleEauCrossing : T_transition_C, P_atm pour affichage 💧┴ = T°C [🎈=P atm]
// - pushPayload : albedoIter (🪩), waterIter (💧) ; waterPassCrossing supprimé
// ============================================================================

var CONVERGE = window.CONVERGE = {};

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

/** Log EDS breakdown pour debug (part H₂O). */
/** Log unique à la convergence : 1) W/m² (flux in/out, Δ, EDS total + par composant) ; 2) T°C, albedo, % EDS. */
function logConvergenceT() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    if (!CONFIG_COMPUTE.logEdsDiagnostic) return;
    const T_C = (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(2);
    const deltaNum = DATA['🧲']['🔺🧲'];
    const delta = deltaNum.toFixed(3);
    const b = DATA['📛'];
    const mEds1 = '[convergence] T=' + T_C + '°C Δ=' + delta + ' EDS=' + b['🧲📛'].toFixed(1)
        + ' CO2%=' + (b['🍰📛🏭'] * 100).toFixed(1) + ' H2O%=' + (b['🍰📛💧'] * 100).toFixed(1);
    console.log(mEds1);
    window.debugMirrorConfigLogToFile('logEdsDiagnostic', mEds1);
    const sens = (Math.abs(deltaNum) <= DATA['🧮']['🧲🔬']) ? 'équilibre (|Δ|≤tol)' : (deltaNum < 0 ? 'trop de sortie → refroidir' : 'pas assez de sortie → réchauffer');
    const mEds2 = '[convergence] ' + delta + ' ' + sens;
    console.log(mEds2);
    window.debugMirrorConfigLogToFile('logEdsDiagnostic', mEds2);
}

/** Construit l'objet DATA['📛'] : EDS total (🧲📛), parts [0,1] (🍰📛❀), W/m² par composant (🧲📛❀). */
function buildEdsBreakdown(b) {
    const E = b.EDS_Wm2;
    const pCloud = b.Clouds.pct;
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
    const snap = JSON.parse(JSON.stringify(window.DATA['📛']));
    delete snap['🔺📛💧'];
    return snap;
}

/** 6 derniers pas : yoyo (|Δ| ne retombe pas, signes alternent) ou sauts Δ type bistabilité glace/α (max−min > 12 W/m²). */
function detectConvergenceLimitCycle(tCArr, dWm2Arr, tolWm2) {
    if (tCArr.length < 6 || dWm2Arr.length < 6) return false;
    const tS = tCArr.slice(-6);
    const dS = dWm2Arr.slice(-6);
    const tMin = Math.min.apply(null, tS);
    const tMax = Math.max.apply(null, tS);
    const rangeT = tMax - tMin;
    var meanAD = 0;
    var flips = 0;
    for (var j = 0; j < 6; j++) meanAD += Math.abs(dS[j]);
    meanAD /= 6;
    for (var k = 1; k < 6; k++) {
        if (dS[k - 1] * dS[k] < 0) flips++;
    }
    const dMin = Math.min.apply(null, dS);
    const dMax = Math.max.apply(null, dS);
    const deltaSpread = dMax - dMin;
    const highResidual = meanAD > Math.max(0.5, 2 * tolWm2);
    // (1) T presque fixe, résidu moyen haut, Δ change de signe souvent
    if (rangeT <= 5 && highResidual && flips >= 2) return true;
    // (2) Plage T modérée (ex. ⛄ −2 °C ↔ +0,9 °C) mais Δ oscille fort (Briegleb / glace vs eau ouverte)
    if (rangeT <= 10 && deltaSpread > 12 && flips >= 1 && meanAD > 1) return true;
    return false;
}

/** 4 derniers pas : Δ en « période 2 » (Δₙ ≈ Δₙ₋₂, signes alternés) et T sur ≤2 °C — cas albédo 39,3↔39,9 %. */
function detectDeltaPeriod2Stall(tCArr, dWm2Arr, tolWm2) {
    if (dWm2Arr.length < 4) return false;
    const dS = dWm2Arr.slice(-4);
    if (tCArr.length >= 4) {
        const tS = tCArr.slice(-4);
        const tMin = Math.min.apply(null, tS);
        const tMax = Math.max.apply(null, tS);
        if (tMax - tMin > 2) return false;
    }
    if (dS[0] * dS[1] >= 0 || dS[1] * dS[2] >= 0 || dS[2] * dS[3] >= 0) return false;
    const pairEps = Math.max(0.35, 2 * tolWm2);
    if (Math.abs(dS[0] - dS[2]) > pairEps) return false;
    if (Math.abs(dS[1] - dS[3]) > pairEps) return false;
    return true;
}

/** 4 derniers pas : plateau T (≤1 °C) + Δ change de signe au moins 2× — hystérésis albédo/eau sans dérive T (ex. 2,3↔2,4 °C). */
function detectMicroHysteresisStall(tCArr, dWm2Arr, tolWm2) {
    if (tCArr.length < 4 || dWm2Arr.length < 4) return false;
    const tS = tCArr.slice(-4);
    const dS = dWm2Arr.slice(-4);
    const tMin = Math.min.apply(null, tS);
    const tMax = Math.max.apply(null, tS);
    if (tMax - tMin > 1) return false;
    var flips = 0;
    for (var k = 1; k < 4; k++) {
        if (dS[k - 1] * dS[k] < 0) flips++;
    }
    if (flips < 2) return false;
    const dMin = Math.min.apply(null, dS);
    const dMax = Math.max.apply(null, dS);
    const spread = dMax - dMin;
    var meanAD = 0;
    for (var j = 0; j < 4; j++) meanAD += Math.abs(dS[j]);
    meanAD /= 4;
    return spread <= 10 && meanAD > 2 * tolWm2;
}

function detectOscillationStallOnTrace(Tosc, tolWm2) {
    return detectDeltaPeriod2Stall(Tosc.t, Tosc.d, tolWm2)
        || detectConvergenceLimitCycle(Tosc.t, Tosc.d, tolWm2)
        || detectMicroHysteresisStall(Tosc.t, Tosc.d, tolWm2);
}

/**
 * Rétroaction de Planck au niveau d'émission [W/m²/K] : 4σT_e³, T_e = (OLR/σ)^¼. C'est la sensibilité de l'OLR à
 * la température quand tout le profil se décale — celle de la planète, pas celle d'une surface nue (4σT_s³).
 * Terre actuelle : 3,8 (T_e = 255 K) contre 5,4 avec T_s ; sous une atmosphère de vapeur à 1 360 K : ~10 contre 570.
 */
function penteDePlanck(OLR) {
    const CONST = window.CONST;
    return 4 * CONST.STEFAN_BOLTZMANN * Math.pow(OLR / CONST.STEFAN_BOLTZMANN, 0.75);
}

/** Tolérance flux (W/m²) = max(penteDePlanck(OLR) × precision_K, tolMinWm2) : « T à precision_K de l'équilibre ».
 *  OLR : celui du dernier transfert ; avant le premier, l'émission est celle de la surface (σT⁴). */
function computeToleranceWm2(OLR, precision_K) {
    return Math.max(penteDePlanck(OLR) * precision_K, window.CONFIG_COMPUTE.tolMinWm2);
}

// Calcule T0 initial. Nouveau run (previous vide) : toujours T0 = époque. En anim en cours (previous non vide) : garder T actuelle.
function calculateT0() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // En mode anim : partir toujours de la T0 actuelle du modèle, même si previous est vide (nouveau run).
    // previous est réinitialisé à [] à chaque epoch (sync_panels.js:237), donc !isNewRun
    // était toujours false au premier calcul — le mode anim ne fonctionnait jamais.
    if (window.SYNC_STATE.animEnabled) {
        DATA['🧮']['🧮🌡️🚩'] = DATA['🧮']['🧮🌡️']; // anim : garder T0 actuel
    } else {
        // sans anim : T0 = graine de l'époque + 🔺🌡️💫 × 📿💫
        DATA['🧮']['🧮🌡️🚩'] = DATA['📅']['🌡️🧮'] + DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
    }
    if (!(DATA['🧮']['🧮🌡️🚩'] > 0)) {
        throw new Error('[calculateT0] T0 = ' + DATA['🧮']['🧮🌡️🚩'] + ' K (époque ' + DATA['📜']['🗿']
            + ', anim=' + window.SYNC_STATE.animEnabled + ', 📅🌡️🧮=' + DATA['📅']['🌡️🧮'] + ')');
    }
    DATA['🧮']['🧮⚧'] = 'Init'; // Phase d'initialisation
    DATA['🧮']['🧮☯'] = 0;
    delete DATA['🧮']['🧮🌡️🔽'];
    delete DATA['🧮']['🧮🌡️🔼'];
    DATA['🧲']['🧲☀️🔽'] = 0;
    DATA['🧲']['🧲🌕🔽'] = 0;
    DATA['🧲']['🧲🌑🔼'] = 0;
    DATA['🧲']['🧲🌈🔼'] = 0;
    DATA['🧲']['🧲🪩🔼'] = 0;
    DATA['🧲']['🔺🧲'] = 0;

    // IMPORTANT: On met toujours à jour DATA['🧮']['🧮🌡️'] avec la valeur calculée
    // Si animation activée : T0_base est lu depuis DATA['🧮']['🧮🌡️'].
    // Si animation désactivée : T0 = DATA['📅']['🌡️🧮'] + adjustment.
    // On doit mettre à jour DATA['🧮']['🧮🌡️'] pour que la convergence utilise cette nouvelle valeur
    // Pour la convergence, c'est TOUJOURS DATA['🧮']['🧮🌡️'] qui est utilisé
    DATA['🧮']['🧮🌡️'] = DATA['🧮']['🧮🌡️🚩'];
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(window.CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4), DATA['📜']['🧲🔬']);
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
// Fonction supprimée : getGasValuesFromConfig() n'était pas utilisée
// Les valeurs sont directement dans DATA['🫧'] après calculateAtmosphereComposition()

// ============================================================================
// initForConfig — Config sans aucun calcul radiatif (affichée dès le debug)
// ============================================================================
function initForConfig() {
    if (window.ABORT_COMPUTE) return false;   // interruption demandée : vraie branche, pas une garde
    const DATA = window.DATA;
    const ALBEDO = window.ALBEDO;
    const ATM = window.ATM;
    const COMPUTE = window.COMPUTE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const H2O = window.H2O;
    // getEpochDateConfig AVANT getSoleil/getNoyau : la date courante (📜📅) et le rayon (📜📐) en sortent.
    COMPUTE.getEpochDateConfig();
    COMPUTE.getSoleil();
    COMPUTE.getNoyau();
    calculateT0();
    ATM.calculateAtmosphereComposition();
    ATM.calculatePressureAtm();
    // v1.2.96 : SEED OCÉAN CO₂ À L'ÉQUILIBRE HENRY (analytique, T = T_ref ⇒ ratio_T = ratio_ref).
    // Garantit que calculateCO2Partition donne flux net = 0 au pas 0 du bench (bench = visu).
    // Produit = 0 si ⚖️💧=0 (⚫ 🔥 : pas de mer) OU si EPOCH['🌊🏭']=0 (⛄ : glace globale coupe Henry).
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const hasOceanWaterGate = (DATA['⚖️']['⚖️💧'] > 0) ? 1.0 : 0.0;
    const epochPumpGate = (EPOCH['🌊🏭'] > 0) ? 1.0 : 0.0;
    const ratio_ref_init = Math.max(0.1, CONFIG_COMPUTE.co2OceanRatioRef);
    const oceanPartitionFactor01 = Math.max(0, CONFIG_COMPUTE.co2OceanPartitionFactor01);
    DATA['🌊']['⚖️🌊🏭'] = hasOceanWaterGate * epochPumpGate * oceanPartitionFactor01 * ratio_ref_init * DATA['⚖️']['⚖️🏭'];
    ALBEDO.calculateGeologySurfaces();
    // Partition eau une fois avec T0 de la config (cache invalidé pour forcer le recalcul)
    // 🔒 WORKAROUND : En Init, calculateH2OParametersWithIteration converge vers 🍰🫧💧=0 (précip sans évap).
    // Utiliser Search (vapeur potentielle) pour avoir nuages/albédo cohérents dès le départ.
    // (calculateT0 vient de poser la phase 'Init'.)
    DATA['🧮']['🧮⚧'] = 'Search';
    H2O._lastH2OParamsCache = null;
    H2O.calculateH2OParameters();
    DATA['🧮']['🧮⚧'] = 'Init';
    ALBEDO.calculateAlbedo();
    // Premier run : pas de delta → 1e9 donne bins=100 ; run suivant : delta du run précédent
    DATA['🧮']['🔬🌈'] = getBinsFromDelta(DATA['🧲']['🔺🧲']);
    COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    return true;
}

// ============================================================================
// cycleDeLeau — Cycle eau (h2o, précip, albedo, nuages). Retourne Promise<{ changed }>.
// isFirst: true = après config, on pousse le premier cycle dans Convergence.
// Async + yields pour que le bouton Stop soit cliquable pendant les calculs.
// ============================================================================
/** Dernier point de la recherche (T, Δ) : sert à mesurer la pente réelle dΔ/dT. Remis à zéro à chaque calcul. */
let dernierPointRecherche = null;

/** Calcule l'incrément Search (incTemp) en K.
 * Pente MESURÉE (sécante sur les deux derniers points) quand elle est exploitable (Δ décroît avec T) : ΔT = −Δ/(dΔ/dT).
 * Sinon (1er pas, pente non décroissante) : rétroaction de Planck au niveau d'émission, ΔT = Δ/(4σT_e³) — l'ancien
 * 4σT_s³ était celle d'une surface nue. Sous une atmosphère épaisse la vraie pente
 * d'OLR est bien plus faible que 4σT³ (sous une atmosphère de vapeur, ~80 W/m²/K contre 3 500 à 2 500 K) : le pas
 * corps noir y fait des pas de 4 à 20 K et n'atteint pas l'équilibre en 101 itérations.
 * Cap max : CONFIG_COMPUTE.maxSearchStepK. Si |Δ| > largeDeltaFactor×tol : maxSearchStepLargeK.
 */
function computeSearchIncrement() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const T = DATA['🧮']['🧮🌡️'];
    if (!Number.isFinite(T) || T <= 0) {
        throw new Error('[computeSearchIncrement] contrat: 🧮🌡️ Kelvin fini > 0 — reçu ' + T);
    }
    const dFlux = DATA['🧲']['🔺🧲'];
    if (!Number.isFinite(dFlux)) {
        throw new Error('[computeSearchIncrement] contrat: 🔺🧲 (déséquilibre radiatif) fini — reçu ' + dFlux);
    }
    const sigmaT3 = penteDePlanck(DATA['🧲']['🧲🌈🔼']);
    const pente = (dernierPointRecherche !== null && dernierPointRecherche.T !== T)
        ? (dFlux - dernierPointRecherche.d) / (T - dernierPointRecherche.T) : 0;
    let res = pente < 0 ? -dFlux / pente : dFlux / sigmaT3;
    dernierPointRecherche = { T: T, d: dFlux };
    if (Number.isNaN(res)) {
        throw new Error('[computeSearchIncrement] ΔT=Δ/(4σT³) indéterminé (T=' + T + ' Δ=' + dFlux + ' 4σT³=' + sigmaT3 + ')');
    }
    const cap = Math.min(CONFIG_COMPUTE.maxSearchStepLargeK,
        (Math.abs(dFlux) > CONFIG_COMPUTE.largeDeltaFactor * DATA['🧮']['🧲🔬'])
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

async function cycleDeLeau() {
    if (window.ABORT_COMPUTE) return { changed: false };   // interruption demandée
    const DATA = window.DATA;
    const ALBEDO = window.ALBEDO;
    const COMPUTE = window.COMPUTE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const H2O = window.H2O;
    // Cycle du carbone (pompe océanique), puis composition : calculateAtmosphereComposition() remet 🍰🫧💧 à 0,
    // H2O passe donc après.
    window.CO2.calculateCO2Partition();
    window.ATM.calculateAtmosphereComposition();
    window.ATM.calculatePressureAtm();
    H2O.calculateH2OParameters();
    if (window.ABORT_COMPUTE) return { changed: false };
    H2O.calculatePrecipitationFeedback();
    ALBEDO.calculateAlbedo();
    if (window.ABORT_COMPUTE) return { changed: false };
    ALBEDO.calculateCloudFormationIndex();

    const { T_low_K, T_high_K } = PHYS.getWaterCycleTempBoundsFromPressure(DATA['🫧']['🎈']);
    if (DATA['🧮']['🧮🌡️'] < T_low_K || DATA['🧮']['🧮🌡️'] > T_high_K) {
        COMPUTE._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
        return { changed: false };
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
    if (p.length) p[p.length - 1].data_snapshot = null;
}

/** Un pas « CycleEau » (eau / albédo à T fixe) : trace de convergence + callback, puis snapshot libéré. */
function cycleEauStep(callback, albedoIter) {
    const DATA = window.DATA;
    const payload = {
        innerIter: null,
        albedoIter: albedoIter,
        waterIter: DATA['🧮']['🧮🔄🌊'],
        phase: 'CycleEau',
        data_snapshot: {
            '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
            '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
            '💧': JSON.parse(JSON.stringify(DATA['💧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '⚖️': JSON.parse(JSON.stringify(DATA['⚖️'])),
            '🌊': JSON.parse(JSON.stringify(DATA['🌊']))
        }
    };
    callback('convergenceStep', payload);
    dropLastStepSnapshot(DATA);
}

/** Journal fichier des diagnostics (drapeaux CONFIG_COMPUTE.log*) : console + miroir hôte. */
function logDiag(flag, msg) {
    console.log(msg);
    window.debugMirrorConfigLogToFile(flag, msg);
}

/**
 * Convergence radiative depuis l'état préparé par initForConfig (🧮🔄🌊 = 0, previous = []).
 * @param {function(string, object)} callback - reçoit 'convergenceStep' et 'cycleCalcul'
 */
async function computeRadiativeTransfer(callback) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const H2O = window.H2O;
    const apiDbg = window.UI_STATE.debugAPI;
    if (apiDbg) console.groupCollapsed('[API_BILAN] computeRadiativeTransfer epoch=', DATA['📜']['🗿']);
    try {
    if (window.ABORT_COMPUTE) return null;
    callback('convergenceStart', null);
    dernierPointRecherche = null;
    window._convergenceOscTrace = { t: [], d: [] };
    const maxWaterPass = 5;
    DATA['🧮']['🧮🔄🪩'] = 0;
    // Intérieur amené à la date courante (bilan d'énergie, geology/interieur.js). Fondu : la surface EST le
    // magma — la T de départ est celle de l'intérieur, et le flux intérieur sortira du radiatif de l'init.
    await window.INTERIEUR.avancer(DATA, olrNetA);
    if (window.INTERIEUR.estFondu(DATA)) {
        const Tm = DATA['🌕']['🌡️🌕'];
        DATA['🧮']['🧮🌡️'] = Tm; DATA['🧮']['🧮🌡️⏮'] = Tm; DATA['🧮']['🧮🌡️🚩'] = Tm;
    }

    // Spin-up climatologique : cycles et refs confirmés en config (majuscules). Poids = ratio clampé [0,1].
    const spinupWeightAtm = Math.max(0, Math.min(1, DATA['⚖️']['⚖️🫧'] / CONFIG_COMPUTE.climateSpinupAtmMassRefKg));
    const spinupWeightWater = Math.max(0, Math.min(1, DATA['⚖️']['⚖️💧'] / CONFIG_COMPUTE.climateSpinupWaterMassRefKg));
    const climateSpinupCyclesEffective = Math.max(0, Math.round(CONFIG_COMPUTE.climateSpinupCycles * spinupWeightAtm * spinupWeightWater));
    if (apiDbg) console.log('[API_BILAN] pré-radiatif', 'spinupEff=' + climateSpinupCyclesEffective, 'maxRadiatifIters=' + CONFIG_COMPUTE.maxRadiatifIters);
    if (climateSpinupCyclesEffective > 0) {
        const phasePrevSpinup = DATA['🧮']['🧮⚧'];
        DATA['🧮']['🧮⚧'] = 'Search';
        for (let w = 0; w < climateSpinupCyclesEffective; w++) {
            const resSpinup = await window.CONVERGE.cycleDeLeau();
            if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[spinup] CycleEau #' + (w + 1) + ' @' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + '°C');
            cycleEauStep(callback, w);
            if (!resSpinup.changed) break;
            if (window.ABORT_COMPUTE) return null;
        }
        DATA['🧮']['🧮⚧'] = phasePrevSpinup;
    } else {
        for (let w = 0; w < CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit; w++) {
            const resInit = await window.CONVERGE.cycleDeLeau();
            if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[cycle] Init @' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + '°C');
            cycleEauStep(callback, w);
            if (!resInit.changed) break;
            if (window.ABORT_COMPUTE) return null;
        }
    }

    // Même grille verticale qu’aux pas Search (v1.2.47) ; vapeur C–C à T courante sans branche Init
    // (les cycles ci‑dessus peuvent laisser 🍰🫧💧≈0 : itération Init/précip ou précip feedback × 🔺⏳ long).
    window.ATM.updateAtmosphereHeightFromCurrentT();
    const phaseBeforeFirstFlux = DATA['🧮']['🧮⚧'];
    DATA['🧮']['🧮⚧'] = 'Search';
    H2O._lastH2OParamsCache = null;
    H2O.calculateH2OParameters();
    window.ALBEDO.calculateAlbedo();
    DATA['🧮']['🧮⚧'] = phaseBeforeFirstFlux;

    const flux_solaire_absorbe_init = DATA['☀️']['🧲☀️🎱'] * (1 - DATA['🪩']['🍰🪩📿']);

    await window.calculateFluxForT0();
    const spectral_result_init = window.RADIATIVE.getSpectralResultFromDATA();
    // Intérieur fondu : ce qu'il perd est ce qui part vers l'espace moins ce que le Soleil apporte (surface = magma).
    if (window.INTERIEUR.estFondu(DATA)) {
        DATA['🌕']['🧲🌕'] = spectral_result_init.total_flux - flux_solaire_absorbe_init;
        DATA['🌕']['🔋🌕'] = DATA['🌕']['🧲🌕'] * 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
    }
    const flux_entrant_init = flux_solaire_absorbe_init + DATA['🌕']['🧲🌕'];
    // Avertissement mémoire (une fois par session) : pas de garantie cross‑machine, informer si grosse grille
    if (!window._spectralMemoryWarned) {
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
    if (!Number.isFinite(flux_entrant_init) || !Number.isFinite(flux_sortant_effectif_init) || !Number.isFinite(delta_equilibre_init)) {
        throw new Error('[computeRadiativeTransfer] Init: flux TOA non fini — entrant=' + flux_entrant_init
            + ' sortant_olr=' + flux_sortant_effectif_init + ' 🧮🌡️=' + DATA['🧮']['🧮🌡️']
            + ' (spectral/physique, pas le pas Search)');
    }
    // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
    DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_init;
    DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
    // À l'équilibre TOA : flux_entrant = flux_sortant ⇒ 🔺🧲 ≈ 0 ; sinon 🧲🌈🔼 (OLR) ou flux solaire incohérent. Voir doc/API/SENS_CONVERGENCE_ET_VALEURS.md §2.1.
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[Init] OLR=' + flux_sortant_effectif_init.toFixed(2) + ' Δ=' + delta_equilibre_init.toFixed(2));
    DATA['📛'] = buildEdsBreakdown(DATA['📊'].eds_breakdown);
    window.H2O.calculateH2OGreenhouseForcing();
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(flux_sortant_effectif_init, DATA['📜']['🧲🔬']);

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
    callback('convergenceStep', initPayload);
    dropLastStepSnapshot(DATA);
    if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[Init] ' + (delta_equilibre_init < 0 ? 'trop de sortie → refroidir' : (delta_equilibre_init > 0 ? 'pas assez de sortie → réchauffer' : 'équilibre')));
    DATA['🧮']['🧮🌡️'] = T_init_K + incInit;
    DATA['🧮']['🧮🔄🪩']++; // Cycle eau s'incrémente à Init (premier cycle après = 1)
    callback('convergenceRefresh', null);

    const maxInnerIters = CONFIG_COMPUTE.maxRadiatifIters;
    let innerConverged = false;
    DATA['🧮']['🧮🛑'] = null;
    let dichoSameDirCount = 0;
    let lastDichoSign = 0;
    DATA['🧮']['🧮🌡️Hist'] = [];
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        if (apiDbg) console.log('[API_BILAN] radiatif step', DATA['🧮']['🧮🔄☀️'], 'phase', DATA['🧮']['🧮⚧'], 'T_C', (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(2), 'Δ', DATA['🧲']['🔺🧲'].toFixed(4));
        if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
        DATA['🧮']['🔬🌈'] = getBinsFromDelta(DATA['🧲']['🔺🧲']);
        // Mettre à jour hauteur atmosphère (📏🫧🧿, 📏🫧🛩) depuis T courante : même grille verticale à 15,8°C en cold/warm start
        window.ATM.updateAtmosphereHeightFromCurrentT();
        DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧲']['🧲🌈🔼'], DATA['📜']['🧲🔬']);
        // Météo : 2 ou N cycles eau/albédo par pas radiatif ; un snapshot CycleEau par cycle pour affichage
        const maxWaterAlbedo = CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep;
        if (maxWaterAlbedo <= 1) {
            window.H2O.calculateH2OParameters();
            window.ALBEDO.calculateAlbedo();
            if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[cycle] radiatif @' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + '°C CO₂=' + DATA['⚖️']['⚖️🏭'].toExponential(2) + 'kg');
            cycleEauStep(callback, DATA['🧮']['🧮🔄🪩']);
        } else {
            const baseAlbedoIter = DATA['🧮']['🧮🔄🪩'] * maxWaterAlbedo;
            for (let w = 0; w < maxWaterAlbedo; w++) {
                const res = await window.CONVERGE.cycleDeLeau();
                if (CONFIG_COMPUTE.logEdsDiagnostic) logDiag('logEdsDiagnostic', '[cycle] radiatif w=' + w + ' @' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + '°C CO₂=' + DATA['⚖️']['⚖️🏭'].toExponential(2) + 'kg');
                cycleEauStep(callback, baseAlbedoIter + w);
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
                        const mBe = '[conv-diag] bracket-expand Dicho→Search step=' + DATA['🧮']['🧮🔄☀️'] + ' T=' + T_C_exp.toFixed(2) + '°C Δ=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' signΔ=' + signDelta + ' expK=' + expK + ' → [' + bLowC.toFixed(2) + ', ' + bHighC.toFixed(2) + ']°C';
                        logDiag('logEdsDiagnostic', mBe);
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

        // ☯=0 en Search ⇒ Math.sign(Δ)=0 ⇒ Δ=0 : équilibre atteint, sinon l'algorithme est incohérent.
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮☯'] === 0) {
            if (Math.abs(DATA['🧲']['🔺🧲']) > DATA['🧮']['🧲🔬']) {
                const F = DATA['🧲'];
                throw new Error('Crash algo: ☯=0 en phase Search, Δ hors tol. step=' + DATA['🧮']['🧮🔄☀️'] + ' flux_entrant=' + (F['🧲☀️🔽'] + F['🧲🌕🔽']) + ' flux_sortant=' + F['🧲🌈🔼'] + ' 🔺🧲=' + F['🔺🧲'] + ' tol=' + DATA['🧮']['🧲🔬']);
            }
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'converged';
        }
        expandBracketIfInvalid();
        if (CONFIG_COMPUTE.logEdsDiagnostic) {
            // 🔽/🔼 n'existent pas encore au 1er pas Search (calculateT0 les efface) : affichés NaN.
            const K = CONST.KELVIN_TO_CELSIUS;
            logDiag('logEdsDiagnostic', '[conv-diag] step=' + DATA['🧮']['🧮🔄☀️'] + ' ⚧=' + DATA['🧮']['🧮⚧'] + ' ☯=' + DATA['🧮']['🧮☯']
                + ' T=' + (DATA['🧮']['🧮🌡️'] - K).toFixed(2) + '°C Δ=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' 🧲📛=' + DATA['📛']['🧲📛'].toFixed(2)
                + ' [🔽=' + (DATA['🧮']['🧮🌡️🔽'] - K).toFixed(2) + ', 🔼=' + (DATA['🧮']['🧮🌡️🔼'] - K).toFixed(2) + ']°C');
        }
        window.CONVERGENCE_DEBUG = { bins: DATA['🧮']['🔬🌈'], step: DATA['🧮']['🧮🔄☀️'], delta: DATA['🧲']['🔺🧲'] };
        callback('convergenceRefresh', null);

        // Arrêt quand |Δ| ≤ tol.
        if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) {
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'converged';
            // Sync DATA['📊'] avec 🔬🌈 : si convergence dès la 1re itération, 📊 peut encore être à 100 bins (init)
            const currentBins = DATA['🧮']['🔬🌈'];
            const actualBins = DATA['📊'].lambda_range.length;
            if (actualBins !== currentBins) {
                await window.calculateFluxForT0();
                window.RADIATIVE.calculateRadiativeCapacities();
                const spectral_sync = window.RADIATIVE.getSpectralResultFromDATA();
                DATA['🧲']['🧲🌈🔼'] = spectral_sync.total_flux;
                DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
                DATA['📛'] = buildEdsBreakdown(DATA['📊'].eds_breakdown);
                window.H2O.calculateH2OGreenhouseForcing();
            }
            const maxBins = CONFIG_COMPUTE.maxSpectralBinsConvergence;
            const estMBFinal = (maxBins * DATA['📊'].z_range.length * 5 * 8) / 1e6;
            const skipFinalPassRAM = estMBFinal > CONFIG_COMPUTE.spectralMaxMB;
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
            // ── ATTRIBUTION EDS PAR RETRAIT ──────────────────────────────────────────────
            // Ici et nulle part ailleurs : l'époque est convergée, à sa température finale et à sa
            // résolution spectrale finale. Quatre passes de plus, pas quarante.
            // Écrase les 🍰📛❀ / 🧲📛❀ que buildEdsBreakdown vient de poser depuis `sum_blocked`,
            // qui compte les traversées de couches et pas l'effet de serre : il donnait les nuages
            // à 3 % de l'EDS quand le retrait en mesure 37 %. Voir doc/DIAGNOSTIC_ATTRIBUTION_EDS.md.
            if (CONFIG_COMPUTE.edsAttributionByRemoval && DATA['📛']) {
                const shares = await window.RADIATIVE.computeEdsRemovalShares();
                if (shares && shares.pct) {
                    const E = DATA['📛']['🧲📛'];
                    DATA['📛']['🍰📛🏭'] = shares.pct['🏭'];
                    DATA['📛']['🍰📛💧'] = shares.pct['💧'];
                    DATA['📛']['🍰📛🐄'] = shares.pct['🐄'];
                    DATA['📛']['🍰📛⛅'] = shares.pct['⛅'];
                    DATA['📛']['🧲📛🏭'] = E * shares.pct['🏭'];
                    DATA['📛']['🧲📛💧'] = E * shares.pct['💧'];
                    DATA['📛']['🧲📛🐄'] = E * shares.pct['🐄'];
                    DATA['📛']['🧲📛⛅'] = E * shares.pct['⛅'];
                    // 🔺📛💧 (ΔF H₂O) se dérive de 🧲📛💧 : à refaire après l'écrasement.
                    window.H2O.calculateH2OGreenhouseForcing();
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
            callback('convergenceStep', pushConv);
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
        // Search : pas linéarisé ; Dicho : milieu du bracket. (La phase est forcément l'une des deux ici.)
        let T_next_K;
        if (DATA['🧮']['🧮⚧'] === 'Search') {
            const increment = computeSearchIncrement();
            const T_curr_S = DATA['🧮']['🧮🌡️'];
            T_next_K = T_curr_S + increment;
            // Garde : Δ>0 ⇒ T augmente, Δ<0 ⇒ T diminue (éviter T_next opposé au sens de Δ)
            if ((DATA['🧲']['🔺🧲'] > 0 && T_next_K < T_curr_S) || (DATA['🧲']['🔺🧲'] < 0 && T_next_K > T_curr_S)) {
                const incAbs = Math.abs(increment);
                T_next_K = DATA['🧲']['🔺🧲'] > 0 ? T_curr_S + incAbs : T_curr_S - incAbs;
            }
            T_next_K = Math.min(T_next_K, CONFIG_COMPUTE.maxSearchT_K);
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
        } else {
            throw new Error('[computeRadiativeTransfer] phase inattendue avant le pas : ' + DATA['🧮']['🧮⚧']);
        }
        const T_boil = window.H2O.getBoilingPointKFromPressure(DATA['🫧']['🎈']);
        const crosses = (DATA['🧮']['🧮🌡️⏮'] < CONST.T0_WATER && T_next_K >= CONST.T0_WATER) || (DATA['🧮']['🧮🌡️⏮'] >= CONST.T0_WATER && T_next_K < CONST.T0_WATER)
            || (DATA['🧮']['🧮🌡️⏮'] < T_boil && T_next_K >= T_boil) || (DATA['🧮']['🧮🌡️⏮'] >= T_boil && T_next_K < T_boil);
        if (crosses) {
            const T_prev_K = DATA['🧮']['🧮🌡️⏮'];
            const T_crossing_C = T_next_K - CONST.KELVIN_TO_CELSIUS;
            DATA['🧮']['🧮🔄☀️']++;
            window.H2O.calculateH2OParameters();
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
                delta_equilibre: DATA['🧮']['🧲🔺⏮'],
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
            callback('convergenceStep', pushPayload);
            dropLastStepSnapshot(DATA);
            DATA['🧮']['🧮🔄🪩']++;
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
            callback('convergenceStep', crossingPayload);
            dropLastStepSnapshot(DATA);
            H2O._lastH2OParamsCache = null;
            window.CONVERGENCE_DEBUG = { bins: DATA['🧮']['🔬🌈'], step: DATA['🧮']['🧮🔄☀️'], delta: DATA['🧲']['🔺🧲'] };
            callback('convergenceRefresh', null);
            if (DATA['🧮']['🧮🔄🌊'] >= maxWaterPass) {
                DATA['🧮']['🧮🛑'] = 'max_water';
                return true;
            }
            await window.CONVERGE.cycleDeLeau();
            callback('convergenceRefresh', null);
            if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            DATA['🧮']['🧮🔄🌊']++;
            // Ne pas réinitialiser 🧮🔄🪩 : garder l'index monotone pour affichage
            // Pas de push CycleEau ici : CycleEauCrossing suffit (évite doublon "cycle 2" et T incohérente)
            continue;
        }
        // Arrêt si T inchangée vs n−1 ou même qu’un retour n−2 / n−3 (🧮🌡️Hist) ; si |Δ|>tol mais motif
        // d’oscillation (dont Δ≈Δ_{n−2}) → oscillation, sinon élargir le bracket.
        const epsT_K = 0.01;
        const T_currSt = DATA['🧮']['🧮🌡️'];
        const T_inSt = DATA['🧮']['🧮🌡️⏮'];
        const Hst = DATA['🧮']['🧮🌡️Hist'];
        const nearTK = function (a, b) { return Math.abs(a - b) < epsT_K; };
        // Hst[1], Hst[2] : undefined tant que l'historique est court → NaN → pas proche (comparaison fausse).
        const tStagn = nearTK(T_currSt, T_inSt) || nearTK(T_currSt, Hst[1]) || nearTK(T_currSt, Hst[2]);
        const twStall = DATA['🧮']['🧲🔬'];
        const histPush = DATA['🧮']['🧮🌡️Hist'];
        histPush.unshift(T_currSt);
        if (histPush.length > 3) histPush.length = 3;
        (function hystTraceOsc_() {
            const tC = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            const dF = DATA['🧲']['🔺🧲'];
            const T = window._convergenceOscTrace;
            T.t.push(tC);
            T.d.push(dF);
            if (T.t.length > 8) { T.t.shift(); T.d.shift(); }
        })();
        if (tStagn) {
            const oscNow = detectOscillationStallOnTrace(window._convergenceOscTrace, twStall);
            if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) innerConverged = true;
            else if (oscNow) {
                innerConverged = true;
                DATA['🧮']['🧮🛑'] = 'oscillation';
            } else {
                const mid = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
                const eps = Math.max(0.5, (DATA['🧮']['🧮🌡️🔼'] - DATA['🧮']['🧮🌡️🔽']) * 0.5);
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = mid; DATA['🧮']['🧮🌡️🔼'] = mid + eps; }
                else { DATA['🧮']['🧮🌡️🔼'] = mid; DATA['🧮']['🧮🌡️🔽'] = mid - eps; }
            }
        }
        if (!innerConverged && detectOscillationStallOnTrace(window._convergenceOscTrace, twStall)) {
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'oscillation';
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
            delta_equilibre: DATA['🧮']['🧲🔺⏮'],
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
        callback('convergenceStep', pushPayload);
        dropLastStepSnapshot(DATA);
        DATA['🧮']['🧮🔄🪩']++;

        // Fin de pas : UNE émission. L'hôte en fait ce qu'il veut (rafraîchir des étiquettes, prévenir une page
        // parente, dessiner le spectre) ; s'il rend une promesse (dessin pas à pas en animation), on l'attend.
        await callback('cycleCalcul', {
            iteration: DATA['🧮']['🧮🔄☀️'] - 1,
            T0: DATA['🧮']['🧮🌡️'],
            total_flux: spectral_result.total_flux,
            phase: phaseForStep,
            CO2_fraction: DATA['🫧']['🍰🫧🏭'],
            result: spectral_result,
            isInitial: false
        });
    }
    if (!DATA['🧮']['🧮🛑']) {
        const Tosc = window._convergenceOscTrace;
        if (!innerConverged && detectOscillationStallOnTrace(Tosc, DATA['🧮']['🧲🔬'])) {
            DATA['🧮']['🧮🛑'] = 'oscillation';
        } else {
            DATA['🧮']['🧮🛑'] = 'max_iter';
        }
    }
    if (apiDbg) console.log('[API_BILAN] compute fin', '🧮🛑=', DATA['🧮']['🧮🛑'], '🧮🔄☀️=', DATA['🧮']['🧮🔄☀️']);
    return true;
    } finally {
        if (apiDbg) console.groupEnd();
    }
}

// Exposer les fonctions globalement. Aucune n'est dans window.DATA (DATA = données). Pas de window.FUNC.
CONVERGE.initForConfig = initForConfig;
CONVERGE.cycleDeLeau = cycleDeLeau;
CONVERGE.computeRadiativeTransfer = computeRadiativeTransfer; // async (RAF yield indispensable), callback(event, payload) obligatoire

// ── OLR − SOLAIRE ABSORBÉ À T IMPOSÉE (v1.2.108) ────────────────────────────────────────────────────
// Ce qu'une surface à T_K perd net vers l'espace [W/m²], avec l'atmosphère et l'albédo COURANTS : mêmes
// fonctions que la convergence (préparation de la sonde ci-dessous). Sert à intégrer le refroidissement de
// l'océan de magma (INTERIEUR.avancer). L'état de DATA est rendu tel qu'il était.
async function olrNetA(T_K) {
    const DATA = window.DATA;
    const save = { T: DATA['🧮']['🧮🌡️'], Tp: DATA['🧮']['🧮🌡️⏮'], Tf: DATA['🧮']['🧮🌡️🚩'] };
    const pin = (T) => { DATA['🧮']['🧮🌡️'] = T; DATA['🧮']['🧮🌡️⏮'] = T; DATA['🧮']['🧮🌡️🚩'] = T; };
    const preparer = () => {
        window.ATM.calculateAtmosphereComposition();
        window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null;
        window.H2O.calculateH2OParameters();
        window.ALBEDO.calculateAlbedo();
    };
    try {
        pin(T_K); preparer(); pin(T_K);
        if (await window.calculateFluxForT0() !== true) throw new Error('[olrNetA] calculateFluxForT0 a échoué à ' + T_K + ' K');
        const OLR = window.RADIATIVE.getSpectralResultFromDATA().total_flux;
        const Sabs = DATA['☀️']['🧲☀️🎱'] * (1 - DATA['🪩']['🍰🪩📿']);
        return OLR - Sabs;
    } finally {
        pin(save.T); DATA['🧮']['🧮🌡️⏮'] = save.Tp; DATA['🧮']['🧮🌡️🚩'] = save.Tf;
        preparer();
    }
}
CONVERGE.olrNetA = olrNetA;

// ── SONDE DIAGNOSTIC : OLR(CO₂) à T FIGÉE (v-2026-07-16) ───────────────────────────────────────
// But : isoler la réponse RADIATIVE PURE de la boucle de convergence. Sur la branche froide, si l'OLR
// MONTE quand le CO₂ monte (à T fixe), c'est l'anti-serre (inversion) qui empêche le CO₂ de piloter la
// déglaciation 1b — le scan CO₂ ne peut alors jamais converger. Réutilise EXACTEMENT les fonctions de la
// convergence (fidélité totale). Usage : sur la page hystérésis, époque 1b chargée, dans la console :
//     await probeOLRvsCO2AtFixedT()                 // T = T courante, grille ×[0.1..30] du CO₂ baseline
//     await probeOLRvsCO2AtFixedT(-17)              // T figée à -17 °C
//     await probeOLRvsCO2AtFixedT(-17, [1e17,1e18,1e19])   // grille CO₂ explicite (kg)
async function probeOLRvsCO2AtFixedT(T_C, co2Grid) {
    const DATA = window.DATA;
    const K = window.CONST.KELVIN_TO_CELSIUS;
    const T_K = Number.isFinite(T_C) ? (T_C + K) : DATA['🧮']['🧮🌡️'];
    // Le CO₂ est piloté via la TIMELINE : getMasses() (appelé par calculateH2OParameters) réécrase DATA['⚖️']
    // depuis EPOCH['⚖️🏭'] à chaque pas. Écrire dans DATA ne survivrait pas ; on écrit donc dans la config.
    const EP = window.TIMELINE.find(it => it['📅'] === DATA['📜']['🗿']);
    const epCo2_0 = EP['⚖️🏭'];
    const grid = (Array.isArray(co2Grid) && co2Grid.length)
        ? co2Grid.slice()
        : [0.1, 0.3, 1, 3, 10, 30].map(fac => epCo2_0 * fac);
    const save = { T: DATA['🧮']['🧮🌡️'], Tp: DATA['🧮']['🧮🌡️⏮'], Tf: DATA['🧮']['🧮🌡️🚩'] };
    const pinT = () => { DATA['🧮']['🧮🌡️'] = T_K; DATA['🧮']['🧮🌡️⏮'] = T_K; DATA['🧮']['🧮🌡️🚩'] = T_K; };
    const f = (v, n) => Number.isFinite(v) ? v.toFixed(n) : '—';
    const rows = [];
    console.log('🔭[probe OLR(CO₂)@T] T FIGÉE=' + (T_K - K).toFixed(2) + '°C — ' + grid.length + ' pas CO₂ (réponse radiative pure, branche isolée)');
    try {
        for (let i = 0; i < grid.length; i++) {
            const co2 = grid[i];
            EP['⚖️🏭'] = co2;                                 // getMasses lira CETTE valeur
            window.COMPUTE.getMasses();
            window.ATM.calculateAtmosphereComposition();
            pinT();
            window.ATM.updateAtmosphereHeightFromCurrentT();
            pinT();
            window.H2O._lastH2OParamsCache = null;
            window.H2O.calculateH2OParameters();
            window.ALBEDO.calculateAlbedo();
            pinT();
            await window.calculateFluxForT0();
            const b = DATA['📊'].eds_breakdown;
            const OLR = DATA['📊'].total_flux;
            const EDS = b.EDS_Wm2;
            const co2W = EDS * b.CO2.pct;
            const h2oW = EDS * b.H2O.pct;
            const frac = DATA['🫧']['🍰🫧🏭'];
            const Sabs = DATA['☀️']['🧲☀️🎱'] * (1 - DATA['🪩']['🍰🪩📿']);
            rows.push({ co2, ppm: frac * 1e6, OLR, EDS, co2W, h2oW, Sabs });
            console.log('🔭  CO₂=' + co2.toExponential(2) + ' kg (' + f(frac * 1e6, 0) + ' ppm) | OLR=' + f(OLR, 2)
                + ' | EDS=' + f(EDS, 2) + ' [CO₂ ' + f(co2W, 1) + ' · H₂O ' + f(h2oW, 1) + ']'
                + ' | Sabs=' + f(Sabs, 1) + ' W/m²');
        }
        if (rows.length >= 2) {
            const dOLR = rows[rows.length - 1].OLR - rows[0].OLR;
            const verdict = dOLR > 0.5
                ? '⚠️ OLR MONTE avec le CO₂ (+' + dOLR.toFixed(1) + ' W/m²) → ANTI-SERRE confirmée : le CO₂ REFROIDIT à T fixe. C\'est ça qui bloque 1b.'
                : dOLR < -0.5
                    ? '✅ OLR BAISSE avec le CO₂ (' + dOLR.toFixed(1) + ' W/m²) → serre normale : le CO₂ réchauffe. L\'inversion vue au scan vient d\'ailleurs (convergence/albédo/vapeur).'
                    : '≈ OLR QUASI PLAT (' + dOLR.toFixed(1) + ' W/m²) → CO₂ = levier ~NUL sur cette branche (bandes saturées, fenêtre pas refermée).';
            console.log('🔭[verdict] ' + verdict);
        }
    } finally {
        // Restauration : rendre à la timeline son CO₂ baseline + re-prep pour laisser DATA cohérent
        EP['⚖️🏭'] = epCo2_0;
        window.COMPUTE.getMasses();
        DATA['🧮']['🧮🌡️'] = save.T; DATA['🧮']['🧮🌡️⏮'] = save.Tp; DATA['🧮']['🧮🌡️🚩'] = save.Tf;
        window.ATM.calculateAtmosphereComposition();
        window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null;
        window.H2O.calculateH2OParameters();
        window.ALBEDO.calculateAlbedo();
        console.log('🔭[probe] état restauré (CO₂ timeline=' + epCo2_0.toExponential(3) + ' kg, T=' + (save.T - K).toFixed(2) + '°C)');
    }
    return rows;
}
window.probeOLRvsCO2AtFixedT = probeOLRvsCO2AtFixedT;   // outil console

