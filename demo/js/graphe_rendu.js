// File: API_BILAN/demo/js/graphe_rendu.js
// Desc: Dessin du graphe sur le canvas. Couleur = type de liaison (arbre père → fils, appel croisé) ; trait =
//       nature (plein : appel, pointillé fin : fonction passée en argument, tirets longs : alias déduit). Au survol
//       ou à la sélection : appelées en cyan, appelants en orange, le père en orange épais, le reste estompé.
//       Couleurs : variables de graphe.css (seule source). Caméra : écran = monde × k + (x, y).
// Version 1.2.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_RENDU = {
    COULEURS: {},   // rempli par lireCouleurs depuis :root de graphe.css

    /** Les couleurs du canvas sont celles de la feuille de style : --fond, --texte, --doux, --accent… */
    lireCouleurs: function () {
        const st = getComputedStyle(document.documentElement);
        const K = window.GRAPHE_RENDU.COULEURS;
        ['fond', 'cellule', 'texte', 'doux', 'accent', 'orange', 'racine', 'lien-arbre', 'lien-croise'].forEach(function (n) {
            K[n] = st.getPropertyValue('--' + n).trim();
        });
    },

    /** Motif de trait d'une nature d'arc, en px écran (× lu). */
    tirets: function (nature, lu) {
        return nature === 'rappel' ? [1.5 * lu, 3 * lu] : nature === 'deduit' ? [9 * lu, 4 * lu] : [];
    },

    /** Point du bord de la cellule c sur la droite qui va de son centre vers (x, y). */
    bord: function (c, x, y) {
        const dx = x - c.x;
        const dy = y - c.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
        const t = window.GRAPHE_FORCES.demiEtendue(c, dx / d, dy / d);
        return { x: c.x + dx / d * t, y: c.y + dy / d * t };
    },

    fleche: function (ctx, a, b, couleur, largeur, tirets) {
        const R = window.GRAPHE_RENDU;
        const p = R.bord(a, b.x, b.y);
        const q = R.bord(b, a.x, a.y);
        ctx.strokeStyle = couleur;
        ctx.fillStyle = couleur;
        ctx.lineWidth = largeur;
        ctx.setLineDash(tirets);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        const L = 4 + largeur * 2;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - L * Math.cos(ang - 0.45), q.y - L * Math.sin(ang - 0.45));
        ctx.lineTo(q.x - L * Math.cos(ang + 0.45), q.y - L * Math.sin(ang + 0.45));
        ctx.closePath(); ctx.fill();
    },

    /** Les liens à dessiner : [de, vers, 'arbre' | 'croise', nature]. Un lien d'arbre va de l'ancre (père, ou plus
     *  proche ancêtre visible) au fils. */
    liens: function () {
        const V = window.GRAPHE_VUE;
        const P = V.parId;
        const visible = new Set(V.visibles);
        const L = [];
        V.visibles.forEach(function (c) {
            if (V.voirArbre && c.ancre !== null) {
                L.push([c.ancre, c, 'arbre', c.ancre.nd.id === c.nd.parent ? c.ancre.nd.natures[c.nd.id] : 'appel']);
            }
            if (V.voirCroises) {
                c.nd.croises.forEach(function (id) {
                    if (visible.has(P[id])) L.push([c, P[id], 'croise', c.nd.natures[id]]);
                });
            }
        });
        return L;
    },

    dessiner: function () {
        const V = window.GRAPHE_VUE;
        const R = window.GRAPHE_RENDU;
        const K = R.COULEURS;
        const C = V.CONFIG;
        const ctx = V.ctx;
        const cam = V.camera;
        const cv = V.canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = K.fond;
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.setTransform(V.dpr * cam.k, 0, 0, V.dpr * cam.k, V.dpr * cam.x, V.dpr * cam.y);

        const foyer = V.survol === null ? V.choix : V.survol;
        const appeles = new Set(foyer === null ? [] : foyer.nd.appels);
        const appelants = new Set(foyer === null ? [] : foyer.nd.appelants);
        const lu = 1 / Math.max(cam.k, 0.35);   // largeur de trait lisible à tout zoom

        // Liens : d'abord les estompés, puis ceux du foyer par-dessus.
        const enAvant = [];
        R.liens().forEach(function (l) {
            const a = l[0], b = l[1], arbre = l[2] === 'arbre';
            if (foyer === a || foyer === b) { enAvant.push(l); return; }
            ctx.globalAlpha = foyer === null ? (arbre ? 0.85 : 0.55) : 0.1;
            R.fleche(ctx, a, b, arbre ? K['lien-arbre'] : K['lien-croise'], (arbre ? 1.4 : 1) * lu,
                arbre || l[3] !== 'appel' ? R.tirets(l[3], lu) : [4 * lu, 4 * lu]);
        });
        ctx.globalAlpha = 1;
        enAvant.forEach(function (l) {
            const versFoyer = l[1] === foyer;
            const pere = versFoyer && l[2] === 'arbre';
            R.fleche(ctx, l[0], l[1], versFoyer ? K.orange : K.accent, (pere ? 3.2 : 1.8) * lu,
                l[2] === 'arbre' || l[3] !== 'appel' ? R.tirets(l[3], lu) : [5 * lu, 4 * lu]);
        });

        // Cellules : le contenu est dessiné à l'échelle de la cellule (c.s), autour de son bord gauche.
        const texteLisible = cam.k * 12 > 5;
        ctx.textBaseline = 'middle';
        V.visibles.forEach(function (c) {
            const lie = foyer === null || foyer === c || appeles.has(c.nd.id) || appelants.has(c.nd.id);
            const fond = lie ? 1 : 0.3;
            const x0 = c.x - c.w / 2;
            const y0 = c.y - c.h / 2;
            ctx.globalAlpha = fond;
            ctx.fillStyle = K.cellule;
            ctx.beginPath(); ctx.roundRect(x0, y0, c.w, c.h, 6 * c.s); ctx.fill();
            ctx.fillStyle = c.couleur;
            ctx.globalAlpha = fond * 0.22;
            ctx.fill();
            ctx.globalAlpha = fond;
            ctx.strokeStyle = c.nd.id === window.GRAPHE.racine ? K.racine
                : (c === foyer ? K.texte : appeles.has(c.nd.id) ? K.accent : appelants.has(c.nd.id) ? K.orange : c.couleur);
            ctx.lineWidth = (c === foyer || c === V.choix ? 2.2 : 1.2) * lu;
            ctx.stroke();
            ctx.save();
            ctx.translate(x0, c.y);
            ctx.scale(c.s, c.s);
            if (c.fixe) {   // épinglée : un point en haut à gauche
                ctx.fillStyle = K.racine;
                ctx.beginPath(); ctx.arc(3, -C.hauteur / 2 + 3, 2.5, 0, 2 * Math.PI); ctx.fill();
            }
            if (texteLisible) {
                ctx.font = C.police;
                ctx.fillStyle = K.texte;
                ctx.fillText(c.logo, C.pad, 0.5);
                ctx.fillStyle = K.doux;
                ctx.fillText(c.prefixe, C.pad + c.lLogo, 0.5);
                ctx.fillStyle = K.texte;
                ctx.fillText(c.nom, C.pad + c.lLogo + c.lPrefixe, 0.5);
                ctx.fillText(c.cles, C.pad + c.lLogo + c.lPrefixe + c.lNom, 0.5);
            }
            if (c.nd.enfants.length) {   // le bouton +/− : replier / déplier les appelées (graphe_entrees.surBouton)
                const bx = c.w / c.s - C.badge / 2 - 2;
                const survole = V.survolBouton === c;
                ctx.fillStyle = c.plie ? c.couleur : survole ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)';
                ctx.beginPath(); ctx.arc(bx, 0, 7, 0, 2 * Math.PI); ctx.fill();
                if (survole) { ctx.strokeStyle = K.texte; ctx.lineWidth = 1; ctx.stroke(); }
                ctx.strokeStyle = c.plie ? K.fond : K.texte;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(bx - 3.5, 0); ctx.lineTo(bx + 3.5, 0);
                if (c.plie) { ctx.moveTo(bx, -3.5); ctx.lineTo(bx, 3.5); }
                ctx.stroke();
            }
            ctx.restore();
        });
        ctx.globalAlpha = 1;
        V.sale = false;
    }
};
