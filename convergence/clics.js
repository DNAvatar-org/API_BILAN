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
// Version 1.4.0
// - v1.4.0: chemins (🕰.🛤, 🦣) : au premier clic, un bouton par chemin (🐾 pas à pas, 🦘 le saut) ; chaque chemin sa séquence.
// - v1.3.6: emettre(kg, ans) — émission libre sur 📱 (une page hôte : les déplacements du joueur de DNA Tamagoshi),
//   comme une action de tranche mais de masse et de durée données, puits compris.
// - v1.3.5: tranches de 📱 jusqu'à la borne de la frise (TIMELINE_FUTUR ◀ = 2300), plus jusqu'à ◀ de 📱 (2100).
// - v1.3.4: 📜🔺⏳ = durée du clic joué (Ma), remise à 0 au changement d'époque.
// - v1.3.3: ☄️ cumule l'eau de SON entrée de séquence (🔺⚖️💧☄️) dans 📜🔺⚖️💧 — la masse peut changer d'un ☄️ à l'autre.
// - v1.3.2: frise = calottes de la config de l'époque (CALOTTES.depuisConfig) ; CLICS.date() remplace la copie 📜📅.
// - v1.3.1: frise = intérieur recalculé depuis la condition initiale (il héritait de l'état des clics précédents).
// Date: 2026-10-26
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.CLICS = (function () {

    /** État propre à une époque : remis à zéro à chaque changement d'époque (frise ou passage). */
    const COMPTEURS_EPOQUE = ['⏳', '📿💫', '📿☄️', '📿🕰', '🔺⚖️💧', '🔺⚖️🏭', '🔺⚖️🌊🏭', '🔺⚖️🌳🏭'];

    /** Tics de temps géologique : même effet (📿💫, voile de la racine 🍰⚽), boutons différents selon l'époque — dont les deux
     *  chemins du Quaternaire (🐾 pas à pas, 🦘 le saut). */
    const TICS = ['💫', '🏔', '⛰', '🐾', '🦘'];

    function epoque() {
        return window.TIMELINE[window.DATA['📜']['👉']];
    }

    function poserEpoque(H, epochId) {
        H['🗿'] = epochId;
        H['👉'] = window.TIMELINE.findIndex(function (e) { return e['📅'] === epochId; });
        window.DATA['📅'] = window.TIMELINE[H['👉']];
        COMPTEURS_EPOQUE.forEach(function (k) { H[k] = 0; });
        H['🔘🕰'] = '';
        H['🔺⏳'] = 0;
    }

    /** La séquence que joue `key` : celle de son chemin quand l'époque en offre (🕰.🛤, 🦣), sinon 🕰 lui-même (sa séquence
     *  order). Au premier clic d'une époque à chemins, chaque bouton annonce ainsi la durée et l'état de SON chemin. */
    function sequence(W, key) {
        return ('🛤' in W && key in W['🛤']) ? W['🛤'][key] : W;
    }

    /** 🕰 indexé par année (📱) : le choix est offert par tranche, il n'y a pas de séquence imposée. */
    function parTranche(W) {
        return Object.keys(W).some(function (k) { return !isNaN(Number(k)); });
    }

    /** 📱 : 🕰 indexé par année. Tranche active = la dernière dont l'année est atteinte ; null à la borne de la frise
     *  (window.TIMELINE_FUTUR ◀, 2300) : les clics continuent après ◀ de 📱 (2100), ses masses 🔀 restant à leur cible. */
    function trancheActive(EP) {
        const W = EP['🕰'];
        const annees = Object.keys(W).filter(function (k) { return !isNaN(Number(k)); }).map(Number).sort(function (a, b) { return a - b; });
        const date = EP['▶'] + window.DATA['📜']['⏳'] * 1e6;
        if (date >= window.TIMELINE_FUTUR['◀']) return null;
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
        const sequences = ('🛤' in W) ? Object.values(W['🛤']) : [W];   // chaque chemin traverse l'époque
        sequences.forEach(function (S) {
            let t = 0;
            S.order.forEach(function (e, i) {
                const k = e['🕰'];
                if (!(k in W)) throw new Error('[CLICS] ' + EP['📅'] + ' : 🕰.order[' + i + '] = ' + k + ', action non définie');
                const dernier = i === S.order.length - 1;
                if (k === '🎇' && ('⏩' in W[k])) {
                    if (!dernier) throw new Error('[CLICS] ' + EP['📅'] + ' : 🎇 ⏩ doit clore la séquence');
                    return;
                }
                t += e['🔺⏳'];
                if ((t >= duree - 1e-9) !== dernier) {
                    throw new Error('[CLICS] ' + EP['📅'] + ' : le clic ' + (i + 1) + '/' + S.order.length + ' (' + k + ') porte ⏳ à ' + t + ' Ma pour une durée de ' + duree + ' Ma');
                }
            });
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
            return sequence(W, key).order[window.DATA['📜']['📿🕰']]['🔺⏳'];
        },

        /** Date courante [an] de l'époque, tirée de la seule horloge 📜⏳ : ▶ − ⏳ (géologique, âge) ou ▶ + ⏳ (calendaire).
         *  Plus de copie 📜📅 : posée par getEpochDateConfig, elle restait périmée entre un clic frise et le calcul. */
        date: function () {
            const EP = epoque(), dt = window.DATA['📜']['⏳'] * 1e6;
            return EP['▶'] < EP['◀'] ? EP['▶'] + dt : EP['▶'] - dt;
        },

        /** Masse d'eau [kg] qu'apporterait le ☄️ au curseur de la séquence (portée par son entrée de 🕰.order). */
        eauDuClic: function () {
            return epoque()['🕰'].order[window.DATA['📜']['📿🕰']]['🔺⚖️💧☄️'];
        },

        /** Durée de l'époque courante (Ma). */
        duree: function () {
            const EP = epoque();
            return Math.abs(EP['◀'] - EP['▶']) / 1e6;
        },

        /** Clic sur la frise : on (re)part de l'époque, sa graine, sans rien hériter (voile, eau des météorites,
         *  ni l'état de l'intérieur : 🌡️🌕 = 0 → INTERIEUR.avancer repart de la condition initiale de la config et
         *  intègre jusqu'à la date de l'époque, au lieu de prolonger l'histoire des clics précédents ; ni les calottes :
         *  celles de la config de l'époque, datées de ▶). */
        frise: function (epochId) {
            const H = window.DATA['📜'];
            poserEpoque(H, epochId);
            H['🔺🌡️💫'] = 0;
            H['🔺🍰⚽'] = 0;
            H['_veilTimelinePulseActive'] = false;
            window.DATA['🌕']['🌡️🌕'] = 0;
            window.CALOTTES.depuisConfig(window.DATA);
        },

        /**
         * Émission libre sur 📱 : kg de CO₂ émis, sur `ans` années — même effet qu'une action de tranche (⛽ 🛢 🪾) :
         * masse injectée, puits (océan, forêts) sur la durée, horloge avancée ; sans tranche ni séquence. Une page
         * hôte y met ce qu'elle mesure (CO2 embarqué : les déplacements du joueur). Ne lance aucun calcul.
         */
        emettre: function (kg, ans) {
            const H = window.DATA['📜'];
            if (!this.parTranche()) throw new Error('[CLICS] emettre sur ' + epoque()['📅'] + ' : réservé à 📱 (🕰 par année)');
            H['🔺⚖️🏭'] += kg;
            window.CO2.advanceCarbonSinks(ans, kg);
            H['📿💫'] += 1;
            H['🔘🕰'] = '⛽';             // une émission fossile : le libellé de ⛽
            H['🔺⏳'] = ans / 1e6;
            H['📿🕰'] += 1;
            H['⏳'] += ans / 1e6;
            return { passage: null };
        },

        /** Passage à l'époque suivante au fil des clics : l'état (T°, glace, voile) est conservé. */
        passer: function (nextId) {
            poserEpoque(window.DATA['📜'], nextId);
        },

        /**
         * Un clic d'action sur l'époque courante.
         * @param {string} key  action de 🕰 (💫 🏔 ⛰ 🐾 🦘 ☄️ 🗻 🌋 🎇) ou, sur 📱, action de la tranche active (⛽ 🛢 🪾)
         * @returns {{passage: string|null}} époque où le clic fait arriver (fin d'époque atteinte, ou ⏩ de 🎇)
         */
        jouer: function (key) {
            const H = window.DATA['📜'];
            const EP = epoque();
            const W = EP['🕰'];
            const tranche = parTranche(W) ? trancheActive(EP) : null;
            // Durée du clic : portée par l'entrée de séquence (le même 💫 peut durer 1 ka ou 379 Ma), ou par l'action
            // de la tranche sur 📱.
            // Époque à chemins : le premier clic choisit le chemin, les suivants le continuent (un autre chemin en cours de
            // route mêlerait deux séquences).
            if ('🛤' in W && H['📿🕰'] > 0 && key !== H['🔘🕰']) {
                throw new Error('[CLICS] ' + key + ' joué sur ' + EP['📅'] + ' alors que le chemin ' + H['🔘🕰'] + ' est en cours');
            }
            const entree = (tranche === null) ? sequence(W, key).order[H['📿🕰']] : tranche[key];
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
                H['📿☄️'] += 1;
                H['🔺⚖️💧'] += entree['🔺⚖️💧☄️'];   // eau des météorites, cumulée : getMasses l'ajoute à ⚖️💧
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
            H['🔺⏳'] = entree['🔺⏳'];   // durée de ce clic (Ma), lue par l'interface (« ⛽ +25 a »)
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
