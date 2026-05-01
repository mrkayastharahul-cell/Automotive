(function () {
  'use strict';

  // prevent duplicate run
  if (window.__AUTO_RUNNING__) return;
  window.__AUTO_RUNNING__ = true;

  const CONFIG_URL = "https://raw.githubusercontent.com/mrkayastharahul-cell/Automotive/main/config.json";
  const USERS_URL  = "https://raw.githubusercontent.com/mrkayastharahul-cell/Automotive/main/users.json";

  let config = {};
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
  // CORE SCAN ENGINE
  // =========================
  let clickedSet = new Set();
  let lastClick = 0;

  function scan() {
    if (!config.enabled) return;

    const items = document.querySelectorAll("div.item");

    items.forEach(item => {
      const priceEl = item.querySelector("div.mb6.x-row.x-row-middle.amount");
      const btn = item.querySelector("button");

      if (!priceEl || !btn) return;

      const text = priceEl.innerText;

      // 🔥 FLEXIBLE MATCH (FIXED)
      if (text.includes(config.targetAmount)) {

        // prevent duplicate click
        if (clickedSet.has(text)) return;

        // cooldown (avoid spam detection)
        if (Date.now() - lastClick < 800) return;

        clickedSet.add(text);
        lastClick = Date.now();

        item.style.border = "2px solid red";

        setTimeout(() => {
          btn.click();
          console.log("✔ CLICKED:", text);
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

    // run scan continuously
    setInterval(scan, 500);

    // reset memory periodically (avoid blocking)
    setInterval(() => {
      clickedSet.clear();
    }, 5000);

    console.log("🚀 AUTO RUNNING");
  }

  start();

})();
