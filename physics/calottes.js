// File: API_BILAN/physics/calottes.js - Calottes de glace continentales (profil plastique + bilan de masse intégré)
// Desc: Je calcule les calottes PERMANENTES posées sur les continents (Antarctique, Groenland, Laurentide, Gondwana…), bande par
//       bande de latitude et par hémisphère, avec des équations publiées — pas de surface posée par époque :
//         · PLACE : le continent de la bande est découpé en cellules, tranches de latitude de 5° × classes de socle, avec l'aire,
//           la latitude et le socle moyens de chacune (data/paleogeo_zones.js, PaleoDEM Scotese & Wright 2018) : les deux
//           variables dont dépend le bilan d'un point. La marge d'une calotte avance d'abord là où le bilan du SOL NU (air libre, au
//           socle de la table, le plateau continental au niveau de la mer, sous l'orbite de la fin du clic) est le plus robuste :
//           les cellules sont rangées par ΔT*, le réchauffement que ce bilan supporte avant de s'annuler — l'ordre dans lequel un
//           refroidissement uniforme les englacerait, froides (haute latitude, socle haut) et enneigées d'abord. La calotte de
//           fraction a couvre, depuis son SOMMET et dans cet ordre, les cellules que son DÔME ATTEINT — un dôme de rayon R ne
//           couvre que des terres à moins de R de son sommet : la tranche d'une cellule est à la distance max(0, |φ − φ_sommet| −
//           2,5°) du sommet, et la cellule n'est gagnée que si le dôme qui la couvre a ce rayon (sinon la plus proche ; ❔ la portée est
//           celle d'un dôme de l'aire cumulée, sans N) —, jusqu'à l'aire a A_bande. Le relief est continu : la marge gagne une cellule par son HAUT, la part couverte d'une cellule est
//           sa part la plus haute (socleCouvert). Le rang est celui du climat du calcul (boîtes, profil méridien), pas une place
//           posée. SOMMET : un des candidats de la bande, la cellule de terre émergée la plus robuste de chaque tranche (la neige ne s'accumule pas
//           sur la mer : la calotte gagne le plateau depuis la terre) ; une calotte NAÎT (a = 0) sur le premier, dans l'ordre de
//           robustesse, dont le dôme GRANDIT — le bilan intégré B̄ reste positif sur le chemin jusqu'à couvrir sa cellule et la
//           suivante, sa seule cellule quand le continent n'en a qu'une (une neige qui tient sur un sommet dont le dôme ne peut
//           pas grandir ne fait pas de calotte) —, sinon sur le plus robuste ; une calotte posée par la config, d'aire connue et
//           de place inconnue, a le sommet du meilleur B̄ à son aire ; une calotte qui existe garde le sien, porté d'un clic à
//           l'autre (📿🗻🧊) tant que son aire est positive et que sa cellule existe à la date ;
//         · GÉOMÉTRIE : un DÔME parfaitement plastique (Nye 1952) sur un socle à l'équilibre d'Airy : τ = ρ_i g H |∇z_s|,
//           z_s = socle déchargé + (1 − ρ_i/ρ_m) H, d'où H = C √s, C = √(2 τ / (ρ_i g (1 − ρ_i/ρ_m))), s la distance à la marge
//           (H² proportionnel à s, solution de |∇(H²)| = constante nulle sur la marge). Une calotte est d'un seul tenant : sur la
//           carte, celle qui couvre la part a / continent du continent de la bande, la terre la plus froide d'abord, forme des
//           morceaux connexes d'aires A_i, de nombre effectif N = (Σ A_i)² / Σ A_i² (PALEOGEO.n_morceaux, ⚛ la connexité sur la carte,
//           ⚠️ le classement T₂ P₂(sin φ) − Γ z, ❔ N = 1 avant 540 Ma ; nDomes : linéaire entre deux parts, au-delà de 0,95 la dernière,
//           N = 1 à aire nulle) ; un même nombre de km² de glace éparpillés sur plusieurs reliefs fait des dômes plus petits et plus
//           minces (H ∝ √R) que s'ils formaient un seul dôme. La calotte est N dômes égaux (⚠️ des morceaux de même aire), chacun de
//           rayon R = √(a A_bande / (N π)) : V = N (8π/15) C R^(5/2) = N^(−1/4) (8π/15) C (S/π)^(5/4), V ∝ S^(5/4) à N donné (la loi
//           d'échelle des calottes plastiques ; Paterson 1972, Rev. Geophys. 10:885 ; Bahr, Pfeffer & Kaser 2015, Rev. Geophys. 53:95,
//           γ = 5/4) ; τ = PALEOGEO.tau_Pa, fermé sur le volume et l'aire posés de l'Antarctique par le script de la table
//           (CO2/scripts/paleogeo/paleodem_zones.py) avec le même dôme à N = 1 (l'Antarctique posé est d'un seul tenant) : une seule
//           loi, une seule géométrie, un seul τ. Les anneaux de chaque dôme, du sommet à la marge, sont les cellules couvertes dans
//           l'ordre où la marge les a gagnées, chaque cellule pour sa part dans chaque dôme (❔ croissance concentrique : la première
//           cellule est le sommet, la dernière gagnée est la marge ; la table ne donne que la latitude des cellules, pas leur
//           longitude) ; épaisseur moyenne
//           exacte de chaque anneau ;
//         · isostasie RETARDÉE : le socle s'enfonce de d, qui relaxe vers l'équilibre d'Airy (ρ_i / ρ_m) H au temps τ_b
//           (asthénosphère relaxante locale, Le Meur & Huybrechts 1996, Ann. Glaciol. 23:309, éq. 1 et 4) ; τ_b = 4π η / (ρ_m g λ),
//           demi-espace visqueux de Haskell (Schubert, Turcotte & Olson 2001, Mantle Convection, éq. 5.2.32) ; ⚠️ η = 10²¹ Pa·s
//           mesure posée (tirée du soulèvement daté de la Fennoscandie : Haskell 1935 ; Mitrovica 1996, 0,65–1,1e21) ;
//           λ = (3 000 / 1 350) × largeur de la charge, le rapport de Schubert et al. pour la Fennoscandie (⚠️ un seul cas), largeur
//           = 2 × le rayon du dôme unique qui couvrirait le continent de la bande (❔ la déformation garde la largeur de la plus grande
//           charge, celle qui compte quand une calotte fond ; sans N) ; socle porté par cellule, z = socle déchargé + H − (ρ_i/ρ_m) H −
//           écart. Le socle resté bas sous une calotte qui fond l'expose à l'air plus chaud (Abe-Ouchi et al. 2013, Nature 500:190) ;
//         · BILAN INTÉGRÉ sur toute la calotte, chaque cellule à SA latitude et SON altitude (Weertman 1976, Nature 261:17 ;
//           Pollard 1978, Nature 272:233). TEMPÉRATURE d'un point : la boîte CALOTTE de sa bande (physics/saisons.js, mode
//           saisonnier de North et al. 1981 ; l'air de la bande qui traverse la calotte et que son albédo refroidit) — sa moyenne
//           annuelle (zone du bilan méridien, écart de la bande et écart de la calotte) plus T₂ (P₂(x) − ⟨P₂⟩_zone) pour la latitude du
//           point, et son cycle annuel, forcé par les harmoniques de l'insolation À LA DATE de chaque sous-pas (obliquité et
//           précession). La MARGE, le dernier anneau du dôme, est dans l'air de la TERRE LIBRE de sa bande qui la borde (❔ sans source :
//           la zone d'ablation au bord de la calotte reçoit l'air de la terre libre voisine ; les cellules de la table n'ont pas de longitude) ; un sol nu
//           aussi. ALTITUDE : une seule lecture de la colonne — au-dessus de
//           la couche limite, l'air libre suit la loi adiabatique du profil du modèle (radiative/calculations.js, loiAdiabatique :
//           sèche puis humide, Pierrehumbert 2010 éq. 2.33). SOUS LA CALOTTE, il part du sommet de l'inversion au niveau de la mer et
//           la surface est sous l'inversion, T_inv = 0,67 T_s + 88,9 K (Jouzel & Merlivat 1984, JGR 89:11749, mesurée sur la surface
//           enneigée de la calotte antarctique ; sans inversion au-dessus de 269,4 K) : T_s(z) = min(T_inv(z), (T_inv(z) − 88,9)/0,67)
//           en moyenne annuelle, soit un gradient de surface Γ/0,67 sous inversion. Relation de moyenne ANNUELLE, l'inversion est
//           celle du sol qui ne reçoit pas le soleil : l'inversion propre à l'altitude (au-delà de celle du niveau de la mer, que
//           porte déjà la boîte calotte) est répartie sur l'année au poids (S_max − S)/(S_max − S̄) de l'insolation du point, nulle au
//           maximum d'insolation : en été la surface suit l'air libre, en hiver elle s'en découple (❔ 🔧 forme sans source, choisie
//           en regardant la chaîne 🐾 et la fonte d'été des stations du Groenland ouest ; elle ne déplace pas la moyenne annuelle,
//           celle de J&M, dont la seule température annuelle à 2 m des stations de van den Broeke et al. 2008 est un contrôle 🎯).
//           Un SOL SANS GLACE (le sommet d'une calotte qui n'est pas née) est hors du domaine de
//           cette mesure : l'inversion de J&M est celle d'une neige, très émissive, isolante et réfléchissante, qui ne reçoit
//           presque rien du sol ni du soleil ; un sol nu conduit et stocke la chaleur et absorbe le soleil d'été. Sa surface suit
//           l'air libre, parti de la boîte terre libre au niveau de la mer (❔ pas d'inversion propre à l'altitude sur un sol nu).
//           Le bord d'une calotte est la dernière cellule gagnée, la moins favorable et la plus mince, dans l'air de la terre libre :
//           c'est là qu'elle fond, ce qui borne sa taille ;
//         · accumulation : l'humidité qu'APPORTENT les tourbillons des latitudes moyennes, pas la vapeur locale. Transport d'énergie
//           humide en diffusion (Siler, Roe & Armour 2018, J. Climate 31:7481, éq. 1, 2, 5) sur le profil T(x) du bilan de North :
//           F_q(x) = −(2π p_s/g) D (1 − x²) [1 − w(x)] dq/dx, q = HR · q*(T(x)) sur l'eau liquide (une seule phase, ❔ celle des
//           EBM humides usuels, article non relu), dq/dx analytique, w = e^(−x²/0,3²) (part de la cellule de Hadley),
//           P − E = −(1/2πa²) dF_q/dx. Sur la glace la sublimation est négligée : la neige d'un point vaut P − E à sa latitude,
//           réduite avec l'altitude comme la vapeur saturante (sur glace) au sommet de l'inversion, p_sat(T_inv(z))/p_sat(T_inv(0)),
//           les jours de gel seulement (la pluie ne s'accumule pas) ;
//         · fonte : BILAN D'ÉNERGIE DE SURFACE d'une surface qui fond (à 0 °C), Q = τ(1 − α) S + LW↓ − σT₀⁴ + H + LE, linéarisé
//           autour de T₀ en Q = absorbé + c₀ + c₁ (T_a − T₀) : S = insolation journalière À LA DATE au nœud (physics/orbite.js et
//           physics/saisons.js) × Soleil de l'époque, τ(1 − α) = part absorbée au sol par une neige sèche, une neige mouillée ou une
//           glace nue (transfert solaire du modèle, physics/meridien.js) ; LW↓ = ε σ T_a⁴, ciel clair de Brutsaert 1975 (Water Resour. Res.
//           11:742), ε = 1,24 (e_a/T_a)^(1/7), nuages bas et moyens du modèle noirs à T_a (❔ les moyens sont plus froids) ;
//           H et LE par la formule de transfert neutre de Monin–Obukhov, C = κ² / [ln(z_v/z₀) ln(z_T/z₀)] (❔ stabilité négligée,
//           z_h = z₀), vent et rugosité MESURÉS (van den Broeke et al. 2008, The Cryosphere 2:179, table 2), humidité de surface du
//           modèle, chaleur latente et c_p des mêmes courbes que le profil. Chaque jour s'écarte du cycle annuel selon une loi
//           normale d'écart-type σ = 1,66 − 0,15 min(T, 0) K (Seguinot & Rogozhina 2014, J. Glaciol. 60:603, éq. 3, ERA-40 sur le
//           Groenland ; ❔ appliquée aussi aux terres sans glace ; au-dessus de 0 °C σ garde sa valeur de 0 °C) : fonte attendue
//           E[max(0, Q)]/L_f en forme semi-analytique (celle des degrés-jours de Calov & Greve 2005, J. Glaciol. 51:173, éq. 6,
//           autour du seuil T* = −(absorbé + c₀)/c₁) sur 24 nœuds de l'année ; une NEIGE SÈCHE ne fond que le jour où son propre bilan,
//           sous son albédo, atteint la fusion (seuil T*_sec), puis fond mouillée (fonteJour, la même loi pour la neige des terres et
//           la banquise, EARTH.glaceSaisonniere) ; neige de l'année fondue d'abord, puis glace nue
//           (Reeh 1991, Polarforschung 59:113) ; REGEL de la fonte M de l'année dans le névé : son froid, (c_i/L_f) max(0, −T̄) ×
//           neige, et la rétention capillaire de la neige restante, (ρ_e/ρ_o − 1)(neige − M), nulle en zone d'ablation (Pfeffer et
//           al. 1991, sous la forme de Janssens & Huybrechts 2000, Ann. Glaciol. 31:133, écrite par Reijmer et al. 2012, The
//           Cryosphere 6:743, éq. 5 ; ρ_o = 300, ρ_e = 960 kg/m³ mesurées). Pas de facteur degrés-jours : ceux de Braithwaite 1995
//           (J. Glaciol. 41:153, neige ~3, glace ~8 mm d'eau par °C·jour) sont un contrôle 🎯 du rapport fonte / degrés-jours.
//           L'orbite est celle de la DATE de chaque sous-pas (âge de fin du clic + temps restant), lue entre les deux lignes de la
//           table La2004 (pas de 1 ka) qui l'encadrent ; ⚠️ T̄ et T₂ (moyenne annuelle) sont ceux de la fin du clic (ils demandent
//           le solveur) ;
//         · ALBÉDO de la calotte (lu par le co-albédo de sa zone, physics/meridien.js) : moyenne annuelle pondérée par
//           l'insolation, neige sèche hors fonte, neige mouillée puis glace nue pendant la fonte (probabilité de fonte de chaque nœud) ;
//         · NAISSANCE sur le plus robuste des sommets dont le dôme peut grandir (PLACE), puis ÉQUILIBRE : l'aire où le bilan
//           intégré s'annule, plafonnée par le continent de la bande ;
//         · EXISTENCE : une calotte n'existe que dans un monde à océan (h2o/calculations_h2o.js, mondeOcean) ; hors de lui l'eau n'a
//           pas de phase condensée (au-dessus de son point critique, ou toute en vapeur) ou aucune atmosphère ne porte de neige :
//           aire, masse et albédo nuls, socle qui relaxe sans charge ;
//         · ÉTAT PORTÉ (DATA['🗻']['🍰🗻🧊'], le socle ['🔺📏🗻🧊'] par cellule et le sommet ['📿🗻🧊'], datés 📅🗻🧊) : au clic sur
//           la frise, l'état vient de la CONFIG de l'époque (EPOCH['🗻']['🍰🗻🧊'], aires sourcées), socle à l'équilibre sous elle,
//           sommet à placer (null) ; au clic time, il
//           part de l'état du clic précédent et avance sur le temps écoulé par la CONSERVATION DE LA MASSE,
//           dV/dt = a A_bande B̄ / ρ_i (plafond : le continent de la bande, le surplus part à la mer), avec le socle. Variable
//           intégrée q = V^(1/5) : pour N dômes égaux, dq/dt = (π/5) ((8π/15) C)^(−4/5) N^(1/5) B̄ / ρ_i, fini à la naissance et
//           constant à bilan constant, et l'aire de V est N^(1/5) fois celle d'un dôme de volume V, N pris à l'aire (point fixe en 4
//           itérations, N^(1/5) varie peu). Heun en sous-pas bornés par τ_b et par le temps propre de la calotte,
//           ρ_i max(H̄, tolérance) / max(accumulation, fonte), sur les MEMOIRE_ANS derniers ans du clic, jusqu'à sa fin (le
//           forçage change à chaque sous-pas) ; avant, Euler implicite de la même loi en pas qui doublent, borné par l'équilibre
//           à la date du pas (stable, un clic plus long avance plus loin) ; socle exact sous une charge linéaire sur chaque pas.
//         · MASSE : ρ_i Σ V des calottes du pas (🧮⚖️🗻🧊, posée par physics/meridien.js), engagée avec elles (⚖️🗻🧊) ; c'est la
//           glace continentale du partage de l'eau (h2o/calculations_h2o.js).
//       Contrôles 🎯 (pas des entrées) : accumulation moyenne de l'Antarctique posé, 143 ± 4 kg m⁻² an⁻¹ (Arthern et al. 2006, JGR
//       111:D06107) ; rapport fonte / degrés-jours positifs sur le Groenland, neige ~3 et glace ~8 mm d'eau par °C·jour (Braithwaite
//       1995) ; température annuelle à 2 m des stations S5, S6, S9 du Groenland ouest (van den Broeke et al. 2008, table 2) ;
//       volume du Groenland (BedMachine v3, 2,99e6 km³). Pas des contrôles (📖) : le bilan de masse de ces stations (la forme de
//       l'inversion hivernale regarde leur fonte d'été) et la masse des calottes portées (τ est fermé sur le volume de Bedmap2).
//       Approximations DÉCLARÉES : une calotte par bande et par hémisphère, de N dômes égaux (⚠️ des morceaux de même aire ; ⚠️ la
//       part du continent couverte, la terre la plus froide d'abord ; ❔ N = 1 avant 540 Ma), dont la portée en latitude (❔ celle
//       d'un dôme de l'aire cumulée) ne voit pas la longitude ;
//       chaque cellule à sa latitude et à son socle moyens (❔ socle uniforme dans la cellule, centré sur sa moyenne et contenu
//       dans sa classe, pour la part que couvre la marge) ; ⚠️ rang des cellules fixé sur un calcul (orbite de la fin du clic) ;
//       ❔ le plateau continental est rangé comme une terre au niveau de la mer, et la glace qui le couvre est posée (⚠️ pas de
//       flottaison : une marge mince sur le plateau est comptée posée) ;
//       ⚠️ l'écart du socle est porté par cellule : une cellule qui change de rang garde son écart, pas son enfoncement ; relief
//       du socle ignoré dans la loi plastique (il s'ajoute sous la glace) ; plateaux continentaux jusqu'au seuil du continent de la
//       table compris (PALEOGEO.socle_continent_m, −1 000 m) ;
//       socle SANS glace : la charge, c'est ce fichier
//       qui la pose, la table la retire, même croûte pour les deux calottes (glace de la carte 0 Ma retirée cellule par cellule,
//       rebond d'Airy et recharge d'eau de mer des socles restés sous la mer ; sur les cartes qui copient la carte 0 Ma,
//       l'empreinte transportée de la calotte reçoit ce socle déchargé, ⚠️ relief propre de la carte remplacé ; ⚠️ l'aire
//       antarctique posée est une entrée de τ ; Groenland fermé sur BedMachine v3, ⚠️ socle chargé uniforme ; ⚠️ marche de 80 à
//       85 Ma : les reconstructions plus anciennes restent au niveau chargé) ; boîte calotte de la bande (moyenne et cycle) sur toute
//       la calotte, terre libre de la bande sur son dernier anneau, cycle indépendant de l'altitude ; ⚠️ vent et rugosité de la zone d'ablation du Groenland ouest pour toutes les
//       calottes et terres ; un seul τ_b par bande ; avant la première carte (540 Ma) :
//       la terre de l'époque (1 − 🍰🗻🌊) dans chaque bande, à la fois continent et terre émergée (❔ sans carte, pas de plateau
//       continental distinct), répartie par classe de socle comme la terre émergée de toutes les bandes de la carte de 540 Ma, dans
//       la tranche du milieu de la bande (❔).
//       Terre de chaque bande (parts) : le continent (socle > −1 000 m, toutes ses cellules) porte les calottes ; la terre émergée
//       (cellules de socle > 0) est la terre thermique et d'albédo du bilan méridien et de l'albédo planétaire — une seule source
//       par bande et par date.
// Version 1.19.1
// - v1.19.1 (2026-11-02): commentaires : une calotte est N dômes égaux (nombre effectif des morceaux connexes de la carte).
// - v1.19.0 (2026-11-02): une calotte est N dômes (PALEOGEO.n_morceaux, ses morceaux connexes sur la carte) et non un seul.
// - v1.18.1 (2026-11-01): commentaires : boîte calotte ou terre libre selon le point, cellules de la table sans longitude.
// - v1.18.0 (2026-11-01): geographie et parts portent rLibre, distance de la terre libre à la côte (PALEOGEO.r_libre).
// - v1.17.0 (2026-10-31): un point de calotte lit la boîte calotte de sa bande, sa marge et un sol nu la terre libre.
// - v1.16.1 (2026-10-31): naissance d'un dôme d'une seule cellule définie ; borne basse du continent lue dans PALEOGEO.
// - v1.16.0 (2026-10-31): la marge gagne une cellule par son haut (socleCouvert).
// Date: [November 2, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.

(function () {
    'use strict';

    const K = {
        RHO_MANTEAU: 3300,       // [kg/m³] manteau supérieur (Turcotte & Schubert 2014) — isostasie
        // Bilan d'énergie de surface. Contrôle 🎯 (pas une entrée) : facteurs degrés-jours de Braithwaite 1995, neige ~3, glace ~8
        // kg m⁻² °C⁻¹ j⁻¹ (mm d'eau par °C·jour), comparés à fonte / degrés-jours positifs du modèle (ddf_neige, ddf_glace).
        KARMAN: 0.40,            // [-] constante de von Kármán (mesurée, Högström 1996, Boundary-Layer Meteorol. 78:215 : 0,40 ± 0,01)
        Z_VENT: 10,              // [m] hauteur du vent mesuré (van den Broeke et al. 2008, table 2)
        Z_TEMPERATURE: 2,        // [m] hauteur de la température de l'air (même table)
        // ⚠️ MESURE RÉGIONALE : rugosité d'une neige, minimum de mars aux stations S5 et S6 (~10⁻⁴ m ; 10⁻⁵ à S9, jusqu'à 2·10⁻² sur
        // la glace rugueuse de fin d'été) — van den Broeke et al. 2008, § 3.1 et table 2 ; z_h = z₀ (❔ Andreas 1987 le donne pour
        // une neige lisse ; sur la glace rugueuse z_h ≪ z₀ compense en partie un z₀ plus grand).
        Z0_M: 1e-4,              // [m]
        // ⚠️ FOURCHETTE MESURÉE, milieu : vent moyen annuel à 10 m sur la zone d'ablation du Groenland ouest, 5,0 / 6,4 / 7,3 m/s
        // à S5 / S6 / S9 (van den Broeke et al. 2008, table 2) → 6,15, appliqué à toutes les calottes et terres.
        VENT_SURFACE_M_S: 6.15,  // [m/s]
        BRUTSAERT_A: 1.24,       // [-] émissivité du ciel clair ε = 1,24 (e_a/T_a)^(1/7), e_a en hPa (Brutsaert 1975, éq. 11)
        BRUTSAERT_N: 7,          // [-] exposant 1/7 de la même formule
        SIGMA_FONTE_K: 1.66,     // [K] écart-type des températures journalières à 0 °C (Seguinot & Rogozhina 2014, éq. 3)
        PENTE_SIGMA: -0.15,      // [K/°C] sa pente sous 0 °C (même régression, ERA-40 1958–2001 sur le Groenland, r² = 0,79)
        RHO_NEIGE_SECHE: 300,    // [kg/m³] névé sec (Janssens & Huybrechts 2000, d'après Pfeffer et al. 1991)
        RHO_NEIGE_MOUILLEE: 960, // [kg/m³] névé saturé d'eau (même source)
        NOEUDS: 24,              // nœuds de l'année du cycle annuel (degrés-jours stochastiques) — résolution, pas un réglage
        D_HUMIDE: 1.16e6,        // [m²/s] diffusivité de l'énergie humide (Siler, Roe & Armour 2018 : T zonale d'ERA-Interim)
        // Inversion de surface (Jouzel & Merlivat 1984) : T_inv = JM_PENTE T_s + JM_ORIGINE, mesurée en Antarctique (❔ ailleurs)
        JM_PENTE: 0.67,          // [-]
        JM_ORIGINE: 88.9,        // [K]
        PAS_COLONNE_M: 100,      // [m] pas de la table T(z), p(z) de la colonne d'un point (montée de la loi adiabatique) — numérique
        SIGMA_HADLEY: 0.3,       // [-] largeur en x = sin φ de la part de la cellule de Hadley, w = e^(−x²/σ²) (même article, éq. 6)
        // ⚠️ MESURE POSÉE : viscosité moyenne du manteau jusqu'à ~1 400 km, tirée du soulèvement daté de la Fennoscandie par
        // l'équation du demi-espace visqueux (Haskell 1935 ; Mitrovica 1996, JGR 101:555 : 0,65–1,1e21 Pa·s)
        VISCOSITE_MANTEAU: 1e21, // [Pa·s]
        // ⚠️ λ / largeur de la charge : 3 000 km pour les 1 350 km de la Fennoscandie (Schubert, Turcotte & Olson 2001, ch. 5), un seul cas
        LAMBDA_SUR_LARGEUR: 3000 / 1350,
        MEMOIRE_ANS: 1e5,        // [an] fin d'un clic intégrée en Heun ; avant, Euler implicite en pas doublés (coût borné)
        PLAGE_RANG_K: 40         // [K] plage de la recherche de ΔT* (rang des cellules), 10 bissections : 0,08 K — numérique
    };
    // Bandes : chaque zone d'EARTH.ZONES (bornes en sin φ, la seule définition) dans chaque hémisphère (h, signe de la latitude) ;
    // aire = 2πR² Δsin φ par hémisphère. Ordre : pôles, moyennes latitudes, tropiques, le sud avant le nord.
    const BANDES = [];
    for (const z of window.EARTH.ZONES.slice().reverse()) {
        for (const h of [-1, 1]) BANDES.push({ cle: (h < 0 ? 'S_' : 'N_') + z.cle, zone: z.cle, h: h, x0: z.x0, x1: z.x1 });
    }
    /** Rapport ρ_i/ρ_m de l'isostasie d'Airy : enfoncement du socle par mètre de glace. */
    const isostasie = () => window.CONST.RHO_GLACE / K.RHO_MANTEAU;
    /** Classes de socle de la table et cellules d'une bande (tranches × classes, indice j · NCLASSES + k). */
    const nClasses = () => window.PALEOGEO.socle_bornes_m.length + 1;
    const nCellules = () => window.PALEOGEO.tranches * nClasses();
    /** La cellule i est-elle de la terre émergée ? Sa classe de socle k est au-dessus de la mer (borne basse k − 1 ≥ 0). */
    const emergee = (i) => { const k = i % nClasses(); return k > 0 && window.PALEOGEO.socle_bornes_m[k - 1] >= 0; };

    /** Paléogéographie de la date courante (INTERIEUR.ageCourant) : { cle: cellules de la bande }, chaque bande { N, aire [part de
     *  la bande], lat [°], x = sin |φ|, socle [m] par cellule, cellules (indices des cellules non vides), continent, emerge }. Entre
     *  deux cartes de 5 Ma : aire interpolée, latitude et socle moyens des deux cartes pondérés par leurs aires (une cellule vide
     *  n'existe pas à cette date). Avant la première carte : terre de l'époque (1 − 🍰🗻🌊), répartie par classe de socle comme la
     *  terre émergée de la carte la plus ancienne, dans la tranche du milieu de la bande, à la latitude de ce milieu (❔). */
    function geographie() {
        const G = window.PALEOGEO, A = G.ages_Ma, ageMa = window.INTERIEUR.ageCourant() / 1e6, N = nCellules(), K = nClasses(), out = {};
        const avant = ageMa > A[A.length - 1];
        let i = 0;
        while (i < A.length - 2 && A[i + 1] < ageMa) i++;
        const w = Math.max(0, Math.min(1, (ageMa - A[i]) / (A[i + 1] - A[i])));
        for (const b of BANDES) {
            const aire = new Float64Array(N), lat = new Float64Array(N), socle = new Float64Array(N);
            if (avant) {
                const c = 1 - window.DATA['📅']['🗻']['🍰🗻🌊'], deg = 180 / Math.PI;
                const lm = Math.asin((b.x0 + b.x1) / 2) * deg, l0 = Math.asin(b.x0) * deg, l1 = Math.asin(b.x1) * deg;
                const j = Math.floor((lm - l0) / ((l1 - l0) / G.tranches));
                for (let k = 0; k < K; k++) {
                    aire[j * K + k] = c * G.avant.part[k]; lat[j * K + k] = lm; socle[j * K + k] = G.avant.socle_m[k];
                }
            } else {
                const A0 = G.aire[b.cle][i], A1 = G.aire[b.cle][i + 1], L0 = G.lat_deg[b.cle][i], L1 = G.lat_deg[b.cle][i + 1];
                const Z0 = G.socle_m[b.cle][i], Z1 = G.socle_m[b.cle][i + 1];
                for (let n = 0; n < N; n++) {
                    const a0 = (1 - w) * A0[n], a1 = w * A1[n];
                    aire[n] = a0 + a1;
                    if (aire[n] > 0) { lat[n] = (a0 * L0[n] + a1 * L1[n]) / aire[n]; socle[n] = (a0 * Z0[n] + a1 * Z1[n]) / aire[n]; }
                }
            }
            // Distance de la terre libre à la côte selon la part couverte (PALEOGEO.r_libre), interpolée entre les deux cartes.
            const rLibre = avant ? G.avant.r_libre : G.r_libre[b.cle][i].map((r, k) => (1 - w) * r + w * G.r_libre[b.cle][i + 1][k]);
            // Nombre effectif de dômes selon la part couverte du continent (PALEOGEO.n_morceaux), interpolé entre les deux cartes.
            const nMorceaux = avant ? G.avant.n_morceaux : G.n_morceaux[b.cle][i].map((n, k) => (1 - w) * n + w * G.n_morceaux[b.cle][i + 1][k]);
            const cellules = [];
            let continent = 0, emerge = 0;
            for (let n = 0; n < N; n++) {
                if (aire[n] > 0) cellules.push(n);
                continent += aire[n];
                if (emergee(n)) emerge += aire[n];
            }
            // Contrôle de la table : une part de bande ne dépasse pas 1 (la terre émergée est une partie du continent).
            if (!(continent <= 1 + 1e-9) || !(emerge <= continent)) {
                throw new Error('[CALOTTES] PALEOGEO à ' + ageMa + ' Ma, ' + b.cle + ' : continent ' + continent + ', terre émergée ' + emerge + ' (≤ 1 attendu)');
            }
            out[b.cle] = { N: N, aire: aire, lat: lat, x: lat.map((l) => Math.sin(l * Math.PI / 180)), socle: socle, cellules: cellules,
                continent: continent, emerge: emerge, rLibre: rLibre, nMorceaux: nMorceaux };
        }
        return out;
    }

    /** Terre de chaque bande à la date courante : { cle: { continent, emerge } } [m²/m², part de la bande] — continent (socle >
     *  −1 000 m, support des calottes) et terre émergée (socle > 0, terre thermique et d'albédo) : sommes des cellules de
     *  geographie(), la seule source de la terre par bande. */
    function parts() {
        const G = geographie(), out = {};
        for (const b of BANDES) out[b.cle] = { continent: G[b.cle].continent, emerge: G[b.cle].emerge, rLibre: G[b.cle].rLibre, nMorceaux: G[b.cle].nMorceaux };
        return out;
    }

    /** Aire de la bande d'un hémisphère [m²]. */
    const aireBande = (bande) => 2 * Math.PI * Math.pow(window.DATA['📜']['📐'] * 1000, 2) * (bande.x1 - bande.x0);
    /** Loi plastique sur socle d'Airy, H = C √s [s en m] : C = √(2 τ / (ρ_i g (1 − ρ_i/ρ_m))) [m^½], τ de la table. */
    const plastique = () => Math.sqrt(2 * window.PALEOGEO.tau_Pa / (window.CONST.RHO_GLACE * window.DATA['📅']['🍎'] * (1 - isostasie())));
    /** Volume [m³] du dôme de rayon R [m] : (8π/15) C R^(5/2). */
    const volumeDome = (R) => 8 * Math.PI / 15 * plastique() * Math.pow(R, 2.5);

    /** Rang des cellules par la terre émergée d'abord, puis par le socle : le rang d'une charge portée hors d'un monde à océan,
     *  sans neige ni bilan (sansCalotte). */
    const rangSocle = (gb) => gb.cellules.slice().sort((p, q) => (emergee(q) - emergee(p)) || (gb.socle[q] - gb.socle[p]));

    /** Valeur d'une table de la carte aux parts PALEOGEO.fractions_libre (r_libre, n_morceaux) à la part f : linéaire entre deux
     *  parts ; au-delà de la dernière (0,95), sa valeur. */
    function selonPart(r, f) {
        const F = window.PALEOGEO.fractions_libre;
        let k = 0;
        while (k < F.length - 2 && F[k + 1] < f) k++;
        const t = Math.min(1, (f - F[k]) / (F[k + 1] - F[k]));
        return r[k] + t * (r[k + 1] - r[k]);
    }
    /** Nombre effectif de dômes d'une calotte de fraction a de la bande : PALEOGEO.n_morceaux à la part a / continent (une calotte est
     *  d'un seul tenant : ses morceaux connexes sur la carte) ; aire nulle : un dôme. */
    const nDomes = (gb, a) => a === 0 ? 1 : selonPart(gb.nMorceaux, a / gb.continent);

    /** Géométrie de la calotte de fraction a de la bande (a ≤ continent) : N = nDomes dômes égaux (⚠️ des morceaux de même aire), de
     *  rayon R = √(a A_bande / (N π)), posés sur les cellules dans l'ordre du rang gb.rang (chaque cellule pour sa part dans chaque
     *  dôme) : part couverte f de chaque cellule (la dernière, la marge, en partie), liste des
     *  cellules couvertes (du sommet à la marge), épaisseur moyenne H [m] de leur partie couverte — moyenne exacte de C √(R − ρ)
     *  sur l'anneau ρ₀ … ρ₁ qu'elle occupe, écrite sans soustraction de grands nombres —, nombre de dômes N, rayon R [m] d'un dôme et
     *  volume V [m³] des N dômes. */
    function geometrie(a, bande, gb) {
        const N = nDomes(gb, a), Ab = aireBande(bande), A = a * Ab / N, R = Math.sqrt(A / Math.PI), C = plastique();
        const f = new Float64Array(gb.N), H = new Float64Array(gb.N), couvertes = [];
        let S = 0;
        for (const i of gb.rang) {
            if (!(S < A)) break;
            const w = gb.aire[i] * Ab / N, reste = A - S, marge = w >= reste, c = marge ? reste : w;   // part de la cellule dans un dôme
            const r0 = Math.sqrt(S / Math.PI), r1 = marge ? R : Math.sqrt((S + c) / Math.PI);
            const u0 = reste / (Math.PI * (R + r0)), u1 = (reste - c) / (Math.PI * (R + r1)), m = Math.sqrt(u0 * u1);
            const P3 = u0 + m + u1, P5 = u0 * u0 + u0 * m + u0 * u1 + u1 * m + u1 * u1;
            H[i] = 2 * C * (2 / 3 * R * P3 - 2 / 5 * P5) / ((r0 + r1) * (Math.sqrt(u0) + Math.sqrt(u1)));
            f[i] = c / w;
            couvertes.push(i);
            S += c;
        }
        return { f: f, H: H, couvertes: couvertes, N: N, R: R, V: N * volumeDome(R) };
    }

    /** [m] Socle moyen de la part f d'une cellule que couvre la calotte (f = 0 : son point le plus haut). La marge gagne une
     *  cellule par son haut : le relief est continu, la part couverte d'une cellule est sa part la plus haute. ❔ La table ne donne
     *  d'une cellule que son socle moyen m et sa classe [bas, haut] : socle uniforme, centré sur m et contenu dans la classe, de
     *  demi-largeur w = min(haut − m, m − bas) (la classe du haut n'a pas de borne haute : w = m − bas ; la classe du bas a pour
     *  borne basse le seuil du continent de la table, PALEOGEO.socle_continent_m) ; la part couverte la plus haute a pour moyenne
     *  m + w (1 − f), m quand la cellule est couverte. */
    function socleCouvert(gb, i, f) {
        const G = window.PALEOGEO, B = G.socle_bornes_m, k = i % nClasses(), m = gb.socle[i];
        const bas = k === 0 ? G.socle_continent_m : B[k - 1], w = k === B.length ? m - bas : Math.min(B[k] - m, m - bas);
        return m + w * (1 - f);
    }

    /** Charge d'équilibre d'Airy [m], moyenne de chaque cellule : (ρ_i/ρ_m) f H (0 hors de la calotte). */
    function charge(g, N) {
        const L = new Float64Array(N);
        for (const i of g.couvertes) L[i] = isostasie() * g.f[i] * g.H[i];
        return L;
    }

    // erfc d'Abramowitz & Stegun 1964, 7.1.26 (|ε| ≤ 1,5e-7) : erfc(a) = t P(t) e^(−a²), t = 1/(1 + p a), p = 0,3275911
    const AS = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
    /** Loi normale réduite en z : [densité φ(z), répartition Φ(z)] (erfc d'Abramowitz & Stegun). */
    function normale(z) {
        const a = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * a), ex = Math.exp(-a * a);
        const y = t * (AS[0] + t * (AS[1] + t * (AS[2] + t * (AS[3] + t * AS[4])))) * ex;      // erfc(|z|/√2)
        return [ex / Math.sqrt(2 * Math.PI), z >= 0 ? 1 - y / 2 : y / 2];
    }

    /**
     * Fonte d'un jour de nœud [kg m⁻² j⁻¹] : UNE loi pour toute neige et toute glace (calottes, neige des terres, banquise —
     * EARTH.glaceSaisonniere). T [°C] : air du nœud, dont les jours s'écartent selon une loi normale d'écart-type
     * σ(T) = SIGMA_FONTE_K + PENTE_SIGMA min(T, 0) (Seguinot & Rogozhina 2014) ; S [W/m²] : insolation du nœud ; ab = { sec, neige,
     * glace } : parts de S absorbées au sol par une neige sèche, une neige mouillée et une glace nue (transfert solaire du modèle) ;
     * seb = { c0, c1 } : bilan d'une surface en fusion (T₀ = 0 °C), Q = ab S + c0 + c1 T. Une NEIGE SÈCHE ne fond que le jour où son
     * propre bilan, sous son albédo, atteint la fusion : T > T*_sec = −(ab.sec S + c0)/c1 ; elle fond alors mouillée (son albédo tombe),
     * Q = ab.neige S + c0 + c1 T. Fonte attendue E[Q 1(T > T*_sec)] = c1 [σ φ(m_s/σ) + m_n Φ(m_s/σ)], m_s = T − T*_sec,
     * m_n = T − T*_neige (≥ 0 : T*_neige ≤ T*_sec). Une glace nue n'a pas d'état sec : elle fond dès T > T*_glace (même forme,
     * Calov & Greve 2005, éq. 6). ❔ Chaque jour est tiré seul : la neige d'hier, mouillée, ne garde pas son albédo.
     * Renvoie { p : probabilité de fonte de la neige, neige, glace [kg m⁻² j⁻¹], gel : probabilité d'un jour sous 0 °C, pdd [°C] }.
     */
    function fonteJour(T, S, ab, seb) {
        const s = K.SIGMA_FONTE_K + K.PENTE_SIGMA * Math.min(T, 0);
        const q = window.CONV.SECONDS_PER_DAY / window.CONST.L_FUSION_GLACE * seb.c1;    // [kg m⁻² j⁻¹ par K]
        const ms = T + (ab.sec * S + seb.c0) / seb.c1, ns = normale(ms / s), mn = T + (ab.neige * S + seb.c0) / seb.c1;
        const mg = T + (ab.glace * S + seb.c0) / seb.c1, ng = normale(mg / s), n0 = normale(T / s);
        return { p: ns[1], neige: q * (s * ns[0] + mn * ns[1]), glace: q * (s * ng[0] + mg * ng[1]), gel: 1 - n0[1], pdd: s * n0[0] + T * n0[1] };
    }

    /**
     * Bilan de masse annuel [kg m⁻² an⁻¹] en un point de calotte :
     *   Ts : température annuelle de surface [K] (latitude et altitude comprises) ; dI [K] : inversion de surface due à l'altitude du
     *   point (au-delà de celle du niveau de la mer, déjà dans sa boîte), hivernale ; cyc = { a1, d1, r2, i2 } : cycle annuel de la
     *   boîte de son point (calotte ; terre libre pour la marge et un sol nu) à la date (physics/saisons.js) ; Sn : insolation moyenne de chaque nœud de l'année à la date, à sa
     *   latitude [W/m², Soleil de l'époque] ; absorbe = { sec, neige, glace } : part de l'insolation absorbée au sol par une neige
     *   sèche, mouillée, une glace nue ; seb = { c0 [W/m²], c1 [W m⁻² K⁻¹] } : bilan d'énergie d'une surface qui fond,
     *   Q = absorbé + c0 + c1 (T_a − T₀) ; PmE : P − E à sa latitude [kg m⁻² an⁻¹] ; rapport : réduction de la neige avec l'altitude.
     *   Albédos des matériaux : DATA['🪩🍰'].
     * Nœud k de l'année (θ = 2π t / an depuis l'équinoxe de printemps) : T = Ts + dI (1 − w_k) + a1 sin(θ − d1) + r2 cos 2θ − i2 sin 2θ,
     * w_k = (S_max − S_k)/(S_max − S̄) ; fonte du nœud par fonteJour (part gelée, degrés-jours positifs pour le diagnostic, fonte
     * d'une neige qui part sèche et d'une glace nue).
     */
    function bilanPoint(Ts, dI, cyc, Sn, absorbe, seb, PmE, rapport) {
        const mu = Ts - window.CONST.T0_WATER, M = window.DATA['🪩🍰'];  // [°C] ; albédos des matériaux
        const h = window.CONST.AN_TROPIQUE_JOURS / K.NOEUDS, w = 2 * Math.PI / K.NOEUDS;
        // Inversion propre à l'altitude du point, dI (moyenne annuelle), répartie sur l'année là où le sol ne reçoit pas le soleil :
        // poids (S_max − S)/(S_max − S̄), de moyenne 1, nul au maximum d'insolation (en été, la surface suit l'air libre).
        let sMax = 0, sMoy = 0;
        for (let k = 0; k < K.NOEUDS; k++) { sMax = Math.max(sMax, Sn[k]); sMoy += Sn[k] / K.NOEUDS; }
        let pdd = 0, gel = 0, mN = 0, mG = 0, sS = 0, sSf = 0;
        for (let k = 0; k < K.NOEUDS; k++) {
            const th = w * (k + 0.5);
            const T = mu + dI * (1 - (sMax - Sn[k]) / (sMax - sMoy))
                + cyc.a1 * Math.sin(th - cyc.d1) + cyc.r2 * Math.cos(2 * th) - cyc.i2 * Math.sin(2 * th);
            const j = fonteJour(T, Sn[k], absorbe, seb);
            pdd += h * j.pdd;                                           // [°C·jour]
            gel += j.gel / K.NOEUDS;                                    // part de l'année sous 0 °C
            mN += h * j.neige;                                          // [kg m⁻²] fonte d'une neige pendant le nœud
            mG += h * j.glace;                                          // [kg m⁻²] fonte d'une glace nue
            sS += Sn[k]; sSf += Sn[k] * j.p;
        }
        const neige = Math.max(0, PmE) * rapport * gel;                 // [kg m⁻² an⁻¹] neige des jours de gel
        // Neige de l'année fondue d'abord, puis glace nue (Reeh 1991) : la neige couvre la part p de la saison de fonte (sans neige,
        // glace nue toute la saison).
        const p = neige === 0 ? 0 : Math.min(1, neige / mN);
        const Mfonte = p * mN + (1 - p) * mG;                           // fonte de l'année
        // Regel (Janssens & Huybrechts 2000, sous la forme de Reijmer et al. 2012, The Cryosphere 6:743, éq. 2 et 5) :
        // E_r = min(P_r, M), P_r = (c_i/L_f) |T̄| C + (C − M)(ρ_e/ρ_o − 1) — froid du névé de l'année (nul à T̄ ≥ 0 °C) et eau retenue
        // par capillarité dans la neige restante. En zone d'ablation (M > C), le second terme est négatif et le regel s'annule
        // (P_r ≥ 0). La borne de J&H par la précipitation de l'année tient d'elle-même : E_r ≤ M ≤ C, ou P_r < C dès que M > C.
        const R = Math.max(0, Math.min(Mfonte, window.CONST.CP_GLACE / window.CONST.L_FUSION_GLACE * Math.max(0, -mu) * neige
            + (K.RHO_NEIGE_MOUILLEE / K.RHO_NEIGE_SECHE - 1) * (neige - Mfonte)));
        const fonte = Mfonte - R;
        // Albédo de l'année pondéré par l'insolation : neige sèche hors fonte ; pendant la fonte (probabilité de chaque nœud),
        // neige mouillée sur la part p de la saison, glace nue sur le reste.
        const aFonte = p * M['🪩🍰🧊'] + (1 - p) * M['🪩🍰🏊'];
        return { B: neige - fonte, accumulation: neige, fonte: fonte, pdd: pdd, mNeige: mN, mGlace: mG,
            sS: sS, sA: M['🪩🍰❄️'] * sS - (M['🪩🍰❄️'] - aFonte) * sSf };
    }

    /**
     * Colonne d'un point de latitude x = sin |φ| (signe h) de la bande : surface au niveau de la mer = température du point sur une
     * boîte de la bande, SAISONS.temperaturePoint (moyenne annuelle + T₂ (P₂(x) − ⟨P₂⟩_zone), la même que celle de la glace
     * saisonnière) — Tc0 sur la boîte calotte, Tl0 sur la boîte terre libre ; l'air libre monte selon la loi adiabatique du profil
     * (table au pas PAS_COLONNE_M, prolongée à la demande), depuis la pression et l'humidité de surface du modèle (DATA).
     *   · lire(z), SOUS LA CALOTTE : l'air libre part du sommet de l'inversion au niveau de la mer, T_inv(0) = max(Tc0, 0,67 Tc0 +
     *     88,9) ; la surface est sous l'inversion de J&M → { Ts (moyenne annuelle), dI (inversion de J&M à l'altitude z moins celle du
     *     niveau de la mer, ≥ 0), rapport (neige : p_sat(T_inv(z))/p_sat(T_inv(0)), sur glace), p } ;
     *   · marge(z), le dernier anneau de la calotte : la même lecture partie de la terre libre, T_inv(0) = max(Tl0, 0,67 Tl0 + 88,9) ;
     *   · libre(z), SOL SANS GLACE : la surface suit l'air libre parti de Tl0 → { Ts = T(z), dI = 0, rapport = p_sat(T(z))/p_sat(Tl0), p }.
     *     J&M est mesurée sur la surface enneigée de la calotte antarctique (en-tête) : un sol nu est hors de son domaine.
     */
    function colonne(bande, x, c) {
        const D = window.DATA, PHYS = window.PHYS, sb = c.saisons[bande.cle];
        const Tc0 = window.SAISONS.temperaturePoint(sb.calotte.T, bande, x), Tl0 = window.SAISONS.temperaturePoint(sb.terre.T, bande, x);
        const p0 = D['🫧']['🎈'] * window.CONV.STANDARD_ATMOSPHERE_PA, HR = D['🎚️'].H2O.H2O_SURFACE_RH_01;
        /** Montée de l'air libre depuis T0 au niveau de la mer : (z) → { T, p } interpolés dans la table. */
        const montee = (T0) => {
            const T = [T0], P = [p0], Pc = [HR * PHYS.pSatLiquide(T0)];
            return (z) => {
                const u = Math.max(0, z) / K.PAS_COLONNE_M, i = Math.floor(u), f = u - i;
                while (T.length < i + 2) {
                    const n = T.length - 1, e = c.LOI.ascension(T[n], P[n], Pc[n] / P[n], K.PAS_COLONNE_M);
                    T.push(e.T); P.push(e.p); Pc.push(e.pc);
                }
                return { T: T[i] + f * (T[i + 1] - T[i]), p: P[i] + f * (P[i + 1] - P[i]) };
            };
        };
        /** Lecture sous l'inversion de J&M, au-dessus d'une surface de température T0 au niveau de la mer. */
        const sous = (T0) => {
            const Ti0 = Math.max(T0, K.JM_PENTE * T0 + K.JM_ORIGINE), inversion = montee(Ti0), psatI = PHYS.pSatEau(Ti0);
            return (z) => {
                const a = inversion(z), Ts = Math.min(a.T, (a.T - K.JM_ORIGINE) / K.JM_PENTE);
                return { Ts: Ts, dI: (a.T - Ts) - (Ti0 - T0), rapport: PHYS.pSatEau(a.T) / psatI, p: a.p };
            };
        };
        const air = montee(Tl0), psatL = PHYS.pSatEau(Tl0);
        return {
            x: x, PmE: c.PmoinsE(x), lire: sous(Tc0), marge: sous(Tl0),
            libre: (z) => {
                const a = air(z);
                return { Ts: a.T, dI: 0, rapport: PHYS.pSatEau(a.T) / psatL, p: a.p };
            }
        };
    }

    /**
     * Bilan INTÉGRÉ de la calotte de fraction a de la bande sur son socle : chaque cellule couverte à sa latitude et à son
     * altitude, z = socle couvert + H − (ρ_i/ρ_m) H − e — socle couvert m + w (1 − f), la part f de la cellule que couvre la marge,
     * la plus haute (socleCouvert : socle déchargé moyen m de la cellule, demi-largeur w dans sa classe) ; e [m] : écart du socle à
     * son équilibre d'Airy, + : plus bas ; zéro : équilibre —, pondérée par son aire couverte, sous la calotte (colonne lire), sa
     * marge — le dernier anneau — dans l'air de la terre libre (colonne marge). Une calotte d'aire nulle vaut le bilan de son
     * sommet, la première cellule du rang (geo.rang), à son point le plus haut (m + w), SANS GLACE : sa surface suit l'air libre
     * de la terre libre (colonne libre) tant qu'aucune calotte ne la couvre. Renvoie aussi l'épaisseur
     * moyenne H̄ [m], l'altitude, la latitude et la température moyennes, la distance du sommet à la marge (rayon d'un dôme, marge
     * [km]), les degrés-jours, la fonte possible d'une neige et d'une glace (contrôle 🎯 des facteurs degrés-jours) et l'albédo
     * annuel. o : orbite de la date.
     */
    function bilanCalotte(a, bande, geo, c, e, o) {
        const g = geometrie(a, bande, geo);
        const cols = c.colonnes(bande, geo), ab = c.absorbe[bande.zone], marge = g.couvertes[g.couvertes.length - 1];
        let B = 0, acc = 0, fonte = 0, Ts = 0, z = 0, lat = 0, H = 0, poids = 0, pdd = 0, mN = 0, mG = 0, sS = 0, sA = 0;
        for (const k of a === 0 ? [geo.rang[0]] : g.couvertes) {
            const w = a === 0 ? 1 : g.f[k] * geo.aire[k];   // aire nulle : le sommet seul, à son point le plus haut
            const zk = socleCouvert(geo, k, a === 0 ? 0 : g.f[k]) + (1 - isostasie()) * g.H[k] - e[k];
            const glace = a > 0 && k !== marge;               // sous la calotte ; sa marge et un sol nu : la terre libre
            const col = glace ? cols[k].lire(zk) : (a > 0 ? cols[k].marge(zk) : cols[k].libre(zk));
            const mp = bilanPoint(col.Ts, col.dI, c.cycle(bande, o, glace ? 'calotte' : 'terre'), c.insolation(o, bande.h * geo.lat[k]), ab, c.seb(col.p), cols[k].PmE, col.rapport);
            B += w * mp.B; acc += w * mp.accumulation; fonte += w * mp.fonte; Ts += w * col.Ts; z += w * zk; lat += w * geo.lat[k];
            H += w * g.H[k]; poids += w; pdd += w * mp.pdd; mN += w * mp.mNeige; mG += w * mp.mGlace; sS += w * mp.sS; sA += w * mp.sA;
        }
        return { B: B / poids, accumulation: acc / poids, fonte: fonte / poids, Ts: Ts / poids, z: z / poids, lat: lat / poids,
            H: H / poids, marge: g.R / 1000, pdd: pdd / poids, ddf_neige: mN / pdd, ddf_glace: mG / pdd, albedo: sA / sS };
    }

    /** Cellules de la bande rangées par la ROBUSTESSE du bilan de leur SOL NU : ΔT*, le réchauffement que ce bilan supporte avant
     *  de s'annuler (colonne libre au socle de la table, le plateau au niveau de la mer, sous l'orbite o ; B₀(T_s + ΔT) décroît
     *  avec ΔT : bissection sur ±PLAGE_RANG_K). C'est l'ordre dans lequel un refroidissement uniforme englacerait les cellules —
     *  froides et enneigées d'abord ; hors de la plage, la plus froide d'abord. */
    function robustesse(bande, geo, c, o) {
        const cols = c.colonnes(bande, geo), cyc = c.cycle(bande, o, 'terre'), ab = c.absorbe[bande.zone];
        const dT = new Float64Array(geo.N), Ts = new Float64Array(geo.N);
        for (const k of geo.cellules) {
            const col = cols[k].libre(geo.socle[k]), Sn = c.insolation(o, bande.h * geo.lat[k]), seb = c.seb(col.p);
            let lo = -K.PLAGE_RANG_K, hi = K.PLAGE_RANG_K;
            for (let j = 0; j < 10; j++) {
                const m = (lo + hi) / 2;
                if (bilanPoint(col.Ts + m, 0, cyc, Sn, ab, seb, cols[k].PmE, col.rapport).B > 0) lo = m; else hi = m;
            }
            dT[k] = lo; Ts[k] = col.Ts;
        }
        return geo.cellules.slice().sort((p, q) => (dT[q] - dT[p]) || (Ts[p] - Ts[q]));
    }

    /** Anneaux d'un dôme né sur la cellule s : la marge gagne les cellules dans l'ordre de robustesse r, mais seulement celles
     *  qu'elle ATTEINT — un dôme de rayon R ne couvre que des terres à moins de R de son sommet. La table ne donne des cellules
     *  que la latitude : distance de s à la tranche de la cellule k, d_k = max(0, |φ_k − φ_s| − Δφ/2) R_p (Δφ : largeur d'une
     *  tranche, R_p : rayon de la planète) ; k est atteinte quand le dôme qui la couvre a le rayon √((S + aire_k)/π) ≥ d_k (S :
     *  aire déjà couverte). Si aucune ne l'est, la plus proche (la calotte franchit la mer qui l'en sépare). */
    function dome(geo, s, r, bande) {
        const Ab = aireBande(bande), D2R = Math.PI / 180, demi = (Math.asin(bande.x1) - Math.asin(bande.x0)) / D2R / window.PALEOGEO.tranches / 2;
        const rayon = window.DATA['📜']['📐'] * 1000;   // [m] rayon de la planète
        const dist = (k) => Math.max(0, Math.abs(geo.lat[k] - geo.lat[s]) - demi) * D2R * rayon;
        const reste = r.filter((k) => k !== s), out = [s];
        let S = geo.aire[s] * Ab;
        while (reste.length > 0) {
            let j = reste.findIndex((k) => dist(k) <= Math.sqrt((S + geo.aire[k] * Ab) / Math.PI));
            if (j < 0) j = reste.reduce((m, k, i) => (dist(k) < dist(reste[m]) ? i : m), 0);
            const k = reste.splice(j, 1)[0];
            out.push(k); S += geo.aire[k] * Ab;
        }
        return out;
    }

    /** Sommets candidats de la bande, dans l'ordre de robustesse r : la cellule de terre émergée la plus robuste de chaque tranche
     *  (la neige ne s'accumule pas sur la mer : la calotte gagne le plateau depuis la terre ; une bande dont le continent n'émerge
     *  nulle part : ses cellules). La portée ne voit que la latitude : deux sommets d'une même tranche ne diffèrent que par la
     *  première cellule du dôme, et la plus robuste est le haut de la tranche. */
    function sommets(r) {
        const e = r.filter(emergee), vus = new Set(), out = [];
        for (const k of (e.length > 0 ? e : r)) {
            const t = Math.floor(k / nClasses());
            if (!vus.has(t)) { vus.add(t); out.push(k); }
        }
        return out;
    }

    /**
     * Sommet et rang de la calotte de la bande (en-tête, PLACE) : pose geo.rang, le dôme du sommet (dome) sur l'ordre de robustesse
     * r, et renvoie { s, aEq }, aEq l'équilibre de ce dôme depuis a0 (socle d'Airy, orbite oFin). Trois cas :
     *   · a0 = 0, NAISSANCE : le premier candidat (sommets, ordre de robustesse) dont le dôme GRANDIT — son équilibre depuis l'aire
     *     nulle couvre les min(2, longueur du rang) premières cellules de son dôme, sa cellule et la suivante : le bilan intégré
     *     reste positif sur le chemin quand il gagne une autre cellule ; un continent d'une seule cellule, s'il la couvre toute ;
     *     si aucun, le plus robuste (sa neige, s'il y en a) ;
     *   · a0 > 0 et sommet porté dont la cellule existe à la date (aire > 0) : la calotte garde son sommet ;
     *   · a0 > 0 sans sommet (posée par la config) ou dont la cellule n'existe plus à la date (la carte a changé) : la calotte, d'aire
     *     connue, a le sommet du meilleur bilan intégré B̄(a0), sur son socle porté e, à l'orbite oDepart du départ du clic.
     */
    function rangBilan(bande, geo, c, r, a0, porte, e, oDepart, oFin) {
        const zero = new Float64Array(geo.N), cand = sommets(r);
        const poser = (s) => { geo.rang = dome(geo, s, r, bande); };
        if (a0 === 0) {
            for (const k of cand) {
                poser(k);
                const q = equilibre(0, bande, geo, c, zero, oFin);
                if (q >= geo.rang.slice(0, 2).reduce((S, i) => S + geo.aire[i], 0)) return { s: k, aEq: q };
            }
            poser(cand[0]);                                  // aucun dôme ne grandit : le plus robuste, sa neige s'il y en a
            return { s: cand[0], aEq: equilibre(0, bande, geo, c, zero, oFin) };
        }
        let s = porte;
        if (porte === null || !(geo.aire[porte] > 0)) {
            let B = -Infinity;
            for (const k of cand) {
                poser(k);
                const b = bilanCalotte(a0, bande, geo, c, e, oDepart).B;
                if (b > B) { B = b; s = k; }
            }
        }
        poser(s);
        return { s: s, aEq: equilibre(a0, bande, geo, c, zero, oFin) };
    }

    /** Aire d'équilibre (fraction de la bande) depuis a0, socle e, sous l'orbite o : on suit le signe du bilan intégré jusqu'à son
     *  annulation, plafond = continent. Le chemin est lu aux N pas de la grille ET aux bords des cellules du dôme (aires cumulées
     *  du rang geo.rang) : un creux du bilan plus étroit qu'un pas — la marge mince d'une cellule nouvellement gagnée — arrête la
     *  calotte, qui ne le franchit pas. */
    function equilibre(a0, bande, geo, c, e, o) {
        const cap = geo.continent;
        const B = (a) => bilanCalotte(a, bande, geo, c, e, o).B;
        const a1 = Math.min(Math.max(a0, 0), cap);
        const N = 40, bords = [];
        let S = 0;
        for (const k of geo.rang) { S += geo.aire[k]; bords.push(Math.min(S, cap)); }
        if (B(a1) > 0) {                                    // croissance : premier zéro au-dessus, sinon tout le continent
            const pts = bords.filter((a) => a > a1);
            for (let k = 1; k <= N; k++) pts.push(a1 + (cap - a1) * k / N);
            pts.sort((p, q) => p - q);
            let lo = a1;
            for (const a of pts) {
                if (!(B(a) > 0)) { let hi = a; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
                lo = a;
            }
            return cap;
        }
        if (a1 === 0) return 0;                             // ni glace ni bilan positif au sommet : pas de calotte
        const pts = bords.filter((a) => a < a1);            // décroissance : premier zéro en dessous, sinon plus de calotte
        for (let k = 1; k <= N; k++) pts.push(a1 * (1 - k / N));
        pts.sort((p, q) => q - p);
        let hi = a1;
        for (const a of pts) {
            if (B(a) > 0) { let lo = a; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (B(m) > 0) lo = m; else hi = m; } return lo; }
            hi = a;
        }
        return 0;
    }

    /**
     * Contexte d'un calcul des calottes : ce qui ne dépend ni de l'aire, ni du socle, ni de la date, et ses caches. saisons : boîtes
     * calotte, terre libre et mer de chaque bande (SAISONS.cycles) ; absorbe = { pol, mid, trop } → { neige, glace } part de l'insolation absorbée au
     * sol par une surface qui fond, et couverture : nuages bas et moyens du modèle (physics/meridien.js) — les deux, grandeurs de
     * travail de l'itération du bilan méridien. Le profil méridien (T̄ = 🧮🌡️, T₂ = 🌡️🎱), la pression, la masse molaire de l'air,
     * la gravité, le rayon et l'humidité de surface se lisent dans DATA. Renvoie les fonctions lues par bilanCalotte : P − E
     * (Siler), bilan d'énergie de surface seb(p), colonnes des cellules d'une bande, cycle de la boîte du point (calotte, ou terre libre) et insolation des nœuds à
     * une date.
     */
    function contexte(saisons, absorbe) {
        const D = window.DATA, CONST = window.CONST, PHYS = window.PHYS, S = window.SAISONS, CONV = window.CONV, dx = 1e-4;
        // P − E [kg m⁻² an⁻¹] à x = sin |φ| (en-tête) : humidité de surface du modèle (jauge SUBTIL H2O_SURFACE_RH_01), q* sur l'eau
        // liquide de l'air de l'époque (ε = M_H₂O / M_air), pression et gravité de l'époque ; dq/dx = (dq*/dT) 3 T₂ x analytique, dF_q/dx
        // en différence centrée (F_q est lisse : une seule phase).
        const dqdx = (x) => {
            const T2 = D['🧮']['🌡️🎱'], T = D['🧮']['🧮🌡️'] + T2 * window.MERIDIEN.P2(x), e = PHYS.pSatLiquide(T);
            const ps = D['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA, eps = CONST.M_H2O / D['🫧']['🧪'], den = ps - (1 - eps) * e;
            return D['🎚️'].H2O.H2O_SURFACE_RH_01 * eps * ps * e * PHYS.dLnPSatLiquide(T) / (den * den) * 3 * T2 * x;
        };
        const Fq = (x) => -2 * Math.PI * D['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA / D['📅']['🍎'] * K.D_HUMIDE * (1 - x * x)
            * (1 - Math.exp(-x * x / (K.SIGMA_HADLEY * K.SIGMA_HADLEY))) * dqdx(x);   // [kg/s] vers le pôle
        // Bilan d'énergie d'une surface qui fond, T₀ = 0 °C, linéarisé en T_a autour de T₀ : Q = absorbé + c0 + c1 (T_a − T₀),
        //   LW : d[ε(T) σ T⁴] avec ε = ε_clair (1 − n) + n, ε_clair = 1,24 (HR e*(T)/T)^(1/7) (Brutsaert 1975), nuages n noirs à T_a ;
        //   H + LE : ρ C U [c_p (T_a − T₀) + L_v (HR q*(T_a) − q*(T₀))], C de Monin–Obukhov neutre, ρ = p M_air/(R T₀) au point ;
        //   c_p de l'air (JANAF, loi adiabatique du profil), L_v = R_v T₀² d ln e*/dT (même courbe que le profil).
        const LOI = window.RADIATIVE.loiAdiabatique();
        const T0 = CONST.T0_WATER, sig = CONST.STEFAN_BOLTZMANN, HR = () => D['🎚️'].H2O.H2O_SURFACE_RH_01;
        const e0 = PHYS.pSatLiquide(T0), dl0 = PHYS.dLnPSatLiquide(T0);
        const Lv = CONST.R_GAS / CONST.M_H2O * T0 * T0 * dl0;                       // [J/kg]
        const n = absorbe.couverture;
        const eClair = K.BRUTSAERT_A * Math.pow(HR() * e0 / 100 / T0, 1 / K.BRUTSAERT_N);   // e_a en hPa
        const epsA = eClair * (1 - n) + n, dEps = (1 - n) * eClair / K.BRUTSAERT_N * (dl0 - 1 / T0);   // [-], [1/K]
        const C = K.KARMAN * K.KARMAN / (Math.log(K.Z_VENT / K.Z0_M) * Math.log(K.Z_TEMPERATURE / K.Z0_M));
        const cp = LOI.cpa(T0);
        const sol = S.soleil();
        const refs = new Map(), lignes = new Map(), dates = new Map(), cycles = new Map(), colonnes = new Map();
        const parNoeud = (cache, cle, P, l) => {
            if (!cache.has(cle)) cache.set(cle, S.sommesNoeuds(P, l, K.NOEUDS));
            return cache.get(cle);
        };
        const cleDate = (o) => o.k + ':' + o.w + (o.hors ? 'h' : '');
        const c = {
            saisons: saisons, absorbe: absorbe, LOI: LOI,
            // ∂F_q/∂x / (2π a²), a = rayon 📐 ; par an (année tropique)
            PmoinsE: (x) => -(Fq(x + dx) - Fq(x - dx)) / (2 * dx) / (2 * Math.PI * Math.pow(D['📜']['📐'] * 1000, 2)) * CONST.AN_TROPIQUE_JOURS * CONV.SECONDS_PER_DAY,
            /** { c0 [W/m²], c1 [W m⁻² K⁻¹] } à la pression p [Pa] du point. */
            seb: (p) => {
                const ech = p * D['🫧']['🧪'] / (CONST.R_GAS * T0) * C * K.VENT_SURFACE_M_S;    // [kg m⁻² s⁻¹] ρ C U
                const eps = CONST.M_H2O / D['🫧']['🧪'], den = p - (1 - eps) * e0, qs = eps * e0 / den;
                return {
                    c0: -(1 - epsA) * sig * Math.pow(T0, 4) - ech * Lv * (1 - HR()) * qs,
                    c1: 4 * epsA * sig * Math.pow(T0, 3) + sig * Math.pow(T0, 4) * dEps + ech * cp + ech * Lv * HR() * qs * dl0 * p / den
                };
            },
            /** Colonnes des cellules de la bande (geo : cellules de la date du calcul), une par cellule non vide. */
            colonnes: (bande, geo) => {
                if (!colonnes.has(bande.cle)) {
                    const t = new Array(geo.N);
                    for (const k of geo.cellules) t[k] = colonne(bande, geo.x[k], c);
                    colonnes.set(bande.cle, t);
                }
                return colonnes.get(bande.cle);
            },
            /** Cycle annuel de la boîte de la bande ('calotte' ou 'terre' libre) à la date o (forçage solaire de la date). */
            cycle: (bande, o, boite) => {
                const cle = bande.cle + cleDate(o) + boite;
                if (!cycles.has(cle)) cycles.set(cle, S.cycleDe(saisons[bande.cle][boite], S.forcage(o)[bande.cle]));
                return cycles.get(cle);
            },
            /** [W/m²] Insolation moyenne de chaque nœud de l'année à la latitude latDeg (arrondie au degré, la résolution
             *  d'ORBITE), à la date o, Soleil de l'époque : référence + écarts des deux lignes de la table qui l'encadrent. */
            insolation: (o, latDeg) => {
                const l = Math.round(latDeg), cle = cleDate(o) + ':' + l;
                if (!dates.has(cle)) {
                    const R = parNoeud(refs, (o.hors ? 'h' : 'r') + l, S.reference(o), l);
                    const A0 = parNoeud(lignes, o.k * 181 + l + 90, window.ORBITE.anomalieLigne(o.k), l);
                    const A1 = parNoeud(lignes, (o.k + 1) * 181 + l + 90, window.ORBITE.anomalieLigne(o.k + 1), l);
                    dates.set(cle, R.map((v, j) => sol * (v + (1 - o.w) * A0[j] + o.w * A1[j])));
                }
                return dates.get(cle);
            }
        };
        return c;
    }

    /** Temps de rebond du demi-espace visqueux de la bande [an], τ_b = 4π η / (ρ_m g λ), λ = (3 000/1 350) × largeur de la calotte
     *  qui couvre son continent, deux fois le rayon du dôme unique qui le couvrirait (en-tête). */
    const tempsRebond = (bande, gb) => 4 * Math.PI * K.VISCOSITE_MANTEAU
        / (K.RHO_MANTEAU * window.DATA['📅']['🍎'] * K.LAMBDA_SUR_LARGEUR * 2 * Math.sqrt(gb.continent * aireBande(bande) / Math.PI))
        / (window.CONST.AN_TROPIQUE_JOURS * window.CONV.SECONDS_PER_DAY);

    /**
     * Calottes hors d'un monde à océan (H2O.mondeOcean faux) : l'eau n'a pas de phase condensée à la surface (au-dessus de son point
     * critique, ou toute en vapeur : PHYS.eauSansLiquide), ou aucune atmosphère ne porte de neige (P − E de Siler nul sans pression).
     * Il n'y a ni neige ni glace : pas de calotte. Aire, équilibre, masse, accumulation et fonte nuls ; albédo nul (aucune lumière
     * réfléchie : c'est la contribution des calottes au co-albédo de zone et à l'albédo planétaire) ; température, degrés-jours,
     * gradient de surface et sommet d'une calotte sans objet (null). La glace portée, s'il y en avait, n'est plus : le socle relaxe sans charge
     * depuis son enfoncement porté, d(t) = (L₀ + e₀) e^(−t/τ_b) (L₀ : charge d'Airy de la calotte portée, e₀ : écart porté) ; sans
     * neige ni bilan, la charge portée est rangée par le socle (rangSocle).
     */
    function sansCalotte(geo, dureeAns) {
        const D = window.DATA, depart = D['🗻']['🍰🗻🧊'], socle = D['🗻']['🔺📏🗻🧊'], res = {};
        for (const b of BANDES) {
            const gb = geo[b.cle], N = gb.N;
            if (socle[b.cle].length !== N) throw new Error('[CALOTTES] socle porté de ' + b.cle + ' : ' + socle[b.cle].length + ' valeurs pour ' + N + ' cellules de la table');
            gb.rang = rangSocle(gb);
            const tauB = tempsRebond(b, gb), L0 = charge(geometrie(Math.min(depart[b.cle], gb.continent), b, gb), N);
            const ex = Math.exp(-dureeAns / tauB);
            const e = Float64Array.from(socle[b.cle], (v, i) => (L0[i] - 1000 * v) * ex);   // [m] écart à l'équilibre sans charge (+ : plus bas)
            res[b.cle] = { a: 0, aEq: 0, terre: 0, H: 0, z: null, accumulation: 0, fonte: 0, Ts: null, lat: null, tau: Infinity, marge: 0,
                socle: Array.from(e, (v) => -v / 1000), tauSocle: tauB, sousPas: 0, ecart_m: Math.max(...e.map(Math.abs)),
                pdd: null, ddf_neige: null, ddf_glace: null, albedo: 0, Gamma_s: null, sommet: null };
        }
        res.masse = 0;
        return res;
    }

    /**
     * Calottes de l'état courant. saisons : boîtes calotte, terre libre et mer de chaque bande (SAISONS.cycles : moyenne annuelle,
     * réponse au forçage solaire), d'où vient la température des points de calotte, de leur marge et d'un sol nu (colonne) ; absorbe = { pol, mid, trop } →
     * { neige, glace } part de l'insolation absorbée au sol par une surface qui fond, et couverture (nuages bas et moyens) — les deux
     * de physics/meridien.js, à l'itération courante de son point fixe. Le reste se lit dans DATA : profil méridien du bilan de North
     * (T(x) = T̄ + T₂ P₂(x), 🧮🌡️ et 🌡️🎱), lu par le transport d'humidité de Siler (zonal) ; état d'où l'on part, porté d'un clic à
     * l'autre — calottes { cle: a } (🗻.🍰🗻🧊), socle { cle: [Δz par cellule, km] } (🗻.🔺📏🗻🧊), altitude du socle moins celle de
     * son équilibre d'Airy sous la calotte a (négatif : resté plus bas, la calotte ayant pesé plus), et sommets { cle: cellule ou
     * null } (🗻.📿🗻🧊), datés de 📅🗻🧊 ; le temps écoulé
     * depuis cet état jusqu'à l'âge courant (INTERIEUR.ageCourant ; 0 : l'état lui-même).
     * Calotte et socle avancent ENSEMBLE par la conservation de la masse, dV/dt = a A_bande B̄(a, socle, orbite de la date) / ρ_i,
     * intégrée en q = V^(1/5) (dôme) : Heun (taux au départ du sous-pas, puis à l'état prédit et à la date d'arrivée, calotte ET
     * socle) sur les MEMOIRE_ANS derniers ans du clic, jusqu'à sa fin, en sous-pas bornés par τ_b et par le temps propre
     * ρ_i max(H̄, tolérance) / max(accumulation, fonte) — la tolérance du point fixe méridien ramenée en altitude,
     * MERIDIEN.TOLERANCE_K / Γ_s (gradient de surface de la colonne du sommet) : une calotte plus mince ne se voit pas, et le pas
     * ne se réduit pas sans fin quand elle fond ;
     * avant, Euler implicite (même taux, à l'état d'arrivée, à son socle et à sa date) en pas qui doublent depuis ce sous-pas,
     * cherché entre l'état courant et l'équilibre sous l'orbite de la date d'arrivée ; socle relaxé vers l'équilibre d'Airy
     * d'une charge qui varie linéairement sur le pas (solution exacte de dd/dt = (L − d)/τ_b).
     * aEq : équilibre à socle d'Airy sous l'orbite de la fin du clic ; tau : temps de renouvellement au départ.
     * Hors d'un monde à océan (H2O.mondeOcean), pas de calotte : sansCalotte.
     * Le sommet et le rang des cellules (rangBilan) sont ceux du climat du calcul, sous l'orbite de la fin du clic.
     * Renvoie { cle: { a, aEq, terre, H, z, accumulation, fonte, Ts, lat, tau, marge, socle, tauSocle, sousPas, ecart_m, pdd,
     * ddf_neige, ddf_glace, albedo, Gamma_s, sommet } } et masse [kg] (ρ_i Σ V) ; sommet : cellule du sommet de la calotte du
     * pas (null si son aire est nulle) ; terre : part de la bande que la calotte couvre sur la terre
     * émergée ; H, z, accumulation, fonte, Ts, lat (latitude moyenne, °), marge
     * (distance du sommet à la marge, rayon du dôme, km), degrés-jours, fonte / degrés-jours d'une neige et d'une glace (contrôle
     * 🎯) et albédo annuel sont ceux de la calotte portée a, sur son socle porté, à la fin du clic (aire nulle : ceux du sommet nu) ;
     * Gamma_s [K/km] : gradient de surface au sommet.
     */
    function calculer(saisons, absorbe) {
        const D = window.DATA, CONST = window.CONST, depart = D['🗻']['🍰🗻🧊'], socle = D['🗻']['🔺📏🗻🧊'], portes = D['🗻']['📿🗻🧊'];
        const ageFin = window.INTERIEUR.ageCourant(), dureeAns = D['🗻']['📅🗻🧊'] - ageFin;   // [an] âge courant, temps écoulé
        if (!(dureeAns >= 0)) throw new Error('[CALOTTES] durée ' + dureeAns + ' an : l\'état des calottes est daté APRÈS la date courante (clic frise oublié ?)');
        const geo = geographie();
        if (!window.H2O.mondeOcean()) return sansCalotte(geo, dureeAns);
        const c = contexte(saisons, absorbe);
        // Orbite au temps t du clic (années depuis son départ) : celle de sa date, âge de fin + temps restant ; hors de la solution
        // La2004, l'orbite de référence à l'obliquité de l'époque (physics/saisons.js).
        const orbite = (t) => window.SAISONS.date(ageFin + dureeAns - t);
        const oDepart = orbite(0), oFin = orbite(dureeAns);
        const res = {};
        let masseTotale = 0;
        for (const b of BANDES) {
            const gb = geo[b.cle], N = gb.N;
            if (socle[b.cle].length !== N) throw new Error('[CALOTTES] socle porté de ' + b.cle + ' : ' + socle[b.cle].length + ' valeurs pour ' + N + ' cellules de la table');
            if (gb.continent === 0) {
                // Bande sans terre : ni calotte ni sommet ; le socle porté, sans objet, est gardé tel quel.
                res[b.cle] = { a: 0, aEq: 0, terre: 0, H: 0, z: null, accumulation: 0, fonte: 0, Ts: null, lat: null, tau: Infinity, marge: 0,
                    socle: socle[b.cle], tauSocle: Infinity, sousPas: 0, ecart_m: Math.max(...socle[b.cle].map((v) => 1000 * Math.abs(v))),
                    pdd: null, ddf_neige: null, ddf_glace: null, albedo: 0, Gamma_s: null, sommet: null };
                continue;
            }
            const zero = new Float64Array(N);                                   // socle à l'équilibre d'Airy
            const a0 = Math.min(depart[b.cle], gb.continent);
            let e = Float64Array.from(socle[b.cle], (v) => -1000 * v);          // [m] écart à l'équilibre d'Airy (+ : plus bas)
            // Sommet (naissance, porté ou placé) et rang de la calotte, équilibre de son dôme.
            const place = rangBilan(b, gb, c, robustesse(b, gb, c, oFin), a0, portes[b.cle], e, oDepart, oFin), aEq = place.aEq;
            // Tolérance du point fixe méridien ramenée en altitude : gradient de surface Γ_s de la colonne du sommet, sur son socle.
            const sommet = c.colonnes(b, gb)[gb.rang[0]], zs = gb.socle[gb.rang[0]];
            const gs = (sommet.lire(zs).Ts - sommet.lire(zs + K.PAS_COLONNE_M).Ts) / K.PAS_COLONNE_M;   // [K/m]
            const tolZ = window.MERIDIEN.TOLERANCE_K / gs;                                            // [m]
            let tau;
            if (a0 > 0) {
                const mb0 = bilanCalotte(a0, b, gb, c, zero, oDepart);
                tau = CONST.RHO_GLACE * mb0.H / Math.max(mb0.accumulation, mb0.fonte);
            } else if (aEq > 0) {
                const mbEq = bilanCalotte(aEq, b, gb, c, zero, oFin);
                tau = CONST.RHO_GLACE * mbEq.H / mbEq.accumulation;
            } else {
                tau = Infinity;                                  // pas de glace, pas d'équilibre englacé à la fin du clic
            }
            const tauB = tempsRebond(b, gb);
            // Intégration en q = V^(1/5) : le dôme V = (8π/15) C (S/π)^(5/4) donne dq/dt = (π/5) ((8π/15) C)^(−4/5) B̄ / ρ_i — fini à
            // la naissance, constant à bilan constant ; aire du dôme de volume V, πR² avec R = (15 V / (8π C))^(2/5), plafonnée par le
            // continent (au plafond, le surplus part à la mer : la calotte garde le volume du dôme du continent).
            const eq = 1 / 5, Kq = Math.PI / 5 * Math.pow(8 * Math.PI / 15 * plastique(), -0.8) / CONST.RHO_GLACE;
            // N dômes égaux : V = N^(−1/4) (8π/15) C (S/π)^(5/4) ⇒ dq/dt = Kq N^(1/5) B̄ et S = N^(1/5) × celle d'un dôme de volume V,
            // N pris à l'aire (point fixe, N^(1/5) varie peu).
            const versA = (qq) => {
                if (!(qq > 0)) return 0;
                const un = Math.PI * Math.pow(15 * Math.pow(qq, 5) / (8 * Math.PI * plastique()), 0.8) / aireBande(b);
                let x = Math.min(gb.continent, un);
                for (let it = 0; it < 4; it++) x = Math.min(gb.continent, un * Math.pow(nDomes(gb, x), 0.2));
                return x;
            };
            const taux = (ak, gk, Bk) => Kq * Math.pow(gk.N, 0.2) * Bk;
            let a = a0, g = geometrie(a, b, gb), L = charge(g, N);
            let d = L.map((v, i) => v + e[i]);                                   // [m] enfoncement moyen de chaque cellule, + vers le bas
            // Socle au bout de h années sous une charge qui passe linéairement de L (calotte courante) à celle de aN :
            // solution exacte de dd/dt = (L(t) − d)/τ_b, d(h) = L_N + (d − L) e^(−x) − (L_N − L)(1 − e^(−x))/x, x = h/τ_b.
            const socleApres = (aN, h) => {
                const gN = geometrie(aN, b, gb), LN = charge(gN, N);
                const x = h / tauB, ex = Math.exp(-x), ph = x === 0 ? 1 : -Math.expm1(-x) / x;   // (1 − e^(−x))/x, limite 1 en 0
                const dN = d.map((v, i) => LN[i] + (v - L[i]) * ex - (LN[i] - L[i]) * ph);
                return { a: aN, g: gN, L: LN, d: dN, e: dN.map((v, i) => v - LN[i]) };
            };
            const prendre = (s) => { a = s.a; g = s.g; L = s.L; d = s.d; e = s.e; };
            // Sous-pas : τ_b et le temps propre de la calotte, épaisseur comptée au moins à la tolérance ; sans calotte, τ_b.
            const pasPropre = (mb) => Math.min(tauB, a === 0 ? Infinity : CONST.RHO_GLACE * Math.max(mb.H, tolZ) / Math.max(mb.accumulation, mb.fonte));
            // Équilibre à socle d'Airy sous l'orbite d'une date, cherché depuis l'état courant (cible d'un pas implicite) ; une date
            // par position dans la table (k + w), celle de la fin du clic déjà connue.
            const equilibres = new Map([[oFin.k + oFin.w, aEq]]);
            const equilibreA = (o) => {
                if (!equilibres.has(o.k + o.w)) equilibres.set(o.k + o.w, equilibre(a, b, gb, c, zero, o));
                return equilibres.get(o.k + o.w);
            };
            const ancien = Math.max(0, dureeAns - K.MEMOIRE_ANS);
            let t = 0, n = 0;
            // Part ancienne du clic : Euler implicite en q, q(a') = q + h dq/dt(a', socle et orbite d'arrivée), a' entre a et
            // l'équilibre de la date d'arrivée ; pas doublés.
            let hAncien = pasPropre(bilanCalotte(a, b, gb, c, e, oDepart));
            while (t < ancien) {
                const h = Math.min(hAncien, ancien - t), q0 = Math.pow(g.V, eq), o = orbite(t + h);
                const G = (x) => {
                    const s = socleApres(x, h);
                    return Math.pow(s.g.V, eq) - q0 - h * taux(x, s.g, bilanCalotte(x, b, gb, c, s.e, o).B);
                };
                const s0 = Math.sign(G(a));
                let lo = a, hi = equilibreA(o);
                for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (Math.sign(G(m)) === s0) lo = m; else hi = m; }
                prendre(socleApres((lo + hi) / 2, h));
                t += h; hAncien *= 2; n++;
            }
            // Fin du clic : Heun en q, calotte et socle, l'orbite à la date de départ puis d'arrivée de chaque sous-pas, jusqu'au bout
            // (le forçage change d'un sous-pas à l'autre : rien ne se prolonge au rythme d'un seul).
            while (t < dureeAns) {
                const mb = bilanCalotte(a, b, gb, c, e, orbite(t));
                const h = Math.min(pasPropre(mb), dureeAns - t), q0 = Math.pow(g.V, eq), r1 = taux(a, g, mb.B), o = orbite(t + h);
                const p = socleApres(versA(q0 + h * r1), h);
                prendre(socleApres(versA(q0 + h * (r1 + taux(p.a, p.g, bilanCalotte(p.a, b, gb, c, p.e, o).B)) / 2), h));
                t += h; n++;
            }
            const mb = bilanCalotte(a, b, gb, c, e, oFin);      // l'état porté, sur son socle porté
            let terre = 0;                                     // part de la bande couverte sur la terre émergée
            for (const k of g.couvertes) if (emergee(k)) terre += g.f[k] * gb.aire[k];
            res[b.cle] = { a: a, aEq: aEq, terre: terre, H: mb.H, z: mb.z, accumulation: mb.accumulation, fonte: mb.fonte, Ts: mb.Ts, lat: mb.lat, tau: tau,
                marge: mb.marge, socle: Array.from(e, (v) => -v / 1000), tauSocle: tauB, sousPas: n, ecart_m: Math.max(...e.map(Math.abs)),
                pdd: mb.pdd, ddf_neige: mb.ddf_neige, ddf_glace: mb.ddf_glace, albedo: mb.albedo, Gamma_s: 1000 * gs,
                sommet: a > 0 ? place.s : null };   // une calotte d'aire nulle n'a pas de sommet : la prochaine naît
            masseTotale += CONST.RHO_GLACE * g.V;
        }
        res.masse = masseTotale;
        return res;
    }

    /** Socle à l'équilibre d'Airy sous les calottes portées : écart nul dans chaque cellule de chaque bande. */
    function socleEquilibre() {
        const out = {};
        for (const b of BANDES) out[b.cle] = Array.from({ length: nCellules() }, () => 0);
        return out;
    }

    /** Clic sur la frise : l'état des calottes est celui de la CONFIG de l'époque (part de chaque bande sous calotte à ▶),
     *  daté de ▶, socle à l'équilibre sous elles, sommets à placer (null : la config donne l'aire, pas la place ; le calcul
     *  les pose, rangBilan). Une part de 1 = toute la bande : le continent de la bande la plafonne. */
    function depuisConfig() {
        const DATA = window.DATA, EPOCH = DATA['📅'];
        const C = EPOCH['🗻']['🍰🗻🧊'], etat = {}, places = {};
        for (const b of BANDES) {
            if (!(C[b.cle] >= 0 && C[b.cle] <= 1)) throw new Error('[CALOTTES] ' + EPOCH['📅'] + " : 🗻.🍰🗻🧊." + b.cle + ' = ' + C[b.cle] + ' (part de bande attendue dans [0, 1])');
            etat[b.cle] = C[b.cle];
            places[b.cle] = null;
        }
        DATA['🗻']['🍰🗻🧊'] = etat;
        DATA['🗻']['📿🗻🧊'] = places;
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageDe(EPOCH, EPOCH['▶']);
        DATA['🗻']['🔺📏🗻🧊'] = socleEquilibre();
        // Masse de ces calottes : elle dépend du rayon de la planète à ▶ (aire des bandes), que l'intérieur ne pose qu'au calcul
        // (INTERIEUR.avancer) ; le premier calcul la donne (🧮⚖️🗻🧊) et engager la porte. D'ici là, elle n'est pas connue.
        DATA['🗻']['⚖️🗻🧊'] = null;
    }

    /** Fin de convergence : le résultat du dernier pas (🧮🍰🗻🧊, 🧮🔺📏🗻🧊, 🧮📿🗻🧊, 🧮⚖️🗻🧊) devient l'état porté, daté de maintenant. */
    function engager() {
        const DATA = window.DATA;
        for (const b of BANDES) {
            DATA['🗻']['🍰🗻🧊'][b.cle] = DATA['🗻']['🧮🍰🗻🧊'][b.cle];
            DATA['🗻']['🔺📏🗻🧊'][b.cle] = DATA['🗻']['🧮🔺📏🗻🧊'][b.cle];
            DATA['🗻']['📿🗻🧊'][b.cle] = DATA['🗻']['🧮📿🗻🧊'][b.cle];
        }
        DATA['🗻']['⚖️🗻🧊'] = DATA['🗻']['🧮⚖️🗻🧊'];
        DATA['🗻']['📅🗻🧊'] = window.INTERIEUR.ageCourant();
    }

    window.CALOTTES = { K: K, BANDES: BANDES, aireBande: aireBande, parts: parts, geographie: geographie, geometrie: geometrie, normale: normale, fonteJour: fonteJour, bilanPoint: bilanPoint,
        colonne: colonne, contexte: contexte, bilanCalotte: bilanCalotte, calculer: calculer, depuisConfig: depuisConfig,
        engager: engager, socleEquilibre: socleEquilibre, rangBilan: rangBilan, nDomes: nDomes };
})();
