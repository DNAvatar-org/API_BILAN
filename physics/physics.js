// ============================================================================
// File: API_BILAN/physics/physics.js - Constantes et lois physiques fondamentales
// Desc: module de physique fondamentale
// Version 2.19.2
// - v2.19.2 (2026-11-01): commentaire : ω des trois boîtes de chaque bande.
// - v2.19.1 (2026-10-30): commentaires de la glace saisonnière : terre de chaque latitude, forêt sous la neige.
// - v2.19.0 (2026-10-30): neige des terres masquée par la forêt sous la neige (ALBEDO.foretSousNeige), la même à toutes les latitudes ;
//   la terre de chaque latitude pèse par sa part de terre (SAISONS.cycles).
// Date: [November 1, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Sections efficaces : hitran.js + lignes HITRAN. ΔF = convention affichage → climate.js, pas ici.
// - getH2OVaporEDSScale() — formule T,P,vapor,CO2 (pas d'époque), doc/API/VAPEUR_VS_NUAGES.md
// - Convention : Credence (%) + Plage lit. / écart-type en commentaire pour params tunables (éviter patch en aveugle). v2.0.3.
// - getH2OVaporEDSScale : 1.0→0.70 pour CO2≥400 ppm (cible EDS_H₂O ~72 W/m², lit. ~75).
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// var pour permettre plot.js et main.js de faire var CONST = window.CONST sans erreur
var CONST = window.CONST = {};

// ========== 1. FONDAMENTALES (universelles, sans ref terrestre) ==========
CONST.PLANCK_H = 6.62607015e-34;      // [J·s] Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // [m/s] c, m/s
CONST.BOLTZMANN_KB = 1.380649e-23;    // [J/K] Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // [W/(m²·K⁴)] Stefan-Boltzmann, W/(m²·K⁴)
// Soleil ACTUEL : sa luminosité (valeur nominale de l'UAI) est la seule donnée ; la constante solaire (flux à 1 UA) en découle,
// après CONV (CONST.SOLAR_CONSTANT, plus bas), et la luminosité de l'époque aussi (Gough 1981, convergence/compute.js).
CONST.L_SOLEIL_W = 3.828e26;          // [W] IAU 2015, résolution B3 (L☉ nominale)
CONST.MAX_PLANCK_SAFE = 1e30;         // [W/(m²·sr·m)] Cap Planck (W/(m²·sr·m)) pour workers / transfert radiatif

// ========== 2. PHYSIQUE DURE (propriétés intrinsèques) ==========
CONST.R_GAS = 8.314462618;  // [J/(mol·K)] constante des gaz parfaits, N_A k_B, exacte dans le SI de 2019 (CODATA 2018)
CONST.M_N2 = 0.02801;   // [kg/mol] N₂ kg/mol
CONST.M_O2 = 0.03200;   // [kg/mol] O₂ kg/mol
CONST.M_CO2 = 0.04401;  // [kg/mol] CO₂ kg/mol
CONST.M_CH4 = 0.01604;  // [kg/mol] CH₄ kg/mol
CONST.M_H2O = 0.01802;  // [kg/mol] H₂O kg/mol
CONST.M_O3 = 0.04800;   // [kg/mol] O₃ kg/mol
CONST.M_N2O = 0.04401;  // [kg/mol] N₂O kg/mol
CONST.RHO_WATER = 1000;  // [kg/m³] Densité eau kg/m³
CONST.RHO_EAU_MER = 1025;  // [kg/m³] eau de mer de surface (S = 35 g/kg, ~20 °C ; TEOS-10, IOC et al. 2010)
// ─── POINT TRIPLE DE L'EAU — la condition aux limites de Clausius-Clapeyron ───────────────
// C-C est une équation DIFFÉRENTIELLE : de/dT = L·e/(R_v·T²). L'intégrer donne ln e = −L/(R_v T) + C,
// et cette constante d'intégration doit être fixée par UN point de la courbe de coexistence.
// Ce point est une propriété de la SUBSTANCE, mesurée en laboratoire — pas un ancrage sur le
// climat actuel. C'est toute la différence avec les 288 K qu'on vient de retirer du plafond de vapeur.
//   Point triple de l'eau : 273,16 K et 611,657 Pa (IAPWS ; exact par définition du kelvin avant
//   la réforme SI de 2019, mesuré depuis).
// v-2026-09-23 : P0_WATER valait 611,2 Pa à T0_WATER = 273,15 K, c'est-à-dire la saturation à
//   0 °C — proche du point triple mais ni l'un ni l'autre exactement, et son commentaire annonçait
//   « point triple » sur une valeur qui n'en était pas une.
CONST.T_TRIPLE_WATER = 273.16;      // [K] K   — point triple de l'eau (IAPWS)
CONST.P_TRIPLE_WATER = 611.657;     // [Pa] Pa  — pression de vapeur au point triple (IAPWS)
CONST.L_VAPORIZATION = 2.5e6;  // [J/kg] Chaleur latente vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // [J/(kg·K)] R vapeur d'eau J/(kg·K)
CONST.CP_AIR = 1005;  // [J/(kg·K)] Capacité calorifique air sec J/(kg·K)
// Glace Ih : lues par les calottes (fonte, regel : physics/calottes.js) et par le cycle saisonnier de la mer gelée (physics/saisons.js).
CONST.L_FUSION_GLACE = 3.3355e5;  // [J/kg] chaleur latente de fusion de la glace à 0 °C (CRC Handbook of Chemistry and Physics)
CONST.CP_GLACE = 2096.78;  // [J/(kg·K)] chaleur massique de la glace Ih au point triple (IAPWS R10-06, Feistel & Wagner 2006)
CONST.K_GLACE = 2.24;  // [W/(m·K)] conductivité thermique de la glace Ih au point de fusion (Carnahan et al. 2021, ajustement des mesures)
// Masse volumique de la glace Ih, 916,7 kg/m³ à 0 °C et 1 atm (IAPWS R10-06, Feistel & Wagner 2006) → 917 : lue aussi par les
// cristaux des nuages (radiative/calculations.js) et la masse des calottes (physics/calottes.js, h2o/calculations_h2o.js).
CONST.RHO_GLACE = 917;  // [kg/m³]
// Deux années, deux grandeurs : l'année TROPIQUE règle le cycle des saisons (calendrier de l'orbite, ω des trois boîtes (calotte, terre libre, mer libre),
// P − E et fonte par an, temps de rebond du socle) ; l'année JULIENNE compte les âges (convention de l'UAI : intérieur).
CONST.AN_TROPIQUE_JOURS = 365.2422;  // [jour] année tropique moyenne (365,24219 j, Laskar 1986)
CONST.AN_JULIEN_JOURS = 365.25;      // [jour] année julienne
CONST.T_BOIL = 373.15;  // [K] Ébullition eau 1 atm (K)
CONST.T0_WATER = 273.15;  // [K] K — 0 °C, DÉFINITION de l'échelle Celsius. ⚠️ Ce n'est PAS le point
// triple (273,16 K, cf. CONST.T_TRIPLE_WATER) : l'ancien commentaire le disait à tort.
// C'est aussi le point de fusion de la glace sous 1 atm (point de glace, l'ancienne définition du 0 °C) : la neige tient au sol
// en dessous — seuil de la glace saisonnière des terres (EARTH.glaceSaisonniere ; la mer gèle plus bas, EARTH.T_FREEZE_SEAWATER_K).
// CONST.T_LAVA_START (1000 K) / T_LAVA_COMPLETE (2373 K), sans source, retirées le 2026-10-13 : la surface en fusion suit
// le solidus / liquidus mesurés de la péridotite (INTERIEUR.CONST.T_SOLIDUS / T_LIQUIDUS, Katz 2003).
CONST.LAMBDA_CO2_CENTER = 15.0e-6;   // [m] CO₂ 15 μm
CONST.LAMBDA_H2O_1 = 6.3e-6;  // [m]
CONST.LAMBDA_H2O_2 = 17.0e-6;  // [m]
CONST.LAMBDA_CH4_1 = 7.7e-6;  // [m]

// ========== 3. CONVERSION TEMPÉRATURE (DATA = K ; °C/°F = affichage) ==========
CONST.KELVIN_TO_CELSIUS = CONST.T0_WATER;  // [K] 273.15
CONST.K2C = function (K) { return K - CONST.KELVIN_TO_CELSIUS; };  // [ƒ K → °C]

// ─── 12 CONSTANTES MORTES RETIRÉES le 2026-09-23 ──────────────────────────────────────────
// Définies et jamais lues — ni dans le moteur, ni dans l'interface, ni dans les scripts inline
// des pages. Repérées par la page 🔎 Paramètres (demo/parametres.html), qui signale toute clé à
// zéro lecture. Liste : K2F, LAMBDA_CH4_2, L_V, M_AR, P0_WATER, ALPHA_OCEAN, SCALE_CLOUD,
// CH4_HAZE_RATIO_THRESHOLD, PRECIP_BASE_RATE, PRECIP_CLOUD_SCALE, PRECIP_PRESSURE_SCALE,
// T_NO_POLAR_ICE_K.
//   · L_V faisait double emploi avec L_VAPORIZATION (même grandeur, deux températures).
//   · P0_WATER n'était plus qu'un alias de P_TRIPLE_WATER depuis le passage au point triple.
//   · ALPHA_OCEAN (0,3) et SCALE_CLOUD (0,4) étaient déjà signalées sans source par l'audit —
//     et 0,3 n'est de toute façon pas un albédo d'océan (0,06–0,10 mesurés).
//   · T_NO_POLAR_ICE_K était marquée 🏷️ DEPRECATED par le code lui-même.
// Banc : aucun écart, par construction — rien ne les lisait.
// ========== CONV (convention : unités, références) ==========
var CONV = window.CONV = {};
CONV.AU_M = 1.496e11;  // [m]
CONV.STANDARD_ATMOSPHERE_PA = 101325;  // [Pa]
CONV.molar_mass_air_ref = 0.029;  // [kg/mol]
CONV.SECONDS_PER_DAY = 86400;  // [s]
// Constante solaire : flux du Soleil actuel à 1 UA, L☉ / (4π UA²) = 1 361,1 W/m² (TSI mesurée 1 360,8 ± 0,5, Kopp & Lean 2011).
CONST.SOLAR_CONSTANT = CONST.L_SOLEIL_W / (4 * Math.PI * CONV.AU_M * CONV.AU_M);  // [W/m²]
// État de référence de la paramétrisation de la diffusion de Rayleigh (Lacis & Hansen 1974, éq. 41 : atmosphère standard),
// lu par radiative/solaire.js ; ce n'est pas la masse molaire de repli CONV.molar_mass_air_ref.
CONV.RAYLEIGH_G_REF = 9.80665;      // [m/s²] pesanteur normale (CGPM 1901)
CONV.RAYLEIGH_M_AIR_REF = 0.02897;  // [kg/mol] air sec de l'atmosphère standard
CONV.TAU_VAPOR_GLOBAL_S = 10 * CONV.SECONDS_PER_DAY;  // [s]
CONV.P_ANN_SCALE_MM_AN = 200000;  // [mm/an]
// CONV.O2_REF_MASS (1e18 kg) et CONV.CH4_REF_MASS (1e13 kg) SUPPRIMÉES le 2026-09-22 :
// deux masses de référence sans source (des ordres de grandeur ronds) et surtout **lues nulle
// part** — grep sur tout le projet : zéro usage hors leur propre définition. Du code mort qui
// figurait à l'audit comme deux paramètres sans source de plus.
// CONV.CCN_O2_REF_KG (1,08e18 kg) et CONV.CCN_CH4_REF_KG (5,2e12 kg) SUPPRIMÉES le 2026-09-23,
// avec la formule 🍰💭 qui les consommait (calculations_albedo v1.2.66). Elles normalisaient un
// « proxy CCN » où l'O₂ et le CH₄ pesaient cinq fois le sulfate — or ni l'un ni l'autre n'intervient
// dans l'activation d'un noyau de condensation (théorie de Köhler 1936 ; κ-Köhler, Petters &
// Kreidenweis 2007). Il n'y avait pas de référence à corriger : il n'y avait pas de formule.
// CCN_SULFATE_REF_KG : charge de sulfate de RÉFÉRENCE dans 🍰💭, c'est-à-dire celle d'aujourd'hui —
//   exactement comme CCN_O2_REF_KG (1,08e18 = O₂ préindustriel) et CCN_CH4_REF_KG (5,2e12 ≈ CH₄ moderne).
//   Le terme 0,1 × (⚖️✈/CCN_SULFATE_REF_KG) se lit donc « sulfate relatif à aujourd'hui ».
//   1,05e9 kg SO₄ = nss-sulfate de l'an 2000 (Tsigaridis et al. 2006 ACP 6:5143, Table 5) : la même
//   source que EPOCH['📱']['⚖️✈'], pour que le rapport vaille 1,00 sur l'époque moderne.
//   ⚠️ L'ancienne valeur, 1,0e14, accompagnait le « proxy CCN » de configTimeline (📱 = 8,0e13) ;
//   elle n'avait pas de source et 📱 y donnait 0,80 au lieu de 1,00. Voir configTimeline.js v1.4.89,
//   encadré « MASSES DE SULFATE », et doc/MASSES_SULFATE_PAR_EPOQUE.md.
CONV.CCN_SULFATE_REF_KG = 1.05e9;  // [kg (de SO₄)]
// CONV.H2O_VAPOR_REF (0,01 kg/kg) SUPPRIMÉE le 2026-09-22 : sans source, et morte. Seule trace
// restante, un commentaire de calculations_albedo.js:222 qui dit que la formule qui l'utilisait
// « n'est plus utilisée ». Elle a survécu à sa propre formule.

// ========== EARTH (terrestre : seuils climat, cycle eau, albédos par défaut ; overridable par époque) ==========
// var pour permettre plot.js / main.js de faire var EARTH = window.EARTH sans erreur
var EARTH = window.EARTH = {};

// ─── Zones de latitude (EBM 0D à 3 zones, Budyko-Sellers) ──────────────────────
// Hypothèse physique : T moyenne globale ≠ T locale par latitude. La glace se forme là où la terre ou la mer d'une bande passe sous
// le gel pendant une partie de l'année (EARTH.glaceSaisonniere, cycle des boîtes de physics/saisons.js). 3 zones pondérées par leur
// surface (géométrie sphérique, somme exacte = 1) ; dT_z (> 0 : plus froid que la moyenne) CALCULÉS par le bilan méridien (bloc
// suivant), pas posés.
// ─── ÉCARTS DE TEMPÉRATURE DES ZONES : CALCULÉS (2026-10-13), plus posés par époque ─────────────────────────────────
// Avant : EPOCH['🥶'] = { dT_pol, dT_mid, dT_trop } posés à la main pour chaque époque (moderne +20 / +5 / −5, qui ne sont
// même pas de moyenne nulle et sous-estiment les tropiques de 5,5 K), et une correction d'obliquité ΔS̄(1 − 0,30)/2,0.
// Maintenant : bilan d'énergie méridien diffusif de North, Cahalan & Coakley 1981 (Rev. Geophys. 19:91, éq. 22), solution à
// deux modes T(x) = T̄ + T₂ P₂(x), x = sin(latitude) — physics/meridien.js. L'obliquité y entre par l'insolation exacte.
// T₂ = DATA['🧮']['🌡️🎱'], posé par MERIDIEN.resoudre à chaque calcul d'albédo ; écarts { pol, mid, trop } (dT = T̄ − T_zone)
// lus par MERIDIEN.ecarts(). Au clic frise, MERIDIEN.depuisConfig remet T₂ au gradient MESURÉ de North 1981 (−28,0 °C,
// hémisphère nord), ⟨P₂⟩ = −0,375 / 0,2165 / 0,8080 (MERIDIEN.P2_MOYEN) → dT = −10,5 / +6,1 / +22,6 K : une condition initiale,
// pas un réglage.
// LES ZONES, une seule définition (deux hémisphères) : bornes en x = sin(latitude), part de la surface du globe f = x₁ − x₀
// (géométrie sphérique, Σ f = 1) — tropiques 0–30° (0,500), moyennes latitudes 30–60° (0,366), pôles 60–90° (0,134). Lues par
// le bilan méridien (physics/meridien.js), les bandes des calottes et des boîtes saisonnières (physics/calottes.js, une par
// hémisphère), la glace saisonnière et toute moyenne sur le globe.
EARTH.ZONES = [
    { cle: 'trop', x0: 0, x1: Math.sin(Math.PI / 6) },
    { cle: 'mid', x0: Math.sin(Math.PI / 6), x1: Math.sin(Math.PI / 3) },
    { cle: 'pol', x0: Math.sin(Math.PI / 3), x1: 1 }
];
EARTH.ZONES.forEach(function (z) { z.f = z.x1 - z.x0; });   // [m²/m² (surface de la zone / surface du globe)]
/** Moyenne sur le globe d'une grandeur de zone { pol, mid, trop } : Σ_z f_z v_z. */
EARTH.moyenneGlobe = function (v) {
    var s = 0;
    for (var i = 0; i < EARTH.ZONES.length; i++) s += EARTH.ZONES[i].f * v[EARTH.ZONES[i].cle];
    return s;
};

// ─── Insolation par latitude (Berger 1978, géométrie orbitale) ─────────────────────────────────────────────────────
// La redistribution méridienne de l'insolation par ε (Milankovitch) entre dans le bilan méridien (physics/meridien.js) par
// l'insolation annuelle EXACTE de chaque latitude. Insolation journalière : la seule formule, celle d'astronomie.js
// (insolationJournaliere), sur l'orbite circulaire de l'obliquité courante (EARTH.orbiteCirculaire) pour le bilan méridien.
/** Orbite circulaire d'obliquité eps_deg [°], au format d'astronomie.js (obliquité en radians, e = 0). */
EARTH.orbiteCirculaire = function (eps_deg) {
    return { obliquite: eps_deg * Math.PI / 180, excentricite: 0, varpi: 0 };
};

// ─── GLACE SAISONNIÈRE ─────────────────────────────────────────────────────────────────────────────────────────────────
// Celle de chaque latitude de chaque bande (CALOTTES.BANDES, points de SAISONS.points), à la température d'un point
// (SAISONS.temperaturePoint : sa boîte + T₂ (P₂(x) − ⟨P₂⟩_zone) ; sur la terre, la terre de sa latitude, couplée à la mer de la bande
// par sa part de terre ; sur la mer, la mer de la bande) et au cycle calculé de sa boîte, annuel et semi-annuel (physics/saisons.js :
// bilan d'énergie de North, Cahalan & Coakley 1981 forcé par l'insolation de la date). La terre garde
// la neige tant que T est sous la fusion de la glace (CONST.T0_WATER) ; la mer gèle sous EARTH.T_FREEZE_SEAWATER_K — la glace de Stefan
// de saisons.js, dalle qui change l'impédance de la mer, la seule part gelée de la mer : son aire, son albédo et sa masse
// (H2O.masseGlaceMer). Arc gelé de chaque point sur les nœuds de l'année du bilan des calottes (SAISONS.arc).
// La glace pèse par l'ÉNERGIE solaire qui tombe sur elle (insolation de chaque nœud à la latitude du point, à la date), pas par la part
// du temps. Son ALBÉDO suit la saison nœud par nœud, comme celui d'une calotte (physics/calottes.js, bilanPoint) : neige sèche hors
// fonte (ALBEDO.albedoGlaceSeche) ; pendant la fonte — probabilité de fonte du nœud par la loi des calottes (CALOTTES.fonteJour :
// loi normale des températures journalières de Seguinot & Rogozhina 2014 ; une neige sèche fond le jour où son bilan, sous son
// albédo, atteint la fusion), à l'air du nœud : sur la terre, l'air de la terre de sa latitude au point ; sur la mer, la
// surface de la dalle de glace seule (Tglace de SAISONS.cycles : la couche de mélange de la mer libre voisine n'amortit pas la surface
// d'une banquise) avec son palier de fusion, au plus 0 °C (❔ 🔧 forme choisie en regardant le co-albédo polaire) — neige mouillée 🪩🍰🧊
// sur la part de la saison de fonte que couvre la neige de l'année (P − E de Siler, Roe & Armour 2018 les jours de gel, contre la
// fonte possible : Reeh 1991), puis ce qu'elle découvre : glace nue à mares de fonte 🪩🍰🏊 (Perovich et al. 2002, JGR 107:8044,
// SHEBA) sur la mer — jusqu'à ce que la fonte possible d'une glace nue ait fondu sa masse de Stefan, ρ_i h : la mer est alors libre
// pour le reste de la saison —, le sol 🪩🍰🌍 sur la terre. Sur la terre, la forêt sous la neige (ALBEDO.foretSousNeige, la même à
// toutes les latitudes) masque la neige toute la saison : forêt enneigée 🪩🍰🌳❄️ ; la forêt de chaque latitude (ALBEDO.poserForet :
// part préagricole sous la ligne des arbres de sa saison de croissance, à son arc de l'année) est posée ici, pour la terre libre.
// Sans phase liquide possible (hors d'un monde à océan, H2O.mondeOcean : eau au-dessus
// de son point critique, ou pas d'atmosphère, sous le point triple), la glace ne fond pas, elle se sublime : neige sèche toute l'année.
// ⚠️ Déclaré : neige des terres dès que la surface est sous la fusion, sans bilan de chute et de fonte pour sa présence (la fonte
// n'en règle que l'albédo) ; ⚠️ vent et rugosité du bilan de fonte : ceux du Groenland ouest (calottes) ; ⚠️ 🔧 forêt sous la neige
// la même à toutes les latitudes, forme sans source (ALBEDO.foretSousNeige).
/**
 * Glace SAISONNIÈRE des bandes, aux boîtes saisons = SAISONS.cycles (et leurs arcs gelés) et à l'absorption absorbe du bilan
 * méridien (part de l'insolation absorbée au sol par une neige qui fond, et nuages ; physics/meridien.js) — grandeurs de travail de
 * son itération. La seule du modèle, lue par le bilan méridien (co-albédos de bande), par l'albédo planétaire
 * (albedo/calculations_albedo.js) et par la masse de glace de mer (h2o/calculations_h2o.js). Écrit dans DATA['🪩'], par bande et
 * pour ses terres et sa mer ({ N_pol: { terre, mer }, S_pol, … } ; les lecteurs les pondèrent par la terre et la mer libres de la
 * bande, MERIDIEN.surfacesBandes) :
 *   🍰📅🧊 = part de l'ANNÉE sous la glace — terre : moyenne des points de la bande pondérée par leur part de terre ; mer : g de
 *            saisons.js (moyenne des points) ;
 *   🍰☀️🧊 = part de l'ÉNERGIE solaire annuelle de la bande qui tombe sur la glace, Σ_points w Σ_nœuds S f / Σ w S (w : part de
 *            terre de la latitude sur la terre, 1 sur la mer), moins la fin de
 *            saison de fonte où la glace de mer a fondu (mer libre) ;
 *   🍰☀️🪩🧊 = part de cette énergie que la glace RÉFLÉCHIT, Σ_points w Σ_nœuds S f α / Σ w S, mêmes poids (albédo moyen de la
 *            glace : 🍰☀️🪩🧊 / 🍰☀️🧊).
 * Équilibre du cycle courant, sans inertie d'un calcul à l'autre : seules les calottes ont une mémoire. Sans eau (⚖️💧 = 0, corps
 * noir avant ses météorites), pas de glace.
 */
EARTH.glaceSaisonniere = function (saisons, absorbe) {
    var DATA = window.DATA, BANDES = window.CALOTTES.BANDES, SURFACES = ['terre', 'mer'], temps = {}, energie = {}, reflet = {};
    var i, j, k, b, s, pt;
    if (DATA['⚖️']['⚖️💧'] === 0) {
        for (i = 0; i < BANDES.length; i++) {
            temps[BANDES[i].cle] = { terre: 0, mer: 0 };
            energie[BANDES[i].cle] = { terre: 0, mer: 0 };
            reflet[BANDES[i].cle] = { terre: 0, mer: 0 };
        }
        DATA['🪩']['🍰📅🧊'] = temps;
        DATA['🪩']['🍰☀️🧊'] = energie;
        DATA['🪩']['🍰☀️🪩🧊'] = reflet;
        return;
    }
    for (i = 0; i < BANDES.length; i++) {
        b = BANDES[i];
        var tTerre = 0, pTerre = 0, arcsT = saisons[b.cle].terre.arcs;
        for (j = 0; j < arcsT.length; j++) { tTerre += arcsT[j].poids * arcsT[j].t; pTerre += arcsT[j].poids; }
        tTerre /= pTerre;
        temps[b.cle] = { terre: tTerre, mer: saisons[b.cle].glace };
    }
    DATA['🪩']['🍰📅🧊'] = temps;   // l'étendue de la glace qu'elle donne (MERIDIEN.etendueGlace) règle la glace sèche des tropiques
    var S = window.SAISONS, CK = window.CALOTTES.K, M = DATA['🪩🍰'], T0 = CONST.T0_WATER, n = CK.NOEUDS;
    var o = S.date(window.INTERIEUR.ageCourant()), sol = S.soleil(), insolation = {};
    var h = CONST.AN_TROPIQUE_JOURS / n;   // [jour]
    // Fonte possible : dans un monde à océan seulement (phase liquide), au bilan d'énergie d'une neige qui fond au niveau de la mer.
    var liquide = window.H2O.mondeOcean(), c, seb;
    if (liquide) {
        c = window.CALOTTES.contexte(saisons, absorbe);
        seb = c.seb(DATA['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA);
    }
    for (i = 0; i < BANDES.length; i++) {
        b = BANDES[i];
        var aSec = window.ALBEDO.albedoGlaceSeche(b.zone), ab = absorbe[b.zone];
        // Forêt de chaque latitude de la bande (ALBEDO.poserForet → 🗻.🍰🗻🌳) ; part masquée par la canopée (forêt enneigée 🪩🍰🌳❄️) :
        // la forêt sous la neige sur la terre, rien sur la mer.
        window.ALBEDO.poserForet(b, saisons[b.cle].terre.arcs);
        var fN = window.ALBEDO.foretSousNeige();
        var foret = { terre: saisons[b.cle].terre.arcs.map(function () { return fN; }), mer: saisons[b.cle].mer.arcs.map(function () { return 0; }) };
        energie[b.cle] = {};
        reflet[b.cle] = {};
        for (s = 0; s < SURFACES.length; s++) {
            var aSous = SURFACES[s] === 'mer' ? M['🪩🍰🏊'] : M['🪩🍰🌍'], arcs = saisons[b.cle][SURFACES[s]].arcs;
            var E = 0, R = 0, tot = 0;
            for (j = 0; j < arcs.length; j++) {
                pt = arcs[j];
                var pw = SURFACES[s] === 'mer' ? 1 : pt.poids;   // poids de la latitude : sa part de terre (la mer, à poids égaux)
                var fF = foret[SURFACES[s]][j], aSecS = (1 - fF) * aSec + fF * M['🪩🍰🌳❄️'];
                if (!(pt.lat in insolation)) insolation[pt.lat] = S.noeuds(o, pt.lat, n).map(function (v) { return sol * v; });   // [W/m²]
                var Sn = insolation[pt.lat], sT = 0, sF = 0, sFP = 0, mN = 0, mG = 0, gel = 0;
                for (k = 0; k < n; k++) {
                    sT += Sn[k];
                    sF += Sn[k] * pt.f[k];
                    if (liquide) {
                        // Nœud k, la loi de fonte des calottes (CALOTTES.fonteJour) sur l'air du nœud (°C) : sur la terre, l'air de la
                        // terre de sa latitude au point ; sur la banquise, la surface de la dalle (Tglace) avec son palier de fusion — une glace
                        // qui fond reste à 0 °C, l'excès d'énergie la fond (Maykut & Untersteiner 1971), et l'air d'été au-dessus
                        // d'elle est à ~0 °C (❔ air de la dalle froide = sa surface, sans inversion).
                        var r = window.CALOTTES.fonteJour(SURFACES[s] === 'mer' ? Math.min(pt.Tglace[k] - T0, 0) : pt.T[k] - T0, Sn[k], ab, seb);
                        sFP += Sn[k] * pt.f[k] * r.p;
                        mN += pt.f[k] * h * r.neige;           // [kg m⁻²] fonte possible d'une neige
                        mG += pt.f[k] * h * r.glace;           // [kg m⁻²] … d'une glace nue
                        gel += pt.f[k] * r.gel / n;            // part de l'année gelée et sous 0 °C
                    }
                }
                tot += pw * sT;   // même ordre de sommation que E : sous une glace de toute l'année, E = tot exactement
                E += pw * sF;
                if (liquide) {
                    // Neige de l'année les jours de gel (P − E de Siler à la latitude du point), fondue d'abord ; puis la surface
                    // découverte (Reeh 1991) : part p de la saison de fonte sous la neige. Sur la mer, la glace nue fond ensuite :
                    // sa masse, ρ_i h de Stefan (SAISONS.epaisseurStefan, degrés-jours de gel de l'arc), tient la part
                    // ρ_i h / m_G de la saison (m_G : fonte possible d'une glace nue) ; sur la part w qui reste, la glace a fondu et
                    // la mer est libre (son albédo vient du bilan méridien, hors de la glace). Sans énergie de fonte, rien ne fond.
                    var neige = Math.max(0, c.PmoinsE(pt.x)) * gel, p = neige === 0 ? 0 : Math.min(1, neige / mN);
                    var w = SURFACES[s] === 'mer' && mG > 0 ? Math.max(0, 1 - p - CONST.RHO_GLACE * S.epaisseurStefan(pt.fdd) / mG) : 0;
                    R += pw * (aSecS * sF - (1 - fF) * (aSec - (p * M['🪩🍰🧊'] + (1 - p - w) * aSous)) * sFP);
                    E -= pw * w * sFP;
                } else {
                    R += pw * aSecS * sF;
                }
            }
            energie[b.cle][SURFACES[s]] = E / tot;
            reflet[b.cle][SURFACES[s]] = R / tot;
        }
    }
    DATA['🪩']['🍰☀️🧊'] = energie;
    DATA['🪩']['🍰☀️🪩🧊'] = reflet;
};
EARTH.EVAPORATION_E0 = 0.001;  // [kg/(m²·s)]
EARTH.EVAPORATION_T_REF = 288;  // [K]
EARTH.EVAPORATION_T_SCALE = 20;  // [K]
/** Cap vapeur dynamique Clausius-Clapeyron (ERA5/AIRS). calculations_h2o.js : c_c_max = REF × exp(RATE × (T - T_REF)). */
// ─── PLAFOND DE VAPEUR : plus de Clausius-Clapeyron linéarisée ────────────────────────────
// Supprimés le 2026-09-22 :
//   EARTH.H2O_VAPOR_CAP_REF                  = 0,0065 kg/kg
//   EARTH.H2O_VAPOR_CAP_RATE_PER_K           = 0,065  K⁻¹
//   EARTH.H2O_VAPOR_REALISTIC_MAX_REF        = 0,0052 kg/kg
//   EARTH.H2O_VAPOR_REALISTIC_MAX_RATE_PER_K = 0,013  K⁻¹
// Les deux premiers étaient les paramètres SANS SOURCE les plus sensibles du modèle (3,46 °C et
// 1,43 °C à +10 % au banc). Ils écrivaient :
//     c_c_max = 0,0065 · exp[ 0,065 · (T − 288) ]
// Or, avec les constantes de ce fichier :
//     L/(R_v·T²) à 288 K = 0,06531 K⁻¹   ← c'est le 0,065, à 0,5 % près
//     q_sat(288 K, 1 atm) = 0,010430 kg/kg ; 0,0065 / q_sat = 0,623
// Autrement dit ce n'étaient pas deux paramètres mais **Clausius-Clapeyron linéarisée autour de
// 288 K**, multipliée par un rapport constant. Une équation déguisée en constantes, et un modèle
// ancré sur la Terre d'aujourd'hui — juste à 288 K (+2 %), faux partout ailleurs :
//     −56 °C (⛄) : +376 %   ·   0 °C : +8 %   ·   +80 °C : +119 %
// C'est exactement là que ce modèle travaille.
//
// Remplacé par la C-C EXACTE, que calculations_h2o.js calculait déjà deux lignes plus haut
// (`max_vapor_mass_fraction` = q_sat, via calculateSaturatedVaporPressure). Il ne reste qu'un
// nombre, celui-ci, et il a un sens physique explicite au lieu d'être caché dans un exposant.
//
// H2O_SURFACE_RH_01 : HUMIDITÉ RELATIVE À LA SURFACE, sans dimension, dans [0,1].
//   q(surface) = H2O_SURFACE_RH_01 × q_sat(T_surface, P_surface)
// Le suffixe _01 dit la plage, comme seaIceStrength01 / iceImpactFactor01 ailleurs dans le projet.
// ⚠️ v-2026-09-23 : renommée depuis H2O_COLUMN_SAT_RATIO, qui était un CONTRESENS. 🍰🫧💧 est
// produite à la température ET à la pression de SURFACE ; ce rapport est donc une humidité
// relative de surface, pas un rapport de colonne. L'erreur de nom avait produit une erreur
// d'analyse (comparaison à 0,232, un rapport de colonne) — voir
// doc/DIAGNOSTIC_RETROACTION_VAPEUR.md § « la deuxième erreur, trouvée sur commande ».
// v-2026-10-13 : 0,623 n'avait pas de source (0,0065/q_sat(288 K), le 0,0065 venait de nulle part). Remplacé par la
// MESURE : humidité relative de surface moyenne globale 0,70–0,75 (ERA5, repère déjà noté ici) ; 0,77 dans le profil
// observé de Manabe & Wetherald (1967). ⚠️ FOURCHETTE 0,70–0,77 → milieu 0,735. Elle ancre aussi le profil
// d'humidité moyenne en altitude (radiative/calculations.js, EARTH.NUAGES.MW_P_RESIDU).
// → jauge SUBTIL : DATA['🎚️'].H2O.H2O_SURFACE_RH_01 (fine_tuning_bounds.js, fourchette 0,70–0,77), 2026-10-13.
// H2O_SURFACE_RH_INIT_01 (0,4986, SANS SOURCE, second plafond de la même grandeur en fin d'Init) retiré le
// 2026-10-13 : l'Init lit la même référence H2O_SURFACE_RH_01.
// EARTH.IRIS_STRENGTH / _T_SCALE_K / _FACTOR_MIN (« calib 2025 ») retirés le 2026-10-13 : ils divisaient la vapeur par
// 1 + 0,02·(T − 288)/10 et coupaient la rétroaction de la vapeur ; l'iris de Lindzen porte sur les nuages.
EARTH.T_FREEZE_SEAWATER_K = 271.15;  // [K]
EARTH.T_WATER_CYCLE_MIN_C = -10;  // [°C]
EARTH.T_WATER_CYCLE_MAX_C = 150;  // [°C]
EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1;  // [K/atm]
EARTH.T_WATER_CYCLE_MARGIN_GEL_K = 5;  // [K]
EARTH.T_WATER_CYCLE_EVAP_LOW_K = 323.15;  // [K]
EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM = 5;  // [K/atm]
/** Seuils pour recalcul partition eau (calculations_h2o.js) : recalcul seulement si ΔT > DELTA_T_K ou ΔP > DELTA_P_ATM. */
EARTH.WATER_PARTITION_DELTA_T_K = 5;  // [K]
EARTH.WATER_PARTITION_DELTA_P_ATM = 1;  // [atm]
/** Précip convective (calculations_h2o.js) : facteur temp = (T / T_REF)^EXP_T, facteur RH = (RH / RH_REF)^EXP_RH. Lit. Held & Soden 2006, IPCC AR6 ; réponse précip plus lente que C-C. */
EARTH.PRECIP_CONVECTIVE_T_REF_K = 288;   // [K] T ref (réutilise EVAPORATION_T_REF)
EARTH.PRECIP_CONVECTIVE_T_EXPONENT = 1.2; // [sans dimension (exposant)] adouci vs C-C (~7%/K) pour éviter sur-assèchement
EARTH.PRECIP_CONVECTIVE_RH_REF = 0.7;    // [Pa/Pa (humidité relative)] seuil RH convective typique (~70 %)
EARTH.PRECIP_CONVECTIVE_RH_EXPONENT = 1.0; // [sans dimension (exposant)] exposant facteur humidité
// EARTH.H2O_EDS_SCALE (multiplicateur de κ_H₂O, 0,60–1,00 au barycentre) retiré le 2026-10-13 : continuum, profil
// d'humidité et diffusivité codés, le ciel clair moderne tombe juste sans lui (fine_tuning_bounds v1.5.1).

// EARTH.CH4_EDS_SCALE (facteur sur κ_CH₄, 1,0, « tunable [0,3 ; 1,5] pour caler EDS_CH4 sur Haqq-Misra 2008 ») retiré le
// 2026-10-13 : un multiplicateur-identité posé sur le raie par raie, dont la plage déclarée était un calage.

// EARTH.CIA_CO2_SCALE (1e-2, « ×100 TEST » du 2026-07-15) retiré le 2026-10-13 avec le profil inventé qu'il multipliait
// (radiative/calculations.js, en-tête CIA). La CIA mesurée (HITRAN CIA) reste à brancher.

// ─── Seuil de brume organique (Haqq-Misra 2008 Fig. 1) ─────────────────────────
// Rapport molaire CH4/CO2 au-delà duquel le méthane polymérise en Tholin (brume organique)
// qui absorbe le SW en stratosphère → anti-greenhouse. Au-dessous : pas de brume.
// Seuil Haqq-Misra 2008 : 0.1. NB : modèles plus récents (Arney et al. 2016) suggèrent plutôt 0.2.
// Actuellement INFORMATIF UNIQUEMENT — non-lu par le worker spectral. Hook futur pour SW haze.

// ─── CONTINUUM H₂O : MT_CKD 4.3 (data/mtckd_h2o.js, radiative/calculations.js → tablesContinuum), dans la convention de
// ses raies (±25 cm⁻¹ moins la plinthe, spectroscopy/hitran.js). Il remplace Roberts et al. 1976, 44 % plus fort dans la
// fenêtre à 1000 cm⁻¹ et limité à 400–1250 cm⁻¹ (validation et sonde RTMIP du 2026-11-06, doc/CONSTATS.md C9).

// ─── FACTEUR DE DIFFUSIVITÉ ─────────────────────────────────────────────────────────────────────────────────────────
// Le transfert est calculé en flux, pas en luminance : un rayonnement isotrope qui traverse une couche d'épaisseur
// optique VERTICALE τ est transmis en 2E₃(τ) ≈ exp(−D·τ), D = 1,66 (Elsasser 1942 ; Goody & Yung 1989, Atmospheric
// Radiation §2.5 ; Liou 2002). Sans lui, chaque couche est traitée comme si tout le flux montait à la verticale :
// l'atmosphère paraît 1,66 fois trop transparente. Équation (angle moyen d'un flux isotrope), pas un réglage.
EARTH.DIFFUSIVITE = 1.66;  // [-]

// ─── NUAGES : nuage ADIABATIQUE de la parcelle, limité par la pluie ; fraction mesurée ──────────────────────────────
// La parcelle sature au niveau de condensation (base), son excès d'eau condense en montant ; les gouttes grossissent
// jusqu'au rayon d'initiation de la pluie (14 µm), où le nuage précipite (sommet). Épaisseur, eau et τ sortent de là.
// Essais rejetés (2026-10-13) : Ackerman & Marley 2001 (colonne 1D saturée de la base à la tropopause, W ≈ 2 kg/m²,
// 20× la mesure) ; schéma statistique de Sommeria & Deardorff (nuages étalés sur 5 km, eau dans le nuage 0,5–1,3 kg/m²).
// Dans les deux cas il manque l'INVERSION qui coupe les vrais nuages : c'est de la dynamique 3D, hors d'un modèle 1D.
EARTH.NUAGES = {   // [objet — unité de chaque champ sur sa ligne]
    // Humidité relative MOYENNE du gaz (le nuage n'en dépend pas) : Manabe & Wetherald (1967, J. Atmos. Sci. 24:241),
    // loi tirée des observations, standard des modèles radiatifs-convectifs 1D : r̄ = RH_s · (p/p_s − 0,02) / (1 − 0,02),
    // RH_s = humidité de surface du modèle (H2O_SURFACE_RH_01). ⚠️ MESURE (forme), pas une équation de la physique.
    MW_P_RESIDU: 0.02,         // [-]
    // La loi est celle d'une atmosphère dont la tropopause est à σ_t,réf ; quand la troposphère s'épaissit (tropopause à
    // température fixée, plus haut), le profil se déplace avec elle : radiative/calculations.js la lit à
    // σ* = 1 − (1 − σ)·(1 − σ_t,réf)/(1 − σ_t), σ_t tropopause du profil (humidité relative presque invariante à pression
    // fixée dans la basse troposphère, champs de la haute troposphère décalés vers le haut avec la tropopause : Sherwood et al.
    // 2010, JGR 115:D09104 ; Singh & O'Gorman 2012, J. Clim. 25:8259). Tenue à σ fixé, la loi ferait tendre l'humidité
    // relative vers zéro aux niveaux d'émission de la vapeur d'un climat chaud. σ_t,réf : tropopause de l'atmosphère standard US 1976
    // (11 km, 226,32 hPa sur 1 013,25).
    MW_SIGMA_TROPOPAUSE: 22632.1 / CONV.STANDARD_ATMOSPHERE_PA,   // [-]
    // Masses volumiques de l'eau liquide et de la glace des gouttes et des cristaux : CONST.RHO_WATER et CONST.RHO_GLACE.
    // ─── Gouttes liquides : rayon effectif de Martin, Johnson & Spice (1994, J. Atmos. Sci. 51:1823), mesures avion
    //     en stratocumulus : r_eff³ = 3·LWC / (4π ρ_w k N). k = (r_volumique / r_eff)³ dépend de la masse d'air :
    K_MARTIN_OCEAN: 0.80,      // [-] masse d'air maritime (Martin et al. 1994)
    K_MARTIN_CONTINENT: 0.67,  // [-] masse d'air continentale (Martin et al. 1994)
    //     N = nombre de gouttes. Sur océan, il est une JAUGE (DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3, fourchette MODIS
    //     de Bennartz 2007) ; sur continent, valeur typique des mesures avion (Gultepe & Isaac 2004, QJRMS 130, doi:10.1256/qj.03.120 :
    //     ~100 cm⁻³ maritime, ~200 cm⁻³ continental). Les deux sont la Terre actuelle : le rapport de CCN de l'époque
    //     (ALBEDO.rapportCCN, loi sulfate de McCoy 2018) les multiplie — Twomey sort alors seul, r_eff ∝ N^(−1/3).
    CDNC_CONTINENT_CM3: 200,   // [cm⁻³]
    // ─── Pluie : les gouttes coalescent et précipitent dès que leur rayon effectif atteint ~13–14 µm (seuil MESURÉ
    //     d'initiation de la pluie chaude : Rosenfeld & Gutman 1994, Atmos. Res. 34:259 ; Freud & Rosenfeld 2012,
    //     GRL 39:L12803 ; Braga et al. 2021, ACP 21:14079). Avec Martin et al., l'eau liquide qu'un nuage peut garder
    //     est donc LWC_pluie = (4π/3) ρ_w k N r_pluie³ ; au-delà elle tombe. Plus de gouttes → nuage plus chargé
    //     avant de pleuvoir. Le seuil est une JAUGE mesurée : DATA['🎚️'].CLOUD_SW.R_EFF_PLUIE (13 µm Braga et al. 2021,
    //     14 µm Rosenfeld & Gutman 1994 / Freud & Rosenfeld 2012).
    // ─── Glace : pas de loi physique simple de la taille des cristaux (habitus, agrégation). ⚠️ FOURCHETTE de mémoire
    //     des rayons effectifs MODIS de la glace, ~20–40 µm (King et al. 2013 fig. 13–14, à relever) → 30 µm.
    R_EFF_GLACE: 30e-6,        // [m]
    // ─── Phase : partition linéaire liquide/glace entre −40 °C et 0 °C (Hu & Stamnes 1993, J. Climate 6:728) ; tout liquide à
    //     0 °C, CONST.T0_WATER.
    T_TOUT_GLACE: 233.15,      // [K]
    // ─── Diffusion solaire : facteur d'asymétrie des gouttes dans le visible (Hansen & Travis 1974, Space Sci. Rev.
    //     16:527 ; Lacis & Hansen 1974, J. Atmos. Sci. 31:118). Réflectance deux-flux d'un nuage conservatif :
    //     R = √3(1−g)τ / (2 + √3(1−g)τ) = 0,13 τ / (1 + 0,13 τ) pour g = 0,85.
    G_ASYMETRIE: 0.85,         // [-]
    // ─── FRACTIONS — MESURÉES, pas prévisibles en 1D (Windsor et al. 2022 §3.2) : jauges FROID (F_BAS) et CHAUD (F_HAUT)
    //     dans DATA['🎚️'].CLOUD_SW (fine_tuning_bounds.js, GEWEX 2024).
    // ─── Nuages MOYENS (altocumulus, altostratus, nimbostratus : sommet entre 440 et 680 hPa, ISCCP). Fraction en colonne,
    //     nuages masqués compris, MESURÉE comme F_BAS et F_HAUT : CAMcol = 0,23 ± 0,03 (Stubenrauch et al. 2024, Surv. Geophys.
    //     45:1999, ISCCP-CVL ; CloudSat-CALIPSO 0,26–0,31). Niveau : milieu de 440–680 hPa rapporté à la surface actuelle,
    //     σ = p/p_s = 560/1013,25 (autre pression de surface : même σ). Recouvrement aléatoire avec les nuages bas et hauts.
    //     ⚠️ Épaisseurs optiques : la POPULATION des nuages bas (même parcelle, mêmes τ ; τ moyen ≈ 10, dans la classe
    //     altostratus ISCCP 3,6–23) — pas de microphysique propre aux nuages moyens (phase mixte plus froide), déclaré.
    // ─── Nuages HAUTS (enclumes et cirrus) : glace au niveau T_ENCLUME du profil (sortie de la convection). Épaisseur optique visible : une enclume naît opaque et
    //     s'amincit à mesure que la glace tombe ; à amincissement exponentiel, une population en régime établi a ln τ
    //     uniformément réparti. CALIPSO (Stubenrauch et al. 2024 §3.1) : sur 0,37 de nuages hauts, 0,13 ont τ < 0,3, 0,15
    //     entre 0,3 et 3 et 0,09 sont opaques (τ ≳ 3). Bornes [τ_min, τ_max] de ln τ uniforme qui donnent ces trois parts :
    //     ln(τ_max/τ_min) = ln 10 · 0,37/0,15 ; τ_min = 0,3·e^(−(0,13/0,37)·ln(τ_max/τ_min)) ; τ_max = 3·e^((0,09/0,37)·ln(τ_max/τ_min)).
    // Altitude des enclumes : la convection se détend là où la vapeur devient trop rare pour refroidir l'air par
    // rayonnement ; ce niveau est fixé par la pression de vapeur saturante, donc par une TEMPÉRATURE (« fixed anvil
    // temperature », Hartmann & Larson 2002, GRL 29:1951). ⚠️ MESURE posée EN ATTENDANT le niveau calculé par le modèle (là où
    // la subsidence de ciel clair converge le plus, Zelinka & Hartmann 2010 : en cours) : température d'émission des sommets des nuages
    // hauts (P_c < 440 hPa), (⟨a·T_c⁴⟩/⟨a⟩)^¼ pondérée par leur quantité vue d'en haut et l'aire, ISCCP-H 2010 (12 mois,
    // Young et al. 2018) : 226,3 K sur le globe (tropiques 225,1, latitudes moyennes 228,9, pôles 222,0). Si la tropopause
    // est plus chaude, l'enclume est à la tropopause.
    T_ENCLUME: 226.3,          // [K]
    TAU_HAUT_MIN: 0.0408,      // [-]
    TAU_HAUT_MAX: 11.9,        // [-]
    F_MOYEN: 0.23,             // [m²/m²] Stubenrauch et al. 2024 (CAMcol, ISCCP-CVL)
    SIGMA_MOYEN: 560 / 1013.25 // [-] p/p_s du niveau des nuages moyens (milieu de 440–680 hPa)
    // Contrôles (pas des entrées) : MODIS 0,67 (King et al. 2013) ; effets nuages CERES −47 (SW) / +26–28 (LW) W/m².
};
// Albédo d'une mer PLANE : réflexion de Fresnel de la lumière non polarisée à l'interface air–eau d'indice n,
//   R(μ) = ½ (r_s² + r_p²), r_s = (μ − n μ_t)/(μ + n μ_t), r_p = (n μ − μ_t)/(n μ + μ_t), μ_t = √(1 − (1 − μ²)/n²),
// moyennée sur le disque éclairé, ∫₀¹ R(μ) 2μ dμ (la même intégrale qu'en lumière diffuse isotrope) : 0,066 pour n = 1,333.
// n de l'eau MESURÉ au laboratoire (Hale & Querry 1973, Appl. Opt. 12:555 : 1,333 à 589 nm). ⚠️ DÉCLARÉ : mer plane — les
// vagues et la lumière rétrodiffusée sous la surface ne sont pas comptées ; une seule valeur pour tous les μ₀. Contrôle 🎯 :
// mesures d'avion 0,057 en moyenne sur le disque (Taylor et al. 1996), 0,06 en lumière diffuse (Briegleb et al. 1986).
EARTH.INDICE_EAU = 1.333;   // [-]
EARTH.albedoFresnel = function (n) {
    var N = 2000, s = 0;
    for (var k = 0; k < N; k++) {
        var mu = (k + 0.5) / N, mut = Math.sqrt(1 - (1 - mu * mu) / (n * n));
        var rs = (mu - n * mut) / (mu + n * mut), rp = (n * mu - mut) / (n * mu + mut);
        s += (rs * rs + rp * rp) * mu / N;
    }
    return s;
};
EARTH['🪩🍰'] = {
    // 🌊 = océan libre : Fresnel (ci-dessus).
    '🪩🍰🎾': 0.05, '🪩🍰🌊': EARTH.albedoFresnel(EARTH.INDICE_EAU), '🪩🍰🌳': 0.17, '🪩🍰🏜️': 0.30,
    '🪩🍰🧊': 0.70, '🪩🍰🌍': 0.18,
    // ⛅ retiré (2026-10-12) : la réflectance du nuage n'est plus une constante réglée (0,42) mais le résultat du
    // condensat calculé (deux-flux, EARTH.NUAGES) — DATA['🪩']['🪩🍰⛅'].
    // ❄️ = neige propre profonde (T_polaire ≤ −30 °C) — Warren & Wiscombe (1980) J. Atmos. Sci. 37:2734 ;
    // Warren (1982) Rev. Geophys. 20:67. Plage pristine snow 0.80–0.90 ; 0.85 = médiane broadband.
    '🪩🍰❄️': 0.85,
    // 🏊 = bare ice + melt ponds (segment haut Briegleb, T ≥ 0 °C) — Perovich (2002) SHEBA ; Briegleb et al. NCAR/TN-463 §5.
    '🪩🍰🏊': 0.50,
    // 🌳❄️ = forêt enneigée : la canopée masque la neige du sol. ⚠️ FOURCHETTE MESURÉE, milieu : canopée boréale enneigée ~0,2–0,3
    // (Robock 1980, Mon. Weather Rev. 108:267 ; Betts & Ball 1997, JGR 102:28901 ; Qu & Hall 2007, J. Climate 20:3971) → 0,25.
    '🪩🍰🌳❄️': 0.25
};

// ========== STATE (état solver partagé) ==========
var STATE = window.STATE = {};

// ========== PHYS (fonctions de physique exposées) ==========
var PHYS = window.PHYS = {};

// NOTE : C_MAX_CLOUD et ETA_CLOUD ne sont PAS des constantes universelles
// Elles dépendent de la pression atmosphérique, composition, gravité, température
// Elles sont calculées dynamiquement dans calculateCloudFormationIndex() ou calculateAlbedo()

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
// - Cap numérique : pour T très élevé (ex. Hadéen 2450 K) et λ court, term1/term2 peut overflow → plafonner
// Réf : Tiesinga, Mohr, Newell & Taylor 2021, Rev. Mod. Phys. 93:025010 (h, k_B de CODATA 2018) — doc/equation.html#eq-loi-planck
function planckFunction(lambda, T) {
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    const B = term1 / term2;   // term2 = +∞ (λT très petit) → B = 0, la vraie limite
    return Math.min(B, CONST.MAX_PLANCK_SAFE); // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

PHYS.planckFunction = planckFunction;

// ═══ EAU : COURBE DE SATURATION (IAPWS) ═══════════════════════════════════════════════════════
// Une seule loi p_sat(T), mesurée, du froid polaire au point critique — plus de Clausius-Clapeyron à L constante
// (valide près de 273 K, fausse de +8 % à 330 K et sans objet au-delà de 647 K).
//   · liquide–vapeur, 273,16 K ≤ T < T_c : Wagner & Pruss 2002, J. Phys. Chem. Ref. Data 31:387, éq. 2.5
//       ln(p/p_c) = (T_c/T)·(a₁τ + a₂τ^1,5 + a₃τ³ + a₄τ^3,5 + a₅τ⁴ + a₆τ^7,5),  τ = 1 − T/T_c
//   · glace–vapeur, T < 273,16 K : Wagner, Riethmann, Feistel & Harvey 2011, J. Phys. Chem. Ref. Data 40:043103, éq. 6
//       ln(p/p_t) = θ⁻¹·Σ aᵢ θ^bᵢ,  θ = T/T_t
//   · T ≥ T_c : il n'existe plus de liquide — aucune pression ne fait condenser l'eau (p_sat = +∞).
const EAU = {
    T_C: 647.096,          // [K]  point critique, IAPWS-95 (Wagner & Pruss 2002)
    P_C: 22.064e6,         // [Pa] point critique, IAPWS-95
    A: [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502],   // [-] Wagner & Pruss 2002
    N: [1, 1.5, 3, 3.5, 4, 7.5],
    SA: [-21.2144006, 27.3203819, -6.10598130],    // [-] Wagner et al. 2011
    SB: [0.00333333333, 1.20666667, 1.70333333]
};
PHYS.EAU = EAU;

// Réf : Wagner & Pruß 2002, J. Phys. Chem. Ref. Data 31:387 ; Wagner, Riethmann, Feistel & Harvey 2011, J. Phys. Chem. Ref. Data 40:043103 — doc/equation.html#eq-pression-vapeur-saturante-eau
/** [Pa] Pression de vapeur saturante de l'eau à T [K] (sur glace sous le point triple). +∞ au-delà de T_c. */
function pSatEau(T) {
    if (T >= EAU.T_C) return Infinity;
    if (T >= CONST.T_TRIPLE_WATER) {
        const tau = 1 - T / EAU.T_C;
        let f = 0;
        for (let i = 0; i < 6; i++) f += EAU.A[i] * Math.pow(tau, EAU.N[i]);
        return EAU.P_C * Math.exp(EAU.T_C / T * f);
    }
    const th = T / CONST.T_TRIPLE_WATER;
    let s = 0;
    for (let i = 0; i < 3; i++) s += EAU.SA[i] * Math.pow(th, EAU.SB[i]);
    return CONST.P_TRIPLE_WATER * Math.exp(s / th);
}
PHYS.pSatEau = pSatEau;

/** [Pa] Saturation sur EAU LIQUIDE, y compris surfondue sous le point triple : Murphy & Koop 2005 (QJRMS 131:1539,
 *  éq. 10, valable 123–332 K) ; au-dessus du point triple, IAPWS (pSatEau). Sert aux humidités relatives MESURÉES,
 *  que les radiosondes donnent par rapport à l'eau liquide, même sous 0 °C (convention de l'OMM). */
function pSatLiquide(T) {
    if (T >= CONST.T_TRIPLE_WATER) return pSatEau(T);
    return Math.exp(54.842763 - 6763.22 / T - 4.210 * Math.log(T) + 0.000367 * T
        + Math.tanh(0.0415 * (T - 218.8)) * (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T));
}
PHYS.pSatLiquide = pSatLiquide;

/** [1/K] d(ln p_sat)/dT sur l'EAU LIQUIDE, dérivée analytique de pSatLiquide : Murphy & Koop 2005 éq. 10 sous le point triple,
 *  IAPWS au-dessus (dLnPSatEau). Une seule phase de part et d'autre du point triple : pas de saut de pente au gel. */
function dLnPSatLiquide(T) {
    if (T >= CONST.T_TRIPLE_WATER) return dLnPSatEau(T);
    const a = 0.0415 * (T - 218.8), th = Math.tanh(a);
    return 6763.22 / (T * T) - 4.210 / T + 0.000367
        + 0.0415 * (1 - th * th) * (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T)
        + th * (1331.22 / (T * T) - 9.44523 / T + 0.014025);
}
PHYS.dLnPSatLiquide = dLnPSatLiquide;


// Réf : Wagner & Pruß 2002, J. Phys. Chem. Ref. Data 31:387 ; Wagner, Riethmann, Feistel & Harvey 2011, J. Phys. Chem. Ref. Data 40:043103 — doc/equation.html#eq-pression-vapeur-saturante-eau
/** [1/K] d(ln p_sat)/dT, dérivée analytique des deux mêmes formules (T < T_c). */
function dLnPSatEau(T) {
    if (T >= CONST.T_TRIPLE_WATER) {
        const tau = 1 - T / EAU.T_C;
        let f = 0, df = 0;
        for (let i = 0; i < 6; i++) {
            f += EAU.A[i] * Math.pow(tau, EAU.N[i]);
            df += EAU.A[i] * EAU.N[i] * Math.pow(tau, EAU.N[i] - 1);
        }
        return -EAU.T_C * f / (T * T) - df / T;
    }
    const th = T / CONST.T_TRIPLE_WATER;
    let d = 0;
    for (let i = 0; i < 3; i++) d += EAU.SA[i] * (EAU.SB[i] - 1) * Math.pow(th, EAU.SB[i] - 2);
    return d / CONST.T_TRIPLE_WATER;
}
PHYS.dLnPSatEau = dLnPSatEau;

/** [K] Température de saturation à la pression partielle de vapeur p [Pa] (inverse de pSatEau, dichotomie sur
 *  la courbe monotone). p ≥ p_c : l'eau ne condense à aucune température → −∞ (aucune contrainte). */
function tSatEau(p) {
    if (p >= EAU.P_C) return -Infinity;
    let lo = 50, hi = EAU.T_C;   // 50 K : bas du domaine de Wagner et al. 2011
    for (let k = 0; k < 60; k++) {
        const mid = 0.5 * (lo + hi);
        if (pSatEau(mid) < p) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
}
PHYS.tSatEau = tSatEau;

/**
 * L'eau peut-elle être LIQUIDE à la surface ? Non si T ≥ T_c, ou si la pression de vapeur que donnerait TOUTE l'eau
 * en l'air n'atteint pas la saturation à T (rien ne peut condenser : l'océan s'évapore entièrement). C'est l'état
 * de phase, pas un réglage : océan de magma, atmosphère de vapeur post-impact, emballement.
 * Masses : DATA['⚖️'] (⚖️🫧 = air SEC) ; surface et gravité de l'époque, comme ATM.calculatePressureAtm.
 */
function eauSansLiquide() {
    const DATA = window.DATA;
    const m = DATA['⚖️'];
    if (!(m['⚖️💧'] > 0)) return false;                 // pas d'eau : aucune phase à trancher
    const T = DATA['🧮']['🧮🌡️'];
    if (T >= EAU.T_C) return true;
    const aire = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);
    const nEau = m['⚖️💧'] / CONST.M_H2O;
    const nSec = m['⚖️🏭'] / CONST.M_CO2 + m['⚖️🐄'] / CONST.M_CH4 + m['⚖️🫁'] / CONST.M_O2 + m['⚖️💨'] / CONST.M_N2;
    const pToutVapeur = (m['⚖️💧'] + m['⚖️🫧']) * DATA['📅']['🍎'] / aire;   // [Pa] pression totale, toute l'eau en l'air
    return pSatEau(T) >= pToutVapeur * nEau / (nEau + nSec);
}
PHYS.eauSansLiquide = eauSansLiquide;

// ✅ HAUTEUR D'ÉCHELLE DE LA VAPEUR SATURÉE (régime avec océan) :
// - La vapeur suit la saturation le long du gradient Γ : p_v(z) = p_sat(T₀ − Γz)
//   ⇒ d(ln p_v)/dz = −Γ · d(ln p_sat)/dT  ⇒  H_vap = 1 / (Γ · d ln p_sat/dT), dérivée IAPWS ci-dessus.
// - C'est la forme exacte de R·T²/(L·Γ) : Clausius-Clapeyron n'est que l'approximation d(ln p_sat)/dT ≈ L/(R_v T²),
//   avec L de Bolton (1980) valide ~200–400 K. Ici, valide jusqu'au point critique (647 K) : l'ancienne borne
//   « T < 600 K, au-delà non modélisé » tombe. Au-delà, il n'y a plus de vapeur saturée — c'est le régime
//   eauSansLiquide(), qui a son propre profil (radiative/calculations.js, profilVapeurSeule).
// - Γ = gradient de la parcelle de surface, loi adiabatique du profil (RADIATIVE.gradientSurface : sèche, c_p du mélange de JANAF),
//   le même que temperatureAtZ. Terre moderne (288 K) : Γ ≈ 9,7 K/km, H_vap ≈ 1,6 km. Diagnostic (calculateRadiativeCapacities).
function computeH2OScaleHeight() {
    return 1 / (window.RADIATIVE.gradientSurface() * dLnPSatEau(window.DATA['🧮']['🧮🌡️']));   // m
}

PHYS.computeH2OScaleHeight = computeH2OScaleHeight;

// ═══ CAPACITÉS THERMIQUES DES GAZ, f(T) ══════════════════════════════════════════════════════════
// cp molaire [J/mol/K] aux températures TCP : Chase 1998, NIST-JANAF Thermochemical Tables, 4ᵉ éd.
// (J. Phys. Chem. Ref. Data, Monograph 9). Interpolation linéaire ; hors table = erreur (crash, pas de repli).
// Sert au gradient adiabatique sec g/cp d'une atmosphère chaude (2 800 K : cp de H₂O ×1,6 par rapport à 300 K).
const TCP = [300, 600, 1000, 1500, 2000, 3000];   // [K]
const CP_MOLAIRE = {                               // [J/mol/K]
    H2O: [33.60, 36.33, 41.27, 47.07, 51.18, 55.75],
    CO2: [37.22, 47.32, 54.31, 58.38, 60.43, 62.23],
    N2:  [29.12, 30.11, 32.70, 34.85, 36.00, 37.03],
    O2:  [29.39, 32.09, 34.88, 36.56, 37.78, 39.88],
    CH4: [35.76, 52.22, 71.80, 86.19, 94.40, 101.4]
};
function cpMolaire(gaz, T) {
    const t = Math.max(TCP[0], T);   // sous 300 K, cp ≈ constant (gaz parfaits, modes de vibration gelés)
    if (t > TCP[TCP.length - 1]) throw new Error('[PHYS.cpMolaire] T = ' + T + ' K hors table JANAF (≤ 3000 K)');
    let i = 0;
    while (TCP[i + 1] < t) i++;
    const w = (t - TCP[i]) / (TCP[i + 1] - TCP[i]);
    return CP_MOLAIRE[gaz][i] + w * (CP_MOLAIRE[gaz][i + 1] - CP_MOLAIRE[gaz][i]);
}
PHYS.cpMolaire = cpMolaire;

// Borne basse/haute (K) pour "cycle eau actif", fonction de la pression (atm).
// Plage max -10°C à 150°C ; la pression resserre la fourchette (gel et évaporation).
function getWaterCycleTempBoundsFromPressure(P_atm) {
    const T_MIN_K = EARTH.T_WATER_CYCLE_MIN_C + CONST.KELVIN_TO_CELSIUS;
    const T_MAX_K = EARTH.T_WATER_CYCLE_MAX_C + CONST.KELVIN_TO_CELSIUS;
    // Quasi sans atmosphère (⚫) : la pression ne resserre plus rien.
    if (P_atm < 0.01) return { T_low_K: T_MIN_K, T_high_K: T_MAX_K };
    const T_freeze = EARTH.T_FREEZE_SEAWATER_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM;
    const T_low_K = Math.max(T_MIN_K, T_freeze - EARTH.T_WATER_CYCLE_MARGIN_GEL_K);
    const T_high_K = Math.max(EARTH.T_WATER_CYCLE_EVAP_LOW_K, Math.min(T_MAX_K, T_MAX_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM));
    return { T_low_K, T_high_K };
}
PHYS.getWaterCycleTempBoundsFromPressure = getWaterCycleTempBoundsFromPressure;

// Facteur d'échelle vapeur d'eau (gaz) pour EDS. Calculé depuis T, P, vapor, CO2 (pas d'époque).
// Réf Schmidt 2010 : vapeur ~50% EDS. Formule corrige sur-estimation (chevauchement H2O/CO2 15-17 µm).
// CO2 ≥ 400 ppm : scale = 0.70 (lit. EDS_H₂O ~75 W/m² vs tau-ratio ~103 → réduction 38%).
// CO2 < 400 ppm : scale = 0.5 × f_T × f_P × f_v (saturation, pression).
//
// --- Credence et plage ---
// Credence: ~60%. 0.70 cible EDS_H₂O ≈ 72 W/m² à T=15°C (lit. ~75). Plage lit. 0.3–1.0.
// H2O_EDS_SCALE : EARTH.H2O_EDS_SCALE (calculations.js).