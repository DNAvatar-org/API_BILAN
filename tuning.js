// File: API_BILAN/tuning.js - Interpolation barycentre fine-tuning
// Desc: Logique autonome d'interpolation [0-100 %] entre bornes min/max pour chaque paramètre
//       incertain. Applique le barycentre (DATA['🎚️'].baryByGroup) aux paramètres CLOUD_SW, SCIENCE, HYSTERESIS, RADIATIVE.
//       Aucune dépendance DOM — utilisable API seule.
//       ⚠️ Groupe SOLVER retiré : calibration statique via window.TUNING.SOLVER (source unique lue par calculations_flux.js).
// Version 1.4.0
// - v1.4.0 (2026-10-13): TUNING.sensJauge / sensCible — 🔺 monter la jauge réchauffe, 🔻 refroidit, ↕️ ambigu (lu sur effect + min/max).
// - v1.3.0 (2026-10-13): jauges séparées FROID / CHAUD / SUBTIL / HYSTERESIS ; chaque cible lit target.baryGroup.
// - v1.2.1 (2026-10-13): syncRadiativeConfig retiré avec H2O_EDS_SCALE (plus de groupe RADIATIVE).
// Date: 2026-10-10
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

    /** % fini, borné à [0, 100] ; un % absent ou non numérique est une erreur. */
    function requirePercent(percentRaw, label) {
        if (!Number.isFinite(percentRaw)) throw new Error('[tuning.js] ' + label + ' requis et invalide: ' + String(percentRaw));
        return Math.max(0, Math.min(100, percentRaw));
    }

    /**
     * Remplissage complet de DATA['🎚️'] depuis baryByGroup : chaque cible lit SA jauge (target.baryGroup,
     * FINE_TUNING_BOUNDS.jauges). Plus de jauge unique ATM (v1.3.0).
     */
    function fillDataTuningFromBary() {
        const T = window.DATA['🎚️'];
        const bg = T.baryByGroup;
        const targets = window.FINE_TUNING_BOUNDS.targets;
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const pct = requirePercent(bg[target.baryGroup], 'baryByGroup.' + target.baryGroup);
            T[target.group][target.key] = interpolate(target, pct);
        }
    }

    /**
     * Point d'entrée : { baryByGroup: { ATM: %, HYSTERESIS: %, … } } — seuls les groupes présents changent,
     * puis tout DATA['🎚️'] est réinterpolé.
     */
    function applyTuningPayload(payload) {
        Object.assign(window.DATA['🎚️'].baryByGroup, payload.baryByGroup);
        fillDataTuningFromBary();
    }

    // ── SENS D'UNE JAUGE : que fait la température quand la jauge MONTE ? ─────────────────────────────────────────────
    // Lu sur les cibles elles-mêmes (pas une seconde table) : `effect` dit le signe de dT/d(valeur) — 'positive' (la
    // valeur réchauffe), 'negative' (elle refroidit), autre ('epoch-dependent', 'mixed') = pas de signe unique — et le
    // sens min → max dit comment la valeur suit la jauge (0 % → min, 100 % → max).
    const SENS = {
        monte:  { logo: '🔺', titre: 'monter la jauge RÉCHAUFFE' },
        baisse: { logo: '🔻', titre: 'monter la jauge REFROIDIT' },
        ambigu: { logo: '↕️', titre: 'effet incertain suivant le contexte' }
    };
    /** +1 : la cible réchauffe quand sa jauge monte ; −1 : refroidit ; 0 : ambigu. */
    function signeCible(target) {
        const e = target.effect === 'positive' ? 1 : (target.effect === 'negative' ? -1 : 0);
        return e * Math.sign(target.max - target.min);
    }
    /** { logo, titre } du sens d'une cible. */
    function sensCible(target) {
        const s = signeCible(target);
        return s > 0 ? SENS.monte : (s < 0 ? SENS.baisse : SENS.ambigu);
    }
    /** { logo, titre } du sens d'une jauge : celui de ses cibles si elles vont toutes dans le même sens, sinon ambigu. */
    function sensJauge(jauge) {
        const signes = window.FINE_TUNING_BOUNDS.targets.filter(t => t.baryGroup === jauge).map(signeCible);
        const s = signes[0];
        if (s === 0 || !signes.every(x => x === s)) return SENS.ambigu;
        return s > 0 ? SENS.monte : SENS.baisse;
    }

    window.TUNING = {
        applyTuningPayload: applyTuningPayload,
        fillDataTuningFromBary: fillDataTuningFromBary,
        SENS: SENS,
        sensCible: sensCible,
        sensJauge: sensJauge
    };

    // Auto-init : interpole DATA['🎚️'] depuis baryByGroup × FINE_TUNING_BOUNDS dès que le module est chargé.
    // Pré-requis : initDATA.js + fine_tuning_bounds.js + physics.js chargés avant (engine_manifest.js).
    fillDataTuningFromBary();

})();
