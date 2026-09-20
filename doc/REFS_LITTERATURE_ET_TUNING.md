# Références : littérature vs config par époque, bornes du tuning

**Source unique** pour retrouver où sont documentées les données littéraires et les bornes de tuning.

---

## 1. Données littéraires vs config par époque

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/configTimeline.js** | Source de vérité des paramètres par époque (🌡️🧮, 🔋☀️, ⚖️🏭, etc.) |
| **CO2/doc/autorités/RAPPORT_CONFIG_TIMELINE_VS_LITTERATURE.md** | Synthèse config vs littérature (température, soleil, masses gaz, flux géothermique) |
| **CO2/doc/autorités/COMPARAISON_LITTERATURE_16C.md** | Comparaison variables du modèle @ 16,1°C avec ordres de grandeur Terre (cycle eau, atmosphère, albédo) |
| **CO2/doc/autorités/VALIDATION_CONFIG_GAZ.md** | Traçabilité masses gaz (⚖️🏭, ⚖️🐄, ⚖️🫁) par époque vs littérature |
| **CO2/doc/API/PARAMETRES_EPOQUES.html** | Tableau paramètres (aligné configTimeline) |

---

## 2. Bornes du tuning (fine-tuning)

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/fine_tuning_bounds.js** | Bornes min / max / default par cible — groupes CLOUD_SW, SCIENCE, RADIATIVE, HYSTERESIS — `window.FINE_TUNING_BOUNDS`. Plus de groupe SOLVER : ses quatre cibles ont été retirées (v1.3.7), la calibration du solveur est statique dans `window.CONFIG_COMPUTE`. |
| **API_BILAN/config/model_tuning.js** | Paramètres nominaux du modèle (CLOUD_SW, etc.) |
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

Code : `goughLuminosity()` dans `API_BILAN/convergence/compute.js` — source unique depuis le retrait du bundle `physicsAll.js`.

🔒 Les valeurs 🔋☀️ dans `configTimeline.js` servent uniquement de référence statique. Le calcul réel utilise toujours Gough dynamiquement.

---

*Créé 2025-03-08. Revu 2026-09-20 : chemins des documents d'autorité qualifiés `CO2/` (ils vivent dans le dépôt applicatif, pas ici), `physicsAll.js` et `EPOQUES_RECAP.md` retirés — ils n'existent plus, groupe de tuning SOLVER retiré.*
