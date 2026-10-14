// File: API_BILAN/demo/scie_actions.js - Boutons d'événement de l'époque, init des globals, cycle run/stop
// Desc: Les ACTIONS : les boutons d'événement de l'époque courante (version simplifiée de timeline/events.js,
//       cette page n'ayant pas d'organigramme), l'initialisation des globals avant un calcul, et le bouton
//       qui lance ou interrompt la convergence.
// Version 1.1.0
// Date: 2026-10-12
// logs :
//   - v1.1.0: plus de copie de la mécanique des clics (CO₂ 📱, 🌋, >>, ☄️, 🎇 réécrivaient 📜 à leur façon :
//     ☄️ comptait 📿💫 et 🔺⚖️💧 jamais lu, >> n'avançait pas ⏳, 🎇 = clic sur la frise). Effet = CLICS.jouer ;
//     runTest = frise + lancerCalcul.
//   - copie API (2026-09-20) de la page scientifique de CO2. La page de CO2 reste la reference
//     pour l'affichage ; cette copie-ci vit dans demo/ pour que le depot API se teste seul, et
//     c'est elle qui gagne la frise horizontale et les champs de configuration modifiables.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

/** Actions proposées : 📱 la tranche active (rien passé ◀) ; sinon l'action suivante de 🕰.order (config API). */
function actionsProposees() {
    if (window.CLICS.parTranche()) {
        const tranche = window.CLICS.trancheActive();
        return tranche === null ? [] : Object.keys(tranche);
    }
    const act = window.CLICS.prochaineAction();
    return act === undefined ? [] : [act];
}

/**
 * Un clic d'action (page démo : la scie de CO2 n'a pas de boutons, son parent les a). CLICS.jouer — la même
 * mécanique que l'interface et le banc —, passage d'époque éventuel, puis calcul en animation (T° conservée).
 */
function jouerScie(key) {
    const r = window.CLICS.jouer(key);
    if (r.passage !== null) window.CLICS.passer(r.passage);
    marquerEpoqueFrise();
    updateTimelineDisplay();
    updateEpochActions();
    lancerCalcul(true);
}

// Boutons d'événement de l'époque courante (rendu seul ; l'effet est dans CLICS).
function updateEpochActions() {
    const eventsLogos = document.getElementById('timeline-events-logos');
    eventsLogos.innerHTML = '';
    actionsProposees().forEach(function (key) {
        let el;
        if (key === '☄️' || key === '🎇') {
            el = document.createElement('img');
            el.src = window.getLogoImageSrc(key);
            el.alt = '';
            el.className = 'timeline-event-logo btn-events';
        } else {
            el = document.createElement('button');
            el.type = 'button';
            el.className = 'icon-button btn-events';
            el.textContent = key;
        }
        el.title = window.CHARS_DESC[key];
        el.addEventListener('click', function () { jouerScie(key); });
        eventsLogos.appendChild(el);
    });
}

// Avant ▶️ ou un essai de réglage : on repart de l'époque courante (CLICS.frise, la même mécanique que partout).
function initializeGlobals() {
    window.CLICS.frise(window.DATA['📜']['🗿']);
}

function setRunStopButtonRunning(running) {
    const btn = document.getElementById('run-stop-btn');
    if (!btn) return;
    window.COMPUTE_RUNNING = !!running;
    if (running) {
        btn.textContent = '⏹';
        btn.title = 'Arrêter les calculs';
        btn.classList.add('selected');
    } else {
        btn.textContent = '▶️';
        btn.title = 'Exécuter';
        btn.classList.remove('selected');
    }
}

/** ▶️ / ⏹ de la page démo. */
function toggleRunStop() {
    if (window.COMPUTE_RUNNING) {
        window.ABORT_COMPUTE = true;
        return;
    }
    runTest();
}

/** ▶️ : on repart de l'époque (frise), puis calcul dans le mode courant (🔘🎞). */
async function runTest() {
    initializeGlobals();
    await lancerCalcul(window.DATA['🔘']['🔘🎞']);
}

/** Calcul sur l'état courant. animEnabled:true = après un clic (T° présente conservée). */
async function lancerCalcul(animEnabled) {
    setRunStopButtonRunning(true);
    window.ABORT_COMPUTE = false;
    window.CONFIG_INIT_SNAPSHOT = null;
    try {
        // LE point d'entrée moteur (API_BILAN/api.js) : préparation + convergence, trace par SCIE_ENGINE_EVENT.
        const result = await window.getBilanRadiatifAPI(window.SCIE_ENGINE_EVENT)
            .run({ epochId: window.DATA['📜']['🗿'], animEnabled: animEnabled });
        if (result !== null) displayResults(result);
        displayConvergence();
        if (result !== null) {
            console.log('✅ Test terminé avec succès');
        } else {
            console.log('⏹ Calculs arrêtés');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        document.getElementById('results').style.display = 'block';
        document.getElementById('results-content').innerHTML = `
            <div class="error">
                <strong>Erreur:</strong> ${error.message}
                <pre>${error.stack}</pre>
            </div>
        `;
    } finally {
        setRunStopButtonRunning(false);
    }
}
