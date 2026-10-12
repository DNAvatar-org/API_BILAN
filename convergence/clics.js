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
// Version 1.3.1
// - v1.3.1: frise = intérieur recalculé depuis la condition initiale (il héritait de l'état des clics précédents).
// Date: 2026-10-12
// Logs:
// - v1.3.0: la durée d'un clic est sur l'entrée de séquence ({ '🕰': action, '🔺⏳': Ma }), plus sur l'action : un
//   même 💫 peut valoir 1 ka puis 379 Ma (🔥). pas(key) pour les libellés ; 📿🕰 compte tous les clics de l'époque.
// - v1.2.0: 🕰.order dans toutes les époques (config) : prochaineAction = order au curseur (plus de repli 💫 ni
//   « l'unique action »), jouer crashe sur une action hors séquence, et chaque séquence est vérifiée au
//   chargement (elle doit atteindre la fin de l'époque à son dernier clic, ou finir par 🎇 ⏩).
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

    /** 🕰 indexé par année (📱) : le choix est offert par tranche, il n'y a pas de séquence imposée. */
    function parTranche(W) {
        return Object.keys(W).some(function (k) { return !isNaN(Number(k)); });
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

    /**
     * Au chargement : chaque séquence 🕰.order — des entrées { '🕰': action, '🔺⏳': durée du clic en Ma } — doit
     * traverser son époque exactement : le dernier clic, et lui seul, atteint la fin (⏳ ≥ durée) ; ou bien elle finit
     * par un 🎇 qui passe (⏩) avant. Sinon la config ment : crash, avec l'époque en cause.
     */
    window.TIMELINE.forEach(function (EP) {
        const W = EP['🕰'];
        if (parTranche(W)) return;
        const duree = Math.abs(EP['◀'] - EP['▶']) / 1e6;
        let t = 0;
        W.order.forEach(function (e, i) {
            const k = e['🕰'];
            if (!(k in W)) throw new Error('[CLICS] ' + EP['📅'] + ' : 🕰.order[' + i + '] = ' + k + ', action non définie');
            const dernier = i === W.order.length - 1;
            if (k === '🎇' && ('⏩' in W[k])) {
                if (!dernier) throw new Error('[CLICS] ' + EP['📅'] + ' : 🎇 ⏩ doit clore la séquence');
                return;
            }
            t += e['🔺⏳'];
            if ((t >= duree - 1e-9) !== dernier) {
                throw new Error('[CLICS] ' + EP['📅'] + ' : le clic ' + (i + 1) + '/' + W.order.length + ' (' + k + ') porte ⏳ à ' + t + ' Ma pour une durée de ' + duree + ' Ma');
            }
        });
    });

    return {
        TICS: TICS,
        /** L'époque courante offre-t-elle ses actions par tranches d'années (📱) plutôt qu'en séquence ? */
        parTranche: function () { return parTranche(epoque()['🕰']); },
        trancheActive: function () { return trancheActive(epoque()); },

        /**
         * L'action suivante de l'époque : 🕰.order au curseur 📿🕰 (undefined une fois la séquence jouée) ;
         * 📱 : la première action de la tranche active (null passé ◀). Interface, scie et bancs lisent la même.
         */
        prochaineAction: function () {
            const W = epoque()['🕰'];
            if (parTranche(W)) {
                const tranche = trancheActive(epoque());
                return tranche === null ? null : Object.keys(tranche)[0];
            }
            const c = window.DATA['📜']['📿🕰'];
            return c === W.order.length ? undefined : W.order[c]['🕰'];
        },

        /** Durée (Ma) qu'ajouterait un clic sur `key` maintenant : celle de l'entrée de séquence au curseur, ou, sur 📱,
         *  celle de l'action dans la tranche active. Pour les libellés (« +100 ka par clic »). */
        pas: function (key) {
            const W = epoque()['🕰'];
            if (parTranche(W)) return trancheActive(epoque())[key]['🔺⏳'];
            return W.order[window.DATA['📜']['📿🕰']]['🔺⏳'];
        },

        /** Durée de l'époque courante (Ma). */
        duree: function () {
            const EP = epoque();
            return Math.abs(EP['◀'] - EP['▶']) / 1e6;
        },

        /** Clic sur la frise : on (re)part de l'époque, sa graine, sans rien hériter (voile, eau des météorites,
         *  ni l'état de l'intérieur : 🌡️🌕 = 0 → INTERIEUR.avancer repart de la condition initiale de la config et
         *  intègre jusqu'à la date de l'époque, au lieu de prolonger l'histoire des clics précédents). */
        frise: function (epochId) {
            const H = window.DATA['📜'];
            poserEpoque(H, epochId);
            H['🔺🌡️💫'] = 0;
            H['🔺🍰⚽'] = 0;
            H['🔺⚖️💧'] = 0;
            H['_veilTimelinePulseActive'] = false;
            window.DATA['🌕']['🌡️🌕'] = 0;
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
            const tranche = parTranche(W) ? trancheActive(EP) : null;
            // Durée du clic : portée par l'entrée de séquence (le même 💫 peut durer 1 ka ou 379 Ma), ou par l'action
            // de la tranche sur 📱.
            const entree = (tranche === null) ? W.order[H['📿🕰']] : tranche[key];
            if (tranche === null && entree['🕰'] !== key) {
                throw new Error('[CLICS] ' + key + ' joué sur ' + EP['📅'] + ' alors que 🕰.order attend ' + entree['🕰'] + ' (clic n° ' + H['📿🕰'] + ')');
            }
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
            H['📿🕰'] += 1;               // clics joués dans l'époque (curseur de la séquence ; compte aussi ceux de 📱)
            H['⏳'] += entree['🔺⏳'];

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
