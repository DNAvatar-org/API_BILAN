// File: API_BILAN/physics/meridien.js - Bilan d'énergie méridien (North, Cahalan & Coakley 1981)
// Desc: Je calcule l'écart de température de chaque zone de latitude (tropiques 0–30°, moyennes latitudes 30–60°, pôles
//       60–90°) à la moyenne globale, au lieu de le poser par époque (ancien EPOCH['🥶']). C'est le modèle de bilan d'énergie
//       diffusif de North, Cahalan & Coakley 1981 (Rev. Geophys. Space Phys. 19:91), éq. 22 :
//
//           −d/dx [ D (1 − x²) dT/dx ] + A + B T(x) = I(x) a(x),        x = sin(latitude)
//
//       I(x) = insolation annuelle EXACTE à la latitude x (géométrie orbitale, obliquité comprise : EARTH.dailyMeanInsolation),
//       a(x) = co-albédo au sommet. Solution à deux modes (éq. 27–30, 32) : T(x) = T̄ + T₂ P₂(x), P₂ = (3x² − 1)/2,
//
//           T₂ = 5 ∫₀¹ P₂(x) I(x) a(x) dx / (6D + B)
//
//       T̄ ne vient pas de ce modèle : c'est la température du transfert radiatif complet (le solveur). On n'en prend que la
//       FORME méridienne. Constantes PUBLIÉES, pas réglées : B = 2,09 W m⁻² °C⁻¹ (ajustement de l'OLR observé, éq. 7) et
//       D = 0,649 W m⁻² °C⁻¹ (D/B = 0,310), que North cale sur le gradient OBSERVÉ de l'hémisphère nord (T₂ = −28,0 °C).
//       Le co-albédo de chaque zone vient du transfert solaire du modèle (radiative/solaire.js, Lacis & Hansen 1974) avec la
//       distribution annuelle des angles solaires DE LA ZONE et l'albédo de surface de la zone (sa glace, pondérée par
//       l'ensoleillement qu'elle reçoit, et sa surface libre). La glace dépend de T₂ et T₂ de la glace : point fixe.
//       Approximations DÉCLARÉES : deux modes (le gradient tropical réel est plus plat, North §3) ; mêmes nuages dans les trois
//       zones (fractions globales mesurées) ; surface libre = océan + terres de la géologie.
// Version 1.4.0
// - v1.4.0 (2026-10-28): socle porté des calottes transmis à CALOTTES.calculer ; TOLERANCE_K exportée (lue par les calottes).
// - v1.3.0 (2026-10-27): cycle annuel des terres par bande transmis aux calottes ; cycle calculé (physics/saisons.js) en diagnostic.
// - v1.2.0 (2026-10-22): calottes au profil T(x) = T̄ + T₂ P₂(x) et à l'insolation absorbée par une surface qui fond.
// Date: [October 28, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const NORTH1981 = {
        B: 2.09,     // [W/(m²·°C)] éq. 7, ajustement de l'OLR observé (North & Coakley 1979)
        D: 0.649     // [W/(m²·°C)] coefficient de diffusion méridienne, calé par North sur T₂ observé = −28,0 °C
    };
    const ZONES = [
        { cle: 'trop', x0: 0, x1: Math.sin(Math.PI / 6) },
        { cle: 'mid', x0: Math.sin(Math.PI / 6), x1: Math.sin(Math.PI / 3) },
        { cle: 'pol', x0: Math.sin(Math.PI / 3), x1: 1 }
    ];
    const P2 = (x) => (3 * x * x - 1) / 2;
    const primP2 = (x) => (x * x * x - x) / 2;                       // ∫ P₂ dx
    /** ⟨P₂⟩ de la zone (moyenne sur sa surface, uniforme en x) : −0,375 / 0,2165 / 0,8078. */
    const P2_MOYEN = {};
    for (const z of ZONES) P2_MOYEN[z.cle] = (primP2(z.x1) - primP2(z.x0)) / (z.x1 - z.x0);

    const N_X = 40;      // sous-intervalles en x par zone (intégrale de J)
    const N_JOURS = 73;  // pas de 5 jours (comme EARTH.zoneAnnualInsolation)
    const N_HEURES = 24; // angles horaires sur la journée éclairée
    const N_MU = 8;      // classes de μ₀ par zone

    const declinaison = (jour, eps) => Math.asin(Math.sin(eps * Math.PI / 180) * Math.sin(2 * Math.PI * jour / N_JOURS)) * 180 / Math.PI;

    const _cacheJ = {};
    /** J_z = ∫_zone P₂(x) I(x) dx [W/m²] pour l'insolation de référence (EARTH.SOLAR_CONSTANT_REF_W_PER_M2), par ε. */
    function integralesJ(eps) {
        const cle = eps.toFixed(4);
        if (cle in _cacheJ) return _cacheJ[cle];
        const J = {};
        for (const z of ZONES) {
            const dx = (z.x1 - z.x0) / N_X;
            let s = 0;
            for (let i = 0; i < N_X; i++) {
                const x = z.x0 + (i + 0.5) * dx;
                const lat = Math.asin(x) * 180 / Math.PI;
                let I = 0;
                for (let d = 0; d < N_JOURS; d++) I += window.EARTH.dailyMeanInsolation(lat, declinaison(d, eps));
                s += P2(x) * (I / N_JOURS) * dx;
            }
            J[z.cle] = s;
        }
        _cacheJ[cle] = J;
        return J;
    }

    const _cacheMu = {};
    /** Distribution annuelle de μ₀ PONDÉRÉE PAR L'ÉNERGIE reçue, par zone et par ε : N_MU classes { mu, poids }. */
    function quadratureMu(eps) {
        const cle = eps.toFixed(4);
        if (cle in _cacheMu) return _cacheMu[cle];
        const Q = {};
        for (const z of ZONES) {
            const somme = new Array(N_MU).fill(0), sommeMu = new Array(N_MU).fill(0);
            const dx = (z.x1 - z.x0) / 10;
            for (let i = 0; i < 10; i++) {
                const phi = Math.asin(z.x0 + (i + 0.5) * dx);       // uniforme en x : pondéré par la surface
                for (let d = 0; d < N_JOURS; d++) {
                    const dec = declinaison(d, eps) * Math.PI / 180;
                    const c = -Math.tan(phi) * Math.tan(dec);
                    const H = c >= 1 ? 0 : (c <= -1 ? Math.PI : Math.acos(c));   // demi-durée du jour
                    for (let h = 0; h < N_HEURES; h++) {
                        const w = -H + (h + 0.5) * 2 * H / N_HEURES;
                        const mu = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(w);
                        if (!(mu > 0)) continue;
                        const e = mu * H;                           // énergie ∝ μ₀ × durée de la tranche horaire
                        const b = Math.min(N_MU - 1, Math.floor(mu * N_MU));
                        somme[b] += e;
                        sommeMu[b] += e * mu;
                    }
                }
            }
            const total = somme.reduce((a, v) => a + v, 0);
            Q[z.cle] = somme.map((v, b) => ({ mu: v > 0 ? sommeMu[b] / v : 0, poids: v / total })).filter((q) => q.poids > 0);
        }
        _cacheMu[cle] = Q;
        return Q;
    }

    /**
     * Résout le point fixe glace ↔ gradient et pose window.STATE.dTzones. Appelé par calculateAlbedo, une fois par calcul.
     *   T_K        : température moyenne globale (solveur) ;
     *   colonne    : colonne nuageuse du profil (RADIATIVE.colonneNuageuse) ;
     *   albedoLibre: albédo de la surface SANS glace (géologie) ;
     *   albedoGlace: (cle, T_zone_K) → albédo de la glace saisonnière de la zone (Briegleb, calculations_albedo.js) ;
     *   albedoNeige: albédo des calottes (neige permanente) ;
     *   albedoFonte: { neige, glace } albédos d'une calotte qui fond (neige mouillée, glace nue) ;
     *   calottesDepart, socleDepart, dureeAns : état de départ des calottes, de leur socle, et temps écoulé depuis (physics/calottes.js).
     * Renvoie { T2, dT, coAlbedo, Rg, calottes, absorbe, saisons } pour le diagnostic.
     */
    const TOLERANCE_K = 0.01;   // [K] point fixe glace ↔ gradient : écart de zone toléré entre deux itérations (lu aussi par les calottes)

    function resoudre(T_K, EPOCH, colonne, albedoLibre, albedoGlace, albedoNeige, albedoFonte, calottesDepart, socleDepart, dureeAns) {
        const DATA = window.DATA;
        const eps = window.EARTH.obliquiteCourante(EPOCH);
        const J = integralesJ(eps);
        const Q = quadratureMu(eps);
        const echelle = DATA['☀️']['🧲☀️'] / window.EARTH.SOLAR_CONSTANT_REF_W_PER_M2;   // Soleil de l'époque
        const s = window.SOLAIRE.facteurRayleigh(), u = window.SOLAIRE.colonneOzone();
        const L2 = 6 * NORTH1981.D + NORTH1981.B;
        let dT = Object.assign({}, window.STATE.dTzones);
        let T2 = 0;
        const coAlbedo = {}, Rg = {};
        const ageMa = window.INTERIEUR.ageCourant(DATA) / 1e6;
        // Part de l'insolation absorbée au sol par une calotte qui fond (neige mouillée, glace nue), aux angles solaires de chaque
        // zone : le τ_a (1 − α_s) de Robinson & Goelzer 2014, ici par le transfert solaire du modèle (nuages et vapeur compris).
        const absorbe = {};
        for (const z of ZONES) {
            let neige = 0, glace = 0;
            for (const q of Q[z.cle]) {
                neige += q.poids * window.SOLAIRE.albedoMu(q.mu, albedoFonte.neige, colonne, s, u).S;
                glace += q.poids * window.SOLAIRE.albedoMu(q.mu, albedoFonte.glace, colonne, s, u).S;
            }
            absorbe[z.cle] = { neige: neige, glace: glace };
        }
        // Cycle annuel des terres lu par les calottes : amplitude de la ZONE posée (EARTH.SEASONAL_AMP_*, × sin ε) et retard posé
        // (EARTH.RETARD_SAISONS_JOURS), sans 2ᵉ harmonique. ⚠️ Le cycle calculé (physics/saisons.js), contrôlé sur les terres
        // mesurées, n'est pas lu : le pôle de ce bilan est trop chaud (T₂ ≈ −21,5 contre −28 observé) et les hautes terres de
        // N_mid naissent au bout polaire de leur bande ; avec lui, le 1er clic 🐾 bascule en boule de neige.
        const retard = 2 * Math.PI * window.EARTH.RETARD_SAISONS_JOURS / window.ORBITE.JOURS_AN;
        let calottes = null;
        for (let k = 0; k < 30; k++) {
            const f = window.EARTH.facteurGlaceZones(T_K, EPOCH, dT);
            const cycles = {};
            for (const b of window.CALOTTES.BANDES) cycles[b.cle] = { terre: { a1: f['amp_' + b.zone], d1: retard, r2: 0, i2: 0 } };
            // Calottes continentales au profil méridien de cette itération : T(x) = T̄ + T₂ P₂(x), T₂ tiré des écarts de zone
            // (dT_z = −T₂ ⟨P₂⟩_z), cycle annuel des TERRES de leur bande.
            calottes = window.CALOTTES.calculer(T_K, -dT.pol / P2_MOYEN.pol, cycles, absorbe, ageMa, EPOCH, calottesDepart, socleDepart, dureeAns);
            let H = 0;
            for (const z of ZONES) {
                const e = f['e_' + z.cle];                          // part de l'énergie de la zone qui tombe sur la glace saisonnière
                const c = calottes.parZone[z.cle];                  // part de la zone sous calotte permanente
                Rg[z.cle] = c * albedoNeige + (1 - c) * (e * albedoGlace(z.cle, T_K - dT[z.cle]) + (1 - e) * albedoLibre);
                let A = 0;
                for (const q of Q[z.cle]) A += q.poids * window.SOLAIRE.albedoMu(q.mu, Rg[z.cle], colonne, s, u).A;
                coAlbedo[z.cle] = 1 - A;
                H += coAlbedo[z.cle] * J[z.cle];
            }
            T2 = 5 * echelle * H / L2;
            let ecart = 0;
            const nouveau = {};
            for (const z of ZONES) {
                nouveau[z.cle] = -T2 * P2_MOYEN[z.cle];
                ecart = Math.max(ecart, Math.abs(nouveau[z.cle] - dT[z.cle]));
                dT[z.cle] = 0.5 * dT[z.cle] + 0.5 * nouveau[z.cle];   // relaxation : la glace est une rampe raide
            }
            if (ecart < TOLERANCE_K) break;
        }
        window.STATE.dTzones = dT;
        // Diagnostic : cycle annuel calculé des terres et des mers (mode saisonnier de North 1981) de l'état convergé.
        const saisons = window.SAISONS.cycles(T_K, dT, coAlbedo, EPOCH, ageMa);
        return { T2: T2, dT: dT, coAlbedo: coAlbedo, Rg: Rg, calottes: calottes, absorbe: absorbe, saisons: saisons };
    }

    window.MERIDIEN = { TOLERANCE_K: TOLERANCE_K, NORTH1981: NORTH1981, P2_MOYEN: P2_MOYEN, integralesJ: integralesJ, quadratureMu: quadratureMu, resoudre: resoudre };
})();
