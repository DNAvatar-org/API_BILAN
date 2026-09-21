# Audit des 7 cibles du barycentre — incertitude, ou calcul à préciser ?

## La règle

**Ce qu'on CONNAÎT se calcule dans le code, à partir de ses vrais paramètres, et quitte les targets.
Ce qu'on IGNORE reste dans le barycentre, dont c'est précisément le rôle : dire qu'on ne sait pas.**

Corollaire, appris à la dure (v1.3.11/12, annulées en v1.3.13) : un paramètre sans fondement
scientifique ne doit SURTOUT pas être figé. Le figer ne le rend pas plus juste — ça remplace un
« on ne sait pas » honnête par un nombre d'apparence décidée. Les deux seules cibles qu'on avait
sorties étaient les deux seules sans base : exactement l'inverse de ce qu'il fallait faire.

Le critère n'est donc pas « cette plage est-elle une vraie incertitude ? » mais
**« sait-on calculer cette grandeur ? »**. Si oui → au code. Si non → au barycentre, et on cherche.

Une cible par section. `fixed:` dans `fine_tuning_bounds.js` sort une cible du barycentre
(tuning.js v1.0.19). **Une sortie à la fois, bench à chaque fois.**

Deux précédents existaient déjà dans le projet : `factorTropopause` (sorti en v1.3.10) et
`TEMP_FACTOR_REF_K` (remplacé par la partition de phase Hu & Stamnes 1993). L'idée n'est pas neuve,
elle n'avait simplement jamais été passée en revue systématiquement.

---

## Verdict

| # | cible | plage | verdict | état |
|---|---|---|---|---|
| 1 | CLOUD_FRACTION_BASE | 0,17–0,23 | incertitude de calibration — **mais un terme suspect** | reste, à discuter |
| 2 | CLOUD_FRACTION_INDEX_GAIN | 0,08–0,14 | vraie incertitude | reste |
| 3 | OPTICAL_EFF_BASE | 1,00–1,20 | vraie incertitude | reste |
| 4 | **OPTICAL_EFF_CCN_GAIN** | 0,30–0,60 | **on sait le calculer — Twomey est analytique** | **à coder** |
| 5 | SULFATE_BOOST_SCALE | 300–700 | ignorance assumée (proxy sans littérature) | reste |
| 6 | SULFATE_BOOST_MAX | 0,20–0,45 | aucune mesure ne le fixe | **reste** — on ne sait pas |
| 7 | H2O_EDS_SCALE | 1,00–0,60 | remplace 3 physiques absentes | **reste** tant qu'elles ne sont pas codées |

---

## 4. OPTICAL_EFF_CCN_GAIN — vérifié contre la littérature, à sortir

Twomey (1991) donne une forme **analytique**, validée sur les traces de navires
(Platnick & Twomey 1994 ; Schwartz & Slingo) :

    ΔA / [A(1−A)] = Δ(ln N) / 3

La sensibilité n'est donc pas un paramètre libre : elle se calcule depuis l'albédo nuageux A, que
le modèle possède déjà (`EARTH['🪩🍰']['🪩🍰⛅']` = 0,42). Gain relatif attendu = (1−A)/3 = **0,193**
par unité de ln(N/N₀).

Le code fait :

```js
cloud_optical_efficiency = OPTICAL_EFF_BASE + OPTICAL_EFF_CCN_GAIN * (ccn_ratio - 1.0);
```

soit un gain relatif de 0,45/1,10 = **0,409** — deux fois Twomey. Et la plage déclarée ne peut pas
s'interpréter comme « A varie » :

| gain | relatif | albédo nuageux impliqué |
|---|---|---|
| 0,30 | 0,273 | A = +0,18 |
| 0,45 | 0,409 | A = −0,23 |
| 0,60 | 0,545 | A = −0,64 |

Il faudrait un albédo entre −0,64 et +0,18 pour que la plage soit « Twomey à albédo variable ».
Le modèle pose 0,42. **La plage ne décrit donc aucune incertitude physique identifiable.**

Second défaut, plus grave que le facteur 2 : le code est **linéaire en (ccn_ratio − 1)** alors que
Twomey est **logarithmique en ln(ccn_ratio)**. Les deux coïncident au voisinage de 1, donc sur la
Terre moderne — mais `ccn_ratio` s'éloigne beaucoup de 1 sur les époques anciennes (Archéen sans
oxygène, snowball sans plancton). C'est exactement là que la forme linéaire diverge.

**Remplacement proposé :**

```js
cloud_optical_efficiency = OPTICAL_EFF_BASE * (1 + (1 - A_cloud) / 3 * Math.log(ccn_ratio));
```

⚠️ Contrairement à la sortie n°6, celle-ci **change les résultats** : gain divisé par deux, et forme
logarithmique. Elle demande donc un re-calage, et elle touche les époques à CCN extrême — dont le
snowball. À faire seule, avec bench avant/après sur les 19 époques.

## 6. SULFATE_BOOST_MAX — reste dans le barycentre

Sa source dit « borne numérique de sécurité (évite emballement du proxy) ». Donc aucune mesure ne
le fixe. Il avait été figé à 0,3125 en v1.3.11 : erreur, annulée. Un plafond dont personne ne
connaît la valeur est exactement ce qu'un barycentre doit porter. Il n'en sortira que le jour où
on saura dire à quoi sature réellement l'activation des CCN par les sulfates.

## 7. H2O_EDS_SCALE — reste dans le barycentre

Sa note nomme elle-même trois mécanismes : « capture continuum MT_CKD non implémenté + overlap
CO₂/H₂O + approximations HR(z) ». Ce ne sont pas des incertitudes, ce sont trois physiques absentes.
Un multiplicateur **constant** à la place de termes dépendant de la température ne peut porter
aucune rétroaction — voir `DIAGNOSTIC_RETROACTION_VAPEUR.md`, où la rétroaction vapeur est mesurée
à −0,28 W/m²/K contre −1,8 attendus.

**Il n'y a pas de formule de remplacement.** Ce qu'on a est un diagnostic de pourquoi la
rétroaction est morte, pas son remède. Le sortir du barycentre, c'est donc le FIGER, pas le
remplacer — à 0,82, sa valeur effective à 45 %, pour ne rien déplacer. Bénéfice immédiat et réel :
les autres cibles redeviennent réglables sans l'entraîner avec elles, et on peut chercher sa vraie
formule en parallèle. Tant que le TODO 1 n'est pas fait, ce 0,82 est un aveu, pas un paramètre.

(0,60 — le bas de l'ancienne plage — refroidirait les 19 époques : c'est un choix disponible, pas
le choix neutre.)

---

## Les quatre qui restent, et pourquoi

**1. CLOUD_FRACTION_BASE (0,17–0,23).** Source déclarée : CERES EBAF + MODIS, calibration interne du
SW effectif moderne. La plage est bien « de combien peut-on bouger en restant d'accord avec le SW
observé » — une vraie incertitude de calibration. **Mais un point mérite discussion** : la formule
est `(BASE + GAIN × cloud_index) × opt_eff`. À `cloud_index` = 0 — atmosphère parfaitement sèche —
il reste 0,20 de couverture nuageuse. Ce terme constant absorbe peut-être autre chose. À creuser
avant de le déclarer sain.

**2. CLOUD_FRACTION_INDEX_GAIN (0,08–0,14).** Piège évité : sa source cite Sundqvist 1989, ce qui
ressemble à une formule qu'on pourrait substituer. Mais **Sundqvist est déjà appliqué en amont**,
sur l'humidité relative réelle du modèle (`calculateCloudFormationIndex`, exposant 0,6). Ce gain-ci
ne fait que mapper l'index résultant vers une fraction optique SW. Vraie incertitude de calibration.

**3. OPTICAL_EFF_BASE (1,00–1,20).** C'est l'efficacité optique au CCN moderne (`ccn_ratio` = 1).
Une constante de référence, dont la plage traduit une vraie incertitude sur l'efficacité des nuages
actuels. Reste — mais si le n°4 passe en forme multiplicative Twomey, elle devient le facteur de
tête et son rôle change : les traiter ensemble.

**5. SULFATE_BOOST_SCALE (300–700).** Convertit une fraction massique de sulfate en boost de CCN.
Source déclarée : « proxy sulfate interne ». Aucune littérature derrière, et le rapport 300→700 est
un facteur 2,3 : c'est de l'ignorance assumée, pas une dépendance cachée. Un barycentre est
exactement l'outil adapté. Reste.

---

## Cible finale

Ne doivent rester dans le barycentre que les trois vraies incertitudes :
`CLOUD_FRACTION_INDEX_GAIN`, `OPTICAL_EFF_BASE`, `SULFATE_BOOST_SCALE`.

## Ordre

1. ✅ SULFATE_BOOST_MAX — figé 0,3125, impact nul.
2. ✅ H2O_EDS_SCALE — figé 0,82, impact nul. Formule à trouver (TODO 1).
3. **OPTICAL_EFF_CCN_GAIN → Twomey** — impact réel, re-calage nécessaire, touche le snowball.
4. CLOUD_FRACTION_BASE — comprendre d'abord ce que porte le terme constant. Argument à garder en
   tête : il y a toujours des nuages sauf en corps noir, et il faut pouvoir les gérer aux extrêmes
   (volcanisme massif, hiver nucléaire). Le terme constant a donc une raison d'être — reste à lui
   en donner une PHYSIQUE plutôt qu'un réglage.

## Sur le linéaire vs logarithmique (n°4) — c'est tranché par la dérivation

À eau liquide constante, l'épaisseur optique va comme N^⅓ et l'albédo comme τ/(τ+cste) ; en
différenciant, dA = A(1−A)/3 · **d(ln N)**. Le logarithme n'est pas un choix de modélisation, c'est
le résultat du calcul. La forme linéaire du code n'est défendable qu'au voisinage de ccn_ratio = 1,
c'est-à-dire sur la Terre moderne et nulle part ailleurs.
