const API='https://hook.eu1.make.com/lvcjs5jchwwatu6m851i8xm5tjwd3s1o';
const STORAGE_KEY='flowpilot_operator_key';
const names={d:['Dashboard','Najważniejsze sprawy i stan obsługi.'],i:['AI Inbox','Wiadomości wymagające decyzji operatora.'],l:['CRM','Aktualne karty klientów i historia kwalifikacji.'],u:['System','Stan kluczowych elementów automatyzacji.']};
let events=[],decisions=new Map(),updates=[],updateByClient=new Map(),clients=[],webLeads=[],currentEvent=null;
let inboxFilter='pending',decisionMode='send';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(v,fallback='Brak danych')=>v===null||v===undefined||v===''?fallback:String(v);
const normalize=s=>String(s??'').toLocaleLowerCase('pl-PL');
const money=v=>{
  if(v===null||v===undefined||v==='')return 'Brak danych';
  const n=Number(String(v).replace(/[^0-9.,-]/g,'').replace(',','.'));
  return Number.isFinite(n)?new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(n)+' zł':String(v);
};
function decode64(value){
  if(!value)return '';
  try{
    const clean=String(value).replace(/\s/g,'');
    const bytes=Uint8Array.from(atob(clean),c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }catch{return ''}
}
function jsonSafeForMake(text){return JSON.stringify(String(text??'')).slice(1,-1)}
function maskId(id){const s=String(id||'');return s.length>7?'••••'+s.slice(-5):(s||'Messenger')}
function explicitName(e){const c=e?.card||{};return c.imie_nazwisko||c.nazwa_klienta||c.nazwa_firmy||c.firma||c.imie||c.nazwa||''}
function displayName(e){return explicitName(e)||`Kontakt ${maskId(e?.clientId)}`}
function initials(e){const n=explicitName(e);if(!n)return 'K';return n.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'K'}
function humanize(k){
  const labels={
    status_sprzedazy:'Status sprzedaży',status_realizacji:'Status realizacji',status_formularza:'Status formularza',
    status_platnosci:'Status płatności',status_researchu_finansowania:'Status researchu',
    rekomendowany_instrument_finansowania:'Rekomendowany instrument',lokalizacja:'Lokalizacja',miasto:'Miasto',
    wojewodztwo:'Województwo',branza:'Branża','branża':'Branża',cel_inwestycji:'Cel inwestycji',
    wartosc_inwestycji:'Wartość inwestycji','wartość_inwestycji':'Wartość inwestycji',wartosc_planowanej_inwestycji:'Wartość planowanej inwestycji',
    budzet:'Budżet',oczekiwana_kwota_finansowania:'Oczekiwane finansowanie',mozliwa_wartosc_finansowania:'Możliwe finansowanie',
    poziom_ryzyka:'Poziom ryzyka',nastepny_krok:'Następny krok',termin_nastepnego_dzialania:'Termin działania',
    data_kolejnego_follow_upu:'Kolejny follow-up',cel_nastepnej_rozmowy:'Cel następnej rozmowy',
    potencjalna_wartosc_zlecenia:'Potencjalna wartość zlecenia',termin_inwestycji:'Termin inwestycji',
    etap_dzialalnosci:'Etap działalności',status_zawodowy:'Status zawodowy',prawdopodobienstwo_sprzedazy:'Prawdopodobieństwo sprzedaży',
    wspolpraca_potwierdzona:'Współpraca potwierdzona',formularz_otrzymany:'Formularz otrzymany',
    formularz_kompletny:'Formularz kompletny',platnosc_wymagana:'Płatność wymagana',
    platnosc_potwierdzona:'Płatność potwierdzona',warunki_rozpoczecia_prac_spelnione:'Warunki startu prac'
  };
  return labels[k]||String(k).replace(/_/g,' ').replace(/^./,m=>m.toUpperCase());
}
function formatField(k,v){
  if(v===null||v===undefined||v==='')return 'Brak danych';
  const key=String(k).toLowerCase();
  if(/wartosc|wartość|kwota|budzet|budżet|finansowan/.test(key))return money(v);
  if(typeof v==='boolean')return v?'Tak':'Nie';
  return String(v);
}
function statusOf(e){return decisions.get(e.eventId)?.status||'DO AKCEPTACJI'}
function statusLabel(s){if(s==='DO AKCEPTACJI')return 'Do akceptacji';if(s==='ZATWIERDZONO')return 'Wysłano';if(s==='ODRZUCONO')return 'Odrzucono';return s||'Brak'}
function statusClass(s){if(s==='DO AKCEPTACJI')return 'pending';if(s==='ZATWIERDZONO')return 'approved';if(s==='ODRZUCONO')return 'rejected';return 'neutral'}
function locationOf(c){return c?.lokalizacja||c?.miasto||c?.wojewodztwo||c?.region||'Brak danych'}
function investmentOf(c){return c?.wartosc_inwestycji??c?.wartość_inwestycji??c?.wartosc_planowanej_inwestycji??c?.budzet??c?.planowana_wartosc_inwestycji??null}
function salesStatus(c,e){return c?.status_sprzedazy||c?.status_realizacji||c?.status_odpowiedzi||statusLabel(statusOf(e))}
function nextStep(c){return c?.nastepny_krok||c?.['następny_krok']||c?.cel_nastepnej_rozmowy||'Do ustalenia'}
function relativeTime(dateValue){
  if(!dateValue)return '';
  const d=new Date(dateValue); if(Number.isNaN(d.getTime()))return '';
  const diff=Date.now()-d.getTime(),min=Math.floor(diff/60000);
  if(min<1)return 'teraz'; if(min<60)return `${min} min`;
  const h=Math.floor(min/60); if(h<24)return `${h} godz.`;
  const days=Math.floor(h/24); if(days<7)return `${days} d`;
  return d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'});
}
function fullDate(dateValue){
  if(!dateValue)return 'Brak daty';
  const d=new Date(dateValue); if(Number.isNaN(d.getTime()))return 'Brak daty';
  return d.toLocaleString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function key(){return sessionStorage.getItem(STORAGE_KEY)||localStorage.getItem(STORAGE_KEY)||''}
function go(v){
  document.querySelectorAll('.view').forEach(e=>e.classList.remove('on'));
  document.querySelectorAll('.nav button').forEach(e=>e.classList.toggle('on',e.dataset.v===v));
  $(v).classList.add('on'); $('t').textContent=names[v][0]; $('sub').textContent=names[v][1];
  sessionStorage.setItem('flowpilot_view',v);
}
function toast(msg){
  const el=$('toast');el.textContent=msg;el.classList.add('on');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),2600);
}
function setConnected(on,meta=''){
  $('sideDot').classList.toggle('live',on);$('topDot').classList.toggle('live',on);$('connectionPill').classList.toggle('live',on);
  $('sideState').textContent=on?'Połączono':'Rozłączono';$('sideMeta').textContent=meta||(on?'Backend i CRM dostępne':'Backend niedostępny');
  $('topState').textContent=on?'Live':'Offline';$('healthState').textContent=on?'LIVE':'OFF';
  $('healthMeta').textContent=meta||(on?'Backend działa':'Brak połączenia z backendem');
  $('connect').textContent=on?'Zmień klucz':'Połącz panel';$('refresh').disabled=!on;
}
function setLoading(on){$('refresh').classList.toggle('spin',on);$('refresh').disabled=on||!key()}
async function api(params,method='GET',mode='json'){
  const authKey=key();let res;
  if(method==='GET')res=await fetch(API+'?'+new URLSearchParams({...params,key:authKey}),{cache:'no-store'});
  else res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,key:authKey}),cache:'no-store'});
  if(!res.ok){
    const txt=await res.text().catch(()=>'');
    if(res.status===401)throw new Error('Nieprawidłowy klucz operatora');
    throw new Error(txt||('Błąd API '+res.status));
  }
  if(mode==='text')return res.text();
  const text=await res.text();
  try{return JSON.parse(text)}catch{throw new Error('Backend zwrócił nieprawidłową odpowiedź')}
}
function parseEvent(issue){
  try{
    const raw=JSON.parse(decode64(issue.body));
    const clientId=decode64(raw.messenger_id_b64)||raw.card?.messenger_id||'';
    return{issue,eventId:raw.event_id||String(issue.title||'').replace(/^DPCRM\s+/,'').trim(),clientId,mid:decode64(raw.mid_b64),
      timestamp:raw.timestamp,receivedAt:raw.received_at||issue.created_at||'',message:decode64(raw.message_b64),
      draft:decode64(raw.draft_b64),card:raw.card||{},raw};
  }catch{return null}
}
function parseDecision(issue){
  const eventId=String(issue.title||'').replace(/^DPDECISION\s+/,'').trim(),body=String(issue.body||'');
  const status=(body.match(/(?:^|;)status=([^;]+)/)||[])[1]||'',draftB64=(body.match(/(?:^|;)draft_b64=([^;]+)/)||[])[1]||'';
  return eventId?{eventId,status,draft:decode64(draftB64)}:null;
}
function buildDecisionMap(list){const out=new Map();for(const issue of list){const d=parseDecision(issue);if(d&&!out.has(d.eventId))out.set(d.eventId,d)}return out}
function parsePairs(body){const out={};String(body||'').split(';').forEach(part=>{const i=part.indexOf('=');if(i>0)out[part.slice(0,i)]=part.slice(i+1)});return out}
function parseWebLead(issue){
  try{
    const data=parsePairs(issue.body);
    return{issue,name:decode64(data.name_b64),email:decode64(data.email_b64),company:decode64(data.company_b64),phone:decode64(data.phone_b64),
      message:decode64(data.message_b64),source:decode64(data.source_b64),receivedAt:data.received_at||issue.created_at||'',id:String(issue.title||'')};
  }catch{return null}
}
function parseUpdate(issue){
  try{
    const d=parsePairs(issue.body),clientId=decode64(d.client_id_b64);
    if(!clientId)return null;
    const textKeys=['display_name','status_sprzedazy','status_realizacji','status_formularza','status_platnosci','status_researchu_finansowania',
      'rekomendowany_instrument_finansowania','poziom_ryzyka','nastepny_krok','termin_nastepnego_dzialania','cel_nastepnej_rozmowy',
      'prawdopodobienstwo_sprzedazy','potencjalna_wartosc_zlecenia','data_kolejnego_follow_upu'];
    const fields={};
    textKeys.forEach(k=>{const v=decode64(d[k+'_b64']);if(v!=='')fields[k]=v});
    ['wspolpraca_potwierdzona','formularz_otrzymany','formularz_kompletny','platnosc_wymagana','platnosc_potwierdzona'].forEach(k=>{
      if(k in d)fields[k]=String(d[k]).toLowerCase()==='true';
    });
    return{issue,clientId,fields,updatedAt:d.updated_at||issue.created_at||''};
  }catch{return null}
}
function rebuildUpdateMap(){
  updateByClient=new Map();
  for(const u of updates){if(u&&!updateByClient.has(u.clientId))updateByClient.set(u.clientId,u)}
}
function mergeUpdateIntoEvent(e){
  const u=updateByClient.get(e.clientId); if(!u)return e;
  const c={...(e.card||{})};
  for(const [k,v] of Object.entries(u.fields||{})){
    if(k==='display_name')c.nazwa_klienta=v; else c[k]=v;
  }
  c.warunki_rozpoczecia_prac_spelnione=!!(c.wspolpraca_potwierdzona&&c.formularz_kompletny&&(!c.platnosc_wymagana||c.platnosc_potwierdzona));
  return{...e,card:c,manualUpdate:u};
}
function buildClients(){
  const map=new Map();
  for(const e of events){
    const id=e.clientId||e.card?.messenger_id||e.card?.id_klienta||e.eventId;
    if(!map.has(id))map.set(id,{id,event:e,card:e.card});
  }
  clients=[...map.values()];
}
function followupState(c){
  const raw=c?.data_kolejnego_follow_upu||c?.termin_nastepnego_dzialania;
  if(!raw)return{label:'',due:false,sort:Infinity};
  const d=new Date(String(raw).length===10?raw+'T23:59:59':raw);
  if(Number.isNaN(d.getTime()))return{label:String(raw),due:false,sort:Infinity};
  const today=new Date();today.setHours(0,0,0,0);
  const day=new Date(d);day.setHours(0,0,0,0);
  const diff=Math.round((day-today)/86400000);
  if(diff<0)return{label:`Po terminie ${Math.abs(diff)} d`,due:true,sort:diff};
  if(diff===0)return{label:'Dzisiaj',due:true,sort:0};
  if(diff===1)return{label:'Jutro',due:false,sort:1};
  return{label:d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit'}),due:false,sort:diff};
}
function activityItem(e){
  const s=statusOf(e);
  return `<div class="activityItem" data-event="${esc(e.eventId)}"><span class="avatar">${esc(initials(e))}</span><div class="activityMain"><strong>${esc(displayName(e))}</strong><p>${esc(e.message||'Brak treści wiadomości')}</p></div><div class="activitySide"><time>${esc(relativeTime(e.receivedAt))}</time><span class="miniStatus ${statusClass(s)}">${esc(statusLabel(s))}</span></div></div>`;
}
function followupItem(x){
  const f=followupState(x.card),e=x.event;
  return `<div class="activityItem" data-event="${esc(e.eventId)}"><span class="avatar">${esc(initials(e))}</span><div class="activityMain"><strong>${esc(displayName(e))}</strong><p>${esc(nextStep(x.card))}</p></div><div class="activitySide"><time>follow-up</time><span class="miniStatus ${f.due?'rejected':'pending'}">${esc(f.label)}</span></div></div>`;
}
function webActivity(l){
  const title=l.name||l.company||l.email||'Lead WWW';
  return `<div class="activityItem"><span class="avatar">W</span><div class="activityMain"><strong>${esc(title)}</strong><p>${esc(l.message||l.email||'Nowe zgłoszenie ze strony')}</p></div><div class="activitySide"><time>${esc(relativeTime(l.receivedAt))}</time><span class="miniStatus pending">WWW</span></div></div>`;
}
function filteredInbox(){
  const q=normalize($('inboxSearch')?.value);
  return events.filter(e=>{
    const s=statusOf(e),filterOk=inboxFilter==='all'||(inboxFilter==='pending'&&s==='DO AKCEPTACJI')||(inboxFilter==='done'&&s!=='DO AKCEPTACJI');
    if(!filterOk)return false;if(!q)return true;
    return [displayName(e),e.message,locationOf(e.card),e.card?.branza,e.card?.branża,e.clientId].map(normalize).join(' ').includes(q);
  });
}
function filteredClients(){
  const q=normalize($('crmSearch')?.value);if(!q)return clients;
  return clients.filter(x=>[displayName(x.event),x.event.clientId,locationOf(x.card),x.card?.branza,x.card?.branża,x.card?.cel_inwestycji,salesStatus(x.card,x.event),nextStep(x.card)].map(normalize).join(' ').includes(q));
}
function renderDashboard(){
  const pending=events.filter(e=>statusOf(e)==='DO AKCEPTACJI');
  $('msgCount').textContent=events.length;$('pendingCount').textContent=pending.length;$('clientCount').textContent=clients.length+webLeads.length;$('navPending').textContent=pending.length;
  const due=clients.filter(x=>followupState(x.card).due).sort((a,b)=>followupState(a.card).sort-followupState(b.card).sort);
  const pendingUnique=pending.filter(e=>!due.some(x=>x.event.clientId===e.clientId));
  const queue=[...due.slice(0,4).map(x=>followupItem(x)),...pendingUnique.slice(0,5).map(e=>activityItem(e))].slice(0,6);
  $('queueList').innerHTML=queue.length?queue.join(''):'<div class="emptyState">Brak pilnych spraw. Wszystko jest obsłużone.</div>';
  const combined=[...events.slice(0,6).map(e=>({kind:'event',date:e.receivedAt,item:e})),...webLeads.slice(0,4).map(l=>({kind:'web',date:l.receivedAt,item:l}))].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6);
  $('recentList').innerHTML=combined.length?combined.map(x=>x.kind==='event'?activityItem(x.item):webActivity(x.item)).join(''):'<div class="emptyState">Brak ostatniej aktywności.</div>';
}
function renderInbox(){
  const list=filteredInbox(),pendingCount=events.filter(e=>statusOf(e)==='DO AKCEPTACJI').length;
  $('inboxMeta').textContent=`${events.length} wiadomości · ${pendingCount} do akceptacji`;
  $('conversationList').innerHTML=list.length?list.map(e=>{
    const s=statusOf(e),f=followupState(e.card);
    return `<div class="conversationItem${currentEvent?.eventId===e.eventId?' on':''}" data-event="${esc(e.eventId)}"><span class="avatar">${esc(initials(e))}</span><div class="conversationBody"><div class="conversationTop"><strong>${esc(displayName(e))}</strong><time>${esc(relativeTime(e.receivedAt))}</time></div><p>${esc(e.message||'Brak treści wiadomości')}</p><div class="conversationMeta"><span>${esc(maskId(e.clientId))}</span><span>•</span><span class="miniStatus ${statusClass(s)}">${esc(statusLabel(s))}</span>${f.label?`<span>•</span><span>${esc(f.label)}</span>`:''}</div></div></div>`;
  }).join(''):'<div class="emptyState">Brak rozmów pasujących do filtra.</div>';
}
function renderCRM(){
  const list=filteredClients();$('crmMeta').textContent=`${clients.length} kontaktów Messenger · ${webLeads.length} leadów WWW`;
  const messengerRows=list.map(x=>{
    const c=x.card||{},e=x.event,s=salesStatus(c,e),profile=[locationOf(c),c.branza||c.branża||'Brak branży'].filter(Boolean),f=followupState(c);
    return `<tr data-event="${esc(e.eventId)}"><td><div class="clientCell"><span class="avatar small">${esc(initials(e))}</span><div><strong>${esc(displayName(e))}</strong><span>Messenger · ${esc(maskId(e.clientId))}</span></div></div></td><td><div class="profileCell"><strong>${esc(profile[0])}</strong><span>${esc(profile[1])}</span></div></td><td><strong>${esc(money(investmentOf(c)))}</strong></td><td><span class="statusTag ${statusOf(e)==='DO AKCEPTACJI'?'pending':'neutral'}">${esc(val(s))}</span></td><td><div class="profileCell"><strong>${esc(val(nextStep(c)))}</strong>${f.label?`<span class="${f.due?'followupDue':''}">${esc(f.label)}</span>`:''}</div></td><td class="rowAction">→</td></tr>`;
  });
  const q=normalize($('crmSearch')?.value);
  const webRows=webLeads.filter(l=>!q||[l.name,l.company,l.email,l.phone,l.message].map(normalize).join(' ').includes(q)).map(l=>`<tr><td><div class="clientCell"><span class="avatar small">W</span><div><strong>${esc(l.name||l.company||'Lead WWW')}</strong><span>${esc(l.email||l.phone||'WWW')}</span></div></div></td><td><div class="profileCell"><strong>${esc(l.company||'Brak firmy')}</strong><span>Formularz WWW</span></div></td><td>Brak danych</td><td><span class="statusTag pending">Nowy lead</span></td><td>${esc(l.message||'Skontaktować się')}</td><td class="rowAction">→</td></tr>`);
  $('crmRows').innerHTML=[...messengerRows,...webRows].join('')||'<tr><td colspan="6"><div class="emptyState">Brak kart pasujących do wyszukiwania.</div></td></tr>';
}
function bindDynamic(){document.querySelectorAll('[data-event]').forEach(el=>{el.onclick=()=>{const id=el.dataset.event;if(!id)return;go('i');selectEvent(id)}})}
function render(){
  buildClients();renderDashboard();renderInbox();renderCRM();bindDynamic();
  if(currentEvent&&events.some(e=>e.eventId===currentEvent.eventId)){currentEvent=events.find(e=>e.eventId===currentEvent.eventId);showEvent(currentEvent)}
  else if(events.length){selectEvent((events.find(e=>statusOf(e)==='DO AKCEPTACJI')||events[0]).eventId)}else clearEditor();
}
function clearEditor(){
  currentEvent=null;$('who').textContent='Wybierz rozmowę';$('leadMeta').textContent='Szczegóły kontaktu pojawią się tutaj.';$('contactAvatar').textContent='K';
  $('clientMessage').textContent='Brak wybranej wiadomości.';$('messageTime').textContent='';$('reply').value='';$('reply').disabled=true;$('charCount').textContent='0 znaków';
  ['send','reject','regenerate'].forEach(id=>$(id).disabled=true);$('decisionBadge').className='statusTag neutral';$('decisionBadge').textContent='Brak';
  $('cardDetails').innerHTML='<div class="emptyState small">Wybierz rozmowę.</div>';$('actionState').textContent='';
}
function selectEvent(eventId){
  currentEvent=events.find(e=>e.eventId===eventId)||null;
  document.querySelectorAll('.conversationItem').forEach(el=>el.classList.toggle('on',el.dataset.event===eventId));
  if(currentEvent)showEvent(currentEvent);
}
function showEvent(e){
  const s=statusOf(e),pending=s==='DO AKCEPTACJI';$('who').textContent=displayName(e);$('leadMeta').textContent=`Messenger ${maskId(e.clientId)} · ${fullDate(e.receivedAt)}`;
  $('contactAvatar').textContent=initials(e);$('clientMessage').textContent=e.message||'Brak treści';$('messageTime').textContent=relativeTime(e.receivedAt);
  $('reply').value=decisions.get(e.eventId)?.draft||e.draft||'';$('reply').disabled=!pending;$('send').disabled=!pending||!e.clientId;$('reject').disabled=!pending;$('regenerate').disabled=!pending;
  updateCharCount();const badge=$('decisionBadge');badge.textContent=statusLabel(s);badge.className='statusTag '+statusClass(s);
  const c=e.card||{},preferred=['status_sprzedazy','status_realizacji','status_formularza','status_platnosci','status_researchu_finansowania','rekomendowany_instrument_finansowania','lokalizacja','miasto','branza','branża','cel_inwestycji','wartosc_inwestycji','wartosc_planowanej_inwestycji','oczekiwana_kwota_finansowania','mozliwa_wartosc_finansowania','etap_dzialalnosci','status_zawodowy','termin_inwestycji','poziom_ryzyka','nastepny_krok','termin_nastepnego_dzialania','data_kolejnego_follow_upu','prawdopodobienstwo_sprzedazy','wspolpraca_potwierdzona','formularz_otrzymany','formularz_kompletny','platnosc_wymagana','platnosc_potwierdzona','warunki_rozpoczecia_prac_spelnione'];
  const entries=[];for(const k of preferred){if(k in c&&!entries.some(([x])=>x===k))entries.push([k,c[k]])}
  for(const [k,v] of Object.entries(c)){if(entries.length>=24)break;if(entries.some(([x])=>x===k)||['ostatnia_wiadomosc_klienta','ostatni_szkic_ai','messenger_id','id_klienta'].includes(k))continue;entries.push([k,v])}
  const f=followupState(c);
  const summary=`<div class="contextSummary"><div><strong>${esc(locationOf(c))}</strong><span>${esc(c.branza||c.branża||c.cel_inwestycji||'Profil w trakcie kwalifikacji')}</span>${f.label?`<span class="${f.due?'followupDue':''}">Follow-up: ${esc(f.label)}</span>`:''}</div><button class="crmEditBtn" type="button" id="crmEditBtn">Edytuj CRM</button></div>`;
  const rows=entries.map(([k,v])=>`<div class="detailRow"><span>${esc(humanize(k))}</span><strong>${esc(formatField(k,v))}</strong></div>`).join('');
  $('cardDetails').innerHTML=summary+(rows||'<div class="emptyState small">Brak dodatkowych danych.</div>');
  $('crmEditBtn').onclick=openCRMModal;$('actionState').textContent='';$('actionState').className='actionState';
}
function updateCharCount(){const n=$('reply').value.length;$('charCount').textContent=`${n} ${n===1?'znak':'znaków'}`}

async function loadProduction(newKey){
  $('authError').textContent='';if(newKey){sessionStorage.setItem(STORAGE_KEY,newKey);localStorage.setItem(STORAGE_KEY,newKey)}
  if(!key())throw new Error('Wpisz klucz operatora');setLoading(true);setConnected(false,'Łączenie z backendem');$('healthState').textContent='...';
  try{
    const [rawEvents,rawDecisions,rawWeb,rawUpdates]=await Promise.all([api({action:'panel'}),api({action:'decisions'}),api({action:'web'}),api({action:'web',dataset:'updates'})]);
    decisions=buildDecisionMap(Array.isArray(rawDecisions)?rawDecisions:[]);
    updates=(Array.isArray(rawUpdates)?rawUpdates:[]).map(parseUpdate).filter(Boolean).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    rebuildUpdateMap();
    events=(Array.isArray(rawEvents)?rawEvents:[]).map(parseEvent).filter(Boolean).sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt))).map(mergeUpdateIntoEvent);
    webLeads=(Array.isArray(rawWeb)?rawWeb:[]).map(parseWebLead).filter(Boolean).sort((a,b)=>String(b.receivedAt).localeCompare(String(a.receivedAt)));
    setConnected(true,`${events.length} rekordów · ${clients.length||new Set(events.map(e=>e.clientId)).size} klientów`);
    $('auth').classList.remove('on');render();return true;
  }finally{setLoading(false)}
}
function showAuth(){$('operatorKey').value='';$('authError').textContent='';$('auth').classList.add('on');setTimeout(()=>$('operatorKey').focus(),60)}
function closeDecision(){$('decisionModal').classList.remove('on')}
function openDecision(mode){
  if(!currentEvent)return;decisionMode=mode;const plain=$('reply').value.trim();
  if(mode==='send'&&!plain){$('actionState').textContent='Szkic jest pusty.';$('actionState').className='actionState error';return}
  $('decisionIcon').textContent=mode==='send'?'→':'×';$('decisionTitle').textContent=mode==='send'?'Wyślij wiadomość do klienta?':'Odrzucić szkic?';
  $('decisionText').textContent=mode==='send'?'Wiadomość zostanie wysłana na Messengerze i zapisana jako zatwierdzona.':'Szkic zostanie oznaczony jako odrzucony. Nic nie zostanie wysłane.';
  $('decisionPreview').textContent=plain||currentEvent.message;$('decisionConfirm').textContent=mode==='send'?'Wyślij':'Odrzuć';$('decisionConfirm').className=mode==='send'?'btn primary':'btn dangerGhost';$('decisionModal').classList.add('on');
}
async function regenerate(){
  if(!currentEvent)return;const state=$('actionState');state.textContent='AI przygotowuje nową wersję...';state.className='actionState';$('regenerate').disabled=true;
  try{const text=await api({action:'edit',client_id:currentEvent.clientId,message:currentEvent.message,draft:$('reply').value},'POST','text');$('reply').value=text.trim();updateCharCount();state.textContent='Nowa wersja gotowa. Sprawdź ją przed wysłaniem.'}
  catch(e){state.textContent=e.message;state.className='actionState error'}finally{$('regenerate').disabled=statusOf(currentEvent)!=='DO AKCEPTACJI'}
}
async function rejectCurrent(){
  if(!currentEvent)return;const state=$('actionState');closeDecision();state.textContent='Zapisywanie decyzji...';state.className='actionState';
  try{await api({action:'approve',event_id:currentEvent.eventId,status:'ODRZUCONO',draft:$('reply').value},'POST');decisions.set(currentEvent.eventId,{eventId:currentEvent.eventId,status:'ODRZUCONO',draft:$('reply').value});render();toast('Szkic odrzucony. Nic nie wysłano.')}
  catch(e){state.textContent=e.message;state.className='actionState error'}
}
async function sendCurrent(){
  if(!currentEvent||!currentEvent.clientId)return;const state=$('actionState'),plain=$('reply').value.trim();closeDecision();if(!plain)return;
  state.textContent='Wysyłanie do Messengera...';state.className='actionState';$('send').disabled=true;
  try{
    const result=await api({action:'send',event_id:currentEvent.eventId,client_id:currentEvent.clientId,message:currentEvent.message,draft:jsonSafeForMake(plain)},'POST');
    decisions.set(currentEvent.eventId,{eventId:currentEvent.eventId,status:'ZATWIERDZONO',draft:plain});render();
    if(result.decision_logged===false){$('actionState').textContent='Wiadomość wysłana, ale zapis decyzji w CRM wymaga kontroli.';$('actionState').className='actionState error';toast('Wysłano. Sprawdź zapis decyzji.')}
    else toast('Wiadomość wysłana do klienta.');
  }catch(e){state.textContent='Nie wysłano: '+e.message;state.className='actionState error';$('send').disabled=false}
}

function injectCRMEditor(){
  if($('crmModal'))return;
  const style=document.createElement('style');
  style.textContent=`
    .crmEditBtn{border:1px solid var(--border,#27333f);background:transparent;color:inherit;border-radius:8px;padding:7px 10px;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
    .contextSummary{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .contextSummary>div{min-width:0}.contextSummary .followupDue,.followupDue{color:#ef9aa6!important}
    .crmEditorCard{width:min(760px,100%);max-height:min(88vh,900px);overflow:auto}.crmEditorGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .crmEditorGrid .span2{grid-column:1/-1}.crmEditorGrid label{display:grid;gap:6px;color:#8492a4;font-size:10px;font-weight:700}
    .crmEditorGrid input,.crmEditorGrid select,.crmEditorGrid textarea{width:100%;border:1px solid #27333f;border-radius:9px;background:#0c1218;color:#eef2f7;padding:9px 10px;outline:0}
    body[data-theme="attio"] .crmEditorGrid input,body[data-theme="attio"] .crmEditorGrid select,body[data-theme="attio"] .crmEditorGrid textarea,
    body[data-theme="front"] .crmEditorGrid input,body[data-theme="front"] .crmEditorGrid select,body[data-theme="front"] .crmEditorGrid textarea{background:#fff;color:#1b2430}
    .crmChecks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px;margin-top:3px}
    .crmChecks label{display:flex;align-items:center;gap:8px;font-size:11px;color:inherit;font-weight:600}.crmChecks input{width:auto}
    .crmRule{border:1px solid #27333f;border-radius:9px;padding:10px 11px;font-size:11px;color:#8492a4}.crmRule strong{color:inherit}
    @media(max-width:620px){.crmEditorGrid{grid-template-columns:1fr}.crmEditorGrid .span2{grid-column:auto}.crmChecks{grid-template-columns:1fr}.crmEditorCard{max-height:92vh}}
  `;
  document.head.appendChild(style);
  const modal=document.createElement('div');modal.className='modal';modal.id='crmModal';modal.innerHTML=`
    <div class="modalCard crmEditorCard">
      <div class="modalHeader"><div><span class="sectionEyebrow">CRM</span><h2 style="margin:3px 0 0">Edytuj kartę klienta</h2></div><button class="modalClose" id="crmModalClose" type="button" aria-label="Zamknij">×</button></div>
      <p style="margin:8px 0 14px">Zmiany są zapisywane jako osobny wpis audytowy. Historia rozmów pozostaje bez zmian.</p>
      <div class="crmEditorGrid">
        <label class="span2">Nazwa klienta / firmy<input id="crm_display_name" autocomplete="off"></label>
        <label>Status sprzedaży<select id="crm_status_sprzedazy"><option></option><option>Nowy lead</option><option>Kwalifikacja</option><option>Oferta</option><option>Współpraca potwierdzona</option><option>Wygrany</option><option>Przegrany</option></select></label>
        <label>Status realizacji<select id="crm_status_realizacji"><option></option><option>Nie rozpoczęto</option><option>Onboarding</option><option>Research</option><option>Dokumenty</option><option>Złożone</option><option>Oczekiwanie na decyzję</option><option>Zakończone</option></select></label>
        <label>Status formularza<select id="crm_status_formularza"><option></option><option>Nieotrzymany</option><option>Otrzymany</option><option>Niekompletny</option><option>Kompletny</option></select></label>
        <label>Status płatności<select id="crm_status_platnosci"><option></option><option>Niepotwierdzona</option><option>Oczekuje</option><option>Potwierdzona</option></select></label>
        <label>Status researchu<select id="crm_status_researchu_finansowania"><option></option><option>Do researchu</option><option>Research w toku</option><option>Zweryfikowane</option><option>Brak aktualnej ścieżki</option><option>Monitoring</option><option>Odrzucone</option></select></label>
        <label>Prawdopodobieństwo sprzedaży<select id="crm_prawdopodobienstwo_sprzedazy"><option></option><option>niskie</option><option>średnie</option><option>wysokie</option></select></label>
        <label class="span2">Rekomendowany instrument<input id="crm_rekomendowany_instrument_finansowania"></label>
        <label>Poziom ryzyka<select id="crm_poziom_ryzyka"><option></option><option>niskie</option><option>średnie</option><option>wysokie</option></select></label>
        <label>Potencjalna wartość zlecenia<input id="crm_potencjalna_wartosc_zlecenia" inputmode="decimal" placeholder="np. 2450"></label>
        <label class="span2">Następny krok<input id="crm_nastepny_krok"></label>
        <label>Termin następnego działania<input id="crm_termin_nastepnego_dzialania" type="date"></label>
        <label>Data kolejnego follow-upu<input id="crm_data_kolejnego_follow_upu" type="date"></label>
        <label class="span2">Cel następnej rozmowy<input id="crm_cel_nastepnej_rozmowy"></label>
        <div class="span2 crmChecks">
          <label><input id="crm_wspolpraca_potwierdzona" type="checkbox">Współpraca potwierdzona</label>
          <label><input id="crm_formularz_otrzymany" type="checkbox">Formularz otrzymany</label>
          <label><input id="crm_formularz_kompletny" type="checkbox">Formularz kompletny</label>
          <label><input id="crm_platnosc_wymagana" type="checkbox">Płatność wymagana</label>
          <label><input id="crm_platnosc_potwierdzona" type="checkbox">Płatność potwierdzona</label>
        </div>
        <div class="span2 crmRule" id="crmStartRule">Warunki rozpoczęcia prac: <strong>niespełnione</strong></div>
      </div>
      <div id="crmSaveError" class="error"></div>
      <div class="modalActions split"><button class="btn secondary" id="crmModalCancel" type="button">Anuluj</button><button class="btn primary" id="crmSave" type="button">Zapisz CRM</button></div>
    </div>`;
  document.body.appendChild(modal);
  $('crmModalClose').onclick=closeCRMModal;$('crmModalCancel').onclick=closeCRMModal;
  modal.onclick=e=>{if(e.target===modal)closeCRMModal()};
  ['crm_wspolpraca_potwierdzona','crm_formularz_kompletny','crm_platnosc_wymagana','crm_platnosc_potwierdzona'].forEach(id=>$(id).onchange=updateStartRulePreview);
  $('crmSave').onclick=saveCRMUpdate;
}
function closeCRMModal(){$('crmModal')?.classList.remove('on')}
function setField(id,v){const el=$(id);if(!el)return;if(el.type==='checkbox')el.checked=!!v;else el.value=v??''}
function updateStartRulePreview(){
  const ok=$('crm_wspolpraca_potwierdzona').checked&&$('crm_formularz_kompletny').checked&&(!$('crm_platnosc_wymagana').checked||$('crm_platnosc_potwierdzona').checked);
  $('crmStartRule').innerHTML=`Warunki rozpoczęcia prac: <strong>${ok?'spełnione':'niespełnione'}</strong>`;
}
function openCRMModal(){
  if(!currentEvent)return;injectCRMEditor();const c=currentEvent.card||{};
  const map={
    crm_display_name:explicitName(currentEvent),crm_status_sprzedazy:c.status_sprzedazy,crm_status_realizacji:c.status_realizacji,
    crm_status_formularza:c.status_formularza,crm_status_platnosci:c.status_platnosci,crm_status_researchu_finansowania:c.status_researchu_finansowania,
    crm_rekomendowany_instrument_finansowania:c.rekomendowany_instrument_finansowania,crm_poziom_ryzyka:c.poziom_ryzyka,
    crm_nastepny_krok:c.nastepny_krok,crm_termin_nastepnego_dzialania:c.termin_nastepnego_dzialania,crm_cel_nastepnej_rozmowy:c.cel_nastepnej_rozmowy,
    crm_prawdopodobienstwo_sprzedazy:c.prawdopodobienstwo_sprzedazy,crm_potencjalna_wartosc_zlecenia:c.potencjalna_wartosc_zlecenia,
    crm_data_kolejnego_follow_upu:c.data_kolejnego_follow_upu,crm_wspolpraca_potwierdzona:c.wspolpraca_potwierdzona,
    crm_formularz_otrzymany:c.formularz_otrzymany,crm_formularz_kompletny:c.formularz_kompletny,crm_platnosc_wymagana:c.platnosc_wymagana,
    crm_platnosc_potwierdzona:c.platnosc_potwierdzona
  };
  Object.entries(map).forEach(([id,v])=>setField(id,v));$('crmSaveError').textContent='';updateStartRulePreview();$('crmModal').classList.add('on');
}
async function saveCRMUpdate(){
  if(!currentEvent)return;const btn=$('crmSave');btn.disabled=true;$('crmSaveError').textContent='';
  const p={
    action:'manual',client_id:currentEvent.clientId,display_name:$('crm_display_name').value.trim(),
    status_sprzedazy:$('crm_status_sprzedazy').value,status_realizacji:$('crm_status_realizacji').value,status_formularza:$('crm_status_formularza').value,
    status_platnosci:$('crm_status_platnosci').value,status_researchu_finansowania:$('crm_status_researchu_finansowania').value,
    rekomendowany_instrument_finansowania:$('crm_rekomendowany_instrument_finansowania').value.trim(),poziom_ryzyka:$('crm_poziom_ryzyka').value,
    nastepny_krok:$('crm_nastepny_krok').value.trim(),termin_nastepnego_dzialania:$('crm_termin_nastepnego_dzialania').value,
    cel_nastepnej_rozmowy:$('crm_cel_nastepnej_rozmowy').value.trim(),prawdopodobienstwo_sprzedazy:$('crm_prawdopodobienstwo_sprzedazy').value,
    potencjalna_wartosc_zlecenia:$('crm_potencjalna_wartosc_zlecenia').value.trim(),data_kolejnego_follow_upu:$('crm_data_kolejnego_follow_upu').value,
    wspolpraca_potwierdzona:String($('crm_wspolpraca_potwierdzona').checked),formularz_otrzymany:String($('crm_formularz_otrzymany').checked),
    formularz_kompletny:String($('crm_formularz_kompletny').checked),platnosc_wymagana:String($('crm_platnosc_wymagana').checked),
    platnosc_potwierdzona:String($('crm_platnosc_potwierdzona').checked)
  };
  const keepId=currentEvent.eventId;
  try{await api(p,'POST');closeCRMModal();toast('CRM zapisany.');await loadProduction();selectEvent(keepId)}
  catch(e){$('crmSaveError').textContent=e.message}
  finally{btn.disabled=false}
}

injectCRMEditor();
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>go(b.dataset.jump));
document.querySelectorAll('#inboxFilters button').forEach(b=>{b.onclick=()=>{inboxFilter=b.dataset.filter;document.querySelectorAll('#inboxFilters button').forEach(x=>x.classList.toggle('on',x===b));renderInbox();bindDynamic()}});
$('inboxSearch').oninput=()=>{renderInbox();bindDynamic()};
$('crmSearch').oninput=()=>{renderCRM();bindDynamic()};
$('reply').oninput=updateCharCount;
$('connect').onclick=showAuth;
$('refresh').onclick=()=>loadProduction().catch(e=>{setConnected(false);toast(e.message)});
$('authCancel').onclick=()=>$('auth').classList.remove('on');
$('authConnect').onclick=async()=>{const candidate=$('operatorKey').value.trim();try{await loadProduction(candidate)}catch(e){if(candidate){sessionStorage.removeItem(STORAGE_KEY);localStorage.removeItem(STORAGE_KEY)}$('authError').textContent=e.message;setConnected(false)}};
$('operatorKey').onkeydown=e=>{if(e.key==='Enter')$('authConnect').click()};
$('regenerate').onclick=regenerate;$('reject').onclick=()=>openDecision('reject');$('send').onclick=()=>openDecision('send');
$('decisionCancel').onclick=closeDecision;$('decisionBack').onclick=closeDecision;$('decisionConfirm').onclick=()=>decisionMode==='send'?sendCurrent():rejectCurrent();
$('decisionModal').onclick=e=>{if(e.target===$('decisionModal'))closeDecision()};
$('auth').onclick=e=>{if(e.target===$('auth'))$('auth').classList.remove('on')};
const savedView=sessionStorage.getItem('flowpilot_view');if(savedView&&names[savedView])go(savedView);
if(key()){sessionStorage.setItem(STORAGE_KEY,key());loadProduction().catch(()=>{setConnected(false);toast('Nie udało się połączyć. Sprawdź klucz operatora.')})}else setConnected(false);
