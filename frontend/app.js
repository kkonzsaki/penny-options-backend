console.log("App loaded");

let candidates=[];
let options=[];
let filter="all";
let scanner=null;
let chart=null;

/* THEME */
const themeBtn=document.getElementById("themeToggle");
if(localStorage.theme==="light"){
document.body.classList.add("light");
}
themeBtn.onclick=()=>{
document.body.classList.toggle("light");
localStorage.theme=document.body.classList.contains("light")?"light":"dark";
};

/* LOAD CANDIDATES */
document.getElementById("loadCandidates").onclick=async()=>{
const out=document.getElementById("candidates");
out.textContent="Loading...";
try{
const r=await fetch(`${API_BASE}/api/v1/candidates`);
const d=await r.json();
candidates=d.candidates||[];
renderCandidates();
}catch{
out.textContent="Failed to load candidates";
}
};

function renderCandidates(){
const min=Number(minPrice.value)||0;
const max=Number(maxPrice.value)||Infinity;
candidates=candidates.filter(c=>c.price>=min&&c.price<=max);
candidatesDiv.innerHTML=candidates.map(c=>`
<div>
<a href="#" onclick="loadOptions('${c.symbol}')">${c.symbol}</a>
 $${c.price}
</div>`).join("");
}

/* LOAD OPTIONS */
window.loadOptions=async(sym)=>{
const out=document.getElementById("options");
out.textContent="Loading options...";
try{
const r=await fetch(`${API_BASE}/api/v1/options/${sym}`);
const d=await r.json();
options=(d.options||[]).filter(o=>o.ask);
renderOptions();
}catch{
out.textContent="Options unavailable";
}
};

function filterType(t){filter=t;renderOptions();}

function renderOptions(){
const out=document.getElementById("options");
let list=options.filter(o=>filter==="all"||o.type===filter);
out.innerHTML=list.map(o=>`
<div class="${o.type}">
${o.type.toUpperCase()} ${o.strike} ${o.expiration}
$${o.ask}
Δ${o.delta?.toFixed(2)||"?"}
Γ${o.gamma?.toFixed(2)||"?"}
Θ${o.theta?.toFixed(2)||"?"}
</div>`).join("");
if(list[0]) drawPayoff(list[0]);
}

/* PAYOFF */
function drawPayoff(o){
const ctx=document.getElementById("payoffChart");
let x=[],y=[];
for(let p=o.strike*0.7;p<=o.strike*1.3;p+=0.5){
x.push(p);
y.push(o.type==="call"
?Math.max(0,p-o.strike)-o.ask
:Math.max(0,o.strike-p)-o.ask);
}
if(chart)chart.destroy();
chart=new Chart(ctx,{type:"line",data:{labels:x,datasets:[{data:y}]}})
}

/* STRATEGY BUILDER */
document.getElementById("buildStrategy").onclick=()=>{
const type=strategyType.value;
if(!options.length)return;
let msg="";
if(type==="call") msg="Long Call: Unlimited upside";
if(type==="put") msg="Long Put: Downside protection";
if(type==="spread") msg="Bull Call Spread: Limited risk";
strategyOutput.textContent=msg;
};

/* SCANNER */
document.getElementById("scannerToggle").onclick=()=>{
const s=document.getElementById("scannerStatus");
if(scanner){
clearInterval(scanner);
scanner=null;
s.textContent="Stopped";
return;
}
s.textContent="Running";
scanner=setInterval(()=>{
document.getElementById("loadCandidates").click();
scannerLog.textContent="Scan @ "+new Date().toLocaleTimeString();
},60000);
};
