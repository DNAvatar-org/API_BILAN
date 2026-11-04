// File: API_BILAN/demo/js/graphe_memoire.js
// Desc: L'état de la vue gardé dans localStorage, retrouvé au F5 : position de chaque cellule, épinglées, repliées
//       (sans mémoire, tout est déplié), caméra, légendes on/off, curseurs. Écrit quand la simulation se pose, à
//       chaque repli et en quittant la page. Une fonction apparue dans le moteur depuis jaillit de son père ; une
//       fonction disparue est oubliée.
// Version 1.0.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_MEMOIRE = {
    CLE: 'graphe_moteur',
    VERSION: 2,          // forme de l'état gardé : un état d'une autre forme est ignoré (2 : dossier Externe,
                         // croisés décochés et répulsion 200 par défaut)

    /** L'état gardé, ou null (rien de gardé, ou d'une autre forme). */
    lire: function () {
        const s = localStorage.getItem(window.GRAPHE_MEMOIRE.CLE);
        if (s === null) return null;
        const g = JSON.parse(s);
        return g.v === window.GRAPHE_MEMOIRE.VERSION ? g : null;
    },

    /** Les réglages gardés : ceux qui ont un curseur dans le bandeau (l'id du curseur est la clé de CONFIG). Les autres
     *  restent ceux du code. */
    curseurs: function () {
        return Array.from(document.querySelectorAll('#barre input[type=range]')).map(function (i) { return i.id; });
    },

    garder: function () {
        const V = window.GRAPHE_VUE;
        const cellules = {};
        V.cellules.forEach(function (c) {
            cellules[c.nd.id] = [Math.round(c.x * 10) / 10, Math.round(c.y * 10) / 10, c.fixe ? 1 : 0, c.plie ? 1 : 0];
        });
        localStorage.setItem(window.GRAPHE_MEMOIRE.CLE, JSON.stringify({
            v: window.GRAPHE_MEMOIRE.VERSION,
            cellules: cellules,
            camera: V.camera,
            voirArbre: V.voirArbre, voirCroises: V.voirCroises, voirOrphelins: V.voirOrphelins,
            dossiersCaches: V.dossiersCaches,
            config: window.GRAPHE_MEMOIRE.curseurs().reduce(function (o, k) { o[k] = V.CONFIG[k]; return o; }, {})
        }));
    },

    /** Remet l'état gardé sur les cellules déjà créées et placées (placer). Rend true s'il y en avait un. */
    restaurer: function () {
        const V = window.GRAPHE_VUE;
        const g = window.GRAPHE_MEMOIRE.lire();
        if (g === null) return false;
        window.GRAPHE_MEMOIRE.curseurs().forEach(function (k) { V.CONFIG[k] = g.config[k]; });
        V.camera = g.camera;
        V.voirArbre = g.voirArbre; V.voirCroises = g.voirCroises; V.voirOrphelins = g.voirOrphelins;
        V.dossiersCaches = g.dossiersCaches;
        const places = new Set();
        V.cellules.forEach(function (c) {
            const e = g.cellules[c.nd.id];
            if (e === undefined) return;
            c.x = e[0]; c.y = e[1]; c.fixe = e[2] === 1; c.plie = e[3] === 1;
            places.add(c);
        });
        // Les nouvelles venues, de haut en bas : chacune près de son père, déjà placé.
        V.cellules.slice().sort(function (a, b) { return a.nd.profondeur - b.nd.profondeur; }).forEach(function (c, i) {
            if (places.has(c) || c.nd.parent === null) return;
            const p = V.parId[c.nd.parent];
            const a = i * 2.39996;
            c.x = p.x + Math.cos(a) * 30; c.y = p.y + Math.sin(a) * 30 + 10;
            places.add(c);
        });
        window.GRAPHE_CELLULES.mesurer();   // la taille dépend du curseur gardé
        return true;
    },

    /** Oublie l'état gardé et recharge : la vue de départ, tout déplié. */
    oublier: function () {
        const M = window.GRAPHE_MEMOIRE;
        window.removeEventListener('pagehide', M.garder);
        document.removeEventListener('visibilitychange', M.cachee);
        localStorage.removeItem(M.CLE);
        location.reload();
    },

    cachee: function () {
        if (document.visibilityState === 'hidden') window.GRAPHE_MEMOIRE.garder();
    },

    brancher: function () {
        window.addEventListener('pagehide', window.GRAPHE_MEMOIRE.garder);
        document.addEventListener('visibilitychange', window.GRAPHE_MEMOIRE.cachee);
        document.getElementById('oublier').addEventListener('click', window.GRAPHE_MEMOIRE.oublier);
    }
};
