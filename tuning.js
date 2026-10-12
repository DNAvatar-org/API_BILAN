// File: API_BILAN/tuning.js - Interpolation barycentre fine-tuning
// Desc: Logique autonome d'interpolation [0-100 %] entre bornes min/max pour chaque paramètre
//       incertain. Applique le barycentre (DATA['🎚️'].baryByGroup) aux paramètres CLOUD_SW, SCIENCE, HYSTERESIS, RADIATIVE.
//       Aucune dépendance DOM — utilisable API seule.
//       ⚠️ Groupe SOLVER retiré : calibration statique via window.TUNING.SOLVER (source unique lue par calculations_flux.js).
// Version 1.2.0
// - v1.2.0: plus de cible `fixed` (factorTropopause → CONFIG_COMPUTE) : interpolate n'a plus de cas particulier.
// Date: 2026-10-10
// Logs:
// - v1.1.0: PAS DE GARDES. Un seul format de payload ({ baryByGroup }) : le format « { CLOUD_SW: 70, … } »
//   (applyBaryGroup) et les valeurs directes (CLOUD_SW / updates, aussitôt écrasées par l'interpolation)
//   n'avaient plus d'appelant. factorTropopause = cible ordinaire avec `fixed` (fine_tuning_bounds v1.3.16) :
//   plus de cas particulier ni de CONFIG_COMPUTE.radiativeFactorTropopauseFixed. Plus de création de
//   sous-objets à la volée (DATA['🎚️'] les a tous), plus de tests sur FINE_TUNING_BOUNDS.
// - v1.0.20: doc `fixed` corrigée — réservé à une valeur déterminée AILLEURS, jamais à geler une
//   inconnue. Un paramètre sans fondement scientifique RESTE dans le barycentre : c'est justement
//   son rôle de dire qu'on ne sait pas.
// - v1.0.19: `fixed` générique sur une cible FINE_TUNING_BOUNDS — la sort du barycentre sans cas
//   particulier dans ce fichier.
// - v1.0.18: RADIATIVE.factorTropopause — si CONFIG_COMPUTE.radiativeFactorTropopauseFixed != null, valeur fixe (hors bary SCIENCE) ; sinon interp. comme avant via atmPct.
// - v1.0.17: doc factorTropopause — useFactorTropopause défaut true (config v1.4.50).
// - v1.0.16: doc syncRadiativeConfig — factorTropopause appliqué seulement si CONFIG_COMPUTE.useFactorTropopause (ATM v1.2.1).
// - v1.0.15: syncRadiativeConfig — commentaire RADIATIVE.factorTropopause (ATM, pas EARTH).
// - v1.0.14: ATM obligatoire (crash-first). Suppression des fallbacks CLOUD_SW/SCIENCE quand ATM absent/invalide ; throw explicite.
// - v1.0.13: bary ATM source unique (🎚️.baryByGroup.ATM). CLOUD_SW et SCIENCE sont forcés à la même valeur ATM dans applyBaryGroup/fillData/applyTuningPayload.
// - v1.0.12: expositions regroupées sous nouveau namespace window.TUNING (applyTuningPayload, fillDataTuningFromBary). Doublons window.foo retirés. Consommateurs migrés : api.js, ui/main.js, sync_panels.js, API_BILAN/doc/epoch_bench.html.
// - v1.0.11: syncRadiativeConfig — retrait garde silencieuse `if (!R || !window.EARTH) return` (crash-first). Pré-requis : physics.js chargé avant tuning.js (loader_panels.js v1.1.18).
// - v1.0.10: auto-init fillDataTuningFromBary() à la fin du module — corrige scie/visu qui restaient aux defaults bruts (13.4°C au lieu de 15.35°C pour 📱 2000). Bench (iframe, recharge stack complet) écrase ensuite via applyTuningPayload → idempotent.
// - v1.0.9: retrait syncSolverConfig + gestion SOLVER dans applyTuningPayload / fillDataTuningFromBary (plus de bary SOLVER, plus de CONFIG_COMPUTE.xxx dead).
// - v1.0.8: retrait fillDataTuningFromBary() automatique au chargement du module (init pages / bench)
// - v1.0.6: syncRadiativeConfig — DATA['🎚️'].RADIATIVE.H2O_EDS_SCALE → EARTH.H2O_EDS_SCALE. Remplace le recalcul dynamique 0.92·√P_ratio·CO2_factor (physics.js v2.0.8) par un paramètre fine-tuning dédié.
// - v1.0.1: sous-objets DATA['🎚️'][group] créés si absents ; bary % manquant → 100 (sync scie/parent)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

(function () {
    'use strict';

    /**
     * Valeur d'une cible pour un barycentre donné (0 % → min, 100 % → max).
     * Ce qu'on CONNAÎT se calcule dans le code et quitte les targets ; ce qu'on IGNORE reste dans le barycentre.
     */
    function interpolate(target, baryPercent) {
        const alpha = Math.max(0, Math.min(1, baryPercent / 100));
        return target.min + (target.max - target.min) * alpha;
    }

    /**
     * Propage les valeurs RADIATIVE de DATA['🎚️'] vers EARTH (constantes physiques tunables).
     * H2O_EDS_SCALE : multiplicateur global κ_H₂O (cible littérature Schmidt 2010 : ~75 W/m² EDS H₂O).
     */
    function syncRadiativeConfig() {
        window.EARTH.H2O_EDS_SCALE = window.DATA['🎚️'].RADIATIVE.H2O_EDS_SCALE;
    }

    /** % fini, borné à [0, 100] ; un % absent ou non numérique est une erreur. */
    function requirePercent(percentRaw, label) {
        if (!Number.isFinite(percentRaw)) throw new Error('[tuning.js] ' + label + ' requis et invalide: ' + String(percentRaw));
        return Math.max(0, Math.min(100, percentRaw));
    }

    /**
     * Remplissage complet DATA['🎚️'].CLOUD_SW / .HYSTERESIS / .RADIATIVE depuis baryByGroup.
     * Jauge unique ATM : CLOUD_SW et SCIENCE prennent toujours la valeur d'ATM.
     */
    function fillDataTuningFromBary() {
        const T = window.DATA['🎚️'];
        const bg = T.baryByGroup;
        const atmPct = requirePercent(bg.ATM, 'baryByGroup.ATM');
        bg.ATM = atmPct;
        bg.CLOUD_SW = atmPct;
        bg.SCIENCE = atmPct;
        const targets = window.FINE_TUNING_BOUNDS.targets;
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const baryKey = ('baryGroup' in target) ? target.baryGroup : target.group;
            const pct = requirePercent(bg[baryKey], 'baryByGroup.' + baryKey);
            T[target.group][target.key] = interpolate(target, pct);
        }
        syncRadiativeConfig();
    }

    /**
     * Point d'entrée : { baryByGroup: { ATM: %, HYSTERESIS: %, … } } — seuls les groupes présents changent,
     * puis tout DATA['🎚️'] est réinterpolé.
     */
    function applyTuningPayload(payload) {
        Object.assign(window.DATA['🎚️'].baryByGroup, payload.baryByGroup);
        fillDataTuningFromBary();
    }

    window.TUNING = {
        applyTuningPayload: applyTuningPayload,
        fillDataTuningFromBary: fillDataTuningFromBary
    };

    // Auto-init : interpole DATA['🎚️'] depuis baryByGroup × FINE_TUNING_BOUNDS dès que le module est chargé.
    // Pré-requis : initDATA.js + fine_tuning_bounds.js + physics.js chargés avant (engine_manifest.js).
    fillDataTuningFromBary();

})();
