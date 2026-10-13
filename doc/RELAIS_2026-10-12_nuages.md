# Relais — 2026-10-12 — chantier NUAGES (structure verticale par la physique)

Pour une session vierge. Lire d'abord : `_dnavatar/AGENTS.md`, la mémoire projet (`MEMORY.md`, en particulier
`feedback_physique_dure_pas_de_calage`, `feedback_pas_de_if_abusifs`, `project_vapeur_hadeen_2026_10_12`).

## Règles de l'utilisateur (non négociables)
- **La physique, les formules, la littérature.** Jamais de recalage d'un paramètre sur un bilan mesuré
  (ex. « caler τ nuages sur CERES » = INTERDIT). Ordre : équation > mesure de laboratoire > fourchette déclarée.
- Pas de `if` abusifs, pas de replis silencieux, crash-first ; une seule référence par grandeur.
- Fichiers séparés (CSS/JS), scripts classiques, en-têtes `// File / Desc / Version / Date / Copyright 2026`.
- Ne jamais déployer ; ne commiter que sur demande ; réponses en français.

## État (commits API_BILAN 30382c8, CO2 2b2f6d6)
- Transfert : σ(λ,T) par couche, élargissement sans plafond + auto-élargissement H₂O, continuum Roberts 1976,
  densités molaires, profil unique `profilAtmosphere` (adiabatique sèche / humide non diluée / peau),
  `radiative/calculations.js`. Eau : IAPWS, régime « toute l'eau en vapeur » (`physics/physics.js`, `h2o/`).
- 🔥 physique : magma 2550 °C → 2227 °C à 1 ka → océan ~300 °C sous ~190 bar à 100 ka.
- **Ciel clair moderne JUSTE** : OLR 270 W/m² à 288 K (CERES ~266–269).
- **Nuages LW TROP FORTS** : 54 W/m² par retrait (CERES ~26–28) → toutes les époques +10 à +20 °C
  (📱 24,2 °C au lieu de 14,3). Bancs : `bench19` avant/après dans l'historique de session.
- Cause dans le code : `calculateFluxForT0` répartit τ_nuage = ☁️ × CLOUD_LW_TAU_REF (2,6, « sans source »)
  uniformément de la surface à la tropopause du profil (~214 K, ~12 km) : tout se passe comme si chaque nuage
  montait jusqu'à la tropopause. L'ancien modèle avait les mêmes ~55 W/m², masqués par un ciel clair trop
  transparent (H₂O compté ×0,6, pas de continuum).

## Pourquoi on change le calcul (réponse à « on avait un modèle correct en une passe »)
Il était juste par compensation de deux erreurs. La passe unique peut RESTER : la colonne double
(clair + nuageux, Marley et al. 2010) n'est qu'un raffinement ; en une passe, l'approximation classique est
l'émissivité effective par couche ε_eff = f·ε (fraction × émissivité du nuage dans la couche).

## Choix retenu : voie C complétée par Ackerman & Marley 2001 (ce que fait Windsor et al. 2022), en UNE passe
L'épaisseur et le contenu en eau des nuages sortent d'une équation, pas d'une donnée :
1. **Base** : première couche saturée du profil (déjà calculée dans `profilAtmosphere`).
2. **Condensat** (Ackerman & Marley 2001, éq. 4) : −K_zz ∂q_t/∂z − f_sed w* q_c = 0, q_t = q_v + q_c,
   q_v = saturation au-dessus de la base.
   - K_zz = (H/3)(l/H)^{4/3} (R F_c / (μ ρ c_p))^{1/3} (convection libre, Gierasch & Conrath 1985 ; éq. 5 de
     Windsor et al.), F_c = flux convectif (≈ solaire absorbé net en surface ; plancher h_c·F_net, h_c = 0,01).
   - l = k z / (1 + k z / H), k = 0,40 (Blackadar 1962) ; w* = K_zz / l.
   - f_sed : 0,6–1 (stratocumulus terrestres, Ackerman & Marley 2001) → milieu, déclaré.
3. **Taille des gouttes** : r_eff par l'équilibre sédimentation (Stokes + Cunningham) = w* (éq. 10–15 de
   Windsor), log-normale σ_g = 2.
4. **Opacité IR** : par couche, τ = 3/2 · (q_c ρ Δz) / (ρ_eau r_eff) (Stephens 1978) ; glace : Ebert & Curry 1992.
5. **Fraction** f : la même que l'albédo (🍰🪩⛅) — Windsor et al. : f « ne peut pas être prédite en 1D ».
   Une passe : τ_eff,couche = −ln(1 − f·(1 − e^{−τ})).
6. Remplacer `CLOUD_LW_TAU_REF` et la répartition uniforme ; garder le reste du transfert intact.

## Protocole de test
- Banc : `cd CO2 && python3 scripts/bench_headless/run.py bench19.js > sortie.out` (≈ 3 min) ; comparer les
  époques à leurs fourchettes et les passages d'hystérésis.
- Contrôle physique à 288 K figés sur 📱 (page `API_BILAN/demo/epoch_bench.html` en headless) : OLR ciel clair
  (☁️ = 0) doit rester ~270 ; effet nuages LW par retrait (`RADIATIVE.computeEdsRemovalShares`) → comparer à
  CERES (contrôle, PAS cible de calage).
- Chaîne 🔥 : frise puis clics jusqu'à 🦠 (magma → océan).

## Autres points ouverts
- Pas de captage du CO₂ à l'Hadéen (chantier C) ; bandes chaudes H₂O absentes (HITRAN, pas HITEMP).
- bary d'interpolation 🔀 = k/maxTics (devrait être ⏳/durée) ; gravité 🍎 fixe malgré le rayon f(T).
- Sorties de snowball 1b/1c : rebasculent chaudes (49 °C) depuis le profil unifié.

## Références (toutes dans `doc/BIBLIOGRAPHIE.html`)
windsor2022, ackermanMarley2001, stephens1978, marley2010, hartmannLarson2002, pierrehumbert2010,
wagnerPruss2002, wagner2011, roberts1976, chase1998, kasting1988, nakajima1992, lebrun2013, hamano2013.

## Essai 1 (NON commité, arbre de travail) — Ackerman & Marley en une passe
Fait : `profilAtmosphere` transporte l'eau totale q_t (dq_t/dz = −f_sed (q_t − x_sat)/l, implicite), la vapeur
au-dessus de la base = min(q_t, x_sat) (fin de la saturation imposée) ; r_eff par Stokes + Cunningham (A&M éq.
14–15) ; τ_abs = ¾ W/(ρ_c r_eff) ; recouvrement MAXIMAL : τ_eff = −ln(1 − f(1 − e^{−Στ})) réparti au prorata.
Constantes : `EARTH.NUAGES` (physics.js). Worker : τ nuage par couche (L.tauNuage). Grille σ(T) dès 50 K.
Résultats :
- À 288 K sur 📱 : ciel clair 270 W/m² (inchangé), nuages LW 13–16 W/m² (CERES ~26–28), f = 0,285.
- Banc : 📱 4,8 °C ; 🪸 → 🦣 basculent en snowball (~−78 °C) ; seules 1b/1c dans leur fourchette.
- Recouvrement aléatoire couche par couche (1er essai) : τ_eff total 8,8 → nuages 78 W/m², 📱 63 °C.
Diagnostic : la fraction f (0,285) et la réflectance SW r_c = 0,42 viennent du schéma d'albédo, RÉGLÉS avec
l'ancien LW. Observé : f ≈ 0,6–0,7 (King et al. 2013). Pistes physiques : albédo SW des nuages tiré du MÊME
condensat (τ_SW = 3/2 W/(ρ r_eff), deux-flux Lacis & Hansen 1974, g ≈ 0,85) ; fraction : non prévisible en 1D
(Windsor et al.) — décision utilisateur (mesure King 2013 vs schéma actuel).

## PROCHAINE ÉTAPE (proposée à l'utilisateur, à faire d'un bloc, puis banc)
Constat dans `albedo/calculations_albedo.js` (l. 940–1016) : la « fraction » 🍰🪩⛅ n'est PAS une fraction
géométrique. C'est (CLOUD_FRACTION_BASE + CLOUD_FRACTION_INDEX_GAIN × ☁️) × efficacité optique (Twomey via
twomeyA, pression min(1,2 ; P), oxydation, température), plafonnée à 0,75, associée à une réflectance FIXE
r_c = 0,42 (albedo_coeff['🪩🍰⛅']) dans l'addition à 2 couches. D'où 0,285 sur 📱. Bornes réglées pour l'ancien modèle.
Mesures (DE MÉMOIRE, à vérifier avant de les écrire en config) : MODIS ~0,67 (King et al. 2013), ISCCP ~0,66,
CALIPSO ~0,73, GEWEX ~0,68 ± 0,03 (Stubenrauch et al. 2013) → fourchette ~0,6–0,75 pour la Terre actuelle.
1. f = fraction GÉOMÉTRIQUE, cible de fine-tuning bornée par la mesure (~0,6–0,75) ; ☁️ la module selon l'époque.
2. τ_SW = 3/2 · W / (ρ_c r_eff), W = condensat du profil (profilAtmosphere, déjà calculé). r_eff des gouttes
   LIQUIDES par Twomey : N ∝ CCN (garde la loi sulfate de McCoy 2018, SULFATE_CCN_EXPONENT), r_eff = (3 LWC /
   (4π ρ_w N k))^{1/3} (Martin, Johnson & Spice 1994, k ≈ 0,67–0,8) ; N moderne ~100 cm⁻³ (océan) – ~300
   (continent) = fourchette mesurée. Rayon d'Ackerman & Marley (sédimentation) : garder pour la glace / l'altitude.
3. Réflectance nuage R = 0,13 τ / (1 + 0,13 τ), 0,13 = (√3/2)(1 − g), g = 0,85 (Lacis & Hansen 1974) → remplace
   r_c = 0,42 dans l'addition à 2 couches. Même W, même r_eff pour l'opacité IR (τ_abs = ¾ W/(ρ r_eff)).
4. Retirer : r_c = 0,42, OPTICAL_EFF_BASE, facteurs pression / oxydation / température.
Avant d'écrire : ajouter à la biblio lacisHansen1974, martin1994, king2013, stubenrauch2013 (vérifier DOI).
Note : l'albédo est calculé AVANT le transfert (calculateAlbedo puis calculateFluxForT0) — il faudra que W et
r_eff soient disponibles à l'albédo (appeler RADIATIVE.profilAtmosphere sur une grille z grossière, ou exposer la
colonne nuageuse), sans copie d'état.

## Essai 2 (NON commité, arbre de travail ; essai 1 sauvé dans `git stash` « essai 1 nuages A&M ») — albédo SW du même condensat
Décision utilisateur : f = 0,72·océan libre + 0,55·(1 − océan) (MODIS, King et al. 2013, IEEE TGRS 51:3826).
Fait : physics.js `EARTH.NUAGES` (K_MARTIN 0,80/0,67, CDNC_CONTINENT 200 cm⁻³ Gultepe & Isaac 2004, phase Hu & Stamnes,
G_ASYMETRIE 0,85, F_OCEAN/F_CONTINENT) ; r_c = 0,42 retirée. Profil : condensat accumulé à chaque pas de 100 m ;
liquide r_eff de Martin et al. 1994 (N = CDNC × ALBEDO.rapportCCN()), glace A&M ; τ_IR = ¾ s, τ_SW = 3/2 s.
`RADIATIVE.colonneNuageuse()` → albédo : R = √3(1−g)τ/(2+√3(1−g)τ), écrit dans DATA['🪩']['🪩🍰⛅'].
Config : CLOUD_FRACTION_BASE/_INDEX_GAIN/_MAX, OPTICAL_EFF_BASE, PRESSURE/OXIDATION* retirés ; jauge CDNC_OCEAN_CM3
[40 ; 89] (Bennartz 2007). UI : main.js, organigramme, scie_config_view, dico mis à jour. Biblio PAS encore ajoutée.
Résultats à 288 K figés sur 📱 : ciel clair 265 W/m² ; W = 2,1 kg/m² (observé dans le nuage ~0,1) → τ_SW 250, R 0,97,
CRE_SW −172 (CERES −47), CRE_LW 41 (CERES 26–28) ; 📱 converge à −77 °C. Balayage f_sed 0,8 → 10 : W 2164 → 514 g/m²,
R 0,97 → 0,92 : f_sed n'est PAS le levier.
Diagnostic : la colonne 1D est saturée (condensat) de la base à la tropopause. Windsor et al. 2022 (PSJ 4:94,
arXiv 2210.10004 §3.4) ont le même défaut : Terre « baseline » albédo de Bond 0,54 et effet de serre 250 W/m² (vs ~150),
compensés entre eux — ils l'écrivent. A&M seul ne donne pas l'eau nuageuse terrestre en 1D.
Autre constat : le transfert (gaz ET nuages) utilise exp(−τ) vertical, sans facteur de diffusivité (~1,66, Elsasser) :
la transmission d'un flux diffus est sous-estimée → à traiter à part (le ciel clair « juste » à 265–270 en dépend).

## Essai 3 (2026-10-13, NON commité ; essai 2 sauvé dans `git stash` des deux dépôts) — A&M abandonné
Décisions (déléguées par l'utilisateur, « fais les choix ») :
- **Diffusivité** EARTH.DIFFUSIVITE = 1,66 (Elsasser) dans le worker : transmission d'un flux exp(−D·τ), gaz ET nuages.
- **Vapeur moyenne** non saturée : profil de Manabe & Wetherald 1967 (r̄ = RH_s·(p/p_s − 0,02)/0,98), la parcelle ne
  fixe plus que T. **H2O_SURFACE_RH_01 0,623 (sans source) → 0,735** (ERA5 0,70–0,75 ; MW 0,77) ; doublon d'Init
  H2O_SURFACE_RH_INIT_01 (0,4986) retiré.
- **H2O_EDS_SCALE supprimé** partout (cible, constante, worker, UI) : ciel clair 288 K = **268,5 W/m²** sans lui (CERES 266–269).
- **Nuage adiabatique limité par la pluie** : base = niveau de condensation de la parcelle, eau adiabatique
  (x_surface − x_sat), sommet quand LWC atteint LWC_pluie = (4π/3)ρ_w k N r³, r = 14 µm (Rosenfeld & Gutman 1994 ;
  Freud & Rosenfeld 2012) ; glace r_eff 30 µm ⚠️ déclaré. Fraction f = MODIS 0,72/0,55 (mesure).
- Essai intermédiaire rejeté : schéma statistique (Sommeria & Deardorff) + MW + recouvrement exponentiel (Barker 2008,
  L = 2 km) : il faut σ ≈ 0,75 pour C = 0,67, et l'eau dans le nuage vaut 0,5–1,3 kg/m² (nuages étalés sur 5 km).
- Grille σ(T) étendue à 20 K (le solveur explore 44 K à 🏂 — crash-first au banc).
Contrôle 288 K sur 📱 : nuage 700 → 1000 m, W 177 g/m², τ 22, R 0,74 ; CRE_SW −124 (CERES −47), CRE_LW +12 (CERES +26–28).
Banc (scratchpad bench_nuages3.out) : **5/21** dans la fourchette (avant 12) — Phanérozoïque et moderne en snowball
(−75 °C), 🦠 60 °C. Cause : UN type de nuage (bas, épais) sur 67 % du globe ; la Terre a des bas (~40 % ?) et des cirrus
hauts fins (LW). Il manque la répartition bas/haut mesurée (ISCCP/MODIS, non vérifiée en ligne) — décision à prendre.

## Essai 4 (2026-10-13, NON commité ; `git stash` « essai 4 » dans les deux dépôts) — état courant
Contrôle 288 K sur 📱 (bary 62 % au moment du contrôle) : ciel clair 0,162 (CERES 0,155) ; OLR 239 (240) ; couverture 0,63
(0,66) ; τ moyen des nuages bas 12 (MODIS 10–15) ; bilan net −9 W/m² (au lieu de −112). Bilan nul vers bary 10–20 %.
1. **radiative/solaire.js** : Lacis & Hansen 1974 complet (lu dans le PDF scanné : éq. 8–15 ozone, 18/41 Rayleigh, table 1
   vapeur en 8 k, 19/31/33 nuages, 39–42 sol), moyenne globale ∫A(μ)2μdμ (Gauss 4 pts). Ozone : 300 DU·(pO₂/0,21)^0,19
   (Segura 2003, ⚠️ facteur 2). Les raies HITRAN du modèle ne couvrent PAS le solaire (H₂O 5–100 µm, CO₂ 11,8–63 µm).
2. **Nuages bas** : parcelle adiabatique depuis le niveau de condensation jusqu'au seuil de pluie (condensat total =
   LWC_pluie = (4π/3)ρ_w k N_actuel r³, N ACTUEL car susceptibilité LWP ≈ 0, Toll 2019 ; glace : WBF) ; POPULATION de
   profondeurs uniformes (cycle de vie ⚠️) ; f = 0,41 (GEWEX 2024). **Nuages hauts** : f = 0,37, ln τ uniforme 0,03–30
   (tiers CALIPSO), au niveau T_ENCLUME = 220 K (⚠️ FAT, de mémoire) ; IR par émissivité de flux (D).
3. **Glace** : albédo pondéré par l'ensoleillement (EARTH.fractionGelee, retard 30 j) ; mi-latitudes = part continentale
   (amp 25 K) + part océanique (amp ⚠️ 4 K) → 📱 glace ~11 % au lieu de 18 %.
4. **Retirés** : H2O_EDS_SCALE (ciel clair juste sans lui) ; **CIA CO₂ inventée** (gaussiennes ×100 : fermait la fenêtre de
   l'Archéen, OLR 108 W/m²) ; essais A&M et schéma statistique.
5. Jauge **R_EFF_PLUIE** [13 ; 14] µm ; **barycentre ATM 62 → 15 %**. Grille σ(T) dès 20 K.
Banc sans CIA (bench_lh4.out) — bary 15 % : **11/21** (📱 14,36 · 🚂 13,37 · 🛖 13,7 · 🦣 13,6 · 🦠 19,1 · 🪼 16,9 · 🍄 31,9 ·
1b 23,8 · 1c 22,2). Hors fourchette : Phanérozoïque chaud trop froid de 5–15 K (🦕 18, 🦤 23, 🐊 20, hyst 2 17, 🏔 13,7),
💀 23,6 (trop chaud), snowballs trop froids (⛄ −78, 🏂 −75), 🪸 bascule (−79), bistabilité selon le bary (🏔 à 20 %, 🐊 à 25 %).
Restent ⚠️ : nuages moyens (0,23) absents ; O₃/N₂O/CFC absents de l'IR (ciel clair OLR 272 vs ~265–268) ; T_ENCLUME ;
amplitude océanique ; terme O₂×biomasse de rapportCCN ; F_c du profil lit l'albédo de l'itération précédente.

## Essai 5 (2026-10-13 soir, COMMITÉ sur la branche `algo-solaire-nuages-physique` des deux dépôts)
Commits API_BILAN : dfc1cf4 (grosse modif d'algo), 4ad1306 (jauges séparées), 5e0e59c (rétroactions vapeur/glace).
CO2 : abee59d, a59d69f.
- **Jauges séparées** (FINE_TUNING_BOUNDS.jauges, classement MESURÉ au bilan aux graines) : FROID ☁️ (CDNC, R_EFF_PLUIE,
  F_BAS), CHAUD 🌥 (F_HAUT, H2O_SURFACE_RH_01), SUBTIL 🔀 (SULFATE_CCN_EXPONENT), HYSTERESIS 🧊. Défauts 45/50/70/100.
  Visu : une rangée par jauge sans texte ; scie et banc : explication + mesure par jauge. bench19 : jeux de jauges.
  Les jauges décalent TOUTES les époques ensemble (pentes quasi identiques) : elles ne corrigent pas l'écart entre époques.
- **Corrections physiques** : facteur Iris retiré ; glace comptée deux fois retirée (V1.0.0) ; LCL par dichotomie ;
  HR de Manabe & Wetherald / eau liquide (Murphy & Koop 2005, PHYS.pSatLiquide).
- Rétroactions mesurées : nuages bas +0,28 W/m²/K entre 15 et 35 °C (observations ~+0,2–0,3 : pas de raison de forcer) ;
  OLR ciel clair ~2,5 W/m²/K (Koll & Cronin 2018 : ~2,2). 🦣 : équilibre stable ~13,5 °C, seuil instable ~3,5 °C.
Banc (bench_j3.out) : **10/21** — 📱 14,88 · 🚂 13,47 · 🛖 13,33 · 🦣 14,07 · 🦠 18,2 · 🪼 17,9 · 1b 23,9 · 1c 23,6.
Restent : Phanérozoïque chaud 15–20 °C (cibles PhanDA 21–39) — à CO₂ configuré, pas atteignable avec une sensibilité
conforme aux observations (« Éocène équable ») ; 💀 21,6 ; snowballs −75/−78 (cibles −60/−50 ; vraie CIA CO₂ absente) ;
🪸 bascule en snowball (CO₂ 1,1 %, CH₄ 138 ppm massique, Soleil 0,82) ; clic sur 🦣 → snowball (pas de glaciaire) ;
sorties de snowball par clic (1b/1c) restent froides (−24 °C).
⚠️ vérifiés sans source trouvée : SEASONAL_AMP_MID_OCEAN_K (4 K), R_EFF_GLACE (30 µm) ; T_ENCLUME 220 K partiellement
appuyé (Kuang & Hartmann 2007 ; contesté par FiTT, Seeley/Romps). À brancher : CIA CO₂ mesurée (HITRAN CIA).
Littérature sur les oscillations : Trias inférieur (Payne et al. 2004 ; instabilité interne / cycles limites) ; Quaternaire.

## Essai 6 (2026-10-13 nuit, commité : API 87879f4, CO2 000ff47) — spectroscopie complétée
- Données manquantes trouvées : hitran_fetch_lines.py sautait H₂O 850–1200 cm⁻¹ (FENÊTRE) et CO₂ > 850 cm⁻¹. Ajoutés via
  HAPI (venv du scratchpad) : +1 505 raies H₂O, +39 926 raies CO₂. CIA CO₂–CO₂ MESURÉE (HITRAN 2024) : data/cia_CO2_CO2.js,
  tablesCIA, worker κ = k·n². Contrôle 288 K : OLR 240,1, ciel clair 268,5, pente 2,38 W/m²/K, forçage ×256 −35,6.
- 🦣 glaciaire (clic) : bilan max −0,4 W/m² vers 8 °C dans l'état glaciaire → bascule en snowball (marge trop mince).
- Bancs : FROID 45 → 8/21 (📱 15,8, 🚂 14,7, 🪸 6,8 ✓, 🦠 48) ; FROID 55 → 7/21 (📱 14,2 ✓, 🚂 12,8, 🪸 snowball). Défaut 50.
**CHANTIER SUIVANT (proposé)** : le transfert IR échantillonne σ en UN point par intervalle spectral et multiplie toutes les
σ par √(P/P₀) (« [OBS/CALIB] », CONFIG_COMPUTE.pressureBroadening). Correct = distribution de k corrélée (tables k(T, P) par
intervalle, précalculées hors ligne avec HAPI). Suspect principal de l'Archéen trop chaud (2,26 atm → σ ×1,5 partout).
