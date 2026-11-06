// File: API_BILAN/workers/worker_pool.js - Pool de workers spectraux (Transferable)
// Desc: Crée N-1 workers (1 CPU réservé au rendu), distribue les tranches lambda équitablement.
//       Expose window.spectralWorkerPool.dispatch(params, nZ, nL) → Promise<{resultBuf, sums}>.
//       Transferable objects : chaque worker alloue son Float32Array, transfère l'ownership au main thread
//       (zero-copy, pas de duplication mémoire). Fonctionne sans headers COOP/COEP → compatible prod.
// Version 1.5.0
// - v1.5.0 (2026-11-06): spectra.tStrates, transmission de chaque couche de stratosphère par λ.
// - v1.4.0 (2026-10-30): tables σ(λ, T, P) : nP transmis, lignes iT·nP + iP.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: November 6, 2026

(function () {
    'use strict';

    var nCPU = navigator.hardwareConcurrency;
    // 1 CPU réservé au rendu ; optionnel : CONFIG_COMPUTE.maxWorkers plafonne (ex. 4) si tu veux limiter
    var rawWorkers = Math.max(1, nCPU - 1);
    var nWorkers = Math.min(rawWorkers, Math.max(1, window.CONFIG_COMPUTE.maxWorkers));

    // Posé par le loader (BILAN_LOADER, depuis apiBase) ou par la page. PAS de chemin par défaut : un chemin faux
    // ne lève rien (new Worker → 404 asynchrone), les workers restent muets et la convergence ne finit jamais.
    var workerPath = window.__SPECTRAL_WORKER_SCRIPT__;

    // En file://, Chrome refuse new Worker('file://…') : origine 'null'. Un blob: passe, lui — et comme
    // fetch/XHR sont aussi bloqués, la source ne peut venir que de la page, qui charge le worker en <script>
    // (il se publie alors dans __SPECTRAL_WORKER_MAIN__ au lieu de s'exécuter, cf. spectral_slice_worker.js v0.6.0).
    // Même code, mêmes tranches, mêmes nombres : ce n'est qu'une autre façon de livrer la source.
    var blobUrl = null;
    function makeWorker() {
        if (blobUrl) return new Worker(blobUrl);
        try {
            return new Worker(workerPath);
        } catch (e) {
            // file:// ou autre origine : la source vient de la page (spectral_slice_worker.js chargé en <script>).
            var src = '(' + window.__SPECTRAL_WORKER_MAIN__.toString() + ')();';
            blobUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
            return new Worker(blobUrl);
        }
    }

    var workers = [];
    for (var k = 0; k < nWorkers; k++) {
        workers.push(makeWorker());
    }

    window.__API_BILAN_WORKER_POOL__ = {
        nWorkers: nWorkers,
        nCPU: nCPU,
        transferable: true,
        blob: blobUrl !== null
    };

    console.log('[worker_pool.js] ' + nWorkers + ' workers spectraux (' + nCPU + ' CPUs, 1 réservé rendu, ' + (blobUrl !== null ? 'blob' : 'fichier') + ')');

    // dispatch: répartit les nL lambdas sur nWorkers tranches équitables.
    // Chaque worker calcule sa tranche et transfère son Float32Array[nZ * sliceSize] au main thread.
    // Le main thread fusionne les tranches dans resultBuf[nZ * nL].
    // Retourne Promise<{resultBuf, sums: {CO2,H2O,CH4,clouds,CIA}, spectra: {CO2,H2O,CH4,clouds}}>.
    // `spectra` = la même attribution, résolue PAR LONGUEUR D'ONDE (worker v0.7.0).
    var dispatchPending = false;

    function dispatch(params, nZ, nL) {
        if (dispatchPending) {
            throw new Error('[worker_pool.js] dispatch concurrent : un calcul spectral est déjà en cours (2 boucles solveur en parallèle ?)');
        }
        dispatchPending = true;
        var sliceSize = Math.ceil(nL / nWorkers);
        var doneCount = 0;
        var activeWorkers = 0;
        var sums = { CO2: 0, H2O: 0, CH4: 0, clouds: 0, continuum: 0 };
        // Buffer de résultat final (flat, accumulé au fur et à mesure des réponses)
        var resultBuf = new Float32Array(nZ * nL);
        // Spectres d'attribution EDS (worker v0.7.0) : chaque tranche renvoie son morceau,
        // on les recolle ici à leur place absolue. Les totaux `sums` en sont la somme —
        // c'est bien la même grandeur qu'avant, sommée dans un autre ordre.
        var spectra = {
            CO2:    new Float64Array(nL),
            H2O:    new Float64Array(nL),
            CH4:    new Float64Array(nL),
            clouds: new Float64Array(nL),
            tStrates: new Float64Array(params.nStrates * nL)   // transmission de chaque couche de stratosphère [k·nL + j] (son équilibre radiatif)
        };

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
                        var bCO2 = new Float64Array(msg.blk_CO2);
                        var bH2O = new Float64Array(msg.blk_H2O);
                        var bCH4 = new Float64Array(msg.blk_CH4);
                        var bCld = new Float64Array(msg.blk_cld);
                        var tStr = new Float64Array(msg.t_strato);
                        for (var ks = 0; ks < params.nStrates; ks++) {
                            for (var js = 0; js < sliceNL; js++) spectra.tStrates[ks * nL + msg.jStart + js] = tStr[ks * sliceNL + js];
                        }
                        for (var jj = 0; jj < sliceNL; jj++) {
                            var ja = msg.jStart + jj;
                            spectra.CO2[ja]    = bCO2[jj];
                            spectra.H2O[ja]    = bH2O[jj];
                            spectra.CH4[ja]    = bCH4[jj];
                            spectra.clouds[ja] = bCld[jj];
                            sums.CO2    += bCO2[jj];
                            sums.H2O    += bH2O[jj];
                            sums.CH4    += bCH4[jj];
                            sums.clouds += bCld[jj];
                        }
                        sums.continuum += msg.sum_blocked_cont;
                        doneCount++;
                        if (doneCount === activeWorkers) {
                            dispatchPending = false;
                            resolve({ resultBuf: resultBuf, sums: sums, spectra: spectra });
                        }
                    } else if (msg.type === 'sliceError') {
                        dispatchPending = false;
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
                    // Tables σ[iT·nP + iP][λ] : chaque ligne (température, pression) est découpée sur la même tranche λ.
                    nP:                params.nP,
                    sigma_CO2:         params.sigma_CO2.map(function (r) { return r.slice(jStart, jEnd); }),
                    sigma_H2O:         params.sigma_H2O.map(function (r) { return r.slice(jStart, jEnd); }),
                    sigma_CH4:         params.sigma_CH4.map(function (r) { return r.slice(jStart, jEnd); }),
                    sigma_O3:          params.sigma_O3.map(function (r) { return r.slice(jStart, jEnd); }),
                    sigma_N2O:         params.sigma_N2O.map(function (r) { return r.slice(jStart, jEnd); }),
                    cont_self:         params.cont_self.map(function (r) { return r.slice(jStart, jEnd); }),
                    cont_foreign:      params.cont_foreign.map(function (r) { return r.slice(jStart, jEnd); }),
                    cia_CO2:           params.cia_CO2.map(function (r) { return r.slice(jStart, jEnd); }),
                    earth_flux:        params.earth_flux.slice(jStart, jEnd),
                    // Données z partagées (toutes les couches, lecture seule, petites ~50 couches)
                    layers:              params.layers,
                    i_trop:              params.i_trop,
                    nStrates:            params.nStrates,
                    effective_delta_lambda: params.effective_delta_lambda,
                    diffusivite:         params.diffusivite,
                    T_surf:              params.T_surf,
                    constants:           params.constants
                });
                // Note : pas de Transferable sur les .slice() → ce sont des copies JS Array normales.
                // Seul le résultat (Float32Array buf) revient en Transferable depuis le worker.
            });

            if (activeWorkers === 0) {
                dispatchPending = false;
                resolve({ resultBuf: resultBuf, sums: sums, spectra: spectra });
            }
        });
    }

    window.spectralWorkerPool = {
        ready: true,
        nWorkers: nWorkers,
        dispatch: dispatch
    };
}());
