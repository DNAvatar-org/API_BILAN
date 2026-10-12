// ============================================================================
// File: API_BILAN/geology/calculations_geology.js
// Desc: Fonctions de calcul géologique basées sur la configuration centralisée
// Logs:
// - v1.0.5: flux/puissance intérieurs lus dans DATA['🌕'] (geology/interieur.js) pour l'époque courante, NaN ailleurs ;
//   voie legacy core_temperature × facteur et calculateGeothermalFlux retirées (clés retirées de TIMELINE, plus lues).
// - v1.0.4: epochIndex() rend les entrées TIMELINE (alias non énumérables) : type/id/name/startYears/endYears reportés.
// - v1.0.3: lecture de window.epochIndex() (configTimeline.js) au lieu de window.configOrganigramme.timeline.
//   Seule dépendance du moteur au dépôt CO2 : supprimée.
// Version 1.1.0
// Date: [October 10, 2026]
// Logs:
// - v1.1.0: PAS DE GARDES. computeFluxFromEpoch retiré (il rendait 0 en silence pour toute époque hors courante :
//   geothermal_flux, toujours un nombre — DATA ou NaN —, était lu en premier). Époque inconnue = erreur, plus
//   null. Plus de faux champs : core_temperature_k (clé absente de TIMELINE), volcanoFactor de config (aucune
//   époque ne le déclare : le facteur volcanique est la croûte molle seule), planet_radius / gravity / masse
//   d'atmosphère lus à leur unique source.
// - v1.0.2: total_atmosphere_mass_kg — si pas ⚖️🫧 en config, dry sum via COMPUTE.dryAtmosphereMassKgFromComponents(epoch).
// - v1.0.1: expositions regroupées sous nouveau namespace window.GEOLOGY (getGeologicalPeriodByName, getGeologicalPeriod, getMoltenCrustFactor, getGeologicalEra, calculateGeothermalFlux). Doublons window.foo retirés. Appelants migrés dans physics/climate.js, radiative/calculations.js, organigramme.js, ui/main.js, courbes/plot.js, sync_panels.js, flux_manager.js. Fallbacks inline dans CO2/html/*.html supprimés (dead code : module geology toujours chargé).
// ============================================================================

// Constantes pour la croûte molle (identiques à geology.js)
const CRUST_MOLTEN_START = 4.6e9;  // Début : formation de la Terre (4.6 Ga)
const CRUST_MOLTEN_END = 3.5e9;    // Fin : croûte solidifiée (3.5 Ga)
const CRUST_MOLTEN_FACTOR_MAX = 100; // Facteur maximum (x100) au tout début
const CRUST_MOLTEN_FACTOR_MIN = 10;  // Facteur minimum (x10) à la fin de la période

// Période géologique par son nom (ou son id), depuis l'index des époques (configTimeline.js).
// Copie VOULUE : on y pose des noms legacy (anglais) lus par l'interface CO2, sans toucher à TIMELINE.
// ⚠️ Seconde carte des époques (noms anglais) : à remplacer par des lectures directes de TIMELINE / DATA.
function getGeologicalPeriodByName(periodName) {
    const epoch = window.epochIndex().find(item =>
        item.type === 'epoch' && (item.name === periodName || item.id === periodName)
    );
    if (epoch === undefined) throw new Error('[GEOLOGY] époque inconnue : ' + periodName);
    // Flux et puissance de l'intérieur : UNE source, DATA['🌕'] (geology/interieur.js, bilan d'énergie).
    // Ils n'existent que pour l'époque COURANTE (état intégré jusqu'à la date courante) ; ailleurs NaN, visible.
    const courante = epoch.id === window.DATA['📜']['🗿'];
    // Les alias d'epochIndex() sont des accesseurs non énumérables : { ...epoch } ne les recopie pas.
    return {
        ...epoch,
        type: epoch.type, id: epoch.id, name: epoch.name, startYears: epoch.startYears, endYears: epoch.endYears,
        geothermal_flux: courante ? window.DATA['🌕']['🧲🌕'] : NaN,
        core_power_watts: courante ? window.DATA['🌕']['🔋🌕'] : NaN,
        planet_radius: epoch['📐'] * 1000,
        total_atmosphere_mass_kg: window.COMPUTE.dryAtmosphereMassKgFromComponents(epoch),
        gravity: epoch['🍎'],
        // FluxManager : solar_intensity est un facteur (1.0 = aujourd'hui)
        solar_intensity: epoch['🔋☀️'] / 3.828e26
    };
}

// Époque de l'index qui contient la date (années avant le présent) ; au-delà, la dernière (Aujourd'hui).
function getGeologicalPeriod(yearsAgo) {
    const epochs = window.epochIndex().filter(item => item.type === 'epoch');
    const found = epochs.find(epoch =>
        (yearsAgo <= epoch.startYears && yearsAgo > epoch.endYears)
        || (epoch.endYears === -1 && yearsAgo <= epoch.startYears && yearsAgo >= 0));
    return found === undefined ? epochs[epochs.length - 1] : found;
}

// Fonction pour calculer le facteur de croûte terrestre molle
function getMoltenCrustFactor(yearsAgo) {
    // Si on est avant la période de croûte molle, pas d'effet
    if (yearsAgo < CRUST_MOLTEN_END) {
        return 1.0; // Pas de croûte molle
    }

    // Si on est après le début de la Terre, facteur maximum
    if (yearsAgo >= CRUST_MOLTEN_START) {
        return CRUST_MOLTEN_FACTOR_MAX; // x100 au tout début
    }

    // Interpolation linéaire entre le début (x100) et la fin (x10)
    const progress = (yearsAgo - CRUST_MOLTEN_END) / (CRUST_MOLTEN_START - CRUST_MOLTEN_END);
    const factor = CRUST_MOLTEN_FACTOR_MIN + (CRUST_MOLTEN_FACTOR_MAX - CRUST_MOLTEN_FACTOR_MIN) * (1 - progress);

    return factor;
}

// Époque de la date et facteur volcanique : croûte molle seulement (aucune époque ne déclare de volcanoFactor).
function getGeologicalEra(years) {
    const moltenCrustFactor = getMoltenCrustFactor(years);
    return { ...getGeologicalPeriod(years), volcanoFactor: moltenCrustFactor, moltenCrustFactor: moltenCrustFactor };
}

var GEOLOGY = window.GEOLOGY = {};
GEOLOGY.getGeologicalPeriodByName = getGeologicalPeriodByName;
GEOLOGY.getGeologicalPeriod = getGeologicalPeriod;
GEOLOGY.getMoltenCrustFactor = getMoltenCrustFactor;
GEOLOGY.getGeologicalEra = getGeologicalEra;
