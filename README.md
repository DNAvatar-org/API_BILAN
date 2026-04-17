# API_BILAN — Bilan radiatif

**Conventions de code** (liaisons `window.MAJUSCULE` en tête de fonction, limiter `if` abusifs, pas de `window.minuscule` sauf exception) : voir le [README à la racine du dépôt](../README.md#conventions-code).

API JavaScript de calcul du bilan radiatif terrestre.
Entrée : une époque (ou une configuration). Sortie : températures, flux, spectres — via Promise et callbacks synchrones.

---

## Intégration (copier-coller)

### 1. Charger les scripts

```html
<script src="https://dnavatar.org/pages/API_BILAN/configsAll.js"></script>
<script src="https://dnavatar.org/pages/API_BILAN/physicsAll.js"></script>

<!-- Hooks convergence (stubs si pas de rendu) -->
<script>
    window.clearConvergenceTrace = function () {};
    window.appendConvergenceStep = function () {};
</script>

<script src="https://dnavatar.org/pages/API_BILAN/convergence/calculations_flux.js"></script>
<script src="https://dnavatar.org/pages/API_BILAN/tuning.js"></script>
<script src="https://dnavatar.org/pages/API_BILAN/callback_stack.js"></script>
<script src="https://dnavatar.org/pages/API_BILAN/api.js"></script>
```

### 2. Lancer un calcul (époque 1800)

```js
var API = window.FUNC_API_BILAN;

function onStep(event, payload) {
    if (event === 'ProcessFinished') {
        var T = payload.DATA['🧮']['🧮🌡️'];
        console.log('Température de surface :', (T - 273.15).toFixed(1) + ' °C');
    }
}

var api = new API.BilanRadiatifAPI(onStep);

api.run({ epochId: '🚂', animEnabled: false }).then(function (result) {
    console.log('Calcul terminé', result);
});
```

### 3. Barycentre de tuning 🧩 (incertitude scientifique)

Le modèle dépend de paramètres dont la valeur exacte est scientifiquement incertaine (propriétés optiques des nuages, sensibilité aux CCN, effet sulfate, etc.). Plutôt que de fixer chaque paramètre arbitrairement, un **curseur unique** [0–100 %] interpole entre les bornes basses (conservatrices) et les valeurs nominales (calibrées) :

- **100 %** = valeurs nominales (calibration climat moderne → ~16 °C)
- **0 %** = valeurs minimales (bornes basses de la littérature)

Ce curseur est stocké dans `DATA['🎚️'].baryByGroup` et contrôle trois groupes :

| Groupe | Rôle | Paramètres concernés |
|--------|------|---------------------|
| **CLOUD_SW** | Propriétés optiques des nuages (albédo SW) | couverture, efficacité optique, boost sulfate, référence thermique |
| **SCIENCE** | Sensibilités scientifiques (sous-groupe) | gain index nuageux, sensibilité CCN |
| **SOLVER** | Convergence numérique | tolérance flux, pas de recherche |

Les bornes min/max/default de chaque paramètre et leurs sources bibliographiques sont dans `config/fine_tuning_bounds.js`.

```js
// Exemple : régler le barycentre nuages à 70 % (entre conservateur et nominal)
api.run({
    epochId: '🚂',
    animEnabled: false,
    tuning: { CLOUD_SW: 70, SCIENCE: 100, SOLVER: 100 }
}).then(function (result) {
    console.log('Résultat avec tuning à 70 %', result);
});
```

C'est tout. Le calcul tourne en quelques secondes et retourne les résultats via le callback et la Promise.

---

## Époques disponibles

| epochId | Époque | Année |
|---------|--------|-------|
| `'⚫'` | Corps noir | — |
| `'🔥'` | Hadéen | -4 500 Ma |
| `'🦠'` | Archéen | -3 500 Ma |
| `'🦕'` | Mésozoïque | -250 Ma |
| `'🌿'` | Paléocène | -66 Ma |
| `'🏔'` | Oligocène | -33,9 Ma |
| `'🦣'` | Pléistocène | -2,6 Ma |
| `'🚂'` | Pré-industriel | 1800 |
| `'📱'` | Aujourd'hui | 2000 |

---

## Alphabet et Dictionnaire des clés

Les données utilisent des emojis comme identifiants (ex. `'🌡️'` = température, `'⚖️'` = masse).
La référence complète (alphabet, catégories de clés, formules) est dans :

> **[doc/ALPHABET_ET_DICO.txt](doc/ALPHABET_ET_DICO.txt)**

---

## Entrée / Sortie

### Entrée de `api.run()`

| Forme | Description |
|-------|-------------|
| **Objet config** | `{ epochId?, animEnabled?, ticTime?, tuning? }` |
| **String seul** | Identifiant d'époque (ex. `'🚂'`) |
| **Sans argument** | Époque par défaut : `'⚫'` (Corps noir) |

- **epochId** : clé d'époque dans `TIMELINE`.
- **animEnabled** : si `false`, la température initiale est celle de l'époque (pas d'animation).
- **ticTime** : pas de temps pour l'animation.
- **tuning** : objet de paramètres appliqué au modèle.

### Sortie

- **Promise** : résout avec le résultat du calcul (objet spectral, T0, flux, etc.) ou `null` si erreur.
- **Callbacks** : appelés à chaque pas intermédiaire avec `(event, payload)` :
  - `'convergenceStep'` — pas de convergence
  - `'cycleCalcul'` — cycle de calcul
  - `'ProcessFinished'` — fin du calcul (payload contient `DATA` et `result`)

---

## Pile de callbacks

Plusieurs listeners peuvent être empilés pour recevoir les événements du calcul.

```js
var stack = FUNC_API_BILAN.callbackStack;
stack.push(function (event, payload) { /* listener supplémentaire */ });
// .pop(), .run(event, payload), .length()
```

---

## Fichiers et structure

| Fichier / dossier | Rôle |
|------------------|------|
| **api.js** | `BilanRadiatifAPI`, `run()` → Promise |
| **tuning.js** | Interpolation barycentre fine-tuning → DATA['🎚️'] |
| **callback_stack.js** | Pile de listeners synchrones |
| **receiver.js** | `createReceiver(options)` — callback pour dispatch visu/scie |
| **configsAll.js** | Bundle : alphabet + dico + initDATA + tuning + timeline |
| **physicsAll.js** | Bundle : physique + spectroscopie + atmosphère + albédo + h2o + radiatif |
| **config/** | configTimeline, model_tuning, fine_tuning_bounds |
| **data/** | alphabet.js, dico.js, initDATA.js, hitran_lines_*.js |
| **convergence/** | compute.js, calculations_flux.js (moteur principal) |
| **physics/** | Constantes physiques (Planck, Stefan-Boltzmann, etc.) |
| **spectroscopy/** | Sections efficaces HITRAN |
| **atmosphere/** | Calculs atmosphériques |
| **albedo/** | Calculs d'albédo |
| **h2o/** | Calculs vapeur d'eau |
| **radiative/** | Transfert radiatif couche par couche |
| **workers/** | Pool de web workers pour parallélisation spectrale |
| **doc/** | Documentation détaillée (algorithmes, formules, convergence) |

---

## Documentation détaillée

Voir [doc/README.md](doc/README.md) pour l'index complet : algorithmes, formules, convergence, diagnostic.
