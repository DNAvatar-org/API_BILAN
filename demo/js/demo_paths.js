// File: API_BILAN/demo/demo_paths.js
// Desc: Chemins que le moteur ne peut pas deviner depuis une page de demo. Le pool de workers
//       resout par defaut ../API_BILAN/workers/ — vrai depuis un document de CO2/, faux depuis
//       API_BILAN/demo/, qui est deja dans l'API. A charger avant workers/worker_pool.js, qui
//       lit ce chemin a son evaluation.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.__SPECTRAL_WORKER_SCRIPT__ = new URL('../workers/spectral_slice_worker.js', window.location.href).href;
