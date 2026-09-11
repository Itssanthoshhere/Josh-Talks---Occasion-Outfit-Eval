/* =========================================================================
   CONFIG — paste your deployed Google Apps Script Web App URL below.
   See the setup notes at the bottom of index.html (search "SETUP").
   ========================================================================= */
const ENV = (typeof window !== "undefined" && window.ENV) || {};
const API_URL = ENV.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbx2REIzbMFxyUo2mKWT2aR05CcYiAdnvkAVj7LsMzUpSovXtaB2ZaLRBUCcTBs47zZKdg/exec";
const SHEET_ID = ENV.SHEET_ID || "1c3uAn4RjBmZqIPK-iGj5jMRO07O86mud42-DshQ6tos";

const CRITERIA = [
    { key: "correctness", label: "Occasion-appropriateness", hint: "Does this match what someone would actually wear for this occasion in India?" },
    { key: "legibility", label: "Cultural/context fit", hint: "Is it recognizably Indian dressing, not a generic Western default?" },
    { key: "accuracy", label: "Styling coherence", hint: "Do the pieces (color, pattern, accessories) work together as one outfit?" },
    { key: "usability", label: "Wearability", hint: "Would a real person plausibly wear this look?" },
];

const DEFAULT_MODELS = [
    { id: "m1", company: "OpenAI", name: "GPT Image 1" },
    { id: "m2", company: "Google", name: "Gemini 3.6 Flash Image" },
    { id: "m3", company: "Google", name: "Gemini 3.5 Flash-Lite Image" },
];

const DEFAULT_PROMPTS = [
    {
        id: "p1", title: "Wedding Guest — Woman", grade: "Medium",
        text: "A full-body photorealistic fashion photo of a woman wearing an outfit appropriate for attending an Indian wedding as a guest, styled for a formal wedding function, clean studio background, realistic photography style."
    },
    {
        id: "p2", title: "Wedding Guest — Man", grade: "Medium",
        text: "A full-body photorealistic fashion photo of a man wearing an outfit appropriate for attending an Indian wedding as a guest, styled for a formal wedding function, clean studio background, realistic photography style."
    },
    {
        id: "p3", title: "Diwali at Home", grade: "Easy",
        text: "A full-body photorealistic fashion photo of a person wearing an outfit appropriate for celebrating Diwali at home with family, festive but comfortable, clean studio background, realistic photography style."
    },
    {
        id: "p4", title: "Corporate Office Wear — Woman", grade: "Medium",
        text: "A full-body photorealistic fashion photo of a woman wearing an outfit appropriate for a corporate office job in an Indian city, professional and workplace-appropriate, clean studio background, realistic photography style."
    },
    {
        id: "p5", title: "South Indian Wedding Guest", grade: "Hard",
        text: "A full-body photorealistic fashion photo of a woman wearing an outfit appropriate for attending a traditional South Indian wedding ceremony as a guest, clean studio background, realistic photography style."
    },
];

const CONSENT_TEXT = "I confirm that I am 18 years or older. I voluntarily participated in this evaluation. I consent to my name, email, and responses/ratings being included in this assignment submission for hiring evaluation purposes.";
const LETTERS = ["A", "B", "C", "D", "E"];

const DEFAULT_IMAGES = {
    "p1__m1": "https://lh3.googleusercontent.com/d/1LcplEGjWwZ1EToneKFROfAzHMuExsHNT",
    "p1__m2": "https://lh3.googleusercontent.com/d/1UNH6U0oX9dGpfPfPyp1gCs9ZOhIPGAzC",
    "p1__m3": "https://lh3.googleusercontent.com/d/1rQE-hJKCSy9jcMw2P2FDLx9kNqZuQPtn",
    "p2__m1": "https://lh3.googleusercontent.com/d/1QzzLAaHZPs2cTOg1JHr3rtlJ38NljzU7",
    "p2__m2": "https://lh3.googleusercontent.com/d/16rZTy-7lmtEF9uUnykBhjIpLpNI_s-1J",
    "p2__m3": "https://lh3.googleusercontent.com/d/1DOsI3gScQZrKr49zZtYrhH-XOxVl3TdQ",
    "p3__m1": "https://lh3.googleusercontent.com/d/18wI9_zC_TGGpmrcL2omJrB_lskoOQzKk",
    "p3__m2": "https://lh3.googleusercontent.com/d/1cnm2lDK7fptfa6ZdE9uyqqiivdvCi4eG",
    "p3__m3": "https://lh3.googleusercontent.com/d/1Ghh9Ru56-cKNV2nl_KeLzgFoW8pOjHSP",
    "p4__m1": "https://lh3.googleusercontent.com/d/1Ey0m8w3s-wGO9Zr3-S5rOVlK-_BrL7me",
    "p4__m2": "https://lh3.googleusercontent.com/d/14uXwxVhLOc_cr2YaGlFT6nfnorc_agwT",
    "p4__m3": "https://lh3.googleusercontent.com/d/1D9Q6SzPYs1YLPxpM9Cxv6yHHaLuBzjUj",
    "p5__m1": "https://lh3.googleusercontent.com/d/1rgyc5SdcvrKzmmR84vJx0xbwUIyVvZiZ",
    "p5__m2": "https://lh3.googleusercontent.com/d/1XXrqPnG89W66YfXJxiQQ48y08tIHdjVc",
    "p5__m3": "https://lh3.googleusercontent.com/d/1w1817xKizhPRbCWf0kHtc2UceAKhIreD"
};

function defaultConfig() {
    const images = Object.assign({}, DEFAULT_IMAGES);
    return { models: DEFAULT_MODELS, prompts: DEFAULT_PROMPTS, images };
}
function imgKey(promptId, modelId) { return promptId + "__" + modelId; }
function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function escapeHtml(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let STATE = {
    ready: false,
    configured: API_URL && API_URL.indexOf("http") === 0,
    error: "",
    config: defaultConfig(),
    ratings: [],
    view: "home",
    consent: { name: "", email: "", age: "", agree: false },
    order: [],
    promptIdx: 0,
    draft: {},
    winner: null,
    sessionRatings: [],
    showPasscodeModal: false,
    passcodeError: "",
    passcodeCallback: null,
};

async function apiGet() {
    const res = await fetch(API_URL, { method: "GET", redirect: "follow" });
    return res.json();
}
async function apiPost(body) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(body),
            redirect: "follow"
        });
        return await res.json();
    } catch (e) {
        // Fallback for strict browser CORS on Google Apps Script 302 redirects
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(body),
        });
        return { ok: true };
    }
}

async function loadData() {
    if (!STATE.configured) {
        STATE.error = "Backend not configured yet — using local defaults only. Ratings won't be saved until you paste your Apps Script URL into API_URL at the top of the script.";
        STATE.ready = true;
        render();
        return;
    }
    try {
        const data = await apiGet();
        STATE.config = data.config || defaultConfig();
        // Ensure default images are present if remote config is missing any keys
        STATE.config.images = Object.assign({}, DEFAULT_IMAGES, STATE.config.images || {});
        STATE.ratings = data.ratings || [];
        if (!data.config || Object.keys(data.config.images || {}).length < 15) {
            await apiPost({ action: "saveConfig", config: STATE.config });
        }
    } catch (e) {
        STATE.error = "Could not reach the backend. Check your API_URL and that the Apps Script is deployed with 'Anyone' access.";
    } finally {
        STATE.ready = true;
        render();
    }
}

function headerHtml(showBack) {
    return `
    <div class="header">
      <div>
        <div class="h1">Occasion Outfit Eval</div>
      </div>
      ${showBack ? `<button class="btn btn-ghost-light" onclick="goHome()">← Home</button>` : ""}
    </div>`;
}

function bannerHtml() {
    return STATE.error ? `<div class="banner">${escapeHtml(STATE.error)}</div>` : "";
}

function loadingHtml() {
    return `
    <div class="loading-box">
      <div class="spinner"></div>
      <div style="font-family:'Bitter',serif; font-size:18px; font-weight:700; color:var(--chalk); margin-top:16px;">Loading evaluation data…</div>
      <div class="muted" style="color:rgba(243,240,230,0.6); font-size:13px; margin-top:6px;">Connecting to backend</div>
    </div>`;
}

function render() {
    const app = document.getElementById("app");
    if (!STATE.ready) {
        app.innerHTML = loadingHtml();
        return;
    }

    let body = "";
    if (STATE.view === "home") body = homeHtml();
    else if (STATE.view === "admin") body = adminHtml();
    else if (STATE.view === "consent") body = consentHtml();
    else if (STATE.view === "rate") body = rateHtml();
    else if (STATE.view === "thanks") body = thanksHtml();
    else if (STATE.view === "dashboard") body = dashboardHtml();

    app.innerHTML = headerHtml(STATE.view !== "home") + bannerHtml() + body + passcodeModalHtml();

    if (STATE.view === "rate") checkRateReady();
    if (STATE.view === "consent") updateConsentButton();
    if (STATE.showPasscodeModal) {
        const input = document.getElementById("passcodeInput");
        if (input) input.focus();
    }
}

/* ---------- HOME ---------- */
function homeHtml() {
    const n = STATE.ratings.length;
    return `
    <div class="card">
      <h2>Comparing AI models on Indian occasion outfits</h2>
      <p>Three image models generate the same 5 occasion-based outfits — wedding, festival, office — where the
      risk is defaulting to generic Western looks instead of Indian context. Raters judge occasion-appropriateness,
      cultural fit, styling coherence, and wearability — blind, without knowing which model made which image.</p>
      <div class="row">
        <button class="btn btn-primary" onclick="startRating()">Rate the outfits</button>
        <button class="btn btn-dark" onclick="goDashboard()">View leaderboard (${n} rater${n === 1 ? "" : "s"})</button>
        <button class="btn btn-ghost-dark" onclick="goAdmin()">Admin setup</button>
      </div>
    </div>
    <p class="footer-note">Ratings and consent details are stored for this evaluation and are visible to anyone with the admin/backend link.</p>`;
}
const ADMIN_PASSCODE = (ENV && ENV.ADMIN_PASSCODE) || "sandy";

function openPasscodeModal(callback) {
    STATE.showPasscodeModal = true;
    STATE.passcodeError = "";
    STATE.passcodeCallback = callback;
    render();
}

function closePasscodeModal() {
    STATE.showPasscodeModal = false;
    STATE.passcodeError = "";
    STATE.passcodeCallback = null;
    render();
}

function submitPasscodeModal(e) {
    if (e) e.preventDefault();
    const input = document.getElementById("passcodeInput");
    const val = input ? input.value.trim() : "";
    if (val === ADMIN_PASSCODE) {
        const cb = STATE.passcodeCallback;
        STATE.showPasscodeModal = false;
        STATE.passcodeError = "";
        STATE.passcodeCallback = null;
        render();
        if (cb) cb();
    } else {
        STATE.passcodeError = "Incorrect admin passcode. Access denied.";
        render();
    }
}

function passcodeModalHtml() {
    if (!STATE.showPasscodeModal) return "";
    return `
    <div class="modal-overlay" onclick="if(event.target===this) closePasscodeModal()">
      <div class="modal-card">
        <h3 style="font-family:'Bitter',serif; font-weight:700; font-size:18px; margin:0 0 8px; color:var(--ink);">Admin Authorization</h3>
        <p style="font-size:13.5px; margin-bottom:14px; color:rgba(36,28,20,0.8); line-height:1.4;">Enter the Admin Passcode to proceed:</p>
        <form onsubmit="submitPasscodeModal(event)">
          <input type="password" id="passcodeInput" class="input" placeholder="Admin passcode" autofocus style="margin-bottom:10px;" />
          ${STATE.passcodeError ? `<div style="color:var(--rust); font-size:13px; font-weight:600; margin-bottom:10px;">${escapeHtml(STATE.passcodeError)}</div>` : ""}
          <div class="row" style="justify-content:flex-end; gap:8px; margin-top:8px;">
            <button type="button" class="btn btn-ghost-dark" onclick="closePasscodeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Authorize</button>
          </div>
        </form>
      </div>
    </div>`;
}

function goHome() { STATE.view = "home"; render(); }
function goAdmin() {
    openPasscodeModal(() => {
        STATE.view = "admin";
        render();
    });
}
function goDashboard() { STATE.view = "dashboard"; render(); }

/* ---------- ADMIN ---------- */
function adminHtml() {
    const c = STATE.config;
    let html = `<div class="card"><h2>Models</h2><div style="display:grid;gap:10px;">`;
    c.models.forEach((m, i) => {
        html += `<div class="grid2">
      <input class="input" id="model_company_${i}" value="${escapeHtml(m.company)}" placeholder="Company" />
      <input class="input" id="model_name_${i}" value="${escapeHtml(m.name)}" placeholder="Exact model name" />
    </div>`;
    });
    html += `</div></div>`;

    c.prompts.forEach((p, pi) => {
        html += `<div class="card">
      <div class="row" style="justify-content:space-between; margin-bottom:10px;">
        <input class="input" id="prompt_title_${pi}" style="font-weight:700; max-width:320px;" value="${escapeHtml(p.title)}" />
        <input class="input" id="prompt_grade_${pi}" style="max-width:160px;" value="${escapeHtml(p.grade)}" />
      </div>
      <textarea class="input" id="prompt_text_${pi}" style="margin-bottom:12px;">${escapeHtml(p.text)}</textarea>
      <div class="grid-models" style="display:grid; grid-template-columns:repeat(${c.models.length},1fr); gap:10px;">`;
        c.models.forEach((m) => {
            const key = imgKey(p.id, m.id);
            const url = c.images[key] || "";
            const boxId = "preview_" + p.id + "_" + m.id;
            html += `<div>
        <div class="muted" style="margin-bottom:4px;">${escapeHtml(m.company)} — ${escapeHtml(m.name)}</div>
        <input class="input" id="image_${p.id}_${m.id}" placeholder="Paste hosted image URL" value="${escapeHtml(url)}"
          onchange="updateImagePreview('${p.id}','${m.id}')" />
        <div id="${boxId}">${url ? `<img src="${escapeHtml(url)}" style="width:100%; aspect-ratio:3/4; object-fit:cover; object-position:top center; margin-top:6px; border-radius:3px; border:1px solid rgba(36,28,20,0.13);" />` : ""}</div>
      </div>`;
        });
        html += `</div></div>`;
    });

    html += `<div class="row" style="justify-content:space-between; margin-top:20px;">
    <div class="row">
      <button class="btn btn-primary" onclick="saveAdminConfig()">Save setup</button>
      <span id="savedFlash" class="muted" style="display:none; color:var(--mustard);">Saved.</span>
      <button class="btn btn-ghost-light" onclick="goHome()">Done</button>
    </div>
    <button class="btn btn-danger-light" onclick="doResetRatings()">Clear all ratings</button>
  </div>`;
    return html;
}
function updateImagePreview(promptId, modelId) {
    const input = document.getElementById("image_" + promptId + "_" + modelId);
    const box = document.getElementById("preview_" + promptId + "_" + modelId);
    const url = input.value.trim();
    box.innerHTML = url ? `<img src="${escapeHtml(url)}" style="width:100%; aspect-ratio:3/4; object-fit:cover; object-position:top center; margin-top:6px; border-radius:3px; border:1px solid rgba(36,28,20,0.13);" />` : "";
}
async function saveAdminConfig() {
    const c = STATE.config;
    const newModels = c.models.map((m, i) => ({
        id: m.id,
        company: document.getElementById("model_company_" + i).value,
        name: document.getElementById("model_name_" + i).value,
    }));
    const newPrompts = c.prompts.map((p, pi) => ({
        id: p.id,
        title: document.getElementById("prompt_title_" + pi).value,
        grade: document.getElementById("prompt_grade_" + pi).value,
        text: document.getElementById("prompt_text_" + pi).value,
    }));
    const newImages = {};
    c.prompts.forEach((p) => {
        c.models.forEach((m) => {
            const key = imgKey(p.id, m.id);
            const el = document.getElementById("image_" + p.id + "_" + m.id);
            newImages[key] = el ? el.value : (c.images[key] || "");
        });
    });
    const newConfig = { models: newModels, prompts: newPrompts, images: newImages };
    STATE.config = newConfig;
    if (STATE.configured) {
        try {
            await apiPost({ action: "saveConfig", config: newConfig });
            STATE.error = "";
        }
        catch (e) { STATE.error = "Save failed — your admin changes may not persist."; }
    }
    render();
    const flash = document.getElementById("savedFlash");
    if (flash) { flash.style.display = "inline"; setTimeout(() => { if (flash) flash.style.display = "none"; }, 1800); }
}

/* ---------- CONSENT ---------- */
function consentHtml() {
    return `
    <div class="card">
      <h2>Before you begin</h2>
      <div style="display:grid; gap:10px; margin-bottom:16px;">
        <input class="input" id="c_name" placeholder="Full name" oninput="onConsentField('name', this.value)" />
        <input class="input" id="c_email" type="email" placeholder="Email" oninput="onConsentField('email', this.value)" />
        <input class="input" id="c_age" type="number" min="0" placeholder="Age" oninput="onConsentField('age', this.value)" />
        <div id="underageWarn" style="display:none; color:var(--rust); font-size:13px;">Participants must be 18 or older.</div>
      </div>
      <label style="display:flex; gap:10px; align-items:flex-start; margin-bottom:18px; cursor:pointer;">
        <input type="checkbox" id="c_agree" style="margin-top:3px;" onchange="onConsentAgree(this.checked)" />
        <span style="font-size:14px; color:rgba(36,28,20,0.8); line-height:1.5;">${CONSENT_TEXT}</span>
      </label>
      <div class="row">
        <button class="btn btn-primary" id="startBtn" disabled onclick="submitConsent()">Start rating</button>
        <button class="btn btn-ghost-dark" onclick="goHome()">Cancel</button>
      </div>
    </div>`;
}
function onConsentField(field, val) { STATE.consent[field] = val; updateConsentButton(); }
function onConsentAgree(val) { STATE.consent.agree = val; updateConsentButton(); }
function updateConsentButton() {
    const cs = STATE.consent;
    const underage = cs.age !== "" && Number(cs.age) < 18;
    const canSubmit = cs.name.trim() && cs.email.trim() && cs.age && cs.agree && !underage;
    const btn = document.getElementById("startBtn");
    if (btn) btn.disabled = !canSubmit;
    const warn = document.getElementById("underageWarn");
    if (warn) warn.style.display = underage ? "block" : "none";
}
function submitConsent() {
    if (document.getElementById("startBtn").disabled) return;
    beginPrompt(0);
    STATE.view = "rate";
    render();
}

/* ---------- RATING FLOW ---------- */
function startRating() {
    STATE.order = STATE.config.prompts.map(() => shuffleArr(STATE.config.models.map((m) => m.id)));
    STATE.promptIdx = 0;
    STATE.draft = {};
    STATE.winner = null;
    STATE.sessionRatings = [];
    STATE.consent = { name: "", email: "", age: "", agree: false };
    STATE.view = "consent";
    render();
}
function beginPrompt(idx) {
    const init = {};
    STATE.config.models.forEach((m) => { init[m.id] = { correctness: 3, legibility: 3, accuracy: 3, usability: 3 }; });
    STATE.draft = init;
    STATE.winner = null;
    STATE.promptIdx = idx;
}
function rateHtml() {
    const prompt = STATE.config.prompts[STATE.promptIdx];
    const modelOrder = STATE.order[STATE.promptIdx] || [];
    const modelsById = Object.fromEntries(STATE.config.models.map((m) => [m.id, m]));

    let html = `<div class="card">
    <div class="muted" style="margin-bottom:6px;">Outfit ${STATE.promptIdx + 1} of ${STATE.config.prompts.length} · ${escapeHtml(prompt.grade)}</div>
    <div style="font-family:'Bitter',serif; font-weight:700; font-size:20px;">${escapeHtml(prompt.title)}</div>
  </div>
  <div class="grid-models" style="display:grid; grid-template-columns:repeat(${modelOrder.length},1fr); gap:14px; margin-bottom:16px;">`;

    modelOrder.forEach((modelId, i) => {
        const url = (STATE.config.images[imgKey(prompt.id, modelId)]) || "";
        const label = LETTERS[i];
        html += `<div class="card" style="padding:16px; margin-bottom:0;">
      <div class="opt-label">Option ${label}</div>
      <div class="opt-img-box">${url ? `<img src="${escapeHtml(url)}" alt="Option ${label}" />` : `<span class="muted" style="padding:20px; text-align:center; display:block;">No image added yet in Admin setup</span>`}</div>
      <div style="display:grid; gap:10px;">`;
        CRITERIA.forEach((c) => {
            const labelId = "lbl_" + modelId + "_" + c.key;
            html += `<div>
        <div class="row" style="justify-content:space-between; font-size:12.5px; color:rgba(36,28,20,0.8);">
          <span>${c.label}</span><span id="${labelId}" style="font-weight:700;">3</span>
        </div>
        <input class="slider" type="range" min="1" max="5" value="3" oninput="onSlider('${modelId}','${c.key}','${labelId}', this.value)" />
      </div>`;
        });
        html += `</div></div>`;
    });
    html += `</div>`;

    html += `<div class="card">
    <div style="font-weight:600; margin-bottom:10px;">Which outfit would you actually pick?</div>
    <div class="row">`;
    modelOrder.forEach((modelId, i) => {
        html += `<label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
      <input type="radio" name="winner" onclick="selectWinner('${modelId}')" /> Option ${LETTERS[i]}
    </label>`;
    });
    html += `</div></div>`;

    html += `<button class="btn btn-primary" id="nextBtn" disabled onclick="nextPrompt()">
    ${STATE.promptIdx + 1 < STATE.config.prompts.length ? "Next outfit" : "Submit ratings"}
  </button>`;
    return html;
}
function onSlider(modelId, key, labelId, val) {
    STATE.draft[modelId][key] = Number(val);
    const lbl = document.getElementById(labelId);
    if (lbl) lbl.textContent = val;
    checkRateReady();
}
function selectWinner(modelId) { STATE.winner = modelId; checkRateReady(); }
function checkRateReady() {
    const order = STATE.order[STATE.promptIdx] || [];
    const allScored = order.every((id) => STATE.draft[id]);
    const canProceed = allScored && STATE.winner;
    const btn = document.getElementById("nextBtn");
    if (btn) btn.disabled = !canProceed;
}
function nextPrompt() {
    if (document.getElementById("nextBtn").disabled) return;
    const prompt = STATE.config.prompts[STATE.promptIdx];
    const entry = {
        promptId: prompt.id,
        perModel: STATE.config.models.map((m) => ({ modelId: m.id, ...STATE.draft[m.id] })),
        winnerModelId: STATE.winner,
    };
    const nextSession = STATE.sessionRatings.concat([entry]);
    STATE.sessionRatings = nextSession;
    if (STATE.promptIdx + 1 < STATE.config.prompts.length) {
        beginPrompt(STATE.promptIdx + 1);
        render();
    } else {
        finalizeSubmission(nextSession);
    }
}
async function finalizeSubmission(finalSession) {
    const record = {
        id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        name: STATE.consent.name.trim(),
        email: STATE.consent.email.trim(),
        age: Number(STATE.consent.age),
        consentAt: new Date().toISOString(),
        prompts: finalSession,
    };
    STATE.ratings = STATE.ratings.concat([record]);
    if (STATE.configured) {
        try {
            await apiPost({ action: "addRating", rating: record });
            STATE.error = "";
        }
        catch (e) { STATE.error = "Save failed — this participant's ratings may not persist."; }
    }
    STATE.view = "thanks";
    render();
}
function thanksHtml() {
    return `<div class="card">
    <h2>Thanks — ratings recorded</h2>
    <p>Your ratings and consent have been saved to the shared evaluation record.</p>
    <button class="btn btn-primary" onclick="goHome()">Back to home</button>
  </div>`;
}

/* ---------- DASHBOARD ---------- */
function computeStats(config, ratings) {
    const perModel = {};
    config.models.forEach((m) => { perModel[m.id] = { wins: 0, totals: { correctness: 0, legibility: 0, accuracy: 0, usability: 0 }, n: 0 }; });
    let totalPromptRatings = 0;
    const perPrompt = {};
    config.prompts.forEach((p) => { perPrompt[p.id] = { wins: Object.fromEntries(config.models.map((m) => [m.id, 0])) }; });

    ratings.forEach((r) => {
        (r.prompts || []).forEach((pr) => {
            totalPromptRatings += 1;
            if (pr.winnerModelId && perModel[pr.winnerModelId]) {
                perModel[pr.winnerModelId].wins += 1;
                if (perPrompt[pr.promptId]) perPrompt[pr.promptId].wins[pr.winnerModelId] += 1;
            }
            (pr.perModel || []).forEach((ms) => {
                if (!perModel[ms.modelId]) return;
                perModel[ms.modelId].n += 1;
                CRITERIA.forEach((c) => { perModel[ms.modelId].totals[c.key] += ms[c.key] || 0; });
            });
        });
    });

    const modelStats = config.models.map((m) => {
        const s = perModel[m.id];
        const avg = {};
        CRITERIA.forEach((c) => { avg[c.key] = s.n ? s.totals[c.key] / s.n : 0; });
        const overall = CRITERIA.length ? CRITERIA.reduce((sum, c) => sum + avg[c.key], 0) / CRITERIA.length : 0;
        return { ...m, winRate: totalPromptRatings ? s.wins / totalPromptRatings : 0, wins: s.wins, avg, overall };
    });
    modelStats.sort((a, b) => b.overall - a.overall);
    return { modelStats, totalPromptRatings, perPrompt };
}

function dashboardHtml() {
    const stats = computeStats(STATE.config, STATE.ratings);
    const n = STATE.ratings.length;
    let html = `<div class="card">
    <h2>Leaderboard</h2>
    <div class="muted" style="margin-bottom:16px;">${n} rater${n === 1 ? "" : "s"} · ${stats.totalPromptRatings} outfit ratings total</div>
    <div class="row" style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:8px; font-size:12.5px; color:rgba(36,28,20,0.55); padding:0 4px 8px;">
      <span>Model</span><span>Win rate</span><span>Overall (1–5)</span><span>Wins</span>
    </div>`;
    stats.modelStats.forEach((m, i) => {
        const medal = i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
        html += `<div class="ruled-row" style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:8px; align-items:center;">
      <span style="font-weight:700;">${medal}${escapeHtml(m.company)} — ${escapeHtml(m.name)}</span>
      <span>${(m.winRate * 100).toFixed(0)}%</span><span>${m.overall.toFixed(2)}</span><span>${m.wins}</span>
    </div>`;
    });
    html += `</div>`;

    html += `<div class="card"><h2 style="font-size:18px;">Per-criterion averages</h2>
    <div style="display:grid; grid-template-columns:2fr repeat(${CRITERIA.length},1fr); gap:8px; font-size:12.5px; color:rgba(36,28,20,0.55); padding:0 4px 8px;">
      <span>Model</span>${CRITERIA.map((c) => `<span>${c.label}</span>`).join("")}
    </div>`;
    stats.modelStats.forEach((m) => {
        html += `<div class="ruled-row" style="display:grid; grid-template-columns:2fr repeat(${CRITERIA.length},1fr); gap:8px;">
      <span>${escapeHtml(m.name)}</span>${CRITERIA.map((c) => `<span>${m.avg[c.key].toFixed(2)}</span>`).join("")}
    </div>`;
    });
    html += `</div>`;

    html += `<div class="card"><h2 style="font-size:18px;">Wins by outfit</h2>
    <div style="display:grid; grid-template-columns:2fr repeat(${STATE.config.models.length},1fr); gap:8px; font-size:12.5px; color:rgba(36,28,20,0.55); padding:0 4px 8px;">
      <span>Outfit</span>${STATE.config.models.map((m) => `<span>${escapeHtml(m.name)}</span>`).join("")}
    </div>`;
    STATE.config.prompts.forEach((p) => {
        html += `<div class="ruled-row" style="display:grid; grid-template-columns:2fr repeat(${STATE.config.models.length},1fr); gap:8px;">
      <span>${escapeHtml(p.title)}</span>${STATE.config.models.map((m) => `<span>${(stats.perPrompt[p.id] && stats.perPrompt[p.id].wins[m.id]) || 0}</span>`).join("")}
    </div>`;
    });
    html += `</div>`;

    html += `<div class="card"><h2 style="font-size:18px;">Participants &amp; consent</h2>`;
    if (STATE.ratings.length === 0) html += `<div class="muted">No raters yet.</div>`;
    STATE.ratings.forEach((r) => {
        html += `<div class="ruled-row row" style="justify-content:space-between; font-size:13.5px;">
      <span>${escapeHtml(r.name)} · ${escapeHtml(r.email)} · age ${escapeHtml(r.age)}</span>
      <span class="muted">${new Date(r.consentAt).toLocaleString()}</span>
    </div>`;
    });
    html += `</div>`;

    html += `<div class="row" style="margin-top:12px;">
    <button class="btn btn-ghost-light" onclick="goHome()">← Home</button>
  </div>`;
    return html;
}
async function doResetRatings() {
    openPasscodeModal(async () => {
        if (!confirm("Clear all " + STATE.ratings.length + " ratings? This can't be undone.")) return;
        STATE.ratings = [];
        if (STATE.configured) {
            try {
                await apiPost({ action: "resetRatings" });
                STATE.error = "";
            }
            catch (e) { STATE.error = "Reset failed on the backend — local view cleared only."; }
        }
        render();
    });
}

loadData();
