/* ============================================================
 * NUSANTARA WIFI — RELIABILITY HARDENING
 * Phase 06.7: prevent overlapping refresh requests and duplicate
 * hardening installation. Read-only; never changes DB records.
 * ============================================================ */
(function(){
  'use strict';
  const KEY='__nusantaraRefreshHardening';
  if(window[KEY]?.installed)return;

  const state={installed:false,inFlight:null,started:0,completed:0,coalesced:0};

  function install(){
    if(state.installed)return;
    const original=window.loadInitialData;
    if(typeof original!=='function'){
      setTimeout(install,100);
      return;
    }
    if(original.__reliabilityHardening)return;

    const hardened=function(){
      if(state.inFlight){
        state.coalesced++;
        return state.inFlight;
      }
      state.started=Date.now();
      state.inFlight=Promise.resolve().then(()=>original.apply(this,arguments)).finally(()=>{
        state.completed=Date.now();
        state.inFlight=null;
      });
      return state.inFlight;
    };

    hardened.__reliabilityHardening=true;
    hardened.__originalLoadInitialData=original;
    window.loadInitialData=hardened;
    state.installed=true;
  }

  window[KEY]={
    installed:false,
    getState:function(){return {...state,installed:state.installed,inFlight:!!state.inFlight}},
    install
  };

  install();
  window[KEY].installed=state.installed;
})();
