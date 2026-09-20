# API_BILAN — Bilan radiatif

Modèle 0D du bilan radiatif terrestre, en JavaScript pur : aucune dépendance externe, aucun DOM dans
les calculs. Entrée : une époque géologique ou une configuration. Sortie : température de surface, flux,
spectres — via Promise et callbacks synchrones.

Le modèle couvre 19 époques, du corps noir sans atmosphère à 2100, avec les deux grandes hystérésis
glace-albédo (Snowball néoprotérozoïque, calotte antarctique) et les cycles glaciaires du Quaternaire.

> **Démo exécutable et banc de référence : [`demo/epoch_bench.html`](demo/epoch_bench.html)** — il charge
> la pile complète, fait tourner les 19 époques et compare aux fourchettes de la littérature. C'est
> l'intégration de référence : en cas de doute, c'est ce fichier qui fait foi, pas ce README.

---

## Intégration

### 1. Charger les scripts, dans cet ordre

L'ordre est celui des dépendances, pas une préférence. Il est repris tel quel de `demo/epoch_bench_loader.js`.

```html
<!-- Config et structure de DATA -->
<script src="API_BILAN/config/model_tuning_biblio.js"></script>
<script src="API_BILAN/config/configTimeline.js"></script>
<script src="API_BILAN/data/alphabet.js"></script>
<script src="API_BILAN/data/dico.js"></script>
<script src="API_BILAN/data/initDATA.js"></script>
<script src="API_BILAN/config/fine_tuning_bounds.js"></script>

<!-- Physique et spectroscopie -->
<script src="API_BILAN/physics/physics.js"></script>
<script src="API_BILAN/data/hitran_lines_CO2.js"></script>
<script src="API_BILAN/data/hitran_lines_H2O.js"></script>
<script src="API_BILAN/data/hitran_lines_CH4.js"></script>
<script src="API_BILAN/spectroscopy/hitran.js"></script>
<script src="API_BILAN/physics/climate.js"></script>
<script src="API_BILAN/radiative/calculations.js"></script>
<script src="API_BILAN/workers/worker_pool.js"></script>

<!-- Modules de calcul -->
<script src="API_BILAN/h2o/calculations_h2o.js"></script>
<script src="API_BILAN/albedo/calculations_albedo.js"></script>
<script src="API_BILAN/atmosphere/calculations_atm.js"></script>
<script src="API_BILAN/co2/calculations_co2.js"></script>

<!-- Orchestration -->
<script src="API_BILAN/convergence/compute.js"></script>
<script src="API_BILAN/convergence/calculations_flux.js"></script>
<script src="API_BILAN/tuning.js"></script>
<script src="API_BILAN/api.js"></script>
```

Scripts classiques, pas de modules ES : les pages doivent pouvoir s'ouvrir en `file://`.

> ⚠️ Il n'y a plus de bundle. `configsAll.js` est un **stub** depuis la v1.2.0 (il ne fait que crier si
> on le charge seul) et `physicsAll.js` **n'existe plus**. Les versions de ce README antérieures à
> septembre 2026 en donnaient un copier-coller : il ne peut pas fonctionner.

### 2. Fournir le contrat hôte

Les modules de convergence appellent quelques globals attendus du programme hôte. Dans une page qui
n'a pas l'interface graphique, il faut les fournir explicitement — des stubs suffisent. Pas de garde
`typeof` côté API : c'est du crash-first assumé.

```js
window.ORG = { updateFluxLabels: function () {}, updateLabel: function () {} };
window.SYNC_STATE = { epochId: '⚫', animEnabled: false, ticTime: 0, calculationInProgress: false };
window.ABORT_COMPUTE = false;                    // passer à true pour interrompre un run
window.displayConvergence = function () {};
window.epochName = function (id) { return id; };

// Chemin du worker spectral si la page n'est pas à côté de API_BILAN/workers/
window.__SPECTRAL_WORKER_SCRIPT__ = new URL('API_BILAN/workers/spectral_slice_worker.js', location.href).href;
```

### 3. Lancer un calcul

```js
function onStep(event, payload) {
    if (event === 'ProcessFinished') {
        var T = payload.DATA['🧮']['🧮🌡️'];
        console.log('Température de surface :', (T - 273.15).toFixed(1) + ' °C');
    }
}

var api = window.getBilanRadiatifAPI(onStep);   // singleton ; new BilanRadiatifAPI(cb) donne la même instance

api.run({ epochId: '🚂', animEnabled: false }).then(function (result) {
    console.log('Calcul terminé', result);
});
```

Quelques secondes par époque. `api.run()` ne remet pas à zéro les compteurs de l'époque
(`DATA['📜']['📿💫']`, `['📿☄️']`) : c'est ce qui permet de rejouer un état précis, clic par clic.

---

## Époques

`epochId` = clé `'📅'` de `window.TIMELINE`. « Clics » = nombre d'événements pour traverser l'époque
(`🕰.order`, ou durée ÷ `🔺⏳`).

| epochId | Époque | De | À | Clics | Événements |
|---|---|---|---|---|---|
| `'⚫'` | Corps noir | — | — | 5 | ☄️ 💫 🎇 |
| `'🔥'` | Hadéen | 4,50 Ga | 4,00 Ga | 5 | 💫 ☄️ |
| `'🦠'` | Archéen | 4,00 Ga | 2,50 Ga | 3 | 💫 |
| `'🪸'` | Protérozoïque | 2,50 Ga | 750 Ma | 3 | 💫 |
| `'hysteresis 1a'` | Entrée sturtienne | 750 Ma | 720 Ma | 1 | 🗻 |
| `'⛄'` | Plein Snowball | 720 Ma | 690 Ma | 2 | 💫 🌋 |
| `'hysteresis 1b'` | Sortie marinoenne | 690 Ma | 600 Ma | 1 | 💫 |
| `'🪼'` | Paléozoïque marin | 600 Ma | 420 Ma | 1 | 💫 |
| `'🍄'` | Paléozoïque terrestre | 420 Ma | 280 Ma | 4 | 💫 (3 états `🔁`, Karoo) |
| `'💀'` | Extinction permienne | 280 Ma | 250 Ma | 1 | 💫 |
| `'🦕'` | Mésozoïque | 250 Ma | 66 Ma | 2 | 💫 🎇 |
| `'🦤'` | Cénozoïque | 66 Ma | 50 Ma | 1 | 💫 |
| `'🐊'` | Éocène | 50 Ma | 35 Ma | 1 | 💫 |
| `'hysteresis 2'` | Éocène–Oligocène | 35 Ma | 33 Ma | 1 | ⛰ |
| `'🏔'` | Grande Coupure → Pliocène | 33 Ma | 2 Ma | 2 | 💫 |
| `'🦣'` | Quaternaire | 2 Ma | 10 ka | 4 | 💫 (3 états `🔁`, Milankovitch) |
| `'🛖'` | Holocène | −10 ka | 1800 | 3 | 💫 |
| `'🚂'` | Ère industrielle | 1800 | 2000 | 2 | 💫 |
| `'📱'` | Aujourd'hui | 2000 | 2100 | 4 tranches | ⛽ 🛢 (par année) |

Le corps noir n'est pas une époque géologique mais le point de départ du raisonnement : une bille de
roche sans air ni eau, à −18 °C.

---

## Tuning : le barycentre d'incertitude 🧩

Le modèle dépend de paramètres dont la valeur exacte est scientifiquement incertaine (propriétés
optiques des nuages, sensibilité aux CCN, effet sulfate, seuils d'hystérésis). Plutôt que d'en figer
un jeu arbitrairement, un **curseur [0–100 %] par groupe** interpole entre les bornes de la
littérature, déclarées avec leur source dans `config/fine_tuning_bounds.js` :

- **0 %** → borne `min` de chaque paramètre du groupe
- **100 %** → borne `max`

Il n'y a pas de « valeur nominale » cachée : le défaut est un point du segment, pas une exception.

| Groupe | Rôle | Défaut |
|---|---|---|
| **ATM** | Curseur maître de l'atmosphère — pilote CLOUD_SW et SCIENCE | 45 % |
| **CLOUD_SW** | Propriétés optiques des nuages (albédo SW) | 45 % |
| **SCIENCE** | Sensibilités scientifiques (gain index nuageux, sensibilité CCN) | 45 % |
| **HYSTERESIS** | Seuils et facteurs de la rétroaction glace-albédo | 100 % |

`ATM`, `CLOUD_SW` et `SCIENCE` sont **liés** : régler l'un force les trois à la même valeur
(`tuning.js` v1.0.13). C'est voulu — ce sont trois vues du même flou sur l'atmosphère.

```js
api.run({
    epochId: '🚂',
    animEnabled: false,
    tuning: { CLOUD_SW: 70, SCIENCE: 70, HYSTERESIS: 100 }
});

// Forme longue équivalente
api.run({ epochId: '🚂', tuning: { baryByGroup: { ATM: 70, CLOUD_SW: 70, SCIENCE: 70, HYSTERESIS: 100 } } });
```

> Le groupe **SOLVER** n'existe plus comme barycentre : les paramètres de convergence sont statiques
> et vivent dans `window.CONFIG_COMPUTE` (`config/configTimeline.js`).

---

## Entrée / sortie

### `api.run(config)`

| Forme | Description |
|---|---|
| **Objet** | `{ epochId?, animEnabled?, ticTime?, tuning? }` |
| **String** | Identifiant d'époque seul (ex. `'🚂'`) |
| **Rien** | Époque par défaut `'⚫'` |

- **`epochId`** — clé d'époque dans `TIMELINE`.
- **`animEnabled`** — si `false`, la graine de température est celle de l'époque (`'🌡️🧮'`), pas la
  température courante. C'est le mode du banc : chaque époque part de la même amorce. En animation,
  l'état précédent est conservé — nécessaire pour voir une hystérésis.
- **`ticTime`** — pas de temps pour l'animation.
- **`tuning`** — voir ci-dessus.

### Sortie

- **Promise** — résout avec le résultat du calcul, ou `null` si le run a été abandonné.
- **Callback** `(event, payload)` :

| Événement | Quand |
|---|---|
| `'convergenceStep'` | à chaque pas du solveur |
| `'cycleCalcul'` | à chaque cycle (eau, albédo, radiatif) |
| `'ProcessFinished'` | fin du calcul — `payload.DATA` et `payload.result` |

Statut de sortie dans `DATA['🧮']['🧮🛑']` (`'converged'`, `'abort'`…).

### Pile de callbacks

Plusieurs écouteurs peuvent recevoir les mêmes événements :

```js
var stack = window.FUNC_API_BILAN.callbackStack;   // si callback_stack.js est chargé
stack.push(function (event, payload) { /* … */ });
// .pop(), .run(event, payload), .length()
```

---

## Alphabet et dictionnaire des clés

Les données sont indexées par des emojis (`'🌡️'` température, `'⚖️'` masse, `'🍰'` fraction…). La
référence rédigée — alphabet, catégories, formules par clé — est dans
**[doc/ALPHABET_ET_DICO.txt](doc/ALPHABET_ET_DICO.txt)** ; les définitions exécutables sont dans
`data/alphabet.js` et `data/dico.js`.

Le RENDU de ces définitions — grille du lexique, pictos PNG, helpers de logo — n'est pas ici : il vit
dans le dépôt CO2 (`static/compute/alphabet_render.js`, `dico_render.js`). L'API définit, l'application
dessine.

---

## Fichiers

| Fichier / dossier | Rôle |
|---|---|
| **api.js** | `BilanRadiatifAPI`, `run()` → Promise ; `window.getBilanRadiatifAPI(cb)` |
| **tuning.js** | Interpolation du barycentre → `DATA['🎚️']` |
| **callback_stack.js** | Pile d'écouteurs synchrones |
| **event_bus.js** | Bus d'événements (`IO_LISTENER`) |
| **receiver.js** | `createReceiver(options)` — dispatch vers un hôte (visu / scie) |
| **configsAll.js** | Stub — ancien bundle, retiré ; charger les sources séparément |
| **config/** | `configTimeline.js` (époques + `CONFIG_COMPUTE`), `fine_tuning_bounds.js`, `model_tuning.js`, `model_tuning_biblio.js` |
| **data/** | `alphabet.js` (CHARS, CHARS_DESC), `dico.js` (KEYS, DESC, FORM), `initDATA.js`, `hitran_lines_*.js` |
| **physics/** | Constantes et lois (Planck, Stefan-Boltzmann), `climate.js` |
| **spectroscopy/** | Sections efficaces HITRAN, profil de Voigt |
| **atmosphere/** | Structure verticale, pression, fractions molaires |
| **albedo/** | Albédo de surface, glace, nuages, voile stratosphérique |
| **h2o/** | Vapeur d'eau, nuages, partition liquide/glace |
| **co2/** | Pompe océanique (Henry/Revelle), puits forêts |
| **geology/** | Surfaces géologiques par époque |
| **radiative/** | Transfert radiatif couche par couche |
| **convergence/** | `compute.js` (masses, config d'époque), `calculations_flux.js` (solveur) |
| **workers/** | Pool de web workers pour le calcul spectral (N−1 threads) |
| **doc/** | Documentation détaillée : formules, algorithmes, bibliographie |
| **demo/** | Pages exécutables : banc d'époques, alphabet, dictionnaire — le dépôt se teste sans CO2 |

Découpage détaillé par catégorie de calcul : **[STRUCTURE.md](STRUCTURE.md)**.

---

## Parallélisme

`workers/worker_pool.js` ouvre `navigator.hardwareConcurrency − 1` workers pour le calcul spectral,
plafonnables par `CONFIG_COMPUTE.maxWorkers`.

Attention : certains navigateurs **sous-déclarent** ce nombre. Brave le randomise (protection
anti-empreinte dite *farbling*) : la valeur est inférieure au nombre réel de cœurs et change d'une
session à l'autre, donc les temps de convergence varient sans raison apparente. Chrome et Edge
annoncent le nombre réel.

---

## Conventions de code

Obligatoires pour toute contribution — humaine ou assistée.

1. **Globals `window.NOM_EN_MAJUSCULE`.** Les objets partagés (`DATA`, `EARTH`, `CONFIG_COMPUTE`,
   `CONST`…) sont des données vivantes. En entrée de fonction, une seule liaison locale
   (`const DATA = window.DATA`) plutôt que des accès `window.*` éparpillés.
2. **`window.` + identifiant minuscule** : suspect par défaut. L'exposition globale passe par des
   objets MAJUSCULE, sauf exception documentée.
3. **Crash-first.** Pas de garde silencieuse ni de repli sur une valeur plausible : si un prérequis
   manque, l'erreur doit être visible. C'est pour ça que le contrat hôte ci-dessus est explicite.
4. **Éviter les `if` abusifs** : privilégier un chemin unifié quand c'est possible.
5. **Un fichier = une responsabilité**, scripts classiques, en-tête `File / Desc / Version / Date /
   Copyright` dans chaque fichier, et un log de version à chaque modification.

---

## Documentation

Index complet — algorithmes, formules, physique, convergence, diagnostic, bornes du tuning :
**[doc/README.md](doc/README.md)**.

---

## Licence

Apache License 2.0 avec Commons Clause. Copyright DNAvatar.org — Arnaud Maignan.
