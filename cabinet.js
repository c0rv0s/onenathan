(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const worlds = {
    garden: { title: 'After the rain', description: 'Moss, new leaves, and the smell of wet stone.', alt: 'A glass bell jar holding a floating moss garden with a tree and a turquoise pond', figure: '01', hue: 76 },
    pool: { title: 'An endless summer', description: 'Still water. Warm tiles. Nothing you need to do.', alt: 'A glass bell jar holding a tiny turquoise swimming pool reclaimed by moss and ferns', figure: '02', hue: 170 },
    home: { title: 'Someone left a light on', description: 'A winding path, an old tree, a window still glowing.', alt: 'A glass bell jar holding a miniature stone house with a glowing window and an autumn tree', figure: '03', hue: 36 }
  };
  const key = 'nate-cabinet-memories-v1';
  let memories = [];
  let canSave = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) memories = saved.filter(m => m && typeof m.text === 'string' && m.text.length <= 160 && Object.hasOwn(worlds,m.world) && Number.isFinite(m.created)).slice(0, 12);
  } catch { canSave = false; }
  let activeWorld = 'garden';
  let seed = 741;
  let transition = 0;
  let front = $('world-a');
  let back = $('world-b');
  let particles = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let frame = 0;
  const canvas = $('life');
  const ctx = canvas.getContext('2d');
  let size = 1;
  let elapsed = 0;
  let lastTime = 0;
  function hash(text) { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; }
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  function populate(text) {
    seed = hash(text);
    particles = Array.from({length: 20}, () => ({x: .29 + random() * .42, y: .34 + random() * .38, r: .0007 + random() * .001, speed: .12 + random() * .3, phase: random() * Math.PI * 2}));
    draw();
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0,0,size,size);
    for (const p of particles) {
      const t = elapsed * p.speed + p.phase;
      const x = (p.x + Math.sin(t) * .02) * size;
      const y = (p.y + Math.cos(t * .7) * .025) * size;
      ctx.beginPath();ctx.fillStyle = `hsla(${worlds[activeWorld].hue},45%,${activeWorld === 'home' ? 73 : 45}%,${.3 + .3 * Math.sin(t) ** 2})`;
      ctx.ellipse(x,y,p.r*size*(1.2+Math.sin(t*4)*.3),p.r*size,Math.sin(t),0,Math.PI*2);ctx.fill();
    }
  }
  function tick(time) {
    if (paused || document.hidden) { frame = 0; lastTime = 0; return; }
    if (lastTime) elapsed += Math.min((time-lastTime)/1000,.05);
    lastTime = time;draw();frame = requestAnimationFrame(tick);
  }
  function resume() { if (!paused && !document.hidden && !frame) frame = requestAnimationFrame(tick); }
  function updatePause() { $('pause').setAttribute('aria-pressed', String(paused)); $('pause').setAttribute('aria-label', paused ? 'Resume the living particles' : 'Pause the living particles'); $('pause').textContent = paused ? 'Resume life ▷' : 'Pause life Ⅱ'; }
  $('pause').addEventListener('click', () => {paused = !paused;updatePause();resume();});
  reduced.addEventListener('change', event => {paused = event.matches;updatePause();resume();});
  document.addEventListener('visibilitychange', resume);
  new ResizeObserver(() => { size = canvas.getBoundingClientRect().width; const dpr = Math.min(devicePixelRatio || 1,2);canvas.width = Math.round(size*dpr);canvas.height = Math.round(size*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);draw(); }).observe($('stage'));
  function chooseWorld(text) {
    if (/\b(pool|swim|water|ocean|sea|beach|lake|summer|coast|river)\b/i.test(text)) return 'pool';
    if (/\b(home|house|window|light|night|mother|father|mom|dad|grandma|grandmother|grandfather|family|winter|autumn|miss|someone)\b/i.test(text)) return 'home';
    if (/\b(garden|rain|tree|forest|moss|green|flower|spring|wood|mountain)\b/i.test(text)) return 'garden';
    return ['garden','pool','home'][hash(text)%3];
  }
  async function show(memory, save = false) {
    const token = ++transition;
    const world = worlds[memory.world];
    const picture = new Image();picture.src = `images/cabinet/${memory.world}.jpg`;
    try { await picture.decode(); } catch { $('save-note').textContent = 'This world could not load. Please try again.';return; }
    if(token !== transition) return;
    back.src = picture.src;
    back.classList.add('visible');front.classList.remove('visible');
    [front,back] = [back,front];
    activeWorld = memory.world;
    $('memory').value = memory.text;
    $('stage').setAttribute('aria-label',world.alt);
    $('world-title').textContent = world.title;
    $('world-description').textContent = `“${memory.text}”`;
    $('figure-number').textContent = world.figure;
    populate(memory.text);
    if(save) {
      memories = [memory,...memories.filter(m => m.text !== memory.text)].slice(0,12);
      persist();
    }
    $('save-note').textContent = canSave ? 'Kept here, for when you come back.' : 'This memory lasts for this visit. Browser storage is unavailable.';
    renderCollection();
  }
  function persist() { try {localStorage.setItem(key,JSON.stringify(memories));canSave=true;} catch {canSave=false;} }
  function submit(text) { const clean = text.trim().slice(0,160);if(!clean)return;show({text:clean,world:chooseWorld(clean),created:Date.now()},true); }
  $('memory-form').addEventListener('submit', e => { e.preventDefault();submit($('memory').value); });
  document.querySelectorAll('[data-memory]').forEach(b => b.addEventListener('click', () => {$('memory').value=b.dataset.memory;submit(b.dataset.memory);}));
  function renderCollection() {
    $('memory-count').textContent = memories.length;
    $('saved-memories').replaceChildren();
    $('collection-description').textContent = memories.length ? 'Little worlds you’ve left here. Select one to return.' : 'Give the cabinet a memory. It will be waiting here when you come back.';
    $('clear-memories').hidden = !memories.length;
    memories.forEach(m => {
      const button = document.createElement('button');button.className='saved-memory';
      const img=document.createElement('img');img.src=`images/cabinet/${m.world}.jpg`;img.alt='';
      const label=document.createElement('span');label.textContent=m.text;
      const date=document.createElement('small');date.textContent=new Date(m.created).toLocaleDateString(undefined,{month:'short',day:'numeric'});
      label.append(date);button.append(img,label);
      button.addEventListener('click',()=>{$('memory').value=m.text;show(m);$('collection').close();});
      $('saved-memories').append(button);
    });
  }
  $('clear-memories').addEventListener('click',()=>{memories=[];persist();renderCollection();$('memory').value='';++transition;activeWorld='garden';front.src='images/cabinet/garden.jpg';front.classList.add('visible');back.classList.remove('visible');$('world-title').textContent='A place to begin';$('world-description').textContent='A small wilderness, waiting for a memory.';$('figure-number').textContent='01';$('stage').setAttribute('aria-label',worlds.garden.alt);$('save-note').textContent=canSave?'Your memories stay in this browser.':'Browser storage is unavailable.';populate('a place to begin');});
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => $(button.dataset.open).showModal()));
  document.querySelectorAll('dialog').forEach(dialog => {dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click', e => {if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
  renderCollection();populate('a place to begin');updatePause();resume();
  if(memories.length) show(memories[0]);
  else if(!canSave) $('save-note').textContent = 'Browser storage is unavailable. Memories will last for this visit.';
  // Warm the two alternate artworks after the initial scene is ready.
  window.addEventListener('load',()=>{['pool','home'].forEach(w=>{const image=new Image();image.src=`images/cabinet/${w}.jpg`;});});
})();
