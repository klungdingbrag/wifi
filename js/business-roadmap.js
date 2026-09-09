/* ============================================================
 * NUSANTARA BUSINESS — ROADMAP
 * Unified platform roadmap. UI-only; no backend writes.
 * ============================================================ */
(function(){
  'use strict';
  const KEY='__nusantaraBusinessRoadmap';
  if(window[KEY]?.installed)return;

  const phases=[
    {no:'01',k:'FOUNDATION',title:'Production Foundation',status:'SELESAI',kind:'done',desc:'Menjadikan Nusantara WiFi sebagai fondasi production yang stabil.',items:['Billing, customer, payment dan audit stabil','Analytics, management decision dan reliability tersedia','Resilience dan refresh hardening aktif']},
    {no:'02',k:'ARCHITECTURE',title:'Architecture Audit & Blueprint',status:'SELESAI',kind:'done',desc:'Mendefinisikan batas module, ownership data, API dan strategi migrasi.',items:['Audit repository WiFi dan Absensi','Pemetaan backend dan database','Module boundary dan service-layer contract','Strategi migrasi tanpa downtime']},
    {no:'03',k:'PLATFORM',title:'Nusantara Business Shell',status:'BERIKUTNYA',kind:'next',desc:'Mengubah UI WiFi menjadi unified shell untuk seluruh aplikasi bisnis.',items:['Brand dan navigation Nusantara Business','Unified theme, loading dan notification','Module registry dan routing','Service layer foundation']},
    {no:'04',k:'PEOPLE',title:'Nusantara Absensi Integration',status:'RENCANA',kind:'planned',desc:'Membawa Karyawan, Absensi dan Payroll ke dalam UI unified tanpa menggabungkan backend.',items:['Absensi service adapter','Attendance workspace','Employee workspace','Payroll workspace','Legacy fallback selama migrasi']},
    {no:'05',k:'SERVICES',title:'Unified Service Layer',status:'RENCANA',kind:'planned',desc:'Menstandarkan komunikasi frontend dengan dua backend yang tetap terpisah.',items:['WiFi service adapter','Absensi service adapter','Response normalization','Error isolation dan retry policy','Observability lintas service']},
    {no:'06',k:'ANALYTICS',title:'Business Analytics',status:'RENCANA',kind:'planned',desc:'Menggabungkan insight operasional WiFi dan People menjadi management view.',items:['Business KPI','Revenue dan collection','Attendance dan payroll KPI','Cross-module management signals']},
    {no:'07',k:'SECURITY',title:'Security & Access Control',status:'RENCANA',kind:'planned',desc:'Membangun identitas pengguna dan permission lintas module.',items:['Authentication','Role-based access control','Owner / Admin / Staff','Audit access','Backend authorization strategy']},
    {no:'08',k:'RELIABILITY',title:'Reliability & Scale',status:'RENCANA',kind:'planned',desc:'Mempersiapkan platform untuk pertumbuhan data, user dan module.',items:['Concurrency hardening','Backup dan recovery','Performance monitoring','Failure isolation','Maintenance workflow']},
    {no:'09',k:'EXPANSION',title:'Nusantara Business Expansion',status:'RENCANA',kind:'planned',desc:'Menambahkan domain bisnis baru berdasarkan kebutuhan operasional nyata.',items:['Inventory','Purchasing','Finance / Cashflow','CRM','Integrations']}
  ];

  function styles(){
    if(document.getElementById('businessRoadmapStyle'))return;
    const s=document.createElement('style');s.id='businessRoadmapStyle';
    s.textContent=`
      .nb-roadmap{display:grid;gap:18px}.nb-roadmap-hero{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:18px}.nb-roadmap-panel,.nb-roadmap-card{background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:18px;box-shadow:0 8px 24px rgba(20,45,70,.05)}.nb-roadmap-panel{padding:24px}.nb-roadmap-panel h2{margin:5px 0 8px;font-size:26px;letter-spacing:-.025em}.nb-roadmap-panel p{margin:0;color:var(--muted,#718096);line-height:1.65;max-width:800px}.nb-roadmap-progress{padding:22px;display:flex;flex-direction:column;justify-content:center}.nb-roadmap-progress small{color:var(--muted,#718096);line-height:1.45}.nb-roadmap-progress-value{font-size:34px;font-weight:800;color:var(--primary,#587da5);margin:4px 0 9px}.nb-roadmap-bar{height:8px;border-radius:99px;background:var(--bg-soft,#edf2f7);overflow:hidden;margin-bottom:9px}.nb-roadmap-bar span{display:block;height:100%;width:22%;border-radius:inherit;background:linear-gradient(90deg,var(--primary,#587da5),var(--cyan,#17b8dc))}.nb-roadmap-now{padding:18px 20px;border-radius:16px;border:1px solid var(--border,#e3eaf1);background:linear-gradient(135deg,rgba(23,184,220,.08),rgba(88,125,165,.08))}.nb-roadmap-now strong{display:block;margin-bottom:4px}.nb-roadmap-now span{font-size:13px;color:var(--muted,#718096);line-height:1.55}.nb-roadmap-head h3{margin:0;font-size:18px}.nb-roadmap-head p{margin:4px 0 0;color:var(--muted,#718096);font-size:13px}.nb-roadmap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.nb-roadmap-card{position:relative;padding:20px;overflow:hidden}.nb-roadmap-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--roadmap-accent,var(--primary,#587da5))}.nb-roadmap-card.done{--roadmap-accent:var(--success,#58a98a)}.nb-roadmap-card.next{--roadmap-accent:var(--cyan,#17b8dc)}.nb-roadmap-card.planned{--roadmap-accent:var(--warning,#b98b4f)}.nb-roadmap-card-head{display:flex;justify-content:space-between;gap:12px}.nb-roadmap-phase{font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--muted,#718096)}.nb-roadmap-card h4{margin:5px 0 7px;font-size:17px}.nb-roadmap-card p{margin:0;color:var(--muted,#718096);font-size:13px;line-height:1.5}.nb-roadmap-status{flex:none;height:max-content;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:800;background:var(--bg-soft,#edf2f7);color:var(--muted,#718096)}.nb-roadmap-card.done .nb-roadmap-status{background:rgba(88,169,138,.12);color:var(--success,#58a98a)}.nb-roadmap-card.next .nb-roadmap-status{background:rgba(23,184,220,.12);color:var(--cyan,#17b8dc)}.nb-roadmap-list{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:7px}.nb-roadmap-list li{font-size:12px;line-height:1.45;color:var(--text,#263548);display:flex;gap:8px}.nb-roadmap-list li:before{content:"✓";font-weight:800;color:var(--roadmap-accent,var(--primary,#587da5))}.nb-roadmap-card.next .nb-roadmap-list li:before{content:"→"}.nb-roadmap-card.planned .nb-roadmap-list li:before{content:"○"}[data-theme="dark"] .nb-roadmap-panel,[data-theme="dark"] .nb-roadmap-card{box-shadow:0 10px 30px rgba(0,0,0,.18)}@media(max-width:800px){.nb-roadmap-hero,.nb-roadmap-grid{grid-template-columns:1fr}.nb-roadmap-panel{padding:20px}}
    `;document.head.appendChild(s);
  }

  function render(){
    const page=document.getElementById('page-roadmap');if(!page)return false;
    styles();
    const done=phases.filter(p=>p.kind==='done').length;
    const progress=Math.round(done/phases.length*100);
    page.innerHTML=`<div class="nb-roadmap"><div class="nb-roadmap-hero"><div class="nb-roadmap-panel"><div class="panel-kicker">NUSANTARA BUSINESS · MASTER ROADMAP</div><h2>Dari Nusantara WiFi menjadi Nusantara Business</h2><p>Roadmap baru ini menjadikan Nusantara WiFi sebagai production foundation dan membangun satu unified frontend untuk modul bisnis berikutnya. Backend WiFi dan Absensi tetap terpisah agar ownership data, reliability, dan migrasi tetap aman.</p></div><div class="nb-roadmap-panel nb-roadmap-progress"><div class="roadmap-progress-label">PROGRES MASTER ROADMAP</div><div class="nb-roadmap-progress-value">${progress}%</div><div class="nb-roadmap-bar"><span style="width:${progress}%"></span></div><small>${done} dari ${phases.length} fase utama selesai. Fase 02 sudah memiliki blueprint arsitektur.</small></div></div><div class="nb-roadmap-now"><strong>Next focus · Nusantara Business Shell</strong><span>Fondasi WiFi dipertahankan. Fokus berikutnya adalah membuat unified frontend, service registry, dan navigation yang dapat menjadi rumah bersama untuk WiFi dan People / Absensi.</span></div><div class="nb-roadmap-head"><h3>Master roadmap</h3><p>Roadmap ini menggantikan roadmap linear Nusantara WiFi. Detail teknis arsitektur tersimpan di <strong>docs/NUSANTARA-BUSINESS-ARCHITECTURE.md</strong>.</p></div><div class="nb-roadmap-grid">${phases.map(p=>`<article class="nb-roadmap-card ${p.kind}"><div class="nb-roadmap-card-head"><div><div class="nb-roadmap-phase">FASE ${p.no} · ${p.k}</div><h4>${p.title}</h4><p>${p.desc}</p></div><span class="nb-roadmap-status">${p.status}</span></div><ul class="nb-roadmap-list">${p.items.map(i=>`<li>${i}</li>`).join('')}</ul></article>`).join('')}</div></div>`;
    return true;
  }

  function install(){
    if(window[KEY]?.installed)return;
    styles();
    let attempts=0;
    const timer=setInterval(()=>{attempts++;if(render()||attempts>40){clearInterval(timer);window[KEY]={installed:true,version:'1.0.0',phases:phases.length,render};}},150);
    window[KEY]={installed:false,version:'1.0.0',phases:phases.length,render};
  }

  install();
})();
