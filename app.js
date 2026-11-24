{
const RAW=window.WORDS;
const BANDS=[["P","Pre-Band I"],["C1","Band I Core I"],["C2","Band I Core II"]];
const PAGE=20;
const ICON={
 spk:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
 dict:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12v8h5l6 5V7l-6 5H5z"/><path d="M21 26l7-7-3-3-7 7-1 4z"/></svg>',
 tr:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h12M10 4v3M7 7c1 5 4 8 8 9M14 7c-1 5-4 8-9 10"/><path d="M17 28l5-12 5 12M19 24h6"/></svg>',
 rev:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10h18l-4-4M26 22H8l4 4"/></svg>',
 story:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6c4-1 8-1 12 2 4-3 8-3 12-2v20c-4-1-8-1-12 2-4-3-8-3-12-2z"/><path d="M16 8v20M8 13h4M20 13h4M20 18h4"/></svg>',
 mix:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h5c6 0 8 14 14 14h5M4 23h5c2 0 3-1 4-3M19 12c1-2 2-3 4-3h5M25 6l3 3-3 3M25 20l3 3-3 3"/></svg>',
 weak:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4l13 23H3z"/><path d="M16 13v6M16 23v.5"/></svg>'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};

// ---------- words ----------
const W=RAW.map((r,i)=>{
 const [b,e,he,sp,s,pos,mean,rp,fam]=r;
 const m=s.match(/\*([^*]+)\*/);
 const L=(e.match(/[a-z]/i)||['?'])[0].toLowerCase();
 return {id:i,b,e,he,sp,s,cl:m?m[1]:'',pos,mean,rp,fam,L};
});
const byBand={};BANDS.forEach(([k])=>byBand[k]=W.filter(w=>w.b===k));
for(const k in byBand)byBand[k].forEach((w,i)=>w.pg=Math.floor(i/PAGE)+1);

// ---------- storage ----------
const KEY='lexband1-progress-v1',SKEY='lexband1-settings-v1';
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let P=lsGet(KEY)||{}; // id -> {s:box,st:ts,m:box,mt:ts,c,w,t}
let S=Object.assign({bands:['C1'],by:'L',letters:[],pages:[],len:'10',incRec:true,voice:'',rate:'0.85'},lsGet(SKEY)||{});
function saveAll(){lsSet(KEY,P)}
function saveS(){lsSet(SKEY,S)}
function mergeIn(o){let n=0;for(const k in o){const a=P[k],b=o[k];if(!a||(b.t||0)>(a.t||0)){P[k]=b;n++}}return n}


// ---------- spaced repetition ----------
const DAY=864e5,IV=[0,0,DAY*.5,DAY*2,DAY*5,DAY*14,DAY*30];
const rec=id=>P[id]||(P[id]={s:0,st:0,m:0,mt:0,c:0,w:0,t:0});
const hasSpell=w=>!!w.sp;
function level(w){const p=P[w.id];if(!p||(!p.c&&!p.w))return 'n';
 const lv=hasSpell(w)?Math.min(p.s,p.m):p.m;
 if(lv>=4)return 'm';if(lv>=2)return 's';return 'l'}
const LV={n:'חדשה',l:'בלמידה',s:'כמעט',m:'שולטת'};
function weight(w,skill){const p=P[w.id];if(!p)return 6;
 const box=p[skill],ts=p[skill+'t']||0;
 if(!ts)return 6;
 const due=Date.now()-ts>=IV[box];
 if(box===0)return 10;
 if(!due)return box>=4?0.08:0.4;
 return Math.max(1,7-box);}
function grade(w,skill,ok,hint){const p=rec(w.id);
 if(ok){p.c++;if(!hint)p[skill]=Math.min(6,p[skill]+1)}else{p.w++;p[skill]=Math.max(0,p[skill]-2)}
 p[skill+'t']=Date.now();p.t=Date.now();saveAll()}

// ---------- selection ----------
function pool(){return W.filter(w=>S.bands.includes(w.b)&&(S.by==='L'?(!S.letters.length||S.letters.includes(w.L)):(!S.pages.length||S.pages.includes(w.b+':'+w.pg))))}
function counts(list){const c={n:0,l:0,s:0,m:0};list.forEach(w=>c[level(w)]++);return c}
function miniBar(c,t){return `<span class="mini">${[['m','var(--green)'],['s','#7fd8a7'],['l','var(--amber)']].map(([k,col])=>`<i style="width:${t?c[k]/t*100:0}%;background:${col}"></i>`).join('')}</span>`}

function renderGlobal(){const c=counts(W),t=W.length;
 $('#gbar').innerHTML=[['m','c-m'],['s','c-s'],['l','c-l'],['n','c-n']].map(([k,cl])=>`<i class="${cl}" style="width:${c[k]/t*100}%"></i>`).join('');
 $('#glegend').innerHTML=[['m','c-m','שולטת'],['s','c-s','כמעט'],['l','c-l','בלמידה'],['n','c-n','עוד לא תרגלתי']].map(([k,cl,l])=>`<span><span class="dot ${cl}"></span>${l} ${c[k]}</span>`).join('');}

function renderBands(){$('#bands').innerHTML=BANDS.map(([k,l])=>`<button class="chip" data-b="${k}" aria-pressed="${S.bands.includes(k)}">${l} <span class="muted" style="color:inherit;opacity:.75">· ${byBand[k].length}</span></button>`).join('')}
function renderPicker(){
 $('#byL').setAttribute('aria-pressed',S.by==='L');$('#byP').setAttribute('aria-pressed',S.by==='P');
 $('#pickhint').textContent=S.by==='L'?'אפשר לבחור כמה אותיות יחד. בלי בחירה = כל האותיות':'כל עמוד = 20 מילים לפי סדר הרשימה המקורית. בלי בחירה = הכול';
 const inB=W.filter(w=>S.bands.includes(w.b));
 if(S.by==='L'){
  const L='abcdefghijklmnopqrstuvwxyz'.split('');
  $('#picker').innerHTML='<div class="letters">'+L.map(l=>{const ws=inB.filter(w=>w.L===l),c=counts(ws);
   return `<button class="tile" data-l="${l}" aria-pressed="${S.letters.includes(l)}" ${ws.length?'':'disabled'}><b class="en">${l.toUpperCase()}</b><span>${ws.length}</span>${miniBar(c,ws.length)}</button>`}).join('')+'</div>';
 }else{
  $('#picker').innerHTML=BANDS.filter(([k])=>S.bands.includes(k)).map(([k,lab])=>{const ws=byBand[k],n=Math.ceil(ws.length/PAGE);
   let h=`<p class="muted" style="margin:10px 0 6px">${lab}</p><div class="pages">`;
   for(let p=1;p<=n;p++){const pw=ws.filter(w=>w.pg===p),c=counts(pw),key=k+':'+p;
    h+=`<button class="tile" data-p="${key}" aria-pressed="${S.pages.includes(key)}"><b>עמוד ${p}</b><span class="en">${esc(pw[0].e.slice(0,14))} – ${esc(pw[pw.length-1].e.slice(0,14))}</span>${miniBar(c,pw.length)}</button>`}
   return h+'</div>'}).join('')||'<p class="muted">בחרי רצועה למעלה.</p>';
 }
 const pl=pool(),c=counts(pl);
 $('#selcount').textContent=`${pl.length} מילים נבחרו`;
 $('#selbreak').textContent=`${c.n} חדשות · ${c.l} בלמידה · ${c.s} כמעט · ${c.m} שולטת`;
 renderModes();
}
const MODES=[
 {k:'dict',t:'הכתבה',d:'שומעים את המילה וכותבים אותה באנגלית',i:'dict'},
 {k:'en2he',t:'תרגום לעברית',d:'מילה באנגלית – בוחרים את הפירוש',i:'tr'},
 {k:'he2en',t:'תרגום לאנגלית',d:'מילה בעברית – כותבים באנגלית',i:'rev'},
 {k:'story',t:'השלמה בסיפור',d:'קטע קצר עם חסרים – משלימים מבנק מילים',i:'story'},
 {k:'mix',t:'אימון משולב',d:'כל הסוגים מעורבבים',i:'mix'},
 {k:'weak',t:'המילים החלשות שלי',d:'רק מילים שטעיתי בהן ועוד לא נקלטו',i:'weak'}];
function renderModes(){const pl=pool();const weakN=pl.filter(isWeak).length;
 $('#modes').innerHTML=MODES.map(m=>{let extra='';if(m.k==='weak')extra=` (${weakN})`;
  const dis=!pl.length||(m.k==='weak'&&!weakN);
  return `<button class="mode${m.k==='weak'?' weak':''}" data-m="${m.k}" ${dis?'disabled style="opacity:.45"':''}>${ICON[m.i]}<b>${m.t}${extra}</b><span>${m.d}</span></button>`}).join('')}
const isWeak=w=>{const p=P[w.id];return p&&p.w>0&&level(w)!=='m'&&level(w)!=='s'};

// ---------- speech ----------
let voices=[],ttsNS=null;
function loadVoices(){if(!('speechSynthesis'in window))return;voices=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));
 const sel=$('#voice');sel.innerHTML='<option value="">אוטומטי (אנגלית)</option>'+voices.map(v=>`<option value="${esc(v.name)}" ${v.name===S.voice?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
 $('#voicenote').textContent=voices.length?'':'לא נמצאו קולות אנגלית בדפדפן הזה – נסי דפדפן אחר (Chrome / Edge / Safari).'}
if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function pickVoice(){if(!voices.length)return null;return voices.find(v=>v.name===S.voice)||voices.find(v=>/en[-_]US/i.test(v.lang)&&/Google|Samantha|Natural|Aria|Jenny/i.test(v.name))||voices.find(v=>/en[-_]US/i.test(v.lang))||voices[0]}
function speak(text,slow,btn){const rate=+S.rate*(slow?0.7:1);
 const clean=text.replace(/\s*\/\s*/g,' or ');
 btn&&btn.classList.add('playing');const done=()=>btn&&btn.classList.remove('playing');
 const viaTts=()=>{if(!ttsNS){done();toast('אין קול זמין בדפדפן הזה');return}};
 if('speechSynthesis'in window&&(voices.length||!ttsNS)){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(clean);const v=pickVoice();if(v)u.voice=v;u.lang=v?v.lang:'en-US';u.rate=rate;
  let started=false;u.onstart=()=>started=true;u.onend=u.onerror=done;speechSynthesis.speak(u);
  setTimeout(()=>{if(!started&&!speechSynthesis.speaking&&ttsNS)viaTts()},1500);return}catch(e){}}
 viaTts()}

// ---------- answer checking ----------
const norm=s=>s.toLowerCase().replace(/[’‘`´]/g,"'").replace(/[.!?,;:"]/g,'').replace(/\s+/g,' ').trim();
function accept(w){const set=new Set(w.sp.map(norm));
 w.sp.forEach(x=>{if(/^(the|a|an) /i.test(x))set.add(norm(x.replace(/^(the|a|an) /i,'')))});return set}
function diffHtml(user,right){const a=norm(user),b=right;const bn=b.toLowerCase();
 const n=a.length,m=bn.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===bn[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,out='';while(j<m){if(i<n&&a[i]===bn[j]){out+=esc(b[j]);i++;j++}else if(i<n&&dp[i+1][j]>=dp[i][j+1])i++;else{out+='<i>'+esc(b[j])+'</i>';j++}}return out}

// ---------- session ----------
let Q=null;
function wsample(list,n,wfn){const items=list.map(w=>({w,k:Math.pow(Math.random(),1/Math.max(.001,wfn(w)))}));items.sort((x,y)=>y.k-x.k);return items.slice(0,n).map(x=>x.w)}
const canDict=w=>hasSpell(w)&&(S.incRec||w.rp!=='Rec');
const canStory=w=>w.cl&&w.cl.length<=24;
function start(mode){
 let pl=pool();if(mode==='weak')pl=pl.filter(isWeak);
 const n=S.len==='999'?pl.length:+S.len;
 let items=[];
 if(mode==='story'){pl=pl.filter(canStory);if(!pl.length)return toast('אין מספיק משפטים בבחירה הזו');
  const ws=wsample(pl,Math.min(n,pl.length),w=>weight(w,'m'));
  for(let i=0;i<ws.length;i+=5)items.push({kind:'story',ws:ws.slice(i,i+5)});
 }else{
  if(mode==='dict'){pl=pl.filter(canDict);if(!pl.length)return toast('אין בבחירה מילים להכתבה')}
  const sk=mode==='dict'?'s':mode==='mix'||mode==='weak'?null:'m';
  const ws=wsample(pl,Math.min(n,pl.length),w=>sk?weight(w,sk):Math.max(weight(w,'s'),weight(w,'m')));
  items=ws.map(w=>({kind:mode==='mix'||mode==='weak'?pickKind(w):mode,w}));
 }
 Q={mode,items,i:0,ok:0,bad:0,results:[],retry:new Set()};
 show('play');renderQ();
}
function pickKind(w){const opts=['en2he','he2en'];if(canDict(w))opts.push('dict','dict');
 const p=P[w.id];if(p&&canDict(w)&&p.s<p.m)opts.push('dict');return opts[rnd(opts.length)]}
const kindName={dict:'הכתבה',en2he:'תרגום לעברית',he2en:'תרגום לאנגלית',story:'השלמה בסיפור'};
function topHtml(){const tot=Q.items.length;return `<div class="ptop"><span class="kind">${kindName[Q.items[Q.i].kind]}</span><div class="prog"><i style="width:${Q.i/tot*100}%"></i></div><span class="muted">${Q.i+1} / ${tot}</span><button class="link" id="quit">סיום</button></div>`}
function renderQ(){
 if(Q.i>=Q.items.length)return summary();
 const it=Q.items[Q.i];it.hint=false;it.done=false;
 const pg=$('#page');
 if(it.kind==='dict'){const w=it.w;
  pg.innerHTML=topHtml()+`<div class="q"><button class="speak" id="say" aria-label="השמעת המילה">${ICON.spk}</button>
  <div class="row"><button class="speak sm" id="slow">${ICON.spk}לאט</button>${w.s?`<button class="speak sm" id="sent">${ICON.spk}במשפט</button>`:''}<button class="speak sm" id="hint">רמז</button></div>
  <div class="hintbox" id="hb"></div>
  <input class="ans en" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" dir="ltr" lang="en" aria-label="כתבי את המילה ששמעת">
  <div id="fb"></div><div class="actions"><button class="btn" id="go">בדיקה</button><button class="btn ghost" id="skip">לא יודעת</button></div></div>`;
  const sayit=()=>speak(w.sp[0],false,$('#say'));
  $('#say').onclick=sayit;$('#slow').onclick=e=>speak(w.sp[0],true,e.currentTarget);
  if(w.s)$('#sent').onclick=e=>speak(w.s.replace(/\*/g,''),false,e.currentTarget);
  let hn=0;$('#hint').onclick=()=>{it.hint=true;hn++;const h=[`פירוש: ${w.he}`,`מתחילה ב- "${w.sp[0][0]}" · ${w.sp[0].replace(/\s/g,'').length} אותיות`];$('#hb').innerHTML=esc(h.slice(0,hn).join(' · '))};
  setTimeout(sayit,250);
  bindAnswer(()=>{const v=$('#ans').value;if(!v.trim())return null;const ok=accept(w).has(norm(v));
   let capNote='';if(ok&&/[A-Z]/.test(w.sp[0])&&v.trim()[0]!==w.sp[0][0])capNote='<br><span class="muted">שימי לב: באנגלית כותבים את המילה הזו באות גדולה – '+esc(w.sp[0])+'</span>';
   finish(w,'s',ok,v,capNote)});
 }
 else if(it.kind==='en2he'){const w=it.w;const opts=distract(w,'he');
  pg.innerHTML=topHtml()+`<div class="q"><div class="qword en">${esc(w.e)}</div><button class="speak sm" id="say">${ICON.spk}השמעה</button>
  ${w.pos?`<div class="muted" style="margin-top:6px">${esc(w.pos)}</div>`:''}
  <div class="choices">${opts.map((o,i)=>`<button class="choice" data-i="${i}"><span class="k">${i+1}</span>${esc(o.he)}</button>`).join('')}</div><div id="fb"></div><div class="actions" id="nextrow"></div></div>`;
  $('#say').onclick=e=>speak(w.sp?w.sp[0]:w.e,false,e.currentTarget);
  bindChoices(opts,w,'m',o=>o.he);
 }
 else if(it.kind==='he2en'){const w=it.w;
  if(hasSpell(w)){
   pg.innerHTML=topHtml()+`<div class="q"><div class="qhe">${esc(w.he)}</div>${w.pos?`<div class="muted">${esc(w.pos)}</div>`:''}
   <div class="hintbox" id="hb"></div><input class="ans en" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" dir="ltr" lang="en" aria-label="כתבי באנגלית">
   <div id="fb"></div><div class="actions"><button class="btn" id="go">בדיקה</button><button class="speak sm" id="hint">רמז</button><button class="btn ghost" id="skip">לא יודעת</button></div></div>`;
   $('#hint').onclick=()=>{it.hint=true;$('#hb').innerHTML='מתחילה ב- <span class="en">'+esc(w.sp[0].slice(0,2))+'…</span>';if(w.s)$('#hb').innerHTML+='<br><span class="en">'+esc(w.s.replace(/\*[^*]+\*/,'____'))+'</span>'};
   bindAnswer(()=>{const v=$('#ans').value;if(!v.trim())return null;finish(w,'m',accept(w).has(norm(v)),v,'')});
  }else{const opts=distract(w,'e');
   pg.innerHTML=topHtml()+`<div class="q"><div class="qhe">${esc(w.he)}</div><div class="choices">${opts.map((o,i)=>`<button class="choice en" data-i="${i}"><span class="k">${i+1}</span>${esc(o.e)}</button>`).join('')}</div><div id="fb"></div><div class="actions" id="nextrow"></div></div>`;
   bindChoices(opts,w,'m',o=>o.e);
  }
 }
 else if(it.kind==='story')renderStory(it);
 const q=$('#quit');if(q)q.onclick=summary;
 const a=$('#ans');if(a)setTimeout(()=>a.focus(),60);
}
function distract(w,field){const same=W.filter(x=>x.id!==w.id&&x.he!==w.he&&x.e!==w.e&&norm(x.e)!==norm(w.e));
 const pref=same.filter(x=>x.b===w.b&&x.pos&&w.pos&&x.pos.split(',')[0]===w.pos.split(',')[0]);
 const src=pref.length>=6?pref:same;const out=[w],seen=new Set([w[field]]);
 while(out.length<4){const x=src[rnd(src.length)];if(!seen.has(x[field])){seen.add(x[field]);out.push(x)}}return shuffle(out)}
function bindChoices(opts,w,skill,lab){
 const pick=i=>{const it=Q.items[Q.i];if(it.done)return;const ok=opts[i].id===w.id;
  document.querySelectorAll('.choice').forEach((b,j)=>{if(opts[j].id===w.id)b.classList.add('ok');else if(j===i)b.classList.add('bad');b.disabled=true});
  finish(w,skill,ok,ok?'':lab(opts[i]),'',true)};
 document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>pick(+b.dataset.i));
 keyH=e=>{if(/^[1-4]$/.test(e.key)&&!Q.items[Q.i].done)pick(+e.key-1)};
}
let keyH=null;
document.addEventListener('keydown',e=>{if(!Q||$('#v-play').classList.contains('hidden'))return;
 const it=Q.items[Q.i];if(it&&it.done&&e.key==='Enter'){e.preventDefault();next();return}
 if(keyH)keyH(e)});
function bindAnswer(check){keyH=null;
 const run=()=>{const it=Q.items[Q.i];if(it.done)return next();check()};
 $('#go').onclick=run;$('#ans').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();run()}});
 $('#skip').onclick=()=>{const it=Q.items[Q.i];if(!it.done)finish(it.w,it.kind==='dict'?'s':'m',false,'','')}}
function finish(w,skill,ok,given,extra,isChoice){const it=Q.items[Q.i];it.done=true;
 grade(w,skill,ok,it.hint);
 if(ok)Q.ok++;else{Q.bad++;if(!Q.retry.has(w.id)&&Q.items.length<200){Q.retry.add(w.id);Q.items.splice(Math.min(Q.items.length,Q.i+4),0,{kind:it.kind,w})}}
 Q.results.push({w,ok});
 const a=$('#ans');if(a){a.classList.add(ok?'ok':'bad');a.readOnly=true}
 const right=w.sp?w.sp[0]:w.e;
 let h;
 if(ok)h=`<div class="fb ok"><b>${['מצוין!','נכון!','יפה מאוד!','בדיוק!'][rnd(4)]}</b> <span class="en">${esc(right)}</span> – ${esc(w.he)}${it.hint?'<br><span class="muted">עם רמז – המילה תחזור שוב בקרוב</span>':''}${extra}</div>`;
 else h=`<div class="fb bad">${given&&!isChoice?`כתבת: <span class="en" style="text-decoration:line-through;opacity:.7;font-size:22px">${esc(given)}</span><br>`:''}${isChoice?'':'הנכון: '}<span class="en diff">${given&&!isChoice&&w.sp?diffHtml(given,right):esc(right)}</span><br>${esc(w.he)}${w.s?`<br><span class="en" style="font-size:18px">${esc(w.s.replace(/\*/g,''))}</span>`:''}<br><span class="muted">המילה תחזור עוד מעט באימון הזה</span></div>`;
 $('#fb').innerHTML=h;
 if(!isChoice||true){const g=$('#go');if(g){g.textContent='הבאה ←';g.focus()}else{$('#nextrow').innerHTML='<button class="btn" id="go">הבאה ←</button>';$('#go').onclick=next;$('#go').focus()}}
 const sk=$('#skip');if(sk)sk.remove();
 if(!ok&&it.kind==='dict')setTimeout(()=>speak(right,true),300);
}
function next(){Q.i++;renderQ()}

// ---------- story ----------
const NAMES=['Noa’s busy day','A day with Max','At Grandma’s house','The school trip','A rainy Sunday','Tom’s surprise'];
function renderStory(it){
 const ws=it.ws;it.done=false;
 const parts=ws.map((w,i)=>esc(w.s).replace(/\*([^*]+)\*/,()=>`<input class="blank" data-i="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:${Math.max(5,w.cl.length+2)}ch" aria-label="מילה חסרה ${i+1}">`));
 const bank=shuffle(ws.map((w,i)=>({t:w.cl,i})));
 $('#page').innerHTML=`<div class="ptop"><span class="kind">השלמה בסיפור</span><div class="prog"><i style="width:${Q.i/Q.items.length*100}%"></i></div><span class="muted">קטע ${Q.i+1} / ${Q.items.length}</span><button class="link" id="quit">סיום</button></div>
 <p class="muted" style="text-align:center;margin:4px 0 0">השלימי את המילים החסרות. אפשר להקליד או ללחוץ על מילה מהבנק (היא תיכנס לחסר המסומן).</p>
 <div class="story"><h3>${NAMES[rnd(NAMES.length)]}</h3>${parts.join(' ')}</div>
 <div class="bank" id="bank">${bank.map(b=>`<button data-t="${esc(b.t)}">${esc(b.t)}</button>`).join('')}</div>
 <div class="row"><label class="ck"><input type="checkbox" id="hidebank"> אתגר: להסתיר את בנק המילים</label></div>
 <div id="fb"></div><div class="actions"><button class="btn" id="go">בדיקה</button><button class="speak sm" id="readst">${ICON.spk}הקראת הסיפור</button></div>`;
 $('#quit').onclick=summary;
 let focused=null;const blanks=[...document.querySelectorAll('.blank')];
 blanks.forEach(b=>{b.onfocus=()=>focused=b;b.oninput=syncBank;b.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();$('#go').click()}}});
 function syncBank(){const used=blanks.map(b=>norm(b.value));const cnt={};used.forEach(u=>cnt[u]=(cnt[u]||0)+1);
  document.querySelectorAll('#bank button').forEach(bt=>{const k=norm(bt.dataset.t);if(cnt[k]){bt.classList.add('used');cnt[k]--}else bt.classList.remove('used')})}
 document.querySelectorAll('#bank button').forEach(bt=>bt.onclick=()=>{if(it.done)return;let t=focused&&!focused.value?focused:blanks.find(b=>!b.value)||focused;if(!t)return;t.value=bt.dataset.t;syncBank();const nx=blanks.find(b=>!b.value);(nx||t).focus()});
 $('#hidebank').onchange=e=>$('#bank').classList.toggle('hidden',e.target.checked);
 $('#readst').onclick=e=>speak(ws.map(w=>w.s.replace(/\*/g,'')).join(' '),false,e.currentTarget);
 $('#go').onclick=()=>{if(it.done)return next();let nOk=0;
  blanks.forEach((b,i)=>{const w=ws[i],ok=norm(b.value)===norm(w.cl);b.readOnly=true;b.classList.add(ok?'ok':'bad');
   if(!ok)b.insertAdjacentHTML('afterend',`<span class="fix">(${esc(w.cl)})</span>`);
   grade(w,'m',ok,false);Q.results.push({w,ok});ok?(Q.ok++,nOk++):Q.bad++});
  it.done=true;
  $('#fb').innerHTML=`<div class="fb ${nOk===ws.length?'ok':'bad'}"><b>${nOk} מתוך ${ws.length} נכונות</b>${nOk<ws.length?'<br>'+ws.filter((w,i)=>norm(blanks[i].value)!==norm(w.cl)).map(w=>`<span class="en" style="font-size:20px">${esc(w.cl)}</span> – ${esc(w.he)}`).join('<br>'):''}</div>`;
  $('#go').textContent='הבאה ←';$('#go').focus()};
 keyH=null;setTimeout(()=>blanks[0]&&blanks[0].focus(),60);
}

// ---------- summary ----------
function summary(){if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch(e){}
 const tot=Q.ok+Q.bad;const pct=tot?Math.round(Q.ok/tot*100):0;
 const last={};Q.results.forEach(r=>{last[r.w.id]=last[r.w.id]||{w:r.w,ok:true};if(!r.ok)last[r.w.id].ok=false});
 const list=Object.values(last).sort((a,b)=>a.ok-b.ok);
 $('#page').innerHTML=`<div class="sum"><div class="muted">סיכום האימון</div><div class="big">${pct}%</div><p style="font-size:18px">${Q.ok} נכונות · ${Q.bad} טעויות</p>
 <p class="muted">${pct>=90?'וואו! המילים האלה כבר כמעט בכיס.':pct>=70?'יפה מאוד – עוד סבב קצר על הטעויות?':'כל טעות היא תרגול. המילים שטעית בהן יחזרו יותר.'}</p>
 <div class="actions"><button class="btn" id="again">עוד סבב</button><button class="btn ghost" id="home">חזרה לבחירה</button>${list.some(x=>!x.ok)?'<button class="btn ghost" id="weakbtn">רק הטעויות</button>':''}</div>
 <div class="reslist">${list.map(x=>`<div class="res ${x.ok?'':'bad'}"><span class="en">${esc(x.w.sp?x.w.sp[0]:x.w.e)}</span><span>${esc(x.w.he)}</span><span class="st ${level(x.w)}">${LV[level(x.w)]}</span></div>`).join('')}</div></div>`;
 const mode=Q.mode;$('#again').onclick=()=>start(mode);$('#home').onclick=()=>{show('home')};
 const wb=$('#weakbtn');if(wb)wb.onclick=()=>{const ids=list.filter(x=>!x.ok).map(x=>x.w);
  Q={mode,items:shuffle(ids).map(w=>({kind:mode==='story'?'en2he':(mode==='mix'||mode==='weak')?pickKind(w):(mode==='dict'&&!canDict(w)?'en2he':mode),w})),i:0,ok:0,bad:0,results:[],retry:new Set()};renderQ()};
 keyH=null;Q.items.length=Q.i;refreshAll();
}

// ---------- words table ----------
let wf='all';
function renderWords(){const q=norm($('#wsearch').value||'');
 let ws=pool().filter(w=>wf==='all'||(wf==='weak'?(P[w.id]&&P[w.id].w>0):level(w)===wf||(wf==='l'&&level(w)==='s')));
 if(q)ws=ws.filter(w=>norm(w.e).includes(q)||w.he.includes($('#wsearch').value.trim()));
 const box=n=>`<span class="boxes">${[1,2,3,4].map(k=>`<i class="${n>=k?'on':''}"></i>`).join('')}</span>`;
 const shown=ws.slice(0,400);
 $('#wtable tbody').innerHTML=shown.map(w=>{const p=P[w.id]||{s:0,m:0,c:0,w:0};const lv=level(w);
  return `<tr><td class="en">${esc(w.e)}</td><td>${esc(w.he)}</td><td>${w.b==='P'?'Pre':w.b==='C1'?'Core I':'Core II'} · עמ' ${w.pg}</td><td>${w.sp?box(p.s):'—'}</td><td>${box(p.m)}</td><td><span class="st ${lv}">${LV[lv]}</span>${p.w?` <span class="muted">(${p.w} טעויות)</span>`:''}</td><td><button class="speak sm" data-say="${w.id}" aria-label="השמעה">${ICON.spk}</button></td></tr>`}).join('')||'<tr><td colspan="7" class="muted">אין מילים בסינון הזה.</td></tr>';
 $('#wmore').textContent=ws.length>400?`מוצגות 400 מתוך ${ws.length}. צמצמי את הבחירה או חפשי.`:`${ws.length} מילים`;
}
$('#wtable').addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){const w=W[+b.dataset.say];speak(w.sp?w.sp[0]:w.e,false,b)}});
$('#wfilter').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;wf=b.dataset.f;document.querySelectorAll('#wfilter button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderWords()});
$('#wsearch').oninput=renderWords;

// ---------- settings ----------
function renderSaveNote(){const el=$('#savenote');if(!el)return;
 el.textContent='ההתקדמות נשמרת בדפדפן הזה במכשיר הזה. כדי להעביר אותה למכשיר אחר, השתמשי בגיבוי שלמטה.';
 $('#bk').value=JSON.stringify({v:1,p:P})}
$('#bkcopy').onclick=async()=>{const t=JSON.stringify({v:1,p:P});$('#bk').value=t;try{await navigator.clipboard.writeText(t);toast('הגיבוי הועתק')}catch(e){$('#bk').select();toast('סמני והעתיקי את הקוד')}};
$('#bkload').onclick=()=>{try{const o=JSON.parse($('#bk').value);if(!o||!o.p)throw 0;const n=mergeIn(o.p);saveAll();refreshAll();toast(`שוחזרו ${n} מילים`)}catch(e){toast('הקוד לא תקין')}};
$('#reset').onclick=()=>$('#resetconfirm').classList.remove('hidden');
$('#resetno').onclick=()=>$('#resetconfirm').classList.add('hidden');
$('#resetyes').onclick=()=>{P={};saveAll();$('#resetconfirm').classList.add('hidden');refreshAll();toast('ההתקדמות אופסה')};
$('#voice').onchange=e=>{S.voice=e.target.value;saveS()};
$('#rate').value=S.rate;$('#rate').onchange=e=>{S.rate=e.target.value;saveS()};
$('#testv').onclick=e=>speak('Hello! Let us practice spelling. Beautiful.',false,e.currentTarget);

// ---------- nav & events ----------
function show(v){['home','play','words','settings'].forEach(k=>$('#v-'+k).classList.toggle('hidden',k!==v));
 document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v||(v==='play'&&b.dataset.view==='home')));
 if(v==='words')renderWords();if(v==='settings')renderSaveNote();if(v==='home')refreshAll();window.scrollTo({top:0})}
document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{if(b.dataset.view==='home'&&Q&&!$('#v-play').classList.contains('hidden')&&Q.i<Q.items.length)return summary();show(b.dataset.view)});
$('#bands').onclick=e=>{const b=e.target.closest('[data-b]');if(!b)return;const k=b.dataset.b;
 S.bands=S.bands.includes(k)?S.bands.filter(x=>x!==k):[...S.bands,k];if(!S.bands.length)S.bands=[k];
 S.pages=S.pages.filter(p=>S.bands.includes(p.split(':')[0]));saveS();renderBands();renderPicker()};
$('#byL').onclick=()=>{S.by='L';saveS();renderPicker()};$('#byP').onclick=()=>{S.by='P';saveS();renderPicker()};
$('#picker').onclick=e=>{const t=e.target.closest('.tile');if(!t||t.disabled)return;
 if(t.dataset.l){const l=t.dataset.l;S.letters=S.letters.includes(l)?S.letters.filter(x=>x!==l):[...S.letters,l]}
 else{const p=t.dataset.p;S.pages=S.pages.includes(p)?S.pages.filter(x=>x!==p):[...S.pages,p]}
 saveS();renderPicker()};
$('#clearsel').onclick=()=>{if(S.by==='L')S.letters=[];else S.pages=[];saveS();renderPicker()};
$('#modes').onclick=e=>{const b=e.target.closest('[data-m]');if(b&&!b.disabled)start(b.dataset.m)};
$('#len').value=S.len;$('#len').onchange=e=>{S.len=e.target.value;saveS()};
$('#incRec').checked=S.incRec;$('#incRec').onchange=e=>{S.incRec=e.target.checked;saveS()};
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
function refreshAll(){renderGlobal();renderBands();renderPicker()}
refreshAll();renderSaveNote();
}
