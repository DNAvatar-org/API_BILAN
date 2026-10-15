// File: API_BILAN/radiative/nuages_isccp.js - Simulateur ISCCP : les nuages du modèle VUS D'EN HAUT
// Desc: Je dis ce qu'un satellite passif (ISCCP) verrait de la colonne nuageuse du modèle, pour la comparer à la mesure
//       (data/isccp_h_2010.js). Le modèle superpose ses couches (bas, moyens, hauts) en recouvrement aléatoire ; le satellite,
//       lui, range chaque colonne au niveau de son SOMMET et lui attribue l'épaisseur optique de TOUTE la colonne (les couches
//       cachées comprises). C'est le principe des simulateurs des modèles de climat (Klein & Jakob 1999 ; COSP).
//       Sous-colonnes : nuage haut présent (f_H) → sommet H ; sinon moyen (f_M) → M ; sinon bas (f_B) → L ; τ de colonne =
//       somme des τ visibles présents, chacun tiré de sa population (radiative/solaire.js). Classes ISCCP : τ ≤ 3,55 ; ≤ 22,63 ;
//       > 22,63. τ moyen RADIATIF : réflectance moyennée (deux-flux conservatif de solaire.js) puis inversée, comme la référence.
//       Diagnostic seul : rien de ce qui est calculé ici ne rentre dans le bilan.
//       Approximation DÉCLARÉE : ISCCP abaisse le sommet des nuages optiquement minces (« location adjusted ») ; pas ici.
// Version 1.1.0
// - v1.1.0 (2026-10-15): échantillons pondérés (populations de nuages bas océan / continent, colonne.populations).
// Date: [October 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const CLASSES_TAU = [3.55, 22.63];   // bornes ISCCP (cloud_type_label des fichiers ISCCP-H)
    const N_MOYENS = 5;                  // échantillons de la population des nuages moyens (comme solaire.js)

    const classe = (tau) => (tau <= CLASSES_TAU[0] ? 0 : tau <= CLASSES_TAU[1] ? 1 : 2);
    /** τ dont la réflectance deux-flux conservative vaut r (inverse de SOLAIRE.nuageVisible). */
    function tauDeReflectance(r) {
        const b = 2 * r / (1 - r);
        return b / (Math.sqrt(3) * (1 - window.EARTH.NUAGES.G_ASYMETRIE));
    }

    /** Échantillons des populations : [{ tau, w }] (poids de somme 1) — mêmes tirages que radiative/solaire.js. */
    function echantillons(colonne) {
        const S = window.SOLAIRE;
        const tirer = (n) => {
            const out = [];
            for (const pop of colonne.populations) {
                for (let j = 0; j < n; j++) out.push({ tau: S.etatNuage(pop.tranches, (j + 0.5) / n).tauSW, w: pop.poids / n });
            }
            return out;
        };
        const hauts = [];
        S.moyenneHauts((t) => { hauts.push({ tau: t, w: 0 }); return 0; });
        hauts.forEach((h) => { h.w = 1 / hauts.length; });
        return { bas: tirer(10), moyens: tirer(N_MOYENS), hauts: hauts };
    }

    /**
     * Nuages vus d'en haut. Renvoie { niveaux: { L, M, H : { a, tau, classes: [{ a, tau } × 3] } }, total: { a, tau } },
     * même forme que window.ISCCP_H_2010 (a : quantité vue d'en haut, tau : τ moyen radiatif de la colonne).
     */
    function vusDenHaut(colonne) {
        const fB = colonne.fBas, fM = colonne.fMoyen, fH = colonne.fHaut;
        const E = echantillons(colonne);
        const R = (tau) => window.SOLAIRE.nuageVisible(tau).R;
        const acc = { L: [[0, 0], [0, 0], [0, 0]], M: [[0, 0], [0, 0], [0, 0]], H: [[0, 0], [0, 0], [0, 0]] };
        const ajouter = (niv, tau, w) => { const c = acc[niv][classe(tau)]; c[0] += w; c[1] += w * R(tau); };
        // Couches sous le sommet : présentes avec leur fraction, chaque échantillon de même poids.
        const dessous = (avecMoyen) => {
            const L = [{ tau: 0, w: 1 - fB }].concat(E.bas.map((e) => ({ tau: e.tau, w: fB * e.w })));
            if (!avecMoyen) return L;
            const M = [{ tau: 0, w: 1 - fM }].concat(E.moyens.map((e) => ({ tau: e.tau, w: fM * e.w })));
            const out = [];
            for (const m of M) for (const l of L) out.push({ tau: m.tau + l.tau, w: m.w * l.w });
            return out;
        };
        for (const h of E.hauts) for (const d of dessous(true)) ajouter('H', h.tau + d.tau, fH * h.w * d.w);
        for (const m of E.moyens) for (const d of dessous(false)) ajouter('M', m.tau + d.tau, (1 - fH) * fM * m.w * d.w);
        for (const l of E.bas) ajouter('L', l.tau, (1 - fH) * (1 - fM) * fB * l.w);
        const out = { niveaux: {}, total: null };
        let aT = 0, rT = 0;
        for (const niv of ['L', 'M', 'H']) {
            let aN = 0, rN = 0;
            const classes = acc[niv].map(([a, r]) => { aN += a; rN += r; return { a: a, tau: a > 0 ? tauDeReflectance(r / a) : 0 }; });
            out.niveaux[niv] = { a: aN, tau: aN > 0 ? tauDeReflectance(rN / aN) : 0, classes: classes };
            aT += aN; rT += rN;
        }
        out.total = { a: aT, tau: aT > 0 ? tauDeReflectance(rT / aT) : 0 };
        return out;
    }

    window.NUAGES_ISCCP = { CLASSES_TAU: CLASSES_TAU, vusDenHaut: vusDenHaut };
})();
