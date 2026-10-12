// File: API_BILAN/loader/loader.js
// Desc: Chargeur unique du moteur. Charge, l'un après l'autre et dans cet ordre : les scripts « avant » de
//       l'hôte, les scripts du moteur (window.ENGINE_SCRIPTS, engine_manifest.js), les scripts « après » de
//       l'hôte. C'est lui qui garantit que tout existe quand le code tourne : le code n'a donc jamais à tester
//       la présence d'un module ou d'une fonction. Le premier script qui échoue arrête tout, avec son chemin.
//       Scripts classiques (pas de modules ES) : les pages s'ouvrent aussi en file://.
// Version 1.0.0
// Date: 2026-10-10
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.BILAN_LOADER = {
    /**
     * @param {object} opts
     * @param {string}   opts.apiBase   URL de API_BILAN/ vue de la page (finit par '/')
     * @param {string[]} opts.before    scripts de l'hôte à charger avant le moteur (URL telles quelles)
     * @param {string[]} opts.after     scripts de l'hôte à charger après le moteur
     * @param {string}   opts.cacheBust suffixe ajouté à chaque URL ('' si aucun)
     * @param {function(string, number, number)} opts.onLoaded (src, rang, total) après chaque script
     * @returns {Promise<void>} rejetée au premier échec, avec le chemin du script
     */
    load: function (opts) {
        // Chemin du worker spectral : dérivé de apiBase, une seule fois, ici (worker_pool.js n'a pas de défaut).
        window.__SPECTRAL_WORKER_SCRIPT__ = opts.apiBase + 'workers/spectral_slice_worker.js';
        const list = window.BILAN_LOADER.list(opts);
        let chain = Promise.resolve();
        list.forEach(function (src, i) {
            chain = chain.then(function () {
                return new Promise(function (resolve, reject) {
                    const s = document.createElement('script');
                    s.src = src + opts.cacheBust;
                    s.onload = function () {
                        opts.onLoaded(src, i, list.length);
                        resolve();
                    };
                    s.onerror = function () { reject(new Error('[BILAN_LOADER] échec de chargement : ' + src)); };
                    document.body.appendChild(s);
                });
            });
        });
        return chain;
    },

    /** La liste complète, dans l'ordre de chargement (pour l'écran de progression). */
    list: function (opts) {
        return opts.before
            .concat(window.ENGINE_SCRIPTS.map(function (p) { return opts.apiBase + p; }))
            .concat(opts.after);
    }
};
