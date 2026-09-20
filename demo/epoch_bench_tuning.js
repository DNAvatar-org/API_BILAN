// File: API_BILAN/demo/epoch_bench_tuning.js
// Desc: Panneau fine-tuning : jauges par groupe, barycentre, synchronisation avec la page parente.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** Fine-tuning : jauge unique ATM (☁️+🔬) comme scie_compute — même % pour CLOUD_SW et SCIENCE. tuning.js : fillDataTuningFromBary. */
function benchFormatTuningValue(value) {
    if (value == null) return 'null';
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return String(value);
        if (Number.isInteger(value)) return String(value);
        if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(3);
        return parseFloat(value.toFixed(6)).toString();
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
}
function benchGetFineTuningTargets() {
    return window.FINE_TUNING_BOUNDS.targets.filter(function (target) {
        return target && target.group && target.key && window.DATA['🎚️'][target.group];
    });
}
function benchGetFineTuningTargetsByGroup(groupKey) {
    var targets = benchGetFineTuningTargets();
    if (groupKey === 'SCIENCE') {
        return targets.filter(function (t) { return t.baryGroup === 'SCIENCE'; });
    }
    if (groupKey === 'CLOUD_SW') {
        return targets.filter(function (t) { return t.group === 'CLOUD_SW' && (t.baryGroup == null || t.baryGroup === 'CLOUD_SW'); });
    }
    return targets.filter(function (t) { return t.group === groupKey; });
}
function benchGetFineTuningBaryPercent(groupKey) {
    return Number(window.DATA['🎚️'].baryByGroup[groupKey]);
}
/** Affichage jauge en-tête : si CLOUD_SW ≠ SCIENCE, moyenne arrondie jusqu’à prochain drag unifié. */
function benchGetUnifiedAtmBaryForDisplay() {
    var bg = window.DATA['🎚️'].baryByGroup;
    var c = Number(bg.CLOUD_SW);
    var s = Number(bg.SCIENCE);
    if (!Number.isFinite(c)) c = 50;
    if (!Number.isFinite(s)) s = 50;
    c = Math.round(Math.max(0, Math.min(100, c)));
    s = Math.round(Math.max(0, Math.min(100, s)));
    if (c === s) return c;
    return Math.round(Math.max(0, Math.min(100, (c + s) / 2)));
}
function benchSetFineTuningBaryPercent(groupKey, percentRaw) {
    var p = Number(percentRaw);
    var bounded = Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
    window.DATA['🎚️'].baryByGroup[groupKey] = bounded;
    return bounded;
}
function benchGetFineTuningBaryValue(target, baryPercent) {
    var min = Number(target.min);
    var max = Number(target.max);
    var pct = Number(baryPercent);
    var alpha = pct / 100;
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    return min + (max - min) * alpha;
}
function benchGetTuningLineLogo(groupKey, key) {
    if (groupKey === 'SOLVER') {
        if (key === 'TOL_MIN_WM2') return '🔬';
        if (key === 'LARGE_DELTA_FACTOR') return '🔺🧲';
        if (key === 'MAX_SEARCH_STEP_K' || key === 'MAX_SEARCH_STEP_LARGE_K') return '🌡️';
        return '🧮';
    }
    if (groupKey === 'SCIENCE') {
        if (key === 'CLOUD_FRACTION_INDEX_GAIN') return '☁️';
        if (key === 'OPTICAL_EFF_CCN_GAIN') return '🧪';
        return '🔬';
    }
    if (groupKey === 'CLOUD_SW') {
        if (key.indexOf('SULFATE') === 0) return '\u2708\uFE0F';
        if (key.indexOf('CLOUD_') === 0) return '☁️';
        if (key.indexOf('OPTICAL_') === 0) return '🧪';
        if (key.indexOf('TEMP_') === 0) return '🌡️';
        return '⛅';
    }
    if (groupKey === 'RADIATIVE') return '🌈';
    return '•';
}
function benchRenderMergedCategory(groupKey, titleLabel, titleIcon, showHeader) {
    var groupTargets = benchGetFineTuningTargetsByGroup(groupKey);
    if (!groupTargets.length) return '';
    var bary = benchGetFineTuningBaryPercent(groupKey);
    if (!Number.isFinite(bary)) bary = 100;
    bary = Math.round(Math.max(0, Math.min(100, bary)));
    var controlsHtml = '';
    if (groupKey === 'SOLVER') {
        controlsHtml = '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-left:8px;">'
            + '<input id="bench-ft-bary-slider-' + groupKey + '" type="range" min="0" max="100" step="1" value="' + bary
            + '" oninput="window.__BENCH_FT__.onInput(\'' + groupKey + '\', this.value)">'
            + '<span id="bench-ft-bary-value-' + groupKey + '">' + bary + '%</span>'
            + '<button type="button" class="bench-ft-btn" onclick="window.__BENCH_FT__.applyAndRun(\'' + groupKey + '\', document.getElementById(\'bench-ft-bary-slider-' + groupKey + '\').value); return false;">▶️</button>'
            + '</span>';
    }
    var html = '<div class="bench-ft-sec">';
    if (showHeader !== false) {
        html += '<div class="bench-ft-line" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            + '<strong style="white-space:nowrap;">' + titleIcon + ' ' + titleLabel + ' 🎚️</strong>' + controlsHtml + '</div>';
    }
    for (var i = 0; i < groupTargets.length; i++) {
        var target = groupTargets[i];
        var logo = benchGetTuningLineLogo(target.group, target.key);
        var activeVal = benchGetFineTuningBaryValue(target, bary);
        html += '<div class="bench-ft-line">' + logo + ' ' + target.key + ' 🔻 ' + benchFormatTuningValue(activeVal)
            + ' [' + benchFormatTuningValue(target.min) + ' , ' + benchFormatTuningValue(target.max) + ']'
            + (target.note ? ' — ' + target.note : '')
            + (target.source ? ' #' + target.source : '') + '</div>';
    }
    html += '</div>';
    return html;
}
/** DATA['🎚️'].baryByGroup ← CONFIG_COMPUTE.baryByGroupDefault (miroir de DEFAULT.TUNING.baryByGroup, initDATA v1.3.1). */
function benchSyncBaryFromConfigCompute() {
    var bd = window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.baryByGroupDefault;
    var bg = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].baryByGroup;
    if (!bd || !bg) return;
    if (bd.ATM !== undefined) bg.ATM = bd.ATM;
    bg.CLOUD_SW = bd.CLOUD_SW;
    bg.SCIENCE = bd.SCIENCE;
    if (bd.SOLVER !== undefined) bg.SOLVER = bd.SOLVER;
    bg.HYSTERESIS = bd.HYSTERESIS;
}
// v1.0.17 : mise à jour des sliders existants sans rebuild DOM.
// Utilisé par le listener sync:tuning pour éviter que l'écho d'une émission bench ne recrée
// le slider en plein drag (même pattern que scie_compute.html / syncFineTuningSlidersFromBary).
// Retourne true si au moins le slider ATM header a été trouvé (⇒ rebuild pas nécessaire).
function benchSyncFineTuningSlidersFromBary() {
    var hEl = document.getElementById('bench-ft-slider-ATM-header');
    if (!hEl) return false;
    var atm = benchGetUnifiedAtmBaryForDisplay();
    hEl.value = String(atm);
    var hSpan = document.getElementById('bench-ft-value-ATM-header');
    if (hSpan) hSpan.textContent = atm + '%';
    var bg = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].baryByGroup;
    if (bg) {
        var groups = ['CLOUD_SW', 'SCIENCE', 'SOLVER'];
        for (var gi = 0; gi < groups.length; gi++) {
            var gk = groups[gi];
            var raw = Number(bg[gk]);
            var v = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 100;
            var gEl = document.getElementById('bench-ft-bary-slider-' + gk);
            if (gEl) gEl.value = String(v);
            var gSpan = document.getElementById('bench-ft-bary-value-' + gk);
            if (gSpan) gSpan.textContent = v + '%';
        }
    }
    return true;
}

// v1.0.17 : bench parle — émet sync:tuning vers le parent (index.html → sync_panels.js).
// Payload identique à celui de scie_compute.html / syncTuningToParent pour homogénéité.
// runFlag === true => parent relance runComputeInParent ; false => simple propagation d'état.
function benchEmitTuningToParent(runFlag) {
    if (!window.parent || window.parent === window) return;
    var T = window.DATA && window.DATA['🎚️'];
    if (!T || !T.baryByGroup) return;
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: {
            baryByGroup: {
                ATM: T.baryByGroup.ATM,
                CLOUD_SW: T.baryByGroup.ATM,
                SCIENCE: T.baryByGroup.ATM,
                SOLVER: T.baryByGroup.SOLVER,
                HYSTERESIS: T.baryByGroup.HYSTERESIS
            },
            CLOUD_SW: T.CLOUD_SW,
            SOLVER: T.SOLVER,
            updates: [],
            run: runFlag === true
        }
    }, '*');
}

function benchDisplayFineTuning() {
    var titleSlot = document.getElementById('bench-ft-title-slot');
    var content = document.getElementById('bench-ft-content');
    if (!titleSlot || !content || !window.DATA || !window.DATA['🎚️']) return;
    if (window.TUNING && window.TUNING.fillDataTuningFromBary) window.TUNING.fillDataTuningFromBary();
    var atmBary = benchGetUnifiedAtmBaryForDisplay();
    var isOpen = content.style.display !== 'none';
    titleSlot.innerHTML = '🧩 Fine-tuning 🪩 <span style="display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;margin-left:4px;">'
        + '<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;" title="Même % pour CLOUD_SW (☁️) et SCIENCE (🔬)">🔺☁️🔬'
        + '<input id="bench-ft-slider-ATM-header" type="range" min="0" max="100" step="1" value="' + atmBary
        + '" oninput="window.__BENCH_FT__.onInput(\'ATM\', this.value)">'
        + '<span id="bench-ft-value-ATM-header">' + atmBary + '%</span>'
        + '<button type="button" class="bench-ft-btn" onclick="window.__BENCH_FT__.applyAndRun(\'ATM\', document.getElementById(\'bench-ft-slider-ATM-header\').value); return false;">▶️</button>🔻</span>'
        + '</span>'
        + '<button type="button" class="bench-ft-btn bench-ft-toggle" id="bench-ft-panel-toggle" onclick="window.__BENCH_FT__.togglePanel(); return false;">' + (isOpen ? '−' : '+') + '</button>';
    content.innerHTML = benchRenderMergedCategory('CLOUD_SW', 'CLOUD_SW', '☁️', false)
        + benchRenderMergedCategory('SCIENCE', 'Science', '🔬', true)
        + benchRenderMergedCategory('SOLVER', 'Solveur', '🧮', true);
    content.style.display = isOpen ? 'block' : 'none';
}
function benchApplyFineTuningBaryGroup(groupKey, percentRaw, refreshPanel) {
    benchSetFineTuningBaryPercent(groupKey, percentRaw);
    if (window.TUNING && window.TUNING.fillDataTuningFromBary) window.TUNING.fillDataTuningFromBary();
    if (refreshPanel !== false) benchDisplayFineTuning();
}
function benchApplyFineTuningAtmUnified(percentRaw, refreshPanel) {
    var v = benchSetFineTuningBaryPercent('CLOUD_SW', percentRaw);
    benchSetFineTuningBaryPercent('SCIENCE', v);
    // v1.0.16 fix : ATM doit être mis à jour AVANT fillDataTuningFromBary.
    // normalizeAtmBary() lit bg.ATM et réécrase CLOUD_SW=SCIENCE=ATM → si ATM non mis à jour,
    // le slider n'a aucun effet sur le calcul.
    benchSetFineTuningBaryPercent('ATM', v);
    if (window.TUNING && window.TUNING.fillDataTuningFromBary) window.TUNING.fillDataTuningFromBary();
    if (refreshPanel !== false) benchDisplayFineTuning();
}
function benchOnFineTuningBaryInput(groupKey, percentRaw) {
    if (groupKey === 'ATM') {
        benchApplyFineTuningAtmUnified(percentRaw, false);
        var pct = Math.round(Number(percentRaw));
        var hAtm = document.getElementById('bench-ft-value-ATM-header');
        if (hAtm) hAtm.textContent = pct + '%';
        benchEmitTuningToParent(false); // v1.0.17 : bench parle (live drag, run:false)
        return;
    }
    benchSetFineTuningBaryPercent(groupKey, percentRaw);
    if (window.TUNING && window.TUNING.fillDataTuningFromBary) window.TUNING.fillDataTuningFromBary();
    var pct = Math.round(Number(percentRaw));
    var valueEl = document.getElementById('bench-ft-bary-value-' + groupKey);
    if (valueEl) valueEl.textContent = pct + '%';
    benchEmitTuningToParent(false); // v1.0.17 : bench parle (live drag, run:false)
}
