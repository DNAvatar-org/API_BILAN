// File: API_BILAN/demo/js/graphe_ui.js
// Desc: Bandeau (curseurs des forces : l'id de chaque curseur est sa clé dans GRAPHE_VUE.CONFIG), légendes en
//       boutons on/off (liaisons, orphelines, dossiers), et panneau de la fonction choisie : fichier, appelants,
//       appelées, source.
// Version 1.2.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_UI = {
    // Nature d'un arc, telle qu'écrite dans le panneau (GRAPHE.noeuds[].natures).
    NATURES: { appel: '', rappel: 'passée en argument', deduit: 'alias déduit' },

    echapper: function (s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    brancher: function () {
        const V = window.GRAPHE_VUE;
        const U = window.GRAPHE_UI;
        document.querySelectorAll('#barre input[type=range]').forEach(function (inp) {
            inp.value = V.CONFIG[inp.id];
            const sortie = document.querySelector('output[for=' + inp.id + ']');
            sortie.textContent = inp.value;
            inp.addEventListener('input', function () {
                V.CONFIG[inp.id] = Number(inp.value);
                sortie.textContent = inp.value;
                V.chauffer(0.6);
            });
        });
        // La taille change l'emprise des cellules, donc aussi le rayon où les fils tiennent.
        document.getElementById('taille').addEventListener('input', function () {
            window.GRAPHE_CELLULES.mesurer();
            window.GRAPHE_CELLULES.recalculer(false);
        });
        document.getElementById('toutDeplier').addEventListener('click', function () {
            window.GRAPHE_CELLULES.plierDepuis(Infinity);
        });
        document.getElementById('replier').addEventListener('click', function () {
            window.GRAPHE_CELLULES.plierDepuis(Number(document.getElementById('niveauPli').value));
        });
        document.getElementById('desepingler').addEventListener('click', function () {
            V.cellules.forEach(function (c) { c.fixe = false; });
            V.chauffer(0.4);
        });
        document.getElementById('recentrer').addEventListener('click', U.recentrer);
        document.getElementById('agiter').addEventListener('click', function () { V.chauffer(1); });
        document.getElementById('legende').addEventListener('click', U.basculerLegende);
        document.getElementById('panneau').addEventListener('click', function (e) {
            if (e.target.id === 'fermer') { V.choix = null; U.montrer(null); V.sale = true; return; }
            const id = e.target.dataset.id;
            if (id !== undefined) U.aller(V.parId[id]);
        });
        U.legende();
        U.statut();
    },

    /** Un bouton de légende : data-bascule dit ce qu'il allume ou éteint. */
    bouton: function (bascule, allume, contenu, titre) {
        return '<button class="' + (allume ? '' : 'eteint') + '" data-bascule="' + bascule + '" title="' + titre + '">'
            + contenu + '</button>';
    },

    legende: function () {
        const V = window.GRAPHE_VUE;
        const U = window.GRAPHE_UI;
        const n = {};
        Object.keys(V.couleurs).forEach(function (d) { n[d] = 0; });
        window.GRAPHE.noeuds.forEach(function (nd) { n[nd.dossier]++; });
        document.getElementById('legende').innerHTML =
            '<span class="groupe">liaisons</span>'
            + U.bouton('voirArbre', V.voirArbre, '<b class="trait arbre"></b>père → fils', 'liens de l\'arbre (plus court chemin depuis api.run)')
            + U.bouton('voirCroises', V.voirCroises, '<b class="trait croise"></b>appels croisés', 'appels hors de l\'arbre')
            + U.bouton('voirOrphelins', V.voirOrphelins, 'orphelines', 'fonctions que api.run n\'atteint pas')
            + '<span class="note"><b class="trait plein"></b>appel <b class="trait rappel"></b>passée en argument'
            + ' <b class="trait deduit"></b>alias déduit</span>'
            + '<span class="note">survol : <b class="trait appele"></b>appelées <b class="trait appelant"></b>appelants'
            + ' <b class="trait pere"></b>père</span>'
            + '<span class="groupe">dossiers</span>'
            + Object.keys(V.couleurs).map(function (d) {
                return U.bouton('dossier:' + d, V.dossiersCaches[d] !== true,
                    '<i style="background:' + V.couleurs[d] + '"></i>' + d + ' <small>' + n[d] + '</small>', 'afficher / masquer ' + d);
            }).join('');
    },

    basculerLegende: function (e) {
        const V = window.GRAPHE_VUE;
        const b = e.target.closest('button');
        if (b === null) return;
        const cle = b.dataset.bascule;
        if (cle.indexOf('dossier:') === 0) {
            const d = cle.slice('dossier:'.length);
            V.dossiersCaches[d] = V.dossiersCaches[d] !== true;
        } else {
            V[cle] = !V[cle];
        }
        window.GRAPHE_CELLULES.recalculer(true);
        window.GRAPHE_UI.legende();
    },

    statut: function () {
        const G = window.GRAPHE;
        const atteintes = G.noeuds.filter(function (nd) { return !nd.orphelin; });
        const prof = Math.max.apply(null, atteintes.map(function (nd) { return nd.profondeur; }));
        const nArcs = G.noeuds.reduce(function (s, nd) { return s + nd.appels.length; }, 0);
        document.getElementById('statut').textContent = G.noeuds.length + ' fonctions · ' + nArcs + ' liaisons · '
            + atteintes.length + ' atteintes depuis api.run sur ' + prof + ' niveaux · '
            + (G.noeuds.length - atteintes.length) + ' orphelines';
    },

    /** Cadre la caméra sur les cellules visibles. */
    recentrer: function () {
        const V = window.GRAPHE_VUE;
        if (V.visibles.length === 0) return;
        const xs = V.visibles.map(function (c) { return c.x; });
        const ys = V.visibles.map(function (c) { return c.y; });
        const x0 = Math.min.apply(null, xs) - 120; const x1 = Math.max.apply(null, xs) + 120;
        const y0 = Math.min.apply(null, ys) - 60; const y1 = Math.max.apply(null, ys) + 60;
        const W = V.canvas.width / V.dpr;
        const H = V.canvas.height / V.dpr;
        const k = Math.min(2, W / (x1 - x0), H / (y1 - y0));
        V.camera.k = k;
        V.camera.x = W / 2 - (x0 + x1) / 2 * k;
        V.camera.y = H / 2 - (y0 + y1) / 2 * k;
        V.sale = true;
    },

    /** Sélectionne une cellule, la rend visible et centre la vue dessus. */
    aller: function (c) {
        const V = window.GRAPHE_VUE;
        window.GRAPHE_CELLULES.devoiler(c);
        V.choix = c;
        window.GRAPHE_UI.montrer(c);
        V.camera.x = V.canvas.width / V.dpr / 2 - c.x * V.camera.k;
        V.camera.y = V.canvas.height / V.dpr / 2 - c.y * V.camera.k;
    },

    /** Liste d'appelants (sens 'entrant') ou d'appelées ('sortant') de nd, avec le lien de l'arbre et la nature. */
    liste: function (ids, nd, sens) {
        const V = window.GRAPHE_VUE;
        const U = window.GRAPHE_UI;
        if (ids.length === 0) return '<p class="vide">—</p>';
        return '<ul>' + ids.map(function (id) {
            const c = V.parId[id];
            const arbre = sens === 'sortant' ? c.nd.parent === nd.id : nd.parent === id;
            const nature = sens === 'sortant' ? nd.natures[id] : c.nd.natures[nd.id];
            return '<li class="' + (arbre ? 'arbre' : 'croise') + '"><i style="background:' + c.couleur + '"></i>'
                + '<button data-id="' + id + '">' + id + '</button>'
                + (arbre ? '<small>' + (sens === 'sortant' ? 'fils' : 'père') + '</small>' : '')
                + (U.NATURES[nature] === '' ? '' : '<small>' + U.NATURES[nature] + '</small>') + '</li>';
        }).join('') + '</ul>';
    },

    /** Les clés de DATA que le source cite, avec leur sens (DESC) ; une catégorie seule est dite telle. */
    cles: function (nd) {
        const G = window.GRAPHE;
        if (nd.cles.length === 0) return '<p class="vide">—</p>';
        return '<dl class="cles">' + nd.cles.map(function (k) {
            const cat = G.dico.get(k);
            const sens = cat === k ? 'catégorie de DATA' : window.DESC[cat][k];
            return '<dt>' + k + '</dt><dd>' + window.GRAPHE_UI.echapper(sens) + '</dd>';
        }).join('') + '</dl>';
    },

    montrer: function (c) {
        const U = window.GRAPHE_UI;
        const p = document.getElementById('panneau');
        p.classList.toggle('ouvert', c !== null);
        if (c === null) { p.innerHTML = ''; return; }
        const nd = c.nd;
        const lignes = nd.source.split('\n');
        const extrait = lignes.slice(0, 80).join('\n') + (lignes.length > 80 ? '\n… (' + (lignes.length - 80) + ' lignes de plus)' : '');
        p.innerHTML = '<button id="fermer" title="fermer">✕</button>'
            + '<h2><i style="background:' + c.couleur + '"></i>' + nd.logo + ' ' + U.echapper(nd.id) + '</h2>'
            + '<p class="fichier">' + U.echapper(nd.fichier) + ' · profondeur ' + nd.profondeur
            + ' · ' + nd.enfants.length + ' fils' + (nd.orphelin ? ' · non atteinte depuis api.run' : '')
            + (nd.recursif ? ' · récursive ↻' : '')
            + (nd.alias.length > 1 ? '<br>aussi : ' + nd.alias.filter(function (a) { return a !== nd.id; }).join(', ') : '') + '</p>'
            + '<h3>Appelée par <small>' + nd.appelants.length + '</small></h3>' + U.liste(nd.appelants, nd, 'entrant')
            + '<h3>Appelle <small>' + nd.appels.length + '</small></h3>' + U.liste(nd.appels, nd, 'sortant')
            + '<h3>Clés du dico <small>' + nd.cles.length + '</small></h3>' + U.cles(nd)
            + '<h3>Source <small>' + lignes.length + ' lignes</small></h3><pre>' + U.echapper(extrait) + '</pre>';
    }
};
