# SSP PROJECT FULL CONTEXT — HANDOFF DOCUMENT
## "Closing a Wider Feedback Loop" · UQ Student-Staff Partnerships
## Project ID: 5958830
## Student: Yashas Garg (MDataSc, UQ)
## Date: April 30, 2026

---

## 1. PROJECT OVERVIEW

Yashas is part of a UQ Student-Staff Partnerships (SSP) project called "Closing a Wider Feedback Loop." The project aims to improve UQ's Student Evaluation of Course and Teaching (SECaT) surveys — specifically how feedback is collected, processed, and returned to students.

**The core problem:** UQ's SECaT response rate hit 40.07% in S1 2025 (source: UQ eLearning Newsletter, Aug 2025) — the highest since 2015, powered by the switch to Explorance Blue. But 45% of students say feedback doesn't change anything, 43% never see results, 28% only see partial results, and 21% feel the wrong questions are asked (source: pre-SSP survey in the Project Plan document).

**Project duration:** 15-18 weeks, max 60-65 contact hours, $1500 grant per student partner.

---

## 2. TEAM STRUCTURE

### Chatbot/Gamified Survey Team (Yashas's team):
- **Alex Civil** — Chair/Mentor/Supervisor. Staff partner. Coordinates via Microsoft Teams and Loop documents. Presented "Closing the Wider Feedback Loop" overview at Meeting 1.
- **Tanya (Yun-Ya Huang)** — Same person, two names. Student partner. Built a Codex-based chatbot prototype that was SUPERIOR to Yashas's local deployment. Her ideas: prompt templates for constructive feedback, privacy notification popups, "you said we did" email campaigns with course-specific changes shown.
- **Yashas Garg** — Student Insights & Solutions Analyst. MDataSc student. Pitched 3 chained ideas (gamified input → AI sensemaking → "you said, we did"). Missed 2 meetings, delivered async pitch via recording.

### Dashboard/Reports Team (others):
- **Hui Zhou** — Data analyst. Works on qualitative comment analysis and dashboards for staff.
- **Dom McGrath** — General support, connections with UQ projects (Lead Through Learning, room bookings, indigenizing curriculum). Suggested "you said, we did" DVCA one-pager.
- **Ardiansyah (Ardi) Pranoto** — Student Voice journey mapping. Suggested student voice homepage and incentives/rewards.
- **Joseph (Joe) Allman** — UQ Review concept (student-facing course reviews for enrolment decisions, focused on assessments/workload/pass rate).

### Staff Partners:
- **Lizzie Li** — Senior Manager, Evaluations at ITaLI. Oversees policy/procedure fit and technical feasibility.
- **Greg Winslett** — Director of ITaLI. Joined Meeting 2, endorsed the project's importance.

---

## 3. YASHAS'S PITCH (DELIVERED)

### Pitch Deck: Yashas_SSP_Pitch_v2.pptx
- 8 slides, 16:9 widescreen, coral (#E85A4F) / navy (#2F3C7E) palette
- Built with pptxgenjs, speaker notes embedded via addNotes()
- All numbers are real and sourced (no fabricated figures)

### The Three Ideas (chained as Input → Processing → Output):

**Idea 1: Gamified Input**
- Chatbot-style survey interface instead of static form
- Prompt chips ("It helped because...", "I'd suggest...", "What could improve is...")
- Privacy nudges when names/IDs detected
- Micro-progress indicators instead of guilt-trip progress bar
- Evidence: Hoel & Dahl 2019 — 30% of students drop off if survey > 5 minutes

**Idea 2: AI/NLP Sensemaking**
- Automated theming of free-text comments (hundreds of thousands per semester)
- Route themes to the right people: teaching staff, service owners (timetabling, AI policy), student dashboard
- Strip identifiers before output
- Evidence: Cunningham-Nelson et al. (QUT, 2021) — NLP reveals teaching insights quant scores miss

**Idea 3: "You Said, We Did"**
- Three placement points: course profile (before enrolment), Student Voice page (any time), next survey's opening email (at point of feedback)
- The email leads with "here's what changed" BEFORE asking for more feedback
- Evidence: Harvey 2003 — closing the loop improves future participation; Hoel & Dahl 2019 — belief feedback drives change is the #1 predictor

### Key Data Points Used in Pitch:
| Fact | Value | Source |
|------|-------|--------|
| UQ SECaT response rate S1 2025 | 40.07% | UQ eLearning Newsletter, Aug 2025 |
| UQ total students | 57,143 | UQ 2024 Annual Report |
| UQ total courses | 3,451 | UQ 2024 Annual Report |
| UNLV response rate (Blue + LMS) | 77% | Explorance case study |
| U. Chicago response rate (Blue) | 40-45% | Explorance case study |
| With incentives (Goodman 2015) | ~72% | Peer-reviewed |
| Don't see feedback changes anything | 45% | Pre-SSP survey (Project Plan) |
| Never see results | 43% | Pre-SSP survey (Project Plan) |
| Only see certain results | 28% | Pre-SSP survey (Project Plan) |
| Survey doesn't ask right questions | 21% | Pre-SSP survey (Project Plan) |

### Team Feedback on Pitch:
- "Explorance benchmarks were not UQ-specific" — TRUE for Chicago/UNLV numbers, but 40.07% IS UQ's own figure
- "AI chatbot might feel as 'collectiony' as a survey" — valid concern, needs piloting to test
- Generally well received. Alex said Yashas tied pitches together well.

---

## 4. CURRENT PROJECT STATE

### Team Decision After Pitch Day:
- **Yashas + Tanya + Alex:** Work on AI Chatbot / Gamified Survey — making students WANT to give feedback
- **Others:** Work on Dashboards / "You said, we did" outputs for students

### Current Pilot Target:
- **Course:** MEDI7200 — Developing Skills in Medicine (med school)
- **URL:** https://programs-courses.uq.edu.au/course.html?course_code=MEDI7200
- **Requirements:** Short 3-question mid-semester survey, anonymity enforced (strip student IDs), focused on specific teaching improvements
- **Timeline:** ~3 weeks to prepare simplified version
- **Key difference from full SECaT:** This is a mid-semester check-in (not end-of-semester), which means lecturers can implement changes immediately and students see impact while still enrolled

### Tanya's Status:
- Used Codex for her prototype — it was better than Yashas's local deployment
- Her prototype works. Yashas's local Ollama deployment does not work well.
- Next step: Yashas and Tanya each build their own chatbot version, then combine the best features of both at Thursday meeting

---

## 5. CHATBOT DEVELOPMENT HISTORY (v1 → v4)

### What Was Built:
Four versions of a React-based chatbot for SECaT feedback collection.

### v1 (Claude API — basic):
- Simple chatbot using Anthropic API
- Worked in Claude's artifact renderer
- Problem: requires paid Anthropic API key ($$$)

### v2 (Claude API — good conversation):
- Deep course context for INFS4203 and INFS3208
- Actual SECaT questions from PPL 230.1.1 §65-66
- Adaptive tone detection (casual/Gen-Z vs formal)
- Privacy detection for names, student IDs, emails
- Good conversational quality — AI referenced specific course details
- Problem: still needs paid Anthropic API key

### v3 (Ollama local — interactive but dead AI):
- Switched to free local Ollama with llama3.1:8b model
- Added interactive elements: 0-10 sliders, MCQs, emoji reactions
- Added speech-to-text (Web Speech API), auto-save (localStorage), 3-strike system
- Added results dashboard with recharts (bar chart, radar chart, word cloud)
- Added CSV/JSON export
- **CRITICAL FAILURE:** Ollama llama3.1:8b cannot handle the large system prompts. Every AI response was the fallback string "Nice one — tell me about that" or "Thanks for that." The AI was completely dead — no course context, no tone adaptation, no natural language. Screenshots confirmed this.

### v4 (Smart rule engine + optional Ollama):
- Built a rule-based conversation engine with 60+ pre-written, course-specific responses
- Responses organized by: topic (aims, structure, assessment, best, improve) × sentiment (positive, negative, neutral) × tone (casual vs formal)
- Ollama is optional enhancer — if it works, responses get enhanced; if it fails, smart engine handles everything
- **STILL HAD PROBLEMS on local Mac deployment:**
  - Layout broke on laptop screen sizes (designed for phone width, looked bad on laptop)
  - Voice button present but non-functional (Web Speech API needs HTTPS, localhost is HTTP)
  - AI responses still felt robotic compared to Tanya's Codex version
  - Conversations still repetitive after a few exchanges
  - Overall quality: "form over function" — looked good in Claude artifact, fell apart on real Mac

### Tech Stack:
- **Frontend:** React (Vite), Tailwind utility classes, recharts for dashboard
- **AI:** Ollama with llama3.1:8b (broken) + smart rule-based fallback engine
- **Storage:** localStorage for auto-save, CSV/JSON export for data
- **Backend:** Python script (generate_report.py) using pandas + openpyxl for Excel report generation
- **Proxy:** Vite dev server proxy at /ollama → http://localhost:11434
- **Voice:** Web Speech API (doesn't work on localhost HTTP)

### Files on Yashas's Mac:
- `src/App.jsx` — should contain App_v4_Final.jsx content
- `vite.config.js` — with Ollama proxy configuration
- `generate_report.py` — Python Excel report generator (this one works)
- `package.json` — React + recharts dependencies

### Vite Config Required:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, '')
      }
    }
  }
})
```

---

## 6. UQ SECaT SYSTEM — KEY FACTS

### Survey Structure (PPL 230.1.1):
**SECaT Course Questions (8 quant + 2 open-ended):**
- Q1: Clear understanding of aims and goals
- Q2: Intellectually stimulating
- Q3: Well structured
- Q4: Course materials useful for learning
- Q5: Assessment requirements clear
- Q6: Received helpful feedback
- Q7: Learned a lot
- Q8: Overall rating
- Q9: Best aspects (free text)
- Q10: Improvements (free text)

**SECaT Teacher Questions (8 quant + 2 open-ended):**
- Q1-Q8 about the teacher specifically
- Q9: What helped learning
- Q10: What would you change

### System & Process:
- Platform: Explorance Blue (from S1 2025, replaced unnamed legacy system)
- Survey window: 3 weeks at end of semester (opens Monday Week 12, closes before exam period)
- Reportable threshold: 5+ responses required
- Reports released after final grades each semester
- Language scan process: automated + manual review by SSET, Director ITaLI can redact abusive content
- Privacy: students asked not to self-identify; if they do, staff cannot contact them about it
- Closing the loop: §40 — coordinators "encouraged" to provide summary of evaluation outcomes to next cohort via Blackboard

### Access Levels:
- Students: quantitative course results only (no comments) via Reportal
- Individual teachers: their own teaching results
- Course coordinators: all quant + qual for their course
- Heads of School: everything for their school
- Exec Deans / PVC: everything university-wide

---

## 7. TEST COURSES LOADED IN PROTOTYPE

### INFS4203/7203 — Data Mining
- Coordinator: Dr Miao Xu
- Assessments: Assignment 1 (15%), Assignment 2 (15%), Group Project + Code Interview (40%), Final Exam (30%)
- Key detail: Code interview in Week 13 — 5-min presentation + 3-min code interview. If final code differs >40% from interview version, may receive zero.
- Topics: Classification (Decision Trees, SVM, KNN), Clustering (K-means, DBSCAN), Association Rules (Apriori, FP-Growth), Text/Web Mining, PCA, Anomaly Detection
- Weekly flow: Wk1-4 Foundations, Wk5-7 Classification, Wk8-10 Clustering & association, Wk11-12 Text/web mining, Wk13 Presentations
- Recent change: Written proposal replaced with presentation + code interview based on student feedback
- Common concerns: Group project workload, code interview pressure, math-heavy pace, theory vs practice gap

### INFS3208 — Cloud Computing
- Assessments: 3 assignments (15% each), Mid-Sem (20%), Final Exam (35%)
- Topics: Docker, Kubernetes, NoSQL (MongoDB/Cassandra), Vector DBs (NEW 2025), MapReduce, Apache Spark, Cloud security
- Weekly flow: Wk1-3 Cloud fundamentals, Wk4-6 Docker, Wk7-9 Kubernetes, Wk10-11 NoSQL/Vector DBs, Wk12-13 Spark/revision
- Recent change: Vector database topic added for next-gen AI applications
- Common concerns: Docker/K8s setup complexity, theory-practice gap, insufficient tutor support, 55% exam weighting

### MEDI7200 — Developing Skills in Medicine (NEXT — not yet loaded)
- Med school postgrad course
- Pilot requirements: 3 questions only, mid-semester, anonymity enforced
- Different student population: time-poor, high-stakes, won't tolerate Gen-Z chatty tone

---

## 8. WHAT WORKS AND WHAT DOESN'T

### Working Well:
- Pitch deck (v2) — well received by team, real data, good framing
- generate_report.py — Python Excel report generator works correctly
- The strategic framing (3-idea chain, connective tissue positioning)
- Research quality — all citations verified, no fabricated numbers
- Interactive UI elements concept (scales, MCQs, emojis) — good design, just need better AI behind them

### Broken / Needs Fixing:
- **Ollama + llama3.1:8b** — cannot handle complex system prompts, produces garbage
- **Local deployment layout** — designed for phone-width container, breaks on laptop
- **Web Speech API** — needs HTTPS, doesn't work on localhost HTTP
- **Conversation quality** — rule-based engine is better than dead Ollama but still feels robotic vs Tanya's Codex
- **Tone adaptation** — the casual/formal detection exists in code but doesn't actually produce meaningfully different responses in practice
- **Auto-save** — localStorage works but isn't visible as a "backend" to show the team

### Yashas's Decision:
**Switching to Claude Cowork** for the next development phase. Key reasons:
1. Cowork gives Claude filesystem access on Mac — can test against real environment
2. Can see and fix what's actually breaking instead of shipping untested code
3. Tanya's Codex prototype already works — Yashas needs to catch up fast

---

## 9. WHAT NEEDS TO HAPPEN NEXT

### Immediate (before Thursday meeting):
1. Get a working chatbot that doesn't repeat itself and actually adapts to student tone
2. Fix laptop layout — responsive design that fills the screen properly
3. Either fix Ollama integration or find a better free local LLM approach
4. Have something demoable that competes with Tanya's Codex version

### Short-term (3-week MEDI7200 pilot prep):
1. Build "lite mode" — 3-question mid-semester survey for med school
2. Load MEDI7200 course context
3. Ensure anonymity (strip student IDs before any storage)
4. Build staff-facing view so Alex and course coordinators can test
5. Merge best features from Yashas's and Tanya's prototypes

### For the meeting with Alex:
1. Show working v4 prototype as "full SECaT" concept demo
2. Propose lite mode as a configuration option (same engine, different question set)
3. Discuss how to combine Tanya's Codex approach with Yashas's interactive elements
4. Confirm with Lizzie whether current privacy approach meets PPL 230.1.1

---

## 10. YASHAS'S WORKING PREFERENCES

- Wants immediate execution, not clarifying questions — especially under time pressure
- Real researched figures required — NEVER fabricate numbers
- Script/copy tone must sound human and natural, not AI-generated
- No explicit credential-flexing (e.g., "as a data science student...")
- Authentic framing valued — acknowledging lateness genuinely rather than polishing it away
- Gets frustrated when Claude hedges, produces low-quality output, or asks permission to do obvious things
- If Yashas pushes back on advice, respect his choice and execute
- Prefers being told hard truths over comfortable lies
- Uses Mac (M-series), MDataSc student at UQ
- Has NOT paid for Anthropic Console API — free local solutions only

---

## 11. KEY CITATIONS / SOURCES

| Citation | Key Finding |
|----------|-------------|
| Hoel, A. & Dahl, T.I. (2019). "Why bother?" Assessment & Evaluation in Higher Education, 44(3), 361-378 | Strongest predictor of SET participation is belief feedback drives change. 30% drop off if survey >5 min |
| Harvey, L. (2003). "Closing the Feedback Loop." Tertiary Education & Management, 9(1), 13-29 | Closing the loop improves future participation |
| Cunningham-Nelson et al. (QUT, 2021). "Beyond satisfaction scores." A&E in HE, 46(5), 685-700 | NLP reveals teaching insights quant scores miss |
| Nulty, D.D. (2008). "Adequacy of response rates." A&E in HE, 33(3), 301-314 | Online surveys avg ~33% vs ~56% paper. Min 35% for large classes at 80% confidence |
| Goodman et al. (2015). "Effect of incentives." A&E in HE, 40(7), 958-970 | Faculty doing nothing: ~50%. With incentives: ~72% |
| Stein et al. (2023). "Institutional approaches." JHEP&M, 45(5), 487-504 | 29 Australasian unis: declining rates, oversurveying fatigue sector-wide |
| UQ eLearning Newsletter, Aug 2025 | 40.07% S1 2025 response rate, "sector-leading," "highest since 2015" |
| UQ 2024 Annual Report | 57,143 students, 3,451 courses, 338 programs |
| UQ PPL 230.1.1 | Full SECaT/SETutor procedure, question sets, access levels, privacy rules |

---

## 12. FILES REFERENCE

| File | Status | Description |
|------|--------|-------------|
| Yashas_SSP_Pitch_v2.pptx | ✅ Delivered | 8-slide pitch deck with speaker notes, real UQ data |
| App_v4_Final.jsx | ⚠️ Buggy | Latest chatbot code — smart rule engine + Ollama. Needs fixing |
| generate_report.py | ✅ Works | Python CSV→Excel report generator with charts |
| vite.config.js | ✅ Works | Vite proxy config for Ollama |
| SECaT_Chatbot_v2.jsx | 📦 Archive | Claude API version (good conversation, needs paid API) |
| SECaT_Chatbot_v3.jsx | 📦 Archive | Ollama version with interactive elements (AI brain dead) |
| Yashas_SSP_Pitch_Script.md | ✅ Delivered | 5-min recording script (also embedded in pptx notes) |

---

END OF HANDOFF DOCUMENT
Copy this entire document into Claude Cowork as the first message or as a reference file.
