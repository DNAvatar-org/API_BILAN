// File: API_BILAN/demo/js/graphe_forces.js
// Desc: Positionnement dynamique : les cellules se repoussent (charge en 1/d², plus collision de leurs
//       rectangles), restent liées à leur parent et à leurs enfants par des ressorts mesurés de bord à bord,
//       et plus faiblement à ce qu'elles appellent hors de l'arbre. Un pas par image, refroidi par alpha.
// Version 1.2.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_FORCES = {

    /** Demi-étendue d'une cellule dans la direction (ux, uy) : du centre à son bord. */
    demiEtendue: function (c, ux, uy) {
        const ax = Math.abs(ux) < 1e-9 ? Infinity : c.w / 2 / Math.abs(ux);
        const ay = Math.abs(uy) < 1e-9 ? Infinity : c.h / 2 / Math.abs(uy);
        return Math.min(ax, ay);
    },

    /** Ressort entre a et b : longueur au repos `L` entre leurs bords, mais jamais moins que `dMin` entre leurs
     *  centres ; raideur k. */
    ressort: function (a, b, L, k, dMin) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
        const ux = dx / d;
        const uy = dy / d;
        const F = window.GRAPHE_FORCES;
        const ecart = d - Math.max(dMin, L + F.demiEtendue(a, ux, uy) + F.demiEtendue(b, ux, uy));
        const f = k * ecart;
        a.vx += ux * f; a.vy += uy * f;
        b.vx -= ux * f; b.vy -= uy * f;
    },

    /** Une passe de collision : chaque paire de rectangles qui se chevauchent (marge comprise) est écartée sur
     *  l'axe le moins engagé — les cellules sont larges, c'est souvent la verticale. Une cellule tenue ne bouge pas,
     *  l'autre prend tout l'écart. Rend le nombre de vrais recouvrements (au-delà de la marge). */
    separer: function (vis, C) {
        const n = vis.length;
        let recouvrements = 0;
        for (let i = 0; i < n; i++) {
            const ci = vis[i];
            for (let j = i + 1; j < n; j++) {
                const cj = vis[j];
                const dx = cj.x - ci.x;
                const ox = (ci.w + cj.w) / 2 + C.marge - Math.abs(dx);
                if (ox <= 0) continue;
                const dy = cj.y - ci.y;
                const oy = (ci.h + cj.h) / 2 + C.marge - Math.abs(dy);
                if (oy <= 0 || (ci.fixe && cj.fixe)) continue;
                if (ox > C.marge && oy > C.marge) recouvrements++;
                const pi = ci.fixe ? 0 : cj.fixe ? 1 : 0.5;
                const pj = 1 - pi;
                if (ox < oy) {
                    const s = (dx < 0 ? -1 : 1) * ox * C.collision;
                    ci.x -= s * pi; cj.x += s * pj;
                } else {
                    const s = (dy < 0 ? -1 : 1) * oy * C.collision;
                    ci.y -= s * pi; cj.y += s * pj;
                }
            }
        }
        return recouvrements;
    },

    /** Un pas de simulation sur les cellules visibles. */
    pas: function () {
        const V = window.GRAPHE_VUE;
        const C = V.CONFIG;
        const P = V.parId;
        const a = V.alpha;
        const vis = V.visibles;
        const n = vis.length;
        const visible = new Set(vis);

        // Répulsion de toutes les paires.
        for (let i = 0; i < n; i++) {
            const ci = vis[i];
            for (let j = i + 1; j < n; j++) {
                const cj = vis[j];
                const dx = cj.x - ci.x;
                const dy = cj.y - ci.y;
                const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
                // Charge en 1/d², d pris de bord à bord (rayon moyen de chaque cellule) : deux cellules qui se
                // frôlent se repoussent fort, quelle que soit leur largeur.
                const e = Math.max(d - (ci.w + ci.h + cj.w + cj.h) / 4, 6);
                const f = C.repulsion * a / (e * e);
                ci.vx -= dx / d * f; ci.vy -= dy / d * f;
                cj.vx += dx / d * f; cj.vy += dy / d * f;
            }
        }

        vis.forEach(function (c) {
            // Lien d'arbre : vers l'ancre (le père, ou le plus proche ancêtre visible), et l'enfant poussé sous elle.
            // Plus le père a de fils, plus ils s'en éloignent : assez pour tenir côte à côte sur un cercle.
            if (c.ancre !== null) {
                const p = c.ancre;
                window.GRAPHE_FORCES.ressort(p, c, C.longueur, C.ressort * a, p.rayonEnfants * C.eventail);
                const sous = p.y + (p.h + c.h) / 2 + C.longueur * 0.5;
                if (c.y < sous) {
                    const f = (sous - c.y) * C.niveau * a;
                    c.vy += f; p.vy -= f / 2;
                }
            }
            // Appels hors de l'arbre : un ressort faible, plus long.
            if (V.voirCroises) {
                c.nd.croises.forEach(function (id) {
                    const b = P[id];
                    if (visible.has(b)) window.GRAPHE_FORCES.ressort(c, b, C.longueur * 3, C.croise * a, 0);
                });
            }
            c.vx -= c.x * C.gravite * a;
            c.vy -= c.y * C.gravite * a;
        });

        vis.forEach(function (c) {
            if (c.fixe) { c.vx = 0; c.vy = 0; return; }
            c.vx *= C.friction; c.vy *= C.friction;
            const v = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
            if (v > C.vitesseMax) { c.vx *= C.vitesseMax / v; c.vy *= C.vitesseMax / v; }
            c.x += c.vx; c.y += c.vy;
        });

        // Collisions après l'intégration, en plusieurs passes : ce sont les positions finales du pas qui ne se
        // chevauchent plus (une passe unique, avant les ressorts, laissait les amas se reformer).
        let chevauchements = 0;
        for (let k = 0; k < C.passes; k++) chevauchements = window.GRAPHE_FORCES.separer(vis, C);

        V.alpha *= C.refroidissement;
        // Au repos seulement quand plus rien ne se chevauche : sinon on continue au plus bas, collisions seules.
        if (V.alpha < C.alphaMin) V.alpha = chevauchements > 0 ? C.alphaMin : 0;
        V.sale = true;
    }
};
