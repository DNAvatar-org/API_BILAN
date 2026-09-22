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

## Et la vraie réponse : la forme est fausse, pas seulement l'échelle

Premier réflexe : remonter `SCALE` de 480 à ~13 000 pour atteindre −1 W/m². Mauvaise idée — ce
serait remplacer un nombre inventé par un autre nombre inventé, calé à l'envers sur le résultat.

**Il existe de la littérature, et elle ne borne pas `SCALE` : elle remplace sa FORME.**

La relation sulfate → nombre de gouttelettes est une **loi de puissance** depuis Boucher & Lohmann
(1995), et c'est toujours celle qu'on utilise :

    log₁₀(CDNC) = a · log₁₀(masse SO₄) + b

McCoy et al. (2018, ACP 18:2035) la calent sur MESURES — CDNC de MODIS, masses d'aérosols de
MERRA2, 2003-2015, validées contre campagnes aéroportées. Exposant sulfate sur 19 régions :

| | a₁ |
|---|---|
| médiane | **0,22** |
| quartiles | [0,11 ; 0,29] |
| plage complète | [−0,02 ; 0,44] |

Le modèle fait `🍰🫧✈ × SCALE` : **linéaire**. Une loi de puissance d'exposant 0,22 n'a rien d'une
droite — à sulfate faible elle est bien plus raide, à sulfate fort bien plus plate. C'est aussi ce
qui donne à `SULFATE_BOOST_MAX` sa raison d'être ou non : une loi en puissance sature d'elle-même,
elle n'a pas besoin d'un `Math.min` posé à la main.

Et le forçage qui en résulte est lui aussi mesuré : **−0,97 W/m²** (McCoy et al. 2017a),
indépendamment cohérent avec les −1,0 de l'AR6.

## Ce qu'il faut faire, dans l'ordre

1. **Remplacer la forme linéaire par la loi de puissance** — même opération que Twomey pour
   OPTICAL_EFF_CCN_GAIN : on sait la calculer, elle quitte le barycentre par le code.
2. **Garder un barycentre sur l'exposant a**, avec les bornes mesurées [0,11 ; 0,29] (quartiles) ou
   [−0,02 ; 0,44] (plage complète). Là, la jauge décrit une vraie dispersion observée — régionale,
   pas inventée.
3. **Vérifier** que l'ERFaci qui en sort tombe vers −1 W/m². C'est une vérification, pas un calage.
4. **Réparer la porte anthropique** (défaut n°3) : sans ça 🚂 reste exclue.

⚠️ Tout ça refroidit l'époque moderne (~−0,3 °C avec le λ actuel) et déplace 🚂. À faire en un bloc,
avec re-calage et bench.

## Ce qui manque encore

Il faut convertir `🍰🫧✈` (fraction massique) en **concentration massique de SO₄ en µg/m³** dans la
couche limite, puisque c'est la variable de la loi publiée — et disposer d'un CDNC de référence
(le `b` de la régression). Ni l'un ni l'autre n'est dans le modèle aujourd'hui.


---

# Mise à jour 2026-09-22 — les masses sont refaites, et un troisième chemin mort apparaît

Les 19 `⚖️✈` sont passées du « proxy CCN » à des **charges atmosphériques réelles en kg de SO₄**,
une source par époque : `MASSES_SULFATE_PAR_EPOQUE.md`. Le rapport 📱/🚂 passe de 53 à **2,6**
(Tsigaridis et al. 2006 ACP 6:5143, Table 5), qui est la valeur mesurée. Le contrat d'entrée de
`aerosols/sulfate_ccn.js` est donc tenu : la loi de McCoy peut être branchée.

**Le banc n'a pas bougé** : 0,00 °C sur 17 époques, +0,01 sur 🦣 et 📱 — et ce +0,01 vient de ce
que `⚖️✈` entre dans la somme d'air sec, pas du sulfate. Corriger quatre ordres de grandeur sans
que le modèle s'en aperçoive demandait une explication. La voici.

Le défaut n° 2 ci-dessus (« le boost est 27× trop faible ») était mesuré sur le proxy. Avec une
charge réelle, `🍰🫧✈ × SCALE` tombe à **1,4e-7** sur 📱 : le boost sulfate ne vaut plus rien du
tout, ce qui ne change rien puisqu'il ne valait déjà presque rien.

Mais la sonde `🍰💭` sur les 19 époques montre un **troisième chemin mort**, indépendant des deux
premiers et plus large qu'eux :

```
🍰💭 = clamp(0,4 + 0,5×(O₂/réf + CH₄/réf) + 0,1×(SO₄/réf),  0,3 , 1,0)
```

La valeur brute vaut de 1,15 à 6058 selon l'époque — elle dépasse le plafond sur **18 époques sur
19**. `🍰💭` vaut donc **1,000 partout sauf sur ⚫**. Le terme sulfate, celui qui vaut 0,100 sur 📱
et 0,038 en préindustriel, est intégralement avalé ; l'O₂ et le CH₄ le sont aussi.

Bilan : le modèle a **trois** voies sulfate → nuages, et les trois sont mortes —
`SULFATE_BOOST_MAX` (plafond inatteignable, défaut n° 1), `SULFATE_BOOST_SCALE` (échelle,
défaut n° 2, désormais à 1,4e-7), et le clamp de `🍰💭` (saturation, découvert ici). L'ERFaci de
−0,037 W/m² contre −1,0 de l'AR6 n'est donc pas un réglage à reprendre : c'est l'absence pure et
simple du mécanisme.

Rien de tout cela n'a été cassé par le changement de masses : c'était déjà l'état du modèle, les
masses fausses le rendaient seulement indétectable.

**Suite inchangée**, mais avec un point de plus : (1) brancher la loi de puissance, (2) réparer la
porte anthropique, (3) **traiter le clamp de `🍰💭`** — à verser à
`AUDIT_CONSTANTES_SANS_SOURCE.md`, où c'est fait —, (4) vérifier que l'ERFaci tombe vers −1 W/m².


---

# 2026-09-22, suite — la loi est branchée, l'écart est refermé

Les deux jauges inventées ont disparu. `SULFATE_BOOST_SCALE` [300 , 700] et `SULFATE_BOOST_MAX`
[0,20 ; 0,45] sont remplacées par **une** jauge, `SULFATE_CCN_EXPONENT`, dont les bornes sont
mesurées : les quartiles [0,11 ; 0,29] des 19 régions de McCoy et al. 2018. Le barycentre ATM
passe de 6 à 5 paramètres, et c'est le seul dont la plage vient d'un tableau de mesures.

```js
sulfate_boost = AEROSOL.sulfateCcnRatio(m_eff, CCN_SULFATE_REF_KG, SULFATE_CCN_EXPONENT)
              = (m_eff / 1,05e9)^a
```

Trois choses disparaissent en même temps, et aucune ne manque :

- **le plafond** `Math.min(SULFATE_BOOST_MAX, …)` — une loi de puissance sature d'elle-même ;
- **la porte** `EPOCH['▶'] >= ANTHRO_RISE_START_YEAR` sur le sulfate (défaut n° 3) — elle servait à
  n'allumer le proxy que sur le moderne. La masse porte maintenant elle-même le signal anthropique,
  1,05e9 kg sur 📱 contre 4,0e8 de fond. La porte cassée reste à réparer sur `anthro_factor`, qui
  est un autre terme ;
- **le sens faux** : l'ancien boost valait toujours ≥ 1, c'est-à-dire que le sulfate ne pouvait
  qu'AJOUTER des CCN par rapport à la référence moderne — alors que c'est le moderne qui en a le
  plus. Le rapport normalisé vaut 1 sur 📱 et descend en dessous partout ailleurs.

`🧫` devient enfin ce qu'il voulait dire : la part du soufre qui vient du DMS. Le partage est
mesuré — volcanisme 11,5 Tg S/an (Carn 2017) contre DMS 28,1 (Lana 2011), soit 0,29 / 0,71 — donc
`m_eff = ⚖️✈ × (0,29 + 0,71 × 🧫)`. La dérivation qui était écrite en dur sur la fiche ⛄ est passée
dans le code, où elle vaut pour les 19 époques.

## La vérification, qui n'est pas un calage

SW absorbé à **température figée** sur 📱, en ne faisant varier que la masse de sulfate — même
protocole qu'au § « défaut n° 2 » plus haut :

| sulfate | m_eff | boost CCN | ccn_ratio | nuages | albédo | SW absorbé |
|---|---|---|---|---|---|---|
| 0 | 0 | 0,0000 | 0,0000 | 0,00000 | 0,21126 | 268,394 |
| 4,0e8 préindustriel | 4,0e8 | 0,8317 | 0,8718 | 0,25414 | 0,28413 | 243,598 |
| 1,05e9 moderne | 1,05e9 | 1,0000 | 1,0483 | 0,26344 | 0,28680 | **242,690** |
| 1,62e10 pic Pinatubo | 1,62e10 | 1,6864 | 1,7679 | 0,28982 | 0,29436 | 240,117 |

    ERFaci du modèle = 242,690 − 243,598 = −0,908 W/m²

    AR6 Ch. 7        = −1,0 [−1,7 ; −0,3] W/m²
    McCoy 2017a      = −0,97 W/m²

**−0,037 → −0,908 W/m².** Dans la fourchette, à 6 % du meilleur estimé, et rien n'a été réglé sur
ce nombre : les masses viennent de Tsigaridis 2006, l'exposant de McCoy 2018, la sensibilité de
Twomey 1991. Trois sources indépendantes, un résultat qui tombe juste — c'est la seule forme de
validation qui vaille quelque chose ici.

## Ce que le banc 19 époques en dit

| époque | avant | après | Δ | littérature |
|---|---|---|---|---|
| hystérésis 1a | 4,85 | **7,33** | +2,48 | 5–15 ✅ **revient dans la fourchette** |
| 🦣 Quaternaire | 9,35 | **13,63** | +4,28 | 10–16 ✅ **revient dans la fourchette** |
| 📱 Aujourd'hui | 15,25 | 15,25 | 0,00 | 14,5–15,5 (rapport = 1 par construction) |
| 14 autres époques | | | +0,36 à +1,17 | toutes restent dans leur fourchette |
| 🔥 Hadéen | 2648,72 | 2648,73 | +0,01 | 2000–2500 ❌ (seule hors fourchette) |

**18 époques sur 19 dans la fourchette**, contre 16 avant. Les deux qui étaient tombées avec
Twomey (`f272cb0`) reviennent — pas par un calage, par la physique manquante enfin présente : les
époques pré-industrielles ont moins de sulfate, donc moins de CCN, donc des nuages moins
réfléchissants, donc plus chaudes. C'est exactement ce que dit le signe de l'ERFaci.

⚠️ **Le revers, et il est assumé** : 🚂 → 📱 passe de 1,47 à 1,11 °C. Le refroidissement aérosol
moderne est réel et il mange une partie du réchauffement — le modèle chauffait déjà trop peu
(cf. `DIAGNOSTIC_RETROACTION_VAPEUR.md`, la vraie cause), il chauffe maintenant un peu moins
encore. Ce n'est pas une régression du sulfate, c'est un terme juste qui révèle un terme faux.

## Ce qui reste ouvert

1. **La porte anthropique** sur `anthro_factor` — toujours cassée, `EPOCH['▶'] >= 1900` compare des
   années avant le présent à des années du calendrier. Elle ne touche plus le sulfate, elle touche
   le terme O₂/biomasse.
2. **Le clamp de `🍰💭`** — inchangé, toujours 1,000 sur 18 époques sur 19. Rien à voir avec le
   sulfate, tout à voir avec les nuages. Voir `AUDIT_CONSTANTES_SANS_SOURCE.md`.
3. **Le reste du proxy CCN** : `CCN_BASE`, `CCN_O2_WEIGHT`, `BIOMASS_GAIN`, `MODERN_REF_*` — encore
   inventés, et ils multiplient maintenant une loi mesurée.
