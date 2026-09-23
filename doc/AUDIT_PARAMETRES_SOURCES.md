# Audit des 114 paramètres scalaires du calcul — source, unité, rôle, sensibilité

Fait le 2026-09-22, en réponse à une consigne qui devient la règle du projet :

> **QUE DE LA PHYSIQUE/CHIMIE. Et quand la physique/chimie ne sait pas, des observations en labo.
> Et si aucun des deux n'existe, une fourchette de la littérature.**
> Pas de calage pour tomber juste avec le résultat attendu. Et une évaluation du GIEC n'est pas
> une mesure.

## Comment ce tableau a été fait

**Rien n'est classé de mémoire.** Deux passes mécaniques :

1. **Inventaire** — balayage de tous les `API_BILAN/*/*.js` : 382 affectations numériques et
   littéraux en ligne. Parmi eux, **114 paramètres scalaires nommés** vivent dans `CONST`, `CONV`,
   `EARTH` et `DATA['🎚️'].CLOUD_SW` — ce sont ceux de ce tableau. Les 268 autres sont des littéraux
   posés directement dans les formules ; ils restent à traiter (voir la fin).
2. **Sensibilité** — chaque paramètre perturbé de **+10 %**, un par un, ΔT mesurée au banc headless
   sur trois époques : 📱 Aujourd'hui (15,25 °C), 🛖 Holocène (13,98 °C), 🪼 Paléozoïque (19,99 °C).
   342 runs de convergence. Un « · » veut dire moins de 0,005 °C.

La colonne « d'où vient le nombre » est écrite à la main, ligne par ligne. **Quand je n'ai pas de
source, c'est écrit ⚠️ SANS SOURCE — je n'en ai inventé aucune.**

## Les colonnes

`val` la valeur · `u.` l'unité · `c` la classe de source · `ΔT` l'effet mesuré à +10 %
sur 📱 / 🛖 / 🪼, « · » = moins de 0,005 °C.

## Les classes (colonne `c`)

| | sens | ce que ça vaut |
|---|---|---|
| P | physique / chimie | dérivable d'une équation, ou exact par définition SI. La dérivation est écrite dans la ligne. |
| M | mesure | laboratoire ou observation, avec sa source nommée. |
| F | fourchette | plage de littérature déclarée dans `fine_tuning_bounds.js`. Une ignorance assumée. |
| C | **CALAGE** | posé pour que le modèle tombe juste. **À éliminer.** |
| N | numérique | garde-fou, tolérance, borne de domaine. Aucune physique, et ne doit jamais mordre. |
| ⚠️ | **SANS SOURCE** | rien. Ni équation, ni mesure, ni fourchette, ni commentaire. |

## ⚠️ Comment lire la colonne sensibilité

**+10 % n'est pas une incertitude.** Pour une température absolue ou une distance, +10 % est un
changement de planète, pas une marge d'erreur : `EVAPORATION_T_REF` à +10 % fait passer la
référence de 288 K à 317 K, d'où les −75 °C affichés. Ces lignes-là ne sont pas des problèmes.

La sensibilité ne devient un **problème** que croisée avec la classe : un paramètre **⚠️** ou **C**
qui déplace la température de plus de 0,1 °C, c'est un nombre sans fondement qui décide du
résultat. C'est la liste d'action en fin de document.

---

## Le compte

| classe | nombre | part |
|---|---|---|
| **P** — physique dérivable | 22 | 19 % |
| **M** — mesure | 33 | 29 % |
| **F** — fourchette déclarée | 2 | 2 % |
| **C** — **CALAGE** | 5 | 4 % |
| N — numérique | 10 | 9 % |
| **⚠️** — **SANS SOURCE** | **42** | **37 %** |

**42 paramètres sur 114 n'ont aucune source** (39 depuis la suppression des 3 références mortes, § plus bas). Et 64 sur 114 ne déplacent aucune des trois
époques de plus de 0,005 °C à +10 % : ils sont soit morts, soit sans effet mesurable.

---

### `CONST` — constantes fondamentales et spectroscopiques (29)

Presque tout est ici en classe **P** : le SI 2019 a rendu *exactes par définition* h, k_B, c et N_A — donc R et σ aussi, qui s'en dérivent. Il n'y a rien à sourcer pour celles-là ; il y a juste à ne pas les arrondir.

| paramètre | val | u. | c | ΔT&nbsp;📱/🛖/🪼 | à quoi ça sert | d'où vient le nombre |
|---|--:|:-:|:-:|--:|---|---|
| `BOLTZMANN_KB` | 1.381e−23 | J/K | P | -88/-87/-93 | Constante de Boltzmann dans B_λ(T). | SI 2019 : **exacte par définition** du kelvin, 1,380649e−23. |
| `PLANCK_H` | 6.626e−34 | J·s | P | +28/+30/+38 | Constante de Planck dans B_λ(T) — toute la loi du corps noir en dépend. | SI 2019 : **valeur exacte par définition** du kilogramme, 6,62607015e−34. Rien à sourcer, c'est une définition. |
| `SPEED_OF_LIGHT` | 2.998e8 | m/s | P | +18/+20/+25 | Vitesse de la lumière dans B_λ(T) et la conversion λ↔ν. | SI : **exacte par définition** du mètre, 299 792 458. ⚠️ le code écrit 2,998e8 — arrondi à 4 chiffres, erreur relative 7e−5. |
| `T0_WATER` | 273.15 | K | P | +7.02/+8.44/+11 | Origine de l'échelle Celsius, référence de Clausius-Clapeyron. | Définition : 0 °C = 273,15 K. |
| `R_GAS` | 8.314 | J/mol/K | P | +4.30/+5.12/+10 | Loi des gaz parfaits : pression, densité, hauteur d'échelle. | **Dérivée** R = N_A·k_B, exacte depuis le SI 2019 : 8,314462618. ⚠️ le code écrit 8,314. |
| `M_N2` | 0.02801 | kg/mol | P | -1.58/-2.07/-5.07 | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 2 × 14,007 (N) = 0.028014 kg/mol. |
| `RV_WATER` | 461.5 | J/kg/K | P | +1.47/+1.90/+4.73 | Constante spécifique de la vapeur d'eau — Clausius-Clapeyron, hauteur d'échelle H₂O. | **Calculable, et devrait l'être dans le code** : R_GAS / M_H2O = 8,3145 / 0,018015 = 461,5. Posée en dur aujourd'hui. |
| `M_H2O` | 0.01802 | kg/mol | P | -2.13/-2.75/-3.96 | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 2 × 1,008 + 15,999 = 0.018015 kg/mol. |
| `L_VAPORIZATION` | 2.5e6 | J/kg | M | -1.41/-1.68/-3.09 | Chaleur latente dans Clausius-Clapeyron. | Enthalpie de vaporisation de l'eau à 0 °C : 2,501e6 J/kg (IAPWS-95 / tables NIST). Mesure calorimétrique. |
| `P0_WATER` | 611.2 | Pa | M | -1.39/-1.86/-2.61 | Pression de vapeur saturante de référence dans Clausius-Clapeyron. | Pression de vapeur saturante de l'eau à 273,15 K. Mesure de laboratoire, formulation IAPWS-95 : 611,213 Pa au point triple. |
| `RHO_WATER` | 1000 | kg/m³ | M | -0.46/-0.25/-1.87 | Masse volumique de l'eau — conversions masse ↔ volume de l'hydrosphère. | Eau liquide à 4 °C : 999,97 kg/m³ (IAPWS-95). L'arrondi à 1000 vaut 3e−5. |
| `KELVIN_TO_CELSIUS` | 273.15 | K | P | +0.23/+0.22/+0.92 | Conversion d'affichage. | Définition, = T0_WATER. |
| `M_O2` | 0.032 | kg/mol | P | -0.46/-0.65/-0.05 | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 2 × 15,999 (O) = 0.031998 kg/mol. |
| `CP_AIR` | 1005 | J/kg/K | M | -0.07/-0.08/-0.20 | Capacité thermique de l'air — gradient adiabatique Γ = g/c_p. | Air sec à 300 K et 1 atm : 1004,7 J·kg⁻¹·K⁻¹ (tables NIST / Lemmon 2000). Mesure calorimétrique. |
| `M_CO2` | 0.04401 | kg/mol | P | +0.01/·/+0.02 | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 12,011 (C) + 2 × 15,999 = 0.044009 kg/mol. |
| `STEFAN_BOLTZMANN` | 5.67e−8 | W/m²/K⁴ | P | -0.01/·/· | σT⁴ : émission de la surface et température effective. | **Dérivée**, pas mesurée : σ = 2π⁵k_B⁴/(15h³c²). Exacte depuis le SI 2019. CODATA 2018 : 5,670374419e−8. |
| `M_CH4` | 0.01604 | kg/mol | P | ·/·/· | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 12,011 + 4 × 1,008 (H) = 0.016043 kg/mol. |
| `SOLAR_CONSTANT` | 1361 | W/m² | M | ·/·/· | Constante solaire de référence (valeur moderne). | TSI mesurée par radiomètre spatial : 1360,8 ± 0,5 W/m² (Kopp & Lean 2011, TIM/SORCE — **[koppLean2011] déjà en biblio**). Cohérente avec L☉/(4πAU²). |
| `MAX_PLANCK_SAFE` | 1e30 | W/m³ | N | ·/·/· | Plafond anti-débordement sur B_λ(T). | Garde numérique. Aucune physique — et il ne doit jamais mordre. |
| `M_AR` | 0.03995 | kg/mol | P | ·/·/· | Masse molaire — masse molaire de l'air, densité, fractions molaires ↔ massiques. | **Calculable** depuis les masses atomiques standard IUPAC 2021 : 39,948 (Ar) = 0.039948 kg/mol. |
| `L_V` | 40660 | J/mol | M | ·/·/· | Chaleur latente molaire, autre usage. | Enthalpie de vaporisation à 373,15 K : 40,66 kJ/mol (NIST). ⚠️ **C'est la même grandeur physique que L_VAPORIZATION, à une autre température** (2,501 vs 2,257 MJ/kg). Les deux coexistent sans que le code le dise. |
| `T_BOIL` | 373.15 | K | M | ·/·/· | Seuil d'ébullition dans le cycle de l'eau. | Ébullition de l'eau à 101 325 Pa. IAPWS-95 : 373,124 K. La valeur 373,15 est l'ancienne définition. |
| `T_LAVA_START` | 1000 | K | ⚠️ | ·/·/· | Début de la transition « surface en fusion » (rendu et albédo). | ⚠️ SANS SOURCE. 1000 K = 727 °C. Le solidus d'un basalte est plutôt ~1000–1100 °C ; celui d'une péridotite ~1100 °C. |
| `T_LAVA_COMPLETE` | 2373 | K | ⚠️ | ·/·/· | Fin de la transition, surface entièrement fondue. | ⚠️ SANS SOURCE. 2373 K = 2100 °C. Le liquidus d'un basalte est ~1200 °C, celui d'une komatiite ~1600 °C. 2100 °C n'est le liquidus de rien de terrestre. |
| `LAMBDA_CO2_CENTER` | 1.5e−5 | m | M | ·/·/· | Repère d'affichage de la bande CO₂ sur le spectre. | Centre de la bande ν₂ (pliage) du CO₂ : 667,4 cm⁻¹ = 14,98 µm. Spectroscopie, HITRAN. |
| `LAMBDA_H2O_1` | 6.3e−6 | m | M | ·/·/· | Repère d'affichage de la bande H₂O courte. | Bande ν₂ (pliage) de H₂O : 1594,7 cm⁻¹ = 6,27 µm. Spectroscopie, HITRAN. |
| `LAMBDA_H2O_2` | 1.7e−5 | m | ⚠️ | ·/·/· | Repère d'affichage de la bande H₂O longue. | ⚠️ **Ce n'est pas un centre de bande.** La bande rotationnelle pure de H₂O est un continuum de raies de ~0 à 600 cm⁻¹, sans centre. 17 µm = 588 cm⁻¹ est un repère graphique, pas une raie. |
| `LAMBDA_CH4_1` | 7.7e−6 | m | M | ·/·/· | Repère d'affichage de la bande CH₄ thermique. | Bande ν₄ du CH₄ : 1306 cm⁻¹ = 7,66 µm. Spectroscopie, HITRAN. |
| `LAMBDA_CH4_2` | 3.3e−6 | m | M | ·/·/· | Repère d'affichage de la bande CH₄ proche-IR. | Bande ν₃ du CH₄ : 3019 cm⁻¹ = 3,31 µm. Spectroscopie, HITRAN. |

### `CONV` — conversions et références (14)

| paramètre | val | u. | c | ΔT&nbsp;📱/🛖/🪼 | à quoi ça sert | d'où vient le nombre |
|---|--:|:-:|:-:|--:|---|---|
| `AU_M` | 1.496e11 | m | P | -14/-76/-83 | Distance Terre-Soleil — flux solaire reçu = L☉/(4πd²). | UA : **exacte par définition** depuis la résolution UAI 2012, 149 597 870 700 m. |
| `STANDARD_ATMOSPHERE_PA` | 101325 | Pa | P | +0.83/+1.11/+1.33 | Pression de référence — élargissement par la pression, conversions. | Atmosphère standard : **exacte par convention**, 101 325 Pa (ISO 2533, 10ᵉ CGPM 1954). |
| `CCN_SULFATE_REF_KG` | 1.05e9 | kg SO₄ | M | +0.03/+0.02/+0.01 | Référence sulfate — normalise la loi sulfate→CCN et le terme de 🍰💭. | Charge atmosphérique de nss-sulfate de l'an 2000 : 1,05 Tg (Tsigaridis et al. 2006 ACP 6:5143, Table 5 — **[tsigaridis2006] en biblio**). Simulation contrainte par mesures, recoupée par Textor 2006 et Schulz 2006. |
| `molar_mass_air_ref` | 0.029 | kg/mol | P | ·/·/· | Masse molaire de l'air de référence (repli). | **Calculable** depuis la composition : 0,7808·M_N2 + 0,2095·M_O2 + 0,0093·M_AR + 0,0004·M_CO2 = 0,028965 kg/mol. Le modèle la recalcule par époque ; cette valeur n'est qu'un repli. |
| `SECONDS_PER_DAY` | 86400 | s | P | ·/·/· | Conversion de durée. | Définition : 86 400 s. |
| `TAU_VAPOR_GLOBAL_S` | 864000 | s | M | ·/·/· | Temps de résidence de la vapeur d'eau — taux de précipitation P = W/τ. | Temps de résidence mesuré par bilan isotopique et par PWV/précipitations : 8–10 jours (van der Ent & Tuinenburg 2017, HESS 21:779). Le code prend 10 j. |
| `P_ANN_SCALE_MM_AN` | 200000 | mm/an | N | ·/·/· | Échelle d'affichage des précipitations annuelles. | Échelle graphique, pas de physique. |
| `O2_REF_MASS` | 1e18 | kg | ⚠️ | ·/·/· | Masse d'O₂ de référence (normalisation). | ⚠️ SANS SOURCE. 1e18 kg est un ordre de grandeur rond, pas une mesure. L'O₂ atmosphérique actuel vaut 1,18e18 kg. |
| `CH4_REF_MASS` | 1e13 | kg | ⚠️ | ·/·/· | Masse de CH₄ de référence (normalisation). | ⚠️ SANS SOURCE. 1e13 kg, ordre de grandeur rond. Le CH₄ actuel vaut ~5e12 kg. |
| `CCN_O2_REF_KG` | 1.08e18 | kg | M | ·/·/· | Référence O₂ du terme CCN de 🍰💭. | Masse d'O₂ atmosphérique préindustrielle, = EPOCH[🚂][⚖️🫁] = 1,0815e18 kg. Traçable, mais ⚠️ **l'O₂ n'est pas un noyau de condensation** — c'est la FORMULE qui est sans fondement, pas la valeur. |
| `CCN_CH4_REF_KG` | 5.2e12 | kg | M | ·/·/· | Référence CH₄ du terme CCN de 🍰💭. | Ordre de grandeur du CH₄ moderne (4,99e12 kg sur 📱). Même réserve : ⚠️ le CH₄ n'est pas un CCN. |
| `H2O_VAPOR_REF` | 0.01 | kg/kg | ⚠️ | ·/·/· | Fraction massique de vapeur de référence. | ⚠️ SANS SOURCE. 0,01 est un chiffre rond. L'humidité spécifique moderne de surface vaut ~0,0067. |
| `ALPHA_OCEAN` | 0.3 | — | M | ·/·/· | Albédo de l'océan. | Albédo de l'océan en moyenne zonale et annuelle : 0,06–0,08 en incidence proche du zénith, ~0,10 en moyenne globale toutes incidences (Jin et al. 2004, Payne 1972). ⚠️ **0,3 est 3× trop haut** pour un albédo d'océan — à vérifier : la valeur ne sert peut-être pas à ça. |
| `SCALE_CLOUD` | 0.4 | — | ⚠️ | ·/·/· | Échelle du terme nuageux. | ⚠️ SANS SOURCE. 0,4, aucun commentaire, aucune référence. |

### `EARTH` — paramètres terrestres, cycle de l'eau, radiatif (49)

Le gros bloc, et le plus sale : le cycle de l'eau est presque entièrement composé de nombres ronds sans source.

| paramètre | val | u. | c | ΔT&nbsp;📱/🛖/🪼 | à quoi ça sert | d'où vient le nombre |
|---|--:|:-:|:-:|--:|---|---|
| `EVAPORATION_T_REF` | 288 | K | M | -76/-74/-81 | Température de référence des rampes du cycle de l'eau. | Température moyenne de surface moderne mesurée : 288 K. ⚠️ Sa sensibilité affichée (−75 °C à +10 %) n'a aucun sens : +10 % sur un kelvin absolu, c'est +29 K de planète. |
| `T_FREEZE_SEAWATER_K` | 271.15 | K | M | -67/-66/-72 | Température de congélation de l'eau de mer. | Mesure : −1,8 à −1,9 °C pour S = 35 g/kg (équation d'état TEOS-10 / UNESCO 1983). 271,15 K = −2,0 °C, arrondi. |
| `H2O_VAPOR_CAP_REF` | 0.0065 | kg/kg | ⚠️ | +1.51/+2.03/+3.46 | Plafond de fraction massique de vapeur à T_REF. | ⚠️ SANS SOURCE, **et c'est le paramètre non sourcé le plus sensible du modèle** : +10 % donne +1,5 °C sur 📱 et +3,5 °C sur 🪼. 0,0065 est proche de l'humidité spécifique de surface observée (~0,0067) mais rien ne le dit ni ne le source. |
| `CP_AIR_MOIST_J_KG_K` | 1005 | J/kg/K | M | +0.69/+0.93/+1.50 | c_p de l'air humide — gradient adiabatique Γ = g/c_p. | Tables NIST, air sec 1004,7. ⚠️ **Le nom dit « humide » mais la valeur est celle de l'air SEC** : c_p de l'air humide vaut 1005·(1 + 0,84·q) ≈ 1011 à q = 0,0067. Calculable, pas calculé. |
| `H2O_VAPOR_CAP_RATE_PER_K` | 0.065 | 1/K | ⚠️ | +0.03/-0.09/+1.43 | Croissance du plafond de vapeur avec T. | ⚠️ SANS SOURCE. 0,065 /K est suspicieusement proche des 6,5–7 %/K de Clausius-Clapeyron — **si c'est ça, il faut le CALCULER**, pas le poser : dq/q/dT = L/(R_v T²) = 2,5e6/(461,5 × 288²) = 0,065 K⁻¹. Coïncidence à trancher. |
| `OBLIQUITY_DEG_REF` | 23.44 | ° | M | +0.29/+0.27/+1.39 | Obliquité de référence des amplitudes saisonnières (rapport sin ε / sin ε_ref). | Même mesure que ci-dessus. |
| `ICE_FORMULA_MAX_FRACTION` | 1 | — | P | -0.87/-1.22/-1.00 | Plafond de la fraction de glace (1,0 = snowball autorisé). | Borne géométrique : une fraction ne peut pas dépasser 1. Le code documente le passage de 0,46 (artefact) à 1,0 — c'est la levée d'une contrainte artificielle, pas un réglage. |
| `SEASONAL_AMP_MID_K` | 25 | K | ⚠️ | -0.29/-0.42/-0.92 | Demi-amplitude saisonnière aux moyennes latitudes. | ⚠️ SANS SOURCE. **Et elle compte** : +10 % déplace 🪼 de −0,92 °C. Amplitude observée : ~10 K sur océan, ~25 K sur continent (Peixoto & Oort 1992). |
| `H2O_EDS_SCALE` | 0.82 | — | F | +0.16/+0.15/+0.30 | Multiplicateur global de l'absorption H₂O (κ_H₂O). | Jauge du barycentre, plage 0,60–1,00. Le code dit lui-même qu'elle remplace trois physiques absentes (continuum MT_CKD, recouvrement CO₂/H₂O, profil HR(z)) et qu'aucune mesure ne la fixe. C'est une ignorance déclarée, pas une source. |
| `SEASONAL_AMP_POL_K` | 15 | K | ⚠️ | +0.04/+0.04/-0.09 | Demi-amplitude du cycle saisonnier de T aux pôles (déclenchement de la glace). | ⚠️ SANS SOURCE dans le code. L'amplitude saisonnière polaire observée est bien plus grande (~30 K en Arctique continental, ~15 K sur l'océan Arctique). |
| `T_NO_POLAR_ICE_RANGE_K` | 20 | K | ⚠️ | +0.05/+0.04/· | Largeur de la rampe de fonte polaire. | ⚠️ SANS SOURCE. 20 K, chiffre rond. |
| `CIA_CO2_SCALE` | 0.01 | — | M | +0.01/·/+0.03 | Amplitude de l'absorption induite par collision du CO₂. | La CIA CO₂-CO₂ est mesurée en laboratoire et calculée ab initio (Gruszka & Borysow 1997 — **[gruszkaBorysow1997] en biblio** ; Wordsworth et al. 2010 — **[wordsworth2010]**). ⚠️ Mais le SCALE lui-même (0,01) est un facteur d'amplitude sans source : la physique donne la section efficace, pas un multiplicateur. |
| `CH4_EDS_SCALE` | 1 | — | N | +0.02/+0.01/+0.02 | Multiplicateur global de l'absorption CH₄. | Vaut 1,0 : neutre. Existe pour pouvoir caler, mais ne cale rien aujourd'hui. |
| `IRIS_STRENGTH` | 0.02 | — | ⚠️ | ·/·/-0.01 | Amplitude de l'effet « iris » (assèchement de la haute troposphère avec T). | ⚠️ SANS SOURCE. L'hypothèse iris est de Lindzen et al. (2001, BAMS 82:417) et reste **contestée** ; ces trois nombres n'en viennent pas. |
| `IRIS_T_SCALE_K` | 10 | K | ⚠️ | ·/·/+0.01 | Échelle thermique de l'effet iris. | ⚠️ SANS SOURCE. 10 K, chiffre rond. |
| `T_NO_POLAR_ICE_K` | 293.15 | K | N | ·/·/· | Seuil « plus de glace polaire » — DEPRECATED, hors chemin albédo/flux/h2o. | Legacy, le code le marque lui-même 🏷️ DEPRECATED. |
| `T_ICE_TRANSITION_RANGE_K` | 20 | K | ⚠️ | ·/·/· | Largeur de la rampe glace ↔ eau libre. | ⚠️ SANS SOURCE. 20 K, chiffre rond. |
| `POLAR_ZONE_FRAC` | 0.134 | — | P | ·/·/· | Fraction de la surface du globe au-delà de 60° de latitude (bilan 3 zones). | **Calculable** : sin(90°) − sin(60°) = 1 − 0,8660 = 0,1340. Géométrie sphérique, rien d'autre. |
| `MIDLAT_ZONE_FRAC` | 0.366 | — | P | ·/·/· | Fraction de surface entre 30° et 60° de latitude. | **Calculable** : sin(60°) − sin(30°) = 0,8660 − 0,5 = 0,3660. |
| `TROPICAL_ZONE_FRAC` | 0.5 | — | P | ·/·/· | Fraction de surface entre 0° et 30° de latitude. | **Calculable** : sin(30°) = 0,5. Les trois fractions somment à 1,000 par construction — c'est la vérification. |
| `SEASONAL_AMP_TROP_K` | 3 | K | M | ·/·/· | Demi-amplitude saisonnière aux tropiques. | Le code cite Peixoto & Oort 1992 ch. 7 (saisonnalité tropicale faible, inertie océanique). ⚠️ **[peixotoOort1992] n'est PAS dans la biblio** — citation à vérifier et à ajouter. |
| `OBLIQUITY_DEG_DEFAULT` | 23.44 | ° | M | ·/·/· | Obliquité par défaut si l'époque n'en déclare pas. | Obliquité actuelle mesurée : 23,4393° (éphémérides UAI ; Laskar et al. 1993 pour son histoire — **[laskar1993] en biblio**). |
| `EBM_B_W_PER_M2_K` | 2 | W/m²/K | M | ·/·/· | Pente OLR(T) de l'EBM linéaire de Budyko. | Ajustement EMPIRIQUE de l'OLR mesurée contre la température de surface : B = 1,45–2,2 selon la régression (Budyko 1969 — **[budyko1969] en biblio** ; Sellers 1969 — **[sellers1969]**). C'est une mesure, pas une équation. |
| `EBM_ALBEDO_REF` | 0.3 | — | M | ·/·/· | Albédo planétaire de référence de l'EBM 0D. | Albédo planétaire mesuré par CERES EBAF : 0,293 (Loeb et al. 2021 — **[loeb2021] en biblio**). 0,30 est l'arrondi usuel. |
| `SOLAR_CONSTANT_REF_W` | 1361 | W/m² | M | ·/·/· | TSI de référence de l'EBM 0D. | Kopp & Lean 2011 — voir CONST.SOLAR_CONSTANT. |
| `EVAPORATION_E0` | 0.001 | kg/m²/s | ⚠️ | ·/·/· | Taux d'évaporation de référence. | ⚠️ SANS SOURCE. L'évaporation globale mesurée vaut ~2,8 mm/j ≈ 3,2e−5 kg·m⁻²·s⁻¹ — 32× la valeur du code. |
| `EVAPORATION_T_SCALE` | 20 | K | ⚠️ | ·/·/· | Largeur de la rampe en température de l'évaporation. | ⚠️ SANS SOURCE. 20 K, chiffre rond. |
| `H2O_VAPOR_REALISTIC_MAX_REF` | 0.0052 | kg/kg | ⚠️ | ·/·/· | Second plafond de vapeur, « réaliste ». | ⚠️ SANS SOURCE, et redondant avec H2O_VAPOR_CAP_REF sans que la différence soit expliquée. |
| `H2O_VAPOR_REALISTIC_MAX_RATE_PER_K` | 0.013 | 1/K | ⚠️ | ·/·/· | Croissance du second plafond. | ⚠️ SANS SOURCE. 0,013 /K, sans rapport avec Clausius-Clapeyron. |
| `IRIS_FACTOR_MIN` | 0.7 | — | N | ·/·/· | Plancher du facteur iris. | Garde-fou, le code le dit : « évite sur-assèchement ». |
| `T_WATER_CYCLE_MIN_C` | -10 | °C | N | ·/·/· | Borne basse du domaine du cycle de l'eau. | Borne de domaine numérique. |
| `T_WATER_CYCLE_MAX_C` | 150 | °C | N | ·/·/· | Borne haute du domaine du cycle de l'eau. | Borne de domaine numérique. |
| `T_WATER_CYCLE_FREEZE_K_PER_ATM` | 1 | K/atm | M | ·/·/· | Abaissement du point de congélation par la pression. | Effet mesuré, et **calculable** par Clausius-Clapeyron sur la fusion : dT/dP ≈ −7,4e−3 K/bar pour l'eau pure. ⚠️ **le code met 1 K/atm, soit 135× trop**. |
| `T_WATER_CYCLE_MARGIN_GEL_K` | 5 | K | ⚠️ | ·/·/· | Marge avant gel. | ⚠️ SANS SOURCE. |
| `T_WATER_CYCLE_EVAP_LOW_K` | 323.15 | K | ⚠️ | ·/·/· | Seuil d'évaporation basse. | ⚠️ SANS SOURCE. 323,15 K = 50 °C, chiffre rond. |
| `T_WATER_CYCLE_HIGH_K_PER_ATM` | 5 | K/atm | M | ·/·/· | Élévation du point d'ébullition par la pression. | Effet mesuré/calculable : l'ébullition passe de 100 °C à 1 atm à 120 °C à 2 atm, soit ~20 K/atm près de 1 atm (tables IAPWS). ⚠️ **le code met 5 K/atm, 4× trop bas.** |
| `WATER_PARTITION_DELTA_T_K` | 5 | K | ⚠️ | ·/·/· | Largeur de la transition de partition liquide/glace. | ⚠️ SANS SOURCE. |
| `WATER_PARTITION_DELTA_P_ATM` | 1 | atm | ⚠️ | ·/·/· | Largeur de la transition en pression. | ⚠️ SANS SOURCE. |
| `PRECIP_BASE_RATE` | 5e−6 | kg/m²/s | ⚠️ | ·/·/· | Taux de précipitation de base. | ⚠️ SANS SOURCE. La précipitation globale mesurée (GPCP) vaut 2,7 mm/j = 3,1e−5 kg·m⁻²·s⁻¹. |
| `PRECIP_PRESSURE_SCALE` | 5e−6 | kg/m²/s | ⚠️ | ·/·/· | Contribution de la pression au taux de précipitation. | ⚠️ SANS SOURCE. |
| `PRECIP_CLOUD_SCALE` | 1e−6 | kg/m²/s | ⚠️ | ·/·/· | Contribution nuageuse au taux de précipitation. | ⚠️ SANS SOURCE. |
| `PRECIP_CONVECTIVE_T_REF_K` | 288 | K | M | ·/·/· | Température de référence de la convection. | 288 K, température de surface moderne mesurée (même remarque que EVAPORATION_T_REF). |
| `PRECIP_CONVECTIVE_T_EXPONENT` | 1.2 | — | C | ·/·/· | Exposant de la dépendance en T des précipitations. | **CALAGE, et le code le dit** : « adouci vs C-C (~7 %/K) pour éviter sur-assèchement ». Choisi pour que le modèle se tienne, pas mesuré. |
| `PRECIP_CONVECTIVE_RH_REF` | 0.7 | — | ⚠️ | ·/·/· | Humidité relative de déclenchement de la convection. | ⚠️ SANS SOURCE. 0,7, chiffre rond. |
| `PRECIP_CONVECTIVE_RH_EXPONENT` | 1 | — | ⚠️ | ·/·/· | Exposant de la rampe d'humidité. | ⚠️ SANS SOURCE (vaut 1,0 = linéaire). |
| `CH4_HAZE_RATIO_THRESHOLD` | 0.1 | — | M | ·/·/· | Seuil CH₄/CO₂ de formation d'une brume organique. | Seuil mesuré/modélisé : la brume organique apparaît vers CH₄/CO₂ ≈ 0,1 (Haqq-Misra et al. 2008, Astrobiology 8:1127 ; Trainer et al. 2006 en chambre). ⚠️ **Pas encore câblé** dans le calcul. |
| `MT_CKD_SCALE` | 1.71 | — | C | ·/·/· | Amplitude du continuum H₂O MT_CKD. | **CALAGE, et le code le dit** : « formule paramétrique calibrée ». Le vrai MT_CKD (Mlawer et al. 2012) est une fonction de ν, T et des pressions partielles, pas un scalaire. |
| `MT_CKD_T_REF_K` | 296 | K | M | ·/·/· | Température de référence du continuum. | 296 K : température de référence de HITRAN et de MT_CKD. Convention de la base spectroscopique. |
| `MT_CKD_T_EXPONENT` | 4.25 | — | M | ·/·/· | Dépendance en température du continuum self-broadening. | Le self-continuum de H₂O décroît fortement avec T ; MT_CKD (Mlawer et al. 2012, Phil. Trans. R. Soc. A 370:2520) le paramétrise depuis des mesures FTIR de laboratoire. ⚠️ **L'exposant 4,25 est à vérifier sur la source** — je ne l'ai pas lue. |

### `DATA['🎚️'].CLOUD_SW` — proxy CCN et nuages SW (22)

Le proxy CCN du modèle. Une seule ligne y est classée **F** avec des bornes mesurées — celle qu'on vient d'y mettre.

| paramètre | val | u. | c | ΔT&nbsp;📱/🛖/🪼 | à quoi ça sert | d'où vient le nombre |
|---|--:|:-:|:-:|--:|---|---|
| `OPTICAL_EFF_BASE` | 1.09 | — | C | -0.94/-1.08/-1.19 | Efficacité optique nuageuse de base. | **CALAGE.** `source` : « Twomey + AR6 aerosols, **centrage moderne** ». C'est le paramètre de barycentre le plus sensible : −0,95 à −1,19 °C à +10 %. Et « AR6 » est une ÉVALUATION, pas une mesure. |
| `OXIDATION_SOFT_BASE` | 0.85 | — | ⚠️ | -0.82/-0.90/-1.10 | Pondération douce du facteur d'oxydation, terme constant. | ⚠️ SANS SOURCE, **et sensible** : +10 % donne −0,82 à −1,10 °C. Le code dit seulement « pour limiter la double comptabilisation ». |
| `CLOUD_FRACTION_BASE` | 0.197 | — | C | -0.77/-0.86/-0.97 | Fraction nuageuse optique de base (SW). | **CALAGE.** Son champ `source` dit : « CERES EBAF + MODIS (2000-2025), **calibration interne pour SW effectif moderne** ». La mesure CERES/MODIS existe (couverture nuageuse ~0,67, albédo nuageux ~0,28–0,35) mais 0,19 n'en est pas tiré — il est ajusté. Sensible : −0,77 à −0,97 °C à +10 %. |
| `CLOUD_FRACTION_INDEX_GAIN` | 0.107 | — | C | -0.15/-0.18/-0.19 | Gain de l'index nuageux vers la fraction optique. | **CALAGE partiel.** `source` : « Sundqvist (1989) + **ajustement interne** cloud_index → fraction optique ». Sundqvist donne la forme (exposant 0,6), pas ce gain. |
| `OXIDATION_SOFT_GAIN` | 0.15 | — | ⚠️ | -0.12/-0.15/-0.04 | Pondération douce, pente. | ⚠️ SANS SOURCE. −0,13 °C à +10 %. |
| `MODERN_REF_O2` | 0.21 | — | M | +0.08/+0.05/+0.09 | Fraction molaire d'O₂ de référence du proxy CCN. | Fraction molaire de l'O₂ dans l'air sec : 0,2095 (mesure, composition standard). |
| `CCN_BASE` | 0.15 | — | ⚠️ | ·/·/-0.08 | Terme constant du proxy CCN. | ⚠️ SANS SOURCE. Le code le marque [OBS/CALIB] « calibré pour rester dans les ordres de grandeur littérature ». C'est du calage. |
| `CCN_O2_WEIGHT` | 0.85 | — | ⚠️ | ·/·/+0.05 | Poids de l'O₂ dans le proxy CCN. | ⚠️ SANS SOURCE, et sans fondement physique : **l'O₂ n'est pas un noyau de condensation**. |
| `SULFATE_CCN_EXPONENT` | 0.191 | — | F | ·/+0.02/+0.02 | Exposant a de la loi sulfate → gouttelettes, CDNC ∝ (masse SO₄)^a. | **La seule jauge du barycentre dont les bornes soient MESURÉES** : quartiles [0,11 ; 0,29] sur 19 régions, CDNC de MODIS contre sulfate de MERRA2, validés contre campagnes aéroportées (McCoy et al. 2018 ACP 18:2035, Table 1 — **[mccoy2018] en biblio**). Forme : Boucher & Lohmann 1995 — **[boucherLohmann1995]**. |
| `OXIDATION_BASE` | 0.3 | — | ⚠️ | ·/·/-0.02 | Terme constant du facteur d'oxydation. | ⚠️ SANS SOURCE. |
| `MODERN_REF_FOREST` | 0.03 | — | ⚠️ | +0.01/+0.01/+0.01 | Fraction de forêt de référence du proxy CCN. | ⚠️ SANS SOURCE **et incohérente** : EPOCH[📱][🌱] vaut 0,31 pour la même grandeur (Bonan 2008, FAO FRA 2020), soit 10× plus. L'une des deux ne veut pas dire ce que son nom dit. |
| `ANTHRO_RISE_MAX` | 0.25 | — | ⚠️ | ·/·/+0.01 | Amplitude de la montée anthropique. | ⚠️ SANS SOURCE. |
| `ANTHRO_RISE_START_YEAR` | 1900 | an | ⚠️ | +0.01/·/· | Début de la montée du facteur anthropique sur les CCN. | ⚠️ SANS SOURCE **et cassée** : comparée à EPOCH[▶] qui mélange années avant le présent (4,5e9) et années du calendrier (1800). Toutes les époques géologiques passent la porte « post-1900 », 🚂 en est exclue. |
| `ANTHRO_DECAY_MAX` | 0.15 | — | ⚠️ | ·/·/-0.01 | Amplitude de la baisse. | ⚠️ SANS SOURCE. |
| `OXIDATION_O2_GAIN` | 4 | — | ⚠️ | ·/·/-0.01 | Pente en O₂ du facteur d'oxydation. | ⚠️ SANS SOURCE. |
| `BIOMASS_GAIN` | 4 | — | ⚠️ | ·/·/+0.01 | Poids de la biomasse terrestre dans le proxy CCN (voie CLAW). | ⚠️ SANS SOURCE. La voie CLAW (Charlson et al. 1987 — **[charlson1987] en biblio**) est réelle, mais elle passe par le DMS marin, pas par la biomasse terrestre, et aucun gain de 4,0 n'en sort. |
| `ANTHRO_DECAY_START_YEAR` | 1980 | an | ⚠️ | ·/·/· | Début de la baisse (dépollution). | ⚠️ SANS SOURCE. 1980 correspond bien au pic des émissions de SO₂ (Smith et al. 2011), mais le code ne le dit pas et la porte est la même, cassée. |
| `ANTHRO_RISE_WINDOW_YEARS` | 80 | an | ⚠️ | ·/·/· | Durée de la montée anthropique. | ⚠️ SANS SOURCE. |
| `ANTHRO_DECAY_WINDOW_YEARS` | 40 | an | ⚠️ | ·/·/· | Durée de la baisse. | ⚠️ SANS SOURCE. |
| `PRESSURE_FACTOR_MAX` | 1.2 | — | N | ·/·/· | Plafond du facteur de pression sur l'efficacité nuageuse. | Garde-fou numérique. |
| `OPTICAL_EFF_CCN_GAIN` | 0.6 | — | N | ·/·/· | Ancien gain de l'effet Twomey. | MORT depuis v1.3.14 : remplacé par la forme analytique de Twomey (1991), ΔA/[A(1−A)] = Δ(ln N)/3, calculée dans calculations_albedo.js. ⚠️ **La clé traîne encore dans initDATA** et devrait être retirée. |
| `CLOUD_FRACTION_MAX` | 0.75 | — | N | ·/·/· | Plafond de la fraction nuageuse optique. | Garde-fou numérique. |

---

## La liste d'action : sans source (ou calés) ET sensibles

Croisement des deux colonnes. Ce sont les nombres sans fondement qui décident réellement du résultat, par effet décroissant.

| # | paramètre | val | c | ΔT | ce qu'il faudrait |
|--:|---|--:|:-:|--:|---|
| 1 | `EARTH.H2O_VAPOR_CAP_REF` | 0.0065 | ⚠️ | 3.46 | Le rapporter à l'humidité spécifique de saturation calculée par Clausius-Clapeyron, au lieu de poser un plafond. |
| 2 | `EARTH.H2O_VAPOR_CAP_RATE_PER_K` | 0.065 | ⚠️ | 1.43 | **Le CALCULER** : L/(R_v·T²) = 0,065 K⁻¹ à 288 K. Si c'est bien ça, ce n'est pas un paramètre, c'est une équation. |
| 3 | `CLOUD_SW.OPTICAL_EFF_BASE` | 1.09 | C | 1.19 | Le dériver de l'albédo nuageux mesuré (MODIS/CERES) au lieu de le centrer sur le moderne. |
| 4 | `CLOUD_SW.OXIDATION_SOFT_BASE` | 0.85 | ⚠️ | 1.10 | Décider si ce facteur a une physique. Sinon le retirer — il vaut −1 °C pour rien. |
| 5 | `CLOUD_SW.CLOUD_FRACTION_BASE` | 0.197 | C | 0.97 | Le prendre de CERES/MODIS *sans* recentrage : couverture et albédo nuageux sont mesurés. |
| 6 | `EARTH.SEASONAL_AMP_MID_K` | 25 | ⚠️ | 0.92 | Amplitude saisonnière observée par bande de latitude (réanalyses) — c'est mesurable. |
| 7 | `CLOUD_SW.CLOUD_FRACTION_INDEX_GAIN` | 0.107 | C | 0.19 | Garder la forme de Sundqvist et retirer le gain ajusté, ou le sourcer. |
| 8 | `CLOUD_SW.OXIDATION_SOFT_GAIN` | 0.15 | ⚠️ | 0.15 | Même question que OXIDATION_SOFT_BASE. |

Et quatre erreurs de physique trouvées **en faisant le tableau**, indépendantes de la sensibilité :

- `EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM` = 1 K/atm. Clausius-Clapeyron sur la fusion de l'eau donne
  **−7,4e−3 K/bar** (la glace fond *plus bas* sous pression, pente négative). Le code est **135×
  trop grand**.
- `EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM` = 5 K/atm. L'ébullition passe de 100 °C à 1 atm à 120 °C à
  2 atm : **~20 K/atm** près de 1 atm (tables IAPWS). Le code est **4× trop bas**.
- `EARTH.CP_AIR_MOIST_J_KG_K` s'appelle « humide » et porte la valeur de l'air **sec**.
  c_p(humide) = c_p(sec)·(1 + 0,84·q) ≈ 1011 J·kg⁻¹·K⁻¹ à q = 0,0067. Calculable, non calculé.
- `CONST.L_V` et `CONST.L_VAPORIZATION` sont **la même grandeur physique à deux températures**
  (40,66 kJ/mol à 373 K ; 2,501 MJ/kg à 273 K, soit 45,1 kJ/mol). Rien ne le dit dans le code, et
  les deux circulent.

---

## Les valeurs de référence : le symptôme, et ce qu'on en fait

Question posée le 2026-09-22 : *« est-ce possible de retirer les masses de référence, pour avoir
des formules sans référence ? Et en fait toutes les références ! »*

C'est la bonne question, parce qu'une valeur de référence dans une formule n'est presque jamais
neutre : **elle veut dire que la formule est une interpolation autour d'aujourd'hui, pas une loi.**
Un modèle écrit en écart à la Terre moderne ne peut pas répondre juste sur une planète à −56 °C.

Les 17 références du calcul, triées par ce qu'il faut en faire.

### 1. Mortes — supprimées le 2026-09-22

| référence | valeur | |
|---|--:|---|
| `CONV.O2_REF_MASS` | 1e18 kg | lue nulle part dans tout le projet |
| `CONV.CH4_REF_MASS` | 1e13 kg | lue nulle part |
| `CONV.H2O_VAPOR_REF` | 0,01 kg/kg | seule trace : un commentaire disant que sa formule « n'est plus utilisée ». Elle a survécu à sa propre formule. |

Trois paramètres sans source de moins, banc inchangé (0,0000 °C sur 19 époques).

### 2. Références d'une formule qui n'a pas de physique — c'est la FORMULE qu'il faut retirer

| référence | dans quoi |
|---|---|
| `CONV.CCN_O2_REF_KG`, `CONV.CCN_CH4_REF_KG` | `🍰💭 = clamp(0,4 + 0,5·(O₂/réf + CH₄/réf) + 0,1·(SO₄/réf), 0,3, 1,0)` |
| `CLOUD_SW.MODERN_REF_O2`, `CLOUD_SW.MODERN_REF_FOREST` | `ccn_ref_modern`, le dénominateur de `ccn_ratio` |

Retirer la référence ne servirait à rien : **ni l'O₂ ni le CH₄ ne sont des noyaux de condensation.**
Et `🍰💭` est de toute façon écrasée à 1,000 sur 18 époques sur 19 par son propre clamp. La
« référence moderne » du proxy CCN, elle, compare chaque époque à une Terre d'aujourd'hui
reconstituée avec `MODERN_REF_FOREST` = 0,03 — quand `EPOCH['📱']['🌱']` vaut 0,31 pour la même
grandeur. Le point de comparaison n'existe même pas.

### 3. Légitimes — une loi publiée EN RAPPORT

| référence | pourquoi elle reste |
|---|---|
| `CONV.CCN_SULFATE_REF_KG` | La loi de McCoy 2018 s'écrit CDNC/CDNC_ref = (m/m_ref)^a. C'est sa forme publiée : le terme constant *b* de la régression absorbe les unités et n'est pas utilisable seul. Supprimer la référence exigerait un CDNC absolu que personne ne publie. **Et la référence est une charge mesurée** (Tsigaridis 2006), pas un nombre rond. |
| `EARTH.MT_CKD_T_REF_K` | 296 K est la température de référence de HITRAN et de MT_CKD. C'est la convention de la base spectroscopique, pas un ancrage sur le présent. |
| `EARTH.EBM_ALBEDO_REF`, `EARTH.SOLAR_CONSTANT_REF_W` | Point de linéarisation de l'EBM 0D de Budyko, qui est lui-même une régression empirique. La référence y est constitutive du modèle. |

### 4. L'ancrage sur aujourd'hui — la maladie

`EARTH.EVAPORATION_T_REF` = **288 K**, et ses **9 usages** : tout le cycle de l'eau du modèle est
écrit en écart à la température moyenne actuelle. Plafond de vapeur, effet iris, précipitations
convectives — chaque rampe part de 288 K.

Et le cas le plus net, qui répond directement à la question :

```js
c_c_max = EARTH.H2O_VAPOR_CAP_REF * Math.exp(EARTH.H2O_VAPOR_CAP_RATE_PER_K * (T - 288))
//          0,0065                              0,065
```

**Ce sont les deux paramètres sans source les plus sensibles du modèle** (3,46 °C et 1,43 °C au
tableau ci-dessus). Or, avec les constantes du modèle lui-même :

```
L/(R_v·T²) à 288 K             = 0,06531 K⁻¹      contre 0,065 posé   →  écart 0,5 %
q_sat(288 K, 1 atm)            = 0,010430 kg/kg
0,0065 / q_sat(288 K)          = 0,623             et le modèle calcule RH = 0,611 sur 📱
```

Autrement dit : **`c_c_max` est une Clausius-Clapeyron linéarisée autour de 288 K, à humidité
relative figée.** Les deux « paramètres » sont une équation déguisée en constantes, et la
référence 288 K est le point où on l'a linéarisée.

Ce que coûte la linéarisation, en s'éloignant de 288 K :

| T | C-C exacte | formule du modèle | erreur |
|---|---|---|---|
| −56,2 °C (⛄ Snowball) | 1,35e−5 | 6,42e−5 | **+376 %** |
| −20 °C | 4,79e−4 | 6,75e−4 | +41 % |
| 0 °C | 2,29e−3 | 2,48e−3 | +8 % |
| **+15,2 °C (📱)** | 6,54e−3 | 6,67e−3 | **+2 %** |
| +40 °C | 2,89e−2 | 3,33e−2 | +16 % |
| +80 °C | 2,05e−1 | 4,49e−1 | **+119 %** |

Juste là où on l'a calée, faux partout ailleurs — c'est-à-dire faux sur presque toutes les époques
du modèle, qui existe précisément pour sortir du présent.

**Le remplacement est écrivable tout de suite**, avec des constantes qui sont déjà dans le fichier :

```
e_sat(T) = P0_WATER · exp[ (L_VAPORIZATION / RV_WATER) · (1/T0_WATER − 1/T) ]
q_sat(T) = (M_H2O / 🧪) · e_sat(T) / P
c_c_max  = 🍰🫧☔ · q_sat(T)
```

Plus aucune référence, plus aucun paramètre : quatre constantes de classe **P/M** et l'humidité
relative que le modèle calcule déjà (`🍰🫧☔`).

⚠️ **Mais ça déplace les 19 époques**, et ça touche le chantier de la rétroaction vapeur. À lire
avant : `DIAGNOSTIC_RETROACTION_VAPEUR.md`, qui mesure que la masse de vapeur répond déjà
correctement à +6,5 %/K près de 288 K (normal : c'est là que la linéarisation est juste) et que le
défaut de rétroaction est ailleurs — dans l'absorption par molécule, trop forte d'un facteur ~4.
Les deux constats ne se contredisent pas : l'un porte sur la dérivée au voisinage du présent,
l'autre sur la valeur loin de lui.

À noter quand même : c'est la **troisième fois** que la même erreur de convexité apparaît dans ce
modèle — exp de la moyenne ≠ moyenne des exp. Déjà trouvée sur la solubilité océanique
(`ocean/sinks_ocean.js` v1.1.0, corrigée) et sur la colonne de vapeur précipitable
(`DIAGNOSTIC_RETROACTION_VAPEUR.md`, ouverte).

---

## Mise à jour du 2026-09-22 (soir) — la linéarisation est retirée

Sept paramètres retirés du modèle, dont **les deux plus sensibles du tableau ci-dessus**. Les lignes
correspondantes du tableau sont donc périmées ; elles y restent comme trace de ce qui existait.

| retiré | valeur | classe | pourquoi |
|---|--:|:-:|---|
| `CONV.O2_REF_MASS` | 1e18 | ⚠️ | mort, zéro usage |
| `CONV.CH4_REF_MASS` | 1e13 | ⚠️ | mort, zéro usage |
| `CONV.H2O_VAPOR_REF` | 0,01 | ⚠️ | mort, sa formule avait déjà disparu |
| `EARTH.H2O_VAPOR_CAP_REF` | 0,0065 | ⚠️ | **= 0,623 × q_sat(288 K)** |
| `EARTH.H2O_VAPOR_CAP_RATE_PER_K` | 0,065 | ⚠️ | **= L/(R_v·288²) = 0,06531** |
| `EARTH.H2O_VAPOR_REALISTIC_MAX_REF` | 0,0052 | ⚠️ | = 0,4986 × q_sat(288 K) |
| `EARTH.H2O_VAPOR_REALISTIC_MAX_RATE_PER_K` | 0,013 | ⚠️ | taux sans source, pas Clausius-Clapeyron |

Remplacés par deux rapports explicites à la **saturation exacte**, que `calculations_h2o.js`
calculait déjà deux lignes plus haut :

```js
c_c_max            = EARTH.H2O_COLUMN_SAT_RATIO      * max_vapor_mass_fraction   // 0,623
realistic_vapor_max = EARTH.H2O_COLUMN_SAT_RATIO_INIT * q_sat_init                // 0,4986
```

**39 → 35 paramètres sans source.** Et surtout : plus de Clausius-Clapeyron linéarisée, plus
d'ancrage sur 288 K dans le plafond de vapeur.

### Ce que ça coûte au banc — et il ne faut pas le recaler

| époque | avant | après | Δ | litt. |
|---|--:|--:|--:|---|
| ⛄ Snowball | −56,20 | **−63,39** | −7,19 | −60…−50 ❌ |
| hystérésis 1a | 7,33 | **15,70** | +8,37 | 5…15 ❌ |
| 🦣 Quaternaire | 13,63 | **16,68** | +3,05 | 10…16 ❌ |
| 🔥 Hadéen | 2648,73 | 2639,75 | −8,98 | ❌ (déjà) |
| 🏔 | 15,59 | 17,56 | +1,97 | ✅ |
| 🦠 Archéen | 18,95 | 20,50 | +1,55 | ✅ |
| 📱 Aujourd'hui | 15,25 | **15,50** | +0,25 | ✅ |
| *(12 autres)* | | | +0,10 à +1,13 | ✅ |

**On passe de 18/19 dans la fourchette à 15/19.** C'est le résultat attendu et il ne faut pas le
corriger : la linéarisation compensait d'autres erreurs, et la retirer les rend visibles.

Le signe de chaque mouvement se lit :

- **⛄ refroidit de 7 °C** parce qu'à −56 °C la C-C exacte donne **4,8× moins de vapeur** que la
  linéarisée (le +376 % du tableau plus haut). Moins de vapeur, moins d'effet de serre, plus froid.
  C'est la bonne direction — le modèle était artificiellement humide sur les époques froides.
- **1a et 🦣 se réchauffent beaucoup** alors que le plafond bouge à peine à ces températures : ce
  sont les deux époques assises sur la rétroaction glace-albédo, près de sa bifurcation. Un
  déplacement minime du point de départ y est amplifié. 1a est même *par construction* la branche
  chaude juste avant la bascule snowball.
- **📱 ne bouge que de +0,25 °C**, ce qui est cohérent : c'est à 288 K que la linéarisation était
  juste (+2 %).

⚠️ **Le calage de l'hystérésis snowball est à refaire** — `DIAGNOSTIC_RETROACTION_VAPEUR.md` le
prévoyait explicitement pour toute correction dans cette zone.

### Ce qui reste, et qui explique probablement le reste de l'écart

`EARTH.H2O_COLUMN_SAT_RATIO` = **0,623**.

⚠️ **CORRECTION du 2026-09-23** : j'avais écrit ici que 0,623 était « 2,7× trop haut contre 0,232
mesuré ». **C'était faux** — je comparais un rapport de SURFACE à un rapport de COLONNE. `🍰🫧💧`
est produite à la température et à la pression de surface, donc 0,623 est une **humidité relative
de surface**, dont la mesure donne ~0,70–0,75. Elle est un peu BASSE, pas trop haute. Son nom est
d'ailleurs trompeur et devrait être `H2O_SURFACE_RH`.

Le vrai défaut est ailleurs, et il y en a bien deux comme l'utilisateur l'avait déduit : `🍰🫧💧`
est lue comme fraction massique de colonne dans `calculatePressureAtm`, comme fraction molaire dans
`calculateMolarMassAir` et `computePWV`, et comme fraction massique de surface dans
`waterVaporFractionAtZ`. Facteurs 6,3 et 1,602, qui **s'ajoutent**. Mesures et conséquences :
`DIAGNOSTIC_RETROACTION_VAPEUR.md`, § « la deuxième erreur, trouvée sur commande ».

---

## Ce que ce tableau ne couvre pas encore

1. **Les 268 littéraux posés directement dans les formules** — `2.6 * ccn`, `0.4 + 0.5 * (…)`,
   exposants, seuils. Ce sont les pires : ils n'ont même pas de nom pour qu'on puisse les chercher.
   Inventaire mécanique fait, annotation à faire.
2. **Les ~25 clés × 19 époques de `configTimeline.js`** — masses, luminosités, surfaces, 🧫, 🌱.
   Autre logique : ce sont des *données paléo* par époque, pas des paramètres universels. Une
   partie est sourcée (les masses de sulfate l'ont été ce mois-ci), beaucoup ne l'est pas.
3. **`CONFIG_COMPUTE`** — tolérances, plafonds d'itération, tailles de grille. Classe N par nature,
   mais à vérifier qu'aucun ne mord sur la physique (le cas s'est déjà produit :
   `scanFailRatio` arrêtait le scan d'hystérésis juste avant la bifurcation).

## La règle, pour la suite

Aucun nombre n'entre dans le calcul sans, **dans cet ordre de préférence** :

1. une **équation** écrite en commentaire, qui le dérive ;
2. une **mesure** de laboratoire ou une observation, avec sa référence dans `BIBLIOGRAPHIE.html` ;
3. une **fourchette** de littérature déclarée dans `fine_tuning_bounds.js`, qui dit qu'on ignore.

Et jamais : « calibré pour », « centrage moderne », « ajustement interne », « pour éviter que ».
Ça, c'est le résultat qui écrit l'hypothèse.
