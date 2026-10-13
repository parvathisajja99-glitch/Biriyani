// ==========================================================================
// BIRYANI CHALLENGE - MAIN APPLICATION ENGINE
// Handles live voting, gang simulation, distance filters, decider wheel & slang
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
});

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
    
    // Distance filter
    if (maxDistanceKm < 20 && dist > maxDistanceKm) return false;

    // Meat filter
    if (meatFilter !== "all" && !spot.meatTypes.includes(meatFilter)) return false;

    // Vibe filter
    if (vibeFilter === "lateNight" && !spot.lateNight) return false;
    if (vibeFilter === "valet" && spot.parkingType !== "valet") return false;
    if (vibeFilter === "underground" && !spot.badge.toLowerCase().includes("gem") && !spot.badge.toLowerCase().includes("cult")) return false;

    // Search query
    if (searchQuery) {
      const matchName = spot.name.toLowerCase().includes(searchQuery);
      const matchArea = spot.area.toLowerCase().includes(searchQuery);
      const matchSpecialty = spot.specialties.some(s => s.toLowerCase().includes(searchQuery));
      if (!matchName && !matchArea && !matchSpecialty) return false;
    }

    return true;
  }).sort((a, b) => {
    // Primary: highest votes
    if (b.votes !== a.votes) return b.votes - a.votes;
    // Secondary: closest distance
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

    // Trigger funny slang error notification
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

    // Parking pill details
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
  // Check for rate limiting spam clicks
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

  // Toggle behavior
  if (currentVote === delta) {
    // Unvote
    spot.votes -= delta;
    delete userVoteHistory[spotId];
  } else {
    // New vote or flip
    spot.votes += (delta - currentVote);
    userVoteHistory[spotId] = delta;
    slangEngine.playSound('vote');
  }

  // Special banter check for Meridian
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

// Street Slang Parking Alert Trigger
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

// Street Slang Traffic Warning Trigger
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

// ==========================================================================
// SIMULATE LIVE GANG VOTING & BANTER CHAT
// ==========================================================================
function startGangSimulation() {
  // Trigger periodic banter every 14 seconds
  simulationInterval = setInterval(() => {
    triggerSingleGangVote();
  }, 14000);
}

function triggerSingleGangVote() {
  const randomSpot = spotsState[Math.floor(Math.random() * spotsState.length)];
  const randomMember = GANG_MEMBERS[Math.floor(Math.random() * GANG_MEMBERS.length)];
  
  // 80% chance upvote, 20% chance downvote
  const isUp = Math.random() > 0.2;
  randomSpot.votes += isUp ? 1 : -1;

  // Add chat bubble
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

  // Keep max 8 bubbles
  while (container.children.length > 8) {
    container.removeChild(container.lastChild);
  }
}

// ==========================================================================
// DECIDER WHEEL: "SPIN THE BIRYANI HANDI"
// ==========================================================================
let wheelCanvas = null;
let wheelCtx = null;
let currentRotation = 0;
let wheelSegments = [];

const WHEEL_COLORS = [
  "#ff7700", "#d97706", "#be123c", "#4f46e5", "#059669", "#7c3aed", "#b45309", "#dc2626"
];

function initDeciderWheel() {
  wheelCanvas = document.getElementById("wheelCanvas");
  if (!wheelCanvas) return;
  wheelCtx = wheelCanvas.getContext("2d");
  updateHandiSegments();
}

function updateHandiSegments() {
  if (!wheelCanvas) return;
  // Pick top 6 spots
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

    // Text label
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

  // Center Handi Emblem
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

  // Random spin amount (between 5 and 9 full rotations + random angle)
  const extraRotations = 5 + Math.random() * 4;
  const targetAngle = currentRotation + extraRotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const duration = 4000;
  const startAngle = currentRotation;
  const startTime = performance.now();

  function animateSpin(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
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
  // Determine winner: Top pointer is at -PI/2 (12 o'clock)
  const numSegs = wheelSegments.length;
  const arcSize = (2 * Math.PI) / numSegs;
  const normalizedRotation = (currentRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  // Pointer is at angle 3*PI/2 (or -PI/2)
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

// Preset Slang test runner
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
