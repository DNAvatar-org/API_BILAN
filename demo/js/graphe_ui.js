// File: API_BILAN/demo/js/graphe_ui.js
// Desc: Bandeau (curseurs des forces : l'id de chaque curseur est sa clé dans GRAPHE_VUE.CONFIG), légendes en
//       boutons on/off (liaisons, orphelines, dossiers rangés par thèmes avec bascule globale), et panneau de la fonction choisie : fichier, appelants,
//       appelées, clés du dico, équations qui la documentent, source.
// Version 1.4.0
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

    /** Les thèmes de la légende, avec leurs dossiers réels : le dernier (reste) reçoit tous ceux qu'aucun thème ne
     *  nomme, dans l'ordre où ils apparaissent. */
    themes: function () {
        const V = window.GRAPHE_VUE;
        const existants = Object.keys(V.couleurs);
        const nommes = new Set();
        V.THEMES.forEach(function (t) { t.dossiers.forEach(function (d) { nommes.add(d); }); });
        return V.THEMES.map(function (t) {
            const ds = t.dossiers.filter(function (d) { return existants.indexOf(d) >= 0; });
            return { nom: t.nom, dossiers: t.reste ? ds.concat(existants.filter(function (d) { return !nommes.has(d); })) : ds };
        });
    },

    legende: function () {
        const V = window.GRAPHE_VUE;
        const U = window.GRAPHE_UI;
        const total = {};
        const vus = {};
        Object.keys(V.couleurs).forEach(function (d) { total[d] = 0; vus[d] = 0; });
        window.GRAPHE.noeuds.forEach(function (nd) { total[nd.dossier]++; });
        V.visibles.forEach(function (c) { vus[c.nd.dossier]++; });
        document.getElementById('legende').innerHTML =
            '<div class="ligne"><span class="groupe">liaisons</span>'
            + U.bouton('voirArbre', V.voirArbre, '<b class="trait arbre"></b>père → fils', 'liens de l\'arbre (plus court chemin depuis api.run)')
            + U.bouton('voirCroises', V.voirCroises, '<b class="trait croise"></b>appels croisés', 'appels hors de l\'arbre')
            + U.bouton('voirOrphelins', V.voirOrphelins, 'orphelines', 'fonctions que api.run n\'atteint pas (CLICS, diagnostics, appelées par des fonctions privées)')
            + '<span class="note"><b class="trait plein"></b>appel <b class="trait rappel"></b>passée en argument'
            + ' <b class="trait deduit"></b>alias déduit</span>'
            + '<span class="note">survol : <b class="trait appele"></b>appelées <b class="trait appelant"></b>appelants'
            + ' <b class="trait pere"></b>père</span></div>'
            + U.themes().map(function (t, i) {
                const allumes = t.dossiers.filter(function (d) { return V.dossiersCaches[d] !== true; }).length;
                const etat = allumes === t.dossiers.length ? '' : allumes === 0 ? 'eteint' : 'partiel';
                return '<div class="ligne"><button class="theme ' + etat + '" data-bascule="theme:' + i
                    + '" title="tout afficher / tout masquer">' + t.nom + '</button>'
                    + t.dossiers.map(function (d) {
                        return U.bouton('dossier:' + d, V.dossiersCaches[d] !== true,
                            '<i style="background:' + V.couleurs[d] + '"></i>' + d + ' <small>' + vus[d] + '/' + total[d] + '</small>',
                            vus[d] + ' visibles sur ' + total[d] + ' (repliées, orphelines masquées ou dossier éteint)');
                    }).join('') + '</div>';
            }).join('');
    },

    basculerLegende: function (e) {
        const V = window.GRAPHE_VUE;
        const b = e.target.closest('button');
        if (b === null) return;
        const cle = b.dataset.bascule;
        if (cle.indexOf('theme:') === 0) {
            // Tout allumé → tout éteint ; sinon (éteint ou partiel) → tout allumé.
            const ds = window.GRAPHE_UI.themes()[Number(cle.slice('theme:'.length))].dossiers;
            const toutAllume = ds.every(function (d) { return V.dossiersCaches[d] !== true; });
            ds.forEach(function (d) { V.dossiersCaches[d] = toutAllume; });
        } else if (cle.indexOf('dossier:') === 0) {
            const d = cle.slice('dossier:'.length);
            V.dossiersCaches[d] = V.dossiersCaches[d] !== true;
        } else {
            V[cle] = !V[cle];
        }
        window.GRAPHE_CELLULES.recalculer(true);   // recalculer redessine la légende (compteurs)
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

    /** Liste d'appelants (sens 'entrant') ou d'appelées ('sortant') de nd, avec le lien de l'arbre et la nature ;
     *  au plus `max` lignes (la fiche du survol), puis leur nombre. */
    liste: function (ids, nd, sens, max) {
        const V = window.GRAPHE_VUE;
        const U = window.GRAPHE_UI;
        if (ids.length === 0) return '<p class="vide">—</p>';
        return '<ul>' + ids.slice(0, max).map(function (id) {
            const c = V.parId[id];
            const arbre = sens === 'sortant' ? c.nd.parent === nd.id : nd.parent === id;
            const nature = sens === 'sortant' ? nd.natures[id] : c.nd.natures[nd.id];
            return '<li class="' + (arbre ? 'arbre' : 'croise') + '"><i style="background:' + c.couleur + '"></i>'
                + '<button data-id="' + id + '">' + id + '</button>'
                + (arbre ? '<small>' + (sens === 'sortant' ? 'fils' : 'père') + '</small>' : '')
                + (U.NATURES[nature] === '' ? '' : '<small>' + U.NATURES[nature] + '</small>') + '</li>';
        }).join('') + (ids.length > max ? '<li class="plus">… ' + (ids.length - max) + ' de plus</li>' : '') + '</ul>';
    },

    /** Les clés de DATA que le source cite, avec leur sens (DESC) ; une catégorie seule est dite telle. */
    cles: function (nd, max) {
        const G = window.GRAPHE;
        if (nd.cles.length === 0) return '<p class="vide">—</p>';
        return '<dl class="cles">' + nd.cles.slice(0, max).map(function (k) {
            const cat = G.dico.get(k);
            const sens = cat === k ? 'catégorie de DATA' : window.DESC[cat][k];
            return '<dt>' + k + '</dt><dd>' + window.GRAPHE_UI.echapper(sens) + '</dd>';
        }).join('') + (nd.cles.length > max ? '<dt>…</dt><dd>' + (nd.cles.length - max) + ' de plus</dd>' : '') + '</dl>';
    },

    /** Les cartes de doc/equation.html qui nomment la fonction (GRAPHE_DOC) : liens dans le panneau, simple texte dans
     *  la fiche du survol (elle ne prend pas la souris). */
    docs: function (nd, max, complete) {
        const U = window.GRAPHE_UI;
        if (nd.docs.length === 0) return '<p class="vide">—</p>';
        return '<ul class="docs">' + nd.docs.slice(0, max).map(function (c) {
            const texte = '<span class="cl ' + c.classe + '">' + c.marque + '</span>' + U.echapper(c.titre);
            return '<li>' + (complete
                ? '<a href="' + window.GRAPHE_DOC.lien(c) + '" target="_blank" rel="noopener" title="ouvrir la carte dans la page des équations">' + texte + '</a>'
                : '<span>' + texte + '</span>') + '</li>';
        }).join('') + (nd.docs.length > max ? '<li class="plus">… ' + (nd.docs.length - max) + ' de plus</li>' : '') + '</ul>';
    },

    /** La fiche d'une fonction : complète dans le panneau (tout, et le source), courte au survol (listes écourtées). */
    fiche: function (c, complete) {
        const U = window.GRAPHE_UI;
        const nd = c.nd;
        const max = complete ? Infinity : 8;
        const lignes = nd.source.split('\n');
        const extrait = lignes.slice(0, 80).join('\n') + (lignes.length > 80 ? '\n… (' + (lignes.length - 80) + ' lignes de plus)' : '');
        return '<h2><i style="background:' + c.couleur + '"></i>' + nd.logo + ' ' + U.echapper(nd.id) + '</h2>'
            + '<p class="fichier">' + U.echapper(nd.fichier) + ' · profondeur ' + nd.profondeur
            + ' · ' + nd.enfants.length + ' fils' + (nd.orphelin ? ' · non atteinte depuis api.run' : '')
            + (nd.recursif ? ' · récursive ↻' : '')
            + (nd.alias.length > 1 ? '<br>aussi : ' + nd.alias.filter(function (a) { return a !== nd.id; }).join(', ') : '') + '</p>'
            + '<h3>Appelée par <small>' + nd.appelants.length + '</small></h3>' + U.liste(nd.appelants, nd, 'entrant', max)
            + '<h3>Appelle <small>' + nd.appels.length + '</small></h3>' + U.liste(nd.appels, nd, 'sortant', max)
            + '<h3>Clés du dico <small>' + nd.cles.length + '</small></h3>' + U.cles(nd, max)
            + '<h3>Équations <small>' + nd.docs.length + '</small></h3>' + U.docs(nd, max, complete)
            + (complete ? '<h3>Source <small>' + lignes.length + ' lignes</small></h3><pre>' + U.echapper(extrait) + '</pre>'
                : '<p class="aide-fiche">clic : fiche complète, source et liens vers les équations</p>');
    },

    montrer: function (c) {
        const p = document.getElementById('panneau');
        p.classList.toggle('ouvert', c !== null);
        p.innerHTML = c === null ? '' : '<button id="fermer" title="fermer">✕</button>' + window.GRAPHE_UI.fiche(c, true);
    },

    /** La fiche du survol, à côté du curseur (sx, sy : px dans la scène), retournée vers l'intérieur près des bords.
     *  c === null la cache. Ne prend pas la souris (pointer-events: none) : le survol continue dessous. */
    survoler: function (c, sx, sy) {
        const f = document.getElementById('fiche');
        if (c === null) { f.hidden = true; f.dataset.id = ''; return; }
        if (f.dataset.id !== c.nd.id) { f.innerHTML = window.GRAPHE_UI.fiche(c, false); f.dataset.id = c.nd.id; }
        f.hidden = false;
        const sc = f.parentElement;
        const x = sx + 18 + f.offsetWidth > sc.clientWidth ? sx - 18 - f.offsetWidth : sx + 18;
        const y = Math.min(Math.max(8, sy + 14), Math.max(8, sc.clientHeight - f.offsetHeight - 8));
        f.style.left = Math.max(8, x) + 'px';
        f.style.top = y + 'px';
    }
};
