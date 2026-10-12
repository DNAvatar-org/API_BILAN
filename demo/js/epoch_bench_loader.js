// File: API_BILAN/demo/epoch_bench_loader.js
// Desc: Chargement du banc par le loader commun (API_BILAN/loader/) : stubs hôtes, moteur, scripts du banc,
//       avec l'écran de progression ; puis initEpochBenchPage().
// Version 2.0.0
// Date: 2026-10-10
// logs :
//   - v2.0.0: plus de liste de scripts recopiée (event_bus.js y manquait) : window.ENGINE_SCRIPTS par
//     BILAN_LOADER. Plus de délai de garde de 120 s qui masquait l'écran : une erreur de chargement s'affiche
//     telle quelle. epoch_bench_boot.js supprimé (debugAPI : initDATA ; chemin du worker : le loader).
//   - v1.1.0: + epoch_bench_chain.js (mode tictimes), apres epoch_bench_run.js dont il utilise benchMesurer.
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

(function loadEpochBench() {
    const opts = {
        apiBase: '../',
        before: ['js/demo_host.js'],
        // Scripts du banc, apres le moteur, dans l'ordre des dependances.
        after: [
            'js/epoch_bench_format.js',
            'js/epoch_bench_table.js',
            'js/epoch_bench_tuning.js',
            'js/epoch_bench_run.js',
            'js/epoch_bench_chain.js',
            'js/epoch_bench_main.js'
        ],
        cacheBust: '',
        onLoaded: function (src, i) {
            document.querySelector('[data-idx="' + i + '"]').classList.add('loaded');
        }
    };
    const listEl = document.getElementById('app-loader-list');
    window.BILAN_LOADER.list(opts).forEach(function (src, i) {
        const li = document.createElement('li');
        li.setAttribute('data-idx', String(i));
        li.textContent = src.slice(src.lastIndexOf('/') + 1);
        listEl.appendChild(li);
    });
    window.BILAN_LOADER.load(opts).then(function () {
        document.getElementById('app-loader').classList.add('hidden');
        initEpochBenchPage();
    }, function (err) {
        document.getElementById('app-loader').classList.add('hidden');
        document.getElementById('footer-info').textContent = '❌ ' + err.message;
        throw err;
    });
})();
