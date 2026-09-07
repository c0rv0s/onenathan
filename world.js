import * as THREE from './vendor/three.module.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const places = [
  { id: 'about', name: 'About Nate', kind: 'The first temple', x: 0, z: 0, h: 3.4, color: '#e8b778', symbol: '✧', description: "I'm Nate. I build games, apps, onchain systems, and experiments that follow whatever I'm curious about.", note: 'Previously at dOrg, Hype Labs, and Bonsai. Exploring how much of an imagined world one person can bring to life with AI.', url: 'https://github.com/c0rv0s', link: 'Find me on GitHub' },
  { id: 'github', name: 'GitHub', kind: 'Code & projects', color: '#b7c9ee', symbol: '⌘', description: 'My code, repositories, and experiments.', note: '@c0rv0s', url: 'https://github.com/c0rv0s', link: 'Open GitHub' },
  { id: 'x', name: 'X', kind: 'Thoughts & updates', color: '#e6c9fa', symbol: '𝕏', description: 'Find me on X.', note: '@c0rv0s', url: 'https://x.com/c0rv0s', link: 'Open X' },
  { id: 'telegram', name: 'Telegram', kind: 'Get in touch', color: '#95e2ec', symbol: '↗', description: 'Have something in mind? Come say hello on Telegram.', note: '@c0rv0s', url: 'https://t.me/c0rv0s', link: 'Message me' },
  { id: 'mossbell', name: 'Mossbell', kind: 'A game · The overgrown sanctuary', x: -23, z: -16, h: 4.2, color: '#a8e7a0', symbol: '❋', description: 'A cozy life, gardening, and business simulator. A little world to settle into, tend to, and make your own.', note: 'Coming soon.', url: 'https://mossbell.netlify.app/', link: 'Visit Mossbell' },
  { id: 'lumina', name: 'Lumina', kind: 'An iOS app · The moon temple', x: 19, z: -20, h: 5, color: '#d4a8ff', symbol: '☾', description: 'A manifestation and astrology journal. A place to give your intentions, reflections, and imagined futures a little more room.', note: '', url: 'https://trylumina.today/', link: 'Explore Lumina' },
  { id: 'aquarium', name: 'Glass Aquarium', kind: 'An iOS app · The tide shrine', x: 25, z: 10, h: 1.7, color: '#85e5ed', symbol: '≈', description: 'An aquarium widget where the fish are chosen by how you sing. A small, living response to your voice.', note: 'Available on the App Store.', url: 'https://apps.apple.com/us/app/glass-aquarium/id6761319262', link: 'Meet the fish' },
  { id: 'deadfrequency', name: 'Dead Frequency', kind: 'A game · The forgotten signal', x: -6, z: -36, h: 5.8, color: '#f18ca4', symbol: '⌁', description: 'A haunted space roguelike about building a ship and finding out what is waiting in the dark.', note: '', url: 'https://deadfrequency.rip/', link: 'Enter Dead Frequency' },
  { id: 'nerf', name: 'Nerf Arena Blast', kind: 'A game · The sunken arena', x: -27, z: 13, h: 2.6, color: '#ffc283', symbol: '⊹', description: 'A revival of the classic Nerf Arena Blast. Bright arenas, familiar foam, and another reason to play.', note: '', url: 'https://nerf-arena-blast-revival.up.railway.app/', link: 'Enter the arena' },
  { id: 'mold', name: 'Mold Marauder', kind: 'An iOS game · The spore garden', x: 3, z: 28, h: 3, color: '#d6e993', symbol: '✺', description: 'An adventure game where you breed exotic slime molds. Strange little organisms with a world of their own.', note: 'Available on the App Store.', url: 'https://apps.apple.com/us/app/mold-marauder/id1505605329', link: 'Discover the molds' },
];

const islands = [
  {id:'ios',name:'iOS apps',biome:'The blossom gardens',x:-65,z:-20,r:45,grass:['#829d75','#91ad82','#a3b98e'],rock:['#b8b4cb','#c6bed1'],soil:'#9c827f',trees:['#e3adbd','#efc5ca','#cf9fb9']},
  {id:'games',name:'Games',biome:'The twilight wilds',x:55,z:-30,r:46,grass:['#787d99','#83859e','#686f89'],rock:['#78778e','#9290a9'],soil:'#786379',trees:['#9c8bb9','#b09ac7','#877caa']},
  {id:'studio',name:'About',biome:'The sunlit archives',x:0,z:75,r:43,grass:['#c9b895','#d2c1a1','#c3b18f'],rock:['#c5adb2','#d4bdba'],soil:'#bc927a',trees:['#c5b295','#d6c5a5','#bca589']}
];
const placements = {
  about:['studio',-15,65,4.4],
  github:['studio',12.5,52.5,5],x:['studio',20,87.5,4],telegram:['studio',-12.5,100,3.3],
  lumina:['ios',-75,-40,5],aquarium:['ios',-42,-10,1.7],mold:['ios',-83,0,3],
  mossbell:['games',35,-43,4.2],deadfrequency:['games',74,-50,7],nerf:['games',58,-9,3.5]
};
for(const p of places) [p.island,p.x,p.z,p.h]=placements[p.id];
function islandAt(x,z) {return islands.find(i=>Math.hypot((x-i.x)/1.08,z-i.z)<i.r+Math.sin((x-i.x)*.18)*2.8+Math.cos((z-i.z)*.2)*2.5);}
const MIN_VIEW_SIZE=19;
const MAX_VIEW_SIZE=58;
const aboutPlace=places.find(p=>p.id==='about');
// Orthogonal routes share the terrain's 2.5-unit grid. Turns become square
// landings, and the same cell set cuts the paths and builds the bridge decks.
const routes = [
  [[0,75],[-25,75],[-25,25],[-65,25],[-65,-20]],
  [[-65,-20],[-15,-20],[-15,-30],[55,-30]],
  [[55,-30],[55,25],[25,25],[25,75],[0,75]]
];
const routeCells=new Map();
const cellKey=(x,z)=>`${x},${z}`;
for(const route of routes){
  for(let i=1;i<route.length;i++){
    const [ax,az]=route[i-1].map(v=>v/2.5),[bx,bz]=route[i].map(v=>v/2.5);
    if(ax!==bx&&az!==bz)throw new Error('Bridge routes must follow a world axis.');
    const count=Math.abs(bx-ax)+Math.abs(bz-az),dx=Math.sign(bx-ax),dz=Math.sign(bz-az);
    for(let j=0;j<=count;j++)for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++){
      const gx=ax+dx*j+ox,gz=az+dz*j+oz;
      routeCells.set(cellKey(gx,gz),{gx,gz,x:gx*2.5,z:gz*2.5});
    }
  }
}
function onRoute(x,z){return routeCells.has(cellKey(Math.round(x/2.5),Math.round(z/2.5)));}
const bridgeCells=new Map();
for(const [key,cell] of routeCells){
  // Extend onto solid land by two cells to meet the approach paving cleanly.
  let landing=false;
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
    if(!islandAt(cell.x+dx*2.5,cell.z+dz*2.5))landing=true;
  }
  if(landing)bridgeCells.set(key,cell);
}


let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch {
  $('loading').hidden = true;
  $('fallback').hidden = false;
  throw new Error('WebGL could not initialize. The project links remain available.');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#cbbdd0');
scene.fog = new THREE.Fog('#cbbdd0', 270, 530);
let camera = new THREE.OrthographicCamera(-30, 30, 20, -20, .1, 800);
const mapCamera=camera;
const eyeCamera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,800);
eyeCamera.rotation.order='YXZ';
let firstPerson=false;
let vr=null,vrStarting=false;
const flightKeys=new Set();
const target = new THREE.Vector3(aboutPlace.x,aboutPlace.h+2,aboutPlace.z+3);
const desiredTarget = target.clone();
const offset = new THREE.Vector3(160, 155, 190);
let viewSize = MAX_VIEW_SIZE;
let desiredSize = viewSize;
let night = false;
let nightMix = 0;
let hovered = null;
let interacted = false;
let time = 0;
let pendingPreview = false;
let notificationTimer;
let pointerDown = false;
let didDrag = false;
let lastPointer = null;
let pinchDistance = 0;
const pointers = new Map();
const sun = new THREE.DirectionalLight('#ffe2d1', 3.1);
sun.position.set(-100, 220, 100);
sun.castShadow = true;
sun.shadow.mapSize.set(innerWidth<700?2048:4096,innerWidth<700?2048:4096);
Object.assign(sun.shadow.camera, { left: -205, right: 205, top: 205, bottom: -205, near: 1, far: 550 });
sun.shadow.bias = -.00045;
sun.shadow.normalBias = .09;
sun.shadow.radius = 3;
scene.add(sun);
const sky = new THREE.HemisphereLight('#efe5ff', '#706c85', 1.6);
scene.add(sky);

// Static blocks are batched by material; the world stays inexpensive to draw.
let randomSeed = 4261;
function rand() { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0; return randomSeed / 4294967296; }
const pick = (array) => array[Math.floor(rand() * array.length)];
const batches = new Map();
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const stoneColors = ['#c8bccb', '#d4c6cd', '#dcd0d2', '#c9bdc9', '#d7c7ce'];
const grassColors = ['#929969', '#99a775', '#a0a97d', '#8e9a6a', '#aab181'];
const pinkColors = ['#d9a6ba', '#e4b3bd', '#cf9cb6', '#e8c3c5', '#d7afc9'];
function block(x, y, z, w, h, d, color, material = 'land', rotation = 0) {
  if (!batches.has(material)) batches.set(material, []);
  batches.get(material).push({ x, y, z, w, h, d, color, rotation });
}
function stone(x, y, z, w, h, d) { block(x, y, z, w, h, d, pick(stoneColors)); }
const tile = 2.5;
function terrainHeight(x, z) {
  const island=islandAt(x,z);
  if(!island)return -3;
  for (const p of places) {
    if (Math.abs(x-p.x) < 10 && Math.abs(z-p.z) < (p.id==='about'?17:11)) return p.h;
  }
  if(onRoute(x,z))return 3;
  const lx=x-island.x,lz=z-island.z;
  const radius=Math.hypot(lx/1.08,lz);
  if(island.id==='ios') {
    // Broad planted terraces descend into a jade-water garden.
    const pond=Math.hypot((lx-8)/1.5,lz-12);
    if(pond<8)return .55;
    return Math.max(1.1,Math.floor((5+Math.sin(lx*.075)*2+Math.cos(lz*.09)*2-Math.max(0,radius-29)*.2)/1.4)*1.4);
  }
  if(island.id==='games') {
    // A broken basalt ridge rises behind a lower mushroom forest.
    const ridge=Math.exp(-Math.pow((lz+22)/9,2));
    return Math.max(.8,Math.floor((2+ridge*(8+Math.sin(lx*.22)*4)+Math.sin(lx*.16)*2+Math.cos(lz*.19)*2)/1.8)*1.8);
  }
  if(Math.hypot(x+30,(z-85)*1.3)<6)return .8;
  // Flat-topped sandstone mesas split by a winding dry canyon.
  const canyon=Math.abs(lx+5-Math.sin(lz*.1)*10);
  if(canyon<4)return .7;
  const mesa=Math.sin(lx*.085)+Math.cos(lz*.11);
  return mesa>1.05?10.5:mesa>.15?6:2.4;

}
const terrain = [];
for (let gx=-48;gx<=44;gx++) {
  for(let gz=-34;gz<=50;gz++) {
    const x=gx*tile, z=gz*tile, h=terrainHeight(x,z);
    if(h<0) continue;
    const island=islandAt(x,z);
    terrain.push({x,z,h,island});
    // Stack the layers edge-to-edge. Overlapping equal-width blocks create
    // coplanar cliff faces that flicker as the camera moves.
    const grassBottom = h - .16;
    const soilBottom = grassBottom - .18;
    const inward=Math.max(0,1-Math.hypot((x-island.x)/1.08,z-island.z)/island.r);
    const rockBottom=-6-Math.floor(inward*7)*2-Math.floor((Math.sin(x*1.7+z*.9)+1)*1.5);
    // At shore landings the deck replaces the terrain cap. Letting both
    // full-width blocks occupy this height produces coplanar side faces.
    if(bridgeCells.has(cellKey(gx,gz))) {
      const deckBottom=2.8-.63/2;
      block(x,(rockBottom+deckBottom)/2,z,tile,deckBottom-rockBottom,tile,pick(island.rock));
      continue;
    }
    block(x,(soilBottom+rockBottom)/2,z,tile,soilBottom-rockBottom,tile,pick(island.rock));
    block(x,(soilBottom+grassBottom)/2,z,tile,grassBottom-soilBottom,tile,island.soil);
    block(x,h-.06,z,tile,.2,tile,pick(island.grass));
    if(rand()<.29) block(x+(rand()-.5)*1.4,h+.045,z+(rand()-.5)*1.4,.6,.035,.5,pick(island.grass),'detail');
  }
}
// Each biome has its own vegetation silhouette, ground cover, and geology.
function gardenWater(x,z,h) {
  return islandAt(x,z)?.id==='ios' && h===.55;
}
for(const t of terrain) {
  const {x,z,h,island}=t;
  const nearTemple=places.some(p=>Math.abs(x-p.x)<11 && Math.abs(z-p.z)<(p.id==='about'?18:12));
  if(onRoute(x,z) && !nearTemple) {
    if(!bridgeCells.has(cellKey(Math.round(x/tile),Math.round(z/tile))))stone(x,h+.12,z,2.25,.15,2.25);
    continue;
  }
  if(nearTemple)continue;
  if(gardenWater(x,z,h)) {
    block(x,h+.09,z,tile,.08,tile,pick(['#70b9b1','#85c9bc','#91d0c2']));
    if(rand()<.18){block(x+.3,h+.15,z,.7,.04,.6,'#6d9878');block(x+.3,h+.22,z,.18,.1,.18,'#f1c5d0');}
    continue;
  }
  if(island.id==='ios') {
    for(let k=0;k<4;k++) {
      const fx=x+(rand()-.5)*2,fz=z+(rand()-.5)*2;
      block(fx,h+.16,fz,.045,.24,.045,'#69886a','detail');
      if(rand()<.7)block(fx,h+.3,fz,.13,.07,.13,pick(['#fff0d1','#e6afcf','#c7c7ee']),'detail');
    }
    if(rand()<.15 && h>1) {
      const height=2.4+rand()*2;
      block(x,h+height/2,z,.35,height,.4,'#796171');
      // Wide, layered blossom crowns, with low companion shrubs.
      block(x,h+height,z,3.5,.85,2.8,pick(island.trees));
      block(x-.4,h+height+.8,z-.2,2.6,.8,2.2,pick(island.trees));
      block(x+.3,h+height+1.45,z,1.5,.5,1.4,'#efc5ca');
      block(x+1,h+.4,z+1.1,1.2,.8,1,'#7d9b76');
    }
  } else if(island.id==='games') {
    if(rand()<.16) {
      // Angular spruce silhouettes distinguish the highland forest.
      const height=3+rand()*3;
      block(x,h+height/2,z,.32,height,.32,'#474e61');
      for(let j=0;j<4;j++)block(x,h+1.4+j*height*.22,z,2.6-j*.58,height*.3,2.6-j*.58,pick(['#526e78','#637b85','#718a8d']));
    } else if(rand()<.2) {
      const height=.5+rand()*1.3;
      block(x,h+height/2,z,.22,height,.22,'#b4c1bd');
      block(x,h+height,z,1.1,.3,1.1,pick(['#aba4d8','#91cdd1','#d9a6c8']));
      block(x-.2,h+height+.2,z,.5,.15,.55,'#d0d4ed');
    }
    if(rand()<.1) {
      const height=1+rand()*4;
      block(x+.6,h+height/2,z-.5,.6,height,.65,pick(['#8f8ac2','#aaa7de','#86b8c3']));
      block(x+.6,h+height+.18,z-.5,.32,.36,.35,'#ccd0ef');
    }
  } else {
    // Sparse desert ecology: branching cacti, dry scrub and wind-worn rocks.
    if(rand()<.065) {
      const height=1.4+rand()*1.6;
      block(x,h+height/2,z,.42,height,.45,'#779585');
      block(x+.5,h+height*.5,z,.7,.28,.3,'#87a18b');
      block(x+.76,h+height*.5+.4,z,.28,.8,.3,'#87a18b');
      block(x-.38,h+height*.7,z,.5,.25,.3,'#779585');
      block(x-.6,h+height*.7+.24,z,.25,.5,.3,'#779585');
    }else if(rand()<.12){
      block(x,h+.18,z,.65,.35,.45,'#c3a67f','detail');
    }
    if(h>8 && rand()<.07) {
      const height=2+rand()*3;
      block(x,h+height/2,z,2,height,2,pick(['#c39c87','#d3b09a']));
      block(x-.15,h+height+.3,z,2.5,.6,2.3,'#e0c2a6');
    }
  }
}
// A small spring and palms occupy the western edge of the sunlit archives.
for(const t of terrain) {
  if(t.island.id!=='studio'||Math.hypot(t.x+30,(t.z-85)*1.3)>5||onRoute(t.x,t.z))continue;
  block(t.x,t.h+.1,t.z,tile,.1,tile,'#7dbdb5');
}
for(const [x,z] of [[-35,82],[-32.5,90],[-27.5,80]]) {
  const h=terrainHeight(x,z);if(h<0)continue;
  block(x,h+2.5,z,.4,5,.4,'#a17d68');
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    block(x+dx*1.1,h+5,z+dz*1.1,dx?2.8:.65,.35,dz?2.8:.65,'#7e9e83');
    block(x+dx*2.1,h+4.65,z+dz*2.1,dx?1.1:.65,.4,dz?1.1:.65,'#8ba987');
  }
}

// Project the clouds onto a distant world-space sky shell. Reconstructing
// camera rays makes rotation and translation reveal the surrounding sky.
const cloudTexture=new THREE.TextureLoader().load('images/sky/clouds.jpg');
cloudTexture.colorSpace=THREE.SRGBColorSpace;
cloudTexture.wrapS=cloudTexture.wrapT=THREE.MirroredRepeatWrapping;
const cloudMaterial=new THREE.ShaderMaterial({
  uniforms:{uMap:{value:cloudTexture},uTime:{value:0},uNight:{value:0},uPerspective:{value:0},uAspect:{value:1},uInverseProjection:{value:new THREE.Matrix4()},uCameraWorld:{value:new THREE.Matrix4()}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform sampler2D uMap;uniform float uTime;uniform float uNight;
  uniform float uPerspective;uniform float uAspect;uniform mat4 uInverseProjection;uniform mat4 uCameraWorld;
  void main(){
    vec2 drift=vec2(sin(uTime*.018)*.015,cos(uTime*.012)*.008);
    vec3 color;
    if(uPerspective<.5){
      // Preserve the original full-image composition for the isometric map.
      vec2 uv=vUv;float imageAspect=1.5;
      if(uAspect>imageAspect)uv.y=(uv.y-.5)*imageAspect/uAspect+.5;
      else uv.x=(uv.x-.5)*uAspect/imageAspect+.5;
      uv=(uv-.5)*.94+.5+drift;
      color=texture2D(uMap,uv).rgb;
    }else{
    vec4 view=uInverseProjection*vec4(vUv*2.-1.,-1.,1.);view/=view.w;
    vec3 origin=(uCameraWorld*vec4(view.xyz,1.)).xyz;
    vec3 ray=normalize(mat3(uCameraWorld)*mix(vec3(0.,0.,-1.),normalize(view.xyz),uPerspective));
    float b=dot(origin,ray);
    float distance=-b+sqrt(max(0.,b*b-dot(origin,origin)+650.*650.));
    vec3 p=(origin+ray*distance)/650.;
    vec3 weights=pow(abs(p),vec3(8.));weights/=max(.0001,weights.x+weights.y+weights.z);
    // Blend three projections, avoiding a panorama seam or pinched poles.
    color=texture2D(uMap,p.yz*.65+.5+drift).rgb*weights.x
      +texture2D(uMap,p.xz*.65+.5+drift).rgb*weights.y
      +texture2D(uMap,p.xy*.65+.5+drift).rgb*weights.z;
    }
    color=mix(color,color*vec3(.22,.24,.42),uNight);
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
  }`,depthWrite:false,depthTest:false
});
const cloudBackdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),cloudMaterial);
cloudBackdrop.onBeforeRender=(_renderer,_scene,viewCamera)=>{
  cloudMaterial.uniforms.uInverseProjection.value.copy(viewCamera.projectionMatrixInverse);
  cloudMaterial.uniforms.uCameraWorld.value.copy(viewCamera.matrixWorld);
  cloudMaterial.uniforms.uPerspective.value=viewCamera.isPerspectiveCamera?1:0;
  cloudMaterial.uniformsNeedUpdate=true;
  cloudMaterial.uniforms.uAspect.value=viewCamera.isPerspectiveCamera?viewCamera.aspect:(viewCamera.right-viewCamera.left)/(viewCamera.top-viewCamera.bottom);
};
cloudBackdrop.frustumCulled=false;cloudBackdrop.renderOrder=-10000;scene.add(cloudBackdrop);

// Wide, worn stairs and asymmetrical columns build each sanctuary.
function pillar(x,y,z,height=5) {
  stone(x,y+.22,z,1.65,.44,1.65);
  stone(x,y+.64,z,1.3,.4,1.3);
  stone(x,y+.8+height/2,z,.92,height,.92);
  stone(x,y+height+1,z,1.22,.32,1.22);
  if(rand()>.35) stone(x-.15,y+height+1.45,z,.65,.6,.68);
}
const portalVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const portalFragment = `varying vec2 vUv;uniform float uTime;uniform float uPower;uniform vec3 uColor;
void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float edge=1.-smoothstep(.94,1.,r);
float rings=pow(max(0.,sin(r*25.-a*2.-uTime*1.1)),18.);float rim=exp(-abs(r-.91)*65.);float inner=exp(-r*5.);
float stars=pow(max(0.,sin(a*19.+r*93.)),80.)*step(.3,r);float energy=rings*.65+rim*1.6+inner*.5+stars*.18;
vec3 col=mix(vec3(.12,.07,.21),uColor,clamp(.12+energy,0.,1.));col+=uColor*rim*.8;float alpha=edge*(.82+energy*.18)*uPower;gl_FragColor=vec4(col,alpha);}`;
const portalObjects = [];
const hitTargets = [];
let found = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('nate-temples-found-v1') || '[]');
  if(Array.isArray(saved)) found = new Set(saved.filter(id=>places.some(p=>p.id===id)));
} catch { /* Exploration still works when storage is unavailable. */ }
function buildTemple(p, index) {
  const {x,z,h} = p;
  const floor=h+1.25;
  stone(x,h+.23,z,14,.48,14);
  // The trim ends exactly where the equal-width upper stone begins.
  block(x,h+.535,z,13.7,.13,13.7,'#b59185');
  stone(x,h+.85,z,13.7,.5,13.7);
  stone(x,floor,z,12.8,.32,12.8);
  // Individual paving flags lend scale and small variations to broad surfaces.
  for(let a=-5;a<=5;a+=1.3) for(let b=-5;b<=5;b+=1.3) {
    if(rand()>.09) block(x+a,floor+.19,z+b,1.27,.035,1.27,pick(stoneColors),'detail');
    else block(x+a,floor+.2,z+b,1.15,.04,1.15,pick(grassColors),'detail');
  }
  // Forecourt stairs descend toward the viewer.
  for(let i=0;i<7;i++) stone(x,h+.08+i*.17,z+9.15-i*.46,6.4,.24+i*.34,.54);
  // Raised inner temple, with a second flight.
  stone(x,floor+.43,z-1.6,8,.8,7.2);
  for(let i=0;i<5;i++) stone(x,floor+.1+i*.16,z+3.45-i*.38,5.7,.2+i*.32,.44);
  const base=floor+.9;
  for(const side of [-1,1]) {
    stone(x+side*2.22,base+.25,z-2.2,1.6,.5,1.8);
    for(let j=0;j<4;j++) stone(x+side*2.22,base+.65+j*.91,z-2.2,1.14,.9,1.25);
    stone(x+side*2.07,base+4.24,z-2.2,1.45,.75,1.3);
    stone(x+side*1.5,base+4.94,z-2.2,1.55,.65,1.35);
    pillar(x+side*5, floor+.17,z+3.55,side===1?3.15:4.35);
    pillar(x+side*5.1,floor+.17,z-4.2,side===1?5.8:3.8);
    // Broken balustrades with gaps.
    stone(x+side*6,floor+.65,z-.7,.65,.9,2.8);
    stone(x+side*5.9,floor+.48,z+4.8,.7,.55,1.3);
  }
  stone(x,base+5.18,z-2.2,2.9,.72,1.38);
  stone(x+.2,base+5.7,z-2.25,1.5,.35,1.2);
  // Inlaid square beneath the aperture, matching the stepped references.
  for(const side of [-1,1]) {
    block(x+side*2.6,base+.025,z-.3,.12,.035,3.5,'#a999b0','detail');
    block(x,base+.025,z-.3+side*1.7,5.3,.035,.12,'#a999b0','detail');
  }
  // Moss and fallen masonry, authored around the edge instead of across stairs.
  for(let j=0;j<14;j++) {
    const side=j%2?1:-1;
    const px=x+side*(3.7+rand()*2),pz=z-4+rand()*7;
    if(j%3===0) stone(px,floor+.3,pz,.35+rand()*.5,.3+rand()*.3,.4+rand()*.4);
    else block(px,floor+.19,pz,.35+rand()*.8,.055,.3+rand()*.7,'#969d78','detail');
  }
  // Distinct relics give each project a recognizable silhouette.
  if(p.id==='lumina') {
    const moon=new THREE.Mesh(new THREE.TorusGeometry(1.05,.12,6,36,Math.PI*1.55),new THREE.MeshStandardMaterial({color:'#e7d7b1',roughness:.8}));
    moon.position.set(x,base+7.2,z-2.2);moon.rotation.z=.7;scene.add(moon);
  }
  if(p.id==='aquarium') {
    for(const side of [-1,1]) {
      stone(x+side*4.1,floor+.48,z,.95,.8,2.7);
      block(x+side*4.1,floor+.9,z,.72,.06,2.4,'#97d0d1');
    }
  }
  if(p.id==='deadfrequency') {
    for(let j=0;j<3;j++) pillar(x-3.7+j*3.7,floor,z-5.9,6.2+(j===1?2:0));
  }
  if(p.id==='mold') {
    for(let j=0;j<8;j++) {const mx=x-5+rand()*10,mz=z-5+rand()*3;block(mx,floor+.48,mz,.15,.6,.15,'#d8d0ba');block(mx,floor+.87,mz,.7,.22,.7,'#c5c699');}
  }
  // Different plans and relics make the locations recognizable while panning.
  if(p.id==='about') {
    stone(x,floor-.5,z+11,11,.7,6);
    for(const side of [-1,1]) {
      pillar(x+side*4.9,floor-.15,z+12,2.1);
      stone(x+side*4.5,floor+.03,z+8.5,1,.4,2.8);
    }
    for(let j=0;j<5;j++) stone(x,h-.05+j*.12,z+15.5-j*.4,6,.2+j*.2,.5);
  }
  if(p.id==='mossbell') {
    for(const side of [-1,1]) {
      const tx=x+side*7.5,tz=z-5;
      block(tx,h+2,tz,.45,4,.45,'#735e68');
      block(tx,h+4.1,tz,3.2,1.8,2.8,'#aab892');
      block(tx-side*.9,h+5.3,tz-.3,2.4,1.1,2.3,'#c1c9a4');
      block(tx+side*.9,h+3.7,tz+.4,2.2,1.5,2.1,'#adb993');
      for(let j=0;j<7;j++) block(x+side*2.85,base+.6+j*.43,z-1.55,.08,.4,.25+rand()*.35,'#899b6d','detail');
    }
    stone(x-4,floor+1.05,z-4.9,3.2,1.6,.8);
  }
  if(p.id==='nerf') {
    for(const side of [-1,1]) for(let j=0;j<3;j++) {
      stone(x+side*(7+j*.6),floor+j*.4,z-1,.7,.8+j*.8,8);
      block(x+side*(7+j*.6),floor+.45+j*.8,z-1,.7,.09,8,'#c69485');
    }
  }
  if(p.id==='aquarium') {
    for(const side of [-1,1]) {
      stone(x+side*5.3,floor+.25,z-1,2.1,.25,5.8);
      block(x+side*5.3,floor+.42,z-1,1.65,.065,5.3,'#7bbbc7');
      block(x+side*5.3,floor+.46,z-1,1.35,.035,.15,'#c9e3df','detail');
    }
  }
  if(p.id==='mold') {
    for(const side of [-1,1]) {
      block(x+side*6.5,h+1.5,z-5,.65,3,.65,'#c9c0ac');
      block(x+side*6.5,h+3,z-5,3.4,.75,2.8,'#c3b3cb');
      block(x+side*6.5,h+3.5,z-5,2.2,.4,1.8,'#dfc4d2');
    }
  }
  const material = new THREE.ShaderMaterial({ uniforms: {uTime:{value:0},uPower:{value:0},uColor:{value:new THREE.Color(p.color)}},vertexShader:portalVertex,fragmentShader:portalFragment,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending });
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(3.3,4.6),material);
  portal.position.set(x,base+2.52,z-1.52);
  portal.userData.place=p;
  scene.add(portal);hitTargets.push(portal);
  const light=new THREE.PointLight(p.color,0,13,2);
  light.position.set(x,base+2,z+.1);scene.add(light);
  const haloMaterial=new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  const halo=new THREE.Mesh(new THREE.RingGeometry(.85,1.02,48),haloMaterial);
  halo.rotation.x=-Math.PI/2;halo.scale.set(2.4,2.4,2.4);halo.position.set(x,base+.05,z-.4);scene.add(halo);
  const button=document.createElement('button');button.className='landmark';button.setAttribute('aria-label',`Explore ${p.name}`);button.style.setProperty('--portal-color',p.color);
  const beacon=document.createElement('span');beacon.className='beacon';beacon.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.className='landmark-label';label.textContent=p.name;
  button.append(beacon,label);$('landmarks').append(button);
  const state={place:p,portal,material,light,halo,button,power:found.has(p.id)?.65:0,anchor:new THREE.Vector3(x,base+6.1,z-2.2)};
  portalObjects.push(state);
  if(found.has(p.id))button.classList.add('found');
  button.addEventListener('pointerenter',()=>{hovered=state;discover(state);});
  button.addEventListener('pointerleave',()=>{hovered=null;});
  button.addEventListener('focus',()=>{hovered=state;discover(state);});
  button.addEventListener('click',()=>{discover(state);openProject(state);});
  const listButton=document.createElement('button');listButton.className='place-link';listButton.style.setProperty('--place-color',p.color);listButton.innerHTML=`<span aria-hidden="true">${p.symbol}</span><span>${p.name}</span><span class="place-state">${found.has(p.id)?'Found':'Visit'}</span>`;
  listButton.addEventListener('click',()=>{closePlaces();travel(state);});
  document.getElementById(`places-${p.island}`).append(listButton);state.listButton=listButton;
}
for(const island of islands){
  const group=document.createElement('section');
  const title=document.createElement('h3');title.textContent=island.name;
  const subtitle=document.createElement('p');subtitle.textContent=island.biome;
  const list=document.createElement('div');list.id=`places-${island.id}`;
  group.append(title,subtitle,list);$('places-list').append(group);
  const button=document.createElement('button');button.textContent=island.name;button.dataset.island=island.id;
  button.addEventListener('click',()=>{explore();closePlaces();desiredTarget.set(island.x,4,island.z);desiredSize=MAX_VIEW_SIZE;});
  $('island-nav').append(button);

}
places.forEach(buildTemple);

// Unique deck cells prevent overlaps at elbows. Rails follow the outside of
// the full route, leaving both corner turns and shore connections open.
const bridgePosts=new Map();
for(const {gx,gz,x,z} of bridgeCells.values()){
  block(x,2.8,z,tile,.63,tile,pick(stoneColors));
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(routeCells.has(cellKey(gx+dx,gz+dz)))continue;
    const ex=x+dx*tile/2,ez=z+dz*tile/2;
    block(ex,3.48,ez,dx?.32:tile-.44,.72,dz?.32:tile-.44,'#cbbccf');
    for(const side of [-1,1]){
      const px=ex+(dz?side*tile/2:0),pz=ez+(dx?side*tile/2:0);
      bridgePosts.set(cellKey(px,pz),{x:px,z:pz});
    }
  }
  if(gx%3===0&&gz%3===0){
    stone(x,.5,z,1.7,4,1.7);
    stone(x,2.15,z,2.15,.7,2.15);
  }
}
for(const {x,z} of bridgePosts.values()){
  block(x,3.53,z,.44,.9,.44,'#cbbccf');
  block(x,4.04,z,.61,.12,.61,'#dfd0d9');
}

// Local landmarks reinforce the identity of the three islands.
for(const island of islands){
  for(let j=0;j<28;j++){
    const x=island.x+(rand()-.5)*70,z=island.z+(rand()-.5)*65;
    if(onRoute(x,z)||places.some(p=>Math.hypot(x-p.x,z-p.z)<13))continue;
    const h=terrainHeight(x,z);if(h<0||gardenWater(x,z,h)||(island.id==='studio'&&Math.hypot(x+30,(z-85)*1.3)<7))continue;
    if(island.id==='studio'){
      const height=3+rand()*8;
      stone(x,h+height/2,z,1.6,height,1.6);
      stone(x,h+height+.3,z,1,.6,1);
      stone(x+1.5,h+.4,z+.8,2,.8,1.4);
    }else if(island.id==='games'){
      block(x,h+1.7,z,.8,3.4,.9,'#9795bd');
      block(x+.65,h+.8,z+.4,.6,1.6,.65,'#b9a7cf');
    }else{
      stone(x,h+.3,z,2,.6,1.3);
      block(x,h+.67,z,1.7,.12,1.1,'#90ad7a');
    }
  }
}

const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3();
for(const [name,items] of batches) {
  const material=new THREE.MeshLambertMaterial({color:'#ffffff'});
  const mesh=new THREE.InstancedMesh(boxGeometry,material,items.length);
  items.forEach((b,i)=>{position.set(b.x,b.y,b.z);scale.set(b.w,b.h,b.d);quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),b.rotation);matrix.compose(position,quaternion,scale);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color(b.color));});
  mesh.castShadow=name!=='detail';mesh.receiveShadow=true;scene.add(mesh);
}
renderer.shadowMap.needsUpdate=true;

// Drifting petals tie the otherwise still landscape to time.
const petalPositions=new Float32Array(120*3);
for(let i=0;i<120;i++){petalPositions[i*3]=(rand()-.5)*210;petalPositions[i*3+1]=3+rand()*11;petalPositions[i*3+2]=(rand()-.5)*210;}
const petalGeometry=new THREE.BufferGeometry();petalGeometry.setAttribute('position',new THREE.BufferAttribute(petalPositions,3));
const petals=new THREE.Points(petalGeometry,new THREE.PointsMaterial({color:'#f7d9de',size:.09,transparent:true,opacity:.7,sizeAttenuation:true}));scene.add(petals);

function updateCamera() {
  if(vr?.active)return;
  if(firstPerson){eyeCamera.aspect=innerWidth/innerHeight;eyeCamera.updateProjectionMatrix();eyeCamera.updateMatrixWorld();return;}
  const aspect=innerWidth/innerHeight;
  camera.left=-viewSize*aspect/2;camera.right=viewSize*aspect/2;camera.top=viewSize/2;camera.bottom=-viewSize/2;
  camera.position.copy(target).add(offset);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
updateCamera();
function explore() { if(!interacted){interacted=true;document.body.classList.add('exploring');} }
function discover(state) {
  if(found.has(state.place.id)) return;
  found.add(state.place.id);state.button.classList.add('found');state.listButton.querySelector('.place-state').textContent='Found';
  $('progress').textContent=`${found.size} of ${places.length} places found`;
  try {localStorage.setItem('nate-temples-found-v1',JSON.stringify([...found]));}catch{}
  $('discovery').textContent=`${state.place.name} is waking up.`;$('discovery').classList.add('visible');
  clearTimeout(notificationTimer);notificationTimer=setTimeout(()=>$('discovery').classList.remove('visible'),3200);
  chime(state.place.id);
}
$('progress').textContent=`${found.size} of ${places.length} places found`;
function travel(state) {
  explore();desiredTarget.set(state.place.x,state.place.h+2,state.place.z+2.7);desiredSize=innerWidth<700?34:29;
  discover(state);hovered=state;
  // Selecting a place should reach its preview without a second hunt.
  openProject(state);
}
function openProject(state) {
  if(vr?.active){discover(state);vr.showPortal(state.place);return;}
  flightKeys.clear();
  if(document.pointerLockElement===canvas)document.exitPointerLock();
  explore();discover(state);
  const p=state.place;
  $('project-title').textContent=p.name;$('project-kind').textContent=p.kind;$('project-description').textContent=p.description;$('project-note').textContent=p.note;$('project-note').hidden=!p.note;
  $('project-link').href=p.url;$('project-link').textContent=`${p.link} ↗`;$('project-symbol').textContent=p.symbol;
  $('project-art').style.background=p.color;
  pendingPreview=state;
  if(!$('project').open)$('project').showModal();
  updatePointerPrompt();
}
function closeProject() { $('project').close();hovered=null;$('scene').focus({preventScroll:true}); }
$('close-project').addEventListener('click',closeProject);$('keep-exploring').addEventListener('click',closeProject);
$('project').addEventListener('close',()=>{hovered=null;updatePointerPrompt();});
$('project').addEventListener('click',e=>{if(e.target===$('project')){const r=$('project').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProject();}});
function closePlaces(){$('places').hidden=true;$('index-button').setAttribute('aria-expanded','false');}
$('index-button').addEventListener('click',()=>{const open=$('places').hidden;$('places').hidden=!open;$('index-button').setAttribute('aria-expanded',String(open));});
$('close-places').addEventListener('click',()=>{closePlaces();$('index-button').focus();});
$('about-button').addEventListener('click',()=>travel(portalObjects[0]));
function home() {desiredTarget.set(aboutPlace.x,aboutPlace.h+2,aboutPlace.z+3);desiredSize=MAX_VIEW_SIZE;hovered=null;}
$('home').addEventListener('click',e=>{e.preventDefault();home();});$('reset-view').addEventListener('click',home);
const clamp=THREE.MathUtils.clamp;
function zoom(amount) {if(firstPerson)return;desiredSize=clamp(desiredSize*amount,MIN_VIEW_SIZE,MAX_VIEW_SIZE);explore();}
$('zoom-in').addEventListener('click',()=>zoom(.8));$('zoom-out').addEventListener('click',()=>zoom(1.25));
$('time').addEventListener('click',()=>{night=!night;document.body.classList.toggle('night',night);$('time').textContent=night?'Dawn':'Dusk';$('time').setAttribute('aria-pressed',String(night));$('time').setAttribute('aria-label',night?'Switch to daylight':'Switch to night');});
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
function pickPortal(clientX,clientY) {
  pointer.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(hitTargets)[0];
  return hit?portalObjects.find(s=>s.portal===hit.object):null;
}
const right=new THREE.Vector3(),up=new THREE.Vector3();
function pan(dx,dy) {
  right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
  const units=viewSize/innerHeight;
  const elevation=desiredTarget.y;
  desiredTarget.addScaledVector(right,-dx*units);desiredTarget.addScaledVector(up,dy*units/Math.max(.1,up.x*up.x+up.z*up.z));
  desiredTarget.y=elevation;desiredTarget.x=clamp(desiredTarget.x,-120,115);desiredTarget.z=clamp(desiredTarget.z,-90,135);
}
$('new-walk').addEventListener('click',()=>{
  found.clear();
  try {localStorage.removeItem('nate-temples-found-v1');}catch{}
  for(const state of portalObjects){state.button.classList.remove('found');state.listButton.querySelector('.place-state').textContent='Visit';}
  $('progress').textContent=`0 of ${places.length} places found`;
  clearTimeout(notificationTimer);$('discovery').classList.remove('visible');
  closePlaces();home();interacted=false;document.body.classList.remove('exploring');
});
const canvas=$('scene');
canvas.addEventListener('pointerdown',e=>{
  if(firstPerson&&document.pointerLockElement===canvas){if(e.button===0)game?.attack();return;}
  if(firstPerson&&pointerPaused()){lockPointer();return;}
  if(e.button!==0 && e.pointerType==='mouse')return;
  closePlaces();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  pointerDown=true;didDrag=false;lastPointer={x:e.clientX,y:e.clientY};canvas.classList.add('dragging');
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);didDrag=true;}
});
canvas.addEventListener('pointermove',e=>{
  if(document.pointerLockElement===canvas)return;
  if(firstPerson && pointerDown && lastPointer){
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    if(Math.abs(dx)+Math.abs(dy)>2)didDrag=true;
    if(didDrag){eyeCamera.rotation.y-=dx*.004;eyeCamera.rotation.x=clamp(eyeCamera.rotation.x-dy*.004,-1.4,1.4);}
    lastPointer={x:e.clientX,y:e.clientY};return;
  }
  if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0)desiredSize=clamp(desiredSize*pinchDistance/Math.max(d,1),MIN_VIEW_SIZE,MAX_VIEW_SIZE);pinchDistance=d;didDrag=true;explore();return;}
  if(pointerDown&&lastPointer){const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;if(Math.abs(dx)+Math.abs(dy)>2)didDrag=true;if(didDrag){pan(dx,dy);explore();}lastPointer={x:e.clientX,y:e.clientY};}
  else if(e.pointerType!=='touch'){hovered=pickPortal(e.clientX,e.clientY);canvas.style.cursor=hovered?'pointer':'grab';if(hovered)discover(hovered);}
});
function release(e,cancelled=false){
  if(firstPerson&&document.pointerLockElement===canvas)return;
  pointers.delete(e.pointerId);
  if(!cancelled&&!didDrag&&pointerDown){const state=pickPortal(e.clientX,e.clientY);if(state&&(!firstPerson||state.portal.position.distanceTo(eyeCamera.position)<8))openProject(state);else if(firstPerson)game?.attack();}
  if(pointers.size===0){pointerDown=false;lastPointer=null;canvas.classList.remove('dragging');pinchDistance=0;}
  else {lastPointer=[...pointers.values()][0];didDrag=true;}
}
canvas.addEventListener('pointerup',e=>release(e));canvas.addEventListener('pointercancel',e=>release(e,true));
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-160,160)*.0015));},{passive:false});
canvas.addEventListener('keydown',e=>{
  if(firstPerson)return;
  const shifts={ArrowLeft:[75,0],ArrowRight:[-75,0],ArrowUp:[0,75],ArrowDown:[0,-75],a:[75,0],d:[-75,0],w:[0,75],s:[0,-75]};
  if(shifts[e.key]){e.preventDefault();pan(...shifts[e.key]);explore();}
  if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.85);}if(e.key==='-'){e.preventDefault();zoom(1.15);}
});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closePlaces();});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);updateCamera();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fallback').hidden=false;});

// The optional game is imported and constructed only after the entry button.
let game=null,gameLoading=false;
let dragFallback=false;
const mouseLook=matchMedia('(pointer: fine)');
function pointerPaused(){return !vr?.active&&!vrStarting&&firstPerson&&mouseLook.matches&&!dragFallback&&document.pointerLockElement!==canvas;}
function updatePointerPrompt(){
  $('pointer-prompt').hidden=!pointerPaused()||$('project').open;
}
async function lockPointer(){
  if(vr?.active||vrStarting||!firstPerson||!mouseLook.matches||dragFallback)return;
  try{await canvas.requestPointerLock();}
  catch{$('pointer-note').textContent='Mouse capture is unavailable here. You can still use drag controls.';$('pointer-fallback').hidden=false;}
}
$('pointer-start').addEventListener('click',lockPointer);
$('pointer-fallback').addEventListener('click',()=>{dragFallback=true;updatePointerPrompt();canvas.focus();});
document.addEventListener('pointerlockchange',()=>{flightKeys.clear();pointerDown=false;lastPointer=null;updatePointerPrompt();if(document.pointerLockElement===canvas)canvas.focus();});
document.addEventListener('pointerlockerror',()=>{$('pointer-note').textContent='Mouse capture is unavailable here. You can still use drag controls.';$('pointer-fallback').hidden=false;});
document.addEventListener('mousemove',e=>{
  if(!firstPerson||document.pointerLockElement!==canvas||$('project').open)return;
  eyeCamera.rotation.y-=e.movementX*.0025;
  eyeCamera.rotation.x=clamp(eyeCamera.rotation.x-e.movementY*.0025,-1.4,1.4);
});
async function setFirstPerson(enabled){
  if(gameLoading||vrStarting)return;
  if(!enabled&&vr?.active)await vr.end();
  if(enabled&&!game){
    gameLoading=true;$('first-person').disabled=true;$('game-loading').hidden=false;
    try{
      const {createGame}=await import('./first-person-game.js');
      game=await createGame({scene,camera:eyeCamera,blocks:batches.get('land')||[],places,islandAt,onSwordHit:strikePortal,onSound:combatSound,onProgress:text=>$('game-loading-status').textContent=text});
    }catch(error){
      console.error('Game could not load',error);$('first-person').textContent='Retry first person';return;
    }finally{gameLoading=false;$('first-person').disabled=false;$('game-loading').hidden=true;}
  }
  firstPerson=enabled;flightKeys.clear();pointers.clear();pointerDown=false;lastPointer=null;
  document.body.classList.toggle('first-person',enabled);
  $('first-person').textContent=enabled?'Back to map':'First person';
  $('first-person').setAttribute('aria-pressed',String(enabled));
  $('flight-controls').hidden=!enabled;
  $('vr-button').hidden=!enabled;
  if(enabled)checkVR();
  if(enabled){
    closePlaces();explore();
    const p=places.reduce((a,b)=>Math.hypot(b.x-target.x,b.z-target.z)<Math.hypot(a.x-target.x,a.z-target.z)?b:a);
    camera=eyeCamera;game.enter(p);
  }else{if(document.pointerLockElement===canvas)document.exitPointerLock();game?.exit();camera=mapCamera;}
  updatePointerPrompt();
  canvas.setAttribute('aria-label',enabled?'First person game: mouse to look, WASD to move, Space to jump or double jump, click to swing, E to open a nearby portal. Escape releases the mouse and pauses.':'Drag to explore the 3D map. Use arrow keys to pan, plus and minus to zoom.');
  canvas.focus();updateCamera();
}
$('first-person').addEventListener('click',()=>setFirstPerson(!firstPerson));
for(const id of ['island-nav','home','reset-view','index-button','about-button'])
  $(id).addEventListener('click',()=>{if(firstPerson)setFirstPerson(false);},true);
function interactPortal(){
  if(!firstPerson||$('project').open)return;
  const nearby=portalObjects.filter(s=>s.portal.position.distanceTo(eyeCamera.position)<8).sort((a,b)=>a.portal.position.distanceTo(eyeCamera.position)-b.portal.position.distanceTo(eyeCamera.position));
  if(nearby[0])openProject(nearby[0]);
}
function strikePortal(attackRay=null){
  if(attackRay)return portalFromVRRay(attackRay,3.8);
  if(!firstPerson||$('project').open)return false;
  // Aim at the portal surface, with the same short reach as a sword swing.
  eyeCamera.updateMatrixWorld();
  const state=pickPortal(innerWidth/2,innerHeight/2);
  if(!state)return false;
  const hit=raycaster.intersectObject(state.portal)[0];
  if(!hit||hit.distance>3.8)return false;
  openProject(state);
  return true;
}
window.addEventListener('keydown',e=>{
  if(!firstPerson||$('project').open)return;
  if(e.key==='Escape'){flightKeys.clear();return;}
  if(e.target!==canvas)return;
  const key=e.key.toLowerCase();
  if(key===' '){e.preventDefault();if(!e.repeat)game.jump();return;}
  if(key==='e'){e.preventDefault();if(!e.repeat)interactPortal();return;}
  if(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();flightKeys.add(key);}
});
window.addEventListener('keyup',e=>flightKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>flightKeys.clear());
document.addEventListener('visibilitychange',()=>flightKeys.clear());
for(const button of document.querySelectorAll('[data-fly]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);flightKeys.add(button.dataset.fly);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>flightKeys.delete(button.dataset.fly));
}
$('game-jump').addEventListener('click',()=>{game?.jump();canvas.focus();});
$('game-attack').addEventListener('click',()=>{game?.attack();canvas.focus();});
$('game-interact').addEventListener('click',interactPortal);
function updateFlight(dt){
  if(vr?.active){vr.update(dt);return;}
  if(firstPerson)game?.update(dt,flightKeys,$('project').open||!$('places').hidden||pointerPaused());
}

// Immersive support is checked only after the optional first-person game opens.
async function checkVR(){
  const button=$('vr-button');button.disabled=true;
  if(!window.isSecureContext){button.textContent='VR needs HTTPS';button.title='Use HTTPS or localhost for immersive VR.';return;}
  if(!navigator.xr){button.textContent='VR unavailable';button.title='Open this site in a WebXR-capable browser on your Rift-connected PC.';return;}
  try{const supported=await navigator.xr.isSessionSupported('immersive-vr');button.disabled=!supported;button.textContent=supported?'Enter VR':'No VR headset';button.title=supported?'Oculus Rift / Touch via WebXR':'Connect your headset and enable your PC VR runtime, then reopen first person.';}
  catch{button.textContent='VR unavailable';}
}
function portalFromVRRay(ray,reach){
  raycaster.set(ray.origin,ray.direction);
  const hit=raycaster.intersectObjects(hitTargets)[0];
  if(!hit||hit.distance>reach)return false;
  const state=portalObjects.find(s=>s.portal===hit.object);if(!state)return false;
  openProject(state);return true;
}
$('vr-button').addEventListener('click',async()=>{
  if(vr?.active){await vr.end();return;}
  if(vrStarting||!game||!navigator.xr)return;
  vrStarting=true;$('vr-button').disabled=true;$('vr-button').textContent='Starting VR…';
  let session;
  try{
    // Request during the user gesture; import the VR implementation afterward.
    session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
    if(document.pointerLockElement===canvas)document.exitPointerLock();
    $('project').close();pendingPreview=false;flightKeys.clear();
    const {createVR}=await import('./vr-mode.js');
    vr=await createVR({renderer,scene,camera:eyeCamera,game,session,onPortalRay:portalFromVRRay,
      onExit:()=>{vr=null;document.body.classList.remove('in-vr');$('vr-button').textContent='Enter VR';$('vr-button').disabled=false;updatePointerPrompt();},
      onDesktopPortal:p=>openProject(portalObjects.find(s=>s.place.id===p.id))});
    document.body.classList.add('in-vr');$('vr-button').textContent='Exit VR';
  }catch(error){
    if(session)await session.end().catch(()=>{});
    $('vr-button').textContent='Retry VR';$('vr-button').title=error.message;
    $('discovery').textContent='VR could not start. Check your headset connection and browser VR support.';$('discovery').classList.add('visible');
  }finally{vrStarting=false;$('vr-button').disabled=false;updatePointerPrompt();}
});

// Audio is entirely local and starts only when explicitly switched on.
let audioContext=null,audioGain=null,audioEnabled=false;
const soundtrack=document.createElement('audio');
soundtrack.src='audio/portal-drift.m4a';
soundtrack.loop=true;
soundtrack.preload='none';
soundtrack.volume=.3;
soundtrack.hidden=true;
soundtrack.setAttribute('aria-label','Portal Drift background music');
document.body.append(soundtrack);
function updateSoundButton(){
  $('sound').textContent=audioEnabled?'Sound on':'Sound off';
  $('sound').setAttribute('aria-pressed',String(audioEnabled));
  $('sound').setAttribute('aria-label',audioEnabled?'Turn sound off':'Turn sound on');
}
function chime(id){
  if(!audioEnabled||!audioContext)return;
  const notes=[220,261.63,293.66,329.63,392,440,523.25,587.33];const index=places.findIndex(p=>p.id===id);
  [1,1.5,2].forEach((mult,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),start=audioContext.currentTime+i*.12;osc.type='sine';osc.frequency.value=notes[index%notes.length]*mult;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.035,start+.04);gain.gain.exponentialRampToValueAtTime(.0001,start+2);osc.connect(gain).connect(audioGain);osc.start(start);osc.stop(start+2);});
}
// Brief, quiet arcade cues share the music toggle and master effects gain.
function combatSound(event){
  if(!audioEnabled||!audioContext||audioContext.state!=='running'||document.hidden)return;
  const cues={
    'enemy-hit':[[240,75,.11,0,.24,'triangle'],[680,210,.065,0,.07,'sine']],
    'enemy-death':[[300,90,.22,0,.2,'triangle'],[440,660,.16,.06,.1,'sine']],
    'player-hit':[[130,45,.17,0,.25,'triangle']],
    'player-death':[[220,55,.5,0,.2,'triangle'],[165,41,.5,.06,.1,'sine']]
  };
  for(const [from,to,duration,delay,volume,type] of cues[event]||[]){
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    const start=audioContext.currentTime+delay,end=start+duration;
    osc.type=type;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,end);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.004);gain.gain.exponentialRampToValueAtTime(.0001,end);
    osc.connect(gain).connect(audioGain);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.start(start);osc.stop(end+.01);
  }
}
$('sound').addEventListener('click',async()=>{
  $('sound').disabled=true;
  try {
    if(audioEnabled){
      soundtrack.pause();audioEnabled=false;
      if(audioGain)audioGain.gain.setTargetAtTime(0,audioContext.currentTime,.1);
    }else{
      if(!audioContext){
        audioContext=new (window.AudioContext||window.webkitAudioContext)();
        audioGain=audioContext.createGain();audioGain.gain.value=0;
        audioGain.connect(audioContext.destination);
      }
      await Promise.all([audioContext.resume(),soundtrack.play()]);
      audioEnabled=true;
      audioGain.gain.setTargetAtTime(.25,audioContext.currentTime,.3);
    }
    updateSoundButton();
  }catch{
    soundtrack.pause();audioEnabled=false;
    updateSoundButton();$('sound').textContent='Retry sound';
  }finally{$('sound').disabled=false;}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){soundtrack.pause();if(audioContext)audioContext.suspend();}
  else if(audioEnabled){
    if(audioContext)audioContext.resume();
    soundtrack.play().catch(()=>{audioEnabled=false;updateSoundButton();});
  }
});

// Capture a real view of the selected temple for its preview.
const previewCamera=new THREE.OrthographicCamera(-11.6,11.6,5.8,-5.8,.1,240);
const previewTarget=new THREE.WebGLRenderTarget(720,360);
previewTarget.texture.colorSpace=THREE.SRGBColorSpace;
function renderPreview(state) {
  const p=state.place,focus=new THREE.Vector3(p.x,p.h+4.3,p.z);
  previewCamera.position.copy(focus).add(new THREE.Vector3(15,13,20));previewCamera.lookAt(focus);previewCamera.updateMatrixWorld();
  const previousPower=state.material.uniforms.uPower.value;state.material.uniforms.uPower.value=1;
  renderer.setRenderTarget(previewTarget);renderer.render(scene,previewCamera);
  const pixels=new Uint8Array(720*360*4);renderer.readRenderTargetPixels(previewTarget,0,0,720,360,pixels);renderer.setRenderTarget(null);state.material.uniforms.uPower.value=previousPower;
  const preview=$('preview-scene');preview.width=720;preview.height=360;
  const context=preview.getContext('2d');const output=context.createImageData(720,360);
  for(let y=0;y<360;y++)output.data.set(pixels.subarray((359-y)*720*4,(360-y)*720*4),y*720*4);
  context.putImageData(output,0,0);
}
const projected=new THREE.Vector3();
const dayBackground=new THREE.Color('#cbbdd0'),nightBackground=new THREE.Color('#37354e');
const daySun=new THREE.Color('#ffe2d1'),nightSun=new THREE.Color('#b4b6fa');
const daySky=new THREE.Color('#efe5ff'),nightSky=new THREE.Color('#9dacf5');
let last=performance.now();
let frameCount=0;
function animate(now) {
  if(document.hidden&&!renderer.xr.isPresenting){last=now;return;}
  const dt=Math.min((now-last)/1000,.06);last=now;
  if(!reducedMotion.matches)time+=dt;
  const blend=reducedMotion.matches?1:1-Math.exp(-dt*7);
  target.lerp(desiredTarget,blend);viewSize=THREE.MathUtils.lerp(viewSize,desiredSize,blend);
  nightMix=THREE.MathUtils.lerp(nightMix,night?1:0,reducedMotion.matches?1:1-Math.exp(-dt*1.8));
  scene.background.copy(dayBackground).lerp(nightBackground,nightMix);scene.fog.color.copy(scene.background);
  sun.color.copy(daySun).lerp(nightSun,nightMix);sky.color.copy(daySky).lerp(nightSky,nightMix);
  sun.intensity=3.1-nightMix*2.65;sky.intensity=1.6-nightMix*.95;cloudMaterial.uniforms.uNight.value=nightMix;
  cloudMaterial.uniforms.uTime.value=time;
  updateFlight(dt);
  updateCamera();
  $('zoom-out').disabled=desiredSize>=MAX_VIEW_SIZE-.01;
  $('zoom-in').disabled=desiredSize<=MIN_VIEW_SIZE+.01;
  const explorer=vr?.active?vr.getPosition():firstPerson?eyeCamera.position:target;
  const currentIsland=islandAt(explorer.x,explorer.z);
  $('region-name').textContent=currentIsland?currentIsland.biome:'The old crossings';
  for(const button of $('island-nav').children)button.setAttribute('aria-pressed',String(button.dataset.island===currentIsland?.id));
  for(const state of portalObjects){
    const distance=Math.hypot(explorer.x-state.place.x,explorer.z-state.place.z);
    if(interacted&&distance<6.5&&!$('project').open&&!vr?.paused)discover(state);
    const isNear=distance<9;
    const power=hovered===state||isNear&&found.has(state.place.id)?1:found.has(state.place.id)?.55:0;
    state.power=THREE.MathUtils.lerp(state.power,power,reducedMotion.matches?1:1-Math.exp(-dt*3));
    state.material.uniforms.uPower.value=state.power;state.material.uniforms.uTime.value=time;
    state.light.intensity=state.power*(night?15:10);state.halo.material.opacity=state.power*.42;
    projected.copy(state.anchor).project(camera);
    const screenX=(projected.x*.5+.5)*innerWidth,screenY=(-projected.y*.5+.5)*innerHeight;
    state.button.style.left=`${screenX}px`;state.button.style.top=`${screenY}px`;
    const visible=!vr?.active&&(!firstPerson||state.portal.position.distanceTo(eyeCamera.position)<8)&&projected.z>=-1&&projected.z<=1&&screenX>20&&screenX<innerWidth-20&&screenY>85&&screenY<innerHeight-75;
    state.button.hidden=!visible;state.button.classList.toggle('near',isNear&&found.has(state.place.id));
  }
  if(!reducedMotion.matches){petals.position.x=Math.sin(time*.06)*1.5;petals.position.y=-time*.07%8;petals.position.z=Math.cos(time*.05)*.8;}
  if(pendingPreview&&!vr?.active){renderPreview(pendingPreview);pendingPreview=false;}
  renderer.render(scene,camera);
  if(frameCount++===2){$('loading').classList.add('leaving');setTimeout(()=>$('loading').hidden=true,750);}
}
renderer.setAnimationLoop(animate);
