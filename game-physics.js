// Loaded with the game, never by the initial portfolio map.
export class CollisionWorld {
  constructor(blocks) {
    this.cells=new Map();
    for(const b of blocks){
      const r=Math.hypot(b.w,b.d)/2;
      for(let x=Math.floor((b.x-r)/8);x<=Math.floor((b.x+r)/8);x++)for(let z=Math.floor((b.z-r)/8);z<=Math.floor((b.z+r)/8);z++){
        const key=`${x},${z}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(b);
      }
    }
  }
  nearby(x,z,r=.3){
    const result=new Set();
    for(let a=Math.floor((x-r)/8);a<=Math.floor((x+r)/8);a++)for(let b=Math.floor((z-r)/8);b<=Math.floor((z+r)/8);b++)for(const block of this.cells.get(`${a},${b}`)||[])result.add(block);
    return result;
  }
  overlaps(b,x,z,r){
    const dx=x-b.x,dz=z-b.z,c=Math.cos(b.rotation||0),s=Math.sin(b.rotation||0);
    return Math.abs(dx*c-dz*s)<b.w/2+r && Math.abs(dx*s+dz*c)<b.d/2+r;
  }
  blocked(x,y,z,height=1.65,r=.3){
    for(const b of this.nearby(x,z,r))if(this.overlaps(b,x,z,r)&&y<b.y+b.h/2-.001&&y+height>b.y-b.h/2+.001)return true;
    return false;
  }
  floor(x,z,ceiling=Infinity,r=.27){
    let top=-Infinity;
    for(const b of this.nearby(x,z,r)){const h=b.y+b.h/2;if(h<=ceiling+.001&&h>top&&this.overlaps(b,x,z,r))top=h;}
    return top;
  }
}
export class Walker {
  constructor(world){this.world=world;this.x=0;this.y=0;this.z=0;this.vy=0;this.jumps=0;this.grounded=false;}
  spawn(x,y,z){Object.assign(this,{x,y,z,vy:0,jumps:0,grounded:true});}
  jump(){if(this.jumps>=2)return false;this.vy=this.jumps===0?8.8:8;this.jumps++;this.grounded=false;return true;}
  move(dx,dz,dt){
    const w=this.world;
    // Substeps prevent tunnelling through narrow posts on slower frames.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
    for(let i=0;i<steps;i++)for(const [axis,d] of [['x',dx/steps],['z',dz/steps]]){
      const x=this.x+(axis==='x'?d:0),z=this.z+(axis==='z'?d:0);
      if(!w.blocked(x,this.y,z)){this.x=x;this.z=z;}
      else if(this.grounded){
        const step=w.floor(x,z,this.y+.48);
        if(step>this.y&&step-this.y<=.48&&!w.blocked(x,step,z)){this.x=x;this.z=z;this.y=step;}
      }
    }
    const oldY=this.y;this.vy-=23*dt;let nextY=oldY+this.vy*dt;
    const floor=w.floor(this.x,this.z,oldY+.025);
    if(this.vy<=0&&floor>=nextY){nextY=floor;this.vy=0;this.grounded=true;this.jumps=0;}
    else {
      if(this.grounded){this.grounded=false;this.jumps=Math.max(1,this.jumps);}
      if(this.vy>0&&w.blocked(this.x,nextY,this.z)){
        // Stop beneath ceilings instead of passing through them.
        nextY=oldY;this.vy=0;
      }
    }
    this.y=nextY;
  }
}
