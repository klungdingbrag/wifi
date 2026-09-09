/* ============================================================
 * NUSANTARA WIFI — MODULE NAVIGATION
 * SPA navigation + mobile sidebar behavior + roadmap workspace.
 * ============================================================ */
(function(){
  'use strict';

  const validPages = new Set(['dashboard','tagihan','pelanggan','pembayaran','histori','roadmap']);

  function loadThemeSystem(){
    if(document.getElementById('themeSystemLoader'))return;
    const s=document.createElement('script');s.id='themeSystemLoader';s.src='js/theme-system.js';s.async=false;document.head.appendChild(s);
  }

  function loadModulePolish(){
    if(document.getElementById('modulePolishStyle'))return;
    const l=document.createElement('link');l.id='modulePolishStyle';l.rel='stylesheet';l.href='css/module-polish.css';document.head.appendChild(l);
  }

  function loadPaymentWorkspace(){
    if(document.getElementById('paymentWorkspaceLoader'))return;
    const s=document.createElement('script');s.id='paymentWorkspaceLoader';s.src='js/payment-workspace.js';s.async=false;document.body.appendChild(s);
  }

  function installMobileSidebarStyle(){
    if(document.getElementById('mobileSidebarRuntimeStyle'))return;
    const style=document.createElement('style');style.id='mobileSidebarRuntimeStyle';
    style.textContent='.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(38,54,74,.18);backdrop-filter:blur(1.5px);z-index:19;opacity:0;transition:opacity .18s ease;cursor:pointer}.sidebar-overlay.show{display:block;opacity:1}@media(max-width:800px){.sidebar-overlay.show{display:block}}';
    document.head.appendChild(style);
  }

  function installRoadmapStyles(){
    if(document.getElementById('roadmapRuntimeStyle'))return;
    const style=document.createElement('style');style.id='roadmapRuntimeStyle';
    style.textContent=`
      .roadmap-shell{display:grid;gap:18px}.roadmap-hero{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:18px;align-items:stretch}.roadmap-intro,.roadmap-progress,.roadmap-card{background:var(--surface,#fff);border:1px solid var(--border,#e3eaf1);border-radius:18px;box-shadow:0 8px 24px rgba(20,45,70,.05)}.roadmap-intro{padding:24px}.roadmap-intro h2{margin:5px 0 8px;font-size:25px;letter-spacing:-.02em}.roadmap-intro p{margin:0;max-width:760px;color:var(--muted,#718096);line-height:1.65}.roadmap-progress{padding:22px;display:flex;flex-direction:column;justify-content:center}.roadmap-progress-label{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--muted,#718096)}.roadmap-progress-value{font-size:32px;font-weight:800;line-height:1.1;margin:5px 0 10px;color:var(--primary,#587da5)}.roadmap-progress-bar{height:8px;border-radius:99px;background:var(--bg-soft,#edf2f7);overflow:hidden}.roadmap-progress-bar span{display:block;height:100%;width:50%;border-radius:inherit;background:linear-gradient(90deg,var(--primary,#587da5),var(--cyan,#17b8dc))}.roadmap-progress small{margin-top:9px;color:var(--muted,#718096);line-height:1.45}.roadmap-section-head{display:flex;justify-content:space-between;align-items:end;gap:12px}.roadmap-section-head h3{margin:0;font-size:18px}.roadmap-section-head p{margin:4px 0 0;color:var(--muted,#718096);font-size:13px}.roadmap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.roadmap-card{position:relative;padding:20px;overflow:hidden}.roadmap-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--roadmap-accent,var(--primary,#587da5))}.roadmap-card.done{--roadmap-accent:var(--success,#58a98a)}.roadmap-card.next{--roadmap-accent:var(--cyan,#17b8dc)}.roadmap-card.planned{--roadmap-accent:var(--warning,#b98b4f)}.roadmap-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.roadmap-phase{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--muted,#718096)}.roadmap-card h4{margin:5px 0 7px;font-size:17px}.roadmap-card p{margin:0;color:var(--muted,#718096);font-size:13px;line-height:1.55}.roadmap-status{flex:none;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:800;background:var(--bg-soft,#edf2f7);color:var(--muted,#718096)}.roadmap-card.done .roadmap-status{background:rgba(88,169,138,.12);color:var(--success,#58a98a)}.roadmap-card.next .roadmap-status{background:rgba(23,184,220,.12);color:var(--cyan,#17b8dc)}.roadmap-card.planned .roadmap-status{background:rgba(185,139,79,.12);color:var(--warning,#b98b4f)}.roadmap-list{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:7px}.roadmap-list li{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.45;color:var(--text,#263548)}.roadmap-list li::before{content:"✓";font-weight:800;color:var(--roadmap-accent,var(--primary,#587da5));flex:none}.roadmap-card.next .roadmap-list li::before{content:"→"}.roadmap-card.planned .roadmap-list li::before{content:"○"}.roadmap-now{padding:18px 20px;background:linear-gradient(135deg,rgba(23,184,220,.08),rgba(88,125,165,.08));border:1px solid var(--border,#e3eaf1);border-radius:16px}.roadmap-now strong{display:block;margin-bottom:4px}.roadmap-now span{color:var(--muted,#718096);font-size:13px;line-height:1.55}[data-theme="dark"] .roadmap-intro,[data-theme="dark"] .roadmap-progress,[data-theme="dark"] .roadmap-card{box-shadow:0 10px 30px rgba(0,0,0,.18)}@media(max-width:800px){.roadmap-hero,.roadmap-grid{grid-template-columns:1fr}.roadmap-intro{padding:20px}}
    `;document.head.appendChild(style);
  }

  function installRoadmapPage(){
    if(document.getElementById('page-roadmap'))return;
    const main=document.querySelector('.main');if(!main)return;
    const section=document.createElement('section');section.id='page-roadmap';section.className='page';
    section.innerHTML=`<div class="roadmap-shell"><div class="roadmap-hero"><div class="roadmap-intro"><div class="panel-kicker">PRODUCT ROADMAP</div><h2>Arah pengembangan Nusantara WiFi</h2><p>Roadmap ini menjadi living plan untuk memastikan aplikasi berkembang bertahap: stabilitas database terlebih dahulu, lalu operasional billing, transaction center, analytics, dan penguatan sistem.</p></div><div class="roadmap-progress"><div class="roadmap-progress-label">PROGRES ROADMAP</div><div class="roadmap-progress-value">50%</div><div class="roadmap-progress-bar"><span></span></div><small>3 dari 6 fase utama selesai.</small></div></div><div class="roadmap-now"><strong>Next focus · Pembayaran / Transaction Center</strong><span>Setelah workspace Pelanggan selesai, fokus berikutnya adalah membuat modul Pembayaran menjadi pusat transaksi yang jelas, cepat, aman, dan konsisten dengan tema Light/Dark.</span></div><div class="roadmap-section-head"><div><h3>Roadmap utama</h3><p>Urutan dapat berkembang mengikuti kebutuhan operasional tanpa mengubah fondasi yang sudah stabil.</p></div></div><div class="roadmap-grid"><article class="roadmap-card done"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 01 · FOUNDATION</div><h4>Fondasi Sistem & Database</h4><p>Membangun struktur aplikasi dan menjaga integritas data.</p></div><span class="roadmap-status">SELESAI</span></div><ul class="roadmap-list"><li>Google Sheets sebagai database terstruktur</li><li>Customer ID dan Bill ID anti-duplikasi</li><li>Audit trail dan payment reversal</li><li>Hardening backend V6.4</li></ul></article><article class="roadmap-card done"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 02 · BILLING</div><h4>Billing Workspace</h4><p>Tagihan menjadi workspace operasional bulanan.</p></div><span class="roadmap-status">SELESAI</span></div><ul class="roadmap-list"><li>Filter periode dan status</li><li>Navigasi bulan sebelumnya / ini / berikutnya</li><li>Generate tagihan dengan duplicate prevention</li><li>Status Belum Bayar dan Lunas</li></ul></article><article class="roadmap-card done"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 03 · CUSTOMERS</div><h4>Customer Workspace</h4><p>Database pelanggan berubah menjadi customer management workspace.</p></div><span class="roadmap-status">SELESAI</span></div><ul class="roadmap-list"><li>Pencarian dan filter pelanggan</li><li>Sorting pelanggan</li><li>Status accent pada customer card</li><li>Detail, WhatsApp, dan edit tetap terintegrasi</li></ul></article><article class="roadmap-card next"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 04 · PAYMENTS</div><h4>Transaction Center</h4><p>Pembayaran menjadi pusat pencatatan transaksi yang profesional.</p></div><span class="roadmap-status">BERIKUTNYA</span></div><ul class="roadmap-list"><li>Ringkasan transaksi valid</li><li>Riwayat pembayaran yang mudah ditelusuri</li><li>UX pembayaran dan reversal yang aman</li><li>Feedback transaksi yang jelas</li></ul></article><article class="roadmap-card planned"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 05 · ANALYTICS</div><h4>Analytics & Management</h4><p>Dashboard berkembang dari monitoring menjadi alat pengambilan keputusan.</p></div><span class="roadmap-status">RENCANA</span></div><ul class="roadmap-list"><li>Collection trend dan revenue insight</li><li>Outstanding aging</li><li>Customer growth dan retention signal</li><li>Operational KPI</li></ul></article><article class="roadmap-card planned"><div class="roadmap-card-head"><div><div class="roadmap-phase">FASE 06 · SCALE & HARDEN</div><h4>Reliability & Scale</h4><p>Mempersiapkan sistem untuk volume pelanggan dan operasional yang lebih besar.</p></div><span class="roadmap-status">RENCANA</span></div><ul class="roadmap-list"><li>Permission dan role management</li><li>Backup / recovery strategy</li><li>Performance dan concurrency hardening</li><li>Monitoring dan maintenance workflow</li></ul></article></div></div>`;
    main.appendChild(section);
  }

  function installRoadmapNav(){
    const nav=document.querySelector('.nav');if(!nav||nav.querySelector('[data-page="roadmap"]'))return;
    const group=document.createElement('div');group.className='nav-group';group.innerHTML='<div class="nav-group-label">SISTEM</div><button class="nav-item" data-page="roadmap"><span>◇</span><b>Roadmap</b></button>';
    const internal=Array.from(nav.querySelectorAll('.nav-group')).find(g=>g.querySelector('.nav-external'));if(internal)nav.insertBefore(group,internal);else nav.appendChild(group);
  }

  function scrollPageTop(){window.scrollTo({top:0,left:0,behavior:'auto'});document.querySelector('.main')?.scrollTo({top:0,left:0,behavior:'auto'});}
  function setSidebarOverlay(show){const overlay=document.getElementById('sidebarOverlay');if(overlay)overlay.classList.toggle('show',show);}
  function closeMobileSidebar(){document.getElementById('sidebar')?.classList.remove('open');setSidebarOverlay(false);}
  function syncSidebarOverlay(){const sidebar=document.getElementById('sidebar');setSidebarOverlay(!!sidebar?.classList.contains('open'));}
  function navigateTo(page,push=true){if(!validPages.has(page))page='dashboard';if(typeof PAGE_META!=='undefined'&&!PAGE_META.roadmap)PAGE_META.roadmap=['SYSTEM','Roadmap'];if(typeof window.showPage==='function')window.showPage(page);document.body.dataset.currentPage=page;closeMobileSidebar();scrollPageTop();if(push&&window.history&&window.history.replaceState){const hash='#'+page;if(window.location.hash!==hash)window.history.pushState({page},'',hash);}}
  function bindNavigation(){document.querySelectorAll('.nav-item[data-page], [data-page-link]').forEach(function(item){if(item.dataset.navBound==='1')return;item.dataset.navBound='1';item.addEventListener('click',function(){const page=item.dataset.page||item.dataset.pageLink;if(validPages.has(page))navigateTo(page,true);});});}

  window.addEventListener('DOMContentLoaded',function(){
    if(typeof PAGE_META!=='undefined'&&!PAGE_META.roadmap)PAGE_META.roadmap=['SYSTEM','Roadmap'];
    loadThemeSystem();loadModulePolish();installMobileSidebarStyle();installRoadmapStyles();installRoadmapPage();installRoadmapNav();loadPaymentWorkspace();bindNavigation();
    const sidebar=document.getElementById('sidebar'),menu=document.getElementById('mobileMenu');
    if(sidebar&&!document.getElementById('sidebarOverlay')){const overlay=document.createElement('div');overlay.id='sidebarOverlay';overlay.className='sidebar-overlay';overlay.setAttribute('aria-hidden','true');document.body.appendChild(overlay);overlay.addEventListener('click',closeMobileSidebar);}
    menu?.addEventListener('click',function(){requestAnimationFrame(function(){syncSidebarOverlay();if(sidebar?.classList.contains('open'))scrollPageTop();});});sidebar?.addEventListener('transitionend',syncSidebarOverlay);
    const hash=window.location.hash.replace(/^#/,'');if(validPages.has(hash))navigateTo(hash,false);else scrollPageTop();document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMobileSidebar();});
  });
  window.addEventListener('popstate',function(){const hash=window.location.hash.replace(/^#/,'');navigateTo(validPages.has(hash)?hash:'dashboard',false);});
})();
