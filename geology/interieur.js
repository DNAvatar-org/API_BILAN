// File: API_BILAN/geology/interieur.js
// Desc: HISTOIRE THERMIQUE DE L'INTÉRIEUR (manteau + noyau, un seul réservoir) — source UNIQUE de DATA['🌕'].
//       Aucune rampe, aucune valeur de flux posée par époque : un bilan d'énergie, intégré dans le temps.
//
//           C(T) · dT/dt = H(t) − Q(T)
//
//         · T    : température potentielle de l'intérieur (DATA['🌕']['🌡️🌕']), portée d'un clic à l'autre
//         · H(t) : chaleur radiogénique de la Terre silicatée (²³⁸U ²³⁵U ²³²Th ⁴⁰K), décroissance exacte
//         · Q(T) : ce que l'intérieur perd par la surface —
//             – OCÉAN DE MAGMA (surface = magma) : Q = 4πR² · (OLR(T) − solaire absorbé), l'OLR étant celui
//               du transfert radiatif du modèle à T. C'est l'énergie émise vers l'espace qui vide l'intérieur ;
//             – INTÉRIEUR SOLIDE (après la transition rhéologique, définitive) : convection sous couche
//               limite, Q = Q₀ · (ΔT/ΔT₀)^(1+β) · (η(T₀)/η(T))^β, η ∝ exp(E/RT)
//         · C(T) : M_manteau·c_m + M_noyau·c_c, plus la chaleur latente du manteau entre solidus et liquidus
//
//       La forme « chute très forte au début, puis ralentissement » n'est écrite nulle part : elle sort de
//       l'équation (Q varie comme T⁴ sous le magma, puis comme exp(−E/RT) sous le solide).
//       Tant que l'intérieur est fondu, le flux est calculé par le transfert radiatif lui-même : avancer() le
//       mesure à T (olrNet), puis l'init de la convergence le recale sur son propre radiatif (calculations_flux.js).
//
//       Approximations DÉCLARÉES : manteau et noyau refroidissent ensemble (un seul T) ; la croûte continentale
//       est dans le même réservoir ; ΔT de la loi de convection pris sur la surface de référence T_s0 (les
//       écarts de climat, ±50 K, sont petits devant ΔT ≈ 1300 K) ; solidus/liquidus à 0 GPa.
// Version 1.0.0
// Date: 2026-09-24
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';

    const LN2 = Math.LN2;
    const K = {
        AN_PRESENT: 2025,              // [an] origine des âges : années avant 2025 (onglet Histoire, banc)
        SEC_PAR_AN: 3.15576e7,         // [s] année julienne
        R_GAZ: 8.314462618,            // [J/mol/K] CODATA 2018
        // Masses : Terre 5,9722e24 kg (IAU 2015, GM⊕/G) ; noyau 1,932e24 kg (Yoder 1995, AGU Global Earth
        // Physics, table 2). Terre silicatée (manteau + croûte) = différence : équation, pas un second chiffre.
        M_TERRE: 5.9722e24,            // [kg]
        M_NOYAU: 1.932e24,             // [kg]
        // ⚠️ FOURCHETTE, pas une mesure unique : capacités thermiques usuelles des modèles d'histoire thermique
        //    (manteau 1000–1300, noyau 700–850 J/kg/K ; Stevenson, Spohn & Schubert 1983, Icarus 54:466).
        C_MANTEAU: 1250,               // [J/kg/K]
        C_NOYAU: 840,                  // [J/kg/K]
        // Fusion de la péridotite à 0 GPa : Katz, Spiegelman & Langmuir 2003 (G³ 4:1073), éq. 4 et 10 à P = 0.
        T_SOLIDUS: 1085.7 + 273.15,    // [K]
        T_LIQUIDUS: 1780 + 273.15,     // [K]
        // Transition rhéologique : le magma se comporte en solide sous ~40 % de liquide (Abe 1997, PEPI 100:27 ;
        // Lebrun et al. 2013, JGR Planets 118:1155). Fraction de liquide linéaire entre solidus et liquidus.
        PHI_RHEO: 0.4,                 // [-]
        // ⚠️ FOURCHETTE : chaleur latente de cristallisation du manteau 4e5–7e5 J/kg (Solomatov 2000,
        //    Origin of the Earth and Moon, p. 323) → milieu.
        L_FUSION: 5.5e5,               // [J/kg]
        // Radiogénique — concentrations de la Terre silicatée : McDonough & Sun 1995 (Chem. Geol. 120:223).
        U_BSE: 20.3e-9,                // [kg/kg]
        TH_BSE: 79.5e-9,               // [kg/kg]
        K_BSE: 240e-6,                 // [kg/kg]
        // Chaleur par kg d'isotope, abondance massique, demi-vie : Turcotte & Schubert 2014 (Geodynamics 3e, table 4.2).
        ISOTOPES: [
            { nom: '²³⁸U',  h: 9.46e-5, part: 0.9927,  element: 'U',  demiVie: 4.47e9 },    // [W/kg] [-] [an]
            { nom: '²³⁵U',  h: 5.69e-4, part: 0.0072,  element: 'U',  demiVie: 7.04e8 },
            { nom: '²³²Th', h: 2.64e-5, part: 1.0,     element: 'Th', demiVie: 1.40e10 },
            { nom: '⁴⁰K',   h: 2.92e-5, part: 1.28e-4, element: 'K',  demiVie: 1.25e9 }
        ],
        // Convection sous couche limite : Nu ∝ Ra^β, β = 1/3 (théorie de la couche limite ; Turcotte & Schubert
        // 2014 §6.21). Viscosité d'Arrhenius, E = 300 kJ/mol (fluage diffusion de l'olivine sèche, Karato & Wu
        // 1993, Science 260:771). Point de référence = l'état MESURÉ aujourd'hui : Q₀ = 46 TW (Jaupart et al.
        // 2015, Treatise on Geophysics 7.06 : 46 ± 3 TW) à T₀ = 1350 °C (température potentielle des MORB,
        // Herzberg et al. 2007, G³ 8:Q02006 : 1280–1400 °C) sous T_s0 = 14,4 °C (GISTEMP, an 2000).
        BETA: 1 / 3,                   // [-]
        E_ACTIVATION: 300e3,           // [J/mol]
        Q0: 46e12,                     // [W]
        T0: 1350 + 273.15,             // [K]
        T_S0: 14.4 + 273.15            // [K]
    };
    K.M_BSE = K.M_TERRE - K.M_NOYAU;                                  // [kg] Terre silicatée
    K.C_SENSIBLE = K.M_BSE * K.C_MANTEAU + K.M_NOYAU * K.C_NOYAU;     // [J/K]
    K.T_RHEO = K.T_SOLIDUS + K.PHI_RHEO * (K.T_LIQUIDUS - K.T_SOLIDUS); // [K]
    const MASSE_ELEMENT = { U: K.U_BSE * K.M_BSE, Th: K.TH_BSE * K.M_BSE, K: K.K_BSE * K.M_BSE };   // [kg]

    /** [W] Chaleur radiogénique à tAgo années avant 2025 (plus d'isotopes dans le passé : exp(+λ t)). */
    function puissanceRadiogenique(tAgo) {
        let H = 0;
        for (const iso of K.ISOTOPES) {
            H += MASSE_ELEMENT[iso.element] * iso.part * iso.h * Math.exp(LN2 / iso.demiVie * tAgo);
        }
        return H;
    }

    /** [W] Chaleur perdue par convection sous couche limite (intérieur solide). */
    function puissanceConvective(T) {
        const dT = T - K.T_S0, dT0 = K.T0 - K.T_S0;
        if (!(dT > 0)) throw new Error('[INTERIEUR] T intérieur ' + T + ' K ≤ surface de référence');
        return K.Q0 * Math.pow(dT / dT0, 1 + K.BETA) * Math.exp(K.BETA * K.E_ACTIVATION / K.R_GAZ * (1 / K.T0 - 1 / T));
    }

    /** [J/K] Capacité thermique effective : sensible + latente dans l'intervalle de fusion. */
    function capacite(T) {
        const latent = (T > K.T_SOLIDUS && T < K.T_LIQUIDUS) ? K.M_BSE * K.L_FUSION / (K.T_LIQUIDUS - K.T_SOLIDUS) : 0;
        return K.C_SENSIBLE + latent;
    }

    /** Intérieur solide : intègre dT/dt = (H − Q)/C de tAgo0 à tAgo1 (< tAgo0), RK4, pas ≤ 1 Ma et |ΔT| ≲ 1 K. */
    function integrerSolide(T, tAgo0, tAgo1) {
        const f = (T_, tAgo) => (puissanceRadiogenique(tAgo) - puissanceConvective(T_)) / capacite(T_) * K.SEC_PAR_AN;   // [K/an]
        let t = tAgo0;
        while (t > tAgo1) {
            const pente = Math.abs(f(T, t));
            const h = Math.min(t - tAgo1, 1e6, pente > 0 ? 1 / pente : 1e6);   // [an]
            const k1 = f(T, t), k2 = f(T + h / 2 * k1, t - h / 2), k3 = f(T + h / 2 * k2, t - h / 2), k4 = f(T + h * k3, t - h);
            T += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
            t -= h;
        }
        return T;
    }

    /**
     * Océan de magma : dt = C(T) dT / (4πR²·(OLR(T) − S) − H). olrNet(T) [W/m²] = OLR − solaire absorbé, calculé
     * par le transfert radiatif du modèle (async). Échantillonné sur N températures entre T et T_RHEO,
     * interpolé en log (l'OLR varie de plusieurs ordres de grandeur), intégré finement.
     * Renvoie { T, dureeAn, solide } : T atteinte, durée écoulée, et si la transition rhéologique est franchie.
     */
    async function refroidirMagma(T, tAgo, dureeMaxAn, aireM2, olrNet) {
        const N = 8, ech = [];
        for (let i = 0; i <= N; i++) {
            const Ti = T + (K.T_RHEO - T) * i / N;
            const net = await olrNet(Ti);
            if (!(net > 0)) throw new Error('[INTERIEUR] OLR − solaire absorbé = ' + net + ' W/m² à ' + Ti.toFixed(0) + ' K : un océan de magma qui ne perd pas d\'énergie');
            ech.push({ T: Ti, ln: Math.log(net) });
        }
        const netA = (Tx) => {
            for (let i = 1; i < ech.length; i++) {
                if (Tx >= ech[i].T) {
                    const a = ech[i - 1], b = ech[i], u = (Tx - a.T) / (b.T - a.T);
                    return Math.exp(a.ln + u * (b.ln - a.ln));
                }
            }
            return Math.exp(ech[ech.length - 1].ln);
        };
        const PAS = 2000, dT = (T - K.T_RHEO) / PAS;
        let t = 0;
        for (let i = 0; i < PAS; i++) {
            const Tm = T - (i + 0.5) * dT;
            const perte = aireM2 * netA(Tm) - puissanceRadiogenique(tAgo - t);   // [W]
            const dt = capacite(Tm) * dT / perte / K.SEC_PAR_AN;                  // [an]
            if (t + dt > dureeMaxAn) return { T: T - i * dT - dT * (dureeMaxAn - t) / dt, dureeAn: dureeMaxAn, solide: false };
            t += dt;
        }
        return { T: K.T_RHEO, dureeAn: t, solide: true };
    }

    /** Âge (années avant 2025) de la date courante 📜📅, selon le sens de l'époque (géologique ou calendaire). */
    function ageCourant(DATA) {
        const EPOCH = window.TIMELINE[DATA['📜']['👉']];
        const date = DATA['📜']['📅'];
        if (!Number.isFinite(date)) throw new Error('[INTERIEUR] 📜📅 non fini — getEpochDateConfig non appelé ?');
        return EPOCH['▶'] > EPOCH['◀'] ? date : K.AN_PRESENT - date;
    }

    /** L'époque qui porte la condition initiale '🌡️🌕' : l'intérieur commence à son ▶. Exactement une. */
    function epoqueInitiale() {
        const E = window.TIMELINE.filter(e => e && Number.isFinite(e['🌡️🌕']));
        if (E.length !== 1) throw new Error('[INTERIEUR] il faut exactement UNE époque avec 🌡️🌕 (condition initiale), trouvé ' + E.length);
        return E[0];
    }

    /** Remplit DATA['🌕'] depuis l'état : flux [W/m²] et puissance [W]. Fondu : c'est le radiatif qui les a posés
     *  (avancer, puis l'init de la convergence) — on n'y touche pas. */
    function publier(DATA) {
        const N = DATA['🌕'];
        const aire = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
        if (!(N['🌡️🌕'] > 0)) { N['🔋🌕'] = 0; N['🧲🌕'] = 0; return; }       // avant l'intérieur (⚫) : rien
        if (estFondu(DATA)) return;
        N['🔋🌕'] = puissanceConvective(N['🌡️🌕']);
        N['🧲🌕'] = N['🔋🌕'] / aire;
    }

    /** Fondu tant que la transition rhéologique n'a pas été franchie (📅🧊🌕 = date de solidification, 0 = pas encore). */
    function estFondu(DATA) {
        return DATA['🌕']['🌡️🌕'] > 0 && !(DATA['🌕']['📅🧊🌕'] > 0);
    }

    /**
     * Amène l'état de l'intérieur à la date courante. Vers le futur : on intègre depuis l'état. Vers le passé
     * (clic sur une époque plus ancienne) ou sans état : on repart de la condition initiale. Idempotent.
     * olrNet(T) : voir refroidirMagma — appelé seulement si l'intérieur est fondu.
     */
    async function avancer(DATA, olrNet) {
        const N = DATA['🌕'];
        const tAgo = ageCourant(DATA);
        const E0 = epoqueInitiale(), t0 = E0['▶'];
        if (tAgo > t0) { N['🌡️🌕'] = 0; N['📅🌕'] = tAgo; N['📅🧊🌕'] = 0; publier(DATA); return; }
        if (!(N['🌡️🌕'] > 0) || N['📅🌕'] < tAgo) { N['🌡️🌕'] = E0['🌡️🌕']; N['📅🌕'] = t0; N['📅🧊🌕'] = 0; }
        let dureeAn = N['📅🌕'] - tAgo;
        if (dureeAn > 0 && estFondu(DATA)) {
            const aire = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
            const r = await refroidirMagma(N['🌡️🌕'], N['📅🌕'], dureeAn, aire, olrNet);
            N['🌡️🌕'] = r.T;
            N['📅🌕'] -= r.dureeAn;
            dureeAn -= r.dureeAn;
            if (r.solide) N['📅🧊🌕'] = N['📅🌕'];
        }
        if (dureeAn > 0 && !estFondu(DATA)) {
            N['🌡️🌕'] = integrerSolide(N['🌡️🌕'], N['📅🌕'], tAgo);
            N['📅🌕'] = tAgo;
        }
        if (estFondu(DATA)) {   // surface = magma : l'intérieur perd ce qui part vers l'espace moins le solaire absorbé
            N['🧲🌕'] = await olrNet(N['🌡️🌕']);
            N['🔋🌕'] = N['🧲🌕'] * 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
            return;
        }
        publier(DATA);
    }

    window.INTERIEUR = { CONST: K, puissanceRadiogenique, puissanceConvective, capacite, integrerSolide, refroidirMagma, avancer, publier, estFondu, ageCourant };
})();
