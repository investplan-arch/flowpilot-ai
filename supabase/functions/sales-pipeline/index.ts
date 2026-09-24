import {createClient} from 'npm:@supabase/supabase-js@2';
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,PATCH,OPTIONS','Cache-Control':'no-store'},J=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'content-type':'application/json'}});
const stages=new Set(['new','qualified','contacted','offer','proposal','decision','negotiation','payment','won','lost']);
Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers:C});try{
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{data:u}=await db.auth.getUser(jwt);if(!u.user)return J({error:'unauthorized'},401);
 const{data:p}=await db.from('profiles').select('organization_id').eq('id',u.user.id).single();if(!p?.organization_id)return J({error:'profile_missing'},404);const org=p.organization_id;
 if(req.method==='PATCH'){
  const b=await req.json().catch(()=>({}));if(!b.id)return J({error:'id_required'},400);const allowed:any={};
  if('pipeline_stage'in b){const s=String(b.pipeline_stage||'');if(!stages.has(s))return J({error:'invalid_stage'},400);allowed.pipeline_stage=s;allowed.won_at=s==='won'?new Date().toISOString():null}
  if('estimated_value'in b){const v=b.estimated_value===null?null:Number(b.estimated_value);if(v!==null&&(!Number.isFinite(v)||v<0||v>1e12))return J({error:'invalid_estimated_value'},400);allowed.estimated_value=v}
  if('probability'in b){const v=b.probability===null?null:Number(b.probability);if(v!==null&&(!Number.isInteger(v)||v<0||v>100))return J({error:'invalid_probability'},400);allowed.probability=v}
  if('next_follow_up_at'in b){if(b.next_follow_up_at===null||b.next_follow_up_at==='')allowed.next_follow_up_at=null;else{const d=new Date(b.next_follow_up_at);if(Number.isNaN(d.getTime()))return J({error:'invalid_followup_date'},400);allowed.next_follow_up_at=d.toISOString()}}
  if('owner_note'in b)allowed.owner_note=String(b.owner_note||'').slice(0,5000)||null;
  if('lost_reason'in b)allowed.lost_reason=String(b.lost_reason||'').slice(0,2000)||null;
  if(!Object.keys(allowed).length)return J({error:'nothing_to_update'},400);allowed.updated_at=new Date().toISOString();
  const{data,error}=await db.from('leads').update(allowed).eq('id',String(b.id)).eq('organization_id',org).select().single();if(error)return J({error:'update_failed'},400);
  await db.from('activity_log').insert({organization_id:org,actor_user_id:u.user.id,event_type:'pipeline.updated',entity_type:'lead',entity_id:String(b.id),data:{changes:Object.keys(allowed).filter(k=>k!=='updated_at')}});
  return J({lead:data});
 }
 if(req.method!=='GET')return J({error:'method_not_allowed'},405);
 const{data:leads,error}=await db.from('leads').select('id,contact_id,status,score,intent,urgency,summary,recommended_action,pipeline_stage,estimated_value,currency,probability,next_follow_up_at,owner_note,lost_reason,won_at,created_at,updated_at').eq('organization_id',org).order('updated_at',{ascending:false});if(error)return J({error:'load_failed'},500);
 const ids=[...new Set((leads||[]).map((x:any)=>x.contact_id).filter(Boolean))];let contacts:any[]=[];if(ids.length){const r=await db.from('contacts').select('id,name').in('id',ids);contacts=r.data||[]}const cm=Object.fromEntries(contacts.map((x:any)=>[x.id,x.name]));const rows=(leads||[]).map((x:any)=>({...x,contact_name:cm[x.contact_id]||'Klient'}));
 const today=new Date();today.setHours(23,59,59,999);const open=rows.filter((x:any)=>!['won','lost'].includes(x.pipeline_stage)),won=rows.filter((x:any)=>x.pipeline_stage==='won'),lost=rows.filter((x:any)=>x.pipeline_stage==='lost');const pipeline_value=open.reduce((a:number,x:any)=>a+Number(x.estimated_value||0),0),weighted_value=open.reduce((a:number,x:any)=>a+Number(x.estimated_value||0)*Number(x.probability??Math.min(95,Math.max(10,x.score||20)))/100,0),due=rows.filter((x:any)=>x.next_follow_up_at&&new Date(x.next_follow_up_at)<=today&&!['won','lost'].includes(x.pipeline_stage));const ms=new Date();ms.setDate(1);ms.setHours(0,0,0,0);const wonMonth=won.filter((x:any)=>x.won_at&&new Date(x.won_at)>=ms),won_value_month=wonMonth.reduce((a:number,x:any)=>a+Number(x.estimated_value||0),0);
 return J({leads:rows,metrics:{pipeline_value,weighted_value,open:open.length,won:won.length,lost:lost.length,due_followups:due.length,won_count_month:wonMonth.length,won_value_month,conversion_rate:(won.length+lost.length)?Math.round(won.length/(won.length+lost.length)*100):0,avg_won_value:won.length?Math.round(won.reduce((a:number,x:any)=>a+Number(x.estimated_value||0),0)/won.length):0,generated_at:new Date().toISOString()}});
}catch(e){return J({error:'internal_error'},500)}});
