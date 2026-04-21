# AI Job Intake Agent — Embeddable Chat Widget

A conversational AI agent that replaces traditional job application forms. Job seekers chat with an AI directly on the company website, and the agent collects their details and automatically sends the application to the employer.

---

## What It Does

- Visitor clicks the chat button on the website
- AI agent guides them through job selection and personal details
- On completion, employer gets a structured application email and applicant gets a confirmation

---

## Tech Stack

| | |
|--|--|
| Backend | Python + FastAPI |
| AI | Claude Haiku (Anthropic) |
| Email | Gmail SMTP |
| Frontend | Vanilla JS embeddable widget |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
.
├── backend_py/        # Python FastAPI backend
│   ├── main.py
│   ├── routes/        # API endpoints
│   ├── services/      # AI, email, session logic
│   ├── prompts/       # AI prompt templates
│   ├── templates/     # Email HTML templates
│   └── utils/         # Validation + state management
├── widget/
│   ├── embed.js       # Embeddable chat widget
│   └── demo.html      # Demo page for testing
├── Dockerfile
└── docker-compose.yml
```

---

## Local Setup

**1. Clone and create virtual environment**
```bash
git clone https://github.com/YOUR-USERNAME/ai-job-intake-agent.git
cd ai-job-intake-agent
python -m venv venv
venv\Scripts\activate        # Windows
```

**2. Install dependencies**
```bash
pip install -r backend_py/requirements.txt
```

**3. Set up environment variables**

Create `backend_py/.env`:
```env
MOCK_MODE=true
ANTHROPIC_API_KEY=your-key-here
EMAIL_FROM=youremail@gmail.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
OWNER_EMAIL=owner@yourcompany.com
CONTACT_PHONE=+1 000-000-0000
CONTACT_EMAIL=info@yourcompany.com
CONTACT_WEBSITE=https://yourcompany.com
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

> Set `MOCK_MODE=true` to run the full flow without an API key — great for demos and testing.

**4. Start the backend**
```bash
cd backend_py
python -m uvicorn main:app --reload --port 8000
```

**5. Open the demo**

Open `widget/demo.html` with Live Server (VS Code) on port 5500. The chat button appears bottom-right.

---

## Run with Docker

```bash
docker compose up --build
```

Backend and widget both run at `http://localhost:8000`.

---

## WordPress Integration

Once deployed, add this one line to your WordPress site via **WPCode** plugin:

```html
<script src="https://your-app.example.com/widget/embed.js"
        data-api="https://your-app.example.com"></script>
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MOCK_MODE` | `true` = demo mode, no API key needed |
| `ANTHROPIC_API_KEY` | Required when `MOCK_MODE=false` |
| `EMAIL_FROM` | Gmail address to send from |
| `EMAIL_APP_PASSWORD` | Gmail App Password |
| `OWNER_EMAIL` | Inbox that receives applications |
| `CONTACT_PHONE/EMAIL/WEBSITE` | Shown in applicant confirmation email |
| `ALLOWED_ORIGINS` | Comma-separated allowed domains |