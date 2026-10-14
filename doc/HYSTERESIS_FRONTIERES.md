# Frontières d'hystérésis : où les trouver, comment les vérifier

Les époques `hysteresis …` (☃ 1a, 🌦 1b, ⛈ 1c, 🐧 2) et les snowballs ⛄ / 🏂 sont des **configs frontière** : leur
CO₂ (et CH₄) est posé là où le climat bascule. Ce n'est pas une valeur à reproduire, c'est un seuil mesuré —
à remesurer après **tout** changement de physique.

## Le script : `CO2/scripts/bench_headless/seuils_hysteresis.js`

Pas une page visible : un script du banc headless (Chrome sans interface), lancé depuis la racine du dépôt CO2 :

```bash
python3 scripts/bench_headless/run.py seuils_hysteresis.js --var __SEUILS__ --timeout 3000
```

Il mesure par **dichotomie sur le CO₂** (précision relative 5e-4, en log), sur la **chaîne de clics** depuis la frise 🪸,
les quatre frontières du Cryogénien, dans l'ordre (chacune dépend des précédentes) :

| | frontière | critère |
|---|---|---|
| F1 | entrée Sturtien : CO₂ de ☃ = ⛄ | le plus BAS qui garde ☃ chaud à l'arrivée de 🪸 ; puis 🗻 → ⛄ gelé |
| F2 | sortie Sturtien : CO₂ de 1b | le plus BAS qui fait sortir 1b (T > 0, glace < 0,1) depuis ⛄ gelé |
| F3 | entrée Marinoen : CO₂ de 🏂 | le plus HAUT qui gèle 🏂 à l'arrivée |
| F4 | sortie Marinoen : CO₂ de 1c | le plus BAS qui fait sortir 1c depuis 🏂 gelé, puis 🪼 chaud |

Le TIMELINE n'est modifié qu'en mémoire : on reporte ensuite la valeur dans `config/configTimeline.js`, avec la mesure
en commentaire. Procédure détaillée et historique : `CO2/scripts/bench_headless/README.md`, sections « Les passages
d'hystérésis » et « La dichotomie » ; encadré « ÉPOQUES D'HYSTÉRÉSIS » de `configTimeline.js`.

## Ce qu'il faut savoir avant de le relancer

- **Borner.** L'encadrement monte ou descend par facteur 1,3 jusqu'à 40 pas avant la bisection : le 2026-10-14, une
  frontière sans bascule l'a fait tourner très longtemps. Lancer une frontière à la fois si besoin, et surveiller
  `window.__PROG__`.
- **CO₂ seul.** Le script ne fait varier que le CO₂. Le 2026-10-14, la frontière Sturtienne a été cherchée avec CO₂ et
  CH₄ descendus ENSEMBLE dans leurs fourchettes (CO₂ = 500 + 1 500 s, CH₄ = 10 + 40 s ppm d'air sec), par un script
  de sonde ad hoc (même chaîne, même dichotomie, 12 pas) qui n'est pas dans le dépôt.
- **Frise = clic, toujours.** F1 ne juge que l'arrivée par la chaîne. Ça ne suffit pas : à 1 130,6 ppm la chaîne
  tenait ☃ chaud (6,61 °C), mais la branche chaude n'y était qu'une tangente, et le **clic frise** sur ☃ (premier pas du
  solveur plus grand) passait dessous → snowball (−73,7 °C). La frontière retenue exige ☃ chaud au clic frise ET par
  la chaîne : **1 267,9 ppm CO₂ / 30,48 ppm CH₄** (frise 7,16 °C, chaîne 7,09 °C ; 🗻 → ⛄ −76,4 °C ; ⛄ reste gelé
  après 💫, −76,8 °C). Le critère « frise = clic » est aussi vérifié par `bench19.js` (section passages).
- **Une seule valeur.** ☃ et ⛄ lisent les mêmes constantes `STURTIEN_CO2_KG` / `STURTIEN_CH4_KG` en tête de
  `configTimeline.js` : ne plus recopier un nombre dans deux époques.

## État au 2026-10-14

| frontière | valeur | mesurée |
|---|---|---|
| F1 ☃ = ⛄ | 1 267,9 ppm CO₂ / 30,48 ppm CH₄ | 2026-10-14, frise + chaîne |
| F2 1b | 10 262,5 ppm | 2026-09-24 — à remesurer |
| F3 🏂 | 2 556,7 ppm | 2026-09-24 — à remesurer (N₂ passé à 1 PAL, ppm conservés) |
| F4 1c | 9 797,1 ppm | 2026-09-24 — à remesurer |

Depuis le 2026-09-24 ont changé : N₂ = 1 PAL, bilan méridien, calottes portées au clic time, glissement 🔀 des masses
par le temps écoulé (et non plus par le nombre de tics). F2 à F4 sont donc périmées.
