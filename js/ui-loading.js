/* ============================================================
 * NUSANTARA WIFI — NON-BLOCKING ACTION LOADING
 * Loading global dipisahkan dari alur pembayaran.
 * Payment UX ditangani sepenuhnya oleh cancel-payment.js.
 * ============================================================ */
'use strict';

(function(){
  function ensureLoadingUI(){
    if (document.getElementById('syncIndicator')) return;
    const el=document.createElement('div');
    el.id='syncIndicator';
    el.className='sync-indicator hidden';
    el.innerHTML='<span class="sync-spinner"></span><span id="syncText">Memuat data...</span>';
    document.body.appendChild(el);
  }

  function showSync(message){
    ensureLoadingUI();
    const el=document.getElementById('syncIndicator');
    const text=document.getElementById('syncText');
    if(text) text.textContent=message||'Memuat data...';
    el.classList.remove('hidden');
    document.body.classList.add('is-syncing');
  }

  function hideSync(){
    const el=document.getElementById('syncIndicator');
    if(el) el.classList.add('hidden');
    document.body.classList.remove('is-syncing');
  }

  /* Hanya menangani refresh/loading global. Tidak mengintersep apiPost atau paymentForm. */
  window.loadInitialData = async function(){
    ensureLoadingUI();
    setConnection('loading');

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
      APP.pelanggan=Array.isArray(data?.pelanggan)?data.pelanggan:[];
      APP.tagihan=Array.isArray(data?.tagihan)?data.tagihan:[];
      APP.pembayaran=Array.isArray(data?.pembayaran)?data.pembayaran:[];
      APP.auditLog=Array.isArray(data?.auditLog)?data.auditLog:[];
      APP.pengaturan=data?.pengaturan||{};
      renderAll();
      setConnection('ok');
      window.__nusantaraDataLoaded=true;
    }catch(e){
      console.error(e);
      setConnection('bad');
      toast('Gagal memuat data: '+errorMessage(e),true);
    }finally{
      document.getElementById('loadingScreen')?.classList.add('hidden');
      document.getElementById('appShell')?.classList.remove('hidden');
      hideSync();
    }
  };

  window.showSyncLoading=showSync;
  window.hideSyncLoading=hideSync;
})();
