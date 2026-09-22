# Les masses de sulfate ⚖️✈ — une source par époque

Écrit le 2026-09-22, en remplacement du « proxy CCN ». Règle appliquée sans exception :
**aucune valeur inventée.** Chaque nombre ci-dessous a soit une référence, soit une dérivation
écrite à partir de grandeurs référencées — soit, quand il n'y a rien à citer, une phrase qui dit
qu'on ne sait pas.

---

## Ce que la clé veut dire maintenant

`⚖️✈` = **charge atmosphérique de sulfate, en kg de SO₄**. Une masse, au sens propre : ce qui est
en suspension dans l'atmosphère à un instant donné, pas un flux d'émission.

Avant, `⚖️✈` valait 8,0e13 kg pour 📱 et sa propre config le disait — « proxy CCN moderne ». Ce
n'était pas une masse : 8,0e13 kg de sulfate étalés sur 1,5 km de couche limite feraient
105 000 µg/m³, contre 1 à 10 µg/m³ mesurés dans l'air réel.

Ce qui comptait vraiment, et qui était faux aussi : les **rapports entre époques**. La loi
sulfate → CCN s'écrit en rapport (voir `aerosols/sulfate_ccn.js`), donc elle ne lit que ça.

| | avant | après | mesure |
|---|---|---|---|
| 📱 / 🚂 | 53 | **2,6** | 2,6 (Tsigaridis 2006) · 2,2 (Schulz 2006, en AOD) |
| 🦠 / 📱 | 6,3 | **0,38** | non contraint (voir plus bas) |

---

## La table

| époque | ⚖️✈ (kg SO₄) | d'où ça vient |
|---|---|---|
| ⚫ Corps noir | 0 | pas d'atmosphère (`⚖️🫧` = 0). Définition du cas, pas une mesure. |
| 🔥 Hadéen | 0 | le modèle sort l'époque à ~2650 °C : H₂SO₄ ne condense pas, le soufre reste gazeux. Énoncé physique. |
| 🦠 Archéen | 4,0e8 | **non contraint** — fond naturel faute de mieux, voir § Archéen |
| 🪸 Protérozoïque | 4,0e8 | fond naturel ; post-GOE l'atmosphère est oxydante, le SO₂ finit bien en sulfate |
| ☃ hystérésis 1a | 4,0e8 | fond naturel ; branche chaude, océan libre, DMS actif |
| ⛄ Plein Snowball | 1,2e8 | **dérivé** : fond × part volcanique du soufre, voir § Snowball |
| ⛈ hystérésis 1b | 4,0e8 | fond naturel |
| 🪼 🍄 💀 🦕 🦤 🐊 🐧 🏔 🦣 🛖 | 4,0e8 | fond naturel, **aucune contrainte d'époque publiée** |
| 🚂 Industriel (1800) | 4,0e8 | Tsigaridis et al. 2006, Table 5, colonne préindustriel |
| 📱 Aujourd'hui (2000) | 1,05e9 | Tsigaridis et al. 2006, Table 5, colonne présent (émissions an 2000) |

---

## Les deux valeurs d'ancrage

**Tsigaridis et al. 2006**, *Change in global aerosol composition since preindustrial times*,
ACP 6:5143, **Table 5** — charge de nss-sulfate (sulfate non issu du sel de mer) :

| | ce travail | dispersion inter-modèles publiée |
|---|---|---|
| présent (émissions 2000) | **1,05 Tg** | 0,29 – 2,55 Tg |
| préindustriel (EDGAR-HYDE 1860) | **0,40 Tg** | 0,10 – 0,58 Tg |

Le rapport 2,6 est énoncé tel quel dans leur texte, et il est plus petit que le rapport des
émissions (3,4) : la chimie ne répond pas linéairement.

Pourquoi cette source plutôt qu'une autre : **les deux bouts viennent d'un même modèle et d'une
même définition**, ce qui est la seule chose qui compte pour un rapport. Et « nss » est exactement
la variable de McCoy et al. 2018, dont le sulfate MERRA2 exclut lui aussi le sel de mer.

Deux recoupements indépendants :

- **Textor et al. 2006**, ACP 6:1777, **Table 10** — 16 modèles AeroCom : charge SO₄ **1,99 Tg**
  (médiane 1,98, δ = 25 %), source 179 Tg SO₄/an, durée de vie **4,12 j**. Plus haut que Tsigaridis
  parce que ce chiffre inclut le sulfate porté par le sel de mer.
- **Schulz et al. 2006**, ACP 6:5225, **Table 2** — la part anthropique vaut **55 %** de l'épaisseur
  optique sulfatée actuelle (moyenne de 9 modèles AeroCom, référence 1750), soit un rapport
  actuel/préindustriel de **2,2**. Même ordre que 2,6, par un chemin différent.

**Vérification d'échelle**, faite une fois pour toutes sur la même table : une charge, c'est une
source multipliée par une durée de vie.

    179 Tg SO₄/an × 4,12 j / 365 j = 2,02 Tg     contre 1,99 Tg de charge mesurée.  ✅

Corollaire qui vaut pour toutes les époques : **le sulfate n'a pas de mémoire**. Quatre jours de
durée de vie, donc la charge suit la source presque instantanément. Aucune accumulation possible,
aucun report d'une époque sur l'autre.

---

## § Snowball — la seule dérivation d'époque

Sous une banquise globale, la source marine de DMS est coupée : il ne reste que le soufre
volcanique. Part volcanique du soufre naturel, aux flux mesurés d'aujourd'hui :

| source | flux | référence |
|---|---|---|
| volcanisme subaérien | 23 ± 2 Tg SO₂/an = **11,5 Tg S/an** | Carn et al. 2017, Sci. Rep. 7:44095 (OMI, 2005-2015, 91 sources persistantes) |
| DMS marin | **28,1** [17,6 ; 34,4] Tg S/an | Lana et al. 2011, GBC 25:GB1004 (47 000 mesures) |

    part volcanique = 11,5 / (11,5 + 28,1) = 0,29        [0,25 ; 0,40] avec la plage DMS
    ⚖️✈(⛄) = 4,0e8 × 0,29 = 1,16e8  →  1,2e8 kg SO₄

Ce qu'elle suppose, et qui n'est pas vérifié : rendement SO₂ → SO₄ identique pour les deux
sources. Le soufre volcanique est émis plus haut, donc sa durée de vie est plutôt plus longue —
la part volcanique est probablement **sous-estimée**. Et le « préindustriel » de Tsigaridis
contient un résidu anthropique de 1860. Les deux biais vont dans le même sens : 1,2e8 est un
plancher.

Pour mémoire : le flux volcanique d'Andres & Kasgnoc (1998), ~12 Tg SO₂/an, valait la moitié de
celui de Carn ; l'écart est de l'inventaire, pas de la Terre — Carn voit des sources que le sol
ne comptait pas.

---

## § Archéen — ce qu'on ne sait pas, et qu'il faut dire

**Il n'existe pas de charge de sulfate atmosphérique archéenne publiée.** La valeur 4,0e8 est le
fond naturel préindustriel posé faute de mieux ; ce n'est pas une mesure et il ne faut pas la lire
comme telle.

Deux effets de signe opposé, tous deux non quantifiés, encadrent la vraie valeur :

1. le dégazage volcanique était vraisemblablement plus fort — Terre plus chaude, flux de chaleur
   interne supérieur ;
2. l'atmosphère **anoxique** route une part importante du soufre vers l'aérosol **S₈** plutôt que
   vers le sulfate. Ce n'est pas une hypothèse de confort : c'est la condition même du
   fractionnement isotopique indépendant de la masse observé dans les sédiments archéens
   (Farquhar et al. 2000, Science 289:756 ; Pavlov & Kasting 2002, Astrobiology 2:27 — le signal
   MIF impose pO₂ < 10⁻⁵ PAL, et les deux aérosols sortent avec des Δ³³S opposés, S₈ positif et
   sulfate négatif).

La valeur précédente, **5,0e14 kg**, valait 500 000 fois la charge moderne mesurée. Elle ne venait
d'aucune source.

Les bornes `🔒` de 🦠 portent désormais la dispersion **publiée** des charges préindustrielles
entre modèles, 0,10–0,58 Tg (Tsigaridis Table 5, colonne « previous works »). C'est la seule
fourchette honnête à cet endroit : elle ne dit pas ce que valait le sulfate archéen, elle dit de
combien les modèles se dispersent sur une grandeur de ce type.

---

## § Pourquoi toutes les autres époques ont la même valeur

Parce que rien ne permet d'en dire plus, et qu'un chiffre différent par époque aurait été inventé.

Ce qu'on sait quand même, et qui justifie de ne pas s'inquiéter d'un facteur 10 : les deux sources
du sulfate naturel sont le volcanisme subaérien et le DMS marin, et ni l'un ni l'autre n'a de
raison connue d'avoir changé d'un ordre de grandeur sur le Phanérozoïque. Le dégazage suit le taux
de production de croûte, qui varie d'un facteur ~2 ; le DMS suit la productivité marine, présente
depuis le Protérozoïque.

**Un événement n'est pas un fond.** C'est l'erreur à ne pas faire ici, et elle est tentante sur 💀
(Trapps sibériens) : un panache sulfaté de grande province magmatique a une durée de vie de
quelques années, et cette fiche couvre 280 → 250 Ma. Moyenner un pic décennal sur 30 Ma redonne le
fond, à la précision près. Si ce refroidissement doit apparaître, c'est comme **événement** — ce
que le modèle sait déjà faire : le voile sulfaté Franklin qui bascule le Sturtien est porté par
`⛄.🔺🍰⚽ = 0,05` (Macdonald & Wordsworth 2017, GRL 44:1938), pas par `⚖️✈`. Pas de double
comptage.

---

## Les bornes 🔒 refaites

| époque | avant | après | source |
|---|---|---|---|
| 🦠 | [0 ; 1,0e15] « volcanisme explosif » | [1,0e8 ; 5,8e8] | dispersion inter-modèles préindustrielle, Tsigaridis Table 5 |
| ☃ / ⛄ | [1,0e12 ; 1,018e12] | [1,2e8 ; 4,0e8] | les deux états du segment : DMS éteint / DMS actif |
| 📱 | [0 ; 5,0e14] « SRM Crutzen » | [4,0e8 ; 1,62e10] | fond naturel / pic stratosphérique post-Pinatubo |

Le max de 📱 : **5,4 Tg de soufre** au pic de charge stratosphérique après le Pinatubo
(Sukhodolov et al. 2018, GMD 11:2633 — modèle SOCOL-AER en accord avec HIRS), × 96/32 = **16,2 Tg
SO₄**. C'est l'ordre de grandeur d'une géo-ingénierie sulfatée, et c'est bien sur le Pinatubo que
Crutzen (2006) calibre sa proposition. L'ancien max valait 30 000 fois celui-là.

Un changement de sens sur le segment ☃ ↔ ⛄ : `cools` passe de `'max'` à `'min'`. Sous la banquise
il y a **moins** de sulfate, pas plus. Sur ce segment le sulfate ne pilote donc pas le
refroidissement — c'est le voile Franklin qui le fait.

---

## Ce que ça change au banc : rien. Et c'est le résultat.

Bench 19 époques avant / après : **0,00 °C d'écart sur 17 époques**, +0,01 °C sur 🦣 et 📱 — et ce
+0,01 ne passe même pas par le sulfate, il vient de ce que `⚖️✈` entre dans la somme d'air sec
`⚖️🫧` (retirer 8e13 kg de 5,15e18 déplace le ppm de 364,9 à 365,0).

Autrement dit : **on vient de corriger une erreur de quatre ordres de grandeur sans que le modèle
s'en aperçoive.** Il fallait comprendre pourquoi. Sonde au banc, `🍰💭` sur les 19 époques :

| époque | terme sulfate | valeur brute | après clamp |
|---|---|---|---|
| ⚫ | 0,0000 | 0,400 | 0,400 |
| 🔥 | 0,0000 | **481** | 1,000 |
| 🦠 | 0,0381 | **6058** | 1,000 |
| 🪸 | 0,0381 | **69,7** | 1,000 |
| 🚂 | 0,0381 | **1,285** | 1,000 |
| 📱 | 0,1000 | **1,526** | 1,000 |
| *(13 autres)* | 0,0381 | 1,15 à 8,7 | 1,000 |

    🍰💭 = clamp(0,4 + 0,5×(O₂/réf + CH₄/réf) + 0,1×(SO₄/réf),  0,3 , 1,0)

La valeur brute dépasse 1,0 sur **18 époques sur 19**. `🍰💭` vaut donc **1,000 partout sauf ⚫**,
et le clamp avale non seulement le sulfate mais aussi l'O₂ et le CH₄ : cette formule ne module
plus rien du tout. Elle multiplie la fraction nuageuse de Sundqvist par la constante 1.

Et l'autre chemin, `sulfate_boost = 1 + 🧫 × min(MAX, 🍰🫧✈ × SCALE)`, était déjà mesuré à
0,0075 sur 📱 (`DIAGNOSTIC_SULFATES_CCN.md`) ; avec une charge réelle il tombe à 1,4e-7. Zéro.

**Les deux chemins sulfate → nuages du modèle sont morts**, l'un par saturation, l'autre par
échelle. C'est cohérent avec l'ERFaci mesuré au banc, −0,037 W/m² contre −1,0 [−1,7 ; −0,3] de
l'AR6. Rien n'est cassé par ce commit : c'était déjà comme ça, les masses fausses le cachaient.

---

## Suite — point 1 FAIT le jour même

**La loi est branchée** (`calculations_albedo.js` v1.2.65). `SULFATE_BOOST_SCALE` et
`SULFATE_BOOST_MAX` ont disparu, remplacés par la jauge `SULFATE_CCN_EXPONENT` aux quartiles
mesurés de McCoy 2018. **ERFaci du modèle : −0,908 W/m²** contre −0,97 (McCoy 2017a) et
−1,0 [−1,7 ; −0,3] (AR6) — il valait −0,037 la veille. Au banc, hystérésis 1a (4,85 → 7,33) et 🦣
(9,35 → 13,63) reviennent dans leur fourchette : **18 époques sur 19**, contre 16 avant.

Un changement est revenu sur ce document : ⛄ repasse à **4,0e8 kg**. La dérivation « fond × part
volcanique » n'est plus dans sa fiche, elle est dans le code, où `🧫` module la part DMS du soufre
pour les 19 époques : `m_eff = ⚖️✈ × (0,29 + 0,71 × 🧫)`. Masse effective de ⛄ : 1,30e8 kg, au lieu
du 1,2e8 qui y était écrit en dur. Règle du projet appliquée — ce qu'on sait calculer se calcule.

Détail complet : `DIAGNOSTIC_SULFATES_CCN.md`, dernière section.

### Reste à faire

1. ~~**Brancher `aerosols/sulfate_ccn.js`.**~~ FAIT. Son contrat d'entrée est maintenant tenu : `⚖️✈` est
   proportionnel à une charge réelle et les rapports entre époques sont ceux de la littérature.
   La loi de puissance de McCoy 2018 remplace le facteur linéaire, `SULFATE_BOOST_SCALE` et
   `SULFATE_BOOST_MAX` disparaissent (une loi de puissance sature toute seule).
2. **Réparer la porte anthropique** — `EPOCH['▶'] >= 1900` compare des années avant le présent à
   des années du calendrier ; 🚂 en est exclue et toutes les époques géologiques y passent.
3. **Le clamp de `🍰💭`.** Une formule qui vaut 1,000 sur 18 époques sur 19 ne dit plus rien. À
   traiter pour elle-même — c'est une constante déguisée en physique, et ça ne concerne pas que le
   sulfate. Découvert ici, à verser à `AUDIT_CONSTANTES_SANS_SOURCE.md`.
4. **Vérifier** (pas caler) que l'ERFaci qui sort de tout ça tombe vers −0,97 W/m²
   (McCoy et al. 2017a) / −1,0 AR6.

## Ce qui reste non sourcé, et assumé

- la charge de sulfate de 15 époques sur 19 (tout ce qui est « fond naturel ») ;
- en particulier l'Archéen, où la physique elle-même est différente ;
- le 🔥 Hadéen à 0 : l'argument « rien ne condense à 2650 °C » vaut tant que le modèle sort cette
  température, qui est elle-même hors fourchette littérature (2648 vs 2000–2500).
