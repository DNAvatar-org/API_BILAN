# File: API_BILAN/data/sources/isccp_h_2010.py
# Desc: Référence « nuages vus d'en haut » (data/isccp_h_2010.js) depuis ISCCP-H, moyennes mensuelles globales (HGM) de 2010 :
#       pour chaque niveau de sommet (bas > 680 hPa, moyen 440–680, haut < 440) et classe ISCCP d'épaisseur optique visible
#       (τ ≤ 3,55 ; ≤ 22,63 ; > 22,63), la quantité vue d'en haut et le τ moyen RADIATIF (réflectance moyennée puis inversée,
#       même réflectance deux-flux que le modèle : R = √3(1−g)τ / (2 + √3(1−g)τ), g = 0,85), phases liquide et glace réunies.
#       Grille à aires égales (eqcell) : moyenne globale = moyenne simple des cellules.
#       Données : NOAA NCEI, ISCCP-H, ISCCP.HGM.v01r00.GLOBAL.2010.MM.99.9999.GPC.10KM.CS00.EQ1.00.nc (Young et al. 2018,
#       ESSD 10:583). Usage : python3 -I isccp_h_2010.py <dossier des 12 fichiers HGM 2010> <sortie .js>  (lit avec ncdump)
# Version 1.0.0
# Date: [October 15, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, os, glob, math, subprocess, json
import numpy as np

def lire(f, v):
    t = subprocess.run(['ncdump', '-v', v, f], capture_output=True, text=True, check=True).stdout
    corps = t.split(v + ' =', 2)[-1].split(';')[0]
    return np.array([np.nan if x.strip() == '_' else float(x) for x in corps.replace('\n', ' ').split(',')])

G = 0.85
B = math.sqrt(3) * (1 - G)
R = np.vectorize(lambda t: B * t / (2 + B * t))
inv = lambda r: 2 * r / (1 - r) / B

fichiers = sorted(glob.glob(os.path.join(sys.argv[1], '*2010*.nc')))
assert len(fichiers) == 12, fichiers
tautab = lire(fichiers[0], 'tautab')
# Types ISCCP-H (cloud_type_label) : 0–5 bas (Cu, Sc, St liquide puis glace), 6–11 moyens, 12–17 hauts.
somA = np.zeros(18); somAR = np.zeros(18)
for f in fichiers:
    A = lire(f, 'cldamt_types').reshape(18, -1) * 0.001        # pourcent ×10 → fraction
    T = lire(f, 'tau_types').reshape(18, -1)
    for k in range(18):
        ok = ~np.isnan(A[k])
        okt = ok & ~np.isnan(T[k]) & (A[k] > 0)
        somA[k] += np.nanmean(A[k])
        somAR[k] += np.sum(A[k][okt] * R(tautab[T[k][okt].astype(int)])) / ok.sum()
n = len(fichiers)
NIV = {'L': 0, 'M': 6, 'H': 12}
sortie = {'classes_tau': [3.55, 22.63], 'niveaux': {}, 'total': None}
aT = rT = 0
for niv, k0 in NIV.items():
    classes = []
    aN = rN = 0
    for c in range(3):
        a = (somA[k0 + c] + somA[k0 + 3 + c]) / n                # liquide + glace
        r = (somAR[k0 + c] + somAR[k0 + 3 + c]) / n
        classes.append({'a': round(a, 4), 'tau': round(inv(r / a), 2)})
        aN += a; rN += r
    sortie['niveaux'][niv] = {'a': round(aN, 4), 'tau': round(inv(rN / aN), 2), 'classes': classes}
    aT += aN; rT += rN
sortie['total'] = {'a': round(aT, 4), 'tau': round(inv(rT / aT), 2)}

entete = """// File: API_BILAN/data/isccp_h_2010.js
// Desc: Nuages VUS D'EN HAUT, Terre 2010, MESURÉS par ISCCP-H (moyennes mensuelles HGM, NOAA NCEI ; Young et al. 2018, ESSD
//       10:583) : par niveau de sommet L (> 680 hPa), M (440–680), H (< 440) et classe de τ visible (≤ 3,55 ; ≤ 22,63 ; > 22,63),
//       quantité vue d'en haut `a` et τ moyen RADIATIF `tau` (liquide + glace). Référence du simulateur radiative/nuages_isccp.js,
//       affichée au banc pour 📱 : un CONTRÔLE, pas une cible. Engendré par data/sources/isccp_h_2010.py — ne pas éditer.
//       ⚠️ ISCCP : jour seulement (τ visible), cirrus fins parfois placés plus bas ; le τ d'un type est celui de la COLONNE.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.ISCCP_H_2010 = """
open(sys.argv[2], 'w', encoding='utf-8').write(entete + json.dumps(sortie, ensure_ascii=False) + ';\n')
print(json.dumps(sortie, ensure_ascii=False))
