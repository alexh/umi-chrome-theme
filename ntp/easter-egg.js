/* ─── UMI PROTOCOL boot sequence (Konami code easter egg) ──────────────
 *
 * Trigger: ↑ ↑ ↓ ↓ ← → ← → B A on the new tab page.
 * Effect:  6-phase ~5.3s title sequence with ASCII art and SFX.
 *
 * Phases:
 *   1. SIGNAL GLITCH   (0–400ms)  — rapidly mutating ASCII static
 *   2. TERMINAL BOOT   (400–1700) — type-writer log lines
 *   3. ASCII GEAR      (1700–3000)— draw-on + rotation cycle
 *   4. TITLE CARD      (3000–4000)— "PROTOCOL ACTIVATED" + subtitle
 *   5. STATUS DUMP     (4000–4700)— staggered system readouts
 *   6. CRT POWER-OFF   (4700–5300)— two-stage pinch to dot
 * ─────────────────────────────────────────────────────────────────────── */

(() => {
  const KONAMI = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let progress = 0;

  document.addEventListener("keydown", (e) => {
    const expected = KONAMI[progress];
    const matches = e.key.toLowerCase() === expected.toLowerCase();
    if (matches) {
      progress++;
      if (progress === KONAMI.length) {
        progress = 0;
        if (!document.querySelector(".protocol-overlay")) trigger();
      }
    } else {
      progress = e.key === KONAMI[0] ? 1 : 0;
    }
  });

  // ─── ASCII gear frames ───────────────────────────────────────────────
  // Hand-crafted 4-frame cycle. Frame width ~30 chars, height 13 rows.
  // The "rotation" is a visual cheat — the spiral inside shifts position
  // while the outer cogs stay put. Reads as motion at 100ms per frame.
  const GEAR_FRAMES = [
`        ▓▓▓▓     ▓▓▓▓
      ▓▓░░░░░▓▓▓░░░░░▓▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
   ▓░░░░░╭───────╮░░░░░▓
  ▓░░░░░░│ ╱─╮   │░░░░░░▓
  ▓▓░░░░░│ ╲ ◉   │░░░░░▓▓
  ▓░░░░░░│   ╲─╱ │░░░░░░▓
   ▓░░░░░╰───────╯░░░░░▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
      ▓▓░░░░░▓▓▓░░░░░▓▓
        ▓▓▓▓     ▓▓▓▓`,
`         ▓▓▓     ▓▓▓
      ▓▓▓░░░░▓▓▓▓░░░░▓▓▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
   ▓░░░░░╭───────╮░░░░░▓
  ▓░░░░░░│  ╭─╮  │░░░░░░▓
  ▓░░░░░░│  │◉│  │░░░░░░▓
  ▓░░░░░░│  ╰─╯  │░░░░░░▓
   ▓░░░░░╰───────╯░░░░░▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
      ▓▓▓░░░░▓▓▓▓░░░░▓▓▓
         ▓▓▓     ▓▓▓`,
`        ▓▓▓▓     ▓▓▓▓
      ▓▓░░░░░▓▓▓░░░░░▓▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
   ▓░░░░░╭───────╮░░░░░▓
  ▓░░░░░░│   ╱─╲ │░░░░░░▓
  ▓▓░░░░░│ ◉ ╱  │░░░░░▓▓
  ▓░░░░░░│ ╰─╯  │░░░░░░▓
   ▓░░░░░╰───────╯░░░░░▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
      ▓▓░░░░░▓▓▓░░░░░▓▓
        ▓▓▓▓     ▓▓▓▓`,
`         ▓▓▓     ▓▓▓
      ▓▓▓░░░░▓▓▓▓░░░░▓▓▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
   ▓░░░░░╭───────╮░░░░░▓
  ▓░░░░░░│ ─╮  ╱ │░░░░░░▓
  ▓░░░░░░│  ◉   │░░░░░░▓
  ▓░░░░░░│ ╱  ╰─│░░░░░░▓
   ▓░░░░░╰───────╯░░░░░▓
    ▓▓░░░░░░░░░░░░░░░░░▓▓
      ▓▓▓░░░░▓▓▓▓░░░░▓▓▓
         ▓▓▓     ▓▓▓`,
  ];

  // Characters used for the signal-glitch phase
  const GLITCH_CHARS = "▓░▒█│─╳╫┼╋╴╶╵╷ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789╱╲";

  // Phase 2 terminal log
  const BOOT_LINES = [
    "> UMI//PROTOCOL  v0.5.0",
    "> INITIALIZING SUBSYSTEMS...",
    "> SCANNING FREQUENCIES.....OK",
    "> AUTHENTICATING............OK",
    "> [████████████] 100%",
    "> CHANNEL OPEN",
  ];

  // Phase 5 status readout
  const STATUS_LINES = [
    { key: "SYS",   val: "OK" },
    { key: "NET",   val: "OK" },
    { key: "VID",   val: "OK" },
    { key: "AUDIO", val: "OK" },
    { key: "GPU",   val: "OK" },
    { key: "_",     val: "READY", ready: true },
  ];

  // ─── Trigger ─────────────────────────────────────────────────────────
  function trigger() {
    const overlay = document.createElement("div");
    overlay.className = "protocol-overlay";
    overlay.innerHTML = `<div class="po-vignette"></div><div class="po-scanline"></div>`;
    document.body.appendChild(overlay);

    // Sound: try MP3, fall back to Web Audio API synth if not available
    let audio;
    try {
      audio = new Audio(chrome.runtime.getURL("sounds/protocol.mp3"));
      audio.volume = 0.55;
      audio.play().catch(() => synthFallback(overlay));
    } catch {
      synthFallback(overlay);
    }

    const timers = [];
    const schedule = (delay, fn) => {
      const t = setTimeout(fn, delay);
      timers.push(t);
    };

    schedule(0,    () => phase1Glitch(overlay));
    schedule(400,  () => phase2Boot(overlay));
    schedule(1700, () => phase3Gear(overlay));
    schedule(3000, () => phase4Title(overlay));
    schedule(4000, () => phase5Status(overlay));
    schedule(4700, () => phase6CrtOff(overlay));
    schedule(5400, () => {
      timers.forEach(clearTimeout);
      overlay.remove();
    });
  }

  // ─── Phase 1: glitch static ──────────────────────────────────────────
  function phase1Glitch(overlay) {
    const glitch = document.createElement("pre");
    glitch.className = "po-glitch";
    overlay.appendChild(glitch);

    const cols = 70;
    const rows = 24;
    const render = () => {
      let out = "";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          out += GLITCH_CHARS[(Math.random() * GLITCH_CHARS.length) | 0];
        }
        out += "\n";
      }
      glitch.textContent = out;
    };

    render();
    const id = setInterval(render, 60);
    setTimeout(() => {
      clearInterval(id);
      glitch.classList.add("po-fading");
      setTimeout(() => glitch.remove(), 320);
    }, 380);
  }

  // ─── Phase 2: terminal boot ──────────────────────────────────────────
  function phase2Boot(overlay) {
    const term = document.createElement("div");
    term.className = "po-terminal";
    overlay.appendChild(term);

    let lineIdx = 0;
    let charIdx = 0;
    let printed = "";

    function tick() {
      if (lineIdx >= BOOT_LINES.length) {
        term.innerHTML = printed + '<span class="po-cursor"></span>';
        return;
      }
      const line = BOOT_LINES[lineIdx];
      if (charIdx >= line.length) {
        printed += "\n";
        lineIdx++;
        charIdx = 0;
        setTimeout(tick, 80);
        return;
      }
      printed += line[charIdx++];
      term.innerHTML = printed + '<span class="po-cursor"></span>';
      // Faster chars for the progress bar line
      const speed = line.includes("█") ? 18 : 26;
      setTimeout(tick, speed);
    }
    tick();

    setTimeout(() => term.classList.add("po-fading"), 1180);
    setTimeout(() => term.remove(), 1280);
  }

  // ─── Phase 3: ASCII gear ─────────────────────────────────────────────
  function phase3Gear(overlay) {
    const wrap = document.createElement("div");
    wrap.className = "po-gear-wrap";
    const gear = document.createElement("pre");
    gear.className = "po-gear";
    wrap.appendChild(gear);
    overlay.appendChild(wrap);

    // Draw-on: progressively reveal characters of frame[0]
    const target = GEAR_FRAMES[0];
    let revealed = 0;
    const draw = setInterval(() => {
      revealed += 12;
      // Show only the first N non-newline chars; preserve newlines
      let shown = "";
      let n = 0;
      for (const ch of target) {
        if (ch === "\n") { shown += "\n"; continue; }
        if (n < revealed) { shown += ch; n++; }
        else { shown += " "; n++; }
      }
      gear.textContent = shown;
      if (revealed >= target.replace(/\s/g, "").length + 60) {
        clearInterval(draw);
        gear.textContent = target;
        // Cycle through rotation frames
        let f = 0;
        const cycle = setInterval(() => {
          f = (f + 1) % GEAR_FRAMES.length;
          gear.textContent = GEAR_FRAMES[f];
        }, 110);
        wrap._cycle = cycle;
      }
    }, 30);
    wrap._draw = draw;

    setTimeout(() => {
      clearInterval(wrap._draw);
      clearInterval(wrap._cycle);
      wrap.classList.add("po-fading");
      setTimeout(() => wrap.remove(), 280);
    }, 1240);
  }

  // ─── Phase 4: title card ─────────────────────────────────────────────
  function phase4Title(overlay) {
    const title = document.createElement("div");
    title.className = "po-title";
    title.innerHTML = `
      <div class="po-title-main">PROTOCOL ACTIVATED</div>
      <div class="po-title-sub">// CHANNEL CHROME // STATUS NOMINAL</div>
    `;
    overlay.appendChild(title);

    setTimeout(() => title.classList.add("po-fading"), 880);
    setTimeout(() => title.remove(), 1320);
  }

  // ─── Phase 5: status dump ────────────────────────────────────────────
  function phase5Status(overlay) {
    const ul = document.createElement("ul");
    ul.className = "po-status";
    overlay.appendChild(ul);

    STATUS_LINES.forEach((entry, i) => {
      const li = document.createElement("li");
      if (entry.ready) li.classList.add("po-ready");
      li.style.animationDelay = `${i * 70}ms`;
      if (entry.ready) {
        li.innerHTML = `<span class="po-led"></span><em>&gt; ${entry.val}</em>`;
      } else {
        li.innerHTML = `<span class="po-led"></span><code>${entry.key}</code><em>${entry.val}</em>`;
      }
      ul.appendChild(li);
    });

    setTimeout(() => ul.classList.add("po-fading"), 600);
    setTimeout(() => ul.remove(), 850);
  }

  // ─── Phase 6: CRT power-off ──────────────────────────────────────────
  function phase6CrtOff(overlay) {
    overlay.classList.add("po-crt-off");
  }

  // ─── Web Audio API fallback (5-second synthetic boot bleeps) ─────────
  function synthFallback(overlay) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const blip = (freq, when, dur = 0.08, gain = 0.18) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(gain, when + 0.005);
        g.gain.linearRampToValueAtTime(0,    when + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(when);
        osc.stop(when + dur + 0.02);
      };
      // Phase 1 static crackle
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.18;
      noise.buffer = buf;
      noise.connect(nGain).connect(ctx.destination);
      noise.start(now);
      // Phase 2 typing bleeps
      for (let i = 0; i < 16; i++) blip(880 + (i % 3) * 220, now + 0.45 + i * 0.07, 0.04, 0.12);
      // Phase 3 rising whirr
      blip(220, now + 1.85, 1.1, 0.20);
      blip(330, now + 2.10, 0.9, 0.14);
      // Phase 4 confirmation handshake
      blip(660, now + 3.05, 0.25, 0.28);
      blip(880, now + 3.25, 0.45, 0.22);
      // Phase 5 confirmation beeps
      for (let i = 0; i < 5; i++) blip(1320, now + 4.05 + i * 0.10, 0.04, 0.16);
      // Phase 6 CRT off
      blip(160, now + 4.75, 0.40, 0.30);
    } catch {/* silent fail */}
  }
})();
