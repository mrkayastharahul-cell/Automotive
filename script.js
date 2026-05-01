let running = false;
let interval;
let targetAmount = 100; // change this

// Create UI panel
const panel = document.createElement('div');
panel.style = `
position:fixed;
top:100px;
right:10px;
z-index:9999;
background:#000;
color:#fff;
padding:10px;
border-radius:10px;
font-size:14px;
`;

panel.innerHTML = `
<div>Target: ₹<input id="amt" value="100" style="width:60px"></div>
<button id="start">Start</button>
<button id="stop">Stop</button>
`;

document.body.appendChild(panel);

// Start
document.getElementById("start").onclick = () => {
  targetAmount = document.getElementById("amt").value;
  running = true;

  interval = setInterval(() => {
    if (!running) return;

    let amounts = document.querySelectorAll(".amount");

    amounts.forEach(el => {
      let text = el.innerText.replace(/[^\d]/g, '');

      if (text == targetAmount) {
        el.style.background = "yellow";

        let buyBtn = el.closest("div")?.querySelector("button");

        if (buyBtn) {
          buyBtn.style.background = "red";
          buyBtn.scrollIntoView({behavior:"smooth", block:"center"});
        }
      }
    });

  }, 300); // fast refresh
};

// Stop
document.getElementById("stop").onclick = () => {
  running = false;
  clearInterval(interval);
};
