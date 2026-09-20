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
