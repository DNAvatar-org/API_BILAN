// File: API_BILAN/radiative/solaire.js - Rayonnement solaire dans l'atmosphère (Lacis & Hansen 1974)
// Desc: Je calcule l'albédo au SOMMET de l'atmosphère (🍰🪩📿 avant voile) à partir de l'albédo de la surface, de la
//       vapeur, de l'ozone, de la diffusion de Rayleigh et des nuages — le schéma de Lacis & Hansen (1974, J. Atmos.
//       Sci. 31:118), ajusté sur des calculs de diffusion multiple (doubling-adding) et standard du modèle GISS.
//       Avant (≤ 2026-10-12) : albédo = surface + nuage par addition à 2 couches, SANS atmosphère — tout le soleil
//       arrivait au sol ou repartait ; or la vapeur absorbe une grande part du proche infrarouge (éq. 21) AU-DESSUS des
//       nuages, et le nuage réfléchit moins qu'un nuage sans absorption.
// Version 1.0.0
// Date: [October 13, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
//
// Tout ce qui suit est tiré de l'article (numéros d'équations entre parenthèses) :
//   · 64,7 % du flux solaire hors des bandes de la vapeur (λ < 0,9 µm), 35,3 % dedans (§5) ;
//   · ozone : A_oz(x) = A_vis(x) + A_uv(x) (8, 9), chemin direct x = u·M, M = 35/√(1224 μ₀² + 1) (11, 12),
//     remontée diffuse M̄ = 1,9 (13) ; absorption totale A_oz(uM) + R̄·[A_oz(uM + M̄u) − A_oz(uM)] (14, 15) ;
//   · Rayleigh : albédo du ciel clair R̄_r(μ₀) = 0,28/(1 + 6,43 μ₀), sphérique R̄*_r = 0,0685 (41) ; albédo effectif
//     pour l'ozone R̄_a = 0,219/(1 + 0,816 μ₀), R̄*_a = 0,144 (18) ;
//   · vapeur : distribution des coefficients d'absorption k_n, poids p(k_n), 8 termes (table 1, ajustée sur
//     l'absorptivité de Yamamoto (21) à 0,1 % près) ; eau précipitable effective y·(P/P₀)·√(T₀/T) (24), calculée
//     par le profil (RADIATIVE.profilAtmosphere) ; trajet direct M, diffus 5/3 (25–27) ;
//   · nuage : deux-flux de Sagan & Pollack (31), g = 0,85, couches additionnées (33) ; la vapeur du nuage et
//     l'absorption des gouttes (≈ 0,08 cm d'eau équivalente pour τ = 8, §4) entrent dans ω ;
//   · surface : partie visible (40) en ciel clair, (42) sous nuage.
// Moyenne GLOBALE : l'hémisphère éclairé d'une sphère est uniformément réparti en μ₀ ∈ [0,1] ; le flux absorbé moyen
// est donc ∫ A(μ₀)·2μ₀ dμ₀ — de la géométrie, pas un angle « effectif » choisi (quadrature de Gauss-Legendre).

(function () {
    'use strict';

    const LH = {
        K: [4e-5, 0.002, 0.035, 0.377, 1.95, 9.40, 44.6, 190.0],                       // [cm⁻¹] table 1
        P: [0.6470, 0.0698, 0.1443, 0.0584, 0.0335, 0.0225, 0.0158, 0.0087],           // [-]    table 1
        PART_VISIBLE: 0.647,        // [-] hors bandes de la vapeur (§5)
        M_DIFFUS_OZONE: 1.9,        // [-] (13)
        M_DIFFUS: 5 / 3,            // [-] (25–27)
        G: 0.85,                    // [-] facteur d'asymétrie des gouttes (Hansen & Pollack 1970)
        W_GOUTTES_PAR_TAU: 0.08 / 8 // [cm] absorption des gouttes ≈ vapeur équivalente (§4, τ = 8 → 0,08 cm)
    };
    // Ozone : colonne actuelle et dépendance à l'O₂. ⚠️ MESURE + LOI DÉCLARÉE : colonne moyenne actuelle ~300 DU
    // (0,30 cm STP) ; modèles photochimiques 1D, 124 DU à 1 % du niveau actuel d'O₂ (Segura et al. 2003) — loi de
    // puissance par ces deux points, exposant ln(300/124)/ln(100) = 0,19. Un modèle 3D (Cooke et al. 2022, WACCM6)
    // donne 66 DU à 1 % : incertitude d'un facteur 2 aux faibles O₂.
    const OZONE = {
        COLONNE_ACTUELLE_CM: 0.30,  // [cm STP]
        P_O2_ACTUELLE_ATM: 0.2095,  // [atm]
        EXPOSANT: Math.log(300 / 124) / Math.log(100)   // [-]
    };
    // Gauss-Legendre 4 points sur [0,1].
    const GL_X = [0.0694318442, 0.3300094782, 0.6699905218, 0.9305681558];
    const GL_W = [0.1739274226, 0.3260725774, 0.3260725774, 0.1739274226];
    // Population de nuages : profondeurs relatives u au milieu de N intervalles égaux de [0,1].
    const N_POPULATION = 10;

    /** Fraction du flux solaire total absorbée par une colonne d'ozone x [cm STP] (8, 9). */
    function aOz(x) {
        const vis = 0.02118 * x / (1 + 0.042 * x + 0.000323 * x * x);
        const uv = 1.082 * x / Math.pow(1 + 138.6 * x, 0.805) + 0.0658 * x / (1 + Math.pow(103.6 * x, 3));
        return vis + uv;
    }

    /** Réflexion et transmission diffuses d'une couche (τ, ω, g) — deux-flux de Sagan & Pollack 1967 (31). */
    function couche(tau, omega, g) {
        if (tau === 0) return { R: 0, T: 1 };                         // couche vide
        if (1 - omega < 1e-9) {                                      // diffusion conservative : limite de (31) = (19)
            const b = Math.sqrt(3) * (1 - g) * tau;
            const R = b / (2 + b);
            return { R: R, T: 1 - R };
        }
        const u = Math.sqrt((1 - g * omega) / (1 - omega));
        const t = Math.sqrt(3 * (1 - omega) * (1 - g * omega)) * tau;
        const e2 = Math.exp(-2 * t);                                 // forme divisée par e^t : stable pour t grand
        const D = (u + 1) * (u + 1) - (u - 1) * (u - 1) * e2;
        return { R: (u * u - 1) * (1 - e2) / D, T: 4 * u * Math.exp(-t) / D };
    }

    /** État cumulé du nuage à la profondeur relative u (interpolation dans les tranches du profil). */
    function etatNuage(tranches, u) {
        const P = tranches.profondeur;
        if (P.length === 1) return { tauSW: 0, tauIR: 0, wMoyen: 0, wSature: 0 };   // pas de nuage : épaisseur nulle
        const d = u * P[P.length - 1];
        let i = 1;
        while (i < P.length - 1 && P[i] < d) i++;
        const a = (P[i] - P[i - 1]) > 0 ? (d - P[i - 1]) / (P[i] - P[i - 1]) : 0;
        const v = (cle) => tranches[cle][i - 1] + a * (tranches[cle][i] - tranches[cle][i - 1]);
        return { tauSW: v('tauSW'), tauIR: v('tauIR'), wMoyen: v('wMoyen'), wSature: v('wSature') };
    }

    /** Moyenne d'une grandeur sur la population de nuages (toutes profondeurs de 0 au sommet également représentées). */
    function moyennePopulation(tranches, fn) {
        let s = 0;
        for (let j = 0; j < N_POPULATION; j++) s += fn(etatNuage(tranches, (j + 0.5) / N_POPULATION));
        return s / N_POPULATION;
    }

    /** Facteur de colonne de Rayleigh : nombre de molécules par m² rapporté à la Terre actuelle (τ_R ∝ P/(g·M)). */
    function facteurRayleigh() {
        const DATA = window.DATA;
        if (DATA['🫧']['🎈'] === 0) return 0;                       // sans atmosphère (⚫) : rien ne diffuse
        return DATA['🫧']['🎈'] * (9.80665 / DATA['📅']['🍎']) * (0.02897 / DATA['🫧']['🧪']);
    }
    /** Albédo d'une couche conservative R = aτ/(1 + aτ) : épaisseur multipliée par s à partir de R₁ (valeur à s = 1). */
    function rayleigh(R1, s) {
        const t1 = R1 / (1 - R1);
        return s * t1 / (1 + s * t1);
    }

    /** Colonne d'ozone [cm STP] (OZONE ci-dessus). */
    function colonneOzone() {
        const DATA = window.DATA;
        const CONST = window.CONST;
        const f = DATA['🫧'];
        if (DATA['🫧']['🎈'] === 0) return 0;                       // sans atmosphère (⚫) : pas d'ozone
        const n = f['🍰🫧🏭'] / CONST.M_CO2 + f['🍰🫧🐄'] / CONST.M_CH4 + f['🍰🫧🫁'] / CONST.M_O2 + f['🍰🫧💨'] / CONST.M_N2;
        const pO2 = (f['🍰🫧🫁'] / CONST.M_O2) / n * DATA['🫧']['🎈'];
        return OZONE.COLONNE_ACTUELLE_CM * Math.pow(pO2 / OZONE.P_O2_ACTUELLE_ATM, OZONE.EXPOSANT);
    }

    // Nuages hauts : N_HAUTS valeurs de τ visible, ln τ uniforme sur [TAU_HAUT_MIN, TAU_HAUT_MAX] (physics.js).
    const N_HAUTS = 8;
    /** Moyenne d'une grandeur sur la population de nuages hauts. */
    function moyenneHauts(fn) {
        const N = window.EARTH.NUAGES;
        const a = Math.log(N.TAU_HAUT_MIN), b = Math.log(N.TAU_HAUT_MAX);
        let s = 0;
        for (let j = 0; j < N_HAUTS; j++) s += fn(Math.exp(a + (b - a) * (j + 0.5) / N_HAUTS));
        return s / N_HAUTS;
    }

    /** Couche nuageuse conservative dans le visible (19) : { R, T = 1 − R }. */
    function nuageVisible(tau) {
        const b = Math.sqrt(3) * (1 - LH.G) * tau;
        const R = b / (2 + b);
        return { R: R, T: 1 - R };
    }
    /** Empilement de couches symétriques posé sur un dessous de réflexion Rb : R = R₁ + T₁²·Rb/(1 − R₁·Rb) (33). */
    function poser(c, Rb) { return c.R + c.T * c.T * Rb / (1 - c.R * Rb); }

    /**
     * Albédo d'une colonne nuageuse pour μ₀ : nuage haut (τ_H, 0 = absent) au-dessus, nuage bas (état c, null =
     * absent), vapeur entre eux et dessous, sol Rg. Visible : (42) généralisé à l'empilement des nuages ; bandes de la
     * vapeur : addition (30–33) bande par bande.
     */
    function colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, tauH, c) {
        const W = colonne.wTotal;
        // ── Visible : nuages conservatifs empilés (sans sol), puis sol.
        const haut = nuageVisible(tauH);
        const bas = nuageVisible(c ? c.tauSW : 0);
        const Rstack = poser(haut, bas.R);
        const Tstack = 1 - Rstack;
        const Rbar = Rstack + Tstack * Tstack * Rg / (1 - Rstack * Rg);
        const vis = LH.PART_VISIBLE - (ozDescente + Rbar * ozRemontee)
            - (LH.PART_VISIBLE - ozDescente) * Tstack * (1 - Rg) / (1 - Rstack * Rg);
        // ── Bandes de la vapeur : de bas en haut — sol, vapeur sous le nuage bas, nuage bas, vapeur au-dessus, nuage haut.
        const wSous = c ? colonne.wSousBase : W;
        const wNuageBas = c ? c.wSature + LH.W_GOUTTES_PAR_TAU * c.tauSW : 0;
        const wEntre = c ? Math.max(0, W - colonne.wSousBase - c.wMoyen) : 0;
        const wGlace = LH.W_GOUTTES_PAR_TAU * tauH;                   // absorption des cristaux (même estimation, §4)
        let nir = 0;
        for (let n = 1; n < LH.K.length; n++) {
            const k = LH.K[n];
            let R = Rg * Math.exp(-2 * LH.M_DIFFUS * k * wSous);
            if (c) {
                const tau = c.tauSW + k * wNuageBas;
                R = poser(couche(tau, tau > 0 ? c.tauSW / tau : 0, LH.G), R);
            }
            if (tauH > 0) {
                // Vapeur entre les deux nuages (diffus), puis la glace ; quasi pas de vapeur au-dessus de l'enclume.
                R *= Math.exp(-2 * LH.M_DIFFUS * k * wEntre);
                const tau = tauH + k * wGlace;
                R = poser(couche(tau, tauH / tau, LH.G), R);
                nir += LH.P[n] * R;
            } else {
                // Nuage bas seul : la vapeur au-dessus est traversée par le faisceau direct (M) puis en diffus (5/3).
                nir += LH.P[n] * Math.exp(-M * k * wEntre) * R * Math.exp(-LH.M_DIFFUS * k * wEntre);
            }
        }
        return vis + nir;
    }

    /**
     * Albédo planétaire (sommet de l'atmosphère, avant voile) : surface d'albédo Rg, colonne du profil
     * (RADIATIVE.colonneNuageuse : vapeur, population de nuages bas, fractions fBas / fHaut). Sous-colonnes en
     * recouvrement aléatoire : clair, bas seul, haut seul, bas + haut. Renvoie aussi les ciels pour le diagnostic.
     */
    function albedo(Rg, colonne) {
        const s = facteurRayleigh();
        const u = colonneOzone();
        const W = colonne.wTotal;
        const fB = colonne.fBas, fH = colonne.fHaut;
        const Rr_s = rayleigh(0.0685, s), Ra_s = rayleigh(0.144, s);
        let A = 0, Aclair = 0, Abas = 0, Ahaut = 0;
        for (let q = 0; q < GL_X.length; q++) {
            const mu = GL_X[q];
            const M = 35 / Math.sqrt(1224 * mu * mu + 1);
            const ozDescente = aOz(M * u);
            const ozRemontee = aOz(M * u + LH.M_DIFFUS_OZONE * u) - ozDescente;
            // ── Ciel clair : visible (Rayleigh + ozone + sol, 14, 15, 40) ; bandes de la vapeur (sol vu à travers W).
            const Rr = rayleigh(0.28 / (1 + 6.43 * mu), s);
            const Ra = rayleigh(0.219 / (1 + 0.816 * mu), s);
            const RbarOz = Ra + (1 - Ra) * (1 - Ra_s) * Rg / (1 - Ra_s * Rg);
            const visClair = LH.PART_VISIBLE - (ozDescente + RbarOz * ozRemontee)
                - (LH.PART_VISIBLE - Rr - ozDescente) * (1 - Rg) / (1 - Rr_s * Rg);
            let nirClair = 0;
            for (let n = 1; n < LH.K.length; n++) nirClair += LH.P[n] * Rg * Math.exp(-(M + LH.M_DIFFUS) * LH.K[n] * W);
            const aClair = visClair + nirClair;
            // ── Ciels nuageux : populations (bas : profondeur ; hauts : ln τ).
            const aBas = moyennePopulation(colonne.tranches, (c) => colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, 0, c));
            const aHaut = moyenneHauts((t) => colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, t, null));
            const aDeux = moyenneHauts((t) => moyennePopulation(colonne.tranches,
                (c) => colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, t, c)));
            const poids = GL_W[q] * 2 * mu;
            Aclair += poids * aClair;
            Abas += poids * aBas;
            Ahaut += poids * aHaut;
            A += poids * ((1 - fB) * (1 - fH) * aClair + fB * (1 - fH) * aBas + (1 - fB) * fH * aHaut + fB * fH * aDeux);
        }
        return { A: A, Aclair: Aclair, Abas: Abas, Ahaut: Ahaut, couverture: 1 - (1 - fB) * (1 - fH), ozone: u, rayleigh: s };
    }

    window.SOLAIRE = {
        albedo: albedo,
        moyennePopulation: moyennePopulation,
        moyenneHauts: moyenneHauts,
        etatNuage: etatNuage
    };
})();
