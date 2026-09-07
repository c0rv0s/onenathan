import * as THREE from './vendor/three.module.js';
import {CollisionWorld,Walker} from './game-physics.js';

export async function createGame({scene,camera,blocks,places,islandAt,onProgress,onSwordHit=()=>false}){
  onProgress('Preparing the paths…');
  await new Promise(requestAnimationFrame);
  const collision=new CollisionWorld(blocks),player=new Walker(collision);
  const root=new THREE.Group();root.visible=false;scene.add(root);
  const geometry=new THREE.BoxGeometry(1,1,1),materials=new Map();
  function cube(parent,x,y,z,w,h,d,color){
    if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));
    const mesh=new THREE.Mesh(geometry,materials.get(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  }
  function limb(parent,x,y,z,w,h,d,color){const pivot=new THREE.Group();pivot.position.set(x,y,z);parent.add(pivot);cube(pivot,0,-h/2,0,w,h,d,color);return pivot;}
  const enemies=[],enemiesByIsland=new Map();
  function monster(type,x,y,z,index){
    const group=new THREE.Group();group.position.set(x,y,z);root.add(group);
    const legs=[],arms=[];let body;
    if(type==='skeleton'){
      const bone='#e0d2b3',dark='#493c4d';
      body=new THREE.Group();group.add(body);
      cube(body,0,1.75,0,.55,.55,.48,bone);cube(body,-.14,1.8,-.247,.12,.13,.02,dark);cube(body,.14,1.8,-.247,.12,.13,.02,dark);
      cube(body,0,1.57,-.25,.24,.06,.025,dark);cube(body,0,1.1,0,.12,.7,.13,bone);
      for(let j=0;j<3;j++)cube(body,0,1.34-j*.16,0,.62,.09,.28,bone);
      cube(body,0,.76,0,.45,.14,.28,bone);
      legs.push(limb(group,-.19,.72,0,.14,.7,.17,bone),limb(group,.19,.72,0,.14,.7,.17,bone));
      arms.push(limb(body,-.43,1.43,0,.14,.68,.16,bone),limb(body,.43,1.43,0,.14,.68,.16,bone));
      cube(arms[1],0,-.62,-.42,.09,.1,.95,'#9faebc');cube(arms[1],0,-.62,-.08,.35,.12,.12,'#a58c65');
      cube(body,-.48,1.03,-.15,.15,.65,.48,'#7d8591');
    }else if(type==='snake'){
      body=new THREE.Group();group.add(body);
      for(let j=0;j<6;j++){const piece=cube(body,Math.sin(j*.8)*.13,.18,.1+j*.25,.38-j*.025,.32-j*.025,.32,j%2?'#89a270':'#b7be7e');legs.push(piece);}
      cube(body,0,.3,-.23,.55,.4,.55,'#a7b77d');cube(body,-.24,.4,-.47,.075,.09,.04,'#e2a562');cube(body,.24,.4,-.47,.075,.09,.04,'#e2a562');cube(body,0,.2,-.62,.035,.035,.26,'#c37b85');
    }else{
      body=new THREE.Group();group.add(body);
      cube(body,0,.56,.3,.85,.65,.95,'#66576f');cube(body,0,.47,-.36,.6,.45,.52,'#86708b');
      for(const x of [-.2,-.07,.07,.2])cube(body,x,.55,-.635,.06,.07,.035,'#edaec3');
      for(const side of [-1,1])for(let j=0;j<4;j++){
        const pivot=new THREE.Group();pivot.position.set(side*.3,.5,-.4+j*.26);body.add(pivot);
        const upper=cube(pivot,side*.32,0,0,.7,.1,.12,'#8d7798');upper.rotation.z=side*.32;
        const lower=cube(pivot,side*.65,-.2,0,.1,.55,.12,'#67566f');lower.rotation.z=-side*.2;legs.push(pivot);
      }
    }
    const hitMaterials=[];
    group.traverse(o=>{if(o.isMesh){o.material=o.material.clone();hitMaterials.push(o.material);}});
    const hp=type==='skeleton'?3:2;
    const e={type,group,body,legs,arms,hitMaterials,hp,maxHP:hp,spawn:new THREE.Vector3(x,y,z),phase:index*1.7,windup:0,cooldown:0,flash:0,dead:0,active:false,knock:new THREE.Vector2(),island:islandAt(x,z)?.id,wanderTarget:new THREE.Vector2(x,z),wanderState:'idle',wanderTimer:1+index*.37,animTime:0,fallTime:0,deathY:y,seed:131+index*97+Math.floor(x+300)};
    const bar=cube(group,0,type==='skeleton'?2.3:1.25,0,.8,.055,.055,'#bfe0ae');bar.visible=false;e.bar=bar;enemies.push(e);
    if(!enemiesByIsland.has(e.island))enemiesByIsland.set(e.island,[]);enemiesByIsland.get(e.island).push(e);
  }
  onProgress('Waking the island guardians…');await new Promise(requestAnimationFrame);
  for(const [island,type] of [['studio','skeleton'],['ios','snake'],['games','spider']]){
    const centers=places.filter(p=>p.island===island);let made=0;
    for(const p of centers)for(const [dx,dz] of [[-13,12],[13,12]]){
      for(let j=0;j<8;j++){
        const x=p.x+dx+j%3*1.5,z=p.z+dz+Math.floor(j/3)*1.5;
        const h=collision.floor(x,z);
        if(!Number.isFinite(h)||h>p.h+6||h<p.h-5||islandAt(x,z)?.id!==island||collision.blocked(x,h,z,2.4,.65))continue;
        monster(type,x,h,z,made++);break;
      }
    }
  }
  // The hand and sword render on a camera-only layer, outside portal previews.
  scene.add(camera);
  const hand=new THREE.Group();camera.add(hand);hand.position.set(.25,-.3,-.8);hand.scale.setScalar(.5);
  cube(hand,0,-.14,.12,.18,.34,.2,'#866b80');cube(hand,0,.02,.06,.17,.18,.18,'#d3b196');
  cube(hand,0,.15,0,.11,.3,.12,'#69536c');cube(hand,0,.29,0,.48,.08,.14,'#d2b17c');
  cube(hand,0,.76,0,.14,.87,.07,'#c5d6e3');cube(hand,.075,.76,0,.035,.87,.075,'#f2e7dc');
  const tip=cube(hand,0,1.23,0,.12,.16,.07,'#e0e6e9');tip.rotation.z=Math.PI/4;
  hand.traverse(o=>{o.layers.set(1);if(o.isMesh){o.material=o.material.clone();o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=100;}});
  camera.layers.enable(1);hand.visible=false;
  // Camera-only lighting keeps the sword readable in dusk mode.
  const light=new THREE.HemisphereLight('#fff0e0','#66536e',2);light.layers.set(1);camera.add(light);
  const hud=document.createElement('div');hud.id='game-hud';hud.hidden=true;
  hud.innerHTML='<div class="game-vitals"><span>Health</span><meter min="0" max="100" value="100" aria-label="Health"></meter><span class="health-number">100</span></div><span class="game-message" role="status" aria-live="polite"></span><span class="game-crosshair" aria-hidden="true">+</span>';
  document.body.append(hud);
  const meter=hud.querySelector('meter'),number=hud.querySelector('.health-number'),message=hud.querySelector('.game-message');
  let enabled=false,health=100,invincible=0,attackTime=0,hitApplied=false,elapsed=0,home=places[0],paused=false,notice=0;
  const playerKnock=new THREE.Vector2();
  function status(text){message.textContent=text;notice=3;}
  function spawn(p){
    playerKnock.set(0,0);home=p;
    let x=p.x,z=p.z+12.5,y=collision.floor(x,z);
    // Search nearby if a forecourt decoration occupies the spawn.
    for(let j=0;j<20&&(!Number.isFinite(y)||collision.blocked(x,y,z));j++){x=p.x+(j%5-2)*1.2;z=p.z+12.5+Math.floor(j/5);y=collision.floor(x,z);}
    if(!Number.isFinite(y))y=p.h+2;
    player.spawn(x,y,z);camera.position.set(x,y+1.55,z);camera.lookAt(p.x,p.h+3.8,p.z-2);
  }
  function healthUI(){meter.value=health;number.textContent=String(health);}
  function respawn(){health=100;invincible=2;attackTime=0;spawn(home);healthUI();for(const e of enemies){if(e.hp<=0)continue;e.group.position.copy(e.spawn);e.windup=0;e.cooldown=1;e.active=false;e.knock.set(0,0);}status('Back at the sanctuary. Try again.');}
  function attack(){if(!enabled||paused||attackTime>0)return;attackTime=.42;hitApplied=false;}
  function damage(amount,source){if(invincible>0)return;
    playerKnock.set(player.x-source.x,player.z-source.z);if(playerKnock.lengthSq()<.001)playerKnock.set(0,1);playerKnock.normalize().multiplyScalar(5);health=Math.max(0,health-amount);invincible=.9;healthUI();hud.classList.add('hurt');status('Hit! Keep moving or swing your sword.');if(health===0)respawn();}
  function random(e){e.seed=(Math.imul(e.seed,1664525)+1013904223)>>>0;return e.seed/4294967296;}
  function moveEnemy(e,dx,dz,step){
    const pos=e.group.position;
    for(const angle of [0,.7,-.7,1.3,-1.3]){
      const a=Math.atan2(dz,dx)+angle,nx=pos.x+Math.cos(a)*step,nz=pos.z+Math.sin(a)*step;
      const floor=collision.floor(nx,nz,pos.y+.5,.3);
      if(islandAt(nx,nz)?.id===e.island&&Number.isFinite(floor)&&floor>=pos.y-.65&&!collision.blocked(nx,floor,nz,e.type==='skeleton'?2:.7,.32)){
        pos.set(nx,floor,nz);return true;
      }
    }
    return false;
  }
  function update(dt,keys,isPaused){
    paused=isPaused;
    if(!enabled)return;
    hud.classList.toggle('paused',paused);
    if(paused){keys.clear();return;}
    const currentEnemies=enemiesByIsland.get(islandAt(player.x,player.z)?.id)||[];
    elapsed+=dt;notice=Math.max(0,notice-dt);if(!notice)message.textContent='';
    invincible=Math.max(0,invincible-dt);if(invincible<.65)hud.classList.remove('hurt');
    const down=(...k)=>k.some(v=>keys.has(v))?1:0;
    const f=down('w','arrowup')-down('s','arrowdown'),s=down('d','arrowright')-down('a','arrowleft'),yaw=camera.rotation.y;
    const length=Math.max(1,Math.hypot(f,s)),speed=keys.has('shift')?9.5:6;
    player.move(((-Math.sin(yaw)*f+Math.cos(yaw)*s)/length*speed+playerKnock.x)*dt,((-Math.cos(yaw)*f-Math.sin(yaw)*s)/length*speed+playerKnock.y)*dt,dt);
    playerKnock.multiplyScalar(Math.exp(-dt*7));
    if(player.y<-32)respawn();
    camera.position.set(player.x,player.y+1.55,player.z);
    if(attackTime>0){
      attackTime=Math.max(0,attackTime-dt);
      const swing=Math.sin((1-attackTime/.42)*Math.PI);
      hand.rotation.set(-swing*1.3,-swing*.22,swing*.35);hand.position.x=Math.min(.25,camera.aspect*.2)-swing*.14;hand.position.z=-.8-swing*.32;
      if(!hitApplied&&attackTime<.26){
        hitApplied=true;
        // Resolve portal interaction at the contact point of the swing, then
        // stop this frame before enemies can deal damage behind the preview.
        if(onSwordHit()){
          attackTime=0;paused=true;keys.clear();return;
        }
        for(const e of currentEnemies){
          if(e.hp<=0)continue;const dx=e.group.position.x-player.x,dz=e.group.position.z-player.z,d=Math.hypot(dx,dz);
          if(d<3.2&&Math.abs(e.group.position.y-player.y)<2.3&&(-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/Math.max(.1,d)>.35){
            e.hp--;e.knock.set(dx,dz);if(e.knock.lengthSq()<.001)e.knock.set(-Math.sin(yaw),-Math.cos(yaw));e.knock.normalize().multiplyScalar(6);e.flash=.18;e.bar.visible=true;e.bar.scale.x=.8*e.hp/e.maxHP;e.windup=0;e.cooldown=.65;
            status(e.hp>0?'Hit!':`${e.type==='skeleton'?'Skeleton':e.type==='snake'?'Snake':'Spider'} defeated`);
            if(e.hp===0){e.dead=14;e.fallTime=0;e.deathY=e.group.position.y;e.active=false;e.bar.visible=false;e.knock.set(0,0);}
          }
        }
      }
    }else{hand.rotation.set(0,0,-.12);hand.position.x=Math.min(.25,camera.aspect*.2);hand.position.z=-.8;}
    hand.position.y=-.3+(f||s?Math.sin(elapsed*9)*.012:0);
    let threat=false;
    for(const e of currentEnemies){
      if(e.hp<=0){
        e.dead-=dt;e.fallTime=Math.min(.7,e.fallTime+dt);
        const t=e.fallTime/.7,ease=1-Math.pow(1-t,3);
        e.group.rotation.z=e.type==='skeleton'?-Math.PI/2*ease:Math.PI*ease;
        e.group.position.y=e.deathY+ease*(e.type==='skeleton'?.22:e.type==='spider'?1:.45);
        e.body.rotation.x=0;e.body.scale.setScalar(1);
        e.legs.forEach((leg,j)=>{if(e.type==='spider')leg.rotation.x=(j%2?1:-1)*ease*.9;});
        e.flash=Math.max(0,e.flash-dt);
        for(const m of e.hitMaterials){m.emissive.set(e.flash>0?'#ff2525':'#000000');m.emissiveIntensity=e.flash>0?.85:0;}
        if(e.dead<=0&&e.spawn.distanceTo(camera.position)>15){
          e.hp=e.maxHP;e.group.position.copy(e.spawn);e.group.rotation.set(0,0,0);e.group.visible=true;e.bar.visible=false;
          e.windup=0;e.cooldown=1;e.wanderState='idle';e.wanderTimer=2;e.fallTime=0;
        }
        continue;
      }
      e.animTime+=dt;let moved=false;
      const pos=e.group.position;
      if(e.knock.lengthSq()>.01){
        for(const axis of ['x','z']){
          const nx=pos.x+(axis==='x'?e.knock.x*dt:0),nz=pos.z+(axis==='z'?e.knock.y*dt:0);
          const floor=collision.floor(nx,nz,pos.y+.5,.3);
          if(Number.isFinite(floor)&&floor>=pos.y-.65&&!collision.blocked(nx,floor,nz,e.type==='skeleton'?2:.7,.32))pos.set(nx,floor,nz);
        }
        e.knock.multiplyScalar(Math.exp(-dt*7));
      }
      const dx=player.x-pos.x,dz=player.z-pos.z,d=Math.hypot(dx,dz);
      const wasActive=e.active;
      e.active=d<(e.active?17:10)&&Math.abs(player.y-pos.y)<5;
      e.cooldown=Math.max(0,e.cooldown-dt);e.flash=Math.max(0,e.flash-dt);e.body.scale.setScalar(e.flash>0?1.08:1);
      for(const material of e.hitMaterials){material.emissive.set(e.flash>0?'#ff2525':'#000000');material.emissiveIntensity=e.flash>0?.85:0;}
      if(e.active){
        threat=true;e.group.rotation.y=Math.atan2(-dx,-dz);
        if(e.windup>0){
          e.windup-=dt;e.body.rotation.x=-Math.sin(e.windup*8)*.18;
          if(e.windup<=0){if(d<1.9&&Math.abs(player.y-pos.y)<1.8)damage(e.type==='skeleton'?18:12,pos);e.cooldown=1.4;e.body.rotation.x=0;}
        }else if(d<1.65&&Math.abs(player.y-pos.y)<1.8&&e.cooldown===0){e.windup=.5;}
        else if(d>1.35&&e.knock.lengthSq()<.3){
          moved=moveEnemy(e,dx,dz,dt*(e.type==='snake'?2.2:e.type==='spider'?3:1.8));
        }
      }else{
        e.windup=0;e.body.rotation.x=0;
        if(wasActive){e.wanderState='idle';e.wanderTimer=1.5;}
        e.wanderTimer-=dt;
        if(e.wanderState==='idle'&&e.wanderTimer<=0){
          let selected=false;
          for(let attempt=0;attempt<8;attempt++){
            const angle=random(e)*Math.PI*2,radius=2+random(e)*5;
            const nx=e.spawn.x+Math.cos(angle)*radius,nz=e.spawn.z+Math.sin(angle)*radius;
            const floor=collision.floor(nx,nz,pos.y+1,.3);
            if(islandAt(nx,nz)?.id===e.island&&Number.isFinite(floor)&&Math.abs(floor-pos.y)<1&&!collision.blocked(nx,floor,nz,e.type==='skeleton'?2:.7,.32)){
              e.wanderTarget.set(nx,nz);e.wanderState='walking';e.wanderTimer=5+random(e)*3;selected=true;break;
            }
          }
          if(!selected)e.wanderTimer=1.5;
        }
        if(e.wanderState==='walking'){
          const wx=e.wanderTarget.x-pos.x,wz=e.wanderTarget.y-pos.z;
          if(Math.hypot(wx,wz)<.5||e.wanderTimer<=0){e.wanderState='idle';e.wanderTimer=1.5+random(e)*3;}
          else{
            e.group.rotation.y=Math.atan2(-wx,-wz);
            moved=moveEnemy(e,wx,wz,dt*(e.type==='skeleton'?.75:1));
            if(!moved){e.wanderState='idle';e.wanderTimer=1+random(e)*2;}
          }
        }
      }
      const walk=moved?Math.sin(e.animTime*9+e.phase):0;
      e.legs.forEach((leg,j)=>{if(e.type==='snake')leg.position.x=Math.sin((moved?e.animTime*5:0)+j*.9)*.13;else leg.rotation.x=walk*.45*(j%2?1:-1);});
      e.arms.forEach((arm,j)=>arm.rotation.x=e.windup>0?-1.1:walk*.3*(j?1:-1));
      e.bar.visible=e.active&&e.hp<e.maxHP;
    }
    hud.classList.toggle('threat',threat);
  }
  onProgress('Ready.');
  return {
    enter(p){enabled=true;root.visible=true;hand.visible=true;hud.hidden=false;paused=false;health=100;healthUI();invincible=1.5;spawn(p);status('Space to jump. Again to double jump. Click to swing.');},
    exit(){enabled=false;root.visible=false;hand.visible=false;hud.hidden=true;attackTime=0;},
    jump(){if(enabled&&!paused)player.jump();},attack,update,
    // Read-only snapshots support deterministic game verification without exposing controls.
    snapshot(){return {health,paused,enabled,position:{x:player.x,y:player.y,z:player.z},grounded:player.grounded,jumps:player.jumps,enemies:enemies.map(e=>({type:e.type,hp:e.hp,active:e.active,island:e.island,wanderState:e.wanderState,wanderTimer:e.wanderTimer,fallTime:e.fallTime,visible:e.group.visible,roll:e.group.rotation.z,x:e.group.position.x,y:e.group.position.y,z:e.group.position.z}))};}
  };
}
