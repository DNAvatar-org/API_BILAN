// File: API_BILAN/demo/js/graphe_main.js
// Desc: Amorce de graphe.html : charge le moteur par BILAN_LOADER en relevant ce que pose chaque script,
//       lit la page des équations (documentation de chaque fonction), extrait le graphe d'appels (API_BILAN/graphe/), crée les cellules (état gardé s'il y en a un), puis boucle : un pas de forces et un
//       dessin par image tant que la simulation n'est pas au repos.
// Version 1.3.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_MAIN = {

    dimensionner: function () {
        const V = window.GRAPHE_VUE;
        const r = V.canvas.parentElement.getBoundingClientRect();
        V.dpr = Math.min(2, window.devicePixelRatio);
        V.canvas.width = Math.round(r.width * V.dpr);
        V.canvas.height = Math.round(r.height * V.dpr);
        V.canvas.style.width = r.width + 'px';
        V.canvas.style.height = r.height + 'px';
        V.sale = true;
    },

    boucle: function () {
        const V = window.GRAPHE_VUE;
        if (V.alpha > 0) {
            window.GRAPHE_FORCES.pas();
            if (V.alpha === 0) window.GRAPHE_MEMOIRE.garder();   // posée : c'est la position courante
        }
        if (V.sale) window.GRAPHE_RENDU.dessiner();
        requestAnimationFrame(window.GRAPHE_MAIN.boucle);
    },

    demarrer: function () {
        const V = window.GRAPHE_VUE;
        const M = window.GRAPHE_MAIN;
        window.GRAPHE_EXTRACTION.extraire();
        window.GRAPHE_ARBRE.construire();
        window.GRAPHE_DOC.lier();
        V.canvas = document.getElementById('graphe');
        V.ctx = V.canvas.getContext('2d');
        window.GRAPHE_RENDU.lireCouleurs();
        M.dimensionner();
        window.GRAPHE_CELLULES.creer();
        const retrouve = window.GRAPHE_MEMOIRE.restaurer();
        window.GRAPHE_CELLULES.recalculer(false);
        window.GRAPHE_ENTREES.brancher();
        window.GRAPHE_UI.brancher();
        window.GRAPHE_MEMOIRE.brancher();
        // La scène change de taille avec la fenêtre ET quand le panneau s'ouvre ou se ferme.
        new ResizeObserver(M.dimensionner).observe(V.canvas.parentElement);
        if (retrouve) {
            V.alpha = 0;
            V.chauffer(0.05);   // l'état gardé est déjà posé : juste résorber ce qui a changé (tailles, nouvelles venues)
        } else {
            // Laisser l'arbre se déplier hors écran, puis cadrer : quelques centaines de pas sans dessin.
            for (let i = 0; i < 300; i++) window.GRAPHE_FORCES.pas();
            window.GRAPHE_UI.recentrer();
            V.chauffer(0.3);
        }
        document.getElementById('chargement').remove();
        M.boucle();
    },

    charger: function () {
        const api = '../';   // API_BILAN/ vu de demo/
        const avant = ['js/demo_host.js'];
        const etat = document.getElementById('chargement');
        const relever = window.GRAPHE_EXTRACTION.releveur(api, avant.length);
        const moteur = window.BILAN_LOADER.load({
            apiBase: api,
            before: avant,
            after: [],
            cacheBust: '',
            onLoaded: function (src, rang, total) {
                relever(src, rang);
                etat.textContent = 'Chargement du moteur… ' + (rang + 1) + ' / ' + total;
            }
        });
        // Le moteur et la page des équations (documentation des fonctions) se chargent ensemble.
        Promise.all([moteur, window.GRAPHE_DOC.charger('../doc/equation.html')]).then(window.GRAPHE_MAIN.demarrer);
    }
};

window.GRAPHE_MAIN.charger();
