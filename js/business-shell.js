/* ============================================================
 * NUSANTARA BUSINESS — SHELL CONTROLLER
 * Phase 03: Unified frontend shell.
 * Read-only with respect to business data; UI-only changes.
 * ============================================================ */
(function(){
  'use strict';
  const KEY='__nusantaraBusinessShell';
  if(window[KEY]?.installed)return;

  const state={installed:false,version:'1.0.0'};

  function loadCss(){
    if(document.getElementById('businessShellStyle'))return;
    const link=document.createElement('link');
    link.id='businessShellStyle';
    link.rel='stylesheet';
    link.href='css/business-shell.css';
    document.head.appendChild(link);
  }

  function setText(selector,text){const el=document.querySelector(selector);if(el)el.textContent=text}

  function installBrand(){
    const brand=document.querySelector('.sidebar .brand');
    if(brand){
      const title=brand.querySelector('.brand-title');
      const subtitle=brand.querySelector('.brand-subtitle');
      if(title)title.textContent='Nusantara Business';
      if(subtitle)subtitle.textContent='Business Management Portal';
      const mark=brand.querySelector('.brand-mark');
      if(mark)mark.textContent='NB';
      if(!brand.querySelector('.business-brand-context')){
        const context=document.createElement('div');
        context.className='business-brand-context';
        context.innerHTML='<span class="dot"></span><span>Unified Platform</span>';
        brand.appendChild(context);
      }
    }
    const loadingTitle=document.querySelector('#loadingScreen .loading-title');
    if(loadingTitle)loadingTitle.textContent='Nusantara Business';
    const loadingMark=document.querySelector('#loadingScreen .brand-mark');
    if(loadingMark)loadingMark.textContent='NB';
    document.title='Nusantara Business';
  }

  function installTopbarContext(){
    const left=document.querySelector('.topbar-left');
    if(!left||document.getElementById('businessShellContext'))return;
    const context=document.createElement('div');
    context.id='businessShellContext';
    context.className='business-shell-context';
    context.innerHTML='<span class="shell-context-dot"></span><strong>WiFi</strong><span>Billing Module</span>';
    const actions=document.querySelector('.top-actions');
    if(actions)left.parentElement.insertBefore(context,actions);
  }

  function installNav(){
    const nav=document.querySelector('.nav');
    if(!nav)return;

    const groups=Array.from(nav.querySelectorAll('.nav-group'));
    const operational=groups.find(g=>g.querySelector('[data-page="tagihan"]'));
    const customers=groups.find(g=>g.querySelector('[data-page="pelanggan"]'));
    const system=groups.find(g=>g.querySelector('[data-page="histori"]'));
    const internal=groups.find(g=>g.querySelector('.nav-external'));

    if(operational){
      const label=operational.querySelector('.nav-group-label');
      if(label)label.textContent='WIFI';
    }
    if(customers){
      const label=customers.querySelector('.nav-group-label');
      if(label)label.textContent='WIFI · PELANGGAN';
    }
    if(system){
      const label=system.querySelector('.nav-group-label');
      if(label)label.textContent='SYSTEM';
    }

    if(internal){
      const label=internal.querySelector('.nav-group-label');
      if(label)label.textContent='LEGACY';
      const link=internal.querySelector('.nav-external');
      if(link){
        const text=link.querySelector('b');
        if(text)text.textContent='Absensi Legacy';
      }
    }

    if(!nav.querySelector('[data-business-module="people"]')){
      const group=document.createElement('div');
      group.className='nav-group';
      group.dataset.businessModule='people';
      group.innerHTML='<div class="nav-group-label business-nav-label"><span>PEOPLE</span><small>Phase 04</small></div><button class="nav-item" type="button" data-business-placeholder="attendance"><span>◷</span><b>Absensi</b></button><button class="nav-item" type="button" data-business-placeholder="payroll"><span>▤</span><b>Payroll</b></button>';
      const analyticsGroup=groups.find(g=>g.querySelector('[data-page="roadmap"]'));
      if(analyticsGroup)nav.insertBefore(group,analyticsGroup);else if(internal)nav.insertBefore(group,internal);else nav.appendChild(group);
    }

    nav.querySelectorAll('[data-business-placeholder]').forEach(btn=>{
      if(btn.dataset.shellBound==='1')return;
      btn.dataset.shellBound='1';
      btn.addEventListener('click',function(){
        const name=btn.dataset.businessPlaceholder==='attendance'?'Absensi':'Payroll';
        if(typeof window.toast==='function')window.toast(name+' akan tersedia pada fase integrasi berikutnya.');
      });
    });
  }

  function installDashboardContext(){
    const dashboard=document.getElementById('page-dashboard');
    if(!dashboard||dashboard.querySelector('[data-business-shell-notice]'))return;
    const hero=dashboard.querySelector('.hero');
    if(hero){
      const kicker=hero.querySelector('.hero-kicker');
      const title=hero.querySelector('h2');
      const text=hero.querySelector('p');
      if(kicker)kicker.textContent='NUSANTARA BUSINESS · WIFI';
      if(title)title.innerHTML='Kelola operasional WiFi<br><span>dengan lebih tenang.</span>';
      if(text)text.textContent='Billing, pelanggan, pembayaran, dan analytics menjadi modul pertama dalam satu Business Portal Nusantara.';
    }
    const notice=document.createElement('div');
    notice.className='business-shell-notice';
    notice.dataset.businessShellNotice='1';
    notice.innerHTML='<div class="business-shell-notice-icon">NB</div><div><strong>Unified Business Portal</strong><span>WiFi adalah modul production pertama. Modul People seperti Absensi dan Payroll akan masuk melalui backend terpisah tanpa mengganggu sistem WiFi.</span></div>';
    const stats=dashboard.querySelector('.stats-grid');
    if(stats)dashboard.insertBefore(notice,stats);
  }

  function install(){
    if(state.installed)return;
    loadCss();
    installBrand();
    installTopbarContext();
    installNav();
    installDashboardContext();
    state.installed=true;
    window[KEY]={installed:true,version:state.version};
  }

  window[KEY]={installed:false,version:state.version,install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
