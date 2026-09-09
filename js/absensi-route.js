/* NUSANTARA BUSINESS — ABSENSI ROUTE */
(function(){
  'use strict';
  if(typeof PAGE_META!=='undefined')PAGE_META.absensi=['PEOPLE','Absensi'];
  function open(){if(typeof PAGE_META==='undefined'||!PAGE_META.absensi)return;if(typeof window.showPage==='function')window.showPage('absensi');document.body.dataset.currentPage='absensi';window.__nusantaraAbsensiWorkspace?.show()}
  function sync(){if(window.location.hash.replace(/^#/,'')==='absensi')open()}
  window.__nusantaraAbsensiRoute={open};
  window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();
