# Frontières d'hystérésis : où les trouver, comment les vérifier

Les époques `hysteresis …` (☃ 1a, 🌦 1b, ⛈ 1c, 🐧 2) et les snowballs ⛄ / 🏂 sont des **configs frontière** : leur
CO₂ (et CH₄) est posé là où le climat bascule. Ce n'est pas une valeur à reproduire, c'est un seuil mesuré —
à remesurer après **tout** changement de physique.

## Le script : `CO2/scripts/bench_headless/seuils_hysteresis.js` (v2.1.0, 2026-10-14)

Pas une page visible : un script du banc headless (Chrome sans interface), lancé depuis la racine du dépôt CO2 :

```bash
python3 scripts/bench_headless/run.py seuils_hysteresis.js --var __SEUILS__ --stream __ESSAIS__ --timeout 14000
```

Pour n'en mesurer que certaines, préfixer le script de `window.__FRONTIERES__=['F2','F3','F4'];` (défaut : les quatre).

- **CO₂ et CH₄ ensemble** dans leurs fourchettes de la littérature (`window.BENCH_LIT_BY_EPOCH_ID`, en tête de
  `configTimeline.js`) : x = min + s (max − min), s ∈ [0, 1], ppm d'air sec, masses calculées avec le N₂ et l'O₂ de l'époque.
- **Frise = clic** : l'état attendu doit tenir au CLIC FRISE sur l'époque ET à l'arrivée par la CHAÎNE DE CLICS
  (frise ⚫ puis tous les clics, T° et glace conservées — la chaîne du bench tictime). La frise (un calcul) est testée d'abord.
- **Borné** : s reste dans [0, 1], on n'extrapole pas hors des fourchettes. Les deux bouts sont mesurés d'abord ; même
  verdict aux deux → « pas de frontière dans les fourchettes », config non touchée. Sinon 12 bisections (1/4096 de la
  fourchette) et une revérification.
- Le TIMELINE n'est modifié qu'en mémoire (chaque frontière trouvée est posée avant la suivante) : reporter ensuite la
  valeur dans `configTimeline.js`, avec la mesure en commentaire.

| | frontière | critère (frise ET chaîne) |
|---|---|---|
| F1 | entrée Sturtien : CO₂/CH₄ de ☃ = ⛄ | s le plus BAS où ☃ est chaud ; puis 🗻 → ⛄ gelé, et ⛄ encore gelé après 💫 |
| F2 | sortie Sturtien : CO₂/CH₄ de 1b | s le plus BAS où 1b est sorti (T > 0, glace < 0,1) depuis ⛄ gelé |
| F3 | entrée Marinoen : CO₂/CH₄ de 🏂 | s le plus HAUT où 🏂 est gelé (T < −30, glace > 0,8) |
| F4 | sortie Marinoen : CO₂/CH₄ de 1c | s le plus BAS où 1c est sorti depuis 🏂 gelé, puis 🪼 chaud |

Historique de la procédure : `CO2/scripts/bench_headless/README.md`, sections « Les passages d'hystérésis » et « La
dichotomie » ; encadré « ÉPOQUES D'HYSTÉRÉSIS » de `configTimeline.js`.

## Ce qu'il faut savoir

- **Pourquoi frise = clic.** Le 2026-10-14, la chaîne seule tenait ☃ chaud jusqu'à 1 130,6 ppm (6,61 °C), mais la branche
  chaude n'y était qu'une tangente : le clic frise sur ☃ (premier pas du solveur plus grand) passait dessous → snowball
  (−73,7 °C). Une frontière qui ne tient que sur un chemin n'en est pas une.
- **Une seule valeur.** ☃ et ⛄ lisent les mêmes constantes `STURTIEN_CO2_KG` / `STURTIEN_CH4_KG` en tête de
  `configTimeline.js` : ne plus recopier un nombre dans deux époques.
- **Durée.** Chaque essai = 1 calcul (frise) + la chaîne depuis 🪸 (jusqu'à ~13 calculs pour F4) : compter ~15 essais par
  frontière. Un seul banc à la fois (ports fixes).

## État au 2026-10-14 (soir) — script v2.1, chaîne depuis ⚫, pas de recherche ≤ 20 K

| frontière | résultat | détail |
|---|---|---|
| F1 ☃ = ⛄ | **1 267,9 ppm CO₂ / 30,48 ppm CH₄** | frise ☃ 7,16 °C, chaîne 7,09 °C ; 🗻 → ⛄ −76,4 °C ; après 💫 −76,8 °C (mesurée depuis 🪸 ; la chaîne depuis ⚫ arrive à 7,54 °C) |
| F2 1b | **97 583 ppm CO₂ / 97,58 ppm CH₄** | 1b sort (frise 36,7 °C, chaîne 36,8 °C) ; 97 561 ppm → reste englacé (−7,4 °C, glace 0,26) |
| F3 🏂 | **gelé dans toute [300 ; 1 500] / [0,1 ; 10]** | pas de frontière dans la fourchette (non sourcée) ; config 2 556,7 ppm hors fourchette, gèle aussi |
| F4 1c | **95 649 ppm CO₂ / 95,65 ppm CH₄** | 1c sort (frise 37,1 °C, chaîne 36,7 °C), 🪼 chaud ; 95 627 ppm → reste englacé (−7,1 °C) |

Fourchette de CO₂ de 1b / 1c : **[10 000 ; 100 000] ppm**, sourcée (Hoffman et al. 2017 : 0,01–0,1 en fraction de volume à la
sortie, selon l'albédo de la glace tropicale ; ~10² PAL à la sortie Marinoenne, Bao et al. 2008). L'ancienne [2 000 ; 10 000] n'était
pas sourcée, et aucune sortie n'y existait.

Deux changements ont rendu ces mesures possibles :
- **pas de recherche ≤ 20 K** (`CONFIG_COMPUTE.maxSearchStepK`, était 140–200 K) : une planète qui refroidit s'arrête au PREMIER
  équilibre rencontré ; avec 140 K, l'arrivée de 🔥 (175 °C) dans 🦠 sautait la branche chaude et gelait toute la chaîne ;
- **chaîne depuis ⚫** (et non 🪸) : à 0,02 % près, l'état transporté compte ; depuis 🪸, F2 tenait à 97 539 ppm et pas dans le bench.

⚠️ Les frontières sont à 0,02 % de la bascule : toute modification de physique ou de config en amont (jusqu'à ⚫) peut les déplacer.
