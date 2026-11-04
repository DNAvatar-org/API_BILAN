// File: API_BILAN/demo/js/graphe_etat.js
// Desc: État de la vue du graphe d'appels (GRAPHE_VUE) : réglages des forces (chaque curseur de la page porte
//       l'id de sa clé dans CONFIG), caméra, cellules, sélection. Le graphe lui-même est GRAPHE (API_BILAN/graphe/).
// Version 1.2.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_VUE = {
    CONFIG: {
        repulsion: 200,       // charge des cellules : force ∝ repulsion / d², entre toutes les cellules visibles
        ressort: 0.08,        // raideur du lien parent → enfant
        longueur: 46,         // longueur au repos du lien, de bord à bord des cellules (px monde)
        eventail: 1,          // × le rayon où les fils d'un père tiennent côte à côte (0 = longueur seule)
        taille: 0.2,          // échelle d'une cellule = 1 + taille × √(nombre de fils)
        niveau: 0.06,         // pousse l'enfant sous son parent (0 = libre, l'arbre s'étale en étoile)
        croise: 0.006,        // raideur des appels qui ne sont pas des liens d'arbre
        gravite: 0.0015,      // rappel de tout vers l'origine (les forêts d'orphelins restent en vue)
        collision: 0.8,       // fraction du chevauchement corrigée par passe, sur les positions (non amortie par alpha)
        passes: 3,            // passes de collision par pas, après l'intégration
        marge: 10,            // écart minimal entre deux cellules (px monde)
        friction: 0.6,        // vitesse conservée d'un pas au suivant
        vitesseMax: 40,       // px monde par pas
        refroidissement: 0.988,
        alphaMin: 0.003,
        hauteur: 22,          // hauteur d'une cellule
        pad: 8,               // marge intérieure horizontale
        police: '12px ui-monospace, "SF Mono", Menlo, monospace',
        badge: 20             // place du « +N » d'une cellule repliée
    },
    // Teinte par dossier du moteur : la couleur dit où vit la fonction.
    PALETTE: ['#5aa9e6', '#f4a259', '#8bd17c', '#e56b8f', '#b28dff', '#4fd1c5', '#f6d55c', '#ff8a5b',
        '#9fb3c8', '#d4a5ff', '#7bdff2', '#c3e88d', '#ffb4a2', '#a0c4ff', '#ffd6a5', '#caffbf'],
    // Thèmes de la légende, chacun avec sa bascule globale. Le dernier (reste: true) prend ses dossiers puis tous ceux
    // qu'aucun thème ne nomme.
    THEMES: [
        { nom: 'physique', dossiers: ['physics', 'radiative', 'spectroscopy'] },
        { nom: 'moteur', dossiers: ['api', 'config', 'workers', 'data', 'convergence'] },
        { nom: 'terre', dossiers: ['geology'], reste: true }
    ],
    couleurs: {},             // dossier → couleur
    cellules: [],             // une par nœud du graphe
    parId: {},                // id → cellule
    visibles: [],             // cellules simulées et dessinées (ni repliées sous un ancêtre, ni orphelines ou dossier masqués)
    camera: { x: 0, y: 0, k: 1 },   // écran = monde × k + (x, y)
    alpha: 1,                 // température de la simulation (1 = agitée, 0 = au repos)
    survol: null,
    survolBouton: null,       // cellule dont le bouton +/− est sous la souris
    choix: null,
    voirArbre: true,          // liens père → fils
    voirCroises: false,       // appels hors de l'arbre
    voirOrphelins: false,
    dossiersCaches: {},       // dossier → true quand son bouton de légende est éteint
    sale: true,               // un dessin est à refaire
    canvas: null,
    ctx: null,
    dpr: 1,

    /** Réveille la simulation (au moins à `a`). */
    chauffer: function (a) {
        const V = window.GRAPHE_VUE;
        V.alpha = Math.max(V.alpha, a);
        V.sale = true;
    }
};
