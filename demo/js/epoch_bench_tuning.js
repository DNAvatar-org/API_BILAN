// File: API_BILAN/demo/epoch_bench_tuning.js
// Desc: Panneau fine-tuning du banc : jauges séparées (FINE_TUNING_BOUNDS.jauges), détail par jauge avec la valeur
//       LIVE des cibles, synchronisation avec la page parente.
// Version 3.4.0
// - v3.4.0 (2026-10-26): alt0sec / alt2sec de chaque jauge (ce qu'elle règle, son sens, ses paramètres et leur valeur).
// - v3.3.0 (2026-10-15): boutons −1 / +1 de part et d'autre de chaque curseur.
// - v3.2.0 (2026-10-15): libellé et jauges en classes (.bench-ft-label, .bench-ft-jauge) ; bouton détail sorti de la fenêtre.
// - v3.1.0 (2026-10-13): sens de chaque jauge et cible (TUNING.sensJauge / sensCible : 🔺 🔻 ↕️).
// Date: 2026-10-13
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

/** Nombre lisible : entier tel quel, très grand / très petit en exposant, sinon 6 chiffres significatifs. */
function benchFormatTuningValue(value) {
    if (Number.isInteger(value)) return String(value);
    if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(3);
    return parseFloat(value.toFixed(6)).toString();
}

/** Détail : pour chaque jauge, son sens, son explication, la mesure qui l'a classée, puis ses cibles (valeur lue par la
 *  physique dans DATA['🎚️'], plage 0 % → 100 %, rôle, source). */
function benchRenderTargets() {
    const T = window.DATA['🎚️'];
    const F = window.FINE_TUNING_BOUNDS;
    return '<p class="bench-ft-note">Une jauge par sens d\'effet : les paramètres n\'agissent pas tous dans le même sens. '
        + 'Classement mesuré : bilan net à la température graine de sept '
        + 'époques, chaque paramètre de sa borne basse à sa borne haute, les autres à 50 %.</p>'
        + Object.keys(F.jauges).map(function (j) {
            const J = F.jauges[j];
            const lignes = F.targets.filter(function (t) { return t.baryGroup === j; }).map(function (t) {
                return '<tr>'
                    + '<td class="bench-ft-key" title="' + window.TUNING.sensCible(t).titre + '">' + window.TUNING.sensCible(t).logo + ' ' + t.group + '.<b>' + t.key + '</b></td>'
                    + '<td class="bench-ft-num">' + benchFormatTuningValue(T[t.group][t.key]) + '</td>'
                    + '<td class="bench-ft-num">' + benchFormatTuningValue(t.min) + ' → ' + benchFormatTuningValue(t.max) + '</td>'
                    + '<td class="bench-ft-note">' + t.note + ' — ' + t.source + '</td>'
                    + '</tr>';
            }).join('');
            return '<h3>' + J.logo + ' ' + j + ' ' + T.baryByGroup[j] + ' % ' + window.TUNING.sensJauge(j).logo + ' — ' + J.titre + ' (' + window.TUNING.sensJauge(j).titre + ')</h3>'
                + '<p class="bench-ft-note">' + J.explication + '</p>'
                + '<p class="bench-ft-note">📏 ' + J.mesure + '</p>'
                + '<table class="bench-ft-table"><thead><tr><th>Paramètre</th><th>Valeur</th><th>Plage 0 % → 100 %</th>'
                + '<th>Rôle — source</th></tr></thead><tbody>' + lignes + '</tbody></table>';
        }).join('');
}

/** alt0sec d'une jauge : son nom (la clé de baryByGroup), ce qu'elle règle, sa position, son sens. */
function benchJaugeAlt0sec(j) {
    const sens = window.TUNING.sensJauge(j);
    return window.FINE_TUNING_BOUNDS.jauges[j].logo + ' ' + j + ' — ' + window.FINE_TUNING_BOUNDS.jauges[j].titre + ' — '
        + window.DATA['🎚️'].baryByGroup[j] + ' % — ' + sens.logo + ' ' + sens.titre;
}

/** alt2sec d'une jauge : son explication, la mesure qui l'a classée, puis chaque paramètre qu'elle déplace (valeur lue par
 *  la physique, plage 0 % → 100 %, rôle). */
function benchJaugeAlt2sec(j) {
    const J = window.FINE_TUNING_BOUNDS.jauges[j], T = window.DATA['🎚️'];
    return J.explication + '\n📏 ' + J.mesure + '\n'
        + window.FINE_TUNING_BOUNDS.targets.filter(function (t) { return t.baryGroup === j; }).map(function (t) {
            return window.TUNING.sensCible(t).logo + ' <b>' + t.key + '</b> = ' + benchFormatTuningValue(T[t.group][t.key]) + ' ' + t.unit
                + ' (0 % → 100 % : ' + benchFormatTuningValue(t.min) + ' → ' + benchFormatTuningValue(t.max) + ') — ' + t.note;
        }).join('\n');
}

/** Bulles des jauges remises à la valeur courante (tooltips.js relit data-tooltip / data-alt2sec à chaque survol). */
function benchSyncJaugeBulles() {
    document.querySelectorAll('[data-jauge-bulle]').forEach(function (el) {
        el.setAttribute('data-tooltip', benchJaugeAlt0sec(el.dataset.jaugeBulle));
        el.setAttribute('data-alt2sec', benchJaugeAlt2sec(el.dataset.jaugeBulle));
    });
}

/** Titre de la popup : combien de paramètres, sous combien de jauges. */
function benchDetailTitle() {
    const F = window.FINE_TUNING_BOUNDS;
    return '🧩 Fine-tuning — ' + F.targets.length + ' paramètres incertains, ' + Object.keys(F.jauges).length + ' jauges';
}

/** Construit l'en-tête (une jauge par rangée + bouton détail) et le contenu de la popup. */
function benchDisplayFineTuning() {
    const F = window.FINE_TUNING_BOUNDS;
    const bg = window.DATA['🎚️'].baryByGroup;
    document.getElementById('bench-ft-title-slot').innerHTML = '<span class="bench-ft-label">🧩 Fine-tuning</span>'
        + Object.keys(F.jauges).map(function (j) {
            return '<span class="bench-ft-jauge" data-jauge-bulle="' + j + '">'
                + F.jauges[j].logo
                + '<button type="button" class="bench-ft-pas" onclick="window.__BENCH_FT__.pas(\'' + j + '\', -1)">−1</button>'
                + '<input class="bench-ft-curseur" data-jauge="' + j + '" type="range" min="0" max="100" step="1" value="' + bg[j]
                + '" oninput="window.__BENCH_FT__.onInput(this.dataset.jauge, this.value)">'
                + '<button type="button" class="bench-ft-pas" onclick="window.__BENCH_FT__.pas(\'' + j + '\', 1)">+1</button>'
                + '<span data-jauge-pct="' + j + '">' + bg[j] + '%</span>'
                + '<span>' + window.TUNING.sensJauge(j).logo + '</span></span>';
        }).join('');   // le bouton « détail… » est hors de la fenêtre des jauges (#bench-ft-detail, epoch_bench.html)
    // Le sens est dans l'alt0sec de la jauge entière : plus de title sur son logo (deux bulles l'une dans l'autre).
    benchSyncJaugeBulles();
    document.querySelectorAll('[data-jauge-bulle]').forEach(function (el) {
        window.addTooltipFromAttribute(el);
        el.setAttribute('data-tooltip-initialized', 'true');
    });
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Remet jauges et valeurs à jour sans reconstruire l'en-tête (pas de rebuild pendant un glissé). */
function benchSyncFineTuningSlidersFromBary() {
    const bg = window.DATA['🎚️'].baryByGroup;
    document.querySelectorAll('.bench-ft-curseur').forEach(function (el) { el.value = String(bg[el.dataset.jauge]); });
    document.querySelectorAll('[data-jauge-pct]').forEach(function (el) { el.textContent = bg[el.dataset.jaugePct] + '%'; });
    benchSyncJaugeBulles();
    document.getElementById('bench-ft-dialog-title').textContent = benchDetailTitle();
    document.getElementById('bench-ft-content').innerHTML = benchRenderTargets();
}

/** Le banc parle : sync:tuning vers la page parente (index.html → sync_panels.js), sans relancer de calcul. */
function benchEmitTuningToParent() {
    if (window.parent === window) return;   // banc ouvert seul : personne à prévenir
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: { baryByGroup: Object.assign({}, window.DATA['🎚️'].baryByGroup), run: false }
    }, '*');
}

/** Bouton −1 / +1 : un cran de la jauge, borné à [0, 100]. */
function benchPasJauge(jauge, pas) {
    benchOnFineTuningBaryInput(jauge, Math.max(0, Math.min(100, window.DATA['🎚️'].baryByGroup[jauge] + pas)));
}

/** Glissé d'une jauge. */
function benchOnFineTuningBaryInput(jauge, percentRaw) {
    const bary = {};
    bary[jauge] = Number(percentRaw);
    window.TUNING.applyTuningPayload({ baryByGroup: bary });
    benchSyncFineTuningSlidersFromBary();
    benchEmitTuningToParent();
}
