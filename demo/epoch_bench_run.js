// File: API_BILAN/demo/epoch_bench_run.js
// Desc: Boucle du banc : parcourt la TIMELINE, fait converger chaque epoque, remplit la table.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

async function runAllEpochs() {
    var btn = document.getElementById('btn-run');
    var progressFill = document.getElementById('progress-fill');
    var progressLabel = document.getElementById('progress-label');
    btn.disabled = true;
    document.getElementById('results-body').innerHTML = '';

    var timeline = window.TIMELINE;
    if (!timeline || !timeline.length) {
        progressLabel.textContent = '\u274c TIMELINE non charg\u00e9';
        btn.disabled = false;
        return;
    }

    progressLabel.textContent = '0 / ' + timeline.length + ' epochs';

    benchLogFile('[benchRun@start] ' + JSON.stringify({ nEpochs: timeline.length, t: Date.now() }));

    // _logs/bench.txt — 1 ligne par époque, écrite après chaque api.run() (cf. fin de boucle).
    // Reset du fichier au démarrage du run pour ne pas mélanger les sessions de calibration.
    if (typeof window.logBenchReset === 'function') window.logBenchReset();
    if (typeof window.logBenchEpoch === 'function') {
        window.logBenchEpoch('# bench run start ' + new Date().toISOString() + '  nEpochs=' + timeline.length);
        window.logBenchEpoch('# columns: epochId | T_seed_C | T_conv_C | dT_C | delta_INIT_Wm2 | delta_FINAL_Wm2 | albedo_INIT | albedo_FIN | iceSurf_INIT | iceSurf_FIN | trapTot_INIT | trapCO2_INIT | trapH2O_INIT | trapCH4_INIT | trapTot_FIN | trapH2O_FIN | path');
    }

    var currentStep = null;
    var lastStep = null;
    var initStep = null;
    var finalStatus = null;
    var benchRadPathRef = { path: [] };

    var initSnapshot = null; // capture api.snapshot() au phase Init pour bench.txt
    function onEvent(event, payload) {
        if (event === 'convergenceStep') {
            if (payload.phase === 'Init' && payload.innerIter === -1 && !initStep) {
                initStep = payload;
                // Snapshot IMM\u00c9DIAT \u00e0 T_seed (avant toute it\u00e9ration Search/Dicho) \u2014 c'est ce point qui doit
                // matcher visu pour que la calibration soit d\u00e9terministe. Si bench et visu divergent ici,
                // la cause n'est pas le solveur mais l'\u00e9tat pr\u00e9-Search.
                try {
                    if (api && typeof api.snapshot === 'function') initSnapshot = api.snapshot();
                } catch (_) { initSnapshot = null; }
                if (typeof payload.temperature_C === 'number' && isFinite(payload.temperature_C)) {
                    benchRadPathRef.path.push(payload.temperature_C);
                }
                console.log('[bench] Init  \u0394Flux=' + (payload.delta_equilibre != null ? payload.delta_equilibre.toFixed(3) : '?')
                    + '  T=' + (payload.temperature_C != null ? payload.temperature_C.toFixed(2) : '?') + '\u00b0C');
            }
            if ((payload.phase === 'Search' || payload.phase === 'Dicho')
                && typeof payload.temperature_C === 'number') {
                lastStep = payload;
                if (isFinite(payload.temperature_C)) {
                    var prevT = benchRadPathRef.path[benchRadPathRef.path.length - 1];
                    if (prevT === undefined || Math.abs(prevT - payload.temperature_C) > 1e-5) {
                        benchRadPathRef.path.push(payload.temperature_C);
                    }
                }
            }
            if (typeof payload.temperature_C === 'number') currentStep = payload;
        } else if (event === 'ProcessFinished') {
            var snap = payload && payload.DATA && payload.DATA['\u{1F9EE}'];
            finalStatus = (snap && snap['\u{1F9EE}\u{1F6D1}']) || 'finished';
            if (!lastStep && currentStep) lastStep = currentStep;
            console.log('[bench] ProcessFinished  status=' + finalStatus
                + '  T=' + (lastStep && lastStep.temperature_C != null ? lastStep.temperature_C.toFixed(2) : '?') + '\u00b0C');
        }
    }

    var api = window.getBilanRadiatifAPI
        ? window.getBilanRadiatifAPI(onEvent)
        : new BilanRadiatifAPI(onEvent);

    var t0 = Date.now();

    for (var i = 0; i < timeline.length; i++) {
        var epoch = timeline[i];
        var epochId = epoch['\u{1F4C5}'];

        initStep = null; lastStep = null; currentStep = null; finalStatus = null;
        benchRadPathRef.path = [];
        window.ABORT_COMPUTE = false;

        createRow(epoch);

        progressLabel.textContent = (i + 1) + ' / ' + timeline.length + ' \u2014 ' + window.epochName(epochId);
        progressFill.style.width = ((i / timeline.length) * 100) + '%';

        console.log('[bench] \u2014\u2014 \u00c9poque ' + (i+1) + '/' + timeline.length + ' : ' + epochId + ' \u2014\u2014');

        if (window.DATA) {
            window.DATA['\u{1F4DC}'] = window.DATA['\u{1F4DC}'] || {};
            window.DATA['\u{1F4DC}']['\u{1F53A}\u{1F321}\ufe0f\u{1F4AB}'] = 0;
            window.DATA['\u{1F4DC}']['\u{1F4FF}\u{1F4AB}']   = 0;
        }

        var tEp = Date.now();
        console.log('[bench] api.run d\u00e9marrage', String(epochId));
        try {
            await api.run({ epochId: epochId, animEnabled: false });
        } catch (e) {
            finalStatus = 'crash: ' + e.message;
            console.error('[bench] ' + epochId, e);
        }

        if (!finalStatus) {
            var snapStatus = window.DATA && window.DATA['\u{1F9EE}'] && window.DATA['\u{1F9EE}']['\u{1F9EE}\u{1F6D1}'];
            finalStatus = snapStatus || 'finished';
        }
        console.log('[bench] api.run termin\u00e9', String(epochId), String(finalStatus),
            (Date.now() - tEp) + ' ms');
        if (!lastStep && currentStep) lastStep = currentStep;

        var tEpochInitC = (epoch['\u{1F321}\ufe0f\u{1F9EE}'] - 273.15);
        var radPathCopy = benchRadPathRef.path.slice();
        if (lastStep && typeof lastStep.temperature_C === 'number' && isFinite(lastStep.temperature_C)) {
            var lastP = radPathCopy[radPathCopy.length - 1];
            if (lastP === undefined || Math.abs(lastP - lastStep.temperature_C) > 1e-5) {
                radPathCopy.push(lastStep.temperature_C);
            }
        }
        window.__RAD_CAP_LAST_DBG__ = null;
        if (window.RADIATIVE && window.RADIATIVE.calculateRadiativeCapacities) {
            try { window.RADIATIVE.calculateRadiativeCapacities(); }
            catch (e) { console.error('[bench][' + epochId + '] calculateRadiativeCapacities threw', e); }
        } else {
            console.error('[bench][' + epochId + '] window.RADIATIVE.calculateRadiativeCapacities is NOT defined');
        }
        var __dbg = window.__RAD_CAP_LAST_DBG__;
        console.log('[bench][' + epochId + '] RAD_CAP dbg =', __dbg);
        if (__dbg && __dbg.firstBad) {
            try {
                console.log('[bench][' + epochId + '] RAD_CAP firstBad = ' + JSON.stringify(__dbg.firstBad));
            } catch (e) {
                console.log('[bench][' + epochId + '] RAD_CAP firstBad (obj) =', __dbg.firstBad);
            }
        } else if (__dbg) {
            console.log('[bench][' + epochId + '] RAD_CAP firstBad = null (aucune \u03b4\u03c4 non-finie ou n\u00e9gative d\u00e9tect\u00e9e)');
        }
        var D = window.DATA || {};
        var D_ATM = D['🫧'] || {};
        var D_H2O = D['💧'] || {};
        var D_ALB = D['🪩'] || {};
        var convAtmSnap = {
            co2Frac:  D_ATM['🍰🫧🏭'],
            ch4Frac:  D_ATM['🍰🫧🐄'],
            h2oFrac:  D_H2O['🍰🫧💧'],
            albedo:   D_ALB['🍰🪩📿'],
            Mair:     D_ATM['🧪'],
            capCO2IR: D_ATM['🍰🫧🏭🌈'],
            capH2OIR: D_ATM['🍰🫧💧🌈'],
            capSumIR: D_ATM['🍰🫧📿🌈']
        };
        var D_STAT = D['📊'] || {};
        var lrLen = (D_STAT.lambda_range) ? D_STAT.lambda_range.length : 0;
        var zrLen = (D_STAT.z_range) ? D_STAT.z_range.length : 0;
        console.log('[bench][' + epochId + '] CONV ATM raw'
            + ' CO2Frac(mass)=' + convAtmSnap.co2Frac
            + ' CH4Frac(mass)=' + convAtmSnap.ch4Frac
            + ' H2OFrac(mass)=' + convAtmSnap.h2oFrac
            + ' albedo=' + convAtmSnap.albedo
            + ' Mair=' + convAtmSnap.Mair
            + ' \u{1F308}CO2=' + convAtmSnap.capCO2IR
            + ' \u{1F308}H2O=' + convAtmSnap.capH2OIR
            + ' \u{1F308}\u03a3=' + convAtmSnap.capSumIR
            + ' lambda_range.len=' + lrLen
            + ' z_range.len=' + zrLen);
        updateRow(epochId, initStep, lastStep, finalStatus, tEpochInitC, epoch, radPathCopy, convAtmSnap);

        benchLogFile('[benchRun@epochDone] ' + JSON.stringify({
            epochId: String(epochId),
            finalStatus: String(finalStatus),
            ms: Date.now() - tEp,
            tSeedC: tEpochInitC,
            tFinC: (lastStep && typeof lastStep.temperature_C === 'number' && isFinite(lastStep.temperature_C))
                ? lastStep.temperature_C
                : null,
            radPathLen: radPathCopy.length
        }));

        // _logs/bench.txt : 1 ligne par époque comparant état INIT (T_seed, avant Search) vs FINAL (post-conv).
        // Diff visu vs bench : si initSnapshot.flux.delta diverge alors que ice/T sont identiques, la cause
        // n'est pas glace — chercher trapH2O / albedo / cloud / vapeur dans la diff.
        if (typeof window.logBenchEpoch === 'function' && api && typeof api.snapshot === 'function') {
            try {
                var snFin = api.snapshot();
                var snIni = initSnapshot; // capturé au phase Init via onEvent
                var f = function (v, p) { return (v == null || !isFinite(v)) ? '?' : v.toFixed(p); };
                var dT = (snFin.T_C != null && snFin.T_seed_C != null) ? (snFin.T_C - snFin.T_seed_C) : null;
                var pathStr = radPathCopy.map(function (x) { return (x == null || !isFinite(x)) ? '?' : x.toFixed(2); }).join('→');
                window.logBenchEpoch(
                    String(epochId)
                    + ' | ' + f(snFin.T_seed_C, 3)
                    + ' | ' + f(snFin.T_C, 3)
                    + ' | ' + f(dT, 3)
                    + ' | ' + f(snIni && snIni.flux && snIni.flux.delta, 3)
                    + ' | ' + f(snFin.flux && snFin.flux.delta, 3)
                    + ' | ' + f(snIni && snIni.albedo && snIni.albedo.planetary, 4)
                    + ' | ' + f(snFin.albedo && snFin.albedo.planetary, 4)
                    + ' | ' + f(snIni && snIni.ice && snIni.ice.surf_now, 5)
                    + ' | ' + f(snFin.ice && snFin.ice.surf_now, 5)
                    + ' | ' + f(snIni && snIni.traps && snIni.traps.total, 2)
                    + ' | ' + f(snIni && snIni.traps && snIni.traps.co2, 2)
                    + ' | ' + f(snIni && snIni.traps && snIni.traps.h2o, 2)
                    + ' | ' + f(snIni && snIni.traps && snIni.traps.ch4, 2)
                    + ' | ' + f(snFin.traps && snFin.traps.total, 2)
                    + ' | ' + f(snFin.traps && snFin.traps.h2o, 2)
                    + ' | ' + pathStr
                );
            } catch (e) {
                window.logBenchEpoch(String(epochId) + ' | LOG_ERROR | ' + (e && e.message ? e.message : String(e)));
            }
        }
    }

    var elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    progressFill.style.width = '100%';
    progressLabel.textContent = '\u2705 ' + timeline.length + ' \u00e9poques \u2014 ' + elapsed + ' s';
    btn.disabled = false;
    btn.textContent = '\u21ba Relancer';
    document.getElementById('footer-info').textContent =
        'Rapport g\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleString('fr-FR')
        + ' \u2014 ' + timeline.length + ' \u00e9poques en ' + elapsed + 's';

    benchLogFile('[benchRun@done] ' + JSON.stringify({
        nEpochs: timeline.length,
        elapsed_s: Number(elapsed)
    }));
}
