# SECaT Chatbot — Setup & Troubleshooting Guide

**Version:** 5.0 (June 2026)
**Project:** UQ SSP "Closing the Wider Feedback Loop" (Project #5958830)
**Built by:** Yashas Garg (MDataSc, UQ)

---

## What Is This?

This is a chatbot that collects student feedback for UQ courses. Instead of a boring survey form, students have a conversation — they get follow-up questions based on what they actually say, and the whole thing adapts to their tone (casual or formal).

It currently supports four courses:
- **INFS4203/7203** — Data Mining (full SECaT, 10 questions)
- **INFS3208** — Cloud Computing (full SECaT, 10 questions)
- **CHEM1100** — Chemistry 1 (full SECaT, 13 questions)
- **MEDI7200** — Developing Skills in Medicine (3-question mid-semester pilot)

At the end, there's a dashboard with charts, sentiment analysis, and CSV/JSON export.

---

## What You Need Before Starting

1. **A Mac or PC** (any operating system works)
2. **Node.js** installed (version 18 or higher)
   - To check: open Terminal (Mac) or Command Prompt (Windows) and type `node --version`
   - If you don't have it: go to https://nodejs.org and download the "LTS" version, install it
3. **The project folder** — the folder containing this file

That's it. You do NOT need:
- An API key (the chatbot works without any AI service)
- Python (unless you want to run the Excel report generator)
- A server or hosting

---

## How to Run It

### Step 1: Open Terminal

- **Mac:** Open Finder → Applications → Utilities → Terminal
- **Windows:** Press Win+R, type `cmd`, press Enter
- **VS Code:** Press Ctrl+` (backtick) to open the built-in terminal

### Step 2: Navigate to the Project Folder

Type this (replace the path with wherever your folder actually is):

```
cd /path/to/secat-chatbot
```

**Tip:** You can also drag the folder onto the Terminal window to paste its path.

### Step 3: Install Dependencies (First Time Only)

```
npm install
```

This downloads the libraries the chatbot needs. It'll take about 30 seconds. You only need to do this once, or after someone adds new dependencies.

### Step 4: Start the Chatbot

```
npm run dev
```

You'll see something like:

```
  VITE v8.0.9  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Step 5: Open It

Open your web browser (Chrome, Safari, Firefox — any of them) and go to:

```
http://localhost:5173
```

You should see the course selection screen with the available course cards.

### Step 6: Stop It

Go back to Terminal and press `Ctrl + C`.

---

## How It Works (Non-Technical Explanation)

### The Conversation Flow

1. Student selects a course
2. Chatbot greets them and asks about their overall experience
3. For each SECaT question:
   - Some are **sliders** (0-10 scale)
   - Some are **multiple choice** (tap an option)
   - Some are **emoji reactions** (tap a reaction)
   - Some are **open text** (type freely)
4. After each answer, the chatbot asks a follow-up based on:
   - **What they said** — positive, negative, or neutral
   - **What topic they mentioned** — assessment, teaching, labs, etc.
   - **Their tone** — casual ("ngl the labs were mid") vs formal ("The material was insufficient")
5. At the end, they see a results dashboard and can export their data

### The AI Part

The chatbot has two "brains":

1. **Smart Rule Engine** (always works) — 100+ pre-written responses organised by topic, sentiment, and tone. This is the primary brain and works without any internet or AI service.

2. **Ollama Enhancement** (optional) — If you have Ollama running locally with the llama3.1 model, the chatbot will try to get AI-enhanced responses. If Ollama is down or slow, it silently falls back to the rule engine.

You do NOT need Ollama. The chatbot works fine without it.

### Data Storage

There are two layers of data storage:

1. **Server-side (persistent)** — After every completed session, the chatbot automatically saves:
   - A CSV file per course in `secat-chatbot/data/` (e.g., `SECaT_INFS4203-7203.csv`) — rows are appended across sessions
   - A JSON file per session in `secat-chatbot/data/` (e.g., `session_INFS4203-7203_2026-05-07T10-30-00-000Z.json`)
   - The dashboard reads directly from these files via the Vite dev server API
   - These files persist across browser refreshes and server restarts

2. **Browser localStorage (temporary)** — Only used to resume incomplete sessions. Once a session is completed, localStorage is cleared for that course.

You do NOT need to manually download CSV/JSON files — they are already on your disk. The dashboard's "Export All CSV/JSON" buttons let you download a combined file of all saved sessions if you need a portable copy.

### Privacy

- Names (Dr Smith, Prof Johnson) are blocked — students are asked to use "the lecturer" instead
- Email addresses and student IDs are blocked
- If a student types identifying info, it gets redacted before storage
- The 3-strike profanity system closes the session after 3 profane messages

---

## Troubleshooting

### "npm: command not found"

Node.js is not installed. Go to https://nodejs.org, download the LTS version, install it, then close and reopen your Terminal.

### "npm install" gives errors

Try deleting the `node_modules` folder and the `package-lock.json` file, then run `npm install` again:

```
rm -rf node_modules package-lock.json
npm install
```

### The page is blank / shows errors in the browser

Open the browser's developer console to see the actual error:
- **Chrome/Edge:** Right-click → Inspect → Console tab
- **Safari:** Enable Develop menu in Preferences → Develop → Show Web Inspector → Console tab
- **Firefox:** Right-click → Inspect → Console tab

Common causes:
- You edited `App.jsx` and introduced a syntax error — check the Terminal where `npm run dev` is running for red error messages
- The port is already in use — try `npm run dev -- --port 3000` to use a different port

### The chatbot responses feel robotic / repetitive

The rule engine has 100+ responses but if you're testing the same course and topic repeatedly, you might exhaust the pool. Try:
- Clear your browser's localStorage (DevTools → Application → Local Storage → Clear)
- Test a different course
- The response pool resets when all options for a topic have been used

### Voice button doesn't appear

The speech-to-text feature requires either:
- HTTPS (not available on localhost without extra setup)
- localhost or 127.0.0.1 specifically (not a local network IP)

This is a browser security restriction, not a bug. The chatbot works fine without it — just type instead.

### "Ollama unavailable" in the console

This is normal if you don't have Ollama installed. The chatbot falls back to its rule engine automatically. If you DO want Ollama:

1. Install Ollama: https://ollama.ai
2. Pull the model: `ollama pull llama3.1`
3. Start Ollama: `ollama serve`
4. The chatbot connects automatically via the Vite proxy

### The layout looks weird on my screen

The chatbot is designed for:
- **Laptop/Desktop:** Side panel + wide chat area
- **Mobile/Tablet:** Full-width with collapsible header

If things look off, try:
- Zooming your browser to 100% (Cmd/Ctrl + 0)
- Making the window wider — the sidebar appears at 768px+ width

### CSV/JSON export doesn't work

The export buttons are on the Results Dashboard (visible after completing a survey). If clicking the button does nothing:
- Check if your browser is blocking downloads
- Try a different browser
- Check the Console for errors

---

## File Structure

```
secat-chatbot/
├── index.html          ← Main HTML page (minimal — just loads React)
├── package.json        ← Project dependencies and scripts
├── vite.config.js      ← Dev server config (includes Ollama proxy)
├── eslint.config.js    ← Code linting rules
├── GUIDE.md            ← This file
├── src/
│   ├── main.jsx        ← React entry point (2 lines — loads App)
│   ├── App.jsx         ← THE APP — all logic, UI, and data lives here
│   ├── App.css         ← Minimal (styling is inline in App.jsx)
│   └── index.css       ← Global reset styles
├── public/
│   ├── favicon.svg     ← UQ branding icon
│   └── icons.svg       ← Icon sprite
├── data/               ← Auto-saved session data (CSV + JSON per session)
└── dist/               ← Production build output (generated by `npm run build`)
```

### Key File: `src/App.jsx`

Everything is in this one file. Here's where to find things:

| What | Where in App.jsx |
|------|-----------------|
| Course data (names, assessments, topics) | Top of file — `COURSES` object |
| Survey questions and flow | `FLOW_FULL` and `FLOW_LITE` arrays |
| Tone detection (casual vs formal) | `isCasual()` function |
| Sentiment analysis | `sentiment()` function |
| Topic extraction | `extractTopics()` function |
| All chatbot responses | `RESPONSE_BANK` object |
| Profanity filter words | `BAD` regex |
| Privacy detection patterns | `PRIVACY` regex |
| Dashboard charts and export | `Dash` component |
| Course selection screen | Inside `App`, look for "COURSE SELECTOR" comment |
| Chat interface | Inside `App`, look for "CHAT VIEW" comment |

---

## How to Add a New Course

1. Open `src/App.jsx`
2. Find the `COURSES` object at the top
3. Add a new entry following this pattern:

```javascript
NEW_CODE: {
    code: "NEW_CODE",
    name: "Course Name",
    semester: "S1 2026",
    assessments: ["Assessment 1 (X%)", "Assessment 2 (Y%)"],
    topics: ["Topic 1", "Topic 2", "Topic 3"],
    recentChange: "what changed recently in this course",
    keyDetail: "the most talked-about part of the course",
    weeklyFlow: "Brief description of weekly structure",
    commonConcerns: ["concern 1", "concern 2"],
    mode: "full"  // or "lite" for mid-semester 3-question survey
}
```

4. Save the file — the dev server will auto-reload

---

## How to Build for Production

If you need to deploy this somewhere (not just run locally):

```
npm run build
```

This creates a `dist/` folder with static HTML/CSS/JS files. These can be hosted on any web server — no Node.js needed on the server.

---

## Common Commands Reference

| Command | What it does |
|---------|-------------|
| `npm install` | Downloads dependencies (run once) |
| `npm run dev` | Starts the development server |
| `npm run build` | Creates production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check code for errors |

---

## Who to Contact

- **Yashas Garg** — built the chatbot
- **Alex Civil** — SSP project coordinator

---

*Last updated: June 2026*
