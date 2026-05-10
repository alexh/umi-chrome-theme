# Privacy Policy

**Utility Materials Theme** (theme) and **Utility Materials New Tab** (companion extension), published by Utility Materials Inc.

Last updated: 2026-05-10

## Summary

Neither extension collects, stores, transmits, sells, or monetizes personal information. Neither runs analytics, telemetry, or tracking of any kind. The theme makes no network requests at all.

The new tab extension makes a small number of requests to public APIs to populate the on-screen widgets. Those requests are the only data leaving your device. Details below.

## Utility Materials Theme (theme)

This extension is a pure visual theme. It does not run scripts, make network requests, or read any data from the pages you visit. There is nothing to disclose.

## Utility Materials New Tab (companion)

When a new tab is opened, this extension performs three categories of activity:

### 1. Local-only readouts (no network)

- The current time, date, and timezone are read from your device's clock.
- The browser viewport dimensions, language, and online/offline state are read from the browser.
- CPU model, core count, and per-core utilization are read via `chrome.system.cpu`. Memory total and available are read via `chrome.system.memory`. The GPU model name is read via the standard WebGL `WEBGL_debug_renderer_info` extension.
- The above values are displayed only on the new tab page itself. Nothing is logged, stored, or transmitted.

### 2. IP-based geolocation (third-party services)

To show local weather, the extension needs an approximate location. It sends a single HTTPS GET request per refresh to one of the following free public services:

- `https://ipwho.is/` (primary)
- `https://ipapi.co/json/` (fallback if the primary fails)

Each service returns the city, region, and approximate latitude and longitude inferred from your public IP address. The extension uses only the latitude, longitude, city, and region fields. Your IP address is not stored by the extension. The extension does not send any other identifying information (no account, no cookies, no fingerprint).

If both services are unreachable, the extension falls back to a hardcoded coordinate for your browser's reported timezone (e.g. `America/New_York` → New York City). No network call is made in that fallback case.

The privacy policies of the third-party services govern their handling of your IP address:

- ipwho.is privacy: https://ipwho.is/privacy
- ipapi.co privacy: https://ipapi.co/privacy

### 3. Weather lookup (third-party service)

Once an approximate location is known, the extension sends a single HTTPS GET request to:

- `https://api.open-meteo.com/v1/forecast`

The request includes only the latitude and longitude (rounded by Open-Meteo to ~25 km precision per their docs) and a list of weather variables to return. The extension uses only the temperature, weather code, wind speed, sunrise time, and sunset time from the response. No identifying information (no IP beyond what the network necessarily exposes, no account, no cookies) is sent.

Open-Meteo privacy policy: https://open-meteo.com/en/terms#privacy-policy

### Refresh frequency

Geolocation and weather are fetched once when the new tab page opens and then approximately every fifteen minutes if the same tab remains open. There is no background polling when the new tab page is closed.

### What is NOT collected

- Browsing history, bookmarks, or open tabs
- Page content of any visited site
- Form data, passwords, or autofill information
- Cookies or local storage from non-extension origins
- Microphone, camera, or precise (GPS) location
- Any data sent to servers controlled by Utility Materials Inc. — there are no such servers
- Analytics, crash reports, telemetry, or A/B test signals

### Data sharing

No data is shared with anyone. The extension's only outbound traffic is the requests to ipwho.is, ipapi.co, and api.open-meteo.com listed above. We do not operate any backend that receives data from the extension.

### Storage

The extension does not write to `chrome.storage.local`, `chrome.storage.sync`, IndexedDB, or `localStorage`. Widget positions you set by dragging are intentionally not persisted; reload returns them to defaults.

### Children

The extension is not directed at children and does not knowingly collect any data from anyone, regardless of age.

## Changes

If this policy changes, the updated version will be published at the same URL with an updated "Last updated" date. Material changes to data handling will also be noted in the extension's Chrome Web Store listing changelog.

## Contact

Open an issue at https://github.com/alexh/umi-chrome-theme/issues for any privacy questions or concerns.
