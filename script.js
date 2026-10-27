/* Soldiers Hill Volleyball Club — local browser storage only. */
const REGISTRATION_FEE = 50;
const BASE_ROLES = ["Setter", "1st Open", "2nd Open", "1st Middle", "Opposite"];
const POSITIONS = [...BASE_ROLES, "Libero", "2nd Middle"];
const KEYS = {walkins:"shvc_walkins_v3",attendance:"shvc_attendance_v3",games:"shvc_games_v3",eligibility:"shvc_eligibility_v7"};
function rolesForTeamSize(size) {
 const roles = [...BASE_ROLES];
 if (size >= 6) roles.push("Libero");
 if (size >= 7) roles.push("2nd Middle");
 return roles;
}

const regularPlayers = [
  { id: "member-1", name: "Frank", type: "regular" },
  { id: "member-2", name: "Jirah", type: "regular" },
  { id: "member-3", name: "Duncan", type: "regular" },
  { id: "member-4", name: "Christian", type: "regular" },
  { id: "member-5", name: "Melchor", type: "regular" },
  { id: "member-6", name: "Shadie", type: "regular" },
  { id: "member-7", name: "Arian", type: "regular" },
  { id: "member-8", name: "Jason", type: "regular" },
  { id: "member-9", name: "Jonas", type: "regular" },
  { id: "member-10", name: "Carl", type: "regular" },
  { id: "member-11", name: "Valdez", type: "regular" },
  { id: "member-12", name: "Sebby", type: "regular" },
  { id: "member-13", name: "Jimbrix", type: "regular" },
  { id: "member-14", name: "Jamlag", type: "regular" },
  { id: "member-15", name: "Drei", type: "regular" },
  { id: "member-16", name: "Kenneth", type: "regular" },
  { id: "member-17", name: "Gesteve", type: "regular" },
  { id: "member-18", name: "Tristan", type: "regular" },
  { id: "member-19", name: "Tom", type: "regular" },
  { id: "member-20", name: "Aryan", type: "regular" },
  { id: "member-21", name: "Mama-Mama", type: "regular" },
  { id: "member-22", name: "Basti", type: "regular" },
  { id: "member-23", name: "Keith", type: "regular" },
  { id: "member-24", name: "Glenn", type: "regular" },

];

const defaultGames=[{id:"game-1",title:"Winner Takes All",date:"2026-10-25",time:"17:00",location:"Soldiers Hill, Zone 10, Bulua",registrationFee:50,courtFee:300,lightFee:130,sponsor:0}];
let walkIns=load(KEYS.walkins,[]), games=load(KEYS.games,defaultGames), attendance=load(KEYS.attendance,{}), eligibility=load(KEYS.eligibility,{});
let wheelAngle=0, spinning=false, noticeTimer=null, wheelResultTimer=null, wheelHighlightNames=null, wheelHighlightIndex=null;
const $=id=>document.getElementById(id);
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{notice("Could not save data in this browser.",true)}}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notice(msg,error=false){const el=$("notice");el.textContent=msg;el.classList.toggle("error",error);el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,4500)}
function money(n){return Number(n||0).toLocaleString("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:2})}
function registrationFee(g){return g&&g.registrationFee!==undefined&&g.registrationFee!==null&&g.registrationFee!==""?Math.max(0,Number(g.registrationFee)||0):REGISTRATION_FEE}
function players(){return [...regularPlayers,...walkIns]}
function player(id){return players().find(p=>p.id===id)}
function joined(gameId){const ids=attendance[gameId]||[];return players().filter(p=>ids.includes(p.id))}
function page(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));$("page-title").textContent=({home:"Home",games:"Games & Prize Pot",members:"Club Members",roulette:"Team Roulette"})[name]||"Home";if(name==="roulette")renderRoulette();if(name==="members")renderMembers();window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.go)));
document.querySelectorAll("[data-page-link]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();page(b.dataset.pageLink)}));
function gameSummary(g){const count=joined(g.id).length,fee=registrationFee(g);return `<article class="game-card"><div class="game-header"><div><h2>${esc(g.title)}</h2><div class="game-details"><div>▦ ${esc(g.date)} · ${esc(g.time||"Time TBA")}</div><div>⌖ ${esc(g.location)}</div><div>♙ ${count} players checked in</div></div></div><span class="registration-label">${money(fee)} per player</span></div><div class="form-actions"><button class="button primary" data-open-game="${esc(g.id)}">Manage attendance &amp; pot →</button></div></article>`}
function renderHome(){$("home-games-count").textContent=games.length;$("home-members-count").textContent=regularPlayers.length;$("home-walkins-count").textContent=walkIns.length;$("home-games-list").innerHTML=games.length?games.map(gameSummary).join(""):'<div class="empty-state">No games scheduled yet.</div>'}
function distributionRows(playerCount,pot){
 const teamCount=findTeamCount(playerCount);
 if(!teamCount||playerCount<10)return '<p class="small-text muted">Check in at least 10 players to estimate team payouts.</p>';
 const smallest=Math.floor(playerCount/teamCount),largest=Math.ceil(playerCount/teamCount);
 const sizes=[...new Set([smallest,largest])];
 return sizes.map(size=>`<div class="pot-row"><span>If winning team has ${size} player${size===1?"":"s"}</span><strong>${money(Math.max(0,pot)/size)} each</strong></div>`).join("");
}
function renderGames(){
 $("games-list").innerHTML=games.length?games.map(g=>{
 const joinedNow=joined(g.id),ids=attendance[g.id]||[],fee=registrationFee(g),collected=joinedNow.length*fee,court=Number(g.courtFee)||0,lights=Number(g.lightFee)||0,sponsor=Number(g.sponsor)||0,pot=collected+sponsor-court-lights;
 const checks=players().map(p=>`<label class="player-check"><input type="checkbox" class="attendance-checkbox" data-game="${esc(g.id)}" data-player="${esc(p.id)}" ${ids.includes(p.id)?"checked":""}><span>${esc(p.name)}</span>${p.type==="walkin"?'<span class="registration-label">Walk-in</span>':""}</label>`).join("");
 return `<article class="game-card" id="game-card-${esc(g.id)}"><div class="game-header"><div><h2>${esc(g.title)}</h2><div class="game-details"><div>▦ ${esc(g.date)} · ${esc(g.time)}</div><div>⌖ ${esc(g.location)}</div></div></div><span class="registration-label">${money(fee)} per player</span></div>
 <div class="game-layout"><div><h3>Who's joining? (${joinedNow.length})</h3><div class="checklist-tools"><button class="button secondary small" data-select-all="${esc(g.id)}">Select all</button><button class="button secondary small" data-clear-all="${esc(g.id)}">Clear all</button></div><div class="player-list">${checks||'<p class="muted">Add players first.</p>'}</div></div>
 <div class="pot-panel"><h3>Prize pot calculator</h3><div class="pot-row"><span>Checked-in players</span><strong>${joinedNow.length}</strong></div><div class="pot-row"><span>Registration collected (${joinedNow.length} × ${money(fee)})</span><strong>${money(collected)}</strong></div><div class="pot-row"><span>Sponsored amount</span><strong>+${money(sponsor)}</strong></div><div class="pot-row"><span>Court rental deduction</span><strong>−${money(court)}</strong></div><div class="pot-row"><span>Lighting deduction</span><strong>−${money(lights)}</strong></div><div class="pot-row total"><span>Estimated winner's pot</span><strong class="${pot<0?"pot-negative":""}">${money(pot)}</strong></div>
 <div class="pot-row"><span>Estimated number of teams</span><strong>${findTeamCount(joinedNow.length)||"—"}</strong></div><div class="pot-distribution"><h4>Winner's team payout estimate</h4>${distributionRows(joinedNow.length,pot)}<p class="small-text">The winner's pot is split equally among players on the winning team. Team sizes are balanced between 5 and 7 where possible.</p></div><div class="pot-fields"><label>Registration per player (₱)<input type="number" min="0" step="0.01" value="${fee}" data-pot-field="registrationFee" data-game="${esc(g.id)}"></label><label>Court rental (₱)<input type="number" min="0" step="0.01" value="${court}" data-pot-field="courtFee" data-game="${esc(g.id)}"></label><label>Lighting (₱)<input type="number" min="0" step="0.01" value="${lights}" data-pot-field="lightFee" data-game="${esc(g.id)}"></label><label>Sponsored amount (₱)<input type="number" min="0" step="0.01" value="${sponsor}" data-pot-field="sponsor" data-game="${esc(g.id)}"></label></div><p class="small-text">Changes save in this browser. Update the registration amount for this game here; the prize pot recalculates automatically.</p></div></div></article>`
 }).join(""):'<div class="empty-state">No games yet. Add a game to begin.</div>';
}
function refresh(){save(KEYS.attendance,attendance);renderHome();renderGames();renderMembers();renderRoulette()}
$("games-list").addEventListener("change",e=>{
 const cb=e.target.closest(".attendance-checkbox");
 if(cb){const g=cb.dataset.game,id=cb.dataset.player;attendance[g]??=[];if(cb.checked&&!attendance[g].includes(id))attendance[g].push(id);if(!cb.checked)attendance[g]=attendance[g].filter(x=>x!==id);delete teamSessions[g];refresh();return}
 const input=e.target.closest("[data-pot-field]");if(input){const g=games.find(x=>x.id===input.dataset.game);if(!g)return;g[input.dataset.potField]=Math.max(0,Number(input.value)||0);save(KEYS.games,games);renderGames();renderHome()}
});
$("games-list").addEventListener("click",e=>{
 const open=e.target.closest("[data-open-game]");if(open){page("games");setTimeout(()=>$(`game-card-${CSS.escape(open.dataset.openGame)}`)?.scrollIntoView({behavior:"smooth"}),20);return}
 const sa=e.target.closest("[data-select-all]"),ca=e.target.closest("[data-clear-all]");if(!sa&&!ca)return;const g=(sa||ca).dataset.selectAll||(sa||ca).dataset.clearAll;attendance[g]=sa?players().map(p=>p.id):[];delete teamSessions[g];refresh()
});
$("home-games-list").addEventListener("click",e=>{const b=e.target.closest("[data-open-game]");if(b){page("games");setTimeout(()=>$(`game-card-${CSS.escape(b.dataset.openGame)}`)?.scrollIntoView({behavior:"smooth"}),20)}});
$("toggle-game-form").addEventListener("click",()=>$("game-form").hidden=!$("game-form").hidden);
$("cancel-game-form").addEventListener("click",()=>$("game-form").reset());
$("game-form").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.currentTarget);const g={id:`game-${Date.now()}`,title:String(d.get("title")).trim(),location:String(d.get("location")).trim(),date:d.get("date"),time:d.get("time"),registrationFee:REGISTRATION_FEE,courtFee:300,lightFee:130,sponsor:0};games.push(g);save(KEYS.games,games);e.currentTarget.reset();e.currentTarget.hidden=true;refresh();notice("Game added. Set its deductions and sponsorship in the pot calculator.")});
function memberCard(p,walkin){return `<article class="member-card"><div class="member-avatar">${esc(p.name.charAt(0).toUpperCase())}</div><h3>${esc(p.name)}</h3><p>${walkin?"Temporary walk-in":"Regular club member"}</p>${walkin?`<button class="button secondary" data-remove-walkin="${esc(p.id)}">Remove walk-in</button>`:""}</article>`}
function renderMembers(){$("regular-count").textContent=regularPlayers.length;$("walkin-count").textContent=walkIns.length;$("regular-members-list").innerHTML=regularPlayers.map(p=>memberCard(p,false)).join("");$("walkin-members-list").innerHTML=walkIns.length?walkIns.map(p=>memberCard(p,true)).join(""):'<div class="empty-state">No walk-ins added yet.</div>'}
$("walkin-form").addEventListener("submit",e=>{e.preventDefault();const name=$("walkin-name").value.trim();if(!name)return;if(players().some(p=>p.name.toLowerCase()===name.toLowerCase())){notice("That name is already in the roster.",true);return}walkIns.push({id:`walkin-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,type:"walkin"});save(KEYS.walkins,walkIns);$("walkin-name").value="";refresh();notice(`${name} added.`)});
$("walkin-members-list").addEventListener("click",e=>{const b=e.target.closest("[data-remove-walkin]");if(!b)return;const id=b.dataset.removeWalkin;if(!confirm("Remove this walk-in from the roster and all attendance lists?"))return;walkIns=walkIns.filter(p=>p.id!==id);Object.keys(attendance).forEach(g=>attendance[g]=(attendance[g]||[]).filter(x=>x!==id));Object.keys(eligibility).forEach(g=>Object.keys(eligibility[g]||{}).forEach(pos=>eligibility[g][pos]=eligibility[g][pos].filter(x=>x!==id)));Object.keys(teamSessions).forEach(g=>delete teamSessions[g]);save(KEYS.walkins,walkIns);save(KEYS.attendance,attendance);save(KEYS.eligibility,eligibility);refresh()});

const gameSelect=$("roulette-game"),positionSelect=$("wheel-position"),canvas=$("wheel"),ctx=canvas.getContext("2d");
let teamSessions={}, eligibilityStep=0;
function renderGameOptions(){const old=gameSelect.value;gameSelect.innerHTML=games.map(g=>`<option value="${esc(g.id)}">${esc(g.title)} — ${esc(g.date)}</option>`).join("");if(games.some(g=>g.id===old))gameSelect.value=old;positionSelect.innerHTML=POSITIONS.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join("")}
function currentGame(){return gameSelect.value}
function activeSession(){return teamSessions[currentGame()]||null}
function currentTeam(){const s=activeSession();return s?.teams[s.teamIndex]||null}
function currentSlot(){const team=currentTeam();return team?.slots.find(slot=>!slot.player)||null}
function assignedIds(){const s=activeSession();if(!s)return new Set();return new Set(s.teams.flatMap(t=>t.slots.filter(slot=>slot.player).map(slot=>slot.player.id)))}
function eligibleIds(g,pos){const ids=(attendance[g]||[]).filter(id=>!!player(id));const stored=eligibility[g]?.[pos];return Array.isArray(stored)?stored.filter(id=>ids.includes(id)):[]}
function teamPlan(playerCount){const count=findTeamCount(playerCount);if(!count)return {count:0,sizes:[],required:Object.fromEntries(POSITIONS.map(p=>[p,0]))};const sizes=Array.from({length:count},(_,i)=>Math.floor(playerCount/count)+(i<playerCount%count?1:0));const required=Object.fromEntries(POSITIONS.map(pos=>[pos,sizes.filter(size=>rolesForTeamSize(size).includes(pos)).length]));return {count,sizes,required}}
function selectedInOtherPositions(g,pos){return new Set(POSITIONS.filter(p=>p!==pos).flatMap(p=>eligibleIds(g,p)))}
function renderEligibility(){
 const g=currentGame(),list=$("position-eligibility-list"),present=joined(g);$("roulette-eligible").textContent=`${present.length} player${present.length===1?"":"s"} checked in for this game.`;
 if(!g){list.innerHTML='<div class="empty-state">Add a game first.</div>';return}
 const plan=teamPlan(present.length),activePositions=POSITIONS.filter(p=>(plan.required[p]||0)>0);
 if(!activePositions.length){list.innerHTML='<div class="empty-state">Check in at least 10 players to set position eligibility.</div>';return}
 eligibilityStep=Math.max(0,Math.min(eligibilityStep,activePositions.length-1));
 const pos=activePositions[eligibilityStep],ids=eligibleIds(g,pos),taken=selectedInOtherPositions(g,pos),need=plan.required[pos]||0;
 const choices=present.map(p=>{const selected=ids.includes(p.id),usedElsewhere=taken.has(p.id),atLimit=ids.length>=need&&!selected;const disabled=usedElsewhere||atLimit||Boolean(activeSession());return `<label class="eligibility-check ${usedElsewhere?"eligibility-unavailable":""}"><input type="checkbox" data-eligibility="${esc(pos)}" data-player="${esc(p.id)}" ${selected?"checked":""} ${disabled?"disabled":""}><span>${esc(p.name)}${usedElsewhere?" · selected for another position":""}</span></label>`}).join("");
 const completed=activePositions.filter(p=>eligibleIds(g,p).length===(plan.required[p]||0)).length;
 list.innerHTML=`<div class="eligibility-stepper"><div class="eligibility-step-top"><span class="step-count">Position ${eligibilityStep+1} of ${activePositions.length}</span><span class="step-progress"><span id="eligibility-completed-count">${completed}</span> of ${activePositions.length} positions ready</span></div><div class="eligibility-progress"><span style="width:${((eligibilityStep+1)/activePositions.length)*100}%"></span></div><div class="position-eligibility-card"><h4>${esc(pos)}</h4><p class="position-requirement">Select <strong>${need}</strong> player${need===1?"":"s"} for this position. <span class="muted">Selected: <span id="eligibility-selected-count">${ids.length}</span>/${need}</span></p><p class="small-text muted">Players selected for another position are disabled here. Positions that no team needs are automatically skipped.</p><div class="eligibility-players">${choices||'<p class="muted">No checked-in players.</p>'}</div></div><div class="eligibility-step-actions"><button class="button secondary" id="eligibility-prev" ${eligibilityStep===0?"disabled":""}>← Previous position</button><button class="button primary" id="eligibility-next" ${eligibilityStep===activePositions.length-1?"disabled":""}>Next position →</button></div><p class="small-text muted">The required count is based on the actual team sizes. Roulette starts once every required position has exactly the right number of eligible players.</p></div>`;
 const prev=$("eligibility-prev"),next=$("eligibility-next");if(prev)prev.addEventListener("click",()=>{eligibilityStep=Math.max(0,eligibilityStep-1);renderEligibility()});if(next)next.addEventListener("click",()=>{const currentIds=eligibleIds(currentGame(),pos);if(currentIds.length!==need){notice(`Select exactly ${need} player${need===1?"":"s"} for ${pos} before moving on.`,true);return}eligibilityStep=Math.min(activePositions.length-1,eligibilityStep+1);renderEligibility()});
}
function eligibilityReady(g){const present=joined(g),plan=teamPlan(present.length);return plan.count>0&&POSITIONS.every(pos=>eligibleIds(g,pos).length===(plan.required[pos]||0))}
function drawWheel(names,angle=0,highlightIndex=null){
 const size=canvas.width,center=size/2,radius=size/2-8;ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(center,center);ctx.rotate(angle);
 if(!names.length){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fillStyle="#252525";ctx.fill();ctx.fillStyle="#aaa";ctx.font="bold 18px Arial";ctx.textAlign="center";ctx.fillText("NO PLAYERS LEFT",0,5);ctx.restore();return}
 const arc=Math.PI*2/names.length,colors=["#facc15","#242424","#e9b90e","#383838","#d8a900","#191919","#b89100"];
 names.forEach((name,i)=>{const start=i*arc-Math.PI/2,isPicked=i===highlightIndex;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,start,start+arc);ctx.closePath();ctx.fillStyle=isPicked?"#00e5ff":colors[i%colors.length];ctx.fill();ctx.strokeStyle=isPicked?"#ffffff":"#101010";ctx.lineWidth=isPicked?7:3;if(isPicked){ctx.save();ctx.shadowColor="#00e5ff";ctx.shadowBlur=28;ctx.stroke();ctx.restore()}else ctx.stroke();ctx.save();ctx.rotate(start+arc/2);ctx.textAlign="right";ctx.fillStyle=isPicked?"#061317":i%2===0?"#111":"#fff";ctx.font=`bold ${Math.max(13,Math.min(23,260/names.length))}px Arial`;const label=name.length>18?name.slice(0,16)+"…":name;ctx.lineWidth=isPicked?2:3;ctx.strokeStyle=isPicked?"#ffffff":i%2===0?"#facc15":"#101010";ctx.strokeText(label,radius-22,5);ctx.fillText(label,radius-22,5);ctx.restore()});
 ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.fillStyle="#101010";ctx.fill();ctx.strokeStyle="#facc15";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#facc15";ctx.textAlign="center";ctx.font="bold 16px Arial";ctx.fillText("SH",0,6);ctx.restore()
}
function namesForCurrentDraw(){const g=currentGame(),slot=currentSlot(),used=assignedIds();const pos=slot?slot.role:positionSelect.value;return {pos,ids:eligibleIds(g,pos).filter(id=>!used.has(id)),slot}}
function showPickedResult(names,index,after){
 wheelHighlightNames=[...names];wheelHighlightIndex=index;clearTimeout(wheelResultTimer);renderWheel();
 wheelResultTimer=setTimeout(()=>{wheelHighlightNames=null;wheelHighlightIndex=null;renderWheel();if(typeof after==="function")after()},1000);
}
function renderWheel(){
 const s=activeSession(),draw=namesForCurrentDraw(),names=draw.ids.map(id=>player(id)?.name).filter(Boolean);
 if(draw.slot){positionSelect.value=draw.pos;positionSelect.disabled=true;$("current-team-label").textContent=`Team ${s.teamIndex+1} · ${s.teamIndex+1} of ${s.teams.length}`;$("current-slot-label").textContent=`Next position: ${draw.pos} · ${draw.slot.player?"filled":"waiting for draw"}`}
 else if(s){positionSelect.disabled=true;$("current-team-label").textContent=`Team ${s.teamIndex+1} completed`;$("current-slot-label").textContent="Review the team result to continue."}
 else{positionSelect.disabled=false;$("current-team-label").textContent="Team roulette not started";$("current-slot-label").textContent="Choose eligible players for each position, then start roulette."}
 drawWheel(wheelHighlightNames||names,wheelAngle,wheelHighlightIndex);$("spin-wheel").disabled=spinning||!s||!draw.slot||!names.length;
 if(!s)$("wheel-result").textContent="Start team roulette to begin.";else if(!draw.slot)$("wheel-result").textContent="Team complete. Review the team result.";else if(!names.length)$("wheel-result").textContent=`No eligible players left for ${draw.pos}. Check the eligibility boxes above.`;else $("wheel-result").textContent=`${names.length} eligible player${names.length===1?"":"s"} left for ${draw.pos}.`;
 $("generate-teams").textContent=!s?"Start team roulette":s.status==="paused"?"Continue team roulette":s.status==="complete"?"Teams completed":"Roulette in progress";$("generate-teams").disabled=spinning||Boolean(s&&(s.status==="active"||s.status==="complete"));
}
function renderTeams(){const g=currentGame(),container=$("teams-overview"),s=teamSessions[g];if(!s){container.innerHTML='<div class="empty-state">Your team rosters will appear here after you start the roulette.</div>';return}
 container.innerHTML=s.teams.map((team,i)=>{const assigned=team.slots.filter(x=>x.player),done=assigned.length===team.slots.length;return `<article class="team-card ${done?"team-complete":""}"><h3>Team ${i+1} ${done?"✓":""}</h3><div class="team-count">${assigned.length}/${team.slots.length} players ${done?"· Complete":"· In progress"}</div>${team.captain?`<div class="captain-tag">★ Captain: ${esc(team.captain.name)}</div>`:""}<ol>${team.slots.map(entry=>`<li class="${entry.player?"":"slot-empty"}">${entry.player?esc(entry.player.name):"Waiting for draw"} <span>— ${esc(entry.role)}</span></li>`).join("")}</ol></article>`}).join("");
 const completed=s.teams.filter(t=>t.slots.every(slot=>slot.player)).length;$("team-status").textContent=s.status==="complete"?`${s.teams.length} teams completed. Every team has a randomly assigned captain.`:`${completed} of ${s.teams.length} teams completed. Draw players one at a time to fill the current team.`
}
function renderRoulette(){renderGameOptions();renderEligibility();renderWheel();renderTeams();const n=joined(currentGame()).length;const session=activeSession();$("generate-teams").disabled=n<10||spinning||Boolean(session&&(session.status==="active"||session.status==="complete"))||(!session&&!eligibilityReady(currentGame()));if(n<10)$("team-status").textContent=`${n} checked-in players. At least 10 are needed to make teams of 5–7.`;else if(!session&&!eligibilityReady(currentGame()))$("team-status").textContent="Finish the eligibility steps first. Each position needs the exact number shown before roulette can start."}
gameSelect.addEventListener("change",()=>{eligibilityStep=0;renderRoulette()});
positionSelect.addEventListener("change",renderWheel);
function updateEligibilityCounters(){
 const g=currentGame(),present=joined(g),plan=teamPlan(present.length),activePositions=POSITIONS.filter(p=>(plan.required[p]||0)>0);
 const pos=activePositions[eligibilityStep];if(!pos)return;
 const ids=eligibleIds(g,pos),need=plan.required[pos]||0,taken=selectedInOtherPositions(g,pos);
 const countEl=$("eligibility-selected-count");if(countEl)countEl.textContent=ids.length;
 const completed=activePositions.filter(p=>eligibleIds(g,p).length===(plan.required[p]||0)).length;
 const completedEl=$("eligibility-completed-count");if(completedEl)completedEl.textContent=completed;
 $("position-eligibility-list").querySelectorAll("[data-eligibility]").forEach(input=>{
   const selected=ids.includes(input.dataset.player),usedElsewhere=taken.has(input.dataset.player),atLimit=ids.length>=need&&!selected;
   input.disabled=Boolean(activeSession())||usedElsewhere||atLimit;
   const label=input.closest(".eligibility-check");if(label){label.classList.toggle("eligibility-unavailable",usedElsewhere);const nameSpan=label.querySelector("span");if(nameSpan){const p=player(input.dataset.player);nameSpan.textContent=(p?.name||"")+(usedElsewhere?" · selected for another position":"")}}
 });
 const ready=eligibilityReady(g),session=activeSession();$("generate-teams").disabled=present.length<10||spinning||Boolean(session&&(session.status==="active"||session.status==="complete"))||(!session&&!ready);
 if(present.length>=10&&!session&&!ready)$("team-status").textContent="Finish the eligibility steps first. Each position needs the exact number shown before roulette can start.";
}
$("position-eligibility-list").addEventListener("change",e=>{const cb=e.target.closest("[data-eligibility]");if(!cb)return;const g=currentGame(),pos=cb.dataset.eligibility,id=cb.dataset.player;eligibility[g]??={};if(!Array.isArray(eligibility[g][pos]))eligibility[g][pos]=[];const need=teamPlan(joined(g).length).required[pos]||0;if(cb.checked){if(selectedInOtherPositions(g,pos).has(id)){cb.checked=false;notice("That player is already selected for another position.",true);return}if(eligibility[g][pos].length>=need){cb.checked=false;notice(`Only ${need} player${need===1?"":"s"} can be selected for ${pos}.`,true);return}if(!eligibility[g][pos].includes(id))eligibility[g][pos].push(id)}else eligibility[g][pos]=eligibility[g][pos].filter(x=>x!==id);save(KEYS.eligibility,eligibility);updateEligibilityCounters()});
$("select-all-eligible").addEventListener("click",()=>{const g=currentGame();if(!g)return;eligibility[g]??={};const plan=teamPlan(joined(g).length),activePositions=POSITIONS.filter(p=>(plan.required[p]||0)>0),pos=activePositions[eligibilityStep],need=plan.required[pos]||0,blocked=selectedInOtherPositions(g,pos),current=eligibleIds(g,pos),available=joined(g).filter(p=>!blocked.has(p.id)&&!current.includes(p.id));eligibility[g][pos]=[...current,...available.slice(0,Math.max(0,need-current.length)).map(p=>p.id)];save(KEYS.eligibility,eligibility);renderEligibility();renderWheel();notice(`Selected up to ${need} eligible players for ${pos}.`)});
$("reset-eligibility").addEventListener("click",()=>{const g=currentGame();if(!g)return;eligibility[g]=Object.fromEntries(POSITIONS.map(pos=>[pos,[]]));eligibilityStep=0;save(KEYS.eligibility,eligibility);renderEligibility();renderWheel();notice("All position boxes cleared. Start again from Setter.")});
function secureIndex(max){if(max<=1)return 0;try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%max}catch{return Math.floor(Math.random()*max)}}
function findTeamCount(n){for(let count=Math.ceil(n/7);count<=Math.floor(n/5);count++)return count;return 0}
function startOrResumeTeams(){const g=currentGame(),all=joined(g),existing=teamSessions[g];if(existing){if(existing.status==="paused"){const finished=existing.teams[existing.teamIndex]?.slots.every(slot=>slot.player);if(finished){if(existing.teamIndex>=existing.teams.length-1){existing.status="complete";renderRoulette();notice("All teams are complete, with a captain assigned to each team.");return}existing.teamIndex++}existing.status="active";renderRoulette();notice("Team roulette resumed. Continue with the next position.")}return}if(all.length<10){notice("You need at least 10 checked-in players to create teams of 5–7.",true);return}if(!eligibilityReady(g)){notice("Finish the position-by-position eligibility setup first. Each position must have the exact number of selected players.",true);return}const count=findTeamCount(all.length);if(!count){notice("This player count cannot be split into teams of 5–7.",true);return}const sizes=Array.from({length:count},(_,i)=>Math.floor(all.length/count)+(i<all.length%count?1:0));const roles=teamSize=>rolesForTeamSize(teamSize);teamSessions[g]={teams:sizes.map(size=>({slots:roles(size).map(role=>({role,player:null})),captain:null})),teamIndex:0,status:"active"};renderRoulette();notice(`Team roulette started for ${count} teams. Spin to choose the first player.`)}
$("generate-teams").addEventListener("click",startOrResumeTeams);
function showTeamModal(){const s=activeSession(),team=currentTeam();if(!s||!team)return;const teamName=`Team ${s.teamIndex+1}`;$("team-modal-title").textContent=`Here's ${teamName}!`;
 $("team-modal-subtitle").textContent=`${team.slots.length} players · Captain: ${team.captain?.name||"Assigned automatically"}`;
 $("team-modal-roster").innerHTML=`<ol>${team.slots.map(slot=>`<li><strong>${esc(slot.player?.name||"—")}</strong><span>${esc(slot.role)}</span>${slot.player?.id===team.captain?.id?'<em>CAPTAIN</em>':""}</li>`).join("")}</ol>`;
 const final=s.teamIndex>=s.teams.length-1;$("next-team-modal").textContent=final?"OK · Finish teams":"OK · Next team";$("team-modal").hidden=false;$("exit-team-modal").focus();
}
function closeTeamModal(){ $("team-modal").hidden=true }
function finishTeamIfComplete(team){
 if(!team||!team.slots.every(slot=>slot.player))return false;
 if(!team.captain){const teamPlayers=team.slots.map(x=>x.player);team.captain=teamPlayers[secureIndex(teamPlayers.length)]}
 return true;
}
function autoFillFinalTeamIfCertain(){
 const s=activeSession();if(!s||s.teamIndex!==s.teams.length-1)return false;
 const team=currentTeam();if(!team||team.slots.every(slot=>slot.player))return false;
 const used=assignedIds(),assignments=[];
 for(const slot of team.slots.filter(x=>!x.player)){
  const candidates=eligibleIds(currentGame(),slot.role).filter(id=>!used.has(id)&&!assignments.some(a=>a.id===id));
  if(candidates.length!==1)return false;
  assignments.push({slot,id:candidates[0]});
 }
 assignments.forEach(a=>{a.slot.player=player(a.id)});
 finishTeamIfComplete(team);s.status="last-team-ready";$("wheel-result").textContent="The remaining players have been assigned automatically — no spin needed.";renderTeams();renderWheel();showTeamModal();return true;
}
$("exit-team-modal").addEventListener("click",()=>{const s=activeSession();closeTeamModal();if(s&&s.status!=="complete"){const finished=s.teams[s.teamIndex]?.slots.every(slot=>slot.player);s.status=finished?(s.teamIndex===s.teams.length-1?"complete":"paused"):"paused"}renderRoulette();notice("Roulette exited. Your team results remain visible; continue when ready.")});
$("next-team-modal").addEventListener("click",()=>{const s=activeSession();if(!s)return;closeTeamModal();if(s.teamIndex>=s.teams.length-1){s.status="complete";renderRoulette();notice("All teams are complete, with a captain assigned to each team.");return}s.teamIndex++;s.status="active";renderRoulette();if(autoFillFinalTeamIfCertain())return;notice(`Now drawing Team ${s.teamIndex+1}.`)});
$("spin-wheel").addEventListener("click",()=>{
 if(spinning)return;const g=currentGame(),s=activeSession(),team=currentTeam(),slot=currentSlot();if(!s||!team||!slot){notice("Start team roulette first, then draw a player for the current position.",true);return}
 const draw=namesForCurrentDraw(),ids=draw.ids,names=ids.map(id=>player(id)?.name).filter(Boolean);if(!names.length){notice(`No eligible players left for ${slot.role}. Select at least one remaining player in that position's eligibility boxes.`,true);return}
 const idx=secureIndex(names.length),chosenId=ids[idx],chosenName=player(chosenId).name;
 if(names.length===1){
  slot.player=player(chosenId);const assigned=team.slots.filter(x=>x.player).length;finishTeamIfComplete(team);wheelAngle=0;renderTeams();renderWheel();
  showPickedResult(names,0,()=>{
   if(assigned===team.slots.length){const sNow=activeSession();if(sNow&&sNow.teamIndex===sNow.teams.length-1)sNow.status="last-team-ready";showTeamModal()}
   else if(s.teamIndex===s.teams.length-1)autoFillFinalTeamIfCertain();
  });
  return;
 }
 const arc=2*Math.PI/names.length;
 // Aim the selected sector at the top pointer after several full rotations.
 const targetBase=(-(idx*arc+arc/2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);const start=((wheelAngle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);const delta=((targetBase-start+Math.PI*2)%(Math.PI*2))+Math.PI*2*7;const duration=5200,begin=performance.now();spinning=true;wheelHighlightNames=null;wheelHighlightIndex=null;clearTimeout(wheelResultTimer);$("wheel").parentElement.classList.add("is-spinning");$("spin-wheel").disabled=true;positionSelect.disabled=true;
 function frame(now){
  const t=Math.min(1,(now-begin)/duration);
  // A natural, continuous spin: fast at first, then smoothly and steadily decelerating to a stop.
  const ease=1-Math.pow(1-t,3);
  wheelAngle=start+delta*ease;drawWheel(names,wheelAngle);
  if(t<1){requestAnimationFrame(frame);return}
  spinning=false;$("wheel").parentElement.classList.remove("is-spinning");wheelAngle=targetBase;slot.player=player(chosenId);const assigned=team.slots.filter(x=>x.player).length;
  if(assigned===team.slots.length){const teamPlayers=team.slots.map(x=>x.player);team.captain=teamPlayers[secureIndex(teamPlayers.length)];}
  renderTeams();renderWheel();
  showPickedResult(names,idx,()=>{
   if(assigned===team.slots.length){const sNow=activeSession();if(sNow&&sNow.teamIndex===sNow.teams.length-1)sNow.status="last-team-ready";showTeamModal()}
  });
 }
 requestAnimationFrame(frame)
});
$("reset-position-draws").addEventListener("click",()=>{if(activeSession()){notice("To restart team selection, use Clear teams and start again.",true);return}wheelAngle=0;wheelHighlightNames=null;wheelHighlightIndex=null;clearTimeout(wheelResultTimer);$("wheel").parentElement.classList.remove("is-spinning");renderWheel();notice("Wheel reset.")});
$("clear-teams").addEventListener("click",()=>{const g=currentGame();if(spinning)return;if(!confirm("Clear all team assignments for this game and start over?"))return;delete teamSessions[g];wheelAngle=0;wheelHighlightNames=null;wheelHighlightIndex=null;clearTimeout(wheelResultTimer);closeTeamModal();renderRoulette();notice("Team assignments cleared. You can start roulette again.")});
function init(){renderHome();renderGames();renderMembers();renderRoulette()}
init();