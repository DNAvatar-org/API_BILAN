# Références : littérature vs config par époque, bornes du tuning

**Source unique** pour retrouver où sont documentées les données littéraires et les bornes de tuning.

---

## 1. Données littéraires vs config par époque

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/configTimeline.js** | Source de vérité des paramètres par époque (🌡️🧮, 🔋☀️, ⚖️🏭, etc.) |
| **doc/autorités/RAPPORT_CONFIG_TIMELINE_VS_LITTERATURE.md** | Synthèse config vs littérature (température, soleil, masses gaz, flux géothermique) |
| **doc/autorités/COMPARAISON_LITTERATURE_16C.md** | Comparaison variables du modèle @ 16,1°C avec ordres de grandeur Terre (cycle eau, atmosphère, albédo) |
| **doc/autorités/VALIDATION_CONFIG_GAZ.md** | Traçabilité masses gaz (⚖️🏭, ⚖️🐄, ⚖️🫁) par époque vs littérature |
| **doc/EPOQUES_RECAP.md** | Récap époques et choix des emojis (⚫🔥🦠🥟…) |
| **doc/PARAMETRES_EPOQUES.html** | Tableau paramètres (aligné configTimeline) |

---

## 2. Bornes du tuning (fine-tuning)

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/fine_tuning_bounds.js** | Bornes min / max / default par cible (CLOUD_SW, SOLVER, etc.) — `window.FINE_TUNING_BOUNDS` |
| **API_BILAN/config/model_tuning.js** | Paramètres nominaux du modèle (CLOUD_SW, SOLVER, etc.) |
| **API_BILAN/config/model_tuning_biblio.js** | Références biblio associées aux paramètres de tuning |

---

---

## 3. Luminosité solaire — Formule de Gough (1981)

La luminosité solaire est calculée dynamiquement par la formule de Gough (1981), **pas** par interpolation linéaire entre époques.

$$L(t) = \frac{L_\odot}{1 + 0.4 \times t / t_\odot}$$

| Référence | Valeur | Source |
|-----------|--------|--------|
| L☉ | 3.828×10²⁶ W | IAU 2015 Resolution B3 |
| TSI | 1361 W/m² | Kopp & Lean (2011) GRL 38:L01706, TSIS-1 |
| Âge Soleil | 4.57 Ga | Standard solaire |
| Coeff. 0.4 | Homologie stellaire H→He | Gough (1981) Solar Physics 74:21–34 |
| Confirmation | Modèles numériques | Bahcall, Pinsonneault & Basu (2001) ApJ 555:990 |

Code : `goughLuminosity()` dans `API_BILAN/convergence/compute.js` et `API_BILAN/physicsAll.js`.

🔒 Les valeurs 🔋☀️ dans `configTimeline.js` servent uniquement de référence statique. Le calcul réel utilise toujours Gough dynamiquement.

---

*Créé 2025-03-08 — à mettre à jour si déplacement de fichiers.*
