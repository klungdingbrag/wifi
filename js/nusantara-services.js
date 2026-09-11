/* ============================================================
 * NUSANTARA BUSINESS — UNIFIED SERVICE LAYER
 * Stable frontend contracts for independent backends.
 * ============================================================ */
(function(){
'use strict';
const ROOT=window.Nusantara=window.Nusantara||{},services=ROOT.services=ROOT.services||{},registry=ROOT.serviceRegistry=ROOT.serviceRegistry||{};
if(registry.__unifiedServiceLayerInstalled)return;
const state={installed:true,version:'1.5.1',requests:0,successes:0,failures:0,lastRequestAt:0,lastSuccessAt:0,lastFailureAt:0,lastError:''};
function now(){return Date.now()}
function toError(error,fallback){if(error instanceof Error)return error;if(error&&typeof error.message==='string')return new Error(error.message);return new Error(fallback||'Request service gagal.')}
function normalize(result){if(result&&typeof result==='object'&&result.success===false)throw new Error(result.message||'Service mengembalikan kegagalan.');return result}
async function execute(moduleName,operation,requestFn,options={}){if(typeof requestFn!=='function')throw new Error('Service operation tidak tersedia.');state.requests++;state.lastRequestAt=now();const started=state.lastRequestAt;try{const data=normalize(await requestFn());state.successes++;state.lastSuccessAt=now();state.lastError='';return{success:true,module:moduleName,operation,data,requestedAt:started,completedAt:state.lastSuccessAt,cached:!!options.cached}}catch(error){const err=toError(error,'Request service gagal.');state.failures++;state.lastFailureAt=now();state.lastError=err.message;err.service=moduleName;err.operation=operation;throw err}}
function defineModule(name,adapter){if(!name||!adapter||typeof adapter!=='object')throw new Error('Service module tidak valid.');if(services[name])return services[name];const exposed={};Object.keys(adapter).forEach(operation=>{if(typeof adapter[operation]!=='function')return;exposed[operation]=function(){const args=arguments;return execute(name,operation,()=>adapter[operation].apply(adapter,args))}});services[name]=Object.freeze(exposed);return services[name]}
function snapshot(){return{installed:state.installed,version:state.version,requests:state.requests,successes:state.successes,failures:state.failures,lastRequestAt:state.lastRequestAt,lastSuccessAt:state.lastSuccessAt,lastFailureAt:state.lastFailureAt,lastError:state.lastError,modules:Object.keys(services)}}
const legacyApiPost=window.apiPost;
defineModule('wifi',{getInitialData:function(){if(typeof window.apiGet!=='function')throw new Error('WiFi API belum tersedia.');return window.apiGet('getInitialData')},testConnection:function(){if(typeof window.apiGet!=='function')throw new Error('WiFi API belum tersedia.');return window.apiGet('testConnection')},auditDatabase:function(){if(typeof window.apiGet!=='function')throw new Error('WiFi API belum tersedia.');return window.apiGet('auditDatabase')},get:function(action,params){if(typeof window.apiGet!=='function')throw new Error('WiFi API belum tersedia.');return window.apiGet(action,params||{})},createCustomer:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('addCustomer',payload||{})},updateCustomer:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('updateCustomer',payload||{})},deleteCustomer:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('deleteCustomer',payload||{})},generateBills:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('generateMonthlyBills',payload||{})},payBill:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('payBill',payload||{})},cancelPayment:function(payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost('cancelPayment',payload||{})},post:function(action,payload){if(typeof legacyApiPost!=='function')throw new Error('WiFi API belum tersedia.');return legacyApiPost(action,payload||{})}});
const ABSENSI_URL='https://script.google.com/macros/s/AKfycbwjpeYThkyGewyR8PAY8SxkGPM32-zWkAVniJfzPcLk2yrztpjQPPCECJF3ApKck41_kg/exec';
function absensiUrl(weekStart){return ABSENSI_URL+'?action=get&weekStart='+encodeURIComponent(weekStart)}
async function absensiGet(weekStart){
 if(!weekStart)throw new Error('Periode Absensi wajib ditentukan.');
 let response;
 try{response=await fetch(absensiUrl(weekStart),{method:'GET',cache:'no-store',redirect:'follow'});}catch(error){throw new Error('Koneksi Absensi gagal (Failed to fetch). Endpoint: '+absensiUrl(weekStart)+' Detail: '+(error?.message||error));}
 if(!response.ok)throw new Error('Absensi HTTP '+response.status+'.');
 let result;try{result=await response.json()}catch(error){throw new Error('Respons Absensi bukan JSON. '+(error?.message||''))}
 if(!result||result.success!==true)throw new Error(result?.message||'Respons backend Absensi tidak valid.');
 if(result.weekStart&&result.weekStart!==weekStart)throw new Error('Backend Absensi mengembalikan periode berbeda.');
 if(!Array.isArray(result.data))throw new Error('Format data Absensi tidak valid.');
 return result;
}
async function absensiSave(payload){
 if(!payload||!payload.weekStart||!Array.isArray(payload.data)||!payload.data.length)throw new Error('Data Absensi tidak valid atau kosong.');
 try{await fetch(ABSENSI_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',weekStart:payload.weekStart,weekEnd:payload.weekEnd,data:payload.data})});}catch(error){throw new Error('Koneksi penyimpanan Absensi gagal (Failed to fetch). Detail: '+(error?.message||error));}
 return absensiGet(payload.weekStart);
}
defineModule('absensi',{status:function(){return Promise.resolve({success:true,module:'absensi',operation:'status',data:{available:true,mode:'production-separate-backend'}})},getWeekly:function(weekStart){return absensiGet(weekStart)},saveWeekly:function(payload){return absensiSave(payload)}});
registry.__unifiedServiceLayerInstalled=true;registry.version=state.version;registry.defineModule=defineModule;registry.execute=execute;registry.snapshot=snapshot;registry.state=state;
})();