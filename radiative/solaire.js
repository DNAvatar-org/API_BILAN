// File: API_BILAN/radiative/solaire.js - Rayonnement solaire dans l'atmosphère (Lacis & Hansen 1974)
// Desc: Je calcule l'albédo au SOMMET de l'atmosphère (🍰🪩📿 avant voile) à partir de l'albédo de la surface, de la
//       vapeur, de l'ozone, de la diffusion de Rayleigh et des nuages — le schéma de Lacis & Hansen (1974, J. Atmos.
//       Sci. 31:118), ajusté sur des calculs de diffusion multiple (doubling-adding) et standard du modèle GISS.
//       Avant (≤ 2026-10-12) : albédo = surface + nuage par addition à 2 couches, SANS atmosphère — tout le soleil
//       arrivait au sol ou repartait ; or la vapeur absorbe une grande part du proche infrarouge (éq. 21) AU-DESSUS des
//       nuages, et le nuage réfléchit moins qu'un nuage sans absorption.
// Version 1.4.0
// - v1.4.0 (2026-10-15): flux absorbé par le SOL (S), à côté de l'albédo : absorption de l'atmosphère = 1 − A − S
//   (décomposition de Donohoe & Battisti 2011). Visible : terme (40)/(42) ; vapeur : addition bande par bande.
// - v1.3.1 (2026-10-15): 5 échantillons par population de nuages bas, 3 pour les moyens (25 → 10 s par époque, |ΔT| ≤ 0,1 °C).
// - v1.3.0 (2026-10-15): nuages MOYENS (colonne.fMoyen, populations des nuages bas) dans l'empilement et le recouvrement
//   aléatoire : 8 sous-colonnes (clair, bas, moyen, haut et leurs combinaisons).
// - v1.2.0 (2026-10-15): nuages bas = plusieurs populations pondérées (océan, continent : colonne.populations), moyennePopulation les moyenne.
// - v1.1.1 (2026-10-15): nuageVisible exposé (simulateur ISCCP, radiative/nuages_isccp.js).
// - v1.1.0 (2026-10-13): albedoMu (albédo à un μ₀ donné) exposé pour le bilan méridien ; albedo() = sa moyenne Gauss-Legendre.
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
    // Population de nuages : profondeurs relatives u au milieu de N intervalles égaux de [0,1] (par population : océan,
    // continent). 5 suffisent : banc 21 époques à 0,1 °C près de 10 (2026-10-15), 2,5 fois plus vite.
    const N_POPULATION = 5;
    // Nuages moyens : mêmes populations, échantillonnées plus grossièrement (résolution du calcul, pas un réglage) — ils
    // entrent dans 4 des 8 sous-colonnes, dont l'empilement bas + moyen + haut.
    const N_POPULATION_MOYENS = 3;

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

    /** Moyenne d'une grandeur sur les populations de nuages bas (RADIATIVE : océan et continent, chacune de poids p) ; dans
     *  chacune, toutes les profondeurs de 0 au sommet également représentées (n échantillons). */
    function moyennePopulation(populations, fn, n = N_POPULATION) {
        let s = 0;
        for (const pop of populations) {
            let m = 0;
            for (let j = 0; j < n; j++) m += fn(etatNuage(pop.tranches, (j + 0.5) / n));
            s += pop.poids * m / n;
        }
        return s;
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
    function tausHauts() {
        const N = window.EARTH.NUAGES;
        const a = Math.log(N.TAU_HAUT_MIN), b = Math.log(N.TAU_HAUT_MAX);
        const t = [];
        for (let j = 0; j < N_HAUTS; j++) t.push(Math.exp(a + (b - a) * (j + 0.5) / N_HAUTS));
        return t;
    }
    function moyenneHauts(fn) {
        const T = tausHauts();
        return T.reduce((s, t) => s + fn(t), 0) / T.length;
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
     * Albédo d'une colonne nuageuse pour μ₀ : nuage haut (τ_H, 0 = absent) au-dessus, nuage moyen (état cM, null = absent),
     * nuage bas (état c, null = absent), vapeur entre eux et dessous, sol Rg. Visible : (42) généralisé à l'empilement des
     * nuages ; bandes de la vapeur : addition (30–33) bande par bande, de bas en haut.
     */
    function colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, tauH, c, cM) {
        const W = colonne.wTotal;
        // ── Visible : nuages conservatifs empilés (sans sol), puis sol.
        const haut = nuageVisible(tauH);
        const moyen = nuageVisible(cM ? cM.tauSW : 0);
        const bas = nuageVisible(c ? c.tauSW : 0);
        const Rstack = poser(haut, poser(moyen, bas.R));
        const Tstack = 1 - Rstack;
        const Rbar = Rstack + Tstack * Tstack * Rg / (1 - Rstack * Rg);
        const solVis = (LH.PART_VISIBLE - ozDescente) * Tstack * (1 - Rg) / (1 - Rstack * Rg);   // absorbé au sol (42)
        const vis = LH.PART_VISIBLE - (ozDescente + Rbar * ozRemontee) - solVis;
        // ── Bandes de la vapeur : sol, vapeur sous le premier nuage, nuage bas, vapeur jusqu'au nuage moyen, nuage moyen,
        //    vapeur au-dessus, nuage haut. Vapeur effective : sous la base du nuage bas (wSousBase), dans le nuage bas
        //    (c.wMoyen), sous le niveau des nuages moyens (wSousMoyen), colonne entière (W).
        const wSous = c ? colonne.wSousBase : (cM ? colonne.wSousMoyen : W);
        const wNuageBas = c ? c.wSature + LH.W_GOUTTES_PAR_TAU * c.tauSW : 0;
        const wNuageMoyen = cM ? cM.wSature + LH.W_GOUTTES_PAR_TAU * cM.tauSW : 0;   // mêmes populations (⚠️ physics.js)
        const wBasMoyen = c && cM ? Math.max(0, colonne.wSousMoyen - colonne.wSousBase - c.wMoyen) : 0;
        const wDessus = cM ? Math.max(0, W - colonne.wSousMoyen) : (c ? Math.max(0, W - colonne.wSousBase - c.wMoyen) : 0);
        const wGlace = LH.W_GOUTTES_PAR_TAU * tauH;                   // absorption des cristaux (même estimation, §4)
        // Pour chaque bande, de bas en haut : réflexion R du système sous le niveau courant, et part Sb de ce qui y entre qui
        // est absorbée par le sol. Couche (R₁, T₁) posée dessus : R = R₁ + T₁² R_b / (1 − R₁ R_b), Sb = T₁ Sb_b / (1 − R₁ R_b) ;
        // vapeur pure de transmission t (aller) : R = t² R_b, Sb = t Sb_b.
        let nir = 0, solNir = 0;
        const sous = (c1, st) => { const d = 1 - c1.R * st.R; return { R: c1.R + c1.T * c1.T * st.R / d, Sb: c1.T * st.Sb / d }; };
        const vapeur = (t, st) => ({ R: t * t * st.R, Sb: t * st.Sb });
        for (let n = 1; n < LH.K.length; n++) {
            const k = LH.K[n];
            let st = vapeur(Math.exp(-LH.M_DIFFUS * k * wSous), { R: Rg, Sb: 1 - Rg });
            if (c) {
                const tau = c.tauSW + k * wNuageBas;
                st = sous(couche(tau, tau > 0 ? c.tauSW / tau : 0, LH.G), st);
            }
            if (cM) {
                st = vapeur(Math.exp(-LH.M_DIFFUS * k * wBasMoyen), st);
                const tau = cM.tauSW + k * wNuageMoyen;
                st = sous(couche(tau, tau > 0 ? cM.tauSW / tau : 0, LH.G), st);
            }
            if (tauH > 0) {
                // Vapeur jusqu'au nuage haut (diffus), puis la glace ; quasi pas de vapeur au-dessus de l'enclume.
                st = vapeur(Math.exp(-LH.M_DIFFUS * k * wDessus), st);
                const tau = tauH + k * wGlace;
                st = sous(couche(tau, tauH / tau, LH.G), st);
                nir += LH.P[n] * st.R;
                solNir += LH.P[n] * st.Sb;
            } else {
                // Sans nuage haut : la vapeur au-dessus est traversée par le faisceau direct (M) puis en diffus (5/3).
                const tDirect = Math.exp(-M * k * wDessus);
                nir += LH.P[n] * tDirect * st.R * Math.exp(-LH.M_DIFFUS * k * wDessus);
                solNir += LH.P[n] * tDirect * st.Sb;
            }
        }
        return [vis + nir, solVis + solNir];
    }

    /**
     * Albédo planétaire (sommet de l'atmosphère, avant voile) : surface d'albédo Rg, colonne du profil
     * (RADIATIVE.colonneNuageuse : vapeur, populations de nuages bas, fractions fBas / fMoyen / fHaut). Sous-colonnes en
     * recouvrement aléatoire : clair, bas, moyen, haut et leurs combinaisons. Renvoie aussi les ciels pour le diagnostic.
     */
    /**
     * Albédo au sommet pour UN cosinus d'angle solaire μ₀ : ciels clair, bas, haut, bas + haut (populations), et leur
     * mélange en recouvrement aléatoire. s, u : facteur de Rayleigh et colonne d'ozone (calculés une fois par l'appelant).
     */
    function albedoMu(mu, Rg, colonne, s, u) {
        const W = colonne.wTotal;
        const fB = colonne.fBas, fM = colonne.fMoyen, fH = colonne.fHaut;
        const Rr_s = rayleigh(0.0685, s), Ra_s = rayleigh(0.144, s);
        const M = 35 / Math.sqrt(1224 * mu * mu + 1);
        const ozDescente = aOz(M * u);
        const ozRemontee = aOz(M * u + LH.M_DIFFUS_OZONE * u) - ozDescente;
        // ── Ciel clair : visible (Rayleigh + ozone + sol, 14, 15, 40) ; bandes de la vapeur (sol vu à travers W).
        const Rr = rayleigh(0.28 / (1 + 6.43 * mu), s);
        const Ra = rayleigh(0.219 / (1 + 0.816 * mu), s);
        const RbarOz = Ra + (1 - Ra) * (1 - Ra_s) * Rg / (1 - Ra_s * Rg);
        const solVisClair = (LH.PART_VISIBLE - Rr - ozDescente) * (1 - Rg) / (1 - Rr_s * Rg);   // absorbé au sol (40)
        const visClair = LH.PART_VISIBLE - (ozDescente + RbarOz * ozRemontee) - solVisClair;
        let nirClair = 0, solNirClair = 0;
        for (let n = 1; n < LH.K.length; n++) {
            const tDirect = Math.exp(-M * LH.K[n] * W);                 // faisceau direct jusqu'au sol
            nirClair += LH.P[n] * Rg * tDirect * Math.exp(-LH.M_DIFFUS * LH.K[n] * W);
            solNirClair += LH.P[n] * tDirect * (1 - Rg);
        }
        const clair = [visClair + nirClair, solVisClair + solNirClair];
        // ── Ciels nuageux : populations (bas et moyens : profondeur ; hauts : ln τ), 8 sous-colonnes en recouvrement aléatoire.
        //    Chaque colonne rend [albédo, absorbé au sol] ; moyennes vectorielles sur les populations.
        const P = colonne.populations, NM = N_POPULATION_MOYENS, TH = tausHauts();
        const col = (t, c, cM) => colonneNuageuse(mu, M, ozDescente, ozRemontee, Rg, colonne, t, c, cM);
        const ajoute = (r, v, w) => { r[0] += w * v[0]; r[1] += w * v[1]; return r; };
        const surBas = (fn, n = N_POPULATION) => {
            const r = [0, 0];
            for (const pop of P) for (let j = 0; j < n; j++) ajoute(r, fn(etatNuage(pop.tranches, (j + 0.5) / n)), pop.poids / n);
            return r;
        };
        const surHauts = (fn) => TH.reduce((r, t) => ajoute(r, fn(t), 1 / TH.length), [0, 0]);
        const aBas = surBas((c) => col(0, c, null));
        const aHaut = surHauts((t) => col(t, null, null));
        const aDeux = surHauts((t) => surBas((c) => col(t, c, null)));
        const zero = [0, 0];
        const aMoyen = fM > 0 ? surBas((cM) => col(0, null, cM), NM) : zero;
        const aBasMoyen = fM > 0 ? surBas((cM) => surBas((c) => col(0, c, cM)), NM) : zero;
        const aMoyenHaut = fM > 0 ? surHauts((t) => surBas((cM) => col(t, null, cM), NM)) : zero;
        const aTrois = fM > 0 ? surHauts((t) => surBas((cM) => surBas((c) => col(t, c, cM)), NM)) : zero;
        const melange = (i) => (1 - fM) * ((1 - fB) * (1 - fH) * clair[i] + fB * (1 - fH) * aBas[i] + (1 - fB) * fH * aHaut[i] + fB * fH * aDeux[i])
            + fM * ((1 - fB) * (1 - fH) * aMoyen[i] + fB * (1 - fH) * aBasMoyen[i] + (1 - fB) * fH * aMoyenHaut[i] + fB * fH * aTrois[i]);
        return { A: melange(0), S: melange(1), Aclair: clair[0], Sclair: clair[1], Abas: aBas[0], Ahaut: aHaut[0], Amoyen: aMoyen[0] };
    }

    /**
     * Albédo planétaire (sommet de l'atmosphère, avant voile) : surface d'albédo Rg, colonne du profil
     * (RADIATIVE.colonneNuageuse : vapeur, populations de nuages bas, fractions fBas / fMoyen / fHaut). Sous-colonnes en
     * recouvrement aléatoire : clair, bas, moyen, haut et leurs combinaisons. Moyenne GLOBALE : ∫ A(μ₀)·2μ₀ dμ₀ (Gauss-Legendre).
     * Renvoie aussi les ciels pour le diagnostic.
     */
    function albedo(Rg, colonne) {
        const s = facteurRayleigh();
        const u = colonneOzone();
        let A = 0, Aclair = 0, Abas = 0, Ahaut = 0, S = 0, Sclair = 0;
        for (let q = 0; q < GL_X.length; q++) {
            const r = albedoMu(GL_X[q], Rg, colonne, s, u);
            const poids = GL_W[q] * 2 * GL_X[q];
            A += poids * r.A;
            Aclair += poids * r.Aclair;
            Abas += poids * r.Abas;
            Ahaut += poids * r.Ahaut;
            S += poids * r.S;
            Sclair += poids * r.Sclair;
        }
        // S : part du flux solaire au sommet absorbée par le SOL ; l'atmosphère absorbe 1 − A − S.
        return { A: A, Aclair: Aclair, Abas: Abas, Ahaut: Ahaut, S: S, Sclair: Sclair, couverture: 1 - (1 - colonne.fBas) * (1 - colonne.fMoyen) * (1 - colonne.fHaut), ozone: u, rayleigh: s };
    }

    window.SOLAIRE = {
        albedo: albedo,
        albedoMu: albedoMu,
        facteurRayleigh: facteurRayleigh,
        colonneOzone: colonneOzone,
        moyennePopulation: moyennePopulation,
        moyenneHauts: moyenneHauts,
        nuageVisible: nuageVisible,
        etatNuage: etatNuage
    };
})();
