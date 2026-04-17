// File: API_BILAN/api.js - Point d'entrée API calcul bilan radiatif
// Desc: API pure calcul (config + callback). Chargeable dans index, visu_ ou scie_. Pas de DOM/rendu.
// Version 1.0.7
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-25
// Logs:
// - v1.0.7: debugAPI (?debugAPI=true ou window.debugAPI) → console.groupCollapsed sur run + fin ProcessFinished / erreur
// - v1.0.6: snapshot PRE_INIT/POST_INIT via pdTrace (pas pd)
// - v1.0.1 FUNC_API_BILAN, const MAJ en tête ; dossier renommé API_BILAN
// - v1.0.2 add pd() snapshots PRE_INIT/POST_INIT for API inputs
// - v1.0.3 crash-first on ⛄ after POST_INIT to trace call chain
// - v1.0.4 remove crash-trace; keep optional pd() snapshots
// - v1.0.5 singleton: new BilanRadiatifAPI / getBilanRadiatifAPI réutilisent la même instance

'use strict';

if (!window.FUNC_API_BILAN) window.FUNC_API_BILAN = {};
/**
 * Logs groupés (console) pour bench / diagnostic. Activer : ?debugAPI=true ou window.debugAPI = true.
 * @returns {boolean}
 */
window.FUNC_API_BILAN.isDebugAPI = function isDebugAPI() {
    if (typeof window === 'undefined') return false;
    if (window.debugAPI === true) return true;
    try {
        if (typeof location !== 'undefined' && location.search) {
            var v = new URLSearchParams(location.search).get('debugAPI');
            return v === 'true' || v === '1';
        }
    } catch (ex) { /* ignore */ }
    return false;
};

/**
 * API Bilan Radiatif : entrée config, sortie via callback (récepteur universel).
 * Le calcul est délégué aux modules déjà chargés (physics, calculations, calculations_flux, etc.).
 * Le callback reçoit (event, payload) et dispatch vers visu/scie selon le contexte.
 *
 * @param {function(string, object)} callback - Récepteur: callback(event, payload). Events: 'convergenceStep' | 'cycleCalcul' | 'ProcessFinished'
 */
function BilanRadiatifAPI(callback) {
    var existing = window.__BILAN_RADIATIF_API_SINGLETON__;
    if (existing) {
        if (typeof callback === 'function') existing.callback = callback;
        return existing;
    }
    this.callback = typeof callback === 'function' ? callback : function () {};
    window.__BILAN_RADIATIF_API_SINGLETON__ = this;
}

/** Identifiant d'époque par défaut de l'API (si aucun config ni epochId passé). */
var DEFAULT_EPOCH_ID = '⚫';

/**
 * Applique la config au contexte global (DATA, SYNC_STATE, etc.) puis lance le calcul.
 * Entrée : objet config { epochId?, animEnabled?, ticTime?, tuning? } OU un identifiant d'époque (string).
 * Si un identifiant seul est passé, c'est celui de l'API (paramètre) qui est pris ; sinon config.epochId ou défaut API.
 * Exécution asynchrone (Promise) ; le callback est appelé pendant l'exécution.
 *
 * @param {object|string} configOrEpochId - config complète ou identifiant d'époque (ex. '⚫')
 * @returns {Promise<object|null>} - Résultat du calcul (ou null si abort/erreur)
 */
BilanRadiatifAPI.prototype.run = function (configOrEpochId) {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    const SYNC_STATE = window.SYNC_STATE;
    const initForConfig = window.initForConfig;
    const computeRadiativeTransfer = window.computeRadiativeTransfer;
    var self = this;

    if (!DATA || !TIMELINE) {
        throw new Error('[BilanRadiatifAPI] DATA ou TIMELINE manquant — scripts non chargés');
    }

    var config = (typeof configOrEpochId === 'string' || typeof configOrEpochId === 'undefined')
        ? { epochId: configOrEpochId != null ? configOrEpochId : DEFAULT_EPOCH_ID }
        : (configOrEpochId || {});

    var epochId = config.epochId != null ? config.epochId : (SYNC_STATE && SYNC_STATE.epochId) || DEFAULT_EPOCH_ID;
    var idx = TIMELINE.findIndex(function (item) { return item['📅'] === epochId; });
    if (idx >= 0) {
        DATA['📅'] = TIMELINE[idx];
        if (!DATA['📜']) DATA['📜'] = {};
        DATA['📜']['👉'] = idx;
        DATA['📜']['🗿'] = epochId;
    }
    if (config.animEnabled !== undefined && SYNC_STATE) SYNC_STATE.animEnabled = config.animEnabled;
    if (config.ticTime !== undefined && SYNC_STATE) SYNC_STATE.ticTime = config.ticTime;
    if (config.tuning) window.applyTuningPayload(config.tuning);
    window.getEnabledStates();
    window.getMasses();
    if (config.animEnabled === false) {
        DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
    }

    var dbgRunOpen = false;
    function apiDebugCloseRun() {
        if (dbgRunOpen) {
            console.groupEnd();
            dbgRunOpen = false;
        }
    }
    if (window.FUNC_API_BILAN.isDebugAPI()) {
        console.groupCollapsed('[API_BILAN] run', String(epochId), 'anim=', config.animEnabled);
        dbgRunOpen = true;
    }

    function fmt3(n) { return n.toExponential(3); }
    function snap(tag) {
        const D = window.DATA;
        const S = window.STATE;
        const ep = D['📜']['🗿'];
        const i = D['📜']['👉'];
        const phase = D['🧮']['🧮⚧'];
        const T = D['🧮']['🧮🌡️'];
        const alb = D['🪩'] ? D['🪩']['🍰🪩📿'] : 0;
        const ice = D['🪩'] ? D['🪩']['🍰🪩🧊'] : 0;
        const oce = D['🪩'] ? D['🪩']['🍰🪩🌊'] : 0;
        const P = D['🫧'] ? D['🫧']['🎈'] : 0;
        const co2 = D['⚖️']['⚖️🏭'];
        const ch4 = D['⚖️']['⚖️🐄'];
        const h2o = D['⚖️']['⚖️💧'];
        const o2 = D['⚖️']['⚖️🫁'];
        const atm = D['⚖️']['⚖️🫧'];
        const lockW = (S && S.iceEpochFixedWaterState && S.iceEpochFixedWaterState.epochId === ep) ? S.iceEpochFixedWaterState.value : null;
        const lockA = (S && S.iceEpochFixedAlbedoState && S.iceEpochFixedAlbedoState.epochId === ep) ? S.iceEpochFixedAlbedoState.value : null;
        if (typeof window.pdTrace === 'function') window.pdTrace('api.run', 'api.js',
            tag
            + ' ep=' + ep + ' idx=' + i + ' phase=' + phase
            + ' T_C=' + (T - 273.15).toFixed(2) + ' T_K=' + fmt3(T)
            + ' P_atm=' + fmt3(P)
            + ' CO2=' + fmt3(co2) + ' CH4=' + fmt3(ch4) + ' H2O=' + fmt3(h2o) + ' O2=' + fmt3(o2) + ' atm=' + fmt3(atm)
            + ' ALB=' + fmt3(alb) + ' ICE=' + fmt3(ice) + ' OCE=' + fmt3(oce)
            + ' iceLockW=' + (lockW == null ? 'null' : fmt3(lockW))
            + ' iceLockA=' + (lockA == null ? 'null' : fmt3(lockA))
        );
    }

    DATA['🧮']['previous'] = [];
    DATA['🧮']['🧮🔄🌊'] = 0;
    DATA['🧮']['🧮🔄🪩'] = 0;
    window.h2oTotalFromMeteorites = 0;
    if (SYNC_STATE) SYNC_STATE.calculationInProgress = true;

    snap('PRE_INIT');
    if (!initForConfig()) {
        if (SYNC_STATE) SYNC_STATE.calculationInProgress = false;
        if (window.FUNC_API_BILAN.isDebugAPI()) {
            console.warn('[API_BILAN] initForConfig → false (run abandonné)');
        }
        apiDebugCloseRun();
        return Promise.resolve(null);
    }
    snap('POST_INIT');
    // NOTE: crash-trace retiré (debug uniquement)

    var callbackStack = window.FUNC_API_BILAN && window.FUNC_API_BILAN.callbackStack;
    var dispatcher = self.callback;
    if (callbackStack) {
        callbackStack.push(self.callback);
        dispatcher = function (event, payload) {
            callbackStack.run(event, payload);
        };
    }

    var computePromise = computeRadiativeTransfer(dispatcher);

    return computePromise.then(function (result) {
        const DATA = window.DATA;
        if (SYNC_STATE) SYNC_STATE.calculationInProgress = false;
        if (callbackStack) callbackStack.pop();
        if (window.FUNC_API_BILAN.isDebugAPI()) {
            var st = DATA && DATA['🧮'] ? DATA['🧮']['🧮🛑'] : null;
            console.log('[API_BILAN] ProcessFinished', 'status=', st, 'result=', result);
        }
        self.callback('ProcessFinished', { DATA: DATA, result: result });
        apiDebugCloseRun();
        return result;
    }).catch(function (e) {
        if (SYNC_STATE) SYNC_STATE.calculationInProgress = false;
        if (callbackStack) callbackStack.pop();
        if (window.FUNC_API_BILAN.isDebugAPI()) {
            console.error('[API_BILAN] compute rejection', e);
        }
        apiDebugCloseRun();
        throw e;
    });
};

window.FUNC_API_BILAN.BilanRadiatifAPI = BilanRadiatifAPI;
window.FUNC_API_BILAN.defaultEpochId = DEFAULT_EPOCH_ID;
window.BilanRadiatifAPI = BilanRadiatifAPI;
/** @returns {BilanRadiatifAPI} même instance que tout `new BilanRadiatifAPI(...)` */
window.getBilanRadiatifAPI = function (callback) {
    return new BilanRadiatifAPI(callback);
};
