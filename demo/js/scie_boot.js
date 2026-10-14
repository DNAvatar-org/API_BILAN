// File: API_BILAN/demo/scie_boot.js - Garde-fous de chargement et outils de base de la page
// Desc: En français, dans l'architecture, je suis le SAS D'ENTRÉE de la page Scientifique : je vérifie que les
//       ressources critiques sont là (un dico.js manquant ne doit pas donner une page à moitié vivante), je
//       capture les erreurs, je fabrique les logos de l'alphabet et je tiens le pont vers la page parente.
// Version 1.1.0
// Date: 2026-10-12
// logs :
//   - v1.1.0: emitSyncToParent, getTicKey, toggleAnim retirés : la scie de CO2 n'a ni frise ni bouton d'action
//     ni 🎞 (le parent pose l'état et le lui pousse), la démo n'a pas de parent.
//   - copie API (2026-09-20) de la page scientifique de CO2. La page de CO2 reste la reference
//     pour l'affichage ; cette copie-ci vit dans demo/ pour que le depot API se teste seul, et
//     c'est elle qui gagne la frise horizontale et les champs de configuration modifiables.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Vérifier ressources critiques (ex: dico.js manquant → ERR_SOCKET_NOT_CONNECTED)
(function checkCritical() {
    var key = 'co2_reload_attempts';
    var maxAttempts = 2;
    var attempts = parseInt(sessionStorage.getItem(key) || '0', 10);
    function ok() {
        if (!window.DATA || !window.DATA['⚖️'] || !window.TIMELINE || !window.CONST) return false;
        sessionStorage.setItem(key, '0');
        return true;
    }
    if (ok()) return;
    if (attempts >= maxAttempts) {
        console.warn('Ressources manquantes (DATA, TIMELINE, CONST) après ' + maxAttempts + ' tentatives. Vérifier la console.');
        sessionStorage.setItem(key, '0');
        return;
    }
    sessionStorage.setItem(key, String(attempts + 1));
    console.warn('Ressources manquantes, rechargement (' + (attempts + 1) + '/' + maxAttempts + ')...');
    location.reload();
})();

// Capturer toute erreur non gérée pour éviter plantage silencieux (ex: Hadéen)
window.onerror = function (msg, url, line, col, err) {
    console.error('❌ Erreur non gérée:', msg, url, line, col, err && err.stack);
    return false;
};
window.addEventListener('unhandledrejection', function (e) {
    console.error('❌ Promise rejetée non gérée:', e.reason, e.reason && e.reason.stack);
});

// Fonction helper pour construire les clés de logos dans le HTML (utilise window.getLogoKey si disponible)
function getLogoKeyHTML(...names) {
    if (typeof window !== 'undefined' && window.getLogoKey) {
        return window.getLogoKey(...names);
    }
    if (typeof window === 'undefined' || !window.LOGOS) {
        return '';
    }
    return names.map(name => window.LOGOS[name] || '').join('');
}

function getLogoHTML(name) {
    if (typeof window !== 'undefined' && window.getLogo) {
        return window.getLogo(name);
    }
    if (typeof window === 'undefined' || !window.LOGOS) {
        return '';
    }
    return window.LOGOS[name] || '';
}

// Intercepter console.log pour afficher dans la page
const originalLog = console.log;
const originalError = console.error;
// Logs désactivés - la div de logs a été supprimée
// console.log et console.error utilisent les fonctions originales

function clearLog() {
    // Logs désactivés - la div de logs a été supprimée
}

// resolveImagePath (alphabet_render.js) delegue ici des qu'un getImagePath global existe.
// Cote CO2 il fallait remonter d'un niveau ; ici la page est dans demo/, qui a son propre
// fonts/pics/ — le chemin est deja bon, et remonter le ferait pointer hors de demo/.
function getImagePath(relativePath) {
    if (!relativePath) return relativePath;
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('/')) {
        return relativePath;
    }
    return relativePath;
}
