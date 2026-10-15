// File: API_BILAN/radiative/calculations.js - Calculs de transfert radiatif
// Desc: Module de calculs radiatifs
// Version 1.10.0
// - v1.10.0 (2026-10-15): nuages MOYENS au niveau σ = SIGMA_MOYEN (fraction F_MOYEN, populations des nuages bas) : IR ici, SW dans solaire.js.
// - v1.9.0 (2026-10-15): DEUX nuages bas, masse d'air maritime et continentale, chacun avec SES gouttes (Martin k, N mesurés) :
//   colonne.populations remplace colonne.tranches. Avant : un seul nuage aux gouttes moyennées (ni cumulus assez, ni stratus).
// - v1.8.4 (2026-10-15): nuage.fMoyen = 0 (nuages moyens non représentés), lu par le simulateur ISCCP.
// - v1.8.3 (2026-10-13): k de Martin pondéré par ALBEDO.fractionMaritime (banquise = air maritime).
// - v1.8.2 (2026-10-13): sommet du nuage bas à f_liq · LWC_pluie (la glace précipite, hypothèse WBF déclarée).
// - v1.8.1 (2026-10-13): CH4_EDS_SCALE retiré (retrait du CH₄ par sa fraction, comme le CO₂).
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.


function temperatureAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const z_trop = window.ATM.calculateTropopauseHeight();
    const Gamma = EPOCH.lapse_rate ? EPOCH.lapse_rate : -(EPOCH['🍎'] / CONST.CP_AIR);
    const T_trop = DATA['🧮']['🧮🌡️'] + Gamma * z_trop;

    if (z < z_trop) {
        return DATA['🧮']['🧮🌡️'] + Gamma * z;
    } else {
        return T_trop;
    }
}


function crossSectionCO2(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionCO2FromLines(wavelength, T_ref, P_ref);
}

// ── Absorption induite par collisions (CIA) du CO₂ : RETIRÉE le 2026-10-13 ──────────────────────────────────────
// Ce n'était pas une mesure : un profil inventé (deux gaussiennes, dont une à 11 µm en pleine fenêtre atmosphérique)
// multiplié par EARTH.CIA_CO2_SCALE = 1e-2, soit 100 fois l'ordre de grandeur de Gruszka & Borysow 1997 (~1e-4
// m⁻¹/amagat² au pic de l'infrarouge lointain), « pour sortir du snowball ». Sur l'Archéen (0,23 bar de CO₂) il fermait
// la fenêtre à lui seul (τ ≈ 16) : OLR 108 W/m² à 288 K. La vraie CIA du CO₂ (bandes roto-translationnelles < 250 cm⁻¹,
// bandes du dimère vers 7 µm) est faible dans la fenêtre sous le bar ; elle reviendra avec les tables mesurées HITRAN CIA.

function crossSectionH2O(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionH2OFromLines(wavelength, T_ref, P_ref);
}

function waterVaporFractionAtZ(z) {
    const DATA = window.DATA;
    // Sans océan possible (PHYS.eauSansLiquide) : rien ne condense près de la surface, la vapeur est bien mélangée
    // (profilVapeurSeule porte le profil complet). Avec océan : vapeur saturée le long du gradient,
    // H_vap = 1/(Γ·d ln p_sat/dT) — physics.js.
    if (window.PHYS.eauSansLiquide()) return DATA['💧']['🍰🫧💧'];
    return DATA['💧']['🍰🫧💧'] * Math.exp(-z / window.PHYS.computeH2OScaleHeight());
}

// ════════════════════════════════════════════════════════════════════════════
// MT_CKD H₂O continuum (Mlawer et al. 2012 JQSRT v3.5 — paramétrique simplifié)
// ════════════════════════════════════════════════════════════════════════════
// PWV (Precipitable Water Vapor) [kg/m²] : intégrale de la densité massique H₂O.
//   ∫ ρ_H₂O(z) dz = ∫ n_air(z) × r(z) × M_H₂O / N_A dz
// Avec n_air(z) = n_0·exp(-z/H_air) et r(z) = r_0·exp(-z/H_H₂O) :
//   PWV = n_0 × r_0 × M_H₂O × k_B / R_GAS × H_eff   où H_eff = 1/(1/H_air + 1/H_H₂O)
// (k_B / R_GAS = 1/N_A ; on exprime sans Avogadro explicite)
function computePWV() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // Sans vapeur (r0 = 0) ou sans atmosphère (n_air_0 = 0), le produit vaut 0 de lui-même.
    const r0 = DATA['💧']['🍰🫧💧'];
    const T = DATA['🧮']['🧮🌡️'];
    const g = window.TIMELINE[DATA['📜']['👉']]['🍎'];
    const H_air = (CONST.R_GAS * T) / (DATA['🫧']['🧪'] * g);
    const H_H2O = window.PHYS.computeH2OScaleHeight();
    const H_eff = 1 / (1 / H_air + 1 / H_H2O);
    const n_air_0 = window.ATM.airNumberDensityAtZ(0);
    // column [molec/m²] = n_air_0 × r_0 × H_eff ; mass [kg/m²] = column × M_H₂O / N_A ; N_A = R_GAS / k_B
    return n_air_0 * r0 * CONST.M_H2O * CONST.BOLTZMANN_KB * H_eff / CONST.R_GAS;
}

// ═══ SECTIONS EFFICACES À LA TEMPÉRATURE DE LA COUCHE ═══════════════════════════════════════════
// HITRAN donne S(296 K) et l'énergie de l'état bas E'' : hitran.js sait en tirer S(T) et γ(T) (lineIntensityS,
// gammaLorentz*). Jusqu'ici le moteur ne les appelait qu'à 296 K, pour toutes les couches, du pôle à l'océan de
// magma. Désormais : tables σ(λ) sur une grille de températures, interpolées linéairement à la T de chaque couche.
// Calculées une fois par grille spectrale (mémoire : clé = nombre de bins et bornes).
// ⚠️ La liste de raies est celle de HITRAN (raies fortes à 296 K), pas HITEMP : les bandes chaudes qui comptent
//    au-delà de ~1 000 K y sont incomplètes. S(T) est juste pour les raies présentes ; les absentes manquent.
const T_GRILLE_SIGMA = [20, 50, 100, 160, 220, 280, 350, 500, 800, 1300, 2000, 3000];   // [K] (20 K : le solveur explore des surfaces très froides — 44 K vu au banc, 🏂)
const _tablesSigma = {};
function tablesSigma(lambda_range) {
    const cle = lambda_range.length + ':' + lambda_range[0] + ':' + lambda_range[lambda_range.length - 1];
    if (cle in _tablesSigma) return _tablesSigma[cle];
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    const t = { CO2: [], H2O: [], CH4: [] };
    for (let k = 0; k < T_GRILLE_SIGMA.length; k++) {
        const T = T_GRILLE_SIGMA[k];
        t.CO2.push(lambda_range.map(l => window.HITRAN.crossSectionCO2FromLines(l, T, P_ref)));
        t.H2O.push(lambda_range.map(l => window.HITRAN.crossSectionH2OFromLines(l, T, P_ref)));
        t.CH4.push(lambda_range.map(l => window.HITRAN.crossSectionCH4FromLines(l, T, P_ref)));
    }
    _tablesSigma[cle] = t;
    return t;
}

// Absorption induite par collisions CO₂–CO₂ MESURÉE (HITRAN CIA 2024, data/cia_CO2_CO2.js) : table k(λ, T) sur la même
// grille de températures que σ, en cm⁵/molécule² ; le worker en tire κ = k·n_CO₂² (n en molécules/cm³). Interpolation
// linéaire en ν (pas de 1 cm⁻¹) puis en T entre les jeux mesurés ; hors de l'intervalle de T mesuré d'une bande, la
// valeur du jeu le plus proche (⚠️ extrapolation à T constante, déclarée). Hors des bandes : 0.
const _tablesCIA = {};
function tablesCIA(lambda_range) {
    const cle = lambda_range.length + ':' + lambda_range[0] + ':' + lambda_range[lambda_range.length - 1];
    if (cle in _tablesCIA) return _tablesCIA[cle];
    const bandes = window.HITRAN_CIA_CO2_CO2;
    const kBande = (b, nu, T) => {
        const x = nu - b.nu0;
        if (x < 0 || x > b.k[0].length - 1) return 0;
        const i = Math.min(Math.floor(x), b.k[0].length - 2), f = x - i;
        const kT = (r) => b.k[r][i] + f * (b.k[r][i + 1] - b.k[r][i]);
        if (T <= b.T[0]) return kT(0);
        if (T >= b.T[b.T.length - 1]) return kT(b.T.length - 1);
        let r = 0;
        while (b.T[r + 1] < T) r++;
        const w = (T - b.T[r]) / (b.T[r + 1] - b.T[r]);
        return kT(r) + w * (kT(r + 1) - kT(r));
    };
    const t = T_GRILLE_SIGMA.map((T) => lambda_range.map((l) => {
        const nu = 0.01 / l;                                    // [cm⁻¹]
        return bandes.reduce((s, b) => s + kBande(b, nu, T), 0);
    }));
    _tablesCIA[cle] = t;
    return t;
}

/** Encadrement de T dans la grille : { iT, wT } avec σ = σ[iT]·(1−wT) + σ[iT+1]·wT. Hors grille : erreur. */
function indexTemperatureSigma(T) {
    const G = T_GRILLE_SIGMA;
    if (!(T >= G[0] && T <= G[G.length - 1])) throw new Error('[RADIATIVE] T de couche ' + T + ' K hors de la grille des sections efficaces [' + G[0] + ', ' + G[G.length - 1] + '] K');
    let i = 0;
    while (i < G.length - 2 && G[i + 1] < T) i++;
    return { iT: i, wT: (T - G[i]) / (G[i + 1] - G[i]) };
}

// Auto-élargissement de H₂O : une molécule d'eau élargit les raies d'eau bien plus qu'une molécule d'air
// (γ_self / γ_air ≈ 5). Négligeable à 1 % de vapeur, dominant dans une atmosphère de vapeur. Le rapport est tiré
// des raies elles-mêmes (moyenne pondérée par S), pas posé.
let _rapportSelfH2O = null;
function rapportAutoElargissementH2O() {
    if (_rapportSelfH2O !== null) return _rapportSelfH2O;
    let num = 0, den = 0;
    for (const l of window.HITRAN_LINES_H2O) { num += l.sw * l.gamma_self; den += l.sw * l.gamma_air; }
    _rapportSelfH2O = num / den;
    return _rapportSelfH2O;
}

/** Continuum H₂O de Roberts et al. 1976 à 296 K [cm² molécule⁻¹ atm⁻¹] ; 0 hors du domaine mesuré (physics.js). */
function continuumH2OCs(lambda) {
    const C = window.EARTH.CONTINUUM_H2O;
    const nu = 0.01 / lambda;   // [cm⁻¹]
    return (nu >= C.NU_MIN && nu <= C.NU_MAX) ? C.A + C.B * Math.exp(-C.BETA * nu) : 0;
}

/**
 * Une couche pour le worker. x_v : fraction MOLAIRE de vapeur ; n_H2O_mol = x_v·n_total (continuum, molaire par
 * définition). Élargissement par la pression : √(P/P_ref) (limite des raies fortes), SANS plafond — l'ancien
 * min(2, …) bridait à 4 atm l'opacité d'une atmosphère de 100 bar ; pour H₂O, P effective = P·(1 + x_v·(R_self − 1)).
 */
function coucheWorker(T, P, n_air, n_CO2, n_H2O, n_CH4, x_v, dz, tauNuage) {
    const C = window.EARTH.CONTINUUM_H2O;
    const P_REF = CONV.STANDARD_ATMOSPHERE_PA;
    const pb = window.CONFIG_COMPUTE.pressureBroadening;
    const it = indexTemperatureSigma(T);
    const P_atm = P / P_REF;
    return {
        T: T, n_air: n_air, n_CO2: n_CO2, n_H2O: n_H2O, n_CH4: n_CH4, delta_z_real: dz,
        tauNuage: tauNuage,   // τ_eff d'absorption IR des nuages de la couche (gris), profilAtmosphere
        iT: it.iT, wT: it.wT,
        pressureBroadening: pb ? Math.sqrt(P_atm) : 1,
        pressureBroadeningH2O: pb ? Math.sqrt(P_atm * (1 + x_v * (rapportAutoElargissementH2O() - 1))) : 1,
        // κ_cont [m⁻¹] = C_s[cm²/molécule/atm]·1e-4 · (e + γ_f·(P − e))[atm] · n_H₂O[m⁻³] · exp(T₀(1/T − 1/296))
        continuum: 1e-4 * P_atm * (x_v + C.GAMMA_FOREIGN * (1 - x_v)) * x_v * n_air * Math.exp(C.T0 * (1 / T - 1 / 296))
    };
}

/**
 * PROFIL VERTICAL DE L'ATMOSPHÈRE — une seule loi, de la Terre actuelle à l'atmosphère de vapeur post-impact.
 * Intégré de la surface vers le haut (pas ≤ 100 m), sur les gaz non condensables (a) et la vapeur (c) :
 *   · hydrostatique : dp = −ρ g dz, ρ = (p_a M_a + p_c M_c)/(R T)
 *   · NON SATURÉ (p_c < p_sat(T)) : adiabatique sèche du mélange, dT/dz = −g/c_p(T), composition figée ;
 *   · SATURÉ : adiabatique humide NON DILUÉE (Pierrehumbert 2010, Principles of Planetary Climate, éq. 2.33)
 *       d ln T / d ln p_a = (R_a/c_pa)·[1 + L r/(R_a T)] / [1 + (c_pc/c_pa + (L/(R_c T) − 1)·L/(c_pa T))·r],
 *       r = (R_a/R_c)·p_c/p_a,  p_c = p_sat(T) (IAPWS),  L = R_c T² · d ln p_sat/dT (même courbe) ;
 *     elle tend vers l'adiabatique sèche quand la vapeur est rare et vers la courbe de saturation quand elle domine ;
 *   · STRATOSPHÈRE : isotherme à la température de peau (S_abs / 2σ)^¼ (équilibre radiatif gris), vapeur figée à
 *     sa fraction de la tropopause (piège froid). Le plancher est min(peau, T_surface).
 * c_p(T) de chaque gaz : NIST-JANAF (PHYS.cpMolaire). Densités MOLAIRES (n_i = x_i · p/kT) : l'ancien profil
 * multipliait n_air par des fractions MASSIQUES (CO₂ compté ×1,5, H₂O ×0,6).
 * Remplace : gradient de config 6,5 K/km sous une tropopause RT/Mg × facteur, vapeur en exp(−z/H_vap), isotherme
 * au-dessus — calés sur la Terre actuelle, hors domaine dans une atmosphère chaude et humide.
 * Renvoie { couches, iTrop } (iTrop = 1ʳᵉ couche stratosphérique, pour les nuages).
 */
function profilAtmosphere(z_range) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const PHYS = window.PHYS;
    const f = DATA['🫧'];
    const ncs = [
        { w: f['🍰🫧🏭'], M: CONST.M_CO2, cp: 'CO2' },
        { w: f['🍰🫧🐄'], M: CONST.M_CH4, cp: 'CH4' },
        { w: f['🍰🫧🫁'], M: CONST.M_O2, cp: 'O2' },
        { w: f['🍰🫧💨'], M: CONST.M_N2, cp: 'N2' }
    ];
    const w_c = DATA['💧']['🍰🫧💧'];
    let nA = 0, wA = 0;
    for (const g of ncs) { nA += g.w / g.M; wA += g.w; }
    const T_s = DATA['🧮']['🧮🌡️'];
    const P_s = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    if (!(P_s > 0)) {   // sans atmosphère (⚫) : le vide, rien n'absorbe
        return { couches: z_range.map((z, i) => coucheWorker(T_s, 0, 0, 0, 0, 0, 0, (i + 1 < z_range.length) ? z_range[i + 1] - z : 1, 0)), iTrop: z_range.length,
            nuage: { W: 0, tauSW: 0, tauIR: 0, base: 0, sommet: 0, lwcPluie: 0,
                populations: [{ nom: 'aucun', poids: 1, tranches: { profondeur: [0], tauSW: [0], tauIR: [0], wMoyen: [0], wSature: [0] }, tauSW: 0, W: 0, sommet: 0 }],
                wTotal: 0, wSousBase: 0, wSousMoyen: 0,
                fBas: 0, fMoyen: 0, fHaut: 0, tHaut: 0 } };
    }
    const M_a = wA / nA;                                   // [kg/mol] masse molaire des non condensables
    const M_c = CONST.M_H2O;
    const xa = ncs.map(g => (g.w / g.M) / nA);              // fractions molaires PARMI les non condensables
    const R_a = CONST.R_GAS / M_a, R_c = CONST.R_GAS / M_c;
    const cpa = (T) => ncs.reduce((s, g) => s + g.w * PHYS.cpMolaire(g.cp, T) / g.M, 0) / wA;   // [J/kg/K]
    const cpc = (T) => PHYS.cpMolaire('H2O', T) / M_c;
    const g = DATA['📅']['🍎'];
    const T_peau = Math.pow(DATA['☀️']['🧲☀️🎱'] * (1 - DATA['🪩']['🍰🪩📿']) / (2 * CONST.STEFAN_BOLTZMANN), 0.25);
    const T_strato = Math.min(T_peau, T_s);
    // Surface : pression partielle de vapeur depuis la fraction massique 🍰🫧💧 (humidité de surface du modèle).
    const x_c0 = (w_c / M_c) / (w_c / M_c + nA * (1 - w_c) / wA);
    let T = T_s, p_c = x_c0 * P_s, p_a = P_s - p_c;
    let strato = T <= T_strato, x_c_strato = p_c / (p_a + p_c);
    const couches = [];
    let iTrop = z_range.length;
    // ── VAPEUR MOYENNE ET NUAGE (physics.js EARTH.NUAGES) ───────────────────────────────────────────────────────────
    // La PARCELLE (p_c ci-dessus) fixe la température : elle monte de la surface, sèche puis saturée (adiabatique
    // humide). L'atmosphère MOYENNE n'est pas saturée : son humidité relative suit Manabe & Wetherald (1967) depuis
    // l'humidité de surface. Au-dessus du point critique (T ≥ T_c) l'eau ne condense pas : vapeur de la parcelle.
    const N = window.EARTH.NUAGES;
    const RH_s = x_c0 * P_s / PHYS.pSatEau(T_s);                       // 0 au-dessus de T_c (p_sat = +∞) : sans objet
    /** Vapeur MOYENNE au niveau courant (fraction molaire), bornée par la parcelle (l'air n'a pas plus d'eau que la surface). */
    const vapeurMoyenne = () => {
        const p = p_a + p_c;
        if (T >= PHYS.EAU.T_C || T_s >= PHYS.EAU.T_C) return p_c / p;
        // Humidité relative de radiosonde : par rapport à l'eau LIQUIDE, même sous 0 °C (PHYS.pSatLiquide). Appliquée
        // par rapport à la glace (avant le 2026-10-13), elle privait la haute troposphère de 30–40 % de sa vapeur.
        const r = RH_s * (p / P_s - N.MW_P_RESIDU) / (1 - N.MW_P_RESIDU);
        return Math.min(p_c / p, r * PHYS.pSatLiquide(T) / p);
    };
    // NUAGE : la parcelle qui sature au niveau de condensation forme le nuage. Au-dessus, son eau en excès condense
    // (adiabatique : q_c = x_surface − x_sat) ; elle reste en gouttes tant que leur rayon effectif est sous le seuil de
    // pluie (R_EFF_PLUIE, 14 µm mesurés), puis précipite : c'est le SOMMET. Épaisseur, eau et τ en sortent, sans réglage :
    //   LWC(z) adiabatique ;  r_eff (Martin 1994) ;  LWC_pluie = (4π/3) ρ_w k N r_pluie³ ;  τ = Σ 3/2·LWC dz/(ρ_w r_eff).
    // Partition de phase (Hu & Stamnes) : glace au rayon déclaré ; le seuil de précipitation porte sur le condensat total. La FRACTION f (🍰🪩⛅) est MESURÉE (calculations_albedo) : la dynamique 3D qui la fixe n'a pas
    // d'équation en 1D. Essais rejetés le 2026-10-13 : Ackerman & Marley (colonne saturée, W ≈ 2 kg/m²) et schéma
    // statistique (nuages étalés sur 5 km, W/C ≈ 0,5–1,3 kg/m²) — tous deux sans inversion, donc sans sommet.
    // Fractions MESURÉES (jauges FROID / CHAUD, fine_tuning_bounds.js) : sans eau, pas de nuage (branche physique).
    const avecEau = w_c > 0;
    const fBas = avecEau ? DATA['🎚️'].CLOUD_SW.F_BAS : 0, fHaut = avecEau ? DATA['🎚️'].CLOUD_SW.F_HAUT : 0;
    const oc = window.ALBEDO.fractionMaritime();                   // masse d'air maritime (bassins, banquise comprise) / continentale
    // DEUX NUAGES BAS, un par masse d'air, chacun avec SES gouttes : maritime (k de Martin 0,80, N jauge Bennartz 2007) et
    // continentale (k 0,67, N 200 cm⁻³, Gultepe & Isaac 2004). Le seuil de pluie LWC_pluie ∝ k N fixe la profondeur, donc
    // τ_max ∝ (k N)² : nuages marins minces, continentaux épais. Moyenner les gouttes en un seul nuage (avant le 2026-10-15)
    // ne donnait ni assez de cumulus ni aucun stratus ; séparés, la population retrouve les classes ISCCP (simulateur
    // radiative/nuages_isccp.js). Poids = part de l'aire (⚠️ déclaré : même fraction de nuages bas sur océan et continent).
    // Profondeur : seuil de pluie atteint avec le nombre de gouttes ACTUEL (mesuré), pas celui de l'époque. Raison mesurée :
    // l'eau nuageuse ne répond presque pas au nombre de gouttes (susceptibilité d ln LWP / d ln N ≈ 0, Toll et al. 2019,
    // Nature 572:51) ; avec N de l'époque, LWC_pluie ∝ N et W ∝ N² (banc 2026-10-13 : 📱 10 °C sous 🚂). L'effet Twomey
    // (même eau, gouttes plus petites, τ plus grand) reste entier : r_eff prend N de l'époque (× rapport de CCN).
    const rCCN = window.ALBEDO.rapportCCN();
    const nuagesBas = [
        { nom: 'océan', poids: oc, k: N.K_MARTIN_OCEAN, nActuel: DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3 * 1e6 },
        { nom: 'continent', poids: 1 - oc, k: N.K_MARTIN_CONTINENT, nActuel: N.CDNC_CONTINENT_CM3 * 1e6 }
    ].map((m) => ({
        nom: m.nom, poids: m.poids, k: m.k, n: m.nActuel * rCCN,                // [m⁻³] gouttes de l'époque (Twomey)
        lwcPluie: 4 / 3 * Math.PI * N.RHO_LIQUIDE * m.k * m.nActuel * Math.pow(DATA['🎚️'].CLOUD_SW.R_EFF_PLUIE, 3),   // [kg/m³]
        sommet: false, zSommet: 0, tauSW: 0, tauIR: 0, W: 0, tauIRCouche: z_range.map(() => 0),
        // Le nuage tranche par tranche, en CUMULS depuis la base : profondeur [m], τ_SW, τ_IR, eau précipitable moyenne et
        // saturée [cm]. Un nuage plus jeune (moins profond) est le même nuage tronqué : solaire.js en tire la population.
        tranches: { profondeur: [0], tauSW: [0], tauIR: [0], wMoyen: [0], wSature: [0] }
    }));
    let dansNuage = false, zBase = 0, z = 0;
    let iEnclume = -1, tEnclume = 0;                     // couche où la parcelle passe T_ENCLUME (nuages hauts)
    let iMoyen = -1, wSousMoyen = 0;                     // couche où p/p_s passe SIGMA_MOYEN (nuages moyens), vapeur effective dessous
    // Eau précipitable EFFECTIVE pour le rayonnement solaire (Lacis & Hansen 1974 éq. 24, mise à l'échelle linéaire en
    // pression, n = 1, et √(T₀/T), T₀ = 273 K) [cm] : colonne entière, sous la base, et tranche par tranche dans le nuage
    // (vapeur moyenne ET vapeur saturée — dans le nuage l'air est saturé). radiative/solaire.js les lit.
    const P0_LH = 101325, T0_LH = 273;
    let wTotal = 0, wSousBase = 0;
    /** Eau précipitable effective d'une tranche dz de fraction molaire de vapeur x [cm]. */
    const wEff = (x, dz) => {
        const p = p_a + p_c;
        return x * p * M_c / (CONST.R_GAS * T) * dz / 10 * (p / P0_LH) * Math.sqrt(T0_LH / T);
    };
    /** Tranche dz du nuage adiabatique c (océan ou continent) : ses épaisseurs optiques DANS le nuage, à la couche ic. */
    const nuage = (c, dz, ic) => {
        const p = p_a + p_c;
        const rho = (p_a * M_a + p_c * M_c) / (CONST.R_GAS * T);
        const M = rho * CONST.R_GAS * T / p;
        const cwc = Math.max(0, x_c0 - p_c / p) * (M_c / M) * rho;               // [kg/m³] condensat adiabatique
        const f_liq = Math.max(0, Math.min(1, (T - N.T_TOUT_GLACE) / (N.T_TOUT_LIQUIDE - N.T_TOUT_GLACE)));
        const lwc = f_liq * cwc;
        // Sommet : le condensat TOTAL atteint l'eau maximale avant précipitation. La glace ne retarde pas la précipitation,
        // elle l'accélère : dans un nuage mixte les cristaux grossissent aux dépens des gouttes et tombent (processus de
        // Wegener–Bergeron–Findeisen) — le seuil des gouttes liquides (14 µm) est donc une borne haute pour tout condensat.
        // v-2026-10-13 : seuil = f_liq · LWC_pluie. ⚠️ HYPOTHÈSE déclarée (limite du processus WBF) : la glace précipite dès
        // qu'elle se forme, seule la part liquide (Hu & Stamnes) peut s'accumuler jusqu'au seuil de pluie. Sans elle, un
        // nuage froid ne précipitait jamais : 1 à 8 kg/m² d'eau, τ jusqu'à 500 sous −10 °C (🪸), quand les observations
        // donnent l'eau nuageuse DÉCROISSANTE vers le froid (Somerville & Remer 1984). Aucun effet sur les nuages liquides.
        if (cwc >= f_liq * c.lwcPluie) { c.sommet = true; c.zSommet = z; return; }
        // Liquide : W/(ρ_w r_eff) = dz·(LWC/ρ_w)^⅔·(4π k N/3)^⅓ (Martin 1994). Glace : rayon déclaré.
        const s = dz * Math.pow(lwc / N.RHO_LIQUIDE, 2 / 3) * Math.cbrt(4 * Math.PI * c.k * c.n / 3)
            + (1 - f_liq) * cwc * dz / (N.RHO_GLACE * N.R_EFF_GLACE);
        c.tauIRCouche[ic] += 0.75 * s;                                           // absorption (Q_abs ≈ 1)
        c.tauIR += 0.75 * s;
        c.tauSW += 1.5 * s;                                                      // extinction (Q_ext ≈ 2)
        c.W += cwc * dz;
        c.zSommet = z;
        const tranches = c.tranches, k = tranches.profondeur.length - 1;
        tranches.profondeur.push(tranches.profondeur[k] + dz);
        tranches.tauSW.push(tranches.tauSW[k] + 1.5 * s);
        tranches.tauIR.push(tranches.tauIR[k] + 0.75 * s);
        tranches.wMoyen.push(tranches.wMoyen[k] + wEff(vapeurMoyenne(), dz));
        tranches.wSature.push(tranches.wSature[k] + wEff(p_c / p, dz));
    };
    const pousser = (i) => {
        const p = p_a + p_c;
        const n = p / (CONST.BOLTZMANN_KB * T);
        const dz = (i + 1 < z_range.length) ? (z_range[i + 1] - z_range[i]) : (z_range[i] - z_range[i - 1]);
        const x_v = strato ? x_v_strato : vapeurMoyenne();
        couches.push(coucheWorker(T, p, n, xa[0] * (1 - x_v) * n, x_v * n, xa[1] * (1 - x_v) * n, x_v, dz, 0));
    };
    let x_v_strato = x_c_strato;                        // surface déjà au plancher stratosphérique : la parcelle
    pousser(0);
    for (let i = 1; i < z_range.length; i++) {
        let reste = z_range[i] - z_range[i - 1];
        while (reste > 0) {
            // Pas de 10 m dans le nuage (quelques centaines de mètres d'épaisseur), 100 m ailleurs.
            const dz = Math.min((dansNuage && nuagesBas.some((c) => !c.sommet)) ? 10 : 100, reste);
            reste -= dz;
            z += dz;
            const p = p_a + p_c;
            const rho = (p_a * M_a + p_c * M_c) / (CONST.R_GAS * T);
            if (strato) {                                   // isotherme, composition figée
                const pn = p * Math.exp(-g * rho / p * dz);
                p_c = x_c_strato * pn; p_a = pn - p_c;
                wTotal += wEff(x_v_strato, dz);
                continue;
            }
            let pas = dz;                                   // longueur réellement intégrée (raccourcie au niveau de condensation)
            if (p_c < PHYS.pSatEau(T) || T >= PHYS.EAU.T_C) {   // non saturé (ou supercritique) : adiabatique sèche
                const wc = p_c * M_c / (rho * CONST.R_GAS * T);
                const gammaSec = g / ((1 - wc) * cpa(T) + wc * cpc(T));
                const T0 = T, x0 = p_c / p;
                const sec = (h) => {                        // état de la parcelle après h mètres d'adiabatique sèche
                    const pn = p - rho * g * h;
                    return { T: T0 - gammaSec * h, pn: pn, pc: x0 * pn };
                };
                let e = sec(dz);
                if (e.T < PHYS.EAU.T_C && e.pc > PHYS.pSatEau(e.T)) {
                    // Le niveau de condensation est DANS le pas : le trouver (dichotomie) et s'y arrêter ; le reste du pas
                    // se fait sur l'adiabatique humide. Sans cela la parcelle finissait le pas en sèche, trop froide, avec
                    // un excès d'eau condensée d'un coup — au chaud, au-delà du seuil de pluie dès la base (nuage nul).
                    let lo = 0, hi = dz;
                    for (let k = 0; k < 30; k++) {
                        const mid = (lo + hi) / 2;
                        const m = sec(mid);
                        if (m.pc > PHYS.pSatEau(m.T)) hi = mid; else lo = mid;
                    }
                    e = sec(hi);
                    reste += dz - hi;
                    z -= dz - hi;
                    pas = hi;
                    dansNuage = true; zBase = z;           // base du nuage
                }
                T = e.T;
                p_c = Math.min(e.pc, PHYS.pSatEau(e.T)); p_a = e.pn - p_c;
            } else {                                        // saturé : adiabatique humide non diluée
                const dln = PHYS.dLnPSatEau(T);
                const L = R_c * T * T * dln;
                const r = (R_a / R_c) * p_c / p_a;
                const q = p_c * M_c / (p_a * M_a);
                const gam = (R_a / cpa(T)) * (1 + L * r / (R_a * T)) /
                    (1 + (cpc(T) / cpa(T) + (L / (R_c * T) - 1) * L / (cpa(T) * T)) * r);
                const dpa = -rho * g * dz / (1 + q);
                T = T + gam * T * dpa / p_a;
                p_a = p_a + dpa;
                p_c = PHYS.pSatEau(T);
            }
            if (T <= T_strato) {
                T = T_strato; x_c_strato = p_c / (p_a + p_c);
                x_v_strato = vapeurMoyenne();               // piège froid : la vapeur MOYENNE de la tropopause, figée
                strato = true;
                continue;
            }
            if (iEnclume < 0 && T <= N.T_ENCLUME) { iEnclume = i - 1; tEnclume = T; }
            if (iMoyen < 0 && (p_a + p_c) / P_s <= N.SIGMA_MOYEN) { iMoyen = i - 1; wSousMoyen = wTotal; }
            const dw = wEff(vapeurMoyenne(), pas);
            wTotal += dw;
            if (!dansNuage) wSousBase += dw;
            if (dansNuage && z > zBase) for (const c of nuagesBas) if (!c.sommet) nuage(c, pas, i - 1);
        }
        if (strato && iTrop === z_range.length) iTrop = i;
        pousser(i);
    }
    // POPULATIONS de nuages BAS (océan, continent) : chacun naît à la base et s'épaissit jusqu'à la pluie (sommet) ; en régime
    // établi toutes les profondeurs sont également représentées (hypothèse de cycle de vie, ⚠️ déclarée — contrôle : classes
    // ISCCP des nuages bas vus d'en haut, radiative/nuages_isccp.js et data/isccp_h_2010.js).
    // Émissivité de flux (diffusivité D, comme le worker) moyennée sur la population : ε̄ = ⟨1 − e^{−D·τ_IR(u)}⟩.
    // Couverture f, recouvrement maximal dans la couche : transmission 1 − f·ε̄, que le worker obtient avec
    // exp(−D·τ_eff), τ_eff = −ln(1 − f·ε̄)/D, réparti au prorata des τ des couches.
    const D = window.EARTH.DIFFUSIVITE;
    // Deux populations (océan, continent) pondérées : émissivité moyenne, τ_IR réparti au prorata de leur profil pondéré.
    const populations = nuagesBas.map((c) => ({ nom: c.nom, poids: c.poids, tranches: c.tranches, tauSW: c.tauSW, W: c.W, sommet: c.zSommet }));
    const epsBas = window.SOLAIRE.moyennePopulation(populations, (c) => 1 - Math.exp(-D * c.tauIR));
    const tauEffBas = -Math.log(1 - fBas * epsBas) / D;
    const tauIRCouche = z_range.map((_, i) => nuagesBas.reduce((a, c) => a + c.poids * c.tauIRCouche[i], 0));
    const tauIR = tauIRCouche.reduce((a, t) => a + t, 0);
    for (let i = 0; i < couches.length; i++) couches[i].tauNuage = tauIR > 0 ? tauIRCouche[i] * tauEffBas / tauIR : 0;
    // NUAGES HAUTS (enclumes, cirrus) au niveau T_ENCLUME, ou au sommet de la troposphère s'il est plus chaud ; seulement
    // s'il y fait assez froid pour la glace.
    // Population à ln τ uniforme (physics.js) ; absorption IR = moitié de l'extinction visible (Q_abs ≈ 1, Q_ext ≈ 2).
    // Recouvrement aléatoire avec les nuages bas : le worker multiplie les transmissions des couches.
    const iHaut = iEnclume >= 0 ? iEnclume : iTrop - 1;
    const tHaut = iEnclume >= 0 ? tEnclume : T_strato;
    const hautPossible = (iEnclume >= 0 || strato) && iHaut >= 0 && tHaut < N.T_TOUT_GLACE;
    const epsHaut = window.SOLAIRE.moyenneHauts((tau) => 1 - Math.exp(-D * tau / 2));
    if (hautPossible) couches[iHaut].tauNuage += -Math.log(1 - fHaut * epsHaut) / D;
    // NUAGES MOYENS (physics.js EARTH.NUAGES) au niveau σ = SIGMA_MOYEN, s'il est sous la tropopause : populations des nuages
    // bas (même émissivité ε̄), recouvrement aléatoire (le worker multiplie les transmissions des couches).
    const fMoyen = avecEau && iMoyen >= 0 ? N.F_MOYEN : 0;
    if (fMoyen > 0) couches[iMoyen].tauNuage += -Math.log(1 - fMoyen * epsBas) / D;
    // nuage : colonne DANS le nuage (avant la fraction f) ; W, τ, sommet, seuil de pluie : moyennes pondérées des deux
    // nuages bas (diagnostic), le détail est dans populations.
    const moy = (cle) => nuagesBas.reduce((a, c) => a + c.poids * c[cle], 0);
    return { couches: couches, iTrop: iTrop,
        nuage: { W: moy('W'), tauSW: moy('tauSW'), tauIR: tauIR, base: zBase, sommet: moy('zSommet'), lwcPluie: moy('lwcPluie'),
            populations: populations, wTotal: wTotal, wSousBase: wSousBase, wSousMoyen: wSousMoyen,
            fBas: fBas, fMoyen: fMoyen, fHaut: hautPossible ? fHaut : 0, tHaut: hautPossible ? tHaut : 0 } };
}

/** Colonne nuageuse à l'état courant (T, composition) : le profil intégré jusqu'au sommet de l'atmosphère. */
function colonneNuageuse() {
    return profilAtmosphere([0, window.DATA['🫧']['📏🫧🧿'] * 1000]).nuage;
}

// Exposer pour debug, plot, sync_panels.
window.RADIATIVE = {
    computePWV: computePWV,
    profilAtmosphere: profilAtmosphere,  // diagnostic : profil T, vapeur, nuages couche par couche
    colonneNuageuse: colonneNuageuse     // τ_SW du nuage pour l'albédo (calculations_albedo), même condensat que l'IR
};

// ============================================================================
// MÉTHANE (CH4)
// ============================================================================

// Section efficace CH4 à partir des lignes HITRAN (hitran.js + hitran_lines_CH4.js)
function crossSectionCH4(wavelength) {
    const CONST = window.CONST;
    const T_ref = window.HITRAN.T_REF_K;
    const P_ref = CONV.STANDARD_ATMOSPHERE_PA;
    return window.HITRAN.crossSectionCH4FromLines(wavelength, T_ref, P_ref);
}

function methaneFractionAtZ(z) {
    return window.DATA['🫧']['🍰🫧🐄'];
}

// Transfert radiatif : physique uniquement (pas de calcul relatif type forçage radiatif).
// Flux entrants/sortants absolus : π B_λ(T), τ = κ×Δz (HITRAN), transmission = exp(-τ), Kirchhoff.
// Convergence = équilibre flux_entrant (solaire absorbé + géothermique) vs flux_sortant (OLR).
// Les "forcing" (calculateCO2Forcing, etc.) sont calculés ailleurs pour affichage uniquement (climate.js).
async function calculateFluxForT0() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    // 🔒 Partition eau déjà mise à jour par le caller (calculateH2OParameters avant chaque calculateFluxForT0 dans la boucle radiatif)
    DATA['📊'] = {};
    
    // Credence ~70%. Plage lit. 20–100 m (LBL 20–50 m, GCM ~100 m). 30 m (après fix delta_z_real → épaisseur réelle par couche).
    const delta_z = 30;
    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    const delta_lambda = 0.1e-6;
    const z_max = DATA['🫧']['📏🫧🧿'] * 1000; // km → m
    
    // Précision fixe (getPrecisionFactorFromFPS retiré en FPS.js v1.2.0, remplacé par courbe Mémoire)
    const precisionFactor = 1;

    // Ajuster delta_z et delta_lambda (toujours à la valeur de base, pas de réduction)
    // Note : delta_z sous tropopause reste constant (pas d'optimisation)
    //const final_delta_lambda = delta_lambda; // Toujours utiliser delta_lambda de base (précision maximale)

    // ⚡ OPTIMISATION : Créer les grilles avec précision adaptative
    // Pour lambda : regrouper en plages de moyennes pour accélérer
    // Pour z : précision fine sous tropopause, grossière au-dessus
    
    
    // Calculer la tropopause pour déterminer les zones de précision (hauteur d'échelle H = R*T/(M*g))
    const z_trop_raw = window.ATM.calculateTropopauseHeight();
    const limit_std_atmosphere_z = 120000;
    const z_trop_precalc = Math.min(z_trop_raw, Math.min(z_max, limit_std_atmosphere_z));

    // Créer la grille lambda avec regroupement adaptatif (sauf si fullSpectre)
    const lambda_range = [];
    const lambda_weights = []; // Poids pour les moyennes pondérées

    // 💧 Résolution spectrale : plafond = CONFIG_COMPUTE.maxSpectralBinsConvergence (défaut 2000)
    // Credence ~70%. Plage lit. bins λ : 100–1000+ (LBL 200–500 typique). 150 = bas de plage ; augmenter si EDS insuffisant.
    const lambda_span = lambda_max - lambda_min;

    {
        const maxAllowedBins = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
        // 🔬🌈 : posé par le solveur (getBinsFromDelta, calculations_flux.js) avant chaque appel.
        let expected_points = Math.max(2, Math.min(DATA['🧮']['🔬🌈'], 10000));
        const nMinHITRAN = window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN;   // 0 = pas de plancher
        if (nMinHITRAN > 0) expected_points = Math.max(expected_points, Math.min(nMinHITRAN, 10000));
        expected_points = Math.max(24, Math.min(expected_points, maxAllowedBins)); // plafond = CONFIG

        function buildAdaptiveLambdaGrid(totalBins) {
            // Grille d'origine (bornes fixes) : utilisée pour les calculs spectraux ; HITRAN sert aux sections efficaces, pas aux bornes ici.
            const regions = [
                [0.1e-6, 4.0e-6, 0.05],
                [4.0e-6, 4.6e-6, 0.10],
                [4.6e-6, 7.0e-6, 0.05],
                [7.0e-6, 8.0e-6, 0.10],
                [8.0e-6, 12.0e-6, 0.08],
                [12.0e-6, 17.0e-6, 0.25],
                [17.0e-6, 25.0e-6, 0.15],
                [25.0e-6, 100.0e-6, 0.22]
            ];
            // Répartition homogène par défaut (poids = largeur en λ) → même Δλ/bin, bandes visuellement uniformes. Désactiver avec CONFIG spectralGridHomogeneous = false pour forcer plus de bins en IR thermique.
            if (window.CONFIG_COMPUTE.spectralGridHomogeneous) {
                for (let i = 0; i < regions.length; i++) {
                    regions[i][2] = regions[i][1] - regions[i][0];
                }
            }
            const filtered = regions.map(r => [Math.max(lambda_min, r[0]), Math.min(lambda_max, r[1]), r[2]]).filter(r => r[1] > r[0]);
            if (filtered.length === 0) return [];
            const weightSum = filtered.reduce((s, r) => s + r[2], 0);
            const normalized = filtered.map(r => [r[0], r[1], r[2] / weightSum]);
            // On construit des bins "bruts" avec points partagés aux jonctions.
            // Après suppression du premier point de chaque région (sauf la 1re),
            // on doit retomber exactement à totalBins.
            const overlap = normalized.length - 1;
            const rawTarget = totalBins + overlap;
            const bins = normalized.map(r => Math.max(3, Math.round(rawTarget * r[2])));
            let allocated = bins.reduce((s, n) => s + n, 0);
            while (allocated < rawTarget) {
                let idx = 0;
                let best = -1;
                for (let i = 0; i < normalized.length; i++) {
                    const score = normalized[i][2] / bins[i];
                    if (score > best) {
                        best = score;
                        idx = i;
                    }
                }
                bins[idx]++;
                allocated++;
            }
            while (allocated > rawTarget) {
                let idx = -1;
                let best = -1;
                for (let i = 0; i < normalized.length; i++) {
                    if (bins[i] <= 3) continue;
                    const score = bins[i] / normalized[i][2];
                    if (score > best) {
                        best = score;
                        idx = i;
                    }
                }
                if (idx < 0) break;
                bins[idx]--;
                allocated--;
            }
            const lambda = [];
            for (let i = 0; i < normalized.length; i++) {
                const lmin = normalized[i][0];
                const lmax = normalized[i][1];
                const nBins = bins[i];
                const step = (lmax - lmin) / (nBins - 1);
                for (let j = 0; j < nBins; j++) {
                    const lam = (j === nBins - 1) ? lmax : (lmin + j * step);
                    if (i > 0 && j === 0) continue; // point de jonction déjà pris par la région précédente
                    lambda.push(lam);
                }
            }
            if (lambda.length !== totalBins) {
                console.error('[buildAdaptiveLambdaGrid] ❌ longueur invalide: ' + lambda.length + ' attendu=' + totalBins);
                throw new Error('buildAdaptiveLambdaGrid longueur invalide');
            }
            if (Math.abs(lambda[lambda.length - 1] - lambda_max) > 1e-12) {
                lambda[lambda.length - 1] = lambda_max;
            }
            return lambda;
        }

        const adaptive_lambda = buildAdaptiveLambdaGrid(expected_points);
        for (let i = 0; i < adaptive_lambda.length; i++) lambda_range.push(adaptive_lambda[i]);
        const base_delta = lambda_range.length > 1 ? (lambda_range[lambda_range.length - 1] - lambda_range[0]) / (lambda_range.length - 1) : lambda_span;
        for (let i = 0; i < lambda_range.length; i++) {
            let local_delta;
            if (lambda_range.length === 1) {
                local_delta = lambda_span;
            } else if (i === 0) {
                local_delta = lambda_range[1] - lambda_range[0];
            } else if (i === lambda_range.length - 1) {
                local_delta = lambda_range[i] - lambda_range[i - 1];
            } else {
                local_delta = (lambda_range[i + 1] - lambda_range[i - 1]) * 0.5;
            }
            lambda_weights.push(local_delta / base_delta);
        }
    }

    // Largeur de bin réelle pour l'intégration : Σ π B_λ Δλ doit utiliser le pas de la grille, pas delta_lambda fixe
    // Sinon avec 50 bins (pas ~2 µm) on multipliait par 0.1 µm → flux total ~20× trop faible (visible/IR mal compté)
    // Idéal LBL : pas spectral piloté par HITRAN (largeur de raie γ_L, γ_D par raie) ; ici grille fixe N bins (🔬🌈).
    // Choix d'évolution : dériver pas max ou N min depuis HITRAN (🔬🌈 gardé mais idéalement rempli par HITRAN). HITRAN : précision par raie,
    // pas identique pour les 3 gaz (CO2, H2O, CH4 ont chacun leurs γ_L, γ_D). Nuages EDS : corps gris, pas de λ (τ uniforme) ; leur effet SW (albédo) est dans calculateAlbedo (🍰🪩⛅ × 🪩🍰⛅).
    const effective_delta_lambda = lambda_range.length > 1 ? (lambda_range[lambda_range.length - 1] - lambda_range[0]) / (lambda_range.length - 1) : lambda_span;

    // Créer la grille z à partir des hauteurs calculées (📏🫧🧿, tropopause). Si tout à 0 → z_max=1e-6, tropo=0 → une couche en une passe.
    const z_range = [];
    const delta_z_troposphere = delta_z;
    const raw_stratosphere = (delta_z * 5) / precisionFactor;
    const delta_z_stratosphere = Math.max(100, raw_stratosphere);
    const delta_z_exosphere = (z_max > 120000) ? 5000 : delta_z_stratosphere;

    if (z_trop_precalc > 0) {
        for (let z = 0; z < z_trop_precalc; z += delta_z_troposphere) {
            z_range.push(z);
        }
        // S'assurer que la tropopause est incluse
        if (z_range.length === 0 || z_range[z_range.length - 1] < z_trop_precalc) {
            z_range.push(z_trop_precalc);
        }
    } else {
        // Tropopause à z=0 ou négative : commencer par z=0
        z_range.push(0);
    }

    const limit_std_atmosphere = 120000;
    let current_z_max_loop = Math.min(z_max, limit_std_atmosphere);
    for (let z = z_trop_precalc + delta_z_stratosphere; z < current_z_max_loop; z += delta_z_stratosphere) {
        z_range.push(z);
    }

    // Si atmosphère massive, continuer au-delà de 120km avec un pas plus grand
    if (z_max > limit_std_atmosphere) {
        // S'assurer d'inclure la limite 120km
        if (z_range[z_range.length - 1] < limit_std_atmosphere) {
            z_range.push(limit_std_atmosphere);
        }

        for (let z = limit_std_atmosphere + delta_z_exosphere; z < z_max; z += delta_z_exosphere) {
            z_range.push(z);
        }
    }

    // S'assurer que z_max est inclus
    if (z_range.length === 0) {
        z_range.push(0);
    } else if (z_range[z_range.length - 1] < z_max) {
        z_range.push(z_max);
    }

    // Plafond couches pour limiter la RAM (4 matrices × nZ × nL peuvent dépasser 1–4 Go)
    const maxLayersConvergence = Math.max(100, window.CONFIG_COMPUTE.maxLayersConvergence);
    if (z_range.length > maxLayersConvergence) {
        const step = (z_range.length - 1) / (maxLayersConvergence - 1);
        const thinned = [];
        for (let k = 0; k < maxLayersConvergence; k++) {
            const idx = (k === maxLayersConvergence - 1) ? z_range.length - 1 : Math.min(Math.floor(k * step), z_range.length - 1);
            thinned.push(z_range[idx]);
        }
        z_range.length = 0;
        z_range.push(...thinned);
    }

    // (flux_init, ychange, YCHANGE_THR initialisés après earth_flux — voir ci-dessous)
    const final_lambda_length = lambda_range.length;
    let sum_blocked_CO2 = 0, sum_blocked_H2O = 0, sum_blocked_CH4 = 0, sum_blocked_clouds = 0, sum_blocked_cont = 0;
    let edsSpectra = null;   // attribution EDS par longueur d'onde (worker v0.7.0)

    // Log du calcul spectral (désactivé pour réduire la taille des logs)
    // console.log(`📊 [calculateFluxForT0@calculations.js] Calcul spectral:`);
    // console.log(`   Nombre de couches atmosphériques: ${num_couches}`);
    // console.log(`   Nombre de plages spectrales: ${num_plages_spectre}`);
    // console.log(`   Produit (cases calculées): ${total_cases}`);

    // Condition limite : flux émis par la surface
    // ⚡ OPTIMISATION : Tenir compte des poids lambda pour les plages regroupées
    const T_surf_flux = DATA['🧮']['🧮🌡️'];
    const earth_flux = lambda_range.map((lambda, idx) => {
        const B = PHYS.planckFunction(lambda, T_surf_flux);
        return Math.PI * B * effective_delta_lambda * lambda_weights[idx];
    });

    // Format 3-flottants-par-λ : flux_init = copie de earth_flux (défini juste au-dessus)
    // ychange = altitude de coupure par λ (init = z_max = pas de coupure observée)
    const flux_init = earth_flux.slice();
    const ychange = new Float64Array(final_lambda_length).fill(z_range[z_range.length - 1]);
    const YCHANGE_THR = 0.05; // 5 % de baisse = début absorption significative

    // Nuages IR : opacité par couche calculée dans profilAtmosphere (Ackerman & Marley 2001, Windsor et al. 2022).
    // Remplace τ = ☁️ × CLOUD_LW_TAU_REF (2,6, sans source) réparti uniformément jusqu'à la tropopause.

    // Sections efficaces : tables σ(λ) sur la grille de températures (interpolées à la T de chaque couche).
    const tab = tablesSigma(lambda_range);
    const continuum_H2O = lambda_range.map(continuumH2OCs);          // continuum H₂O (Roberts 1976), 0 hors 8–25 µm

    // DIAGNOSTIC CO2 (temporaire) : vérifier l'échantillonnage de la bande 15 µm.
    // Activé seulement en mode diagnostic pour éviter un bruit excessif en exécution normale.
    if (window.CONFIG_COMPUTE.logEdsDiagnostic) {
        const cross_section_CO2 = lambda_range.map(lambda => crossSectionCO2(lambda));   // à 296 K (diagnostic)
        const diag_co2 = [];
        const n_co2_surface = window.ATM.airNumberDensityAtZ(0) * DATA['🫧']['🍰🫧🏭'];
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            if (lambda >= 13e-6 && lambda <= 17e-6) {
                const sigma = cross_section_CO2[j];
                const kappa = sigma * n_co2_surface;
                diag_co2.push({
                    lambda_um: (lambda * 1e6).toFixed(3),
                    sigma: sigma.toExponential(3),
                    n_CO2: n_co2_surface.toExponential(3),
                    kappa: kappa.toExponential(3)
                });
            }
        }
        console.table(diag_co2);
        const sigma_co2_max_theorique = 1e-22; // m², ordre de grandeur pic 15 µm
        const kappa_co2_theorique = sigma_co2_max_theorique * n_co2_surface;
        let sigma_co2_max_modele = 0;
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            if (lambda >= 13e-6 && lambda <= 17e-6 && cross_section_CO2[j] > sigma_co2_max_modele) {
                sigma_co2_max_modele = cross_section_CO2[j];
            }
        }
        const kappa_co2_modele = sigma_co2_max_modele * n_co2_surface;
        const ratio_modele_theorie = kappa_co2_theorique > 0 ? (kappa_co2_modele / kappa_co2_theorique) : 0;
        const mK1 = '[DIAG CO2] kappa_max modèle @15µm : ' + kappa_co2_modele.toExponential(3) + ' m⁻¹';
        const mK2 = '[DIAG CO2] kappa_max théorique @15µm : ' + kappa_co2_theorique.toExponential(3) + ' m⁻¹';
        const mK3 = '[DIAG CO2] ratio modèle/théorie : ' + ratio_modele_theorie.toFixed(3);
        const mK4 = '[DIAG CO2] bins dans bande 13-17µm : ' + diag_co2.length + ' (sur ' + lambda_range.length + ' total)';
        console.log(mK1);
        console.log(mK2);
        console.log(mK3);
        console.log(mK4);
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', 'console.table diag_co2 (rows=' + diag_co2.length + ')');
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK1);
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK2);
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK3);
        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mK4);
    }

    // EARTH.CH4_EDS_SCALE (multiplicateur de κ_CH₄, toujours 1) retiré le 2026-10-13 : un réglage-identité « pour caler
    // sur Haqq-Misra 2008 » ; le retrait du CH₄ (computeEdsRemovalShares) met sa fraction à 0, comme pour le CO₂.

    // h2o_enabled et ch4_enabled sont déjà lus depuis DATA au début de la fonction

    // Log supprimé (non essentiel)

    let flux_in = [...earth_flux];

    // 🔒 Caps numériques : tau≥0 (évite transmission=∞, em_flux=-∞) ; flux/bande borné (évite sum→∞)
    const TAU_EFF_MIN = 0;
    const TAU_EFF_MAX = 700;   // exp(-700) ≈ 0
    const MAX_FLUX_PER_BAND = 1e15;

    // 🔒 LOG : Vérifier les densités numériques à z=0 (première couche)
    const z_log = 0;
        const n_air_log = window.ATM.airNumberDensityAtZ(z_log);
    // Logs désactivés pour réduire la taille


    // ── Dispatch parallèle OBLIGATOIRE (Transferable, N-1 workers) ──────────────────
    // Pré-requis strict : workers/worker_pool.js chargé (scie/visu via loader_panels.js, bench via epoch_bench.html).
    // Ancienne voie série retirée : désynchro numérique silencieuse (ordre d'addition float) → scie 15.28°C vs bench 15.35°C
    // pour même config (📱 2000). Crash-first ici pour éviter que ça se reproduise.
    if (!window.spectralWorkerPool.ready) {
        throw new Error('[calculateFluxForT0] spectralWorkerPool absent ou non-ready. Vérifier chargement API_BILAN/workers/worker_pool.js dans le loader.');
    }
    {
        if (window.CONFIG_COMPUTE.logEdsDiagnostic) {
            const mWd = '⚙️ [workers] dispatch ' + lambda_range.length + ' bins × ' + z_range.length + ' layers → ' + window.spectralWorkerPool.nWorkers + ' workers';
            console.log(mWd);
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mWd);
        }
        const nL = lambda_range.length;
        const nZ = z_range.length;
        // Profil vertical : une seule loi physique (adiabatiques sèche / humide non diluée, stratosphère de peau).
        // La grille z reste celle d'avant (pas fin sous calculateTropopauseHeight, plus large au-dessus).
        const profil = profilAtmosphere(z_range);
        const layers_w = profil.couches;
        const i_trop = profil.iTrop;
        const { resultBuf, sums, spectra } = await window.spectralWorkerPool.dispatch({
            lambda_range, lambda_weights,
            sigma_CO2: tab.CO2, sigma_H2O: tab.H2O, sigma_CH4: tab.CH4, cia_CO2: tablesCIA(lambda_range), continuum_H2O,
            earth_flux, layers: layers_w, i_trop,
            effective_delta_lambda,
            diffusivite: window.EARTH.DIFFUSIVITE,
            T_surf: DATA['🧮']['🧮🌡️'],
            constants: { PLANCK_H: CONST.PLANCK_H, SPEED_OF_LIGHT: CONST.SPEED_OF_LIGHT, BOLTZMANN_KB: CONST.BOLTZMANN_KB, MAX_PLANCK_SAFE: CONST.MAX_PLANCK_SAFE }
        }, nZ, nL);
        sum_blocked_CO2 = sums.CO2; sum_blocked_H2O = sums.H2O;
        sum_blocked_CH4 = sums.CH4; sum_blocked_clouds = sums.clouds;
        edsSpectra = spectra;
        sum_blocked_cont = sums.continuum;   // continuum H₂O (déjà compté dans sums.H2O)
        // Extraire flux_final (dernière ligne de resultBuf) + calculer Ychange — O(nZ × nL), pas de copie 2D
        let OLR_w = 0;
        for (let j = 0; j < nL; j++) {
            const f = resultBuf[(nZ - 1) * nL + j];
            flux_in[j] = f;
            OLR_w += f;
        }
        const z_last_w = z_range[nZ - 1];
        for (let j = 0; j < nL; j++) {
            for (let i = 0; i < nZ; i++) {
                if (resultBuf[i * nL + j] < flux_init[j] * (1 - YCHANGE_THR)) {
                    ychange[j] = z_range[i];
                    break;
                }
            }
        }
        if (window.CONFIG_COMPUTE.logEdsDiagnostic) {
            const mWo = '⚙️ [workers] done OLR=' + OLR_w.toFixed(2) + ' W/m²';
            console.log(mWo);
            window.debugMirrorConfigLogToFile('logEdsDiagnostic', mWo);
        }
        // resultBuf non référencé après ici → GC peut collecter le Transferable
    }


    // flux_in contient le flux au sommet après propagation complète (OLR)
    const total_flux_HITRAN = flux_in.reduce((sum, val) => sum + val, 0);
    if (!Number.isFinite(total_flux_HITRAN)) {
        let jNaN = -1;
        for (let j = 0; j < flux_in.length; j++) {
            if (Number.isNaN(flux_in[j])) { jNaN = j; break; }
        }
        const lamS = (jNaN >= 0) ? (' lam_m=' + lambda_range[jNaN]) : '';
        throw new Error('[calculateFluxForT0] OLR (somme des bins) non fini — intégrale=' + total_flux_HITRAN
            + (jNaN >= 0 ? ' (1er bin NaN j=' + jNaN + lamS + ')' : ''));
    }
    const total_flux = total_flux_HITRAN;   // le continuum H₂O est DANS le transfert (worker), résolu en λ
    const earth_flux_total = earth_flux.reduce((sum, val) => sum + val, 0);
    const EDS = earth_flux_total - total_flux;
    // Le continuum est de la vapeur d'eau : sum_blocked_H2O (worker) l'inclut déjà ; sums.continuum le donne à part
    // pour diagnostic. Σ(CO2,H2O,CH4,Clouds) = 1 par construction.
    const sum_blocked_continuum = sum_blocked_cont;
    const sum_blocked_H2O_total = sum_blocked_H2O;
    const sum_blocked = sum_blocked_CO2 + sum_blocked_H2O_total + sum_blocked_CH4 + sum_blocked_clouds;
    // Rien n'absorbe (⚫, sans atmosphère) : toutes les parts à 0.
    const pct = (v) => (sum_blocked > 0) ? v / sum_blocked : 0;
    const eds_breakdown = {
        EDS_Wm2: EDS,
        CO2: { pct: pct(sum_blocked_CO2) },
        H2O: {
            pct: pct(sum_blocked_H2O_total),
            HITRAN_pct: pct(sum_blocked_H2O - sum_blocked_continuum),
            Continuum_pct: pct(sum_blocked_continuum)
        },
        CH4: { pct: pct(sum_blocked_CH4) },
        Clouds: { pct: pct(sum_blocked_clouds) }
    };

    // ─── ATTRIBUTION EDS PAR LONGUEUR D'ONDE ───────────────────────────────────
    // Exposée hors de DATA À DESSEIN : snapshotEdsForConvergence() fait un
    // JSON.parse(JSON.stringify(DATA['📛'])) à chaque pas de convergence, et y mettre quatre
    // spectres de nL bins recopierait tout ça des dizaines de fois par époque. Même statut que
    // window._hystDiag : un diagnostic vivant, lu par l'affichage, jamais par la physique.
    //
    // Unités : `blocked` est en W/m² de flux de surface intercepté, exactement ce que somment
    // sum_blocked_*. Le total EDS (earth_flux_total − total_flux) n'est PAS la même chose — la
    // part d'un gaz dans l'EDS vaut EDS × blocked[j] / sum_blocked, c'est la normalisation que
    // fait déjà `pct()` juste au-dessus. On expose les deux pour que l'affichage n'ait pas à
    // redériver la convention.
    //
    // Le continuum H₂O est résolu en λ : il est dans le spectre '💧' (raies + continuum).
    if (edsSpectra) {
        window.EDS_SPECTRAL = {
            lambda_m: lambda_range,
            blocked: {
                '🏭': edsSpectra.CO2,      // CO₂
                '💧': edsSpectra.H2O,      // H₂O (raies HITRAN + continuum)
                '🐄': edsSpectra.CH4,      // CH₄
                '⛅': edsSpectra.clouds     // nuages (gris, τ réparti sur la troposphère)
            },
            // Le flux ÉMIS PAR LA SURFACE et le flux QUI SORT, bin par bin. Leur différence est
            // l'EDS à cette longueur d'onde — exacte, sans schéma d'attribution, et sa somme sur
            // tout λ vaut EDS_Wm2 par construction. C'est la seule grandeur par bande qui ne
            // dépende d'aucune convention de partage entre espèces.
            surface_flux: earth_flux,
            olr_flux: flux_in,
            sum_blocked: sum_blocked,          // Σ sur λ ET sur les 4 espèces (continuum dans H₂O)
            EDS_Wm2: EDS,                      // l'effet de serre total, ce que les % rapportent
            T_surf_K: DATA['🧮']['🧮🌡️'],
            epochId: DATA['📜'] ? DATA['📜']['🗿'] : null
        };
    }

    // Log du delta (flux sortant - flux entrant initial)
    const delta_spectral = total_flux - earth_flux_total;
    // Log désactivé pour réduire la taille des logs
    // console.log(`📊 [calculateFluxForT0@calculations.js] Résultat calcul spectral:`);
    // console.log(`   Flux entrant initial (surface): ${earth_flux_total.toFixed(2)} W/m²`);
    // console.log(`   Flux sortant final (sommet atm): ${total_flux.toFixed(2)} W/m²`);
    // console.log(`   Delta (sortant - entrant): ${delta_spectral.toFixed(2)} W/m²`);

    DATA['📊'].total_flux = total_flux;
    DATA['📊'].eds_breakdown = eds_breakdown;
    DATA['📊'].delta_z = delta_z;

    // Stockage compressé : 3 × nL flottants (flux_init, ychange, flux_final) au lieu de 4 × nZ × nL.
    // getSpectralResultFromDATA reconstruit upward_flux à la volée (100 lignes) pour plot.js.
    DATA['📊'].lambda_range = lambda_range;
    DATA['📊'].lambda_weights = lambda_weights;
    DATA['📊'].z_range = z_range;
    DATA['📊'].flux_init = flux_init;                  // 1D nL : intensité surface
    DATA['📊'].flux_final = flux_in.slice();            // 1D nL : intensité sommet (OLR par λ)
    DATA['📊'].ychange = Array.from(ychange);           // 1D nL : altitude coupure (m) par λ
    DATA['📊'].earth_flux = flux_init;                  // alias pour plot.js

    DATA['🧮']['🔬🌈'] = lambda_range.length;
    DATA['🧮']['🔬🫧'] = z_range.length;
    return true;
}

// Reconstruction de upward_flux à la volée depuis le format compressé (flux_init, ychange, flux_final).
// Produit DISPLAY_ROWS lignes pour plot.js sans stocker la matrice pleine en DATA.
// Profil par λ : intensityInit → (transition au Ychange) → intensityFinal (step function lissée linéairement).
// O(DISPLAY_ROWS × nL) = ~100 × 2000 = rapide ; backward-compatible avec plot.js (upward_flux[i][j] toujours valide).
function getSpectralResultFromDATA() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const total_flux = DATA['📊'].total_flux;
    const effective_temperature = Math.pow(total_flux / CONST.STEFAN_BOLTZMANN, 0.25);
    const { lambda_range, lambda_weights, z_range, flux_init, flux_final, ychange } = DATA['📊'];
    const nL = lambda_range.length;
    const z_max = z_range[z_range.length - 1];

    // Reconstruction : 100 lignes (z=0 → z=z_max), transition linéaire au Ychange par λ
    const DISPLAY_ROWS = 100;
    const upward_flux = new Array(DISPLAY_ROWS);
    const z_range_display = new Array(DISPLAY_ROWS);
    for (let di = 0; di < DISPLAY_ROWS; di++) {
        const z_rev = (di / Math.max(1, DISPLAY_ROWS - 1)) * z_max; // z=0 (surface) … z=z_max (sommet)
        z_range_display[di] = z_rev;
        const row = new Array(nL);
        for (let j = 0; j < nL; j++) {
            if (z_rev <= ychange[j]) {
                row[j] = flux_init[j]; // en dessous de la coupure : transparent, flux surface
            } else {
                const t = (z_rev - ychange[j]) / Math.max(1, z_max - ychange[j]);
                row[j] = flux_init[j] + t * (flux_final[j] - flux_init[j]); // interpolation linéaire vers OLR
            }
        }
        upward_flux[di] = row;
    }

    return {
        total_flux,
        effective_temperature,
        lambda_range,
        lambda_weights,
        z_range: z_range_display,
        upward_flux,          // 100 × nL reconstruit — backward-compatible plot.js
        optical_thickness: null,
        emitted_flux: null,
        absorbed_flux: null,
        earth_flux: flux_init
    };
}

var RADIATIVE = window.RADIATIVE;   // créé plus haut (computePWV / computeMtCkdContinuumTrap)
/**
 * ─── ATTRIBUTION EDS PAR RETRAIT ───────────────────────────────────────────────────────────
 *
 * Combien chaque absorbeur retient-il RÉELLEMENT ? On l'enlève, à température figée, et on
 * regarde de combien l'OLR remonte. C'est la méthode de Schmidt et al. (2010, JGR 115:D20106)
 * et Lacis et al. (2010, Science 330:356) — celle dont sortent les chiffres qu'on lit partout
 * (vapeur ~50 %, nuages ~25 %, CO₂ ~20 %).
 *
 * ─── POURQUOI ELLE REMPLACE L'ANCIENNE ────────────────────────────────────────────────────
 * Jusqu'au 2026-09-22, DATA['📛'] venait de `sum_blocked_X`, accumulé dans le worker :
 *
 *     sum_blocked_X += flux_in[j] × (1 − exp(−τ_X,couche))      sommé sur ~50 couches
 *
 * Cette somme compte, à CHAQUE couche traversée, ce que l'espèce intercepterait seule. Une
 * bande saturée est donc recomptée cinquante fois, une fenêtre transparente une seule. Mesuré
 * sur 📱 : Σblocked = 11 569 W/m² pour un EDS de 147,5 — un facteur 78. Ce n'était pas une
 * attribution d'effet de serre, c'était un comptage de traversées de couches, et il donnait :
 *
 *     nuages 4,6 W/m² (3 %)   quand le retrait en mesure 54,9 (37 %)
 *     CO₂   54,6 W/m² (37 %)  quand le retrait en mesure 21,6 (15 %)
 *     H₂O   88,3 W/m² (60 %)  quand le retrait en mesure 24,5 (17 %)
 *
 * ─── CE QU'ELLE NE DIT PAS ────────────────────────────────────────────────────────────────
 * Les effets de retrait NE SOMMENT PAS à l'EDS : sur 📱, 54,9 + 24,5 + 21,6 + 1,0 = 102 pour un
 * EDS de 147,5. Les 45 W/m² manquants sont le RECOUVREMENT — quand on retire un absorbeur, les
 * autres reprennent une partie de son travail, donc chaque retrait sous-estime. C'est inhérent
 * à la méthode, pas un bug. Schmidt le contourne en moyennant « retirer un seul » et « ne
 * garder qu'un seul » ; on ne fait ici que le premier, et on normalise pour que les parts
 * ferment à 100 %. Les effets bruts restent exposés dans window.EDS_ATTRIBUTION, non normalisés.
 *
 * ─── COÛT ─────────────────────────────────────────────────────────────────────────────────
 * CINQ passes spectrales de plus, UNE FOIS par époque à la convergence — pas à chaque itération
 * du solveur. Quatre retraits, plus une passe de remise en état (les retraits laissent DATA['📊']
 * et window.EDS_SPECTRAL dans l'état du dernier absorbeur enlevé). Désactivable par CONFIG_COMPUTE.edsAttributionByRemoval = false.
 *
 * @returns {Promise<object|null>} { pct, effects_Wm2, sum_effects_Wm2, olr_ref_Wm2, T_K }
 */
async function computeEdsRemovalShares() {
    const DATA = window.DATA;
    const EARTH = window.EARTH;
    const T_K = DATA['🧮']['🧮🌡️'];
    const olrRef = DATA['📊'].total_flux;
    const save = {
        cloud: DATA['🪩']['🍰🪩⛅'],
        co2:   DATA['🫧']['🍰🫧🏭'],
        h2o:   DATA['💧']['🍰🫧💧'],
        ch4:   DATA['🫧']['🍰🫧🐄']
    };
    const restore = function () {
        DATA['🪩']['🍰🪩⛅'] = save.cloud;
        DATA['🫧']['🍰🫧🏭'] = save.co2;
        DATA['💧']['🍰🫧💧'] = save.h2o;
        DATA['🫧']['🍰🫧🐄'] = save.ch4;
        DATA['🧮']['🧮🌡️']  = T_K;
    };
    const olrSans = async function (poser) {
        restore();
        poser();
        DATA['🧮']['🧮🌡️'] = T_K;   // T FIGÉE : on mesure un forçage, pas une réponse
        await calculateFluxForT0();
        return DATA['📊'].total_flux;
    };
    const eff = {};
    try {
        eff['⛅'] = (await olrSans(function () { DATA['🪩']['🍰🪩⛅'] = 0; })) - olrRef;   // fraction nuageuse à 0
        eff['🏭'] = (await olrSans(function () { DATA['🫧']['🍰🫧🏭'] = 0; })) - olrRef;
        eff['💧'] = (await olrSans(function () { DATA['💧']['🍰🫧💧'] = 0; })) - olrRef;   // raies ET continuum
        eff['🐄'] = (await olrSans(function () { DATA['🫧']['🍰🫧🐄'] = 0; })) - olrRef;
    } finally {
        // ⚠️ Les quatre passes ont laissé DATA['📊'] (total_flux, upward_flux, lambda_range…) et
        // window.EDS_SPECTRAL dans l'état de la DERNIÈRE, c'est-à-dire « sans CH₄ ». Le spectre
        // affiché et getSpectralResultFromDATA() liraient ça. D'où une cinquième passe, tout
        // remis, dont le seul rôle est de rendre l'état de référence. C'est le prix de la méthode.
        restore();
        await calculateFluxForT0();
    }
    const keys = ['🏭', '💧', '🐄', '⛅'];
    let sum = 0;
    for (let i = 0; i < keys.length; i++) {
        // Un effet négatif n'a pas de sens physique ici (retirer un absorbeur ne peut pas faire
        // baisser l'OLR) ; s'il arrive, c'est du bruit numérique, on le met à zéro plutôt que de
        // le laisser fausser la normalisation.
        if (!(eff[keys[i]] > 0)) eff[keys[i]] = 0;
        sum += eff[keys[i]];
    }
    if (!(sum > 0)) return null;
    const pct = {};
    for (let i = 0; i < keys.length; i++) pct[keys[i]] = eff[keys[i]] / sum;
    const out = { pct: pct, effects_Wm2: eff, sum_effects_Wm2: sum, olr_ref_Wm2: olrRef, T_K: T_K,
                  epochId: DATA['📜'] ? DATA['📜']['🗿'] : null };
    window.EDS_ATTRIBUTION = out;
    return out;
}
RADIATIVE.computeEdsRemovalShares = computeEdsRemovalShares;

RADIATIVE.getSpectralResultFromDATA = getSpectralResultFromDATA;

// ============================================================================
// FONCTION : CALCULER LES CAPACITÉS RADIATIVE IR (🍰🫧❀🌈)
// ============================================================================
// Calcule les capacités radiative IR normalisées pour H2O, CO2, CH4
// depuis les données spectrales stockées dans DATA['📊']
//
// FORMULE :
// 🍰🫧❀🌈 = ⟨ 1 - e^{-τ_❀(λ)} ⟩_{IR}
//          = ∫_{λ∈IR} ∫_{z=0}^{z_max} (1 - e^{-τ_❀(λ,z)}) · w(λ) dz dλ
//            ─────────────────────────────────────────────────────────────
//            ∫_{λ∈IR} w(λ) dλ
//
// où :
//   τ_❀(λ,z) = ∫_{z'=0}^{z} κ_❀(λ,z') dz' (épaisseur optique intégrée)
//   κ_❀(λ,z) = σ_❀(λ) × n_❀(z) (coefficient d'absorption)
//   w(λ) = poids radiatif (Planck à T_surface)
//
// Résultat normalisé ∈ [0,1], valable à toutes les époques
function calculateRadiativeCapacities() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    // 🔒 Initialiser toutes les capacités radiatives à 0
    DATA['🫧']['🍰🫧🏭🌈'] = 0;
    DATA['🫧']['🍰🫧💧🌈'] = 0;
    DATA['🫧']['🍰🫧🐄🌈'] = 0;
    DATA['🫧']['🍰🫧📿🌈'] = 0;
    
    // Grille du dernier calculateFluxForT0 (toujours appelé avant).
    const lr = DATA['📊'].lambda_range;
    const zr = DATA['📊'].z_range;
    // 🔒 FILTRER sur l'IR uniquement (λ > 0.7 μm = 0.7e-6 m)
    // L'IR commence à ~0.7-1 μm, on prend 0.7 μm comme limite
    const lambda_IR_min = 0.7e-6; // 0.7 μm en mètres
    const lambda_IR_indices = [];
    for (let j = 0; j < lr.length; j++) {
        if (lr[j] >= lambda_IR_min) {
            lambda_IR_indices.push(j);
        }
    }
    
    // Calculer le poids radiatif (Planck à T_surface) pour chaque longueur d'onde IR
    const lambda_weights_IR = lambda_IR_indices.map(idx => {
        return planckFunction(lr[idx], DATA['🧮']['🧮🌡️']);
    });
    
    // Intégrale du poids radiatif sur IR (pour normalisation)
    const delta_lambda = lr.length > 1 ? (lr[lr.length - 1] - lr[0]) / (lr.length - 1) : 1e-6;
    const weight_integral = lambda_weights_IR.reduce((sum, w) => sum + w, 0) * delta_lambda;
    
    // Précalculer les sections efficaces pour toutes les longueurs d'onde (calcul répétitif → garder const)
    const cross_section_CO2 = lr.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = lr.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = lr.map(lambda => crossSectionCH4(lambda));

    // Initialiser les intégrales pondérées
    let integral_H2O = 0;
    let integral_CO2 = 0;
    let integral_CH4 = 0;
    
    let __firstBad = null;
    function __noteBad(label, idx, j, i, values) {
        if (!__firstBad) __firstBad = Object.assign({ label: label, idx: idx, j: j, i: i }, values);
    }
    for (let idx = 0; idx < lambda_IR_indices.length; idx++) {
        const j = lambda_IR_indices[idx];
        const w_lambda = lambda_weights_IR[idx];
        
        let tau_H2O_lambda = 0;
        let tau_CO2_lambda = 0;
        let tau_CH4_lambda = 0;
        
        for (let i = 0; i < zr.length - 1; i++) {
            const z = zr[i];
            const delta_z = zr[i + 1] - zr[i];
            
            const n_air = window.ATM.airNumberDensityAtZ(z);
            const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
            const n_H2O = n_air * waterVaporFractionAtZ(z);
            const n_CH4 = n_air * methaneFractionAtZ(z);
            
            const kappa_CO2 = cross_section_CO2[j] * n_CO2;
            const kappa_H2O = cross_section_H2O[j] * n_H2O;
            const kappa_CH4 = cross_section_CH4[j] * n_CH4;

            const delta_tau_CO2 = kappa_CO2 * delta_z;
            const delta_tau_H2O = kappa_H2O * delta_z;
            const delta_tau_CH4 = kappa_CH4 * delta_z;
            
            if (!isFinite(delta_tau_CO2) || delta_tau_CO2 < 0) {
                __noteBad('CO2', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_CO2: n_CO2,
                    cross_CO2: cross_section_CO2[j], kappa_CO2: kappa_CO2, delta_tau_CO2: delta_tau_CO2
                });
            }
            if (!isFinite(delta_tau_H2O) || delta_tau_H2O < 0) {
                __noteBad('H2O', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_H2O: n_H2O,
                    waterVaporFrac_z: waterVaporFractionAtZ(z),
                    cross_H2O: cross_section_H2O[j],
                    kappa_H2O: kappa_H2O, delta_tau_H2O: delta_tau_H2O
                });
            }
            if (!isFinite(delta_tau_CH4) || delta_tau_CH4 < 0) {
                __noteBad('CH4', idx, j, i, {
                    lambda: lr[j], z: z, delta_z: delta_z, n_air: n_air, n_CH4: n_CH4,
                    methaneFrac_z: methaneFractionAtZ(z),
                    cross_CH4: cross_section_CH4[j], kappa_CH4: kappa_CH4, delta_tau_CH4: delta_tau_CH4
                });
            }
            tau_CO2_lambda += delta_tau_CO2;
            tau_H2O_lambda += delta_tau_H2O;
            tau_CH4_lambda += delta_tau_CH4;
        }
        
        // Calculer (1 - exp(-tau)) pour chaque gaz
        const transmittance_CO2 = 1 - Math.exp(-tau_CO2_lambda);
        const transmittance_H2O = 1 - Math.exp(-tau_H2O_lambda);
        const transmittance_CH4 = 1 - Math.exp(-tau_CH4_lambda);
        
        // Accumuler les intégrales pondérées
        integral_CO2 += transmittance_CO2 * w_lambda * delta_lambda;
        integral_H2O += transmittance_H2O * w_lambda * delta_lambda;
        integral_CH4 += transmittance_CH4 * w_lambda * delta_lambda;
    }
    
    window.__RAD_CAP_LAST_DBG__ = {
        T_surf: DATA['🧮']['🧮🌡️'],
        IR_bins: lambda_IR_indices.length,
        lr_len: lr.length,
        weight_int: weight_integral,
        integral_CO2: integral_CO2,
        integral_H2O: integral_H2O,
        integral_CH4: integral_CH4,
        cross_CO2_sample: cross_section_CO2[Math.floor(cross_section_CO2.length / 2)],
        cross_H2O_sample: cross_section_H2O[Math.floor(cross_section_H2O.length / 2)],
        n_air_surf: window.ATM.airNumberDensityAtZ(0),
        CO2frac: DATA['🫧']['🍰🫧🏭'],
        H2Ofrac: DATA['💧']['🍰🫧💧'],
        firstBad: __firstBad
    };
    // Normaliser par l'intégrale du poids radiatif
    // 🔒 Si weight_integral = 0 (corps noir, pas d'IR), les capacités restent à 0
    if (weight_integral > 0) {
        DATA['🫧']['🍰🫧🏭🌈'] = Math.max(0, Math.min(1, integral_CO2 / weight_integral));
        DATA['🫧']['🍰🫧💧🌈'] = Math.max(0, Math.min(1, integral_H2O / weight_integral));
        DATA['🫧']['🍰🫧🐄🌈'] = Math.max(0, Math.min(1, integral_CH4 / weight_integral));
        DATA['🫧']['🍰🫧📿🌈'] = DATA['🫧']['🍰🫧🏭🌈'] + DATA['🫧']['🍰🫧💧🌈'] + DATA['🫧']['🍰🫧🐄🌈'];
    }
    // Sinon, les valeurs restent à 0 (déjà initialisées)
    
    return true;
}

RADIATIVE.calculateRadiativeCapacities = calculateRadiativeCapacities;

// ============================================================================
// EXPORT POUR UTILISATION
// ============================================================================

RADIATIVE.temperatureAtZ = temperatureAtZ;
