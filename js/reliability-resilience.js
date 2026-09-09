/* ============================================================
 * NUSANTARA WIFI — RESILIENCE LAYER
 * Phase 06: frontend safety around refresh, backend failure,
 * stale/invalid data, and module render isolation.
 * Read-only; never changes billing/customer records.
 * ============================================================ */
(function(){
  'use strict';
  const ID='resilienceLayer';
  const state={loading:false,failed:false,lastSuccess:0,lastAttempt:0,renderErrors:[]};
  const $id=id=>document.getElementById(id);
  const escSafe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function styles(){
    if($id(ID+'Style'))return;
    const s=document.createElement('style');s.id=ID+'Style';s.textContent=`
      .resilience-status{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 11px;border:1px solid var(--border,#e3eaf1);border-radius:10px;background:var(--surface-2,#f8fafc);font-size:10px;color:var(--muted,#718096)}
      .resilience-dot{width:7px;height:7px;border-radius:50%;background:var(--success,#58a98a);flex:0 0 auto}.resilience-status.warn .resilience-dot{background:var(--warning,#b98b4f)}.resilience-status.error .resilience-dot{background:var(--danger,#a87178)}
      .resilience-retry{margin-left:auto;border:0;background:transparent;color:var(--primary,#587da5);font-size:10px;font-weight:800;cursor:pointer}.resilience-retry:disabled{opacity:.5;cursor:wait}
      .resilience-error{display:none;margin:0 0 12px;padding:11px 12px;border:1px solid var(--danger,#a87178);border-radius:11px;background:var(--danger-soft,#faf0f1);color:var(--danger,#a87178);font-size:10px;line-height:1.45}
      .resilience-render-warn{display:none;margin:0 0 12px;padding:9px 11px;border:1px solid var(--warning,#b98b4f);border-radius:10px;background:var(--warning-soft,#faf4e9);color:var(--warning,#b98b4f);font-size:10px}
      [data-theme="dark"] .resilience-status{box-shadow:0 6px 18px rgba(0,0,0,.1)}
    `;document.head.appendChild(s)
  }

  function ensure(){
    if(!document.body||$id(ID))return;
    const el=document.createElement('div');el.id=ID;el.innerHTML='<div id="resilienceStatus" class="resilience-status"><span class="resilience-dot"></span><span id="resilienceText">Sistem siap.</span><button id="resilienceRetry" class="resilience-retry" type="button">Refresh data</button></div><div id="resilienceError" class="resilience-error"></div><div id="resilienceRenderWarn" class="resilience-render-warn"></div>';
    const main=document.querySelector('.main-content')||document.querySelector('main')||document.body;main.insertBefore(el,main.firstChild);$id('resilienceRetry').addEventListener('click',retry)
  }
  function status(kind,text){const box=$id('resilienceStatus'),label=$id('resilienceText');if(!box||!label)return;box.className='resilience-status '+(kind||'');label.textContent=text}
  function showError(message){const x=$id('resilienceError');if(!x)return;x.style.display='block';x.innerHTML='<strong>Data belum diperbarui.</strong> '+escSafe(message||'Backend tidak dapat dihubungi. Data yang tampil jangan dianggap sebagai hasil refresh terbaru.')}
  function hideError(){const x=$id('resilienceError');if(x){x.style.display='none';x.textContent=''}}
  function renderWarning(){const x=$id('resilienceRenderWarn');if(!x)return;if(!state.renderErrors.length){x.style.display='none';x.textContent='';return}x.style.display='block';x.textContent='Sebagian tampilan gagal diperbarui: '+state.renderErrors.join(', ')+'. Data lain tetap diproses.'}

  function snapshot(){return {pelanggan:Array.isArray(APP?.pelanggan)?APP.pelanggan.slice():null,tagihan:Array.isArray(APP?.tagihan)?APP.tagihan.slice():null,pembayaran:Array.isArray(APP?.pembayaran)?APP.pembayaran.slice():null,auditLog:Array.isArray(APP?.auditLog)?APP.auditLog.slice():null,pengaturan:APP?.pengaturan&&typeof APP.pengaturan==='object'&&!Array.isArray(APP.pengaturan)?{...APP.pengaturan}:null}}
  function restore(s){if(!s)return;['pelanggan','tagihan','pembayaran','auditLog'].forEach(k=>{if(Array.isArray(s[k]))APP[k]=s[k]});if(s.pengaturan)APP.pengaturan=s.pengaturan;try{if(typeof renderAll==='function')renderAll()}catch(e){console.warn('Resilience render restore failed',e)}}

  function validateData(){
    const arrays=['pelanggan','tagihan','pembayaran','auditLog'];
    const missing=arrays.filter(k=>!Array.isArray(APP?.[k]));
    const settingsInvalid=!APP?.pengaturan||typeof APP.pengaturan!=='object'||Array.isArray(APP.pengaturan);
    if(settingsInvalid)missing.push('pengaturan');
    if(missing.length){state.failed=true;status('error','Struktur data tidak lengkap.');showError('Field data berikut tidak tersedia atau tidak valid: '+missing.join(', '));return false}
    return true
  }

  function installRenderIsolation(){
    const names=['renderDashboard','renderBills','renderCustomers','renderPayments','renderAudit'];
    names.forEach(name=>{
      const fn=window[name];
      if(typeof fn!=='function'||fn.__resilienceIsolated)return;
      const wrapped=function(){
        try{return fn.apply(this,arguments)}catch(err){
          if(!state.renderErrors.includes(name))state.renderErrors.push(name);
          console.warn('Resilience isolated render error:',name,err);
          renderWarning();
          return undefined;
        }
      };
      wrapped.__resilienceIsolated=true;
      wrapped.__originalRender=fn;
      window[name]=wrapped;
    });
  }

  function installLoadGuard(){
    const original=window.loadInitialData;
    if(typeof original!=='function'||original.__resilienceGuard)return;
    const guarded=async function(){
      const before=snapshot();
      state.loading=true;state.lastAttempt=Date.now();
      try{
        const result=await original.apply(this,arguments);
        const success=result?.success===true||Number(window.__nusantaraLastSuccessfulSync||0)>=state.lastAttempt;
        if(!success){
          if(before?.pelanggan&&before?.tagihan&&before?.pembayaran&&before?.auditLog)restore(before);
          state.failed=true;status('error','Data masih stale.');showError(window.__nusantaraLastSyncError||'Refresh backend gagal. Data sebelumnya dipertahankan.');
          return result;
        }
        if(!validateData()){
          if(before?.pelanggan&&before?.tagihan&&before?.pembayaran&&before?.auditLog)restore(before);
          throw new Error('Respons refresh tidak memiliki struktur data yang valid. Data sebelumnya dipertahankan.');
        }
        state.failed=false;state.lastSuccess=Number(window.__nusantaraLastSuccessfulSync)||Date.now();hideError();status('','Data terbaru · '+new Date(state.lastSuccess).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}));
        return result;
      }catch(err){
        if(before?.pelanggan&&before?.tagihan&&before?.pembayaran&&before?.auditLog)restore(before);
        state.failed=true;status('error','Refresh gagal.');showError(err?.message||'Refresh gagal. Data sebelumnya dipertahankan bila tersedia.');
        throw err;
      }finally{state.loading=false}
    };
    guarded.__resilienceGuard=true;guarded.__originalLoadInitialData=original;window.loadInitialData=guarded;
  }

  async function retry(){
    if(state.loading||typeof window.loadInitialData!=='function')return;
    const btn=$id('resilienceRetry');if(btn){btn.disabled=true;btn.textContent='Memuat…'};
    status('warn','Memuat data terbaru…');hideError();state.renderErrors=[];renderWarning();
    try{await window.loadInitialData();}
    finally{if(btn){btn.disabled=false;btn.textContent='Refresh data'}}
  }

  function updateFromGlobals(){
    const success=Number(window.__nusantaraLastSuccessfulSync||0),attempt=Number(window.__nusantaraLastSyncAttempt||0),err=window.__nusantaraLastSyncError||'';
    state.lastSuccess=success;state.lastAttempt=attempt;
    if(success){state.failed=false;hideError();status('', 'Data terbaru · '+new Date(success).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}));}
    else if(err){state.failed=true;status('error','Data masih stale.');showError(err);}
    else if(attempt){status('warn','Belum ada refresh berhasil.');}
  }

  function init(){styles();ensure();installRenderIsolation();installLoadGuard();updateFromGlobals();setTimeout(()=>{if(validateData()&&!state.failed&&!state.lastSuccess){status('','Data frontend siap digunakan')}renderWarning()},0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.NusantaraResilience={retry,validateData,getState:()=>({...state,renderErrors:state.renderErrors.slice()})};
})();
