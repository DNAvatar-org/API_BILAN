// File: API_BILAN/workers/worker_pool.js - Pool de workers spectraux (Transferable)
// Desc: Crée N-1 workers (1 CPU réservé au rendu), distribue les tranches lambda équitablement.
//       Expose window.spectralWorkerPool.dispatch(params, nZ, nL) → Promise<{resultBuf, sums}>.
//       Transferable objects : chaque worker alloue son Float32Array, transfère l'ownership au main thread
//       (zero-copy, pas de duplication mémoire). Fonctionne sans headers COOP/COEP → compatible prod.
// Version 1.1.4
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: March 08, 2026
// Logs:
// - v1.1.4 URL worker : window.__SPECTRAL_WORKER_SCRIPT__ (epoch_bench doc/) sinon ../API_BILAN/workers/ (CO2)
// - v1.1.3 __API_BILAN_WORKER_POOL__ + silence console si __EPOCH_BENCH_PAGE__ (résumé dans epoch_bench)
// - v1.0.0 Initial: N-1 workers, SAB Float32 pour upward_flux, sums EDS via postMessage
// - v1.1.0 Transferable au lieu de SharedArrayBuffer (pas de headers COOP/COEP requis, compatible prod)
// - v1.1.1 Retrait typeof navigator guard (regle-js-crash)
// - v1.1.2 Plafond optionnel CONFIG_COMPUTE.maxWorkers (si défini) ; sinon nCPU - 1

(function () {
    'use strict';

    var nCPU = navigator.hardwareConcurrency;
    // 1 CPU réservé au rendu ; optionnel : CONFIG_COMPUTE.maxWorkers plafonne (ex. 4) si tu veux limiter
    var rawWorkers = Math.max(1, nCPU - 1);
    var maxCap = (window.CONFIG_COMPUTE && typeof window.CONFIG_COMPUTE.maxWorkers === 'number')
        ? Math.max(1, window.CONFIG_COMPUTE.maxWorkers) : rawWorkers;
    var nWorkers = Math.min(rawWorkers, maxCap);

    // CO2/index : document sous CO2/ → ../API_BILAN/workers/ OK. API_BILAN/doc/epoch_bench : définir window.__SPECTRAL_WORKER_SCRIPT__.
    var workerPath = (typeof window.__SPECTRAL_WORKER_SCRIPT__ === 'string' && window.__SPECTRAL_WORKER_SCRIPT__)
        ? window.__SPECTRAL_WORKER_SCRIPT__
        : '../API_BILAN/workers/spectral_slice_worker.js';

    var workers = [];
    for (var k = 0; k < nWorkers; k++) {
        workers.push(new Worker(workerPath));
    }

    window.__API_BILAN_WORKER_POOL__ = {
        nWorkers: nWorkers,
        nCPU: nCPU,
        transferable: true
    };

    if (!window.__EPOCH_BENCH_PAGE__) {
        console.log('[worker_pool.js] ' + nWorkers + ' workers spectraux créés (' + nCPU + ' CPUs, 1 réservé rendu) — mode Transferable');
    }

    // dispatch: répartit les nL lambdas sur nWorkers tranches équitables.
    // Chaque worker calcule sa tranche et transfère son Float32Array[nZ * sliceSize] au main thread.
    // Le main thread fusionne les tranches dans resultBuf[nZ * nL].
    // Retourne Promise<{resultBuf: Float32Array, sums: {CO2, H2O, CH4, clouds}}>.
    function dispatch(params, nZ, nL) {
        var sliceSize = Math.ceil(nL / nWorkers);
        var doneCount = 0;
        var activeWorkers = 0;
        var sums = { CO2: 0, H2O: 0, CH4: 0, clouds: 0 };
        // Buffer de résultat final (flat, accumulé au fur et à mesure des réponses)
        var resultBuf = new Float32Array(nZ * nL);

        return new Promise(function (resolve, reject) {
            workers.forEach(function (worker, k) {
                var jStart = k * sliceSize;
                var jEnd = Math.min((k + 1) * sliceSize, nL);
                if (jStart >= nL) return;
                activeWorkers++;

                worker.onmessage = function (e) {
                    var msg = e.data;
                    if (msg.type === 'sliceTransferDone' && msg.id === k) {
                        // Fusionner la tranche transférée dans resultBuf
                        var sliceView = new Float32Array(msg.buf);
                        var sliceNL = msg.jEnd - msg.jStart;
                        for (var i = 0; i < nZ; i++) {
                            for (var j = 0; j < sliceNL; j++) {
                                resultBuf[i * nL + msg.jStart + j] = sliceView[i * sliceNL + j];
                            }
                        }
                        sums.CO2 += msg.sum_blocked_CO2;
                        sums.H2O += msg.sum_blocked_H2O;
                        sums.CH4 += msg.sum_blocked_CH4;
                        sums.clouds += msg.sum_blocked_clouds;
                        doneCount++;
                        if (doneCount === activeWorkers) {
                            resolve({ resultBuf: resultBuf, sums: sums });
                        }
                    } else if (msg.type === 'sliceError') {
                        reject(new Error('[worker_pool worker ' + k + '] ' + msg.error));
                    }
                };

                worker.postMessage({
                    type: 'slice_transfer',
                    id: k,
                    jStart: jStart,
                    jEnd: jEnd,
                    nZ: nZ,
                    // Tranches lambda pour ce worker (index local 0..jEnd-jStart-1)
                    lambda_range:      params.lambda_range.slice(jStart, jEnd),
                    lambda_weights:    params.lambda_weights.slice(jStart, jEnd),
                    cross_section_CO2: params.cross_section_CO2.slice(jStart, jEnd),
                    cross_section_H2O: params.cross_section_H2O.slice(jStart, jEnd),
                    cross_section_CH4: params.cross_section_CH4.slice(jStart, jEnd),
                    earth_flux:        params.earth_flux.slice(jStart, jEnd),
                    // Données z partagées (toutes les couches, lecture seule, petites ~50 couches)
                    layers:              params.layers,
                    i_trop:              params.i_trop,
                    h2o_eds_scale:       params.h2o_eds_scale,
                    tau_cloud_per_layer: params.tau_cloud_per_layer,
                    effective_delta_lambda: params.effective_delta_lambda,
                    T_surf:              params.T_surf,
                    constants:           params.constants
                });
                // Note : pas de Transferable sur les .slice() → ce sont des copies JS Array normales.
                // Seul le résultat (Float32Array buf) revient en Transferable depuis le worker.
            });

            if (activeWorkers === 0) {
                resolve({ resultBuf: resultBuf, sums: sums });
            }
        });
    }

    window.spectralWorkerPool = {
        ready: true,
        nWorkers: nWorkers,
        dispatch: dispatch
    };

    if (!window.__EPOCH_BENCH_PAGE__) {
        console.log('[worker_pool.js] spectralWorkerPool prêt. Mode Transferable (compatible prod, sans headers COOP/COEP).');
    }
}());
