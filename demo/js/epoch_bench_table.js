// File: API_BILAN/demo/epoch_bench_table.js
// Desc: Table de resultats : creation et mise a jour des lignes, copie d une ligne au presse-papier.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

function copyBenchRow(tr) {
    if (!tr) return;
    var line = tr.dataset.benchCopyLine;
    if (!line) {
        var tds = tr.querySelectorAll('td:not(.cell-icon)');
        var chunks = [];
        for (var i = 0; i < tds.length; i++) {
            chunks.push((tds[i].innerText || '').replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
        }
        line = chunks.join('\t');
    }
    function ok() { }
    function fail(e) {
        console.error('[epoch_bench] copie presse-papiers', e);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(line).then(ok).catch(fail);
    } else {
        var ta = document.createElement('textarea');
        ta.value = line;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            ok();
        } catch (e2) {
            fail(e2);
        }
        document.body.removeChild(ta);
    }
}

function fmtAge(years) {
    if (years == null) return '?';
    var Ma = years / 1e6;
    if (Math.abs(Ma) >= 999.5) return (Ma / 1000).toFixed(1) + ' Ga';
    if (Math.abs(Ma) >= 0.999) return Math.round(Ma) + ' Ma';
    var ka = years / 1e3;
    if (Math.abs(ka) >= 0.999) return ka.toFixed(1) + ' ka';
    return Math.round(years) + ' a';
}
function statusHtml(s) {
    if (!s) return '<span class="status-run">\u23f3 calcul\u2026</span>';
    if (s === 'converged') return '<span class="status-ok">\u2705 converged</span>';
    if (s === 'max_iter')  return '<span class="status-warn">\u26a0\ufe0f max_iter</span>';
    if (s === 'oscillation') return '<span class="status-warn">\u21c4 oscillation (yoyo)</span>';
    if (s === 'crash' || (typeof s === 'string' && s.indexOf('crash:') === 0)) {
        return '<span class="status-err">\u274c ' + String(s) + '</span>';
    }
    if (s === 'abort')     return '<span class="status-err">\u{1F6D1} abort</span>';
    return '<span class="status-warn">\u26a0\ufe0f ' + s + '</span>';
}

function createRow(epoch) {
    var id = epoch['\u{1F4C5}'];
    var name = window.epochName(id);
    var HYST_LOGOS = { 'hysteresis 1a': '\u2603', 'hysteresis 1b': '\u26c8', 'hysteresis 2': '\u{1F427}' };
    var displayLogo = HYST_LOGOS[id] || ((id.length <= 3) ? id : '\u2699');
    var ageStart = fmtAge(epoch['\u25b6']);

    var safeId = id.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, function(c) {
        return '_x' + c.codePointAt(0).toString(16) + '_';
    });
    var tr = document.createElement('tr');
    tr.id = 'row-' + safeId;
    tr.className = 'running';
    tr.innerHTML =
      '<td class="cell-icon"><button type="button" class="btn-skip-epoch" title="Passer cette \u00e9poque (interrompt le calcul, \u00e9quivalent ABORT_COMPUTE)" aria-label="Passer cette \u00e9poque">\u23ed\ufe0f</button></td>' +
      '<td class="col-epoch">' +
        '<div class="epoch-cell">' +
          '<span class="epoch-logo">' + displayLogo + '</span>' +
          '<div>' +
            '<div class="epoch-name">' + name + '</div>' +
            '<div class="epoch-age">' + ageStart + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="num fit tinit-cell">' + fmtTinitCell(epoch) + '</td>' +
      '<td class="num fit" id="tconv-' + safeId + '"><span class="status-run">\u2026</span></td>' +
      '<td class="num fit" id="dfin-'  + safeId + '"><span class="status-run">\u2026</span></td>' +
      '<td class="json-rad-path mono" id="radpath-' + safeId + '"><span class="status-run">\u2026</span></td>' +
      '<td class="json-conv-atm mono" id="convatm-' + safeId + '"><span class="status-run">\u2026</span></td>';
    tr.dataset.safeId = safeId;

    document.getElementById('results-body').appendChild(tr);
    return tr;
}

function safeIdOf(id) {
    return id.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, function(c) {
        return '_x' + c.codePointAt(0).toString(16) + '_';
    });
}
function updateRow(id, initStep, lastStep, status, tEpochInitC, epoch, radTPath, convAtmSnap) {
    var safeId = safeIdOf(id);
    var tr = document.getElementById('row-' + safeId);
    if (!tr) return;
    tr.className = status === 'converged' ? 'done-converged'
                 : status === 'max_iter'  ? 'done-maxiter'
                 : (status === 'crash' || status === 'abort' || (typeof status === 'string' && status.indexOf('crash:') === 0)) ? 'done-crash'
                 : 'done-maxiter';

    var tConv = document.getElementById('tconv-' + safeId);
    var dFin  = document.getElementById('dfin-'  + safeId);
    var radPathEl = document.getElementById('radpath-' + safeId);
    var convAtmEl = document.getElementById('convatm-' + safeId);

    if (radPathEl) radPathEl.innerHTML = fmtRadInitAndPath(initStep, radTPath, lastStep);
    if (convAtmEl) convAtmEl.innerHTML = fmtConvAtmSnapshot(convAtmSnap, id);
    /* Pr\u00e9fixe statut dans la cellule T FIN : rien si converged, pictogramme + statut sinon (crash/max_iter/abort).
       Le message complet reste disponible dans les logs (console + log de run). */
    var statusPrefix = '';
    if (status === 'max_iter') statusPrefix = '<span class="status-warn" title="max_iter">\u26a0\ufe0f</span> ';
    else if (status === 'abort') statusPrefix = '<span class="status-err" title="abort">\u{1F6D1}</span> ';
    else if (status === 'crash' || (typeof status === 'string' && status.indexOf('crash:') === 0)) {
        statusPrefix = '<span class="status-err" title="' + String(status) + '">\u274c</span> ';
    } else if (status !== 'converged') {
        statusPrefix = '<span class="status-warn" title="' + String(status) + '">\u26a0\ufe0f</span> ';
    }
    if (tConv && lastStep) tConv.innerHTML = statusPrefix + fmtCvsLit(lastStep.temperature_C, id);
    if (dFin && lastStep && typeof lastStep.temperature_C === 'number' && isFinite(lastStep.temperature_C)
        && typeof tEpochInitC === 'number' && isFinite(tEpochInitC)) {
        dFin.innerHTML = fmtDelta(lastStep.temperature_C - tEpochInitC);
    } else     if (dFin) {
        dFin.innerHTML = '<span class="val-na">\u2014</span>';
    }

    var iconTd = tr.querySelector('td.cell-icon');
    if (iconTd) {
        iconTd.innerHTML =
            '<button type="button" class="btn-copy-row" data-copy-row="' + safeId + '" title="Copier la ligne" aria-label="Copier la ligne">\u{1F4CB}</button>';
    }

    var copyParts = [];
    var tdsAll = tr.querySelectorAll('td:not(.cell-icon)');
    for (var ci = 0; ci < tdsAll.length; ci++) {
        copyParts.push((tdsAll[ci].innerText || '').replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
    }
    tr.dataset.benchCopyLine = copyParts.join('\t');
}
