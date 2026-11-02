// File: API_BILAN/physics/orbite.js - Orbite de la Terre à la date courante (Milankovitch)
// Desc: Je donne au moteur l'orbite de la Terre à la date du calcul, par la solution La2004 (Laskar et al. 2004, A&A 428:261)
//       — celle de l'onglet Milankovitch, dont je lis le calcul (CO2/static/astronomie.js) et la table
//       (CO2/static/astronomie_la04.js), chargés avant moi par le manifeste : une seule référence. Dans sa validité (de −51 Ma
//       à aujourd'hui ; phase de la précession incertaine au-delà de ~20 Ma) :
//         · obliquité ε → 📜⚾ (compute.js) : insolation annuelle par latitude du bilan méridien, amplitude des saisons ;
//         · excentricité e → flux solaire moyen de l'année, S / √(1 − e²) (Kepler ; compute.js getSoleil) ;
//         · insolation journalière par latitude : celle de l'orbite de 1950 (REFERENCE) plus son écart à la date, l'anomalie. C'est
//           par elle qu'entrent la précession et l'excentricité dans l'année : forçage des trois boîtes de chaque bande (calotte, terre libre, mer libre : physics/saisons.js)
//           et bilan d'énergie de surface des calottes (physics/calottes.js). L'anomalie est calculée aux LIGNES de la table (pas de
//           1 ka) : une date se lit entre les deux lignes qui l'encadrent (encadrement), interpolée linéairement — les calottes la
//           lisent à la date de chacun de leurs sous-pas.
//       Calendrier (longitudes) : 73 pas égaux en anomalie moyenne depuis l'équinoxe de printemps (λ = 0) ; la longitude solaire de
//       chaque pas sort de l'équation de Kepler (une saison courte quand la Terre est au périhélie). Insolation d'une orbite sur ce
//       calendrier : insolationCumulee, la seule écriture, lue pour 1950, pour chaque ligne de la table et par physics/saisons.js.
//       Hors de la validité (avant −51 Ma), pas de solution publiée : anomalie nulle, Soleil sans facteur, pas d'obliquité ici —
//       l'époque déclare la sienne (📜⚾, compute.js) ; l'orbite de référence y est choisie par physics/saisons.js (orbite circulaire).
//       Âges : années avant window.AN_PRESENT (config/configTimeline.js, la seule origine) ; année tropique : CONST.AN_TROPIQUE_JOURS.
// Version 1.5.0
// - v1.5.0 (2026-11-02): N_LIGNES exporté (orbite moyenne de physics/saisons.js : la ligne au-delà de la table).
// - v1.4.1 (2026-11-01): commentaire : forçage des trois boîtes de chaque bande.
// - v1.4.0 (2026-10-29): pas d'obliquité hors de la solution (plus de 0 pour « celle de l'époque ») ; origine des âges et année
//   tropique lues à leur seule source.
// Date: [November 2, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const A = window.astronomie;
    const N_PAS = 73;                  // pas de 5 jours dans l'année (calendrier ; lu par meridien.js, physics.js, saisons.js)
    const SECONDES_PAS = window.CONST.AN_TROPIQUE_JOURS / N_PAS * window.CONV.SECONDS_PER_DAY;   // [s]
    const DEG = Math.PI / 180;
    const PAS_TABLE = window.LA2004.pasAns;                                   // [an] 1 000 : une ligne de la table par ka
    const N_LIGNES = (A.FIN_TABLE_AN - A.DEBUT_AN) / PAS_TABLE + 1;           // lignes 0 (an 2000) … N − 1 (−51 Ma)
    // Caches par date bornés (les plus anciennement lus partent d'abord) : une anomalie de ligne pèse au plus 181 × 74 nombres,
    // et un clic de 5 ka en lit une dizaine, un long clic jusqu'à ~260 (fin du clic ka par ka, puis pas des calottes).
    const MAX_DATES = 400;

    /** Valeur en cache de cle, calculée par calcul() à la première lecture ; la plus anciennement lue part au-delà de MAX_DATES. */
    function lireCache(cache, cle, calcul) {
        if (cache.has(cle)) {
            const v = cache.get(cle);
            cache.delete(cle);
            cache.set(cle, v);
            return v;
        }
        const v = calcul();
        cache.set(cle, v);
        if (cache.size > MAX_DATES) cache.delete(cache.keys().next().value);
        return v;
    }

    /** Année calendaire d'un âge en années avant AN_PRESENT (INTERIEUR.ageDe). */
    const anCalendaire = (age) => window.AN_PRESENT - age;
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
    /** { obliquite [rad], excentricite, varpi [rad] } à l'âge donné, à l'année près. Clé de cache : l'année des tables, bornée
     *  à 2000 (au-delà, astronomie.js donne la même ligne). */
    const cle = (age) => Math.min(Math.round(tTables(age)), A.FIN_TABLE_AN - A.AN_REFERENCE);
    function elements(age) {
        const t = cle(age);
        return lireCache(_orbites, t, () => A.orbite(t));
    }

    /** [°] Obliquité à l'âge donné → 📜⚾. Hors de la solution, il n'y en a pas : crash (l'époque déclare la sienne, compute.js). */
    function obliquiteDeg(age) {
        if (!valide(age)) throw new Error('[ORBITE] obliquité demandée à ' + age + ' ans, hors de la solution La2004 (−51 Ma) : l\'époque déclare la sienne (EPOCH[\'⚾\'])');
        return elements(age).obliquite / DEG;
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

    /**
     * Insolation journalière [W/m²] d'une orbite o = { obliquite, excentricite, varpi } sur son calendrier de Kepler (longitudes), en
     * sommes CUMULÉES par pas à la latitude entière demandée : { ligne(lat) }, ligne(lat)[j] = Σ_{i<j} S[i], j = 0 … N_PAS (la forme
     * que lit sommeAnomalie), calculée à la première lecture de chaque latitude.
     */
    function insolationCumulee(o) {
        const lam = longitudes(o), lignes = [];
        return {
            ligne: (lat) => {
                const i = lat + 90;
                if (!lignes[i]) lignes[i] = cumulee(o, lam, lat);
                return lignes[i];
            }
        };
    }
    /** Sommes cumulées de l'insolation journalière de l'orbite o, de longitudes lam, à la latitude entière lat (sans cache). */
    function cumulee(o, lam, lat) {
        const P = new Float64Array(N_PAS + 1);
        for (let j = 0; j < N_PAS; j++) P[j + 1] = P[j] + A.insolationJournaliere(o, lam[j], lat * DEG);
        return P;
    }

    const REFERENCE = insolationCumulee(A.orbite(0));     // orbite de 1950.0, celle dont l'anomalie est l'écart
    const LIGNE_ZERO = new Float64Array(N_PAS + 1);
    const ZERO = { ligne: () => LIGNE_ZERO };
    const _anomalies = new Map();
    /**
     * Anomalie d'insolation de la ligne k de la table La2004 (an 2000 − k ka) : pour la latitude entière demandée, les sommes
     * CUMULÉES de (S − S₁₉₅₀) sur les pas, P.ligne(lat)[j] = Σ_{i<j} ΔS[i] [W/m²], j = 0 … 73 (lues par sommeAnomalie),
     * calculées à la première lecture de chaque latitude. Au-delà de la dernière ligne (avant −51 Ma) : zéro partout.
     */
    function anomalieLigne(k) {
        if (k >= N_LIGNES) return ZERO;
        return lireCache(_anomalies, k, () => {
            const o = A.orbite(A.FIN_TABLE_AN - k * PAS_TABLE - A.AN_REFERENCE), lam = longitudes(o), lignes = [];
            return {
                ligne: (lat) => {
                    const i = lat + 90;
                    if (!lignes[i]) {
                        const P = cumulee(o, lam, lat), R = REFERENCE.ligne(lat);
                        for (let j = 0; j <= N_PAS; j++) P[j] -= R[j];
                        lignes[i] = P;
                    }
                    return lignes[i];
                }
            };
        });
    }

    /**
     * Les deux lignes de la table qui encadrent l'âge [années avant 2025] : { k, w }, l'âge est entre la ligne k (plus récente)
     * et k + 1, au poids w ∈ [0, 1] de la seconde. Après 2000 : la ligne de 2000 (k = 0, w = 0). Hors de la solution (avant
     * −51 Ma) : k = N_LIGNES, au-delà de la table (anomalie nulle).
     */
    function encadrement(age) {
        const u = Math.max(0, (A.FIN_TABLE_AN - anCalendaire(age)) / PAS_TABLE);   // lignes avant l'an 2000
        if (u > N_LIGNES - 1) return { k: N_LIGNES, w: 0 };
        const k = Math.min(Math.floor(u), N_LIGNES - 2);
        return { k: k, w: u - k };
    }

    /**
     * Énergie d'anomalie [J/m²] reçue à la latitude latDeg entre les jours d1 et d2 (comptés depuis l'équinoxe de printemps,
     * d2 ≥ d1, l'intervalle peut passer la fin de l'année). P : anomalieLigne(k).
     */
    function sommeAnomalie(P, latDeg, d1, d2) {
        const ligne = P.ligne(Math.round(latDeg));
        const cumul = (d) => {
            const x = d / window.CONST.AN_TROPIQUE_JOURS * N_PAS, tours = Math.floor(x / N_PAS), r = x - tours * N_PAS, k = Math.min(Math.floor(r), N_PAS - 1);
            return tours * ligne[N_PAS] + ligne[k] + (r - k) * (ligne[k + 1] - ligne[k]);
        };
        return (cumul(d2) - cumul(d1)) * SECONDES_PAS;
    }

    window.ORBITE = { N_PAS: N_PAS, N_LIGNES: N_LIGNES, valide: valide, elements: elements, obliquiteDeg: obliquiteDeg,
        facteurSoleil: facteurSoleil, insolation65N: insolation65N, longitudes: longitudes, insolationCumulee: insolationCumulee,
        REFERENCE: REFERENCE, encadrement: encadrement, anomalieLigne: anomalieLigne, sommeAnomalie: sommeAnomalie };
})();
