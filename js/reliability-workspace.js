/* ============================================================
 * NUSANTARA WIFI — RELIABILITY WORKSPACE
 * Phase 06: connection & database integrity checks.
 * Read-only from the frontend; no repair/write operation is exposed.
 * ============================================================ */
(function(){
  'use strict';
  const SID='reliabilityWorkspaceStyle';
  const $id=id=>document.getElementById(id);
  const escSafe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function styles(){
    if($id(SID))return;
    const s=document.createElement('style');s.id=SID;s.textContent=`
      .reliability-panel{margin-top:16px;border:1px solid var(--border,#e3eaf1);border-radius:17px;background:var(--surface,#fff);padding:17px}.reliability-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.reliability-title{font-size:15px;font-weight:800}.reliability-sub{font-size:11px;color:var(--muted,#718096);margin-top:3px}.reliability-actions{display:flex;gap:8px;flex-wrap:wrap}.reliability-btn{border:1px solid var(--border,#e3eaf1);background:var(--surface-2,#f8fafc);color:var(--text,#263548);border-radius:10px;padding:8px 11px;font-size:10px;font-weight:800;cursor:pointer}.reliability-btn:disabled{opacity:.55;cursor:wait}.reliability-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.reliability-item{padding:11px 12px;border:1px solid var(--border,#e3eaf1);border-radius:12px;background:var(--surface-2,#f8fafc)}.reliability-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--muted,#718096)}.reliability-value{font-size:13px;font-weight:800;margin-top:5px}.reliability-note{font-size:10px;color:var(--muted,#718096);margin-top:3px;line-height:1.4}.reliability-state{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:800}.reliability-state.ok{background:var(--success-soft,#edf6f1);color:var(--success,#58a98a)}.reliability-state.warn{background:var(--warning-soft,#faf4e9);color:var(--warning,#b58c5a)}.reliability-state.error{background:var(--danger-soft,#faf0f1);color:var(--danger,#a87178)}.reliability-foot{margin-top:11px;font-size:10px;color:var(--muted,#718096);line-height:1.45}.reliability-foot strong{color:var(--primary-strong,#526f90)}
      [data-theme="dark"] .reliability-panel{box-shadow:0 8px 24px rgba(0,0,0,.12)}
      @media(max-width:900px){.reliability-grid{grid-template-columns:1fr 1fr}.reliability-head{flex-direction:column}}@media(max-width:520px){.reliability-grid{grid-template-columns:1fr}.reliability-actions{width:100%}.reliability-btn{flex:1}}
    `;document.head.appendChild(s)
  }
  function ensure(){
    const page=$id('page-dashboard');if(!page||$id('reliabilityWorkspace'))return;
    const anchor=$id('managementDecision')||$id('analyticsWorkspace')||$id('dashboardAnalytics')||page.querySelector('.stats-grid');if(!anchor)return;
    const x=document.createElement('section');x.id='reliabilityWorkspace';x.className='reliability-panel';x.innerHTML='<div class="reliability-head"><div><div class="reliability-title">System reliability</div><div class="reliability-sub">Pemeriksaan read-only untuk koneksi Web App dan integritas dasar database.</div></div><div class="reliability-actions"><button id="reliabilityCheck" class="reliability-btn" type="button">Periksa sistem</button></div></div><div id="reliabilityGrid" class="reliability-grid"><div class="reliability-item"><div class="reliability-label">Status</div><div class="reliability-value"><span class="reliability-state warn">Belum diperiksa</span></div><div class="reliability-note">Jalankan pemeriksaan untuk mendapatkan status terbaru.</div></div><div class="reliability-item"><div class="reliability-label">Data frontend</div><div class="reliability-value">Siap</div><div class="reliability-note">Data yang sedang digunakan halaman ini.</div></div><div class="reliability-item"><div class="reliability-label">Audit database</div><div class="reliability-value">Belum diperiksa</div><div class="reliability-note">Audit tidak mengubah data.</div></div></div><div id="reliabilityFoot" class="reliability-foot"><strong>Safety rule · </strong>pemeriksaan ini hanya membaca status. Tidak ada fungsi repair yang dipanggil dari Web App.</div>';
    anchor.insertAdjacentElement('afterend',x);$id('reliabilityCheck').addEventListener('click',runCheck)
  }
  function setBusy(b){const btn=$id('reliabilityCheck');if(!btn)return;btn.disabled=b;btn.textContent=b?'Memeriksa…':'Periksa sistem'}
  async function runCheck(){
    if(typeof apiGet!=='function')return;
    setBusy(true);const grid=$id('reliabilityGrid'),foot=$id('reliabilityFoot');
    try{
      const [connection,audit]=await Promise.all([apiGet('testConnection'),apiGet('auditDatabase')]);
      const safe=!!audit.safe, state=safe?'ok':'error', label=safe?'SEHAT':'PERLU PERBAIKAN';
      grid.innerHTML=`<div class="reliability-item"><div class="reliability-label">Status sistem</div><div class="reliability-value"><span class="reliability-state ${state}">${label}</span></div><div class="reliability-note">Koneksi backend berhasil diperiksa.</div></div><div class="reliability-item"><div class="reliability-label">Database</div><div class="reliability-value">${escSafe(safe?'Integrity OK':'Integrity issue')}</div><div class="reliability-note">${escSafe(audit.customerCount||0)} pelanggan · ${escSafe(audit.billCount||0)} tagihan · ${escSafe(audit.paymentCount||0)} pembayaran.</div></div><div class="reliability-item"><div class="reliability-label">Audit result</div><div class="reliability-value">${escSafe(audit.collisionCount||0)} collision · ${escSafe(audit.duplicateGroupCount||0)} duplicate</div><div class="reliability-note">${escSafe(connection||'Backend terhubung.')}</div></div>`;
      foot.innerHTML=`<strong>Last check · </strong>${escSafe(new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}))}. ${safe?'Tidak ditemukan collision pelanggan atau duplicate bill group oleh audit backend.':'Audit menemukan masalah; jangan lakukan perubahan massal sebelum ditinjau.'}`;
    }catch(err){
      grid.innerHTML='<div class="reliability-item"><div class="reliability-label">Status sistem</div><div class="reliability-value"><span class="reliability-state error">ERROR</span></div><div class="reliability-note">Pemeriksaan backend gagal dijalankan.</div></div><div class="reliability-item"><div class="reliability-label">Frontend</div><div class="reliability-value">Tetap aktif</div><div class="reliability-note">Kegagalan health check tidak menghapus data yang sudah dimuat.</div></div><div class="reliability-item"><div class="reliability-label">Pesan</div><div class="reliability-value">Tidak tersedia</div><div class="reliability-note">Periksa koneksi Web App atau lakukan refresh.</div></div>`;
      foot.innerHTML=`<strong>Health check gagal · </strong>${escSafe(err?.message||'Request backend gagal.')}`;
    }finally{setBusy(false)}
  }
  function init(){styles();ensure()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const old=window.renderAll;if(old)window.renderAll=function(){old();setTimeout(()=>{styles();ensure()},0)};
})();
