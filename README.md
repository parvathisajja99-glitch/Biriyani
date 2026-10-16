# 🍲 The Hyderabadi Biryani War Room (agenttt)

> **"End The Group Argument: Where's The Best Biryani Right Now?"**  
> A hyper-local, high-stakes micro-application crafted to settle Hyderabad's eternal group dining disputes with live crowd-voting, distance filters, secret underground food joints, and authentic Dakhni street slang error rules.

---

## 🚀 Live Demo & Getting Started

### Prerequisites
- Node.js (v16+) installed.

### Run Locally
```bash
# Clone the repository
git clone https://github.com/karthikdoguparthi/agenttt.git
cd agenttt

# Start the local server
node server.js
```
Open **[http://localhost:3000/](http://localhost:3000/)** in your browser.

---

## ✨ Features & Modules

### 1. 👑 Live War Room & Leaderboard
- **Crowd-Voting System**: Live upvoting and downvoting with real-time score ranking.
- **Dynamic Distance Filter**: Real-time kilometer calculation from 6 major starting hubs (*Banjara Hills, Ameerpet, HITEC City, Gachibowli, Charminar, Secunderabad*).
- **Meat & Spice Filters**: Filter by Mutton, Chicken, and Spice Level (Mild to Fiery 5/5).
- **Simulate Gang Voting**: One-click simulation of 5 friends casting randomized votes.
- **Handi Decider Wheel**: Spin the wheel to break 50-50 stalemates.

### 2. 🤫 12 Curated Underground Cult Spots
Generic AI recommends tourist traps; this app features authentic local joints:
1. **Meridian Restaurant** (Panjagutta) – *The High-Stakes Double Masala Cult*
2. **Cafe Bahar** (Hyderguda / Basheerbagh) – *The Basheerbagh Heritage OG*
3. **Shah Ghouse** (Tolichowki) – *The 2 AM Mutton Midnight Lifesaver*
4. **Hotel Shadab** (Ghansi Bazaar / Old City) – *The Nizam-Era Dawn Champion*
5. **Chicha's** (Masab Tank) – *The Late-Night Youth Hub*
6. **Hotel Rumaan** (Tolichowki) – *The Budget Student Haven*
7. **Grand Hotel** (Abids) – *The 1935 Abids Classic*
8. **Peshawar** (Malakpet) – *The Dakhni Zafrani Secret*
9. **Mohammedia Biryani** (Mallepally) – *The Underground Spiced Gem*
10. **Hotel Sohail** (Malakpet) – *The Old-School Dum Perfection*
11. **Pista House** (Charminar) – *The Haleem & Dum Royalty*
12. **4 Seasons** (Tolichowki) – *The Multi-Cuisine Dum Connoisseur*

### 3. ⚔️ 1v1 Battle Royale Showdown
- Compare two secret spots head-to-head.
- Dynamic stat comparison bars:
  - **Masala Power (%)**
  - **Mutton Tenderness (%)**
  - **Raita Danger Level (%)**
  - **Traffic Hell Score (%)**
- Live vote smash animations and round streaks.

### 4. 🥣 Meridian Extra Raita Risk Mini-Game
- High-stakes Panjagutta survival simulator.
- Press your luck: *"Bhai, Ek Extra Raita Laana!"*
- Watch the waiter's tension meter escalate from *Sukoon (0%)* $\rightarrow$ *Suspect (36%)* $\rightarrow$ *Stare Down (71%)* $\rightarrow$ *Police Crane Tow-Truck (100%)*!
- Bail out safely with *"Double Salan Se Kaam Chalao"* to claim the **Panjagutta Diplomat** badge.

### 5. 💰 Dawat Bill & Bakra Calculator
- Resolves post-feast bill arguments by assigning comical, realistic eater personas:
  - 🍖 **The Degh Destroyer**: Consumed 3 mutton shanks + marrow (+30% surcharge).
  - 🍚 **Normal Biryani Bhai**: Fair standard plate + Thums Up.
  - 🥗 **"Maine Toh Bas Salad Khaya"**: Diet claimer with minimal split.
- **Copy WhatsApp Bill**: Generates formatted WhatsApp text ready to drop into the group chat.

### 6. 🧠 Biryani Personality Quiz (Nizami Soul Matcher)
- 3 rapid situational questions analyzing hunger, transport mode, and spice tolerance.
- Yields a downloadable **Official Nizami Identity Card** matching your soul spot.

### 7. 🔊 Street Audio Soundboard & Ambience
- Web Speech synthesizer delivering authentic street one-liners (*"Do Double Masala Lagao!"*, *"Raita Nakko Re Baap!"*, *"Begumpet Pe Aakhri Jaam Hai!"*).
- Toggleable **Degh Dum Sizzle Ambience** white-noise sound generator.

### 8. 🗣️ Hyderabadi Street Slang Error Transformation Rule
- Intercepts boring system errors (404, 403, 429, GPS denied) and converts them into authentic local Dakhni slang warnings (e.g., parking warnings, traffic alerts, and raita protocol).
- Detailed rule definitions documented in [`HYDERABADI_SLANG_RULE.md`](./HYDERABADI_SLANG_RULE.md).

---

## 📁 Project Architecture

```
agenttt/
├── index.html               # Main single-page web app with 6 feature tabs
├── style.css                # Dark luxury gold/saffron theme with smooth animations
├── app.js                   # Application logic, tab switching, and game state
├── spots.js                 # 12 curated underground spots database & stats
├── slang-engine.js          # Slang error interceptor, Web Audio & Web Speech
├── server.js                # Zero-dependency Node.js HTTP server
├── HYDERABADI_SLANG_RULE.md # Slang transformation rules matrix
└── assets/                  # High-resolution hero imagery
```

---

## 📜 License
MIT License. Built for Hyderabad food lovers everywhere.