// File: API_BILAN/demo/scie_tuning_view.js - Panneau fine-tuning : bornes, barycentres, curseurs
// Desc: Le FINE-TUNING : les bornes de FINE_TUNING_BOUNDS, les curseurs de barycentre par groupe, et la
//       synchronisation avec la page parente. C'est la partie qui rend visible le flou scientifique.
// Version 1.3.0
//   - v1.3.0 (2026-10-13): sens de chaque jauge et cible (TUNING.sensJauge / sensCible : 🔺 🔻 ↕️).
// Date: [September 19, 2026]
//   - copie API (2026-09-20) de la page scientifique de CO2. La page de CO2 reste la reference
//     pour l'affichage ; cette copie-ci vit dans demo/ pour que le depot API se teste seul, et
//     c'est elle qui gagne la frise horizontale et les champs de configuration modifiables.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.


function getFineTuningTargets() {
    return window.FINE_TUNING_BOUNDS.targets.filter(function (target) {
        return target && target.group && target.key && window.DATA['🎚️'][target.group];
    });
}

function getFineTuningThreeValues(target) {
    const min = Number(target.min);
    const max = Number(target.max);
    const avg = (min + max) / 2;
    return [
        { label: 'min', value: min },
        { label: 'moy', value: avg },
        { label: 'max', value: max }
    ];
}

function setFineTuningValue(target, value) {
    window.DATA['🎚️'][target.group][target.key] = value;
    if (target.group === 'SOLVER') syncSolverConfigFromData();
}

function getFineTuningBaryPercent(jauge) {
    return Number(window.DATA['🎚️'].baryByGroup[jauge]);
}

/** Cibles d'une jauge (FINE_TUNING_BOUNDS.jauges) — ou, pour la bibliographie, d'un groupe de stockage. */
function getFineTuningTargetsByJauge(jauge) {
    return getFineTuningTargets().filter(function (t) { return t.baryGroup === jauge; });
}
function getFineTuningTargetsByGroup(groupKey) {
    return getFineTuningTargets().filter(function (t) { return t.group === groupKey; });
}

/** Le réglage courant envoyé au parent : tout baryByGroup (le parent réinterpole avec TUNING). */
function getFineTuningBaryByGroupSnapshot() {
    return Object.assign({}, window.DATA['🎚️'].baryByGroup);
}

/** Une jauge passe à pct : TUNING réinterpole toutes les cibles (une seule écriture de l'interpolation). */
function applyFineTuningBaryGroup(jauge, percentRaw, refreshPanel) {
    var bary = {};
    bary[jauge] = Math.max(0, Math.min(100, Math.round(Number(percentRaw))));
    window.TUNING.applyTuningPayload({ baryByGroup: bary });
    if (refreshPanel !== false) displayFineTuning();
}

function applyFineTuningBaryGroupAndRun(jauge, percentRaw) {
    applyFineTuningBaryGroup(jauge, percentRaw, true);
    if (window !== window.top) {
        syncTuningToParent(true);
        return;
    }
    window.runTest();
}

function syncTuningToParent(runFlag) {
    if (window === window.top) return;
    window.parent.postMessage({ type: 'sync:tuning', payload: tuningPayload(runFlag === true) }, '*');
}

/** Pendant le glissement : réglage et valeurs affichées mis à jour sans recréer le panneau (le curseur resterait lâché). */
function onFineTuningBaryInput(jauge, percentRaw) {
    applyFineTuningBaryGroup(jauge, percentRaw, false);
    var pct = Math.round(Number(percentRaw)) + '%';
    document.querySelectorAll('[data-jauge-pct="' + jauge + '"]').forEach(function (el) { el.textContent = pct; });
    getFineTuningTargetsByJauge(jauge).forEach(function (t) {
        var el = document.getElementById('fine-tuning-valeur-' + t.key);
        if (el) el.textContent = formatTuningValue(getFineTuningValue(t));
    });
    syncTuningToParent(false);
}

// Désactiver le clic sur la bande des jauges fine tuning / solveur : seul le glissement du bouton bleu change la valeur
document.addEventListener('mousedown', function (e) {
    var el = e.target;
    if (el.type !== 'range' || !el.id || el.id.indexOf('fine-tuning-bary-slider') !== 0) return;
    var r = el.getBoundingClientRect();
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max) || 100;
    var val = parseFloat(el.value) || min;
    var pct = (max > min) ? (val - min) / (max - min) : 0;
    var thumbX = r.left + pct * r.width;
    if (Math.abs(e.clientX - thumbX) > 15) e.preventDefault();
}, true);

function getInitRadiatifMetrics() {
    const trace = window.getConvergenceTrace ? window.getConvergenceTrace() : [];
    const init = trace.length > 0 ? trace[0] : null;
    if (!init) return { T_init_C: NaN, delta_init: NaN };
    const T_init = Number.isFinite(init.temperature_C) ? init.temperature_C : NaN;
    const delta_init = Number.isFinite(init.delta_equilibre) ? init.delta_equilibre : NaN;
    return { T_init_C: T_init, delta_init: delta_init };
}

async function runSingleFineTuningCompute() {
    initializeGlobals();
    // Essai de réglage : toujours depuis la graine (animEnabled:false), par le point d'entrée unique.
    const result = await window.getBilanRadiatifAPI(window.SCIE_ENGINE_EVENT)
        .run({ epochId: window.DATA['📜']['🗿'], animEnabled: false });
    displayResults(result);
    displayConvergence();
    return result;
}

async function runFineTuningTrials() {
    const targets = getFineTuningTargets();
    setRunStopButtonRunning(true);
    const originalValues = {};
    targets.forEach(function (target) {
        originalValues[target.group + '.' + target.key] = window.DATA['🎚️'][target.group][target.key];
    });
    const DATA = window.DATA;
    const animWasEnabled = DATA['🔘']['🔘🎞'] === true;
    DATA['🔘']['🔘🎞'] = false;
    window.FINE_TUNING_TRIALS = [];
    try {
        for (let t = 0; t < targets.length; t++) {
            const target = targets[t];
            const trials = getFineTuningThreeValues(target);
            for (let i = 0; i < trials.length; i++) {
                const trial = trials[i];
                setFineTuningValue(target, trial.value);
                await runSingleFineTuningCompute();
                const initMetrics = getInitRadiatifMetrics();
                const DATA = window.DATA;
                const T_final_K = (DATA && DATA['🧮' ] && DATA['🧮']['🧮🌡️'] != null) ? Number(DATA['🧮']['🧮🌡️']) : NaN;
                const T_final_C = Number.isFinite(T_final_K) ? T_final_K - 273.15 : NaN;
                window.FINE_TUNING_TRIALS.push({
                    label: trial.label,
                    param_group: target.group,
                    param_key: target.key,
                    param_value: trial.value,
                    min: target.min,
                    max: target.max,
                    note: target.note || '',
                    T_init_C: initMetrics.T_init_C,
                    delta_init: initMetrics.delta_init,
                    T_final_C: T_final_C
                });
                console.log('[fine-tuning trial]'
                    + ' ' + trial.label
                    + ' ' + target.group + '.' + target.key + '=' + formatTuningValue(trial.value)
                    + ' | Init: T=' + (Number.isFinite(initMetrics.T_init_C) ? initMetrics.T_init_C.toFixed(1) : 'n/a') + '°C'
                    + ', 🔺🧲=' + (Number.isFinite(initMetrics.delta_init) ? initMetrics.delta_init.toFixed(3) : 'n/a')
                    + ' | Final: T=' + (Number.isFinite(T_final_C) ? T_final_C.toFixed(1) : 'n/a') + '°C');
            }
        }
    } catch (err) {
        console.error('❌ Fine-tuning trials:', err);
    } finally {
        DATA['🔘']['🔘🎞'] = animWasEnabled;
        targets.forEach(function (target) {
            const k = target.group + '.' + target.key;
            setFineTuningValue(target, originalValues[k]);
        });
        setRunStopButtonRunning(false);
        displayFineTuning();
    }
}

// Mise à jour des seules jauges DOM depuis DATA (pas de innerHTML) — sync parent↔scie sans clignotement.
function syncFineTuningSlidersFromBary() {
    var bg = window.DATA['🎚️'].baryByGroup;
    var curseurs = document.querySelectorAll('[data-jauge-curseur]');
    curseurs.forEach(function (el) { el.value = String(Math.round(bg[el.dataset.jaugeCurseur])); });
    document.querySelectorAll('[data-jauge-pct]').forEach(function (el) { el.textContent = Math.round(bg[el.dataset.jaugePct]) + '%'; });
    return curseurs.length > 0;
}

function toggleFineTuning() {
    const content = document.getElementById('fine-tuning-content');
    const btn = document.getElementById('fine-tuning-toggle');
    if (!content || !btn) return;
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    btn.textContent = isOpen ? '+' : '−';
}

/** Panneau fine-tuning : une section par jauge — curseur, sens, explication, mesure, puis ses paramètres. */
function displayFineTuning() {
    const tuningDiv = document.getElementById('fine-tuning');
    const tuningContent = document.getElementById('fine-tuning-content');
    const F = window.FINE_TUNING_BOUNDS;
    const bg = window.DATA['🎚️'].baryByGroup;
    const fineTitle = tuningDiv.querySelector('h2');
    const isOpen = tuningContent.style.display !== 'none';
    fineTitle.style.display = 'flex';
    fineTitle.style.alignItems = 'center';
    fineTitle.style.gap = '8px';
    fineTitle.innerHTML = '🧩 Fine-tuning ' + Object.keys(F.jauges).map(function (j) {
        const sens = window.TUNING.sensJauge(j);
        return F.jauges[j].logo + ' <span data-jauge-pct="' + j + '">' + Math.round(bg[j]) + '%</span>'
            + ' <span title="' + sens.titre + '">' + sens.logo + '</span>';
    }).join(' · ')
        + '<button class="toggle-button" id="fine-tuning-toggle" onclick="toggleFineTuning()" style="margin-left:auto">' + (isOpen ? '−' : '+') + '</button>';
    let html = '<div class="config-value"><em>Le barycentre unique a été éclaté le 2026-10-13 : avec la nouvelle physique des '
        + 'nuages, ses paramètres n\'allaient plus dans le même sens. Classement mesuré : bilan net à la température graine de '
        + 'sept époques, chaque paramètre de sa borne basse à sa borne haute, les autres à 50 %.</em></div>';
    Object.keys(F.jauges).forEach(function (j) {
        const J = F.jauges[j];
        const pct = Math.round(bg[j]);
        html += '<div class="config-section">'
            + '<div class="config-value" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            + '<strong>' + J.logo + ' ' + j + ' — ' + J.titre + '</strong> '
            + window.TUNING.sensJauge(j).logo + ' (' + window.TUNING.sensJauge(j).titre + ')'
            + '<input data-jauge-curseur="' + j + '" id="fine-tuning-bary-slider-' + j + '" type="range" min="0" max="100" step="1" value="' + pct + '" oninput="onFineTuningBaryInput(\'' + j + '\', this.value)">'
            + '<span data-jauge-pct="' + j + '">' + pct + '%</span>'
            + '<button class="toggle-button" onclick="applyFineTuningBaryGroupAndRun(\'' + j + '\', document.getElementById(\'fine-tuning-bary-slider-' + j + '\').value); return false;">▶️</button>'
            + '</div>'
            + '<div class="config-value">' + J.explication + '</div>'
            + '<div class="config-value">📏 ' + J.mesure + '</div>';
        getFineTuningTargetsByJauge(j).forEach(function (t) {
            html += '<div class="config-value">' + window.TUNING.sensCible(t).logo + ' ' + getTuningLineLogo(t.group, t.key) + ' <strong>' + t.key + '</strong> = '
                + '<span id="fine-tuning-valeur-' + t.key + '">' + formatTuningValue(getFineTuningValue(t)) + '</span>'
                + ' [' + formatTuningValue(t.min) + ' , ' + formatTuningValue(t.max) + '] — ' + t.note + ' #' + t.source + '</div>';
        });
        html += '</div>';
    });
    tuningContent.innerHTML = html;
    tuningDiv.style.display = 'block';
    // Ne pas toucher à tuningContent.style.display — respecter l'état plié/déplié actuel
}
