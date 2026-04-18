// File: API_BILAN/tuning.js - Interpolation barycentre fine-tuning
// Desc: Logique autonome d'interpolation [0-100 %] entre bornes min/max pour chaque paramètre
//       incertain. Applique le barycentre (DATA['🎚️'].baryByGroup) aux paramètres CLOUD_SW, SCIENCE, SOLVER, RADIATIVE.
//       Aucune dépendance DOM — utilisable API seule.
// Version 1.0.8
// Date: 2026-04-18
// Logs:
// - v1.0.8: retrait fillDataTuningFromBary() automatique au chargement du module (init pages / bench)
// - v1.0.6: syncRadiativeConfig — DATA['🎚️'].RADIATIVE.H2O_EDS_SCALE → EARTH.H2O_EDS_SCALE. Remplace le recalcul dynamique 0.92·√P_ratio·CO2_factor (physics.js v2.0.8) par un paramètre fine-tuning dédié.
// - v1.0.4: syncSolverConfig — firstSearchStepCapK = valeur SOLVER si >0 sinon undefined (une affectation, pas if/else delete)
// - v1.0.3: syncSolverConfig — firstSearchStepCapK seulement si >0 ; sinon delete (défaut 0 = pas de plafond)
// - v1.0.2: syncSolverConfig → CONFIG_COMPUTE.firstSearchStepCapK si SOLVER.FIRST_SEARCH_STEP_CAP_K défini
// - v1.0.1: sous-objets DATA['🎚️'][group] créés si absents ; bary % manquant → 100 (sync scie/parent)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

(function () {
    'use strict';

    // --- Helpers internes ---

    /**
     * Interpole une valeur entre min et max selon un pourcentage [0–100].
     * 0 % → min, 100 % → max.
     */
    function interpolate(target, baryPercent) {
        var min = Number(target.min);
        var max = Number(target.max);
        var alpha = Math.max(0, Math.min(1, Number(baryPercent) / 100));
        return min + (max - min) * alpha;
    }

    /**
     * Retourne les targets FINE_TUNING_BOUNDS filtrées par groupe effectif.
     * SCIENCE = targets dont baryGroup === 'SCIENCE'.
     * CLOUD_SW = targets du group CLOUD_SW sans baryGroup ou baryGroup === 'CLOUD_SW'.
     * Autres = targets dont group === groupKey.
     */
    function targetsByGroup(groupKey) {
        var bounds = window.FINE_TUNING_BOUNDS;
        if (!bounds || !bounds.targets) return [];
        if (groupKey === 'SCIENCE') {
            return bounds.targets.filter(function (t) { return t.baryGroup === 'SCIENCE'; });
        }
        if (groupKey === 'CLOUD_SW') {
            return bounds.targets.filter(function (t) { return t.group === 'CLOUD_SW' && (t.baryGroup == null || t.baryGroup === 'CLOUD_SW'); });
        }
        return bounds.targets.filter(function (t) { return t.group === groupKey; });
    }

    /**
     * Propage les valeurs SOLVER de DATA['🎚️'] vers CONFIG_COMPUTE.
     */
    function syncSolverConfig() {
        var S = window.DATA['🎚️'].SOLVER;
        if (!window.CONFIG_COMPUTE) return;
        window.CONFIG_COMPUTE.tolMinWm2 = S.TOL_MIN_WM2;
        window.CONFIG_COMPUTE.maxSearchStepK = S.MAX_SEARCH_STEP_K;
        window.CONFIG_COMPUTE.maxSearchStepLargeK = S.MAX_SEARCH_STEP_LARGE_K;
        window.CONFIG_COMPUTE.largeDeltaFactor = S.LARGE_DELTA_FACTOR;
        var cap = S.FIRST_SEARCH_STEP_CAP_K;
        window.CONFIG_COMPUTE.firstSearchStepCapK = (Number.isFinite(cap) && cap > 0) ? cap : undefined;
    }

    /**
     * Propage les valeurs RADIATIVE de DATA['🎚️'] vers EARTH (constantes physiques tunables).
     * H2O_EDS_SCALE : multiplicateur global κ_H₂O (cible littérature Schmidt 2010 : ~75 W/m² EDS H₂O).
     */
    function syncRadiativeConfig() {
        var R = window.DATA['🎚️'].RADIATIVE;
        if (!R || !window.EARTH) return;
        window.EARTH.H2O_EDS_SCALE = R.H2O_EDS_SCALE;
    }

    /**
     * Applique le barycentre pour un groupe donné.
     * Met à jour baryByGroup[groupKey] puis interpole chaque paramètre du groupe.
     */
    function applyBaryGroup(groupKey, percentRaw) {
        var T = window.DATA['🎚️'];
        var pct = Math.max(0, Math.min(100, Number.isFinite(Number(percentRaw)) ? Number(percentRaw) : 100));
        T.baryByGroup[groupKey] = pct;
        var targets = targetsByGroup(groupKey);
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (!T[target.group]) T[target.group] = {};
            T[target.group][target.key] = interpolate(target, pct);
        }
    }

    /**
     * Remplissage complet DATA['🎚️'].CLOUD_SW et .SOLVER depuis baryByGroup.
     * Parcourt toutes les targets de FINE_TUNING_BOUNDS et interpole selon le baryGroup effectif.
     */
    function fillDataTuningFromBary() {
        var T = window.DATA['🎚️'];
        var bg = T.baryByGroup;
        var bounds = window.FINE_TUNING_BOUNDS;
        if (!bounds || !bounds.targets) return;
        for (var i = 0; i < bounds.targets.length; i++) {
            var target = bounds.targets[i];
            var baryKey = target.baryGroup || target.group;
            if (!T[target.group]) T[target.group] = {};
            var pctRaw = bg[baryKey];
            var pct = Number.isFinite(Number(pctRaw)) ? Number(pctRaw) : 100;
            T[target.group][target.key] = interpolate(target, pct);
        }
        syncSolverConfig();
        syncRadiativeConfig();
    }

    // --- Fonction publique ---

    /**
     * Point d'entrée : applique un payload de tuning à DATA['🎚️'] puis propage.
     *
     * Formats acceptés :
     *   1. Objet baryByGroup simple : { CLOUD_SW: 70, SCIENCE: 100, SOLVER: 100 }
     *      → chaque groupe est interpolé indépendamment.
     *   2. Objet complet (compatibilité CO2 sync_panels) :
     *      { baryByGroup: { CLOUD_SW: 70, ... }, CLOUD_SW: {...}, SOLVER: {...}, updates: [...] }
     *
     * @param {object} payload - pourcentages par groupe ou payload complet
     */
    function applyTuningPayload(payload) {
        if (!payload || !window.DATA || !window.DATA['🎚️']) return;
        var T = window.DATA['🎚️'];

        // Format 2 : payload complet avec baryByGroup + valeurs directes (compatibilité CO2)
        if (payload.baryByGroup) {
            if (payload.baryByGroup.CLOUD_SW !== undefined) T.baryByGroup.CLOUD_SW = payload.baryByGroup.CLOUD_SW;
            if (payload.baryByGroup.SCIENCE !== undefined) T.baryByGroup.SCIENCE = payload.baryByGroup.SCIENCE;
            if (payload.baryByGroup.SOLVER !== undefined)  T.baryByGroup.SOLVER  = payload.baryByGroup.SOLVER;
            if (payload.baryByGroup.HYSTERESIS !== undefined) T.baryByGroup.HYSTERESIS = payload.baryByGroup.HYSTERESIS;
            // Si valeurs directes fournies, les appliquer
            if (payload.CLOUD_SW) T.CLOUD_SW = Object.assign({}, T.CLOUD_SW, payload.CLOUD_SW);
            if (payload.SOLVER)   T.SOLVER   = Object.assign({}, T.SOLVER, payload.SOLVER);
            if (payload.updates && Array.isArray(payload.updates)) {
                payload.updates.forEach(function (u) {
                    if (!T[u.group]) T[u.group] = {};
                    T[u.group][u.key] = u.value;
                });
            }
            // Re-interpoler depuis les baryByGroup (les valeurs directes sont écrasées par l'interpolation)
            fillDataTuningFromBary();
            return;
        }

        // Format 1 : objet simple { CLOUD_SW: 70, SCIENCE: 100, SOLVER: 100 }
        if (payload.CLOUD_SW !== undefined) applyBaryGroup('CLOUD_SW', payload.CLOUD_SW);
        if (payload.SCIENCE !== undefined)  applyBaryGroup('SCIENCE', payload.SCIENCE);
        if (payload.SOLVER !== undefined)   applyBaryGroup('SOLVER', payload.SOLVER);
        syncSolverConfig();
        syncRadiativeConfig();
    }

    // --- Exports window ---

    window.applyTuningPayload = applyTuningPayload;
    window.fillDataTuningFromBary = fillDataTuningFromBary;

})();
