# EULER — Protocole Zéro

Jeu pédagogique spatial en français, adapté des quatre feuilles fournies : dérivées, fonction exponentielle, condensateur et méthode d’Euler.

## Jouer

Ouvre **EULER-Protocole-Zero.html** dans un navigateur moderne. Ce fichier contient tout le jeu et fonctionne hors connexion, sans installation. La version en ligne est accessible à https://euler-protocole-zero-29oct.lonycadu1.chatgpt.site.

La copie des sources contient aussi `index.html`, `style.css`, `app.js`, `questions.js`, `scene.js`, `lab.js` et `assets/space.png`. Ouvre `index.html` pour jouer ou sers ce dossier avec un serveur HTTP statique.

## Contenu

- Six secteurs : fondations, produits et compositions, trigonométrie et logarithmes, exponentielle, condensateur, Euler.
- 60 questions vérifiées : 39 QCM et 21 réponses numériques, avec indices et corrections.
- Missions de 8 rencontres, gardiens, combos, étoiles, XP et améliorations de vaisseau.
- Exploration sans chronomètre ; Assaut avec 45 secondes par question.
- Révision des erreurs, simulation libre, 12 fiches de formules et deux laboratoires interactifs.
- Décor original, animation Canvas, effets sonores activables, affichage adaptatif et réduction des animations.

## Commandes

Choisis les réponses à la souris ou au toucher. Les touches **1 à 4** répondent aux QCM. Pour les résultats numériques, une virgule ou un point sont acceptés. **Entrée** valide le champ ou le bouton sélectionné. **Échap** ouvre la pause. Le bouton Pause et la navigation permettent de revenir à la carte et de reprendre la mission.

Une erreur retire un point de coque. Une bonne réponse déclenche un tir et rapporte des XP. Un indice réduit les XP de cette question. La coque renforcée, le réacteur et le scanner se débloquent avec les crédits gagnés en jeu. Aucune monnaie réelle.

## Sauvegarde

La progression est automatiquement enregistrée dans le stockage local du navigateur, pour l’adresse utilisée. Elle n’est pas synchronisée entre navigateurs, appareils ou versions locale/en ligne. Un navigateur privé ou un effacement de ses données peut supprimer cette sauvegarde. Les réglages permettent de recommencer à zéro après confirmation.

## Vérifications

Contrôles de syntaxe JavaScript ; structure des 60 questions ; recalcul de toutes les réponses numériques ; contrôle des dérivées. Essai réel dans le navigateur d’une mission complète, des erreurs, indices, arrondis, récompenses, déverrouillage, achat du scanner, révision, sauvegarde et reprise. Contrôle des deux laboratoires, du clavier et de l’affichage à largeur mobile simulée. Pas de test sur téléphone physique.

## Décor

L’image `assets/space.png` a été créée avec l’outil intégré image_gen, puis inspectée et intégrée sans modification. Elle est incluse dans le fichier autonome et dans l’archive des sources. Prompt de génération :

Use case: stylized-concept
Asset type: cinematic science-fiction game background, landscape 16:9, ultra wide, polished AAA game key art.
Primary request: A spectacular immense burnt orange planet fills the right 55% of the image, realistic rust and copper surface textures with delicate wispy cloud systems and a thin glowing atmospheric rim. Deep black-teal outer space on the left. A tiny elegant research spacecraft silhouette in the lower right brings a sense of enormous scale. One very large faint circular orbital ring gently arcs through the surrounding space.
Style/medium: photorealistic 3D cinematic matte painting, sophisticated restrained premium film and video game art direction, exceptionally beautiful and credible planetary atmosphere.
Composition/framing: 16:9 widescreen. Planet dramatically placed on the right, slightly cropped by the right edge. The left 45% must remain very dark, calm, clear negative space for game UI text, with only a few tiny distant stars. Spacious composition. No UI is drawn.
Lighting/mood: warm copper light and a delicate golden atmospheric rim against cold near-black teal shadows, awe and quiet exploration, subtle volumetric depth, refined contrast.
Constraints: no lettering, no words, no labels, no typography, no UI, no logos, no collage, no watermarks, no bright stars or objects in the left 45%, no crowded composition, no cartoon look.

Generated with the built-in image_gen tool. No reference images. Copied unmodified to work/euler-protocol/dist/assets/space.png.

