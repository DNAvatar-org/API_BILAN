// File: API_BILAN/radiative/calculations.js - Calculs de transfert radiatif
// Desc: Module de calculs radiatifs
// Version 1.18.0
// - v1.18.0 (2026-11-06): stratosphère en N_STRATES couches en équilibre radiatif (flux montant et descendant), ozone à la
//   forme verticale mesurée (data/ozone_afgl.js).
// - v1.17.0 (2026-11-06): continuum H₂O MT_CKD 4.3 (tablesContinuum) au lieu de Roberts 1976 ; stratosphère en équilibre radiatif raie par raie, ozone compris (equilibreStratosphere) : le
//   forçage équilibré est le forçage ajusté ; pas saturé hydrostatique (la vapeur suit p_sat, pas le mélange).
// - v1.16.0 (2026-10-30): sections efficaces à la pression de la couche (tables σ(λ, T, P), ln σ linéaire en ln P) au lieu de
//   σ(1 atm)·√(P/P₀).
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.


// Réf : Chase 1998, J. Phys. Chem. Ref. Data Monograph 9 — doc/equation.html#eq-hydrostatique-adiabatique-seche ; Pierrehumbert 2010, Principles of Planetary Climate (Cambridge University Press), éq. 2.33 — doc/equation.html#eq-adiabatique-humide-non-diluee
/** [K/m] Gradient vertical de la parcelle de surface de la colonne moyenne : la loi adiabatique du profil (loiAdiabatique) au sol,
 *  sèche — la parcelle part de l'humidité de surface du modèle (🍰🫧💧), sous la saturation. Lu par temperatureAtZ et par la
 *  hauteur d'échelle de la vapeur (PHYS.computeH2OScaleHeight). */
function gradientSurface() {
    const DATA = window.DATA;
    return loiAdiabatique().gammaSec(DATA['🧮']['🧮🌡️'], DATA['💧']['🍰🫧💧']);
}

/** [K] Température de la colonne moyenne à l'altitude z [m] : gradient de la parcelle de surface (gradientSurface) jusqu'à la
 *  tropopause (ATM.calculateTropopauseHeight), isotherme au-dessus. Diagnostic (densités de calculateRadiativeCapacities). */
function temperatureAtZ(z) {
    return window.DATA['🧮']['🧮🌡️'] - gradientSurface() * Math.min(z, window.ATM.calculateTropopauseHeight());
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
    const g = DATA['📅']['🍎'];
    const H_air = (CONST.R_GAS * T) / (DATA['🫧']['🧪'] * g);
    const H_H2O = window.PHYS.computeH2OScaleHeight();
    const H_eff = 1 / (1 / H_air + 1 / H_H2O);
    const n_air_0 = window.ATM.airNumberDensityAtZ(0);
    // column [molec/m²] = n_air_0 × r_0 × H_eff ; mass [kg/m²] = column × M_H₂O / N_A ; N_A = R_GAS / k_B
    return n_air_0 * r0 * CONST.M_H2O * CONST.BOLTZMANN_KB * H_eff / CONST.R_GAS;
}

// ═══ SECTIONS EFFICACES À LA TEMPÉRATURE ET À LA PRESSION DE LA COUCHE ═══════════════════════════════
// HITRAN donne S(296 K), l'énergie de l'état bas E'' et les coefficients d'élargissement : hitran.js en tire S(T), la largeur
// de Lorentz γ_L = P·[x_s γ_self(T) + (1 − x_s) γ_air(T)] et la largeur Doppler γ_D(T). Tables σ(λ) sur une grille de
// températures et de pressions, interpolées à la (T, P) de chaque couche : linéairement en T ; en P, ln σ linéaire en ln P,
// exact pour σ ∝ P^a (aile de Lorentz a = 1, centre d'une raie de Lorentz a = −1, raie gaussienne a = 0). Un point de la grille
// spectrale est presque toujours dans les ailes (points espacés de 2 à 8 cm⁻¹, raies larges de 0,07 cm⁻¹ à 1 atm) : σ y décroît
// comme P. La loi σ(1 atm)·√(P/P₀) est la limite des raies fortes de la largeur équivalente d'une BANDE, pas celle d'une section
// efficace en un point : elle doublerait les ailes vers 250 hPa (forçage du CH₄ de 📱 ×1,45 au sommet, contrôle raie par raie
// dense à 0,01 cm⁻¹).
// Calculées une fois par grille spectrale (mémoire : clé = nombre de bins et bornes).
// ⚠️ La liste de raies est celle de HITRAN (raies fortes à 296 K), pas HITEMP : les bandes chaudes qui comptent
//    au-delà de ~1 000 K y sont incomplètes. S(T) est juste pour les raies présentes ; les absentes manquent.
const T_GRILLE_SIGMA = [20, 50, 100, 160, 220, 280, 350, 500, 800, 1300, 2000, 3000];   // [K] (20 K : le solveur explore des surfaces très froides — 44 K vu au banc, 🏂)
// [atm] demi-décades de 10⁻⁵ à 10⁴ atm. Sous 10⁻⁵ atm, γ_L/γ_D < 10⁻³ : raies gaussiennes, σ ne dépend plus de P, la table de
// 10⁻⁵ atm vaut. Au-dessus de 10⁴ atm : hors domaine (erreur).
const P_GRILLE_SIGMA = Array.from({ length: 19 }, (_, k) => Math.pow(10, k / 2 - 5));
const _tablesSigma = {};
// Réf : Kochanov et al. 2016, J. Quant. Spectrosc. Radiat. Transfer 177:15 — doc/equation.html#eq-elargissement-par-pression
/** Tables σ [m²/molécule] : t[gaz][iT·nP + iP][j] à T_GRILLE_SIGMA[iT], P_GRILLE_SIGMA[iP], lambda_range[j].
 *  Au-dessus de sa table TIPS (O₃ 1000 K, CH₄ 2500 K), une molécule a σ = 0 : elle s'y dissocie (O₃ dès quelques centaines de
 *  kelvins, CH₄ par pyrolyse), sa fonction de partition n'y est d'ailleurs pas publiée. */
function tablesSigma(lambda_range) {
    const cle = lambda_range.length + ':' + lambda_range[0] + ':' + lambda_range[lambda_range.length - 1];
    if (cle in _tablesSigma) return _tablesSigma[cle];
    const P_Pa = P_GRILLE_SIGMA.map((p) => p * CONV.STANDARD_ATMOSPHERE_PA);
    const t = { nP: P_GRILLE_SIGMA.length, CO2: [], H2O: [], CH4: [], O3: [], N2O: [] };
    for (const gaz of ['CO2', 'H2O', 'CH4', 'O3', 'N2O']) {
        for (const T of T_GRILLE_SIGMA) {
            const parPoint = T <= window.HITRAN.tMaxTips(gaz)
                ? lambda_range.map((l) => window.HITRAN.crossSectionsInAir(gaz, l, T, P_Pa))   // [j][iP]
                : lambda_range.map(() => P_Pa.map(() => 0));
            for (let iP = 0; iP < t.nP; iP++) t[gaz].push(parPoint.map((s) => s[iP]));
        }
    }
    _tablesSigma[cle] = t;
    return t;
}

/** Encadrement de P [atm] dans la grille, en ln P : { iP, wP } avec ln σ = (1−wP)·ln σ[iP] + wP·ln σ[iP+1]. Sous la grille, la
 *  table de 10⁻⁵ atm (raies gaussiennes) ; au-dessus : erreur. */
function indexPressionSigma(P_atm) {
    const G = P_GRILLE_SIGMA;
    if (!(P_atm <= G[G.length - 1])) throw new Error('[RADIATIVE] P de couche ' + P_atm + ' atm au-dessus de la grille des sections efficaces (' + G[G.length - 1] + ' atm)');
    const x = Math.log(Math.max(P_atm, G[0]) / G[0]) / Math.log(G[1] / G[0]);
    const i = Math.min(Math.floor(x), G.length - 2);
    return { iP: i, wP: x - i };
}

// Absorption induite par collisions CO₂–CO₂ MESURÉE (HITRAN CIA 2024, data/cia_CO2_CO2.js) : table k(λ, T) sur la même
// grille de températures que σ, en cm⁵/molécule² ; le worker en tire κ = k·n_CO₂² (n en molécules/cm³). Interpolation
// linéaire en ν (pas de 1 cm⁻¹) puis en T entre les jeux mesurés ; hors de l'intervalle de T mesuré d'une bande, la
// valeur du jeu le plus proche (⚠️ extrapolation à T constante, déclarée). Hors des bandes : 0.
// Réf : Karman et al. 2019, Icarus 328:160 — doc/equation.html#eq-absorption-induite-par-collisions
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
// Réf : Kochanov et al. 2016, J. Quant. Spectrosc. Radiat. Transfer 177:15 — doc/equation.html#eq-auto-elargissement-vapeur
let _rapportSelfH2O = null;
function rapportAutoElargissementH2O() {
    if (_rapportSelfH2O !== null) return _rapportSelfH2O;
    let num = 0, den = 0;
    for (const l of window.HITRAN_LINES_H2O) { num += l.sw * l.gamma_self; den += l.sw * l.gamma_air; }
    _rapportSelfH2O = num / den;
    return _rapportSelfH2O;
}

/**
 * CONTINUUM DE LA VAPEUR D'EAU MT_CKD 4.3 (data/mtckd_h2o.js ; Mlawer et al. 2012, Phil. Trans. R. Soc. A 370:2520) : ce qui
 * absorbe au-delà des raies de Voigt coupées à ±25 cm⁻¹ et privées de leur valeur à 25 cm⁻¹ (la « plinthe », hitran.js) — la
 * convention dans laquelle il a été mesuré. Tables [iT][j] sur T_GRILLE_SIGMA, en cm² molécule⁻¹ par unité de densité réduite :
 *     self(ν, T)    = C_self(ν, 296 K)·(296/T)^texp(ν) · R(ν, T)
 *     foreign(ν, T) = C_foreign(ν, 296 K) · R(ν, T),          R(ν, T) = ν·tanh(c₂ν / 2T) (terme de rayonnement)
 * et κ [cm⁻¹] = n_w·[self·(n_w/n_ref) + foreign·(n_f/n_ref)], n_ref = P_ref/(k T_ref) (1013 hPa, 296 K) : le facteur de couche
 * est dans coucheWorker. Coefficients interpolés linéairement en ν (pas de 10 cm⁻¹). ⚠️ (296/T)^texp est mesuré aux
 * températures atmosphériques : au-dessus de ~350 K et sous ~200 K c'est une extrapolation (atmosphère de vapeur hadéenne).
 */
const _tablesContinuum = {};
function tablesContinuum(lambda_range) {
    const cle = lambda_range.length + ':' + lambda_range[0] + ':' + lambda_range[lambda_range.length - 1];
    if (cle in _tablesContinuum) return _tablesContinuum[cle];
    const M = window.MTCKD_H2O, c2 = window.HITRAN.C2_CMK;
    // Au-delà de la table (ν > 20 000 cm⁻¹, λ < 0,5 µm) : continuum non publié, et sans objet pour l'infrarouge thermique
    // (le solaire de la vapeur est le schéma de Chou & Suarez, solaire.js) : 0, déclaré. En deçà de nu0 : impossible (grille ≥ 10 cm⁻¹).
    const nuMax = M.nu0 + (M.n - 1) * M.pas;
    const coef = (tab, nu) => {
        if (nu >= nuMax) return 0;
        const x = (nu - M.nu0) / M.pas, k = Math.floor(x);
        if (!(k >= 0)) throw new Error('[MT_CKD] ν = ' + nu + ' cm⁻¹ sous la table');
        return tab[k] + (x - k) * (tab[k + 1] - tab[k]);
    };
    const t = { self: [], foreign: [] };
    for (const T of T_GRILLE_SIGMA) {
        t.self.push(lambda_range.map((l) => {
            const nu = 0.01 / l, R = nu * Math.tanh(c2 * nu / (2 * T));
            return coef(M.self, nu) * Math.pow(M.tRef / T, coef(M.texp, nu)) * R;
        }));
        t.foreign.push(lambda_range.map((l) => {
            const nu = 0.01 / l;
            return coef(M.foreign, nu) * nu * Math.tanh(c2 * nu / (2 * T));
        }));
    }
    _tablesContinuum[cle] = t;
    return t;
}

/**
 * Une couche pour le worker. x_v : fraction MOLAIRE de vapeur ; n_H2O_mol = x_v·n_total (continuum, molaire par
 * définition). Sections efficaces à la (T, P) de la couche (tablesSigma) ; pour H₂O, l'auto-élargissement donne la pression
 * effective P·(1 + x_v·(R_self − 1)). CONFIG_COMPUTE.pressureBroadening = false : tables de 1 atm à toutes les couches.
 * Réf : Kochanov et al. 2016, J. Quant. Spectrosc. Radiat. Transfer 177:15 — doc/equation.html#eq-elargissement-par-pression ; Roberts, Selby & Biberman 1976, Appl. Opt. 15:2085 — doc/equation.html#eq-continuum-vapeur-eau
 */
function coucheWorker(T, P, n_air, n_CO2, n_H2O, n_CH4, n_O3, n_N2O, x_v, dz, tauNuage) {
    const M = window.MTCKD_H2O;
    const n_ref = M.pRefHpa * 100 / (CONST.BOLTZMANN_KB * M.tRef) * 1e-6;   // [cm⁻³]
    const n_cm3 = n_air * 1e-6, n_w = x_v * n_cm3;
    const P_REF = CONV.STANDARD_ATMOSPHERE_PA;
    const pb = window.CONFIG_COMPUTE.pressureBroadening;
    const it = indexTemperatureSigma(T);
    const P_atm = P / P_REF;
    const ip = indexPressionSigma(pb ? P_atm : 1);
    const ipH2O = indexPressionSigma(pb ? P_atm * (1 + x_v * (rapportAutoElargissementH2O() - 1)) : 1);
    return {
        T: T, n_air: n_air, n_CO2: n_CO2, n_H2O: n_H2O, n_CH4: n_CH4, n_O3: n_O3, n_N2O: n_N2O, delta_z_real: dz,
        tauNuage: tauNuage,   // τ_eff d'absorption IR des nuages de la couche (gris), profilAtmosphere
        iT: it.iT, wT: it.wT,
        iP: ip.iP, wP: ip.wP,                 // CO₂, CH₄, O₃, N₂O
        iPH2O: ipH2O.iP, wPH2O: ipH2O.wP,     // H₂O (pression effective de l'auto-élargissement)
        // Continuum MT_CKD : κ [m⁻¹] = 100·n_w·[self(T)·n_w/n_ref + foreign(T)·n_f/n_ref] (tablesContinuum), n en cm⁻³
        contSelf: 100 * n_w * n_w / n_ref,
        contForeign: 100 * n_w * (n_cm3 - n_w) / n_ref
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
 *   · STRATOSPHÈRE : N_STRATES couches, chacune à sa température d'équilibre radiatif 🌡️🫧🛩[k] (equilibreStratosphere, raie
 *     par raie, ozone compris), vapeur figée à sa fraction de la tropopause (piège froid), ozone à la forme mesurée. La
 *     tropopause : la parcelle atteint min(🌡️🫧🛩[0], T_surface).
 * c_p(T) de chaque gaz : NIST-JANAF (PHYS.cpMolaire). Densités MOLAIRES (n_i = x_i · p/kT) : l'ancien profil
 * multipliait n_air par des fractions MASSIQUES (CO₂ compté ×1,5, H₂O ×0,6).
 * Remplace : gradient de config 6,5 K/km sous une tropopause RT/Mg × facteur, vapeur en exp(−z/H_vap), isotherme
 * au-dessus — calés sur la Terre actuelle, hors domaine dans une atmosphère chaude et humide.
 * Renvoie { couches, iTrop } (iTrop = 1ʳᵉ couche stratosphérique, pour les nuages).
 * Réf : U.S. Standard Atmosphere 1976, NOAA-S/T 76-1562 — doc/equation.html#eq-humidite-moyenne-altitude ; Stubenrauch et al. 2024, Surv. Geophys. 45:1999 — doc/equation.html#eq-fractions-nuages-bas-hauts ; Marley, Saumon & Goldblatt 2010, ApJL 723:L117 — doc/equation.html#eq-couverture-partielle-dans-transfert ; Hartmann & Larson 2002, GRL 29:1951 ; Kuang & Hartmann 2007, J. Climate 20:2051 ; Young et al. 2018, Earth Syst. Sci. Data 10:583 — doc/equation.html#eq-nuages-hauts-altitude-epaisseurs
 */
/**
 * LOI ADIABATIQUE DU PROFIL, pour la composition et la gravité de DATA (🫧 fractions massiques, 📅 🍎) : la seule loi du gradient
 * vertical du modèle — profilAtmosphere, temperatureAtZ, la hauteur d'échelle de la vapeur (PHYS.computeH2OScaleHeight) et la
 * colonne d'un point de calotte (physics/calottes.js) la lisent.
 *   · non saturé : adiabatique sèche du mélange, dT/dz = −g / [(1 − w_c) c_pa(T) + w_c c_pc(T)] (gammaSec, K/m) ;
 *   · saturé : adiabatique humide non diluée (Pierrehumbert 2010, éq. 2.33), d ln T / d ln p_a (penteHumide) ;
 *   c_p(T) de chaque gaz : NIST-JANAF (PHYS.cpMolaire) ; L = R_c T² d ln p_sat/dT (IAPWS).
 * ascension(T₀, p₀, x₀, z) : état { T [K], p [Pa], pc [Pa, pression partielle de vapeur] } d'une parcelle partie de T₀, p₀ avec
 * la fraction molaire de vapeur x₀, après z mètres de montée, par pas ≤ 100 m, niveau de condensation cherché dans le pas
 * (dichotomie), comme le profil ; repartir de { T, p, pc/p } continue la même montée.
 */
function loiAdiabatique() {
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
    let nA = 0, wA = 0;
    for (const g of ncs) { nA += g.w / g.M; wA += g.w; }
    const M_a = wA / nA;                                   // [kg/mol] masse molaire des non condensables
    const M_c = CONST.M_H2O;
    const R_a = CONST.R_GAS / M_a, R_c = CONST.R_GAS / M_c;
    const cpa = (T) => ncs.reduce((s, g) => s + g.w * PHYS.cpMolaire(g.cp, T) / g.M, 0) / wA;   // [J/kg/K]
    const cpc = (T) => PHYS.cpMolaire('H2O', T) / M_c;
    const g = DATA['📅']['🍎'];
    /** [K/m] Gradient adiabatique sec du mélange à la fraction massique de vapeur wc. */
    const gammaSec = (T, wc) => g / ((1 - wc) * cpa(T) + wc * cpc(T));
    /** [-] d ln T / d ln p_a de la parcelle saturée à T (p_a, p_c : pressions partielles des non condensables et de la vapeur). */
    const penteHumide = (T, p_a, p_c) => {
        const dln = PHYS.dLnPSatEau(T);
        const L = R_c * T * T * dln;
        const r = (R_a / R_c) * p_c / p_a;
        return (R_a / cpa(T)) * (1 + L * r / (R_a * T)) /
            (1 + (cpc(T) / cpa(T) + (L / (R_c * T) - 1) * L / (cpa(T) * T)) * r);
    };
    const ascension = (T0, p0, x0, z) => {
        let T = T0, p_c = x0 * p0, p_a = p0 - p_c, reste = Math.max(0, z);
        while (reste > 0) {
            let dz = Math.min(100, reste);
            const p = p_a + p_c, rho = (p_a * M_a + p_c * M_c) / (CONST.R_GAS * T);
            if (p_c < PHYS.pSatEau(T) || T >= PHYS.EAU.T_C) {   // non saturé : adiabatique sèche, composition figée
                const gs = gammaSec(T, p_c * M_c / (rho * CONST.R_GAS * T)), x = p_c / p, T1 = T;
                const sec = (h) => ({ T: T1 - gs * h, pn: p - rho * g * h });
                let e = sec(dz);
                if (e.T < PHYS.EAU.T_C && x * e.pn > PHYS.pSatEau(e.T)) {   // condensation dans le pas : s'y arrêter
                    let lo = 0, hi = dz;
                    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2, s = sec(m); if (x * s.pn > PHYS.pSatEau(s.T)) hi = m; else lo = m; }
                    dz = hi; e = sec(hi);
                }
                T = e.T; p_c = Math.min(x * e.pn, PHYS.pSatEau(e.T)); p_a = e.pn - p_c;
            } else {                                        // saturé : adiabatique humide non diluée
                // Hydrostatique : dp_a + dp_c = −ρ g dz, avec dp_c = p_c (d ln p_sat/d ln T)(d ln T/d ln p_a) dp_a/p_a
                // (la vapeur suit la saturation, pas le mélange) : dp_a = −ρ g dz / [1 + (p_c/p_a)·T·d ln p_sat/dT·γ].
                const gam = penteHumide(T, p_a, p_c);
                const dpa = -rho * g * dz / (1 + p_c / p_a * T * PHYS.dLnPSatEau(T) * gam);
                T = T + gam * T * dpa / p_a;
                p_a = p_a + dpa;
                p_c = PHYS.pSatEau(T);
            }
            reste -= dz;
        }
        return { T: T, p: p_a + p_c, pc: p_c };
    };
    return { nA: nA, wA: wA, M_a: M_a, M_c: M_c, R_a: R_a, R_c: R_c, g: g, cpa: cpa, cpc: cpc,
        gammaSec: gammaSec, penteHumide: penteHumide, ascension: ascension };
}

// STRATOSPHÈRE EN COUCHES : N_STRATES couches de température chacune en équilibre radiatif (equilibreStratosphere). Les
// N_STRATES − 1 premières découpent la stratosphère en parts égales de ln p, de la tropopause à P_STRATOPAUSE_PA ; la dernière
// prend tout ce qui est au-dessus (mésosphère). 🔢 8 couches : choix numérique. 📡 Stratopause vers 1 hPa (atmosphère standard
// US 1976 : 47–51 km). Une stratosphère isotherme retirait 6,7 à 9,4 W/m² d'OLR à des profils mesurés (doc/CONSTATS.md C18).
const N_STRATES = 8;
const P_STRATOPAUSE_PA = 100;
/** Couche de stratosphère [0, N_STRATES − 1] d'une pression p [Pa], au-dessus d'une tropopause à pTrop [Pa]. */
function strateDe(p, pTrop) {
    if (!(pTrop > P_STRATOPAUSE_PA) || p <= P_STRATOPAUSE_PA) return N_STRATES - 1;
    return Math.min(N_STRATES - 2, Math.max(0, Math.floor((N_STRATES - 1) * Math.log(pTrop / p) / Math.log(pTrop / P_STRATOPAUSE_PA))));
}
/** FORME de l'ozone (data/ozone_afgl.js) : rapport de mélange x(p) [mol/mol], interpolé en ln p, et ∫₀^p x dp [Pa], qui
 *  normalise la forme à une colonne : N(au-dessus de p) = I(p)·N_A/(M̄ g). Hors de la table : la valeur de son bord. */
const OZONE_FORME = (function () {
    const O = window.OZONE_AFGL;
    const p = O.p_hPa.map((v) => v * 100).reverse(), x = O.x.slice().reverse();   // p croissant
    const I = [p[0] * x[0]];
    for (let i = 1; i < p.length; i++) I.push(I[i - 1] + 0.5 * (x[i] + x[i - 1]) * (p[i] - p[i - 1]));
    const lnp = p.map(Math.log);
    const cherche = (P) => { let i = 0; while (i < p.length - 2 && p[i + 1] < P) i++; return i; };
    return {
        x: (P) => {
            if (P <= p[0]) return x[0];
            if (P >= p[p.length - 1]) return x[x.length - 1];
            const i = cherche(P), u = (Math.log(P) - lnp[i]) / (lnp[i + 1] - lnp[i]);
            return x[i] + u * (x[i + 1] - x[i]);
        },
        I: (P) => {
            if (P <= p[0]) return P * x[0];
            if (P >= p[p.length - 1]) return I[I.length - 1] + x[x.length - 1] * (P - p[p.length - 1]);
            const i = cherche(P), u = (P - p[i]) / (p[i + 1] - p[i]);
            return I[i] + u * (I[i + 1] - I[i]);
        }
    };
})();

/**
 * TEMPÉRATURE DE L'ENVIRONNEMENT DE LA COLONNE [K] en fonction de z [m] : moyenne, pondérée par l'aire (EARTH.ZONES), des
 * profils des trois zones du bilan méridien (surface T_s − dT_z, MERIDIEN.ecarts ; même humidité relative de surface) :
 *   · TROPIQUES : la parcelle de surface (adiabatique sèche puis humide, LOI.ascension) — quasi-équilibre convectif, la parcelle
 *     garde son énergie statique humide jusqu'à la tropopause (Held 1982, J. Atmos. Sci. 39:412, éq. 9) ;
 *   · LATITUDES MOYENNES : le plus CHAUD de la parcelle et du gradient critique de l'ajustement barocline (Stone 1978, J. Atmos.
 *     Sci. 35:561, éq. 4 : ∂T/∂φ = −H (θ₁ − θ₃)/(z₁ − z₃) cot φ, le gradient observé y colle en toutes saisons) inversé : la
 *     stabilité dθ/dz = −(∂T/∂φ) tan φ / H, à l'interface σ = 0,6 (600 hPa chez Stone), ∂T/∂φ = 3 T₂ sin φ cos φ (mode P₂ du
 *     bilan méridien, T₂ = 🧮 🌡️🎱) à la latitude centrale de la zone — Held 1982 §4 : la contrainte qui donne la plus grande
 *     stabilité l'emporte ;
 *   · PÔLES : la parcelle (❔ déclaré : au-delà de ~70° le critère de Stone perd sa signification, Stone 1978 §2).
 * Chaque profil s'arrête à la stratosphère (min T_strato). Une moyenne de TEMPÉRATURES (pas de densités : C15) ; la vapeur suit
 * ensuite la loi d'humidité sur cette température. Par pas de 100 m jusqu'à la tropopause de chaque zone, interpolé.
 * Sonde : doc/CONSTATS.md C22–C23 (la colonne de la parcelle de la surface moyenne était trop froide de 4–10 K en altitude).
 */
function temperatureEnvironnement(T_s, x_c0, P_s, T_strato, zMax) {
    const LOI = loiAdiabatique(), PHYS = window.PHYS, CONST = window.CONST;
    const dT = window.MERIDIEN.ecarts(), T2 = window.DATA['🧮']['🌡️🎱'];
    const Tc = PHYS.EAU.T_C, PAS = 100;
    const ascension = (T0) => {                                     // profil de parcelle par pas de 100 m : { z, T, p }
        const x0 = (T0 < Tc && T_s < Tc) ? Math.min(1, x_c0 * PHYS.pSatEau(T0) / PHYS.pSatEau(T_s)) : x_c0;
        const pts = [{ z: 0, T: T0, p: P_s }];
        let e = { T: T0, p: P_s, pc: x0 * P_s };
        for (let z = PAS; e.T > T_strato && z <= zMax; z += PAS) {
            e = LOI.ascension(e.T, e.p, e.pc / e.p, PAS);
            pts.push({ z: z, T: e.T, p: e.p });
        }
        return pts;
    };
    const aZ = (pts, z) => {                                        // T(z) d'un profil, la stratosphère au-dessus de son sommet
        const k = Math.floor(z / PAS);
        if (k + 1 >= pts.length) return T_strato;
        const u = z / PAS - k;
        return Math.max(T_strato, pts[k].T + u * (pts[k + 1].T - pts[k].T));
    };
    const zones = window.EARTH.ZONES.map((zn) => {
        const Ts = T_s - dT[zn.cle], pts = ascension(Ts);
        if (zn.cle !== 'mid') return { f: zn.f, T: (z) => aZ(pts, z) };
        // Stone : interface à σ = 0,6 ; H, c_p et T/θ à la température de la parcelle de la zone à cette pression.
        const pI = 0.6 * P_s;
        let iI = pts.findIndex((q) => q.p <= pI); if (iI < 0) iI = pts.length - 1;
        const TI = pts[iI].T, phi = Math.asin((zn.x0 + zn.x1) / 2);
        const H = CONST.R_GAS * TI / (LOI.M_a * LOI.g);
        const gSec = LOI.gammaSec(TI, 0), cp = LOI.g / gSec, kappa = CONST.R_GAS / (LOI.M_a * cp);
        const dTdPhi = 3 * T2 * Math.sin(phi) * Math.cos(phi);
        const dThetaDz = -dTdPhi * Math.tan(phi) / H;
        const gammaStone = gSec - Math.pow(pI / P_s, kappa) * dThetaDz;   // [K/m]
        return { f: zn.f, T: (z) => Math.max(aZ(pts, z), T_strato, Ts - gammaStone * z), gammaStone: gammaStone };
    });
    return (z) => zones.reduce((s, zn) => s + zn.f * zn.T(z), 0);
}

function profilAtmosphere(z_range) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const PHYS = window.PHYS;
    const LOI = loiAdiabatique();
    const w_c = DATA['💧']['🍰🫧💧'];
    const nA = LOI.nA, wA = LOI.wA;
    const T_s = DATA['🧮']['🧮🌡️'];
    const P_s = DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA;
    if (!(P_s > 0)) {   // sans atmosphère (⚫) : le vide, rien n'absorbe
        return { couches: z_range.map((z, i) => coucheWorker(T_s, 0, 0, 0, 0, 0, 0, 0, 0, (i + 1 < z_range.length) ? z_range[i + 1] - z : 1, 0)), iTrop: z_range.length,
            nuage: { W: 0, tauSW: 0, tauIR: 0, base: 0, sommet: 0, lwcPluie: 0,
                populations: [{ nom: 'aucun', poids: 1, tranches: { profondeur: [0], tauSW: [0], tauIR: [0], wMoyen: [0], wSature: [0], tauLiq: [0], tauRLiq: [0] }, tauSW: 0, W: 0, sommet: 0 }],
                wTotal: 0, wSousBase: 0, wSousMoyen: 0,
                fBas: 0, fMoyen: 0, fHaut: 0, tHaut: 0 } };
    }
    const M_a = LOI.M_a, M_c = LOI.M_c;
    const xa = [DATA['🫧']['🍰🫧🏭'] / CONST.M_CO2 / nA, DATA['🫧']['🍰🫧🐄'] / CONST.M_CH4 / nA];
    const x_N2O = DATA['🫧']['🍰🧪🍳'];                               // N₂O : rapport molaire d'air sec, déclaré par l'époque
    if (!(x_N2O >= 0)) throw new Error('[profilAtmosphere] 🍰🧪🍳 (N₂O) absent de l\'époque ' + DATA['📅']['📅'] + ' : ' + x_N2O);   // fractions molaires PARMI les non condensables (CO₂, CH₄)
    const g = LOI.g;
    const TS = DATA['🫧']['🌡️🫧🛩'];                          // [K] × N_STRATES : équilibre radiatif (equilibreStratosphere)
    const T_strato = Math.min(TS[0], T_s);                       // la tropopause : là où la parcelle atteint la 1ʳᵉ couche
    // Surface : pression partielle de vapeur depuis la fraction massique 🍰🫧💧 (humidité de surface du modèle).
    const x_c0 = (w_c / M_c) / (w_c / M_c + nA * (1 - w_c) / wA);
    let T = T_s, p_c = x_c0 * P_s, p_a = P_s - p_c;
    // T : la PARCELLE (saturation, condensat et sommet des nuages bas) ; Te : l'ENVIRONNEMENT de la colonne (couches du transfert,
    // hydrostatique, vapeur, tropopause, enclumes) — temperatureEnvironnement, la moyenne des zones.
    const TeDe = temperatureEnvironnement(T_s, x_c0, P_s, T_strato, z_range[z_range.length - 1]);
    let Te = T_s;
    // OZONE : toute la colonne de l'époque (SOLAIRE.colonneOzone, cm STP — la même que le transfert solaire) au-dessus de la
    // tropopause, avec la FORME verticale mesurée (OZONE_FORME) : x_O₃(p) = f·x_forme(p), f tel que la colonne au-dessus de la
    // tropopause soit N_O₃ — N(au-dessus de p_t) = f·I(p_t)·N_A/(M̄ g).
    const N_O3 = window.SOLAIRE.colonneOzone() * 1e-2 * CONV.STANDARD_ATMOSPHERE_PA / (CONST.BOLTZMANN_KB * CONST.KELVIN_TO_CELSIUS);   // [molécules/m²]
    const facteurOzone = () => {
        const p = p_a + p_c;
        return N_O3 / (OZONE_FORME.I(p) * (CONST.R_GAS / CONST.BOLTZMANN_KB) / ((p_a * M_a + p_c * M_c) / p * g));
    };
    let strato = Te <= T_strato, x_c_strato = p_c / (p_a + p_c);
    let pTrop = strato ? P_s : NaN;                                 // [Pa] pression de la tropopause (posée en y entrant)
    let f_O3 = strato ? facteurOzone() : 0;
    const couches = [];
    let iTrop = z_range.length;
    // ── VAPEUR MOYENNE ET NUAGE (physics.js EARTH.NUAGES) ───────────────────────────────────────────────────────────
    // La PARCELLE (p_c ci-dessus) fixe la température : elle monte de la surface, sèche puis saturée (adiabatique
    // humide). L'atmosphère MOYENNE n'est pas saturée : son humidité relative suit Manabe & Wetherald (1967) depuis
    // l'humidité de surface. Au-dessus du point critique (T ≥ T_c) l'eau ne condense pas : vapeur de la parcelle.
    const N = window.EARTH.NUAGES;
    const RH_s = x_c0 * P_s / PHYS.pSatEau(T_s);                       // 0 au-dessus de T_c (p_sat = +∞) : sans objet
    // TROPOPAUSE DU PROFIL, σ_t = p/p_s où la parcelle atteint T_strato : la parcelle monte d'abord seule (sa température ne
    // dépend pas de la vapeur moyenne), par pas de 100 m comme le profil, au plus jusqu'au sommet de la grille (au-delà, la
    // troposphère remplit la colonne). Sans troposphère (T_s ≤ T_strato), la loi d'humidité ne sert pas.
    // (hydrostatique de l'environnement, air sec, par pas de 100 m)
    let haut = { T: T_s, p: P_s }, bas = haut;
    for (let zt = 100; haut.T > T_strato && zt <= z_range[z_range.length - 1]; zt += 100) {
        bas = haut;
        const Tn = TeDe(zt);
        haut = { T: Tn, p: bas.p * Math.exp(-g * M_a / (CONST.R_GAS * 0.5 * (bas.T + Tn)) * 100) };
    }
    const sigmaTrop = (haut.T > T_strato ? haut.p : bas.p + (haut.p - bas.p) * (bas.T - T_strato) / (bas.T - haut.T)) / P_s;
    // La loi de Manabe & Wetherald a été mesurée sous une tropopause à σ_t,réf (EARTH.NUAGES.MW_SIGMA_TROPOPAUSE) ; elle se
    // déplace avec la troposphère, étirée entre la surface et σ_t : σ* = 1 − (1 − σ)·(1 − σ_t,réf)/(1 − σ_t). Humidité de
    // surface et de tropopause invariantes (Sherwood et al. 2010 ; Singh & O'Gorman 2012).
    const etirement = (1 - N.MW_SIGMA_TROPOPAUSE) / (1 - sigmaTrop);
    /** Vapeur MOYENNE au niveau courant (fraction molaire), à la température de l'environnement, bornée par la surface (l'air n'a
     *  pas plus d'eau que la surface qui l'alimente). */
    const vapeurMoyenne = () => {
        const p = p_a + p_c;
        if (Te >= PHYS.EAU.T_C || T_s >= PHYS.EAU.T_C) return p_c / p;
        // Humidité relative de radiosonde : par rapport à l'eau LIQUIDE, même sous 0 °C (PHYS.pSatLiquide). Appliquée
        // par rapport à la glace (avant le 2026-10-13), elle privait la haute troposphère de 30–40 % de sa vapeur.
        const sigmaEtire = 1 - (1 - p / P_s) * etirement;
        const r = RH_s * (sigmaEtire - N.MW_P_RESIDU) / (1 - N.MW_P_RESIDU);
        return Math.min(x_c0, r * PHYS.pSatLiquide(Te) / p);
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
    // Réf : aucune source mesurée (voir validation 2026-11-06) — doc/equation.html#eq-phase-liquide-glace
    /** Part liquide du condensat à la température Tc (Hu & Stamnes 1993 : linéaire de T_TOUT_GLACE à CONST.T0_WATER). */
    const fLiquide = (Tc) => Math.max(0, Math.min(1, (Tc - N.T_TOUT_GLACE) / (CONST.T0_WATER - N.T_TOUT_GLACE)));
    const nuagesBas = [
        { nom: 'océan', poids: oc, k: N.K_MARTIN_OCEAN, nActuel: DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3 * 1e6 },
        { nom: 'continent', poids: 1 - oc, k: N.K_MARTIN_CONTINENT, nActuel: N.CDNC_CONTINENT_CM3 * 1e6 }
    ].map((m) => ({
        nom: m.nom, poids: m.poids, k: m.k, n: m.nActuel * rCCN,                // [m⁻³] gouttes de l'époque (Twomey)
        lwcPluie: 4 / 3 * Math.PI * CONST.RHO_WATER * m.k * m.nActuel * Math.pow(DATA['🎚️'].CLOUD_SW.R_EFF_PLUIE, 3),   // [kg/m³]
        sommet: false, zSommet: 0, tauSW: 0, tauIR: 0, W: 0, tauIRCouche: z_range.map(() => 0),
        cwc: 0, ecart: 0,                                                       // condensat et écart au seuil du pas précédent (posés à la base)
        // Le nuage tranche par tranche, en CUMULS depuis la base : profondeur [m], τ_SW, τ_IR, eau précipitable effective moyenne et
        // saturée [g/cm²], τ_SW des gouttes et τ_SW × rayon effectif des gouttes [µm] (optique des gouttes, solaire.js). Un nuage
        // plus jeune (moins profond) est le même nuage tronqué : solaire.js en tire la population.
        tranches: { profondeur: [0], tauSW: [0], tauIR: [0], wMoyen: [0], wSature: [0], tauLiq: [0], tauRLiq: [0] }
    }));
    let dansNuage = false, zBase = 0, z = 0;
    let iEnclume = -1, tEnclume = 0;                     // couche où la parcelle passe T_ENCLUME (nuages hauts)
    let iMoyen = -1, wSousMoyen = 0;                     // couche où p/p_s passe SIGMA_MOYEN (nuages moyens), vapeur effective dessous
    // Eau précipitable EFFECTIVE pour la vapeur du rayonnement solaire, à l'échelle des coefficients k de Chou & Suarez 1999
    // (NASA TM-104606 vol. 15, éq. 3.3 et 3.5 ; leur table 2 est calculée raie par raie à p_r = 300 hPa et θ_r = 240 K) [g/cm²] :
    //     w = ∫ q (p/p_r)^0,8 [1 + 0,00135 (T − θ_r)] dp/g
    // Colonne entière, sous la base, et tranche par tranche dans le nuage (vapeur moyenne ET vapeur saturée — dans le nuage l'air
    // est saturé). radiative/solaire.js les lit.
    const CS99 = { P_REF: 30000, M: 0.8, THETA_REF: 240, A_T: 0.00135 };   // [Pa], [-], [K], [1/K]
    const echelleCS = (p, T) => Math.pow(p / CS99.P_REF, CS99.M) * (1 + CS99.A_T * (T - CS99.THETA_REF));
    let wTotal = 0, wSousBase = 0;
    /** Eau précipitable effective d'une tranche dz de fraction molaire de vapeur x [g/cm²]. */
    const wEff = (x, dz) => {
        const p = p_a + p_c;
        return x * p * M_c / (CONST.R_GAS * Te) * dz / 10 * echelleCS(p, Te);
    };
    // Réf : Stephens 1978, J. Atmos. Sci. 35:2123 — doc/equation.html#eq-epaisseurs-optiques-nuage ; Twomey 1977, J. Atmos. Sci. 34:1149 — doc/equation.html#eq-rayon-effectif-gouttes ; Rosenfeld & Gutman 1994, Atmos. Res. 34:259 ; Freud & Rosenfeld 2012, J. Geophys. Res. 117 ; Braga et al. 2021, Atmos. Chem. Phys. 21:14079 — doc/equation.html#eq-sommet-nuage-seuil-pluie
    /** Pas de longueur pas du nuage adiabatique c (océan ou continent) : ses épaisseurs optiques DANS le nuage, à la couche ic ; le
     *  pas où le condensat franchit le seuil de pluie est coupé au sommet. */
    const nuage = (c, pas, ic) => {
        const p = p_a + p_c;
        const rho = (p_a * M_a + p_c * M_c) / (CONST.R_GAS * T);
        const M = rho * CONST.R_GAS * T / p;
        const cwcFin = Math.max(0, x_c0 - p_c / p) * (M_c / M) * rho;            // [kg/m³] condensat adiabatique en fin de pas
        const f_liq = fLiquide(T);
        // Sommet : le condensat TOTAL atteint l'eau maximale avant précipitation. La glace ne retarde pas la précipitation,
        // elle l'accélère : dans un nuage mixte les cristaux grossissent aux dépens des gouttes et tombent (processus de
        // Wegener–Bergeron–Findeisen) — le seuil des gouttes liquides (14 µm) est donc une borne haute pour tout condensat.
        // v-2026-10-13 : seuil = f_liq · LWC_pluie. ⚠️ HYPOTHÈSE déclarée (limite du processus WBF) : la glace précipite dès
        // qu'elle se forme, seule la part liquide (Hu & Stamnes) peut s'accumuler jusqu'au seuil de pluie. Sans elle, un
        // nuage froid ne précipitait jamais : 1 à 8 kg/m² d'eau, τ jusqu'à 500 sous −10 °C (🪸), quand les observations
        // donnent l'eau nuageuse DÉCROISSANTE vers le froid (Somerville & Remer 1984). Aucun effet sur les nuages liquides.
        // Le sommet est là où l'écart au seuil, e = cwc − f_liq·LWC_pluie, s'annule : dans le pas où e change de signe, à la part
        // h = e_avant/(e_avant − e) du pas (interpolation linéaire) ; la dernière tranche a l'épaisseur h·pas et l'eau du seuil. Coupé
        // au pas entier, le sommet tombait par paliers de 10 m : ±4 % de profondeur et ±6 % de τ d'un nuage marin de 250 m, ±0,7 W/m²
        // au sommet de l'atmosphère, un équilibre qui saute d'un palier à l'autre.
        const ecart = cwcFin - f_liq * c.lwcPluie;
        const h = ecart >= 0 ? c.ecart / (c.ecart - ecart) : 1;
        const cwc = c.cwc + h * (cwcFin - c.cwc), lwc = f_liq * cwc, dz = h * pas;
        c.cwc = cwcFin; c.ecart = ecart;
        c.sommet = ecart >= 0;
        // Liquide : W/(ρ_w r_eff) = dz·(LWC/ρ_w)^⅔·(4π k N/3)^⅓, r_eff = (3 LWC/(4π ρ_w k N))^⅓ (Martin 1994). Glace : rayon déclaré.
        const rLiq = Math.cbrt(3 * lwc / (4 * Math.PI * CONST.RHO_WATER * c.k * c.n));   // [m]
        const sLiq = dz * Math.pow(lwc / CONST.RHO_WATER, 2 / 3) * Math.cbrt(4 * Math.PI * c.k * c.n / 3);
        const s = sLiq + (1 - f_liq) * cwc * dz / (CONST.RHO_GLACE * N.R_EFF_GLACE);
        c.tauIRCouche[ic] += 0.75 * s;                                           // absorption (Q_abs ≈ 1)
        c.tauIR += 0.75 * s;
        c.tauSW += 1.5 * s;                                                      // extinction (Q_ext ≈ 2)
        c.W += cwc * dz;
        c.zSommet = z - pas + dz;
        const tranches = c.tranches, k = tranches.profondeur.length - 1;
        tranches.profondeur.push(tranches.profondeur[k] + dz);
        tranches.tauSW.push(tranches.tauSW[k] + 1.5 * s);
        tranches.tauLiq.push(tranches.tauLiq[k] + 1.5 * sLiq);
        tranches.tauRLiq.push(tranches.tauRLiq[k] + 1.5 * sLiq * rLiq * 1e6);
        tranches.tauIR.push(tranches.tauIR[k] + 0.75 * s);
        tranches.wMoyen.push(tranches.wMoyen[k] + wEff(vapeurMoyenne(), dz));
        tranches.wSature.push(tranches.wSature[k] + wEff(p_c / p, dz));
    };
    const pousser = (i) => {
        const p = p_a + p_c;
        const n = p / (CONST.BOLTZMANN_KB * Te);
        const dz = (i + 1 < z_range.length) ? (z_range[i + 1] - z_range[i]) : (z_range[i] - z_range[i - 1]);
        const x_v = strato ? x_v_strato : vapeurMoyenne();
        const c = coucheWorker(Te, p, n, xa[0] * (1 - x_v) * n, x_v * n, xa[1] * (1 - x_v) * n, strato ? f_O3 * OZONE_FORME.x(p) * n : 0, x_N2O * (1 - x_v) * n, x_v, dz, 0);
        c.strate = strato ? strateDe(p, pTrop) : -1;            // couche de stratosphère (son équilibre radiatif) ; −1 : troposphère
        couches.push(c);
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
            const rho = (p_a * M_a + p_c * M_c) / (CONST.R_GAS * Te);   // hydrostatique : la masse de l'ENVIRONNEMENT
            if (strato) {                                   // température de sa couche, composition figée
                const pn = p * Math.exp(-g * rho / p * dz);
                p_c = x_c_strato * pn; p_a = pn - p_c;
                const k = strateDe(pn, pTrop);
                Te = T = k === 0 ? T_strato : TS[k];
                wTotal += wEff(x_v_strato, dz);
                continue;
            }
            let pas = dz;                                   // longueur réellement intégrée (raccourcie au niveau de condensation)
            if (p_c < PHYS.pSatEau(T) || T >= PHYS.EAU.T_C) {   // non saturé (ou supercritique) : adiabatique sèche
                const gammaSec = LOI.gammaSec(T, p_c * M_c / (rho * CONST.R_GAS * T));
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
                    for (const c of nuagesBas) c.ecart = -fLiquide(e.T) * c.lwcPluie;   // sans condensat, sous le seuil
                }
                T = e.T;
                p_c = Math.min(e.pc, PHYS.pSatEau(e.T)); p_a = e.pn - p_c;
            } else {                                        // saturé : adiabatique humide non diluée
                const gam = LOI.penteHumide(T, p_a, p_c);
                const dpa = -rho * g * dz / (1 + p_c / p_a * T * PHYS.dLnPSatEau(T) * gam);   // hydrostatique (ascension)
                T = T + gam * T * dpa / p_a;
                p_a = p_a + dpa;
                p_c = PHYS.pSatEau(T);
            }
            Te = TeDe(z);
            if (Te <= T_strato) {
                Te = T = T_strato; x_c_strato = p_c / (p_a + p_c); pTrop = p_a + p_c; f_O3 = facteurOzone();
                x_v_strato = vapeurMoyenne();               // piège froid : la vapeur MOYENNE de la tropopause, figée
                strato = true;
                continue;
            }
            if (iEnclume < 0 && Te <= N.T_ENCLUME) { iEnclume = i - 1; tEnclume = Te; }
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
    // Le niveau T_ENCLUME tombe entre deux couches de la grille (iEnclume, la plus chaude, et la suivante) : τ y est réparti
    // linéairement en température, pour que le nuage émette à T_ENCLUME et non à la température de la couche du dessous.
    // À la tropopause, il est dans la dernière couche de la troposphère. Une colonne partie sous T_ENCLUME (boule de neige)
    // n'a pas de niveau T_ENCLUME : le nuage reste dans sa première couche.
    const iHaut = iEnclume >= 0 ? iEnclume : iTrop - 1;
    const tHaut = iEnclume >= 0 ? tEnclume : T_strato;
    const hautPossible = (iEnclume >= 0 || strato) && iHaut >= 0 && tHaut < N.T_TOUT_GLACE;
    const epsHaut = window.SOLAIRE.moyenneHauts((tau) => 1 - Math.exp(-D * tau / 2));
    const franchit = iEnclume >= 0 && couches[iHaut].T > N.T_ENCLUME;
    const wHaut = franchit ? (couches[iHaut].T - N.T_ENCLUME) / (couches[iHaut].T - couches[iHaut + 1].T) : 0;
    if (hautPossible) {
        const tauHaut = -Math.log(1 - fHaut * epsHaut) / D;
        couches[iHaut].tauNuage += (1 - wHaut) * tauHaut;
        couches[iHaut + 1].tauNuage += wHaut * tauHaut;
    }
    // NUAGES MOYENS (physics.js EARTH.NUAGES) au niveau σ = SIGMA_MOYEN, s'il est sous la tropopause : populations des nuages
    // bas (même émissivité ε̄), recouvrement aléatoire (le worker multiplie les transmissions des couches). Réparti
    // linéairement en σ entre les deux couches qui encadrent le niveau, comme les nuages hauts en température.
    const fMoyen = avecEau && iMoyen >= 0 ? N.F_MOYEN : 0;
    if (fMoyen > 0) {
        const tauMoyen = -Math.log(1 - fMoyen * epsBas) / D;
        const sigmaCouche = (c) => c.n_air * CONST.BOLTZMANN_KB * c.T / P_s;
        const sDessous = sigmaCouche(couches[iMoyen]), sDessus = sigmaCouche(couches[iMoyen + 1]);
        const wMoyen = (sDessous - N.SIGMA_MOYEN) / (sDessous - sDessus);
        couches[iMoyen].tauNuage += (1 - wMoyen) * tauMoyen;
        couches[iMoyen + 1].tauNuage += wMoyen * tauMoyen;
    }
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
    loiAdiabatique: loiAdiabatique,      // loi du gradient vertical (profil, temperatureAtZ, vapeur, colonne d'une calotte)
    gradientSurface: gradientSurface,    // [K/m] gradient de la parcelle de surface de la colonne moyenne
    colonneNuageuse: colonneNuageuse,    // τ_SW du nuage pour l'albédo (calculations_albedo), même condensat que l'IR
    N_STRATES: N_STRATES                 // couches de la stratosphère (graine : calculateT0)
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
// retrait : '🏭' | '💧' | '🐄' | '⛅' — cet absorbeur ne compte plus dans le TRANSFERT, le profil (T, vapeur, nuages) restant
// celui de l'état courant (attribution par retrait, computeEdsRemovalShares) ; absent : tous les absorbeurs comptent.
// sonde : true pour un transfert hors du calcul de l'époque (CONVERGE.olrNetA, océan de magma) — la stratosphère y garde sa
// température : l'équilibre n'a de sens que pour l'état que le solveur cherche.
const RETRAIT_COUCHE = {
    '🏭': (c) => { c.n_CO2 = 0; },                      // raies et CIA CO₂–CO₂
    '💧': (c) => { c.n_H2O = 0; c.contSelf = 0; c.contForeign = 0; },   // raies et continuum MT_CKD
    '🐄': (c) => { c.n_CH4 = 0; },
    '⛅': (c) => { c.tauNuage = 0; }                    // nuages bas, moyens et hauts
};
// Réf : Schmidt et al. 2010, J. Geophys. Res. 115:D20106 ; Lacis et al. 2010, Science 330:356 — doc/equation.html#eq-olr-effet-serre-repartition
/**
 * [K] STRATOSPHÈRE EN ÉQUILIBRE RADIATIF. Isotherme, d'émissivité ε_λ = 1 − t_λ (t_λ : sa transmission diffuse, produit des
 * couches au-dessus de la tropopause, calculée par le transfert), elle absorbe ε_λ F↑_λ du flux montant qui sort de la
 * troposphère, plus le solaire de l'ozone S̄·🍰☀️🫧🛩, et émet ε_λ πB_λ(T) vers le haut ET vers le bas :
 *     Σ_λ ε_λ [F↑_λ(tropopause) − 2 πB_λ(T)] + S̄·🍰☀️🫧🛩 = 0.
 * C'est l'équilibre que Fels et al. 1980 et Manabe & Wetherald 1967 donnent à la stratosphère : quand le CO₂ croît, ε croît là
 * où la stratosphère émet plus qu'elle ne reçoit (15 µm), elle se refroidit, et le forçage au sommet devient le forçage AJUSTÉ.
 * ε dépend de T par σ(T) : il est pris à la T du transfert, la racine suit l'itération du solveur (aucun transfert de plus).
 * Racine par dichotomie entre 1 K et 3000 K (bord des tables σ) : le bilan décroît avec T.
 * Sans stratosphère (pas de couche au-dessus de la tropopause, ou rien n'y absorbe) : la température reste celle d'avant.
 * Réf : Fels, Mahlman, Schwarzkopf & Sinclair 1980, J. Atmos. Sci. 37:2265 ; Manabe & Wetherald 1967, J. Atmos. Sci. 24:241 ;
 *       Lacis & Hansen 1974, J. Atmos. Sci. 31:118 (ozone) — doc/equation.html#eq-stratosphere-temperature-peau
 */
function equilibreStratosphere(resultBuf, tStrates, i_trop, earth_flux, lambda_range, lambda_weights, effective_delta_lambda, couches) {
    const DATA = window.DATA, CONST = window.CONST;
    const nL = lambda_range.length, K = N_STRATES;
    const Qtot = DATA['☀️']['🧲☀️🎱'] * DATA['🫧']['🍰☀️🫧🛩'];   // posée par calculateAlbedo, avant chaque transfert
    if (!(Qtot >= 0)) throw new Error('[equilibreStratosphere] chauffage solaire de l\'ozone non posé : ' + Qtot);
    // Chauffage de chaque couche : la part du solaire de l'ozone qu'elle absorbe, a_oz(M·u) de Lacis & Hansen 1974 entre la colonne
    // au-dessus de son bas et celle au-dessus de son haut ; M = 2 (angle solaire moyen de 60°, ❔ déclaré).
    const u = new Float64Array(K);
    const cmSTP = 1e-2 * CONV.STANDARD_ATMOSPHERE_PA / (CONST.BOLTZMANN_KB * CONST.KELVIN_TO_CELSIUS);   // [molécules/m²] par cm STP
    for (const c of couches) if (c.strate >= 0) u[c.strate] += c.n_O3 * c.delta_z_real / cmSTP;
    const dessus = new Float64Array(K + 1);                        // colonne au-dessus du haut de la couche k
    for (let k = K - 1; k >= 0; k--) dessus[k] = dessus[k + 1] + u[k];
    const aOz = window.SOLAIRE.aOz, M = 2, aTot = aOz(M * dessus[0]);
    const Q = new Float64Array(K);
    for (let k = 0; k < K; k++) Q[k] = aTot > 0 ? Qtot * (aOz(M * dessus[k]) - aOz(M * dessus[k + 1])) / aTot : 0;
    const Ftrop = new Float64Array(nL), poids = new Float64Array(nL);
    for (let j = 0; j < nL; j++) {
        Ftrop[j] = i_trop > 0 ? resultBuf[(i_trop - 1) * nL + j] : earth_flux[j];
        poids[j] = Math.PI * effective_delta_lambda * lambda_weights[j];
    }
    const T = DATA['🫧']['🌡️🫧🛩'].slice();
    const E = (k) => { const e = new Float64Array(nL); for (let j = 0; j < nL; j++) e[j] = poids[j] * window.PHYS.planckFunction(lambda_range[j], T[k]); return e; };
    // Gauss-Seidel : flux montant au bas de chaque couche, descendant au haut, à partir des températures courantes ; chaque couche
    // résout Σ_λ ε_k,λ [F↑ + F↓ − 2πB_λ(T_k)] + Q_k = 0 (ε = 1 − t, sa transmission diffuse, calculée par le transfert).
    for (let balayage = 0; balayage < 4; balayage++) {
        const Es = []; for (let k = 0; k < K; k++) Es.push(E(k));
        const haut = []; let d = new Float64Array(nL);              // F↓ au haut de la couche k (rien ne vient de l'espace)
        for (let k = K - 1; k >= 0; k--) {
            haut[k] = d;
            const t = tStrates.subarray(k * nL, (k + 1) * nL), dn = new Float64Array(nL);
            for (let j = 0; j < nL; j++) dn[j] = d[j] * t[j] + (1 - t[j]) * Es[k][j];
            d = dn;
        }
        let up = Ftrop;                                             // F↑ au bas de la couche k
        for (let k = 0; k < K; k++) {
            const t = tStrates.subarray(k * nL, (k + 1) * nL), D = haut[k], U = up;
            let epsTotal = 0; for (let j = 0; j < nL; j++) epsTotal += 1 - t[j];
            if (epsTotal > 0) {                                     // une couche vide (rien au-dessus de la grille) garde sa T
                const bilan = (Tk) => {
                    let b = Q[k];
                    for (let j = 0; j < nL; j++) { const e = 1 - t[j]; if (e > 0) b += e * (U[j] + D[j] - 2 * poids[j] * window.PHYS.planckFunction(lambda_range[j], Tk)); }
                    return b;
                };
                let bas = 1, hautT = 3000;
                if (bilan(hautT) > 0) throw new Error('[equilibreStratosphere] la couche ' + k + ' chauffe encore à 3000 K (Q = ' + Q[k] + ' W/m²)');
                for (let n = 0; n < 30; n++) { const m = 0.5 * (bas + hautT); if (bilan(m) > 0) bas = m; else hautT = m; }
                T[k] = 0.5 * (bas + hautT);
            }
            const Ek = E(k), nu = new Float64Array(nL);
            for (let j = 0; j < nL; j++) nu[j] = U[j] * t[j] + (1 - t[j]) * Ek[j];
            up = nu;
        }
    }
    return T;
}

async function calculateFluxForT0(retrait, sonde) {
    const DATA = window.DATA;
    const EPOCH = DATA['📅'];
    // 🔒 Partition eau déjà mise à jour par le caller (calculateH2OParameters avant chaque calculateFluxForT0 dans la boucle radiatif)
    DATA['📊'] = {};
    
    // Credence ~70%. Plage lit. 20–100 m (LBL 20–50 m, GCM ~100 m). 30 m (après fix delta_z_real → épaisseur réelle par couche).
    const delta_z = 30;
    const lambda_min = 0.1e-6;
    // Jusqu'à 1000 µm (10 cm⁻¹) : la bande de rotation de H₂O, opaque, émet depuis la haute troposphère ; s'arrêter à 100 µm
    // retirait ~1,6 W/m² d'OLR (π∫B au-delà de 100 µm : 2,06 W/m² à 288 K) et autant au flux de surface. Au-delà de 1000 µm :
    // < 0,02 W/m².
    const lambda_max = 1000e-6;
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
                [25.0e-6, 100.0e-6, 0.22],
                [100.0e-6, 1000.0e-6, 0.03]
            ];
            // Répartition homogène par défaut (poids = largeur en λ) → même Δλ/bin, bandes visuellement uniformes. Désactiver avec CONFIG spectralGridHomogeneous = false pour forcer plus de bins en IR thermique.
            // L'infrarouge lointain (100–1000 µm, 2 W/m² sur ~390) garde son poids : à la largeur en λ il prendrait 90 % des bins.
            if (window.CONFIG_COMPUTE.spectralGridHomogeneous) {
                let largeur = 0;
                for (let i = 0; i < regions.length - 1; i++) {
                    regions[i][2] = regions[i][1] - regions[i][0];
                    largeur += regions[i][2];
                }
                regions[regions.length - 1][2] = 0.03 * largeur;   // ~3 % des bins
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

    // Nuages IR : opacité par couche calculée dans profilAtmosphere (condensat adiabatique de la parcelle jusqu'au seuil de
    // pluie, gouttes de Martin et al. 1994, τ = 3/2·LWC·Δz/(ρ_w r_eff) de Stephens 1978 ; fractions bas / moyens / hauts).
    // Remplace τ = ☁️ × CLOUD_LW_TAU_REF (2,6, sans source) réparti uniformément jusqu'à la tropopause.

    // Sections efficaces : tables σ(λ) sur la grille de températures (interpolées à la T de chaque couche).
    const tab = tablesSigma(lambda_range);
    const continuum = tablesContinuum(lambda_range);                 // continuum H₂O MT_CKD 4.3, tables [iT][j]

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
        if (retrait) for (const c of layers_w) RETRAIT_COUCHE[retrait](c);
        const i_trop = profil.iTrop;
        const { resultBuf, sums, spectra } = await window.spectralWorkerPool.dispatch({
            lambda_range, lambda_weights,
            sigma_CO2: tab.CO2, sigma_H2O: tab.H2O, sigma_CH4: tab.CH4, sigma_O3: tab.O3, sigma_N2O: tab.N2O, nP: tab.nP, cia_CO2: tablesCIA(lambda_range), cont_self: continuum.self, cont_foreign: continuum.foreign,
            earth_flux, layers: layers_w, i_trop, nStrates: N_STRATES,
            effective_delta_lambda,
            diffusivite: window.EARTH.DIFFUSIVITE,
            T_surf: DATA['🧮']['🧮🌡️'],
            constants: { PLANCK_H: CONST.PLANCK_H, SPEED_OF_LIGHT: CONST.SPEED_OF_LIGHT, BOLTZMANN_KB: CONST.BOLTZMANN_KB, MAX_PLANCK_SAFE: CONST.MAX_PLANCK_SAFE }
        }, nZ, nL);
        sum_blocked_CO2 = sums.CO2; sum_blocked_H2O = sums.H2O;
        sum_blocked_CH4 = sums.CH4; sum_blocked_clouds = sums.clouds;
        edsSpectra = spectra;
        sum_blocked_cont = sums.continuum;   // continuum H₂O (déjà compté dans sums.H2O)
        // Stratosphère : son équilibre radiatif sous ce transfert, pour le profil de l'évaluation suivante (ni sous un retrait :
        // l'attribution garde le profil de l'état courant, ni pour une sonde hors du calcul de l'époque).
        if (!retrait && !sonde) DATA['🫧']['🌡️🫧🛩'] = equilibreStratosphere(resultBuf, spectra.tStrates, i_trop, earth_flux, lambda_range, lambda_weights, effective_delta_lambda, layers_w);
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
            epochId: DATA['📅']['📅']
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
    const T_K = DATA['🧮']['🧮🌡️'];
    const olrRef = DATA['📊'].total_flux;
    const eff = {};
    try {
        // Retrait dans le TRANSFERT seulement (calculateFluxForT0(retrait), RETRAIT_COUCHE) : T, profil, vapeur et nuages
        // restent ceux de l'état convergé, comme chez Schmidt. Poser la vapeur à 0 dans DATA retirerait aussi les nuages
        // (sans eau, pas de condensat) et remplacerait l'adiabatique humide par la sèche ; poser ☁️ à 0 ne retirerait rien
        // (l'IR lit les fractions F_BAS, F_MOYEN, F_HAUT).
        for (const k of ['⛅', '🏭', '💧', '🐄']) {
            await calculateFluxForT0(k);
            eff[k] = DATA['📊'].total_flux - olrRef;
        }
    } finally {
        // ⚠️ Les quatre passes ont laissé DATA['📊'] (total_flux, upward_flux, lambda_range…) et
        // window.EDS_SPECTRAL dans l'état de la DERNIÈRE, c'est-à-dire « sans CH₄ ». Le spectre
        // affiché et getSpectralResultFromDATA() liraient ça. D'où une cinquième passe, sans
        // retrait, dont le seul rôle est de rendre l'état de référence. C'est le prix de la méthode.
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
                  epochId: DATA['📅']['📅'] };
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
    const EPOCH = DATA['📅'];
    
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
