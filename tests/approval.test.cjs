const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8').replace(/bootstrap\(\);\s*$/,'');
async function run(){
 const elements=new Map(),calls=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',classList:{add(){},remove(){}},disabled:false});return elements.get(id)};
 const ctx=vm.createContext({document:{getElementById:el},TextDecoder,Uint8Array,atob,setTimeout,clearTimeout,console});
 vm.runInContext(source,ctx);
 ctx.capture=async p=>{calls.push(p);return {decision_logged:true}};
 vm.runInContext("api=capture;render=()=>{};toast=()=>{};currentEvent={eventId:'one',clientId:'client-one',message:'hello'};$('reply').value='Approved text';openDecision('send');",ctx);
 el('reply').value='Changed text';
 await vm.runInContext('sendCurrent()',ctx);
 assert.equal(calls.length,0,'Changed text must require a fresh approval');
 vm.runInContext("$('reply').value='Approved text';openDecision('send');currentEvent={eventId:'two',clientId:'client-two',message:'other'};",ctx);
 await vm.runInContext('sendCurrent()',ctx);
 assert.equal(calls.length,0,'A different client must require a fresh approval');
 vm.runInContext("currentEvent={eventId:'one',clientId:'client-one',message:'hello'};openDecision('send');",ctx);
 await Promise.all([vm.runInContext('sendCurrent()',ctx),vm.runInContext('sendCurrent()',ctx)]);
 assert.equal(calls.length,1,'Double confirmation must send only once');
 assert.equal(calls[0].draft,'Approved text');
 assert.equal(calls[0].client_id,'client-one');
 console.log('PASS: changed text, changed recipient, duplicate confirmation, approved payload');
}
run().catch(e=>{console.error(e.message);process.exitCode=1});
