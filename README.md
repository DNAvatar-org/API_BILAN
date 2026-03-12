# API_BILAN — Bilan radiatif (calcul pur)

API de calcul du bilan radiatif terrestre **sans rendu**. Entrée : configuration d’époque (epochId, tuning, etc.). Sortie : résultats et étapes intermédiaires via **callbacks synchrones** et **pile de listeners**.

Chargeable depuis `index.html`, `visu_radiatif.html` ou `scie_compute.html`. Fonctions regroupées dans `window.FUNC_API_BILAN`.

---

## 1. Input / Output

### Entrée

| Forme | Description |
|-------|-------------|
| **Objet config** | `{ epochId?, animEnabled?, ticTime?, tuning? }` — appliqué à `DATA`, `SYNC_STATE` puis calcul lancé. |
| **Identifiant seul** | String (ex. `'⚫'`, `'🔥'`) = époque utilisée pour le run. |
| **Sans argument** | `FUNC_API_BILAN.defaultEpochId` (`'⚫'`). |

- **epochId** : clé d’époque dans `TIMELINE` (ex. `'⚫'` Corps noir, `'🔥'` Hadéen). Détermine `DATA['📅']`, `DATA['📜']['🗿']`.
- **animEnabled** : copié dans `SYNC_STATE.animEnabled` ; si `false`, `DATA['🧮']['🧮🌡️']` est initialisé à `DATA['📅']['🌡️🧮']`.
- **ticTime** : copié dans `SYNC_STATE.ticTime`.
- **tuning** : objet appliqué via `applyTuningPayload(tuning)` (écrit dans `DATA['🎚️']`).

### Sortie

- **Promise** : résout avec le **résultat** du calcul (objet spectral, T0, flux, etc.) ou `null` si abort / erreur / init manquante.
- **Callbacks** : à chaque pas intermédiaire, la **pile de callbacks** est appelée de façon **synchrone** avec :
  - **event** : `'convergenceStep'` | `'cycleCalcul'` | `'ProcessFinished'`.
  - **payload** : selon l’event (snapshot DATA, iteration, etc.). Le récepteur dispatch pour le rendu (visu, scie ou contexte local).

---

## 2. Alphabet et Dico

Sémantique des clés et structure des données. **Source unique** pour l’API et l’UI.

### Alphabet (`data/alphabet.js`)

| Export | Rôle |
|--------|------|
| **CHARS** | Objet picto → caractère affiché (ex. `CHARS.CO2`, `CHARS.HADEEN`). Alias : `LOGOS`. |
| **CHARS_DESC** | Picto → libellé lisible (ex. « Corps noir », « Hadéen »). |
| **charsImages** | Picto → URL image (logos). |
| **getLogo**, **getLogoKey**, **getDisplayChar**, **getLogoImageSrc**, **getDisplayForPicto** | Helpers résolution affichage (texte ou image). |

Les **clés** (emojis) sont les mêmes dans `DATA`, dans la config des époques et dans l’alphabet. Voir `doc/ALPHABET_ET_DICO.txt` pour la liste complète (unités, éléments, calculs, époques).

### Dico (`data/dico.js`)

| Export | Rôle |
|--------|------|
| **KEYS** | Structure des clés par catégorie (utilisée par `initDATA.js` pour créer `DATA`). |
| **DESC** | Clé → description courte (pour tooltips, logs). |
| **FORM** | Clé → formule ou type (pour affichage formules dans l’UI). |
| **createDicoHtml** | Génère le HTML du dico depuis KEYS/DESC/FORM. |

`initDATA.js` crée `window.DATA` à partir de `KEYS` et des valeurs par défaut (dont `DATA['🎚️']` pour le tuning).

---

## 3. MAJUSCULES (window)

Les variables globales **créatrices** de l’état sont des `window.MAJUSCULE` (pas de `window.minuscules` pour l’état métier). Référence complète : **CO2/window_MAJUSCULE_creater_filler.txt**.

Principales utilisées par ou autour de l’API :

| MAJUSCULE | Créateur | Rôle |
|-----------|----------|------|
| **DATA** | `data/initDATA.js` | Matrice des calculs ; clés = alphabet (📜, 🧮, 🪩, 🫧, etc.). |
| **TIMELINE** | `config/configTimeline.js` | Tableau des époques (📅, ▶, ◀, 🌡️🧮, masses, etc.). |
| **SYNC_STATE** | `sync_panels.js` (côté app) | `epochId`, `animEnabled`, `ticTime`, `calculationInProgress`. |
| **CONST** | `physics/physics.js` | Constantes (Planck, Stefan-Boltzmann, R_GAS, etc.). |
| **TUNING** | `config/model_tuning.js` | CLOUD_SW, SOLVER, etc. ; recopié dans `DATA['🎚️']`. |
| **CHARS** / **LOGOS** | `data/alphabet.js` | Alphabet affichage. |
| **KEYS**, **DESC**, **FORM** | `data/dico.js` | Structure et descriptions. |
| **CONFIG_COMPUTE** | `config/configTimeline.js` | Bins, spinup, solver, logs. |
| **CO2_EVENTS** | `event_bus.js` | Bus d’events (on, off, emit) — ex. `compute:progress`, `compute:done`, `flux:lastDrawn`, `three:runStart`. |

L’API **lit** `DATA`, `TIMELINE`, `SYNC_STATE` et **écrit** dans `DATA` pendant le calcul. Elle n’instancie pas les MAJUSCULES ; elles sont créées par le chargement des scripts (config, data, physics, etc.) avant l’appel à l’API.

---

## 4. Méthodes principales

### API (api.js)

| Méthode | Description |
|---------|-------------|
| **FUNC_API_BILAN.BilanRadiatifAPI(callback)** | Constructeur. `callback(event, payload)` est appelé à chaque pas. |
| **api.run(configOrEpochId)** | Applique la config, initialise DATA/TIMELINE/SYNC_STATE, appelle `initForConfig()` puis `computeRadiativeTransfer()`. Retourne une **Promise** résolue avec le résultat ou `null`. |
| **FUNC_API_BILAN.defaultEpochId** | `'⚫'` (Corps noir). |
| **FUNC_API_BILAN.createReceiver(options)** | Crée un callback pour dispatch visu/scie (receiver.js). |
| **FUNC_API_BILAN.callbackStack** | Pile de listeners : `push(fn)`, `pop()`, `run(event, payload)`, `length()`. |

### Calcul (convergence, radiative)

| Fonction (globale) | Fichier | Rôle |
|--------------------|---------|------|
| **computeRadiativeTransfer(callback, options)** | `convergence/calculations_flux.js` | Point d’entrée principal : init, cycle eau, convergence T (Search/Dicho), callbacks à chaque pas. Options : `renderMode` ('visu_' \| 'scie_'). |
| **initForConfig()** | `convergence/calculations_flux.js` | Initialise les paramètres de convergence depuis DATA/TIMELINE ; retourne `false` si config invalide. |
| **getMasses()** | `convergence/compute.js` | Remplit les masses (CO2, CH4, H2O, etc.) depuis l’époque courante. |
| **getEpochDateConfig()** | `convergence/compute.js` | Retourne la config de l’époque courante (début, fin, tic). |
| **applyTuningPayload(p)** | App (sync_panels) | Écrit le tuning dans `DATA['🎚️']`. |

### Events (IO_LISTENER / CO2_EVENTS)

Émis par le calcul ou l’app :

- **compute:progress** : payload spectral (result, iteration, etc.) — chaque cycle de convergence.
- **compute:done** : calcul terminé (DATA, result).
- **flux:lastDrawn** : fin du rendu du dernier flux (visu).
- **three:runStart** : démarrage d’un run Three.js (texture / sphère).
- **plot:drawn** : bridge anim+visu (ack du draw pour reprendre le cycle).

---

## 5. Pile de callbacks (callback_stack.js)

- **Rôle** : à chaque pas de calcul, toutes les fonctions enregistrées sont appelées **en synchrone** avec `(event, payload)`.
- **API** : `FUNC_API_BILAN.callbackStack.push(fn)`, `.pop()`, `.run(event, payload)`, `.length()`.
- Lors de `api.run()`, l’API pousse le receiver sur la pile et passe à `computeRadiativeTransfer` un dispatcher qui appelle `callbackStack.run(event, payload)`. Les modules de calcul appellent le callback qu’on leur passe ; ce dispatcher remonte les events à toute la pile.

---

## 6. Ordre de chargement (dépendances)

Le loader principal (côté app) charge dans l’ordre :

1. **API_BILAN/config/** — model_tuning, model_tuning_biblio, configTimeline (TIMELINE, TUNING, CONFIG_COMPUTE).
2. **API_BILAN/data/** — alphabet, dico, initDATA (CHARS, KEYS, DATA), hitran_lines_CO2/H2O/CH4.
3. organigramme/configOrganigramme, event_bus (IO_LISTENER / CO2_EVENTS).
4. **API_BILAN/convergence/compute.js**, flux_manager (côté app).
5. (App :) tooltips, modal, patterns, physics, climate, atmosphere, albedo, geology, h2o, radiative, **convergence/calculations_flux**.
6. **API_BILAN/callback_stack.js**, **API_BILAN/api.js**, **API_BILAN/receiver.js**.
7. (App :) shell, plot, timeline, main, etc.

Tout le **calcul pur** (sans DOM/Plotly) est sous API_BILAN (config, data, physics, spectroscopy, atmosphere, albedo, h2o, radiative, convergence).

---

## 7. Fichiers et structure

| Fichier / dossier | Rôle |
|------------------|------|
| **api.js** | `BilanRadiatifAPI`, `run(configOrEpochId)` → Promise, branche callback sur la pile, appelle `computeRadiativeTransfer`. |
| **callback_stack.js** | Pile de listeners synchrones. |
| **receiver.js** | `createReceiver(options)` → callback pour dispatch visu/scie. |
| **config/** | configTimeline (TIMELINE), model_tuning (TUNING), fine_tuning_bounds. |
| **data/** | alphabet.js (CHARS, CHARS_DESC), dico.js (KEYS, DESC, FORM), initDATA.js (DATA), hitran_lines_*.js. |
| **physics/** | physics.js (CONST, EARTH, CONV, PHYS), climate.js. |
| **spectroscopy/** | hitran.js (sections efficaces, Voigt). |
| **atmosphere/** | calculations_atm.js. |
| **albedo/** | calculations_albedo.js. |
| **h2o/** | calculations_h2o.js. |
| **radiative/** | calculations.js (flux spectral couche par couche, EDS, OLR). Stockage spectral : 3 floats/λ (flux_init, ychange, flux_final) en DATA['📊'] ; getSpectralResultFromDATA reconstruit la grille pour l’affichage. |
| **convergence/** | compute.js (getMasses, getEpochDateConfig), calculations_flux.js (computeRadiativeTransfer, initForConfig). |
| **geology/** | calculations_geology.js. |
| **STRUCTURE.md** | Catégories de calculs, étapes du pipeline, liste des JS par catégorie. |
| **doc/** | Documentation détaillée (algorithmes, formules, précision, alphabet/dico, etc.). Voir **doc/README.md**. |

---

## 8. Workers (workers/)

- **worker_pool.js** : pool de N−1 workers (`navigator.hardwareConcurrency - 1`), optionnel `CONFIG_COMPUTE.maxWorkers` pour plafonner. Répartition des bins λ en tranches.
- **spectral_slice_worker.js** : tranche spectrale (parallélisation bande λ). Le main thread passe `constants` (Planck, etc.) depuis `window.CONST` dans chaque message.
- **compute_worker.js** : stub pour déporter le calcul (cycles) hors du main thread.

Création : chargement de `worker_pool.js` crée le pool ; chemin worker `API_BILAN/workers/spectral_slice_worker.js` (relatif à la page).

---

## 9. Documentation détaillée (doc/)

Voir **doc/README.md** pour l’index. Contient notamment :

- **ALGORITHME_CALCULS.md** — Boucles, étapes, correspondance avec le code.
- **ALPHABET_ET_DICO.txt** — Liste complète des pictos et clés.
- **FORMULES.md** — Planck, atmosphère, transfert radiatif.
- **SENS_CONVERGENCE_ET_VALEURS.md**, **PRECISION_CALCULS_RADIATIF.md**, **EDS_VS_ALBEDO.md**, **VAPEUR_VS_NUAGES.md**, etc.

---

## 10. Usage

```js
var FUNC = window.FUNC_API_BILAN;
var receiver = FUNC.createReceiver({ dispatchVisu: true, dispatchScie: true });
var api = new FUNC.BilanRadiatifAPI(receiver);

// Entrée : config complète ou identifiant d'époque seul
api.run({ epochId: '⚫', animEnabled: false }).then(function (result) { ... });
api.run('🦠');  // identifiant seul
api.run();     // sans argument = defaultEpochId ('⚫')
```

Compatibilité : `window.BilanRadiatifAPI` et `window.createBilanRadiatifReceiver` restent exposés.
