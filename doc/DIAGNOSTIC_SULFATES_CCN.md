# Pourquoi les deux jauges sulfate ne font rien

Mesuré au banc headless, 2026-09-22. **Rien n'a été modifié** : diagnostic seul.

Point de départ : un balayage des 6 jauges restantes à leurs deux extrêmes, sur 8 époques.
`SULFATE_BOOST_SCALE` (300 ↔ 700) et `SULFATE_BOOST_MAX` (0,20 ↔ 0,45) donnent **0,00 °C d'écart
partout**. Les quatre autres déplacent les époques de 1 à 7 °C.

## Trois défauts distincts

### 1. Le plafond ne peut jamais se déclencher

```js
Math.min(SULFATE_BOOST_MAX, 🍰🫧✈ × SULFATE_BOOST_SCALE)
```

| époque | sulfate (kg) | 🍰🫧✈ | × SCALE (480) | plafond |
|---|---|---|---|---|
| 📱 Aujourd'hui | 8,0e13 | 1,6e-5 | **0,0075** | 0,3125 |
| 🦠 Archéen | 5,0e14 | 3,9e-5 | **0,019** | 0,3125 |
| toutes les autres | ~1e12 | 1,9e-7 | **0,0001** | 0,3125 |

Le produit plafonne à 0,019 contre un plafond à 0,3125 : **16× d'écart au mieux**. Et même au
maximum autorisé par les bornes `🔒` de l'époque 📱 — 5e14 kg, le SRM sulfaté de Crutzen — le
produit ne monte qu'à 0,047, soit encore 6,6× sous le plafond.

`SULFATE_BOOST_MAX` est donc **inatteignable par construction**. C'est du code mort, avec une jauge
de « flou scientifique » posée dessus. Son intervalle [0,20 ; 0,45] ne décrit rien.

### 2. Le boost lui-même est 27× trop faible

Mesure directe du forçage à température figée, en faisant varier le seul sulfate de 📱 :

| sulfate | boost CCN | nuages | albédo | SW absorbé |
|---|---|---|---|---|
| 0 (pré-industriel) | 1,0000 | 0,26344 | 0,28680 | 242,688 |
| 8e13 (moderne) | 1,0074 | 0,26382 | 0,28691 | 242,652 |
| 5e14 (SRM) | 1,0463 | 0,26574 | 0,28746 | 242,464 |

→ **ERFaci du modèle = −0,037 W/m²**  (et −0,224 même au SRM)
→ **AR6 : ERFaci = −1,0 [−1,7 à −0,3] W/m²** (1750–2014, Ch. 7)

Le modèle est 27× sous le meilleur estimé, et 8× sous la BORNE BASSE de la fourchette. Autrement
dit : **il n'a pratiquement pas d'effet indirect des aérosols** — alors que c'est l'un des plus
gros termes du bilan moderne, environ un quart du forçage CO₂, et de signe opposé.

Ce n'est donc pas un bug de câblage. La chaîne fonctionne ; elle est simplement calibrée deux
ordres de grandeur trop bas.

### 3. La porte anthropique est cassée — `▶` mélange deux conventions

```js
EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR   // 1900
```

`▶` vaut des **années avant le présent** pour les époques anciennes (4,5e9 = 4,5 Ga) et des
**années de notre calendrier** pour les récentes (−10000 pour l'Holocène, 1800, 2000). Le test
`>= 1900` compare donc des choses différentes :

| époque | ▶ | porte | correct ? |
|---|---|---|---|
| 🦠 Archéen | 4 000 000 000 | ✅ passe | ❌ boost anthropique à l'Archéen |
| ⛄ Snowball | 720 000 000 | ✅ passe | ❌ |
| 🛖 Holocène | −10 000 | ❌ bloque | ✅ |
| 🚂 Industriel | 1 800 | ❌ **bloque** | ❌ c'est l'ère industrielle |
| 📱 Aujourd'hui | 2 000 | ✅ passe | ✅ |

**Toutes les époques géologiques passent la porte « post-1900 »**, et la seule qui devrait vraiment
en bénéficier — l'ère industrielle — en est exclue. Sans conséquence numérique aujourd'hui,
puisque le boost est négligeable partout (défaut n°2) ; bloquant dès qu'on le corrigera.

## Ce que ça implique

Le modèle manque **~1 W/m² de refroidissement aérosol** sur l'époque moderne. C'est du même ordre
que le déséquilibre mesuré par CERES, et de signe opposé au CO₂ : ça n'est pas un détail.

Pour atteindre ERFaci = −1,0 W/m² il faut multiplier le boost par ~27, soit `SCALE` ≈ 13 000 au
lieu de 480. Et alors — c'est le point intéressant — **le plafond redevient utile** : le produit
vaudrait 0,20 au moderne et 1,26 au SRM, donc le `Math.min` mordrait enfin. Les deux paramètres
reprendraient vie ensemble.

⚠️ Ça refroidit l'époque moderne (~−0,3 °C avec le λ actuel) et déplace 🚂 une fois la porte
réparée. À faire en un bloc, avec re-calage et bench.
