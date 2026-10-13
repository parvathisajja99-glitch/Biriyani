// ==========================================================================
// BIRYANI CHALLENGE - MAIN APPLICATION ENGINE
// Handles live voting, gang simulation, distance filters, decider wheel,
// 1v1 Battle Royale, Meridian Raita Mini-Game, Dawat Bill Splitter & Quiz
// ==========================================================================

let spotsState = JSON.parse(JSON.stringify(BIRYANI_SPOTS));
let currentHub = "banjara";
let maxDistanceKm = 20; // 20km = show all
let meatFilter = "all";
let vibeFilter = "all";
let searchQuery = "";
let userVoteHistory = {}; // spotId -> 1 or -1
let voteClickTimestamps = []; // for rate limiting detection
let simulationInterval = null;
let wheelSpinning = false;

// Gang Members for live banter
const GANG_MEMBERS = [
  { name: "Salman", color: "#db2777", avatar: "S" },
  { name: "Priya", color: "#ea580c", avatar: "P" },
  { name: "Asif", color: "#059669", avatar: "A" },
  { name: "Sneha", color: "#2563eb", avatar: "Sn" },
  { name: "Imran", color: "#7c3aed", avatar: "I" },
  { name: "Bunny", color: "#e11d48", avatar: "B" }
];

const GANG_QUOTES = [
  { member: "Salman", spotId: "meridian", text: "Bhai Meridian chalte, par raita mat maangna koi bhi! Purana kissa yaad hai na?" },
  { member: "Priya", spotId: "sarvi", text: "Begumpet pe bohot jam hai yaaron, Sarvi Road 11 fix karo, parking bhi aasan hai." },
  { member: "Asif", spotId: "shah-ghouse", text: "Raat ke 1:00 AM ho rahe, Shah Ghouse Tolichowki ka fresh degh khula hoga!" },
  { member: "Sneha", spotId: "cafe-bahar", text: "Cafe Bahar ka double masala mutton biryani kha ke cutting Irani chai peete!" },
  { member: "Bunny", spotId: "chichas", text: "Chicha's chalo bhai, Tala Hua Gosht aur shaadi wali Khatti Dal ka maza aayega!" },
  { member: "Imran", spotId: "hotel-shadab", text: "Old city ka asli zafran chahiye toh seedha Shadab, auto pakad ke niklo!" },
  { member: "Salman", spotId: "hotel-rumaan", text: "Rumaan ka spicy dum biryani aakhri rehta, pocket pe bhi light hai!" },
  { member: "Asif", spotId: "mandi-36", text: "Jubilee Hills side chalte, Mandi 36 pe royal mutton juicy platter udate!" }
];

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initHubSelector();
  setupEventListeners();
  renderSpots();
  initDeciderWheel();
  startGangSimulation();

  // Initialize interactive sub-features
  rollNewBattle();
  resetRaitaSim();
  calculateDawatSplit();
  initQuiz();
});

// Navigation Tab Switcher
window.switchTab = function(tabId) {
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `view-${tabId}`);
  });
};

// Setup starting location hubs
function initHubSelector() {
  const select = document.getElementById("hubSelect");
  if (!select) return;

  select.innerHTML = HYD_HUBS.map(h => 
    `<option value="${h.id}" ${h.id === currentHub ? 'selected' : ''}>${h.name}</option>`
  ).join('');

  select.addEventListener("change", (e) => {
    currentHub = e.target.value;
    renderSpots();
  });
}

// Setup all controls
function setupEventListeners() {
  // Distance Slider
  const distSlider = document.getElementById("distSlider");
  const distLabel = document.getElementById("distLabel");
  if (distSlider && distLabel) {
    distSlider.addEventListener("input", (e) => {
      maxDistanceKm = parseFloat(e.target.value);
      if (maxDistanceKm >= 20) {
        distLabel.textContent = "Anywhere in Hyd";
      } else {
        distLabel.textContent = `Within ${maxDistanceKm} km`;
      }
      renderSpots();
    });
  }

  // Meat Chips
  document.querySelectorAll(".chip[data-meat]").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip[data-meat]").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      meatFilter = chip.dataset.meat;
      renderSpots();
    });
  });

  // Vibe Chips
  document.querySelectorAll(".chip[data-vibe]").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip[data-vibe]").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      vibeFilter = chip.dataset.vibe;
      renderSpots();
    });
  });

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderSpots();
    });
  }

  // Simulate Gang Vote Button
  const btnSimulate = document.getElementById("btnSimulateGang");
  if (btnSimulate) {
    btnSimulate.addEventListener("click", () => {
      triggerSingleGangVote();
    });
  }

  // Spin Handi Wheel Button
  const btnSpin = document.getElementById("btnSpinWheel");
  if (btnSpin) {
    btnSpin.addEventListener("click", openDeciderModal);
  }

  // Close Modal Button
  const btnCloseModal = document.getElementById("btnCloseModal");
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", closeDeciderModal);
  }

  // Toggle Sizzle Simmer Audio
  const btnToggleSizzle = document.getElementById("btnToggleSizzle");
  const sizzleStatus = document.getElementById("sizzleStatus");
  if (btnToggleSizzle && sizzleStatus) {
    btnToggleSizzle.addEventListener("click", () => {
      const active = slangEngine.toggleDumSizzle();
      sizzleStatus.textContent = active ? "ON 🔥" : "OFF";
      sizzleStatus.style.color = active ? "#10b981" : "#cbd5e1";
    });
  }

  // Custom Roaster Input & Button
  const btnRoast = document.getElementById("btnRoastCustom");
  const roastInput = document.getElementById("customRoasterInput");
  if (btnRoast && roastInput) {
    btnRoast.addEventListener("click", () => {
      const txt = roastInput.value.trim();
      if (!txt) {
        slangEngine.showToast("Khaali Message?", "Arey chicha! Kuch likho toh sahi! Khali input pe baigan ka translation doon kya?", "Pro-Tip: Enter any error like '404' or 'Traffic Jam'");
        return;
      }
      const res = slangEngine.translate(txt);
      slangEngine.showToast(`Transformation: ${res.category}`, res.slang, res.tip, res.category);
    });

    roastInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btnRoast.click();
    });
  }
}

// Filter and sort spots
function getFilteredSpots() {
  return spotsState.filter(spot => {
    const dist = spot.distances[currentHub] || 99;
    
    if (maxDistanceKm < 20 && dist > maxDistanceKm) return false;
    if (meatFilter !== "all" && !spot.meatTypes.includes(meatFilter)) return false;
    if (vibeFilter === "lateNight" && !spot.lateNight) return false;
    if (vibeFilter === "valet" && spot.parkingType !== "valet") return false;
    if (vibeFilter === "underground" && !spot.badge.toLowerCase().includes("gem") && !spot.badge.toLowerCase().includes("cult")) return false;

    if (searchQuery) {
      const matchName = spot.name.toLowerCase().includes(searchQuery);
      const matchArea = spot.area.toLowerCase().includes(searchQuery);
      const matchSpecialty = spot.specialties.some(s => s.toLowerCase().includes(searchQuery));
      if (!matchName && !matchArea && !matchSpecialty) return false;
    }

    return true;
  }).sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    const distA = a.distances[currentHub] || 99;
    const distB = b.distances[currentHub] || 99;
    return distA - distB;
  });
}

// Render Spot Cards
function renderSpots() {
  const container = document.getElementById("spotsContainer");
  const countTag = document.getElementById("resultsCount");
  if (!container) return;

  const filtered = getFilteredSpots();
  if (countTag) countTag.textContent = `${filtered.length} Spot${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--saffron-500);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🍲💨</div>
        <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem;">
          Baigan Mein Miladiye Pura Search!
        </h3>
        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem auto;">
          Itna filter laga diye ki Hyderabad mein ek bhi degh nahi bachi! Thoda distance slider badao ya 'Anywhere in Hyd' choose karo chicha!
        </p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;

    slangEngine.showToast(
      "ERROR 404: No Biryani Found",
      "Baigan mein miladiye pura search filter! Itna nakhre kare toh ghar pe baith ke Maggie bana ke khao! Thoda distance badao jaldi!",
      "Pro-Tip: Reset filters to discover all 12 secret local gems!",
      "EMPTY_SEARCH"
    );
    return;
  }

  container.innerHTML = filtered.map((spot, index) => {
    const dist = spot.distances[currentHub] || 99;
    const distClass = dist <= 3.5 ? 'dist-close' : (dist <= 7.5 ? 'dist-mid' : 'dist-far');
    const isFirst = index === 0;
    const userVote = userVoteHistory[spot.id] || 0;

    let parkingLabel = "🚗 Moderate Parking";
    let parkingClass = "parking-moderate";
    if (spot.parkingType === "nightmare") {
      parkingLabel = "🚨 Car Parking Nightmare (Auto/Bike Only)";
      parkingClass = "parking-nightmare";
    } else if (spot.parkingType === "valet") {
      parkingLabel = "🅿️ Valet Available";
      parkingClass = "parking-valet";
    }

    return `
      <div class="spot-card ${isFirst ? 'ranked-1' : ''}" id="card-${spot.id}">
        <!-- Left: Vote Controls -->
        <div class="vote-col">
          <div class="rank-badge">${isFirst ? '👑 #1' : `#${index + 1}`}</div>
          <button class="vote-btn up ${userVote === 1 ? 'active' : ''}" 
                  onclick="handleVote('${spot.id}', 1)" 
                  title="Upvote for gang dinner" 
                  aria-label="Upvote ${spot.name}">▲</button>
          <div class="vote-tally" id="votes-${spot.id}">${spot.votes}</div>
          <button class="vote-btn down ${userVote === -1 ? 'active' : ''}" 
                  onclick="handleVote('${spot.id}', -1)" 
                  title="Downvote" 
                  aria-label="Downvote ${spot.name}">▼</button>
        </div>

        <!-- Center: Spot Details -->
        <div class="spot-info">
          <div class="spot-header-line">
            <span class="spot-name">${spot.name}</span>
            <span class="spot-area">${spot.area}</span>
            <span class="spot-badge-pill">${spot.badge}</span>
          </div>
          <div class="spot-tagline">"${spot.tagline}"</div>
          
          <div class="secret-tip-box">
            <strong>🔥 Insider Secret:</strong> ${spot.secretTip}
          </div>

          <div class="spot-meta-row">
            <span class="meta-pill ${distClass}">
              📍 ${dist} km from current hub
            </span>
            <span class="meta-pill ${parkingClass}" onclick="triggerParkingWarning('${spot.id}')" title="Click for street parking reality">
              ${parkingLabel}
            </span>
            <span class="meta-pill" style="color: #f59e0b;">
              🌶️ ${spot.spiceLevel}
            </span>
            <span class="meta-pill" style="color: #a78bfa;">
              💰 ${spot.priceForTwo} for 2
            </span>
            ${spot.lateNight ? `<span class="meta-pill" style="color: #34d399; border-color: rgba(52, 211, 153, 0.3);">🌙 Open till ${spot.closingTime}</span>` : ''}
          </div>
        </div>

        <!-- Right: Distance & Slang Warning Triggers -->
        <div class="action-col">
          <div class="distance-callout">
            <div class="distance-km">${dist} <span style="font-size: 0.8rem; font-weight: 500;">KM</span></div>
            <div class="distance-sub">estimated route</div>
          </div>
          <button class="btn-roast-alert" onclick="triggerTrafficWarning('${spot.id}')">
            🚦 Check Traffic Jaam
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Reset filters handler
window.resetFilters = function() {
  maxDistanceKm = 20;
  meatFilter = "all";
  vibeFilter = "all";
  searchQuery = "";
  const distSlider = document.getElementById("distSlider");
  const distLabel = document.getElementById("distLabel");
  const searchInput = document.getElementById("searchInput");
  if (distSlider) distSlider.value = 20;
  if (distLabel) distLabel.textContent = "Anywhere in Hyd";
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".chip").forEach(c => {
    if (c.dataset.meat === "all" || c.dataset.vibe === "all") {
      c.classList.add("active");
    } else {
      c.classList.remove("active");
    }
  });
  renderSpots();
};

// Handle Upvote / Downvote
window.handleVote = function(spotId, delta) {
  const now = Date.now();
  voteClickTimestamps.push(now);
  voteClickTimestamps = voteClickTimestamps.filter(t => now - t < 2500);

  if (voteClickTimestamps.length >= 4) {
    slangEngine.showToast(
      "ERROR 429: Too Many Requests",
      "Ustaad! Ek second mein pachas baar button dabare? Thoda dumm maaro chicha, biryani degh mein se nikalne time lagta!",
      "Pro-Tip: Ek sip Irani Chai lo, vote araam se register karo!",
      "RATE_LIMIT"
    );
    return;
  }

  const spot = spotsState.find(s => s.id === spotId);
  if (!spot) return;

  const currentVote = userVoteHistory[spotId] || 0;

  if (currentVote === delta) {
    spot.votes -= delta;
    delete userVoteHistory[spotId];
  } else {
    spot.votes += (delta - currentVote);
    userVoteHistory[spotId] = delta;
    slangEngine.playSound('vote');
  }

  if (spotId === "meridian" && delta === 1 && Math.random() < 0.3) {
    setTimeout(() => {
      slangEngine.showToast(
        "Meridian Upvoted! 🔥",
        "Meridian choose kare toh khabardar! Wahan extra raita mat maangna! Double salan lo aur aish karo!",
        "Pro-Tip: Double Masala Single Rice is the true secret code.",
        "RAITA_DISPUTE"
      );
    }, 400);
  }

  renderSpots();
  updateHandiSegments();
};

// Parking & Traffic alerts
window.triggerParkingWarning = function(spotId) {
  const spot = spotsState.find(s => s.id === spotId);
  if (!spot) return;

  slangEngine.showToast(
    `Parking Alert: ${spot.name}`,
    spot.parkingSlang,
    "Pro-Tip: Auto/Rapido pakad ke jao ya metro se walk karo!",
    "PARKING"
  );
};

window.triggerTrafficWarning = function(spotId) {
  const spot = spotsState.find(s => s.id === spotId);
  if (!spot) return;

  slangEngine.showToast(
    `Traffic Check: ${spot.trafficHotspot}`,
    spot.trafficSlang,
    `Route passes through ${spot.trafficHotspot}. Check Google Maps before rolling!`,
    "TRAFFIC"
  );
};

// Live Gang Banter
function startGangSimulation() {
  simulationInterval = setInterval(() => {
    triggerSingleGangVote();
  }, 14000);
}

function triggerSingleGangVote() {
  const randomSpot = spotsState[Math.floor(Math.random() * spotsState.length)];
  const randomMember = GANG_MEMBERS[Math.floor(Math.random() * GANG_MEMBERS.length)];
  
  const isUp = Math.random() > 0.2;
  randomSpot.votes += isUp ? 1 : -1;

  const quote = GANG_QUOTES.find(q => q.spotId === randomSpot.id) || {
    text: isUp 
      ? `Bhai ${randomSpot.name} chalte na, zabardast dum biryani rehti wahan!` 
      : `${randomSpot.name} nakko bhai, wahan bohot crowd rehta hai!`
  };

  addGangChatBubble(randomMember.name, quote.text);
  renderSpots();
  updateHandiSegments();
}

function addGangChatBubble(name, text) {
  const container = document.getElementById("gangChatBox");
  if (!container) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.innerHTML = `
    <div class="chat-author">
      <span>${name}</span>
      <span class="chat-time">${timeStr}</span>
    </div>
    <div class="chat-msg">${text}</div>
  `;

  container.insertBefore(bubble, container.firstChild);

  while (container.children.length > 8) {
    container.removeChild(container.lastChild);
  }
}

// Decider Wheel
let wheelCanvas = null;
let wheelCtx = null;
let currentRotation = 0;
let wheelSegments = [];
const WHEEL_COLORS = ["#ff7700", "#d97706", "#be123c", "#4f46e5", "#059669", "#7c3aed", "#b45309", "#dc2626"];

function initDeciderWheel() {
  wheelCanvas = document.getElementById("wheelCanvas");
  if (!wheelCanvas) return;
  wheelCtx = wheelCanvas.getContext("2d");
  updateHandiSegments();
}

function updateHandiSegments() {
  if (!wheelCanvas) return;
  const sorted = [...spotsState].sort((a, b) => b.votes - a.votes);
  wheelSegments = sorted.slice(0, 6);
  drawWheel(currentRotation);
}

function drawWheel(angle) {
  if (!wheelCtx || !wheelSegments.length) return;
  const ctx = wheelCtx;
  const width = wheelCanvas.width;
  const height = wheelCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 10;
  const numSegs = wheelSegments.length;
  const arcSize = (2 * Math.PI) / numSegs;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  for (let i = 0; i < numSegs; i++) {
    const segAngle = i * arcSize;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, segAngle, segAngle + arcSize);
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#14111b";
    ctx.stroke();

    ctx.save();
    ctx.rotate(segAngle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Outfit, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(wheelSegments[i].name.slice(0, 16), radius - 15, 5);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, 2 * Math.PI);
  ctx.fillStyle = "#1e1929";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fbbf24";
  ctx.stroke();

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 18px Cinzel, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DUM", 0, 0);

  ctx.restore();
}

function openDeciderModal() {
  const modal = document.getElementById("deciderModal");
  if (!modal) return;
  modal.classList.add("active");
  updateHandiSegments();
}

function closeDeciderModal() {
  const modal = document.getElementById("deciderModal");
  if (!modal) return;
  modal.classList.remove("active");
}

window.spinHandiWheel = function() {
  if (wheelSpinning || !wheelSegments.length) return;
  wheelSpinning = true;

  slangEngine.playSound('spin');

  const spinBtn = document.getElementById("btnTriggerSpin");
  if (spinBtn) spinBtn.disabled = true;

  const extraRotations = 5 + Math.random() * 4;
  const targetAngle = currentRotation + extraRotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const duration = 4000;
  const startAngle = currentRotation;
  const startTime = performance.now();

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    currentRotation = startAngle + (targetAngle - startAngle) * easeOut;

    drawWheel(currentRotation);

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      wheelSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      finishWheelSpin();
    }
  }

  requestAnimationFrame(animateSpin);
};

function finishWheelSpin() {
  const numSegs = wheelSegments.length;
  const arcSize = (2 * Math.PI) / numSegs;
  const normalizedRotation = (currentRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const pointerAngle = (3 * Math.PI / 2 - normalizedRotation + 2 * Math.PI) % (2 * Math.PI);
  const winningIndex = Math.floor(pointerAngle / arcSize) % numSegs;
  const winner = wheelSegments[winningIndex];

  slangEngine.playSound('winner');

  const verdictBox = document.getElementById("verdictContainer");
  if (verdictBox) {
    verdictBox.style.display = "block";
    verdictBox.innerHTML = `
      <div style="font-size: 0.8rem; font-weight: 800; color: var(--gold-400); text-transform: uppercase; letter-spacing: 1px;">
        🎉 THE FINAL BIRYANI VERDICT IS HERE!
      </div>
      <h2 style="font-family: var(--font-royal); font-size: 1.7rem; color: #fff; margin: 6px 0;">
        ${winner.name}
      </h2>
      <div style="color: var(--saffron-400); font-weight: 600; margin-bottom: 8px;">
        📍 ${winner.area} • "${winner.tagline}"
      </div>
      <div style="font-size: 0.88rem; color: #e2e8f0; margin-bottom: 12px; line-height: 1.5;">
        ${winner.secretTip}
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; color: #fca5a5; margin-bottom: 12px;">
        ⚠️ <strong>Reality Check:</strong> ${winner.parkingSlang}
      </div>
      <button class="btn btn-gold btn-sm" onclick="copyGangPlan('${winner.name}', '${winner.area}')">
        📋 Copy WhatsApp Message for Gang
      </button>
    `;
  }
}

window.copyGangPlan = function(name, area) {
  const text = `🚨 GANG DECISION FINALISED! 🚨\nBhai arguments khatam karo! We are going to ${name} (${area})!\nAsli Hyderabadi Dum Biryani fix hai.\n\nWarning: Car parking ka lafda hai, bike pe aao ya metro pakdo!`;
  navigator.clipboard.writeText(text).then(() => {
    slangEngine.showToast("Copied to Clipboard!", "Gang ke group mein paste kardo aur seedha gaadi start karo!", "Message ready to paste on WhatsApp!");
  }).catch(() => {
    alert(text);
  });
};

window.testSlangError = function(errorKey) {
  const rule = SLANG_RULES.find(r => r.category === errorKey);
  if (!rule) return;
  slangEngine.showToast(
    `Boring: "${rule.boringSample}"`,
    rule.hyderabadiSlang,
    rule.adviceTip,
    rule.category
  );
};

// ==========================================================================
// 1v1 BATTLE ROYALE SHOWDOWN LOGIC
// ==========================================================================
let currentFighterA = null;
let currentFighterB = null;
let battleRound = 1;

window.rollNewBattle = function() {
  const idxA = Math.floor(Math.random() * spotsState.length);
  let idxB = Math.floor(Math.random() * spotsState.length);
  while (idxB === idxA) {
    idxB = Math.floor(Math.random() * spotsState.length);
  }

  currentFighterA = spotsState[idxA];
  currentFighterB = spotsState[idxB];

  renderFighter("fighterACard", currentFighterA);
  renderFighter("fighterBCard", currentFighterB);

  const roundEl = document.getElementById("battleRoundNum");
  if (roundEl) roundEl.textContent = battleRound;
};

function renderFighter(elementId, fighter) {
  const card = document.getElementById(elementId);
  if (!card || !fighter) return;

  const stats = fighter.battleStats || { masala: 90, tenderness: 90, raitaRisk: 20, trafficHell: 80 };

  card.innerHTML = `
    <div>
      <span class="fighter-badge">${fighter.badge}</span>
      <div class="fighter-emoji">${fighter.emoji || '🍲'}</div>
      <div class="fighter-name">${fighter.name}</div>
      <div class="fighter-area">📍 ${fighter.area}</div>
      <div class="fighter-quote">"${fighter.memeQuote || fighter.tagline}"</div>

      <div class="stat-bars-box">
        <div class="stat-row">
          <div class="stat-labels"><span>🌶️ Masala Power</span><span>${stats.masala}%</span></div>
          <div class="stat-track"><div class="stat-fill fill-masala" style="width: ${stats.masala}%;"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-labels"><span>🍖 Mutton Tenderness</span><span>${stats.tenderness}%</span></div>
          <div class="stat-track"><div class="stat-fill fill-tender" style="width: ${stats.tenderness}%;"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-labels"><span>🥣 Raita Danger Level</span><span>${stats.raitaRisk}%</span></div>
          <div class="stat-track"><div class="stat-fill fill-risk" style="width: ${stats.raitaRisk}%;"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-labels"><span>🚦 Traffic Hell Score</span><span>${stats.trafficHell}%</span></div>
          <div class="stat-track"><div class="stat-fill fill-traffic" style="width: ${stats.trafficHell}%;"></div></div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="voteBattleFighter('${fighter.id}')">
      💥 VOTE THIS SPOT (+1 W)
    </button>
  `;
}

window.voteBattleFighter = function(fighterId) {
  const winner = spotsState.find(s => s.id === fighterId);
  if (!winner) return;

  winner.votes += 2;
  battleRound += 1;

  slangEngine.playSound('smash');

  slangEngine.showToast(
    `🥊 ROUND WON BY ${winner.name}!`,
    `Aakhri dawat! ${winner.name} scored a knockout victory! Next clash rolling now...`,
    `Current Gang Votes: ${winner.votes}`,
    "BATTLE_ROYALE"
  );

  renderSpots();
  updateHandiSegments();

  setTimeout(() => {
    rollNewBattle();
  }, 900);
};

// ==========================================================================
// MERIDIAN RAITA RISK MINI-GAME LOGIC
// ==========================================================================
let raitaTension = 0; // 0 to 100
let raitaClicksCount = 0;
let raitaGameOver = false;

window.handleAskRaita = function() {
  if (raitaGameOver) return;

  raitaClicksCount++;
  // Each click increases tension by 22-30%
  const bump = Math.floor(Math.random() * 9) + 22;
  raitaTension = Math.min(100, raitaTension + bump);

  updateRaitaDisplay();

  if (raitaTension >= 100) {
    // Game over: Explosion / Alert!
    raitaGameOver = true;
    slangEngine.playSound('explosion');

    document.getElementById("raitaPortrait").textContent = "🚨👮‍♂️💥";
    document.getElementById("raitaDialogue").innerHTML = `
      <span style="color: #ef4444; font-weight: 800;">
        BAIGAN EMERGENCY! Waiter yelled "KHATAM HO GAYA!"<br>
        Police Crane arrived outside Meridian to tow your bike! Full lafda scene!
      </span>
    `;

    slangEngine.showToast(
      "DISASTER AT MERIDIAN!",
      "Arey miya, bola tha na raita mat maangna! Manager ne dekh liya aur table ka bill double kar diya!",
      "Rule #1 of Hyderabad violated!",
      "RAITA_DISPUTE"
    );
  } else {
    slangEngine.playSound('tension', raitaTension);
  }
};

window.handleBailoutSalan = function() {
  if (raitaGameOver) return;

  if (raitaClicksCount === 0) {
    slangEngine.showToast(
      "Smart Hyderabadi Move!",
      "Risk liya hi nahi! Seedha double salan order kiya aur chain se biryani khaya!",
      "Street IQ: 100/100",
      "PANJAGUTTA_SURVIVOR"
    );
    return;
  }

  slangEngine.playSound('winner');
  raitaGameOver = true;

  document.getElementById("raitaPortrait").textContent = "😎👑✨";
  document.getElementById("raitaDialogue").innerHTML = `
    <span style="color: #10b981; font-weight: 800;">
      SURVIVED WITH GLORY! You stopped at ${raitaTension}% tension.<br>
      Waiter served extra mirchi ka salan with a smile! You unlocked the 'Panjagutta Diplomat' Title!
    </span>
  `;

  slangEngine.showToast(
    "🏆 PANJAGUTTA DIPLOMAT!",
    `Aapne ${raitaClicksCount} baar raita maanga aur sahi time pe double salan leke nikal liye! Full sukoon!`,
    "Achievement Unlocked: Asli Nizami Discretion",
    "SUCCESS"
  );
};

window.resetRaitaSim = function() {
  raitaTension = 0;
  raitaClicksCount = 0;
  raitaGameOver = false;
  updateRaitaDisplay();
  const portrait = document.getElementById("raitaPortrait");
  const dialogue = document.getElementById("raitaDialogue");
  if (portrait) portrait.textContent = "🧑‍🍳";
  if (dialogue) dialogue.textContent = "Waiter: 'Ji bhai, ek plate Mutton Dum Biryani aur garam mirchi ka salan tayyar hai!'";
};

function updateRaitaDisplay() {
  const fill = document.getElementById("raitaMeterFill");
  if (fill) fill.style.width = `${raitaTension}%`;

  const portrait = document.getElementById("raitaPortrait");
  const dialogue = document.getElementById("raitaDialogue");
  if (!portrait || !dialogue || raitaGameOver) return;

  if (raitaTension === 0) {
    portrait.textContent = "🧑‍🍳";
    dialogue.textContent = "Waiter: 'Ji bhai, garam mirchi ka salan ready hai!'";
  } else if (raitaTension < 35) {
    portrait.textContent = "🤨";
    dialogue.textContent = "Waiter: 'Arey bhai... ek bowl diya tha na? Theek hai, ek aur le aao... thoda time lagega.'";
  } else if (raitaTension < 70) {
    portrait.textContent = "😠";
    dialogue.textContent = "Head Waiter joins: 'Chicha! Salan free mein de raha hoon, baar baar raita mat maango... dahi khatam hone pe hai!'";
  } else {
    portrait.textContent = "🤬🔥";
    dialogue.textContent = "Manager at counter is staring at your table! One more click and chaos erupts!";
  }
}

// ==========================================================================
// DAWAT BILL SPLITTER LOGIC
// ==========================================================================
window.calculateDawatSplit = function() {
  const totalBill = parseFloat(document.getElementById("splitTotalBill")?.value) || 2400;
  const gangSize = parseInt(document.getElementById("splitGangSize")?.value) || 5;
  const thumsUp = parseInt(document.getElementById("splitThumsUpCount")?.value) || 4;
  const tip = parseFloat(document.getElementById("splitTipAmount")?.value) || 100;

  const grandTotal = totalBill + tip;
  const drinksCost = thumsUp * 40;
  const foodTotal = Math.max(0, grandTotal - drinksCost);

  // Split calculation:
  // Base share per person
  const baseShare = foodTotal / gangSize;
  const drinksPerDrink = drinksCost / Math.max(1, gangSize - 1); // exclude diet guy from drinks

  // Heavy eater: base + 30% penalty + drinks
  const heavy = Math.round(baseShare * 1.3 + drinksPerDrink);
  // Normal eater: base + drinks
  const normal = Math.round(baseShare + drinksPerDrink);
  // Diet excuser (claims he only ate spoon): pays 40% of base
  const diet = Math.round(baseShare * 0.4);

  const elHeavy = document.getElementById("amtHeavy");
  const elNormal = document.getElementById("amtNormal");
  const elDiet = document.getElementById("amtDiet");

  if (elHeavy) elHeavy.textContent = `₹${heavy}`;
  if (elNormal) elNormal.textContent = `₹${normal}`;
  if (elDiet) elDiet.textContent = `₹${diet}`;
};

window.copyDawatBillMessage = function() {
  const total = document.getElementById("splitTotalBill")?.value || 2400;
  const heavy = document.getElementById("amtHeavy")?.textContent || "₹620";
  const normal = document.getElementById("amtNormal")?.textContent || "₹510";
  const diet = document.getElementById("amtDiet")?.textContent || "₹220";

  const msg = `🧾 HYDERABAD DAWAT HISAB-KITAB 🧾\nTotal Bill: ₹${total}\n\n1. 🍖 Degh Destroyer (Ate 3 shanks): ${heavy}\n2. 🍚 Normal Biryani Bhai: ${normal}\n3. 🥗 "Maine sirf salad chakkha" Excuse: ${diet}\n\nGPAY Jaldi karo bhai, waiter table pe khada hai!`;

  navigator.clipboard.writeText(msg).then(() => {
    slangEngine.showToast("Hisab Copied!", "Gang ke WhatsApp group pe bhejo aur paise wasool karo!", "Bill breakdown copied to clipboard!");
  }).catch(() => alert(msg));
};

// ==========================================================================
// BIRYANI PERSONALITY QUIZ LOGIC
// ==========================================================================
const QUIZ_QUESTIONS = [
  {
    q: "Pait mein kitne chuhe daud rahe hain right now?",
    options: [
      { text: "Bhook se halat kharab hai, seedha heavy dum chahiye!", persona: "HUNTER" },
      { text: "Late night 1:30 AM craving ho rahi hai doston ke saath", persona: "NIGHT_OWL" },
      { text: "Khaane ke baad garam cutting Irani chai aur Osmania zaroori hai", persona: "HERITAGE" },
      { text: "Royal wedding (Dawat) style chahiye with Tala Hua Gosht", persona: "NAWABI" }
    ]
  },
  {
    q: "Parking aur traffic ke baare mein kya plan hai?",
    options: [
      { text: "Car leke jaana hai, valet ya open parking mandatory hai!", persona: "NAWABI" },
      { text: "Bike ya Activa hai chicha, patli se patli gali mein ghus jayenge!", persona: "HUNTER" },
      { text: "Midnight ko traffic kahan rehta? Sidha Tolichowki drive maarenge!", persona: "NIGHT_OWL" },
      { text: "Metro pakad ke chalenge, signal pe nahi fasna!", persona: "HERITAGE" }
    ]
  },
  {
    q: "Raita aur Masala ke baare mein aapka golden rule?",
    options: [
      { text: "Double Masala Single Rice! Raita ka risk nahi lena!", persona: "HUNTER" },
      { text: "Authentic Zafrani aroma, balance spice jo pait na jalaye", persona: "NAWABI" },
      { text: "Full night handi degh ka fresh caramelized onion flavor", persona: "NIGHT_OWL" },
      { text: "Authentic pre-independence vintage masala recipe", persona: "HERITAGE" }
    ]
  }
];

let quizStep = 0;
let quizScores = { HUNTER: 0, NIGHT_OWL: 0, HERITAGE: 0, NAWABI: 0 };

function initQuiz() {
  quizStep = 0;
  quizScores = { HUNTER: 0, NIGHT_OWL: 0, HERITAGE: 0, NAWABI: 0 };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  if (quizStep >= QUIZ_QUESTIONS.length) {
    renderQuizResult();
    return;
  }

  const current = QUIZ_QUESTIONS[quizStep];

  container.innerHTML = `
    <div style="font-size: 0.8rem; font-weight: 700; color: var(--gold-400); margin-bottom: 6px;">
      QUESTION ${quizStep + 1} OF ${QUIZ_QUESTIONS.length}
    </div>
    <div class="quiz-question-title">${current.q}</div>
    <div class="quiz-options-list">
      ${current.options.map(opt => `
        <button class="quiz-option-btn" onclick="answerQuiz('${opt.persona}')">
          <span>👉</span>
          <span>${opt.text}</span>
        </button>
      `).join('')}
    </div>
  `;
}

window.answerQuiz = function(persona) {
  quizScores[persona] = (quizScores[persona] || 0) + 1;
  quizStep++;
  slangEngine.playSound('vote');
  renderQuizQuestion();
};

function renderQuizResult() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  let topPersona = "HUNTER";
  let maxScore = -1;
  for (const [key, val] of Object.entries(quizScores)) {
    if (val > maxScore) {
      maxScore = val;
      topPersona = key;
    }
  }

  const PERSONA_RESULTS = {
    HUNTER: {
      title: "🌶️ The Panjagutta Double-Masala Warrior",
      spotId: "meridian",
      desc: "Aap spice ke deewane hain. Aapko spicy dum chahiye aur aapko pata hai ki extra raita maangne ka risk kabhi nahi lena chahiye!"
    },
    NIGHT_OWL: {
      title: "🌙 The 2:00 AM Degh Hunter",
      spotId: "shah-ghouse",
      desc: "Aapki asli bhook aadhi raat ko jaagti hai. Tolichowki flyover ke niche fresh dum ki khushboo aapka compass hai!"
    },
    HERITAGE: {
      title: "☕ The Basheerbagh Vintage Connoisseur",
      spotId: "cafe-bahar",
      desc: "Aapke liye biryani ek dawat hai jo bina cutting Irani chai aur Osmania biscuit ke adhoori rehti hai!"
    },
    NAWABI: {
      title: "👑 The Pure Nizami Dawat Nawab",
      spotId: "chichas",
      desc: "Aap shaadi-wali Kacchi Dum biryani, Tala Hua Gosht aur Khatti Dal ke deewane hain. Commercial banquet chain aapko pasand nahi!"
    }
  };

  const res = PERSONA_RESULTS[topPersona];
  const matchedSpot = spotsState.find(s => s.id === res.spotId) || spotsState[0];

  slangEngine.playSound('winner');

  container.innerHTML = `
    <div style="text-align: center; padding: 1.5rem; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--gold-400); border-radius: var(--radius-lg);">
      <div style="font-size: 0.8rem; font-weight: 800; color: var(--gold-400); text-transform: uppercase;">
        YOUR OFFICIAL NIZAMI IDENTITY
      </div>
      <h3 style="font-family: var(--font-royal); font-size: 1.8rem; color: #fff; margin: 8px 0;">
        ${res.title}
      </h3>
      <p style="color: #cbd5e1; font-size: 0.92rem; max-width: 500px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
        ${res.desc}
      </p>

      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: left; display: flex; gap: 14px; align-items: center;">
        <div style="font-size: 2.5rem;">${matchedSpot.emoji || '🍲'}</div>
        <div>
          <div style="font-size: 0.75rem; color: var(--saffron-400); font-weight: 700;">YOUR SOUL BIRYANI SPOT:</div>
          <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #fff;">${matchedSpot.name} (${matchedSpot.area})</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${matchedSpot.secretTip}</div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="switchTab('leaderboard')">
          👑 View Spot in War Room
        </button>
        <button class="btn btn-secondary" onclick="initQuiz()">
          🔄 Retake Quiz
        </button>
      </div>
    </div>
  `;
}

// Soundboard speech trigger
window.playSlangSpeech = function(text) {
  slangEngine.speak(text);
  slangEngine.showToast("Voice of Hyderabad 🗣️", text, "Synthesized local voice playing!", "SOUNDBOARD");
};
