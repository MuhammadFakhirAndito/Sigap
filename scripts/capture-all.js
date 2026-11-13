const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOCS_DIR = path.resolve(__dirname, '../docs/screenshots');
const BRAIN_DIR = 'C:\\Users\\HYPE R Series\\.gemini\\antigravity\\brain\\3b527663-5cd5-4b3e-a840-9d2a12d6dcf6\\screenshots';

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_DIR)) fs.mkdirSync(BRAIN_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Starting headless Chrome on port 9222...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--hide-scrollbars',
    'about:blank',
  ]);

  // Wait for port 9222 to be ready
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
    await sleep(250);
  }

  if (!versionData || !versionData.webSocketDebuggerUrl) {
    chromeProcess.kill();
    throw new Error('Failed to connect to Chrome remote debugging port.');
  }

  console.log('Connected to Chrome WebSocket:', versionData.webSocketDebuggerUrl);
  const ws = new WebSocket(versionData.webSocketDebuggerUrl);

  let messageId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    const id = messageId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Create new target for page
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const pageRes = await fetch(`http://localhost:9222/json`);
  const pages = await pageRes.json();
  const pageTarget = pages.find((p) => p.id === targetId);

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  const pagePending = new Map();
  let pageMsgId = 1;

  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pagePending.has(msg.id)) {
      const { resolve, reject } = pagePending.get(msg.id);
      pagePending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => (pageWs.onopen = resolve));

  function pageSend(method, params = {}) {
    const id = pageMsgId++;
    return new Promise((resolve, reject) => {
      pagePending.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await pageSend('Page.enable');
  await pageSend('DOM.enable');

  async function takeScreenshot(name, { width, height, mobile, fullPage }) {
    console.log(`Setting viewport: ${width}x${height} (mobile=${mobile})...`);
    await pageSend('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: !!mobile,
    });

    console.log('Navigating to http://localhost:3000...');
    await pageSend('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500); // Wait for Fast Refresh and render

    console.log(`Capturing screenshot ${name}...`);
    const { data } = await pageSend('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: !!fullPage,
    });

    const buffer = Buffer.from(data, 'base64');
    const docsPath = path.join(DOCS_DIR, name);
    const brainPath = path.join(BRAIN_DIR, name);

    fs.writeFileSync(docsPath, buffer);
    fs.writeFileSync(brainPath, buffer);
    console.log(`Saved ${name} (${buffer.length} bytes)`);
  }

  try {
    // 1. Desktop 1440 fold
    await takeScreenshot('01-beranda-desktop-1440-card-improved.png', {
      width: 1440,
      height: 900,
      mobile: false,
      fullPage: false,
    });

    // 2. Desktop 1440 full
    await takeScreenshot('01-beranda-desktop-1440-full.png', {
      width: 1440,
      height: 900,
      mobile: false,
      fullPage: true,
    });

    // 2b. Desktop 1920 full
    await takeScreenshot('01-beranda-desktop-1920-full.png', {
      width: 1920,
      height: 1080,
      mobile: false,
      fullPage: true,
    });

    // 3. Mobile 390 fold
    await takeScreenshot('01-beranda-mobile-390-card-improved.png', {
      width: 390,
      height: 844,
      mobile: true,
      fullPage: false,
    });

    // 4. Mobile 390 full
    await takeScreenshot('01-beranda-mobile-390-full.png', {
      width: 390,
      height: 844,
      mobile: true,
      fullPage: true,
    });
  } finally {
    pageWs.close();
    ws.close();
    chromeProcess.kill();
  }
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
