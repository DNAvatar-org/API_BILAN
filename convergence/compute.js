// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.0.8
// Date: [January 2025]
// logs :
// - v1.0.2: getEpochDateConfig applies 🔺📐 generically from all 🕰 tic keys; getNoyau uses DATA['📜']['📐'] effective radius
// - v1.0.3: bary (📿💫+📿☄️)/maxTics; interpolation via 🕰['🔀'] and 🕰['◀']; getMasses/getSoleil/getNoyau use interpolated DATA when 🔀
// - v1.0.4: si date <= ◀(epoch) passer à l'époque suivante et remettre 📿💫/📿☄️ à 0 (ex. -50 Ma → Cénozoïque -66 Ma)
// - v1.0.5: debug log getEpochDateConfig (transition époque + état tics)
// - v1.0.6: transition époque : support direction forward (▶ < ◀, ex. 🚂 1800→2025) — dateYears additionne deltaTics, condition >=
// - v1.0.7: logs détaillés deltaYearsFromTics (tic par tic) + état TIMELINE[epochIndex+1] pour débug grande coupure 🦣→🏔
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
            '⚖️🏭': isFinite(EPOCH['⚖️🏭']) ? EPOCH['⚖️🏭'] : 0,
            '⚖️🐄': isFinite(EPOCH['⚖️🐄']) ? EPOCH['⚖️🐄'] : 0,
            '⚖️💧': EPOCH['⚖️💧'] || 0,
            '⚖️🫁': isFinite(EPOCH['⚖️🫁']) ? EPOCH['⚖️🫁'] : 0,
            '⚖️💨': isFinite(EPOCH['⚖️💨']) ? EPOCH['⚖️💨'] : 0,
            '⚖️✈': isFinite(EPOCH['⚖️✈']) ? EPOCH['⚖️✈'] : 0
        };
    }
    // ⚖️💧 += 📿☄️ * 🔺⚖️💧☄️ (météorites)
    let h2o_kg = (base['⚖️💧'] != null && isFinite(base['⚖️💧'])) ? base['⚖️💧'] : 0;
    h2o_kg += (DATA['📜']['🔺⚖️💧☄️'] || 0) * (DATA['📜']['📿☄️'] || 0);
    base['⚖️💧'] = h2o_kg;

    if (!useInterpolated) {
        if (EPOCH['⚖️🫧'] !== undefined && isFinite(EPOCH['⚖️🫧'])) {
            base['⚖️🫧'] = EPOCH['⚖️🫧'];
            if (!isFinite(EPOCH['⚖️💨']) || EPOCH['⚖️💨'] === undefined) {
                base['⚖️💨'] = Math.max(0, base['⚖️🫧'] - (base['⚖️🏭'] + base['⚖️🐄'] + base['⚖️🫁']));
            }
        } else {
            base['⚖️🫧'] = base['⚖️🏭'] + base['⚖️🐄'] + base['⚖️🫁'] + base['⚖️💨'];
        }
    }
    DATA['⚖️'] = base;
    
    // Logs désactivés pour réduire la taille
    // console.log(`📋 [getMasses@compute.js]`);
    // console.log(`masses=${JSON.stringify(DATA['⚖️'])}`);
    
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
            if (tk === '🔀' || tk === '◀') continue;
            const cfg = EPOCH['🕰'][tk];
            if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                const count = (DATA['📜']['📿' + tk] != null && Number.isFinite(DATA['📜']['📿' + tk])) ? DATA['📜']['📿' + tk] : 0;
                deltaYearsFromTics += count * cfg['🔺⏳'] * 1e6;
            }
        }
    }
    const epochEnd = (typeof EPOCH['◀'] === 'number' && Number.isFinite(EPOCH['◀'])) ? EPOCH['◀'] : null;
    // Detect time direction: geological = backward (▶ > ◀), modern = forward (▶ < ◀)
    const isForwardTime = (EPOCH['▶'] != null && epochEnd != null && EPOCH['▶'] < epochEnd);
    const dateYears = (EPOCH['▶'] != null)
        ? (isForwardTime ? (EPOCH['▶'] || 0) + deltaYearsFromTics : (EPOCH['▶'] || 0) - deltaYearsFromTics)
        : 0;
    const shouldTransition = (epochEnd != null && epochIndex + 1 < window.TIMELINE.length)
        && (isForwardTime ? dateYears >= epochEnd : dateYears <= epochEnd);
    if (shouldTransition) {
        const nextEpoch = window.TIMELINE[epochIndex + 1];
        DATA['📜']['🗿'] = nextEpoch['📅'];
        DATA['📜']['👉'] = epochIndex + 1;
        DATA['📜']['📿💫'] = 0;
        DATA['📜']['📿☄️'] = 0;
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
    DATA['📜']['🧲🔬'] = (typeof EPOCH['🧲🔬'] === 'number' && Number.isFinite(EPOCH['🧲🔬'])) ? EPOCH['🧲🔬'] : 0.01;
    DATA['📜']['👉'] = epochIndex;
    DATA['📜']['🗿'] = epochId;

    // Rayon effectif : base EPOCH['📐'] + somme des deltas 🔺📐 par tic (générique ; ignorer 🕰['🔀'] et 🕰['◀'])
    const baseRadiusKm = (typeof EPOCH['📐'] === 'number' && Number.isFinite(EPOCH['📐'])) ? EPOCH['📐'] : 6371;
    let deltaRadiusKm = 0;
    if (EPOCH['🕰'] && typeof EPOCH['🕰'] === 'object') {
        for (const ticKey of Object.keys(EPOCH['🕰'])) {
            if (ticKey === '🔀' || ticKey === '◀') continue;
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
            if (tk === '🔀' || tk === '◀') continue;
            const cfg = EPOCH['🕰'][tk];
            if (cfg && typeof cfg['🔺⏳'] === 'number' && Number.isFinite(cfg['🔺⏳'])) {
                refDeltaMa = cfg['🔺⏳'];
                break;
            }
        }
        const spanYears = Math.max(0, (EPOCH['▶'] || 0) - (EPOCH['◀'] || 0));
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

    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();
    
    // Logs désactivés pour réduire la taille
    // console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    // console.log(`dateConfig=${JSON.stringify(DATA['📜'])}`);
    
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
        const spanYears = Math.max(0, (EPOCH['▶'] || 0) - (EPOCH['◀'] || 0));
        const maxTics = durationMa > 0 && spanYears > 0 ? Math.max(1, Math.floor((spanYears / 1e6) / durationMa)) : 1;
        const f = Math.min(1, tic / maxTics);
        DATA['🌕']['🧲🌕'] = (geo['▶'] != null && geo['◀'] != null) ? geo['▶'] + f * (geo['◀'] - geo['▶']) : (geo['▶'] != null ? geo['▶'] : EPOCH['🧲🌕']);
    } else if (EPOCH['🧲🌕'] !== undefined) {
        // Flux directement dans l'époque (ex: Hadéen)
        DATA['🌕']['🧲🌕'] = EPOCH['🧲🌕'];
    } else {
        // Calculer depuis la puissance du noyau si disponible (rayon effectif depuis DATA['📜']['📐'] si défini)
        if (EPOCH['🔋🌕'] !== undefined) {
            const radiusKm = (DATA['📜']['📐'] != null && Number.isFinite(DATA['📜']['📐'])) ? DATA['📜']['📐'] : EPOCH['📐'];
            const planet_radius_m = (typeof radiusKm === 'number' && Number.isFinite(radiusKm)) ? radiusKm * 1000 : (EPOCH['📐'] || 6371) * 1000;
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
COMPUTE.goughLuminosity = goughLuminosity;
COMPUTE.getNoyau = getNoyau;
window.getEpochDateConfig = getEpochDateConfig;
window.getDateConfig = getEpochDateConfig;
window.getMasses = getMasses;
window.getEnabledStates = getEnabledStates;
window.getSoleil = getSoleil;
window.goughLuminosity = goughLuminosity;
window.getNoyau = getNoyau;
// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de window.T0
// getLogo et getLogoKey sont exposés par alphabet.js

