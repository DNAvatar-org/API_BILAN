# Documentation API_BILAN

Documentation technique du modèle et de l'API (algorithmes, convergence, formules, diagnostic). Les chemins sont relatifs à `API_BILAN/`.

## Fichiers

| Fichier | Description |
|---------|-------------|
| **[ALGORITHME_CALCULS.md](ALGORITHME_CALCULS.md)** | Structure de l'algorithme (boucles, étapes, convergence), correspondance avec le code. |
| **[ALPHABET_ET_DICO.txt](ALPHABET_ET_DICO.txt)** | Référence : alphabet (49 emojis), dictionnaire des clés par catégorie, formules. |
| **[FORMULES.md](FORMULES.md)** | Formules du modèle (Planck, atmosphère, absorption, transfert radiatif, Stefan-Boltzmann). |
| **[PHYSIQUE_MODELE.md](PHYSIQUE_MODELE.md)** | Physique : EDS vs albédo, vapeur vs nuages, attribution (tau-ratio vs Schmidt), overlap H₂O–CO₂. |
| **[CONVERGENCE_ET_DIAGNOSTIC.md](CONVERGENCE_ET_DIAGNOSTIC.md)** | Convergence (🧮🛑), convention des flux, diagnostic valeurs, credences, logs debug. |
| **[PRECISION_CALCULS_RADIATIF.md](PRECISION_CALCULS_RADIATIF.md)** | Paramètres de précision, résolution spectrale/verticale, pressure broadening, sections efficaces. |
| **[PLAN_HITRAN_CROSS_SECTIONS.md](PLAN_HITRAN_CROSS_SECTIONS.md)** | Plan : remplacer formules empiriques par sections efficaces HITRAN (σ(λ,T,P)). |
| **[REFS_LITTERATURE_ET_TUNING.md](REFS_LITTERATURE_ET_TUNING.md)** | Fichiers de référence : littérature vs config, bornes du tuning. |

## Liens utiles

- Config époques : `API_BILAN/config/configTimeline.js`
- Tuning : `API_BILAN/config/model_tuning.js`, `fine_tuning_bounds.js`
- Structure des fichiers : `API_BILAN/STRUCTURE.md`
