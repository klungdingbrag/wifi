/* ============================================================
 * NUSANTARA WIFI — NON-BLOCKING ACTION LOADING
 * Global refresh/loading + visual feedback untuk tombol.
 * Payment UX tetap ditangani sepenuhnya oleh cancel-payment.js.
 * ============================================================ */
'use strict';

(function(){
  const ACTION_STYLE_ID='button-action-loading-style';

  function ensureLoadingUI(){
    if(document.getElementById('syncIndicator')) return;
    const el=document.createElement('div');
    el.id='syncIndicator';
    el.className='sync-indicator hidden';
    el.innerHTML='<span class="sync-spinner"></span><span id="syncText">Memuat data...</span>';
    document.body.appendChild(el);
  }

  function ensureButtonStyle(){
    if(document.getElementById(ACTION_STYLE_ID))return;
    const s=document.createElement('style');
    s.id=ACTION_STYLE_ID;
    s.textContent=`
      button.is-action-loading{position:relative;pointer-events:none;cursor:wait}
      button.is-action-loading .action-spinner{width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;vertical-align:-2px;margin-right:7px;animation:nusantaraBtnSpin .65s linear infinite}
      button.is-action-loading .action-label{opacity:.72}
      @keyframes nusantaraBtnSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(s);
  }

  function showSync(message){
    ensureLoadingUI();
    const el=document.getElementById('syncIndicator');
    const text=document.getElementById('syncText');
    if(text)text.textContent=message||'Memuat data...';
    el.classList.remove('hidden');
    document.body.classList.add('is-syncing');
  }

  function hideSync(){
    const el=document.getElementById('syncIndicator');
    if(el)el.classList.add('hidden');
    document.body.classList.remove('is-syncing');
  }

  function startButtonLoading(btn){
    if(!btn||btn.dataset.paymentProcessing==='1'||btn.dataset.actionLoading==='1')return;
    ensureButtonStyle();
    btn.dataset.actionLoading='1';
    btn.dataset.actionOriginal=btn.innerHTML;
    btn.classList.add('is-action-loading');
    btn.setAttribute('aria-busy','true');
    btn.setAttribute('data-action-loading','1');
    btn.innerHTML='<span class="action-spinner" aria-hidden="true"></span><span class="action-label">'+(btn.dataset.loadingText||'Memproses...')+'</span>';

    const wasDisabled=btn.disabled;
    let done=false;
    const restore=()=>{
      if(done)return;
      done=true;
      if(btn.dataset.actionLoading!=='1')return;
      btn.innerHTML=btn.dataset.actionOriginal||btn.innerHTML;
      delete btn.dataset.actionOriginal;
      delete btn.dataset.actionLoading;
      btn.classList.remove('is-action-loading');
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('data-action-loading');
      if(!wasDisabled && btn.dataset.restoreDisabled==='1'){
        btn.disabled=false;
        delete btn.dataset.restoreDisabled;
      }
    };

    const observer=new MutationObserver(()=>{
      if(!btn.disabled){
        observer.disconnect();
        restore();
      }
    });
    observer.observe(btn,{attributes:true,attributeFilter:['disabled']});

    if(document.body.classList.contains('is-syncing')){
      const started=Date.now();
      const poll=()=>{
        if(done)return;
        if(!document.body.classList.contains('is-syncing')||Date.now()-started>15000){observer.disconnect();restore();return;}
        setTimeout(poll,100);
      };
      setTimeout(poll,100);
    }else{
      setTimeout(()=>{observer.disconnect();restore()},700);
    }
  }

  function bindButtonLoading(){
    document.addEventListener('click',function(event){
      const btn=event.target.closest('button');
      if(!btn||btn.disabled)return;
      if(btn.dataset.noLoading==='1')return;
      if(btn.dataset.paymentProcessing==='1')return;
      startButtonLoading(btn);
    },false);
  }

  function validateRefreshPayload(data){
    const requiredArrays=['pelanggan','tagihan','pembayaran','auditLog'];
    const missing=requiredArrays.filter(k=>!Array.isArray(data?.[k]));
    const settingsInvalid=!data?.pengaturan||typeof data.pengaturan!=='object'||Array.isArray(data.pengaturan);
    if(settingsInvalid)missing.push('pengaturan');
    if(missing.length)throw new Error('Respons refresh tidak lengkap: '+missing.join(', ')+'. Data sebelumnya dipertahankan.');
  }

  window.loadInitialData=async function(){
    ensureLoadingUI();
    setConnection('loading');
    window.__nusantaraLastSyncAttempt=Date.now();
    window.__nusantaraLastSyncError='';

    const firstLoad=!window.__nusantaraDataLoaded;
    if(firstLoad){
      document.getElementById('loadingScreen')?.classList.remove('hidden');
      document.getElementById('appShell')?.classList.add('hidden');
    }else{
      document.getElementById('appShell')?.classList.remove('hidden');
      showSync('Menyegarkan data...');
    }

    try{
      const data=await apiGet('getInitialData');
      validateRefreshPayload(data);
      APP.pelanggan=data.pelanggan;
      APP.tagihan=data.tagihan;
      APP.pembayaran=data.pembayaran;
      APP.auditLog=data.auditLog;
      APP.pengaturan=data.pengaturan;
      renderAll();
      setConnection('ok');
      window.__nusantaraDataLoaded=true;
      window.__nusantaraLastSuccessfulSync=Date.now();
      window.__nusantaraLastSyncError='';
      return {success:true,refreshedAt:window.__nusantaraLastSuccessfulSync};
    }catch(e){
      console.error(e);
      window.__nusantaraLastSyncError=errorMessage(e);
      setConnection('bad');
      toast('Gagal memuat data: '+window.__nusantaraLastSyncError,true);
      return {success:false,error:window.__nusantaraLastSyncError};
    }finally{
      document.getElementById('loadingScreen')?.classList.add('hidden');
      document.getElementById('appShell')?.classList.remove('hidden');
      hideSync();
    }
  };

  window.showSyncLoading=showSync;
  window.hideSyncLoading=hideSync;
  window.startButtonLoading=startButtonLoading;

  ensureButtonStyle();
  bindButtonLoading();
})();
