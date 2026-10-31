// File: API_BILAN/api.js - Point d'entrée API calcul bilan radiatif
// Desc: API pure calcul (config + callback), utilisée par les bancs (epoch_bench, headless). Aucun DOM.
// Version 1.2.2
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: October 30, 2026
// Logs:
// - v1.2.2: la T initiale n'est posée que par calculateT0 (graine 📜🌡️🧮 du clic, ou T courante en tictime).
// - v1.2.1: l'époque se pose par 📜👉 (DATA['📅'] en est l'accesseur) ; snapshot sans la glace 0D retirée (τ, instantanés).

'use strict';

/** Semver BilanRadiatif / API_BILAN : console, bench, bandeau visu (#title-app-version). */
window.BILAN_VISU_APP_VERSION = '1.1.0';

/**
 * API Bilan Radiatif : entrée config, sortie via callback(event, payload).
 * Events : 'convergenceStep' | 'cycleCalcul' | 'ProcessFinished'. Singleton : le dernier callback donné gagne.
 */
function BilanRadiatifAPI(callback) {
    const existing = window.__BILAN_RADIATIF_API_SINGLETON__;
    if (existing) {
        existing.callback = callback;
        return existing;
    }
    this.callback = callback;
    window.__BILAN_RADIATIF_API_SINGLETON__ = this;
}

/**
 * Prépare un calcul SANS converger : époque, mode, réglage, masses, T initiale, remises à zéro du solveur,
 * initForConfig (date, Soleil, intérieur, composition, eau, albédo). C'est l'état « d'où l'on part ».
 * @param {{epochId: string, animEnabled: boolean, tuning?: object}} config
 *   animEnabled:false = clic sur la frise (T init = graine 🌡️🧮) ; true = tictime (T init = T courante).
 * @returns {boolean} false si interrompu (window.ABORT_COMPUTE)
 */
BilanRadiatifAPI.prototype.prepare = function (config) {
    const DATA = window.DATA;
    const EP = window.TIMELINE.find(function (item) { return item['📅'] === config.epochId; });
    DATA['📜']['👉'] = window.TIMELINE.indexOf(EP);   // l'époque courante : DATA['📅'] (accesseur)
    DATA['📜']['🗿'] = EP['📅'];                      // son nom, pour l'interface
    window.SYNC_STATE.animEnabled = config.animEnabled;
    if (config.tuning) window.TUNING.applyTuningPayload(config.tuning);
    window.COMPUTE.getMasses();
    DATA['🧮']['previous'] = [];
    DATA['🧮']['🧮🔄🌊'] = 0;
    DATA['🧮']['🧮🔄🪩'] = 0;
    return window.CONVERGE.initForConfig();
};

/**
 * Prépare puis converge. LE point d'entrée de tout calcul (bancs, visu, scie).
 * Le callback (constructeur) reçoit 'convergenceStart' | 'convergenceStep' | 'convergenceRefresh' |
 * 'cycleCalcul' (attendu : peut rendre une promesse) | 'ProcessFinished'.
 * @returns {Promise<true|null>} null si interrompu (window.ABORT_COMPUTE)
 */
BilanRadiatifAPI.prototype.run = async function (config) {
    const DATA = window.DATA;
    const debug = window.UI_STATE.debugAPI;
    if (debug) console.groupCollapsed('[API_BILAN] run', config.epochId, 'anim=', config.animEnabled);
    window.SYNC_STATE.calculationInProgress = true;
    let result = null;
    if (this.prepare(config)) {   // false = interrompu
        result = await window.CONVERGE.computeRadiativeTransfer(this.callback);
    }
    window.SYNC_STATE.calculationInProgress = false;
    if (debug) {
        console.log('[API_BILAN] ProcessFinished', 'status=', DATA['🧮']['🧮🛑'], 'result=', result);
        console.groupEnd();
    }
    this.callback('ProcessFinished', { DATA: DATA, result: result });
    return result;
};

/**
 * Instantané plat de l'état de calibration (T, glace, déséquilibre radiatif, traps).
 * Lecture pure de DATA, aucun calcul. À appeler après un run.
 */
BilanRadiatifAPI.prototype.snapshot = function () {
    const D = window.DATA;
    return {
        epochId: D['📅']['📅'],
        epochIdx: D['📜']['👉'],
        phase: D['🧮']['🧮⚧'],
        status: D['🧮']['🧮🛑'],
        T_C: D['🧮']['🧮🌡️'] - window.CONST.T0_WATER,
        T_seed_C: D['📜']['🌡️🧮'] - window.CONST.T0_WATER,
        ice: {
            mass_now: D['💧']['🍰💧🧊'],
            surf_now: D['🪩']['🍰🪩🧊'],
            calottes_kg: D['🗻']['⚖️🗻🧊']
        },
        albedo: {
            planetary: D['🪩']['🍰🪩📿'],
            cloud_cover: D['🪩']['🍰🪩⛅']
        },
        flux: {
            solar_in: D['🧲']['🧲☀️🔽'],
            olr_out: D['🧲']['🧲🌈🔼'],
            delta: D['🧲']['🔺🧲']
        },
        traps: {
            total: D['📛']['🧲📛'],
            co2: D['📛']['🧲📛🏭'],
            h2o: D['📛']['🧲📛💧'],
            ch4: D['📛']['🧲📛🐄'],
            cloud: D['📛']['🧲📛⛅']
        },
        masses: {
            atm: D['⚖️']['⚖️🫧'],
            co2: D['⚖️']['⚖️🏭'],
            ch4: D['⚖️']['⚖️🐄'],
            h2o: D['⚖️']['⚖️💧']
        }
    };
};

/** Run + snapshot. Usage console : `await api.runDiag('🚂')`. */
BilanRadiatifAPI.prototype.runDiag = async function (epochId) {
    const result = await this.run({ epochId: epochId, animEnabled: false });
    return { snapshot: this.snapshot(), result: result };
};

window.BilanRadiatifAPI = BilanRadiatifAPI;
/** @returns {BilanRadiatifAPI} même instance que tout `new BilanRadiatifAPI(...)` */
window.getBilanRadiatifAPI = function (callback) {
    return new BilanRadiatifAPI(callback);
};
