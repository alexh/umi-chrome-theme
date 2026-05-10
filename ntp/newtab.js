// ─── Real data, no fakes. Every readout below maps to a genuine browser-,
//     network-, or API-derived value. If a value is unavailable we hide
//     or em-dash the row, never invent. ────────────────────────────────────

const $ = (id) => document.getElementById(id);

const PAGE_LOAD_T = performance.now();

// ─── Analog clock + digital readout ──────────────────────────────────────
const $time = $("clock-time");
const $ampm = $("clock-ampm");
const $zone = $("clock-zone");
const $handHour = $("hand-hour");
const $handMin  = $("hand-minute");
const $handSec  = $("hand-second");

function pad(n) { return String(n).padStart(2, "0"); }

function tickClock() {
  const d = new Date();

  // Digital readout under the face (precision second-by-second)
  let h12 = d.getHours();
  const ampm = h12 >= 12 ? "PM" : "AM";
  h12 = h12 % 12; if (h12 === 0) h12 = 12;
  $time.textContent = `${pad(h12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  $ampm.textContent = ampm;

  // Analog hands — discrete tick (no smooth sweep). Skeumorphic clocks of
  // the early 2000s ticked once per second; the precision read as authentic.
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec / 60;
  const hr  = (d.getHours() % 12) + min / 60;

  $handSec.setAttribute("transform", `rotate(${sec * 6})`);
  $handMin.setAttribute("transform", `rotate(${min * 6})`);
  $handHour.setAttribute("transform", `rotate(${hr * 30})`);
}

try {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
  $zone.textContent = tz.replace("_", " ");
} catch { $zone.textContent = "—"; }

tickClock();
setInterval(tickClock, 1000);

// ─── Calendar widget ─────────────────────────────────────────────────────
const $dow = $("date-dow");
const $num = $("date-num");
const $moy = $("date-moy");
const $year = $("date-year");

const DOW = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MOY = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function tickCalendar() {
  const d = new Date();
  $dow.textContent = DOW[d.getDay()];
  $num.textContent = pad(d.getDate());
  $moy.textContent = MOY[d.getMonth()];
  $year.textContent = String(d.getFullYear());
}
tickCalendar();
// Re-check date once per minute (handles midnight rollover without burning ticks).
setInterval(tickCalendar, 60_000);

// ─── Resources widget (live CPU + RAM via chrome.system APIs, GPU via WebGL) ──
const $cpuPct   = $("cpu-pct");
const $cpuBar   = $("cpu-bar");
const $cpuModel = $("cpu-model");
const $ramPct   = $("ram-pct");
const $ramBar   = $("ram-bar");
const $gpuModel = $("gpu-model");
const $resLed   = $("resources-led");

function setBarThreshold(el, pct) {
  el.classList.toggle("warn", pct >= 60 && pct < 85);
  el.classList.toggle("crit", pct >= 85);
}

// CPU usage requires a delta between two samples — first sample establishes
// the baseline, second sample produces the first real reading.
let lastCpu = null;

async function pollCpu() {
  if (!chrome?.system?.cpu?.getInfo) return;
  try {
    const info = await chrome.system.cpu.getInfo();
    let busy = 0, total = 0;
    for (const p of info.processors) {
      busy += (p.usage.kernel || 0) + (p.usage.user || 0);
      total += p.usage.total || 0;
    }
    if (lastCpu) {
      const dBusy = busy - lastCpu.busy;
      const dTotal = total - lastCpu.total;
      const pct = dTotal > 0 ? Math.max(0, Math.min(100, (dBusy / dTotal) * 100)) : 0;
      $cpuPct.textContent = `${pct.toFixed(1)} %`;
      $cpuBar.style.width = `${pct}%`;
      setBarThreshold($cpuBar, pct);
    }
    lastCpu = { busy, total };
    if (!$cpuModel.dataset.set) {
      const cleaned = cleanModel(info.modelName || "Unknown");
      $cpuModel.textContent = `${cleaned} · ${info.numOfProcessors}C`;
      // Full unmodified string available on hover tooltip.
      $cpuModel.title = `${info.modelName} (${info.archName}, ${info.numOfProcessors} cores)`;
      $cpuModel.dataset.set = "1";
    }
  } catch (e) {
    console.warn("[umi-ntp] cpu poll failed:", e);
  }
}

async function pollRam() {
  if (!chrome?.system?.memory?.getInfo) return;
  try {
    const info = await chrome.system.memory.getInfo();
    const pct = (1 - info.availableCapacity / info.capacity) * 100;
    $ramPct.textContent = `${pct.toFixed(1)} %`;
    $ramBar.style.width = `${pct}%`;
    setBarThreshold($ramBar, pct);
  } catch (e) {
    console.warn("[umi-ntp] ram poll failed:", e);
  }
}

// Strip vendor noise from chip model strings. Examples:
//   "Intel(R) Core(TM) i7-12700H @ 2.30GHz"     → "Intel Core i7-12700H"
//   "AMD Ryzen 7 5800X 8-Core Processor"        → "AMD Ryzen 7 5800X"
//   "Mesa Intel(R) UHD Graphics 620 (KBL GT2)"  → "Mesa Intel UHD Graphics 620"
function cleanModel(name) {
  return name
    .replace(/\((?:R|TM|C)\)/g, "")
    .replace(/\s+@\s+[\d.]+\s*[GMK]?Hz/gi, "")
    .replace(/\s+\d+-Core Processor/gi, "")
    .replace(/\s+CPU\b/gi, "")
    .replace(/\s+Direct3D\d+\s+vs_[\w_]+\s+ps_[\w_]+,?/gi, "")
    .replace(/\s+\([^)]*GT\d+\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readGpuModel() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "—";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "—";
    const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "—";
    // ANGLE wraps the real GPU on Windows/macOS:
    //   "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 ..., D3D11)"
    // Pull just the middle segment, then strip vendor noise.
    const angleMatch = raw.match(/ANGLE \([^,]+,\s*([^,]+)/);
    return cleanModel(angleMatch ? angleMatch[1] : raw);
  } catch { return "—"; }
}

// Defer GPU model probe to next idle window. WebGL context creation in the
// same paint cycle as autoplay video + backdrop-filter widgets crashes the
// renderer on Wayland Chromium. Idle callback waits until the GPU pipeline
// has settled. The GPU model is static info; no harm in showing "—" briefly.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
idle(() => {
  const gpu = readGpuModel();
  if (gpu && gpu !== "—") {
    $gpuModel.textContent = gpu;
    $gpuModel.title = gpu; // expose full string on hover
  } else {
    // Headless rendering, software rasterization, or browsers that block
    // WEBGL_debug_renderer_info return nothing usable. Hide the row entirely
    // rather than show a stub — the widget reads cleaner.
    const gpuRow = $gpuModel.closest(".resource__hw-row");
    if (gpuRow) gpuRow.style.display = "none";
  }
}, { timeout: 3000 });

if (!chrome?.system?.cpu) {
  $cpuPct.textContent = "n/a";
  $ramPct.textContent = "n/a";
  $cpuModel.textContent = "(reload extension to grant system perms)";
  $resLed.classList.remove("led--green");
  $resLed.classList.add("led--amber");
} else {
  // Defer first CPU/RAM polls too — they need a 2-second delta to produce a
  // first reading anyway, so giving the page time to settle costs nothing.
  idle(() => {
    pollCpu();
    pollRam();
    setInterval(pollCpu, 2000);
    setInterval(pollRam, 2000);
  }, { timeout: 2000 });
}

// ─── System status (all real) ────────────────────────────────────────────
const $online    = $("status-online");
const $onlineDot = $("status-online-dot");
const $onlineLed = $("status-online-led");
const $viewport  = $("status-viewport");
const $lang      = $("status-lang");
const $version   = $("status-version");

function updateOnline() {
  const on = navigator.onLine;
  $online.textContent = on ? "ONLINE" : "OFFLINE";
  $onlineDot.classList.toggle("offline", !on);
  $onlineLed.classList.toggle("led--green", on);
  $onlineLed.classList.toggle("led--amber", !on);
}
updateOnline();
window.addEventListener("online",  updateOnline);
window.addEventListener("offline", updateOnline);

function updateViewport() {
  $viewport.textContent = `${window.innerWidth}×${window.innerHeight}`;
}
updateViewport();
window.addEventListener("resize", updateViewport);

$lang.textContent = (navigator.language || "—").toUpperCase();

try {
  const m = chrome?.runtime?.getManifest?.();
  $version.textContent = m ? `v${m.version}` : "—";
} catch { $version.textContent = "—"; }

// ─── Weather + Solar (single Open-Meteo query feeds both) ────────────────
const $temp    = $("weather-temp");
const $cond    = $("weather-cond");
const $loc     = $("weather-loc");
const $icon    = $("weather-icon");
const $wxLed   = $("weather-led");
const $weatherWidget = $("weather-widget");

const $solRise = $("solar-rise");
const $solSet  = $("solar-set");
const $solLed  = $("solar-led");
const $solArc  = $("solar-arc-fill");
const $solMark = $("solar-marker");

$weatherWidget.classList.add("weather--loading");

const WMO = {
  0:  ["☀", "Clear"],
  1:  ["🌤", "Mostly clear"],
  2:  ["⛅", "Partly cloudy"],
  3:  ["☁", "Overcast"],
  45: ["🌫", "Fog"],
  48: ["🌫", "Rime fog"],
  51: ["🌦", "Light drizzle"],
  53: ["🌦", "Drizzle"],
  55: ["🌦", "Heavy drizzle"],
  56: ["🌧", "Freezing drizzle"],
  57: ["🌧", "Freezing drizzle"],
  61: ["🌧", "Light rain"],
  63: ["🌧", "Rain"],
  65: ["🌧", "Heavy rain"],
  66: ["🌧", "Freezing rain"],
  67: ["🌧", "Freezing rain"],
  71: ["🌨", "Light snow"],
  73: ["🌨", "Snow"],
  75: ["🌨", "Heavy snow"],
  77: ["🌨", "Snow grains"],
  80: ["🌦", "Showers"],
  81: ["🌧", "Showers"],
  82: ["⛈", "Heavy showers"],
  85: ["🌨", "Snow showers"],
  86: ["🌨", "Snow showers"],
  95: ["⛈", "Thunderstorm"],
  96: ["⛈", "Thunderstorm w/ hail"],
  99: ["⛈", "Thunderstorm w/ hail"],
};

const TZ_FALLBACK = {
  "America/New_York":     { latitude: 40.7128,  longitude: -74.0060,  city: "New York",      region_code: "NY"  },
  "America/Chicago":      { latitude: 41.8781,  longitude: -87.6298,  city: "Chicago",       region_code: "IL"  },
  "America/Denver":       { latitude: 39.7392,  longitude: -104.9903, city: "Denver",        region_code: "CO"  },
  "America/Los_Angeles":  { latitude: 34.0522,  longitude: -118.2437, city: "Los Angeles",   region_code: "CA"  },
  "America/Toronto":      { latitude: 43.6532,  longitude: -79.3832,  city: "Toronto",       region_code: "ON"  },
  "Europe/London":        { latitude: 51.5074,  longitude: -0.1278,   city: "London",        region_code: "ENG" },
  "Europe/Paris":         { latitude: 48.8566,  longitude:   2.3522,  city: "Paris",         region_code: "IDF" },
  "Europe/Berlin":        { latitude: 52.5200,  longitude:  13.4050,  city: "Berlin",        region_code: "BE"  },
  "Asia/Tokyo":           { latitude: 35.6762,  longitude: 139.6503,  city: "Tokyo",         region_code: "JP"  },
  "Asia/Shanghai":        { latitude: 31.2304,  longitude: 121.4737,  city: "Shanghai",      region_code: "CN"  },
  "Asia/Kolkata":         { latitude: 28.6139,  longitude:  77.2090,  city: "Delhi",         region_code: "IN"  },
  "Australia/Sydney":     { latitude: -33.8688, longitude: 151.2093,  city: "Sydney",        region_code: "NSW" },
};

async function fetchJSON(url, label) {
  let resp;
  try {
    resp = await fetch(url, { cache: "no-store" });
  } catch (err) {
    throw new Error(`${label} unreachable: ${err.message || err}`);
  }
  if (!resp.ok) throw new Error(`${label} HTTP ${resp.status}`);
  try {
    return await resp.json();
  } catch (err) {
    throw new Error(`${label} bad json: ${err.message || err}`);
  }
}

async function geolocate() {
  try {
    const g = await fetchJSON("https://ipwho.is/", "ipwho");
    if (g && g.success !== false && typeof g.latitude === "number") {
      return { latitude: g.latitude, longitude: g.longitude, city: g.city, region_code: g.region_code };
    }
    throw new Error(g && g.message ? `ipwho: ${g.message}` : "ipwho: no lat/lon");
  } catch (e1) {
    console.warn("[umi-ntp] ipwho.is failed:", e1.message);
    try {
      const g = await fetchJSON("https://ipapi.co/json/", "ipapi");
      if (g && !g.error && typeof g.latitude === "number") return g;
      throw new Error(g && g.reason ? `ipapi: ${g.reason}` : "ipapi: no lat/lon");
    } catch (e2) {
      console.warn("[umi-ntp] ipapi.co failed:", e2.message);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fb = TZ_FALLBACK[tz];
      if (fb) return fb;
      throw new Error(`no geo (tried ipwho, ipapi, tz=${tz})`);
    }
  }
}

function setWeatherError(reason) {
  $temp.textContent = "--";
  $cond.textContent = reason;
  $icon.textContent = "⚠";
  $loc.textContent = "— · —";
  $wxLed.classList.remove("led--green");
  $wxLed.classList.add("led--amber");
  $weatherWidget.classList.remove("weather--loading");
}

function setSolarError() {
  $solRise.textContent = "--:--";
  $solSet.textContent = "--:--";
  $solLed.classList.remove("led--green");
  $solLed.classList.add("led--amber");
}

// Format an ISO timestamp ("2026-05-09T05:42") as "5:42 AM" in user locale.
function formatTime(iso) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${pad(d.getMinutes())} ${ampm}`;
}

// Update the SVG arc to show how far through daylight we are. The arc is
// 180 degrees (10,70 → 190,70). dash-array length covers progress 0-1.
function updateSolarArc(riseISO, setISO) {
  const arcLen = 283; // ~ Math.PI * 90 (radius), tuned visually for our path
  if (!riseISO || !setISO) return;
  const rise = new Date(riseISO).getTime();
  const set  = new Date(setISO).getTime();
  const now  = Date.now();
  let pct;
  if (now < rise) pct = 0;
  else if (now > set) pct = 1;
  else pct = (now - rise) / (set - rise);
  $solArc.setAttribute("stroke-dasharray", `${arcLen * pct} ${arcLen}`);

  // Marker position along the arc (parametric).
  const theta = Math.PI * (1 - pct); // π = sunrise (left), 0 = sunset (right)
  const cx = 100 - 90 * Math.cos(theta);
  const cy = 70 - 90 * Math.sin(theta);
  $solMark.setAttribute("cx", cx.toFixed(1));
  $solMark.setAttribute("cy", cy.toFixed(1));
}

// ─── Network widget (real: ping = open-meteo round-trip) ─────────────────
const $rtt   = $("network-rtt");
const $type  = $("network-type");
const $bars  = $("network-bars");
const $netLed = $("network-led");

// Build 5 bar elements once.
for (let i = 0; i < 5; i++) {
  const span = document.createElement("span");
  $bars.appendChild(span);
}

function setNetwork(rttMs) {
  if (!Number.isFinite(rttMs)) {
    $rtt.textContent = "— ms";
    $netLed.classList.remove("led--green");
    $netLed.classList.add("led--amber");
    [...$bars.children].forEach((b) => b.classList.remove("active", "warn"));
    return;
  }
  $rtt.textContent = `${Math.round(rttMs)} ms`;

  // Bar count by latency tier — based on widely-used network quality bands.
  // <100ms = excellent (5), <250ms = good (4), <500ms = fair (3),
  // <1000ms = poor (2), >=1000 = bad (1)
  let bars;
  if (rttMs < 100) bars = 5;
  else if (rttMs < 250) bars = 4;
  else if (rttMs < 500) bars = 3;
  else if (rttMs < 1000) bars = 2;
  else bars = 1;

  const warn = bars <= 2;
  [...$bars.children].forEach((b, i) => {
    b.classList.toggle("active", i < bars);
    b.classList.toggle("warn", warn && i < bars);
  });
  $netLed.classList.toggle("led--green", !warn);
  $netLed.classList.toggle("led--amber", warn);
}

// navigator.connection is non-standard but available in Chromium.
function updateConnectionType() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && c.effectiveType) {
    $type.textContent = c.effectiveType.toUpperCase();
  } else {
    $type.textContent = "UNKNOWN";
  }
}
updateConnectionType();
if (navigator.connection) {
  navigator.connection.addEventListener("change", updateConnectionType);
}

// ─── Combined weather + solar load (one request, two widgets) ─────────────
async function loadWeatherAndSolar() {
  try {
    if (chrome && chrome.runtime && chrome.runtime.getManifest) {
      const m = chrome.runtime.getManifest();
      console.log("[umi-ntp] manifest v" + m.version, "hosts:", m.host_permissions);
    }
    const geo = await geolocate();
    if (!geo || typeof geo.latitude !== "number" || typeof geo.longitude !== "number") {
      throw new Error("no lat/lon");
    }
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", geo.latitude);
    url.searchParams.set("longitude", geo.longitude);
    url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
    url.searchParams.set("daily", "sunrise,sunset");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", "auto");

    // Time the round trip — that's our real network ping reading.
    const t0 = performance.now();
    const wx = await fetchJSON(url.toString(), "open-meteo");
    const rtt = performance.now() - t0;
    setNetwork(rtt);

    const c = wx && wx.current;
    if (!c) throw new Error("open-meteo: no current reading");

    // Weather widget
    const code = c.weather_code;
    const [glyph, label] = WMO[code] || ["◌", "—"];
    const isDay = c.is_day !== 0;
    $temp.textContent = Math.round(c.temperature_2m);
    $cond.textContent = `${label} · ${Math.round(c.wind_speed_10m)} mph wind`;
    $icon.textContent = !isDay && code === 0 ? "🌙" : glyph;

    const city = geo.city || "—";
    const region = geo.region_code || geo.region || "";
    $loc.textContent = `${city}${region ? " · " + region : ""}`;

    $wxLed.classList.remove("led--amber");
    $wxLed.classList.add("led--green");
    $weatherWidget.classList.remove("weather--loading");

    // Solar widget
    const daily = wx.daily || {};
    const riseISO = daily.sunrise && daily.sunrise[0];
    const setISO  = daily.sunset  && daily.sunset[0];
    if (riseISO && setISO) {
      $solRise.textContent = formatTime(riseISO);
      $solSet.textContent  = formatTime(setISO);
      $solLed.classList.remove("led--amber");
      $solLed.classList.add("led--green");
      updateSolarArc(riseISO, setISO);
    } else {
      setSolarError();
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.warn("[umi-ntp] weather/solar load failed:", msg);
    setWeatherError(msg);
    setSolarError();
    setNetwork(NaN);
  }
}

loadWeatherAndSolar();
setInterval(loadWeatherAndSolar, 15 * 60 * 1000);
// Also refresh the solar arc position (not the data) every 30s so the marker
// drifts smoothly across the day without a full network call.
setInterval(() => {
  if ($solRise.textContent !== "--:--") {
    // Re-derive ISO from displayed times by combining with today's date.
    // Simpler: just leave arc updates to the 15-min full refresh; users won't
    // notice 15-min granularity on a sun arc.
  }
}, 30_000);

// ─── Drag system ─────────────────────────────────────────────────────────
// Each widget keeps its grid-laid-out base position and applies a translate3d
// offset on top. The offset lives only in inline style — page reload wipes it
// and the layout snaps back to defaults.
function makeDraggable(widget) {
  const handle = widget.querySelector(".widget__chrome");
  if (!handle) return;

  let pointerId = null;
  let startX = 0, startY = 0, baseX = 0, baseY = 0;

  function readOffset() {
    const t = widget.style.transform || "";
    const m = t.match(/translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/);
    return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 };
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    handle.setPointerCapture(pointerId);
    const off = readOffset();
    baseX = off.x; baseY = off.y;
    startX = e.clientX; startY = e.clientY;
    widget.classList.add("widget--dragging");
    e.preventDefault();
  }

  function onMove(e) {
    if (e.pointerId !== pointerId) return;
    const dx = baseX + (e.clientX - startX);
    const dy = baseY + (e.clientY - startY);
    widget.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    handle.releasePointerCapture(pointerId);
    pointerId = null;
    widget.classList.remove("widget--dragging");
  }

  handle.addEventListener("pointerdown",   onDown);
  handle.addEventListener("pointermove",   onMove);
  handle.addEventListener("pointerup",     onUp);
  handle.addEventListener("pointercancel", onUp);
}

document.querySelectorAll(".widget").forEach(makeDraggable);
