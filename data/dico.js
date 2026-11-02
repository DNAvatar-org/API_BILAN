// File: API_BILAN/data/dico.js - Dictionnaire des clés : structure, descriptions, formules
// Desc: En français, dans l'architecture, je suis la CARTE DES CLÉS de DATA : quelles catégories existent,
//       quelles clés dedans (KEYS, lu par initDATA.js pour construire DATA), ce que chacune veut dire (DESC)
//       et par quelle formule elle est obtenue (FORM). Que des définitions : je documente le calcul, donc je
//       pars avec lui — au même titre que la bibliographie. Le lexique HTML vit dans CO2/static/compute/dico_render.js.
// Version 2.8.6
// Date: [November 2, 2026]
// logs :
// - v2.8.6: formules : une calotte est N dômes égaux, N = nombre effectif des morceaux connexes de la carte (🍰🗻🧊, 🔺📏🗻🧊).
// - v2.8.5: formules : racine du point fixe encadrée → dichotomie, pas doublé quand la pente ĝ ≥ 1 (🌡️🎱) ; mer libre (🍰📅🧊).
// - v2.8.4: formules : naissance d’une calotte, bas du continent de la table, terre de chaque latitude au prorata de l’aire.
// - v2.8.3: 📜🧫, la biosphère marine du clic.
// - v2.8.2: formules : arrêt du point fixe par encadrement (🌡️🎱), marge d’une calotte par le haut de sa cellule (🍰🗻🧊).
// - v2.8.1: descriptions et formules : terre de chaque latitude, forêt de chaque bande et forêt sous la neige, sommet des calottes,
//   arrêt du point fixe sur T₂.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// ============================================================================
// OBJET KEYS (toutes les clés regroupées) - Utilise directement les emojis
// ============================================================================
const KEYS = {
    // Configuration de date / Événements
    '📜': ['⏳', '📿💫', '📿☄️', '📿🕰', '🔺⚖️💧', '🔺🌡️💫', '🔺🍰⚽', '🔺⚖️🏭', '🔺⚖️🌊🏭', '🔺⚖️🌳🏭', '⚾', '🔁⚖️', '🔁📝', '🖼', '🌙', '🔘🕰', '🔺⏳', '🧲🔬', '🌡️🧮', '🧫'],
    // '📅' : pas un groupe de clés — DATA['📅'] est l'époque courante, TIMELINE[📜👉] (accesseur, data/initDATA.js).
    // Masses
    '⚖️': ['⚖️💧', '⚖️🫧', '⚖️🏭', '⚖️🐄', '⚖️🫁', '⚖️✈', '⚖️💨'],
    // Composition atmosphérique
    '🫧': ['🎈', '🧪', '📏🫧🧿', '📏🫧🛩', '🍰🫧🏭', '🍰🫧🐄', '🍰🫧🫁', '🍰🫧✈', '🍰🫧💨', '🍰🫧📿🌈', '🍰🫧🏭🌈', '🍰🫧💧🌈', '🍰🫧🐄🌈'],   // 🍰💭 retirée le 2026-09-23 avec sa formule (pas de physique CCN dans la couverture nuageuse)
    // Cycle de l'eau
    '💧': ['🍰💧🧊', '🍰💧🌊', '🍰🧪🌧', '🍰🫧💧', '🍰🌧💧', '🧲⚖️💦', '💭☔', '🔺⏳💦'],
    // Albédo
    '🪩': ['🍰🪩📿', '🍰🪩🎾', '🍰🪩🏜️', '🍰🪩🌳', '🍰🪩🌊', '🍰🪩🧊', '🍰🪩⛅', '🍰🪩🌍', '🍰⚽', '🍰🪩⚽', '🍰🪩💧', '🪩🍰⛅', '☁️', '🪩👁', '🍰📅🧊', '🍰☀️🧊', '🍰☀️🪩🧊', '🧮🪩🍰🧊'],
    // Flux (W/m²) ; ΔF = convention affichage (climate.js), pas calcul T
    '🧲': ['🧲☀️🔽', '🧲🌕🔽', '🧲🌑🔼', '🧲🌈🔼', '🧲🪩🔼', '🔺🧲'],
    // Convergence
    '🧮': ['🧮🌡️', '🧮⚧', '🧮☯', '🧲🔬', '🔬🌈', '🔬🫧', '🧮🔄☀️', '🧮🔄🌊', '🌡️🎱'],
    // Soleil
    '☀️': ['🧲☀️', '🧲☀️🎱', '🔋☀️'],
    // Noyau
    '🌕': ['🧲🌕', '🔋🌕', '🌡️🌕', '📅🌕', '📅🧊🌕'],
    // EDS breakdown (🧲📛, 🍰📛❀, 🧲📛❀) ; 🔺📛❀ = diagnostic ΔF (convention affichage, pas calcul T)
    // 🔺📛🏭, 🔺📛🐄 et 🔺📿📛 retirées le 2026-09-23 : jamais écrites ni lues (page 🔎 Paramètres).
    '📛': ['🧲📛', '🧲📛🏭', '🧲📛💧', '🧲📛🐄', '🧲📛⛅', '🍰📛🏭', '🍰📛💧', '🍰📛🐄', '🍰📛⛅', '🔺📛💧'],
    // Géologie (Surfaces géologiques - Couche A)
    '🗻': ['🍰🗻🌊', '🍰🗻🏔', '🍰🗻🌍', '🍰🗻🧊', '📅🗻🧊', '🧮🍰🗻🧊', '🔺📏🗻🧊', '🧮🔺📏🗻🧊', '📿🗻🧊', '🧮📿🗻🧊', '⚖️🗻🧊', '🧮⚖️🗻🧊', '🧮🪩🗻🧊', '🍰🗻🌳'],
    // Constantes physiques
    // Albédo matériau (EARTH['🪩🍰'], override EPOCH['🪩🍰']), écrit une fois par calcul dans DATA['🪩🍰'] par calculateAlbedo
    '🪩🍰': ['🪩🍰❄️', '🪩🍰🧊', '🪩🍰🏊', '🪩🍰🌊', '🪩🍰🌍', '🪩🍰🏜️', '🪩🍰🌳', '🪩🍰🌳❄️', '🪩🍰🎾']
};

// ============================================================================
// OBJET DESC (toutes les descriptions) - Structure hiérarchique (2 niveaux)
// Utilise directement les emojis
// ============================================================================
const DESC = {
    '📜': {
        '🌡️🧮': 'Graine du clic (K) : la courbe cyan d’Histoire à ▶ (médiane), glissée vers ◀ le long de l’époque quand elle le déclare (🏔, 🦣 : 🕰.◀.📜) — lue par calculateT0 ; sur les états à deux branches, elle choisit la branche du solveur',
        '⏳': 'Temps écoulé dans l’époque courante (Ma) — somme des 🔺⏳ des clics joués (CLICS.jouer) ; la date en découle',
        '📿💫': 'Nombre de ticTime joués dans l’époque',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧': 'Eau apportée par les météores de l’époque, cumulée [kg] (chaque entrée ☄️ de 🕰.order porte sa masse 🔺⚖️💧☄️)',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '📿🕰': 'Clics joués dans l’époque courante (curseur de 🕰.order, dont chaque entrée porte sa durée 🔺⏳ ; compte aussi les clics de 📱)',
        '🔘🕰': 'Bouton cliqué (☄️ ou 💫)',
        '🔺⏳': 'Durée du dernier clic joué dans l’époque (Ma) — le 🔺⏳ de son entrée de 🕰.order, ou de l’action de la tranche sur 📱 ; 0 avant le premier',
        '🔺🍰⚽': 'Cumul voile SW stratosphérique (fraction, 🌋)',
        '🔺⚖️🏭': 'Cumul CO₂ injecté par événements 📱 ⛽/🛢 (kg)',
        '🔺⚖️🌊🏭': 'CO₂ injecté absorbé par l’océan (kg, Henry/Revelle)',
        '🔺⚖️🌳🏭': 'CO₂ injecté stocké par les forêts (kg, fertilisation)',
        '⚾': 'Obliquité ε que le calcul utilise (°) : celle de l’orbite à la date (La2004, de −51 Ma à aujourd’hui), sinon celle que l’époque déclare (EPOCH[⚾]) — lue par le bilan méridien, la glace saisonnière, les boîtes saisonnières et les calottes',
        '🔁⚖️': 'Masses imposées par l’état de cycle courant (🕰.🔁, ex. glaciaire/interglaciaire)',
        '🔁📝': 'Pourquoi de l’état de cycle courant (texte alt2sec de l’événement)',
        '🖼': 'Texture de la planète imposée (suite 🕰.🖼 parcourue par les tics ; sinon déduite de la date)',
        '🌙': 'Carte de nuit superposée (🕰.🌙) — lumières des villes côté ombre',
        '🧲🔬': 'Précision Flux',
        '🧫': 'Biosphère marine du clic (part de la boucle CLAW moderne, 1 = 📱) : celle de l’époque (EPOCH.🧫), ou de son état 🔁 daté quand il en porte une (🦕 à 151,9 Ma) — module la part DMS du sulfate efficace (ALBEDO.rapportCCN) ; posée par getEpochDateConfig',
    },
    '☀️': {
        '🧲☀️': 'Flux solaire moyen de l’année à 1 UA (W/m²) : Soleil de l’âge courant, orbite elliptique comprise',
        '🧲☀️🎱': 'Flux moyen sphérique',
        '🔋☀️': 'Luminosité du Soleil à l’âge courant (W), Gough 1981 ; L☉ actuelle = CONST.L_SOLEIL_W',
    },
    '🪩': {
        '🍰🪩📿': 'Albédo planétaire effectif : lumière réfléchie au sommet par les zones du bilan méridien (surface, nuages, vapeur, Rayleigh), pondérée par l’insolation que reçoit chacune, puis voile SW 🍰⚽',
        '🍰🪩🎾': 'Lave (surface magmatique)',
        '🍰🪩🏜️': 'Désert',
        '🍰🪩🌳': 'Forêt',
        '🍰🪩🌊': 'Océan',
        '🍰🪩🧊': 'Glace : calottes du pas + glace saisonnière pondérée par l’énergie solaire qu’elle reçoit',
        '🍰🪩⛅': 'Nuages : fraction GÉOMÉTRIQUE du ciel couvert (mesurée, King et al. 2013)',
        '🍰🪩🌍': 'Continents',
        '🍰⚽': 'Voile SW : fraction d’obstruction (0–1) du flux absorbé en surface après albédo (EPOCH+📜+CONFIG)',
        '🍰🪩⚽': 'Transmission du faisceau SW après A_geo seul = 1 − 🍰⚽ (le voile est déjà fusionné dans 🍰🪩📿)',
        '🍰🪩💧': 'Facteur corps-noir : couche d’eau globale / 10 m, plafonné à 1 — A_geo est multiplié par lui',
        '🪩🍰⛅': 'Albédo au sommet du ciel de nuages bas seuls (population de nuages, δ-Eddington selon l’angle solaire, moyenne sur la sphère)',
        '🍰📅🧊': 'Glace saisonnière : part de l’ANNÉE où les terres (neige, sous 0 °C) et la mer (glace de mer de physics/saisons.js) de chaque BANDE sont sous la glace, moyenne de ses latitudes (pondérée par leur part de terre sur les terres) — { N_pol, S_pol, N_mid, S_mid, N_trop, S_trop } × { terre, mer }',
        '🍰☀️🧊': 'Glace saisonnière : part de l’ÉNERGIE solaire annuelle des terres et de la mer de chaque bande qui tombe sur elle, moins la fin de la saison de fonte où la glace de mer a fondu (mer libre) — la pondération de son albédo ; { N_pol, S_pol, N_mid, S_mid, N_trop, S_trop } × { terre, mer }',
        '🍰☀️🪩🧊': 'Glace saisonnière : part de l’ÉNERGIE solaire annuelle des terres et de la mer de chaque bande que sa glace RÉFLÉCHIT (albédo qui suit la saison : neige sèche, puis neige mouillée et glace nue ou sol pendant la fonte ; forêt enneigée sur les terres) ; albédo moyen de la glace = 🍰☀️🪩🧊 / 🍰☀️🧊 ; { N_pol, S_pol, N_mid, S_mid, N_trop, S_trop } × { terre, mer }',
        '🧮🪩🍰🧊': 'Albédo EFFECTIF de la glace saisonnière : lumière qu’elle réfléchit / énergie qu’elle reçoit, sommées sur le globe (🍰☀️🪩🧊 et 🍰☀️🧊 des bandes, pondérées par leur mer et leur terre libres) — affiché ; null sans glace saisonnière',
    },
    '🫧': {
        '🎈': 'Pression atmosphérique',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'Ligne de Kármán',
        '📏🫧🛩': 'Tropopause',
        '🍰🫧❀': 'Prop.Rad.EDS<sub>❀∈{🏭, 🐄, 🫁, 💨}</sub>',
        '🍰🫧🏭': '!CO₂',
        '🍰🫧🐄': '!CH₄',
        '🍰🫧🫁': '!O₂ (🫁) [clé historique 🫁]',
        '🍰🫧✈': 'SO₄²⁻ (✈) - fraction massique de sulfate',
        '🍰🫧💨': '!N₂',
        '🍰🫧❀🌈': 'Cap.Rad.IR<sub>❀∈{🏭, 🐄, 💧}</sub>',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈)<sub>❀∈{🏭,🐄,💧}</sub>',
        '🍰🫧🏭🌈': '!Capacité radiative IR de CO₂',
        '🍰🫧💧🌈': 'Cap.Rad.IR H₂O atm.',
        '🍰🫧🐄🌈': '!Capacité radiative IR de CH₄',
    },
    '⚖️': {
        '⚖️❀': 'Masse<sub>❀∈{🏭, 🐄, 🫁, 💨}</sub> (+ ⚖️✈ sulfate)',
        '⚖️💧': 'Masse H₂O totale',
        '⚖️🫧': 'Masse atmosphère sec',
        '⚖️🏭': '!Masse CO₂',
        '⚖️🐄': '!Masse CH₄',
        '⚖️🫁': '!Masse O₂ (🫁) [clé historique 🫁]',
        '⚖️✈': 'Masse SO₄²⁻ (✈) — charge atmosphérique de sulfate, kg de SO₄',
        '⚖️💨': '!Masse N₂',
    },
    '💧': {
        '🍰💧🧊': 'Glace : part massique de l’eau totale ⚖️💧 (calottes et glace de mer)',
        '🍰💧🌊': 'Eau liquide : part massique de l’eau totale ⚖️💧 (le reste)',
        '🍰🧪🌧': 'Fraction MOLAIRE de vapeur à saturation (mol/mol) = 🎈🌧/🎈',
        '🍰🫧💧': 'Fraction MASSIQUE de vapeur, à la SURFACE (kg/kg) — ⚠️ pas une moyenne de colonne',
        '🍰🌧💧': 'Humidité relative de surface (sans dimension) = 🍰🫧💧 / q_sat',
        '☁️': 'Index de formation nuageuse [0,1]',
        '🪩👁': 'Nuages VUS D\'EN HAUT (simulateur ISCCP) : par niveau de sommet L / M / H et classe de τ, quantité et τ moyen radiatif de la colonne — à comparer à ISCCP-H (data/isccp_h_2010.js)',
        '💭☔': 'Seuil critique précipitations [0.7,0.9]',
        '🧲⚖️💦': 'Flux de masse d\'eau précipitée (kg/m²/s), P = W/τ',
        '🔺⏳💦': 'Pas de temps de la pluie dans le cycle de l\'eau (s) : la masse précipitée pendant un pas est 🧲⚖️💦 × surface × 🔺⏳💦',
    },
    '🧲': {
        '🧲☀️🔽': 'Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique',
        '🧲🌑🔼': 'Flux sortant (σT⁴)',
        '🧲🌈🔼': 'Courbe spectrale',
        '🧲🪩🔼': 'Flux réfléchi',
        '🔺🧲': 'Delta flux',
    },
    '🧮': {
        '🧮🌡️': 'Temp. (t° courante)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale (🔺λ)',
        '🔬🫧': 'Résolution atm. (🔺z)',
        '🧮🔄☀️': 'Cycle radiatif (crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=init, 1+=après crossing)',
        '🌡️🎱': 'T₂ : coefficient de P₂ du profil méridien T(x) = T̄ + T₂ P₂(x) (K) — état du point fixe glace ↔ gradient, posé par MERIDIEN.resoudre à chaque calcul d’albédo, remis à −28,0 K (condition initiale) au clic frise ; écarts de zone dT_z = −T₂ ⟨P₂⟩_z lus par MERIDIEN.ecarts()',
    },
    '🌕': {
        '🧲🌕': 'Flux géothermique (flux de l\'intérieur à la surface)',
        '🔋🌕': 'Puissance perdue par l\'intérieur',
        '🌡️🌕': 'Température potentielle de l\'intérieur (état porté d\'un clic à l\'autre)',
        '📅🌕': 'Date de cet état (années avant 2025)',
        '📅🧊🌕': 'Date de solidification de l\'océan de magma (années avant 2025 ; 0 = pas encore)',
    },
    '📛': {
        '🧲📛': 'EDS (effet de serre) W/m² = 🧲🌑🔼 − 🧲🌈🔼. OLR = 🧲🌈🔼 = flux IR sortant au sommet ; EDS = flux « bloqué » par l’atmosphère. EDS insuffisant ⟺ OLR trop élevé (même T surface).',
        '🧲📛🏭': 'EDS CO₂ W/m² — part mesurée PAR RETRAIT (Schmidt 2010)',
        '🧲📛💧': 'EDS H₂O W/m² — part mesurée PAR RETRAIT (Schmidt 2010), pas un ΔF',
        '🧲📛🐄': 'EDS CH₄ W/m² (part retenue par CH₄)',
        '🧲📛⛅': 'EDS nuages W/m² — part mesurée PAR RETRAIT (doc/DIAGNOSTIC_ATTRIBUTION_EDS.md)',
        '🍰📛🏭': 'Part EDS CO₂ [0,1] — méthode du retrait, normalisée à 1 (recouvrement réparti)',
        '🍰📛💧': 'Part EDS H₂O (vapeur) [0,1]',
        '🍰📛🐄': 'Part EDS CH₄ [0,1]',
        '🍰📛⛅': 'Part EDS nuages [0,1]',
        '🔺📛💧': 'ΔF H₂O affichage (W/m², convention)',
    },
    '🗻': {
        '🍰🗻🌊': 'Bassin océanique : 1 − terre émergée des bandes de latitude (PALEOGEO à la date ; avant 540 Ma, la valeur de l’époque)',
        '🍰🗻🏔': 'Hautes terres posées par l’époque, comptées dans la terre émergée (affichage : aucun calcul ne les lit)',
        '🍰🗻🌍': 'Terres basses : terre émergée moins les hautes terres',
        '🍰🗻🧊': 'Calottes : part de chaque bande (S/N × pol/mid/trop) sous calotte permanente (état porté d\'un clic à l\'autre)',
        '📅🗻🧊': 'Date de cet état des calottes et de leur socle (années avant 2025)',
        '🧮🍰🗻🧊': 'Calottes du pas de calcul courant (avancées depuis 🍰🗻🧊), engagées en fin de convergence ; 0 dans chaque bande hors d’un monde à océan',
        '🔺📏🗻🧊': 'Socle des calottes : altitude moins celle de son équilibre d’Airy sous la calotte portée, dans chacune des 48 cellules de chaque bande (6 tranches de latitude de 5° × 8 classes de socle, data/paleogeo_zones.js ; indice tranche · 8 + classe) (km ; négatif = resté plus bas, la glace ayant pesé plus) — porté avec 🍰🗻🧊',
        '🧮🔺📏🗻🧊': 'Socle des calottes du pas de calcul courant, engagé en fin de convergence',
        '📿🗻🧊': 'Sommet de chaque calotte (S/N × pol/mid/trop) : indice de sa cellule (tranche · 8 + classe), d’où son dôme part ; null tant que la place d’une calotte posée par la config n’est pas choisie, et pour une calotte d’aire nulle — porté avec 🍰🗻🧊',
        '🧮📿🗻🧊': 'Sommets des calottes du pas de calcul courant, engagés en fin de convergence',
        '⚖️🗻🧊': 'Masse des calottes continentales (kg) — état porté avec 🍰🗻🧊 ; null au clic frise jusqu’au premier calcul convergé',
        '🧮⚖️🗻🧊': 'Masse des calottes du pas de calcul courant (kg), engagée en fin de convergence ; 0 hors d’un monde à océan',
        '🧮🪩🗻🧊': 'Albédo annuel des calottes du pas, par bande (S/N × pol/mid/trop), pondéré par l\'insolation — neige sèche hors fonte, neige mouillée puis glace nue pendant la fonte ; lu par le co-albédo de zone du bilan méridien et par l’albédo planétaire, pondéré par la calotte de chaque bande ; 0 hors d’un monde à océan (eau sans phase condensée, ou pas d’atmosphère) : pas de calotte, aucune lumière réfléchie',
        '🍰🗻🌳': 'Forêt de chaque bande (S/N × pol/mid/trop) : part de sa terre émergée sous la forêt préagricole, là où la saison de croissance de ses latitudes permet l’arbre, moyenne de ses latitudes pondérée par leur part de terre ; elle fait l’albédo de sa terre libre hors de la neige ; 0 hors d’un monde à océan et avant les premiers arbres (~385 Ma) ; 0 au clic frise, portée d’un calcul à l’autre',
    },
    '🪩🍰': {
        '🪩🍰❄️': 'Neige sèche propre : glace saisonnière hors fonte, calottes',
        '🪩🍰🧊': 'Glace de mer froide (0,70, CCSM3) : neige mouillée de la glace saisonnière et des calottes pendant la fonte, plateau de la glace tropicale d’une boule de neige établie',
        '🪩🍰🏊': 'Glace de mer fondante (0,50, SHEBA) : glace nue à mares de la banquise saisonnière pendant la fonte, glace nue d’une calotte qui fond',
        '🪩🍰🌊': 'Océan libre',
        '🪩🍰🌍': 'Continents (terres nues, prairies, toundras)',
        '🪩🍰🏜️': 'Désert',
        '🪩🍰🌳': 'Forêt',
        '🪩🍰🌳❄️': 'Forêt enneigée : la canopée masque la neige du sol (0,25, milieu de 0,2–0,3)',
        '🪩🍰🎾': 'Lave',
    }
};

// ============================================================================
// OBJET FORM (formules de calcul) - Structure hiérarchique (2 niveaux)
// ============================================================================
const FORM = {
    '🧲': {
        '🧲☀️🔽': '🧲☀️🎱 × (1 - 🍰🪩📿) — 🍰🪩📿 inclut le voile SW (1−(1−A_geo)(1−🍰⚽))',
        '🧲🌕🔽': 'Flux géothermique (constant)',
        '🧲🌑🔼': 'σ × T⁴ = Flux émis par la surface (corps noir théorique à température T). Formule: 🧲🌑🔼 = σT⁴ où σ = 5.670374419e-8 W/(m²·K⁴). Pour T=303.5K: ≈501 W/m². ⚠️ Ce n\'est PAS le flux qui sort au sommet (c\'est 🧲🌈🔼). ⚠️ Ne pas comparer directement à 🧲☀️🔽+🧲🌕🔽 car l\'effet de serre fait que la surface émet plus que ce qui sort.',
        '🧲🌈🔼': 'Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = Aire sous courbe spectrale réelle (émission au sommet atmosphère). Δλ = (λ_max−λ_min)/(N−1) = pas réel de la grille (effective_delta_lambda), pas 0.1 μm fixe. Transfert radiatif: τ_λ(z), transmission exp(-τ), émission (1-exp(-τ))×π×B_λ(T). Intégration: 🧲🌈🔼 = Σ[λ] upward_flux[z_max][λ]. En équilibre: 🧲🌈🔼 ≈ 🧲☀️🔽+🧲🌕🔽',
        '🧲🪩🔼': '🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿 (non absorbé en surface, dont voile SW)',
        '🔺🧲': '🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼 = déséquilibre flux (entrant - sortant). Δ>0→réchauffer, Δ<0→refroidir. En équilibre: 🔺🧲 ≈ 0',
        '_explication_equilibre': 'Corps noir (70% soleil): 🧲☀️🔽 devrait être ~238 W/m² (pas 341.50) → équilibre à T≈255K',
        '_temperature_equilibre_corps_noir': 'T_équilibre = (S/4σ)^(1/4) = (952/4σ)^(1/4) ≈ 255K (-18°C) pour corps noir pur (S=70% actuel)',
        '_bug_flux_solaire': 'BUG: Si 🧲☀️🔽=341.50 W/m² au lieu de 238 W/m² → code utilise soleil actuel (100%) au lieu de 70%',
        '_effet_serre': 'Avec EDS: surface émet plus (T_surface > T_effective) mais atmosphère bloque → 🧲🌈🔼 < 🧲🌑🔼',
        '_evolution_soleil': 'Soleil jeune (4.5 Ga): 🔋☀️ = 70% actuel (2.68e26 W vs 3.83e26 W) - Faint Young Sun Paradox',
        '_faint_young_sun': 'Paradoxe: Soleil 30% moins lumineux mais Terre pas gelée → EDS plus fort (CO₂, CH₄) compensait',
        '_flux_entrant': '🧲☀️🔽 + 🧲🌕🔽 = Flux entrant total',
        '_formule_planck': 'B_λ(T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1)',
        '_formule_stefan': 'F = σT⁴ ≈ 239.7 W/m² pour T=255K (intégration complète 0→∞)',
        '_note_spectrale': 'Calcul spectral: intégration sur λ ∈ [0.1μm, 100μm] avec Δλ=0.1μm'
    },
    '🧮': {
        '🧮🌡️': 'T° courante (K)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction Search (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🫧': 'Résolution atmosphérique',
        '🧮🔄☀️': 'Cycle radiatif (nombre de crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=après init, 1+=après crossing)',
        '🌡️🎱': 'T₂ = 5 (S/S_réf) Σ_z J_z coA_z / (6D + B) (North, Cahalan & Coakley 1981, éq. 32), point fixe avec la glace et les calottes : itération simple x ← G(x) sans relaxation tant que la pente ĝ de G (sécante des deux derniers points) est positive et < 1 ; pas de Wegstein x ← x + (G(x) − x)/(1 − ĝ) quand elle est négative (Wegstein 1958 : une calotte qui répond par un saut) ; pas doublé quand ĝ ≥ 1 (x ← G(x) se traîne loin d’un point fixe instable), x ← x + 2ᵏ (G(x) − x), dans le sens de la dérive jusqu’à encadrer la racine ; racine encadrée (dernier T₂ où G(x) − x > 0, dernier où G(x) − x < 0, itérations ≥ 1) : dichotomie, x ← milieu de l’encadrement (elle converge même quand G saute d’une itération à l’autre) ; arrêt quand |G(x) − x| / (1 − max(ĝ, 0)) < 0,01 K, ĝ < 1 (une pente négative ne réduit pas l’erreur), ou quand l’encadrement fait moins de 0,01 K (G saute : une calotte change de branche, le point fixe est à son seuil), crash au-delà de 100 itérations — physics/meridien.js',
        '🧮🌡️🚩': 'T° initiale (T0)'
    },
    '☀️': {
        '🧲☀️': '🔋☀️ / (4π × (1 UA)²) × 1/√(1 − e²) — moyenne de l’année sur l’orbite elliptique (Kepler ; e de La2004 à la date, 0 hors de la solution) — compute.js getSoleil',
        '🧲☀️🎱': '🧲☀️ / 4 (Surf.Éclairée/Surf.Tot = πR²/4πR² = 1/4)',
        '🔋☀️': 'L☉ / (1 + 0,4 t/4,57 Ga) (Gough 1981), t = âge courant (INTERIEUR.ageCourant), L☉ = CONST.L_SOLEIL_W = 3,828e26 W (UAI 2015) — compute.js goughLuminosity'
    },
    '🌕': {
        '🧲🌕': '🔋🌕 / (4π × R²) = Flux géothermique (W/m²), où R = rayon planète (m). Intérieur fondu : 🧲🌈🔼 − 🧲☀️🔽 (surface = magma)',
        '🔋🌕': 'Q(🌡️🌕) = Q₀ (ΔT/ΔT₀)^(1+β) (η(T₀)/η(T))^β, convection sous couche limite (W) — geology/interieur.js',
        '🌡️🌕': 'C(T) dT/dt = H(t) − Q(T) : radiogénique U, Th, K moins la perte en surface (K)',
        '📅🌕': 'Âge de l\'état 🌡️🌕 (années avant 2025)',
        '📅🧊🌕': 'Âge où 🌡️🌕 franchit la transition rhéologique T_sol + 0,4 (T_liq − T_sol) (années avant 2025)'
    },
    '🫧': {
        '🎈': 'P = ((⚖️🫧 + m_vapeur) × 🍎) / (4π×(📐×1000)²) / CONV.STANDARD_ATMOSPHERE_PA, avec m_vapeur = ⚖️🫧×🍰🫧💧/(1-🍰🫧💧) - Pression atmosphérique (air sec + vapeur)',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'H × ln(P₀ / P_limit) où H = RT/(Mg) [von Kármán] - Ligne de Kármán (altitude où P = 0.01 Pa)',
        '📏🫧🛩': 'RT/(Mg) [équation hydrostatique] - Tropopause (échelle de hauteur atmosphérique)',
        '🍰🫧❀': 'Proportion radiative EDS - ∀ ❀ ∈ {🏭, 🐄, 🫁, 💨}',
        '🍰🫧❀🌈': 'Capacité radiative IR de ❀ - ∀ ❀ ∈ {🏭, 🐄, 💧}',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈) - ∀ ❀ ∈ {🏭, 🐄, 💧} (pour normalisation)',
        '🍰🫧✈': '⚖️✈ / ⚖️🫧 (fraction massique de sulfate, hors normalisation air sec)',
        // '🍰💭' RETIRÉE le 2026-09-23 : la couverture nuageuse ne dépend pas des CCN (Sundqvist 1989),
        // et sa formule faisait intervenir O₂ et CH₄, qui n'interviennent pas dans l'activation de Köhler.
    },
    '💧': {
        '🍰💧🧊': '(glace de mer + masse des calottes du pas 🗻.🧮⚖️🗻🧊) / ⚖️💧 — H2O.partagerEau, la seule écriture. Monde à océan (H2O.mondeOcean) : posée par calculateAlbedo après le bilan méridien ; glace de mer = Σ_bandes ρ_i A_bande × mer libre × g × h (g part de l’année où la mer de la bande est gelée, moyenne de ses latitudes, lue dans 🪩.🍰📅🧊[bande].mer — la même que pour l’aire et l’albédo de la glace de mer — ; h épaisseur de Stefan de chaque latitude moyennée sur la glace présente, g h = moyenne des t_i h_i : physics/saisons.js). Corps noir et sans atmosphère : calculateWaterPartition',
        '🍰💧🌊': '1 − 🍰💧🧊 − vapeur / ⚖️💧, vapeur = 🍰🫧💧 × ⚖️🫧 (H2O.partagerEau)',
        '🍰🧪🌧': '🎈🌧 / 🎈 — fraction MOLAIRE (mol/mol)<br>🎈🌧 = P_tr × exp(L_v/R_v × (1/T_tr - 1/🧮🌡️)) [Clausius-Clapeyron]<br>P_tr = CONST.P_TRIPLE_WATER = 611.657 Pa, T_tr = CONST.T_TRIPLE_WATER = 273.16 K (point triple, IAPWS),<br>L_v = 2.5e6 J/kg (chaleur latente vaporisation H2O), R_v = 461.5 J/(kg·K) = R/M_H2O, 🧮🌡️ = température actuelle',
        '🍰🫧💧': 'max(0, min(🍰🧪🌧 × (CONST.M_H2O / 🧪), ⚖️💧 / ⚖️🫧) - (🧲⚖️💦 × (4 × π × (📐 × 1000)²) × 🔺⏳💦) / ⚖️🫧) - Fraction massique de vapeur',
        '🍰🌧💧': 'clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧪🌧), 0, 1) [Clausius-Clapeyron] - Humidité relative globale (q / q_sat en fraction massique)',
        '☁️': '1 - (1 - min(🍰🌧💧, 1))^0.6 — Sundqvist (1989) : couverture nuageuse à partir de la SEULE humidité relative [sans dimension, 0-1]',
        '🪩👁': 'NUAGES_ISCCP.vusDenHaut(RADIATIVE.colonneNuageuse()) en fin de calcul : sous-colonnes en recouvrement aléatoire, sommet = couche la plus haute, τ de colonne = Σ τ présents, τ radiatif = R⁻¹(⟨R(τ)⟩), R deux-flux de solaire.js',
        '💭☔': 'clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95) - Seuil critique précipitations [0.7,0.9]',
        '🧲⚖️💦': 'W/τ_global × ramp(RH−💭☔, 0.2) quand RH > 💭☔ ; W = masse_vapeur_par_m² (kg/m²) ; P = W/τ (litt. ~2,7 mm/j GPCP) - Taux précipitation (kg/m²/s)',
        '🔺⏳💦': 'CONV.SECONDS_PER_DAY (1 jour), × CONFIG_COMPUTE.deltaTAccelerationDays pendant l\'accélération du cycle de l\'eau — calculateCloudFormationIndex, computeRadiativeTransfer, calculations_h2o.js'
    },
    '🪩': {
        '🍰🪩📿': '1 − (1 − A × 🍰🪩💧)(1 − 🍰⚽), A = min(0,9, Σ_z w_z A_z(Rg_z)) : albédo au sommet de chaque zone du bilan méridien (transfert solaire de la colonne nuageuse du calcul aux angles solaires de la zone, sur son albédo de surface Rg_z : surfaces libres, glace saisonnière par 🍰☀️🪩🧊, calottes par 🗻.🧮🪩🗻🧊), pondéré par la part w_z = ∫_zone I dx / ∫₀¹ I dx de l’insolation du globe qu’elle reçoit (insolation annuelle de l’orbite circulaire de l’obliquité courante : MERIDIEN.poidsInsolation ; 📱 0,587 / 0,334 / 0,0795 pour trop / mid / pol) ; 🍰🪩💧 = facteur corps noir — calculateAlbedo, MERIDIEN.resoudre (A)',
        '🍰🪩🎾': 'Fraction fondue de la péridotite à la température de surface : clamp((🧮🌡️ − T_solidus)/(T_liquidus − T_solidus), 0, 1), 1 359 et 2 053 K à 0 GPa (Katz et al. 2003 ; INTERIEUR.CONST) — ALBEDO.partLave, la seule : lue aussi par le bilan méridien (la lave couvre terres et mer de chaque bande)',
        '🍰🪩🌊': '🗻.🍰🗻🌊 (la mer de la carte : sous le niveau de la mer de sa reconstruction ; posée par l’époque avant 540 Ma) dans un monde à océan (H2O.mondeOcean ; hors de lui le bassin est à sec, 0), × (1 − 🍰🪩🎾), moins la part en eau des calottes du plateau ((1 − sec) × calottes du plateau, sec = part du bassin à sec), × (1 − part gelée de l’océan libre) — ALBEDO.surfacesSansGlace, calculateAlbedo',
        '🍰🪩🌳': 'Σ_bandes f_b (1 − 🍰🪩🎾) × forêt de la terre libre de la bande (ALBEDO.terresLibres : 🗻.🍰🗻🌳 × terres de la bande — terre émergée et part à sec du bassin —, moins les calottes que le sol et le désert de la bande ne portent pas) × (1 − part de l’énergie solaire de la bande sous la neige, 🪩.🍰☀️🧊 terre) ; f_b part du globe de la bande ; forêt de la bande : ALBEDO.poserForet (0,458 × part de ses latitudes sous la ligne des arbres de leur saison de croissance, Paulsen & Körner 2014) ; 0 hors d’un monde à océan (une plante demande de l’eau liquide et une atmosphère) et avant les premiers arbres (385 Ma) ; la neige des terres est masquée par la forêt sous la neige (ALBEDO.foretSousNeige), pas par celle-ci',
        '🍰🪩🏜️': 'Σ_bandes f_b (1 − 🍰🪩🎾) × désert de la terre libre de la bande (ALBEDO.terresLibres : min(terres − forêt, aride × terres) de la bande, moins les calottes que le sol de la bande ne porte pas) × (1 − part de l’énergie solaire de la bande sous la neige) ; aride = part aride des terres (ALBEDO.surfacesSansGlace) = base_aridité + 0,6 × variabilité, base_aridité = max(0, 1 − min(1, P_ann/1000)) × max(0, 1 − min(1, 🍰🌧💧/0,6)), variabilité = max(0,5, min(1, (🧮🌡️_C − 5)/10)) × max(0,5, 1 − 0,6 × 🍰🌧💧) — ⚠️ la part aride du globe dans chaque bande ; calculée à toute époque, partage refait à chaque itération du bilan méridien (au plus ce que laisse la forêt de la bande)',
        '🍰🪩🌍': 'Σ_bandes f_b (1 − 🍰🪩🎾) × (terres − forêt − désert de la bande) (ALBEDO.terresLibres), terres de la bande = terre émergée et part à sec du bassin (la part du bassin à sec faute d’eau est une terre) ; les calottes posées sur la terre émergée et la part à sec de celles du plateau y sont prises d’abord, puis sur le désert, puis sur la forêt de la bande ; × (1 − part de l’énergie solaire de la bande sous la neige). Lave, océan, forêt, terres, désert, glace saisonnière et calottes somment à 1 par construction, chacune ≥ 0 (erreur sinon) — steppes, prairies, toundras, montagnes (albédo ~0,18)',
        '🍰🪩🧊': 'Calottes du pas Σ_z f_z c_z × (1 − 🍰🪩🎾) (nulles hors d’un monde à océan : CALOTTES.sansCalotte) + glace saisonnière : océan libre × ⟨e_b,mer⟩ + terres libres × ⟨e_b,terre⟩, moyennes des bandes pondérées par leur mer et leur terre libres (e = 🪩.🍰☀️🧊, MERIDIEN.moyenneBandes) ; sa lumière réfléchie, la même moyenne de r = 🪩.🍰☀️🪩🧊 — la glace du bilan méridien à son état convergé, calculateAlbedo',
        '🍰🪩⛅': 'f = 0,72 × 🍰🪩🌊 + 0,55 × (1 − 🍰🪩🌊) — MODIS : 0,72 sur océan, 0,55 sur continent (King et al. 2013) ; 0 sans vapeur',
        '🪩🍰⛅': 'Albédo au sommet du ciel de nuages bas (SOLAIRE.albedo → Abas) : chaque couche en δ-Eddington selon μ₀ (Joseph et al. 1976), diffus = moyenne du direct sur l’hémisphère, moyenne sur la sphère ; τ, ω, g des gouttes et cristaux de Chou & Suarez 1999 (liquide : r_eff de Martin et al. 1994, N = CDNC × rapport CCN)',
        '🍰⚽': 'syncStratosphericVeil01 : clamp(0, 📜[🔺🍰⚽], 0.95) — obstruction',
        '🍰🪩⚽': '1 − 🍰⚽ (transmission SW après voile, écrit dans DATA[🪩] avec 🍰⚽)',
        '🍰🪩💧': 'min(1, volume d’eau / volume d’une couche globale de 10 m) — A_geo × ce facteur. '
            + 'Sur ⚫ : 0 avant les météorites (corps noir, voulu) ; un ☄️ à chaque tic, cumul géométrique 1e17 → 2,4e18 → 5,8e19 '
            + '→ 1,4e21 kg (EAU_ACCRETEE_KG, un océan) ≈ 0,3 m → 7,4 m → 178 m → 4,3 km d’eau globale : facteur 0,03 → 0,74 → 1 → 1 (glace partout, '
            + 'albédo 0,775, ≈ −97 °C sans atmosphère).',
        '🍰📅🧊': 'Bande b, moyenne de ses N_X = 10 latitudes (SAISONS.points, uniformes en sin φ ; sur les terres, pondérée par leur part de terre) de la part gelée de l’arc de chaque point (SAISONS.arc : T aux 24 nœuds de l’année = SAISONS.temperaturePoint — boîte + T₂ (P₂(x) − ⟨P₂⟩_zone) — au cycle annuel ET semi-annuel de sa boîte, la terre de sa latitude sur les terres (SAISONS.cycles, terre.latitudes), linéaire entre deux nœuds), sous 273,15 K pour les terres (CONST.T0_WATER) ; mer : g de saisons.js, moyenne des parts gelées des latitudes sous 271,15 K au cycle de la boîte de mer libre (la seule glace de mer) — EARTH.glaceSaisonniere, à chaque itération du bilan méridien (zéro au départ de son point fixe)',
        '🍰☀️🪩🧊': 'Σ_points λ Σ_nœuds S f α / Σ_points λ Σ_nœuds S (λ part de terre de la latitude sur les terres, 1 sur la mer ; points : N_X latitudes de la bande, SAISONS.points ; nœuds de l’année des calottes ; S insolation du nœud à la latitude du point, à la date ; f part gelée du nœud, SAISONS.arc) ; α = f_F 🪩🍰🌳❄️ + (1 − f_F) [α_sec (1 − P) + (p 🪩🍰🧊 + (1 − p − w) α_sous) P], f_F = forêt sous la neige sur les terres (ALBEDO.foretSousNeige : 0,31 × clamp((🧮🌡️ − 268,15 K)/25 K, 0,4, 1), la même à toutes les latitudes ; ⚠️ 🔧 forme sans source), 0 sur la mer, α_sec = ALBEDO.albedoGlaceSeche, P = Φ((T − T*_sec)/σ) probabilité qu’une neige sèche atteigne la fusion sous son albédo (CALOTTES.fonteJour : σ de Seguinot & Rogozhina 2014, T*_sec du bilan d’énergie d’une neige sèche, CALOTTES.contexte) ; T : air du nœud — sur les terres, l’air de la terre de sa latitude au point, sans palier ; sur la mer, la surface de la dalle de glace seule, au plus 0 °C (Maykut & Untersteiner 1971), p = min(1, neige / fonte possible) (P − E de Siler les jours de gel), w = max(0, 1 − p − ρ_i h / m_G) sur la mer (m_G fonte possible d’une glace nue, h épaisseur de Stefan du point : SAISONS.epaisseurStefan ; w = 0 sur les terres), α_sous = 🪩🍰🏊 sur la mer, 🪩🍰🌍 sur les terres ; hors d’un monde à océan P = 0 — EARTH.glaceSaisonniere',
        '🍰☀️🧊': 'Σ_points λ Σ_nœuds S f (1 − w P) / Σ_points λ Σ_nœuds S (λ part de terre de la latitude sur les terres, 1 sur la mer) : S insolation de chaque nœud de l’année (les 24 des calottes) à la latitude du point, à la date (SAISONS.noeuds : orbite de 1950 + écart de la date ; hors La2004, orbite circulaire de l’époque) × Soleil de l’époque ; f part gelée du nœud (SAISONS.arc) ; sur la mer, w part de la saison de fonte où la glace a fondu sa masse de Stefan (mer libre), P probabilité de fonte du nœud (formule de 🍰☀️🪩🧊) — EARTH.glaceSaisonniere',
        '🧮🪩🍰🧊': '[océan libre × ⟨r_b,mer⟩ + terres libres × ⟨r_b,terre⟩] / [océan libre × ⟨e_b,mer⟩ + terres libres × ⟨e_b,terre⟩], r = 🪩.🍰☀️🪩🧊, e = 🪩.🍰☀️🧊, ⟨⟩ moyennes des bandes pondérées par leur mer et leur terre libres (MERIDIEN.moyenneBandes) ; null sans glace saisonnière — calculateAlbedo',
        '_contribution_nuages': 'contribution_nuages = albedo × (1 - 🍰🪩⛅) + α_nuageux × 🍰🪩⛅ ; α_nuageux = 🪩🍰⛅ + (1−🪩🍰⛅)²·albedo/(1 − 🪩🍰⛅·albedo) (🪩🍰⛅ calculée, DATA)'
    },
    '🗻': {
        '🍰🗻🌊': '1 − Σ_z f_z (E_z,N + E_z,S)/2, E = part émergée de la bande, somme de ses cellules de socle > 0 (PALEOGEO à la date, CALOTTES.parts) ; avant 540 Ma : EPOCH.🗻.🍰🗻🌊 (❔ la mer posée par l’époque) — calculateGeologySurfaces (crash si les parts de l’époque ne font pas 1, ou si la terre émergée du globe dépasse 1)',
        '🍰🗻🏔': 'EPOCH.🗻.🍰🗻🏔 (crash si elle dépasse la terre émergée de la carte)',
        '🍰🗻🌍': '1 − 🍰🗻🌊 − 🍰🗻🏔',
        '🍰🗻🧊': 'Clic frise : EPOCH.🗻.🍰🗻🧊 (aires sourcées) ; clic time : dV/dt = a A_bande B̄(a, socle 🔺📏🗻🧊) / ρ_i (plafond : le continent de la bande), V = N (8π/15) C R^(5/2), N dômes plastiques égaux de l’aire de la calotte, R = √(a A_bande / (N π)), N = CALOTTES.nDomes (PALEOGEO.n_morceaux : nombre effectif des morceaux connexes de la carte à la part a / continent du continent, linéaire entre deux parts et deux cartes ; 1 à aire nulle et avant 540 Ma), C = √(2τ / (ρ_i g (1 − ρ_i/ρ_m))), τ = PALEOGEO.tau_Pa ; la calotte couvre, depuis son sommet (🗻.📿🗻🧊) et dans l’ordre de robustesse (ΔT* du bilan du sol nu), les cellules que son dôme atteint ; la marge gagne une cellule par son haut : la part couverte f d’une cellule de socle moyen m est à m + w (1 − f), w = min(haut − m, m − bas) dans les bornes de sa classe (classe du haut : m − bas ; classe du bas : bas = PALEOGEO.socle_continent_m, −1 000 m, le seuil du continent de la table), le sommet nu d’une calotte d’aire nulle au point le plus haut de sa cellule (socleCouvert) ; sommets candidats : dans chaque tranche, la cellule de terre émergée la plus robuste ; une calotte naît (aire nulle) sur le premier candidat, dans l’ordre de robustesse, dont le dôme grandit (son équilibre depuis l’aire nulle couvre les min(2, longueur du rang) premières cellules de son dôme : sa cellule et la suivante, sa seule cellule quand le continent n’en a qu’une), sinon sur le plus robuste ; une calotte posée par la config prend le candidat du meilleur B̄ à son aire ; une calotte qui existe garde son sommet ; équilibre (premier zéro de B̄ sur le chemin) lu aux 40 pas de la grille et aux bords des cellules du dôme ; portée : la tranche d’une cellule est à max(0, |φ − φ_sommet| − 2,5°) du sommet, et la cellule n’est gagnée que si le dôme qui la couvre a ce rayon, √((S + aire)/π), S + aire l’aire cumulée, sans N (sinon la plus proche) — CALOTTES.rangBilan, dome ; intégrée en q = V^(1/5), dq/dt = (π/5)((8π/15) C)^(−4/5) N^(1/5) B̄/ρ_i (l’aire d’un volume est N^(1/5) fois celle d’un dôme unique, N lu à l’aire, point fixe) : Heun en sous-pas (τ_b, temps propre ρ_i max(H̄, h_tol)/max(accumulation, fonte)) sur les 100 derniers ka du clic, l’orbite à la date de chaque sous-pas ; Euler implicite en pas qui doublent plus tôt dans le clic — physics/calottes.js',
        '📅🗻🧊': 'Âge de l\'état 🍰🗻🧊 et 🔺📏🗻🧊 (années avant 2025) : ▶ de l\'époque au clic frise, date du calcul ensuite',
        '🧮🍰🗻🧊': 'Même intégration sur Δt = 📅🗻🧊 − âge courant — posé par MERIDIEN.resoudre à chaque itération de son point fixe, lu par CALOTTES.engager',
        '🔺📏🗻🧊': 'Clic frise : 0 ; clic time : dd/dt = ((ρ_i/ρ_m) H − d)/τ_b par cellule, τ_b = 4π η / (ρ_m g λ), η = 1e21 Pa·s, λ = (3 000/1 350) × 2 √(A_continent/π) (rayon du dôme unique qui couvrirait le continent de la bande, sans N), g = 📅.🍎 ; 🔺📏🗻🧊 = −(d − (ρ_i/ρ_m) H)/1000 ; hors d’un monde à océan (pas de calotte), relaxation sans charge depuis l’enfoncement porté, d(t) = (L₀ + e₀) e^(−t/τ_b) (CALOTTES.sansCalotte)',
        '🧮🔺📏🗻🧊': 'Même intégration sur Δt = 📅🗻🧊 − âge courant — posé par MERIDIEN.resoudre à chaque itération de son point fixe, lu par CALOTTES.engager',
        '📿🗻🧊': 'Clic frise : null ; fin de convergence : CALOTTES.engager ← 🧮📿🗻🧊',
        '🧮📿🗻🧊': 'Candidats : dans chaque tranche, la cellule de terre émergée la plus robuste (ΔT* du bilan du sol nu). Calotte d’aire nulle au départ : le premier candidat, dans l’ordre de robustesse, dont le dôme grandit — son équilibre depuis l’aire nulle (bilan intégré B̄ lu aux pas de la grille et aux bords des cellules du dôme) couvre les min(2, longueur du rang) premières cellules de son dôme : sa cellule et la suivante, sa seule cellule quand le continent n’en a qu’une —, sinon le plus robuste ; calotte portée dont la cellule existe à la date : 📿🗻🧊 ; calotte posée (📿🗻🧊 null) ou dont la cellule n’existe plus : le candidat du meilleur B̄ à l’aire portée, sur son socle porté, à l’orbite du départ du clic ; null si l’aire du pas est nulle — CALOTTES.rangBilan, posé par MERIDIEN.resoudre à chaque itération',
        '⚖️🗻🧊': 'Clic frise : null (le rayon de la date n’est posé qu’au calcul, INTERIEUR.avancer) ; fin de convergence : CALOTTES.engager ← 🧮⚖️🗻🧊',
        '🧮⚖️🗻🧊': 'ρ_i Σ_bandes V des calottes du pas (CALOTTES.calculer().masse), posée par MERIDIEN.resoudre à chaque itération de son point fixe ; lue par le partage de l’eau (H2O.partagerEau) ; 0 hors d’un monde à océan (CALOTTES.sansCalotte)',
        '🧮🪩🗻🧊': 'Σ_cellules couvertes Σ_nœuds S [(1 − f) 🪩🍰❄️ + f (p 🪩🍰🧊 + (1 − p) 🪩🍰🏊)] / Σ S, S insolation du nœud, f probabilité de fonte (bilan d\'énergie de surface), p part de la saison de fonte sur la neige de l\'année — physics/calottes.js (bilanPoint), posé par MERIDIEN.resoudre à chaque itération ; 0 hors d’un monde à océan (CALOTTES.sansCalotte)',
        '🍰🗻🌳': 'ALBEDO.FORET.PART_PREAGRICOLE (0,31 × 6,0/4,06 : forêt de 2020, FAO 2020, × forêt d’avant le défrichement, Williams 2006) × part de la bande sous la ligne des arbres : pour chaque latitude de terre de la bande (SAISONS.points, uniformes en sin φ, chaque point portant la terre des tranches de la carte que recouvre sa cellule en sin φ, au prorata de l’aire), à son arc de l’année (T aux 24 nœuds, linéaire entre deux nœuds), saison de croissance L = durée où T ≥ 0,9 °C, marges L − 94 jours et ∫(T − 0,9 °C) dt − 5,5 K × L (Paulsen & Körner 2014 : ≥ 94 jours, moyenne ≥ 6,4 °C) ; chaque marge linéaire entre deux latitudes voisines, part de la cellule de chacune où les deux sont ≥ 0 (la forêt de cette latitude), moyenne des cellules pondérée par la part de terre de chaque latitude (poids des arcs, SAISONS.cycles) — si H2O.mondeOcean et âge ≤ ALBEDO.FORET.AGE_PREMIERS_ARBRES (385 Ma, Gilboa : Stein et al. 2007, 2012), 0 sinon ; ALBEDO.poserForet, appelée par EARTH.glaceSaisonniere à chaque itération du bilan méridien ; 0 au clic frise (MERIDIEN.depuisConfig), le point fixe part de celle du calcul précédent ; ❔ 0,458 = forêt préagricole de TOUTES les terres hors Antarctique (FAO 2020 × Williams 2006), lue comme part des terres sous la ligne des arbres : la forêt sous la ligne est sous-estimée',
        '_note': '🗻 = Géologie : terre et mer de la carte (PALEOGEO), indépendantes des stocks d\'eau, et calottes continentales (aire, socle, masse, albédo)'
    },
    '⚖️': {
        '⚖️❀': 'Masse ❀ - ∀ ❀ ∈ {🏭, 🐄, 🫁, 💨} (+ ⚖️✈ sulfate)',
        '⚖️💧': 'Masse H2O totale',
        '⚖️🫧': 'Masse atmosphère sec = ⚖️🏭 + ⚖️🐄 + ⚖️🫁 + ⚖️💨 (sans vapeur d\'eau ; ⚖️✈ = sulfate, compté à part)'
    },
    '🪩🍰': {
        '🪩🍰❄️': 'Neige sèche de la glace saisonnière hors fonte (ALBEDO.albedoGlaceSeche ; aux tropiques, vers 🪩🍰🧊 avec l’étendue de la glace : une boule de neige établie) et des calottes hors fonte (Warren & Wiscombe 1980 ; Gardner & Sharp 2010) — EARTH défaut 0,85, plafonnée par EPOCH[🌫️❄️] (glace sale) ; écrit par calculateAlbedo',
        '🪩🍰🧊': 'Glace de mer froide de CCSM3 (Briegleb et al. 2004) dans deux rôles : neige mouillée de la glace saisonnière et des calottes pendant la fonte, plateau de la glace tropicale d’une boule de neige établie — EARTH défaut 0,70, plafonnée par EPOCH[🌫️❄️] ; écrit par calculateAlbedo',
        '🪩🍰🏊': 'Glace de mer fondante (Perovich 2002, SHEBA) : glace nue à mares de la banquise saisonnière pendant la fonte (EARTH.glaceSaisonniere) et glace nue d’une calotte qui fond — EARTH défaut 0,50 ; écrit par calculateAlbedo',
        '🪩🍰🌊': 'Fresnel d’une mer plane, n = 1,333 (Hale & Querry 1973) : EARTH défaut 0,066 — écrit avec les autres matériaux par calculateAlbedo (EARTH ⊕ EPOCH[🪩🍰])',
        '🪩🍰🌍': 'EARTH défaut 0,18, surchargé par EPOCH[🪩🍰] (⚫ : 0) — écrit par calculateAlbedo',
        '🪩🍰🏜️': 'EARTH défaut 0,30 — écrit par calculateAlbedo',
        '🪩🍰🌳': 'EARTH défaut 0,17 — écrit par calculateAlbedo',
        '🪩🍰🌳❄️': 'EARTH défaut 0,25 : ⚠️ fourchette mesurée de la canopée boréale enneigée ~0,2–0,3, milieu (Robock 1980 ; Betts & Ball 1997 ; Qu & Hall 2007) — écrit par calculateAlbedo, lu par EARTH.glaceSaisonniere',
        '🪩🍰🎾': 'EARTH défaut 0,05 — écrit par calculateAlbedo'
    }
};


/** alt0sec (data-tooltip, immédiat) — description complète des clés dico. */
const KEYS_ALT0SEC = {
    '🪩🍰❄️':
        'Albédo plateau neige profonde propre (EARTH[\'🪩🍰\'][\'🪩🍰❄️\'], défaut 0.85 — Warren & Wiscombe 1980 ; Warren 1982).\n\n' +
        'Neige sèche de la glace saisonnière hors fonte (aux tropiques tant qu\'une boule de neige n\'est pas établie) et des calottes hors fonte : glace neuve brillante à l\'entrée snowball (1a).\n\n' +
        'Sortie snowball (1b, mudball) : plafonné par min(🪩🍰❄️, EPOCH[🌫️❄️]) quand la poussière volcanique assombrit la neige (Abbot & Pierrehumbert 2010).',
    '🪩🍰🧊':
        'Albédo de la glace de mer froide (EARTH[\'🪩🍰\'][\'🪩🍰🧊\'], défaut 0.70 — CCSM3, Briegleb et al. 2004).\n\n' +
        'Deux rôles : neige mouillée de la glace saisonnière et des calottes pendant la fonte, plateau de la glace tropicale une fois le snowball établi (sublimation, pas de neige pristine — Pierrehumbert 2005).\n\n' +
        'Mudball 1b : aussi plafonné par EPOCH[🌫️❄️] (poussière sur toute la surface gelée).',
    '🪩🍰🏊':
        'Albédo de la glace de mer fondante (EARTH[\'🪩🍰\'][\'🪩🍰🏊\'], défaut 0.50 — Perovich SHEBA 2002 ; Briegleb et al. NCAR/TN-463).\n\n' +
        'Glace nue à mares de la banquise saisonnière pendant la fonte, et glace nue d\'une calotte qui fond (fonte et albédo annuel des calottes). Paramètre matériau, pas un réglage d\'époque.'
};

// ============================================================================
// EXPOSITION GLOBALE — définitions seulement (KEYS lu par initDATA.js)
// ============================================================================
window.KEYS = KEYS;
window.DESC = DESC;
window.FORM = FORM;
window.KEYS_ALT0SEC = KEYS_ALT0SEC;
