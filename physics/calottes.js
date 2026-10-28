// File: API_BILAN/physics/calottes.js - Calottes de glace continentales (profil plastique + bilan de masse intégré)
// Desc: Je calcule les calottes PERMANENTES posées sur les continents (Antarctique, Groenland, Laurentide, Gondwana…), bande par
//       bande de latitude et par hémisphère, avec des équations publiées — pas de surface posée par époque :
//         · géométrie de Weertman (1976, Nature 261:17) : la calotte couvre la terre de la bande depuis son bout polaire, où passe
//           son partage des eaux, jusqu'à une marge vers l'équateur ; profil parfaitement plastique le long du méridien (Nye 1952) :
//           h(y) = h₀ √(1 − y/W), h₀ = √(2 τ₀ W / (ρ_i g)), W = largeur méridienne ; τ₀ = 100 kPa, milieu des 50–150 kPa mesurés ;
//         · isostasie RETARDÉE : le socle s'enfonce de d, qui relaxe vers l'équilibre d'Airy (ρ_i / ρ_m) h au temps τ_b
//           (asthénosphère relaxante locale, Le Meur & Huybrechts 1996, Ann. Glaciol. 23:309, éq. 1 et 4) ; τ_b = 4π η / (ρ_m g λ),
//           demi-espace visqueux de Haskell (Schubert, Turcotte & Olson 2001, Mantle Convection, éq. 5.2.32) ; ⚠️ η = 10²¹ Pa·s
//           mesure posée (tirée du soulèvement daté de la Fennoscandie : Haskell 1935 ; Mitrovica 1996, 0,65–1,1e21) ; ❔ λ = 2 ×
//           largeur de la charge (Schubert et al. : 3 000 km pour les 1 350 km de la Fennoscandie), la calotte qui couvre la terre
//           de sa bande, W, ou 2W quand son partage des eaux est au pôle ; surface z = socle + h − d. Au clic time, calotte et
//           socle avancent ENSEMBLE en sous-pas de τ_b jusqu'à la fin du clic ou à l'arrêt (plus rien ne bouge) : le socle resté
//           bas sous une calotte qui fond l'expose à l'air plus chaud (Abe-Ouchi et al. 2013, Nature 500:190) ;
//         · BILAN INTÉGRÉ sur toute la calotte, chaque point à SA latitude et SON altitude (Weertman 1976 ; Pollard 1978, Nature
//           272:233) : température annuelle d'un point = profil méridien du bilan de North, T(x) = T̄ + T₂ P₂(x) (physics/meridien.js),
//           − Γ z ; cycle annuel des terres de la bande, { amplitude, retard, 2ᵉ harmonique } transmis par physics/meridien.js
//           (⚠️ amplitude de zone posée et retard posé : le cycle calculé de physics/saisons.js n'est pas encore lu). Le bord d'une
//           calotte est bas et il descend vers des latitudes plus
//           chaudes, où il fond : c'est ce qui borne sa taille. Évalué au seul point moyen (altitude moyenne, température de zone), le
//           bilan ne fondait plus nulle part au-dessus de ~2,5 km et l'équilibre était tout le continent de la bande, ou rien ;
//         · accumulation : l'humidité qu'APPORTENT les tourbillons des latitudes moyennes, pas la vapeur locale. Transport d'énergie
//           humide en diffusion (Siler, Roe & Armour 2018, J. Climate 31:7481, éq. 1, 2, 5) sur le profil T(x) du bilan de North :
//           F_q(x) = −(2π p_s/g) D (1 − x²) [1 − w(x)] dq/dx, q = HR · q*(T(x)), w = e^(−x²/0,3²) (part de la cellule de Hadley),
//           P − E = −(1/2πa²) dF_q/dx. Sur la glace la sublimation est négligée : la neige d'un point vaut P − E à sa latitude,
//           réduite avec l'altitude comme la vapeur saturante au sommet de l'inversion (Jouzel & Merlivat 1984),
//           p_sat(T_inv(T_s))/p_sat(T_inv(T_mer)), les jours de gel seulement (la pluie ne s'accumule pas) ;
//         · fonte : degrés-jours positifs STOCHASTIQUES — chaque jour s'écarte du cycle annuel selon une loi normale ;
//           PDD = ∫ [σ e^(−T²/2σ²)/√(2π) + T Φ(T/σ)] dt (Calov & Greve 2005, J. Glaciol. 51:173, éq. 6) sur 24 nœuds de l'année,
//           σ = 1,66 − 0,15 min(T, 0) K, écart-type des moyennes journalières sur le Groenland (Seguinot & Rogozhina 2014,
//           J. Glaciol. 60:603, éq. 3, ERA-40 ; ⚠️ une mesure : σ n'a pas d'équation ; ⚠️ mesurée sur la calotte, appliquée aussi
//           aux terres sans glace où naissent les calottes, que l'article exclut ; ❔ au-dessus de 0 °C σ garde sa valeur de 0 °C,
//           la régression, qui contient des mois jusqu'à +2 °C, deviendrait négative au-dessus de +11 °C) ; neige puis glace
//           (Reeh 1991, Polarforschung 59:113), facteurs mesurés de Braithwaite 1995 (J. Glaciol. 41:153) : neige ~3, glace ~8 mm
//           d'eau par °C·jour, mesurés sous l'orbite actuelle ; REGEL de la fonte M de l'année dans le névé : son froid,
//           (c_i/L_f) max(0, −T̄) × neige, et la rétention capillaire de la neige restante, (ρ_e/ρ_o − 1)(neige − M), nulle en zone
//           d'ablation (Pfeffer et al. 1991, sous la forme de Janssens & Huybrechts 2000, Ann. Glaciol. 31:133, écrite par Reijmer
//           et al. 2012, The Cryosphere 6:743, éq. 5 ; ρ_o = 300, ρ_e = 960 kg/m³ mesurées) ; PLUS l'écart d'énergie solaire absorbée entre l'orbite de la date et celle de 1950, pondéré par la probabilité
//           d'un jour de fonte (Robinson & Goelzer 2014, The Cryosphere 8:1419, éq. 2 ; ⚠️ la pondération est l'analogue continu des
//           jours de fonte ; orbite : physics/orbite.js), avec l'absorption au sol du transfert solaire du modèle (radiative/solaire.js)
//           pour une surface qui fond — c'est par là qu'entrent la précession et l'insolation d'été ;
//         · NAISSANCE sur les hautes terres, au bout polaire de la terre de la bande, puis ÉQUILIBRE : l'aire où le bilan intégré
//           s'annule, plafonnée par le continent de la bande (data/paleogeo_zones.js, PaleoDEM Scotese & Wright 2018) ;
//         · ÉTAT PORTÉ (DATA['🗻']['🍰🗻🧊'] et le socle ['🔺📏🗻🧊'], datés 📅🗻🧊) : au clic sur la frise, l'état vient de la CONFIG
//           de l'époque (EPOCH['🗻']['🍰🗻🧊'], aires sourcées), socle à l'équilibre sous elle ; au clic time, il part de l'état du
//           clic précédent et avance sur le temps écoulé par la CONSERVATION DE LA MASSE, dV/dt = a A_bande B̄ / ρ_i, V = a A_bande H̄
//           au profil de Nye (plafond : le continent de la bande, le surplus part à la mer), en sous-pas de τ_b avec le socle.
//       Contrôle (pas une entrée) : accumulation moyenne de l'Antarctique posé, 143 ± 4 kg m⁻² an⁻¹ (Arthern et al. 2006, JGR 111:D06107).
//       Approximations DÉCLARÉES : une calotte par bande et par hémisphère ; terre de la bande uniforme en sin φ, collée au bord de la
//       bande qui rend la latitude moyenne des PaleoDEM, plateaux continentaux jusqu'à −1 000 m compris ; un socle par calotte (hautes
//       terres quand elle naît, socle moyen quand elle couvre le continent) — socle SANS glace : la charge, c'est ce fichier qui la
//       pose, la table la retire, même croûte pour les deux calottes (CO2/scripts/paleogeo/paleodem_zones.py : glace de la carte
//       0 Ma retirée cellule par cellule, rebond d'Airy et recharge d'eau des socles restés sous la mer, ⚠️ eau douce ; sur les
//       cartes qui copient la carte 0 Ma, l'empreinte transportée de la calotte reçoit ce socle déchargé, ⚠️ relief propre de la
//       carte remplacé ; Antarctique au profil de Nye, τ effectif et recul de la marge fermés sur le volume ET l'aire posés de
//       Bedmap2, ⚠️ l'aire est une entrée ; Groenland fermé sur BedMachine v3, ⚠️ socle chargé uniforme ; ⚠️ marche de 80 à 85 Ma :
//       les reconstructions plus anciennes restent au niveau chargé) ; cycle annuel
//       des terres de la bande sur toute la calotte ; même profil méridien dans les deux hémisphères ; avant 540 Ma, pas de carte :
//       continent uniforme.
// Version 1.6.0
// - v1.6.0 (2026-10-28): socle à rebond retardé porté (🔺📏🗻🧊), avancé avec la masse de la calotte au clic time.
// - v1.5.0 (2026-10-27): degrés-jours stochastiques (Calov & Greve 2005, σ de Seguinot & Rogozhina 2014), regel (Janssens &
//   Huybrechts 2000), cycle annuel par bande (amplitude, retard, 2ᵉ harmonique) en entrée.
// Date: [October 28, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        TAU0_PA: 100e3,          // [Pa] seuil de cisaillement basal, 50–150 kPa mesurés (Nye 1952 ; Weertman)
        RHO_MANTEAU: 3300,       // [kg/m³] manteau supérieur (Turcotte & Schubert 2014) — isostasie
        DDF_NEIGE: 3,            // [kg m⁻² °C⁻¹ j⁻¹] = mm d'eau par °C·jour (Braithwaite 1995)
        DDF_GLACE: 8,            // [kg m⁻² °C⁻¹ j⁻¹] (Braithwaite 1995)
        SIGMA_FONTE_K: 1.66,     // [K] écart-type des températures journalières à 0 °C (Seguinot & Rogozhina 2014, éq. 3)
        PENTE_SIGMA: -0.15,      // [K/°C] sa pente sous 0 °C (même régression, ERA-40 1958–2001 sur le Groenland, r² = 0,79)
        RHO_NEIGE_SECHE: 300,    // [kg/m³] névé sec (Janssens & Huybrechts 2000, d'après Pfeffer et al. 1991)
        RHO_NEIGE_MOUILLEE: 960, // [kg/m³] névé saturé d'eau (même source)
        NOEUDS: 24,              // nœuds de l'année du cycle annuel (degrés-jours stochastiques) — résolution, pas un réglage
        AGE_MAX_CARTES_MA: 540,  // [Ma] au-delà : pas de PaleoDEM
        D_HUMIDE: 1.16e6,        // [m²/s] diffusivité de l'énergie humide (Siler, Roe & Armour 2018 : T zonale d'ERA-Interim)
        SIGMA_HADLEY: 0.3,       // [-] largeur en x = sin φ de la part de la cellule de Hadley, w = e^(−x²/σ²) (même article, éq. 6)
        POINTS: 24,              // latitudes du partage des eaux à la marge (bilan intégré) — résolution, pas un réglage
        // ⚠️ MESURE POSÉE : viscosité moyenne du manteau jusqu'à ~1 400 km, tirée du soulèvement daté de la Fennoscandie par
        // l'équation du demi-espace visqueux (Haskell 1935 ; Mitrovica 1996, JGR 101:555 : 0,65–1,1e21 Pa·s)
        VISCOSITE_MANTEAU: 1e21, // [Pa·s]
        NOEUDS_SOCLE: 61,        // latitudes du socle porté par bande (0,5°) — résolution, pas un réglage
        MEMOIRE_ANS: 1e5         // [an] fin d'un clic intégrée en masse ; avant, raccord vers l'équilibre (❔ coût borné, voir calculer)
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
    // Nœuds du socle porté : latitudes |φ| également espacées sur la bande, fixes (le socle ne suit pas la marge).
    for (const b of BANDES) {
        b.phi0 = Math.asin(b.x0); b.phi1 = Math.asin(b.x1);
        b.noeuds = Array.from({ length: K.NOEUDS_SOCLE }, (_, i) => b.phi0 + (b.phi1 - b.phi0) * i / (K.NOEUDS_SOCLE - 1));
    }

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

    /** Épaisseur de Nye [m] de la calotte de géométrie g à la latitude |φ| (0 hors de la calotte). */
    function hNye(g, phi) {
        const s = (Math.asin(g.xb) - phi) * g.R / g.W;
        return s >= 0 && s < 1 ? g.h0 * Math.sqrt(1 - s) : 0;
    }

    /** Valeur aux nœuds du socle de la bande, interpolée linéairement à la latitude |φ| ∈ [φ0, φ1] (φ1 : dernier intervalle). */
    function interp(v, b, phi) {
        const u = (phi - b.phi0) / (b.phi1 - b.phi0) * (K.NOEUDS_SOCLE - 1);
        const i = Math.min(K.NOEUDS_SOCLE - 2, Math.floor(u));
        return v[i] + (u - i) * (v[i + 1] - v[i]);
    }

    /** Enfoncement du socle [m] sous un point de calotte (latitude |φ|, épaisseur hk) :
     *  airy() — à l'équilibre sous la calotte évaluée elle-même, (ρ_i/ρ_m) hk (l'équilibre aEq, cible à long terme) ;
     *  fige(b, gRef, e) — le socle PORTÉ, figé pendant le sous-pas : équilibre de la calotte courante gRef, exact aux points du
     *  bilan, plus l'écart e porté aux nœuds (interpolé ; l'interpolation ne touche que l'écart, nul à l'équilibre). */
    function airy() {
        const rr = window.EARTH.NUAGES.RHO_GLACE / K.RHO_MANTEAU;
        return (phi, hk) => rr * hk;
    }
    function fige(b, gRef, e) {
        const rr = window.EARTH.NUAGES.RHO_GLACE / K.RHO_MANTEAU;
        return (phi) => rr * hNye(gRef, phi) + interp(e, b, phi);
    }

    /** Charge d'équilibre d'Airy [m] aux nœuds du socle de la bande, sous la calotte de géométrie g. */
    function chargeNoeuds(b, g) {
        const rr = window.EARTH.NUAGES.RHO_GLACE / K.RHO_MANTEAU;
        return b.noeuds.map((phi) => rr * hNye(g, phi));
    }

    /** Volume [m³] de la calotte de fraction a de la bande : a A_bande H̄(a), même quadrature que bilanCalotte. */
    function volume(a, bande, geo) {
        const g = geometrie(a, bande, geo), phiB = Math.asin(g.xb), n = a > 0 ? K.POINTS : 1;
        let H = 0, p = 0;
        for (let k = 0; k < n; k++) {
            const s = (k + 0.5) / n, w = Math.cos(phiB - s * g.W / g.R);
            H += w * g.h0 * Math.sqrt(1 - s); p += w;
        }
        return a * 2 * Math.PI * g.R * g.R * (bande.x1 - bande.x0) * H / p;
    }

    /** Fraction de bande dont le volume vaut V (volume croissant avec a ; plafond = continent de la bande). */
    function aireDe(V, bande, geo) {
        let lo = 0, hi = geo.continent;
        for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (volume(m, bande, geo) < V) lo = m; else hi = m; }
        return lo;
    }

    // erfc d'Abramowitz & Stegun 1964, 7.1.26 (|ε| ≤ 1,5e-7) : erfc(a) = t P(t) e^(−a²), t = 1/(1 + p a), p = 0,3275911
    const AS = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];

    /**
     * Bilan de masse annuel [kg m⁻² an⁻¹] en un point de calotte de température annuelle Ts [K] (latitude et altitude comprises) et
     * de cycle annuel cyc = { a1, d1, r2, i2 } de la terre de sa bande ; latDeg = latitude géographique du point (son signe place sa
     * saison et son anomalie d'insolation), x = sin |φ| ; absorbe = { neige, glace } part de l'insolation absorbée au sol par une
     * surface qui fond ; c = contexte du calcul.
     * Nœud k de l'année (θ = 2π t / an depuis l'équinoxe de printemps, + π au sud) : T = Ts + a1 sin(θ − d1) + r2 cos 2θ − i2 sin 2θ ;
     * les jours s'en écartent selon une loi normale d'écart-type σ(T) : probabilité d'un jour au-dessus de 0 °C Φ(T/σ), degrés-jours
     * en forme semi-analytique (Calov & Greve 2005, éq. 6).
     */
    function bilanPoint(Ts, cyc, latDeg, x, absorbe, c) {
        const mu = Ts - window.CONST.T0_WATER;                          // [°C]
        const an = window.ORBITE.JOURS_AN, h = an / K.NOEUDS, w = 2 * Math.PI / an;
        const saison = latDeg < 0 ? Math.PI : 0;                        // saisons du sud décalées d'une demi-année
        const dE = c.anomalieNoeuds(latDeg);                             // [J/m²] anomalie d'insolation reçue pendant chaque nœud
        let pdd = 0, gel = 0, E = 0;
        for (let k = 0; k < K.NOEUDS; k++) {
            const th = w * (k + 0.5) * h + saison;
            const T = mu + cyc.a1 * Math.sin(th - cyc.d1) + cyc.r2 * Math.cos(2 * th) - cyc.i2 * Math.sin(2 * th);
            const s = K.SIGMA_FONTE_K + K.PENTE_SIGMA * Math.min(T, 0);
            const z = T / s, a = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * a), ex = Math.exp(-a * a);
            const y = t * (AS[0] + t * (AS[1] + t * (AS[2] + t * (AS[3] + t * AS[4])))) * ex;      // erfc(|z|/√2)
            const fond = z >= 0 ? 1 - y / 2 : y / 2;                    // probabilité d'un jour au-dessus de 0 °C (erfc(−a) = 2 − erfc(a))
            pdd += h * (s * ex / Math.sqrt(2 * Math.PI) + T * fond);    // [°C·jour]
            gel += (1 - fond) / K.NOEUDS;                               // part de l'année sous 0 °C
            E += fond * dE[k];
        }
        // La neige se forme au sommet de l'inversion de surface, plus chaud que la surface : T_inv = 0,67 T_s + 88,9 K, relation
        // mesurée en Antarctique (Jouzel & Merlivat 1984, JGR 89:11749) ; sans inversion (surface au-dessus de 269 K), la surface.
        // Part de gel nulle (tous les nœuds à plus de ~60 °C, l'exponentielle s'annule) : pas de neige, quelle que soit la pluie
        // (océan de magma compris, où la précipitation n'est pas définie).
        const Tinv = (T) => Math.max(T, 0.67 * T + 88.9);
        const Tmer = c.T_glob + c.T2 * (3 * x * x - 1) / 2;                   // au niveau de la mer, à la latitude du point
        const neige = gel > 0 ? Math.max(0, c.PmoinsE(x)) * window.PHYS.pSatEau(Tinv(Ts)) / window.PHYS.pSatEau(Tinv(Tmer)) * gel : 0;   // [kg m⁻² an⁻¹]
        // Neige de l'année fondue d'abord, puis glace (Reeh 1991) ; l'écart d'insolation de l'orbite des jours de fonte est absorbé
        // sur la neige puis sur la glace nue, au prorata de leurs degrés-jours (Robinson & Goelzer 2014).
        const Ms = Math.min(neige, K.DDF_NEIGE * pdd);
        const Mg = K.DDF_GLACE * (pdd - Ms / K.DDF_NEIGE);
        const Lf = window.CONST.L_FUSION_GLACE;
        const p = Math.min(1, neige / (K.DDF_NEIGE * pdd));
        const M = Math.max(0, Ms + Mg + E * c.echelle * (p * absorbe.neige + (1 - p) * absorbe.glace) / Lf);   // fonte de l'année
        // Regel (Janssens & Huybrechts 2000, sous la forme de Reijmer et al. 2012, The Cryosphere 6:743, éq. 2 et 5) :
        // E_r = min(P_r, M), P_r = (c_i/L_f) |T̄| C + (C − M)(ρ_e/ρ_o − 1) — froid du névé de l'année (nul à T̄ ≥ 0 °C) et eau retenue
        // par capillarité dans la neige restante. En zone d'ablation (M > C), le second terme est négatif et le regel s'annule
        // (P_r ≥ 0). La borne de J&H par la précipitation de l'année tient d'elle-même : E_r ≤ M ≤ C, ou P_r < C dès que M > C.
        const R = Math.max(0, Math.min(M, window.CONST.CP_GLACE / Lf * Math.max(0, -mu) * neige
            + (K.RHO_NEIGE_MOUILLEE / K.RHO_NEIGE_SECHE - 1) * (neige - M)));
        const fonte = M - R;
        return { B: neige - fonte, accumulation: neige, fonte: fonte };
    }

    /**
     * Bilan INTÉGRÉ de la calotte de fraction a de la bande, sur POINTS latitudes également espacées du partage des eaux à la marge,
     * pondérées par l'aire (cos φ : terre uniforme en sin φ). Point à la fraction s de la largeur : latitude φ_b − s W/R, altitude
     * z = socle + h₀ √(1 − s) − enf(φ, h), enf = enfoncement du socle (airy() : équilibre ; fige() : socle porté). Une petite
     * calotte vaut le bilan de son sommet ; une grande a un bord bas, tourné vers l'équateur, qui fond. Renvoie aussi l'épaisseur
     * moyenne H̄ [m] et la latitude de la marge (°, signée). cyc : cycle annuel de la terre de la bande.
     */
    function bilanCalotte(a, bande, geo, cyc, absorbe, c, enf) {
        const g = geometrie(a, bande, geo);
        const phiB = Math.asin(g.xb);
        const n = a > 0 ? K.POINTS : 1;                     // aire nulle : largeur nulle, tous les points sont le sommet
        let B = 0, acc = 0, fonte = 0, Ts = 0, z = 0, H = 0, poids = 0;
        for (let k = 0; k < n; k++) {
            const s = (k + 0.5) / n;
            const phi = phiB - s * g.W / g.R;
            const hk = g.h0 * Math.sqrt(1 - s);
            const zk = g.socle + hk - enf(phi, hk);
            const x = Math.sin(phi);
            const T = c.T_glob + c.T2 * (3 * x * x - 1) / 2 - c.Gamma * Math.max(0, zk);
            const m = bilanPoint(T, cyc, bande.h * phi * 180 / Math.PI, x, absorbe, c);
            const w = Math.cos(phi);
            B += w * m.B; acc += w * m.accumulation; fonte += w * m.fonte; Ts += w * T; z += w * zk; H += w * hk; poids += w;
        }
        return { B: B / poids, accumulation: acc / poids, fonte: fonte / poids, Ts: Ts / poids, z: z / poids, H: H / poids,
            marge: bande.h * Math.asin(g.xe) * 180 / Math.PI };
    }

    /** Aire d'équilibre (fraction de la bande) depuis a0 : on suit le signe du bilan intégré jusqu'à son annulation, plafond = continent. */
    function equilibre(a0, bande, geo, cyc, absorbe, c, enf) {
        const cap = geo.continent;
        const B = (a) => bilanCalotte(a, bande, geo, cyc, absorbe, c, enf).B;
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
        if (a1 === 0) return 0;                             // ni glace ni bilan positif au point de naissance : pas de calotte
        let hi = a1;                                        // décroissance : premier zéro en dessous, sinon plus de calotte
        for (let k = 1; k <= N; k++) {
            const a = a1 * (1 - k / N);
            if (B(a) > 0) { let lo = a; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
            hi = a;
        }
        return 0;
    }

    /** Naissance (calotte absente, bilan du sommet positif) sur h années, socle figé (enf) : Euler implicite de la conservation
     *  de la masse, V(a') = h a' A B̄(a') / ρ_i (A : aire de la bande [m²]), racine non nulle — V ∝ a^(>1) rend a = 0 instable dès
     *  que la neige reste. Plafond : le continent de la bande (le surplus part à la mer). */
    function naissance(b, geo, cyc, ab, c, enf, h, A) {
        const rhoI = window.EARTH.NUAGES.RHO_GLACE, cap = geo.continent;
        if (bilanCalotte(0, b, geo, cyc, ab, c, enf).B <= 0) return 0;      // la neige ne reste pas au sommet : pas de naissance
        const G = (x) => volume(x, b, geo) - h * x * A * bilanCalotte(x, b, geo, cyc, ab, c, enf).B / rhoI;
        if (G(cap) <= 0) return cap;                                         // tout le continent en un sous-pas
        let lo = 0, hi = cap;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (G(m) < 0) lo = m; else hi = m; }
        return lo;
    }

    /**
     * Calottes de l'état courant. T_glob [K] et T₂ [K] : profil méridien du bilan de North (T(x) = T̄ + T₂ P₂(x)) ; saisons = { cle:
     * { terre: { a1, d1, r2, i2 } } } cycles annuels des terres de chaque bande [K, rad] (physics/meridien.js) ; absorbe = { pol, mid, trop } →
     * { neige, glace } part de l'insolation absorbée au sol par une surface qui fond (physics/meridien.js). depart : { cle: a } et
     * socle : { cle: [Δz aux nœuds, km] } altitude du socle moins celle de son équilibre d'Airy sous la calotte a (négatif : resté
     * plus bas, la calotte ayant pesé plus) — état d'où l'on part (DATA['🗻']['🍰🗻🧊'] et ['🔺📏🗻🧊'], portés d'un
     * clic à l'autre) ; dureeAns : temps écoulé depuis cet état [an] (0 : l'état lui-même).
     * Calotte et socle avancent ENSEMBLE, en sous-pas de τ_b (le plus court des deux temps) : volume de la calotte par la
     * conservation de la masse, dV/dt = a A_bande B̄(a, socle) / ρ_i, V(a) = a A_bande H̄(a) au profil de Nye (Heun : taux au départ
     * et à l'état prédit, calotte ET socle) ; socle relaxé vers l'équilibre d'Airy d'une charge qui varie linéairement sur le
     * sous-pas (solution exacte de dd/dt = (L − d)/τ_b). Arrêt quand plus rien ne se verrait d'ici la fin du clic : écart du socle
     * et épaisseur moyenne gagnée ou perdue au rythme du dernier sous-pas, tous deux sous la tolérance du point fixe méridien
     * ramenée en altitude, MERIDIEN.TOLERANCE_K / Γ ; la calotte garde alors cet état, le socle relaxe exactement sous cette charge.
     * Seuls les MEMOIRE_ANS derniers ans d'un clic sont intégrés ; avant, raccord vers l'équilibre (❔).
     * aEq : équilibre à socle d'Airy (cible à long terme) ; tau : temps de renouvellement au départ (raccord des clics longs).
     * Renvoie { cle: { a, aEq, H, z, accumulation, fonte, Ts, tau, marge, socle, tauSocle, sousPas, ecart_m } } et parZone.
     */
    function calculer(T_glob, T2, saisons, absorbe, ageMa, EPOCH, depart, socle, dureeAns) {
        if (!(dureeAns >= 0)) throw new Error('[CALOTTES] durée ' + dureeAns + ' an : l\'état des calottes est daté APRÈS la date courante (clic frise oublié ?)');
        const geo = geographie(ageMa, EPOCH);
        // P − E [kg m⁻² an⁻¹] à x = sin |φ| (en-tête) : humidité de surface du modèle (jauge SUBTIL H2O_SURFACE_RH_01), q* de l'air de
        // l'époque (M_H₂O / M_air), pression et gravité de l'époque ; dérivées centrées en x.
        const D = window.DATA, ps = D['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA, gr = D['📅']['🍎'], rayon = D['📜']['📐'] * 1000;
        const eps = window.CONST.M_H2O / D['🫧']['🧪'], HR = D['🎚️'].H2O.H2O_SURFACE_RH_01, dx = 1e-4;
        const q = (x) => { const e = window.PHYS.pSatEau(T_glob + T2 * (3 * x * x - 1) / 2); return HR * eps * e / (ps - (1 - eps) * e); };
        const Fq = (x) => -2 * Math.PI * ps / gr * K.D_HUMIDE * (1 - x * x) * (1 - Math.exp(-x * x / (K.SIGMA_HADLEY * K.SIGMA_HADLEY)))
            * (q(x + dx) - q(x - dx)) / (2 * dx);                                // [kg/s] vers le pôle
        // Anomalie d'insolation [J/m²] reçue pendant chaque nœud de l'année (jours depuis l'équinoxe de printemps), par latitude
        // entière (la résolution de ORBITE.sommeAnomalie).
        const anomalie = window.ORBITE.anomalie(ageMa * 1e6), hNoeud = window.ORBITE.JOURS_AN / K.NOEUDS, noeuds = new Map();
        const c = {
            T_glob: T_glob, T2: T2,
            Gamma: window.CONFIG_COMPUTE.troposphericLapseRateKPerM,
            PmoinsE: (x) => -(Fq(x + dx) - Fq(x - dx)) / (2 * dx) / (2 * Math.PI * rayon * rayon) * window.ORBITE.JOURS_AN * window.CONV.SECONDS_PER_DAY,
            anomalieNoeuds: (latDeg) => {
                const l = Math.round(latDeg);
                if (!noeuds.has(l)) {
                    const L = new Float64Array(K.NOEUDS);
                    for (let k = 0; k < K.NOEUDS; k++) L[k] = window.ORBITE.sommeAnomalie(anomalie, l, k * hNoeud, (k + 1) * hNoeud);
                    noeuds.set(l, L);
                }
                return noeuds.get(l);
            },
            echelle: window.DATA['☀️']['🔋☀️'] / window.COMPUTE.goughLuminosity(0)     // Soleil de l'époque / Soleil actuel
        };
        const rhoI = window.EARTH.NUAGES.RHO_GLACE;
        const an = window.ORBITE.JOURS_AN * window.CONV.SECONDS_PER_DAY;          // [s]
        const tolZ = window.MERIDIEN.TOLERANCE_K / c.Gamma;                       // [m]
        const res = {}, parZone = { pol: 0, mid: 0, trop: 0 };
        for (const b of BANDES) {
            const gb = geo[b.cle], a0 = Math.min(depart[b.cle], gb.continent);
            const ab = absorbe[b.zone], cyc = saisons[b.cle].terre;
            const aEq = equilibre(a0, b, gb, cyc, ab, c, airy());
            const mbEq = bilanCalotte(aEq, b, gb, cyc, ab, c, airy());
            let tau;
            if (a0 > 0) {
                const mb0 = bilanCalotte(a0, b, gb, cyc, ab, c, airy());
                tau = rhoI * mb0.H / Math.max(mb0.accumulation, mb0.fonte);
            } else if (aEq > 0) {
                tau = rhoI * mbEq.H / mbEq.accumulation;
            } else {
                tau = Infinity;                                  // pas de glace, pas d'équilibre englacé : rien ne bouge
            }
            // Temps de rebond du demi-espace visqueux [an], τ_b = 4π η / (ρ_m g λ) ; λ = 2 × largeur de la charge : la calotte qui
            // couvre la terre de sa bande, W depuis son partage des eaux, 2W (son diamètre) quand celui-ci est au pôle. Bande sans
            // terre : λ = 0, τ_b infini, rien ne relaxe.
            const gT = geometrie(gb.continent, b, gb);
            const tauB = 4 * Math.PI * K.VISCOSITE_MANTEAU / (K.RHO_MANTEAU * gr * 2 * gT.W * (gT.xb === 1 ? 2 : 1)) / an;
            // Clic plus long que MEMOIRE_ANS : sa part ancienne mène la calotte vers l'équilibre au temps tau et éteint l'écart du
            // socle en τ_b (❔ raccord : au bout de plusieurs tau c'est l'équilibre, et le coût reste borné) ; la fin est intégrée.
            const ancien = Math.max(0, dureeAns - K.MEMOIRE_ANS), rB = Math.exp(-ancien / tauB);
            let a = a0 + (aEq - a0) * (1 - Math.exp(-ancien / tau)), g = geometrie(a, b, gb), L = chargeNoeuds(b, g);
            let e = socle[b.cle].map((v) => -1000 * v * rB);                // [m] écart à l'équilibre d'Airy de la calotte courante (+ : plus bas)
            let d = e.map((v, i) => L[i] + v);                               // [m] enfoncement aux nœuds, positif vers le bas
            // Socle au bout de h années sous une charge qui passe linéairement de L (calotte courante) à celle de aN :
            // solution exacte de dd/dt = (L(t) − d)/τ_b, d(h) = L_N + (d − L) e^(−x) − (L_N − L)(1 − e^(−x))/x, x = h/τ_b.
            const socleApres = (aN, h) => {
                const gN = geometrie(aN, b, gb), LN = chargeNoeuds(b, gN);
                const x = h / tauB, ex = Math.exp(-x), ph = x === 0 ? 1 : -Math.expm1(-x) / x;   // (1 − e^(−x))/x, limite 1 en 0
                const dN = d.map((v, i) => LN[i] + (v - L[i]) * ex - (LN[i] - L[i]) * ph);
                return { a: aN, g: gN, L: LN, d: dN, e: dN.map((v, i) => v - LN[i]) };
            };
            // Conservation de la masse en Heun (ordre 2) : taux de volume au départ, puis à l'état prédit (calotte ET socle).
            const A = 2 * Math.PI * rayon * rayon * (b.x1 - b.x0), Vcap = volume(gb.continent, b, gb);
            const taux = (ak, gk, ek) => ak * A * bilanCalotte(ak, b, gb, cyc, ab, c, fige(b, gk, ek)).B / rhoI;   // [m³/an]
            const aireV = (V) => V >= Vcap ? gb.continent : aireDe(V, b, gb);     // V ≤ 0 : aireDe rend 0, la calotte a fondu
            const avancer = (h) => {
                if (a === 0) return socleApres(naissance(b, gb, cyc, ab, c, fige(b, g, e), h, A), h);
                const V0 = volume(a, b, gb), r1 = taux(a, g, e);
                const p = socleApres(aireV(V0 + h * r1), h);
                return socleApres(aireV(V0 + h * (r1 + taux(p.a, p.g, p.e)) / 2), h);
            };
            let t = ancien, n = 0;
            while (t < dureeAns) {
                const h = Math.min(tauB, dureeAns - t);
                const s = avancer(h);
                // Volume gagné ou perdu d'ici la fin du clic au rythme de ce sous-pas, contre la tolérance étalée sur la calotte [m³].
                const bouge = Math.abs(volume(s.a, b, gb) - volume(a, b, gb)) / h * (dureeAns - t - h) > tolZ * A * Math.max(a, s.a);
                const ecart = Math.max(...s.e.map(Math.abs));
                a = s.a; g = s.g; L = s.L; d = s.d; e = s.e; t += h; n++;
                if (!bouge && ecart < tolZ) {
                    // Plus rien ne bouge : la calotte garde cet état, le socle finit de relaxer sous une charge fixe (exact).
                    const r = Math.exp(-(dureeAns - t) / tauB);
                    e = e.map((v) => v * r);
                    break;
                }
            }
            res[b.cle] = { a: a, aEq: aEq, H: mbEq.H, z: mbEq.z, accumulation: mbEq.accumulation, fonte: mbEq.fonte, Ts: mbEq.Ts, tau: tau,
                marge: mbEq.marge, socle: e.map((v) => -v / 1000), tauSocle: tauB, sousPas: n, ecart_m: Math.max(...e.map(Math.abs)) };
            parZone[b.zone] += a / 2;                            // deux hémisphères de même aire
        }
        res.parZone = parZone;
        return res;
    }

    /** Socle à l'équilibre d'Airy sous les calottes portées : écart nul à tous les nœuds de chaque bande. */
    function socleEquilibre() {
        const out = {};
        for (const b of BANDES) out[b.cle] = b.noeuds.map(() => 0);
        return out;
    }

    /** Clic sur la frise : l'état des calottes est celui de la CONFIG de l'époque (part de chaque bande sous calotte à ▶),
     *  daté de ▶, socle à l'équilibre sous elles. Une part de 1 = toute la bande : le continent de la bande la plafonne. */
    function depuisConfig(DATA) {
        const EPOCH = window.TIMELINE[DATA['📜']['👉']];
        const C = EPOCH['🗻']['🍰🗻🧊'], etat = {};
        for (const b of BANDES) {
            if (!(C[b.cle] >= 0 && C[b.cle] <= 1)) throw new Error('[CALOTTES] ' + EPOCH['📅'] + " : 🗻.🍰🗻🧊." + b.cle + ' = ' + C[b.cle] + ' (part de bande attendue dans [0, 1])');
            etat[b.cle] = C[b.cle];
        }
        DATA['🗻']['🍰🗻🧊'] = etat;
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageDe(EPOCH, EPOCH['▶']);
        DATA['🗻']['🔺📏🗻🧊'] = socleEquilibre();
    }

    /** Fin de convergence : le résultat du dernier pas (🧮🍰🗻🧊, 🧮🔺📏🗻🧊) devient l'état porté, daté de maintenant. */
    function engager(DATA) {
        for (const b of BANDES) {
            DATA['🗻']['🍰🗻🧊'][b.cle] = DATA['🗻']['🧮🍰🗻🧊'][b.cle];
            DATA['🗻']['🔺📏🗻🧊'][b.cle] = DATA['🗻']['🧮🔺📏🗻🧊'][b.cle];
        }
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageCourant(DATA);
    }

    window.CALOTTES = { K: K, BANDES: BANDES, geographie: geographie, geometrie: geometrie, bilanPoint: bilanPoint, bilanCalotte: bilanCalotte,
        calculer: calculer, depuisConfig: depuisConfig, engager: engager, socleEquilibre: socleEquilibre };
})();
