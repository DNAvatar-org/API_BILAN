// File: API_BILAN/config/model_tuning.js - [DEPRECATED, voir initDATA.js]
// Desc: En français, dans l'architecture, je suis un fichier vide conservé pour rétro-compat des
//       `<script src="...model_tuning.js">` dans search.html / search_gauges_backup.html.
//       Les defaults ont été déplacés vers API_BILAN/data/initDATA.js :
//         window.DEFAULT.TUNING.{baryByGroup, CLOUD_SW, SOLVER, HYSTERESIS, RADIATIVE}
//         window.DEFAULT.BOUNDS.HYSTERESIS
//       DATA['🎚️'] = clone(window.DEFAULT.TUNING) est la seule source live lue par la physique.
// Version 2.0.0
// Date: [April 18, 2026] [20:00 UTC+1]
// Logs:
// - v2.0.0: stub — contenu déplacé dans initDATA.js v1.1.0 (window.DEFAULT.TUNING + window.DEFAULT.BOUNDS). Fin de window.TUNING.
// - v1.0.1: TUNING.SOLVER = source unique SOLVER (6 clés). Fin DATA['🎚️'].SOLVER / CONFIG_COMPUTE.xxx dupliqués.
// - v1.0.0: extraction coefficients CLOUD SW + solveur depuis calculations_albedo.js / configTimeline.js
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
