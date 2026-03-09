# Consulting Group — AI Job Intake Agent

An agentic job application system for Consulting Group, built for embedding into their WordPress website. Job seekers interact with a conversational chat widget that guides them through the full application process — no forms, no hassle.

---

## What It Does

- Visitors click the chat button on the website
- The AI agent walks them through selecting a job, location, and shift
- It collects their name, email, phone, date of birth, start date, resume (optional), and LinkedIn (optional)
- On submission, the owner receives a structured email with resume attached, and the applicant receives a confirmation receipt

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

---

## Project Structure

```
Project_Consulting/
├── backend/
│   ├── server.js                  # Express entry point, CORS, routes
│   ├── package.json
│   ├── .env.example               # Environment variable template
│   ├── routes/
│   │   ├── chat.js                # POST /api/chat/start & /api/chat/message
│   │   └── submit.js              # POST /api/submit
│   ├── services/
│   │   ├── claude.js              # Claude API calls + Mock Mode
│   │   ├── session.js             # In-memory session management
│   │   └── email.js               # Gmail SMTP email dispatch
│   ├── prompts/
│   │   └── systemPrompt.js        # Dynamic system prompt builder
│   ├── templates/
│   │   ├── ownerEmail.js          # HTML email template for owner
│   │   └── applicantEmail.js      # HTML confirmation email for applicant
│   └── utils/
│       ├── stateManager.js        # 12-state machine, jobs, locations, shifts
│       └── validator.js           # Per-field input validation
└── widget/
    ├── embed.js                   # Self-contained chat widget (IIFE)
    └── demo.html                  # Simulated client website for demo/testing
```

---

## Conversation States

The agent follows a strict 12-state flow. Claude only generates natural language — the state machine controls all logic.

```
JOB_SELECTION → LOCATION_SELECTION → SHIFT_SELECTION →
COLLECT_NAME → COLLECT_EMAIL → COLLECT_PHONE → COLLECT_DOB →
COLLECT_START_DATE → COLLECT_RESUME → COLLECT_LINKEDIN →
CONFIRMATION → SUBMITTED
```

---

## Available Jobs & Locations

**Roles:** Whatever user wants to publish

**Locations:** Upto User

**Shifts:** Morning (6AM–2PM), Afternoon (2PM–10PM), Night (10PM–6AM)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/consulting-group-agent.git
cd consulting-group-agent
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

Edit `backend/.env`:

```env
PORT=3001
MOCK_MODE=true                          # true = no API key needed (demo mode)

ANTHROPIC_API_KEY=sk-ant-your-key-here  # Only needed when MOCK_MODE=false

EMAIL_FROM=youremail@gmail.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail App Password (not your login password)
OWNER_EMAIL=owner@consultinggroup.ca

ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate

### 4. Start the backend

```bash
npm run dev       # development (auto-restart with nodemon)
npm start         # production
```

Server runs at `http://localhost:3001`

### 5. Open the demo

Open `widget/demo.html` in a browser using **Live Server** (VS Code extension) or any static file server on port 5500.

The chat button appears in the bottom-right corner.

---

## Mock Mode vs Live Mode

| Setting | Behaviour |
|---------|-----------|
| `MOCK_MODE=true` | Pre-written responses, no Claude API key needed. Perfect for demos and testing. |
| `MOCK_MODE=false` | Live Claude Haiku responses via Anthropic API. For production use. |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `MOCK_MODE` | Yes | `true` or `false` |
| `ANTHROPIC_API_KEY` | Only if `MOCK_MODE=false` | Get from console.anthropic.com |
| `EMAIL_FROM` | Yes | Gmail address that sends emails |
| `EMAIL_APP_PASSWORD` | Yes | Gmail App Password (16 characters) |
| `OWNER_EMAIL` | Yes | Inbox that receives job applications |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |

---

## Deployment (Railway)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend/` folder as the root
4. Add all environment variables in Railway's dashboard (do **not** commit `.env`)
5. Railway auto-detects `npm start` from `package.json`
6. Copy the Railway public URL (e.g. `https://your-app.railway.app`)

Update `widget/demo.html`:
```html
<script src="embed.js" data-api="https://your-app.railway.app"></script>
```

---

## WordPress Integration

Once the backend is deployed, add this single line to the WordPress site via **WPCode** (Insert Headers & Footers plugin) → Footer:

```html
<script src="https://your-app.railway.app/widget/embed.js"
        data-api="https://your-app.railway.app"></script>
```

Also update `ALLOWED_ORIGINS` in Railway to include the WordPress domain:
```
https://consultinggroup.ca,https://your-app.railway.app
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/start` | Create session, return greeting + job buttons |
| `POST` | `/api/chat/message` | Send user message, get agent response |
| `POST` | `/api/submit` | Submit completed application, send emails |
| `GET` | `/api/health` | Health check (used by Railway) |
| `GET` | `/widget/embed.js` | Serve the embeddable widget script |

---

## Security Notes

- `.env` is in `.gitignore` — credentials are never committed
- CORS restricts requests to explicitly allowed origins only
- Resume files are stored in memory only — cleared from RAM after email is sent
- No database — session data lives in-memory with 30-minute TTL
- Input validation on every field (email regex, Canadian phone format, 18+ DOB check)

---

## Going to Production Checklist

- [ ] Set `MOCK_MODE=false` in Railway environment variables
- [ ] Add real `ANTHROPIC_API_KEY`
- [ ] Set `OWNER_EMAIL` to the client's actual inbox
- [ ] Add the WordPress domain to `ALLOWED_ORIGINS`
- [ ] Inject the script tag into WordPress via WPCode
- [ ] Test full flow end-to-end on the live site

---

## Contact

Built for **Consulting Group** — 

