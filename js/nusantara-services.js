/* ============================================================
 * NUSANTARA BUSINESS — UNIFIED SERVICE LAYER
 * Phase 05: stable frontend contracts for independent backends.
 *
 * Design goals:
 * - One service contract, multiple backend implementations.
 * - Request lifecycle + response normalization in one place.
 * - Explicit module boundaries; no cross-module database access.
 * - Read-only by default for modules that are not yet migrated.
 * - Backward compatible: existing app functions remain untouched.
 * ============================================================ */
(function(){
  'use strict';

  const ROOT = window.Nusantara = window.Nusantara || {};
  const services = ROOT.services = ROOT.services || {};
  const registry = ROOT.serviceRegistry = ROOT.serviceRegistry || {};

  if (registry.__unifiedServiceLayerInstalled) return;

  const state = {
    installed: true,
    version: '1.3.1',
    requests: 0,
    successes: 0,
    failures: 0,
    lastRequestAt: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
    lastError: ''
  };

  function now(){ return Date.now(); }

  function toError(error, fallback){
    if (error instanceof Error) return error;
    if (error && typeof error.message === 'string') return new Error(error.message);
    return new Error(fallback || 'Request service gagal.');
  }

  function normalize(result){
    if (result && typeof result === 'object' && result.success === false) {
      throw new Error(result.message || 'Service mengembalikan kegagalan.');
    }
    return result;
  }

  async function execute(moduleName, operation, requestFn, options={}){
    if (typeof requestFn !== 'function') throw new Error('Service operation tidak tersedia.');
    state.requests++;
    state.lastRequestAt = now();

    const started = state.lastRequestAt;
    try {
      const raw = await requestFn();
      const data = normalize(raw);
      state.successes++;
      state.lastSuccessAt = now();
      state.lastError = '';
      return {
        success: true,
        module: moduleName,
        operation,
        data,
        requestedAt: started,
        completedAt: state.lastSuccessAt,
        cached: !!options.cached
      };
    } catch (error) {
      const err = toError(error, 'Request service gagal.');
      state.failures++;
      state.lastFailureAt = now();
      state.lastError = err.message;
      err.service = moduleName;
      err.operation = operation;
      throw err;
    }
  }

  function defineModule(name, adapter){
    if (!name || !adapter || typeof adapter!=='object') throw new Error('Service module tidak valid.');
    if (services[name]) return services[name];

    const exposed = {};
    Object.keys(adapter).forEach(operation=>{
      if (typeof adapter[operation] !== 'function') return;
      exposed[operation] = function(){
        const args = arguments;
        return execute(name, operation, ()=>adapter[operation].apply(adapter, args));
      };
    });

    services[name] = Object.freeze(exposed);
    return services[name];
  }

  function snapshot(){
    return {
      installed: state.installed,
      version: state.version,
      requests: state.requests,
      successes: state.successes,
      failures: state.failures,
      lastRequestAt: state.lastRequestAt,
      lastSuccessAt: state.lastSuccessAt,
      lastFailureAt: state.lastFailureAt,
      lastError: state.lastError,
      modules: Object.keys(services)
    };
  }

  /* Capture the production transport before service adapters are exposed. */
  const legacyApiPost = window.apiPost;

  /* WiFi adapter: wraps the existing production API functions.
   * No endpoint or payload is changed here. */
  defineModule('wifi', {
    getInitialData: function(){
      if (typeof window.apiGet !== 'function') throw new Error('WiFi API belum tersedia.');
      return window.apiGet('getInitialData');
    },
    testConnection: function(){
      if (typeof window.apiGet !== 'function') throw new Error('WiFi API belum tersedia.');
      return window.apiGet('testConnection');
    },
    auditDatabase: function(){
      if (typeof window.apiGet !== 'function') throw new Error('WiFi API belum tersedia.');
      return window.apiGet('auditDatabase');
    },
    get: function(action, params){
      if (typeof window.apiGet !== 'function') throw new Error('WiFi API belum tersedia.');
      return window.apiGet(action, params || {});
    },
    createCustomer: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('addCustomer', payload || {});
    },
    updateCustomer: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('updateCustomer', payload || {});
    },
    deleteCustomer: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('deleteCustomer', payload || {});
    },
    generateBills: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('generateMonthlyBills', payload || {});
    },
    payBill: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('payBill', payload || {});
    },
    cancelPayment: function(payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost('cancelPayment', payload || {});
    },
    post: function(action, payload){
      if (typeof legacyApiPost !== 'function') throw new Error('WiFi API belum tersedia.');
      return legacyApiPost(action, payload || {});
    }
  });

  /* IMPORTANT: do not replace window.apiPost yet.
   * Existing customer UI code still owns the production transport.
   * The service adapter remains available for the next migration step,
   * while the live customer path stays untouched. */

  services.absensi = Object.freeze({
    status: function(){
      return Promise.resolve({
        success: true,
        module: 'absensi',
        operation: 'status',
        data: {available: false, reason: 'Modul Absensi belum diaktifkan.'}
      });
    }
  });

  registry.__unifiedServiceLayerInstalled = true;
  registry.version = state.version;
  registry.defineModule = defineModule;
  registry.execute = execute;
  registry.snapshot = snapshot;
  registry.state = state;
})();
