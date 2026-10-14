// File: API_BILAN/loader/engine_manifest.js
// Desc: LA liste des scripts du moteur, dans l'ordre des dépendances. Référence unique : toute page qui fait
//       tourner le moteur (index CO2, iframes scie / hystérésis / search, banc époques, scie démo, banc headless)
//       le charge par API_BILAN/loader/loader.js, qui lit cette liste. Avant, chaque page recopiait sa propre
//       liste (7 copies divergentes : event_bus.js manquait au banc, model_tuning.js vide traînait dans CO2…).
//       Chemins relatifs à API_BILAN/.
// Version 1.0.3
// - v1.0.3 (2026-10-13): physics/meridien.js (bilan d'énergie méridien de North et al. 1981).
// Date: 2026-10-10
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.ENGINE_SCRIPTS = [
    'config/model_tuning_biblio.js',
    'config/configTimeline.js',
    'data/alphabet.js',
    'data/episteme.js',     // liens épistémiques 🧭 / 🛠 (référence → valeur, avec statut) ; après l'alphabet
    'data/dico.js',
    'data/initDATA.js',
    'config/fine_tuning_bounds.js',
    'physics/physics.js',
    'tuning.js',
    'geology/interieur.js',
    'convergence/compute.js',
    'convergence/clics.js',
    'data/hitran_lines_CO2.js',
    'data/hitran_lines_H2O.js',
    'data/hitran_lines_CH4.js',
    'data/cia_CO2_CO2.js',
    'spectroscopy/hitran.js',
    // Avant le pool : publie la source du worker pour le repli blob: (pages ouvertes en file://).
    'workers/spectral_slice_worker.js',
    'workers/worker_pool.js',
    'physics/climate.js',
    'atmosphere/calculations_atm.js',
    'aerosols/sulfate_ccn.js',
    'albedo/calculations_albedo.js',
    'geology/calculations_geology.js',
    'h2o/calculations_h2o.js',
    'ocean/sinks_ocean.js',
    'land/sinks_land.js',
    'co2/calculations_co2.js',
    'radiative/calculations.js',
    'radiative/solaire.js',
    'data/paleogeo_zones.js',   // paléogéographie zonale (PaleoDEM Scotese & Wright 2018), lue par physics/calottes.js
    'physics/calottes.js',      // calottes continentales (profil plastique + bilan de masse)
    'physics/meridien.js',   // bilan méridien (North 1981) : utilise SOLAIRE.albedoMu, lu par calculations_albedo
    'convergence/calculations_flux.js',
    'api.js'
];
