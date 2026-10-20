import { arrangeOrbit, routeOrbitEdge } from './orbit-layout.js'
import { bloomSeedGraph } from '/src/features/bloom/seed.ts'

// Use the app's curated content instead of maintaining a second mock vocabulary.
if(new URLSearchParams(location.search).get('theme')==='orbit'){
 const roots=['学','生','日','人','家','水','木','休'];
 const graph=bloomSeedGraph.nodes;
 const registry=new Map(graph.map(n=>[n.zh,n]));
 const assigned=new Set(data.map(n=>n.zh));
 const groups=[];
 roots.forEach((zh,index)=>{
  const source=registry.get(zh);if(!source)return;
  let hub=get(zh);
  if(!hub){hub={...source,hub:1,parent:null,x:0,y:0};data.push(hub);assigned.add(zh)}
  const words=graph.filter(n=>n.kind==='word'&&n.zh.includes(zh));
  for(const word of words){if(assigned.has(word.zh))continue;data.push({...word,hub:0,parent:zh,x:0,y:0});assigned.add(word.zh)}
  groups.push({zh,words,hub,index});
 });
 opened=true;
 // Compute positions once; zoom, pan and selection never rearrange the nodes.
 const { width, height }=arrangeOrbit(data);
 const routes=new Map(data.filter(n=>n.parent).map(n=>[n.zh,routeOrbitEdge(get(n.parent),n,data)]));
 size=n=>[n.width,n.height];
 world.style.width=width+'px';world.style.height=height+'px';$('#edges').setAttribute('width',width);$('#edges').setAttribute('height',height);
 const wordCount=data.filter(n=>!n.hub).length;
 const overview=document.createElement('section');overview.className='orbit-library';overview.setAttribute('aria-label','ภาพรวมกลุ่มคำ');
 overview.innerHTML=`<header><small>YOUR WORD UNIVERSE</small><h2>${wordCount} คำ · ${groups.length} กลุ่มให้สำรวจ</h2><p>เริ่มจากตัวที่คุ้น แล้วต่อยอดไปยังคำใหม่</p></header><div class="orbit-families"></div>`;
 groups.forEach(g=>{const b=document.createElement('button');b.className='orbit-family';const examples=g.words.slice(0,3);b.innerHTML=`<div class="family-title"><strong>${g.zh}</strong><span>${g.hub.py}<small>${g.hub.th}</small></span><em>${g.words.length} คำ ↗</em></div><div class="family-examples">${examples.map(n=>`<span><b>${n.zh}</b><small>${n.py}</small><small>${n.th.split(' / ')[0]}</small></span>`).join('')}</div>`;b.onclick=()=>select(g.zh);overview.querySelector('.orbit-families').append(b)});
 canvas.append(overview);overview.addEventListener('pointerdown',e=>e.stopPropagation());overview.addEventListener('wheel',e=>e.stopPropagation());
 const nav=document.createElement('nav');nav.className='orbit-groups';nav.setAttribute('aria-label','ไปกลุ่มคำ');
 groups.forEach(g=>{const b=document.createElement('button');b.textContent=g.zh;b.setAttribute('aria-label',`กลุ่ม ${g.zh} ${g.hub.th}`);b.onclick=()=>select(g.zh);nav.append(b)});$('.maparea').insertBefore(nav,canvas);
 const originalRender=render;
 const groupMarkers=document.createElement('div');groupMarkers.className='orbit-markers';canvas.append(groupMarkers);
 groups.forEach(g=>{const b=document.createElement('button');b.innerHTML=`<b>${g.zh}</b><span>${g.hub.py} · ${g.words.length} คำ</span>`;b.onclick=()=>select(g.zh);groupMarkers.append(b)});
 const originalPaint=paint;
 paint=function(){originalPaint();groupMarkers.hidden=mode!=='overview';[...groupMarkers.children].forEach((b,i)=>{const n=groups[i].hub;b.style.left=(pose.x+(n.x+n.width/2)*pose.s)+'px';b.style.top=(pose.y+(n.y+n.height/2)*pose.s)+'px'});};

 render=function(){originalRender();$('#nodes').querySelectorAll('.node').forEach(b=>{const n=get(b.querySelector('.han').textContent);b.style.width=n.width+'px';b.style.height=n.height+'px'});$('#edges').querySelectorAll('path').forEach((p,i)=>{const n=data.filter(n=>n.parent)[i];p.setAttribute('d',routes.get(n.zh).d)});overview.hidden=mode!=='library';nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',selected===b.textContent));if(mode==='overview'){$('#caption').textContent='จักรวาลคำของคุณ'}else{$('#caption').textContent='สำรวจคำที่เชื่อมต่อกัน'};$('.bottom').innerHTML=`<span>${wordCount} คำในพรีวิว · ทุกคำมีพินอิน ไทย และเสียง</span><span>กลุ่มอาจมีคำร่วมกัน · จำนวนรวมไม่นับซ้ำ</span>`;
  const current=get(selected);if(current?.hub){$('#chips').innerHTML='';const words=data.filter(n=>!n.hub&&n.zh.includes(selected));words.forEach(n=>{const b=document.createElement('button');b.className='library-word';b.innerHTML=`<b>${n.zh}</b><small>${n.py}</small><span>${n.th}</span>`;b.onclick=()=>select(n.zh);$('#chips').append(b)});$('#detail .section h2').textContent=`คำที่ต่อยอดจาก ${selected} · ${words.length} คำ`;}else $('#detail .section h2').textContent='สำรวจต่อจากตัวอักษร';
 };
 const baseFit=fit;
 fit=function(){if(mode==='overview'){const w=canvas.clientWidth,h=canvas.clientHeight-90;const scale=Math.max(.04,Math.min(w/width,h/height));pose={s:scale,x:(w-width*scale)/2,y:15};paint();return}if(mode==='library')return;const n=get(selected),[w,h]=size(n);let parent=n.parent&&get(n.parent);const vw=canvas.clientWidth,vh=canvas.clientHeight-90;let cx=n.x+w/2,cy=n.y+h/2;if(n.hub){parent=data.filter(other=>other.parent===n.zh&&!other.hub).filter(other=>Math.abs(other.x+other.width/2-cx)+(w+other.width)/2<vw-40&&Math.abs(other.y+other.height/2-cy)+h<vh-30).sort((a,b)=>Math.abs(a.y-n.y)-Math.abs(b.y-n.y))[0]}if(parent&&Math.abs(cx-parent.x-parent.width/2)+(w+parent.width)/2<vw-40&&Math.abs(cy-parent.y-parent.height/2)+h<vh-30){cx=(cx+parent.x+parent.width/2)/2;cy=(cy+parent.y+parent.height/2)/2}pose={s:1,x:vw/2-cx,y:vh/2-cy};paint();};
 const baseZoom=zoom;
 zoom=function(f,cx,cy){if(mode==='library'){mode='read';render();fit()}baseZoom(f,cx,cy)};
 $('#overview').onclick=()=>{mode='overview';render();fit()};
 const browse=document.createElement('button');browse.textContent='เลือกกลุ่ม';browse.style.font='12px Thonburi,sans-serif';browse.onclick=()=>{mode='library';render()};nav.prepend(browse);selected='中国人';mode='read';render();fit();
}
