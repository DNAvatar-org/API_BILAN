// File: API_BILAN/demo/epoch_bench_loader.js
// Desc: Chargement sequentiel des modules de l API puis des scripts du banc, avec ecran de progression.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

(function loadEpochBenchModules() {
    'use strict';
    var BASE = '../';
    var LOADER_TIMEOUT_MS = 120000;
    var loaderListEl = document.getElementById('app-loader-list');
    var loaderOverlay = document.getElementById('app-loader');
    var loadLog = [];
    var tPage0 = performance.now();

    var STEPS = [
        // Ex-configsAll.js (bundle retiré v1.2.0) : sources séparées, ordre = dépendances.
        { kind: 'script', src: BASE + 'config/model_tuning_biblio.js', label: 'model_tuning_biblio.js' },
        { kind: 'script', src: BASE + 'config/configTimeline.js', label: 'configTimeline.js' },
        { kind: 'script', src: BASE + 'data/alphabet.js', label: 'alphabet.js' },
        { kind: 'script', src: BASE + 'data/dico.js', label: 'dico.js' },
        { kind: 'script', src: BASE + 'data/initDATA.js', label: 'initDATA.js' },
        { kind: 'script', src: BASE + 'config/fine_tuning_bounds.js', label: 'fine_tuning_bounds.js' },
        { kind: 'script', src: BASE + 'physics/physics.js', label: 'physics.js' },
        { kind: 'script', src: BASE + 'data/hitran_lines_CO2.js', label: 'hitran_lines_CO2.js' },
        { kind: 'script', src: BASE + 'data/hitran_lines_H2O.js', label: 'hitran_lines_H2O.js' },
        { kind: 'script', src: BASE + 'data/hitran_lines_CH4.js', label: 'hitran_lines_CH4.js' },
        { kind: 'script', src: BASE + 'spectroscopy/hitran.js', label: 'hitran.js' },
        { kind: 'script', src: BASE + 'physics/climate.js', label: 'climate.js' },
        { kind: 'script', src: BASE + 'radiative/calculations.js', label: 'calculations.js (radiatif)' },
        // Chargé en <script> AVANT le pool : il se publie au lieu de s'exécuter, ce qui donne au pool
        // une source utilisable en blob: — seul moyen d'avoir des workers quand la page est en file://.
        { kind: 'script', src: BASE + 'workers/spectral_slice_worker.js', label: 'spectral_slice_worker.js (source)' },
        { kind: 'script', src: BASE + 'workers/worker_pool.js', label: 'worker_pool.js' },
        { kind: 'script', src: BASE + 'h2o/calculations_h2o.js', label: 'calculations_h2o.js' },
        { kind: 'script', src: BASE + 'albedo/calculations_albedo.js', label: 'calculations_albedo.js' },
        { kind: 'script', src: BASE + 'atmosphere/calculations_atm.js', label: 'calculations_atm.js' },
        { kind: 'script', src: BASE + 'co2/calculations_co2.js', label: 'calculations_co2.js' },
        { kind: 'script', src: BASE + 'convergence/compute.js', label: 'compute.js' },
        { kind: 'script', src: BASE + 'convergence/calculations_flux.js', label: 'calculations_flux.js' },
        { kind: 'script', src: BASE + 'tuning.js', label: 'tuning.js' },
        { kind: 'script', src: BASE + 'api.js', label: 'api.js' },
        // Scripts du banc, apres l'API : epoch_bench_format.js lit window.BENCH_LIT_BY_EPOCH_ID
        // (configTimeline.js) des son evaluation. L'ordre ci-dessous est celui des dependances.
        { kind: 'script', src: 'epoch_bench_host.js', label: 'epoch_bench_host.js' },
        { kind: 'script', src: 'epoch_bench_format.js', label: 'epoch_bench_format.js' },
        { kind: 'script', src: 'epoch_bench_table.js', label: 'epoch_bench_table.js' },
        { kind: 'script', src: 'epoch_bench_tuning.js', label: 'epoch_bench_tuning.js' },
        { kind: 'script', src: 'epoch_bench_run.js', label: 'epoch_bench_run.js' },
        { kind: 'script', src: 'epoch_bench_main.js', label: 'epoch_bench_main.js' }
    ];

    function initLoaderUI() {
        if (!loaderListEl) return;
        STEPS.forEach(function (step, i) {
            var li = document.createElement('li');
            li.setAttribute('data-idx', String(i));
            li.textContent = step.label;
            loaderListEl.appendChild(li);
        });
    }

    function setLoaded(index) {
        if (!loaderListEl) return;
        var li = loaderListEl.querySelector('[data-idx="' + index + '"]');
        if (li) li.classList.add('loaded');
    }

    function record(label, ms) {
        loadLog.push({ label: label, ms: ms });
    }

    function loadScript(step, index) {
        return new Promise(function (resolve, reject) {
            var t0 = performance.now();
            var s = document.createElement('script');
            s.src = step.src;
            s.onload = function () {
                record(step.label, performance.now() - t0);
                setLoaded(index);
                resolve();
            };
            s.onerror = function () {
                reject(new Error('\u00c9chec chargement ' + step.src));
            };
            document.body.appendChild(s);
        });
    }

    // loadTimeline (fetch + new Function sur configTimeline.js) retiré en v1.0.27 : c'était une seconde
    // évaluation défensive, et fetch est bloqué en file://, donc le chargement s'arrêtait là. Rien entre
    // les deux chargements ne touchait TIMELINE ; la mutation qui la justifiait (🕰.order consommé par
    // shift()) a été supprimée — events.js v1.2.36 la remplace par un curseur 📿🕰.
    function runStep(step, index) {
        return loadScript(step, index);
    }

    function loadAllSequential(i) {
        if (i >= STEPS.length) return Promise.resolve();
        return runStep(STEPS[i], i).then(function () {
            return loadAllSequential(i + 1);
        });
    }

    function hideLoader() {
        if (loaderOverlay) loaderOverlay.classList.add('hidden');
    }

    function logLoadSummary() {
        var total = performance.now() - tPage0;
        console.groupCollapsed('[epoch_bench \u00b7 API_BILAN] chargement page', Math.round(total) + ' ms');
        loadLog.forEach(function (e) {
            console.log(e.label, '(' + Math.round(e.ms) + ' ms)');
        });
        var wp = window.__API_BILAN_WORKER_POOL__;
        if (wp) {
            console.log('spectralWorkerPool', wp.nWorkers + ' workers, ' + wp.nCPU + ' CPUs \u2014 Transferable');
        }
        console.groupEnd();
    }

    initLoaderUI();

    var loaderDone = false;
    var timeoutId = setTimeout(function () {
        if (loaderDone) return;
        loaderDone = true;
        hideLoader();
        var f = document.getElementById('footer-info');
        if (f) f.textContent = '\u274c D\u00e9lai chargement d\u00e9pass\u00e9 \u2014 voir la console.';
    }, LOADER_TIMEOUT_MS);

    loadAllSequential(0).then(function () {
        loaderDone = true;
        clearTimeout(timeoutId);
        hideLoader();
        logLoadSummary();
        if (typeof initEpochBenchPage === 'function') initEpochBenchPage();
    }).catch(function (err) {
        loaderDone = true;
        clearTimeout(timeoutId);
        console.error('[epoch_bench]', err);
        hideLoader();
        var f = document.getElementById('footer-info');
        if (f) f.textContent = '\u274c Erreur chargement \u2014 ' + (err && err.message ? err.message : String(err));
    });
})();
