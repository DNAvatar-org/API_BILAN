// File: API_BILAN/workers/spectral_slice_worker.js - Tranche spectrale pour parallélisation (découpage bande λ)
// Desc: Tranche (lambda_range, layers) → transfert radiatif → Float32Array transféré au main (Transferable, zero-copy).
// Version 0.13.1
// - v0.13.1 (2026-10-13): ch4_eds_scale retiré (toujours 1).
// - v0.13.0 (2026-10-13): CIA CO₂–CO₂ MESURÉE (HITRAN 2024), tables k(λ, T) comme σ.
// - v0.12.0 (2026-10-13): terme CIA CO₂ (profil inventé ×100) retiré.
// - v0.11.0 (2026-10-13): facteur de diffusivité D (EARTH.DIFFUSIVITE, 1,66) : transmission d'un flux exp(−D·τ).
// - v0.10.0 (2026-10-12): τ nuage par couche (L.tauNuage) au lieu d'un τ uniforme sous la tropopause.
// - v0.9.0 (2026-10-12): σ interpolée en T par couche (tables), continuum H₂O, élargissement H₂O propre.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: [September 18, 2026]
// Logs:
// - v0.8.0 (2026-10-10): PAS DE GARDES. runSlice et runSliceShared supprimés (le pool n'envoie que
//   'slice_transfer' : deux copies mortes du même transfert radiatif) ; planck et les échelles CH4 / CIA sans
//   replis ni tests de finitude.
// - v0.6.0 Corps encapsulé dans spectralSliceWorkerMain(). Chargé comme worker → il s'exécute ; chargé comme
//   <script> par une page → il se publie dans window.__SPECTRAL_WORKER_MAIN__, ce qui permet à worker_pool.js
//   d'en faire un Blob. C'est le SEUL chemin possible en file:// : Chrome refuse new Worker('file://…')
//   (origine 'null') et importScripts d'un file://, mais accepte un blob:. Code de calcul inchangé.
// - v0.7.0 runSliceTransfer : l'attribution EDS devient un SPECTRE. Les quatre scalaires
//   sum_blocked_{CO2,H2O,CH4,clouds} deviennent quatre Float64Array(nL) accumulés par λ et
//   renvoyés en Transferable. Les totaux se retrouvent en sommant côté pool — mêmes nombres.
//   ⚠️ runSlice et runSliceShared n'ont PAS été changés : le pool n'envoie que 'slice_transfer'.
// - v0.5.0 ch4_eds_scale (Haqq-Misra 2008) appliqué sur kappa_CH4 dans les 3 fonctions (runSlice / runSliceShared / runSliceTransfer). Défaut 1.0 si param absent ou non-fini.
// - v0.4.1 Retrait guards abusifs (Number.isFinite, != null, || fallbacks) dans runSliceShared/Transfer (regle-js-crash)
// - v0.4.0 Add slice_transfer message type: Transferable Float32Array (compatible prod, sans headers COOP/COEP)
// - v0.3.0 Add slice_shared message type: write upward_flux directly into SharedArrayBuffer (zero-copy result)
// - v0.2.0 constantes depuis payload (CONST côté main), plus de doublon


/**
 * Corps du worker. Une seule source, deux usages :
 *   • dans un Worker  → self.onmessage est posé, le worker écoute (appel immédiat plus bas) ;
 *   • dans une page   → publié sur window, worker_pool.js en fait un Blob (seul chemin possible en file://).
 */
function spectralSliceWorkerMain() {
    'use strict';

    function planck(lambda, T, cst) {
        var h = cst.PLANCK_H, c = cst.SPEED_OF_LIGHT, k = cst.BOLTZMANN_KB, cap = cst.MAX_PLANCK_SAFE;
        var term1 = (2 * h * c * c) / Math.pow(lambda, 5);
        var term2 = Math.exp((h * c) / (lambda * k * T)) - 1;
        return Math.min(term1 / term2, cap);   // même loi que PHYS.planckFunction (le worker n'a pas window)
    }

    var TAU_EFF_MIN = 0;
    var TAU_EFF_MAX = 700;
    var MAX_FLUX_PER_BAND = 1e15;

    // runSliceTransfer : écrit dans un Float32Array local
    // puis transfère l'ownership au main thread (Transferable, zero-copy, sans SharedArrayBuffer).
    // Layout: resultBuf[i * nL + j] pour la tranche de taille nL = jEnd - jStart.
    function runSliceTransfer(p) {
        var cstUse = p.constants;
        var lambda_range = p.lambda_range;
        var lambda_weights = p.lambda_weights;
        // Tables σ[iT][j] (m²/molécule) sur la grille de températures ; chaque couche porte iT, wT.
        var sigma_CO2 = p.sigma_CO2;
        var sigma_H2O = p.sigma_H2O;
        var sigma_CH4 = p.sigma_CH4;
        var continuum_H2O = p.continuum_H2O;   // C_s(ν, 296 K) [cm²/molécule/atm], Roberts 1976
        var cia_CO2 = p.cia_CO2;               // k(λ, T) [cm⁵/molécule²], HITRAN CIA CO₂–CO₂ (tables par T, comme σ)
        var earth_flux = p.earth_flux;
        var layers = p.layers;
        var i_trop = p.i_trop;
        var effective_delta_lambda = p.effective_delta_lambda;
        var D = p.diffusivite;   // flux isotrope : transmission exp(−D·τ_vertical) (EARTH.DIFFUSIVITE, Elsasser)
        var nL = lambda_range.length;
        var nZ = layers.length;
        // Float32Array local : transféré (zero-copy) après calcul
        var resultBuf = new Float32Array(nZ * nL);
        var flux_in = earth_flux.slice();
        // Attribution EDS PAR LONGUEUR D'ONDE (v0.6.0). C'étaient quatre scalaires ; ce sont
        // maintenant quatre spectres, sommés sur les couches mais pas sur λ. Les totaux se
        // retrouvent en sommant à la fin — mêmes nombres, à l'ordre d'addition près.
        // Coût : on remplace 4 `+=` scalaires par 4 `+=` sur Float64Array dans la boucle interne,
        // et 4 allocations de nL par tranche. Pas d'accumulateur supplémentaire.
        // Sert à deux choses : voir DANS QUELLE BANDE chaque gaz piège (le spectre d'émission
        // affiche la part d'EDS par intervalle) et diagnostiquer les nuages, dont le piégeage
        // ne vit que dans la fenêtre 8-12 µm et se noyait dans un scalaire.
        var blk_CO2 = new Float64Array(nL), blk_H2O = new Float64Array(nL);
        var blk_CH4 = new Float64Array(nL), blk_cld = new Float64Array(nL);
        var sum_blocked_cont = 0;

        for (var i = 0; i < nZ; i++) {
            var L = layers[i];
            var n_air = L.n_air, n_CO2 = L.n_CO2, n_H2O = L.n_H2O, n_CH4 = L.n_CH4;
            var T = L.T;
            var delta_z_real = L.delta_z_real;
            var sigma_broad = L.pressureBroadening;
            var sigma_broad_H2O = L.pressureBroadeningH2O;
            var a = L.iT, w = L.wT;
            var sC0 = sigma_CO2[a], sC1 = sigma_CO2[a + 1];
            var sH0 = sigma_H2O[a], sH1 = sigma_H2O[a + 1];
            var sM0 = sigma_CH4[a], sM1 = sigma_CH4[a + 1];
            var cC0 = cia_CO2[a], cC1 = cia_CO2[a + 1];
            var nCO2cm3 = n_CO2 * 1e-6;                  // [molécules/cm³]
            var cont_layer = L.continuum;
            var is_trop = (i < i_trop);
            var tau_cloud_layer = L.tauNuage;   // nuages de la couche (profilAtmosphere, Ackerman & Marley 2001)

            for (var j = 0; j < nL; j++) {
                var lambda = lambda_range[j];
                var kappa_CO2 = (sC0[j] + w * (sC1[j] - sC0[j])) * sigma_broad * n_CO2;
                var kappa_H2O = (sH0[j] + w * (sH1[j] - sH0[j])) * sigma_broad_H2O * n_H2O;
                var kappa_CH4 = (sM0[j] + w * (sM1[j] - sM0[j])) * sigma_broad * n_CH4;
                var kappa_cont = continuum_H2O[j] * cont_layer;   // continuum H₂O, m⁻¹
                // CIA CO₂–CO₂ : κ [cm⁻¹] = k·n², ×100 → m⁻¹. Comptée avec le CO₂ (attribution EDS).
                var kappa_CIA = (cC0[j] + w * (cC1[j] - cC0[j])) * nCO2cm3 * nCO2cm3 * 100;
                var kappa = kappa_CO2 + kappa_CIA + kappa_H2O + kappa_CH4 + kappa_cont;
                var tau = Math.min(Math.max(D * (kappa * delta_z_real + tau_cloud_layer), TAU_EFF_MIN), TAU_EFF_MAX);
                var transmission = Math.exp(-tau);
                var emissivity = 1 - transmission;
                var has_absorption = (n_CO2 > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10) || (tau_cloud_layer > 1e-10);
                var upval;
                if (!has_absorption) {
                    upval = Math.min(Math.max(flux_in[j], -MAX_FLUX_PER_BAND), MAX_FLUX_PER_BAND);
                } else {
                    var em_flux = emissivity * Math.PI * planck(lambda, T, cstUse) * effective_delta_lambda * lambda_weights[j];
                    var out = flux_in[j] * transmission + em_flux;
                    upval = Math.min(Math.max(out, -MAX_FLUX_PER_BAND), MAX_FLUX_PER_BAND);
                    blk_CO2[j] += flux_in[j] * (1 - Math.exp(-Math.max(0, D * (kappa_CO2 + kappa_CIA) * delta_z_real)));
                    blk_H2O[j] += flux_in[j] * (1 - Math.exp(-Math.max(0, D * (kappa_H2O + kappa_cont) * delta_z_real)));
                    sum_blocked_cont += flux_in[j] * (1 - Math.exp(-Math.max(0, D * kappa_cont * delta_z_real)));
                    blk_CH4[j] += flux_in[j] * (1 - Math.exp(-Math.max(0, D * kappa_CH4 * delta_z_real)));
                    blk_cld[j] += flux_in[j] * (1 - Math.exp(-D * tau_cloud_layer));
                }
                resultBuf[i * nL + j] = upval;
                flux_in[j] = upval;
            }
        }
        // Transférer l'ownership des buffers (zero-copy : le worker perd l'accès après postMessage)
        self.postMessage({
            type: 'sliceTransferDone',
            id: p.id,
            buf: resultBuf.buffer,
            jStart: p.jStart,
            jEnd: p.jEnd,
            // Spectres d'attribution de la tranche (index local 0..jEnd-jStart-1)
            blk_CO2: blk_CO2.buffer,
            blk_H2O: blk_H2O.buffer,
            blk_CH4: blk_CH4.buffer,
            blk_cld: blk_cld.buffer,
            sum_blocked_cont: sum_blocked_cont
        }, [resultBuf.buffer, blk_CO2.buffer, blk_H2O.buffer, blk_CH4.buffer, blk_cld.buffer]);
    }

    self.onmessage = function (e) {
        var msg = e.data;   // le pool n'envoie que 'slice_transfer'
        try {
            runSliceTransfer(msg); // postMessage avec Transferable est dans runSliceTransfer
        } catch (err) {
            // Transport de l'erreur vers le thread principal (worker_pool la rejette) : rien n'est avalé.
            self.postMessage({ type: 'sliceError', id: msg.id, error: String(err) });
        }
    };
}

// Dans un Worker, self n'est pas window : on démarre. Dans une page, on se contente de se publier.
if (typeof window !== 'undefined' && typeof self !== 'undefined' && self === window) {
    window.__SPECTRAL_WORKER_MAIN__ = spectralSliceWorkerMain;
} else {
    spectralSliceWorkerMain();
}
