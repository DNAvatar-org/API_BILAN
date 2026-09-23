// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.4.91
// Date: [September 18, 2026]
// logs :
// - v1.4.89: window.epochIndex() — l'index des époques (type/name/id/startYears/endYears) naît avec TIMELINE.
//   Il était construit par CO2/static/ui/loader_panels.js dans configOrganigramme.timeline, ce qui obligeait
//   API_BILAN/geology à lire la config du diagramme de l'application pour résoudre une époque.
// - v1.4.88: 🍄 — 🔺⏳ 140 → 35 Ma (4 clics) + 🕰.🔁 : le drawdown Dévonien-Carbonifère et la GLACIATION DU
//   KAROO (LPIA, ~315 Ma) existent enfin. Avant, l'unique clic sautait à la racine du Permien et FAISAIT MONTER
//   le CO₂ (909 → 1830 ppm, +7 °C), l'inverse de l'époque. Trajectoire mesurée au banc :
//   20,0 → 18,9 → 17,7 → 6,3 °C (glace 11,5 → 27,7 %), puis 26,8 °C à l'arrivée sur 💀.
// - v1.4.87: 📱 — '🌙' (carte de nuit superposée, face à l'ombre) remplace l'alternance jour/nuit par tic. '🖼' reste la suite d'images (🦣).
// - v1.4.86: '🖼' = SUITE d'images par époque dans 🕰 (index = 📿💫 modulo longueur) — 🦣 interglaciaire/glaciaire, 📱 jour/nuit. Une seule clé, plus de 🖼 par état 🔁.
// - v1.4.85: 🦣 🕰.🔁 — clé '🖼' : texture de la planète par état (glaciaire -00002Ma / interglaciaire -00001Ma), lue par getPlanetTexturePathFromEpoch.
// - v1.4.84: 🦣 — 🕰.🔁 (états par tic : obliquité + masses) et 🔺⏳ 0,5 Ma : 4 clics montrent la bascule glaciaire/interglaciaire (EPICA, Laskar 2004). Textes dans epochs_alt2sec.js.
// - v1.4.83: CONFIG_COMPUTE.CARBON_SINKS — puits océan (Henry/Revelle, τ 50 a) + forêts (fertilisation β ln, τ 23 a) pour le CO₂ injecté ; refs mesures.
// - v1.4.82: 🔥 CO₂ 3.5e20 (~270k ppm) + H₂O 6e20 (vapeur 15 %) selon grille litt. ; commentaire T moyenne Hadéen sans sens ; 🦣 commentaire instabilité glace-albédo (Pléistocène).
// - v1.4.81: compositions ramenées dans la grille litt. : 🦠 CO₂/CH₄ sous les max, 🦣 CO₂ 298 / CH₄ 0,80 ppm (seuil glace), 🏔 CH₄ 1,5 ppm, 🐊 CO₂ ~1380 / CH₄ 3,8 ppm (vers 24 °C) ; 🔥 inchangé (grilles CO₂/T incompatibles, documenté) ; bench 📱 = observations an 2000.
// - v1.4.80: 📱 🕰 🔺⚖️🏭 ×1000 (kg réels : 850 GtCO₂ = 850e12 kg ; avant 850e9 = 0,85 Gt, sans effet) + refs GCB/SSP.
// - v1.4.79: logs — logIceSnapshotDiagnostic / logAlbedoUiDiagnostic / logEpochCompareToFile à false (écritures fichier par appel) ; hyst.txt + bench.txt + rnd.txt conservés.
// - v1.4.78: HYSTÉRÉSIS 1 recalée sur la littérature (après albedo v1.2.64 : Δ(T) sans racines parasites, nuages 2 couches).
//   hysteresis 1a : 🌡️🧮 283.15 (restauré), ⚖️🏭 5.2e15 (~640 ppm, lit. [500,2000]) → ≈ 7 °C (bench [5,15]) ; ⚖️🏭🔺 retiré.
//     Test hyst (CO₂ seul) : seuil ≈ 92–93 ppm (Brunetti 2023 ESD 95±5 ppm à 700 Ma ; Feulner & Kienert 2014 100–130).
//   ⛄ : voile racine 🔺🍰⚽ 0.02→0.05 (Franklin LIP −10 W/m², Macdonald & Wordsworth 2017), 🌡️🧮 218.15 (−55 °C),
//     ⚖️🏭 = 1a (même CO₂, deux états), ⚖️🐄 30→10 ppm (lit. [0.1,10]) ; 🕰.order ['💫','🌋'] (voile retombé puis sortie).
//     Visu : 1a 7 °C → 🗻 → ⛄ −56 °C → 💫 −53 °C (reste gelé au même CO₂) → 🌋 → 1b 29 °C.
//   hysteresis 1b : ⚖️🏭 1.31e18 (15 %) → 8.2e16 (~9 900 ppm, grille CSV [2000,10000]) + 🌫️❄️ 0.48 (glace sale,
//     Abbot & Pierrehumbert 2010) + ⚖️🏭🔺 0.25 (scan+ depuis la branche froide). Seuil test ≈ 8 500 ppm ; bench ≈ 29 °C.
// - v1.4.77: hysteresis 1b (Sortie Marinoen) — déglaciation en anim. En animation la T° se propage : après le
//   snowball (1a bascule froid depuis v1.4.75 dt_pol=20), la frise arrivait sur 1b à ~−57 °C et y restait
//   coincée. Cause : ⚖️🏭 1b = 2.75e16 (3500 ppm) contredisait son PROPRE commentaire (« hyper-greenhouse
//   ~80 000 ppm cause de la déglaciation ») — valeur post-drawdown au lieu de la valeur de sortie. 2 fixes :
//   (1) ⚖️🏭 2.75e16 → 7.0e17 (~80 000 ppm mol = 0.08 bar, cœur fourchette sortie Marinoen 0.01–0.12 bar ;
//       Pierrehumbert 2004 Nature 429:646, Hoffman 2017 Sci Adv 3:e1600983). Déstabilise la branche froide →
//       la planète déglace depuis le snowball. Corrige aussi le bench (3500 ppm ne tenait même pas la branche
//       chaude : seed 35 °C → 23 °C, delta_INIT −31.7). Attendu maintenant : super-greenhouse ~45-50 °C (correct).
//   (2) 🌊🏭 2.0 → 0 : la pompe Urey/cap-carbonates est un drawdown POST-déglaciation ; active pendant la
//       tentative de fonte elle aspire le CO₂ censé causer la fonte (à froid, Henry ↑ → atm→océan) = à l'envers.
//       Coupée. Le drawdown 80k→1k ppm sur ~10 Ma (gate T>0 / tics) = raffinement ultérieur.
// - v1.4.76: 🦠 Archéen — sortie du snowball spontané (−70 °C, hors cible bench [5,25] °C). 3 leviers, tous
//   dans les fourchettes littérature :
//   (1) 🌊🏭 0.05 → 0 : coupe le seed océan CO₂ Henry. co2OceanRatioRef=50 est le ratio DIC/atm MODERNE
//       (océan tamponné pH 8, Sarmiento & Gruber 2006) ; à 0.19 bar pCO₂ archéen l'océan est acide (pH~5-6),
//       le vrai ratio s'effondre → le réservoir 50× (1.4e20 kg) est un puits fantôme qui aspire le CO₂ dès que
//       T baisse (Henry : eau froide = +CO₂ dissous) → amplificateur de refroidissement → snowball. C-cycle
//       archéen = tamponné carbonates sédimentaires, pas DIC océan (Sleep & Zahnle 2001, déjà cité). Restaure
//       l'état que le commentaire calculations_flux.js assume déjà (🦠 ⇒ ⚖️🌊🏭=0, régressé par 7894efe).
//   (2) ⚖️🐄 5.06e16 → 6.7e16 : CH₄ au max CSV bench (10k ppm mol, Haqq-Misra 2008). CH₄/CO₂=0.024 < 0.1
//       (pas de brume organique). Comble le déficit radiatif résiduel du faint sun 74 %.
//   (3) ⚖️💨 7.0e18 → 1.0e19 : N₂ au max 🔒 (2.2 atm, Som 2012 / Marty 2013). Élargissement collisionnel
//       (pressure broadening) des bandes CO₂/CH₄ → +GES. Étape explicitement prévue par le commentaire v1.4.50.
// - v1.4.75: hysteresis 1a — 🥶 aligné sur ⛄ ({dT_pol:20, dT_mid:5}) : le cycle 1a↔⛄ est la même planète,
//   le dT_pol:10 (copié de 🪸) décalait le seuil d'engagement glace de 10 K vers le froid → scan hyst incapable
//   de basculer (bench 2026-07-13 : 1a converge 16.65 °C, ⛄ −62 °C OK, 🦠 runaway OK). ⚖️🏭 restauré 8.594e14
//   (valeur commentée = 🔒 max, domaine nominal du BaryAdapter) — le 4.801e14 résiduel R&D plaçait x0 (65 ppm)
//   SOUS le seuil littérature 100-300 ppm : un scan descendant ne peut pas trouver un seuil au-dessus de x0.
// - v1.4.74: window.BENCH_LIT_BY_EPOCH_ID défini ici (source unique) — epoch_bench.html lit window au load ; plus de duplicata statique / CSV / cookie pour les repères litt. affichés au bench.
// - v1.4.91: FOURCHETTES DU BANC re-sourcées sur données primaires — 📱 [14,5 ; 15,5] → [13,9 ; 14,9]
//   et 🚂 [13 ; 15] → [13,0 ; 14,0]. Le centre de 📱 était **0,50 °C trop haut** : il venait du 288 K
//   des manuels, pas d'une mesure. Ancrage refait : GISTEMP v4 (anomalie 2000 = +0,39 vs 1951-1980)
//   sur l'absolu 14,0 °C ± 0,5 de Jones et al. 1999 → 14,4 °C ; recoupé par ERA5/Copernicus
//   (1991-2020 = 14,4 °C absolu), les deux chemins concordant à 0,11 °C. La LARGEUR ±0,5 est
//   l'incertitude publiée sur l'ABSOLU — c'est ce que la fourchette doit porter, l'anomalie étant
//   connue 10× mieux. Préindustriel 13,5 °C (Copernicus ESOTC 2024). Les 15 fourchettes paléo n'ont
//   PAS été re-sourcées et portent probablement le même décalage : encadré en tête du tableau.
// - v1.4.90: ⛄ repasse à 4,0e8 kg (fond naturel) — la dérivation « fond × part volcanique » qui
//   était écrite en dur sur sa fiche est passée dans calculations_albedo.js v1.2.65, où 🧫 module la
//   part DMS du soufre avec le partage mesuré 0,29/0,71 pour les 19 époques. Masse effective
//   inchangée (1,30e8 au lieu de 1,2e8). Segment 🔒 ⚖️✈ de ☃/⛄ dégénéré (min = max) : plus
//   d'incertitude de masse à interpoler sur ce segment.
// - v1.4.89: ⚖️✈ — les 19 masses de sulfate passent du « proxy CCN » à des CHARGES ATMOSPHÉRIQUES
//   RÉELLES, en kg de SO₄, une source par époque. 📱 8,0e13 → 1,05e9 (Tsigaridis et al. 2006 ACP
//   6:5143, Table 5) ; 🚂 1,5e12 → 4,0e8 (même table, préindustriel) ; 🦠 5,0e14 → 4,0e8 (l'ancienne
//   valeur pesait 500 000 × la charge moderne, sans source) ; 🪸 0 → 4,0e8 (post-GOE, l'atmosphère est
//   oxydante) ; ⛄ 1,018e12 → 1,2e8 (fond × part volcanique, DMS éteint sous banquise — dérivation sur
//   la fiche) ; toutes les autres → 4,0e8, fond naturel préindustriel FAUTE DE CONTRAINTE PUBLIÉE,
//   ce qui est dit tel quel. Bornes 🔒 de 🦠, ☃/⛄ et 📱 refaites sur les mêmes sources. Encadré
//   « MASSES DE SULFATE » en tête du tableau ; détail dans doc/MASSES_SULFATE_PAR_EPOQUE.md.
//   Le rapport 📱/🚂 passe de 53 à 2,6 — c'est lui, pas l'échelle absolue, que la loi sulfate→CCN lit.
//   Couple avec physics.js (CCN_SULFATE_REF_KG suit la même source) et scie_hysteresis_search.js.
// - v1.4.73: 🏔 — 🕰.baryFromDate + 🔀 ['📅','📜'] : interpolation 🌡️🧮 + 🔺🍰⚽ (voile) selon date 📜📅 sur 33→2 Ma (compute.js v1.0.21) ; racine 🔺🍰⚽ = début de rampe.
// - v1.4.72: 🦣 Quaternaire — 🕰.🔀 ['📅'] + ◀📅🌡️🧮 (287.15 K fin frise) pour interpolation graine T le long des tics (compute.js v1.0.20).
// - v1.4.71: commentaires maxDichotomyIterations vs maxRadiatifIters — deux boucles distinctes (visu panneau = innerIter+1 → maxRadiatif).
// - v1.4.70: CONFIG_COMPUTE.maxDichotomyIterations (=30) — plafond itérations solveur T0 (performDichotomy) si bilan pas convergé ; remplace le 20 codé en dur.
// - v1.4.69: ⚖️🫧 retiré des fiches TIMELINE — masse atmosphère sèche = somme contractuelle dans compute.getMasses (⚖️🏭+🐄+💨+🫁+✈).
// - v1.4.68: 🛖 Holocène — ▶ = −10000 (10 ka BP affiché −10000 sur la frise ; physique inchangée via timelineDeltaYearsToStartMa).
// - v1.4.67: CONFIG_COMPUTE.logAlbedoUiDiagnostic — miroir logs/albedoUi.txt (POST /_log) + window.__ALBEDO_UI_LOG ; debug % glace panneau Corps noir.
// - v1.4.66: CONFIG_COMPUTE.noAtmosphereMeteoriteIceCap01 / noAtmosphereMeteoriteIcePerPAL — glace ⚫ (sans atm) bornée + liée à ⚖️💧 (h2o v1.0.25).
// - v1.4.65: 🕰.order — ⚫ séquence ☄️/💫/🎇 explicite + 💫 tic ; hysteresis 1a order ['🌋'] (SKIP masqué côté events).
// - v1.4.64: ⛄ voile — racine 🔺🍰⚽ = impulsion entrée (−2 % soleil équivalent) ; 🍰⚽ uniquement dans 🕰.💫 (remise 📜 au clic 💫, events.js).
// - v1.4.63: ⛄ — impulsion voile : 🔺🍰⚽ (entrée tic 0) + 🍰⚽ base (0) au même niveau que 📅 ; plus sous 🕰.💫 (compute.js lit EPOCH['🔺🍰⚽']).
// - v1.4.62: ⛄ 🕰.💫.🔺🍰⚽ — impulsion voile SW à l’entrée (0.02) ; retirée au 1er tic (compute.js v1.0.14), pas dans events.js.
// - v1.4.61: ⛄ — 🌡️🧮 + ⚖️🏭 = pas dicho **chaud** (📿=4, T≈−2,9 °C, 4,621e14 kg) ; v1.4.60 (210 K + 4,58e14 froid) corrigé.
// - v1.4.60: ⛄ (Plein Snowball) — masses + 🌡️🧮 + 🗻 + 🌱/🧫/🌊🏭 + 🔒 segment hyst1a↔⛄ alignés sur le dernier pas froid dicho hyst 1a (≈📿🧮=8, T_conv≈−62,8 °C, SUCCESS) ; export TIMELINE copié depuis l’onglet hyst (scie_hyst_repro_state v1.1)
// - v1.4.59: CONFIG_COMPUTE.logReproComparableState — une ligne [REPRO] (snapshot JSON) après convergence, alignée hyst / epoch (scie_hyst_repro_state.js)
// - v1.4.58: retrait ×1.1 sur TIMELINE (v1.4.57) — marge R&D hyst 1a uniquement dans scie_hysteresis_search
//   + co2MaxFactor sur createBaryAdapter (scie_hysteresis_bary), pas dans configTimeline.
// - v1.4.56: hysteresis 1a — bloc 🔒 (min=⛄, max=1a) pour ⚖️🏭/🐄/💨/🫁/💧/✈ : createBaryAdapter
//   co-évolue toutes les masses au dicho, pas seul le CO₂ (defaultCo2Adapter). Aligné fiches ⛄ (524–560) et 1a (499–512).
// - v1.4.55: miroir _logs/ — chaque log* → fichier dédié (eds.txt, iceFraction.txt, …) via window.debugMirrorConfigLogToFile ; hyst+epoch activables en même temps (logs_to_server v1.1.6)
// - v1.4.54: logHystPanelToFile + logEpochCompareToFile (défaut false) — miroir _logs/hyst|epoch.txt via logs_to_server (sans ?debug=, pas de reset fichier au F5)
// - v1.4.53: logCo2PartitionDiagnostic — pdTrace load/NO-OP/APPLY dans calculations_co2.js (défaut false) ;
//   commentaire TIMELINE hysteresis 1a : 🌡️🧮 = graine du bouton hyst (ligne id), distincte de la fiche Sturtienne 🪸.
// - v1.4.52: logs diagnostics (glace, cloud-proxy, Iris, co2 atmos) — défaut false (console silencieuse) ; activer à la
//   main dans la console si besoin (CONFIG_COMPUTE.logIceFractionDiagnostic = true, etc.).
// - v1.4.51: radiativeFactorTropopauseFixed=1,0261 — calage hors jauge SCIENCE (tuning v1.0.18) ; 1,03+min(1,0−1,03)×0,13. null = (futur) recoller au bary.
// - v1.4.50: useFactorTropopause = true par défaut (extension jauge réactivée) ; plage FINE_TUNING 1,03–1,00 (v1.3.9) pour limiter l’effet.
// - v1.4.49: CONFIG_COMPUTE.useFactorTropopause (défaut false) — désactive l'extension jauge (DATA['🎚️'].RADIATIVE.factorTropopause) sur la hauteur radiative ; ATM v1.2.1.
// - v1.4.48: retrait des leviers freezePolarIceDuringSearch / iceCoverageRamp*. La glace est calculée directement dans albedo v1.2.55 pour tous les onglets ; l'hystérésis ne change plus la physique.
// - v1.4.47: freezePolarIceDuringSearch=false — aucun verrou glace en run direct ; même rétroaction glace libre que l'hystérésis.
// - v1.4.46: Masses contractuelles explicites pour compute.js crash-first : ajout ⚖️💨/⚖️✈ manquants sur les époques qui dépendaient du résiduel/fallback.
// - v1.4.45: hysteresis 1b — ajoute ⚖️✈ explicite (proxy sulfates) pour supprimer le zéro caché de getMasses.
// - v1.4.44: Protérozoïque — garde plage bench [0,15] mais remet 🌡️🧮=285.65 K (12.5°C) branche chaude ; le milieu strict 7.5°C déclenchait la branche snowball.
// - v1.4.43: Retrait gardes Number.isFinite sur constantes CONFIG_COMPUTE globales (assignations directes).
//   climateSpinupCycles = 1 direct. Plages T bench/commentaires : Sturtienne [5,15], Plein Snowball [-60,-50],
//   Limite P/T [21,32], Mésozoïque [21,31] ; 🌡️🧮 recentrés.
// - v1.4.42: Protérozoïque (début 2.5 Ga) bench [0,15]°C, 🌡️🧮=280.65 K ; l'époque interpole ensuite vers Sturtienne via la timeline.
// - v1.4.41: Archéen bench [5,25]°C (plage tempérée froide/modérée à 4 Ga), 🌡️🧮=288.15 K.
// - v1.4.40: Archéen — essai "moyenne des fourchettes" sur les bornes 🔒 : CO₂, CH₄, N₂, O₂, sulfates, H₂O hydrosphère ; ⚖️🫧 recalculé.
// - v1.4.39: Bench littérature — Sturtienne warm branch [5,20]°C au lieu de [-50,10].
//   Archéen resserré [15,45]°C. 🌡️🧮 des époques bench recentrés sur le milieu des plages T.
// - v1.4.38: Extension tropopause radiative → DATA['🎚️'].RADIATIVE.factorTropopause (fine-tuning SCIENCE, FINE_TUNING_BOUNDS). Retrait CONFIG_COMPUTE.radiativeTropopauseExtensionFactor.
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
// - v1.4.94: 📱 🕰 tranche 2000 — émissions 850e12 → 973e12 kg CO₂, le cumul MESURÉ 2000-2024 du Global
//   Carbon Budget (2751,5 − 1778,1 GtCO₂). Les 850 venaient du bas d'une fourchette estimée au jugé et
//   compensaient des puits trop faibles. Seule la tranche du passé change : 2025/2050/2075 restent des
//   scénarios, ils ne se mesurent pas. 2025 : 420,5 → 428,3 ppm d'air sec (mesuré 424,6).
// - v1.4.93: CARBON_SINKS — puits terrestre en 3 mécanismes (fertilisation pondérée par l'âge des
//   peuplements, dépôt d'azote, repousse héritée), un chiffre publié pour chacun. landBeta unique
//   remplacé par landBetaYoung/landBetaMature/landYoungFraction0. Terres 2025 : 21,9 % → 28,6 %
//   (mesuré ~30 %), sans aucun calage.
// - v1.4.92: CARBON_SINKS — océan en 3 réservoirs (mélange 1,2/1 an · thermocline 10/50 ans · profond
//   38,8/350 ans, Σratio = 50 inchangé) au lieu d'une boîte unique à τ 50 ans qui ventilait l'océan entier
//   en un demi-siècle. β forêts 0,5 → 0,605 (Norby 2005 avec l'ambiant FACE réel, 376 ppm). Océan 2025 :
//   14,9 % → 26,1 % (mesuré ~26 %). Terres 21,9 % (mesuré ~30 %) : écart assumé, fertilisation seule.
// - v1.4.91: 📱 🕰 — 🐖 renommée 🪾 et recalée sur « 2 × le bidon » : 36e14 / 24e14 / 14e14 (double de 🛢
//   à chaque tranche), cumul 7400 GtCO₂ sur 2025-2100. Remplace l'ancien ×√2 (1202/1700/2404).
// - v1.4.90: 📱 🕰 — troisième branche dans les tranches 2025/2050/2075 : 850 GtCO₂ (observé 2000-2025)
//   multiplié par √2 par tranche → 1202 / 1700 / 2404, cumul 5306 GtCO₂ sur 2025-2100 ≈ SSP5-8.5.
//   ⛽ et 🛢 décroissaient toutes deux après 2050 et plafonnaient à 477 et 567 ppm en 2100.
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
// Fourchettes litt. bench : window.BENCH_LIT_BY_EPOCH_ID (assigné après window.TIMELINE) ; epoch_bench.html n’embarque plus de copie.
// Chaque entrée d’époque dans timeline[] reprend en commentaire les mêmes nombres (voir Archéen 🦠 modèle).
// Colonnes : T_init °C plage ; CO₂ ppm ; CH₄ ppm ; H₂O vapeur mol % (atmosphère) ; albédo 🍰🪩📿.
// Mapping époques TIMELINE ↔ libellés CSV : ⚫ Corps_noir ; 🔥 Hadéen ; 🦠 Archéen ; 🪸 Protérozoïque ;
//   hysteresis 1a Sturtienne ; ⛄ Plein_Snowball ; hysteresis 1b Sortie_Marinoen ; 🪼 Paléozoïque_marin ;
//   🍄 Paléozoïque_terre ; 💀 Limite_P/T ; 🦕 Mésozoïque ; 🦤 Cénozoïque ; 🐊 Éocène ; 🏔 Oligocène/Grande_Coupure ;
//   🦣 Quaternaire ; 🛖 Holocène ; 📱 Aujourd'hui.
// Époque,T_init_°C,CO2_ppm,CH4_ppm,H2O_vap_mol_%,Albedo_🪩
// Corps_noir,[-19, -17],[0, 1],[0, 0.1],[0, 0.01],[0.29, 0.31]
// Hadéen,[2000, 2500],[100000, 500000],[10, 100],[10, 20],[0.15, 0.35]
// Archéen,[5, 25],[50000, 150000],[1000, 10000],[0.5, 3.0],[0.20, 0.30]
//   → T surface : plage tempérée froide/modérée à ~4 Ga ; eau liquide probable mais contraintes exactes très débattues.
// Protérozoïque,[0, 15],[5000, 20000],[50, 500],[0.5, 1.5],[0.25, 0.35]
// Sturtienne,[5, 15],[500, 2000],[10, 50],[0.1, 1.0],[0.60, 0.85]
// Plein_Snowball,[-60, -50],[300, 1500],[0.1, 10],[0.01, 0.5],[0.80, 0.90]
// Sortie_Marinoen,[20, 50],[2000, 10000],[10, 100],[2.0, 5.0],[0.15, 0.25]
// Paléozoïque_marin,[15, 25],[1500, 5000],[5, 20],[1.0, 2.5],[0.20, 0.25]
// Paléozoïque_terre,[15, 25],[500, 3000],[5, 20],[1.0, 2.0],[0.20, 0.23]
// Limite_P/T,[21, 32],[1500, 4000],[20, 100],[1.5, 3.5],[0.18, 0.22]
// Mésozoïque,[21, 31],[1000, 2500],[10, 30],[1.5, 3.0],[0.18, 0.22]
// Cénozoïque,[12, 22],[400, 1000],[1, 5],[0.8, 1.5],[0.22, 0.28]
// Éocène,[20, 28],[800, 1500],[1, 5],[1.2, 2.5],[0.20, 0.25]
// Oligocène,[12, 18],[400, 700],[1, 2],[0.8, 1.2],[0.25, 0.30]
// Grande_Coupure,[10, 15],[300, 600],[1, 2],[0.7, 1.0],[0.28, 0.32]
// Quaternaire,[10, 16],[180, 300],[0.4, 0.8],[0.6, 1.0],[0.28, 0.33]
// Holocène,[13, 15],[260, 285],[0.6, 0.8],[0.8, 1.0],[0.29, 0.31]
// Aujourd'hui (an 2000),[14.5, 15.5],[365, 375],[1.70, 1.85],[1.0, 1.2],[0.29, 0.30]
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
// ═══════════════════════════════════════════════════════════════════════════
// MASSES DE SULFATE ⚖️✈ — une charge atmosphérique réelle, en kg de SO₄
// ═══════════════════════════════════════════════════════════════════════════
// Jusqu'au 2026-09-22 cette clé portait un « proxy CCN » : 8,0e13 kg pour 📱, ~1e12 partout
// ailleurs, 5,0e14 pour 🦠. Aucun de ces nombres ne venait d'une source, et les RAPPORTS entre
// époques — la seule chose qui compte dans une loi sulfate→CCN, qui s'écrit en rapport — étaient
// faux d'un ordre de grandeur : 📱/🚂 = 53 contre 2,6 mesuré.
//
// Désormais ⚖️✈ = charge atmosphérique de sulfate, en kg de SO₄, à l'échelle réelle :
//
//   📱 Aujourd'hui      1,05e9 kg   Tsigaridis et al. 2006 ACP 6:5143, Table 5 (nss-SO₄, an 2000)
//   🚂 Industriel 1800  4,0e8  kg   même table, colonne « préindustriel »
//   ⛄ Plein Snowball   1,2e8  kg   fond naturel × part volcanique du soufre (dérivation sur sa fiche)
//   ⚫ Corps noir       0            pas d'atmosphère
//   🔥 Hadéen           0            ~2650 °C : rien ne condense
//   toutes les autres   4,0e8  kg   fond naturel préindustriel, FAUTE DE CONTRAINTE
//
// Le « faute de contrainte » est à prendre au mot, et c'est l'énoncé honnête : il n'existe pas de
// charge de sulfate atmosphérique publiée pour le Protérozoïque, le Paléozoïque, le Mésozoïque ni
// le Cénozoïque. Poser un chiffre différent par époque aurait été inventer. Ce qu'on sait, en
// revanche, c'est que le sulfate naturel vient de deux sources dont les ordres de grandeur n'ont
// pas de raison d'avoir changé d'un facteur 10 sur le Phanérozoïque :
//   volcanisme subaérien  23 ± 2 Tg SO₂/an = 11,5 Tg S/an  (Carn et al. 2017 Sci. Rep. 7:44095)
//   DMS marin             28,1 [17,6 ; 34,4] Tg S/an        (Lana et al. 2011 GBC 25:GB1004)
// La durée de vie du sulfate est de 4,12 j (Textor et al. 2006 ACP 6:1777, Table 10), donc la charge
// suit la source presque instantanément : pas de mémoire, pas d'accumulation possible.
//
// Vérification d'échelle, faite une fois : 179 Tg SO₄/an × 4,12 j / 365 = 2,02 Tg — c'est bien la
// charge de 1,99 Tg que Textor donne dans la même table. Source × durée de vie = charge, ✅.
//
// ⚠️ Événements ≠ fond. Un panache de LIP ou d'éruption dure des années, pas des dizaines de Ma :
// il n'a rien à faire dans une charge de fond moyennée sur une époque. Le voile sulfaté Franklin
// qui bascule le Sturtien est porté séparément par ⛄.🔺🍰⚽ = 0,05.
//
// Détail, dérivations et ce qui reste non contraint : doc/MASSES_SULFATE_PAR_EPOQUE.md
// ═══════════════════════════════════════════════════════════════════════════
const timeline = [
    {// Corps noir
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        // 🌡️🧮 : milieu grille CSV Corps_noir [-19,-17]°C → 255.15 K
        '🌡️🧮': 255.15,
        // 🥶 : valeurs Terre-moderne nominales — pas d'atmosphère donc ice_tf inactif sur le radiatif.
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.3,
        '🔋☀️': 2.663e26, // 🔒 Gough (1981) : L☉/(1+0.4×5.0/4.57) = 69.6% — NE PAS MODIFIER
        '🔋🌕': 0, // core_temperature (Pas de noyau en K)
        '🍰🧲🌕': 0.0, // geothermal_diffusion_factor (Facteur de diffusion du noyau vers la surface 0-1)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '📏🌊': 0.0, // Profondeur moyenne océans en km (valeur par défaut, pas d'eau pour cette époque)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
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
        // ⚖️✈ : 0 — pas d'atmosphère (⚖️🫧 = 0 sur cette fiche), donc pas d'aérosol. Ce n'est pas
        //   une valeur de littérature, c'est la définition du cas. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 0,
        '⚖️💨': 0, // n2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        // Événements interactifs : 🕰.order définit l’ordre des boutons (events.js) ; repli organigramme ACTION_BY_DATE si absent ailleurs.
        '🕰': {
            'order': ['☄️', '💫', '☄️', '💫', '🎇'],
            '☄️': {
                '🔺⚖️💧☄️': 3.2e17, // water_added_kg (~+10% d'albedo en ⚫ froid avec la formule actuelle)
                '🔺⏳': 100,
            },
            '💫': {
                '🔺🌡️💫': 0,
                '🔺⏳': 100,
            },
            '🎇': {
                '⏩': '🔥', // Transition vers Hadéen
                '🔺⏳': 100,
            },
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
        // 🌡️🧮 : milieu grille CSV Hadéen [2000,2500]°C → 2523.15 K.
        '🌡️🧮': 2823.15,
        // 🥶 : T_glob >> T_freeze, ice_tf=0 quoi qu'il en soit. Valeurs nominales modernes.
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
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
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        // [v1.4.82] T MOYENNE HADÉEN = GRANDEUR SANS SENS PHYSIQUE (ne pas revenir dessus) :
        //   surface = océan de magma, corps noir très brillant, rayonnement dominé par le flux géothermique (🧲🌕) ;
        //   une « T moyenne » de 2000–2500 °C dans la littérature n'est pas contraignante. Le bench la dépasse (~2650 °C)
        //   quand la composition suit la littérature : accepté, la T chute très vite ensuite par rayonnement (tics 💫).
        //   Priorité donnée à la COMPOSITION (grille CO₂ / H₂O vapeur), pas à la T.
        // [v1.4.82] CO₂ 5e17 (545 ppm) → 3.5e20 kg ≈ 70 bar ≈ 270 000 ppm mol (milieu grille [100k,500k]).
        //   Sleep, Zahnle & Neuhoff 2001 PNAS 98:3666 : 40–210 bar CO₂ après l'impact lunaire ; Zahnle et al. 2010 CSH Persp. Biol. 2:a004895.
        '⚖️🏭': 3.5e20, // co2_kg
        '⚖️🐄': 5.0e15, // ch4_kg (~1000 ppm)
        '⚖️💧': 6.0e20, // h2o_kg — [v1.4.82] 2.1e20 → 6e20 : vapeur 15 % mol (milieu grille [10,20]) ; avec 70 bar de CO₂ la vapeur
        //   tombait à 7 % (dilution). Atmosphère de vapeur post-impact ≈ un océan entier (Zahnle et al. 2010) ; ☄️ ajoute ensuite.
        '⚖️🫁': 0, // o2_kg
        // ⚖️✈ : 0 — le modèle sort cette époque à ~2650 °C. L'acide sulfurique ne condense pas :
        //   il n'y a ni gouttelette d'eau ni aérosol sulfaté à cette température. Le soufre est
        //   entièrement en phase gazeuse. Énoncé physique, pas une mesure. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 0,
        '⚖️💨': 5.29495e20,
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
        // Repère litt. Archéen : window.BENCH_LIT_BY_EPOCH_ID['🦠'] ci-dessous + bloc commentaire GRILLE dans ce fichier.
        //   T °C surface   : [5, 25]      — tempéré froid/modéré à ~4 Ga ; hypothèse chaude >30°C gardée R&D.
        //   CO₂ ppm          : [50000, 150000]
        //   CH₄ ppm          : [1000, 10000]
        //   H₂O vap. mol %   : [0.5, 3.0]
        //   Albédo effectif 🪩 : [0.20, 0.30] (colonne CSV « Albedo », pas une clé TIMELINE séparée)
        //
        // 🌡️🧮 : milieu mathématique de [5,25] °C → 15 °C → 288.15 K. Amorce solveur uniquement ; T convergée peut sortir de la plage.
        '🌡️🧮': 288.15,
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
        // ppm calculés par demo/epoch_bench_format.js (fmtConvAtmSnapshot) : ppm_molaire = mass_frac × (M_air / M_gaz) × 1e6.
        // Repère rapide pour ajuster les masses (N₂ ≈ 9.918e18 dominant) : CO₂ 150k mol ppm ⇒ ≈ 2.75e18 kg ; CO₂ 50k mol ppm ⇒ ≈ 0.80e18 kg ; CH₄ 10k mol ppm ⇒ ≈ 6.7e16 kg ; CH₄ 1k mol ppm ⇒ ≈ 6.5e15 kg.
        //
        // 🥶 Override per-époque ice physics (calculations_albedo.js v1.2.50).
        // Faint sun 74% à 4 Ga + obliquité ⚾=45° (Williams 1993 EPSL 117:377). Polar amp réduite :
        // gradient méridien Archéen probablement plus faible que Terre moderne (transport zonal
        // amplifié par circulation atmosphérique dense, océans peu profonds). Pas de continents
        // élevés (relief modéré) → moins d'effet hauteur sur T_pol.
        // dT_pol 20→10K, dT_mid 5→2K. Plus aggressif que Proté car faint sun plus dur.
        '🥶': { dT_pol: 10, dT_mid: 2, dT_trop: -5 },
        // ─── ESSAI MOYENNE DES FOURCHETTES (v1.4.40) ───────────────────────────
        // Valeurs au milieu des bornes 🔒 ci-dessous pour tester le banc sans extrêmes.
        // ─── v1.4.50 (2026-04-25) : CO₂ et CH₄ poussés au max CSV bench pour lutter contre faint sun 74% ───
        // Récupère ~+2 W/m² de forçage GES manquant vs branche froide. Pression N₂ inchangée (1.71 bar)
        // — si snowball persiste, prochaine étape : N₂ → 1.0e19 (2 bar, Som 2012 bornes hautes).
        '⚖️🏭': 2.6e18, // co2_kg — [v1.4.81] ~143k ppm (bench affichait 152k > max 150k). Était 2.75e18.
        '⚖️🐄': 6.3e16,  // ch4_kg — [v1.4.81] ~9 500 ppm (bench affichait 10 150 > max 10k). Était 6.7e16. CH₄/CO₂=0.024<0.1.
        '⚖️💧': 1.65e21, // h2o_kg hydrosphère — moyenne plage 🔒 [0.8e21, 2.5e21] ; vapeur atm reste dynamique.
        '⚖️🫁': 5.0e15, // o2_kg — moyenne plage traces pré-GOE [0, 1e16].
        '⚖️💨': 1.0e19, // n2_kg — max 🔒 [4.0e18, 1.0e19] = 2.2 atm (v1.4.76 ; était 7.0e18). Pressure broadening +GES.
        // ⚖️✈ : 4,0e8 kg = FOND NATUREL PRÉINDUSTRIEL, faute de contrainte propre à l'Archéen.
        //   ⚠️ NON CONTRAINT, et il faut le dire : aucune charge de sulfate atmosphérique archéenne
        //   n'est publiée. Deux effets de signe opposé, tous deux non quantifiés, encadrent la vraie
        //   valeur : (i) le dégazage volcanique était vraisemblablement plus fort (Terre plus chaude) ;
        //   (ii) l'atmosphère anoxique route une part importante du soufre vers l'aérosol S8 plutôt
        //   que vers le sulfate — c'est la condition même du fractionnement indépendant de la masse
        //   observé dans les sédiments (Farquhar et al. 2000 Science 289:756 ; Pavlov & Kasting 2002
        //   Astrobiology 2:27). Le fond préindustriel est donc un repère, pas une mesure.
        //   L'ancienne valeur, 5,0e14 kg, valait 500 000 × la charge moderne mesurée : elle ne venait
        //   d'aucune source. Cf. doc/MASSES_SULFATE_PAR_EPOQUE.md.
        '⚖️✈': 4.0e8,
        // 🔒 Bornes hystérésis Archéen — cf. schéma commentaire global "🔒 SCHÉMA BORNES HYSTÉRÉSIS" + CSV « Archéen » [50k,150k]ppm CO₂, [1k,10k]ppm CH₄.
        //    Refs : Sleep & Zahnle 2001 (CO₂ 0.2–10 bar), Haqq-Misra 2008 (CH₄ ≤10k ppm ; haze si CH₄/CO₂ > 0.1), Som 2012/2016 (N₂ paléo 0.7–2.2 atm), Marty 2013 (N₂ Archéen ≈1–2× PAL).
        '🔒': {
            '⚖️🏭': { min: 0.80e18, max: 2.75e18, cools: 'min' }, // CO₂ : CSV [50k,150k] mol ppm
            '⚖️🐄': { min: 6.5e15,  max: 6.7e16,  cools: 'min' }, // CH₄ : CSV [1k,10k] mol ppm
            '⚖️💨': { min: 4.0e18,  max: 1.0e19,  cools: 'min' }, // N₂  : 1× → 2.5× PAL (Som 2012)
            // sulfates : bornes = dispersion PUBLIÉE des charges préindustrielles entre modèles,
            //   0,10–0,58 Tg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5, colonne « previous works »).
            //   C'est la seule fourchette honnête ici : on ne sait pas, et cette plage dit de combien.
            '⚖️✈': { min: 1.0e8,   max: 5.8e8,   cools: 'max' },
            '⚖️🫁': { min: 0,       max: 1.0e16,  cools: 'min' }, // O₂ : pré-GOE (traces seulement)
            '⚖️💧': { min: 0.8e21,  max: 2.5e21,  cools: 'min' }, // H₂O hydrosphère : ~57% → ~179% PAL
        },
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
                '⚖️': { '⚖️💧': 1.3e21, '⚖️🏭': 4.7e16, '⚖️🐄': 2.85e14, '⚖️🫁': 0, '⚖️✈': 4.0e8, '⚖️💨': 5.138e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        },
        '🌱': 0.0, // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
        // 🧫 : 🦠 Archéen — océans anoxiques dominés par cyanobactéries procaryotes
        // (pas d'eucaryotes marins, DMSP producteurs quasi-absents). Knoll 2003, Falkowski 2004.
        // Tapis microbiens côtiers → flux DMS minimal (~5% moderne).
        '🧫': 0.05,
        // 🌊🏭 : v1.4.76 → 0 (était 0.05). Coupe le seed océan CO₂ Henry (⚖️🌊🏭 = co2OceanRatioRef × ⚖️🏭).
        // Le ratio 50 est MODERNE (océan tamponné pH 8, Sarmiento & Gruber 2006) ; à 0.19 bar pCO₂ archéen
        // l'océan est acide, DIC/pCO₂ ≪ 50 → le réservoir 50× (1.4e20 kg) est un puits fantôme qui aspire le
        // CO₂ atmosphérique dès que T baisse → amplificateur snowball. C-cycle archéen = tamponné carbonates
        // sédimentaires (Sleep & Zahnle 2001), pas DIC océan. Peu de continents → altération silicatée faible
        // (Lee et al. 2018, Nature 553:188). 0 = Urey/Henry éteints, comme l'assume calculations_flux.js (🦠 ⇒ ⚖️🌊🏭=0).
        '🌊🏭': 0
    },
    {// Protérozoïque
        '📅': '🪸', // Protérozoïque (multicellularité, eucaryotes, GOE)
        '▶': 2.5e9,
        '◀': 750e6,
        // 🌡️🧮 : graine branche chaude Protérozoïque (12.5°C) dans la plage [0,15]°C.
        // Le milieu strict 7.5°C accroche la branche snowball (albédo glace) et ne représente pas le point chaud stable.
        '🌡️🧮': 280.65,
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
        // 🥶 Override per-époque ice physics (calculations_albedo.js v1.2.50, _flux v1.2.93, _h2o v1.0.23).
        // Justification : faint sun 82% à 2.5 Ga + arrangement continental low-mid latitude
        // (Vaalbara, fragments cratoniques pré-Kenorland). Pas de calotte continentale polaire massive
        // — Williams 1993 EPSL 117:377 (gradient méridien Précambrien réduit possible).
        // dT_pol 20→10K : T_pol_proxy = T_glob - 10K (au lieu de -20K). À T_glob=12.5°C → T_pol=2.5°C.
        // dT_mid  5→3K : pareil pour mi-latitude.
        // Effet : tf_pol passe de 0.68 à 0.35 ; ice_tf de 0.20 à 0.15 ; Sabs gagne ~+10 W/m² uniquement Proté.
        '🥶': { dT_pol: 10, dT_mid: 3, dT_trop: -5 },
        // Lit. Proterozoic: CO2 10–200× actuel; paléosols ~2.2 Ga: 8000–9000 ppm. CH4 100–300 ppm.
        // v1.4.50 (2026-04-25): bump CO₂ 5e16→9.47e16 (6216→12000 ppm) et CH₄ 3e14→7.2e14 (102→250 ppm)
        // pour récupérer ~+13 W/m² de forçage GES manquant à 12.5°C (branche chaude).
        // Toujours dans CSV bench [5000,20000] CO₂ et [50,500] CH₄ (litt. paléosols + Wordsworth/Pierrehumbert 2013).
        '⚖️🏭': 9.47e16,  // co2_kg — 12000 ppm (était 5.0e16 = 6216 ppm)
        '⚖️🐄': 7.20e14,  // ch4_kg — 250 ppm (était 3.0e14 = 102 ppm)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🫁': 1.5e16,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5).
        //   Post-GOE l'atmosphère est oxydante : le SO₂ volcanique finit bien en sulfate, contrairement
        //   à l'Archéen. Aucune charge protérozoïque n'est publiée pour autant — faiblement contraint.
        //   L'ancienne valeur était 0, ce qui affirmait une absence de sulfate que rien ne soutient.
        '⚖️✈': 4.0e8,
        '⚖️💨': 5.0847e18,
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 590 },
            // v-2026-07-14 : bary ACTIVÉ. 🔀 sans ◀ → cible auto = racine de l'époque suivante (hyst 1a).
            // Rampe les masses ⚖️ le long de 2500→750 Ma : CO₂ 12000→53 ppm, CH₄ 250→7 ppm, O₂ 1.5e16→5e15, etc.
            // Avant : pas de 🔀 → masses figées (saut brutal à −750 Ma constaté en visu). Cf. moteur compute.js même date.
            '🔀': ['⚖️'],
        },
        // Ancien 🕰 (sans bary) : { '💫': { '🔺🌡️💫': 0, '🔺⏳': 590 } }
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
    // Ici 🌡️🧮 = amorce solveur au milieu de la branche chaude [5,15]°C, pas le seuil ni la T finale après chute.
    {//hysteresis 1a (entrée Sturtienne — bascule albédo↓)
        '📅': 'hysteresis 1a', // id stable (renommé v1.4.0 ; logo affichage ☃)
        hidden: true, // interne (non cliquable / non affiché dans la frise)
        '▶': 750e6,
        '◀': 720e6,
        // 🌡️🧮 : graine solveur hyst (id stable `hysteresis 1a` — ligne TIMELINE dédiée, hidden: true).
        // L’onglet / carte « Sturtienne » (🪸) est une autre entrée : modifier son 🌡️🧮 ne règle pas la graine du bouton hyst.
        // Ici 283.15 K = 10 °C (milieu CSV) ; T_conv après 1er bilan ≠ cette valeur (équilibre radiatif).
        // v-2026-09-15 : 283.15 K RESTAURÉ (fin de l'expérience -2 °C du 16/07). La « surfusion à -2 °C » était un
        // ARTEFACT : la masse de glace passait de 0.10 à 0.009 sous T_freeze (albédo ↓ en refroidissant, faux puits
        // pile à -2.00 °C) — corrigé albedo v1.2.64. Branche chaude 1a réelle ≈ 7 °C à 640 ppm (bench [5,15]).
        '🌡️🧮': 283.15,
        // 🥶 : aligné sur ⛄ (v1.4.75) — le cycle hystérésis 1a↔⛄ est la même planète, même gradient méridien.
        // L'ancien {dT_pol:10, dT_mid:3} (copié de 🪸) mettait le seuil d'engagement glace polaire à
        // T_glob ≈ 8 °C au lieu de ≈ 18 °C : depuis une baseline chaude ~17 °C, la rétroaction glace-albédo
        // restait éteinte (ice_eff=0.5 melt, tf_pol≈0.06) et le scan CO₂↓ ne pouvait jamais bifurquer.
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // même ordre que ⛄ (on garde la luminosité du Néoprotérozoïque)
        '🔋🌕': 8.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17 },
        // CO₂ pré-snowball branche chaude. 1.0e16 kg = 1280 ppm (conv. via ⚖️💨=5.125e18 kg, M_air/M_CO2=0.659).
        // Fourchette lit. pré-Sturtienne warm branch : 1000-3000 ppm (Hoffman & Schrag 2002 ; Bao et al. 2008 ; Hoffman 2017).
        // NB : le seuil de bifurcation snowball est bien plus bas (100-300 ppm GCM — Voigt 2010, Hörner 2022) ;
        // c'est la recherche hystérésis (scie_hysteresis_search.js) qui descend jusque-là, pas ce baseline.
        // v1.4.75 : 8.594e14 (106 ppm) restauré = 🔒 max, domaine nominal du BaryAdapter (le 4.801e14
        // résiduel R&D mettait x0=65 ppm SOUS le seuil littérature 100-300 ppm — introuvable en scan descendant).
        // Si le 1er pas part déjà en branche froide (FAILED "déjà sur branche") : monter vers 1.0e16 (1280 ppm,
        // littérature warm branch) ET baisser HYSTERESIS.scanFailRatio 0.1 → ~0.02 (plancher 26 ppm).
        // v-2026-07-14 : abaissé à 53 ppm pour la DÉMO BISTABILITÉ 1a↔⛄ au seuil.
        //   C*≈51,5 ppm mesuré par le scan (_logs/hyst.txt : 52,0 ppm→−0,55 °C chaud / 51,1 ppm→−61 °C snowball, 1 ppm d'écart).
        //   Init posé ~1,5 ppm au-dessus du seuil (converge propre, évite l'oscillation du saddle-node exact).
        //   ⛄ aligné sur la même valeur → même CO₂, deux branches sélectionnées par la graine 🌡️🧮.
        //   Anciennes valeurs (calcul hyst TRÈS sensible — ne pas perdre) : 8.594e+14 (106 ppm, =🔒max) ; 4.801e14 (65 ppm R&D).
        // v-2026-07-14b : le seuil warm de la visu dépend des AUTRES gaz (mesuré : le scan tenait warm à 52 ppm
        //   parce que la bary co-variait CH₄→35 ppm / O₂→1.5e16 ; à 7 ppm CH₄ la visu tombait en snowball à 53 ppm).
        //   → on aligne hyst 1a sur le vecteur warm du scan, mais CH₄ borné à 30 ppm (haut litt.) + CO₂ 52→55 ppm en compensation.
        // v-2026-09-15 : 5.2e15 kg ≈ 640 ppm (fourchette lit. pré-Sturtienne [500,2000], grille CSV).
        //   Carte Δ(T) (albedo v1.2.64, nuages 2 couches) : branche chaude ≈ 7 °C à 640 ppm (504→5.4, 800→8.0) ; test hyst
        //   CO₂ seul → bascule snowball à ≈ 92–93 ppm (Brunetti 2023 ESD 14:533 : 95±5 ppm à 700 Ma ; Feulner & Kienert 2014 :
        //   100–130 ppm ; AOGCM 20–700 ppm).
        //   Déclencheur visu = voile sulfate Franklin (−10 W/m², Macdonald & Wordsworth 2017 GRL 44:1938) posé par ⛄ :
        //   à 640 ppm il supprime la branche chaude (marge ≈ 2.5 W/m²) → snowball ; le voile retombé, ⛄ RESTE gelé au
        //   MÊME CO₂ = hystérésis. Anciennes valeurs : 8.1e14 (100 ppm, « surfusion » artefact) ; 4.451e14 (55).
        '⚖️🏭': 5.2e15,
        // CH₄ : Fourchette lit. Néoprotérozoïque 1-30 ppm (Kasting 2005 ; Olson 2016 ; Daines & Lenton 2016).
        //   v-2026-07-14b : 8.57e13 = 30 ppm (haut de fourchette, serre nécessaire pour tenir la branche chaude à ~55 ppm CO₂).
        '⚖️🐄': 8.57e13,//30 ppm  (ancien 2.0e13 = 7 ppm)
        // H₂O : océan Protérozoïque ≈ 1.2-1.4e21 kg (Pope et al. 2012). Inchangé.
        '⚖️💧': 1.2e21,
        // O₂ : v-2026-07-14b 1.5e16 (aligné vecteur warm scan = serre/nuages suppl. ; 1.3 % PAL, borne haute Sturtien).
        //   (Lyons et al. 2014 ; Planavsky et al. 2014 ; Sperling 2015). Ancien : 5.0e15 (0.4 % PAL).
        '⚖️🫁': 1.5e16,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5).
        //   La part réellement vue par la loi sulfate → CCN dépend de 🧫 (calculations_albedo v1.2.65) :
        //   ici 🧫 = 0,05 (plancton dilué, pré-glaciation) → 4,0e8 × (0,29 + 0,71 × 0,05) = 1,30e8 kg.
        //   ⚠️ Le voile sulfaté de la LIP Franklin n'est PAS ici : il est porté séparément par
        //   ⛄.🔺🍰⚽ = 0,05 (Macdonald & Wordsworth 2017). Pas de double comptage.
        '⚖️✈': 4.0e8,
        '⚖️💨': 5.133e18,//N₂ (v-2026-07-14b aligné vecteur scan ; ancien 5.142979e18)
        // 1a = branche CHAUDE pré-Sturtienne (≈ 7 °C). Le bouton volcan 🗻 est un DÉCLENCHEUR ERGONOMIQUE : son tooltip (desc du logo,
        // "Volcan — voile atmosphérique") annonce à l'utilisateur que le voile arrive, et le clic fait avancer la
        // frise vers ⛄ (Plein Snowball) où le voile s'applique RÉELLEMENT (clé racine 🔺🍰⚽=0.05 de ⛄, v-2026-09-15).
        // ⚠️ Choix ASSUMÉ, pas cohérent en interne : le voile n'est PAS dans ce bouton (pas de 🔺🍰⚽ ici), il est
        // dans la config de ⛄. C'est voulu pour la lisibilité utilisateur (« je clique le volcan → snowball »).
        // v-2026-07-16.
        '🕰': {
            'order': ['🗻'],
            '🗻': { '🔺⏳': 30 },
        },
        '🌱': 0.0,
        // 🧫 : ☃ Entrée Sturtienne (750 Ma) — pré-glaciation, plancton marin dilué,
        // faibles émissions DMS (même ordre que ⛄). ~5% moderne.
        '🧫': 0.05,
        // 🌊🏭 : pompe Urey ACCÉLÉRÉE. Rodinia break-up (800-720 Ma) expose de vastes surfaces
        // continentales tropicales aux intempéries (Godderis et al. 2003, Donnadieu et al. 2004 Nature).
        // Franklin LIP (717 Ma) : basaltes frais très altérables (Macdonald 2010 Science 327:1241).
        // Pierrehumbert 2004 "deglaciation problem" : drawdown CO₂ × 3-5 vs moderne.
        '🌊🏭': 0.5,
        // 🔒 Segment contractuel hyst 1a ↔ fiche ⛄ (scie_hysteresis_bary v1.0.0) : min = extrémité froide
        // (⛄ 524–560), max = branche chaude 1a (lignes ci-dessus). createBaryAdapter uniquement si 🔒.⚖️🏭.
        // Sans ce bloc, seul CO₂ varie au scan/dicho — CH₄ etc. restent en baseline 1a, ce qui mélange états
        // incompatibles près du seuil (T saute ±60 °C à ⚖️🏭 presque identique).
        '🔒': {
            // NB v-2026-07-14 : init ⚖️🏭 abaissé à 4.289e14 (53 ppm) < min de ce segment.
            // Segment 🔒 volontairement NON re-centré : bornes = littérature. La concentration
            // effective au seuil se module par les autres gaz (O₂…), pas en baissant ces bornes.
            // Le scan n'est pas clampé par 🔒 (il extrapole), donc pas de blocage — juste à savoir.
            '⚖️🏭': { min: 7.923e+14, max: 8.594e+14, cools: 'min' },
            '⚖️🐄': { min: 1.0e+14, max: 2.0e+13, cools: 'min' },
            '⚖️💨': { min: 5.132968982e18, max: 5.142979e18, cools: 'min' },
            '⚖️🫁': { min: 1.5e+16, max: 5.0e+15, cools: 'min' },
            '⚖️💧': { min: 1.2e+21, max: 1.2e+21, cools: 'min' },
            // sulfates : segment DÉGÉNÉRÉ depuis v1.4.90 — 1a et ⛄ portent la même charge de fond,
            //   4,0e8 kg. Ce qui les sépare n'est plus la masse mais 🧫 (1a = 0,05 aussi… voir NB),
            //   appliqué dans calculations_albedo.js. min = max : la bary n'a plus rien à interpoler
            //   ici, et c'est l'énoncé correct — il n'y a pas d'incertitude de masse sur ce segment.
            '⚖️✈': { min: 4.0e+8, max: 4.0e+8, cools: 'min' }
        }
    },
    // ⛄ = Plein Snowball (720–690 Ma) : glaciation globale Néoprotérozoïque (Sturtien ~717 Ma)
    // Réfs : Hoffman et al. 1998 (Science), Pierrehumbert 2011, Hoffman & Schrag 2002
    // v1.4.61 : 🌡️🧮 + ⚖️🏭 = pas dicho **chaud** hyst1a (ex. ligne journal 📿=4, phase=dicho, T_conv≈−2,9 °C,
    // 4,621e14 kg) : c’est l’amorce qui sert à voir la bifurcation, pas l’attractif à −60 °C (📿=8) ni 210 K.
    // v1.4.60 (210 K + 4,58e14) = erreur sémantique. Masses d’appoint : [REPRO] @ ce pas (SYNC bouton ⛄).
    // Remplacement entrée TIMELINE Plein Snowball (⛄) — généré depuis l’état courant (DATA).
// Époque active (📜.🗿) au moment de l’export : hysteresis 1a.
// Coller dans API_BILAN/config/configTimeline.js : remplacer l'objet entier { '📅': '⛄', … } par ce bloc, puis recharger.

{//"⛄"
    "📅": "⛄",
    // Voile : racine 🔺🍰⚽ = impulsion à 📿💫===0 (compute) ; 🕰.💫.🍰⚽ = valeur 📜🔺🍰⚽ après chaque clic 💫 (events).
    // v-2026-09-15 : voile sulfate Franklin LIP (Macdonald & Wordsworth 2017 GRL 44:1938 : −10 à −12 W/m² pour
    // 500 Mt SO₂/an, suffisant à 3000 ppm) : 0.05 d’obstruction SW ≈ −10 W/m² sur la branche chaude. À 640 ppm il
    // supprime toute racine chaude (Δmax ≈ −2.5 W/m²) → bascule ; retiré au 1er 💫 (🕰.💫.🍰⚽=0) → ⛄ reste gelé = hystérésis. (ex-0.02)
    "🔺🍰⚽": 0.05,
    "▶": 72e7,
    "◀": 69e7,
    // v-2026-09-15 : graine = état snowball (−55 °C, bench [−60,−50]). Clic direct ⛄ → part de la bonne T° et vérifie
    // la stabilité ; en animation (après 🗻) la T° présente est gardée. (ex-270.0 = −3 °C)
    "🌡️🧮": 218.15,
    "🥶": { "dT_pol": 20, "dT_mid": 5, "dT_trop": -5 },
    "🧲🔬": 0.01,
    "🔋☀️": 3.592e26,
    "🔋🌕": 8e13,
    "📐": 6371,
    "🍎": 9.81,
    "📏🌊": 3.6,
    "🐚": 1,
    "🗻": {
        "🍰🗻🌊": 0.75,
        "🍰🗻🏔": 0.08,
        "🍰🗻🌍": 0.17
    },
    "⚖️🏭": 5.2e15,// ≈640 ppm — v-2026-09-15 : MÊME CO₂ que hyst 1a (lit. snowball [300,1500]) : même planète, deux états (chaud 1a ≈ 7 °C / gelé ⛄ ≈ −55 °C). Anciens : 8.1e14 (100), 4.451e14 (55).
    "⚖️🐄": 2.86e13,// 10 ppm — v-2026-09-15 : lit. snowball CH₄ [0.1,10] ppm (grille CSV). Ancien 8.57e13 (30 ppm, hors fourchette)
    "⚖️💧": 1.2e21,
    "⚖️🫁": 15000000000000000,
    // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ (Tsigaridis et al. 2006 ACP 6:5143, Table 5),
    //   comme toutes les époques sans contrainte propre. La banquise globale coupe la source DMS —
    //   mais ce n'est plus écrit ici : la dérivation est passée dans calculations_albedo.js v1.2.65,
    //   où 🧫 (= 0,05 pour ⛄) module la part DMS du soufre avec le partage mesuré volcanique/DMS
    //   0,29/0,71 (Carn et al. 2017 Sci. Rep. 7:44095 + Lana et al. 2011 GBC 25:GB1004).
    //   Masse effective vue par la loi sulfate → CCN : 4,0e8 × (0,29 + 0,71 × 0,05) = 1,30e8 kg.
    //   Elle y vaut pour les 19 époques au lieu d'être codée en dur sur celle-ci.
    //   ⚠️ Le voile Franklin qui déclenche la bascule reste ailleurs : 🔺🍰⚽ = 0,05, ci-dessus.
    "⚖️✈": 400000000,
    "⚖️💨": 5132968982000000000,
    "🔒": {
        "⚖️🏭": {
            "min": 792300000000000,
            "max": 859400000000000,
            "cools": "min"
        },
        "⚖️🐄": {
            "min": 100000000000000,
            "max": 20000000000000,
            "cools": "min"
        },
        "⚖️💨": {
            "min": 5132968982000000000,
            "max": 5142979000000000000,
            "cools": "min"
        },
        "⚖️🫁": {
            "min": 15000000000000000,
            "max": 5000000000000000,
            "cools": "min"
        },
        "⚖️💧": {
            "min": 1.2e+21,
            "max": 1.2e+21,
            "cools": "min"
        },
        "⚖️✈": {
            "min": 400000000,
            "max": 400000000,
            "cools": "min"
        }
    },
    // v-2026-09-15 : 💫 (+10 Ma) = le voile retombe (🍰⚽=0), la planète reste gelée au même CO₂ (hystérésis visible) ;
    // puis 🌋 (+20 Ma) = volcanisme/poussière de sortie → époque suivante hysteresis 1b (CO₂ + glace sale dans SA config).
    "🕰": {
        "order": ["💫", "🌋"],
        "💫": {
            "🔺🌡️💫": 0,
            "🔺⏳": 10,
            "🍰⚽": 0
        },
        "🌋": { "🔺⏳": 20 }
    },
    "🌱": 0,
    "🧫": 0.05,
    "🌊🏭": 0.5
},
    // hysteresis 1b = Sortie Marinoen (690–600 Ma) : déglaciation brutale, hyper-greenhouse, pluies acides.
    // Branche chaude post-Snowball, le scan hystérésis cherche le seuil de sortie (CO₂↑ → saut T).
    {//hysteresis 1b (sortie Marinoen — hyst ↑)
        '📅': 'hysteresis 1b', // id stable (logo affichage ⛈)
        hidden: true,
        '▶': 690e6,
        '◀': 600e6,
        '🌡️🧮': 308.15, // Sortie Marinoen [20,50]°C — milieu bench
        // 🥶 : sortie marinoenne, atm CO₂ dense post-snowball, gradient méridien intermédiaire (transition).
        '🥶': { dT_pol: 15, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.620e26, // Gough @ 0.69 Ga
        '🔋🌕': 7.5e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.10, '🍰🗻🌍': 0.15 },
        // Hyper-greenhouse post-Marinoen : CO₂ très élevé = cause de la déglaciation (déstabilise la branche froide).
        // v1.4.77 : 7.0e17 kg ≈ 80 000 ppm mol (0.08 bar) — cœur fourchette sortie Marinoen 0.01–0.12 bar
        // (Pierrehumbert 2004, Hoffman 2017). Était 2.75e16 (3500 ppm) : incohérent avec ce commentaire + trop
        // bas pour déglacer (anim restait à −57 °C) et ne tenait même pas la branche chaude au bench.
        // v-2026-09-15 : 8.2e16 kg ≈ 9 900 ppm (0.01 bar, haut de la grille CSV Sortie Marinoen [2000,10000]).
        //   Sortie par glace SALE (clé 🌫️❄️ ci-dessous) : Abbot & Pierrehumbert 2010 (JGR 115:D03104) / Abbot & Halevy
        //   2010 → la poussière abaisse le CO₂ de déglaciation à 0.01–0.1 bar. Carte Δ(T) : à α_glace 0.48 la branche
        //   froide disparaît entre ~4 800 et ~9 300 ppm ; à 10 000 ppm seule la branche chaude existe (≈ 30 °C, bench
        //   [20,50]). Sans poussière la branche froide tient jusqu'à >14 % (GCM : >0.1–0.2 bar, Hu 2011). Anciens :
        //   1.31e18 (15 %, zone d'artefact d'inversion OLR >16 %), 7.0e17 (8 %).
        '⚖️🏭': 8.2e16,
        // 🌫️❄️ = albédo de la glace sale (poussière concentrée par sublimation, snowball établi). Lu par calculations_albedo.js
        //   (v1.2.64) pour 🪩🍰❄️ et 🪩🍰🧊 ; époques sans clé = glace propre. Plage mudball ~0.4–0.5.
        '🌫️❄️': 0.48,
        // ⚖️🏭🔺 = facteur de départ du scan hystérésis (<1 en scan positif) : 0.25 → ~2 500 ppm, sur la branche froide
        //   sale (≈ −9 °C) ; le scan CO₂↑ croise la sortie vers ~0.5–0.9 % puis dicho.
        '⚖️🏭🔺': 0.25,
        // ⚖️🏭🔝 = plafond du scan CO₂ hystérésis (kg). v-2026-07-16. C'est le régime de déglaciation 1b
        // (poussière volcanique) qui impose ce plafond, PAS un cas particulier codé dans le scan. Au-delà de
        // ~16 % CO₂ (~1.31e18 kg) l'OLR du modèle s'INVERSE (ajouter du CO₂ refroidit — artefact CO₂-gaz-majeur,
        // cf. probeOLRvsCO2AtFixedT) : le scan positif y plongeait et se sabotait (« FAILED » ~51 % = pas
        // physique). On plafonne au MINIMUM d'OLR ; le levier CO₂ y est de toute façon épuisé, la fin de la
        // déglaciation Marinoen passe par l'albédo (mudball). Le scan lit ce champ génériquement (clampX).
        '⚖️🏭🔝': 1.31e18,
        '⚖️🐄': 4.5e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e16,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 5.107454e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 90 },
        },
        '🌱': 0.0,
        // 🧫 : ⛈ Sortie Marinoen (690→600 Ma) — dégel post-snowball, hyper-greenhouse,
        // recolonisation marine progressive. Retour modéré du plancton. ~10% moderne.
        '🧫': 0.1,
        // 🌊🏭 : v1.4.77 → 0 (était 2.0). La pompe Urey/cap-carbonates est un drawdown POST-déglaciation ;
        // active pendant la tentative de fonte (T froide → Henry ↑ → CO₂ atm→océan) elle aspire le CO₂ censé
        // CAUSER la fonte = à l'envers, empêche la déglaciation en anim. Coupée pour laisser 1b déglacer.
        // Le vrai drawdown cap-carbonates (80 k → ~1 k ppm sur ~10 Ma ; Higgins & Schrag 2003, Hoffman 2017)
        // = raffinement ultérieur : réactiver la pompe seulement APRÈS déglaciation (gate T>0 ou nb de tics).
        '🌊🏭': 0
    },
    // Paléozoïque scindé (v1.4.0) : 🪼 marin 600→420 + 🍄 terrestre 420→280 + 💀 P/T 280→250.
    // Ordre chronologique : … Protérozoïque → ☃/⛄/⛈ Snowball → 🪼 → 🍄 → 💀 → Mésozoïque …
    {// Paléozoïque marin 🪼
        '📅': '🪼', // Paléozoïque marin (600–420 Ma) — explosion cambrienne, Hirnantienne
        '▶': 600e6,
        '◀': 420e6,
        // 🌡️🧮 : milieu grille CSV Paléozoïque marin [15,25]°C → 293.15 K.
        '🌡️🧮': 293.15,
        // 🥶 : Cambrien/Hirnantien, continents éparpillés en cours de regroupement (Gondwana en formation).
        // Gradient méridien légèrement inférieur à la Terre moderne (Scotese 2021 paleotemperature).
        '🥶': { dT_pol: 18, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.638e26, // Gough @ 0.6 Ga
        '🔋🌕': 6.5e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.78, '🍰🗻🏔': 0.06, '🍰🗻🌍': 0.16 },
        '⚖️🏭': 1.38e16, // co2_kg — léger − (bench 🪼)
        '⚖️🐄': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 1.5e17,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.986169e18,
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
        // 🌡️🧮 : milieu grille CSV Paléozoïque terrestre [15,25]°C → 293.15 K.
        '🌡️🧮': 305.65,
        // 🥶 : forêts Dévonien/Carbonifère + glaciation Karoo (Pangée). Gradient méridien fort (proche moderne).
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.686e26, // Gough @ 0.42 Ga
        '🔋🌕': 6.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.07, '🍰🗻🌍': 0.18 },
        '⚖️🏭': 0.74e16, // co2_kg — léger − (bench 🍄)
        '⚖️🐄': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 2.0e17,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.942569e18,
        // 4 clics de 35 Ma : 420 → 385 → 350 → 315 → 280 Ma. Le pas de 140 Ma (un seul clic) sautait
        // directement du Silurien à la racine du Permien : le CO₂ MONTAIT (909 → 1830 ppm, +7 °C) et la
        // glaciation du Karoo — le fait climatique majeur de l'époque — n'existait pas dans le modèle.
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 35 },
            // 🔁 États imposés par tic (index = 📿💫 − 1 ; au-delà, dernier état maintenu), même mécanisme que 🦣.
            // Le drawdown du Dévonien-Carbonifère : racines profondes → altération des silicates, puis
            // enfouissement massif du carbone organique (le charbon). Réfs : Berner & Kothavala 2001
            // (GEOCARB III, Am J Sci 301:182) ; Algeo & Scheckler 1998 (GSA Today 8:1) ; Montañez et al. 2007
            // (Science 315:87 — CO₂ 180–300 ppm au cœur de la LPIA) ; Foster et al. 2017 (Nat Commun 8:14845).
            // CH₄ : monde à O₂ élevé (Carbonifère ~30 %), le méthane s'oxyde vite → ordre du ppm, pas de la dizaine.
            // ⚠️ Le modèle est ici tout près d'une bifurcation glace-albédo : à ~280 ppm, CH₄ 1,8 ppm donne 17 °C
            //    (branche chaude) et 1,6 ppm donne 6 °C (branche froide) ; 1,0 ppm partirait en snowball.
            //    Ne pas retoucher le ⚖️🐄 du 3ᵉ état sans relancer le banc.
            '🔁': [
                { '⚖️🏭': 4.884e15, '⚖️🐄': 1.187e13 },  // −385 Ma : ~600 ppm / 4 ppm — les forêts s'installent
                { '⚖️🏭': 2.849e15, '⚖️🐄': 7.417e12 },  // −350 Ma : ~350 ppm / 2,5 ppm — le carbone s'enfouit
                { '⚖️🏭': 2.279e15, '⚖️🐄': 4.747e12 }   // −315 Ma : ~280 ppm / 1,6 ppm — KAROO (LPIA), glace ~28 %
            ],
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
        // 🌡️🧮 : milieu grille CSV Limite P/T [21,32]°C → 299.65 K.
        '🌡️🧮': 292.65,
        // 🥶 : hyperthermie P/T (Trapps sibériens, anoxie). Gradient méridien réduit par CO₂ massif.
        // Joachimski 2012 : SST tropicales 36°C+ + polaires plus chaudes que Karoo → dT_pol modéré.
        '🥶': { dT_pol: 18, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.720e26, // Gough @ 0.28 Ga
        '🔋🌕': 6.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.72, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.20 },
        '⚖️🏭': 1.5e16, // co2_kg (~2900 ppm, pic PT)
        '⚖️🐄': 8e13,   // CH4 élevé (anoxie, clathrates)
        '⚖️💧': 1.35e21,
        '⚖️🫁': 1.5e17, // O2 en chute (anoxie)
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — MALGRÉ les Trapps sibériens.
        //   Un panache sulfaté de LIP a une durée de vie de quelques années ; cette fiche couvre
        //   280→250 Ma. Moyenner un pic décennal sur 30 Ma redonne le fond, à la précision près.
        //   Le refroidissement volcanique, s'il doit apparaître, est un ÉVÉNEMENT (comme ⛄.🔺🍰⚽),
        //   pas une charge de fond. Voir l'encadré « MASSES DE SULFATE » en tête de fichier.
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.984919e18,
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
        // 🌡️🧮 : milieu grille CSV Mésozoïque [21,31]°C → 299.15 K.
        '🌡️🧮': 301.15,
        // 🥶 : serre chaude Crétacé (Hudson 2010, Huber & Caballero 2011), polar T très chaud
        // → "equability problem" Pierrehumbert : gradient méridien fortement réduit. dT_pol=15K.
        '🥶': { dT_pol: 15, dT_mid: 4, dT_trop: -5 },
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
        '⚖️🏭': 1.2875e16, // co2_kg (~2500 ppm)
        '⚖️🐄': 4.12e13,
        '⚖️💧': 1.33e21,
        '⚖️🫁': 0,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 5.1370828e18,
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
        '🌡️🧮': 301.65,
        // 🥶 : Paléocène/début Éocène, post K-Pg, plus chaud que moderne, gradient méridien réduit.
        '🥶': { dT_pol: 18, dT_mid: 5, dT_trop: -5 },
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
        '⚖️🏭': 5.0e15, // co2_kg (~650 ppm)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.063495395e18,
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
        '🌡️🧮': 306.65,
        // 🥶 : PETM Éocène, pic thermique, gradient méridien faible (Sluijs 2008, polaires 17°C+ été).
        '🥶': { dT_pol: 16, dT_mid: 4, dT_trop: -5 },
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
        // [v1.4.81] vers 24 °C (milieu T [20,28], bench 20,9 °C) sans sortir de la grille : CH₄ 1,24 → ~3,8 ppm ([1,5]),
        //   CO₂ 1182 → ~1380 ppm ([800,1500]) ; sonde : 22 °C environ au mieux sans sortir de la grille. Anagnostou et al. 2016 Nature 533:380 (CO₂ Éocène précoce ~1000–1600 ppm) ;
        //   Beerling et al. 2011 PNAS 108:9770 (CH₄ Éocène élevé, zones humides).
        '⚖️🏭': 1.1e16, // co2_kg
        '⚖️🐄': 1.1e13, // ~3,8 ppm
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.059095395e18,
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
        '🌡️🧮': 299.65,
        // 🥶 : transition Eocène/Oligocène (Oi-1), bascule calotte Antarctique, gradient en cours de renforcement.
        '🥶': { dT_pol: 18, dT_mid: 5, dT_trop: -5 },
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
        '⚖️🏭': 5.15e15, // co2_kg (~1000 ppm, avant chute Oi-1)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 4.063345395e18,
        '🕰': {
            '⛰': { '🔺🌡️💫': 0, '🔺⏳': 2 },
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
        '🌡️🧮': 296.15, // milieu grille Oligocène/Grande_Coupure [12,18]°C (🏔 ≈ refroidissement Cénozoïque)
        // Rampe voile SW : début = 🔺🍰⚽ racine, fin = 🕰.◀.📜 (0) ; baryFromDate → ~17 Ma ≈ mi-parcours 33→2 Ma.
        '🔺🍰⚽': 0.00196,
        // 🥶 : refroidissement Cénozoïque, calotte Antarctique consolidée, gradient méridien moderne.
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.05,
        '🔋☀️': 3.817e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.033/4.57) = 99.7% — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.16, '🍰🗻🌍': 0.15 },
        '⚖️🏭': 4.513e15,
        '⚖️🐄': 4.3e12, // [v1.4.81] 0,92 ppm → ~1,5 ppm (milieu grille [1,2])
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.08e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 16 },
            // Interpolation 🔀 en fonction de la date courante 📜📅 (pas du seul compte de tics) — 33 Ma → 2 Ma.
            'baryFromDate': true,
            '🔀': ['📅', '📜'],
            '◀': {
                '📅': { '🌡️🧮': 286.15 },
                '📜': { '🔺🍰⚽': 0 },
            },
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
        '🌡️🧮': 287.65,
        // 🥶 : Quaternaire glaciations, gradient méridien moderne (calottes nord+sud).
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.04,
        '🔋☀️': 3.827e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.002/4.57) — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.11, '🍰🗻🌍': 0.19 },
        //'🗻': { '🍰🗻🌊': 0.66, '🍰🗻🏔': 0.19, '🍰🗻🌍': 0.15 },
        // [v1.4.81] CO₂/CH₄ glaciaires-interglaciaires (étaient des valeurs modernes 410 ppm / 1,27 ppm, hors grille).
        //   Grille : CO₂ [180,300] ppm, CH₄ [0,4 ; 0,8] ppm — Lüthi et al. 2008 Nature 453:379 (EPICA Dome C 800 ka),
        //   Loulergue et al. 2008 Nature 453:383 (CH₄ 350–800 ppb).
        //   Sonde : au milieu de grille (240 ppm / 0,6 ppm) T = 8,4 °C < 10 → valeurs HAUTES de grille, seules dans [10,16] °C.
        //   ⚠️ INSTABILITÉ (hystérésis glace-albédo) : CH₄ 0,78 ppm (2.20e12) → 9,5 °C ; 0,80 ppm (2.25e12) → 12,1 °C.
        //   Deux états possibles pour la même composition : le modèle est ici sur un seuil. En animation (T héritée de 🏔),
        //   convergence lente vers 12,2 °C (branche chaude) — la bascule n'a pas lieu mais reste possible.
        //   Cohérent avec le Pléistocène : cycles glaciaires 41 ka puis 100 ka (Lisiecki & Raymo 2005 Paleoceanography 20:PA1003),
        //   CO₂ oscillant 180–280 ppm (Lüthi et al. 2008). À signaler en présentation : le seuil glaciaire est « visible » dans le modèle.
        '⚖️🏭': 2.31e15, // ~298 ppm
        '⚖️🐄': 2.25e12, // ~0,80 ppm
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 3.97e18,
        '🕰': {
            // 4 clics de 0,5 Ma : −2 Ma (racine, interglaciaire) → glaciaire → interglaciaire → glaciaire → 🛖 Holocène.
            // Un clic = un DEMI-cycle représentatif, pas un cycle réel de 41 ka (2 Ma en tics de 41 ka = 49 clics).
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.5 },
            // 🔁 CYCLES : états successifs appliqués par tic (index = 📿💫 − 1 ; au-delà, dernier état maintenu).
            // Mécanisme générique (compute.js getEpochDateConfig) : '⚾' = obliquité ε courante (→ 📜⚾),
            // clés '⚖️*' = masses imposées pour l'état (→ 📜🔁⚖️, lues par getMasses). AUCUN texte ici :
            // le récit de chaque état vit dans CO2/static/texts/epochs_alt2sec.js (EVENT_STORY['🦣']['💫'], par index).
            // Valeurs : carottes EPICA (Lüthi 2008 : CO₂ 180–300 ppm ; Loulergue 2008 : CH₄ 350–800 ppb) ;
            // obliquité 22,1°–24,5° sur 41 ka (Laskar et al. 2004) — ε pilote, CO₂ et CH₄ amplifient.
            '🔁': [
                { '⚾': 22.1, '⚖️🏭': 1.47e15, '⚖️🐄': 1.2e12 },   // glaciaire  (~190 ppm / 0,43 ppm)
                { '⚾': 24.5, '⚖️🏭': 2.17e15, '⚖️🐄': 1.97e12 },  // interglaciaire (~280 ppm / 0,70 ppm)
                { '⚾': 22.1, '⚖️🏭': 1.47e15, '⚖️🐄': 1.2e12 }    // glaciaire (dernière avant l'Holocène)
            ],
            // 🖼 SUITE D'IMAGES imposée (sinon : texture déduite de la date). Parcourue par le compteur de tics,
            // en boucle (index = 📿💫 modulo longueur) : 2 images = alternance, 3 = cycle de 3, etc.
            // Ici l'alternance interglaciaire ↔ glaciaire : deux dates identiques peuvent correspondre à deux états
            // stables, la date seule ne peut donc pas choisir l'image.
            '🖼': ['fonds/-00001Ma.png', 'fonds/-00002Ma.png'],
            // Interpolation linéaire 🌡️🧮 (graine solveur) du début 🦣 (2 Ma) vers la borne ◀ de frise (10 ka ; même graine K que 🛖).
            '🔀': ['📅'],
            '◀': {
                '📅': { '🌡️🧮': 287.15 },
            },
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
        '▶': -10000,
        '◀': 1800,
        // 🌡️🧮 : milieu grille CSV Holocène [13,15]°C → 287.15 K.
        '🌡️🧮': 287.15,
        // 🥶 : Holocène, valeurs Terre-moderne (référence calibration ERA5/Peixoto&Oort 1992).
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.03,
        '🔋☀️': 3.828e26, // 🔒 Gough (1981) : L☉/(1+0.4×0/4.57) ≈ 100% — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        //'🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        //'🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.13, '🍰🗻🌍': 0.17 },
        '🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.14, '🍰🗻🌍': 0.17 },
        '⚖️🏭': 2.191e15, // ~280 ppm CO2 pré-industriel (Marcott 2013)
        '⚖️🐄': 2.28e12,  // ~800 ppb CH4 pré-industriel
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.18e18,
        // ⚖️✈ : fond naturel préindustriel, 4,0e8 kg SO₄ — aucune contrainte propre à cette
        //   époque n'existe (voir l'encadré « MASSES DE SULFATE » en tête de fichier).
        '⚖️✈': 4.0e8,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.004 }, // 4 ka/tic : −10000 → −6000 → −2000 → fin (1800, borné) → 🚂
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
        '🌡️🧮': 286.65,
        // 🥶 : Industrielle, valeurs Terre-moderne.
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
        '🧲🔬': 0.01,
        '🔋☀️': 3.828e26,
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.70, '🍰🗻🏔': 0.13, '🍰🗻🌍': 0.17 },
        //'🗻': { '🍰🗻🌊': 0.69, '🍰🗻🏔': 0.16, '🍰🗻🌍': 0.15 },
        '⚖️🏭': 2.191e15, // ~280 ppm 1800 (IPCC2021)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        // ⚖️✈ : 4,0e8 kg SO₄ = charge PRÉINDUSTRIELLE simulée (Tsigaridis et al. 2006 ACP 6:5143,
        //   Table 5 : nss-sulfate 0,40 Tg ; dispersion inter-modèles publiée 0,10–0,58 Tg).
        //   Leur « préindustriel » utilise les émissions anthropiques EDGAR-HYDE de 1860 ; cette
        //   fiche est datée 1800, où l'anthropique était encore plus faible — l'écart est très
        //   inférieur à la dispersion inter-modèles. Le sulfate industriel n'arrive qu'après 1850.
        '⚖️✈': 4.0e8,
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
        // 🌡️🧮 : milieu grille CSV Aujourd'hui [14.5,15.5]°C → 288.15 K.
        '🌡️🧮': 287.55,
        // 🥶 : Aujourd'hui, valeurs Terre-moderne (calibration target 15°C).
        '🥶': { dT_pol: 20, dT_mid: 5, dT_trop: -5 },
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
        // Simulation parameters - Quantités en kg
        // ⚠️ 369 ppm = fraction molaire d'air SEC (NOAA). Le modèle affiche de l'air HUMIDE (365 ppm) :
        //    ppm_sec = ppm_humide / (1 − x_H2O). Détail et vérif : atmosphere/calculations_atm.js,
        //    bloc « AIR SEC vs AIR HUMIDE ». Cette masse est juste — ne pas la retoucher pour recoller à 369.
        '⚖️🏭': 2.887e15, // ~369 ppm CO2 an 2000 [OBS] NOAA (air sec)
        '⚖️🐄': 4.99e12, // ~1750 ppb CH4 an 2000 [OBS] NOAA
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.18e18, // O2 ~23% masse air sec
        // ⚖️✈ : 1,05e9 kg SO₄ = charge atmosphérique MESURÉE/simulée d'aujourd'hui.
        //   Tsigaridis et al. 2006 ACP 6:5143, Table 5 : nss-sulfate 1,05 Tg (émissions an 2000),
        //   contre 0,40 Tg en préindustriel → rapport 2,6, énoncé tel quel dans leur texte.
        //   Recoupement indépendant : Textor et al. 2006 ACP 6:1777, Table 10 — 16 modèles AeroCom,
        //   charge SO₄ 1,99 Tg (δ=25 %), source 179 Tg SO₄/an, durée de vie 4,12 j ; leur chiffre
        //   inclut le sulfate porté par le sel de mer, que Tsigaridis exclut (nss). Et Schulz et al.
        //   2006 ACP 6:5225, Table 2 : la part anthropique vaut 55 % de l'épaisseur optique sulfatée
        //   actuelle, soit un rapport actuel/préindustriel de 2,2 — même ordre.
        //   ⚠️ L'ancienne valeur, 8,0e13 kg, était un « proxy CCN » sans dimension physique : 76 000 ×
        //   la charge réelle, et surtout un rapport 📱/🚂 de 53 quand la mesure donne 2,6.
        '⚖️✈': 1.05e9,
        '⚖️💨': 3.97e18, // n2_kg (~78% de l'atmosphère moderne, calculé comme reste pour atteindre 5.15e18)
        // 🔒 Bornes hystérésis Aujourd'hui — pré-industriel → RCP8.5 extreme.
        //    Refs : NOAA/GISS (CO₂ 2000 ≈369 ppm, 280 ppm pré-industriel), IPCC AR6 WG1 SSP5-8.5 (~1135 ppm @2100), CH₄ pré-ind ≈700 ppb → ~3500 ppb RCP8.5, Crutzen 2006 (SRM sulfates stratosphériques 1–5 Tg S/an → ~5e14 kg équivalent).
        //    Conversion mass/ppm @ M_atm=5.15e18 : 1 ppm CO₂ ≈ 7.83e12 kg ; 1 ppm CH₄ ≈ 2.84e12 kg.
        '🔒': {
            '⚖️🏭': { min: 2.19e15, max: 1.0e16, cools: 'min' }, // CO₂ : 280 ppm (pré-ind) → ~1280 ppm (RCP8.5+)
            '⚖️🐄': { min: 2.0e12,  max: 2.0e13, cools: 'min' }, // CH₄ : 700 ppb → 7 ppm
            '⚖️💨': { min: 3.90e18, max: 4.05e18, cools: 'min' }, // N₂ : très stable (pas de réservoir rapide)
            // sulfates : min = fond naturel préindustriel 4,0e8 kg (Tsigaridis 2006) — arrêter toute
            //   émission anthropique ne descend pas plus bas. max = 1,62e10 kg : pic de charge
            //   sulfatée stratosphérique après le Pinatubo, 5,4 Tg de soufre (Sukhodolov et al. 2018
            //   GMD 11:2633, modèle en accord avec HIRS) × 96/32 = 16,2 Tg SO₄. C'est l'ordre de
            //   grandeur d'une géo-ingénierie sulfatée, que Crutzen (2006) calibre précisément sur
            //   le Pinatubo. L'ancien max, 5,0e14, était 30 000 × celui-là.
            '⚖️✈': { min: 4.0e8,   max: 1.62e10, cools: 'max' },
            '⚖️🫁': { min: 1.17e18, max: 1.19e18, cools: 'min' }, // O₂ : quasi-constant échelle humaine
            '⚖️💧': { min: 1.38e21, max: 1.42e21, cools: 'min' }, // H₂O hydrosphère : très stable
        },
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        // Échelle récente : 🔺⏳ = 0.000025 Ma → 25 ans par pas
        // 🕰 indexé par année : clic ⛽/🛢 injecte 🔺⚖️🏭 (masse CO₂) ; pas encore de cycle complet (airborne / océan → TODO)
        // 🔺⚖️🏭 en kg de CO₂ émis sur la tranche de 25 ans (1 Gt = 1e12 kg ; affichage events.js = kg/1e12).
        // [v1.4.80] ×1000 : les valeurs étaient en « N·1e9 » (850e9 kg = 0,85 Gt) → aucun effet climatique.
        // Refs : Friedlingstein et al. 2023 ESSD 15:5301 (Global Carbon Budget) : fossile+usage des sols ≈ 40 GtCO₂/an
        //   → 2000–2025 = 973 GtCO₂ MESURÉS, pas une fourchette : cumul avec usage des sols du Global Carbon
        //   Budget, 2751,5 − 1778,1 GtCO₂ entre fin 1999 et fin 2024 (Friedlingstein et al. 2026 ESSD 18:3211,
        //   série cumulée diffusée par Our World in Data). 1 ppm CO₂ ≈ 7,8 GtCO₂ ; aéroportée mesurée ≈ 44 %
        //   (≈ +55 ppm, 369,5 → 424,6 ppm NOAA, en air SEC — cf. bloc « AIR SEC vs AIR HUMIDE »).
        //   ⚠️ Les 850e12 d'avant (bas d'une fourchette « 850–1000 » notée au jugé) compensaient par en dessous
        //   des puits alors trop faibles : 2025 tombait juste pour deux erreurs qui s'annulaient.
        //   ⛽ ≈ émissions stabilisées/décroissantes (SSP2-4.5 : ~36 → 14 GtCO₂/an) ; 🛢 ≈ doublement (SSP5-8.5 : ~70 GtCO₂/an).
        '🕰': {
            // 🌙 CARTE DE NUIT superposée à la texture de jour : les lumières des villes n'apparaissent que sur
            // la face à l'ombre, EN MÊME TEMPS que le jour (pas d'alternance). Vaut pour toute l'époque (≥ 2000).
            // Image NASA « Earth at night » : la seule chose qui distingue visuellement l'ère industrielle vue de l'espace.
            '🌙': 'fonds/_002000n.png',
            2000: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 973e12 } }, // +973 GtCO₂ MESURÉS (2000–2024, GCB cumulé)
            // 🪾 : le double du bidon, tranche par tranche. ⛽ et 🛢 décroissent toutes deux après 2050 ;
            // celle-ci vaut exactement 2 × 🛢 à chaque clic — 36, 24 puis 14 centaines de GtCO₂, soit
            // 144, 96 puis 56 GtCO₂/an contre ~41 aujourd'hui. Cumul 2025→2100 = 7400 GtCO₂.
            // Ce n'est pas une prévision : c'est la borne haute mécanique « on double le bidon ».
            2025: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 900e12 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 18e14 }, '🪾': { '🔺⏳': 0.000025, '🔺⚖️🏭': 36e14 } },
            2050: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 600e12 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 12e14 }, '🪾': { '🔺⏳': 0.000025, '🔺⚖️🏭': 24e14 } },
            2075: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 350e12 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 7e14 }, '🪾': { '🔺⏳': 0.000025, '🔺⚖️🏭': 14e14 } },
            '◀': {
                // ⚖️🏭 volontairement absent : CO₂ géré par accumulation manuelle (🔺⚖️🏭_cum)
                // ⚠️ TODO ⚖️🐄 CH4 2100 : ~3000 ppb → 8.6e12 kg (à recalibrer)
                '⚖️': { '⚖️💧': 1.4e21, '⚖️🐄': 8.6e12, '⚖️🫁': 1.18e18, '⚖️✈': 1.05e9, '⚖️💨': 3.97e18 },
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

/**
 * Index des époques : TIMELINE, plus les alias que lisent la géologie et l'interface
 * (type / name / id / startYears / endYears). C'est la même donnée, pas une seconde source.
 *
 * Il vivait dans configOrganigramme.timeline, recopié par le loader de l'application : la géologie
 * (API_BILAN/geology) devait donc lire une config de DIAGRAMME pour résoudre une époque — l'API ne
 * pouvait pas tourner sans l'application. Il naît maintenant avec TIMELINE.
 *
 * Construit à la demande, pas au chargement : CHARS_DESC (data/alphabet.js) arrive après ce fichier.
 */
window.epochIndex = function () {
    // Les ids non-emoji n'ont pas d'entrée CHARS_DESC : repli explicite, pas de nom inventé.
    const NOMS_HORS_ALPHABET = {
        'hysteresis 1a': 'Sturtienne', 'hysteresis 1b': 'Sortie Marinoen', 'hysteresis 2': 'Eocène-Oligocène'
    };
    return window.TIMELINE.map(function (item) {
        if (!item || !item['📅']) return Object.assign({}, item, { type: 'separator' });
        const epochId = item['📅'];
        const desc = window.CHARS_DESC ? window.CHARS_DESC[epochId] : undefined;
        const name = NOMS_HORS_ALPHABET[epochId] || desc || epochId;
        return Object.assign({}, item, {
            type: 'epoch',
            name: name,
            id: epochId,
            startYears: item['▶'] != null ? item['▶'] : item.startYears,
            endYears: item['◀'] != null ? item['◀'] : item.endYears
        });
    });
};

/**
 * Repères littérature (bench / colonnes T init + CONV ATM dans epoch_bench.html).
 * Clés = EPOCH['📅'] (identifiants TIMELINE + entrées hysteresis 1a/1b).
 * Recalculé en mémoire à chaque chargement de ce script — ne pas persister dans CSV ni cookie.
 * tC = °C surface ; co2/ch4 = ppm molaires ; h2oVap = % molaire vapeur atmosphérique.
 */
// ═══════════════════════════════════════════════════════════════════════════
// FOURCHETTES DE LITTÉRATURE DU BANC — et pourquoi elles sont des FOURCHETTES
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ La température moyenne ABSOLUE de la Terre est bien moins bien connue que ses ANOMALIES.
//    Les séries (GISTEMP, HadCRUT, ERA5) mesurent des écarts à ±0,05 °C près ; la valeur absolue,
//    elle, vaut ±0,5 °C (Jones et al. 1999, Rev. Geophys. 37:173). C'est CETTE incertitude-là que
//    la largeur des fourchettes doit porter — pas un intervalle serré autour d'un chiffre canonique.
//
// ─── L'ANCRAGE MODERNE, refait le 2026-09-23 sur données primaires ────────────────────────
//   anomalie an 2000 vs 1951-1980 : +0,39 °C     (NASA GISTEMP v4, GLB.Ts+dSST, série mesurée)
//   moyenne 1996-2004 (9 ans)     : +0,50 °C     (même série, dé-bruitée de l'ENSO)
//   absolu de référence 1951-1980 : 14,0 °C ± 0,5 (Jones et al. 1999 ; climatologie GISTEMP)
//   → an 2000 = 14,0 + 0,39 = 14,4 °C   ·   moyenne 1996-2004 = 14,5 °C
//
//   RECOUPEMENT par un chemin indépendant (réanalyse, pas stations) :
//     ERA5 / Copernicus : 1991-2020 = 14,4 °C en absolu
//     GISTEMP : anomalie 1991-2020 vs 1951-1980 = +0,613 ; 1961-1990 = +0,100
//     → 14,0 + 0,613 − 0,100 = 14,51 °C.  Les deux ancrages concordent à 0,11 °C.
//
//   ⚠️ LA CONFIG ÉTAIT CENTRÉE 0,50 °C TROP HAUT. 🌡️🧮 = 288,15 K = 15,00 °C et la fourchette
//   [14,5 ; 15,5] venaient du 288 K des manuels — le « 255 K + 33 K d'effet de serre » — pas
//   d'une mesure. 15 °C reste dans l'incertitude absolue, mais ce n'est pas le meilleur estimé.
//
// ─── LE PRÉINDUSTRIEL ─────────────────────────────────────────────────────────────────────
//   1850-1900 = 0,88 °C sous la moyenne 1991-2020 (Copernicus, ESOTC 2024) → 14,4 − 0,88 = 13,5 °C.
//
// ─── LE PHANÉROZOÏQUE : PhanDA ────────────────────────────────────────────────────────────
//   Judd et al. 2024, Science 385:eadk3705 — « A 485-million-year history of Earth's surface
//   temperature ». Assimilation de données : plus de 150 000 mesures proxy publiées (5 familles)
//   combinées à 850 simulations. Sortie utilisée ici : PhanDA_GMSTandCO2_percentiles.csv
//   (github.com/EJJudd/PhanDA, 5_Outputs), percentiles 5/50/95 de GMST par étage stratigraphique.
//
//   Méthode appliquée, mécanique : pour chaque époque, on prend l'étage qui contient son ▶ (la
//   config dit « valeurs au DÉBUT de chaque époque ») et on retient [GMST_05, GMST_95] arrondi.
//   Prendre l'étendue de TOUTE l'époque mélangerait variation temporelle et incertitude — 🦕
//   donnerait [9, 44], ce qui ne teste plus rien.
//
//   Écarts avec l'ancien tableau, et ils sont gros — les fourchettes paléo étaient trop FROIDES :
//     🍄 [15,25] → [26,39]   🦤 [12,22] → [25,32]   🐊 [20,28] → [30,37]   🏔 [12,18] → [21,25]
//     💀 [21,32] → [15,24]   🦕 [21,31] → [24,32]   🦣 [10,16] → [13,16]   🛖 [13,15] inchangée ✅
//   Cohérence d'échelle : PhanDA donne l'Holocène à 14,0 °C, ce qui recoupe le préindustriel
//   13,5 et l'an 2000 à 14,4 — tout le tableau est sur le même zéro absolu.
//
//   ⚠️ PhanDA s'arrête à 486,9 Ma. 🪼 (▶ = 600 Ma), 🦠, 🪸 et les trois états d'hystérésis
//   néoprotérozoïques ne sont PAS couverts : leurs fourchettes sont INCHANGÉES et restent
//   non re-sourcées. 🔥 Hadéen non plus — sa fourchette [2300, 2800] est un choix assumé, la
//   littérature ne contraignant pas la surface d'un océan de magma à 4,5 Ga.
//
//   ⚫ Corps noir fait exception dans l'autre sens : sa fourchette est CALCULABLE,
//   T_eq = [S(1−A)/4σ]^¼ = −18,5 °C pour S = 1361 W/m² et A = 0,293, bien dans [−19, −17]. ✅
//
// ─── LA GRAINE 🌡️🧮 EST LE MILIEU DE LA FOURCHETTE ────────────────────────────────────────
//   Règle posée le 2026-09-23 : 🌡️🧮 = (min + max)/2, c'est-à-dire la valeur la plus probable.
//   12 graines ont été réalignées. Les trois états d'hystérésis (☃ ⛄ ⛈) y étaient déjà — leur
//   graine sert à SÉLECTIONNER UNE BRANCHE, pas à viser une cible : ne pas la déplacer sans
//   vérifier que la bistabilité tient.
// ═══════════════════════════════════════════════════════════════════════════
window.BENCH_LIT_BY_EPOCH_ID = {
    '⚫': { tC: [-19, -17], co2: [0, 1], ch4: [0, 0.1], h2oVap: [0, 0.01] },
    '🔥': { tC: [2300, 2800], co2: [100000, 500000], ch4: [10, 100], h2oVap: [10, 20] },
    '🦠': { tC: [5, 25], co2: [50000, 150000], ch4: [1000, 10000], h2oVap: [0.5, 3.0] },
    '🪸': { tC: [0, 15], co2: [5000, 20000], ch4: [50, 500], h2oVap: [0.5, 1.5] },
    'hysteresis 1a': { tC: [5, 15], co2: [500, 2000], ch4: [10, 50], h2oVap: [0.1, 1.0] },
    '⛄': { tC: [-60, -50], co2: [300, 1500], ch4: [0.1, 10], h2oVap: [0.01, 0.5] },
    'hysteresis 1b': { tC: [20, 50], co2: [2000, 10000], ch4: [10, 100], h2oVap: [2.0, 5.0] },
    // 🐧 hystérésis 2 (prélude glaciaire, 35 Ma) — absente du tableau jusqu'au 2026-09-23, d'où le « — » au banc.
    'hysteresis 2': { tC: [25, 28], co2: [711, 907], ch4: [1, 5], h2oVap: [1.2, 2.5] },
    '🪼': { tC: [15, 25], co2: [1500, 5000], ch4: [5, 20], h2oVap: [1.0, 2.5] },
    '🍄': { tC: [26, 39], co2: [500, 3000], ch4: [5, 20], h2oVap: [1.0, 2.0] },
    '💀': { tC: [15, 24], co2: [1500, 4000], ch4: [20, 100], h2oVap: [1.5, 3.5] },
    '🦕': { tC: [24, 32], co2: [1000, 2500], ch4: [10, 30], h2oVap: [1.5, 3.0] },
    '🦤': { tC: [25, 32], co2: [400, 1000], ch4: [1, 5], h2oVap: [0.8, 1.5] },
    '🐊': { tC: [30, 37], co2: [800, 1500], ch4: [1, 5], h2oVap: [1.2, 2.5] },
    '🏔': { tC: [21, 25], co2: [400, 700], ch4: [1, 2], h2oVap: [0.8, 1.2] },
    '🦣': { tC: [13, 16], co2: [180, 300], ch4: [0.4, 0.8], h2oVap: [0.6, 1.0] },
    '🛖': { tC: [13, 15], co2: [260, 285], ch4: [0.6, 0.8], h2oVap: [0.8, 1.0] },
    // 🚂 1800 — tC v-2026-09-23 : [13 ; 15] → [13,0 ; 14,0]. Centre = 13,5 °C, le préindustriel
    //   1850-1900 (Copernicus ESOTC 2024 : 0,88 °C sous 1991-2020 = 14,4 °C). Largeur ±0,5 comme 📱.
    '🚂': { tC: [13, 14], co2: [280, 370], ch4: [0.7, 1.9], h2oVap: [0.8, 1.2] },
    // 📱 ▶ = 2000 : repères = OBSERVATIONS an 2000 (NOAA : CO₂ 369,7 ppm Mauna Loa ; CH₄ 1,77 ppm global). 2025 (424 ppm) = résultat des clics ⛽.
    // ⚠️ co2 [365, 375] est une grille AIR HUMIDE (le chiffre que sort le modèle), pas les ppm NOAA qui sont en air SEC.
    //    Conversion et vérif : atmosphere/calculations_atm.js, bloc « AIR SEC vs AIR HUMIDE ».
    // tC v-2026-09-23 : [14,5 ; 15,5] → [13,9 ; 14,9]. Centre = 14,4 °C (GISTEMP v4, anomalie 2000
    //   +0,39 sur un absolu 1951-1980 de 14,0 °C), largeur = ±0,5 °C, l'incertitude PUBLIÉE sur
    //   l'absolu (Jones et al. 1999). La moyenne 1996-2004, 14,5 °C, tombe dedans. Voir l'encadré.
    '📱': { tC: [13.9, 14.9], co2: [365, 375], ch4: [1.70, 1.85], h2oVap: [1.0, 1.2] }
};

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
// ⚠️ [v1.4.83] Mesuré inerte : bench identique au centième avec 0 (initForConfig re-seed l'océan à chaque calcul,
//   getMasses réécrit ⚖️🏭 à chaque pas). L'absorption du CO₂ INJECTÉ est portée par CARBON_SINKS ci-dessous.
window.CONFIG_COMPUTE.co2OceanPartitionFactor01 = 1;

// ─── PUITS DE CARBONE (CO₂ injecté par événements, ex. 📱 ⛽/🛢/🪾) — v1.4.92 ────────────────
// Modèle de PERTURBATION : la composition de chaque époque (config) est un équilibre ; seul le CO₂ injecté E
// (📜🔺⚖️🏭) est partagé entre atmosphère, océan (O = 📜🌊🔺⚖️🏭) et forêts (L = 📜🌳🔺⚖️🏭).
// Atmosphère = ⚖️🏭 époque + E − O − L (conservation, compute.js getMasses). CO2.advanceCarbonSinks intègre
// l'événement par pas de stepYears, remis à 0 avec E au changement d'époque (setEpoch).
//
//  OCÉAN — TROIS RÉSERVOIRS. Chacun relaxe vers k_i·A, où A = excès resté dans l'air (E − L − ΣO) et
//    k_i = (ratio_i / R)·exp(2400·(1/T − 1/T_ref)). À l'équilibre ΣO = (Σratio/R)·A : la CAPACITÉ TOTALE
//    de l'océan est inchangée (Σratio = co2OceanRatioRef = 50, Sarmiento & Gruber 2006). Seuls les TEMPS
//    diffèrent — et c'était là l'erreur : une boîte unique à τ = 50 ans faisait ventiler l'océan ENTIER
//    (38 000 GtC) en un demi-siècle. Sur 100 ans elle avalait presque tout l'émis (fraction aéroportée
//    tombée à 1 % en 2100 sur ⛽) alors que la mesure la donne stable à 0,44 ± 0,06 depuis 65 ans
//    (Friedlingstein et al. 2023 ESSD 15:5301).
//      • couche de mélange 0–100 m — ~900 GtC de CID, soit ratio ≈ 1,2 ; équilibre gazeux air-mer en
//        ~1 an (Broecker & Peng 1982, Tracers in the Sea).
//      • thermocline 100–1000 m — ~7 600 GtC, ratio ≈ 10 ; ventilée en ~50 ans. C'est LA fourchette que
//        donnent les traceurs CFC et le radiocarbone des bombes (Sabine et al. 2004 Science 305:367), et
//        c'est là que se trouve l'essentiel du carbone anthropique mesuré. La v1.4.83 citait bien cette
//        référence, mais appliquait ses 50 ans à l'océan entier.
//      • océan profond > 1000 m — le reste (~29 000 GtC, ratio 38,8) ; renouvelé par la circulation
//        thermohaline, τ de l'ordre de 350 ans. C'est le paramètre le MOINS contraint des trois : il ne
//        joue presque pas sur 2000-2100 (7 % de relaxation en 25 ans) mais fixe le très long terme.
//    R = facteur de Revelle (chimie des carbonates mesurée) : ~10 vers 370 ppm, croît avec le CO₂ → saturation.
//      Sabine et al. 2004 ; Egleston, Sabine & Morel 2010 Glob. Biogeochem. Cycles 24:GB1002.
//    2400 K = Van 't Hoff solubilité CO₂ (eau plus chaude = moins de dissolution, même loi que calculateCO2Partition).
//
//  TERRES — TROIS MÉCANISMES DISTINCTS, un chiffre publié pour chacun, aucun calage.
//    Le puits terrestre mesuré n'est pas de la fertilisation CO₂ pure : la version d'avant ne modélisait
//    que celle-là et plafonnait à 21,9 % des émissions contre ~30 % mesurés.
//      1. FERTILISATION — ΔNPP = NPP0·β_eff·ln(C/C0), stock relaxant vers ΔNPP·τ.
//         NPP0 = 56 GtC/an (Field et al. 1998 Science 281:237) ; τ = 23 ans (Carvalhais et al. 2014
//         Nature 514:213). β_eff = f_jeune·β_jeune + (1−f_jeune)·β_mature — voir sinks_land.js.
//         β_jeune = 0,605 : Norby et al. 2005 PNAS 102:18052, +23 % de NPP à 550 ppm pour un ambiant
//           FACE de ~376 ppm → 0,23/ln(550/376). Ces parcelles avaient 10-20 ans.
//         β_mature = 0,15 : sur forêt MATURE le CO₂ enrichi ne donne aucun gain de biomasse — EucFACE
//           (Jiang et al. 2020 Nature 580:227) et Web-FACE (Körner et al. 2005 Science 309:1360).
//         f_jeune = 0,358 : part de forêt de moins de 30 ans en 2000, agrégée depuis GFADv1.1
//           (Poulter et al. 2019, PANGAEA doi:10.1594/PANGAEA.897392) par scripts/gfad_young_forest_fraction.py
//           du dépôt CO2. Bornes du jeu de données : 0,30 – 0,48. La fenêtre de 30 ans vient de Tang
//           et al. 2014 PNAS 111:8856 (la NPP culmine entre 10 et 40 ans puis redescend).
//         → β_eff = 0,313. Appliquer 0,605 à toute la forêt mondiale, dont les deux tiers ne sont pas
//           jeunes, c'était le biais d'échelle classique des FACE.
//      2. DÉPÔT D'AZOTE — 0,7 GtC/an après 2000, soit ~20 % du puits terrestre (O'Sullivan et al. 2019
//         Glob. Biogeochem. Cycles 33:163). Flux NET, cumulé sans relaxation. Indexé sur les émissions
//         (0,7 GtC pour 38,9 GtCO₂/an) : l'azote réactif est un co-produit de la combustion et de
//         l'agriculture, une injection volcanique n'en dépose pas.
//      3. REPOUSSE FORESTIÈRE — 1,30 GtC/an en 2001-2010 dans les peuplements en repousse après
//         perturbation passée, contre 0,85 en forêt primaire intacte (Pugh et al. 2019 PNAS 116:4382).
//         Héritage du XXᵉ siècle, indépendant du CO₂ et de l'azote ; décroît en 66 ans (temps de
//         reconstitution de la biomasse, même source).
//
//    Résultat 2000→2025 sans aucun ajustement : terres 28,6 % (fertilisation 10,2 · azote 6,6 ·
//    repousse 11,8) contre ~30 % mesurés, océan 23,5 % contre ~26 %. Les trois publications, prises
//    telles quelles, tombent à 1,4 point du total mesuré — c'est une VÉRIFICATION, pas un calage.
//
//  ⚠️ CE QUI RESTE OUVERT
//    Fraction aéroportée 47,9 % contre 44,3 % mesurés : il manque ~3,5 points de puits, répartis
//    entre océan et terres. Et le terme de repousse est pour l'instant une décroissance IMPOSÉE ;
//    quand le bouton 🪾 existera, il devra devenir la conséquence des coupes simulées (couper du
//    mature remplit le pool jeune, qui reconstitue sa biomasse sur landRegrowthTauYears).
window.CONFIG_COMPUTE.CARBON_SINKS = {
    // Pas d'intégration des deux puits (années). L'événement dure 🔺⏳ ; advanceCarbonSinks le découpe
    // en pas de stepYears, étale l'émission et relaxe pas à pas. 1 an = intégrale juste ; mettre 25
    // reproduit l'ancien pas unique (le CO₂ de fin de tranche absorbé comme celui du début — faux).
    stepYears: 1,
    // Σ ratio DOIT valoir co2OceanRatioRef (50) : même capacité totale, temps différents. Crash sinon.
    oceanBoxes: [
        { nom: 'couche de mélange', ratio: 1.2,  tauYears: 1 },
        { nom: 'thermocline',       ratio: 10.0, tauYears: 50 },
        { nom: 'océan profond',     ratio: 38.8, tauYears: 350 }
    ],
    oceanRevelleRef: 10,          // R à oceanRevelleRefPpm
    oceanRevelleRefPpm: 370,
    oceanRevelleSlopePerPpm: 0.014, // Egleston 2010 : R ≈ 10 (370 ppm) → ≈ 16 (800 ppm)
    landNpp0GtC: 56,              // Field 1998
    landTauYears: 23,             // Carvalhais 2014
    // Fertilisation pondérée par l'âge — c'est ce qui corrige le biais d'échelle des FACE.
    landBetaYoung: 0.605,         // Norby 2005 (parcelles de 10-20 ans)
    landBetaMature: 0.15,         // Jiang 2020 EucFACE + Körner 2005 Web-FACE (aucun gain de biomasse)
    landYoungFraction0: 0.358,    // GFADv1.1 [0,30–0,48] — scripts/gfad_young_forest_fraction.py (dépôt CO2)
    // Dépôt d'azote : 0,7 GtC/an pour 38,9 GtCO₂/an émis (O'Sullivan 2019). Indexé sur les émissions
    // pour rester nul dans une époque sans combustion ni agriculture industrielle.
    landNdepGtCPerGtCO2: 0.7 / 38.9,
    // Repousse forestière héritée (Pugh 2019), décroissant sur le temps de reconstitution de biomasse.
    landRegrowth0GtCPerYear: 1.30,
    landRegrowthTauYears: 66
};
// Voile SW additionnel (0–1) depuis jauge hystérésis ⚽ ; s’ajoute à EPOCH[‘🍰⚽’] + 📜[‘🔺🍰⚽’] → DATA[‘🪩’][‘🍰⚽’] obstruction, DATA[‘🪩’][‘🍰🪩⚽’]=1−🍰⚽
window.CONFIG_COMPUTE.hystStratosphericVeilExtra01 = 0;
// ─── Amplification polaire 3 zones EBM 0D (Budyko-Sellers) — v1.4.51 ────────────
// SOURCE UNIQUE dT_* : configTimeline.js EPOCH['🥶'] = { dT_pol, dT_mid, dT_trop }.
// Lue par EARTH.computeIceTempFactor(opts) via les 3 call-sites albedo/flux/h2o (crash si absent).
// CONFIG_COMPUTE.polarAmplificationK / midlatAmplificationK SUPPRIMÉS v1.4.51 — dead code après
// migration vers EPOCH['🥶'] (cf. albedo v1.2.51, flux v1.2.93, h2o v1.0.23).
// Géométrie sphérique conservée ici (POLAR/MIDLAT/TROPICAL_ZONE_FRAC) car non per-époque.
window.CONFIG_COMPUTE.polarZoneFraction = 0.13;       // ~60°–90° les 2 pôles
window.CONFIG_COMPUTE.midlatZoneFraction = 0.37;      // ~30°–60° les 2 hémisphères
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
window.CONFIG_COMPUTE.obliquityDeg = 23.44;           // 🏷️ OBS/CALIB (IAU 2009) — plage acceptée [0°, 90°] (voir bloc ci-dessus)

// Valeurs par défaut des jauges fine-tuning (% ) : source unique window.DEFAULT.TUNING.baryByGroup (initDATA.js v1.3.1
// copie ici dans CONFIG_COMPUTE.baryByGroupDefault après DATA['🎚️']). Ne pas dupliquer de littéraux dans ce fichier.

// ===================== [OBS/CALIB] =====================
// Bins spectaux (N utilisé). 500 = courbe propre ; 100 donne courbe moins précise et convergence ~1.2°C (artefact). 🔬🌈 dans [N_min, N_max].
// N_min : optionnel (spectralBinsMinFromHITRAN). Réf. scripts/hitran_spectral_bin_bounds.py.
// 2000 = courbe spectrale lisse. Réduire à 1000 si crash Brave code 5 (RAM).
// edsAttributionByRemoval : l'attribution EDS par gaz (DATA['📛']) est calculée en RETIRANT chaque
// absorbeur à température figée et en lisant la remontée d'OLR — méthode Schmidt et al. 2010 (JGR
// 115:D20106) et Lacis et al. 2010 (Science 330:356), celle dont sortent les chiffres de la littérature.
// Coût : 4 passes spectrales de plus, UNE FOIS par époque à la convergence — pas à chaque itération.
// false → repli sur l'ancienne attribution `sum_blocked` du worker, qui somme les interceptions couche
// par couche : elle recompte 50 fois une bande saturée et une seule fois une fenêtre transparente, et
// donnait les nuages à 3 % de l'EDS quand le retrait en mesure 37 %. Voir doc/DIAGNOSTIC_ATTRIBUTION_EDS.md.
window.CONFIG_COMPUTE.edsAttributionByRemoval = true;
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
// factorTropopause : si radiativeFactorTropopauseFixed != null, valeur fixe (hors bary) écrite par tuning.js. Sinon (null) cible FINE_TUNING.
window.CONFIG_COMPUTE.radiativeFactorTropopauseFixed = 1.0261;       // [OBS/CALIB] ratio × RT/Mg, calage 13 % SCIENCE sans coupler les 4 cibles. null = rétablir interpolation bary.
// Extension tropopause : DATA['🎚️'].RADIATIVE.factorTropopause. false = ×1.
window.CONFIG_COMPUTE.useFactorTropopause = true;                    // [OBS/CALIB] true = × factorTropopause (ATM.calculateTropopauseHeight) ; false = échelle RT/Mg seule.
window.CONFIG_COMPUTE.troposphericLapseRateKPerM = 0.0065;           // [OBS/CALIB] atmosphère standard, gradient thermique utilisé sous la coupure effective.
// Masse totale eau terrestre (kg), ref pour % météorites de glace (events.js)
window.CONFIG_COMPUTE.earthTotalWaterMassKg = 1.4e21;              // [OBS/CALIB]
// Sans atmosphère (⚫) : stock glace didactique 🍰💧🧊 = min(cap, (⚖️💧/earth)×perPAL) — pas 100 % d’un coup.
window.CONFIG_COMPUTE.noAtmosphereMeteoriteIceCap01 = 0.1;         // plafond 10 % de l’inventaire « phase glace »
window.CONFIG_COMPUTE.noAtmosphereMeteoriteIcePerPAL = 100;        // × fraction PAL eau (~1 clic ☄️ → ~2–3 %)

// ===================== [EQ/NUM] =====================
// — maxDichotomyIterations : boucle EXTERNE uniquement dans simulateRadiativeTransfer → performDichotomy (iterate dans calculations.js) ; chaque pas appelle calculateFluxForT0 une fois.
// — maxRadiatifIters : boucle INTERNE computeRadiativeTransfer (calculations_flux.js, compteur DATA['🧮']['🧮🔄☀️']) ; le panneau convergence affiche « 🌈 calcul radiatif N » avec N = innerIter+1 → c’est CE plafond qui fixe « 27 » etc.
window.CONFIG_COMPUTE.maxDichotomyIterations = 10;                 // [EQ/NUM] outer simulateRadiativeTransfer uniquement
window.CONFIG_COMPUTE.maxRadiatifIters = 101;                      // [EQ/NUM] inner Search/Dicho API (CONVERGE / scie)
// Plafond T en Search (K). null = pas de plafond (test).
window.CONFIG_COMPUTE.maxSearchT_K = null;                         // [EQ/NUM]
// Tolérances cycle eau (changement albedo/vapor pour relancer tour radiatif)
window.CONFIG_COMPUTE.cycleTolAlbedo = 1e-4;                       // [EQ/NUM]
window.CONFIG_COMPUTE.cycleTolVapor = 1e-6;                        // [EQ/NUM]
// Spin-up climatologique avant solver radiatif (cycles eau/albédo avant convergence). Confirmé >= 0 entier.
// v1.4.17 : réduit 8→1 (les 8 palliaient le bug H2O=0 à Init, désormais corrigé par calculateH2OParameters() avant calculateFluxForT0()).
window.CONFIG_COMPUTE.climateSpinupCycles = 1;                         // [EQ/NUM]
// Cycles eau/albédo par pas radiatif (1 = même résultat visu/scie 16.4°C 2025 ; 2 = visu peut dériver albédo → 15.2°C)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep = 1;             // [EQ/NUM]
// Cycles eau/albédo à l'Init uniquement (T fixe)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit = 1;              // [EQ/NUM]
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
// Logs diagnostics (défaut false — éviter spam console / ralentissement ; true pour debug ponctuel)
window.CONFIG_COMPUTE.logIceFixedDiagnostic = false;
// true : une ligne par calculateAlbedo (T, mer gelée, facteur polaire, cibles, verrous hyst, 🍰🪩🧊 après normalisation surfaces)
window.CONFIG_COMPUTE.logIceFractionDiagnostic = false;
window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic = false;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = false;
window.CONFIG_COMPUTE.logIrisDiagnostic = false;
// pdTrace Henry (CO₂ océan-atmosphère) : load / NO-OP / APPLY
window.CONFIG_COMPUTE.logCo2PartitionDiagnostic = false;
// Fichiers _logs/ (post /_log) : miroir panneau hyst (appendLog) → hyst.txt ; blocs epoch compare → epoch.txt.
// Pas de ?debug= requis ; setTopic(…, { reset: false }).
// v-2026-09-16 : hyst.txt GARDÉ (c'est le journal du test hystérésis, une ligne par pas, celui qu'on relit) ;
//   epoch.txt passé à false (doublon calcul-seul du même contenu, écrit à chaque compute:done).
window.CONFIG_COMPUTE.logHystPanelToFile = true;
window.CONFIG_COMPUTE.logEpochCompareToFile = false;
// Panneau organigramme (breakdown albedo_percents, Corps noir vs surfaces 🪩) → _logs/albedoUi.txt ; sinon window.__ALBEDO_UI_LOG
// v-2026-09-16 : false par défaut (écriture à chaque rafraîchissement du panneau ; diagnostic ponctuel).
window.CONFIG_COMPUTE.logAlbedoUiDiagnostic = false;
// v1.2.59 albedo : snapshot pré-Search 🍰💧🧊/🍰🪩🧊 + blend dt + cible glace_equilibre — permet
// comparaison parcours visu vs bench séquentiel (calibration). _logs/iceSnapshot.txt.
// v-2026-09-16 : false par défaut — une ligne fichier à CHAQUE calculateAlbedo (des centaines par convergence).
window.CONFIG_COMPUTE.logIceSnapshotDiagnostic = false;
// 1 ligne synthétique par époque pendant un run bench multi-époques. Reset au démarrage du run
// (epoch_bench.html via window.logBenchReset()). _logs/bench.txt.
window.CONFIG_COMPUTE.logBenchPerEpoch = true;
// Notes R&D libres écrites par l'agent (window.logRnD). Reset à chaque F5 (wipeAll). _logs/rnd.txt.
window.CONFIG_COMPUTE.logRnDNotes = true;
// Instantané JSON [REPRO] (masses, atmos, surfaces, 🎚️, ligne TIMELINE, hyst) — miroir hyst + epoch, diff entre parcours
window.CONFIG_COMPUTE.logReproComparableState = true;

