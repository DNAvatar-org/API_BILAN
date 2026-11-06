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
