// File: API_BILAN/radiative/solaire.js - Rayonnement solaire dans l'atmosphère (Lacis & Hansen 1974 ; vapeur : Chou & Suarez 1999)
// Desc: Je calcule l'albédo au SOMMET de l'atmosphère (🍰🪩📿 avant voile) et le flux absorbé au sol à partir de l'albédo de la
//       surface, de la vapeur, de l'ozone, de la diffusion de Rayleigh et des nuages. Ozone et Rayleigh : le schéma de
//       Lacis & Hansen (1974, J. Atmos. Sci. 31:118), ajusté sur des calculs de diffusion multiple (doubling-adding) ; nuages :
//       δ-Eddington (Joseph, Wiscombe & Weinman 1976, J. Atmos. Sci. 33:2452), faisceau direct et diffus portés séparément.
//       Vapeur : la k-distribution de Chou & Suarez (1999, NASA TM-104606 vol. 15, CLIRAD-SW), calée raie par raie (HITRAN 1996)
//       et validée à moins de 1 % sur les flux (leur table 8) ; O₂ du même document. Aérosol de fond : climatologie MACv2.
// Version 1.8.3
// - v1.8.3 (2026-10-30): albédo de Rayleigh du ciel clair rapporté à la part visible du flux, dont il sature ; vapeur du PAR
//   en ciel clair sur le seul visible qui atteint le sol.
// Date: [October 30, 2026]
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
//     en perturbation du transfert visible (écart au même trajet sans vapeur), sur le seul PAR qui fait ce trajet : sa part
//     du visible qui descend au sol et que le sol renvoie au sommet, une fois retirés Rayleigh, l'ozone et l'aérosol ;
//   · w = eau à l'échelle (p/300 hPa)^0,8 [1 + 0,00135 (T − 240 K)] (éq. 3.3, 3.5), calculée par le profil
//     (RADIATIVE.profilAtmosphere) ; trajet direct M, remontée diffuse 5/3 (Lacis & Hansen 25–27).
//   ⚠️ Absents, déclarés : Rayleigh du proche IR (−3,1 W/m² au sol à 60°, leur table 7), CO₂ (−3,3), continuum de la vapeur.
// Ozone, Rayleigh et surface (Lacis & Hansen 1974, numéros d'équations entre parenthèses) :
//   · ozone : A_oz(x) = A_vis(x) + A_uv(x) (8, 9), chemin direct x = u·M, M = 35/√(1224 μ₀² + 1) (11, 12),
//     remontée diffuse M̄ = 1,9 (13) ; absorption totale A_oz(uM) + R̄·[A_oz(uM + M̄u) − A_oz(uM)] (14, 15) ;
//   · Rayleigh : albédo du ciel clair R̄_r(μ₀) = 0,28/(1 + 6,43 μ₀), sphérique R̄*_r = 0,0685 (41) ; albédo effectif
//     pour l'ozone R̄_a = 0,219/(1 + 0,816 μ₀), R̄*_a = 0,144 (18) ; colonne de l'époque par les sections efficaces (RAYLEIGH) ;
//     autre colonne : couche conservative en deux flux, R = aτ/(1 + aτ) rapporté au flux qu'elle diffuse (Sagan & Pollack
//     1967, la loi des nuages conservatifs de Lacis & Hansen), τ × s. R̄_r est une part du flux TOTAL (retranchée de la part
//     visible V en 40) : rapporté à V, il en sature ; R̄*_r, R̄_a et R̄*_a sont des rapports au flux qui les éclaire, saturés à 1.
//     ⚠️ DÉCLARÉ : une seule épaisseur pour tout le visible (σ ∝ ν⁴ y varie d’un facteur 256 de 0,70 à 0,175 µm) ;
//   · surface : partie visible (40) en ciel clair, (42) sous nuage.
// Nuages : chaque couche (τ, ω, g) en δ-Eddington, pour le faisceau direct de cosinus μ₀ (réfléchi R(μ₀), transmis diffus,
//   transmis direct e^(−τ'/μ₀)) et pour le diffus, R̄ = ∫ R(μ) 2μ dμ et T̄ = ∫ T(μ) 2μ dμ du même schéma ; couches additionnées
//   de bas en haut, le direct et le diffus séparément (33 étendue au faisceau direct) ; gouttes et cristaux : co-albédo et
//   facteur d'asymétrie de Chou & Suarez (§4.2, tables 5 et 6) par bande et selon le rayon effectif ; la vapeur du nuage entre
//   dans ω. ⚠️ DÉCLARÉ : le sol est lambertien (même albédo pour le direct et le diffus).
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
    // × F_net nuageux / F_net clair (leur éq. 6.18) ; sur un sol lambertien F_net = (1 − Rg) F↓, le rapport est celui des flux
    // DESCENDANTS au sol, défini pour tout Rg, 1 compris (neige propre).
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
    // Gauss-Legendre 8 points sur [0,1] : diffus d'une couche, ∫ f(μ) 2μ dμ sur l'hémisphère (8 angles, comme Briegleb &
    // Light 2007, NCAR/TN-472). Écart à 64 points < 7·10⁻⁵ sur R̄ et T̄ de τ = 0,01 à 100 (4 points : 9·10⁻⁴).
    const GL8_X = [0.0198550718, 0.1016667613, 0.2372337950, 0.4082826788, 0.5917173212, 0.7627662050, 0.8983332387, 0.9801449282];
    const GL8_W = [0.0506142681, 0.1111905172, 0.1568533229, 0.1813418917, 0.1813418917, 0.1568533229, 0.1111905172, 0.0506142681];
    // DIFFUSION DE RAYLEIGH par molécule (théorie de Rayleigh) : σ = 24π³ν⁴/N² · ((n² − 1)/(n² + 2))² · F_K, avec l'indice n
    // de chaque gaz MESURÉ au laboratoire (à 532 nm, 288,15 K, 1013,25 hPa) et son facteur de King F_K = (6 + 3ρ)/(6 − 7ρ),
    // ρ = dépolarisation mesurée. Seul le rapport à l'air sert : 24π³ν⁴/N² s'y simplifie. Dispersion et F_K : N₂ Peck &
    // Khanna 1966 et Bates 1984 ; O₂ Bates 1984 (formule à 273,15 K, ramenée à 288,15 K par la densité) ; CO₂ Bideau-Mehu et
    // al. 1973 et Alms et al. 1975 ; CH₄ Sneep & Ubachs 2005 ; H₂O Ciddor 1996 (vapeur pure à 293,15 K et 1 333 Pa, ramenée par
    // la densité), ρ = 3,0·10⁻⁴ (Murphy 1977) ; air Peck & Reeder 1972, F_K de Bates 1984 (Bodhaine et al. 1999, éq. 23). Formules
    // réunies par He et al. 2021 (Atmos. Chem. Phys. 21:14927, table 1) ; leurs sections MESURÉES à 532 nm (table 2 : CO₂ 13,3,
    // O₂ 4,55, CH₄ 11,3 ·10⁻²⁷ cm²) sont à 2 % de celles-ci (13,34, 4,64, 11,36). Rapports à l'air : N₂ 1,029, O₂ 0,900,
    // CO₂ 2,585, CH₄ 2,201, H₂O 0,714. ⚠️ DÉCLARÉ : une seule longueur d'onde pour ces rapports (ils varient de quelques %
    // dans le visible).
    // État de référence de la paramétrisation (Lacis & Hansen 1974, éq. 41 : atmosphère standard, 1 atm) : g₀ et masse
    // molaire M₀ de l'air (CONV.RAYLEIGH_G_REF, CONV.RAYLEIGH_M_AIR_REF), d'où sa colonne de N₀ = (1 atm)/(g₀ M₀) moles par m².
    const RAYLEIGH = {
        N_MOINS_1: { N2: 2.8385e-4, O2: 2.5788e-4, CO2: 4.2780e-4, CH4: 4.2243e-4, H2O: 2.4053e-4, AIR: 2.7819e-4 },   // [-]
        F_KING: { N2: 1.0351, O2: 1.0967, CO2: 1.1453, CH4: 1.0000, H2O: 1.0005, AIR: 1.0477 }                       // [-]
    };
    /** Section efficace de Rayleigh du gaz, au facteur 24π³ν⁴/N² près. */
    // Réf : He et al. 2021, Atmos. Chem. Phys. 21:14927 (table 1) — doc/equation.html#eq-diffusion-rayleigh
    const sectionRayleigh = (gaz) => {
        const n2 = (1 + RAYLEIGH.N_MOINS_1[gaz]) * (1 + RAYLEIGH.N_MOINS_1[gaz]), q = (n2 - 1) / (n2 + 2);
        return q * q * RAYLEIGH.F_KING[gaz];
    };
    /** σ_gaz / σ_air. */
    const SIGMA_RELATIVE = {};
    for (const gaz of ['N2', 'O2', 'CO2', 'CH4', 'H2O']) SIGMA_RELATIVE[gaz] = sectionRayleigh(gaz) / sectionRayleigh('AIR');
    // Population de nuages : profondeurs relatives u au milieu de N intervalles égaux de [0,1] (par population : océan,
    // continent). 5 suffisent : banc 21 époques à 0,1 °C près de 10 (2026-10-15), 2,5 fois plus vite.
    const N_POPULATION = 5;
    // Nuages moyens : mêmes populations, échantillonnées plus grossièrement (résolution du calcul, pas un réglage) — ils
    // entrent dans 4 des 8 sous-colonnes, dont l'empilement bas + moyen + haut.
    const N_POPULATION_MOYENS = 3;

    /** Fraction du flux solaire total absorbée par une colonne d'ozone x [cm STP] (8, 9). */
    // Réf : Lacis & Hansen 1974, J. Atmos. Sci. 31:118 — doc/equation.html#eq-ozone-chemin-optique
    function aOz(x) {
        const vis = 0.02118 * x / (1 + 0.042 * x + 0.000323 * x * x);
        const uv = 1.082 * x / Math.pow(1 + 138.6 * x, 0.805) + 0.0658 * x / (1 + Math.pow(103.6 * x, 3));
        return vis + uv;
    }

    /** Réflexion et transmission diffuses d'une couche (τ, ω, g) — deux-flux de Sagan & Pollack 1967 (31) : l'aérosol de fond. */
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

    /**
     * Couche (τ, ω, g) sous un faisceau direct de cosinus μ — δ-Eddington (Joseph, Wiscombe & Weinman 1976) : le pic avant
     * de la fonction de phase (fraction f = g²) reste dans le faisceau direct, τ' = (1 − ωf)τ, ω' = (1 − f)ω/(1 − ωf),
     * g' = g/(1 + g) ; puis la solution d'Eddington à source directe (forme de Briegleb & Light 2007) :
     *   λ = √(3(1 − ω')(1 − ω'g')), u = (3/2)(1 − ω'g')/λ, x = e^(−λτ'), N = (u + 1)² − (u − 1)² x²,
     *   R₁ = (u² − 1)(1 − x²)/N, T₁ = 4u x/N (diffus à deux flux, qui ne servent qu'ici),
     *   α = ¾ ω' μ (1 + g'(1 − ω'))/(1 − λ²μ²), γ = ½ ω' (1 + 3g'(1 − ω')μ²)/(1 − λ²μ²), e = e^(−τ'/μ),
     *   R(μ) = (α + γ) R₁ + (α − γ)(T₁ e − 1),  T(μ) = (α + γ) T₁ + ((α − γ) R₁ − (α + γ) + 1) e  (direct compris).
     * Diffusion conservative (ω' = 1) : R(μ) = [(1 − g')τ' + (⅔ − μ)(1 − e)] / [4/3 + (1 − g')τ'], T = 1 − R (JWW 1976).
     * Renvoie [R(μ), T(μ) − e (transmis diffus), e (transmis direct)].
     */
    function deltaEddington(tau, omega, g, mu) {
        const f = g * g;
        const t = (1 - omega * f) * tau, w = (1 - f) * omega / (1 - omega * f), gp = g / (1 + g);
        if (1 - w < 1e-9) {                                          // diffusion conservative
            const e = Math.exp(-t / mu), a = (1 - gp) * t;
            const R = (a + (2 / 3 - mu) * (1 - e)) / (4 / 3 + a);
            return [R, 1 - R - e, e];
        }
        const lam = Math.sqrt(3 * (1 - w) * (1 - w * gp)), u = 1.5 * (1 - w * gp) / lam;
        const x = Math.exp(-lam * t), x2 = x * x;                    // forme divisée par e^(λτ') : stable pour λτ' grand
        const N = (u + 1) * (u + 1) - (u - 1) * (u - 1) * x2;
        const R1 = (u * u - 1) * (1 - x2) / N, T1 = 4 * u * x / N;
        // μ = 1/λ : singularité levable de la solution particulière (numérateurs et dénominateur s'annulent) ; μ décalé de 10⁻⁵.
        const m = Math.abs(1 - lam * lam * mu * mu) < 1e-6 ? mu * (1 + 1e-5) : mu;
        const e = Math.exp(-t / m), d = 1 - lam * lam * m * m;
        const al = 0.75 * w * m * (1 + gp * (1 - w)) / d, ga = 0.5 * w * (1 + 3 * gp * (1 - w) * m * m) / d;
        const R = (al + ga) * R1 + (al - ga) * (T1 * e - 1);
        const T = (al + ga) * T1 + ((al - ga) * R1 - (al + ga) + 1) * e;
        return [R, T - e, e];
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

    /** Facteur de colonne de Rayleigh : épaisseur optique de la colonne rapportée à celle de l'état de référence,
     *  s = Σ_i N_i σ_i / (N₀ σ_air), N_i = (p_s/g)·w_i/M_i moles de chaque gaz par m² (fractions MASSIQUES w_i de l'air
     *  humide, vapeur comprise, comme 🎈 et 🧪). Sans atmosphère (⚫) : p_s = 0, rien ne diffuse. */
    // Réf : Lacis & Hansen 1974, J. Atmos. Sci. 31:118 (éq. 41) — doc/equation.html#eq-diffusion-rayleigh
    function facteurRayleigh() {
        const DATA = window.DATA, CONST = window.CONST, f = DATA['🫧'];
        const r = SIGMA_RELATIVE;
        const molesRelatives = f['🍰🫧💨'] / CONST.M_N2 * r.N2 + f['🍰🫧🫁'] / CONST.M_O2 * r.O2 + f['🍰🫧🏭'] / CONST.M_CO2 * r.CO2
            + f['🍰🫧🐄'] / CONST.M_CH4 * r.CH4 + DATA['💧']['🍰🫧💧'] / CONST.M_H2O * r.H2O;   // [mol/kg] pondérées par σ_i/σ_air
        return f['🎈'] * (window.CONV.RAYLEIGH_G_REF / DATA['📅']['🍎']) * window.CONV.RAYLEIGH_M_AIR_REF * molesRelatives;
    }
    /** Albédo d'une couche conservative en deux flux, R = aτ/(1 + aτ), rapporté au flux qui l'éclaire : épaisseur multipliée
     *  par s à partir de R₁ (valeur à s = 1). */
    // Réf : Sagan & Pollack 1967, J. Geophys. Res. 72:469 ; Lacis & Hansen 1974, J. Atmos. Sci. 31:118 — doc/equation.html#eq-diffusion-rayleigh
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

    /** Sol d'albédo Rg sous la couche d'aérosol de fond (visible) : réflexion R du système et flux Db qui descend jusqu'au sol,
     *  par unité de ce qui y entre (réflexions multiples comprises) ; le sol en absorbe (1 − Rg) Db, l'aérosol le reste
     *  1 − R − (1 − Rg) Db. Sans atmosphère : le sol nu. */
    // Réf : Kinne 2019, Atmos. Chem. Phys. 19:10919 — doc/equation.html#eq-aerosol-de-fond
    function solAerosol(Rg) {
        const tau = window.DATA['🫧']['🎈'] === 0 ? 0 : AEROSOL.TAU;
        const a = couche(tau, AEROSOL.OMEGA, AEROSOL.G);
        const d = 1 - a.R * Rg;
        return { R: a.R + a.T * a.T * Rg / d, Db: a.T / d };
    }

    /** Colonne d'ozone [cm STP] (OZONE ci-dessus). */
    // Réf : Segura et al. 2003, Astrobiology 3:689 ; Cooke et al. 2022, Royal Society Open Science 9:211165 — doc/equation.html#eq-colonne-ozone-selon-oxygene
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
    // Réf : Stubenrauch et al. 2024, Surv. Geophys. 45:1999 — doc/equation.html#eq-nuages-hauts-altitude-epaisseurs
    function moyenneHauts(fn) {
        const T = tausHauts();
        return T.reduce((s, t) => s + fn(t), 0) / T.length;
    }

    /** Couche nuageuse conservative dans le visible (19), facteur d'asymétrie g : { R, T = 1 − R } — réflectance diffuse de
     *  Lacis & Hansen, celle qu'inverse le simulateur ISCCP (nuages_isccp.js). Le transfert prend le δ-Eddington. */
    function nuageVisible(tau, g) {
        const b = Math.sqrt(3) * (1 - g) * tau;
        const R = b / (2 + b);
        return { R: R, T: 1 - R };
    }

    // Combinaisons (bande b, coefficient de vapeur k) du transfert sous nuages : 0 = visible sans vapeur (bandes 1–8),
    // 1 = vapeur du visible (bande 8, K_PAR), puis les bandes 9, 10 et 11 × leurs 10 coefficients k, de poids h.
    const COMBOS = [{ b: 0, k: 0, h: 0 }, { b: 0, k: CS99.K_PAR, h: 0 }];
    for (let b = 1; b <= 3; b++) CS99.K.forEach((k, n) => COMBOS.push({ b: b, k: k, h: H_BANDES[b - 1][n] }));
    const N_COMBOS = COMBOS.length;

    /** Couche nuageuse de poids p (état c du profil, null pour un nuage haut) : optique par combinaison (optique(q) → [τ, ω, g])
     *  et son diffus [R̄, T̄] = [∫ R(μ) 2μ dμ, ∫ T(μ) 2μ dμ] du δ-Eddington (GL8) ; dir : le faisceau direct (eclairer). */
    // Réf : Joseph, Wiscombe & Weinman 1976, J. Atmos. Sci. 33:2452 ; Briegleb & Light 2007, NCAR/TN-472+STR — doc/equation.html#eq-delta-eddington
    function nuageDeColonne(poids, c, optique) {
        const opt = new Float64Array(3 * N_COMBOS), dif = new Float64Array(2 * N_COMBOS);
        for (let q = 0; q < N_COMBOS; q++) {
            const o = optique(COMBOS[q]);
            opt[3 * q] = o[0]; opt[3 * q + 1] = o[1]; opt[3 * q + 2] = o[2];
            let R = 0, T = 0;
            for (let i = 0; i < GL8_X.length; i++) {
                const d = deltaEddington(o[0], o[1], o[2], GL8_X[i]), p = GL8_W[i] * 2 * GL8_X[i];
                R += p * d[0];
                T += p * (d[1] + d[2]);
            }
            dif[2 * q] = R; dif[2 * q + 1] = T;
        }
        return { poids: poids, c: c, opt: opt, dif: dif, dir: new Float64Array(3 * N_COMBOS) };
    }
    /** Faisceau direct de cosinus μ sur la couche, par combinaison : [R(μ), transmis diffus, transmis direct]. */
    // Réf : Joseph, Wiscombe & Weinman 1976, J. Atmos. Sci. 33:2452 — doc/equation.html#eq-delta-eddington
    function eclairer(n, mu) {
        for (let q = 0; q < N_COMBOS; q++) {
            const d = deltaEddington(n.opt[3 * q], n.opt[3 * q + 1], n.opt[3 * q + 2], mu);
            n.dir[3 * q] = d[0]; n.dir[3 * q + 1] = d[1]; n.dir[3 * q + 2] = d[2];
        }
    }

    const _nuages = new WeakMap();
    /**
     * Nuages d'une colonne du profil (RADIATIVE.colonneNuageuse), une fois par colonne : états des populations de nuages bas
     * (N_POPULATION profondeurs par population) et moyens (N_POPULATION_MOYENS), nuages hauts (tausHauts) ; leur diffus ne
     * dépend pas de μ₀ et sert à tous les angles solaires de la colonne. Bas et moyens : extinction τ_c + k·w_saturé,
     * diffusion τ_c(1 − a_b), asymétrie g_b ; hauts : cristaux seuls, quasi pas de vapeur au-dessus de l'enclume.
     * Réf : Joseph, Wiscombe & Weinman 1976, J. Atmos. Sci. 33:2452 ; Chou & Suarez 1999, NASA TM-104606 vol. 15 — doc/equation.html#eq-delta-eddington ; doc/equation.html#eq-schema
     */
    function nuagesColonne(colonne) {
        if (_nuages.has(colonne)) return _nuages.get(colonne);
        const populations = (n) => {
            const out = [];
            for (const pop of colonne.populations) {
                for (let j = 0; j < n; j++) {
                    const c = etatNuage(pop.tranches, (j + 0.5) / n), o = optiqueEtat(c);
                    out.push(nuageDeColonne(pop.poids / n, c, (q) => {
                        const tau = c.tauSW + q.k * c.wSature;
                        return [tau, tau > 0 ? c.tauSW * (1 - o[q.b].a) / tau : 0, o[q.b].g];
                    }));
                }
            }
            return out;
        };
        const hauts = tausHauts().map((tauH) => {
            const o = optiqueNuage(tauH, 0, 0);
            return nuageDeColonne(1 / N_HAUTS, null, (q) => [tauH, 1 - o[q.b].a, o[q.b].g]);
        });
        const N = { bas: populations(N_POPULATION), moyens: populations(N_POPULATION_MOYENS), hauts: hauts };
        N.tous = N.bas.concat(N.moyens, N.hauts);
        _nuages.set(colonne, N);
        return N;
    }

    /**
     * Albédo d'une sous-colonne nuageuse : nuage haut H au-dessus, nuage moyen Mo, nuage bas B (null = absent ; couches de
     * nuagesColonne, éclairées au μ₀ courant), vapeur entre eux et dessous, sol Rg (visible : sous l'aérosol de fond, SA).
     * Addition de bas en haut, bande par bande : le faisceau direct (réfléchi au sommet Rm, descendant au sol Dm) et le diffus
     * (Rd, Dd) séparément. Couche (R(μ₀), t_d, e ; R̄, T̄) posée sur le dessous : montant diffus U = e·Rm + t_d·Rd, puis
     * Rm = R(μ₀) + U·T̄/(1 − R̄·Rd), Dm = e·Dm + (t_d + U·R̄/(1 − R̄·Rd))·Dd, Rd = R̄ + T̄²·Rd/(1 − R̄·Rd), Dd = T̄·Dd/(1 − R̄·Rd) ;
     * vapeur pure : faisceau direct sur le chemin M, diffus 5/3. Renvoie [albédo, flux descendant au sol] (le sol en absorbe
     * (1 − Rg) : il est lambertien).
     * Réf : Lacis & Hansen 1974, J. Atmos. Sci. 31:118 (éq. 33) ; Chou & Suarez 1999, NASA TM-104606 vol. 15 — doc/equation.html#eq-addition-couches-moyenne-sur ; doc/equation.html#eq-vapeur-chou-suarez
     */
    function colonneNuageuse(M, ozDescente, ozRemontee, Rg, SA, colonne, H, B, Mo) {
        const W = colonne.wTotal;
        const c = B ? B.c : null, cM = Mo ? Mo.c : null;
        // Vapeur effective : sous la base du nuage bas (wSousBase), sous le niveau des nuages moyens (wSousMoyen), colonne
        // entière (W) ; dans les nuages (air saturé), elle est dans leur extinction (nuagesColonne).
        const wSous = c ? colonne.wSousBase : (cM ? colonne.wSousMoyen : W);
        const wBasMoyen = c && cM ? Math.max(0, colonne.wSousMoyen - colonne.wSousBase - c.wMoyen) : 0;
        const wDessus = cM ? Math.max(0, W - colonne.wSousMoyen) : (c ? Math.max(0, W - colonne.wSousBase - c.wMoyen) : 0);
        const transfert = (q, Rs, Ds) => {
            const k = COMBOS[q].k;
            let Rm = Rs, Dm = Ds, Rd = Rs, Dd = Ds;
            const vapeur = (w) => {
                const tm = Math.exp(-M * k * w), td = Math.exp(-LH.M_DIFFUS * k * w);
                Rm *= tm * td; Dm *= tm; Rd *= td * td; Dd *= td;
            };
            const nuage = (n) => {
                const r = n.dir[3 * q], td = n.dir[3 * q + 1], e = n.dir[3 * q + 2], Rb = n.dif[2 * q], Tb = n.dif[2 * q + 1];
                const d = 1 - Rb * Rd, U = e * Rm + td * Rd;
                Rm = r + U * Tb / d;
                Dm = e * Dm + (td + U * Rb / d) * Dd;
                Rd = Rb + Tb * Tb * Rd / d;
                Dd = Tb * Dd / d;
            };
            vapeur(wSous);
            if (B) nuage(B);
            if (B && Mo) vapeur(wBasMoyen);
            if (Mo) nuage(Mo);
            vapeur(wDessus);
            if (H) nuage(H);
            return [Rm, Dm];
        };
        // ── Visible (bandes 1–8) : nuages conservatifs sur l'aérosol de fond et le sol, ozone à l'aller et au retour (14, 15).
        const v = transfert(0, SA.R, SA.Db);
        const vis = v[0] * (CS99.PART_VISIBLE - ozDescente - ozRemontee);
        const solVis = (CS99.PART_VISIBLE - ozDescente) * v[1];
        // ── Proche IR : bandes 9, 10 et 11, 10 coefficients chacune.
        let nir = 0, solNir = 0;
        for (let q = 2; q < N_COMBOS; q++) {
            const t = transfert(q, Rg, 1);
            nir += COMBOS[q].h * t[0];
            solNir += COMBOS[q].h * t[1];
        }
        // ── Vapeur du visible (bande 8) : écart au même empilement sans vapeur ni aérosol.
        const par = transfert(1, Rg, 1), ref = transfert(0, Rg, 1);
        return [vis + nir + CS99.PART_PAR * (par[0] - ref[0]), solVis + solNir + CS99.PART_PAR * (par[1] - ref[1])];
    }

    /**
     * Albédo planétaire (sommet de l'atmosphère, avant voile) : surface d'albédo Rg, colonne du profil
     * (RADIATIVE.colonneNuageuse : vapeur, populations de nuages bas, fractions fBas / fMoyen / fHaut). Sous-colonnes en
     * recouvrement aléatoire : clair, bas, moyen, haut et leurs combinaisons. Renvoie aussi les ciels pour le diagnostic.
     */
    /**
     * Albédo au sommet pour UN cosinus d'angle solaire μ₀ : ciels clair, bas, haut, bas + haut (populations), et leur
     * mélange en recouvrement aléatoire. s, u : facteur de Rayleigh et colonne d'ozone (calculés une fois par l'appelant).
     * Réf : Lacis & Hansen 1974, J. Atmos. Sci. 31:118 ; Chou & Suarez 1999, NASA TM-104606 vol. 15 — doc/equation.html#eq-schema ; doc/equation.html#eq-absorption-o2
     */
    function albedoMu(mu, Rg, colonne, s, u) {
        const W = colonne.wTotal;
        const fB = colonne.fBas, fM = colonne.fMoyen, fH = colonne.fHaut;
        const Rr_s = rayleigh(0.0685, s), Ra_s = rayleigh(0.144, s);
        const M = 35 / Math.sqrt(1224 * mu * mu + 1);
        const ozDescente = aOz(M * u);
        const ozRemontee = aOz(M * u + LH.M_DIFFUS_OZONE * u) - ozDescente;
        // ── Ciel clair : visible (Rayleigh + ozone + sol, 14, 15, 40) ; bandes de la vapeur (sol vu à travers W).
        const Rr = CS99.PART_VISIBLE * rayleigh(0.28 / (1 + 6.43 * mu) / CS99.PART_VISIBLE, s);   // part du flux total (40)
        const Ra = rayleigh(0.219 / (1 + 0.816 * mu), s);
        const SA = solAerosol(Rg);                                                 // sol vu à travers l'aérosol de fond
        const RbarOz = Ra + (1 - Ra) * (1 - Ra_s) * SA.R / (1 - Ra_s * SA.R);
        const entreClair = (CS99.PART_VISIBLE - Rr - ozDescente) / (1 - Rr_s * SA.R);   // entre sous la diffusion de Rayleigh (40)
        const solVisClair = entreClair * SA.Db;                                    // descend jusqu'au sol
        const visClair = CS99.PART_VISIBLE - (ozDescente + RbarOz * ozRemontee) - entreClair * (1 - SA.R);
        // Vapeur pour un coefficient k : faisceau direct jusqu'au sol, remontée diffuse — [réfléchi au sommet, descendant au sol].
        const vapeurClair = (k) => {
            const tDirect = Math.exp(-M * k * W);
            return [Rg * tDirect * Math.exp(-LH.M_DIFFUS * k * W), tDirect];
        };
        let nirClair = 0, solNirClair = 0;
        for (let n = 0; n < CS99.K.length; n++) {
            const v = vapeurClair(CS99.K[n]);
            nirClair += H_PROCHE_IR[n] * v[0];
            solNirClair += H_PROCHE_IR[n] * v[1];
        }
        // Vapeur du visible (bande 8) : écart au même trajet sans vapeur, sur la part PAR/V du visible qui le fait — celui qui
        // descend au sol (solVisClair) et celui que le sol renvoie au sommet (entreClair·R(1 − R̄*_r)) ; répartition spectrale
        // uniforme dans le visible, comme pour Rayleigh.
        const tPar = Math.exp(-M * CS99.K_PAR * W), tParRemontee = Math.exp(-LH.M_DIFFUS * CS99.K_PAR * W);
        const partPar = CS99.PART_PAR / CS99.PART_VISIBLE;
        const clair = [visClair + nirClair + partPar * entreClair * SA.R * (1 - Rr_s) * (tPar * tParRemontee - 1),
            solVisClair + solNirClair + partPar * solVisClair * (tPar - 1)];
        // ── Ciels nuageux : populations (bas et moyens : profondeur ; hauts : ln τ), 8 sous-colonnes en recouvrement aléatoire.
        //    Chaque colonne rend [albédo, flux descendant au sol] ; moyennes vectorielles sur les populations.
        const N = nuagesColonne(colonne);
        for (const n of N.tous) eclairer(n, mu);
        const col = (H, B, Mo) => colonneNuageuse(M, ozDescente, ozRemontee, Rg, SA, colonne, H, B, Mo);
        const ajoute = (r, v, w) => { r[0] += w * v[0]; r[1] += w * v[1]; return r; };
        const sur = (liste, fn) => liste.reduce((r, n) => ajoute(r, fn(n), n.poids), [0, 0]);
        const aBas = sur(N.bas, (B) => col(null, B, null));
        const aHaut = sur(N.hauts, (H) => col(H, null, null));
        const aDeux = sur(N.hauts, (H) => sur(N.bas, (B) => col(H, B, null)));
        const zero = [0, 0];
        const aMoyen = fM > 0 ? sur(N.moyens, (Mo) => col(null, null, Mo)) : zero;
        const aBasMoyen = fM > 0 ? sur(N.moyens, (Mo) => sur(N.bas, (B) => col(null, B, Mo))) : zero;
        const aMoyenHaut = fM > 0 ? sur(N.hauts, (H) => sur(N.moyens, (Mo) => col(H, null, Mo))) : zero;
        const aTrois = fM > 0 ? sur(N.hauts, (H) => sur(N.moyens, (Mo) => sur(N.bas, (B) => col(H, B, Mo)))) : zero;
        // O₂ (Chou & Suarez 1999) : réduction du flux descendant en ciel clair, ΔF = 6,33 % · (1 − e^(−k√(w/μ₀))) ; le sol en
        // aurait absorbé (1 − Rg) et renvoyé Rg. Sous nuages, × F_net nuageux / clair (leur éq. 6.18) = rapport des flux
        // descendants au sol (F_net = (1 − Rg) F↓), défini jusqu'à Rg = 1.
        const dO2 = O2.PART_SPECTRE * (1 - Math.exp(-O2.K * Math.sqrt(colonneO2() / mu)));
        const o2 = (v) => { const f = v[1] / clair[1]; return [v[0] - dO2 * Rg * f, v[1] - dO2 * f]; };
        [aBas, aHaut, aDeux, aMoyen, aBasMoyen, aMoyenHaut, aTrois].forEach((v) => { const r = o2(v); v[0] = r[0]; v[1] = r[1]; });
        clair[0] -= dO2 * Rg; clair[1] -= dO2;
        const melange = (i) => (1 - fM) * ((1 - fB) * (1 - fH) * clair[i] + fB * (1 - fH) * aBas[i] + (1 - fB) * fH * aHaut[i] + fB * fH * aDeux[i])
            + fM * ((1 - fB) * (1 - fH) * aMoyen[i] + fB * (1 - fH) * aBasMoyen[i] + (1 - fB) * fH * aMoyenHaut[i] + fB * fH * aTrois[i]);
        // Absorbé au sol = (1 − Rg) × descendant (sol lambertien).
        // Ozone (au-dessus de tout, Lacis & Hansen 1974 éq. 14) : faisceau direct, puis la part renvoyée vers le haut par ce qui est
        // dessous (l'albédo du mélange) qui le retraverse en diffus. C'est le chauffage solaire de la stratosphère.
        return { A: melange(0), S: (1 - Rg) * melange(1), Aclair: clair[0], Sclair: (1 - Rg) * clair[1], Abas: aBas[0], Ahaut: aHaut[0], Amoyen: aMoyen[0],
            ozone: ozDescente + melange(0) * ozRemontee };
    }

    /**
     * Albédo planétaire (sommet de l'atmosphère, avant voile) : surface d'albédo Rg, colonne du profil
     * (RADIATIVE.colonneNuageuse : vapeur, populations de nuages bas, fractions fBas / fMoyen / fHaut). Sous-colonnes en
     * recouvrement aléatoire : clair, bas, moyen, haut et leurs combinaisons. Moyenne GLOBALE : ∫ A(μ₀)·2μ₀ dμ₀ (Gauss-Legendre).
     * Renvoie aussi les ciels pour le diagnostic.
     * Réf : Lacis & Hansen 1974, J. Atmos. Sci. 31:118 ; Joseph, Wiscombe & Weinman 1976, J. Atmos. Sci. 33:2452 ; Chou & Suarez 1999, NASA TM-104606 vol. 15 — doc/equation.html#eq-schema
     */
    function albedo(Rg, colonne) {
        const s = facteurRayleigh();
        const u = colonneOzone();
        let A = 0, Aclair = 0, Abas = 0, Ahaut = 0, S = 0, Sclair = 0, ozone = 0;
        for (let q = 0; q < GL_X.length; q++) {
            const r = albedoMu(GL_X[q], Rg, colonne, s, u);
            const poids = GL_W[q] * 2 * GL_X[q];
            A += poids * r.A;
            Aclair += poids * r.Aclair;
            Abas += poids * r.Abas;
            Ahaut += poids * r.Ahaut;
            S += poids * r.S;
            Sclair += poids * r.Sclair;
            ozone += poids * r.ozone;
        }
        // S : part du flux solaire au sommet absorbée par le SOL ; l'atmosphère absorbe 1 − A − S, dont absOzone par l'ozone.
        return { A: A, Aclair: Aclair, Abas: Abas, Ahaut: Ahaut, S: S, Sclair: Sclair, absOzone: ozone, couverture: 1 - (1 - colonne.fBas) * (1 - colonne.fMoyen) * (1 - colonne.fHaut), ozone: u, rayleigh: s };
    }

    window.SOLAIRE = {
        aOz: aOz,              // absorption de l'ozone (Lacis & Hansen 1974) : chauffage des couches de stratosphère (calculations.js)
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
