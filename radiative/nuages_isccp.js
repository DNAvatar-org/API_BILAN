// File: API_BILAN/radiative/nuages_isccp.js - Simulateur ISCCP : les nuages du modèle VUS D'EN HAUT
// Desc: Je dis ce qu'un satellite passif (ISCCP) verrait de la colonne nuageuse du modèle, pour la comparer à la mesure
//       (data/isccp_h_2010.js). Le modèle superpose ses couches (bas, moyens, hauts) en recouvrement aléatoire ; le satellite,
//       lui, range chaque colonne au niveau de son SOMMET et lui attribue l'épaisseur optique de TOUTE la colonne (les couches
//       cachées comprises). C'est le principe des simulateurs des modèles de climat (Klein & Jakob 1999 ; COSP).
//       Sous-colonnes : nuage haut présent (f_H) → sommet H ; sinon moyen (f_M) → M ; sinon bas (f_B) → L ; τ de colonne =
//       somme des τ visibles présents, chacun tiré de sa population (radiative/solaire.js). Classes ISCCP : τ ≤ 3,55 ; ≤ 22,63 ;
//       > 22,63. τ moyen RADIATIF : réflectance moyennée (deux-flux conservatif de solaire.js) puis inversée, comme la référence.
//       Diagnostic seul : rien de ce qui est calculé ici ne rentre dans le bilan.
//       DÉTECTION : un satellite passif ne voit pas une couche de τ < 0,3 (seuil du simulateur ISCCP de COSP ; Klein & Jakob
//       1999, Pincus et al. 2012) — elle n'est pas un sommet, la colonne est rangée à la couche visible suivante (ou claire).
//       Approximation DÉCLARÉE : ISCCP abaisse aussi le sommet des nuages minces visibles (« location adjusted ») ; pas ici.
// Version 1.2.1
// - v1.2.1 (2026-10-25): réflectance d'inversion à l'asymétrie G_ASYMETRIE (solaire.js prend celle de chaque nuage).
// - v1.2.0 (2026-10-15): seuil de détection τ ≥ 0,3 (une couche plus mince est invisible : le sommet vu est la couche visible suivante).
// - v1.1.0 (2026-10-15): échantillons pondérés (populations de nuages bas océan / continent, colonne.populations).
// Date: [October 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const CLASSES_TAU = [3.55, 22.63];   // bornes ISCCP (cloud_type_label des fichiers ISCCP-H)
    const TAU_DETECTION = 0.3;           // [-] couche invisible en dessous (COSP)
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
        const R = (tau) => window.SOLAIRE.nuageVisible(tau, window.EARTH.NUAGES.G_ASYMETRIE).R;
        const acc = { L: [[0, 0], [0, 0], [0, 0]], M: [[0, 0], [0, 0], [0, 0]], H: [[0, 0], [0, 0], [0, 0]] };
        // Chaque couche : absente (1 − f) ou un échantillon de sa population ; toutes les combinaisons (recouvrement aléatoire).
        const etats = (f, ech) => [{ tau: 0, w: 1 - f }].concat(ech.map((e) => ({ tau: e.tau, w: f * e.w })));
        const H = etats(fH, E.hauts), M = etats(fM, E.moyens), L = etats(fB, E.bas);
        for (const h of H) for (const m of M) for (const l of L) {
            const w = h.w * m.w * l.w;
            if (w === 0) continue;
            const niv = h.tau >= TAU_DETECTION ? 'H' : m.tau >= TAU_DETECTION ? 'M' : l.tau >= TAU_DETECTION ? 'L' : null;
            if (niv === null) continue;                                        // rien de visible : ciel clair pour le satellite
            const tau = h.tau + m.tau + l.tau;
            const c = acc[niv][classe(tau)];
            c[0] += w; c[1] += w * R(tau);
        }
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
