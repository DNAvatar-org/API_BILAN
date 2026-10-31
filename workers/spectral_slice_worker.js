// File: API_BILAN/workers/spectral_slice_worker.js - Tranche spectrale pour parallélisation (découpage bande λ)
// Desc: Tranche (lambda_range, layers) → transfert radiatif → Float32Array transféré au main (Transferable, zero-copy).
// Version 0.14.0
// - v0.14.0 (2026-10-30): σ à la (T, P) de la couche : tables σ[iT·nP + iP], ln σ linéaire en ln P (au lieu de σ·√(P/P₀)).
// - v0.13.2 (2026-10-24): commentaire des nuages — schéma de profilAtmosphere (Ackerman & Marley est rejeté).
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: [October 30, 2026]


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

    /** σ à la pression de la couche entre deux nœuds de pression, chacun déjà interpolé en T. */
    function enPression(s0, s1, v) {
        return Math.pow(s0, 1 - v) * Math.pow(s1, v);
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
        // Tables σ[iT·nP + iP][j] (m²/molécule) sur la grille de températures et de pressions ; chaque couche porte iT, wT (linéaire
        // en T) et iP, wP (ln σ linéaire en ln P : σ = σ₀^(1−wP)·σ₁^wP ; un σ nul, aucune raie dans la fenêtre, reste nul).
        var nP = p.nP;
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
            var a = L.iT, w = L.wT;
            var r = a * nP + L.iP, v = L.wP, rH = a * nP + L.iPH2O, vH = L.wPH2O;   // lignes (T bas, P bas) ; T haut : + nP
            var sC00 = sigma_CO2[r], sC01 = sigma_CO2[r + 1], sC10 = sigma_CO2[r + nP], sC11 = sigma_CO2[r + nP + 1];
            var sM00 = sigma_CH4[r], sM01 = sigma_CH4[r + 1], sM10 = sigma_CH4[r + nP], sM11 = sigma_CH4[r + nP + 1];
            var sH00 = sigma_H2O[rH], sH01 = sigma_H2O[rH + 1], sH10 = sigma_H2O[rH + nP], sH11 = sigma_H2O[rH + nP + 1];
            var cC0 = cia_CO2[a], cC1 = cia_CO2[a + 1];
            var nCO2cm3 = n_CO2 * 1e-6;                  // [molécules/cm³]
            var cont_layer = L.continuum;
            var is_trop = (i < i_trop);
            var tau_cloud_layer = L.tauNuage;   // nuages de la couche (profilAtmosphere : condensat adiabatique, Martin et al. 1994)

            for (var j = 0; j < nL; j++) {
                var lambda = lambda_range[j];
                var kappa_CO2 = enPression(sC00[j] + w * (sC10[j] - sC00[j]), sC01[j] + w * (sC11[j] - sC01[j]), v) * n_CO2;
                var kappa_H2O = enPression(sH00[j] + w * (sH10[j] - sH00[j]), sH01[j] + w * (sH11[j] - sH01[j]), vH) * n_H2O;
                var kappa_CH4 = enPression(sM00[j] + w * (sM10[j] - sM00[j]), sM01[j] + w * (sM11[j] - sM01[j]), v) * n_CH4;
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
