# Registre des constats

Un constat n'entre ici qu'avec son **état**, la **sonde** qui le reproduit (dans `CO2/scripts/bench_headless/`) et le **commit**
d'API_BILAN sur lequel il a été mesuré. On ne revient pas sur un constat mesuré sans une nouvelle sonde qui le contredit ; on
ne cite pas de mémoire une valeur de contrôle : elles sont dans `data/controles_mesures.js` et `data/isccp_h_2010.js`.

États : **mesuré** (sonde et sortie), **réfuté** (une sonde le contredit), **hypothèse** (à mesurer, rien ne s'appuie dessus).
Logos de statut : ceux de l'alphabet (`data/alphabet.js`) — ⚛ physique, 📡 mesure, 💻 simulation/réanalyse, ❔ extrapolé,
🔧 calage, 🔢 numérique, 🎯 contrôle.

Avant d'interpréter un champ : vérifier sa définition (moyenne, maximum, vue d'en haut…) dans le code qui l'écrit. Les champs
hors de DATA n'ont pas de ligne de dico : c'est là que se font les contresens (C7).

---

## C1 — Sensibilité au doublement du CO₂ sur 📱
- **mesuré**, `sondes` : scénario `⚖️🏭 x2` (scenarios.js), commit de travail du 2026-11-06 (avant `2df2524`).
- Stratosphère grise de peau, forçage instantané : **+2,72 K** (equation.html, carte du bilan). Le « 1,9 °C » cité ailleurs
  est périmé.
- Stratosphère en équilibre radiatif, sans O₃ IR : **+3,55 K** (14,4 → 17,4 → 20,9 °C).
- Avec O₃ IR (`2df2524`) : +2,57 K, mais sur un 📱 non recalé à 22,6 °C : **non significatif** tant que 📱 n'est pas à sa
  température mesurée.

## C2 — Colonne unique à T̄ (OLR de la température moyenne au lieu de la moyenne des OLR)
- **réfuté** comme source d'erreur, `bilan_vs_T.js` sur 📱 (`2df2524`) : OLR'' = −0,004 W/m²/K² à 14,4 °C ;
  ½·OLR''·⟨ΔT²⟩ avec ⟨ΔT²⟩ = T₂²/5 ≈ 106 K² : **−0,2 W/m²**. L'estimation par σT⁴ (3–4 W/m²) était fausse : l'OLR réel est
  presque linéaire en T (vapeur).

## C3 — Effet de serre de l'ozone
- **mesuré**, 📱 à 14,4 °C imposé (`2df2524`) : retirer O₃ (IR et solaire) monte l'OLR de **5,7 W/m²**.
- 🎯 ordre de grandeur publié : ~10 W/m² en ciel clair (Kiehl & Trenberth 1997, à lire dans l'article avant de citer le
  chiffre exact).

## C4 — Effets des nuages par type (📱, 14,4 °C imposé, `2df2524`)
- **mesuré** (fractions F_BAS, F_MOYEN, F_HAUT mises à 0 une par une) — SW / LW [W/m²] :
  bas −18,5 / +2,7 ; moyens −11,5 / +8,0 ; hauts −8,4 / +18,4 ; tous −40,2 / +31,9.
- 🎯 CERES EBAF Ed4.0 corrigé « ciel clair modèle » : −46,0 / +26,7 (`data/controles_mesures.js`).

## C5 — Nuages vus d'en haut (simulateur ISCCP) contre ISCCP-H 2010 📡
- **mesuré** (📱, 14,4 °C, `2df2524`) — quantité / τ :
  bas 0,236 / 4,5 contre 0,231 / 4,9 ; moyens 0,156 / 6,6 contre **0,189** / 6,7 ; hauts 0,208 / 4,8 contre **0,247 / 3,8** ;
  total **0,599** contre **0,668**.
- Les nuages moyens et hauts sont trop peu vus d'en haut ; les hauts trop épais.
- Lien possible (**hypothèse**) : F_HAUT va de 0,29 (capteur passif) à 0,37 (lidar), alors que la distribution des τ des
  nuages hauts est construite sur les seules parts CALIPSO (validation 2026-11-06, défaut majeur).

## C6 — Eau précipitable
- **mesuré** : 15,5 kg/m² (📱, 14,4 °C, `2df2524`), Σ n_H₂O·dz du profil du transfert.
- 🎯 24,5–24,9 ± 2 kg/m² (Trenberth & Smith 2005, ERA-40, `data/controles_mesures.js`).

## C7 — Eau des nuages bas continentaux (W = 532 g/m², τ ≈ 71)
- **réfuté** comme anomalie : c'est le nuage **le plus profond** de la population (au seuil de pluie), pas une moyenne.
  ⚛ eau maximale avant la pluie (4π/3)ρ k N r³ ≈ 1,4 g/m³ (k 0,67, N 200 cm⁻³, r 13 µm 📡) → ~700 m de nuage → ~480 g/m².
  Contrôle 🎯 : classe épaisse des nuages bas (τ > 22,6) 0,029 à τ 39 contre ISCCP-H 0,022 à τ 43.
- Cause du contresens : `populations[].W` est un champ local, sans ligne de dico qui dise « maximum de la population ».

## C8 — Tableau des contrôles 📱 (`sondes/controles.js`, `2df2524`)
- **mesuré**, surface imposée à la T mesurée (14,26 °C), stratosphère à l'équilibre — modèle / mesure 🎯 / écart :
  OLR 230,4 / 240,1 / −9,7 ; SW réfléchi 101,2 / 99,1 / +2,1 ;
  OLR ciel clair 261,4 / 266,85 / −5,5 ; SW clair réfléchi 61,1 / 53,5 / +7,6 ;
  effet nuages LW 31,0 / 26,75 / +4,3 ; effet nuages SW −40,1 / −45,6 / +5,5 ;
  eau précipitable 15,3 / 24,7 / −9,4 kg/m² ; nuages vus d'en haut 0,60 / 0,67.
- ⚛ La vapeur suit Clausius-Clapeyron : 15,3 kg/m² à 14,3 °C, 29,4 kg/m² à 22,6 °C, soit +8 %/K (C-C ≈ 7 %/K). La
  rétroaction de la vapeur est vivante (la note « morte » du 2026-09-20 est périmée).
- **hypothèse** (à mesurer) : le ciel clair est trop opaque de 5,5 W/m² avec 38 % d'eau en moins que mesuré — soit le
  transfert est trop opaque par molécule, soit l'eau est mal placée sur la verticale. Test qui tranche : un profil mesuré
  (T, H₂O, O₃) passé dans le transfert du modèle, contre un calcul raie par raie publié pour ce même profil.

## C9 — Transfert IR contre le raie par raie de RTMIP (`sondes/rtmip_mls.js`, `2df2524`)
- **mesuré** : profil AFGL été des latitudes moyennes (Anderson et al. 1986), surface 294 K, sans nuages ; forçages
  instantanés au sommet, modèle (6000 points / 2000 points) contre codes LBL (Collins et al. 2006, table 8, moyenne ± σ) :
  CO₂ 287 → 369 ppm : **1,016** contre 1,01 ± 0,02 ; CO₂ 287 → 574 : **2,799** (2,853 à 2000 points) contre 2,80 ± 0,06 ;
  H₂O × 1,2 : **4,05** (4,08) contre **3,78 ± 0,09**.
- ⚛📡 La spectroscopie du CO₂ est validée (écart < 1 %, sous l'écart-type des codes LBL). L'échantillonnage à 2000 points
  ajoute ~2 %.
- La réponse à la vapeur est trop forte de **7 %** (3 σ) : à quantité d'eau égale, le transfert répond trop à H₂O. Elle porte
  la rétroaction de la vapeur, donc la sensibilité au CO₂.
- **hypothèse** (à mesurer) : le continuum de H₂O (Roberts et al. 1976, ancien, défini pour des raies coupées autrement
  qu'à ±5 cm⁻¹) ou les ailes des raies de H₂O. Test qui tranche : refaire 4a−2b avec le continuum MT_CKD (Mlawer et al.,
  coefficients publiés par AER) et le même découpage des raies que MT_CKD (±25 cm⁻¹, « plinthe » retirée).

## C10 — Continuum MT_CKD au lieu de Roberts : le transfert passe RTMIP (`sondes/rtmip_mls.js`, travail sur `2df2524`)
- **mesuré** : continuum MT_CKD 4.3 (data/mtckd_h2o.js) et raies de H₂O à ±25 cm⁻¹ moins la plinthe (sa convention) ;
  modèle 6000 / 2000 points contre LBL RTMIP : CO₂ 287 → 369 **1,022** / 1,050 (1,01 ± 0,02) ; CO₂ 287 → 574 **2,816** / 2,857
  (2,80 ± 0,06) ; H₂O × 1,2 **3,804** / 3,813 (3,78 ± 0,09). Les trois dans l'écart-type des codes LBL à 6000 points.
- Confirme C9 : la réponse à la vapeur trop forte venait du continuum de Roberts (44 % plus fort que MT_CKD à 1000 cm⁻¹,
  296 K). OLR ciel clair du profil MLS : 292,0 → 287,9 W/m² (MT_CKD ajoute le continuum hors de 400–1250 cm⁻¹).
- L'échantillonnage à 2000 points (résolution des époques) surestime les forçages de 1–3 % (bruit spectral connu).

## C11 — Contrôles 📱 après MT_CKD (`sondes/controles.js`, travail sur `2df2524`)
- **mesuré**, surface à la T mesurée (14,26 °C) — modèle / mesure 🎯 / écart : OLR 227,7 / 240,1 / −12,4 ; OLR ciel clair
  257,8 / 266,85 / **−9,1** ; SW clair réfléchi 61,1 / 53,5 / +7,6 ; effet nuages LW 30,1 / 26,65 / +3,5 ; effet nuages SW
  −40,1 / −45,6 / +5,5 ; eau précipitable 15,3 / 24,7. Équilibre : **24,5 °C**.
- Le transfert est validé en SENSIBILITÉ (C10), pas encore en NIVEAU : l'OLR absolu d'un profil mesuré n'a pas de référence
  lue (MLS : 287,9 W/m² dans le modèle).
- **hypothèse** (à mesurer, ⚛, à lire avant de citer : Pierrehumbert 1995, J. Atmos. Sci. 52:1784) : une colonne unique à
  l'humidité moyenne est plus opaque que la Terre réelle. L'OLR décroît comme ln(eau) (convexe) : les régions sèches (air
  descendant des subtropiques) émettent beaucoup plus que la moyenne ne le dit. La courbure mesurée en C2 suivait T à
  humidité relative fixée ; elle ne voit pas la dispersion de l'humidité relative à T donnée.

## C12 — Niveau du transfert IR sur des profils MESURÉS : CIRC phase I (`sondes/circ_clair.js`, MT_CKD, travail sur `2df2524`)
- **mesuré** : OLR du modèle contre LBLRTM (Oreopoulos et al. 2012, table 1 ; fichiers des cas), surface d'émissivité 1, H₂O,
  CO₂, O₃, CH₄ du cas (N₂O, CO, CFC absents du moteur) — modèle 6000 / 2000 points, LBLRTM, écart à 6000 :
  cas 1 (SGP, 1,23 cm) 309,75 / 307,35 / 304,27 / **+5,5** ; cas 2 (SGP, 4,85 cm) 297,60 / 294,77 / 292,65 / **+5,0** ;
  cas 3 (SGP, 2,31 cm) 285,45 / 282,95 / 280,77 / **+4,7** ; cas 4 (NSA, 0,32 cm) 232,03 / 231,22 / 230,51 / **+1,5** ;
  cas 5 (cas 4, 2 × CO₂) 230,53 / 229,76 / 229,18 / +1,4.
- Le transfert n'est **pas** trop opaque : sur des profils mesurés il est un peu TROP TRANSPARENT (+1,5 à +5,5 W/m²), en partie
  par les gaz absents (N₂O, CFC : à chiffrer). Forçage du 2 × CO₂ en Arctique : 1,50 contre 1,33 (LBLRTM).
- Donc l'hypothèse (1) de C11 est **réfutée** : le ciel clair trop opaque de 📱 (−9 W/m² contre CERES) vient de l'ÉTAT de
  l'atmosphère de la colonne unique (profil de T, humidité), pas de l'équation ni de la spectroscopie.
- L'échantillonnage à 2000 points abaisse l'OLR de ~2,5 W/m² par rapport à 6000 (biais spectral, signe fixe ici).

## C13 — N₂O dans le transfert : CIRC refermé à ~2 W/m² (`sondes/circ_clair.js` v1.1.0, travail sur `2df2524`)
- **mesuré** : N₂O ajouté (HITRAN, 24 312 raies, 0–3500 cm⁻¹ ; TIPS) avec le N₂O mesuré de chaque cas — écart à LBLRTM,
  6000 / 2000 points : cas 1 **+2,3** / +1,1 ; cas 2 **+1,9** / +0,3 ; cas 3 **+1,7** / +0,3 ; cas 4 **+0,1** / −0,1 ;
  cas 5 **0,0** / −0,2 W/m².
- N₂O valait 1,5 (Arctique) à 3,2 W/m² (SGP) d'OLR. Reste +1,7 à +2,3 W/m² (0,6–0,7 % de l'OLR) aux latitudes moyennes, 0 en
  Arctique : CFC absents (quelques dixièmes) et, **hypothèse**, la coupure des raies de CO₂ à ±5 cm⁻¹ ou l'échantillonnage.
- À 2000 points (les époques), l'écart tombe sous ±1 W/m², par compensation avec le biais d'échantillonnage (C12) : un
  accord fortuit, pas une validation.
- Les époques n'ont pas encore de N₂O (0 dans profilAtmosphere) : il leur manque 1,5–3 W/m² d'effet de serre.

## C14 — Hétérogénéité et profil de la colonne (`sondes/afgl_heterogeneite.js`, MT_CKD + N₂O, travail sur `2df2524`)
- **mesuré** (ciel clair, 2000 points, surface moyenne 289,98 K, poids d'aire 0,5 / 0,183 / 0,183 / 0,067 / 0,067) :
  (a) moyenne des OLR des cinq profils AFGL **268,95** ; (b) OLR du profil moyen **266,34** (29,4 kg/m² d'eau) ;
  (c) colonne du modèle à la même surface **262,80** (18,7 kg/m² d'eau).
- **Hétérogénéité** (a) − (b) = **+2,6 W/m²** : réelle, modeste (C11 hypothèse (2) confirmée en ordre de grandeur).
- **Colonne du modèle** (b) − (c) = **+3,5 W/m²** malgré 36 % d'eau en moins : sa troposphère est TROP FROIDE —
  T à 3 / 6 / 9 km : modèle ≈ 270 / 251 / 229 K contre profil moyen AFGL 276 / 257 / 237 K (−6 à −8 K). Gradient moyen
  0–9 km : 6,8 K/km contre 5,8 K/km. La tropopause du modèle (213 K) est vers 10,5 km, celle du profil moyen (~210 K) vers 15 km.
- Cause visible (⚛) : la parcelle monte de la surface MOYENNE, non saturée — adiabatique sèche (9,8 K/km) jusqu'à
  la condensation, puis humide. La troposphère réelle n'est pas la parcelle de la surface moyenne.
- (a) − (c) = 6,2 W/m² ; c'est l'essentiel du ciel clair trop opaque de 📱 (C11, C13).
