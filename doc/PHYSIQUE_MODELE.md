# Physique du modèle — EDS, Albédo, Vapeur, Nuages

## 1. Deux mécanismes distincts

### Albédo (en amont — réflexion SW)
- Fraction du rayonnement solaire réfléchie vers l'espace.
- Ce qui est réfléchi ne chauffe pas la surface.
- Seul `(1 − albédo) × flux_solaire` atteint la surface.

### EDS — Effet de serre (en aval — absorption IR)
- Gaz (CO₂, H₂O, CH₄) absorbent l'IR émis par la surface et le renvoient vers elle.
- La surface émet plus qu'elle ne perd vers l'espace.

| Concept | Rôle | Unité |
|---------|------|-------|
| Albédo | Ce qui ne chauffe pas (réflexion) | 0–1 |
| EDS | Ce qui réchauffe (gaz IR) | W/m² |
| forcing_Albedo | Diagnostic ΔF albédo (convention affichage) | W/m² |

---

## 2. H₂O : double rôle

- **Vapeur (gaz)** → EDS (absorption IR sur des bandes spectrales : 6,3 µm, ~17 µm, continuum fenêtre 8–12 µm).
- **Nuages (condensé)** → albédo (réflexion visible) + absorption IR large bande (type corps gris).

### Contributions à l'EDS (Schmidt et al. 2010)

| Composant | État | Contribution EDS |
|-----------|------|------------------|
| Vapeur d'eau | Gaz | ~50 % |
| Nuages | Gouttelettes / Glace | ~25 % |
| CO₂ | Gaz | ~20 % |
| Autres (CH₄, O₃) | Gaz | ~5 % |

**Total H₂O (vapeur + nuages) ≈ 75 %**, pas 93 %.

---

## 3. Architecture du modèle

### Vapeur d'eau (gaz) — dans le transfert radiatif IR
- Variable : `DATA['💧']['🍰🫧💧']` (fraction de vapeur au niveau de la mer)
- Profil vertical : `waterVaporFractionAtZ(z)` = r₀ × exp(-z/H_H₂O)
- Calcul spectral : `kappa_H2O = crossSectionH2O(λ) × n_H2O`
- Bandes : 6,3 µm et 17 µm

### Nuages — albédo SW + absorption IR LW
- Variables : `DATA['🪩']['☁️']` (index formation), `DATA['🪩']['🍰🪩⛅']` (couverture)
- **SW** : contribution à l'albédo planétaire (`calculateAlbedo()`)
- **LW** : τ_cloud corps gris dans le transfert radiatif (CLOUD_LW_TAU_REF)

### Facteur de scaling vapeur
`getH2OVaporEDSScale()` (T, P, vapor, CO₂) — formule physique, pas de hack par époque.
Corrige le chevauchement spectral H₂O/CO₂ autour de 15–17 µm. Réf. Schmidt 2010.

---

## 4. Attribution de l'EDS : tau-ratio vs Schmidt

Deux définitions différentes — pas une erreur de calcul.

| | Schmidt (littérature) | Nous (tau-ratio) |
|---|---|---|
| **Question** | « Si on retire le CO₂, de combien baisse G ? » (effet marginal) | « À chaque λ, quelle fraction de τ est due au CO₂ ? » (répartition proportionnelle) |
| **Méthode** | Expériences retrait/ajout + allocation des overlaps | τ_X/τ_tot × flux absorbé à chaque (couche, λ) |
| **Résultat CO₂** | ~20 % | ~4 % |

Les deux donnent la **même température d'équilibre** ; seul le diagnostic « qui a quel % de l'EDS » diffère.

### Overlap H₂O–CO₂ (implémenté)
À chaque (couche, λ), chevauchement = min(τ_H₂O, τ_CO₂). Partage « split the difference » (Schmidt 2010) : chacun reçoit la moitié du crédit de la partie commune.

---

## 5. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `API_BILAN/physics/physics.js` | CONST, EARTH, getH2OVaporEDSScale |
| `API_BILAN/radiative/calculations.js` | kappa, tau, EDS, attribution gaz/nuages |
| `API_BILAN/albedo/calculations_albedo.js` | Nuages → albédo, calculateCloudFormationIndex |
| `API_BILAN/h2o/calculations_h2o.js` | Vapeur, précipitations, cycle eau |
