# AI Job Intake Agent — Embeddable Chat Widget

> A production-ready agentic job application system built for staffing agencies. Job seekers interact with a conversational AI chat widget embedded directly into a WordPress website — no forms, no friction.

---

## Overview

This project replaces traditional job application forms with an AI-powered chat agent. Visitors click a chat button on the website, and the agent guides them through selecting a job role, location, shift, and collecting all personal details — then fires a structured email to the owner and a confirmation receipt to the applicant, all automatically.

---

## Key Features

- Conversational AI agent powered by Claude Haiku (Anthropic)
- 12-state backend state machine — Claude handles natural language only, never application logic
- Mock Mode for demos with zero API key requirement
- Resume upload (PDF/DOC) attached directly to owner email — no cloud storage needed
- Dual email delivery: structured owner notification + applicant confirmation receipt
- Self-contained embeddable widget — one `<script>` tag to add to any website
- In-memory sessions with 30-min TTL — no database required
- Field-by-field validation (email, Canadian phone, 18+ DOB check, future start date)
- Progress bar, inline quick-reply chips, spring animations, mobile-responsive

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic SDK |
| Email | Nodemailer + Gmail SMTP |
| File Uploads | Multer (in-memory, no disk storage) |
| Sessions | In-memory Map (30-min TTL, no database needed) |
| Frontend | Vanilla JS embeddable widget (zero dependencies) |
| Deployment | Railway (backend) + WordPress via WPCode (widget) |

---

## Project Structure

```
.
├── backend/
│   ├── server.js                  # Express entry point, CORS, routes
│   ├── package.json
│   ├── .env.example               # Environment variable template (safe to commit)
│   ├── routes/
│   │   ├── chat.js                # POST /api/chat/start & /api/chat/message
│   │   └── submit.js              # POST /api/submit
│   ├── services/
│   │   ├── claude.js              # Claude API calls + Mock Mode responses
│   │   ├── session.js             # In-memory session management
│   │   └── email.js               # Gmail SMTP email dispatch
│   ├── prompts/
│   │   └── systemPrompt.js        # Dynamic system prompt builder per state
│   ├── templates/
│   │   ├── ownerEmail.js          # HTML email template for owner notification
│   │   └── applicantEmail.js      # HTML confirmation email for applicant
│   └── utils/
│       ├── stateManager.js        # 12-state machine definition + job/location data
│       └── validator.js           # Per-field input validation
└── widget/
    ├── embed.js                   # Self-contained chat widget (IIFE, no dependencies)
    └── demo.html                  # Simulated website for client demo/testing
```

---

## How the State Machine Works

The agent follows a strict 12-state linear flow. Claude **only generates natural language** — all routing, validation, and state transitions are handled by the backend. This makes the system predictable and eliminates hallucination risk.

```
JOB_SELECTION → LOCATION_SELECTION → SHIFT_SELECTION →
COLLECT_NAME → COLLECT_EMAIL → COLLECT_PHONE → COLLECT_DOB →
COLLECT_START_DATE → COLLECT_RESUME → COLLECT_LINKEDIN →
CONFIRMATION → SUBMITTED
```

Users can also say "edit [field]" at the confirmation screen to jump back to any step.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/ai-job-intake-agent.git
cd ai-job-intake-agent
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=3001
MOCK_MODE=true                          # true = no API key needed (great for testing)

ANTHROPIC_API_KEY=sk-ant-your-key-here  # Only needed when MOCK_MODE=false

EMAIL_FROM=youremail@gmail.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail App Password, not your login password
OWNER_EMAIL=owner@yourcompany.com

CONTACT_PHONE=+1 000-000-0000
CONTACT_EMAIL=info@yourcompany.com
CONTACT_WEBSITE=https://yourcompany.com

ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

> **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → Generate

### 4. Start the backend

```bash
npm run dev       # development with auto-restart (nodemon)
npm start         # production
```

Backend runs at `http://localhost:3001`

### 5. Open the demo

Open `widget/demo.html` using **Live Server** (VS Code extension) on port 5500.

The chat button appears bottom-right. With `MOCK_MODE=true` the full flow works instantly — no API key needed.

---

## Mock Mode vs Live Mode

| Setting | Behaviour |
|---------|-----------|
| `MOCK_MODE=true` | Pre-written responses per state. No Anthropic API key needed. Perfect for demos. |
| `MOCK_MODE=false` | Live Claude Haiku via Anthropic API. For production use. |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3001`) |
| `MOCK_MODE` | Yes | `true` or `false` |
| `ANTHROPIC_API_KEY` | Only if `MOCK_MODE=false` | From [console.anthropic.com](https://console.anthropic.com) |
| `EMAIL_FROM` | Yes | Gmail address used to send emails |
| `EMAIL_APP_PASSWORD` | Yes | Gmail App Password (16 chars, no spaces) |
| `OWNER_EMAIL` | Yes | Inbox that receives completed job applications |
| `CONTACT_PHONE` | Yes | Phone shown in applicant confirmation email |
| `CONTACT_EMAIL` | Yes | Contact email shown in applicant confirmation email |
| `CONTACT_WEBSITE` | Yes | Website URL shown in applicant confirmation email |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/start` | Create session, return greeting + job buttons |
| `POST` | `/api/chat/message` | Send user message, receive agent response |
| `POST` | `/api/submit` | Submit application, trigger both emails |
| `GET` | `/api/health` | Health check (used by Railway for uptime monitoring) |
| `GET` | `/widget/embed.js` | Serve the embeddable widget script |

---

## Deployment (Railway)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → Deploy from GitHub repo
3. Set the **Root Directory** to `backend/`
4. Add all environment variables in Railway's Variables tab
5. Railway auto-detects `npm start` — no config file needed
6. Copy your Railway public URL (e.g. `https://your-app.railway.app`)

Update `widget/demo.html` to point to the live backend:
```html
<script src="embed.js" data-api="https://your-app.railway.app"></script>
```

---

## WordPress Integration

Once deployed, add this single line via **WPCode** plugin → Footer scripts:

```html
<script src="https://your-app.railway.app/widget/embed.js"
        data-api="https://your-app.railway.app"></script>
```

Add the WordPress domain to `ALLOWED_ORIGINS` in Railway:
```
https://yoursite.com,https://your-app.railway.app
```

---

## Security Notes

- `backend/.env` is in `.gitignore` — credentials are never committed to the repo
- All contact details are in environment variables — nothing is hardcoded
- CORS restricts API access to explicitly allowed origins only
- Resume buffers are held in RAM only and cleared immediately after email is sent
- No database — sessions are in-memory with automatic 30-minute expiry
- Input validated on every field server-side before state advances

---

## Going to Production Checklist

- [ ] Set `MOCK_MODE=false`
- [ ] Add real `ANTHROPIC_API_KEY`
- [ ] Set `OWNER_EMAIL` to the client's actual inbox
- [ ] Fill in `CONTACT_PHONE`, `CONTACT_EMAIL`, `CONTACT_WEBSITE`
- [ ] Add the live domain to `ALLOWED_ORIGINS`
- [ ] Inject the script tag into WordPress via WPCode
- [ ] Test the full flow end-to-end on the live site
