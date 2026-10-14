// File: API_BILAN/demo/epoch_bench_loader.js
// Desc: Chargement du banc par le loader commun (API_BILAN/loader/) : stubs hôtes, moteur, scripts du banc,
//       avec l'écran de progression ; puis initEpochBenchPage().
// Version 2.1.0
// Date: 2026-10-15
// logs :
//   - v2.1.0: html.encart quand la page est dans une iframe (onglet Bench de l'index).
//   - v2.0.0: plus de liste de scripts recopiée (event_bus.js y manquait) : window.ENGINE_SCRIPTS par
//     BILAN_LOADER. Plus de délai de garde de 120 s qui masquait l'écran : une erreur de chargement s'affiche
//     telle quelle. epoch_bench_boot.js supprimé (debugAPI : initDATA ; chemin du worker : le loader).
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

// Encart : la page est dans l'iframe de l'onglet Bench de l'index (même test que benchEmitTuningToParent) — mise en page
// propre (css/epoch_bench.css, html.encart).
document.documentElement.classList.toggle('encart', window.parent !== window);

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
            'js/epoch_bench_encart.js',
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
