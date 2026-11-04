// File: API_BILAN/graphe/graphe_appels.js
// Desc: Le graphe d'appels du moteur, lu dans le code lui-même : chaque fonction exposée par les scripts du
//       moteur (globales, membres des modules, méthodes de prototype) devient un nœud ; ses appels et les
//       fonctions qu'elle passe en argument, relevés dans son source (Function.prototype.toString), deviennent
//       ses arcs. Aucune liste écrite à la main.
// Version 1.1.0
// Date: November 4, 2026
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

window.GRAPHE = {
    origine: {},      // nom global → script du moteur qui l'a posé (GRAPHE_EXTRACTION.releveur, au chargement)
    // Nœud : { id, nom, module, fichier, dossier, fn, alias: [id], source, appels: [id], natures: {id: nature},
    //          appelants: [id], recursif, logo (CHARS de son module), cles (clés du dico citées) } — puis, par GRAPHE_ARBRE : profondeur, parent, enfants, orphelin, croises.
    // Nature d'un arc : 'appel' (f(…)), 'rappel' (f passée sans être appelée : callback), 'deduit' (X.f où X est un
    // alias posé hors de la fonction, résolu parce qu'un seul module a un membre f).
    noeuds: [],
    parId: {},        // id → nœud
    dico: null,       // clé du dico → sa catégorie dans DESC (GRAPHE_EXTRACTION.symboles)
    racines: [],      // ids des racines de l'arbre (GRAPHE_ARBRE) : run d'abord, puis les orphelins
    racine: 'BilanRadiatifAPI.prototype.run'
};

window.GRAPHE_EXTRACTION = {

    /** Source sans commentaires, ni contenu de chaînes ou de regex (les ${…} des gabarits sont gardés). */
    nettoyer: function (s) {
        let out = '';
        let i = 0;
        const n = s.length;
        const pile = [];   // profondeur d'accolades de chaque ${ ouvert dans un gabarit
        // Un « / » ouvre une regex quand ce qui précède ne peut pas finir une valeur.
        const avantRegex = function () {
            const t = out.replace(/\s+$/, '');
            return t === '' || /[(,=:[!&|?{};+\-*%<>~^]$/.test(t) || /\b(?:return|typeof|case|in|of)$/.test(t);
        };
        while (i < n) {
            const c = s[i];
            const d = s[i + 1];
            if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') i++; continue; }
            if (c === '/' && d === '*') { i = s.indexOf('*/', i + 2); i = i < 0 ? n : i + 2; out += ' '; continue; }
            if (c === '/' && avantRegex()) {
                i++;
                let classe = false;
                while (i < n && (classe || s[i] !== '/')) {
                    if (s[i] === '\\') i++;
                    else if (s[i] === '[') classe = true;
                    else if (s[i] === ']') classe = false;
                    i++;
                }
                i++;
                while (i < n && /[a-z]/.test(s[i])) i++;
                out += '/r/'; continue;
            }
            if (c === '"' || c === "'") {
                i++;
                while (i < n && s[i] !== c) i += s[i] === '\\' ? 2 : 1;
                i++; out += '""'; continue;
            }
            if (c === '`' || (c === '}' && pile.length && pile[pile.length - 1] === 0)) {
                if (c === '}') pile.pop();
                i++;
                while (i < n && s[i] !== '`' && !(s[i] === '$' && s[i + 1] === '{')) i += s[i] === '\\' ? 2 : 1;
                if (s[i] === '$') { pile.push(0); out += '`${'; i += 2; continue; }
                i++; out += '``'; continue;
            }
            if (pile.length && c === '{') pile[pile.length - 1]++;
            if (pile.length && c === '}') pile[pile.length - 1]--;
            out += c;
            i++;
        }
        return out;
    },

    /** Noms déclarés dans la fonction (paramètres, const/let/var, fonctions internes, catch) : ils masquent les
     *  globales du même nom (une flèche locale « orbite » n'est pas la globale orbite). `s` : source nettoyé, sans
     *  en-tête. */
    locaux: function (s) {
        const L = new Set();
        const ids = function (t) { for (const m of t.matchAll(/[A-Za-z_$][\w$]*/g)) L.add(m[0]); };
        const tete = s.match(/^\s*\(([^)]*)\)/);
        if (tete !== null) ids(tete[1]);
        for (const m of s.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) L.add(m[1]);
        for (const m of s.matchAll(/,\s*([A-Za-z_$][\w$]*)\s*=(?!=)/g)) L.add(m[1]);   // const a = 1, b = 2
        for (const m of s.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) ids(m[1]);
        for (const m of s.matchAll(/\bfunction\b\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)) {
            if (m[1] !== undefined) L.add(m[1]);
            ids(m[2]);
        }
        for (const m of s.matchAll(/\(([^()]*)\)\s*=>/g)) ids(m[1]);
        for (const m of s.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) L.add(m[1]);
        for (const m of s.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) L.add(m[1]);
        return L;
    },

    /** Le onLoaded de BILAN_LOADER qui note, script par script, les globales que chacun pose dans GRAPHE.origine.
     *  nAvant : nombre de scripts de l'hôte chargés avant le moteur (ils ne font pas partie du graphe). */
    releveur: function (apiBase, nAvant) {
        const vus = new Set(Object.getOwnPropertyNames(window));
        return function (src, rang) {
            Object.getOwnPropertyNames(window).forEach(function (k) {
                if (vus.has(k)) return;
                vus.add(k);
                if (rang >= nAvant) window.GRAPHE.origine[k] = src.slice(apiBase.length);
            });
        };
    },

    /** Le dossier du script (albedo, physics, convergence…) ; CO2 pour ceux pris dans CO2/static ; api à la racine. */
    dossier: function (fichier) {
        const p = fichier.split('/');
        if (p[0] === '..') return 'CO2';
        return p.length === 1 ? 'api' : p[p.length - 2];
    },

    /** Inventaire : toute fonction posée par un script du moteur, une seule fois par objet fonction. */
    inventaire: function () {
        const G = window.GRAPHE;
        const parFonction = new Map();
        const noeuds = [];
        const ajouter = function (id, module, nom, fn, fichier) {
            const deja = parFonction.get(fn);
            // Une fonction globale ET membre d'un module (calculateAlbedo = ALBEDO.calculateAlbedo) : un seul nœud,
            // nommé par son module, qui dit où elle vit.
            if (deja) {
                deja.alias.push(id);
                if (deja.module === '' && module !== '') { deja.id = id; deja.module = module; }
                return;
            }
            const nd = { id: id, nom: nom, module: module, fichier: fichier, dossier: window.GRAPHE_EXTRACTION.dossier(fichier),
                fn: fn, alias: [id], source: '', appels: [], natures: {}, appelants: [], recursif: false };
            parFonction.set(fn, nd);
            noeuds.push(nd);
        };
        Object.keys(G.origine).forEach(function (cle) {
            const v = window[cle];
            const fichier = G.origine[cle];
            if (typeof v === 'function') {
                ajouter(cle, '', cle, v, fichier);
                // Les flèches et méthodes abrégées n'ont pas de prototype : rien à y chercher.
                if (v.prototype !== undefined) {
                    Object.getOwnPropertyNames(v.prototype).forEach(function (m) {
                        if (m !== 'constructor' && typeof v.prototype[m] === 'function') {
                            ajouter(cle + '.prototype.' + m, cle + '.prototype', m, v.prototype[m], fichier);
                        }
                    });
                }
                return;
            }
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                Object.keys(v).forEach(function (m) {
                    if (typeof v[m] === 'function') ajouter(cle + '.' + m, cle, m, v[m], fichier);
                });
            }
        });
        return noeuds;
    },

    /** Arcs : appels et références nus (foo(…), map(foo)), membres (NS.foo, window.NS.foo, window.foo, alias local
     *  de NS, this.foo dans un module), membres d'un alias posé hors de la fonction (déduits). */
    arcs: function (noeuds) {
        const G = window.GRAPHE;
        const X = window.GRAPHE_EXTRACTION;
        const nus = {};          // nom global → nœud
        const membres = {};      // 'NS.m' → nœud
        const espaces = new Set();
        const parMembre = {};    // m → le seul nœud nommé m dans un module, ou null s'il y en a plusieurs
        noeuds.forEach(function (nd) {
            nd.alias.forEach(function (a) {
                const i = a.lastIndexOf('.');
                if (i < 0) { nus[a] = nd; return; }
                membres[a] = nd;
                espaces.add(a.slice(0, i));
                const m = a.slice(i + 1);
                parMembre[m] = parMembre[m] === undefined || parMembre[m] === nd ? nd : null;
            });
        });
        // const A = window.NS; — aussi dans une déclaration en chaîne (const D = window.DATA, S = window.SAISONS).
        const RE_ALIAS = /(?:\b(?:const|let|var)\s|,)\s*([A-Za-z_$][\w$]*)\s*=\s*(?:window\.)?([A-Za-z_$][\w$]*)\s*(?=[;,\n])/g;
        const RE_MEMBRE = /(?:\bwindow\s*\.\s*)?\b([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)/g;
        const RE_NU = /(^|[^.\w$])([A-Za-z_$][\w$]*)/g;
        noeuds.forEach(function (nd) {
            const brut = Function.prototype.toString.call(nd.fn);
            nd.source = brut;
            // Sans l'en-tête (« function nom( », « async nom( » d'une méthode) : le nom déclaré n'est pas un appel.
            const s = X.nettoyer(brut).replace(/^\s*(?:async\s+)?(?:function\b\s*\*?\s*)?[A-Za-z_$][\w$]*\s*\(/, '(');
            const locaux = X.locaux(s);
            const alias = {};
            let m;
            for (const a of s.matchAll(RE_ALIAS)) alias[a[1]] = a[2];
            alias['this'] = nd.module;
            const vus = new Map();   // nœud → première position dans le source (ordre des enfants)
            const natures = {};
            const noter = function (cible, pos, fin, nature) {
                if (cible === nd) { nd.recursif = true; return; }
                // Appel si le nom est suivi de « ( » (ou de .call / .apply) ; sinon la fonction est passée.
                const n = nature === 'deduit' ? nature : /^\s*(?:\(|\.\s*(?:call|apply)\b)/.test(s.slice(fin)) ? 'appel' : 'rappel';
                if (!vus.has(cible)) vus.set(cible, pos);
                if (natures[cible.id] !== 'appel') natures[cible.id] = n;
            };
            RE_MEMBRE.lastIndex = 0;
            while ((m = RE_MEMBRE.exec(s))) {
                const fin = m.index + m[0].length;
                const ns = alias[m[1]] === undefined ? m[1] : alias[m[1]];
                const cible = ns === 'window' ? nus[m[2]] : membres[ns + '.' + m[2]];
                if (cible) noter(cible, m.index, fin, '');
                // Alias de module posé hors de la fonction (const A = window.astronomie au niveau de l'IIFE) : le nom
                // n'est ni un module, ni une globale, ni un local ; on le résout quand un seul module a ce membre.
                else if (/^[A-Z]/.test(m[1]) && alias[m[1]] === undefined && !espaces.has(m[1]) && !locaux.has(m[1])
                    && window[m[1]] === undefined && parMembre[m[2]]) noter(parMembre[m[2]], m.index, fin, 'deduit');
                RE_MEMBRE.lastIndex = fin - m[2].length;   // NS.a.b : relire a.b
            }
            RE_NU.lastIndex = 0;
            while ((m = RE_NU.exec(s))) {
                const nom = m[2];
                const debut = m.index + m[1].length;
                const fin = debut + nom.length;
                RE_NU.lastIndex = fin;
                const cible = nus[nom];
                if (!cible || locaux.has(nom)) continue;
                // Clé d'objet ({ nom: … }) : pas une référence.
                if (/^\s*:/.test(s.slice(fin)) && /[{,]\s*$/.test(s.slice(0, debut))) continue;
                noter(cible, debut, fin, '');
            }
            nd.appels = Array.from(vus.entries()).sort(function (a, b) { return a[1] - b[1]; })
                .map(function (e) { return e[0].id; });
            nd.natures = natures;
        });
        G.parId = {};
        noeuds.forEach(function (nd) { G.parId[nd.id] = nd; });
        noeuds.forEach(function (nd) {
            nd.appels.forEach(function (id) { G.parId[id].appelants.push(nd.id); });
        });
    },

    /** Le vocabulaire du moteur porté par chaque fonction : logo = CHARS[module] quand l'alphabet nomme son module
     *  (ALBEDO → 🪩) ; cles = clés du dico (catégories et clés de DESC) écrites en clair dans son source
     *  (DATA['🪩']['🍰🪩🧊']), de la plus citée à la moins citée. */
    symboles: function (noeuds) {
        const D = window.DESC;
        const dico = new Map();   // clé → sa catégorie dans DESC (une catégorie est sa propre catégorie)
        Object.keys(D).forEach(function (cat) {
            dico.set(cat, cat);
            Object.keys(D[cat]).forEach(function (k) { dico.set(k, cat); });
        });
        const G = window.GRAPHE;
        G.dico = dico;
        const RE_CHAINE = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
        noeuds.forEach(function (nd) {
            nd.logo = window.CHARS[nd.module] === undefined ? '' : window.CHARS[nd.module];
            const n = new Map();
            for (const m of nd.source.matchAll(RE_CHAINE)) {
                const t = m[1] === undefined ? m[2] : m[1];
                if (dico.has(t)) n.set(t, (n.has(t) ? n.get(t) : 0) + 1);
            }
            const parFrequence = Array.from(n.entries()).sort(function (a, b) { return b[1] - a[1]; })
                .map(function (e) { return e[0]; });
            // Les clés précises d'abord (🍰🪩🧊), les catégories (🪩, 🧮) seulement ensuite : elles disent peu.
            nd.cles = parFrequence.filter(function (k) { return dico.get(k) !== k; })
                .concat(parFrequence.filter(function (k) { return dico.get(k) === k; }));
        });
    },

    /** Point d'entrée : remplit GRAPHE.noeuds / parId depuis GRAPHE.origine (après le chargement du moteur). */
    extraire: function () {
        const X = window.GRAPHE_EXTRACTION;
        const noeuds = X.inventaire();
        X.arcs(noeuds);
        X.symboles(noeuds);
        window.GRAPHE.noeuds = noeuds;
    }
};
