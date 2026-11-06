// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.5.2
// Date: [October 31, 2026]
// logs :
// - v1.5.2: 📜🧫, la biosphère marine du clic : celle de l'époque, ou de son état 🔁 daté.
// - v1.5.1: commentaires : le voile SW en rampe le long d'une époque n'a pas d'exemple dans la config.
// - v1.5.0: 📜⚾ = l'obliquité utilisée (l'orbite, sinon celle que l'époque déclare) ; graine du clic dans 📜🌡️🧮 ; Soleil de Gough
//   à l'ÂGE courant, L☉ = CONST.L_SOLEIL_W ; l'époque est DATA['📅'] (accesseur).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

/** 📱 : 🕰 indexé par année (clés numériques '2000', '2025'…), chaque tranche porte ses actions (🌈 ⛽ 🛢 🪾, CLICS.trancheActive). */
function yearBucketKeys(W) {
    return Object.keys(W).filter(k => !isNaN(Number(k)));
}

/** Masse atmosphère « air sec » (kg) = somme des réservoirs gazeux ; ⚖️💧 = hydrosphère (exclu). */
function dryAtmosphereMassKgFromComponents(o) {
    return o['⚖️🏭'] + o['⚖️🐄'] + o['⚖️💨'] + o['⚖️🫁'] + o['⚖️✈'];
}

function syncDryAtmosphereMassKg(state) {
    state['⚖️🫧'] = dryAtmosphereMassKgFromComponents(state);
}

/** Masses de l'état courant : racine de l'époque, puis interpolation 🔀, eau des météorites, état 🔁, cumul 📱. */
function getMasses() {
    const DATA = window.DATA;
    const H = DATA['📜'];
    const EPOCH = DATA['📅'];
    const base = {
        '⚖️🏭': EPOCH['⚖️🏭'],
        '⚖️🐄': EPOCH['⚖️🐄'],
        '⚖️💧': EPOCH['⚖️💧'],
        '⚖️🫁': EPOCH['⚖️🫁'],
        '⚖️💨': EPOCH['⚖️💨'],
        '⚖️✈': EPOCH['⚖️✈']
    };
    // 🔀 '⚖️' : masses interpolées le long de l'époque (posées par getEpochDateConfig).
    Object.assign(base, H['🔀⚖️']);
    // ⚖️💧 += 📜🔺⚖️💧 : eau cumulée des météorites de l'époque (CLICS.jouer, une masse par entrée de 🕰.order)
    base['⚖️💧'] += H['🔺⚖️💧'];
    // 🔁 état de cycle courant (posé par getEpochDateConfig) : masses imposées pour ce tic.
    Object.assign(base, H['🔁⚖️']);
    // 📱 🕰 indexé par année : CO₂ = racine + cumul injecté par les clics ⛽/🛢 − absorbé océan − stocké forêts
    // (CO2.advanceCarbonSinks). Cumul, pas un delta consommé : getMasses est rappelé à chaque pas de convergence.
    if (yearBucketKeys(EPOCH['🕰']).length) {
        base['⚖️🏭'] += H['🔺⚖️🏭'] - H['🔺⚖️🌊🏭'] - H['🔺⚖️🌳🏭'];
    }
    syncDryAtmosphereMassKg(base);
    DATA['⚖️'] = base;
    return true;
}

/** Date courante, graine, voile, rayon, obliquité, états 🔁, images, interpolation 🔀, puis masses. L'époque est celle posée par
 *  CLICS (frise / passer) : getEpochDateConfig n'en change jamais — le passage est décidé par le clic. */
// Réf : Laskar et al. 2004, A&A 428:261 — doc/equation.html#eq-orbite-date
function getEpochDateConfig() {
    const DATA = window.DATA;
    const H = DATA['📜'];
    const EPOCH = DATA['📅'];   // TIMELINE[📜👉] (accesseur de data/initDATA.js)
    const W = EPOCH['🕰'];

    // Temps écoulé dans l'époque : 📜⏳ (Ma), seule horloge, tenue par CLICS.jouer (somme des 🔺⏳ joués).
    const deltaYearsFromTics = H['⏳'] * 1e6;

    // Delta de température par tictime (graine sans anim : calculateT0).
    H['🔺🌡️💫'] = ('💫' in W) ? W['💫']['🔺🌡️💫'] : 0;
    // Graine du clic (calculateT0) : la courbe cyan à ▶ (accesseur de l'époque) ; 🔀 '📜' plus bas l'interpole le long de
    // l'époque quand son ◀ en porte une (🏔, 🦣).
    H['🌡️🧮'] = EPOCH['🌡️🧮'];
    H['🧲🔬'] = EPOCH['🧲🔬'];
    // Biosphère marine du clic (gate CLAW du sulfate efficace, calculations_albedo.js) : celle de l'époque ; un état 🔁 qui en
    // porte une la remplace plus bas (🦕 à 151,9 Ma).
    H['🧫'] = EPOCH['🧫'];

    // Voile SW 📜🔺🍰⚽. Trois sources possibles, par config :
    //  - 🔀 contient '📜' et ◀['📜'] porte 🔺🍰⚽ : rampe le long de l'époque — l'interpolation plus bas la pose (aucune époque
    //    de la config n'en déclare) ;
    //  - racine EPOCH['🔺🍰⚽'] : impulsion posée une fois à l'entrée (📿💫 = 0), retirée au tic (CLICS.jouer) ;
    //  - action 🗻 / 🌋 qui déclare 🔺🍰⚽ : le clic la pose (CLICS.jouer), le compute n'y touche pas.
    // Sinon : le voile hérité d'une époque précédente est effacé.
    const interpolKeys = ('🔀' in W) ? W['🔀'] : [];
    const veilAction = ['🗻', '🌋'].some(k => (k in W) && ('🔺🍰⚽' in W[k]));
    if (interpolKeys.includes('📜') && ('🔺🍰⚽' in W['◀']['📜'])) {
        H['_veilTimelinePulseActive'] = false;
    } else if ('🔺🍰⚽' in EPOCH) {
        if (H['📿💫'] === 0 && H['_veilTimelinePulseActive'] !== true) {
            H['🔺🍰⚽'] = EPOCH['🔺🍰⚽'];
            H['_veilTimelinePulseActive'] = true;
        }
    } else if (!veilAction) {
        H['_veilTimelinePulseActive'] = false;
        H['🔺🍰⚽'] = 0;
    }

    // Rayon : f(T de l'intérieur) — geology/interieur.js, la seule source (avancer le remet à jour).
    H['📐'] = window.INTERIEUR.rayonKm();

    // ⚾ : l'obliquité qu'utilise le calcul (bilan méridien, glace saisonnière, boîtes saisonnières, calottes) — celle de l'orbite à
    // la date courante (physics/orbite.js, La2004) ; hors de la solution (avant −51 Ma), celle que DÉCLARE l'époque (EPOCH['⚾']).
    const age = window.INTERIEUR.ageCourant();
    if (window.ORBITE.valide(age)) {
        H['⚾'] = window.ORBITE.obliquiteDeg(age);
    } else {
        if (!(EPOCH['⚾'] >= 0 && EPOCH['⚾'] <= 180)) throw new Error('[getEpochDateConfig] ' + EPOCH['📅'] + ' : date hors de la solution La2004 (−51 Ma) et EPOCH[\'⚾\'] = ' + EPOCH['⚾'] + ' (obliquité de l\'époque à déclarer, en degrés)');
        H['⚾'] = EPOCH['⚾'];
    }
    // 🔁 ÉTATS PAR TIC (🍄, 🦕, 🦣) : index = 📿💫 − 1 (tic 0 = racine) ; au-delà de la liste, le dernier état est
    // maintenu. Un état porte des masses '⚖️*' (→ 📜🔁⚖️, getMasses), '📝' et '🧫' (→ 📜🧫) ; jamais d'obliquité : elle vient de
    // l'orbite.
    H['🔁⚖️'] = {};
    H['🔁📝'] = '';
    H['🖼'] = '';
    H['🌙'] = '';
    if (('🔁' in W) && H['📿💫'] >= 1) {
        const state = W['🔁'][Math.min(H['📿💫'] - 1, W['🔁'].length - 1)];
        for (const k of Object.keys(state)) {
            if (k.indexOf('⚖️') === 0) H['🔁⚖️'][k] = state[k];
        }
        if ('⚾' in state) throw new Error('[getEpochDateConfig] 🔁 de ' + EPOCH['📅'] + ' pose ⚾ : l\'obliquité vient de l\'orbite (physics/orbite.js)');
        if ('📝' in state) H['🔁📝'] = state['📝'];
        if ('🧫' in state) H['🧫'] = state['🧫'];
    }
    // 🖼 suite d'images imposée par l'époque : index = 📿💫 modulo longueur (sinon texture déduite de la date).
    if ('🖼' in W) H['🖼'] = W['🖼'][H['📿💫'] % W['🖼'].length];
    // 🌙 carte de nuit superposée (toute l'époque) : lumières des villes côté ombre.
    if ('🌙' in W) H['🌙'] = W['🌙'];

    // 🔀 INTERPOLATION entre la racine (▶) et 🕰['◀'] des groupes listés : '⚖️' (masses → 📜🔀⚖️), '📜' (graine 🌡️🧮, voile
    // 🔺🍰⚽ → 📜). Sans ◀, la cible est la racine de l'époque suivante (masses seulement).
    H['🔀⚖️'] = {};
    if (interpolKeys.length) {
        if (interpolKeys.includes('🌕')) throw new Error('[getEpochDateConfig] 🔀 contient 🌕 (époque ' + EPOCH['📅'] + ') : le flux intérieur ne s\'interpole plus, il sort du bilan d\'énergie (geology/interieur.js)');
        let interpolEnd = W['◀'];
        if (interpolEnd === undefined) {
            const nextEp = window.TIMELINE[H['👉'] + 1];
            const endMasses = {};
            for (const k of Object.keys(nextEp)) {
                if (k.indexOf('⚖️') === 0 && (k in EPOCH)) endMasses[k] = nextEp[k];
            }
            interpolEnd = { '⚖️': endMasses };
        }
        // bary ∈ [0,1] = temps écoulé / durée de l'époque, depuis 📜⏳ (la seule horloge). Avant 2026-10-14, hors 🏔, un
        // compte de tics / floor(durée / 1er pas) : 🪸 (3 × 600 Ma pour 1 780) atteignait les masses de ☃ au 2ᵉ clic, 580 Ma
        // trop tôt, sous un Soleil plus faible ; 🦣 et 1b de même.
        const bary = Math.min(1, deltaYearsFromTics / Math.abs(EPOCH['▶'] - EPOCH['◀']));
        H['bary'] = bary;
        for (const groupKey of interpolKeys) {
            const endObj = interpolEnd[groupKey];
            const out = {};
            for (const subkey of Object.keys(endObj)) {
                out[subkey] = EPOCH[subkey] + bary * (endObj[subkey] - EPOCH[subkey]);
            }
            if (groupKey === '⚖️') H['🔀⚖️'] = out;
            else if (groupKey === '📜') Object.assign(H, out);
            else throw new Error('[getEpochDateConfig] 🔀 : groupe inconnu ' + groupKey + ' (époque ' + EPOCH['📅'] + ')');
        }
    }

    getMasses();
    return true;
}

// 🔒 FORMULE DE GOUGH (1981), Solar Physics 74:21
// L(t_ago) = L☉ / (1 + 0.4 × t_ago_Ga / T_SUN_GA), L☉ = CONST.L_SOLEIL_W (Soleil actuel, IAU 2015) ; t_ago = ÂGE (années avant
// le présent), jamais une date du calendrier.
// Confirmé par Bahcall, Pinsonneault & Basu (2001), ApJ 555:990.
// NE PAS REMPLACER PAR UNE INTERPOLATION LINÉAIRE — la relation est hyperbolique.
var GOUGH_T_SUN_GA = 4.57;     // Âge du Soleil en Ga
var GOUGH_COEFF = 0.4;         // Coefficient d'évolution (homologie stellaire H→He)

function goughLuminosity(t_ago_years) {
    var t_ago_Ga = t_ago_years / 1e9;
    return CONST.L_SOLEIL_W / (1 + GOUGH_COEFF * t_ago_Ga / GOUGH_T_SUN_GA);
}

//Calcule les valeurs du soleil à l'âge courant via Gough (1981)
// Réf : Kopp & Lean 2011, Geophys. Res. Lett. 38:L01706 — doc/equation.html#eq-flux-recu-moyenne-sur ; Laskar et al. 2004, A&A 428:261 — doc/equation.html#eq-orbite-date
function getSoleil() {
    const DATA = window.DATA;
    // Âge courant (INTERIEUR.ageCourant, depuis 📜⏳). 🔒 Luminosité exacte via Gough.
    const age = window.INTERIEUR.ageCourant();
    const P_watts = goughLuminosity(age);
    DATA['☀️']['🔋☀️'] = P_watts;
    // Moyenne annuelle sur l'orbite elliptique : × 1/√(1 − e²) (Kepler ; physics/orbite.js, 1 hors de la solution).
    DATA['☀️']['🧲☀️'] = P_watts / (4 * Math.PI * CONV.AU_M * CONV.AU_M) * window.ORBITE.facteurSoleil(age);
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    return true;
}

//Calcule les valeurs du noyau géothermique (utilise DATA directement)
function getNoyau() {
    // Source UNIQUE de DATA['🌕'] : l'état de l'intérieur (geology/interieur.js), amené à la date courante par
    // CONVERGE.computeRadiativeTransfer (bilan d'énergie). Ici on ne fait que le publier : flux [W/m²] = puissance /
    // (4πR²) au rayon courant 📜📐. Intérieur fondu → NaN jusqu'au radiatif de l'init (surface = magma).
    window.INTERIEUR.publier();
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
window.COMPUTE = {
    getEpochDateConfig: getEpochDateConfig,
    getMasses: getMasses,
    dryAtmosphereMassKgFromComponents: dryAtmosphereMassKgFromComponents,
    syncDryAtmosphereMassKg: syncDryAtmosphereMassKg,
    getSoleil: getSoleil,
    goughLuminosity: goughLuminosity,
    getNoyau: getNoyau
};
