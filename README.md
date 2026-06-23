# 🏢 Mock Interview Arena

> **Ace Your Technical Interviews** – Engage in gamified turn-based interviews with AI interviewers across four distinct personas. Get real-time feedback, battle HP mechanics, and emerge victorious.

Mock Interview Arena is an interactive interview practice simulator where you select an interviewer persona and engage in a turn-based simulated technical interview. Your answers are evaluated by an AI powered by your choice of LLM provider (Groq, Azure AI Agents, or local models). The system uses gamified battle mechanics where good answers damage the "boss" interviewer's HP, while poor answers damage yours. Victory = Boss HP → 0. Defeat = Your HP → 0.

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- An LLM API key (Groq recommended for free tier)
- Git

### 30-Second Setup

```bash
# 1. Clone & install dependencies
git clone https://github.com/yourusername/MockInterviewArena.git
cd MockInterviewArena
npm install

# 2. Configure your LLM provider
# Copy .env.example and set your API key
cp backend/.env.example backend/.env
# Then edit backend/.env and add your LLM provider key (see Section 4 for details)

# 3. Start both services (run each in a separate terminal)

# Terminal 1: Start Frontend (Vite dev server on port 5173)
npm run dev:frontend

# Terminal 2: Start Backend (Express API on port 5000)
npm run dev:backend

# 4. Open your browser
# Visit http://localhost:5173
```

You'll see the Start Screen with 4 interviewer personas. Click one to begin!

---

## 🎮 Features & Gameplay Overview

### The Four Personas

| Persona | Icon | Focus | Difficulty | Specialties |
|---------|------|-------|-----------|------------|
| **Architect** | 🏛️ | System Design | ⭐⭐⭐⭐ | Scalability, Microservices, Caching, Performance |
| **CTO** | 🚀 | Code Quality | ⭐⭐⭐ | Best Practices, Testing, Leadership, Maintainability |
| **PM** | 📋 | Product Strategy | ⭐⭐ | MVP, Metrics, User Experience, Go-to-Market |
| **QA Lead** | ✅ | Testing & Quality | ⭐⭐⭐ | Edge Cases, Test Coverage, Security, Robustness |

### Battle System

- **Starting HP:** You start with **100 HP**, the boss starts with **100 HP**
- **Turn-based gameplay:** You receive a challenge, type your response, submit
- **AI Evaluation:** The AI evaluates your answer using persona-specific criteria
- **Damage Mechanics:** 
  - Strong answers deal **15–50 HP damage to the boss**
  - Weak answers deal **15–50 HP damage to you**
- **Victory Condition:** Reduce boss HP to 0 first
- **Defeat Condition:** Your HP drops to 0

### Sample Game Session

1. **Start Screen:** Browse 4 color-coded persona cards
2. **Select Persona:** Click Architect (or your choice)
3. **Arena Screen:** Receive challenge prompt (e.g., "Design a social media feed for 100M users")
4. **Submit Response:** Type your answer in the input field
5. **AI Evaluation:** Your response is evaluated, dialogue appears, HP bars update
6. **Repeat:** Engage in 3–5 turns until someone reaches 0 HP
7. **Game Over:** Victory (boss HP ≤ 0) or Defeat (your HP ≤ 0)
8. **Report Card:** See final stats and feedback (if enabled)

---

## 📁 Project Structure

This is a **monorepo** with clear separation between frontend and backend:

```
MockInterviewArena/
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── screens/         # StartScreen.jsx, ArenaScreen.jsx
│   │   ├── components/      # HealthBar.jsx
│   │   ├── context/         # GameContext.jsx (global state)
│   │   ├── constants/       # bosses.js (persona definitions)
│   │   ├── App.jsx          # Main router
│   │   └── main.jsx         # React bootstrap
│   ├── index.html           # HTML entry point
│   ├── vite.config.js       # Vite configuration
│   ├── package.json
│   └── eslint.config.js
│
├── backend/                  # Express API (Node.js)
│   ├── index.js             # Server initialization
│   ├── agent.js             # Role-specific evaluation logic
│   ├── llmProvider.js       # Multi-provider LLM abstraction
│   ├── .env.example         # Environment template
│   └── package.json
│
├── vault/                   # Architecture documentation
│   ├── index.md
│   ├── backend-architecture.md
│   └── frontend-architecture.md
│
└── README.md                # You are here
```

**Why monorepo?** Keeps frontend and backend together for easier development and simplified deployment.

---

## 🔧 Setup & Installation

### Step 1: Prerequisites Check

Ensure you have:
- **Node.js v18+** – Check with `node --version`
- **npm v9+** – Check with `npm --version`
- **Git** – For cloning the repo

### Step 2: Clone & Install

```bash
git clone https://github.com/yourusername/MockInterviewArena.git
cd MockInterviewArena

# Install dependencies for root, frontend, and backend
npm install
```

### Step 3: Configure LLM Provider

The backend requires an LLM provider to evaluate interview responses. Choose one:

#### Option A: **Groq** (Recommended – Free Tier Available)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key** (name it "MockInterviewArena")
5. Copy the key

Then configure:

```bash
# In backend/.env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
```

**Testing:** After setting up, the backend will validate your key on startup.

---

#### Option B: **Azure AI Agents**

1. Go to [Azure Portal](https://portal.azure.com)
2. Create or access an **AI Agent** resource
3. Copy the **Connection String** from the resource's Connection tab
4. Configure:

```bash
# In backend/.env
LLM_PROVIDER=azure
AZURE_AI_AGENTS_CONNECTION_STRING=your_connection_string_here
```

---

### Step 4: Create & Configure `.env`

Copy the template:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in your provider details. See [backend/.env.example](backend/.env.example) for the complete template.

**Example `.env` (Groq):**

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
LLM_TIMEOUT=15000
```

### Step 5: Verify Setup

```bash
# Backend will validate LLM provider on startup
# You'll see: "[LLM] Provider validated: groq ✓"
npm run dev:backend

# In another terminal, check frontend starts:
npm run dev:frontend

# Both should start without errors
```

---

## 🎮 How to Play

### Starting the Application

Open two terminal windows (side-by-side is helpful):

**Terminal 1 – Frontend:**
```bash
npm run dev:frontend
```
You should see:
```
  ➜  local:   http://localhost:5173/
```

**Terminal 2 – Backend:**
```bash
npm run dev:backend
```
You should see:
```
Express server running on http://localhost:5000
[LLM] Provider validated: groq ✓
```

Then open your browser to **http://localhost:5173**.

---

### Step-by-Step Gameplay

#### **Phase 1: Start Screen**
- See 4 persona cards (Architect, CTO, PM, QA)
- Each card shows role, difficulty (stars), and color theme
- Click a card to enter Arena

#### **Phase 2: Arena**
- **Left side:** Boss HP bar (enemy health)
- **Right side:** Your HP bar (your health, starts at 100)
- **Center:** Challenge prompt (e.g., "Design a cache invalidation strategy for a distributed system")

#### **Phase 3: Submit Your Response**
- Read the challenge carefully (difficulty affects complexity)
- Type your response in the input box at the bottom
- Click **"Submit"** or press Enter
- Wait 2–3 seconds for AI evaluation

#### **Phase 4: See Results**
- **Dialogue:** AI's response (what it thinks of your answer)
- **HP Update:** Your HP bar and boss HP bar adjust based on damage
- **Battle Log:** Your response and boss feedback appear in the chat history above

#### **Phase 5: Repeat or End**
- If both HP > 0: Next challenge appears
- If boss HP ≤ 0: **Victory!** You won the interview
- If your HP ≤ 0: **Defeat!** The interview didn't go as planned
- See final report card with performance summary

---

### Strategy Tips by Persona

| Persona | What They Value | Tips |
|---------|-----------------|------|
| **Architect** 🏛️ | Scalability, system design | Think about scale (millions of users), trade-offs (CAP theorem), microservices |
| **CTO** 🚀 | Code quality, best practices | Mention testing, clean code, maintainability, technical debt |
| **PM** 📋 | User impact, business metrics | Focus on user problem, MVP scope, go-to-market, metrics |
| **QA** ✅ | Edge cases, robustness | Talk about testing strategy, edge cases, security, failure modes |

**Difficulty Matters:** Higher difficulty personas ask more complex questions. Start with PM (⭐⭐) for warm-up, then challenge yourself with Architect (⭐⭐⭐⭐).

---

## 🛠️ Troubleshooting

#### ❌ "Port 5173 already in use" or "Port 5000 already in use"

**Problem:** Another process is using the port.

**Solution:**
```bash
# Kill the existing process (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
PORT=3000 npm run dev:frontend
```

---

#### ❌ "LLM Provider Error" or "API key invalid"

**Problem:** LLM provider not configured or key is incorrect.

**Checklist:**
1. Is `backend/.env` file created? Check: `ls backend/.env`
2. Is `LLM_PROVIDER` set? (groq, azure, or local)
3. Is the API key correct? Double-check against your provider console
4. For Groq: Are you using the API key (not the model name)?
5. For Azure: Is the connection string complete and not expired?
6. For Local: Is your LLM server running on the specified endpoint?

**Fix:**
```bash
# Edit and verify your .env
nano backend/.env

# Restart backend
npm run dev:backend
```

---

#### ❌ "Cannot connect to backend" or "Frontend shows blank screen"

**Problem:** Frontend can't reach backend API.

**Checklist:**
1. Backend running? Check terminal 2 for "Express server running on..."
2. Frontend running? Check terminal 1 for "http://localhost:5173"
3. Firewall blocking? Try accessing `http://localhost:5000` directly in browser
4. Browser console errors? Open DevTools (F12) and check Console tab

**Fix:**
```bash
# Restart backend on correct port
PORT=5000 npm run dev:backend

# Restart frontend
npm run dev:frontend

# Check browser console for specific error messages
```

---

#### ❌ "Module not found" or "Cannot find module 'express'"

**Problem:** Dependencies not installed.

**Solution:**
```bash
# Clear and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install --force

# Verify installation
npm list express
```

---

#### ❌ "npm command not found"

**Problem:** npm not installed or not in PATH.

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org) (includes npm)
2. Verify: `node --version` and `npm --version`
3. On Windows, restart terminal after installing Node.js

---

### Development Workflow

**Hot Module Reloading (HMR):**
- Frontend changes auto-refresh in browser (no manual reload needed)
- Edit `frontend/src/App.jsx`, save → browser updates instantly

**Backend Watch Mode:**
- Backend runs with `--watch` flag, automatically restarts on file changes
- Edit `backend/agent.js`, save → backend relaunches

---

## 🏗️ Architecture Deep-Dive

### Frontend Architecture

The frontend is a React SPA built with Vite, using Context API for global state management.

**State Management (GameContext):**
```javascript
{
  playerHP: 100,           // Your health (0–100)
  bossHP: 100,             // Interviewer health (0–100)
  gameStatus: 'SELECT',    // 'SELECT' | 'ARENA' | 'VICTORY' | 'DEFEAT'
  selectedBoss: 'architect',  // Selected persona
  challenge: '...',        // Current interview challenge
  battleLog: [...],        // Array of turn history
  reportCard: {...},       // Final performance stats (if enabled)
  theme: 'dark'            // 'dark' | 'light'
}
```

**Component Tree:**
```
App (router logic)
├── StartScreen (persona selection)
└── ArenaScreen (battle interface)
    └── HealthBar (boss HP display)
    └── HealthBar (player HP display)
```

**Game Flow:**
1. User lands on **StartScreen**, sees 4 persona cards
2. Click persona → set `selectedBoss`, transition to `gameStatus: 'ARENA'`
3. In **ArenaScreen**, display challenge, capture response, submit to backend
4. Backend evaluates, returns damage → update `playerHP` or `bossHP`
5. If either HP ≤ 0, set `gameStatus: 'VICTORY'` or `'DEFEAT'`
6. Show report card or replay option

**For detailed component breakdown, see [vault/frontend-architecture.md](vault/frontend-architecture.md).**

---

### Backend Architecture

The backend is an Express API server that evaluates interview responses using an LLM provider.

**Request Flow:**
```
Frontend POST /api/battle/turn
  ↓ with { userResponse, bossId, difficulty }
Express routes to agent.js
  ↓
LLM Provider abstraction (llmProvider.js)
  ├─ Attempts Groq API call
  ├─ Retries on failure (up to 2 retries)
  └─ Timeout: 15 seconds total
  ↓
Agent evaluates using role-specific prompt
  (Agent criteria: correctness, architecture, soft skills)
  ↓
Calculate damage: 0–50 HP to player or boss
  ↓
Return { dialogue, damageTo, damageAmount }
  ↓
Frontend updates HP bars + battle log
```

**Multi-Provider LLM Abstraction (llmProvider.js):**
```javascript
// Unified interface, pluggable providers
const response = await getLLMResponse({
  provider: 'groq',        // or 'azure', 'local'
  prompt: evaluationPrompt,
  maxRetries: 2,
  timeout: 15000
});
// Returns: { dialogue, damageTo, damageAmount }
```

**Agent Evaluation (agent.js):**

Each persona has a unique evaluation prompt:

- **Architect:** Focuses on system design, scalability, architectural patterns
- **CTO:** Focuses on code quality, best practices, testing, maintainability
- **PM:** Focuses on user impact, MVP, metrics, go-to-market
- **QA:** Focuses on edge cases, test coverage, security, robustness

Each evaluates the response and assigns damage: **15–50 HP** (varies by severity).

**For detailed backend architecture, see [vault/backend-architecture.md](vault/backend-architecture.md).**

---

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ StartScreen → ArenaScreen (battleLog, HP bars, AI    │   │
│  │ dialogue)                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓↑                                 │
│                   POST /api/battle/turn                      │
│              { userResponse, bossId, difficulty }            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express + LLM)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ agent.js → role-specific prompt + user response     │   │
│  │   ↓                                                  │   │
│  │ llmProvider.js → { Groq | Azure | Local }          │   │
│  │   ↓ (retry logic, 15s timeout)                      │   │
│  │ LLM API call → evaluate → damage calculation        │   │
│  │   ↓                                                  │   │
│  │ Return { dialogue, damageTo, damageAmount }         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
              Response + HP update to frontend
```

---

### Extending the System

**Add a New LLM Provider:**
1. Edit `backend/llmProvider.js`
2. Add new case in provider switch
3. Implement provider-specific API call with timeout + retry logic
4. Return unified format: `{ dialogue, damageTo, damageAmount }`

**Add a New Persona:**
1. Add entry to `frontend/src/constants/bosses.js`
2. Add role-specific prompt to `backend/agent.js`
3. Add evaluation logic (how this persona judges answers)

**Adjust Difficulty:**
- Modify challenge complexity in `backend/agent.js` based on `difficulty` parameter
- Or modify damage scaling: currently 15–50 HP, can be adjusted per persona/difficulty

---

## 🤝 Contributing Guidelines

### Code Style

Follow ESLint rules for frontend and backend:

```bash
# Check frontend code style
npm run lint:frontend

# Auto-fix issues
npm run lint:frontend -- --fix
```

**Conventions:**
- Use **const** by default, **let** if reassignment needed
- Use **arrow functions** for callbacks
- Use **descriptive variable names** (avoid single letters except loops/iterators)
- **Comments:** Explain *why*, not *what* (code shows what)

---

### Branch & PR Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/add-new-persona
   ```

2. **Make changes:**
   - Follow code style
   - Make clear, focused commits

3. **Commit with clear messages** (see Commit Format below)

4. **Push & open PR:**
   - Include detailed description of what changed and why
   - Link any related issues

---

### Commit Message Format

Use **Conventional Commits**:

```
type(scope): subject

body (optional)
footer (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(agent): add reasoning to damage calculation
fix(frontend): resolve HP bar update race condition
docs(readme): clarify LLM provider setup
test(battle): add edge case for tie scenario
```

---

### Adding a Feature: Example – New Persona

**Scenario:** Add a "DevOps Engineer" persona.

**Steps:**

1. **Frontend:** `frontend/src/constants/bosses.js`
   ```javascript
   {
     id: 'devops',
     name: 'DevOps Engineer',
     icon: '⚙️',
     theme: 'orange',
     difficulty: 3,
     specialties: ['Infrastructure', 'CI/CD', 'Monitoring', 'Scalability']
   }
   ```

2. **Backend:** `backend/agent.js`
   ```javascript
   case 'devops':
     return `You are a DevOps Engineer. Evaluate the candidate's response...`;
   ```

3. **Submit PR** with detailed description of the new persona and its evaluation criteria

---

### Reporting Bugs

**Template:**
```
Title: [Bug] Brief description

Description:
What you were trying to do?

Steps to Reproduce:
1. ...
2. ...
3. ...

Expected Behavior:
...

Actual Behavior:
...

Environment:
- Node version: (node --version)
- npm version: (npm --version)
- LLM Provider: (groq/azure/local)
- OS: (Windows/Mac/Linux)

Logs/Screenshots:
(Attach error messages or browser console logs)
```

---

### License

[Specify your license here – e.g., MIT, Apache 2.0, GPL]

---

## 📡 API Reference

### Base URL

- **Development:** `http://localhost:5000`
- **CORS:** Allows `http://localhost:5173` (frontend)

---

### Endpoints

#### **POST /api/battle/turn**

Submits a candidate response to be evaluated by an interviewer.

**Request:**
```json
{
  "userResponse": "I would design a distributed cache using Redis with...",
  "bossId": "architect",
  "difficulty": 3
}
```

**Response:**
```json
{
  "dialogue": "Your approach to caching is solid, but you didn't mention...",
  "damageTo": "boss",
  "damageAmount": 35
}
```

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `damageTo` | string | `"player"` \| `"boss"` \| `"none"` | Who takes damage |
| `damageAmount` | number | 0–50 | HP points deducted |

---

#### **POST /api/challenge/generate**

Generates a new interview challenge for a given persona.

**Request:**
```json
{
  "bossId": "architect",
  "difficulty": 3
}
```

**Response:**
```json
{
  "challenge": "Design a real-time messaging system for 10M concurrent users. What are your considerations?"
}
```

---

#### **POST /api/resume/upload**

Upload a candidate's resume (PDF or DOCX) for profile extraction.

**Request:**
```
Content-Type: multipart/form-data
File: resume.pdf
```

**Response:**
```json
{
  "candidateProfile": {
    "name": "John Doe",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": "5 years in full-stack development"
  }
}
```

**Limits:**
- Max file size: 5 MB
- Formats: `.pdf`, `.docx`

---

## ❓ FAQ

**Q: Can I use a different LLM provider than Groq?**
Yes! See [Setup & Installation](#-setup--installation) for Azure and Local LLM options.

**Q: How long do interviews typically take?**
3–5 turns (~5–10 minutes), depending on response quality and difficulty.

**Q: Can I play multiple rounds?**
Yes! After victory or defeat, the Start Screen reappears. Select a new persona or replay.

**Q: Is my data saved?**
Currently, no. Data exists only in browser memory during a session. Future versions may add profiles and leaderboards.

**Q: Can I customize challenges?**
Not via UI yet. Developers can modify `backend/agent.js` prompts to create custom challenge sets.

**Q: What if my LLM API rate limit is exceeded?**
You'll see an error message. Wait a moment and retry, or switch to a different LLM provider.

---

## 📚 Additional Resources

- **Architecture Docs:** [vault/backend-architecture.md](vault/backend-architecture.md) | [vault/frontend-architecture.md](vault/frontend-architecture.md)
- **LLM Providers:**
  - Groq: https://console.groq.com
  - Azure AI Agents: https://azure.microsoft.com/en-us/products/ai-agents/
  - Ollama (local): https://ollama.ai
- **Framework Docs:**
  - React: https://react.dev
  - Vite: https://vitejs.dev
  - Express: https://expressjs.com
  - Playwright: https://playwright.dev

---

## 💬 Support & Community

- **Issues:** GitHub Issues for bugs and feature requests
- **Discussions:** GitHub Discussions for questions and ideas
- **Email:** [your-email@example.com]

---

**Happy interviewing! 🚀**
