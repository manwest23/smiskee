'use strict';
/* SMISKEE — employee motivation app.
   Two modes:
   - cloud: Supabase is configured in config.js. Real accounts (staff ID + password),
            data in Postgres, and every points rule runs inside the database.
   - demo:  "Try with a sample employee", or no database configured. Everything is
            kept in this browser only, with sample history. */

/* ---------- icons ---------- */
const P={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
pulse:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
game:'<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14h.01"/>',
gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8 4.5 7.5 8 12 8zm0 0s1.5-4 4-3.5S16.5 8 12 8"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
flame:'<path d="M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0C7 10 9 8.5 9 8.5s.5 2.5 2 3c0-3 1-6.5 1-8.5z"/>',
chev:'<path d="m9 6 6 6-6 6"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5"/>',
chart:'<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
check:'<path d="m5 12 5 5 9-10"/>',
trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
cal:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
heart:'<path d="M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.5-7.5 10-7.5 10z"/>',
addhome:'<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>',
share:'<path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
dots:'<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
plusbox:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>'
};
const I=(n,c='')=>`<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const MARK='<span class="mark"><svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="2" fill="#f1f6f3"/><path d="M6 12.5h12a6 6 0 0 1-12 0z" fill="none" stroke="#f1f6f3" stroke-width="1.8" stroke-linejoin="round"/></svg></span>';

/* ---------- utilities ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pdate=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
const monday=d=>addDays(d,-((d.getDay()+6)%7));
/* All dates follow Malaysia time, matching the database. */
const TZ='Asia/Kuala_Lumpur';
function nowKL(){
  try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const g=t=>+p.find(x=>x.type===t).value;return new Date(g('year'),g('month')-1,g('day'),g('hour'),g('minute'))}catch(e){return new Date()}
}
const klKey=iso=>dkey(new Date(new Date(iso).toLocaleString('en-US',{timeZone:TZ})));
const today=()=>dkey(nowKL());
const fmt=n=>Number(n).toLocaleString('en-MY');
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW=['M','T','W','T','F','S','S'];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const firstName=n=>String(n||'').trim().split(/\s+/)[0];
const band=s=>s<=4?'calm':s<=6?'press':'high';
const bandLabel=s=>s<=2?'Calm':s<=4?'Manageable':s<=6?'Under pressure':s<=8?'Stressed':'Overwhelmed';

/* ---------- content ---------- */
const MOODS=[{id:'great',face:'◠◡◠',label:'Great'},{id:'good',face:'◡',label:'Good'},{id:'okay',face:'—',label:'Okay'},{id:'tense',face:'≈',label:'Tense'},{id:'drained',face:'︵',label:'Drained'}];
const TAGS=['Sales targets','Customer queue','Compliance & audit','System issues','Workload','Month-end closing','Personal'];
const NOTES=[
 {h:'Make today count.',b:'Every contribution matters. Keep growing, keep inspiring.'},
 {h:'Progress over perfection.',b:'A good day is built from small things done well, one customer at a time.'},
 {h:'Small wins add up.',b:'Notice what went right today, even if it was just one thing.'},
 {h:'You don\'t carry it alone.',b:'Your team is here. Ask for help early, offer it often.'},
 {h:'Pace yourself.',b:'Busy branches need steady people. Take your breaks, they are part of the work.'}];
const QUOTES=[
 {q:'Success is the sum of small efforts, repeated day in and day out.',a:'Robert Collier'},
 {q:'Well done is better than well said.',a:'Benjamin Franklin'},
 {q:'A journey of a thousand miles begins with a single step.',a:'Lao Tzu'},
 {q:'Do what you can, with what you have, where you are.',a:'Theodore Roosevelt'}];
const TIPS={
 'Sales targets':'Break your monthly target into a daily number and count each day you hit it, not just month-end.',
 'Customer queue':'Take a two-minute reset between peak-hour customers: stand, stretch, drink some water.',
 'Compliance & audit':'Block one focused hour early in the week to clear audit and documentation items before they pile up.',
 'System issues':'Report system issues to IT as soon as they happen, and write down the workaround so you only solve it once.',
 'Workload':'List your top three tasks each morning, and agree priorities with your leader when everything feels urgent.',
 'Month-end closing':'Start reconciliations a few days before month-end so the last day is for review, not rushing.',
 'Personal':'Protect your evenings this week. Leave work at work where you can, and talk to someone you trust.'};
const TEAM_TIPS={
 'Sales targets':'Review targets together on Monday and celebrate daily progress, not only month-end totals.',
 'Customer queue':'Stagger breaks so no one works a full peak hour without a pause.',
 'Compliance & audit':'Set aside a shared "quiet hour" this week for documentation and audit items.',
 'System issues':'Collect the week\'s system issues in one list and raise them with IT in a single meeting.',
 'Workload':'Hold a short stand-up to re-balance tasks, and agree what can wait until next week.',
 'Month-end closing':'Split reconciliation tasks early in the week so the last day is for review, not rushing.',
 'Personal':'Remind the team about flexible arrangements and the Employee Assistance Programme.'};
const QUIZ=[
 {q:'What is the maximum PIDM deposit insurance coverage per depositor, per member bank?',o:['RM100,000','RM250,000','RM500,000','RM1,000,000'],a:1,e:'PIDM protects deposits up to RM250,000 per depositor per member bank.'},
 {q:'What does OPR stand for in Bank Negara Malaysia\'s monetary policy?',o:['Official Prime Rate','Overnight Policy Rate','Open Price Ratio','Operating Profit Return'],a:1,e:'The Overnight Policy Rate is the benchmark rate set by Bank Negara Malaysia.'},
 {q:'In banking, KYC stands for…',o:['Keep Your Cash','Know Your Customer','Key Yield Calculation','Know Your Credit'],a:1,e:'Know Your Customer checks verify who a customer is before and during the relationship.'},
 {q:'CASA refers to which type of deposits?',o:['Current and Savings Accounts','Credit and Secured Assets','Cash and Securities Assets','Corporate Account Settlements'],a:0,e:'Current Account Savings Account deposits are a low-cost funding source for banks.'},
 {q:'In Islamic banking, a Murabahah contract is…',o:['A partnership in profit and loss','A safekeeping arrangement','A cost-plus-profit sale','A leasing agreement'],a:2,e:'Murabahah is a sale where the bank discloses its cost and an agreed profit margin.'},
 {q:'Which Islamic banking concept is based on safekeeping?',o:['Wadiah','Ijarah','Musharakah','Tawarruq'],a:0,e:'Wadiah means safekeeping. Many Islamic savings and current accounts use it.'},
 {q:'What can DuitNow transfers use instead of an account number?',o:['Only a debit card number','Mobile number, MyKad or business registration number','Branch code','Customer\'s email only'],a:1,e:'DuitNow lets customers send money to a mobile number, MyKad number or business registration number.'},
 {q:'A customer gets a call from "the bank" asking for their TAC. What should they do?',o:['Read it out quickly','Share only the first 3 digits','Never share it and hang up','Send it by SMS instead'],a:2,e:'Banks never ask for a TAC or OTP. Sharing it lets scammers authorise transactions.'},
 {q:'AML stands for…',o:['Automated Money Ledger','Anti-Money Laundering','Asset Management Licence','Annual Market Limit'],a:1,e:'Anti-Money Laundering rules help detect and report suspicious transactions.'},
 {q:'Basel III standards mainly deal with…',o:['Bank capital and liquidity','Card design','Branch opening hours','Mobile app security'],a:0,e:'Basel III sets international standards for bank capital adequacy and liquidity.'},
 {q:'What is "Riba" in Islamic finance?',o:['A profit-sharing ratio','Interest, which is prohibited','A type of takaful','A zakat calculation'],a:1,e:'Riba refers to interest or usury, which Islamic finance prohibits.'},
 {q:'A Fixed Deposit (FD) usually pays…',o:['A variable daily rate','A set rate for a fixed tenure','No interest at all','Interest only on withdrawal day'],a:1,e:'An FD locks a sum for a set tenure at an agreed rate.'}];
const REWARDS=[
 {id:'zus',brand:'ZUS Coffee',cat:'Coffee',val:15,pts:900,c:'#1d3f8c'},
 {id:'arabica',brand:'% Arabica',cat:'Coffee',val:20,pts:1200,c:'#3a3a3a'},
 {id:'larasuka',brand:'Larasuka Coffee',cat:'Coffee',val:15,pts:850,c:'#7b4a2b'},
 {id:'rembayung',brand:'Rembayung',cat:'Food',val:20,pts:1300,c:'#8a3b2a'},
 {id:'sukiya',brand:'Sukiya',cat:'Food',val:20,pts:1400,c:'#b8312f'},
 {id:'bbqtown',brand:'BBQ Town',cat:'Food',val:20,pts:1500,c:'#a3501b'},
 {id:'kyochon',brand:'Kyochon',cat:'Food',val:20,pts:1550,c:'#5b3a1e'},
 {id:'lunch',brand:'Extended lunch (1 hour)',cat:'Time off',val:null,pts:2000,c:'#315c4c',perk:'1 HR'},
 {id:'halfday',brand:'Half-day leave',cat:'Time off',val:null,pts:5000,c:'#183b32',perk:'½ DAY'}];
const DEPTS=['Retail Banking','Digital Banking','Operations','Credit & Risk','Treasury','Compliance'];
const DEPT_BASE={'Retail Banking':18420,'Digital Banking':17240,'Operations':16300,'Credit & Risk':14750,'Treasury':12100,'Compliance':11600};
const GAME_TITLES={quiz:'Banking Knowledge Quiz',memory:'Memory Match',breath:'Focus breathing',brain:'Quick Brain Break'};
const SEG=[20,50,30,100,40,150,60,80];
const LEVEL_STEP=500;
const pointsFor=(g,s)=>{s=Math.max(0,s|0);return g==='quiz'?Math.min(s,5)*30:g==='memory'?(s<6?0:s<=10?100:s<=14?70:40):g==='breath'?80:g==='brain'?Math.min(s,5)*10:0};

/* ---------- backend ---------- */
const CFG=window.SMISKEE_CONFIG||{};
const sb=(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase)?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const EMAIL_DOMAIN=CFG.staffEmailDomain||'staff.smiskee.app';
const staffEmail=id=>normStaff(id).toLowerCase()+'@'+EMAIL_DOMAIN;
const normStaff=id=>{let s=String(id||'').trim().toUpperCase().replace(/\s+/g,'');if(/^[A-Z]{2}\d+$/.test(s))s=s.slice(0,2)+'-'+s.slice(2);return s};
const validStaff=id=>/^[A-Z]{2}-\d{3,6}$/.test(normStaff(id));

const KEY='smiskee-demo-v2';
let st=null;                       // current user's state (both modes use the same shape)
const cache={lb:null,lbAt:0,pulse:null,pulseAt:0,loading:{}};
const isCloud=()=>!!st&&st.mode==='cloud';
const saveLocal=()=>{if(st&&st.mode==='demo'){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}};
let draft=null, editing=false, rewardFilter='All', recapWeek='this', loginRole='employee', authMode='signin', loginErr={}, resetArm=false, G=null, timer=null, busy=false;

function seed(name,staffId,dept,role){
  const now=nowKL(), thisMon=monday(now), lastMon=addDays(thisMon,-7), prevMon=addDays(thisMon,-14);
  const checkins={}, plays=[], activity=[];
  const prev=[[5,'okay',['Sales targets']],[6,'tense',['Customer queue']],[6,'okay',['Workload']],[7,'tense',['Sales targets','Workload']],[5,'good',[]]];
  prev.forEach((c,i)=>checkins[dkey(addDays(prevMon,i))]={stress:c[0],mood:c[1],tags:c[2],note:''});
  const last=[[6,'okay',['Sales targets']],[7,'tense',['Customer queue','Workload']],[8,'drained',['Compliance & audit','Workload']],[6,'tense',['Workload']],[4,'good',[]]];
  last.forEach((c,i)=>checkins[dkey(addDays(lastMon,i))]={stress:c[0],mood:c[1],tags:c[2],note:''});
  const cur=[[6,'okay',['Workload']],[5,'okay',['Customer queue']],[7,'tense',['Month-end closing']],[5,'good',[]]];
  for(let i=0;i<4;i++){const d=addDays(thisMon,i); if(dkey(d)<dkey(now)) checkins[dkey(d)]={stress:cur[i][0],mood:cur[i][1],tags:cur[i][2],note:''}}
  const addP=(d,game,pts,title)=>{plays.push({d:dkey(d),game,pts});activity.push({d:dkey(d),ts:d.getTime()+9.25*36e5,title,sub:'',pts})};
  addP(addDays(lastMon,0),'quiz',120,'Banking Knowledge Quiz');
  addP(addDays(lastMon,1),'spin',50,'Spin & Win');
  addP(addDays(lastMon,2),'breath',80,'Focus breathing');
  addP(addDays(lastMon,3),'memory',100,'Memory Match');
  addP(addDays(lastMon,4),'session',240,'Leader round with Faizal Rahman');
  if(dkey(thisMon)<dkey(now)) addP(thisMon,'quiz',150,'Banking Knowledge Quiz');
  activity.push({d:dkey(addDays(lastMon,4)),ts:addDays(lastMon,4).getTime()+16.3*36e5,title:'Reward redeemed',sub:'ZUS Coffee RM15 voucher',pts:-900});
  activity.push({d:dkey(addDays(lastMon,3)),ts:addDays(lastMon,3).getTime()+11*36e5,title:'Team Player badge',sub:'Recognised by Nur Aisyah',pts:0});
  return {mode:'demo',v:2,user:{name,staffId:normStaff(staffId),dept,role},points:2840,lifetime:3340,checkins,plays,activity,
    keys:[],coupons:[{id:'c0',rid:'zus',brand:'ZUS Coffee',label:'RM15 voucher',code:'SMK-ZU5C-4K2Q',d:dkey(addDays(lastMon,4))}],
    intents:{},badges:['Team Player','Positive Energy','Innovation'],reminders:[],
    sessions:[
      {id:'s1',host:'Faizal Rahman',role:'Head of Retail Branches',name:'Fintech Trivia Round',when:'Live now',live:true},
      {id:'s2',host:'Siti Mariam',role:'Head of Operations',name:'Compliance Quick-fire',when:'Thu · 12:30 PM',live:false},
      {id:'s3',host:'Daniel Tan',role:'Head of Digital Banking',name:'Friday Team Battle',when:'Fri · 4:30 PM',live:false}]};
}

/* Load everything for the signed-in user from Supabase into `st`. */
async function loadCloud(){
  const {data:{user},error:ue}=await sb.auth.getUser();
  if(ue||!user){st=null;return}
  const since=dkey(addDays(nowKL(),-120));
  const q=await Promise.all([
    sb.from('profiles').select('id,full_name,staff_id,department,role').eq('id',user.id).maybeSingle(),
    sb.from('checkins').select('day,stress,mood,tags,note').gte('day',since),
    sb.from('ledger').select('day,kind,award_key,title,sub,points,created_at').gte('day',since).order('created_at',{ascending:true}),
    sb.from('plays').select('day,game,points').gte('day',since),
    sb.from('coupons').select('id,reward_id,brand,label,code,created_at,expires_at').order('created_at',{ascending:true}),
    sb.from('badges').select('badge'),
    sb.from('intentions').select('week_start,idx'),
    sb.from('rewards').select('id,brand,category,value_rm,points,color,perk').order('sort'),
    sb.from('session_reminders').select('session_id'),
    sb.rpc('list_sessions'),
    sb.rpc('my_points')]);
  const bad=q.find(r=>r.error); if(bad) throw bad.error;
  const [pr,ci,lg,pl,cp,bd,it,rw,rm,ss,pt]=q.map(r=>r.data);
  if(!pr) throw new Error('Your staff profile was not found. Ask your administrator to check your account.');
  const checkins={};(ci||[]).forEach(c=>checkins[c.day]={stress:c.stress,mood:c.mood,tags:c.tags||[],note:c.note||''});
  const keys=(lg||[]).filter(l=>l.award_key).map(l=>l.award_key);
  const spinRow=(lg||[]).find(l=>l.award_key==='spin:'+today());
  const intents={};(it||[]).forEach(r=>{(intents[r.week_start]=intents[r.week_start]||[]).push(r.idx)});
  st={mode:'cloud',
    user:{id:pr.id,name:pr.full_name,staffId:pr.staff_id,dept:pr.department,role:pr.role},
    checkins,
    plays:(pl||[]).map(p=>({d:p.day,game:p.game,pts:p.points})),
    activity:(lg||[]).map(l=>({d:l.day,ts:Date.parse(l.created_at),title:l.title,sub:l.sub||'',pts:l.points})),
    points:pt?.balance??0, lifetime:pt?.lifetime??0, keys,
    spin:spinRow?{d:today(),v:spinRow.points}:null,
    coupons:(cp||[]).map(c=>({id:c.id,rid:c.reward_id,brand:c.brand,label:c.label,code:c.code,d:klKey(c.created_at),exp:c.expires_at})),
    badges:(bd||[]).map(b=>b.badge), intents,
    rewards:(rw||[]).map(r=>({id:r.id,brand:r.brand,cat:r.category,val:r.value_rm,pts:r.points,c:r.color,perk:r.perk})),
    reminders:(rm||[]).map(r=>r.session_id),
    sessions:(ss||[]).map(s=>({id:s.id,host:s.host_name,role:s.host_title,name:s.name,when:s.live?'Live now':s.when_label,live:s.live,mine:s.is_mine}))};
}

const friendly=e=>{const m=(e&&(e.message||e.error_description))||String(e);
  if(/fetch|network|Failed to fetch/i.test(m))return 'No connection. Check your internet and try again.';
  if(/JWT|sign in again|refresh token/i.test(m))return 'Your session has expired. Please sign in again.';
  return m};

/* Every change goes through `act`. Cloud calls a database function and reloads;
   demo applies the same rules locally. */
const act={
  async checkin(c){
    if(isCloud()){const {data,error}=await sb.rpc('submit_checkin',{p_stress:c.stress,p_mood:c.mood||'',p_tags:c.tags,p_note:c.note||''});if(error)throw error;await loadCloud();return data}
    const first=!st.checkins[today()];
    st.checkins[today()]={stress:c.stress,mood:c.mood,tags:[...c.tags],note:c.note};
    if(first)addLocal(20,'Daily check-in',`Stress ${c.stress}/10`);
    saveLocal();return first?20:0;
  },
  async game(g,score){
    if(isCloud()){const {data,error}=await sb.rpc('award_game',{p_game:g,p_score:score});if(error)throw error;await loadCloud();return data}
    let pts=pointsFor(g,score); const k=`game:${g}:${today()}`;
    if(st.keys.includes(k))pts=0;
    if(pts>0){st.keys.push(k);addLocal(pts,GAME_TITLES[g])}
    st.plays.push({d:today(),game:g,pts});saveLocal();return pts;
  },
  async session(s,score){
    if(isCloud()){const {data,error}=await sb.rpc('award_session',{p_session:s.id,p_score:score});if(error)throw error;await loadCloud();return data}
    let pts=Math.min(Math.max(score,0),5)*60; const k='session:'+s.id;
    if(st.keys.includes(k))pts=0;
    if(pts>0){st.keys.push(k);addLocal(pts,`Leader round with ${s.host}`)}
    st.plays.push({d:today(),game:'session',pts});
    if(!st.badges.includes('Leader Round'))st.badges.push('Leader Round');
    saveLocal();return pts;
  },
  async spin(){
    if(isCloud()){const {data,error}=await sb.rpc('spin_wheel');if(error)throw error;await loadCloud();return data}
    if(st.spin&&st.spin.d===today())return {index:SEG.indexOf(st.spin.v),points:st.spin.v,already:true};
    const i=Math.floor(Math.random()*SEG.length),v=SEG[i];
    st.spin={d:today(),v};st.keys.push('spin:'+today());st.plays.push({d:today(),game:'spin',pts:v});addLocal(v,'Spin & Win');saveLocal();
    return {index:i,points:v,already:false};
  },
  async redeem(rid){
    if(isCloud()){const {data,error}=await sb.rpc('redeem_reward',{p_reward:rid});if(error)throw error;await loadCloud();return {code:data.code,exp:new Date(data.expires_at)}}
    const r=rewards().find(x=>x.id===rid); if(st.points<r.pts)throw new Error(`You need ${fmt(r.pts-st.points)} more points for this reward.`);
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',rnd=n=>[...Array(n)].map(()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    const code=`SMK-${rnd(4)}-${rnd(4)}`;
    st.coupons.push({id:'c'+Date.now(),rid:r.id,brand:r.brand,label:r.val?`RM${r.val} voucher`:'Company perk',code,d:today()});
    addLocal(-r.pts,'Reward redeemed',`${r.brand}${r.val?' RM'+r.val+' voucher':''}`);saveLocal();
    return {code,exp:addDays(nowKL(),30)};
  },
  async intent(wk,i){
    if(isCloud()){const {data,error}=await sb.rpc('toggle_intention',{p_week:wk,p_idx:i});if(error)throw error;await loadCloud();return data}
    const arr=st.intents[wk]=st.intents[wk]||[];const k=arr.indexOf(i);
    if(k>-1){arr.splice(k,1);saveLocal();return {on:false,points:0}}
    arr.push(i);const key=`intent:${wk}:${i}`;let pts=0;
    if(!st.keys.includes(key)){st.keys.push(key);addLocal(10,'Weekly intention set');pts=10}
    saveLocal();return {on:true,points:pts};
  },
  async remind(id){
    const on=st.reminders.includes(id);
    if(isCloud()){
      const r=on?await sb.from('session_reminders').delete().eq('session_id',id).eq('user_id',st.user.id)
                :await sb.from('session_reminders').insert({session_id:id,user_id:st.user.id});
      if(r.error)throw r.error;await loadCloud();return !on}
    on?st.reminders.splice(st.reminders.indexOf(id),1):st.reminders.push(id);saveLocal();return !on;
  },
  async host(name,when){
    if(isCloud()){const {error}=await sb.rpc('host_session',{p_name:name,p_when:when});if(error)throw error;await loadCloud();return}
    st.sessions.unshift({id:'s'+Date.now(),host:st.user.name,role:'Team leader · '+st.user.dept,name:name||'Team Trivia',when,live:when==='Live now',mine:true});saveLocal();
  },
  async endSession(id){
    if(isCloud()){const {error}=await sb.rpc('end_session',{p_session:id});if(error)throw error;await loadCloud();return}
    st.sessions=st.sessions.filter(s=>s.id!==id);saveLocal();
  },
  async leaderboard(){
    if(isCloud()){const {data,error}=await sb.rpc('department_leaderboard');if(error)throw error;return data.map(r=>[r.department,Number(r.points)])}
    const myWeek=weekData(0).pts;
    return Object.entries(DEPT_BASE).map(([d,p])=>[d,p+(d===st.user.dept?myWeek:0)]).sort((a,b)=>b[1]-a[1]);
  },
  async pulse(){
    if(isCloud()){const {data,error}=await sb.rpc('team_pulse');if(error)throw error;return data}
    return {enough:true,sample:true,department:st.user.dept,members:12,checked:9,avg:5.8,prev_avg:6.4,calm:3,press:4,high:2,
      tags:[{tag:'Month-end closing',people:6},{tag:'Customer queue',people:5},{tag:'Workload',people:4},{tag:'System issues',people:2}]};
  },
  async signOut(){
    if(isCloud()){try{await sb.auth.signOut()}catch(e){}}
    try{localStorage.removeItem(KEY)}catch(e){}
    st=null;cache.lb=null;cache.pulse=null;
  }
};
function addLocal(n,title,sub=''){st.points+=n;if(n>0)st.lifetime+=n;st.activity.push({d:today(),ts:Date.now(),title,sub,pts:n})}
async function run(fn,okMsg){
  if(busy)return;busy=true;
  try{const r=await fn();if(okMsg)toast(typeof okMsg==='function'?okMsg(r):okMsg);return r}
  catch(e){toast(friendly(e));if(/sign in again/i.test(friendly(e))){await act.signOut();render()}}
  finally{busy=false}
}

/* ---------- derived ---------- */
const rewards=()=>(st&&st.rewards&&st.rewards.length)?st.rewards:REWARDS;
const level=()=>Math.floor(st.lifetime/LEVEL_STEP)+1;
const levelProg=()=>st.lifetime%LEVEL_STEP;
function weekDays(offset=0){const m=addDays(monday(nowKL()),offset*7);return [...Array(7)].map((_,i)=>addDays(m,i))}
function weekData(offset=0){
  const days=weekDays(offset), keys=days.map(dkey);
  const cis=keys.map(k=>st.checkins[k]||null);
  const vals=cis.filter(Boolean);
  const avg=vals.length?vals.reduce((s,c)=>s+c.stress,0)/vals.length:null;
  const plays=st.plays.filter(p=>keys.includes(p.d));
  const pts=st.activity.filter(a=>keys.includes(a.d)&&a.pts>0).reduce((s,a)=>s+a.pts,0);
  const tagCount={};vals.forEach(c=>(c.tags||[]).forEach(t=>tagCount[t]=(tagCount[t]||0)+1));
  const tags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1]);
  const moods={};vals.forEach(c=>{if(c.mood)moods[c.mood]=(moods[c.mood]||0)+1});
  const peak=vals.length?cis.reduce((b,c,i)=>c&&(!b||c.stress>b.c.stress)?{c,i}:b,null):null;
  return {days,keys,cis,count:vals.length,avg,plays,pts,tags,moods,peak};
}
function streak(){
  let d=nowKL(), n=0;
  if(!st.checkins[dkey(d)]) d=addDays(d,-1);
  for(let i=0;i<60;i++){
    const wd=d.getDay();
    if(wd===0||wd===6){d=addDays(d,-1);continue}
    if(st.checkins[dkey(d)]){n++;d=addDays(d,-1)}else break;
  }
  return n;
}
function engagedDays(){
  const w=weekDays(0).slice(0,5).map(dkey);
  return w.filter(k=>st.checkins[k]||st.plays.some(p=>p.d===k)).length;
}
const earnedToday=g=>g==='spin'?!!(st.spin&&st.spin.d===today()):st.keys.includes(`game:${g}:${today()}`);
const sessionDone=id=>st.keys.includes('session:'+id);

/* ---------- motivation ---------- */
function motivation(w,prev){
  if(!w.count) return {head:'Start fresh on Monday.',body:'There are no check-ins for this week yet. A 20-second check-in each morning helps you notice pressure before it builds up.'};
  const a=w.avg, top=w.tags[0]?.[0];
  let head,body;
  if(a<=4){head='You found your rhythm.';body='Your stress stayed in a manageable range this week. Notice what helped, and keep those habits going into next week.'}
  else if(a<=6.4){head='Steady under pressure.';body='It was a demanding week and you kept showing up. Next week, protect a few small pauses so the pressure doesn\'t stack up.'}
  else {head='A heavy week. Go easier on yourself next week.';body='Your stress ran high for most of the week. That is a signal, not a weakness. Plan lighter where you can, and let your leader know what is weighing on you.'}
  if(prev&&prev.avg!=null){
    const d=a-prev.avg;
    if(d<=-0.5) body+=` Your average dropped from ${prev.avg.toFixed(1)} to ${a.toFixed(1)} compared with the week before.`;
    else if(d>=0.5) body+=` Your average rose from ${prev.avg.toFixed(1)} to ${a.toFixed(1)} compared with the week before.`;
  }
  if(top) body+=` Your most common pressure point was ${top.toLowerCase()}.`;
  return {head,body};
}
function intentions(w){
  const list=[];
  w.tags.slice(0,2).forEach(([t])=>list.push(TIPS[t]));
  list.push('Check in every morning before your first customer.');
  if(list.length<3) list.push('Play one Brain Break at lunch to reset.');
  if(list.length<3) list.push('Thank one colleague by name this week.');
  return list.slice(0,3);
}

/* ---------- routing ---------- */
const ROUTES=['home','checkin','games','rewards','profile','recap','team'];
const route=()=>{const h=location.hash.slice(1);return ROUTES.includes(h)?h:'home'};
window.addEventListener('hashchange',()=>{editing=false;render();window.scrollTo(0,0)});

function render(){
  const app=$('#app'), nav=$('#nav');
  document.documentElement.classList.toggle('lock',!st);app.classList.toggle('login-mode',!st);
  if(!st){const m=location.hash==='#signup'?'signup':'signin';if(m!==authMode){authMode=m;loginErr={}}nav.hidden=true;app.innerHTML=vLogin();window.scrollTo(0,0);if(sb){const f=$(authMode==='signup'?'#l-name':'#l-id');f&&!('ontouchstart' in window)&&f.focus()}return}
  const r=route();
  if(r==='team'&&st.user.role!=='leader'){location.hash='home';return}
  app.innerHTML={home:vHome,checkin:vCheckin,games:vGames,rewards:vRewards,profile:vProfile,recap:vRecap,team:vTeam}[r]();
  nav.hidden=false;
  const cur=r==='recap'?'checkin':r==='team'?'home':r;
  const items=[['home','home','Home'],['checkin','pulse','Check-in'],['games','game','Games'],['rewards','gift','Rewards'],['profile','user','Profile']];
  nav.innerHTML=items.map(([id,ic,l])=>`<a href="#${id}" ${cur===id?'aria-current="page"':''}>${I(ic)}${l}${id==='checkin'&&!st.checkins[today()]?'<span class="badge" aria-label="Not checked in today"></span>':''}</a>`).join('');
  if(r==='checkin') bindSlider();
  if(r==='games') refresh('lb');
  if(r==='team') refresh('pulse');
}
/* Fetch leaderboard / team pulse in the background, then redraw. */
async function refresh(kind){
  const fresh=Date.now()-cache[kind+'At']<60000;
  if(fresh||cache.loading[kind])return;
  cache.loading[kind]=true;
  try{cache[kind]=await (kind==='lb'?act.leaderboard():act.pulse());cache[kind+'At']=Date.now();cache[kind+'Err']=null}
  catch(e){cache[kind+'Err']=friendly(e);cache[kind+'At']=Date.now()}
  finally{cache.loading[kind]=false}
  if(st&&route()===(kind==='lb'?'games':'team'))render();
}

/* ---------- views ---------- */
function vLogin(){
  const cloud=!!sb, signup=cloud&&authMode==='signup';
  const err=k=>loginErr[k]?`<p class="err">${esc(loginErr[k])}</p>`:'';
  const nameF=`<div><label class="f" for="l-name">Employee name</label><input type="text" id="l-name" autocomplete="name" placeholder="Enter your full name">${err('name')}</div>`;
  const idDept=`<div class="duo">
        <div><label class="f" for="l-id">Staff ID</label><input type="text" id="l-id" autocomplete="username" autocapitalize="characters" placeholder="e.g. MY-1842"></div>
        <div><label class="f" for="l-dept">Department</label><select id="l-dept">${DEPTS.map(d=>`<option ${d==='Digital Banking'?'selected':''}>${d}</option>`).join('')}</select></div>
      </div>${err('id')}`;
  const roleF=`<div><span class="lbl">I am signing in as</span>
        <div class="seg"><button type="button" data-act="lrole" data-v="employee" aria-pressed="${loginRole==='employee'}">Employee</button><button type="button" data-act="lrole" data-v="leader" aria-pressed="${loginRole==='leader'}">Team leader</button></div></div>`;
  const brand=`<div class="row between"><div class="brand login-brand">${MARK}SMISKEE</div>${installBtn()}</div>`;
  const foot=`<p class="note foot-note">${I('lock','sm')}Your access is protected by your organisation.</p>`;
  const demo=`<button class="btn block login-demo" type="button" data-act="demo">Try with a sample employee</button>`;

  if(signup) return `<section class="login pad compact">
    ${brand}
    <a href="#" class="back-link">‹ Back to sign in</a>
    <p class="eyebrow login-eyebrow tight">Join SMISKEE</p>
    <h1 class="login-title">Create your account.</h1>
    <p class="login-sub">Use the staff ID on your card. It takes a minute.</p>
    <form id="login" class="stack" novalidate>
      ${nameF}${idDept}
      <div class="duo">
        <div><label class="f" for="l-pw">Password</label><input type="password" id="l-pw" autocomplete="new-password" placeholder="8+ characters"></div>
        <div><label class="f" for="l-pw2">Confirm</label><input type="password" id="l-pw2" autocomplete="new-password" placeholder="Type it again"></div>
      </div>${err('pw')}
      ${roleF}
      ${err('form')}
      <button class="btn primary block login-btn" type="submit" id="login-btn">Create account ${I('chev')}</button>
      <p class="switch-auth">Already have an account? <a href="#">Sign in</a></p>
      ${foot}
    </form>
  </section>`;

  const fields=cloud
    ?`<div><label class="f" for="l-id">Staff ID</label><input type="text" id="l-id" autocomplete="username" autocapitalize="characters" placeholder="e.g. MY-1842">${err('id')}</div>
      <div><label class="f" for="l-pw">Password</label><input type="password" id="l-pw" autocomplete="current-password" placeholder="Your password">${err('pw')}</div>`
    :nameF+idDept+roleF;
  return `<section class="login pad">
    ${brand}
    <p class="eyebrow login-eyebrow">Next generation motivation</p>
    <h1 class="login-title">Welcome to SMISKEE.</h1>
    <p class="login-sub">A better workday starts with a little motivation.</p>
    <form id="login" class="stack" novalidate>
      ${fields}
      ${err('form')}
      <button class="btn primary block login-btn" type="submit" id="login-btn">Continue securely ${I('chev')}</button>
      ${cloud?`<p class="switch-auth">New to SMISKEE? <a href="#signup">Create an account</a></p>`:''}
      ${demo}
      ${foot}
    </form>
  </section>`;
}

function header(eyebrow,title,sub=''){
  return `<header class="band pad"><div class="row between"><div class="brand">${MARK}SMISKEE</div><div class="top-actions">${installBtn()}<a href="#profile" class="avatar" style="text-decoration:none" aria-label="Profile">${esc(initials(st.user.name))}</a></div></div>
  <p class="eyebrow" style="margin-top:26px">${eyebrow}</p><h1 style="margin-top:4px">${title}</h1>${sub?`<p class="muted" style="margin-top:6px">${sub}</p>`:''}</header>`;
}

function vHome(){
  const now=nowKL(), h=now.getHours(), greet=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  const ci=st.checkins[today()], doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
  const note=NOTES[doy%NOTES.length], q=QUOTES[doy%QUOTES.length];
  const prog=levelProg(), w=weekData(0), wd=now.getDay(), recapReady=wd===5||wd===6||wd===0;
  const live=st.sessions.find(s=>s.live&&!sessionDone(s.id)&&!s.mine);
  const acts=[...st.activity].sort((a,b)=>b.ts-a.ts).slice(0,4);
  return `${header(greet,esc(firstName(st.user.name))+'.',`${esc(st.user.dept)}${st.user.role==='leader'?' · Team leader':''}`)}
  <main class="pad lift stack">
    ${st.mode==='demo'?`<div class="card flat note" style="padding:12px 14px">${I('spark')}<div>You're in demo mode. Your progress is saved on this device only.${sb?' <button class="link" data-act="signout">Sign in with your staff ID</button>':''}</div></div>`:''}
    ${ci?`<div class="card row between"><div><p class="eyebrow">Today's check-in</p><p style="font-weight:700;margin-top:2px">Stress ${ci.stress}/10 · ${bandLabel(ci.stress)}</p></div><span class="chip ${band(ci.stress)}">${I('check')}Done</span></div>`
    :`<div class="card stack" style="gap:12px"><div class="row between"><p class="eyebrow">Daily check-in</p><span class="chip gold">+20 pts</span></div>
      <h2 style="font-size:22px">How stressed do you feel today?</h2><p class="muted small">It takes 20 seconds. Only you can see your answers.</p>
      <a href="#checkin" class="btn primary block" style="text-decoration:none">Check in now ${I('chev')}</a></div>`}

    <div class="card"><p class="eyebrow">Today's note</p><h2 style="font-size:22px;margin-top:6px">${note.h}</h2><p class="muted" style="margin-top:4px">${note.b}</p>
      <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px"><p class="quote">"${q.q}"</p><p class="small muted" style="margin-top:4px">${q.a}</p></div></div>

    <div class="card forest stack" style="gap:14px">
      <div class="row between"><div><p class="small muted">Available balance</p><p class="num" style="font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1.1">${fmt(st.points)} <span style="font-size:14px;font-weight:600">pts</span></p></div><span class="chip gold">${I('spark')}Level ${level()}</span></div>
      <div><div class="row between small"><span class="muted">Next level</span><span class="num">${LEVEL_STEP-prog} pts to go</span></div><div class="track" style="margin-top:6px"><i style="width:${prog/LEVEL_STEP*100}%"></i></div></div>
      <div class="row between small" style="border-top:1px solid rgba(255,255,255,.1);padding-top:12px"><span class="row" style="gap:8px">${I('flame')}Check-in streak</span><b class="num">${streak()} days</b></div>
      <div class="row between small" style="margin-top:-6px"><span class="row" style="gap:8px">${I('cal')}Weekly engagement</span><b class="num">${engagedDays()}/5 days</b></div>
    </div>

    ${live?`<div class="card stack" style="gap:12px"><div class="row between"><p class="eyebrow">Play with your leaders</p><span class="chip high">Live</span></div>
      <div class="session"><div class="host live">${esc(initials(live.host))}</div><div style="flex:1;min-width:0"><p style="font-weight:700">${esc(live.name)}</p><p class="small muted">Hosted by ${esc(live.host)} · Double points</p></div></div>
      <button class="btn gold block" data-act="session" data-id="${live.id}">Join the round</button></div>`:''}

    <div class="card stack" style="gap:12px">
      <div class="row between"><div><p class="eyebrow">${recapReady?'Your weekly recap is ready':'Your week so far'}</p><p style="font-weight:700;margin-top:2px">${w.avg!=null?`Average stress ${w.avg.toFixed(1)}/10`:'No check-ins yet'}</p></div><a class="link" href="#recap">Open recap</a></div>
      ${weekDots(w)}
    </div>

    <div><h2 class="sec-title" style="margin-bottom:10px">Quick actions</h2>
      <div class="qa">
        <button data-go="games"><span class="ib">${I('game')}</span>Games</button>
        <button data-go="rewards"><span class="ib">${I('gift')}</span>Rewards</button>
        <button data-go="recap"><span class="ib">${I('chart')}</span>Recap</button>
        ${st.user.role==='leader'?`<button data-go="team"><span class="ib">${I('team')}</span>Team pulse</button>`:`<button data-go="checkin"><span class="ib">${I('heart')}</span>Wellness</button>`}
      </div></div>

    <div class="card"><div class="row between" style="margin-bottom:12px"><h2 class="sec-title">Recent activity</h2></div>
      <div class="list">${acts.map(actRow).join('')||'<p class="muted small">Nothing yet. Check in or play a game to start earning.</p>'}</div></div>
  </main>`;
}
function actRow(a){
  const d=pdate(a.d), dd=a.d===today()?'Today':a.d===dkey(addDays(nowKL(),-1))?'Yesterday':`${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
  const ic=a.pts<0?'gift':a.pts===0?'trophy':/check-in/i.test(a.title)?'pulse':'game';
  return `<div class="li"><span class="ib">${I(ic)}</span><div class="grow"><p class="t">${esc(a.title)}</p><p class="s">${a.sub?esc(a.sub)+' · ':''}${dd}</p></div>${a.pts?`<span class="pts num" style="${a.pts<0?'color:var(--muted)':''}">${a.pts>0?'+':''}${fmt(a.pts)}</span>`:''}</div>`;
}
function weekDots(w){
  const t=today();
  return `<div class="week">${w.keys.map((k,i)=>{const c=w.cis[i];return `<div><div class="d">${DOW[i]}</div><div class="dot ${c?band(c.stress):''} ${k===t?'today':''}" title="${c?`Stress ${c.stress}/10`:'No check-in'}">${c?c.stress:''}</div></div>`}).join('')}</div>`;
}

function vCheckin(){
  const ci=st.checkins[today()], w=weekData(0);
  if(!draft) draft=ci?{...ci,tags:[...ci.tags]}:{stress:5,mood:null,tags:[],note:''};
  const showForm=!ci||editing;
  return `${header('Private check-in','How are you feeling today?','Take a quiet moment to check in with yourself.')}
  <main class="pad lift stack">
  ${showForm?`<form class="card stack" id="ci-form" style="gap:22px">
    <div><div class="row between"><p class="eyebrow">Stress level</p><span class="chip ${band(draft.stress)}" id="s-chip">${bandLabel(draft.stress)}</span></div>
      <div class="row" style="align-items:baseline;gap:6px;margin:10px 0 14px"><span class="big-stress num" id="s-val" style="color:var(--${band(draft.stress)})">${draft.stress}</span><span class="muted" style="font-weight:700">/ 10</span></div>
      <label for="s-range" class="sr">Stress level from 1 to 10</label>
      <input type="range" class="range" id="s-range" min="1" max="10" step="1" value="${draft.stress}">
      <div class="scale-l" style="margin-top:8px"><span>1 · Calm</span><span>5 · Pressured</span><span>10 · Overwhelmed</span></div></div>
    <div><p class="eyebrow" style="margin-bottom:10px">Mood</p><div class="moods">${MOODS.map(m=>`<button type="button" class="mood" data-act="mood" data-v="${m.id}" aria-pressed="${draft.mood===m.id}"><span class="face">${m.face}</span>${m.label}</button>`).join('')}</div></div>
    <div><p class="eyebrow" style="margin-bottom:10px">What's weighing on you? <span style="text-transform:none;letter-spacing:0;font-weight:500">(optional)</span></p><div class="tags">${TAGS.map(t=>`<button type="button" class="tag" data-act="tag" data-v="${esc(t)}" aria-pressed="${draft.tags.includes(t)}">${t}</button>`).join('')}</div></div>
    <div><label class="f" for="ci-note">Private note <span class="muted" style="font-weight:500">(optional)</span></label><textarea id="ci-note" rows="2" maxlength="500" placeholder="Anything you want to remember about today">${esc(draft.note)}</textarea></div>
    <div class="stack" style="gap:10px"><button class="btn primary block" type="submit">${ci?'Update check-in':'Submit check-in · +20 pts'}</button>${ci?'<button type="button" class="btn ghost block" data-act="cancel-edit">Cancel</button>':''}</div>
  </form>`
  :`<div class="card stack" style="gap:14px">
     <div class="row between"><p class="eyebrow">Today</p><span class="chip calm">${I('check')}Checked in</span></div>
     <div class="row" style="align-items:baseline;gap:6px"><span class="big-stress num" style="color:var(--${band(ci.stress)})">${ci.stress}</span><span class="muted" style="font-weight:700">/ 10 · ${bandLabel(ci.stress)}</span></div>
     <div class="tags">${ci.mood?`<span class="chip line">${MOODS.find(m=>m.id===ci.mood)?.label||''}</span>`:''}${(ci.tags||[]).map(t=>`<span class="chip line">${esc(t)}</span>`).join('')}</div>
     ${ci.note?`<p class="small muted">"${esc(ci.note)}"</p>`:''}
     <button class="btn ghost block" data-act="edit">Edit today's check-in</button>
   </div>
   ${ci.stress>=8?supportCard():''}`}

  <div class="card stack" style="gap:14px"><div class="row between"><div><p class="eyebrow">Weekly overview</p><h2 class="sec-title" style="margin-top:2px">Your rhythm this week</h2></div><a class="link" href="#recap">Full recap</a></div>
    ${weekDots(w)}
    <div class="stats"><div class="stat"><b class="num">${w.count}</b><span>Check-ins</span></div><div class="stat"><b class="num">${w.avg!=null?w.avg.toFixed(1):'–'}</b><span>Avg stress</span></div><div class="stat"><b class="num">${streak()}</b><span>Day streak</span></div></div>
  </div>
  <div class="card flat note">${I('lock')}<div><b style="color:var(--ink)">Your check-ins are private.</b><br>Leaders only see anonymous team averages, and only when five or more people have checked in.</div></div>
  </main>`;
}
function supportCard(){
  return `<div class="support"><b>That sounds like a lot today.</b><p class="small">You don't have to handle it alone. You can ask your leader for a 15-minute catch-up, or contact your organisation's Employee Assistance Programme (EAP) for confidential support.</p>
  <button class="btn ghost" data-act="breath-open" style="align-self:flex-start">Try a 1-minute breathing reset</button></div>`;
}
function bindSlider(){
  const r=$('#s-range'); if(!r) return;
  r.addEventListener('input',()=>{const v=+r.value;draft.stress=v;const b=band(v);
    $('#s-val').textContent=v;$('#s-val').style.color=`var(--${b})`;const c=$('#s-chip');c.className='chip '+b;c.textContent=bandLabel(v)});
  const n=$('#ci-note'); n&&n.addEventListener('input',()=>draft.note=n.value);
}

const GAMES=[
 {id:'quiz',name:'Banking Knowledge Quiz',desc:'5 questions on Malaysian banking',pts:150,gi:'Q',c:'calm'},
 {id:'memory',name:'Memory Match',desc:'Match 6 banking pairs in few moves',pts:100,gi:'M',c:'gold'},
 {id:'spin',name:'Spin & Win',desc:'One free spin every day',pts:'Up to 150',gi:'S',c:'press'},
 {id:'breath',name:'Focus Breathing',desc:'A guided 1-minute box breath',pts:80,gi:'B',c:'calm'},
 {id:'brain',name:'Quick Brain Break',desc:'5 fast ringgit sums',pts:50,gi:'RM',c:'gold'}];
function vGames(){
  const left=GAMES.filter(g=>!earnedToday(g.id)).length;
  const colors={calm:['var(--calm-bg)','var(--calm)'],gold:['var(--gold-bg)','var(--gold-ink)'],press:['var(--press-bg)','var(--press)']};
  const lb=cache.lb, max=lb&&lb.length?Math.max(1,...lb.map(x=>x[1])):1;
  return `${header('Play & grow','Take a break. Play. Earn.','Short games, real rewards. Points count once per game each day.')}
  <main class="pad lift stack">
    <div class="card forest row between"><div class="row">${I('flame')}<div><p class="small muted">Games left with points today</p><p style="font-weight:800;font-size:20px" class="num">${left} of ${GAMES.length}</p></div></div><span class="chip gold num">${streak()}-day streak</span></div>

    <div class="card stack" style="gap:14px"><div><p class="eyebrow">Play with your leaders</p><h2 class="sec-title" style="margin-top:2px">Leader sessions</h2><p class="small muted">Leaders host live rounds. Join to earn double points and the Leader Round badge.</p></div>
      ${st.sessions.length?`<div class="list">${st.sessions.map(s=>{const done=sessionDone(s.id), rem=st.reminders.includes(s.id);
        const btn=s.mine?`<button class="btn ghost" style="padding:9px 12px;font-size:13px" data-act="end-session" data-id="${s.id}">End</button>`
          :done?`<span class="done-tag">${I('check')}</span>`
          :s.live?`<button class="btn gold" style="padding:9px 14px;font-size:13px" data-act="session" data-id="${s.id}">Join</button>`
          :`<button class="btn ghost" style="padding:9px 12px;font-size:13px" data-act="remind" data-id="${s.id}" aria-pressed="${rem}">${rem?'Reminder set':'Remind me'}</button>`;
        return `<div class="li"><div class="host ${s.live&&!done?'live':''}">${esc(initials(s.host))}</div><div class="grow"><p class="t">${esc(s.name)}</p><p class="s">${esc(s.host)}${s.mine?' (you)':''} · ${esc(s.role)}</p><p class="s" style="font-weight:700;color:${s.live?'var(--high)':'var(--muted)'}">${esc(s.when)}</p></div>${btn}</div>`}).join('')}</div>`
      :`<p class="small muted">No sessions this week yet.${st.user.role==='leader'?' You can host one from <a class="link" href="#team">Team pulse</a>.':' Your leaders will post them here.'}</p>`}
    </div>

    <div><h2 class="sec-title" style="margin-bottom:10px">Solo games</h2>
    <div class="ggrid">${GAMES.map(g=>{const[bg,fg]=colors[g.c];const done=earnedToday(g.id);
      return `<button class="game" data-act="play" data-g="${g.id}"><span class="gi" style="background:${bg};color:${fg}">${g.gi}</span><div><h3>${g.name}</h3><p>${g.desc}</p></div>
      <div class="foot">${done?`<span class="done-tag">${I('check')} Earned today</span>`:`<span class="chip gold">${typeof g.pts==='number'?g.pts+' pts':g.pts}</span>`}<span class="go">${done&&g.id!=='spin'?'Replay':done?'View':'Play'}</span></div></button>`}).join('')}</div></div>

    <div class="card lb"><div style="margin-bottom:12px"><p class="eyebrow">Team battle · this week</p><h2 class="sec-title" style="margin-top:2px">Department leaderboard</h2><p class="small muted">Every point you earn this week counts for ${esc(st.user.dept)}.</p></div>
      ${!lb?`<p class="small muted">${cache.lbErr?esc(cache.lbErr):'Loading the leaderboard…'}</p>`
      :`<div class="list">${lb.map(([d,p],i)=>`<div class="li ${d===st.user.dept?'me':''}"><span class="rank">${i+1}</span><div class="grow"><div class="row between"><p class="t">${esc(d)}${d===st.user.dept?' (you)':''}</p><span class="small num" style="font-weight:700">${fmt(p)}</span></div><div class="bar-h"><i style="width:${p/max*100}%"></i></div></div></div>`).join('')}</div>`}
      ${st.mode==='demo'?'<p class="small muted" style="margin-top:12px">Other departments\' totals are sample figures in demo mode.</p>':''}</div>
  </main>`;
}

function vRewards(){
  const cats=['All','Coffee','Food','Time off','My coupons'];
  const list=rewards().filter(r=>rewardFilter==='All'||r.cat===rewardFilter);
  return `${header('Marketplace','Rewards worth celebrating.')}
  <main class="pad lift stack">
    <div class="card forest row between"><div><p class="small muted">Your balance</p><p class="num" style="font-size:28px;font-weight:800;letter-spacing:-.03em">${fmt(st.points)} pts</p></div><a href="#games" class="btn gold" style="text-decoration:none;padding:10px 14px;font-size:13px">Earn more</a></div>
    <div class="filters" role="toolbar" aria-label="Filter rewards">${cats.map(c=>`<button data-act="filter" data-v="${c}" aria-pressed="${rewardFilter===c}">${c}${c==='My coupons'?` (${st.coupons.length})`:''}</button>`).join('')}</div>
    ${rewardFilter==='My coupons'?(st.coupons.length?[...st.coupons].reverse().map(c=>{const r=rewards().find(x=>x.id===c.rid)||{c:'#315c4c'};const exp=c.exp?new Date(c.exp):addDays(pdate(c.d),30);
      return `<div class="reward">${voucher(r)}<div class="grow"><h3>${esc(c.brand)}</h3><p class="small muted">${esc(c.label)} · valid until ${exp.getDate()} ${MON[exp.getMonth()]}</p><p class="num" style="font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;letter-spacing:.06em;margin-top:4px">${esc(c.code)}</p></div><button class="x" data-act="copy" data-code="${esc(c.code)}" aria-label="Copy code ${esc(c.code)}">${I('copy')}</button></div>`}).join(''):'<div class="card flat"><p class="muted">You haven\'t redeemed any rewards yet.</p></div>')
    :`<p class="small muted">${list.length} rewards</p>`+list.map(r=>{const can=st.points>=r.pts;
      return `<div class="reward">${voucher(r)}<div class="grow"><p class="eyebrow" style="font-size:10px">${r.cat==='Time off'?'Company perk':'Digital voucher'}</p><h3>${esc(r.brand)}</h3><p class="small muted">${can?'Available instantly':`${fmt(r.pts-st.points)} more pts needed`}</p></div>
      <button class="btn ${can?'primary':'ghost'}" style="padding:9px 12px;font-size:13px" data-act="redeem" data-id="${r.id}" ${can?'':'disabled'}><span class="num">${fmt(r.pts)}</span></button></div>`}).join('')}
    ${st.mode==='demo'?'<p class="small muted">Voucher codes in demo mode are for illustration and can\'t be used at outlets.</p>':''}
  </main>`;
}
function voucher(r){return `<div class="voucher" style="background:${esc(r.c)}"><b>${esc(r.perk||'RM'+r.val)}</b><span>${r.perk?'PERK':'VOUCHER'}</span></div>`}

function vRecap(){
  const off=recapWeek==='this'?0:-1, w=weekData(off), prev=weekData(off-1), m=motivation(w,prev);
  const s=w.days[0], e=w.days[6];
  const range=`${s.getDate()} ${MON[s.getMonth()]} – ${e.getDate()} ${MON[e.getMonth()]}`;
  const wk=dkey(addDays(s,7)); const ints=intentions(w); const committed=st.intents[wk]||[];
  const canPlan=off===0;
  const diff=prev.avg!=null&&w.avg!=null?w.avg-prev.avg:null;
  const qi=QUOTES[s.getDate()%QUOTES.length];
  return `<header class="band pad"><div class="row between"><a href="#checkin" class="link" style="color:var(--on-forest-muted)">‹ Back</a><div class="top-actions">${installBtn()}<div class="brand">${MARK}</div></div></div>
    <p class="eyebrow" style="margin-top:22px">Weekly recap</p><h1 style="margin-top:4px">${range}</h1>
    <div class="tabs" style="margin-top:16px"><button data-act="rweek" data-v="this" aria-pressed="${recapWeek==='this'}">This week</button><button data-act="rweek" data-v="last" aria-pressed="${recapWeek==='last'}">Last week</button></div></header>
  <main class="pad lift stack">
    <div class="card stack" style="gap:14px">
      <div class="row between" style="align-items:flex-start"><div><p class="eyebrow">Average stress</p><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="big-stress num" style="font-size:52px;color:var(--${w.avg!=null?band(Math.round(w.avg)):'muted'})">${w.avg!=null?w.avg.toFixed(1):'–'}</span><span class="muted" style="font-weight:700">/ 10</span></div></div>
        ${w.avg!=null?`<span class="chip ${band(Math.round(w.avg))}">${bandLabel(Math.round(w.avg))}</span>`:''}</div>
      ${diff!=null?`<p class="small" style="font-weight:600;color:${diff<0?'var(--calm)':diff>0?'var(--high)':'var(--muted)'}">${diff<0?'▼':diff>0?'▲':'■'} ${Math.abs(diff).toFixed(1)} vs. the week before (${prev.avg.toFixed(1)})</p>`:''}
      <div><div class="chart"><div class="yax"><span>10</span><span>5</span><span>0</span></div>
        <div class="plot"><div class="gl" style="top:0"></div><div class="gl" style="top:50%"></div>${w.cis.map(c=>c?`<div class="b ${band(c.stress)}" style="height:${c.stress*10}%"><em class="num">${c.stress}</em></div>`:'<div class="b none"></div>').join('')}</div></div>
        <div class="xax">${DOW.map(d=>`<span>${d}</span>`).join('')}</div></div>
      ${w.peak?`<p class="small muted">Toughest day: <b style="color:var(--ink)">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][w.peak.i]}</b> at ${w.peak.c.stress}/10.</p>`:''}
    </div>

    <div class="stats"><div class="stat solo"><b class="num">${w.count}</b><span>Check-ins</span></div><div class="stat solo"><b class="num">${w.plays.length}</b><span>Games played</span></div><div class="stat solo"><b class="num">${fmt(w.pts)}</b><span>Points earned</span></div></div>

    ${w.tags.length?`<div class="card"><p class="eyebrow">What weighed on you</p><div class="stack" style="gap:10px;margin-top:12px">${w.tags.slice(0,4).map(([t,n])=>`<div><div class="row between small"><span style="font-weight:600">${esc(t)}</span><span class="muted num">${n} ${n>1?'days':'day'}</span></div><div class="bar-h"><i style="width:${n/w.count*100}%;background:var(--press)"></i></div></div>`).join('')}</div>
      ${Object.keys(w.moods).length?`<p class="eyebrow" style="margin-top:18px">Moods logged</p><div class="tags" style="margin-top:8px">${MOODS.filter(x=>w.moods[x.id]).map(x=>`<span class="chip line">${x.face} ${x.label} × ${w.moods[x.id]}</span>`).join('')}</div>`:''}</div>`:''}

    <div class="card forest stack" style="gap:12px"><p class="eyebrow" style="color:var(--gold)">Your motivation for next week</p><h2 style="font-size:24px">${m.head}</h2><p style="color:var(--on-forest-muted)">${m.body}</p>
      <div style="border-top:1px solid rgba(255,255,255,.12);padding-top:12px"><p class="quote">"${qi.q}"</p><p class="small muted" style="margin-top:4px">${qi.a}</p></div></div>

    ${w.avg!=null&&w.avg>=7?supportCard():''}

    ${canPlan?`<div class="card stack" style="gap:10px"><div><p class="eyebrow">Plan for next week</p><h2 class="sec-title" style="margin-top:2px">Pick your intentions</h2><p class="small muted">Tap to commit. Each one earns 10 pts the first time.</p></div>
      ${ints.map((t,i)=>{const on=committed.includes(i);return `<button class="intent" data-act="intent" data-wk="${wk}" data-i="${i}" aria-pressed="${on}"><span class="box">${on?I('check'):''}</span><span>${esc(t)}</span></button>`}).join('')}</div>`:''}
  </main>`;
}

function vTeam(){
  const t=cache.pulse;
  const head=header('Team pulse','How your team is doing.',`${esc(st.user.dept)}${t&&t.sample?' · sample data':''}`);
  const hostForm=`<form class="card stack" id="host-form"><div><p class="eyebrow">Host a session</p><h2 class="sec-title" style="margin-top:2px">Play with your team</h2><p class="small muted">Everyone in the app sees your session. Live sessions stay open for 3 hours.</p></div>
      <div><label class="f" for="h-name">Session name</label><input type="text" id="h-name" maxlength="60" placeholder="e.g. Thursday Trivia"></div>
      <div><label class="f" for="h-when">When</label><select id="h-when"><option>Live now</option><option>Tomorrow · 12:30 PM</option><option>Thu · 4:30 PM</option><option>Fri · 4:30 PM</option></select></div>
      <button class="btn primary block" type="submit">Publish session</button></form>`;
  const privacy=`<div class="card flat note">${I('lock')}<div>You only see anonymous averages. Results appear when five or more people have checked in this week, and no individual answers or notes are ever shown.</div></div>`;
  if(!t) return `${head}<main class="pad lift stack"><div class="card"><p class="muted">${cache.pulseErr?esc(cache.pulseErr):'Loading your team pulse…'}</p></div>${hostForm}${privacy}</main>`;
  if(!t.enough) return `${head}<main class="pad lift stack"><div class="card stack" style="gap:10px"><p class="eyebrow">Not enough check-ins yet</p><h2 class="sec-title">${t.checked} of 5 people have checked in this week</h2><p class="small muted">To protect privacy, the team pulse appears once at least five people in ${esc(t.department)} have checked in. Your department has ${t.members} ${t.members===1?'member':'members'} on SMISKEE.</p><div class="track light"><i style="width:${Math.min(100,t.checked/5*100)}%"></i></div></div>${hostForm}${privacy}</main>`;
  const avg=Number(t.avg), prevAvg=t.prev_avg!=null?Number(t.prev_avg):null, diff=prevAvg!=null?avg-prevAvg:null;
  const dist=[['calm',t.calm,'Calm'],['press',t.press,'Pressured'],['high',t.high,'High']];
  const top=t.tags&&t.tags[0]?t.tags[0].tag:null;
  return `${head}
  <main class="pad lift stack">
    <div class="card stack" style="gap:14px">
      <div class="row between"><div><p class="eyebrow">Team average stress</p><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="big-stress num" style="font-size:52px;color:var(--${band(Math.round(avg))})">${avg.toFixed(1)}</span><span class="muted" style="font-weight:700">/ 10</span></div></div>
        ${diff!=null?`<span class="chip ${diff<=0?'calm':'high'}">${diff<=0?'▼':'▲'} ${Math.abs(diff).toFixed(1)} vs last week</span>`:''}</div>
      <div class="stats"><div class="stat"><b class="num">${t.checked}/${t.members}</b><span>Checked in</span></div><div class="stat"><b class="num">${Math.round(t.checked/Math.max(1,t.members)*100)}%</b><span>Participation</span></div><div class="stat"><b class="num">${t.high}</b><span>Feeling high stress</span></div></div>
      <div><div class="dist">${dist.filter(d=>d[1]>0).map(([b,n])=>`<i style="flex:${n};background:var(--${b})"></i>`).join('')}</div>
      <div class="row small muted" style="margin-top:8px;gap:14px;flex-wrap:wrap">${dist.map(([b,n,l])=>`<span><b style="color:var(--${b})">●</b> ${l} ${n}</span>`).join('')}</div></div>
    </div>
    ${t.tags&&t.tags.length?`<div class="card"><p class="eyebrow">Top pressure points</p><div class="stack" style="gap:10px;margin-top:12px">${t.tags.map(x=>`<div><div class="row between small"><span style="font-weight:600">${esc(x.tag)}</span><span class="muted num">${x.people} ${x.people===1?'person':'people'}</span></div><div class="bar-h"><i style="width:${x.people/t.checked*100}%;background:var(--press)"></i></div></div>`).join('')}</div></div>`:''}
    ${top?`<div class="card forest stack" style="gap:8px"><p class="eyebrow" style="color:var(--gold)">Suggested action</p><p style="font-weight:700;font-size:17px">${esc(top)} is the main pressure point.</p><p class="small" style="color:var(--on-forest-muted)">${esc(TEAM_TIPS[top]||'Talk to the team about what would help this week.')} A short game round on Thursday afternoon can also lift energy.</p></div>`:''}
    ${hostForm}${privacy}
  </main>`;
}

function vProfile(){
  const u=st.user, done=st.plays.length;
  return `${header('My profile','Employee profile')}
  <main class="pad lift stack">
    <div class="card stack" style="gap:16px"><div class="row"><div class="avatar" style="width:56px;height:56px;font-size:18px">${esc(initials(u.name))}</div><div style="min-width:0"><p style="font-weight:800;font-size:18px">${esc(u.name)}</p><p class="small muted">${u.role==='leader'?'Team leader':'Employee'} · ${esc(u.dept)}</p><p class="small muted">Staff ID ${esc(u.staffId)}</p></div></div>
      <div class="stats"><div class="stat"><b class="num">${fmt(st.points)}</b><span>Points</span></div><div class="stat"><b class="num">${level()}</b><span>Level</span></div><div class="stat"><b class="num">${done}</b><span>Games</span></div></div></div>
    <div class="card"><p class="eyebrow">Collected badges</p><div class="tags" style="margin-top:10px">${st.badges.length?st.badges.map(b=>`<span class="chip gold">${I('trophy')}${esc(b)}</span>`).join(''):'<p class="small muted">Join a leader session to earn your first badge.</p>'}</div></div>
    <div class="card"><div class="list">
      <a class="li" href="#rewards" data-act="mycoupons" style="text-decoration:none;color:inherit"><span class="ib">${I('gift')}</span><div class="grow"><p class="t">My coupons</p><p class="s">${st.coupons.length} redeemed</p></div>${I('chev')}</a>
      <a class="li" href="#recap" style="text-decoration:none;color:inherit"><span class="ib">${I('chart')}</span><div class="grow"><p class="t">Weekly recap</p><p class="s">Stress summary and next week's plan</p></div>${I('chev')}</a>
      ${u.role==='leader'?`<a class="li" href="#team" style="text-decoration:none;color:inherit"><span class="ib">${I('team')}</span><div class="grow"><p class="t">Team pulse</p><p class="s">Anonymous team wellbeing</p></div>${I('chev')}</a>`:''}
    </div></div>
    ${st.mode==='demo'?`<div class="card stack" style="gap:10px"><p class="eyebrow">Demo settings</p>
      <div class="seg"><button data-act="role" data-v="employee" aria-pressed="${u.role==='employee'}">Employee view</button><button data-act="role" data-v="leader" aria-pressed="${u.role==='leader'}">Leader view</button></div>
      <p class="small muted">Earlier weeks are filled with sample check-ins so you can see the recap. Everything is saved on this device only.</p>
      <button class="btn ghost block" data-act="reset">${resetArm?'Tap again to clear all data':'Reset demo data'}</button>
      <button class="btn ghost block" data-act="signout">Leave demo</button></div>`
    :`<div class="card stack" style="gap:10px"><p class="eyebrow">Account</p><p class="small muted">Your progress is saved to your SMISKEE account, so you can sign in on any device.</p>
      <button class="btn ghost block" data-act="signout">Sign out</button></div>`}
  </main>`;
}

/* ---------- sheet + games ---------- */
function openSheet(title){$('#sheet-title').textContent=title;$('#sheet').hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){$('#sheet').hidden=true;document.body.style.overflow='';clearInterval(timer);timer=null;G=null;render()}
const SB=html=>$('#sheet-body').innerHTML=html;
const saving=()=>SB('<div class="result"><p class="muted">Saving your score…</p></div>');
function resultView(title,line,pts,note){
  SB(`<div class="result"><p class="eyebrow">${title}</p><p class="big num">${pts>0?'+'+pts:'0'}</p><p style="font-weight:700">${pts>0?'points earned':'points this time'}</p><p class="muted small" style="max-width:32ch">${line}${note?' '+note:''}</p><div class="row" style="margin-top:8px"><button class="btn ghost" data-act="close">Done</button>${G&&G.id!=='spin'?'<button class="btn primary" data-act="replay">Play again</button>':''}</div></div>`);
}
const ALREADY='You already earned points for this game today. Come back tomorrow.';
async function finish(promise,title,line,zeroNote){
  saving();
  try{const pts=await promise;if(G)resultView(title,line,pts,pts?'':zeroNote)}
  catch(e){if(G)SB(`<div class="result"><p style="font-weight:700">Your score couldn't be saved.</p><p class="muted small">${esc(friendly(e))}</p><button class="btn ghost" data-act="close">Close</button></div>`)}
}

function startGame(id,opts={}){
  G={id,...opts};
  if(id==='quiz'||id==='session'){G.qs=shuffle(QUIZ).slice(0,5);G.i=0;G.score=0;G.ans=null;openSheet(id==='session'?opts.s.name:'Banking Knowledge Quiz');drawQuiz()}
  if(id==='memory'){const L=['RM','%','ATM','FD','OTP','KYC'];G.cards=shuffle([...L,...L]);G.up=[];G.ok=[];G.moves=0;G.lock=false;openSheet('Memory Match');drawMemory()}
  if(id==='spin'){openSheet('Spin & Win');drawSpin()}
  if(id==='breath'){openSheet('Focus Breathing');drawBreath()}
  if(id==='brain'){G.qs=[...Array(5)].map(mkSum);G.i=0;G.score=0;G.ans=null;G.t0=Date.now();openSheet('Quick Brain Break');drawBrain()}
}
function drawQuiz(){
  if(G.i>=G.qs.length){
    if(G.id==='session') return finish(act.session(G.s,G.score),`Hosted by ${G.s.host}`,`You got ${G.score} of 5 right. Leader rounds pay double points.`,'You already played this round.');
    return finish(act.game('quiz',G.score),'Quiz complete',`You got ${G.score} of 5 right.`,G.score?ALREADY:'');
  }
  const q=G.qs[G.i];
  SB(`<div class="stack"><div><div class="row between small muted"><span>Question ${G.i+1} of 5</span><span class="num">Score ${G.score}</span></div><div class="track light" style="margin-top:6px"><i style="width:${(G.i)/5*100}%"></i></div></div>
    <h3 class="q">${q.q}</h3><div class="opts">${q.o.map((o,k)=>`<button class="opt ${G.ans!=null?(k===q.a?'right':k===G.ans?'wrong':''):''}" data-act="qa" data-k="${k}" ${G.ans!=null?'disabled':''}>${o}</button>`).join('')}</div>
    ${G.ans!=null?`<p class="explain"><b style="color:${G.ans===q.a?'var(--calm)':'var(--high)'}">${G.ans===q.a?'Correct.':'Not quite.'}</b> ${q.e}</p><button class="btn primary block" data-act="qnext">${G.i<4?'Next question':'See results'}</button>`:''}</div>`);
}
function drawMemory(){
  SB(`<div class="stack"><div class="row between small muted"><span>Find all 6 pairs</span><span class="num">Moves: ${G.moves}</span></div>
  <div class="mgrid">${G.cards.map((c,i)=>{const ok=G.ok.includes(i),up=G.up.includes(i);return `<button class="mc ${ok?'ok':up?'up':'hid'}" data-act="flip" data-i="${i}" aria-label="${ok||up?c:'Hidden card'}" ${ok?'disabled':''}>${c}</button>`}).join('')}</div>
  <p class="small muted">Finish in 10 moves or fewer for 100 pts, 14 or fewer for 70 pts.</p></div>`);
}
function flip(i){
  if(G.lock||G.up.includes(i)||G.ok.includes(i))return;
  G.up.push(i);
  if(G.up.length===2){G.moves++;const[a,b]=G.up;
    if(G.cards[a]===G.cards[b]){G.ok.push(a,b);G.up=[]}
    else{G.lock=true;setTimeout(()=>{if(!G||G.id!=='memory')return;G.up=[];G.lock=false;drawMemory()},700)}}
  drawMemory();
  if(G.ok.length===12){const moves=G.moves;setTimeout(()=>{if(G&&G.id==='memory')finish(act.game('memory',moves),'All pairs found',`You finished in ${moves} moves.`,ALREADY)},500)}
}
function drawSpin(){
  const done=st.spin&&st.spin.d===today();
  const cols=['var(--forest)','var(--forest-2)'];
  const grad=SEG.map((_,i)=>`${i===5?'var(--gold)':cols[i%2]} ${i*45}deg ${(i+1)*45}deg`).join(',');
  const startRot=done?360-(SEG.indexOf(st.spin.v)*45+22.5):0;
  SB(`<div class="stack" style="align-items:center;text-align:center"><div class="wheel-wrap"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad});transform:rotate(${startRot}deg)">${SEG.map((v,i)=>{const a=(i*45+22.5-90)*Math.PI/180;return `<span style="left:${50+Math.cos(a)*33}%;top:${50+Math.sin(a)*33}%;transform:translate(-50%,-50%)">${v}</span>`}).join('')}</div><div class="hub">SPIN</div></div>
  ${done?`<p style="font-weight:700">You won ${st.spin.v} pts today.</p><p class="small muted">Your next free spin unlocks tomorrow.</p><button class="btn ghost" data-act="close">Close</button>`:`<p class="small muted">One free spin per day. Prizes from 20 to 150 points.</p><button class="btn gold block" data-act="spin" id="spin-btn">Spin the wheel</button>`}</div>`);
}
async function doSpin(){
  const btn=$('#spin-btn');if(!btn||btn.disabled)return;btn.disabled=true;btn.textContent='Spinning…';
  let res;
  try{res=await act.spin()}catch(e){btn.disabled=false;btn.textContent='Spin the wheel';toast(friendly(e));return}
  const rot=360*6+(360-(res.index*45+22.5));
  const wheel=$('#wheel');if(wheel)wheel.style.transform=`rotate(${rot}deg)`;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{if(G&&G.id==='spin')resultView('Spin & Win',`The wheel landed on ${res.points}.`,res.already?0:res.points,res.already?'You already spun today.':'')},reduce?50:4200);
}
function drawBreath(){
  SB(`<div class="stack" style="align-items:center;text-align:center"><div class="breath"><div class="orb" id="orb"></div><b id="b-count">4</b></div>
  <p style="font-weight:800;font-size:20px" id="b-phase">Box breathing</p><p class="small muted" id="b-sub">Breathe in 4 · hold 4 · out 4 · hold 4. Four rounds, about one minute.</p>
  <div class="track light" style="width:100%"><i id="b-prog" style="width:0%"></i></div>
  <button class="btn primary block" data-act="breath-start" id="b-btn">Start</button></div>`);
}
function breathStart(){
  const btn=$('#b-btn');btn.hidden=true;let t=0;const total=64;
  const phases=[['Breathe in',1.6],['Hold',1.6],['Breathe out',1],['Hold',1]];
  const tick=()=>{
    if(!G||G.id!=='breath'){clearInterval(timer);return}
    if(t>=total){clearInterval(timer);timer=null;return finish(act.game('breath',1),'Nicely done','You completed four rounds of box breathing.',ALREADY)}
    const p=Math.floor(t/4)%4, left=4-(t%4);
    $('#b-phase').textContent=phases[p][0];$('#b-count').textContent=left;$('#b-sub').textContent=`Round ${Math.floor(t/16)+1} of 4`;
    $('#orb').style.transform=`scale(${phases[p][1]})`;$('#b-prog').style.width=(t/total*100)+'%';t++;
  };
  tick();timer=setInterval(tick,1000);
}
function mkSum(){
  const a=Math.round((Math.random()*180+10)*20)/20, b=Math.round((Math.random()*90+5)*20)/20, plus=Math.random()<.6;
  const ans=+(plus?a+b:Math.max(a,b)-Math.min(a,b)).toFixed(2);
  const q=plus?`RM ${a.toFixed(2)} + RM ${b.toFixed(2)}`:`RM ${Math.max(a,b).toFixed(2)} − RM ${Math.min(a,b).toFixed(2)}`;
  const opts=shuffle([ans,+(ans+0.5).toFixed(2),+(ans-1).toFixed(2),+(ans+10).toFixed(2)]);
  return {q,o:opts.map(x=>'RM '+x.toFixed(2)),a:opts.indexOf(ans)};
}
function drawBrain(){
  if(G.i>=5){const secs=Math.round((Date.now()-G.t0)/1000);return finish(act.game('brain',G.score),'Brain break done',`${G.score} of 5 correct in ${secs} seconds.`,G.score?ALREADY:'')}
  const q=G.qs[G.i];
  SB(`<div class="stack"><div class="row between small muted"><span>Sum ${G.i+1} of 5</span><span class="num">Score ${G.score}</span></div>
  <h3 class="q num" style="font-size:26px;text-align:center;padding-block:12px">${q.q}</h3>
  <div class="opts" style="display:grid;grid-template-columns:1fr 1fr">${q.o.map((o,k)=>`<button class="opt num ${G.ans!=null?(k===q.a?'right':k===G.ans?'wrong':''):''}" style="text-align:center" data-act="ba" data-k="${k}" ${G.ans!=null?'disabled':''}>${o}</button>`).join('')}</div></div>`);
}

/* ---------- add to home screen ---------- */
let deferredInstall=null, installTab=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('SMISKEE installed');render()});
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
function platform(){const u=navigator.userAgent||'';
  if(/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1))return 'ios';
  if(/Android/.test(u))return 'android';return 'other'}
function installBtn(){return isStandalone()?'':`<button class="install" data-act="install" aria-label="Add SMISKEE to your home screen">${I('addhome')}Add to Home</button>`}
function installSheet(){
  const p=platform(); if(!installTab) installTab=p==='android'?'android':'ios';
  G={id:'install'}; openSheet('Add SMISKEE to your home screen'); drawInstall(p);
}
function drawInstall(p){
  const ios=`<div class="steps">
    <div class="step"><p>Open this page in <b>Safari</b>. Other iPhone browsers may not show the option.</p></div>
    <div class="step"><p>Tap the <span class="kbd">${I('share')}Share</span> button at the bottom of the screen (on iPad it's at the top).</p></div>
    <div class="step"><p>Scroll down and tap <span class="kbd">${I('plusbox')}Add to Home Screen</span>.</p></div>
    <div class="step"><p>Name it <b>SMISKEE</b> and tap <b>Add</b> in the top-right corner.</p></div></div>`;
  const android=`<div class="steps">
    <div class="step"><p>Open this page in <b>Chrome</b>.</p></div>
    <div class="step"><p>Tap the <span class="kbd">${I('dots')}Menu</span> button in the top-right corner.</p></div>
    <div class="step"><p>Tap <span class="kbd">${I('addhome')}Add to Home screen</span> or <b>Install app</b>.</p></div>
    <div class="step"><p>Tap <b>Install</b> to confirm. SMISKEE appears with your other apps.</p></div></div>`;
  SB(`<div class="stack">
    ${deferredInstall?`<div class="card forest stack" style="gap:10px"><p style="font-weight:700">Your browser can install SMISKEE directly.</p><button class="btn gold block" data-act="install-now">Install now</button></div>`:''}
    <div class="seg"><button data-act="itab" data-v="ios" aria-pressed="${installTab==='ios'}">iPhone</button><button data-act="itab" data-v="android" aria-pressed="${installTab==='android'}">Android</button></div>
    ${p!=='other'&&((p==='ios')===(installTab==='ios'))?`<p class="small muted">We detected you're on ${p==='ios'?'an iPhone or iPad':'Android'}.</p>`:''}
    ${installTab==='ios'?ios:android}
    <p class="small muted">After adding it, open SMISKEE from your home screen each morning for your check-in.</p>
    <button class="btn primary block" data-act="close">Got it</button></div>`);
}

/* ---------- toast / copy / redeem ---------- */
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=msg;t.setAttribute('role','status');document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
function copyCode(code){
  try{navigator.clipboard.writeText(code).then(()=>toast('Code copied'),()=>toast(code))}catch(e){toast(code)}
}
function redeemSheet(id){
  const r=rewards().find(x=>x.id===id);if(!r)return;G={id:'redeem',r};
  openSheet('Redeem reward');
  SB(`<div class="stack"><div class="reward" style="box-shadow:none">${voucher(r)}<div class="grow"><h3>${esc(r.brand)}</h3><p class="small muted">${r.val?'RM'+r.val+' digital voucher':'Company perk, approved by your leader'}</p></div></div>
  <div class="card flat stack" style="gap:6px"><div class="row between small"><span class="muted">Your balance</span><b class="num">${fmt(st.points)} pts</b></div><div class="row between small"><span class="muted">Cost</span><b class="num">− ${fmt(r.pts)} pts</b></div><div class="row between small" style="border-top:1px solid var(--line);padding-top:8px"><span class="muted">After redeeming</span><b class="num">${fmt(st.points-r.pts)} pts</b></div></div>
  <button class="btn primary block" data-act="confirm-redeem" id="redeem-btn">Redeem for ${fmt(r.pts)} pts</button><button class="btn ghost block" data-act="close">Cancel</button></div>`);
}
async function confirmRedeem(){
  const r=G.r, btn=$('#redeem-btn'); if(btn.disabled)return; btn.disabled=true; btn.textContent='Redeeming…';
  let res;
  try{res=await act.redeem(r.id)}catch(e){btn.disabled=false;btn.textContent=`Redeem for ${fmt(r.pts)} pts`;toast(friendly(e));return}
  const exp=res.exp;
  SB(`<div class="result"><p class="eyebrow">Redeemed</p><h2 style="font-size:22px">${esc(r.brand)}</h2><p class="muted small">Show this code at the counter. Valid until ${exp.getDate()} ${MON[exp.getMonth()]} ${exp.getFullYear()}.</p>
  <div class="code" style="width:100%">${esc(res.code)}</div><div class="row" style="width:100%"><button class="btn ghost" style="flex:1" data-act="copy" data-code="${esc(res.code)}">${I('copy')}Copy code</button><button class="btn primary" style="flex:1" data-act="close">Done</button></div></div>`);
}

/* ---------- sign in ---------- */
function keepLogin(fn){
  const vals={};['l-name','l-id','l-dept'].forEach(id=>{const el=$('#'+id);if(el)vals[id]=el.value});
  fn();render();Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v});
}
async function submitLogin(){
  const name=$('#l-name')?.value.trim()||'', id=$('#l-id')?.value.trim()||'', pw=$('#l-pw')?.value||'', dept=$('#l-dept')?.value||'Digital Banking';
  const signup=sb&&authMode==='signup', signin=sb&&authMode==='signin';
  const err={};
  if(!signin&&name.length<2)err.name='Enter your full name.';
  if(!validStaff(id))err.id='Use the format on your staff card, for example MY-1842.';
  if(sb&&signup&&pw.length<8)err.pw='Use at least 8 characters.';
  else if(sb&&signup&&pw!==($('#l-pw2')?.value||''))err.pw='The two passwords don\'t match.';
  if(sb&&signin&&!pw)err.pw='Enter your password.';
  if(Object.keys(err).length){keepLogin(()=>loginErr=err);return}
  if(!sb){st=seed(name,id,dept,loginRole);saveLocal();loginErr={};location.hash='home';render();toast(`Welcome, ${firstName(name)}`);return}
  const btn=$('#login-btn');btn.disabled=true;btn.textContent=signup?'Creating account…':'Signing in…';
  try{
    if(signup){
      const {data,error}=await sb.auth.signUp({email:staffEmail(id),password:pw,options:{data:{full_name:name,staff_id:normStaff(id),department:dept,role:loginRole}}});
      if(error)throw error;
      if(!data.session)throw new Error('Account created, but email confirmation is switched on in Supabase. Ask your administrator to turn off "Confirm email", then sign in.');
    }else{
      const {error}=await sb.auth.signInWithPassword({email:staffEmail(id),password:pw});
      if(error)throw error;
    }
    await loadCloud();
    loginErr={};location.hash='home';render();toast(`Welcome, ${firstName(st.user.name)}`);
  }catch(e){
    let m=friendly(e);
    if(/Invalid login credentials/i.test(m))m='Staff ID or password is incorrect.';
    if(/already registered|already exists/i.test(m))m='This staff ID already has an account. Sign in instead.';
    if(/rate limit/i.test(m))m='Too many attempts. Please wait a minute and try again.';
    if(/Database error saving new user/i.test(m))m='This staff ID is already registered. Sign in instead, or check the ID.';
    keepLogin(()=>loginErr={form:m});
  }
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]'); if(go){location.hash=go.dataset.go;return}
  const el=e.target.closest('[data-act]'); if(!el)return;
  const a=el.dataset.act, v=el.dataset.v;
  switch(a){
    case 'lrole':loginRole=v;document.querySelectorAll('[data-act=lrole]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));break;
    case 'demo':st=seed('Irfan Hakim','MY-1842','Digital Banking',loginRole);saveLocal();location.hash='home';render();toast('Signed in as a sample employee');break;
    case 'mood':draft.mood=draft.mood===v?null:v;document.querySelectorAll('.mood').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===draft.mood));break;
    case 'tag':{const i=draft.tags.indexOf(v);i>-1?draft.tags.splice(i,1):draft.tags.push(v);el.setAttribute('aria-pressed',draft.tags.includes(v));break}
    case 'edit':{editing=true;const c=st.checkins[today()];draft={...c,tags:[...c.tags]};render();break}
    case 'cancel-edit':editing=false;draft=null;render();break;
    case 'play':startGame(el.dataset.g);break;
    case 'session':{const s=st.sessions.find(x=>x.id===el.dataset.id);if(s)startGame('session',{s});break}
    case 'remind':run(()=>act.remind(el.dataset.id),on=>on?'We\'ll remind you before it starts':'Reminder removed').then(render);break;
    case 'end-session':run(()=>act.endSession(el.dataset.id),'Session ended').then(render);break;
    case 'close':closeSheet();break;
    case 'replay':{const id=G.id,s=G.s;clearInterval(timer);startGame(id,{s});break}
    case 'qa':G.ans=+el.dataset.k;if(G.ans===G.qs[G.i].a)G.score++;drawQuiz();break;
    case 'qnext':G.i++;G.ans=null;drawQuiz();break;
    case 'flip':flip(+el.dataset.i);break;
    case 'spin':doSpin();break;
    case 'breath-open':startGame('breath');break;
    case 'breath-start':breathStart();break;
    case 'ba':{if(G.ans!=null)break;G.ans=+el.dataset.k;if(G.ans===G.qs[G.i].a)G.score++;drawBrain();setTimeout(()=>{if(!G||G.id!=='brain')return;G.i++;G.ans=null;drawBrain()},650);break}
    case 'filter':rewardFilter=v;render();break;
    case 'mycoupons':rewardFilter='My coupons';break;
    case 'redeem':redeemSheet(el.dataset.id);break;
    case 'confirm-redeem':confirmRedeem();break;
    case 'copy':copyCode(el.dataset.code);break;
    case 'install':installSheet();break;
    case 'itab':installTab=v;drawInstall(platform());break;
    case 'install-now':if(deferredInstall){deferredInstall.prompt();deferredInstall.userChoice.then(c=>{deferredInstall=null;if(c&&c.outcome==='accepted')closeSheet();else drawInstall(platform())}).catch(()=>{})}break;
    case 'rweek':recapWeek=v;render();break;
    case 'intent':run(()=>act.intent(el.dataset.wk,+el.dataset.i),r=>r.on?(r.points?`+${r.points} pts · intention saved`:'Intention saved'):'Intention removed').then(render);break;
    case 'role':st.user.role=v;cache.pulse=null;cache.pulseAt=0;saveLocal();render();toast(v==='leader'?'Leader view on: Team pulse added to Home':'Employee view on');break;
    case 'reset':if(!resetArm){resetArm=true;render();setTimeout(()=>{resetArm=false;if(st&&route()==='profile')render()},4000)}else{resetArm=false;const u=st.user;st=seed(u.name,u.staffId,u.dept,u.role);saveLocal();render();toast('Demo data reset')}break;
    case 'signout':act.signOut().then(()=>{draft=null;authMode='signin';loginErr={};history.replaceState(null,'',location.pathname);authMode='signin';render()});break;
  }
});
document.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='login')submitLogin();
  if(e.target.id==='ci-form'){
    const first=!st.checkins[today()];
    draft.note=$('#ci-note').value.trim();
    const c={stress:draft.stress,mood:draft.mood,tags:[...draft.tags],note:draft.note};
    const btn=e.target.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Saving…';
    run(()=>act.checkin(c),pts=>pts?`Checked in · +${pts} pts`:first?'Checked in':'Check-in updated').then(()=>{
      if(st&&st.checkins[today()]){editing=false;draft=null;render();window.scrollTo(0,0)}else{btn.disabled=false;btn.textContent='Try again'}});
  }
  if(e.target.id==='host-form'){
    const n=$('#h-name').value.trim()||'Team Trivia', when=$('#h-when').value;
    run(()=>act.host(n,when),'Session published to your team').then(()=>{location.hash='games';render()});
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheet').hidden)closeSheet()});
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});

/* ---------- start ---------- */
async function boot(){
  if(sb){
    try{
      const {data}=await sb.auth.getSession();
      if(data.session){$('#app').innerHTML='<div class="loading">'+MARK+'<p>Loading SMISKEE…</p></div>';await loadCloud()}
    }catch(e){st=null;toast(friendly(e))}
    sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&st&&st.mode==='cloud'){st=null;render()}});
  }
  if(!st){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.mode==='demo'&&d.v===2)st=d}catch(e){}}
  render();
}
boot();
