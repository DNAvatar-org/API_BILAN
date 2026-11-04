// File: API_BILAN/demo/js/graphe_cellules.js
// Desc: Les cellules de la vue, une par fonction du moteur : texte (logo de l'alphabet, nom, clés du dico),
//       taille (texte mesuré, agrandie avec le nombre de
//       fils), position initiale en éventail autour du parent, pliage d'un sous-arbre, dossiers masqués, liste
//       des cellules visibles et ancre de chacune (son plus proche ancêtre visible).
// Version 1.2.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_CELLULES = {

    /** Une cellule par nœud de GRAPHE, mesurée avec la police de la vue. */
    creer: function () {
        const V = window.GRAPHE_VUE;
        const ctx = V.ctx;
        ctx.font = V.CONFIG.police;
        V.cellules = window.GRAPHE.noeuds.map(function (nd) {
            if (V.couleurs[nd.dossier] === undefined) {
                V.couleurs[nd.dossier] = V.PALETTE[Object.keys(V.couleurs).length % V.PALETTE.length];
            }
            // [logo de l'alphabet] module.nom [3 clés du dico les plus citées] — chaque morceau mesuré une fois.
            const logo = nd.logo === '' ? '' : nd.logo + ' ';
            const prefixe = nd.module === '' ? '' : nd.module.replace('.prototype', '#') + '.';
            const nom = nd.nom + (nd.recursif ? ' ↻' : '');
            const cles = nd.cles.length === 0 ? '' : '  ' + nd.cles.slice(0, 3).join(' ') + (nd.cles.length > 3 ? ' …' : '');
            return {
                nd: nd, logo: logo, prefixe: prefixe, nom: nom, cles: cles,
                lLogo: ctx.measureText(logo).width, lPrefixe: ctx.measureText(prefixe).width,
                lNom: ctx.measureText(nom).width, lCles: ctx.measureText(cles).width,
                s: 1, w: 0, h: 0, x: 0, y: 0, vx: 0, vy: 0, fixe: false, plie: false, nCaches: 0,
                ancre: null, attaches: [], rayonEnfants: 0,
                couleur: V.couleurs[nd.dossier]
            };
        });
        V.parId = {};
        V.cellules.forEach(function (c) { V.parId[c.nd.id] = c; });
        window.GRAPHE_CELLULES.mesurer();
        window.GRAPHE_CELLULES.placer();
        window.GRAPHE_CELLULES.recalculer(false);   // positions de placer() gardées
    },

    /** Échelle de chaque cellule : 1 + taille × √(nombre de fils). Tout le dessin de la cellule y est mis à l'échelle. */
    mesurer: function () {
        const V = window.GRAPHE_VUE;
        const C = V.CONFIG;
        V.cellules.forEach(function (c) {
            const n = c.nd.enfants.length;
            c.s = 1 + C.taille * Math.sqrt(n);
            c.w = (c.lLogo + c.lPrefixe + c.lNom + c.lCles + 2 * C.pad + (n ? C.badge : 0)) * c.s;
            c.h = C.hauteur * c.s;
        });
    },

    /** Position de départ : chaque arbre en éventail, les enfants dans le secteur angulaire de leur parent. */
    placer: function () {
        const V = window.GRAPHE_VUE;
        const racines = window.GRAPHE.racines.map(function (id) { return V.parId[id]; });
        const poser = function (c, angle, secteur, rayon) {
            const enfants = c.nd.enfants.map(function (id) { return V.parId[id]; });
            enfants.forEach(function (e, i) {
                const a = angle - secteur / 2 + secteur * (i + 0.5) / enfants.length;
                e.x = c.x + Math.cos(a) * rayon;
                e.y = c.y + Math.sin(a) * rayon;
                poser(e, a, Math.min(secteur, Math.PI * 0.9), rayon * 0.85);
            });
        };
        racines.forEach(function (r, i) {
            // La racine principale au centre ; les orphelins sur un grand cercle autour (déterministe).
            const a = i * 2.39996;   // angle d'or : pas d'empilement
            const rr = i === 0 ? 0 : 900 + 40 * Math.sqrt(i);
            r.x = Math.cos(a) * rr;
            r.y = Math.sin(a) * rr;
            poser(r, Math.PI / 2, i === 0 ? Math.PI * 1.6 : Math.PI, 160);
        });
    },

    /** Les cellules visibles ; pour chacune son ancre (plus proche ancêtre visible : un dossier masqué ne coupe
     *  pas l'arbre, ses descendants se rattachent au-dessus) ; pour chaque ancre, le rayon où ses fils tiennent. */
    recalculer: function (jaillir) {
        const V = window.GRAPHE_VUE;
        const C = V.CONFIG;
        const avant = new Set(V.visibles);
        const vis = [];
        const compter = function (c) {
            return c.nd.enfants.reduce(function (n, id) { return n + 1 + compter(V.parId[id]); }, 0);
        };
        V.cellules.forEach(function (c) { c.attaches = []; c.ancre = null; });
        const visiter = function (c, ancre) {
            const montre = V.dossiersCaches[c.nd.dossier] !== true;
            c.nCaches = c.plie ? compter(c) : 0;
            if (montre) {
                vis.push(c);
                c.ancre = ancre;
                if (ancre !== null) ancre.attaches.push(c);
            }
            if (!c.plie) c.nd.enfants.forEach(function (id) { visiter(V.parId[id], montre ? c : ancre); });
        };
        window.GRAPHE.racines.forEach(function (id) {
            const r = V.parId[id];
            if (!r.nd.orphelin || V.voirOrphelins) visiter(r, null);
        });
        // Les fils sur un cercle autour du père : périmètre = somme de leurs tailles (+ marge) → rayon.
        V.cellules.forEach(function (c) {
            c.rayonEnfants = c.attaches.reduce(function (s, e) { return s + (e.w + e.h) / 2 + C.marge; }, 0) / (2 * Math.PI);
        });
        // Une cellule qui apparaît (dépliée, dossier rallumé) jaillit de son ancre, déjà placée : l'ordre de `vis`
        // est celui de la descente, l'ancre y précède ses fils.
        if (jaillir) {
            vis.forEach(function (c, i) {
                if (avant.has(c) || c.ancre === null) return;
                const a = i * 2.39996;
                c.x = c.ancre.x + Math.cos(a) * 12; c.y = c.ancre.y + Math.sin(a) * 12 + 6;
                c.vx = 0; c.vy = 0;
            });
        }
        const apres = new Set(vis);
        if (V.survol !== null && !apres.has(V.survol)) { V.survol = null; V.survolBouton = null; }
        if (V.choix !== null && !apres.has(V.choix)) { V.choix = null; window.GRAPHE_UI.montrer(null); }
        V.visibles = vis;
        V.chauffer(0.5);
    },

    /** Replie / déplie une cellule ; ses enfants qui réapparaissent jaillissent de sa position. */
    basculer: function (c) {
        c.plie = !c.plie;
        window.GRAPHE_CELLULES.recalculer(true);
    },

    /** Replie toutes les cellules à partir d'une profondeur (Infinity : tout déplier). */
    plierDepuis: function (profondeur) {
        const V = window.GRAPHE_VUE;
        V.cellules.forEach(function (c) { c.plie = c.nd.enfants.length > 0 && c.nd.profondeur >= profondeur; });
        window.GRAPHE_CELLULES.recalculer(true);
    },

    /** Rend une cellule visible : son dossier, les orphelins s'il le faut, ses ancêtres dépliés. */
    devoiler: function (c) {
        const V = window.GRAPHE_VUE;
        V.dossiersCaches[c.nd.dossier] = false;
        V.voirOrphelins = V.voirOrphelins || c.nd.orphelin;
        const ancetres = [];
        for (let p = c.nd.parent; p !== null; p = V.parId[p].nd.parent) ancetres.unshift(V.parId[p]);
        ancetres.forEach(function (a) { a.plie = false; });
        window.GRAPHE_CELLULES.recalculer(true);
        window.GRAPHE_UI.legende();
    }
};
