const API='https://hook.eu1.make.com/lvcjs5jchwwatu6m851i8xm5tjwd3s1o';
const names={d:['Dashboard','Operacyjne centrum DotacjaPlus'],i:['AI Inbox','Szkice czekające na decyzję operatora'],l:['CRM','Ostatnia zweryfikowana wersja danych z rozmów'],u:['System','Stan automatyzacji produkcyjnej']};
let events=[],decisions=new Map(),clients=[],currentEvent=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(v,fallback='brak danych')=>v===null||v===undefined||v===''?fallback:String(v);
const money=v=>{if(v===null||v===undefined||v==='')return 'brak danych';const n=Number(String(v).replace(/[^0-9.,-]/g,'').replace(',','.'));return Number.isFinite(n)?new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(n)+' zł':String(v)};
function decode64(value){if(!value)return '';try{const clean=String(value).replace(/\s/g,'');const bytes=Uint8Array.from(atob(clean),c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}catch{return ''}}
function jsonSafeForMake(text){return JSON.stringify(String(text??'')).slice(1,-1)}
function humanize(k){return String(k).replace(/_/g,' ').replace(/^./,m=>m.toUpperCase())}
function go(v){document.querySelectorAll('.view').forEach(e=>e.classList.remove('on'));document.querySelectorAll('.nav button').forEach(e=>e.classList.toggle('on',e.dataset.v===v));$(v).classList.add('on');$('t').textContent=names[v][0];$('sub').textContent=names[v][1]}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),2600)}
function setConnected(on,meta=''){ $('sideDot').classList.toggle('live',on);$('sideState').textContent=on?'Połączono':'Rozłączono';$('healthState').textContent=on?'LIVE':'OFF';$('healthMeta').textContent=meta|| (on?'Make + CRM dostępne':'brak połączenia');$('connect').textContent=on?'Zmień klucz':'Połącz panel';$('refresh').disabled=!on }
function key(){return sessionStorage.getItem('flowpilot_operator_key')||''}
async function api(params,method='GET',mode='json'){
  const authKey=key();
  let res;
  if(method==='GET')res=await fetch(API+'?'+new URLSearchParams({...params,key:authKey}),{cache:'no-store'});
  else res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,key:authKey}),cache:'no-store'});
  if(!res.ok){const txt=await res.text().catch(()=> '');if(res.status===401)throw new Error('Nieprawidłowy klucz operatora');throw new Error(txt||('Błąd API '+res.status))}
  if(mode==='text')return res.text();
  const text=await res.text();
  try{return JSON.parse(text)}catch{throw new Error('Backend zwrócił nieprawidłową odpowiedź')}
}
function parseEvent(issue){
  try{
    const raw=JSON.parse(decode64(issue.body));
    const clientId=decode64(raw.messenger_id_b64)||raw.card?.messenger_id||'';
    return {issue,eventId:raw.event_id||String(issue.title||'').replace(/^DPCRM\s+/,'').trim(),clientId,mid:decode64(raw.mid_b64),timestamp:raw.timestamp,receivedAt:raw.received_at||'',message:decode64(raw.message_b64),draft:decode64(raw.draft_b64),card:raw.card||{},raw};
  }catch{return null}
}
function parseDecision(issue){
  const eventId=String(issue.title||'').replace(/^DPDECISION\s+/,'').trim();
  const body=String(issue.body||'');
  const status=(body.match(/(?:^|;)status=([^;]+)/)||[])[1]||'';
  const draftB64=(body.match(/(?:^|;)draft_b64=([^;]+)/)||[])[1]||'';
  return eventId?{eventId,status,draft:decode64(draftB64)}:null;
}
function statusOf(e){return decisions.get(e.eventId)?.status||'DO AKCEPTACJI'}
function displayName(e){const c=e.card||{};return c.imie_nazwisko||c.nazwa_klienta||c.firma||c.nazwa_firmy||c.id_klienta||('Klient '+maskId(e.clientId))}
function maskId(id){const s=String(id||'');return s.length>7?'••••'+s.slice(-5):(s||'Messenger')}
function locationOf(c){return c.lokalizacja||c.miasto||c.wojewodztwo||c.region||'brak danych'}
function investmentOf(c){return c.wartosc_inwestycji??c.wartość_inwestycji??c.budzet??c.planowana_wartosc_inwestycji??null}
function salesStatus(c,e){return c.status_sprzedazy||c.status_realizacji||c.status_odpowiedzi||statusOf(e)}
function nextStep(c){return c.nastepny_krok||c['następny_krok']||c.cel_nastepnej_rozmowy||'do ustalenia'}
function buildClients(){
  const map=new Map();
  for(const e of events){const id=e.clientId||e.card?.messenger_id||e.card?.id_klienta||e.eventId;if(!map.has(id))map.set(id,{id,event:e,card:e.card})}
  clients=[...map.values()];
}
function render(){
  buildClients();
  $('msgCount').textContent=events.length;$('pendingCount').textContent=events.filter(e=>statusOf(e)==='DO AKCEPTACJI').length;$('clientCount').textContent=clients.length;
  $('recentList').innerHTML=events.length?events.slice(0,6).map(e=>`<div class="listItem" data-event="${esc(e.eventId)}"><b>${esc(displayName(e))}</b><div class="meta">${esc(e.message.slice(0,100)||'Brak treści')} · ${esc(statusOf(e))}</div></div>`).join(''):'<div class="empty">Brak zapisanych wiadomości.</div>';
  $('conversationList').innerHTML=events.length?events.map(e=>`<div class="cv${currentEvent?.eventId===e.eventId?' on':''}" data-event="${esc(e.eventId)}"><b>${esc(displayName(e))}</b><div class="meta">${esc(e.message.slice(0,74)||'Brak treści')}<br>${esc(statusOf(e))}</div></div>`).join(''):'<div class="empty">Brak rozmów.</div>';
  $('inboxMeta').textContent=`${events.length} wiadomości · ${events.filter(e=>statusOf(e)==='DO AKCEPTACJI').length} do akceptacji`;
  $('crmRows').innerHTML=clients.length?clients.map(x=>{const c=x.card,e=x.event;return `<tr><td><b>${esc(displayName(e))}</b><div class="meta">${esc(maskId(e.clientId))}</div></td><td>${esc(locationOf(c))}</td><td>${esc(money(investmentOf(c)))}</td><td>${esc(val(salesStatus(c,e)))}</td><td>${esc(val(nextStep(c)))}</td></tr>`}).join(''):'<tr><td colspan="5" class="empty">Brak kart klientów.</td></tr>';
  document.querySelectorAll('[data-event]').forEach(el=>el.onclick=()=>selectEvent(el.dataset.event));
  if(currentEvent)showEvent(currentEvent); else if(events.length)selectEvent((events.find(e=>statusOf(e)==='DO AKCEPTACJI')||events[0]).eventId); else clearEditor();
}
function clearEditor(){currentEvent=null;$('who').textContent='Wybierz rozmowę';$('leadMeta').textContent='Szczegóły klienta pojawią się tutaj.';$('clientMessage').textContent='Brak wybranej wiadomości.';$('reply').value='';$('reply').disabled=true;['send','reject','regenerate'].forEach(id=>$(id).disabled=true);$('decisionBadge').className='badge neutral';$('decisionBadge').textContent='BRAK';$('cardDetails').innerHTML=''}
function selectEvent(eventId){currentEvent=events.find(e=>e.eventId===eventId)||null;document.querySelectorAll('.cv').forEach(el=>el.classList.toggle('on',el.dataset.event===eventId));if(currentEvent)showEvent(currentEvent)}
function showEvent(e){
  const s=statusOf(e),pending=s==='DO AKCEPTACJI';$('who').textContent=displayName(e);$('leadMeta').textContent=`Messenger · ${maskId(e.clientId)} · ${e.receivedAt?new Date(e.receivedAt).toLocaleString('pl-PL'):'brak daty'}`;$('clientMessage').textContent=e.message||'Brak treści';$('reply').value=decisions.get(e.eventId)?.draft||e.draft||'';$('reply').disabled=!pending;$('send').disabled=!pending||!e.clientId;$('reject').disabled=!pending;$('regenerate').disabled=!pending;
  const badge=$('decisionBadge');badge.textContent=s;badge.className='badge '+(pending?'pending':s==='ZATWIERDZONO'?'approved':s==='ODRZUCONO'?'rejected':'neutral');
  const c=e.card||{},preferred=['status_sprzedazy','status_realizacji','status_formularza','status_platnosci','status_researchu_finansowania','rekomendowany_instrument_finansowania','lokalizacja','miasto','branza','branża','wartosc_inwestycji','budzet','mozliwa_wartosc_finansowania','poziom_ryzyka','nastepny_krok','termin_nastepnego_dzialania'];
  const entries=[];for(const k of preferred){if(k in c&&!entries.some(([x])=>x===k))entries.push([k,c[k]])}for(const [k,v] of Object.entries(c)){if(entries.length>=10)break;if(!entries.some(([x])=>x===k)&&!['ostatnia_wiadomosc_klienta','ostatni_szkic_ai','messenger_id'].includes(k))entries.push([k,v])}
  $('cardDetails').innerHTML=entries.length?entries.map(([k,v])=>`<div class="detail"><small>${esc(humanize(k))}</small><b>${esc(val(v))}</b></div>`).join(''):'<div class="detail"><small>Karta CRM</small><b>Brak dodatkowych danych.</b></div>';
  $('actionState').textContent='';$('actionState').className='actionState';
}
async function loadProduction(newKey){
  $('authError').textContent='';if(newKey)sessionStorage.setItem('flowpilot_operator_key',newKey);
  if(!key())throw new Error('Wpisz klucz operatora');
  setConnected(false,'łączenie');$('healthState').textContent='...';
  const [rawEvents,rawDecisions]=await Promise.all([api({action:'panel'}),api({action:'decisions'})]);
  decisions=new Map((Array.isArray(rawDecisions)?rawDecisions:[]).map(parseDecision).filter(Boolean).map(d=>[d.eventId,d]));
  events=(Array.isArray(rawEvents)?rawEvents:[]).map(parseEvent).filter(Boolean).sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt)));
  setConnected(true,`${events.length} rekordów CRM`);$('auth').classList.remove('on');render();return true;
}
function showAuth(){ $('operatorKey').value='';$('authError').textContent='';$('auth').classList.add('on');setTimeout(()=>$('operatorKey').focus(),60)}
async function regenerate(){if(!currentEvent)return;const state=$('actionState');state.textContent='AI przygotowuje nową wersję...';state.className='actionState';try{const text=await api({action:'edit',client_id:currentEvent.clientId,message:currentEvent.message,draft:$('reply').value},'POST','text');$('reply').value=text.trim();state.textContent='Nowa wersja gotowa. Nadal wymaga akceptacji.'}catch(e){state.textContent=e.message;state.className='actionState error'}}
async function reject(){if(!currentEvent)return;const state=$('actionState');state.textContent='Zapisywanie decyzji...';state.className='actionState';try{await api({action:'approve',event_id:currentEvent.eventId,status:'ODRZUCONO',draft:$('reply').value},'POST');decisions.set(currentEvent.eventId,{eventId:currentEvent.eventId,status:'ODRZUCONO',draft:$('reply').value});state.textContent='Odrzucono. Nic nie zostało wysłane.';render();toast('Szkic odrzucony')}catch(e){state.textContent=e.message;state.className='actionState error'}}
async function sendApproved(){
  if(!currentEvent||!currentEvent.clientId)return;const state=$('actionState'),plain=$('reply').value.trim();if(!plain){state.textContent='Szkic jest pusty.';state.className='actionState error';return}
  if(!confirm('Wysłać tę wiadomość do klienta na Messengerze?'))return;
  state.textContent='Wysyłanie do Messengera...';state.className='actionState';$('send').disabled=true;
  try{
    await api({action:'send',client_id:currentEvent.clientId,message:currentEvent.message,draft:jsonSafeForMake(plain)},'POST');
    let logged=true;try{await api({action:'approve',event_id:currentEvent.eventId,status:'ZATWIERDZONO',draft:plain},'POST')}catch{logged=false}
    decisions.set(currentEvent.eventId,{eventId:currentEvent.eventId,status:'ZATWIERDZONO',draft:plain});state.textContent=logged?'Wysłano do klienta i zapisano decyzję.':'Wysłano do klienta. Nie udało się zapisać decyzji w CRM.';if(!logged)state.className='actionState error';render();toast('Wiadomość wysłana');
  }catch(e){state.textContent='Nie wysłano: '+e.message;state.className='actionState error';$('send').disabled=false}
}

document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
$('connect').onclick=showAuth;$('refresh').onclick=()=>loadProduction().catch(e=>{setConnected(false);toast(e.message)});$('authCancel').onclick=()=>$('auth').classList.remove('on');$('authConnect').onclick=async()=>{try{await loadProduction($('operatorKey').value.trim())}catch(e){sessionStorage.removeItem('flowpilot_operator_key');$('authError').textContent=e.message;setConnected(false)}};$('operatorKey').onkeydown=e=>{if(e.key==='Enter')$('authConnect').click()};$('regenerate').onclick=regenerate;$('reject').onclick=reject;$('send').onclick=sendApproved;
if(key())loadProduction().catch(()=>{sessionStorage.removeItem('flowpilot_operator_key');setConnected(false)});else setConnected(false);
