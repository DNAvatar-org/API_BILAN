// File: API_BILAN/graphe/graphe_arbre.js
// Desc: L'arbre couvrant du graphe d'appels : parcours en largeur depuis api.run (chaque fonction a pour parent
//       le premier appelant qui l'atteint, donc au plus court chemin ; ses enfants dans l'ordre où le source les
//       appelle). Les autres appels restent des arcs croisés. Les fonctions que run n'atteint pas forment leurs
//       propres arbres (orphelins), enracinés sur celles qu'aucun orphelin n'appelle.
// Version 1.0.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_ARBRE = {

    /** Largeur d'abord depuis `racines` ; pose parent, enfants, profondeur sur les nœuds non encore placés. */
    parcourir: function (racines, estOrphelin) {
        const P = window.GRAPHE.parId;
        const file = [];
        racines.forEach(function (nd) {
            if (nd.profondeur !== -1) return;
            nd.profondeur = 0; nd.parent = null; nd.orphelin = estOrphelin;
            file.push(nd);
        });
        while (file.length) {
            const nd = file.shift();
            nd.appels.forEach(function (id) {
                const c = P[id];
                if (c.profondeur !== -1) return;
                c.profondeur = nd.profondeur + 1; c.parent = nd.id; c.orphelin = estOrphelin;
                nd.enfants.push(c.id);
                file.push(c);
            });
        }
    },

    /** Pose sur chaque nœud : parent, enfants, profondeur, orphelin, croises (appels qui ne sont pas des arcs d'arbre). */
    construire: function () {
        const G = window.GRAPHE;
        G.noeuds.forEach(function (nd) { nd.profondeur = -1; nd.parent = null; nd.enfants = []; nd.orphelin = false; });
        window.GRAPHE_ARBRE.parcourir([G.parId[G.racine]], false);
        const restants = G.noeuds.filter(function (nd) { return nd.profondeur === -1; });
        const appeleParOrphelin = new Set();
        restants.forEach(function (nd) { nd.appels.forEach(function (id) { appeleParOrphelin.add(id); }); });
        // D'abord les orphelins que personne n'appelle ; puis ceux d'un cycle sans entrée (un par cycle suffit).
        window.GRAPHE_ARBRE.parcourir(restants.filter(function (nd) { return !appeleParOrphelin.has(nd.id); }), true);
        restants.forEach(function (nd) { window.GRAPHE_ARBRE.parcourir([nd], true); });
        G.noeuds.forEach(function (nd) {
            nd.croises = nd.appels.filter(function (id) { return G.parId[id].parent !== nd.id; });
        });
        G.racines = G.noeuds.filter(function (nd) { return nd.profondeur === 0; }).map(function (nd) { return nd.id; });
    }
};
