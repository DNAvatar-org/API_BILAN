# Audit de la physique — calottes et bilan méridien (2026-10-29)

Audit **par lecture**, sans banc ni navigateur. Quatre volets (calottes ; bilan méridien, saisons, orbite, albédo de glace ;
référence unique ; contrôles 🎯), chacun relu par un vérificateur adverse chargé de réfuter, puis un critique de complétude
qui a lu ce qui manquait. 72 constats : 61 confirmés (preuve refaite), 6 plausibles, 5 du critique non revérifiés. Aucun
réfuté. J'ai relu moi-même dans le code les constats 26, 55, 56, 58, 59, 61, 69 et 70 : ils tiennent.

Les numéros renvoient à l'annexe (constat, preuve, effet, correction, verdict).

## Ce qui en ressort

1. **Les deux erreurs de Nye et de τ₀ sont la partie visible d'une erreur de géométrie** (46, 56, 58, 61). Le moteur pose
   chaque calotte comme un anneau zonal tout autour de la planète, avec son épaisseur maximale au bout polaire de la terre de
   la bande, même quand ce bout est une côte. La fermeture Bedmap2 du script, elle, lit Nye avec la distance à la marge, en
   2D. Conséquences, recalculées par le vérificateur avec les formules du moteur :
   - l'Antarctique posé du moteur fait 45·10⁶ km³ pour 26,5 mesurés (×1,70) ;
   - le Groenland fait 2,7·10⁶ km³ pour 3,0 ;
   - il faudrait τ = 35 kPa pour l'un et 123 kPa pour l'autre : **aucun τ unique ne ferme les deux** dans cette géométrie ;
   - une petite calotte (naissance de N_mid) est un anneau de 70 km de large et 1,2 km d'épaisseur, là où un dôme de même
     aire ferait 3,5 km : 8 à 10 K de trop au sommet, justement à la naissance.

   Corriger Nye et τ₀ sans la géométrie laisserait l'Antarctique à ×1,5 du volume mesuré.

2. **Le forçage orbital des calottes est faux sur le chemin 🐾** (55, 57) :
   - l'orbite est lue une fois, à la fin du clic, et tenue 20 ka. Échantillonnée tous les 20 ka, la précession de 23,7 ka
     se replie en une fausse période de 128 ka (19 ka → 380 ka). La courbe orange peut montrer des cycles glaciaires d'origine
     numérique ;
   - l'obliquité entre deux fois dans la fonte (par l'amplitude du cycle de T, ∝ sin ε, ET par l'écart d'insolation) ; la
     précession une seule fois. Les cycles du Quaternaire sont dictés par l'obliquité par construction.

3. **La température qu'une calotte voit mélange deux objets** (60, 38, 59, 1) : moyenne annuelle ZONALE (terre + mer) plus
   l'amplitude des TERRES ; amplitudes 15/25/3 K gardées parce que le cycle calculé fait basculer 🐾 (un calage de fait) ;
   gradient Γ = 6,5 K/km de l'air libre posé sur la surface, en plus de l'inversion de Jouzel & Merlivat ; trois valeurs de Γ
   dans le moteur.

4. **Une cible 🎯 est une entrée** (37) : la courbe cyan d'Histoire fixe, à chaque clic de 🛖, 🚂 et 📱, la glace saisonnière
   (instantané à sa température, tenu par une inertie de 50 ka) et la graine du clic frise. La rétroaction glace–albédo
   saisonnière y est coupée à 80–99 %. Même famille : D de North est calé sur le T₂ = −28 °C qu'on vérifie (21, 39).

5. **Le pôle trop chaud a des causes identifiées** (22, 2, 35) : nuages et albédo de la mer indépendants de l'angle solaire
   (−1,1 à −1,8 K sur T₂ manquants), part de terre de chaque zone prise de deux sources (0,29 global contre 0,65 aux pôles),
   calotte à 0,85 toute l'année dans le bilan radiatif.

6. **La convergence n'est pas sûre** (68, 69, 25, 26) : les calottes sont engagées même quand le solveur sort sans converger ;
   l'état méridien n'est jamais remis au clic frise ; la glace de zone est un escalier dont les marches dépassent la tolérance ;
   le point fixe sort sans rien dire après 30 tours.

7. **Référence unique** (8, 9, 10, 12, 13, 17, 18, 20, 54…) : beaucoup de grandeurs de DATA recopiées en arguments ;
   l'obliquité de DATA vaut 0 avant −51 Ma alors que le calcul prend 23,44 ou 45° ; g posé à 9,81 alors que M et R du moteur
   donnent 9,820 ; ρ de l'eau de mer à 1 000 dans la décharge du socle et à 1 025 dans saisons.js ; un âge passé là où une date
   est attendue (Soleil).

## Ordre proposé

| # | Chantier | Constats | Coût | Bloquant |
|---|---|---|---|---|
| 1 | Géométrie unique des calottes : distance à la marge tabulée par bande et par carte, la même loi plastique (Nye sur socle enfoncé) et le même τ pour la fermeture Bedmap2 et le moteur ; socle par classe, hypsométrie vraie ; ρ eau de mer et part émergée dans la même régénération | 46, 56, 58, 61, connus 1-2, 5, 2, 64, 10 | linéaire | archive PaleoDEM (20 Mo) |
| 2 | Glace saisonnière à l'équilibre de la T courante, une seule glace dans DATA ; plus de cyan ni de 50 ka dans le calcul | 37, 6, 43, 3, 16, 30 | linéaire | — |
| 3 | Orbite à la date de chaque sous-pas des calottes ; puis longueur des clics 🐾 (≤ 5 ka, sinon T̄ et T₂ restent repliés) | 55 | linéaire ; clics ×4 | ta décision (un récit par clic) |
| 4 | Fonte par bilan d'énergie de surface, cycle de T qui répond à toute l'orbite | 57, 27 | linéaire | après 3 |
| 5 | Température de la calotte = boîte terre de saisons.js ; Γ de la loi adiabatique du profil | 60, 38, 15, 59, 1, 41, 71 | linéaire | après 6 |
| 6 | Pôle : angles solaires sur nuages et mer, part de terre par zone, albédo annuel de la calotte | 22, 2, 35, 31 | linéaire | — |
| 7 | Convergence : n'engager que convergé, état méridien dans DATA et remis au clic frise, e(T) continue, point fixe sans relaxation | 68, 69, 25, 26, 70 | linéaire | — |
| 8 | Statuts et 🎯 : D de North 🔧, amplitudes 🔧, σ / DDF / J&M en 🦴 ou 💻, Briegleb, Fennoscandie | 21, 38, 39, 40, 44, 45, 47, 52, 53, 62, 63, 72 | nul | — |
| 9 | Référence unique : obliquité, âge, g, albédos, constantes, arguments | 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 32, 33, 34, 48–51, 54, 65–67 | nul | — |

Les chantiers 8 et 9 ne changent aucun nombre (ou presque) : ils peuvent se faire au fil des autres.

## Annexe — les 72 constats

### Volet : Référence unique et valeurs en double

#### 1. Gradient thermique Γ : trois valeurs (6,5 K/km posé pour les calottes, g/c_p sec pour la vapeur, adiabatique calculée par le profil)

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/physics/calottes.js:355, calottes.js:276, calottes.js:370, API_BILAN/config/configTimeline.js:2048, API_BILAN/radiative/calculations.js:197, radiative/calculations.js:200-229, radiative/calculations.js:16, API_BILAN/physics/physics.js:574, physics.js:739-741, API_BILAN/atmosphere/calculations_atm.js:282-285`

**Constat.** Les calottes calculent la température d'un point par T̄ + T₂P₂(x) − Γ z avec Γ = CONFIG_COMPUTE.troposphericLapseRateKPerM = 0,0065 K/m ([OBS/CALIB], « atmosphère standard ») ; leur arrêt tolZ = MERIDIEN.TOLERANCE_K / Γ en dépend aussi. Or le profil vertical du modèle ne lit plus cette constante : l'en-tête de profilAtmosphere dit « Remplace : gradient de config 6,5 K/km » (radiative/calculations.js:197). Il intègre l'adiabatique sèche −g/c_p(T), avec c_p tiré de JANAF, puis l'adiabatique humide (Pierrehumbert éq. 2.33). Une troisième valeur existe : PHYS.computeH2OScaleHeight prend Γ = DATA g / EARTH.CP_AIR_MOIST_J_KG_K = 9,81/1005 = 9,76 K/km. Cette constante est étiquetée « humide » mais porte la valeur de l'air sec, la même que CONST.CP_AIR. De même, RADIATIVE.temperatureAtZ prend Γ = −g/CONST.CP_AIR = 9,76 K/km ; il est encore lu par ATM.airNumberDensityAtZ (calculations_atm.js:284), qui alimente computePWV et calculateRadiativeCapacities. Une même grandeur, dT/dz de la troposphère, vaut donc 6,5 K/km (calottes), 9,76 K/km (vapeur, densités) et le profil calculé (proche de l'adiabatique sèche sous une colonne froide, plus faible sous une colonne chaude et humide).

**Effet.** Pour une calotte dont la surface moyenne est à 2 km, la surface est refroidie de 13,0 K avec 6,5 K/km et de 19,5 K avec g/c_p. À 3 km : 19,5 K contre 29,3 K. La neige (réduite par p_sat(T_inv)) et les degrés-jours y sont très sensibles. Avec le Γ du profil, une grande calotte serait nettement plus froide en surface : moins de fonte, une déglaciation plus difficile. Le sens exact pour une colonne polaire est inconnu par lecture, car le profil est celui de la colonne moyenne globale. tolZ change dans le même rapport.

**Correction proposée.** Une seule référence : le gradient (ou directement T(z)) du profil calculé par profilAtmosphere, publié dans DATA. La clé est à créer selon l'alphabet (K par km, à nommer avec le propriétaire). Elle serait lue par calottes.js (c.Gamma, tolZ), par PHYS.computeH2OScaleHeight et par temperatureAtZ. Supprimer CONFIG_COMPUTE.troposphericLapseRateKPerM et EARTH.CP_AIR_MOIST_J_KG_K. Si l'on veut le gradient de la colonne de la zone, plus juste pour une calotte polaire, le tirer de la même loi adiabatique évaluée à T_zone, pas d'une constante.

**Vérification.** Lu : calottes.js:355 Gamma = CONFIG_COMPUTE.troposphericLapseRateKPerM (configTimeline.js:2048, 0,0065, seul lecteur au grep) ; :276 T = T̄ + T₂P₂ − Γ·max(0,z) ; :370 tolZ = 0,01/0,0065 = 1,54 m. radiative/calculations.js:197 « Remplace : gradient de config 6,5 K/km », profil −g/c_p(T) JANAF puis Pierrehumbert 2.33. physics.js:574 EARTH.CP_AIR_MOIST_J_KG_K = 1005 = CONST.CP_AIR (« sec », physics.js:61), :740 Γ = 9,81/1005 = 9,76 K/km ; calculations.js:16 Γ = −🍎/CP_AIR, derrière un ternaire EPOCH.lapse_rate jamais défini (repli mort). Trois points à préciser. (a) Les deux lecteurs à 9,76 K/km sont des DIAGNOSTICS. computeH2OScaleHeight n'est lu que par waterVaporFractionAtZ. Celle-ci n'est lue que par calculateRadiativeCapacities, qui écrit 🍰🫧…🌈, des clés lues seulement par l'affichage et le banc. computePWV n'est appelé nulle part : il est exporté, rien de plus. Sur la courbe orange, seul le 6,5 des calottes agit. (b) Le commentaire physics.js:736 annonce H_vap ≈ 2,4 km. C'est 1/(0,0065 × 0,0653) = 2,36 km, donc une valeur écrite pour 6,5 K/km. Le code, à 9,76 K/km, donne 1,57 km. (c) L'effet « avec le Γ du profil, une grande calotte serait nettement plus froide » ne tient pas pour le profil réellement calculé, celui de la colonne moyenne à T̄ ≈ 288 K. La parcelle monte sèche jusqu'à la condensation : HR 0,735, point de rosée ≈ 283,5 K, LCL ≈ 0,56 km. Elle suit ensuite l'adiabatique humide : g(1 + Lr/R_dT)/(c_p + L²rε/R_dT²) = 4,70 K/km à 288 K et 1 000 hPa (refait). Moyenne : ≈ 6,3 K/km sur 0–2 km et ≈ 6,1 K/km sur 0–3 km, soit presque 6,5. L'écart n'apparaît qu'avec l'adiabatique d'une colonne froide : à 255 K, Γ_m ≈ 8,6 K/km, soit −17 K à 2 km au lieu de −13 K. L'arithmétique 13,0 / 19,5 / 29,3 K est juste.

**Correction amendée.** Une seule référence : la LOI adiabatique du profil (sèche, puis humide de Pierrehumbert éq. 2.33, c_p de JANAF). On l'évalue pour la colonne qui porte le point de calotte : sa température de surface, 🎈, 🧪 et 🍎 lus dans DATA. Ce n'est pas le gradient de la colonne moyenne globale, qui n'est pas la bonne grandeur pour un point polaire en altitude. Le résultat est publié dans DATA (clé en K/km à nommer avec le propriétaire) et lu par calottes.js (T du point et tolZ). computeH2OScaleHeight et temperatureAtZ lisent la même référence ; on peut aussi les supprimer avec leurs seuls lecteurs diagnostiques. Supprimer CONFIG_COMPUTE.troposphericLapseRateKPerM, EARTH.CP_AIR_MOIST_J_KG_K et le ternaire EPOCH.lapse_rate. Corriger le « 2,4 km » de physics.js:736. Les gradients de surface mesurés sur les calottes servent de 🎯, pas d'entrée.

#### 2. Part de terre par bande : deux sources (EPOCH['🗻'] posé, PALEOGEO PaleoDEM) dans la même itération du bilan méridien

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:287-288, API_BILAN/physics/physics.js:360, physics.js:180-185, API_BILAN/physics/calottes.js:112, calottes.js:121-124, API_BILAN/physics/saisons.js:98, API_BILAN/albedo/calculations_albedo.js:73-84, calculations_albedo.js:244-246, API_BILAN/config/configTimeline.js:1505-1510, API_BILAN/data/paleogeo_zones.js:21`

**Constat.** Dans MERIDIEN.resoudre, la surface libre de CHAQUE zone (albedoLibre) prend la terre globale posée, 1 − EPOCH['🗻']['🍰🗻🌊'], soit 0,29 sur 📱. facteurGlaceZones prend la même valeur pour la part continentale des moyennes latitudes : fContinent, commenté « 0,30 sur 📱, ≈ 0,28 mesurés dans les bandes 30–60° ». Au même pas, CALOTTES.calculer et SAISONS.cycles (fT = geo.continent) prennent PALEOGEO.continent par bande. Calcul fait avec node sur paleogeo_zones.js à 0 Ma : 0,373 au global ; 0,35 aux moyennes latitudes (S 0,103, N 0,596) ; aux pôles S 0,495, N 0,801 ; aux tropiques S 0,282, N 0,353. Les définitions diffèrent : PALEOGEO compte le socle au-dessus de −1 000 m, plateaux immergés compris ; EPOCH donne une « surface océanique potentielle ». Pourtant saisons.js emploie le continent de PALEOGEO comme TERRE thermique dans le couplage terre–mer, alors qu'un plateau sous 100 m d'eau se comporte comme la mer. Troisième copie : DATA['🗻']['🍰🗻🌊'] (calculateGeologySurfaces, normalisée si la somme dépasse 1), lue par fractionMaritime et par le bassin océanique ; les autres lecteurs lisent EPOCH['🗻'] directement. Avant 540 Ma, calottes.js prend 1 − EPOCH['🗻']['🍰🗻🌊'], uniforme sur les bandes.

**Effet.** Le bilan méridien voit 0,29 de terre dans chaque zone (albédo libre, glace saisonnière des moyennes latitudes). Au même instant, les calottes et le cycle saisonnier voient 0,35 aux moyennes latitudes et 0,65 en moyenne N/S aux pôles. Sens probable : l'albédo libre polaire du méridien penche trop vers l'océan (Fresnel 0,066 contre 0,18 pour la terre), donc un pôle plus absorbant, qui va dans le sens du pôle trop chaud. L'amplitude saisonnière de saisons.js est gonflée par les plateaux comptés comme terre. Ordre de grandeur sur T₂ : inconnu par lecture.

**Correction proposée.** Une seule source par bande et par date : PALEOGEO. Ajouter dans paleodem_zones.py la part ÉMERGÉE (z > 0) par bande à côté de 'continent' (> −1 000 m), les deux tirées des mêmes cartes : la première sert de terre thermique et d'albédo, la seconde de socle aux calottes. albedoLibre (par zone), facteurGlaceZones et saisons.js lisent la part émergée de PALEOGEO. Pour ≤ 540 Ma, EPOCH['🗻'] devient un accesseur sur PALEOGEO ou disparaît, et DATA['🗻'] cesse d'être une copie pour devenir la seule lecture. Avant 540 Ma : une valeur par époque, lue de la même façon partout.

**Vérification.** Lu : calculations_albedo.js:287-288, ocGeo = EPOCH['🗻']['🍰🗻🌊'] global, donc le même albedoLibre dans les trois zones. physics.js:360 : fContinent = 1 − EPOCH['🗻']['🍰🗻🌊'], qui vaut 0,29 et non 0,30 comme le dit le commentaire l.182. calottes.js:121-124 et saisons.js:98 lisent PALEOGEO.continent. Recalcul node sur paleogeo_zones.js à 0 Ma : global 0,373 ; pôles S/N 0,495/0,801 ; moyennes latitudes 0,103/0,596 (moyenne 0,349) ; tropiques 0,282/0,353. Mêmes valeurs que l'auditeur. calculateGeologySurfaces (calculations_albedo.js:69-87) écrit dans DATA['🗻'] une copie normalisée, lue par fractionMaritime et par le bassin, alors qu'albedoLibre et facteurGlaceZones lisent EPOCH : trois copies, confirmé. Trois précisions. (a) SAISONS.cycles n'est appelé qu'après le point fixe, en diagnostic (meridien.js:180) : il n'entre pas dans la courbe. (b) Les deux grandeurs ne sont pas la même définition. Le socle au-dessus de −1 000 m est légitime comme SUPPORT des calottes, puisque la glace se pose sur les plateaux en période glaciaire. Il ne l'est pas comme surface thermique ou d'albédo. Le vrai défaut : l'albédo libre et la part continentale des moyennes latitudes n'ont aucune source zonale. (c) Le sens « pôle plus absorbant » n'est pas démontré. albedoLibre ne s'applique qu'à la part (1 − c) hors calottes (meridien.js:162). Avec l'Antarctique sous calotte, la terre libre de la zone polaire actuelle fait de l'ordre de 0,3. C'est un ordre de grandeur hors code : ≈ 0,53 de terres émergées à 60–90° N dont 0,05 de Groenland, presque rien de libre à 60–90° S. C'est proche du 0,29 posé. L'écart devient grand aux époques à continent polaire (Gondwana) ou en Pangée. L'effet sur T₂ reste inconnu par lecture.

**Correction amendée.** Une seule source par bande et par date : PALEOGEO. paleodem_zones.py ajoute la part ÉMERGÉE (z > 0 au niveau marin de la carte), calculée sur le même socle déchargé que 'continent'. 'continent' reste le support des calottes. La part émergée, diminuée de la part sous calotte, sert de terre thermique et d'albédo libre de chaque zone : albedoLibre devient zonal, et facteurGlaceZones comme saisons.js la lisent. Pour ≤ 540 Ma, EPOCH['🗻'] devient un accesseur sur PALEOGEO ; DATA['🗻'] devient la seule lecture et perd sa normalisation silencieuse (console.warn puis mise à l'échelle). Avant 540 Ma : une valeur par époque, lue de la même façon partout.

#### 3. 🍰💧🧊 écrite par deux fonctions aux formules différentes (facteur ~15) ; la masse des calottes n'est publiée nulle part

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/h2o/calculations_h2o.js:211-229, calculations_h2o.js:307-315, API_BILAN/albedo/calculations_albedo.js:314-331, calculations_albedo.js:403-405, API_BILAN/convergence/calculations_flux.js:507-509, API_BILAN/physics/calottes.js:187-196, calottes.js:430-431, API_BILAN/api.js:100`

**Constat.** DATA['💧']['🍰💧🧊'] est d'abord posée par calculateWaterPartition : polar_ice_fraction = min(🍰🗻🏔, 0,10 × tf_pol), avec la rampe de facteurGlaceZones (largeur 2·amp_pol ≈ 30 K, seuil T_FREEZE + dT_pol + amp_pol). calculateAlbedo la réécrit ensuite avec le mélange instantané/équilibre de calcGlaceEquilibre : 0,1 × clamp((T_FREEZE + dT_pol − T)/EARTH.T_NO_POLAR_ICE_RANGE_K), une rampe de 20 K sans amp_pol. La dernière fonction appelée gagne : dans computeRadiativeTransfer, H2O.calculateH2OParameters passe avant ALBEDO.calculateAlbedo (calculations_flux.js:507-509). De plus, min(🍰🗻🏔, 0,10·tf_pol) compare une part de SURFACE (🍰🗻…, m²/m²) à une part MASSIQUE d'eau (🍰💧…, kg/kg), ce que la règle de l'alphabet interdit. La valeur physique, le volume des calottes ρ_i Σ a A H̄ (volume() de calottes.js), n'est jamais publiée dans DATA.

**Effet.** Ordre de grandeur sur 📱, pris avec T₂ = −21,1 °C (episteme.js:45), donc dT_pol ≈ 17,0 K, et T ≈ 287,6 K : calculateAlbedo donne ≈ 0,003, calculateWaterPartition ≈ 0,05. Les calottes actuelles mesurées (2,7e19 kg sur 1,4e21) font 0,019. À ma lecture, les lecteurs sont la normalisation interne de calculations_h2o, api.js:100 (diagnostic) et l'affichage ; je n'ai trouvé aucun lecteur physique hors de h2o. Effet sur la courbe orange probablement faible ; ce qui est affiché est faux à coup sûr.

**Correction proposée.** Une seule écriture. La glace continentale est la masse des calottes, ρ_i Σ a A_bande H̄, publiée par CALOTTES.engager dans DATA['🗻'] sous une clé ⚖️ à créer. La glace de mer est comptée à part. 🍰💧🧊 = (masse des calottes + glace de mer) / ⚖️💧, écrite par UNE fonction. Supprimer calcGlaceEquilibre et polar_ice_fraction, deux règles 0D qui doublent les calottes.

**Vérification.** Lu : h2o:212-229, polar_ice_fraction = min(🍰🗻🏔, 0,10·tf_pol), écrite l.314. calculations_albedo.js:314-331 : calcGlaceEquilibre, rampe EARTH.T_NO_POLAR_ICE_RANGE_K = 20 sans amp_pol. calculations_albedo.js:403-405 : le mélange. L'ordre H2O puis albédo est vérifié à calculations_flux.js:509-510, et aussi 310/312, 395/398, 617/618, 861/862… : l'albédo l'emporte dès que applyIceStockBlend est vrai. Recalcul sur 📱 : dT_pol = 21,1 × 0,80801 = 17,05 K. calcGlaceEquilibre(287,6) = 0,1 × (288,20 − 287,6)/20 = 0,003. tf_pol = (271,15 + 17,05 + 15 − 287,6)/30 = 0,52, donc 0,052, sous 🍰🗻🏔 = 0,09. Calottes réelles : 2,7e19 / 1,4e21 = 0,019. Le mélange surface/masse viole bien alphabet.js:150-152 (🍰🗻 en m²/m², 🍰💧 en kg/kg). Au grep, aucun lecteur physique : api.js:100, histoire/point_modele.js:24, debug.js et la normalisation interne de h2o. Précisions : (a) Il y a PLUS de deux écrivains. calculatePrecipitationFeedback (h2o:423) et l'itération Init (h2o:540) ajoutent aussi à 🍰💧🧊. (b) calculateAlbedo réécrit 🍰💧🧊 sans 🍰💧🌊 : après elle, glace + liquide + vapeur ≠ 1. (c) Sur 📱, ce que l'albédo écrit vaut ≈ calcGlaceEquilibre(GRAINE), car fraction_fonte = 0,002. Ce n'est pas la valeur à T courante. (d) L'effet sur la courbe est nul, faute de lecteur physique, pas seulement « faible ». L'affichage est faux.

**Correction amendée.** Une seule fonction écrit à la fois 🍰💧🧊 et 🍰💧🌊 (et la vapeur), dont la somme fait 1. Glace continentale = ρ_i Σ volume(a, bande, geo) de l'état ENGAGÉ des calottes. Ce n'est pas res.H, l'épaisseur de l'équilibre aEq. Elle est publiée par CALOTTES.engager dans DATA['🗻'] sous une clé ⚖️ à créer. La glace de mer est comptée à part (épaisseur de Stefan × aire gelée, déjà calculée dans saisons.js). Supprimer calcGlaceEquilibre, polar_ice_fraction, la rampe de transition et les ajouts de précipitation à 🍰💧🧊 (h2o:423, 540).

#### 4. Transport méridien : deux diffusivités pour la même énergie (North D = 0,649 W m⁻² K⁻¹ constant, Siler D = 1,16e6 m²/s) ; B posé alors que le modèle calcule son OLR

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/physics/meridien.js:32-35, meridien.js:129, meridien.js:168, API_BILAN/physics/calottes.js:82-83, calottes.js:347-349, API_BILAN/physics/saisons.js:105, API_BILAN/data/episteme.js:44-45`

**Constat.** Le profil T(x) vu par les calottes vient de T₂ = 5·S·H/(6D + B), avec D = 0,649 (North 1981, constant). L'accumulation de ces mêmes calottes vient du transport de l'humidité, F_q = −(2π p_s/g) D_S (1−x²)(1−w) dq/dx, avec D_S = 1,16e6 m²/s (Siler et al. 2018). Les deux décrivent la diffusion de la même énergie statique humide h = c_p T + L q. Dans la forme de North, cela donne D_N = (p_s c_p D_S/(g a²)) · (1 + L·HR·dq*/dT / c_p). Calcul en python (p_s = 1 atm, g = 9,81, a = 6 371 km, c_p = 1 005, HR = 0,735, q* par Clausius-Clapeyron) : partie sèche 0,297 ; D_N équivalent 0,50 à 278 K, 0,67 à 288 K, 0,96 à 298 K. Les deux valeurs coïncident à 3 % près sur le climat actuel et divergent ailleurs. D_N ne suit pas non plus p_s (🎈), que le transport de Siler suit. Même dédoublement pour B = 2,09 (pente de l'OLR observé) : le modèle calcule son OLR(T) spectral, dont la pente est une grandeur du modèle. Accessoirement, D est « calé par North sur le gradient observé » (episteme.js:44, usage 📌), alors que ce gradient, T₂ = −28 °C, est la cible 🎯 (episteme.js:45) : l'usage serait plutôt 🔧.

**Effet.** À T̄ = 278 K (état glaciaire), D_N équivalent vaut 0,50 au lieu de 0,649 : 6D + B passe de 5,98 à 5,09, soit |T₂| × 1,18 (pôle plus froid). À 298 K, D_N vaut 0,96 : |T₂| × 0,77. Le méridien garde donc un gradient « moderne » dans les climats froids, ce qui réchauffe le pôle justement quand les calottes devraient croître. Sur 📱 (≈ 288 K) l'écart est faible (|T₂| × 0,98) et n'explique pas le pôle trop chaud actuel. Écart sur B : inconnu par lecture.

**Correction proposée.** Une seule diffusivité physique, D_S [m²/s] de l'énergie statique humide, avec son statut déclaré (Siler l'ajuste sur ERA-Interim). meridien.js en déduit D_N = p_s c_p D_S/(g a²) · (1 + L HR dq*/dT / c_p) à l'état courant, en lisant 🧮🌡️, 🎈, 🍎, 📐 et H2O_SURFACE_RH_01 dans DATA ; le mieux serait de résoudre directement le bilan en énergie humide. NORTH1981.D disparaît. B se tire de l'OLR du modèle (dérivée du transfert à composition fixée), pas d'une régression observée.

**Vérification.** Lu : meridien.js:32-35 (B 2,09, D 0,649), :129 L2 = 6D + B, :168 T₂. calottes.js:82-83 et :347-349 : F_q de Siler avec D_HUMIDE. saisons.js:105 : NCC.B et NCC.D. episteme.js:44 (D « calé par North sur le gradient observé », 📌) et :45 (T₂ = −28 en 🎯). Dérivation refaite. Chez North, la divergence est (1/2πa²) dF/dx avec F = −2πa² D_N (1−x²) dT/dx. Chez Siler, F = −(2π p_s/g) D_S (1−x²) dh/dx. D'où D_N = p_s c_p D_S/(g a²) · (1 + L·HR·dq*/dT / c_p). Partie sèche : 101 325 × 1 005 × 1,16e6 / (9,81 × 4,059e13) = 0,297. D_N vaut 0,50 à 278 K, 0,668 à 288 K et 0,94 à 298 K. 6D + B passe de 5,98 à 5,09, soit |T₂| × 1,18. Précisions : (a) dq/dx se prend à la température LOCALE, donc D_N équivalent varie avec x. Il vaut ≈ 0,50 vers 278 K, aux moyennes latitudes où le transport culmine. La coïncidence à 3 % vient du choix d'évaluer à T̄, ce n'est pas un accord. (b) Au DMG (T̄ ≈ 282 K), D_N ≈ 0,56, soit |T₂| × 1,10. 278 K est plus froid que le DMG. (c) Le B de North est la pente de l'OLR ENTRE latitudes : vapeur à humidité relative ~ constante, gradient vertical et nuages compris. Pris « à composition fixée », le transfert donnerait une pente de type Planck (~3,3–3,8 W m⁻² K⁻¹), une autre grandeur. (d) North a ajusté le COUPLE D/B = 0,310. Remplacer l'un en gardant l'autre casse cet ajustement.

**Correction amendée.** Une seule diffusivité physique : D_S [m²/s] de l'énergie statique humide, statut déclaré (Siler l'ajuste sur ERA-Interim, donc 📡/🔧, pas ⚛). Le mieux : résoudre le bilan en énergie humide h(x) = c_p T + L·HR·q*(T(x)) sur la grille en x, au lieu de la solution à deux modes à D constant, en lisant 🎈, 🍎, 📐, 🧪 et H2O_SURFACE_RH_01 dans DATA. À défaut, D_N est évalué à la température des moyennes latitudes, pas à T̄. B se tire de l'OLR du modèle à HUMIDITÉ RELATIVE fixée (vapeur suivant la saturation), nuages du modèle compris, pas à composition fixée. NORTH1981.D et NORTH1981.B disparaissent ensemble. T₂ = −28 °C reste un 🎯.

#### 5. Densité de l'eau de mer : 1 000 kg/m³ pour la décharge du socle et l'océan, alors que le moteur porte déjà 1 025

*haute · valeur_double · verdict : **confirme***  
`CO2/scripts/paleogeo/paleodem_zones.py:30, paleodem_zones.py:191-197, paleodem_zones.py:214-217, API_BILAN/physics/saisons.js:39, API_BILAN/physics/physics.js:50, API_BILAN/albedo/calculations_albedo.js:424-431`

**Constat.** paleodem_zones.py lit RHO_EAU = CONST.RHO_WATER = 1 000 et le commente « ⚠️ eau DOUCE : le moteur n'a pas d'eau de mer ». Or le moteur porte SAISONS.K.RHO_EAU_MER = 1 025 kg/m³ (TEOS-10, S = 35 g/kg). La même grandeur, l'eau de mer qui recharge un socle immergé, fait flotter une glace ou remplit un bassin, a donc deux valeurs. Le volume de l'océan du moteur (calculations_albedo : ⚖️💧 / CONST.RHO_WATER) prend lui aussi l'eau douce.

**Effet.** Recharge d'Airy z = u/(1 − ρ_w/ρ_m) : facteur 1,4348 avec 1 000, 1,4505 avec 1 025, soit +1,1 % sur les socles restés sous la mer. Critère de flottaison ρ_i H > ρ_w (−b) : seuil +2,5 %, donc l'aire posée et la fermeture sur Bedmap2 (τ effectif, d₀) bougent un peu. Volume de l'océan : −2,4 % avec 1 025. Petits écarts, mais deux valeurs pour une grandeur, et le commentaire du script est faux.

**Correction proposée.** Une clé unique pour l'eau de mer : sortir 1 025 de SAISONS.K vers CONST (par exemple CONST.RHO_EAU_MER). saisons.js la lit ; paleodem_zones.py la lit par regex, comme les autres constantes, pour decharger et pour le critère de flottaison ; le volume de l'océan la lit aussi. CONST.RHO_WATER reste l'eau douce (gouttes, eau de fonte). Régénérer paleogeo_zones.js.

**Vérification.** Lu : paleodem_zones.py:30 lit CONST.RHO_WATER par regex, avec le commentaire « le moteur n'a pas d'eau de mer ». Ce commentaire est faux depuis saisons.js:39, RHO_EAU_MER = 1 025 (saisons v1.0.0 du 27/10, script v1.4.0 du 26/10). Usages relus : decharger l.191-197, critère de flottaison l.214-217 (ρ_i H > ρ_eau(−b)), calculations_albedo.js:424-431 (volume de l'océan). Recalculs : 1/(1 − 1000/3300) = 1,4348 et 1/(1 − 1025/3300) = 1,4505, soit +1,1 %. Seuil de flottaison +2,5 %, volume ÷ 1,025 = −2,4 %. Précision : sur 📱, le bassin est plein. ⚖️💧 ≈ 1,4e21 kg dépasse la capacité 0,71 × 5,1e14 m² × 3 700 m × 1 000 ≈ 1,34e21 kg, donc ocean_coverage ne dépend pas de ρ. L'effet « volume » ne joue que quand l'eau manque. Les en-têtes de calottes.js (« ⚠️ eau douce ») et de paleogeo_zones.js reprennent la même erreur. 1 025 est une valeur de SURFACE (~20 °C) ; la colonne qui charge un socle profond est plutôt à 1 027–1 028 (TEOS-10 en profondeur) : choix à déclarer.

**Correction amendée.** Comme proposé : CONST.RHO_EAU_MER (TEOS-10, choix surface ou colonne déclaré), lue par saisons.js, par paleodem_zones.py (regex, pour decharger et la flottaison) et par le volume de l'océan. CONST.RHO_WATER reste l'eau douce (gouttes, fonte). Régénérer paleogeo_zones.js, corriger les en-têtes de calottes.js, paleodem_zones.py et paleogeo_zones.js, puis remesurer la fermeture Bedmap2 (τ effectif, d₀).

#### 6. Inertie de la glace : 50 ka posés sur la durée de l'époque d'un côté, τ et temps écoulé calculés de l'autre, dans le même calculateAlbedo

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/config/configTimeline.js:2033, configTimeline.js:2043, API_BILAN/albedo/calculations_albedo.js:296, calculations_albedo.js:314-343, calculations_albedo.js:403-405, calculations_albedo.js:507-511, API_BILAN/physics/calottes.js:377-385, calottes.js:390, API_BILAN/api.js:88`

**Constat.** Dans calculateAlbedo, la glace 0D (🍰💧🧊, et 🍰🪩🧊 par l'instantané) relaxe avec tau_eff = CONFIG_COMPUTE.tauGlaceAns × iceInertiaFactor01. tauGlaceAns vaut 50 000 ans ([OBS/CALIB], commentaire « τ_calotte ~ 10⁴–10⁵ ans, Marshall & Clark 2002 »). La durée utilisée est duree_ans = |▶ − ◀|, celle de TOUTE l'époque. Dans le même appel, les calottes de calottes.js relaxent avec τ = ρ_i H̄ / max(accumulation, fonte), calculé, et τ_b pour le socle. Leur durée est dureeCalottes = 📅🗻🧊 − âge courant, le temps réellement écoulé depuis l'état porté. Une même grandeur, le temps de réponse d'une calotte, a donc deux valeurs ; un même rôle, le temps écoulé, a deux durées.

**Effet.** 📱 : fraction_fonte = 1 − e^(−100/50 000) = 0,002, la glace 0D reste figée sur la graine pendant que les calottes avancent au fil des clics. 🦣 : |▶ − ◀| = 2,57 Ma donne fraction_fonte = 1, la glace 0D est à l'équilibre instantané à chaque clic de 20 ka, alors que les calottes gardent leur mémoire. Les deux glaces se rejoignent dans 🍰🪩🧊, qui prend max(glace saisonnière, calottes).

**Correction proposée.** Supprimer tauGlaceAns, iceInertiaFactor01 et le mélange instantané/équilibre. La seule glace qui a une inertie est celle des calottes, avec son τ calculé et la durée 📅🗻🧊 − âge courant. La glace saisonnière et la glace de mer n'ont pas d'inertie pluriannuelle et se lisent à l'équilibre. Une seule durée : le temps écoulé depuis l'état porté.

**Vérification.** Lu : configTimeline.js:2033 (tauGlaceAns = 50 000) et :2043 (iceInertiaFactor01 = 1). calculations_albedo.js:336-340 : duree_ans = |▶ − ◀| et fraction_fonte. calottes.js:377-385 (τ) et :390 (τ_b). calculations_albedo.js:296 : dureeCalottes = 📅🗻🧊 − âge courant. Recalcul : 📱 1 − e^(−100/50 000) = 0,0020 ; 🦣 |2,58e6 − 1,17e4| = 2,568e6 an, donc 1. 🍰🪩🧊 = max(saisonnière, calottes), confirmé l.648-666. Aggravant non relevé par l'auditeur : le snapshot est pris à la graine EPOCH['🌡️🧮'], qui est la COURBE CYAN d'Histoire (configTimeline.js:2145, calculations_albedo.js:389-399). La part de la graine dans la glace saisonnière de l'albédo planétaire (_iceSurfSnapshotPreSearch01 → 🍰🪩🧊) vaut 99,8 % sur 📱, 99,5 % sur 🚂 (250 ans) et 80 % sur 🛖 (11 450 ans). Cette part sort de l'équilibre à la température de la LITTÉRATURE. La rétroaction glace–albédo de T̄ y est figée sur la cible : c'est un calage sur ce qu'on vérifie. L'effet sur ces trois époques n'est pas chiffrable par lecture.

**Correction amendée.** Comme proposé : supprimer tauGlaceAns, iceInertiaFactor01, les snapshots à la graine et le mélange instantané/équilibre. Seules les calottes ont une inertie (τ calculé, durée 📅🗻🧊 − âge courant). La glace saisonnière se lit à l'équilibre de T courante. Pour une boule de neige établie, un glacier de mer épais a une inertie pluriannuelle. Si on la veut, elle sort de son épaisseur (loi de Stefan, déjà dans saisons.js), pas d'un τ posé.

#### 7. Obliquité : DATA['📜']['⚾'] vaut 0 (sentinelle) avant −51 Ma, alors que le calcul utilise 23,44° ou 45°

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/physics/orbite.js:56-59, API_BILAN/convergence/compute.js:103, API_BILAN/physics/physics.js:402-405, physics.js:193, physics.js:338, API_BILAN/config/configTimeline.js:338, configTimeline.js:1998, API_BILAN/data/dico.js:67, API_BILAN/physics/meridien.js:124, API_BILAN/physics/saisons.js:86`

**Constat.** compute.js pose 📜⚾ = ORBITE.obliquiteDeg(âge), qui rend 0 hors de La2004, c'est-à-dire avant −51 Ma. Le dico l'annonce : « 0 = celle de l'époque » (dico.js:67). L'obliquité réellement utilisée sort d'une deuxième fonction, EARTH.obliquiteCourante(EPOCH) : `if (DATA['📜']['⚾'] > 0)`, sinon EPOCH['⚾'] (45° sur 🦠), sinon CONFIG_COMPUTE.obliquityDeg (23,44). Pour toutes les époques antérieures à −51 Ma, DATA dit donc 0° quand le calcul prend 23,44° ou 45°. Or 0° est une obliquité physique possible (aucune saison), ici confondue avec « absente ». La valeur 23,44 existe sous deux noms, CONFIG_COMPUTE.obliquityDeg et EARTH.OBLIQUITY_DEG_REF ; La2004 donne 23,4393° en 2000 (indice 0 d'astronomie_la04.js).

**Effet.** Aucun écart de calcul aujourd'hui, car obliquiteCourante est appelée partout (meridien, saisons, facteurGlaceZones). En revanche tout lecteur de DATA (dico, page 🔎, état gardé, banc) lit 0° pour les époques de 🔥 à 🦤. Un futur lecteur direct de 📜⚾ calculerait une planète sans saisons. Le test `> 0` est un if de sentinelle.

**Correction proposée.** compute.js pose une fois dans 📜⚾ l'obliquité réellement utilisée : celle de l'orbite quand ORBITE.valide(âge), sinon EPOCH['⚾]. Chaque époque antérieure à −51 Ma déclare alors son ⚾ (crash à la lecture s'il manque), ce qui supprime CONFIG_COMPUTE.obliquityDeg. EARTH.obliquiteCourante disparaît : meridien, saisons et facteurGlaceZones lisent DATA['📜']['⚾']. EARTH.OBLIQUITY_DEG_REF garde son seul rôle légitime, la référence des amplitudes posées.

**Vérification.** Lu : orbite.js:56-59 rend 0 hors validité ; compute.js:103 le pose dans 📜⚾ ; physics.js:402-405 fait `> 0` puis `'⚾' in EPOCH`, puis CONFIG_COMPUTE.obliquityDeg = 23,44 (configTimeline.js:1998). Seul 🦠 déclare ⚾ = 45 (l.338) : toutes les autres époques antérieures à −51 Ma calculent à 23,44 et affichent 0. Le dico dit « 0 = celle de l'époque » (dico.js:67). 23,44 a deux noms (EARTH.OBLIQUITY_DEG_REF à physics.js:193, CONFIG_COMPUTE.obliquityDeg). Lecteurs : meridien.js:124, saisons.js:86, physics.js:338, tous via obliquiteCourante : aucun écart de calcul aujourd'hui. Précision : ⚫ et la partie 56 → 51 Ma de 🐊 sont aussi concernés.

**Correction amendée.** Comme proposé : compute.js pose dans 📜⚾ l'obliquité utilisée, celle de l'orbite si ORBITE.valide(âge), sinon EPOCH['⚾'], lu directement (crash s'il manque). Chaque époque ou partie d'époque antérieure à −51 Ma, 🐊 compris, déclare son ⚾. La sentinelle `> 0`, le ternaire `'⚾' in EPOCH`, CONFIG_COMPUTE.obliquityDeg et EARTH.obliquiteCourante disparaissent. EARTH.OBLIQUITY_DEG_REF reste la référence des amplitudes posées.

#### 8. DATA['📅'] est l'époque elle-même (alias de la config, ou copie sur 🏔/🦣) : trois chemins vers l'époque, deux graines, un 🔺⏳ en secondes écrit dans la config

*haute · reference_unique · verdict : **confirme***  
`API_BILAN/api.js:39-42, API_BILAN/convergence/compute.js:36, compute.js:66, compute.js:74-76, compute.js:150-152, API_BILAN/convergence/clics.js:39-42, API_BILAN/convergence/calculations_flux.js:246, calculations_flux.js:570, API_BILAN/albedo/calculations_albedo.js:158, calculations_albedo.js:389, API_BILAN/h2o/calculations_h2o.js:497, API_BILAN/data/dico.js:21-23, dico.js:62, dico.js:74-79, API_BILAN/data/alphabet.js:122, alphabet.js:282, API_BILAN/config/configTimeline.js:1302, configTimeline.js:1412, CO2/static/ui/embarque.js:32-33`

**Constat.** (a) DATA['📅'] = TIMELINE[👉], une référence partout, sauf sur 🏔 et 🦣 (🔀 '📅') : compute.js:152 y met une COPIE fusionnée. L'époque courante s'atteint par trois chemins : DATA['📅'] ; TIMELINE[DATA['📜']['👉']] (calottes, albédo, radiatif) ; TIMELINE.find(📅 === DATA['📜']['🗿']) (getMasses). 👉 et 🗿 sont deux clés pour une seule chose. (b) Sur 🏔/🦣, la graine 🌡️🧮 a deux valeurs au même Init : calculateT0 lit DATA['📅']['🌡️🧮'] (copie interpolée à la date), calculateAlbedo lit EPOCH['🌡️🧮'] (racine, courbe cyan à ▶) pour l'instantané de glace. (c) calculateCloudFormationIndex, computeRadiativeTransfer et calculations_h2o écrivent DATA['📅']['🔺⏳'] = 86 400 s (× 10 sous accélération). Hors 🏔/🦣, c'est donc la racine de l'entrée du TIMELINE qui reçoit ce champ : le calcul modifie la config, alors que compute.js:150 dit « pour ne jamais écrire dans la config ». Or 🔺⏳ désigne aussi 📜🔺⏳ et 🕰.order[i]['🔺⏳'], des durées de clic en Ma : un même symbole pour des secondes et des millions d'années. (d) Pour l'alphabet, 📅 signifie « Date (années) » : DATA['📅']['🍎'] lit une gravité dans la catégorie date. KEYS['📅'] = ['🌡️🧮', '🔺⏳'], et DESC['📅'] décrit ⏳ et 📿💫, qui vivent dans 📜. (e) embarque.js garde JSON.stringify(DATA) : l'état gardé embarque une copie de l'entrée de config, qui redevient un objet distinct du TIMELINE à la restauration.

**Effet.** (b) Sans effet aujourd'hui sur 🏔/🦣, car fraction_fonte ≈ 1 efface l'instantané, mais deux graines coexistent. (c) Je n'ai trouvé aucune collision fonctionnelle (la racine n'est jamais lue en Ma). Mais après le premier calcul chaque époque porte un 🔺⏳ en secondes, que les copies 🏔/🦣 n'ont pas : l'état de la config dépend de l'historique des calculs. (e) Après restauration, DATA['📅'] reste une copie jusqu'au prochain prepare.

**Correction proposée.** DATA['📅'] devient un accesseur non énumérable, en lecture seule, sur TIMELINE[DATA['📜']['👉']] ; plus de copie. La graine interpolée va dans DATA['📜']['🌡️🧮'] (déjà décrite par DESC['📜']), et calculateT0 comme l'instantané de glace la lisent là. 🗿 devient un accesseur sur TIMELINE[👉]['📅']. Le pas du cycle de l'eau (en s) quitte 📅 pour DATA['💧'], sous un symbole distinct de 📜🔺⏳, à nommer selon l'alphabet. Corriger KEYS et DESC de '📅'.

**Vérification.** (a) Lu : api.js:40, clics.js:42 et compute.js:76/152 ; il y a aussi une quatrième affectation, CO2/static/ui/scenario_hote.js:70. getMasses retrouve l'époque par 🗿 (compute.js:36), les autres par 👉. (b) calculations_flux.js:246 lit DATA['📅']['🌡️🧮'] : sur 🏔/🦣 (configTimeline.js:1302, 1412), c'est la copie interpolée par bary entre la cyan à ▶ et la cyan à ◀ (compute.js:140-152). calculations_albedo.js:389 lit EPOCH['🌡️🧮'], la racine, cyan à ▶. Deux graines au même Init : confirmé. (c) Écritures en secondes dans DATA['📅']['🔺⏳'] : calculations_albedo.js:158, calculations_flux.js:570, h2o:497 ; lectures en secondes h2o:405-410 et 520-525. 📜🔺⏳ est en Ma (clics.js:228, dico.js:62). Un même symbole pour des secondes et des Ma : confirmé. Hors 🏔/🦣, l'écriture touche bien la racine du TIMELINE. Petite réserve : la copie 🏔/🦣 se fait par Object.assign de la racine et reprend donc un 🔺⏳ déjà écrit dans celle-ci. (d) KEYS['📅'] = ['🌡️🧮', '🔺⏳'] (dico.js:23) ; DESC['📅'] décrit ⏳ et 📿💫 (dico.js:76-77) ; l'alphabet définit 📅 comme une date (alphabet.js:282). (e) RÉFUTÉ. restaurer() (scenario_hote.js:68-70) recopie les groupes puis remet aussitôt D['📅'] = TIMELINE[👉]. La copie JSON de l'entrée de config est stockée mais jamais réutilisée comme DATA['📅'].

**Correction amendée.** Comme proposé pour (a) à (d) : DATA['📅'] devient un accesseur non énumérable, en lecture seule, sur TIMELINE[DATA['📜']['👉']]. Les quatre affectations disparaissent, y compris scenario_hote.js:70. La graine interpolée va dans DATA['📜']['🌡️🧮'], lue par calculateT0 ; l'instantané de glace disparaît (constat 6). 🗿 devient un accesseur sur TIMELINE[👉]['📅']. Le pas du cycle de l'eau (s) quitte 📅 pour DATA['💧'] sous un symbole distinct de 📜🔺⏳. Corriger KEYS et DESC de '📅'. Le point (e) ne demande rien, puisque restaurer() rétablit déjà la référence.

#### 9. Albédos des matériaux : DATA['🪩🍰'] existe et vaut 0 ; les vraies valeurs vivent dans EARTH, EPOCH et un objet local passé en arguments

*haute · reference_unique · verdict : **confirme***  
`API_BILAN/data/dico.js:47, dico.js:185-189, dico.js:299-301, API_BILAN/data/initDATA.js:105-120, API_BILAN/physics/physics.js:591-602, API_BILAN/albedo/calculations_albedo.js:268-279, calculations_albedo.js:298-299, API_BILAN/physics/meridien.js:122, meridien.js:140-141, API_BILAN/physics/calottes.js:247`

**Constat.** KEYS['🪩🍰'] = ['🪩🍰❄️','🪩🍰🧊','🪩🍰🏊'] fait créer par initDATA un DATA['🪩🍰'] à 0.0. Aucun fichier ne l'écrit ni ne le lit : grep « DATA['🪩🍰'] » ne trouve rien dans API_BILAN ni dans CO2/static. Les valeurs utilisées sont EARTH['🪩🍰'] (0,85 / 0,70 / 0,50), surchargées par EPOCH['🪩🍰'], plafonnées par EPOCH['🌫️❄️'] et fusionnées dans l'objet local albedo_coeff de calculateAlbedo. Elles passent ensuite en arguments à MERIDIEN.resoudre (albedoNeige ; albedoFonte = {neige: 🪩🍰🧊, glace: 🪩🍰🏊}), puis de là aux calottes (absorbe, bilanPoint).

**Effet.** Aucun écart de calcul, puisqu'une seule chaîne transporte la valeur. Mais la clé DATA documentée (dico, FORM « EARTH défaut 0.85 ») vaut 0 pendant tout le calcul. Et l'albédo de la neige de l'époque, après le plafond 🌫️❄️, n'existe que dans une variable locale.

**Correction proposée.** calculateAlbedo écrit une fois par pas la fusion EARTH ⊕ EPOCH ⊕ 🌫️❄️ dans DATA['🪩🍰']. MERIDIEN.resoudre et la suite de calculateAlbedo lisent DATA['🪩🍰']['🪩🍰❄️' | '🪩🍰🧊' | '🪩🍰🏊'] ; les arguments albedoNeige et albedoFonte disparaissent.

**Vérification.** Lu : dico.js:47 (KEYS, trois clés), initDATA.js:105-120 (crée 0.0). Au grep de API_BILAN et CO2/static, aucun écrivain ni lecteur de DATA['🪩🍰'] ; seules existent EARTH['🪩🍰'] (physics.js:591) et EPOCH['🪩🍰'] (configTimeline.js:214). La fusion locale albedo_coeff, avec le plafond 🌫️❄️, est faite en calculations_albedo.js:268-279. Elle passe par les arguments de MERIDIEN.resoudre (calculations_albedo.js:298-299 ; meridien.js:122, 140-141, 162), puis par absorbe jusqu'à calottes.js:247. Le FORM du dico (dico.js:299-301) annonce des défauts EARTH, alors que la clé DATA vaut 0. Précision : albedo_coeff porte aussi 🌊 (Fresnel), 🌍, 🏜️, 🌳 et 🎾, lus par albedoLibre et par le mélange planétaire (l.752-756). La clé DATA ne déclare que 3 des 8 matériaux réellement utilisés.

**Correction amendée.** calculateAlbedo écrit une fois par pas, dans DATA['🪩🍰'], la fusion EARTH ⊕ EPOCH ⊕ plafond 🌫️❄️ de TOUS les matériaux (❄️, 🧊, 🏊, 🌊, 🌍, 🏜️, 🌳, 🎾). KEYS['🪩🍰'] et le dico les déclarent tous. MERIDIEN.resoudre, la suite de calculateAlbedo et les calottes lisent DATA['🪩🍰'][…] ; les arguments albedoNeige, albedoFonte et l'objet local albedo_coeff disparaissent.

#### 10. Gravité 🍎 : posée à 9,81 m/s² alors que la masse et le rayon du moteur donnent 9,820 ; trois chemins de lecture et deux littéraux

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/config/configTimeline.js:1500 (et chaque époque), API_BILAN/physics/calottes.js:151, calottes.js:345, API_BILAN/physics/saisons.js:89, API_BILAN/radiative/calculations.js:71, radiative/calculations.js:229, API_BILAN/physics/physics.js:724, physics.js:739, API_BILAN/atmosphere/calculations_atm.js:278, API_BILAN/radiative/solaire.js:166, API_BILAN/physics/physics.js:100, API_BILAN/geology/interieur.js:39, interieur.js:196-202, CO2/scripts/paleogeo/paleodem_zones.py:33-35`

**Constat.** 🍎 n'est pas une clé de DATA ; on la lit par trois chemins. DATA['📅']['🍎'] pour les calottes, saisons et le profil ; EPOCH['🍎'] pour eauSansLiquide et pressureAtZ ; TIMELINE[👉]['🍎'] pour computeH2OScaleHeight et computePWV. Ces chemins divergent dès que DATA['📅'] est une copie. La valeur posée est 9,81. Or INTERIEUR.CONST.M_TERRE = 5,9722e24 kg et 📐 = 6 371 km donnent G M/R² = 9,820 (G = 6,6743e-11). De plus 📜📐 varie avec 🌡️🌕 (rayonKm : dilatation et gonflement de fusion) sans que 🍎 bouge. solaire.js:166 ajoute deux littéraux : 9,80665 (g standard) et 0,02897 (M_air de référence), alors que CONV.molar_mass_air_ref vaut 0,029. Côté Python, paleodem_zones.py prend g et R dans l'entrée 📱 de la config (9,81 et 6 371), quand le moteur prend 📜📐 = rayonKm.

**Effet.** 0,1 % sur g : h₀ de Nye ∝ g^−½ (−0,05 %), p_s/g pour la colonne d'air, τ_b ∝ 1/g. L'écart est faible, mais une grandeur a deux valeurs et le lien physique g(R) est rompu : sur l'océan de magma, R gonfle de quelques % et g ne bouge pas.

**Correction proposée.** Une seule référence lue dans DATA : par exemple un accesseur DATA['📜']['🍎'] = G·M/(📐·1000)², avec G et M dans CONST (masse déclarée par époque si elle diffère, ⚫). À défaut, un accesseur unique sur EPOCH['🍎'], mais un seul chemin de lecture. Dans solaire.js, nommer 9,80665 et 0,02897 comme l'état de référence de la paramétrisation (une constante CONV chacune) et aligner CONV.molar_mass_air_ref sur la même valeur.

**Vérification.** La partie référence unique est confirmée. Chemins relus : DATA['📅']['🍎'] (calottes.js:151 et 345, saisons.js:89, calculations.js:229, calculations_atm.js:40 et 49, solaire.js:166 et 182, physics.js:720-724) ; TIMELINE[👉]['🍎'] (calculations_atm.js:265 et 278, physics.js:739, calculations.js:71). eauSansLiquide lit en fait DATA['📅'] (physics.js:720, EP = DATA['📅']), pas EPOCH. Les littéraux 9,80665 et 0,02897 sont bien à solaire.js:166. paleodem_zones.py:33-35 prend g et R dans l'entrée 📱, alors que le moteur prend 📜📐 = rayonKm (interieur.js:196-202). Sur 🏔/🦣, la copie porte la même valeur de 🍎 (seule 🌡️🧮 est interpolée) : chemins distincts, valeurs égales aujourd'hui. La partie VALEUR est RÉFUTÉE. G M/R² = 6,6743e-11 × 5,9722e24 / 6,371e6² = 9,820 (refait) est la gravitation SANS rotation. La gravité effective moyenne sur la sphère vaut G M/R² − (2/3) ω² R = 9,820 − 0,0226 = 9,797 m/s². 9,81 en est à 0,13 %, plus près que 9,820 (0,23 %). Le modèle n'a pas de durée du jour : un accesseur G M/R² oublierait la force centrifuge, qui croît comme ω² dans le passé (jour plus court). Enfin, CONV.molar_mass_air_ref (0,029) n'est qu'un repli sans atmosphère (calculations_atm.js:123, h2o:584). Ce n'est pas la M_air de référence de solaire.js.

**Correction amendée.** Un seul chemin de lecture de 🍎, dans DATA (par exemple un accesseur DATA['📜']['🍎']), lu aussi par paleodem_zones.py sur la même définition (rayon de la config à T₀ cohérent avec rayonKm). Si g est dérivé, prendre g = G M/R² − (2/3) ω² R, avec M et la période de rotation déclarées par époque ; sinon garder 🍎 posé par époque, mais lu par un seul accesseur. Dans solaire.js, nommer 9,80665 et 0,02897 comme l'état de référence de la paramétrisation de Rayleigh (deux constantes CONV dédiées). Ne pas les aligner sur CONV.molar_mass_air_ref, qui est une autre grandeur.

#### 11. Point de gel de la partition de l'eau : 271,15 − (P−1) et 273,15 dans la même formule de transition

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/h2o/calculations_h2o.js:299, calculations_h2o.js:322-329, API_BILAN/physics/physics.js:449, physics.js:452, physics.js:775`

**Constat.** La fenêtre de transition est ]T_gel_ajusté − 20 ; T_gel_ajusté[, avec T_gel_ajusté = EARTH.T_FREEZE_SEAWATER_K − (P − 1) × 1.0. Ce 1.0 est un littéral, alors que EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1 existe et sert déjà à physics.js:775. Le facteur de transition, lui, vaut (T − (CONST.T0_WATER − 20))/20 : son origine est à 273,15 K au lieu de 271,15 − (P−1). À 1 atm, la fenêtre est ]251,15 ; 271,15[, et le facteur vaut −0,1 à son bord bas et 0,9 à son bord haut.

**Effet.** Entre 251,15 et 253,15 K, ice_to_liquid = glace × (1 − facteur) dépasse la glace : la glace devient négative, puis la normalisation la borne à 0. Toute l'eau y passe donc liquide sous −20 °C. Juste sous le point de gel, 10 % de la glace fond d'un coup, le facteur sautant à 0,9 au lieu de 1. Les lecteurs de 🍰💧🧊 et 🍰💧🌊 sont peu nombreux (finding précédent sur 🍰💧🧊) : effet sur la courbe probablement faible, mais la formule est fausse.

**Correction proposée.** Une seule température de gel : T_gel_ajusté = EARTH.T_FREEZE_SEAWATER_K − (🎈 − 1) · EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM, déjà calculée dans getWaterCycleTempBoundsFromPressure, à utiliser pour la fenêtre ET pour l'origine du facteur. Ou supprimer la rampe si 🍰💧🧊 est réécrite depuis les calottes, comme proposé plus haut.

**Vérification.** Lu : h2o:299 utilise le littéral 1.0, alors que physics.js:452 (EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1) est utilisé à physics.js:775. h2o:322-329 : facteur = (T − (CONST.T0_WATER − 20))/20, d'origine 253,15 K. À 1 atm, la fenêtre est ]251,15 ; 271,15[ et le facteur va de −0,1 à 0,9 : confirmé. Entre 251,15 et 253,15 K, glace × facteur < 0. La normalisation (l.349-367) la ramène à 0 par Math.max, puis réduit le liquide : toute l'eau passe liquide. Juste sous le gel, 10 % de la glace fond d'un coup. Précisions : (a) 🍰💧🧊 et 🍰💧🌊 n'ont aucun lecteur physique (cf. constat 3). L'effet sur la courbe est nul, l'affichage seul est faux. (b) La même formule met TOUTE l'eau en glace dès que T̄ passe sous 271,15 K (h2o:308-311), autre aberration du même bloc.

**Correction amendée.** Préférer la seconde option : supprimer la rampe et la branche « tout glace » de calculateWaterPartition. 🍰💧🧊 et 🍰💧🌊 sont réécrites depuis la masse des calottes et la glace de mer (constat 3). Si la rampe restait, T_gel = EARTH.T_FREEZE_SEAWATER_K − (🎈 − 1) · EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM, lu dans getWaterCycleTempBoundsFromPressure, serait l'origine de la fenêtre ET du facteur.

#### 12. Constantes physiques à deux valeurs, écarts inférieurs à 1e-3 : R, l'année, les masses molaires, la constante solaire, ⟨P₂⟩ polaire, M_air de référence

*haute · valeur_double · verdict : **confirme***  
`API_BILAN/physics/physics.js:44, API_BILAN/geology/interieur.js:36, interieur.js:35, API_BILAN/physics/orbite.js:27-28, API_BILAN/physics/calottes.js:356, calottes.js:369, API_BILAN/physics/saisons.js:93-94, CO2/scripts/quaternaire/epica_etats.py:20, API_BILAN/physics/physics.js:45-48, physics.js:40, physics.js:98, physics.js:200, CO2/static/astronomie.js:24, API_BILAN/convergence/compute.js:165, API_BILAN/physics/meridien.js:43-45, meridien.js:127, API_BILAN/physics/physics.js:150, physics.js:608, physics.js:100, API_BILAN/radiative/solaire.js:166`

**Constat.** • R : CONST.R_GAS = 8,314 ; INTERIEUR.CONST.R_GAZ = 8,314462618 (CODATA). Écart 5,6e-5.
• Année : INTERIEUR.SEC_PAR_AN = 3,15576e7 s (julienne) ; ORBITE.JOURS_AN × CONV.SECONDS_PER_DAY = 3,1556926e7 s (tropique), employée par les calottes (τ_b, P − E) et par saisons (ω). Écart 2,1e-5. orbite.js:28 réécrit 86 400 en littéral.
• Masses molaires : epica_etats.py prend 28,0134e-3 (N₂), 31,9988e-3 (O₂), 44,0095e-3 (CO₂), 16,0425e-3 (CH₄) ; CONST prend 0,02801, 0,03200, 0,04401, 0,01604. Écart jusqu'à 1,6e-4 (CH₄) : les ⚖️🏭 et ⚖️🐄 des 🔁 de 🦣 sont écrits avec les unes et relus en ppm avec les autres.
• Constante solaire : 1 361 sous trois noms (CONST.SOLAR_CONSTANT, EARTH.SOLAR_CONSTANT_REF_W_PER_M2, astronomie.SOLAR_CONSTANT) ; mais 3,828e26/(4π·CONV.AU_M²) = 1 361,13, la valeur de DATA['☀️']['🧲☀️'] aujourd'hui. Écart 9,4e-5. meridien.echelle = 🧲☀️/1 361 mêle les deux.
• ⟨P₂⟩ polaire : MERIDIEN.P2_MOYEN calculé = 0,80801 ; le littéral 0,8078 sert dans STATE.dTzones initial (physics.js:608) et figure dans les commentaires (meridien.js:43, physics.js:150). Écart 2,5e-4.
• M_air de référence : CONV.molar_mass_air_ref = 0,029 ; solaire.js:166 prend 0,02897. Écart 1e-3.

**Effet.** Négligeable numériquement : moins de 0,01 K attendu sur chaque grandeur, et 0,006 K sur dT_pol initial, sous la tolérance de 0,01 K. Mais chaque fois une grandeur porte deux valeurs, et elles dériveront au premier changement de l'une seule.

**Correction proposée.** Une valeur par grandeur. CONST.R_GAS = 8,314462618, lu par INTERIEUR. Une seule année (CONST, julienne ou tropique, choix à déclarer), dont ORBITE.JOURS_AN et SEC_PAR_AN dérivent. epica_etats.py lit CONST.M_* dans physics.js par regex, comme le fait paleodem_zones.py. Une seule constante solaire, de préférence la luminosité actuelle de Gough / (4π UA²), que lisent EARTH et astronomie.js (ordre de chargement à vérifier). STATE.dTzones initial calculé avec MERIDIEN.P2_MOYEN. Une seule M_air de référence.

**Vérification.** Tout recalculé. R : (8,314462618 − 8,314)/8,314 = 5,6e-5. Année : 3,15576e7 contre 365,2422 × 86 400 = 3,1556926e7, écart 2,1e-5 ; orbite.js:28 réécrit bien 86 400. CH₄ : 16,0425/16,04 = 1 + 1,6e-4, impact d'environ 0,03 ppm sur 280 ppm à l'aller-retour. Constante solaire : 3,828e26/(4π × 1,496e11²) = 1 361,13, écart 9,6e-5. ⟨P₂⟩ du pôle : 0,108253/0,133975 = 0,80801 contre 0,8078 (physics.js:608), soit 28 × 2,1e-4 = 0,006 K. M_air : 0,029/0,02897 = 1 + 1,0e-3. Précisions : (a) L'année julienne et l'année tropique sont deux grandeurs distinctes, toutes deux légitimes. ω des saisons et P − E par an demandent l'année tropique. Un âge en années se compte en années juliennes (convention UAI). Il faut deux constantes nommées, pas une seule. (b) Dans meridien, echelle = 🧲☀️/1 361 et J sont calculés avec le même 1 361, qui s'annule : il n'y a pas d'erreur. (c) CONV.molar_mass_air_ref est le repli de ⚫, pas la M_air de référence de solaire.js.

**Correction amendée.** Une valeur par grandeur : CONST.R_GAS = 8,314462618, lu par INTERIEUR. Deux constantes d'année déclarées dans CONST (tropique pour le cycle annuel, julienne pour les âges), dont ORBITE.JOURS_AN, SECONDES_PAS et SEC_PAR_AN dérivent. epica_etats.py lit CONST.M_* par regex. Une seule constante solaire, L☉ / (4π UA²), lue par EARTH et astronomie.js (vérifier l'ordre de chargement). STATE.dTzones initial calculé avec MERIDIEN.P2_MOYEN. La M_air de référence de solaire.js reste une constante à part, nommée, distincte du repli de ⚫.

#### 13. Âge, date et origine des âges : un âge confondu avec une date, trois origines, deux dates pour la base de l'Holocène

*haute · unites_signe · verdict : **confirme***  
`API_BILAN/convergence/compute.js:178, compute.js:181, API_BILAN/convergence/clics.js:127-132, API_BILAN/geology/interieur.js:34, interieur.js:161-169, CO2/static/histoire/litterature.js:2413, CO2/static/astronomie.js:25, CO2/scripts/quaternaire/epica_etats.py:4, epica_etats.py:23-25, API_BILAN/config/configTimeline.js:1319, configTimeline.js:1428`

**Constat.** (a) getSoleil passe CLICS.date() à goughLuminosity(t_ago_years), qui attend un âge ; la ligne suivante passe bien INTERIEUR.ageCourant à facteurSoleil. Sur 🛖, 🚂 et 📱, dont les dates sont calendaires, le Soleil est donc pris à « −9 700 … 2 300 années avant » au lieu de 11 725 … −275 ; pour 🛖, cela tombe dans le futur. (b) Le « présent » 2025 existe sous deux noms : INTERIEUR.CONST.AN_PRESENT et L.AN de litterature.js. astronomie.js prend AN_REFERENCE = 1950. epica_etats.py écrit 75 (= 2025 − 1950) en littéral, et nomme age_b2k (avant 2000) une grandeur qui est un âge avant 2025 : a = age_b2k − 75 donne bien un âge BP. (c) La base de l'Holocène a deux valeurs : 🦣 ◀ = 11,7e3, commentée « 11 700 ans b2k » mais lue par ageDe comme 11 700 ans avant 2025 ; et 🛖 ▶ = −9 700, soit 11 725 ans avant 2025. Écart : 25 ans.

**Effet.** (a) 2e-6 au plus sur L☉ : négligeable, mais un âge et une date sont confondus dans la même fonction. (c) 25 ans de trou entre 🦣 et 🛖 pour la frise, l'orbite et Histoire.

**Correction proposée.** Appeler goughLuminosity(INTERIEUR.ageCourant(DATA)) ; mieux, faire de l'âge courant un accesseur unique de DATA['📜'] (voir le finding sur les copies). Une seule origine, INTERIEUR.CONST.AN_PRESENT, lue par litterature.js et par epica_etats.py (regex). Calculer 75 comme AN_PRESENT − AN_REFERENCE et renommer age_b2k. Prendre 🦣 ◀ égal à l'âge de 🛖 ▶ : une seule date, l'autre en dérive.

**Vérification.** (a) Lu : compute.js:178 appelle goughLuminosity(CLICS.date()). CLICS.date (clics.js:127-132) rend l'année CALENDAIRE sur 🛖/🚂/📱, alors que compute.js:181 passe bien ageCourant à facteurSoleil. Sur 🛖, t_ago = −9 700 : une luminosité du futur. L'écart sur L est ≤ 0,4 × 1,2e4/4,57e9 ≈ 1e-6, négligeable. (b) INTERIEUR.CONST.AN_PRESENT (interieur.js:34) et L.AN (litterature.js:2413) valent tous deux 2025. epica_etats.py:23-25 calcule a = age_b2k − 75, mais l'argument reçu est un âge avant 2025 : le nom est faux, le calcul juste. AN_REFERENCE = 1950 (astronomie.js:25) est une autre grandeur (origine des tables), légitime. (c) Ce n'est pas un TROU mais un CHEVAUCHEMENT de 25 ans : 🦣 finit à l'âge 11 700 avant 2025, et 🛖 commence à l'âge 2025 + 9 700 = 11 725. C'est 🦣 ◀ qui est faux : l'ICS donne 11 700 b2k = 11 725 avant 2025 = −9 700 calendaire. Le commentaire « 11 700 ans b2k » a été lu par ageDe comme un âge avant 2025. 🛖 ▶ est juste.

**Correction amendée.** goughLuminosity(INTERIEUR.ageCourant(DATA)), l'âge courant devenant un accesseur unique de DATA['📜']. Une seule origine, INTERIEUR.CONST.AN_PRESENT, lue par litterature.js et par epica_etats.py (regex). Le 75 devient AN_PRESENT − AN_REFERENCE ; renommer age_b2k en age (avant 2025). 🦣 ◀ = 11 725, ou mieux une valeur dérivée de 🛖 ▶ par ageDe, pour n'avoir qu'une date.

#### 14. Viscosité du manteau : 1e21 Pa·s constante pour le rebond, η(T) d'Arrhenius pour l'intérieur — même matériau, deux lois

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/physics/calottes.js:85-87, calottes.js:386-390, API_BILAN/geology/interieur.js:65-73, interieur.js:100-104, API_BILAN/data/episteme.js:102`

**Constat.** Les calottes prennent η = 1e21 Pa·s constant : une mesure posée, celle d'aujourd'hui (Fennoscandie, Mitrovica 1996). Le même manteau a dans INTERIEUR une viscosité d'Arrhenius η ∝ exp(E/RT), E = 300 kJ/mol, rapportée à T₀ = 1 350 °C, qui fixe la perte de chaleur Q(T). Le moteur a donc une viscosité qui dépend de 🌡️🌕 et une autre qui n'en dépend pas.

**Effet.** τ_b ∝ η. Avec la loi de l'intérieur : +30 K sur 🌡️🌕 donne η/1,5, +100 K donne η/3,6 (exp(E/R·(1/T₀ − 1/T))). Sur le Quaternaire, il n'y a d'effet que si le 🌡️🌕 actuel du moteur diffère de T₀, ce que je ne peux pas savoir par lecture. Sur 🍄 et avant, le rebond serait plus rapide que posé, donc moins de socle resté bas sous une calotte qui fond.

**Correction proposée.** Une seule loi : η(🌡️🌕) = η_mes · exp(E/R · (1/🌡️🌕 − 1/🌡️🌕_mes)), avec E = INTERIEUR.CONST.E_ACTIVATION et η_mes = 1e21 pris à la température de l'intérieur du moteur aujourd'hui. Les calottes lisent DATA['🌕']['🌡️🌕']. ⚠️ À déclarer : E est celle du fluage-diffusion de l'olivine sèche, alors que le rebond sonde aussi le manteau inférieur.

**Vérification.** Lu : calottes.js:85-87 (1e21 constant) et :390 (τ_b ∝ η). interieur.js:65-73 et :100-104 : Q = Q₀ (ΔT/ΔT₀)^(1+β) exp(βE/R(1/T₀ − 1/T)), qui équivaut à η ∝ exp(E/R(1/T − 1/T₀)) puisque Nu ∝ Ra^β et Ra ∝ 1/η. Recalcul avec E/R = 36 083 K et T₀ = 1 623,15 K : +30 K donne η/1,50, +100 K donne η/3,63. episteme.js:102 déclare « η constante dans le temps » en ❔ : l'approximation est déclarée, mais deux lois coexistent. La correction proposée est fausse sur un point. Prendre « le 🌡️🌕 du moteur aujourd'hui » comme référence forcerait η = 1e21 au présent quel que soit l'état du modèle : un calage sur la mesure. Or η = 1e21 (Mitrovica) et Q₀ = 46 TW sont deux mesures du MÊME état réel, la Terre actuelle à T₀ = 1 350 °C (interieur.js:72). puissanceConvective(T₀) vaut exactement 46 TW.

**Correction amendée.** η(🌡️🌕) = η_mes · exp(E/R · (1/🌡️🌕 − 1/T₀)), avec E = INTERIEUR.CONST.E_ACTIVATION, R = INTERIEUR.CONST.R_GAZ et T₀ = INTERIEUR.CONST.T0. C'est la température MESURÉE à laquelle η_mes = 1e21 et Q₀ = 46 TW sont tous deux posés, pas la température du modèle aujourd'hui. Les calottes lisent DATA['🌕']['🌡️🌕']. Si le 🌡️🌕 du moteur aujourd'hui diffère de T₀, la viscosité du Quaternaire diffère de 1e21 : c'est un résultat, à mesurer après. ⚠️ À déclarer : E est celle du fluage-diffusion de l'olivine sèche, alors que le rebond sonde aussi le manteau inférieur.

#### 15. Cycle annuel des terres : amplitude et retard posés (lus) et calculés (diagnostic)

*moyenne · valeur_double · déjà connu · verdict : **confirme***  
`API_BILAN/physics/meridien.js:145-154, API_BILAN/physics/physics.js:162-185, physics.js:248-256, API_BILAN/physics/saisons.js:20-25, saisons.js:132`

**Constat.** L'amplitude et le retard du cycle annuel des terres existent deux fois. Posés : EARTH.SEASONAL_AMP_POL/MID/TROP_K × sin ε / sin ε_ref, et EARTH.RETARD_SAISONS_JOURS = 30 j ; c'est cette version que lisent les calottes et la glace saisonnière. Calculés : SAISONS.cycles, en diagnostic seulement (retard de 21 à 38 j sur les terres, de 79 à 93 j sur la mer, selon physics.js:255). Les trois en-têtes le déclarent ⚠️.

**Effet.** Connu : une fois branché, le premier clic 🐾 bascule en boule de neige (pôle trop chaud, hautes terres de N_mid).

**Correction proposée.** À terme, une seule source : SAISONS.cycles, publiée dans DATA et lue par les calottes et par facteurGlaceZones. Supprimer EARTH.SEASONAL_AMP_* et RETARD_SAISONS_JOURS.

**Vérification.** Déjà connu, faits relus. meridien.js:145-154 : a1 = amplitude de zone posée (EARTH.SEASONAL_AMP_* × sin ε/sin ε_ref) et d1 = EARTH.RETARD_SAISONS_JOURS. physics.js:162-185 et 248-256 : valeurs posées, avec le retard calculé de 21–38 j cité. saisons.js:20-25 et :132 : cycle calculé. SAISONS.cycles n'est appelé qu'à meridien.js:180, en diagnostic après convergence. Les trois en-têtes le déclarent ⚠️.

#### 16. Glace vue par le bilan méridien (e_z par zone) et glace de l'albédo planétaire (ice_tf, mer gelée globale, instantané) : deux couvertures pour un même état

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/physics/meridien.js:152, meridien.js:160-162, API_BILAN/physics/physics.js:358-383, API_BILAN/albedo/calculations_albedo.js:440-455, calculations_albedo.js:507-523, calculations_albedo.js:638-668`

**Constat.** Le co-albédo de zone du bilan méridien prend la glace saisonnière e_z, part d'ÉNERGIE englacée par zone (facteurGlaceZones), plus les calottes parZone. Il n'y a là ni rampe de mer gelée ni mélange. L'albédo planétaire 🍰🪩📿, qui fixe T̄, prend une autre glace. Il part de ice_tf, part de TEMPS du même facteurGlaceZones, mélangée à l'instantané (tauGlaceAns). S'y ajoute la mer gelée seaIceFrac, rampe GLOBALE de DATA['🎚️'].HYSTERESIS.seaIceTransitionRangeK (2,2 K) appliquée à T̄, puis les calottes.

**Effet.** Écart inconnu par lecture. Près du gel et en boule de neige, seaIceFrac (globale, 2,2 K) n'a pas d'équivalent dans le méridien : T₂ est calculé avec moins de glace aux pôles que l'albédo qui fixe T̄.

**Correction proposée.** Une couverture de glace par zone, calculée une fois dans meridien.js et publiée dans DATA. L'albédo planétaire en devient la moyenne pondérée par les aires des zones ; plus de glace 0D parallèle.

**Vérification.** Lu : meridien.js:152-162, Rg = c·α_neige + (1 − c)(e·α_glace + (1 − e)·α_libre), avec e = part d'ÉNERGIE de fractionGelee (physics.js:384-394). calculations_albedo.js:440-455 : seaIceFrac = rampe GLOBALE sur T̄, largeur DATA['🎚️'].HYSTERESIS.seaIceTransitionRangeK = 2,2 K (initDATA.js:87). L.507-523 : ice_tf, une rampe linéaire de TEMPS distincte de fractionGelee.temps, mélangée au snapshot. Cette glace est pondérée par r_ens (l.757), puis ajoutée aux calottes (l.638-668). Il y a donc deux couvertures et deux pondérations ; seaIceFrac n'a aucun équivalent zonal. Écart inconnu par lecture. La correction proposée est incomplète : la moyenne « pondérée par les aires des zones » ne donne pas l'albédo planétaire. Il faut pondérer par l'énergie reçue, puisque l'insolation annuelle diffère d'un facteur ~2 entre tropiques et pôles.

**Correction amendée.** Une couverture de glace par zone, calculée une fois dans meridien.js (glace saisonnière de terre et de mer, calottes) et publiée dans DATA. L'albédo planétaire au sommet devient 1 − Σ_z f_z I_z coA_z / Σ_z f_z I_z, avec f_z l'aire et I_z l'insolation annuelle de la zone. Les co-albédos coA_z, nuages compris, sont déjà calculés par le méridien. Plus de glace 0D parallèle (ice_tf, seaIceFrac globale, snapshot).

#### 17. Même valeur sous plusieurs noms : eau, 0 °C, c_p, Soleil, obliquité, présent, âge maximal des cartes, ρ glace, masses recopiées

*moyenne · reference_unique · verdict : **confirme***  
`API_BILAN/physics/physics.js:50, physics.js:518, physics.js:71, physics.js:81, physics.js:540, API_BILAN/albedo/calculations_albedo.js:181-189, calculations_albedo.js:369, calculations_albedo.js:543, API_BILAN/physics/physics.js:65, physics.js:574, physics.js:40, physics.js:200, CO2/static/astronomie.js:24, API_BILAN/convergence/compute.js:165, API_BILAN/config/configTimeline.js:1499, API_BILAN/geology/calculations_geology.js:42, API_BILAN/physics/physics.js:193, API_BILAN/config/configTimeline.js:1998, API_BILAN/geology/interieur.js:34, CO2/static/histoire/litterature.js:2413, API_BILAN/physics/calottes.js:81, calottes.js:111, API_BILAN/physics/physics.js:519, CO2/scripts/quaternaire/epica_etats.py:21, API_BILAN/geology/interieur.js:74`

**Constat.** • Eau liquide 1 000 : CONST.RHO_WATER et EARTH.NUAGES.RHO_LIQUIDE.
• 273,15 K : CONST.T0_WATER, CONST.KELVIN_TO_CELSIUS, EARTH.NUAGES.T_TOUT_LIQUIDE, plus les littéraux 263,15 / 268,15 / 273,15 de Briegleb (calculations_albedo.js:181-189), 288,15 (l. 543) et « − 273.15 » (l. 369).
• c_p de l'air 1 005 : CONST.CP_AIR (« sec ») et EARTH.CP_AIR_MOIST_J_KG_K (« humide », même valeur), alors que le profil prend c_p(T) de JANAF.
• Constante solaire 1 361 sous trois noms ; L☉ = 3,828e26 trois fois (GOUGH_L_SUN_W, EPOCH['📱']['🔋☀️'], littéral de calculations_geology.js:42). Chaque époque porte en plus un 🔋☀️, sortie de Gough précalculée à ▶ (« NE PAS MODIFIER »), alors que getSoleil la calcule à la date.
• Obliquité 23,44 : EARTH.OBLIQUITY_DEG_REF et CONFIG_COMPUTE.obliquityDeg.
• Présent 2025 : INTERIEUR.CONST.AN_PRESENT et litterature L.AN.
• CALOTTES.K.AGE_MAX_CARTES_MA = 540 recopie le dernier PALEOGEO.ages_Ma : si la table est régénérée sur une autre plage, le seuil reste.
• ρ glace 917 est rangée dans EARTH.NUAGES, mais lue pour la calotte continentale (calottes.js) et la glace de mer (saisons.js) : bonne valeur, mauvais tiroir.
• epica_etats.py recopie N2_KG = 3,878e18 et O2_KG = 1,0815e18 depuis la config (N2_1PAL_KG, ⚖️🫁 de 🦣), alors que paleodem_zones.py lit la config par regex.
• T_S0 = 14,4 °C (interieur.js:74) est la valeur 🎯 de 2000 du banc : même nombre, et une cible qui entre dans un calcul (à examiner comme cible circulaire, hors du sujet de cet audit).

**Effet.** Aucun écart aujourd'hui ; dérive dès qu'on change une seule des copies.

**Correction proposée.** Une constante par grandeur ; les autres sont supprimées ou deviennent des accesseurs. Remplacer les littéraux (263,15 = CONST.T0_WATER − 10, etc.). AGE_MAX_CARTES_MA = dernier élément de PALEOGEO.ages_Ma. Retirer 🔋☀️ des époques. epica_etats.py lit la config par regex. Sortir RHO_GLACE de NUAGES vers CONST, à côté de L_FUSION_GLACE, CP_GLACE et K_GLACE (glace Ih).

**Vérification.** Tout relu : CONST.RHO_WATER (physics.js:50) et NUAGES.RHO_LIQUIDE (physics.js:518). T0_WATER, KELVIN_TO_CELSIUS et NUAGES.T_TOUT_LIQUIDE. Littéraux de Briegleb à calculations_albedo.js:181-189. CP_AIR et CP_AIR_MOIST, tous deux à 1 005. Constante solaire sous trois noms. 3,828e26 dans compute.js:165, dans 📱/🚂/🛖 et en littéral à calculations_geology.js:42. 23,44 sous deux noms. AN_PRESENT et L.AN. AGE_MAX_CARTES_MA = 540 (calottes.js:81). ρ_glace rangée dans NUAGES mais lue par calottes.js et saisons.js. N2_KG = N2_1PAL_KG (configTimeline.js:172) et O2_KG = 1,0815e18 recopiés dans epica_etats.py:21. T_S0 = 14,4 °C (interieur.js:74). Précisions : KELVIN_TO_CELSIUS est déjà un alias (= CONST.T0_WATER, physics.js:79), donc un second NOM, pas une seconde valeur. 288,15 (l.543) vaut 15 °C écrit en K ; le 273,15 y est caché. Les « − 273.15 » des l.368-369, 485 et 738-740 sont des logs ou diagnostics. 19 époques portent un 🔋☀️, dont le seul lecteur est calculations_geology.js:42 (solar_intensity). Celui de ☃ (l.576) n'est même pas Gough à ▶.

**Correction amendée.** Comme proposé. En plus : le regex de paleodem_zones.py (r'RHO_GLACE:\s*', l.29) doit suivre le déplacement de ρ_glace vers CONST. Remplacer aussi le littéral 273,15 de calculations_albedo.js:882 et le 288,15 de la l.543 par CONST.T0_WATER + 15 (ou supprimer ces formules de biomes).

#### 18. Géométrie des zones et formules réécrites plusieurs fois : bornes 30°/60°, P₂, déclinaison, insolation journalière, 73 pas, aire de bande

*moyenne · reference_unique · verdict : **confirme***  
`API_BILAN/physics/meridien.js:36-45, meridien.js:41, meridien.js:48, meridien.js:52, API_BILAN/physics/calottes.js:92-99, calottes.js:195, calottes.js:239, calottes.js:276, calottes.js:347, calottes.js:406, API_BILAN/physics/physics.js:158-160, physics.js:203-210, physics.js:217, physics.js:225, physics.js:240-242, physics.js:263, physics.js:271, physics.js:370-375, physics.js:608, API_BILAN/physics/saisons.js:62, API_BILAN/physics/orbite.js:26, CO2/static/astronomie.js:59-68, CO2/scripts/paleogeo/paleodem_zones.py:50, paleodem_zones.py:337`

**Constat.** • Bornes des zones : MERIDIEN.ZONES (x0, x1), CALOTTES.BANDES (x0, x1), EARTH.*_ZONE_FRAC, des littéraux en degrés (fractionGelee(…, 60, 90 …), zoneAnnualInsolation(0, 30)…), BANDES de paleodem_zones.py en degrés, et MILIEU (0,933 / 0,683 / 0,25), milieux en sin φ recopiés.
• P₂(x) = (3x² − 1)/2 : fonction de meridien.js:41, non exportée, réécrite en ligne trois fois dans calottes.js (l. 239, 276, 347).
• Déclinaison sin δ = sin ε sin λ, écrite quatre fois : meridien.js:52, physics.js:225, physics.js:271, saisons.js:62 ; une cinquième fois dans astronomie.js avec le λ de Kepler.
• Insolation journalière : EARTH.dailyMeanInsolation (orbite circulaire, EARTH.SOLAR_CONSTANT_REF) et astronomie.insolationJournaliere (excentrique, astronomie.SOLAR_CONSTANT) ; même formule, deux fonctions.
• 73 pas de 5 jours : ORBITE.N_PAS, N_JOURS de meridien.js, nDay deux fois dans physics.js.
• Aire de bande 2πR²Δx : calottes.js:195 (g.R tiré de geometrie) et l. 406 (rayon local).

**Effet.** Aucun écart aujourd'hui. Mais changer une borne de zone dans un seul fichier casserait, sans erreur visible, l'accord entre bilan méridien, calottes, glace saisonnière et table PaleoDEM.

**Correction proposée.** Une seule définition des zones (bornes en sin φ et aires), exportée par un module unique, par exemple MERIDIEN.ZONES. CALOTTES.BANDES en dérive par hémisphère ; EARTH.*_ZONE_FRAC et les appels en degrés la lisent ; paleodem_zones.py la lit par regex. Exporter P₂ et le réutiliser. Une seule fonction d'insolation journalière, celle d'astronomie.js, avec e = 0 pour le cas circulaire. ORBITE.N_PAS lu partout.

**Vérification.** Relu. Bornes : meridien.js:36-40, calottes.js:92-99, physics.js:158-160, appels en degrés (physics.js:203-210 et 370-375), paleodem_zones.py:50 et MILIEU l.337 (0,933 / 0,683 / 0,25 = milieux en sin φ). P₂ : défini à meridien.js:41 mais non exporté (window.MERIDIEN exporte P2_MOYEN, pas P2), réécrit à calottes.js:239, 276 et 347. Déclinaison sin δ = sin ε sin λ à meridien.js:52, physics.js:225 et 271, saisons.js:62, plus astronomie.js. Deux fonctions d'insolation journalière. 73 pas sous quatre noms (ORBITE.N_PAS à orbite.js:26, N_JOURS à meridien.js:48, nDay deux fois dans physics.js). Précision : l'aire de bande des l.195 et 406 lit le même 📐 (g.R et rayon valent DATA['📜']['📐'] × 1 000) : même valeur, deux écritures de la formule.

**Correction amendée.** Comme proposé : une définition unique des zones (bornes en sin φ, aires), exportée par MERIDIEN. CALOTTES.BANDES en dérive, EARTH.*_ZONE_FRAC et les appels en degrés la lisent, paleodem_zones.py la lit par regex. MILIEU s'en calcule. P₂ et la déclinaison sont exportés une fois. Une seule fonction d'insolation journalière (astronomie.js, e = 0 pour le cas circulaire, avec la constante solaire unique du constat 12). ORBITE.N_PAS est lu partout.

#### 19. Grandeurs physiques de la chaîne méridienne hors DATA : dT de zone porté dans window.STATE, T₂ et état d'équilibre des calottes dans _hystDiag

*moyenne · reference_unique · verdict : **confirme***  
`API_BILAN/physics/physics.js:604-608, API_BILAN/physics/meridien.js:130, meridien.js:178, meridien.js:181, API_BILAN/albedo/calculations_albedo.js:300, calculations_albedo.js:321, calculations_albedo.js:388-399, API_BILAN/physics/calottes.js:430-431, API_BILAN/ocean/sinks_ocean.js:79, CO2/static/ui/embarque.js:32-33`

**Constat.** La règle « TOUT dans DATA » n'est pas tenue dans la chaîne méridienne. Les écarts de zone dT (K), état porté d'un calcul au suivant, vivent dans window.STATE.dTzones ; computeIceTempFactor, calcGlaceEquilibre et sinks_ocean les lisent là, et MERIDIEN.resoudre y prend le départ de son point fixe. T₂, le co-albédo par zone et l'équilibre des calottes (aEq, H̄, z̄, τ, τ_b, marge, volume) ne vont que dans window._hystDiag.meridien. Les instantanés de glace sont dans STATE._ice*SnapshotPreSearch01. La température de chaque zone, grandeur centrale du bilan, n'a aucune clé DATA.

**Effet.** L'état gardé (embarque.js : JSON.stringify(DATA)) ne contient pas dT. Après une restauration, le point fixe glace ↔ gradient repart d'un autre dT, et avec la rétroaction glace-albédo il peut converger vers une autre branche. Lisibilité : T₂, au centre de l'audit du pôle trop chaud, n'a pas de nom emoji.

**Correction proposée.** Publier dans DATA les températures (ou écarts) de zone et T₂, ainsi que le volume et l'équilibre des calottes, sous des clés de l'alphabet (🌡️ par zone, à nommer avec le propriétaire). MERIDIEN.resoudre part de ces clés et les écrit ; computeIceTempFactor, calcGlaceEquilibre et sinks_ocean les lisent ; window.STATE.dTzones disparaît.

**Vérification.** Lu : physics.js:604-608 (STATE.dTzones et sa condition initiale). meridien.js:130 part de STATE.dTzones et :178 l'écrit. Lecteurs : physics.js:398 (computeIceTempFactor), calculations_albedo.js:321 (calcGlaceEquilibre), sinks_ocean.js:79. T₂, coAlbedo et l'équilibre des calottes ne vont que dans window._hystDiag.meridien (calculations_albedo.js:300), que rien ne lit dans CO2/static : T₂ n'est affiché nulle part. Les snapshots sont dans STATE (l.388-399). restaurer() (scenario_hote.js:68-69) recopie DATA seul : STATE.dTzones reste celui du dernier calcul de la page, le ⚫ du démarrage. L'effet « autre branche » est PLAUSIBLE mais non démontré : 30 itérations relaxées de moitié, tolérance 0,01 K. Remarque : le départ du point fixe dépend déjà de l'histoire sans restauration, puisqu'il repart du dT du calcul précédent, quelle que soit l'époque ou l'ordre du banc.

**Correction amendée.** Comme proposé : écarts de zone (ou températures de zone), T₂, volume et équilibre des calottes publiés dans DATA sous des clés de l'alphabet (🌡️… par zone, à nommer avec le propriétaire). MERIDIEN.resoudre part de ces clés et les écrit ; window.STATE.dTzones disparaît. Le départ du point fixe est déclaré : état porté de l'époque, ou condition initiale fixe à chaque clic frise. Les snapshots STATE._ice* ne migrent pas dans DATA : ils disparaissent avec le mélange (constat 6).

#### 20. Arguments et copies locales qui ne transportent que des clés DATA (liste par fonction, variables de travail distinguées)

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/physics/calottes.js:340-370, calottes.js:109, calottes.js:217, calottes.js:313-314, calottes.js:447-466, API_BILAN/physics/meridien.js:122-133, meridien.js:157, meridien.js:180, API_BILAN/physics/saisons.js:84-95, API_BILAN/physics/physics.js:330, physics.js:397-405, API_BILAN/albedo/calculations_albedo.js:260, calculations_albedo.js:287-299, API_BILAN/geology/interieur.js:162-169, API_BILAN/convergence/compute.js:33-36, compute.js:63-66`

**Constat.** Chaque fonction a une seule appelante (grep : MERIDIEN.resoudre n'est appelé que par calculateAlbedo, CALOTTES.calculer et SAISONS.cycles que par resoudre) ; ces arguments ne font donc que relayer DATA.
• CALOTTES.calculer(T_glob, T2, saisons, absorbe, ageMa, EPOCH, depart, socle, dureeAns). Copies : T_glob ← DATA['🧮']['🧮🌡️'] ; ageMa ← INTERIEUR.ageCourant(DATA)/1e6 ; EPOCH ← TIMELINE[DATA['📜']['👉']] ; depart ← DATA['🗻']['🍰🗻🧊'] ; socle ← DATA['🗻']['🔺📏🗻🧊'] ; dureeAns ← DATA['🗻']['📅🗻🧊'] − âge courant. Dérivés : saisons, absorbe. Vraie variable de travail : T2 (itération du point fixe). Copies locales : ps ← 🎈·CONV, gr ← DATA['📅']['🍎'], rayon ← 📐·1000, eps ← M_H2O/🧪, HR ← 🎚️.H2O.H2O_SURFACE_RH_01, rhoI ← EARTH.NUAGES.RHO_GLACE (et l. 314), c.Gamma ← CONFIG_COMPUTE, c.T_glob et c.T2 en double de T_glob et T2 dans la même fonction, `an` calculé deux fois (l. 356, 369). Légitimes : a, g, L, d, e, t, h, n (sous-pas), aEq, tau.
• geographie(ageMa, EPOCH) et bilanPoint(…, absorbe, c) : mêmes copies ; Ts, latDeg et x sont des variables de travail par point. geometrie lit DATA directement, c'est le bon exemple.
• MERIDIEN.resoudre(T_K, EPOCH, colonne, albedoLibre, albedoGlace, albedoNeige, albedoFonte, calottesDepart, socleDepart, dureeAns). Copies : T_K, EPOCH, calottesDepart, socleDepart, dureeAns. albedoNeige et albedoFonte n'existent que hors DATA (finding albédos). ageMa est recalculé (l. 133) tout en étant aussi transmis. dT et T2 sont des variables de travail légitimes.
• SAISONS.cycles(T_K, dT, coAlbedo, EPOCH, ageMa) : copies, sauf coAlbedo (dérivé) ; dT est l'objet que resoudre vient d'écrire dans STATE.
• EARTH.facteurGlaceZones(T, EPOCH, dT), computeIceTempFactor(T, EPOCH), obliquiteCourante(EPOCH) : EPOCH et T recopiés ; dT légitime dans la boucle de resoudre.
• calculateAlbedo : alias local EPOCH, dureeCalottes, ocGeo ← EPOCH['🗻'] (au lieu de DATA['🗻']).
• INTERIEUR.ageCourant(DATA), CALOTTES.depuisConfig(DATA) et engager(DATA) reçoivent window.DATA en argument ; l'âge courant est recalculé cinq fois par pas (compute 103 et 181, meridien 133, albédo 296, engager 465).
• getMasses retrouve l'époque par 🗿, getEpochDateConfig par 👉.

**Effet.** Aucun écart aujourd'hui, puisque chaque fonction n'a qu'une appelante. Mais un banc ou une page qui appellerait CALOTTES.calculer avec un ageMa différent de l'âge courant mêlerait l'orbite et PALEOGEO d'une date avec 📐, 🍎, 🎈, 🧪 et 🔋☀️ d'une autre, sans erreur visible.

**Correction proposée.** Les fonctions lisent DATA directement : DATA['🧮']['🧮🌡️'], DATA['🗻'][…], DATA['📜']['⚾'], TIMELINE[DATA['📜']['👉']]. L'âge courant devient un accesseur non énumérable de DATA['📜'], comme window.infoTimeMa, pour ne pas retomber dans la copie périmée 📜📅 retirée en clics.js v1.3.2. Ne restent en arguments que les vraies variables de travail : T2 et dT (point fixe), a et h (sous-pas), Ts, latDeg et x (point du bilan). Supprimer c.T_glob, c.T2 et le contexte c.

**Vérification.** Grep : MERIDIEN.resoudre n'a qu'un appel (calculations_albedo.js:298), CALOTTES.calculer aussi (meridien.js:157), SAISONS.cycles aussi (meridien.js:180). CALOTTES.geographie est aussi appelée par saisons.js:88. Les copies listées sont relues et exactes : T_glob, ageMa, EPOCH, depart, socle, dureeAns, ps, gr, rayon, eps, HR, rhoI (calottes.js:314 et 368), c.Gamma, c.T_glob et c.T2 en double de T_glob et T2 (l.347 et 353), `an` deux fois (l.356 et 369). geometrie lit DATA directement. Précisions : (a) l'argument T de computeIceTempFactor n'est pas toujours une copie. calculations_albedo.js:398 l'appelle avec T_seed, une vraie autre valeur, qui disparaît avec le constat 6. (b) ageCourant est appelé plus de cinq fois : aussi interieur.js:216 et CO2/static/texts/epochs_alt2sec.js:624. (c) Aucun écart aujourd'hui, la seule appelante de chaque fonction transmettant l'état courant : le risque reste hypothétique.

**Correction amendée.** Comme proposé : les fonctions lisent DATA directement, l'âge courant devient un accesseur non énumérable de DATA['📜'] (sur le modèle de window.infoTimeMa, clics.js:240-242), et seuls restent en arguments T2 et dT (point fixe), a et h (sous-pas), Ts, latDeg et x (point du bilan). computeIceTempFactor perd son argument T après le retrait du snapshot à la graine.

### Volet : Bilan méridien, saisons, orbite, albédo de glace

#### 21. D de North est un calage sur le T₂ qu'on vérifie : 🎯 circulaire, et statut 📡 faux

*haute · cible_circulaire · verdict : **confirme***  
`API_BILAN/physics/meridien.js:14-15, 32-35 ; API_BILAN/data/episteme.js:44-46 ; API_BILAN/doc/equation.html:587-604`

**Constat.** NCC 1981 obtiennent D en résolvant T₂ = Q·H₂/(6D+B) pour le T₂ observé (−28,0), avec le co-albédo observé a = 0,681 − 0,202 P₂ (le projet le confirme, episteme.js:46), S₂ = −0,482 et Q = 334,4 W/m² (Q et S₂ cités de mémoire, à relire dans NCC). Recalcul : H₂ = a₂ + S₂(a₀ + 2a₂/7) = −0,5024 ; D = (Q·H₂/T₂ − B)/6 = 0,652 (0,649 publié) ; à l'inverse, D = 0,649 donne T₂ = −28,08. D n'est donc pas une mesure (📡) : c'est un calage (🔧) du modèle à deux modes, fait par North sur la grandeur même que episteme.js:45 range en 🎯. La carte (equation.html:600) dit d'ailleurs que D « reproduit −28 °C » avec ce co-albédo. Les deux 🎯 (T₂, l.45, et co-albédo, l.46) sont donc un seul test : avec le co-albédo observé, le modèle rend −28 par construction. Mes J_z redonnent les chiffres de la carte : −26,93 °C à trois zones avec 0,758/0,642/0,520, et −21,23 °C avec les co-albédos du modèle 0,692/0,674/0,573. Autre point : le Q du code vaut 🧲☀️/4 = 340,25 W/m², pas 334,4 ; à ce Q, il faudrait D = 0,669 pour retrouver −28.

**Effet.** Pas d'effet numérique direct. Effet de méthode : l'écart −21,2 contre −28 vient entièrement du co-albédo et ne dit rien du transport. Tout réglage futur du transport sur ce 🎯 serait un calage.

**Correction proposée.** Déclarer D en 🔧 dans episteme.js:44 : calage de NCC sur T₂ et a(x) observés de l'hémisphère nord, avec leur Q. Marquer le 🎯 T₂ comme équivalent au 🎯 co-albédo, au lieu d'un test indépendant. Pour tester le transport, prendre une mesure qui ne sert pas à fixer D : le transport méridien total déduit du bilan au sommet (Trenberth & Caron 2001, environ 5,5 à 6 PW vers 35–40°, à relever). On le compare à F(x) = 6πR²·D·(−T₂)·x(1−x²) : 5,3 PW à x = 0,6 avec T₂ = −28, et 4,0 PW avec −21,2.

**Vérification.** Le code le dit lui-même : meridien.js:15 « D = 0,649, que North cale sur le gradient OBSERVÉ (T₂ = −28,0 °C) » et l.34 « calé par North sur T₂ observé ». Or episteme.js:44 range B et D dans une seule entrée 📡📌, et la l.45 met T₂ = −28 en 🎯. J'ai refait le calcul : H₂ = a₂ + S₂(a₀ + 2a₂/7) (car ∫₀¹P₂² = 1/5 et ∫₀¹P₂³ = 2/35) = −0,5024. D'où D = (Q·H₂/T₂ − B)/6 = 0,652 avec Q = 334,4 W/m², et T₂ = −28,08 avec D = 0,649. Avec Q = 340,25 W/m², il faudrait D = 0,669. J'ai aussi refait les J_z du code (40 sous-intervalles × 73 jours, 1361 W/m²) : J = −75,68 / 21,68 / 21,56 W/m². Ils donnent T₂ = −26,93 avec 0,758/0,642/0,520 et −21,23 avec 0,692/0,674/0,573, comme dans la carte. Nuance : le 🎯 T₂ n'est pas strictement identique au 🎯 co-albédo. C'en est une projection (Σ a_z J_z) : il découle du co-albédo, sans l'inverse. Et même avec le co-albédo observé, les trois zones donnent −26,9 et non −28 (discrétisation, Q). Il reste qu'il ne teste pas le transport. Q = 334,4 et S₂ = −0,482 sont cités de mémoire : à relire.

**Correction amendée.** Scinder episteme.js:44. B reste 📡📌 : c'est une régression de l'OLR observé. D devient 💻 (ou ❔) avec l'usage 🔧 : paramètre ajusté par NCC sur T₂ et a(x) observés, avec leur Q = 334,4. Le 🎯 T₂ est à déclarer comme une projection du 🎯 co-albédo, pas comme un test indépendant. Le test du transport par Trenberth & Caron 2001 doit se faire AVEC LE CO-ALBÉDO OBSERVÉ : F = 6πR²·D·(−T₂)·x(1−x²) ∝ D·H/(6D+B). Avec le co-albédo du modèle, F hérite de la même erreur de co-albédo que T₂ (4,0 PW contre 5,3 PW), et le test redevient un test du co-albédo.

#### 22. Les angles solaires de la zone n'agissent que sur le ciel clair : nuages et mer sont indépendants de μ₀

*haute · validite · verdict : **confirme***  
`API_BILAN/radiative/solaire.js:124-136, 222-225, 235-310, 313-370 ; API_BILAN/physics/physics.js:575-593 ; API_BILAN/physics/meridien.js:16-18, 76-107, 162-165`

**Constat.** meridien.js:16-18 annonce un co-albédo calculé « avec la distribution annuelle des angles solaires DE LA ZONE ». Dans albedoMu, μ₀ n'entre que par trois termes : Rayleigh (0,28/(1+6,43μ)), le chemin d'ozone M(μ) et la vapeur au-dessus du nuage en faisceau direct. La réflexion des nuages ne dépend pas de μ₀ : nuageVisible donne R = √3(1−g)τ/(2+√3(1−g)τ), et couche() est le deux-flux de Sagan & Pollack en éclairement diffus. L'albédo de la mer non plus : 0,066 = ∫R_F 2μ dμ, moyenne sur le disque, déclarée valeur unique pour le global (physics.js:579). J'ai refait la quadrature de quadratureMu. La moyenne de μ pondérée par l'énergie vaut 0,73 / 0,61 / 0,43 (trop / mid / pol). Avec ces poids, Fresnel donne 0,051 / 0,077 / 0,140, contre 0,066 partout dans le code. Un nuage conservatif τ = 6, g = 0,85 en δ-Eddington à faisceau direct réfléchit 0,383 / 0,432 / 0,507 (0,409 en moyenne globale), contre 0,438 partout dans le code. Hypothèse à vérifier dans le texte : L&H 1974 prennent la réflexion du nuage indépendante de μ₀ pour une moyenne globale.

**Effet.** Le contraste de co-albédo entre pôle et tropiques est sous-estimé ; c'est un mécanisme du pôle trop chaud (−21,2 au lieu de −26,9 à trois zones). Sensibilités du code : ∂T₂/∂a_z = 5J_z/(6D+B) = −63,2 / +18,1 / +18,0 K par unité de co-albédo (trop / mid / pol). Ordre de grandeur par lecture, avec nuages bas + moyens f = 0,546 et transmission 0,8 : ΔT₂ ≈ −1,4 à −1,8 K pour τ de 4 à 10, et ≈ −1,1 K si l'on tient compte du masquage par la surface claire du pôle. La mer en ciel clair ajoute ≈ −0,3 K. Au total, 20 à 35 % de l'écart. La réflexion moyenne globale des nuages bougerait aussi (0,41 contre 0,44 à τ = 6) : l'albédo global serait à remesurer.

**Correction proposée.** Pour le faisceau direct, rendre la réflexion et la transmission du nuage fonctions de μ₀ : deux-flux à source directe, par exemple δ-Eddington (Joseph, Wiscombe & Weinman 1976) ou Coakley & Chýlek 1975. Le diffus garde la formule (19). Pour la mer, prendre R_F(μ₀) de EARTH.albedoFresnel (déjà codée) pour le direct en ciel clair, et 0,066 pour le diffus. Le coût reste linéaire, sans aucun réglage.

**Vérification.** Lecture de solaire.js. nuageVisible (l.222-225) donne R = b/(2+b), avec b = √3(1−g)τ : aucun μ. couche (l.124-136) est un deux-flux diffus. poser (l.228) additionne des couches diffuses symétriques. solAerosol est diffus aussi, et Rayleigh n'existe qu'en ciel clair. Dans albedoMu, μ n'entre que par cinq termes : Rayleigh 0,28/(1+6,43μ), l'ozone M(μ), la vapeur en faisceau direct (ciel clair l.330, au-dessus du nuage sans nuage haut l.287) et l'O₂ √(w/μ). Le titre exagère donc un peu : ozone, vapeur et O₂ agissent aussi sous nuage. Mais la réflexion du nuage et la mer (0,066 fixe, physics.js:593) ne voient pas μ₀. J'ai refait les chiffres avec 50 latitudes × 365 jours × 96 heures, pondérés par l'énergie. μ̄ vaut 0,731 / 0,610 / 0,432. Fresnel donne 0,0506 / 0,0767 / 0,1402. Un nuage δ-Eddington τ = 6, g = 0,85 réfléchit 0,383 / 0,432 / 0,507. En moyenne sur le disque, on trouve 0,409 pour ce nuage et 0,0664 pour Fresnel. La formule (19) donne 0,438. Le sens de l'effet est sûr : trop de réflexion tropicale et trop peu de réflexion polaire, donc a_trop sous-estimé et a_pol surestimé, ce qui rend T₂ trop peu négatif. L'ordre de grandeur de −1 à −2 K est cohérent avec ∂T₂/∂a = −63,2 / +18,1 / +18,0 K, que j'ai vérifié. Mais il repose sur f = 0,546 et une transmission de 0,8 posées par l'auditeur : estimation, pas mesure. Même si l'on retire l'écart global (0,409 contre 0,438) pour ne garder que la redistribution, on obtient encore −1,3 à −1,7 K.

**Correction amendée.** Rendre la réflexion et la transmission du nuage fonctions de μ₀ pour le faisceau direct (δ-Eddington, Joseph et al. 1976). Il faut alors deux amendements. (1) Le diffus doit venir du MÊME schéma, soit R̄ = ∫R(μ)2μdμ, et non de la formule (19). Sinon direct et diffus ne se raccordent pas : à τ = 6, la moyenne sur le disque du δ-Eddington vaut 0,409 alors que (19) donne 0,438. Ce sont deux fermetures différentes. (2) poser() et sous() additionnent des couches diffuses symétriques. L'addition doit porter séparément le direct (R(μ₀), T_dir = e^(−τ/μ₀), T_dif(μ₀)) et le diffus réfléchi par le dessous. La réflexion moyenne des nuages baissera : l'albédo global est à remesurer, sans recalage. Mer : R_F(μ₀) (EARTH.albedoFresnel, ou la fonction ponctuelle à exposer) pour le direct, 0,066 pour le diffus.

#### 23. Deux co-albédos pour la même absorption solaire : 🍰🪩📿 fixe T̄, les co-albédos de zone fixent T₂

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:287-298, 755-765, 793, 848 ; API_BILAN/physics/meridien.js:159-167`

**Constat.** Chez NCC, le même a(x) donne le mode 0 (T₀) et le mode 2 (T₂). Ici, T̄ vient de 🍰🪩📿, c'est-à-dire du voile appliqué à SOLAIRE.albedo du mélange de surfaces global. T₂ vient de Σ a_z J_z, avec Rg_z = c·α❄️ + (1−c)(e_z·α_Briegleb(T_z) + (1−e_z)·albedoLibre). Le mélange global contient des termes absents du mélange de zone : forêt 0,17, désert 0,30, lave, mer gelée seaIceFrac (rampe sur T̄), glace en rampe tf × r_ens, terre découverte à α_océan (l.763), voile 🍰⚽ (l.848) et facteur corps noir. Rien ne garantit Σ_z f_z Ī_z a_z /(🧲☀️/4) = 1 − 🍰🪩📿. Au 📱, les co-albédos de zone (0,692/0,674/0,573, Ī_z = 399,2/310,5/201,6 W/m²) impliquent un albédo planétaire de 0,323 ; 🍰🪩📿 n'a pas été remesuré ici. Le voile manque côté zones : T₂ ∝ a(x) devrait être multiplié par (1 − 🍰⚽).

**Effet.** Au 📱, l'écart est probablement de l'ordre de 0,01 d'albédo (non remesuré). Avec un voile 🍰⚽ = 0,1, |T₂| est trop fort de 10 % (≈ 2 K). Quand la mer gèle ou en boule de neige, les deux chemins comptent la glace différemment (constat suivant) : écart inconnu par lecture.

**Correction proposée.** Un seul chemin. Construire Rg de chaque zone à partir du même mélange (mêmes coefficients, terre de la zone tirée de PALEOGEO, glace e_z), calculer A_z par albedoMu aux μ de la zone, puis 🍰🪩📿 = voile(Σ_z f_z Ī_z A_z·echelle /(🧲☀️/4)), et T₂ des mêmes A_z, voile compris. Le mélange global par surfaces disparaît.

**Vérification.** Ce sont bien deux mélanges distincts. Pour les zones (meridien.js:162 ; calculations_albedo.js:288), Rg = c·0,85 + (1−c)(e·α_Briegleb + (1−e)·albedoLibre), avec albedoLibre = océan·0,066 + terre·0,18 : ni forêt, ni désert, ni lave, ni mer gelée seaIceFrac. Le global (l.754-764) contient en plus volcan, forêt, désert, la glace ice_surface × r_ens, et calotte_effective. Ensuite il applique blackbody_factor (l.842) et le voile (l.848). Côté zones, coAlbedo = 1 − A est pris avant voile et sans blackbody_factor. Or applyVeilToPlanetaryAlbedo01 donne 1 − A_eff = (1−A)(1−🍰⚽) : T₂ devrait donc être multiplié par (1−🍰⚽), soit −10 % pour 🍰⚽ = 0,1, et aussi par le facteur corps noir. J'ai recalculé : Ī_z = 399,17 / 310,52 / 201,62 W/m², avec Σ f_z Ī_z = 340,25 W/m². Les co-albédos du 📱 impliquent un albédo planétaire de 0,3235. Autre écart de comptage : l.648 retire les calottes de la glace saisonnière globale (ice_surface − calotte), alors que les zones appliquent e au reste (1−c). La valeur de 🍰🪩📿 au 📱 n'est pas lisible : l'écart d'albédo (~0,01 selon l'auditeur) n'est pas démontré par lecture.

**Correction amendée.** Garder la correction, en un seul chemin : A_z = albedoMu aux μ de la zone, sur un Rg_z construit avec les mêmes coefficients et la même glace e_z ; 🍰🪩📿 = voile(Σ_z f_z Ī_z A_z·echelle/(🧲☀️/4)) ; T₂ tiré des mêmes A_z, voile ET facteur corps noir compris. Précision : seul le chemin de l'ALBÉDO par surfaces globales disparaît. Les fractions de surface (🍰🪩🌊, 🍰🪩🧊…) restent lues ailleurs (nuages, CCN maritimes, eau) ; elles doivent alors être les sommes zonales des mêmes fractions.

#### 24. Part de l'année sous le gel : deux valeurs dans la même fonction (rampe linéaire tf et arcsinus de fractionGelee)

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/physics/physics.js:250-251, 357-364, 370-381 ; API_BILAN/albedo/calculations_albedo.js:475, 762-763`

**Constat.** Pour T = T_z + amp·sin θ, la part de l'année sous T_gel vaut (π − 2 asin u)/(2π), avec u = (T_z − T_gel)/amp : c'est ce que calcule fractionGelee().temps. facteurGlaceZones rend aussi tf = (1 − u)/2, rampe linéaire que son propre commentaire (physics.js:250) définit comme la même grandeur, « la fraction de l'ANNÉE ». À u = 0,5 : 0,250 contre 0,333 ; à u = 0,8 : 0,100 contre 0,205 ; à u = −0,8 : 0,900 contre 0,795. Le global (l.763) pondère la glace par ice_surface (issue de tf) × r_ens, avec r_ens = ΣfE/ΣfT (issu de fractionGelee). La part d'énergie qui tombe sur la glace vaut donc tf·E/T, et non E. Le bilan méridien, lui, prend E (e_z).

**Effet.** Aux bords des rampes (début du gel, entrée en boule de neige), le global et les zones divergent d'un facteur qui atteint 2 sur la glace saisonnière. Le global la sous-estime au début du gel (u > 0) et la surestime en fin de gel (u < 0).

**Correction proposée.** Une seule fraction : tf_z = fractionGelee(T_z, amp_z).temps, exacte pour la sinusoïde posée. L'albédo de glace pondéré par l'énergie s'écrit directement Σ f_z e_z, sans rapport r_ens. La rampe linéaire disparaît.

**Vérification.** physics.js:358 donne tf = (T_gel + dT + amp − T̄)/(2amp) = (1−u)/2, avec u = (T_z − T_gel)/amp. Le commentaire de la l.249-250 la définit comme « la fraction de l'ANNÉE » sous le gel. Pour T = T_z + amp·sin θ, la mesure de {sin θ < −u} vaut (π − 2 asin u)/(2π). Je l'ai vérifié : 0,333 contre 0,25 à u = 0,5 ; 0,205 contre 0,10 à u = 0,8 ; 0,795 contre 0,90 à u = −0,8. Près du début du gel (u → 1), tf/T ≈ π√ε/(2√2) → 0 : le facteur dépasse 2, il n'est pas borné. Dans le global, ICE_FORMULA_MAX_FRACTION = 1 et ice_cap ≈ 0,9, donc ice_surface ≈ Σf·tf. Avec r_ens = ΣfE/ΣfT (l.381), la part d'énergie sur la glace vaut (Σf·tf)(ΣfE)/(ΣfT). Elle n'est égale à ΣfE que si tf = T. Le méridien prend e_z. Une précision : physics.js:168-170 dit que la largeur de rampe « tient lieu de l'étalement en latitude ». Mais fractionGelee prend la même T_z pour toutes les latitudes, donc les deux restent des estimations de la même grandeur.

**Correction amendée.** Une seule fraction, en forme analytique continue : tf_z = (π − 2 asin u)/(2π), bornée à [0,1]. Il ne faut pas prendre la version échantillonnée sur 73 jours de fractionGelee().temps, qui est en escalier (constat 5). La part d'énergie sur la glace vaut Σ f_z e_z, sans r_ens. Dans iceAlbedoEff (l.721-730), pondérer l'albédo de glace par f_z·e_z (énergie) et non par f_z·tf_z (temps). Traiter les calottes de la même façon des deux côtés : (1−c_z)·e_z, au lieu de soustraire la calotte de la glace globale à la l.648.

#### 25. e(T) en escalier de 73 marches : marches plus grandes que la tolérance du point fixe

*moyenne · autre · verdict : **confirme***  
`API_BILAN/physics/physics.js:279-294 (l.286) ; API_BILAN/physics/meridien.js:120, 152, 160-162, 176`

**Constat.** fractionGelee calcule gel = [T_z + amp·sin(2πd/73 − δ) < T_gel] sur 73 jours, avec la même T_z pour les 10 latitudes. e(T_z) est donc une fonction en escalier à 73 marches. J'ai refait le calcul hors moteur (ε = 23,44°, amp 15/25/3) : sauts maximaux de e de 0,035 au pôle, 0,022 aux moyennes latitudes continentales et 0,016 aux tropiques (à T_z = 268,6 K). Avec ∂T₂/∂a_z = −63,2/+18,1/+18,0 K et une réponse au sommet dA/dRg ≈ 0,5 (relevé de session), un saut tropical déplace T₂ d'environ 0,3 K et un saut polaire d'environ 0,2 K, alors que TOLERANCE_K = 0,01 K. Le point fixe se pose sur un palier. Plusieurs paliers peuvent couper la diagonale ; celui retenu dépend alors du départ, c'est-à-dire du STATE.dTzones du calcul précédent.

**Effet.** T₂ et les écarts de zone sont quantifiés par pas de 0,1 à 0,3 K, et le résultat dépend du chemin (ordre Search/Dicho, clic précédent). Le global hérite de l'escalier par r_ens : l'albédo planétaire n'est pas continu en T̄. Effet sur T̄ inconnu par lecture.

**Correction proposée.** Calculer e analytiquement. Les instants de gel forment l'intervalle θ ∈ (δ + π + β, δ + 2π − β), avec sin β = u. Il suffit d'intégrer l'insolation cumulée de la bande entre ces bornes, avec interpolation linéaire comme le fait ORBITE.sommeAnomalie. e(T) devient continue, pour un coût linéaire.

**Vérification.** physics.js:286 : gel = [T_zone + amp·sin(2πd/73 − retard) < T_gel], avec la même T_zone pour les 10 latitudes. Chaque jour bascule une seule fois quand T_z varie, donc e(T_z) est une fonction en escalier d'au plus 73 marches. Une marche vaut Σ_i w_i S_i[d] / Σ S, de l'ordre de S_max/(73·S̄) : 0,034 au pôle et 0,015 aux tropiques, ce qui recoupe 0,035 / 0,016. ∂T₂/∂a = −63,2 / +18,1 / +18,0 K, que j'ai vérifié, et 0,016 × 0,75 × 0,5 × 63 ≈ 0,38 K aux tropiques. Au pôle, les grandes marches sont les jours d'été, qui gèlent en dernier (u → −1) ; au début du gel, ce sont des jours de nuit polaire, dont la marche est nulle. Au 📱 (u ≈ 0), la marche polaire est plutôt d'environ 0,01 en e, soit ≈ 0,04 K de T₂ : encore 4 fois TOLERANCE_K. J'ai aussi vérifié la multiplicité : avec G croissant en escalier, quand la diagonale passe par une marche (c_k < x_{k+1} ≤ c_{k+1}), il y a deux points fixes adjacents (c_k et c_{k+1}). Le résultat dépend alors du STATE.dTzones de départ. Le global hérite de l'escalier par r_ens = gE/gT. Le facteur dA/dRg ≈ 0,5 est un relevé de session non vérifié, mais l'ordre de grandeur tient même à 0,3.

#### 26. Relaxation ½ inutile pour une rétroaction positive, critère d'arrêt faible, sortie silencieuse après 30 itérations, deux T₂

*moyenne · autre · verdict : **confirme***  
`API_BILAN/physics/meridien.js:120, 151-181 ; API_BILAN/physics/saisons.js:45, 123-131`

**Constat.** Toute l'itération passe par le seul scalaire T₂, et ses rétroactions sont positives. Pôle plus froid → plus de glace et de calotte → a_pol baisse → H plus négatif. Tropiques plus chauds → a_trop monte, et comme J_trop < 0 → H plus négatif. La pente g = G'(T₂) est donc ≥ 0. La relaxation x ← (x + G(x))/2 a pour facteur (1+g)/2 ≥ g : elle ralentit toujours et ne stabilise rien, contrairement au commentaire de la l.174. Elle n'aiderait que pour g < 0. Si g ≥ 1 (point fixe instable, bistabilité de zone), aucune relaxation ne converge. Le test |G(x) − x| < 0,01 K ne borne l'erreur qu'à 0,01/(1−g). Après 30 tours, la boucle sort sans erreur (l.176-178) et pose un STATE.dTzones non convergé, contrairement au crash-first. Elle rend aussi deux T₂ : T2 non relaxé (l.168, lu par le banc via _hystDiag.meridien.T2) et −dT.pol/⟨P₂⟩pol relaxé (lu par les calottes l.157 et par la glace). saisons.js fait 12 tours fixes, relaxation ½, sans aucun test.

**Effet.** Pour g = 0,9, l'erreur à l'arrêt peut atteindre 0,1 K. Trente tours au facteur 0,95 laissent 21 % de l'écart initial, sans signal. Le résultat dépend du départ quand g ≥ 1, ou à cause de l'escalier e(T) (constat précédent).

**Correction proposée.** Itérer sans relaxation, ou par sécante/Newton sur la seule inconnue T₂. Critère d'arrêt sur l'erreur estimée |G(x) − x|/(1 − ĝ). Lever une exception (throw) si la boucle n'a pas convergé, avec T₂, ĝ et l'écart dans le message. Ne rendre qu'un seul T₂, celui du dT posé. Même chose dans saisons.js.

**Vérification.** L'itération est bien scalaire : STATE.dTzones initial ∝ ⟨P₂⟩ (physics.js:608), nouveau = −T₂⟨P₂⟩, et les combinaisons restent proportionnelles. Le facteur relaxé (1+g)/2 est ≥ g pour g ≤ 1 : la relaxation n'aide que si g < 0, et rien ne converge si g ≥ 1. Le commentaire « rampe raide » (l.174) ne justifie donc rien. Le signe g ≥ 0 est démontré pour tous les chemins d'albédo (glace, calotte, Briegleb monotone). Il ne l'est pas pour la calotte : l'accumulation q(x) (calottes.js:347) baisse quand le pôle refroidit, mais ce chemin n'a pas de raison de dominer. Le critère porte sur le pôle, ecart = 0,8078·|G−x| < 0,01 : |G−x| < 0,0124 K, soit une erreur ≤ 0,0124/(1−g) = 0,12 K pour g = 0,9, et 0,95^30 = 0,215. Après 30 tours, la boucle sort sans throw (l.151-178). Il y a même trois valeurs : coAlbedo, Rg et calottes à x_old, T2 = G(x_old) (l.168, lu par le banc) et STATE = (x_old+G)/2. saisons.js:124-131 fait 12 tours fixes, sans test. Mais la rétroaction y CHANGE DE SIGNE. Pour mu < 0, plus de glace donne une capacité plus faible, donc une amplitude A plus grande, donc β = asin(−mu/A) plus petit, donc g plus petit : rétroaction négative, où la relaxation peut servir.

**Correction amendée.** Ne PAS passer à la sécante ou à Newton. En régime bistable (boule de neige, hystérésis), elles convergent aussi vers la racine instable de G(x) − x, que la physique n'atteint jamais. L'itération simple n'atteint que les points stables (g < 1), ce qui fait le choix de la branche. Garder l'itération simple sans relaxation. Estimer ĝ par le rapport des incréments successifs et arrêter sur |G(x) − x|/(1 − ĝ) < TOLERANCE_K. Lever une exception (throw) avec T₂, ĝ et l'écart si la boucle ne converge pas. Rendre un seul état : recalculer coAlbedo, Rg et calottes au dT posé, ou poser dT = G(x) sans moyenne. Dans saisons.js : test de convergence et throw, mais relaxation permise, puisque la rétroaction y est négative pour une mer moyenne sous le gel.

#### 27. Amplitudes saisonnières mises à l'échelle par sin ε seulement, alors que le forçage est ∝ S·a_z·sin ε

*moyenne · validite · verdict : **plausible***  
`API_BILAN/physics/physics.js:173-193, 340-346, 361 ; API_BILAN/physics/meridien.js:145-154 ; API_BILAN/physics/saisons.js:101 ; API_BILAN/data/episteme.js:326`

**Constat.** Le premier harmonique de l'insolation journalière vaut exactement S·x·sin ε/2 : je l'ai vérifié numériquement à 10/45/70/85° pour ε = 23,44/45/70°, et saisons.js:101 l'utilise multiplié par le co-albédo. Dans le modèle linéaire de NCC (éq. 54–58, Z₁T̂₁ = F₁), l'amplitude de réponse est donc ∝ a_z·S·sin ε. facteurGlaceZones ne garde que sin ε/sin 23,44° : il manque S/S_📱 et a_z/a_z,📱. Ces amplitudes règlent les rampes de glace de zone et le cycle des calottes (meridien.js:154). Par ailleurs, episteme.js:326 attribue la loi « amplitude ∝ sin ε » à Laskar 2004, qui ne donne que ε.

**Effet.** Archéen (ε = 45°, S/S₀ ≈ 0,79 par Gough à 3 Ga) : amp_pol vaut 26,7 K au lieu d'environ 21, amp_trop 5,3 au lieu de 4,2. Les seuils hauts de gel (T_gel + dT + amp) sont donc trop hauts de 5,6 K au pôle et de 1,1 K aux tropiques. En boule de neige (a_z ≈ 0,3–0,4 contre 0,57–0,69 au 📱), les amplitudes sont 1,5 à 2 fois trop fortes : rampes trop larges, cycle des calottes trop ample. Au 📱 l'effet est nul par construction.

**Correction proposée.** amp_z = SEASONAL_AMP_z × (🧲☀️·a_z·sin ε)/(S_📱·a_z,📱·sin ε_réf), où a_z est le co-albédo de zone déjà calculé par le bilan méridien. Mieux : lire l'amplitude calculée par saisons.js, qui contient déjà ce facteur. Dans episteme.js:326, rattacher la loi à l'identité du premier harmonique (⚛) plutôt qu'à Laskar.

**Vérification.** J'ai vérifié l'identité : le premier harmonique de l'insolation journalière vaut exactement S·sin φ·sin ε/2. Je l'ai contrôlé à 10/45/70/85° pour ε = 23,44/45/70°, et saisons.js:101 l'utilise. physics.js:342-346 ne garde que sin ε/sin 23,44°. Les chiffres de l'Archéen sont justes À Z₁ CONSTANT : sin 45°/sin 23,44° = 1,7776, Gough à 3 Ga = 0,792, amp_pol = 26,7 → 21,1 (−5,6 K) et amp_trop = 5,33 → 4,21. Mais dans NCC (Z₁T̂₁ = F₁), l'amplitude vaut F₁/|Z₁|. Z₁ change aussi avec l'époque : C_air ∝ 🎈/🍎 (saisons.js:89), part de terre, et surtout mer gelée (dalle de glace au lieu de la couche de mélange, l.111-113). En boule de neige, |Z₁| des zones océaniques chute d'un ordre de grandeur, et l'amplitude devrait donc AUGMENTER bien plus que le facteur a_z (×0,5) ne la réduit. La conclusion « amplitudes 1,5 à 2 fois trop fortes en boule de neige » n'est donc pas démontrée : elle est probablement de signe faux. Le facteur S manquant est réel. episteme.js:326 attribue bien « ∝ sin ε » à Laskar 2004, qui ne fournit que ε.

**Correction amendée.** La loi complète du modèle linéaire est amp_z ∝ |F₁,z/Z₁,z|. Si l'on garde l'ancre posée (⚠️) : amp_z = SEASONAL_AMP_z × |F₁,z/Z₁,z| / |F₁,z,📱/Z₁,z,📱|, avec F₁ = a_z·🧲☀️·⟨x⟩ sin ε/2 et Z₁ tiré des impédances de saisons.js (B + 2D + iω(C_air, C_mer ou glace), sol, couplage terre–mer). Multiplier par S·a_z seulement est incomplet, et faux en boule de neige. Dans episteme.js:326, rattacher « ∝ sin ε » à l'identité du premier harmonique (⚛) ; Laskar 2004 ne fournit que ε.

#### 28. B et D gardés constants hors de leur domaine (Terre actuelle, 1 atm, jour de 24 h) ; B n'est pas la pente du solveur

*moyenne · validite · verdict : **confirme***  
`API_BILAN/physics/meridien.js:32-35, 129 ; API_BILAN/physics/saisons.js:89, 105 ; API_BILAN/atmosphere/calculations_atm.js:145 ; API_BILAN/config/configTimeline.js:283`

**Constat.** B = 2,09 est la régression OLR(T_s) de l'hémisphère nord actuel. T̄ vient du solveur, dont la pente ∂OLR/∂T_s (à humidité relative fixée) est un autre nombre, qui change avec l'époque : elle tend vers 0 près de l'emballement et vers 4εσT³ en air sec. Les modes 0 et 2 n'ont donc pas le même amortissement radiatif. Dans le bilan diffusif, D = K·C/R² avec C = c_p·p_s/g. Williams & Kasting 1997 (Icarus 129:254, d'après Stone 1972 ; à relire) en tirent D ∝ (p/p₀)(c_p/c_p0)(M₀/M)²(Ω₀/Ω)². Le code garde D fixe alors que 🎈, 🧪, 🍎 et 📐 changent par époque. saisons.js met déjà C_air ∝ 🎈/🍎 à côté de ce même D : incohérence interne au modèle de NCC. La rotation n'existe pas dans le moteur.

**Effet.** T₂ ∝ 1/(6D + B). Pour B entre 1 et 3, T₂ est multiplié par 1,22 à 0,87. Un jour de 21,9 h (Néoprotérozoïque, ordre de grandeur des rythmites, à relever) donne D × 0,83, soit |T₂| +12 % (≈ 2,5 K) ; un jour de 18 h donne +40 %. 🔥 (≈ 66 bar de CO₂ + 100 bar de N₂) : D devrait être des dizaines de fois plus grand et le gradient presque nul ; le code garde le gradient moderne. Au Précambrien, le défaut va dans le sens des pôles trop chauds.

**Correction proposée.** B = ∂🧲🌈🔼/∂T_s du solveur, à composition et humidité relative fixées : une évaluation de flux de plus, coût linéaire. D = D₀·(🎈/1 atm)(c_p/c_p0)(M₀/🧪)²(Ω₀/Ω)², avec D₀ de NCC déclaré 🔧. Ω doit d'abord devenir une grandeur DATA sourcée (🦴, rythmites de marée). Le même D sert dans saisons.js.

**Vérification.** Lu dans le code : NORTH1981 = {B: 2,09, D: 0,649} sont des constantes (meridien.js:32-35), et L2 = 6D+B (l.129). saisons.js:89 fait varier C_air = c_p·🎈·p₀/🍎 avec l'époque, mais garde le même D (l.105, B + n(n+1)D). Or D = K·C/R² dans le modèle diffusif : l'incohérence interne est réelle. J'ai refait l'arithmétique. B = 1 et B = 3 multiplient T₂ par 5,984/4,894 = 1,223 et 5,984/6,894 = 0,868. Pour un jour de 21,9 h, (21,9/24)² = 0,833 et T₂ × 1,122 ; pour 18 h, × 1,398. Pour 🔥, D est multiplié par plus de 60 : 166 × (29/44)² ≈ 72, puis × c_p/c_p0. La loi de Williams & Kasting 1997 (d'après Stone 1972) est citée de mémoire et reste à relire. Le sens « pôles trop chauds » ne vaut que pour la rotation, et pour une pression ≤ 1 atm. Pour 🔥, le gradient du code est trop FORT. Remplacer B par la pente du solveur unifie les modes 0 et 2 (une seule loi OLR(T), référence unique). Pour la Terre actuelle, Koll & Cronin 2018 montrent que les pentes spatiale et en colonne sont voisines (~2 W/m²/K), mais c'est un choix à déclarer.

**Correction amendée.** D = D₀·(🎈/1 atm)(c_p/c_p0)(M₀/🧪)²(Ω₀/Ω)², avec D₀ de NCC en 🔧 (constat 1) et la loi de Stone/WK97 déclarée (💻, extrapolée ❔ loin de la Terre actuelle, à relire). Tant que Ω n'est pas une grandeur DATA sourcée (rythmites : 🦴, Williams 2000 ≈ 21,9 h à 620 Ma, à relever), ne prendre que les facteurs en pression, c_p et M, et déclarer Ω = Ω₀ (❔). B = ∂🧲🌈🔼/∂T_s du solveur, à composition et humidité relative fixées, déclaré comme une hypothèse : la pente en colonne remplace la régression spatiale. Le même B et le même D dans meridien.js et saisons.js.

#### 29. « Briegleb » mal déclaré : la loi du code n'est pas celle de NCAR/TN-463

*moyenne · statut_mal_declare · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:177-204, 289-291 ; API_BILAN/physics/meridien.js:162 ; API_BILAN/data/episteme.js:70, 331 ; API_BILAN/doc/equation.html:568-573`

**Constat.** Le code fait passer l'albédo de la neige profonde (0,85) à 0,70 entre 263,15 et 268,15 K, puis de 0,70 à 0,50 jusqu'à 273,15 K. Il l'applique à la température MOYENNE ANNUELLE de la zone, plafonnée à 268,15 K dans brieglebIceAlbedoLocal, si bien que seul le premier segment sert. Le schéma CCSM3 de Briegleb et al. 2004 (option « ccsm3 » de CICE ; valeurs de mémoire, à vérifier dans TN-463 §5) ne baisse l'albédo de la neige et de la glace que lorsque la température de SURFACE instantanée passe de −1 à 0 °C : −0,075 pour la glace, −0,10 / −0,15 pour la neige (visible / proche IR). Les seuils −10/−5 °C et leur application à une moyenne annuelle n'ont pas de source. Pourtant episteme.js:70 les déclare 💻📌 Briegleb.

**Effet.** Entre T_z = −10 et −5 °C, une pente dα/dT ≈ −0,03 K⁻¹ sur la glace saisonnière entre dans g du point fixe, sans origine physique. Elle renforce la rétroaction glace–albédo de zone dans les états glaciaires et à l'entrée en boule de neige. Au 📱 (pôle au-dessus du plafond), elle est sans effet.

**Correction proposée.** Statut ⚠️ (sans source) pour les seuils dans episteme.js:70 et la carte. À terme : albédo de la glace saisonnière selon la température de surface pendant la saison éclairée, en prenant T(t) du cycle, avec la fenêtre −1/0 °C de la source.

**Vérification.** calculations_albedo.js:178-191 : rampe 0,85 → 0,70 entre 263,15 et 268,15 K, puis 0,70 → 0,50 jusqu'à 273,15 K. brieglebIceAlbedoLocal (l.203) plafonne T à 268,15 K : le second segment ne sert jamais. Le méridien l'applique à T_K − dT_z, la moyenne annuelle de zone (meridien.js:162), et le global aussi (l.725-727). Le commentaire du code l.199-203 l'avoue (« T_locale = moyenne ANNUELLE de zone »). Le schéma CCSM3 de Briegleb et al. 2004 travaille sur la température de surface instantanée, avec une fenêtre de fonte de −1 à 0 °C (valeurs de mémoire, cohérentes avec l'option ccsm3 de CICE). Rien n'y place de seuil à −10 ou −5 °C appliqué à une moyenne annuelle. Les montants exacts de TN-463 sont à relire, mais l'usage hors domaine est certain. Pente : (0,70 − 0,85)/5 = −0,03 K⁻¹, vérifié. Au 📱, T_pol ≈ T̄ − 0,8078 × 21,2 ≈ −2,6 °C, au-dessus du plafond : α = 0,70 constant, et l'effet est nul.

#### 30. 🍰🪩🧊 lu par le bilan méridien avant d'être recalculé ; la clé 🪩🍰🧊 porte deux grandeurs

*moyenne · reference_unique · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:289-291, 523, 668, 711, 857 ; API_BILAN/physics/physics.js:593`

**Constat.** neigeTrop (l.289-291) lit DATA['🪩']['🍰🪩🧊'] avant que calculateAlbedo ne le réécrive (l.523, puis l.668). C'est donc la glace du calcul d'albédo PRÉCÉDENT : une autre T̄ pendant Search/Dicho, une autre époque au premier appel. Le chemin global lit la valeur courante (l.711). Un même nom porte ainsi trois valeurs au cours d'un seul appel. Par ailleurs, DATA['🪩']['🪩🍰🧊'] reçoit iceAlbedoEff, l'albédo effectif zonal (l.857), alors que EARTH['🪩🍰']['🪩🍰🧊'] = 0,70 est un coefficient que le méridien lit comme neige mouillée de fonte et comme segment de la rampe : une clé, deux grandeurs.

**Effet.** L'albédo de la neige tropicale des zones dépend de l'ordre des appels, donc n'est pas reproductible entre clic et banc dès que la zone tropicale gèle. Sans gel tropical (e_trop = 0), aucun effet.

**Correction proposée.** Calculer la glace d'abord, une seule fois, sous une seule clé DATA ; le méridien et le mélange global la lisent ensuite. Donner une autre clé à l'albédo effectif (par exemple 🧮🪩🍰🧊, selon la grammaire 🧮 = valeur courante) et laisser 🪩🍰🧊 au coefficient.

**Vérification.** Lu dans le code. Seuls calculations_albedo.js:523 et :668 écrivent DATA['🪩']['🍰🪩🧊']. La l.289 (neigeTrop, utilisé seulement pour 'trop') le lit avant, donc avec la valeur de l'appel précédent. La l.554/604 lit la valeur de la l.523, et la l.711 celle de la l.668 : trois valeurs du même nom dans un même appel. D'autre part, DATA['🪩']['🪩🍰🧊'] = iceAlbedoEff (l.859), alors que albedo_coeff['🪩🍰🧊'] = 0,70 sert de segment de Briegleb (l.179), de cible tropicale (l.289, l.712) et de neige mouillée de fonte (l.299). Sans gel tropical, e_trop = 0 et l'effet est nul, comme dit.

**Correction amendée.** « Calculer la glace d'abord » n'est pas possible tel quel : la glace globale de la l.668 dépend du méridien (calotte_surface, l.309), et neigeTrop dépend de la glace globale. Il y a une vraie boucle. L'assombrissement tropical doit être évalué DANS le point fixe du méridien, à partir de la glace des zones elles-mêmes (Σ_z f_z[c_z + (1−c_z)·tf_z] de l'itération courante), et le mélange global doit lire ce même résultat. Ou bien l'assombrissement doit dépendre d'une grandeur déjà portée (durée de l'englacement), pas de 🍰🪩🧊. Clés : une clé distincte pour l'albédo effectif (🧮🪩🍰🧊) ; et 🪩🍰🧊 (0,70) ne devrait pas jouer trois rôles (glace établie, neige mouillée, cible tropicale).

#### 31. Rayleigh : le code compte les molécules, sans leur section efficace

*moyenne · validite · verdict : **confirme***  
`API_BILAN/radiative/solaire.js:163-167, 316-321 ; API_BILAN/doc/equation.html:480-486 ; API_BILAN/data/episteme.js:253-254 ; API_BILAN/config/configTimeline.js:283-292, 377, 797, 950`

**Constat.** s = (🎈/1 atm)(g₀/🍎)(M₀/🧪) compte les molécules de la colonne. Or la diffusion de Rayleigh par molécule dépend du gaz, ∝ (n−1)² × facteur de King : CO₂ ≈ 2,5 fois l'air, CH₄ ≈ 2,2, H₂O ≈ 0,75 (Sneep & Ubachs 2005, à relever). L'éq. 41 de L&H 1974 vaut pour l'air actuel. Archéen (configTimeline:377, ≈ 10 % de CO₂ molaire) et frontières de sortie F2/F4 (≈ 97 000 ppm, l.797 et 950) : section moyenne × 1,16 ; R̄*_r passe de 0,075 à 0,086. 🔥 (l.283-292, 166 bar) : déjà saturé par le nombre de molécules, R̄*_r passe de 0,915 à 0,94. g₀ = 9,80665 et M₀ = 0,02897 sont écrits en dur (l.166).

**Effet.** Époques riches en CO₂ : Rayleigh +15 %, soit environ +0,004 d'albédo planétaire en ciel clair (≈ −1,3 W/m², ≈ −0,6 K), justement là où se trouvent les frontières de sortie de boule de neige. Faible pour T₂, car le même facteur s'applique à toutes les zones.

**Correction proposée.** s = Σ_i N_i σ_i / (N_air,0 σ_air), avec les σ_i mesurés (Sneep & Ubachs 2005 ; Bates 1984). g₀ et M₀ deviennent des constantes nommées, une seule fois.

**Vérification.** solaire.js:166 : s = 🎈·(9,80665/🍎)·(0,02897/🧪). Comme 🧪 est la masse molaire en kg/mol (dico.js:102), s ∝ p/(g·M), donc le nombre de molécules par m², sans section efficace par espèce. 9,80665 et 0,02897 y sont écrits en dur. La section de Rayleigh varie comme (n−1)²·F_King. Valeurs de mémoire, à relever chez Sneep & Ubachs 2005 : CO₂ ≈ 2,4 à 2,5 fois l'air, CH₄ ≈ 2,2, H₂O ≈ 0,7. Avec 10 % de CO₂ molaire, la section moyenne vaut 0,9 + 0,1 × 2,5 = 1,15. rayleigh(R₁, s) = s·t₁/(1+s·t₁) : avec s ≈ 1,1, R̄*_r passe de 0,075 à 0,086, conforme. L'effet ne touche que la fraction de ciel clair : L&H n'ont pas de Rayleigh sous nuage. Son ordre de grandeur (+0,004 d'albédo) est plausible, mais n'est pas mesuré.

#### 32. Obliquité : 0 sentinelle dans DATA, chaîne de repli, et l'ε réellement utilisé absent de DATA

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/physics/physics.js:193, 402-405 ; API_BILAN/convergence/compute.js:101-103 ; API_BILAN/physics/orbite.js:56-59 ; API_BILAN/config/configTimeline.js:338, 1998 ; API_BILAN/data/dico.js:67 ; API_BILAN/physics/calottes.js:352`

**Constat.** Avant −51 Ma, 📜⚾ vaut 0 (« 0 = celle de l'époque »). obliquiteCourante() teste > 0, puis '⚾' in EPOCH, puis CONFIG_COMPUTE.obliquityDeg = 23,44 : une chaîne de repli. L'ε réellement utilisé n'est dans DATA que dans la fenêtre La2004. Le 23,44 est écrit deux fois (EARTH.OBLIQUITY_DEG_REF et CONFIG_COMPUTE.obliquityDeg). Les calottes lisent l'orbite par ORBITE.anomalie(âge) (calottes.js:352) et non par 📜⚾ : deux chemins vers une même orbite. Pour 🦠 (⚾ = 45°), le méridien et le cycle des zones prennent 45°, tandis que l'anomalie des calottes est nulle, ce qui revient à l'orbite de 1950 (ε = 23,45°).

**Effet.** Aucun dans la fenêtre La2004. Avant −51 Ma, calottes et méridien ne voient pas la même ε ; l'effet est inconnu par lecture, probablement faible sans calotte archéenne.

**Correction proposée.** getEpochDateConfig écrit dans 📜⚾ l'ε effectif : La2004, sinon EPOCH['⚾'], rendu obligatoire hors fenêtre (exception s'il manque). obliquiteCourante() disparaît et tout le monde lit DATA['📜']['⚾']. Une seule constante 23,44, la référence des amplitudes.

**Vérification.** orbite.js:57-59 rend 0 hors de La2004 ; compute.js:103 l'écrit dans 📜⚾. physics.js:402-405 enchaîne trois choix : > 0, sinon '⚾' in EPOCH, sinon CONFIG_COMPUTE.obliquityDeg. C'est un repli. Seule 🦠 déclare '⚾' (configTimeline:338) : toutes les autres époques avant −51 Ma prennent le 23,44 de la config, écrit deux fois (physics.js:193 et configTimeline:1998). Les calottes lisent ORBITE.anomalie(âge), qui vaut ZERO hors de la validité (orbite.js:105). Elles voient donc l'orbite de 1950 (ε = 23,45°, e = 0,0167), alors que le méridien et les amplitudes de zone prennent l'ε de l'époque (45° pour 🦠), et le Soleil une orbite circulaire (facteurSoleil = 1). Cela fait trois orbites. C'est déclaré ❔ dans episteme, mais contraire à la référence unique.

**Correction amendée.** Garder la correction (📜⚾ = l'ε effectif : La2004, sinon EPOCH['⚾'] obligatoire, avec un throw s'il manque ; obliquiteCourante supprimée). Deux compléments. (1) Déclarer ⚾ dans toutes les époques avant −51 Ma : aujourd'hui, seule 🦠 l'a. (2) L'anomalie des calottes doit être construite sur la MÊME orbite (ε de 📜⚾, e = 0 hors fenêtre) par rapport à l'orbite de 1950. Sinon il reste deux orbites, et l'écart d'ε (45° contre 23,45°) doit entrer dans l'anomalie de fonte.

#### 33. Constante solaire et insolation journalière écrites plusieurs fois ; zoneAnnualInsolation est du code mort, et mal déclaré

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/physics/physics.js:200-247 ; CO2/static/astronomie.js:24, 62-70 ; API_BILAN/convergence/compute.js:164-182 ; API_BILAN/physics/meridien.js:52, 56-74, 127 ; API_BILAN/physics/saisons.js:53-67 ; API_BILAN/data/episteme.js:324 ; API_BILAN/data/dico.js:81 ; API_BILAN/doc/equation.html:82-90`

**Constat.** La valeur 1361 W/m² existe trois fois : EARTH.SOLAR_CONSTANT_REF_W_PER_M2, astronomie.SOLAR_CONSTANT, et L☉/(4π UA²) = 1361,2 (Gough au présent, compute.js). L'échelle du méridien, 🧲☀️/1361, vaut ainsi 1,0003 au 📱 et non 1. L'insolation journalière (Berger 1978) est codée deux fois : EARTH.dailyMeanInsolation (orbite circulaire) et astronomie.insolationJournaliere (avec e et ϖ). La déclinaison est recalculée à quatre endroits (meridien l.52, tableInsolation, zoneAnnualMeanInsolation, forcage2). EARTH.zoneAnnualInsolation n'a aucun appelant dans le moteur, mais episteme.js:324 la cite comme l'insolation par zone « selon ε, e et la précession » : elle est circulaire et morte. dico.js:81 appelle 🧲☀️ « flux à 1 UA » alors que compute.js:181 le multiplie par 1/√(1−e²). S̄ désigne S/4 dans une carte (l.84) et S/√(1−e²) dans l'autre (l.90). Vérifié sans défaut : l'insolation annuelle du méridien est exacte pour l'orbite elliptique, puisque la moyenne temporelle égale la moyenne uniforme en λ × 1/√(1−e²), facteur porté par 🧲☀️. En revanche, e_z et les μ des zones ne voient pas la précession, que voient les calottes.

**Effet.** Numériquement ≤ 0,03 %. Risque de divergence silencieuse si l'une des copies change. L'absence de précession dans la glace saisonnière est un effet de second ordre, inconnu par lecture.

**Correction proposée.** Une seule constante, dérivée de L☉ et de l'UA de compute.js. Une seule table d'insolation de l'orbite courante (ORBITE.insolations existe déjà, au pas de 5 j, avec e et ϖ), lue par meridien, fractionGelee et saisons. Supprimer zoneAnnualInsolation et corriger episteme.js:324. dico : 🧲☀️ = flux moyen de l'année, × 1/√(1−e²).

**Vérification.** Les copies existent bien. 1361 apparaît dans physics.js:200 et dans astronomie.js:24 ; Gough donne 3,828e26/(4π·UA²) = 1361,2. Au 📱, echelle = 1,00016 × 1/√(1−0,0167²) = 1,0003. dailyMeanInsolation est circulaire (physics.js:203-210) ; astronomie.insolationJournaliere prend e et ϖ. La déclinaison est recalculée dans meridien.js:52, physics.js:225 et 271, et saisons.js:62. zoneAnnualInsolation n'a aucun appelant JS : seul CO2/scripts/params_doc/generate.py la cite. episteme.js:324 la décrit « selon ε, e et la précession », alors qu'elle est circulaire. dico.js:81 et 226 parlent de « flux à 1 UA », alors que compute.js:181 multiplie par 1/√(1−e²). equation.html:84 et 90 donnent deux S̄ différents. J'ai aussi vérifié que la moyenne annuelle est exacte : dt ∝ r²dλ et S ∝ 1/r², donc moyenne uniforme en λ × 1/√(1−e²).

**Correction amendée.** Garder la correction. Précision : ORBITE.insolations est interne à orbite.js (non exporté par window.ORBITE). Il faut l'exposer et définir l'orbite hors fenêtre (ε de 📜⚾, e = 0) avant que meridien, fractionGelee et saisons ne la lisent.

#### 34. Géométrie des zones, terre par zone, état initial et arguments : copies multiples

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/physics/meridien.js:36-45, 122, 157 ; API_BILAN/physics/calottes.js:92-99 ; API_BILAN/physics/physics.js:157-159, 182, 360, 370-376, 608 ; API_BILAN/albedo/calculations_albedo.js:287-298 ; API_BILAN/physics/saisons.js:98 ; API_BILAN/data/paleogeo_zones.js:21`

**Constat.** Les bornes des zones existent quatre fois : ZONES (meridien), BANDES (calottes), EARTH.*_ZONE_FRAC, et en degrés 60/90, 30/60, 0/30 dans facteurGlaceZones. STATE.dTzones initial = 28,0 × 0,8078 / 0,2165 / −0,375 recopie à la main P2_MOYEN et le T₂ de NCC ; cet état vit hors de DATA. Pour la terre d'une zone : le méridien (l.287) et facteurGlaceZones (l.360) lisent EPOCH['🗻']['🍰🗻🌊'] global, alors que DATA['🗻']['🍰🗻🌊'] (normalisé, posé ensuite par calculateGeologySurfaces) et CALOTTES.geographie (lu par saisons.js) existent. À 0 Ma, la table donne 0,648 de terre aux pôles (N 0,801 / S 0,495), 0,35 aux moyennes latitudes et 0,318 aux tropiques, contre 0,30 partout dans le code. physics.js:182 annonce 0,28 mesurés aux moyennes latitudes, la table en donne 0,35. Enfin resoudre() reçoit en arguments T_K = DATA['🧮']['🧮🌡️'], calottesDepart = DATA['🗻']['🍰🗻🧊'] et socleDepart = DATA['🗻']['🔺📏🗻🧊'] : ce sont des copies, pas des variables de travail. Seul dT copié depuis STATE est une vraie variable de travail, et ce n'est pas commenté.

**Effet.** Terre polaire hors calottes ≈ 0,52 au lieu de 0,30 : albedoLibre_pol ≈ 0,125 au lieu de 0,100, soit ΔT₂ ≈ −0,1 K. Le reste est de la lisibilité et un risque d'écart silencieux.

**Correction proposée.** Une table des zones (x₀, x₁, aire, ⟨P₂⟩) lue partout. État initial calculé à partir d'elle. dTzones sous une clé DATA. Terre de zone tirée de CALOTTES.geographie partout. resoudre lit DATA directement, et la copie de dT est commentée comme variable de travail.

**Vérification.** Les quatre copies des bornes sont confirmées : meridien.js:36-40, calottes.js:92-99, physics.js:158-160, et les degrés de physics.js:370-375. STATE.dTzones (physics.js:608) recopie ⟨P₂⟩ et le −28 de NCC, hors de DATA. resoudre n'a qu'un appelant (calculations_albedo.js:298), et ses arguments T_K, calottesDepart et socleDepart sont des copies de DATA. meridien (l.287) et facteurGlaceZones (l.360) lisent EPOCH['🗻']['🍰🗻🌊'] global pour chaque zone. UNE PARTIE EST FAUSSE : PALEOGEO.continent est le « socle > −1 000 m » (paleogeo_zones.js:4), plateaux continentaux compris, et non la terre émergée. Les valeurs 0,648 / 0,35 / 0,318 (vérifiées : N_pol 0,801, S_pol 0,495) donnent une terre globale de 0,373, contre 0,29 de terres émergées. Le « 0,28 mesuré » de physics.js:182 parle de terres émergées. Ce n'est donc pas une contradiction avec 0,35 : ce sont deux grandeurs. Le défaut (même terre globale pour chaque zone) reste réel ; l'effet est plus petit que les −0,1 K annoncés (terre polaire émergée de l'ordre de 0,45 à 0,5).

**Correction amendée.** Une seule table de zones (x₀, x₁, aire, ⟨P₂⟩), lue partout. L'état initial est calculé à partir d'elle, et dTzones va sous une clé DATA. resoudre lit DATA directement ; seul dT est une variable de travail, à commenter comme telle. Pour la terre de zone de l'ALBÉDO, il faut la terre ÉMERGÉE de la zone au niveau marin de l'époque, et non CALOTTES.geographie().continent, qui compte les plateaux sous −1 000 m. Il faut donc deux clés distinctes : continent (support des calottes) et terre émergée (albédo, saisons, part continentale de facteurGlaceZones).

#### 35. Calotte à 0,85 toute l'année dans le bilan radiatif, mais 0,70 ou 0,50 pour sa fonte

*basse · valeur_double · verdict : **plausible***  
`API_BILAN/physics/meridien.js:137-144, 162 ; API_BILAN/albedo/calculations_albedo.js:298, 764 ; API_BILAN/physics/calottes.js:247`

**Constat.** Une même surface, la calotte qui fond, a deux albédos dans le même appel. Le co-albédo de zone (meridien l.162) et le global (l.764) lui donnent 🪩🍰❄️ = 0,85 toute l'année. L'énergie de fonte de la même calotte (absorbe, l.140-141, utilisée par calottes.js:247) est calculée avec 0,70 (neige mouillée) puis 0,50 (glace nue).

**Effet.** Sur la zone d'ablation, l'absorption du bilan de zone est sous-estimée (Δα de 0,15 à 0,35 sur la part qui fond). La zone est trop froide, ce qui pousse T₂ dans le sens de l'observation. Effet faible au 📱 (Antarctique sans ablation), plus fort pour les calottes glaciaires de N_mid ; inconnu par lecture.

**Correction proposée.** Dans Rg, prendre pour la calotte l'albédo moyen pondéré par l'énergie de son état de surface (neige sèche, mouillée, glace nue), que le bilan de calotte calcule déjà (part p, degrés-jours). Une seule valeur pour le bilan radiatif et pour la fonte.

**Vérification.** Les deux valeurs existent : meridien.js:162 et calculations_albedo.js:764 prennent 0,85 ; absorbe (meridien.js:137-144) prend 0,70 et 0,50. Mais elles ne portent pas sur la même chose. Dans calottes.js:247, absorbe ne multiplie que E, l'ANOMALIE d'insolation de l'orbite par rapport à 1950, et seulement sur les jours de fonte (fond, l.229-232), au prorata p neige/glace. La fonte de base vient des degrés-jours empiriques, qui contiennent implicitement l'albédo réel. 0,70 ou 0,50 sur les jours de fonte et 0,85 en moyenne annuelle de toute la calotte ne se contredisent donc pas. Le défaut réel est que le bilan radiatif de zone ignore l'assombrissement des zones d'ablation en saison de fonte. Le sens annoncé est juste : 0,85 trop clair, zone trop froide. La grandeur n'est pas évaluée par lecture ; elle est faible au 📱.

**Correction amendée.** Pour la calotte dans Rg_z, prendre l'albédo pondéré par l'insolation sur l'année et sur sa surface : Σ_nœuds S·[(1−fond)·0,85 + fond·(p·0,70 + (1−p)·0,50)]/Σ S. fond et p sont déjà calculés par bilanPoint ; il faut les exposer par bande. Il ne s'agit pas d'une « même valeur » pour la fonte de l'anomalie, qui reste aux jours de fonte.

#### 36. Point de gel de l'eau de mer appliqué à la neige des continents

*basse · validite · verdict : **confirme***  
`API_BILAN/physics/physics.js:286, 348-364, 371-372`

**Constat.** La glace saisonnière des continents (part continentale des moyennes latitudes, amplitude 25 K ; terres polaires) se déclenche à T_FREEZE_SEAWATER_K = 271,15 K, alors que la neige tient sous 273,15 K, la fusion de la glace pure.

**Effet.** Le seuil de neige continentale est trop froid de 2 K, sur une amplitude de 25 K : e_mid continental sous-estimé de quelques % d'énergie de zone.

**Correction proposée.** 273,15 K pour la part continentale (une constante de fusion de la glace pure, nommée une seule fois), 271,15 K pour la mer.

**Vérification.** physics.js:350-351 (T_thresh_mid) et :286 (fractionGelee, pour toutes les bandes) utilisent EARTH.T_FREEZE_SEAWATER_K = 271,15 K (l.449), y compris pour la part continentale à 25 K d'amplitude (l.363, l.371). La neige au sol ne tient que sous 273,15 K, la fusion de la glace pure. Ordre de grandeur : d(temps)/dT ≈ 1/(π·amp) = 0,0127 K⁻¹ à u ≈ 0, donc 2 K donnent ≈ 0,025 de l'année : « quelques % », conforme.

**Correction amendée.** 273,15 K (constante nommée une seule fois) pour la part continentale, 271,15 K pour la mer. Aujourd'hui, seule la zone mid sépare terre et mer (l.360-363, 371-374). Les zones pol et trop doivent l'être aussi, avec leur terre émergée de zone (voir le constat 14), sinon la correction ne s'applique qu'aux moyennes latitudes.

### Volet : Contrôles 🎯 et statuts

#### 37. La courbe cyan (🎯) fixe la glace saisonnière de 🛖, 🚂 et 📱 à chaque clic, et la graine du clic frise

*haute · cible_circulaire · verdict : **confirme***  
`API_BILAN/config/configTimeline.js:2145, 1701-1706 ; API_BILAN/api.js:46 ; API_BILAN/convergence/calculations_flux.js:246, 252, 311-312 ; API_BILAN/albedo/calculations_albedo.js:340-343, 388-399, 404, 509-511, 451 ; API_BILAN/data/episteme.js:470-471, 196, 480-482`

**Constat.** EPOCH['🌡️🧮'] est un accesseur sur la courbe cyan d'Histoire à ▶ : `cyan(EP, EP['▶'])[2] + 273.15` (configTimeline.js:2145). C'est la même courbe qui sert de 🎯 (histoire:instrumental, histoire:snyder, PhanDA) et de fourchette tC du banc. Elle entre dans le calcul par deux voies.
(1) Graine du solveur au clic frise (api.js:46, calculations_flux.js:246). La config le dit elle-même : « leur graine SÉLECTIONNE UNE BRANCHE » (configTimeline.js:1705-1706).
(2) À CHAQUE run, clic frise ET clic time : api.prepare → initForConfig → calculateT0 met la phase à 'Init' (calculations_flux.js:252, 311), puis calculateAlbedo calcule un instantané de glace de surface à T = cyan(▶) : `STATE._iceSurfSnapshotPreSearch01 = min(cap, ICE_FORMULA_MAX_FRACTION × computeIceTempFactor(T_seed_K).ice_tf)` (calculations_albedo.js:388-399). La glace saisonnière qui entre dans l'albédo vaut ensuite instantané × (1 − f) + équilibre(T) × f, avec f = 1 − exp(−|▶ − ◀| / tauGlaceAns) (l. 340-343, 509-511). Poids de la cible : 🛖 exp(−11 450/50 000) = 0,795 ; 🚂 exp(−250/50 000) = 0,995 ; 📱 exp(−100/50 000) = 0,998. seaIceFrac (l. 451) reste nul tant que T > 271,15 K, donc rien ne corrige.
Les liens de la graine (episteme.js:470-471, kienert2013/charnay2017 🔢 « référence des graines ») ne disent pas que la graine EST la cible, et aucun lien ne déclare l'instantané. Le contrôle est donc circulaire : pour 🛖, 🚂 et 📱, la glace saisonnière de l'albédo planétaire est calculée, par la formule du modèle, à la température qu'on vérifie. La comparaison frise/chaîne ne peut pas le voir : les deux runs partent du même instantané.

**Effet.** Sur 🛖, 🚂 et 📱, y compris les tics 2000 → 2100 de la chaîne orange, la glace saisonnière ne répond à la température du modèle qu'à 0,2–20 %. La rétroaction glace–albédo saisonnière est coupée et l'albédo est tiré vers celui de la cible. Ordre de grandeur par lecture : à 📱, d(ice_tf)/dT ≈ −(0,134/30 + 0,366 × 0,30/50) ≈ −0,007 K⁻¹ (rampes 2 × 15 K et 2 × 25 K), soit quelques dixièmes de W m⁻² K⁻¹ de rétroaction retirée (à mesurer). Sens : vers la cible, et sensibilité 2000–2100 sous-estimée. Le méridien voit au même moment une autre glace pour la même zone (meridien.js:152, facteurGlaceZones à la T du modèle). Pour les époques de plus de ~0,3 Ma, le poids est < 0,003 : sans effet.

**Correction proposée.** Glace saisonnière : supprimer l'inertie de 50 ka, puisqu'elle répond dans l'année. Prendre l'équilibre à la T courante, et une seule glace dans DATA, lue par l'albédo ET par le méridien. Si l'on veut une inertie de stock, la porter comme les calottes : un état daté dans DATA, parti de l'état du clic précédent, jamais de EPOCH['🌡️🧮']. Graine du clic frise : soit déclarer dans episteme qu'elle EST la courbe cyan (statut ❔, usage 🔢, liens histoire:* déclarés comme entrée qui choisit la branche), soit la remplacer par une graine indépendante de la cible.

**Vérification.** Relu, et chaque maillon tient. configTimeline.js:2145 : EP['🌡️🧮'] = cyan(EP, EP['▶'])[2] + 273,15. l.2149 : B.tC est la bande de la même courbe. Chaque run passe par api.run → prepare → initForConfig (sync_panels.js:262, api.js:65), et cela vaut aussi au clic time. calculateT0 pose '🧮⚧' = 'Init' (calculations_flux.js:252), puis initForConfig rappelle calculateAlbedo en 'Init' (l.311-312). calculations_albedo.js:388-399 calcule alors T_seed_K = EPOCH['🌡️🧮'], puis _iceSurfSnapshotPreSearch01 = min(cap, ICE_FORMULA_MAX_FRACTION(=1) × computeIceTempFactor(T_seed).ice_tf), et _iceMassSnapshot = calcGlaceEquilibre(T_seed). l.509-510 : cible = snapshot × (1 − f) + équilibre(T) × f, avec f = 1 − exp(−|▶ − ◀|/50 000) (l.340-343). Cette valeur entre dans l'albédo planétaire par ice_surface (l.604, 648, 763). Durées relues (l.1428-1496) : 🛖 11 450 ans, 🚂 250, 📱 100. Poids du snapshot : 0,795 / 0,995 / 0,998. Sur 📱, la part saisonnière n'est pas écrasée par les calottes : ice_tf ≈ 0,134 × 0,53 + 0,366 × 0,30 × 0,27 ≈ 0,10, contre calotte_surface ≈ 0,031 (l.648). seaIceFrac (l.451) vaut 0 au-dessus de 271,15 K. Le méridien lit e_z de facteurGlaceZones à la T du modèle, sans mélange (meridien.js:152, 160-162) : il voit donc une autre glace. Au clic time, EPOCH reste 📱 : le snapshot vaut glace(cyan(2000)) pour tous les tics de 2025 à 2100. La pente −(0,134/30 + 0,366 × 0,30/50) = −0,0067 K⁻¹ est refaite. episteme.js:470-471 ne dit pas que la graine est la courbe cyan, et aucun lien ne déclare le snapshot. Le commentaire l.380-386 avoue même qu'il sert de « repère calibration-stable ».

**Correction amendée.** Correction juste, mais incomplète. (1) Supprimer aussi l'instantané de masse _iceMassSnapshotPreSearch01 (l.387, 403-404). Les deux instantanés vivent dans window.STATE, donc hors de DATA, ce qui est une seconde entorse à la référence unique. (2) La glace saisonnière unique doit sortir d'UN appel à facteurGlaceZones à la T courante, rangé dans DATA. L'albédo y lit ice_tf × rapport_ensoleillement, le méridien e_z, tous deux issus de ce même objet. (3) api.js:85-98 (snapshot de diagnostic) lit tauGlaceAns et les instantanés : le retirer en même temps, sinon il rendra NaN sans planter. (4) Remesurer 🛖, 🚂 et 📱 ainsi que la pente 2000-2100 après le retrait : seules ces trois époques ont un poids non nul.

#### 38. Amplitudes saisonnières 15/25/3 K : un calage de fait, alors que la mesure UDel de cette même entrée est rangée en 🎯

*haute · statut_mal_declare · verdict : **confirme***  
`API_BILAN/physics/physics.js:162-179, 256, 344-346 ; API_BILAN/physics/meridien.js:145-154 ; API_BILAN/data/episteme.js:72-74, 149, 150 ; API_BILAN/physics/saisons.js:22-25`

**Constat.** Les demi-amplitudes de zone posées « de mémoire » (physics.js:173-179 : pôle 15, moyennes latitudes 25, tropiques 3 K, × sin ε / sin 23,44°) sont le cycle annuel des TERRES que lisent les calottes (meridien.js:154 : a1 = f['amp_' + zone], la même valeur pour les deux hémisphères). Le cycle calculé (saisons.js, ⚛) existe, mais il n'est pas utilisé parce que « lu par les calottes, il fait basculer le 1er clic 🐾 en boule de neige » (episteme.js:73 ; physics.js:169-172 ; meridien.js:145-148). La valeur est donc gardée pour son effet sur le résultat : c'est un calage (🔧), déclaré ⚠️ 📌 et ❔ 📌.
UDel (episteme.js:74 et 149, ❔ 🎯) ne contrôle pas le modèle : c'est la mesure de l'ENTRÉE elle-même. Mesuré N_pol 18,8 / S_pol 12,1 / N_mid 14,3 / S_mid 6,5 / tropiques 4,0 K ; posé 15 / 15 / 25 / 25 / 3 K. Écart : N_mid +75 %, S_mid × 3,8. Même chose pour le retard posé de 30 j (physics.js:256) face aux 28 j mesurés (episteme.js:150). Ce n'est pas circulaire, mais la hiérarchie mesure > « de mémoire » est inversée.

**Effet.** Degrés-jours d'une sinusoïde avec le σ de Seguinot, recalculés :
- T̄ = −5 °C : 2 059 °C·j/an à 25 K contre 866 à 14,3 K (× 2,4) ;
- T̄ = −10 °C : 1 324 contre 281 (× 4,7) ;
- avec 8 mm/°C·j à −5 °C : 16,5 contre 6,9 m d'eau par an.
La fonte de N_mid et S_mid, là où naissent Laurentide, Eurasie et Patagonie, est donc pilotée par une valeur sans source gardée pour éviter la boule de neige. L'amplitude de S_mid est surestimée d'un facteur ~4.

**Correction proposée.** Déclarer tout de suite usage 🔧 : « gardé parce que le cycle calculé et la mesure font basculer 🐾 ». Ensuite, une seule référence par bande et par hémisphère, dans DATA : le cycle calculé (saisons.js, ⚛) ou, à défaut, la mesure UDel relevée par un script versionné (📡 📌). Retirer EARTH.SEASONAL_AMP_*. UDel ne reste 🎯 que pour le cycle calculé. Si la boule de neige revient, ce sont le pôle trop chaud et N_mid au bout polaire (déjà connus) qu'il faut corriger, pas l'amplitude.

**Vérification.** physics.js:173-179 : 15 / 25 / 3 K. physics.js:166-172, episteme.js:73 et meridien.js:145-148 disent que le cycle calculé n'est pas lu parce que, côté calottes, il fait basculer 🐾 en boule de neige. meridien.js:154 : a1 = f['amp_' + b.zone], la même valeur pour N et S. episteme.js:74 : UDel est rangé ❔ 🎯 alors qu'il mesure l'entrée elle-même. Écarts refaits : 25/14,3 = 1,75 et 25/6,5 = 3,85. Retard posé de 30 j (physics.js:256) contre 28 j (episteme.js:150). Degrés-jours refaits avec le code de bilanPoint (24 nœuds, σ = 1,66 − 0,15 min(T,0)) : T̄ = −5 °C : 2 061 contre 866 °C·j/an ; T̄ = −10 °C : 1 322 contre 281. Avec 8 mm : 16,5 contre 6,9 m. Le sens est cohérent : 25 K fait plus fondre que le cycle calculé (16,5 K sur N_mid) et retient la boule de neige.

**Correction amendée.** Deux précisions. (1) Seul le CYCLE CALCULÉ a été essayé et fait basculer 🐾 (episteme.js:73, physics.js:169-172). Rien dans le code ne montre que la mesure UDel ait été essayée comme entrée. La déclaration 🔧 doit donc dire « gardé parce que le cycle calculé fait basculer 🐾 », sans « et la mesure ». (2) EARTH.SEASONAL_AMP_* porte aujourd'hui DEUX grandeurs sous un seul nom. Pour les calottes, c'est la demi-amplitude annuelle des terres. Pour la rampe de glace saisonnière de facteurGlaceZones, c'est la largeur qui « tient lieu de l'étalement en latitude de la zone » (physics.js:166-168). On ne peut pas la retirer d'un bloc. Le cycle des terres des calottes passe à une clé DATA par bande ET par hémisphère (cycle calculé, ou UDel relevé par un script versionné, 📡 📌). La largeur de rampe reste une clé distincte, déclarée ⚠️ 🔧, jusqu'à une glace de mer par latitude. UDel ne reste 🎯 que pour le cycle calculé.

#### 39. T₂ = −28 °C (🎯) n'est que l'image du co-albédo par D, que North a calé pour les faire coïncider

*moyenne · cible_circulaire · verdict : **confirme***  
`API_BILAN/data/episteme.js:44-46, 476 ; API_BILAN/physics/meridien.js:14-15, 32-35, 129, 166-168 ; API_BILAN/doc/BIBLIOGRAPHIE.html:2064-2066 ; API_BILAN/physics/saisons.js:105`

**Constat.** meridien.js:168 : T₂ = 5 · échelle · Σ_z a_z J_z / (6D + B), linéaire dans les co-albédos de zone a_z. North a choisi D = 0,649 pour que le co-albédo observé de North & Coakley 1979 (0,681 − 0,202 P₂) donne T₂ = −28 °C (episteme.js:44 ; BIBLIOGRAPHIE.html:2064-2066 : « celui avec lequel D = 0,649 reproduit T₂ = −28 °C »).
Calcul refait avec S = 1 361 W/m², ε = 23,44°, J = −75,68 / 21,68 / 21,56 W/m² (trop/mid/pol) :
- co-albédos NC79 par zone 0,758/0,642/0,520 → T₂ = −26,93 °C ;
- co-albédos du modèle 0,692/0,674/0,573 → −21,22 °C (episteme dit −21,1) ;
- NC79 continu → −28,23 °C (North, avec Q = 334,4 : −28,08).
Le 🎯 T₂ (episteme.js:45) ne contient donc rien de plus que le 🎯 co-albédo (episteme.js:46). Ses 6,9 K d'écart se décomposent en 5,7 K d'écart de co-albédo et 1,2–1,3 K de troncature à trois zones : la cible −28,0 est hors d'atteinte, le modèle fait au mieux −26,9.
D est déclaré 📡 📌 alors que c'est un paramètre ajusté, et ajusté sur la grandeur même qu'on compare. B = 2,09 forme avec lui une paire calée ensemble (D/B = 0,310). B fait aussi doublon avec la pente d'OLR que le moteur calcule raie par raie (2,38 W m⁻² K⁻¹ en ciel clair, episteme.js:476). La même paire sert d'impédance au cycle saisonnier (saisons.js:105).

**Effet.** Aucun sur la courbe. Sur l'évaluation : deux 🎯 comptés pour un, et « pôle trop chaud » n'est qu'un autre nom du co-albédo trop plat. Pour mémoire, B du moteur (2,38) avec D inchangé : T₂ × 5,984/6,274 → −20,1 °C et pôle +0,8 K. À ne pas faire seul, puisque la paire est calée ensemble.

**Correction proposée.** D : statut 💻 (paramètre ajusté du modèle de North), usage 🔧 « calé sur T₂ observé avec le co-albédo NC79 ». Retirer T₂ des 🎯 et le garder en 📖 « image du co-albédo par D » : le seul contrôle du méridien est le co-albédo par zone. Déclarer B = 2,09 comme régression d'observations, distincte de la pente d'OLR du moteur : deux valeurs de ∂OLR/∂T à réconcilier en une seule clé de DATA.

**Vérification.** meridien.js:129 et 166-168 : T₂ = 5 · échelle · Σ coAlb_z J_z / (6D + B), linéaire en co-albédo. J refaits avec dailyMeanInsolation, S = 1 361, ε = 23,44 : −75,68 / 21,68 / 21,56 W/m². Résultats : NC79 par zone (0,758 / 0,642 / 0,520) → −26,93 °C ; modèle (0,692 / 0,674 / 0,573) → −21,23 °C ; NC79 continu → −28,23 °C. Les co-albédos de zone NC79 au poids solaire (0,758 / 0,642 / 0,520) sont refaits aussi. BIBLIOGRAPHIE.html:2064-2066 et meridien.js:15 et 34 confirment que D est calé par North sur T₂ = −28 avec ce co-albédo. Or episteme.js:44 le déclare 📡. Le 🎯 T₂ (l.45) n'apporte donc rien de plus que le 🎯 co-albédo (l.46). Écart à −28,0 : 5,7 K de co-albédo et environ 1,1 à 1,3 K de troncature à trois zones. saisons.js:105 lit bien NCC.B et NCC.D. Avec B = 2,38 : −20,24 °C (pas −20,1, qui partait des −21,1 d'episteme), pôle +0,80 K.

**Correction amendée.** Pour D et T₂, la correction est juste. Pour B, elle est fausse. B = 2,09 est une régression de l'OLR TOUS CIELS, nuages compris, sur la température de surface, à travers latitudes et saisons (NC79). Les 2,38 du moteur sont la pente globale en CIEL CLAIR (episteme.js:476). Ce n'est pas la même grandeur, et remplacer B par 2,38 serait une erreur. La référence unique à viser est la pente ∂OLR/∂T_s tous ciels que calcule le moteur, par zone, et elle doit être réajustée en paire avec D sur un même ajustement. D'ici là : B statut 📡 (régression d'observations), usage 📌, paire (B, D) déclarée « ajustée ensemble ». D en 💻 / 🔧. T₂ en 📖.

#### 40. « Briegleb » : rampes 263,15–268,15–273,15 K sans source, plafond à 268,15 K choisi d'après le banc ; albédos de glace de mer réutilisés pour la fonte des calottes

*moyenne · statut_mal_declare · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:177-204, 297-299 ; API_BILAN/physics/meridien.js:134-144 ; API_BILAN/physics/physics.js:594-601 ; API_BILAN/data/episteme.js:70, 274, 331 ; API_BILAN/doc/BIBLIOGRAPHIE.html:203-208`

**Constat.** brieglebIceAlbedoMature (l. 178-191) donne la neige profonde sous 263,15 K, puis une rampe vers 🪩🍰🧊 (0,70) jusqu'à 268,15 K, puis une rampe vers 🪩🍰🏊 (0,50) jusqu'à 273,15 K, sur la température ANNUELLE de zone. Ces deux rampes de 5 K ne sont pas la paramétrisation CCSM3 : de mémoire, à vérifier dans TN-463 §5, la baisse d'albédo y a lieu entre −1 et 0 °C de la température de surface instantanée (dT_mlt = 1 °C). Aucun lien ne source 263,15 ni 268,15 K.
brieglebIceAlbedoLocal (l. 203) plafonne T à 268,15 K : la glace saisonnière n'atteint jamais la branche de fonte. Ce plafond est justifié par la convergence (« pas de racine parasite »). L'ancien seuil a été retiré à cause du banc (l. 196-198 : « toutes les époques modernes −2 à −10 K hors fourchettes bench »). Ce sont des choix de forme faits sur la grandeur vérifiée (🔧), déclarés briegleb2004 💻 📌 (episteme.js:70) et warren1982 📡 📌 « ses trois segments » (episteme.js:331).
Par ailleurs, l'énergie absorbée par une calotte qui fond (Robinson & Goelzer) prend la neige mouillée = 🪩🍰🧊 (0,70, glace de mer froide CCSM3) et la glace nue = 🪩🍰🏊 (0,50, glace de mer à mares de SHEBA, Perovich 2002) (calculations_albedo.js:297-299 → meridien.js:140-141). Une même variable sert donc pour deux grandeurs, sans lien. Le projet cite pourtant l'albédo de la glace de glacier (cuffeyPaterson2010, tableau 5.2 : 0,34 pour la glace propre).

**Effet.** L'albédo de la glace saisonnière de zone, donc le co-albédo polaire, T₂ et les seuils de gel, dépend de seuils sans source. L'anomalie de fonte orbitale sur glace nue est ∝ (1 − α) : avec α = 0,34 au lieu de 0,50, elle augmenterait de ~30 % (valeur exacte inconnue tant que la mesure n'est pas relevée).

**Correction proposée.** Déclarer les rampes ⚠️ et le plafond 🔧 (choisi pour le banc et la convergence). Si Briegleb est la référence, reprendre sa forme (−1 → 0 °C sur la température de surface journalière, que le cycle annuel et fractionGelee fournissent déjà) au lieu de rampes sur la moyenne annuelle. Albédos de fonte des calottes : deux clés distinctes dans DATA (neige mouillée, glace de glacier) avec leurs mesures et leurs liens, séparées de celles de la glace de mer.

**Vérification.** calculations_albedo.js:178-191 : rampes de 5 K de 263,15 à 268,15 puis 273,15 K, sur une température annuelle de zone. Aucune source pour ces seuils : episteme.js:70 (briegleb2004 💻 📌) et 331 (warren1982 📡 « ses trois segments ») ne justifient pas ces températures. Warren 1982 est une revue des propriétés optiques de la neige. De mémoire, le schéma CCSM3 de TN-463 abaisse l'albédo entre −1 et 0 °C de la température de surface (dT_mlt = 1 °C), ce qui confirme le constat sans que je puisse le relire ici. l.203 : min(T, 268,15). l.297-299 → meridien.js:140-141 : la neige mouillée vaut 🪩🍰🧊 (0,70), la glace nue 🪩🍰🏊 (0,50), et physics.js:599 commente 🏊 « bare ice + melt ponds… Perovich (2002) SHEBA », c'est-à-dire de la glace de mer, réutilisée pour la glace de glacier.

**Correction amendée.** Deux nuances. (1) Le plafond à 268,15 K n'est pas justifié par le banc. l.199-202 le justifient par la monotonie et la convergence (« pas de racine parasite ») et par l'argument « glace saisonnière froide quand le soleil brille ». Ce qui a été retiré à cause du banc (l.196-198), c'est la porte d'établissement à 0,85 de la v1.2.63. Le plafond est donc à déclarer ❔ 🔢 (choix de forme pour la convergence) et la porte retirée à tracer en 🔧. Les rampes 263,15 / 268,15 restent ⚠️ 📌. (2) Effet : de mémoire, le tableau 5.2 de Cuffey & Paterson donne la glace propre sur une plage d'environ 0,34 à 0,51, qui contient 0,50. Les +30 % de fonte avec α = 0,34 sont la borne extrême ; vers le milieu de la plage (environ 0,43), c'est environ +14 %. Relever le tableau avant de chiffrer. Le reste de la correction est juste : deux clés DATA, neige mouillée et glace de glacier, avec leurs liens.

#### 41. Γ = 6,5 K/km des calottes : constante [OBS/CALIB] sans lien, au commentaire faux, en doublon du gradient que calcule le moteur

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/config/configTimeline.js:2048 ; API_BILAN/physics/calottes.js:276, 355, 370 ; API_BILAN/data/episteme.js:209`

**Constat.** troposphericLapseRateKPerM = 0,0065 est commenté « [OBS/CALIB] atmosphère standard, gradient thermique utilisé sous la coupure effective » (configTimeline.js:2048). Un grep sur API_BILAN montre qu'il n'est lu que par calottes.js:355, pour deux usages : la température d'un point de calotte T(x) − Γ z (l. 276) et la tolérance d'arrêt tolZ = 0,01 K / Γ (l. 370). Le commentaire décrit un usage qui n'existe plus, aucun lien episteme ne couvre cette valeur, et elle porte une étiquette de calage. Le moteur calcule pourtant son propre gradient (adiabatique humide, episteme.js:209) : deux valeurs pour la même grandeur. 6,5 K/km est le gradient de l'atmosphère libre standard, pas une mesure du gradient de surface sur une calotte.

**Effet.** L'effet est linéaire en altitude. À 3,1 km (surface antarctique moyenne du moteur : socle 430 m + 0,722 × H̄ 3 669 m), 1 K/km d'écart donne 3 K. À 9,8 K/km (l'adiabatique sèche, vers laquelle tend l'adiabatique humide au froid), ce serait −10 K. Sur les hautes terres de N_mid (2 101 m à 0 Ma) : −6,9 K. Le sens global est inconnu par lecture ; c'est un levier de premier ordre de la naissance et de l'accumulation.

**Correction proposée.** Une seule référence dans DATA : soit le gradient du profil du moteur (adiabatique humide à la température de la bande), soit une mesure du gradient de surface, avec son lien 📡. Retirer la constante de CONFIG_COMPUTE et son commentaire périmé.

**Vérification.** configTimeline.js:2048 : 0,0065, « [OBS/CALIB] … utilisé sous la coupure effective ». Un grep sur API_BILAN et CO2 ne trouve qu'un lecteur : calottes.js:355 (c.Gamma), utilisé l.276 (T − Γ max(0, z)) et l.370 (tolZ = 0,01 / Γ). Aucun lien episteme ne porte cette valeur ; seule la l.108 cite « 0,01 K / Γ ≈ 1,5 m ». La sensibilité linéaire est juste : 1 K/km d'écart vaut environ 3 K à 3 km ; à 2 101 m, (9,8 − 6,5) × 2,101 = 6,9 K.

**Correction amendée.** Chiffre à corriger : sur S_pol, le moteur ne prend pas le socle 430 m. geometrie (calottes.js:152) interpole haut_m + (socle_m − haut_m) × a/continent = 1 329 − 899 × 0,727 = 675 m. La surface moyenne vaut donc 675 + 0,722 × 3 669 ≈ 3,3 km, soit 3,3 K par K/km et environ −11 K à 9,8 K/km. Pour la correction : le profil adiabatique humide du moteur est le gradient de l'atmosphère libre, pas celui de la température de surface sur une calotte, qui est sous inversion. Le moteur porte déjà cette inversion à part (Jouzel & Merlivat, calottes.js:238). La référence unique la plus défendable est donc un gradient de surface MESURÉ sur calotte, avec son lien 📡 et une clé DATA documentée dans alphabet/dico. À défaut, le gradient du profil du moteur, déclaré ❔ « atmosphère libre appliquée à la surface ». Retirer la constante de CONFIG_COMPUTE.

#### 42. Deux diffusivités pour un seul transport méridien : North (0,649 sur T) et Siler (1,16·10⁶ m²/s sur h) ; le D de Siler est déclaré 📡

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/physics/meridien.js:32-35 ; API_BILAN/physics/calottes.js:82-83, 347-349 ; API_BILAN/data/episteme.js:80-83 ; API_BILAN/doc/BIBLIOGRAPHIE.html:2256`

**Constat.** Le profil T(x) vient de la diffusion de North : D = 0,649 W m⁻² K⁻¹, soit K = R² D g / (p_s c_p) = 2,54·10⁶ m²/s en équivalent sec, transport latent compris implicitement. Le flux de vapeur des calottes vient de la diffusion d'énergie humide de Siler : D = 1,16·10⁶ m²/s sur h = c_p T + L q.
Ramené en équivalent sec, le D de Siler vaut 1,16·10⁶ × (1 + (L/c_p) HR dq*/dT) = 1,27 / 1,40 / 1,76 / 2,66·10⁶ m²/s à 250 / 260 / 273 / 288 K (calcul refait avec HR = 0,77). Aux latitudes des calottes, c'est la moitié du transport de North pour le même gradient.
Les deux sont des ajustements : North sur T₂ observé, Siler sur la température zonale d'ERA-Interim, une réanalyse. Pourtant D_HUMIDE est déclaré 📡 📌 (episteme.js:81) et la diffusion ⚛ (episteme.js:80). Le 🎯 Arthern 2006 n'est pas circulaire : Siler n'ajuste ni P − E ni l'accumulation.

**Effet.** P − E des calottes ∝ D_HUMIDE. Avec une diffusivité humide cohérente avec le transport de North à 250–260 K, P − E serait multiplié par ~1,8–2 aux hautes latitudes (ordre de grandeur ; l'écart à Arthern est d'un facteur 6). Au-delà, inconnu par lecture.

**Correction proposée.** Une seule fermeture diffusive dans DATA, lue par meridien.js et par calottes.js : par exemple la diffusion de h de Siler pour T(x) ET pour P − E. La déclarer statut 💻, usage 🔧 : ajustée sur la température zonale, elle interdit donc de mettre T₂ en 🎯. Statut de la diffusion elle-même : ❔ (fermeture approchée), pas ⚛.

**Vérification.** K_North = D g R² / (p_s c_p) = 0,649 × 9,81 × 6,371e6² / (101 325 × 1 004) = 2,54·10⁶ m²/s, refait. Équivalent sec de Siler, 1,16e6 × (1 + (L/c_p) HR dq*/dT), refait avec pSatEau du moteur : HR = 0,77 → 1,26 / 1,40 / 1,84 / 2,67·10⁶ m²/s à 250 / 260 / 273 / 288 K ; HR = 0,735 (défaut de la jauge, fine_tuning_bounds.js:141) → 1,26 / 1,39 / 1,81 / 2,60. Le rapport à North vaut 0,50 à 0,55 entre 250 et 260 K, d'où le ×1,8 à 2,0 annoncé. calottes.js:82 et 347-349 : D_HUMIDE sur q. episteme.js:81 la déclare 📡 📌 alors que c'est un ajustement sur ERA-Interim (une réanalyse) ; l.80 range la diffusion en ⚛. Arthern 2006 n'est pas circulaire.

**Correction amendée.** Constat juste. La correction doit garder la PAIRE. Le D de North est calé avec B = 2,09 ; celui de Siler avec l'OLR linéaire de son propre article. Une fermeture unique dans DATA doit donc porter (D, A, B) d'un même ajustement, lue par meridien.js, calottes.js et saisons.js (qui lit aussi B et D, saisons.js:105). Prendre la diffusion de h de Siler pour T(x) rend le méridien non linéaire (q*(T)) : la solution fermée à deux modes est perdue, et il faut un solveur. Statuts : D (Siler) 💻 🔧, diffusion ❔ 📌.

#### 43. τ = 50 ka (Marshall & Clark) appliqué à la glace SAISONNIÈRE, en doublon de l'inertie physique des calottes

*moyenne · valeur_double · verdict : **confirme***  
`API_BILAN/config/configTimeline.js:2033 ; API_BILAN/albedo/calculations_albedo.js:313-343, 404, 501-511 ; API_BILAN/physics/calottes.js:377-394 ; API_BILAN/data/episteme.js:71 ; API_BILAN/doc/BIBLIOGRAPHIE.html:406-412`

**Constat.** tauGlaceAns = 50 000 porte l'étiquette « [OBS/CALIB] » (configTimeline.js:2033) et le lien marshallClark2002 💻 🎚️ « temps de réponse des calottes 10⁴–10⁵ ans » (episteme.js:71) ; la bibliographie écrit même « Calibre tauGlaceAns=50000 ».
Il ne s'applique pas aux calottes, qui ont maintenant leur propre inertie par conservation de la masse (calottes.js:377-394 : tau = ρ_i H̄ / max(accumulation, fonte)). Il s'applique à la glace saisonnière de surface et au stock 🍰💧🧊 (calculations_albedo.js:341-343, 404, 509-511), dont le temps de réponse est l'année.
50 ka n'est ni le milieu arithmétique (55 ka) ni le milieu logarithmique (31,6 ka) de 10⁴–10⁵ ans, et ce choix n'est pas déclaré. Le poids porte sur la durée de l'ÉPOQUE |▶ − ◀| (l. 340), pas sur le temps écoulé pendant le clic.

**Effet.** C'est par lui que passe la circularité de la glace saisonnière décrite plus haut (poids 0,8 à 0,998 sur 🛖, 🚂, 📱). Ailleurs, sans effet.

**Correction proposée.** Retirer ce mélange pour la glace saisonnière (équilibre à la T courante). L'inertie des calottes est celle de calottes.js, seule référence. Supprimer tauGlaceAns et iceInertiaFactor01, ou les réserver à un stock porté et daté dans DATA.

**Vérification.** configTimeline.js:2033 : 50 000 « [OBS/CALIB] ». episteme.js:71 : marshallClark2002 💻 🎚️. BIBLIOGRAPHIE.html:412 : « Calibre tauGlaceAns=50000 ». Seuls lecteurs : calculations_albedo.js:341 (fraction_fonte, appliquée à 🍰💧🧊 l.404 et à la glace de surface l.509-510) et api.js:88 (diagnostic). Les calottes ont leur propre inertie (calottes.js:377-394, tau = ρ_i H̄ / max(accumulation, fonte), avec intégration en sous-pas). Milieux de 10⁴–10⁵ refaits : 55 ka (arithmétique) et 31,6 ka (géométrique). Le poids porte bien sur |▶ − ◀| de l'époque (l.340), pas sur le temps du clic. C'est le même mécanisme que le constat 1.

**Correction amendée.** Retirer aussi l'instantané de masse (l.387, 403-404) et les variables STATE._ice*Snapshot*. Mettre à jour api.js:85-98, qui lit tauGlaceAns et iceInertiaFactor01 (h2o/calculations_h2o.js:305 n'en garde qu'un commentaire). Sinon, correction juste.

#### 44. Altitude de naissance : « quart le plus haut » du continent et interpolation linéaire vers le socle moyen, sans lien

*moyenne · statut_mal_declare · verdict : **confirme***  
`CO2/scripts/paleogeo/paleodem_zones.py:116-121, 316-326, 335-338 ; API_BILAN/physics/calottes.js:50-51, 143-153 ; API_BILAN/data/episteme.js:98 ; API_BILAN/data/paleogeo_zones.js`

**Constat.** haut_m est l'altitude moyenne du quart le plus haut du continent de la bande (paleodem_zones.py:325, `quart_haut`). La fraction 1/4 n'a ni source ni lien : episteme.js:98 ne déclare que la règle des ex-aequo, en ⚛ 🔢, comme un détail numérique. calottes.js:152 interpole ensuite le socle de la calotte linéairement en a/continent, de haut_m à socle_m ; ce choix n'est déclaré qu'en en-tête (l. 50-51). Valeurs à 0 Ma (paleogeo_zones.js) : N_mid haut_m 2 101 m contre socle_m 697 m ; S_pol 1 329 m contre 430 m.

**Effet.** Pour N_mid, l'écart entre hautes terres et socle moyen est de 1,4 km, soit 9,1 K à 6,5 K/km sur le point de naissance. Prendre un autre quantile (10 % ou 50 %) déplacerait la naissance de plusieurs K. Cette sensibilité n'a jamais été mesurée.

**Correction proposée.** Déclarer ce choix ❔ 📌 (choix de modélisation). Mieux : porter l'hypsométrie de chaque bande (déciles d'altitude du PaleoDEM) dans PALEOGEO et intégrer le bilan de naissance sur elle. La calotte naîtrait alors là où le bilan devient positif, sans fraction arbitraire.

**Vérification.** paleodem_zones.py:116-121 (quart_haut : w.sum()/4) et 316-326 (haut_m = moyenne pondérée de ce quart). paleogeo_zones.js à 0 Ma, relu : N_mid haut 2 101 m contre socle 697 m ; S_pol 1 329 contre 430 m. calottes.js:152 : socle = haut_m + (socle_m − haut_m) × min(1, a/continent), interpolation déclarée seulement en en-tête et en JSDoc (l.50-51, 143). episteme.js:98 ne déclare que la règle des ex-aequo (⚛ 🔢). Pire, episteme.js:159 attribue « hautes terres par bande » à scoteseWright2018 en 🦴 📌, comme si la fraction 1/4 était une donnée. (2 101 − 697) × 6,5/1 000 = 9,1 K, refait. La sensibilité au quantile n'est pas mesurée, et le constat le dit.

#### 45. σ de Seguinot, facteurs de Braithwaite et T_inv de Jouzel & Merlivat : déclarés 📡, alors qu'ils viennent d'une réanalyse, d'un modèle, ou d'une régression locale extrapolée

*moyenne · statut_mal_declare · verdict : **confirme***  
`API_BILAN/data/episteme.js:82, 116, 121, 124, 157 ; API_BILAN/physics/calottes.js:74-77, 238 ; API_BILAN/doc/BIBLIOGRAPHIE.html:2167-2172, 2189-2195`

**Constat.** (a) σ = 1,66 − 0,15 T (episteme.js:121, 📡 📌) est une régression sur ERA-40 (BIBLIOGRAPHIE.html:2195). C'est une réanalyse, donc un modèle assimilé, peu contraint par des stations sur l'intérieur du Groenland : statut 💻/🦴, pas 📡. Pas de circularité : aucun 🎯 ne porte sur le Groenland.
(b) Braithwaite 1995 s'intitule « Positive degree-day factors for ablation on the Greenland ice sheet studied by energy-balance modelling » (BIBLIOGRAPHIE.html:2170). Les facteurs sont donc SIMULÉS par un bilan d'énergie (💻), pas « mesurés » comme le disent episteme.js:116 et 124. Non vérifié par lecture : il me semble que le facteur de la glace y varie avec le climat, plus fort au froid. Si c'est le cas, la valeur unique 8 serait la valeur conventionnelle de Reeh 1991 / Huybrechts, pas un résultat de l'article.
(c) T_inv = 0,67 T_s + 88,9 K (episteme.js:82, 📡) est une relation antarctique. Elle est appliquée à toutes les calottes et aux terres nues où elles naissent (calottes.js:238), sans que l'extrapolation soit déclarée (❔).

**Effet.** Rien ne change sur la courbe ; c'est la part « mesurée » de la fonte et de la neige qui est surévaluée dans les déclarations. Pour (b), si le facteur de la glace dépend du climat, la fonte des marges froides du Quaternaire est sous-estimée ; l'ampleur est inconnue par lecture.

**Correction proposée.** σ : statut 💻 (réanalyse). Facteurs degrés-jours : statut 💻, et relire l'article pour la valeur et sa dépendance ; si Braithwaite donne une loi DDF(T), c'est elle qui fait référence. T_inv : ajouter un lien ❔ « relation antarctique appliquée hors d'Antarctique ».

**Vérification.** (a) BIBLIOGRAPHIE.html:2195 et episteme.js:121 : σ est une régression sur ERA-40, une réanalyse, donc 💻 et non 📡. (b) Le titre (BIBLIOGRAPHIE.html:2170) est « … studied by energy-balance modelling » : les facteurs sortent d'un modèle de bilan d'énergie, et non de mesures comme le disent episteme.js:116, 124 et 157 et calottes.js:31-33. La dépendance du facteur de la glace au climat n'est pas vérifiable par lecture ; le constat l'admet. (c) calottes.js:238 applique Tinv = max(T, 0,67 T + 88,9) à tous les points de toutes les bandes, terres nues comprises. episteme.js:82 et 157 n'ont aucun lien ❔ pour cette extrapolation hors d'Antarctique. Aucune circularité : rien n'est 🎯 sur le Groenland.

#### 46. Précision du connu sur τ₀ : le moteur met 45·10⁶ km³ sur l'aire de Bedmap2, et dans sa géométrie aucun τ unique ne ferme les deux calottes

*moyenne · valeur_double · déjà connu · verdict : **confirme***  
`API_BILAN/physics/calottes.js:72, 145-153, 188-196 ; API_BILAN/config/configTimeline.js:185 ; API_BILAN/data/paleogeo_zones.js ; CO2/scripts/paleogeo/paleodem_zones.py:44-45 ; API_BILAN/data/episteme.js:86, 90`

**Constat.** Volumes refaits avec les formules du moteur (geometrie, volume, 24 points), sur la carte 0 Ma et les aires de CALOTTES_ACTUELLES :
- S_pol (continent 0,495, x_continent 0,9626) : W = 2 111 km, h₀ = 6 850 m, H̄ = 3 669 m, V = 45,1·10⁶ km³, contre 26,54·10⁶ posés par Bedmap2 (H̄ 2 159 m) : × 1,70 ;
- N_pol (continent 0,801, x_continent 0,9262) : W = 260 km, H̄ = 1 571 m, V = 2,70·10⁶ km³, contre 2,99·10⁶ (BedMachine).
À aire fixée, V ∝ √τ : il faudrait τ ≈ 34,6 kPa pour l'Antarctique et ≈ 122,6 kPa pour le Groenland. Avec la géométrie en bande, aucun τ₀ commun ne ferme les deux calottes ; les 42,6 kPa de la fermeture du script donnent 29,5·10⁶ et 1,76·10⁶ km³.
Ces deux volumes mesurés seraient un contrôle gratuit que le moteur ne fait jamais (partiellement circulaire pour l'Antarctique, dont le volume a servi à décharger le socle). Quant à Bedmap2, il n'est 🎯 nulle part : son aire est bien déclarée comme entrée (episteme.js:86, 90), sans circularité.

**Effet.** La surface antarctique du moteur est plus haute de 0,722 × (3 669 − 2 159) ≈ 1,1 km que ne l'imposerait le H̄ mesuré, soit ≈ −7 K à 6,5 K/km. Cela écrase p_sat(T_inv) et contribue au déficit d'accumulation (23 contre 143 kg m⁻² an⁻¹).

**Correction proposée.** Déclarer V(Bedmap2) et V(BedMachine) en 🎯 du moteur, ou bien fermer τ sur eux (ils deviennent alors une entrée 🔧). Garder une seule valeur de τ par calotte dans DATA, la même pour le script et pour le moteur : cela règle aussi le connu n° 2.

**Vérification.** Refait en chargeant calottes.js et paleogeo_zones.js, avec la même quadrature que volume(), 24 points. S_pol, a = 0,35984 (12,295·10⁶ km²) : W = 2 111 km, h₀ = 6 850 m, H̄ = 3 669 m, V = 45,11·10⁶ km³ (×1,70 sur 26,54). N_pol, a = 0,050239 : W = 260 km, H̄ = 1 571 m, V = 2,70·10⁶ km³. V ∝ √τ à aire fixée : τ = 34,6 kPa et 123,0 kPa. À 42,6 kPa : 29,45 et 1,76·10⁶ km³. 0,722 × (3 669 − 2 159) = 1 090 m, ×6,5 K/km = 7,1 K. Le sens sur l'accumulation est bon : p_sat(T_inv(T_s)) décroît avec T_s (calottes.js:241). Bedmap2 n'est 🎯 nulle part (episteme.js:86, 90, 163 : 📌).

**Correction amendée.** Précision : sur S_pol, le socle du moteur à cette aire vaut 675 m (interpolation calottes.js:152), pas 430 m. L'écart de surface dû à H̄ (≈ 1,1 km, ≈ −7 K) est inchangé. Fermer τ sur ces volumes en fait une entrée 🔧 pour 0 Ma. Que l'Antarctique demande 35 kPa et le Groenland 123 kPa signale d'abord la géométrie en bande (partage des eaux au pôle sur 2 111 km). Cela doit être déclaré ❔ avant de poser deux τ. Une seule clé τ par calotte dans DATA, lue par le moteur ET par paleodem_zones.py (regex).

#### 47. Cycle calculé : 75 m et 6,1 m/s pris dans McKinnon et al. 2013, contrôlés par le retard de 28 j du même article

*basse · cible_circulaire · verdict : **plausible***  
`API_BILAN/physics/saisons.js:41-43 ; API_BILAN/data/episteme.js:142, 150 ; API_BILAN/doc/BIBLIOGRAPHIE.html:2074`

**Constat.** H_MELANGE_M = 75 est commenté « mesure (North et al. 1981 ; McKinnon et al. 2013) » (saisons.js:41), et VENT_M_S = 6,1 vient des rétrotrajectoires HYSPLIT. episteme.js:142 les déclare 📡 📌, avec la mention « ⚠️ à relire dans l'article ». Le 🎯 du retard des terres, 28 j (episteme.js:150), vient du même article.
Une couche de mélange unique de 75 m n'est pas une mesure : elle varie de quelques dizaines à quelques centaines de mètres selon la saison et le lieu. C'est une valeur représentative (❔). Je ne peux pas trancher par lecture : si McKinnon, ou North et al. 1981, ont choisi 75 m pour reproduire l'amplitude ou la phase observées, alors le 🎯 de 28 j, et en partie celui d'UDel, deviennent circulaires. u, tiré des rétrotrajectoires, est indépendant des températures.

**Effet.** Diagnostic seulement : le cycle calculé n'est pas lu. Inconnu par lecture.

**Correction proposée.** Relire McKinnon 2013 et North et al. 1981 §6. Si 75 m y est ajusté sur le cycle observé : statut 🔧 et retrait du 28 j des 🎯. Sinon : statut ❔ « valeur représentative ».

**Vérification.** Les faits de code sont exacts. saisons.js:41-43 : H_MELANGE_M = 75 « mesure », VENT_M_S = 6,1. episteme.js:142 : 📡 📌 « ⚠️ à relire ». episteme.js:150 : 28 j 🎯, même article. Une profondeur unique de couche de mélange est une valeur représentative, ❔ et non 📡. Mais la circularité dépend de la façon dont North et al. 1981 ou McKinnon et al. 2013 ont obtenu les 75 m (ajustés sur l'amplitude ou la phase, ou non). Je ne peux pas la trancher par lecture, et le constat le dit. Aucun effet sur la courbe : le cycle n'est lu qu'en diagnostic (meridien.js:180).

#### 48. « Le moteur n'a pas la densité de l'eau de mer » : c'est faux, saisons.js en porte une (1 025) ; deux densités pour l'eau de mer

*basse · valeur_double · verdict : **confirme***  
`API_BILAN/data/episteme.js:91 ; CO2/scripts/paleogeo/paleodem_zones.py:29, 194-198, 211-213 ; API_BILAN/physics/saisons.js:39 ; API_BILAN/physics/physics.js:50`

**Constat.** episteme.js:91 et paleodem_zones.py:29 justifient l'emploi de CONST.RHO_WATER = 1 000 (physics.js:50) pour la flottaison et pour la recharge d'eau du socle antarctique en disant que « le moteur n'a pas la densité de l'eau de mer ». Or saisons.js:39 porte RHO_EAU_MER = 1 025 (TEOS-10). L'approximation déclarée repose sur une prémisse fausse, et l'eau de mer a deux densités dans le moteur.

**Effet.** Recharge z = u / (1 − ρ_w/ρ_m) : le facteur passe de 1,435 à 1,451 (+1,1 %) sur les socles restés sous la mer. Seuil de flottaison ρ_w (−b) : +2,5 %. Effet faible.

**Correction proposée.** Une seule constante de l'eau de mer (CONST ou DATA), lue par saisons.js et par paleodem_zones.py (par regex, comme RHO_GLACE). Retirer la mention ❔.

**Vérification.** saisons.js:39 : RHO_EAU_MER = 1025 (TEOS-10). episteme.js:91 et paleodem_zones.py:29 et 196-197 affirment le contraire, et decharger ou glace() utilisent RHO_WATER = 1 000 (physics.js:50). Refait : 1/(1 − 1 000/3 300) = 1,4348 et 1/(1 − 1 025/3 300) = 1,4505, soit +1,1 % ; seuil de flottaison ×1,025.

#### 49. epica_etats.py recopie N₂, O₂ et ses propres masses molaires au lieu de les lire dans le moteur

*basse · reference_unique · verdict : **confirme***  
`CO2/scripts/quaternaire/epica_etats.py:20-25 ; API_BILAN/physics/physics.js:45-48 ; API_BILAN/config/configTimeline.js:172, 1334`

**Constat.** N2_KG = 3,878e18 et O2_KG = 1,0815e18 (l. 21) sont des copies de N2_1PAL_KG (configTimeline.js:172) et du ⚖️🫁 de 🦣 (l. 1334). Les masses molaires du script (28,0134 / 31,9988 / 44,0095 / 16,0425 g/mol, l. 20) diffèrent de celles du moteur (28,01 / 32,00 / 44,01 / 16,04, physics.js:45-48). Les masses 🔁 sont donc écrites avec un jeu de constantes et relues en ppm avec l'autre. paleodem_zones.py, lui, lit les constantes du moteur par regex. Enfin, l'argument s'appelle age_b2k alors qu'il est en années avant 2025 (l. 23-25).

**Effet.** De l'ordre de 10⁻⁴ en relatif (≈ 0,03 ppm) : négligeable aujourd'hui, mais un écart silencieux si la config change.

**Correction proposée.** Lire N2_1PAL_KG, le ⚖️🫁 de 🦣 et les CONST.M_* dans les fichiers du moteur (par regex, comme paleodem_zones.py), et renommer l'argument.

**Vérification.** epica_etats.py:20-21 : M = 28,0134 / 31,9988 / 44,0095 / 16,0425 g/mol, N2_KG = 3,878e18 et O2_KG = 1,0815e18. Ce sont des copies de N2_1PAL_KG (configTimeline.js:172) et du ⚖️🫁 de 🦣 (l.1334). physics.js:45-48 : 28,01 / 32,00 / 44,01 / 16,04. Écarts relatifs : N₂ 1,2·10⁻⁴, O₂ 3,7·10⁻⁵, CO₂ 1,1·10⁻⁵, soit environ 0,03 ppm à 280 ppm. paleodem_zones.py:24-31 lit bien le moteur par regex. l.25 : a = age_b2k − 75, donc l'argument est en années avant 2025 (l'en-tête l.4 le dit), et « b2k » est un faux nom.

#### 50. Trois constantes solaires et deux « Soleil de l'époque » dans la chaîne orbite → méridien → calottes

*basse · reference_unique · verdict : **confirme***  
`CO2/static/astronomie.js:24 ; API_BILAN/physics/physics.js:200 ; API_BILAN/convergence/compute.js:165-172, 181 ; API_BILAN/physics/meridien.js:127 ; API_BILAN/physics/saisons.js:65, 87 ; API_BILAN/physics/calottes.js:366`

**Constat.** La même grandeur a trois définitions :
- astronomie.js:24 : SOLAR_CONSTANT = 1361 (anomalies d'insolation lues par orbite.js) ;
- physics.js:200 : EARTH.SOLAR_CONSTANT_REF_W_PER_M2 = 1361 (J_z, forcage2, échelle du méridien et du cycle) ;
- compute.js:165 : GOUGH_L_SUN_W = 3,828e26, soit 1 361,2 W/m² à 1 UA.
Le rapport « Soleil de l'époque / Soleil actuel » vaut 🧲☀️/1361 dans meridien.js:127 (facteur de Kepler compris) et 🔋☀️/goughLuminosity(0) dans calottes.js:366 (sans). Chacun est juste pour son usage, mais cela fait trois noms pour une seule grandeur.

**Effet.** Moins de 0,02 % aujourd'hui.

**Correction proposée.** Une clé de référence dans DATA (le flux à 1 UA de Gough à t = 0), lue par astronomie.js, physics.js et calottes.js.

**Vérification.** astronomie.js:24 : 1 361. physics.js:200 : EARTH.SOLAR_CONSTANT_REF_W_PER_M2 = 1 361. compute.js:165 : 3,828e26 W, soit 3,828e26 / (4π × 1,495978707e11²) = 1 361,2 W/m². meridien.js:127 : échelle = 🧲☀️/1 361, avec Kepler (compute.js:181). calottes.js:366 : 🔋☀️/goughLuminosity(0), sans Kepler. Les deux sont justes pour leur usage. Écart de 1,5·10⁻⁴.

**Correction amendée.** La liste est incomplète : il y a une QUATRIÈME définition, CONST.SOLAR_CONSTANT = 1 361 (physics.js:40), lue par climate.js:37 et 119 et par plot.js:2135 et 2215. Elle est même RÉÉCRITE à l'exécution par CO2/static/compute/visu_/flux_manager.js:26 (CONST.SOLAR_CONSTANT = SOLAR_CONSTANT_REF × intensity), qui porte encore un cinquième SOLAR_CONSTANT_REF. La clé unique dans DATA (flux de Gough à 1 UA, t = 0) doit remplacer les cinq, et flux_manager ne doit plus muter CONST.

#### 51. Part de terre de la bande 30–60° : 1 − 🍰🗻🌊 global (0,30) pour la glace saisonnière, PaleoDEM par bande (0,596 N / 0,103 S) pour les calottes et le cycle

*basse · valeur_double · verdict : **confirme***  
`API_BILAN/physics/physics.js:180-185, 359-363 ; API_BILAN/physics/calottes.js:109-126 ; API_BILAN/physics/saisons.js:98 ; API_BILAN/data/paleogeo_zones.js`

**Constat.** facteurGlaceZones pondère la rampe continentale (25 K) et la rampe océanique (4 K) des moyennes latitudes par fContinent = 1 − EPOCH['🗻']['🍰🗻🌊'], soit 0,30 à 📱 pour les deux hémisphères. Or PALEOGEO donne la part de continent de chaque bande (0 Ma : N_mid 0,596, S_mid 0,103, moyenne 0,35 avec les plateaux jusqu'à −1 000 m), et c'est elle que lisent calottes.js et saisons.js. Le commentaire en cite un troisième chiffre : « ≈ 0,28 mesurés » (physics.js:182).

**Effet.** Touche la glace saisonnière des moyennes latitudes et son albédo, surtout pour S_mid (0,30 posé contre 0,10). Ampleur inconnue par lecture.

**Correction proposée.** Lire dans facteurGlaceZones la part de continent de PALEOGEO, par bande et par hémisphère (CALOTTES.geographie) : une seule référence.

**Vérification.** physics.js:359 : fContinent = 1 − EPOCH['🗻']['🍰🗻🌊'], soit 0,30 sur 📱. Le commentaire l.182 cite « ≈ 0,28 mesurés ». PALEOGEO à 0 Ma, relu : N_mid 0,596, S_mid 0,103, moyenne 0,35. calottes.js:118-126 et saisons.js:98 lisent PALEOGEO. Trois chiffres pour une même grandeur : la valeur double est réelle.

**Correction amendée.** L'effet est mal placé. facteurGlaceZones traite la zone 30–60° d'un seul bloc, même température pour N et S (profil symétrique), et tf_mid est LINÉAIRE en fContinent (l.362). Séparer N et S à la même température revient exactement à prendre la moyenne : 0,35 contre 0,30. L'écart « S_mid 0,30 contre 0,10 » n'existe que si la zone est séparée par hémisphère, avec des températures distinctes. Pour la correction : la part de PALEOGEO compte les plateaux jusqu'à −1 000 m, qui sont de la mer au niveau actuel. Pour la neige saisonnière sur terre, la bonne grandeur est la terre ÉMERGÉE de la bande (≈ 0,28). La référence unique doit donc être un champ PALEOGEO « terre émergée » par bande et par hémisphère. Ou bien on tranche une seule définition (avec ou sans plateaux) pour les trois lecteurs, saisons.js compris, qui met aujourd'hui les plateaux dans la boîte terre.

#### 52. Liens du Quaternaire périmés ou extrapolés : dates « sur les stades isotopiques », CO₂ de la racine de 🦣 attribué à EPICA

*basse · statut_mal_declare · verdict : **confirme***  
`API_BILAN/data/episteme.js:39, 409 ; API_BILAN/config/configTimeline.js:1329-1332, 1356-1358, 1402-1403`

**Constat.** episteme.js:39 (lisieckiRaymo2005 🦴 📌) dit que les dates des clics de 🦣 sont posées sur les stades isotopiques. Or 🐾 fait 1,78 Ma, puis 39 pas de 20 ka, puis 8,3 ka, et 🦘 fait 2,559 Ma puis 9,3 ka (configTimeline.js:1357-1358, 1403). Plus aucune date ne vient d'un stade : le pas de 20 ka est un choix numérique, et 21 ka une convention pour le DMG.
episteme.js:409 (luthi2008 📡 📌) donne au CO₂ de la racine (2,58 Ma) la borne HAUTE de la fourchette EPICA des 800 derniers ka (configTimeline.js:1329-1332). C'est une extrapolation hors de la carotte, avec une borne de fourchette choisie : statut ❔.

**Effet.** Aucun sur la courbe.

**Correction proposée.** lisieckiRaymo2005 : passer en 📖 ou supprimer. Pas de 20 ka : ❔ 🔢. CO₂ et CH₄ de la racine : ❔ 📌 « borne haute de l'intervalle 0–800 ka posée à 2,58 Ma », ou une mesure pliocène (bore) si le projet en a une.

**Vérification.** configTimeline.js:1357-1358 : 1,78 Ma, puis 39 pas de 0,02 Ma, puis 0,0083 Ma. l.1403 : 2,559 puis 0,0093 Ma. l.1342-1343 : pas de 20 ka motivé par la précession et l'obliquité, pas par un stade isotopique. episteme.js:39 (lisieckiRaymo2005 🦴 📌, « dates … posées sur les stades isotopiques ») est donc périmé. configTimeline.js:1329-1332 : à 2,58 Ma, « valeurs HAUTES de la grille [180, 300] ppm », 298 ppm et 0,80 ppm. episteme.js:409 : luthi2008 📡 📌, sans mention de l'extrapolation ni du choix de la borne.

#### 53. Précision du 🎯 Fennoscandie (connu) : λ en vient aussi, et la Laurentide donne le même η

*basse · cible_circulaire · déjà connu · verdict : **confirme***  
`API_BILAN/data/episteme.js:102-105 ; API_BILAN/physics/calottes.js:10-12, 390`

**Constat.** La règle λ = 2 × largeur (episteme.js:104) est tirée de la même Fennoscandie : 3 000 km / 1 350 km = 2,22, arrondi à 2. Le 🎯 Fennoscandie (episteme.js:105) est donc circulaire deux fois, par η et par λ.
Avec τ = 4π η / (ρ_m g λ), les deux temps observés du tableau 5.1 donnent η = 1,07·10²¹ Pa·s (Fennoscandie, λ = 3 000 km) et 1,06·10²¹ Pa·s (Laurentide, λ = 5 000 km). La Laurentide est le seul contrôle partiellement indépendant, à condition que Schubert et al. n'aient pas tiré η de ce même tableau (à vérifier au ch. 5).

**Effet.** Aucun sur la courbe ; il y a un seul 🎯 utile au lieu de deux.

**Correction proposée.** Passer la Fennoscandie en 📖. Garder la Laurentide en 🎯 si l'origine de η ne l'inclut pas.

**Vérification.** episteme.js:104 : λ = 2 × largeur, tiré du seul exemple fennoscandien (3 000/1 350 = 2,22, arrondi à 2). η vient aussi de la Fennoscandie (l.101). Le 🎯 Fennoscandie (l.105) est donc circulaire deux fois. Refait avec τ = 4πη/(ρ_m g λ), ρ_m = 3 300, g = 9,81 : avec la règle du moteur, λ = 2 700 km pour la Fennoscandie et 5 000 km pour la Laurentide. On retrouve exactement les 4,56 et 2,46 ka d'episteme pour η = 10²¹. η tiré des temps observés : Laurentide 1,06·10²¹ Pa·s ; Fennoscandie 0,97·10²¹ avec λ = 2 700 km (1,07·10²¹ avec les 3 000 km de Schubert, le chiffre du constat).

**Correction amendée.** Chiffre : avec la règle du moteur (λ = 2 700 km), η(Fennoscandie) = 0,97·10²¹ et non 1,07·10²¹. La conclusion ne change pas : η ≈ 10²¹ des deux côtés. Correction juste : Fennoscandie en 📖, Laurentide en 🎯 si l'origine de η ne l'inclut pas.

#### 54. Chaîne albédo → méridien → calottes : DATA recopiée en arguments, T₂ porté par deux variables, constantes hors de DATA

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/albedo/calculations_albedo.js:298-299 ; API_BILAN/physics/meridien.js:122, 157, 168 ; API_BILAN/physics/calottes.js:71-90, 340, 345 ; API_BILAN/physics/physics.js:519`

**Constat.** calculateAlbedo passe DATA['🧮']['🧮🌡️'], DATA['🗻']['🍰🗻🧊'] et DATA['🗻']['🔺📏🗻🧊'] à MERIDIEN.resoudre (10 arguments), qui les repasse à CALOTTES.calculer sous les noms T_glob, depart et socle.
Dans resoudre, T₂ existe deux fois : T2 (l. 168) et −dT.pol / ⟨P₂⟩_pol, transmis aux calottes (l. 157). Les deux ne sont égaux qu'à la convergence, à 0,01 K / 0,81 près.
Les constantes physiques des calottes (τ₀, ρ_m, DDF, σ, η, D humide…) vivent dans CALOTTES.K, et la masse volumique de la glace des calottes dans EARTH.NUAGES.RHO_GLACE, l'objet des nuages. C'est contraire à ta règle : tout dans DATA, pas de recopie en entrée de fonction.

**Effet.** Aucun effet numérique aujourd'hui ; c'est le terrain d'erreurs de référence difficiles à trouver.

**Correction proposée.** Dans calottes.js et meridien.js, lire DATA là où la valeur sert : état porté, T, et T₂ du méridien sous une seule clé de DATA. Mettre les constantes physiques des calottes et ρ_glace dans DATA (ou CONST) sous leur clé emoji, documentées dans alphabet.js et dico.js.

**Vérification.** calculations_albedo.js:298-299 : resoudre(DATA['🧮']['🧮🌡️'], …, DATA['🗻']['🍰🗻🧊'], DATA['🗻']['🔺📏🗻🧊'], durée), soit 10 arguments. meridien.js:122 et 157 : CALOTTES.calculer(T_K, −dT.pol/P2_MOYEN.pol, …, calottesDepart, socleDepart, …), renommés T_glob, depart et socle (calottes.js:340). T₂ existe deux fois : T2 (l.168) et −dT.pol/0,8078, qui précède la relaxation. À l'arrêt, |nouveau − dT| < 0,01 K, donc l'écart sur T₂ est < 0,01/0,808 = 0,012 K. Les constantes physiques sont dans CALOTTES.K (calottes.js:71-90), ρ_glace dans EARTH.NUAGES.RHO_GLACE (calottes.js:150, 173, 345 ; saisons.js:91).

**Correction amendée.** Précision au regard de la règle de l'utilisateur : T₂ change pendant le point fixe du méridien (l.151-177). C'est le cas d'exception (une valeur qui bouge au milieu du calcul), mais elle doit rester UNE seule valeur : T₂ écrit dans DATA à chaque itération, lu par les calottes, et dT.pol qui en dérive. T_K, l'état de départ et le socle ne bougent pas pendant l'appel : ils se lisent dans DATA. window.STATE.dTzones et sa copie locale (meridien.js:130, Object.assign) sont une autre référence hors de DATA, à y ranger aussi.

### Volet : Calottes

#### 55. Forçage orbital pris à la fin du clic et tenu sur 20 ka : la précession est repliée

*haute · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:352, API_BILAN/physics/calottes.js:353-367, API_BILAN/physics/calottes.js:416-429, API_BILAN/physics/meridien.js:133, API_BILAN/physics/meridien.js:154, API_BILAN/config/configTimeline.js:1342-1358`

**Constat.** calculer() évalue l'anomalie d'insolation une seule fois, à la l.352 : ORBITE.anomalie(ageMa·1e6), avec ageMa = INTERIEUR.ageCourant (meridien.js:133), donc à la FIN du clic. Calotte et socle avancent ensuite sur toute la durée du clic (boucle l.416-429) avec le même contexte c (T̄, T₂, anomalie, echelle). L'obliquité de a1 (meridien.js:154) et celle de T₂ sont elles aussi prises à la fin du clic. La fonte de Robinson & Goelzer est une fonte instantanée (l'insolation du jour) : elle n'est valide qu'avec un pas bien plus court que les périodes orbitales. Or le chemin 🐾 avance par clics de 20 ka (configTimeline.js:1357 : 39 × 0,02 Ma), présentés l.1343 comme « un cycle de précession ». Échantillonner tous les 20 ka replie les périodes (calcul) : 23,7 ka → 1/|1/23,7 − 1/20| = 128 ka ; 22,4 ka → 187 ka ; 19 ka → 380 ka. Pour la précession à 23,7 ka, la phase recule de 47° par clic. L'obliquité (41 ka) est juste sous la fréquence de Nyquist (période 40 ka) : sa phase avance de 175,6° par clic, donc les valeurs échantillonnées alternent sous une enveloppe cos(φ − 0,0767 k), de période 82 clics = 1,64 Ma. Sur les 39 clics, l'enveloppe passe par zéro : environ 10 clics de suite où l'obliquité vue reste près de sa moyenne.

**Effet.** La calotte réagit en 15 à 75 ka. Elle ne moyenne donc pas cette précession repliée : elle suit des oscillations de 130 à 380 ka à pleine amplitude (±33 W/m² en été à 65° N pour e = 0,04, ±14 W/m² avec l'e actuel). La courbe orange peut donc montrer des cycles glaciaires d'origine numérique, et l'obliquité y est modulée par l'échantillonnage. Ampleur sur la courbe : inconnue par lecture.

**Correction proposée.** Dans calculer, évaluer l'orbite à la date de chaque sous-pas (âge de fin + temps restant du clic). ORBITE.anomalie est en cache par année : le coût reste linéaire. Faire de même pour l'obliquité de a1 si on la garde (voir le constat obliquité/précession). T̄ et T₂ demandent le solveur : pour eux, des clics de 5 ka au plus sur le chemin pas à pas (le Nyquist de la période 19 ka impose moins de 9,5 ka). Aucun lissage ni moyenne ajouté.

**Vérification.** Lecture vérifiée. calottes.js:352 évalue ORBITE.anomalie(ageMa·1e6) une seule fois. ageMa = INTERIEUR.ageCourant/1e6 (meridien.js:133), c'est-à-dire la date du clic (interieur.js:167-168, CLICS.date()). ⚾ = ORBITE.obliquiteDeg(ageCourant) (compute.js:103), relue par obliquiteCourante (physics.js:403) pour a1 (physics.js:342-346, meridien.js:154) et pour T₂ (integralesJ, meridien.js:124-125). Un clic de 20 ka est plus court que MEMOIRE_ANS = 100 ka : ancien = 0, et tout le clic est intégré en sous-pas de τ_b avec le même contexte c (l.416-429).

Repliement recalculé : 128, 187 et 380 ka, c'est juste. Une erreur : la phase de la précession de 23,7 ka recule de 360(1 − 20/23,7) = 56,2° par clic, pas de 47° (contrôle : 20/128 × 360 = 56,2°). L'obliquité avance de 175,6° par clic et son enveloppe tourne de −4,39° par clic (0,0767 rad), soit 82 clics : juste.

Preuve directe, par arithmétique sur la table La2004 (CO2/static/astronomie_la04.js) :
- Précession : la moyenne de e·sin(ϖ+π) sur chaque fenêtre de 20 ka reste dans ±0,003. La valeur de fin de clic que voit la calotte va de −0,032 à +0,049, alors que le maximum vrai vaut 0,049. La suite échantillonnée oscille avec une période d'environ 8 clics.
- Obliquité : de 200 à 20 ka (10 clics), l'écart à la moyenne 0-800 ka (23,34°) reste sous 0,32°, alors que la vraie obliquité va de 22,44 à 24,28° entre 120 et 200 ka. La terminaison II voit une obliquité presque figée, et les « environ 10 clics » se vérifient.

Le commentaire de configTimeline.js:1342-1343 (« un cycle de précession, une demi-période d'obliquité ») décrit exactement le pire cas : un pas proche d'une période replie la précession vers les basses fréquences et met l'obliquité sur la fréquence de Nyquist. L'ampleur sur la courbe orange ne se mesure pas par lecture.

**Correction amendée.** La correction proposée tient, avec quatre ajouts.
1. Les sous-pas sont déjà assez courts : τ_b vaut 1,2 à 2,9 ka à 0 Ma (S_pol 1,24 ; N_pol 2,69 ; N_mid 2,00), sous les 9,5 ka de Nyquist.
2. Il faut retirer l'arrêt anticipé des l.420-428 (« plus rien ne bouge » d'ici la fin du clic) : il suppose un forçage constant jusqu'à la fin du clic, ce qui devient faux dès que l'orbite change à chaque sous-pas.
3. Le cache c.anomalieNoeuds est aujourd'hui indexé par la seule latitude : il doit aussi l'être par la date du sous-pas. ORBITE._anomalies n'est pas borné, environ 105 Ko par année distincte : prendre les dates des sous-pas sur la grille de 1 ka de La2004, les mêmes pour toutes les bandes (une seule liste de dates).
4. T̄, T₂, ainsi que l'obliquité de a1 et de integralesJ, demandent des clics de moins de 9,5 ka (5 ka en pratique, soit environ 160 clics de 800 à 20 ka). Cela touche la règle « un récit par clic » : c'est au propriétaire de trancher. Aucun lissage ni aucune moyenne de forçage.

#### 56. Géométrie en anneau zonal : une petite calotte devient une bande mince au lieu d'un dôme

*haute · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:128-139, API_BILAN/physics/calottes.js:145-153, API_BILAN/physics/calottes.js:156-159, API_BILAN/physics/calottes.js:188-196, API_BILAN/data/paleogeo_zones.js:21, CO2/scripts/paleogeo/paleodem_zones.py:212-217, API_BILAN/data/episteme.js:166`

**Constat.** terre() répartit le continent de la bande en anneau uniforme en sin φ, de densité d, sur [x_a, x_b]. geometrie() pose la calotte de fraction a sur toute la circonférence, avec une largeur méridienne W = R(asin x_b − asin x_e), où x_e = x_b − a(x1 − x0)/d, puis h₀ = √(2τ₀W/(ρ_i g)). La loi de Nye donne pourtant h² = 2τ₀D/(ρ_i g), avec D la distance à la marge la PLUS PROCHE. C'est d'ailleurs ainsi que la fermeture antarctique la lit (paleodem_zones.py:212-217 : D_KM, distance 2D au bord). Le profil méridien de Weertman suppose une calotte beaucoup plus longue en longitude qu'en latitude. C'est vrai par construction pour l'anneau, faux pour une vraie calotte de petite aire, qui est compacte. Chiffres à 0 Ma (τ₀ = 100 kPa, ρ_i = 917, g = 9,81) : le Groenland posé (N_pol, a = 0,050239) devient un anneau de 78,2 à 80,5° N, W = 259 km, h₀ = 2 401 m ; un dôme compact de même aire (1,708 Mkm², rayon 737 km) donne 4 049 m, soit ×1,69. Une naissance N_mid à a = 0,01 (0,93 Mkm²) donne un anneau de W = 70 km et h₀ = 1 247 m ; le dôme équivalent (rayon 545 km) donne 3 481 m, soit ×2,79. Lois d'échelle : anneau h₀ ∝ a^½ et V ∝ a^{3/2} ; dôme h ∝ A^¼ et V ∝ A^{5/4}, la loi que CALOTTES_OLIGOCENE utilise déjà (episteme.js:166). S_pol, centré sur le pôle (x_b = 1), n'est pas touché : à a = 0,01, W = 350 km contre un rayon de 330 km.

**Effet.** Toute calotte non polaire (N_pol, N_mid, S_mid, tropiques) est trop mince tant qu'elle est petite. Son sommet est trop bas de 1,6 à 2,2 km d'épaisseur, soit 1,2 à 1,6 km de surface après le facteur 0,72 du code, donc 8 à 10 K trop chaud à Γ = 6,5 K/km. La rétroaction altitude–bilan est affaiblie précisément à la naissance. Le Groenland posé ne monte qu'à environ 1,7 km, contre environ 2,9 km avec un dôme compact au même τ₀ : cela va dans le sens de « le Groenland ne tient pas ».

**Correction proposée.** Lire Nye avec la distance à la marge, comme la fermeture. Poser la calotte d'aire a·A_bande en dôme compact (rayon √(A/π)), centré sur les hautes terres de la bande (x_haut), tant qu'il tient dans l'étendue de la terre ; ne passer à la bande méridienne que lorsque la calotte touche les deux bords en latitude. Variante qui garde une seule référence avec la fermeture : tabuler dans paleodem_zones.py, par bande et par carte, la distribution des distances au rivage, et y poser s = √(2τ₀D/(ρ_i g)).

**Vérification.** Code vérifié (calottes.js:130-139, 145-153, 156-159, 188-196). Chiffres recalculés avec R = 6 371 km :
- N_pol (Groenland) : x_b = 0,9864 (80,53° N), d = 0,892, x_e = 0,97883 (78,19°), W = 260 km, h₀ = 2 406 m. Dôme de même aire : 1,717 Mkm², rayon 739 km, h = 4 054 m, soit ×1,68.
- N_mid à a = 0,01 : W = 70 km, h₀ = 1 247 m. Dôme : rayon 545 km, h = 3 481 m, soit ×2,79.
- S_pol à a = 0,01 : W = 350 km contre un rayon de 330 km : pas touché.

La loi plastique s'écrit |∇(h²)| = 2τ₀/(ρ_i g) : h² est proportionnel à la distance à la marge la plus proche, ce qu'utilise bien la fermeture (paleodem_zones.py:212-217, D_KM). Le profil méridien n'est cohérent qu'avec la terre du modèle, répartie uniformément en longitude (approximation déclarée l.49-50) : l'anneau est une bande longue par construction. Ce qui n'est pas déclaré, c'est la conséquence de cette approximation sur l'épaisseur des petites calottes, alors que les vraies naissent compactes.

Deux précisions :
- Les « 1,7 km » ne comptent que la glace (0,722 × 2 406). Avec le socle interpolé à p = 0,0627 (760 m), le sommet est à environ 2,5 km contre environ 3,7 km pour le dôme. L'écart de 1,2 km reste le même.
- Les « 8 à 10 K » valent au sommet seulement. Le bilan intégré voit l'épaisseur moyenne : (2/3)h₀ = 1 604 m pour l'anneau contre (8/15)h = 2 162 m pour le dôme, environ 560 m d'écart, soit environ 2,6 K après le facteur 0,722.

**Correction amendée.** Préférer la variante, qui garde une seule référence avec la fermeture : tabuler dans paleodem_zones.py, par bande et par carte, la distribution des distances à la marge de la terre, puis poser h = √(2τ₀D/(ρ_i g)) sur cette distribution. Le dôme compact surestime les calottes allongées : pour le Groenland, 4,05 km contre environ 3,4 km d'épaisseur maximale réelle (de mémoire). La quadrature de bilanCalotte et de volume() doit alors placer chaque point à sa vraie latitude. À traiter avec les erreurs connues 1 et 2 : h varie comme √τ₀, et le facteur d'Airy est faux.

#### 57. Obliquité comptée deux fois (a1 ∝ sin ε dans les degrés-jours, et dans ΔS de Robinson & Goelzer), précession une seule fois

*haute · valeur_double · verdict : **plausible***  
`API_BILAN/physics/calottes.js:34-41, API_BILAN/physics/calottes.js:243-247, API_BILAN/physics/physics.js:342-346, API_BILAN/physics/meridien.js:149-154, API_BILAN/physics/orbite.js:7-10, API_BILAN/doc/equation.html:755`

**Constat.** La fonte d'un point vaut DDF × PDD(T) + τ_a(1 − α)ΔS/L_f (l.243-247). Les DDF de Braithwaite 1995 sont mesurés sous l'orbite de 1950 : ils contiennent déjà la part radiative qui accompagne une hausse de T (les jours chauds sont aussi les jours ensoleillés). La logique « DDF de 1950 + écart d'insolation à 1950 » (en-tête l.34-41, orbite.js:7-10) ne tient que si le cycle de T ne répond pas lui-même à l'orbite. Or a1 = SEASONAL_AMP × sin ε / sin 23,44° (physics.js:342-346, transmis par meridien.js:154). L'obliquité entre donc dans T, et par là dans DDF × PDD avec sa part radiative implicite, ET dans ΔS, puisque S − S₁₉₅₀ contient l'écart d'obliquité. Elle entre aussi dans T₂ par l'insolation annuelle. La précession ne touche ni a1 ni d1 (posé à 30 j, l.149) : elle n'entre que par ΔS. Le cycle calculé de saisons.js a le même trou : F₁ = S⟨x⟩ sin ε/2, sans précession (equation.html:755). Ordres de grandeur (calculs avec la formule de bilanPoint) : +1° d'obliquité donne a1 +0,6 K (pôle, 15 K) ou +1,0 K (moyennes latitudes, 25 K). La PDD gagne alors +41 à +113 °C·j selon la moyenne annuelle (−12 à −5 °C), soit +124 à +340 kg m⁻² an⁻¹ de fonte sur la neige et +330 à +908 sur la glace. La voie ΔS du même degré (+14,3 W/m² en moyenne sur λ = 45-135° à 65° N) ne donne que +43 à +118 kg m⁻² an⁻¹, avec τ_a(1 − α) ≈ 0,21 (neige) et 0,35 (glace) ; τ_a ≈ 0,7 est supposé, α = 0,70 et 0,50 viennent de physics.js:594-601. En énergie, les DDF valent 11,6 (neige) et 30,9 (glace) W m⁻² K⁻¹, contre environ 10 W m⁻² K⁻¹ de sensibilité turbulente + IR : environ 70 % de la voie T sur la glace est déjà de l'insolation.

**Effet.** La fonte réagit à l'obliquité 3 à 8 fois plus que ne le justifie l'insolation seule, en partie par double compte. La précession est réduite à sa seule voie radiative. Résultat : le balancement de ±1,2° d'obliquité (±0,8 K ou ±1,3 K sur a1) pèse environ 4 fois la précession la plus forte (e = 0,04 : ±33 W/m² d'été à 65° N), alors que dans l'insolation d'été à 65° N c'est la précession qui domine (±33 contre ±17 W/m²). Sur la courbe orange du Quaternaire, les cycles sont dictés par l'obliquité par construction.

**Correction proposée.** Une seule voie par élément orbital. Option 1, cohérente avec Robinson & Goelzer et les DDF de 1950 : cycle de T des calottes à l'obliquité de 1950 (a1 sans le facteur sin ε/sin ε_REF à meridien.js:154), et toute l'orbite par ΔS. Option 2 : fonte par bilan d'énergie de surface, avec ΔS absorbé explicite et un terme en T de sensibilité turbulente + IR mesurée, sans DDF ; le cycle de T doit alors répondre à toute l'orbite, précession comprise (harmonique annuelle de l'insolation journalière exacte à la date, pas F₁ ∝ sin ε).

**Vérification.** L'asymétrie est démontrée par le code :
- a1 = SEASONAL_AMP × sin ε/sin 23,44° (physics.js:342-346, meridien.js:154) ;
- d1 est fixé à 30 j, r2 = i2 = 0 (meridien.js:149, 154) ;
- ΔS (ORBITE.anomalie) contient l'obliquité ET la précession.
L'obliquité entre donc par T et par ΔS, la précession par ΔS seulement. Même trou dans saisons.js : F₁ = S⟨x⟩ sin ε/2 (equation.html:755), sans le terme annuel en 2e·cos(λ − ϖ).

Chiffres recalculés avec la formule de bilanPoint :
- +1° d'obliquité donne a1 +0,60 ou +1,00 K, et la PDD +42 °C·j (μ = −12 °C, a1 = 15 K) à +113 °C·j (μ = −5 °C, a1 = 25 K) ;
- ΔS moyen sur λ = 45-135° à 65° N : +14,3 W/m² (recalculé) ;
- les DDF valent 11,6 et 30,9 W m⁻² K⁻¹ en énergie.

Non démontré par lecture :
1. Les « 10 W m⁻² K⁻¹ » turbulent + IR viennent de mémoire. La part de la voie T portée par l'air réchauffé (flux turbulent et IR) n'est pas un double compte. L'excès vaut environ (30,9 − 10) × Δa1 ≈ 21 W/m² sur la glace pour +1°, contre τ(1 − α)ΔS ≈ 5 W/m² : une surestimation d'environ ×2,4 sur la glace et ×1,1 sur la neige, pas « 3 à 8 fois ».
2. L'effet annoncé ne tient pas tel quel. « C'est la précession qui domine » vaut pour l'insolation du solstice ou la moyenne sur λ = 45-135°. Ce n'est plus vrai pour l'énergie intégrée sur la saison de fonte, celle que bilanPoint somme : ΔS pondéré par Φ sur 24 nœuds, avec le calendrier de Kepler d'orbite.js. Cette énergie est dominée par l'obliquité (Huybers 2006, Science 313:508, de mémoire). Une courbe dominée par l'obliquité est donc en partie physique, et le double compte l'amplifie.

**Correction amendée.** L'option 2 est la seule cohérente. Fonte par bilan d'énergie de surface : τ_a(1 − α)S absorbé à la date, plus un terme en T dont la sensibilité est tirée de la physique (flux turbulent par formule de transfert et 4εσT³), pas de l'ajustement ITM, et sans DDF. Le cycle de T doit répondre à toute l'orbite : harmonique annuelle de l'insolation journalière à la date, terme e·cos(λ − ϖ) compris. L'option 1 n'est pas une correction : elle supprime la réponse physique de l'air des terres libres de glace à l'obliquité, là où naissent les calottes. Si on la garde, c'est une autre approximation, à déclarer ❔.

#### 58. Partage des eaux posé sur une côte (bout polaire d'une terre qui n'atteint pas le pôle)

*moyenne · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:4-6, API_BILAN/physics/calottes.js:130-139, API_BILAN/physics/calottes.js:156-159, API_BILAN/physics/calottes.js:390, API_BILAN/data/paleogeo_zones.js:21`

**Constat.** hNye prend h = h₀√(1 − s), avec s compté depuis x_b : la glace a son épaisseur maximale h₀ au bout polaire. Pour x_b = 1 (dôme polaire), c'est l'axe de symétrie : correct, et c'est ce que λ = 4W reconnaît l.390. Mais terre() renvoie x_b < x1 dès que 2·x_continent − x0 ≤ x1, et x_b est alors le rivage polaire de la terre. À 0 Ma : N_pol (x_continent = 0,9262) a x_b = 0,9864, soit 80,5° N, l'océan Arctique ; S_mid a x_b = 0,7566, soit 49,2° S. En plasticité parfaite, h tend vers 0 à toute marge posée (h² = 2τ₀D/(ρ_i g)) : une côte ne peut pas porter une falaise de h₀ = 7,1 km (N_pol plein). Entre deux marges distantes de W, le profil est symétrique : sommet au milieu, h_max = √(2τ₀(W/2)/(ρ_i g)) = h₀/√2, épaisseur moyenne et volume divisés par √2 à aire égale. Je crois que Weertman 1976 pose la marge nord sur la côte arctique et le partage au milieu (à vérifier dans l'article) ; si c'est le cas, l'attribution « partage des eaux au bout polaire (Weertman 1976) » de l'en-tête est fausse hors du pôle. Cas voisin : N_mid a x_b = sin 60°, un bord de bande, et sa terre continue dans N_pol. Son partage est à 60° N avec h₀ = 8,3 km (plein), alors que N_pol plein a sa marge à 60° N (h = 0) : marche de 8 km entre deux calottes adjacentes.

**Effet.** Pour N_pol, à aire donnée, le volume est √2 = 1,41 fois trop grand (réponse plus lente, temps de renouvellement plus long). Le sommet est √2 trop haut et posé à la latitude la plus froide de la bande (80,5° N au lieu d'environ 70° N pour N_pol plein) : le bilan du haut de la calotte est trop favorable. La marge équatoriale, √(2τ₀D/(ρ g)) depuis la marge, est la même dans les deux profils.

**Correction proposée.** Quand x_b < 1 est un rivage, prendre le profil plastique entre deux marges : h = √(2τ₀·min(D_sud, D_nord)/(ρ_i g)), partage au milieu de [x_e, x_b]. Ne garder le demi-profil qu'au pôle. Pour deux bandes dont les terres se touchent (N_mid/N_pol), soit une seule calotte continue à travers la frontière, soit la condition de raccord h_N_mid(60°) = h_N_pol(60°).

**Vérification.** hNye (l.156-158) prend s = 0 en x_b, donc l'épaisseur h₀ au bout polaire. terre() (l.133-134) donne x_b = 2x_continent − x0 < x1 pour N_pol (0,9864, soit 80,53° N) et pour S_mid (2 × 0,6283 − 0,5 = 0,7566, soit 49,2° S) : recalculé.

Loi plastique : h² = 2τ₀D/(ρ_i g), avec D → 0 à toute marge. Sur une marge marine, c'est la surface qui tend vers le niveau de la mer. Entre deux marges distantes de W, h_max = √(2τ₀(W/2)/(ρ_i g)) = h₀/√2, et l'épaisseur moyenne comme le volume sont divisés par √2 à aire égale. Le sommet de N_pol plein est mis à 80,5° N au lieu du milieu de 60-80,5°, soit environ 70,3° N.

Marche entre bandes recalculée : N_mid plein a W = 3 071 km et h₀ = 8 263 m à 60° N, alors que N_pol plein a x_a = 0,866, donc sa marge (h = 0) à 60° N.

L'attribution à Weertman 1976 ne se vérifie pas par lecture. Je crois aussi que Weertman, Pollard 1978 et Oerlemans 1980 posent la marge polaire sur la côte arctique, mais ce n'est pas démontré ici. La physique, elle, tient indépendamment de l'article.

#### 59. Γ de la troposphère libre posé sur la surface, ET inversion de Jouzel & Merlivat : deux lectures de la même colonne

*moyenne · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:234-240, API_BILAN/physics/calottes.js:276, API_BILAN/config/configTimeline.js:2048`

**Constat.** Le code prend T_s = T(x) − Γ·max(0, z) avec Γ = 6,5 K/km, valeur de l'« atmosphère standard » (configTimeline.js:2048), c'est-à-dire un gradient de l'air libre. Puis, pour la neige, T_inv = 0,67 T_s + 88,9 K (l.238). Jouzel & Merlivat relient la surface au SOMMET de l'inversion, c'est-à-dire à l'air libre au-dessus de la couche limite (le code le dit l.234). Si T_s suit Γ, T_inv suit 0,67 Γ = 4,4 K/km : à 3 km, le sommet d'inversion sur la calotte serait 6,4 K plus chaud que l'air libre à la même altitude et à la même latitude au-dessus de la mer, ce qui est impossible. Lecture cohérente : T_inv(z) = T_inv(T_mer) − Γz, d'où T_s = (T_inv − 88,9)/0,67, soit un gradient de surface Γ/0,67 = 9,7 K/km. Contrôle, avec des valeurs de mémoire à vérifier : Dumont d'Urville −10,8 °C (66,7° S, ~0 m), Dôme C −54,5 °C (75,1° S, 3 233 m). Une fois retiré l'écart de latitude T₂ΔP₂ = −28 × 0,134 = −3,8 K, il reste −39,9 K sur 3,23 km, soit 12,4 K/km : plus près de 9,7 que de 6,5. Calcul à T_mer = 250 K, z = 3 km : le code donne T_s 230,5 K, T_inv 243,3 K et un rapport de neige de 0,276 ; la lecture cohérente donne T_inv 236,9 K, T_s 220,9 K et un rapport de 0,139.

**Effet.** La neige d'altitude est surestimée (×2,0 à 3 km). La température annuelle d'altitude est trop chaude d'environ 3,2 K par km de surface (9,6 K à 3 km) : le regel (froid du névé) est sous-estimé et σ trop petit. Effet net sur la fonte inconnu par lecture : l'inversion est surtout hivernale et a1 est le même à toute altitude. La correction éloigne encore le modèle du 🎯 Arthern (143 kg m⁻² an⁻¹, déjà dépassé par le haut) : le déficit d'accumulation vient d'ailleurs.

**Correction proposée.** Choisir une seule lecture. Soit Γ s'applique au sommet de l'inversion, T_s vient de J&M dans son domaine et T_s = T_inv au-dessus de 269,4 K, et la neige suit p_sat(T_inv(z))/p_sat(T_inv(0)). Soit on garde T_s = T(x) − Γz et on renonce à J&M (T_inv = T_s).

**Vérification.** Le code applique T = T̄ + T₂P₂ − Γz (l.276), avec Γ = 0,0065 K/m de l'atmosphère standard (configTimeline.js:2048), puis T_inv = max(T, 0,67 T + 88,9) (l.238) pour la neige (l.240).

Dérivation refaite : dT_inv/dz = 0,67 dT_s/dz = 4,4 K/km. Le sommet d'inversion au-dessus de la calotte vaut donc T_inv(0) − 0,67Γz, alors que l'air libre à la même altitude vaut T_inv(0) − Γz : 0,33Γz = 6,4 K plus chaud à 3 km.

Calcul refait à T_mer = 250 K, z = 3 km : le code donne T_s 230,5 K, T_inv 243,3 K et un rapport de neige de 0,276 ; la lecture cohérente donne T_inv 236,9 K, T_s 220,9 K et un rapport de 0,139 (p_sat sur glace). Gradient de surface Γ/0,67 = 9,70 K/km. Croisement de J&M avec la surface : 88,9/0,33 = 269,4 K.

Contrôle DDU / Dôme C : ΔP₂ = 0,1355, T₂ΔP₂ = −3,79 K, d'où 12,3 K/km. Il contient l'effet côtier et les valeurs de station viennent de mémoire : c'est un indice, pas une preuve. Le reste, la double lecture et ses chiffres, est démontré.

L'effet net sur la fonte reste inconnu : J&M est une relation de moyenne annuelle, l'inversion est surtout hivernale, et a1 est le même à toute altitude. Le sens de l'écart à Arthern est juste : le modèle est sous 143 (episteme.js:160, equation.html:701), et moins de neige l'en éloigne.

#### 60. Moyenne annuelle ZONALE (terre + mer) composée avec la demi-amplitude des TERRES

*moyenne · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:16-18, API_BILAN/physics/calottes.js:225, API_BILAN/physics/calottes.js:276, API_BILAN/physics/meridien.js:154, API_BILAN/physics/physics.js:162-174`

**Constat.** La température d'un nœud vaut T̄ + T₂P₂(x) − Γz + a1 sin(θ − d1). La moyenne vient du bilan de North : c'est la moyenne zonale terre + mer, et T₂ a été ajusté par North sur la température zonale observée. a1, lui, est la demi-amplitude des terres (physics.js:162-174 : 15 K au pôle, 25 K « mi-lat continentale »). Aux hautes latitudes, la moyenne annuelle des terres est plus froide que la moyenne zonale (hiver continental, mers réchauffées par les courants) : le pic d'été T̄_zone + a1_terre dépasse l'été réel des terres de cet écart. Ce constat porte sur la composition, qui reste fausse même avec une amplitude relevée ; la valeur de l'amplitude, elle, est déjà marquée ⚠️ posée. La PDD est très sensible à ce pic : +106 à +113 °C·j par K de pic d'été pour a1 = 25 K (calcul avec bilanPoint), soit +300 à +900 kg m⁻² an⁻¹ par K de neige à glace. Exemples dans l'état 📱 du code (T̄ ≈ 288 K, T₂ ≈ −21,5) : pic d'été 34,5 °C à 45° N, 26,4 °C à 60° N (bande N_mid).

**Effet.** La fonte est surestimée sur les terres des moyennes et hautes latitudes, ce qui rend plus difficiles la naissance et la tenue de N_mid et N_pol. L'ampleur de l'écart terre/zone ne se mesure pas par lecture (de mémoire, quelques K à 50-65° N ; à relever sur ERA5).

**Correction proposée.** Prendre la moyenne et le cycle du MÊME objet. Soit la boîte terre du mode saisonnier de North (saisons.js), mode annuel compris, avec son albédo et ses échanges ν avec la mer. Soit la moyenne zonale avec une amplitude zonale (terre et mer pondérées). Une seule référence pour T_terre(t).

**Vérification.** Composition vérifiée : T = T̄ + T₂P₂(x) − Γz (l.276), moyenne zonale du bilan de North, plus a1·sin(θ − d1) (l.225), avec a1 = SEASONAL_AMP_MID_K = 25 K « mi-lat continentale » ou 15 K au pôle (physics.js:173-174 via meridien.js:154). La moyenne et le cycle ne décrivent pas le même objet.

Pics recalculés (T̄ = 288 K, T₂ = −21,5) : 34,5 °C à 45° N et 26,4 °C à 60° N. Le signe tient : aux latitudes de 50 à 70° N, la moyenne annuelle des terres est plus froide que la moyenne zonale (mers réchauffées par les courants). L'écart n'est pas mesurable par lecture.

Précision : un écart de moyenne déplace toute la courbe. La sensibilité à prendre est donc dPDD/dμ = 125 à 159 °C·j/K (a1 = 25 K, μ de −12 à −5 °C, recalculé). Les 102 à 113 °C·j cités sont la sensibilité à a1 : le constat sous-estime un peu l'effet.

**Correction amendée.** Ne garder que la première option : la moyenne annuelle ET le cycle de la boîte terre de la bande (mode saisonnier de North dans saisons.js, mode annuel compris, avec son albédo et ses échanges ν avec la mer), comme référence unique de T_terre(t). L'option « moyenne zonale + amplitude zonale » est cohérente en apparence mais fausse pour une calotte posée sur la terre : elle refroidirait l'été des terres où la glace naît et fond.

#### 61. Hautes terres : la moyenne du quart haut est posée à a = 0 au lieu de p = 1/4

*basse · validite · verdict : **confirme***  
`API_BILAN/physics/calottes.js:142-144, API_BILAN/physics/calottes.js:147, API_BILAN/physics/calottes.js:152, CO2/scripts/paleogeo/paleodem_zones.py:116-121, CO2/scripts/paleogeo/paleodem_zones.py:317-326`

**Constat.** haut_m est l'altitude moyenne du QUART le plus haut du continent de la bande (quart_haut, w.sum()/4). geometrie pose socle = haut + (socle − haut)·p, avec p = a/continent. haut_m est donc atteint à p = 0, et à p = 1/4, là où la calotte couvre exactement ce quart, le code donne haut − (haut − socle)/4. À 0 Ma : S_pol 1 104 m au lieu de 1 329 (−225 m), N_pol 647 au lieu de 798 (−151 m), N_mid 1 750 au lieu de 2 101 (−351 m). À p → 0, la naissance devrait voir le haut de l'hypsométrie, qui est au-dessus de la moyenne du quart.

**Effet.** Le socle des petites calottes est trop bas : +1,0 à +2,3 K à p = 1/4 (Γ = 6,5 K/km), et davantage à la naissance. La naissance en est plus difficile, en plus du x_haut non lu (déjà connu).

**Correction proposée.** Tabuler dans paleodem_zones.py l'hypsométrie du continent par bande (altitude moyenne de la fraction p la plus haute, p de 0 à 1) et lire socle(p) au lieu de l'interpolation linéaire. haut_m reste un point de cette courbe (p = 1/4).

**Vérification.** quart_haut (paleodem_zones.py:116-121) prend w.sum()/4, et haut_m est la moyenne de ce quart (l.317-326). geometrie (calottes.js:147, 152) pose socle = haut + (socle − haut)·p : haut_m est atteint à p = 0, et à p = 1/4 on obtient haut − (haut − socle)/4. Or une calotte qui couvre le quart le plus haut a pour socle moyen haut_m, par définition.

Valeurs à 0 Ma recalculées :
- S_pol : 1 329 − 899/4 = 1 104 m (−225) ;
- N_pol : 798 − 604/4 = 647 m (−151) ;
- N_mid : 2 101 − 1 404/4 = 1 750 m (−351).
Soit +0,98 à +2,28 K à Γ = 6,5 K/km. L'interpolation linéaire est déclarée (JSDoc l.143-144), mais elle contredit la définition de haut_m.

#### 62. Mesures régionales appliquées partout sans ❔ : Jouzel & Merlivat (Antarctique), DDF de Braithwaite (Groenland)

*basse · statut_mal_declare · verdict : **confirme***  
`API_BILAN/physics/calottes.js:34-35, API_BILAN/physics/calottes.js:74-75, API_BILAN/physics/calottes.js:234-240, API_BILAN/data/episteme.js:82, API_BILAN/data/episteme.js:124, API_BILAN/data/episteme.js:156, API_BILAN/data/episteme.js:158`

**Constat.** T_inv = 0,67 T_s + 88,9 K est un ajustement sur l'Antarctique (le code le dit l.235), pour des surfaces d'environ −15 à −55 °C (domaine de mémoire, à vérifier). Il est appliqué à toutes les bandes, N_mid à 32° N compris, au dénominateur au niveau de la mer (T_mer, l.239-240), et jusqu'au croisement 88,9/0,33 = 269,4 K où la droite rejoint T_s : c'est un point de l'ajustement, pas une mesure. episteme.js le classe 📡 📌 (l.82, 158), sans ❔ d'extrapolation. Même cas pour les DDF de 3 et 8 mm °C⁻¹ j⁻¹ (📡 📌, l.124, 156) : ce sont des valeurs du Groenland. Braithwaite 1995 donne, de mémoire, 7 à 20 pour la glace selon le site, plus fortes au froid et au soleil. Elles sont posées pour toutes les latitudes et toutes les époques.

**Effet.** Aucun effet sur le calcul, mais la courbe garde des entrées qui passent pour mesurées hors de leur région. Pour les DDF, le sens d'une correction est inconnu par lecture : plus de soleil par degré-jour à basse latitude, DDF plus fort sur un site froid.

**Correction proposée.** Ajouter dans episteme.js deux liens ❔ 📌 : « J&M appliquée hors d'Antarctique, au niveau de la mer et jusqu'à 269,4 K » et « DDF du Groenland appliqués à toutes les latitudes ». À terme : une relation d'inversion par bande, ou le bilan d'énergie de surface du constat obliquité.

**Vérification.** episteme.js:82 et 158 classent J&M 📡 📌 : « relation mesurée en Antarctique » (aussi calottes.js:234-235). episteme.js:124 et 156 classent les DDF 3 et 8 de Braithwaite 1995 📡 📌 (calottes.js:34-35, 74-75). Le code applique les deux à toutes les bandes, à toutes les époques et au niveau de la mer (T_mer, l.239-240), jusqu'au croisement 88,9/0,33 = 269,4 K, recalculé : c'est un point de l'ajustement, pas une mesure.

Le projet marque déjà ce type d'extrapolation pour σ : ⚠️ « mesuré sur la calotte, appliqué aussi aux terres sans glace » (episteme.js:122). Il ne le fait ni pour J&M ni pour les DDF : statut incohérent. Les domaines de mesure (de −15 à −55 °C, DDF de 7 à 20) viennent de mémoire. Le constat n'en dépend pas.

#### 63. Siler et al. : HR du moteur dans une diffusivité ajustée à H fixe ; part de Hadley retirée

*basse · validite · verdict : **plausible***  
`API_BILAN/physics/calottes.js:22-25, API_BILAN/physics/calottes.js:82-83, API_BILAN/physics/calottes.js:346-349, API_BILAN/config/fine_tuning_bounds.js:135-146`

**Constat.** D = 1,16·10⁶ m²/s est l'ajustement de Siler, Roe & Armour sur le transport d'énergie humide d'ERA-Interim. Je crois que cet ajustement suppose q = H q*(T) avec H = 0,8 fixé, comme Hwang & Frierson 2010 : à vérifier dans l'article. Le code garde ce D mais prend HR = H2O_SURFACE_RH_01 (0,70 à 0,77, défaut 0,735) : le flux latent vaut alors 0,735/0,8 = 0,92 fois celui sur lequel D a été ajusté. Par ailleurs, le flux latent de Siler est (1 − w)·F_tourbillons + w·F_Hadley, et le code ne garde que (1 − w)·F_tourbillons (l.348). w vaut 0,062 à 30° et 0,018 à 37° : écart négligeable au-delà de 40°, mais pas dans N_trop/S_trop (snowball). Vérifié par ailleurs : facteurs 2π, unités et signe de P − E (à x = 1 : 149 kg m⁻² an⁻¹ au niveau de la mer avec T₂ = −21,5, et 122 avec T₂ = −28).

**Effet.** Si H = 0,8, P − E est trop faible de 8 % et le modèle s'éloigne un peu plus du 🎯 Arthern. La part de Hadley est négligeable pour les calottes polaires et des moyennes latitudes.

**Correction proposée.** Prendre q avec le H de l'ajustement de D : une seule référence, l'article. Pour les bandes tropicales, ajouter le terme w·F_Hadley de leur équation.

**Vérification.** Vérifié dans le code :
- q = HR·ε·e/(p_s − (1 − ε)e), avec HR = H2O_SURFACE_RH_01, une jauge (l.346-347) : P − E est proportionnel à HR ;
- Fq ne garde que (1 − w)·dq/dx (l.348). En-tête (l.24) : w est « la part de la cellule de Hadley », le transport latent de Hadley est donc bien retiré ;
- w recalculé : 0,062 à 30°, 0,018 à 37°.

Non vérifiable par lecture : que l'ajustement D = 1,16·10⁶ m²/s suppose H = 0,8. Je le crois aussi (Hwang & Frierson 2010), mais ce n'est pas démontré. Si c'est le cas, le flux latent est trop faible d'un facteur 0,735/0,8 = 0,92 (avec la valeur par défaut). P − E = 149 à x = 1 n'est pas recalculé ici.

**Correction amendée.** Ne pas introduire une seconde humidité relative. Prendre H = 0,8 dans l'accumulation alors que le reste du moteur lit H2O_SURFACE_RH_01 donnerait deux valeurs pour une seule grandeur. Deux voies propres :
1. garder la HR du moteur, et noter ❔ dans episteme.js « D de Siler ajusté à H = 0,8, appliqué à la HR du moteur (−8 % sur P − E) » ;
2. réajuster D sur le transport d'ERA-Interim avec la HR du moteur, si les données sont disponibles. D devient alors tiré de la mesure, et la HR reste unique.
Pour les bandes tropicales, ajouter le terme w·F_Hadley de leur équation, une fois sa forme vérifiée dans l'article.

#### 64. 🎯 « l'Antarctique tient à 0,349 (0,36 posé) » contre une aire qui est une entrée du socle

*basse · cible_circulaire · verdict : **plausible***  
`CO2/scripts/paleogeo/paleodem_zones.py:36-42, CO2/scripts/paleogeo/paleodem_zones.py:221-224, API_BILAN/config/configTimeline.js:185, API_BILAN/doc/equation.html:627, API_BILAN/doc/equation.html:644-645, API_BILAN/doc/equation.html:724-726`

**Constat.** L'aire posée de Bedmap2 (CALOTTES_ACTUELLES.S_pol = 0,35984) ferme d₀ dans la décharge du socle (paleodem_zones.py:41 et 222 ; equation.html:627 dit bien « l'aire est une entrée »). Elle fixe donc la répartition du rebond entre hautes terres et socle moyen : le volume fixe la moyenne, l'aire la répartition (equation.html:644-645 : rebond des hautes terres à 20-40 m près). Le moteur pose ensuite sa calotte sur ce socle, puis compare sa tenue (0,349) à 0,36 comme vérificateur (equation.html:725-726).

**Effet.** Dépendance faible (20 à 40 m de hautes terres, soit 0,1 à 0,3 K) mais réelle : ce 🎯 n'est pas indépendant de l'entrée.

**Correction proposée.** Marquer ce 🎯 comme partiellement circulaire dans equation.html. Ou fermer la décharge sans l'aire (sur le volume seul, avec un d₀ tiré d'une mesure indépendante, comme la ligne d'échouage de Bedmap2) et garder l'aire comme 🎯 du moteur.

**Vérification.** La chaîne est vérifiée :
- A_ANTARCTIQUE_KM2 = CALOTTES_ACTUELLES.S_pol × aire de la bande (paleodem_zones.py:36-42) ;
- D0_KM est fermé sur cette aire (l.221-224) ;
- socle_m et haut_m sont lus sur le socle déchargé (zones(), quart_haut sur zu) ;
- le 🎯 0,349 contre 0,36 est à equation.html:725-726.
La dépendance existe : l'aire fixe d₀, donc la répartition de H, donc le rebond sous le quart haut et la recharge d'eau des socles restés sous la mer. Le socle moyen, lui, n'en dépend qu'au second ordre (exact par conservation du volume).

L'ampleur avancée n'est pas démontrée. Les « 20 à 40 m » d'equation.html:644-645 sont l'erreur de rebond due à la compensation (cœurs de Ross et de Ronne-Filchner englacés, terres émergées sans glace). Ce n'est pas la sensibilité de haut_m à l'aire d'entrée. Ce 🎯 n'est pas indépendant, mais de combien, la lecture ne le dit pas.

**Correction amendée.** Marquer le 🎯 comme partiellement dépendant de l'entrée (equation.html:725-726, et un lien ❔ dans episteme.js). La seconde voie du constat ne marche pas : un d₀ tiré de la ligne d'échouage de Bedmap2 porte la même information que l'aire posée, puisque cette ligne la borne. Ce ne serait pas une mesure indépendante. Pour connaître la dépendance, régénérer la table avec d₀ décalé (par exemple ±50 km, τ refermé sur le volume) et lire la variation de haut_m et socle_m de S_pol : c'est un script, au choix du propriétaire.

#### 65. Deux définitions de la part de continent : PALEOGEO (socle > −1 000 m) et 1 − 🍰🗻🌊

*basse · valeur_double · verdict : **confirme***  
`API_BILAN/physics/calottes.js:109-114, API_BILAN/physics/calottes.js:147, API_BILAN/physics/calottes.js:373, CO2/scripts/paleogeo/paleodem_zones.py:47, API_BILAN/albedo/calculations_albedo.js:309, API_BILAN/albedo/calculations_albedo.js:554, API_BILAN/albedo/calculations_albedo.js:640-668, API_BILAN/physics/meridien.js:161-162`

**Constat.** Le plafond des calottes est PALEOGEO.continent (socle > −1 000 m, plateaux compris) ; avant 540 Ma, c'est 1 − 🍰🗻🌊 (l.112). La surface de l'albédo prend les terres comme 1 − ocean_coverage, tiré de 🍰🗻🌊 (calculations_albedo.js:554). À 0 Ma, PALEOGEO pondéré par les aires de bande donne 37,4 % du globe en continent, contre 29 % de terres (🍰🗻🌊 = 0,71). À 540 Ma, PALEOGEO donne 33,6 %, et juste avant, 1 − 🍰🗻🌊 vaut 0,22 à 0,25 dans les époques de configTimeline.js : marche du continent et de sa répartition (uniforme, socle 0) à 540 Ma. Deux aires de calotte coexistent aussi : meridien.js:161-162 met parZone (l'aire dynamique) dans le co-albédo de North, tandis que calculations_albedo.js:640-647 coupe calotte_effective à ce que les terres de 1 − 🍰🗻🌊 peuvent porter.

**Effet.** Sans effet aujourd'hui tant que les calottes couvrent moins de 29 % du globe. Il en reste une marche à 540 Ma, et un écart entre le T₂ de North et l'albédo global si les calottes dépassent les terres (snowball).

**Correction proposée.** Une seule part de continent par époque : 1 − 🍰🗻🌊 tirée de PALEOGEO quand une carte existe, avec le même seuil pour les deux (ou le niveau de la mer pour les deux). Une seule aire de calotte, lue par les deux albédos.

**Vérification.** Le plafond des calottes vient de PALEOGEO.continent (socle > −1 000 m), ou de 1 − 🍰🗻🌊 avant 540 Ma (calottes.js:109-114, 373). Recalculé, pondéré par l'aire des bandes : 37,4 % du globe à 0 Ma (contre 29 % de terres pour 🍰🗻🌊 = 0,71) et 33,6 % à 540 Ma.

La part de terres n'est pas lue au même endroit partout :
- le bilan méridien prend la surface libre avec ocGeo = 🍰🗻🌊 (calculations_albedo.js:287-288) ;
- l'albédo global prend 1 − ocean_coverage, que l'on tire du volume d'eau (l.24, 440, 554), et pas directement de 🍰🗻🌊 ;
- meridien.js:161-162 met parZone sans plafond, alors que calculations_albedo.js:640-647 coupe calotte_effective à ce que les terres portent.

Trois corrections de détail :
1. Juste avant 540 Ma, toutes les époques ont 🍰🗻🌊 = 0,75, donc 0,25 (configTimeline.js:454, 581, 780, 933). Le 0,22 est celui du Dévonien (l.999), qui lit PALEOGEO.
2. Pour les boules de neige (avant 540 Ma), les deux plafonds se confondent : chaque bande est plafonnée à 1 − 🍰🗻🌊, et la somme vaut les terres. Un écart n'y peut venir que d'un ocean_coverage différent de 🍰🗻🌊.
3. Le plafond de l'albédo est global : il ne mord que si toutes les calottes ensemble dépassent les terres.

**Correction amendée.** Pas « le même seuil pour les deux ». Ce sont deux grandeurs physiques distinctes, à tirer de la même carte. Terres émergées (socle > niveau de la mer) : c'est 🍰🗻🌊, que paleodem_zones.py doit écrire dans PALEOGEO, et que les époques lisent au lieu de la poser à la main. Support de glace posée (socle > −1 000 m) : c'est le plafond des calottes. Dans l'albédo global, une calotte posée sur le plateau continental prend sa surface à l'océan, pas aux terres. Une seule aire de calotte, parZone, lue par le bilan de North et par l'albédo global, sans second plafond.

#### 66. Valeurs doubles dans la documentation : accumulation du modèle et T₂ moderne

*basse · valeur_double · verdict : **confirme***  
`API_BILAN/data/episteme.js:45, API_BILAN/data/episteme.js:160, API_BILAN/doc/equation.html:594, API_BILAN/doc/equation.html:701, API_BILAN/physics/meridien.js:147, API_BILAN/physics/physics.js:171`

**Constat.** Accumulation du modèle sur les calottes 📱 : « le modèle donne ~23 » à episteme.js:160, contre « 55 à 73 kg m⁻² an⁻¹ » à equation.html:701. T₂ moderne calculé : −21,1 °C à episteme.js:45, −21,2 à equation.html:594, « ≈ −21,5 » à meridien.js:147 et physics.js:171. Trois chiffres écrits à la main pour un seul diagnostic.

**Effet.** Aucun effet sur le calcul ; le lecteur ne sait pas lequel correspond à l'état du code.

**Correction proposée.** Un seul endroit : le lien 🎯 d'episteme.js (déjà lu par equation.html et le dico), régénéré par le banc. Les commentaires de code renvoient à ce lien sans donner de chiffre.

**Vérification.** Accumulation de 📱 : « ~23 » à episteme.js:160, contre « 55 à 73 kg m⁻² an⁻¹ » à equation.html:701.

T₂ moderne, quatre écritures :
- −21,1 à episteme.js:45 ;
- −21,2 à equation.html:594 ;
- « ≈ −21,5 » à meridien.js:147 et physics.js:171 ;
- « ≈ −21,5 » encore à saisons.js:24 et equation.html:776, non cités par le constat.
La lecture ne dit pas laquelle correspond à l'état du code.

#### 67. Noms en double dans calottes.js et son appelant

*basse · reference_unique · verdict : **confirme***  
`API_BILAN/physics/calottes.js:81, API_BILAN/physics/calottes.js:148, API_BILAN/physics/calottes.js:151, API_BILAN/physics/calottes.js:173, API_BILAN/physics/calottes.js:177, API_BILAN/physics/calottes.js:183, API_BILAN/physics/calottes.js:314, API_BILAN/physics/calottes.js:345-346, API_BILAN/physics/calottes.js:356, API_BILAN/physics/calottes.js:368-369, API_BILAN/physics/calottes.js:430-431, API_BILAN/physics/meridien.js:157, API_BILAN/physics/meridien.js:168, CO2/scripts/paleogeo/paleodem_zones.py:50, CO2/scripts/paleogeo/paleodem_zones.py:337`

**Constat.** Liste des doublons. (1) Rayon terrestre : R dans geometrie (l.148, porté ensuite en g.R) et rayon dans calculer (l.345), deux copies de DATA['📜']['📐']·1000. (2) Gravité : gr (l.345) copie DATA['📅']['🍎'], que geometrie lit en direct (l.151). (3) rhoI (l.314, 368) copie EARTH.NUAGES.RHO_GLACE, lu en direct ailleurs (l.151) ; rr = ρ_i/ρ_m est recalculé trois fois (l.173, 177, 183). (4) Année en secondes : an (l.369), alors que PmoinsE recalcule ORBITE.JOURS_AN × CONV.SECONDS_PER_DAY en ligne (l.356). (5) AGE_MAX_CARTES_MA = 540 (l.81) recopie la dernière date de PALEOGEO.ages_Ma. (6) T₂ : les calottes reçoivent −dT.pol/P2_MOYEN.pol, la valeur relaxée (meridien.js:157), alors que le bilan rend T2 non relaxé (l.168) : deux T₂ dans la même itération, égaux à 0,01/0,81 K près une fois convergés. (7) res[b] porte a (l'état avancé) mais H, z, accumulation, fonte, Ts et marge de l'ÉQUILIBRE aEq (mbEq, l.430-431), sans que le nom le dise : un 🎯 d'accumulation lu dans res compare la calotte d'équilibre, pas celle portée. (8) paleodem_zones.py recopie les bornes des bandes (BANDES, l.50) et leurs milieux en x (MILIEU, l.337) au lieu de les lire dans calottes.js, comme il le fait déjà pour RHO_MANTEAU.

**Effet.** Aucun effet sur les nombres aujourd'hui, mais deux noms pour une grandeur, c'est deux valeurs possibles demain. Le point (7) en est déjà un cas réel.

**Correction proposée.** Lire DATA, EARTH et CONST au point d'usage, ou passer par un accesseur non énumérable sur l'objet d'origine. AGE_MAX = dernière date de PALEOGEO.ages_Ma. Passer aux calottes le T₂ que rend le bilan, ou nommer la relaxation. Dans res, nommer les diagnostics d'équilibre (eq.H, eq.accumulation…) ou rendre aussi ceux de l'état a. paleodem_zones.py lit BANDES dans calottes.js.

**Vérification.** Les huit points sont vérifiés.
1. R (l.148, porté en g.R) et rayon (l.345) copient tous deux DATA['📜']['📐']·1000.
2. gr (l.345) copie DATA['📅']['🍎'], que geometrie lit en direct (l.151).
3. rhoI (l.314, 368) copie EARTH.NUAGES.RHO_GLACE, et rr est recalculé trois fois (l.173, 177, 183).
4. an (l.369) est l'année en secondes, alors que PmoinsE refait le produit en ligne (l.356). De plus, an désigne aussi l'année en JOURS dans bilanPoint (l.219) : même nom, deux unités.
5. AGE_MAX_CARTES_MA = 540 recopie la dernière date de PALEOGEO.ages_Ma.
6. Les calottes reçoivent −dT.pol/P2_MOYEN.pol, la valeur relaxée (meridien.js:157), alors que la l.168 rend T2 non relaxé. L'écart est au plus 0,01/0,8078 = 0,012 K à la convergence.
7. res[b] porte a, mais H, z, accumulation, fonte, Ts et marge viennent de mbEq (l.430-431). Cas réel : bench_headless/quaternaire_chaine.js:25-26 affiche acc, fonte, H, z et marge à côté de a, alors qu'ils décrivent aEq.
8. paleodem_zones.py recopie BANDES (l.50) et MILIEU (l.337, arrondis 0,933 et 0,683), qui dupliquent aussi les (x0 + x1)/2 de calottes.js:113.

Doublons de plus, non cités :
- STATE.dTzones stocke trois nombres entièrement fixés par un seul T₂. La relaxation linéaire garde la forme dT_z = −T₂⟨P₂⟩_z, puisque l'état initial l'a déjà.
- physics.js:608 retape ⟨P₂⟩ à la main (0,8078, 0,2165, 0,375), au lieu de lire MERIDIEN.P2_MOYEN, ainsi que T₂ = −28.

**Correction amendée.** Points 1 à 5, 7 et 8 : la correction proposée tient. Point 6 : ne pas passer aux calottes le T₂ non relaxé. La relaxation sert à amortir le point fixe, car « la glace est une rampe raide », et le T₂ brut l'enlèverait aux calottes. Garder un seul état, le T₂ relaxé, dont dérivent les dT_z = −T₂⟨P₂⟩_z (accesseur non énumérable sur l'objet d'origine, plus de copie de trois nombres). Rendre ce même T₂ en diagnostic : la réponse brute reste interne à l'itération. Ajouts : renommer l'an en jours de bilanPoint ou lire ORBITE.JOURS_AN au point d'usage ; à physics.js:608, poser l'état initial depuis MERIDIEN.P2_MOYEN et le T₂ de North (−28), sans les recopier.

### Volet : Complétude (critique, non revérifié)

#### 68. Calottes engagées et point orange tracé même sans convergence (max_iter, oscillation), à deux températures différentes

*moyenne · validite · verdict : **non revérifié***  
`API_BILAN/convergence/calculations_flux.js:607, 618, 729-814, 837, 850, 964-997, 999, 1055-1061, 1065 ; API_BILAN/convergence/calculations_flux.js:242-243 ; API_BILAN/albedo/calculations_albedo.js:298-307 ; API_BILAN/physics/calottes.js:459-466 ; CO2/static/histoire/point_modele.js:23, 33`

**Constat.** Chaque tour de la boucle (l.607) commence par calculateAlbedo à la température T_n (l.618, ou cycleDeLeau l.398). C'est là que MERIDIEN.resoudre intègre les calottes et écrit DATA['🗻']['🧮🍰🗻🧊'] (calculations_albedo.js:298-307). La boucle évalue ensuite Δ à T_n et déplace DATA['🧮']['🧮🌡️'] vers T_{n+1} (l.837 en Search, l.850 en Dicho). Les deux sorties qui ne convergent pas viennent APRÈS ce déplacement : « oscillation » aux l.984-997 (T_currSt, l.964, vaut déjà T_{n+1}), « max_iter » par le compteur (l.999 puis condition du while l.607, statut posé l.1055-1061). Dans ces deux cas, DATA['🧮']['🧮🌡️'] vaut donc T_{n+1}, tandis que 🧲, 🪩 et 🧮🍰🗻🧊 sont ceux de T_n. Malgré cela, la l.1065 appelle `window.CALOTTES.engager(DATA)` SANS CONDITION. Les calottes intégrées sur tout le clic sous une T_n qui n'est pas un équilibre deviennent l'état porté, daté de maintenant (calottes.js:459-466), et le clic suivant en part. En mode anim, il repart aussi de T_{n+1} (calculateT0 l.242-243). point_modele.js:23 trace T = T_{n+1} et note seulement st (l.33). Seule la sortie convergée (l.729-814) garde T, Δ, l'albédo et les calottes à la même température. La branche « |Δ| ≤ tol » de la l.984 ne sert jamais : le même Δ a déjà été testé l.729.

**Effet.** Inconnu par lecture : la fréquence des max_iter et des oscillations n'est pas mesurée. Quand une telle sortie arrive, le point orange est décalé d'un pas de Search/Dicho, |T_{n+1} − T_n|. Les calottes portées ont aussi crû ou fondu pendant tout le clic (20 ka sur 🐾) sous un déséquilibre radiatif. Une oscillation se produit typiquement entre une branche englacée et une branche libre de glace, c'est-à-dire là où les calottes pèsent le plus.

**Correction proposée.** Appeler CALOTTES.engager dans la branche convergée (l.729-813), où T, Δ, l'albédo et 🧮🍰🗻🧊 sont à la même température. Sur max_iter ou oscillation, lever une erreur qui nomme 🧮🛑, l'époque, T_n et Δ (crash-first : la chaîne s'arrête visiblement). Si l'on veut garder ces points, ne pas engager suffit : 📅🗻🧊 reste à sa date, et le clic suivant intègre toute la durée depuis un état connu, sans perte de masse.

#### 69. Le point fixe méridien part de l'état du calcul précédent : STATE.dTzones n'est jamais remis, même au clic frise « sans rien hériter »

*moyenne · reference_unique · verdict : **non revérifié***  
`API_BILAN/physics/physics.js:605-608 ; API_BILAN/physics/meridien.js:130, 151-178 ; API_BILAN/convergence/clics.js:145-157 ; API_BILAN/convergence/calculations_flux.js:290-312 ; CO2/scripts/bench_headless/courbe_modele.js:30-31`

**Constat.** STATE.dTzones est posé une seule fois, au chargement (physics.js:608, T₂ = −28 de North). Chaque résolution méridienne part de `Object.assign({}, window.STATE.dTzones)` (meridien.js:130) et y réécrit son résultat (l.178). Un grep montre qu'aucun autre code ne l'écrit. CLICS.frise (clics.js:145-157) annonce « sans rien hériter » et remet le voile, l'eau des météorites, l'intérieur et les calottes, mais pas l'état méridien ; initForConfig (calculations_flux.js:290-312) ne le remet pas non plus. Le point fixe sort sans rien dire après 30 itérations (l.151-177 ; déjà signalé). Le volet méridien a montré que e(T) est un escalier dont les marches dépassent TOLERANCE_K = 0,01 K. Quand le point fixe tombe dans une marche, l'itération relaxée oscille, et l'état atteint au bout de 30 itérations dépend du point de départ. Ce départ, c'est le calcul précédent : un autre essai de T dans la Search, ou une autre époque. Les calottes sont recalculées à chaque itération avec le T₂ courant (meridien.js:157) : l'état engagé hérite donc de cette dépendance. En mode 'frise', le banc courbe_modele.js:30-31 enchaîne toutes les époques dans la même page : chaque point violet part de l'état méridien de l'époque d'avant. Dans l'interface, il part de ce que l'utilisateur a calculé juste avant.

**Effet.** Borné par 0,01 K quand le point fixe converge. Sinon, de l'ordre d'une marche de l'escalier : estimation grossière ΔT₂ ≈ 5·J_pol·ΔcoA/(6D+B) ≈ 5 × 19 × 0,0075 / 5,98 ≈ 0,1 K, davantage si une calotte est au seuil de naissance. « Banc = visu » n'est pas garanti, et la courbe violette dépend de l'ordre des époques. L'ampleur réelle est inconnue par lecture.

**Correction proposée.** Porter les écarts de zone dans DATA (référence unique, au lieu de window.STATE). Les poser à la condition initiale de North (physics.js:608) dans CLICS.frise, avec les autres remises. Faire crasher MERIDIEN.resoudre quand les 30 itérations s'épuisent, au lieu d'en sortir, et traiter la non-convergence par sa cause (escalier e(T), déjà signalé), pas par la relaxation.

#### 70. Les diagnostics des calottes (accumulation, fonte, H, z, Ts, marge) sont ceux de la calotte d'ÉQUILIBRE, publiés à côté de l'aire portée : le 🎯 Arthern compare la mauvaise calotte

*moyenne · valeur_double · verdict : **non revérifié***  
`API_BILAN/physics/calottes.js:338, 376, 430-431, 48 ; API_BILAN/albedo/calculations_albedo.js:300 ; CO2/scripts/bench_headless/quaternaire_chaine.js:2-6, 24-27 ; API_BILAN/data/episteme.js:83, 160 ; API_BILAN/doc/equation.html:701`

**Constat.** Pour chaque bande, calculer renvoie `{ a: a, aEq: aEq, H: mbEq.H, z: mbEq.z, accumulation: mbEq.accumulation, fonte: mbEq.fonte, Ts: mbEq.Ts, tau: tau, marge: mbEq.marge, … }` (l.430-431), avec `mbEq = bilanCalotte(aEq, b, gb, cyc, ab, c, airy())` (l.376). Ce sont donc les diagnostics de l'aire d'équilibre aEq, sur un socle d'Airy. Ce ne sont pas ceux de l'état a intégré avec le socle porté (fige). Le JSDoc (l.338) n'en dit rien. Le banc quaternaire_chaine.js les présente comme ceux de « la calotte du calcul … sa marge » (l.2-6) et les écrit à côté de a (l.24-27). Le contrôle Arthern (143 ± 4 kg m⁻² an⁻¹) porte sur « l'Antarctique posé » (calottes.js:48 ; episteme.js:83, 160), c'est-à-dire S_pol = 0,35984 au clic frise 📱, où a = a0 puisque dureeAns = 0. Or la valeur du modèle opposée à cette mesure (« ~23 », episteme.js:160 ; « 55 à 73 », equation.html:701) se lit dans ces champs : c'est l'accumulation de la calotte d'équilibre qu'equilibre() trouve en partant de 0,36. Cette aire peut valoir de 0 (mbEq est alors le seul point du sommet) jusqu'au continent de la bande (0,495). Une même clé porte ainsi deux calottes. Cela pourrait expliquer les deux valeurs relevées par le volet calottes ; non vérifié.

**Effet.** Pas d'effet sur la courbe orange : parZone lit bien a. En revanche, le 🎯 Arthern et les marges, épaisseurs et températures lues dans les bancs ne décrivent pas l'état porté. L'écart dépend de |aEq − a| et reste inconnu par lecture ; il est nul seulement si a = aEq.

**Correction proposée.** En fin d'intégration, calculer le bilan de l'état, mb = bilanCalotte(a, b, gb, cyc, ab, c, fige(b, g, e)), et le publier sous H, z, accumulation, fonte, Ts et marge. Ranger l'équilibre sous une clé à lui (par exemple res[cle].eq = { a, H, accumulation, fonte, Ts, marge }) : un nom par grandeur. Comparer Arthern à l'accumulation de l'état S_pol au clic frise 📱.

#### 71. Le q* de Siler change de phase à 273,16 K : la dérivée seconde numérique crée un puits de P − E à la latitude du gel

*basse · autre · verdict : **non revérifié***  
`API_BILAN/physics/calottes.js:240, 346-349, 356 ; API_BILAN/physics/physics.js:651-662, 666-672`

**Constat.** q(x) prend PHYS.pSatEau (calottes.js:347). Cette fonction suit IAPWS (liquide) au-dessus de T_t et Wagner 2011 (glace) en dessous (physics.js:651-662). Elle est continue (611,657 Pa des deux côtés), mais d ln p/dT y saute de 0,07265 K⁻¹ (liquide) à 0,08235 K⁻¹ (glace), soit +13,4 % ; calcul refait avec les coefficients du code. Fq prend dq/dx par une différence centrée de pas 10⁻⁴ (l.348-349), puis PmoinsE prend −dFq/dx par une seconde différence centrée (l.356). Fq saute donc de 13 % autour du point x* où T(x*) = 273,16 K. Pour |x − x*| < 2·10⁻⁴, P − E vaut environ −0,134 Fq / (2·10⁻⁴), soit à peu près 200 fois l'ordre normal |dFq/dx| ~ Fq/0,3, et c'est négatif : max(0, …) met la neige à 0 en ce point (l.240). Avec T̄ = 288 K et T₂ = −21,5 K, x* = 0,891 (63°), dans les bandes polaires ; en état glaciaire, x* descend vers les bandes moyennes. Les 24 points de bilanCalotte sont espacés d'environ 0,004 en x : un point tombe dans la fenêtre de 4·10⁻⁴ à peu près une fois sur dix. À vérifier dans l'article (non lu) : le transport utilise q* sur la glace sous 0 °C (e_glace/e_liq = 0,88 à 260 K, 0,80 à 250 K). Si Siler et al. ont ajusté D_HUMIDE sur la saturation sur l'eau liquide, c'est une seconde lecture du même q*.

**Effet.** Par intermittence, au plus environ −4 % sur l'accumulation d'une calotte (un point sur 24). B(T) devient aussi non lisse : le point entre dans la fenêtre ou en sort quand T̄ et T₂ changent d'un pas de Search à l'autre, ce qui peut entretenir une non-convergence.

**Correction proposée.** Pour le transport de Siler, n'utiliser qu'une phase de q*, celle de l'ajustement (PHYS.pSatLiquide existe, physics.js:666-672, si Siler a pris le liquide ; à vérifier). Calculer dq/dx analytiquement par PHYS.dLnPSatEau au lieu des différences emboîtées. Garder pSatEau (glace) pour le rapport de Jouzel & Merlivat, où la neige se forme sur la glace.

#### 72. Précision sur le 🎯 Fennoscandie (connu) : la règle λ = 2 × largeur contredit sa propre source, et 4,56 ka est calculé avec 2 700 km

*basse · cible_circulaire · déjà connu · verdict : **non revérifié***  
`API_BILAN/physics/calottes.js:10-12, 386-390 ; API_BILAN/data/episteme.js:105`

**Constat.** L'en-tête écrit « λ = 2 × largeur de la charge (Schubert et al. : 3 000 km pour les 1 350 km de la Fennoscandie) ». Or 2 × 1 350 = 2 700 ≠ 3 000 : le rapport de la source est 2,22. episteme.js:105 annonce « l'équation donne 2,46 et 4,56 ka ». En refaisant τ_b = 4πη/(ρ_m g λ) avec η = 1e21, ρ_m = 3 300 et g = 9,81, on obtient 4,556 ka pour λ = 2 700 km (la règle), 4,100 ka pour 3 000 km (la source) et 2,460 ka pour 5 000 km (Laurentide). Le 🎯 « 4,56 contre 4,4 » utilise donc la règle et non le λ de la source ; avec celui-ci, l'équation donne 4,10 ka, 7 % sous l'observé. Avec τ = 4,4 ka et λ = 3 000 km, on retrouve η = τρgλ/4π ≈ 1,07e21, la valeur posée : la boucle est déjà connue. Ce qui est précisé ici, c'est que le facteur 2 déclaré n'est pas celui de Schubert.

**Effet.** τ_b de toutes les calottes environ 11 % plus long que le rapport de la source (2,22/2). Négligeable devant les incertitudes déjà connues.

**Correction proposée.** Prendre le rapport λ/largeur de la source, avec ⚠️ un seul cas, ou tirer λ de la géométrie de la charge calculée. Retirer le 🎯 Fennoscandie, circulaire (connu).
