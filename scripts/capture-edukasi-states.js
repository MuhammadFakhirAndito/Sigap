/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT_CDP = 9224;
const BASE_URL = process.env.SIGAP_BASE_URL || "http://127.0.0.1:3000";
const MODE = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] || "content";

const WORKSPACE_SCREENSHOTS = path.join(process.cwd(), "docs", "screenshots");
const BRAIN_SCREENSHOTS =
  "C:\\Users\\HYPE R Series\\.gemini\\antigravity\\brain\\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\\screenshots";

const EIGHT_WIDTHS = [320, 390, 480, 640, 768, 1024, 1280, 1440];

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Tidak menemukan browser Chrome/Edge untuk capture CDP.");
}

async function waitForPort(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // tunggu CDP siap
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timeout menunggu CDP di ${url}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve);
      this.ws.addEventListener("error", reject);
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        for (const cb of this.listeners.get(msg.method)) cb(msg.params);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const arr = this.listeners.get(method) || [];
      const fn = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((x) => x !== fn)
        );
        resolve(params);
      };
      arr.push(fn);
      this.listeners.set(method, arr);
    });
  }

  close() {
    this.ws.close();
  }
}

async function auditEightWidths(client, routePath) {
  const results = [];
  for (const width of EIGHT_WIDTHS) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: width < 640,
    });
    const loadPromise = client.once("Page.loadEventFired");
    await client.send("Page.navigate", { url: `${BASE_URL}${routePath}` });
    await loadPromise;
    await new Promise((r) => setTimeout(r, 400));

    const check = await client.send("Runtime.evaluate", {
      expression: `JSON.stringify({
        width: ${width},
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        smallTargets: Array.from(document.querySelectorAll("main a, main button")).map((el) => {
          const r = el.getBoundingClientRect();
          return { text: el.innerText.trim().slice(0, 32), w: Math.round(r.width), h: Math.round(r.height) };
        }).filter(x => x.w > 0 && x.h > 0 && (x.h < 44 || x.w < 44)),
        headings: Array.from(document.querySelectorAll("main h1, main h2, main h3, main h4")).map(h => h.tagName),
        minFontPx: Math.min(...Array.from(document.querySelectorAll("main p, main a, main button, main span, main li")).map(el => parseFloat(getComputedStyle(el).fontSize)).filter(n => !isNaN(n) && n > 0))
      })`,
      returnByValue: true,
    });
    results.push(JSON.parse(check.result.value));
  }
  console.log(`[8-WIDTH AUDIT] ${routePath}:`, JSON.stringify(results));
}

async function captureViewport(client, routePath, width, height, filename) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 640,
  });

  const loadPromise = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: `${BASE_URL}${routePath}` });
  await loadPromise;
  await new Promise((r) => setTimeout(r, 800));

  const layoutMetrics = await client.send("Page.getLayoutMetrics");
  const fullHeight = Math.ceil(
    Math.max(layoutMetrics.cssContentSize.height, height)
  );

  const domAudit = await client.send("Runtime.evaluate", {
    expression: `JSON.stringify({
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      h1: document.querySelector("h1")?.innerText || null,
      navLinks: Array.from(document.querySelectorAll("header nav a")).map(a => a.innerText.trim()).filter(Boolean),
      hasErrorBanner: !!document.querySelector('[role="alert"]') || document.body.innerText.includes("Gagal memuat"),
      bodySnippet: document.body.innerText.replace(/\\s+/g, " ").slice(0, 260)
    })`,
    returnByValue: true,
  });

  const shot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: fullHeight, scale: 1 },
  });

  fs.mkdirSync(WORKSPACE_SCREENSHOTS, { recursive: true });
  fs.mkdirSync(BRAIN_SCREENSHOTS, { recursive: true });
  const buf = Buffer.from(shot.data, "base64");
  const wsPath = path.join(WORKSPACE_SCREENSHOTS, filename);
  const brainPath = path.join(BRAIN_SCREENSHOTS, filename);
  fs.writeFileSync(wsPath, buf);
  fs.writeFileSync(brainPath, buf);

  console.log(`[CAPTURED] ${filename} (${width}x${fullHeight}) -> ${wsPath}`);
  console.log("  DOM:", domAudit.result.value);
}

async function main() {
  const chromePath = findChrome();
  const userDataDir = path.join(process.env.TEMP || "C:\\Temp", `sigap-cdp-${Date.now()}`);
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${PORT_CDP}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let client;
  try {
    const versionInfo = await waitForPort(`http://127.0.0.1:${PORT_CDP}/json/version`);
    const pages = await waitForPort(`http://127.0.0.1:${PORT_CDP}/json/list`);
    const targetWs = pages[0]?.webSocketDebuggerUrl || versionInfo.webSocketDebuggerUrl;
    client = new CdpClient(targetWs);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    const jobs =
      MODE === "db-down"
        ? [
            ["/edukasi", 1440, 900, "04-edukasi-db-mati-desktop-1440.png"],
            ["/edukasi", 390, 844, "04-edukasi-db-mati-mobile-390.png"],
          ]
        : [
            ["/edukasi", 1440, 900, "04-edukasi-ada-konten-desktop-1440.png"],
            ["/edukasi", 390, 844, "04-edukasi-ada-konten-mobile-390.png"],
            ["/edukasi/apa-itu-gempa-bumi", 1440, 900, "04-edukasi-detail-desktop-1440.png"],
            ["/edukasi/apa-itu-gempa-bumi", 390, 844, "04-edukasi-detail-mobile-390.png"],
            ["/edukasi?kategori=LAINNYA", 1440, 900, "04-edukasi-kategori-kosong-desktop-1440.png"],
            ["/edukasi?kategori=LAINNYA", 390, 844, "04-edukasi-kategori-kosong-mobile-390.png"],
          ];

    for (const [route, w, h, name] of jobs) {
      await captureViewport(client, route, w, h, name);
    }

    if (MODE === "content") {
      await auditEightWidths(client, "/edukasi");
      await auditEightWidths(client, "/edukasi/apa-itu-gempa-bumi");
    }
  } finally {
    if (client) client.close();
    chrome.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore temp cleanup failure on Windows
    }
  }
}

main().catch((err) => {
  console.error("[CAPTURE ERROR]", err);
  process.exit(1);
});
