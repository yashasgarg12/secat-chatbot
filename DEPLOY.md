# SECaT Chatbot — Deployment Guide

**Goal:** Host the chatbot on Vercel (free) with Google Sheets as the database backend.

---

## Step 1: Set Up Google Sheets Backend (5 minutes)

### 1a. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and sign in with **your-google-account@gmail.com**
2. Click **Blank spreadsheet**
3. Name it **"SECaT Chatbot Data"**
4. Note the spreadsheet URL — you'll need it

### 1b. Add the Apps Script

1. In your new spreadsheet, go to **Extensions → Apps Script**
2. Delete everything in the editor (the default `myFunction` code)
3. Open the file `google-apps-script.js` from the project folder
4. Copy the **entire contents** and paste it into the Apps Script editor
5. Click **Save** (Ctrl/Cmd+S)
6. Rename the project to **"SECaT Backend"** (click "Untitled project" at the top)

### 1c. Run Setup

1. In the Apps Script editor, select the function **`setup`** from the dropdown (top toolbar)
2. Click **Run**
3. Google will ask you to authorize — click **Review Permissions → your account → Allow**
4. Check your spreadsheet — you should now see two sheets: **Sessions** and **CSV_Data** with headers

### 1d. Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Set:
   - **Description:** "SECaT API"
   - **Execute as:** "Me"
   - **Who has access:** "Anyone"
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like: `https://script.google.com/macros/s/AKfyc.../exec`

> **IMPORTANT:** Save this URL. You'll need it for Vercel.

### 1e. Test It

Open this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/YOUR_ID/exec?action=sessions
```
You should see `[]` (empty array). This means the API is working.

---

## Step 2: Get a Gemini API Key (2 minutes)

This gives the chatbot its AI brain in the cloud (replaces local Ollama).

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Select any Google Cloud project (or let it create one)
5. **Copy the API key** — it looks like `AIzaSy...`

> **Free tier:** Gemini 2.0 Flash allows 15 requests/minute and 1,500 requests/day at no cost. More than enough for a demo.

> **IMPORTANT:** Save this key. You'll need it for Vercel.

---

## Step 3: Deploy to Vercel (5 minutes)

### Option A: Deploy via GitHub (Recommended)

1. Push the `secat-chatbot` folder to a GitHub repository:
   ```bash
   cd secat-chatbot
   git init
   git add -A
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/secat-chatbot.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click **Add New → Project**

4. Import your `secat-chatbot` repository

5. In the **Environment Variables** section, add **both**:
   - **Name:** `VITE_SHEETS_API_URL` → **Value:** Your Apps Script Web App URL from Step 1d
   - **Name:** `GEMINI_API_KEY` → **Value:** Your Gemini API key from Step 2

6. Click **Deploy**

7. Wait ~60 seconds. Vercel gives you a URL like `https://secat-chatbot.vercel.app`

### Option B: Deploy via CLI (No GitHub needed)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Build the project with the Google Sheets URL:
   ```bash
   cd secat-chatbot
   VITE_SHEETS_API_URL="https://script.google.com/macros/s/YOUR_ID/exec" npm run build
   ```

3. Deploy:
   ```bash
   vercel deploy --prod dist/
   ```

4. Follow the prompts (accept defaults)

5. Set the Gemini API key on Vercel:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Paste your key when prompted, select all environments, then redeploy:
   ```bash
   vercel deploy --prod dist/
   ```

---

## Step 4: Verify Everything Works

1. Open your Vercel URL in a browser
2. Complete a test feedback session
3. After completion, check your Google Sheet — you should see data in both the **Sessions** and **CSV_Data** tabs
4. Log in as admin (lock icon → password: `secatadmin`)
5. Click **View All Results & Dashboard** — verify charts load from Google Sheets data
6. Test **Export All CSV** and **Export All JSON** buttons

---

## Sharing with Students

Share the Vercel URL directly. Students don't need to install anything — they just open the link and start the conversation.

Example: `https://secat-chatbot.vercel.app`

For a custom domain (optional): Vercel supports free custom domains in Settings → Domains.

---

## Updating After Deployment

### Code changes:
- If using GitHub: push changes → Vercel auto-deploys
- If using CLI: run `npm run build` then `vercel deploy --prod dist/`

### Apps Script changes:
- Edit the script in Apps Script editor
- Click **Deploy → Manage deployments → Edit (pencil icon) → Version: New version → Deploy**

### Changing the admin password:
- Edit `src/App.jsx`, search for `"secatadmin"` in the password check near the role toggle
- Rebuild and redeploy

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to fetch sessions" | Check VITE_SHEETS_API_URL is set correctly. The URL must end with `/exec` |
| Data not appearing in sheet | Check Apps Script deployment is set to "Anyone" access |
| CORS errors in console | Use `Content-Type: text/plain` (already handled in code) |
| Apps Script authorization error | Re-run the `setup` function and re-authorize |
| Vercel build fails | Run `npm run build` locally first to check for errors |
| Dashboard shows no data | Click Refresh. Check Google Sheet has data rows |
| Chatbot replies are empty | Check `GEMINI_API_KEY` is set in Vercel env vars |
| "LLM request timed out" | Gemini free tier may be rate-limited — wait 60s and retry |
| 502 from `/api/chat` | Check Vercel function logs. Likely invalid Gemini API key |

---

## Architecture Summary

```
Student's Browser
    │
    ├── GET sessions ──→ Google Apps Script ──→ Google Sheet (reads)
    ├── POST session ──→ Google Apps Script ──→ Google Sheet (appends)
    └── POST /api/chat ──→ Vercel Function ──→ Google Gemini API (AI replies)
    
Admin's Browser
    │
    ├── Same GET/POST as above
    └── Dashboard renders from fetched data

Hosted on: Vercel (static + serverless functions, free)
Database: Google Sheets (via Apps Script API, free)
AI: Google Gemini 2.0 Flash (via Vercel serverless proxy, free tier)
```

---

*Last updated: June 2026*
