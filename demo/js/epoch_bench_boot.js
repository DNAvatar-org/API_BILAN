// File: API_BILAN/demo/epoch_bench_boot.js
// Desc: Amorce : drapeaux ?debugAPI / ?debugBench, et chemin du worker spectral resolu depuis demo/.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

(function syncDebugAPIFromURL() {
    try {
        var q = new URLSearchParams(window.location.search);
        if (q.get('debugAPI') === 'true' || q.get('debugAPI') === '1') {
            window.UI_STATE = window.UI_STATE || {};
            window.UI_STATE.debugAPI = true;
        }
        if (q.get('debugBench') === 'true' || q.get('debugBench') === '1') {
            window.DEBUG_BENCH_LOG = true;
            if (window.DEBUG && window.DEBUG.setTopic) window.DEBUG.setTopic('bench');
        }
    } catch (e) { }
})();
window.__EPOCH_BENCH_PAGE__ = true;
/* Worker spectral : le document vit dans demo/, pas dans CO2/ ; sans ceci, ../API_BILAN/workers/ pointerait hors API_BILAN. */
window.__SPECTRAL_WORKER_SCRIPT__ = new URL('../workers/spectral_slice_worker.js', window.location.href).href;
