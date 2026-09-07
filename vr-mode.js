import * as THREE from './vendor/three.module.js';
import {readTouch,snapTurn} from './vr-input.js';

export async function createVR({renderer,scene,camera,game,session,onPortalRay,onExit,onDesktopPortal}){
  const rig=new THREE.Group(),visuals=new THREE.Group();scene.add(rig,visuals);
  const savedParent=camera.parent;rig.add(camera);camera.position.set(0,0,0);camera.rotation.set(0,0,0);
  const player=game.getPlayer();rig.position.set(player.x,player.y,player.z);
  const box=new THREE.BoxGeometry(1,1,1),ownedMaterials=[],ownedGeometry=[box];
  function block(parent,x,y,z,w,h,d,color){
    const material=new THREE.MeshLambertMaterial({color});ownedMaterials.push(material);
    const mesh=new THREE.Mesh(box,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  }
  const controls=[],raycaster=new THREE.Raycaster(),direction=new THREE.Vector3(),origin=new THREE.Vector3();
  let active=false,disposed=false,turnReady=true,menu=false,portal=null,afterEnd=null,previousHead=null,lastHealth=-1;
  const cardCanvas=document.createElement('canvas');cardCanvas.width=1024;cardCanvas.height=768;
  const ctx=cardCanvas.getContext('2d'),texture=new THREE.CanvasTexture(cardCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const panelGeometry=new THREE.PlaneGeometry(1.6,1.2);ownedGeometry.push(panelGeometry);
  const panelMaterial=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthTest:false});ownedMaterials.push(panelMaterial);
  const panel=new THREE.Mesh(panelGeometry,panelMaterial);panel.renderOrder=100;panel.visible=false;visuals.add(panel);
  const healthCanvas=document.createElement('canvas');healthCanvas.width=512;healthCanvas.height=128;
  const healthTexture=new THREE.CanvasTexture(healthCanvas);healthTexture.colorSpace=THREE.SRGBColorSpace;
  const healthMaterial=new THREE.MeshBasicMaterial({map:healthTexture,transparent:true,depthTest:false});ownedMaterials.push(healthMaterial);
  const healthGeometry=new THREE.PlaneGeometry(.28,.07);ownedGeometry.push(healthGeometry);
  const wrist=new THREE.Mesh(healthGeometry,healthMaterial);wrist.position.set(0,.07,-.09);wrist.rotation.x=-.7;wrist.renderOrder=90;
  const buttons=[];
  function lines(text,x,y,maxWidth,lineHeight){
    let line='';for(const word of text.split(/\s+/)){const next=line+word+' ';if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=next;}ctx.fillText(line,x,y);return y+lineHeight;
  }
  function drawPanel(){
    ctx.fillStyle='#eee5e4';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#4b3c59';
    ctx.font='48px Georgia';ctx.fillText(portal?portal.name:'The floating islands',60,86);
    ctx.font='25px sans-serif';
    if(portal){let y=lines(portal.description,60,151,904,38);if(portal.note)y=lines(portal.note,60,y+20,904,35);ctx.font='20px sans-serif';lines(portal.url,60,Math.max(390,y+24),904,30);}
    else lines('Left stick: move. Hold left grip: run. Right stick: snap turn. A: jump, twice for double jump. Right trigger or a physical sword swing: attack. Point either controller at a portal and pull the trigger to read it. B: pause menu.',60,155,904,42);
    buttons.length=0;
    for(const [label,action,y] of [[portal?'Keep exploring':'Resume','resume',510],[portal?'View link on desktop':'Exit VR',portal?'desktop':'exit',620]]){
      ctx.fillStyle='#655176';ctx.fillRect(60,y,904,86);ctx.fillStyle='#fff6eb';ctx.font='30px sans-serif';ctx.fillText(label,90,y+54);buttons.push({y0:y/768,y1:(y+86)/768,action});
    }
    texture.needsUpdate=true;
  }
  function showPanel(place=null){
    portal=place;menu=true;panel.visible=true;drawPanel();
    const head=renderer.xr.getCamera();head.getWorldPosition(origin);head.getWorldDirection(direction);
    direction.y=0;if(direction.lengthSq()<.001)direction.set(0,0,-1);direction.normalize();
    panel.position.copy(origin).addScaledVector(direction,1.8);panel.lookAt(origin);previousHead=null;
  }
  function hidePanel(){menu=false;portal=null;panel.visible=false;previousHead=null;}
  function rayFor(controller){controller.updateWorldMatrix(true,false);return {origin:controller.getWorldPosition(new THREE.Vector3()),direction:new THREE.Vector3(0,0,-1).transformDirection(controller.matrixWorld)};}
  function select(control){
    if(!active||session.visibilityState!=='visible')return;
    const ray=rayFor(control.target);
    if(menu){
      raycaster.set(ray.origin,ray.direction);const hit=raycaster.intersectObject(panel)[0];
      if(hit?.uv){const y=1-hit.uv.y;const button=buttons.find(b=>y>=b.y0&&y<=b.y1);if(button?.action==='resume')hidePanel();else if(button?.action==='desktop'){afterEnd=portal;session.end().catch(()=>{});}else if(button?.action==='exit')session.end().catch(()=>{});}
      return;
    }
    if(onPortalRay(ray,8))return;
    if(control.source?.handedness==='right'){game.attack(ray);control.swingTimer=.42;}
  }
  for(let i=0;i<2;i++){
    const target=renderer.xr.getController(i),grip=renderer.xr.getControllerGrip(i);rig.add(target,grip);
    const model=new THREE.Group();grip.add(model);block(model,0,0,0,.06,.12,.08,'#8c758f');
    const sword=new THREE.Group();model.add(sword);sword.visible=false;
    block(sword,0,0,-.07,.2,.035,.06,'#d2b17c');block(sword,0,0,-.44,.035,.045,.7,'#d3dfea');block(sword,0,0,-.82,.025,.03,.08,'#edf0e9');
    const lineGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);ownedGeometry.push(lineGeometry);
    const lineMaterial=new THREE.LineBasicMaterial({color:'#dcb9f4',transparent:true,opacity:.55,depthTest:false});ownedMaterials.push(lineMaterial);
    const line=new THREE.Line(lineGeometry,lineMaterial);line.scale.z=5;target.add(line);
    const control={target,grip,model,sword,line,source:null,jump:false,menu:false,swingTimer:0,physicalCooldown:0,previousTip:null};controls.push(control);
    control.connected=e=>{control.source=e.data;sword.visible=e.data.handedness==='right';if(e.data.handedness==='left')grip.add(wrist);};
    control.disconnected=()=>{control.source=null;control.previousTip=null;};
    control.select=()=>select(control);
    target.addEventListener('connected',control.connected);target.addEventListener('disconnected',control.disconnected);target.addEventListener('selectstart',control.select);
  }
  function cleanup(){
    if(disposed)return;disposed=true;active=false;game.setVR(false);
    const p=game.getPlayer();savedParent.add(camera);camera.position.set(p.x,p.y+1.55,p.z);camera.rotation.set(0,rig.rotation.y,0);camera.fov=65;
    for(const c of controls){c.target.removeEventListener('connected',c.connected);c.target.removeEventListener('disconnected',c.disconnected);c.target.removeEventListener('selectstart',c.select);c.target.remove(c.line);c.grip.remove(c.model,wrist);rig.remove(c.target,c.grip);}
    scene.remove(rig,visuals);for(const material of ownedMaterials)material.dispose();for(const geometry of ownedGeometry)geometry.dispose();texture.dispose();healthTexture.dispose();
    onExit();if(afterEnd)onDesktopPortal(afterEnd);
  }
  session.addEventListener('end',cleanup,{once:true});
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(.85);
  try{await renderer.xr.setSession(session);active=true;game.setVR(true);}
  catch(error){cleanup();throw error;}
  return {
    get active(){return active;},get paused(){return menu||session.visibilityState!=='visible';},
    end(){return session.end();},showPortal:showPanel,
    getPosition(){return renderer.xr.getCamera().getWorldPosition(new THREE.Vector3());},
    update(dt){
      if(!active)return;
      rig.updateMatrixWorld(true);renderer.xr.updateCamera(camera);
      const head=renderer.xr.getCamera(),headPosition=head.getWorldPosition(new THREE.Vector3());
      const localHead=rig.worldToLocal(headPosition.clone());
      let moveX=0,moveY=0,run=false;
      for(const c of controls){
        if(!c.source)continue;const input=readTouch(c.source);
        if(c.source.handedness==='left'){moveX=input.x;moveY=input.y;run=input.grip;}
        if(c.source.handedness==='right'){
          const turn=snapTurn(input.x,turnReady);turnReady=turn.ready;
          if(turn.angle&&!menu){rig.rotation.y+=turn.angle;previousHead=null;}
          if(input.jump&&!c.jump&&!menu)game.jump();
          if(input.menu&&!c.menu){if(menu)hidePanel();else showPanel();}
          c.jump=input.jump;c.menu=input.menu;
          c.swingTimer=Math.max(0,c.swingTimer-dt);c.sword.rotation.x=c.swingTimer?Math.sin((1-c.swingTimer/.42)*Math.PI)*.65:0;
          c.physicalCooldown=Math.max(0,c.physicalCooldown-dt);
          // Measure the blade tip in tracking space, excluding artificial movement.
          const tip=new THREE.Vector3(0,0,-.8).applyMatrix4(c.grip.matrix);
          if(c.previousTip&&!menu&&c.physicalCooldown===0&&tip.distanceTo(c.previousTip)/Math.max(dt,.001)>1.5){game.attack(rayFor(c.target));c.physicalCooldown=.5;}
          c.previousTip=tip;
        }
        c.line.visible=menu||c.source.handedness==='left';
      }
      const paused=menu||session.visibilityState!=='visible';
      rig.updateMatrixWorld(true);renderer.xr.updateCamera(camera);
      head.getWorldDirection(direction);const yaw=Math.atan2(-direction.x,-direction.z);
      const delta=previousHead?localHead.clone().sub(previousHead):new THREE.Vector3();delta.y=0;delta.applyAxisAngle(new THREE.Vector3(0,1,0),rig.rotation.y);
      // Reference-space resets must not become a large locomotion impulse.
      if(delta.length()>.5)delta.set(0,0,0);
      previousHead=localHead.clone();
      game.update(dt,new Set(run?['shift']:[]),paused,{forward:-moveY,side:moveX,yaw,trackedX:delta.x,trackedZ:delta.z});
      const p=game.getPlayer(),offset=localHead.clone();offset.y=0;offset.applyAxisAngle(new THREE.Vector3(0,1,0),rig.rotation.y);
      rig.position.set(p.x-offset.x,p.y,p.z-offset.z);rig.updateMatrixWorld(true);renderer.xr.updateCamera(camera);
      if(p.health!==lastHealth){lastHealth=p.health;const h=healthCanvas.getContext('2d');h.clearRect(0,0,512,128);h.fillStyle='#41354feb';h.fillRect(0,0,512,128);h.fillStyle='#f4e7da';h.font='42px sans-serif';h.fillText(`Health  ${p.health}`,24,82);healthTexture.needsUpdate=true;}
    }
  };
}
