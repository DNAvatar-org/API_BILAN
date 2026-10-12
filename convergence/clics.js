// File: API_BILAN/convergence/clics.js
// Desc: LA mécanique des clics, une seule fois. Ce qu'un clic fait à l'état (DATA['📜']) — temps écoulé, compteurs,
//       voile, émissions, curseur 🕰.order, passage d'époque — indépendamment de qui clique : l'interface
//       (events.js), la page scie, le banc époques (mode Tictimes), les scripts headless. Chacun en avait sa copie,
//       et elles ne s'accordaient pas (☄️ comptait 📿💫 dans la scie, 📿☄️ ailleurs ; 🗻/⛰ n'avançaient pas la
//       date du calcul alors qu'ils avançaient celle de l'interface).
//       Le CHOIX des boutons proposés reste à chaque interface (présentation) ; leur EFFET est ici.
//       Ne lance aucun calcul : l'appelant enchaîne avec api.run({ epochId, animEnabled: true }).
//
//       Temps : DATA['📜']['⏳'] = Ma écoulés dans l'époque courante, somme des 🔺⏳ des clics joués. C'est la
//       seule horloge : getEpochDateConfig en tire la date (▶ ∓ ⏳), l'interface en fait window.infoTimeMa.
// Version 1.1.0
// Date: 2026-10-12
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.CLICS = (function () {

    /** État propre à une époque : remis à zéro à chaque changement d'époque (frise ou passage). */
    const COMPTEURS_EPOQUE = ['⏳', '📿💫', '📿☄️', '📿🕰', '🔺⚖️🏭', '🔺⚖️🌊🏭', '🔺⚖️🌳🏭'];

    /** Tics de temps géologique : même effet (📿💫, voile de la racine 🍰⚽), boutons différents selon l'époque. */
    const TICS = ['💫', '🏔', '⛰'];

    function epoque() {
        return window.TIMELINE[window.DATA['📜']['👉']];
    }

    function poserEpoque(H, epochId) {
        H['🗿'] = epochId;
        H['👉'] = window.TIMELINE.findIndex(function (e) { return e['📅'] === epochId; });
        window.DATA['📅'] = window.TIMELINE[H['👉']];
        COMPTEURS_EPOQUE.forEach(function (k) { H[k] = 0; });
        H['🔘🕰'] = '';
    }

    /** 📱 : 🕰 indexé par année. Tranche active = la dernière dont l'année est atteinte ; null passé ◀ (fin). */
    function trancheActive(EP) {
        const W = EP['🕰'];
        const annees = Object.keys(W).filter(function (k) { return !isNaN(Number(k)); }).map(Number).sort(function (a, b) { return a - b; });
        const date = EP['▶'] + window.DATA['📜']['⏳'] * 1e6;
        if (date >= EP['◀']) return null;
        let active = annees[0];
        annees.forEach(function (a) { if (date >= a) active = a; });
        return W[active];
    }

    return {
        TICS: TICS,
        trancheActive: function () { return trancheActive(epoque()); },

        /**
         * Lecture automatique (bancs, Tictimes) : l'action que jouerait un utilisateur qui avance toujours.
         * 🕰.order → l'entrée au curseur 📿🕰 ; 📱 → la première action de la tranche active (null passé ◀) ;
         * sinon le tic 💫, ou l'unique action de l'époque (hysteresis 1a : 🗻, hysteresis 2 : ⛰).
         */
        prochaineAction: function () {
            const W = epoque()['🕰'];
            if (Array.isArray(W.order)) return W.order[window.DATA['📜']['📿🕰']];
            if (Object.keys(W).some(function (k) { return !isNaN(Number(k)); })) {
                const tranche = trancheActive(epoque());
                return tranche === null ? null : Object.keys(tranche)[0];
            }
            if ('💫' in W) return '💫';
            return Object.keys(W).find(function (k) { return W[k] !== null && typeof W[k] === 'object' && '🔺⏳' in W[k]; });
        },

        /** Durée de l'époque courante (Ma). */
        duree: function () {
            const EP = epoque();
            return Math.abs(EP['◀'] - EP['▶']) / 1e6;
        },

        /** Clic sur la frise : on (re)part de l'époque, sa graine, sans rien hériter (voile, eau des météorites). */
        frise: function (epochId) {
            const H = window.DATA['📜'];
            poserEpoque(H, epochId);
            H['🔺🌡️💫'] = 0;
            H['🔺🍰⚽'] = 0;
            H['🔺⚖️💧'] = 0;
            H['_veilTimelinePulseActive'] = false;
        },

        /** Passage à l'époque suivante au fil des clics : l'état (T°, glace, voile) est conservé. */
        passer: function (nextId) {
            poserEpoque(window.DATA['📜'], nextId);
        },

        /**
         * Un clic d'action sur l'époque courante.
         * @param {string} key  action de 🕰 (💫 🏔 ⛰ ☄️ 🗻 🌋 🎇) ou, sur 📱, action de la tranche active (⛽ 🛢 🪾)
         * @returns {{passage: string|null}} époque où le clic fait arriver (fin d'époque atteinte, ou ⏩ de 🎇)
         */
        jouer: function (key) {
            const H = window.DATA['📜'];
            const EP = epoque();
            const W = EP['🕰'];
            const tranche = Object.keys(W).some(function (k) { return !isNaN(Number(k)); }) ? trancheActive(EP) : null;
            const cfg = (tranche !== null) ? tranche[key] : W[key];

            if (tranche !== null) {
                // 📱 : émission + puits sur la durée du clic (une fois par événement), 📿💫 compte les clics.
                H['🔺⚖️🏭'] += cfg['🔺⚖️🏭'];
                window.CO2.advanceCarbonSinks(cfg['🔺⏳'] * 1e6, cfg['🔺⚖️🏭']);
                H['📿💫'] += 1;
            } else if (key === '☄️') {
                H['📿☄️'] += 1;   // eau des météorites : getMasses ajoute 📿☄️ × 🔺⚖️💧☄️
            } else if (key !== '🎇') {
                H['📿💫'] += 1;
                if (TICS.includes(key)) {
                    // Voile de la racine de l'époque : posé par le tic (la salve de l'entrée est retirée).
                    const racine = W[TICS.find(function (k) { return k in W; })];
                    if ('🍰⚽' in racine) {
                        H['🔺🍰⚽'] = racine['🍰⚽'];
                        H['_veilTimelinePulseActive'] = false;
                    }
                } else if ('🔺🍰⚽' in cfg) {
                    // 🗻 / 🌋 : voile SW porté par l'action elle-même, cumulé.
                    H['🔺🍰⚽'] = Math.min(0.95, H['🔺🍰⚽'] + cfg['🔺🍰⚽']);
                }
            }
            H['🔘🕰'] = key;
            if (Array.isArray(W.order) && W.order[H['📿🕰']] === key) H['📿🕰'] += 1;
            H['⏳'] += ('🔺⏳' in cfg) ? cfg['🔺⏳'] : 0;

            if (key === '🎇' && ('⏩' in cfg)) return { passage: cfg['⏩'] };
            const derniere = H['👉'] + 1 >= window.TIMELINE.length;
            if (!derniere && H['⏳'] >= this.duree() - 1e-9) return { passage: window.TIMELINE[H['👉'] + 1]['📅'] };
            return { passage: null };
        }
    };
})();

// Alias historique de l'interface : window.infoTimeMa EST 📜⏳ (accesseur, pas une copie). Les ~100 lectures et
// écritures de CO2 (frise, curseur de temps, passage d'époque) tombent ainsi sur la seule horloge.
Object.defineProperty(window, 'infoTimeMa', {
    get: function () { return window.DATA['📜']['⏳']; },
    set: function (v) { window.DATA['📜']['⏳'] = v; }
});
