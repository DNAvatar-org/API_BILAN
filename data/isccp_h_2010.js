// File: API_BILAN/data/isccp_h_2010.js
// Desc: Nuages VUS D'EN HAUT, Terre 2010, MESURÉS par ISCCP-H (moyennes mensuelles HGM, NOAA NCEI ; Young et al. 2018, ESSD
//       10:583) : par niveau de sommet L (> 680 hPa), M (440–680), H (< 440) et classe de τ visible (≤ 3,55 ; ≤ 22,63 ; > 22,63),
//       quantité vue d'en haut `a` et τ moyen RADIATIF `tau` (liquide + glace). Référence du simulateur radiative/nuages_isccp.js,
//       affichée au banc pour 📱 : un CONTRÔLE, pas une cible. Engendré par data/sources/isccp_h_2010.py — ne pas éditer.
//       ⚠️ ISCCP : jour seulement (τ visible), cirrus fins parfois placés plus bas ; le τ d'un type est celui de la COLONNE.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.ISCCP_H_2010 = {"classes_tau": [3.55, 22.63], "niveaux": {"L": {"a": 0.2314, "tau": 4.88, "classes": [{"a": 0.1026, "tau": 1.77}, {"a": 0.1064, "tau": 7.24}, {"a": 0.0224, "tau": 42.75}]}, "M": {"a": 0.1894, "tau": 6.73, "classes": [{"a": 0.0655, "tau": 1.39}, {"a": 0.0835, "tau": 8.44}, {"a": 0.0403, "tau": 46.94}]}, "H": {"a": 0.2468, "tau": 3.83, "classes": [{"a": 0.1396, "tau": 0.79}, {"a": 0.0676, "tau": 8.27}, {"a": 0.0397, "tau": 47.3}]}}, "total": {"a": 0.6676, "tau": 4.91}};
