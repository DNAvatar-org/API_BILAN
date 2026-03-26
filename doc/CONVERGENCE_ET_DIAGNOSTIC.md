# Convergence et diagnostic

## 1. Que signifie `🧮🛑 = 'converged'` ?

La boucle radiatif s'arrête avec `🧮🛑 = 'converged'` lorsque :

```
|🔺🧲| ≤ 🧲🔬
```

- **🔺🧲** : déséquilibre radiatif (W/m²) = flux entrant − flux sortant. À l'équilibre : **🔺🧲 ≈ 0**.
- **🧲🔬** : tolérance en W/m² = `max(4σT³ × precision_K, tolMinWm2)`.

Donc `'converged'` = « le bilan est assez proche de zéro ». Ce n'est pas un équilibre parfait (Δ = 0).

---

## 2. Convention des flux

```
🔺🧲 = flux_entrant − flux_sortant = (🧲☀️🔽 + 🧲🌕🔽) − 🧲🌈🔼
```

| Terme | Rôle | Valeur litt. (Terre) |
|-------|------|----------------------|
| 🧲☀️🔽 | Solaire absorbé | ~238 W/m² |
| 🧲🌕🔽 | Géothermique | ~0,1 W/m² |
| 🧲🌈🔼 | OLR (flux sortant TOA) | ≈ flux_entrant (~238) à l'équilibre |
| 🧲🌑🔼 | σT⁴ (surface corps noir) | ~390–400 W/m² |
| 🧲🪩🔼 | Flux réfléchi (albédo) | ~100 W/m² |

- **🔺🧲 > 0** : 🧲🌈🔼 trop bas → trop de piégeage IR (EDS trop fort).
- **🔺🧲 < 0** : 🧲🌈🔼 trop haut → pas assez d'absorption IR (EDS insuffisant).

---

## 3. Valeurs comparables à la littérature

**Mêmes grandeurs, mêmes unités → comparaison valide.**

| Variable | Modèle @15,7°C | Littérature | Verdict |
|----------|----------------|-------------|---------|
| 🧲☀️🔽 | 238,27 W/m² | ~238 W/m² | OK |
| 🧲🌈🔼 | 232,43 W/m² | ~238 W/m² (OLR équilibre) | Trop faible |
| 🔺🧲 | 5,93 W/m² | ≈ 0 | Déséquilibre |
| 🧲📛 (EDS total) | 159,96 W/m² | G ~155–160 W/m² (KT97) | OK |
| 🍰🪩📿 | 30 % | ~29 % | OK |
| ☁️ | 62 % | 60–70 % | OK |
| 🍰🫧💧 (vapor) | 0,9 % | 0,25–1 % | OK |
| 🍰🫧☔ (RH) | 79,9 % | 70–80 % | OK |

---

## 4. Diagnostic : convergence trop basse

### Constat

| Epoch | T° simulée | T° attendue | Écart |
|-------|------------|-------------|-------|
| ⚫ Corps noir | -18,1°C | -18°C | OK |
| 🔥 Hadéen | 2211,5°C | ~2177°C | OK |
| 🦠 Archéen | -2,1°C | 15°C | -17°C |
| 🚂 Pré-industriel | 2,2°C | 12°C | -9,8°C |
| 📱 Aujourd'hui | 4,1°C | 15,7°C | -11,6°C |

**Problème** : À partir de l'Archéen, les T° convergent vers ~2–6°C au lieu des 12–15°C attendus.

### Chaîne de cause

OLR trop élevé à 15°C → trop peu d'absorption IR → EDS ~105 W/m² vs litt. ~155–165 → dichotomie converge vers une T plus basse.

### Sources d'erreur possibles (par ordre de vérification)

| Maillon | Où | Effet si sous-évalué |
|---------|-----|---------------------|
| **getH2OVaporEDSScale** | `physics.js` | Scale < 1 réduit κ_H₂O → moins d'absorption vapeur |
| **Résolution spectrale** (🔬🌈) | configTimeline.js | Peu de bins → raies étroites manquées → τ intégré trop faible |
| **Sections efficaces** (HITRAN) | `calculations.js` | σ(λ, T_ref, P_ref) trop faibles |
| **Pas vertical** (delta_z) | `calculations.js` | Couches trop épaisses → τ par couche sous-estimé |
| **Pressure broadening** | `calculations.js` | σ × √(P/P_ref), cap 2.0 |
| **Nuages LW** | `calculations.js` | CLOUD_LW_TAU_REF trop faible |

### Corrections appliquées

- **τ nuages LW** : CLOUD_LW_TAU_REF = 1,5 (lit. stratus/cumulus 5–20).
- **getH2OVaporEDSScale** : formule T, P, vapor, CO₂ → scale ~0,5–1,0 selon les conditions. CO₂ ≥ 400 ppm → scale = 1.
- **Épaisseur réelle** : delta_z_real = z_range[i+1] − z_range[i] (pas une constante).

---

## 5. EDS W/m² par composant vs littérature

| Composant | Modèle (W/m²) | KT97 (W/m²) | Note |
|-----------|---------------|-------------|------|
| CO₂ | ~6 | ~32 | Écart dû à l'attribution (tau-ratio vs par bande) |
| H₂O | ~141 | ~75 | H₂O dominant dans notre méthode |
| CH₄ | ~12 | quelques W/m² | OK |
| Nuages | ~0,4 | ~30 | τ nuages encore faible |

L'écart CO₂ (6 vs 32) vient de la méthode d'attribution, pas d'un bug. Voir [PHYSIQUE_MODELE.md](PHYSIQUE_MODELE.md) §4.

---

## 6. Credences et paramètres tunables

Chaque paramètre tunable a en commentaire dans le code :
- **Credence** : niveau de confiance (ex. ~60 %, ~95 %).
- **Plage littérature** : intervalle de valeurs trouvées en lit.

| Paramètre | Credence | Fichier |
|-----------|----------|---------|
| getH2OVaporEDSScale | ~60 % | physics.js |
| 🔬🌈 (bins spectaux) | ~70 % | configTimeline.js |
| HITRAN T_ref/P_ref | ~90 % | hitran.js |
| delta_z | ~70 % | calculations.js |
| CLOUD_LW_TAU_REF | ~55 % | calculations.js |

---

## 7. Logs diagnostic

```js
// Activer en console avant calcul :
window.DEBUG_ANALYSE = true;
// ou :
CONFIG_COMPUTE.logEdsDiagnostic = true;
```

Logs affichés :
- `[ANALYSE] convergence` : bins, layers, P_atm, delta_W, EDS, T_final_K
- `[EDS] h2o_eds_scale=… bins=… delta_z=… OLR=… EDS=…`
- `pd()` : logs détaillés par fonction (iterate, Search, crossing)
