/* ============================================================
 * NUSANTARA WIFI — MODULE NAVIGATION
 * SPA navigation + mobile sidebar behavior.
 * ============================================================ */
(function(){
  'use strict';

  const validPages = new Set(['dashboard','tagihan','pelanggan','pembayaran','histori']);

  function scrollPageTop(){
    window.scrollTo({top:0,left:0,behavior:'auto'});
    document.querySelector('.main')?.scrollTo({top:0,left:0,behavior:'auto'});
  }

  function setSidebarOverlay(show){
    const overlay=document.getElementById('sidebarOverlay');
    if(overlay) overlay.classList.toggle('show',show);
  }

  function closeMobileSidebar(){
    document.getElementById('sidebar')?.classList.remove('open');
    setSidebarOverlay(false);
  }

  function syncSidebarOverlay(){
    const sidebar=document.getElementById('sidebar');
    setSidebarOverlay(!!sidebar?.classList.contains('open'));
  }

  function navigateTo(page, push=true){
    if(!validPages.has(page)) page='dashboard';
    if(typeof window.showPage==='function') window.showPage(page);
    document.body.dataset.currentPage=page;
    closeMobileSidebar();
    scrollPageTop();
    if(push && window.history && window.history.replaceState){
      const hash='#'+page;
      if(window.location.hash!==hash) window.history.pushState({page},'',hash);
    }
  }

  window.addEventListener('DOMContentLoaded',function(){
    const sidebar=document.getElementById('sidebar');
    const menu=document.getElementById('mobileMenu');

    /* One transparent layer sits above the page when the mobile sidebar is open.
       Tapping anywhere outside the sidebar closes it immediately. */
    if(sidebar && !document.getElementById('sidebarOverlay')){
      const overlay=document.createElement('div');
      overlay.id='sidebarOverlay';
      overlay.className='sidebar-overlay';
      overlay.setAttribute('aria-hidden','true');
      document.body.appendChild(overlay);
      overlay.addEventListener('click',closeMobileSidebar);
    }

    menu?.addEventListener('click',function(){
      requestAnimationFrame(function(){
        syncSidebarOverlay();
        if(sidebar?.classList.contains('open')) scrollPageTop();
      });
    });

    sidebar?.addEventListener('transitionend',syncSidebarOverlay);

    const hash=window.location.hash.replace(/^#/,'');
    if(validPages.has(hash)) navigateTo(hash,false);
    else scrollPageTop();

    document.querySelectorAll('.nav-item[data-page]').forEach(function(item){
      item.addEventListener('click',function(){
        const page=item.dataset.page;
        if(validPages.has(page)) navigateTo(page,true);
      });
    });

    document.querySelectorAll('[data-page-link]').forEach(function(item){
      item.addEventListener('click',function(){
        const page=item.dataset.pageLink;
        if(validPages.has(page)) navigateTo(page,true);
      });
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape') closeMobileSidebar();
    });
  });

  window.addEventListener('popstate',function(){
    const hash=window.location.hash.replace(/^#/,'');
    navigateTo(validPages.has(hash)?hash:'dashboard',false);
  });
})();
