// Hyderabadi Street Slang Error Transformation Engine
// Implements the text rules to convert dry, corporate error messages into funny Dakhni local street slang.

const SLANG_RULES = [
  {
    category: "PARKING",
    keywords: ["parking", "valet", "vehicle", "car", "spot", "garage", "lot"],
    boringSample: "ERROR 403: No parking space available at destination.",
    hyderabadiSlang: "Arey Miya! Udhar car leke gaye toh seedha Challan katega ya auto wale se ghamasaan lafda! Bike pe aao ya metro pakdo, idhar car parking baigan mein milti!",
    adviceTip: "Pro-Tip: Park at nearest metro station or take Rapido/Auto!"
  },
  {
    category: "TRAFFIC",
    keywords: ["traffic", "congestion", "delay", "route", "jam", "commute", "roadblock"],
    boringSample: "ALERT 504: Route delayed by heavy vehicular traffic.",
    hyderabadiSlang: "Begumpet signal aur Panjagutta flyover pe aakhri level jaam hai bhai! Pait mein chuhe daud rahe toh idhar nakko jao, raste mein bhook se behosh hojate!",
    adviceTip: "Pro-Tip: Take inner galli route or pick a spot within 3 km!"
  },
  {
    category: "RAITA_DISPUTE",
    keywords: ["raita", "curd", "side", "gravy", "extra", "condiment"],
    boringSample: "WARNING: User requested additional side condiment (Raita).",
    hyderabadiSlang: "Khabardar! Meridian mein extra raita maangne ka nai ustaad! Purana kissa yaad hai na? Chupchap double mirchi ka salan maango aur chup raho!",
    adviceTip: "Pro-Tip: In Hyderabad, biryani salan is free, peace of mind is priceless!"
  },
  {
    category: "EMPTY_SEARCH",
    keywords: ["not found", "no results", "404", "empty", "zero", "filter"],
    boringSample: "ERROR 404: No restaurants match specified search criteria.",
    hyderabadiSlang: "Baigan mein miladiye pura search filter! Itna nakhre kare toh ghar pe baith ke Maggie bana ke khao! Thoda distance badao jaldi!",
    adviceTip: "Pro-Tip: Sliders badao ya 'Anywhere in Hyd' pe click karo!"
  },
  {
    category: "RATE_LIMIT",
    keywords: ["rate limit", "too many", "spam", "429", "fast", "frequent"],
    boringSample: "ERROR 429: Too many voting requests submitted in short time.",
    hyderabadiSlang: "Ustaad! Ek second mein pachas baar button dabare? Thoda dumm maaro chicha, biryani degh mein se nikalne time lagta!",
    adviceTip: "Pro-Tip: Ek sip Irani Chai lo, vote process ho raha hai!"
  },
  {
    category: "TIE_VOTE",
    keywords: ["tie", "stalemate", "equal", "undecided", "split", "50-50"],
    boringSample: "CONFLICT: Group vote resulted in a tie. Decision deadlock.",
    hyderabadiSlang: "Arey dono barabar aagaye! Dawat mein lafda karwate kya pottey? Toss chodo, seedha Handi Spinner ghuma ke kissa khatam karo!",
    adviceTip: "Pro-Tip: Click 'Spin Handi Wheel' for the divine Biryani Verdict!"
  },
  {
    category: "LOCATION_DENIED",
    keywords: ["location", "permission", "gps", "geo", "denied", "disabled"],
    boringSample: "ERROR 401: Geolocation permission denied by client.",
    hyderabadiSlang: "GPS band karke biryani dhoond rahe? Kya re pottey, James Bond banre kya? Location on karo ya hub dropdown se Ameerpet select karo!",
    adviceTip: "Pro-Tip: Select a starting hub like Banjara or Hitec above!"
  },
  {
    category: "TOURIST_TRAP",
    keywords: ["paradise", "chain", "commercial", "tourist", "generic"],
    boringSample: "WARNING: Non-authentic commercial chain selected.",
    hyderabadiSlang: "Arey miya, tourist banre kya? Cardboard biryani khana hai toh jao! Asli Hyderabadi Shadab, Bahar, ya Chicha's jaate!",
    adviceTip: "Pro-Tip: Trust the secret local list, AI doesn't know what it's missing!"
  },
  {
    category: "OUT_OF_STOCK",
    keywords: ["sold out", "closed", "stock", "exhausted", "unavailable"],
    boringSample: "ERROR 410: Biryani handi has been depleted.",
    hyderabadiSlang: "Arey degh khali hogayi chicha! Handi ka tala chawal bhi saaf kardiye public! Jaldi doosra spot select karo varna bhooke sote!",
    adviceTip: "Pro-Tip: Switch to late night 2 AM spots like Shah Ghouse or Rumaan!"
  }
];

class SlangEngine {
  constructor() {
    this.audioCtx = null;
  }

  // Initialize Web Audio API on first user gesture
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  // Play synthesized retro tones
  playSound(type) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === 'vote') {
        // High cheery ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'slang-alert') {
        // Funny Hyderabad rickshaw double-horn buzz
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(260, now);
        osc2.frequency.setValueAtTime(390, now);
        osc1.frequency.setValueAtTime(320, now + 0.08);
        osc2.frequency.setValueAtTime(480, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } else if (type === 'spin') {
        // Click sound for wheel spin
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'winner') {
        // Royal celebratory arpeggio
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.35);
        });
      }
    } catch (e) {
      console.warn("Audio playback not allowed yet", e);
    }
  }

  // Translate boring message into Hyderabadi street slang
  translate(inputMessage) {
    if (!inputMessage || typeof inputMessage !== "string") {
      return SLANG_RULES[0].hyderabadiSlang;
    }

    const lower = inputMessage.toLowerCase();

    // Check each rule's keywords
    for (const rule of SLANG_RULES) {
      const match = rule.keywords.some(kw => lower.includes(kw));
      if (match) {
        return {
          category: rule.category,
          original: inputMessage,
          slang: rule.hyderabadiSlang,
          tip: rule.adviceTip
        };
      }
    }

    // Default fallback slang for generic unhandled errors
    return {
      category: "GENERIC_CHAOS",
      original: inputMessage,
      slang: `Arey baap re! Kya hua re miya? Error bol raha hai '${inputMessage}'. Baigan ke baatan chodo, handi fresh mangwao sab theek hojata!`,
      tip: "Pro-Tip: Ek baar refresh maaro ya seedha biryani khane niklo!"
    };
  }

  // Show a rich animated toast notification in the UI
  showToast(title, slangText, tipText, category = "ALERTTT") {
    this.playSound('slang-alert');

    let container = document.getElementById('slang-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'slang-toast-container';
      container.className = 'slang-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'slang-toast animate-slide-in';
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-badge">🔥 HYDERABADI STREET ALERT</span>
        <span class="toast-cat">${category}</span>
        <button class="toast-close" aria-label="Close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
      <div class="toast-title">${title}</div>
      <div class="toast-slang">${slangText}</div>
      ${tipText ? `<div class="toast-tip">💡 ${tipText}</div>` : ''}
    `;

    container.appendChild(toast);

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 400);
    }, 7000);
  }
}

const slangEngine = new SlangEngine();
