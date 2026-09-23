# L'attribution de l'effet de serre par gaz était un comptage de couches

Mesuré et corrigé le 2026-09-22. Point de départ : une question sur les badges de la visu —
« 642 ppm de CO₂ → 4,45 W/m², 42 ppm d'H₂O → 4,78 W/m², l'eau est donc beaucoup plus EDS ? »

Deux choses se cachaient derrière. La première est un piège d'unité, la seconde est un défaut de
méthode qui fausse tous les chiffres d'attribution du modèle.

---

## 1. Les deux badges n'affichaient pas la même grandeur

| badge | ce qu'il montrait |
|---|---|
| CO₂ | `calculateCO2Forcing` = **forçage de Myhre** relatif à 280 ppm : 5,35 × ln(642/280) = 4,44 |
| H₂O | `🧲📛💧` = **part de l'effet de serre total** |

Le commentaire du code le disait déjà, à une ligne de là : *« Part EDS vapeur (W/m²) = 🧲📛💧 ;
🔺📛💧 = ΔF H₂O (formule ln), autre grandeur »*. Un ΔF et une part d'EDS ne se comparent pas.
Même famille de piège que « air sec vs air humide » dans `calculations_atm.js`.

---

## 2. Le défaut de méthode

`sum_blocked_X`, accumulé dans le worker spectral :

```js
sum_blocked_X += flux_in[j] * (1 - Math.exp(-tau_X_couche));   // sommé sur ~50 couches
```

À chaque couche traversée, chaque espèce reçoit ce qu'elle **intercepterait seule**. Une bande
saturée est donc recomptée à chacune des cinquante couches ; une fenêtre transparente, une seule
fois.

Mesuré sur 📱 : **Σblocked = 11 569 W/m² pour un EDS de 147,49.** Facteur **78**.

Ce n'est pas une attribution d'effet de serre, c'est un comptage de traversées de couches. Et il
donnait mécaniquement :

| | ancienne voie | méthode de retrait |
|---|---|---|
| nuages | 4,6 W/m² (3,1 %) | **54,9 W/m²** |
| CO₂ | 54,6 W/m² (37,0 %) | 21,6 W/m² |
| H₂O | 88,3 W/m² (59,9 %) | 24,5 W/m² |
| CH₄ | 0,06 W/m² (0,04 %) | 0,96 W/m² |

Les nuages, dont le τ vaut ~0,022 par couche dans une fenêtre où rien d'autre n'absorbe, étaient
**12× sous-estimés**. Le CO₂, saturé à 15 µm, 2,5× surestimé.

---

## 3. La méthode qui remplace : le retrait

`RADIATIVE.computeEdsRemovalShares()` (calculations v1.3.9). On enlève un absorbeur, **à
température figée**, et on lit de combien l'OLR remonte. C'est la méthode de Schmidt et al.
(2010, JGR 115:D20106) et Lacis et al. (2010, Science 330:356) — celle dont sortent les chiffres
que tout le monde cite.

**📱 Aujourd'hui, T = 15,25 °C, surface 390,21 → OLR 242,72, EDS 147,49 W/m²**

| on retire | OLR devient | son effet |
|---|---|---|
| nuages | 297,63 | **54,91** |
| H₂O | 267,21 | 24,49 |
| CO₂ | 264,29 | 21,57 |
| CH₄ | 243,68 | 0,96 |

### Ce que la méthode ne dit pas

54,91 + 24,49 + 21,57 + 0,96 = **101,9**, pour un EDS de 147,49. Les 45,6 W/m² manquants sont le
**recouvrement** : quand on retire un absorbeur, les autres reprennent une partie de son travail,
donc chaque retrait sous-estime. C'est inhérent à la méthode, pas un bug — Schmidt le contourne en
moyennant « retirer un seul » et « ne garder qu'un seul ». On ne fait ici que le premier, et on
**normalise** pour que les parts ferment à 100 %. Les effets bruts, non normalisés, restent dans
`window.EDS_ATTRIBUTION`.

Le taux de recouvrement est lui-même un diagnostic : 31 % sur 📱, 26 % sur ⛄, 78 % sur 🦠 Archéen
(atmosphère de CO₂ massive : tout le monde absorbe partout, retirer un seul acteur ne change
presque rien).

### Coût

**Cinq passes spectrales de plus par époque**, une seule fois, à la convergence — quatre retraits
plus une remise en état (les retraits laissent `DATA['📊']` et `window.EDS_SPECTRAL` dans l'état du
dernier absorbeur enlevé, il faut les rendre). Pas à chaque itération du solveur.
Banc 19 époques : **aucun écart de température**, l'attribution est un diagnostic, pas un terme du
bilan. Coupable par `CONFIG_COMPUTE.edsAttributionByRemoval = false`.

---

## 4. Ce que la vraie attribution révèle — et ce n'est pas bon

Parts normalisées, après correction :

| époque | nuages | H₂O | CO₂ | CH₄ | recouvrement |
|---|---|---|---|---|---|
| 📱 Aujourd'hui | **53,9 %** | 24,0 % | 21,2 % | 0,9 % | 31 % |
| 🚂 Industriel | 54,5 % | 23,9 % | 20,8 % | 0,7 % | 30 % |
| 🛖 Holocène | 55,3 % | 23,6 % | 20,6 % | 0,5 % | 30 % |
| ⛄ Snowball | 86,7 % | 0,6 % | 12,3 % | 0,4 % | 26 % |
| 🦠 Archéen | 2,3 % | 1,5 % | 95,6 % | 0,6 % | 78 % |

**Littérature** (Schmidt 2010, Lacis 2010), sur ~155 W/m² :
vapeur **~50 %** · nuages **~25 %** · CO₂ **~20 %** · autres ~5 %.

Le CO₂ tombe juste (21,2 contre ~20). Mais **les nuages et la vapeur sont intervertis** : le modèle
donne 54 % aux nuages et 24 % à l'eau, la littérature l'inverse.

C'est maintenant un constat propre, sur la bonne méthode. Deux lectures possibles, non tranchées :

- **τ_LW des nuages trop fort.** `CLOUD_LW_TAU_REF = 2,6 × 🍰💭` dans `radiative/calculations.js`.
  Or `🍰💭` vaut **1,000 sur 18 époques sur 19** (son clamp sature, cf.
  `AUDIT_CONSTANTES_SANS_SOURCE.md`) : le facteur ne module rien, τ vaut 2,6 × ☁️ partout. Et 2,6
  lui-même est une calibration interne, pas une mesure. Le CRE_LW de CERES est de ~26–30 W/m² ;
  le modèle en met 54,9.
- **Absorption H₂O trop faible.** C'est déjà le sujet de `DIAGNOSTIC_RETROACTION_VAPEUR.md` —
  rétroaction vapeur à −0,28 W/m²/K contre −1,8 mesurés (Dessler 2013). Deux symptômes, peut-être
  une seule cause.

Les deux se compensent aujourd'hui : l'EDS total tombe à 147,5 W/m² contre ~155 dans la
littérature, ce qui est bon. **C'est une compensation d'erreurs**, du même genre que celles
démontées dans le chantier des puits carbone.

---

## 5. L'instrumentation posée au passage

`window.EDS_SPECTRAL` (worker v0.7.0, pool v1.2.0, calculations v1.3.8) — l'attribution
`sum_blocked` résolue **par longueur d'onde**, plus le flux de surface et l'OLR bin par bin.

Leur différence donne **l'EDS par bande, exacte et sans aucun schéma d'attribution**. Contrôle :
Σ_λ (surface − OLR) = 147,49 = l'EDS, à la virgule. C'est ce qui s'affiche désormais sous chaque
bande du spectre d'émission (plot v1.0.97).

Hors `DATA` à dessein : `snapshotEdsForConvergence()` fait un `JSON.parse(JSON.stringify(DATA['📛']))`
à chaque pas de convergence, et y mettre quatre spectres de 2000 bins recopierait tout ça des
dizaines de fois par époque.

### Ce que ça dit des 7 zones dessinées sur le spectre

| zone dessinée | plage | EDS exact | % EDS | qui absorbe vraiment |
|---|---|---|---|---|
| H₂O 6,3 µm | 5,3–7,3 | 18,70 | 12,7 % | 💧 98 % ✅ |
| CH₄ 7,7 µm | 6,7–8,7 | 20,18 | 13,7 % | **💧 91 %** ❌ |
| CO₂ 11 µm | 10–12 | 14,59 | 9,9 % | **⛅ 100 %** ❌ |
| CO₂ 15 µm | 13–17 | 39,23 | 26,6 % | 🏭 96 % ✅ |
| H₂O 17 µm | 15,5–18,5 | 18,21 | 12,3 % | **🏭 81 %** ❌ |
| CH₄ 23 µm | 21,5–24,5 | 6,31 | 4,3 % | 💧 96 % ❌ |
| Nuages 4–50 µm | — | — | **≈ 53,9 %** | continuum, pas une bande |

Trois étiquettes sur six désignent le mauvais gaz. À 11 µm on est dans la **fenêtre
atmosphérique** : le CO₂ n'y a rien, ce sont les nuages qui travaillent. À 7,7 µm le CH₄ est
noyé par l'eau. À 17 µm c'est l'aile du 15 µm du CO₂.

Le % affiché reste juste — il dit ce que l'INTERVALLE retient, pas qui le retient. Mais le picto
posé à côté, lui, raconte la version des manuels. **Chantier ouvert, non traité.**

---

## Ce qui reste à faire

1. **Trancher nuages vs vapeur** : `CLOUD_LW_TAU_REF = 2,6` (calibration interne, sans source)
   contre l'absorption H₂O. Le CRE_LW de CERES (~26–30 W/m²) est la mesure d'arbitrage.
2. **Le clamp de `🍰💭`**, qui rend `CLOUD_LW_TAU_REF` non modulable et fige la formule des nuages
   à 1,000 sur 18 époques sur 19. C'est le même défaut qui tue trois voies à la fois.
3. **Les 3 étiquettes de bandes fausses**, ou une attribution par espèce résolue en λ qui ne soit
   pas biaisée (pondération par τ colonne, à écrire).
4. **La porte anthropique** sur `anthro_factor`, toujours cassée.
