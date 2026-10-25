// File: API_BILAN/doc/js/bibliographie.js
// Desc: Page doc/BIBLIOGRAPHIE.html — sous chaque référence, ses usages et leur statut (data/episteme.js), puis la page rangée
//       en deux parties lues dans ces mêmes liens : PHYSIQUE (au moins un usage entre dans le calcul) et OBSERVATIONS (la courbe
//       cyan d'Histoire, ou une comparaison 🎯 seulement). Les thèmes du fichier restent, à l'intérieur de chaque partie.
//       Chargé en fin de <body> (après les <article class="ref">).
// Version 2.0.0 — 2026-10-25 : parties Physique / Observations.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';

(function () {
    const R = window.EPISTEME_RENDU, E = window.EPISTEME;
    // Chaque référence citée par un lien doit exister ici, chaque statut et usage être connu : une faute de frappe dans
    // episteme.js crashe, visible.
    for (const l of E.LIENS) {
        if (l.ref !== null && !document.getElementById(l.ref)) throw new Error('[bibliographie] episteme.js cite [' + l.ref + '], absente de la bibliographie');
        if (!E.STATUTS.includes(l.statut) || !E.USAGES.includes(l.usage)) throw new Error('[bibliographie] statut ou usage inconnu : ' + JSON.stringify(l));
    }
    // Un lien d'observation : la courbe cyan, ou une cible à valider qui n'entre pas dans le calcul.
    const observation = (l) => l.cible.startsWith('histoire:') || l.usage === '🎯';
    const PARTIES = {
        physique: { titre: 'Ⅰ. Physique — ce qui entre dans le calcul',
            texte: 'Équations, constantes, mesures et reconstructions que le modèle pose, parcourt ou dont il part : au moins un usage 🛠 '
                + 'entre dans le bilan radiatif. Une référence qui sert aussi de comparaison porte la mention « aussi observation ».' },
        observations: { titre: 'Ⅱ. Observations — ce à quoi le modèle se compare',
            texte: 'La courbe cyan de l’onglet Histoire (températures publiées sur 5 Ga) et les cibles 🎯 : fourchettes du banc, seuils '
                + 'publiés, bilans mesurés. Aucune n’entre dans le calcul — le modèle est là pour les valider ou les invalider.' }
    };

    // Sous chaque référence, ses usages ; sa partie se lit dans ces liens.
    const partie = {}, aussi = [];
    document.querySelectorAll('article.ref').forEach((a) => {
        const liens = R.parRef(a.id);
        if (!liens.length) throw new Error('[bibliographie] [' + a.id + '] n’a aucun lien dans episteme.js : son statut et son usage manquent');
        partie[a.id] = liens.every(observation) ? 'observations' : 'physique';
        if (partie[a.id] === 'physique' && liens.some(observation)) {
            a.querySelector('.cite-key').insertAdjacentHTML('beforeend', ' <span class="aussi-obs">· aussi observation</span>');
            aussi.push(a.id);
        }
        a.insertAdjacentHTML('beforeend', R.bloc(liens, 'cible', 'BIBLIOGRAPHIE.html', 'equation.html'));
    });

    // Les thèmes du fichier (h2) et leurs références, dans l'ordre.
    const themes = [...document.querySelectorAll('h2[id^="sec-"]')].map((h) => {
        const refs = [];
        for (let n = h.nextElementSibling; n !== null && n.tagName !== 'H2' && n.tagName !== 'SCRIPT'; n = n.nextElementSibling) {
            if (n.matches('article.ref')) refs.push(n);
        }
        return { id: h.id, titre: h.textContent.replace(/^\d+\.\s*/, ''), h, refs };
    });

    // Les deux parties, chacune avec ses thèmes non vides ; le sommaire suit.
    const nav = document.querySelector('nav.toc');
    let sommaire = '';
    let ancre = nav;
    for (const [cle, P] of Object.entries(PARTIES)) {
        const section = document.createElement('section');
        section.className = 'partie';
        section.id = 'partie-' + cle;
        section.innerHTML = '<h2>' + P.titre + '</h2><p class="sec-note">' + P.texte + '</p>';
        const liensTheme = [];
        let nombre = 0;
        for (const t of themes) {
            const refs = t.refs.filter((a) => partie[a.id] === cle);
            if (!refs.length) continue;
            const h3 = document.createElement('h3');
            h3.id = cle + '-' + t.id;
            h3.textContent = t.titre + ' (' + refs.length + ')';
            section.append(h3, ...refs);
            liensTheme.push('<a href="#' + h3.id + '">' + t.titre + '</a>');
            nombre += refs.length;
        }
        if (cle === 'observations') {
            section.insertAdjacentHTML('beforeend', '<h3 id="observations-aussi">Aussi en Physique (' + aussi.length + ')</h3><p class="sec-note">'
                + 'Ces références entrent dans le calcul et servent aussi de comparaison : ' + aussi.map((id) => '<a href="#' + id + '">[' + id + ']</a>').join(' ') + '</p>');
            liensTheme.push('<a href="#observations-aussi">Aussi en Physique</a>');
        }
        section.querySelector('h2').textContent = P.titre + ' (' + nombre + ')';
        ancre.after(section);
        ancre = section;
        sommaire += '<div class="toc-partie"><a href="#' + section.id + '"><strong>' + P.titre + '</strong></a> (' + nombre + ') : ' + liensTheme.join(' · ') + '</div>';
    }
    themes.forEach((t) => t.h.remove());
    nav.innerHTML = '<strong>Sommaire :</strong>' + sommaire;
})();
