import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from "recharts";

/* ═══════════════════
   BACKEND CONFIG
   ═══════════════════
   Set SHEETS_API_URL to your deployed Google Apps Script web app URL.
   When set, the app uses Google Sheets as backend (production mode).
   When empty/null, it uses the local Vite dev server API (dev mode).
*/
const SHEETS_API_URL = import.meta.env.VITE_SHEETS_API_URL || "";
const IS_PRODUCTION = !!SHEETS_API_URL;

// Unified API helpers — route to local Vite API or Google Sheets
const api = {
  async getSessions() {
    if (IS_PRODUCTION) {
      const res = await fetch(SHEETS_API_URL + "?action=sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    }
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error("Failed to fetch sessions");
    return res.json();
  },

  async saveSession(data) {
    if (IS_PRODUCTION) {
      const res = await fetch(SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // Apps Script requires text/plain for CORS
        body: JSON.stringify({ action: "save-session", data })
      });
      return res.json();
    }
    const res = await fetch("/api/save-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async saveCSV(courseCode, rows) {
    if (IS_PRODUCTION) {
      const res = await fetch(SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "save-csv", courseCode, rows })
      });
      return res.json();
    }
    const res = await fetch("/api/save-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseCode, rows })
    });
    return res.json();
  },

  async clearData() {
    if (IS_PRODUCTION) {
      const res = await fetch(SHEETS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "clear-data" })
      });
      return res.json();
    }
    const res = await fetch("/api/clear-data", { method: "DELETE" });
    return res.json();
  }
};

/* ═══════════════════
   COURSE DATA
   ═══════════════════ */
const COURSES = {
  INFS4203: {
    code: "INFS4203/7203", name: "Data Mining", semester: "S2 2025",
    assessments: ["Assignment 1 (15%)", "Assignment 2 (15%)", "Group Project + Code Interview (40%)", "Final Exam (30%)"],
    topics: ["Classification", "Clustering", "Association Rules", "Text Mining", "PCA"],
    recentChange: "code interview replaced written proposal this semester",
    keyDetail: "the 40% group project with the Week 13 code interview",
    weeklyFlow: "Wk1-4 Foundations, Wk5-7 Classification, Wk8-10 Clustering, Wk11-12 Text Mining, Wk13 Presentations",
    commonConcerns: ["group project workload", "code interview pressure", "math-heavy pace", "theory vs practice gap"],
    mode: "full" // full SECaT
  },
  INFS3208: {
    code: "INFS3208", name: "Cloud Computing", semester: "S2 2025",
    assessments: ["Assignment 1 (15%)", "Assignment 2 (15%)", "Assignment 3 (15%)", "Mid-Sem (20%)", "Final Exam (35%)"],
    topics: ["Docker", "Kubernetes", "NoSQL", "Vector DBs", "Spark"],
    recentChange: "vector database topic added for AI applications",
    keyDetail: "the Docker and Kubernetes hands-on labs",
    weeklyFlow: "Wk1-3 Cloud fundamentals, Wk4-6 Docker, Wk7-9 Kubernetes, Wk10-11 NoSQL/Vector DBs, Wk12-13 Spark",
    commonConcerns: ["Docker/K8s setup complexity", "theory-practice gap", "insufficient tutor support", "55% exam weighting"],
    mode: "full"
  },
  MEDI7200: {
    code: "MEDI7200", name: "Developing Skills in Medicine", semester: "S1 2026",
    assessments: ["Clinical Portfolio", "OSCE", "Written Examination"],
    topics: ["Clinical Skills", "Patient Communication", "Evidence-Based Medicine"],
    recentChange: "mid-semester feedback pilot introduced",
    keyDetail: "clinical placement rotations and skills labs",
    weeklyFlow: "Rotational clinical placement blocks",
    commonConcerns: ["placement scheduling", "feedback timeliness", "assessment alignment"],
    mode: "lite" // 3-question mid-semester
  }
};

/* ═══════════════════════════════════
   FLOW DEFINITIONS — full vs lite
   ═══════════════════════════════════ */
const FLOW_FULL = [
  { id: "welcome", type: "chat" },
  { id: "q1", type: "scale", label: "I had a clear understanding of the aims and goals", lo: "Not at all", hi: "Crystal clear", secat: "Q1" },
  { id: "q1f", type: "chat", topic: "aims", secat: "Q1" },
  { id: "q2", type: "scale", label: "The course was intellectually stimulating", lo: "Not stimulating", hi: "Super stimulating", secat: "Q2" },
  { id: "q3", type: "mcq", label: "How was the course structured?", secat: "Q3",
    options: ["Really well organised", "Decent but some gaps", "A bit all over the place", "Needed serious work"] },
  { id: "q3f", type: "chat", topic: "structure", secat: "Q3" },
  { id: "q4", type: "emoji", label: "How useful were the learning materials?", secat: "Q4",
    emojis: [{e:"🔥",l:"Excellent"},{e:"👍",l:"Good"},{e:"😐",l:"Meh"},{e:"👎",l:"Poor"}] },
  { id: "q5", type: "scale", label: "Assessment requirements were clear to me", lo: "Very unclear", hi: "Very clear", secat: "Q5" },
  { id: "q5f", type: "chat", topic: "assessment", secat: "Q5" },
  { id: "q6", type: "mcq", label: "Did you get helpful feedback on your work?", secat: "Q6",
    options: ["Yes — timely and useful", "Some but not enough", "Barely any", "None at all"] },
  { id: "q7", type: "scale", label: "I learned a lot in this course", lo: "Learned little", hi: "Learned heaps", secat: "Q7" },
  { id: "q8", type: "scale", label: "Overall course rating", lo: "Poor", hi: "Outstanding", secat: "Q8" },
  { id: "q9", type: "chat", topic: "best", secat: "Q9" },
  { id: "q10", type: "chat", topic: "improve", secat: "Q10" },
  { id: "end", type: "chat" }
];

const FLOW_LITE = [
  { id: "welcome", type: "chat" },
  { id: "q1", type: "scale", label: "How well is this course supporting your learning so far?", lo: "Not well", hi: "Extremely well", secat: "MidQ1" },
  { id: "q1f", type: "chat", topic: "learning", secat: "MidQ1" },
  { id: "q2", type: "chat", topic: "working", secat: "MidQ2" },
  { id: "q3", type: "chat", topic: "change", secat: "MidQ3" },
  { id: "end", type: "chat" }
];

const getFlow = (course) => course.mode === "lite" ? FLOW_LITE : FLOW_FULL;

/* ═════════════════════════════════════════════
   SMART CONVERSATION ENGINE v5
   ═════════════════════════════════════════════ */

// Detect casual vs formal tone — expanded slang detection
const isCasual = (msgs) => {
  const t = msgs.filter(m => m.role === "user" && !m.hidden).map(m => m.content).join(" ").toLowerCase();
  return /\b(lol|haha|nah|yeah|tbh|ngl|lowkey|fr|bruh|fam|vibe|imo|idk|gonna|wanna|heaps|reckon|keen|arvo|deadass|slay|bussin|legit|probs|defs|sus|yolo|rip|omg|istg|smh|fs|goated|mid|no cap|bet|ong|srsly)\b/.test(t)
    || /!{2,}|lmao|hahaha|xd|😂|💀|🤣/.test(t);
};

// Detect sentiment — expanded vocabulary
const sentiment = (text) => {
  const t = text.toLowerCase();
  const pos = /\b(great|excellent|amazing|loved|fantastic|helpful|clear|good|best|enjoyed|awesome|engaging|interesting|useful|valuable|solid|nice|strong|well|brilliant|outstanding|perfect|thorough|intuitive|rewarding|efficient|fair|balanced|supportive|impressed|insightful|practical|relevant|comprehensive|recommend|enjoy)\b/g;
  const neg = /\b(bad|poor|terrible|confusing|unclear|boring|bland|hard|difficult|frustrating|useless|waste|worst|hate|hated|awful|weak|lacking|disappointed|vague|rushed|overwhelming|stressful|unfair|disorganised|disorganized|inconsistent|irrelevant|outdated|insufficient|tedious|repetitive|pointless|chaotic|scattered|meaningless|horrible|annoying|painful|regret|rubbish|trash|garbage|sucks|sucked|crap|mess|broken|failed|failure|avoid|struggled|struggle|dreadful|mediocre|inadequate)\b/g;
  // Negation patterns — "don't", "wouldn't", "not", "never" etc. flip meaning
  const negation = /\b(don'?t|do not|wouldn'?t|would not|shouldn'?t|should not|can'?t|cannot|not|never|no good|no way|wouldn'?t recommend|don'?t take|don'?t bother|stay away|drop this)\b/g;
  const p = (t.match(pos)||[]).length, n = (t.match(neg)||[]).length;
  const negations = (t.match(negation)||[]).length;
  // Negations flip: if positive words + negation → negative ("not good"), or standalone negation → negative
  const adjustedP = negations > 0 ? Math.max(0, p - negations) : p;
  const adjustedN = n + (negations > 0 && p > 0 ? negations : 0) + (negations > 0 && p === 0 ? negations : 0);
  return adjustedP > adjustedN ? "positive" : adjustedN > adjustedP ? "negative" : "neutral";
};

// Extract topics — expanded
const extractTopics = (text) => {
  const t = text.toLowerCase();
  const found = [];
  if (/\b(assignment|assess|mark|grade|rubric|criteria|weight|submit|deadline|due|submission)\b/.test(t)) found.push("assessment");
  if (/\b(lecture|lecturer|explain|teaching|class|session|instructor|prof|teacher)\b/.test(t)) found.push("teaching");
  if (/\b(labs?|tutorial|practical|hands.?on|exercise|workshop|demo)\b/.test(t)) found.push("labs");
  if (/\b(project|group|team|partner|code interview|presentation|collab)\b/.test(t)) found.push("project");
  if (/\b(exam|final|mid.?sem|test|quiz|invigilat)\b/.test(t)) found.push("exam");
  if (/\b(workload|time|busy|heavy|intense|stress\w*|overwhelm\w*|balance|hours)\b/.test(t)) found.push("workload");
  if (/\b(feedback|comment|response|mark|tutor|ta|demonstrat)\b/.test(t)) found.push("feedback");
  if (/\b(material|slide|resource|textbook|reading|ed discussion|blackboard|notes|video|recording)\b/.test(t)) found.push("materials");
  if (/\b(docker|kubernetes|k8s|container|cloud|aws|deploy|vector|nosql|mongo|spark)\b/.test(t)) found.push("cloud-tech");
  if (/\b(cluster|classif|svm|decision tree|knn|pca|mining|apriori|fp.?growth|dbscan|anomal)\b/.test(t)) found.push("dm-tech");
  if (/\b(clinical|patient|osce|placement|rotation|ward|hospital|skill)\b/.test(t)) found.push("med");
  return found;
};

// Response bank — MUCH deeper, 4-6 options per sentiment per topic
const RESPONSE_BANK = {
  // ─── FULL SECaT TOPICS ───
  aims: {
    positive: [
      (c,cs) => cs ? `Sick — so the course description actually matched what you ended up doing in ${c.code}?` : `That's good to hear. Did the course description match what you actually experienced in ${c.code}?`,
      (c,cs) => cs ? `Nice one. Was it clear from Week 1, or did it click once you got into ${c.keyDetail}?` : `Was it clear from the start, or did the goals become clearer once you got into ${c.keyDetail}?`,
      (c,cs) => `Did the learning outcomes on the course profile actually reflect what you ended up learning?`,
      (c,cs) => cs ? `Good vibes. Were the weekly topics building towards something obvious, or did you just trust the process?` : `Did the weekly progression make the overall direction clear, or was it more something you inferred over time?`,
      (c,cs) => cs ? `That's solid. Did ${c.keyDetail} feel like a natural endpoint for the course, or kinda random?` : `Interesting — did ${c.keyDetail} feel like a natural culmination of the course aims?`,
    ],
    negative: [
      (c,cs) => cs ? `Ngl that's frustrating. Was it the overall direction, or more like "what am I supposed to get out of each week"?` : `That's worth flagging. Was the issue with the high-level aims, or the week-to-week connection between content and purpose?`,
      (c,cs) => cs ? `Yeah, been there. Were the aims vague, or did they just not line up with what actually happened in class?` : `Was it that the aims were poorly communicated, or that the course content didn't seem to match them?`,
      (c,cs) => `Did it become clearer as the semester went on, or was it murky the whole way through?`,
      (c,cs) => cs ? `That sucks. Like, could you explain to a mate what this course was even about by the end?` : `By the end of semester, could you articulate what the course was trying to achieve? Or was it still unclear?`,
      (c,cs) => `Was it specific weeks where the purpose was lost, or a general lack of direction across the board?`,
    ],
    neutral: [
      (c,cs) => `Looking at ${c.keyDetail} — did that feel connected to the broader course goals?`,
      (c,cs) => cs ? `Fair. Was there a point where it all clicked, or nah?` : `Was there a turning point where the aims became clear, or did it stay ambiguous?`,
      (c,cs) => cs ? `Yeah makes sense. Did the ${c.topics[0]} stuff early on set the scene, or was it kinda disconnected from later topics?` : `Did the earlier topics like ${c.topics[0]} clearly connect to the later material?`,
      (c,cs) => `How well did the assessments reflect what the course said it was trying to teach?`,
    ]
  },
  structure: {
    positive: [
      (c,cs) => cs ? `Nice one. Did topics build on each other well, or were some weeks kinda random?` : `Glad to hear that. Did each week build logically on the last?`,
      (c,cs) => `Good to know. Did the weekly flow — ${c.code.includes("3208") ? "lectures then practical Docker/K8s labs" : "theory then applied sessions"} — make sense to you?`,
      (c,cs) => cs ? `That's actually rare feedback. Was the pacing consistent, or were some weeks chill while others were insane?` : `That's notable. Was the workload distributed evenly, or were certain weeks significantly heavier?`,
      (c,cs) => `Did the structure give you enough time to absorb concepts before moving to the next topic?`,
    ],
    negative: [
      (c,cs) => cs ? `Yeah I've heard that. Was it the pacing — like some weeks too fast, others dead slow? Or more that topics jumped around randomly?` : `Was the issue with pacing between topics, or the connection between lectures and ${c.code.includes("3208") ? "labs" : "applied sessions"}?`,
      (c,cs) => `Which part felt most disjointed? The first few weeks, the middle, or toward the end near ${c.code.includes("4203") ? "the project deadline" : "exams"}?`,
      (c,cs) => cs ? `Was it like they tried to cram too much in, or more that the order didn't make sense?` : `Was there too much content, or was it more about the sequencing not being logical?`,
      (c,cs) => cs ? `Did the ${c.code.includes("3208") ? "labs" : "tutorials"} even match what was being covered that week? Or were they on a different planet?` : `How well did the practical components align with the lecture content each week?`,
      (c,cs) => `If you could reorganise the ${c.weeklyFlow ? "weekly schedule" : "course structure"}, what would you change first?`,
    ],
    neutral: [
      (c,cs) => `Were the gaps in the early weeks (foundations) or later when ${c.code.includes("3208") ? "Kubernetes and Spark kicked in" : "clustering and text mining came in"}?`,
      (c,cs) => cs ? `Fair. Was the structure at least predictable — like, did you know what to expect each week?` : `Was the course at least predictable in its structure, even if imperfect?`,
      (c,cs) => `Did the transition between major topic areas feel smooth or abrupt?`,
    ]
  },
  assessment: {
    positive: [
      (c,cs) => cs ? `Good that specs were clear. How'd you find the workload across all of them? ${c.code.includes("4203") ? "That 40% project is a big chunk" : "Five pieces of assessment is a lot"}` : `Good to hear. How was the overall workload? ${c.code.includes("4203") ? "The group project at 40% is substantial" : "With five assessments plus exams, was it manageable"}?`,
      (c,cs) => `Were the marking rubrics detailed enough to know what was expected before you started?`,
      (c,cs) => cs ? `Did you feel like the marks you got actually reflected the effort you put in?` : `Did the grading feel fair relative to the effort and quality of your work?`,
      (c,cs) => `Was the spacing between assessment deadlines reasonable, or did things pile up?`,
    ],
    negative: [
      (c,cs) => cs ? `That's rough. Was it the specs that were vague, or more the marking — like getting marks back and going "how?"` : `Was the issue with initial specifications, or with how marking aligned with expectations?`,
      (c,cs) => `${c.code.includes("4203") ? "Was it the group project specifically, or the individual assignments too?" : "Was it a particular assignment, or all of them?"}`,
      (c,cs) => cs ? `Did you know what an HD vs a 4 looked like before submitting? Or was it a guessing game?` : `Were the grade boundaries and expectations transparent before submission?`,
      (c,cs) => cs ? `Were the deadlines actually doable, or was it "sure, do 3 assignments and study for 2 exams in the same week"?` : `Was the assessment schedule realistic given the workload in other courses?`,
      (c,cs) => `If you could change one thing about how assessment worked in ${c.code}, what would it be?`,
    ],
    neutral: [
      (c,cs) => `${c.code.includes("4203") ? "How did the code interview in Week 13 go? That's a newer format — did it feel fair?" : "How did you find the balance between the three assignments and the two exams?"}`,
      (c,cs) => cs ? `Anything specific about ${c.assessments[0]} that could've been clearer?` : `Was there a particular assessment where clarity was an issue?`,
      (c,cs) => `Did the assessments test what was actually taught, or did they feel disconnected from the lectures?`,
    ]
  },
  best: {
    positive: [
      (c,cs) => cs ? `Love that! If you had to pick the single best moment from the whole course, what'd it be?` : `If you had to pick one thing that should definitely stay exactly as it is, what would it be?`,
      (c,cs) => `Would you recommend ${c.code} to a friend? What would you tell them?`,
      (c,cs) => cs ? `What's the one thing from ${c.name} you'll actually remember in 5 years?` : `What's the most lasting takeaway from ${c.name} for you?`,
      (c,cs) => `Was there a particular week or topic that stood out as exceptionally well done?`,
    ],
    negative: [
      (c,cs) => cs ? `Real talk — was there anything at all that worked? Even one small thing?` : `Even in a difficult course, there's usually something worthwhile — what would you keep?`,
      (c,cs) => cs ? `If someone was forced to take ${c.code}, what would you tell them to focus on to get the most out of it?` : `What advice would you give to someone enrolling in ${c.code} next semester?`,
    ],
    neutral: [
      (c,cs) => `What would you tell a friend thinking about enrolling in ${c.code} next semester?`,
      (c,cs) => cs ? `If you could bottle one thing from this course and keep it forever, what would it be?` : `What's the one takeaway you'll carry forward from ${c.name}?`,
      (c,cs) => `Was there a particular ${c.code.includes("3208") ? "lab or hands-on exercise" : "lecture or tutorial"} that really clicked for you?`,
    ]
  },
  improve: {
    positive: [
      (c,cs) => cs ? `Even though you liked it — there's always something, right? One tweak to make it even better?` : `Even in a strong course, there's always room to improve. What's the one thing you'd change?`,
      (c,cs) => cs ? `If you could give the teaching team one piece of advice for next semester, what would it be?` : `What single change would most improve the next cohort's experience?`,
      (c,cs) => `Was there anything that felt like wasted time — something that could be cut or replaced?`,
    ],
    negative: [
      (c,cs) => cs ? `If you could wave a magic wand and fix ONE thing before next semester, what would it be?` : `If you could change just one thing for the next cohort, what would have the biggest impact?`,
      (c,cs) => `Is it something the teaching team could realistically fix, or is it more structural — like the course design itself?`,
      (c,cs) => cs ? `On a scale of "small tweak" to "burn it down and start over" — where are we?` : `Would you describe the needed changes as incremental improvements, or fundamental restructuring?`,
      (c,cs) => `If the course coordinator was in the room right now, what's the one thing you'd say to them?`,
    ],
    neutral: [
      (c,cs) => `What's one thing that, if changed, would've made your experience noticeably better?`,
      (c,cs) => cs ? `If the teaching team is reading this — what's the #1 thing you want them to hear?` : `If you could send one message to the course coordinator, what would it be?`,
      (c,cs) => `Were there resources from other courses that you wish ${c.code} had?`,
    ]
  },
  // ─── LITE MODE TOPICS (MEDI7200) ───
  learning: {
    positive: [
      (c,cs) => `That's encouraging feedback. Which aspect of the course has been most effective for your learning — the clinical placements, skills labs, or taught sessions?`,
      (c,cs) => `Good to hear. Is there a particular rotation or teaching block that's been especially valuable so far?`,
      (c,cs) => `What's working well enough that it should definitely continue unchanged?`,
    ],
    negative: [
      (c,cs) => `That's important to flag mid-semester — there's still time to adjust. Is the issue with the teaching approach, the clinical exposure, or something else?`,
      (c,cs) => `Is this about the course content itself, or more about how it's being delivered?`,
      (c,cs) => `Are other students in your cohort experiencing the same thing, or is this more specific to your learning style?`,
    ],
    neutral: [
      (c,cs) => `What's been the most useful part of the course so far — and what's been least useful?`,
      (c,cs) => `Has the balance between clinical and classroom time felt right?`,
    ]
  },
  working: {
    positive: [
      (c,cs) => `What specifically is working well? The teaching team wants to know what to keep doing.`,
      (c,cs) => `Is there something another course does that ${c.code} has adopted well, or is this unique to how this course runs?`,
    ],
    negative: [
      (c,cs) => `What's the biggest barrier to your learning right now? Be as specific as you can — this goes directly to the teaching team.`,
      (c,cs) => `Is the issue something that could realistically change this semester, or is it more structural?`,
    ],
    neutral: [
      (c,cs) => `What's one thing that's working, and one thing that isn't? The teaching team can act on this while the semester is still running.`,
      (c,cs) => `How has the support from tutors and supervisors been during placements?`,
    ]
  },
  change: {
    positive: [
      (c,cs) => `Even when things are going well — what one tweak would make the biggest difference for your remaining time in ${c.code}?`,
    ],
    negative: [
      (c,cs) => `If the course coordinator could change one thing tomorrow, what should it be?`,
      (c,cs) => `Is this something other students would agree with, or is it more about your individual experience?`,
    ],
    neutral: [
      (c,cs) => `What one change would most improve your experience for the rest of this semester?`,
      (c,cs) => `Is there anything you need from the teaching team that you're not currently getting?`,
    ]
  }
};

// Track used responses to NEVER repeat
const usedResponses = new Set();

// Main response generator
// nextStep tells us what's coming — if it's interactive (scale/mcq/emoji), we transition; if chat, we ask open questions
const generateResponse = (course, step, userText, allMsgs, responses, nextStep) => {
  const casual = isCasual(allMsgs);
  const sent = userText ? sentiment(userText) : "neutral";
  const topics = userText ? extractTopics(userText) : [];
  const isMed = course.mode === "lite";
  const nextIsInteractive = nextStep && (nextStep.type === "scale" || nextStep.type === "mcq" || nextStep.type === "emoji");

  // ─── WELCOME ───
  if (step.id === "welcome") {
    // If student already responded to welcome → acknowledge with sentiment awareness and transition
    if (userText) {
      const intro = nextIsInteractive ? (nextStep.type === "scale" ? " Quick rating coming up:" : " Next one:") : "";
      if (sent === "negative") {
        return casual
          ? `Sounds like it's been rough — that's exactly the kind of feedback that matters.${intro}`
          : `I appreciate you being upfront about that. This is exactly why we're asking.${intro}`;
      } else if (sent === "positive") {
        return casual
          ? `Good to hear it's been solid! Let's get into the details.${intro}`
          : `That's great to hear. Let's dig into the specifics.${intro}`;
      }
      return casual
        ? `Cheers for that! Let's get into the details.${intro}`
        : `Thanks for sharing that. Let's get into the specifics.${intro}`;
    }
    if (isMed) {
      return `Hi — thanks for taking a few minutes for this mid-semester check-in on ${course.name}. This is completely anonymous and goes directly to the teaching team while there's still time to make changes. Let's start with a quick rating.`;
    }
    const greetings = casual ? [
      `Yo! Thanks for taking a sec to chat about ${course.name}. Quick heads up — ${course.recentChange}. Before we dive in, how'd you find the course overall? First vibes.`,
      `Hey! So ${course.code} — ${course.recentChange}. Curious how that landed. What's your overall take on the course?`,
      `What's up! Quick chat about ${course.name}. Just so you know, ${course.recentChange}. How are you feeling about the course so far?`,
    ] : [
      `Thanks for taking a few minutes to share your thoughts on ${course.name}. I know ${course.recentChange}, so I'm curious how that landed. What was your overall impression?`,
      `Hi there — this is a quick feedback chat for ${course.code}. A notable change this semester: ${course.recentChange}. Before we get into specifics, what was your overall experience like?`,
      `Welcome! I'd love to hear your thoughts on ${course.name} this semester. There were some changes — specifically, ${course.recentChange}. What's your take on the course overall?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // ─── CLOSING ───
  if (step.id === "end") {
    const scales = responses.filter(r => r.type === "scale");
    const avg = scales.length ? (scales.reduce((a,s)=>a+s.value,0)/scales.length).toFixed(1) : "N/A";
    const high = scales.filter(s => s.value >= 8).map(s => s.secat);
    const low = scales.filter(s => s.value <= 4).map(s => s.secat);
    let summary = "";
    if (high.length) summary += `You rated ${high.join(", ")} pretty highly. `;
    if (low.length) summary += `${low.join(", ")} scored lower — that's useful for the teaching team to know. `;

    if (isMed) {
      return `Thank you — this is exactly the kind of feedback that can make a difference while the semester is still running. ${summary}Everything here goes to the ${course.code} teaching team anonymously. They'll be reviewing mid-semester feedback this week.`;
    }
    return casual
      ? `Legend, thanks heaps for all that! ${summary}Your average was ${avg}/10. Everything here goes straight to the ${course.code} teaching team — no names attached. Cheers! 🙌`
      : `Thank you for all of that — it genuinely helps improve the course. ${summary}Your overall average was ${avg}/10. All responses are shared with the ${course.code} teaching team anonymously. Really appreciate your time.`;
  }

  // ─── CHAT FOLLOW-UPS ───
  if (step.type === "chat" && step.topic) {
    // If next step is interactive → sentiment-aware acknowledge + introduce the next element
    if (nextIsInteractive) {
      const isScale = nextStep.type === "scale";
      const intro = isScale ? " Quick rating coming up:" : " Next one:";
      if (sent === "negative") {
        const acks = casual ? [
          `That's a fair criticism — noted.${intro}`, `Ouch, but that's important to hear.${intro}`,
          `Rough experience — the teaching team needs to hear this.${intro}`, `That's tough. Noted.${intro}`,
        ] : [
          `That's important feedback — thank you for being direct.${intro}`, `Understood — that's a real concern.${intro}`,
          `That's significant — the teaching team should know.${intro}`, `Noted — I can see that was frustrating.${intro}`,
        ];
        return acks[Math.floor(Math.random() * acks.length)];
      } else if (sent === "positive") {
        const acks = casual ? [
          `Nice, good to hear!${intro}`, `Solid — cheers for that.${intro}`,
          `That's great feedback.${intro}`, `Glad that worked well!${intro}`,
        ] : [
          `That's encouraging to hear.${intro}`, `Good to know — thank you.${intro}`,
          `Positive feedback noted.${intro}`, `That's great — the teaching team will appreciate hearing that.${intro}`,
        ];
        return acks[Math.floor(Math.random() * acks.length)];
      }
      const acks = casual ? [
        `Got it, cheers.${intro}`, `Fair enough — noted.${intro}`,
        `Cool, makes sense.${intro}`, `Noted!${intro}`,
      ] : [
        `Understood — thank you.${intro}`, `Noted, that's helpful.${intro}`,
        `Good to know.${intro}`, `Thank you for that.${intro}`,
      ];
      return acks[Math.floor(Math.random() * acks.length)];
    }

    const pool = RESPONSE_BANK[step.topic]?.[sent] || RESPONSE_BANK[step.topic]?.neutral || [];

    // Generate all options and filter out already-used ones
    const options = pool.map(fn => fn(course, casual));
    const fresh = options.filter(r => !usedResponses.has(r));

    let chosen;
    if (fresh.length > 0) {
      chosen = fresh[Math.floor(Math.random() * fresh.length)];
    } else {
      // All used — reset tracking for this topic and pick randomly
      options.forEach(r => usedResponses.delete(r));
      chosen = options[Math.floor(Math.random() * options.length)] || `Tell me more about what you mean by that.`;
    }
    usedResponses.add(chosen);

    // Add contextual hooks for specific topics mentioned (only when next is chat)
    if (topics.includes("project") && course.code.includes("4203") && !chosen.includes("code interview")) {
      chosen += casual ? " The code interview is a big deal — did that feel fair?" : "";
    }
    if (topics.includes("cloud-tech") && course.code.includes("3208") && !chosen.includes("Docker")) {
      chosen += casual ? " Was Docker the tricky bit, or more Kubernetes?" : "";
    }
    if (topics.includes("workload") && !chosen.includes("workload")) {
      chosen += casual ? " Was it consistently heavy, or did it spike around deadlines?" : "";
    }

    return chosen.trim();
  }

  // ─── AFTER INTERACTIVE ELEMENTS ───
  const lastResp = responses[responses.length - 1];
  if (lastResp) {
    const val = lastResp.value;
    if (lastResp.type === "scale") {
      const num = typeof val === "number" ? val : parseInt(val);
      // If next step is interactive → short acknowledgment + transition
      if (nextIsInteractive) {
        if (num >= 8) {
          const opts = casual
            ? [`${num}/10 — solid! Moving on...`, `Nice, ${num}. Noted!`, `${num} — respect. Next one:`]
            : [`${num} out of 10 — noted, thank you.`, `A strong ${num}. Let's continue.`, `${num}/10 — good to know. Next:`];
          return opts[Math.floor(Math.random() * opts.length)];
        } else if (num >= 5) {
          const opts = casual
            ? [`${num}/10 — fair enough. Next up:`, `${num}, got it. Moving along:`, `${num} — noted. Let's keep going.`]
            : [`${num} out of 10 — understood. Moving on:`, `A ${num} — noted. Next question:`, `${num}/10 — fair. Continuing:`];
          return opts[Math.floor(Math.random() * opts.length)];
        } else {
          const opts = casual
            ? [`${num}/10 — ouch. Noted. Next:`, `${num}... yeah, that's telling. Moving on:`, `${num} — that says a lot. Next one:`]
            : [`A ${num} — that's significant. Let's continue:`, `${num} out of 10 — noted. Moving on:`, `${num}/10 — important feedback. Next:`];
          return opts[Math.floor(Math.random() * opts.length)];
        }
      }
      // Next step is chat → ask open-ended follow-up
      if (num >= 8) {
        const opts = casual ? [
          `${num}/10 — that's solid! What specifically earned that score?`,
          `Nice, ${num}! What made it work so well for you?`,
          `${num} — high praise. Was there a standout moment, or just consistently good?`,
          `${num}/10, respect. What's the ${course.code} team doing right?`,
        ] : [
          `${num} out of 10 — that's a strong rating. What drove that?`,
          `A ${num} — great. What contributed most to that positive experience?`,
          `${num}/10 — notable. Was that consistent across the semester, or did it build over time?`,
          `${num} out of 10 is meaningful. What specifically stood out?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      } else if (num >= 5) {
        const opts = casual ? [
          `${num}/10 — decent but not amazing. What would've pushed it higher?`,
          `${num}, yeah fair. What held it back?`,
          `${num}/10 — middle of the road. Was it like "fine but forgettable" or "had potential but missed"?`,
          `${num} — not bad, not great. What's the gap between this and an 8?`,
        ] : [
          `A ${num} — there's room to improve. What would have made the difference?`,
          `${num} out of 10 — what was missing?`,
          `${num}/10 suggests mixed feelings. What worked and what didn't?`,
          `A ${num} is useful feedback. What specifically would need to change to push that higher?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      } else {
        const opts = casual ? [
          `${num}/10 — that's pretty low. What went wrong?`,
          `${num}... yeah that's rough. Was it one big problem or a bunch of small ones?`,
          `Oof, ${num}. What's the story there?`,
          `${num}/10 — that's a strong signal something needs fixing. What was the main issue?`,
        ] : [
          `A ${num} — that's significant. What was the main issue?`,
          `${num} out of 10 — that's concerning. Was there a particular thing that drove that?`,
          `A ${num} is notable feedback. Can you unpack what led to that rating?`,
          `${num}/10 — clearly something isn't working. What would you point to as the core problem?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      }
    }

    if (lastResp.type === "mcq") {
      if (nextIsInteractive) {
        // Short transition
        if (val.includes("well organised") || val.includes("timely")) return casual ? `Good stuff. Next:` : `Noted, that's positive. Moving on:`;
        if (val.includes("serious work") || val.includes("all over") || val.includes("None")) return casual ? `That's rough. Noted. Next one:` : `Important feedback — noted. Continuing:`;
        return casual ? `Got it. Next:` : `Understood. Let's continue:`;
      }
      if (val.includes("well organised") || val.includes("timely")) {
        const opts = casual ? [
          `Good to hear! What specifically made it feel well organised?`,
          `Rare feedback! Was it the course team being on it, or just a naturally logical flow?`,
        ] : [
          `That's positive. What contributed most to that?`,
          `Good to hear. Was that consistent across the whole semester?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      } else if (val.includes("gaps") || val.includes("not enough")) {
        const opts = casual ? [
          `Where were the gaps? Lectures, labs, or the overall flow?`,
          `Yeah, gaps are annoying. Were they in the content, or more in the support you got?`,
        ] : [
          `Where did you notice the biggest gaps?`,
          `Was the issue with content coverage, or with the support and feedback mechanisms?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      } else if (val.includes("all over") || val.includes("Barely") || val.includes("None")) {
        const opts = casual ? [
          `Yikes. Can you give me a specific example of where it fell apart?`,
          `That bad? What was the moment you thought "this is not it"?`,
        ] : [
          `That's important feedback. Can you point to a specific moment where that was most noticeable?`,
          `That's a strong response. What would you identify as the root cause?`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      } else if (val.includes("serious work")) {
        return casual ? `That bad? What was the #1 thing that needed fixing?` : `That's strong feedback. What was the single biggest structural issue?`;
      }
    }

    if (lastResp.type === "emoji") {
      if (nextIsInteractive) {
        if (val === "Excellent" || val === "Good") return casual ? `Nice one. Next:` : `Good to know. Continuing:`;
        return casual ? `Fair enough. Moving on:` : `Noted. Let's continue:`;
      }
      const emojiResponses = {
        Excellent: casual
          ? [`🔥 is right! Which materials were the MVP?`, `Elite materials. Were the slides enough, or was it other stuff like recordings or ed posts?`]
          : [`Which specific materials were most valuable?`, `Were there particular resources that stood out?`],
        Good: casual
          ? [`Solid. Anything that could've been better?`, `Not bad. Was it the slides, the textbook, or something else carrying the weight?`]
          : [`Good to hear. Was there anything missing?`, `Which materials were most useful, and were any unnecessary?`],
        Meh: casual
          ? [`Meh is honest lol. What would've made them actually useful?`, `Fair. Were they outdated, too dense, or just... boring?`]
          : [`What kind of materials would have helped more?`, `Were the materials insufficient, or just not well-suited to how you learn?`],
        Poor: casual
          ? [`Rough. Outdated, confusing, or just not there?`, `Yikes. What did you end up using instead? YouTube? Stack Overflow?`]
          : [`Were the materials insufficient, outdated, or unclear?`, `What alternative resources did you rely on instead?`],
      };
      const pool = emojiResponses[val] || [`Tell me more about that.`];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // Extract a key phrase from student's message for natural echoing
  const echoWords = userText ? userText.replace(/[.!?,;:'"]/g, "").split(" ").filter(w => w.length > 3) : [];
  const echoPhrase = echoWords.slice(0, 4).join(" ").toLowerCase();

  if (sent === "negative") {
    if (echoPhrase && casual) {
      const opts = [
        `"${echoPhrase}" — yeah, that's rough. What was the worst part?`,
        `Hearing "${echoPhrase}" — that's not great. What specifically made it that way?`,
        `So ${echoPhrase} was a problem — was it a one-off or ongoing?`,
      ];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    return casual ? `That sounds rough — what specifically made it bad?` : `That's a real concern. What was the main issue?`;
  }
  if (sent === "positive") {
    if (echoPhrase && casual) {
      const opts = [
        `"${echoPhrase}" — love that! What made it stand out?`,
        `So ${echoPhrase} worked well — was that consistent or just sometimes?`,
        `Good to hear about ${echoPhrase}! What specifically clicked?`,
      ];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    return casual ? `That's awesome — what made it work so well?` : `That's encouraging. What specifically contributed to that?`;
  }
  if (echoPhrase) {
    const opts = casual ? [
      `${echoPhrase} — interesting. Can you break that down a bit?`,
      `So ${echoPhrase} — was that a highlight or a pain point?`,
    ] : [
      `You mentioned ${echoPhrase} — could you unpack that a bit?`,
      `Regarding ${echoPhrase} — what specifically stands out?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  return casual ? `Hm, tell me more — what specifically are you thinking of?` : `Could you be more specific about what you mean?`;
};

// Try Ollama, fall back to smart engine
const getResponse = async (course, step, userText, allMsgs, responses, nextStep) => {
  const smart = generateResponse(course, step, userText, allMsgs, responses, nextStep);
  const nextIsInteractive = nextStep && (nextStep.type === "scale" || nextStep.type === "mcq" || nextStep.type === "emoji");

  // Skip LLM entirely for transitions — rule engine handles these reliably
  if (nextIsInteractive) return smart;

  try {
    const casual = isCasual(allMsgs);
    const sent = userText ? sentiment(userText) : "neutral";
    const topics = userText ? extractTopics(userText) : [];
    const tone = casual ? "friendly Australian uni student who uses casual language" : "warm, approachable academic advisor";
    const topicCtx = topics.length ? `They're talking about: ${topics.join(", ")}.` : "";
    const sentCtx = sent === "positive" ? "They seem happy about this." : sent === "negative" ? "They seem frustrated or unhappy." : "Their tone is neutral.";

    const lastUserMsg = allMsgs.filter(m => m.role === "user" && !m.hidden).slice(-1)[0]?.content || "";

    // ── Conversation self-awareness ──
    const userMsgs = allMsgs.filter(m => m.role === "user" && !m.hidden);

    const progress = responses.length;
    const totalSteps = course.mode === "lite" ? 6 : 14;
    const progressPct = Math.round((progress / totalSteps) * 100);

    // Sentiment trend — is the student getting happier or more frustrated?
    const recentSentiments = userMsgs.slice(-4).map(m => sentiment(m.content));
    const sentTrend = (() => {
      if (recentSentiments.length < 2) return "unknown";
      const last2 = recentSentiments.slice(-2);
      const prev2 = recentSentiments.slice(0, 2);
      const negRecent = last2.filter(s => s === "negative").length;
      const negPrev = prev2.filter(s => s === "negative").length;
      const posRecent = last2.filter(s => s === "positive").length;
      const posPrev = prev2.filter(s => s === "positive").length;
      if (negRecent > negPrev) return "declining";
      if (posRecent > posPrev) return "improving";
      return "steady";
    })();

    // Engagement level — are responses getting shorter?
    const avgLen = userMsgs.length ? userMsgs.reduce((a, m) => a + m.content.length, 0) / userMsgs.length : 50;
    const lastLen = lastUserMsg.length;
    const engagement = lastLen < 10 ? "very_low" : lastLen < avgLen * 0.4 ? "dropping" : lastLen > avgLen * 1.5 ? "high" : "normal";

    // Build awareness context for the prompt
    const awarenessCtx = (() => {
      let ctx = `\nCONVERSATION STATE: ${progressPct}% through (${progress}/${totalSteps} questions). `;
      if (progressPct > 75) ctx += "We're nearly done — keep energy up and thank them for sticking with it. ";
      else if (progressPct > 40) ctx += "We're in the middle section — maintain momentum. ";
      else ctx += "Still early — build rapport. ";

      if (sentTrend === "declining") ctx += "WARNING: Student mood is getting worse as the conversation progresses. Acknowledge this shift — 'I can tell this is bringing up some frustrations' — and be extra empathetic. ";
      else if (sentTrend === "improving") ctx += "Student is warming up and becoming more positive. Match that energy — they're opening up. ";

      if (engagement === "very_low") ctx += "ALERT: Student gave a very short response (possibly disengaged or frustrated). Don't push hard — acknowledge briefly and keep moving. Consider: 'No worries, short answers are fine too.' ";
      else if (engagement === "dropping") ctx += "Student responses are getting shorter — they might be losing interest. Keep your response tight and make the next question feel easy to answer. ";
      else if (engagement === "high") ctx += "Student is highly engaged and writing detailed responses. Match their depth — dig into what they're saying. ";

      return ctx;
    })();

    const prompt = `You are a human teaching assistant collecting ${course.mode === "lite" ? "mid-semester" : "end-of-semester SECaT"} feedback for ${course.code} "${course.name}" at UQ.

PERSONALITY: ${tone}. You talk like a real person — not a chatbot. You listen carefully and reflect back what students tell you using THEIR words.

COURSE CONTEXT (use naturally, never dump):
- Assessments: ${course.assessments.join(", ")}
- Key topics: ${course.topics.join(", ")}
- Recent change: ${course.recentChange}
- Notable: ${course.keyDetail}

Current area: ${step.topic || step.secat || "general"}
${topicCtx} ${sentCtx}\n${awarenessCtx}
${course.mode === "lite" ? "MID-SEMESTER check — focus on what can still change." : ""}

The student just said: "${lastUserMsg}"

HOW TO RESPOND — be human:
1. ECHO BACK a specific thing they said using their own words. If they said "the labs were really fun", say something like "Fun labs — that's not something every course gets right." If they said "I hated the group project", say "Yeah, group projects can be brutal — what made it so bad?"
2. Show you actually processed their input. Reference the SPECIFIC thing they mentioned — don't give a generic response.
3. Then ask ONE focused follow-up that digs deeper into what they said.

CONVERSATION STYLE:
- ${casual ? "Casual Aussie vibe — contractions, slang okay. Sound like a mate, not a form." : "Warm and professional — like a tutor who genuinely cares."}
- Mirror their energy: if they're enthusiastic, be enthusiastic back. If they're frustrated, acknowledge it genuinely.
- Use sentence fragments, dashes, and natural speech patterns. Real people don't always speak in complete sentences.
- ${sent === "negative" ? "CRITICAL: The student is unhappy. Do NOT say thanks/appreciated/great. Validate their frustration FIRST — 'Yeah, that sounds rough' or 'That's not okay' — then ask what went wrong." : sent === "positive" ? "Match their positive energy. Reflect their enthusiasm back genuinely — 'That's awesome' or 'Love hearing that'." : "Neutral tone — be straightforward and engaged."}

HARD RULES:
- 1-2 sentences MAX.
- NEVER use: "Thanks for sharing", "That's interesting", "Could you tell me more", "I appreciate", "Great point", "It sounds like", "You felt that", "That's valuable feedback".
- NEVER start with "I".
- NEVER list course data or schedules.
- Ask about something SPECIFIC they said — not generic "can you elaborate".
${nextIsInteractive ? `- CRITICAL: Next is a ${nextStep.type}${nextStep.label ? ` ("${nextStep.label}")` : ""}. ONE short sentence acknowledging what they said — NO question. They interact with a ${nextStep.type} widget next.` : "- End with a specific follow-up question based on what they just told you."}`;

    const llmMessages = [
      { role: "system", content: prompt },
      ...allMsgs.filter(m=>!m.hidden).slice(-6).map(m=>({role:m.role,content:m.content}))
    ];
    const llmOptions = { temperature: 0.8, num_predict: nextIsInteractive ? 40 : 120 };

    // In production: use /api/chat (Vercel serverless → Gemini)
    // In dev: use /ollama/api/chat (Vite proxy → local Ollama)
    const llmUrl = IS_PRODUCTION ? "/api/chat" : "/ollama/api/chat";
    const llmBody = IS_PRODUCTION
      ? { messages: llmMessages, options: llmOptions }
      : { model: "llama3.1", stream: false, messages: llmMessages, options: llmOptions };

    const res = await fetch(llmUrl, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(llmBody),
      signal: AbortSignal.timeout(IS_PRODUCTION ? 20000 : 15000)
    });
    if (!res.ok) throw new Error("LLM HTTP " + res.status);
    const d = await res.json();
    const reply = d.message?.content?.trim();
    // Quality gate — reject generic/short/long/lazy/data-dump responses
    const maxLen = nextIsInteractive ? 150 : 400;
    if (reply && reply.length > 15 && reply.length < maxLen
        && !/tell me (a bit )?more/i.test(reply)
        && !/thanks for (that|sharing)/i.test(reply)
        && !/that'?s interesting/i.test(reply)
        && !/I appreciate/i.test(reply)
        && !/could you (elaborate|expand)/i.test(reply)
        && !/You felt that/i.test(reply)
        && !/Wk\d+-\d+/i.test(reply)           // reject weekly schedule dumps
        && !(reply.match(/\(\d+%\)/g)||[]).length >= 2  // reject assessment weight lists
        && !/It sounds like/i.test(reply)) {
      return reply;
    }
  } catch (_e) { /* Ollama unavailable or timed out — smart engine handles it */ }

  return smart;
};

/* ═══════════
   BAD WORDS & PRIVACY
   ═══════════ */
const BAD = /\b(fuck\w*|shit\w*|bitch\w*|asshole|dickhead|cunt|retard\w*)\b/i;
const PRIVACY = /\b(Dr\.?\s+[A-Z][a-z]+|Prof\.?\s+[A-Z][a-z]+)\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b[sS]\d{7,8}\b/;

// Redact privacy info from stored responses (strip before save)
const redact = (text) => text.replace(PRIVACY, "[REDACTED]");

/* ═══════════
   ANIMATIONS CSS
   ═══════════ */
const GLOBAL_STYLES = `
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

  input[type="range"] { -webkit-appearance: none; appearance: none; }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
    background: #fff; border: 3px solid #51247A; cursor: pointer; margin-top: -6px;
    box-shadow: 0 2px 6px rgba(0,0,0,.2);
  }
  input[type="range"]::-webkit-slider-runnable-track {
    height: 10px; border-radius: 5px;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }
`;

/* ═══════════
   COMPONENTS — pure inline styles (no Tailwind)
   ═══════════ */
function Bubble({ role, text, isTyping, timestamp }) {
  const bot = role === "assistant";
  return (
    <div style={{display:"flex",justifyContent:bot?"flex-start":"flex-end",marginBottom:16,animation:"slideUp .3s ease-out"}}>
      {bot && (
        <div style={{width:36,height:36,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,marginTop:4,flexShrink:0,background:"linear-gradient(135deg,#51247A,#962A8B)",boxShadow:"0 2px 8px rgba(81,36,122,.3)"}}>
          <span style={{color:"#fff",fontSize:10,fontWeight:700,letterSpacing:1}}>UQ</span>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",maxWidth:"78%"}}>
        <div style={{
          padding:"12px 16px",fontSize:15,lineHeight:1.6,borderRadius:16,
          ...(bot
            ? {background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",color:"#f3f4f6",borderTopLeftRadius:6}
            : {background:"linear-gradient(135deg,#51247A,#7B2D8E)",color:"#fff",borderTopRightRadius:6})
        }}>
          {isTyping ? (
            <div style={{display:"flex",gap:8,padding:"4px 0"}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#a78bfa",animation:`bounce 1.4s ease-in-out ${i*.2}s infinite`}}/>)}
            </div>
          ) : (
            <span style={{whiteSpace:"pre-wrap"}}>{text}</span>
          )}
        </div>
        {timestamp && <span style={{fontSize:10,color:"#4b5563",marginTop:4,paddingLeft:4,alignSelf:bot?"flex-start":"flex-end"}}>{timestamp}</span>}
      </div>
    </div>
  );
}

function Scale({label,lo,hi,onSubmit}){
  const[v,setV]=useState(5);
  const color = v<=3 ? "#E85A4F" : v<=6 ? "#F9C846" : "#22C55E";
  return(
    <div style={{margin:"0 8px 16px",padding:24,borderRadius:16,border:"1px solid rgba(150,42,139,.2)",background:"rgba(81,36,122,.08)",animation:"slideUp .4s ease-out"}}>
      <p style={{color:"#e5e7eb",fontSize:14,fontWeight:500,marginBottom:20}}>{label}</p>
      <div style={{position:"relative",marginBottom:8}}>
        <input type="range" min="0" max="10" value={v} onChange={e=>setV(+e.target.value)}
          style={{width:"100%",height:10,borderRadius:5,cursor:"pointer",background:`linear-gradient(90deg, ${color} ${v*10}%, rgba(255,255,255,.08) ${v*10}%)`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:12,color:"#6b7280"}}>{lo}</span>
        <span style={{fontSize:36,fontWeight:700,color,fontFamily:"Georgia,serif",transition:"all .3s"}}>{v}</span>
        <span style={{fontSize:12,color:"#6b7280"}}>{hi}</span>
      </div>
      <button onClick={()=>onSubmit(v)}
        style={{width:"100%",padding:"12px 0",borderRadius:12,fontSize:14,fontWeight:600,color:"#fff",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#51247A,#962A8B)",boxShadow:"0 4px 15px rgba(81,36,122,.3)"}}>
        Lock it in
      </button>
    </div>
  );
}

function MCQ({label,options,onSubmit}){
  const [hovered, setHovered] = useState(null);
  return(
    <div style={{margin:"0 8px 16px",padding:24,borderRadius:16,border:"1px solid rgba(150,42,139,.2)",background:"rgba(81,36,122,.08)",animation:"slideUp .4s ease-out"}}>
      <p style={{color:"#e5e7eb",fontSize:14,fontWeight:500,marginBottom:16}}>{label}</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{options.map((o,i)=>(
        <button key={i} onClick={()=>onSubmit(o)}
          onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
          style={{width:"100%",textAlign:"left",padding:"14px 16px",borderRadius:12,fontSize:14,color:"#e5e7eb",border:`1px solid ${hovered===i?"rgba(150,42,139,.5)":"rgba(255,255,255,.08)"}`,background:hovered===i?"rgba(150,42,139,.12)":"transparent",cursor:"pointer",transition:"all .2s"}}>
          {o}
        </button>
      ))}</div>
    </div>
  );
}

function Emoji({label,emojis,onSubmit}){
  const [hovered, setHovered] = useState(null);
  return(
    <div style={{margin:"0 8px 16px",padding:24,borderRadius:16,border:"1px solid rgba(150,42,139,.2)",background:"rgba(81,36,122,.08)",animation:"slideUp .4s ease-out"}}>
      <p style={{color:"#e5e7eb",fontSize:14,fontWeight:500,marginBottom:20}}>{label}</p>
      <div style={{display:"flex",justifyContent:"center",gap:16}}>{emojis.map((o,i)=>(
        <button key={i} onClick={()=>onSubmit(o.l)}
          onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:16,borderRadius:12,border:`1px solid ${hovered===i?"rgba(150,42,139,.5)":"rgba(255,255,255,.08)"}`,background:hovered===i?"rgba(150,42,139,.12)":"transparent",cursor:"pointer",transition:"all .2s",transform:hovered===i?"scale(1.1)":"scale(1)"}}>
          <span style={{fontSize:30}}>{o.e}</span>
          <span style={{fontSize:12,color:"#9ca3af"}}>{o.l}</span>
        </button>
      ))}</div>
    </div>
  );
}

/* ═══════════════
   DASHBOARD v5
   ═══════════════ */
function Dash({responses,course,onBack}){
  const[allSessions,setAllSessions]=useState([]);
  const[filterCourse,setFilterCourse]=useState("all");
  const[loadingSessions,setLoadingSessions]=useState(false);
  const[statusMsg,setStatusMsg]=useState("");
  const[compareCourse,setCompareCourse]=useState("");

  // Fetch all saved sessions from server
  const fetchSessions=async()=>{
    setLoadingSessions(true);
    try{
      const data=await api.getSessions();
      setAllSessions(Array.isArray(data)?data:[]);
    }catch(e){console.warn("Failed to fetch sessions:",e)}
    setLoadingSessions(false);
  };
  useEffect(()=>{api.getSessions().then(d=>setAllSessions(Array.isArray(d)?d:[])).catch(()=>{});},[]);

  // Current session data
  const scales=responses.filter(r=>r.type==="scale");
  const mcqs=responses.filter(r=>r.type==="mcq"||r.type==="emoji");
  const chats=responses.filter(r=>r.type==="chat"&&r.value);
  const bar=scales.map(s=>({name:s.secat||s.id,score:s.value}));
  const radar=scales.map(s=>({q:s.secat||s.id,val:s.value,fullMark:10}));
  const avg=scales.length?(scales.reduce((a,s)=>a+s.value,0)/scales.length).toFixed(1):"—";

  const sentimentData = chats.reduce((acc, c) => { const s = sentiment(c.value); acc[s] = (acc[s]||0) + 1; return acc; }, {});
  const sentPie = Object.entries(sentimentData).map(([name,value]) => ({name,value}));
  const SENT_COLORS = { positive: "#22C55E", negative: "#E85A4F", neutral: "#F9C846" };

  const allText=chats.map(c=>c.value).join(" ").toLowerCase();
  const stop=new Set("the a an is was were are be been i my me it its this that in on of to for and but or with at from by not had have has do did would could should will they them we you your about more also very just like so really some when what how there than then if can all no much too get got being which who as up out only lot think feel bit was".split(" "));
  const words=allText.split(/\W+/).filter(w=>w.length>2&&!stop.has(w));
  const freq={};words.forEach(w=>{freq[w]=(freq[w]||0)+1});
  const top=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,15);

  const topicsMentioned = {};
  chats.forEach(c => { extractTopics(c.value).forEach(t => { topicsMentioned[t] = (topicsMentioned[t]||0) + 1; }); });
  const topicsList = Object.entries(topicsMentioned).sort((a,b) => b[1]-a[1]);

  // Sentiment strength scorer — counts how many sentiment words appear
  const sentimentStrength = (text) => {
    const t = text.toLowerCase();
    const pos = (t.match(/\b(great|excellent|amazing|loved|fantastic|helpful|clear|good|best|enjoyed|awesome|engaging|useful|valuable|solid|brilliant|outstanding|perfect|recommend)\b/g)||[]).length;
    const neg = (t.match(/\b(bad|poor|terrible|confusing|unclear|boring|hard|difficult|frustrating|useless|waste|worst|hate|awful|weak|disappointed|unfair|pointless|horrible|sucks|crap|avoid|struggle|dreadful)\b/g)||[]).length;
    const negations = (t.match(/\b(don'?t|not|never|no good|wouldn'?t|stay away)\b/g)||[]).length;
    return { score: pos - neg - negations, pos, neg: neg + negations };
  };

  // Manual CSV export (current session only)
  const exportCSV=()=>{
    if(!responses.length) return;
    let csv="Course,Question,Type,Response,Sentiment,Timestamp\n";
    responses.forEach(r=>{
      const s = r.type==="chat" && r.value ? sentiment(r.value) : "";
      csv+=`"${course.code}","${(r.label||r.secat||r.topic||"").replace(/"/g,"'")}","${r.type}","${String(r.value||"").replace(/"/g,"'").replace(/\n/g," ")}","${s}","${r.timestamp||""}"\n`;
    });
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`SECaT_${course.code.replace(/\//g,"-")}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };

  const exportJSON=()=>{
    if(!responses.length) return;
    const data = {
      course: { code: course.code, name: course.name, semester: course.semester, mode: course.mode },
      summary: { averageScore: parseFloat(avg), totalResponses: responses.length, sentimentBreakdown: sentimentData, topicsDiscussed: topicsMentioned },
      responses: responses.map(r => ({...r, sentiment: r.type==="chat" && r.value ? sentiment(r.value) : null})),
      exportedAt: new Date().toISOString()
    };
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download=`SECaT_${course.code.replace(/\//g,"-")}_${new Date().toISOString().slice(0,10)}.json`;a.click();
  };

  // Bulk CSV export (all filtered sessions from server-side data)
  const exportAllCSV=()=>{
    if(!filtered.length) return;
    let csv="Course,Question,Type,Response,Sentiment,Timestamp,SessionID,SessionDate\n";
    filtered.forEach(s=>{
      (s.responses||[]).forEach(r=>{
        const sent = r.sentiment || (r.type==="chat" && r.value ? sentiment(r.value) : "");
        csv+=`"${s.course?.code||""}","${(r.label||r.secat||r.topic||"").replace(/"/g,"'")}","${r.type}","${String(r.value||"").replace(/"/g,"'").replace(/\n/g," ")}","${sent}","${r.timestamp||""}","${s.sessionId||""}","${s.exportedAt||""}"\n`;
      });
    });
    const label = filterCourse==="all"?"All_Courses":filterCourse.replace(/\//g,"-");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`SECaT_${label}_${filtered.length}sessions_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };

  // Bulk JSON export (all filtered sessions from server-side data)
  const exportAllJSON=()=>{
    if(!filtered.length) return;
    const data = {
      exportedAt: new Date().toISOString(),
      filter: filterCourse,
      totalSessions: filtered.length,
      sessions: filtered
    };
    const label = filterCourse==="all"?"All_Courses":filterCourse.replace(/\//g,"-");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download=`SECaT_${label}_${filtered.length}sessions_${new Date().toISOString().slice(0,10)}.json`;a.click();
  };

  // Clear all saved data
  const clearAllData=async()=>{
    if(!window.confirm("Delete ALL saved feedback data? This cannot be undone."))return;
    try{
      const res=await api.clearData();
      if(res.ok){setAllSessions([]);setStatusMsg("All data cleared.");setTimeout(()=>setStatusMsg(""),3000)}
    }catch(e){setStatusMsg("Failed to clear data: "+e.message)}
  };

  // Filtered sessions
  const uniqueCourses=[...new Set(allSessions.map(s=>s.course?.code).filter(Boolean))];
  const filtered=filterCourse==="all"?allSessions:allSessions.filter(s=>s.course?.code===filterCourse);

  // Aggregate stats across all filtered sessions
  const aggScales=filtered.flatMap(s=>s.responses?.filter(r=>r.type==="scale")||[]);
  const aggAvg=aggScales.length?(aggScales.reduce((a,s)=>a+Number(s.value),0)/aggScales.length).toFixed(1):"—";
  const aggSent=filtered.reduce((acc,s)=>{
    const sb=s.summary?.sentimentBreakdown||{};
    Object.entries(sb).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v});return acc;
  },{});

  // Heatmap data: questions × sessions
  const heatmapQuestions = [...new Set(filtered.flatMap(s => (s.responses||[]).filter(r => r.type === "scale").map(r => r.secat || r.label)))];
  const heatmapData = heatmapQuestions.map(q => {
    const scores = filtered.map(s => {
      const match = (s.responses||[]).find(r => r.type === "scale" && (r.secat === q || r.label === q));
      return match ? Number(match.value) : null;
    }).filter(v => v !== null);
    const hAvg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : null;
    return { question: q, scores, avg: hAvg ? parseFloat(hAvg) : null, count: scores.length };
  });

  // Comment highlights — top positive and negative across all sessions
  const allComments = filtered.flatMap(s => (s.responses||[]).filter(r => r.type === "chat" && r.value).map(r => ({
    ...r, course: s.course?.code, sessionId: s.sessionId, strength: sentimentStrength(r.value)
  })));
  const topPositive = allComments.filter(c => c.strength.score > 0).sort((a,b) => b.strength.score - a.strength.score).slice(0, 3);
  const topNegative = allComments.filter(c => c.strength.score < 0).sort((a,b) => a.strength.score - b.strength.score).slice(0, 3);

  // ═══ Aggregate chart data from ALL filtered sessions (used when no current session) ═══
  const aggBar = (() => {
    const byQ = {};
    aggScales.forEach(r => { const k = r.secat || r.label; if (!byQ[k]) byQ[k] = []; byQ[k].push(Number(r.value)); });
    return Object.entries(byQ).map(([name, vals]) => ({ name, score: parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)) }));
  })();
  const aggRadar = aggBar.map(b => ({ q: b.name, val: b.score, fullMark: 10 }));
  const aggChats = filtered.flatMap(s => (s.responses||[]).filter(r => r.type === "chat" && r.value));
  const aggSentPie = Object.entries(aggSent).map(([name,value]) => ({name,value}));
  const aggAllText = aggChats.map(c => c.value).join(" ").toLowerCase();
  const aggWords = aggAllText.split(/\W+/).filter(w => w.length > 2 && !stop.has(w));
  const aggFreq = {}; aggWords.forEach(w => { aggFreq[w] = (aggFreq[w]||0) + 1; });
  const aggTop = Object.entries(aggFreq).sort((a,b) => b[1] - a[1]).slice(0, 15);
  const aggTopicsMentioned = {};
  aggChats.forEach(c => { extractTopics(c.value).forEach(t => { aggTopicsMentioned[t] = (aggTopicsMentioned[t]||0) + 1; }); });
  const aggTopicsList = Object.entries(aggTopicsMentioned).sort((a,b) => b[1] - a[1]);
  const aggMcqs = filtered.flatMap(s => (s.responses||[]).filter(r => r.type === "mcq" || r.type === "emoji"));

  // Unified: use current session data if available, otherwise aggregate
  const hasSession = responses.length > 0;
  const uBar = hasSession ? bar : aggBar;
  const uRadar = hasSession ? radar : aggRadar;
  const uSentPie = hasSession ? sentPie : aggSentPie;
  const uTopicsList = hasSession ? topicsList : aggTopicsList;
  const uTop = hasSession ? top : aggTop;
  const uChats = hasSession ? chats : aggChats;
  const uMcqs = hasSession ? mcqs : aggMcqs;
  const uAvg = hasSession ? avg : aggAvg;
  const uSentimentData = hasSession ? sentimentData : aggSent;
  const uTotalResponses = hasSession ? responses.length : filtered.reduce((a,s) => a + (s.summary?.totalResponses||0), 0);
  const uTotalComments = hasSession ? chats.length : aggChats.length;
  const chartLabel = hasSession ? `CURRENT SESSION — ${course.code}` : `ALL SESSIONS — AGGREGATE (${filtered.length} sessions)`;

  // Comparison data
  const compareData = compareCourse && compareCourse !== course.code ? (() => {
    const cSessions = allSessions.filter(s => s.course?.code === compareCourse);
    const cScales = cSessions.flatMap(s => (s.responses||[]).filter(r => r.type === "scale"));
    const cAvg = cScales.length ? (cScales.reduce((a,s) => a + Number(s.value), 0) / cScales.length).toFixed(1) : "—";
    const cChats = cSessions.flatMap(s => (s.responses||[]).filter(r => r.type === "chat" && r.value));
    const cSent = cChats.reduce((acc, ch) => { const s = sentiment(ch.value); acc[s] = (acc[s]||0) + 1; return acc; }, {});
    const cTopics = {}; cChats.forEach(ch => { extractTopics(ch.value).forEach(t => { cTopics[t] = (cTopics[t]||0) + 1; }); });
    const cByQ = {};
    cScales.forEach(r => { const k = r.secat || r.label; if (!cByQ[k]) cByQ[k] = []; cByQ[k].push(Number(r.value)); });
    const aByQ = {};
    aggScales.forEach(r => { const k = r.secat || r.label; if (!aByQ[k]) aByQ[k] = []; aByQ[k].push(Number(r.value)); });
    const compareQuestions = [...new Set([...Object.keys(aByQ), ...Object.keys(cByQ)])];
    const compareBar = compareQuestions.map(q => ({
      name: q,
      [course.code]: aByQ[q] ? (aByQ[q].reduce((a,b) => a+b, 0) / aByQ[q].length).toFixed(1) : 0,
      [compareCourse]: cByQ[q] ? (cByQ[q].reduce((a,b) => a+b, 0) / cByQ[q].length).toFixed(1) : 0,
    }));
    return { sessions: cSessions.length, avg: cAvg, sent: cSent, topics: Object.entries(cTopics).sort((a,b) => b[1]-a[1]), bar: compareBar };
  })() : null;

  const cardStyle = {borderRadius:16,padding:20,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.03)"};
  const labelStyle = {color:"#6B7280",fontSize:10,letterSpacing:"0.05em",marginBottom:4};
  const labelStyle3 = {color:"#6B7280",fontSize:10,letterSpacing:"0.05em",marginBottom:12};
  const btnStyle = (bg) => ({padding:"10px 16px",borderRadius:12,fontSize:14,fontWeight:500,background:bg,color:"#fff",border:"none",cursor:"pointer"});

  return(
    <div style={{minHeight:"100vh",padding:"16px",background:"linear-gradient(160deg,#0a0a1a,#1a0a2e 40%,#0f1a3e)"}}>
      <style>{GLOBAL_STYLES}{`@media(min-width:768px){.dash-wrap{padding:32px!important}}`}</style>
      <div style={{maxWidth:1024,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:16}}>
          <button onClick={onBack} style={{color:"#9CA3AF",fontSize:14,background:"none",border:"none",cursor:"pointer"}}>← Back to chat</button>
          <button onClick={clearAllData} style={btnStyle("rgba(220,38,38,.7)")}>Clear All Data</button>
        </div>

        {/* Auto-save status banner */}
        <div style={{padding:"10px 16px",borderRadius:12,marginBottom:16,background:"rgba(81,36,122,.12)",border:"1px solid rgba(81,36,122,.3)",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:"#22C55E",display:"inline-block",flexShrink:0}}></span>
          <span style={{color:"#D1D5DB",fontSize:13}}>{IS_PRODUCTION ? "Data auto-saves to Google Sheets after every completed session. The dashboard reads live from the sheet." : <>Data auto-saves to <code style={{background:"rgba(255,255,255,.08)",padding:"2px 6px",borderRadius:4,fontSize:12,color:"#D8B4FE"}}>secat-chatbot/data/</code> after every completed session. The dashboard reads live from this folder.</>}</span>
        </div>

        {statusMsg && <div style={{padding:"12px 16px",borderRadius:12,marginBottom:16,background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",color:"#22C55E",fontSize:14}}>{statusMsg}</div>}

        {/* Course Title */}
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#51247A,#962A8B)"}}>
              <span style={{color:"#fff",fontSize:12,fontWeight:700}}>UQ</span>
            </div>
            <div>
              <h2 style={{fontSize:30,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",margin:0}}>{course.mode === "lite" ? "Mid-Semester" : "SECaT"} Results</h2>
              <p style={{color:"#9CA3AF",margin:0}}>{course.code} · {course.name} · {course.semester}</p>
            </div>
          </div>
        </div>

        {/* ═══ ALL SESSIONS PANEL ═══ */}
        <div style={{...cardStyle,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
            <p style={{...labelStyle3,margin:0}}>ALL SAVED SESSIONS ({filtered.length})</p>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#6B7280",fontSize:12}}>Filter:</span>
              <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)}
                style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"6px 12px",color:"#D1D5DB",fontSize:13,cursor:"pointer"}}>
                <option value="all">All Courses</option>
                {uniqueCourses.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={fetchSessions} style={{padding:"6px 12px",borderRadius:8,fontSize:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.15)",color:"#9CA3AF",cursor:"pointer"}}>
                {loadingSessions?"Loading...":"Refresh"}
              </button>
              {filtered.length>0 && <>
                <button onClick={exportAllCSV} style={{padding:"6px 12px",borderRadius:8,fontSize:12,background:"rgba(22,163,74,.8)",border:"none",color:"#fff",cursor:"pointer",fontWeight:500}}>
                  Export All CSV
                </button>
                <button onClick={exportAllJSON} style={{padding:"6px 12px",borderRadius:8,fontSize:12,background:"rgba(37,99,235,.8)",border:"none",color:"#fff",cursor:"pointer",fontWeight:500}}>
                  Export All JSON
                </button>
              </>}
            </div>
          </div>

          {/* Aggregate stats */}
          {filtered.length>0 && <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
              <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>SESSIONS</p>
              <p style={{color:"#D8B4FE",fontSize:24,fontWeight:700,margin:0}}>{filtered.length}</p>
            </div>
            <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
              <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>AVG SCORE</p>
              <p style={{color:aggAvg>=7?"#22C55E":aggAvg>=4?"#F9C846":"#E85A4F",fontSize:24,fontWeight:700,margin:0}}>{aggAvg}</p>
            </div>
            <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
              <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>POSITIVE</p>
              <p style={{color:"#22C55E",fontSize:24,fontWeight:700,margin:0}}>{aggSent.positive||0}</p>
            </div>
            <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
              <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>NEGATIVE</p>
              <p style={{color:"#E85A4F",fontSize:24,fontWeight:700,margin:0}}>{aggSent.negative||0}</p>
            </div>
          </div>}

          {/* Sessions table */}
          {filtered.length===0?(
            <p style={{color:"#6B7280",fontSize:14,textAlign:"center",padding:24}}>
              {loadingSessions?"Loading sessions...":"No saved sessions yet. Complete a feedback chat in admin mode to see data here."}
            </p>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:"1px solid rgba(255,255,255,.1)"}}>
                    <th style={{padding:"8px 12px",textAlign:"left",color:"#9CA3AF",fontWeight:500}}>Course</th>
                    <th style={{padding:"8px 12px",textAlign:"left",color:"#9CA3AF",fontWeight:500}}>Date</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#9CA3AF",fontWeight:500}}>Avg</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#9CA3AF",fontWeight:500}}>Responses</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#9CA3AF",fontWeight:500}}>Sentiment</th>
                    <th style={{padding:"8px 12px",textAlign:"left",color:"#9CA3AF",fontWeight:500}}>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a,b)=>new Date(b.exportedAt||0)-new Date(a.exportedAt||0)).map((s,i)=>{
                    const sa=s.summary||{};
                    const sb=sa.sentimentBreakdown||{};
                    const dominant=(sb.positive||0)>=(sb.negative||0)?"positive":(sb.negative||0)>0?"negative":"neutral";
                    return(
                      <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                        <td style={{padding:"10px 12px",color:"#D8B4FE"}}>{s.course?.code||"—"}</td>
                        <td style={{padding:"10px 12px",color:"#D1D5DB"}}>{s.exportedAt?new Date(s.exportedAt).toLocaleDateString():"—"}</td>
                        <td style={{padding:"10px 12px",textAlign:"center",color:sa.averageScore>=7?"#22C55E":sa.averageScore>=4?"#F9C846":"#E85A4F",fontWeight:600}}>{sa.averageScore?.toFixed(1)||"—"}</td>
                        <td style={{padding:"10px 12px",textAlign:"center",color:"#D1D5DB"}}>{sa.totalResponses||0}</td>
                        <td style={{padding:"10px 12px",textAlign:"center"}}>
                          <span style={{fontSize:11,padding:"2px 8px",borderRadius:9999,
                            background:dominant==="positive"?"rgba(34,197,94,.15)":dominant==="negative"?"rgba(232,90,79,.15)":"rgba(249,200,70,.15)",
                            color:dominant==="positive"?"#22C55E":dominant==="negative"?"#E85A4F":"#F9C846"
                          }}>{dominant}</span>
                        </td>
                        <td style={{padding:"10px 12px",color:"#6B7280",fontSize:11,fontFamily:"monospace"}}>{s.sessionId?.slice(0,8)||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ CHARTS — uses current session if available, otherwise aggregate from all sessions ═══ */}
        {(responses.length>0 || filtered.length>0) && <>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <p style={{...labelStyle3,margin:0,fontSize:12,color:hasSession?"#FBBF24":"#C084FC"}}>{chartLabel}</p>
          {hasSession && <div style={{display:"flex",gap:8}}>
            <button onClick={exportCSV} style={{padding:"6px 12px",borderRadius:8,fontSize:12,background:"rgba(22,163,74,.8)",border:"none",color:"#fff",cursor:"pointer",fontWeight:500}}>Export This CSV</button>
            <button onClick={exportJSON} style={{padding:"6px 12px",borderRadius:8,fontSize:12,background:"rgba(37,99,235,.8)",border:"none",color:"#fff",cursor:"pointer",fontWeight:500}}>Export This JSON</button>
          </div>}
        </div>

        {/* Summary Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:24}}>
          <div style={cardStyle}>
            <p style={labelStyle}>AVERAGE SCORE</p>
            <p style={{fontSize:36,fontWeight:700,color:uAvg>=7?"#22C55E":uAvg>=4?"#F9C846":"#E85A4F",fontFamily:"Georgia,serif",margin:0}}>{uAvg}<span style={{fontSize:14,color:"#6B7280"}}>/10</span></p>
          </div>
          <div style={cardStyle}>
            <p style={labelStyle}>{hasSession?"QUESTIONS":"TOTAL RESPONSES"}</p>
            <p style={{fontSize:36,fontWeight:700,color:"#D8B4FE",fontFamily:"Georgia,serif",margin:0}}>{uTotalResponses}</p>
          </div>
          <div style={cardStyle}>
            <p style={labelStyle}>COMMENTS</p>
            <p style={{fontSize:36,fontWeight:700,color:"#93C5FD",fontFamily:"Georgia,serif",margin:0}}>{uTotalComments}</p>
          </div>
          <div style={cardStyle}>
            <p style={labelStyle}>SENTIMENT</p>
            <p style={{fontSize:36,fontWeight:700,color: (uSentimentData.positive||0) > (uSentimentData.negative||0) ? "#22C55E" : (uSentimentData.negative||0) > (uSentimentData.positive||0) ? "#E85A4F" : "#F9C846", fontFamily:"Georgia,serif",margin:0}}>
              {(uSentimentData.positive||0) > (uSentimentData.negative||0) ? "+" : (uSentimentData.negative||0) > (uSentimentData.positive||0) ? "−" : "~"}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        {uBar.length>0 && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginBottom:24}}>
          <div style={cardStyle}>
            <p style={labelStyle3}>{hasSession?"SCORES BY QUESTION":"AVERAGE SCORES BY QUESTION"}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={uBar}><XAxis dataKey="name" tick={{fill:"#9CA3AF",fontSize:11}}/><YAxis domain={[0,10]} tick={{fill:"#9CA3AF",fontSize:11}}/><Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#fff"}}/><Bar dataKey="score" radius={[4,4,0,0]}>{uBar.map((entry,i)=><Cell key={i} fill={entry.score>=7?"#22C55E":entry.score>=4?"#F9C846":"#E85A4F"}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>

          {uRadar.length>=3 && <div style={cardStyle}>
            <p style={labelStyle3}>RATING PROFILE</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={uRadar}><PolarGrid stroke="rgba(255,255,255,.1)"/><PolarAngleAxis dataKey="q" tick={{fill:"#9CA3AF",fontSize:10}}/><PolarRadiusAxis domain={[0,10]} tick={false}/><Radar dataKey="val" stroke="#962A8B" fill="#51247A" fillOpacity={.4}/></RadarChart>
            </ResponsiveContainer>
          </div>}

          {uSentPie.length > 0 && <div style={cardStyle}>
            <p style={labelStyle3}>COMMENT SENTIMENT</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={uSentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {uSentPie.map((entry,i)=><Cell key={i} fill={SENT_COLORS[entry.name]||"#666"}/>)}
              </Pie><Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#fff"}}/></PieChart>
            </ResponsiveContainer>
          </div>}

          {uTopicsList.length > 0 && <div style={cardStyle}>
            <p style={labelStyle3}>TOPICS DISCUSSED</p>
            <div>
              {uTopicsList.map(([topic, count], i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                  <div style={{flex:1,height:24,borderRadius:8,overflow:"hidden",background:"rgba(255,255,255,.05)"}}>
                    <div style={{height:"100%",borderRadius:8,width:`${(count/uTopicsList[0][1])*100}%`, background:"linear-gradient(90deg,#51247A,#962A8B)", transition:"width .5s ease"}}/>
                  </div>
                  <span style={{color:"#D1D5DB",fontSize:12,width:96,textAlign:"right"}}>{topic}</span>
                  <span style={{color:"#C084FC",fontSize:12,fontFamily:"monospace",width:24}}>{count}</span>
                </div>
              ))}
            </div>
          </div>}
        </div>}

        {/* Keywords */}
        {uTop.length>0 && <div style={{...cardStyle,marginBottom:24}}>
          <p style={labelStyle3}>KEY WORDS</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{uTop.map(([w,c],i)=><span key={i} style={{padding:"6px 12px",borderRadius:9999,border:"1px solid rgba(168,85,247,.3)",color:"#E9D5FF",fontSize:Math.max(12,Math.min(22,12+c*3)),background:"rgba(81,36,122,.15)"}}>{w}<sup style={{color:"rgba(192,132,252,.6)",fontSize:9,marginLeft:4}}>{c}</sup></span>)}</div>
        </div>}

        {/* MCQ Answers */}
        {uMcqs.length>0 && <div style={{...cardStyle,marginBottom:24}}>
          <p style={labelStyle3}>SELECTED ANSWERS</p>
          {uMcqs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:i<uMcqs.length-1?"1px solid rgba(255,255,255,.05)":"none"}}><span style={{color:"#D1D5DB",fontSize:14}}>{m.secat}</span><span style={{color:"#D8B4FE",fontSize:14,fontWeight:500}}>{m.value}</span></div>)}
        </div>}

        {/* Comments */}
        {uChats.length>0 && <div style={{...cardStyle,marginBottom:24}}>
          <p style={labelStyle3}>STUDENT COMMENTS</p>
          {uChats.map((c,i) => {
            const s = sentiment(c.value);
            return (
              <div key={i} style={{marginBottom:i<uChats.length-1?16:0,padding:12,borderRadius:12,background:"rgba(255,255,255,.02)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{color:"#D8B4FE",fontSize:12,fontWeight:500}}>{c.topic||c.secat}</span>
                  <span style={{
                    fontSize:10,padding:"2px 8px",borderRadius:9999,
                    background: s==="positive" ? "rgba(34,197,94,.15)" : s==="negative" ? "rgba(232,90,79,.15)" : "rgba(249,200,70,.15)",
                    color: s==="positive" ? "#22C55E" : s==="negative" ? "#E85A4F" : "#F9C846"
                  }}>{s}</span>
                </div>
                <p style={{color:"#D1D5DB",fontSize:14,lineHeight:1.6,fontStyle:"italic",margin:0}}>"{c.value}"</p>
              </div>
            );
          })}
        </div>}
        </>}

        {/* ═══ RESPONSE HEATMAP ═══ */}
        {heatmapData.length > 0 && <div style={{...cardStyle,marginBottom:24}}>
          <p style={labelStyle3}>RESPONSE HEATMAP — ALL SESSIONS</p>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr><th style={{padding:"8px",textAlign:"left",color:"#9CA3AF",fontWeight:500}}>Question</th>
                <th style={{padding:"8px",textAlign:"center",color:"#9CA3AF",fontWeight:500}}>Avg</th>
                <th style={{padding:"8px",textAlign:"left",color:"#9CA3AF",fontWeight:500}}>Distribution</th>
                <th style={{padding:"8px",textAlign:"center",color:"#9CA3AF",fontWeight:500}}>n</th></tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                    <td style={{padding:"8px",color:"#D1D5DB"}}>{row.question}</td>
                    <td style={{padding:"8px",textAlign:"center",fontWeight:700,color:row.avg>=7?"#22C55E":row.avg>=4?"#F9C846":"#E85A4F"}}>{row.avg||"—"}</td>
                    <td style={{padding:"8px"}}>
                      <div style={{display:"flex",gap:3,alignItems:"center"}}>
                        {row.scores.map((s, j) => (
                          <div key={j} style={{width:20,height:20,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,color:"#fff",
                            background:s>=8?"#22C55E":s>=6?"#4ADE80":s>=4?"#F9C846":s>=2?"#F97316":"#E85A4F"
                          }}>{s}</div>
                        ))}
                      </div>
                    </td>
                    <td style={{padding:"8px",textAlign:"center",color:"#6B7280"}}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

        {/* ═══ COMMENT HIGHLIGHTS ═══ */}
        {(topPositive.length > 0 || topNegative.length > 0) && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginBottom:24}}>
          {topPositive.length > 0 && <div style={{...cardStyle,borderColor:"rgba(34,197,94,.2)"}}>
            <p style={{...labelStyle3,color:"#22C55E"}}>TOP POSITIVE COMMENTS</p>
            {topPositive.map((c, i) => (
              <div key={i} style={{marginBottom:12,padding:12,borderRadius:12,background:"rgba(34,197,94,.05)",borderLeft:"3px solid #22C55E"}}>
                <p style={{color:"#D1D5DB",fontSize:13,fontStyle:"italic",margin:"0 0 6px",lineHeight:1.5}}>"{c.value}"</p>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#22C55E",fontSize:10,fontWeight:600}}>+{c.strength.pos} positive words</span>
                  <span style={{color:"#6B7280",fontSize:10}}>{c.course} · {c.topic||c.secat}</span>
                </div>
              </div>
            ))}
          </div>}
          {topNegative.length > 0 && <div style={{...cardStyle,borderColor:"rgba(232,90,79,.2)"}}>
            <p style={{...labelStyle3,color:"#E85A4F"}}>TOP NEGATIVE COMMENTS</p>
            {topNegative.map((c, i) => (
              <div key={i} style={{marginBottom:12,padding:12,borderRadius:12,background:"rgba(232,90,79,.05)",borderLeft:"3px solid #E85A4F"}}>
                <p style={{color:"#D1D5DB",fontSize:13,fontStyle:"italic",margin:"0 0 6px",lineHeight:1.5}}>"{c.value}"</p>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#E85A4F",fontSize:10,fontWeight:600}}>{c.strength.neg} negative signals</span>
                  <span style={{color:"#6B7280",fontSize:10}}>{c.course} · {c.topic||c.secat}</span>
                </div>
              </div>
            ))}
          </div>}
        </div>}

        {/* ═══ COURSE COMPARISON ═══ */}
        {uniqueCourses.length >= 2 && <div style={{...cardStyle,marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
            <p style={{...labelStyle3,margin:0}}>COURSE COMPARISON</p>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#D8B4FE",fontSize:12,fontWeight:600}}>{course.code}</span>
              <span style={{color:"#6B7280",fontSize:12}}>vs</span>
              <select value={compareCourse} onChange={e=>setCompareCourse(e.target.value)}
                style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"6px 12px",color:"#D1D5DB",fontSize:13,cursor:"pointer"}}>
                <option value="">Select course...</option>
                {uniqueCourses.filter(c=>c!==course.code).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {compareData ? (
            <div>
              {/* Summary row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
                  <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>AVG SCORE</p>
                  <div style={{display:"flex",justifyContent:"center",gap:16}}>
                    <span style={{color:"#D8B4FE",fontWeight:700}}>{aggAvg}</span>
                    <span style={{color:"#6B7280"}}>vs</span>
                    <span style={{color:"#93C5FD",fontWeight:700}}>{compareData.avg}</span>
                  </div>
                </div>
                <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
                  <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>SESSIONS</p>
                  <div style={{display:"flex",justifyContent:"center",gap:16}}>
                    <span style={{color:"#D8B4FE",fontWeight:700}}>{filtered.length}</span>
                    <span style={{color:"#6B7280"}}>vs</span>
                    <span style={{color:"#93C5FD",fontWeight:700}}>{compareData.sessions}</span>
                  </div>
                </div>
                <div style={{padding:12,borderRadius:12,background:"rgba(255,255,255,.02)",textAlign:"center"}}>
                  <p style={{color:"#6B7280",fontSize:10,margin:"0 0 4px"}}>POSITIVE %</p>
                  <div style={{display:"flex",justifyContent:"center",gap:16}}>
                    <span style={{color:"#D8B4FE",fontWeight:700}}>{aggSent.positive||0}</span>
                    <span style={{color:"#6B7280"}}>vs</span>
                    <span style={{color:"#93C5FD",fontWeight:700}}>{compareData.sent.positive||0}</span>
                  </div>
                </div>
              </div>
              {/* Side-by-side bar chart */}
              {compareData.bar.length > 0 && <div>
                <p style={{...labelStyle3,marginBottom:8}}>SCORE BY QUESTION</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={compareData.bar}><XAxis dataKey="name" tick={{fill:"#9CA3AF",fontSize:10}}/><YAxis domain={[0,10]} tick={{fill:"#9CA3AF",fontSize:10}}/><Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#fff"}}/><Bar dataKey={course.code} fill="#962A8B" radius={[4,4,0,0]}/><Bar dataKey={compareCourse} fill="#3B82F6" radius={[4,4,0,0]}/></BarChart>
                </ResponsiveContainer>
                <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:8}}>
                  <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#D1D5DB"}}><span style={{width:12,height:12,borderRadius:3,background:"#962A8B",display:"inline-block"}}/>{course.code}</span>
                  <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#D1D5DB"}}><span style={{width:12,height:12,borderRadius:3,background:"#3B82F6",display:"inline-block"}}/>{compareCourse}</span>
                </div>
              </div>}
            </div>
          ) : (
            <p style={{color:"#6B7280",fontSize:13,textAlign:"center",padding:16}}>Select a course above to compare with {course.code}</p>
          )}
        </div>}

        {/* Staff Summary — works for both current session and aggregate */}
        {(responses.length > 0 || filtered.length > 0) && <div style={{borderRadius:16,padding:24,marginBottom:32,border:"1px solid rgba(245,158,11,.2)",background:"rgba(245,158,11,.05)"}}>
          <p style={{color:"#FBBF24",fontSize:10,letterSpacing:"0.05em",marginBottom:12}}>STAFF SUMMARY — FOR COURSE COORDINATOR</p>
          <div style={{color:"#D1D5DB",fontSize:14,lineHeight:1.6}}>
            <p style={{margin:"0 0 8px"}}>Average rating: <strong style={{color:"#fff"}}>{uAvg}/10</strong>{hasSession ? ` across ${scales.length} scaled questions.` : ` across ${filtered.length} sessions (${aggScales.length} ratings).`}</p>
            {uBar.filter(b=>b.score<=4).length > 0 && (
              <p style={{margin:"0 0 8px"}}>Low-scoring areas ({`≤4`}): <strong style={{color:"#FCA5A5"}}>{uBar.filter(b=>b.score<=4).map(b=>b.name).join(", ")}</strong> — these warrant immediate attention.</p>
            )}
            {uBar.filter(b=>b.score>=8).length > 0 && (
              <p style={{margin:"0 0 8px"}}>High-scoring areas ({`≥8`}): <strong style={{color:"#86EFAC"}}>{uBar.filter(b=>b.score>=8).map(b=>b.name).join(", ")}</strong> — maintain these approaches.</p>
            )}
            {uTopicsList.length > 0 && (
              <p style={{margin:"0 0 8px"}}>Most discussed topics: <strong style={{color:"#fff"}}>{uTopicsList.slice(0,3).map(t=>t[0]).join(", ")}</strong>.</p>
            )}
            <p style={{color:"#6B7280",fontSize:12,marginTop:12}}>This summary is auto-generated. All identifying information has been stripped per PPL 230.1.1.</p>
          </div>
        </div>}
      </div>
    </div>
  );
}

/* ═══════════
   MAIN APP
   ═══════════ */
export default function App(){
  const[role,setRole]=useState("student"); // "student" | "admin"
  const[course,setCourse]=useState(null);
  const[msgs,setMsgs]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[fi,setFi]=useState(0);
  const[done,setDone]=useState(false);
  const[strikes,setStrikes]=useState(0);
  const[blocked,setBlocked]=useState(false);
  const[responses,setResponses]=useState([]);
  const[showDash,setShowDash]=useState(false);
  const[listening,setListening]=useState(false);
  const end=useRef(null);
  const inp=useRef(null);
  const rec=useRef(null);

  // Speech support — check once
  const speechSupported = (() => {
    if (typeof window === "undefined") return false;
    const S=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!S) return false;
    // Chrome allows speech on localhost without HTTPS
    const isSecure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    return isSecure;
  })();

  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"})},[msgs,loading]);

  useEffect(()=>{
    if (!speechSupported) return;
    const S=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new S();
    r.continuous=true;        // keep listening until user stops
    r.interimResults=true;    // show partial results as they come
    r.lang="en-AU";
    r.maxAlternatives=1;

    r.onresult=(ev)=>{
      let final="";
      for(let i=0;i<ev.results.length;i++){
        if(ev.results[i].isFinal) final+=ev.results[i][0].transcript+" ";
      }
      if(final.trim()) setInput(p=>(p+" "+final).trim());
    };
    r.onend=()=>{
      // If still supposed to be listening (user didn't click stop), restart
      // This handles Chrome's auto-stop after silence
      if(rec.current?._shouldListen){
        try{r.start()}catch(_e){setListening(false)}
      }else{setListening(false)}
    };
    r.onerror=(ev)=>{
      console.log("Speech error:", ev.error);
      if(ev.error==="not-allowed"||ev.error==="service-not-allowed"){
        // Mic permission denied — disable
        setListening(false);
      } else if(ev.error==="no-speech"){
        // Silence — just keep going, onend will restart
      } else {
        setListening(false);
      }
    };
    r.onaudiostart=()=>console.log("Mic: audio stream started");
    rec.current=r;
    rec.current._shouldListen=false;
  },[speechSupported]);

  const save=(data)=>{try{localStorage.setItem(`secat-${data.key}`,JSON.stringify(data))}catch(e){console.log("Save failed:",e)}};
  const load=(key)=>{try{const d=localStorage.getItem(`secat-${key}`);return d?JSON.parse(d):null}catch(e){console.log("Load failed:",e);return null}};

  const flow = course ? getFlow(course) : FLOW_FULL;

  const start=async(key)=>{
    const c={key,...COURSES[key]};setCourse(c);
    const cFlow = getFlow(c);
    const saved=load(key);
    // Restore in-progress session; if completed, clear it and start fresh
    if(saved?.msgs?.length>1){
      const isComplete = saved.fi >= cFlow.length;
      if(!isComplete){setMsgs(saved.msgs);setFi(saved.fi||0);setResponses(saved.responses||[]);setStrikes(saved.strikes||0);return}
      resetSession(key);
    }
    setLoading(true);
    const greeting=generateResponse(c,cFlow[0],"",[], [],cFlow[1]||null);
    const ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const m=[{role:"user",content:`Starting feedback for ${c.code}`,hidden:true},{role:"assistant",content:greeting,timestamp:ts}];
    setMsgs(m);setFi(1);setLoading(false);setDone(false);setResponses([]);setStrikes(0);setBlocked(false);
    save({key,msgs:m,fi:1,responses:[],strikes:0});
  };

  const resetSession = (key) => {
    try { localStorage.removeItem(`secat-${key}`); } catch(e) { console.log("Reset failed:",e); }
  };

  // Auto-export: append CSV rows to per-course file on server + save session JSON
  const autoExport = async (c, resps) => {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    // Build CSV rows (no header — server handles that)
    let rows = "";
    resps.forEach(r => {
      const s = r.type === "chat" && r.value ? sentiment(r.value) : "";
      rows += `"${c.code}","${(r.label||r.secat||r.topic||"").replace(/"/g,"'")}","${r.type}","${String(r.value||"").replace(/"/g,"'").replace(/\n/g," ")}","${s}","${r.timestamp||""}","${sessionId}"\n`;
    });
    // Append to per-course CSV
    try {
      await api.saveCSV(c.code, rows);
    } catch (e) { console.warn("CSV save failed:", e); }
    // Save full session JSON
    const scales = resps.filter(r => r.type === "scale");
    const chats = resps.filter(r => r.type === "chat" && r.value);
    const avg = scales.length ? (scales.reduce((s,r) => s+Number(r.value), 0)/scales.length).toFixed(1) : "N/A";
    const sentimentData = chats.reduce((acc,ch) => { const s = sentiment(ch.value); acc[s] = (acc[s]||0)+1; return acc; }, {});
    const topicsMentioned = {}; chats.forEach(ch => { extractTopics(ch.value).forEach(t => { topicsMentioned[t] = (topicsMentioned[t]||0)+1; }); });
    const data = {
      sessionId,
      course: { code: c.code, name: c.name, semester: c.semester, mode: c.mode },
      summary: { averageScore: parseFloat(avg)||0, totalResponses: resps.length, sentimentBreakdown: sentimentData, topicsDiscussed: topicsMentioned },
      responses: resps.map(r => ({...r, sentiment: r.type === "chat" && r.value ? sentiment(r.value) : null})),
      exportedAt: new Date().toISOString()
    };
    try {
      await api.saveSession(data);
    } catch (e) { console.warn("Session save failed:", e); }
  };

  const handleInteractive=async(value)=>{
    const step=flow[fi];
    const ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const r={id:step.id,type:step.type,secat:step.secat,label:step.label,value,timestamp:ts};
    const nr=[...responses,r];setResponses(nr);
    const txt=step.type==="scale"?`${step.label}: ${value}/10`:`${step.label||step.secat}: ${value}`;
    const nm=[...msgs,{role:"user",content:txt,timestamp:ts}];setMsgs(nm);
    const ni=fi+1;
    if(ni>=flow.length){
      const endReply = generateResponse(course,flow[flow.length-1],"",nm,nr,null);
      const endTs = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const upd=[...nm,{role:"assistant",content:endReply,timestamp:endTs}];
      setMsgs(upd);setDone(true);setFi(ni);
      save({key:course.key,msgs:upd,fi:ni,responses:nr,strikes});
      setTimeout(()=>autoExport(course,nr),500);
      return;
    }
    const ns=flow[ni];
    if(ns.type==="chat"){
      setLoading(true);
      // Pass null as nextStep — this is the INTRODUCTION of the chat follow-up question.
      // nextIsInteractive logic only applies in send() when the student has ANSWERED the chat step.
      const reply=await getResponse(course,ns,txt,nm,nr,null);
      const replyTs = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const upd=[...nm,{role:"assistant",content:reply,timestamp:replyTs}];
      setMsgs(upd);setFi(ni);setLoading(false);
      save({key:course.key,msgs:upd,fi:ni,responses:nr,strikes});
    }else{setFi(ni);save({key:course.key,msgs:nm,fi:ni,responses:nr,strikes})}
  };

  const send=async(text)=>{
    if(!text.trim()||loading||done||blocked)return;
    const ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if(BAD.test(text)){
      const ns=strikes+1;setStrikes(ns);
      if(ns>=3){setBlocked(true);setMsgs(p=>[...p,{role:"user",content:text,timestamp:ts},{role:"assistant",content:"Session closed — repeated inappropriate language. Your partial feedback has been saved.",timestamp:ts}]);return}
      setMsgs(p=>[...p,{role:"user",content:text,timestamp:ts},{role:"assistant",content:`Let's keep it constructive so your feedback actually gets used. Strike ${ns}/3.${ns===2?" Last chance.":""}`,timestamp:ts}]);setInput("");return;
    }
    if(PRIVACY.test(text)){setMsgs(p=>[...p,{role:"assistant",content:"⚠️ For privacy, use 'the lecturer' or 'a tutor' instead of names. Remove any student IDs or emails. Your identity is protected — let's keep it that way.",timestamp:ts}]);return}

    const step=flow[fi];
    const nm=[...msgs,{role:"user",content:text,timestamp:ts}];setMsgs(nm);setInput("");

    // Store redacted version
    if(step.type==="chat"&&step.secat){
      setResponses(p=>[...p,{id:step.id,type:"chat",secat:step.secat,topic:step.topic,value:redact(text),timestamp:ts}]);
    }

    const ni=fi+1;const isLast=ni>=flow.length;
    setLoading(true);
    // Use CURRENT step as context (what the student just answered about), NEXT step for transition awareness
    const currentStep=flow[fi];
    const nextStep=isLast?null:(flow[ni]||null);
    const reply=await getResponse(course,currentStep,text,nm,responses,nextStep);
    const replyTs = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const upd=[...nm,{role:"assistant",content:reply,timestamp:replyTs}];
    setMsgs(upd);if(isLast){setDone(true);setTimeout(()=>autoExport(course,responses),500);}setFi(ni);setLoading(false);
    save({key:course.key,msgs:upd,fi:ni,responses,strikes});
    setTimeout(()=>inp.current?.focus(),100);
  };

  const cur=flow[Math.min(fi,flow.length-1)];
  if(showDash&&role==="admin")return<Dash responses={responses} course={course||{code:"All Courses",name:"",semester:"",mode:"full"}} onBack={()=>setShowDash(false)}/>;

  // ═══ ROLE TOGGLE (inline JSX) ═══
  const roleToggleJSX = (
    <div style={{position:"fixed",top:16,right:16,zIndex:50,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:role==="student"?"#D8B4FE":"#6B7280",fontWeight:role==="student"?600:400,transition:"all .2s"}}>Student</span>
      <button onClick={()=>setRole(r=>r==="student"?"admin":"student")}
        style={{width:44,height:24,borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:role==="admin"?"rgba(81,36,122,.6)":"rgba(255,255,255,.08)",cursor:"pointer",position:"relative",transition:"all .3s",padding:0}}>
        <div style={{width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:2,left:role==="admin"?23:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
      </button>
      <span style={{fontSize:11,color:role==="admin"?"#FBBF24":"#6B7280",fontWeight:role==="admin"?600:400,transition:"all .2s"}}>Admin</span>
    </div>
  );

  // ═══ COURSE SELECTOR ═══
  if(!course)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(160deg,#0a0a1a,#1a0a2e 40%,#0f1a3e)"}}>
      <style>{GLOBAL_STYLES}{`
        .course-card{text-align:left;border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);cursor:pointer;width:100%;transition:border-color .2s}
        .course-card:hover{border-color:rgba(168,85,247,.4)}
        .course-card:hover .arrow{color:#C084FC}
        @media(min-width:768px){.course-grid{grid-template-columns:repeat(3,1fr)!important}}
      `}</style>
      {roleToggleJSX}
      <div style={{width:"100%",maxWidth:896}}>
        <div style={{textAlign:"center",marginBottom:48,animation:"slideUp .5s ease-out"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:12,marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#51247A,#962A8B)",boxShadow:"0 4px 20px rgba(81,36,122,.4)"}}>
              <span style={{color:"#fff",fontWeight:700,fontSize:18}}>UQ</span>
            </div>
            <div style={{textAlign:"left"}}>
              <p style={{color:"#fff",fontWeight:600,fontSize:20,margin:0}}>SECaT Feedback</p>
              <p style={{color:"#6B7280",fontSize:12,letterSpacing:"0.1em",margin:0}}>COURSE TEACHING SURVEY</p>
            </div>
          </div>
          <h1 style={{fontSize:"clamp(30px,5vw,60px)",fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",letterSpacing:"-1px",margin:"0 0 16px"}}>
            Tell us about your course
          </h1>
          <p style={{color:"#9CA3AF",fontSize:18,maxWidth:512,margin:"0 auto",lineHeight:1.6}}>
            A quick chat — not a form. About {Object.keys(COURSES).some(k=>COURSES[k].mode==="lite") ? "3-5" : "5"} minutes. Completely anonymous.
          </p>
        </div>

        <div className="course-grid" style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
          {Object.entries(COURSES).map(([k,c],i)=>(
            <button key={k} onClick={()=>start(k)} className="course-card"
              style={{position:"relative",overflow:"hidden",animation:`slideUp .5s ease-out ${.2+i*.1}s both`}}>
              {c.mode === "lite" && (
                <div style={{position:"absolute",top:12,right:12,fontSize:10,padding:"4px 8px",borderRadius:9999,background:"rgba(245,158,11,.2)",color:"#FCD34D",fontWeight:500}}>MID-SEM PILOT</div>
              )}
              <div style={{color:"#D8B4FE",fontSize:12,fontWeight:700,letterSpacing:"0.05em",marginBottom:8}}>{c.code}</div>
              <div style={{color:"#fff",fontSize:20,fontWeight:700,marginBottom:4,fontFamily:"Georgia,serif"}}>{c.name}</div>
              <div style={{color:"#6B7280",fontSize:14,marginBottom:16}}>{c.semester}</div>
              <div style={{fontSize:12,color:"rgba(216,180,254,.7)",background:"rgba(168,85,247,.1)",padding:"8px 12px",borderRadius:8,lineHeight:1.5}}>{c.recentChange}</div>
              <div className="arrow" style={{color:"#4B5563",textAlign:"right",fontSize:20,marginTop:12,transition:"color .2s"}}>→</div>
              {load(k)?.msgs?.length > 1 && (
                <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:10,color:"rgba(74,222,128,.7)"}}>Saved session</span>
                  <button onClick={(e)=>{e.stopPropagation();resetSession(k)}} style={{fontSize:10,color:"rgba(248,113,113,.7)",background:"none",border:"none",cursor:"pointer"}}>Clear</button>
                </div>
              )}
            </button>
          ))}
        </div>
        {role==="admin" && (
          <div style={{textAlign:"center",marginTop:32}}>
            <button onClick={()=>setShowDash(true)}
              style={{padding:"14px 32px",borderRadius:14,fontSize:15,fontWeight:600,color:"#fff",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#51247A,#962A8B)",boxShadow:"0 4px 15px rgba(81,36,122,.3)",transition:"transform .1s"}}>
              View All Results & Dashboard
            </button>
            <p style={{color:"#6B7280",fontSize:12,marginTop:8}}>View saved sessions, export data, and compare courses</p>
          </div>
        )}
        <p style={{textAlign:"center",color:"#4B5563",fontSize:12,marginTop:40}}>UQ SSP Project 5958830 · Prototype v5</p>
      </div>
    </div>
  );

  // ═══ CHAT VIEW ═══
  const prog=Math.min(fi,flow.length-2),tot=flow.length-2;
  return(
    <div className="chat-layout" style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"linear-gradient(160deg,#0a0a1a,#1a0a2e 40%,#0f1a3e)"}}>
      <style>{GLOBAL_STYLES}{`
        @media(min-width:768px){
          .chat-layout{flex-direction:row!important}
          .chat-sidebar{display:flex!important}
          .chat-main{min-height:0!important}
          .mob-header,.mob-prog{display:none!important}
          .msg-area{padding-left:32px!important;padding-right:32px!important}
          .input-wrap{padding:16px!important}
        }
        @media(min-width:1024px){.msg-area{padding-left:64px!important;padding-right:64px!important}}
        .sb-btn{width:100%;text-align:left;font-size:14px;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;transition:all .2s}
        .sb-btn:hover{background:rgba(255,255,255,.05)}
      `}</style>
      {roleToggleJSX}

      {/* Sidebar — visible on md+ */}
      <div className="chat-sidebar" style={{display:"none",flexDirection:"column",width:288,borderRight:"1px solid rgba(255,255,255,.1)",padding:24,background:"rgba(10,10,26,.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
          <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"linear-gradient(135deg,#51247A,#962A8B)"}}>
            <span style={{color:"#fff",fontSize:12,fontWeight:700}}>UQ</span>
          </div>
          <div>
            <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{course.code}</div>
            <div style={{color:"#6B7280",fontSize:12}}>{course.name}</div>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <p style={{color:"#6B7280",fontSize:10,letterSpacing:"0.05em",marginBottom:8}}>PROGRESS</p>
          <div style={{height:8,background:"rgba(255,255,255,.05)",borderRadius:9999,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",borderRadius:9999,transition:"width .7s",width:`${(prog/tot)*100}%`,background:"linear-gradient(90deg,#51247A,#E85A4F,#F9C846)"}}/>
          </div>
          <p style={{color:"#6B7280",fontSize:12,margin:0}}>{prog} of {tot} questions</p>
        </div>

        <div style={{marginBottom:24}}>
          <p style={{color:"#6B7280",fontSize:10,letterSpacing:"0.05em",marginBottom:8}}>MODE</p>
          <p style={{color:"#D8B4FE",fontSize:14,margin:0}}>{course.mode === "lite" ? "Mid-Semester Check-in" : "Full SECaT Survey"}</p>
        </div>

        <div style={{marginBottom:24}}>
          <p style={{color:"#6B7280",fontSize:10,letterSpacing:"0.05em",marginBottom:8}}>SEMESTER</p>
          <p style={{color:"#D1D5DB",fontSize:14,margin:0}}>{course.semester}</p>
        </div>

        {strikes > 0 && (
          <div style={{marginBottom:24,padding:12,borderRadius:12,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)"}}>
            <p style={{color:"#F87171",fontSize:12,fontWeight:500,margin:0}}>Strikes: {strikes}/3</p>
          </div>
        )}

        <div style={{marginTop:"auto"}}>
          <button onClick={()=>{setCourse(null);setMsgs([]);setFi(0);setDone(false);setResponses([]);setStrikes(0);setBlocked(false)}}
            className="sb-btn" style={{color:"#6B7280",background:"none",marginBottom:8}}>
            ← Switch course
          </button>
          {done && role==="admin" && (
            <button onClick={()=>setShowDash(true)}
              className="sb-btn" style={{color:"#D8B4FE",background:"none"}}>
              View results →
            </button>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main" style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        {/* Mobile Header */}
        <div className="mob-header" style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(255,255,255,.1)",background:"rgba(15,15,30,.95)"}}>
          <button onClick={()=>{setCourse(null);setMsgs([]);setFi(0);setDone(false);setResponses([]);setStrikes(0);setBlocked(false)}}
            style={{color:"#6B7280",fontSize:18,background:"none",border:"none",cursor:"pointer"}}>←</button>
          <div style={{width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"linear-gradient(135deg,#51247A,#962A8B)"}}>
            <span style={{color:"#fff",fontSize:9,fontWeight:700}}>UQ</span>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:600,fontSize:14}}>{course.code} · {course.name}</div>
            <div style={{color:"#6B7280",fontSize:11}}>{course.semester} · {prog}/{tot}</div>
          </div>
          {strikes>0&&<div style={{fontSize:12,color:"#F87171",fontWeight:500}}>{strikes}/3</div>}
        </div>

        {/* Mobile Progress */}
        <div className="mob-prog" style={{padding:"6px 16px",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div style={{height:6,background:"rgba(255,255,255,.05)",borderRadius:9999,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:9999,transition:"width .7s",width:`${(prog/tot)*100}%`,background:"linear-gradient(90deg,#51247A,#E85A4F,#F9C846)"}}/>
          </div>
        </div>

        {/* Messages */}
        <div className="msg-area" style={{flex:1,overflowY:"auto",padding:"24px 16px"}}>
          <div style={{maxWidth:672,margin:"0 auto"}}>
            {msgs.filter(m=>!m.hidden).map((m,i)=><Bubble key={i} role={m.role} text={m.content} timestamp={m.timestamp}/>)}
            {loading&&<Bubble role="assistant" isTyping/>}
            {!loading&&!done&&!blocked&&cur.type==="scale"&&<Scale label={cur.label} lo={cur.lo} hi={cur.hi} onSubmit={handleInteractive}/>}
            {!loading&&!done&&!blocked&&cur.type==="mcq"&&<MCQ label={cur.label} options={cur.options} onSubmit={handleInteractive}/>}
            {!loading&&!done&&!blocked&&cur.type==="emoji"&&<Emoji label={cur.label} emojis={cur.emojis} onSubmit={handleInteractive}/>}
            <div ref={end}/>
          </div>
        </div>

        {/* Input */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.1)",background:"rgba(15,15,30,.8)",backdropFilter:"blur(20px)"}}>
          <div style={{maxWidth:672,margin:"0 auto"}}>
            {!done&&!blocked&&cur.type==="chat"?(
              <div className="input-wrap" style={{padding:12}}>
                <div style={{display:"flex",gap:8}}>
                  {speechSupported && (
                    <button onClick={()=>{if(listening){rec.current._shouldListen=false;rec.current.stop();setListening(false)}else{rec.current._shouldListen=true;try{rec.current.start()}catch(_e){/* already started */}setListening(true)}}}
                      style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:listening?"1px solid #EF4444":"1px solid rgba(255,255,255,.1)",background:listening?"rgba(239,68,68,.2)":"transparent",cursor:"pointer",transition:"all .2s"}}>
                      <span style={{fontSize:18,color:listening?"#F87171":"#9CA3AF",...(listening?{animation:"pulse 1s infinite"}:{})}}>🎤</span>
                    </button>
                  )}
                  <input ref={inp} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)}
                    placeholder="Type your thoughts..." disabled={loading} autoFocus
                    style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px 16px",fontSize:15,color:"#F3F4F6",outline:"none",minWidth:0,transition:"border-color .2s"}}/>
                  <button onClick={()=>send(input)} disabled={!input.trim()||loading}
                    style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,flexShrink:0,border:"none",cursor:"pointer",opacity:!input.trim()||loading?.3:1,background:"linear-gradient(135deg,#51247A,#962A8B)",transition:"transform .1s"}}>↑</button>
                </div>
              </div>
            ):done?(
              <div style={{padding:20,textAlign:"center"}}>
                <p style={{color:"#86EFAC",fontWeight:600,fontSize:18,margin:"0 0 12px"}}>
                  {role==="student"?"Thank you for your feedback! Your responses have been saved.":"Feedback complete — thank you!"}
                </p>
                {role==="student"?(
                  <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>{setCourse(null);setMsgs([]);setFi(0);setDone(false);setResponses([]);setStrikes(0);setBlocked(false)}}
                      style={{padding:"10px 24px",borderRadius:12,fontSize:14,fontWeight:500,color:"#D1D5DB",border:"1px solid rgba(255,255,255,.1)",background:"transparent",cursor:"pointer",transition:"border-color .2s"}}>
                      Review Another Course
                    </button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>setShowDash(true)} style={{padding:"10px 24px",borderRadius:12,fontSize:14,fontWeight:600,color:"#fff",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#51247A,#962A8B)",transition:"transform .1s"}}>View Results & Export</button>
                    <button onClick={()=>{setCourse(null);setMsgs([]);setFi(0);setDone(false);setResponses([]);setStrikes(0);setBlocked(false)}}
                      style={{padding:"10px 24px",borderRadius:12,fontSize:14,fontWeight:500,color:"#D1D5DB",border:"1px solid rgba(255,255,255,.1)",background:"transparent",cursor:"pointer",transition:"border-color .2s"}}>
                      Review Another Course
                    </button>
                  </div>
                )}
              </div>
            ):blocked?(
              <div style={{padding:16,textAlign:"center",background:"rgba(239,68,68,.05)",borderTop:"1px solid rgba(239,68,68,.3)"}}><p style={{color:"#FCA5A5",fontSize:14,margin:0}}>Session closed. Partial feedback saved.</p></div>
            ):null}
          </div>
        </div>
      </div>
    </div>
  );
}
