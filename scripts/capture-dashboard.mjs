import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const chrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const cookieLine = (await readFile(".smoke-cookies.txt", "utf8")).split(/\r?\n/).find((line) => line.includes("sb-127-auth-token"));
if (!cookieLine) throw new Error("Smoke-test auth cookie was not found");
const fields = cookieLine.split("\t");
const cookie = { name: fields[5], value: fields[6], domain: "127.0.0.1", path: "/" };

const browser = spawn(chrome, [
  "--headless=new",
  "--hide-scrollbars",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=9223",
  `--user-data-dir=${process.cwd()}\\.chrome-smoke`,
], { stdio: "ignore" });

async function retry(fn) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { return await fn(); } catch { await new Promise((resolve) => setTimeout(resolve, 250)); }
  }
  throw new Error("Chrome DevTools did not become ready");
}

try {
  const target = await retry(async () => {
    const response = await fetch("http://127.0.0.1:9223/json/new?http://127.0.0.1:3000/dashboard", { method: "PUT" });
    if (!response.ok) throw new Error("Target creation failed");
    return response.json();
  });
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++sequence;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send("Network.enable");
  await send("Network.setCookie", cookie);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:3000/dashboard" });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
  if (result.error || !result.result?.data) throw new Error(result.error?.message || "Screenshot failed");
  await writeFile("dashboard-final.png", Buffer.from(result.result.data, "base64"));
  socket.close();
} finally {
  browser.kill();
}
