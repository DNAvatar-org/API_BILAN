// File: API_BILAN/demo/epoch_bench_chain.js
// Desc: Boucle du banc, mode TICTIMES : un clic sur la frise ⚫, puis QUE des clics jusqu'à 2025, comme
//       en animation. La T° initiale de chaque calcul est la T° convergée du clic précédent (rien n'est
//       remis à la graine entre deux époques) : c'est ce qui fait passer, ou non, les hystérésis.
//       Une ligne de table par clic (≈ 4 fois plus de calculs que le mode graines).
//       Même mécanique de clic que le banc headless CO2/scripts/bench_headless/courbe_modele.js (mode
//       'clics'), elle-même calquée sur l'interface (events.js) : ordre 🕰.order sinon 💫, compteurs
//       📿💫 / 📿☄️, voile 🔺🍰⚽ de 🗻 / 🌋 / 💫 / ⛰, passage à l'époque suivante quand la durée est écoulée
//       (ou ⏩ de 🎇), puis 📱 : un clic ⛽ de la tranche 2000 → 2025.
// Version 2.0.0
// Date: 2026-10-12
// logs :
//   - v2.0.0: la mécanique des clics vient de CLICS (API_BILAN/convergence/clics.js) — plus de copie ici.
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** ▶ Tictimes : frise ⚫ puis la chaîne de clics complète, T° conservée d'un clic à l'autre, jusqu'au ⛽ 2000 → 2025. */
async function runTictimes() {
    const H = window.DATA['📜'];
    const timeline = window.TIMELINE;
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const api = benchStart('tictimes', timeline.length);
    const t0 = Date.now();
    let nClics = 0;
    let tPrecC = null;   // T° où se trouve le modèle : T° initiale du clic suivant

    // Un calcul = une ligne, sur l'époque courante. animEnabled:true garde la T° courante comme T° initiale.
    async function calcul(etape, animEnabled) {
        nClics++;
        const ep = timeline[H['👉']];
        const rowKey = 'clic' + nClics;
        const tInitC = animEnabled ? tPrecC : ep['🌡️🧮'] - 273.15;
        createRow(ep, { rowKey: rowKey, etape: etape, tInitC: tInitC });
        progressLabel.textContent = 'clic ' + nClics + ' — ' + window.epochName(ep['📅']) + ' · ' + etape;
        progressFill.style.width = ((H['👉'] / timeline.length) * 100) + '%';
        console.log('[bench] —— clic ' + nClics + ' : ' + ep['📅'] + ' ' + etape + ' ——');
        tPrecC = await benchMesurer(api, { epochId: ep['📅'], animEnabled: animEnabled }, rowKey, ep, tInitC);
    }

    window.CLICS.frise('⚫');
    await calcul('frise', false);
    // Que des clics : la mécanique est celle de l'interface (API_BILAN/convergence/clics.js).
    while (!(H['🗿'] === '📱' && H['📿💫'] === 1)) {
        const depuis = H['🗿'];
        const key = window.CLICS.prochaineAction();
        const r = window.CLICS.jouer(key);
        if (r.passage === null) {
            await calcul(key + ' #' + (H['📿💫'] + H['📿☄️']) + ' (' + (+H['⏳'].toFixed(4)) + ' Ma)', true);
        } else {
            window.CLICS.passer(r.passage);
            await calcul(key + ' depuis ' + depuis, true);
        }
    }
    benchEnd(nClics + ' calculs (tictimes)', t0);
}
