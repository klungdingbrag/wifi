/* ============================================================
 * NUSANTARA WIFI — MODULE NAVIGATION
 * Adds clear SPA navigation state without changing backend logic.
 * ============================================================ */
(function(){
  'use strict';

  const validPages = new Set(['dashboard','tagihan','pelanggan','pembayaran','histori']);

  function navigateTo(page, push=true){
    if(!validPages.has(page)) page='dashboard';
    if(typeof window.showPage==='function') window.showPage(page);
    document.body.dataset.currentPage=page;
    if(push && window.history && window.history.replaceState){
      const hash='#'+page;
      if(window.location.hash!==hash) window.history.pushState({page},'',hash);
    }
  }

  window.addEventListener('DOMContentLoaded',function(){
    const hash=window.location.hash.replace(/^#/,'');
    if(validPages.has(hash)) navigateTo(hash,false);

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
  });

  window.addEventListener('popstate',function(){
    const hash=window.location.hash.replace(/^#/,'');
    navigateTo(validPages.has(hash)?hash:'dashboard',false);
  });
})();
