// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.3.0
// Date: [October 12, 2026]
// logs :
// - v1.3.0: getEpochDateConfig ne passe plus à l'époque suivante (ni ne remet ⏳ / 📿 à zéro) : c'était le 3e
//   mécanisme de passage, avec CLICS.jouer et la frise de l'UI. L'époque est DATA['📜']['👉'], posée par CLICS.
// - v1.2.0: date = ▶ ∓ 📜⏳ (temps écoulé tenu par CLICS.jouer, convergence/clics.js) au lieu de Σ 📿 × 🔺⏳ des
//   seules actions comptées (🗻 / ⛰ / 🌋 n'avançaient pas la date du calcul) et du pas unique exigé sur 📱.
// - v1.1.0: PAS DE GARDES. Les compteurs de tics sont explicites (TIC_COUNTERS = 💫, ☄️ : les seuls 📿 qui
//   existent) au lieu d'un balayage de 🕰 filtré par typeof. Masses interpolées par 🔀 → 📜🔀⚖️ (comme 📜🔁⚖️) :
//   getMasses repart toujours de la racine de l'époque, il ne relit plus DATA['⚖️'] (l'eau des météorites s'y
//   ajoutait à chaque rappel). 🔀 '📜' fusionne EN PLACE dans DATA['📜'] (la copie cassait toute référence tenue
//   sur DATA['📜'], dont la chaîne du banc). Supprimés : 📜🌡️🧮 (doublon de 📅🌡️🧮, aucun lecteur), code 🏭📊
//   (aucune époque n'a ce profil) et window._co2ProfileLog, getEnabledStates (rendait true), alias getDateConfig,
//   reprise 🍎/📐 (DATA['📅'] est fusionné, jamais partiel).
// - v1.0.9: expositions fonctions regroupées sous window.COMPUTE (doublons window.foo retirés). Appelants migrés window.foo() → COMPUTE.foo() dans api.js, scie_hysteresis_search.js, sync_panels.js, ui/main.js, events.js, CO2/html/*.html.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

/** 📱 : 🕰 indexé par année (clés numériques '2000', '2025'…), chaque tranche porte ses actions (⛽, 🛢, 🪾). */
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
    const EPOCH = window.TIMELINE.find(item => item['📅'] === H['🗿']);
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
    // ⚖️💧 += 📿☄️ × 🔺⚖️💧☄️ (météorites)
    base['⚖️💧'] += H['🔺⚖️💧☄️'] * H['📿☄️'];
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

/** Date courante, voile, rayon, états 🔁, images, interpolation 🔀, puis masses. L'époque est celle posée par
 *  CLICS (frise / passer) : getEpochDateConfig n'en change jamais — le passage est décidé par le clic. */
function getEpochDateConfig() {
    const DATA = window.DATA;
    const H = DATA['📜'];
    const EPOCH = window.TIMELINE[H['👉']];
    const W = EPOCH['🕰'];

    // Temps écoulé dans l'époque : 📜⏳ (Ma), seule horloge, tenue par CLICS.jouer (somme des 🔺⏳ joués).
    const deltaYearsFromTics = H['⏳'] * 1e6;
    // Sens du temps : géologique ▶ > ◀ (années avant le présent), moderne ▶ < ◀ (calendrier).
    const isForwardTime = EPOCH['▶'] < EPOCH['◀'];
    const dateYears = isForwardTime ? EPOCH['▶'] + deltaYearsFromTics : EPOCH['▶'] - deltaYearsFromTics;

    // Masse d'eau par météorite (⚫, 🔥). ⚠️ Ne pas écraser 📿☄️ ni 📿💫 : compteurs des clics (CLICS.jouer).
    if ('☄️' in W) H['🔺⚖️💧☄️'] = W['☄️']['🔺⚖️💧☄️'];
    // Delta de température par tictime (graine sans anim : calculateT0).
    H['🔺🌡️💫'] = ('💫' in W) ? W['💫']['🔺🌡️💫'] : 0;
    DATA['📅']['🌡️🧮'] = EPOCH['🌡️🧮'];
    H['🧲🔬'] = EPOCH['🧲🔬'];

    // Voile SW 📜🔺🍰⚽. Trois sources possibles, par config :
    //  - 🔀 contient '📜' : rampe le long de l'époque (🏔) — l'interpolation plus bas le pose ;
    //  - racine EPOCH['🔺🍰⚽'] : impulsion posée une fois à l'entrée (📿💫 = 0), retirée au tic (CLICS.jouer) ;
    //  - action 🗻 / 🌋 qui déclare 🔺🍰⚽ : le clic la pose (CLICS.jouer), le compute n'y touche pas.
    // Sinon : le voile hérité d'une époque précédente est effacé.
    const interpolKeys = ('🔀' in W) ? W['🔀'] : [];
    const veilAction = ['🗻', '🌋'].some(k => (k in W) && ('🔺🍰⚽' in W[k]));
    if (interpolKeys.includes('📜')) {
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
    H['📐'] = window.INTERIEUR.rayonKm(DATA);

    // 🔁 ÉTATS PAR TIC (🍄, 🦣) : index = 📿💫 − 1 (tic 0 = racine) ; au-delà de la liste, le dernier état est
    // maintenu. Un état porte '⚾' (obliquité → 📜⚾, physics.js), des masses '⚖️*' (→ 📜🔁⚖️, getMasses), '📝'.
    H['⚾'] = 0;
    H['🔁⚖️'] = {};
    H['🔁📝'] = '';
    H['🖼'] = '';
    H['🌙'] = '';
    if (('🔁' in W) && H['📿💫'] >= 1) {
        const state = W['🔁'][Math.min(H['📿💫'] - 1, W['🔁'].length - 1)];
        for (const k of Object.keys(state)) {
            if (k.indexOf('⚖️') === 0) H['🔁⚖️'][k] = state[k];
        }
        if ('⚾' in state) H['⚾'] = state['⚾'];
        if ('📝' in state) H['🔁📝'] = state['📝'];
    }
    // 🖼 suite d'images imposée par l'époque : index = 📿💫 modulo longueur (sinon texture déduite de la date).
    if ('🖼' in W) H['🖼'] = W['🖼'][H['📿💫'] % W['🖼'].length];
    // 🌙 carte de nuit superposée (toute l'époque) : lumières des villes côté ombre.
    if ('🌙' in W) H['🌙'] = W['🌙'];

    // Date courante (années avant le présent, ou calendrier si ▶ < ◀) — lue par getSoleil (Gough).
    H['📅'] = dateYears;

    // 🔀 INTERPOLATION entre la racine (▶) et 🕰['◀'] des groupes listés : '⚖️' (masses → 📜🔀⚖️), '📅' (graine
    // 🌡️🧮), '📜' (voile 🔺🍰⚽). Sans ◀, la cible est la racine de l'époque suivante (masses seulement).
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
        // bary ∈ [0,1] : par la date (🏔, baryFromDate) ou par les tics (📿💫 + 📿☄️) / nombre de tics de l'époque.
        const span = Math.abs(EPOCH['▶'] - EPOCH['◀']);
        let bary;
        if (W.baryFromDate === true) {
            bary = (isForwardTime ? dateYears - EPOCH['▶'] : EPOCH['▶'] - dateYears) / span;
        } else {
            const ticsOverSpan = (span / 1e6) / W.order[0]['🔺⏳'];   // pas du 1er clic de la séquence
            const maxTics = ticsOverSpan > 1 ? Math.max(2, Math.floor(ticsOverSpan)) : 1;
            bary = (H['📿💫'] + H['📿☄️']) / maxTics;
        }
        bary = Math.max(0, Math.min(1, bary));
        H['bary'] = bary;
        for (const groupKey of interpolKeys) {
            const endObj = interpolEnd[groupKey];
            const out = {};
            for (const subkey of Object.keys(endObj)) {
                out[subkey] = EPOCH[subkey] + bary * (endObj[subkey] - EPOCH[subkey]);
            }
            if (groupKey === '⚖️') H['🔀⚖️'] = out;
            else if (groupKey === '📜') Object.assign(H, out);
            // DATA['📅'] est l'entrée du TIMELINE (api.run / setEpoch) : on la remplace par une copie fusionnée pour
            // ne jamais écrire dans la config.
            else if (groupKey === '📅') DATA['📅'] = Object.assign({}, DATA['📅'], out);
            else throw new Error('[getEpochDateConfig] 🔀 : groupe inconnu ' + groupKey + ' (époque ' + EPOCH['📅'] + ')');
        }
    }

    getMasses();
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
    // Date courante (posée par getEpochDateConfig dans 📜). 🔒 Luminosité exacte via Gough.
    const P_watts = goughLuminosity(DATA['📜']['📅']);
    DATA['☀️']['🔋☀️'] = P_watts;
    DATA['☀️']['🧲☀️'] = P_watts / (4 * Math.PI * CONV.AU_M * CONV.AU_M);
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    return true;
}

//Calcule les valeurs du noyau géothermique (utilise DATA directement)
function getNoyau() {
    // Source UNIQUE de DATA['🌕'] : l'état de l'intérieur (geology/interieur.js), amené à la date courante par
    // CONVERGE.computeRadiativeTransfer (bilan d'énergie). Ici on ne fait que le publier : flux [W/m²] = puissance /
    // (4πR²) au rayon courant 📜📐. Intérieur fondu → NaN jusqu'au radiatif de l'init (surface = magma).
    window.INTERIEUR.publier(window.DATA);
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
