# Audit des réglages hérités — 13 octobre 2026

Fait en relisant **tout le moteur** (33 fichiers d'`API_BILAN/`, ~9 000 lignes hors données), fonction par
fonction, pour écrire `doc/equation.html` : chaque équation y a une carte, classée P / M / F / C / N / ⚠️
(physique, mesure, fourchette, calage, numérique, sans source — même légende que
`AUDIT_PARAMETRES_SOURCES.md`). Ce document-ci est la **liste d'action** qui en sort : ce qui a été corrigé
le jour même, banc à l'appui, et ce qui reste, par ordre d'effet probable.

Banc : `cd CO2 && python3 scripts/bench_headless/run.py bench19.js`, jauges FROID 50 · CHAUD 50 · SUBTIL 70 ·
HYSTERESIS 100.

---

## 1. Corrigé le 13 octobre 2026

| | quoi | avant | après | classe |
|---|---|---|---|---|
| C1 | masse molaire de l'air sec (vapeur saturante q_sat ∝ M_H₂O / M_sec) | Σm·M / Σm, moyenne pondérée par la masse : 29,08 g/mol sur 📱 | Σm / Σ(m/M) : 28,96 | bug → **P** |
| C2 | fractions des zones de latitude (glace, solubilité du CO₂) | 0,13 / 0,37 en config | 1 − sin 60° = 0,134 ; sin 60° − sin 30° = 0,366, calculées une fois (`EARTH.*_ZONE_FRAC`) | arrondi → **P** |
| C3 | noyaux de condensation de l'époque (`rapportCCN`) | loi sulfate × « proxy » (0,15 + 0,85·w_O₂·(1 + 4·f_forêt)·anthro) / référence moderne | loi sulfate mesurée seule (McCoy 2018) | **C/⚠️ retiré** |
| C4 | `EARTH.CH4_EDS_SCALE` | multiplicateur de κ_CH₄ = 1, « tunable [0,3 ; 1,5] pour caler sur Haqq-Misra » | retiré ; le retrait du CH₄ (attribution) met sa fraction à 0 | **C retiré** (identité) |
| C5 | surface en fusion (albédo de lave) | rampe 1 000 K → 2 373 K (sans source) sur la T de **graine** | fraction fondue de la péridotite (solidus 1 359 K, liquidus 2 053 K, Katz 2003) à la T **courante** | ⚠️ → **P + M** |
| C6 | limite de la grille verticale fine (`calculateTropopauseHeight`) | 1,0261 × RT/Mg, [CALIB] « 1,03 + (1,0 − 1,03) × 0,13 » | RT/Mg ; la tropopause, elle, sort du profil | **C → N** |

Pourquoi C3 compte : l'O₂ n'est pas un noyau de condensation (activation de Köhler, κ-Köhler). Le proxy divisait
le nombre de gouttes par ~2,5 sur toute époque sans oxygène, donc assombrissait les nuages de l'Archéen et du
Protérozoïque ; et sa rampe anthropique comparait des années du calendrier (1900, 1980) à `EPOCH['▶']`, qui est un
âge géologique. Six nombres sans source disparaissent (`CCN_BASE`, `CCN_O2_WEIGHT`, `BIOMASS_GAIN`, `ANTHRO_*`,
`MODERN_REF_O2`, `MODERN_REF_FOREST`).

### Effet au banc

**9/21 → 10/21 dans leur fourchette.** C1 + C2 seuls : quelques dixièmes de degré (🦠 −0,8 °C), rien ne bascule.
Le reste vient de C3 (plus de gouttes sur les époques sans oxygène, donc des nuages plus brillants) ; C4 et C6 ne
changent rien de mesurable, C5 ne touche que 🔥.

| époque | fourchette | avant | après | |
|---|---|---|---|---|
| 🦠 Archéen | 5 – 25 | 49,3 | 46,0 | toujours trop chaud (−3,3 K) |
| 🪸 Protérozoïque | 0 – 15 | 5,3 ✓ | **−78,7** | **bascule en snowball** — il était au bord (à FROID 55 % il basculait déjà) |
| 1b / 1c sorties | 20 – 50 | 28,7 / 28,8 ✓ | 25,9 / 25,6 ✓ | |
| 🪼 | 15 – 25 | 19,3 ✓ | 15,7 ✓ | |
| 🍄 Carbonifère | 26 – 39 | **−69,8** (snowball) | 15,3 | **sort du snowball**, encore trop froid |
| 💀 | 14,3 – 20,7 | 22,7 | 20,0 ✓ | entre dans sa fourchette |
| 🦕 | 24 – 32 | 18,2 | 16,0 | plus froid |
| 🦤 / 🐊 | 25 – 32 / 30 – 39 | 19,5 / 21,2 | 19,4 / 21,4 | inchangés, trop froids |
| 🏔 | 21 – 25 | 16,3 | 15,7 | |
| 🦣 / 🛖 / 🚂 | | 14,5 / 13,5 / 13,5 ✓ | 14,2 / 13,7 / 13,6 ✓ | 🦣 au premier clic toujours en snowball |
| 📱 2000 | 13,9 – 14,9 | 15,1 | **14,8 ✓** | entre dans sa fourchette ; tictime 2025 : 16,5 |
| ⛄ / 🏂 | −60 – −50 | −78,2 / −74,9 | inchangés | snowballs toujours trop froids |

Lecture : retirer le proxy refroidit tout ce qui précède l'oxygénation, et 🪸 tombe du bon côté de la frontière
vers le mauvais. Ce n'est pas un argument pour garder un facteur sans physique : 🪸 était déjà au bord (il
basculait à FROID 55 %), et l'Archéen reste 21 K trop chaud — l'erreur dominante est ailleurs (√(P/P₀), § 2.1). 🍄 et 💀 en
profitent.

---

## 2. Ce qui reste, par ordre d'effet probable

### 2.1 Spectroscopie — le chantier « distribution de k corrélée » (déjà proposé)

- **√(P/P₀) sur toutes les sections efficaces** (C). Limite des raies fortes saturées, appliquée aussi aux raies
  faibles de la fenêtre, et posée sur des tables déjà calculées à 1 atm. ⚠️ Ce n'était PAS la cause de l'Archéen trop
  chaud : mesuré le 13 octobre, sans le facteur tout est plus chaud (📱 23,8 °C, 🦠 56 °C) — il réduit surtout
  l'absorption en altitude. L'Archéen venait de sa config (N₂ à 2,2 atm, § 4).
- **σ échantillonnée en un point par intervalle** (N) : un intervalle de plusieurs cm⁻¹ représenté par sa valeur
  centrale.
- **Fonctions de partition Q(T)** (⚠️) : rotateur rigide sans vibrations (∝ T pour CO₂, T^1,5 pour H₂O et CH₄).
  À remplacer par les tables TIPS de HITRAN, dans la même passe que les tables k(T, P) (HAPI).
- **γ_self prend l'exposant n_air** (approximation, faible).

Remède unique : tables k(ν, T, P) précalculées hors ligne avec HAPI (TIPS compris), ~8 termes par intervalle.

### 2.2 Transport de chaleur vers les pôles posé par époque (C)

`EPOCH['🥶'] = { dT_pol, dT_mid, dT_trop }` : moderne = gradient observé (+20 / +5 / −5 K), mais les autres époques
ont des valeurs **posées** de 10 à 20 K sans calcul. C'est elles qui décident où la glace se forme, donc les
bascules (🦣, entrées et sorties de snowball). Remède : un bilan d'énergie méridien diffusif à 3 zones
(Budyko-Sellers / North 1975) qui donne T_z à partir de l'insolation par zone (déjà calculée exactement,
`EARTH.zoneAnnualInsolation`), de l'albédo par zone et d'un coefficient de diffusion mesuré sur la Terre actuelle.
Gros chantier, mais c'est le seul vrai « calage par époque » qui reste dans la physique du climat.

### 2.3 Albédo de surface : forêts, déserts, planète sèche (C / ⚠️)

- forêt = 🌱 · terres · clamp((T − 268)/25, 0,4, 1) ; désert = terres·(1 − P_an/1000)(1 − RH/0,6) + 0,6·terres·v_T·v_RH,
  avec P_an = x_sat · f_océan · (1 + (T − 288)/50) · 2·10⁵ mm/an. **Aucun de ces nombres n'a de source.**
  Effet faible sur 📱 (le désert y pèse ~1 % de l'albédo) mais ils fixent la surface des époques sans plantes.
  Proposition : couverture des terres MESURÉE aujourd'hui (MODIS land cover) pour 📱 / 🚂 / 🛖, et pour les
  époques sans plantes un sol nu d'albédo mesuré (le désert n'est pas une fonction de T qu'on sait écrire en 1D).
- **planète sèche** : A ← A · min(1, h_eau / 10 m). Sert à rendre ⚫ (corps noir, fourchette −19 / −17 °C = albédo nul)
  noir, mais par la masse d'eau : toute planète à moins de 10 m d'eau répartie perdrait son albédo, surface et nuages
  compris, alors qu'un sol sec réfléchit. À remplacer par une propriété déclarée de ⚫ (corps noir par définition).
- **glace d'équilibre** (0,1 · rampe 20 K ; 0,9 · (T_gel − T)/20) et **surface que l'eau peut couvrir**
  (min(0,9, h_eau / 10 m)) : sans source.
- albédo de la lave 0,05 et de la « boue de neige » 0,48 (`🌫️❄️`, snowballs) : sans source.

### 2.4 Nuages : trois valeurs de mémoire

- rayon des cristaux 30 µm (« MODIS 20–40 µm », King et al. 2013, à relever) ;
- température des enclumes 220 K (Hartmann & Larson 2002, à vérifier) ;
- bornes 0,03–30 de la distribution des τ des nuages hauts, « ajustées sur les tiers CALIPSO ».
- population des nuages bas (toutes profondeurs également représentées) : hypothèse déclarée.

### 2.5 Glace et saisons

- amplitudes saisonnières 15 / 25 / 4 / 3 K : citées ERA5 / Peixoto & Oort, non relevées ;
- facteur sin ε / sin 23,44° sur ces amplitudes : approximation ;
- largeur de la rampe de mer gelée 1–6 K (jauge HYSTERESIS) : source faible (« quelques K en paramétrisation
  agrégée »).

### 2.6 Ozone sans oxygène

u = 0,30 cm · (p_O₂ / 0,2095)^0,19 : loi de puissance par deux points (Segura 2003) ; un modèle 3D donne deux fois
moins à 1 % d'O₂ (Cooke 2022). Joue sur toutes les époques anoxiques (🦠 🪸 ⛄).

### 2.7 Code qui calcule sans effet (à retirer ou à refaire — aucun chiffre ne bouge)

- **précipitations** (seuil 0,75 + 0,05(T − 288)/20, rampe /0,2, (T/288)^1,2 (RH/0,7)) et **partage glace / liquide
  de l'hydrosphère** (rampes de 20 K, 0,10, −1 K/atm) : n'agissent qu'à l'initialisation ou sur le stock 🍰💧🧊
  affiché ; la vapeur est ensuite RH_s · q_sat. Une boucle d'Init à 5 itérations pour rien.
- **pompe de Henry** à pas 0,1 (sans source) : mesurée inerte (l'océan est réensemencé à chaque calcul).
- **capacités radiatives 🌈** : recalculées à **chaque pas** du solveur, raie par raie à 296 K, sur l'ancien profil
  isotherme exponentiel (pas celui du transfert). Diagnostic coûteux et incohérent : à refaire sur le profil
  (une fois, à la convergence) ou à retirer.
- **forçages de convention** (`physics/climate.js` : 5,35 ln, 0,036 √, 15 + 5 W/m², λ = 0,8 ; `🔺📛💧` = 6 ln(q/10⁻⁴))
  et `calculateCloudCoverage` (marquée DEPRECATED) : affichage de l'organigramme seulement. Le terme H₂O n'a pas de
  source. Le modèle ne s'en sert pas : à étiqueter « convention » ou à retirer de l'interface.
- **« tropopause » affichée** (CO2 `main.js`, `plot.js`) = RT/Mg, la hauteur d'échelle : ce n'est pas la tropopause.
  La vraie est `profilAtmosphere(...).iTrop` ; à exposer dans DATA (déjà noté dans l'audit de l'onglet scientifique).

### 2.8 Hypothèses déclarées (pas des erreurs)

Surface noire dans l'infrarouge (émissivité 1 ; l'eau vaut 0,96–0,99) ; stratosphère grise isotherme ;
Q_ext ≈ 2 et Q_abs ≈ 1 pour les gouttes ; recouvrement maximal / aléatoire des nuages ; manteau et noyau en un
seul réservoir ; raies HITRAN et non HITEMP au-delà de ~1 000 K ; continuum H₂O absent hors 400–1 250 cm⁻¹.

---

## 3. Structure du code

Le moteur est déjà découpé par thème (33 fichiers). Trois fichiers ont grossi au-delà d'une responsabilité :

| fichier | lignes | contient | découpage proposé |
|---|---|---|---|
| `radiative/calculations.js` | 1 290 | profil vertical + nuages, grille λ/z, tables σ / CIA, dispatch, attribution, capacités | `radiative/profil.js` (profil + nuages), `radiative/grille.js`, `radiative/sections_efficaces.js`, `radiative/attribution.js` |
| `convergence/calculations_flux.js` | 1 275 | solveur Search/Dicho + 4 détecteurs d'oscillation + init intérieur | `convergence/solveur.js`, `convergence/detecteurs.js` |
| `albedo/calculations_albedo.js` | 1 065 | dont ~250 lignes de journal de versions et ~150 de logs de diagnostic | sortir le journal en tête dans un CHANGELOG, isoler `rapportCCN` dans `aerosols/` |

Découpage sans changement de chiffre (banc identique attendu) — à faire dans une session à part.

---

## 4. Suite du 13 octobre (après le commit 82bf013)

Méthode : sonde sur quelques époques (bilan détaillé, `scratchpad/sonde.js`), balayage ΔF(T) à température imposée.

- **Jauges** : SUBTIL 100 % ne bouge rien (+0,1 à +0,5 K) ; FROID 40 % réchauffe 🦕 🐊 de 2 K mais sort 📱 (17,3 °C) ;
  HYSTERESIS sans effet. L'écart est ENTRE époques : les jauges ne peuvent pas le corriger.
- **Sensibilité** : CO₂ ×2 sur 📱 → +2,8 K (AR6 : 2,5–4). Le froid du Phanérozoïque chaud n'est pas un défaut de sensibilité
  rapide : c'est le gradient pôle–équateur posé (🥶, moderne) et l'absence de transport méridien (§ 2.2).
- **🦠 Archéen** : N₂ ramené de 1,0e19 kg (2,2 atm, le maximum, posé « pour lutter contre le faint sun ») à 4,0e18
  (borne basse de sa fourchette, ≈ 1 PAL ; Marty et al. 2013 : 0,5–1,1 bar ; Som et al. 2016 : 0,23 ± 0,23 bar), CO₂ CH₄ O₂
  dans le même rapport (fractions molaires inchangées). 🦠 46,0 → 10,4 °C, dans [5 ; 25].
- **Nuages froids** : sous −10 °C l'eau nuageuse montait à 1–8 kg/m² (τ jusqu'à 500) — le nuage n'atteignait jamais le
  seuil de pluie. Hypothèse déclarée : la glace précipite (seuil f_liq · LWC_pluie). Sans effet sur les nuages liquides ;
  marge de 🪸 −4 → −1,9 W/m² à 5 °C.
- **🪸** : toujours sans équilibre chaud (−1,9 W/m² au mieux). Écart principal : nuages bas plus épais au froid
  (A_bas 0,44 à 5 °C contre 0,405 sur 📱), car W ∝ 1/Γ_l avec un seuil de pluie fixe — dépendance en T inverse des
  observations dans le froid. À instruire : profondeur des nuages bas limitée par la couche limite.
- **À noter** : Protérozoïque et Phanérozoïque ont plus de N₂ qu'aujourd'hui (5,0–5,1e18 contre 3,97e18 kg) : origine à
  vérifier (même histoire que 🦠 ?).

## 5. Jauges, ☃, N₂ (13 octobre, suite)

- **Jauges FROID / CHAUD inversées** : 100 % = le plus chaud (🔺). Combinaisons opposées (100/0, 75/25, 25/75) : le niveau
  bouge, l'écart 🦕 − 📱 reste +0,6 à +1,2 K (cible +10 à +17). Garder 📱 à 14,8 °C impose ≈ 50/50.
- **HYSTERESIS** 0 % = 100 % au centième sur ☃ et 🪸 : la rampe de mer gelée (T globale < 271,15 K) n'agit qu'après la
  bascule, déclenchée par la glace des trois zones. Candidate au retrait.
- **☃ (hysteresis 1a)** : 72 ppm = seuil de l'ancienne physique. Graine : 500 ppm → snowball, 1 000 → 7,6 °C, 2 000 → 11,4.
  Nouvelle frontière entre 500 et 1 000 ppm, DANS la fourchette [500 ; 2 000]. Dichotomie à refaire — par la chaîne de clics
  depuis 🪸, donc après 🪸.
- **🪸** : 20 000 ppm (haut de sa fourchette de config, sans source) → 6,9 °C. Non appliqué : mesure du CO₂ vers 2,5 Ga à
  relever (paléosols, Kanzaki & Murakami 2015, de mémoire plusieurs dizaines de PAL).
- **N₂ du Précambrien et du Phanérozoïque** : pas des mesures, des RESTES pour garder la masse totale à ~5,15e18 kg (pression
  ≈ 1 bar constante). Hypothèse standard : N₂ ≈ 1 PAL constant. Sur 🪸 : 0,77 atm, premier pas −1,9 au lieu de −0,9 W/m².
  À trancher par l'utilisateur.
- **Piste « couche limite » (nuages bas)** : ne mordrait pas — nuage de 🪸 ≈ 440 m, couche limite marine ≈ 1 km. Et la
  décroissance de l'eau nuageuse avec T dans le régime chaud (W ∝ 1/Γ_l) est le sens observé (Terai et al. 2016) ; le régime
  froid est traité par la précipitation de la glace.
