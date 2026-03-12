// File: API_BILAN/event_bus.js - Bus d'événements API ↔ rendus
// Desc: Canal pub/sub moteur ↔ UI. Expose window.IO_LISTENER (on/off/emit). Source unique : DATA.
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-03-08
// Logs:
// - v1.1: events par ID, handlers lisent DATA
// - v1.2.0: déplacé dans API_BILAN (contrat émis par l'API)
// - v1.2.1: log emit (nom, nb listeners, clés payload) ; appels 100 % synchrones (forEach)
// - v1.2.2: log liste des listeners (f.name ou anon#i)
// - v1.2.3: on(name, fn, label) optionnel ; stockage { fn, label } ; log affiche label ou fn.name ou anon#i
//
// Events émis par l'API (payload minimal ou vide, handlers lisent window.DATA) :
// - configLoaded  : config chargée
// - cycleAlbedo   : cycle albédo terminé
// - cycleH2O      : cycle H2O terminé
// - cycleCalcul   : calcul radiatif (dichotomie) — refresh organigramme depuis DATA
// - compute:progress : progression (iteration, T0, total_flux, phase)
// - compute:done  : calcul terminé (payload.DATA, payload.result)
// - ProcessFinished : processus complet terminé
// Events émis par l'UI : sync:state, sync:tuning

(function () {
    'use strict';
    // listeners[eventName] = [ { fn, label }, ... ] — tableau par type d'événement, appelés en sync dans l'ordre
    const listeners = {};
    window.IO_LISTENER = {
        on: function (name, fn, label) {
            if (!listeners[name]) listeners[name] = [];
            listeners[name].push({ fn: fn, label: (label != null && label !== '') ? String(label) : '' });
        },
        off: function (name, fn) {
            if (!listeners[name]) return;
            listeners[name] = listeners[name].filter(function (item) { return item.fn !== fn; });
        },
        emit: function (name, payload) {
            var list = listeners[name];
            if (!list || list.length === 0) return;
            var payloadHint = (payload && typeof payload === 'object' && !Array.isArray(payload))
                ? Object.keys(payload).slice(0, 6).join(', ') : '';
            var labels = list.map(function (item, i) {
                return item.label || item.fn.name || '(anon#' + (i + 1) + ')';
            }).join(', ');
            console.log('[IO_LISTENER] emit', name, '=>', payloadHint ? '(' + payloadHint + ')' : '()', '→', '[' + labels + ']');
            list.forEach(function (item) {
                try { item.fn(payload); } catch (e) { console.error('[IO_LISTENER]', name, e); }
            });
        }
    };
})();
