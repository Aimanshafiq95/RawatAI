# RawatAI — Malaysia Public Healthcare Agentic AI

An AI-powered patient triage and hospital routing system built for the **Adaptive Malaysia Hackathon 2026**. Patients describe symptoms, upload a photo, and a 4-agent autonomous pipeline classifies urgency, predicts the likely condition, finds the nearest appropriate facility, and assigns a specialist — all without human intervention.

---

## Quick Start

### 1. Add your Groq API key

Create `.env.local` in the project root:
```
GROQ_API_KEY=your-groq-api-key-here
```
Get a free key at https://console.groq.com

### 2. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Demo Accounts

| Name            | Phone        | Password | Conditions              |
|-----------------|--------------|----------|-------------------------|
| Ahmad Razif     | 0123456789   | demo123  | Hypertension            |
| Siti Nurhaliza  | 0198765432   | demo123  | Type 2 Diabetes         |

> Doctor accounts have been removed. The system is fully autonomous — no doctor login required.

---

## Demo Flow

1. Visit http://localhost:3000 → click **Start Triage →**
2. Login with a demo patient account
3. On the **AI Health Assessment** page:
   - Type or **speak** your symptoms (voice input via Web Speech API)
   - Optionally upload a photo (injury, rash, prescription)
   - Select your city from the dropdown or use GPS
   - Toggle **EN / BM** for Bahasa Malaysia output
4. Click **Run AI Triage** — watch 4 agents process in real time:
   - Agent 1 → Vision (image analysis)
   - Agent 2 → Triage (urgency classification + disease prediction)
   - Agent 3 → Routing (nearest facility based on live capacity)
   - Agent 4 → Assignment (specialist matching)
5. Review results:
   - **Priority badge** — P1 Emergency / P2 Urgent / P3 Non-urgent
   - **Predicted condition** with department label and key symptoms
   - **Assigned specialist** card — Call Hospital button, Book Appointment with crowd bar
   - **Recommended hospital** with map, distance, and occupancy
   - **Surge auto-reroute** — if top hospital is CRITICAL, system auto-selects next best
6. Expand **AI Agent Technical Details** at the bottom to see the full agent reasoning log

---

## Agentic Pipeline

```
Patient Input (symptoms + photo + location)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Agent 1 — Vision Agent                             │
│  Model: LLaMA 4 Scout (multimodal)                  │
│  Input: base64 image + symptom text                 │
│  Output: clinical findings from image               │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Agent 2 — Triage Agent                             │
│  Model: LLaMA 3.1-8B-Instant (Groq)                 │
│  Input: symptoms + vision findings + medical history│
│  Output: priority (P1/P2/P3), predicted_disease,    │
│          department, key_symptoms, reasoning_steps  │
│  Rules: fever >2 days → P2 min; hypertension +      │
│         fever → P2 min; diabetes + fever → P2 min  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Agent 3 — Routing Agent                            │
│  Input: lat/lon + priority + ICU flag               │
│  Output: ranked facilities (Haversine + utilization)│
│  Data: 3,304 MoH facilities + 149 bed util rates   │
│  Surge: if top facility CRITICAL → auto re-route    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  Agent 4 — Assignment Agent                         │
│  Input: priority + key_symptoms + location          │
│  Output: matched specialist from virtual pool       │
│  Pool: 16 doctors, 9 specialties, across Malaysia  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
         Patient sees results + books appointment
```

---

## Key Features

| Feature | Details |
|---|---|
| Voice input | Web Speech API — speak symptoms in EN or BM |
| Bilingual | EN / BM toggle — AI output switches language |
| Disease prediction | AI returns `predicted_disease` + `department` |
| Surge detection | Auto-reroutes if top hospital is CRITICAL capacity |
| Book appointment | One-click booking with live hospital crowd bar |
| Patient-friendly loading | Plain-language progress steps, technical log hidden |
| Medical history context | Chronic conditions + medications fed into triage prompt |

---

## Project Structure

```
rawatai/   (project root)
├── app/
│   ├── page.tsx                  — Landing page
│   ├── login/page.tsx            — Patient login
│   ├── patient/
│   │   ├── dashboard/page.tsx    — Patient dashboard
│   │   ├── triage/page.tsx       — Main AI assessment page
│   │   └── history/page.tsx      — Past assessments
│   └── api/
│       ├── triage/route.ts       — LLaMA 3.1 triage + disease prediction
│       ├── vision/route.ts       — LLaMA 4 Scout image analysis
│       ├── routing/route.ts      — Facility scoring + surge detection
│       ├── assign/route.ts       — Specialist assignment
│       └── notify/route.ts       — Case persistence (in-memory)
├── lib/
│   ├── routing.ts                — Haversine distance + facility scoring
│   ├── doctors.ts                — Virtual specialist pool (16 doctors)
│   ├── locations.ts              — 29 Malaysian city coordinates
│   ├── session-store.ts          — globalThis in-memory store (HMR-safe)
│   └── demo-users.ts             — Demo patient accounts
├── components/
│   ├── PatientNav.tsx            — Sidebar navigation
│   └── FacilityMap.tsx           — Leaflet map component
└── public/
    └── logo.png                  — Malaysia coat of arms
```

---

## Datasets

> **Hosting note:** The `frontend/` folder is fully self-contained. All facility data has been pre-processed from the raw CSVs into `frontend/lib/facilities.json`, which is bundled with the Next.js app at build time. The `/datasets` folder contains the original source files for reference only — it is **not required** at runtime or for deployment.

| File | Location | Description |
|---|---|---|
| `facilities.json` | `lib/` | Pre-baked from CSVs — used by the app |
| `facilities_master.csv` | `datasets/` | 3,304 Malaysian government health facilities with GPS (source) |
| `bedutil_facility.csv`  | `datasets/` | 149 hospital bed utilization rates — MoH Malaysia (source) |
| `bedutil_state.csv`     | `datasets/` | State-level capacity baselines (source) |

Source: Ministry of Health Malaysia open data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + inline styles |
| AI — Triage | Groq API · LLaMA 3.1-8B-Instant |
| AI — Vision | Groq API · LLaMA 4 Scout (multimodal) |
| Routing | Haversine distance + MoH bed utilization data |
| State | In-memory Maps anchored to `globalThis` (no database) |
| Icons | react-icons/ri |
| Maps | Leaflet (via react-leaflet) |

---

## Architecture Notes

- **Self-contained for deployment** — only the `frontend/` directory needs to be deployed. All facility data is pre-baked into `frontend/lib/facilities.json`. The `/datasets` and `/agent-service` folders are not needed at runtime.
- **No database required** — all session state is held in `globalThis` Maps that survive Next.js HMR reloads in development.
- **No doctor interface** — the system is fully autonomous. The assignment agent replaces the manual doctor confirmation loop.
- **Bilingual AI** — the triage system prompt switches language based on the `lang` parameter (`en` / `bm`).
- **Surge resilience** — if the routing agent's top recommendation has `CRITICAL` capacity, it automatically promotes the next-best facility and shows a warning banner.

## Deploying to Vercel

```bash
vercel --prod
```

Add `GROQ_API_KEY` as an environment variable in your Vercel project settings. No root directory override needed — the Next.js app is at the repo root.
