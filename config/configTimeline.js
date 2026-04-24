// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.4.37
// Date: [April 24, 2026]
// logs :
// - v1.4.37: Remplace le test tropopause WMO direct par une hauteur radiative effective héritée de RT/Mg,
//   multipliée par CONFIG_COMPUTE.radiativeTropopauseExtensionFactor=1.03. Objectif : tester une
//   transition radiative progressive au-dessus de la hauteur d'échelle sans surchauffer le modèle.
// - v1.4.36: Ajout CONFIG_COMPUTE.tropopauseReferenceTemperatureK=216.65 et
//   troposphericLapseRateKPerM=0.0065. Corrige la confusion tropopause vs hauteur d'échelle RT/Mg :
//   📏🫧🛩 suit désormais la définition lapse-rate standard (WMO / U.S. Standard Atmosphere).
// - v1.4.35: Ajout CONFIG_COMPUTE.co2OceanPartitionFactor01 (1 actif, 0 test off) pour isoler l'impact
//   de la partition CO₂ océan-atmosphère sur la divergence 2000. Multiplicateur contractuel, sans branche
//   logique nouvelle ; appliqué aussi au seed ⚖️🌊🏭 dans calculations_flux.js v1.2.97.
// - v1.4.34: Glace solver — freezePolarIceDuringSearch remis à true. Le verrou reste une stabilisation
//   numérique du run direct ; le scan hystérésis conserve son déverrouillage via HYSTERESIS.active.
// - v1.4.33: Glace solver — pose explicite CONFIG_COMPUTE.freezePolarIceDuringSearch=false.
//   Le run direct et l'hystérésis utilisent désormais la même rétroaction glace-albédo ; le verrou Search
//   reste réactivable par ce flag indépendant si besoin de debug numérique.
// - v1.4.32: ⛄ Plein Snowball — config générale posée sur la branche froide trouvée par hysteresis 1a
//   (T≈-62.78°C, ⚖️🏭≈1.930e15 kg, ⚖️✈≈1.018e12 kg). Objectif : run direct cohérent avec le seuil
//   froid d'hystérésis, sans propager HYSTERESIS.active ni ajouter de garde/fallback logique.
// - v1.4.31: hysteresis 1a — ajout explicite de ⚖️✈=1.0e12 kg pour aligner le run direct avec l'init
//   du scan hystérésis (baseline sulfate volcanique Néoprotérozoïque). Retrait de l'ancienne valeur commentée
//   8.0e15 kg afin d'éviter un désaccord config/calcul sans ajouter de fallback logique.
// - v1.4.30: EPOCH['🌊🏭'] facteur pompe océanique CO₂ (Henry × Urey) ajouté aux 19 époques. Corrèle avec
//   calculations_co2.js v1.2.0 (pompe toujours active) + calculations_flux.js v1.2.96 (seed ⚖️🌊🏭=50·⚖️🏭
//   à l'init d'époque, équilibre Henry analytique ⇒ net flux = 0 au pas 0). Valeurs :
//   ⚫ 🔥 = 0 (pas d'océan liquide) ; 🦠 = 0.05 (peu de continents émergés) ; 🪸 = 0.15 (Urey lent pré-Rodinia,
//   Goddéris 2017) ; ☃ hyst 1a = 0.5 (Rodinia break-up + Franklin LIP, Mills 2011, Macdonald 2010) ;
//   ⛄ = 0 (banquise coupe Henry, Higgins & Schrag 2003) ; ⛈ hyst 1b = 2.0 (déglaciation catastrophique
//   + carbonates de couverture Marinoen) ; 🪼 = 1.0 (Walker-Hays-Kasting 1981) ; 🍄 = 1.3 (forêts Dévonien/
//   Carbonifère → weathering accru, Berner GEOCARB III 2001) ; 💀 = 0.7 (Trapps sibériens saturent océan) ;
//   🦕 🦤 = 1.0 ; 🐊 hyst2 🏔 = 1.1 (orogenèse himalayenne, Raymo & Ruddiman 1992) ; 🦣 🛖 🚂 📱 = 1.0.
//   Désormais chaque époque DOIT avoir '🌊🏭' (crash-first : pas de fallback côté calculations_co2.js).
//   NEW : CONFIG_COMPUTE.co2OceanRatioRef = 50 (rapport Henry modern ; Sarmiento & Gruber 2006).
//   RETRAIT : CONFIG_COMPUTE.co2OceanPartitionInRadiativeConvergence (obsolète — remplacé par EPOCH['🌊🏭']).
// - v1.4.29: Correction config hysteresis 1a (Sturtienne) confrontée à la littérature Néoprotérozoïque.
//   ⚖️🐄 CH₄ : 1.0e14 kg (35 ppm, borne sup. extrême) → 2.0e13 kg (7 ppm, milieu fourchette post-GOE
//   1-30 ppm ; Kasting 2005 ; Olson 2016 ; Daines & Lenton 2016).
//   ⚖️🫁 O₂ : 1.5e16 kg (1.3 % PAL) → 5.0e15 kg (0.4 % PAL, cœur fourchette 0.1-1 % PAL pré-NOE ;
//   Lyons et al. 2014 Nature 506:307 ; Planavsky et al. 2014 Science 346:635 ; Sperling 2015).
//   ⚖️🏭 CO₂ : INCHANGÉ à 1.0e16 kg (1280 ppm) = baseline warm branch pré-snowball, fourchette lit.
//   1000-3000 ppm (Hoffman & Schrag 2002 ; Bao et al. 2008 Nature 453:504 ; Hoffman 2017 Sci Adv 3:e1600983).
//   NB important : 1280 ppm N'EST PAS le seuil de bifurcation. Le seuil GCM est à 100-300 ppm
//   (Voigt & Marotzke 2010 ; Voigt & Abbot 2012 ; Yang et al. 2012 ; Hörner et al. 2022). C'est la
//   recherche hystérésis qui descend jusque-là en scannant le CO₂.
// - v1.4.28: rename CONFIG_COMPUTE.iceBlendRelaxation01 → iceInertiaFactor01 + passage en forme EXPONENTIELLE dans calculations_albedo.js v1.2.54. Nouveau contrat : tau_eff = tauGlaceAns × iceInertiaFactor01 ; fraction_fonte = 1 − exp(−duree_ans/tau_eff). Sémantique : factor=1.0 → temporalité géologique standard ; factor>1 → plus d'inertie (relaxation plus lente) ; factor<1 → moins d'inertie (conv. plus rapide vers glace_equilibre) ; factor=0 → équilibre instantané. Avantages vs forme linéaire : (1) toujours borné [0,1) sans clamp, (2) semantique physique claire (constante de temps), (3) additif aux exp cascades (half-life). Cf. flux v1.2.96, h2o v1.0.24.
// - v1.4.27: ajout CONFIG_COMPUTE.iceBlendRelaxation01 (défaut 1.0) — facteur de relaxation appliqué au blend dt de la glace dans calculations_albedo.js v1.2.53. 0.0 = blend off (glace reste à DATA courant), 0.5 = amortissement Picard, 1.0 = temporalité brute (duree_ans/tauGlaceAns). Introduit lors de la suppression du verrou STATE.iceEpochFixedWaterState pour permettre de calibrer la temporalité sans désactiver le couplage. Cf. flux v1.2.95, h2o v1.0.23.
// - v1.4.26: fix 📱 Aujourd'hui — ajout '🌱': 0.31 manquant (oubli v1.4.21 Task #9). Bug : EPOCH['🌱']=undefined → forest_potential=NaN → forest_coverage=NaN → weighted_albedo=NaN → crash [calculateAlbedo] 🍰🪩📿 non fini. ⚫ Corps noir n'a pas non plus '🌱' mais est protégé par ternaire (DATA['📜']['🗿'] === '⚫') ? 0 : forest_potential, donc safe. Fix signalé par Zorba sur setEpoch(2000).
// - v1.4.25: EPOCH['🧫'] biosphère MARINE (gate CLAW DMS-CCN) ajouté aux 19 époques — symétrique de 🌱 terrestre. Valeurs : ⚫/🔥=0 (abiotique), 🦠=0.05, 🪸=0.1, ☃=0.05, ⛄=0.05 (océan gelé, critique pour sortie Snowball), ⛈=0.1, 🪼=0.5, 🍄=0.7, 💀=0.3 (effondrement anoxique), 🦕→📱=1.0. Couple avec calculations_albedo.js v1.2.49 sulfate_boost × EPOCH['🧫']. Réfs : Charlson-Lovelock-Andreae-Warren 1987 Nature 326:655 (CLAW), Knoll 2003, Falkowski 2004 Science 305:354, Quinn & Bates 2011 Nature 480:51.
// - v1.4.24: baryByGroupDefault — littéral retiré ; assignation unique dans initDATA.js v1.3.1 depuis window.DEFAULT.TUNING.baryByGroup (évite doublon 25 % vs ATM 15 % au bench).
// - v1.4.23: bornes per-epoch structurées '🔒' pour la jauge bary d'hystérésis (Step 2). Schéma : '🔒'[mass_key] = { min, max, cools }. Sources : CSV GRILLE LITTÉRATURE (haut de fichier) + références paléo. Priorité Step 2 : 🦠 Archéen (CSV [50k,150k]ppm CO₂ etc.), ⛄ Plein Snowball (CSV [300,1500]ppm CO₂, [0.1,10]ppm CH₄), 📱 Aujourd'hui (RCP pré-industriel → RCP8.5). Les autres époques utiliseront un fallback multiplicatif global dans Step 3 (scie_hysteresis_bary.js). 'cools' : direction dans laquelle la bary refroidit ('min' pour GES, 'max' pour sulfates). Pas de changement logique moteur, juste lecture par l'algo hystérésis.
// - v1.4.22: Archéen 🦠 — CO₂ CAP au max bench [50k,150k] mol ppm : '⚖️🏭' 10.62e18 → 2.75e18 kg (~150k mol ppm). '⚖️🫧' recalculé 1.2700e19 kg. Bornes acceptables annotées en commentaires pour chaque clé de masse (CO₂/CH₄/H₂O/N₂/O₂/sulfates) avec repère Archéen bench + PAL. Bloc doc obliquité ⚾ étendu : plages physiques [0°, 90°] (Laskar 1993 sans Lune, Williams 1993 45–70°, Milankovitch 22–24.5°, seuil 54° basse-lat). Pas de changement logique, uniquement valeurs + doc.
// - v1.4.21: baryByGroupDefault CLOUD_SW/SCIENCE 65 -> 25 pour aligner l'UI fine-tuning avec initDATA DEFAULT.TUNING.baryByGroup (source visible utilisateur).
// - v1.4.20: amplification polaire — retrait TOTAL des overrides par époque (plus de clés polarAmplificationK / midlatAmplificationK dans hysteresis 1a ni ⛄). Les constantes dT_pol/dT_mid passent en GEOPHYSICAL GLOBAL CONSTANT via EARTH.POLAR_AMP_POL_K / EARTH.POLAR_AMP_MID_K (physics.js). Défauts CONFIG_COMPUTE alignés (20 K / 5 K, override expérimental uniquement). Formule unifiée albedo/flux/h2o ancrée sur T_FREEZE_SEAWATER + dT (cf. calculations_albedo.js v1.2.48, calculations_flux.js v1.2.91, calculations_h2o.js v1.0.20). Pas de patch par époque : faire de la physique, pas du patch.
// - v1.4.19: (DÉPRÉCIÉ par v1.4.20) amplification polaire epoch-spécifique via clés EPOCH.
// - v1.4.18: refacto post-step recalc (calculations_flux) — suppression du bloc redondant water/albedo/flux/Δ + bracket update + switch Dicho juste après le step. Ces opérations sont déjà faites en début de boucle suivante (lignes 755-887) sur le même T_next → travail en double (2× coût flux/itération). Snapshot figé à T_input (data_snapshot['🧮']['🧮🌡️'] override) pour que cycle albédo/water/radiatif affichent tous la même T. Label 🪩 cycle albédo lit state.temperature_C (= T_input) au lieu de next_T_C (scie_convergence.js).
// - v1.4.17: firstSearchStepCapK SUPPRIMÉ (annule v1.4.14/v1.4.11/v1.4.3/v1.4.2/v1.4.10) — patch SB linéarisé historique rendu obsolète par calculateH2OParameters() pre-flux Init (calculations_flux v1.2.90). Code du cap retiré côté solveur. climateSpinupCycles 8→1 (les 8 palliaient le bug H2O=0 à Init).
// - v1.4.16: Archéen 🦠 — commentaires ⚖️🏭/🐄/💧/💨 : bornes grille bench (ppm, % vap. atm) à côté des masses kg ; distinction océan vs vapeur atmosphérique.
// - v1.4.15: Archéen 🦠 — duplication explicite des fourchettes tolérables (grille bench) dans l’objet TIMELINE + note : plage T [10,60] °C = enveloppe large pour affichage bench, pas précision paléo serrée ; resync epoch_bench BENCH_LIT 🦠.
// - v1.4.14: firstSearchStepCapK 0 → 4 (régression migration v1.4.13 : 📱 2000 passait 14 °C → 13,37 °C). Valeur réf. historique = 4 K.
// - v1.4.13: CONFIG_COMPUTE source UNIQUE SOLVER (retrait DATA['🎚️'].SOLVER / DEFAULT.TUNING.SOLVER) → clés tolMinWm2, maxSearchStepK, maxSearchStepLargeK, largeDeltaFactor, deltaTAccelerationDays, firstSearchStepCapK, bornesMinK, bornesMaxK, searchStepScaleMax. Valeurs directes (plus de miroirs depuis DATA).
// - v1.4.12: retrait SOLVER_TUNING + blocs CONFIG_COMPUTE.{tolMinWm2,maxSearchStepK,maxSearchStepLargeK,largeDeltaFactor,searchStepScaleMax,bornesMinK,bornesMaxK} — dead code (écrits 2× jamais lus). Source SOLVER unique : window.TUNING.SOLVER.
// - v1.4.11: fallback FIRST_SEARCH_STEP_CAP_K 4 K (amortissement 1er pas Init) ; aligné initDATA / configsAll
// - v1.4.10: fallback SOLVER_TUNING.FIRST_SEARCH_STEP_CAP_K 8 K (si TUNING absent) ; aligné initDATA / configsAll pour 1er pas Init
// - v1.4.9: baryByGroupDefault — CLOUD_SW 65 % + SCIENCE 65 % (bench ; convergence ajustée graines/gaz) ; graines 🌡️🧮 + ⚖️ gaz Archéen→Holocène (lit. CSV)
// - v1.4.8: baryByGroupDefault — CLOUD_SW 50 % + SCIENCE 50 % (jauge unique scie/bench) ; SOLVER/HYSTERESIS 100 %
// - v1.4.7: baryByGroupDefault — SCIENCE 50 % (CLOUD_SW/SOLVER/HYSTERESIS 100 %) ; aligné initDATA / configsAll queue
// - v1.4.6: commentaire lien grille Lit. ↔ doc/epoch_bench.html (BENCH_LIT_BY_EPOCH_ID)
// - v1.4.5: retrait 🌡️📚 (jamais lu par le moteur ; évite confusion avec 🌡️🧮). Sync mental avec configsAll si doublon TIMELINE.
// - v1.4.4: grille littérature CSV (commentaire) + 🌡️🧮 ajustés vers milieux de plage (🔥 🦠 ⛄ hysteresis 1b 🏔) ; note CONV/H₂O/CC. Corps noir ±0 K.
// - v1.4.3: fallback FIRST_SEARCH_STEP_CAP_K: 0 (désactivé ; évite changement bassin convergence 📱)
// - v1.4.2: fallback SOLVER_TUNING — FIRST_SEARCH_STEP_CAP_K: 8 (aligné TUNING / calculations_flux 1er pas Init)
// - v1.4.1: 🦠 Archéen — 🧲🌕 au début époque (W/m²) pour bary 🕰.🔀 ['⚖️','🌕'] ; sans clé, getEpochDateConfig → NaN → T NaN / calculateAlbedo
// - v1.4.0: timeline étendue 19 époques. Renames : 🥟→🪸 Protérozoïque, ❄️→🦣 Quaternaire, 🦣→🦤 Cénozoïque.
//           hysteresis 1→1a (Sturtienne ☃) ; ⛄ resserré 720→690 ; insertion hysteresis 1b ⛈ (Sortie Marinoen 690→600).
//           🌿 Paléozoïque scindé en 🪼 marin (600→420), 🍄 terrestre (420→280), 💀 P/T (280→250).
//           hysteresis 2 (logo 🐧). 🏔 étendu jusqu'à 2e6. 🛖 Holocène (10 ka→1800). 🚂 Industriel (1800→2000) intégré dans TIMELINE.
// - v1.3.19: spectralBandLogoImgPx / EmojiPx défaut 18 px (bandes spectre, taille historique)
// - v1.3.18: spectralBandLogoImgPx / EmojiPx / ImgPxByEmoji (plot.js bandes [ ] : PNG vs UTF‑8)
// - v1.3.17: spectralEdsSunLambdaUm défaut 10 μm (repères EDS/Soleil sur le graphe)
// - v1.3.16: CONFIG_COMPUTE spectralBandIndicatorLiftPx, spectralEdsSunLambdaUm, spectralEdsSunStackLiftPx (plot.js marqueurs spectraux)
// - v1.3.15: commentaire 🐊 libellé UI « Éocène »
// - v1.3.14: CONFIG_COMPUTE.logCo2RadiativeDiagnostic (🔎 CO₂ atmosphère + 🧲📛🏭 pas hyst ; aligné configsAll)
// - v1.3.13: baryByGroupDefault.HYSTERESIS 100 (aligné initDATA 🎚️)
// - v1.3.12: CONFIG_COMPUTE.logIceFractionDiagnostic — trace chaîne 🍰🪩🧊 (polar + mer gelée + verrous + surface finale)
// - v1.3.11: 🥟 🕰 — action 🌋 (🔺🍰⚽ +2 % / clic) voile SW stratosphérique ; CONFIG_COMPUTE.hystStratosphericVeilExtra01
// - v1.3.10: hysteresis 1 🌡️🧮 290 K — graine « branche chaude » avant scan CO₂↓ (le seuil hystérésis reste trouvé par l’algo)
// - v1.3.9: co2OceanPartitionInRadiativeConvergence=false par défaut (pompe mer hors convergence naturelle ; anthropique plus tard)
// - v1.3.4: repères Ma affichage éditeur plaques alignés ▶ (⚫ 5000 Ma, 🔥 4500, 🦠 4000, 🌿 500, 🦕 250)
// - v1.3.5: (obsolète) 🌊🏭🧲 par époque — retiré en v1.3.8 ; pompe CO₂ mer = CONFIG_COMPUTE + jauges
// - v1.3.6: 📅 hystérésis → hysteresis 1 ; 📅 ⛰ (époque) → hysteresis 2 (⛄ 🏔 inchangés)
// - v1.3.7: hysteresis 2 → hidden:true (même classe epoch-text que hysteresis 1 sur frise verticale)
// - v1.3.8: retrait 🌊🏭🧲 de tous les blocs TIMELINE (pompe océan hors époque)
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.2.1: add sulfate proxy mass ⚖️✈ for 🚂/📱 and disable verbose debug flags
// - v1.2.2: paramètres solveur issus de static/tuning/model_tuning.js (source unique tuning)
// - v1.2.3: fallback synchrone des paramètres solveur si window.TUNING non chargé
// - v1.2.4: 🌿 = Paléozoïque (500–250 Ma), ordre chrono Protérozoïque → Paléozoïque → Mésozoïque → Cénozoïque
// - v1.2.5: baryByGroupDefault (CLOUD_SW/SCIENCE/SOLVER %) pour init DATA['🎚️'].baryByGroup dans initDATA.js
// - v1.2.6: dates simplifiées Protérozoïque ◀ 500 Ma, Paléozoïque 500–250 Ma ; 🏔 ▶ 33 Ma déjà en place
// - v1.2.7: Cénozoïque découpé : 🦣 66–50 Ma, 🐊 PETM 50–35 Ma, hysteresis 2 (ex-⛰) 35–33 Ma, 🏔 33–23 Ma
// - v1.2.8: commentaire 🦣 sans mention erronée « Crétacé » (🌿 = Paléozoïque)
// - v1.2.9: ❄️ Quaternaire (▶ 2 Ma) — calotte arctique / cycles glaciaires ; entre 🏔 et 🚂
// - v1.3.0: 🚂 (Industriel / 1800) retiré du tableau timeline (frise ❄️ → 📱) ; config physique 1800 référencée ailleurs si besoin
// - v1.3.1: 📱 🕰 — une seule action ⛽ par tranche (retrait 🛢 des buckets 2025/2050/2075)
// - v1.3.2: doc convention 📱 — tranche 2000 : 850e9 ↔ +850Gt en UI (pas SI Gt=1e12 kg ; cycle CO₂ / puits en attente TODO)
// - v1.3.3: libellé UI 🐊 « Éocène » (ex Hyperthermie éocène ; ex Terre étouffe PETM)
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': emoji époque, '▶': number, '◀': number, ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
//
// ============================================================================
// 🔒 LUMINOSITÉ SOLAIRE — NE PAS MODIFIER
// Formule de Gough (1981), Solar Physics 74:21 — physique nucléaire stellaire :
//   L(t_ago) = L☉ / (1 + 0.4 × t_ago / 4.57)
//   L☉ = 3.828e26 W (IAU 2015 Resolution B3)
//   t_ago = temps avant présent en Ga ; 4.57 Ga = âge du Soleil
//   🧲☀️ = L / (4π × AU²), AU = 1.496e11 m → TSI = 1361 W/m² (Kopp & Lean 2011)
//   🧲☀️🎱 = 🧲☀️ / 4 (géométrie sphérique)
// Confirmé par Bahcall, Pinsonneault & Basu (2001), ApJ 555:990 (Standard Solar Model).
// Toute valeur de 🔋☀️ DOIT être calculée avec cette formule. Pas d'arrondi arbitraire.
// ============================================================================
//
// ---------------------------------------------------------------------------
// GRILLE LITTÉRATURE (repère / bench) — CSV synthèse ; 🌡️🧮 TIMELINE = amorce solveur (K), pas T finale.
// Fourchettes dupliquées pour l’UI bench : doc/epoch_bench.html (BENCH_LIT_BY_EPOCH_ID) — resync si cette grille change.
// Chaque entrée d’époque dans timeline[] reprend en commentaire les mêmes nombres (voir Archéen 🦠 modèle).
// Colonnes : T_init °C plage ; CO₂ ppm ; CH₄ ppm ; H₂O vapeur mol % (atmosphère) ; albédo 🍰🪩📿.
// Mapping époques TIMELINE ↔ libellés CSV : ⚫ Corps_noir ; 🔥 Hadéen ; 🦠 Archéen ; 🪸 Protérozoïque ;
//   hysteresis 1a Sturtienne ; ⛄ Plein_Snowball ; hysteresis 1b Sortie_Marinoen ; 🪼 Paléozoïque_marin ;
//   🍄 Paléozoïque_terre ; 💀 Limite_P/T ; 🦕 Mésozoïque ; 🦤 Cénozoïque ; 🐊 Éocène ; 🏔 Oligocène/Grande_Coupure ;
//   🦣 Quaternaire ; 🛖 Holocène ; 📱 Aujourd'hui.
// Époque,T_init_°C,CO2_ppm,CH4_ppm,H2O_vap_mol_%,Albedo_🪩
// Corps_noir,[-19, -17],[0, 1],[0, 0.1],[0, 0.01],[0.29, 0.31]
// Hadéen,[2000, 2500],[100000, 500000],[10, 100],[10, 20],[0.15, 0.35]
// Archéen,[10, 60],[50000, 150000],[1000, 10000],[0.5, 3.0],[0.20, 0.30]
//   → T surface : enveloppe bench très large (early Archean ~4 Ga peu contraint en T exacte) ; ne pas lire « entre 10 et 60 °C » comme une incertitude expérimentale fine. Ajustements futurs : resserrer les bornes ici + ligne CSV Archéen + BENCH_LIT 🦠 + bloc commentaire objet Archéen (timeline[]).
// Protérozoïque,[5, 20],[5000, 20000],[50, 500],[0.5, 1.5],[0.25, 0.35]
// Sturtienne,[-50, 10],[500, 2000],[10, 50],[0.1, 1.0],[0.60, 0.85]
// Plein_Snowball,[-60, -20],[300, 1500],[0.1, 10],[0.01, 0.5],[0.80, 0.90]
// Sortie_Marinoen,[20, 50],[2000, 10000],[10, 100],[2.0, 5.0],[0.15, 0.25]
// Paléozoïque_marin,[15, 25],[1500, 5000],[5, 20],[1.0, 2.5],[0.20, 0.25]
// Paléozoïque_terre,[15, 25],[500, 3000],[5, 20],[1.0, 2.0],[0.20, 0.23]
// Limite_P/T,[20, 32],[1500, 4000],[20, 100],[1.5, 3.5],[0.18, 0.22]
// Mésozoïque,[20, 30],[1000, 2500],[10, 30],[1.5, 3.0],[0.18, 0.22]
// Cénozoïque,[12, 22],[400, 1000],[1, 5],[0.8, 1.5],[0.22, 0.28]
// Éocène,[20, 28],[800, 1500],[1, 5],[1.2, 2.5],[0.20, 0.25]
// Oligocène,[12, 18],[400, 700],[1, 2],[0.8, 1.2],[0.25, 0.30]
// Grande_Coupure,[10, 15],[300, 600],[1, 2],[0.7, 1.0],[0.28, 0.32]
// Quaternaire,[10, 16],[180, 300],[0.4, 0.8],[0.6, 1.0],[0.28, 0.33]
// Holocène,[13, 15],[260, 285],[0.6, 0.8],[0.8, 1.0],[0.29, 0.31]
// Aujourd'hui,[14.5, 15.5],[415, 425],[1.8, 1.9],[1.0, 1.2],[0.29, 0.30]
// ---------------------------------------------------------------------------
// CONV ATM / humidité (rappel code) :
// - Profil vapeur : waterVaporFractionAtZ + PHYS.computeH2OScaleHeight() (R·T²/(L·Γ), Clausius-Clapeyron + adiabatique).
//   À T globale +1 K, la colonne H₂O suit ~7 %/K (Held & Soden 2006) via r₀ (🍰🫧💧) + H_vap(T) — pas de « garde » silencieuse.
// - Hadéen / sortie Snowball : atmosphère steam (τ_H₂O élevé) ; Archéen CH₄ massif : brumes organiques possibles (albédo vs EDS) — overlap dans radiative/calculations.js + hitran.js (Voigt ≥0).
// - Colonne bench « CONV ATM » : état post-convergence (DATA), pas la seule grille CSV ci-dessus.
// ---------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------
// 🔒 SCHÉMA BORNES HYSTÉRÉSIS (v1.4.23) — per-epoch min/max pour la jauge bary scie_hysteresis_bary.js (Step 3)
// Structure dans chaque entrée timeline[] :
//   '🔒': {
//       '⚖️🏭': { min, max, cools }, // CO₂ (kg)
//       '⚖️🐄': { min, max, cools }, // CH₄ (kg)
//       '⚖️💨': { min, max, cools }, // N₂  (kg) — dilution/pressure-broadening
//       '⚖️✈': { min, max, cools }, // sulfates (kg) — CCN/aérosols
//       '⚖️🫁': { min, max, cools }, // O₂  (kg)
//       '⚖️💧': { min, max, cools }, // H₂O hydrosphère (kg)
//   }
//   cools ∈ {'min','max'} : direction de refroidissement. 'min' pour GES (↓CO₂/CH₄ = froid), 'max' pour sulfates (↑CCN = froid par ⚖️✈→ε_CCN→albédo).
//   N₂ : 'min' = froid (moins de pressure-broadening / effet lapse rate) — ambigu, cf. Goldblatt 2009.
// Sources : GRILLE LITTÉRATURE CSV ci-dessus + épochs_bench.html + VALIDATION_CONFIG_GAZ.md.
// Priorité Step 2 : 🦠 Archéen, ⛄ Plein Snowball, 📱 Aujourd'hui. Autres époques : fallback global (Step 3).
// Sémantique bary 0→100 % : 0 % = refroidissement max (pousse vers cools), 100 % = réchauffement max (inverse).
// Pour une quantité q donnée, valeur = cools==='min' ? (bary=0 → min, bary=1 → max) : (bary=0 → max, bary=1 → min).
// L'algo hystérésis utilise ces bornes comme espace de recherche du point de bascule (Step 3 Sonnet).
// ---------------------------------------------------------------------------
//
// Réfs 🌡️🧮 (temp. surface) : Kienert & Feulner Clim. Past 9:1841 (2013) ; Charnay 2017 ; PNAS 2018 ;
// Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014. Valeurs au DÉBUT de chaque époque (parcours temporel à venir).
// Réfs masses gaz (⚖️🏭, ⚖️🐄) : doc/VALIDATION_CONFIG_GAZ.md
const timeline = [
    {// Corps noir
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        // 🌡️🧮 : milieu grille CSV Corps_noir [-19,-17]°C → ~255,2 K
        '🌡️🧮': 255.2,
        '🧲🔬': 0.3,
        '🔋☀️': 2.663e26, // 🔒 Gough (1981) : L☉/(1+0.4×5.0/4.57) = 69.6% — NE PAS MODIFIER
        '🔋🌕': 0, // core_temperature (Pas de noyau en K)
        '🍰🧲🌕': 0.0, // geothermal_diffusion_factor (Facteur de diffusion du noyau vers la surface 0-1)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '📏🌊': 0.0, // Profondeur moyenne océans en km (valeur par défaut, pas d'eau pour cette époque)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        '⚖️🫧': 0, // Masse atmosphère (Pas d'atmosphère)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.0,  // Surface océanique potentielle (0% - pas d'eau)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de relief)
            '🍰🗻🌍': 1.0   // Terres basses (100% - surface rocheuse)
        },
        // 🔒 Corps noir : pas de désert, albedo = 0 (corps noir absorbe tout)
        '🍰🪩🏜️': 0.0,  // Forcer couverture désert à 0 (pas de désert pour corps noir)
        '🪩🍰': {
            '🪩🍰🌍': 0.0  // Override coefficient albedo terres à 0 (corps noir absorbe tout)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 0, // co2_kg (Quantité de CO2 en kg)
        '⚖️🐄': 0, // ch4_kg (Quantité de CH4 en kg)
        '⚖️💧': 0, // h2o_kg (Quantité totale d'eau en kg)
        '⚖️🫁': 0, // o2_kg (Quantité de O2 en kg)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        // Événements interactifs (météorites uniquement Corps noir + Hadéen) ; 💫 = bouton timeline (logo)
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 3.2e17, // water_added_kg (~+10% d'albedo en ⚫ froid avec la formule actuelle)
                '🔺⏳': 100,
            },
            '🎇': {
                '⏩': '🔥' // Transition vers Hadéen
            }
        },
        // 🧫 = biosphère marine (gate CLAW, cf. calculations_albedo.js §Couplage DMS-CCN).
        // ⚫ Corps noir : pas d'océan, pas d'atmosphère, pas de vie → gate = 0 (tautologie).
        '🧫': 0.0,
        // 🌊🏭 = facteur pompe océanique CO₂ (Henry × Urey). 0 = désactivée (pas de mer liquide).
        // Réf : calculations_co2.js v1.2.0. Corps noir : pas d'atmosphère, pas de Henry possible.
        '🌊🏭': 0.0
    },
    {// Hadéen
        '📅': '🔥', // Hadéen — début, juste après impact formant la Lune (ordre 100–1000 ans)
        '▶': 4.5e9,
        '◀': 4.0e9,
        // 🌡️🧮 : milieu grille CSV Hadéen [2000,2500]°C ; T conv légèrement basse → +22 K amorce. 🔋🌕 / 🧲🌕 : scénario magma déjà fort — pas besoin d’augmenter le noyau pour rester dans la plage litt.
        '🌡️🧮': 2545.15,
        '🧲🔬': 1.7,//596,
        '🔋☀️': 2.746e26, // 🔒 Gough (1981) : L☉/(1+0.4×4.5/4.57) = 71.7% — NE PAS MODIFIER
        '🔋🌕': 1.23e21, // core_power_watts (Puissance géothermique totale calculée depuis 🧲🌕 = 2 MW/m² et R = 7008.1 km)
        // Flux géothermique colossal (2 MW/m²) pour maintenir la surface en fusion (~2400K)
        // Phase immédiate post-impact (océan de magma rayonnant) ; le temps peut avancer dans la simu
        '🧲🌕': 2500000, // geothermal_flux (W/m²) - hardcodé pour cette époque
        '📐': 7008.1, // Rayon de la planète en km
        '🍎': 9.8, // Gravité en m/s²
        '📏🌊': 0.0, // Profondeur moyenne océan de magma en km (Hadéen)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 1.0,  // Surface océanique potentielle (100% - océan de magma)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de continents stables)
            '🍰🗻🌍': 0.0   // Terres basses (0% - pas de continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.3e20, // Masse atmosphère (Atmosphère très dense ~100 bar)
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 5.0e17, // co2_kg (~10% de l'atmosphère moderne)
        '⚖️🐄': 5.0e15, // ch4_kg (~1000 ppm)
        '⚖️💧': 2.1e20, // h2o_kg (~15% de 1.4e21 kg)
        '⚖️🫁': 0, // o2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        magma_coverage: 1.0, // Spécifique Hadéen - TODO: trouver logo combo
        volcanoFactor: 10.0, // Spécifique Hadéen - TODO: trouver logo combo
        // Événements interactifs
        // Hadéen dure 500 Ma (▶ 4.5 Ga → ◀ 4.0 Ga). Courbes : T° = 🌡️🧮 + 🔺🌡️💫×tic ; 🧲🌕 = ▶→◀ ; gaz fixes.
        '🕰': {
            '💫': {
                '🔺🌡️💫': -300, // delta T° par tic (K) — refroidissement linéaire
                '🔺🧲🌕💫': {
                    '▶': 2000000, // flux géothermique début (W/m²)
                    '◀': 0.3     // flux géothermique fin (W/m²) — interpolation selon tic
                },
                '🔺📐': -120, // delta Rayon de la planète en km -> '📐': 6371,
                '🔺⏳': 100,       // durée d'un tic en Ma (500 Ma / 10 tics ≈ 50 Ma/tic)
            },
            '☄️': {
                '🔺⚖️💧☄️': 1.0e20, // water_added_kg (~10% de l'eau initiale)
                '🔺📐': -120, // delta Rayon de la planète en km -> '📐': 6371,
                '🔺⏳': 100,       // durée d'un tic en Ma (météorites)
            }
        },
        '🌱': 0.0, // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
        // 🧫 = biosphère marine (gate CLAW, cf. calculations_albedo.js §Couplage DMS-CCN).
        // 🔥 Hadéen : océan de magma à ~2500 K, pas de vie → pas de DMS → gate = 0.
        '🧫': 0.0,
        // 🌊🏭 : pompe CO₂→océan = 0. T_surf ~2500 K → pas d'eau liquide, Henry physiquement impossible.
        '🌊🏭': 0.0
    },
    {// Archéen
        '📅': '🦠', // Archéen — début (4 Ga) = Archéen précoce
        '▶': 4.0e9,
        '◀': 2.5e9,
        //
        // --- FOURCHETTES TOLÉRABLES (bench / litt. synthèse) — DUPLICATA de la ligne CSV « Archéen » dans la GRILLE du haut de ce fichier ---
        // Même objet litt. que doc/epoch_bench.html → BENCH_LIT_BY_EPOCH_ID['🦠'] (clé \u{1F9A0}). Toute modification : les 3 endroits ensemble.
        //   T °C surface   : [10, 60]     — enveloppe large (repère tableau bench), pas une fourchette physique serrée.
        //   CO₂ ppm          : [50000, 150000]
        //   CH₄ ppm          : [1000, 10000]
        //   H₂O vap. mol %   : [0.5, 3.0]
        //   Albédo effectif 🪩 : [0.20, 0.30] (colonne CSV « Albedo », pas une clé TIMELINE séparée)
        //
        // 🌡️🧮 : milieu mathématique de [10,60] °C → ~35 °C au-dessus de 273.15 → ~318 K (~45 °C). Amorce solveur uniquement ; T convergée peut sortir de [10,60].
        '🌡️🧮': 318.15,
        '🧲🔬': 0.01,  // Précision stricte (tol ~0.4 W/m²) pour stabilité anim même époque
        '🔋☀️': 2.836e26, // 🔒 Gough (1981) : L☉/(1+0.4×4.0/4.57) = 74.1% — NE PAS MODIFIER
        '🔋🌕': 1.5e14, // core_power_watts (Puissance géothermique totale ~150 TW)
        // Flux surfacique au début ▶ : requis si 🕰.🔀 inclut '🌕' (compute.js interp startVal = EPOCH[subkey])
        '🧲🌕': 1.5e14 / (4 * Math.PI * Math.pow(6371e3, 2)), // ≈ 0,294 W/m² = 🔋🌕/(4πR²), R=📐 km ; fin 🕰.◀.🌕 → 0,127
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        // ⚾ OBLIQUITÉ ε — plages acceptables (cf. commentaire global '⚾' en bas de fichier) :
        //   [22°, 24.5°] Terre moderne ; [0°, 60°] Terre sans Lune (Laskar 1993) ; [45°, 70°] Williams 1993.
        //   Facteur sin(ε)/sin(23.44°) : 23.44→1.00  35→1.44  45→1.78  54→2.04  60→2.18  70→2.36  90→2.51.
        //   Pourquoi pas ! → tester 54° (seuil Williams basse-lat.), 35° (intermédiaire), 0° (pas de saison).
        '⚾': 45.0, // ε Archéen = 45° (choix conservateur Williams 1993 : 45–70° sans Snowball global). amp saisonnière × 1.78.
        '📏🌊': 4.7, // Profondeur moyenne océans en km (Archéen, moins d'eau)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.85, // Surface océanique potentielle (80% - moins de continents qu'aujourd'hui)
            '🍰🗻🏔': 0.00, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15  // Terres basses (15% - premiers continents)
        },
        '🍰🪩🏜️': 0.0,  // Forcer couverture désert à 0
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Simulation parameters - Quantités en kg. Recalib post-fix solaire 80% (272 W/m² vs ancien 320 W/m²)
        // Faint Young Sun Paradox : soleil ~74% à 4 Ga → CO₂+CH₄ élevés requis pour maintenir ~288 K.
        // ✅ CO₂ : 1.5e18 kg → ~0.19 bar CO₂ partiel (~8.7% molaire, ~87 000 ppm).
        //    Sleep & Zahnle 2001 (JGR) : 0.2–10 bar early Archean ✓
        //    Charnay et al. 2013 (GRL) : 0.1–0.5 bar requis pour eau liquide avec soleil faible ✓
        //    Charnay et al. 2020 (Space Sci. Rev.) : CO₂ 10–2500× PAL consensus ✓
        //    Krissansen-Totton et al. 2018 (Sci. Adv.) : ~0.1 bar à 4 Ga (cycle C-Si) ✓
        //    NB : contraintes paléosols (Rye 1995, Driese 2011) ← late Archean (< 3 Ga) seulement, pas applicables ici.
        // ✅ CH₄ : 3.0e16 kg → ~4 780 ppm molaire (~0.19% atm).
        //    Haqq-Misra et al. 2008 (Astrobiology) : jusqu'à 10 000 ppm, brume si CH₄/CO₂ > 0.1 ✓
        //    Pavlov et al. 2000 : 100–1 000 ppm ; Charnay 2020 : 100–17 000 ppm ✓
        // ✅ Ratio CH₄/CO₂ = 3.0e16 / 1.5e18 = 0.02 — sous le seuil de brume organique (0.1, Haqq-Misra 2008) ✓
        // ⚖️ = masses totales (kg). Grille CSV « Archéen » : CO₂ ppm [50k,150k] ; CH₄ [1k,10k] ; H₂O vapeur atm [0.5,3.0]% mol.
        // ppm calculés par epoch_bench.html (ligne 544) : ppm_molaire = mass_frac × (M_air / M_gaz) × 1e6.
        // Repère rapide pour ajuster les masses (N₂ ≈ 9.918e18 dominant) : CO₂ 150k mol ppm ⇒ ≈ 2.75e18 kg ; CO₂ 50k mol ppm ⇒ ≈ 0.80e18 kg ; CH₄ 10k mol ppm ⇒ ≈ 6.7e16 kg ; CH₄ 1k mol ppm ⇒ ≈ 6.5e15 kg.
        //
        // ─── CAP MAX ACCEPTABLE (v1.4.22) ───────────────────────────────────────
        // CO₂ précédemment à 10.62e18 kg → ~400–900k mol ppm (très au-dessus de [50k,150k]).
        // Ramené au MAX acceptable 150k mol ppm ≈ 2.75e18 kg, conformément à la grille CSV Archéen.
        // Pour regagner de la T° perdue : chercher ailleurs (CH₄ physique Haqq-Misra 2008 ; obliquité ; albédo couches chaudes).
        '⚖️🏭': 2.75e18, // co2_kg — CAP MAX bench CO₂ [50000, 150000] mol ppm ; cible 150k ppm. Plage : 0.80e18 (50k) → 2.75e18 (150k).
        '⚖️🐄': 3.25e16, // ch4_kg — bench CH₄ [1000, 10000] mol ppm ; valeur ≈ 4.8k mol ppm (milieu plage). Plage : 6.5e15 (1k) → 6.7e16 (10k).
        '⚖️💧': 1.8e21, // h2o_kg inventaire hydrosphère (océan…) — PAS la colonne CSV « H₂O vap. mol % » (celle-ci = vapeur atmosphérique dynamique [0.5,3.0]% gérée par calculations_h2o). ~129% PAL océan (earthTotalWaterMassKg=1.4e21). Plage raisonnable [0.8e21, 2.5e21].
        '⚖️🫁': 0, // o2_kg — prébiotique (Archéen pré-GOE). Pas de plage ppm bench. Plage acceptable [0, 1e16] (traces biosphère anoxygénique pré-2.4 Ga).
        '⚖️💨': 9.918e18, // n2_kg — masse atmos. N₂ ~1–2× PAL (Marty 2013). PAL N₂ ≈ 4e18 kg → valeur ≈ 2.5× PAL (haut fourchette). Plage acceptable [4e18, 10e18] (1×PAL → 2.5×PAL).
        '⚖️✈': 0, // proxy_sulfates — pré-industriel, pas d'émissions anthropiques. Plage acceptable [0, 1e15] (volcanisme explosif ponctuel).
        // 🔒 Bornes hystérésis Archéen — cf. schéma commentaire global "🔒 SCHÉMA BORNES HYSTÉRÉSIS" + CSV « Archéen » [50k,150k]ppm CO₂, [1k,10k]ppm CH₄.
        //    Refs : Sleep & Zahnle 2001 (CO₂ 0.2–10 bar), Haqq-Misra 2008 (CH₄ ≤10k ppm ; haze si CH₄/CO₂ > 0.1), Som 2012/2016 (N₂ paléo 0.7–2.2 atm), Marty 2013 (N₂ Archéen ≈1–2× PAL).
        '🔒': {
            '⚖️🏭': { min: 0.80e18, max: 2.75e18, cools: 'min' }, // CO₂ : CSV [50k,150k] mol ppm
            '⚖️🐄': { min: 6.5e15,  max: 6.7e16,  cools: 'min' }, // CH₄ : CSV [1k,10k] mol ppm
            '⚖️💨': { min: 4.0e18,  max: 1.0e19,  cools: 'min' }, // N₂  : 1× → 2.5× PAL (Som 2012)
            '⚖️✈': { min: 0,       max: 1.0e15,  cools: 'max' }, // sulfates : volcanisme explosif (refroidit)
            '⚖️🫁': { min: 0,       max: 1.0e16,  cools: 'min' }, // O₂ : pré-GOE (traces seulement)
            '⚖️💧': { min: 0.8e21,  max: 2.5e21,  cools: 'min' }, // H₂O hydrosphère : ~57% → ~179% PAL
        },
        '⚖️🫧': 1.2700e19, // N₂ + CO₂ + CH₄ = 9.918e18 + 2.75e18 + 3.25e16. Recalculer si une masse change.
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '💫': {
                '🔺🌡️💫': 0,     // pas de dérive T° par tic (équilibre ~288 K)
                '🔺⏳': 500,       // durée d'un tic en Ma (bouton timeline)
            },
            // Barycentre (📿💫+📿☄️)/maxTics → interpolation des params entre ▶ et ◀
            // 🔒 ☀️ n'est PAS dans 🔀 : luminosité calculée par Gough (1981) depuis la date, pas interpolée linéairement
            '🔀': ['⚖️', '🌕'],
            '◀': {
                '⚖️': { '⚖️💧': 1.3e21, '⚖️🫧': 5.19e18, '⚖️🏭': 4.7e16, '⚖️🐄': 2.85e14, '⚖️🫁': 0, '⚖️✈': 0, '⚖️💨': 5.138e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        },
        '🌱': 0.0, // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
        // 🧫 : 🦠 Archéen — océans anoxiques dominés par cyanobactéries procaryotes
        // (pas d'eucaryotes marins, DMSP producteurs quasi-absents). Knoll 2003, Falkowski 2004.
        // Tapis microbiens côtiers → flux DMS minimal (~5% moderne).
        '🧫': 0.05,
        // 🌊🏭 : pompe Urey très lente. Peu de continents émergés → altération silicatée faible
        // (Lee et al. 2018, Nature 553:188 — arc-continent collision Urey régulator). CO₂ atm très élevé
        // (~150 000 ppm bench) tamponné par carbonates sédimentaires Archéens (Sleep & Zahnle 2001).
        '🌊🏭': 0.05
    },
    {// Protérozoïque
        '📅': '🪸', // Protérozoïque (multicellularité, eucaryotes, GOE)
        '▶': 2.5e9,
        '◀': 750e6,
        // 🌡️🧮 : Protérozoïque — rehausser amorce (T conv basse vs [5,20]°C CSV)
        '🌡️🧮': 290.65,
        '🧲🔬': 0.01,
        '🔋☀️': 3.140e26, // 🔒 Gough (1981) : L☉/(1+0.4×2.5/4.57) = 82.0% — NE PAS MODIFIER
        '🔋🌕': 1.0e14, // core_power_watts (Puissance géothermique totale ~100 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.6, // Profondeur moyenne océans en km (Protérozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.75, // Surface océanique potentielle (75% - continents en formation)
            '🍰🗻🏔': 0.08, // Hautes terres (8% - relief modéré)
            '🍰🗻🌍': 0.17  // Terres basses (17% - continents émergents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (~1 bar). Lit. 2.7 Ga: pression possiblement <0.5 bar.
        // Lit. Proterozoic: CO2 10–200× actuel; paléosols ~2.2 Ga: 8000–9000 ppm. CH4 100–300 ppm.
        '⚖️🏭': 5.0e16,  // co2_kg — léger + vs 4.7e16 (bench)
        '⚖️🐄': 3.0e14,  // ch4_kg — léger + vs 2.85e14 (bench)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🫁': 1.5e16,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '🌋': { '🔺🍰⚽': 0.02 },
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 590 },
        },
        '🌱': 0.0, // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
        // 🧫 : 🪸 Protérozoïque — post-GOE, premiers eucaryotes marins (acritarches ~1.8 Ga),
        // algues rouges ~1.2 Ga. Diversification lente, encore dominés par procaryotes.
        // Flux DMS ~10% moderne (avant radiation des phytoplanctons modernes).
        '🧫': 0.1,
        // 🌊🏭 : pompe Urey lente pré-Rodinia. Supercontinent Rodinia assemblé (~1.1 Ga → ~800 Ma)
        // limite la surface continentale exposée aux intempéries tropicales (Goddéris et al. 2017 Earth-Sci Rev).
        // Pas encore de plantes vasculaires → weathering par acides organiques très limité (Lenton & Watson 2011).
        '🌊🏭': 0.15
    },
    // hysteresis 1a = Pré–Boule de neige / entrée Sturtienne (750–720 Ma) : CO₂ élevé (⚖️🏭) ; graine T pour convergence AVANT le scan hystérésis.
    // L’instant hystérésis = quand on baisse un peu le CO₂ et que T s’effondre — c’est l’algo (scie_) qui le cherche.
    // Ici 🌡️🧮 = amorce solveur sur branche encore tiède (≈290 K), pas le seuil ni la T finale après chute.
    {//hysteresis 1a (entrée Sturtienne — bascule albédo↓)
        '📅': 'hysteresis 1a', // id stable (renommé v1.4.0 ; logo affichage ☃)
        hidden: true, // interne (non cliquable / non affiché dans la frise)
        '▶': 750e6,
        '◀': 720e6,
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // même ordre que ⛄ (on garde la luminosité du Néoprotérozoïque)
        '🔋🌕': 8.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17 },
        '⚖️🫧': 5.15e18,
        // CO₂ pré-snowball branche chaude. 1.0e16 kg = 1280 ppm (conv. via ⚖️💨=5.125e18 kg, M_air/M_CO2=0.659).
        // Fourchette lit. pré-Sturtienne warm branch : 1000-3000 ppm (Hoffman & Schrag 2002 ; Bao et al. 2008 ; Hoffman 2017).
        // NB : le seuil de bifurcation snowball est bien plus bas (100-300 ppm GCM — Voigt 2010, Hörner 2022) ;
        // c'est la recherche hystérésis (scie_hysteresis_search.js) qui descend jusque-là, pas ce baseline.
        '⚖️🏭': 2.0e15,
        // CH₄ : 2.0e13 kg = 7 ppm. Post-GOE (après 2.4 Ga) l'atmosphère oxygénée détruit le CH₄ rapidement.
        // Fourchette lit. Néoprotérozoïque : 1-30 ppm (Kasting 2005 ; Olson 2016 ; Daines & Lenton 2016).
        // Corrigé v1.4.29 : était 1.0e14 kg (35 ppm, trop haut, borne sup. extrême).
        '⚖️🐄': 2.0e13,
        // H₂O : océan Protérozoïque ≈ 1.2-1.4e21 kg (Pope et al. 2012). Inchangé.
        '⚖️💧': 1.2e21,
        // O₂ : 5.0e15 kg = 0.09 % atm ≈ 0.4 % PAL. Cœur fourchette Sturtien : 0.1-1 % PAL
        // (Lyons et al. 2014 ; Planavsky et al. 2014 ; Sperling 2015). Pré-NOE (Neoproterozoic Oxygenation Event).
        // Corrigé v1.4.29 : était 1.5e16 kg (1.3 % PAL, borne sup. extrême).
        '⚖️🫁': 5.0e15,
        // ⚖️✈ : baseline sulfate volcanique explicite, identique au démarrage du scan hystérésis.
        // Rend le run direct contractuel sans fallback côté calcul.
        '⚖️✈': 1.0e12,
        '🕰': { '💫': { '🔺🌡️💫': 0, '🔺⏳': 30 } },
        '🌱': 0.0,
        // 🧫 : ☃ Entrée Sturtienne (750 Ma) — pré-glaciation, plancton marin dilué,
        // faibles émissions DMS (même ordre que ⛄). ~5% moderne.
        '🧫': 0.05,
        // 🌊🏭 : pompe Urey ACCÉLÉRÉE. Rodinia break-up (800-720 Ma) expose de vastes surfaces
        // continentales tropicales aux intempéries (Godderis et al. 2003, Donnadieu et al. 2004 Nature).
        // Franklin LIP (717 Ma) : basaltes frais très altérables (Macdonald 2010 Science 327:1241).
        // Pierrehumbert 2004 "deglaciation problem" : drawdown CO₂ × 3-5 vs moderne.
        '🌊🏭': 0.5
    },
    // ⛄ = Plein Snowball (720–690 Ma) : glaciation globale Néoprotérozoïque (Sturtien ~717 Ma)
    // Réfs : Hoffman et al. 1998 (Science), Pierrehumbert 2011, Hoffman & Schrag 2002
    {// Plein Snowball
        '📅': '⛄', // Plein Snowball (720–690 Ma) — Snowball Earth, plateau froid
        // Pas de forçage ⛄ : la physique (T < T_freeze → gel océan) produit le snowball
        '▶': 720e6,
        '◀': 690e6,
        // 🌡️🧮 : Plein Snowball — branche froide issue du seuil hysteresis 1a (−62.78 °C).
        '🌡️🧮': 210.37,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.75/4.57) = 93.8% — NE PAS MODIFIER
        '🔋🌕': 8.0e13, // core_power_watts (~80 TW, Néoprotérozoïque)
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6, // Profondeur océans (Néoprotérozoïque)
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.73,
            '🍰🗻🏔': 0.15,
            '🍰🗻🌍': 0.12
        },
        '⚖️🫧': 5.15e18,
        // CO₂ branche froide trouvée par hysteresis 1a : seuil ≈239 ppm (1.930e15 kg).
        // Pendant ⛄, l'accumulation volcanique remonte ensuite vers le seuil de sortie (hysteresis 1b).
        '⚖️🏭': 1.930e+15,
        '⚖️🐄': 1.0e14,
        '⚖️💧': 1.2e21,
        '⚖️🫁': 1.5e16,  // o2_kg (faible, post-GOE mais pré-explosion cambrienne)
        // ⚖️✈ = stock sulfate atmosphérique (régime stationnaire source/puits, τ_wash ≈ 1 semaine).
        // Sources actives pendant ⛄ : volcanisme d'arc continu + dégazage rifts Rodinia (750→600 Ma :
        //   Franklin LIP ~717 Ma, Irkutsk, Gunbarrel — Macdonald et al. 2017 Nat. Geosci. 10:358).
        // Source ÉTEINTE : pathway DMS marin (ocean gelé → plancton marginal, gaté par EPOCH['🧫']=0.05).
        // Baseline ~1e12 kg cohérent avec 🛖 Holocène (volcanique sans DMS). Pulses LIP peuvent ×10-100
        // ponctuellement mais on prend l'équilibre moyen pour la navigation normale (hors scan hyst).
        '⚖️✈': 1.018e12,
        // 🔒 Bornes hystérésis Plein Snowball — CSV « Plein_Snowball » [300,1500]ppm CO₂, [0.1,10]ppm CH₄, [0.01,0.5]% H₂O vap.
        //    Refs : Hoffman et al. 1998 (CO₂ entrée ~100–1000 ppm, sortie ~100k ppm), Pierrehumbert 2011 (CH₄ ppm résiduel), Hoffman & Schrag 2002.
        //    Conversion mass/ppm @ M_atm=5.15e18 : 1 ppm CO₂ ≈ 7.83e12 kg ; 1 ppm CH₄ ≈ 2.84e12 kg.
        '🔒': {
            '⚖️🏭': { min: 2.35e15, max: 1.17e16, cools: 'min' }, // CO₂ : CSV [300,1500] ppm
            '⚖️🐄': { min: 2.84e11, max: 2.84e13, cools: 'min' }, // CH₄ : CSV [0.1,10] ppm
            '⚖️💨': { min: 3.0e18,  max: 5.0e18,  cools: 'min' }, // N₂  : post-GOE, proche modern
            '⚖️✈': { min: 0,       max: 5.0e14,  cools: 'max' }, // sulfates : volcanisme neoprotérozoïque
            '⚖️🫁': { min: 5.0e17,  max: 2.0e18,  cools: 'min' }, // O₂ : post-GOE ~5–20% modern
            '⚖️💧': { min: 1.0e21,  max: 1.4e21,  cools: 'min' }, // H₂O hydrosphère (eau piégée dans glace)
        },
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 30 },
        },
        // 🌱 = facteur biosphère terrestre (fraction max des terres pouvant porter de la végétation).
        // ⛄ Néoprotérozoïque (−735 Ma) : tapis microbiens côtiers + algues marines uniquement,
        // pas de plantes vasculaires (apparition Ordovicien ~−470 Ma). Valeur ε=0.02 pour
        // représenter une fine croûte biologique terrestre (cyanobactéries/lichens primitifs).
        '🌱': 0.02,
        // 🧫 = facteur biosphère MARINE — symétrique de 🌱 pour le gate CLAW (DMS-CCN).
        // ⛄ Plein Snowball (−735→−690 Ma) : océan global gelé sous banquise kilométrique,
        // photosynthèse marine quasi-éteinte (pas de lumière sous glace). Seules des oasis de
        // lumière (fractures, fusions côtières) préservent un plancton résiduel. Knoll 2003.
        // Le DMS marin s'effondre, découplant la boucle CLAW — crucial pour la sortie du
        // snowball (pas de CCN biogénique → moins de nuages → moins d'albédo → réchauffement).
        // Valeur ε=0.05 : DMS quasi-éteint, seul reste le sulfate volcanique direct.
        '🧫': 0.05,
        // 🌊🏭 : pompe Urey COUPÉE. Banquise kilométrique isole atmosphère de l'océan
        // (Hoffman & Schrag 2002, Pierrehumbert 2004/2005) : Henry physiquement bloqué.
        // Altération silicatée continentale ~0 (terres enneigées). Seul le CO₂ volcanique s'accumule
        // → deglaciation problem : CO₂ doit atteindre ~100 000 ppm sur ~10 Ma (Higgins & Schrag 2003).
        '🌊🏭': 0.0
    },
    // hysteresis 1b = Sortie Marinoen (690–600 Ma) : déglaciation brutale, hyper-greenhouse, pluies acides.
    // Branche chaude post-Snowball, le scan hystérésis cherche le seuil de sortie (CO₂↑ → saut T).
    {//hysteresis 1b (sortie Marinoen — hyst ↑)
        '📅': 'hysteresis 1b', // id stable (logo affichage ⛈)
        hidden: true,
        '▶': 690e6,
        '◀': 600e6,
        '🌡️🧮': 312.15, // Sortie Marinoen [20,50]°C — amorce branche chaude + légère hausse (bench)
        '🧲🔬': 0.01,
        '🔋☀️': 3.620e26, // Gough @ 0.69 Ga
        '🔋🌕': 7.5e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.10, '🍰🗻🌍': 0.15 },
        '⚖️🫧': 5.15e18,
        // Hyper-greenhouse post-Marinoen : CO₂ très élevé cause de la déglaciation
        '⚖️🏭': 2.75e16, // co2_kg — léger + (bench Sortie Marinoen)
        '⚖️🐄': 4.5e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e16,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 90 },
        },
        '🌱': 0.0,
        // 🧫 : ⛈ Sortie Marinoen (690→600 Ma) — dégel post-snowball, hyper-greenhouse,
        // recolonisation marine progressive. Retour modéré du plancton. ~10% moderne.
        '🧫': 0.1,
        // 🌊🏭 : pompe Urey CATASTROPHIQUEMENT amplifiée (cap carbonates de couverture Marinoen).
        // Hyper-greenhouse ~80 000 ppm CO₂ + chaleur tropicale extrême + altération silicates régolithe
        // glaciaire (roches broyées pendant snowball) → drawdown record ~10 Ma (Higgins & Schrag 2003,
        // Hoffman et al. 2017 Sci Adv 3:e1600983). CO₂ chute de 80 k à ~1 k ppm en quelques Ma.
        '🌊🏭': 2.0
    },
    // Paléozoïque scindé (v1.4.0) : 🪼 marin 600→420 + 🍄 terrestre 420→280 + 💀 P/T 280→250.
    // Ordre chronologique : … Protérozoïque → ☃/⛄/⛈ Snowball → 🪼 → 🍄 → 💀 → Mésozoïque …
    {// Paléozoïque marin 🪼
        '📅': '🪼', // Paléozoïque marin (600–420 Ma) — explosion cambrienne, Hirnantienne
        '▶': 600e6,
        '◀': 420e6,
        // 🌡️🧮 : Paléozoïque marin — T conv un peu haute vs [15,25]°C → amorce plus froide
        '🌡️🧮': 288.5,
        '🧲🔬': 0.01,
        '🔋☀️': 3.638e26, // Gough @ 0.6 Ga
        '🔋🌕': 6.5e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.78, '🍰🗻🏔': 0.06, '🍰🗻🌍': 0.16 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.38e16, // co2_kg — léger − (bench 🪼)
        '⚖️🐄': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e17,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 180 },
        },
        '🌱': 0.0, // Avant -420 Ma : végétation terrestre absente/marginale
        // 🧫 : 🪼 Paléozoïque marin (600→420 Ma) — explosion cambrienne, radiation des
        // phytoplanctons modernes (acritarches puis dinoflagellés). Boucle CLAW progressivement
        // active. Falkowski 2004 Science 305:354. ~50% moderne.
        '🧫': 0.5,
        // 🌊🏭 : pompe Urey standard Phanérozoïque — Walker, Hays & Kasting 1981 JGR 86:9776
        // (feedback silicate weathering → CO₂ atm stable). Pas encore de plantes vasculaires.
        '🌊🏭': 1.0
    },
    {// Paléozoïque terrestre 🍄
        '📅': '🍄', // Paléozoïque terrestre (420–280 Ma) — Prototaxites, forêts Dévonien/Carbonifère, Karoo
        '▶': 420e6,
        '◀': 280e6,
        // 🌡️🧮 : Paléozoïque terrestre — T conv un peu haute vs [15,25]°C → amorce plus froide
        '🌡️🧮': 289.5,
        '🧲🔬': 0.01,
        '🔋☀️': 3.686e26, // Gough @ 0.42 Ga
        '🔋🌕': 6.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.07, '🍰🗻🌍': 0.18 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 0.74e16, // co2_kg — léger − (bench 🍄)
        '⚖️🐄': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 2.0e17,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 140 },
        },
        '🌱': 0.31, // Après -400 Ma : forêt potentielle ~31 % terres
        // 🧫 : 🍄 Paléozoïque terrestre (420→280 Ma) — Dévonien/Carbonifère,
        // diversification marine avancée, coccolithophoridés pas encore installés.
        // Flux DMS élevé mais pas encore saturé. ~70% moderne.
        '🧫': 0.7,
        // 🌊🏭 : pompe Urey AMPLIFIÉE. Apparition forêts Dévonien/Carbonifère → racines profondes +
        // acides humiques accélèrent weathering silicaté (Berner & Kothavala 2001 GEOCARB III,
        // Am J Sci 301:182). Algeo & Scheckler 1998 GSA Today 8:1 : "Devonian land plant crisis".
        // Enfouissement carbone organique (Karoo, Gondwana) → chute CO₂ → glaciation fin-Carbonifère.
        '🌊🏭': 1.3
    },
    {// Limite P/T 💀 (extinction massive, pas hystérésis)
        '📅': '💀', // Limite P/T (280–250 Ma) — Trapps sibériens, anoxie, hyperthermie
        '▶': 280e6,
        '◀': 250e6,
        // 🌡️🧮 : pic d'extinction ~301 K (28°C), anoxie + trapps sibériens
        '🌡️🧮': 298,
        '🧲🔬': 0.01,
        '🔋☀️': 3.720e26, // Gough @ 0.28 Ga
        '🔋🌕': 6.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.72, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.5e16, // co2_kg (~2900 ppm, pic PT)
        '⚖️🐄': 8e13,   // CH4 élevé (anoxie, clathrates)
        '⚖️💧': 1.35e21,
        '⚖️🫁': 1.5e17, // O2 en chute (anoxie)
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 30 },
        },
        '🌱': 0.25,
        // 🧫 : 💀 Limite P/T (280→250 Ma) — extinction massive marine (~96% espèces),
        // anoxie océanique (Canfield state), effondrement du plancton. ~30% moderne
        // (suppression partielle de CLAW pendant la crise).
        '🧫': 0.3,
        // 🌊🏭 : pompe Urey ATTÉNUÉE. Trapps sibériens (~252 Ma, 4e6 km³ basaltes) injectent
        // ~1e19 kg CO₂ + SO₂ en ~1 Ma → saturation acide océanique, effondrement carbonates
        // (Payne & Clapham 2012 Annu Rev Earth Planet Sci 40:89). Anoxie + forêts éradiquées
        // → weathering biotique chute (Algeo 2011). Hyperthermie entretenue ~5 Ma.
        '🌊🏭': 0.7
    },
    {// Mésozoïque 🦕
        '📅': '🦕', // Mésozoïque (252–66 Ma) — texture fonds/00200Ma.png (ancien 250Ma), événement 50 Ma
        // 🦕 Mésozoïque : serre chaude, pas de calottes polaires
        '⛄': 0,
        '▶': 250e6,
        '◀': 66e6,
        // 🌡️🧮 : ~295–305 K (lit. Mésozoïque) — 25 °C
        '🌡️🧮': 298,
        '🧲🔬': 0.1,
        '🔋☀️': 3.746e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.25/4.57) = 97.9% — NE PAS MODIFIER
        '🔋🌕': 6.0e13, // core_power_watts (Puissance géothermique totale ~60 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Mésozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.2875e16, // co2_kg (~2500 ppm)
        '⚖️🐄': 4.12e13,
        '⚖️💧': 1.33e21,
        '⚖️🫁': 0,
        '🕰': {
            '💫': {
                '🔺🌡️💫': -2,
                '🔺⏳': 100,       // durée d'un tic en Ma (bouton timeline)
                '🔺🧲🌕💫': { '▶': 0, '◀': 0 },
            }, // Événement 50 Ma
            '🎇': { '⏩': '🦤' } // Big impact (K-Pg) → Cénozoïque
        },
        '🌱': 0.31,
        // 🧫 : 🦕 Mésozoïque (250→66 Ma) — radiation coccolithophoridés (Emiliania précurseurs),
        // dinoflagellés, diatomées émergentes (fin Crétacé). Boucle CLAW pleinement installée.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey standard — serre chaude stable, feedback silicate actif mais
        // géographie (Gondwana/Laurasia → Pangée) maintient CO₂ atm élevé ~2500 ppm (Berner 2001).
        '🌊🏭': 1.0
    },
    {// Cénozoïque 🦤
        '📅': '🦤', // Cénozoïque — Paléocène / début Éocène (66–50 Ma) ; limite K-Pg (~66 Ma), CO₂ modéré ~650 ppm
        '▶': 66e6,
        '◀': 50e6,
        '⛄': 0,
        '🌡️🧮': 290,
        '🧲🔬': 0.1,
        '🔋☀️': 3.806e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.066/4.57) — NE PAS MODIFIER
        '🔋🌕': 5.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 5.0e15, // co2_kg (~650 ppm)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 16 },
        },
        '🌱': 0.31,
        // 🧫 : 🦤 Cénozoïque (66→50 Ma) — phytoplancton moderne installé, CLAW active.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey standard post-K-Pg. Refroidissement progressif → altération accrue
        // aux moyennes latitudes. Pas encore de collision Inde/Asie (début ~50 Ma).
        '🌊🏭': 1.0
    },
    {// Éocène 🐊
        '📅': '🐊', // Éocène (50–35 Ma), pic thermique / CO₂ élevé (ordre PETM) ; puis décroissance (altération silicates, Himalaya)
        '▶': 50e6,
        '◀': 35e6,
        '⛄': 0,
        '🌡️🧮': 299.5,
        '🧲🔬': 0.1,
        '🔋☀️': 3.811e26, // 🔒 Gough @ 0.050 Ga
        '🔋🌕': 5.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 9.4e15, // co2_kg — léger + (bench 🐊)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 15 },
        },
        '🌱': 0.31,
        // 🧫 : 🐊 Éocène (50→35 Ma) — PETM, CLAW moderne.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey AMPLIFIÉE à partir de l'Éocène moyen. Collision Inde/Asie (~50 Ma)
        // + orogenèse himalayenne exposent basaltes frais du Deccan + silicates tibétains →
        // weathering accru (Raymo & Ruddiman 1992 Nature 359:117 "uplift-weathering hypothesis").
        // Controversé : GEOCARBSULF (Berner 2006) minimise l'effet ; Misra & Froelich 2012 confirme
        // via δ⁷Li marin. Compromis : légère amplification.
        '🌊🏭': 1.1
    },
    {// hysteresis 2 (Eocène–Oligocène ~35–33 Ma — bascule calotte Antarctique, Oi-1)
        '📅': 'hysteresis 2', // id stable (logo affichage 🐧 ; ex ⛰ prélude glaciaire)
        hidden: true, // même rendu frise que hysteresis 1 (epoch-text, pas epoch-btn)
        '▶': 35e6,
        '◀': 33e6,
        '⛄': 0.02,
        '🌡️🧮': 289,
        '🧲🔬': 0.08,
        '🔋☀️': 3.816e26, // 🔒 Gough @ 0.035 Ga
        '🔋🌕': 4.85e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 5.15e15, // co2_kg (~1000 ppm, avant chute Oi-1)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 2 },
        },
        '🌱': 0.31,
        // 🧫 : 🐧 hysteresis 2 (Eocène–Oligocène, Oi-1 ~34 Ma) — bascule calotte Antarctique,
        // phytoplancton pleinement installé.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey amplifiée (Himalaya toujours actif + refroidissement = plus d'altération).
        // Zachos et al. 2001 Science 292:686 : chute CO₂ ~1000 → 600 ppm sur 35-33 Ma.
        '🌊🏭': 1.1
    },
    // Grande Coupure → Miocène/Pliocène (33–2 Ma) : calotte Antarctique stable, puis glace Nord vers 3 Ma
    {// 🏔 Grande Coupure / Miocène–Pliocène
        '📅': '🏔',
        // 🏔 Grande Coupure : calotte Antarctique (~8.5% surface) — première glaciation polaire moderne
        '⛄': 0.085,
        '▶': 33e6,
        '◀': 2e6,
        '🌡️🧮': 288.15, // milieu grille Oligocène/Grande_Coupure [12,18]°C (🏔 ≈ refroidissement Cénozoïque)
        '🧲🔬': 0.05,
        '🔋☀️': 3.817e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.033/4.57) = 99.7% — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 4.0e15,
        '⚖️🐄': 3.6e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.08e18,
        '⚖️✈': 1e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 100 },
        },
        '🌱': 0.31,
        // 🧫 : 🏔 Grande Coupure / Miocène–Pliocène — CLAW moderne active.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey amplifiée (Miocene Climate Optimum puis refroidissement).
        '🌊🏭': 1.1
    },
    // Quaternaire (2 Ma → 10 ka) : cycles glaciaires/interglaciaires, LGM (~20 ka), Milankovitch
    {// Quaternaire 🦣
        '📅': '🦣',
        '⛄': 0.11,
        '▶': 2e6,
        '◀': 10e3,
        '🌡️🧮': 287,
        '🧲🔬': 0.04,
        '🔋☀️': 3.827e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.002/4.57) — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.191e15,
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '⚖️✈': 1.2e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.25 },
        },
        '🌱': 0.31,
        // 🧫 : 🦣 Quaternaire — CLAW moderne, cycles Milankovitch.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne. Cycles glaciaires cf. Sigman & Boyle 2000 Nature 407:859
        // (CO₂ 180 ↔ 280 ppm interglaciaire/glaciaire via solubilité océanique accrue à T_cold).
        '🌊🏭': 1.0
    },
    // Holocène (10 ka → 1800) : interglaciaire, agriculture, stabilité climatique pré-industrielle
    {// Holocène 🛖
        '📅': '🛖',
        '⛄': 0.105,
        '▶': 10e3,
        '◀': 1800,
        // 🌡️🧮 : Holocène — T conv basse vs [13,15]°C → amorce un peu plus chaude
        '🌡️🧮': 288.65,
        '🧲🔬': 0.03,
        '🔋☀️': 3.828e26, // 🔒 Gough (1981) : L☉/(1+0.4×0/4.57) ≈ 100% — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.191e15, // ~280 ppm CO2 pré-industriel (Marcott 2013)
        '⚖️🐄': 2.28e12,  // ~800 ppb CH4 pré-industriel
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,
        '⚖️✈': 1.0e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.002 }, // 2 ka/tic ≈ 5 tics pour couvrir 10 ka → 1800
        },
        '🌱': 0.31,
        // 🧫 : 🛖 Holocène — CLAW moderne, pré-industriel.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne pré-industrielle (équilibre stationnaire 280 ppm).
        '🌊🏭': 1.0
    },
    // Industriel (1800 → 2000) : révolution industrielle, CO₂ 280 → 370 ppm, début signal anthropique
    {// Industriel 🚂
        '📅': '🚂',
        '▶': 1800,
        '◀': 2000,
        '🌡️🧮': 287,
        '🧲🔬': 0.01,
        '🔋☀️': 3.828e26,
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.191e15, // ~280 ppm 1800 (IPCC2021)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '⚖️✈': 1.5e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.0001 }, // 100 ans/tic ≈ 2 tics pour 1800 → 2000
        },
        '🌱': 0.31,
        // 🧫 : 🚂 Industriel — CLAW moderne + début SO₂ anthropique (le vrai boost sulfate arrive via anthro_factor).
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey moderne. Absorption océan ~25-30 % anthro (Le Quéré et al. 2018 ESSD 10:2141).
        '🌊🏭': 1.0
    },
    {// Aujourd'hui 📱
        '📅': '📱', // Aujourd'hui (▶=2000 : clic 📱 = position 2000 ; fin de frise = 2100 en organigramme)
        '▶': 2000,
        '◀': 2100, // ticTime forward : 2000+25a/tic → 2025 après 1 tic, 2100 terminus
        // 🌡️🧮 : ~288.8 K (record chaud 2025) — 15.6 °C
        '🌡️🧮': 288.3, // 288.3 K (~15.1°C) — an 2000 [OBS] NASA GISS
        '🧲🔬': 0.010,
        '🔋☀️': 3.828e26, // 🔒 Gough (1981) : L☉/(1+0.4×0/4.57) = 100% (IAU 2015) — NE PAS MODIFIER
        '🔋🌕': 4.6e13, // core_power_watts (Puissance géothermique totale ~46 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Terre moderne)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: 🍰🪩🏜️, 🍰🪩🌳, 🍰🪩🌍 sont maintenant calculés dynamiquement dans calculateAlbedo()
        '⚖️🫧': 5.15e18, // Masse atmosphère (air sec ~1 bar, comme Industriel)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 2.887e15, // ~369 ppm CO2 an 2000 [OBS] NOAA
        '⚖️🐄': 4.99e12, // ~1750 ppb CH4 an 2000 [OBS] NOAA
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.18e18, // O2 ~23% masse air sec
        '⚖️✈': 8.0e13, // sulfate_kg (proxy CCN moderne)
        '⚖️💨': 3.97e18, // n2_kg (~78% de l'atmosphère moderne, calculé comme reste pour atteindre 5.15e18)
        // 🔒 Bornes hystérésis Aujourd'hui — pré-industriel → RCP8.5 extreme.
        //    Refs : NOAA/GISS (CO₂ 2000 ≈369 ppm, 280 ppm pré-industriel), IPCC AR6 WG1 SSP5-8.5 (~1135 ppm @2100), CH₄ pré-ind ≈700 ppb → ~3500 ppb RCP8.5, Crutzen 2006 (SRM sulfates stratosphériques 1–5 Tg S/an → ~5e14 kg équivalent).
        //    Conversion mass/ppm @ M_atm=5.15e18 : 1 ppm CO₂ ≈ 7.83e12 kg ; 1 ppm CH₄ ≈ 2.84e12 kg.
        '🔒': {
            '⚖️🏭': { min: 2.19e15, max: 1.0e16, cools: 'min' }, // CO₂ : 280 ppm (pré-ind) → ~1280 ppm (RCP8.5+)
            '⚖️🐄': { min: 2.0e12,  max: 2.0e13, cools: 'min' }, // CH₄ : 700 ppb → 7 ppm
            '⚖️💨': { min: 3.90e18, max: 4.05e18, cools: 'min' }, // N₂ : très stable (pas de réservoir rapide)
            '⚖️✈': { min: 0,       max: 5.0e14, cools: 'max' }, // sulfates : 0 (nettoyage total) → SRM Crutzen
            '⚖️🫁': { min: 1.17e18, max: 1.19e18, cools: 'min' }, // O₂ : quasi-constant échelle humaine
            '⚖️💧': { min: 1.38e21, max: 1.42e21, cools: 'min' }, // H₂O hydrosphère : très stable
        },
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        // Échelle récente : 🔺⏳ = 0.000025 Ma → 25 ans par pas
        // 🕰 indexé par année : clic ⛽/🛢 injecte 🔺⚖️🏭 (masse CO₂) ; pas encore de cycle complet (airborne / océan → TODO)
        // Convention affichage « Gt » UI (events.js) : même chiffre que N dans N·1e9 — ex. tranche 2000 → 850e9 = +850Gt CO2
        '🕰': {
            2000: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 850e9 } }, // +850 Gt (année 2000), aligné tooltip
            2025: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 900e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 18e11 } },
            2050: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 600e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 12e11 } },
            2075: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 350e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 7e11 } },
            '◀': {
                // ⚖️🏭 volontairement absent : CO₂ géré par accumulation manuelle (🔺⚖️🏭_cum)
                // ⚠️ TODO ⚖️🐄 CH4 2100 : ~3000 ppb → 8.6e12 kg (à recalibrer)
                '⚖️': { '⚖️💧': 1.4e21, '⚖️🫧': 5.15e18, '⚖️🐄': 8.6e12, '⚖️🫁': 1.18e18, '⚖️✈': 8.0e13, '⚖️💨': 3.97e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        },
        // 🌱 : 📱 Aujourd'hui — biosphère terrestre moderne (forêts potentielles ~31% des terres).
        // Réfs : Bonan 2008 Science 320:1444, AR6 WG1 Ch.5 (Carbon Sinks), FAO FRA 2020.
        '🌱': 0.31,
        // 🧫 : 📱 Aujourd'hui — CLAW moderne + sulfate anthropique (SO₂ industriel → CCN).
        // Réfs : Charlson 1987 (CLAW), Twomey 1977, Quinn & Bates 2011, Woodhouse 2010.
        '🧫': 1.0,
        // 🌊🏭 : pompe Urey = référence Henry moderne. ratio_ref=50 (CONFIG_COMPUTE.co2OceanRatioRef).
        // Absorption océanique anthropique ~25-30 % (Le Quéré et al. 2018, Friedlingstein et al. 2023
        // Global Carbon Budget). cf. calculations_co2.js v1.2.0 : seed ⚖️🌊🏭=50·⚖️🏭 à l'init.
        '🌊🏭': 1.0
    }
];

window.TIMELINE = timeline;

// Paramètres de calcul (convergence radiatif)
// Convention de source :
// - [OBS/CALIB] : valeur issue d'observations/littérature ou calibration sur observations
// - [EQ/NUM]    : valeur de schéma numérique, solveur ou stratégie de convergence
window.CONFIG_COMPUTE = window.CONFIG_COMPUTE || {};

// Partition CO₂ atmosphère ↔ océan (Henry — Van 't Hoff, 2400 K).
// v1.4.30 : POMPE TOUJOURS ACTIVE (bench = visu). Flag co2OceanPartitionInRadiativeConvergence RETIRÉ
// (obsolète — remplacé par EPOCH['🌊🏭'] facteur par époque ∈ [0, +∞[ ; 0 = Urey éteint).
// L'équilibre à l'init est garanti par initForConfig (seed ⚖️🌊🏭 = ratio_ref × ⚖️🏭).
//
// co2OceanRatioRef : rapport Masse CO2_océan / Masse_CO2_atm de RÉFÉRENCE (T = T_ref époque).
// 50 ≈ Terre moderne (Sarmiento & Gruber 2006, Ocean Biogeochemical Dynamics, Tab. 10.2.1 :
//   ~38 000 GtC océan / ~760 GtC atm pré-industriel → ratio ≈ 50). Crash-first (lu sans fallback).
window.CONFIG_COMPUTE.co2OceanRatioRef = 50;
// Flag de test pompe CO₂ océan : 1 = actif, 0 = coupé (seed océan inclus), >1 = amplification volontaire.
window.CONFIG_COMPUTE.co2OceanPartitionFactor01 = 1;
// Voile SW additionnel (0–1) depuis jauge hystérésis ⚽ ; s’ajoute à EPOCH[‘🍰⚽’] + 📜[‘🔺🍰⚽’] → DATA[‘🪩’][‘🍰⚽’] obstruction, DATA[‘🪩’][‘🍰🪩⚽’]=1−🍰⚽
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.hystStratosphericVeilExtra01))) {
    window.CONFIG_COMPUTE.hystStratosphericVeilExtra01 = 0;
}
// ─── Amplification polaire 3 zones EBM 0D (Budyko-Sellers) — v1.4.20 ────────────
// SOURCE DE VÉRITÉ : physics.js (EARTH.POLAR_AMP_POL_K, EARTH.POLAR_AMP_MID_K, EARTH.POLAR_ZONE_FRAC, EARTH.MIDLAT_ZONE_FRAC).
// Les calculs (albedo/flux/h2o) lisent CONFIG_COMPUTE.* en priorité → fallback EARTH.*
// Les défauts ci-dessous sont alignés sur EARTH.* (ne pas y toucher sauf pour tests de sensibilité).
//
// 🏷️ TUNING — valeurs Earth-modern (Budyko 1969, Sellers 1969, IPCC AR6 WG1 ch.7) :
//   dT_pol = 20 K (gradient global→pôle) ; dT_mid = 5 K (gradient global→mi-lat)
// 🏷️ FLOU SCIENTIFIQUE — dépendance obliquité ε (ACTIVÉE via '⚾'), P_atm, transport méridien.
// Ces constantes sont GLOBALES à toutes les époques : pas d'override par époque (faire de la physique, pas du patch).
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.polarZoneFraction)))    window.CONFIG_COMPUTE.polarZoneFraction   = 0.13;  // ~60°–90° les 2 pôles
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.midlatZoneFraction)))   window.CONFIG_COMPUTE.midlatZoneFraction  = 0.37;  // ~30°–60° les 2 hémisphères
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.polarAmplificationK)))  window.CONFIG_COMPUTE.polarAmplificationK = 20;    // aligné EARTH.POLAR_AMP_POL_K (override expérimental uniquement)
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.midlatAmplificationK))) window.CONFIG_COMPUTE.midlatAmplificationK = 5;    // aligné EARTH.POLAR_AMP_MID_K (override expérimental uniquement)
// ⚾ OBLIQUITÉ AXIALE ε (degrés). Défaut Terre 2025 = 23.44° (= EARTH.OBLIQUITY_DEG_REF).
// Par époque : clé '⚾' sur l'objet epoch écrase ce défaut (ex. Archéen ε ~ 45–70° hyp. Williams 1993).
// Effet : amp_z_eff = SEASONAL_AMP_z_K × sin(ε)/sin(23.44°) dans EARTH.computeIceTempFactor.
//
// ─── BORNES PHYSIQUES ACCEPTABLES (et pourquoi pas ! — libre au dialogue avec le modèle) ───
//   ε = 0°   → aucune saison, pas de solstice ⇒ amp_eff = 0  (limite mathématique)
//   ε ≈ 23.44° → Terre actuelle (IAU 2009). Laskar 1993 : Lune stabilise à ±1.3° sur 5 Ga.
//   ε ∈ [22.0°, 24.5°]  → cycle Milankovitch moderne (41 ka, obliquity signal en δ¹⁸O marin).
//   ε ∈ [0°, 60°]        → plage "sans Lune" (Laskar, Joutel & Robutel 1993, Nature 361:615) :
//                           sans satellite stabilisateur l'axe terrestre diffuse chaotiquement.
//   ε ∈ [45°, 70°]        → hypothèse Williams 1993 (EPSL 117:377) pour expliquer glaciations
//                           basse-latitude du Néoprotérozoïque/Archéen SANS Snowball global.
//                           Facteur sin(ε)/sin(23.44°) : 45°→1.78  54°→2.04  70°→1.18 (repasse < 90°).
//                           Argument de Williams : si ε > 54°, l'équateur reçoit MOINS d'insolation
//                           annuelle que les pôles → glaciations tropicales sans refroidir les hautes lat.
//                           NB : notre formule sin() monotone jusqu'à 90°, ne modélise pas l'inversion
//                           d'insolation annuelle — à raffiner si on pousse ε > 54°.
//   ε = 90°               → "planète couchée" (Uranus-like, 97.8°) ; saison extrême, un pôle en nuit
//                           permanente 6 mois. Limite haute de sin(ε) = 1.
//   ε > 90°               → rotation rétrograde (sin(ε) redescend, sin(180°)=0) — hors cadre ici.
// --- POURQUOI PAS ! --- Tester ε = 54° (seuil Williams), ε = 35° (intermédiaire), ε = 0° (neutre
// saison) pour isoler l'effet de la saisonnalité vs moyennes annuelles. Combinable avec CO₂/CH₄
// pour voir si la saisonnalité "suffit" ou si la physique radiative reste le vrai goulot.
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.obliquityDeg)))         window.CONFIG_COMPUTE.obliquityDeg       = 23.44; // 🏷️ OBS/CALIB (IAU 2009) — plage acceptée [0°, 90°] (voir bloc ci-dessus)

// Valeurs par défaut des jauges fine-tuning (% ) : source unique window.DEFAULT.TUNING.baryByGroup (initDATA.js v1.3.1
// copie ici dans CONFIG_COMPUTE.baryByGroupDefault après DATA['🎚️']). Ne pas dupliquer de littéraux dans ce fichier.

// ===================== [OBS/CALIB] =====================
// Bins spectaux (N utilisé). 500 = courbe propre ; 100 donne courbe moins précise et convergence ~1.2°C (artefact). 🔬🌈 dans [N_min, N_max].
// N_min : optionnel (spectralBinsMinFromHITRAN). Réf. scripts/hitran_spectral_bin_bounds.py.
// 2000 = courbe spectrale lisse. Réduire à 1000 si crash Brave code 5 (RAM).
window.CONFIG_COMPUTE.maxSpectralBinsConvergence = 2000;            // [OBS/CALIB]
window.CONFIG_COMPUTE.initSpectralBinsConvergence = 200;            // [OBS/CALIB] N initial (anim : 200 → … → max ; passe finale à max après convergence)
// spectralMaxMB : si défini, pas de passe finale à maxBins si grille dépasserait ce seuil (évite Brave code 5). Ex. 25.
window.CONFIG_COMPUTE.spectralMaxMB = null;                         // [OBS/CALIB] null = pas de plafond ; 25 = skip passe finale si > 25 MB
// Workers spectraux : par défaut nWorkers = navigator.hardwareConcurrency - 1. Optionnel : maxWorkers (ex. 4) pour plafonner.
// window.CONFIG_COMPUTE.maxWorkers = 4;                            // [OBS/CALIB] décommenter pour limiter (ex. 4)
// Limite RAM (calculations.js) : plafond couches convergence + résolution stockée en DATA['📊'] (évite 1–4 Go heap).
window.CONFIG_COMPUTE.maxLayersConvergence = 800;                   // [OBS/CALIB] max couches atmosphère pour le calcul (z_range écrêté)
window.CONFIG_COMPUTE.maxStoredSpectralLayers = 400;                // [OBS/CALIB] max couches gardées en DATA pour affichage (sous-échant.)
window.CONFIG_COMPUTE.maxStoredSpectralBins = 600;                 // [OBS/CALIB] max bins λ gardés en DATA pour affichage (sous-échant.)
window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN = null;            // [OBS/CALIB]
// true = répartition homogène (poids ∝ largeur région → même densité bins/μm partout) ; false = grille d'origine (converge bien).
window.CONFIG_COMPUTE.spectralGridHomogeneous = true;             // [OBS/CALIB]
// Pondération physique du spin-up : cycles_effectifs = cycles × f(⚖️🫧) × f(⚖️💧). Refs confirmés >= 1 au set.

window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg = 1e18; // [OBS/CALIB]
window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg = 1e20; // [OBS/CALIB]
// Temps caractéristique fonte calotte pour l'héritage glaciaire (ans)
window.CONFIG_COMPUTE.tauGlaceAns = 50000;                         // [OBS/CALIB]
// Facteur d'inertie glace (multiplieur du temps caractéristique, applicable au blend dt — calculations_albedo.js).
// Forme exponentielle (v1.4.28) : tau_eff = tauGlaceAns × iceInertiaFactor01
//                                  fraction_fonte = 1 − exp(−duree_ans / tau_eff)
//   • 1.0 = tau_eff = tauGlaceAns (temporalité géologique standard)
//   • >1 = plus d'inertie (fonte/formation plus lente, tau_eff rallongé)
//   • <1 = moins d'inertie (converge plus vite vers glace_equilibre(T))
//   • 0.0 = tau_eff = 0 → fraction_fonte = 1 (équilibre instantané, blend désactivé)
// Introduit en v1.2.53 (lin) puis v1.4.28 (exp) — suppression du verrou STATE.iceEpochFixedWaterState,
// permet de calibrer l'inertie sans brutalement retirer le couplage dt. Renommé depuis iceBlendRelaxation01.
window.CONFIG_COMPUTE.iceInertiaFactor01 = 1.0;                    // [EQ/NUM]
// Pressure broadening (spectroscopie) : σ_eff = σ × √(P/P_ref), utile à P>1 bar.
window.CONFIG_COMPUTE.pressureBroadening = true;                   // [OBS/CALIB]
// Hauteur radiative effective : base RT/Mg (hauteur d'échelle), étendue pour représenter une transition
// radiative progressive au-dessus de la coupure stricte. 1.0 = héritage ; 1.03 ≈ retour 2000 vers 15.4°C.
window.CONFIG_COMPUTE.radiativeTropopauseExtensionFactor = 1.03;    // [OBS/CALIB]
window.CONFIG_COMPUTE.troposphericLapseRateKPerM = 0.0065;           // [OBS/CALIB] atmosphère standard, gradient thermique utilisé sous la coupure effective.
// Masse totale eau terrestre (kg), ref pour % météorites de glace (events.js)
window.CONFIG_COMPUTE.earthTotalWaterMassKg = 1.4e21;              // [OBS/CALIB]

// ===================== [EQ/NUM] =====================
window.CONFIG_COMPUTE.maxRadiatifIters = 101;                      // [EQ/NUM]
// Plafond T en Search (K). null = pas de plafond (test).
window.CONFIG_COMPUTE.maxSearchT_K = null;                         // [EQ/NUM]
// Tolérances cycle eau (changement albedo/vapor pour relancer tour radiatif)
window.CONFIG_COMPUTE.cycleTolAlbedo = 1e-4;                       // [EQ/NUM]
window.CONFIG_COMPUTE.cycleTolVapor = 1e-6;                        // [EQ/NUM]
// Spin-up climatologique avant solver radiatif (cycles eau/albédo avant convergence). Confirmé >= 0 entier.
// v1.4.17 : réduit 8→1 (les 8 palliaient le bug H2O=0 à Init, désormais corrigé par calculateH2OParameters() avant calculateFluxForT0()).
window.CONFIG_COMPUTE.climateSpinupCycles = Math.max(0, Math.floor(1)); // [EQ/NUM]
// Cycles eau/albédo par pas radiatif (1 = même résultat visu/scie 16.4°C 2025 ; 2 = visu peut dériver albédo → 15.2°C)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep = 1;             // [EQ/NUM]
// Cycles eau/albédo à l'Init uniquement (T fixe)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit = 1;              // [EQ/NUM]
// Rampe glace en convergence : step nominal et step renforcé sur les premières itérations Search
window.CONFIG_COMPUTE.freezePolarIceDuringSearch = true;               // [EQ/NUM] true = stabilise le run direct ; hystérésis déverrouille via HYSTERESIS.active.
window.CONFIG_COMPUTE.iceCoverageRampMaxStep = 0.004;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampEarlyIters = 10;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly = 0.001;         // [EQ/NUM]

// Catégorie à part : overrides debug/patch (pas dans CONFIG_COMPUTE).
window.OVERRIDES = window.OVERRIDES || {};
// Désactivé par défaut :
// Le verrou glace doit venir de la physique (partition eau + gel océan) ou des valeurs per-epoch (EPOCH['⛄']),
// sinon ça casse ⛄ "Boule de neige" (750–600 Ma) en limitant la glace à ~8.5%.
window.OVERRIDES.useEpochIceFixed = false;
window.OVERRIDES['⛄'] = null;

// ===================== [SOLVER] ===================== source unique SOLVER (v1.4.13)
// Statiques (pas d'UI, pas d'interpolation bary) → CONFIG_COMPUTE directement, pas dans DATA/DEFAULT.
// Lus par calculations_flux.js (computeToleranceWm2, computeSearchIncrement, cap 1er pas Search),
// physicsAll.js / calculations_h2o.js (🔺⏳ = accélération pas temps).
window.CONFIG_COMPUTE.tolMinWm2 = 0.10;                  // [EQ/NUM] tolérance plancher flux (W/m²)
window.CONFIG_COMPUTE.maxSearchStepK = 140;              // [EQ/NUM] cap pas Search nominal (K)
window.CONFIG_COMPUTE.maxSearchStepLargeK = 200;         // [EQ/NUM] cap pas Search "grand delta" (K)
window.CONFIG_COMPUTE.largeDeltaFactor = 16;             // [EQ/NUM] seuil |Δ| > factor × tol → grand pas
window.CONFIG_COMPUTE.deltaTAccelerationDays = 10;       // [EQ/NUM] 🔺⏳ = 1 jour × this (si acceleration)
// v1.4.17 : firstSearchStepCapK supprimé (patch SB linéarisé historique, désormais obsolète).
// Le 1er pas Search est désormais pris tel quel depuis computeSearchIncrement().
window.CONFIG_COMPUTE.bornesMinK = 250;                  // [EQ/NUM]
window.CONFIG_COMPUTE.bornesMaxK = 4000;                 // [EQ/NUM]
window.CONFIG_COMPUTE.searchStepScaleMax = 200;          // [EQ/NUM]

// ===================== [OUTIL/DEBUG/UI] =====================
// Log diagnostic EDS (h2o_eds_scale, bins, delta_z, n_layers, earth_flux, OLR, EDS)
window.CONFIG_COMPUTE.logEdsDiagnostic = false;
// Lissage visuel du spectre (affichage uniquement, pas la physique/OLR)
window.CONFIG_COMPUTE.plotSmoothEnable = true;
window.CONFIG_COMPUTE.plotSmoothSigmaBins = 8.0;//5.6;
// Repères spectre (visu plot.js) : monter les [ ] molécules ; pile EDS + Soleil (image ☀️) centrée en λ
window.CONFIG_COMPUTE.spectralBandIndicatorLiftPx = 14;
window.CONFIG_COMPUTE.spectralEdsSunLambdaUm = 10;
window.CONFIG_COMPUTE.spectralEdsSunStackLiftPx = 26;
// Bandes [ ] spectre : PNG (charsImages) vs emoji ; ImgPxByEmoji = map clef emoji -> px (ex. une seule entree pour CH4)
window.CONFIG_COMPUTE.spectralBandLogoImgPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoEmojiPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoImgPxByEmoji = {};
// Logs diagnostics
window.CONFIG_COMPUTE.logIceFixedDiagnostic = true;
// true : une ligne par calculateAlbedo (T, mer gelée, facteur polaire, cibles, verrous hyst, 🍰🪩🧊 après normalisation surfaces)
window.CONFIG_COMPUTE.logIceFractionDiagnostic = true;
window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic = true;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = true;
window.CONFIG_COMPUTE.logIrisDiagnostic = true;

