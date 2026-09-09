# NUSANTARA BUSINESS — Unified Service Layer

## Purpose

Phase 05 introduces a frontend service boundary so Nusantara Business can work with independent backends without allowing modules to access each other's database directly.

## Contract

```text
window.Nusantara.services.wifi.*
window.Nusantara.services.absensi.*
```

Every service operation is responsible for:

1. validating that an operation exists,
2. executing the backend request,
3. normalizing successful results into a common envelope,
4. converting failures into `Error` objects with module/operation context,
5. recording lightweight request observability.

## Current adapters

### WiFi

The WiFi adapter wraps the existing production `apiGet()` and `apiPost()` functions. It does not change the endpoint, payload, or backend contract.

Available transitional operations:

```text
Nusantara.services.wifi.getInitialData()
Nusantara.services.wifi.get(action, params)
Nusantara.services.wifi.post(action, payload)
```

Existing application code can continue to use the legacy functions while migration happens incrementally.

### Absensi

The Absensi service boundary exists but remains intentionally inactive until the Absensi integration phase is explicitly enabled. The service reports `available: false` instead of guessing an endpoint or writing to the Absensi backend.

## Response envelope

A successful service request resolves to:

```text
{
  success: true,
  module: "wifi",
  operation: "getInitialData",
  data: <backend data>,
  requestedAt: <timestamp>,
  completedAt: <timestamp>,
  cached: false
}
```

Failures reject with an `Error` carrying `service` and `operation` properties.

## Migration rule

The service layer is an adapter, not a second database and not a replacement backend. Existing production functions remain the source of truth during Phase 05.

Do not migrate payment, customer, billing, or database write paths in bulk. Move one operation at a time only after the service contract has been verified against production behavior.

## Ownership

```text
Nusantara Business UI
        |
        +---- services.wifi ----> Apps Script WiFi ----> WiFi Sheets
        |
        +---- services.absensi -> Apps Script Absensi -> Absensi Sheets
```

The two backends remain independent.
