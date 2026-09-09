/* NUSANTARA BUSINESS — ABSENSI NAVIGATION */
(function(){
  'use strict';
  const PAGE='absensi';
  function patchShowPage(){
    if(typeof window.showPage!=='function'||window.showPage.__absensiPatched)return false;
    const original=window.showPage;
    const patched=function(page){
      if(page!==PAGE)return original.apply(this,arguments);
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.getElementById('page-absensi')?.classList.add('active');
      document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===PAGE));
      document.getElementById('pageEyebrow')?.replaceChildren(document.createTextNode('PEOPLE'));
      document.getElementById('pageTitle')?.replaceChildren(document.createTextNode('Absensi'));
      document.body.dataset.currentPage=PAGE;
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebarOverlay')?.classList.remove('show');
      window.scrollTo({top:0,left:0,behavior:'auto'});
    };
    patched.__absensiPatched=true;patched.__absensiOriginal=original;window.showPage=patched;return true;
  }
  function install(){
    patchShowPage();
    const nav=document.querySelector('.nav');
    if(!nav)return false;
    if(!nav.querySelector('[data-page="absensi"]')){
      let group=Array.from(nav.querySelectorAll('.nav-group')).find(g=>g.querySelector('.nav-group-label')?.textContent?.trim()==='PEOPLE');
      if(!group){group=document.createElement('div');group.className='nav-group';group.innerHTML='<div class="nav-group-label">PEOPLE</div>';nav.appendChild(group)}
      const item=document.createElement('button');item.className='nav-item';item.type='button';item.dataset.page=PAGE;item.innerHTML='<span>◫</span><b>Absensi</b><em style="margin-left:auto;font-size:9px;opacity:.6">PHASE 04</em>';
      item.addEventListener('click',function(){window.showPage(PAGE);if(window.history?.replaceState)window.history.pushState({page:PAGE},'',`#${PAGE}`)});
      group.appendChild(item);
    }
    return true;
  }
  function routeHash(){if(window.location.hash.replace(/^#/,'')===PAGE&&typeof window.showPage==='function')window.showPage(PAGE)}
  function init(){if(!install()){setTimeout(init,100);return}setTimeout(routeHash,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('popstate',routeHash);
})();
