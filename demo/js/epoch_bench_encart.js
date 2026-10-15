// File: API_BILAN/demo/js/epoch_bench_encart.js
// Desc: Les actions du banc selon où il tourne — choisies UNE fois (même test que html.encart, epoch_bench_loader.js) :
//         · page autonome : le moteur de la page tourne les boucles (epoch_bench_run.js, epoch_bench_chain.js) ;
//         · encart (onglet Bench de l'index) : le banc n'est qu'un flag — ▶ demande à l'index de lancer
//           (CO2/static/ui/bench_pilote.js, window.BENCH.suite = 'epoque' | 'tictime'), l'index fait de VRAIS clics
//           (organigramme, frise) et renvoie une ligne par calcul, que la table affiche (createRow / updateRow).
// Version 1.1.1
// - v1.1.1: la date de la ligne vient de l'index (ligne.date).
// - v1.1.0: BENCH_ACTIONS.voir — clic sur l'époque d'une ligne → l'index recharge l'état de ce calcul.
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** Début de run dans l'encart : boutons ▶ bloqués, table vidée (comme benchStart, sans moteur local). */
function benchDebutEncart(mode) {
    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-run-tic').disabled = true;
    document.getElementById('results-body').innerHTML = '';
    document.getElementById('progress-fill').style.width = '0%';
    window.parent.postMessage({ type: 'bench:lancer', mode: mode }, '*');
}

const BENCH_ACTIONS = window.parent === window
    ? {
        epoque: function () { runAllEpochs().catch(benchCrash); },
        tictime: function () { runTictimes().catch(benchCrash); },
        passer: function () { window.ABORT_COMPUTE = true; },
        voir: function () {}   // page autonome : pas d'organigramme à remplir
    }
    : {
        epoque: function () { benchDebutEncart('epoque'); },
        tictime: function () { benchDebutEncart('tictime'); },
        passer: function () { window.parent.postMessage({ type: 'bench:passer' }, '*'); },
        // Clic sur l'époque d'une ligne : l'index reprend l'état de fin de ce calcul (BENCH.voir, bench_pilote.js).
        voir: function (rowKey) { window.parent.postMessage({ type: 'bench:voir', rowKey: rowKey }, '*'); }
    };

// Lignes envoyées par l'index (encart seulement : la page autonome ne reçoit pas ces messages).
window.addEventListener('message', function (e) {
    const T = e.data.type;
    if (T !== 'bench:debut' && T !== 'bench:ligne' && T !== 'bench:fin') return;
    if (T === 'bench:fin') { benchEnd(e.data.resume, e.data.t0); return; }
    const L = e.data.ligne;
    const ep = window.TIMELINE.find(function (x) { return x['📅'] === L.epochId; });
    if (T === 'bench:debut') {
        createRow(ep, { rowKey: L.rowKey, etape: L.etape, tInitC: L.tInitC, date: L.date });
        document.getElementById('progress-label').textContent = L.rowKey + ' — ' + window.epochName(L.epochId) + ' · ' + L.etape;
        document.getElementById('progress-fill').style.width = (e.data.avance * 100) + '%';
        return;
    }
    updateRow(L.rowKey, L.epochId, L.initStep, L.lastStep, L.status, L.tInitC, ep, L.path, L.convAtmSnap);
});
