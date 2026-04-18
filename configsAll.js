// File: API_BILAN/configsAll.js - Configs combinées (alphabet, dico, initDATA, model_tuning, configTimeline)
// Desc: Concatenation automatique de : data/alphabet.js + data/dico.js + data/initDATA.js + config/model_tuning.js + config/model_tuning_biblio.js + config/fine_tuning_bounds.js + config/configTimeline.js
// Version 1.0.21
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [April 18, 2026] [18:00 UTC+1]
// Logs:
// - v1.0.21: baryByGroupDefault CLOUD_SW 65 % + SCIENCE 65 % (aligné initDATA / configTimeline) ; calibrations époques fines → configTimeline.js v1.4.9+ (TIMELINE embarqué ci-dessous = schéma simplifié hérité)
// - v1.0.20: baryByGroupDefault CLOUD_SW 50 % + SCIENCE 50 % (jauge unique scie/bench) ; aligné initDATA / configTimeline
// - v1.0.19: baryByGroup init + CONFIG_COMPUTE.baryByGroupDefault — SCIENCE 50 % ; CHARS.SULFATE / CHARS_DESC = U+2708 U+FE0F (emoji ✈️) ; initDATA embarqué sync
// - v1.0.18: Archéen TIMELINE embarquée — 🌡️🧮 308.15 K (sync configTimeline v1.4.4+) ; retrait 🌡️📚 (clé jamais lue par le moteur)
// - v1.0.17: FIRST_SEARCH_STEP_CAP_K défaut 0 (désactivé) — plafond 8 K changeait le bassin de convergence (📱 ~21 °C vs ~15,6 °C hérité)
// - v1.0.16: SOLVER.FIRST_SEARCH_STEP_CAP_K (déf. 8 K) dans _solverDefault + TUNING.SOLVER (1er pas Search après Init)
// - v1.0.15: KEYS 🐊 libellé « Éocène » (titre court)
// - initDATA embarqué : DATA['🎚️'].HYSTERESIS (sync fillDataTuningFromBary / scie)
// - CONFIG_COMPUTE.logCo2RadiativeDiagnostic (CO₂ atmosphère + 🧲📛🏭 après pas hyst ; aligné configTimeline)
// - CONFIG_COMPUTE.logIceFractionDiagnostic (aligné configTimeline v1.3.12)
// - 🍰🪩📿 albédo effectif (voile) ; 🧲☀️🔽 = 🧲☀️🎱×(1−🍰🪩📿)
// - KEYS/DESC/FORM 🪩 : 🍰🪩🌋→🍰🪩🎾, 🪩🍰🌋→🪩🍰🎾 (lave / surface magmatique)
// - hysteresis 1 🌡️🧮 290 K (aligné configTimeline v1.3.10 ; graine branche chaude)
// - FINE_TUNING_BOUNDS + TUNING_BIBLIO : groupe HYSTERESIS (preset mer gelée / CO₂ mer, UI sea ice 1–6 K)
// - commentaire HYSTERESIS.searchSign (UI scie_ négatif|positif)
// - hysteresis 1 TIMELINE : ⚖️🏭 1.0e16 (aligné configTimeline.js ; corrigé doublon 2e16 dans ce fichier)
// - TUNING.HYSTERESIS : brutalDeltaT_C, scanCo2MassFactor, maxDichoSteps (scie_hysteresis_search.js v2 scan+dicho)
// - TUNING.HYSTERESIS : convergencePpmMass, warmBranchHint_C, coldBranchHint_C (seuil CO₂ scie_hysteresis_search.js)
// - hysteresis 2: hidden:true (aligné configTimeline / frise verticale epoch-text)
// - co2OceanPartitionInRadiativeConvergence=false (configTimeline) : pompe mer NO-OP sauf activation explicite (anthropique plus tard)
// - Retrait 🌊🏭🧲 des époques TIMELINE ; co2OceanPumpOverride01 défaut TUNING=1 ; eff pompe = jauge co2OceanEffPump01
// - HYSTERESIS CO₂ océan : doc — réglage via jauges page search (HYST SPEED / THRESHOLD, GREY) ; défauts numériques provisoires jusqu’aux tests de convergence
// - TUNING.HYSTERESIS.epsilonT_C / epsilonPpm : arrêt recherche CO₂ (scie_hysteresis_search.js)
// File: API_BILAN/data/alphabet.js - Alphabet des caractères (logos)
// Desc: Définit les caractères (logos) de base et leurs descriptions
// Version 1.0.2
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

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
    SULFATE: '\u2708\uFE0F',  // SO₄ proxy — présentation emoji (U+2708 + VS16), cf. pages UTF-8 DNAvatar
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
    SATELLITE: '🛰', // Satellite : satellite (événement)
    FLUX_CN: '🌑', // Flux sortant : lune noire (rayonnement corps noir sortant)
    TOLERANCE: '🔬', // Tolérance : précision pour le test d'arrêt
    DESERT: '🏜️',   // Désert : plage (utilisé dans albedo breakdown)
    VOLCANO: '🌋',  // Volcan : magma (utilisé dans albedo breakdown)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅',     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
    CLOUD_FORMATION: '☁️', // Potentiel de condensation nuageuse
    COMPUTE: '🧮',  // Compute : sablier (pour les valeurs de convergence)
    GREENHOUSE_FORCING_ALT: '🌴',  // Greenhouse forcing alternatif : palmier
    BOOLEAN: '🔘',  // Boolean : bouton
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
    CORPS_NOIR: '⚫', // Corps noir
    HADEEN: '🔥',   // Hadéen : feu/lave
    ARCHEEN: '🦠',  // Archéen : microbe unicellulaire
    PROTEROZOIC: '🪸', // Protérozoïque (2500–750 Ma) : corail
    HYSTERESIS_1A: 'hysteresis 1a', // Sturtienne (750–720 Ma) — bascule albédo↓
    SNOWBALL_ENTRY: '☃', // Entrée Sturtienne (alias affichage hyst 1a)
    SNOWBALL: '⛄',  // Plein Snowball (720–690 Ma)
    HYSTERESIS_1B: 'hysteresis 1b', // Sortie Marinoen (690–600 Ma) — hyst 1b
    SNOWBALL_EXIT: '⛈', // Sortie Marinoen (alias affichage hyst 1b)
    PALEOZOIC_MARINE: '🪼', // Paléozoïque marin (600–420 Ma)
    PALEOZOIC_LAND: '🍄', // Paléozoïque terrestre (420–280 Ma)
    PERMIAN_TRIASSIC: '💀', // Limite P/T (280–250 Ma)
    MESOZOIC: '🦕', // Mésozoïque : dinosaure sauropode
    CENOZOIC: '🦤', // Cénozoïque (66–50 Ma) : dodo
    PETM_HOUSE: '🐊', // Éocène (50–35 Ma), pic thermique type PETM
    HYSTERESIS_2: 'hysteresis 2', // Eocène-Oligocène (35–33 Ma) — hyst 2
    EOCENE_OLIGOCENE: '🐧', // Eocène-Oligocène (alias affichage hyst 2)
    EOT: '🏔',      // Grande Coupure (33–2 Ma)
    QUATERNARY: '🦣', // Quaternaire (2 Ma–10 ka)
    HOLOCENE: '🛖', // Holocène (10 ka–1800)
    TODAY: '🚂',    // Industriel (1800–2000) : train
    MODERN: '📱',   // Aujourd'hui (2000–2100) : smartphone
    EVENTS: '🕰',   // Événements : horloge
    TRANSITION: '⏩', // Transition : flèche rapide
    DATE: '📅',     // Date : calendrier
    PLANET_RADIUS: '📐', // Rayon de la planète : équerre
    GRAVITY: '🍎',  // Gravité : pomme (gravité)
    MOLAR_MASS_AIR: '🧪', // Masse molaire de l'air : flacon (chimie)
    PRESSURE: '🎈', // Pression : ballon (pression)
    INDEX_EPOCH: '👉', // Index de l'époque : pointeur
    LOGO_EPOCH: '🗿', // Logo/Nom de l'époque : statue
    TRIPLE_POINT: '┴', // Point triple : pont (P,T au point triple)
};

// Logo (emoji) -> image pour affichage des PICTO (boutons, frise).
// ⚠️ charsImages ne touche JAMAIS aux textures Three.js !
// Les textures Three.js (fonds/*.png) : chemin déduit de la date (getPlanetTexturePathFromEpoch) ; liste préload : configOrganigramme.TEXTURES_THREEJS.
const charsImages = {
    '☀️': 'fonts/pics/sun.png',           // Soleil
    //'⚫': 'fonts/pics/corps_noir.png',    // Corps noir
    '🎇': 'fonts/pics/big_impact.png',    // Big impact
    '☄️': 'fonts/pics/ice_meteorite.png', // Météorite de glace
    //'🔥': 'fonts/pics/hadeen.png',           // Feu
};

// ============================================================================
// DESCRIPTIONS DES CARACTÈRES (CHARS_DESC) - Utilise directement les emojis
// ============================================================================
const CHARS_DESC = {
    // Unités
    '📿': 'Cardinal (#)',
    '🍰': 'Proportion ([0,1])',
    '🔘': 'Calculé (Boolean)',
    '📏': 'Longueur (km)',
    '⚖️': 'Masse (kg)',
    '🎈': 'Pression (atm)',
    '🌡️': 't° (K)',
    '🔋': 'Puissance (W)',
    '🔽': 'Réception (+)',
    '🔼': 'Émission (-)',
    '🍎': 'Gravité (m/s²)',
    '🧲': 'Flux (W/m²)',
    '🧪': 'Masse molaire (kg/mol)',
    '┴': 'Point triple (🎈,🌡️)',
    '⚧': 'Phase (Init/Search/Dicho)',
    '☯': 'Direction Search (+/-)',
    // Éléments
    '💧': 'H₂O',
    '🐄': 'CH₄',
    '🏭': 'CO₂',
    '🫁': 'O₂',
    '\u2708\uFE0F': 'SO₄²⁻ (aérosols sulfate)',
    '🧊': 'Glace',
    '⛅': 'Nuages',
    '🌊': 'Océan',
    '🌋': 'Volcan (événement)',
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
    '💫': 'TicTime',
    '🛢': 'Scénario émissions',
    '☄️': 'Météorite de glace',
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
    '⚫': 'Corps noir',
    '🔥': 'Hadéen',
    '🦠': 'Archéen',
    '🪸': 'Protérozoïque',
    '☃': 'Sturtienne',
    '⛄': 'Plein Snowball',
    '⛈': 'Sortie Marinoen',
    '🪼': 'Paléozoïque marin',
    '🍄': 'Paléozoïque terrestre',
    '💀': 'Limite P/T',
    '🦕': 'Mésozoïque',
    '🦤': 'Cénozoïque',
    '🐊': 'Éocène',
    '🐧': 'Eocène-Oligocène',
    'hysteresis 1a': 'Sturtienne',
    'hysteresis 1b': 'Sortie Marinoen',
    'hysteresis 2': 'Eocène-Oligocène',
    '🏔': 'Grande Coupure',
    '🦣': 'Quaternaire',
    '🛖': 'Holocène',
    '🚂': 'Industriel',
    '📱': 'Aujourd\'hui',
    '🕰': 'Événements',
    '⏩': 'Transition',
    '📅': 'Date (Ma)',
    '📐': 'Rayon planète',
    '🍎': 'Gravité (m/s²)',
    '┴': 'Point triple (🎈,🌡️)',
};

// ============================================================================
// FONCTION : CRÉER L'ALPHABET (LEXIQUE)
// ============================================================================

function createAlphabetHtml() {
    if (typeof CHARS === 'undefined') console.error('[createAlphabet] CHARS non défini');
    // Colonne 1 : Unités
    const charsCol1 = [
        'CARDINAL', 'PROPORTION', 'BOOLEAN', 'METER', 'WEIGHT', 'PRESSURE', 'TEMP', 'POWER', 'FLUX_IN', 'FLUX_OUT', 'GRAVITY', 'ENERGY_FLUX', 'MOLAR_MASS_AIR', 'ALEMBIC', 'TRIPLE_POINT'
    ];
    
    // Colonne 2 : Éléments
    const charsCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'N2', 'SULFATE', 'ICE', 'CLOUD', 'OCEAN', 'VOLCANO', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const charsCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'DELTA', 'TOLERANCE', 'DIRECTION', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN', 'MAX_VAPOR', 'CLOUD_FORMATION'
    ];
    
    // Colonne 4 : Événements
    const charsCol4 = [
        'DATE', 'TIC_TIME', 'EVENTS', 'TRANSITION', 'BIG_IMPACT', 'METEORITE_COUNT', 'FLUX_START', 'FLUX_END', 'PLANET_RADIUS', 'TROPOPAUSE', 'ALTITUDE', 'SATELLITE', 'INDEX_EPOCH'
    ];
    
    // Colonne 5 : Époques et autres logos
    const charsCol5 = [
        'EPOCH', 'INDEX_EPOCH', 'LOGO_EPOCH', 'CORPS_NOIR', 'HADEEN', 'ARCHEEN', 'PROTEROZOIC', 'MESOZOIC', 'PALEOZOIC', 'CENOZOIC', 'PETM_HOUSE', 'HYSTERESIS_1', 'PRELUDE_ICE', 'EOT', 'QUATERNARY', 'TODAY', 'MODERN'
    ];
    
    // Descriptions personnalisées pour certains caractères
    const customDescriptions = {
        'TIC_TIME': 'TicTime',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec caractère et description
    // Réf = emoji (toujours en premier, utilisé dans calculs/code). Image = affichage optionnel entre parenthèses.
    const createCharDiv = (charName) => {
        const char = CHARS[charName];
        const description = CHARS_DESC[char] || charName;
        
        if (!char || char === '') return '';
        
        const hasImage = charsImages[char] && (charsImages[char].endsWith('.png') || charsImages[char].endsWith('.svg') || charsImages[char].endsWith('.jpg'));
        const imgInParens = hasImage ? ' (' + getDisplayChar(char) + ')' : '';
        
        return `<div class="legend-item"><span class="${logoClass}">${char}</span><span class="description">${description}${imgInParens}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = charsCol1.map(createCharDiv).filter(div => div !== '').join('');
    const col2_filtered = charsCol2.map(createCharDiv).filter(div => div !== '').join('');
    const col3_filtered = charsCol3.map(createCharDiv).filter(div => div !== '').join('');
    const col4_filtered = charsCol4.map(createCharDiv).filter(div => div !== '').join('');
    const col5_filtered = charsCol5.map(createCharDiv).filter(div => div !== '').join('');
    
    return `
        <div class="legend-grid">
            <div class="legend-column">
                <h3 class="legend-title">Unités</h3>
                ${col1_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Éléments</h3>
                ${col2_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Calculs</h3>
                ${col3_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Événements</h3>
                ${col4_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Époques</h3>
                ${col5_filtered}
            </div>
        </div>
    `;
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

//Récupère un logo (emoji) depuis son nom
function getLogo(name) {
    return CHARS[name] || '';
}

//Combine plusieurs noms de logos en une seule clé emoji
function getLogoKey(...names) {
    return names.map(name => CHARS[name] || '').join('');
}

// Résout le chemin image (depuis static/compute/ -> ../../fonts/...)
function resolveImagePath(path) {
    if (!path) return path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
    if (typeof window.getImagePath === 'function') return window.getImagePath(path);
    // Fallback : alphabet.html est dans static/compute/, fonts/ à la racine
    const base = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
    const inCompute = base.includes('/static/compute/') || base.includes('static\\compute\\') || base.endsWith('alphabet.html');
    if (inCompute) {
        return '../..' + (path.startsWith('/') ? path : '/' + path);
    }
    return path;
}

// Mapping DATA key -> affichage (image path ou emoji). Alt = ref (CHARS).
function getDisplayChar(dataKey) {
    const imgPath = charsImages[dataKey];
    if (imgPath && (imgPath.endsWith('.png') || imgPath.endsWith('.svg') || imgPath.endsWith('.jpg'))) {
        const src = resolveImagePath(imgPath);
        const alt = CHARS_DESC[dataKey] || dataKey;
        return '<img src="' + src + '" alt="' + alt + '" style="height:1.4em;vertical-align:middle">';
    }
    return dataKey;
}

// Retourne l'URL src pour afficher un logo en image (events, timeline, etc.).
// Source unique : charsImages. Retourne null si pas d'image.
function getLogoImageSrc(emoji) {
    const path = charsImages[emoji];
    if (!path || !(path.endsWith('.png') || path.endsWith('.svg') || path.endsWith('.jpg'))) return null;
    return resolveImagePath(path);
}

// Retourne l'affichage pour un picto : image si dans charsImages, sinon le picto.
// Utilisé pour les boutons (frise, etc.) - transparent si on ajoute des images dans charsImages.
// Retourne { type: 'image', value: src } ou { type: 'text', value: picto }
function getDisplayForPicto(picto) {
    const src = getLogoImageSrc(picto);
    if (src) return { type: 'image', value: src };
    return { type: 'text', value: picto };
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

window.CHARS = CHARS;
window.LOGOS = CHARS; // Alias pour compatibilité (configOrganigramme, organigramme)
window.CHARS_DESC = CHARS_DESC;
window.charsImages = charsImages;
window.createAlphabetHtml = createAlphabetHtml;
window.getLogo = getLogo;
window.getLogoKey = getLogoKey;
window.getDisplayChar = getDisplayChar;
window.getLogoImageSrc = getLogoImageSrc;
window.getDisplayForPicto = getDisplayForPicto;
// Init graphique : remplir [data-char] depuis CHARS (visu, etc.)
window.initCharsForDisplay = function () {
    if (!window.CHARS) return;
    document.querySelectorAll('[data-char]').forEach(function (el) {
        var key = el.getAttribute('data-char');
        if (key && window.CHARS[key]) el.textContent = window.CHARS[key];
    });
};

// File: API_BILAN/data/dico.js - Dictionnaire des clés (combinaisons de caractères)
// Desc: Définit toutes les clés (combinaisons de caractères) et leurs descriptions
// Version 1.0.3
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1: KEYS/DESC 📛 + 🍰📛⛅ (EDS nuages), DESC 🧲📛/🍰📛❀
// - v1.0.2: FORM sync with runtime code for 🎈 (dry+vapor mass) and 🍰🪩⛅ (cloud optical proxy)
// - v1.0.3: add sulfate keys in DATA (⚖️✈, 🍰🫧✈) + CCN formula mention sulfate term
// - v1.0.4: DATA['🎚️'] init ici (source unique) ; baryByGroup depuis CONFIG_COMPUTE.baryByGroupDefault, DATA seule ref
// - v1.0.5: SOLVER init avec TOL_MIN_WM2/MAX_SEARCH_STEP_K/etc. (éviter tol=NaN si compute avant fillDataTuningFromBary)
// - v1.0.6: init DATA déplacée dans initDATA.js (chargé après dico.js) ; KEYS exposé pour initDATA

// ============================================================================
// OBJET KEYS (toutes les clés regroupées) - Utilise directement les emojis
// ============================================================================
const KEYS = {
    // États activés
    '🔘': ['🔘💧📛', '🔘🐄📛', '🔘🏭📛', '🔘🪩', '🔘🎞'],
    // Configuration de date / Événements
    '📜': ['🌡️🧮', '📿☄️', '🔺⚖️💧☄️', '🔺🌡️💫', '🔺🧲🌕💫', '🔺🍰⚽', '🔘🕰', '🧲🔬'],
    // Date Époque
    '📅': ['🌡️🧮','📿💫', '🔺⏳'],
    // Masses
    '⚖️': ['⚖️💧', '⚖️🫧', '⚖️🏭', '⚖️🐄', '⚖️🫁', '⚖️✈', '⚖️💨'],
    // Composition atmosphérique
    '🫧': ['🎈', '🧪', '📏🫧🧿', '📏🫧🛩', '🍰🫧🏭', '🍰🫧🐄', '🍰🫧🫁', '🍰🫧✈', '🍰🫧💨', '🍰🫧📿🌈', '🍰🫧🏭🌈', '🍰🫧💧🌈', '🍰🫧🐄🌈', '🍰💭'],
    // Cycle de l'eau
    '💧': ['🍰💧🧊', '🍰💧🌊', '🍰🧮🌧', '🍰🫧💧', '🍰🫧☔', '🍰⚖️💦', '💭☔', '⏳☔'],
    // Albédo
    '🪩': ['🍰🪩📿', '🍰🪩🎾', '🍰🪩🏜️', '🍰🪩🌳', '🍰🪩🌊', '🍰🪩🧊', '🍰🪩⛅', '🍰🪩🌍', '🍰⚽', '🍰🪩⚽', '☁️'],
    // Flux (W/m²) ; ΔF = convention affichage (climate.js), pas calcul T
    '🧲': ['🧲☀️🔽', '🧲🌕🔽', '🧲🌑🔼', '🧲🌈🔼', '🧲🪩🔼', '🔺🧲'],
    // Convergence
    '🧮': ['🧮🌡️', '🧮⚧', '🧮☯', '🧲🔬', '🔬🌈', '🔬🫧', '🧮🔄', '🧮🔄☀️', '🧮🔄🌊'],
    // Soleil
    '☀️': ['🧲☀️', '🧲☀️🎱', '🔋☀️'],
    // Noyau
    '🌕': ['🧲🌕', '🔋🌕'],
    // EDS breakdown (🧲📛, 🍰📛❀, 🧲📛❀) ; 🔺📛❀ = diagnostic ΔF (convention affichage, pas calcul T)
    '📛': ['🧲📛', '🧲📛🏭', '🧲📛💧', '🧲📛🐄', '🧲📛⛅', '🍰📛🏭', '🍰📛💧', '🍰📛🐄', '🍰📛⛅', '🔺📛💧', '🔺📛🏭', '🔺📛🐄', '🔺📿📛'],
    // Géologie (Surfaces géologiques - Couche A)
    '🗻': ['🍰🗻🌊', '🍰🗻🏔', '🍰🗻🌍'],
    // Constantes physiques
    '💎': ['🎈┴💧', '🌡️┴💧']
};

// ============================================================================
// OBJET DESC (toutes les descriptions) - Structure hiérarchique (2 niveaux)
// Utilise directement les emojis
// ============================================================================
const DESC = {
    '🔘': {
        '🔘💧📛': 'H₂O EDS on/off',
        '🔘🐄📛': 'CH₄ EDS on/off',
        '🔘🏭📛': 'CO₂ EDS on/off',
        '🔘🪩': 'Albedo on/off',
        '🔘🎞': 'Animation on/off',
    },
    '📜': {
        '🌡️🧮': 't° attendu (t° config)',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧☄️': 'Masse H₂O / météore',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '🔺🧲🌕💫': 'Delta Geoth / ticTime',
        '🔘🕰': 'Bouton cliqué (☄️ ou 💫)',
        '🔺🍰⚽': 'Cumul voile SW stratosphérique (fraction 0–1, événements 🌋)',
        '🧲🔬': 'Précision Flux',
    },
    '📅': {
        '🌡️🧮': 't° attendue',
        '📿💫': 'Nombre de ticTime',
        '🔺⏳': 'Durée équilibre précipitation (s)',
    },
    '☀️': {
        '🧲☀️': 'Flux solaire à 1 UA',
        '🧲☀️🎱': 'Flux moyen sphérique',
        '🔋☀️': 'Puissance totale du soleil',
    },
    '🪩': {
        '🍰🪩📿': 'Albédo planétaire effectif (surfaces + nuages + voile SW 🍰⚽)',
        '🍰🪩🎾': 'Lave (surface magmatique)',
        '🍰🪩🏜️': 'Désert',
        '🍰🪩🌳': 'Forêt',
        '🍰🪩🌊': 'Océan',
        '🍰🪩🧊': 'Glace',
        '🍰🪩⛅': 'Nuages',
        '🍰🪩🌍': 'Continents',
        '🍰⚽': 'Voile SW : fraction d’obstruction (0–1) du flux absorbé en surface après albédo (EPOCH+📜+CONFIG)',
        '🍰🪩⚽': 'Transmission après A_geo seul = 1 − 🍰⚽ (voile fusionné dans 🍰🪩📿)',
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
        '🍰🫧✈': 'SO₄²⁻ (✈) - proxy CCN',
        '🍰🫧💨': '!N₂',
        '🍰🫧❀🌈': 'Cap.Rad.IR<sub>❀∈{🏭, 🐄, 💧}</sub>',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈)<sub>❀∈{🏭,🐄,💧}</sub>',
        '🍰🫧🏭🌈': '!Capacité radiative IR de CO₂',
        '🍰🫧💧🌈': 'Cap.Rad.IR H₂O atm.',
        '🍰🫧🐄🌈': '!Capacité radiative IR de CH₄',
        '🍰💭': 'CCN - Eff.Cond nuageuse [0.3,1.0]',
    },
    '⚖️': {
        '⚖️❀': 'Masse<sub>❀∈{🏭, 🐄, 🫁, 💨}</sub> (+ ⚖️✈ proxy sulfate)',
        '⚖️💧': 'Masse H₂O totale',
        '⚖️🫧': 'Masse atmosphère sec',
        '⚖️🏭': '!Masse CO₂',
        '⚖️🐄': '!Masse CH₄',
        '⚖️🫁': '!Masse O₂ (🫁) [clé historique 🫁]',
        '⚖️✈': 'Masse SO₄²⁻ (✈) [proxy CCN]',
        '⚖️💨': '!Masse N₂',
    },
    '💧': {
        '🍰💧🧊': 'Glace',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': 'Fraction de vapeur max',
        '🍰🫧💧': 'Fraction massique de vapeur',
        '🍰🫧☔': 'Humidité relative moyenne [0,1]',
        '☁️': 'Index de formation nuageuse [0,1]',
        '💭☔': 'Seuil critique précipitations [0.7,0.9]',
        '⏳☔': '1/τ_global (s⁻¹), τ ~10 j litt.',
        '🍰⚖️💦': 'Taux précipitation (kg/m²/s), P=W/τ',
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
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
        '🧮🔄☀️': 'Cycle radiatif (crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=init, 1+=après crossing)',
    },
    '🌕': {
        '🧲🌕': 'Flux géothermique',
        '🔋🌕': 'Puissance du noyau',
    },
    '📛': {
        '🧲📛': 'EDS (effet de serre) W/m² = 🧲🌑🔼 − 🧲🌈🔼. OLR = 🧲🌈🔼 = flux IR sortant au sommet ; EDS = flux « bloqué » par l’atmosphère. EDS insuffisant ⟺ OLR trop élevé (même T surface).',
        '🧲📛🏭': 'EDS CO₂ W/m² (part retenue par CO₂)',
        '🧲📛💧': 'EDS H₂O W/m² (part retenue par vapeur)',
        '🧲📛🐄': 'EDS CH₄ W/m² (part retenue par CH₄)',
        '🧲📛⛅': 'EDS nuages W/m² (part retenue par nuages)',
        '🍰📛🏭': 'Part EDS CO₂ [0,1]',
        '🍰📛💧': 'Part EDS H₂O (vapeur) [0,1]',
        '🍰📛🐄': 'Part EDS CH₄ [0,1]',
        '🍰📛⛅': 'Part EDS nuages [0,1]',
        '🔺📛💧': 'ΔF H₂O affichage (W/m², convention)',
        '🔺📛🏭': 'ΔF CO₂ affichage (W/m², convention)',
        '🔺📛🐄': 'ΔF CH₄ affichage (W/m², convention)',
        '🔺📿📛': 'ΔF total affichage (W/m², convention)',
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)',
    }
};

// ============================================================================
// OBJET FORM (formules de calcul) - Structure hiérarchique (2 niveaux)
// ============================================================================
const FORM = {
    '🧲': {
        '🧲☀️🔽': '🧲☀️🎱 × (1 - 🍰🪩📿) — 🍰🪩📿 inclut voile (1−(1−A_geo)(1−🍰⚽))',
        '🧲🌕🔽': 'Flux géothermique (constant)',
        '🧲🌑🔼': 'σ × T⁴ = Flux émis par la surface (corps noir théorique à température T). Formule: 🧲🌑🔼 = σT⁴ où σ = 5.670374419e-8 W/(m²·K⁴). Pour T=303.5K: ≈501 W/m². ⚠️ Ce n\'est PAS le flux qui sort au sommet (c\'est 🧲🌈🔼). ⚠️ Ne pas comparer directement à 🧲☀️🔽+🧲🌕🔽 car l\'effet de serre fait que la surface émet plus que ce qui sort.',
        '🧲🌈🔼': 'Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = Aire sous courbe spectrale réelle (émission au sommet atmosphère). Δλ = (λ_max−λ_min)/(N−1) = pas réel de la grille (effective_delta_lambda), pas 0.1 μm fixe. Transfert radiatif: τ_λ(z), transmission exp(-τ), émission (1-exp(-τ))×π×B_λ(T). Intégration: 🧲🌈🔼 = Σ[λ] upward_flux[z_max][λ]. En équilibre: 🧲🌈🔼 ≈ 🧲☀️🔽+🧲🌕🔽',
        '🧲🪩🔼': '🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿 (non absorbé en surface, dont voile SW)',
        '🔺🧲': '🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼 = déséquilibre flux (entrant - sortant). Δ>0→réchauffer, Δ<0→refroidir. En équilibre: 🔺🧲 ≈ 0',
        '_explication_equilibre': 'Corps noir (70% soleil): 🧲☀️🔽 devrait être ~238 W/m² (pas 341.50) → équilibre à T≈255K',
        '_temperature_equilibre_corps_noir': 'T_équilibre = (S/4σ)^(1/4) = (952/4σ)^(1/4) ≈ 255K (-18°C) pour corps noir pur (S=70% actuel)',
        '_bug_flux_solaire': 'BUG: Si 🧲☀️🔽=341.50 W/m² au lieu de 238 W/m² → code utilise soleil actuel (100%) au lieu de 70%',
        '_effet_serre': 'Avec EDS: surface émet plus (T_surface > T_effective) mais atmosphère bloque → 🧲🌈🔼 < 🧲🌑🔼',
        '_evolution_soleil': 'Gough (1981): L(t)=L☉/(1+0.4×t_ago/4.57). -4Ga=74.1%, -2.5Ga=82%, -0.5Ga=95.8%',
        '_faint_young_sun': 'Paradoxe: Soleil 30% moins lumineux mais Terre pas gelée → EDS plus fort (CO₂, CH₄) compensait',
        '_flux_entrant': '🧲☀️🔽 + 🧲🌕🔽 = Flux entrant total',
        '_formule_planck': 'B_λ(T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1)',
        '_formule_stefan': 'F = σT⁴ ≈ 239.7 W/m² pour T=255K (intégration complète 0→∞)',
        '_formule_gough': 'L(t) = L☉/(1 + 0.4×t/4.57) — Gough (1981) Solar Physics 74:21. L☉=3.828e26 W (IAU 2015), TSI=1361 W/m² (Kopp & Lean 2011). 🔒 Hyperbolique, pas linéaire.',
        '_note_spectrale': 'Calcul spectral: intégration sur λ ∈ [0.1μm, 100μm] avec Δλ=0.1μm'
    },
    '🧮': {
        '🧮🌡️': 'T° courante (K)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction Search (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🫧': 'Résolution atmosphérique',
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
        '🧮🔄☀️': 'Cycle radiatif (nombre de crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=après init, 1+=après crossing)',
        '🧮🌡️🚩': 'T° initiale (T0)'
    },
    '☀️': {
        '🧲☀️': '🔋☀️ / (4π × (1 UA)²) = Flux solaire à 1 UA (W/m²)',
        '🧲☀️🎱': '🧲☀️ / 4 (Surf.Éclairée/Surf.Tot = πR²/4πR² = 1/4)',
        '🔋☀️': 'Puissance totale du soleil (W)'
    },
    '🌕': {
        '🧲🌕': '🔋🌕 / (4π × R²) = Flux géothermique (W/m²), où R = rayon planète (m)',
        '🔋🌕': 'Puissance totale du noyau (W)'
    },
    '🫧': {
        '🎈': 'P = ((⚖️🫧 + m_vapeur) × 🍎) / (4π×(📐×1000)²) / CONV.STANDARD_ATMOSPHERE_PA, avec m_vapeur = ⚖️🫧×🍰🫧💧/(1-🍰🫧💧) - Pression atmosphérique (air sec + vapeur)',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'H × ln(P₀ / P_limit) où H = RT/(Mg) [von Kármán] - Ligne de Kármán (altitude où P = 0.01 Pa)',
        '📏🫧🛩': 'RT/(Mg) [équation hydrostatique] - Tropopause (échelle de hauteur atmosphérique)',
        '🍰🫧❀': 'Proportion radiative EDS - ∀ ❀ ∈ {🏭, 🐄, 🫁, 💨}',
        '🍰🫧❀🌈': 'Capacité radiative IR de ❀ - ∀ ❀ ∈ {🏭, 🐄, 💧}',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈) - ∀ ❀ ∈ {🏭, 🐄, 💧} (pour normalisation)',
        '🍰🫧✈': '⚖️✈ / ⚖️🫧 (proxy sulfate pour microphysique nuageuse, hors normalisation air sec)',
        '🍰💭': 'clamp(0.4 + 0.5×(⚖️🫁/1.08e18 + ⚖️🐄/5.2e12) + 0.1×(⚖️✈/1.0e14), 0.3, 1.0) - CCN - Eff.Cond nuageuse [0.3,1.0]'
    },
    '💧': {
        '🍰💧🧊': 'Si T < ❄️ alors toute l\'eau restante (après vapeur) est glace, sinon glace polaire (10% à 0°C → 0% à 20°C) - ❄️ = 271.15K - (P-1)×1.0',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': '🎈🌧 / 🎈<br>🎈🌧 = 🎈┴💧 × exp(L_v/R_v × (1/🌡️┴💧 - 1/🧮🌡️)) [Clausius-Clapeyron]<br>🎈┴💧 = 611.2 Pa, 🌡️┴💧 = 273.15 K,<br>L_v = 2.5e6 J/kg (chaleur latente vaporisation H2O), R_v = 461.5 J/(kg·K) = R/M_H2O, 🧮🌡️ = température actuelle',
        '🍰🫧💧': 'max(0, min(🍰🧮🌧 × (CONST.M_H2O / 🧪), ⚖️💧 / ⚖️🫧) - (🍰⚖️💦 × (4 × π × (📐 × 1000)²) × 🔺⏳) / ⚖️🫧) - Fraction massique de vapeur',
        '🍰🫧☔': 'clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1) [Clausius-Clapeyron] - Humidité relative globale (q / q_sat en fraction massique)',
        '☁️': '(1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭 - Schéma Sundqvist classique (couverture nuageuse à partir de RH) × (🍰💭) – nuages plus minces = optiquement moins actifs',
        '💭☔': 'clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95) - Seuil critique précipitations [0.7,0.9]',
        '⏳☔': '1/τ_global (s⁻¹), τ_global = 10 j (litt. 8–10 j, Nature Rev. Earth Env. 2021; HESS 2017)',
        '🍰⚖️💦': 'W/τ_global × ramp(RH−💭☔, 0.2) quand RH > 💭☔ ; W = masse_vapeur_par_m² (kg/m²) ; P = W/τ (litt. ~2,7 mm/j GPCP) - Taux précipitation (kg/m²/s)'
    },
    '📅': {
        '🔺⏳': '86400 s (1 jour) - Durée équilibre précipitation'
    },
    '🪩': {
        '🍰🪩📿': '1 − (1−A_geo)(1−🍰⚽) ; A_geo = pondération surfaces + contributions glace/nuages (runtime)',
        '🍰🪩🎾': 'volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)',
        '🍰🪩🌊': '(🍰💧🌊 × ⚖️💧 / CONST.RHO_WATER) / (📏🌊 × 1000) / (4 × π × (📐 × 1000)²)',
        '🍰🪩🌳': 'min(🍰🪩🌍_, 🗻.🍰🗻🌍 × clamp((🧮🌡️_C - 0)/30, 0, 1) × clamp((🍰🫧☔ - 0.5)/0.3, 0, 1) × clamp((1 - ☁️), 0, 1) × 0.6) où 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊 - Forêts dépendent de température (optimum 0-30°C), humidité relative (RH > 0.5-0.8) et nuages (moins de forêts si trop de nuages)',
        '🍰🪩🏜️': '🍰🪩🌍_ × (base_aridité + variabilité_régionale) où base_aridité = max(0, 1 - min(1, P_ann/1000)) × max(0, 1 - min(1, 🍰🫧☔/0.6)) et variabilité_régionale = 0.6 × max(0.5, min(1, (🧮🌡️_C-5)/10)) × max(0.5, 1-🍰🫧☔×0.6) - Déserts basés sur précipitations (P_ann < 1000 mm/an) et humidité relative (RH < 0.6) avec variabilité régionale',
        '🍰🪩🌍': 'land_coverage = L - 🍰🪩🌳 - 🍰🪩🏜️ où L = terre libre de glace. Absorbe automatiquement : steppes, prairies, toundras, montagnes (albedo ~0.18)',
        '🍰🪩🧊': 'min(🗻.🍰🗻🏔, EARTH.ICE_FORMULA_MAX_FRACTION × (T_NO_POLAR_ICE_K - 🧮🌡️) / T_NO_POLAR_ICE_RANGE_K) - Glace polaire (0% si T > T_NO_POLAR_ICE_K)',
        '🍰🪩⛅': 'cloud_fraction = clamp((0.19 + 0.11×☁️) × cloud_optical_efficiency, 0, 0.75), avec cloud_optical_efficiency = (1.10 + 0.45×(ccn_ratio-1)) × pressure_factor × oxidation_soft_factor × temp_factor',
        '_contribution_glace': 'contribution_glace = (🪩🍰🧊 - albedo_base) × 🍰💧🧊 × 0.5',
        '_contribution_nuages': 'contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅',
        '🍰⚽': 'syncStratosphericVeil01 : clamp(0, EPOCH[🍰⚽]+📜[🔺🍰⚽]+CONFIG.hystStratosphericVeilExtra01, 0.95) — obstruction ; 🌋 → 📜[🔺🍰⚽]',
        '🍰🪩⚽': '1 − 🍰⚽ (transmission SW après voile)'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)'
    },
    '💎': {
        '🎈┴💧': 'Pression au point triple de l\'eau (611.2 Pa)',
        '🌡️┴💧': 'Température au point triple de l\'eau (273.15 K, 0°C)'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique) = f(époque) : Hadéen=1.0, Archéen=0.80, Moderne=0.71',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles) = f(époque) : Hadéen=0.0, Archéen=0.05, Moderne=0.09',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents) = f(époque) : Hadéen=0.0, Archéen=0.15, Moderne=0.20',
        '_note': '🗻 = Géologie (Couche A) : surfaces fixes déterminées par la géologie/relief, indépendantes des stocks d\'eau'
    },
    '⚖️': {
        '⚖️❀': 'Masse ❀ - ∀ ❀ ∈ {🏭, 🐄, 🫁, 💨} (+ ⚖️✈ proxy sulfate)',
        '⚖️💧': 'Masse H2O totale',
        '⚖️🫧': 'Masse atmosphère sec = ⚖️🏭 + ⚖️🐄 + ⚖️🫁 + ⚖️💨 (sans vapeur d\'eau ; ⚖️✈ = proxy CCN séparé)'
    }
};


// ============================================================================
// FONCTION : CRÉER LE DICO (utilise DATA directement, pas de paramètres)
// ============================================================================
function createDicoHtml() {
    if (typeof window === 'undefined') {
        console.error('[createDico] window non défini');
        return '';
    }
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const DESC = window.DESC;
    // KEYS est défini localement dans ce fichier
    
    // Fonction helper pour créer une entrée
    const createDicoEntry = (key, desc) => {
        return `<div class="legend-item"><span class="logo">${key}</span><span class="description">${desc}</span></div>`;
    };
    
    // Catégories avec leurs logos et noms (utilise directement les emojis)
    const categories = [
        {
            logo: '🔘',
            name: 'États activés'
        },
        {
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '🌕',
            name: 'Noyau'
        },
        {
            logo: '☀️',
            name: 'Soleil'
        },
        {
            logo: '🪩',
            name: 'Albédo'
        },
        {
            logo: '⚖️',
            name: 'Masses'
        },
        {
            logo: '🫧',
            name: 'Atmosphère'
        },
        {
            logo: '💧',
            name: 'Cycle de l\'eau'
        },
        {
            logo: '🧮',
            name: 'Convergence'
        },
        {
            logo: '🧲',
            name: 'Flux (W/m²)'
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        // 🔒 CORRECTION : Parcourir DESC directement, pas seulement KEYS
        // Cela permet d'afficher les clés mathématiques (avec ❀) qui sont dans DESC mais pas dans KEYS
        if (!DESC[category.logo]) return '';
        
        // Récupérer toutes les clés depuis DESC (source de vérité pour l'affichage)
        const descKeys = Object.keys(DESC[category.logo]);
        
        const items = descKeys
            .map(fullKey => {
                const desc = DESC[category.logo][fullKey];
                // Ignorer les variables dont la description commence par "!" (variables internes aux calculs)
                if (!desc || desc.startsWith('!')) return '';
                return createDicoEntry(fullKey, desc);
            })
            .filter(item => item !== '') // Retirer les entrées vides
            .join('');
        
        return `
            <h3 class="legend-title">${category.logo} ${category.name}</h3>
            ${items}
        `;
    });
    
    // Organiser en colonnes (répartir les 11 catégories en 5 colonnes)
    // Répartition équilibrée : 3, 2, 2, 2, 2 (total = 11)
    const col1 = categoryHTMLs.slice(0, 3).join('');
    const col2 = categoryHTMLs.slice(3, 6).join('');
    const col3 = categoryHTMLs.slice(6, 8).join('');
    const col4 = categoryHTMLs.slice(8, 10).join('');
    const col5 = categoryHTMLs.slice(10, 11).join('');
    
    return `
        <div class="legend-grid">
            <div class="legend-column">
                ${col1}
            </div>
            <div class="legend-column">
                ${col2}
            </div>
            <div class="legend-column">
                ${col3}
            </div>
            <div class="legend-column">
                ${col4}
            </div>
            <div class="legend-column">
                ${col5}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE (DESC, FORM, createDicoHtml ; KEYS pour initDATA.js ; DATA par initDATA.js)
// ============================================================================
window.KEYS = KEYS;
window.DESC = DESC;
window.FORM = FORM;
window.createDicoHtml = createDicoHtml;
// File: API_BILAN/data/initDATA.js - Initialisation de l'objet DATA
// Desc: Crée DATA depuis KEYS (dico.js) et 🎚️ ; chargé après dico.js. Source unique d'init.
// Version 1.0.0
// Date: [February 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: extraction init DATA depuis dico.js (KEYS → DATA, puis 🎚️)

(function () {
    'use strict';
    var KEYS = window.KEYS;
    var DATA = {};
    var categoryKey, category, keysArray, fullKey;
    for (categoryKey in KEYS) {
        category = KEYS[categoryKey];
        DATA[categoryKey] = {};
        keysArray = Array.isArray(category) ? category : Object.values(category);
        for (fullKey of keysArray) {
            if (fullKey.startsWith('🔘')) {
                DATA[categoryKey][fullKey] = false;
            } else if (fullKey.includes('⚧')) {
                DATA[categoryKey][fullKey] = '';
            } else if (fullKey.includes('☯')) {
                DATA[categoryKey][fullKey] = 0;
            } else if (fullKey === '🔺🧲🌕💫') {
                DATA[categoryKey][fullKey] = { '▶': 0, '◀': 0 };
            } else {
                DATA[categoryKey][fullKey] = 0.0;
            }
        }
    }
    var _baryDefault = { CLOUD_SW: 65, SCIENCE: 65, SOLVER: 100, HYSTERESIS: 100 };
    // Jauge unique ATM : même % CLOUD_SW et SCIENCE. SOLVER 100 % = max fine_tuning_bounds solveur.
    var _solverDefault = { TOL_MIN_WM2: 0.10, MAX_SEARCH_STEP_K: 140, MAX_SEARCH_STEP_LARGE_K: 200, LARGE_DELTA_FACTOR: 16, DELTA_T_ACCELERATION_DAYS: 10, FIRST_SEARCH_STEP_CAP_K: 0 };  // 10 j (litt. 8–10 j)
    // 100% = valeurs max fine_tuning_bounds (CLOUD_SW + SCIENCE) pour cohérence visu sans scie => 16.4°C 2025
    var _cloudSwDefault = {
        CCN_BASE: 0.15, CCN_O2_WEIGHT: 0.85, BIOMASS_GAIN: 4.0,
        ANTHRO_RISE_START_YEAR: 1900, ANTHRO_RISE_WINDOW_YEARS: 80, ANTHRO_RISE_MAX: 0.25,
        ANTHRO_DECAY_START_YEAR: 1980, ANTHRO_DECAY_WINDOW_YEARS: 40, ANTHRO_DECAY_MAX: 0.15,
        SULFATE_BOOST_SCALE: 700, SULFATE_BOOST_MAX: 0.45,
        MODERN_REF_O2: 0.21, MODERN_REF_FOREST: 0.03,
        PRESSURE_FACTOR_MAX: 1.2, OXIDATION_BASE: 0.3, OXIDATION_O2_GAIN: 4.0,
        TEMP_FACTOR_MIN: 0.6, TEMP_FACTOR_MAX: 1.3, TEMP_FACTOR_REF_K: 294,
        OPTICAL_EFF_BASE: 1.20, OPTICAL_EFF_CCN_GAIN: 0.60,
        OXIDATION_SOFT_BASE: 0.85, OXIDATION_SOFT_GAIN: 0.15,
        CLOUD_FRACTION_BASE: 0.23, CLOUD_FRACTION_INDEX_GAIN: 0.14, CLOUD_FRACTION_MAX: 0.75
    };
    var _hystDefaultInit = {
        seaIceTransitionRangeK: 2.2,
        seaIceStrength01: 1,
        iceImpactFactor01: 0.7,
        co2OceanEffPump01: 0.1
    };
    // Aligné FINE_TUNING_BOUNDS groupe RADIATIVE (default = bary SCIENCE 100 % = valeur max côté min>max)
    var _radiativeDefaultInit = {
        H2O_EDS_SCALE: 0.80  // bary SCIENCE 50 % (interp. 1.00 → 0.60) ; aligné initDATA.js
    };
    DATA['🎚️'] = {
        baryByGroup: { CLOUD_SW: _baryDefault.CLOUD_SW, SCIENCE: _baryDefault.SCIENCE, SOLVER: _baryDefault.SOLVER, HYSTERESIS: _baryDefault.HYSTERESIS },
        CLOUD_SW: _cloudSwDefault,
        SOLVER: { TOL_MIN_WM2: _solverDefault.TOL_MIN_WM2, MAX_SEARCH_STEP_K: _solverDefault.MAX_SEARCH_STEP_K, MAX_SEARCH_STEP_LARGE_K: _solverDefault.MAX_SEARCH_STEP_LARGE_K, LARGE_DELTA_FACTOR: _solverDefault.LARGE_DELTA_FACTOR, DELTA_T_ACCELERATION_DAYS: _solverDefault.DELTA_T_ACCELERATION_DAYS, FIRST_SEARCH_STEP_CAP_K: _solverDefault.FIRST_SEARCH_STEP_CAP_K },
        HYSTERESIS: _hystDefaultInit,
        RADIATIVE: _radiativeDefaultInit
    };
    window.DATA = DATA;
})();
// File: API_BILAN/config/model_tuning.js - Parametres de fine-tuning du modele
// Desc: En francais, dans l'architecture, je suis la source unique des coefficients empiriques/calibres.
// Version 1.0.0
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: extraction des coefficients calibres cloud SW + solveur numerique depuis calculations_albedo.js/configTimeline.js

window.TUNING = window.TUNING || {};

// Parametres calibres pour la couverture nuageuse SW (proxy CCN + efficacite optique).
window.TUNING.CLOUD_SW = {
    CCN_BASE: 0.15,
    CCN_O2_WEIGHT: 0.85,
    BIOMASS_GAIN: 4.0,
    ANTHRO_RISE_START_YEAR: 1900,
    ANTHRO_RISE_WINDOW_YEARS: 80,
    ANTHRO_RISE_MAX: 0.25,
    ANTHRO_DECAY_START_YEAR: 1980,
    ANTHRO_DECAY_WINDOW_YEARS: 40,
    ANTHRO_DECAY_MAX: 0.15,
    SULFATE_BOOST_SCALE: 500,
    SULFATE_BOOST_MAX: 0.35,
    MODERN_REF_O2: 0.21,
    MODERN_REF_FOREST: 0.03,
    PRESSURE_FACTOR_MAX: 1.2,
    OXIDATION_BASE: 0.3,
    OXIDATION_O2_GAIN: 4.0,
    TEMP_FACTOR_MIN: 0.6,
    TEMP_FACTOR_MAX: 1.3,
    TEMP_FACTOR_REF_K: 288,
    OPTICAL_EFF_BASE: 1.10,
    OPTICAL_EFF_CCN_GAIN: 0.45,
    OXIDATION_SOFT_BASE: 0.85,
    OXIDATION_SOFT_GAIN: 0.15,
    CLOUD_FRACTION_BASE: 0.19,
    CLOUD_FRACTION_INDEX_GAIN: 0.11,
    CLOUD_FRACTION_MAX: 0.75
};

// Parametres numeriques (stabilite et vitesse du solveur).
window.TUNING.SOLVER = {
    TOL_MIN_WM2: 0.05,
    MAX_SEARCH_STEP_K: 100,
    MAX_SEARCH_STEP_LARGE_K: 150,
    LARGE_DELTA_FACTOR: 10,
    FIRST_SEARCH_STEP_CAP_K: 0
};

// ============================================================================
// HYSTERESIS — paramètres globaux pour tests de falaise chaud↔froid (sans if d'époque)
//
// Ces bornes servent de "garde-fous" pour des expériences paramétriques (search.html / outils),
// pas comme vérité physique stricte.
// CO₂ océan (co2OceanScale01, co2OceanPumpOverride01, co2OceanEffPump01 jauge, ratio via THRESHOLD) :
// surface de contrôle = panneau hystérésis search* / scie* ; defaults provisoires.
// Références (ordre d’idée) :
// - Budyko (1969), Sellers (1969) : rétroaction glace–albédo (bistabilité)
// - Hoffman & Schrag (2002), Pierrehumbert (2004) : Snowball Earth / transition océan gelé
// ============================================================================
window.TUNING.HYSTERESIS = {
    // Mer gelée (optique) : transition en K et intensité [0..1]
    seaIceTransitionRangeK: { min: 1, max: 80, default: 20, sens_threshold: "➘" },
    seaIceStrength01: { min: 0.0, max: 1.0, default: 1.0, sens_threshold: "➚" },

    // CO₂ océan : facteur de relaxation, override pompe [0..1], eff effectif (jauge dédiée)
    co2OceanScale01: { min: 0.0, max: 1.0, default: 0.1, sens_threshold: "➚" },
    co2OceanPumpOverride01: { min: 0.0, max: 1.0, default: 1.0, sens_threshold: "➚" },
    co2OceanEffPump01: { min: 0.0, max: 1.0, default: 0.1, sens_threshold: "➚" },

    // Glace (albédo) : coefficient optique de la glace (EARTH['🪩🍰']['🪩🍰🧊'])
    iceAlbedoCoeff: { min: 0.50, max: 0.90, default: 0.70, sens_threshold: "➚" },

    // Recherche seuil CO₂ (window.HYSTERESIS) : |ΔT| et |Δppm| entre équilibres (pousse dicho / nudge)
    epsilonT_C: 1,
    epsilonPpm: 1,
    // Arrêt : |⚖️🏭_nouveau − ⚖️🏭_avant pas| < convergencePpmMass × Δkg(1 ppm) en phase dicho
    convergencePpmMass: 1,
    // Chute « brutale » de T (°C) vs référence scan / côté chaud dicho
    brutalDeltaT_C: 3,
    // Facteur masse CO₂ à chaque pas du scan avant dicho (×0.9)
    scanCo2MassFactor: 0.9,
    // Max pas de dichotomie ; au-delà → arrêt partiel avec bornes
    maxDichoSteps: 30,
    // Signe recherche CO₂ : UI window.HYSTERESIS.searchSign 'negative'|'positive' (défaut négatif) — pas ici
    // Indices pour logs « proche hystérésis ? » (objectif physique discuté : T > marge chaud, +1 ppm → T < palier froid)
    warmBranchHint_C: -5,
    coldBranchHint_C: -20
};
// File: API_BILAN/config/model_tuning_biblio.js - Bibliographie et impact des reglages
// Desc: En francais, dans l'architecture, je documente les coefficients de tuning, leurs sources et leur effet thermique signe.
// Version 1.0.1
// Date: [April 02, 2026] [18:00 UTC+1]
// logs :
// - v1.0.1: groupe HYSTERESIS (cryosphère / CO₂ mer)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: catalogue des parametres CLOUD_SW/SOLVER avec references et effet +/- sur le rechauffement

window.TUNING_BIBLIO = {
    CLOUD_SW: {
        CLOUD_FRACTION_BASE: {
            value: 0.19,
            source: "CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne",
            effect_on_warming_when_increased: "negative"
        },
        CLOUD_FRACTION_INDEX_GAIN: {
            value: 0.11,
            source: "Sundqvist (1989) + ajustement interne cloud_index -> fraction optique",
            effect_on_warming_when_increased: "negative"
        },
        OPTICAL_EFF_BASE: {
            value: 1.10,
            source: "Twomey + AR6 aerosols, centrage moderne",
            effect_on_warming_when_increased: "negative"
        },
        OPTICAL_EFF_CCN_GAIN: {
            value: 0.45,
            source: "Twomey effect (sensibilite de l'albedo nuageux aux CCN)",
            effect_on_warming_when_increased: "negative"
        },
        SULFATE_BOOST_SCALE: {
            value: 500,
            source: "Proxy sulfate interne SO4(2-) pour microphysique nuageuse",
            effect_on_warming_when_increased: "negative"
        },
        SULFATE_BOOST_MAX: {
            value: 0.35,
            source: "Borne numerique de securite (evite emballement du proxy)",
            effect_on_warming_when_increased: "negative"
        },
        TEMP_FACTOR_REF_K: {
            value: 288,
            source: "Reference climat moderne (~15C)",
            effect_on_warming_when_increased: "mixed"
        }
    },
    SOLVER: {
        TOL_MIN_WM2: {
            value: 0.05,
            source: "Choix numerique de convergence (stabilite/temps de calcul)",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        MAX_SEARCH_STEP_K: {
            value: 100,
            source: "Choix numerique solveur Search",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        MAX_SEARCH_STEP_LARGE_K: {
            value: 150,
            source: "Choix numerique solveur Search (grands deltas)",
            effect_on_warming_when_increased: "neutral_on_physics"
        },
        LARGE_DELTA_FACTOR: {
            value: 10,
            source: "Seuil de bascule vers cap large du pas Search",
            effect_on_warming_when_increased: "neutral_on_physics"
        }
    },
    HYSTERESIS: {
        HYST_SEA_ICE_RANGE_K: {
            value: 2.2,
            source: "Largeur transition mer gelée (K) : Budyko (1969), Sellers (1969) ; EBM snowball — Pierrehumbert (2010) ; UI scie 1000–6000 → 1–6 K",
            effect_on_warming_when_increased: "mixed"
        },
        HYST_SEA_ICE_STRENGTH: {
            value: 1,
            source: "Amplitude rétroaction glace de mer sur fraction océanique [0,1]",
            effect_on_warming_when_increased: "negative"
        },
        HYST_ICE_IMPACT: {
            value: 0.7,
            source: "Couplage glace → albédo (iceImpactFactor01) ; albédo glace/neige vs océan AR6 WGI",
            effect_on_warming_when_increased: "negative"
        },
        HYST_CO2_OCEAN_EFF: {
            value: 0.1,
            source: "Relaxation Henry CO₂ atmosphère–océan (masse totale conservée) ; Zeebe & Wolf-Gladrow (2001)",
            effect_on_warming_when_increased: "mixed"
        }
    }
};
// File: API_BILAN/config/fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.3.3
// Date: [April 02, 2026] [18:00 UTC+1]
// logs :
// - v1.3.3: groupe HYSTERESIS (mer gelée, CO₂ mer, impact glace)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: cible CLOUD_SW.CLOUD_FRACTION_BASE avec 3 points d'essai (min/moy/max)
// - v1.1.0: plusieurs paramètres CLOUD_SW avec bornes min/max pour essais batch
// - v1.2.0: biblio intégrée dans chaque target (source + effet + référence)
// - v1.3.0: couverture complète biblio CLOUD_SW + SOLVER (toutes entrées avec bornes)
// - v1.3.1: default (nominal) par target ; 100% jauge = default (OPTICAL_EFF_CCN_GAIN etc. pris en compte)
// - v1.3.2: baryGroup SCIENCE pour CLOUD_FRACTION_INDEX_GAIN + OPTICAL_EFF_CCN_GAIN (jauge Science)

window.FINE_TUNING_BOUNDS = {
    targets: [
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_BASE',
            min: 0.17,
            max: 0.23,
            default: 0.19,
            unit: 'fraction',
            note: 'base couverture nuageuse SW',
            source: 'CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_INDEX_GAIN',
            baryGroup: 'SCIENCE',
            min: 0.08,
            max: 0.14,
            default: 0.11,
            unit: 'ratio',
            note: 'gain index nuageux',
            source: 'Sundqvist (1989) + ajustement interne cloud_index -> fraction optique',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_INDEX_GAIN'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_BASE',
            min: 1.00,
            max: 1.20,
            default: 1.10,
            unit: 'ratio',
            note: 'efficacité optique de base',
            source: 'Twomey + AR6 aerosols, centrage moderne',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_CCN_GAIN',
            baryGroup: 'SCIENCE',
            min: 0.30,
            max: 0.60,
            default: 0.45,
            unit: 'ratio',
            note: 'sensibilité optique au ratio CCN',
            source: 'Twomey effect (sensibilite de l albedo nuageux aux CCN)',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_CCN_GAIN'
        },
        {
            group: 'CLOUD_SW',
            key: 'SULFATE_BOOST_SCALE',
            min: 300,
            max: 700,
            default: 500,
            unit: 'scale',
            note: 'gain sulfate proxy -> CCN',
            source: 'Proxy sulfate interne SO4(2-) pour microphysique nuageuse',
            effect: 'negative',
            biblio_ref: 'SULFATE_BOOST_SCALE'
        },
        {
            group: 'CLOUD_SW',
            key: 'SULFATE_BOOST_MAX',
            min: 0.20,
            max: 0.45,
            default: 0.35,
            unit: 'ratio',
            note: 'plafond du boost sulfate',
            source: 'Borne numerique de securite (evite emballement du proxy)',
            effect: 'negative',
            biblio_ref: 'SULFATE_BOOST_MAX'
        },
        {
            group: 'CLOUD_SW',
            key: 'TEMP_FACTOR_REF_K',
            min: 282,
            max: 294,
            default: 288,
            unit: 'K',
            note: 'référence thermique nuages SW',
            source: 'Reference climat moderne (~15C)',
            effect: 'mixed',
            biblio_ref: 'TEMP_FACTOR_REF_K'
        },
        {
            group: 'SOLVER',
            key: 'TOL_MIN_WM2',
            min: 0.03,
            max: 0.10,
            default: 0.05,
            unit: 'W/m²',
            note: 'tolérance flux minimale',
            source: 'Choix numerique de convergence (stabilite/temps de calcul)',
            effect: 'neutral_on_physics',
            biblio_ref: 'TOL_MIN_WM2'
        },
        {
            group: 'SOLVER',
            key: 'MAX_SEARCH_STEP_K',
            min: 60,
            max: 140,
            default: 100,
            unit: 'K',
            note: 'pas Search max',
            source: 'Choix numerique solveur Search',
            effect: 'neutral_on_physics',
            biblio_ref: 'MAX_SEARCH_STEP_K'
        },
        {
            group: 'SOLVER',
            key: 'MAX_SEARCH_STEP_LARGE_K',
            min: 100,
            max: 200,
            default: 150,
            unit: 'K',
            note: 'pas Search large',
            source: 'Choix numerique solveur Search (grands deltas)',
            effect: 'neutral_on_physics',
            biblio_ref: 'MAX_SEARCH_STEP_LARGE_K'
        },
        {
            group: 'SOLVER',
            key: 'LARGE_DELTA_FACTOR',
            min: 6,
            max: 16,
            default: 10,
            unit: 'ratio',
            note: 'seuil bascule grand delta',
            source: 'Seuil de bascule vers cap large du pas Search',
            effect: 'neutral_on_physics',
            biblio_ref: 'LARGE_DELTA_FACTOR'
        },
        {
            group: 'RADIATIVE',
            key: 'H2O_EDS_SCALE',
            baryGroup: 'SCIENCE',
            min: 1.00,       // bary 0 %  → κ_H₂O max (T haute)
            max: 0.60,       // bary 100 % → κ_H₂O min (T basse, cible Schmidt 2010 ~75 W/m²). min>max volontaire (convention projet : bary 100 % = T basse).
            default: 0.80,
            unit: 'ratio',
            note: 'multiplicateur global de κ_H₂O (EARTH.H2O_EDS_SCALE). Capture continuum MT_CKD non implémenté + overlap CO₂/H₂O + approximations HR(z). Scalaire global (feedback T via Clausius-Clapeyron déjà dans waterVaporMixingRatio).',
            source: 'Schmidt 2010 (attribution EDS H₂O ≈ 50 % de 155 W/m² ≈ 75 W/m²) ; Held & Soden 2006 (CC feedback 6–8 %/K).',
            effect: 'positive',
            biblio_ref: 'H2O_EDS_SCALE'
        },
        {
            group: 'HYSTERESIS',
            key: 'seaIceTransitionRangeK',
            min: 1,
            max: 6,
            default: 2.2,
            unit: 'K',
            note: 'largeur T sous T_gel : fraction mer gelée 0→1 (moteur calculations_albedo)',
            source: 'EBM cryosphère Budyko–Sellers ; transitions résolues typ. ~quelques K ; UI scie ×1000',
            effect: 'mixed',
            biblio_ref: 'HYST_SEA_ICE_RANGE_K'
        },
        {
            group: 'HYSTERESIS',
            key: 'seaIceStrength01',
            min: 0,
            max: 1,
            default: 1,
            unit: 'fraction',
            note: 'intensité mer gelée sur couverture océan',
            source: 'Borne [0,1] ; 1 = rétroaction albédo max (jeux snowball)',
            effect: 'negative',
            biblio_ref: 'HYST_SEA_ICE_STRENGTH'
        },
        {
            group: 'HYSTERESIS',
            key: 'iceImpactFactor01',
            min: 0,
            max: 1,
            default: 0.7,
            unit: 'fraction',
            note: 'impact glace sur albédo (GREY)',
            source: 'AR6 WGI albédo glace/neige ; preset lit. 0,7 entre nominal ~0,53 et max 1',
            effect: 'negative',
            biblio_ref: 'HYST_ICE_IMPACT'
        },
        {
            group: 'HYSTERESIS',
            key: 'co2OceanEffPump01',
            min: 0,
            max: 1,
            default: 0.1,
            unit: 'fraction',
            note: 'relaxation Henry atmos↔océan (Σ carbone conservé)',
            source: 'Zeebe & Wolf-Gladrow (2001) ; NO-OP si hystérésis active',
            effect: 'mixed',
            biblio_ref: 'HYST_CO2_OCEAN_EFF'
        }
    ]
};
// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.2.4
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.2.1: add sulfate proxy mass ⚖️✈ for 🚂/📱 and disable verbose debug flags
// - v1.2.2: paramètres solveur issus de static/tuning/model_tuning.js (source unique tuning)
// - v1.2.3: fallback synchrone des paramètres solveur si window.TUNING non chargé
// - v1.2.4: 🌿 = Paléozoïque (541–252 Ma), ordre chrono Protérozoïque → Paléozoïque → Mésozoïque → Cénozoïque
// - v1.2.5: baryByGroupDefault (CLOUD_SW/SCIENCE/SOLVER %) pour init DATA['🎚️'].baryByGroup dans initDATA.js
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': emoji, '▶': number, '◀': number, ... } — 🚂 (1800) hors TIMELINE depuis alignement configTimeline v1.3.0
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
//
// Réfs 🌡️🧮 (temp. surface) : Kienert & Feulner Clim. Past 9:1841 (2013) ; Charnay 2017 ; PNAS 2018 ;
// Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014. Valeurs au DÉBUT de chaque époque (parcours temporel à venir).
// Réfs masses gaz (⚖️🏭, ⚖️🐄) : doc/VALIDATION_CONFIG_GAZ.md
const timeline = [
    {
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        // 🌡️🧮 : ~255 K équilibre corps noir (σT⁴ = S/4)
        '🌡️🧮': 255,
        '🧲🔬': 0.3,
        '🔋☀️': 2.663e26, // 🔒 Gough (1981) @5.0Ga = 69.6%
        '🔋🌕': 0, // core_temperature (Pas de noyau en K)
        '🍰🧲🌕': 0.0, // geothermal_diffusion_factor (Facteur de diffusion du noyau vers la surface 0-1)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (valeur par défaut, pas d'eau pour cette époque)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        '⚖️🫧': 0, // Masse atmosphère (Pas d'atmosphère)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.0,  // Surface océanique potentielle (0% - pas d'eau)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de relief)
            '🍰🗻🌍': 1.0   // Terres basses (100% - surface rocheuse)
        },
        // 🔒 Corps noir : pas de désert, albedo = 0 (corps noir absorbe tout)
        '🍰🪩🏜️': 0.0,  // Forcer couverture désert à 0 (pas de désert pour corps noir)
        '🪩🍰': {
            '🪩🍰🌍': 0.0  // Override coefficient albedo terres à 0 (corps noir absorbe tout)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 0, // co2_kg (Quantité de CO2 en kg)
        '⚖️🐄': 0, // ch4_kg (Quantité de CH4 en kg)
        '⚖️💧': 0, // h2o_kg (Quantité totale d'eau en kg)
        '⚖️🫁': 0, // o2_kg (Quantité de O2 en kg)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        // Événements interactifs (météorites uniquement Corps noir + Hadéen) ; 💫 = bouton timeline (logo)
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.07e18, // water_added_kg (~+10% d'albedo en ⚫ froid avec la formule actuelle)
                '🔺⏳': 100,
            },
            '🎇': {
                '⏩': '🔥' // Transition vers Hadéen
            }
        }
    },
    {
        '📅': '🔥', // Hadéen — début, juste après impact formant la Lune (ordre 100–1000 ans)
        '▶': 4.5e9,
        '◀': 4.0e9,
        // 🌡️🧮 : océan de magma ~2000–2500 K (surface en fusion)
        '🌡️🧮': 2450,
        '🧲🔬': 1.7,//596,
        '🔋☀️': 2.746e26, // 🔒 Gough (1981) @4.5Ga = 71.7%
        '🔋🌕': 1.23e21, // core_power_watts (Puissance géothermique totale calculée depuis 🧲🌕 = 2 MW/m² et R = 7008.1 km)
        // Flux géothermique colossal (2 MW/m²) pour maintenir la surface en fusion (~2400K)
        // Phase immédiate post-impact (océan de magma rayonnant) ; le temps peut avancer dans la simu
        '🧲🌕': 2000000, // geothermal_flux (W/m²) - hardcodé pour cette époque
        '📐': 7008.1, // Rayon de la planète en km
        '🍎': 9.8, // Gravité en m/s²
        '📏🌊': 100.0, // Profondeur moyenne océan de magma en km (Hadéen)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 1.0,  // Surface océanique potentielle (100% - océan de magma)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de continents stables)
            '🍰🗻🌍': 0.0   // Terres basses (0% - pas de continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.3e20, // Masse atmosphère (Atmosphère très dense ~100 bar)
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 5.15e17, // co2_kg (~10% de l'atmosphère moderne)
        '⚖️🐄': 5.15e15, // ch4_kg (~1000 ppm)
        '⚖️💧': 2.1e20, // h2o_kg (~15% de 1.4e21 kg)
        '⚖️🫁': 0, // o2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        magma_coverage: 1.0, // Spécifique Hadéen - TODO: trouver logo combo
        volcanoFactor: 10.0, // Spécifique Hadéen - TODO: trouver logo combo
        // Événements interactifs
        // Hadéen dure 500 Ma (▶ 4.5 Ga → ◀ 4.0 Ga). Courbes : T° = 🌡️🧮 + 🔺🌡️💫×tic ; 🧲🌕 = ▶→◀ ; gaz fixes.
        '🕰': {
            '💫': {
                '🔺🌡️💫': -300, // delta T° par tic (K) — refroidissement linéaire
                '🔺🧲🌕💫': {
                    '▶': 2000000, // flux géothermique début (W/m²)
                    '◀': 0.3     // flux géothermique fin (W/m²) — interpolation selon tic
                },
                '🔺⏳': 50,       // durée d'un tic en Ma (500 Ma / 10 tics ≈ 50 Ma/tic)
            },
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg (~10% de l'eau initiale)
                '🔺⏳': 100,       // durée d'un tic en Ma (météorites)
            }
        }
    },
    {
        '📅': '🦠', // Archéen — début (4 Ga) = Archéen précoce
        '▶': 4.0e9,
        '◀': 2.5e9,
        // 🌡️🧮 : aligné configTimeline.js v1.4.4+ (milieu CSV Archéen). Pas de 🌡️📚 : clé non lue par le moteur (retirée v1.4.5).
        '🌡️🧮': 308.15,
        '🧲🔬': 0.01,  // Précision stricte (tol ~0.4 W/m²) pour stabilité anim même époque
        '🔋☀️': 2.836e26, // 🔒 Gough (1981) @4.0Ga = 74.1%
        '🔋🌕': 1.5e14, // core_power_watts (Puissance géothermique totale ~150 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 4.7, // Profondeur moyenne océans en km (Archéen, moins d'eau)
        '🐚': 1.0, // Facteur relief sous-marin 
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.80, // Surface océanique potentielle (80% - moins de continents qu'aujourd'hui)
            '🍰🗻🏔': 0.05, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15  // Terres basses (15% - premiers continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 1.0e19, // Masse atmosphère (Atmosphère dense ~2 bar)
        // Simulation parameters - Quantités en kg (lit. 1000×–10000× PAL ; 40k ppm calibré ~15°C)
        '⚖️🏭': 8.0e16, // co2_kg (~40000 ppm, calibré équilibre ~15°C, commit 5ecb155)
        '⚖️🐄': 2.0e15, // ch4_kg (~800 ppm, lit. 100–10000 ppm)
        '⚖️💧': 1.8e21, // h2o_kg (~129% actuel, litt. Harvard océans +26%)
        '⚖️🫁': 0, // o2_kg
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '💫': {
                '🔺⏳': 100,       // durée d'un tic en Ma (bouton timeline)
            },
        }
    },
    {
        '📅': '🪸', // Protérozoïque
        '▶': 2.5e9,
        '◀': 750e6,
        // 🌡️🧮 : ~280–290 K (lit. Protérozoïque)
        '🌡️🧮': 285,
        '🧲🔬': 0.01,
        '🔋☀️': 3.140e26, // 🔒 Gough (1981) @2.5Ga = 82.0%
        '🔋🌕': 1.0e14, // core_power_watts (Puissance géothermique totale ~100 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.6, // Profondeur moyenne océans en km (Protérozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.75, // Surface océanique potentielle (75% - continents en formation)
            '🍰🗻🏔': 0.08, // Hautes terres (8% - relief modéré)
            '🍰🗻🌍': 0.17  // Terres basses (17% - continents émergents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (~1 bar). Lit. 2.7 Ga: pression possiblement <0.5 bar.
        // Lit. Proterozoic: CO2 10–200× actuel; paléosols ~2.2 Ga: 8000–9000 ppm. CH4 100–300 ppm.
        '⚖️🏭': 4.7e16,  // co2_kg (~6000 ppm, milieu de fourchette lit. 5–9k ppm)
        '⚖️🐄': 2.85e14,  // ch4_kg (~100 ppm, lit. 100–300 ppm)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🫁': 0,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '🌋': { '🔺🍰⚽': 0.02 },
            '💫': { '🔺⏳': 100 },
        }
    },
    // hysteresis 1a — aligné configTimeline.js v1.4.0 (🌡️🧮 graine branche chaude avant scan CO₂↓)
    {
        '📅': 'hysteresis 1a',
        hidden: true, // interne (non cliquable / non affiché dans la frise)
        '▶': 750e6,
        '◀': 720e6,
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26,
        '🔋🌕': 8.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.0e16,
        '⚖️🐄': 1.0e14,
        '⚖️💧': 1.2e21,
        '⚖️🫁': 1.5e16,
        '🕰': { '💫': { '🔺🌡️💫': 0, '🔺⏳': 30 } },
        '🌱': 0.0
    },
    // ⛄ = Boule de neige (750–600 Ma) : glaciation globale Néoprotérozoïque (Sturtien ~717 Ma, Marinoen ~650 Ma)
    {
        '📅': '⛄', // Boule de neige (750–600 Ma)
        '▶': 750e6,
        '◀': 600e6,
        '🌡️🧮': 240,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // 🔒 Gough (1981) @0.75Ga = 93.8%
        '🔋🌕': 8.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.0e16,
        '⚖️🐄': 1.0e14,
        '⚖️💧': 1.2e21,
        '⚖️🫁': 1.5e16,
        '🕰': {
            '💫': { '🔺⏳': 150 },
        }
    },
    // 🌿 = Paléozoïque (600–252 Ma) : même niveau que Mésozoïque/Cénozoïque (ères), zéro chevauchement.
    // Ordre chronologique : … Protérozoïque → ⛄ Boule de neige → Paléozoïque → Mésozoïque → Cénozoïque …
    {
        '📅': '🌿', // Paléozoïque (600–252 Ma)
        '▶': 600e6,
        '◀': 252e6,
        // 🌡️🧮 : ~285–295 K (lit. Paléozoïque : Ordovicien–Dévonien chaud, Carbonifère–Permien glaciations)
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.638e26, // 🔒 Gough (1981) @0.6Ga = 95.0%
        '🔋🌕': 6.5e13, // core_power_watts
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6, // Profondeur océans (Paléozoïque)
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.78,
            '🍰🗻🏔': 0.06,
            '🍰🗻🌍': 0.16
        },
        '⚖️🫧': 5.15e18,
        // CO2 Paléozoïque : élevé début (Ordovicien–Dévonien), plus bas Carbonifère–Permien ; valeur représentative
        '⚖️🏭': 1.2e16,  // co2_kg (~2300 ppm)
        '⚖️🐄': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 0,
        '🕰': {
            '💫': { '🔺⏳': 100 },
        }
    },
    {
        '📅': '🦕', // Mésozoïque (252–66 Ma) — texture fonds/00200Ma.png (ancien 250Ma), événement 50 Ma
        '▶': 252e6,
        '◀': 66e6,
        // 🌡️🧮 : ~295–305 K (lit. Mésozoïque)
        '🌡️🧮': 298,
        '🧲🔬': 0.1,
        '🔋☀️': 3.746e26, // 🔒 Gough (1981) @0.25Ga = 97.9%
        '🔋🌕': 6.0e13, // core_power_watts (Puissance géothermique totale ~60 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Mésozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.2875e16, // co2_kg (~2500 ppm)
        '⚖️🐄': 4.12e13,
        '⚖️💧': 1.33e21,
        '⚖️🫁': 0,
        '🕰': {
            '💫': {
                '🔺🌡️💫': -2,
                '🔺⏳': 100,       // durée d'un tic en Ma (bouton timeline)
                '🔺🧲🌕💫': { '▶': 0, '◀': 0 },
            }, // Événement 50 Ma
            '🎇': { '⏩': '🦤' } // Big impact (K-Pg) → Cénozoïque
        }
    },
    {
        '📅': '🦤', // Cénozoïque (66–50 Ma)
        '▶': 66e6,
        '◀': 50e6,
        '⛄': 0,
        '🌡️🧮': 290,
        '🧲🔬': 0.1,
        '🔋☀️': 3.806e26,
        '🔋🌕': 5.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 3.35e15,
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 16 },
        }
    },
    {
        '📅': '🐊', // Éocène (50–35 Ma)
        '▶': 50e6,
        '◀': 35e6,
        '⛄': 0,
        '🌡️🧮': 297,
        '🧲🔬': 0.1,
        '🔋☀️': 3.811e26,
        '🔋🌕': 5.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 9.01e15,
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 15 },
        }
    },
    {
        '📅': 'hysteresis 2',
        hidden: true,
        '▶': 35e6,
        '◀': 33e6,
        '⛄': 0.02,
        '🌡️🧮': 289,
        '🧲🔬': 0.08,
        '🔋☀️': 3.816e26,
        '🔋🌕': 4.85e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 5.15e15,
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 2 },
        }
    },
    {
        '📅': '🏔',
        '⛄': 0.085,
        '▶': 33e6,
        '◀': 2e6,
        '🌡️🧮': 285,
        '🧲🔬': 0.05,
        '🔋☀️': 3.817e26,
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 6.06e15,
        '⚖️🐄': 3.6e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.08e18,
        '⚖️✈': 1e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺⏳': 100 },
        }
    },
    {
        '📅': '🦣',
        '⛄': 0.11,
        '▶': 2e6,
        '◀': 10e3,
        '🌡️🧮': 287,
        '🧲🔬': 0.04,
        '🔋☀️': 3.827e26,
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.191e15,
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '⚖️✈': 1.2e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.25 },
        }
    },
    {
        '📅': '📱', // Aujourd'hui (▶=2000 : clic 📱 = position 2000 ; fin de frise = 2100)
        '▶': 2000,
        '◀': 2100, // ticTime forward : 2000+25a/tic → 2025 après 1 tic, 2100 terminus
        // 🌡️🧮 : ~288.3 K (~15.1°C) — an 2000 [OBS] NASA GISS
        '🌡️🧮': 288.3,
        '🧲🔬': 0.010,
        '🔋☀️': 3.828e26, // Puissance totale du soleil (W) - 100% (valeur actuelle)
        '🔋🌕': 4.6e13, // core_power_watts (Puissance géothermique totale ~46 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Terre moderne)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: 🍰🪩🏜️, 🍰🪩🌳, 🍰🪩🌍 sont maintenant calculés dynamiquement dans calculateAlbedo()
        '⚖️🫧': 5.15e18, // Masse atmosphère (air sec ~1 bar, comme Industriel)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 2.887e15, // ~369 ppm CO2 an 2000 [OBS] NOAA
        '⚖️🐄': 4.99e12, // ~1750 ppb CH4 an 2000 [OBS] NOAA
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.18e18, // O2 ~23% masse air sec
        '⚖️✈': 8.0e13, // sulfate_kg (proxy CCN moderne)
        '⚖️💨': 3.97e18, // n2_kg (~78% de l'atmosphère moderne, calculé comme reste pour atteindre 5.15e18)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        // 🕰 indexé par année : clic injecte 🔺⚖️🏭 ; cycle CO₂ / puits → TODO
        // Convention UI +NGt : N·1e9 (tranche 2000 → 850e9 = +850Gt CO2)
        '🕰': {
            2000: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 850e9 } }, // +850 Gt (2000)
            2025: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 900e9 } },
            2050: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 600e9 } },
            2075: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 350e9 } },
            '◀': {
                '⚖️': { '⚖️💧': 1.4e21, '⚖️🫧': 5.15e18, '⚖️🐄': 8.6e12, '⚖️🫁': 1.18e18, '⚖️✈': 8.0e13, '⚖️💨': 3.97e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        },
        '🌱': 0.31
    }
];

window.TIMELINE = timeline;
// ⚠️ v1.4.0 : TIMELINE_EPOCH_PREINDUSTRIAL_1800 supprimé — 🚂 Industriel intégré dans TIMELINE.
// Ce bundle doit être régénéré pour inclure : 🍄 Paléozoïque terrestre, 💀 P/T, ⛈ Sortie Marinoen, 🛖 Holocène, 🚂 Industriel.

// Paramètres de calcul (convergence radiatif)
// Convention de source :
// - [OBS/CALIB] : valeur issue d'observations/littérature ou calibration sur observations
// - [EQ/NUM]    : valeur de schéma numérique, solveur ou stratégie de convergence
window.CONFIG_COMPUTE = window.CONFIG_COMPUTE || {};
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.hystStratosphericVeilExtra01))) {
    window.CONFIG_COMPUTE.hystStratosphericVeilExtra01 = 0;
}

// Valeurs par défaut des jauges fine-tuning (% ). Utilisées uniquement à l'init de DATA['🎚️'].baryByGroup (initDATA.js). DATA seule ref ensuite.
window.CONFIG_COMPUTE.baryByGroupDefault = { CLOUD_SW: 65, SCIENCE: 65, SOLVER: 100, HYSTERESIS: 100 };

// ===================== [OBS/CALIB] =====================
// Bins spectaux (N utilisé). 500 = courbe propre ; 100 donne courbe moins précise et convergence ~1.2°C (artefact). 🔬🌈 dans [N_min, N_max].
// N_min : optionnel (spectralBinsMinFromHITRAN). Réf. scripts/hitran_spectral_bin_bounds.py.
// 2000 = courbe spectrale lisse. Réduire à 1000 si crash Brave code 5 (RAM).
window.CONFIG_COMPUTE.maxSpectralBinsConvergence = 2000;            // [OBS/CALIB]
window.CONFIG_COMPUTE.initSpectralBinsConvergence = 200;            // [OBS/CALIB] N initial (anim : 200 → … → max ; passe finale à max après convergence)
// spectralMaxMB : si défini, pas de passe finale à maxBins si grille dépasserait ce seuil (évite Brave code 5). Ex. 25.
window.CONFIG_COMPUTE.spectralMaxMB = null;                         // [OBS/CALIB] null = pas de plafond ; 25 = skip passe finale si > 25 MB
// Workers spectraux : par défaut nWorkers = navigator.hardwareConcurrency - 1. Optionnel : maxWorkers (ex. 4) pour plafonner.
// window.CONFIG_COMPUTE.maxWorkers = 4;                            // [OBS/CALIB] décommenter pour limiter (ex. 4)
// Limite RAM (calculations.js) : plafond couches convergence + résolution stockée en DATA['📊'] (évite 1–4 Go heap).
window.CONFIG_COMPUTE.maxLayersConvergence = 800;                   // [OBS/CALIB] max couches atmosphère pour le calcul (z_range écrêté)
window.CONFIG_COMPUTE.maxStoredSpectralLayers = 400;                // [OBS/CALIB] max couches gardées en DATA pour affichage (sous-échant.)
window.CONFIG_COMPUTE.maxStoredSpectralBins = 600;                 // [OBS/CALIB] max bins λ gardés en DATA pour affichage (sous-échant.)
window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN = null;            // [OBS/CALIB]
// true = répartition homogène (poids ∝ largeur région → même densité bins/μm partout) ; false = grille d'origine (converge bien).
window.CONFIG_COMPUTE.spectralGridHomogeneous = true;             // [OBS/CALIB]
// Pondération physique du spin-up : cycles_effectifs = cycles × f(⚖️🫧) × f(⚖️💧). Refs confirmés >= 1 au set.

window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg = 1e18; // [OBS/CALIB]
window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg = 1e20; // [OBS/CALIB]
// Temps caractéristique fonte calotte pour l'héritage glaciaire (ans)
window.CONFIG_COMPUTE.tauGlaceAns = 50000;                         // [OBS/CALIB]
// Pressure broadening (spectroscopie) : σ_eff = σ × √(P/P_ref), utile à P>1 bar.
window.CONFIG_COMPUTE.pressureBroadening = true;                   // [OBS/CALIB]
// Masse totale eau terrestre (kg), ref pour % météorites de glace (events.js)
window.CONFIG_COMPUTE.earthTotalWaterMassKg = 1.4e21;              // [OBS/CALIB]

// ===================== [EQ/NUM] =====================
window.CONFIG_COMPUTE.maxRadiatifIters = 101;                      // [EQ/NUM]
// Plafond T en Search (K). null = pas de plafond (test).
window.CONFIG_COMPUTE.maxSearchT_K = null;                         // [EQ/NUM]
// Tolérances cycle eau (changement albedo/vapor pour relancer tour radiatif)
window.CONFIG_COMPUTE.cycleTolAlbedo = 1e-4;                       // [EQ/NUM]
window.CONFIG_COMPUTE.cycleTolVapor = 1e-6;                        // [EQ/NUM]
// Spin-up climatologique avant solver radiatif (cycles eau/albédo à glace verrouillée). Confirmé >= 0 entier.
window.CONFIG_COMPUTE.climateSpinupCycles = Math.max(0, Math.floor(8)); // [EQ/NUM]
// Cycles eau/albédo par pas radiatif (1 = même résultat visu/scie 16.4°C 2025 ; 2 = visu peut dériver albédo → 15.2°C)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep = 1;             // [EQ/NUM]
// Cycles eau/albédo à l'Init uniquement (T fixe)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit = 1;              // [EQ/NUM]
// Rampe glace en convergence : step nominal et step renforcé sur les premières itérations Search
window.CONFIG_COMPUTE.iceCoverageRampMaxStep = 0.004;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampEarlyIters = 10;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly = 0.001;         // [EQ/NUM]

// Catégorie à part : overrides debug/patch (pas dans CONFIG_COMPUTE).
window.OVERRIDES = window.OVERRIDES || {};
// Désactivé par défaut (voir configTimeline.js) : laisser la physique gérer ⛄ Boule de neige.
window.OVERRIDES.useEpochIceFixed = false;
window.OVERRIDES['⛄'] = null;

const SOLVER_TUNING = (window.TUNING && window.TUNING.SOLVER)
    ? window.TUNING.SOLVER
    : {
        TOL_MIN_WM2: 0.05,
        MAX_SEARCH_STEP_K: 100,
        MAX_SEARCH_STEP_LARGE_K: 150,
        LARGE_DELTA_FACTOR: 10
    };
// Borne min tolérance flux (W/m²) : évite convergence impossible sous bruit numérique.
window.CONFIG_COMPUTE.tolMinWm2 = SOLVER_TUNING.TOL_MIN_WM2; // [EQ/NUM]
// Search : ΔT proportionnel à Δ (formule Δ/(4σT³)). Cap max uniquement.
window.CONFIG_COMPUTE.maxSearchStepK = SOLVER_TUNING.MAX_SEARCH_STEP_K; // [EQ/NUM]
window.CONFIG_COMPUTE.maxSearchStepLargeK = SOLVER_TUNING.MAX_SEARCH_STEP_LARGE_K; // [EQ/NUM]
window.CONFIG_COMPUTE.largeDeltaFactor = SOLVER_TUNING.LARGE_DELTA_FACTOR; // [EQ/NUM]
window.CONFIG_COMPUTE.searchStepScaleMax = 200;                    // [EQ/NUM]
// Bornes dichotomie Init
window.CONFIG_COMPUTE.bornesMinK = 250;                            // [EQ/NUM]
window.CONFIG_COMPUTE.bornesMaxK = 4000;                           // [EQ/NUM]

// ===================== [OUTIL/DEBUG/UI] =====================
// Log diagnostic EDS (h2o_eds_scale, bins, delta_z, n_layers, earth_flux, OLR, EDS)
window.CONFIG_COMPUTE.logEdsDiagnostic = false;
// Lissage visuel du spectre (affichage uniquement, pas la physique/OLR)
window.CONFIG_COMPUTE.plotSmoothEnable = true;
window.CONFIG_COMPUTE.plotSmoothSigmaBins = 8.0;//5.6;
// Logs diagnostics
window.CONFIG_COMPUTE.logIceFixedDiagnostic = false;
window.CONFIG_COMPUTE.logIceFractionDiagnostic = false;
// true : console 🔎 DIAG CO2 (calculateAtmosphereComposition) + 🔎 DIAG HYST (🧲📛🏭 W/m² après chaque pas convergence hyst)
window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic = false;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = false;
window.CONFIG_COMPUTE.logIrisDiagnostic = false;

