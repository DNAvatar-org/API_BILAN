# Relais 2026-10-14 — équations, réglages hérités, bilan méridien, calottes

Branche `algo-solaire-nuages-physique` (API_BILAN et CO2). Tout est commité. Lire d'abord `doc/AUDIT_REGLAGES_HERITES.md`
(§ 1 à 8 : ce qui a été corrigé et pourquoi) et `doc/equation.html` (chaque équation classée P / M / F / C / N / ⚠️).

## Règles de l'utilisateur (à respecter, rappelées pendant la session)

- **Exact, pas tuné.** Physique > mesure > fourchette de littérature. Le tuning, ce sont les jauges (bary) — seulement elles.
  Si une correction physique casse les chiffres, ce n'est pas grave : on recale ensuite 2000 aux jauges.
- **Des équations plutôt que des valeurs posées**, sourcées dans la littérature ; ne rien poser « de mémoire » sans le dire.
  Vérifier les constantes dans les articles (WebSearch / WebFetch, PDF lus page par page si besoin). Ne pas inventer de DOI.
- **Bibliographie à jour** à chaque source utilisée (`doc/BIBLIOGRAPHIE.html`, section 13 pour cette session).
- **Si la littérature dit 1 PAL, c'est 1 PAL** : les gaz se calent sur les fourchettes publiées, pas sur le résultat.
- **Les bistabilités sont précieuses** (snowball, calottes) : ne pas les retirer, trouver les bonnes équations.
- **HYSTERESIS ne se retire pas** : qu'elle n'agisse pas est un SYMPTÔME (rampe de mer gelée sur la T globale, alors que la
  glace de mer se fait par zone).
- Tester **quelques époques** avec la sonde plutôt que le banc complet ; **toujours borner une dichotomie** (le script des
  seuils a tourné sans plafond — à ne pas refaire).
- En-têtes de fichiers courts : crédits + 1 à 3 lignes de version (l'historique est dans git).
- Pas de découpage des gros fichiers avant d'avoir retrouvé les convergences.

## Ce qui a été fait (commits, dans l'ordre)

| | quoi |
|---|---|
| page | `doc/equation.html` réécrite depuis le code (css/, js/), encadré « la fraction nuageuse n'a pas de solution 1D » |
| corrections | M_sec harmonique ; fractions de zones géométriques ; proxy CCN O₂×biomasse×anthro retiré ; CH4_EDS_SCALE ; lave = péridotite ; factorTropopause |
| nuages | la glace précipite (sommet à f_liq·LWC_pluie) ; **masse d'air maritime = bassins, banquise comprise** (la banquise comptait comme un continent à 200 gouttes/cm³ : rétroaction artificielle vers le snowball) ; nombre de gouttes défini une fois (`ALBEDO.nombreGouttes*Cm3`) |
| config | N₂ = 1 PAL (3,878e18 kg) partout sauf ⚫ 🔥 (c'étaient des restes) ; O₂ du Phanérozoïque sourcé (Krause 2018) ; 🦠 N₂ mesuré ; 🪸 pCO₂ 57 mbar (paléosols) ; `🥶` retirés |
| jauges | FROID / CHAUD inversées (100 % = le plus chaud, 🔺) ; sens 🔺🔻↕️ affiché (`TUNING.sensJauge`) ; défaut 45 / 45 / 70 / 70 (📱 14,5 °C) |
| affichage | « ✈ N /cm³ » (rapport CCN du moteur ; l'ancien min(0,35 ; sulfate×500) était inventé) |
| bilan méridien | `physics/meridien.js` : North, Cahalan & Coakley 1981 (deux modes, B = 2,09, D = 0,649 publiés) ; `SOLAIRE.albedoMu` ; `EARTH.facteurGlaceZones` ; `STATE.dTzones` |
| calottes | `physics/calottes.js` (Nye, isostasie, degrés-jours Braithwaite/Reeh, accumulation à l'inversion Jouzel & Merlivat, naissance sur les hautes terres) + `data/paleogeo_zones.js` calculé des PaleoDEM (Scotese & Wright 2018, CC-BY ; script `CO2/scripts/paleogeo/paleodem_zones.py`) |
| nettoyage | 1 692 lignes de journaux de version retirées (67 fichiers, vérifié jsc + sonde) |

## État des chiffres (sonde, jauges 45 / 45 / 70 / 70)

📱 14,5 ✓ · 🚂 13,3 ✓ · 🦣 13,4 ✓ · 🦠 ~16 ✓ · 🪸 12,5 ✓ · 🪼 14,3 (15–25) · 🍄 16,5 (26–39) · 🦕 19,1 (24–32) ·
🐊 19,6 (30–39) · 🏔 15,7 (21–25) · ☃ (hysteresis 1a) snowball à 72 ppm, **11,0 °C ✓ à 2 000 ppm** (borne haute) · ⛄ 🏂 −75/−78 (−60/−50).

## Chantiers ouverts (par priorité)

1. **Calottes : porter leur état au CLIC TIME (pas au clic d'époque).** Décision utilisateur : au clic d'époque (frise), la
   calotte vient de la **config** — ajouter dans chaque époque les données de calottes (aire par bande et par hémisphère,
   sourcées : Antarctique ~14e6 km², Groenland ~1,7e6 km² aujourd'hui ; présence / absence des glaciations du passé). Au clic
   time, l'état se transporte d'un clic à l'autre (comme l'intérieur, `INTERIEUR.avancer`) et évolue par le bilan de masse.
   Aujourd'hui (`calculations_albedo.js`) : la graine part de l'état SANS glace et rien ne naît (pôle ~10 K trop chaud) ; un essai
   « départ tout englacé » couvrait tout l'Arctique (📱 0,6 °C) — rejeté.
2. **Bistabilité des calottes / snowball.** L'utilisateur : la calotte devrait arriver avec le snowball et ne plus partir —
   à confronter à l'histoire : les glaciations sont venues et reparties (snowballs Sturtien ~717–660 Ma et Marinoen ~650–635 Ma,
   tous deux terminés ; glaciation fini-ordovicienne ~445 Ma sur le Gondwana ; âge glaciaire paléozoïque ~340–260 Ma ; lacune
   glaciaire mésozoïque ~225 Ma (Muttoni & Kent 2026) ; Antarctique depuis ~34 Ma ; hémisphère Nord depuis ~2,7 Ma). Les
   continents bougent (PaleoDEM) et le CO₂ / le Soleil changent : une calotte peut disparaître. Trouver les équations / paramètres
   pour que la bistabilité fonctionne (accumulation calculée 3,5× trop faible ; amplitude saisonnière polaire ⚠️ ; gradient).
3. **Pôle trop chaud** : T₂ moderne −20,7 contre −28 mesuré (North 1981). Deux causes : les deux modes de North sous-estiment le
   froid polaire (sa fig. 5) ; et sans calotte la zone polaire est sombre (co-albédo 0,67 contre 0,52 observé). Le tout est la
   bistabilité glace-albédo elle-même. Ne PAS régler D (compenser l'albédo par le transport).
4. **Frontières F1–F4** (`seuils_hysteresis.js`, BORNER la recherche) : ☃ doit être remis dans sa fourchette [500 ; 2 000] ppm
   (2 000 ppm le garde chaud) ; la chaîne depuis 🪸 gelait parce que le CO₂ de 🪸 glisse (🔀) vers celui de ☃. F1 à 6 500 ppm,
   F3 🏂 ≈ 3,44e16 kg, F2 et F4 sans seuil sous ~4e17 kg (sortie de snowball ~0,1 bar, cohérent Pierrehumbert 2005).
5. **HYSTERESIS** : proposé (pas encore tranché par l'utilisateur) de la brancher sur les amplitudes saisonnières (largeur des
   rampes de zone, valeurs ⚠️ à relever dans ERA5) plutôt que sur la rampe de mer gelée globale.
6. **🔥 Hadéen** : laissé hors du N₂ à 1 PAL (CO₂ donné en bars dans la littérature, ~70 bar). À trancher.
7. Restants de l'audit (§ 2) : forêts / déserts sans source, ⚫ noir via la masse d'eau, Q(T) sans vibrations, k corrélé
   (√(P/P₀) n'est PAS la cause de l'Archéen chaud : sans lui tout est plus chaud).

## Outils (CO2/scripts/bench_headless/)

- `run.py` + `bench19.js` : banc complet (~3 min) ; `seuils_hysteresis.js` : dichotomies F1–F4 (à borner !).
- `scenarios.js` : sonde par scénarios (config modifiée en mémoire, jauges, bilan détaillé incl. bilan méridien et calottes).
- `bilan_vs_T.js` : ΔF(T) à température imposée (existence des branches chaude / froide).
- `tableau.py` : `python3 tableau.py sortie.json nom,T,A,T2,cal`.
- `python3 run.py <script> --timeout 900` (le Mac n'a pas `timeout`) ; ne jamais lancer deux bancs à la fois (ports fixes).
- Syntaxe JS : `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -e "checkSyntax('fichier.js')"`.
- Page 🔎 Paramètres : `python3 CO2/scripts/params_doc/generate.py` (échoue si une unité manque).
- PaleoDEM : `PaleoDEMS_long_lat_elev_csv_v2.zip` (19 Mo, earthbyte.org) — à re-télécharger (avec accord) pour régénérer la table.
