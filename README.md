# Nate Mueller's world

An explorable isometric portfolio. Ten ancient sanctuaries across three connected biome islands lead to Nate's projects and About page. The map is rendered as real 3D geometry with Three.js, using the supplied visual references as direction for the terraced stone, cubic trees, pastel lighting, and dormant portals.

## Local preview

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. There is no build step, package installation, runtime CDN, or API key.

## Islands

- The blossom gardens: iOS apps, with Lumina, Glass Aquarium, and Mold Marauder. Broad planted terraces, layered blossom canopies, wildflowers, and a jade pond.
- The twilight wilds: games, with Mossbell, Dead Frequency, and Nerf Arena Blast. A stepped basalt ridge, conifers, oversized mushrooms, and crystal clusters.
- The sunlit archives: About Nate, GitHub, X, and Telegram.

The islands float above a generated cloud backdrop, with uneven rocky undersides and subtle cloud drift. The sky also changes with dusk mode. The islands connect in a loop through three stone bridges. Bridges and approach paths share one orthogonal grid. Right-angle turns have open corner landings, and railings follow only the outer route edges. The initial and home views focus on the About temple. The starting distance is the maximum zoom-out distance (`MAX_VIEW_SIZE = 58`); wheel, buttons, pinch, and island shortcuts all respect it. Visitors can zoom closer and pan between the islands.

## Controls

- Drag the landscape to pan; scroll to zoom.
- On a touchscreen, drag with one finger or pinch with two fingers.
- Focus the map and use arrow keys or WASD to pan, and plus/minus to zoom.
- Hover a portal or move the camera close to its temple to wake it. Click the portal or its floating marker to open the preview.
- All places provides direct access to every project. Selecting a place moves the camera and opens its preview.
- Dusk / Dawn changes the lighting. Sound is opt-in and synthesized locally.
- The island shortcuts move between biomes without zooming out beyond the starting distance.
- The home control returns to the About temple. Start a new walk, in All places, clears this portfolio's local discovery progress.

## Implementation

- `index.html`: minimal map UI, native preview dialog, accessible project fallback.
- `main.css`: desktop and mobile controls, project previews, day/night UI.
- `world.js`: deterministic terrain, instanced geometry, temples, portal shaders, camera controls, discovery, and optional sound.
- `images/sky/`: cloud backdrop, original artwork, and generation prompt.
- `vendor/`: pinned Three.js 0.180.0 modules, downloaded from the official npm package through jsDelivr, plus its MIT license.
- `cabinet.html`, `cabinet.css`, `cabinet.js`, and `images/cabinet/`: preserved first cabinet study, separate from the map.

The preview artwork is a rendered view of each actual temple. Project links and descriptions use the existing portfolio's destinations. There is no backend or AI inference service. Only discovered place IDs are stored in localStorage. Storage failure does not prevent exploration. Reduced-motion preferences disable drifting particles and animated portal motion, and make camera transitions immediate. Rendering and sound pause when the page is hidden.

## Validation

Verified in the local browser:

- Project previews, their headings, destination URLs, and discovery counts.
- Discovery persistence and starting a fresh walk.
- Pointer drag, zoom buttons, keyboard pan, reset view, day/night switch.
- Native dialog dismissal with Escape and mobile preview layout.
- Desktop, 390px, and 320px layouts with no horizontal overflow.
- No browser console errors during these checks.

Touch and pinch event handling is implemented. The in-app browser test interface does not support synthetic touch input, so physical touch gestures still need an actual-device check.

Run `node --check world.js` and `git diff --check` for syntax and patch checks. This work has not been deployed.

The About island uses flat sandstone mesas, a winding dry canyon, branching cacti, and a palm spring. Temple clearings and the orthogonal bridge approaches remain reserved in terrain generation.

Background music: user-supplied “Portal Drift” (`audio/portal-drift.m4a`), looped at 30% volume through the opt-in sound toggle. Replaces the synthesized drone; quiet portal discovery chimes remain. Playback pauses when hidden and resumes at its previous position.
