(function () {
  'use strict';

  // ── Prevent duplicate injection ──────────────────────────
  if (document.getElementById('arb-auto-panel')) return;

  // ── SELECTORS ────────────────────────────────────────────
  const SEL = {
    item   : 'div.item',
    price  : 'div.mb6.x-row.x-row-middle.amount',
    buyBtn : 'button.van-button.x-btn',
  };

  // ── STATE ────────────────────────────────────────────────
  let running    = false;
  let observer   = null;
  let interval   = null;
  let clickCount = 0;

  // ── UI ───────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'arb-auto-panel';
  panel.setAttribute('style', `
    position: fixed !important;
    top: 100px !important;
    right: 10px !important;
    width: 200px !important;
    z-index: 999999999 !important;
    background: #000 !important;
    color: #fff !important;
    padding: 15px !important;
    border: 2px solid #FAC10C !important;
    border-radius: 10px !important;
    font-family: monospace !important;
    box-shadow: 0 0 20px rgba(250, 193, 12, 0.5) !important;
  `);

  panel.innerHTML = `
    <div style="font-size:14px;font-weight:bold;margin-bottom:10px;color:#FAC10C;text-align:center;letter-spacing:2px;">
      ⚡ AUTO BUYER
    </div>
    <input
      id="arb-target"
      type="number"
      placeholder="Amount ₹"
      style="width:100% !important;background:#111 !important;color:#fff !important;border:1px solid #FAC10C !important;
             margin-bottom:10px !important;padding:8px !important;border-radius:5px !important;box-sizing:border-box !important;
             font-size:14px !important;outline:none !important;"
    />
    <button id="arb-start"
      style="width:100% !important;background:#28a745 !important;color:#fff !important;border:none !important;
             padding:10px !important;margin-bottom:8px !important;border-radius:5px !important;
             font-weight:bold !important;cursor:pointer !important;font-size:13px !important;">
      ▶ START
    </button>
    <button id="arb-stop"
      style="width:100% !important;background:#dc3545 !important;color:#fff !important;border:none !important;
             padding:10px !important;margin-bottom:8px !important;border-radius:5px !important;font-weight:bold !important;
             cursor:pointer !important;font-size:13px !important;">
      ■ STOP
    </button>
    <div id="arb-status"
      style="margin-top:10px;font-size:11px;color:#888;text-align:center;
             min-height:18px;padding:5px;background:#111;border-radius:4px;border:1px solid #333;">
      ● Idle
    </div>
    <div id="arb-log"
      style="margin-top:8px;font-size:9px;color:#666;max-height:80px;overflow-y:auto;
             background:#111;border:1px solid #333;border-radius:4px;padding:5px;">
    </div>
  `;

  // ── HELPERS ──────────────────────────────────────────────
  function setStatus(msg, color = '#FAC10C') {
    const el = document.getElementById('arb-status');
    if (el) { 
      el.textContent = msg; 
      el.style.color = color; 
    }
  }

  function addLog(msg) {
    const log = document.getElementById('arb-log');
    if (!log) return;
    const d = document.createElement('div');
    const t = new Date().toLocaleTimeString();
    d.textContent = `[${t}] ${msg}`;
    d.style.padding = '2px 0';
    d.style.borderBottom = '1px solid #333';
    log.prepend(d);
    while (log.children.length > 6) log.removeChild(log.lastChild);
  }

  // ── CORE: scan all items, click match ─────────────────────
  function scanAndClick(target) {
    const items = document.querySelectorAll(SEL.item);
    for (const item of items) {
      const priceEl = item.querySelector(SEL.price);
      const buyBtn  = item.querySelector(SEL.buyBtn);
      if (!priceEl || !buyBtn) continue;

      const val = priceEl.textContent.replace(/[^\d.]/g, '').trim();

      // Fix: Convert to number for proper comparison
      if (parseFloat(val) === parseFloat(target)) {
        // Visual feedback
        buyBtn.style.boxShadow = '0 0 15px 5px #00ff00';
        priceEl.style.background = '#ffff00';
        priceEl.style.color = '#000';

        buyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Click with delay
        setTimeout(() => {
          buyBtn.click();
          clickCount++;
          const msg = `✔ Clicked #${clickCount} @ ₹${val}`;
          setStatus(msg, '#2ecc71');
          addLog(msg);
        }, 100);

        return true;
      }
    }
    return false;
  }

  // ── Event Listeners ──────────────────────────────────────
  function attachEventListeners() {
    const startBtn = document.getElementById('arb-start');
    const stopBtn = document.getElementById('arb-stop');

    if (startBtn) {
      startBtn.onclick = () => {
        const target = document.getElementById('arb-target').value.trim();
        if (!target || isNaN(Number(target))) {
          setStatus('⚠ Enter amount', '#e74c3c');
          addLog('Invalid amount entered');
          return;
        }

        if (running) stop();

        running    = true;
        clickCount = 0;
        setStatus('● Scanning…', '#FAC10C');
        addLog(`Started — watching for ₹${target}`);

        startBtn.textContent = 'RUNNING…';
        startBtn.style.background = '#555';
        startBtn.disabled = true;

        // Immediate scan
        scanAndClick(target);

        // MutationObserver
        const container = document.querySelector('div.x-arb')
                       || document.getElementById('app')
                       || document.body;

        observer = new MutationObserver((mutations) => {
          if (!running) return;
          if (mutations.some(m => m.addedNodes.length > 0 || m.type === 'characterData')) {
            scanAndClick(target);
          }
        });

        observer.observe(container, {
          childList: true, subtree: true, characterData: true
        });

        // Interval fallback
        interval = setInterval(() => {
          if (running) scanAndClick(target);
        }, 250);
      };
    }

    if (stopBtn) {
      stopBtn.onclick = stop;
    }
  }

  function stop() {
    running = false;
    if (observer) { observer.disconnect(); observer = null; }
    if (interval) { clearInterval(interval); interval = null; }

    const startBtn = document.getElementById('arb-start');
    if (startBtn) {
      startBtn.textContent = '▶ START';
      startBtn.style.background = '#28a745';
      startBtn.disabled = false;
    }
    setStatus('■ Stopped', '#aaa');
    addLog('Observer stopped');
  }

  // ── Initialize ───────────────────────────────────────────
  function initPanel() {
    if (!document.body) {
      setTimeout(initPanel, 50);
      return;
    }
    try {
      document.body.appendChild(panel);
      attachEventListeners();
      console.log('✅ ARB Auto Buyer loaded successfully!');
      addLog('Panel loaded');
    } catch (e) {
      console.error('❌ Failed to load panel:', e);
    }
  }

  // Wait for DOM ready or execute immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanel);
  } else {
    initPanel();
  }

})();
