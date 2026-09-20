// File: API_BILAN/demo/scie_demo.js - Ce que la page API a de plus que celle de CO2
// Desc: Deux choses, et rien d'autre : le PRECHARGEMENT de la configuration quand on clique une
//       epoque dans la frise, et la MISE EN CHAMPS de cette configuration pour qu'elle soit
//       modifiable. Cote CO2 la page est une iframe : le parent lui pousse un DATA deja calcule
//       et elle l'affiche. Ici la page est seule, donc c'est elle qui charge et elle qui edite.
// Version 1.0.0
// Date: 2026-09-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

'use strict';

// Charge la configuration de l'epoque courante SANS lancer le transfert radiatif.
//
// Ce sont les quatre premieres etapes de runTest() (scie_actions.js), celles que son propre
// commentaire appelle « Config des le debug (sans aucun calcul radiatif) ». On s'arrete juste
// avant computeRadiativeTransfer : cliquer une epoque doit montrer d'ou on part, pas faire
// converger — c'est le bouton ▶️ qui fait converger.
function prechargerConfigEpoque() {
    if (!window.DATA || !window.TIMELINE) return false;
    try {
        initializeGlobals();
        if (window.COMPUTE && window.COMPUTE.getEpochDateConfig) {
            window.COMPUTE.getEpochDateConfig();
        }
        if (!window.DATA['🔘']['🔘🎞']) {
            window.DATA['🧮']['🧮🌡️'] = window.DATA['📅']['🌡️🧮'];
        }
        if (window.CONVERGE && !window.CONVERGE.initForConfig()) {
            console.error('❌ initForConfig a échoué au préchargement');
            return false;
        }
        displayResults(null);
        // selectEpoch a deja rafraichi l'affichage, mais AVANT getEpochDateConfig : la date
        // courante y etait encore celle de l'epoque precedente. On repasse une fois la config
        // chargee, sinon la frise annonce une date et la configuration une autre.
        updateTimelineDisplay();
        afficherConfigEditable();
        return true;
    } catch (e) {
        console.error('❌ Préchargement de la configuration :', e);
        return false;
    }
}
window.prechargerConfigEpoque = prechargerConfigEpoque;


// ============================================================================
// CONFIGURATION MODIFIABLE
// ============================================================================
//
// Ce qu'on edite ici, c'est la LIGNE D'EPOQUE de TIMELINE — la t° attendue 🌡️🧮, les masses,
// l'orbite. C'est la seule chose qui merite un champ : les six categories que la page affiche
// plus bas (🔘 📜 🕰 ⚖️ 🌕 ☀️) sont de l'etat derive, recalcule a chaque convergence, et un
// champ pose dessus serait efface au calcul suivant.
//
// Les bornes ▶ et ◀ sont volontairement absentes : elles ne reglent pas l'epoque, elles la
// definissent, et les bouger desynchroniserait la frise de ce qu'elle annonce.

var CLES_NON_EDITABLES = ['📅', '▶', '◀', '🔒', '🕰'];

// Copie de reference, prise avant toute edition : c'est elle que rend le bouton ↺.
var TIMELINE_ORIGINE = null;
function memoriserTimelineOrigine() {
    if (TIMELINE_ORIGINE || !window.TIMELINE) return;
    try {
        TIMELINE_ORIGINE = window.TIMELINE.map(function (row) { return JSON.parse(JSON.stringify(row)); });
    } catch (e) {
        console.warn('Copie de référence de TIMELINE impossible :', e.message);
    }
}

function ligneEpoqueCourante() {
    const D = window.DATA;
    if (!D || !D['📜'] || !window.TIMELINE) return null;
    const idx = D['📜']['👉'];
    return (idx != null && window.TIMELINE[idx]) ? window.TIMELINE[idx] : null;
}

// DESC est range par categorie de DATA (📜, ⚖️, ☀️…), et parfois sur deux niveaux. Une ligne
// d'epoque, elle, melange des cles de plusieurs categories : on cherche donc la premiere
// description qui porte cette cle, ou qu'elle soit.
function libelleCle(cle) {
    let trouve = '';
    (function chercher(noeud, profondeur) {
        if (trouve || !noeud || typeof noeud !== 'object' || profondeur > 3) return;
        if (typeof noeud[cle] === 'string') { trouve = noeud[cle]; return; }
        Object.keys(noeud).forEach(function (k) { chercher(noeud[k], profondeur + 1); });
    })(window.DESC, 0);
    if (!trouve && window.CHARS_DESC && typeof window.CHARS_DESC[cle] === 'string') {
        trouve = window.CHARS_DESC[cle];
    }
    // Les descriptions prefixees de « ! » sont marquees internes dans le dico : on garde le texte,
    // sans le « ! », plutot que de laisser la cle nue.
    return trouve.charAt(0) === '!' ? trouve.slice(1) : trouve;
}

function afficherConfigEditable() {
    const hote = document.getElementById('config-edit-content');
    if (!hote) return;
    const ligne = ligneEpoqueCourante();
    if (!ligne) { hote.innerHTML = '<div class="error">Aucune époque chargée.</div>'; return; }
    memoriserTimelineOrigine();

    const champs = Object.keys(ligne).filter(function (cle) {
        return CLES_NON_EDITABLES.indexOf(cle) === -1 && typeof ligne[cle] === 'number';
    });

    hote.innerHTML = champs.map(function (cle) {
        const desc = libelleCle(cle);
        const titre = desc ? (cle + ' — ' + desc) : cle;
        return '<label class="config-edit-field" title="' + titre.replace(/"/g, '&quot;') + '">'
             + '<span class="config-edit-key">' + cle + '</span>'
             + '<input type="number" step="any" class="config-edit-input" data-cle="' + cle + '" value="' + ligne[cle] + '">'
             + '</label>';
    }).join('');

    hote.querySelectorAll('.config-edit-input').forEach(function (input) {
        input.addEventListener('change', function () {
            const cle = input.getAttribute('data-cle');
            const v = parseFloat(input.value);
            if (!Number.isFinite(v)) { input.value = ligne[cle]; return; }
            ligne[cle] = v;
            // La configuration affichee plus bas derive de cette ligne : on la recharge pour que
            // les deux disent la meme chose, sans lancer le transfert radiatif pour autant.
            prechargerConfigEpoque();
        });
    });
}
window.afficherConfigEditable = afficherConfigEditable;

// Rend a l'epoque courante les valeurs de configTimeline.js, puis recharge.
function reinitialiserEpoque() {
    const D = window.DATA;
    if (!TIMELINE_ORIGINE || !D || !D['📜']) return;
    const idx = D['📜']['👉'];
    const origine = TIMELINE_ORIGINE[idx];
    const ligne = window.TIMELINE[idx];
    if (!origine || !ligne) return;
    Object.keys(origine).forEach(function (cle) {
        if (typeof origine[cle] === 'number') ligne[cle] = origine[cle];
    });
    prechargerConfigEpoque();
}
window.reinitialiserEpoque = reinitialiserEpoque;


// ============================================================================
// RETOUR VISUEL APRES UN EVENEMENT
// ============================================================================
//
// Les boutons d'evenement font leur travail — ils injectent le CO2 dans
// 📜🔺⚖️🏭, font avancer les puits (advanceCarbonSinks) et le temps — mais ils
// ne redessinent que la date. La configuration affichee restait celle d'avant
// le clic, si bien que les boutons avaient l'air de ne rien faire d'autre que
// decaler l'annee.
//
// On ne peut PAS rappeler prechargerConfigEpoque ici : il passe par
// initializeGlobals, qui remet 📿💫 et les cumuls 📜🔺⚖️🏭 a zero — ce qui
// effacerait justement le clic qu'on vient de faire. Il faut donc la moitie
// basse du prechargement, sans la reinitialisation.
function rafraichirApresEvenement() {
    if (!window.DATA || !window.CONVERGE) return;
    try {
        if (!window.CONVERGE.initForConfig()) return;
        displayResults(null);
        updateTimelineDisplay();
        afficherConfigEditable();
    } catch (e) {
        console.error('❌ Rafraîchissement après événement :', e);
    }
}
window.rafraichirApresEvenement = rafraichirApresEvenement;

// Delegation sur le document, en phase de bouillonnement : le gestionnaire du
// bouton a deja tourne, et updateEpochActions a pu remplacer les boutons sans
// que l'ecoute soit perdue.
document.addEventListener('click', function (ev) {
    const cible = ev.target && ev.target.closest ? ev.target.closest('.btn-events') : null;
    if (!cible) return;
    if (!document.getElementById('timeline-events-logos')) return;
    // Apres la pile d'appels du bouton (getEpochDateConfig, updateEpochActions).
    setTimeout(rafraichirApresEvenement, 0);
});
