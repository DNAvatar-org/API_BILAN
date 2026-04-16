// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.3.19
// Date: [April 15, 2026] [12:00 UTC+1]
// logs :
// - v1.3.19: spectralBandLogoImgPx / EmojiPx défaut 18 px (bandes spectre, taille historique)
// - v1.3.18: spectralBandLogoImgPx / EmojiPx / ImgPxByEmoji (plot.js bandes [ ] : PNG vs UTF‑8)
// - v1.3.17: spectralEdsSunLambdaUm défaut 10 μm (repères EDS/Soleil sur le graphe)
// - v1.3.16: CONFIG_COMPUTE spectralBandIndicatorLiftPx, spectralEdsSunLambdaUm, spectralEdsSunStackLiftPx (plot.js marqueurs spectraux)
// - v1.3.15: commentaire 🐊 libellé UI « Éocène »
// - v1.3.14: CONFIG_COMPUTE.logCo2RadiativeDiagnostic (🔎 CO₂ atmosphère + 🧲📛🏭 pas hyst ; aligné configsAll)
// - v1.3.13: baryByGroupDefault.HYSTERESIS 100 (aligné initDATA 🎚️)
// - v1.3.12: CONFIG_COMPUTE.logIceFractionDiagnostic — trace chaîne 🍰🪩🧊 (polar + mer gelée + verrous + surface finale)
// - v1.3.11: 🥟 🕰 — action 🌋 (🔺🍰⚽ +2 % / clic) voile SW stratosphérique ; CONFIG_COMPUTE.hystStratosphericVeilExtra01
// - v1.3.10: hysteresis 1 🌡️🧮 290 K — graine « branche chaude » avant scan CO₂↓ (le seuil hystérésis reste trouvé par l’algo)
// - v1.3.9: co2OceanPartitionInRadiativeConvergence=false par défaut (pompe mer hors convergence naturelle ; anthropique plus tard)
// - v1.3.4: repères Ma affichage éditeur plaques alignés ▶ (⚫ 5000 Ma, 🔥 4500, 🦠 4000, 🌿 500, 🦕 250)
// - v1.3.5: (obsolète) 🌊🏭🧲 par époque — retiré en v1.3.8 ; pompe CO₂ mer = CONFIG_COMPUTE + jauges
// - v1.3.6: 📅 hystérésis → hysteresis 1 ; 📅 ⛰ (époque) → hysteresis 2 (⛄ 🏔 inchangés)
// - v1.3.7: hysteresis 2 → hidden:true (même classe epoch-text que hysteresis 1 sur frise verticale)
// - v1.3.8: retrait 🌊🏭🧲 de tous les blocs TIMELINE (pompe océan hors époque)
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.2.1: add sulfate proxy mass ⚖️✈ for 🚂/📱 and disable verbose debug flags
// - v1.2.2: paramètres solveur issus de static/tuning/model_tuning.js (source unique tuning)
// - v1.2.3: fallback synchrone des paramètres solveur si window.TUNING non chargé
// - v1.2.4: 🌿 = Paléozoïque (500–250 Ma), ordre chrono Protérozoïque → Paléozoïque → Mésozoïque → Cénozoïque
// - v1.2.5: baryByGroupDefault (CLOUD_SW/SCIENCE/SOLVER %) pour init DATA['🎚️'].baryByGroup dans initDATA.js
// - v1.2.6: dates simplifiées Protérozoïque ◀ 500 Ma, Paléozoïque 500–250 Ma ; 🏔 ▶ 33 Ma déjà en place
// - v1.2.7: Cénozoïque découpé : 🦣 66–50 Ma, 🐊 PETM 50–35 Ma, hysteresis 2 (ex-⛰) 35–33 Ma, 🏔 33–23 Ma
// - v1.2.8: commentaire 🦣 sans mention erronée « Crétacé » (🌿 = Paléozoïque)
// - v1.2.9: ❄️ Quaternaire (▶ 2 Ma) — calotte arctique / cycles glaciaires ; entre 🏔 et 🚂
// - v1.3.0: 🚂 (Industriel / 1800) retiré du tableau timeline (frise ❄️ → 📱) ; config physique 1800 référencée ailleurs si besoin
// - v1.3.1: 📱 🕰 — une seule action ⛽ par tranche (retrait 🛢 des buckets 2025/2050/2075)
// - v1.3.2: doc convention 📱 — tranche 2000 : 850e9 ↔ +850Gt en UI (pas SI Gt=1e12 kg ; cycle CO₂ / puits en attente TODO)
// - v1.3.3: libellé UI 🐊 « Éocène » (ex Hyperthermie éocène ; ex Terre étouffe PETM)
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': emoji époque, '▶': number, '◀': number, ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
//
// ============================================================================
// 🔒 LUMINOSITÉ SOLAIRE — NE PAS MODIFIER
// Formule de Gough (1981), Solar Physics 74:21 — physique nucléaire stellaire :
//   L(t_ago) = L☉ / (1 + 0.4 × t_ago / 4.57)
//   L☉ = 3.828e26 W (IAU 2015 Resolution B3)
//   t_ago = temps avant présent en Ga ; 4.57 Ga = âge du Soleil
//   🧲☀️ = L / (4π × AU²), AU = 1.496e11 m → TSI = 1361 W/m² (Kopp & Lean 2011)
//   🧲☀️🎱 = 🧲☀️ / 4 (géométrie sphérique)
// Confirmé par Bahcall, Pinsonneault & Basu (2001), ApJ 555:990 (Standard Solar Model).
// Toute valeur de 🔋☀️ DOIT être calculée avec cette formule. Pas d'arrondi arbitraire.
// ============================================================================
//
// Réfs 🌡️🧮 (temp. surface) : Kienert & Feulner Clim. Past 9:1841 (2013) ; Charnay 2017 ; PNAS 2018 ;
// Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014. Valeurs au DÉBUT de chaque époque (parcours temporel à venir).
// Réfs masses gaz (⚖️🏭, ⚖️🐄) : doc/VALIDATION_CONFIG_GAZ.md
const timeline = [
    {// Corps noir
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        // 🌡️🧮 : ~255 K équilibre corps noir (σT⁴ = S/4) — -18 °C
        '🌡️🧮': 255,
        '🧲🔬': 0.3,
        '🔋☀️': 2.663e26, // 🔒 Gough (1981) : L☉/(1+0.4×5.0/4.57) = 69.6% — NE PAS MODIFIER
        '🔋🌕': 0, // core_temperature (Pas de noyau en K)
        '🍰🧲🌕': 0.0, // geothermal_diffusion_factor (Facteur de diffusion du noyau vers la surface 0-1)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '📏🌊': 0.0, // Profondeur moyenne océans en km (valeur par défaut, pas d'eau pour cette époque)
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
                '🔺⚖️💧☄️': 3.2e17, // water_added_kg (~+10% d'albedo en ⚫ froid avec la formule actuelle)
                '🔺⏳': 100,
            },
            '🎇': {
                '⏩': '🔥' // Transition vers Hadéen
            }
        }
    },
    {// Hadéen
        '📅': '🔥', // Hadéen — début, juste après impact formant la Lune (ordre 100–1000 ans)
        '▶': 4.5e9,
        '◀': 4.0e9,
        // 🌡️🧮 : océan de magma ~2000–2500 K (surface en fusion) — ~2177 °C
        '🌡️🧮': 2450,
        '🧲🔬': 1.7,//596,
        '🔋☀️': 2.746e26, // 🔒 Gough (1981) : L☉/(1+0.4×4.5/4.57) = 71.7% — NE PAS MODIFIER
        '🔋🌕': 1.23e21, // core_power_watts (Puissance géothermique totale calculée depuis 🧲🌕 = 2 MW/m² et R = 7008.1 km)
        // Flux géothermique colossal (2 MW/m²) pour maintenir la surface en fusion (~2400K)
        // Phase immédiate post-impact (océan de magma rayonnant) ; le temps peut avancer dans la simu
        '🧲🌕': 2000000, // geothermal_flux (W/m²) - hardcodé pour cette époque
        '📐': 7008.1, // Rayon de la planète en km
        '🍎': 9.8, // Gravité en m/s²
        '📏🌊': 0.0, // Profondeur moyenne océan de magma en km (Hadéen)
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
                '🔺📐': -120, // delta Rayon de la planète en km -> '📐': 6371,
                '🔺⏳': 100,       // durée d'un tic en Ma (500 Ma / 10 tics ≈ 50 Ma/tic)
            },
            '☄️': {
                '🔺⚖️💧☄️': 1.0e20, // water_added_kg (~10% de l'eau initiale)
                '🔺📐': -120, // delta Rayon de la planète en km -> '📐': 6371,
                '🔺⏳': 100,       // durée d'un tic en Ma (météorites)
            }
        },
        '🌱': 0.0  // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
    },
    {// Archéen
        '📅': '🦠', // Archéen — début (4 Ga) = Archéen précoce
        '▶': 4.0e9,
        '◀': 2.5e9,
        // 🌡️🧮 : 288 K (15°C cible indicative). Lit. 281–303 K plausible (Charnay 2017, Kienert 2013). — 15 °C
        // 288 K = état stable documenté (Clim. Past 9:1841, Astrobiology 2014). Parcours temporel à venir.
        '🌡️🧮': 288,
        '🌡️📚': [281, 303], // Fourchette littérature (K) — disclaimer si T simulée hors plage
        '🧲🔬': 0.01,  // Précision stricte (tol ~0.4 W/m²) pour stabilité anim même époque
        '🔋☀️': 2.836e26, // 🔒 Gough (1981) : L☉/(1+0.4×4.0/4.57) = 74.1% — NE PAS MODIFIER
        '🔋🌕': 1.5e14, // core_power_watts (Puissance géothermique totale ~150 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 4.7, // Profondeur moyenne océans en km (Archéen, moins d'eau)
        '🐚': 1.0, // Facteur relief sous-marin 
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.85, // Surface océanique potentielle (80% - moins de continents qu'aujourd'hui)
            '🍰🗻🏔': 0.00, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15  // Terres basses (15% - premiers continents)
        },
        '🍰🪩🏜️': 0.0,  // Forcer couverture désert à 0
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Simulation parameters - Quantités en kg. Recalib post-fix solaire 80% (272 W/m² vs ancien 320 W/m²)
        // Faint Young Sun Paradox : soleil ~74% à 4 Ga → CO₂+CH₄ élevés requis pour maintenir ~288 K.
        // ✅ CO₂ : 1.5e18 kg → ~0.19 bar CO₂ partiel (~8.7% molaire, ~87 000 ppm).
        //    Sleep & Zahnle 2001 (JGR) : 0.2–10 bar early Archean ✓
        //    Charnay et al. 2013 (GRL) : 0.1–0.5 bar requis pour eau liquide avec soleil faible ✓
        //    Charnay et al. 2020 (Space Sci. Rev.) : CO₂ 10–2500× PAL consensus ✓
        //    Krissansen-Totton et al. 2018 (Sci. Adv.) : ~0.1 bar à 4 Ga (cycle C-Si) ✓
        //    NB : contraintes paléosols (Rye 1995, Driese 2011) ← late Archean (< 3 Ga) seulement, pas applicables ici.
        // ✅ CH₄ : 3.0e16 kg → ~4 780 ppm molaire (~0.19% atm).
        //    Haqq-Misra et al. 2008 (Astrobiology) : jusqu'à 10 000 ppm, brume si CH₄/CO₂ > 0.1 ✓
        //    Pavlov et al. 2000 : 100–1 000 ppm ; Charnay 2020 : 100–17 000 ppm ✓
        // ✅ Ratio CH₄/CO₂ = 3.0e16 / 1.5e18 = 0.02 — sous le seuil de brume organique (0.1, Haqq-Misra 2008) ✓
        '⚖️🏭': 1.5e18, // co2_kg — ~0.19 bar, validé Archéen précoce (4 Ga) — voir commentaire ci-dessus
        '⚖️🐄': 3.0e16, // ch4_kg — ~4 780 ppm, CH₄/CO₂=0.02 < 0.1 (pas de brume) — voir commentaire ci-dessus
        '⚖️💧': 1.8e21, // h2o_kg (~129% actuel, litt. Harvard océans +26%)
        '⚖️🫁': 0, // o2_kg
        '⚖️💨': 9.918e18, // n2_kg (base azote Archéen, lit. ~1–2× PAL ; Marty 2013)
        '⚖️✈': 0, // proxy_sulfates
        '⚖️🫧': 1.145e19, // Masse atmosphère = N₂ + CO₂ + CH₄ = 9.918e18 + 1.5e18 + 3e16 (calculée, ~2.2 bar)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '💫': {
                '🔺🌡️💫': 0,     // pas de dérive T° par tic (équilibre ~288 K)
                '🔺⏳': 500,       // durée d'un tic en Ma (bouton timeline)
            },
            // Barycentre (📿💫+📿☄️)/maxTics → interpolation des params entre ▶ et ◀
            // 🔒 ☀️ n'est PAS dans 🔀 : luminosité calculée par Gough (1981) depuis la date, pas interpolée linéairement
            '🔀': ['⚖️', '🌕'],
            '◀': {
                '⚖️': { '⚖️💧': 1.3e21, '⚖️🫧': 5.19e18, '⚖️🏭': 4.7e16, '⚖️🐄': 2.85e14, '⚖️🫁': 0, '⚖️✈': 0, '⚖️💨': 5.138e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        },
        '🌱': 0.0  // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
    },
    {// Protérozoïque
        '📅': '🥟', // Protérozoïque
        '▶': 2.5e9,
        '◀': 750e6,
        // 🌡️🧮 : ~280–290 K (lit. Protérozoïque) — 12 °C
        '🌡️🧮': 285,
        '🧲🔬': 0.01,
        '🔋☀️': 3.140e26, // 🔒 Gough (1981) : L☉/(1+0.4×2.5/4.57) = 82.0% — NE PAS MODIFIER
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
        '⚖️🫁': 1.5e16,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '🌋': { '🔺🍰⚽': 0.02 },
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 590 },
        },
        '🌱': 0.0  // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
    },
    // hysteresis 1 = Pré–Boule de neige (750–720 Ma) : CO₂ élevé (⚖️🏭) ; graine T pour convergence AVANT le scan hystérésis.
    // L’instant hystérésis = quand on baisse un peu le CO₂ et que T s’effondre — c’est l’algo (scie_) qui le cherche.
    // Ici 🌡️🧮 = amorce solveur sur branche encore tiède (≈290 K), pas le seuil ni la T finale après chute.
    {//hysteresis 1
        '📅': 'hysteresis 1', // id stable (ex hystérésis)
        hidden: true, // interne (non cliquable / non affiché dans la frise)
        '▶': 750e6,
        '◀': 720e6,
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // même ordre que ⛄ (on garde la luminosité du Néoprotérozoïque)
        '🔋🌕': 8.0e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.75, '🍰🗻🏔': 0.08, '🍰🗻🌍': 0.17 },
        '⚖️🫧': 5.15e18,
        // CO₂ réglable ici, en partant chaud. Par défaut: même valeur que ⛄.
        '⚖️🏭': 1.0e16,
        '⚖️🐄': 1.0e14,
        '⚖️💧': 1.2e21,
        '⚖️🫁': 1.5e16,
        //'⚖️✈': 8.0e15,
        '🕰': { '💫': { '🔺🌡️💫': 0, '🔺⏳': 30 } },
        '🌱': 0.0
    },
    // ⛄ = Boule de neige (720–600 Ma) : glaciation globale Néoprotérozoïque (Sturtien ~717 Ma, Marinoen ~650 Ma)
    // Réfs : Hoffman et al. 1998 (Science), Pierrehumbert 2011, Hoffman & Schrag 2002
    {// Boule de neige
        '📅': '⛄', // Boule de neige (720–600 Ma) — Snowball Earth
        // Pas de forçage ⛄ : la physique (T < T_freeze → gel océan) produit le snowball
        '▶': 720e6,
        '◀': 600e6,
        // 🌡️🧮 : ~240 K (-33°C) — lit. Pierrehumbert 2011 : 220–250 K surface moyenne snowball
        '🌡️🧮': 281,
        '🧲🔬': 0.01,
        '🔋☀️': 3.592e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.75/4.57) = 93.8% — NE PAS MODIFIER
        '🔋🌕': 8.0e13, // core_power_watts (~80 TW, Néoprotérozoïque)
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6, // Profondeur océans (Néoprotérozoïque)
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.73,
            '🍰🗻🏔': 0.15,
            '🍰🗻🌍': 0.12
        },
        '⚖️🫧': 5.15e18,
        // CO₂ bas au début (cause du snowball), puis accumulation volcanique pendant la glaciation
        // Lit. : CO₂ ~100–1000 ppm pré-snowball ; ~350× PAL (~100 000 ppm) pour en sortir (Hoffman 1998)
        '⚖️🏭': 0.99e16,  // co2_kg (~3800 ppm, valeur moyenne représentative)
        '⚖️🐄': 1.0e12,  // ch4_kg (faible, méthanogènes sous glace)
        '⚖️💧': 1.2e21,  // h2o_kg (~86% actuel, océans sous glace)
        '⚖️🫁': 1.5e16,  // o2_kg (faible, post-GOE mais pré-explosion cambrienne)
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 150 },
        },
        '🌱': 0.0  // Avant -450 Ma : pas de plantes → 🍰🪩🌳 = 0
    },
    // 🌿 = Paléozoïque (600–250 Ma) : même niveau que Mésozoïque/Cénozoïque (ères), zéro chevauchement.
    // Ordre chronologique : … Protérozoïque → ⛄ Boule de neige → Paléozoïque → Mésozoïque → Cénozoïque …
    {// Paléozoïque 🌿
        '📅': '🌿', // Paléozoïque (600–250 Ma)
        '▶': 600e6,
        '◀': 250e6,
        // 🌡️🧮 : ~285–295 K (lit. Paléozoïque : Ordovicien–Dévonien chaud, Carbonifère–Permien glaciations) — 17 °C
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.638e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.6/4.57) = 95.0% — NE PAS MODIFIER
        '🔋🌕': 6.5e13, // core_power_watts
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6, // Profondeur océans (Paléozoïque, 600–250 Ma)
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
        '⚖️🫁': 1.5e17,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 175 },
        },
        '🌱': 0.31  // Après -400 Ma : forêt potentielle ~31 % terres (FAO 2020)
    },
    {// Mésozoïque 🦕
        '📅': '🦕', // Mésozoïque (252–66 Ma) — texture fonds/00200Ma.png (ancien 250Ma), événement 50 Ma
        // 🦕 Mésozoïque : serre chaude, pas de calottes polaires
        '⛄': 0,
        '▶': 250e6,
        '◀': 66e6,
        // 🌡️🧮 : ~295–305 K (lit. Mésozoïque) — 25 °C
        '🌡️🧮': 298,
        '🧲🔬': 0.1,
        '🔋☀️': 3.746e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.25/4.57) = 97.9% — NE PAS MODIFIER
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
            '🎇': { '⏩': '🦣' } // Big impact (K-Pg) → Cénozoïque
        },
        '🌱': 0.31
    },
    {// Cénozoïque 🦣
        '📅': '🦣', // Cénozoïque — Paléocène / début Éocène (66–50 Ma) ; limite K-Pg (~66 Ma), CO₂ modéré ~650 ppm
        '▶': 66e6,
        '◀': 50e6,
        '⛄': 0,
        '🌡️🧮': 290,
        '🧲🔬': 0.1,
        '🔋☀️': 3.806e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.066/4.57) — NE PAS MODIFIER
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
        '⚖️🏭': 5.0e15, // co2_kg (~650 ppm)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 16 },
        },
        '🌱': 0.31
    },
    {// Éocène 🐊
        '📅': '🐊', // Éocène (50–35 Ma), pic thermique / CO₂ élevé (ordre PETM) ; puis décroissance (altération silicates, Himalaya)
        '▶': 50e6,
        '◀': 35e6,
        '⛄': 0,
        '🌡️🧮': 297,
        '🧲🔬': 0.1,
        '🔋☀️': 3.811e26, // 🔒 Gough @ 0.050 Ga
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
        '⚖️🏭': 9.01e15, // co2_kg (~1750 ppm, ordre PETM / Éocène chaud)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 15 },
        },
        '🌱': 0.31
    },
    {// hysteresis 2
        '📅': 'hysteresis 2', // id stable (ex ⛰ prélude glaciaire 35–33 Ma)
        hidden: true, // même rendu frise que hysteresis 1 (epoch-text, pas epoch-btn)
        '▶': 35e6,
        '◀': 33e6,
        '⛄': 0.02,
        '🌡️🧮': 289,
        '🧲🔬': 0.08,
        '🔋☀️': 3.816e26, // 🔒 Gough @ 0.035 Ga
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
        '⚖️🏭': 5.15e15, // co2_kg (~1000 ppm, avant chute Oi-1)
        '⚖️🐄': 3.605e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.0815e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 2 },
        },
        '🌱': 0.31
    },
    // Grande Coupure (EO–Oi, ~33 Ma) : calotte Antarctique, refroidissement majeur
    {// 🏔 Grande Coupure
        '📅': '🏔',
        // 🏔 Grande Coupure : calotte Antarctique (~8.5% surface) — première glaciation polaire moderne
        '⛄': 0.085,
        '▶': 33e6,
        '◀': 23e6,
        '🌡️🧮': 285, // 12 °C
        '🧲🔬': 0.05,
        '🔋☀️': 3.817e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.033/4.57) = 99.7% — NE PAS MODIFIER
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 4.0e15,
        '⚖️🐄': 3.6e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.08e18,
        '⚖️✈': 1e12,
        '⚖️💨': 3.97e18,
        '🕰': {
            '💫': { '🔺🌡️💫': 0, '🔺⏳': 100 },
        },
        '🌱': 0.31
    },
    // Quaternaire (depuis ~2 Ma) : extension glaciaire hémisphère nord, cycles glaciaires-interglaciaires
    {//Quaternaire
        '📅': '❄️',
        '⛄': 0.11,
        '▶': 2e6,
        '◀': 400,
        '🌡️🧮': 287,
        '🧲🔬': 0.04,
        '🔋☀️': 3.827e26, // 🔒 Gough (1981) : L☉/(1+0.4×0.002/4.57) — NE PAS MODIFIER
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
        },
        '🌱': 0.31
    },
    {// Aujourd'hui 📱
        '📅': '📱', // Aujourd'hui (▶=2000 : clic 📱 = position 2000 ; fin de frise = 2100 en organigramme)
        '▶': 2000,
        '◀': 2100, // ticTime forward : 2000+25a/tic → 2025 après 1 tic, 2100 terminus
        // 🌡️🧮 : ~288.8 K (record chaud 2025) — 15.6 °C
        '🌡️🧮': 288.3, // 288.3 K (~15.1°C) — an 2000 [OBS] NASA GISS
        '🧲🔬': 0.010,
        '🔋☀️': 3.828e26, // 🔒 Gough (1981) : L☉/(1+0.4×0/4.57) = 100% (IAU 2015) — NE PAS MODIFIER
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
        // Échelle récente : 🔺⏳ = 0.000025 Ma → 25 ans par pas
        // 🕰 indexé par année : clic ⛽/🛢 injecte 🔺⚖️🏭 (masse CO₂) ; pas encore de cycle complet (airborne / océan → TODO)
        // Convention affichage « Gt » UI (events.js) : même chiffre que N dans N·1e9 — ex. tranche 2000 → 850e9 = +850Gt CO2
        '🕰': {
            2000: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 850e9 } }, // +850 Gt (année 2000), aligné tooltip
            2025: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 900e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 18e11 } },
            2050: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 600e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 12e11 } },
            2075: { '⛽': { '🔺⏳': 0.000025, '🔺⚖️🏭': 350e9 }, '🛢': { '🔺⏳': 0.000025, '🔺⚖️🏭': 7e11 } },
            '◀': {
                // ⚖️🏭 volontairement absent : CO₂ géré par accumulation manuelle (🔺⚖️🏭_cum)
                // ⚠️ TODO ⚖️🐄 CH4 2100 : ~3000 ppb → 8.6e12 kg (à recalibrer)
                '⚖️': { '⚖️💧': 1.4e21, '⚖️🫧': 5.15e18, '⚖️🐄': 8.6e12, '⚖️🫁': 1.18e18, '⚖️✈': 8.0e13, '⚖️💨': 3.97e18 },
                '🌕': { '🧲🌕': 0.127, '🔋🌕': 6.5e13 }
            }
        }
    }
];

window.TIMELINE = timeline;

// Hors frise TIMELINE (v1.3.0) : époque 🚂 pré-industriel — même schéma qu’une entrée timeline (fusion manuelle, tests, doc)
window.TIMELINE_EPOCH_PREINDUSTRIAL_1800 = {
    '📅': '🚂',
    '▶': 1800,
    '◀': 2025,
    '🌡️🧮': 287,
    '🧲🔬': 0.01,
    '🔋☀️': 3.828e26,
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
    '⚖️✈': 1.5e12,
    '⚖️💨': 3.97e18,
    '🕰': {
        '💫': { '🔺🌡️💫': 0, '🔺⏳': 0.0001 },
    },
    '🌱': 0.31
};

// Paramètres de calcul (convergence radiatif)
// Convention de source :
// - [OBS/CALIB] : valeur issue d'observations/littérature ou calibration sur observations
// - [EQ/NUM]    : valeur de schéma numérique, solveur ou stratégie de convergence
window.CONFIG_COMPUTE = window.CONFIG_COMPUTE || {};

// Partition CO₂ atmosphère ↔ océan (Henry) dans calculateCO2Partition : désactivée par défaut dans la boucle radiative.
// Réservée à un usage ultérieur (ex. ajout anthropique en fin de chaîne). Pas les calculs naturels ni l’hystérésis.
// Activer explicitement : CONFIG_COMPUTE.co2OceanPartitionInRadiativeConvergence = true
window.CONFIG_COMPUTE.co2OceanPartitionInRadiativeConvergence = false;
// Voile SW additionnel (0–1) depuis jauge hystérésis ⚽ ; s’ajoute à EPOCH['🍰⚽'] + 📜['🔺🍰⚽'] → DATA['🪩']['🍰⚽'] obstruction, DATA['🪩']['🍰🪩⚽']=1−🍰⚽
if (!Number.isFinite(Number(window.CONFIG_COMPUTE.hystStratosphericVeilExtra01))) {
    window.CONFIG_COMPUTE.hystStratosphericVeilExtra01 = 0;
}

// Valeurs par défaut des jauges fine-tuning (% ). Utilisées uniquement à l'init de DATA['🎚️'].baryByGroup (initDATA.js). DATA seule ref ensuite.
window.CONFIG_COMPUTE.baryByGroupDefault = { CLOUD_SW: 100, SCIENCE: 100, SOLVER: 100, HYSTERESIS: 100 };

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
// Désactivé par défaut :
// Le verrou glace doit venir de la physique (partition eau + gel océan) ou des valeurs per-epoch (EPOCH['⛄']),
// sinon ça casse ⛄ "Boule de neige" (750–600 Ma) en limitant la glace à ~8.5%.
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
// Repères spectre (visu plot.js) : monter les [ ] molécules ; pile EDS + Soleil (image ☀️) centrée en λ
window.CONFIG_COMPUTE.spectralBandIndicatorLiftPx = 14;
window.CONFIG_COMPUTE.spectralEdsSunLambdaUm = 10;
window.CONFIG_COMPUTE.spectralEdsSunStackLiftPx = 26;
// Bandes [ ] spectre : PNG (charsImages) vs emoji ; ImgPxByEmoji = map clef emoji -> px (ex. une seule entree pour CH4)
window.CONFIG_COMPUTE.spectralBandLogoImgPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoEmojiPx = 18;
window.CONFIG_COMPUTE.spectralBandLogoImgPxByEmoji = {};
// Logs diagnostics
window.CONFIG_COMPUTE.logIceFixedDiagnostic = false;
// true : une ligne par calculateAlbedo (T, mer gelée, facteur polaire, cibles, verrous hyst, 🍰🪩🧊 après normalisation surfaces)
window.CONFIG_COMPUTE.logIceFractionDiagnostic = false;
window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic = false;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = false;
window.CONFIG_COMPUTE.logIrisDiagnostic = false;

