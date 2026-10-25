// File: API_BILAN/physics/orbite.js - Orbite de la Terre à la date courante (Milankovitch)
// Desc: Je donne au moteur l'orbite de la Terre à la date du calcul, par la solution astronomique de Berger & Loutre 1991
//       (Quaternary Science Reviews 10:297) — celle de l'onglet Milankovitch, dont je lis le calcul (CO2/static/astronomie.js)
//       et les tables (CO2/static/astronomie_ber90.js), chargés avant moi par le manifeste : une seule référence. Dans sa
//       validité (± 3 Ma autour de 1950) :
//         · obliquité ε → 📜⚾ (compute.js) : insolation annuelle par latitude du bilan méridien, amplitude des saisons ;
//         · excentricité e → flux solaire moyen de l'année, S / √(1 − e²) (Kepler ; compute.js getSoleil) ;
//         · insolation journalière par latitude, comparée à celle de l'orbite de 1950 — l'orbite sous laquelle les degrés-jours
//           de Braithwaite 1995 ont été mesurés : l'écart d'énergie absorbée fond la glace en plus des degrés-jours
//           (Robinson & Goelzer 2014, The Cryosphere 8:1419, éq. 2 ; physics/calottes.js). C'est par lui qu'entre la précession.
//       Calendrier : pas de 5 jours depuis l'équinoxe de printemps (λ = 0), comme le bilan méridien et la glace saisonnière ;
//       la longitude solaire de chaque pas sort de l'équation de Kepler (une saison courte quand la Terre est au périhélie).
//       Hors de la validité, pas de solution publiée : orbite de référence (aucune anomalie, Soleil sans facteur), ε de l'époque.
// Version 1.0.0
// Date: [October 22, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const A = window.astronomie;
    const AGES = window.INTERIEUR.CONST;   // origine des âges du moteur : AGES.AN_PRESENT (années avant 2025)
    const N_PAS = 73;                  // pas de 5 jours dans l'année (meridien.js, physics.js tableInsolation)
    const JOURS_AN = 365.2422;         // [jour] année tropique
    const SECONDES_PAS = JOURS_AN / N_PAS * 86400;   // [s]
    const DEG = Math.PI / 180;

    /** Année calendaire d'un âge en années avant 2025 (INTERIEUR.ageDe). */
    const anCalendaire = (age) => AGES.AN_PRESENT - age;
    /** Années après 1950.0 (temps des tables). */
    const tTables = (age) => anCalendaire(age) - A.AN_REFERENCE;

    /** La date (âge, années avant 2025) est-elle couverte par la solution ? */
    function valide(age) {
        return A.dansLaValidite(anCalendaire(age));
    }

    /** [W/m²] Insolation du solstice d'été à 65° N à l'âge donné (l'indicateur classique des glaciations). */
    function insolation65N(age) {
        return A.insolation65N(anCalendaire(age));
    }

    const _orbites = new Map();
    /** { obliquite [rad], excentricite, varpi [rad] } à l'âge donné, à l'année près. */
    function elements(age) {
        const t = Math.round(tTables(age));
        if (!_orbites.has(t)) _orbites.set(t, A.orbite(t));
        return _orbites.get(t);
    }

    /** [°] Obliquité à l'âge donné → 📜⚾. Hors de la solution : 0, la convention de 📜⚾ pour « l'obliquité de l'époque ». */
    function obliquiteDeg(age) {
        return valide(age) ? elements(age).obliquite / DEG : 0;
    }

    /** Flux solaire moyen de l'année rapporté à celui d'une orbite circulaire de même demi-grand axe : 1 / √(1 − e²).
     *  Hors de la solution : 1 (orbite circulaire, comme avant que l'orbite n'entre dans le moteur). */
    function facteurSoleil(age) {
        if (!valide(age)) return 1;
        const e = elements(age).excentricite;
        return 1 / Math.sqrt(1 - e * e);
    }

    /** Longitude solaire vraie λ [rad] au milieu de chaque pas, depuis l'équinoxe de printemps (Kepler). */
    function longitudes(o) {
        const e = o.excentricite, vp = o.varpi;
        const anomalieExc = (nu) => 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
        const E0 = anomalieExc(-vp);                     // à l'équinoxe, λ = 0 donc ν = −ϖ
        const M0 = E0 - e * Math.sin(E0);
        const lam = [];
        for (let k = 0; k < N_PAS; k++) {
            const M = M0 + 2 * Math.PI * (k + 0.5) / N_PAS;
            let E = M;
            for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
            lam.push(nu + vp);
        }
        return lam;
    }

    /** Insolation journalière [W/m²] par latitude entière (−90 … 90°) et par pas, pour une orbite. */
    function insolations(o) {
        const lam = longitudes(o), lignes = [];
        for (let lat = -90; lat <= 90; lat++) {
            const ligne = new Float64Array(N_PAS);
            for (let k = 0; k < N_PAS; k++) ligne[k] = A.insolationJournaliere(o, lam[k], lat * DEG);
            lignes.push(ligne);
        }
        return lignes;
    }

    const REFERENCE = insolations(A.orbite(0));          // 1950.0
    const ZERO = REFERENCE.map(() => new Float64Array(N_PAS + 1));
    const _anomalies = new Map();
    /**
     * Anomalie d'insolation à l'âge donné : pour chaque latitude entière, les sommes CUMULÉES de (S − S₁₉₅₀) sur les pas,
     * P[i][k] = Σ_{j<k} ΔS[i][j] [W/m²], k = 0 … 73 (lue par sommeAnomalie). Hors de la validité : zéro partout.
     */
    function anomalie(age) {
        if (!valide(age)) return ZERO;
        const t = Math.round(tTables(age));
        if (!_anomalies.has(t)) {
            const S = insolations(elements(age));
            _anomalies.set(t, S.map((ligne, i) => {
                const P = new Float64Array(N_PAS + 1);
                for (let k = 0; k < N_PAS; k++) P[k + 1] = P[k] + ligne[k] - REFERENCE[i][k];
                return P;
            }));
        }
        return _anomalies.get(t);
    }

    /**
     * Énergie d'anomalie [J/m²] reçue à la latitude latDeg entre les jours d1 et d2 (comptés depuis l'équinoxe de printemps,
     * d2 ≥ d1, l'intervalle peut passer la fin de l'année). P : anomalie(age).
     */
    function sommeAnomalie(P, latDeg, d1, d2) {
        const ligne = P[Math.round(latDeg) + 90];
        const cumul = (d) => {
            const x = d / JOURS_AN * N_PAS, tours = Math.floor(x / N_PAS), r = x - tours * N_PAS, k = Math.min(Math.floor(r), N_PAS - 1);
            return tours * ligne[N_PAS] + ligne[k] + (r - k) * (ligne[k + 1] - ligne[k]);
        };
        return (cumul(d2) - cumul(d1)) * SECONDES_PAS;
    }

    window.ORBITE = { N_PAS: N_PAS, JOURS_AN: JOURS_AN, valide: valide, elements: elements, obliquiteDeg: obliquiteDeg,
        facteurSoleil: facteurSoleil, insolation65N: insolation65N, anomalie: anomalie, sommeAnomalie: sommeAnomalie };
})();
