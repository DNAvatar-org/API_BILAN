# File: API_BILAN/data/sources/matthews_desert.py
# Desc: Part de DÉSERT des terres libres de glace de chaque bande du bilan méridien (|φ| 0–30°, 30–60°, 60–90°, par hémisphère),
#       depuis la carte de végétation de Matthews 1983 (J. Clim. Appl. Meteor. 22:474), 1° × 1°, NASA GISS
#       (https://data.giss.nasa.gov/landuse/data/VEG1X1.MATTHEWS.txt.gz) : type 30 = désert, 31 = glace, −9999 = océan ; ligne 0 =
#       89,5° S, colonne 0 = 179,5° W ; aire ∝ cos φ. Sortie : la table EARTH.DESERT_PAR_BANDE de physics/physics.js.
#       Usage : python3 -I matthews_desert.py <VEG1X1.MATTHEWS.txt>
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Date: [November 06, 2026]
import sys, math

v = []
for ligne in open(sys.argv[1]).read().splitlines()[3:]:
    v += [int(x) for x in ligne.split()]
assert len(v) == 360 * 180, len(v)
BANDES = {'S_pol': (-90, -60), 'S_mid': (-60, -30), 'S_trop': (-30, 0), 'N_trop': (0, 30), 'N_mid': (30, 60), 'N_pol': (60, 90)}
sortie = {}
for cle, (a, b) in BANDES.items():
    libre = desert = 0.0
    for i in range(180):
        lat = -89.5 + i
        if not a <= lat < b:
            continue
        w = math.cos(math.radians(lat))
        for t in v[i * 360:(i + 1) * 360]:
            if t == -9999 or t == 31:
                continue
            libre += w
            desert += w * (t == 30)
    sortie[cle] = round(desert / libre, 3) if libre > 0 else 0.0
print(sortie)
