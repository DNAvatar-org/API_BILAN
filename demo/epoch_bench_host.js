// File: API_BILAN/demo/epoch_bench_host.js
// Desc: Contrat hote minimal attendu par le moteur : window.ORG, SYNC_STATE, ABORT_COMPUTE.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';


/**
 * Bench ne charge pas CO2/organigramme/organigramme.js : CONVERGE / RADIATIVE appellent
 * window.ORG.updateFluxLabels en cycleCalcul. Contrat host complet : assignation explicite,
 * pas de branche typeof sur ORG dans l’API pour cette page isolée.
 */
window.ORG = {
    updateFluxLabels: function () {},
    updateLabel: function () {}
};

window.SYNC_STATE = window.SYNC_STATE || {
    epochId: '\u26ab', animEnabled: false, ticTime: 0, calculationInProgress: false
};
window.ABORT_COMPUTE = false;
