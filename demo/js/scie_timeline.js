// File: API_BILAN/demo/scie_timeline.js - Frise des époques (horizontale ou verticale)
// Desc: La FRISE et la sélection d'époque. État réel à la date d'extraction, à ne pas confondre avec l'intention :
//       — createEpochButton(id, orientation, hidden) et createGraduation savent faire 'horizontal' ET 'vertical' ;
//       — generateHorizontalTimeline() ne dessine RIEN aujourd'hui : il choisit l'époque par défaut et appelle
//         selectEpoch(). La frise horizontale est donc à écrire, pas à réutiliser ;
//       — createEpochButton(id, orientation, hidden) et createGraduation savent faire 'horizontal' ET 'vertical' :
//         ce sont les briques de cette frise à venir. Sans appelant pour l'instant, c'est assumé et temporaire.
// Version 1.1.0
// Date: 2026-10-12
// logs :
//   - v1.1.0: selectEpoch = CLICS.frise (plus de pose d'époque ni de remise à zéro recopiées, qui oubliaient ⏳,
//     📿☄️, 📿🕰) ; generateHorizontalTimeline ne fait plus que dessiner (initScieDemo choisit ⚫) ; durée d'un
//     tic = celle de CLICS.prochaineAction (getTicKey cherchait un 🛢 qu'aucune époque n'a).
//   - copie API (2026-09-20) de la page scientifique de CO2. La page de CO2 reste la reference
//     pour l'affichage ; cette copie-ci vit dans demo/ pour que le depot API se teste seul, et
//     c'est elle qui gagne la frise horizontale et les champs de configuration modifiables.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// ============================================================================
// UTILITAIRES PARTAGÉS POUR TIMELINE (verticale et horizontale)
// ============================================================================

// Créer un bouton d'époque (utilitaire partagé)
// hidden=true => rendu texte (epoch-text) mais cliquable.
function createEpochButton(epochId, orientation, isHidden) {
    if (isHidden) {
        const el = document.createElement('button');
        el.className = orientation === 'horizontal' ? 'epoch-text-horizontal' : 'epoch-text';
        el.setAttribute('data-epoch', epochId);
        el.textContent = epochId;
        return el;
    }
    const button = document.createElement('button');
    button.className = orientation === 'horizontal' ? 'epoch-btn-horizontal' : 'epoch-btn';
    button.setAttribute('data-epoch', epochId);
    
    // Le logo est directement l'emoji
    button.textContent = epochId;
    button.style.fontFamily = "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
    
    // Ajouter le tooltip personnalisé avec description depuis DESC
    if (window.CHARS_DESC && window.CHARS_DESC[epochId]) {
        // Utiliser addCustomTooltip si disponible, sinon title
        if (typeof addCustomTooltip === 'function') {
            addCustomTooltip(button, window.CHARS_DESC[epochId]);
        } else {
            button.title = window.CHARS_DESC[epochId];
        }
    }
    
    return button;
}

// Créer une graduation (utilitaire partagé)
function createGraduation(dateText, orientation) {
    const graduation = document.createElement('div');
    graduation.className = orientation === 'horizontal' ? 'epoch-date-item-horizontal' : 'epoch-date-item';
    
    const date = document.createElement('span');
    date.className = orientation === 'horizontal' ? 'epoch-date-horizontal' : 'epoch-date';
    date.textContent = dateText;
    
    graduation.appendChild(date);
    return graduation;
}

// Formater une date en Ma depuis les années (▶ = years, convention géo: -X Ma = X Ma avant présent)
function formatDateMa(years) {
    const millions = Math.abs(years) / 1e6;
    if (millions >= 1) {
        const sign = years > 0 ? '-' : '';
        return `${sign}${millions.toFixed(0)}Ma`;
    }
    return years >= 0 ? `+${years}` : `${years}`;
}

// ============================================================================
// GÉNÉRATION TIMELINE HORIZONTALE
// 3 lignes : noms (entre les |), | logos, dates (sous les |)
// ============================================================================
var EPOCH_NAME_MAP = window.CHARS_DESC || {};

// Dessine la frise, puis sélectionne l'époque par défaut.
//
// Une cellule = la grille .epoch-cell-horizontal de scie_compute.css, en trois rangs :
//   rang 1, colonne 2 : le nom de l'époque, entre les séparateurs
//   rang 2, colonne 1 : le séparateur « | » ; colonne 2 : le bouton (emoji de l'époque)
//   rang 3, colonne 1 : la date de début, sous le séparateur
// Les époques hidden (états internes d'hystérésis) restent cliquables mais passent en rendu
// texte, comme sur la frise verticale du panneau Visuel — createEpochButton s'en charge.
function generateHorizontalTimeline() {
    if (!window.TIMELINE) return;
    const rangee = document.getElementById('epochs-row-emojis');
    const epochItems = window.TIMELINE.filter(item => item && item['📅']);

    if (rangee) {
        rangee.innerHTML = '';
        epochItems.forEach(epoch => {
            const id = epoch['📅'];
            const cell = document.createElement('div');
            cell.className = 'epoch-cell-horizontal';

            const nom = document.createElement('span');
            nom.className = 'epoch-name-between';
            nom.textContent = EPOCH_NAME_MAP[id] || id;
            cell.appendChild(nom);

            const sep = document.createElement('span');
            sep.className = 'epoch-separator';
            sep.textContent = '|';
            cell.appendChild(sep);

            const bouton = createEpochButton(id, 'horizontal', !!epoch.hidden);
            bouton.addEventListener('click', () => selectEpoch(id));
            cell.appendChild(bouton);

            // Graduation : la date de début. Si la frise devient trop dense, c'est la première
            // chose à retirer — le conteneur défile déjà (overflow-x) avant d'en arriver là.
            const date = document.createElement('span');
            date.className = 'epoch-date-under';
            date.textContent = epoch['▶'] != null ? formatDateMa(epoch['▶']) : '';
            cell.appendChild(date);

            rangee.appendChild(cell);
        });
    }
}

/** Clic sur la frise (page démo) : on repart de l'époque, graine comprise (CLICS.frise, la mécanique de
 *  partout), sans animation ; la configuration est préchargée, sans converger (c'est ▶️ qui converge). */
function selectEpoch(epochId) {
    window.DATA['🔘']['🔘🎞'] = false;
    window.CLICS.frise(epochId);
    marquerEpoqueFrise();
    updateEpochActions();
    window.prechargerConfigEpoque();
}
window.selectEpoch = selectEpoch;

/** Bouton de la frise = époque courante (DATA['📜']['🗿']). */
function marquerEpoqueFrise() {
    document.querySelectorAll('.epoch-btn-horizontal, .epoch-text-horizontal').forEach(function (btn) {
        btn.classList.toggle('selected', btn.getAttribute('data-epoch') === window.DATA['📜']['🗿']);
    });
}

// Mettre à jour l'affichage de la timeline (📅 date courante, début époque, nom)
function updateTimelineDisplay() {
    const infoTimeDisplay = document.getElementById('info-time');
    const ticDurationEl = document.getElementById('tic-duration');
    const epochStartTime = document.getElementById('epoch-start-time');
    const epochNameEl = document.getElementById('epoch-name');
    const DATA = window.DATA;
    const EPOCH = (DATA && DATA['📜'] != null && window.TIMELINE) ? window.TIMELINE[DATA['📜']['👉']] : null;
    if (!EPOCH || !DATA) return;

    // Detect time direction
    const epochEnd = typeof EPOCH['◀'] === 'number' ? EPOCH['◀'] : null;
    const isForward = EPOCH['▶'] != null && epochEnd != null && EPOCH['▶'] < epochEnd;

    // Nom d'époque
    if (epochNameEl) {
        const eId = (DATA['📜'] && DATA['📜']['🗿']) || (EPOCH && EPOCH['📅']);
        epochNameEl.textContent = EPOCH_NAME_MAP[eId] || eId || '';
    }

    // Date courante : CLICS.date() (depuis 📜⏳, la seule horloge)
    const dateYears = window.CLICS.date();
    if (infoTimeDisplay) {
        if (dateYears != null) {
            if (isForward) {
                infoTimeDisplay.textContent = Math.round(dateYears) + ' CE';
            } else {
                infoTimeDisplay.textContent = (dateYears / 1e6).toFixed(0) + ' Ma';
            }
        } else {
            infoTimeDisplay.textContent = '...';
        }
    }

    // Date de début d'époque (EPOCH['▶'])
    if (epochStartTime && EPOCH['▶'] != null) {
        if (isForward) {
            epochStartTime.textContent = Math.round(EPOCH['▶']) + ' CE';
        } else {
            epochStartTime.textContent = (EPOCH['▶'] / 1e6).toFixed(0) + ' Ma';
        }
    }

    // Durée d'un tic : celle de la prochaine action (CLICS.prochaineAction ; 📱 : celle de la tranche active).
    if (ticDurationEl) {
        const key = window.CLICS.prochaineAction();
        if (key !== null && key !== undefined) {
            ticDurationEl.textContent = 'prochain clic = ' + window.CLICS.pas(key) + ' Ma';
            ticDurationEl.style.display = '';
        } else {
            ticDurationEl.style.display = 'none';
        }
    }
}
