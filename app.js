const API="https://usr-svc.sjp.gos.pk/api/v2/candidates/application/getAllAppliedJobsByCandidate";
const STORE="__sjp_job_tracker_snapshot_v1";
const tempShort=/TEMPORARY.*SHORTLIST|SHORTLIST.*TEMPORARY/i;
const tempReject=/TEMPORARY.*REJECT|REJECT.*TEMPORARY|TEMP.*REJECT/i;
const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const statusOf=a=>String(a.applicationStatus||a.status||"UNKNOWN").trim();
const latestOf=a=>{let x=Array.isArray(a.ApplicationStatuses)?[...a.ApplicationStatuses]:[];x.sort((p,q)=>new Date(q.changedAt||q.createdAt||0)-new Date(p.changedAt||p.createdAt||0));return x[0]?.changedAt||x[0]?.createdAt||a.updatedAt||a.createdAt||""};
const fmt=d=>{if(!d)return"-";try{return new Date(d).toLocaleString([],{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return d}};
const titleOf=a=>a.Job?.jobTitle||a.jobOffered||"Job";
const deptOf=a=>a.Job?.Department?.departmentName||"";
const idOf=a=>String(a.applicationId||a.id||"");
let apps=[],changes=[],changedIds=new Set(),filter="ALL",old={};
try{old=JSON.parse(localStorage.getItem(STORE)||"{}")||{}}catch{}

const $=s=>document.querySelector(s);
$("#openSjp").onclick=()=>window.open("https://sjp.gos.pk/","_blank");
$("#theme").onclick=()=>{document.body.classList.toggle("dark");$("#theme").textContent=document.body.classList.contains("dark")?"☀️":"🌙"};
$("#bell").onclick=()=>$("#noticeBox").scrollIntoView({behavior:"smooth",block:"center"});
$("#search").oninput=render;
$("#refresh").onclick=load;

function badge(s){
 if(tempReject.test(s))return"b-temp-reject";
 if(tempShort.test(s))return"b-temp-short";
 if(/REJECTED/i.test(s))return"b-reject";
 if(/OFFERED|JOINED/i.test(s))return"b-offer";
 if(/INTERVIEW/i.test(s))return"b-interview";
 if(/^SHORTLISTED$/i.test(s))return"b-short";
 if(/^APPLIED$/i.test(s))return"b-applied";
 return"b-other";
}
function match(s,f){
 if(f==="ALL")return true;
 if(f==="APPLIED")return/^APPLIED$/i.test(s);
 if(f==="TEMP_SHORT")return tempShort.test(s);
 if(f==="SHORTLISTED")return/^SHORTLISTED$/i.test(s);
 if(f==="INTERVIEW")return/INTERVIEW/i.test(s);
 if(f==="OFFERED")return/OFFERED/i.test(s);
 if(f==="JOINED")return/JOINED/i.test(s);
 if(f==="TEMP_REJECTED")return tempReject.test(s);
 if(f==="REJECTED")return/REJECTED/i.test(s)&&!tempReject.test(s);
 return true;
}
function setupFilters(){
 const fs=[["ALL","All"],["APPLIED","Applied"],["TEMP_SHORT","Temp. Shortlisted"],["SHORTLISTED","Shortlisted"],["INTERVIEW","Interview"],["OFFERED","Offered"],["JOINED","Joined"],["TEMP_REJECTED","Temp. Rejected"],["REJECTED","Rejected"]];
 $("#filters").innerHTML=fs.map(x=>`<button class="filter ${x[0]==="ALL"?"active":""}" data-f="${x[0]}">${x[1]}</button>`).join("");
 document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.f;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render()});
}
function renderStats(){
 const count=f=>apps.filter(a=>f(statusOf(a))).length;
 const cards=[
  ["Total",apps.length,"📊","c-total"],
  ["Applied",count(s=>/^APPLIED$/i.test(s)),"📝","c-applied"],
  ["Temp. Shortlisted",count(s=>tempShort.test(s)),"🩵","c-temp-short"],
  ["Shortlisted",count(s=>/^SHORTLISTED$/i.test(s)),"⭐","c-short"],
  ["Interview",count(s=>/INTERVIEW/i.test(s)),"🎯","c-interview"],
  ["Offered/Joined",count(s=>/OFFERED|JOINED/i.test(s)),"🎉","c-offer"],
  ["Temp. Rejected",count(s=>tempReject.test(s)),"⚠️","c-temp-reject"],
  ["Rejected",count(s=>/REJECTED/i.test(s)&&!tempReject.test(s)),"❌","c-reject"]
 ];
 $("#stats").innerHTML=cards.map(x=>`<div class="stat ${x[3]}"><div class="statIcon">${x[2]}</div><div class="num">${x[1]}</div><div class="lab">${x[0]}</div></div>`).join("");
}
function renderNotice(){
 if(!changes.length){$("#bellN").textContent="";$("#noticeBox").innerHTML="";return}
 $("#bellN").textContent=changes.length;
 $("#noticeBox").innerHTML=`<div class="notice"><div class="noticeHead">🔔 ${changes.length} status update${changes.length>1?"s":""} since your last check</div>
 ${changes.slice(0,8).map(x=>`<div class="change"><b>${esc(x.title)}</b><br>${x.statusChanged?`${esc(x.from)} → <b>${esc(x.to)}</b>`:`Status updated: <b>${esc(x.to)}</b>`}<br><span>${esc(fmt(x.when))}</span></div>`).join("")}
 ${changes.length>8?`<div style="font-size:10px;margin-top:7px">+ ${changes.length-8} more updates</div>`:""}</div>`;
}
function render(){
 const q=$("#search").value.trim().toLowerCase();
 const list=apps.filter(a=>{
  const s=statusOf(a);
  const text=(titleOf(a)+" "+deptOf(a)+" "+idOf(a)+" "+s).toLowerCase();
  return match(s,filter)&&(!q||text.includes(q));
 });
 if(!list.length){$("#content").innerHTML='<div class="empty">No applications found.</div>';return}
 $("#content").innerHTML=list.map(a=>{
  const id=idOf(a),s=statusOf(a);
  const h=Array.isArray(a.ApplicationStatuses)?[...a.ApplicationStatuses].sort((p,q)=>new Date(q.changedAt||q.createdAt||0)-new Date(p.changedAt||p.createdAt||0)):[];
  return `<div class="card ${changedIds.has(id)?"new":""}">
   <div class="ctop"><div class="job">${esc(titleOf(a))}</div>${changedIds.has(id)?'<span class="new">NEW</span>':""}<span class="badge ${badge(s)}">${esc(s)}</span></div>
   ${deptOf(a)?`<div class="meta">${esc(deptOf(a))}</div>`:""}
   <div class="row"><span class="label">Application ID</span><b>${esc(id||"-")}</b></div>
   <div class="row"><span class="label">Last status update</span><span>${esc(fmt(latestOf(a)))}</span></div>
   ${a.reasonForRejected?`<div class="line"></div><div class="row"><span class="label">Reason</span><span>${esc(a.reasonForRejected)}</span></div>`:""}
   ${h.length?`<div class="line"></div><div class="history"><b style="font-size:11px">Status history</b>${h.slice(0,5).map(x=>`<div class="hist"><span class="dot"></span><span><b>${esc(x.status||"-")}</b> · ${esc(fmt(x.changedAt||x.createdAt))}</span></div>`).join("")}</div>`:""}
  </div>`;
 }).join("");
}
async function load(){
 $("#content").innerHTML='<div class="empty">⏳ Loading applications...</div>';
 apps=[];changes=[];changedIds=new Set();
 try{
  for(let page=1;;page++){
   const r=await fetch(`${API}?page=${page}&limit=10&keyword=`,{credentials:"include",headers:{Accept:"application/json"}});
   if(!r.ok)throw Error("HTTP "+r.status);
   const j=await r.json();
   const batch=j?.data?.applications||j?.applications||[];
   if(!batch.length)break;
   apps.push(...batch);
   if(batch.length<10)break;
  }
 }catch(e){
  $("#content").innerHTML=`<div class="empty">❌ Could not load SJP applications.<br><br>${esc(e.message)}<br><br>Make sure you are logged in to SJP in Firefox. If Firefox blocks this mini-app from reading SJP data, use the original SJP bookmarklet.</div>`;
  return;
 }
 const snapshot={};
 apps.forEach(a=>{
  const id=idOf(a),s=statusOf(a),t=String(latestOf(a)||"");
  snapshot[id]={status:s,changedAt:t};
  if(id&&old[id]&&(old[id].status!==s||old[id].changedAt!==t)){
   changes.push({id,title:titleOf(a),from:old[id].status,to:s,when:t,statusChanged:old[id].status!==s});
   changedIds.add(id);
  }
 });
 try{localStorage.setItem(STORE,JSON.stringify(snapshot))}catch{}
 old=snapshot;
 apps.sort((a,b)=>new Date(latestOf(b)||0)-new Date(latestOf(a)||0));
 renderStats();renderNotice();render();
}
setupFilters();
load();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
