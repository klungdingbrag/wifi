/* ============================================================
 * NUSANTARA WIFI — RESILIENCE LAYER
 * Phase 06: frontend safety around refresh, backend failure,
 * and stale/invalid initial data.
 * Read-only; never changes billing/customer records.
 * ============================================================ */
(function(){
  'use strict';
  const ID='resilienceLayer';
  const state={loading:false,failed:false,lastSuccess:0};
  const $id=id=>document.getElementById(id);
  const escSafe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function styles(){
    if($id(ID+'Style'))return;
    const s=document.createElement('style');s.id=ID+'Style';s.textContent=`
      .resilience-status{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 11px;border:1px solid var(--border,#e3eaf1);border-radius:10px;background:var(--surface-2,#f8fafc);font-size:10px;color:var(--muted,#718096)}
      .resilience-dot{width:7px;height:7px;border-radius:50%;background:var(--success,#58a98a);flex:0 0 auto}.resilience-status.warn .resilience-dot{background:var(--warning,#b98b4f)}.resilience-status.error .resilience-dot{background:var(--danger,#a87178)}
      .resilience-retry{margin-left:auto;border:0;background:transparent;color:var(--primary,#587da5);font-size:10px;font-weight:800;cursor:pointer}.resilience-retry:disabled{opacity:.5;cursor:wait}
      .resilience-error{display:none;margin:0 0 12px;padding:11px 12px;border:1px solid var(--danger,#a87178);border-radius:11px;background:var(--danger-soft,#faf0f1);color:var(--danger,#a87178);font-size:10px;line-height:1.45}
      [data-theme="dark"] .resilience-status{box-shadow:0 6px 18px rgba(0,0,0,.1)}
    `;document.head.appendChild(s)
  }
  function ensure(){
    const page=document.body;if(!page||$id(ID))return;
    const el=document.createElement('div');el.id=ID;el.innerHTML='<div id="resilienceStatus" class="resilience-status"><span class="resilience-dot"></span><span id="resilienceText">Sistem siap.</span><button id="resilienceRetry" class="resilience-retry" type="button">Refresh data</button></div><div id="resilienceError" class="resilience-error"></div>';
    const main=document.querySelector('.main-content')||document.querySelector('main')||document.body;main.insertBefore(el,main.firstChild);$id('resilienceRetry').addEventListener('click',retry)
  }
  function status(kind,text){const box=$id('resilienceStatus'),label=$id('resilienceText');if(!box||!label)return;box.className='resilience-status '+(kind||'');label.textContent=text}
  function showError(message){const x=$id('resilienceError');if(!x)return;x.style.display='block';x.innerHTML='<strong>Data belum diperbarui.</strong> '+escSafe(message||'Backend tidak dapat dihubungi. Data yang tampil jangan dianggap sebagai hasil refresh terbaru.')}
  function hideError(){const x=$id('resilienceError');if(x){x.style.display='none';x.textContent=''}}
  async function retry(){
    if(state.loading||typeof window.loadInitialData!=='function')return;
    state.loading=true;const btn=$id('resilienceRetry');if(btn){btn.disabled=true;btn.textContent='Memuat…'};status('warn','Memuat data terbaru…');hideError();
    try{await window.loadInitialData();state.failed=false;state.lastSuccess=Date.now();status('','Data terbaru berhasil dimuat.');}
    catch(err){state.failed=true;status('error','Refresh gagal.');showError(err?.message||'Request backend gagal.');}
    finally{state.loading=false;if(btn){btn.disabled=false;btn.textContent='Refresh data'}}
  }
  function validateData(){
    const required=['pelanggan','tagihan','pembayaran','auditLog','pengaturan'];
    const missing=required.filter(k=>!Array.isArray(APP[k])&&typeof APP[k]!=='object');
    if(missing.length){state.failed=true;status('error','Struktur data tidak lengkap.');showError('Field data berikut tidak tersedia: '+missing.join(', '));return false}
    return true
  }
  function init(){styles();ensure();setTimeout(()=>{if(validateData()){state.lastSuccess=Date.now();status('','Data frontend siap digunakan.')}},0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.NusantaraResilience={retry,validateData,getState:()=>({...state})};
})();
