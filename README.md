# 🎮 STUDY DASH — Mobile-First Educational Endless Runner

> **Learn while you run!** A Subway Surfers-inspired educational runner and comprehensive reviewer system built for students to study lessons, test their knowledge, and prepare for exams.

---

## 🌟 Key Features

### 1. Endless Runner Gameplay
- **3 Running Lanes:** Swipe left/right (or `A`/`D`, `←`/`→`) to switch lanes.
- **Dynamic Acrobatics:** 
  - Swipe up (or `W`, `↑`, `Space`) to **jump** over barriers.
  - Swipe down (or `S`, `↓`) to **slide** under overhead arches.
- **Obstacles:** High barriers, low overhead beams, and cones.
- **Power-Ups:** 
  - 🛡️ **Shield Aura:** Absorbs an obstacle collision without losing life.
  - 🧲 **Coin Magnet:** Automatically pulls nearby coins into your bank.
  - ⚡ **2X Score Multiplier:** Doubles point gains and coin rewards.
- **Procedural Environments:** City, Forest, and Space/Neon tracks with increasing speed over distance.
- **In-Game Question Gates:** Every 150–240 meters, an interactive question pops up with large touch-friendly buttons and a 15s timer.
  - **Correct:** +50 pts, +3 coins, streak increases, green flash!
  - **Incorrect:** Shows correct answer and detailed explanation, resets streak.

### 2. Lesson Management System
- **Create & Organize:** Add subjects (custom color & icon), create lessons with titles, descriptions, learning objectives, and full reviewer notes.
- **Edit & Delete:** Update or remove lessons at any time.
- **Zero Code Changes:** Any lesson or question created in the UI is **instantly available** in the Endless Runner, Study Mode, Exam Challenge, and Custom Reviewer Run!

### 3. Question Bank
- **Multiple Formats:** Multiple Choice (4 options), True / False, Identification (with accepted alternates), Enumeration.
- **Difficulty Levels:** Easy, Medium, Hard.
- **Search & Filters:** Filter by Subject, Difficulty, and Question Type in real time.
- **Auto-Sync:** Persisted in IndexedDB.

### 4. Six Distinct Game & Study Modes
1. **Endless Runner:** Classic endless runner with obstacles, coins, and educational gates.
2. **Study Mode:** Flashcard-style flip reviewer (Question front, Answer & Explanation back) with *Got It* vs *Still Learning* tracking.
3. **Exam Challenge:** Simulated timed examination with question progression, timer bar, pass/fail grading (75% threshold), and full answer key review.
4. **Time Attack:** 60-second rapid-fire quiz frenzy with streak combo multipliers and mistake time penalties.
5. **Custom Reviewer Run:** Filter the game to a specific subject, lesson, or difficulty. The runner uses **only** that selected material.
6. **Mistake Review:** Smart mistake tracker that isolates previously missed questions, provides explanations, and allows re-quizzing to clear them from memory.

### 5. Import & Export System
- **Bulk CSV Import:** Import spreadsheets with standard columns (`type,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,subject,lesson,difficulty`).
- **JSON Backup & Restore:** Complete backup export/import containing subjects, lessons, questions, scores, and progress.
- **Structured Text (TXT):** Simple human-readable format (`Q: ... A: ... B: ... ANSWER: ... EXPLAIN: ...`).
- **Template Downloads:** Download pre-formatted CSV and JSON sample templates directly in the app.

### 6. PWA & Offline Support
- **100% Offline Capable:** Uses a Service Worker (`sw.js`) and IndexedDB (`StudyDashDB`) to cache all application code, Phaser engine, and custom user data.
- **Installable:** Meets PWA installability requirements with `manifest.json` and responsive icons for Android and iOS.

---

## 🚀 How to Run the Application

Because Progressive Web Apps and Service Workers require `http://localhost` or HTTPS, run Study Dash using the included zero-dependency server:

### Option A: Windows Batch (Easiest)
Double-click `run.bat` in the project folder. It will launch the server and open your default browser.

### Option B: Python 3
```bash
python server.py
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option C: Node.js
```bash
node server.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📱 Testing on Android / iPhone

1. Make sure your computer and phone are connected to the same Wi-Fi network.
2. Run `python server.py` or `node server.js`. The console will display your local IP, for example:
   ```
   • Mobile (Phone / Wi-Fi): http://192.168.1.15:8080
   ```
3. Open Chrome on Android (or Safari on iPhone) and visit that URL.
4. **Install as App:**
   - **Android Chrome:** Tap the three dots menu `⋮` → **Add to Home screen** / **Install app**.
   - **iPhone Safari:** Tap the Share button `⎋` → **Add to Home Screen**.
5. Disconnect Wi-Fi and launch the installed app to verify complete offline functionality!

---

## 📁 Project Architecture

```
STUDY DASH/
├── index.html                  # Main responsive HTML5 app shell & screens
├── style.css                   # Mobile-first stylesheet (CSS variables, dark theme)
├── manifest.json               # PWA Web App Manifest
├── sw.js                       # Service Worker for offline caching
├── server.py                   # Python zero-dependency dev server
├── server.js                   # Node.js zero-dependency dev server
├── run.bat                     # Single-click Windows launcher
├── icons/
│   ├── icon-192.svg            # PWA icon 192x192
│   └── icon-512.svg            # PWA icon 512x512
└── js/
    ├── main.js                 # App initialization, routing hooks, UI wiring
    ├── db.js                   # IndexedDB storage wrapper (StudyDashDB)
    ├── state.js                # State management and event emitter
    ├── router.js               # Screen navigation & back-stack
    ├── game/
    │   ├── GameManager.js      # Coordinates Phaser game instance & scenes
    │   ├── BootScene.js        # Procedural asset generator (Graphics-based)
    │   ├── GameScene.js        # 3-lane runner, physics, obstacles, questions
    │   ├── GameOverScene.js    # Scoreboard, statistics, restart
    │   └── TouchControls.js    # Mobile touch swipe & keyboard input
    ├── modes/
    │   ├── StudyMode.js        # Flashcard reviewer with Got It / Still Learning
    │   ├── ExamChallengeMode.js# Timed exam simulation with pass/fail review
    │   ├── TimeAttackMode.js   # 60s quiz sprint with streak multipliers
    │   ├── MistakeReviewMode.js# Dedicated review of incorrect answers
    │   └── CustomReviewerRun.js# Filter runner to specific lessons/questions
    ├── screens/
    │   ├── homeScreen.js       # Dashboard overview
    │   └── reviewerScreen.js   # Rich lesson content & attached question viewer
    ├── modals/
    │   ├── ImportModal.js      # CSV/JSON/TXT import & template download dialog
    │   └── ExportModal.js      # JSON/CSV backup export dialog
    └── services/
        ├── SeedData.js         # Default starter lessons (OSI Model, TCP/IP, Biology)
        ├── GameQuestionService.js # Bridges Question Bank to all game modes
        ├── ImportService.js    # Parses and validates CSV, JSON, TXT files
        ├── ExportService.js    # Generates client file downloads
        ├── SubjectService.js   # CRUD operations for subjects
        ├── LessonService.js    # CRUD operations for lessons
        ├── QuestionService.js  # CRUD operations for questions
        └── ProgressService.js  # Streak, coin, and score statistics
```

---

## 🧪 Verification & Acceptance Checklist

| Feature | Status | Details |
| :--- | :---: | :--- |
| **Game Engine** | ✅ Pass | 3 lanes, jump, slide, obstacle hitboxes, coins, power-ups |
| **Mobile Controls** | ✅ Pass | Touch swipe left, right, up, down + keyboard `WASD` / arrows |
| **Lesson Management** | ✅ Pass | Add, edit, delete lessons with title, objectives, rich notes |
| **Question Bank** | ✅ Pass | MCQ, True/False, Identification; filters by subject and difficulty |
| **Zero Code Sync** | ✅ Pass | New lessons & questions immediately feed all 6 modes |
| **Import / Export** | ✅ Pass | CSV, JSON, TXT import; JSON & CSV export; starter templates |
| **Study Mode** | ✅ Pass | Flip card deck with Got It vs Still Learning tracking |
| **Exam Challenge** | ✅ Pass | Timed exam, 75% passing threshold, complete item review |
| **Time Attack** | ✅ Pass | 60s countdown, combo multipliers, speed bonuses |
| **Mistake Review** | ✅ Pass | Automatically captures incorrect answers and re-quizzes |
| **Progress & Stats** | ✅ Pass | Persistent coins, accuracy, streaks, and score history |
| **PWA & Offline** | ✅ Pass | Service worker caches all assets; IndexedDB stores all data |

