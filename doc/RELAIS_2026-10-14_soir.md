# Relais 2026-10-14 (soir) — calottes portées, frontières d'hystérésis, épistémologie, onglet Histoire

Branche `algo-solaire-nuages-physique` (API_BILAN et CO2). Fait suite à `doc/RELAIS_2026-10-14_calottes.md` (lire ses règles).
À lire aussi : `doc/HYSTERESIS_FRONTIERES.md` (frontières, script, état), `data/episteme.js` (statuts des sources).

## Règles de l'utilisateur (ajoutées pendant la session)

- **DATA est la donnée unique** : pas de duplication de variables (ex. `STATE.calottes` retiré ; `📜📅` supprimé → `CLICS.date()` ;
  `N2_1PAL_KG`, `STURTIEN_CO2_KG` / `STURTIEN_CH4_KG` : une constante, plusieurs époques).
- **Épistémologie** : chaque valeur / formule porte son statut 🧭 (⚛ physique · 📡 mesure directe · 🦴 reconstruction · 💻 simulation
  publiée · ❔ extrapolé · ⚠️ sans source) et son usage 🛠 (📌 posée · 🎚️ jauge · 🔧 calage · 🔢 numérique · 🎯 comparaison seulement),
  **par usage** (pas par référence), dans `data/episteme.js`, affiché par equation.html, BIBLIOGRAPHIE.html et le dico.
- **GIEC = 🎯 seulement**, jamais une entrée (« trop politique ; l'objectif est de le valider ou l'invalider ») ; physique et
  publications de chercheurs.
- **Paléo = des fourchettes**, pas des valeurs exactes.
- **Frise = clic** : une config frontière doit tenir au clic frise ET par la chaîne de clics ; la chaîne part de **⚫** (comme le bench
  tictime et l'interface).
- ⚫ à albédo nul à 5 Ga : **voulu** (pédagogique) ; un ☄️ y apporte 3e20 kg (~590 m d'eau) → glace partout, −97 °C : physique.
- Commit quand l'utilisateur le dit, même instable.

## Ce qui a été fait (commits)

| dépôt | commit | quoi |
|---|---|---|
| API | e230631 | calottes portées au clic time (`DATA['🗻']['🍰🗻🧊']` daté `📅🗻🧊`, config au clic frise), 🔀 au temps écoulé, `CLICS.date()`, `N2_1PAL_KG`, `STURTIEN_*` |
| API | 123cb9a | frontière ☃ « frise = clic » 1 267,9 ppm / 30,48 ppm |
| API | ef51003, 9f50a10 | `doc/HYSTERESIS_FRONTIERES.md` |
| API | 4cc6ead | épistémologie : `data/episteme.js`, logos dans `alphabet.js`, `doc/js/episteme_rendu.js`, BIBLIOGRAPHIE découpée (css/js), 71 cartes identifiées |
| CO2 | 150b482 | `seuils_hysteresis.js` v2 (CO₂ + CH₄, frise = clic, borné) |
| CO2 | 8b40180 | Histoire : Cryogénien en fourchettes |
| API + CO2 | (ce soir) | pas de recherche ≤ 20 K ; fourchette sourcée 1b / 1c [10⁴ ; 10⁵] ppm ; F2 = 97 583, F4 = 95 649 ppm ; chaîne de frontière depuis ⚫ (v2.1) ; bibliographie : doublons fusionnés, 12 entrées archivées (section 15), Gumsley 2017 ; 139 liens 🧭 ; Histoire : Hadéen daté (Zahnle 2010), Archéen (Blake 2010), Paléoprotérozoïque (Gumsley 2017), rectangles retirés, glaciations en bande sous les logos, `title` de l'iframe retiré |

## Réparation du bench tictime

La chaîne ⚫ → 2025 tournait mais gelait dès 🦠 (−85 °C) : le pas de Search (140–200 K) faisait sauter la branche chaude à l'arrivée
de 🔥 (175 °C). Pas plafonné à **20 K** (`CONFIG_COMPUTE.maxSearchStepK`, un seul plafond) : 🦠 arrive à 15,07 °C (= frise 15,05).
Puis la chaîne restait gelée après ⛄ : 1b à 10 263 ppm ne sortait pas → fourchette sourcée et frontières F2 / F4 remesurées.

## État des chiffres (chaîne de clics depuis ⚫, jauges 45 / 45 / 70 / 70)

Chaîne de clics (`_logs/courbe_clics.tsv`) : ⚫ −18,5 → ☄️ −97 (glace, voulu) · 🔥 2 550 → 1 454 → 175 °C · 🦠 15,1 / 14,3 / 10,5 ·
🪸 12,6 / 15,2 / 15,6 · ☃ 7,5 · ⛄ −76,4 / −76,8 · **1b sort : 36,8** → 32,2 → 24,3 · 🏂 −76,0 / −73,7 · **1c sort : 36,7** · 🪼 14,1 ·
🍄 16,3 puis **regèle au 2ᵉ clic (377 Ma, 625 ppm) : −71,9 °C**, et tout reste gelé jusqu'en 2025 (≈ −74 °C).

Clic frise par époque (`_logs/courbe_frise.tsv`, courbe orange tracée) : 🦠 15,1 · 🪸 12,5 · ☃ 7,2 · ⛄ −80,0 · 1b 36,7 · 🏂 −79,3 ·
1c 37,1 · 🪼 14,3 · 🍄 16,5 · 💀 20,2 · 🦕 19,1 · 🦤 18,0 · 🐊 19,6 · 🐧 16,7 · 🏔 11,8 · **🦣 −69,5** · 🛖 11,1 · 🚂 11,1 · 📱 12,8.

→ **Prochaine panne de la chaîne : 🍄 au 2ᵉ clic** (Carbonifère, CO₂ glissant vers 625 → 292 ppm) bascule en snowball. La glaciation
paléozoïque (~340–260 Ma) a existé, mais régionale (Gondwana), pas un snowball : c'est la bistabilité calottes / glace de mer (chantier 1)
qui doit la rendre partielle et réversible — voir la mémoire « 🍄 Karoo… la falaise CH₄ ».

## Chantiers ouverts (par priorité)

0. **🍄 2ᵉ clic → snowball** : la chaîne regèle à 377 Ma et ne repart plus (cf. ci-dessus) ; 🦣 gèle aussi au clic frise.
1. **Calottes (chantier 2 du relais précédent)** : l'équilibre englacé couvre TOUT le continent de la bande dès qu'une calotte existe
   (aEq N_pol 0,80) — rien ne borne la calotte ; accumulation antarctique ~23 contre 143 kg m⁻² an⁻¹ mesurés (Arthern 2006) ;
   🛖 provisoire (partage par bande des calottes de 11,7 ka à calculer des isochrones Dalton 2020 / DATED-1 : téléchargement à demander) ;
   🦣 au bord de la falaise (CH₄ 0,78 / 0,80 ppm).
2. **Recaler 2000 aux jauges** (📱 ~12,8 °C au clic frise, cible 14,4) — APRÈS le chantier calottes.
3. **Hadéen** : le CO₂ de 🔥 n'est jamais retiré → le modèle reste ~175 °C jusqu'à 4,03 Ga, la littérature 20–100 Ma (Zahnle 2010).
4. **F3 🏂** : fourchette [300 ; 1 500] ppm non sourcée ; config 2 556,7 ppm hors fourchette (gèle partout). À sourcer.
5. **Frontières fragiles** (0,02 %) : toute modification en amont peut les déplacer ; relancer `seuils_hysteresis.js` (une à la fois).
6. **Bibliographie** :
   - entrées à ajouter (citées par les cartes, vérifier avant d'écrire) : McDonough & Sun 1995, Turcotte & Schubert 2014, Jaupart 2015,
     Herzberg 2007, Karato & Wu 1993, Abe 1997, Stevenson 1983, Solomatov 2000, Hansen & Travis 1974, van der Ent 2017, Schmidt 2010,
     Lacis 2010, Elsasser 1942, Goody & Yung 1989, Cooke 2022, HITRAN 2020 (Gordon 2022), ERA5, Humlíček ;
   - 6 cartes sans lien 🧭 (`eq-bornes-numeriques-transfert`, `eq-capacites-thermiques-chaleur-latente`, `eq-chaleur-radiogenique`,
     `eq-grille-verticale`, `eq-pression-surface-masse-molaire`, `eq-tables-grille-spectrale`) ;
   - ~150 entrées anciennes n'ont encore que leur texte d'usage (pas de liens 🧭) ; clés DATA du dico : seule `🍰🗻🧊` est liée.
7. **Origine des âges** : 2025 (3 copies : `INTERIEUR.CONST.AN_PRESENT`, `histoire/epoques.js`, `courbe_modele.js`) contre des âges
   de config en b2k (🦣 ◀ 11 700 / 🛖 ▶ −9 700) → 25 ans de décalage à la jonction. Décision utilisateur : 2000 ou 2025, puis UNE constante.
8. **Onglet Histoire** : 4,41 → 4,0 Ga reste un raccord droit ; KT2018 (un point / 40 Ma) couvre seul le « milliard ennuyeux ».

## Outils

- `python3 CO2/scripts/bench_headless/courbe_modele.py` (clics) puis `… frise` : régénère les courbes orange de l'onglet Histoire
  (`courbe_modele.js`, `courbe_modele_frise.js` — c'est la frise qui est tracée) et `_logs/courbe_*.tsv`. ~70 s chacune.
- `seuils_hysteresis.js` v2.1 : préfixer `window.__FRONTIERES__=['F2','F4'];` ; ~25 min pour deux frontières.
- `scenarios.js` (sonde par clic frise), `bilan_vs_T.js`, `tableau.py` ; un seul banc à la fois (ports fixes).
- Vérifier le registre épistémique : charger `data/alphabet.js` + `data/episteme.js` + `doc/js/episteme_rendu.js` dans jsc
  (statuts / usages valides) ; BIBLIOGRAPHIE.html crashe si une référence citée manque.
