// File: API_BILAN/demo/demo_host.js
// Desc: Le contrat que le moteur attend de sa page d'accueil, pour une page SANS interface (banc époques, scie
//       démo, banc headless). Une page de CO2 le remplit avec ses vrais objets (organigramme, shell, journal
//       fichier). Ici, des coquilles vides, assignées explicitement : le moteur appelle ces fonctions sans
//       jamais tester leur présence. Chargé AVANT le moteur (BILAN_LOADER, opts.before).
//       Ne fait plus partie du contrat : epochName (défini par le moteur, data/alphabet.js).
// Version 1.2.0
// Date: 2026-10-12
// Logs:
// - v1.2.0: le moteur ne parle plus que par le callback de api.run : ORG, isVisuPanelActive et displayConvergence
//   ne font plus partie du contrat. Restent SYNC_STATE, le miroir de journal et ABORT_COMPUTE.
// - v1.1.0: fichier unique des stubs hôtes (le banc headless avait sa copie inline) ; + displayConvergence,
//   debugMirrorConfigLogToFile ; plus de `x = x || {}`.
// - v1.0.1 — 2026-10-10 : + isVisuPanelActive (mode Tictimes du banc : 1 seule iteration par clic sans lui)
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

// Pas de journal fichier hors CO2 (logs_to_server.js) : logDiag a déjà écrit en console.
window.debugMirrorConfigLogToFile = function () {};
