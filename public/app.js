'use strict';
/* SMISKEE — employee motivation app, in English and Bahasa Malaysia.
   Two modes:
   - cloud: Supabase is configured in config.js. Real accounts (staff ID + password),
            data in Postgres, and every points rule runs inside the database.
   - demo:  "Try with a sample employee", or no database configured. Everything is
            kept in this browser only, with sample history. */

/* ---------- language and text size ---------- */
let LANG=(()=>{try{const v=localStorage.getItem('smiskee-lang');if(v==='en'||v==='ms')return v}catch(e){}return /^(ms|id)/i.test(navigator.language||'')?'ms':'en'})();
const L=(en,ms)=>LANG==='ms'?ms:en;
function setLang(l){LANG=l==='ms'?'ms':'en';try{localStorage.setItem('smiskee-lang',LANG)}catch(e){}document.documentElement.lang=LANG}
document.documentElement.lang=LANG;
let TEXT=(()=>{try{const v=localStorage.getItem('smiskee-text');return ['md','lg','xl'].includes(v)?v:'md'}catch(e){return 'md'}})();
function setText(t){TEXT=t;try{localStorage.setItem('smiskee-text',t)}catch(e){}}

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
plusbox:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>',
bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
shield:'<path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/>',
type:'<path d="M4 7V5h10v2M9 5v14M7 19h4M14 12v-1h6v1M17 11v8M15.5 19h3"/>',
send:'<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 4-4"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
close:'<path d="M6 6l12 12M18 6 6 18"/>'
};
const I=(n,c='')=>`<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n]}</svg>`;
const MARK='<span class="mark"><img src="icons/logo-mark.png" alt="" width="240" height="165"></span>';

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
const toKL=iso=>new Date(new Date(iso).toLocaleString('en-US',{timeZone:TZ}));
const klKey=iso=>dkey(toKL(iso));
const today=()=>dkey(nowKL());
const fmt=n=>Number(n).toLocaleString('en-MY');
const mon=i=>L(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'])[i];
const dowInitials=()=>L(['M','T','W','T','F','S','S'],['I','S','R','K','J','S','A']);
const dayShort=i=>L(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'])[i];
const dayLong=i=>L(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'])[i];
const clock=d=>{const h=d.getHours(),m=d.getMinutes();return LANG==='ms'?`${h%12||12}:${pad(m)} ${h<12?'pagi':'petang'}`:`${h%12||12}:${pad(m)} ${h<12?'AM':'PM'}`};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const firstName=n=>String(n||'').trim().split(/\s+/)[0];
const band=s=>s<=4?'calm':s<=6?'press':'high';
const bandLabel=s=>s<=2?L('Calm','Tenang'):s<=4?L('Manageable','Terkawal'):s<=6?L('Under pressure','Agak tertekan'):s<=8?L('Stressed','Tertekan'):L('Overwhelmed','Sangat tertekan');

/* ---------- content ---------- */
const MOODS=[{id:'great',face:'◠◡◠',en:'Great',ms:'Gembira'},{id:'good',face:'◡',en:'Good',ms:'Baik'},{id:'okay',face:'—',en:'Okay',ms:'Biasa'},{id:'tense',face:'≈',en:'Tense',ms:'Tegang'},{id:'drained',face:'︵',en:'Drained',ms:'Letih'}];
const moodLabel=id=>{const m=MOODS.find(x=>x.id===id);return m?L(m.en,m.ms):''};
const TAGS=['Sales targets','Customer queue','Compliance & audit','System issues','Workload','Month-end closing','Personal'];
const TAG_MS={'Sales targets':'Sasaran jualan','Customer queue':'Barisan pelanggan','Compliance & audit':'Pematuhan & audit','System issues':'Masalah sistem','Workload':'Beban kerja','Month-end closing':'Tutup akaun hujung bulan','Personal':'Peribadi'};
const tTag=t=>LANG==='ms'?(TAG_MS[t]||t):t;
const DEPTS=['Retail Banking','Digital Banking','Operations','Credit & Risk','Treasury','Compliance'];
const DEPT_MS={'Retail Banking':'Perbankan Runcit','Digital Banking':'Perbankan Digital','Operations':'Operasi','Credit & Risk':'Kredit & Risiko','Treasury':'Perbendaharaan','Compliance':'Pematuhan'};
const tDept=d=>LANG==='ms'?(DEPT_MS[d]||d):d;
const BADGES=[
 {id:'Team Player',ms:'Pemain Berpasukan',icon:'team'},
 {id:'Positive Energy',ms:'Tenaga Positif',icon:'spark'},
 {id:'Customer Hero',ms:'Wira Pelanggan',icon:'heart'},
 {id:'Problem Solver',ms:'Penyelesai Masalah',icon:'key'},
 {id:'Mentor',ms:'Mentor',icon:'user'},
 {id:'Innovation',ms:'Inovasi',icon:'spark'}];
const tBadge=b=>{if(b==='Leader Round')return L('Leader Round','Pusingan Pemimpin');const x=BADGES.find(y=>y.id===b);return x?L(x.id,x.ms):b};
const badgeIcon=b=>b==='Leader Round'?'trophy':(BADGES.find(y=>y.id===b)||{icon:'trophy'}).icon;
const NOTES=[
 {h:['Make today count.','Jadikan hari ini bermakna.'],b:['Every contribution matters. Keep growing, keep inspiring.','Setiap sumbangan penting. Terus berkembang, terus memberi inspirasi.']},
 {h:['Progress over perfection.','Kemajuan lebih penting daripada kesempurnaan.'],b:['A good day is built from small things done well, one customer at a time.','Hari yang baik dibina daripada perkara kecil yang dibuat dengan baik, seorang pelanggan pada satu masa.']},
 {h:['Small wins add up.','Kejayaan kecil akan bertambah.'],b:['Notice what went right today, even if it was just one thing.','Perhatikan apa yang berjalan lancar hari ini, walaupun hanya satu perkara.']},
 {h:["You don't carry it alone.",'Anda tidak memikulnya seorang diri.'],b:['Your team is here. Ask for help early, offer it often.','Pasukan anda ada di sini. Minta bantuan awal, tawarkan bantuan selalu.']},
 {h:['Pace yourself.','Atur rentak anda.'],b:['Busy branches need steady people. Take your breaks, they are part of the work.','Cawangan yang sibuk memerlukan orang yang tenang. Ambil waktu rehat anda, ia sebahagian daripada kerja.']}];
const QUOTES=[
 {q:['Success is the sum of small efforts, repeated day in and day out.','Kejayaan ialah hasil usaha kecil yang diulang hari demi hari.'],a:'Robert Collier'},
 {q:['Well done is better than well said.','Buat dengan baik lebih bernilai daripada cakap dengan baik.'],a:'Benjamin Franklin'},
 {q:['A journey of a thousand miles begins with a single step.','Perjalanan seribu batu bermula dengan satu langkah.'],a:'Lao Tzu'},
 {q:['Do what you can, with what you have, where you are.','Lakukan apa yang anda mampu, dengan apa yang anda ada, di mana anda berada.'],a:'Theodore Roosevelt'}];
const TIPS={
 'Sales targets':['Break your monthly target into a daily number and count each day you hit it, not just month-end.','Pecahkan sasaran bulanan kepada angka harian dan raikan setiap hari anda mencapainya, bukan hanya pada hujung bulan.'],
 'Customer queue':['Take a two-minute reset between peak-hour customers: stand, stretch, drink some water.','Ambil rehat dua minit antara pelanggan pada waktu puncak: berdiri, regangkan badan, minum air.'],
 'Compliance & audit':['Block one focused hour early in the week to clear audit and documentation items before they pile up.','Peruntukkan satu jam fokus di awal minggu untuk menyelesaikan urusan audit dan dokumentasi sebelum ia bertimbun.'],
 'System issues':['Report system issues to IT as soon as they happen, and write down the workaround so you only solve it once.','Laporkan masalah sistem kepada IT sebaik sahaja berlaku, dan catat cara penyelesaiannya supaya anda hanya perlu menyelesaikannya sekali.'],
 'Workload':['List your top three tasks each morning, and agree priorities with your leader when everything feels urgent.','Senaraikan tiga tugas utama setiap pagi, dan bincang keutamaan dengan ketua anda apabila semuanya terasa mendesak.'],
 'Month-end closing':['Start reconciliations a few days before month-end so the last day is for review, not rushing.','Mulakan penyesuaian akaun beberapa hari sebelum hujung bulan supaya hari terakhir untuk semakan, bukan tergesa-gesa.'],
 'Personal':['Protect your evenings this week. Leave work at work where you can, and talk to someone you trust.','Lindungi waktu malam anda minggu ini. Tinggalkan urusan kerja di tempat kerja jika boleh, dan berbual dengan seseorang yang anda percayai.']};
const TEAM_TIPS={
 'Sales targets':['Review targets together on Monday and celebrate daily progress, not only month-end totals.','Semak sasaran bersama pada hari Isnin dan raikan kemajuan harian, bukan hanya jumlah hujung bulan.'],
 'Customer queue':['Stagger breaks so no one works a full peak hour without a pause.','Susun waktu rehat secara bergilir supaya tiada sesiapa bekerja sejam penuh pada waktu puncak tanpa rehat.'],
 'Compliance & audit':['Set aside a shared "quiet hour" this week for documentation and audit items.','Tetapkan "waktu senyap" bersama minggu ini untuk dokumentasi dan urusan audit.'],
 'System issues':["Collect the week's system issues in one list and raise them with IT in a single meeting.",'Kumpulkan masalah sistem minggu ini dalam satu senarai dan bawa kepada IT dalam satu mesyuarat.'],
 'Workload':['Hold a short stand-up to re-balance tasks, and agree what can wait until next week.','Adakan taklimat ringkas untuk mengagihkan semula tugas, dan setuju apa yang boleh ditangguhkan ke minggu depan.'],
 'Month-end closing':['Split reconciliation tasks early in the week so the last day is for review, not rushing.','Agihkan tugas penyesuaian akaun awal minggu supaya hari terakhir untuk semakan, bukan tergesa-gesa.'],
 'Personal':['Remind the team about flexible arrangements and the Employee Assistance Programme.','Ingatkan pasukan tentang pengaturan kerja fleksibel dan Program Bantuan Pekerja (EAP).']};
const tx=v=>Array.isArray(v)?L(v[0],v[1]):v;
const QUIZ=[
 {q:['What is the maximum PIDM deposit insurance coverage per depositor, per member bank?','Berapakah had maksimum perlindungan insurans deposit PIDM bagi setiap pendeposit, bagi setiap bank anggota?'],o:[['RM100,000'],['RM250,000'],['RM500,000'],['RM1,000,000']],a:1,e:['PIDM protects deposits up to RM250,000 per depositor per member bank.','PIDM melindungi deposit sehingga RM250,000 bagi setiap pendeposit bagi setiap bank anggota.']},
 {q:["What does OPR stand for in Bank Negara Malaysia's monetary policy?",'Apakah maksud OPR dalam dasar monetari Bank Negara Malaysia?'],o:[['Official Prime Rate','Kadar Prima Rasmi'],['Overnight Policy Rate','Kadar Dasar Semalaman'],['Open Price Ratio','Nisbah Harga Terbuka'],['Operating Profit Return','Pulangan Keuntungan Operasi']],a:1,e:['The Overnight Policy Rate is the benchmark rate set by Bank Negara Malaysia.','Kadar Dasar Semalaman (OPR) ialah kadar penanda aras yang ditetapkan oleh Bank Negara Malaysia.']},
 {q:['In banking, KYC stands for…','Dalam perbankan, KYC bermaksud…'],o:[['Keep Your Cash'],['Know Your Customer','Know Your Customer (Kenali Pelanggan Anda)'],['Key Yield Calculation'],['Know Your Credit']],a:1,e:['Know Your Customer checks verify who a customer is before and during the relationship.','Semakan Kenali Pelanggan Anda mengesahkan identiti pelanggan sebelum dan sepanjang hubungan perbankan.']},
 {q:['CASA refers to which type of deposits?','CASA merujuk kepada jenis deposit yang mana?'],o:[['Current and Savings Accounts','Akaun Semasa dan Akaun Simpanan'],['Credit and Secured Assets','Kredit dan Aset Bercagar'],['Cash and Securities Assets','Tunai dan Aset Sekuriti'],['Corporate Account Settlements','Penyelesaian Akaun Korporat']],a:0,e:['Current Account Savings Account deposits are a low-cost funding source for banks.','Deposit Akaun Semasa dan Akaun Simpanan ialah sumber dana kos rendah bagi bank.']},
 {q:['In Islamic banking, a Murabahah contract is…','Dalam perbankan Islam, kontrak Murabahah ialah…'],o:[['A partnership in profit and loss','Perkongsian untung dan rugi'],['A safekeeping arrangement','Pengaturan simpanan amanah'],['A cost-plus-profit sale','Jualan kos tambah untung'],['A leasing agreement','Perjanjian pajakan']],a:2,e:['Murabahah is a sale where the bank discloses its cost and an agreed profit margin.','Murabahah ialah jualan di mana bank mendedahkan kosnya dan margin keuntungan yang dipersetujui.']},
 {q:['Which Islamic banking concept is based on safekeeping?','Konsep perbankan Islam yang manakah berasaskan simpanan amanah?'],o:[['Wadiah'],['Ijarah'],['Musharakah'],['Tawarruq']],a:0,e:['Wadiah means safekeeping. Many Islamic savings and current accounts use it.','Wadiah bermaksud simpanan amanah. Banyak akaun simpanan dan akaun semasa Islam menggunakannya.']},
 {q:['What can DuitNow transfers use instead of an account number?','Apakah yang boleh digunakan untuk pindahan DuitNow selain nombor akaun?'],o:[['Only a debit card number','Nombor kad debit sahaja'],['Mobile number, MyKad or business registration number','Nombor telefon bimbit, MyKad atau nombor pendaftaran perniagaan'],['Branch code','Kod cawangan'],["Customer's email only",'E-mel pelanggan sahaja']],a:1,e:['DuitNow lets customers send money to a mobile number, MyKad number or business registration number.','DuitNow membolehkan pelanggan menghantar wang ke nombor telefon bimbit, nombor MyKad atau nombor pendaftaran perniagaan.']},
 {q:['A customer gets a call from "the bank" asking for their TAC. What should they do?','Seorang pelanggan menerima panggilan daripada "bank" yang meminta TAC mereka. Apakah yang patut mereka lakukan?'],o:[['Read it out quickly','Bacakan dengan cepat'],['Share only the first 3 digits','Kongsi 3 digit pertama sahaja'],['Never share it and hang up','Jangan kongsi dan tamatkan panggilan'],['Send it by SMS instead','Hantar melalui SMS']],a:2,e:['Banks never ask for a TAC or OTP. Sharing it lets scammers authorise transactions.','Bank tidak akan meminta TAC atau OTP. Berkongsi kod ini membolehkan penipu meluluskan transaksi.']},
 {q:['AML stands for…','AML bermaksud…'],o:[['Automated Money Ledger'],['Anti-Money Laundering','Anti-Money Laundering (Pencegahan Pengubahan Wang Haram)'],['Asset Management Licence'],['Annual Market Limit']],a:1,e:['Anti-Money Laundering rules help detect and report suspicious transactions.','Peraturan pencegahan pengubahan wang haram membantu mengesan dan melaporkan transaksi yang mencurigakan.']},
 {q:['Basel III standards mainly deal with…','Piawaian Basel III terutamanya berkaitan dengan…'],o:[['Bank capital and liquidity','Modal dan kecairan bank'],['Card design','Reka bentuk kad'],['Branch opening hours','Waktu operasi cawangan'],['Mobile app security','Keselamatan aplikasi mudah alih']],a:0,e:['Basel III sets international standards for bank capital adequacy and liquidity.','Basel III menetapkan piawaian antarabangsa bagi kecukupan modal dan kecairan bank.']},
 {q:['What is "Riba" in Islamic finance?','Apakah "Riba" dalam kewangan Islam?'],o:[['A profit-sharing ratio','Nisbah perkongsian untung'],['Interest, which is prohibited','Faedah, yang dilarang'],['A type of takaful','Sejenis takaful'],['A zakat calculation','Pengiraan zakat']],a:1,e:['Riba refers to interest or usury, which Islamic finance prohibits.','Riba merujuk kepada faedah atau usuri, yang dilarang dalam kewangan Islam.']},
 {q:['A Fixed Deposit (FD) usually pays…','Deposit Tetap (FD) biasanya membayar…'],o:[['A variable daily rate','Kadar harian yang berubah-ubah'],['A set rate for a fixed tenure','Kadar tetap bagi tempoh tetap'],['No interest at all','Tiada faedah langsung'],['Interest only on withdrawal day','Faedah hanya pada hari pengeluaran']],a:1,e:['An FD locks a sum for a set tenure at an agreed rate.','FD mengunci sejumlah wang bagi tempoh tetap pada kadar yang dipersetujui.']}];
const qo=o=>o.length>1?L(o[0],o[1]):o[0];
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
const BRAND_MS={'Extended lunch (1 hour)':'Rehat makan tengah hari lanjutan (1 jam)','Half-day leave':'Cuti separuh hari'};
const PERK_MS={'1 HR':'1 JAM','½ DAY':'½ HARI'};
const CAT_MS={All:'Semua',Coffee:'Kopi',Food:'Makanan','Time off':'Cuti','My coupons':'Kupon saya'};
const tBrand=b=>LANG==='ms'?(BRAND_MS[b]||b):b;
const tCat=c=>LANG==='ms'?(CAT_MS[c]||c):c;
const DEPT_BASE={'Retail Banking':18420,'Digital Banking':17240,'Operations':16300,'Credit & Risk':14750,'Treasury':12100,'Compliance':11600};
const GAME_TITLES={quiz:'Banking Knowledge Quiz',memory:'Memory Match',breath:'Focus breathing',brain:'Quick Brain Break'};
const SEG=[20,50,30,100,40,150,60,80];
const LEVEL_STEP=500;
const pointsFor=(g,s)=>{s=Math.max(0,s|0);return g==='quiz'?Math.min(s,5)*30:g==='memory'?(s<6?0:s<=10?100:s<=14?70:40):g==='breath'?80:g==='brain'?Math.min(s,5)*10:0};
const PRIVACY_VERSION='v1-2026-11';
const DEMO_COLLEAGUES=[
 {id:'d1',name:'Nur Aisyah',department:'Digital Banking'},{id:'d2',name:'Faizal Rahman',department:'Retail Banking'},
 {id:'d3',name:'Siti Mariam',department:'Operations'},{id:'d4',name:'Daniel Tan',department:'Digital Banking'},
 {id:'d5',name:'Kavitha Raj',department:'Compliance'},{id:'d6',name:'Hafiz Ismail',department:'Treasury'}];

/* Titles saved in the database are English; show them in the chosen language. */
const TITLE_MS={'Daily check-in':'Daftar masuk harian','Banking Knowledge Quiz':'Kuiz Pengetahuan Perbankan','Memory Match':'Padanan Memori',
 'Focus breathing':'Pernafasan fokus','Quick Brain Break':'Rehat Minda Pantas','Spin & Win':'Putar & Menang','Reward redeemed':'Ganjaran ditebus',
 'Weekly intention set':'Niat mingguan ditetapkan','Sent a thank-you':'Ucapan terima kasih dihantar','Team Player badge':'Lencana Pemain Berpasukan'};
function trTitle(s){
  if(LANG!=='ms'||!s)return s;
  if(TITLE_MS[s])return TITLE_MS[s];
  let m;
  if((m=s.match(/^Leader round with (.+)$/)))return 'Pusingan bersama '+m[1];
  if((m=s.match(/^Recognised by (.+)$/)))return 'Dihargai oleh '+m[1];
  return s;
}
function trSub(s){
  if(!s)return s;
  if(BADGES.some(b=>b.id===s))return tBadge(s);
  if(LANG!=='ms')return s;
  let m;
  if((m=s.match(/^Stress (\d+)\/10$/)))return `Tekanan ${m[1]}/10`;
  if((m=s.match(/^(.*) RM(\d+) voucher$/)))return `${m[1]} baucar RM${m[2]}`;
  if((m=s.match(/^Recognised by (.+)$/)))return 'Dihargai oleh '+m[1];
  return BRAND_MS[s]||s;
}

/* ---------- backend ---------- */
const CFG=window.SMISKEE_CONFIG||{};
const sb=(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase)?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const EMAIL_DOMAIN=CFG.staffEmailDomain||'staff.smiskee.app';
const staffEmail=id=>normStaff(id).toLowerCase()+'@'+EMAIL_DOMAIN;
const normStaff=id=>{let s=String(id||'').trim().toUpperCase().replace(/\s+/g,'');if(/^[A-Z]{2}\d+$/.test(s))s=s.slice(0,2)+'-'+s.slice(2);return s};
const validStaff=id=>/^[A-Z]{2}-\d{3,6}$/.test(normStaff(id));
const privacyContact=()=>CFG.privacyContact||L('your HR department','jabatan sumber manusia anda');

const KEY='smiskee-demo-v2';
let st=null;                       // current user's state (both modes use the same shape)
const cache={lb:null,lbAt:0,pulse:null,pulseAt:0,kudos:null,kudosAt:0,loading:{}};
const isCloud=()=>!!st&&st.mode==='cloud';
const saveLocal=()=>{if(st&&st.mode==='demo'){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}};
let draft=null, editing=false, rewardFilter='All', recapWeek='this', loginRole='employee', authMode='signin', loginErr={}, resetArm=false, G=null, timer=null, busy=false;
let kd={to:null,badge:null,msg:'',tab:'received',q:'',results:[]};
let resetDone=null, hasCode=null;

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
  activity.push({d:dkey(addDays(lastMon,3)),ts:addDays(lastMon,3).getTime()+11*36e5,title:'Recognised by Nur Aisyah',sub:'Team Player',pts:30});
  const ago=h=>new Date(Date.now()-h*36e5).toISOString();
  return {mode:'demo',v:2,user:{name,staffId:normStaff(staffId),dept,role,consentAt:new Date().toISOString()},points:2840,lifetime:3340,checkins,plays,activity,
    keys:[],coupons:[{id:'c0',rid:'zus',brand:'ZUS Coffee',label:'RM15 voucher',code:'SMK-ZU5C-4K2Q',d:dkey(addDays(lastMon,4))}],
    intents:{},badges:['Team Player','Positive Energy','Innovation'],reminders:[],
    notify:{checkin:true,session:true,recap:true,coupon:true},
    notifs:[
      {id:'n1',kind:'session',title:['Faizal Rahman is hosting a live round','Faizal Rahman sedang mengadakan pusingan langsung'],body:['Join "Fintech Trivia Round" now for double points.','Sertai "Fintech Trivia Round" sekarang untuk mata berganda.'],url:'#games',ts:Date.now()-20*60000,read:false},
      {id:'n2',kind:'checkin',title:['Time for your daily check-in','Masa untuk daftar masuk harian'],body:['How are you feeling today? It takes 20 seconds and earns 20 points.','Apa khabar hari ini? Hanya 20 saat dan anda dapat 20 mata.'],url:'#checkin',ts:new Date(dkey(now)+'T09:00:00+08:00').getTime(),read:false},
      {id:'n5',kind:'kudos',title:['Nur Aisyah recognised you: Team Player','Nur Aisyah menghargai anda: Pemain Berpasukan'],body:['Thanks for helping with the month-end report!','Terima kasih kerana membantu laporan hujung bulan!'],url:'#kudos',ts:addDays(lastMon,3).getTime()+11*36e5,read:true},
      {id:'n3',kind:'recap',title:['Your weekly recap is ready','Ringkasan mingguan anda sudah sedia'],body:['See how your week went and pick your intentions for next week.','Lihat perjalanan minggu anda dan pilih niat untuk minggu depan.'],url:'#recap',ts:addDays(lastMon,4).getTime()+17*36e5,read:true}],
    kudos:{
      received:[{id:'k1',from_name:'Nur Aisyah',to_name:name,badge:'Team Player',message:'Thanks for helping with the month-end report!',created_at:new Date(addDays(lastMon,3).getTime()+11*36e5).toISOString()}],
      sent:[],
      wall:[
        {id:'k2',from_name:'Daniel Tan',to_name:'Kavitha Raj',badge:'Problem Solver',message:'Sorted out the DuitNow reconciliation issue in record time.',created_at:ago(3)},
        {id:'k3',from_name:'Siti Mariam',to_name:'Hafiz Ismail',badge:'Mentor',message:'Patient as always with our new joiners.',created_at:ago(26)},
        {id:'k1',from_name:'Nur Aisyah',to_name:name,badge:'Team Player',message:'Thanks for helping with the month-end report!',created_at:new Date(addDays(lastMon,3).getTime()+11*36e5).toISOString()}]},
    sessions:[
      {id:'s1',host:'Faizal Rahman',role:'Head of Retail Branches',name:'Fintech Trivia Round',when:'Live now',live:true},
      {id:'s2',host:'Siti Mariam',role:'Head of Operations',name:'Compliance Quick-fire',when:'Thu · 12:30 PM',live:false},
      {id:'s3',host:'Daniel Tan',role:'Head of Digital Banking',name:'Friday Team Battle',when:'Fri · 4:30 PM',live:false}]};
}
function upgradeDemo(d){
  if(!d.notifs)d.notifs=[];
  if(!d.notify)d.notify={checkin:true,session:true,recap:true,coupon:true};
  if(!d.kudos)d.kudos={received:[],sent:[],wall:[]};
  if(!d.user.consentAt)d.user.consentAt=new Date().toISOString();
  return d;
}

/* Load everything for the signed-in user from Supabase into `st`. */
async function loadCloud(){
  const {data:{user},error:ue}=await sb.auth.getUser();
  if(ue||!user){st=null;return}
  const since=dkey(addDays(nowKL(),-120));
  const q=await Promise.all([
    sb.from('profiles').select('id,full_name,staff_id,department,role,notify,lang,consent_at').eq('id',user.id).maybeSingle(),
    sb.from('checkins').select('day,stress,mood,tags,note').gte('day',since),
    sb.from('ledger').select('day,kind,award_key,title,sub,points,created_at').gte('day',since).order('created_at',{ascending:true}),
    sb.from('plays').select('day,game,points').gte('day',since),
    sb.from('coupons').select('id,reward_id,brand,label,code,created_at,expires_at').order('created_at',{ascending:true}),
    sb.from('badges').select('badge'),
    sb.from('intentions').select('week_start,idx'),
    sb.from('rewards').select('id,brand,category,value_rm,points,color,perk').order('sort'),
    sb.from('session_reminders').select('session_id'),
    sb.rpc('list_sessions'),
    sb.rpc('my_points'),
    sb.from('notifications').select('id,kind,title,body,url,created_at,read_at').order('created_at',{ascending:false}).limit(40)]);
  const bad=q.find(r=>r.error); if(bad) throw bad.error;
  const [pr,ci,lg,pl,cp,bd,it,rw,rm,ss,pt,nf]=q.map(r=>r.data);
  if(!pr) throw new Error(L('Your staff profile was not found. Ask your administrator to check your account.','Profil kakitangan anda tidak ditemui. Minta pentadbir menyemak akaun anda.'));
  const checkins={};(ci||[]).forEach(c=>checkins[c.day]={stress:c.stress,mood:c.mood,tags:c.tags||[],note:c.note||''});
  const keys=(lg||[]).filter(l=>l.award_key).map(l=>l.award_key);
  const spinRow=(lg||[]).find(l=>l.award_key==='spin:'+today());
  const intents={};(it||[]).forEach(r=>{(intents[r.week_start]=intents[r.week_start]||[]).push(r.idx)});
  st={mode:'cloud',
    user:{id:pr.id,name:pr.full_name,staffId:pr.staff_id,dept:pr.department,role:pr.role,lang:pr.lang,consentAt:pr.consent_at},
    checkins,
    plays:(pl||[]).map(p=>({d:p.day,game:p.game,pts:p.points})),
    activity:(lg||[]).map(l=>({d:l.day,ts:Date.parse(l.created_at),title:l.title,sub:l.sub||'',pts:l.points})),
    points:pt?.balance??0, lifetime:pt?.lifetime??0, keys,
    spin:spinRow?{d:today(),v:spinRow.points}:null,
    coupons:(cp||[]).map(c=>({id:c.id,rid:c.reward_id,brand:c.brand,label:c.label,code:c.code,d:klKey(c.created_at),exp:c.expires_at})),
    badges:(bd||[]).map(b=>b.badge), intents,
    rewards:(rw||[]).map(r=>({id:r.id,brand:r.brand,cat:r.category,val:r.value_rm,pts:r.points,c:r.color,perk:r.perk})),
    reminders:(rm||[]).map(r=>r.session_id),
    sessions:(ss||[]).map(s=>({id:s.id,host:s.host_name,role:s.host_title,name:s.name,startsAt:s.starts_at,live:s.live,mine:s.is_mine})),
    notify:pr.notify||{checkin:true,session:true,recap:true,coupon:true},
    notifs:(nf||[]).map(mapNotif)};
}

const mapNotif=n=>({id:n.id,kind:n.kind,title:n.title,body:n.body,url:n.url,ts:Date.parse(n.created_at),read:!!n.read_at});
function fmtStart(iso){if(!iso)return '';const d=toKL(iso),t=nowKL();
  const day=dkey(d)===dkey(t)?L('Today','Hari ini'):dkey(d)===dkey(addDays(t,1))?L('Tomorrow','Esok'):dayShort(d.getDay())+', '+d.getDate()+' '+mon(d.getMonth());
  return `${day} · ${clock(d)}`}
function sessionWhen(s){
  if(s.live)return L('Live now','Sedang berlangsung');
  if(s.startsAt)return fmtStart(s.startsAt);
  const map={'Thu · 12:30 PM':['Thu · 12:30 PM','Kha · 12:30 tengah hari'],'Fri · 4:30 PM':['Fri · 4:30 PM','Jum · 4:30 petang'],'Tomorrow · 12:30 PM':['Tomorrow · 12:30 PM','Esok · 12:30 tengah hari'],'Thu · 4:30 PM':['Thu · 4:30 PM','Kha · 4:30 petang']};
  return map[s.when]?tx(map[s.when]):s.when;
}
const tRole=r=>{if(LANG!=='ms'||!r)return r;let m;if((m=r.match(/^Team leader · (.+)$/)))return 'Ketua pasukan · '+tDept(m[1]);
  const R={'Head of Retail Branches':'Ketua Cawangan Runcit','Head of Operations':'Ketua Operasi','Head of Digital Banking':'Ketua Perbankan Digital'};return R[r]||r};
const ERR_MS=[
 [/You can send up to 5 thank-yous a day/,'Anda boleh menghantar sehingga 5 ucapan terima kasih sehari.'],
 [/You can't send a thank-you to yourself/,'Anda tidak boleh menghantar ucapan terima kasih kepada diri sendiri.'],
 [/^Choose a badge/,'Pilih satu lencana.'],
 [/Colleague not found/,'Rakan sekerja tidak ditemui.'],
 [/asked for a catch-up recently/,'Anda telah meminta perbualan baru-baru ini. Ketua anda sudah dimaklumkan.'],
 [/Only team leaders can host sessions/,'Hanya ketua pasukan boleh mengadakan sesi.'],
 [/session is not live right now|session has ended/,'Sesi ini tidak berlangsung sekarang.'],
 [/Choose when the session starts/,'Pilih bila sesi bermula.'],
 [/This reward is no longer available/,'Ganjaran ini tidak lagi tersedia.'],
 [/You can only plan for this week or next week/,'Anda hanya boleh merancang untuk minggu ini atau minggu depan.']];
const friendly=e=>{let m=(e&&(e.message||e.error_description))||String(e);
  if(/fetch|network|Failed to fetch|NetworkError/i.test(m))return L('No connection. Check your internet and try again.','Tiada sambungan. Semak internet anda dan cuba lagi.');
  if(/JWT|sign in again|refresh token/i.test(m))return L('Your session has expired. Please sign in again.','Sesi anda telah tamat. Sila log masuk semula.');
  const need=m.match(/You need (\d[\d,]*) more points/);if(need)return L(`You need ${need[1]} more points for this reward.`,`Anda perlukan ${need[1]} mata lagi untuk ganjaran ini.`);
  if(LANG==='ms'){for(const [re,ms] of ERR_MS)if(re.test(m))return ms}
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
    const label={now:'Live now','tomorrow-1230':'Tomorrow · 12:30 PM','thu-1630':'Thu · 4:30 PM','fri-1630':'Fri · 4:30 PM'}[when]||when;
    st.sessions.unshift({id:'s'+Date.now(),host:st.user.name,role:'Team leader · '+st.user.dept,name:name||'Team Trivia',when:label,live:when==='now',mine:true});saveLocal();
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
  async markRead(){
    if(!st.notifs.some(n=>!n.read))return;
    st.notifs.forEach(n=>n.read=true);
    if(isCloud()){const {error}=await sb.rpc('mark_notifications_read');if(error)throw error}else saveLocal();
  },
  async setPref(k,on){
    if(isCloud()){const {data,error}=await sb.rpc('set_notify_prefs',{p:{[k]:on}});if(error)throw error;st.notify=data;return}
    st.notify[k]=on;saveLocal();
  },
  async testNotification(){
    if(!isCloud())throw new Error(L('Phone notifications work after you sign in with your staff ID.','Pemberitahuan telefon berfungsi selepas anda log masuk dengan ID kakitangan.'));
    const {error}=await sb.rpc('send_test_notification');if(error)throw error;
  },
  async setLanguage(l){
    setLang(l);
    if(isCloud()){const {error}=await sb.rpc('set_language',{p_lang:l});if(error)throw error;st.user.lang=l}
  },
  async consent(){
    if(isCloud()){const {data,error}=await sb.rpc('give_consent',{p_version:PRIVACY_VERSION});if(error)throw error;st.user.consentAt=data||new Date().toISOString();return}
    st.user.consentAt=new Date().toISOString();saveLocal();
  },
  async newCode(){
    if(!isCloud())throw new Error(L('Recovery codes are for staff accounts. Sign in with your staff ID first.','Kod pemulihan untuk akaun kakitangan. Log masuk dengan ID kakitangan dahulu.'));
    const {data,error}=await sb.rpc('new_recovery_code');if(error)throw error;hasCode=true;return data;
  },
  async searchColleagues(q){
    if(q.trim().length<2)return [];
    if(isCloud()){const {data,error}=await sb.rpc('search_colleagues',{p_q:q});if(error)throw error;return data}
    const s=q.trim().toLowerCase();return DEMO_COLLEAGUES.filter(c=>c.name.toLowerCase().includes(s));
  },
  async sendKudos(to,badge,message){
    if(isCloud()){const {data,error}=await sb.rpc('send_kudos',{p_to:to.id,p_badge:badge,p_message:message});if(error)throw error;
      cache.kudosAt=0;await loadCloud();return data.sender_points}
    const k={id:'k'+Date.now(),from_name:st.user.name,to_name:to.name,badge,message,created_at:new Date().toISOString()};
    const sentToday=st.kudos.sent.filter(x=>klKey(x.created_at)===today()).length;
    if(sentToday>=5)throw new Error('You can send up to 5 thank-yous a day.');
    st.kudos.sent.unshift(k);st.kudos.wall.unshift(k);
    let pts=0;const key='kudos-sent:'+today();
    if(!st.keys.includes(key)){st.keys.push(key);addLocal(10,'Sent a thank-you');pts=10}
    saveLocal();cache.kudos=null;return pts;
  },
  async kudosLists(){
    if(isCloud()){
      const r=await Promise.all(['received','sent','wall'].map(s=>sb.rpc('kudos_feed',{p_scope:s})));
      const bad=r.find(x=>x.error);if(bad)throw bad.error;
      return {received:r[0].data,sent:r[1].data,wall:r[2].data};
    }
    return st.kudos;
  },
  async catchup(){
    if(isCloud()){const {data,error}=await sb.rpc('request_catchup');if(error)throw error;return data}
    return -1;
  },
  async exportData(){
    const out={exported_at:new Date().toISOString(),app:'SMISKEE',mode:st.mode,
      profile:{name:st.user.name,staff_id:st.user.staffId,department:st.user.dept,role:st.user.role,language:LANG,consent_at:st.user.consentAt},
      check_ins:st.checkins,points:{balance:st.points,lifetime:st.lifetime},activity:st.activity.map(a=>({date:a.d,title:a.title,detail:a.sub,points:a.pts})),
      games:st.plays,vouchers:st.coupons,badges:st.badges,weekly_intentions:st.intents,notification_settings:st.notify,
      notifications:st.notifs.map(n=>({title:tx(n.title),body:tx(n.body),at:new Date(n.ts).toISOString(),read:n.read}))};
    try{const k=await act.kudosLists();out.thank_yous={received:k.received,sent:k.sent}}catch(e){}
    return out;
  },
  async deleteAccount(){
    if(isCloud()){
      try{await removeThisDevice()}catch(e){}
      const {error}=await sb.rpc('delete_my_account');if(error)throw error;
      try{await sb.auth.signOut()}catch(e){}
    }
    try{localStorage.removeItem(KEY)}catch(e){}
    st=null;cache.lb=null;cache.pulse=null;cache.kudos=null;
  },
  async signOut(){
    if(isCloud()){try{await removeThisDevice()}catch(e){}try{await sb.auth.signOut()}catch(e){}}
    try{localStorage.removeItem(KEY)}catch(e){}
    st=null;cache.lb=null;cache.pulse=null;cache.kudos=null;hasCode=null;
  }
};
function addLocal(n,title,sub=''){st.points+=n;if(n>0)st.lifetime+=n;st.activity.push({d:today(),ts:Date.now(),title,sub,pts:n})}
async function run(fn,okMsg){
  if(busy)return;busy=true;
  try{const r=await fn();if(okMsg)toast(typeof okMsg==='function'?okMsg(r):okMsg);return r}
  catch(e){toast(friendly(e));if(/sign in again|log masuk semula/i.test(friendly(e))){await act.signOut();render()}}
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
/* Three check-ins in a row at 8 or higher, the latest within the last 3 days. */
function toughStretch(){
  const days=Object.keys(st.checkins).sort().reverse().slice(0,3);
  if(days.length<3||!days.every(d=>st.checkins[d].stress>=8))return false;
  return (pdate(today())-pdate(days[0]))/864e5<=3;
}
const supportDismissed=()=>{try{return localStorage.getItem('smiskee-support-dismissed')===today()}catch(e){return false}};

/* ---------- motivation ---------- */
function motivation(w,prev){
  if(!w.count) return {head:L('Start fresh on Monday.','Mulakan semula pada hari Isnin.'),body:L('There are no check-ins for this week yet. A 20-second check-in each morning helps you notice pressure before it builds up.','Belum ada daftar masuk minggu ini. Daftar masuk 20 saat setiap pagi membantu anda menyedari tekanan sebelum ia bertambah.')};
  const a=w.avg, top=w.tags[0]?.[0];
  let head,body;
  if(a<=4){head=L('You found your rhythm.','Anda sudah menemui rentak anda.');body=L('Your stress stayed in a manageable range this week. Notice what helped, and keep those habits going into next week.','Tahap tekanan anda kekal terkawal minggu ini. Perhatikan apa yang membantu, dan teruskan amalan itu minggu depan.')}
  else if(a<=6.4){head=L('Steady under pressure.','Tenang di bawah tekanan.');body=L("It was a demanding week and you kept showing up. Next week, protect a few small pauses so the pressure doesn't stack up.",'Minggu ini mencabar dan anda tetap hadir. Minggu depan, jaga beberapa rehat kecil supaya tekanan tidak bertimbun.')}
  else {head=L('A heavy week. Go easier on yourself next week.','Minggu yang berat. Berlembutlah dengan diri sendiri minggu depan.');body=L('Your stress ran high for most of the week. That is a signal, not a weakness. Plan lighter where you can, and let your leader know what is weighing on you.','Tahap tekanan anda tinggi hampir sepanjang minggu. Itu satu isyarat, bukan kelemahan. Rancang dengan lebih ringan jika boleh, dan beritahu ketua anda apa yang membebankan anda.')}
  if(prev&&prev.avg!=null){
    const d=a-prev.avg;
    if(d<=-0.5) body+=' '+L(`Your average dropped from ${prev.avg.toFixed(1)} to ${a.toFixed(1)} compared with the week before.`,`Purata anda turun daripada ${prev.avg.toFixed(1)} kepada ${a.toFixed(1)} berbanding minggu sebelumnya.`);
    else if(d>=0.5) body+=' '+L(`Your average rose from ${prev.avg.toFixed(1)} to ${a.toFixed(1)} compared with the week before.`,`Purata anda naik daripada ${prev.avg.toFixed(1)} kepada ${a.toFixed(1)} berbanding minggu sebelumnya.`);
  }
  if(top) body+=' '+L(`Your most common pressure point was ${top.toLowerCase()}.`,`Punca tekanan paling kerap ialah ${tTag(top).toLowerCase()}.`);
  return {head,body};
}
function intentions(w){
  const list=[];
  w.tags.slice(0,2).forEach(([t])=>list.push(tx(TIPS[t])));
  list.push(L('Check in every morning before your first customer.','Daftar masuk setiap pagi sebelum pelanggan pertama.'));
  if(list.length<3) list.push(L('Thank one colleague by name this week on the Appreciation page.','Ucapkan terima kasih kepada seorang rakan sekerja minggu ini di halaman Penghargaan.'));
  if(list.length<3) list.push(L('Play one Brain Break at lunch to reset.','Main satu Rehat Minda semasa makan tengah hari.'));
  return list.slice(0,3);
}

/* ---------- routing ---------- */
const ROUTES=['home','checkin','games','rewards','profile','recap','team','kudos'];
const route=()=>{const h=location.hash.slice(1);return ROUTES.includes(h)?h:'home'};
window.addEventListener('hashchange',()=>{editing=false;render();window.scrollTo(0,0);focusHeading()});
function focusHeading(){const h=$('#main-heading');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}

function render(){
  const app=$('#app'), nav=$('#nav');
  document.documentElement.classList.toggle('lock',!st);app.classList.toggle('login-mode',!st);
  document.documentElement.dataset.text=st?TEXT:'md';
  const sk=$('.skip');if(sk)sk.textContent=L('Skip to content','Langkau ke kandungan');
  if(!st){const h=location.hash.slice(1);const m=h==='signup'?'signup':h==='reset'?'reset':'signin';if(m!==authMode){authMode=m;loginErr={};resetDone=null}
    nav.hidden=true;app.innerHTML=vLogin();window.scrollTo(0,0);return}
  if(isCloud()&&!st.user.consentAt){nav.hidden=true;app.classList.add('login-mode');document.documentElement.classList.add('lock');app.innerHTML=vConsent();return}
  const r=route();
  if(r==='team'&&st.user.role!=='leader'){location.hash='home';return}
  app.innerHTML={home:vHome,checkin:vCheckin,games:vGames,rewards:vRewards,profile:vProfile,recap:vRecap,team:vTeam,kudos:vKudos}[r]();
  nav.hidden=false;
  const cur=r==='recap'?'checkin':r==='team'||r==='kudos'?'home':r;
  const items=[['home','home',L('Home','Utama')],['checkin','pulse',L('Check-in','Daftar masuk')],['games','game',L('Games','Permainan')],['rewards','gift',L('Rewards','Ganjaran')],['profile','user',L('Profile','Profil')]];
  nav.setAttribute('aria-label',L('Main','Utama'));
  nav.innerHTML=items.map(([id,ic,l])=>`<a href="#${id}" ${cur===id?'aria-current="page"':''}>${I(ic)}<span>${l}</span>${id==='checkin'&&!st.checkins[today()]?`<span class="badge"><span class="sr">${L('Not checked in today','Belum daftar masuk hari ini')}</span></span>`:''}</a>`).join('');
  if(r==='checkin') bindSlider();
  if(r==='games') refresh('lb');
  if(r==='team') refresh('pulse');
  if(r==='kudos') refresh('kudos');
  if(r==='profile'&&isCloud()&&hasCode===null) sb.rpc('has_recovery_code').then(({data})=>{hasCode=!!data;if(route()==='profile')render()});
}
/* Fetch leaderboard / team pulse / thank-yous in the background, then redraw. */
const REFRESH_ROUTE={lb:'games',pulse:'team',kudos:'kudos'};
async function refresh(kind){
  const fresh=Date.now()-cache[kind+'At']<60000;
  if((fresh&&cache[kind])||cache.loading[kind])return;
  cache.loading[kind]=true;
  try{cache[kind]=await ({lb:act.leaderboard,pulse:act.pulse,kudos:act.kudosLists}[kind])();cache[kind+'At']=Date.now();cache[kind+'Err']=null}
  catch(e){cache[kind+'Err']=friendly(e);cache[kind+'At']=Date.now()}
  finally{cache.loading[kind]=false}
  if(!st||route()!==REFRESH_ROUTE[kind])return;
  if(kind==='kudos'&&$('#kudos-list')){$('#kudos-list').innerHTML=kudosListHTML();return}
  render();
}

/* ---------- sign in, create account, reset password ---------- */
function langBtn(){return `<button class="lang-btn" data-act="lang" data-v="${LANG==='ms'?'en':'ms'}" lang="${LANG==='ms'?'en':'ms'}" aria-label="${LANG==='ms'?'Switch to English':'Tukar ke Bahasa Malaysia'}">${I('globe')}${LANG==='ms'?'EN':'BM'}</button>`}
function vLogin(){
  const cloud=!!sb, signup=cloud&&authMode==='signup', reset=cloud&&authMode==='reset';
  const err=k=>loginErr[k]?`<p class="err" role="alert">${esc(loginErr[k])}</p>`:'';
  const nameF=`<div><label class="f" for="l-name">${L('Employee name','Nama pekerja')}</label><input type="text" id="l-name" autocomplete="name" placeholder="${L('Enter your full name','Masukkan nama penuh anda')}">${err('name')}</div>`;
  const idDept=`<div class="duo">
        <div><label class="f" for="l-id">${L('Staff ID','ID kakitangan')}</label><input type="text" id="l-id" autocomplete="username" autocapitalize="characters" placeholder="${L('e.g. MY-1842','cth. MY-1842')}"></div>
        <div><label class="f" for="l-dept">${L('Department','Jabatan')}</label><select id="l-dept">${DEPTS.map(d=>`<option value="${esc(d)}" ${d==='Digital Banking'?'selected':''}>${esc(tDept(d))}</option>`).join('')}</select></div>
      </div>${err('id')}`;
  const roleF=`<div role="group" aria-labelledby="role-lbl"><span class="lbl" id="role-lbl">${L('I am signing in as','Saya log masuk sebagai')}</span>
        <div class="seg"><button type="button" data-act="lrole" data-v="employee" aria-pressed="${loginRole==='employee'}">${L('Employee','Pekerja')}</button><button type="button" data-act="lrole" data-v="leader" aria-pressed="${loginRole==='leader'}">${L('Team leader','Ketua pasukan')}</button></div></div>`;
  const brand=`<div class="row between"><div class="brand login-brand">${MARK}SMISKEE</div><div class="top-actions">${langBtn()}${installBtn(true)}</div></div>`;
  const foot=`<p class="note foot-note">${I('lock','sm')}<span>${L('Your access is protected by your organisation.','Akses anda dilindungi oleh organisasi anda.')} <button type="button" class="inline-link" data-act="privacy">${L('Privacy notice','Notis privasi')}</button></span></p>`;
  const demo=`<button class="btn block login-demo" type="button" data-act="demo">${L('Try with a sample employee','Cuba dengan pekerja contoh')}</button>`;

  if(reset){
    if(resetDone) return `<section class="login pad compact">${brand}
      <p class="eyebrow login-eyebrow tight">${L('Password changed','Kata laluan ditukar')}</p>
      <h1 class="login-title" id="main-heading">${L('Save your new recovery code.','Simpan kod pemulihan baharu anda.')}</h1>
      <p class="login-sub">${L('Your old code no longer works. Keep this one somewhere safe, like your phone\'s notes or password manager.','Kod lama anda tidak lagi berfungsi. Simpan kod ini di tempat selamat, seperti nota telefon atau pengurus kata laluan.')}</p>
      <div class="stack" style="gap:14px;margin-top:20px">
        <div class="code" aria-label="${L('Recovery code','Kod pemulihan')}">${esc(resetDone.code)}</div>
        <button class="btn ghost block" type="button" data-act="copy" data-code="${esc(resetDone.code)}">${I('copy')}${L('Copy code','Salin kod')}</button>
        <button class="btn primary block login-btn" type="button" data-act="reset-done">${L('Sign in with new password','Log masuk dengan kata laluan baharu')} ${I('chev')}</button>
      </div>${foot}</section>`;
    return `<section class="login pad compact">
    ${brand}
    <a href="#" class="back-link">‹ ${L('Back to sign in','Kembali ke log masuk')}</a>
    <p class="eyebrow login-eyebrow tight">${L('Forgot password','Lupa kata laluan')}</p>
    <h1 class="login-title" id="main-heading">${L('Reset your password.','Set semula kata laluan.')}</h1>
    <p class="login-sub">${L('Use the recovery code you saved when you created your account.','Gunakan kod pemulihan yang anda simpan semasa membuat akaun.')}</p>
    <form id="reset" class="stack" novalidate>
      <div class="duo">
        <div><label class="f" for="r-id">${L('Staff ID','ID kakitangan')}</label><input type="text" id="r-id" autocomplete="username" autocapitalize="characters" placeholder="MY-1842"></div>
        <div><label class="f" for="r-code">${L('Recovery code','Kod pemulihan')}</label><input type="text" id="r-code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"></div>
      </div>
      <div class="duo">
        <div><label class="f" for="r-pw">${L('New password','Kata laluan baharu')}</label><input type="password" id="r-pw" autocomplete="new-password" placeholder="${L('8+ characters','8+ aksara')}"></div>
        <div><label class="f" for="r-pw2">${L('Confirm','Sahkan')}</label><input type="password" id="r-pw2" autocomplete="new-password" placeholder="${L('Type it again','Taip semula')}"></div>
      </div>
      ${err('form')}
      <button class="btn primary block login-btn" type="submit" id="reset-btn">${L('Reset password','Set semula kata laluan')} ${I('chev')}</button>
      <p class="switch-auth">${L('Lost your recovery code too? Ask your SMISKEE administrator to reset your account.','Kod pemulihan juga hilang? Minta pentadbir SMISKEE menetapkan semula akaun anda.')}</p>
      ${foot}
    </form></section>`;
  }

  if(signup) return `<section class="login pad compact">
    ${brand}
    <a href="#" class="back-link">‹ ${L('Back to sign in','Kembali ke log masuk')}</a>
    <h1 class="login-title signup-title" id="main-heading">${L('Create your account.','Cipta akaun anda.')}</h1>
    <form id="login" class="stack signup-form" novalidate>
      ${nameF}${idDept}
      <div class="duo">
        <div><label class="f" for="l-pw">${L('Password','Kata laluan')}</label><input type="password" id="l-pw" autocomplete="new-password" placeholder="${L('8+ characters','8+ aksara')}"></div>
        <div><label class="f" for="l-pw2">${L('Confirm','Sahkan')}</label><input type="password" id="l-pw2" autocomplete="new-password" placeholder="${L('Type it again','Taip semula')}"></div>
      </div>${err('pw')}
      ${roleF}
      <div class="consent"><input type="checkbox" id="l-consent"><label for="l-consent">${L('I agree to the','Saya bersetuju dengan')} <button type="button" class="inline-link" data-act="privacy">${L('privacy notice','notis privasi')}</button> ${L('and consent to SMISKEE processing my wellbeing check-ins.','dan memberi kebenaran kepada SMISKEE memproses daftar masuk kesejahteraan saya.')}</label></div>${err('consent')}
      ${err('form')}
      <button class="btn primary block login-btn" type="submit" id="login-btn">${L('Create account','Cipta akaun')} ${I('chev')}</button>
      <p class="switch-auth">${L('Already have an account?','Sudah ada akaun?')} <a href="#">${L('Sign in','Log masuk')}</a></p>
    </form>
  </section>`;

  const fields=cloud
    ?`<div><label class="f" for="l-id">${L('Staff ID','ID kakitangan')}</label><input type="text" id="l-id" autocomplete="username" autocapitalize="characters" placeholder="${L('e.g. MY-1842','cth. MY-1842')}">${err('id')}</div>
      <div><div class="row between"><label class="f" for="l-pw">${L('Password','Kata laluan')}</label><a class="forgot" href="#reset">${L('Forgot password?','Lupa kata laluan?')}</a></div><input type="password" id="l-pw" autocomplete="current-password" placeholder="${L('Your password','Kata laluan anda')}">${err('pw')}</div>`
    :nameF+idDept+roleF;
  return `<section class="login pad">
    ${brand}
    <p class="eyebrow login-eyebrow">${L('Next generation motivation','Motivasi generasi baharu')}</p>
    <h1 class="login-title" id="main-heading">${L('Welcome to SMISKEE.','Selamat datang ke SMISKEE.')}</h1>
    <p class="login-sub">${L('A better workday starts with a little motivation.','Hari kerja yang lebih baik bermula dengan sedikit motivasi.')}</p>
    <form id="login" class="stack" novalidate>
      ${fields}
      ${err('form')}
      <button class="btn primary block login-btn" type="submit" id="login-btn">${L('Continue securely','Teruskan dengan selamat')} ${I('chev')}</button>
      ${cloud?`<p class="switch-auth">${L('New to SMISKEE?','Baru di SMISKEE?')} <a href="#signup">${L('Create an account','Cipta akaun')}</a></p>`:''}
      ${demo}
      ${foot}
    </form>
  </section>`;
}

function vConsent(){
  return `<section class="login pad">
    <div class="row between"><div class="brand login-brand">${MARK}SMISKEE</div>${langBtn()}</div>
    <p class="eyebrow login-eyebrow tight">${L('Your privacy','Privasi anda')}</p>
    <h1 class="login-title" id="main-heading">${L('Before you continue.','Sebelum anda teruskan.')}</h1>
    <div class="stack" style="gap:10px;margin-top:16px">
      <p class="small">${L('SMISKEE stores your stress check-ins, moods and notes. These can reveal health information, so we need your consent.','SMISKEE menyimpan daftar masuk tekanan, mood dan nota anda. Maklumat ini boleh mendedahkan maklumat kesihatan, jadi kami memerlukan kebenaran anda.')}</p>
      <ul class="plain-list small">
        <li>${L('Only you can see your check-ins and notes.','Hanya anda boleh melihat daftar masuk dan nota anda.')}</li>
        <li>${L('Leaders see anonymous team averages, only when 5 or more people checked in.','Ketua hanya melihat purata pasukan tanpa nama, apabila 5 orang atau lebih telah daftar masuk.')}</li>
        <li>${L('You can download or delete your data at any time from your profile.','Anda boleh memuat turun atau memadam data anda pada bila-bila masa dari profil anda.')}</li>
      </ul>
      <button class="btn ghost block" type="button" data-act="privacy">${I('shield')}${L('Read the full privacy notice','Baca notis privasi penuh')}</button>
      <button class="btn primary block login-btn" type="button" data-act="consent">${L('I agree, continue','Saya bersetuju, teruskan')} ${I('chev')}</button>
      <button class="btn block login-demo" type="button" data-act="signout">${L('Sign out instead','Log keluar sahaja')}</button>
    </div>
  </section>`;
}

/* ---------- app screens ---------- */
function header(eyebrow,title,sub=''){
  return `<header class="band pad"><div class="row between"><div class="brand">${MARK}SMISKEE</div><div class="top-actions">${installBtn(true)}${bellBtn()}<a href="#profile" class="avatar" style="text-decoration:none" aria-label="${L('Profile','Profil')}">${esc(initials(st.user.name))}</a></div></div>
  <p class="eyebrow" style="margin-top:26px">${eyebrow}</p><h1 id="main-heading" style="margin-top:4px">${title}</h1>${sub?`<p class="muted" style="margin-top:6px">${sub}</p>`:''}</header>`;
}

function toughCard(){
  return `<div class="support" role="region" aria-label="${L('Support','Sokongan')}">
    <b>${L("You've had a few tough days.",'Beberapa hari ini agak berat untuk anda.')}</b>
    <p class="small">${L('Your last three check-ins were 8 or higher. It can help to talk it through. Only you can see this message.','Tiga daftar masuk terakhir anda pada tahap 8 atau lebih. Berbual tentangnya boleh membantu. Hanya anda yang boleh melihat mesej ini.')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <button class="btn primary" data-act="catchup">${L('Ask my leader for a catch-up','Minta ketua untuk berbual')}</button>
      <button class="btn ghost" data-act="breath-open">${L('1-minute breathing reset','Rehat pernafasan 1 minit')}</button>
      <button class="btn ghost" data-act="support-dismiss">${L('Not now','Bukan sekarang')}</button>
    </div>
    <p class="small muted">${L("You can also contact your organisation's Employee Assistance Programme (EAP) for confidential support.",'Anda juga boleh menghubungi Program Bantuan Pekerja (EAP) organisasi anda untuk sokongan sulit.')}</p>
  </div>`;
}

function vHome(){
  const now=nowKL(), h=now.getHours(), greet=h<12?L('Good morning','Selamat pagi'):h<18?L('Good afternoon','Selamat petang'):L('Good evening','Selamat malam');
  const ci=st.checkins[today()], doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
  const note=NOTES[doy%NOTES.length], q=QUOTES[doy%QUOTES.length];
  const prog=levelProg(), w=weekData(0), wd=now.getDay(), recapReady=wd===5||wd===6||wd===0;
  const live=st.sessions.find(s=>s.live&&!sessionDone(s.id)&&!s.mine);
  const acts=[...st.activity].sort((a,b)=>b.ts-a.ts).slice(0,4);
  const lead=st.user.role==='leader';
  return `${header(greet,esc(firstName(st.user.name))+'.',`${esc(tDept(st.user.dept))}${lead?' · '+L('Team leader','Ketua pasukan'):''}`)}
  <main class="pad lift stack" id="main">
    ${toughStretch()&&!supportDismissed()?toughCard():''}
    ${st.mode==='demo'?`<div class="card flat note" style="padding:12px 14px">${I('spark')}<div>${L("You're in demo mode. Your progress is saved on this device only.",'Anda dalam mod demo. Kemajuan anda disimpan pada peranti ini sahaja.')}${sb?` <button class="link" data-act="signout">${L('Sign in with your staff ID','Log masuk dengan ID kakitangan')}</button>`:''}</div></div>`:''}
    ${ci?`<div class="card row between"><div><p class="eyebrow">${L("Today's check-in",'Daftar masuk hari ini')}</p><p style="font-weight:700;margin-top:2px">${L('Stress','Tekanan')} ${ci.stress}/10 · ${bandLabel(ci.stress)}</p></div><span class="chip ${band(ci.stress)}">${I('check')}${L('Done','Selesai')}</span></div>`
    :`<div class="card stack" style="gap:12px"><div class="row between"><p class="eyebrow">${L('Daily check-in','Daftar masuk harian')}</p><span class="chip gold">+20 ${L('pts','mata')}</span></div>
      <h2 style="font-size:1.375rem">${L('How stressed do you feel today?','Sejauh mana anda rasa tertekan hari ini?')}</h2><p class="muted small">${L('It takes 20 seconds. Only you can see your answers.','Hanya 20 saat. Hanya anda yang boleh melihat jawapan anda.')}</p>
      <a href="#checkin" class="btn primary block" style="text-decoration:none">${L('Check in now','Daftar masuk sekarang')} ${I('chev')}</a></div>`}

    <div class="card"><p class="eyebrow">${L("Today's note",'Nota hari ini')}</p><h2 style="font-size:1.375rem;margin-top:6px">${tx(note.h)}</h2><p class="muted" style="margin-top:4px">${tx(note.b)}</p>
      <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px"><p class="quote">"${tx(q.q)}"</p><p class="small muted" style="margin-top:4px">${q.a}</p></div></div>

    <div class="card forest stack" style="gap:14px">
      <div class="row between"><div><p class="small muted">${L('Available balance','Baki tersedia')}</p><p class="num" style="font-size:2.125rem;font-weight:800;letter-spacing:-.03em;line-height:1.1">${fmt(st.points)} <span style="font-size:.875rem;font-weight:600">${L('pts','mata')}</span></p></div><span class="chip gold">${I('spark')}${L('Level','Tahap')} ${level()}</span></div>
      <div><div class="row between small"><span class="muted">${L('Next level','Tahap seterusnya')}</span><span class="num">${LEVEL_STEP-prog} ${L('pts to go','mata lagi')}</span></div><div class="track" style="margin-top:6px" role="progressbar" aria-valuemin="0" aria-valuemax="${LEVEL_STEP}" aria-valuenow="${prog}" aria-label="${L('Progress to next level','Kemajuan ke tahap seterusnya')}"><i style="width:${prog/LEVEL_STEP*100}%"></i></div></div>
      <div class="row between small" style="border-top:1px solid rgba(255,255,255,.1);padding-top:12px"><span class="row" style="gap:8px">${I('flame')}${L('Check-in streak','Rentetan daftar masuk')}</span><b class="num">${streak()} ${L('days','hari')}</b></div>
      <div class="row between small" style="margin-top:-6px"><span class="row" style="gap:8px">${I('cal')}${L('Weekly engagement','Penglibatan mingguan')}</span><b class="num">${engagedDays()}/5 ${L('days','hari')}</b></div>
    </div>

    ${live?`<div class="card stack" style="gap:12px"><div class="row between"><p class="eyebrow">${L('Play with your leaders','Bermain bersama ketua')}</p><span class="chip high">${L('Live','Langsung')}</span></div>
      <div class="session"><div class="host live" aria-hidden="true">${esc(initials(live.host))}</div><div style="flex:1;min-width:0"><p style="font-weight:700">${esc(live.name)}</p><p class="small muted">${L('Hosted by','Dihoskan oleh')} ${esc(live.host)} · ${L('Double points','Mata berganda')}</p></div></div>
      <button class="btn gold block" data-act="session" data-id="${live.id}">${L('Join the round','Sertai pusingan')}</button></div>`:''}

    <div class="card stack" style="gap:12px">
      <div class="row between"><div><p class="eyebrow">${recapReady?L('Your weekly recap is ready','Ringkasan mingguan anda sudah sedia'):L('Your week so far','Minggu anda setakat ini')}</p><p style="font-weight:700;margin-top:2px">${w.avg!=null?L(`Average stress ${w.avg.toFixed(1)}/10`,`Purata tekanan ${w.avg.toFixed(1)}/10`):L('No check-ins yet','Belum ada daftar masuk')}</p></div><a class="link" href="#recap">${L('Open recap','Buka ringkasan')}</a></div>
      ${weekDots(w)}
    </div>

    <div><h2 class="sec-title" style="margin-bottom:10px">${L('Quick actions','Tindakan pantas')}</h2>
      <div class="qa">
        <button data-go="games"><span class="ib">${I('game')}</span>${L('Games','Permainan')}</button>
        <button data-go="kudos"><span class="ib">${I('heart')}</span>${L('Appreciate','Hargai')}</button>
        <button data-go="rewards"><span class="ib">${I('gift')}</span>${L('Rewards','Ganjaran')}</button>
        ${lead?`<button data-go="team"><span class="ib">${I('team')}</span>${L('Team pulse','Nadi pasukan')}</button>`:`<button data-go="recap"><span class="ib">${I('chart')}</span>${L('Recap','Ringkasan')}</button>`}
      </div></div>

    <div class="card"><div class="row between" style="margin-bottom:12px"><h2 class="sec-title">${L('Recent activity','Aktiviti terkini')}</h2></div>
      <div class="list">${acts.map(actRow).join('')||`<p class="muted small">${L('Nothing yet. Check in or play a game to start earning.','Belum ada apa-apa. Daftar masuk atau main permainan untuk mula mengumpul mata.')}</p>`}</div></div>
  </main>`;
}
function relDay(k){const d=pdate(k);return k===today()?L('Today','Hari ini'):k===dkey(addDays(nowKL(),-1))?L('Yesterday','Semalam'):`${dayShort(d.getDay())}, ${d.getDate()} ${mon(d.getMonth())}`}
function actRow(a){
  const ic=a.pts<0?'gift':/^Recognised by|^Sent a thank-you/.test(a.title)?'heart':a.pts===0?'trophy':/check-in/i.test(a.title)?'pulse':'game';
  return `<div class="li"><span class="ib">${I(ic)}</span><div class="grow"><p class="t">${esc(trTitle(a.title))}</p><p class="s">${a.sub?esc(trSub(a.sub))+' · ':''}${relDay(a.d)}</p></div>${a.pts?`<span class="pts num" ${a.pts<0?'style="color:var(--muted)"':''}>${a.pts>0?'+':'−'}${fmt(Math.abs(a.pts))}</span>`:''}</div>`;
}
function weekDots(w){
  const t=today(), D=dowInitials();
  return `<div class="week" role="list">${w.keys.map((k,i)=>{const c=w.cis[i];const d=w.days[i];const lbl=`${dayLong(i)}: ${c?L(`stress ${c.stress} of 10`,`tekanan ${c.stress} daripada 10`):L('no check-in','tiada daftar masuk')}`;
    return `<div role="listitem" aria-label="${lbl}"><div class="d" aria-hidden="true">${D[i]}</div><div class="dot ${c?band(c.stress):''} ${k===t?'today':''}" aria-hidden="true">${c?c.stress:''}</div></div>`}).join('')}</div>`;
}

function vCheckin(){
  const ci=st.checkins[today()], w=weekData(0);
  if(!draft) draft=ci?{...ci,tags:[...ci.tags]}:{stress:5,mood:null,tags:[],note:''};
  const showForm=!ci||editing;
  return `${header(L('Private check-in','Daftar masuk peribadi'),L('How are you feeling today?','Apa khabar anda hari ini?'),L('Take a quiet moment to check in with yourself.','Ambil masa sebentar untuk menyemak diri anda.'))}
  <main class="pad lift stack" id="main">
  ${showForm?`<form class="card stack" id="ci-form" style="gap:22px">
    <div><div class="row between"><p class="eyebrow" id="s-lbl">${L('Stress level','Tahap tekanan')}</p><span class="chip ${band(draft.stress)}" id="s-chip">${bandLabel(draft.stress)}</span></div>
      <div class="row" style="align-items:baseline;gap:6px;margin:10px 0 14px" aria-hidden="true"><span class="big-stress num" id="s-val" style="color:var(--${band(draft.stress)})">${draft.stress}</span><span class="muted" style="font-weight:700">/ 10</span></div>
      <input type="range" class="range" id="s-range" min="1" max="10" step="1" value="${draft.stress}" aria-labelledby="s-lbl" aria-valuetext="${draft.stress} ${L('of 10','daripada 10')}, ${bandLabel(draft.stress)}">
      <div class="scale-l" style="margin-top:8px" aria-hidden="true"><span>1 · ${L('Calm','Tenang')}</span><span>5 · ${L('Pressured','Tertekan')}</span><span>10 · ${L('Overwhelmed','Sangat tertekan')}</span></div></div>
    <fieldset class="bare"><legend class="eyebrow" style="margin-bottom:10px">${L('Mood','Mood')}</legend><div class="moods">${MOODS.map(m=>`<button type="button" class="mood" data-act="mood" data-v="${m.id}" aria-pressed="${draft.mood===m.id}"><span class="face" aria-hidden="true">${m.face}</span>${L(m.en,m.ms)}</button>`).join('')}</div></fieldset>
    <fieldset class="bare"><legend class="eyebrow" style="margin-bottom:10px">${L("What's weighing on you?",'Apa yang membebankan anda?')} <span style="text-transform:none;letter-spacing:0;font-weight:500">${L('(optional)','(pilihan)')}</span></legend><div class="tags">${TAGS.map(t=>`<button type="button" class="tag" data-act="tag" data-v="${esc(t)}" aria-pressed="${draft.tags.includes(t)}">${tTag(t)}</button>`).join('')}</div></fieldset>
    <div><label class="f" for="ci-note">${L('Private note','Nota peribadi')} <span class="muted" style="font-weight:500">${L('(optional)','(pilihan)')}</span></label><textarea id="ci-note" rows="2" maxlength="500" placeholder="${L('Anything you want to remember about today','Apa-apa yang anda mahu ingat tentang hari ini')}">${esc(draft.note)}</textarea></div>
    <div class="stack" style="gap:10px"><button class="btn primary block" type="submit">${ci?L('Update check-in','Kemas kini daftar masuk'):L('Submit check-in · +20 pts','Hantar daftar masuk · +20 mata')}</button>${ci?`<button type="button" class="btn ghost block" data-act="cancel-edit">${L('Cancel','Batal')}</button>`:''}</div>
  </form>`
  :`<div class="card stack" style="gap:14px">
     <div class="row between"><p class="eyebrow">${L('Today','Hari ini')}</p><span class="chip calm">${I('check')}${L('Checked in','Sudah daftar masuk')}</span></div>
     <div class="row" style="align-items:baseline;gap:6px"><span class="big-stress num" style="color:var(--${band(ci.stress)})">${ci.stress}</span><span class="muted" style="font-weight:700">/ 10 · ${bandLabel(ci.stress)}</span></div>
     <div class="tags">${ci.mood?`<span class="chip line">${moodLabel(ci.mood)}</span>`:''}${(ci.tags||[]).map(t=>`<span class="chip line">${esc(tTag(t))}</span>`).join('')}</div>
     ${ci.note?`<p class="small muted">"${esc(ci.note)}"</p>`:''}
     <button class="btn ghost block" data-act="edit">${L("Edit today's check-in",'Ubah daftar masuk hari ini')}</button>
   </div>
   ${toughStretch()?toughCard():ci.stress>=8?supportCard():''}`}

  <div class="card stack" style="gap:14px"><div class="row between"><div><p class="eyebrow">${L('Weekly overview','Gambaran mingguan')}</p><h2 class="sec-title" style="margin-top:2px">${L('Your rhythm this week','Rentak anda minggu ini')}</h2></div><a class="link" href="#recap">${L('Full recap','Ringkasan penuh')}</a></div>
    ${weekDots(w)}
    <div class="stats"><div class="stat"><b class="num">${w.count}</b><span>${L('Check-ins','Daftar masuk')}</span></div><div class="stat"><b class="num">${w.avg!=null?w.avg.toFixed(1):'–'}</b><span>${L('Avg stress','Purata tekanan')}</span></div><div class="stat"><b class="num">${streak()}</b><span>${L('Day streak','Rentetan hari')}</span></div></div>
  </div>
  <div class="card flat note">${I('lock')}<div><b style="color:var(--ink)">${L('Your check-ins are private.','Daftar masuk anda adalah peribadi.')}</b><br>${L('Leaders only see anonymous team averages, and only when five or more people have checked in.','Ketua hanya melihat purata pasukan tanpa nama, dan hanya apabila lima orang atau lebih telah daftar masuk.')}</div></div>
  </main>`;
}
function supportCard(){
  return `<div class="support"><b>${L('That sounds like a lot today.','Hari ini nampaknya berat.')}</b><p class="small">${L("You don't have to handle it alone. You can ask your leader for a 15-minute catch-up, or contact your organisation's Employee Assistance Programme (EAP) for confidential support.",'Anda tidak perlu menghadapinya seorang diri. Anda boleh meminta ketua untuk berbual 15 minit, atau menghubungi Program Bantuan Pekerja (EAP) organisasi anda untuk sokongan sulit.')}</p>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="catchup">${L('Ask my leader for a catch-up','Minta ketua untuk berbual')}</button><button class="btn ghost" data-act="breath-open">${L('1-minute breathing reset','Rehat pernafasan 1 minit')}</button></div></div>`;
}
function bindSlider(){
  const r=$('#s-range'); if(!r) return;
  r.addEventListener('input',()=>{const v=+r.value;draft.stress=v;const b=band(v);
    $('#s-val').textContent=v;$('#s-val').style.color=`var(--${b})`;const c=$('#s-chip');c.className='chip '+b;c.textContent=bandLabel(v);
    r.setAttribute('aria-valuetext',`${v} ${L('of 10','daripada 10')}, ${bandLabel(v)}`)});
  const n=$('#ci-note'); n&&n.addEventListener('input',()=>draft.note=n.value);
}

const GAMES=[
 {id:'quiz',name:['Banking Knowledge Quiz','Kuiz Pengetahuan Perbankan'],desc:['5 questions on Malaysian banking','5 soalan tentang perbankan Malaysia'],pts:150,gi:'Q',c:'calm'},
 {id:'memory',name:['Memory Match','Padanan Memori'],desc:['Match 6 banking pairs in few moves','Padankan 6 pasangan istilah perbankan'],pts:100,gi:'M',c:'gold'},
 {id:'spin',name:['Spin & Win','Putar & Menang'],desc:['One free spin every day','Satu putaran percuma setiap hari'],pts:['Up to 150','Sehingga 150'],gi:'S',c:'press'},
 {id:'breath',name:['Focus Breathing','Pernafasan Fokus'],desc:['A guided 1-minute box breath','Latihan pernafasan berpandu 1 minit'],pts:80,gi:'B',c:'calm'},
 {id:'brain',name:['Quick Brain Break','Rehat Minda Pantas'],desc:['5 fast ringgit sums','5 kiraan ringgit pantas'],pts:50,gi:'RM',c:'gold'}];
function vGames(){
  const left=GAMES.filter(g=>!earnedToday(g.id)).length;
  const colors={calm:['var(--calm-bg)','var(--calm)'],gold:['var(--gold-bg)','var(--gold-ink)'],press:['var(--press-bg)','var(--press)']};
  const lb=cache.lb, max=lb&&lb.length?Math.max(1,...lb.map(x=>x[1])):1;
  return `${header(L('Play & grow','Main & berkembang'),L('Take a break. Play. Earn.','Berehat. Bermain. Kumpul mata.'),L('Short games, real rewards. Points count once per game each day.','Permainan singkat, ganjaran sebenar. Mata dikira sekali bagi setiap permainan setiap hari.'))}
  <main class="pad lift stack" id="main">
    <div class="card forest row between"><div class="row">${I('flame')}<div><p class="small muted">${L('Games left with points today','Permainan berbaki dengan mata hari ini')}</p><p style="font-weight:800;font-size:1.25rem" class="num">${left} ${L('of','daripada')} ${GAMES.length}</p></div></div><span class="chip gold num">${L(`${streak()}-day streak`,`Rentetan ${streak()} hari`)}</span></div>

    <div class="card stack" style="gap:14px"><div><p class="eyebrow">${L('Play with your leaders','Bermain bersama ketua')}</p><h2 class="sec-title" style="margin-top:2px">${L('Leader sessions','Sesi ketua')}</h2><p class="small muted">${L('Leaders host live rounds. Join to earn double points and the Leader Round badge.','Ketua mengadakan pusingan langsung. Sertai untuk mata berganda dan lencana Pusingan Pemimpin.')}</p></div>
      ${st.sessions.length?`<div class="list">${st.sessions.map(s=>{const done=sessionDone(s.id), rem=st.reminders.includes(s.id);
        const btn=s.mine?`<button class="btn ghost sm-btn" data-act="end-session" data-id="${s.id}">${L('End','Tamat')}</button>`
          :done?`<span class="done-tag">${I('check')}<span class="sr">${L('Played','Sudah dimain')}</span></span>`
          :s.live?`<button class="btn gold sm-btn" data-act="session" data-id="${s.id}">${L('Join','Sertai')}</button>`
          :`<button class="btn ghost sm-btn" data-act="remind" data-id="${s.id}" aria-pressed="${rem}">${rem?L('Reminder set','Peringatan ditetapkan'):L('Remind me','Ingatkan saya')}</button>`;
        return `<div class="li"><div class="host ${s.live&&!done?'live':''}" aria-hidden="true">${esc(initials(s.host))}</div><div class="grow"><p class="t">${esc(s.name)}</p><p class="s">${esc(s.host)}${s.mine?' '+L('(you)','(anda)'):''} · ${esc(tRole(s.role))}</p><p class="s" style="font-weight:700;color:${s.live?'var(--high)':'var(--muted)'}">${esc(sessionWhen(s))}</p></div>${btn}</div>`}).join('')}</div>`
      :`<p class="small muted">${L('No sessions this week yet.','Belum ada sesi minggu ini.')}${st.user.role==='leader'?' '+L('You can host one from','Anda boleh mengadakannya dari')+` <a class="link" href="#team">${L('Team pulse','Nadi pasukan')}</a>.`:' '+L('Your leaders will post them here.','Ketua anda akan menyiarkannya di sini.')}</p>`}
    </div>

    <div><h2 class="sec-title" style="margin-bottom:10px">${L('Solo games','Permainan solo')}</h2>
    <div class="ggrid">${GAMES.map(g=>{const[bg,fg]=colors[g.c];const done=earnedToday(g.id);
      return `<button class="game" data-act="play" data-g="${g.id}"><span class="gi" style="background:${bg};color:${fg}" aria-hidden="true">${g.gi}</span><div><h3>${tx(g.name)}</h3><p>${tx(g.desc)}</p></div>
      <div class="foot">${done?`<span class="done-tag">${I('check')} ${L('Earned today','Diperoleh hari ini')}</span>`:`<span class="chip gold">${typeof g.pts==='number'?g.pts+' '+L('pts','mata'):tx(g.pts)}</span>`}<span class="go">${done&&g.id!=='spin'?L('Replay','Main lagi'):done?L('View','Lihat'):L('Play','Main')}</span></div></button>`}).join('')}</div></div>

    <div class="card lb"><div style="margin-bottom:12px"><p class="eyebrow">${L('Team battle · this week','Pertandingan pasukan · minggu ini')}</p><h2 class="sec-title" style="margin-top:2px">${L('Department leaderboard','Papan pendahulu jabatan')}</h2><p class="small muted">${L(`Every point you earn this week counts for ${esc(st.user.dept)}.`,`Setiap mata yang anda kumpul minggu ini dikira untuk ${esc(tDept(st.user.dept))}.`)}</p></div>
      ${!lb?`<p class="small muted">${cache.lbErr?esc(cache.lbErr):L('Loading the leaderboard…','Memuatkan papan pendahulu…')}</p>`
      :`<div class="list">${lb.map(([d,p],i)=>`<div class="li ${d===st.user.dept?'me':''}"><span class="rank">${i+1}</span><div class="grow"><div class="row between"><p class="t">${esc(tDept(d))}${d===st.user.dept?' '+L('(you)','(anda)'):''}</p><span class="small num" style="font-weight:700">${fmt(p)}</span></div><div class="bar-h" aria-hidden="true"><i style="width:${p/max*100}%"></i></div></div></div>`).join('')}</div>`}
      ${st.mode==='demo'?`<p class="small muted" style="margin-top:12px">${L("Other departments' totals are sample figures in demo mode.",'Jumlah jabatan lain ialah angka contoh dalam mod demo.')}</p>`:''}</div>
  </main>`;
}

function vRewards(){
  const cats=['All','Coffee','Food','Time off','My coupons'];
  const list=rewards().filter(r=>rewardFilter==='All'||r.cat===rewardFilter);
  return `${header(L('Marketplace','Pasaran'),L('Rewards worth celebrating.','Ganjaran yang wajar diraikan.'))}
  <main class="pad lift stack" id="main">
    <div class="card forest row between"><div><p class="small muted">${L('Your balance','Baki anda')}</p><p class="num" style="font-size:1.75rem;font-weight:800;letter-spacing:-.03em">${fmt(st.points)} ${L('pts','mata')}</p></div><a href="#games" class="btn gold sm-btn" style="text-decoration:none">${L('Earn more','Kumpul lagi')}</a></div>
    <div class="filters" role="toolbar" aria-label="${L('Filter rewards','Tapis ganjaran')}">${cats.map(c=>`<button data-act="filter" data-v="${c}" aria-pressed="${rewardFilter===c}">${tCat(c)}${c==='My coupons'?` (${st.coupons.length})`:''}</button>`).join('')}</div>
    ${rewardFilter==='My coupons'?(st.coupons.length?[...st.coupons].reverse().map(c=>{const r=rewards().find(x=>x.id===c.rid)||{c:'#315c4c'};const exp=c.exp?new Date(c.exp):addDays(pdate(c.d),30);
      const label=c.label==='Company perk'?L('Company perk','Faedah syarikat'):LANG==='ms'?c.label.replace(/^RM(\d+) voucher$/,'Baucar RM$1'):c.label;
      return `<div class="reward">${voucher(r)}<div class="grow"><h3>${esc(tBrand(c.brand))}</h3><p class="small muted">${esc(label)} · ${L('valid until','sah sehingga')} ${exp.getDate()} ${mon(exp.getMonth())}</p><p class="num mono" style="margin-top:4px">${esc(c.code)}</p></div><button class="x" data-act="copy" data-code="${esc(c.code)}" aria-label="${L('Copy code','Salin kod')} ${esc(c.code)}">${I('copy')}</button></div>`}).join(''):`<div class="card flat"><p class="muted">${L("You haven't redeemed any rewards yet.",'Anda belum menebus sebarang ganjaran.')}</p></div>`)
    :`<p class="small muted">${list.length} ${L('rewards','ganjaran')}</p>`+list.map(r=>{const can=st.points>=r.pts;
      return `<div class="reward">${voucher(r)}<div class="grow"><p class="eyebrow" style="font-size:.625rem">${r.cat==='Time off'?L('Company perk','Faedah syarikat'):L('Digital voucher','Baucar digital')}</p><h3>${esc(tBrand(r.brand))}</h3><p class="small muted">${can?L('Available instantly','Tersedia serta-merta'):L(`${fmt(r.pts-st.points)} more pts needed`,`Perlu ${fmt(r.pts-st.points)} mata lagi`)}</p></div>
      <button class="btn ${can?'primary':'ghost'} sm-btn" data-act="redeem" data-id="${r.id}" ${can?'':'disabled'} aria-label="${L('Redeem','Tebus')} ${esc(tBrand(r.brand))}, ${fmt(r.pts)} ${L('points','mata')}"><span class="num">${fmt(r.pts)}</span></button></div>`}).join('')}
    ${st.mode==='demo'?`<p class="small muted">${L("Voucher codes in demo mode are for illustration and can't be used at outlets.",'Kod baucar dalam mod demo hanya untuk contoh dan tidak boleh digunakan di kedai.')}</p>`:''}
  </main>`;
}
function voucher(r){const perk=r.perk?(LANG==='ms'?(PERK_MS[r.perk]||r.perk):r.perk):null;return `<div class="voucher" style="background:${esc(r.c)}" aria-hidden="true"><b>${esc(perk||'RM'+r.val)}</b><span>${r.perk?L('PERK','FAEDAH'):L('VOUCHER','BAUCAR')}</span></div>`}

function vRecap(){
  const off=recapWeek==='this'?0:-1, w=weekData(off), prev=weekData(off-1), m=motivation(w,prev);
  const s=w.days[0], e=w.days[6];
  const range=`${s.getDate()} ${mon(s.getMonth())} – ${e.getDate()} ${mon(e.getMonth())}`;
  const wk=dkey(addDays(s,7)); const ints=intentions(w); const committed=st.intents[wk]||[];
  const canPlan=off===0;
  const diff=prev.avg!=null&&w.avg!=null?w.avg-prev.avg:null;
  const qi=QUOTES[s.getDate()%QUOTES.length];
  const D=dowInitials();
  return `<header class="band pad"><div class="row between"><a href="#checkin" class="link">‹ ${L('Back','Kembali')}</a><div class="top-actions">${installBtn(true)}${bellBtn()}</div></div>
    <p class="eyebrow" style="margin-top:22px">${L('Weekly recap','Ringkasan mingguan')}</p><h1 id="main-heading" style="margin-top:4px">${range}</h1>
    <div class="tabs" style="margin-top:16px" role="group" aria-label="${L('Choose week','Pilih minggu')}"><button data-act="rweek" data-v="this" aria-pressed="${recapWeek==='this'}">${L('This week','Minggu ini')}</button><button data-act="rweek" data-v="last" aria-pressed="${recapWeek==='last'}">${L('Last week','Minggu lepas')}</button></div></header>
  <main class="pad lift stack" id="main">
    <div class="card stack" style="gap:14px">
      <div class="row between" style="align-items:flex-start"><div><p class="eyebrow">${L('Average stress','Purata tekanan')}</p><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="big-stress num" style="font-size:3.25rem;color:var(--${w.avg!=null?band(Math.round(w.avg)):'muted'})">${w.avg!=null?w.avg.toFixed(1):'–'}</span><span class="muted" style="font-weight:700">/ 10</span></div></div>
        ${w.avg!=null?`<span class="chip ${band(Math.round(w.avg))}">${bandLabel(Math.round(w.avg))}</span>`:''}</div>
      ${diff!=null?`<p class="small" style="font-weight:600;color:${diff<0?'var(--calm)':diff>0?'var(--high)':'var(--muted)'}"><span aria-hidden="true">${diff<0?'▼':diff>0?'▲':'■'}</span> ${diff<0?L('Down','Turun'):diff>0?L('Up','Naik'):L('No change','Tiada perubahan')} ${Math.abs(diff).toFixed(1)} ${L('vs. the week before','berbanding minggu sebelumnya')} (${prev.avg.toFixed(1)})</p>`:''}
      <figure style="margin:0"><figcaption class="sr">${L('Stress by day','Tekanan mengikut hari')}: ${w.cis.map((c,i)=>`${dayLong(i)} ${c?c.stress:L('none','tiada')}`).join(', ')}</figcaption>
        <div aria-hidden="true"><div class="chart"><div class="yax"><span>10</span><span>5</span><span>0</span></div>
        <div class="plot"><div class="gl" style="top:0"></div><div class="gl" style="top:50%"></div>${w.cis.map(c=>c?`<div class="b ${band(c.stress)}" style="height:${c.stress*10}%"><em class="num">${c.stress}</em></div>`:'<div class="b none"></div>').join('')}</div></div>
        <div class="xax">${D.map(d=>`<span>${d}</span>`).join('')}</div></div></figure>
      ${w.peak?`<p class="small muted">${L('Toughest day','Hari paling mencabar')}: <b style="color:var(--ink)">${dayLong(w.peak.i)}</b> ${L('at','pada')} ${w.peak.c.stress}/10.</p>`:''}
    </div>

    <div class="stats"><div class="stat solo"><b class="num">${w.count}</b><span>${L('Check-ins','Daftar masuk')}</span></div><div class="stat solo"><b class="num">${w.plays.length}</b><span>${L('Games played','Permainan dimain')}</span></div><div class="stat solo"><b class="num">${fmt(w.pts)}</b><span>${L('Points earned','Mata diperoleh')}</span></div></div>

    ${w.tags.length?`<div class="card"><p class="eyebrow">${L('What weighed on you','Apa yang membebankan anda')}</p><div class="stack" style="gap:10px;margin-top:12px">${w.tags.slice(0,4).map(([t,n])=>`<div><div class="row between small"><span style="font-weight:600">${esc(tTag(t))}</span><span class="muted num">${n} ${n>1?L('days','hari'):L('day','hari')}</span></div><div class="bar-h" aria-hidden="true"><i style="width:${n/w.count*100}%;background:var(--press)"></i></div></div>`).join('')}</div>
      ${Object.keys(w.moods).length?`<p class="eyebrow" style="margin-top:18px">${L('Moods logged','Mood yang direkod')}</p><div class="tags" style="margin-top:8px">${MOODS.filter(x=>w.moods[x.id]).map(x=>`<span class="chip line"><span aria-hidden="true">${x.face}</span> ${L(x.en,x.ms)} × ${w.moods[x.id]}</span>`).join('')}</div>`:''}</div>`:''}

    <div class="card forest stack" style="gap:12px"><p class="eyebrow">${L('Your motivation for next week','Motivasi anda untuk minggu depan')}</p><h2 style="font-size:1.5rem">${m.head}</h2><p style="color:var(--on-forest-muted)">${m.body}</p>
      <div style="border-top:1px solid rgba(255,255,255,.12);padding-top:12px"><p class="quote">"${tx(qi.q)}"</p><p class="small muted" style="margin-top:4px">${qi.a}</p></div></div>

    ${w.avg!=null&&w.avg>=7?supportCard():''}

    ${canPlan?`<div class="card stack" style="gap:10px"><div><p class="eyebrow">${L('Plan for next week','Rancangan minggu depan')}</p><h2 class="sec-title" style="margin-top:2px">${L('Pick your intentions','Pilih niat anda')}</h2><p class="small muted">${L('Tap to commit. Each one earns 10 pts the first time.','Ketik untuk komited. Setiap satu memberi 10 mata pada kali pertama.')}</p></div>
      ${ints.map((t,i)=>{const on=committed.includes(i);return `<button class="intent" data-act="intent" data-wk="${wk}" data-i="${i}" aria-pressed="${on}"><span class="box" aria-hidden="true">${on?I('check'):''}</span><span>${esc(t)}</span></button>`}).join('')}</div>`:''}
  </main>`;
}

function vTeam(){
  const t=cache.pulse;
  const head=header(L('Team pulse','Nadi pasukan'),L('How your team is doing.','Keadaan pasukan anda.'),`${esc(tDept(st.user.dept))}${t&&t.sample?' · '+L('sample data','data contoh'):''}`);
  const hostForm=`<form class="card stack" id="host-form"><div><p class="eyebrow">${L('Host a session','Adakan sesi')}</p><h2 class="sec-title" style="margin-top:2px">${L('Play with your team','Bermain bersama pasukan')}</h2><p class="small muted">${L('Everyone in the app sees your session. Live sessions stay open for 3 hours.','Semua orang dalam aplikasi melihat sesi anda. Sesi langsung dibuka selama 3 jam.')}</p></div>
      <div><label class="f" for="h-name">${L('Session name','Nama sesi')}</label><input type="text" id="h-name" maxlength="60" placeholder="${L('e.g. Thursday Trivia','cth. Kuiz Khamis')}"></div>
      <div><label class="f" for="h-when">${L('When','Bila')}</label><select id="h-when"><option value="now">${L('Live now','Sekarang')}</option><option value="tomorrow-1230">${L('Tomorrow · 12:30 PM','Esok · 12:30 tengah hari')}</option><option value="thu-1630">${L('Thursday · 4:30 PM','Khamis · 4:30 petang')}</option><option value="fri-1630">${L('Friday · 4:30 PM','Jumaat · 4:30 petang')}</option></select></div>
      <button class="btn primary block" type="submit">${L('Publish session','Siarkan sesi')}</button></form>`;
  const privacy=`<div class="card flat note">${I('lock')}<div>${L('You only see anonymous averages. Results appear when five or more people have checked in this week, and no individual answers or notes are ever shown. If someone asks you for a catch-up, you only see their name and the request.','Anda hanya melihat purata tanpa nama. Keputusan muncul apabila lima orang atau lebih telah daftar masuk minggu ini, dan jawapan atau nota individu tidak pernah ditunjukkan. Jika seseorang meminta untuk berbual, anda hanya melihat nama mereka dan permintaan itu.')}</div></div>`;
  if(!t) return `${head}<main class="pad lift stack" id="main"><div class="card"><p class="muted">${cache.pulseErr?esc(cache.pulseErr):L('Loading your team pulse…','Memuatkan nadi pasukan…')}</p></div>${hostForm}${privacy}</main>`;
  if(!t.enough) return `${head}<main class="pad lift stack" id="main"><div class="card stack" style="gap:10px"><p class="eyebrow">${L('Not enough check-ins yet','Belum cukup daftar masuk')}</p><h2 class="sec-title">${L(`${t.checked} of 5 people have checked in this week`,`${t.checked} daripada 5 orang telah daftar masuk minggu ini`)}</h2><p class="small muted">${L(`To protect privacy, the team pulse appears once at least five people in ${esc(t.department)} have checked in. Your department has ${t.members} ${t.members===1?'member':'members'} on SMISKEE.`,`Untuk melindungi privasi, nadi pasukan muncul selepas sekurang-kurangnya lima orang dalam ${esc(tDept(t.department))} telah daftar masuk. Jabatan anda mempunyai ${t.members} ahli di SMISKEE.`)}</p><div class="track light" aria-hidden="true"><i style="width:${Math.min(100,t.checked/5*100)}%"></i></div></div>${hostForm}${privacy}</main>`;
  const avg=Number(t.avg), prevAvg=t.prev_avg!=null?Number(t.prev_avg):null, diff=prevAvg!=null?avg-prevAvg:null;
  const dist=[['calm',t.calm,L('Calm','Tenang')],['press',t.press,L('Pressured','Tertekan')],['high',t.high,L('High','Tinggi')]];
  const top=t.tags&&t.tags[0]?t.tags[0].tag:null;
  return `${head}
  <main class="pad lift stack" id="main">
    <div class="card stack" style="gap:14px">
      <div class="row between"><div><p class="eyebrow">${L('Team average stress','Purata tekanan pasukan')}</p><div class="row" style="align-items:baseline;gap:6px;margin-top:4px"><span class="big-stress num" style="font-size:3.25rem;color:var(--${band(Math.round(avg))})">${avg.toFixed(1)}</span><span class="muted" style="font-weight:700">/ 10</span></div></div>
        ${diff!=null?`<span class="chip ${diff<=0?'calm':'high'}"><span aria-hidden="true">${diff<=0?'▼':'▲'}</span> ${Math.abs(diff).toFixed(1)} ${L('vs last week','berbanding minggu lepas')}</span>`:''}</div>
      <div class="stats"><div class="stat"><b class="num">${t.checked}/${t.members}</b><span>${L('Checked in','Daftar masuk')}</span></div><div class="stat"><b class="num">${Math.round(t.checked/Math.max(1,t.members)*100)}%</b><span>${L('Participation','Penyertaan')}</span></div><div class="stat"><b class="num">${t.high}</b><span>${L('Feeling high stress','Tekanan tinggi')}</span></div></div>
      <div><div class="dist" aria-hidden="true">${dist.filter(d=>d[1]>0).map(([b,n])=>`<i style="flex:${n};background:var(--${b})"></i>`).join('')}</div>
      <div class="row small muted" style="margin-top:8px;gap:14px;flex-wrap:wrap">${dist.map(([b,n,l])=>`<span><b style="color:var(--${b})" aria-hidden="true">●</b> ${l} ${n}</span>`).join('')}</div></div>
    </div>
    ${t.tags&&t.tags.length?`<div class="card"><p class="eyebrow">${L('Top pressure points','Punca tekanan utama')}</p><div class="stack" style="gap:10px;margin-top:12px">${t.tags.map(x=>`<div><div class="row between small"><span style="font-weight:600">${esc(tTag(x.tag))}</span><span class="muted num">${x.people} ${L(x.people===1?'person':'people','orang')}</span></div><div class="bar-h" aria-hidden="true"><i style="width:${x.people/t.checked*100}%;background:var(--press)"></i></div></div>`).join('')}</div></div>`:''}
    ${top?`<div class="card forest stack" style="gap:8px"><p class="eyebrow">${L('Suggested action','Tindakan dicadangkan')}</p><p style="font-weight:700;font-size:1.0625rem">${L(`${esc(top)} is the main pressure point.`,`${esc(tTag(top))} ialah punca tekanan utama.`)}</p><p class="small" style="color:var(--on-forest-muted)">${esc(tx(TEAM_TIPS[top])||L('Talk to the team about what would help this week.','Berbincang dengan pasukan tentang apa yang boleh membantu minggu ini.'))} ${L('A short game round on Thursday afternoon can also lift energy.','Pusingan permainan ringkas pada petang Khamis juga boleh menaikkan semangat.')}</p></div>`:''}
    ${hostForm}${privacy}
  </main>`;
}

/* ---------- appreciation ---------- */
function vKudos(){
  const can=kd.to&&kd.badge;
  return `${header(L('Appreciation','Penghargaan'),L('Say thank you.','Ucapkan terima kasih.'),L('Recognise a colleague. They get 30 points and a badge.','Hargai rakan sekerja. Mereka dapat 30 mata dan satu lencana.'))}
  <main class="pad lift stack" id="main">
    <form class="card stack" id="kudos-form" style="gap:18px">
      <div>
        <label class="f" for="k-q">${L('Who do you want to thank?','Siapa yang anda mahu hargai?')}</label>
        ${kd.to?`<div class="picked"><span class="host" aria-hidden="true">${esc(initials(kd.to.name))}</span><div class="grow"><p class="t">${esc(kd.to.name)}</p><p class="s">${esc(tDept(kd.to.department))}</p></div><button type="button" class="btn ghost sm-btn" data-act="k-clear">${L('Change','Tukar')}</button></div>`
        :`<div class="search">${I('search')}<input type="search" id="k-q" autocomplete="off" placeholder="${L('Search by name or staff ID','Cari mengikut nama atau ID kakitangan')}" value="${esc(kd.q)}" aria-describedby="k-hint" aria-controls="k-results"></div>
          <p class="s muted" id="k-hint" style="margin-top:6px">${L('Type at least 2 letters.','Taip sekurang-kurangnya 2 huruf.')}</p>
          <div id="k-results" class="results" aria-live="polite">${kudosResults()}</div>`}
      </div>
      <fieldset class="bare"><legend class="f">${L('Choose a badge','Pilih lencana')}</legend>
        <div class="badge-grid">${BADGES.map(b=>`<button type="button" class="badge-pick" data-act="k-badge" data-v="${esc(b.id)}" aria-pressed="${kd.badge===b.id}">${I(b.icon)}<span>${L(b.id,b.ms)}</span></button>`).join('')}</div></fieldset>
      <div><label class="f" for="k-msg">${L('Message','Mesej')} <span class="muted" style="font-weight:500">${L('(optional)','(pilihan)')}</span></label>
        <textarea id="k-msg" rows="2" maxlength="140" placeholder="${L('What did they do that made a difference?','Apa yang mereka lakukan yang membawa perubahan?')}">${esc(kd.msg)}</textarea>
        <p class="s muted" style="text-align:right;margin-top:4px" id="k-count" aria-live="polite">${kd.msg.length}/140</p></div>
      <button class="btn primary block" type="submit" ${can?'':'disabled'}>${I('send')}${L('Send thank-you','Hantar ucapan terima kasih')}</button>
      <p class="s muted">${L('You get 10 points for your first thank-you each day. You can send up to 5 a day.','Anda dapat 10 mata untuk ucapan terima kasih pertama setiap hari. Anda boleh menghantar sehingga 5 sehari.')}</p>
    </form>

    <div class="card stack" style="gap:14px" id="kudos-list">${kudosListHTML()}</div>
  </main>`;
}
function kudosListHTML(){
  const k=cache.kudos||(st.mode==='demo'?st.kudos:null);
  const items=k?k[kd.tab]:null;
  return `
      <div class="seg three" role="group" aria-label="${L('Show','Tunjuk')}">${[['received',L('Received','Diterima')],['sent',L('Sent','Dihantar')],['wall',L('Wall','Dinding')]].map(([v,l])=>`<button type="button" data-act="k-tab" data-v="${v}" aria-pressed="${kd.tab===v}">${l}</button>`).join('')}</div>
      ${kd.tab==='wall'?`<p class="s muted">${L('Thank-yous shared across SMISKEE in the last 30 days.','Ucapan terima kasih di seluruh SMISKEE dalam 30 hari lalu.')}</p>`:''}
      ${items==null?`<p class="small muted">${cache.kudosErr?esc(cache.kudosErr):L('Loading…','Memuatkan…')}</p>`
      :items.length?`<div class="list">${items.map(kudosRow).join('')}</div>`
      :`<p class="small muted">${kd.tab==='received'?L('No thank-yous yet. They will show up here.','Belum ada ucapan terima kasih. Ia akan muncul di sini.'):kd.tab==='sent'?L("You haven't sent any yet. Make someone's day.",'Anda belum menghantar sebarang ucapan. Ceriakan hari seseorang.'):L('Nothing on the wall yet. Be the first.','Dinding masih kosong. Jadilah yang pertama.')}</p>`}`;
}
function kudosResults(){
  if(kd.q.trim().length<2)return '';
  if(!kd.results.length)return `<p class="s muted">${L('No colleagues found.','Tiada rakan sekerja ditemui.')}</p>`;
  return kd.results.map(c=>`<button type="button" class="li result" data-act="k-pick" data-id="${esc(c.id)}"><span class="host" aria-hidden="true">${esc(initials(c.name))}</span><span class="grow"><span class="t">${esc(c.name)}</span><span class="s">${esc(tDept(c.department))}</span></span></button>`).join('');
}
function kudosRow(k){
  const when=k.created_at?relDay(klKey(k.created_at)):'';
  const who=kd.tab==='received'?L(`From ${k.from_name}`,`Daripada ${k.from_name}`):kd.tab==='sent'?L(`To ${k.to_name}`,`Kepada ${k.to_name}`):`${k.from_name} → ${k.to_name}`;
  return `<div class="li" style="align-items:flex-start"><span class="ib">${I(badgeIcon(k.badge))}</span><div class="grow"><p class="t">${esc(tBadge(k.badge))}</p><p class="s">${esc(who)} · ${when}</p>${k.message?`<p class="small" style="margin-top:4px">"${esc(k.message)}"</p>`:''}</div></div>`;
}
let kTimer=null;
function bindKudos(){
  const q=$('#k-q');
  if(q){q.addEventListener('input',()=>{kd.q=q.value;clearTimeout(kTimer);kTimer=setTimeout(async()=>{try{kd.results=await act.searchColleagues(kd.q)}catch(e){kd.results=[]}const r=$('#k-results');if(r)r.innerHTML=kudosResults()},250)})}
  const m=$('#k-msg');if(m)m.addEventListener('input',()=>{kd.msg=m.value;const c=$('#k-count');if(c)c.textContent=`${m.value.length}/140`});
}

/* ---------- profile ---------- */
function vProfile(){
  const u=st.user, done=st.plays.length;
  const row=(act,icon,t,s,extra='')=>`<button type="button" class="li row-btn" data-act="${act}" ${extra}><span class="ib">${I(icon)}</span><span class="grow"><span class="t">${t}</span><span class="s">${s}</span></span>${I('chev')}</button>`;
  return `${header(L('My profile','Profil saya'),L('Employee profile','Profil pekerja'))}
  <main class="pad lift stack" id="main">
    <div class="card stack" style="gap:16px"><div class="row"><div class="avatar" style="width:56px;height:56px;font-size:1.125rem" aria-hidden="true">${esc(initials(u.name))}</div><div style="min-width:0"><p style="font-weight:800;font-size:1.125rem">${esc(u.name)}</p><p class="small muted">${u.role==='leader'?L('Team leader','Ketua pasukan'):L('Employee','Pekerja')} · ${esc(tDept(u.dept))}</p><p class="small muted">${L('Staff ID','ID kakitangan')} ${esc(u.staffId)}</p></div></div>
      <div class="stats"><div class="stat"><b class="num">${fmt(st.points)}</b><span>${L('Points','Mata')}</span></div><div class="stat"><b class="num">${level()}</b><span>${L('Level','Tahap')}</span></div><div class="stat"><b class="num">${done}</b><span>${L('Games','Permainan')}</span></div></div></div>
    <div class="card"><p class="eyebrow">${L('Collected badges','Lencana dikumpul')}</p><div class="tags" style="margin-top:10px">${st.badges.length?st.badges.map(b=>`<span class="chip gold">${I(badgeIcon(b))}${esc(tBadge(b))}</span>`).join(''):`<p class="small muted">${L('Join a leader session or get thanked by a colleague to earn your first badge.','Sertai sesi ketua atau dapatkan penghargaan rakan sekerja untuk lencana pertama anda.')}</p>`}</div></div>
    <div class="card"><div class="list">
      <a class="li" href="#kudos" style="text-decoration:none;color:inherit"><span class="ib">${I('heart')}</span><div class="grow"><p class="t">${L('Appreciation','Penghargaan')}</p><p class="s">${L('Thank a colleague, see your thank-yous','Hargai rakan sekerja, lihat ucapan terima kasih anda')}</p></div>${I('chev')}</a>
      <a class="li" href="#rewards" data-act="mycoupons" style="text-decoration:none;color:inherit"><span class="ib">${I('gift')}</span><div class="grow"><p class="t">${L('My coupons','Kupon saya')}</p><p class="s">${st.coupons.length} ${L('redeemed','ditebus')}</p></div>${I('chev')}</a>
      <a class="li" href="#recap" style="text-decoration:none;color:inherit"><span class="ib">${I('chart')}</span><div class="grow"><p class="t">${L('Weekly recap','Ringkasan mingguan')}</p><p class="s">${L("Stress summary and next week's plan",'Ringkasan tekanan dan rancangan minggu depan')}</p></div>${I('chev')}</a>
      ${u.role==='leader'?`<a class="li" href="#team" style="text-decoration:none;color:inherit"><span class="ib">${I('team')}</span><div class="grow"><p class="t">${L('Team pulse','Nadi pasukan')}</p><p class="s">${L('Anonymous team wellbeing','Kesejahteraan pasukan tanpa nama')}</p></div>${I('chev')}</a>`:''}
    </div></div>
    ${notifSettings()}
    <div class="card stack" style="gap:14px"><div><p class="eyebrow">${L('Language and display','Bahasa dan paparan')}</p></div>
      <div role="group" aria-labelledby="lang-lbl"><p class="f" id="lang-lbl">${I('globe','sm')} ${L('Language','Bahasa')}</p>
        <div class="seg"><button data-act="set-lang" data-v="en" lang="en" aria-pressed="${LANG==='en'}">English</button><button data-act="set-lang" data-v="ms" lang="ms" aria-pressed="${LANG==='ms'}">Bahasa Malaysia</button></div></div>
      <div role="group" aria-labelledby="text-lbl"><p class="f" id="text-lbl">${I('type','sm')} ${L('Text size','Saiz teks')}</p>
        <div class="seg three"><button data-act="set-text" data-v="md" aria-pressed="${TEXT==='md'}">${L('Standard','Biasa')}</button><button data-act="set-text" data-v="lg" aria-pressed="${TEXT==='lg'}" style="font-size:1.0625rem">${L('Large','Besar')}</button><button data-act="set-text" data-v="xl" aria-pressed="${TEXT==='xl'}" style="font-size:1.1875rem">${L('Extra large','Sangat besar')}</button></div></div>
    </div>
    <div class="card"><p class="eyebrow" style="margin-bottom:6px">${L('Privacy and security','Privasi dan keselamatan')}</p><div class="list">
      ${row('privacy','shield',L('Privacy notice','Notis privasi'),L('What SMISKEE stores and who can see it','Apa yang SMISKEE simpan dan siapa boleh melihatnya'))}
      ${isCloud()?row('new-code','key',L('Recovery code','Kod pemulihan'),hasCode===false?L("You don't have one yet. Create one so you can reset your password.",'Anda belum ada kod. Cipta satu supaya anda boleh set semula kata laluan.'):L('Create a new code if you lost yours. The old one stops working.','Cipta kod baharu jika kod anda hilang. Kod lama tidak lagi berfungsi.')):''}
      ${row('export','download',L('Download my data','Muat turun data saya'),L('A copy of everything SMISKEE holds about you','Salinan semua maklumat SMISKEE tentang anda'))}
      ${row('delete-open','trash',st.mode==='demo'?L('Delete demo data','Padam data demo'):L('Delete my account','Padam akaun saya'),L('Permanently remove your account and data','Buang akaun dan data anda secara kekal'))}
    </div></div>
    ${st.mode==='demo'?`<div class="card stack" style="gap:10px"><p class="eyebrow">${L('Demo settings','Tetapan demo')}</p>
      <div class="seg"><button data-act="role" data-v="employee" aria-pressed="${u.role==='employee'}">${L('Employee view','Paparan pekerja')}</button><button data-act="role" data-v="leader" aria-pressed="${u.role==='leader'}">${L('Leader view','Paparan ketua')}</button></div>
      <p class="small muted">${L('Earlier weeks are filled with sample check-ins so you can see the recap. Everything is saved on this device only.','Minggu terdahulu diisi dengan daftar masuk contoh supaya anda boleh melihat ringkasan. Semuanya disimpan pada peranti ini sahaja.')}</p>
      <button class="btn ghost block" data-act="reset">${resetArm?L('Tap again to clear all data','Ketik sekali lagi untuk padam semua data'):L('Reset demo data','Set semula data demo')}</button>
      <button class="btn ghost block" data-act="signout">${L('Leave demo','Keluar demo')}</button></div>`
    :`<div class="card stack" style="gap:10px"><p class="eyebrow">${L('Account','Akaun')}</p><p class="small muted">${L('Your progress is saved to your SMISKEE account, so you can sign in on any device.','Kemajuan anda disimpan dalam akaun SMISKEE, jadi anda boleh log masuk pada mana-mana peranti.')}</p>
      <button class="btn ghost block" data-act="signout">${L('Sign out','Log keluar')}</button></div>`}
  </main>`;
}

/* ---------- privacy notice ---------- */
function privacyHTML(){
  const c=esc(privacyContact());
  const sec=(h,body)=>`<section class="pn"><h3>${h}</h3>${body}</section>`;
  const ul=a=>`<ul class="plain-list">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  return `<div class="stack privacy" style="gap:16px">
    <p class="small muted">${L('Version 1 · Last updated 11 November 2026','Versi 1 · Dikemas kini 11 November 2026')}</p>
    ${sec(L('Who we are','Siapa kami'),`<p>${L(`SMISKEE is your organisation's employee wellbeing and motivation app. Your organisation is responsible for the personal data in SMISKEE. For questions or requests, contact ${c}.`,`SMISKEE ialah aplikasi kesejahteraan dan motivasi pekerja organisasi anda. Organisasi anda bertanggungjawab ke atas data peribadi dalam SMISKEE. Untuk pertanyaan atau permintaan, hubungi ${c}.`)}</p>`)}
    ${sec(L('What we collect','Apa yang kami kumpul'),ul([
      L('<b>Account details:</b> your name, staff ID, department and role.','<b>Butiran akaun:</b> nama, ID kakitangan, jabatan dan peranan anda.'),
      L('<b>Wellbeing check-ins:</b> your stress level, mood, what is weighing on you and any private notes. This can reveal information about your health, so we ask for your explicit consent first. Check-ins are optional.','<b>Daftar masuk kesejahteraan:</b> tahap tekanan, mood, apa yang membebankan anda dan nota peribadi. Maklumat ini boleh mendedahkan maklumat kesihatan anda, jadi kami meminta kebenaran jelas anda dahulu. Daftar masuk adalah pilihan.'),
      L('<b>Activity:</b> games played, points, vouchers, badges, thank-yous sent and received, session reminders and catch-up requests.','<b>Aktiviti:</b> permainan, mata, baucar, lencana, ucapan terima kasih yang dihantar dan diterima, peringatan sesi dan permintaan berbual.'),
      L('<b>Settings and devices:</b> your language and notification choices, and a technical address for each device where you turn on phone notifications.','<b>Tetapan dan peranti:</b> pilihan bahasa dan pemberitahuan anda, dan alamat teknikal bagi setiap peranti di mana anda menghidupkan pemberitahuan telefon.')]))}
    ${sec(L('Why we use it','Mengapa kami menggunakannya'),`<p>${L('To show you your check-ins and weekly recap, run games and rewards, send the reminders you choose, and show leaders anonymous team averages so they can support their teams.','Untuk menunjukkan daftar masuk dan ringkasan mingguan anda, menjalankan permainan dan ganjaran, menghantar peringatan pilihan anda, dan menunjukkan purata pasukan tanpa nama kepada ketua supaya mereka boleh menyokong pasukan.')}</p>`)}
    ${sec(L('Who can see what','Siapa boleh melihat apa'),ul([
      L('<b>Only you:</b> your check-ins, moods, notes and weekly recap.','<b>Hanya anda:</b> daftar masuk, mood, nota dan ringkasan mingguan anda.'),
      L('<b>Team leaders:</b> anonymous averages for their department, only when 5 or more people have checked in that week. Never individual answers.','<b>Ketua pasukan:</b> purata tanpa nama bagi jabatan mereka, hanya apabila 5 orang atau lebih telah daftar masuk minggu itu. Tidak pernah jawapan individu.'),
      L('<b>If you ask for a catch-up:</b> leaders in your department see your name and that you would like a chat. Nothing else.','<b>Jika anda meminta untuk berbual:</b> ketua dalam jabatan anda melihat nama anda dan bahawa anda mahu berbual. Tiada maklumat lain.'),
      L('<b>Colleagues:</b> your name and department when they search to thank you. Thank-yous you send or receive appear on the Appreciation wall with names, badge and message.','<b>Rakan sekerja:</b> nama dan jabatan anda apabila mereka mencari untuk menghargai anda. Ucapan terima kasih yang anda hantar atau terima muncul di dinding Penghargaan bersama nama, lencana dan mesej.'),
      L('<b>Administrators</b> can access the database to run and support the service.','<b>Pentadbir</b> boleh mengakses pangkalan data untuk menjalankan dan menyokong perkhidmatan.')]))}
    ${sec(L('Where it is stored','Di mana ia disimpan'),`<p>${L('Your data is stored with Supabase (database and sign-in) in the Singapore region. The app itself is hosted on GitHub Pages. Data travels over encrypted connections. Phone notifications pass through your device\'s push service (for example Google or Apple) in encrypted form.','Data anda disimpan dengan Supabase (pangkalan data dan log masuk) di rantau Singapura. Aplikasi ini dihoskan di GitHub Pages. Data dihantar melalui sambungan yang disulitkan. Pemberitahuan telefon melalui perkhidmatan tolak peranti anda (contohnya Google atau Apple) dalam bentuk yang disulitkan.')}</p>`)}
    ${sec(L('How long we keep it','Berapa lama kami menyimpannya'),`<p>${L('As long as you have an account. Notifications are deleted after 60 days. When you delete your account, your data is deleted straight away; copies in the hosting provider\'s backups expire on their normal schedule.','Selagi anda mempunyai akaun. Pemberitahuan dipadam selepas 60 hari. Apabila anda memadam akaun, data anda dipadam serta-merta; salinan dalam sandaran penyedia hos tamat mengikut jadual biasa.')}</p>`)}
    ${sec(L('Your choices and rights','Pilihan dan hak anda'),ul([
      L('Download a copy of your data: Profile → Download my data.','Muat turun salinan data anda: Profil → Muat turun data saya.'),
      L('Turn reminders on or off: Profile → Notifications.','Hidupkan atau matikan peringatan: Profil → Pemberitahuan.'),
      L('Withdraw your consent and erase your data: Profile → Delete my account.','Tarik balik kebenaran dan padam data anda: Profil → Padam akaun saya.'),
      L(`Ask to correct your details, or ask any question: contact ${c}.`,`Minta pembetulan butiran anda, atau tanya apa-apa soalan: hubungi ${c}.`)]))}
    ${sec(L('Changes','Perubahan'),`<p>${L('If this notice changes in an important way, SMISKEE will ask you to agree again.','Jika notis ini berubah dengan ketara, SMISKEE akan meminta persetujuan anda semula.')}</p>`)}
    <button class="btn primary block" data-act="close">${L('Close','Tutup')}</button>
  </div>`;
}
function openPrivacy(){G={id:'privacy'};openSheet(L('Privacy notice','Notis privasi'));SB(privacyHTML())}

/* ---------- recovery code, delete, export, catch-up ---------- */
function showCode(code,context){
  G={id:'code'};openSheet(L('Save your recovery code','Simpan kod pemulihan anda'));
  SB(`<div class="stack" style="gap:14px">
    <p>${context==='signup'?L('Your account is ready. If you ever forget your password, you can reset it yourself with this code.','Akaun anda sudah sedia. Jika anda terlupa kata laluan, anda boleh set semula sendiri dengan kod ini.'):L('This is your new recovery code. Your old code no longer works.','Ini kod pemulihan baharu anda. Kod lama anda tidak lagi berfungsi.')}</p>
    <div class="code" aria-label="${L('Recovery code','Kod pemulihan')}">${esc(code)}</div>
    <button class="btn ghost block" data-act="copy" data-code="${esc(code)}">${I('copy')}${L('Copy code','Salin kod')}</button>
    <ul class="plain-list small"><li>${L("Save it somewhere only you can reach, like your phone's notes or a password manager.",'Simpan di tempat yang hanya anda boleh capai, seperti nota telefon atau pengurus kata laluan.')}</li><li>${L("We can't show it again. You can create a new one in Profile.",'Kami tidak boleh menunjukkannya lagi. Anda boleh mencipta yang baharu di Profil.')}</li></ul>
    <div class="consent"><input type="checkbox" id="code-saved"><label for="code-saved">${L("I've saved my recovery code",'Saya sudah menyimpan kod pemulihan')}</label></div>
    <button class="btn primary block" data-act="code-done" id="code-done" disabled>${L('Continue','Teruskan')}</button></div>`);
  const cb=$('#code-saved');cb.addEventListener('change',()=>{$('#code-done').disabled=!cb.checked});
}
function deleteSheet(){
  G={id:'delete'};const demo=st.mode==='demo';
  openSheet(demo?L('Delete demo data','Padam data demo'):L('Delete my account','Padam akaun saya'));
  SB(`<div class="stack" style="gap:14px">
    <div class="support"><b>${L("This can't be undone.",'Tindakan ini tidak boleh dibatalkan.')}</b><p class="small">${demo?L('All demo data on this device will be removed.','Semua data demo pada peranti ini akan dibuang.'):L('Your account, check-ins, notes, points, vouchers, badges, thank-yous and notifications will be permanently deleted. This also withdraws your consent.','Akaun, daftar masuk, nota, mata, baucar, lencana, ucapan terima kasih dan pemberitahuan anda akan dipadam secara kekal. Ini juga menarik balik kebenaran anda.')}</p></div>
    ${demo?'':`<p class="small">${L('Want a copy first?','Mahu salinan dahulu?')} <button type="button" class="inline-link" data-act="export">${L('Download my data','Muat turun data saya')}</button></p>`}
    <div><label class="f" for="del-confirm">${L(`Type your staff ID (${esc(st.user.staffId)}) to confirm`,`Taip ID kakitangan anda (${esc(st.user.staffId)}) untuk mengesahkan`)}</label><input type="text" id="del-confirm" autocomplete="off" autocapitalize="characters"></div>
    <button class="btn danger block" data-act="delete-confirm" id="del-btn" disabled>${I('trash')}${demo?L('Delete demo data','Padam data demo'):L('Delete my account','Padam akaun saya')}</button>
    <button class="btn ghost block" data-act="close">${L('Cancel','Batal')}</button></div>`);
  const i=$('#del-confirm');i.addEventListener('input',()=>{$('#del-btn').disabled=normStaff(i.value)!==st.user.staffId});
}
async function doExport(){
  try{
    const data=await act.exportData();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`smiskee-my-data-${today()}.json`;
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
    toast(L('Your data file is downloading','Fail data anda sedang dimuat turun'));
  }catch(e){toast(friendly(e))}
}
function catchupSheet(){
  G={id:'catchup'};openSheet(L('Ask for a catch-up','Minta untuk berbual'));
  SB(`<div class="stack" style="gap:14px">
    <p>${L(`We'll let the team leaders in ${esc(st.user.dept)} know you'd like a 15-minute catch-up.`,`Kami akan memaklumkan ketua pasukan dalam ${esc(tDept(st.user.dept))} bahawa anda mahu berbual 15 minit.`)}</p>
    <div class="card flat note">${I('lock')}<div>${L("They'll only see your name and the request. We won't share your stress scores, moods, notes or why you asked.",'Mereka hanya akan melihat nama anda dan permintaan itu. Kami tidak akan berkongsi skor tekanan, mood, nota atau sebab anda meminta.')}</div></div>
    <button class="btn primary block" data-act="catchup-send" id="cu-btn">${L('Send request','Hantar permintaan')}</button>
    <button class="btn ghost block" data-act="close">${L('Cancel','Batal')}</button></div>`);
}

/* ---------- notifications ---------- */
const NOTIF_TYPES=[
  ['checkin',['Daily check-in reminder','Peringatan daftar masuk harian'],["Weekdays at 9:00 AM, only if you haven't checked in",'Hari bekerja jam 9:00 pagi, hanya jika anda belum daftar masuk']],
  ['session',['Leader sessions','Sesi ketua'],['When a live round starts, and 15 minutes before ones you set a reminder for','Apabila pusingan langsung bermula, dan 15 minit sebelum sesi yang anda tetapkan peringatan']],
  ['recap',['Weekly recap','Ringkasan mingguan'],['Fridays at 5:00 PM','Jumaat jam 5:00 petang']],
  ['coupon',['Vouchers expiring','Baucar hampir tamat'],['3 days before a voucher code expires','3 hari sebelum kod baucar tamat']]];
const NOTIF_ICON={checkin:'pulse',session:'game',recap:'chart',coupon:'gift',badge:'trophy',test:'bell',kudos:'heart',catchup:'team'};
const unreadCount=()=>st&&st.notifs?st.notifs.filter(n=>!n.read).length:0;
function bellBtn(){const n=unreadCount();return `<button class="bell" data-act="notifs" aria-label="${L('Notifications','Pemberitahuan')}${n?`, ${n} ${L('unread','belum dibaca')}`:''}">${I('bell')}${n?`<span class="count" aria-hidden="true">${n>9?'9+':n}</span>`:''}</button>`}
function ago(ts){const m=Math.round((Date.now()-ts)/60000);if(m<1)return L('Just now','Baru sahaja');if(m<60)return L(`${m} min ago`,`${m} minit lalu`);const h=Math.round(m/60);if(h<24)return L(h===1?'1 hour ago':`${h} hours ago`,`${h} jam lalu`);
  const d=toKL(ts);return (dkey(d)===dkey(addDays(nowKL(),-1))?L('Yesterday','Semalam'):`${d.getDate()} ${mon(d.getMonth())}`)+` · ${clock(d)}`}

/* Phone push: 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on' */
let pushStatus='off';
const pushSupported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
async function refreshPushStatus(){
  if(platform()==='ios'&&!isStandalone()){pushStatus='ios-install';return pushStatus}
  if(!pushSupported()){pushStatus='unsupported';return pushStatus}
  if(Notification.permission==='denied'){pushStatus='denied';return pushStatus}
  try{const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();pushStatus=sub&&Notification.permission==='granted'?'on':'off'}catch(e){pushStatus='off'}
  return pushStatus;
}
const keyBytes=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
async function saveSubscription(sub){
  const j=sub.toJSON();
  const {error}=await sb.rpc('save_push_subscription',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_agent:navigator.userAgent});
  if(error)throw error;
}
async function enablePush(){
  if(!isCloud())throw new Error(L('Phone notifications work after you sign in with your staff ID.','Pemberitahuan telefon berfungsi selepas anda log masuk dengan ID kakitangan.'));
  if(pushStatus==='ios-install'){installSheet();return false}
  if(!pushSupported())throw new Error(L("This browser can't show notifications. Try Chrome on Android, or Safari on iPhone after adding SMISKEE to your Home Screen.",'Pelayar ini tidak boleh menunjukkan pemberitahuan. Cuba Chrome di Android, atau Safari di iPhone selepas menambah SMISKEE ke Skrin Utama.'));
  const perm=await Notification.requestPermission();
  if(perm!=='granted'){await refreshPushStatus();throw new Error(perm==='denied'?L('Notifications are blocked. Allow them for this site in your browser settings.','Pemberitahuan disekat. Benarkan untuk laman ini dalam tetapan pelayar anda.'):L('Notifications were not turned on.','Pemberitahuan tidak dihidupkan.'))}
  const {data:key,error}=await sb.rpc('get_push_public_key');if(error)throw error;
  if(!key)throw new Error(L('Notifications are still being set up. Please try again in a minute.','Pemberitahuan masih disediakan. Sila cuba lagi dalam seminit.'));
  const reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  const want=keyBytes(key);
  if(sub&&sub.options&&sub.options.applicationServerKey){const have=new Uint8Array(sub.options.applicationServerKey);if(have.length!==want.length||have.some((b,i)=>b!==want[i])){await sub.unsubscribe();sub=null}}
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:want});
  await saveSubscription(sub);
  pushStatus='on';return true;
}
async function removeThisDevice(){
  if(!pushSupported())return;
  const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();
  if(!sub)return;
  try{await sb.rpc('delete_push_subscription',{p_endpoint:sub.endpoint})}catch(e){}
  await sub.unsubscribe();
}
async function disablePush(){await removeThisDevice();pushStatus='off'}

function pushCard(where){
  const demo=st.mode==='demo';
  const btn=(a,label,cls='primary')=>`<button class="btn ${cls} sm-btn" data-act="${a}" data-where="${where}">${label}</button>`;
  let title,text,action='';
  if(demo){title=L('Phone notifications','Pemberitahuan telefon');text=L('Available after you sign in with your staff ID. In demo mode, notifications only appear in this list.','Tersedia selepas anda log masuk dengan ID kakitangan. Dalam mod demo, pemberitahuan hanya muncul dalam senarai ini.')}
  else if(pushStatus==='on'){title=L('Phone notifications are on','Pemberitahuan telefon dihidupkan');text=L('This device will get SMISKEE reminders even when the app is closed.','Peranti ini akan menerima peringatan SMISKEE walaupun aplikasi ditutup.');action=btn('push-test',L('Send a test','Hantar ujian'),'ghost')+btn('push-off',L('Turn off','Matikan'),'ghost')}
  else if(pushStatus==='ios-install'){title=L('Get reminders on your iPhone','Dapatkan peringatan di iPhone anda');text=L('First add SMISKEE to your Home Screen, open it from there, then turn on notifications.','Tambah SMISKEE ke Skrin Utama dahulu, buka dari situ, kemudian hidupkan pemberitahuan.');action=btn('install',L('How to add it','Cara menambahnya'))}
  else if(pushStatus==='denied'){title=L('Notifications are blocked','Pemberitahuan disekat');text=L('Allow notifications for this site in your browser or phone settings, then come back here.','Benarkan pemberitahuan untuk laman ini dalam tetapan pelayar atau telefon anda, kemudian kembali ke sini.')}
  else if(pushStatus==='unsupported'){title=L('Not available in this browser','Tidak tersedia dalam pelayar ini');text=L('Use Chrome on Android, or Safari on iPhone after adding SMISKEE to your Home Screen.','Gunakan Chrome di Android, atau Safari di iPhone selepas menambah SMISKEE ke Skrin Utama.')}
  else {title=L('Turn on phone notifications','Hidupkan pemberitahuan telefon');text=L('Get your 9:00 AM check-in reminder and live leader rounds, even when SMISKEE is closed.','Dapatkan peringatan daftar masuk jam 9:00 pagi dan pusingan ketua secara langsung, walaupun SMISKEE ditutup.');action=btn('push-on',L('Turn on','Hidupkan'))}
  return `<div class="push-card ${pushStatus==='on'&&!demo?'on':''}"><span class="ib">${I('bell')}</span><div class="grow"><p class="t">${title}</p><p class="s">${text}</p>${action?`<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${action}</div>`:''}</div></div>`;
}
function notifSettings(){
  return `<div class="card stack" style="gap:14px"><div><p class="eyebrow">${L('Notifications','Pemberitahuan')}</p><h2 class="sec-title" style="margin-top:2px">${L('What should we remind you about?','Apa yang perlu kami ingatkan?')}</h2></div>
    ${pushCard('profile')}
    <div class="list">${NOTIF_TYPES.map(([k,l,d])=>`<div class="li"><div class="grow"><p class="t" id="pref-${k}">${tx(l)}</p><p class="s">${tx(d)}</p></div>
      <button class="switch" role="switch" aria-checked="${st.notify[k]!==false}" aria-labelledby="pref-${k}" data-act="pref" data-k="${k}"><span></span></button></div>`).join('')}</div></div>`;
}
function notifSheet(){
  G={id:'notifs'};openSheet(L('Notifications','Pemberitahuan'));drawNotifs();
  act.markRead().then(updateBell).catch(()=>{});
}
function drawNotifs(){
  const list=[...st.notifs].sort((a,b)=>b.ts-a.ts);
  SB(`<div class="stack" style="gap:14px">${pushCard('sheet')}
    ${list.length?`<div class="card" style="padding:6px 16px"><div class="list">${list.map(n=>`<button class="li notif ${n.read?'':'unread'}" data-act="open-notif" data-url="${esc(n.url)}"><span class="ib">${I(NOTIF_ICON[n.kind]||'bell')}</span><span class="grow"><span class="t">${esc(tx(n.title))}${n.read?'':`<span class="sr"> (${L('unread','belum dibaca')})</span>`}</span><span class="s">${esc(tx(n.body))}</span><span class="s when">${ago(n.ts)}</span></span></button>`).join('')}</div></div>`
    :`<div class="card flat"><p class="muted">${L('No notifications yet. Your check-in reminders and leader rounds will show up here.','Belum ada pemberitahuan. Peringatan daftar masuk dan pusingan ketua akan muncul di sini.')}</p></div>`}
    <a class="link" href="#profile" data-act="close" style="align-self:center">${L('Notification settings','Tetapan pemberitahuan')}</a></div>`);
}
function updateBell(){document.querySelectorAll('.bell').forEach(b=>{b.outerHTML=bellBtn()})}
async function refreshNotifs(){
  if(!isCloud()||document.hidden)return;
  const {data,error}=await sb.from('notifications').select('id,kind,title,body,url,created_at,read_at').order('created_at',{ascending:false}).limit(40);
  if(error||!data||!st)return;
  const before=unreadCount();st.notifs=data.map(mapNotif);
  if(unreadCount()!==before){updateBell();if(G&&G.id==='notifs')drawNotifs()}
}
setInterval(refreshNotifs,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshNotifs()});
async function pushAction(fn,okMsg,where){
  try{const r=await fn();if(r!==false&&okMsg)toast(okMsg)}catch(e){toast(friendly(e))}
  if(where==='sheet'&&G&&G.id==='notifs')drawNotifs();else if(route()==='profile')render();
}

/* ---------- sheet (accessible dialog) + games ---------- */
let lastFocus=null;
function openSheet(title){
  if($('#sheet').hidden)lastFocus=document.activeElement;
  $('#sheet-title').textContent=title;$('#sheet').hidden=false;document.body.style.overflow='hidden';
  $('#sheet .x').setAttribute('aria-label',L('Close','Tutup'));
  setTimeout(()=>{const x=$('#sheet .x');if(x&&!$('#sheet').hidden)x.focus()},30);
}
function closeSheet(){
  $('#sheet').hidden=true;document.body.style.overflow='';clearInterval(timer);timer=null;G=null;if(st)render();else keepLogin(()=>{});
  setTimeout(()=>{if(lastFocus&&document.body.contains(lastFocus))lastFocus.focus();else focusHeading();lastFocus=null},0);
}
const SB=html=>$('#sheet-body').innerHTML=html;
const saving=()=>SB(`<div class="result" role="status"><p class="muted">${L('Saving your score…','Menyimpan skor anda…')}</p></div>`);
function resultView(title,line,pts,note){
  SB(`<div class="result" role="status"><p class="eyebrow">${title}</p><p class="big num">${pts>0?'+'+pts:'0'}</p><p style="font-weight:700">${pts>0?L('points earned','mata diperoleh'):L('points this time','mata kali ini')}</p><p class="muted small" style="max-width:32ch">${line}${note?' '+note:''}</p><div class="row" style="margin-top:8px"><button class="btn ghost" data-act="close">${L('Done','Selesai')}</button>${G&&G.id!=='spin'&&G.id!=='breath'?`<button class="btn primary" data-act="replay">${L('Play again','Main lagi')}</button>`:''}</div></div>`);
}
const ALREADY=()=>L('You already earned points for this game today. Come back tomorrow.','Anda sudah mendapat mata untuk permainan ini hari ini. Datang lagi esok.');
async function finish(promise,title,line,zeroNote){
  saving();
  try{const pts=await promise;if(G)resultView(title,line,pts,pts?'':zeroNote)}
  catch(e){if(G)SB(`<div class="result" role="alert"><p style="font-weight:700">${L("Your score couldn't be saved.",'Skor anda tidak dapat disimpan.')}</p><p class="muted small">${esc(friendly(e))}</p><button class="btn ghost" data-act="close">${L('Close','Tutup')}</button></div>`)}
}

function startGame(id,opts={}){
  G={id,...opts};
  if(id==='quiz'||id==='session'){G.qs=shuffle(QUIZ).slice(0,5);G.i=0;G.score=0;G.ans=null;openSheet(id==='session'?opts.s.name:L('Banking Knowledge Quiz','Kuiz Pengetahuan Perbankan'));drawQuiz()}
  if(id==='memory'){const Lb=['RM','%','ATM','FD','OTP','KYC'];G.cards=shuffle([...Lb,...Lb]);G.up=[];G.ok=[];G.moves=0;G.lock=false;openSheet(L('Memory Match','Padanan Memori'));drawMemory()}
  if(id==='spin'){openSheet(L('Spin & Win','Putar & Menang'));drawSpin()}
  if(id==='breath'){openSheet(L('Focus Breathing','Pernafasan Fokus'));drawBreath()}
  if(id==='brain'){G.qs=[...Array(5)].map(mkSum);G.i=0;G.score=0;G.ans=null;G.t0=Date.now();openSheet(L('Quick Brain Break','Rehat Minda Pantas'));drawBrain()}
}
function drawQuiz(){
  if(G.i>=G.qs.length){
    if(G.id==='session') return finish(act.session(G.s,G.score),L(`Hosted by ${G.s.host}`,`Dihoskan oleh ${G.s.host}`),L(`You got ${G.score} of 5 right. Leader rounds pay double points.`,`Anda betul ${G.score} daripada 5. Pusingan ketua memberi mata berganda.`),L('You already played this round.','Anda sudah bermain pusingan ini.'));
    return finish(act.game('quiz',G.score),L('Quiz complete','Kuiz selesai'),L(`You got ${G.score} of 5 right.`,`Anda betul ${G.score} daripada 5.`),G.score?ALREADY():'');
  }
  const q=G.qs[G.i];
  SB(`<div class="stack"><div><div class="row between small muted"><span>${L(`Question ${G.i+1} of 5`,`Soalan ${G.i+1} daripada 5`)}</span><span class="num">${L('Score','Skor')} ${G.score}</span></div><div class="track light" style="margin-top:6px" aria-hidden="true"><i style="width:${(G.i)/5*100}%"></i></div></div>
    <h3 class="q" id="q-text">${tx(q.q)}</h3><div class="opts" role="group" aria-labelledby="q-text">${q.o.map((o,k)=>`<button class="opt ${G.ans!=null?(k===q.a?'right':k===G.ans?'wrong':''):''}" data-act="qa" data-k="${k}" ${G.ans!=null?'disabled':''}>${qo(o)}${G.ans!=null&&k===q.a?`<span class="sr"> (${L('correct answer','jawapan betul')})</span>`:''}</button>`).join('')}</div>
    ${G.ans!=null?`<p class="explain" role="status"><b style="color:${G.ans===q.a?'var(--calm)':'var(--high)'}">${G.ans===q.a?L('Correct.','Betul.'):L('Not quite.','Kurang tepat.')}</b> ${tx(q.e)}</p><button class="btn primary block" data-act="qnext">${G.i<4?L('Next question','Soalan seterusnya'):L('See results','Lihat keputusan')}</button>`:''}</div>`);
  if(G.ans!=null)setTimeout(()=>{const b=document.querySelector('[data-act=qnext]');b&&b.focus()},20);
}
function drawMemory(){
  SB(`<div class="stack"><div class="row between small muted"><span>${L('Find all 6 pairs','Cari kesemua 6 pasangan')}</span><span class="num" aria-live="polite">${L('Moves','Langkah')}: ${G.moves}</span></div>
  <div class="mgrid">${G.cards.map((c,i)=>{const ok=G.ok.includes(i),up=G.up.includes(i);return `<button class="mc ${ok?'ok':up?'up':'hid'}" data-act="flip" data-i="${i}" aria-label="${ok?`${c}, ${L('matched','dipadankan')}`:up?c:L(`Card ${i+1}, hidden`,`Kad ${i+1}, tersembunyi`)}" ${ok?'disabled':''}>${c}</button>`}).join('')}</div>
  <p class="small muted">${L('Finish in 10 moves or fewer for 100 pts, 14 or fewer for 70 pts.','Selesaikan dalam 10 langkah atau kurang untuk 100 mata, 14 atau kurang untuk 70 mata.')}</p></div>`);
}
function flip(i){
  if(G.lock||G.up.includes(i)||G.ok.includes(i))return;
  G.up.push(i);
  if(G.up.length===2){G.moves++;const[a,b]=G.up;
    if(G.cards[a]===G.cards[b]){G.ok.push(a,b);G.up=[]}
    else{G.lock=true;setTimeout(()=>{if(!G||G.id!=='memory')return;G.up=[];G.lock=false;drawMemory()},700)}}
  drawMemory();
  const b=document.querySelector(`[data-act=flip][data-i="${i}"]`);if(b&&!b.disabled)b.focus();
  if(G.ok.length===12){const moves=G.moves;setTimeout(()=>{if(G&&G.id==='memory')finish(act.game('memory',moves),L('All pairs found','Semua pasangan ditemui'),L(`You finished in ${moves} moves.`,`Anda selesai dalam ${moves} langkah.`),ALREADY())},500)}
}
function drawSpin(){
  const done=st.spin&&st.spin.d===today();
  const cols=['var(--forest)','var(--forest-2)'];
  const grad=SEG.map((_,i)=>`${i===5?'var(--gold)':cols[i%2]} ${i*45}deg ${(i+1)*45}deg`).join(',');
  const startRot=done?360-(SEG.indexOf(st.spin.v)*45+22.5):0;
  SB(`<div class="stack" style="align-items:center;text-align:center"><div class="wheel-wrap" aria-hidden="true"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad});transform:rotate(${startRot}deg)">${SEG.map((v,i)=>{const a=(i*45+22.5-90)*Math.PI/180;return `<span style="left:${50+Math.cos(a)*33}%;top:${50+Math.sin(a)*33}%;transform:translate(-50%,-50%)">${v}</span>`}).join('')}</div><div class="hub">${L('SPIN','PUTAR')}</div></div>
  ${done?`<p style="font-weight:700">${L(`You won ${st.spin.v} pts today.`,`Anda menang ${st.spin.v} mata hari ini.`)}</p><p class="small muted">${L('Your next free spin unlocks tomorrow.','Putaran percuma seterusnya dibuka esok.')}</p><button class="btn ghost" data-act="close">${L('Close','Tutup')}</button>`:`<p class="small muted">${L('One free spin per day. Prizes from 20 to 150 points.','Satu putaran percuma sehari. Hadiah dari 20 hingga 150 mata.')}</p><button class="btn gold block" data-act="spin" id="spin-btn">${L('Spin the wheel','Putar roda')}</button>`}</div>`);
}
async function doSpin(){
  const btn=$('#spin-btn');if(!btn||btn.disabled)return;btn.disabled=true;btn.textContent=L('Spinning…','Sedang berputar…');
  let res;
  try{res=await act.spin()}catch(e){btn.disabled=false;btn.textContent=L('Spin the wheel','Putar roda');toast(friendly(e));return}
  const rot=360*6+(360-(res.index*45+22.5));
  const wheel=$('#wheel');if(wheel)wheel.style.transform=`rotate(${rot}deg)`;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{if(G&&G.id==='spin')resultView(L('Spin & Win','Putar & Menang'),L(`The wheel landed on ${res.points}.`,`Roda berhenti pada ${res.points}.`),res.already?0:res.points,res.already?L('You already spun today.','Anda sudah memutar hari ini.'):'')},reduce?50:4200);
}
function drawBreath(){
  SB(`<div class="stack" style="align-items:center;text-align:center"><div class="breath" aria-hidden="true"><div class="orb" id="orb"></div><b id="b-count">4</b></div>
  <p style="font-weight:800;font-size:1.25rem" id="b-phase" aria-live="polite">${L('Box breathing','Pernafasan kotak')}</p><p class="small muted" id="b-sub">${L('Breathe in 4 · hold 4 · out 4 · hold 4. Four rounds, about one minute.','Tarik nafas 4 · tahan 4 · hembus 4 · tahan 4. Empat pusingan, kira-kira seminit.')}</p>
  <div class="track light" style="width:100%" aria-hidden="true"><i id="b-prog" style="width:0%"></i></div>
  <button class="btn primary block" data-act="breath-start" id="b-btn">${L('Start','Mula')}</button></div>`);
}
function breathStart(){
  const btn=$('#b-btn');btn.hidden=true;let t=0;const total=64;
  const phases=[[L('Breathe in','Tarik nafas'),1.6],[L('Hold','Tahan'),1.6],[L('Breathe out','Hembus nafas'),1],[L('Hold','Tahan'),1]];
  const tick=()=>{
    if(!G||G.id!=='breath'){clearInterval(timer);return}
    if(t>=total){clearInterval(timer);timer=null;return finish(act.game('breath',1),L('Nicely done','Syabas'),L('You completed four rounds of box breathing.','Anda telah menyelesaikan empat pusingan pernafasan kotak.'),ALREADY())}
    const p=Math.floor(t/4)%4, left=4-(t%4);
    if(t%4===0)$('#b-phase').textContent=phases[p][0];
    $('#b-count').textContent=left;$('#b-sub').textContent=L(`Round ${Math.floor(t/16)+1} of 4`,`Pusingan ${Math.floor(t/16)+1} daripada 4`);
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
  if(G.i>=5){const secs=Math.round((Date.now()-G.t0)/1000);return finish(act.game('brain',G.score),L('Brain break done','Rehat minda selesai'),L(`${G.score} of 5 correct in ${secs} seconds.`,`${G.score} daripada 5 betul dalam ${secs} saat.`),G.score?ALREADY():'')}
  const q=G.qs[G.i];
  SB(`<div class="stack"><div class="row between small muted"><span>${L(`Sum ${G.i+1} of 5`,`Kiraan ${G.i+1} daripada 5`)}</span><span class="num">${L('Score','Skor')} ${G.score}</span></div>
  <h3 class="q num" id="b-q" style="font-size:1.625rem;text-align:center;padding-block:12px">${q.q}</h3>
  <div class="opts two" role="group" aria-labelledby="b-q">${q.o.map((o,k)=>`<button class="opt num ${G.ans!=null?(k===q.a?'right':k===G.ans?'wrong':''):''}" style="text-align:center" data-act="ba" data-k="${k}" ${G.ans!=null?'disabled':''}>${o}</button>`).join('')}</div></div>`);
}

/* ---------- add to home screen ---------- */
let deferredInstall=null, installTab=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
window.addEventListener('appinstalled',()=>{deferredInstall=null;toast(L('SMISKEE installed','SMISKEE dipasang'));render()});
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
function platform(){const u=navigator.userAgent||'';
  if(/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1))return 'ios';
  if(/Android/.test(u))return 'android';return 'other'}
function installBtn(compact){return isStandalone()?'':`<button class="install${compact?' icon':''}" data-act="install" aria-label="${L('Add SMISKEE to your home screen','Tambah SMISKEE ke skrin utama')}" title="${L('Add to Home Screen','Tambah ke Skrin Utama')}">${I('addhome')}${compact?'':L('Add to Home','Tambah ke Skrin')}</button>`}
function installSheet(){
  const p=platform(); if(!installTab) installTab=p==='android'?'android':'ios';
  G={id:'install'}; openSheet(L('Add SMISKEE to your home screen','Tambah SMISKEE ke skrin utama')); drawInstall(p);
}
function drawInstall(p){
  const ios=`<ol class="steps">
    <li class="step"><p>${L('Open this page in <b>Safari</b>. Other iPhone browsers may not show the option.','Buka halaman ini dalam <b>Safari</b>. Pelayar iPhone lain mungkin tidak menunjukkan pilihan ini.')}</p></li>
    <li class="step"><p>${L(`Tap the <span class="kbd">${I('share')}Share</span> button at the bottom of the screen (on iPad it's at the top).`,`Ketik butang <span class="kbd">${I('share')}Kongsi</span> di bahagian bawah skrin (di iPad, di bahagian atas).`)}</p></li>
    <li class="step"><p>${L(`Scroll down and tap <span class="kbd">${I('plusbox')}Add to Home Screen</span>.`,`Tatal ke bawah dan ketik <span class="kbd">${I('plusbox')}Tambah ke Skrin Utama</span>.`)}</p></li>
    <li class="step"><p>${L('Name it <b>SMISKEE</b> and tap <b>Add</b> in the top-right corner.','Namakan <b>SMISKEE</b> dan ketik <b>Tambah</b> di penjuru kanan atas.')}</p></li></ol>`;
  const android=`<ol class="steps">
    <li class="step"><p>${L('Open this page in <b>Chrome</b>.','Buka halaman ini dalam <b>Chrome</b>.')}</p></li>
    <li class="step"><p>${L(`Tap the <span class="kbd">${I('dots')}Menu</span> button in the top-right corner.`,`Ketik butang <span class="kbd">${I('dots')}Menu</span> di penjuru kanan atas.`)}</p></li>
    <li class="step"><p>${L(`Tap <span class="kbd">${I('addhome')}Add to Home screen</span> or <b>Install app</b>.`,`Ketik <span class="kbd">${I('addhome')}Tambah ke Skrin utama</span> atau <b>Pasang aplikasi</b>.`)}</p></li>
    <li class="step"><p>${L('Tap <b>Install</b> to confirm. SMISKEE appears with your other apps.','Ketik <b>Pasang</b> untuk mengesahkan. SMISKEE akan muncul bersama aplikasi lain.')}</p></li></ol>`;
  SB(`<div class="stack">
    ${deferredInstall?`<div class="card forest stack" style="gap:10px"><p style="font-weight:700">${L('Your browser can install SMISKEE directly.','Pelayar anda boleh memasang SMISKEE terus.')}</p><button class="btn gold block" data-act="install-now">${L('Install now','Pasang sekarang')}</button></div>`:''}
    <div class="seg" role="group" aria-label="${L('Phone type','Jenis telefon')}"><button data-act="itab" data-v="ios" aria-pressed="${installTab==='ios'}">iPhone</button><button data-act="itab" data-v="android" aria-pressed="${installTab==='android'}">Android</button></div>
    ${p!=='other'&&((p==='ios')===(installTab==='ios'))?`<p class="small muted">${p==='ios'?L("We detected you're on an iPhone or iPad.",'Kami mengesan anda menggunakan iPhone atau iPad.'):L("We detected you're on Android.",'Kami mengesan anda menggunakan Android.')}</p>`:''}
    ${installTab==='ios'?ios:android}
    <p class="small muted">${L('After adding it, open SMISKEE from your home screen each morning for your check-in.','Selepas menambahnya, buka SMISKEE dari skrin utama setiap pagi untuk daftar masuk.')}</p>
    <button class="btn primary block" data-act="close">${L('Got it','Faham')}</button></div>`);
}

/* ---------- toast / copy / redeem ---------- */
function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=msg;t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
function copyCode(code){
  try{navigator.clipboard.writeText(code).then(()=>toast(L('Code copied','Kod disalin')),()=>toast(code))}catch(e){toast(code)}
}
function redeemSheet(id){
  const r=rewards().find(x=>x.id===id);if(!r)return;G={id:'redeem',r};
  openSheet(L('Redeem reward','Tebus ganjaran'));
  SB(`<div class="stack"><div class="reward" style="box-shadow:none">${voucher(r)}<div class="grow"><h3>${esc(tBrand(r.brand))}</h3><p class="small muted">${r.val?L(`RM${r.val} digital voucher`,`Baucar digital RM${r.val}`):L('Company perk, approved by your leader','Faedah syarikat, diluluskan oleh ketua anda')}</p></div></div>
  <div class="card flat stack" style="gap:6px"><div class="row between small"><span class="muted">${L('Your balance','Baki anda')}</span><b class="num">${fmt(st.points)} ${L('pts','mata')}</b></div><div class="row between small"><span class="muted">${L('Cost','Kos')}</span><b class="num">− ${fmt(r.pts)} ${L('pts','mata')}</b></div><div class="row between small" style="border-top:1px solid var(--line);padding-top:8px"><span class="muted">${L('After redeeming','Selepas menebus')}</span><b class="num">${fmt(st.points-r.pts)} ${L('pts','mata')}</b></div></div>
  <button class="btn primary block" data-act="confirm-redeem" id="redeem-btn">${L(`Redeem for ${fmt(r.pts)} pts`,`Tebus dengan ${fmt(r.pts)} mata`)}</button><button class="btn ghost block" data-act="close">${L('Cancel','Batal')}</button></div>`);
}
async function confirmRedeem(){
  const r=G.r, btn=$('#redeem-btn'); if(btn.disabled)return; btn.disabled=true; btn.textContent=L('Redeeming…','Sedang menebus…');
  let res;
  try{res=await act.redeem(r.id)}catch(e){btn.disabled=false;btn.textContent=L(`Redeem for ${fmt(r.pts)} pts`,`Tebus dengan ${fmt(r.pts)} mata`);toast(friendly(e));return}
  const exp=res.exp;
  SB(`<div class="result" role="status"><p class="eyebrow">${L('Redeemed','Ditebus')}</p><h2 style="font-size:1.375rem">${esc(tBrand(r.brand))}</h2><p class="muted small">${L(`Show this code at the counter. Valid until ${exp.getDate()} ${mon(exp.getMonth())} ${exp.getFullYear()}.`,`Tunjukkan kod ini di kaunter. Sah sehingga ${exp.getDate()} ${mon(exp.getMonth())} ${exp.getFullYear()}.`)}</p>
  <div class="code" style="width:100%">${esc(res.code)}</div><div class="row" style="width:100%"><button class="btn ghost" style="flex:1" data-act="copy" data-code="${esc(res.code)}">${I('copy')}${L('Copy code','Salin kod')}</button><button class="btn primary" style="flex:1" data-act="close">${L('Done','Selesai')}</button></div></div>`);
}

/* ---------- sign in / sign up / reset ---------- */
function keepLogin(fn){
  const vals={};['l-name','l-id','l-dept','r-id','r-code'].forEach(id=>{const el=$('#'+id);if(el)vals[id]=el.value});
  const consent=$('#l-consent')?.checked;
  fn();render();Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v});
  const c=$('#l-consent');if(c&&consent)c.checked=true;
}
async function submitLogin(){
  const name=$('#l-name')?.value.trim()||'', id=$('#l-id')?.value.trim()||'', pw=$('#l-pw')?.value||'', dept=$('#l-dept')?.value||'Digital Banking';
  const signup=sb&&authMode==='signup', signin=sb&&authMode==='signin';
  const err={};
  if(!signin&&name.length<2)err.name=L('Enter your full name.','Masukkan nama penuh anda.');
  if(!validStaff(id))err.id=L('Use the format on your staff card, for example MY-1842.','Gunakan format pada kad kakitangan anda, contohnya MY-1842.');
  if(sb&&signup&&pw.length<8)err.pw=L('Use at least 8 characters.','Gunakan sekurang-kurangnya 8 aksara.');
  else if(sb&&signup&&pw!==($('#l-pw2')?.value||''))err.pw=L("The two passwords don't match.",'Kedua-dua kata laluan tidak sepadan.');
  if(sb&&signin&&!pw)err.pw=L('Enter your password.','Masukkan kata laluan anda.');
  if(sb&&signup&&!$('#l-consent')?.checked)err.consent=L('Please agree to the privacy notice to create an account.','Sila bersetuju dengan notis privasi untuk mencipta akaun.');
  if(Object.keys(err).length){keepLogin(()=>loginErr=err);const f=document.querySelector('.login .err');f&&f.previousElementSibling?.querySelector?.('input')?.focus();return}
  if(!sb){st=seed(name,id,dept,loginRole);saveLocal();loginErr={};location.hash='home';render();toast(L(`Welcome, ${firstName(name)}`,`Selamat datang, ${firstName(name)}`));return}
  const btn=$('#login-btn');btn.disabled=true;btn.textContent=signup?L('Creating account…','Mencipta akaun…'):L('Signing in…','Sedang log masuk…');
  try{
    if(signup){
      const {data,error}=await sb.auth.signUp({email:staffEmail(id),password:pw,options:{data:{full_name:name,staff_id:normStaff(id),department:dept,role:loginRole,lang:LANG,consent_version:PRIVACY_VERSION}}});
      if(error)throw error;
      if(!data.session)throw new Error(L('Account created, but email confirmation is switched on in Supabase. Ask your administrator to turn off "Confirm email", then sign in.','Akaun dicipta, tetapi pengesahan e-mel dihidupkan dalam Supabase. Minta pentadbir mematikan "Confirm email", kemudian log masuk.'));
    }else{
      const {error}=await sb.auth.signInWithPassword({email:staffEmail(id),password:pw});
      if(error)throw error;
    }
    await loadCloud();
    if(st.user.lang&&st.user.lang!==LANG&&!signup)setLang(st.user.lang);
    loginErr={};location.hash='home';render();toast(L(`Welcome, ${firstName(st.user.name)}`,`Selamat datang, ${firstName(st.user.name)}`));refreshPushStatus();
    if(signup){try{const code=await act.newCode();showCode(code,'signup')}catch(e){}}
  }catch(e){
    let m=friendly(e);
    if(/Invalid login credentials/i.test(m))m=L('Staff ID or password is incorrect.','ID kakitangan atau kata laluan tidak betul.');
    if(/already registered|already exists/i.test(m))m=L('This staff ID already has an account. Sign in instead.','ID kakitangan ini sudah mempunyai akaun. Sila log masuk.');
    if(/Database error saving new user/i.test(m))m=L('This staff ID is already registered. Sign in instead, or check the ID.','ID kakitangan ini sudah didaftarkan. Sila log masuk, atau semak ID.');
    if(/rate limit/i.test(m))m=L('Too many attempts. Please wait a minute and try again.','Terlalu banyak cubaan. Sila tunggu seminit dan cuba lagi.');
    keepLogin(()=>loginErr={form:m});
  }
}
async function submitReset(){
  const id=$('#r-id').value.trim(), code=$('#r-code').value.trim(), pw=$('#r-pw').value, pw2=$('#r-pw2').value;
  let m=null;
  if(!validStaff(id))m=L('Use the format on your staff card, for example MY-1842.','Gunakan format pada kad kakitangan anda, contohnya MY-1842.');
  else if(code.replace(/[^A-Za-z0-9]/g,'').length!==12)m=L('Enter the 12-character recovery code, for example ABCD-EFGH-JKLM.','Masukkan kod pemulihan 12 aksara, contohnya ABCD-EFGH-JKLM.');
  else if(pw.length<8)m=L('Use at least 8 characters for the new password.','Gunakan sekurang-kurangnya 8 aksara untuk kata laluan baharu.');
  else if(pw!==pw2)m=L("The two passwords don't match.",'Kedua-dua kata laluan tidak sepadan.');
  if(m){keepLogin(()=>loginErr={form:m});return}
  const btn=$('#reset-btn');btn.disabled=true;btn.textContent=L('Resetting…','Sedang set semula…');
  try{
    const res=await fetch(`${CFG.supabaseUrl}/functions/v1/reset-password`,{method:'POST',headers:{'Content-Type':'application/json',apikey:CFG.supabaseAnonKey},body:JSON.stringify({staff_id:normStaff(id),code,password:pw})});
    const j=await res.json().catch(()=>({}));
    if(!res.ok||!j.ok){
      const msg={wrong:L('Staff ID or recovery code is incorrect.','ID kakitangan atau kod pemulihan tidak betul.'),locked:L('Too many attempts. Try again in an hour.','Terlalu banyak cubaan. Cuba lagi dalam sejam.'),weak:L('Use 8 to 72 characters for the new password.','Gunakan 8 hingga 72 aksara untuk kata laluan baharu.')}[j.code]||L('Something went wrong. Please try again.','Sesuatu tidak kena. Sila cuba lagi.');
      keepLogin(()=>loginErr={form:msg});return;
    }
    resetDone={code:j.new_code,staff:normStaff(id)};loginErr={};render();
  }catch(e){keepLogin(()=>loginErr={form:friendly(e)})}
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]'); if(go){location.hash=go.dataset.go;return}
  const el=e.target.closest('[data-act]'); if(!el)return;
  const a=el.dataset.act, v=el.dataset.v;
  switch(a){
    case 'skip':{const m=$('#main')||$('#login');if(m){m.setAttribute('tabindex','-1');m.focus()}break}
    case 'lang':run(()=>act.setLanguage(v)).then(()=>{if(st)render();else keepLogin(()=>{})});break;
    case 'set-lang':run(()=>act.setLanguage(v),()=>L('Language changed to English','Bahasa ditukar ke Bahasa Malaysia')).then(render);break;
    case 'set-text':setText(v);render();toast(L('Text size updated','Saiz teks dikemas kini'));break;
    case 'lrole':loginRole=v;document.querySelectorAll('[data-act=lrole]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));break;
    case 'demo':st=seed(L('Irfan Hakim','Irfan Hakim'),'MY-1842','Digital Banking',loginRole);saveLocal();location.hash='home';render();toast(L('Signed in as a sample employee','Log masuk sebagai pekerja contoh'));break;
    case 'privacy':openPrivacy();break;
    case 'consent':run(()=>act.consent(),L('Thank you. Welcome to SMISKEE.','Terima kasih. Selamat datang ke SMISKEE.')).then(()=>{render();if(isCloud())sb.rpc('has_recovery_code').then(({data})=>{hasCode=!!data;if(!data)act.newCode().then(c=>showCode(c,'signup')).catch(()=>{})})});break;
    case 'reset-done':{const s=resetDone&&resetDone.staff;resetDone=null;location.hash='';authMode='signin';render();const i=$('#l-id');if(i&&s){i.value=s;$('#l-pw')?.focus()}break}
    case 'new-code':run(()=>act.newCode()).then(c=>{if(c)showCode(c,'new')});break;
    case 'code-done':closeSheet();break;
    case 'export':doExport();break;
    case 'delete-open':deleteSheet();break;
    case 'delete-confirm':{if(el.disabled)break;el.disabled=true;run(()=>act.deleteAccount(),L('Your account and data have been deleted.','Akaun dan data anda telah dipadam.')).then(()=>{if(!st){$('#sheet').hidden=true;document.body.style.overflow='';G=null;history.replaceState(null,'',location.pathname);authMode='signin';render()}else el.disabled=false});break}
    case 'catchup':catchupSheet();break;
    case 'catchup-send':{el.disabled=true;run(()=>act.catchup()).then(n=>{if(n===undefined){el.disabled=false;return}
      SB(`<div class="result" role="status"><p class="eyebrow">${L('Request sent','Permintaan dihantar')}</p><p style="font-weight:700">${n===-1?L("In demo mode, no request is sent. In the real app, your department's leaders get a notification.",'Dalam mod demo, tiada permintaan dihantar. Dalam aplikasi sebenar, ketua jabatan anda akan menerima pemberitahuan.'):n>0?L("Your leader has been told you'd like a catch-up.",'Ketua anda telah dimaklumkan bahawa anda mahu berbual.'):L(`There's no team leader for ${st.user.dept} on SMISKEE yet. You can still reach out to your manager or HR directly.`,`Belum ada ketua pasukan untuk ${tDept(st.user.dept)} di SMISKEE. Anda masih boleh menghubungi pengurus atau HR secara terus.`)}</p><p class="small muted">${L('Take care of yourself today.','Jaga diri anda hari ini.')}</p><button class="btn primary" data-act="close">${L('Done','Selesai')}</button></div>`)})}break;
    case 'support-dismiss':try{localStorage.setItem('smiskee-support-dismissed',today())}catch(e){}render();break;
    case 'mood':draft.mood=draft.mood===v?null:v;document.querySelectorAll('.mood').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===draft.mood));break;
    case 'tag':{const i=draft.tags.indexOf(v);i>-1?draft.tags.splice(i,1):draft.tags.push(v);el.setAttribute('aria-pressed',draft.tags.includes(v));break}
    case 'edit':{editing=true;const c=st.checkins[today()];draft={...c,tags:[...c.tags]};render();break}
    case 'cancel-edit':editing=false;draft=null;render();break;
    case 'play':startGame(el.dataset.g);break;
    case 'session':{const s=st.sessions.find(x=>x.id===el.dataset.id);if(s)startGame('session',{s});break}
    case 'remind':run(()=>act.remind(el.dataset.id),on=>on?L("We'll notify you 15 minutes before it starts",'Kami akan memaklumkan anda 15 minit sebelum ia bermula'):L('Reminder removed','Peringatan dibuang')).then(render);break;
    case 'end-session':run(()=>act.endSession(el.dataset.id),L('Session ended','Sesi ditamatkan')).then(render);break;
    case 'close':closeSheet();break;
    case 'replay':{const id=G.id,s=G.s;clearInterval(timer);startGame(id,{s});break}
    case 'qa':G.ans=+el.dataset.k;if(G.ans===G.qs[G.i].a)G.score++;drawQuiz();break;
    case 'qnext':G.i++;G.ans=null;drawQuiz();setTimeout(()=>{const o=document.querySelector('.opt');o&&o.focus()},20);break;
    case 'flip':flip(+el.dataset.i);break;
    case 'spin':doSpin();break;
    case 'breath-open':startGame('breath');break;
    case 'breath-start':breathStart();break;
    case 'ba':{if(G.ans!=null)break;G.ans=+el.dataset.k;if(G.ans===G.qs[G.i].a)G.score++;drawBrain();setTimeout(()=>{if(!G||G.id!=='brain')return;G.i++;G.ans=null;drawBrain();const o=document.querySelector('.opt');o&&o.focus()},650);break}
    case 'filter':rewardFilter=v;render();break;
    case 'mycoupons':rewardFilter='My coupons';break;
    case 'redeem':redeemSheet(el.dataset.id);break;
    case 'confirm-redeem':confirmRedeem();break;
    case 'copy':copyCode(el.dataset.code);break;
    case 'install':installSheet();break;
    case 'notifs':notifSheet();break;
    case 'open-notif':{const u=el.dataset.url||'#home';closeSheet();location.hash=u.replace(/^#?/,'#');break}
    case 'push-on':pushAction(enablePush,L('Phone notifications are on','Pemberitahuan telefon dihidupkan'),el.dataset.where);break;
    case 'push-off':pushAction(disablePush,L('Phone notifications turned off for this device','Pemberitahuan telefon dimatikan untuk peranti ini'),el.dataset.where);break;
    case 'push-test':pushAction(()=>act.testNotification(),L('Test sent. It should arrive within a minute.','Ujian dihantar. Ia sepatutnya tiba dalam seminit.'),el.dataset.where);break;
    case 'pref':{const k=el.dataset.k,on=el.getAttribute('aria-checked')!=='true';el.setAttribute('aria-checked',on);
      act.setPref(k,on).catch(err=>{el.setAttribute('aria-checked',!on);toast(friendly(err))});break}
    case 'itab':installTab=v;drawInstall(platform());break;
    case 'install-now':if(deferredInstall){deferredInstall.prompt();deferredInstall.userChoice.then(c=>{deferredInstall=null;if(c&&c.outcome==='accepted')closeSheet();else drawInstall(platform())}).catch(()=>{})}break;
    case 'rweek':recapWeek=v;render();break;
    case 'intent':run(()=>act.intent(el.dataset.wk,+el.dataset.i),r=>r.on?(r.points?L(`+${r.points} pts · intention saved`,`+${r.points} mata · niat disimpan`):L('Intention saved','Niat disimpan')):L('Intention removed','Niat dibuang')).then(render);break;
    case 'k-pick':{const c=kd.results.find(x=>String(x.id)===el.dataset.id);if(c){kd.to=c;kd.q='';kd.results=[];render();setTimeout(()=>{const b=document.querySelector('.badge-pick');b&&b.focus()},20)}break}
    case 'k-clear':kd.to=null;render();setTimeout(()=>$('#k-q')?.focus(),20);break;
    case 'k-badge':kd.badge=v;document.querySelectorAll('.badge-pick').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));{const s=document.querySelector('#kudos-form [type=submit]');if(s)s.disabled=!(kd.to&&kd.badge)}break;
    case 'k-tab':{kd.tab=v;const box=$('#kudos-list');if(box){box.innerHTML=kudosListHTML();box.querySelector(`[data-v="${v}"]`)?.focus()}else render();break}
    case 'role':st.user.role=v;cache.pulse=null;cache.pulseAt=0;saveLocal();render();toast(v==='leader'?L('Leader view on: Team pulse added to Home','Paparan ketua dihidupkan: Nadi pasukan ditambah ke Utama'):L('Employee view on','Paparan pekerja dihidupkan'));break;
    case 'reset':if(!resetArm){resetArm=true;render();setTimeout(()=>{resetArm=false;if(st&&route()==='profile')render()},4000)}else{resetArm=false;const u=st.user;st=seed(u.name,u.staffId,u.dept,u.role);saveLocal();render();toast(L('Demo data reset','Data demo diset semula'))}break;
    case 'signout':act.signOut().then(()=>{draft=null;authMode='signin';loginErr={};history.replaceState(null,'',location.pathname);render()});break;
  }
});
document.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='login')submitLogin();
  if(e.target.id==='reset')submitReset();
  if(e.target.id==='ci-form'){
    const first=!st.checkins[today()];
    draft.note=$('#ci-note').value.trim();
    const c={stress:draft.stress,mood:draft.mood,tags:[...draft.tags],note:draft.note};
    const btn=e.target.querySelector('[type=submit]');btn.disabled=true;btn.textContent=L('Saving…','Menyimpan…');
    run(()=>act.checkin(c),pts=>pts?L(`Checked in · +${pts} pts`,`Sudah daftar masuk · +${pts} mata`):first?L('Checked in','Sudah daftar masuk'):L('Check-in updated','Daftar masuk dikemas kini')).then(()=>{
      if(st&&st.checkins[today()]){editing=false;draft=null;render();window.scrollTo(0,0);focusHeading()}else{btn.disabled=false;btn.textContent=L('Try again','Cuba lagi')}});
  }
  if(e.target.id==='host-form'){
    const n=$('#h-name').value.trim()||L('Team Trivia','Kuiz Pasukan'), when=$('#h-when').value;
    run(()=>act.host(n,when),L('Session published to your team','Sesi disiarkan kepada pasukan anda')).then(()=>{location.hash='games';render()});
  }
  if(e.target.id==='kudos-form'){
    if(!kd.to||!kd.badge)return;
    const btn=e.target.querySelector('[type=submit]');btn.disabled=true;
    const to=kd.to;
    run(()=>act.sendKudos(kd.to,kd.badge,kd.msg.trim()),pts=>L(`Thank-you sent to ${firstName(to.name)}${pts?` · +${pts} pts`:''}`,`Ucapan terima kasih dihantar kepada ${firstName(to.name)}${pts?` · +${pts} mata`:''}`)).then(r=>{
      if(r!==undefined){kd={to:null,badge:null,msg:'',tab:'sent',q:'',results:[]};cache.kudosAt=0;cache.kudos=null}
      render();if(isCloud())refresh('kudos');else{const box=$('#kudos-list');if(box)box.innerHTML=kudosListHTML()}});
  }
});
document.addEventListener('keydown',e=>{
  const sheet=$('#sheet');
  if(sheet.hidden)return;
  if(e.key==='Escape'){closeSheet();return}
  if(e.key==='Tab'){
    const f=[...sheet.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});
/* re-bind live inputs after any render of the Appreciation page */
new MutationObserver(()=>{if(st&&route()==='kudos'&&$('#kudos-form')&&!$('#kudos-form').dataset.bound){$('#kudos-form').dataset.bound='1';bindKudos()}}).observe($('#app'),{childList:true});

/* ---------- start ---------- */
async function boot(){
  if(sb){
    try{
      const {data}=await sb.auth.getSession();
      if(data.session){$('#app').innerHTML=`<div class="loading" role="status"><span class="splash"><img src="icons/logo-full.png" alt="SMISKEE"></span><p>${L('Loading…','Memuatkan…')}</p></div>`;await loadCloud();if(st&&st.user.lang&&st.user.lang!==LANG)setLang(st.user.lang)}
    }catch(e){st=null;toast(friendly(e))}
    sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&st&&st.mode==='cloud'){st=null;render()}});
  }
  if(!st){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.mode==='demo'&&d.v===2)st=upgradeDemo(d)}catch(e){}}
  render();
  await refreshPushStatus();
  if(isCloud()&&pushStatus==='on'){try{const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();if(sub)await saveSubscription(sub)}catch(e){}}
  if(st&&route()==='profile')render();
}
boot();
