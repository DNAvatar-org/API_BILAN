// File: API_BILAN/physics/saisons.js - Boîtes terre et mer de chaque bande de latitude : moyenne annuelle et cycle annuel
// Desc: Je calcule la température de surface de la terre et de la mer de chaque bande (zone du bilan méridien × hémisphère) :
//       moyenne annuelle ET cycle annuel, au lieu de poser des amplitudes. C'est le bilan d'énergie diffusif de North, Cahalan &
//       Coakley 1981 (Rev. Geophys. Space Phys. 19:91, éq. 54–58), avec trois boîtes par bande — sa calotte, sa terre libre et sa
//       mer libre — couplées par l'air qui passe de l'une à l'autre, résolu harmonique par harmonique (n = 0 annuel moyen, n = 1
//       annuel, n = 2 semi-annuel) :
//
//           Z_n T̂_n = F_n,     T(t) = T_boîte + Im[T̂₁ e^{iωt}] + Re[T̂₂ e^{2iωt}],     t compté depuis l'équinoxe de printemps
//
//         · forçage : harmoniques de l'insolation journalière moyennée sur la bande, À LA DATE (orbite La2004 de physics/orbite.js :
//           obliquité, excentricité et précession — le terme en e cos(λ − ϖ) compris), sur le calendrier de Kepler de 73 pas
//           depuis l'équinoxe ; × co-albédo de la COLONNE de la boîte (calotte, terre libre ou mer libre, physics/meridien.js) × Soleil
//           de l'époque.
//           Insolation de la date = insolation de l'orbite de 1950 (ORBITE.REFERENCE) + écart d'ORBITE à 1950 ; hors de
//           la solution (avant −51 Ma) : orbite circulaire à l'obliquité de l'époque (❔ moyenne sur une précession inconnue) ;
//         · moyenne annuelle (n = 0) : la zone du bilan méridien (T̄ + T₂ ⟨P₂⟩), plus l'écart de la bande à sa zone — mode P₁ du
//           même bilan diffusif, B + 2D, forcé par l'écart du co-albédo de la bande à celui de la zone (les deux hémisphères n'ont
//           pas la même surface) —, plus l'écart de chaque boîte dans la bande, forcé par l'écart de son co-albédo à celui de la bande
//           (somme nulle sur la bande) ;
//         · impédance de la terre : B + n(n+1) D + i nω C_air + e_sol √(i nω) — rayonnement et diffusion méridienne (B, D de
//           North 1981, MERIDIEN.NORTH1981), air couplé à la surface, chaleur conduite dans le sol semi-infini (effusivité e_sol) ;
//           C_air = l'atmosphère de 1 m d'eau du jeu de McKinnon et al. 2013 (Table 1 : celle qu'advecte leur u, sur leur couche de
//           mélange), soit la part K.PART_AIR de la colonne c_p p/g de l'époque ;
//         · impédance de la mer : part libre g' = 1 − g, couche de mélange B + n(n+1) D + i nω (C_eau + C_air) ; part gelée g,
//           glace B + n(n+1) D + i nω C_air + k_i q coth(q h_i), dalle sur l'eau à son point de gel (équation de la chaleur,
//           Carslaw & Jaeger 1959), q = √(i nω/κ_i), épaisseur de Stefan h_i = √(2 k_i FDD / (ρ_i L_f)), g et les degrés-jours
//           de gel FDD tirés du cycle de la mer elle-même (plus petite racine, balayage puis dichotomie) ;
//         · couplage terre–mer : ν = u C_air / (2π R cos φ), l'air traverse la bande en un temps 2π R cos φ / u et y
//           échange sa chaleur (réduction à deux boîtes de McKinnon, Stine & Huybers 2013, éq. 3, à leurs u, C_a et C_o) : ν/p_L par
//           m² de terre libre, ν/p_M par m² de mer libre ;
//         · CALOTTE (MERIDIEN.surfacesBandes : sa part p_C de la bande, terre émergée et plateau) : l'air de la bande hors calotte
//           (terre libre et mer libre au prorata de leurs aires) la traverse sur sa corde moyenne πR/2 (R : rayon de son dôme, √(p_C
//           A_bande/π)) et y échange sa chaleur, le même raisonnement que ν à l'échelle de la calotte : κ = 2 u C_air / (π R) par m²
//           de calotte ; il en rend l'écart à l'air hors calotte, κ' = κ p_C/(p_L + p_M) par m² de terre libre ou de mer. L'albédo
//           d'une calotte refroidit donc d'abord son propre air, et l'air de la bande par ce qu'il en emporte ; une petite calotte
//           (κ grand) a l'air de la bande, une grande le sien ;
//         · terre de la bande : la terre ÉMERGÉE de PALEOGEO à la date (CALOTTES.parts), moins la calotte qui la couvre : la terre
//           libre ; la mer libre est le reste ;
//         · TERRE DE CHAQUE LATITUDE (latitudes, terreDe) : la part de terre f de la cellule en x du point (la terre des tranches de
//           la carte qu'elle recouvre, au prorata de l'aire : Σ f Δx = la terre de la bande) règle son couplage à la mer de la bande — l'air qui fait le tour de la latitude, en 2π R cos φ / u, passe la part f de son trajet sur la terre (McKinnon et
//           al. 2013 à la part de terre et au cercle de la latitude) : f Z_n T + ν_φ (T − M_n) = f F_n ; les îles d'une mer gelée ont
//           l'été de la mer, l'intérieur d'un continent le sien. Sens unique : la mer de la bande échange avec la terre de la bande ;
//         · TEMPÉRATURE D'UN POINT de latitude x = sin |φ| (temperaturePoint, la seule) : sa boîte plus le profil méridien dans la
//           bande, T₂ (P₂(x) − ⟨P₂⟩_zone), au cycle de sa boîte (annuel et semi-annuel) ; ARC GELÉ d'un point (arc) : ses nœuds de
//           l'année (ceux du bilan des calottes) sous le seuil de gel, interpolés linéairement entre eux, et ses degrés-jours de gel ;
//         · glace de mer : la mer de chaque latitude de la bande (N_X points) gèle sous 271,15 K ; g = part de l'année gelée,
//           moyenne des latitudes, h = épaisseur de Stefan de chaque latitude moyennée sur la glace présente ; la SURFACE de la
//           glace a son propre cycle, celui de la dalle seule (la mer toute gelée, g = 1, à l'épaisseur h) : sa fonte.
//       LU : par les calottes (physics/calottes.js : température d'un point de calotte = temperaturePoint de la boîte calotte de sa
//       bande, celle de sa marge et d'un sol nu = temperaturePoint de la boîte terre libre, cycle à la date de chaque sous-pas ; ⚠️ les
//       boîtes de la bande, pas encore la terre de la latitude de la cellule, terreDe)
//       et par la glace saisonnière (EARTH.glaceSaisonniere : arcs gelés de la terre et de la mer de chaque latitude, la terre pesant
//       par sa part de terre ; la part gelée g de la mer est la seule, pour l'aire, l'albédo et la masse de glace de mer du partage de
//       l'eau, h2o/calculations_h2o.js).
//       Contrôle (pas une entrée) : premier harmonique des terres mesuré (University of Delaware 1981–2010 ; ❔ valeurs sans script
//       de relevé, version des données non relevée).
//       Approximations DÉCLARÉES : ⚠️ l'air de la terre libre traverse le continent (calotte comprise) sur la distance de la terre
//       libre à la côte que donne la carte (PALEOGEO.r_libre : le long de la latitude, la calotte sur la terre la plus froide
//       d'abord) ; trois boîtes par bande, la terre de chaque latitude couplée à leur mer (⚠️ ν réduit à une traversée :
//       de la bande, à son milieu, et de chaque latitude pour sa terre ; ⚠️ part de terre des tranches de 5° que recouvre la cellule
//       du point, uniforme en x dans chaque tranche, sans longitude : un continent et un archipel de même part ont le même été) ; ⚠️ n = 2 pour le mode
//       semi-annuel ; co-albédo de chaque boîte constant sur l'année ; écart de la bande à sa zone tronqué au mode P₁ ; glace de mer
//       pondérée par sa part de l'année g, au cycle de la fin du clic ; ⚠️ une seule dalle de glace par bande, à l'épaisseur
//       moyenne de ses latitudes gelées ; ⚠️ mesures posées faute d'équation : couche de mélange, vitesse de l'air et part de la
//       colonne d'air qu'elle advecte, effusivité du sol. Calendrier de Kepler et insolation d'une orbite : ceux de physics/orbite.js.
// Version 2.9.0
// - v2.9.0 (2026-11-01): terre libre ↔ mer à la distance de la terre libre à la côte (PALEOGEO.r_libre), au lieu du ❔ continental.
// - v2.8.0 (2026-10-31): terre libre ↔ mer à la traversée du continent (calotte + terre libre), ❔ sans longitude.
// - v2.7.0 (2026-10-31): trois boîtes par bande, calotte, terre libre et mer libre ; la calotte échange avec l'air qui la traverse.
// - v2.6.1 (2026-10-31): terre d'un point = celle des tranches que recouvre sa cellule en x, au prorata de l'aire (Σ f Δx = terre).
// - v2.6.0 (2026-10-30): terre de chaque latitude couplée à la mer de la bande à la part de terre de sa latitude (latitudes, terreDe) ;
//   arcs gelés des terres à son cycle, pesant par sa part de terre.
// Date: [October 31, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        CP_EAU_MER: 3991.87,       // [J/(kg·K)] c_p⁰ de l'eau de mer (TEOS-10, IOC et al. 2010)
        H_MELANGE_M: 75,           // [m] ❔ couche de mélange de l'océan, paramètre posé du modèle idéalisé de McKinnon et al. 2013
        VENT_M_S: 6.1,             // [m/s] ⚠️ vitesse de traversée des masses d'air, rétrotrajectoires HYSPLIT à 45–50° N
                                   //       (McKinnon et al. 2013)
        PART_AIR: 0.403,           // [-] part de la colonne d'air couplée à la surface et advectée à VENT_M_S : l'atmosphère de 1 m
                                   //     d'eau, 4,18e6 J m⁻² K⁻¹, du jeu de McKinnon et al. 2013 (Table 1, avec u et la couche de
                                   //     mélange), rapportée à la colonne de 1 atm, c_p p₀/g = 1005 × 101 325 / 9,81 = 1,038e7 J m⁻² K⁻¹ ;
                                   //     ⚠️ la même part de la colonne à toute époque
        EFFUSIVITE_SOL: 1500,      // [J m⁻² K⁻¹ s^-½] ⚠️ effusivité √(kρc) d'un sol minéral : ordre de grandeur, sans source
        GLACE_MAX: 200,            // évaluations du point fixe de l'épaisseur de la glace de mer : au-delà, crash — numérique
        GLACE_SIMPLE: 8,           // itérations simples de ce point fixe avant l'encadrement (pente proche de 1) — numérique
        GLACE_TOL: 1e-7,           // [-] précision sur la part gelée de l'année g, et résidu relatif sur l'épaisseur h — numérique
        GLACE_BALAYAGE: 20,        // pas du balayage de g ∈ [0, 1] avant la dichotomie — numérique
        N_X: 10,                   // latitudes de la bande, uniformes en x = sin φ, du forçage — numérique
        CACHE_LIGNES: 400          // lignes de la table La2004 gardées en cache (comme ORBITE) — numérique
    };
    const DEG = Math.PI / 180;

    // Nombres complexes [re, im]
    const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

    /** Date du forçage pour un âge [années avant 2025] : les deux lignes de la table La2004 qui l'encadrent (ORBITE.encadrement)
     *  et hors = date hors de la solution (avant −51 Ma : orbite circulaire à l'obliquité de l'époque, reference). */
    const date = (age) => Object.assign(window.ORBITE.encadrement(age), { hors: !window.ORBITE.valide(age) });

    /** Soleil de l'époque rapporté au Soleil actuel (luminosités, compute.js et CONST.L_SOLEIL_W) : l'insolation d'astronomie.js est
     *  celle du Soleil actuel. */
    const soleil = () => window.DATA['☀️']['🔋☀️'] / window.CONST.L_SOLEIL_W;

    const _circulaires = new Map();
    /**
     * Insolation de l'orbite de référence, en sommes CUMULÉES par pas à la latitude entière demandée — la forme des lignes
     * d'anomalie d'ORBITE ({ ligne(lat) }, lue par ORBITE.sommeAnomalie). Dans la solution La2004 : l'orbite de 1950, celle dont
     * ORBITE donne l'écart (ORBITE.REFERENCE) ; hors de la solution (o.hors) : orbite circulaire à l'obliquité de l'époque
     * (ORBITE.insolationCumulee) — aucune phase de précession n'y est connue, et la moyenne sur la précession efface les termes en
     * e cos(λ − ϖ) (❔ termes en e² négligés ; l'orbite de 1950, périhélie en janvier, donnerait un été austral plus fort à toutes
     * les époques anciennes).
     */
    function reference(o) {
        if (!o.hors) return window.ORBITE.REFERENCE;
        const eps = window.DATA['📜']['⚾'] * DEG, cle = eps.toFixed(8);
        if (!_circulaires.has(cle)) _circulaires.set(cle, window.ORBITE.insolationCumulee({ obliquite: eps, excentricite: 0, varpi: 0 }));
        return _circulaires.get(cle);
    }

    /** Points d'une bande : N_X points uniformes en x = sin |φ| (moyenne de bande = moyenne de surface), { x, lat } ; lat = latitude
     *  entière [°] (la résolution d'ORBITE), du signe de l'hémisphère. */
    const points = (b) => Array.from({ length: K.N_X }, (_, i) => {
        const x = b.x0 + (b.x1 - b.x0) * (i + 0.5) / K.N_X;
        return { x: x, lat: b.h * Math.round(Math.asin(x) / DEG) };
    });

    /**
     * [m²/m²] Part de terre émergée de chaque point de la bande b (SAISONS.points). Un point représente sa cellule en x = sin |φ|,
     * [x_i, x_i + Δx], Δx = (x1 − x0)/N_X, et reçoit la terre des tranches de latitude de la carte qu'elle recouvre, au prorata de
     * l'aire (CALOTTES.geographie : PALEOGEO.tranches tranches d'égale largeur en latitude, cellules de terre émergée — classe de
     * socle au-dessus de 0 m, la règle de CALOTTES ; la terre d'une tranche, uniforme en x sur la tranche) :
     *   f_i = [Λ(x_i + Δx) − Λ(x_i)] / Δx,   Λ(x) = terre de la bande entre x0 et x [part de la bande × (x1 − x0)],
     * d'où Σ f_i Δx = Λ(x1) = E (x1 − x0) : la moyenne des points est la terre E de la bande. Hors de la carte (avant son premier âge,
     * CALOTTES.geographie pose toute la terre au milieu de la bande), la terre de la bande partout.
     */
    function terreLatitudes(b, gb, E) {
        const G = window.PALEOGEO, nT = G.tranches, nK = G.socle_bornes_m.length + 1, DEG = Math.PI / 180;
        if (window.INTERIEUR.ageCourant() / 1e6 > G.ages_Ma[G.ages_Ma.length - 1]) return points(b).map(() => E);
        const emergee = (k) => k > 0 && G.socle_bornes_m[k - 1] >= 0;   // classe de socle au-dessus de 0 m (la règle de CALOTTES)
        const l0 = Math.asin(b.x0) / DEG, dl = (Math.asin(b.x1) / DEG - l0) / nT;
        const bord = Array.from({ length: nT + 1 }, (_, j) => Math.sin((l0 + j * dl) * DEG));   // limites des tranches en x
        // Λ aux limites des tranches (cumul) et densité de terre en x de chaque tranche (sa part de terre).
        const cumul = [0], densite = [];
        for (let j = 0; j < nT; j++) {
            let e = 0;
            for (let k = 0; k < nK; k++) if (emergee(k)) e += gb.aire[j * nK + k];
            cumul.push(cumul[j] + e * (b.x1 - b.x0));
            densite.push(e * (b.x1 - b.x0) / (bord[j + 1] - bord[j]));
        }
        const Lambda = (x) => {   // x dans la tranche j, la dernière dont la limite basse est sous x (x1 : la dernière tranche)
            let j = 0;
            while (j < nT - 1 && bord[j + 1] <= x) j++;
            return cumul[j] + densite[j] * (x - bord[j]);
        };
        const dx = (b.x1 - b.x0) / K.N_X;
        return points(b).map((_, i) => (Lambda(b.x0 + (i + 1) * dx) - Lambda(b.x0 + i * dx)) / dx);
    }

    /** [K] Température annuelle d'un point de latitude x = sin |φ| de la bande b, sur une surface de moyenne annuelle Tboite (boîte
     *  terre ou mer de la bande) : Tboite + T₂ (P₂(x) − ⟨P₂⟩_zone), le profil méridien du bilan de North dans la bande (sa moyenne de
     *  bande est nulle), T₂ = DATA['🧮']['🌡️🎱']. La seule température d'un point : glace saisonnière (arcs) et calottes. */
    const temperaturePoint = (Tboite, b, x) => Tboite + window.DATA['🧮']['🌡️🎱'] * (window.MERIDIEN.P2(x) - window.MERIDIEN.P2_MOYEN[b.zone]);

    const _trig = new Map();
    /** sin θ_k, cos θ_k, sin 2θ_k, cos 2θ_k aux n nœuds de l'année, θ_k = 2π (k + ½)/n depuis l'équinoxe de printemps. */
    function trig(n) {
        if (!_trig.has(n)) {
            const th = Array.from({ length: n }, (_, k) => 2 * Math.PI * (k + 0.5) / n);
            _trig.set(n, { s: th.map(Math.sin), c: th.map(Math.cos), s2: th.map((t) => Math.sin(2 * t)), c2: th.map((t) => Math.cos(2 * t)) });
        }
        return _trig.get(n);
    }
    /** [K] Température aux nœuds de l'année (T, tableau de n = T.length nœuds, θ_k = 2π (k + ½)/n) d'une surface de moyenne annuelle
     *  Tp au cycle cyc = { a1, d1, r2, i2 } : Tp + a1 sin(θ − d1) + r2 cos 2θ − i2 sin 2θ. */
    function temperaturesNoeuds(Tp, cyc, T) {
        const tr = trig(T.length), ca = cyc.a1 * Math.cos(cyc.d1), sa = cyc.a1 * Math.sin(cyc.d1);   // a1 sin(θ − d1) = ca sin θ − sa cos θ
        for (let k = 0; k < T.length; k++) T[k] = Tp + ca * tr.s[k] - sa * tr.c[k] + cyc.r2 * tr.c2[k] - cyc.i2 * tr.s2[k];
        return T;
    }
    /** Part gelée (sous 0) d'un segment où l'écart au seuil va linéairement de a à b ; écart moyen sous le seuil sur cette part [K]. */
    const gele = (a, b) => (a === b ? (a < 0 ? 1 : 0) : Math.min(1, Math.max(0, a < b ? -a / (b - a) : b / (b - a))));
    const froid = (a, b) => -(Math.min(a, b) + Math.min(Math.max(a, b), 0)) / 2;
    /** [m] Épaisseur de Stefan d'une glace de mer après fdd [°C·jour] degrés-jours de gel, h = √(2 k_i FDD / (ρ_i L_f)) (Stefan 1891 ;
     *  surface de la glace à la température de l'arc, eau dessous à son point de gel). La seule : épaisseur de la dalle (cycles), masse
     *  de glace à fondre l'été (EARTH.glaceSaisonniere). */
    const epaisseurStefan = (fdd) => Math.sqrt(2 * window.CONST.K_GLACE * fdd * window.CONV.SECONDS_PER_DAY / (window.CONST.RHO_GLACE * window.CONST.L_FUSION_GLACE));
    /**
     * Arc gelé d'un point de température annuelle Tp [K] au cycle cyc = { a1, d1, r2, i2 } (annuel et semi-annuel), sous le seuil Tf
     * [K] : T aux n = CALOTTES.K.NOEUDS nœuds de l'année (θ_k = 2π (k + ½)/n, les nœuds du bilan des calottes), écrite dans T, linéaire
     * entre deux nœuds ; f[k] = part gelée de l'intervalle du nœud k, [θ_k − π/n, θ_k + π/n]. Renvoie { t [-] part gelée de l'année,
     * fdd [°C·jour] degrés-jours de gel ∫ max(0, Tf − T) dt }. T et f : tableaux de travail de longueur n.
     */
    function arc(Tp, cyc, Tf, T, f) {
        const n = T.length, demi = window.CONST.AN_TROPIQUE_JOURS / (2 * n);   // [jour] demi-nœud
        temperaturesNoeuds(Tp, cyc, T);
        let t = 0, fdd = 0;
        for (let k = 0; k < n; k++) {
            const v = T[k] - Tf, a = (T[(k + n - 1) % n] - Tf + v) / 2, b = (v + T[(k + 1) % n] - Tf) / 2;   // écarts aux bords du nœud
            const pa = gele(a, v), pb = gele(v, b);
            f[k] = (pa + pb) / 2;
            t += f[k] / n;
            fdd += demi * (pa * froid(a, v) + pb * froid(v, b));
        }
        return { t: t, fdd: fdd };
    }
    /** Arc gelé gardé d'un point de la bande ({ x, lat }) : { x, lat, T, f, t, fdd } (arc, tableaux neufs). */
    const arcPoint = (p, Tp, cyc, Tf) => {
        const n = window.CALOTTES.K.NOEUDS, T = new Float64Array(n), f = new Float64Array(n);
        return Object.assign({ x: p.x, lat: p.lat, T: T, f: f }, arc(Tp, cyc, Tf, T, f));
    };

    /** Harmoniques { S0 [W/m²], F1, F2 [W/m², complexes] } de la moyenne de bande d'une série par pas, tirée de sommes cumulées P
     *  ({ ligne(lat) }) : f(θ) = S0 + Im[F1 e^{iθ}] + Re[F2 e^{2iθ}], θ = 2π (j + ½)/N_PAS. */
    function harmoniques(P) {
        const N = window.ORBITE.N_PAS, out = {};
        for (const b of window.CALOTTES.BANDES) {
            let S0 = 0, s1 = 0, c1 = 0, s2 = 0, c2 = 0;
            for (const p of points(b)) {
                const L = P.ligne(p.lat);
                for (let j = 0; j < N; j++) {
                    const f = L[j + 1] - L[j], th = 2 * Math.PI * (j + 0.5) / N;
                    S0 += f; s1 += f * Math.sin(th); c1 += f * Math.cos(th); s2 += f * Math.sin(2 * th); c2 += f * Math.cos(2 * th);
                }
            }
            const n = N * K.N_X;
            out[b.cle] = { S0: S0 / n, F1: [2 * s1 / n, 2 * c1 / n], F2: [2 * c2 / n, -2 * s2 / n] };
        }
        return out;
    }

    const _harmRef = new Map(), _harmLigne = new Map();
    /** Harmoniques de l'écart à 1950 de la ligne k de la table La2004 (zéro au-delà de la table), en cache borné. */
    function harmoniquesLigne(k) {
        if (_harmLigne.has(k)) { const v = _harmLigne.get(k); _harmLigne.delete(k); _harmLigne.set(k, v); return v; }
        const v = harmoniques(window.ORBITE.anomalieLigne(k));
        _harmLigne.set(k, v);
        if (_harmLigne.size > K.CACHE_LIGNES) _harmLigne.delete(_harmLigne.keys().next().value);
        return v;
    }

    /**
     * Forçage solaire de chaque bande à la date o = { k, w, hors } (ORBITE.encadrement, hors = date hors de la solution) :
     * { cle: { S0, F1, F2 } } [W/m², Soleil actuel] — référence + écart de la ligne k + w × (écart de la ligne k + 1 − celui de k).
     */
    function forcage(o) {
        const r = reference(o), cle = o.hors ? 'h' + window.DATA['📜']['⚾'].toFixed(8) : '1950';
        if (!_harmRef.has(cle)) _harmRef.set(cle, harmoniques(r));
        const R = _harmRef.get(cle), A0 = harmoniquesLigne(o.k), A1 = harmoniquesLigne(o.k + 1), w = o.w, out = {};
        const m = (a, b) => [(1 - w) * a[0] + w * b[0], (1 - w) * a[1] + w * b[1]];
        for (const b of window.CALOTTES.BANDES) {
            const x = R[b.cle], u = A0[b.cle], v = A1[b.cle];
            out[b.cle] = { S0: x.S0 + (1 - w) * u.S0 + w * v.S0, F1: add(x.F1, m(u.F1, v.F1)), F2: add(x.F2, m(u.F2, v.F2)) };
        }
        return out;
    }

    /** [W/m²] Moyenne, sur chacun des n nœuds égaux de l'année (depuis l'équinoxe de printemps), d'une série par pas donnée en
     *  sommes cumulées P ({ ligne(lat) } : référence ou écart d'une ligne d'ORBITE), à la latitude entière lat. */
    function sommesNoeuds(P, lat, n) {
        const h = window.CONST.AN_TROPIQUE_JOURS / n, s = h * window.CONV.SECONDS_PER_DAY, out = new Float64Array(n);
        for (let j = 0; j < n; j++) out[j] = window.ORBITE.sommeAnomalie(P, lat, j * h, (j + 1) * h) / s;
        return out;
    }
    /** [W/m²] Insolation moyenne (Soleil actuel) de chacun des n nœuds de l'année à la latitude entière lat, à la date o :
     *  référence + écarts des deux lignes de la table qui encadrent la date. */
    function noeuds(o, lat, n) {
        const R = sommesNoeuds(reference(o), lat, n), A0 = sommesNoeuds(window.ORBITE.anomalieLigne(o.k), lat, n);
        const A1 = sommesNoeuds(window.ORBITE.anomalieLigne(o.k + 1), lat, n);
        return R.map((v, j) => v + (1 - o.w) * A0[j] + o.w * A1[j]);
    }

    const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
    /**
     * Un harmonique des trois boîtes d'une bande — calotte C, terre libre L, mer libre M, parts p = { C, L, M } (p_A = p_L + p_M :
     * l'air hors calotte) — : impédances Z (calotte et terre libre) et ZM (mer ; null : mer fixe à son point de gel, T_M = 0), forçages
     * F = { C, L, M } [complexes, par W/m² d'insolation], échanges κ (calotte ↔ air hors calotte, par m² de calotte), κ' = κ p_C/p_A
     * (par m² hors calotte) et ν (terre libre ↔ mer, par m² de bande) :
     *   C : (Z + κ) T_C − κ (p_L T_L + p_M T_M)/p_A = F_C
     *   L : (Z + κ' + ν/p_L) T_L − κ' T_C − (ν/p_L) T_M = F_L       M : (Z_M + κ' + ν/p_M) T_M − κ' T_C − (ν/p_M) T_L = F_M
     * Une boîte sans aire n'a pas d'équation : la terre libre prend l'air de la mer et inversement, la calotte celui de l'air hors
     * calotte. Élimination de Gauss sur les boîtes présentes (trois au plus). Renvoie { calotte, terre, mer } [complexes].
     */
    function systeme(Z, ZM, F, p, kap, nu, rL) {
        // Terre libre ↔ mer : l'air traverse le continent (calotte comprise, p_C + p_L : la glace ne déplace pas la côte) sur la
        // distance de la terre libre à la côte, rL fois celle de la terre sans calotte (PALEOGEO.r_libre) ; la mer reçoit le même
        // flux, ν p_L/(E p_M).
        const E = (p.C + p.L) * rL, nL = p.L > 0 ? nu / E : 0, nM = p.L > 0 && p.M > 0 ? nu * p.L / (E * p.M) : 0;
        const pA = p.L + p.M, kp = p.C === 0 || pA === 0 ? 0 : kap * p.C / pA;
        const inc = ['C', 'L', 'M'].filter((k) => p[k] > 0 && (k !== 'M' || ZM !== null));
        const ligne = {
            C: () => ({ C: add(Z, [pA === 0 ? 0 : kap, 0]), L: [-kap * p.L / pA, 0], M: [-kap * p.M / pA, 0] }),
            L: () => ({ L: add(Z, [kp + (p.M > 0 ? nL : 0), 0]), C: [-kp, 0], M: [-nL, 0] }),
            M: () => ({ M: add(ZM, [kp + nM, 0]), C: [-kp, 0], L: [-nM, 0] })
        };
        const A = inc.map((k) => { const l = ligne[k](); return inc.map((c) => l[c]); }), y = inc.map((k) => F[k]), n = inc.length;
        for (let c = 0; c < n; c++) {
            for (let r = c + 1; r < n; r++) {
                const f = div(A[r][c], A[c][c]);
                for (let k = c; k < n; k++) A[r][k] = sub(A[r][k], mul(f, A[c][k]));
                y[r] = sub(y[r], mul(f, y[c]));
            }
        }
        const x = {};
        for (let r = n - 1; r >= 0; r--) {
            let v = y[r];
            for (let k = r + 1; k < n; k++) v = sub(v, mul(A[r][k], x[inc[k]]));
            x[inc[r]] = div(v, A[r][r]);
        }
        if (p.M > 0 && ZM === null) x.M = [0, 0];
        if (p.L === 0) x.L = x.M;
        if (p.M === 0) x.M = x.L;
        if (p.C === 0) x.C = [(p.L * x.L[0] + p.M * x.M[0]) / pA, (p.L * x.L[1] + p.M * x.M[1]) / pA];
        if (pA === 0) { x.L = x.C; x.M = x.C; }
        return { calotte: x.C, terre: x.L, mer: x.M };
    }

    /** Distance de la terre libre à la côte, rapportée à celle de la terre sans calotte, quand une calotte couvre la part f de la
     *  terre de la bande : PALEOGEO.r_libre aux parts PALEOGEO.fractions_libre, linéaire entre deux ; au-delà de la dernière part
     *  (0,95), sa valeur. */
    function distanceLibre(r, f) {
        const F = window.PALEOGEO.fractions_libre;
        let k = 0;
        while (k < F.length - 2 && F[k + 1] < f) k++;
        const t = Math.min(1, (f - F[k]) / (F[k + 1] - F[k]));
        return r[k] + t * (r[k + 1] - r[k]);
    }

    /** Cycle d'une surface : { a1 [K], d1 [rad] (retard sur le soleil), r2, i2 [K] (Re et Im de T̂₂) } ; T(θ) = T + a1 sin(θ − d1)
     *  + r2 cos 2θ − i2 sin 2θ, θ = 2π t / an depuis l'équinoxe de printemps. */
    const cycle = (T1, T2) => ({ a1: Math.hypot(T1[0], T1[1]), d1: -Math.atan2(T1[1], T1[0]), r2: T2[0], i2: T2[1] });
    /** Cycle d'une boîte ({ G1, G2 } : réponse par W/m² d'harmonique d'insolation) au forçage F de sa bande ({ F1, F2 }). */
    const cycleDe = (boite, F) => cycle(mul(boite.G1, F.F1), mul(boite.G2, F.F2));

    /**
     * Boîtes terre et mer de chaque bande (CALOTTES.BANDES) à l'état de DATA (T̄ = 🧮🌡️, écarts de zone MERIDIEN.ecarts ; terre
     * émergée de chaque bande, gravité et pression de l'époque à la date courante) :
     *   coA = { cle: { calotte, terre, mer } } co-albédos des colonnes d'un m² de calotte, de terre libre et de mer libre de chaque
     *   bande (physics/meridien.js, grandeur de travail de l'itération du bilan méridien) ; leurs parts de la bande :
     *   MERIDIEN.surfacesBandes (calottes du pas de la même itération).
     * Date du forçage de la moyenne annuelle et de la glace de mer : l'âge courant (fin du clic, date()).
     * Renvoie { cle: { calotte, terre, mer, glace, h_glace } }, calotte, terre (libre) et mer (libre) = { T [K] moyenne annuelle, G1, G2 [K/(W/m²), complexes]
     * réponse au forçage solaire de la bande, a1, d1, r2, i2 : cycle à cette date, arcs : arc gelé de chacun de ses points (arcPoint ;
     * terre sous CONST.T0_WATER, au cycle de la terre de sa latitude, avec son poids — sa part de terre ; mer sous
     * EARTH.T_FREEZE_SEAWATER_K) } ; terre.latitudes : la terre de la latitude de chaque point { x, poids, T, G1, G2 } ;
     * glace = part de l'année où la mer est gelée (moyenne de ses
     * latitudes), h_glace [m] épaisseur de Stefan moyenne de sa glace.
     */
    function cycles(coA) {
        const D = window.DATA, NCC = window.MERIDIEN.NORTH1981, dT = window.MERIDIEN.ecarts();
        const F = forcage(date(window.INTERIEUR.ageCourant())), sol = soleil(), P = window.CALOTTES.parts(), GEO = window.CALOTTES.geographie();
        const Cair = K.PART_AIR * window.CONST.CP_AIR * D['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA / D['📅']['🍎'];   // [J m⁻² K⁻¹] air couplé
        const Cmer = window.CONST.RHO_EAU_MER * K.CP_EAU_MER * K.H_MELANGE_M;                                            // [J m⁻² K⁻¹]
        const kI = window.CONST.K_GLACE;
        const eI = Math.sqrt(kI * window.CONST.RHO_GLACE * window.CONST.CP_GLACE);                            // effusivité de la glace
        const an = window.CONST.AN_TROPIQUE_JOURS, jour = window.CONV.SECONDS_PER_DAY;
        const omega = 2 * Math.PI / (an * jour);                                                               // [rad/s]
        const R = D['📜']['📐'] * 1000;
        // Moyenne annuelle : écart de chaque bande à sa zone, mode P₁ (B + 2D) forcé par l'écart du co-albédo de la bande (moyenne
        // de ses colonnes calotte, terre libre et mer libre) à celui de la zone (moyenne de ses deux bandes de même aire) ; f₁ = (3/2) ∫ δF x dx.
        const SB = window.MERIDIEN.surfacesBandes();
        const aB = {}, aZ = { pol: 0, mid: 0, trop: 0 };
        for (const b of window.CALOTTES.BANDES) {
            const s = SB[b.cle], c = coA[b.cle];
            aB[b.cle] = s.calotte * c.calotte + s.terre * c.terre + s.mer * c.mer;
            aZ[b.zone] += aB[b.cle] / 2;
        }
        let f1 = 0;
        for (const b of window.CALOTTES.BANDES) f1 += 1.5 * b.h * (aB[b.cle] - aZ[b.zone]) * sol * F[b.cle].S0 * (b.x1 * b.x1 - b.x0 * b.x0) / 2;
        const T1 = f1 / (NCC.B + 2 * NCC.D);
        const out = {};
        for (const b of window.CALOTTES.BANDES) {
            const fT = P[b.cle].emerge, Fb = F[b.cle], aC = coA[b.cle].calotte, aT = coA[b.cle].terre, aM = coA[b.cle].mer;
            const p = { C: SB[b.cle].calotte, L: SB[b.cle].terre, M: SB[b.cle].mer }, pA = p.L + p.M;
            const xm = (b.x0 + b.x1) / 2;
            const nu = K.VENT_M_S * Cair / (2 * Math.PI * R * Math.sqrt(1 - xm * xm));                       // [W m⁻² K⁻¹]
            // Calotte : κ = 2 u C_air / (π R) par m² de calotte, R rayon de son dôme ; κ' = κ p_C / p_A par m² hors calotte.
            const kap = p.C === 0 ? 0 : 2 * K.VENT_M_S * Cair / (Math.PI * Math.sqrt(p.C * window.CALOTTES.aireBande(b) / Math.PI));
            const kp = p.C === 0 || pA === 0 ? 0 : kap * p.C / pA;
            // Moyennes annuelles : zone + écart de la bande (P₁) + écarts des trois boîtes, de somme nulle sur la bande (systeme à n = 0,
            // impédance B) : calotte θ_C = (a_C − ā) S₀ / (B + κ/p_A), air hors calotte θ_A = −p_C θ_C / p_A, terre libre − mer libre
            // u = (a_T − a_M) S₀ / (B + κ' + ν/p_L + ν/p_M). Une bande sans terre libre ou sans mer libre n'a pas d'écart terre–mer ; sans
            // air (ν = κ = 0, ⚫) chaque boîte est à son équilibre radiatif.
            const Tbande = D['🧮']['🧮🌡️'] - dT[b.zone] + T1 * b.h * xm;
            const thC = p.C === 0 || pA === 0 ? 0 : (aC - aB[b.cle]) * sol * Fb.S0 / (NCC.B + kap / pA);
            const thA = pA === 0 ? 0 : -p.C * thC / pA;
            const rL = p.L > 0 ? distanceLibre(P[b.cle].rLibre, p.C / (p.C + p.L)) : 1;   // sans terre libre : sans objet
            const u = p.L === 0 || p.M === 0 ? 0 : (aT - aM) * sol * Fb.S0 / (NCC.B + kp + nu / ((p.C + p.L) * rL) + nu * p.L / ((p.C + p.L) * rL * p.M));
            const Tcal = Tbande + thC, Tterre = pA === 0 ? Tbande : Tbande + thA + p.M / pA * u, Tmer = pA === 0 ? Tbande : Tbande + thA - p.L / pA * u;
            const pts = points(b), Tf = window.EARTH.T_FREEZE_SEAWATER_K, TmerP = pts.map((q) => temperaturePoint(Tmer, b, q.x));
            // Un harmonique n : impédances de la calotte et de la terre libre (⚠️ la même) et de la mer, système des trois boîtes ;
            // réponse par W/m² d'insolation.
            const mode = (n, g, h) => {
                const w = n * omega, Dn = NCC.B + n * (n + 1) * NCC.D, r = Math.sqrt(w / 2);   // √(i w) = √(w/2) (1 + i)
                const ZT = [Dn + K.EFFUSIVITE_SOL * r, w * Cair + K.EFFUSIVITE_SOL * r];
                const libre = [Dn, w * (Cmer + Cair)];
                // Glace : dalle d'épaisseur h sur l'eau à son point de gel, flux / température de surface = k_i q coth(q h),
                // q = √(i nω / κ_i), κ_i = k_i/(ρ_i c_i) — k_i q = e_i √(i nω) ; q h = s (1 + i), s = h √(nω / 2κ_i).
                // Une mer jamais gelée n'a pas de glace (g = 0).
                const glace = () => {
                    const s = h * r * eI / kI, e2 = Math.exp(2 * s);
                    const Zg = mul([eI * r, eI * r], div([e2 * Math.cos(2 * s) + 1, e2 * Math.sin(2 * s)], [e2 * Math.cos(2 * s) - 1, e2 * Math.sin(2 * s)]));
                    return [(1 - g) * libre[0] + g * (Dn + Zg[0]), (1 - g) * libre[1] + g * (w * Cair + Zg[1])];
                };
                // Glace sans épaisseur (aucune latitude gelée) : dalle infiniment conductrice, la mer reste à son point de gel
                // (impédance infinie, ZM null) ; la calotte et la terre échangent avec une mer à température fixe.
                const ZM = g > 0 && h === 0 ? null : (g > 0 ? glace() : libre);
                return systeme(ZT, ZM, { C: [aC * sol, 0], L: [aT * sol, 0], M: [aM * sol, 0] }, p, kap, nu, rL);
            };
            // Glace de mer, latitude par latitude (points de la bande, temperaturePoint de la mer). À g donné, l'épaisseur h est le point
            // fixe de G : h → cycle de la mer (annuel et semi-annuel) → arc gelé de chaque latitude → épaisseur de Stefan de chacune,
            // h_i = √(2 k_i FDD_i / (ρ_i L_f)), moyennée sur la glace présente (poids t_i ; sans glace, pas d'épaisseur) ; g' = moyenne
            // des t_i. G est croissante (une glace plus épaisse isole moins la mer, dont le cycle se creuse) : l'itération simple, partie
            // de h₀, monte ou descend sans le dépasser jusqu'au premier point fixe dans le sens de son pas. Quand sa pente est proche de 1
            // (une latitude à peine gelée), ce même point est encadré (pas doublés dans ce sens ; G(0) ≥ 0 borne la descente) puis pris
            // par dichotomie. Puis g est la plus petite racine de r(g) = g'(g) − g, celle qu'atteint une mer partie sans glace :
            // balayage de [0, 1] jusqu'au premier changement de signe, puis dichotomie. (Une relaxation sur g oscille : une mer gelée a
            // l'impédance d'une terre, une mer libre celle de sa couche de mélange — la pente de g' dépasse −3.)
            const Tt = new Float64Array(window.CALOTTES.K.NOEUDS), ft = new Float64Array(window.CALOTTES.K.NOEUDS);   // tableaux de travail
            let n_eval = 0;
            const G = (g, h) => {
                if (++n_eval > K.GLACE_MAX) {
                    throw new Error('[SAISONS] ' + D['📅']['📅'] + ', ' + b.cle + ' : épaisseur de la glace de mer non convergée en ' + K.GLACE_MAX
                        + ' évaluations (g = ' + g + ', h = ' + h + ' m, mer ' + (Tmer - Tf).toFixed(3) + ' K au-dessus du gel)');
                }
                const m1 = mode(1, g, h), m2 = mode(2, g, h), cyc = cycle(mul(m1.mer, Fb.F1), mul(m2.mer, Fb.F2));
                let tt = 0, th = 0;
                for (const Tp of TmerP) {
                    const a = arc(Tp, cyc, Tf, Tt, ft);
                    tt += a.t; th += a.t * epaisseurStefan(a.fdd);
                }
                const hN = tt === 0 ? 0 : th / tt;
                return { h: h, d: hN - h, gN: tt / TmerP.length, m1: m1, m2: m2, cyc: cyc };
            };
            const fini = (a) => Math.abs(a.d) <= K.GLACE_TOL * Math.max(1, a.h + a.d);
            const etat = (g, h0) => {
                n_eval = 0;
                let a = G(g, h0);
                for (let it = 0; !fini(a); it++) {
                    if (it === K.GLACE_SIMPLE) {
                        const sens = Math.sign(a.d);
                        let pas = Math.abs(a.d), b2 = G(g, Math.max(0, a.h + 2 * sens * pas));
                        while (Math.sign(b2.d) === sens) { a = b2; pas *= 2; b2 = G(g, Math.max(0, a.h + 2 * sens * pas)); }
                        while (Math.abs(b2.h - a.h) > K.GLACE_TOL * Math.max(1, a.h)) {
                            const m = G(g, (a.h + b2.h) / 2);
                            if (Math.sign(m.d) === sens) a = m; else b2 = m;
                        }
                        return b2;
                    }
                    a = G(g, a.h + a.d);
                }
                return a;
            };
            // Mer sans glace d'abord (g = 0) ; son épaisseur amorce celle d'une mer en partie gelée.
            const s0 = etat(0, 0);
            let lo = 0, g = 0;
            if (s0.gN > 0) {
                let hi = 1;
                for (let k = 1; k <= K.GLACE_BALAYAGE; k++) {
                    const gk = k / K.GLACE_BALAYAGE;
                    if (etat(gk, s0.h).gN - gk <= 0) { hi = gk; break; }
                    lo = gk;
                }
                while (hi - lo > K.GLACE_TOL) { const m = (lo + hi) / 2; if (etat(m, s0.h).gN - m > 0) lo = m; else hi = m; }
                g = (lo + hi) / 2;
            }
            const st = etat(g, s0.h), m1 = st.m1, m2 = st.m2, h = st.h;
            const cT = cycle(mul(m1.terre, Fb.F1), mul(m2.terre, Fb.F2)), cC = cycle(mul(m1.calotte, Fb.F1), mul(m2.calotte, Fb.F2));
            // Terre de chaque latitude : sa part de terre f (terreLatitudes) règle son couplage à la mer de la bande — l'air qui fait le
            // tour de la latitude passe une part f de son trajet sur la terre, ν_φ = u C_air / (2π R cos φ) — ; elle reçoit aussi ce que
            // l'air emporte de la calotte, κ' :
            //   f (Z_n + κ') T − f κ' C_n + ν_φ (T − M_n) = f F_n (n = 1, 2 ; C_n, M_n la calotte et la mer de la bande),
            //   f B (T − T_bande) + f κ' (T − T_cal) + ν_φ (T − T_mer) = f (a_T − ā) S₀ (n = 0).
            // f = 0 : la terre de la latitude est la mer ; f = p_L partout : la terre libre de la bande. Sens unique : la mer et la calotte
            // de la bande échangent avec la terre libre de la bande (système à trois boîtes ci-dessus).
            // Poids de chaque latitude dans la terre de la bande : sa part de terre ; une bande toute terre ou toute mer, à poids égaux.
            const fL = fT === 0 || fT === 1 ? pts.map(() => 1) : terreLatitudes(b, GEO[b.cle], fT);
            const lat = (f, x) => {
                const nuL = K.VENT_M_S * Cair / (2 * Math.PI * R * Math.sqrt(1 - x * x));   // [W m⁻² K⁻¹] ν_φ
                const z = (n, mm) => {
                    const wn = n * omega, Dn = NCC.B + n * (n + 1) * NCC.D, r = Math.sqrt(wn / 2);
                    return div([f * aT * sol + nuL * mm.mer[0] + f * kp * mm.calotte[0], nuL * mm.mer[1] + f * kp * mm.calotte[1]],
                        [f * (Dn + K.EFFUSIVITE_SOL * r + kp) + nuL, f * (wn * Cair + K.EFFUSIVITE_SOL * r)]);
                };
                return fT === 0 || fT === 1 || p.L === 0 || p.M === 0 ? { T: Tterre, G1: m1.terre, G2: m2.terre }
                    : { T: (f * ((aT - aB[b.cle]) * sol * Fb.S0 + NCC.B * Tbande + kp * Tcal) + nuL * Tmer) / (f * (NCC.B + kp) + nuL), G1: z(1, m1), G2: z(2, m2) };
            };
            const terresLat = fL.map((f, i) => lat(f, pts[i].x));
            const terre = Object.assign({ T: Tterre, G1: m1.terre, G2: m2.terre, latitudes: terresLat.map((l, i) => Object.assign({ x: pts[i].x, poids: fL[i] }, l)),
                arcs: pts.map((p, i) => Object.assign(arcPoint(p, temperaturePoint(terresLat[i].T, b, p.x), cycleDe(terresLat[i], Fb), window.CONST.T0_WATER), { poids: fL[i] })) }, cT);
            // Surface de la glace de mer : la dalle de glace sur l'eau à son point de gel (impédance de la mer toute gelée, g = 1, à
            // l'épaisseur h), couplée à la terre — son propre cycle, sans la couche de mélange de la mer libre voisine ; lue pour la
            // fonte de la glace (EARTH.glaceSaisonniere), aux nœuds de chaque point (Tglace).
            const cG = cycle(mul(mode(1, 1, h).mer, Fb.F1), mul(mode(2, 1, h).mer, Fb.F2)), nN = window.CALOTTES.K.NOEUDS;
            const mer = Object.assign({ T: Tmer, G1: m1.mer, G2: m2.mer, cycleGlace: cG,
                arcs: pts.map((p, i) => Object.assign(arcPoint(p, TmerP[i], st.cyc, Tf),
                    { Tglace: temperaturesNoeuds(TmerP[i], cG, new Float64Array(nN)) })) }, st.cyc);
            out[b.cle] = { calotte: Object.assign({ T: Tcal, G1: m1.calotte, G2: m2.calotte }, cC), terre: terre, mer: mer, glace: g, h_glace: h };
        }
        return out;
    }

    /** Terre de la latitude x = sin |φ| de la bande ({ T, G1, G2 } : celle du point de la bande le plus proche, saisons[b].terre.latitudes). */
    const terreDe = (terre, b, x) => terre.latitudes[Math.floor((x - b.x0) / (b.x1 - b.x0) * K.N_X)];

    window.SAISONS = { K: K, date: date, terreDe: terreDe, soleil: soleil, reference: reference, forcage: forcage, sommesNoeuds: sommesNoeuds, noeuds: noeuds, cycleDe: cycleDe,
        points: points, temperaturePoint: temperaturePoint, temperaturesNoeuds: temperaturesNoeuds, arc: arc, arcPoint: arcPoint, epaisseurStefan: epaisseurStefan,
        cycles: cycles };
})();
