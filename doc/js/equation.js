// File: API_BILAN/doc/js/equation.js
// Desc: Page doc/equation.html — configuration MathJax, source LaTeX sous chaque formule, compte des classes
//       (P / M / F / C / N / ⚠️) lu sur la page elle-même, hauteur envoyée à la modale parente (iframe).
//       Chargé AVANT le script MathJax (window.MathJax doit exister quand MathJax démarre).
// Version 1.1.0
// Date: [October 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Logs:
//   - v1.1.0 (2026-10-14): liens épistémiques 🧭 / 🛠 sous chaque carte (data/episteme.js, js/episteme_rendu.js).
//   - v1.0.0 (2026-10-13): sorti des scripts en ligne de equation.html ; compte des classes ajouté.

'use strict';

/** Compte les cartes .eq par classe et l'écrit dans #compte (la page est la seule source du compte). */
function compterClasses() {
    const noms = { P: 'physique', M: 'mesure', F: 'fourchette', C: 'calage', N: 'numérique', X: 'sans source' };
    const n = { P: 0, M: 0, F: 0, C: 0, N: 0, X: 0 };
    document.querySelectorAll('.eq').forEach((e) => {
        for (const k in n) if (e.classList.contains(k)) n[k]++;
    });
    const total = Object.values(n).reduce((s, v) => s + v, 0);
    document.getElementById('compte').innerHTML = '<b>' + total + '</b> équations et réglages : '
        + Object.keys(n).map((k) => '<span class="cl ' + k + '">' + (k === 'X' ? '⚠️' : k) + '</span> ' + n[k] + ' ' + noms[k]).join(' · ');
}

/** Ajoute sous chaque formule son code LaTeX, sélectionnable (copier dans un article, un autre outil). */
function ajouterSourcesLatex() {
    document.querySelectorAll('.eq .f').forEach((f) => {
        const tex = f.getAttribute('data-tex');
        const d = document.createElement('div');
        d.className = 'latex-source';
        d.textContent = tex;
        f.appendChild(d);
    });
}

/** Sous chaque carte, ses liens épistémiques (data/episteme.js) : 🧭 d'où vient la connaissance, 🛠 ce que le modèle en fait. */
function afficherEpisteme() {
    document.querySelectorAll('.eq[id]').forEach((c) => {
        const html = window.EPISTEME_RENDU.bloc(window.EPISTEME_RENDU.parCible('eq:' + c.id), 'ref', 'BIBLIOGRAPHIE.html', 'equation.html');
        if (html) c.querySelector('.code').insertAdjacentHTML('beforebegin', html);
    });
}

/** Hauteur du document → modale parente (CO2/static/ui/modal.js écoute 'resize-iframe'). */
function envoyerHauteur() {
    const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    window.parent.postMessage({ type: 'resize-iframe', height: h }, '*');
}

// Les formules sont écrites une fois, dans l'attribut data-tex de chaque .f : MathJax les rend, la source LaTeX
// affichée en dessous est la même chaîne (pas de seconde copie à tenir à jour).
function poserFormules() {
    document.querySelectorAll('.eq .f').forEach((f) => {
        f.textContent = '$$' + f.getAttribute('data-tex') + '$$';
    });
}

window.MathJax = {
    tex: { inlineMath: [['\\(', '\\)']], displayMath: [['$$', '$$']] },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
    startup: {
        ready: () => {
            poserFormules();
            compterClasses();
            afficherEpisteme();
            MathJax.startup.defaultReady();
            MathJax.startup.promise.then(() => {
                ajouterSourcesLatex();
                envoyerHauteur();
            });
        }
    }
};

window.addEventListener('resize', envoyerHauteur);
