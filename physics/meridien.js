// File: API_BILAN/physics/meridien.js - Bilan d'énergie méridien (North, Cahalan & Coakley 1981)
// Desc: Je calcule l'écart de température de chaque zone de latitude (tropiques 0–30°, moyennes latitudes 30–60°, pôles
//       60–90°) à la moyenne globale, au lieu de le poser par époque. C'est le modèle de bilan d'énergie
//       diffusif de North, Cahalan & Coakley 1981 (Rev. Geophys. Space Phys. 19:91), éq. 22 :
//
//           −d/dx [ D (1 − x²) dT/dx ] + A + B T(x) = I(x) a(x),        x = sin(latitude)
//
//       I(x) = insolation annuelle EXACTE à la latitude x (géométrie orbitale, obliquité comprise : astronomie.insolationJournaliere),
//       a(x) = co-albédo au sommet. Solution à deux modes (éq. 27–30, 32) : T(x) = T̄ + T₂ P₂(x), P₂ = (3x² − 1)/2,
//
//           T₂ = 5 ∫₀¹ P₂(x) I(x) a(x) dx / (6D + B)
//
//       T̄ ne vient pas de ce modèle : c'est la température du transfert radiatif complet (le solveur). On n'en prend que la
//       FORME méridienne ; il donne en retour au solveur l'albédo planétaire, A = Σ_z w_z (1 − a_z), la lumière réfléchie par
//       chaque zone pondérée par la part w_z de l'insolation du globe qu'elle reçoit (poidsInsolation). Les deux constantes sont celles de North, reprises telles quelles : B = 2,09 W m⁻² °C⁻¹ (📡 régression de
//       l'OLR tous ciels observé sur la température de surface, éq. 7, ajustée en paire avec D) et D = 0,649 W m⁻² °C⁻¹ (D/B = 0,310 ;
//       🔧 un réglage, pas une mesure : North le choisit pour que le co-albédo observé de l'hémisphère nord donne son T₂ observé,
//       −28,0 °C). D est constant : un monde plus chaud ou plus humide garde le transport méridien de la Terre actuelle.
//       Le co-albédo de chaque zone vient du transfert solaire du modèle (radiative/solaire.js) avec la distribution annuelle des
//       angles solaires DE LA ZONE et l'albédo de surface de la zone : ses calottes (albédo annuel de chacune, pondéré par
//       l'insolation et par sa fonte, physics/calottes.js), sa glace saisonnière (EARTH.glaceSaisonniere : neige et glace de mer de
//       chaque latitude de ses bandes au cycle de leur terre (celle de chaque latitude) et de leur mer libre, pondérées par
//       l'ensoleillement qu'elles reçoivent et réfléchissant à l'albédo de la saison, 🪩.🍰☀️🪩🧊) et sa surface libre — terre émergée et mer de ses deux bandes (PALEOGEO à la
//       date, CALOTTES.parts), moins les calottes (surfacesBandes) ; terre libre à l'albédo de ses forêt, désert et sol (ALBEDO.terresLibres :
//       la forêt de la bande, ALBEDO.poserForet), un bassin à sec (hors d'un monde à océan) compté en terre —, la lave couvrant le tout, albédos des
//       matériaux lus dans DATA['🪩🍰'] : les surfaces de l'albédo planétaire (ALBEDO.surfacesSansGlace), une seule loi. Le transfert solaire de chaque zone est tabulé une fois par calcul en fonction
//       de l'albédo de surface (tableColonne) : il sert aussi aux colonnes d'un m² de calotte, de terre libre et de mer libre de
//       chaque bande, dont les co-albédos forcent les trois boîtes du cycle saisonnier (physics/saisons.js), et à l'absorption au sol
//       d'une calotte qui fond ; la terre de chaque latitude et la mer libre portent la glace saisonnière de leur bande. La glace dépend de T₂ et T₂ de la glace : point fixe. Glace saisonnière,
//       calottes et leur albédo de chaque itération sont écrits dans DATA (🪩.🍰📅🧊, 🪩.🍰☀️🧊, 🪩.🍰☀️🪩🧊, 🗻.🧮🍰🗻🧊, sa masse 🗻.🧮⚖️🗻🧊 et
//       son albédo 🗻.🧮🪩🗻🧊) : l'albédo planétaire lit ceux de l'état convergé. Hors d'un monde à océan (eau sans phase condensée,
//       ou sans atmosphère), il n'y a pas de calotte : aire, masse et albédo nuls (physics/calottes.js, sansCalotte).
//       T₂ est dans DATA['🧮']['🌡️🎱'] : remis à la condition initiale au clic frise (depuisConfig), porté d'un calcul à
//       l'autre ensuite ; les écarts de zone dT_z = −T₂ ⟨P₂⟩_z se lisent par ecarts(), nulle part ailleurs. Tout l'état se lit dans
//       DATA (T̄, calottes portées et leur date, obliquité, Soleil) ; seuls passent en argument la colonne nuageuse du calcul et,
//       dans le point fixe, les grandeurs de travail de l'itération.
//       Approximations DÉCLARÉES : deux modes (le gradient tropical réel est plus plat, North §3) ; mêmes nuages dans les trois
//       zones (fractions globales mesurées) ; ⚠️ même part aride des terres dans toutes les bandes ; même température pour les deux bandes d'une zone (profil symétrique) : leurs terres
//       et leurs mers s'y moyennent ; ⚠️ une calotte couvre d'abord la terre émergée de sa bande, puis le plateau continental ;
//       transfert solaire d'une zone interpolé (cubique) entre six albédos de surface ; boîtes du cycle saisonnier forcées par les
//       co-albédos de l'itération précédente (à la première : calottes de départ, en neige sèche, sans glace saisonnière, forêt du
//       calcul précédent).
// Version 1.15.3
// - v1.15.3 (2026-11-01): commentaires : point fixe (dichotomie, pas doublé), trois boîtes, glace saisonnière sur la terre de chaque latitude.
// - v1.15.2 (2026-10-31): racine encadrée → dichotomie (calotte qui change de branche) ; pente ĝ ≥ 1 → pas doublé jusqu'à l'encadrer.
// - v1.15.0 (2026-10-31): colonnes d'un m² de calotte, de terre libre et de mer libre (trois boîtes de physics/saisons.js).
// - v1.14.3 (2026-10-31): description de resoudre : l'arrêt par encadrement de la racine.
// - v1.14.2 (2026-10-31): arrêt aussi quand deux T₂ successifs encadrent la racine à moins de TOLERANCE_K (saut de G).
// - v1.14.1 (2026-10-30): message du point fixe non convergé : l'erreur estimée du critère d'arrêt, |G − x|/(1 − max(ĝ, 0)).
// Date: [November 1, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const NORTH1981 = {
        B: 2.09,     // [W/(m²·°C)] éq. 7, ajustement de l'OLR observé (North & Coakley 1979)
        D: 0.649,    // [W/(m²·°C)] coefficient de diffusion méridienne, calé par North sur T₂ observé = −28,0 °C
        // [K] T₂ de départ du point fixe au clic frise : le gradient mesuré de l'hémisphère nord (North et al. 1981). Condition
        // initiale, pas un réglage : il ne décide de rien quand le point fixe est unique, seulement de la branche atteinte quand
        // deux branches stables coexistent.
        T2_DEPART: -28.0
    };
    const ZONES = window.EARTH.ZONES;   // la table des zones de physics.js (même objet)
    /** Polynôme de Legendre P₂(x) = (3x² − 1)/2, le mode méridien du bilan de North (lu aussi par physics/calottes.js). */
    const P2 = (x) => (3 * x * x - 1) / 2;
    const primP2 = (x) => (x * x * x - x) / 2;                       // ∫ P₂ dx
    /** ⟨P₂⟩ de la zone (moyenne sur sa surface, uniforme en x) : −0,375 / 0,2165 / 0,8080. */
    const P2_MOYEN = {};
    for (const z of ZONES) P2_MOYEN[z.cle] = (primP2(z.x1) - primP2(z.x0)) / (z.x1 - z.x0);

    const N_X = 40;      // sous-intervalles en x par zone (intégrale de J)
    const N_HEURES = 24; // angles horaires sur la journée éclairée
    const N_MU = 8;      // classes de μ₀ par zone
    const DEG = Math.PI / 180;

    const _cacheJ = {};
    /** Intégrales de l'insolation annuelle sur chaque zone, pour le Soleil actuel (astronomie.SOLAR_CONSTANT), par ε ; année en
     *  ORBITE.N_PAS longitudes égales (orbite circulaire) : { J: { zone: ∫ P₂(x) I(x) dx }, I: { zone: ∫ I(x) dx } } [W/m²]. */
    function integrales(eps) {
        const cle = eps.toFixed(4);
        if (cle in _cacheJ) return _cacheJ[cle];
        const J = {}, Iz = {}, N = window.ORBITE.N_PAS, o = window.EARTH.orbiteCirculaire(eps);
        for (const z of ZONES) {
            const dx = (z.x1 - z.x0) / N_X;
            let s = 0, sI = 0;
            for (let i = 0; i < N_X; i++) {
                const x = z.x0 + (i + 0.5) * dx;
                const phi = Math.asin(x);
                let I = 0;
                for (let d = 0; d < N; d++) I += window.astronomie.insolationJournaliere(o, 2 * Math.PI * d / N, phi);
                s += P2(x) * (I / N) * dx;
                sI += (I / N) * dx;
            }
            J[z.cle] = s;
            Iz[z.cle] = sI;
        }
        _cacheJ[cle] = { J: J, I: Iz };
        return _cacheJ[cle];
    }
    /** J_z = ∫_zone P₂(x) I(x) dx [W/m²] (integrales). */
    const integralesJ = (eps) => integrales(eps).J;
    /** Part de l'insolation annuelle du globe reçue par chaque zone, w_z = ∫_zone I dx / ∫₀¹ I dx (integrales) : le poids d'une zone
     *  dans la lumière que la planète réfléchit. */
    function poidsInsolation(eps) {
        const I = integrales(eps).I, w = {};
        let s = 0;
        for (const z of ZONES) s += I[z.cle];
        for (const z of ZONES) w[z.cle] = I[z.cle] / s;
        return w;
    }

    const _cacheMu = {};
    /** Distribution annuelle de μ₀ PONDÉRÉE PAR L'ÉNERGIE reçue, par zone et par ε : N_MU classes { mu, poids }. */
    function quadratureMu(eps) {
        const cle = eps.toFixed(4);
        if (cle in _cacheMu) return _cacheMu[cle];
        const Q = {}, N = window.ORBITE.N_PAS;
        for (const z of ZONES) {
            const somme = new Array(N_MU).fill(0), sommeMu = new Array(N_MU).fill(0);
            const dx = (z.x1 - z.x0) / 10;
            for (let i = 0; i < 10; i++) {
                const phi = Math.asin(z.x0 + (i + 0.5) * dx);       // uniforme en x : pondéré par la surface
                for (let d = 0; d < N; d++) {
                    const dec = Math.asin(Math.sin(eps * DEG) * Math.sin(2 * Math.PI * d / N));   // déclinaison (orbite circulaire)
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

    // Albédos de surface où le transfert solaire de chaque zone est calculé, de 0 à 1 par pas de 0,2 (à Rg = 1 le sol n'absorbe rien
    // et le transfert reste défini : radiative/solaire.js porte le flux descendant au sol) ; entre eux, interpolation cubique de
    // Lagrange — numérique.
    const PAS_RG = 0.2, RG_NOEUDS = [0, 1, 2, 3, 4, 5].map((i) => i * PAS_RG);
    /**
     * Transfert solaire de chaque zone en fonction de l'albédo de surface Rg, à la colonne du calcul (nuages, vapeur, Rayleigh s,
     * ozone u) et aux angles solaires de la zone (Q) : { zone: { A(Rg), S(Rg) } }, albédo au sommet et part de l'insolation absorbée
     * au sol (SOLAIRE.albedoMu, moyennés sur la distribution annuelle de μ₀ de la zone), calculés aux RG_NOEUDS et interpolés.
     */
    function tableColonne(colonne, Q, s, u) {
        const T = {};
        for (const z of ZONES) {
            const v = RG_NOEUDS.map((r) => {
                let A = 0, S = 0;
                for (const q of Q[z.cle]) { const t = window.SOLAIRE.albedoMu(q.mu, r, colonne, s, u); A += q.poids * t.A; S += q.poids * t.S; }
                return [A, S];
            });
            const lagrange = (Rg, j) => {
                if (!(Rg >= 0 && Rg <= 1)) {
                    throw new Error('[MERIDIEN] ' + window.DATA['📅']['📅'] + ', zone ' + z.cle + ' : albédo de surface Rg = ' + Rg + ' hors de [0, 1] à T̄ = '
                        + window.DATA['🧮']['🧮🌡️'] + ' K (calottes du pas 🗻.🧮🍰🗻🧊 et leur albédo 🗻.🧮🪩🗻🧊, glace saisonnière 🪩.🍰☀️🧊 et 🍰☀️🪩🧊, albédos 🪩🍰)');
                }
                const i = Math.min(RG_NOEUDS.length - 4, Math.max(0, Math.floor(Rg / PAS_RG) - 1));
                let y = 0;
                for (let a = i; a < i + 4; a++) {
                    let l = 1;
                    for (let b = i; b < i + 4; b++) if (b !== a) l *= (Rg - RG_NOEUDS[b]) / (RG_NOEUDS[a] - RG_NOEUDS[b]);
                    y += l * v[a][j];
                }
                return y;
            };
            T[z.cle] = { A: (Rg) => lagrange(Rg, 0), S: (Rg) => lagrange(Rg, 1) };
        }
        return T;
    }

    const TOLERANCE_K = 0.01;   // [K] point fixe glace ↔ gradient : erreur tolérée sur T₂ (lue aussi par les calottes)
    const ITERATIONS_MAX = 100; // [-] itérations du point fixe : au-delà, il ne converge pas et le calcul s'arrête — numérique

    /** Écarts des zones à la moyenne [K], dT_z = T̄ − T_z = −T₂ ⟨P₂⟩_z, T₂ = DATA['🧮']['🌡️🎱'] : la seule lecture des écarts de
     *  zone (glace saisonnière, calottes, puits océaniques, cycle saisonnier). */
    function ecarts() {
        const T2 = window.DATA['🧮']['🌡️🎱'];
        if (T2 === null) throw new Error("[MERIDIEN] T₂ (DATA['🧮']['🌡️🎱']) n'est pas posé : calcul lancé sans clic frise (MERIDIEN.depuisConfig)");
        return { pol: -T2 * P2_MOYEN.pol, mid: -T2 * P2_MOYEN.mid, trop: -T2 * P2_MOYEN.trop };
    }

    /**
     * [m²/m²] Surfaces de chaque BANDE à l'état de DATA (part de la bande) : calotte (calottes du pas, DATA['🗻']['🧮🍰🗻🧊']) et sa part
     * posée sur la terre émergée (calotteTerre), terre libre et mer libre ; calotte + terre + mer = 1. Terre émergée de la bande à la
     * date : CALOTTES.parts (PALEOGEO), la seule source. ⚠️ Une calotte couvre d'abord la terre émergée de sa bande (ses classes,
     * les plus loin de la mer, sont à l'intérieur des terres), puis le plateau continental, pris à la mer : terre libre =
     * max(0, E − c), mer libre = 1 − max(E, c).
     */
    function surfacesBandes() {
        const a = window.DATA['🗻']['🧮🍰🗻🧊'], S = {};
        const P = window.CALOTTES.parts();
        for (const b of window.CALOTTES.BANDES) {
            const E = P[b.cle].emerge, c = a[b.cle];
            S[b.cle] = { calotte: c, calotteTerre: Math.min(c, E), terre: Math.max(0, E - c), mer: 1 - Math.max(E, c) };
        }
        return S;
    }

    /** [m²/m²] Les mêmes surfaces par ZONE (surfacesBandes), moyennes de ses deux bandes de même aire. */
    function surfacesZones() {
        const B = surfacesBandes(), S = {};
        for (const z of ZONES) S[z.cle] = { calotte: 0, calotteTerre: 0, terre: 0, mer: 0 };
        for (const b of window.CALOTTES.BANDES) {
            for (const k in S[b.zone]) S[b.zone][k] += B[b.cle][k] / 2;
        }
        return S;
    }

    /** Moyenne sur le globe d'une grandeur de bande v(b) (CALOTTES.BANDES) : Σ_b f_b v(b), f_b = (x₁ − x₀)/2 la part du globe de
     *  la bande (la moitié de sa zone). */
    function moyenneBandes(v) {
        let s = 0;
        for (const b of window.CALOTTES.BANDES) s += (b.x1 - b.x0) / 2 * v(b);
        return s;
    }

    /** [m²/m²] Étendue de la glace sur le globe à l'état de DATA, Σ_b f_b [c_b + terre_b t_b,terre + mer_b t_b,mer] : calottes du pas
     *  c_b, terre et mer libres de la bande (surfacesBandes) et part de l'année sous leur glace saisonnière (🍰📅🧊). C'est elle qui
     *  dit si une boule de neige est établie (glace tropicale assombrie, ALBEDO.albedoGlaceSeche) ; lue dans le point fixe comme
     *  dans l'albédo planétaire. */
    function etendueGlace() {
        const S = surfacesBandes(), t = window.DATA['🪩']['🍰📅🧊'];
        return moyenneBandes((b) => S[b.cle].calotte + S[b.cle].terre * t[b.cle].terre + S[b.cle].mer * t[b.cle].mer);
    }

    /** Clic frise : T₂ repart de la condition initiale (NORTH1981.T2_DEPART), pas de l'état laissé par le calcul précédent ; la
     *  forêt des bandes (🗻.🍰🗻🌳) de zéro (le point fixe la pose à sa première itération, puis elle est portée d'un calcul à l'autre). */
    function depuisConfig() {
        window.DATA['🧮']['🌡️🎱'] = NORTH1981.T2_DEPART;
        const F = {};
        for (const b of window.CALOTTES.BANDES) F[b.cle] = 0;
        window.DATA['🗻']['🍰🗻🌳'] = F;
    }

    /**
     * Résout le point fixe glace ↔ gradient sur T₂ = DATA['🧮']['🌡️🎱'], en partant de sa valeur courante, et l'y laisse.
     * Appelé par calculateAlbedo, une fois par calcul, après l'écriture des albédos des matériaux (DATA['🪩🍰']).
     *   colonne : colonne nuageuse du profil du calcul (RADIATIVE.colonneNuageuse) ;
     * le reste se lit dans DATA : T̄ (🧮🌡️, le solveur), obliquité (📜⚾), Soleil (☀️🧲☀️), calottes portées, leur socle et leur
     * date (🗻 : 🍰🗻🧊, 🔺📏🗻🧊, 📿🗻🧊, 📅🗻🧊), l'âge courant (INTERIEUR.ageCourant).
     * Chaque itération calcule à son T₂ les boîtes du cycle saisonnier (SAISONS.cycles), forcées par les colonnes de l'itération
     * précédente, et écrit dans DATA la glace saisonnière de ces boîtes (EARTH.glaceSaisonniere) et les calottes du pas
     * (🧮🍰🗻🧊, 🧮🔺📏🗻🧊, 🧮📿🗻🧊, 🧮⚖️🗻🧊, 🧮🪩🗻🧊) ; à la sortie, ce sont celles de l'état convergé.
     * Itération SIMPLE x ← G(x), sans relaxation, tant que la pente de G est dans [0, 1[ : les rétroactions glace–albédo sont
     * positives (G' ≥ 0), une relaxation ne ferait que ralentir ; et elle n'atteint que les points fixes stables (G' < 1), ceux que
     * la planète peut habiter — une sécante ou un Newton convergeraient aussi vers la racine instable d'une bistabilité. Pente ĝ de
     * la sécante des deux derniers points, 1 + Δ(G(x) − x)/Δx. Quand elle est NÉGATIVE (une calotte intégrée sur un long clic
     * répond par un saut : son bilan intégré n'est pas monotone, elle finit sur une branche ou l'autre), l'itération simple
     * oscille autour du point fixe : pas de Wegstein, x ← x + (G(x) − x)/(1 − ĝ) (Wegstein 1958, Commun. ACM 1(6):9), le point
     * fixe de la sécante — G décroissante n'a qu'une racine, et sur un saut il s'arrête au seuil. Quand elle est ≥ 1, x ← G(x) se
     * traîne loin d'un point fixe instable (G(x) − x garde son signe) : le pas double à chaque itération, x ← x + p (G(x) − x),
     * p = 2, 4, 8… dans le sens de la dérive, jusqu'à encadrer la racine. Dès que la racine est ENCADRÉE (le dernier T₂ où
     * G(x) − x > 0 et le dernier où il est < 0, itérations ≥ 1, mêmes colonnes de départ), DICHOTOMIE : elle converge même quand G
     * saute d'une itération à l'autre (une calotte change de branche), où la sécante tourne en rond. Arrêt quand l'erreur estimée
     * sur T₂, |G(x) − x| / (1 − max(ĝ, 0)), ĝ < 1, passe sous TOLERANCE_K : une pente négative ne réduit pas l'erreur — estimée sur
     * une sécante lointaine, ou à la première itération entre deux applications différentes (colonnes de départ en neige sèche),
     * elle ferait passer |G(x) − x| = 0,15 K pour 0,0008 K à ĝ = −179. Arrêt aussi quand l'encadrement de la racine fait moins de
     * TOLERANCE_K : G saute, le point fixe est à son seuil, connu à la tolérance près. Le T₂ posé est celui où la glace, les
     * co-albédos et les calottes ont été évalués (un seul état). Sans convergence en ITERATIONS_MAX : crash.
     * Renvoie { coAlbedo, Rg, A, RgSoleil, poids, calottes, absorbe, saisons, colonnes, iterations, pente } — A : albédo planétaire au
     * sommet avant voile, Σ_z w_z (1 − a_z), w_z part de l'insolation du globe reçue par la zone (poidsInsolation) : l'albédo que lit
     * le solveur (calculateAlbedo) ; RgSoleil = Σ_z w_z Rg_z —, et T2, dT en lecture de DATA.
     */
    function resoudre(colonne) {
        const DATA = window.DATA, M = DATA['🪩🍰'];
        const J = integralesJ(DATA['📜']['⚾']);
        const Q = quadratureMu(DATA['📜']['⚾']);
        // Soleil de l'époque rapporté à celui des intégrales J (astronomie.SOLAR_CONSTANT) : la constante s'y simplifie.
        const echelle = DATA['☀️']['🧲☀️'] / window.astronomie.SOLAR_CONSTANT;
        const tab = tableColonne(colonne, Q, window.SOLAIRE.facteurRayleigh(), window.SOLAIRE.colonneOzone());
        const L2 = 6 * NORTH1981.D + NORTH1981.B;
        const w = poidsInsolation(DATA['📜']['⚾']);
        const coAlbedo = {}, Rg = {};
        // Part de l'insolation absorbée au sol par une neige sèche (🪩🍰❄️ : seuil de sa fonte), une neige mouillée (🪩🍰🧊) et une glace
        // nue (🪩🍰🏊), aux angles solaires de chaque zone : le τ_a (1 − α_s) de la fonte (CALOTTES.fonteJour), par le transfert solaire
        // du modèle (nuages et vapeur compris) ; et couverture des nuages bas et moyens (recouvrement aléatoire), noirs pour le
        // rayonnement descendant sur la neige.
        const absorbe = { couverture: 1 - (1 - colonne.fBas) * (1 - colonne.fMoyen) };
        for (const z of ZONES) absorbe[z.cle] = { sec: tab[z.cle].S(M['🪩🍰❄️']), neige: tab[z.cle].S(M['🪩🍰🧊']), glace: tab[z.cle].S(M['🪩🍰🏊']) };
        // Surfaces de la planète sans glace (ALBEDO.surfacesSansGlace, la seule) : lave l, part du bassin à sec, terres libres et leur
        // partage forêt / désert / sol — celles de l'albédo planétaire.
        const SG = window.ALBEDO.surfacesSansGlace(), l = SG.lave, lave = l * M['🪩🍰🎾'];
        /**
         * Albédos de surface de chaque bande et co-albédos des colonnes d'un m² de sa calotte, de sa terre libre et de sa mer libre, aux
         * surfaces S (surfacesBandes), à la glace saisonnière de DATA et aux albédos de calotte alb { cle } : { Rg: { zone }, colonnes:
         * { cle: { calotte, terre, mer } } }. Hors calotte, la glace saisonnière de la bande couvre sa mer (glace de mer) et sa terre (neige) chacune
         * pendant sa part e de l'énergie solaire (🍰☀️🧊) et en réfléchit la part r (🍰☀️🪩🧊). La terre libre de chaque bande a
         * l'albédo de ses forêt, désert et sol (ALBEDO.terresLibres, après les calottes) ; la part à sec du bassin (SG.sec) est une
         * terre de la bande, sous sa neige. La lave (part l) couvre toute la bande.
         */
        const surfaces = (S, alb) => {
            const RgB = {}, col = {};
            const TL = window.ALBEDO.terresLibres(SG, S);
            for (const b of window.CALOTTES.BANDES) {
                const e = DATA['🪩']['🍰☀️🧊'][b.cle], r = DATA['🪩']['🍰☀️🪩🧊'][b.cle], sb = S[b.cle];
                const sol = r.terre + (1 - e.terre) * TL[b.cle].albedo;      // un m² de terre libre
                const terre = sb.terre * sol;
                const eau = (1 - SG.sec) * (r.mer + (1 - e.mer) * M['🪩🍰🌊']) + SG.sec * sol;   // un m² de mer libre
                const mer = sb.mer * eau;
                RgB[b.cle] = lave + (1 - l) * (sb.calotte * alb[b.cle] + terre + mer);
                const A = tab[b.zone].A;
                col[b.cle] = { calotte: 1 - A(lave + (1 - l) * alb[b.cle]), terre: 1 - A(lave + (1 - l) * sol), mer: 1 - A(lave + (1 - l) * eau) };
            }
            const RgZ = {};
            for (const z of ZONES) RgZ[z.cle] = 0;
            for (const b of window.CALOTTES.BANDES) RgZ[b.zone] += RgB[b.cle] / 2;
            return { Rg: RgZ, colonnes: col };
        };
        let calottes, saisons, colonnes, k = 0, d, dAvant = NaN, xAvant = NaN, g, pas = 1, xPos = NaN, xNeg = NaN;
        DATA['🗻']['🧮🍰🗻🧊'] = DATA['🗻']['🍰🗻🧊'];              // le pas part des calottes portées (remplacé à la 1ʳᵉ itération)
        // Le pas part sans glace saisonnière : elle n'a pas de mémoire d'un calcul à l'autre (remplacée à la 1ʳᵉ itération).
        for (const cle of ['🍰📅🧊', '🍰☀️🧊', '🍰☀️🪩🧊']) {
            DATA['🪩'][cle] = {};
            for (const b of window.CALOTTES.BANDES) DATA['🪩'][cle][b.cle] = { terre: 0, mer: 0 };
        }
        for (;;) {
            const x = DATA['🧮']['🌡️🎱'];                          // T₂ de l'itération (variable de travail du point fixe)
            // Première itération : colonnes des calottes de départ, en neige sèche, sans glace saisonnière ; ensuite, celles de
            // l'itération précédente.
            if (k === 0) {
                const neigeSeche = {};
                for (const b of window.CALOTTES.BANDES) neigeSeche[b.cle] = M['🪩🍰❄️'];
                colonnes = surfaces(surfacesBandes(), neigeSeche).colonnes;
            }
            // Les trois boîtes de chaque bande (calotte, terre libre, mer libre : moyenne annuelle et réponse au forçage solaire) à ce
            // T₂ ; leur glace saisonnière, latitude par latitude (EARTH.glaceSaisonniere) ; puis les calottes continentales : un point
            // de calotte a la température de point (SAISONS.temperaturePoint) de la boîte calotte de sa bande, sa marge et un sol nu
            // celle de la terre libre, cycle à la date de chaque sous-pas
            // (physics/calottes.js). Tous lisent T₂ = x dans DATA.
            saisons = window.SAISONS.cycles(colonnes);
            window.EARTH.glaceSaisonniere(saisons, absorbe);
            calottes = window.CALOTTES.calculer(saisons, absorbe);
            const aPas = {}, soclePas = {}, sommetPas = {}, albPas = {};
            for (const b of window.CALOTTES.BANDES) {
                aPas[b.cle] = calottes[b.cle].a; soclePas[b.cle] = calottes[b.cle].socle; sommetPas[b.cle] = calottes[b.cle].sommet;
                albPas[b.cle] = calottes[b.cle].albedo;
            }
            DATA['🗻']['🧮🍰🗻🧊'] = aPas;
            DATA['🗻']['🧮🔺📏🗻🧊'] = soclePas;
            DATA['🗻']['🧮📿🗻🧊'] = sommetPas;
            DATA['🗻']['🧮⚖️🗻🧊'] = calottes.masse;
            DATA['🗻']['🧮🪩🗻🧊'] = albPas;
            const sf = surfaces(surfacesBandes(), albPas);
            colonnes = sf.colonnes;
            let H = 0;
            for (const z of ZONES) {
                Rg[z.cle] = sf.Rg[z.cle];
                coAlbedo[z.cle] = 1 - tab[z.cle].A(Rg[z.cle]);
                H += coAlbedo[z.cle] * J[z.cle];
            }
            d = 5 * echelle * H / L2 - x;                           // [K] G(x) − x
            g = 1 + (d - dAvant) / (x - xAvant);                    // pente de G, sécante des deux derniers points (NaN à la première)
            // Encadrement (itérations ≥ 1, mêmes colonnes de départ) : le dernier T₂ où G − x > 0 et le dernier où G − x < 0. Arrêt
            // aussi quand il fait moins de TOLERANCE_K : G saute (une calotte change de branche), le point fixe est à son seuil, connu
            // à la tolérance près.
            if (k > 0) { if (d > 0) xPos = x; else xNeg = x; }
            const encadre = Math.abs(xPos - xNeg);                 // NaN tant qu'un seul signe est vu
            if (d === 0 || (g < 1 && Math.abs(d) / (1 - Math.max(g, 0)) < TOLERANCE_K) || encadre < TOLERANCE_K) break;
            k++;
            if (k === ITERATIONS_MAX) {
                throw new Error('[MERIDIEN] ' + DATA['📅']['📅'] + ' : point fixe glace ↔ gradient non convergé en ' + ITERATIONS_MAX
                    + ' itérations à T̄ = ' + DATA['🧮']['🧮🌡️'].toFixed(3) + ' K — T₂ = ' + x.toFixed(4) + ' K, G(T₂) − T₂ = ' + d.toExponential(3)
                    + ' K, pente estimée ĝ = ' + g.toFixed(3) + ', erreur estimée ' + (Math.abs(d) / (1 - Math.max(g, 0))).toExponential(3)
                    + ' K (tolérance ' + TOLERANCE_K + ' K ; ĝ ≥ 1 : pas de point fixe stable près de T₂)');
            }
            dAvant = d; xAvant = x;
            // Racine encadrée : dichotomie (elle converge même quand G saute d'une itération à l'autre — une calotte qui change de
            // branche ; la sécante y tourne en rond). Sinon : pente négative, pas de Wegstein ; pente ≥ 1, x ← G(x) se traîne loin d'un
            // point fixe instable (G − x garde son signe), le pas double dans le sens de la dérive jusqu'à encadrer la racine ; sinon
            // x ← G(x).
            pas = g >= 1 ? 2 * pas : 1;
            DATA['🧮']['🌡️🎱'] = encadre >= 0 ? (xPos + xNeg) / 2 : (g < 0 ? x + d / (1 - g) : x + pas * d);
        }
        // Albédo planétaire au sommet (avant voile) : la lumière réfléchie par chaque zone, pondérée par l'insolation qu'elle reçoit,
        // A = Σ_z w_z (1 − a_z) ; et l'albédo de surface vu par le Soleil, Σ_z w_z Rg_z.
        let A = 0, RgSoleil = 0;
        for (const z of ZONES) { A += w[z.cle] * (1 - coAlbedo[z.cle]); RgSoleil += w[z.cle] * Rg[z.cle]; }
        const diag = { coAlbedo: coAlbedo, Rg: Rg, A: A, RgSoleil: RgSoleil, poids: w, calottes: calottes, absorbe: absorbe, saisons: saisons,
            colonnes: colonnes, iterations: k + 1, pente: g };
        // T₂ et écarts de zone : lus dans DATA (accesseurs non énumérables, pas des copies).
        Object.defineProperty(diag, 'T2', { get: function () { return DATA['🧮']['🌡️🎱']; } });
        Object.defineProperty(diag, 'dT', { get: function () { return ecarts(); } });
        return diag;
    }

    window.MERIDIEN = { TOLERANCE_K: TOLERANCE_K, NORTH1981: NORTH1981, P2: P2, P2_MOYEN: P2_MOYEN, integralesJ: integralesJ, quadratureMu: quadratureMu,
        poidsInsolation: poidsInsolation, tableColonne: tableColonne, ecarts: ecarts, surfacesBandes: surfacesBandes, surfacesZones: surfacesZones, moyenneBandes: moyenneBandes,
        etendueGlace: etendueGlace,
        depuisConfig: depuisConfig, resoudre: resoudre };
})();
