// File: API_BILAN/graphe/graphe_doc.js
// Desc: La documentation de chaque fonction du graphe : les cartes de doc/equation.html qui la nomment au bas de
//       leur carte (« fichier.js → fonction, … »). La page des équations est lue dans un iframe caché qui répond
//       par postMessage (doc/js/equation.js), ce qui marche aussi en file:// ; aucune liste écrite à la main.
// Version 1.0.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE_DOC = {
    page: '',         // URL de doc/equation.html vue de la page hôte (posée par charger)
    cartes: [],       // [{ id, classe, titre, code }] reçues de la page des équations

    /** Ouvre doc/equation.html dans un iframe caché et lui demande ses cartes ; résolue avec elles. */
    charger: function (page) {
        const D = window.GRAPHE_DOC;
        D.page = page;
        return new Promise(function (resoudre) {
            const cadre = document.createElement('iframe');
            cadre.hidden = true;
            cadre.title = 'équations du modèle (lues pour la documentation des fonctions)';
            window.addEventListener('message', function (e) {
                // La page des équations envoie aussi sa hauteur (resize-iframe) : seule sa réponse compte ici.
                if (e.source !== cadre.contentWindow || e.data.type !== 'cartes') return;
                D.cartes = e.data.cartes;
                resoudre(D.cartes);
            });
            cadre.addEventListener('load', function () {
                cadre.contentWindow.postMessage({ type: 'cartes?' }, '*');
            });
            cadre.src = page;
            document.body.appendChild(cadre);
        });
    },

    /** Les couples (fichier, nom) qu'une ligne « code » de carte nomme : « a/b.js → f, M.g ; c.js → h (note) ».
     *  Les parenthèses sont des notes (elles peuvent contenir « ; ») ; un segment sans « → » ne nomme pas de fonction. */
    nommees: function (code) {
        let t = code.replace(/\s+/g, ' ');
        while (/\([^()]*\)/.test(t)) t = t.replace(/\([^()]*\)/g, '');
        const couples = [];
        t.split(';').forEach(function (seg) {
            const m = seg.match(/([\w./-]+\.js)\s*→(.*)$/);
            if (m === null) return;
            const fichier = m[1].split('/').pop();
            m[2].split(',').forEach(function (n) {
                const id = n.trim().match(/^[\w$.]+/);
                if (id !== null) couples.push(fichier + ' ' + id[0].split('.').pop());
            });
        });
        return couples;
    },

    /** Pose nd.docs (cartes qui nomment la fonction, dans l'ordre de la page) sur chaque nœud du graphe. Une fonction
     *  est nommée par son fichier et son nom, ou l'un de ses alias (PHYS.pSatEau, pSatEau). */
    lier: function () {
        const D = window.GRAPHE_DOC;
        const nommees = D.cartes.map(function (c) { return D.nommees(c.code); });
        window.GRAPHE.noeuds.forEach(function (nd) {
            const fichier = nd.fichier.split('/').pop();
            const siennes = nd.alias.concat([nd.nom]).map(function (a) { return fichier + ' ' + a.split('.').pop(); });
            nd.docs = D.cartes.filter(function (c, i) {
                return nommees[i].some(function (k) { return siennes.indexOf(k) >= 0; });
            });
        });
    },

    /** Lien vers une carte de la page des équations. */
    lien: function (c) {
        return window.GRAPHE_DOC.page + '#' + c.id;
    }
};
