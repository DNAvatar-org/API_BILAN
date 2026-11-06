// File: API_BILAN/data/ozone_afgl.js
// Desc: FORME verticale de l'ozone : rapport de mélange [mol/mol] en fonction de la pression [hPa], atmosphère standard US
//       des profils AFGL (Anderson et al. 1986, AFGL-TR-86-0110, table 1f ; copie CSV du paquet joseki, nollety/joseki).
//       Seule sa FORME sert : profilColonne la normalise à la colonne d'ozone de l'époque (SOLAIRE.colonneOzone). ❔ Pour une autre
//       teneur en O₂ la couche d'ozone change d'altitude (Segura et al. 2003) : forme actuelle déclarée à toutes les époques.
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.OZONE_AFGL={"p_hPa":[1013.0,898.8,795.0,701.2,616.6,540.5,472.2,411.1,356.5,308.0,265.0,227.0,194.0,165.8,141.7,121.1,103.5,88.5,75.65,64.67,55.29,47.29,40.47,34.67,29.72,25.49,17.43,11.97,8.01,5.746,4.15,2.871,2.06,1.491,1.09,0.7978,0.425,0.219,0.109,0.0522,0.024,0.0105,0.00446,0.00184,0.00076,0.00032,0.000145,7.1e-05,4.01e-05,2.54e-05],"x":[2.6599999999999997e-08,2.9299999999999998e-08,3.24e-08,3.32e-08,3.39e-08,3.7699999999999993e-08,4.11e-08,5.01e-08,5.97e-08,9.17e-08,1.31e-07,2.1499999999999998e-07,3.1e-07,3.8499999999999997e-07,5.03e-07,6.51e-07,8.699999999999999e-07,1.1899999999999998e-06,1.59e-06,2.0299999999999996e-06,2.58e-06,3.03e-06,3.6499999999999998e-06,4.17e-06,4.63e-06,5.12e-06,5.7999999999999995e-06,6.549999999999999e-06,7.37e-06,7.84e-06,7.8e-06,7.2999999999999996e-06,6.2e-06,5.25e-06,4.1e-06,3.1e-06,1.8e-06,1.1e-06,7e-07,3e-07,2.5e-07,3e-07,5e-07,7e-07,7e-07,4e-07,2e-07,5e-08,5e-09,5e-10]};
