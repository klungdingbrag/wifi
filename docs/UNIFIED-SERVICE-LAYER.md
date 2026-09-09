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

Read operations currently exposed:

```text
Nusantara.services.wifi.getInitialData()
Nusantara.services.wifi.testConnection()
Nusantara.services.wifi.auditDatabase()
Nusantara.services.wifi.get(action, params)
```

Semantic write operations are now defined as transitional adapter contracts:

```text
Nusantara.services.wifi.createCustomer(payload)
Nusantara.services.wifi.updateCustomer(payload)
Nusantara.services.wifi.deleteCustomer(payload)
Nusantara.services.wifi.generateBills(payload)
Nusantara.services.wifi.payBill(payload)
Nusantara.services.wifi.cancelPayment(payload)
```

These semantic write methods currently wrap the existing production `apiPost()` calls but are **not yet used to migrate the UI write paths**. This separation lets the contract be reviewed before changing production behavior.

The generic transitional methods remain available during migration:

```text
Nusantara.services.wifi.get(action, params)
Nusantara.services.wifi.post(action, payload)
```

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

Move one operation at a time. Read operations are migrated first; write operations require an explicit contract review and regression test before their consumers are changed. Do not migrate payment, customer, billing, or database write paths in bulk.

## Ownership

```text
Nusantara Business UI
        |
        +---- services.wifi ----> Apps Script WiFi ----> WiFi Sheets
        |
        +---- services.absensi -> Apps Script Absensi -> Absensi Sheets
```

The two backends remain independent.
