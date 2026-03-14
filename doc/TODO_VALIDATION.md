# TODO validation — formules et docs à mettre à jour une fois validé

- **H2O_EDS_SCALE** : formule physique actuelle dans `radiative/calculations.js` (et bundle `physicsAll.js`) :
  - `EARTH.H2O_EDS_SCALE = min(1.0, 0.92 × sqrt(P_ratio) × CO2_factor)` (plafonné à 1.0)
  - `P_ratio = DATA['⚖️']['⚖️🫧'] / 5.148e18` (masse atmosphère / ref 2025)
  - `CO2_factor = max(0.7, 1.0 - 2×DATA['🫧']['🍰🫧🏭'])`
  - **Quand validé** : ajouter cette formule dans le doc des formules (et dans doc/API si existant).
