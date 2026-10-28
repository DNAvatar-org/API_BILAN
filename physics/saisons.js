// File: API_BILAN/physics/saisons.js - Cycle annuel de la température des terres et des mers, par bande de latitude
// Desc: Je calcule le cycle annuel de la température de surface de la terre et de la mer de chaque bande (zone du bilan méridien ×
//       hémisphère), au lieu de poser des amplitudes. C'est le mode saisonnier du bilan d'énergie diffusif de North, Cahalan &
//       Coakley 1981 (Rev. Geophys. Space Phys. 19:91, éq. 54–58), résolu harmonique par harmonique (n = 1 annuel, n = 2
//       semi-annuel), avec une boîte terre et une boîte mer par bande couplées par l'air qui passe de l'une à l'autre :
//
//           Z_n T̂_n = F_n,     T(t) = T̄ + Im[T̂₁ e^{iωt}] + Re[T̂₂ e^{2iωt}],     t compté depuis l'équinoxe de printemps
//
//         · forçage : harmonique n de l'insolation journalière (orbite circulaire) moyennée sur la bande, × co-albédo de la zone
//           (bilan méridien) × Soleil de l'époque. n = 1 : exactement ⟨x⟩ sin ε / 2 (identité vérifiée à toutes les latitudes) ;
//           n = 2 : coefficient de cos 2λ, calculé sur l'insolation journalière exacte (EARTH.dailyMeanInsolation) ;
//         · impédance de la terre : B + n(n+1) D + i nω C_air + e_sol √(i nω) — rayonnement et diffusion méridienne (B, D de
//           North 1981, MERIDIEN.NORTH1981), colonne d'air, chaleur conduite dans le sol semi-infini (effusivité e_sol) ;
//         · impédance de la mer : part libre g' = 1 − g, couche de mélange B + n(n+1) D + i nω (C_eau + C_air) ; part gelée g,
//           glace B + n(n+1) D + i nω C_air + k_i q coth(q h_i), dalle sur l'eau à son point de gel (équation de la chaleur,
//           Carslaw & Jaeger 1959), q = √(i nω/κ_i), épaisseur de Stefan h_i = √(2 k_i FDD / (ρ_i L_f)), g et les degrés-jours
//           de gel FDD tirés du cycle de la mer elle-même (point fixe) ;
//         · couplage terre–mer : ν = u C_air / (2π R cos φ), l'air traverse la bande en un temps 2π R cos φ / u et y
//           échange sa chaleur (réduction à deux boîtes de McKinnon, Stine & Huybers 2013, éq. 3).
//       Contrôle (pas une entrée) : premier harmonique des terres mesuré (University of Delaware 1981–2010 ; ❔ valeurs sans script
//       de relevé, version des données non relevée).
//       LU : en diagnostic de l'état convergé (MERIDIEN.resoudre → saisons). ⚠️ Pas encore par les calottes ni par la glace de mer,
//       qui gardent l'amplitude de zone posée (EARTH.SEASONAL_AMP_*) : avec ce cycle, le pôle trop chaud du bilan méridien
//       (T₂ ≈ −21,5 contre −28 observé) et les hautes terres de N_mid nées au bout polaire font basculer le 1er clic 🐾 en
//       boule de neige ; et une rampe de glace de mer de ZONE ne sait pas recevoir l'amplitude de 1 à 2 K de la mer.
//       Approximations DÉCLARÉES : deux boîtes par bande (⚠️ ν réduit à une traversée de la bande) ; ⚠️ n = 2 pour le mode
//       semi-annuel ; glace de mer pondérée par sa part de l'année g ; ⚠️ mesures posées faute d'équation : couche de mélange,
//       vitesse de l'air, effusivité du sol.
// Version 1.0.0
// - v1.0.0 (2026-10-27): cycle annuel calculé des terres et des mers (NCC 1981), en diagnostic du bilan méridien.
// Date: [October 27, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        RHO_EAU_MER: 1025,         // [kg/m³] eau de mer de surface (S = 35 g/kg, ~20 °C ; TEOS-10, IOC et al. 2010)
        CP_EAU_MER: 3991.87,       // [J/(kg·K)] c_p⁰ de l'eau de mer (TEOS-10, IOC et al. 2010)
        H_MELANGE_M: 75,           // [m] ⚠️ couche de mélange de l'océan, mesure (North et al. 1981 ; McKinnon et al. 2013)
        VENT_M_S: 6.1,             // [m/s] ⚠️ vitesse de traversée des masses d'air, rétrotrajectoires HYSPLIT à 45–50° N
                                   //       (McKinnon et al. 2013)
        EFFUSIVITE_SOL: 1500,      // [J m⁻² K⁻¹ s^-½] ⚠️ effusivité √(kρc) d'un sol minéral : ordre de grandeur, sans source
        ITERATIONS_GLACE: 12,      // itérations du point fixe glace de mer ↔ cycle de la mer (relaxation ½) — numérique
        N_X: 20,                   // latitudes de la quadrature du 2ᵉ harmonique du forçage — numérique
        N_LAMBDA: 360              // longitudes solaires de la même quadrature — numérique
    };

    const _cacheH2 = {};
    /** Coefficient de cos 2λ de l'insolation journalière (orbite circulaire, par unité de constante solaire), moyenne de la bande
     *  uniforme en x = sin φ ; en cache par bande et par ε. */
    function forcage2(bande, eps) {
        const cle = bande.x0 + ':' + eps.toFixed(4);
        if (cle in _cacheH2) return _cacheH2[cle];
        const se = Math.sin(eps * Math.PI / 180);
        let s = 0;
        for (let i = 0; i < K.N_X; i++) {
            const lat = Math.asin(bande.x0 + (bande.x1 - bande.x0) * (i + 0.5) / K.N_X) * 180 / Math.PI;
            for (let k = 0; k < K.N_LAMBDA; k++) {
                const l = 2 * Math.PI * (k + 0.5) / K.N_LAMBDA;
                s += 2 * window.EARTH.dailyMeanInsolation(lat, Math.asin(se * Math.sin(l)) * 180 / Math.PI) * Math.cos(2 * l);
            }
        }
        _cacheH2[cle] = s / (K.N_X * K.N_LAMBDA * window.EARTH.SOLAR_CONSTANT_REF_W_PER_M2);
        return _cacheH2[cle];
    }

    // Nombres complexes [re, im]
    const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };

    /** Cycle d'une surface : { a1 [K], d1 [rad] (retard sur le soleil), r2, i2 [K] (Re et Im de T̂₂) } ; T(θ) = T̄ + a1 sin(θ − d1)
     *  + r2 cos 2θ − i2 sin 2θ, θ = 2π t / an. */
    const cycle = (T1, T2) => ({ a1: Math.hypot(T1[0], T1[1]), d1: -Math.atan2(T1[1], T1[0]), r2: T2[0], i2: T2[1] });

    /**
     * Cycles annuels de chaque bande (CALOTTES.BANDES) : { cle: { terre, mer, glace, h_glace } }, terre et mer = cycle(),
     * glace = part de l'année où la mer est gelée, h_glace [m] épaisseur de Stefan.
     *   T_K      : température moyenne globale [K] ; dT = { pol, mid, trop } écarts des zones (T_zone = T_K − dT) ;
     *   coAlbedo : { pol, mid, trop } part de l'insolation absorbée par la colonne (bilan méridien, itération précédente) ;
     *   EPOCH, ageMa : époque et date [Ma] (obliquité, gravité, terre de chaque bande).
     */
    function cycles(T_K, dT, coAlbedo, EPOCH, ageMa) {
        const D = window.DATA, NCC = window.MERIDIEN.NORTH1981;
        const eps = window.EARTH.obliquiteCourante(EPOCH);
        const S = D['☀️']['🧲☀️'];
        const geo = window.CALOTTES.geographie(ageMa, EPOCH);
        const Cair = window.CONST.CP_AIR * D['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA / D['📅']['🍎'];   // [J m⁻² K⁻¹] colonne d'air
        const Cmer = K.RHO_EAU_MER * K.CP_EAU_MER * K.H_MELANGE_M;                                            // [J m⁻² K⁻¹]
        const rhoI = window.EARTH.NUAGES.RHO_GLACE, kI = window.CONST.K_GLACE, Lf = window.CONST.L_FUSION_GLACE;
        const eI = Math.sqrt(kI * rhoI * window.CONST.CP_GLACE);                                              // effusivité de la glace
        const an = window.ORBITE.JOURS_AN, jour = window.CONV.SECONDS_PER_DAY;
        const omega = 2 * Math.PI / (an * jour);                                                               // [rad/s]
        const R = D['📜']['📐'] * 1000;
        const out = {};
        for (const b of window.CALOTTES.BANDES) {
            const fT = geo[b.cle].continent, fM = 1 - fT;
            const xm = (b.x0 + b.x1) / 2;
            const nu = K.VENT_M_S * Cair / (2 * Math.PI * R * Math.sqrt(1 - xm * xm));                       // [W m⁻² K⁻¹]
            const F = [coAlbedo[b.zone] * S * xm * Math.sin(eps * Math.PI / 180) / 2, coAlbedo[b.zone] * S * forcage2(b, eps)];
            const mu = T_K - dT[b.zone] - window.EARTH.T_FREEZE_SEAWATER_K;                                      // [K] mer au-dessus du gel
            // Un harmonique n : impédances de la terre et de la mer, système couplé terre–mer.
            const mode = (n, g, h) => {
                const w = n * omega, Dn = NCC.B + n * (n + 1) * NCC.D, r = Math.sqrt(w / 2);   // √(i w) = √(w/2) (1 + i)
                const ZT = [Dn + K.EFFUSIVITE_SOL * r, w * Cair + K.EFFUSIVITE_SOL * r];
                const libre = [Dn, w * (Cmer + Cair)];
                // Glace : dalle d'épaisseur h sur l'eau à son point de gel, flux / température de surface = k_i q coth(q h),
                // q = √(i nω / κ_i), κ_i = k_i/(ρ_i c_i) — k_i q = e_i √(i nω) ; q h = s (1 + i), s = h √(nω / 2κ_i).
                // Une mer jamais gelée n'a pas de glace (g = 0 ⇔ FDD = 0 ⇔ h = 0).
                const s = h * r * eI / kI, e2 = Math.exp(2 * s);
                const Zg = mul([eI * r, eI * r], div([e2 * Math.cos(2 * s) + 1, e2 * Math.sin(2 * s)], [e2 * Math.cos(2 * s) - 1, e2 * Math.sin(2 * s)]));
                const ZM = g > 0 ? [(1 - g) * libre[0] + g * (Dn + Zg[0]), (1 - g) * libre[1] + g * (w * Cair + Zg[1])] : libre;
                const Fn = [F[n - 1], 0];
                if (fT === 0) { const T = div(Fn, ZM); return { terre: T, mer: T }; }   // bande toute mer
                if (fT === 1) { const T = div(Fn, ZT); return { terre: T, mer: T }; }   // bande toute terre
                const a = [ZT[0] + nu / fT, ZT[1]], d = [ZM[0] + nu / fM, ZM[1]];
                const det = mul(a, d); det[0] -= nu * nu / (fT * fM);
                return { terre: div(mul(Fn, [d[0] + nu / fT, d[1]]), det), mer: div(mul(Fn, [a[0] + nu / fM, a[1]]), det) };
            };
            // Point fixe de la glace de mer : part de l'année sous le gel g et degrés-jours de gel FDD du premier harmonique de la
            // mer, en forme fermée ; relaxation ½, mêmes poids pour g et FDD.
            let g = 0, fdd = 0, h = 0, m1, m2;
            for (let it = 0; it < K.ITERATIONS_GLACE; it++) {
                h = Math.sqrt(2 * kI * fdd * jour / (rhoI * Lf));                                               // [m] loi de Stefan
                m1 = mode(1, g, h); m2 = mode(2, g, h);
                const A = Math.hypot(m1.mer[0], m1.mer[1]);
                const beta = mu >= A ? -Math.PI / 2 : (mu <= -A ? Math.PI / 2 : Math.asin(-mu / A));
                g = 0.5 * g + 0.5 * (Math.PI + 2 * beta) / (2 * Math.PI);
                fdd = 0.5 * fdd + 0.5 * an / (2 * Math.PI) * (-mu * (Math.PI + 2 * beta) + 2 * A * Math.cos(beta));   // [°C·jour]
            }
            out[b.cle] = { terre: cycle(m1.terre, m2.terre), mer: cycle(m1.mer, m2.mer), glace: g, h_glace: h };
        }
        return out;
    }

    window.SAISONS = { K: K, forcage2: forcage2, cycles: cycles };
})();
