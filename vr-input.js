// Oculus Touch uses the WebXR xr-standard button/axis layout.
export function readTouch(source){
  const pad=source?.gamepad;
  if(!pad||pad.mapping!=='xr-standard')return {x:0,y:0,trigger:false,grip:false,jump:false,menu:false};
  const axis=v=>Math.abs(v||0)<.18?0:Math.sign(v)*Math.min(1,(Math.abs(v)-.18)/.82);
  return {x:axis(pad.axes[2]),y:axis(pad.axes[3]),trigger:!!pad.buttons[0]?.pressed,grip:!!pad.buttons[1]?.pressed,jump:!!pad.buttons[4]?.pressed,menu:!!pad.buttons[5]?.pressed};
}
export function snapTurn(value,ready){
  if(Math.abs(value)<.25)return {angle:0,ready:true};
  if(ready&&Math.abs(value)>.65)return {angle:-Math.sign(value)*Math.PI/6,ready:false};
  return {angle:0,ready};
}
