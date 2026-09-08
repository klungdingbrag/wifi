/* ============================================================
 * NUSANTARA WIFI — NON-BLOCKING ACTION LOADING
 * Menjaga dashboard tetap terlihat saat refresh / sinkronisasi.
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

  function paymentButton(){
    return document.getElementById('paymentSaveBtn');
  }

  function setPaymentSaving(){
    const btn=paymentButton();
    if(!btn) return;
    if(!btn.dataset.originalText) btn.dataset.originalText=btn.textContent.trim()||'Simpan Pembayaran';
    btn.disabled=true;
    btn.classList.remove('is-success');
    btn.classList.add('is-saving');
    btn.setAttribute('aria-busy','true');
    btn.innerHTML='<span class="payment-spinner" aria-hidden="true"></span><span>Menyimpan...</span>';
  }

  function resetPaymentButton(){
    const btn=paymentButton();
    if(!btn) return;
    btn.disabled=false;
    btn.classList.remove('is-saving','is-success');
    btn.removeAttribute('aria-busy');
    btn.textContent=btn.dataset.originalText||'Simpan Pembayaran';
  }

  function paymentSavedFeedback(){
    const btn=paymentButton();
    if(!btn) return;
    btn.classList.remove('is-saving');
    btn.classList.add('is-success');
    btn.disabled=true;
    btn.removeAttribute('aria-busy');
    btn.innerHTML='<span class="payment-check" aria-hidden="true">✓</span><span>Tersimpan</span>';
    setTimeout(resetPaymentButton,700);
  }

  // Capture-phase membuat feedback muncul seketika, sebelum handler pembayaran utama berjalan.
  document.addEventListener('submit',function(event){
    if(event.target && event.target.id==='paymentForm') setPaymentSaving();
  },true);

  // Bila apiPost tersedia, beri state sukses/gagal tanpa mengubah kontrak API utama.
  const originalApiPost=window.apiPost;
  if(typeof originalApiPost==='function'){
    window.apiPost=async function(action,payload){
      if(action==='payBill'){
        setPaymentSaving();
        try{
          const result=await originalApiPost.apply(this,arguments);
          if(result && result.success!==false) paymentSavedFeedback();
          else resetPaymentButton();
          return result;
        }catch(error){
          resetPaymentButton();
          throw error;
        }
      }
      return originalApiPost.apply(this,arguments);
    };
  }

  // Fallback: jika backend gagal/handler lama tidak memakai window.apiPost, jangan biarkan tombol terkunci selamanya.
  document.addEventListener('click',function(event){
    const btn=event.target.closest?.('#paymentSaveBtn');
    if(!btn) return;
    setPaymentSaving();
    window.setTimeout(function(){
      const current=paymentButton();
      if(current && current.classList.contains('is-saving')) resetPaymentButton();
    },15000);
  },true);

  // Override hanya mekanisme loading; proses data/API tetap memakai backend V6.3.
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
