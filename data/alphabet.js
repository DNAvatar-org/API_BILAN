// File: API_BILAN/data/alphabet.js - Alphabet des clés : caractères et descriptions
// Desc: En français, dans l'architecture, je suis le VOCABULAIRE du modèle : quel emoji désigne quelle
//       grandeur, et comment il se dit en clair. Rien que des définitions — aucun DOM, aucune image, aucun
//       chemin de fichier. C'est ce qui me rend chargeable par n'importe quel hôte de l'API, y compris un
//       banc sans interface. Le rendu (lexique HTML, pictos PNG, logos) vit dans CO2/static/compute/alphabet_render.js.
// Version 2.1.0
// Date: [September 19, 2026]
// logs :
//   - v2.1.0: LA RÈGLE DE L'ALPHABET écrite (1ᵉʳ caractère = unité ; pour 🍰, le 2ᵉ dit la nature du
//     rapport). ⚗ quitte la colonne Unités pour Événements — c'est une action d'interface. 🧪 devient
//     le marqueur MOLAIRE, 🧲⚖️ le flux de masse. Deux clés renommées pour respecter la règle :
//     🍰🧪🌧 → 🍰🧪🌧 (molaire) et 🧲⚖️💦 → 🧲⚖️💦 (kg/m²/s). Ce sont les deux qui produisaient
//     les bugs massique/molaire à répétition.
//   - v2.0.2: EMISSIONS_HIGH passe de 🐖 à 🪾 (configTimeline v1.4.91 — 2 × le bidon par tranche).
//   - v2.0.1: 🐖 EMISSIONS_HIGH — la branche d'émissions la plus forte de 📱 (configTimeline v1.4.90).
//   - v2.0.0: séparation définitions / rendu. Ce fichier revient dans API_BILAN — son en-tête l'y plaçait
//     depuis toujours (« File: API_BILAN/data/alphabet.js ») alors qu'il vivait dans CO2/static/compute/.
//     Il ne contient plus que CHARS, CHARS_DESC et epochName ; tout ce qui dessine est parti côté CO2.
//   - v1.0.17 et avant : voir l'historique de CO2/static/compute/alphabet.js.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

(function () {
    'use strict';
    if (typeof window !== 'undefined' && window.__alphabetModuleLoaded) return;
    if (typeof window !== 'undefined') window.__alphabetModuleLoaded = true;

// ============================================================================
// DÉFINITION DES CARACTÈRES (CHARS)
// ============================================================================
// Source unique de référence pour tous les caractères (logos) utilisés dans l'application
const CHARS = {
    CO2: '🏭',      // CO2 : usine (émissions industrielles)
    CH4: '🐄',       // CH4 : pompe à essence (combustibles fossiles, pets de vache)
    H2O: '💧',      // H2O : goutte d'eau
    GEOTHERMAL_FLUX: '🌕', // Geothermal flux : lune (flux géothermique)
    FLUX_START: '▶', // Flux start : flèche droite (valeur de départ)
    FLUX_END: '◀', // Flux end : flèche gauche (valeur de fin)
    ENERGY_FLUX: '🧲', // Energy flux : sources chaudes (W/m²)
    O2: '🫁',       // O2 : poumons (affichage)
    N2: '💨',       // N2 : vent (azote/air)
    SULFATE: '\u2708\uFE0F',  // SO₄ proxy — présentation emoji (U+2708 + VS16)
    WEIGHT: '⚖️',   // Poids : balance (masse)
    DENSITY: '💨',  // Densité : vent
    ALTITUDE: '🧿', // Altitude : galaxie (Ligne de Kármán, frontière atmosphère/espace)
    ANIMATION: '🎞', // Animation : film
    TROPOPAUSE: '🛩', // Tropopause : avion
    GREENHOUSE_FORCING: '♻', // Greenhouse forcing : recyclage
    CLOUD_ALBEDO: '🌤', // Cloud albedo contribution : soleil avec nuage
    MAX_VAPOR: '🌧', // Max vapor fraction : pluie
    ALBEDO: '🪩',   // Albédo : miroir
    EDS: '📛',      // EDS (effet de serre) ; ΔF = convention affichage
    TEMP: '🌡️',     // TEMP : Température
    PHASE: '⚧',     // Phase : symbole transgenre (phase de convergence)
    T0: '🚩',        // T0 : drapeau (température initiale)
    DIRECTION: '☯', // Direction : yin-yang (direction du delta)
    BIG_IMPACT: '🎇', // Big impact : feu d'artifice (événement d'impact majeur)
    TIC_TIME: '💫',      // TicTime : étoile (événement d'avancement temporel)
    EMISSIONS: '🛢',     // Scénario émissions CO₂ (époque moderne, remplace 💫 pour 📱)
    EMISSIONS_HIGH: '🪾', // Scénario émissions le plus fort (📱) : 2 × 🛢 par tranche de 25 ans
    SATELLITE: '🛰', // Satellite : satellite (événement)
    FLUX_CN: '🌑', // Flux sortant : lune noire (rayonnement corps noir sortant)
    TOLERANCE: '🔬', // Tolérance : précision pour le test d'arrêt
    DESERT: '🏜️',   // Désert : plage (utilisé dans albedo breakdown)
    VOLCANO_VEIL: '🗻', // Volcan (action-1a) : voile atmosphérique — assombrit le Soleil (événement)
    VOLCANO: '🌋',  // Volcan (action-1b) : +CO₂ + noircissement glace (événement)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅',     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
    CLOUD_FORMATION: '☁️', // Potentiel de condensation nuageuse
    COMPUTE: '🧮',  // Compute : sablier (pour les valeurs de convergence)
    GREENHOUSE_FORCING_ALT: '🌴',  // Greenhouse forcing alternatif : palmier
    CARDINAL: '📿', // Cardinal : 🎓
    DELTA: '🔺',    // Delta : triangle
    METER: '📏',    // Mètre : règle
    PROPORTION: '🍰', // Proportion : 🍰 🧩
    POWER: '🔋',    // Puissance : batterie (Watts)
    SUN_ORIGIN: '☀️', // Soleil
    GEOMETRY_ORIGIN: '🎱', // Géometrie : boule de billard
    SPECTRAL: '🌈', // Spectre : arc-en-ciel
    ATMOSPHERE: '🫧', // Atmosphère : vent
    CONFIG: '📜',   // Config : parchemin
    METEORITE_COUNT: '☄️', // Nombre de météorites
    FLUX_IN: '🔽',  // Flux entrant (réception, +)
    FLUX_OUT: '🔼', // Flux sortant (émission, -)
    // Époques géologiques
    EPOCH: '📜',    // Époque : parchemin
    CORPS_NOIR: '⚫', // Corps Noir (libellé UI = CHARS_DESC['⚫'])
    HADEEN: '🔥',   // Hadéen : feu/lave
    ARCHEEN: '🦠',  // Archéen : microbe unicellulaire
    PROTEROZOIC: '🪸', // Protérozoïque (2500–750 Ma) : corail (multicellularité, eucaryotes)
    HYSTERESIS_1A: 'hysteresis 1a', // Sturtienne (750–720 Ma) — bascule albédo↓ (id stable, logo ☃)
    SNOWBALL_ENTRY: '☃', // Entrée Sturtienne (alias affichage hyst 1a)
    SNOWBALL: '⛄',  // Plein Snowball (720–690 Ma) : accumulation CO₂ sous glace
    HYSTERESIS_1B: 'hysteresis 1b', // Sortie Marinoen (690–600 Ma) — hyst 1b (id stable, logo ⛈)
    SNOWBALL_EXIT: '⛈', // Sortie Marinoen (alias affichage hyst 1b) : déglaciation brutale, pluies acides
    PALEOZOIC_MARINE: '🪼', // Paléozoïque marin (600–420 Ma) : méduse (vie marine, explosion cambrienne)
    PALEOZOIC_LAND: '🍄', // Paléozoïque terrestre (420–280 Ma) : champignon (Prototaxites, forêts Dévonien)
    PERMIAN_TRIASSIC: '💀', // Extinction permienne (280–250 Ma) : crise Permien-Trias −252 Ma, Trapps sibériens
    MESOZOIC: '🦕', // Mésozoïque (250–66 Ma) : dinosaure sauropode
    CENOZOIC: '🦤', // Cénozoïque (66–50 Ma) : dodo (recovery post-K/Pg, radiation oiseaux)
    PETM_HOUSE: '🐊', // Éocène (50–35 Ma), pic thermique type PETM
    HYSTERESIS_2: 'hysteresis 2', // Eocène-Oligocène (35–33 Ma) — hyst 2 (id stable, logo 🐧)
    EOCENE_OLIGOCENE: '🐧', // Eocène-Oligocène (alias affichage hyst 2) : calotte Antarctique
    EOT: '🏔',      // Grande Coupure (33–2 Ma) : Himalaya, altération silicates
    QUATERNARY: '🦣', // Quaternaire (2 Ma–10 ka) : mammouth (Pléistocène, glaciations)
    HOLOCENE: '🛖', // Holocène (10 ka–1800) : agriculture, villages
    TODAY: '🚂',    // Industriel (1800–2000) : train
    MODERN: '📱',   // Aujourd'hui (2000–2100) : smartphone
    EVENTS: '🕰',   // Événements : horloge
    CYCLE: '🔁',    // Cycles : états successifs appliqués par tic (🕰.🔁, ex. glaciaire/interglaciaire)
    TEXTURE: '🖼',  // Texture de la planète imposée (suite 🕰.🖼, parcourue par les tics)
    NIGHTMAP: '🌙', // Carte de nuit superposée (🕰.🌙) : lumières des villes côté ombre
    OBLIQUITY: '⚾', // Obliquité ε de l'axe terrestre (degrés) — Milankovitch
    TRANSITION: '⏩', // Transition : flèche rapide
    DATE: '📅',     // Date : calendrier
    PLANET_RADIUS: '📐', // Rayon de la planète : équerre
    GRAVITY: '🍎',  // Gravité : pomme (gravité)
    MOLAR_MASS_AIR: '🧪', // Masse molaire de l'air : flacon (chimie)
    ALEMBIC: '⚗',  // Alembic (chimie / science)
    PRESSURE: '🎈', // Pression : ballon (pression)
    INDEX_EPOCH: '👉', // Index de l'époque : pointeur
    LOGO_EPOCH: '🗿', // Logo/Nom de l'époque : statue
    TRIPLE_POINT: '┴', // Point triple : pont (P,T au point triple)
    GLOBE_AFRICA: '🌍',   // Globe Afrique (terre Protérozoïque, Cénozoïque)
    GLOBE_AMERICAS: '🌎', // Globe Amériques (terre Mésozoïque)
    GLOBE_ASIA: '🌏',     // Globe Asie (terre Paléozoïque)
};

// Logo (emoji) -> image pour affichage des PICTO (boutons, frise).
// ⚠️ charsImages ne touche JAMAIS aux textures Three.js !
// ============================================================================
// DESCRIPTIONS DES CARACTÈRES (CHARS_DESC) - Utilise directement les emojis
// ============================================================================
// ─── LA RÈGLE DE L'ALPHABET ──────────────────────────────────────────────────────────────
// Le PREMIER caractère d'une clé donne son UNITÉ. C'est la règle qui rend l'écriture des
// formules vérifiable : une somme de ⚖️ avec un 🧲 se voit à l'œil nu.
//
// Pour 🍰 (proportion, sans dimension), l'unité ne suffit pas : une proportion DE QUOI ?
// Le DEUXIÈME caractère le dit, et cette règle était déjà respectée par 34 clés sur 36 —
// elle n'était simplement écrite nulle part. Elle l'est maintenant :
//
//     🍰🫧…  proportion MASSIQUE de l'atmosphère   (kg/kg)   ex. 🍰🫧🏭 = ⚖️🏭 / ⚖️🫧
//     🍰💧…  proportion MASSIQUE de l'eau totale   (kg/kg)   ex. 🍰💧🧊
//     🍰🪩…  proportion de SURFACE (albédo)        (m²/m²)   ex. 🍰🪩🌊
//     🍰🗻…  proportion de SURFACE (géologie)      (m²/m²)   ex. 🍰🗻🌊
//     🍰📛…  proportion d'ÉNERGIE (effet de serre) (W/W)     ex. 🍰📛🏭
//     🍰🧪…  proportion MOLAIRE                    (mol/mol) ex. 🍰🧪🌧
//
// ⚠️ v-2026-09-23 : deux clés violaient la règle, et ce sont exactement les deux qui ont produit
// des bugs répétés (voir doc/DIAGNOSTIC_RETROACTION_VAPEUR.md) :
//   • 🍰🧪🌧 était une fraction MOLAIRE rangée sous 🧮 (« Calculs »), au milieu de voisines
//     massiques → renommée 🍰🧪🌧. La confusion massique/molaire a frappé trois fois
//     (ln_H2O, computePWV, calculateMolarMassAir) faute que le symbole le dise.
//   • 🧲⚖️💦 était un DÉBIT en kg/m²/s — ni une proportion, ni une masse → renommée 🧲⚖️💦.
//
// Aucun emoji nouveau n'a été créé : 🧪 (molaire) et 🧲⚖️ (flux de masse) composent des
// caractères d'unité qui existaient déjà, comme ┴ compose (🎈,🌡️).
const CHARS_DESC = {
    // Unités
    '📿': 'Cardinal (#)',
    '🍰': 'Proportion sans dimension [0,1] — le 2ᵉ caractère dit de quoi : 🫧💧 massique, 🪩🗻 surfacique, 📛 énergétique, 🧪 molaire',
    '📏': 'Longueur (km)',
    '⚖️': 'Masse (kg)',
    '🎈': 'Pression (atm)',
    '🌡️': 't° (K)',
    '🔋': 'Puissance (W)',
    '🔽': 'Réception (+)',
    '🔼': 'Émission (-)',
    '🍎': 'Gravité (m/s²)',
    '🧲': 'Flux surfacique (W/m²) — 🧲⚖️ = flux de MASSE (kg/m²/s)',
    '🧪': 'Molaire — seul : masse molaire (kg/mol) ; en 2ᵉ position : rapport MOLAIRE (mol/mol)',
    '┴': 'Point triple de l\'eau (🎈,🌡️) = 611,657 Pa à 273,16 K (IAPWS)',
    '⚧': 'Phase (Init/Search/Dicho)',
    '☯': 'Direction Search (+/-)',
    // Éléments
    '💧': 'H₂O',
    '🐄': 'CH₄',
    '🏭': 'CO₂',
    '🫁': 'O₂',
    '✈': 'SO₄²⁻ (aérosols sulfate)',
    '🧊': 'Glace',
    '⛅': 'Nuages',
    '🌊': 'Océan',
    '🎾': 'Lave',
    '⚽': 'Voile SW stratosphérique',
    '🏜️': 'Désert',
    '🌳': 'Forêt',
    '🌍': 'Continents',
    '🫧': 'Atmosphère',
    '☀️': 'Soleil',
    '🎱': 'Géometrie',
    '🌈': 'Spectre',
    // Calculs
    '🧮': 'Calculs O(🧲🔬x🔬🌈x🔬🫧)',
    '🎞': 'Animation',
    '🔺': 'Delta (*)',
    '🔬': 'Tolérance (précision)',
    '🚩': 'T0 (t° initiale)',
    '🪩': 'Albédo',
    '🌕': 'Géothermie',
    '📛': 'EDS (effet de serre)',
    '🌑': 'Flux sortant (σT⁴)',
    '☁️': 'Index formation nuageuse [0,1]',
    // Événements
    '⚗': 'Affiche les concentrations (action d\'interface — ce n\'est PAS une unité)',
    '💫': 'TicTime',
    '🛢': 'Scénario émissions',
    '🪾': 'Scénario émissions — double du bidon',
    '☄️': 'Météorite de glace',
    '🗻': 'Volcan — voile atmosphérique',
    '🌋': 'Volcan — CO₂ + noircissement de la glace',
    '🛰': 'Satellite',
    '🌧': 'Saturation H₂O',
    '🎇': 'Big impact',
    '▶': 'Début',
    '◀': 'Fin',
    '🧿': 'Ligne de Kármán',
    '🛩': 'Tropopause',
    // Autres
    '💨': 'N₂',
    // Époques géologiques
    '📜': 'Époque (Ma)',
    '👉': 'Index',
    '🗿': 'Logo',
    '⚫': 'Corps Noir',
    '🔥': 'Hadéen',
    '🦠': 'Archéen',
    '🪸': 'Protérozoïque',
    '☃': 'Sturtienne',
    '⛄': 'Plein Snowball',
    '⛈': 'Sortie Marinoen',
    '🪼': 'Paléozoïque marin',
    '🍄': 'Paléozoïque terrestre',
    '💀': 'Extinction permienne',
    '🦕': 'Mésozoïque',
    '🦤': 'Cénozoïque',
    '🐊': 'Éocène',
    '🐧': 'Eocène-Oligocène',
    '⛰': 'Montagne (relief)',
    'hysteresis 1a': 'Sturtienne',
    'hysteresis 1b': 'Sortie Marinoen',
    'hysteresis 2': 'Eocène-Oligocène',
    '🏔': 'Grande Coupure',
    '🦣': 'Quaternaire',
    '🛖': 'Holocène',
    '🚂': 'Industriel',
    '📱': 'Aujourd\'hui',
    '🕰': 'Événements',
    '🔁': 'Cycles (états par tic)',
    '🖼': 'Texture planète (suite)',
    '🌙': 'Carte de nuit (superposée)',
    '⚾': 'Obliquité ε (°)',
    '⏩': 'Transition',
    '📅': 'Date (Ma)',
    '📐': 'Rayon planète',
    '🍎': 'Gravité (m/s²)',
    '┴': 'Point triple de l\'eau (🎈,🌡️) = 611,657 Pa à 273,16 K (IAPWS)'
};

// alt2sec des époques : déplacé dans static/texts/epochs_alt2sec.js (récit + chiffres lus à la source).


// ============================================================================
// EXPOSITION GLOBALE — définitions seulement
// ============================================================================

window.CHARS = CHARS;
window.LOGOS = CHARS; // Alias historique (configOrganigramme, organigramme)
window.CHARS_DESC = CHARS_DESC;
// Source unique pour mapper id époque (emoji ou 'hysteresis Xy') → nom français.
window.epochName = function (id) {
    return (CHARS_DESC[id] !== undefined) ? CHARS_DESC[id] : id;
};

})();
