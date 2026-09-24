import { createClient } from 'npm:@supabase/supabase-js@2';
import { humanAgentEnabled, replyWindow } from '../_shared/reply-window.ts';

const C = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Cache-Control': 'no-store'
};
const J = (x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}});

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:C});
  if(req.method!=='GET') return J({error:'method_not_allowed'},405);
  try{
    const db=createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {auth:{persistSession:false}}
    );
    const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
    const {data:u}=await db.auth.getUser(jwt);
    if(!u.user) return J({error:'unauthorized'},401);

    const {data:p}=await db.from('profiles').select('organization_id').eq('id',u.user.id).single();
    if(!p?.organization_id) return J({error:'profile_missing'},404);
    const org=p.organization_id;

    const url=new URL(req.url);
    const cid=url.searchParams.get('conversation_id');
    const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));

    if(cid){
      const {data:c,error:ce}=await db.from('conversations')
        .select('*').eq('id',cid).eq('organization_id',org).maybeSingle();
      if(ce) return J({error:'conversation_query_failed'},500);
      if(!c) return J({error:'not_found'},404);

      const [ctRes,lRes,mRes]=await Promise.all([
        c.contact_id
          ? db.from('contacts').select('id,name,external_id,metadata').eq('id',c.contact_id).eq('organization_id',org).maybeSingle()
          : Promise.resolve({data:null,error:null}),
        c.lead_id
          ? db.from('leads').select('*').eq('id',c.lead_id).eq('organization_id',org).maybeSingle()
          : Promise.resolve({data:null,error:null}),
        db.from('messages').select('*').eq('conversation_id',cid).eq('organization_id',org).order('created_at',{ascending:true})
      ]);

      if((mRes as any).error) return J({error:'messages_query_failed'},500);
      const msgs=(mRes as any).data||[];
      const lastInbound=[...msgs].reverse().find((m:any)=>m.direction==='inbound');
      return J({
        reply_window:replyWindow(c.channel,lastInbound?.created_at,Date.now(),humanAgentEnabled()),
        conversation:c,
        contact:(ctRes as any).data||null,
        lead:(lRes as any).data||null,
        messages:msgs
      });
    }

    const [csRes,ctsRes,lsRes]=await Promise.all([
      db.from('conversations').select('*')
        .eq('organization_id',org)
        .eq('status','open')
        .order('last_message_at',{ascending:false})
        .range(offset,offset+50),
      db.from('contacts').select('id,name').eq('organization_id',org),
      db.from('leads').select('*').eq('organization_id',org)
    ]);

    if(csRes.error) return J({error:'conversations_query_failed'},500);
    if(ctsRes.error) return J({error:'contacts_query_failed'},500);
    if(lsRes.error) return J({error:'leads_query_failed'},500);

    const cm=Object.fromEntries((ctsRes.data||[]).map((x:any)=>[x.id,x]));
    const lm=Object.fromEntries((lsRes.data||[]).map((x:any)=>[x.id,x]));

    const rows=(csRes.data||[]).slice(0,50);
    const {data:summaries,error:summaryError}=await db.rpc('inbox_summaries_internal',{p_org:org,p_ids:rows.map((c:any)=>c.id)});
    if(summaryError)return J({error:'summary_query_failed'},500);
    const sm=Object.fromEntries((summaries||[]).map((x:any)=>[x.conversation_id,x]));
    // Time of the customer's latest message per conversation: waiting time and reply window.
    const li:Record<string,string>={};
    if(rows.length){
      const {data:ins}=await db.from('messages').select('conversation_id,created_at')
        .eq('organization_id',org).eq('direction','inbound').in('conversation_id',rows.map((c:any)=>c.id))
        .order('created_at',{ascending:false}).limit(2000);
      for(const m of ins||[]) if(!li[m.conversation_id]) li[m.conversation_id]=m.created_at;
    }
    return J({has_more:(csRes.data||[]).length>50,
      conversations:rows.map((c:any)=>({
        ...c,...(sm[c.id]||{}),
        last_inbound_at:li[c.id]||null,
        contact:cm[c.contact_id]||null,
        lead:lm[c.lead_id]||null
      }))
    });
  }catch(e){
    console.error(e);
    return J({error:'internal_error'},500);
  }
});

