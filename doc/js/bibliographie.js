// File: API_BILAN/doc/js/bibliographie.js
// Desc: Page doc/BIBLIOGRAPHIE.html — sous chaque référence, ses usages et leur statut (data/episteme.js) : 🧭 d'où vient
//       la connaissance, 🛠 ce que le modèle en fait, et la cible (équation, clé, config, courbe Histoire).
//       Chargé en fin de <body> (après les <article class="ref">).
// Version 1.0.0
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';

(function () {
    const R = window.EPISTEME_RENDU;
    // Chaque référence citée par un lien doit exister ici : une faute de frappe dans episteme.js crashe, visible.
    for (const l of window.EPISTEME.LIENS) {
        if (l.ref !== null && !document.getElementById(l.ref)) throw new Error('[bibliographie] episteme.js cite [' + l.ref + '], absente de la bibliographie');
    }
    document.querySelectorAll('article.ref').forEach((a) => {
        a.insertAdjacentHTML('beforeend', R.bloc(R.parRef(a.id), 'cible', 'BIBLIOGRAPHIE.html', 'equation.html'));
    });
})();
