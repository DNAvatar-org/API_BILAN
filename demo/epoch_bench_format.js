// File: API_BILAN/demo/epoch_bench_format.js
// Desc: Formatage des cellules : temperatures, ages, plages litterature, snapshot ATM, chemin radiatif.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** Logs fichier _logs/bench.txt si ?debugBench=1 (DEBUG.setTopic déjà appliqué au chargement). */
function benchLogFile(msg) {
    if (!window.DEBUG_BENCH_LOG) return;
    // window.DEBUG vient de logs_to_server.js, cote CO2 : absent quand le banc tourne seul.
    if (window.DEBUG && typeof window.DEBUG.log === 'function') window.DEBUG.log(msg);
}

if (!window.displayConvergence) window.displayConvergence = function () {};
if (!window.epochName) {
    window.epochName = function (id) {
        return (window.CHARS_DESC && window.CHARS_DESC[id] !== undefined) ? window.CHARS_DESC[id] : id;
    };
}

function fmtC(v) {
    if (v == null || !isFinite(v)) return '<span class="val-na">\u2014</span>';
    return v.toFixed(2);
}
function fmtDelta(v) {
    if (v == null || !isFinite(v)) return '<span class="val-na">\u2014</span>';
    var cls = Math.abs(v) < 0.5 ? 'delta-zero' : (v > 0 ? 'delta-pos' : 'delta-neg');
    var sign = v > 0 ? '+' : '';
    return '<span class="' + cls + '">' + sign + v.toFixed(3) + '</span>';
}
/** Masse air sec moyenne (kg/mol) pour ppm/ppb molaires approx. depuis les masses d’époque. */
var BENCH_M_AIR_KG_PER_MOL = 0.02897;
/** Inventaire océan « PAL » moderne (kg) — repère % hydrosphère config. */
var BENCH_PAL_OCEAN_KG = 1.4e21;

/** Masse colonne atmosphère ~1 bar (kg) — même ordre que P_ratio dans doc physique (≈ 5,148e18). */
var BENCH_M_ATM_REF_KG = 5.148e18;

/**
 * Fourchettes littérature pour le bench : source unique window.BENCH_LIT_BY_EPOCH_ID
 * (API_BILAN/config/configTimeline.js), réassignée à chaque chargement du script — pas de CSV, pas de cookie.
 */
var BENCH_LIT_BY_EPOCH_ID = window.BENCH_LIT_BY_EPOCH_ID;
if (BENCH_LIT_BY_EPOCH_ID == null || typeof BENCH_LIT_BY_EPOCH_ID !== 'object') {
    throw new Error('[epoch_bench] window.BENCH_LIT_BY_EPOCH_ID manquant — ordre de chargement configTimeline.js requis');
}

/** Plage litt\u00e9rature CSV : [min,max] avec virgule (m\u00eame r\u00e8gles d\u2019arrondi qu\u2019avant pour bench). */
function benchLitRangeBracket(lo, hi) {
    function f(x) {
        if (!isFinite(x)) return '?';
        var ax = Math.abs(x);
        if (ax >= 1000) return (x / 1000).toFixed(x % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'k';
        if (ax >= 100) return String(Math.round(x));
        if (ax >= 10) return x.toFixed(1).replace(/\.0$/, '');
        return x.toFixed(2);
    }
    return '[' + f(lo) + ',' + f(hi) + ']';
}

/** T init : ligne 1 = T\u2080 (\u00b0C) ; ligne 2 = fourchette CSV [Tmin,Tmax] ; note \u00e9ventuelle (ligne 3). */
function fmtTinitCell(epoch) {
    var id = epoch['\u{1F4C5}'];
    var tNum = (epoch['\u{1F321}\ufe0f\u{1F9EE}'] - 273.15).toFixed(1);
    var L = BENCH_LIT_BY_EPOCH_ID[id];
    if (!L) return tNum;
    if (!('tC' in L)) {
        return tNum + '<br><span class="bench-sub">' + L.note + '</span>';
    }
    var out = tNum + '<br><span class="bench-sub">' + benchLitRangeBracket(L.tC[0], L.tC[1]) + '</span>';
    if (L.note) {
        out += '<br><span class="bench-sub">' + L.note + '</span>';
    }
    return out;
}

/**
 * Snapshot post-convergence : CO\u2082 / CH\u2084 / H\u2082O ; ligne seule \u{1F370}\u{1FAE7}*\u{1F308}={\u2026} ; alb\u00e9do = CHARS.ALBEDO \u{1FAE9} (miroir, pas confondre avec d\u2019autres glyphes).
 */
function fmtConvAtmSnapshot(snap, epochId) {
    if (!snap) return '<span class="val-na">\u2014</span>';
    var CONST = window.CONST;
    var M_air = snap.Mair;
    var L = (epochId != null && epochId !== '') ? BENCH_LIT_BY_EPOCH_ID[epochId] : null;
    var hasLitGaz = L && ('tC' in L);
    var parts = [];
    if (typeof snap.co2Frac === 'number' && isFinite(snap.co2Frac) && CONST && M_air) {
        var ppmCO2 = snap.co2Frac * (M_air / CONST.M_CO2) * 1e6;
        var sCo2 = '<span class="bench-key">CO\u2082</span>\u2248' + (ppmCO2 < 1e5 ? ppmCO2.toFixed(0) + ' ppm' : (ppmCO2 / 1e3).toFixed(0) + 'k ppm');
        if (hasLitGaz) {
            sCo2 += ' <span class="bench-sub">' + benchLitRangeBracket(L.co2[0], L.co2[1]) + '</span>';
        }
        parts.push(sCo2);
    }
    if (typeof snap.ch4Frac === 'number' && isFinite(snap.ch4Frac) && CONST && M_air) {
        var ppmCH4 = snap.ch4Frac * (M_air / CONST.M_CH4) * 1e6;
        var sCh4 = '<span class="bench-key">CH\u2084</span>\u2248' + (ppmCH4 < 1e5 ? ppmCH4.toFixed(2) + ' ppm' : (ppmCH4 / 1e3).toFixed(0) + 'k ppm');
        if (hasLitGaz) {
            sCh4 += ' <span class="bench-sub">' + benchLitRangeBracket(L.ch4[0], L.ch4[1]) + '</span>';
        }
        parts.push(sCh4);
    }
    if (typeof snap.h2oFrac === 'number' && isFinite(snap.h2oFrac) && CONST && M_air) {
        var molH2O = snap.h2oFrac * (M_air / CONST.M_H2O);
        var sH2o = '<span class="bench-key">H\u2082O</span>\u2248' + (molH2O * 100).toFixed(2) + '% vapmol.';
        if (hasLitGaz) {
            sH2o += ' <span class="bench-sub">' + benchLitRangeBracket(L.h2oVap[0], L.h2oVap[1]) + '</span>';
        }
        parts.push(sH2o);
    }
    function fmtCap(v) {
        if (typeof v !== 'number' || !isFinite(v)) return null;
        if (v === 0) return '0';
        if (v >= 1e-4) return (v * 100).toFixed(2) + '%';
        return v.toExponential(2);
    }
    var capCO2f = fmtCap(snap.capCO2IR);
    var capH2Of = fmtCap(snap.capH2OIR);
    var capSumf = fmtCap(snap.capSumIR);
    var capSegs = [];
    if (capCO2f) capSegs.push('\u{1F3ED}:' + capCO2f);
    if (capH2Of) capSegs.push('\u{1F4A7}:' + capH2Of);
    if (capSumf) capSegs.push('\u{1F4FF}:' + capSumf);
    var lineCake = '';
    if (capSegs.length) {
        lineCake = '<span class="bench-ircap"><span class="bench-key">\u{1F370}\u{1FAE7}*\u{1F308}</span>={' + capSegs.join(', ') + '}</span>';
    }
    var lineAlb = '';
    if (typeof snap.albedo === 'number' && isFinite(snap.albedo)) {
        lineAlb = '<span class="bench-key" title="Alb\u00e9do effectif, cl\u00e9 DATA \u{1F370}\u{1FAE9}\u{1F4FF} (CHARS.ALBEDO)">🪩</span>\u2248' + (snap.albedo * 100).toFixed(1) + '%';
    }
    var chunks = [];
    if (parts.length) {
        chunks.push(parts.join('<br>'));
    } else {
        chunks.push('<span class="val-na">\u2014</span>');
    }
    if (lineCake) chunks.push(lineCake);
    if (lineAlb) chunks.push(lineAlb);
    var out = chunks.join('<br>');
    if (L && !('tC' in L) && L.note) {
        out += '<br><span class="bench-sub">' + L.note + '</span>';
    } else if (hasLitGaz && L.note) {
        out += '<br><span class="bench-sub">' + L.note + '</span>';
    }
    return out;
}

/** RADIATIF : une ligne \u{1F53A}\u{1F9F2} init = \u0394 1er pas ; puis cha\u00eene T (\u00b0C). lastStepForDelta : r\u00e9serv\u00e9 appelant (non affich\u00e9). */
function fmtRadInitAndPath(initStep, radTPath, lastStepForDelta) {
    var lines = [];
    var dInit = (initStep && typeof initStep.delta_equilibre === 'number' && isFinite(initStep.delta_equilibre))
        ? initStep.delta_equilibre : null;
    if (dInit != null) {
        lines.push('<span class="bench-key">\u{1F53A}\u{1F9F2}</span> init: ' + dInit.toFixed(3) + ' W/m\u00b2');
    } else {
        lines.push('<span class="bench-key">\u{1F53A}\u{1F9F2}</span> init: \u2014');
    }
    if (radTPath && radTPath.length) {
        var seg = [];
        for (var i = 0; i < radTPath.length; i++) {
            var t = radTPath[i];
            seg.push((typeof t === 'number' && isFinite(t)) ? t.toFixed(2) : '?');
        }
        lines.push('<span class="bench-tpath">' + seg.join(' \u2192 ') + '</span> \u00b0C');
    } else {
        lines.push('<span class="val-na">\u2014</span>');
    }
    return lines.join('<br>');
}
