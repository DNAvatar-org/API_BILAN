// File: API_BILAN/demo/demo_host.js
// Desc: Le contrat que le moteur attend de sa page d'accueil, tenu ici par le strict minimum.
//       Une page de CO2 le remplit sans y penser : l'organigramme fournit ORG, le shell tient
//       SYNC_STATE. Une page de demo n'a ni l'un ni l'autre, et le moteur, lui, appelle quand
//       meme ORG.updateFluxLabels a chaque cycle et lit SYNC_STATE.animEnabled dans calculateT0.
//       D'ou ces coquilles vides : assignation explicite, pour qu'aucun typeof defensif n'ait a
//       polluer l'API a cause des pages isolees.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.ORG = window.ORG || {
    updateFluxLabels: function () {},
    updateLabel: function () {}
};

window.SYNC_STATE = window.SYNC_STATE || {
    epochId: '⚫', animEnabled: false, ticTime: 0, calculationInProgress: false
};

window.ABORT_COMPUTE = false;
