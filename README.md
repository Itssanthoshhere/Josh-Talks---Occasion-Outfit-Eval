## 👔 Occasion Outfit Eval — AI Model Evaluation Challenge

> **Evaluating AI-Generated E-Commerce Listings for the Indian Festive Market**  
> *Josh Talks — AI Product Operations Intern Task Submission*

<a href="https://josh-talks-occasion-outfit-eval.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_Web_App-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
</a>

---

### 📌 Project Overview

**Occasion Outfit Eval** is a web-based evaluation platform designed to systematically benchmark and evaluate Generative AI Image Models on generating Indian occasion-based fashion outfits. 

When generating fashion listings for the Indian market, generic AI models often default to Western clothing styles or culturally inaccurate attire. This evaluation tool presents raters with **blinded, randomized side-by-side outfit options** across 5 curated Indian occasion prompts to judge cultural accuracy, occasion-appropriateness, styling coherence, and wearability.

---

### 🌟 Key Features

- **Blinded Side-by-Side Evaluation**: Model identities are masked as *Option A*, *Option B*, *Option C*, with randomized order per prompt to eliminate rater bias.
- **Multi-Criterion Scoring**: Raters score each outfit option (1–5 scale) across 4 key criteria:
  1. **Occasion-appropriateness** *(Does this match Indian occasion norms?)*
  2. **Cultural/context fit** *(Is it recognizably Indian, not Western?)*
  3. **Styling coherence** *(Do colors, patterns, and accessories match?)*
  4. **Wearability** *(Would a real person plausibly wear this look?)*
- **Real-Time Leaderboard**: Aggregates win rates, per-criterion averages, and overall performance scores.
- **Passcode-Protected Admin Controls**: Admin setup and data reset actions are protected by a custom UI modal (`ADMIN_PASSCODE`).
- **Google Sheets Integration**: Automatically records raters, consent timestamps, and evaluation scores to a Google Sheet database via a Google Apps Script Web App.
- **Vercel & Security Ready**: Built with a Vercel Serverless Function (`/api/config.js`) to inject environment variables at runtime without exposing secrets in public GitHub repositories.

---

### 🤖 Models & Prompts Evaluated

#### **Models Compared (3)**
1. **OpenAI — GPT Image 1**
2. **Google — Gemini 2.5 Flash Image**
3. **Google — Gemini 3.1 Flash-Lite Image**

#### **Occasion Prompts (5)**
- **p1 (Medium)**: *Wedding Guest — Woman* (Formal Indian wedding guest outfit)
- **p2 (Medium)**: *Wedding Guest — Man* (Formal Indian wedding guest outfit)
- **p3 (Easy)**: *Diwali at Home* (Festive yet comfortable home celebration outfit)
- **p4 (Medium)**: *Corporate Office Wear — Woman* (Workplace-appropriate outfit in an Indian city)
- **p5 (Hard)**: *South Indian Wedding Guest* (Traditional South Indian wedding guest outfit)

---

### 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend / Database**: Google Apps Script + Google Sheets
- **Deployment**: Vercel + Serverless Node Function (`/api/config.js`)
- **Image CDN**: Google Drive Direct CDN (`lh3.googleusercontent.com`)

---

### 🚀 Quick Start & Local Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Itssanthoshhere/Josh-Talks---Occasion-Outfit-Eval.git
cd Josh-Talks---Occasion-Outfit-Eval
```

#### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your environment variables in `.env`:
```env
SHEET_ID="your_google_sheet_id_here"
APPS_SCRIPT_URL="your_apps_script_web_app_url_here"
ADMIN_PASSCODE="sandy"
PORT=3000
```

Also create a local `env.js` file (ignored in `.gitignore`):
```javascript
window.ENV = {
    SHEET_ID: "your_google_sheet_id_here",
    APPS_SCRIPT_URL: "your_apps_script_web_app_url_here",
    ADMIN_PASSCODE: "sandy"
};
```

#### 3. Run Locally
Open `index.html` directly in your browser or run a local static server:
```bash
npx serve .
# Or open via VSCode Live Server at http://127.0.0.1:3000
```

---

### ☁️ Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository into **[Vercel](https://vercel.com)**.
3. In **Project Settings → Environment Variables**, add:

| Variable Name | Value |
|---|---|
| `APPS_SCRIPT_URL` | Your Google Apps Script Web App URL |
| `SHEET_ID` | Your Google Sheet ID |
| `ADMIN_PASSCODE` | `sandy` *(or your custom admin passcode)* |

4. Deploy! Vercel will automatically route `/api/config.js` to inject your environment variables securely.

---

### 📊 Google Apps Script Setup (`Code.gs`)

<details>
<summary>📄 Click to expand the full <code>Code.gs</code> setup instructions</summary>

1. Create a Google Sheet with two tabs: `Config` and `Ratings`.
2. Go to **Extensions → Apps Script**, delete any code, and paste:

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const CONFIG_SHEET = 'Config';
const RATINGS_SHEET = 'Ratings';

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const configSheet = ss.getSheetByName(CONFIG_SHEET);
  const ratingsSheet = ss.getSheetByName(RATINGS_SHEET);
  const configVal = configSheet.getRange(1, 1).getValue();
  const ratingsData = ratingsSheet.getDataRange().getValues();
  const ratings = ratingsData
    .filter(function (row, i) { return i > 0 && row[0]; })
    .map(function (row) { return JSON.parse(row[0]); });
  return ContentService.createTextOutput(JSON.stringify({
    config: configVal ? JSON.parse(configVal) : null,
    ratings: ratings
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const body = JSON.parse(e.postData.contents);

  if (body.action === 'saveConfig') {
    ss.getSheetByName(CONFIG_SHEET).getRange(1, 1).setValue(JSON.stringify(body.config));
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }
  if (body.action === 'addRating') {
    ss.getSheetByName(RATINGS_SHEET).appendRow([JSON.stringify(body.rating)]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }
  if (body.action === 'resetRatings') {
    const sheet = ss.getSheetByName(RATINGS_SHEET);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unknown action' })).setMimeType(ContentService.MimeType.JSON);
}
```

3. Deploy as **Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**

</details>

---

### 🔒 Security & Privacy

- All sensitive keys (`SHEET_ID`, `APPS_SCRIPT_URL`, `ADMIN_PASSCODE`) are excluded from Git via `.gitignore`.
- Admin setup and ratings reset are protected by a custom passcode modal (`ADMIN_PASSCODE`).
- Consent verification is enforced for participants before ratings can be submitted.

---

#### 👤 Author

**Santhosh VS**  
*Josh Talks AI Product Operations Intern Candidate*
