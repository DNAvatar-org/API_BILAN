# Pourquoi le modèle ne chauffe pas — rétroaction vapeur d'eau

Mesures au banc headless, époque 📱, 2026-09-20 (nuit, session autonome).
**Aucune modification du modèle n'a été faite.** Tout ce qui suit a été mesuré en patchant
l'état à chaud dans la page, puis restauré. Le dépôt est resté propre du début à la fin.

## Le fait

| grandeur | modèle | mesure | source |
|---|---|---|---|
| λ Planck (vapeur gelée) | **3,37** W/m²/K | ~3,2 | ✅ correct |
| rétroaction vapeur d'eau | **−0,28** W/m²/K | **−1,8** | Dessler 2013 (AIRS) |
| λ total | **3,09** W/m²/K | 1,16 [0,6–1,8] | AR6 |
| ΔF 2×CO₂ (TOA, instantané) | **2,10** W/m² | 2,6–3,0 inst. / 3,7 ajusté | Myhre 1998 |
| EDS par doublement | **0,68 °C** | 2,5–4 | paléo + AR6 |

La masse de vapeur répond pourtant exactement : +6,5 %/K, soit Clausius-Clapeyron au poil.
Le problème n'est donc pas dans le cycle de l'eau mais dans ce que cette vapeur fait au rayonnement.

## Trois causes éliminées

### 1. Continuum MT_CKD désactivé — NON

`EARTH.MT_CKD_ENABLED = false` dans `physics/physics.js`, avec en commentaire une procédure
d'activation jamais exécutée. Activé, le continuum n'apporte que **0,86 W/m²**, pas les ~12 que
suppose son propre calage. La rétroaction passe de −0,28 à −0,40 : insuffisant.

Raison : le calage suppose PWV = 2,5 g/cm². Le modèle en a 0,67 (voir plus bas), et le terme
est en PWV².

### 2. Résolution spectrale trop grossière — NON

Hypothèse : à 2000 bins sur 0,1–100 µm, une case fait ~5 cm⁻¹ et moyenne ~50 raies H₂O, ce qui
lisserait les raies en absorbeur gris et tuerait la dérivée. **Mesuré faux** :

| bins | 500 | 1000 | 2000 | 4000 | 8000 |
|---|---|---|---|---|---|
| rétroaction | −0,32 | −0,27 | −0,28 | −0,29 | −0,29 |

Convergée. Ce n'est pas la résolution.

### 3. Bug d'unité fraction massique / molaire — OUI, mais pas la cause

`radiative/calculations.js` construit les densités de molécules ainsi :

```js
const ln_H2O = ln_air * waterVaporFractionAtZ(lz);   // ← fraction MASSIQUE
```

Or `🍰🫧💧` est bien une fraction **massique** (`data/dico.js` : « Fraction massique de vapeur »,
calculée comme `🍰🧮🌧 × M_H2O/🧪`). Multiplier une densité de molécules par une fraction massique
n'a pas de sens : il faut la fraction **molaire** = massique × M_air/M_H2O = ×1,60.

Le même défaut touche CO₂ et CH₄, en sens inverse : `ln_CO2 = ln_air × 🍰🫧🏭` surestime le CO₂ de
M_CO2/M_air = ×1,52.

Corrigé à chaud pour H₂O seul : **T passe de 15,14 à 16,08 °C**, mais la rétroaction ne bouge pas
(−0,282 → −0,318). C'est donc un vrai bug, à corriger un jour, mais il n'explique pas l'absence
de rétroaction. ⚠️ Le corriger déplacera les 19 époques et cassera le calage de l'hystérésis
snowball : à ne pas faire sans re-caler l'ensemble.

## La piste qui reste : l'absorption H₂O est saturée

Deux chiffres à rapprocher :

| | modèle | Terre réelle |
|---|---|---|
| eau précipitable (PWV) | **6,7 kg/m²** | **25 kg/m²** |
| piégeage IR par H₂O | ~88 W/m² | ~75 W/m² |

**Le modèle obtient plus d'effet de serre avec quatre fois moins d'eau.** Son absorption par
molécule est donc très largement trop forte — ce qui le place profondément dans la saturation,
là où ajouter de la vapeur ne change presque plus rien. D'où la dérivée morte.

Mesuré : d(piégeage)/d(ln q) = **6,2 W/m²** contre ~26 dans la réalité (1,8 W/m²/K ÷ 0,07 /K).

Le PWV trop bas vient de `computePWV()` : la colonne vaut `n_air(0) × r₀ × H_eff` avec
H_eff = 1/(1/H_air + 1/H_H2O) = 1342 m contre H_air = 8466 m, soit un rapport de 0,158. La vraie
atmosphère est vers 0,24 — et sa colonne est dominée par les tropiques chauds, pas par la
température moyenne. C'est **exactement la même erreur de convexité** que celle corrigée sur la
solubilité océanique (`ocean/sinks_ocean.js` v1.1.0) : exp de la moyenne ≠ moyenne des exp.

Deux erreurs se compensent donc pour donner le bon total : colonne 4× trop faible × absorption
par molécule bien trop forte. Le total est juste, la dérivée est fausse. C'est le même schéma que
les puits carbone avant correction.

## Où chercher demain

1. **Pourquoi l'absorption par molécule est-elle si forte ?** Suspects, par ordre : normalisation
   de la forme de raie (Voigt), traitement du chemin optique `delta_z_real`, recouvrement des
   couches. C'est là que se joue tout.
2. `EARTH.H2O_EDS_SCALE` vaut **0,82 à l'exécution**, pas le 0,60 écrit dans `physics.js` : le
   système de tuning l'écrase depuis `FINE_TUNING_BOUNDS.RADIATIVE`. Sa note le décrit comme
   « capture continuum MT_CKD non implémenté » — c'est-à-dire un multiplicateur **constant** qui
   remplace un terme dépendant de la température. Un tel facteur ne peut par construction porter
   aucune rétroaction.
3. La stratosphère est isotherme à `T_trop` au-dessus de `i_trop`, et `T_trop` ne bouge pas avec
   le CO₂. Piste secondaire pour ΔF (~0,6 W/m²), pas pour λ.

## Consigne

Rien de tout ça ne se corrige isolément. Chaque piste déplace les 19 époques, dont le calage de
l'hystérésis snowball qui a demandé une session entière. Ordre proposé : d'abord comprendre
l'absorption par molécule (point 1), puis corriger unité + colonne + absorption **en un seul
bloc**, puis re-caler, puis re-benchmarker. Pas avant.

---

# 2026-09-23 — la deuxième erreur, trouvée sur commande

Objection de l'utilisateur, et elle est logiquement imparable :

> « les deux se compensent, mais un seul est faux ???? non, si y'a une erreur, y'en a forcément 2.
> cherche »

Il avait raison, et **le chiffre que j'avais avancé la veille était faux**. J'avais annoncé que
`H2O_COLUMN_SAT_RATIO` = 0,623 était « 2,7× trop haut contre 0,232 mesuré ». C'était une comparaison
entre deux grandeurs différentes : 0,623 est un rapport **de surface**, 0,232 un rapport **de
colonne**. Le vrai repère est l'humidité relative de surface, mesurée à ~0,70–0,75 : **0,623 est un
peu bas, pas 2,7× trop haut.**

## Le vrai défaut : une variable, trois lectures

`🍰🫧💧` est **produite** par `calculateWaterPartition()` comme
`(P_sat/P_total) × (M_H2O/M_dry) × ratio` : une fraction **MASSIQUE** à la température et à la
pression de **SURFACE**. C'est sans ambiguïté ce que la formule calcule.

Elle est ensuite **consommée** de trois façons incompatibles :

| lieu | lecture | juste ? |
|---|---|---|
| `radiative/calculations.js` `waterVaporFractionAtZ(z)` = `🍰🫧💧 · exp(−z/H)` | massique, surface | ✅ |
| `atmosphere/calculations_atm.js` `calculatePressureAtm` : `m_vap = ⚖️🫧 · q/(1−q)` | massique, **colonne entière** | ❌ ×6,3 |
| `atmosphere/calculations_atm.js` `calculateMolarMassAir` : `M = Σ frac_i·M_i` | **molaire**, colonne | ❌ ×1,6 **et** ×6,3 |
| `radiative/calculations.js` `computePWV()` | **molaire**, surface | ❌ ×1,6 |

Mesuré au banc sur 📱 (T = 15,5 °C) :

```
🍰🫧💧            = 0,006884          H_air = 8477 m   H_H2O = 1599 m
q_sat surface     = 0,011094          H_eff = 1345 m   H_eff/H_air = 0,159
q / q_sat         = 0,621   ← c'est l'humidité relative de SURFACE, mesurée ~0,70–0,75
colonne d'air     = 10 172 kg/m²      M_air/M_H2O = 1,602
```

et les trois PWV qu'on obtient selon la lecture :

| lecture de `🍰🫧💧` | PWV | vs 25 kg/m² mesurés |
|---|---|---|
| fraction massique de **colonne** | **70,03** | ×2,8 trop |
| fraction massique de **surface** (la bonne) | **11,11** | ×2,25 trop peu |
| ce que `computePWV()` calcule | **6,94** | ×3,6 trop peu |

`computePWV` développée donne `colonne × r₀ × (M_H2O/M_air) × (H_eff/H_air)`. Le facteur
`M_H2O/M_air` convertit molaire → massique — appliqué à une grandeur **déjà massique**. D'où
11,11 / 1,602 = 6,94. C'est **exactement le même bug massique/molaire** que celui trouvé sur
`ln_H2O` le 2026-09-20 : il n'est pas isolé, il frappe partout où `🍰🫧💧` sort du module H₂O.

## Donc : deux erreurs, et elles ne se compensent pas entre elles

1. **Massique lue comme molaire** — facteur **1,602** ;
2. **Surface lue comme colonne** (ou l'inverse selon le site) — facteur **6,3**.

Elles **s'ajoutent** : ×10,1 entre la lecture « colonne » et ce que `computePWV` renvoie. Ce qui
compense, c'est le troisième terme déjà identifié : **l'absorption par molécule trop forte**. Le
total d'effet de serre tombe juste parce qu'une colonne 3,6× trop mince rencontre une absorption
par molécule ~4× trop forte.

Et il reste un écart qui n'est ni l'un ni l'autre : même avec la bonne lecture, PWV = 11,1 contre
25. **La hauteur d'échelle de la vapeur est ~2,25× trop courte** — `H_eff/H_air` = 0,159 quand
l'observation impose 25/(10 172 × 0,006884) = **0,357**. `computeH2OScaleHeight()` donne
H_H2O = R·T²/(L·Γ) = 1599 m ; il faudrait ~4700 m pour retrouver la colonne observée. La formule
suppose un profil exponentiel pur et une seule température, alors que la colonne réelle est dominée
par les tropiques chauds et humides — **la même erreur de convexité** qu'à la solubilité océanique
et au plafond de vapeur. Troisième occurrence.

## Ce que ça change pour le bloc à corriger

Le diagnostic demandait « unité + colonne + absorption en un seul bloc ». Le contenu est maintenant
précis :

1. **Nommer les deux grandeurs séparément** au lieu d'une seule clé pour trois usages :
   `🍰🫧💧` = fraction massique de SURFACE, et une seconde clé pour la fraction massique de colonne
   (= surface × H_eff/H_air), utilisée par `calculatePressureAtm`.
2. **Convertir explicitement** massique ↔ molaire là où il le faut (`calculateMolarMassAir`,
   `computePWV`, `ln_H2O`, `ln_CO2`, `ln_CH4`), au lieu de le faire implicitement ou pas du tout.
3. **Corriger la hauteur d'échelle** ou renoncer au profil exponentiel à température unique.
4. **Puis** regarder l'absorption par molécule, qui n'aura plus rien à compenser.

⚠️ Rien de tout ça ne doit être fait pièce par pièce : chaque terme seul fait s'effondrer ou
exploser l'effet de serre total. La consigne de 2026-09-20 tient toujours.

## Troisième occurrence du même bug — la masse molaire de l'air

Trouvée en repassant sur le dictionnaire, comme demandé. `calculateMolarMassAir()` faisait :

```js
M_air = Σ frac_i × M_i     // avec en commentaire « approximation : fractions volumiques ≈ molaires »
```

Or **aucune des `🍰🫧❀` n'est une fraction volumique ni molaire** : elles sont toutes calculées
comme `masse_❀ / ⚖️🫧` (`calculateAtmosphereComposition`). Pour des fractions MASSIQUES wᵢ, la
masse molaire moyenne est la moyenne **harmonique** :

```
n_total = Σ (mᵢ/Mᵢ) = m_total · Σ (wᵢ/Mᵢ)     ⟹     M = 1 / Σ (wᵢ/Mᵢ)
```

Erreur mesurée au banc sur les 19 époques (🧪 du modèle contre 1/Σ(wᵢ/Mᵢ)) :

| époque | 🧪 modèle | correct | erreur |
|---|--:|--:|--:|
| 🔥 Hadéen | 0,033522 | 0,031406 | **+6,74 %** |
| 🦠 Archéen | 0,031189 | 0,030077 | **+3,70 %** |
| ⛄ Snowball | 0,028038 | 0,028030 | +0,03 % |
| 📱 Aujourd'hui | 0,028858 | 0,028721 | +0,48 % |

L'erreur est petite sur les atmosphères N₂/O₂ — M_N2 = 0,028 et M_O2 = 0,032 sont si proches que
les deux moyennes coïncident presque — et grande dès que l'atmosphère est **hétérogène** : CO₂ à
0,044 mélangé à de la vapeur à 0,018. C'est-à-dire précisément sur les époques profondes.

Corrigé le 2026-09-23 (`calculations_atm` v1.2.6). Effet au banc : **🔥 +38,7 °C**, **🦠 +3,6 °C**,
+0,10 à +0,36 °C ailleurs. 🧪 entre dans la pression, la hauteur d'échelle, la densité de molécules
et toutes les conversions massique ↔ molaire : l'erreur se propageait partout.

**C'est la troisième fois que la même confusion massique/molaire apparaît** — `ln_H2O` (2026-09-20),
`computePWV` (2026-09-23), `calculateMolarMassAir` (2026-09-23). Ce n'est plus une série de bugs,
c'est un défaut de convention : rien dans le nom des symboles ne dit s'ils sont massiques ou
molaires, donc l'erreur se reproduit à chaque nouveau consommateur.
