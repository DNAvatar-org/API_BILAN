// File: API_BILAN/physics/calottes.js - Calottes de glace continentales (profil plastique + bilan de masse intégré)
// Desc: Je calcule les calottes PERMANENTES posées sur les continents (Antarctique, Groenland, Laurentide, Gondwana…), bande par
//       bande de latitude et par hémisphère, avec des équations publiées — pas de surface posée par époque :
//         · géométrie de Weertman (1976, Nature 261:17) : la calotte couvre la terre de la bande depuis son bout polaire, où passe
//           son partage des eaux, jusqu'à une marge vers l'équateur ; profil parfaitement plastique le long du méridien (Nye 1952) :
//           h(y) = h₀ √(1 − y/W), h₀ = √(2 τ₀ W / (ρ_i g)), W = largeur méridienne ; τ₀ = 100 kPa, milieu des 50–150 kPa mesurés ;
//         · isostasie : le socle s'enfonce de (ρ_i / ρ_m) h ; altitude de la surface z = socle + h (1 − ρ_i/ρ_m) ;
//         · BILAN INTÉGRÉ sur toute la calotte, chaque point à SA latitude et SON altitude (Weertman 1976 ; Pollard 1978, Nature
//           272:233) : température annuelle d'un point = profil méridien du bilan de North, T(x) = T̄ + T₂ P₂(x) (physics/meridien.js),
//           − Γ z ; cycle saisonnier de la zone de la bande. Le bord d'une calotte est bas et il descend vers des latitudes plus
//           chaudes, où il fond : c'est ce qui borne sa taille. Évalué au seul point moyen (altitude moyenne, température de zone), le
//           bilan ne fondait plus nulle part au-dessus de ~2,5 km et l'équilibre était tout le continent de la bande, ou rien ;
//         · accumulation : l'humidité qu'APPORTENT les tourbillons des latitudes moyennes, pas la vapeur locale. Transport d'énergie
//           humide en diffusion (Siler, Roe & Armour 2018, J. Climate 31:7481, éq. 1, 2, 5) sur le profil T(x) du bilan de North :
//           F_q(x) = −(2π p_s/g) D (1 − x²) [1 − w(x)] dq/dx, q = HR · q*(T(x)), w = e^(−x²/0,3²) (part de la cellule de Hadley),
//           P − E = −(1/2πa²) dF_q/dx. Sur la glace la sublimation est négligée : la neige d'un point vaut P − E à sa latitude,
//           réduite avec l'altitude comme la vapeur saturante au sommet de l'inversion (Jouzel & Merlivat 1984),
//           p_sat(T_inv(T_s))/p_sat(T_inv(T_mer)), les jours de gel seulement (la pluie ne s'accumule pas) ;
//         · fonte : degrés-jours positifs, neige puis glace (Reeh 1991, Polarforschung 59:113), facteurs mesurés de Braithwaite 1995
//           (J. Glaciol. 41:153) : neige ~3, glace ~8 mm d'eau par °C·jour, mesurés sous l'orbite actuelle ; PLUS l'écart d'énergie
//           solaire absorbée les jours de fonte entre l'orbite de la date et celle de 1950 (Robinson & Goelzer 2014, The Cryosphere
//           8:1419, éq. 2 ; orbite : physics/orbite.js), avec l'absorption au sol du transfert solaire du modèle (radiative/solaire.js)
//           pour une surface qui fond — c'est par là qu'entrent la précession et l'insolation d'été ;
//         · NAISSANCE sur les hautes terres, au bout polaire de la terre de la bande, puis ÉQUILIBRE : l'aire où le bilan intégré
//           s'annule, plafonnée par le continent de la bande (data/paleogeo_zones.js, PaleoDEM Scotese & Wright 2018) ;
//         · ÉTAT PORTÉ (DATA['🗻']['🍰🗻🧊'], daté 📅🗻🧊) : au clic sur la frise, l'état vient de la CONFIG de l'époque
//           (EPOCH['🗻']['🍰🗻🧊'], aires sourcées) ; au clic time, il part de l'état du clic précédent et relaxe vers l'équilibre
//           sur le temps écoulé, au temps de renouvellement physique ρ_i H̄ / accumulation — comme l'intérieur (INTERIEUR.avancer).
//       Contrôle (pas une entrée) : accumulation moyenne de l'Antarctique posé, 143 ± 4 kg m⁻² an⁻¹ (Arthern et al. 2006, JGR 111:D06107).
//       Approximations DÉCLARÉES : une calotte par bande et par hémisphère ; terre de la bande uniforme en sin φ, collée au bord de la
//       bande qui rend la latitude moyenne des PaleoDEM, plateaux continentaux jusqu'à −1 000 m compris ; un socle par calotte (hautes
//       terres quand elle naît, socle moyen quand elle couvre le continent) ; amplitude saisonnière de la zone de la bande sur toute la
//       calotte ; même profil méridien dans les deux hémisphères ; avant 540 Ma, pas de carte : continent uniforme.
// Version 1.4.0
// - v1.4.0 (2026-10-25): accumulation = P − E du transport d'humidité (Siler et al. 2018), au lieu de P̄ · p_sat(T_inv)/p_sat(T̄).
// - v1.3.0 (2026-10-22): bilan intégré en latitude et en altitude (géométrie de Weertman), anomalie d'insolation de l'orbite.
// - v1.2.0 (2026-10-14): état porté d'un clic à l'autre, posé depuis la config au clic frise (plus de graine sans glace).
// Date: [October 22, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        TAU0_PA: 100e3,          // [Pa] seuil de cisaillement basal, 50–150 kPa mesurés (Nye 1952 ; Weertman)
        RHO_MANTEAU: 3300,       // [kg/m³] manteau supérieur (Turcotte & Schubert 2014) — isostasie
        DDF_NEIGE: 3,            // [kg m⁻² °C⁻¹ j⁻¹] = mm d'eau par °C·jour (Braithwaite 1995)
        DDF_GLACE: 8,            // [kg m⁻² °C⁻¹ j⁻¹] (Braithwaite 1995)
        L_FUSION_J_KG: 3.3355e5, // [J/kg] chaleur latente de fusion de la glace à 0 °C (CRC Handbook of Chemistry and Physics)
        AGE_MAX_CARTES_MA: 540,  // [Ma] au-delà : pas de PaleoDEM
        D_HUMIDE: 1.16e6,        // [m²/s] diffusivité de l'énergie humide (Siler, Roe & Armour 2018 : T zonale d'ERA-Interim)
        SIGMA_HADLEY: 0.3,       // [-] largeur en x = sin φ de la part de la cellule de Hadley, w = e^(−x²/σ²) (même article, éq. 6)
        POINTS: 24               // latitudes du partage des eaux à la marge (bilan intégré) — résolution, pas un réglage
    };
    // Bandes : zone du bilan méridien, hémisphère (h, signe de la latitude), sinus des bornes (aire = 2πR² Δsin φ par hémisphère).
    const BANDES = [
        { cle: 'S_pol', zone: 'pol', h: -1, x0: Math.sin(Math.PI / 3), x1: 1 },
        { cle: 'N_pol', zone: 'pol', h: 1, x0: Math.sin(Math.PI / 3), x1: 1 },
        { cle: 'S_mid', zone: 'mid', h: -1, x0: 0.5, x1: Math.sin(Math.PI / 3) },
        { cle: 'N_mid', zone: 'mid', h: 1, x0: 0.5, x1: Math.sin(Math.PI / 3) },
        { cle: 'S_trop', zone: 'trop', h: -1, x0: 0, x1: 0.5 },
        { cle: 'N_trop', zone: 'trop', h: 1, x0: 0, x1: 0.5 }
    ];

    /** Paléogéographie de la date [Ma avant présent] : { cle: { continent, socle_m, haut_m, x_continent } }, interpolée entre cartes
     *  de 5 Ma (x_continent = sin de la latitude moyenne du continent de la bande).
     *  Avant 540 Ma (pas de carte) : le continent de l'époque (1 − 🍰🗻🌊) réparti uniformément, socle au niveau de la mer (⚠️). */
    function geographie(ageMa, EPOCH) {
        const G = window.PALEOGEO, out = {};
        if (ageMa > K.AGE_MAX_CARTES_MA) {
            const c = 1 - EPOCH['🗻']['🍰🗻🌊'];
            for (const b of BANDES) out[b.cle] = { continent: c, socle_m: 0, haut_m: 0, x_continent: (b.x0 + b.x1) / 2 };
            return out;
        }
        const A = G.ages_Ma;
        let i = 0;
        while (i < A.length - 2 && A[i + 1] < ageMa) i++;
        const w = Math.max(0, Math.min(1, (ageMa - A[i]) / (A[i + 1] - A[i])));
        const lire = (champ, cle) => G[champ][cle][i] + w * (G[champ][cle][i + 1] - G[champ][cle][i]);
        for (const b of BANDES) {
            out[b.cle] = { continent: lire('continent', b.cle), socle_m: lire('socle_m', b.cle), haut_m: lire('haut_m', b.cle),
                x_continent: lire('x_continent', b.cle) };
        }
        return out;
    }

    /** Terre de la bande : intervalle [x_a, x_b] de sin φ où son continent est réparti uniformément (densité d ≤ 1), collé au bord de
     *  la bande qui rend la latitude moyenne des PaleoDEM (x_continent) ; à densité 1 si cette moyenne ne tient pas dans la bande. */
    function terre(bande, geo) {
        const w = geo.continent * (bande.x1 - bande.x0);
        let xa, xb;
        if (2 * geo.x_continent - bande.x0 <= bande.x1) {
            xa = bande.x0; xb = Math.max(2 * geo.x_continent - bande.x0, bande.x0 + w);
        } else {
            xb = bande.x1; xa = Math.min(2 * geo.x_continent - bande.x1, bande.x1 - w);
        }
        return { xa: xa, xb: xb, d: w > 0 ? w / (xb - xa) : 1 };
    }

    /** Géométrie d'une calotte couvrant la fraction a de la bande (Weertman 1976) : elle couvre la terre de la bande depuis son bout
     *  polaire x_b jusqu'à sa marge x_e vers l'équateur ; partage des eaux au bout polaire, profil parfaitement plastique le long du
     *  méridien, h(y) = h₀ √(1 − y/W), h₀ = √(2 τ₀ W / (ρ_i g)), W = largeur méridienne [m]. Socle : les hautes terres pour une
     *  calotte naissante (elle naît là), le socle moyen du continent quand elle le couvre — interpolation linéaire en a / continent. */
    function geometrie(a, bande, geo) {
        const t = terre(bande, geo);
        const p = geo.continent > 0 ? Math.min(1, a / geo.continent) : 1;
        const R = window.DATA['📜']['📐'] * 1000;
        const xe = t.xb - a * (bande.x1 - bande.x0) / t.d;
        const W = R * (Math.asin(t.xb) - Math.asin(xe));
        const h0 = Math.sqrt(2 * K.TAU0_PA * W / (window.EARTH.NUAGES.RHO_GLACE * window.DATA['📅']['🍎']));
        return { xb: t.xb, xe: xe, W: W, h0: h0, R: R, socle: geo.haut_m + (geo.socle_m - geo.haut_m) * p };
    }

    /**
     * Bilan de masse annuel [kg m⁻² an⁻¹] en un point de calotte de température annuelle Ts [K] (latitude et altitude comprises) et de
     * demi-amplitude saisonnière amp [K] ; latDeg = latitude géographique du point (son signe place sa saison et son anomalie
     * d'insolation), x = sin |φ| ; absorbe = { neige, glace } part de l'insolation absorbée au sol par une surface qui fond ; c = contexte du calcul.
     * Cycle T(j) = Ts + amp sin(2πj/an − retard) : degrés-jours et jours de gel en forme fermée, β = phase du passage à 0 °C.
     */
    function bilanPoint(Ts, amp, latDeg, x, absorbe, c) {
        const mu = Ts - window.CONST.T0_WATER;                          // [°C]
        const beta = mu >= amp ? -Math.PI / 2 : (mu <= -amp ? Math.PI / 2 : Math.asin(-mu / amp));
        const gel = (Math.PI + 2 * beta) / (2 * Math.PI);                      // part de l'année sous 0 °C
        // La neige se forme au sommet de l'inversion de surface, plus chaud que la surface : T_inv = 0,67 T_s + 88,9 K, relation
        // mesurée en Antarctique (Jouzel & Merlivat 1984, JGR 89:11749) ; sans inversion (surface au-dessus de 269 K), la surface.
        // Pas un jour de gel : pas de neige, quelle que soit la pluie (océan de magma compris, où la précipitation n'est pas définie).
        const Tinv = (T) => Math.max(T, 0.67 * T + 88.9);
        const Tmer = c.T_glob + c.T2 * (3 * x * x - 1) / 2;                   // au niveau de la mer, à la latitude du point
        const neige = gel > 0 ? Math.max(0, c.PmoinsE(x)) * window.PHYS.pSatEau(Tinv(Ts)) / window.PHYS.pSatEau(Tinv(Tmer)) * gel : 0;   // [kg m⁻² an⁻¹]
        const parRad = window.ORBITE.JOURS_AN / (2 * Math.PI);                    // [jour/rad]
        const pdd = parRad * (mu * (Math.PI - 2 * beta) + 2 * amp * Math.cos(beta));   // [°C·jour]
        const fonteNeigePossible = K.DDF_NEIGE * pdd;
        let fonte = fonteNeigePossible <= neige ? fonteNeigePossible : neige + K.DDF_GLACE * (pdd - neige / K.DDF_NEIGE);
        if (pdd > 0) {
            // Jours de fonte : du passage à 0 °C au printemps à celui de l'automne (décalés d'une demi-année au sud). L'anomalie
            // d'insolation y est absorbée sur la neige puis sur la glace nue, au prorata de leurs degrés-jours (Robinson & Goelzer 2014).
            const decal = latDeg < 0 ? window.ORBITE.JOURS_AN / 2 : 0;
            const E = window.ORBITE.sommeAnomalie(c.anomalie, latDeg, (beta + c.retard) * parRad + decal, (Math.PI - beta + c.retard) * parRad + decal);
            const partNeige = Math.min(1, neige / fonteNeigePossible);
            fonte = Math.max(0, fonte + E * c.echelle * (partNeige * absorbe.neige + (1 - partNeige) * absorbe.glace) / K.L_FUSION_J_KG);
        }
        return { B: neige - fonte, accumulation: neige, fonte: fonte };
    }

    /**
     * Bilan INTÉGRÉ de la calotte de fraction a de la bande, sur POINTS latitudes également espacées du partage des eaux à la marge,
     * pondérées par l'aire (cos φ : terre uniforme en sin φ). Point à la fraction s de la largeur : latitude φ_b − s W/R, altitude
     * z = socle + h₀ √(1 − s) (1 − ρ_i/ρ_m). Une petite calotte vaut le bilan de son sommet ; une grande a un bord bas, tourné vers
     * l'équateur, qui fond. Renvoie aussi l'épaisseur moyenne H̄ [m] et la latitude de la marge (°, signée).
     */
    function bilanCalotte(a, bande, geo, amp, absorbe, c) {
        const g = geometrie(a, bande, geo);
        const iso = 1 - window.EARTH.NUAGES.RHO_GLACE / K.RHO_MANTEAU;
        const phiB = Math.asin(g.xb);
        let B = 0, acc = 0, fonte = 0, Ts = 0, z = 0, H = 0, poids = 0;
        for (let k = 0; k < K.POINTS; k++) {
            const s = (k + 0.5) / K.POINTS;
            const phi = phiB - s * g.W / g.R;
            const hk = g.h0 * Math.sqrt(1 - s);
            const zk = g.socle + hk * iso;
            const x = Math.sin(phi);
            const T = c.T_glob + c.T2 * (3 * x * x - 1) / 2 - c.Gamma * Math.max(0, zk);
            const m = bilanPoint(T, amp, bande.h * phi * 180 / Math.PI, x, absorbe, c);
            const w = Math.cos(phi);
            B += w * m.B; acc += w * m.accumulation; fonte += w * m.fonte; Ts += w * T; z += w * zk; H += w * hk; poids += w;
        }
        return { B: B / poids, accumulation: acc / poids, fonte: fonte / poids, Ts: Ts / poids, z: z / poids, H: H / poids,
            marge: bande.h * Math.asin(g.xe) * 180 / Math.PI };
    }

    /** Aire d'équilibre (fraction de la bande) depuis a0 : on suit le signe du bilan intégré jusqu'à son annulation, plafond = continent. */
    function equilibre(a0, bande, geo, amp, absorbe, c) {
        const cap = geo.continent;
        const B = (a) => bilanCalotte(a, bande, geo, amp, absorbe, c).B;
        const a1 = Math.min(Math.max(a0, 0), cap);
        const N = 40;
        if (B(a1) > 0) {                                    // croissance : premier zéro au-dessus, sinon tout le continent
            let lo = a1;
            for (let k = 1; k <= N; k++) {
                const a = a1 + (cap - a1) * k / N;
                if (!(B(a) > 0)) { let hi = a; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
                lo = a;
            }
            return cap;
        }
        let hi = a1;                                        // décroissance : premier zéro en dessous, sinon plus de calotte
        for (let k = 1; k <= N; k++) {
            const a = a1 * (1 - k / N);
            if (B(a) > 0) { let lo = a; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
            hi = a;
        }
        return 0;
    }

    /**
     * Calottes de l'état courant. T_glob [K] et T₂ [K] : profil méridien du bilan de North (T(x) = T̄ + T₂ P₂(x)) ; amp = { pol, mid,
     * trop } [K] amplitudes saisonnières des terres ; absorbe = { pol, mid, trop } → { neige, glace } part de l'insolation absorbée au
     * sol par une surface qui fond (physics/meridien.js). depart : { cle: a } — état d'où l'on part (DATA['🗻']['🍰🗻🧊'], porté
     * d'un clic à l'autre) ; dureeAns : temps écoulé depuis cet état [an] (0 : l'état lui-même).
     * Temps de réaction PHYSIQUE : calotte présente → sa masse / max(accumulation, fonte) à l'état de départ ; calotte absente →
     * la masse de l'équilibre / son accumulation (le temps de la construire) ; ni glace ni bilan → rien ne bouge.
     * Renvoie { cle: { a, aEq, H, z, accumulation, fonte, Ts, tau, marge } } et parZone { pol, mid, trop } (moyenne des deux hémisphères).
     */
    function calculer(T_glob, T2, amp, absorbe, ageMa, EPOCH, depart, dureeAns) {
        if (!(dureeAns >= 0)) throw new Error('[CALOTTES] durée ' + dureeAns + ' an : l\'état des calottes est daté APRÈS la date courante (clic frise oublié ?)');
        const geo = geographie(ageMa, EPOCH);
        // P − E [kg m⁻² an⁻¹] à x = sin |φ| (en-tête) : humidité de surface du modèle (jauge SUBTIL H2O_SURFACE_RH_01), q* de l'air de
        // l'époque (M_H₂O / M_air), pression et gravité de l'époque ; dérivées centrées en x.
        const D = window.DATA, ps = D['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA, gr = D['📅']['🍎'], rayon = D['📜']['📐'] * 1000;
        const eps = window.CONST.M_H2O / D['🫧']['🧪'], HR = D['🎚️'].H2O.H2O_SURFACE_RH_01, dx = 1e-4;
        const q = (x) => { const e = window.PHYS.pSatEau(T_glob + T2 * (3 * x * x - 1) / 2); return HR * eps * e / (ps - (1 - eps) * e); };
        const Fq = (x) => -2 * Math.PI * ps / gr * K.D_HUMIDE * (1 - x * x) * (1 - Math.exp(-x * x / (K.SIGMA_HADLEY * K.SIGMA_HADLEY)))
            * (q(x + dx) - q(x - dx)) / (2 * dx);                                // [kg/s] vers le pôle
        const c = {
            T_glob: T_glob, T2: T2,
            Gamma: window.CONFIG_COMPUTE.troposphericLapseRateKPerM,
            PmoinsE: (x) => -(Fq(x + dx) - Fq(x - dx)) / (2 * dx) / (2 * Math.PI * rayon * rayon) * 3.15576e7,
            retard: 2 * Math.PI * window.EARTH.RETARD_SAISONS_JOURS / 365.25,
            anomalie: window.ORBITE.anomalie(ageMa * 1e6),
            echelle: window.DATA['☀️']['🔋☀️'] / window.COMPUTE.goughLuminosity(0)     // Soleil de l'époque / Soleil actuel
        };
        const rhoI = window.EARTH.NUAGES.RHO_GLACE;
        const res = {}, parZone = { pol: 0, mid: 0, trop: 0 };
        for (const b of BANDES) {
            const a0 = Math.min(depart[b.cle], geo[b.cle].continent);
            const ab = absorbe[b.zone];
            const aEq = equilibre(a0, b, geo[b.cle], amp[b.zone], ab, c);
            const mbEq = bilanCalotte(aEq, b, geo[b.cle], amp[b.zone], ab, c);
            let tau;
            if (a0 > 0) {
                const mb0 = bilanCalotte(a0, b, geo[b.cle], amp[b.zone], ab, c);
                tau = rhoI * mb0.H / Math.max(mb0.accumulation, mb0.fonte);
            } else if (aEq > 0) {
                tau = rhoI * mbEq.H / mbEq.accumulation;
            } else {
                tau = Infinity;                                  // pas de glace, pas d'équilibre englacé : rien ne bouge
            }
            const f = 1 - Math.exp(-dureeAns / tau);
            const a = a0 + (aEq - a0) * f;
            res[b.cle] = { a: a, aEq: aEq, H: mbEq.H, z: mbEq.z, accumulation: mbEq.accumulation, fonte: mbEq.fonte, Ts: mbEq.Ts, tau: tau,
                marge: mbEq.marge };
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

    window.CALOTTES = { K: K, BANDES: BANDES, geographie: geographie, geometrie: geometrie, bilanPoint: bilanPoint, bilanCalotte: bilanCalotte,
        calculer: calculer, depuisConfig: depuisConfig, engager: engager };
})();
