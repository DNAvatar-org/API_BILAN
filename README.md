# API_BILAN — Bilan radiatif

API de calcul du bilan radiatif terrestre. Entrée : une époque ou une configuration. Sortie : résultats (températures, flux, spectres) via Promise et callbacks.

---

## 1. Intégration rapide

### Scripts à charger

```html
<!-- 1. Configs + données (alphabet, dico, tuning, timeline) -->
<script src="API_BILAN/configsAll.js"></script>

<!-- 2. Physique + spectroscopie + atmosphère + convergence -->
<script src="API_BILAN/physicsAll.js"></script>

<!-- 3. Hooks convergence (stubs si pas de rendu) -->
<script>
    window.clearConvergenceTrace = function () {};
    window.appendConvergenceStep = function () {};
</script>

<!-- 4. Moteur de calcul -->
<script src="API_BILAN/convergence/calculations_flux.js"></script>

<!-- 5. API + callback stack -->
<script src="API_BILAN/callback_stack.js"></script>
<script src="API_BILAN/api.js"></script>
```

### Exemple minimal : lancer un calcul (époque 1800)

```js
var API = window.FUNC_API_BILAN;

// Callback appelé à chaque étape du calcul
function onStep(event, payload) {
    if (event === 'ProcessFinished') {
        console.log('Température finale :', payload.DATA['🧮']['🧮🌡️'], 'K');
    }
}

var api = new API.BilanRadiatifAPI(onStep);

// Lancer le calcul pour l'époque pré-industrielle (1800)
api.run({ epochId: '🚂', animEnabled: false }).then(function (result) {
    console.log('Calcul terminé', result);
});
```

### Époques disponibles

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

### Exemple avec config personnalisée

```js
api.run({
    epochId: '🚂',
    animEnabled: false,
    tuning: {
        CLOUD_SW: 0.5  // override d'un paramètre de tuning
    }
}).then(function (result) {
    console.log('Résultat avec tuning personnalisé', result);
});
```

---

## 2. Référence : Alphabet et Dico

Les clés de données utilisent des emojis comme identifiants (ex. `'🌡️'` = température, `'⚖️'` = masse). Deux ressources décrivent l'ensemble des clés :

- **Alphabet** — `data/alphabet.js` : caractères, descriptions, logos.
  Consultation interactive : [`alphabet.html`](../CO2/static/compute/alphabet.html)

- **Dico** — `data/dico.js` : structure des clés par catégorie, descriptions, formules.
  Consultation interactive : [`dico.html`](../CO2/static/compute/dico.html)

---

## 3. Entrée / Sortie

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

## 4. Pile de callbacks

Plusieurs listeners peuvent être empilés pour recevoir les événements du calcul.

```js
var stack = FUNC_API_BILAN.callbackStack;
stack.push(function (event, payload) { /* listener supplémentaire */ });
// .pop(), .run(event, payload), .length()
```

---

## 5. Fichiers et structure

| Fichier / dossier | Rôle |
|------------------|------|
| **api.js** | `BilanRadiatifAPI`, `run()` → Promise |
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

## 6. Documentation détaillée

Voir [doc/README.md](doc/README.md) pour l'index complet : algorithmes, formules, convergence, diagnostic.
