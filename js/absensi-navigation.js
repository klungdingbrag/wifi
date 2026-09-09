/* ============================================================
 * NUSANTARA BUSINESS — ABSENSI NAVIGATION
 * Phase 04: replace the Phase 03 placeholder with native route.
 * ============================================================ */
(function(){
  'use strict';
  const KEY='__nusantaraAbsensiNavigation';
  if(window[KEY]?.installed)return;
  function install(){
    const nav=document.querySelector('.nav');
    const old=nav?.querySelector('[data-business-placeholder="attendance"]');
    if(!old)return false;
    const btn=old.cloneNode(true);
    btn.removeAttribute('data-business-placeholder');
    btn.dataset.page='absensi';
    btn.dataset.businessNative='1';
    btn.setAttribute('aria-label','Absensi');
    old.replaceWith(btn);
    btn.addEventListener('click',function(event){event.preventDefault();if(typeof window.showPage==='function')window.showPage('absensi');document.body.dataset.currentPage='absensi';window.scrollTo({top:0,left:0,behavior:'auto'});window.__nusantaraAbsensiWorkspace?.show()});
    window[KEY]={installed:true};
    return true;
  }
  window[KEY]={installed:false,install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!install())setTimeout(install,250)},{once:true});else if(!install())setTimeout(install,250);
})();
