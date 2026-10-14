// File: API_BILAN/doc/js/episteme_rendu.js
// Desc: Rendu des liens épistémiques (data/episteme.js) : une ligne « 🧭 statut · 🛠 usage · [référence] · ce qui est pris ».
//       Partagé par doc/equation.html, doc/BIBLIOGRAPHIE.html et demo/dico.html. Libellés au survol : CHARS_DESC (alphabet.js).
// Version 1.0.0
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';

window.EPISTEME_RENDU = (function () {
    const E = window.EPISTEME, D = window.CHARS_DESC;
    const logo = (c) => '<span class="ep-logo" title="' + D[c] + '">' + c + '</span>';
    // Où mène une cible, vue depuis la bibliographie.
    const NATURE = { eq: 'équation', dico: 'clé', config: 'config', histoire: 'courbe Histoire' };

    return {
        /** Les liens dont la cible ou la référence vaut `valeur`. */
        parCible: (cible) => E.LIENS.filter((l) => l.cible === cible),
        parRef: (ref) => E.LIENS.filter((l) => l.ref === ref),

        /** Une ligne. `vers` = 'ref' (afficher la référence, lien vers la bibliographie à `cheminBiblio`) ou 'cible'. */
        ligne: function (l, vers, cheminBiblio, cheminEquations) {
            let objet;
            if (vers === 'ref') {
                objet = l.ref === null ? '<i>sans publication</i>' : '<a href="' + cheminBiblio + '#' + l.ref + '">[' + l.ref + ']</a>';
            } else {
                const [nature, id] = [l.cible.slice(0, l.cible.indexOf(':')), l.cible.slice(l.cible.indexOf(':') + 1)];
                objet = NATURE[nature] + ' ' + (nature === 'eq' ? '<a href="' + cheminEquations + '#' + id + '">' + id + '</a>' : '<code>' + id + '</code>');
            }
            return '<div class="ep-ligne">' + logo(E.AXE) + logo(l.statut) + ' ' + logo(E.USAGE) + logo(l.usage) + ' ' + objet + ' — ' + l.quoi + '</div>';
        },

        /** Bloc de lignes, ou '' s'il n'y a aucun lien. */
        bloc: function (liens, vers, cheminBiblio, cheminEquations) {
            return liens.length ? '<div class="episteme">' + liens.map((l) => this.ligne(l, vers, cheminBiblio, cheminEquations)).join('') + '</div>' : '';
        }
    };
})();
