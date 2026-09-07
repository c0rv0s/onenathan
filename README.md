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


## Optional first-person game

`first-person-game.js` and `game-physics.js` are dynamically imported only on First person entry. Enemy meshes, the collision index, sword, and health HUD are constructed then. The isometric map never imports those modules on its initial load. A separate loading screen covers construction; procedural models reuse local Three.js and require no external assets.

- WASD / arrows move; hold Shift to run. Hits knock the recipient backward with collision checks. Space jumps, with one additional jump in the air. Small stairs auto-step. Gravity and collisions apply to cliffs, bridges, and ruins.
- Desktop mouse capture starts with Click to play. Escape releases the mouse and pauses gameplay. Portal previews release capture and pause simulation; Click to play resumes afterward. Browsers that reject pointer lock offer drag controls. Touch has movement, jump, swing, and portal buttons.
- Click swings the right-hand sword forward; E opens a portal within reach. A sword swing aimed at a portal within 3.8 units opens the same preview at swing contact and pauses combat immediately. Enemies flash red on successful hits.
- Skeleton warriors guard About, snakes guard iOS, and spiders guard Games. They chase nearby players within their biome, wind up attacks, deal damage, and can be defeated. Health loss or falling returns the player to their entry sanctuary. Defeated enemies can respawn after a delay when the player is away.
- Back to map hides the game and restores the original map camera.

Validation: `node tests/game-physics.test.mjs` covers double jump, landing reset, wall collision, stairs, and falling. `node tests/game-combat.test.mjs` covers biome enemies, aggro, damage, sword kills, modal pause, and exit. Browser entry/rendering and fallback are verified in the in-app browser, which rejects pointer lock; Chrome automation timed out, so real mouse capture still needs manual verification there.

Monsters wander between nearby destinations, rest, and interrupt wandering to chase. Defeated skeletons fall sideways; snakes and spiders roll over and remain visible until an out-of-sight respawn. Monster updates are grouped by island: only the player's current island advances AI, hit flashes, death animations, and respawn timers. Combat tests cover visible fallen bodies, wandering/resting, and exact state preservation on inactive islands.

First-person sky rendering reconstructs camera rays and projects clouds onto a distant world-space sphere. The isometric map and temple previews retain the original aspect-fitted cloud image and gentle drift.

## VR / Oculus Rift + Touch

Enter First person, then Enter VR. This uses an immersive WebXR session with a `local-floor` reference space; it requires a headset exposed by the browser and HTTPS (or localhost on the headset-connected computer). A Rift should be connected to its PC with the PC VR runtime running. The desktop in-app preview reports No VR headset when no immersive device is exposed. VR is not streamed from the Mac preview to a Rift PC; use the site on the PC itself. Nothing has been deployed by this change.

`vr-mode.js` and `vr-input.js` load only after requesting VR. The renderer uses `setAnimationLoop` for XR-synchronized frames. The existing game supplies movement, double jump, collisions, health, combat, and island-local enemy simulation. Touch controls use `xr-standard`: left stick movement, left grip sprint, right stick 30-degree snap turns, A jump/double jump, B pause menu. The right controller carries a tracked sword; right trigger or a fast physical blade movement attacks. Either controller can point at a portal and select it. Headset panels pause combat and offer Resume or View link on desktop; the latter exits VR into the regular project preview. Health appears on the left wrist.

Session exit removes controller listeners and VR-only geometry/textures, restores the desktop camera, and resumes the normal first-person UI. Headset visibility loss pauses simulation. The sky uses each XR eye's projection. The camera-mounted desktop sword/light is hidden in VR.

Tests: `node tests/vr.test.mjs` covers input mapping, deadzones, snap-turn edges, jump edges, trigger attacks, portal pause, and cleanup with a **mock XR session**. Existing physics/combat tests pass. Desktop fallback is browser-verified. Real Rift tracking, stereo rendering, button mapping on the user's runtime, and sustained frame rate remain unverified without connected hardware.

Implementation references: [Three.js WebXR basics](https://threejs.org/manual/en/webxr-basics.html), [WebXRManager](https://threejs.org/docs/pages/WebXRManager.html), and [WebXR input/gamepad mapping](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gamepad).
