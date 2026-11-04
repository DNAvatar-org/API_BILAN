// File: API_BILAN/demo/js/graphe_entrees.js
// Desc: Souris sur le canvas. Bouton +/− d'une cellule, ou double-clic sur elle = replier / déplier ses appelées. Glisser une cellule la
//       déplace (le reste suit par les ressorts) ; Maj au lâcher l'épingle. Glisser le fond déplace la vue,
//       molette = zoom sous le curseur. Clic = sélection. Un seul geste à la fois (premier pointeur).
// Version 1.1.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_ENTREES = {
    geste: null,   // { id, type: 'cellule' | 'vue' | 'bouton', c, dx, dy, sx, sy, cx, cy, epinglee, bouge }

    monde: function (e) {
        const V = window.GRAPHE_VUE;
        const r = V.canvas.getBoundingClientRect();
        const sx = e.clientX - r.left;
        const sy = e.clientY - r.top;
        return { sx: sx, sy: sy, x: (sx - V.camera.x) / V.camera.k, y: (sy - V.camera.y) / V.camera.k };
    },

    /** La cellule visible sous le point (la dernière dessinée gagne). */
    toucher: function (x, y) {
        const vis = window.GRAPHE_VUE.visibles;
        for (let i = vis.length - 1; i >= 0; i--) {
            const c = vis[i];
            if (Math.abs(x - c.x) <= c.w / 2 && Math.abs(y - c.y) <= c.h / 2) return c;
        }
        return null;
    },

    /** Le point est-il sur le bouton +/− de c (mêmes cotes que graphe_rendu, à l'échelle c.s) ? */
    surBouton: function (c, x, y) {
        const C = window.GRAPHE_VUE.CONFIG;
        if (c.nd.enfants.length === 0) return false;
        const bx = c.x - c.w / 2 + (c.w / c.s - C.badge / 2 - 2) * c.s;
        const r = (C.badge / 2) * c.s;
        return (x - bx) * (x - bx) + (y - c.y) * (y - c.y) <= r * r;
    },

    /** Fin du geste : la cellule reprend son épinglage (Maj l'inverse) ; un clic sans glisser sélectionne. */
    finir: function (e, annule) {
        const V = window.GRAPHE_VUE;
        const E = window.GRAPHE_ENTREES;
        const g = E.geste;
        E.geste = null;
        if (g.type === 'vue') {
            if (!g.bouge && !annule) { V.choix = null; window.GRAPHE_UI.montrer(null); }
            V.sale = true;
            return;
        }
        if (g.type === 'bouton') {
            if (!annule) window.GRAPHE_CELLULES.basculer(g.c);
            return;
        }
        g.c.fixe = e.shiftKey && !annule ? !g.epinglee : g.epinglee;
        if (!g.bouge && !annule) { V.choix = g.c; window.GRAPHE_UI.montrer(g.c); }
        V.chauffer(0.2);
    },

    brancher: function () {
        const V = window.GRAPHE_VUE;
        const E = window.GRAPHE_ENTREES;
        const cv = V.canvas;

        cv.addEventListener('pointerdown', function (e) {
            if (E.geste !== null) return;   // un second doigt n'interrompt pas le geste en cours
            const m = E.monde(e);
            const c = E.toucher(m.x, m.y);
            cv.setPointerCapture(e.pointerId);
            if (c === null) {
                E.geste = { id: e.pointerId, type: 'vue', sx: m.sx, sy: m.sy, cx: V.camera.x, cy: V.camera.y, bouge: false };
            } else if (E.surBouton(c, m.x, m.y)) {
                E.geste = { id: e.pointerId, type: 'bouton', c: c };
            } else {
                E.geste = { id: e.pointerId, type: 'cellule', c: c, dx: m.x - c.x, dy: m.y - c.y, sx: m.sx, sy: m.sy,
                    epinglee: c.fixe, bouge: false };
                c.fixe = true;
            }
        });

        cv.addEventListener('pointermove', function (e) {
            const m = E.monde(e);
            const g = E.geste;
            if (g === null) {
                const c = E.toucher(m.x, m.y);
                const b = c !== null && E.surBouton(c, m.x, m.y) ? c : null;
                if (c !== V.survol || b !== V.survolBouton) { V.survol = c; V.survolBouton = b; V.sale = true; }
                cv.style.cursor = c === null ? 'grab' : 'pointer';
                cv.title = b === null ? '' : b.plie ? 'déplier (' + b.nCaches + ' cachées)' : 'replier';
                return;
            }
            if (g.id !== e.pointerId || g.type === 'bouton') return;
            g.bouge = g.bouge || Math.abs(m.sx - g.sx) + Math.abs(m.sy - g.sy) > 3;
            if (g.type === 'vue') {
                V.camera.x = g.cx + m.sx - g.sx;
                V.camera.y = g.cy + m.sy - g.sy;
                V.sale = true;
                return;
            }
            g.c.x = m.x - g.dx;
            g.c.y = m.y - g.dy;
            V.chauffer(0.3);
        });

        // Un relâchement sans appui sur le canvas (appui sur le bandeau, puis glissé) n'a pas de geste : rien à finir.
        cv.addEventListener('pointerup', function (e) {
            if (E.geste !== null && E.geste.id === e.pointerId) E.finir(e, false);
        });
        cv.addEventListener('pointercancel', function (e) {
            if (E.geste !== null && E.geste.id === e.pointerId) E.finir(e, true);
        });

        cv.addEventListener('pointerleave', function () {
            if (V.survol !== null) { V.survol = null; V.survolBouton = null; V.sale = true; }
        });

        // Double-clic sur une cellule = son bouton +/−. Sur le bouton lui-même, ses deux clics ont déjà basculé.
        cv.addEventListener('dblclick', function (e) {
            const m = E.monde(e);
            const c = E.toucher(m.x, m.y);
            if (c !== null && c.nd.enfants.length && !E.surBouton(c, m.x, m.y)) window.GRAPHE_CELLULES.basculer(c);
        });

        cv.addEventListener('wheel', function (e) {
            e.preventDefault();
            const m = E.monde(e);
            const k = Math.min(4, Math.max(0.05, V.camera.k * Math.exp(-e.deltaY * 0.0015)));
            V.camera.x = m.sx - m.x * k;
            V.camera.y = m.sy - m.y * k;
            V.camera.k = k;
            V.sale = true;
        }, { passive: false });
    }
};
