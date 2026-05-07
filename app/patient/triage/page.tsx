"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import PatientNav from "@/components/PatientNav";
import type { Facility } from "@/lib/routing";
import { MALAYSIAN_LOCATIONS } from "@/lib/locations";
import {
  RiMapPinLine, RiStethoscopeLine,
  RiEyeLine, RiRouteLine, RiUserHeartLine, RiCheckLine,
  RiCloseLine, RiPhoneLine, RiArrowLeftLine,
  RiHospitalLine, RiMedicineBottleLine, RiShieldCrossLine,
  RiMicLine, RiMicOffLine, RiTranslate2,
  RiVirusFill, RiCalendarCheckLine, RiGroupLine,
  RiArrowRightLine, RiLoaderLine,
} from "react-icons/ri";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), { ssr: false });

type Priority = "P1" | "P2" | "P3";
type Lang = "en" | "bm";
type CardStep = "symptoms" | "questions" | "pain" | "location" | "loading" | "result" | "error";

interface AssignedDoctor {
  id: string; name: string; specialty: string;
  hospital: string; state: string;
  years_experience: number; languages: string[];
}
interface TriageResult {
  priority: Priority; summary: string;
  predicted_disease?: string; department?: string;
  key_symptoms: string[]; requires_icu: boolean;
  estimated_wait_minutes?: number;
  recommended?: Facility; alternatives?: Facility[];
  estimated_wait?: number; assigned_doctor?: AssignedDoctor;
  doctor_response_minutes?: number;
  pain_severity_factor?: "elevates" | "neutral";
  pain_score?: number; pain_location?: string;
}
interface FollowUpQuestion { text: string; options: string[]; }
interface CompletedCard { title: string; summary: string; }

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  P1: { label: "P1  KECEMASAN",    color: "#E02424", bg: "#FEF2F2", border: "#FECACA" },
  P2: { label: "P2  SEGERA",       color: "#1A56DB", bg: "#EFF6FF", border: "#BFDBFE" },
  P3: { label: "P3  TIDAK SEGERA", color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
};
const PRIORITY_LABEL_EN: Record<Priority, string> = {
  P1: "P1  EMERGENCY", P2: "P2  URGENT", P3: "P3  NON-URGENT",
};
const CAPACITY_STYLE: Record<string, { color: string; bg: string }> = {
  NORMAL:   { color: "#065F46", bg: "#D1FAE5" },
  MODERATE: { color: "#92400E", bg: "#FEF3C7" },
  BUSY:     { color: "#92400E", bg: "#FEF3C7" },
  CRITICAL: { color: "#E02424", bg: "#FEE2E2" },
  UNKNOWN:  { color: "#6B7280", bg: "#F3F4F6" },
};

const SYMPTOM_CHIPS = {
  common: ["Fever", "Cough", "Headache", "Fatigue", "Nausea", "Vomiting", "Diarrhoea", "Rash", "Sore Throat", "Body Aches"],
  serious: ["Chest Pain", "Difficulty Breathing", "Dizziness", "Blurred Vision", "Seizure", "Severe Abdominal Pain"],
};
const SYMPTOM_CHIPS_BM = {
  common: ["Demam", "Batuk", "Sakit Kepala", "Keletihan", "Loya", "Muntah", "Cirit-birit", "Ruam", "Sakit Tekak", "Sakit Badan"],
  serious: ["Sakit Dada", "Sukar Bernafas", "Pening", "Penglihatan Kabur", "Sawan", "Sakit Perut Teruk"],
};

const AGENT_LOGS: Record<string, string[]> = {
  triage: [
    "Loading triage model (LLaMA 3.1-8B, temperature=0)...",
    "Tokenising symptom description and follow-up answers...",
    "Loading patient medical history context...",
    "Applying chronic condition escalation rules...",
    "Evaluating P1 / P2 / P3 priority thresholds...",
    "Computing final urgency score...",
  ],
  routing: [
    "Loading facility dataset (3,304 Malaysian govt facilities)...",
    "Applying priority radius filter...",
    "Computing Haversine distances to all candidates...",
    "Reading live bed utilization rates...",
    "Applying capacity overlay from recent patient flow...",
    "Scoring facilities: distance × 0.4 + utilization × 0.6...",
    "Filtering CRITICAL capacity facilities...",
    "Ranking by composite score...",
  ],
  assign: [
    "Parsing key symptoms for specialty mapping...",
    "Loading specialist pool (16 doctors, 9 specialties)...",
    "Matching required specialty to patient condition...",
    "Filtering by geographic proximity to recommended facility...",
    "Checking state-level coverage...",
    "Confirming specialist availability...",
  ],
};

const AGENT_STEPS = [
  { key: "triage",  icon: RiStethoscopeLine, label: "Triage Agent",     sublabel: "Assessing symptoms & history" },
  { key: "routing", icon: RiRouteLine,        label: "Routing Agent",    sublabel: "Scanning nearby facilities" },
  { key: "assign",  icon: RiUserHeartLine,    label: "Assignment Agent", sublabel: "Matching specialist" },
];

declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }

// ── Agent log panel (collapsible, for demo/judges) ──────────────────────────
function AgentDetailPanel({ lang, agentLogs, logRef, currentAgent, activeAgents }: {
  lang: Lang; agentLogs: string[];
  logRef: React.RefObject<HTMLDivElement | null>;
  currentAgent: string; activeAgents: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F3F4F6", border: "none", borderRadius: "0.625rem", padding: "0.625rem 1rem", cursor: "pointer", fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 }}>
        <span>{lang === "bm" ? "Butiran Teknikal Ejen AI" : "AI Agent Technical Details"}</span>
        <span style={{ fontSize: "0.7rem", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: "0.375rem", background: "#0F172A", borderRadius: "0.625rem", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E02424" }} />
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FCD34D" }} />
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#34D399" }} />
            <span style={{ fontSize: "0.68rem", color: "#64748B", marginLeft: "0.375rem", fontFamily: "monospace" }}>rawatai — agent-pipeline</span>
          </div>
          <div ref={logRef} style={{ padding: "0.75rem 0.875rem", height: 240, overflowY: "auto", fontFamily: "'Courier New',monospace", fontSize: "0.7rem", lineHeight: 1.7 }}>
            {agentLogs.map((line, i) => {
              const color = line.startsWith("[SYSTEM") ? "#94A3B8" : line.startsWith("[TRIAGE") ? "#60A5FA" : line.startsWith("[ROUTING") ? "#34D399" : line.startsWith("[ASSIGN") ? "#FBBF24" : "#E2E8F0";
              return <div key={i} style={{ color, marginBottom: "0.05rem" }}><span style={{ opacity: 0.35 }}>{String(i + 1).padStart(3, " ")} </span>{line}</div>;
            })}
            {currentAgent && activeAgents[currentAgent] === "running" && (
              <div style={{ color: "#475569", animation: "blink 1s step-end infinite" }}>▋</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Completed card strip ─────────────────────────────────────────────────────
function CompletedStrip({ card }: { card: CompletedCard }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "0.875rem", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", animation: "slideUp 0.3s ease" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <RiCheckLine size={14} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.title}</div>
        <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.summary}</div>
      </div>
    </div>
  );
}

export default function TriagePage() {
  const [user, setUser]           = useState<any>(null);
  const [cardStep, setCardStep]   = useState<CardStep>("symptoms");
  const [lang, setLang]           = useState<Lang>("en");

  // Symptom card
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [freeText, setFreeText]   = useState("");
  const [isListening, setIsListening] = useState(false);

  // Questions card
  const [followUpQs, setFollowUpQs]   = useState<FollowUpQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers]         = useState<string[]>([]);

  // Pain card (NRS 0–10)
  const [painScore, setPainScore]     = useState(0);
  const [painLocation, setPainLocation] = useState<string>("");
  const [loadingQs, setLoadingQs]     = useState(false);

  // Location card
  const [location, setLocation]     = useState<{ lat: number; lon: number } | null>(null);
  const [locLabel, setLocLabel]     = useState("");
  const [locMode, setLocMode]       = useState<"dropdown" | "gps">("dropdown");
  const [selectedCity, setSelectedCity] = useState("");

  // Result
  const [result, setResult]         = useState<TriageResult | null>(null);
  const [triageError, setTriageError] = useState("");
  const [surgeWarning, setSurgeWarning] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Agent pipeline
  const [activeAgents, setActiveAgents] = useState<Record<string, "idle" | "running" | "done">>({});
  const [agentLogs, setAgentLogs]       = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState("");

  // Completed card stack
  const [completedCards, setCompletedCards] = useState<CompletedCard[]>([]);

  const logRef    = useRef<HTMLDivElement>(null);
  const speechRef = useRef<any>(null);
  const logTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const u = localStorage.getItem("demo_user");
    if (!u) { window.location.href = "/login"; return; }
    setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLogs]);

  // ── helpers ────────────────────────────────────────────────────────────────
  function appendLog(line: string) { setAgentLogs((p) => [...p, line]); }

  function streamLogs(agentKey: string) {
    const lines = AGENT_LOGS[agentKey] ?? [];
    logTimers.current.forEach(clearTimeout);
    logTimers.current = [];
    lines.forEach((line, i) => {
      const t = setTimeout(() => appendLog(`[${agentKey.toUpperCase().padEnd(7)}] ${line}`), i * 320);
      logTimers.current.push(t);
    });
    return lines.length * 320 + 200;
  }

  function setAgent(key: string, status: "idle" | "running" | "done") {
    setActiveAgents((p) => ({ ...p, [key]: status }));
    if (status === "running") setCurrentAgent(key);
  }

  function pushCompleted(title: string, summary: string) {
    setCompletedCards((p) => [...p, { title, summary }]);
  }

  // ── Voice ──────────────────────────────────────────────────────────────────
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome."); return; }
    if (isListening) { speechRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang = lang === "bm" ? "ms-MY" : "en-US";
    rec.continuous = false; rec.interimResults = true;
    speechRef.current = rec; setIsListening(true);
    rec.onresult = (e: any) => setFreeText(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
  }

  // ── Symptom chip toggle ────────────────────────────────────────────────────
  function toggleSymptom(s: string) {
    setSelectedSymptoms((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }

  // ── Step: Symptoms → Questions ─────────────────────────────────────────────
  async function submitSymptoms() {
    const allSymptoms = [...selectedSymptoms, ...(freeText.trim() ? [freeText.trim()] : [])];
    if (!allSymptoms.length) return;
    const summary = allSymptoms.slice(0, 4).join(", ") + (allSymptoms.length > 4 ? ` +${allSymptoms.length - 4}` : "");
    pushCompleted(lang === "bm" ? "Gejala" : "Symptoms", summary);
    setLoadingQs(true);
    setCardStep("questions");
    try {
      const res = await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symptoms: allSymptoms, lang, history: user?.history ?? {} }) });
      const data = await res.json();
      setFollowUpQs(data.questions ?? []);
    } catch {
      setFollowUpQs([]);
    }
    setLoadingQs(false);
  }

  // ── Step: Answer question ──────────────────────────────────────────────────
  function answerQuestion(option: string) {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    if (currentQIdx < followUpQs.length - 1) {
      setCurrentQIdx((i) => i + 1);
    } else {
      const summaryParts = newAnswers.map((a, i) => `${followUpQs[i]?.text.split("?")[0]}: ${a}`);
      pushCompleted(lang === "bm" ? "Maklumat Lanjut" : "Follow-up", summaryParts[0] ?? option);
      setCardStep("pain");
    }
  }

  function submitPain() {
    if (painScore > 0) {
      const loc = painLocation ? ` · ${painLocation}` : "";
      pushCompleted(lang === "bm" ? "Skor Sakit" : "Pain Score", `${painScore}/10${loc}`);
    } else {
      pushCompleted(lang === "bm" ? "Skor Sakit" : "Pain Score", lang === "bm" ? "Tiada sakit" : "No pain");
    }
    setCardStep("location");
  }

  // ── Step: Location → run triage ────────────────────────────────────────────
  function detectLocation() {
    setLocMode("gps"); setLocLabel(lang === "bm" ? "Mengesan…" : "Detecting…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocLabel(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`); },
      () => { setLocation({ lat: 3.139, lon: 101.6869 }); setLocLabel("Kuala Lumpur (fallback)"); }
    );
  }

  async function submitLocation() {
    if (!location) return;
    pushCompleted(lang === "bm" ? "Lokasi" : "Location", locLabel);
    await runTriage();
  }

  // ── Main pipeline ──────────────────────────────────────────────────────────
  async function runTriage() {
    const allSymptoms = [...selectedSymptoms, ...(freeText.trim() ? [freeText.trim()] : [])];
    const symptomsText = allSymptoms.join(", ");
    setCardStep("loading");
    setActiveAgents({});
    setAgentLogs([]);
    setSurgeWarning(null);
    const sid = `sess-${Date.now()}`;

    try {
      appendLog("[SYSTEM ] Starting autonomous agent pipeline...");
      appendLog("[SYSTEM ] Session: " + sid);

      // AGENT 1: Triage
      setAgent("triage", "running");
      await new Promise((r) => setTimeout(r, 200));
      const triageWait = streamLogs("triage");
      await new Promise((r) => setTimeout(r, triageWait));

      const tRes = await fetch("/api/triage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptomsText,
          history: user?.history ?? {},
          session_id: sid,
          lang,
          answers,
          questions: followUpQs,
          pain_score: painScore,
          pain_location: painLocation || undefined,
        }),
      });
      if (!tRes.ok) { const e = await tRes.json().catch(() => ({})); throw new Error(e.error ?? `Triage failed (${tRes.status})`); }
      const tData = await tRes.json();
      appendLog(`[TRIAGE ] Priority determined: ${tData.priority}`);
      if (tData.reasoning_steps?.length) tData.reasoning_steps.forEach((s: string) => appendLog(`[TRIAGE ] → ${s}`));
      appendLog(`[TRIAGE ] Key symptoms: ${(tData.key_symptoms ?? []).join(", ")}`);
      setAgent("triage", "done");

      // AGENT 2: Routing
      setAgent("routing", "running");
      await new Promise((r) => setTimeout(r, 200));
      const routeWait = streamLogs("routing");
      await new Promise((r) => setTimeout(r, routeWait));

      const rRes = await fetch("/api/routing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: location!.lat, lon: location!.lon, priority: tData.priority, requires_icu: tData.requires_icu }),
      });
      const rData = await rRes.json();
      if (rData.recommended) {
        appendLog(`[ROUTING] Best match: ${rData.recommended.name}`);
        appendLog(`[ROUTING] Distance: ${rData.recommended.distance_km} km | Occupancy: ${rData.recommended.util_nonicu !== null ? Math.round(rData.recommended.util_nonicu) + "%" : "N/A"} | Status: ${rData.recommended.capacity_status}`);
        if (rData.recommended.capacity_status === "CRITICAL") {
          appendLog(`[ROUTING] ⚠ SURGE DETECTED at ${rData.recommended.name} — re-routing...`);
          setSurgeWarning(`Surge detected at ${rData.recommended.name} (CRITICAL). Auto-rerouted to ${rData.alternatives?.[0]?.name ?? "next available"}.`);
          rData.recommended = rData.alternatives?.[0] ?? rData.recommended;
        }
      }
      setAgent("routing", "done");

      // AGENT 3: Assignment
      setAgent("assign", "running");
      await new Promise((r) => setTimeout(r, 200));
      const assignWait = streamLogs("assign");
      await new Promise((r) => setTimeout(r, assignWait));

      const aRes = await fetch("/api/assign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: tData.priority, key_symptoms: tData.key_symptoms ?? [], requires_icu: tData.requires_icu ?? false, lat: location!.lat, lon: location!.lon, facility_state: rData.recommended?.state ?? undefined }),
      });
      const aData = await aRes.json();
      appendLog(`[ASSIGN ] Specialty required: ${aData.specialty}`);
      appendLog(`[ASSIGN ] Assigned: ${aData.doctor?.name} — ${aData.doctor?.specialty}, ${aData.doctor?.hospital}`);
      appendLog("[SYSTEM ] Pipeline complete ✓");
      setAgent("assign", "done");

      await fetch("/api/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, patient_name: user?.name, priority: tData.priority, summary: tData.summary, symptoms: symptomsText, facility_name: rData.recommended?.name ?? "", doctor_name: aData.doctor?.name ?? "", doctor_specialty: aData.doctor?.specialty ?? "" }),
      });

      setResult({
        ...tData,
        recommended: rData.recommended,
        alternatives: rData.alternatives ?? [],
        estimated_wait: tData.estimated_wait_minutes ?? rData.recommended?.estimated_wait ?? (tData.priority === "P1" ? 5 : tData.priority === "P2" ? 20 : 45),
        assigned_doctor: aData.doctor,
        doctor_response_minutes: aData.estimated_response_minutes,
        pain_score: painScore,
        pain_location: painLocation || undefined,
      });
      await new Promise((r) => setTimeout(r, 600));
      setCardStep("result");
    } catch (err: any) {
      setTriageError(err.message ?? "Something went wrong.");
      setCardStep("error");
    }
  }

  function reset() {
    setCardStep("symptoms"); setResult(null); setTriageError("");
    setActiveAgents({}); setAgentLogs([]); setSurgeWarning(null); setCurrentAgent("");
    setBookingConfirmed(false); setSelectedSymptoms([]); setFreeText("");
    setFollowUpQs([]); setCurrentQIdx(0); setAnswers([]);
    setPainScore(0); setPainLocation("");
    setLocation(null); setLocLabel(""); setSelectedCity(""); setLocMode("dropdown");
    setCompletedCards([]);
    logTimers.current.forEach(clearTimeout);
  }

  if (!user) return null;
  const pc = result ? PRIORITY_CONFIG[result.priority] : null;
  const chips = lang === "bm" ? SYMPTOM_CHIPS_BM : SYMPTOM_CHIPS;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9" }}>
      <PatientNav user={user} />
      <main className="page-main" style={{ display: "flex", flexDirection: "column", gap: "0" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
              {lang === "bm" ? "Penilaian Kesihatan AI" : "AI Health Assessment"}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
              {lang === "bm" ? "Jawab beberapa soalan untuk mendapatkan panduan penjagaan yang tepat." : "Answer a few questions to get directed to the right care."}
            </p>
          </div>
          {/* Language toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#F3F4F6", borderRadius: 9999, padding: "0.25rem" }}>
            <RiTranslate2 size={16} color="#6B7280" style={{ marginLeft: "0.5rem" }} />
            {(["en", "bm"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: "0.3rem 0.875rem", borderRadius: 9999, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", background: lang === l ? "#1A56DB" : "transparent", color: lang === l ? "#fff" : "#6B7280", transition: "all 0.15s" }}>
                {l === "en" ? "EN" : "BM"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stacked card area ──────────────────────────────────────────────── */}
        {(cardStep === "symptoms" || cardStep === "questions" || cardStep === "pain" || cardStep === "location") && (
          <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start", width: "100%" }}>

          {/* LEFT: card stack */}
          <div style={{ flex: "0 0 auto", width: "min(560px, 100%)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>

            {/* Completed card strips */}
            {completedCards.map((card, i) => <CompletedStrip key={i} card={card} />)}

            {/* ── ACTIVE: Symptoms ── */}
            {cardStep === "symptoms" && (
              <div className="card" style={{ animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2)", padding: "1.75rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                  {lang === "bm" ? "Langkah 1" : "Step 1"}
                </div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
                  {lang === "bm" ? "Apa yang anda rasa hari ini?" : "What are you feeling today?"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.5rem" }}>
                  {lang === "bm" ? "Pilih semua yang berkenaan atau sebut/taip gejala anda." : "Select all that apply, or speak / type your symptoms."}
                </p>

                {/* Serious symptoms */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#E02424", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    {lang === "bm" ? "Gejala Serius" : "Serious symptoms"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {chips.serious.map((s) => {
                      const active = selectedSymptoms.includes(s);
                      return (
                        <button key={s} onClick={() => toggleSymptom(s)}
                          style={{ padding: "0.4rem 0.875rem", borderRadius: 9999, border: `1.5px solid ${active ? "#E02424" : "#FECACA"}`, background: active ? "#FEF2F2" : "#fff", color: active ? "#E02424" : "#9CA3AF", fontWeight: active ? 700 : 400, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {active && <RiCheckLine size={12} />}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Common symptoms */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                    {lang === "bm" ? "Gejala Biasa" : "Common symptoms"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {chips.common.map((s) => {
                      const active = selectedSymptoms.includes(s);
                      return (
                        <button key={s} onClick={() => toggleSymptom(s)}
                          style={{ padding: "0.4rem 0.875rem", borderRadius: 9999, border: `1.5px solid ${active ? "#1A56DB" : "#E5E7EB"}`, background: active ? "#EFF6FF" : "#fff", color: active ? "#1A56DB" : "#374151", fontWeight: active ? 700 : 400, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {active && <RiCheckLine size={12} />}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice + free text */}
                <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <button onClick={toggleVoice}
                    style={{ flexShrink: 0, width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer", background: isListening ? "#FEE2E2" : "#F3F4F6", color: isListening ? "#E02424" : "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", animation: isListening ? "pulse 1s ease-in-out infinite" : "none" }}>
                    {isListening ? <RiMicOffLine size={18} /> : <RiMicLine size={18} />}
                  </button>
                  <textarea rows={2} value={freeText} onChange={(e) => setFreeText(e.target.value)}
                    placeholder={lang === "bm" ? "Atau taip gejala lain di sini…" : "Or type any other symptoms here…"}
                    style={{ flex: 1, resize: "none", fontSize: "0.875rem" }} />
                </div>

                <button onClick={submitSymptoms}
                  disabled={!selectedSymptoms.length && !freeText.trim()}
                  style={{ width: "100%", padding: "0.875rem", background: "#1A56DB", color: "#fff", border: "none", borderRadius: "0.625rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: (!selectedSymptoms.length && !freeText.trim()) ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  {lang === "bm" ? "Seterusnya" : "Continue"} <RiArrowRightLine size={18} />
                </button>
              </div>
            )}

            {/* ── ACTIVE: Follow-up Questions ── */}
            {cardStep === "questions" && (
              <div className="card" style={{ animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2)", padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {lang === "bm" ? "Langkah 2" : "Step 2"}
                  </div>
                  {!loadingQs && followUpQs.length > 0 && (
                    <div style={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 600 }}>
                      {lang === "bm" ? `Soalan ${currentQIdx + 1} daripada ${followUpQs.length}` : `Question ${currentQIdx + 1} of ${followUpQs.length}`}
                    </div>
                  )}
                </div>

                {loadingQs ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "2rem 0" }}>
                    <RiLoaderLine size={22} color="#1A56DB" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "0.9rem", color: "#6B7280" }}>{lang === "bm" ? "AI sedang menyediakan soalan…" : "AI is preparing questions…"}</span>
                  </div>
                ) : followUpQs.length === 0 ? (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "#6B7280", marginBottom: "1rem" }}>
                      {lang === "bm" ? "Tiada soalan tambahan diperlukan." : "No follow-up questions needed."}
                    </p>
                    <button onClick={() => { pushCompleted(lang === "bm" ? "Maklumat Lanjut" : "Follow-up", lang === "bm" ? "Tiada soalan" : "No questions needed"); setCardStep("pain"); }}
                      style={{ padding: "0.75rem 1.5rem", background: "#1A56DB", color: "#fff", border: "none", borderRadius: "0.625rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {lang === "bm" ? "Seterusnya" : "Continue"} <RiArrowRightLine size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Previous answers summary */}
                    {answers.length > 0 && (
                      <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {answers.map((ans, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem" }}>
                            <span style={{ color: "#9CA3AF", flexShrink: 0 }}>{followUpQs[i]?.text}</span>
                            <span style={{ fontWeight: 700, color: "#1A56DB" }}>→ {ans}</span>
                          </div>
                        ))}
                        <div style={{ height: 1, background: "#F3F4F6", marginTop: "0.5rem" }} />
                      </div>
                    )}

                    {/* Current question */}
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                      {followUpQs[currentQIdx]?.text}
                    </h2>

                    {/* Option buttons — full width, Claude-style */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {followUpQs[currentQIdx]?.options.map((opt) => (
                        <button key={opt} onClick={() => answerQuestion(opt)}
                          style={{ width: "100%", padding: "0.875rem 1.25rem", textAlign: "left", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: "0.75rem", cursor: "pointer", fontSize: "0.9rem", color: "#111827", fontWeight: 500, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{opt}</span>
                          <RiArrowRightLine size={15} color="#9CA3AF" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE: Pain Score (NRS 0–10) ── */}
            {cardStep === "pain" && (
              <div className="card" style={{ animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2)", padding: "1.75rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                  {lang === "bm" ? "Langkah 3" : "Step 3"}
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
                  {lang === "bm" ? "Skor kesakitan anda?" : "How bad is the pain?"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.25rem" }}>
                  {lang === "bm" ? "0 = tiada sakit, 10 = paling teruk" : "0 = no pain, 10 = worst possible"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
                  <input type="range" min={0} max={10} step={1} value={painScore}
                    onChange={(e) => setPainScore(Number(e.target.value))}
                    style={{ flex: 1, accentColor: painScore >= 8 ? "#E02424" : painScore >= 4 ? "#D97706" : painScore > 0 ? "#1A56DB" : "#9CA3AF" }} />
                  <div style={{ minWidth: 64, textAlign: "center", padding: "0.4rem 0.625rem", borderRadius: "0.5rem", fontWeight: 700, fontSize: "1rem",
                    background: painScore >= 8 ? "#FEE2E2" : painScore >= 4 ? "#FEF3C7" : painScore > 0 ? "#EFF6FF" : "#F3F4F6",
                    color:      painScore >= 8 ? "#E02424" : painScore >= 4 ? "#92400E" : painScore > 0 ? "#1A56DB" : "#6B7280" }}>
                    {painScore}/10
                  </div>
                </div>
                {painScore > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: "0.5rem" }}>
                      {lang === "bm" ? "Lokasi sakit (pilihan)" : "Pain location (optional)"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {(["chest","abdomen","head","back","limb","other"] as const).map((loc) => {
                        const labels: Record<string, { en: string; bm: string }> = {
                          chest:   { en: "Chest",   bm: "Dada" },
                          abdomen: { en: "Abdomen", bm: "Perut" },
                          head:    { en: "Head",    bm: "Kepala" },
                          back:    { en: "Back",    bm: "Belakang" },
                          limb:    { en: "Limb",    bm: "Anggota" },
                          other:   { en: "Other",   bm: "Lain" },
                        };
                        const active = painLocation === loc;
                        return (
                          <button key={loc} type="button" onClick={() => setPainLocation(active ? "" : loc)}
                            style={{ padding: "0.4rem 0.85rem", borderRadius: 9999, border: active ? "1.5px solid #1A56DB" : "1px solid #E5E7EB",
                              background: active ? "#EFF6FF" : "#fff", color: active ? "#1A56DB" : "#374151",
                              cursor: "pointer", fontSize: "0.82rem", fontWeight: active ? 600 : 500 }}>
                            {labels[loc][lang]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { setPainScore(0); setPainLocation(""); submitPain(); }}
                    style={{ padding: "0.7rem 1.1rem", background: "#fff", color: "#374151", border: "1px solid #E5E7EB", borderRadius: "0.625rem", fontWeight: 600, cursor: "pointer" }}>
                    {lang === "bm" ? "Tiada Sakit" : "No Pain"}
                  </button>
                  <button type="button" onClick={submitPain}
                    style={{ padding: "0.7rem 1.25rem", background: "#1A56DB", color: "#fff", border: "none", borderRadius: "0.625rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {lang === "bm" ? "Seterusnya" : "Continue"} <RiArrowRightLine size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── ACTIVE: Location ── */}
            {cardStep === "location" && (
              <div className="card" style={{ animation: "slideUp 0.35s cubic-bezier(.22,.68,0,1.2)", padding: "1.75rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>
                  {lang === "bm" ? "Langkah 4" : "Step 4"}
                </div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
                  {lang === "bm" ? "Di mana anda sekarang?" : "Where are you located?"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.5rem" }}>
                  {lang === "bm" ? "Kami akan mencari hospital atau klinik yang paling sesuai berdekatan anda." : "We'll find the most suitable hospital or clinic near you."}
                </p>

                {/* Mode toggle */}
                <div style={{ display: "flex", background: "#F3F4F6", borderRadius: "0.5rem", padding: "0.2rem", marginBottom: "1rem", width: "fit-content" }}>
                  {(["dropdown", "gps"] as const).map((mode) => (
                    <button key={mode} onClick={() => setLocMode(mode)}
                      style={{ fontSize: "0.78rem", fontWeight: 600, padding: "0.35rem 0.875rem", borderRadius: "0.375rem", border: "none", cursor: "pointer", background: locMode === mode ? "#fff" : "transparent", color: locMode === mode ? "#1A56DB" : "#6B7280", boxShadow: locMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                      {mode === "dropdown" ? (lang === "bm" ? "Pilih Bandar" : "Select City") : "GPS"}
                    </button>
                  ))}
                </div>

                {locMode === "dropdown" ? (
                  <select value={selectedCity} onChange={(e) => { const val = e.target.value; setSelectedCity(val); if (val) { const f = MALAYSIAN_LOCATIONS.find((l) => l.label === val); if (f) { setLocation({ lat: f.lat, lon: f.lon }); setLocLabel(`${f.label}, ${f.state}`); } } else { setLocation(null); setLocLabel(""); } }}
                    style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #E5E7EB", borderRadius: "0.625rem", fontSize: "0.875rem", background: "#fff", color: "#111827", marginBottom: "1.25rem", cursor: "pointer" }}>
                    <option value="">{lang === "bm" ? "— Pilih bandar anda —" : "— Select your city —"}</option>
                    {MALAYSIAN_LOCATIONS.map((loc) => <option key={loc.label} value={loc.label}>{loc.label} ({loc.state})</option>)}
                  </select>
                ) : (
                  <button onClick={detectLocation}
                    style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #BFDBFE", borderRadius: "0.625rem", background: "#EFF6FF", color: "#1A56DB", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    <RiMapPinLine size={17} />
                    {locLabel && locMode === "gps" ? locLabel : (lang === "bm" ? "Kesan Lokasi GPS" : "Detect my GPS location")}
                  </button>
                )}

                {locLabel && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#059669", fontWeight: 600, marginBottom: "1.25rem" }}>
                    <RiCheckLine size={14} /> {locLabel}
                  </div>
                )}

                <button onClick={submitLocation} disabled={!location}
                  style={{ width: "100%", padding: "0.875rem", background: "#1A56DB", color: "#fff", border: "none", borderRadius: "0.625rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: !location ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  <RiStethoscopeLine size={18} />
                  {lang === "bm" ? "Mulakan Penilaian AI" : "Start AI Assessment"}
                </button>
              </div>
            )}
          </div>
          {/* LEFT card stack end */}

          {/* RIGHT: illustration panel (hidden on mobile) */}
          <div className="triage-illustration-panel">
            <div style={{ textAlign: "center" }}>
              <img
                src="/sick-illustration.png"
                alt="Feeling sick illustration"
                style={{ width: "100%", maxWidth: 320, objectFit: "contain", marginBottom: "1.75rem", filter: "drop-shadow(0 8px 32px rgba(26,86,219,0.10))" }}
              />
              <h2 className="font-heading" style={{ fontSize: "1.35rem", color: "#111827", lineHeight: 1.35, marginBottom: "0.75rem" }}>
                {lang === "bm"
                  ? "Tidak sihat?\nAnda di tempat yang betul."
                  : "Not feeling well?\nYou're in the right place."}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.75, maxWidth: 280, margin: "0 auto 1.75rem" }}>
                {lang === "bm"
                  ? "Huraikan gejala anda dan biarkan empat ejen AI kami menilai kecemasan serta mencari kemudahan terdekat dalam masa 10 saat."
                  : "Describe your symptoms and let our four AI agents assess urgency and find the nearest facility — in under 10 seconds."}
              </p>
              {/* Step progress */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                {(["symptoms", "questions", "pain", "location"] as const).map((s, i) => {
                  const stepOrder = { symptoms: 0, questions: 1, pain: 2, location: 3 };
                  const currentOrder = stepOrder[cardStep as keyof typeof stepOrder] ?? 0;
                  const done = i < currentOrder;
                  const active = i === currentOrder;
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{
                        width: active ? 28 : 24, height: active ? 28 : 24,
                        borderRadius: "50%",
                        background: done ? "#059669" : active ? "#1A56DB" : "#E5E7EB",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s",
                        flexShrink: 0,
                      }}>
                        {done
                          ? <RiCheckLine size={13} color="#fff" />
                          : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: active ? "#fff" : "#9CA3AF" }}>{i + 1}</span>
                        }
                      </div>
                      {i < 3 && <div style={{ width: 28, height: 2, background: done ? "#059669" : "#E5E7EB", borderRadius: 1, transition: "background 0.3s" }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {cardStep === "symptoms" ? (lang === "bm" ? "Langkah 1 daripada 4" : "Step 1 of 4")
                  : cardStep === "questions" ? (lang === "bm" ? "Langkah 2 daripada 4" : "Step 2 of 4")
                  : cardStep === "pain" ? (lang === "bm" ? "Langkah 3 daripada 4" : "Step 3 of 4")
                  : (lang === "bm" ? "Langkah 4 daripada 4" : "Step 4 of 4")}
              </div>
            </div>
          </div>

          </div> 
        )}

        {/* ── LOADING ── */}
        {cardStep === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card" style={{ maxWidth: 560, margin: "0 auto", width: "100%", textAlign: "center", padding: "2.5rem 2rem" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", border: "2px solid #1A56DB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", animation: "spin 1.5s linear infinite" }}>
                <RiStethoscopeLine size={28} color="#1A56DB" />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
                {lang === "bm" ? "Sedang menilai kesihatan anda…" : "Assessing your health…"}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "2rem", lineHeight: 1.6 }}>
                {lang === "bm" ? "AI kami sedang memeriksa gejala anda dan mencari penjagaan yang sesuai." : "Our AI is reviewing your symptoms and finding the right care near you."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                {AGENT_STEPS.map((agent) => {
                  const LABELS: Record<string, { en: string; bm: string }> = {
                    triage:  { en: "Checking your symptoms…",        bm: "Memeriksa gejala anda…" },
                    routing: { en: "Finding the nearest hospital…",  bm: "Mencari hospital terdekat…" },
                    assign:  { en: "Matching you with a specialist…", bm: "Mencarikan pakar untuk anda…" },
                  };
                  const status = activeAgents[agent.key] ?? "idle";
                  const isRunning = status === "running"; const isDone = status === "done";
                  const label = LABELS[agent.key]?.[lang] ?? agent.sublabel;
                  return (
                    <div key={agent.key} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.625rem 0.875rem", borderRadius: "0.625rem", background: isDone ? "#F0FDF4" : isRunning ? "#EFF6FF" : "#F9FAFB", transition: "background 0.3s" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "#059669" : isRunning ? "#1A56DB" : "#E5E7EB", animation: isRunning ? "spin 1.5s linear infinite" : "none" }}>
                        {isDone ? <RiCheckLine size={14} color="#fff" /> : <agent.icon size={13} color={isRunning ? "#fff" : "#9CA3AF"} />}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: isRunning ? 600 : 400, color: isDone ? "#059669" : isRunning ? "#1A56DB" : "#9CA3AF" }}>
                        {isDone ? label.replace("…", "") + (lang === "bm" ? " — selesai" : " — done") : label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1.75rem" }}>
                {lang === "bm" ? "Ini mengambil masa 10–20 saat." : "This usually takes 10–20 seconds."}
              </p>
            </div>
            <AgentDetailPanel lang={lang} agentLogs={agentLogs} logRef={logRef} currentAgent={currentAgent} activeAgents={activeAgents} />
          </div>
        )}

        {/* ── ERROR ── */}
        {cardStep === "error" && (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <RiCloseLine size={24} color="#E02424" />
              </div>
              <h2 className="font-heading" style={{ color: "#E02424", marginBottom: "0.75rem" }}>Assessment Failed</h2>
              <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.7, marginBottom: "1.5rem" }}>{triageError}</p>
              <button className="btn-primary" onClick={reset}>Try Again</button>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {cardStep === "result" && result && pc && (() => {
          const crowd = result.recommended?.util_nonicu ?? null;
          const crowdPct = crowd !== null ? Math.round(crowd) : null;
          const crowdColor = crowd === null ? "#9CA3AF" : crowd < 60 ? "#059669" : crowd < 80 ? "#D97706" : "#E02424";
          const crowdLabel = crowd === null ? "Unknown" : crowd < 60 ? (lang === "bm" ? "Tidak Sesak" : "Not busy") : crowd < 80 ? (lang === "bm" ? "Sederhana" : "Moderate") : (lang === "bm" ? "Sesak" : "Busy");
          const hospitalPhone = result.recommended?.phone ?? null;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {surgeWarning && (
                <div style={{ background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: "0.75rem", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <RiShieldCrossLine size={18} color="#D97706" />
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.15rem" }}>{lang === "bm" ? "Laluan Auto-Ubah" : "Surge Auto-Rerouted"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#92400E" }}>{surgeWarning}</div>
                  </div>
                </div>
              )}

              {/* Priority banner */}
              <div style={{ background: pc.bg, border: `1.5px solid ${pc.border}`, borderRadius: "0.875rem", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span className="font-heading" style={{ fontSize: "1.35rem", color: pc.color }}>
                    {lang === "en" ? PRIORITY_LABEL_EN[result.priority] : PRIORITY_CONFIG[result.priority].label}
                  </span>
                  {typeof result.pain_score === "number" && result.pain_score > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.625rem", borderRadius: 9999, background: "#fff", border: `1px solid ${pc.border}`, fontSize: "0.78rem", fontWeight: 700, color: pc.color }}>
                      {lang === "bm" ? "Sakit" : "Pain"} {result.pain_score}/10
                      {result.pain_location && <span style={{ color: "#6B7280", fontWeight: 500 }}>· {result.pain_location}</span>}
                      {result.pain_severity_factor === "elevates" && (
                        <span title={lang === "bm" ? "Sakit menaikkan keutamaan" : "Pain elevated priority"} style={{ marginLeft: "0.25rem", fontSize: "0.7rem" }}>↑</span>
                      )}
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "0.875rem", color: "#374151", marginTop: "0.4rem", lineHeight: 1.65 }}>{result.summary}</p>
              </div>

              {/* Disease prediction */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: pc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RiVirusFill size={18} color={pc.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lang === "bm" ? "Penyakit Dijangka" : "Predicted Condition"}</div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", lineHeight: 1.2 }}>{result.predicted_disease ?? "Under assessment"}</div>
                  </div>
                </div>
                {result.department && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: pc.bg, color: pc.color, padding: "0.25rem 0.75rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.875rem" }}>
                    <RiHospitalLine size={13} />{result.department}
                  </div>
                )}
                {result.key_symptoms?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{lang === "bm" ? "Gejala Utama" : "Key Symptoms"}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {result.key_symptoms.map((s) => <span key={s} style={{ background: "#F3F4F6", color: "#374151", padding: "0.2rem 0.625rem", borderRadius: 9999, fontSize: "0.78rem" }}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Specialist */}
              {result.assigned_doctor && (
                <div className="card" style={{ borderLeft: `4px solid ${pc.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: pc.bg, border: `2px solid ${pc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <RiUserHeartLine size={28} color={pc.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{lang === "bm" ? "Pakar Ditugaskan" : "Assigned Specialist"}</div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>{result.assigned_doctor.name}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem", marginBottom: "0.3rem", background: pc.bg, color: pc.color, padding: "0.2rem 0.625rem", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700 }}>
                          <RiStethoscopeLine size={12} />{result.department ?? result.assigned_doctor.specialty}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#6B7280" }}>
                          <RiMapPinLine size={13} color="#1A56DB" />
                          <span style={{ color: "#374151", fontWeight: 500 }}>{result.assigned_doctor.hospital}</span>
                          <span style={{ color: "#D1D5DB" }}>·</span>
                          <span>{result.assigned_doctor.state}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                          {result.assigned_doctor.years_experience} {lang === "bm" ? "thn pengalaman" : "yrs experience"} &nbsp;·&nbsp; {result.assigned_doctor.languages.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", alignItems: "flex-end", minWidth: "min(180px, 100%)" }}>
                      <a href={hospitalPhone ? `tel:${hospitalPhone}` : "tel:+60322999999"}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#059669", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }}>
                        <RiPhoneLine size={15} />{lang === "bm" ? "Hubungi Hospital" : "Call Hospital"}
                      </a>
                      {bookingConfirmed ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>
                          <RiCheckLine size={15} />{lang === "bm" ? "Janji Temu Ditempah" : "Appointment Booked!"}
                        </div>
                      ) : (
                        <button onClick={() => setBookingConfirmed(true)}
                          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#1A56DB", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                          <RiCalendarCheckLine size={15} />{lang === "bm" ? "Buat Temujanji" : "Book Appointment"}
                        </button>
                      )}
                      {crowdPct !== null && (
                        <div style={{ width: "100%", minWidth: 180 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "#6B7280", fontWeight: 600 }}>
                              <RiGroupLine size={12} />{lang === "bm" ? "Kesesakan Hospital" : "Hospital Crowd"}
                            </div>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: crowdColor }}>{crowdLabel} · {crowdPct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 9999, background: "#F3F4F6", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${crowdPct}%`, background: crowdColor, borderRadius: 9999, transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", background: pc.bg, borderRadius: "0.5rem", padding: "0.5rem 0.875rem", fontSize: "0.75rem", color: pc.color, fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <RiShieldCrossLine size={12} />
                    {lang === "bm" ? `${result.assigned_doctor.name} telah ditugaskan secara automatik berdasarkan keadaan, lokasi dan kepakaran anda.` : `${result.assigned_doctor.name} has been automatically assigned based on your condition, location and specialist availability.`}
                  </div>
                </div>
              )}

              {/* Recommended facility */}
              {result.recommended && (
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                      {lang === "bm" ? "Fasiliti Disyorkan" : "Recommended"} {result.recommended.facility_type === "hospital" ? "Hospital" : "Klinik Kesihatan"}
                    </h3>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: CAPACITY_STYLE[result.recommended.capacity_status]?.color ?? "#6B7280", fontWeight: 600 }}>
                      {result.recommended.facility_type === "hospital" ? <RiHospitalLine size={14} /> : <RiMedicineBottleLine size={14} />}
                      {result.recommended.capacity_status}
                    </span>
                  </div>
                  <div className="grid-facility-detail">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: "0.2rem" }}>{result.recommended.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "#6B7280", marginBottom: "0.125rem" }}>
                        <RiMapPinLine size={13} color="#1A56DB" />{result.recommended.address}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: "0.875rem", paddingLeft: "1.1rem" }}>{result.recommended.district}, {result.recommended.state}</div>
                      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.875rem" }}>
                        <div>
                          <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lang === "bm" ? "Jarak" : "Distance"}</div>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>{result.recommended.distance_km} km</div>
                        </div>
                        {result.recommended.util_nonicu !== null && (
                          <div>
                            <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lang === "bm" ? "Penghunian" : "Occupancy"}</div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: CAPACITY_STYLE[result.recommended.capacity_status]?.color ?? "#111827" }}>{Math.round(result.recommended.util_nonicu!)}%</div>
                          </div>
                        )}
                      </div>
                      {result.recommended.phone && (
                        <a href={`tel:${result.recommended.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#1A56DB", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
                          <RiPhoneLine size={15} />{result.recommended.phone}
                        </a>
                      )}
                    </div>
                    <div style={{ height: 200, borderRadius: "0.5rem", overflow: "hidden" }}>
                      <FacilityMap facilities={[result.recommended, ...(result.alternatives ?? [])]} center={[result.recommended.lat, result.recommended.lon]} />
                    </div>
                  </div>
                </div>
              )}

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.875rem" }}>{lang === "bm" ? "Pilihan Berdekatan Lain" : "Other Nearby Options"}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {result.alternatives.map((f) => { const cs = CAPACITY_STYLE[f.capacity_status] ?? CAPACITY_STYLE.UNKNOWN; return (
                      <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#F9FAFB", borderRadius: "0.5rem" }}>
                        <div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{f.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#6B7280", marginTop: "0.1rem" }}>
                            <RiMapPinLine size={11} color="#9CA3AF" />{f.district}, {f.state}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                          <div style={{ fontSize: "0.78rem", color: "#6B7280" }}>{f.distance_km} km</div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 9999, background: cs.bg, color: cs.color }}>{f.util_nonicu !== null ? `${Math.round(f.util_nonicu!)}%` : f.capacity_status}</span>
                        </div>
                      </div>
                    ); })}
                  </div>
                </div>
              )}

              <button className="btn-outline" onClick={reset} style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <RiArrowLeftLine size={15} /> {lang === "bm" ? "Penilaian Baru" : "New Assessment"}
              </button>
            </div>
          );
        })()}
      </main>

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg) }  to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
