# Placement Tracker — ABES Engineering College (Code: 032)

A full-stack campus placement and interview readiness platform built for **ABES Engineering College**. It brings together student drive applications, live eligibility checks, TPO analytics, AI resume & ATS diagnostics, voice-enabled mock interviews, and faculty mock panels in one place.

---

## What It Does

### For Students
- **Dashboard & Eligible Drives**: See open campus drives, why you qualify (or don't) based on CGPA, backlogs, branch, and deadlines, and apply in one click.
- **Application Tracker**: Follow every application across stages (`Applied → Shortlisted → Online Assessment → Technical Interview → HR Round → Selected / Rejected`).
- **Resume Auditor (STAR)**: Upload a PDF/DOCX/TXT resume (or paste text / load a sample) to get a 0–100 score, section breakdown, action-verb analysis, and concrete STAR-method bullet rewrites.
- **ATS Score Matcher**: Compare your resume against any campus drive JD (or a custom JD) to check match percentage, matched skills, and missing keywords.
- **AI Interview Simulator**: Practice technical, DSA, Core CS, or HR rounds with browser voice input/output (Web Speech API, with full text fallback), a code scratchpad, and a 5-axis Recharts radar report.
- **Faculty Mock Panels**: Book available mock interview slots and view 4-axis TPO scorecards once evaluated.

### For TPO / Organization
- **Placement Analytics**: Track placed percentage, highest/average CTC, branch-wise stats, and hiring tier distribution with Recharts.
- **Companies & Drives Manager**: Manage partner companies, launch/close drives, and use **Auto-Extract JD Fields** to pull role, CTC, CGPA, and skills from raw JD text.
- **Applicant Pipeline**: View all applicants across all drives in one funnel, filter by round or drive, check each candidate's ATS match score, update rounds, and export CSV reports.
- **Mock Panels & Training Readiness**: Schedule mock interview slots, grade candidates across DSA/Core CS/Project Defense/Communication, and manage aptitude & DSA scores.

---

## Tech Stack

- **Frontend**: React, Vite, React Router, Tailwind CSS, Lucide React, Recharts, Axios
- **Backend**: Node.js, Express (`/api/v1`), JWT auth, bcryptjs, Multer
- **Document Parsing & AI**: `pdf-parse`, `mammoth`, optional Gemini/OpenAI integration with a built-in deterministic local NLP engine so every AI feature works offline out of the box
- **Database**: SQLite by default (auto-migrated and seeded on startup, zero setup), with PostgreSQL support via `DATABASE_URL`

---

## Demo Accounts

You can sign in immediately using the one-click buttons on the login page or with these credentials:

| Role | Email | Password | Profile |
| :--- | :--- | :--- | :--- |
| **Student** | `student@abes.ac.in` | `Student@123` | Raghav Bhatnagar (`2400321530154`), CSE (AI & ML), Sec A, 2024–2028, CGPA 8.6, 0 backlogs |
| **Organization (TPO)** | `org@abes.ac.in` | `Org@123` | ABES Engineering College — Training & Placement Office |

---

## Running Locally

### 1. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd "../placement tracker"
npm install
```

### 2. Start the backend
```bash
cd server
npm start
```
The API starts on `http://localhost:5001` (we use `5001` instead of `5000` to avoid macOS AirPlay Receiver conflicts). On first run, it automatically creates, migrates, and seeds the SQLite database at `data/placement_tracker.db`.

### 3. Start the frontend
In a second terminal:
```bash
cd "placement tracker"
npm run dev
```
Open `http://localhost:5173` in your browser. Vite proxies `/api` and `/uploads` to `http://localhost:5001`.

### 4. Run tests
```bash
cd server
npm test
```

---

## Deploying to Render

This repo is ready to deploy on **Render** as a single Web Service—the Express server serves the built React app (`placement tracker/dist`) alongside `/api/v1` and `/uploads`, so you don't need separate frontend/backend services or CORS workarounds.

### Option A: Deploy with `render.yaml` (Blueprint)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New + → Blueprint**.
3. Connect your GitHub repo. Render will automatically detect `render.yaml` and configure:
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Environment**: `NODE_ENV=production`, auto-generated `JWT_SECRET`
4. Click **Apply** and wait for the build to finish.

### Option B: Manual Render Web Service
1. Go to **New + → Web Service** and connect your GitHub repository.
2. Use these settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
3. Add Environment Variables under **Environment**:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(any strong random string)*
   - `JWT_EXPIRES_IN` = `7d`
   - *(Optional)* `DATABASE_URL` = *(your Render PostgreSQL Internal URL if you want persistent Postgres storage instead of ephemeral SQLite on free tier)*
   - *(Optional)* `GEMINI_API_KEY` = *(only needed if you want live LLM responses instead of the built-in local NLP engine)*
4. Click **Create Web Service**. Render assigns `PORT` automatically and your app will be live at `https://<your-service>.onrender.com`.

> **Note on Render Free Tier & SQLite**: Render's free web service filesystem resets on redeploy/spin-down. The server automatically re-migrates and re-seeds demo data on startup, so the app always boots cleanly. For persistent user data across deploys, attach a **Render PostgreSQL** database and set `DATABASE_URL`.

---

## Project Structure

```text
FSD_Project_AIML_A_2026/
├── package.json                 # Root build/start scripts (used by Render)
├── render.yaml                  # Render Blueprint config
├── data/                        # Local SQLite database (auto-generated)
├── server/                      # Express REST API (/api/v1)
│   ├── src/
│   │   ├── app.js               # Express app + production static frontend serving
│   │   ├── server.js            # Entrypoint (auto-migrates & seeds if needed)
│   │   ├── config/env.js        # Env variables & port config
│   │   ├── db/                  # SQLite/Postgres driver, schema.sql, migrate, seed
│   │   ├── middleware/          # JWT auth, role checks, Multer uploads
│   │   ├── services/            # eligibilityEngine, docExtractor, aiEngine
│   │   ├── controllers/         # Auth, drives, applications, ATS, AI & mock interviews
│   │   └── routes/api.js        # All /api/v1 endpoints
│   └── tests/api.test.js        # Integration test suite
└── placement tracker/           # React + Vite frontend
    ├── vite.config.js           # Dev proxy to localhost:5001
    └── src/
        ├── App.jsx              # Role-based routing
        ├── context/AuthContext.jsx
        ├── services/api.js      # Axios client with JWT interceptor
        ├── components/          # Layout, Navbar, Sidebar, ProtectedRoute
        └── pages/
            ├── Login.jsx, Register.jsx, ForgotPassword.jsx
            ├── student/         # Dashboard, Drives, Applications, Profile, Resume/ATS/AI Interview/Mocks
            └── org/             # Analytics, Companies, Drives, ApplicantPipeline, Mocks, Students, Assessments
```
