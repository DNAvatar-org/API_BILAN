# Relais — 2026-10-12 — chantier NUAGES (structure verticale par la physique)

Pour une session vierge. Lire d'abord : `_dnavatar/AGENTS.md`, la mémoire projet (`MEMORY.md`, en particulier
`feedback_physique_dure_pas_de_calage`, `feedback_pas_de_if_abusifs`, `project_vapeur_hadeen_2026_10_12`).

## Règles de l'utilisateur (non négociables)
- **La physique, les formules, la littérature.** Jamais de recalage d'un paramètre sur un bilan mesuré
  (ex. « caler τ nuages sur CERES » = INTERDIT). Ordre : équation > mesure de laboratoire > fourchette déclarée.
- Pas de `if` abusifs, pas de replis silencieux, crash-first ; une seule référence par grandeur.
- Fichiers séparés (CSS/JS), scripts classiques, en-têtes `// File / Desc / Version / Date / Copyright 2026`.
- Ne jamais déployer ; ne commiter que sur demande ; réponses en français.

## État (commits API_BILAN 30382c8, CO2 2b2f6d6)
- Transfert : σ(λ,T) par couche, élargissement sans plafond + auto-élargissement H₂O, continuum Roberts 1976,
  densités molaires, profil unique `profilAtmosphere` (adiabatique sèche / humide non diluée / peau),
  `radiative/calculations.js`. Eau : IAPWS, régime « toute l'eau en vapeur » (`physics/physics.js`, `h2o/`).
- 🔥 physique : magma 2550 °C → 2227 °C à 1 ka → océan ~300 °C sous ~190 bar à 100 ka.
- **Ciel clair moderne JUSTE** : OLR 270 W/m² à 288 K (CERES ~266–269).
- **Nuages LW TROP FORTS** : 54 W/m² par retrait (CERES ~26–28) → toutes les époques +10 à +20 °C
  (📱 24,2 °C au lieu de 14,3). Bancs : `bench19` avant/après dans l'historique de session.
- Cause dans le code : `calculateFluxForT0` répartit τ_nuage = ☁️ × CLOUD_LW_TAU_REF (2,6, « sans source »)
  uniformément de la surface à la tropopause du profil (~214 K, ~12 km) : tout se passe comme si chaque nuage
  montait jusqu'à la tropopause. L'ancien modèle avait les mêmes ~55 W/m², masqués par un ciel clair trop
  transparent (H₂O compté ×0,6, pas de continuum).

## Pourquoi on change le calcul (réponse à « on avait un modèle correct en une passe »)
Il était juste par compensation de deux erreurs. La passe unique peut RESTER : la colonne double
(clair + nuageux, Marley et al. 2010) n'est qu'un raffinement ; en une passe, l'approximation classique est
l'émissivité effective par couche ε_eff = f·ε (fraction × émissivité du nuage dans la couche).

## Choix retenu : voie C complétée par Ackerman & Marley 2001 (ce que fait Windsor et al. 2022), en UNE passe
L'épaisseur et le contenu en eau des nuages sortent d'une équation, pas d'une donnée :
1. **Base** : première couche saturée du profil (déjà calculée dans `profilAtmosphere`).
2. **Condensat** (Ackerman & Marley 2001, éq. 4) : −K_zz ∂q_t/∂z − f_sed w* q_c = 0, q_t = q_v + q_c,
   q_v = saturation au-dessus de la base.
   - K_zz = (H/3)(l/H)^{4/3} (R F_c / (μ ρ c_p))^{1/3} (convection libre, Gierasch & Conrath 1985 ; éq. 5 de
     Windsor et al.), F_c = flux convectif (≈ solaire absorbé net en surface ; plancher h_c·F_net, h_c = 0,01).
   - l = k z / (1 + k z / H), k = 0,40 (Blackadar 1962) ; w* = K_zz / l.
   - f_sed : 0,6–1 (stratocumulus terrestres, Ackerman & Marley 2001) → milieu, déclaré.
3. **Taille des gouttes** : r_eff par l'équilibre sédimentation (Stokes + Cunningham) = w* (éq. 10–15 de
   Windsor), log-normale σ_g = 2.
4. **Opacité IR** : par couche, τ = 3/2 · (q_c ρ Δz) / (ρ_eau r_eff) (Stephens 1978) ; glace : Ebert & Curry 1992.
5. **Fraction** f : la même que l'albédo (🍰🪩⛅) — Windsor et al. : f « ne peut pas être prédite en 1D ».
   Une passe : τ_eff,couche = −ln(1 − f·(1 − e^{−τ})).
6. Remplacer `CLOUD_LW_TAU_REF` et la répartition uniforme ; garder le reste du transfert intact.

## Protocole de test
- Banc : `cd CO2 && python3 scripts/bench_headless/run.py bench19.js > sortie.out` (≈ 3 min) ; comparer les
  époques à leurs fourchettes et les passages d'hystérésis.
- Contrôle physique à 288 K figés sur 📱 (page `API_BILAN/demo/epoch_bench.html` en headless) : OLR ciel clair
  (☁️ = 0) doit rester ~270 ; effet nuages LW par retrait (`RADIATIVE.computeEdsRemovalShares`) → comparer à
  CERES (contrôle, PAS cible de calage).
- Chaîne 🔥 : frise puis clics jusqu'à 🦠 (magma → océan).

## Autres points ouverts
- Pas de captage du CO₂ à l'Hadéen (chantier C) ; bandes chaudes H₂O absentes (HITRAN, pas HITEMP).
- bary d'interpolation 🔀 = k/maxTics (devrait être ⏳/durée) ; gravité 🍎 fixe malgré le rayon f(T).
- Sorties de snowball 1b/1c : rebasculent chaudes (49 °C) depuis le profil unifié.

## Références (toutes dans `doc/BIBLIOGRAPHIE.html`)
windsor2022, ackermanMarley2001, stephens1978, marley2010, hartmannLarson2002, pierrehumbert2010,
wagnerPruss2002, wagner2011, roberts1976, chase1998, kasting1988, nakajima1992, lebrun2013, hamano2013.
