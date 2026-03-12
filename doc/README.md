# Documentation API_BILAN — Calcul bilan radiatif

Documentation technique du modèle et de l’API (algorithmes, convergence, formules, variables, diagnostic). Les chemins cités sont relatifs à la racine du projet (ex. `API_BILAN/convergence/calculations_flux.js`).

## Fichiers

| Fichier | Description |
|---------|-------------|
| **ALGORITHME_CALCULS.md** | Structure conceptuelle de l’algorithme (boucles, étapes), correspondance avec le code (computeRadiativeTransfer, simulateRadiativeTransfer, DATA). |
| **ALPHABET_ET_DICO.txt** | Référence alphabet (CHARS, CHARS_DESC) et dico (KEYS, DESC, FORM) — synchro avec `data/alphabet.js` et `data/dico.js`. |
| **SENS_CONVERGENCE_ET_VALEURS.md** | Sens de 🧮🛑, convention des flux (🔺🧲, 🧲🔬), diagnostic valeurs erronées / incohérentes. |
| **FORMULES.md** | Formules du modèle (Planck, atmosphère, absorption CO₂, transfert radiatif, Stefan-Boltzmann). |
| **VARIABLES_FLUX.md** | Variables vue Visuel (plotData, window) et mapping des étiquettes du flux. |
| **PRECISION_CALCULS_RADIATIF.md** | Paramètres de précision, résolution spectrale/verticale, pressure broadening, sections efficaces. |
| **EDS_VS_ALBEDO.md** | Distinction EDS (gaz IR) vs albédo (réflexion SW), forcing_Albedo, H₂O double rôle. |
| **VAPEUR_VS_NUAGES.md** | Vapeur (bandes spectrales) vs nuages (IR large bande), architecture DATA, calcul spectral. |
| **DEBUG_CONVERGENCE_TEMPERATURES.md** | Debug convergence T° par époque, philosophies code, pistes (SENS_CONVERGENCE_ET_VALEURS). |
| **PLAN_HITRAN_CROSS_SECTIONS.md** | Plan : remplacer formules empiriques par sections efficaces HITRAN (σ(λ,T,P)). |
| **DIAGNOSTIC_MODEL.md** | Points à traiter : affichage 📛 vs Schmidt, cloud_frac, runaway glace. |
| **REFS_LITTERATURE_ET_TUNING.md** | Littérature et tuning. |

## Liens

- Config époques : `API_BILAN/config/configTimeline.js`
- MAJUSCULES (window) : voir README principal et `CO2/window_MAJUSCULE_creater_filler.txt`
