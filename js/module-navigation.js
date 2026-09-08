/* ============================================================
 * NUSANTARA WIFI — MODULE NAVIGATION
 * SPA navigation + mobile sidebar behavior.
 * ============================================================ */
(function(){
  'use strict';
  const validPages = new Set(['dashboard','tagihan','pelanggan','pembayaran','histori']);
  function loadThemeSystem(){
    if(document.getElementById('themeSystemLoader'))return;
    const s=document.createElement('script');s.id='themeSystemLoader';s.src='js/theme-system.js';s.async=false;document.head.appendChild(s);
  }
  function installMobileSidebarStyle(){
    if(document.getElementById('mobileSidebarRuntimeStyle'))return;
    const style=document.createElement('style');style.id='mobileSidebarRuntimeStyle';
    style.textContent='.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(38,54,74,.18);backdrop-filter:blur(1.5px);z-index:19;opacity:0;transition:opacity .18s ease;cursor:pointer}.sidebar-overlay.show{display:block;opacity:1}@media(max-width:800px){.sidebar-overlay.show{display:block}}';document.head.appendChild(style);
  }
  function scrollPageTop(){window.scrollTo({top:0,left:0,behavior:'auto'});document.querySelector('.main')?.scrollTo({top:0,left:0,behavior:'auto'});}
  function setSidebarOverlay(show){const overlay=document.getElementById('sidebarOverlay');if(overlay)overlay.classList.toggle('show',show);}
  function closeMobileSidebar(){document.getElementById('sidebar')?.classList.remove('open');setSidebarOverlay(false);}
  function syncSidebarOverlay(){const sidebar=document.getElementById('sidebar');setSidebarOverlay(!!sidebar?.classList.contains('open'));}
  function navigateTo(page,push=true){if(!validPages.has(page))page='dashboard';if(typeof window.showPage==='function')window.showPage(page);document.body.dataset.currentPage=page;closeMobileSidebar();scrollPageTop();if(push&&window.history&&window.history.replaceState){const hash='#'+page;if(window.location.hash!==hash)window.history.pushState({page},'',hash);}}
  window.addEventListener('DOMContentLoaded',function(){
    loadThemeSystem();installMobileSidebarStyle();
    const sidebar=document.getElementById('sidebar'),menu=document.getElementById('mobileMenu');
    if(sidebar&&!document.getElementById('sidebarOverlay')){const overlay=document.createElement('div');overlay.id='sidebarOverlay';overlay.className='sidebar-overlay';overlay.setAttribute('aria-hidden','true');document.body.appendChild(overlay);overlay.addEventListener('click',closeMobileSidebar);}
    menu?.addEventListener('click',function(){requestAnimationFrame(function(){syncSidebarOverlay();if(sidebar?.classList.contains('open'))scrollPageTop();});});
    sidebar?.addEventListener('transitionend',syncSidebarOverlay);
    const hash=window.location.hash.replace(/^#/,'');if(validPages.has(hash))navigateTo(hash,false);else scrollPageTop();
    document.querySelectorAll('.nav-item[data-page]').forEach(function(item){item.addEventListener('click',function(){const page=item.dataset.page;if(validPages.has(page))navigateTo(page,true);});});
    document.querySelectorAll('[data-page-link]').forEach(function(item){item.addEventListener('click',function(){const page=item.dataset.pageLink;if(validPages.has(page))navigateTo(page,true);});});
    document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMobileSidebar();});
  });
  window.addEventListener('popstate',function(){const hash=window.location.hash.replace(/^#/,'');navigateTo(validPages.has(hash)?hash:'dashboard',false);});
})();
