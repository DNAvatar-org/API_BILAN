// File: API_BILAN/radiative/solaire.js - Rayonnement solaire dans l'atmosphère (Lacis & Hansen 1974 ; vapeur : Chou & Suarez 1999)
// Desc: Je calcule l'albédo au SOMMET de l'atmosphère (🍰🪩📿 avant voile) et le flux absorbé au sol à partir de l'albédo de la
//       surface, de la vapeur, de l'ozone, de la diffusion de Rayleigh et des nuages. Ozone, Rayleigh et nuages : le schéma de
//       Lacis & Hansen (1974, J. Atmos. Sci. 31:118), ajusté sur des calculs de diffusion multiple (doubling-adding). Vapeur :
//       la k-distribution de Chou & Suarez (1999, NASA TM-104606 vol. 15, CLIRAD-SW), calée raie par raie (HITRAN 1996) et
//       validée à moins de 1 % sur les flux (leur table 8) ; O₂ du même document. Aérosol de fond : climatologie MACv2.
// Version 1.7.0
// - v1.7.0 (2026-10-25): gouttes et cristaux de Chou & Suarez 1999 (co-albédo et asymétrie par bande, selon le rayon effectif).
// - v1.6.0 (2026-10-24): aérosol de fond MACv2 (Kinne 2019) dans le visible sous les nuages ; absorption de l'O₂ (Chou & Suarez 1999).
// - v1.5.0 (2026-10-22): vapeur de Chou & Suarez 1999 (proche IR, 10 coefficients ; visible, bande 8) au lieu de Lacis & Hansen.
// Date: [October 13, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
//
// Partage du spectre (Chou & Suarez 1999, table 3) : ultraviolet et visible (0,175–0,70 µm, bandes 1–8) 47,074 % du flux,
// proche infrarouge (0,70–10 µm, bandes 9–11) 52,926 %.
// Vapeur (Chou & Suarez 1999) :
//   · proche IR : transmission T(w) = Σ h_i e^(−k_i w), 10 coefficients k_i (table 2) ; sous nuage, les bandes 9, 10 et 11
//     séparément (les gouttes et les cristaux n'y absorbent pas pareil) ; en ciel clair, leurs poids h_i additionnés ;
//   · visible (bande 8, 0,40–0,70 µm, 39,081 % du flux) : faible, T = e^(−k̄w), k̄ = 0,00075 g⁻¹ cm² (éq. 3.12–3.13), ajoutée
//     en perturbation du transfert visible (écart au même trajet sans vapeur ; l'interaction avec la diffusion de Rayleigh,
//     d'ordre deux, est négligée) ;
//   · w = eau à l'échelle (p/300 hPa)^0,8 [1 + 0,00135 (T − 240 K)] (éq. 3.3, 3.5), calculée par le profil
//     (RADIATIVE.profilAtmosphere) ; trajet direct M, remontée diffuse 5/3 (Lacis & Hansen 25–27).
//   ⚠️ Absents, déclarés : Rayleigh du proche IR (−3,1 W/m² au sol à 60°, leur table 7), CO₂ (−3,3), continuum de la vapeur.
// Ozone, Rayleigh et nuages (Lacis & Hansen 1974, numéros d'équations entre parenthèses) :
//   · ozone : A_oz(x) = A_vis(x) + A_uv(x) (8, 9), chemin direct x = u·M, M = 35/√(1224 μ₀² + 1) (11, 12),
//     remontée diffuse M̄ = 1,9 (13) ; absorption totale A_oz(uM) + R̄·[A_oz(uM + M̄u) − A_oz(uM)] (14, 15) ;
//   · Rayleigh : albédo du ciel clair R̄_r(μ₀) = 0,28/(1 + 6,43 μ₀), sphérique R̄*_r = 0,0685 (41) ; albédo effectif
//     pour l'ozone R̄_a = 0,219/(1 + 0,816 μ₀), R̄*_a = 0,144 (18) ;
//   · nuage : deux-flux de Sagan & Pollack (31), couches additionnées (33) ; gouttes et cristaux : co-albédo et facteur
//     d'asymétrie de Chou & Suarez (§4.2, tables 5 et 6) par bande et selon le rayon effectif ; la vapeur du nuage entre dans ω ;
//   · surface : partie visible (40) en ciel clair, (42) sous nuage.
// Moyenne GLOBALE : l'hémisphère éclairé d'une sphère est uniformément réparti en μ₀ ∈ [0,1] ; le flux absorbé moyen
// est donc ∫ A(μ₀)·2μ₀ dμ₀ — de la géométrie, pas un angle « effectif » choisi (quadrature de Gauss-Legendre).

(function () {
    'use strict';

    const LH = {
        M_DIFFUS_OZONE: 1.9,        // [-] (13)
        M_DIFFUS: 5 / 3             // [-] (25–27)
    };
    // Vapeur : Chou & Suarez 1999, table 2 (coefficients k à p_r = 300 hPa et θ_r = 240 K ; poids h de chaque bande du proche IR,
    // en fraction du flux solaire total — leurs sommes sont les S/S₀ des bandes 9, 10 et 11 de la table 3) et table 3.
    const CS99 = {
        K: [0.0010, 0.0133, 0.0422, 0.1334, 0.4217, 1.3340, 5.6230, 31.620, 177.80, 1000.0],                // [g⁻¹cm²]
        H_BANDE_9: [0.20673, 0.03497, 0.03011, 0.02260, 0.01336, 0.00696, 0.00441, 0.00115, 0.00026, 0.00000],   // [-] 0,70–1,22 µm
        H_BANDE_10: [0.08236, 0.01157, 0.01133, 0.01143, 0.01240, 0.01258, 0.01381, 0.00650, 0.00244, 0.00094],  // [-] 1,22–2,27 µm
        H_BANDE_11: [0.01074, 0.00360, 0.00411, 0.00421, 0.00389, 0.00326, 0.00499, 0.00465, 0.00245, 0.00145],  // [-] 2,27–10 µm
        PART_VISIBLE: 0.47074,      // [-] bandes 1–8, 0,175–0,70 µm (table 3)
        PART_PAR: 0.39081,          // [-] bande 8, 0,40–0,70 µm (table 3)
        K_PAR: 0.00075              // [g⁻¹cm²] vapeur dans la bande 8 (éq. 3.12–3.13)
    };
    /** Poids h de chaque coefficient k sur tout le proche IR (bandes 9 + 10 + 11 ; Σ = 0,52926). */
    const H_PROCHE_IR = CS99.K.map((_, i) => CS99.H_BANDE_9[i] + CS99.H_BANDE_10[i] + CS99.H_BANDE_11[i]);
    const H_BANDES = [CS99.H_BANDE_9, CS99.H_BANDE_10, CS99.H_BANDE_11];
    // Gouttes et cristaux (Chou & Suarez 1999 §4.2 ; spectres de Tsay et al. 1989 pour l'eau, de Fu 1996 pour la glace, moyennés
    // sur chaque bande) : co-albédo de diffusion simple 1 − ω = b₀ + b₁r + b₂r² (table 5) et facteur d'asymétrie
    // g = c₀ + c₁r + c₂r² (table 6), r = taille effective [µm], pour les bandes 1–8 (co-albédo < 10⁻⁵, nul), 9, 10 et 11.
    // Ajustés sur des gouttes de 4 à 20 µm et des cristaux de 20 à 130 µm.
    const OPTIQUE = {
        EAU: { B: [[0, 0, 0], [7.15e-8, 8.45e-6, -4.15e-8], [-1.99e-4, 8.88e-4, -6.50e-6], [1.21e-2, 1.79e-2, -3.69e-4]],
               C: [[0.826, 5.29e-3, -1.49e-4], [0.794, 8.32e-3, -2.33e-4], [0.745, 1.37e-2, -3.82e-4], [0.835, 2.57e-3, 5.52e-5]] },
        GLACE: { B: [[0, 0, 0], [-2.60e-6, 7.46e-6, 0], [2.15e-3, 7.37e-4, -1.34e-6], [8.94e-2, 2.99e-3, -1.04e-5]],
                 C: [[0.746, 1.05e-3, -2.64e-6], [0.749, 1.20e-3, -3.67e-6], [0.761, 1.42e-3, -3.96e-6], [0.841, 1.26e-3, -3.85e-6]] }
    };
    const poly = (a, r) => a[0] + a[1] * r + a[2] * r * r;
    /** Taille effective des cristaux au sens de Fu 1996 [µm] : même extinction que le profil (Q_ext = 2), 3/(2ρr_e) = 4√3/(3ρr_i),
     *  donc r_i = (8√3/9)·r_e (r_e : EARTH.NUAGES.R_EFF_GLACE). */
    const rayonGlace = () => 8 * Math.sqrt(3) / 9 * window.EARTH.NUAGES.R_EFF_GLACE * 1e6;
    /** Optique d'un nuage d'épaisseur τ, dont τ_l en gouttes de rayon effectif moyen r_l [µm] et le reste en cristaux : pour les
     *  bandes 1–8, 9, 10, 11, { a : co-albédo, g } du mélange (Chou & Suarez éq. 6.3–6.4). */
    function optiqueNuage(tau, tauLiq, rLiq) {
        const rG = rayonGlace(), tauGlace = tau - tauLiq;
        return [0, 1, 2, 3].map((b) => {
            const aL = poly(OPTIQUE.EAU.B[b], rLiq), aG = poly(OPTIQUE.GLACE.B[b], rG);
            const dL = tauLiq * (1 - aL), dG = tauGlace * (1 - aG);   // diffusion
            return { a: tau > 0 ? (tauLiq * aL + tauGlace * aG) / tau : 0,
                g: dL + dG > 0 ? (dL * poly(OPTIQUE.EAU.C[b], rLiq) + dG * poly(OPTIQUE.GLACE.C[b], rG)) / (dL + dG) : 0 };
        });
    }
    /** Optique d'un état de nuage (etatNuage) : rayon effectif des gouttes moyenné sur leur épaisseur optique. */
    const optiqueEtat = (c) => optiqueNuage(c.tauSW, c.tauLiq, c.tauLiq > 0 ? c.tauRLiq / c.tauLiq : 0);
    // AÉROSOL DE FOND troposphérique, Terre actuelle : climatologie MACv2 (Kinne 2019, ACP 19:10919), moyennes globales au
    // milieu du visible : épaisseur optique 0,12, albédo de diffusion simple 0,94, facteur d'asymétrie 0,70 (✅ mesure, AERONET
    // + modèles). ⚠️ DÉCLARÉ : appliqué à l'ultraviolet et au visible seuls (bandes 1–8, 47,074 % du flux ; plus mince dans le
    // proche IR), en couche sous les nuages (couche limite), même valeur pour toutes les époques qui ont une atmosphère (pas de
    // chimie des aérosols).
    const AEROSOL = { TAU: 0.12, OMEGA: 0.94, G: 0.70 };   // [-], [-], [-]
    // O₂ : bandes A, B et faibles (7600–8050, 12850–13190, 14310–14590, 15730–15930 cm⁻¹), 6,33 % du flux solaire ; transmission
    // moyenne e^(−k√w), k = 0,000145 (cm-atm STP)^(−1/2), w = quantité d'O₂ ramenée à p_r = 300 hPa par (p/p_r)^0,8, ajustée
    // sur des calculs raie par raie (Chou & Suarez 1999, éq. 3.5, 3.16–3.18). Sous nuages : réduction du flux au sol
    // × F_net nuageux / F_net clair (leur éq. 6.18).
    const O2 = { PART_SPECTRE: 0.0633, K: 0.000145, P_REF_PA: 30000, M: 0.8 };   // [-], [(cm-atm)^(−1/2)], [Pa], [-]
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
        if (P.length === 1) return { tauSW: 0, tauIR: 0, wMoyen: 0, wSature: 0, tauLiq: 0, tauRLiq: 0 };   // pas de nuage : épaisseur nulle
        const d = u * P[P.length - 1];
        let i = 1;
        while (i < P.length - 1 && P[i] < d) i++;
        const a = (P[i] - P[i - 1]) > 0 ? (d - P[i - 1]) / (P[i] - P[i - 1]) : 0;
        const v = (cle) => tranches[cle][i - 1] + a * (tranches[cle][i] - tranches[cle][i - 1]);
        return { tauSW: v('tauSW'), tauIR: v('tauIR'), wMoyen: v('wMoyen'), wSature: v('wSature'), tauLiq: v('tauLiq'), tauRLiq: v('tauRLiq') };
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

    /** Quantité d'O₂ de la colonne verticale [cm-atm STP], ramenée à p_r (Chou & Suarez 1999 éq. 3.5) : (x_O₂ · colonne d'air
     *  STP) · (p_s/p_r)^m / (1 + m), intégrale de (p/p_r)^m sur la colonne. Sans atmosphère : 0. */
    function colonneO2() {
        const DATA = window.DATA, CONST = window.CONST, f = DATA['🫧'];
        if (DATA['🫧']['🎈'] === 0) return 0;                       // sans atmosphère (⚫) : pas d'O₂
        const Ps = DATA['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA;
        const nAir = f['🍰🫧🏭'] / CONST.M_CO2 + f['🍰🫧🐄'] / CONST.M_CH4 + f['🍰🫧🫁'] / CONST.M_O2 + f['🍰🫧💨'] / CONST.M_N2;   // [mol/kg]
        const xO2 = (f['🍰🫧🫁'] / CONST.M_O2) / nAir;
        const colonneSTP = Ps / DATA['📅']['🍎'] * nAir * 0.0224140 * 100;   // [cm] mol/m² × volume molaire STP
        return xO2 * colonneSTP * Math.pow(Ps / O2.P_REF_PA, O2.M) / (1 + O2.M);
    }

    /** Sol d'albédo Rg sous la couche d'aérosol de fond (visible) : réflexion R du système et part Sb de ce qui y entre absorbée
     *  par le sol — le reste (1 − R − Sb) est absorbé par l'aérosol. Sans atmosphère : le sol nu. */
    function solAerosol(Rg) {
        const tau = window.DATA['🫧']['🎈'] === 0 ? 0 : AEROSOL.TAU;
        const a = couche(tau, AEROSOL.OMEGA, AEROSOL.G);
        const d = 1 - a.R * Rg;
        return { R: a.R + a.T * a.T * Rg / d, Sb: a.T * (1 - Rg) / d };
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

    /** Couche nuageuse conservative dans le visible (19), facteur d'asymétrie g : { R, T = 1 − R }. */
    function nuageVisible(tau, g) {
        const b = Math.sqrt(3) * (1 - g) * tau;
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
        // Optique par bande (1–8, 9, 10, 11) : nuage haut (cristaux), moyen et bas (gouttes et cristaux de leur tranche).
        const oH = optiqueNuage(tauH, 0, 0);
        const oM = cM ? optiqueEtat(cM) : null, oB = c ? optiqueEtat(c) : null;
        // ── Visible : nuages conservatifs empilés (sans sol), puis sol.
        const haut = nuageVisible(tauH, oH[0].g);
        const moyen = cM ? nuageVisible(cM.tauSW, oM[0].g) : { R: 0, T: 1 };
        const bas = c ? nuageVisible(c.tauSW, oB[0].g) : { R: 0, T: 1 };
        const Rstack = poser(haut, poser(moyen, bas.R));
        const Tstack = 1 - Rstack;
        const SA = solAerosol(Rg);                                                 // sol vu à travers l'aérosol de fond
        const RbarA = Rstack + Tstack * Tstack * SA.R / (1 - Rstack * SA.R);
        const entre = (CS99.PART_VISIBLE - ozDescente) * Tstack / (1 - Rstack * SA.R);   // entre sous les nuages (42)
        const solVis = entre * SA.Sb;                                              // absorbé au sol
        const vis = CS99.PART_VISIBLE - (ozDescente + RbarA * ozRemontee) - entre * (1 - SA.R);
        // Même empilement sans vapeur ni aérosol (k = 0 de la boucle de vapeur ci-dessous) : référence de la vapeur du visible.
        const Rbar = Rstack + Tstack * Tstack * Rg / (1 - Rstack * Rg);
        const solConservatif = Tstack * (1 - Rg) / (1 - Rstack * Rg);
        // ── Bandes de la vapeur : sol, vapeur sous le premier nuage, nuage bas, vapeur jusqu'au nuage moyen, nuage moyen,
        //    vapeur au-dessus, nuage haut. Vapeur effective : sous la base du nuage bas (wSousBase), dans le nuage bas
        //    (c.wMoyen), sous le niveau des nuages moyens (wSousMoyen), colonne entière (W).
        const wSous = c ? colonne.wSousBase : (cM ? colonne.wSousMoyen : W);
        // Vapeur dans les nuages (air saturé) ; l'absorption des gouttes et des cristaux est dans leur co-albédo.
        const wNuageBas = c ? c.wSature : 0;
        const wNuageMoyen = cM ? cM.wSature : 0;   // mêmes populations (⚠️ physics.js)
        const wBasMoyen = c && cM ? Math.max(0, colonne.wSousMoyen - colonne.wSousBase - c.wMoyen) : 0;
        const wDessus = cM ? Math.max(0, W - colonne.wSousMoyen) : (c ? Math.max(0, W - colonne.wSousBase - c.wMoyen) : 0);
        // Pour un coefficient k, de bas en haut : réflexion R du système sous le niveau courant, et part Sb de ce qui y entre qui
        // est absorbée par le sol. Couche (R₁, T₁) posée dessus : R = R₁ + T₁² R_b / (1 − R₁ R_b), Sb = T₁ Sb_b / (1 − R₁ R_b) ;
        // vapeur pure de transmission t (aller) : R = t² R_b, Sb = t Sb_b. Renvoie [réfléchi au sommet, absorbé au sol].
        const sous = (c1, st) => { const d = 1 - c1.R * st.R; return { R: c1.R + c1.T * c1.T * st.R / d, Sb: c1.T * st.Sb / d }; };
        const vapeur = (t, st) => ({ R: t * t * st.R, Sb: t * st.Sb });
        // Bande b (0 : 1–8, 1–3 : 9–11) : extinction du nuage τ_c + vapeur k·w, diffusion τ_c(1 − a_b), asymétrie g_b.
        const transfert = (k, b) => {
            let st = vapeur(Math.exp(-LH.M_DIFFUS * k * wSous), { R: Rg, Sb: 1 - Rg });
            if (c) {
                const tau = c.tauSW + k * wNuageBas;
                st = sous(couche(tau, tau > 0 ? c.tauSW * (1 - oB[b].a) / tau : 0, oB[b].g), st);
            }
            if (cM) {
                st = vapeur(Math.exp(-LH.M_DIFFUS * k * wBasMoyen), st);
                const tau = cM.tauSW + k * wNuageMoyen;
                st = sous(couche(tau, tau > 0 ? cM.tauSW * (1 - oM[b].a) / tau : 0, oM[b].g), st);
            }
            if (tauH > 0) {
                // Vapeur jusqu'au nuage haut (diffus), puis la glace ; quasi pas de vapeur au-dessus de l'enclume.
                st = vapeur(Math.exp(-LH.M_DIFFUS * k * wDessus), st);
                st = sous(couche(tauH, 1 - oH[b].a, oH[b].g), st);
                return [st.R, st.Sb];
            }
            // Sans nuage haut : la vapeur au-dessus est traversée par le faisceau direct (M) puis en diffus (5/3).
            const tDirect = Math.exp(-M * k * wDessus);
            return [tDirect * st.R * Math.exp(-LH.M_DIFFUS * k * wDessus), tDirect * st.Sb];
        };
        let nir = 0, solNir = 0;
        for (let b = 0; b < 3; b++) {
            for (let n = 0; n < CS99.K.length; n++) {
                const t = transfert(CS99.K[n], b + 1);
                nir += H_BANDES[b][n] * t[0];
                solNir += H_BANDES[b][n] * t[1];
            }
        }
        // Vapeur du visible (bande 8) : écart au même empilement sans vapeur (k = 0 : nuages conservatifs, soit Rbar et
        // solConservatif du visible ci-dessus).
        const par = transfert(CS99.K_PAR, 0);
        return [vis + nir + CS99.PART_PAR * (par[0] - Rbar), solVis + solNir + CS99.PART_PAR * (par[1] - solConservatif)];
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
        const SA = solAerosol(Rg);                                                 // sol vu à travers l'aérosol de fond
        const RbarOz = Ra + (1 - Ra) * (1 - Ra_s) * SA.R / (1 - Ra_s * SA.R);
        const entreClair = (CS99.PART_VISIBLE - Rr - ozDescente) / (1 - Rr_s * SA.R);   // entre sous la diffusion de Rayleigh (40)
        const solVisClair = entreClair * SA.Sb;                                    // absorbé au sol
        const visClair = CS99.PART_VISIBLE - (ozDescente + RbarOz * ozRemontee) - entreClair * (1 - SA.R);
        // Vapeur pour un coefficient k : faisceau direct jusqu'au sol, remontée diffuse — [réfléchi au sommet, absorbé au sol].
        const vapeurClair = (k) => {
            const tDirect = Math.exp(-M * k * W);
            return [Rg * tDirect * Math.exp(-LH.M_DIFFUS * k * W), tDirect * (1 - Rg)];
        };
        let nirClair = 0, solNirClair = 0;
        for (let n = 0; n < CS99.K.length; n++) {
            const v = vapeurClair(CS99.K[n]);
            nirClair += H_PROCHE_IR[n] * v[0];
            solNirClair += H_PROCHE_IR[n] * v[1];
        }
        // Vapeur du visible (bande 8) : écart au même trajet sans vapeur (k = 0 : Rg, 1 − Rg).
        const par = vapeurClair(CS99.K_PAR);
        const clair = [visClair + nirClair + CS99.PART_PAR * (par[0] - Rg), solVisClair + solNirClair + CS99.PART_PAR * (par[1] - (1 - Rg))];
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
        // O₂ (Chou & Suarez 1999) : réduction du flux descendant en ciel clair, ΔF = 6,33 % · (1 − e^(−k√(w/μ₀))) ; elle aurait
        // été absorbée par le sol (1 − Rg) ou renvoyée (Rg). Sous nuages, × absorbé au sol nuageux / clair (leur éq. 6.18).
        const dO2 = O2.PART_SPECTRE * (1 - Math.exp(-O2.K * Math.sqrt(colonneO2() / mu)));
        const o2 = (v) => { const f = v[1] / clair[1]; return [v[0] - dO2 * Rg * f, v[1] - dO2 * (1 - Rg) * f]; };
        [aBas, aHaut, aDeux, aMoyen, aBasMoyen, aMoyenHaut, aTrois].forEach((v) => { const r = o2(v); v[0] = r[0]; v[1] = r[1]; });
        clair[0] -= dO2 * Rg; clair[1] -= dO2 * (1 - Rg);
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
