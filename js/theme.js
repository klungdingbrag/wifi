/* NUSANTARA WIFI — THEME SWITCHER */
'use strict';
(function(){
  const KEY='nusantara-wifi-theme';
  function preferred(){return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function apply(theme){
    const t=theme==='dark'?'dark':'light';
    document.documentElement.dataset.theme=t;
    const btn=document.getElementById('themeToggle');
    if(btn){btn.setAttribute('aria-label',t==='dark'?'Aktifkan light mode':'Aktifkan dark mode');btn.title=t==='dark'?'Light mode':'Dark mode';}
  }
  function init(){
    let saved=null;try{saved=localStorage.getItem(KEY)}catch(e){}
    apply(saved||preferred());
    document.getElementById('themeToggle')?.addEventListener('click',function(){
      const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
      apply(next);try{localStorage.setItem(KEY,next)}catch(e){}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
