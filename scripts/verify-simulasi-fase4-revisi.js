const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.VERIFY_PORT || 3010);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DOCS_DIR = path.resolve(__dirname, '../docs/screenshots');
const BRAIN_DIR =
  'C:\\Users\\HYPE R Series\\.gemini\\antigravity\\brain\\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\\screenshots';

fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(BRAIN_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Membuat tile PNG sintetis 256x256 (warna netral #EAE6DF + garis tipis grid) di memori agar TIDAK pernah mengunduh tile dari server OpenStreetMap.
function createSyntheticTileBase64() {
  const width = 256;
  const height = 256;
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // Filter None
    const isGridRow = y % 64 === 0;
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 4;
      const isGrid = isGridRow || x % 64 === 0;
      raw[p] = isGrid ? 216 : 234; // R
      raw[p + 1] = isGrid ? 211 : 230; // G
      raw[p + 2] = isGrid ? 204 : 223; // B
      raw[p + 3] = 255; // A
    }
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 6 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png.toString('base64');
}

const SYNTHETIC_TILE_B64 = createSyntheticTileBase64();

class CdpSession {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.pending = new Map();
    this.listeners = new Map();

    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        for (const fn of this.listeners.get(msg.method)) {
          fn(msg.params);
        }
      }
    };
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evalExpr(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        `Page eval failed: ${res.exceptionDetails.text} ${JSON.stringify(res.exceptionDetails.exception || {})}`
      );
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    this.ws.close();
  }
}

async function attachTarget(browserCdp, debugPort, options = {}) {
  const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const listRes = await fetch(`http://127.0.0.1:${debugPort}/json`);
  const targets = await listRes.json();
  const target = targets.find((t) => t.id === targetId);
  if (!target) throw new Error('Target page not found');

  const page = new CdpSession(target.webSocketDebuggerUrl);
  await page.open();
  await page.send('Page.enable');
  await page.send('DOM.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');

  const state = {
    failOsmTiles: Boolean(options.failOsmTiles),
    osmInterceptCount: 0,
    scriptUrls: new Set(),
    apiUrlsDuringPlay: [],
    consoleErrors: [],
    trackApi: false,
  };

  if (options.disableWebgl) {
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        const origGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          if (String(type).toLowerCase().includes('webgl')) return null;
          return origGetContext.apply(this, [type, ...args]);
        };
      `,
    });
  }

  // WAJIB: mencegat seluruh permintaan tile.openstreetmap.org agar skrip otomatis TIDAK pernah menghubungi server OSM.
  await page.send('Fetch.enable', {
    patterns: [
      { urlPattern: '*tile.openstreetmap.org*', requestStage: 'Request' },
      { urlPattern: '*.tile.openstreetmap.org*', requestStage: 'Request' },
    ],
  });

  page.on('Fetch.requestPaused', async (ev) => {
    state.osmInterceptCount += 1;
    try {
      if (state.failOsmTiles) {
        await page.send('Fetch.failRequest', {
          requestId: ev.requestId,
          errorReason: 'InternetDisconnected',
        });
      } else {
        await page.send('Fetch.fulfillRequest', {
          requestId: ev.requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'image/png' },
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Cache-Control', value: 'no-store' },
          ],
          body: SYNTHETIC_TILE_B64,
        });
      }
    } catch {
      // Abaikan jika target sudah ditutup
    }
  });

  page.on('Network.requestWillBeSent', (ev) => {
    const url = ev.request?.url || '';
    if (ev.type === 'Script' && url.includes('/_next/static/')) {
      state.scriptUrls.add(url);
    }
    if (state.trackApi && url.startsWith(BASE_URL) && url.includes('/api/')) {
      state.apiUrlsDuringPlay.push(url);
    }
  });

  page.on('Runtime.exceptionThrown', (ev) => {
    const desc = ev.exceptionDetails?.exception?.description || ev.exceptionDetails?.text || 'Unknown exception';
    state.consoleErrors.push(desc);
  });

  page.on('Runtime.consoleAPICalled', (ev) => {
    if (ev.type === 'error') {
      const txt = (ev.args || []).map((a) => a.value || a.description || '').join(' ');
      if (!state.failOsmTiles) {
        state.consoleErrors.push(txt);
      }
    }
  });

  return { targetId, page, state };
}

async function saveShot(page, name, { width, height, mobile, fullPage }) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: Boolean(mobile),
  });
  await sleep(600);
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: Boolean(fullPage),
  });
  const buf = Buffer.from(data, 'base64');
  fs.writeFileSync(path.join(DOCS_DIR, name), buf);
  fs.writeFileSync(path.join(BRAIN_DIR, name), buf);
  console.log(`Saved screenshot: ${name} (${buf.length} bytes)`);
}

async function setReactInputValue(page, selector, value) {
  await page.evalExpr(`
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('Element not found: ' + ${JSON.stringify(selector)});
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, ${JSON.stringify(String(value))});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  `);
}

async function startProdServer() {
  const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
  const hasVerifyDist = fs.existsSync(path.resolve(__dirname, '../.next-verify/BUILD_ID'));
  const srv = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(PORT)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...(hasVerifyDist && !process.env.NEXT_DIST_DIR ? { NEXT_DIST_DIR: '.next-verify' } : {}),
      SYNC_SECRET: process.env.SYNC_SECRET || 'sigap_verify_runtime_sync_secret_2026',
      LOG_HMAC_SECRET: process.env.LOG_HMAC_SECRET || 'sigap_verify_runtime_hmac_secret_2026',
    },
  });
  srv.stdout.on('data', (d) => process.stdout.write(`[next] ${d}`));
  srv.stderr.on('data', (d) => process.stderr.write(`[next:err] ${d}`));

  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE_URL}/simulasi`);
      if (r.status === 200) {
        console.log(`Production server ready at ${BASE_URL}`);
        return srv;
      }
    } catch {}
    await sleep(400);
  }
  srv.kill();
  throw new Error('Production server failed to start within timeout');
}

async function main() {
  const srv = await startProdServer();
  const debugPort = 9233;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    '--hide-scrollbars',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    'about:blank',
  ]);

  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (r.ok) {
        version = await r.json();
        break;
      }
    } catch {}
    await sleep(250);
  }
  if (!version?.webSocketDebuggerUrl) {
    chrome.kill();
    srv.kill();
    throw new Error('Failed to connect to headless Chrome CDP');
  }

  const browserCdp = new CdpSession(version.webSocketDebuggerUrl);
  await browserCdp.open();

  const report = {
    assertions: [],
    chunksDefaultMode: [],
    chunksAfter3DOpen: [],
    mobile390Fps: null,
    overflowWidths: [],
    osmInterceptTotal: 0,
    apiCallsDuringInteractions: 0,
    consoleErrors: [],
  };

  function assertCheck(name, ok, detail) {
    report.assertions.push({ name, ok: Boolean(ok), detail });
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
    if (!ok) {
      throw new Error(`Assertion failed: ${name} -> ${detail}`);
    }
  }

  try {
    // 1. Sesi utama: Peta default, slider 0 API calls, >300 km, Palu, M 7.5 laut, Aceh, Keyboard, 3D + FPS
    const mainTab = await attachTarget(browserCdp, debugPort);
    const { page, state } = mainTab;

    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await page.send('Page.navigate', { url: `${BASE_URL}/simulasi` });
    await sleep(2500);

    // Cek chunk isolasi di mode default (Peta dampak): three TIDAK boleh dimuat saat halaman dibuka
    const loadedBefore3D = [...state.scriptUrls];
    report.chunksDefaultMode = loadedBefore3D;
    const hasThreeBefore = loadedBefore3D.some((u) => /b536a0f1|bd904a5c|three/i.test(u));
    assertCheck('three_chunk_not_loaded_on_default', !hasThreeBefore, `loaded=${loadedBefore3D.length} scripts`);
    assertCheck('osm_tiles_intercepted', state.osmInterceptCount > 0, `intercepted=${state.osmInterceptCount} OSM requests`);

    // Cek elemen awal default mode Peta dampak
    const defaultCheck = await page.evalExpr(`
      const details = document.querySelector('details');
      const bodyText = document.body.innerText;
      return {
        detailsOpen: details ? details.open : null,
        hasEduLabel: bodyText.includes('Estimasi edukasi, bukan data resmi BMKG'),
        hasOsmAttr: bodyText.includes('OpenStreetMap contributors'),
        hasFeltSummary: bodyText.includes('Terasa sampai ±'),
        hasDamagingSummary: bodyText.includes('Mulai merusak ringan'),
        hasGreenClassOnMmi: Boolean(document.querySelector('[aria-label="Ringkasan intensitas guncangan di lokasi Anda"]')?.innerHTML.includes('color-primary') || document.querySelector('[aria-label="Ringkasan intensitas guncangan di lokasi Anda"]')?.innerHTML.includes('color-success')),
      };
    `);
    assertCheck('details_closed_by_default', defaultCheck.detailsOpen === false, `open=${defaultCheck.detailsOpen}`);
    assertCheck('mandatory_labels_present', defaultCheck.hasEduLabel && defaultCheck.hasOsmAttr && defaultCheck.hasFeltSummary && defaultCheck.hasDamagingSummary, JSON.stringify(defaultCheck));
    assertCheck('no_green_or_success_on_mmi_badge', !defaultCheck.hasGreenClassOnMmi, `hasGreen=${defaultCheck.hasGreenClassOnMmi}`);

    // Screenshot 1: Peta default 1440 & 390
    await saveShot(page, '04-revisi-peta-default-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(page, '04-revisi-peta-default-390.png', { width: 390, height: 844, mobile: true, fullPage: true });

    // Kembalikan ke desktop dan uji Detail lanjutan dalam mode Kustom -> "Pilih tipe lokasi untuk melihat indikator tsunami"
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    await page.evalExpr(`document.querySelector('details summary').click();`);
    await sleep(300);
    const kustomTsunamiText = await page.evalExpr(`return document.body.innerText.includes('Pilih tipe lokasi untuk melihat indikator tsunami');`);
    assertCheck('kustom_location_unselected_prompt', kustomTsunamiText, `promptVisible=${kustomTsunamiText}`);
    await page.evalExpr(`document.querySelector('details summary').click();`);
    await sleep(200);

    // Uji 0 API/DB calls saat berinteraksi dengan kontrol (termasuk keyboard) + > 300 km jarak aktual (412 km)
    state.trackApi = true;
    const beforeKeyboardMag = await page.evalExpr(`return document.getElementById('sim-mag-input')?.value;`);
    await page.evalExpr(`
      const magSlider = document.querySelector('input[type="range"]');
      if (magSlider) magSlider.focus();
    `);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await sleep(150);
    const afterKeyboardMag = await page.evalExpr(`return document.getElementById('sim-mag-input')?.value;`);
    assertCheck('keyboard_slider_adjusts_magnitude', beforeKeyboardMag !== afterKeyboardMag, `before=${beforeKeyboardMag} after=${afterKeyboardMag}`);

    // Uji keyboard-only gerakkan marker Anda (tombol arah 15 km + fokus tombol)
    const distBeforeMarkerKey = await page.evalExpr(`return document.getElementById('sim-dist-input')?.value;`);
    const foundEastBtn = await page.evalExpr(`
      const eastBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent + ' ' + (b.getAttribute('aria-label') || '')).toLowerCase().includes('ke timur')
      );
      if (!eastBtn) return false;
      eastBtn.focus();
      return true;
    `);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(200);
    const distAfterMarkerKey = await page.evalExpr(`return document.getElementById('sim-dist-input')?.value;`);
    assertCheck('keyboard_marker_move_changes_distance', foundEastBtn && distBeforeMarkerKey !== distAfterMarkerKey, `found=${foundEastBtn} before=${distBeforeMarkerKey} after=${distAfterMarkerKey}`);

    await setReactInputValue(page, '#sim-mag-input', '6.7');
    await setReactInputValue(page, '#sim-dist-input', '120');
    await page.evalExpr(`
      const deepBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Menengah'));
      deepBtn.click();
    `);
    await sleep(300);
    // Uji jarak > 300 km dengan input koordinat manual pengamat (~412 km timur dari default episentrum)
    await page.evalExpr(`document.querySelector('details summary').click();`);
    await sleep(200);
    await setReactInputValue(page, '#sim-obs-lon', '110.72');
    await sleep(400);
    const dist412Visible = await page.evalExpr(`
      const txt = document.body.innerText;
      return txt.includes('412 km') || /41[0-9] km/.test(txt);
    `);
    const distNotice412 = await page.evalExpr(`return document.body.innerText.includes('di luar rentang kalibrasi');`);
    assertCheck('observer_beyond_300_actual_km_shown', dist412Visible && distNotice412, `dist412Visible=${dist412Visible}`);
    assertCheck('zero_api_calls_on_controls', state.apiUrlsDuringPlay.length === 0, `apiCalls=${state.apiUrlsDuringPlay.length}`);
    state.trackApi = false;

    // Tutup Detail & Reset
    await page.evalExpr(`document.querySelector('details summary').click();`);
    await sleep(200);

    // Screenshot 2: Preset Palu (1440 & 390)
    const paluOptionVal = await page.evalExpr(`
      const opts = Array.from(document.querySelectorAll('#preset-select option'));
      const palu = opts.find((o) => /palu/i.test(o.textContent));
      return palu ? palu.value : null;
    `);
    assertCheck('preset_palu_found', Boolean(paluOptionVal), `value=${paluOptionVal}`);
    await setReactInputValue(page, '#preset-select', paluOptionVal);
    await sleep(800);
    await saveShot(page, '04-revisi-peta-palu-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(page, '04-revisi-peta-palu-390.png', { width: 390, height: 844, mobile: true, fullPage: true });

    // Screenshot 3: M 7,5 Laut (buka Detail lanjutan -> pilih Laut -> tunjukkan indikator Berpotensi tsunami)
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await setReactInputValue(page, '#sim-mag-input', '7.5');
    await page.evalExpr(`
      const shallowBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Dangkal'));
      shallowBtn.click();
      document.querySelector('details summary').click();
    `);
    await sleep(300);
    await page.evalExpr(`
      const lautBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Laut');
      lautBtn.click();
    `);
    await sleep(600);
    const m75LautOk = await page.evalExpr(`return document.body.innerText.includes('Berpotensi') || document.body.innerText.includes('Kriteria tsunami terpenuhi');`);
    assertCheck('m75_laut_tsunami_indicator', m75LautOk, `tsunamiVisible=${m75LautOk}`);
    await saveShot(page, '04-revisi-peta-m75-laut-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(page, '04-revisi-peta-m75-laut-390.png', { width: 390, height: 844, mobile: true, fullPage: true });

    // Tutup details & pilih Preset Aceh (M 9,1 -> TANPA lingkaran!)
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.evalExpr(`document.querySelector('details summary').click();`);
    const acehVal = await page.evalExpr(`
      const opts = Array.from(document.querySelectorAll('#preset-select option'));
      const aceh = opts.find((o) => /aceh/i.test(o.textContent));
      return aceh ? aceh.value : null;
    `);
    assertCheck('preset_aceh_found', Boolean(acehVal), `value=${acehVal}`);
    await setReactInputValue(page, '#preset-select', acehVal);
    await sleep(800);
    const acehCheck = await page.evalExpr(`
      const paths = document.querySelectorAll('.leaflet-overlay-pane path');
      return {
        circlePathCount: paths.length,
        hasNoExtrapolationMsg: document.body.innerText.includes('tidak dapat diperkirakan (di luar rentang kalibrasi)'),
      };
    `);
    assertCheck('aceh_no_radius_circles', acehCheck.circlePathCount === 0 && acehCheck.hasNoExtrapolationMsg, JSON.stringify(acehCheck));
    await saveShot(page, '04-revisi-peta-aceh-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(page, '04-revisi-peta-aceh-390.png', { width: 390, height: 844, mobile: true, fullPage: true });

    // Cek multi-width Peta dampak overflow (320, 375, 390, 414, 768, 1024, 1280, 1440, 1920)
    const WIDTHS = [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
    for (const w of WIDTHS) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: w < 768,
      });
      await sleep(250);
      const ov = await page.evalExpr(`return { w: window.innerWidth, sw: document.documentElement.scrollWidth };`);
      report.overflowWidths.push({ mode: 'peta', ...ov });
      assertCheck(`overflow_peta_${w}`, ov.sw <= ov.w, `scrollWidth=${ov.sw} innerWidth=${ov.w}`);
    }

    // 2. Uji keyboard-only pemilih mode ("Peta dampak" -> "Getaran 3D") & Jalur 3D
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await setReactInputValue(page, '#preset-select', 'kustom');
    await setReactInputValue(page, '#sim-mag-input', '7.2');
    await setReactInputValue(page, '#sim-dist-input', '25');
    await sleep(300);

    // Keyboard: focus tab-mode-peta lalu tekan ArrowRight
    await page.evalExpr(`document.getElementById('tab-mode-peta').focus();`);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await sleep(1800); // Tunggu chunk dinamis Three.js terunduh & WebGL render frame awal

    const after3DChunks = [...state.scriptUrls];
    report.chunksAfter3DOpen = after3DChunks;
    const loadedThreeNow = after3DChunks.some((u) => /b536a0f1|bd904a5c|three/i.test(u));
    assertCheck('three_chunk_loaded_only_when_3d_opened', loadedThreeNow, `scriptsAfter=${after3DChunks.length}`);

    const threeUiCheck = await page.evalExpr(`
      const canvas = document.querySelector('#panel-mode-3d canvas');
      const txt = document.body.innerText;
      return {
        hasCanvas: Boolean(canvas && canvas.width > 0 && canvas.height > 0),
        hasSceneLabel: txt.includes('Ilustrasi getaran, bukan simulasi kekuatan bangunan'),
        hasComfortWarning: txt.includes('Animasi getaran. Hentikan jika tidak nyaman.'),
        hasBmkgSeparation: txt.includes('Sumber: Skala MMI BMKG') && txt.includes('Ilustrasi SIGAP'),
        tab3dFocusedAndSelected: document.activeElement?.id === 'tab-mode-3d' && document.getElementById('tab-mode-3d').getAttribute('aria-selected') === 'true',
      };
    `);
    assertCheck('3d_keyboard_switch_and_ui_present', Object.values(threeUiCheck).every(Boolean), JSON.stringify(threeUiCheck));

    // Uji keyboard-only mulai getaran (Enter pada tombol Mulai getaran)
    await page.evalExpr(`
      const startBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Mulai getaran'));
      startBtn.focus();
    `);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(3800); // Fase gelombang S sedang berlangsung

    await saveShot(page, '04-revisi-3d-playing-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });

    // Uji performa ponsel 390px dengan CPU throttle 4x selama animasi berjalan!
    await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await page.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await sleep(400);
    // Pastikan memutar ulang bila animasi keburu selesai
    await page.evalExpr(`
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Mulai getaran') || b.textContent.includes('Putar ulang getaran'));
      if (btn && !btn.disabled) btn.click();
    `);
    await sleep(500);
    const fpsResult = await page.evalExpr(`
      const times = [];
      await new Promise((resolve) => {
        const start = performance.now();
        function step(now) {
          times.push(now);
          if (now - start >= 2200) return resolve();
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      const deltas = [];
      for (let i = 1; i < times.length; i++) deltas.push(times[i] - times[i - 1]);
      const avgDt = deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);
      const maxDt = Math.max(...deltas);
      return {
        frames: times.length,
        avgFps: Number((1000 / avgDt).toFixed(1)),
        worstFrameMs: Number(maxDt.toFixed(1)),
      };
    `);
    report.mobile390Fps = fpsResult;
    console.log('Mobile 390px 4x-CPU FPS metric:', fpsResult);
    assertCheck('mobile_390_3d_fps_acceptable', fpsResult.avgFps >= 20, JSON.stringify(fpsResult));

    await saveShot(page, '04-revisi-3d-mobile-390.png', { width: 390, height: 844, mobile: true, fullPage: true });
    await page.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    // Kembali desktop, pastikan sedang berjalan lalu hentikan via keyboard (Enter pada Berhenti) & capture stopped state
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.evalExpr(`
      const replayBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Mulai getaran') || b.textContent.includes('Putar ulang getaran'));
      if (replayBtn && !replayBtn.disabled) replayBtn.click();
    `);
    await sleep(300);
    const hasStopFocused = await page.evalExpr(`
      const stopBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Berhenti'));
      if (!stopBtn) return false;
      stopBtn.focus();
      return true;
    `);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(400);
    const stoppedCheck = await page.evalExpr(`return document.body.innerText.includes('Siap diputar');`);
    assertCheck('3d_stopped_cleanly', hasStopFocused && stoppedCheck, `hasStopFocused=${hasStopFocused} readyTextVisible=${stoppedCheck}`);
    await saveShot(page, '04-revisi-3d-stopped-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });

    // Cek multi-width overflow pada Mode 3D
    for (const w of WIDTHS) {
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: w < 768,
      });
      await sleep(200);
      const ov = await page.evalExpr(`return { w: window.innerWidth, sw: document.documentElement.scrollWidth };`);
      report.overflowWidths.push({ mode: '3d', ...ov });
      assertCheck(`overflow_3d_${w}`, ov.sw <= ov.w, `scrollWidth=${ov.sw} innerWidth=${ov.w}`);
    }

    report.osmInterceptTotal += state.osmInterceptCount;
    report.consoleErrors.push(...state.consoleErrors);
    page.close();

    // 3. Sesi kedua: Simulasi WebGL tidak tersedia -> fallback bersih tanpa error
    const noGlTab = await attachTarget(browserCdp, debugPort, { disableWebgl: true });
    await noGlTab.page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await noGlTab.page.send('Page.navigate', { url: `${BASE_URL}/simulasi` });
    await sleep(1600);
    await noGlTab.page.evalExpr(`document.getElementById('tab-mode-3d').click();`);
    await sleep(1200);
    const fallbackVisible = await noGlTab.page.evalExpr(`
      return document.body.innerText.includes('Visualisasi 3D (WebGL) tidak tersedia di peramban ini');
    `);
    assertCheck('webgl_unavailable_fallback_renders', fallbackVisible, `fallbackVisible=${fallbackVisible}`);
    await saveShot(noGlTab.page, '04-revisi-3d-no-webgl-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(noGlTab.page, '04-revisi-3d-no-webgl-390.png', { width: 390, height: 844, mobile: true, fullPage: true });
    report.osmInterceptTotal += noGlTab.state.osmInterceptCount;
    report.consoleErrors.push(...noGlTab.state.consoleErrors);
    noGlTab.page.close();

    // 4. Sesi ketiga: Simulasi Tile gagal dimuat (offline/OSM down) -> "Peta tidak dapat dimuat" + teks ringkasan tetap tampil
    const tileFailTab = await attachTarget(browserCdp, debugPort, { failOsmTiles: true });
    await tileFailTab.page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await tileFailTab.page.send('Page.navigate', { url: `${BASE_URL}/simulasi` });
    await sleep(2200);
    const tileErrCheck = await tileFailTab.page.evalExpr(`
      const txt = document.body.innerText;
      return {
        hasErrorBanner: txt.includes('Peta tidak dapat dimuat'),
        hasSummaryPreserved: txt.includes('Terasa sampai ±') && txt.includes('Mulai merusak ringan'),
      };
    `);
    assertCheck('tile_error_banner_and_text_summary_intact', tileErrCheck.hasErrorBanner && tileErrCheck.hasSummaryPreserved, JSON.stringify(tileErrCheck));
    await saveShot(tileFailTab.page, '04-revisi-tile-error-1440.png', { width: 1440, height: 900, mobile: false, fullPage: true });
    await saveShot(tileFailTab.page, '04-revisi-tile-error-390.png', { width: 390, height: 844, mobile: true, fullPage: true });
    report.osmInterceptTotal += tileFailTab.state.osmInterceptCount;
    tileFailTab.page.close();

    assertCheck('zero_runtime_console_errors', report.consoleErrors.length === 0, JSON.stringify(report.consoleErrors));

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    browserCdp.close();
    chrome.kill();
    srv.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
