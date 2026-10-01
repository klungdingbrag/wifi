# Architecture

frontend/ adalah single-page Vanilla JS application.
backend/ adalah source Google Apps Script dan tetap menjadi backend production.

Data ownership:
- WiFi billing/customer → Google Sheets WiFi.
- People/Absensi → backend dan database terpisah.

Prinsip: preserve production, separate backends, clear service boundaries.