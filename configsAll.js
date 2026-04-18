// File: API_BILAN/configsAll.js - STUB (bundle retiré)
// Desc: En français, dans l'architecture, j'étais un bundle manuel (concat) qui tombait en désynchro avec
//       les sources. Depuis v1.2.0, je ne suis plus qu'un stub : charger les 6 sources séparément
//       (ordre : model_tuning_biblio, configTimeline, alphabet, dico, initDATA, fine_tuning_bounds).
//       Si ce fichier est chargé seul (les 6 sources pas encore incluses), crash visible voulu (crash-first).
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [April 18, 2026] [21:00 UTC+1]
// Logs:
// - v1.2.0: STUB — retrait complet du bundle (crash-first via désynchro bundle/sources impossibles). Les HTML chargent directement model_tuning_biblio.js / configTimeline.js / alphabet.js / dico.js / initDATA.js / fine_tuning_bounds.js. SOLVER = source unique window.CONFIG_COMPUTE (plus de DATA['🎚️'].SOLVER ni DEFAULT.TUNING.SOLVER).
// - v1.1.0: window.DEFAULT.TUNING (source unique defaults) + window.DEFAULT.BOUNDS.HYSTERESIS ; DATA['🎚️'] = clone(DEFAULT.TUNING). Retrait window.TUNING.
// - v1.0.x: historique bundle manuel (voir git log).

// Stub : aucun code actif. Les HTML doivent charger les 6 sources listées ci-dessus.
// Si ce fichier est chargé seul, les lecteurs downstream planteront visiblement (crash-first).
console.info('[configsAll.js] STUB v1.2.0 — bundle retiré. Sources séparées attendues.');
