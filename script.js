(function () {
  'use strict';

  if (window.__AUTO_RUNNING__) return;
  window.__AUTO_RUNNING__ = true;

  const CONFIG_URL = "https://raw.githubusercontent.com/mrkayastharahul-cell/Automotive/main/config.json";

  let config = {};
  let running = false;
  let observer = null;
  let interval = null;
  let clickCount = 0;
  let clickedSet = new Set();

  async function loadConfig() {
    try {
      const res = await fetch(CONFIG_URL + "?t=" + Date.now());
      config = await res.json();
      console.log("⚙️ Config:", config);
    } catch {
      console.log("❌ Config load failed");
    }
  }

  function scan() {
    if (!config.enabled) return;

    const items = document.querySelectorAll("div.item");

    items.forEach(item => {
      const priceEl = item.querySelector("div.mb6.x-row.x-row-middle.amount");
      const btn = item.querySelector("button.van-button.x-btn");

      if (!priceEl || !btn) return;

      const val = parseFloat(priceEl.textContent.replace(/[^\d.]/g, ''));

      if (
        val === config.targetAmount &&
        !clickedSet.has(item) &&
        clickCount < (config.maxClicks || 999)
      ) {
        clickedSet.add(item);

        if (config.highlight) {
          btn.style.boxShadow = "0 0 10px lime";
        }

        const delay =
          Math.random() *
            (config.clickDelayMax - config.clickDelayMin) +
          config.clickDelayMin;

        setTimeout(() => {
          btn.click();
          clickCount++;
          console.log(`✔ Clicked ₹${val} (${clickCount})`);
        }, delay);
      }
    });
  }

  async function start() {
    await loadConfig();

    if (!config.enabled) return;

    running = true;
    clickCount = 0;
    clickedSet.clear();

    scan();

    observer = new MutationObserver(() => {
      if (running) scan();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    interval = setInterval(() => {
      if (running) scan();
    }, config.scanInterval || 300);

    setInterval(loadConfig, 10000);
  }

  start();
})();
