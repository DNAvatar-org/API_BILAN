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

## C15 — Profil moyen des zones dans UNE colonne : réfuté (`sondes/controles.js`, essai retiré, `bb036be`)
- **mesuré** : températures et densités des trois zones du bilan méridien (même humidité relative de surface) moyennées
  couche par couche, puis un seul transfert. À 14,26 °C : OLR ciel clair **240,9** (colonne de la surface moyenne 256,1 ;
  CERES 266,85), eau 20,2 kg/m² ; équilibre de 📱 **36,5 °C**.
- **réfuté** : ⚛ la moyenne par couche fabrique une colonne qui n'existe pas — la vapeur d'altitude vient des tropiques chauds,
  la température d'altitude est tirée vers le bas par les pôles : froide ET humide, opaque, elle émet depuis un niveau froid.
  Une moyenne n'est légitime que sur les FLUX (Σ f_z OLR_z : un transfert par zone, ×3).

## C16 — Un transfert par zone : ne change rien (`sondes/zones_transfert.js`, `bb036be`)
- **mesuré** (📱, 14,26 °C, chaque zone à T̄ − dT_z avec l'humidité du modèle à sa T) : OLR ciel clair trop 276,7 / mid 244,3 /
  pol 213,2 ; Σ f_z = **256,35** contre colonne unique **256,12** (tous ciels 227,05 / 226,49). Eau : 32,1 / 9,9 / 2,8 kg/m².
- Confirme C2 : dans la physique du modèle, l'OLR est presque linéaire en T ; trois zones ne rapportent que 0,2 W/m² pour ×3
  de CPU. **Réfuté** comme correction.
- L'écart à CERES (−10,5 W/m² en ciel clair) est donc dans la COLONNE elle-même : sa troposphère libre est trop froide pour
  sa surface (C14). Zone tropicale du modèle à 23,7 °C : 276,7 W/m² ; profil AFGL tropical à 26,5 °C dans le même transfert :
  288,5 W/m².
- **hypothèse** (⚛, à lire avant de coder) : la troposphère libre n'est pas la parcelle de sa propre surface. Tropiques :
  quasi-équilibre convectif, adiabatique humide de la couche limite (et faibles gradients horizontaux, WTG) ; latitudes
  moyennes : ajustement barocline (Stone 1978, J. Atmos. Sci. 35:561), le gradient vertical tenu par le gradient méridien.

## C17 — Troposphère tropicale : la parcelle du modèle n'est PAS trop froide (lecture et loi du modèle, `bb036be`)
- **mesuré** : loi adiabatique du modèle (RADIATIVE.loiAdiabatique().ascension), parcelle de 299,7 K à 80 % d'humidité,
  contre le profil AFGL tropical à 3 / 6 / 9 / 12 km : 284,5 / 270,3 / 253,1 / 229,0 contre 283,7 / 263,6 / 243,6 / 223,6 K —
  la parcelle est même PLUS CHAUDE en altitude (+7 à +10 K). L'hypothèse « troposphère tropicale trop froide » (C16) ne tient
  pas pour la loi ; le froid de C14 vient de la parcelle de la surface MOYENNE, pas d'une loi fausse.
- Stone 1978 (ajustement barocline) : non lu — AMS refuse le PDF (403), NTRS ne l'a pas. Lu à sa place : Solomon & Lindzen
  2000 (J. Atmos. Sci. 57:3799) : le cisaillement des latitudes moyennes reste proche du critique du modèle à deux niveaux
  de Phillips (1954) ; Stone & Branscome 1992 : proportionnel, légèrement supercritique. Forme et constante du critère non
  lues : pas de fermeture codée.
- **hypothèse** (à mesurer, sonde AFGL) : la STRATOSPHÈRE du modèle — isotherme à ~210 K, ozone mélangé dès la tropopause —
  émet trop peu au centre de la bande du CO₂ (15 µm) et dans celle de l'O₃ (9,6 µm), que la vraie stratosphère, chaude en
  altitude (250–270 K vers 40–50 km), émet davantage.

## C18 — La stratosphère isotherme retire 5 à 9 W/m² d'OLR (`sondes/stratosphere_afgl.js`, `bb036be`)
- **mesuré** (ciel clair, 2000 points ; V0 vraie stratosphère, V1 isotherme à la tropopause, V2 + ozone mélangé, V3 isotherme
  à la température de la stratosphère du modèle, 214 K) :
  tropical (tropopause 17 km, 194,8 K) : V0 **288,46**, V1 280,68, V2 **279,11**, V3 283,98 ;
  été latitudes moyennes (13 km, 215,8 K) : V0 **281,33**, V1 276,35, V2 **274,60**, V3 273,89.
- V0 − V2 = **9,4** (tropical) et **6,7** W/m² (latitudes moyennes) ; dont l'ozone mélangé ~1,5–1,7 W/m².
- ⚛ La vraie stratosphère se réchauffe en altitude (ozone : chauffage solaire) : le centre de la bande du CO₂ (15 µm) et la
  bande de l'O₃ (9,6 µm), qui émettent de là-haut, y émettent plus chaud. Une stratosphère isotherme les fait émettre froid.
- C'est l'essentiel du ciel clair trop opaque de 📱 (−10,5 W/m², C16) : **la cause physique est trouvée**.
- À faire (⚛, coût linéaire) : stratosphère en plusieurs couches, chacune en équilibre radiatif (flux montant ET descendant
  dans la stratosphère), le chauffage solaire de l'ozone réparti selon le profil vertical de l'ozone.

## C19 — Stratosphère en 8 couches en équilibre radiatif (`sondes/controles.js`, travail sur `bb036be`)
- **mesuré** (📱, 14,26 °C) : températures des couches, de la tropopause à 1 hPa puis au-dessus : 207,5 / 204,8 / 207,3 /
  214,2 / 223,3 / 235,4 / **252,8** / 249,4 K — la stratosphère se réchauffe en altitude (atmosphère standard US 1976 :
  ~217 K à 20 km, ~250 K à 40 km, ~271 K à 47 km ; le modèle est plus froid de ~15 K à la stratopause).
- OLR ciel clair **256,1 → 259,1** (+3,0 W/m²), tous ciels 226,5 → 229,0 ; équilibre de 📱 **25,3 → 23,8 °C**.
  Coût : sonde 85 → 97 s (+14 %).
- Reste du ciel clair : −7,8 W/m² contre CERES. Le gain (3,0) est en deçà des 6,7–9,4 de C18 : la basse stratosphère du modèle
  reste froide (205–207 K) et sa tropopause basse (~10,5 km, 213 K ; profil moyen AFGL ~15 km) — la parcelle de la surface
  moyenne (C14).

## C20 — Décomposition refaite avec la stratosphère en couches (`afgl_heterogeneite.js`, `zones_transfert.js`, `67eaac8`)
- **mesuré**, ciel clair, surface 289,98 K : (a) moyenne des OLR AFGL 268,95 ; (b) profil moyen AFGL 266,34 ; (c) colonne du
  modèle **265,21** (avant les couches : 262,80). Colonne du modèle contre profil mesuré : **−1,1 W/m²** (était −3,5).
- 📱 à 14,26 °C, un transfert par zone : 259,12 contre colonne 259,07 (toujours sans effet, C16).
- Ce qui reste contre CERES (ciel clair −7,8 W/m²) n'est plus dans l'équation ni dans la colonne (≤ 1,1 W/m²) :
  · hétérogénéité de l'HUMIDITÉ, réelle (+2,6 W/m² entre profils AFGL ; les zones du modèle, de même humidité relative,
    ne la voient pas) — régions sèches des subtropiques ;
  · le relevé AFGL lui-même, ramené à 14,3 °C (~263,7 W/m²), est ~3 W/m² plus opaque que CERES : les vraies colonnes claires
    sont plus sèches que ces climatologies.
- Côté solaire, l'écart est du même ordre et de signe opposé : ciel clair qui réfléchit +7,6 W/m² de trop (albédo de surface),
  nuages qui réfléchissent 5,5 W/m² de moins (C11).

## C21 — Ciel clair solaire : décomposition contre CERES EBAF-Surface (sonde ponctuelle, `67eaac8`)
- 📡 Kato et al. 2018 (J. Climate 31:4501, table 5, Ed4, 2005–2015), ciel clair : solaire descendant en surface 243,8,
  remonté 29,8 (albédo de surface effectif **0,122**), absorbé par l'atmosphère **73,0**, réfléchi au sommet 53,1 W/m² ;
  infrarouge émis par la surface 397,6 (tous ciels 398,3 — le modèle émet σT̄⁴ = 387,7).
- **mesuré** (📱, 14,26 °C, nuages retirés) : descendant en surface **261,2**, remonté **43,3** (albédo de surface vu par le
  Soleil **0,166**), absorbé par l'atmosphère **60,9**, réfléchi au sommet 61,1 W/m².
- Deux écarts de même sens au sommet, un de chaque côté : l'atmosphère absorbe **12 W/m² de trop peu** (vapeur : 15,4 kg/m²
  contre ~25 — CS99 suit l'eau), la surface renvoie **13,5 W/m² de trop**.
- Surface du modèle (parts × albédos) : océan 0,650 × 0,066 ; forêt 0,099 × 0,17 ; désert 0,069 × 0,30 ; autres terres
  0,052 × 0,18 ; **glace 0,131 × 0,795** — la glace porte plus de la moitié de l'albédo de surface.

## C22 — Le manque de vapeur vient surtout de la température de la colonne (calcul hors moteur, Magnus, `67eaac8`)
- **mesuré** (loi d'humidité du modèle, Manabe & Wetherald, humidité de surface 0,73, intégrée hors moteur) : sur la
  température du profil moyen AFGL **26,9 kg/m²** (0,80 en surface : 29,4) ; sur la température de la colonne du modèle
  **23,0 kg/m²** ; le moteur, sur sa colonne, **18,7 kg/m²** (C20). Mesure globale ~25 (C6).
- La loi d'humidité n'est pas la cause principale : sur une troposphère réelle elle donne la bonne eau. La troposphère du
  modèle est trop froide (3 / 6 / 9 km : 271,4 / 252,5 / 226,8 K contre 275,9 / 256,8 / 237,4) et l'air froid porte moins d'eau
  (−3,9 kg/m²) ; 4,3 kg/m² de plus se perdent dans le moteur lui-même (étirement de la loi à la tropopause basse, borne par la
  parcelle — à mesurer).
- Racine commune des défauts restants (vapeur, absorption solaire, ciel clair IR) : la structure en température de la
  troposphère libre, fixée dans la vraie atmosphère par la dynamique 3D (convection tropicale, tourbillons baroclines).
  Deux fermetures 1D seulement : la théorie (Stone 1978, Held 1982 — PDF refusés par l'AMS, non lus) ou le gradient mesuré
  (6,5 K/km, Manabe & Wetherald 1967, atmosphère standard), qui fige la rétroaction du gradient vertical.

## C23 — Environnement de la colonne = moyenne des zones (Held 1982 éq. 9, Stone 1978 éq. 4) (`sondes/controles.js`)
- Lu : Held 1982 (J. Atmos. Sci. 39:412) et Stone 1978 (J. Atmos. Sci. 35:561), PDF posés par l'utilisateur dans
  `bilan_radiatif/sources_pdf/` (non publiés). Stone : le gradient méridien à 600 hPa reste au critique du modèle à deux
  niveaux de Phillips aux latitudes moyennes et hautes, en toutes saisons ; au-delà de ~70° le critère perd son sens. Held :
  aux tropiques, la parcelle garde son énergie statique humide jusqu'à la tropopause (éq. 9) ; la contrainte qui donne la plus
  grande stabilité l'emporte (§4) ; sa contrainte des latitudes moyennes (éq. 7) est jugée qualitative par l'auteur.
- Codé (radiative/calculations.js, temperatureEnvironnement) : la température de l'environnement est la moyenne, par l'aire,
  de la parcelle tropicale, du plus chaud de la parcelle et du gradient critique de Stone aux latitudes moyennes (T₂ du bilan
  méridien), et de la parcelle polaire (❔) ; la parcelle de la surface moyenne ne sert plus qu'aux nuages bas.
- **mesuré** (📱, 14,26 °C) : OLR ciel clair **259,1 → 263,5** (CERES 266,85 : −3,3, l'ordre de l'hétérogénéité C20) ; eau
  15,4 → 17,8 kg/m² ; tous ciels 229,0 → 230,3 ; effet LW des nuages **30,1 → 33,2** (mesure 26,65) — un ciel clair plus
  chaud augmente le contraste avec des sommets de nuages hauts à température fixée (T_ENCLUME). Équilibre 24,2 °C.
  Coût : sonde 97 → 77 s (moins d'itérations).
- L'écart dominant devient les NUAGES : LW +6,6, SW +5,5 W/m² (trop peu réfléchissants), et le ciel clair solaire +7,3.

## C24 — Population MESURÉE des nuages hauts (CALIPSO sous-visibles + classes ISCCP-H) (`nuages_types.js`, `controles.js` v1.0.1)
- Avant (ln τ uniforme 0,04–11,9, vue ISCCP recalculée — C8–C11 lisaient la vue de l'état convergé, erreur de sonde corrigée) :
  hauts vus 0,078 / 0,109 / 0,021 (fins / moyens / épais) contre ISCCP-H 0,140 / 0,068 / 0,040 ; effets SW / LW des hauts −8,4 / +18,4.
- Codé : 0,13 sous-visibles (CALIPSO, τ < 0,3) + les trois classes vues d'ISCCP-H (0,140 à τ 0,79, 0,068 à 8,27, 0,040 à 47,3) :
  somme 0,378 ≈ total CALIPSO 0,37 ; F_HAUT en fixe le total. ⚠️ Les classes hautes d'ISCCP-H deviennent une ENTRÉE.
- **mesuré** (📱, 14,26 °C) : effets SW / LW des hauts **−11,9** / +18,4 ; tous **−43,5** / +31,6 (CERES −45,6 / +26,65) ;
  OLR tous ciels 231,4, réfléchi 104,3 ; équilibre de 📱 **24,2 → 19,9 °C**.
- La vue ISCCP des hauts (0,081 / 0,083 / 0,053) ne retrouve pas ses entrées : ISCCP classe le τ de la COLONNE (nuages
  dessous compris), le modèle donne au nuage haut le τ de la classe — double compte déclaré, à reprendre.
- Restent : ciel clair solaire +7,3 (albédo de surface, glace), effet LW des nuages +4,9, ciel clair IR −3,9 (hétérogénéité).

## C25 — Glace de 📱 face à NSIDC, Rutgers et SHEBA (sondes de scratchpad, glace / glace_mois / glace_fonte)
- 📡 Mesures lues (moyennes 2001–2020 des fichiers mensuels) : banquise NSIDC Sea Ice Index G02135 v4.0, AIRE (concentration
  comprise) nord 8,94, sud 8,89 Mkm² (étendue 10,76 / 11,69) ; neige NH Rutgers (NH SCE CDR v01r01, sans Groenland) 22,81 Mkm²,
  janvier 45,6, août 0,55. Perovich et al. 2002 (JGR 107:8044, résumé lu) : albédo de banquise pérenne 0,8–0,9 en avril,
  0,4 en moyenne fin juillet (mares 0,1, glace nue 0,65).
- **mesuré** (📱 à 14,26 °C, moyenne annuelle) : banquise nord 12,34, sud 12,88 Mkm² ; neige NH 28,77 ; calottes 12,3 (S) +
  1,72 (N), comme mesuré. Pondérées par l'insolation du jour (⚛, formule journalière) : neige NH −3 % (l'excès est dans la
  nuit d'hiver), banquise nord **+37 %**, sud **+52 %**. Cycle : toute la mer de 60–90° gelée d'octobre à mi-juin (17,1 contre
  13,05 au maximum mesuré ; 16,4 contre 8,7 à la mi-juin, au plus fort du soleil), puis fonte rapide (minimum 0,6 contre 3,5).
- **mesuré** : albédo de la banquise pondéré par le soleil **0,82** (nord comme sud), calottes 0,85, neige des terres 0,70.
  Cause : sur la dalle, l'air est plafonné à 0 °C ; à 0 °C, la neige sèche (0,85) a un bilan 0,093 S + c0 avec
  **c0 = −72,9 W/m²** (LW + latent, couverture nuageuse GLOBALE 0,54 dans Brutsaert) : négatif jusqu'à S ≈ 780 W/m², donc
  fonte un jour sur cinq au solstice (p ≈ 0,2) et la banquise reste presque sèche tout l'été.
- Ordre de grandeur (⚛) : aire en trop ≈ 2,0 W/m² réfléchis au sol, albédo 0,82 au lieu de ~0,6 ≈ 1,2 W/m², soit ~3 des
  ~8,8 W/m² de réflexion au sol en trop (Rg soleil 0,166 contre 0,122).
- Leviers physiques : couverture nuageuse POLAIRE dans le bilan de fonte (pas la globale) ; flux de chaleur océanique sous
  la glace (Atlantique nord, Antarctique) que le bilan zonal n'a pas.
- **Codé (couverture polaire)** : EARTH.NUAGES.F_POLAIRE_MER = 0,85 (📡 SHEBA mai–août 0,88–0,93 en occurrence radar + lidar,
  Intrieri et al. 2002a fig. 5 ; fraction verticale ≈ 0,88, 2002b fig. 3 ; climatologies ≈ 0,80 ; Antarctique > 0,80, Adhikari
  et al. 2012, résumé). Pour la mer de la zone polaire seulement (|φ| > 60°), dans le rayonnement descendant de la fonte
  (CALOTTES.contexte.bilanSous) ET dans le soleil au sol (absorbe.mer : colonne aux nuages bas complétés, fBas 0,40 → 0,81) ;
  la terre, les calottes et la mer des autres zones gardent la colonne. Coût : une table solaire de plus par résolution.
- **mesuré** à 14,26 °C fixé : albédo de la banquise pondéré par le soleil 0,818 → **0,749** (nord), 0,813 → **0,743** (sud) ;
  part du soleil sur la glace 0,637 → 0,620 (nord), 0,514 → 0,492 (sud) ; Rg soleil 0,1487 → 0,1463 ; A 0,3064 → 0,3058. Le soleil
  seul au sol (sans le LW) freinerait la fonte : absorbé de la neige sèche 0,093 → 0,086 ; le LW l'emporte (LW seul : 0,738).
- **mesuré** à l'équilibre libre (frise 📱, référence = même code à F_POLAIRE_MER 0,5366, la couverture globale) : 19,91 →
  **21,36 °C** ; la banquise sud disparaît (part du soleil 0,030 → 0), le nord passe de 0,279 à 0,094. Le 📱 libre, déjà trop
  chaud de 5,6 K (SW clair, LW nuages, vapeur : C24), l'est de 7,1 K : la rétroaction glace-albédo transforme un forçage
  de −0,0006 d’albédo planétaire à T fixé (≈ 0,2 W/m²) en +1,45 K. 🦣 et 🏔 cliqués seuls (sans chaîne) : +0,29 et −0,02 K.
- Reste : l'aire (+37 / +52 % au soleil) vient du cycle de la couche de mélange (SAISONS.cycles, gel sous 271,15 K), que la
  fonte ne touche pas.
- **Codé (part océanique du transport)** : SAISONS.K.PART_OCEAN_60 = 0,07. Le transport de North (D) est TOTAL et allait
  uniformément aux boîtes de la bande ; à la bande polaire, la part de l'océan de ce qui passe 60° (Q = 0,07 D (1 − x₀²) 3|T₂| x₀
  / (1 − x₀) ≈ 6 W/m² de bande à T₂ = −28 K) va à la mer seule, retirée à l'air (somme nulle). 💻 Trenberth & Caron 2001 :
  océan 0,22–0,25 PW (N), 0,21–0,24 (S) ± 0,04–0,05, sur un total ERBE ≈ 3,5 / 3,1 PW (fig. 7, lu) ; contrôles 📡 Tsubouchi et
  al. 2018 175 ± 48 TW (portes de l'Arctique), Aagaard & Greisman 1975 0,14 PW à 65° N. Coût : nul.
- **mesuré** à 14,26 °C fixé (référence = même code à 0) : mer de la bande nord −7,13 → −6,51 °C, terre −5,97 → −6,60 ; aire
  annuelle de la banquise 12,01 → **11,70** Mkm² (N), 12,45 → **12,14** (S), contre 8,94 / 8,89 mesurés (NSIDC). Effet faible :
  le couplage de l'air ν entre mer et terre de la bande rend presque tout l'écart forcé. À l'équilibre libre : 21,36 → 19,16 °C
  (banquise nord 2,0 → 5,7 Mkm², sud 0 → 1,6) — par la terre refroidie (neige, calottes) : le 📱 libre est près d'un seuil, la
  différence d'équilibre dit la sensibilité de la branche, pas l'effet direct.
- Reste ⚛ : la banquise zonale gèle TOUTE la mer de chaque latitude ; l'océan réel concentre sa chaleur dans l'Atlantique nord
  (mers nordiques et Barents libres) — une longitude que le modèle n'a pas. Couche de mélange 75 m (❔, McKinnon 2013).

## C26 — Albédo de surface de 📱 décomposé par surface, pondéré par le soleil (sonde de scratchpad `rg.js`)
- **mesuré** (📱, 14,26 °C fixé, couverture polaire et part océanique de C25 incluses) : Rg soleil **0,146** contre 0,122
  (📡 Kato et al. 2018, ciel clair, C21). Aire × soleil / albédo / part de Rg : eau libre 0,700 / 0,066 / 0,0465 ; terres libres
  0,234 / 0,213 / **0,0498** (forêt 0,107 à 0,17, désert 0,073 à 0,30, sol 0,054 à 0,18) ; neige sur terre 0,025 / 0,705 /
  0,0179 ; banquise 0,024 / 0,746 / 0,0180 ; calottes 0,016 / 0,849 / 0,0138. Zones : tropiques 0,104, moyennes 0,135, pôles 0,50.
- 🔧 Le désert est une part UNIFORME de la terre de chaque bande (ALBEDO.surfacesSansGlace : aride = 0,31 à 📱, formule à
  facteurs posés — VARIABILITY_FACTOR 0,6, F_conv, seuils 1000 mm et 0,6), pôles compris : 15,6 % de la bande 60–90° N à 0,30.
  📡 Barren MODIS : 9,5–12,8 % des terres (NOAA ; Eliades et al. 2024), concentré dans les subtropiques.
- ❔ Forêt 0,17 : à confronter aux albédos MODIS sans neige par classe IGBP (Gao et al. 2014, JARS 8:083532 ; climatologie
  MODIS 20 ans, JGR 2022, 10.1029/2021JD035987) — PDF non obtenus (éditeurs et dépôt NOAA refusent le téléchargement automatique).
- Ordre de grandeur (❔, à sourcer) : désert ramené aux subtropiques et forêt à ~0,13 ≈ 0,009 des 0,024 en trop ; neige sur terre
  et banquise le reste.
- **Codé (forêt)** : 🪩🍰🌳 0,17 (sans source) → **0,12** — 📡 MODIS sans neige, climatologie 20 ans (Jia et al. 2022, fig. 8, lu) :
  conifères sempervirents 0,09–0,12, feuillus sempervirents 0,12–0,13, caducs 0,10–0,15. Le sol 0,18 y est confirmé (arbustes
  0,18–0,21, prairies 0,15–0,22, cultures 0,15–0,19). Désert 0,30 : toujours sans source.
- **mesuré** à 14,26 °C fixé : Rg soleil 0,146 → **0,1406** (terres libres 0,213 → 0,190) ; A 0,3052 → 0,3027. Équilibre libre de
  📱 19,16 → 20,28 °C. Reste 0,019 de Rg au-dessus de Kato (0,122) : désert (part uniforme, pôles compris), neige sur terre
  0,705, banquise 0,746.
- **Codé (désert)** : part UNIFORME (formule à facteurs posés, 0,31 à 📱, CONV.P_ANN_SCALE_MM_AN retirée avec elle) →
  EARTH.DESERT_PAR_BANDE, 📡 Matthews 1983 (carte 1° × 1°, GISS ; data/sources/matthews_desert.py) : 0–30° N 0,264, 30–60° N 0,088,
  60–90° N 0,038, 0–30° S 0,05, 30–60° S 0,006, 60–90° S 0 ; global 0,12 (MODIS terres nues 9,5–12,8 %). ❔ géographie actuelle à
  toute époque.
- **mesuré** à 14,26 °C fixé : désert aire × soleil 0,073 → 0,031 ; terres libres 0,190 → 0,169 ; Rg soleil 0,1406 → **0,1354**
  (Kato 0,122) ; A 0,3027 → 0,3002. Équilibre libre de 📱 20,28 → 20,85 °C. Reste 0,013 de Rg : neige sur terre (0,705) et
  banquise (0,745), à confronter à la fig. 8 de Jia et al. 2022 (forêts enneigées 0,3–0,45, prairies enneigées ~0,7).
- **Codé (neige sous la forêt)** : le masque 🔧 0,31 × clamp((T̄ − 268,15)/25, 0,4, 1), le même à toutes les latitudes (trois nombres
  sans source, ALBEDO.foretSousNeige retirée), → la forêt de chaque latitude (ALBEDO.poserForet, ligne des arbres de Paulsen &
  Körner) ; forêt enneigée 🪩🍰🌳❄️ 0,25 → **0,35** (📡 MODIS saison enneigée 50–70° N, Jia et al. 2022 fig. 8 : conifères
  sempervirents ~0,33, caducs 0,40–0,45).
- **mesuré** à 14,26 °C fixé : neige sur terre 0,705 → **0,629** ; Rg soleil 0,1354 → **0,1333** (Kato 0,122) ; A 0,3002 → 0,2993.
  Équilibre libre de 📱 20,85 → 20,81 °C. ⚠️ À vérifier sur la frise : le masque 🔧 avait été posé parce que la forêt par latitude
  ne recule pas au dernier maximum glaciaire (ligne des arbres du modèle vers 73° N) — 🦣 risque d'être plus chaud.
- Reste 0,011 de Rg : banquise 0,745 (SHEBA en été ~0,4–0,6), neige sèche 0,85 des terres sans forêt (MODIS prairies et arbustes
  enneigés ~0,65–0,70).

## C27 — Chaîne 🏔 → 📱 avec les corrections de C25–C26 (`quaternaire_chaine.js`, sondes q_new / q_old / q_pre)
- Trois chaînes complètes (🏔 frise, 159 clics 🐾 de 🦣, 🛖, 🚂, 📱), même code, la sonde rétablissant ce qui diffère :
  | | 🏔 frise | 🦣 min (âge) | 🦣 fin 15 ka | 📱 | calotte nord |
  |---|---|---|---|---|---|
  | **pré** (C25–C26 annulées : couverture globale, océan 0, forêt 0,17, désert 0,311 partout, masque 🔧) | 21,2 | 15,0 (440 ka) | 19,7 | 22,1 | ≤ 0,02 Mkm² |
  | **ancien masque** (tout C25–C26 sauf la neige sous la forêt) | 25,1 | 18,4 (635 ka) | 19,9 | 23,9 | 0 |
  | **actuel** | 22,7 | 18,3 (185 ka) | 21,8 | 23,5 | 0 |
  📡 Snyder 2016 : ~8 °C au glaciaire (6,2–10,0 à 31 ka) ; 📱 14,3.
- Le masque de la neige par la forêt de chaque latitude ne change presque rien (≤ 2 K, de signe variable). L'ensemble C25–C26
  réchauffe la chaîne de +1,5 K à 📱 et +3,3 K au minimum de 🦣.
- **La chaîne était déjà sans calotte nord et ~8 K trop chaude AVANT ces corrections** (pré : 📱 22,1 °C) : le régime glaciaire
  est perdu en amont (C18–C24 : stratosphère, populations de nuages), pas par l'albédo de surface. Les corrections d'albédo
  retirent des erreurs qui compensaient ; le reste de l'écart est dans les termes de C21–C24 (effet LW des nuages +4,9 W/m²,
  absorption solaire de l'atmosphère 60,9 contre 73,0, vapeur 17,7 contre 24,7 kg/m² à 14,26 °C).

## C28 — Effet des nuages par type contre CloudSat/CALIPSO (Hang 2016, table 5.1 B)
- 📡 Hang 2016 (mémoire, U. Wisconsin, dir. L'Ecuyer ; 2B-FLXHR-LIDAR, moyenne JJA/DJF), couverture / LW / SW [W/m²] : haut fin
  0,088 / +2,3 / −1,2 ; haut épais (convection et multicouches) 0,148 / +8,6 / −19,9 ; moyen fin 0,061 / +3,5 / −4,6 ; moyen épais
  0,076 / +3,3 / −7,9 ; bas 0,241 / +3,1 / −19,1 ; total 0,613 / +20,7 / −52,7. ⚠️ LW total sous CERES (26,7) et sous l'article publié
  (L'Ecuyer et al. 2019, J. Climate 32:6197 : +27,1, résumé) ; types EXCLUSIFS par colonne (le nuage le plus haut nomme la colonne).
- **mesuré** (📱 14,26 °C, retrait par type, C24) : bas 0,41 / +3,15 / −18,0 ; moyens 0,23 / +7,6 / −11,3 ; hauts 0,378 / +18,4 / −11,9.
- ⚠️ La comparaison par retrait (ci-dessus) ne vaut pas : retirer un type le retire aussi là où il est caché sous un autre, alors
  que Hang range chaque colonne sous son nuage le plus haut. Le « moitié moins réfléchissant » venait de là.
- **mesuré** en classes EXCLUSIVES comme Hang (sonde CO2/scripts/bench_headless/sondes/nuages_sommet.js : le mélange des
  sous-colonnes est linéaire en chaque fraction, classe haut = fH·(X(fH = 1) − clair), etc. ; la somme des classes retrouve le
  total à 0,6 W/m² près), 📱 14,26 °C, après la correction C29, couverture / LW / SW :
  | sommet | ancienne population (ISCCP-H) | **CloudSat + CALIPSO** (codée) | Hang 2016 |
  |---|---|---|---|
  | hauts | 0,332 / +21,5 / −23,2 | **0,332 / +19,8 / −19,9** | 0,236 / +10,9 / −21,1 |
  | moyens | 0,154 / +6,6 / −11,5 | 0,154 / +6,6 / −11,5 | 0,137 / +6,8 / −12,5 |
  | bas seuls | 0,205 / +2,0 / −11,0 | 0,205 / +2,0 / −11,0 | 0,241 / +3,1 / −19,1 |
  | total | 0,691 / +29,5 / −45,05 | **0,691 / +27,7 / −41,7** | 0,613 / +20,7 / −52,7 (CERES +26,65 / −45,6) |
- Lecture : les MOYENS sont justes. Les BAS seuls réfléchissent trop peu (−53 W/m² par unité de couverture contre −79) : c'est
  là qu'est le manque solaire de 3,9 W/m², le prochain levier. Les HAUTS : effet solaire juste ; infrarouge au-dessus de Hang
  (+19,8 contre +10,9, +17 si tout l'écart de Hang à CERES leur revient), mais l'infrarouge total (+27,7) n'est plus qu'à
  +1,1 de CERES.
- **Codé : population des nuages hauts depuis les capteurs ACTIFS** (EARTH.NUAGES.HAUTS_GLACE, radiative/solaire.js
  populationHauts) : Hong & Liu 2015 (J. Climate 28:3880, table 1 et §3a, texte lu), DARDAR 2007–2010, parts des nuages de
  glace par classe de τ, 9 / 31 / 39 / 16 / 5 % pour < 0,03 / 0,03–0,3 / 0,3–3 / 3–20 / > 20 ; ln τ uniforme dans la classe,
  nœud au milieu géométrique des bornes (0,017 / 0,095 / 0,95 / 7,7 / 45). τ moyen arithmétique 3,1 (Hong & Liu : ≈ 4, la
  dernière classe bornée à 100) contre 6,8 pour les classes ISCCP-H, qui comptaient le τ de toute la colonne (double compte C24).
  Remplace HAUTS_SOUS_VISIBLES + niveaux.H.classes d'ISCCP-H, redevenues un contrôle. Même nombre de nœuds (5) : coût inchangé.
  ⚠️ Bornes 0,01 et 100 ❔ ; DARDAR compte la glace des latitudes moyennes et hautes sous 5 km, le modèle la met à T_ENCLUME.
- **mesuré** (équilibres libres, même chemin, une page par population ; l'ancienne reproduite exactement par HAUTS_GLACE) :
  📱 22,89 → **23,90** ; 🏔 25,15 → 25,96 ; 🦣 21,76 → 22,93 °C. À 14,26 °C fixé, même page : +3,2 W/m² absorbés, OLR +1,8 :
  **+1,3 W/m² net**, soit ≈ +1 K. Vue ISCCP des hauts (contrôle) : 0,199 à τ 5,47 contre 0,247 à 3,83 ; classes 0,083 / 0,082 /
  0,034 contre 0,140 / 0,068 / 0,040.

## C29 — Stratosphère perdue à l'arrondi près (`radiative/calculations.js`, temperatureEnvironnement)
- Constat : au même état (même T, même stratosphère à 0,1 K près), l'OLR changeait de 1,6 à 3,6 W/m² selon l'histoire de la page,
  puis se figeait (chaque population répétait la même valeur, la stratosphère ne bougeait plus).
- Cause (⚛ numérique) : l'environnement est la moyenne des zones, Te = Σ f_z · max(T_strato, T_z). Toutes les zones dans la
  stratosphère, Te = T_strato · Σ f_z, et Σ f_z ne vaut 1 qu'à un ulp près. Un cheveu au-dessus, le test « Te ≤ T_strato » de
  profilAtmosphere ne passe jamais : pas de tropopause, humidité de Manabe & Wetherald jusqu'au sommet (vapeur ×1,4 à 10 km,
  ×2 dans la « stratosphère »), étirement de la loi d'humidité faux sur toute la colonne (σ_t pris au sommet de la grille),
  aucune couche de stratosphère, donc son équilibre radiatif figé.
- Correction : toutes les zones à T_strato, la moyenne EST T_strato. Mesuré : l'OLR de ciel clair revient à 259,8 W/m² dans tous
  les passages, la stratosphère répond de nouveau ; coût nul.
- ⚠️ Portée : tout calcul passé a pu tomber d'un côté ou de l'autre de l'arrondi. Mesuré : 📱 avec l'ancienne population 20,85
  → 22,89 °C. Les références de C25–C27 (📱 libre 20,8 ; chaîne 23,5) sont donc à remesurer, de même que la dépendance au chemin
  notée sur les équilibres (18,5 contre 19,9).

## C30 — Nuages bas marins trois fois trop minces (sonde de scratchpad `bas_dump.js`)
- **mesuré** (📱 à l'équilibre, 23,9 °C, après C29) : population océan (poids 0,72) — sommet à 248 m au-dessus de la base,
  W 62 g/m², τ_max 8,2 ; nœuds u = 0,1…0,9 : τ 0,23 / 1,2 / 2,7 / 4,6 / 7,0, moyenne ≈ 3,1. Continent (0,28) : 756 m,
  W 535 g/m², τ_max 71, moyenne ≈ 27. Rapport CCN = 1, N océan 59 cm⁻³, r_eff au sommet = seuil de pluie 13,4 µm : les gouttes
  sont justes.
- **référence** 📡 King et al. 2013 (IEEE TGRS 51:3826, texte lu) : stratocumulus marins τ ∼ 10–12, nuages sur terre souvent
  τ > 20 ; r_eff des nuages liquides mode 12–13 µm sur mer, 10–11 µm sur terre.
- **lecture** : le continent est dans la mesure, la mer ne l'est pas, ni en moyenne (3 contre 10–12) ni même au sommet (8,2).
  Deux hypothèses ⚠️ déclarées du nuage bas en sont la cause : (1) le nuage s'arrête au déclenchement de la pluie — or le seuil de
  Rosenfeld marque le DÉBUT de la bruine, un stratocumulus qui bruine continue jusqu'à l'inversion (dynamique 3D, absente en 1D) ;
  (2) toutes les profondeurs de 0 au sommet également représentées (τ ∝ u^5/3 → moyenne 3/8 de τ_max). C'est l'essentiel du
  déficit solaire des nuages bas seuls de C28 (−11 contre −19 W/m²).
- **mesure de la population** 📡 Wood & Hartmann 2006 (J. Climate 19:1748, manuscrit lu) : eau liquide des nuages bas marins
  (MODIS) de loi Gamma dans une scène, paramètre de forme ≈ 1 (fig. 11, mode 0,6–1) ; moyennes des scènes entre 25 et 150 g/m²,
  rarement au-delà (nuages minces instables, bruine qui borne le haut) ; stratocumulus 58–72 g/m² (table 2). L'hypothèse (2)
  est réfutée : 63 % de la population marine du modèle était sous 25 g/m².
- **correction** (radiative/solaire.js, profondeurs) : sur mer, LWP exponentiel de moyenne W au seuil de pluie (⚠️ déclaré :
  62 g/m² sur 📱, dans les 58–72 mesurés), W ∝ u² (adiabatique), dernier nœud au-delà du sommet (u 1,52, 143 g/m², sous la
  borne de 150). Continent inchangé (τ moyen 27, dans la mesure). Toujours 5 nœuds : coût nul.
- **mesuré** (📱 14,26 °C fixé), classes exclusives couverture / LW / SW : hauts 0,332 / 20,2 / −23,1 ; moyens 0,154 / 7,8 /
  −15,5 ; bas seuls 0,205 / 2,5 / −15,7 ; total 0,691 / 29,7 / −53,5 (CERES 26,65 / −45,6). Par unité de couverture, les bas
  seuls réfléchissent −77 W/m² contre −79 (Hang 2016) : la réflectance est juste ; l'excès du total vient des couvertures (hauts
  0,33 contre 0,24 chez Hang, jauge F_HAUT) et des moyens, qui partagent la population (−101 contre −91 par unité).
- **équilibres libres** (sonde hg.js) : 📱 23,90 → **14,14 °C** (mesuré 14,26) ; 🏔 25,96 → 19,34 ; 🦣 22,93 → 13,51.
- **contrôle ISCCP-H** (simulateur, 📱 fixé) : bas vus d'en haut 0,246 à τ 7,4 (ISCCP 0,231 à 4,9), classes < 3,55 / 3,55–22,6 /
  > 22,6 : 0,067 / 0,144 / 0,035 (ISCCP 0,103 / 0,106 / 0,022) ; total 0,630 à τ 7,8 (0,668 à 4,9). Le modèle est plus épais
  qu'ISCCP et plus mince que MODIS (stratocumulus 10–12) : les deux mesures diffèrent d'un facteur 2 sur les nuages bas (pixels
  partiellement couverts comptés minces par ISCCP ; seuil de 5 g/m² chez Wood & Hartmann). Laissé tel quel, déclaré.
- **chaîne 🏔 → 📱 remesurée après C29** (populations de nuages hauts Hong & Liu, nuages bas marins d'AVANT C30) : 🏔 26,2 → 27,8 ;
  🦣 (160 clics) min 22,3 (30 ka) ; 🛖 24,0 ; 🚂 24,4 ; 📱 24,9 °C. Aucune calotte, ni au nord ni au sud. Référence de C27 (23,5)
  remplacée.
- **chaîne 🏔 → 📱 avec C30** : 🏔 19,3 → 20,9 ; 🦣 🐾 1 (805 ka) 13,5 °C ; au 🐾 2 (800 ka, CO₂ 282 → 200 ppm) la planète part en
  boule de neige (−69 °C) et n'en sort plus (📱 −68,7). Trajectoire du solveur (sonde trace2.js) : Δ reste négatif de 13,5 à
  −15 °C (−0,7 à 13,3 ; −1,3 à 8,8 ; −8 à 2,5) — aucune branche chaude, ce n'est pas un saut du solveur.

## C31 — Rétroaction d'albédo de surface ~5 fois l'évaluation (sonde de scratchpad `retro.js`, 📱, T imposée)
- **mesuré** de 14,26 à 9,26 °C (−5 K), même composition : soleil réfléchi par ciel CLAIR 57,2 → 73,6 W/m² (+3,3 W/m²/K) ; effet
  solaire des nuages −53,5 → −45,5 (ils masquent la glace) ; total réfléchi +8,4 (+1,7 W/m²/K) ; OLR −10,1 (2,0 W/m²/K) ; nuages
  bas marins τ_max 8,25 → 9,32 (+13 %, 1/Γ : effet faible). Rétroaction nette ≈ 0,3 W/m²/K : presque rien ne retient la planète.
- **référence** 🎯 Sherwood et al. 2020 (Rev. Geophys. 58:e2019RG000678, table 1, lue) : rétroaction d'albédo de surface
  N(+0,30 ; 0,15) W/m²/K (ciel complet, climat moderne). Le modèle : +1,7, soit ~5,5 fois.
- **lecture** : le modèle était 10 K trop chaud (C27–C29) et loin de la glace ; ramené à 14,1 °C par C30, il se trouve sur la pente
  où glace de mer et neige s'étendent de ~1,6 % de la planète par K (bascule.js : glace 0,098 à 14 °C → 0,226 à 6 °C). Cohérent
  avec les excès déjà mesurés : banquise +37/+52 % au soleil et albédo 0,745 (NSIDC/SHEBA), neige des terres libres 0,85.
- Prochain chantier : aire et albédo de la banquise et de la neige saisonnière contre les mesures (NSIDC, MODIS neige), puis
  remesurer la chaîne. Pas de compensation par les nuages.

## C32 — Convergence : premier Δ calculé sur une stratosphère grise (`convergence/calculations_flux.js`, Init)
- Constat (journal de l'interface, 📱) : 23 pas, Δ qui n'est pas une fonction de T — à 14,3 °C, +8,49 W/m² à l'Init puis −0,23
  au pas 9 —, dichotomie qui rebondit sur des crochets bâtis avec ces Δ.
- Cause (⚛ numérique, sonde trace_strato.js) : calculateT0 pose la stratosphère sur une graine grise isotherme
  (S̄(1 − A)/2σ)^¼ = 234 K ; chaque transfert ne remplace l'équilibre que pour l'évaluation SUIVANTE. Le Δ d'Init portait donc
  cette graine : OLR 257 au lieu de 230 W/m², et l'albédo (sa colonne nuageuse lit la tropopause) 30,1 % au lieu de 32,5 %. Les
  deux transferts suivants voyaient la stratosphère bouger de 20 à 40 K.
- Correction : à l'Init, transfert + albédo itérés à T₀ jusqu'au point fixe de la stratosphère (aucune couche ne bouge de 0,1 K ;
  au-delà de 10 transferts, erreur). Mesuré sur 📱 : Δ d'Init −0,15 W/m² (contre +7,7), recherche monotone, dichotomie en 2 pas,
  14 transferts en tout (6 à l'Init). Coût : +4 à 5 transferts par calcul, linéaire.
- Équilibres (hg.js) : 📱 14,14 → 14,04 ; 🏔 19,34 → 19,39 ; 🦣 13,51 → 13,44 (le retard déplaçait l'équilibre de ~0,1 K).
- Non touché : l'attribution H₂O affichée change au dernier pas (77 → 47 % dans le journal) — c'est l'attribution par retrait,
  calculée seulement à la convergence (calculateFluxForT0(retrait)), pas un défaut du solveur.
