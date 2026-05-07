// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.0.18
// Date: [May 07, 2026]
// logs :
// - v1.0.18: voile cross-époque — fix leak 📜🔺🍰⚽ : si la nouvelle époque n'a pas la clé 🔺🍰⚽,
//   on reset 📜🔺🍰⚽=0 (pas seulement _veilTimelinePulseActive). Bug bench : ⛄ (snowball) posait 0.02
//   et toutes les époques suivantes héritaient → albédo +1.45 % → 📱 convergeait à 12.4 °C au lieu de 15
//   en bench (vs visu OK car parcours single-epoch). Cf. _logs/iceSnapshot.txt POST_CALC veil=0.02 leak.
// - v1.0.17: getMasses/getEpochDateConfig — ignorer la clé 🕰.order (liste d’actions UI) lors des itérations sur les tics.
// - v1.0.16: voile — impulsion seulement EPOCH['🔺🍰⚽'] (racine) à 📿💫===0 ; remise 📜🔺🍰⚽ au clic 💫 via 🕰.💫.🍰⚽ dans events.js.
// - v1.0.15: impulsion voile — lire EPOCH['🔺🍰⚽'] (racine TIMELINE, même niveau que 📅), plus 🕰.💫.🔺🍰⚽.
// - v1.0.14: getEpochDateConfig — impulsion voile TIMELINE : si 🕰.💫 définit la clé 🔺🍰⚽ (fraction 0–1),
//   pose 📜🔺🍰⚽ à l’entrée (📿💫=0, une fois par « salve » tic 0) puis retire ce montant au premier tic (📿💫≥1) ;
//   état interne 📜._veilTimelinePulseActive ; reset sur transition auto d’époque.
// - v1.0.13: getEpochDateConfig — log 🏭📊 (console) retiré ; window._co2ProfileLog reste pour inspection manuelle
//   (évite I/O console à chaque pas temps quand le profil est actif).
// - v1.0.12: getEpochDateConfig — après bary, si 🕰['◀'] remplace un groupe par un out partiel, DATA['📅'] peut
//   n’inclure que les clés interpolées ; reprise explicite de 🍎 et 📐 depuis EPOCH (TIMELINE) pour pression/échelle.
//   Évite ℎ NaN, P0 NaN, n_air NaN, OLR NaN. Si demain '🔀' contient '⚖️' sans masses complètes, même logique côté getMasses.
// - v1.0.11: getMasses/getEpochDateConfig/getNoyau — retrait fallbacks contractuels restants
//   (⚖️🫧/⚖️💨, 🧲🔬, 📐, ▶/◀, airborne, géothermie moderne silencieuse).
// - v1.0.10: getMasses crash-first — retrait des fallbacks isFinite(...)?...:0 sur masses EPOCH obligatoires (dont ⚖️✈).
// - v1.0.9: expositions fonctions regroupées sous window.COMPUTE (doublons window.foo retirés). Appelants migrés window.foo() → COMPUTE.foo() dans api.js, scie_hysteresis_search.js, sync_panels.js, ui/main.js, events.js, CO2/html/*.html.
// - v1.0.2: getEpochDateConfig applies 🔺📐 generically from all 🕰 tic keys; getNoyau uses DATA['📜']['📐'] effective radius
// - v1.0.3: bary (📿💫+📿☄️)/maxTics; interpolation via 🕰['🔀'] and 🕰['◀']; getMasses/getSoleil/getNoyau use interpolated DATA when 🔀
// - v1.0.4: si date <= ◀(epoch) passer à l'époque suivante et remettre 📿💫/📿☄️ à 0 (ex. -50 Ma → Cénozoïque -66 Ma)
// - v1.0.5: debug log getEpochDateConfig (transition époque + état tics)
// - v1.0.6: transition époque : support direction forward (▶ < ◀, ex. 🚂 1800→2025) — dateYears additionne deltaTics, condition >=
// - v1.0.7: logs détaillés deltaYearsFromTics (tic par tic) + état TIMELINE[epochIndex+1] pour débug grande coupure 🦣→🏔
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
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
    // API_BILAN ne pilote plus d'états toggle.
    // Les modules CO2/CH4/H2O/ALBEDO sont toujours actifs.
    return true;
}

//Calcule les masses en tenant compte des événements (meteor, etc.) :: utilise DATA directement
function getMasses() {
    const DATA = window.DATA;
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = epochIndex >= 0 ? window.TIMELINE[epochIndex] : null;
    if (!EPOCH) return false;
    const useInterpolated = EPOCH['🕰'] && Array.isArray(EPOCH['🕰']['🔀']) && EPOCH['🕰']['🔀'].includes('⚖️') && DATA['⚖️'] && typeof DATA['⚖️'] === 'object';

    let base;
    if (useInterpolated) {
        base = DATA['⚖️'];
    } else {
        base = {
            '⚖️🏭': EPOCH['⚖️🏭'],
            '⚖️🐄': EPOCH['⚖️🐄'],
            '⚖️💧': EPOCH['⚖️💧'],
            '⚖️🫁': EPOCH['⚖️🫁'],
            '⚖️💨': EPOCH['⚖️💨'],
            '⚖️✈': EPOCH['⚖️✈']
        };
    }
    // ⚖️💧 += 📿☄️ * 🔺⚖️💧☄️ (météorites)
    let h2o_kg = base['⚖️💧'];
    h2o_kg += DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'];
    base['⚖️💧'] = h2o_kg;

    // 🏭📊 Fraction aéroportée — appliquée ICI (source unique) pour survivre aux rappels getMasses() dans la boucle de convergence
    const epochEnd = EPOCH['◀'];
    const isForwardMasses = EPOCH['▶'] < epochEnd;
    if (!useInterpolated && isForwardMasses && EPOCH['🏭📊'] && Array.isArray(EPOCH['🏭📊'].tranches)) {
        let deltaMassesTics = 0;
        if (EPOCH['🕰'] && typeof EPOCH['🕰'] === 'object') {
            for (const tk of Object.keys(EPOCH['🕰'])) {
                if (tk === '🔀' || tk === '◀' || tk === 'order') continue;
                const cfg = EPOCH['🕰'][tk];
                if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                    const cnt = (DATA['📜']['📿' + tk] != null && Number.isFinite(DATA['📜']['📿' + tk])) ? DATA['📜']['📿' + tk] : 0;
                    deltaMassesTics += cnt * cfg['🔺⏳'] * 1e6;
                }
            }
        }
        const currentYearM = EPOCH['▶'] + deltaMassesTics;
        const profile = EPOCH['🏭📊'];
        let cumulGtM = 0;
        for (let i = 0; i < profile.tranches.length; i++) {
            const tr = profile.tranches[i];
            if (currentYearM <= tr.from) break;
            const span = tr.to - tr.from;
            const rate = span > 0 ? tr.Gt / span : 0;
            cumulGtM += rate * (Math.min(currentYearM, tr.to) - tr.from);
        }
        const airborneM = profile.airborne;
        base['⚖️🏭'] += cumulGtM * 1e12 * airborneM;
    }

    if (!useInterpolated) {
        base['⚖️🫧'] = EPOCH['⚖️🫧'];
    }
    DATA['⚖️'] = base;

    // Retourner true car DATA a été modifié
    return true;
}

//Récupère la configuration de l'époque (utilise DATA directement)
function getEpochDateConfig() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    let epochId = DATA['📜']['🗿'];
    let epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    let EPOCH = window.TIMELINE[epochIndex];
    if (!EPOCH) return false;

    // Si date >= ◀(epoch) (en années : date courante <= ◀) → passer à l'époque suivante et remettre tics à 0
    // dateYears = ▶ - sum( (📿[ticKey] * 🔺⏳[ticKey]) ) * 1e6 pour éviter mélange de pas (ex. ☄️ 100 Ma + 💫 100 Ma)
    let deltaYearsFromTics = 0;
    if (EPOCH['🕰'] && typeof EPOCH['🕰'] === 'object' && EPOCH['▶'] != null) {
        for (const tk of Object.keys(EPOCH['🕰'])) {
            if (tk === '🔀' || tk === '◀' || tk === 'order') continue;
            const cfg = EPOCH['🕰'][tk];
            if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                const count = (DATA['📜']['📿' + tk] != null && Number.isFinite(DATA['📜']['📿' + tk])) ? DATA['📜']['📿' + tk] : 0;
                deltaYearsFromTics += count * cfg['🔺⏳'] * 1e6;
            }
        }
    }
    const epochEnd = EPOCH['◀'];
    // Detect time direction: geological = backward (▶ > ◀), modern = forward (▶ < ◀)
    const isForwardTime = EPOCH['▶'] < epochEnd;
    const dateYears = isForwardTime ? EPOCH['▶'] + deltaYearsFromTics : EPOCH['▶'] - deltaYearsFromTics;
    const shouldTransition = (epochIndex + 1 < window.TIMELINE.length)
        && (isForwardTime ? dateYears >= epochEnd : dateYears <= epochEnd);
    if (shouldTransition) {
        const nextEpoch = window.TIMELINE[epochIndex + 1];
        DATA['📜']['🗿'] = nextEpoch['📅'];
        DATA['📜']['👉'] = epochIndex + 1;
        DATA['📜']['📿💫'] = 0;
        DATA['📜']['📿☄️'] = 0;
        DATA['📜']['_veilTimelinePulseActive'] = false;
        epochId = nextEpoch['📅'];
        epochIndex = epochIndex + 1;
        EPOCH = nextEpoch;
    }

    // Masse d'eau par météorite — depuis config ☄️ (Corps noir, Hadéen)
    // ⚠️ Ne pas écraser 📿☄️ ni 📿💫 — compteurs exclusifs des boutons (events.js)
    if (EPOCH['🕰'] && EPOCH['🕰']['☄️']) {
        DATA['📜']['🔺⚖️💧☄️'] = EPOCH['🕰']['☄️']['🔺⚖️💧☄️'];
    }

    // Delta température et flux géothermique par TicTime — depuis config 💫
    let deltaTicTime_per_tic = 0;
    if (EPOCH['🕰'] && EPOCH['🕰']['💫']) {
        const raw = EPOCH['🕰']['💫']['🔺🌡️💫'];
        deltaTicTime_per_tic = (typeof raw === 'number' && Number.isFinite(raw)) ? raw : 0;
        const star = EPOCH['🕰']['💫']['🔺🧲🌕💫'];
        DATA['📜']['🔺🧲🌕💫'] = star ? { '▶': star['▶'], '◀': star['◀'] } : { '▶': 0, '◀': 0 };
    } else {
        DATA['📜']['🔺🧲🌕💫'] = { '▶': 0, '◀': 0 };
    }

    // Mettre à jour DATA directement (source unique de vérité)
    DATA['📜']['🌡️🧮'] = EPOCH['🌡️🧮'];
    DATA['📅']['🌡️🧮'] = EPOCH['🌡️🧮'];                  // Température attendue de l'époque
    DATA['📜']['🔺🌡️💫'] = deltaTicTime_per_tic;          // Delta température / ticTime (jamais undefined → calculateT0 sans NaN)
    DATA['📜']['🧲🔬'] = EPOCH['🧲🔬'];
    DATA['📜']['👉'] = epochIndex;
    DATA['📜']['🗿'] = epochId;

    // Impulsion voile (racine TIMELINE) : EPOCH['🔺🍰⚽'] → 📜🔺🍰⚽ une fois à 📿💫===0 ; remise au clic 💫 : 🕰.💫.🍰⚽ (events.js).
    // v1.0.17 — bug fix bench : si la nouvelle époque N'A PAS de clé 🔺🍰⚽, on reset la VALEUR cumulative
    // 📜🔺🍰⚽ à 0 (et pas seulement le flag _veilTimelinePulseActive). Sinon le pulse 0.02 posé par ⛄
    // (hyst snowball) persistait sur toutes les époques suivantes en bench séquentiel → albédo +1.45 %
    // → calibration cassée vs visu (single click = pas de pulse hérité). Cf. _logs/iceSnapshot.txt
    // POST_CALC ep=📱 phase=Init : alb 0.3019 (bench) vs 0.288 (visu).
    if (Object.prototype.hasOwnProperty.call(EPOCH, '🔺🍰⚽')) {
        const pulseVal = Number(EPOCH['🔺🍰⚽']);
        const ticN = DATA['📜']['📿💫'];
        const pulseActive = DATA['📜']['_veilTimelinePulseActive'] === true;
        if (ticN === 0 && !pulseActive) {
            DATA['📜']['🔺🍰⚽'] = pulseVal;
            DATA['📜']['_veilTimelinePulseActive'] = true;
        }
    } else {
        DATA['📜']['_veilTimelinePulseActive'] = false;
        DATA['📜']['🔺🍰⚽'] = 0; // pas de pulse sur cette époque → on efface le résiduel cross-époque.
    }

    // Rayon effectif : base EPOCH['📐'] + somme des deltas 🔺📐 par tic (générique ; ignorer 🕰['🔀'] et 🕰['◀'])
    const baseRadiusKm = EPOCH['📐'];
    let deltaRadiusKm = 0;
    if (EPOCH['🕰'] && typeof EPOCH['🕰'] === 'object') {
        for (const ticKey of Object.keys(EPOCH['🕰'])) {
            if (ticKey === '🔀' || ticKey === '◀' || ticKey === 'order') continue;
            const ticCfg = EPOCH['🕰'][ticKey];
            if (ticCfg && typeof ticCfg['🔺📐'] === 'number' && Number.isFinite(ticCfg['🔺📐'])) {
                const count = (DATA['📜']['📿' + ticKey] != null && Number.isFinite(DATA['📜']['📿' + ticKey])) ? DATA['📜']['📿' + ticKey] : 0;
                deltaRadiusKm += count * ticCfg['🔺📐'];
            }
        }
    }
    DATA['📜']['📐'] = baseRadiusKm + deltaRadiusKm;

    // 🔒 Date courante en années avant le présent (pour Gough dans getSoleil)
    // Stocké dans 📜 (pas 📅 — sync_panels.js écrase DATA['📅'] avec TIMELINE[idx])
    DATA['📜']['📅'] = dateYears;

    // Barycentre (📿💫+📿☄️)/maxTics : interpolation des params listés dans 🕰['🔀'] entre epoch (▶) et 🕰['◀']
    const interpolKeys = EPOCH['🕰'] && Array.isArray(EPOCH['🕰']['🔀']) ? EPOCH['🕰']['🔀'] : null;
    const interpolEnd = EPOCH['🕰'] && EPOCH['🕰']['◀'] && typeof EPOCH['🕰']['◀'] === 'object' ? EPOCH['🕰']['◀'] : null;
    if (interpolKeys && interpolEnd) {
        let refDeltaMa = 0;
        for (const tk of Object.keys(EPOCH['🕰'])) {
            if (tk === '🔀' || tk === '◀' || tk === 'order') continue;
            const cfg = EPOCH['🕰'][tk];
            if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                refDeltaMa = cfg['🔺⏳'];
                break;
            }
        }
        const spanYears = Math.max(0, EPOCH['▶'] - EPOCH['◀']);
        const maxTics = refDeltaMa > 0 && spanYears > 0 ? Math.max(1, Math.floor((spanYears / 1e6) / refDeltaMa)) : 1;
        const totalTicsBary = ((DATA['📜']['📿💫'] != null && Number.isFinite(DATA['📜']['📿💫'])) ? DATA['📜']['📿💫'] : 0) + ((DATA['📜']['📿☄️'] != null && Number.isFinite(DATA['📜']['📿☄️'])) ? DATA['📜']['📿☄️'] : 0);
        const bary = Math.max(0, Math.min(1, totalTicsBary / maxTics));
        DATA['📜']['bary'] = bary;
        for (let i = 0; i < interpolKeys.length; i++) {
            const groupKey = interpolKeys[i];
            const endObj = interpolEnd[groupKey];
            if (!endObj || typeof endObj !== 'object') continue;
            const out = {};
            for (const subkey of Object.keys(endObj)) {
                const startVal = EPOCH[subkey];
                const endVal = endObj[subkey];
                if (typeof endVal === 'number' && Number.isFinite(endVal)) {
                    // _REGLE_JS_CRASH : Aucun fallback ou typeof abusif.
                    // Si startVal est undefined, le calcul donne NaN et l'application plantera naturellement (ce qui est voulu).
                    out[subkey] = startVal + bary * (endVal - startVal);
                } else {
                    out[subkey] = endVal;
                }
            }
            DATA[groupKey] = out;
        }
    }

    // Objet partiel (ex. futures interpolations) : 🍎, 📐 physiques invariants s’il manquent / non fini sur DATA['📅'].
    if (DATA['📅'] && EPOCH) {
        for (const k of ['🍎', '📐']) {
            if (EPOCH[k] != null && (typeof EPOCH[k] === 'number') && Number.isFinite(EPOCH[k])) {
                if (DATA['📅'][k] == null || (typeof DATA['📅'][k] === 'number' && !Number.isFinite(DATA['📅'][k]))) {
                    DATA['📅'][k] = EPOCH[k];
                }
            }
        }
    }

    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();

    // 🏭📊 : le calcul est maintenant dans getMasses() (source unique, survit aux rappels de la boucle de convergence)
    // Ici on génère seulement le log si l'époque a un profil d'émissions
    if (isForwardTime && EPOCH['🏭📊'] && Array.isArray(EPOCH['🏭📊'].tranches)) {
        const ppm_approx = Math.round(
            (DATA['⚖️']['⚖️🏭'] * 0.029 / (DATA['⚖️']['⚖️🫧'] * 0.04401)) * 1e6
        );
        window._co2ProfileLog = '[🏭📊] ' + Math.round(EPOCH['▶'] + deltaYearsFromTics)
            + ' → ⚖️🏭=' + DATA['⚖️']['⚖️🏭'].toExponential(3)
            + ' kg (~' + ppm_approx + ' ppm)';
        window._co2ProfileLogInjected = false;
    }

    // Retourner true car DATA a été modifié
    return true;
}

// 🔒 FORMULE DE GOUGH (1981), Solar Physics 74:21
// L(t_ago) = L_SUN / (1 + 0.4 × t_ago_Ga / T_SUN_GA)
// Confirmé par Bahcall, Pinsonneault & Basu (2001), ApJ 555:990.
// NE PAS REMPLACER PAR UNE INTERPOLATION LINÉAIRE — la relation est hyperbolique.
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
    // Date courante en années avant le présent (stockée par getEpochDateConfig dans 📜, pas 📅)
    const dateYears = DATA['📜']['📅'];
    if (dateYears == null || !Number.isFinite(dateYears)) throw new Error('getSoleil: DATA[📜][📅] invalide (' + dateYears + ') — getEpochDateConfig() doit stocker la date en années');
    // 🔒 Luminosité exacte via Gough — pas d'interpolation linéaire
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
    const useInterpolated = EPOCH['🕰'] && Array.isArray(EPOCH['🕰']['🔀']) && EPOCH['🕰']['🔀'].includes('🌕') && DATA['🌕'] && (DATA['🌕']['🧲🌕'] != null || DATA['🌕']['🔋🌕'] != null);
    if (useInterpolated) {
        // Garder DATA['🌕'] déjà rempli par getEpochDateConfig (interpolation bary)
        return true;
    }
    // Flux géothermique en W/m² (depuis TIMELINE)
    if (EPOCH['🕰'] && EPOCH['🕰']['💫'] && EPOCH['🕰']['💫']['🔺🧲🌕💫']) {
        const geo = EPOCH['🕰']['💫']['🔺🧲🌕💫'];
        const tic = DATA['📜']['📿💫'];
        const durationMa = EPOCH['🕰']['💫']['🔺⏳'];
        const spanYears = Math.max(0, EPOCH['▶'] - EPOCH['◀']);
        const maxTics = durationMa > 0 && spanYears > 0 ? Math.max(1, Math.floor((spanYears / 1e6) / durationMa)) : 1;
        const f = Math.min(1, tic / maxTics);
        DATA['🌕']['🧲🌕'] = (geo['▶'] != null && geo['◀'] != null) ? geo['▶'] + f * (geo['◀'] - geo['▶']) : (geo['▶'] != null ? geo['▶'] : EPOCH['🧲🌕']);
    } else if (EPOCH['🧲🌕'] !== undefined) {
        // Flux directement dans l'époque (ex: Hadéen)
        DATA['🌕']['🧲🌕'] = EPOCH['🧲🌕'];
    } else {
        // Calculer depuis la puissance du noyau si disponible (rayon effectif depuis DATA['📜']['📐'] si défini)
        const planet_radius_m = DATA['📜']['📐'] * 1000;
        const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
        DATA['🌕']['🧲🌕'] = EPOCH['🔋🌕'] / surface_area;
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
COMPUTE.goughLuminosity = goughLuminosity;
COMPUTE.getNoyau = getNoyau;
// Expositions : tout passe par window.COMPUTE (doublons window.foo retirés).
// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de window.T0
// getLogo et getLogoKey sont exposés par alphabet.js

