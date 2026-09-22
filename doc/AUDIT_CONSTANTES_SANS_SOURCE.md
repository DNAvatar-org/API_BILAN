# Constantes de la chaîne nuages/CCN sans aucune source

Inventaire automatique, 2026-09-22. Méthode : toutes les constantes du bloc `CLOUD_SW` de
`data/initDATA.js`, croisées avec `config/fine_tuning_bounds.js` (a-t-elle une plage déclarée ?),
`doc/BIBLIOGRAPHIE.html` (a-t-elle une référence ?) et `albedo/calculations_albedo.js`
(est-elle réellement utilisée ?).

**Résultat : 18 constantes entrent dans le calcul sans jauge et sans référence.**

Ce n'est pas la même chose que les 6 cibles du barycentre. Celles-là déclarent au moins une plage
et un champ `source`, même discutable. Les 18 ci-dessous sont des littéraux posés dans un objet,
utilisés directement dans la physique, et que rien ne documente.

| constante | valeur | où elle agit |
|---|---|---|
| `CCN_BASE` | 0,15 | terme constant du proxy CCN |
| `CCN_O2_WEIGHT` | 0,85 | poids de l'O₂ dans le proxy CCN |
| `BIOMASS_GAIN` | 4,0 | poids de la biomasse (voie CLAW) |
| `ANTHRO_RISE_START_YEAR` | 1900 | début de la montée anthropique |
| `ANTHRO_RISE_WINDOW_YEARS` | 80 | durée de la montée |
| `ANTHRO_RISE_MAX` | 0,25 | amplitude de la montée |
| `ANTHRO_DECAY_START_YEAR` | 1980 | début de la baisse (dépollution) |
| `ANTHRO_DECAY_WINDOW_YEARS` | 40 | durée de la baisse |
| `ANTHRO_DECAY_MAX` | 0,15 | amplitude de la baisse |
| `MODERN_REF_O2` | 0,21 | référence O₂ moderne — *seule évidente : fraction molaire de l'air* |
| `MODERN_REF_FOREST` | 0,03 | référence forêt moderne — ⚠️ 3 %, alors que `🌱` vaut 0,31 ailleurs |
| `PRESSURE_FACTOR_MAX` | 1,2 | plafond du facteur pression |
| `OXIDATION_BASE` | 0,3 | terme constant du facteur oxydation |
| `OXIDATION_O2_GAIN` | 4,0 | pente O₂ du facteur oxydation |
| `OXIDATION_SOFT_BASE` | 0,85 | pondération douce, terme constant |
| `OXIDATION_SOFT_GAIN` | 0,15 | pondération douce, pente |
| `CLOUD_FRACTION_MAX` | 0,75 | plafond de la couverture optique |
| `OPTICAL_EFF_CCN_GAIN` | 0,60 | **mort** depuis Twomey (v1.3.14) — à retirer d'initDATA |

## Ce que ça dit de la chaîne CCN

Le proxy CCN du modèle est :

```js
ccn_proxy = (CCN_BASE + CCN_O2_WEIGHT × O₂ × biomass_proxy × anthro_factor) × sulfate_boost
```

L'intention est bonne — c'est la voie CLAW, plancton → DMS → sulfate → noyaux. Mais **aucun des
poids n'est mesuré**. Le modèle détaille donc déjà les CCN en plusieurs contributions, toutes
inventées.

C'est ce qui rend le remplacement par la loi de puissance de McCoy intéressant : on passe de
*plusieurs coefficients inventés* à *un coefficient mesuré sur 19 régions*. Ce n'est pas perdre du
détail, c'est en gagner de la fiabilité.

## Deux cas particuliers

**`MODERN_REF_FOREST` = 0,03.** La fraction de forêt « moderne de référence ». Or `EPOCH['🌱']`
vaut 0,31 pour 📱, avec sa source (Bonan 2008, FAO FRA 2020). Deux valeurs pour la même grandeur,
à un facteur 10. L'une des deux ne veut pas dire ce que son nom dit.

**`ANTHRO_RISE_START_YEAR` = 1900.** C'est la constante de la porte cassée décrite dans
`DIAGNOSTIC_SULFATES_CCN.md` : elle est comparée à `EPOCH['▶']`, qui mélange années avant le
présent et années du calendrier.

## Règle pour la suite

Aucune nouvelle constante n'entre dans le calcul sans, au choix :
- une **référence** dans `BIBLIOGRAPHIE.html` avec son `used-in` ; ou
- une **plage déclarée** dans `fine_tuning_bounds.js`, si la grandeur est réellement inconnue ; ou
- une **dérivation** écrite en commentaire depuis d'autres grandeurs déjà sourcées.

Un littéral sans l'un des trois est une valeur inventée, quelle que soit sa vraisemblance.
