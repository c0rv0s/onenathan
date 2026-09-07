import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createGame} from '../first-person-game.js';
const element=()=>({hidden:false,style:{},classList:{add(){},remove(){},toggle(){}},querySelector(){return element();}});
globalThis.document={createElement:element,body:{append(){}}};
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);
const places=[{id:'about',island:'studio',x:0,z:0,h:0},{id:'app',island:'ios',x:100,z:0,h:0},{id:'game',island:'games',x:200,z:0,h:0}];
const camera=new THREE.PerspectiveCamera(65,1,.1,800);camera.rotation.order='YXZ';
let portalContact=false,portalChecks=0;
const game=await createGame({scene:new THREE.Scene(),camera,blocks:[{x:100,y:-.5,z:0,w:400,h:1,d:100}],places,islandAt:x=>({id:x<50?'studio':x<150?'ios':'games'}),onProgress(){},onSwordHit(){portalChecks++;return portalContact;}});
game.enter(places[0]);
assert.deepEqual([...new Set(game.snapshot().enemies.map(e=>e.type))].sort(),['skeleton','snake','spider']);
assert(game.snapshot().enemies.length===6);
camera.rotation.y=-Math.PI/2;
const move=new Set(['w']);for(let i=0;i<80;i++)game.update(1/60,move,false);
assert(game.snapshot().enemies.some(e=>e.active),'proximity wakes guards');
for(let i=0;i<180;i++)game.update(1/60,new Set(),false);
assert(game.snapshot().health<100,'guards deal damage');
const before=game.snapshot();for(let i=0;i<300;i++)game.update(1/60,new Set(),true);
const after=game.snapshot();assert.equal(after.health,before.health);assert.deepEqual(after.enemies,before.enemies,'portal pause freezes all enemy simulation');
game.update(1/60,new Set(),false);
for(let i=0;i<6;i++){game.attack();for(let j=0;j<30;j++)game.update(1/60,new Set(),false);}
assert(game.snapshot().enemies.some(e=>e.hp===0),'sword defeats a nearby guard');
for(let i=0;i<45;i++)game.update(1/60,new Set(),false);
assert(game.snapshot().enemies.some(e=>e.hp===0&&e.visible&&Math.abs(e.roll)>1.5),'defeated enemy stays visible and falls over');
game.exit();assert.equal(game.snapshot().enabled,false);
game.enter(places[1]);camera.rotation.y=0;
const start=game.snapshot().position.z;
for(let i=0;i<30;i++)game.update(1/60,new Set(['w']),false);
const walkDistance=start-game.snapshot().position.z;
game.exit();game.enter(places[1]);camera.rotation.y=0;
for(let i=0;i<30;i++)game.update(1/60,new Set(['w','shift']),false);
assert(start-game.snapshot().position.z>walkDistance*1.5,'shift increases movement speed');
game.exit();game.enter(places[2]);camera.rotation.y=-Math.PI/2;
for(let i=0;i<80;i++)game.update(1/60,new Set(['w']),false);
let prior=game.snapshot(),knocked=false;
for(let i=0;i<240;i++){
  game.update(1/60,new Set(),false);const now=game.snapshot();
  if(now.health<prior.health){const x=now.position.x,z=now.position.z;for(let j=0;j<8;j++)game.update(1/60,new Set(),false);const later=game.snapshot();knocked=Math.hypot(later.position.x-x,later.position.z-z)>.1;break;}
  prior=now;
}
assert(knocked,'enemy hit pushes the player without movement input');

console.log('Biome enemies, aggro, damage, portal pause, sword combat, and exit passed.');

game.exit();game.enter({...places[1],z:-30});
const frozen=game.snapshot().enemies.filter(e=>e.island!=='ios');
let walking=false,idleAfterWalk=false;
for(let i=0;i<900;i++){
  game.update(1/60,new Set(),false);
  const local=game.snapshot().enemies.filter(e=>e.island==='ios');
  if(local.some(e=>!e.active&&e.wanderState==='walking'))walking=true;
  if(walking&&local.some(e=>!e.active&&e.wanderState==='idle'))idleAfterWalk=true;
}
assert(walking,'idle creatures select a destination and walk');
assert(idleAfterWalk,'wandering creatures pause between destinations');
assert.deepEqual(game.snapshot().enemies.filter(e=>e.island!=='ios'),frozen,'other islands freeze all monster state');
console.log('Visible death pose, wandering with rests, and inactive-island freeze passed.');

game.exit();game.enter(places[0]);portalContact=true;
const checksBefore=portalChecks;
game.attack();game.update(.1,new Set(),false);
assert.equal(portalChecks,checksBefore,'portal is not triggered before swing contact');
const enemiesBeforeContact=game.snapshot().enemies;
game.update(.08,new Set(),false);
assert.equal(portalChecks,checksBefore+1);
assert.equal(game.snapshot().paused,true,'portal contact pauses immediately');
assert.deepEqual(game.snapshot().enemies,enemiesBeforeContact,'no enemy update after portal opens in the hit frame');
console.log('Sword portal contact timing and immediate combat pause passed.');
