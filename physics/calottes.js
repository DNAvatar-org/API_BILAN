// File: API_BILAN/physics/calottes.js - Calottes de glace continentales (profil plastique + bilan de masse)
// Desc: Je calcule les calottes PERMANENTES posées sur les continents (Antarctique, Groenland, Laurentide, Gondwana…), bande par
//       bande de latitude et par hémisphère, avec des équations publiées — pas de surface posée par époque :
//         · profil d'une calotte parfaitement plastique (Nye 1952 ; Weertman) : h(r) = h₀ √(1 − r/L), h₀ = √(2 τ₀ L / (ρ_i g)),
//           épaisseur moyenne d'une calotte axisymétrique H̄ = (8/15) h₀ ; τ₀ = 100 kPa, milieu de la fourchette mesurée 50–150 kPa ;
//         · isostasie : le socle s'enfonce de (ρ_i / ρ_m) H̄ ; altitude moyenne de la surface z = socle + H̄ (1 − ρ_i/ρ_m) ;
//         · température de surface : celle de la zone (bilan méridien) − Γ z, cycle saisonnier de la zone ;
//         · accumulation : la précipitation du modèle (eau précipitable / temps de résidence, P = W/τ) à la saturation de la surface
//           de la calotte, p_sat(T_s)/p_sat(T̄), seulement les jours de gel (la pluie ne s'accumule pas) ;
//         · fonte : degrés-jours positifs, neige puis glace (Reeh 1991, Polarforschung 59:113), facteurs mesurés de Braithwaite 1995
//           (J. Glaciol. 41:153) : neige ~3, glace ~8 mm d'eau par °C·jour ; neige formée à l'inversion (Jouzel & Merlivat 1984) ;
//         · NAISSANCE sur les hautes terres (quart le plus haut du continent de la bande), puis ÉQUILIBRE : l'aire où le bilan de
//           masse s'annule, plafonnée par le continent de la bande (data/paleogeo_zones.js, PaleoDEM Scotese & Wright 2018) ;
//         · ÉTAT PORTÉ (DATA['🗻']['🍰🗻🧊'], daté 📅🗻🧊) : au clic sur la frise, l'état vient de la CONFIG de l'époque
//           (EPOCH['🗻']['🍰🗻🧊'], aires sourcées) ; au clic time, il part de l'état du clic précédent et relaxe vers l'équilibre
//           sur le temps écoulé, au temps de renouvellement physique ρ_i H̄ / accumulation — comme l'intérieur (INTERIEUR.avancer).
//       Contrôle (pas une entrée) : accumulation moyenne de l'Antarctique posé, 143 ± 4 kg m⁻² an⁻¹ (Arthern et al. 2006, JGR 111:D06107).
//       Approximations DÉCLARÉES : une calotte par bande et par hémisphère, bilan évalué à l'altitude moyenne ; même température de
//       zone dans les deux hémisphères (bilan méridien symétrique) ; avant 540 Ma, pas de carte : continent réparti uniformément.
// Version 1.2.0
// - v1.2.0 (2026-10-14): état porté d'un clic à l'autre, posé depuis la config au clic frise (plus de graine sans glace).
// Date: [October 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        TAU0_PA: 100e3,          // [Pa] seuil de cisaillement basal, 50–150 kPa mesurés (Nye 1952 ; Weertman)
        RHO_MANTEAU: 3300,       // [kg/m³] manteau supérieur (Turcotte & Schubert 2014) — isostasie
        DDF_NEIGE: 3,            // [kg m⁻² °C⁻¹ j⁻¹] = mm d'eau par °C·jour (Braithwaite 1995)
        DDF_GLACE: 8,            // [kg m⁻² °C⁻¹ j⁻¹] (Braithwaite 1995)
        AGE_MAX_CARTES_MA: 540   // [Ma] au-delà : pas de PaleoDEM
    };
    // Bandes : zone du bilan méridien, hémisphère, sinus des bornes (aire = 2πR² Δsin φ par hémisphère).
    const BANDES = [
        { cle: 'S_pol', zone: 'pol', x0: Math.sin(Math.PI / 3), x1: 1 },
        { cle: 'N_pol', zone: 'pol', x0: Math.sin(Math.PI / 3), x1: 1 },
        { cle: 'S_mid', zone: 'mid', x0: 0.5, x1: Math.sin(Math.PI / 3) },
        { cle: 'N_mid', zone: 'mid', x0: 0.5, x1: Math.sin(Math.PI / 3) },
        { cle: 'S_trop', zone: 'trop', x0: 0, x1: 0.5 },
        { cle: 'N_trop', zone: 'trop', x0: 0, x1: 0.5 }
    ];

    /** Paléogéographie de la date [Ma avant présent] : { cle: { continent, socle_m } }, interpolée entre cartes de 5 Ma.
     *  Avant 540 Ma (pas de carte) : le continent de l'époque (1 − 🍰🗻🌊) réparti uniformément, socle au niveau de la mer (⚠️). */
    function geographie(ageMa, EPOCH) {
        const G = window.PALEOGEO, out = {};
        if (ageMa > K.AGE_MAX_CARTES_MA) {
            const c = 1 - EPOCH['🗻']['🍰🗻🌊'];
            for (const b of BANDES) out[b.cle] = { continent: c, socle_m: 0, haut_m: 0 };
            return out;
        }
        const A = G.ages_Ma;
        let i = 0;
        while (i < A.length - 2 && A[i + 1] < ageMa) i++;
        const w = Math.max(0, Math.min(1, (ageMa - A[i]) / (A[i + 1] - A[i])));
        for (const b of BANDES) {
            out[b.cle] = {
                continent: G.continent[b.cle][i] + w * (G.continent[b.cle][i + 1] - G.continent[b.cle][i]),
                socle_m: G.socle_m[b.cle][i] + w * (G.socle_m[b.cle][i + 1] - G.socle_m[b.cle][i]),
                haut_m: G.haut_m[b.cle][i] + w * (G.haut_m[b.cle][i + 1] - G.haut_m[b.cle][i])
            };
        }
        return out;
    }

    /** Géométrie d'une calotte couvrant la fraction a de la bande : épaisseur moyenne H̄ [m] et altitude moyenne de surface [m].
     *  Socle sous la calotte : les hautes terres pour une calotte naissante (elles naissent là), le socle moyen du continent quand
     *  elle le couvre — interpolation linéaire en a / continent (approximation déclarée de l'hypsométrie de la bande). */
    function geometrie(a, bande, geo) {
        const socle_m = geo.continent > 0 ? geo.haut_m + (geo.socle_m - geo.haut_m) * Math.min(1, a / geo.continent) : geo.socle_m;
        const R = window.DATA['📜']['📐'] * 1000;
        const S = a * 2 * Math.PI * R * R * (bande.x1 - bande.x0);          // [m²] aire de la calotte
        const L = Math.sqrt(S / Math.PI);                                     // [m] rayon équivalent
        const g = window.DATA['📅']['🍎'];
        const rhoI = window.EARTH.NUAGES.RHO_GLACE;
        const H = (8 / 15) * Math.sqrt(2 * K.TAU0_PA * L / (rhoI * g));     // [m]
        return { H: H, z: socle_m + H * (1 - rhoI / K.RHO_MANTEAU) };
    }

    /**
     * Bilan de masse annuel moyen [kg m⁻² an⁻¹] d'une calotte d'altitude moyenne z dans une zone de température annuelle T_zone [K],
     * d'amplitude saisonnière amp [K]. P_ref : précipitation moyenne du modèle à la température globale T̄ [kg m⁻² an⁻¹].
     */
    function bilanMasse(z, T_zone, amp, T_glob, P_ref) {
        const Ts = T_zone - window.CONFIG_COMPUTE.troposphericLapseRateKPerM * Math.max(0, z);
        const retard = 2 * Math.PI * window.EARTH.RETARD_SAISONS_JOURS / 365.25;
        // La neige se forme au sommet de l'inversion de surface, plus chaud que la surface : T_inv = 0,67 T_s + 88,9 K, relation
        // mesurée en Antarctique (Jouzel & Merlivat 1984, JGR 89:11749) ; sans inversion (surface au-dessus de 269 K), la surface.
        const Tcond = Math.max(Ts, 0.67 * Ts + 88.9);
        const precipJour = P_ref * window.PHYS.pSatEau(Tcond) / window.PHYS.pSatEau(T_glob) / 365.25;   // [kg m⁻² j⁻¹]
        let pdd = 0, neige = 0;
        for (let d = 0; d < 365; d++) {
            const Tc = Ts + amp * Math.sin(2 * Math.PI * d / 365 - retard) - window.CONST.T0_WATER;   // [°C]
            if (Tc > 0) pdd += Tc; else neige += precipJour;
        }
        const fonteNeigePossible = K.DDF_NEIGE * pdd;
        const fonte = fonteNeigePossible <= neige ? fonteNeigePossible : neige + K.DDF_GLACE * (pdd - neige / K.DDF_NEIGE);
        return { B: neige - fonte, accumulation: neige, fonte: fonte, Ts: Ts };
    }

    /** Aire d'équilibre (fraction de la bande) depuis a0 : on suit le signe du bilan jusqu'à son annulation, plafond = continent. */
    function equilibre(a0, bande, geo, T_zone, amp, T_glob, P_ref) {
        const cap = geo.continent;
        const B = (a) => bilanMasse(geometrie(a, bande, geo).z, T_zone, amp, T_glob, P_ref).B;
        const a1 = Math.min(Math.max(a0, 0), cap);
        const N = 40;
        if (B(a1) > 0) {                                    // croissance : premier zéro au-dessus, sinon tout le continent
            let lo = a1;
            for (let k = 1; k <= N; k++) {
                const a = a1 + (cap - a1) * k / N;
                if (!(B(a) > 0)) { let hi = a; for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
                lo = a;
            }
            return cap;
        }
        let hi = a1;                                        // décroissance : premier zéro en dessous, sinon plus de calotte
        for (let k = 1; k <= N; k++) {
            const a = a1 * (1 - k / N);
            if (B(a) > 0) { let lo = a; for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
            hi = a;
        }
        return 0;
    }

    /**
     * Calottes de l'état courant. T_zones = { pol, mid, trop } [K], amp = { pol, mid, trop } [K] (amplitudes saisonnières des terres).
     * depart : { cle: a } — état d'où l'on part (DATA['🗻']['🍰🗻🧊'], porté d'un clic à l'autre) ;
     * dureeAns : temps écoulé depuis cet état [an] (0 : l'état lui-même).
     * Temps de réaction PHYSIQUE : calotte présente → sa masse / max(accumulation, fonte) à l'état de départ ; calotte absente →
     * la masse de l'équilibre / son accumulation (le temps de la construire) ; ni glace ni bilan → rien ne bouge.
     * Renvoie { cle: { a, aEq, H, z, accumulation, fonte, Ts, tau } } et parZone { pol, mid, trop } (fraction moyenne des deux hémisphères).
     */
    function calculer(T_zones, amp, T_glob, ageMa, EPOCH, depart, dureeAns) {
        if (!(dureeAns >= 0)) throw new Error('[CALOTTES] durée ' + dureeAns + ' an : l\'état des calottes est daté APRÈS la date courante (clic frise oublié ?)');
        const geo = geographie(ageMa, EPOCH);
        const P_ref = window.RADIATIVE.computePWV() / window.CONV.TAU_VAPOR_GLOBAL_S * 3.15576e7;   // [kg m⁻² an⁻¹]
        const rhoI = window.EARTH.NUAGES.RHO_GLACE;
        const res = {}, parZone = { pol: 0, mid: 0, trop: 0 };
        for (const b of BANDES) {
            const a0 = Math.min(depart[b.cle], geo[b.cle].continent);
            const aEq = equilibre(a0, b, geo[b.cle], T_zones[b.zone], amp[b.zone], T_glob, P_ref);
            const gEq = geometrie(aEq, b, geo[b.cle]);
            const mbEq = bilanMasse(gEq.z, T_zones[b.zone], amp[b.zone], T_glob, P_ref);
            let tau;
            if (a0 > 0) {
                const g0 = geometrie(a0, b, geo[b.cle]);
                const mb0 = bilanMasse(g0.z, T_zones[b.zone], amp[b.zone], T_glob, P_ref);
                tau = rhoI * g0.H / Math.max(mb0.accumulation, mb0.fonte);
            } else if (aEq > 0) {
                tau = rhoI * gEq.H / mbEq.accumulation;
            } else {
                tau = Infinity;                                  // pas de glace, pas d'équilibre englacé : rien ne bouge
            }
            const f = 1 - Math.exp(-dureeAns / tau);
            const a = a0 + (aEq - a0) * f;
            res[b.cle] = { a: a, aEq: aEq, H: gEq.H, z: gEq.z, accumulation: mbEq.accumulation, fonte: mbEq.fonte, Ts: mbEq.Ts, tau: tau };
            parZone[b.zone] += a / 2;                            // deux hémisphères de même aire
        }
        res.parZone = parZone;
        return res;
    }

    /** Clic sur la frise : l'état des calottes est celui de la CONFIG de l'époque (part de chaque bande sous calotte à ▶),
     *  daté de ▶. Une part de 1 = toute la bande : le continent de la bande la plafonne (calculer). */
    function depuisConfig(DATA) {
        const EPOCH = window.TIMELINE[DATA['📜']['👉']];
        const C = EPOCH['🗻']['🍰🗻🧊'], etat = {};
        for (const b of BANDES) {
            if (!(C[b.cle] >= 0 && C[b.cle] <= 1)) throw new Error('[CALOTTES] ' + EPOCH['📅'] + " : 🗻.🍰🗻🧊." + b.cle + ' = ' + C[b.cle] + ' (part de bande attendue dans [0, 1])');
            etat[b.cle] = C[b.cle];
        }
        DATA['🗻']['🍰🗻🧊'] = etat;
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageDe(EPOCH, EPOCH['▶']);
    }

    /** Fin de convergence : le résultat du dernier pas (🧮🍰🗻🧊) devient l'état porté, daté de maintenant (le clic suivant part de là). */
    function engager(DATA) {
        for (const b of BANDES) DATA['🗻']['🍰🗻🧊'][b.cle] = DATA['🗻']['🧮🍰🗻🧊'][b.cle];
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageCourant(DATA);
    }

    window.CALOTTES = { K: K, BANDES: BANDES, geographie: geographie, geometrie: geometrie, bilanMasse: bilanMasse, calculer: calculer,
        depuisConfig: depuisConfig, engager: engager };
})();
