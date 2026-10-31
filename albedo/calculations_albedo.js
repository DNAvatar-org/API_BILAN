// File: API_BILAN/albedo/calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.17.1
// - v1.17.1 (2026-10-31): poserForet crashe sans poids de terre ; albédo d'une terre libre d'aire nulle défini ; 🧫 du clic
//   (📜🧫).
// - v1.17.0 (2026-10-30): la terre libre de chaque bande a sa forêt (terresLibres par bande) ; forêt sous la neige des terres la même
//   à toutes les latitudes (foretSousNeige) ; la forêt des bandes part de celle du calcul précédent.
// Date: [October 31, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - epochId Archéen : 🦠 (🌋 réservé actions). Archéen utilise clouds modernes pour ~15°C.
// - 🧲⚖️💦 : formule P = W/τ (litt. 8–10 j), ⏳☔ = 1/τ_global ; rampe (RH−💭☔)/0,2 ; ref. Nature Rev. Earth Env. 2021, HESS 2017, GPCP ~2,7 mm/j.
//
// FORMULES ALBEDO :
// A_surf = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🎾,🌊,🌳,🌍,🏜️} (surface libre) + glace saisonnière (bande par bande, 🪩.🍰☀️🪩🧊) + calottes
//   × leur albédo annuel (🗻.🧮🪩🗻🧊, bilan de calotte, bande par bande), albédos des matériaux 🪩🍰❀ dans DATA['🪩🍰'] : moyenne par
//   la surface, égale à Σ_z f_z Rg_z des zones du bilan méridien (contrôlé, erreur sinon).
// A_geo = Σ_z w_z A_z(Rg_z) : albédo au sommet de chaque zone (transfert solaire de la colonne aux angles solaires de la zone :
//   nuages, vapeur, Rayleigh), pondéré par la part w_z de l'insolation du globe qu'elle reçoit — MERIDIEN.resoudre (meridien.A).
// 🍰🪩📿 (DATA) = 1 − (1−A_geo)(1−🍰⚽) après blackbody_factor sur A_geo
// 🍰🪩🎾 = volcano_coverage = partLave() : fraction fondue de la péridotite à T_surface (solidus → liquidus, Katz 2003)
// 🍰🪩🌊 = ocean_coverage = bassin rempli × (1 − 🎾), bassin rempli = 🍰🗻🌊 (la mer de la carte : sous son niveau de la mer) dans un
//   monde à océan (H2O.mondeOcean), 0 hors de lui (bassin à sec)
// terres disponibles = (1 − bassin rempli)(1 − 🎾) : lave + océan + terres = 1
// 🍰🪩🌳 = forest_coverage = Σ_bandes forêt de la bande (poserForet : part préagricole sous la ligne des arbres) × ses terres ;
//   0 hors d'un monde à océan et avant les premiers arbres
// 🍰🪩🏜️ = desert_coverage = Σ_bandes min(terres − forêt, aridité × terres) de chaque bande
// 🍰🪩🌍 = land_coverage = terres − forêt − désert (continents, prairies, sols humides, albedo ~0.18)
// Calottes et glace saisonnière sont prises sur ces surfaces : la somme vaut 1 par construction (erreur sinon).
// 🍰🪩🧊 = calottes du pas + glace saisonnière pondérée par l'énergie : océan × ⟨e_b,mer⟩ + terres libres × ⟨e_b,terre⟩, moyennes des
//   bandes pondérées par leur mer et leur terre libres (e = part de l'énergie solaire sous le gel, 🪩.🍰☀️🧊) — la glace des bandes du
//   bilan méridien à son état convergé ; sa lumière réfléchie : même moyenne de r = 🪩.🍰☀️🪩🧊 (EARTH.glaceSaisonniere)
// 🍰🪩⛅ = cloud_coverage = C_max × ☁️ où C_max ≈ 0.7 et ☁️ = CloudFormationIndex
// 🍰⚽ ∈ [0,0.95] : obstruction voile SW sur le faisceau déjà modulé par A_geo (EPOCH+📜+CONFIG)
// 🍰🪩⚽ = 1 − 🍰⚽ : transmission de ce faisceau ; 🍰🪩📿 (DATA) = 1 − (1−A_geo)(1−🍰⚽) = albédo planétaire effectif

// ============================================================================
// Albédo effectif (surfaces + nuages + voile SW) : cohérence 🍰🪩📿 / 🧲☀️🔽 / 🧲🪩🔼
// ============================================================================
function applyVeilToPlanetaryAlbedo01(A_geom) {
    const a = Math.max(0, Math.min(1, A_geom));
    const obs = Math.max(0, Math.min(0.95, window.DATA['🪩']['🍰⚽']));
    return 1 - (1 - a) * (1 - obs);
}

// ============================================================================
// VOILE SW STRATOSPHÉRIQUE : 🍰⚽ (obstruction, source métier) ; 🍰🪩⚽ = 1−🍰⚽ (transmission)
// ============================================================================
// Voile = 📜🔺🍰⚽ (impulsion d'époque / rampe / action, compute.js + events.js).
// (Retirés : terme « racine EPOCH['🍰⚽'] », déclaré par aucune époque, et jauge hystStratosphericVeilExtra01
// de la page hystérésis supprimée — tous deux valaient toujours 0.)
function syncStratosphericVeil01() {
    const DATA = window.DATA;
    const obs = Math.min(0.95, Math.max(0, DATA['📜']['🔺🍰⚽']));
    DATA['🪩']['🍰⚽'] = obs;
    DATA['🪩']['🍰🪩⚽'] = 1 - obs;
    return obs;
}

// ============================================================================
// COEFFICIENTS D'ALBÉDO PAR TYPE DE SURFACE
// ============================================================================
// Coefficients d'albédo déplacés dans CONST (propriétés physiques constantes)
// Utiliser CONST.ALBEDO_REFLECTOR_COEFF depuis physics.js

// ============================================================================
// FONCTION : CALCULER LES SURFACES GÉOLOGIQUES (COUCHE A)
// ============================================================================
// 🔒 NOUVEAU PIPELINE : Géologie → Surfaces → Stocks → Climat → Albedo
// Parts de SURFACE de la géologie à la date, DATA['🗻'] : la mer 🍰🗻🌊 est le complément de la terre ÉMERGÉE de chaque bande de
// latitude (CALOTTES.parts : PALEOGEO à la date, la source du bilan méridien et des calottes ; avant la première carte, la terre
// de l'époque), moyennée sur le globe ; hautes terres 🍰🗻🏔 posées par l'époque, terres basses 🍰🗻🌍 le reste de la terre
// émergée. Les parts de l'époque doivent faire 1 : sinon, c'est une erreur de la config.
function calculateGeologySurfaces() {
    const DATA = window.DATA;
    const EPOCH = DATA['📅'];
    const cfg = EPOCH['🗻'];
    const total = cfg['🍰🗻🌊'] + cfg['🍰🗻🏔'] + cfg['🍰🗻🌍'];
    if (Math.abs(total - 1) > 1e-9) throw new Error('[calculateGeologySurfaces] ' + EPOCH['📅'] + " : 🗻 🍰🗻🌊 + 🍰🗻🏔 + 🍰🗻🌍 = " + total + ' (1 attendu)');
    const P = window.CALOTTES.parts(), terre = { pol: 0, mid: 0, trop: 0 };
    for (const b of window.CALOTTES.BANDES) terre[b.zone] += P[b.cle].emerge / 2;      // deux bandes de même aire par zone
    const terres = EARTH.moyenneGlobe(terre);
    if (terres < cfg['🍰🗻🏔']) throw new Error('[calculateGeologySurfaces] ' + EPOCH['📅'] + ' : hautes terres posées (' + cfg['🍰🗻🏔'] + ') > terre émergée de la carte (' + terres.toFixed(4) + ')');
    if (!(terres <= 1 + 1e-9)) throw new Error('[calculateGeologySurfaces] ' + EPOCH['📅'] + ' : terre émergée du globe ' + terres + ' > 1 (mer 🍰🗻🌊 négative)');
    DATA['🗻']['🍰🗻🌊'] = 1 - terres;
    DATA['🗻']['🍰🗻🏔'] = cfg['🍰🗻🏔'];
    DATA['🗻']['🍰🗻🌍'] = terres - cfg['🍰🗻🏔'];
    return true;
}

// ============================================================================
// FONCTION : CALCULER L'INDEX DE FORMATION NUAGEUSE (☁️)
// ============================================================================
// ☁️ = CloudFormationIndex ∈ [0, 1] : potentiel de condensation (ni masse ni surface)
//
// FORMULE RÉELLE (implémentée) — Schéma Sundqvist 1989 :
// ☁️ = 1 - Math.pow(1 - min(🍰🌧💧, 1), 0.6)     où 🍰🌧💧 = humidité relative (q/q_sat).
// Sundqvist (1989) : la couverture nuageuse ne dépend que de l'humidité relative.
// À HR=98.9% : ☁️ ≈ 0.93. ☁️ n'utilise PAS 🍰🫧💧🌈 (cap. rad. IR, calculée ailleurs).
// v-2026-09-23 : le facteur 🍰💭 (« efficacité CCN ») a été retiré — voir le bloc de suppression
// dans calculateCloudFormationIndex().
//
// Note : L'ancienne formule (🍰🫧💧/H2O_VAPOR_REF × f(T) × ...) n'est plus utilisée.

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // 🔒 CALCUL DE 🍰🌧💧 (Humidité relative moyenne globale)
    // FORMULE : 🍰🌧💧 = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧪🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧪🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧪🌧 = fraction massique saturante q_sat
    //   🍰🌧💧 = q / q_sat = humidité relative (RH)
    const q_sat = (CONST.M_H2O / DATA['🫧']['🧪']) * DATA['💧']['🍰🧪🌧'];  // Fraction massique saturante
    DATA['💧']['🍰🌧💧'] = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_factor = (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE;
    DATA['💧']['💭☔'] = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));

    // ── 🍰💭 SUPPRIMÉE le 2026-09-23 ────────────────────────────────────────────────────
    // Elle valait :
    //   🍰💭 = clamp(0,4 + 0,5×(⚖️🫁/réf + ⚖️🐄/réf) + 0,1×(⚖️✈/réf), 0,3, 1,0)
    // et multipliait la fraction nuageuse de Sundqvist. Trois raisons de la retirer, pas une :
    //
    // 1. ELLE N'A PAS DE PHYSIQUE. La fraction nuageuse n'est pas fonction des noyaux de
    //    condensation : elle est fixée par la dynamique et l'humidité. Sundqvist (1989, Mon. Wea.
    //    Rev. 117:1641) la paramétrise à partir de la SEULE humidité relative. Les CCN agissent
    //    sur le NOMBRE de gouttelettes — donc sur l'albédo nuageux (Twomey 1977/1991, déjà codé
    //    plus bas) et sur leur taille — pas sur la couverture.
    // 2. NI L'O₂ NI LE CH₄ NE SONT DES CCN. La chimie de l'activation est la théorie de Köhler
    //    (1936), modernisée en κ-Köhler (Petters & Kreidenweis 2007, ACP 7:1961) : terme de Kelvin
    //    (courbure) + terme de Raoult (soluté), avec κ mesuré par espèce — sulfate d'ammonium 0,61,
    //    sel de mer 1,1, organiques 0,1–0,2, suie ≈ 0. L'O₂ et le CH₄ n'y figurent pas. Il n'y avait
    //    donc rien à dériver : cette formule n'était l'approximation de rien.
    // 3. ELLE ÉTAIT MORTE. Sa valeur brute allait de 1,15 à 6058 selon l'époque : le clamp la
    //    figeait à 1,000 sur 18 époques sur 19 (doc/AUDIT_CONSTANTES_SANS_SOURCE.md). Elle
    //    multipliait Sundqvist par la constante 1.
    //
    // Ce que devient l'apport des CCN : il passe entièrement par la loi de puissance mesurée
    // sulfate → gouttelettes (McCoy et al. 2018) puis par Twomey, plus bas dans ce fichier.
    // ⚠️ Les autres espèces de CCN réelles — sel de mer, organiques, poussière, suie — ne sont pas
    // suivies par le modèle. McCoy 2018 publie leurs exposants ; il manque leurs masses.
    //
    // 🔒 FORMULE SUNDQVIST (1989) : ☁️ = 1 − (1 − min(🍰🌧💧, 1))^0.6, humidité relative seule.
    DATA['🪩']['☁️'] = Math.max(0, Math.min(1, 1 - Math.pow(1 - Math.min(DATA['💧']['🍰🌧💧'], 1), 0.6)));
    
    // ⏳☔ (= 1 / CONV.TAU_VAPOR_GLOBAL_S) retirée le 2026-09-23 : écrite ici, lue nulle part (ses deux
    // lecteurs étaient déjà commentés « inutilisé » dans calculations_h2o.js). τ reste lu directement
    // par 🧲⚖️💦 ci-dessous : P = W/τ (temps de résidence ~8–10 j, Nature Rev. Earth Env. 2021 ; HESS 2017).
    
    // 🔒 INITIALISATION DE 🔺⏳ (1 jour). En phase eau, tuning SOLVER.DELTA_T_ACCELERATION_DAYS (8–10 j) peut l’augmenter.
    DATA['💧']['🔺⏳💦'] = CONV.SECONDS_PER_DAY;
    
    // 🔒 CALCUL DE 🧲⚖️💦 (Taux de précipitation en kg/m²/s). P = W/τ ; rampe (RH−💭☔)/0.2. Réf. GPCP ~2,7 mm/j.
    const rh_excess = DATA['💧']['🍰🌧💧'] - DATA['💧']['💭☔'];
    const ramp = rh_excess <= 0 ? 0 : Math.min(1, rh_excess / 0.2);
    DATA['💧']['🧲⚖️💦'] = ramp * (DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧']) / (4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2)) / CONV.TAU_VAPOR_GLOBAL_S;

    return DATA['🪩']['☁️'];
}

// ============================================================================
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

/** Albédo de la glace saisonnière HORS FONTE dans la zone cle ('pol' | 'mid' | 'trop'), à l'état de DATA : la neige sèche 🪩🍰❄️
 *  (neige propre, Warren & Wiscombe 1980) sur la glace d'hiver et de printemps — celle de la mer comme celle des terres. Pendant la
 *  fonte, l'albédo de chaque nœud de l'arc gelé suit la neige de l'année (EARTH.glaceSaisonniere : neige mouillée, puis glace nue à
 *  mares ou sol). Aux tropiques, une glace n'existe que dans une boule de neige : fraîchement gelée (entrée 1a), elle est neigeuse
 *  comme aux pôles ; ÉTABLIE, elle est nue, sublimée et poussiéreuse (Pierrehumbert 2005 ; Abbot & Pierrehumbert 2010) — ce n'est pas
 *  une banquise saisonnière : sa glace sèche va de 🪩🍰❄️ à 🪩🍰🧊 avec l'étendue de la glace sur le globe (MERIDIEN.etendueGlace, à
 *  l'état de DATA : l'itération courante du point fixe). */
function albedoGlaceSeche(cle) {
    const M = window.DATA['🪩🍰'];
    return cle === 'trop' ? M['🪩🍰❄️'] - (M['🪩🍰❄️'] - M['🪩🍰🧊']) * window.MERIDIEN.etendueGlace() : M['🪩🍰❄️'];
}

// ─── FORÊT POTENTIELLE, LATITUDE PAR LATITUDE ─────────────────────────────────────────────────────────────────────────────
// La forêt d'avant l'agriculture, là où la saison de croissance permet l'arbre. Ligne des arbres de Paulsen & Körner 2014 (Alp.
// Bot. 124:1, seuils en température de l'air tirés de la zone des racines mesurée aux lignes des arbres du globe, Körner & Paulsen
// 2004, J. Biogeogr. 31:713) : un jour de la saison de croissance a une moyenne ≥ 0,9 °C ; l'arbre demande au moins 94 de ces jours
// et 6,4 °C en moyenne sur eux. Sous cette ligne, la part des terres sous la forêt est celle d'avant le défrichement : la forêt de
// 2020, 31 % des terres (4,06 Gha, FAO 2020), × 6,0/4,06 (~6 Gha au début de l'agriculture, Williams 2006) — la même à toutes les
// époques qui ont des arbres (❔ aucune carte de la forêt passée). Avant les premiers arbres (forêt fossile de Gilboa, Dévonien
// moyen, ~385 Ma : Stein et al. 2007, 2012), la flore basse (Rhynie, 407 Ma : Kenrick & Crane 1997) ne masque pas la neige. Une plante
// demande de l'eau liquide et une atmosphère : pas de forêt hors d'un monde à océan (H2O.mondeOcean). Forêt boréale qui masque la neige
// (Bonan 2008) et forêts polaires des climats chauds (Otto-Bliesner & Upchurch 1997) : la même loi, sur la saison de chaque latitude,
// pour l'albédo de la terre libre hors de la neige. La forêt qui masque la neige est foretSousNeige (plus bas).
const FORET = {
    PART_2020: 0.31,                       // [m²/m²] forêt de 2020 : 31 % des terres (4,06 Gha, FAO 2020)
    MASQUE_T0_K: 268.15,                   // [K] 🔧 forêt sous la neige : T̄ où elle s'annule (sans source)
    MASQUE_DT_K: 25,                       // [K] 🔧 … écart de T̄ sur lequel elle atteint PART_2020 (sans source)
    MASQUE_MIN: 0.4,                       // [-] 🔧 … sa part minimale de PART_2020 (sans source)
    AGE_PREMIERS_ARBRES: 385e6,            // [an]
    T_JOUR_C: 0.9,                         // [°C] moyenne journalière d'un jour de la saison de croissance
    SAISON_JOURS: 94,                      // [jour] saison de croissance minimale
    T_SAISON_C: 6.4                        // [°C] moyenne minimale de la saison de croissance
};
// [m²/m²] Part des terres sous la ligne des arbres couverte de forêt (0,458) : la forêt de 2020 × 6,0/4,06. ⚠️ FAO 2020 la rapporte à
// TOUTES les terres hors Antarctique — toundras, étage alpin et Groenland compris : sous la ligne, la forêt est plus dense (sous-estimée).
FORET.PART_PREAGRICOLE = FORET.PART_2020 * 6.0 / 4.06;

/** Part ≥ 0 d'un segment où la valeur va linéairement de a à b : { p part du segment, s moyenne de max(0, valeur) sur le segment }. */
function dessus(a, b) {
    if (a >= 0 && b >= 0) return { p: 1, s: (a + b) / 2 };
    if (a < 0 && b < 0) return { p: 0, s: 0 };
    const h = Math.max(a, b), p = h / (h - Math.min(a, b));
    return { p: p, s: p * h / 2 };
}

/** [m²/m²] Part de la cellule de chaque latitude de terre de la bande sous la ligne des arbres (tableau, un nombre par point), à son
 *  arc de l'année (SAISONS.cycles : T aux nœuds de l'année, linéaire entre deux nœuds). Pour chaque point, saison de croissance
 *  L = durée où T ≥ 0,9 °C, et marges L − 94 jours et ∫(T − 0,9 °C) dt − (6,4 − 0,9) L (du signe de la moyenne de la saison moins
 *  6,4 °C). Une marge est linéaire entre deux points voisins (prolongée au bord de la bande) : la part de la cellule de chaque point
 *  où elle est ≥ 0 ; sous la ligne, les deux à la fois (la plus petite des deux parts : dans une bande, les points ne diffèrent que
 *  par leur moyenne annuelle). Les cellules ont la même aire (points uniformes en sin φ). */
function partSousLigneArbres(arcs) {
    const n = arcs[0].T.length, demi = window.CONST.AN_TROPIQUE_JOURS / (2 * n), Tj = window.CONST.T0_WATER + FORET.T_JOUR_C;
    const mL = [], mT = [];
    for (const pt of arcs) {
        let L = 0, I = 0;
        for (let k = 0; k < n; k++) {
            const v = pt.T[k] - Tj, g = dessus((pt.T[(k + n - 1) % n] - Tj + v) / 2, v), d = dessus(v, (v + pt.T[(k + 1) % n] - Tj) / 2);
            L += demi * (g.p + d.p);   // [jour]
            I += demi * (g.s + d.s);   // [K·jour]
        }
        mL.push(L - FORET.SAISON_JOURS);
        mT.push(I - (FORET.T_SAISON_C - FORET.T_JOUR_C) * L);
    }
    const N = arcs.length;
    const cellule = (m, i) => {
        const g = i === 0 ? (3 * m[0] - m[1]) / 2 : (m[i - 1] + m[i]) / 2, d = i === N - 1 ? (3 * m[N - 1] - m[N - 2]) / 2 : (m[i] + m[i + 1]) / 2;
        return (dessus(g, m[i]).p + dessus(m[i], d).p) / 2;
    };
    return arcs.map((pt, i) => Math.min(cellule(mL, i), cellule(mT, i)));
}

/** [m²/m²] Forêt de chaque latitude de terre de la bande b (tableau, un nombre par point de ses arcs) : FORET.PART_PREAGRICOLE × part de
 *  sa cellule sous la ligne des arbres, dans un monde à océan depuis les premiers arbres, 0 sinon. Appelée par la glace saisonnière à
 *  chaque itération du bilan méridien (EARTH.glaceSaisonniere) ; la forêt de la bande, moyenne de ses points pondérée par leur part de
 *  terre (poids des arcs, SAISONS.cycles), est posée dans DATA['🗻']['🍰🗻🌳'][b.cle] : celle de sa terre libre hors de la neige
 *  (terresLibres). Les poids d'une bande somment à sa terre (SAISONS.cycles : N_X × E, ou N_X pour une bande toute mer ou toute
 *  terre) : une somme nulle est une terre perdue entre la carte et les points, crash. */
function poserForet(b, arcs) {
    const f = window.H2O.mondeOcean() && window.INTERIEUR.ageCourant() <= FORET.AGE_PREMIERS_ARBRES
        ? partSousLigneArbres(arcs).map((p) => FORET.PART_PREAGRICOLE * p) : arcs.map(() => 0);
    const poids = arcs.reduce((s, a) => s + a.poids, 0);
    if (poids === 0) throw new Error('[ALBEDO] poserForet ' + b.cle + ' : aucun point de la bande ne porte sa terre (Σ poids = 0, SAISONS.cycles)');
    window.DATA['🗻']['🍰🗻🌳'][b.cle] = arcs.reduce((s, a, i) => s + a.poids * f[i], 0) / poids;
    return f;
}

/** [m²/m²] Part des terres dont la canopée masque la neige (forêt enneigée 🪩🍰🌳❄️, EARTH.glaceSaisonniere), la même à toutes les
 *  latitudes : FORET.PART_2020 × clamp((🧮🌡️ − MASQUE_T0_K)/MASQUE_DT_K, MASQUE_MIN, 1), dans un monde à océan depuis les premiers
 *  arbres, 0 sinon. 🔧 ❔ Forme sans source (moins de forêt quand T̄ baisse), qui ne sait pas où passe la ligne des arbres. La forêt
 *  de chaque latitude (poserForet) ne masque pas la neige : sa ligne des arbres est vers 73° N à 📱 et ne recule pas au dernier
 *  maximum glaciaire (🎯 67–72° N et ~5 Mkm² de toundra, Walker et al. 2005 : ~2 Mkm² dans le modèle), l'été de 61–68° N du
 *  modèle étant trop chaud (moyenne annuelle de la zone polaire du bilan méridien) ; c'est la forêt qui masque la neige qui pèse sur
 *  l'albédo (forêt enneigée 0,25 contre neige ~0,8 ; forêt 0,17 contre sol 0,18 hors de la neige). */
function foretSousNeige() {
    return window.H2O.mondeOcean() && window.INTERIEUR.ageCourant() <= FORET.AGE_PREMIERS_ARBRES
        ? FORET.PART_2020 * Math.max(FORET.MASQUE_MIN, Math.min(1, (window.DATA['🧮']['🧮🌡️'] - FORET.MASQUE_T0_K) / FORET.MASQUE_DT_K)) : 0;
}

/** [m²/m²] Part de la surface en fusion : fraction fondue de la péridotite à la température de surface COURANTE (🧮🌡️), entre son
 *  solidus et son liquidus à 0 GPa (Katz, Spiegelman & Langmuir 2003, G³ 4:1073), la même loi que l'intérieur (geology/interieur.js).
 *  La seule : l'albédo planétaire et le bilan méridien la lisent (la lave couvre les terres et la mer de chaque bande). */
function partLave() {
    const LAVE = window.INTERIEUR.CONST;
    return Math.max(0, Math.min(1, (window.DATA['🧮']['🧮🌡️'] - LAVE.T_SOLIDUS) / (LAVE.T_LIQUIDUS - LAVE.T_SOLIDUS)));
}

/** Albédos des MATÉRIAUX de l'époque, écrits une fois par calcul dans DATA['🪩🍰'] et lus là (albédo planétaire, bilan méridien,
 *  fonte des calottes) : EARTH['🪩🍰'], surchargés par EPOCH['🪩🍰'] quand l'époque en déclare (⚫). Sortie de boule de neige
 *  (mudball) : la poussière volcanique et éolienne concentrée par la sublimation sur des Ma (Abbot & Pierrehumbert 2010, JGR
 *  115:D03104) assombrit TOUTE la glace — neige profonde 🪩🍰❄️ ET glace 🪩🍰🧊 plafonnées par EPOCH['🌫️❄️'], l'albédo de la glace
 *  sale ; une époque sans cette clé garde une glace propre. */
function poserAlbedosMateriaux() {
    const DATA = window.DATA, EPOCH = DATA['📅'], M = DATA['🪩🍰'];
    Object.assign(M, EARTH['🪩🍰']);
    if ('🪩🍰' in EPOCH) Object.assign(M, EPOCH['🪩🍰']);
    if ('🌫️❄️' in EPOCH) {
        M['🪩🍰❄️'] = Math.min(M['🪩🍰❄️'], EPOCH['🌫️❄️']);
        M['🪩🍰🧊'] = Math.min(M['🪩🍰🧊'], EPOCH['🌫️❄️']);
    }
}
// ============================================================================
// RAPPORT DE CCN DE L'ÉPOQUE (sans dimension, 1 = Terre actuelle)
// ============================================================================
// Multiplie le nombre de gouttes de la Terre actuelle (EARTH.NUAGES, DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3) dans le
// profil nuageux (radiative/calculations.js) : r_eff ∝ N^(−1/3), c'est Twomey (1977), sans coefficient à régler.
// Une seule loi, MESURÉE : CDNC / CDNC_ref = (m_SO₄ / m_ref)^a (forme de Boucher & Lohmann 1995, Tellus B 47:281 ;
// exposant a de McCoy et al. 2018, ACP 18:2035, Table 1 — CDNC MODIS, sulfate MERRA2, 19 régions, quartiles
// [0,11 ; 0,29], jauge SUBTIL). m_ref = charge moderne 1,05e9 kg SO₄ (Tsigaridis et al. 2006) : le rapport vaut 1 sur 📱.
// Sulfate efficace = part volcanique + part DMS modulée par la biosphère marine 🧫 du clic (📜🧫 : celle de l'époque, ou de son
// état 🔁 daté). Partage MESURÉ des deux
// sources naturelles : volcanisme 11,5 Tg S/an (Carn et al. 2017, Sci. Rep. 7:44095), DMS 28,1 Tg S/an (Lana et al. 2011,
// Glob. Biogeochem. Cycles 25:GB1004) → 0,29 / 0,71. ⚠️ 🧫 est posée par époque ou par clic (paléo-abondance du plancton, sans
// mesure).
// Retiré le 2026-10-13 : le « proxy » (CCN_BASE + CCN_O2_WEIGHT·🍰🫧🫁·(1 + BIOMASS_GAIN·🍰🪩🌳)·anthro) / référence
// moderne, qui multipliait cette loi. L'O₂ n'est pas un noyau de condensation (activation de Köhler, κ-Köhler : Petters &
// Kreidenweis 2007, ACP 7:1961) ; les 0,15 / 0,85 / 4,0 étaient « calibrés », et la rampe anthropique 1900–1980 comparait
// des années du calendrier à EPOCH['▶'] (des âges géologiques). Il divisait le nombre de gouttes par ~2,5 sur toute
// époque sans oxygène. ⚠️ Les autres CCN réels (sel de mer, organiques, poussière) ne sont pas suivis : McCoy 2018 publie
// leurs exposants, il manque leurs masses par époque.
function rapportCCN() {
    const DATA = window.DATA;
    const SO4_VOLCANIC_SHARE = 11.5 / (11.5 + 28.1);   // 0,290 — Carn 2017 / Lana 2011
    const sulfate_kg_effective = DATA['⚖️']['⚖️✈'] * (SO4_VOLCANIC_SHARE + (1 - SO4_VOLCANIC_SHARE) * DATA['📜']['🧫']);
    const ccn_ratio = window.AEROSOL.sulfateCcnRatio(
        sulfate_kg_effective,
        CONV.CCN_SULFATE_REF_KG,                       // 1,05e9 kg SO₄ = charge moderne (Tsigaridis 2006)
        DATA['🎚️'].CLOUD_SW.SULFATE_CCN_EXPONENT
    );
    window._hystDiag.ccnRatio = ccn_ratio;
    window._hystDiag.sulfateKgEffective = sulfate_kg_effective;
    return ccn_ratio;
}

/** [cm⁻³] Nombre de gouttes des nuages bas de la Terre ACTUELLE pour la surface courante : océan (jauge FROID, Bennartz
 *  2007) et continent (Gultepe & Isaac 2004) pondérés par l'océan libre. Sert au seuil de pluie (radiative/calculations.js). */
/** [m²/m²] Part de la planète sous masse d'air MARITIME : les bassins océaniques, GELÉS OU NON (🍰🗻🌊). Avant le
 *  2026-10-13, l'océan LIBRE (🍰🪩🌊) : la banquise comptait comme un continent (200 gouttes/cm³ au lieu de ~65), d'où des
 *  nuages plus épais et plus brillants à mesure que la mer gelait — une rétroaction artificielle vers le snowball. Au-dessus
 *  de la banquise, l'air reste maritime et pauvre en noyaux (nuages arctiques : Mauritsen et al. 2011, ACP 11:165). */
function fractionMaritime() {
    return window.DATA['🗻']['🍰🗻🌊'];
}
function nombreGouttesActuelCm3() {
    const DATA = window.DATA;
    const oc = fractionMaritime();
    return DATA['🎚️'].CLOUD_SW.CDNC_OCEAN_CM3 * oc + window.EARTH.NUAGES.CDNC_CONTINENT_CM3 * (1 - oc);
}
/** [cm⁻³] Nombre de gouttes de l'ÉPOQUE : actuel × rapport de CCN (loi sulfate). C'est celui qui fixe r_eff (Twomey). */
function nombreGouttesCm3() {
    return nombreGouttesActuelCm3() * rapportCCN();
}

/**
 * [m²/m²] Surfaces de la planète SANS GLACE, à l'état de DATA — la seule source, lue par l'albédo planétaire (calculateAlbedo) et par
 * le bilan méridien (physics/meridien.js) : { lave, rempli, sec, ocean, terres, aride }.
 *   · lave = partLave() ;
 *   · rempli = part du globe sous l'eau : le bassin (🗻.🍰🗻🌊, posé par calculateGeologySurfaces : la terre émergée de la carte est
 *     au-dessus du niveau de la mer de sa reconstruction, le reste est la mer) dans un monde à océan (H2O.mondeOcean) — la profondeur
 *     moyenne suit l'eau (V/S), elle n'est pas posée ; hors de lui — eau au-dessus de son point critique, jusqu'au liquidus compris,
 *     ou sans air — le bassin est à sec ; sec = part du bassin restée à sec (0 sans bassin) ;
 *   · ocean = rempli (1 − lave) ; terres = (1 − rempli)(1 − lave) : lave + océan + terres = 1 (la part à sec du bassin est une terre) ;
 *   · aride = part des terres que l'aridité fait désert (précipitations P_ann et humidité relative 🍰🌧💧, posée par
 *     calculateCloudFormationIndex) ; la forêt, le désert (au plus ce que laisse la forêt) et le sol sont partagés par terresLibres,
 *     sur la forêt des bandes de l'itération du bilan méridien.
 */
function surfacesSansGlace() {
    const DATA = window.DATA, CONST = window.CONST;
    const lave = partLave();
    const bassin = DATA['🗻']['🍰🗻🌊'];
    const rempli = window.H2O.mondeOcean() ? bassin : 0;
    const ocean = rempli * (1 - lave);
    const terres = (1 - rempli) * (1 - lave);
    // Précipitations annuelles P_ann (mm/an) ∝ 🍰🧪🌧 × océan × F_conv × CONV.P_ANN_SCALE_MM_AN (facteur d'échelle : H ≈ 1 à 15 °C,
    // P_ann ≈ 2 117 mm/an) ; F_conv = facteur de convection (T optimal ~15 °C).
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (DATA['🧮']['🧮🌡️'] - (CONST.T0_WATER + 15)) / 50));
    const P_ann = DATA['💧']['🍰🧪🌧'] * ocean * F_conv * CONV.P_ANN_SCALE_MM_AN;
    // Désert : aridité moyenne (P_ann < 1000 mm/an, 🍰🌧💧 < 0,6) + variabilité régionale (~20 % de déserts même sous une moyenne
    // humide : Sahara, Gobi).
    const relative_humidity = DATA['💧']['🍰🌧💧'];
    const precip_factor_desert = Math.max(0, 1 - Math.min(1, P_ann / 1000));
    const humidity_factor_desert = Math.max(0, 1 - Math.min(1, relative_humidity / 0.6));
    const desert_base = precip_factor_desert * humidity_factor_desert;
    const temp_variability = Math.max(0.5, Math.min(1, (DATA['🧮']['🧮🌡️'] - (CONST.KELVIN_TO_CELSIUS + 5)) / 10));
    const humidity_variability = Math.max(0.5, 1 - relative_humidity * 0.6);
    const VARIABILITY_FACTOR = 0.6; // 60% des terres disponibles peuvent être arides (pondéré par les facteurs)
    return { lave: lave, rempli: rempli, sec: bassin > 0 ? 1 - rempli / bassin : 0, ocean: ocean, terres: terres,
        aride: desert_base + VARIABILITY_FACTOR * temp_variability * humidity_variability };
}

/**
 * [m²/m²] Terres libres de chaque bande une fois posées les calottes qu'elles portent, et leur partage forêt / désert / sol — la seule
 * loi : la terre libre de chaque bande du bilan méridien (son albédo) et l'albédo planétaire (somme des bandes). SG = surfacesSansGlace,
 * S = MERIDIEN.surfacesBandes (calotte c, sa part sur la terre émergée c_T). Par bande, en part de la bande avant la lave : terres
 * Λ = E + sec (1 − E) (terre émergée E de CALOTTES.parts, part à sec du bassin) ; forêt = 🗻.🍰🗻🌳 × Λ (la forêt de la bande,
 * poserForet ; ❔ la même part de sa terre libre que de sa terre émergée), désert = min(Λ − forêt, aride × Λ) (⚠️ la part aride des
 * terres du globe dans chaque bande), sol = le reste (steppes, prairies, toundras, montagnes) ; calottes posées sur ses terres
 * c_T + sec (c − c_T) : prises sur le sol, puis le désert, puis la forêt. Renvoie { cle: { foret, desert, sol, albedo } } — albedo =
 * albédo moyen d'un m² de terre libre de la bande (albédos des matériaux DATA['🪩🍰']). Sans terre libre (la calotte couvre toute la
 * terre de la bande, ou la bande n'en a pas), un m² de terre libre est un m² de la terre de la bande hors calotte, à sa composition
 * par m² de terre : forêt 🍰🗻🌳, désert min(1 − forêt, aride), sol le reste — l'albédo de sa terre libre quand aucune calotte n'y
 * est posée ; d'aire nulle, il ne pèse rien dans l'albédo de la bande.
 */
function terresLibres(SG, S) {
    const M = window.DATA['🪩🍰'], F = window.DATA['🗻']['🍰🗻🌳'], P = window.CALOTTES.parts(), out = {};
    for (const b of window.CALOTTES.BANDES) {
        const E = P[b.cle].emerge, sb = S[b.cle], L = E + SG.sec * (1 - E), ct = sb.calotteTerre + SG.sec * (sb.calotte - sb.calotteTerre);
        const foret0 = F[b.cle] * L, desert0 = Math.min(L - foret0, SG.aride * L), sol0 = L - foret0 - desert0;
        const sol = Math.max(0, sol0 - ct), r1 = ct - (sol0 - sol);
        const desert = Math.max(0, desert0 - r1), r2 = r1 - (desert0 - desert);
        const foret = Math.max(0, foret0 - r2);
        const total = foret + desert + sol, fF = F[b.cle], fD = Math.min(1 - fF, SG.aride);
        out[b.cle] = { foret: foret, desert: desert, sol: sol,
            albedo: total === 0 ? fF * M['🪩🍰🌳'] + fD * M['🪩🍰🏜️'] + (1 - fF - fD) * M['🪩🍰🌍']
                : (foret * M['🪩🍰🌳'] + desert * M['🪩🍰🏜️'] + sol * M['🪩🍰🌍']) / total };
    }
    return out;
}

function calculateAlbedo() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const ALBEDO = window.ALBEDO;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    syncStratosphericVeil01();
    // Albédos des matériaux de l'époque (EARTH ⊕ EPOCH ⊕ glace sale) : DATA['🪩🍰'], lus partout ensuite.
    poserAlbedosMateriaux();
    const M = DATA['🪩🍰'];

    // Colonne nuageuse du profil (vapeur, nuages bas et hauts) : une fois par calcul — bilan méridien et albédo planétaire.
    const colonne = window.RADIATIVE.colonneNuageuse();

    // Surfaces géologiques de la date (bassin 🍰🗻🌊 = 1 − terre émergée de la carte) et humidité relative 🍰🌧💧 (☁️, Sundqvist) :
    // ce que lisent les surfaces sans glace (surfacesSansGlace), avant le bilan méridien qui les lit aussi.
    ALBEDO.calculateGeologySurfaces();
    ALBEDO.calculateCloudFormationIndex();

    // 🔒 BILAN MÉRIDIEN (physics/meridien.js, North et al. 1981) : T₂ (DATA['🧮']['🌡️🎱']) et, à ce T₂, la glace saisonnière des bandes
    // (DATA['🪩']['🍰📅🧊'] et ['🍰☀️🧊'], EARTH.glaceSaisonniere) et les calottes du pas (DATA['🗻']['🧮🍰🗻🧊'] et ['🧮🔺📏🗻🧊']) :
    // c'est cette glace que l'albédo planétaire lit plus bas. Calottes : état porté DATA['🗻']['🍰🗻🧊'] et son socle
    // DATA['🗻']['🔺📏🗻🧊'] (config de l'époque au clic frise, socle à l'équilibre ; état du clic précédent au clic time), avancés
    // ensemble sur le temps écoulé depuis leur date (📅🗻🧊), engagés en fin de convergence (calculations_flux.js → CALOTTES.engager).
    // Le bilan méridien lit tout cela dans DATA ; seule la colonne nuageuse de ce calcul lui est passée. Il rend aussi l'albédo
    // planétaire au sommet (meridien.A) : la lumière réfléchie par chaque zone, pondérée par l'insolation qu'elle reçoit.
    // Forêt des bandes (DATA['🗻']['🍰🗻🌳']) : posée par la glace saisonnière à chaque itération du point fixe (ALBEDO.poserForet) ; le
    // pas part de celle du calcul précédent (0 au clic frise, MERIDIEN.depuisConfig).
    const meridien = window.MERIDIEN.resoudre(colonne);
    window._hystDiag.meridien = meridien;

    // Partage de l'eau totale (h2o/calculations_h2o.js) sur un monde à océan : sa glace est celle de la mer de l'état convergé
    // (épaisseur de Stefan, physics/saisons.js) et celle des calottes du pas (🧮⚖️🗻🧊, posée par le bilan méridien). Les autres
    // régimes sont posés par calculateWaterPartition.
    if (window.H2O.mondeOcean()) {
        window.H2O.partagerEau(window.H2O.masseGlaceMer(meridien.saisons) + DATA['🗻']['🧮⚖️🗻🧊'], DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧']);
    }

    // Surfaces sans glace (surfacesSansGlace, les mêmes que celles du bilan méridien) : lave (fraction fondue de la péridotite à la
    // température de surface COURANTE, Katz, Spiegelman & Langmuir 2003), océan, terres disponibles et leur aridité ; leur partage
    // forêt / désert / sol (terresLibres) lit la forêt des bandes de la dernière itération du bilan méridien.
    const SG = surfacesSansGlace();
    const volcano_coverage = SG.lave;
    const ocean_coverage_base = SG.rempli;
    const sec = SG.sec;

    let albedo_base = 0.0;

    // 🔒 GLACE, celle du bilan méridien à son état convergé — la même que celle de ses co-albédos de zone.
    // Les nuages ⛅ sont traités comme un voile optique indépendant, pas comme une surface additionnelle.
    const volcano_surface = volcano_coverage;
    // Calottes permanentes, celles du bilan méridien (MERIDIEN.surfacesZones) : posées sur la terre émergée, elles sont prises sur
    // les terres libres de leur bande (ALBEDO.terresLibres : le sol, puis le désert, puis la forêt) ; posées sur le plateau continental, sur le
    // bassin : sa part en eau sur l'océan, sa part à sec sur les terres. Une surface en fusion les couvre comme elle couvre l'océan
    // (× (1 − volcano_coverage)). Hors d'un monde à océan il n'y a pas de calotte (aire et albédo nuls, physics/calottes.js). Une seule
    // aire de calotte : si les surfaces de l'albédo ne peuvent pas la porter, c'est une incohérence entre la géologie et l'eau (erreur),
    // pas un second plafond.
    const zones = window.MERIDIEN.surfacesZones();
    const Z = (f) => ({ pol: f('pol'), mid: f('mid'), trop: f('trop') });
    const calotte_visible = 1.0 - volcano_coverage;   // part des calottes qui est une surface de glace
    const calotte_surface = EARTH.moyenneGlobe(Z((z) => zones[z].calotte)) * calotte_visible;
    const calotte_terre = EARTH.moyenneGlobe(Z((z) => zones[z].calotteTerre)) * calotte_visible;
    const calotte_plateau = calotte_surface - calotte_terre;
    const bandes = window.MERIDIEN.surfacesBandes(), libres = terresLibres(SG, bandes);
    let ocean_surface = SG.ocean - (1 - sec) * calotte_plateau;
    if (ocean_surface < -1e-9) {
        throw new Error('[calculateAlbedo] ' + DATA['📅']['📅'] + ' : calottes sur le plateau en eau ' + ((1 - sec) * calotte_plateau).toFixed(6)
            + ' pour un océan de ' + SG.ocean.toFixed(6) + ' : les surfaces de l\'albédo ne portent pas les calottes du bilan méridien');
    }
    const calotte_effective = calotte_surface;
    // Lumière réfléchie par les calottes : l'albédo annuel de la calotte de chaque bande (DATA['🗻']['🧮🪩🗻🧊'], bilan de calotte
    // pondéré par l'insolation : neige sèche hors fonte, neige mouillée puis glace nue pendant la fonte), pondéré par sa calotte
    // (surfacesBandes) — la pondération du co-albédo de zone du méridien : une seule source de l'albédo des calottes.
    const albedoCalotte = DATA['🗻']['🧮🪩🗻🧊'];
    const refletCalotteZone = { pol: 0, mid: 0, trop: 0 };
    for (const b of window.CALOTTES.BANDES) refletCalotteZone[b.zone] += bandes[b.cle].calotte * albedoCalotte[b.cle] / 2;
    const reflet_calotte = EARTH.moyenneGlobe(refletCalotteZone) * calotte_visible;
    // Glace SAISONNIÈRE (EARTH.glaceSaisonniere, état convergé du bilan méridien), pondérée par l'ÉNERGIE solaire qu'elle reçoit — la
    // pondération du co-albédo de bande du méridien : dans chaque bande, la mer gelée couvre sa mer libre et la neige sa terre libre
    // (surfacesBandes), chacune pendant sa part e de l'énergie solaire annuelle ; sur le globe, la part gelée de l'océan libre est la
    // moyenne des bandes pondérée par leur mer libre, la part enneigée des terres libres (terres, forêt, désert, bassin à sec) la
    // moyenne pondérée par leur terre libre ; le reste de l'année la surface est libre. La lumière que la glace de chaque bande
    // réfléchit est sa part r de l'énergie solaire annuelle (🍰☀️🪩🧊 : albédo qui suit la saison, EARTH.glaceSaisonniere).
    const e = DATA['🪩']['🍰☀️🧊'], r = DATA['🪩']['🍰☀️🪩🧊'];
    // Moyenne de v sur les bandes pondérée par poids × surface de la bande ; sans cette surface nulle part (pas de mer, ou pas de
    // terre libre), rien n'y gèle.
    const moyenneSur = (poids, v) => {
        const p = window.MERIDIEN.moyenneBandes(poids);
        return p > 0 ? window.MERIDIEN.moyenneBandes((b) => poids(b) * v(b)) / p : 0;
    };
    // Part du bassin océanique restée à sec faute d'eau (sec, surfacesSansGlace) : un sol, compté avec les terres libres (il prend la
    // neige des terres de sa bande).
    const merLibre = (b) => bandes[b.cle].mer, terreLibre = (b) => bandes[b.cle].terre + sec * bandes[b.cle].mer;
    const merGelee = moyenneSur(merLibre, (b) => e[b.cle].mer);
    const terreEnneigee = moyenneSur(terreLibre, (b) => e[b.cle].terre);
    // Forêt, désert et sol des terres libres de chaque bande (terresLibres), sous la lave, chacun hors de la neige de sa bande.
    const libre = (k, neige) => calotte_visible * window.MERIDIEN.moyenneBandes((b) => libres[b.cle][k] * (neige ? 1 - e[b.cle].terre : 1));
    const terres_libres = libre('foret', false) + libre('desert', false) + libre('sol', false);
    const ice_surface = ocean_surface * merGelee + terres_libres * terreEnneigee;
    const reflet_glace = ocean_surface * moyenneSur(merLibre, (b) => r[b.cle].mer) + terres_libres * moyenneSur(terreLibre, (b) => r[b.cle].terre);
    ocean_surface *= 1 - merGelee;
    const forest_surface = libre('foret', true), land_surface = libre('sol', true), desert_surface = libre('desert', true);
    // Albédo moyen de la glace saisonnière (affiché) ; sans glace saisonnière, il n'y a rien à moyenner.
    const iceAlbedoEff = ice_surface > 0 ? reflet_glace / ice_surface : null;
    // Les surfaces partagent la planète par construction (lave, bassin rempli, terres ; calottes et glace saisonnière prises sur
    // elles) : leur somme vaut 1, chacune est positive. Sinon, c'est une erreur, pas une remise à l'échelle.
    const surfaces = { volcan: volcano_surface, ocean: ocean_surface, foret: forest_surface, glace: ice_surface, calottes: calotte_effective,
        terre: land_surface, desert: desert_surface };
    const surface_sum = Object.values(surfaces).reduce((s, v) => s + v, 0);
    if (!(Math.abs(surface_sum - 1.0) <= 1e-9) || Object.values(surfaces).some((v) => !(v >= 0))) {
        throw new Error('[calculateAlbedo] ' + DATA['📅']['📅'] + ' : surfaces ' + JSON.stringify(surfaces) + ', somme ' + surface_sum
            + ' (1 attendu, chacune ≥ 0) à T̄ = ' + DATA['🧮']['🧮🌡️'] + ' K — bassin rempli ' + ocean_coverage_base + ', lave ' + volcano_coverage);
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🎾'] = volcano_surface;
    DATA['🪩']['🍰🪩🌊'] = ocean_surface;
    DATA['🪩']['🍰🪩🌳'] = forest_surface;
    DATA['🪩']['🍰🪩🧊'] = ice_surface + calotte_effective;   // toute la glace : saisonnière (pondérée par l'énergie) + calottes
    DATA['🪩']['🍰🪩🌍'] = land_surface;
    DATA['🪩']['🍰🪩🏜️'] = desert_surface;

    const dT = window.MERIDIEN.ecarts();
    if (CONFIG_COMPUTE.logIceFractionDiagnostic) {
        const t = DATA['🪩']['🍰📅🧊'];
        const msg = '[calculateAlbedo][calculations_albedo.js] 🧊 ep=' + DATA['📅']['📅']
            + ' phase=' + DATA['🧮']['🧮⚧']
            + ' T=' + DATA['🧮']['🧮🌡️'].toFixed(2) + 'K (' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(2) + '°C)'
            + ' | dT pol/mid/trop=' + dT.pol.toFixed(2) + '/' + dT.mid.toFixed(2) + '/' + dT.trop.toFixed(2)
            + ' | année gelée terre/mer ' + window.CALOTTES.BANDES.map((b) => b.cle + ' ' + t[b.cle].terre.toFixed(3) + '/' + t[b.cle].mer.toFixed(3)).join(' ')
            + ' | énergie gelée terre/mer ' + window.CALOTTES.BANDES.map((b) => b.cle + ' ' + e[b.cle].terre.toFixed(3) + '/' + e[b.cle].mer.toFixed(3)).join(' ')
            + ' | énergie réfléchie terre/mer ' + window.CALOTTES.BANDES.map((b) => b.cle + ' ' + r[b.cle].terre.toFixed(3) + '/' + r[b.cle].mer.toFixed(3)).join(' ')
            + ' | calottes=' + zones.pol.calotte.toFixed(3) + '/' + zones.mid.calotte.toFixed(3) + '/' + zones.trop.calotte.toFixed(3)
            + ' | glace saisonnière=' + ice_surface.toFixed(4) + ' calottes=' + calotte_effective.toFixed(4)
            + ' étendue=' + window.MERIDIEN.etendueGlace().toFixed(4);
        console.log(msg);
        window.debugMirrorConfigLogToFile('logIceFractionDiagnostic', msg);
    }

    window._hystDiag.T_polar_C = DATA['🧮']['🧮🌡️'] - dT.pol - CONST.T0_WATER;
    window._hystDiag.T_midlat_C = DATA['🧮']['🧮🌡️'] - dT.mid - CONST.T0_WATER;
    window._hystDiag.T_tropical_C = DATA['🧮']['🧮🌡️'] - dT.trop - CONST.T0_WATER;
    window._hystDiag.f_global_ice = window.MERIDIEN.etendueGlace();
    window._hystDiag.iceAlbedoEff = iceAlbedoEff;

    let weighted_albedo = 0;
    weighted_albedo += volcano_surface * M['🪩🍰🎾'];
    weighted_albedo += ocean_surface * M['🪩🍰🌊'];
    weighted_albedo += forest_surface * M['🪩🍰🌳'];
    weighted_albedo += land_surface * M['🪩🍰🌍'];
    weighted_albedo += desert_surface * M['🪩🍰🏜️'];
    weighted_albedo += reflet_glace;                                   // glace saisonnière, zone par zone
    weighted_albedo += reflet_calotte;                                 // calottes permanentes, bande par bande
    window._hystDiag.calotteSurface = calotte_effective;
    window._hystDiag.bassinSec = sec;

    albedo_base = weighted_albedo;
    // Une seule loi de surface : la moyenne sur le globe (par la surface) des albédos de surface des zones du bilan méridien est
    // celle de ces surfaces-ci. Sinon, les deux bilans ne décrivent pas la même planète : erreur.
    const RgGlobe = EARTH.moyenneGlobe(meridien.Rg);
    if (!(Math.abs(RgGlobe - albedo_base) <= 1e-9)) {
        throw new Error('[calculateAlbedo] ' + DATA['📅']['📅'] + ' : albédo de surface du globe ' + albedo_base + ' (surfaces ' + JSON.stringify({
            lave: volcano_surface, ocean: ocean_surface, foret: forest_surface, sol: land_surface, desert: desert_surface, glace: ice_surface,
            calottes: calotte_effective }) + ') ≠ moyenne des zones du bilan méridien ' + RgGlobe + ' (Rg ' + JSON.stringify(meridien.Rg) + ')');
    }

    let albedo = albedo_base;

    // « CONTRIBUTION H2O (GLACE) » RETIRÉE le 2026-10-13 (présente depuis V1.0.0) : elle tirait encore l'albédo vers celui
    // de la glace, au prorata de la masse de glace (🍰💧🧊), alors que la surface de glace (🍰🪩🧊) est DÉJÀ dans le
    // mélange des surfaces ci-dessus — la glace comptait deux fois (la seconde sans pondération par l'ensoleillement).
    // Nulle en snowball (surface déjà toute en glace), elle amplifiait la bascule aux états intermédiaires : sur 🦣,
    // rétroaction glace–albédo ~1,9 W/m²/K entre 16 et 8 °C, et plus aucun équilibre tempéré.
    // ── NUAGES (2026-10-13) : fraction MESURÉE, réflectance CALCULÉE (nuage adiabatique limité par la pluie) ─────────
    // Remplace : 🍰🪩⛅ = (CLOUD_FRACTION_BASE + CLOUD_FRACTION_INDEX_GAIN·☁️) × OPTICAL_EFF_BASE × Twomey × pression ×
    // oxydation × température, plafonnée à 0,75, avec une réflectance FIXE r_c = 0,42 — une « fraction optique » réglée.
    //   · f = fraction GÉOMÉTRIQUE du ciel couvert, MESURÉE (King et al. 2013, MODIS) : 0,72 sur océan, 0,55 sur
    //     continent, pondérée par l'océan libre. La dynamique 3D qui la fixe (subsidence, inversions, convection)
    //     n'a pas d'équation fermée en 1D ; deux essais physiques ont échoué (RADIATIVE.profilAtmosphere, en-tête nuage).
    //   · R = réflectance du nuage, deux-flux conservatif (Lacis & Hansen 1974) : R = √3(1−g)τ / (2 + √3(1−g)τ),
    //     τ = τ_SW du nuage adiabatique de la parcelle, de sa base jusqu'au rayon de pluie (RADIATIVE.colonneNuageuse) —
    //     MÊME eau, MÊMES rayons que l'opacité IR. Twomey et Albrecht sont dans τ (N des CCN) ; plus aucun facteur
    //     pression / oxydation / température. ☁️ (Sundqvist) ne pilote plus la couverture.
    // Colonne : vapeur, nuages bas (population de la base au rayon de pluie) et hauts (enclumes), fractions mesurées
    // (physics.js EARTH.NUAGES), puis transfert SOLAIRE (radiative/solaire.js : Lacis & Hansen pour Rayleigh, ozone et nuages,
    // Chou & Suarez 1999 pour la vapeur) et surface.
    // ALBÉDO AU SOMMET : celui du bilan méridien (meridien.A), la lumière réfléchie par chaque zone — son albédo de surface, ses
    // angles solaires — pondérée par l'insolation qu'elle reçoit. Un albédo de surface moyenné sur les AIRES puis passé au
    // transfert global compterait une glace polaire, qui reçoit 0,59 fois l'insolation moyenne, comme si elle recevait la
    // moyenne. Le transfert global (SOLAIRE.albedo, ∫ A(μ₀) 2μ₀ dμ₀) ne donne plus que les ciels du diagnostic, à l'albédo de
    // surface vu par le Soleil (meridien.RgSoleil).
    const sol = window.SOLAIRE.albedo(meridien.RgSoleil, colonne);
    const cloud_fraction = sol.couverture;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    window._hystDiag.preCloudAlbedo = albedo;            // albédo de SURFACE (moyenne par la surface)
    window._hystDiag.albedoSurfaceSoleil = meridien.RgSoleil;   // albédo de surface pondéré par l'insolation
    window._hystDiag.albedoCielClair = sol.Aclair;       // au sommet, ciel clair
    window._hystDiag.albedoCielBas = sol.Abas;           // au sommet, nuages bas seuls (population)
    window._hystDiag.albedoCielHaut = sol.Ahaut;         // au sommet, nuages hauts seuls (population)
    window._hystDiag.colonneOzone = sol.ozone;
    window._hystDiag.tauNuageSW = colonne.tauSW;         // nuage le plus profond (au seuil de pluie)
    window._hystDiag.tauNuageIR = colonne.tauIR;
    window._hystDiag.eauNuage = colonne.W;
    window._hystDiag.cloudFraction = cloud_fraction;
    window._hystDiag.cloudCoeff = sol.Abas;
    if (CONFIG_COMPUTE.logCloudProxyDiagnostic) {
        const mCloud = '[nuages] epoch=' + DATA['📅']['📅']
            + ' T_C=' + CONST.K2C(DATA['🧮']['🧮🌡️']).toFixed(2)
            + ' f=' + cloud_fraction.toFixed(3)
            + ' base=' + colonne.base.toFixed(0) + 'm sommet=' + colonne.sommet.toFixed(0) + 'm'
            + ' W=' + (1000 * colonne.W).toFixed(1) + 'g/m²'
            + ' τ_SW=' + colonne.tauSW.toFixed(2)
            + ' A_sol=' + albedo.toFixed(3) + ' A_clair=' + sol.Aclair.toFixed(3) + ' A_bas=' + sol.Abas.toFixed(3) + ' A_haut=' + sol.Ahaut.toFixed(3)
            + ' ccn=' + window._hystDiag.ccnRatio.toFixed(3);
        console.log(mCloud);
        window.debugMirrorConfigLogToFile('logCloudProxyDiagnostic', mCloud);
    }
    // 🪩🍰⛅ : albédo des nuages BAS vus du sommet (population, absorption comprise).
    DATA['🪩']['🪩🍰⛅'] = sol.Abas;
    albedo = meridien.A;

    const final_albedo = Math.max(0.0, Math.min(0.9, albedo));
    
    // 🔒 Facteur corps noir : si pas assez d'eau pour 10m de profondeur, réduire l'albedo
    // Calculer le volume d'eau disponible (m³)
    const water_volume_m3 = DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER;
    
    // Surface totale de la planète (m²)
    const planet_surface_m2 = 4 * Math.PI * Math.pow(DATA['📜']['📐'] * 1000, 2);

    // Volume minimal requis pour 10 mètres de profondeur (m³)
    const min_depth_m = 10; // 10 mètres minimum
    const min_volume_required_m3 = planet_surface_m2 * min_depth_m;
    
    // Ratio : si ratio < 1, pas assez d'eau pour 10m de profondeur
    // Si ratio = 0 (pas d'eau), blackbody_factor = 0 (corps noir)
    const water_ratio = min_volume_required_m3 > 0 ? water_volume_m3 / min_volume_required_m3 : 0;
    
    // blackbody_factor : 0 si pas d'eau, 1 si assez d'eau pour 10m
    const blackbody_factor = Math.min(1, Math.max(0, water_ratio));
    
    // Appliquer au final_albedo
    const final_albedo_with_water = final_albedo * blackbody_factor;
    if (!Number.isFinite(final_albedo_with_water)) {
        throw new Error('[calculateAlbedo] 🍰🪩📿 non fini (NaN/Inf) — contrôler 🧮🌡️, surfaces, cloud_fraction. T_K=' + DATA['🧮']['🧮🌡️'] + ' albedo=' + albedo + ' cloud_fraction=' + cloud_fraction + ' final_albedo=' + final_albedo + ' blackbody_factor=' + blackbody_factor);
    }
    // 🔒 Les surfaces sont déjà stockées plus haut (lignes 249-254)
    // ice_fraction_base est la surface de glace, ice_fraction_stock est la fraction du stock d'eau
    const A_eff = applyVeilToPlanetaryAlbedo01(final_albedo_with_water);
    if (!Number.isFinite(A_eff)) {
        throw new Error('[calculateAlbedo] albédo effectif (voile) non fini — A_geo=' + final_albedo_with_water);
    }
    DATA['🪩']['🍰🪩📿'] = A_eff;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    // Facteur corps-noir exposé : sans lui, le détail affiché (couverture × coefficient) ne peut pas
    // reproduire 🍰🪩📿 — une couche d'eau de 2 m sur une bille de roche ne réfléchit pas comme une banquise.
    DATA['🪩']['🍰🪩💧'] = blackbody_factor;
    // Albédo EFFECTIF de la glace saisonnière (lumière réfléchie / énergie reçue, sommées sur les bandes, 🍰☀️🪩🧊 / 🍰☀️🧊) — c’est lui
    // qui entre dans A_geo, pas le coefficient du matériau DATA['🪩🍰']['🪩🍰🧊'] ; null sans glace saisonnière.
    DATA['🪩']['🧮🪩🍰🧊'] = iceAlbedoEff;
    // ── Diagnostic hystérésis (stash) : albédo agrégé
    window._hystDiag.weightedAlbedoBase = weighted_albedo;
    window._hystDiag.finalAlbedo = final_albedo;
    window._hystDiag.blackbodyFactor = blackbody_factor;
    window._hystDiag.aEff = A_eff;
    // [v1.2.65] Journalisation par appel RETIRÉE (FNTRACE + DATA_DUMP JSON complet de DATA vers _logs/<onglet>.txt) :
    // c'était un diagnostic temporaire du 16/07 pour comparer test vs visu — cause trouvée (Δ(T) non monotone,
    // cf. v1.2.64). Elle sérialisait DATA à CHAQUE calculateAlbedo (plusieurs centaines par convergence) → fichiers
    // énormes et ralentissement. Les diagnostics gardés sont tous GATÉS par CONFIG_COMPUTE.log* (_logIceSnap ci-dessus,
    // logIceFractionDiagnostic, logCloudProxyDiagnostic…), false par défaut.
    return A_eff;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // 🔒 REFONTE : calculateCloudCoverage() est maintenant DEPRECATED
    // Utiliser calculateCloudFormationIndex() + 🍰🪩⛅ = C_max × ☁️ à la place
    // Cette fonction est conservée pour compatibilité. Calculs en K (DATA officiel).
    const T_K = DATA['🧮']['🧮🌡️'];
    const T_COLD_K = 253.15;   // -20°C
    const T_0_K = CONST.T0_WATER;     // 0°C
    const T_REF_MAX_K = 303.15;  // 30°C

    if (T_K < T_COLD_K) {
        const cloud_at_cold = 0.05;
        const decay_rate = 0.1;
        const cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_K - T_COLD_K));
        return Math.min(1, Math.max(0, cloud_fraction));
    }
    if (T_K < T_0_K) {
        const cloud_at_0 = 0.2;
        const cloud_at_cold = 0.05;
        const cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_K - T_COLD_K) / 20);
        return Math.min(1, cloud_fraction);
    }
    const cloud_fraction_min = 0.2;
    const cloud_fraction_max_physical = 0.75;
    const cloud_fraction_max_limited = 0.6;
    const physical_fraction = (T_K >= T_REF_MAX_K)
        ? cloud_fraction_max_physical
        : cloud_fraction_min + (cloud_fraction_max_physical - cloud_fraction_min) * (T_K / T_REF_MAX_K);
    return Math.min(1, Math.min(cloud_fraction_max_limited, physical_fraction));
}

function calculateSolarFluxAbsorbed() {
    const DATA = window.DATA;
    // 🔒 calculateAlbedo() renvoie 🍰🪩📿 = albédo effectif (A_geo + voile 🍰⚽) ; pas de second facteur 🍰🪩⚽
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    return solar_flux_average_wm * (1 - albedo);
}

// Diagnostics lus par le panneau hystérésis (CO2/html/hysteresis_compute.html) : rempli à chaque calculateAlbedo.
window._hystDiag = {};

var ALBEDO = window.ALBEDO = {};
ALBEDO.syncStratosphericVeil01 = syncStratosphericVeil01;
ALBEDO.applyVeilToPlanetaryAlbedo01 = applyVeilToPlanetaryAlbedo01;
ALBEDO.calculateAlbedo = calculateAlbedo;
ALBEDO.albedoGlaceSeche = albedoGlaceSeche;
ALBEDO.partLave = partLave;
ALBEDO.FORET = FORET;
ALBEDO.poserForet = poserForet;
ALBEDO.foretSousNeige = foretSousNeige;
ALBEDO.surfacesSansGlace = surfacesSansGlace;
ALBEDO.terresLibres = terresLibres;
ALBEDO.rapportCCN = rapportCCN;
ALBEDO.fractionMaritime = fractionMaritime;
ALBEDO.nombreGouttesActuelCm3 = nombreGouttesActuelCm3;
ALBEDO.nombreGouttesCm3 = nombreGouttesCm3;
ALBEDO.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
ALBEDO.calculateCloudFormationIndex = calculateCloudFormationIndex;
ALBEDO.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
ALBEDO.calculateGeologySurfaces = calculateGeologySurfaces;
// Expositions : tout passe par window.ALBEDO (doublons window.foo retirés).



