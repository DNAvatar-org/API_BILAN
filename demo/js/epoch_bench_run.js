// File: API_BILAN/demo/epoch_bench_run.js
// Desc: Boucle du banc, mode GRAINES : parcourt la TIMELINE, fait converger chaque epoque depuis sa
//       graine 🌡️🧮 (comme un clic sur la frise), remplit la table. Porte aussi ce que les deux modes
//       partagent : ecoute du solveur, mesure d'une convergence (benchMesurer), debut / fin de run.
//       Le mode TICTIMES (chaine de clics, T° conservee) est dans epoch_bench_chain.js.
// Version 2.0.2
// - v2.0.2: convAtmSnap.isccp = 🪩👁 (nuages vus d'en haut).
//   - v2.0.1: createRow reçoit la date de l'état (▶ pour une frise).
// Date: 2026-10-10
// logs :
//   - v2.0.0: PAS DE GARDES. Une erreur du moteur n'est plus attrapée pour devenir un statut « crash: » de
//     cellule (le run continuait, le crash passait inaperçu — c'est ainsi que le mode Tictimes a tourné à une
//     itération par clic) : elle arrête le run et s'affiche (benchCrash). Retirés : journaux de CO2
//     (logBenchEpoch / logBenchReset / benchLogFile, jamais chargés ici), snapshot Init qui ne servait qu'à eux,
//     try/catch autour de calculateRadiativeCapacities.
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

// État d'écoute d'une convergence : rempli par benchOnEvent, lu par benchMesurer.
var BENCH_RUN = {
    initStep: null,
    lastStep: null,
    currentStep: null,
    finalStatus: null,
    path: [],
    api: null            // posé par benchStart
};

function benchOnEvent(event, payload) {
    var R = BENCH_RUN;
    if (event === 'convergenceStep') {
        // Les pas CycleEau n'ont pas de température : seuls Init / Search / Dicho entrent dans le chemin.
        if (payload.phase === 'Init') {
            R.initStep = payload;
            R.path.push(payload.temperature_C);
            console.log('[bench] Init  ΔFlux=' + payload.delta_equilibre.toFixed(3) + '  T=' + payload.temperature_C.toFixed(2) + '°C');
        }
        if (payload.phase === 'Search' || payload.phase === 'Dicho') {
            R.lastStep = payload;
            if (Math.abs(R.path[R.path.length - 1] - payload.temperature_C) > 1e-5) R.path.push(payload.temperature_C);
        }
    } else if (event === 'ProcessFinished') {
        R.finalStatus = payload.DATA['\u{1F9EE}']['\u{1F9EE}\u{1F6D1}'];
        console.log('[bench] ProcessFinished  status=' + R.finalStatus + '  T=' + (payload.DATA['\u{1F9EE}']['\u{1F9EE}\u{1F321}\ufe0f'] - 273.15).toFixed(2) + '°C');
    }
}

/** Début de run : boutons ▶ bloqués, table vidée. Renvoie l'API branchée sur benchOnEvent. */
function benchStart(mode, nEpochs) {
    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-run-tic').disabled = true;
    document.getElementById('results-body').innerHTML = '';
    document.getElementById('progress-fill').style.width = '0%';
    console.log('[bench] run start', mode, nEpochs + ' époques');
    BENCH_RUN.api = window.getBilanRadiatifAPI(benchOnEvent);
    return BENCH_RUN.api;
}

/** Erreur du moteur : le run s'arrête, le message est affiché, l'erreur repart vers la console. */
function benchCrash(err) {
    document.getElementById('progress-label').textContent = '\u274c ' + err.message;
    document.getElementById('footer-info').textContent = '\u274c run interrompu \u2014 ' + err.message + ' (pile en console)';
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-run-tic').disabled = false;
    throw err;
}

/** Fin de run : boutons ▶ rendus, bilan dans la barre et le pied de page. */
function benchEnd(resume, t0) {
    var elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('progress-label').textContent = '✅ ' + resume + ' — ' + elapsed + ' s';
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-run-tic').disabled = false;
    document.getElementById('footer-info').textContent =
        'Rapport généré le ' + new Date().toLocaleString('fr-FR') + ' — ' + resume + ' en ' + elapsed + 's';
}

/**
 * Une convergence mesurée : lance api.run(runCfg), remplit la ligne rowKey (créée avant par createRow).
 * tRefC = T° de référence du Δ (graine en mode graines, T° d'arrivée en mode tictimes).
 * Renvoie la T° (°C) où le modèle se trouve après le calcul.
 */
async function benchMesurer(api, runCfg, rowKey, epoch, tRefC) {
    var R = BENCH_RUN;
    var epochId = epoch['\u{1F4C5}'];
    R.initStep = null; R.lastStep = null; R.finalStatus = null;
    R.path = [];
    window.ABORT_COMPUTE = false;

    const tEp = Date.now();
    console.log('[bench] api.run démarrage', epochId, 'anim=', runCfg.animEnabled);
    await api.run(runCfg);
    console.log('[bench] api.run terminé', epochId, R.finalStatus, (Date.now() - tEp) + ' ms');
    // Interrompu (⏭) avant le premier pas Search : la dernière T connue est celle de l'Init.
    if (R.lastStep === null) R.lastStep = R.initStep;
    const radPathCopy = R.path.slice();
    window.__RAD_CAP_LAST_DBG__ = null;
    window.RADIATIVE.calculateRadiativeCapacities();
    const dbg = window.__RAD_CAP_LAST_DBG__;
    if (dbg !== null && dbg.firstBad) console.log('[bench][' + epochId + '] RAD_CAP firstBad = ' + JSON.stringify(dbg.firstBad));

    var D = window.DATA;
    var D_ATM = D['🫧'];
    var D_H2O = D['💧'];
    var D_ALB = D['🪩'];
    var convAtmSnap = {
        co2Frac:  D_ATM['🍰🫧🏭'],
        ch4Frac:  D_ATM['🍰🫧🐄'],
        h2oFrac:  D_H2O['🍰🫧💧'],
        albedo:   D_ALB['🍰🪩📿'],
        Mair:     D_ATM['🧪'],
        capCO2IR: D_ATM['🍰🫧🏭🌈'],
        capH2OIR: D_ATM['🍰🫧💧🌈'],
        capSumIR: D_ATM['🍰🫧📿🌈'],
        isccp:    D_ALB['🪩👁']           // nuages vus d'en haut (simulateur ISCCP, fin de calcul)
    };
    updateRow(rowKey, epochId, R.initStep, R.lastStep, R.finalStatus, tRefC, epoch, radPathCopy, convAtmSnap);

    return api.snapshot().T_C;
}

/** ▶ Époques : chaque époque depuis sa graine 🌡️🧮 (clic sur la frise), sans tictime. */
async function runAllEpochs() {
    var timeline = window.TIMELINE;
    var progressFill = document.getElementById('progress-fill');
    var progressLabel = document.getElementById('progress-label');
    var api = benchStart('graines', timeline.length);
    var t0 = Date.now();

    for (var i = 0; i < timeline.length; i++) {
        var epoch = timeline[i];
        var epochId = epoch['\u{1F4C5}'];
        var tSeedC = epoch['\u{1F321}️\u{1F9EE}'] - 273.15;

        createRow(epoch, { rowKey: epochId, date: epoch['\u25b6'] });   // frise : l'état est daté de ▶
        progressLabel.textContent = (i + 1) + ' / ' + timeline.length + ' — ' + window.epochName(epochId);
        progressFill.style.width = ((i / timeline.length) * 100) + '%';
        console.log('[bench] —— Époque ' + (i + 1) + '/' + timeline.length + ' : ' + epochId + ' ——');

        window.CLICS.frise(epochId);
        await benchMesurer(api, { epochId: epochId, animEnabled: false }, epochId, epoch, tSeedC);
    }
    benchEnd(timeline.length + ' époques (graines)', t0);
}
