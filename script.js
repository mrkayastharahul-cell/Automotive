(function () {
  'use strict';

  if (window.__AUTO_RUNNING__) return;
  window.__AUTO_RUNNING__ = true;

  const CONFIG_URL = "https://raw.githubusercontent.com/mrkayastharahul-cell/Automotive/main/config.json";
  const USERS_URL  = "https://raw.githubusercontent.com/mrkayastharahul-cell/Automotive/main/users.json";

  let config = { enabled: false, targetAmount: "" };
  let userId = localStorage.getItem("auto_user_id");

  if (!userId) {
    userId = "user_" + Math.random().toString(36).slice(2);
    localStorage.setItem("auto_user_id", userId);
  }

  console.log("👤 USER ID:", userId);

  // =========================
  // LOAD CONFIG + USERS
  // =========================
  async function loadData() {
    try {
      const [confRes, userRes] = await Promise.all([
        fetch(CONFIG_URL + "?t=" + Date.now()),
        fetch(USERS_URL + "?t=" + Date.now())
      ]);

      config = await confRes.json();
      const users = await userRes.json();

      if (!users.allowedUsers.includes(userId)) {
        console.log("❌ ACCESS DENIED");
        return false;
      }

      console.log("✅ ACCESS GRANTED");
      return true;

    } catch (e) {
      console.log("❌ LOAD ERROR", e);
      return false;
    }
  }

  // =========================
  // UI PANEL
  // =========================
  function createUI() {
    if (document.getElementById('auto-ui')) return;

    const box = document.createElement('div');
    box.id = 'auto-ui';
    box.style = `
      position:fixed;
      top:120px;
      right:10px;
      width:220px;
      background:#000;
      color:#fff;
      padding:12px;
      border-radius:10px;
      z-index:999999;
      font-family:monospace;
      border:2px solid #00ffcc;
    `;

    box.innerHTML = `
      <div style="text-align:center;margin-bottom:8px;color:#00ffcc">
        ⚡ AUTO BOT
      </div>

      <input id="auto-target" placeholder="Amount"
        style="width:100%;margin-bottom:8px;padding:6px;background:#111;color:#fff;border:1px solid #00ffcc"/>

      <button id="auto-start" style="width:100%;margin-bottom:5px;background:#28a745;color:#fff;border:none;padding:8px">
        START
      </button>

      <button id="auto-stop" style="width:100%;background:#dc3545;color:#fff;border:none;padding:8px">
        STOP
      </button>

      <div id="auto-status" style="margin-top:6px;font-size:11px;text-align:center;color:#aaa">
        Idle
      </div>

      <div id="auto-log" style="margin-top:6px;font-size:10px;max-height:80px;overflow:auto;color:#666"></div>
    `;

    document.body.appendChild(box);

    document.getElementById("auto-start").onclick = () => {
      const val = document.getElementById("auto-target").value.trim();
      if (!val) return;

      config.targetAmount = val;
      config.enabled = true;

      setStatus("Running...");
      log("Started for ₹" + val);
    };

    document.getElementById("auto-stop").onclick = () => {
      config.enabled = false;
      setStatus("Stopped");
      log("Stopped");
    };
  }

  function setStatus(text) {
    const el = document.getElementById("auto-status");
    if (el) el.innerText = text;
  }

  function log(msg) {
    const logBox = document.getElementById("auto-log");
    if (!logBox) return;

    const d = document.createElement("div");
    d.textContent = msg;
    logBox.prepend(d);

    while (logBox.children.length > 6) {
      logBox.removeChild(logBox.lastChild);
    }
  }

  // =========================
  // CORE ENGINE
  // =========================
  let clickedSet = new Set();
  let lastClick = 0;

  function scan() {
    if (!config.enabled || !config.targetAmount) return;

    const items = document.querySelectorAll("div.item");

    items.forEach(item => {
      const priceEl = item.querySelector("div.mb6.x-row.x-row-middle.amount");
      const btn = item.querySelector("button");

      if (!priceEl || !btn) return;

      const raw = priceEl.innerText;
      const value = raw.replace(/[^\d]/g, '');

      if (value === String(config.targetAmount)) {

        if (clickedSet.has(raw)) return;
        if (Date.now() - lastClick < 800) return;

        clickedSet.add(raw);
        lastClick = Date.now();

        item.style.border = "2px solid red";

        setTimeout(() => {
          btn.click();
          log("✔ Clicked ₹" + value);
          setStatus("Clicked ₹" + value);
        }, 120);
      }
    });
  }

  // =========================
  // START SYSTEM
  // =========================
  async function start() {
    const allowed = await loadData();
    if (!allowed) return;

    createUI();

    setInterval(scan, 400);

    setInterval(() => {
      clickedSet.clear();
    }, 5000);

    console.log("🚀 AUTO RUNNING");
  }

  start();

})();
