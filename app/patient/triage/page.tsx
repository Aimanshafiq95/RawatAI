"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import PatientNav from "@/components/PatientNav";
import type { Facility } from "@/lib/routing";
import { MALAYSIAN_LOCATIONS } from "@/lib/locations";
import {
  RiUploadCloud2Line, RiMapPinLine, RiStethoscopeLine,
  RiEyeLine, RiRouteLine, RiUserHeartLine, RiCheckLine,
  RiCloseLine, RiPhoneLine, RiTimeLine, RiArrowLeftLine,
  RiHospitalLine, RiMedicineBottleLine, RiShieldCrossLine,
  RiMicLine, RiMicOffLine, RiTranslate2,
  RiVirusFill, RiCalendarCheckLine, RiGroupLine,
} from "react-icons/ri";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), { ssr: false });

type Priority = "P1" | "P2" | "P3";
type Lang = "en" | "bm";

interface AssignedDoctor {
  id: string; name: string; specialty: string;
  hospital: string; state: string;
  years_experience: number; languages: string[];
}
interface TriageResult {
  priority: Priority; summary: string;
  predicted_disease?: string; department?: string;
  key_symptoms: string[]; requires_icu: boolean;
  estimated_wait_minutes?: number; vision_findings?: string;
  recommended?: Facility; alternatives?: Facility[];
  estimated_wait?: number; assigned_doctor?: AssignedDoctor;
  doctor_response_minutes?: number;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  P1: { label: "P1  KECEMASAN",  color: "#E02424", bg: "#FEF2F2", border: "#FECACA" },
  P2: { label: "P2  SEGERA",     color: "#1A56DB", bg: "#EFF6FF", border: "#BFDBFE" },
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

// Per-agent thinking log templates (injected dynamically)
const AGENT_LOGS: Record<string, string[]> = {
  vision: [
    "Initialising multimodal vision model (LLaMA 4 Scout)...",
    "Decoding base64 image payload...",
    "Scanning for visible symptoms: rash, wound, injury, prescription...",
    "Extracting clinical features from pixel data...",
    "Cross-referencing visual markers with symptom description...",
  ],
  triage: [
    "Loading triage model (LLaMA 3.1-8B, temperature=0)...",
    "Tokenising symptom description...",
    "Checking duration indicators in symptom text...",
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
  { key: "vision",  icon: RiEyeLine,         label: "Vision Agent",      sublabel: "Analysing uploaded image" },
  { key: "triage",  icon: RiStethoscopeLine, label: "Triage Agent",      sublabel: "Assessing symptoms & history" },
  { key: "routing", icon: RiRouteLine,        label: "Routing Agent",     sublabel: "Scanning nearby facilities" },
  { key: "assign",  icon: RiUserHeartLine,    label: "Assignment Agent",  sublabel: "Matching specialist" },
];

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

function AgentDetailPanel({ lang, agentLogs, logRef, currentAgent, activeAgents }: {
  lang: Lang;
  agentLogs: string[];
  logRef: React.RefObject<HTMLDivElement | null>;
  currentAgent: string;
  activeAgents: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{maxWidth:560,margin:"0 auto",width:"100%"}}>
      <button onClick={() => setOpen(!open)}
        style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F3F4F6",border:"none",borderRadius:"0.625rem",padding:"0.625rem 1rem",cursor:"pointer",fontSize:"0.78rem",color:"#6B7280",fontWeight:600}}>
        <span>{lang==="bm" ? "Butiran Teknikal Ejen AI" : "AI Agent Technical Details"}</span>
        <span style={{fontSize:"0.7rem",transition:"transform 0.2s",transform:open?"rotate(180deg)":"none"}}>▼</span>
      </button>
      {open && (
        <div style={{marginTop:"0.375rem",background:"#0F172A",borderRadius:"0.625rem",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.375rem",padding:"0.5rem 0.875rem",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:"#E02424"}}/>
            <div style={{width:9,height:9,borderRadius:"50%",background:"#FCD34D"}}/>
            <div style={{width:9,height:9,borderRadius:"50%",background:"#34D399"}}/>
            <span style={{fontSize:"0.68rem",color:"#64748B",marginLeft:"0.375rem",fontFamily:"monospace"}}>rawatai — agent-pipeline</span>
          </div>
          <div ref={logRef} style={{padding:"0.75rem 0.875rem",height:240,overflowY:"auto",fontFamily:"'Courier New',monospace",fontSize:"0.7rem",lineHeight:1.7}}>
            {agentLogs.map((line, i) => {
              const color = line.startsWith("[SYSTEM")?"#94A3B8":line.startsWith("[TRIAGE")?"#60A5FA":line.startsWith("[ROUTING")?"#34D399":line.startsWith("[ASSIGN")?"#FBBF24":line.startsWith("[VISION")?"#C084FC":"#E2E8F0";
              return <div key={i} style={{color,marginBottom:"0.05rem"}}><span style={{opacity:0.35}}>{String(i+1).padStart(3," ")} </span>{line}</div>;
            })}
            {currentAgent && activeAgents[currentAgent]==="running" && (
              <div style={{color:"#475569",animation:"blink 1s step-end infinite"}}>▋</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TriagePage() {
  const [user, setUser]               = useState<any>(null);
  const [step, setStep]               = useState<"form"|"loading"|"result"|"error">("form");
  const [symptoms, setSymptoms]       = useState("");
  const [photo, setPhoto]             = useState<string|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const [location, setLocation]       = useState<{lat:number;lon:number}|null>(null);
  const [locLabel, setLocLabel]       = useState("");
  const [locMode, setLocMode]         = useState<"dropdown"|"gps">("dropdown");
  const [selectedCity, setSelectedCity] = useState("");
  const [result, setResult]           = useState<TriageResult|null>(null);
  const [triageError, setTriageError] = useState("");
  const [activeAgents, setActiveAgents] = useState<Record<string,"idle"|"running"|"done">>({});
  const [agentLogs, setAgentLogs]     = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState("");
  const [lang, setLang]               = useState<Lang>("en");
  const [isListening, setIsListening] = useState(false);
  const [surgeWarning, setSurgeWarning] = useState<string|null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const fileRef     = useRef<HTMLInputElement>(null);
  const logRef      = useRef<HTMLDivElement>(null);
  const speechRef   = useRef<any>(null);
  const logTimers   = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const u = localStorage.getItem("demo_user");
    if (!u) { window.location.href = "/login"; return; }
    setUser(JSON.parse(u));
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLogs]);

  function appendLog(line: string) {
    setAgentLogs((prev) => [...prev, line]);
  }

  function streamLogs(agentKey: string, extra: string[] = [], onDone?: () => void) {
    const lines = [...AGENT_LOGS[agentKey], ...extra];
    logTimers.current.forEach(clearTimeout);
    logTimers.current = [];
    lines.forEach((line, i) => {
      const t = setTimeout(() => {
        appendLog(`[${agentKey.toUpperCase().padEnd(7)}] ${line}`);
        if (i === lines.length - 1 && onDone) onDone();
      }, i * 320);
      logTimers.current.push(t);
    });
    return lines.length * 320 + 200;
  }

  // ── Voice input ─────────────────────────────────────────────────────────
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Please use Chrome."); return; }

    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = lang === "bm" ? "ms-MY" : "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    speechRef.current = rec;
    setIsListening(true);

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setSymptoms(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
  }

  // ── Location ─────────────────────────────────────────────────────────────
  function detectLocation() {
    setLocMode("gps"); setLocLabel("Detecting…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({lat:pos.coords.latitude,lon:pos.coords.longitude}); setLocLabel(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`); },
      ()    => { setLocation({lat:3.139,lon:101.6869}); setLocLabel("Kuala Lumpur (fallback)"); }
    );
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const d = ev.target?.result as string; setPhotoPreview(d); setPhoto(d.split(",")[1]); };
    reader.readAsDataURL(file);
  }

  function setAgent(key: string, status: "idle"|"running"|"done") {
    setActiveAgents((prev) => ({...prev, [key]: status}));
    if (status === "running") setCurrentAgent(key);
  }

  // ── Main triage flow ─────────────────────────────────────────────────────
  async function runTriage() {
    if (!symptoms.trim() || !location) return;
    setStep("loading");
    setActiveAgents({});
    setAgentLogs([]);
    setSurgeWarning(null);
    const sid = `sess-${Date.now()}`;

    try {
      // AGENT 1: Vision
      setAgent("vision", "running");
      appendLog("[SYSTEM ] Starting autonomous agent pipeline...");
      appendLog("[SYSTEM ] Session: " + sid);

      let visionFindings: string|undefined;
      if (photo) {
        const wait = streamLogs("vision");
        await new Promise(r => setTimeout(r, wait));
        const vRes = await fetch("/api/vision", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({image_base64:photo, symptoms}) });
        const vData = await vRes.json();
        visionFindings = vData.findings;
        appendLog(`[VISION ] Result: ${visionFindings?.slice(0,80)}...`);
      } else {
        appendLog("[VISION ] No image uploaded — skipping visual analysis.");
        await new Promise(r => setTimeout(r, 400));
      }
      setAgent("vision", "done");

      // AGENT 2: Triage
      setAgent("triage", "running");
      await new Promise(r => setTimeout(r, 200));
      const triageWait = streamLogs("triage");
      await new Promise(r => setTimeout(r, triageWait));

      const tRes = await fetch("/api/triage", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({symptoms, history:user?.history??{}, vision_findings:visionFindings, session_id:sid, lang}) });
      if (!tRes.ok) { const e = await tRes.json().catch(()=>({})); throw new Error(e.error??`Triage failed (${tRes.status})`); }
      const tData = await tRes.json();

      // Inject real triage reasoning
      appendLog(`[TRIAGE ] Priority determined: ${tData.priority}`);
      if (tData.reasoning_steps?.length) {
        tData.reasoning_steps.forEach((s: string) => appendLog(`[TRIAGE ] → ${s}`));
      }
      appendLog(`[TRIAGE ] Key symptoms: ${(tData.key_symptoms??[]).join(", ")}`);
      setAgent("triage", "done");

      // AGENT 3: Routing
      setAgent("routing", "running");
      await new Promise(r => setTimeout(r, 200));
      const routeWait = streamLogs("routing");
      await new Promise(r => setTimeout(r, routeWait));

      const rRes = await fetch("/api/routing", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({lat:location.lat, lon:location.lon, priority:tData.priority, requires_icu:tData.requires_icu}) });
      const rData = await rRes.json();

      if (rData.recommended) {
        appendLog(`[ROUTING] Best match: ${rData.recommended.name}`);
        appendLog(`[ROUTING] Distance: ${rData.recommended.distance_km} km | Occupancy: ${rData.recommended.util_nonicu !== null ? Math.round(rData.recommended.util_nonicu)+"%" : "N/A"} | Status: ${rData.recommended.capacity_status}`);

        // Surge detection
        if (rData.recommended.capacity_status === "CRITICAL") {
          appendLog(`[ROUTING] ⚠ SURGE DETECTED at ${rData.recommended.name} — re-routing to next best facility...`);
          setSurgeWarning(`Surge detected at ${rData.recommended.name} (CRITICAL). Auto-rerouted to ${rData.alternatives?.[0]?.name ?? "next available"}.`);
          rData.recommended = rData.alternatives?.[0] ?? rData.recommended;
        }
      }
      setAgent("routing", "done");

      // AGENT 4: Assignment
      setAgent("assign", "running");
      await new Promise(r => setTimeout(r, 200));
      const assignWait = streamLogs("assign");
      await new Promise(r => setTimeout(r, assignWait));

      const aRes = await fetch("/api/assign", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({priority:tData.priority, key_symptoms:tData.key_symptoms??[], requires_icu:tData.requires_icu??false, lat:location.lat, lon:location.lon, facility_state:rData.recommended?.state??undefined}) });
      const aData = await aRes.json();
      appendLog(`[ASSIGN ] Specialty required: ${aData.specialty}`);
      appendLog(`[ASSIGN ] Assigned: ${aData.doctor?.name} — ${aData.doctor?.specialty}, ${aData.doctor?.hospital}`);
      appendLog(`[ASSIGN ] Estimated response: ${aData.estimated_response_minutes} min`);
      appendLog("[SYSTEM ] Pipeline complete ✓");
      setAgent("assign", "done");

      await fetch("/api/notify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({session_id:sid, patient_name:user?.name, priority:tData.priority, summary:tData.summary, symptoms, facility_name:rData.recommended?.name??"", doctor_name:aData.doctor?.name??"", doctor_specialty:aData.doctor?.specialty??""}) });

      setResult({
        ...tData,
        vision_findings: visionFindings,
        recommended: rData.recommended,
        alternatives: rData.alternatives??[],
        estimated_wait: tData.estimated_wait_minutes ?? rData.recommended?.estimated_wait ?? (tData.priority==="P1"?5:tData.priority==="P2"?20:45),
        assigned_doctor: aData.doctor,
        doctor_response_minutes: aData.estimated_response_minutes,
      });
      await new Promise(r => setTimeout(r, 600));
      setStep("result");
    } catch (err: any) {
      setTriageError(err.message??"Something went wrong.");
      setStep("error");
    }
  }

  function reset() {
    setStep("form"); setResult(null); setTriageError(""); setActiveAgents({});
    setAgentLogs([]); setSurgeWarning(null); setCurrentAgent(""); setBookingConfirmed(false);
    logTimers.current.forEach(clearTimeout);
  }

  if (!user) return null;
  const pc = result ? PRIORITY_CONFIG[result.priority] : null;

  return (
    <div style={{display:"flex", minHeight:"100vh", background:"#F9FAFB"}}>
      <PatientNav user={user} />
      <main style={{marginLeft:220, flex:1, padding:"2rem 2.5rem"}}>

        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.75rem"}}>
          <div>
            <h1 style={{fontSize:"1.5rem", fontWeight:700, color:"#111827", marginBottom:"0.25rem"}}>AI Health Assessment</h1>
            <p style={{fontSize:"0.875rem", color:"#6B7280"}}>Describe your symptoms and let our AI agents guide you to the right care.</p>
          </div>
          {/* Language toggle */}
          <div style={{display:"flex", alignItems:"center", gap:"0.5rem", background:"#F3F4F6", borderRadius:9999, padding:"0.25rem"}}>
            <RiTranslate2 size={16} color="#6B7280" style={{marginLeft:"0.5rem"}} />
            {(["en","bm"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                style={{padding:"0.3rem 0.875rem", borderRadius:9999, border:"none", cursor:"pointer", fontWeight:600, fontSize:"0.8rem", background:lang===l?"#1A56DB":"transparent", color:lang===l?"#fff":"#6B7280", transition:"all 0.15s"}}>
                {l==="en" ? "EN" : "BM"}
              </button>
            ))}
          </div>
        </div>

        {/* ── FORM ── */}
        {step === "form" && (
          <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem", alignItems:"start"}}>
            <div style={{display:"flex", flexDirection:"column", gap:"1.25rem"}}>

              {/* Symptoms with voice */}
              <div className="card">
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.625rem"}}>
                  <label style={{fontSize:"0.8rem", fontWeight:700, color:"#374151"}}>
                    {lang==="bm" ? "Terangkan gejala anda" : "Describe your symptoms"}
                  </label>
                  <button onClick={toggleVoice} title={isListening ? "Stop recording" : "Speak your symptoms"}
                    style={{display:"flex", alignItems:"center", gap:"0.375rem", padding:"0.375rem 0.75rem", borderRadius:9999, border:"none", cursor:"pointer", fontSize:"0.75rem", fontWeight:600, background:isListening?"#FEE2E2":"#EFF6FF", color:isListening?"#E02424":"#1A56DB", transition:"all 0.2s"}}>
                    {isListening ? <><RiMicOffLine size={15} /> Stop</> : <><RiMicLine size={15} /> {lang==="bm"?"Sebut":"Speak"}</>}
                  </button>
                </div>
                {isListening && (
                  <div style={{display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.75rem", background:"#FEF2F2", borderRadius:"0.5rem", marginBottom:"0.5rem", fontSize:"0.78rem", color:"#E02424", fontWeight:600}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#E02424",animation:"pulse 1s ease-in-out infinite",display:"inline-block"}} />
                    {lang==="bm" ? "Sedang mendengar..." : "Listening... speak your symptoms"}
                  </div>
                )}
                <textarea rows={5} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={lang==="bm" ? "cth. Saya demam 38.5°C selama 2 hari dengan sakit badan..." : "e.g. I have had a fever of 38.5°C for 2 days with body aches..."}
                  style={{resize:"none"}} />
              </div>

              {/* Photo */}
              <div className="card">
                <label style={{fontSize:"0.8rem", fontWeight:700, display:"block", marginBottom:"0.625rem", color:"#374151"}}>
                  {lang==="bm" ? "Foto — pilihan" : "Photo — optional"}
                </label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}} />
                {photoPreview ? (
                  <div style={{position:"relative"}}>
                    <img src={photoPreview} alt="preview" style={{width:"100%", borderRadius:"0.5rem", maxHeight:160, objectFit:"cover"}} />
                    <button onClick={() => {setPhoto(null);setPhotoPreview(null);}} style={{position:"absolute",top:8,right:8,background:"#E02424",color:"#fff",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <RiCloseLine size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} style={{width:"100%",border:"1.5px dashed #D1D5DB",background:"#F9FAFB",borderRadius:"0.5rem",padding:"1.5rem",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
                    <RiUploadCloud2Line size={28} color="#9CA3AF" />
                    <span style={{fontSize:"0.8rem",color:"#6B7280"}}>{lang==="bm" ? "Muat naik gambar kecederaan, ruam atau preskripsi" : "Upload photo of injury, rash or prescription"}</span>
                  </button>
                )}
              </div>

              {/* Location */}
              <div className="card">
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem"}}>
                  <label style={{fontSize:"0.8rem", fontWeight:700, color:"#374151"}}>{lang==="bm" ? "Lokasi anda" : "Your location"}</label>
                  <div style={{display:"flex", background:"#F3F4F6", borderRadius:"0.375rem", padding:"0.15rem"}}>
                    {(["dropdown","gps"] as const).map((mode) => (
                      <button key={mode} onClick={() => setLocMode(mode)} style={{fontSize:"0.72rem",fontWeight:600,padding:"0.25rem 0.625rem",borderRadius:"0.3rem",border:"none",cursor:"pointer",background:locMode===mode?"#fff":"transparent",color:locMode===mode?"#1A56DB":"#6B7280",boxShadow:locMode===mode?"0 1px 2px rgba(0,0,0,0.08)":"none"}}>
                        {mode==="dropdown" ? (lang==="bm"?"Pilih Bandar":"Select City") : "GPS"}
                      </button>
                    ))}
                  </div>
                </div>
                {locMode === "dropdown" ? (
                  <div>
                    <select value={selectedCity} onChange={(e) => { const val=e.target.value; setSelectedCity(val); if(val){const f=MALAYSIAN_LOCATIONS.find(l=>l.label===val); if(f){setLocation({lat:f.lat,lon:f.lon});setLocLabel(`${f.label}, ${f.state}`);}}else{setLocation(null);setLocLabel("");} }} style={{width:"100%",padding:"0.625rem 0.875rem",border:"1px solid #D1D5DB",borderRadius:"0.5rem",fontSize:"0.875rem",background:"#fff",color:"#111827",cursor:"pointer"}}>
                      <option value="">{lang==="bm" ? "— Pilih bandar atau pekan anda —" : "— Select your city or town —"}</option>
                      {MALAYSIAN_LOCATIONS.map(loc => <option key={loc.label} value={loc.label}>{loc.label} ({loc.state})</option>)}
                    </select>
                    {locLabel && <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginTop:"0.5rem",fontSize:"0.8rem",color:"#1A56DB",fontWeight:500}}><RiMapPinLine size={14}/>{locLabel}</div>}
                  </div>
                ) : (
                  locLabel && locMode==="gps" ? (
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"#1A56DB",fontSize:"0.875rem",fontWeight:500}}><RiMapPinLine size={16}/>{locLabel}</div>
                      <button className="btn-outline" onClick={detectLocation} style={{fontSize:"0.75rem",padding:"0.35rem 0.75rem"}}>Re-detect</button>
                    </div>
                  ) : (
                    <button className="btn-outline" onClick={detectLocation} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}><RiMapPinLine size={16}/>{lang==="bm"?"Kesan lokasi saya":"Detect my location via GPS"}</button>
                  )
                )}
              </div>

              <button className="btn-primary" onClick={runTriage} disabled={!symptoms.trim()||!location}
                style={{padding:"0.875rem",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",opacity:(!symptoms.trim()||!location)?0.45:1}}>
                <RiStethoscopeLine size={18} />
                {lang==="bm" ? "Jalankan Triaj AI" : "Run AI Triage"}
              </button>
            </div>

            {/* Medical profile sidebar */}
            <div className="card">
              <h3 style={{fontSize:"0.9rem",fontWeight:700,marginBottom:"1.25rem",color:"#111827"}}>{lang==="bm"?"Profil Perubatan Anda":"Your Medical Profile"}</h3>
              {user?.history ? (
                <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                  {[
                    {label:lang==="bm"?"Jenis Darah":"Blood Type",        val:user.history.blood_type},
                    {label:lang==="bm"?"Alahan":"Allergies",              val:user.history.allergies?.join(", ")||"None"},
                    {label:lang==="bm"?"Penyakit Kronik":"Chronic Conditions", val:user.history.chronic_conditions?.join(", ")||"None"},
                    {label:lang==="bm"?"Ubat":"Medications",              val:user.history.current_medications?.join(", ")||"None"},
                    {label:lang==="bm"?"Diagnosis Terkini":"Recent Diagnoses", val:user.history.recent_diagnoses?.join(", ")||"None"},
                  ].map((item) => (
                    <div key={item.label} style={{borderBottom:"1px solid #F3F4F6",paddingBottom:"0.75rem"}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.2rem"}}>{item.label}</div>
                      <div style={{fontSize:"0.825rem",color:"#374151"}}>{item.val}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{fontSize:"0.85rem",color:"#6B7280"}}>No medical history on file.</p>}
              <div style={{marginTop:"1rem",background:"#EFF6FF",borderRadius:"0.5rem",padding:"0.75rem",fontSize:"0.75rem",color:"#1A56DB",lineHeight:1.5}}>
                {lang==="bm" ? "Sejarah perubatan anda disertakan secara automatik dalam penilaian AI." : "Your history is automatically included in the AI triage assessment."}
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>

            {/* Patient-friendly progress card */}
            <div className="card" style={{maxWidth:560,margin:"0 auto",width:"100%",textAlign:"center",padding:"2.5rem 2rem"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"#EFF6FF",border:"2px solid #1A56DB",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem",animation:"spin 1.5s linear infinite"}}>
                <RiStethoscopeLine size={28} color="#1A56DB"/>
              </div>
              <h2 style={{fontSize:"1.25rem",fontWeight:700,color:"#111827",marginBottom:"0.5rem"}}>
                {lang==="bm" ? "Sedang menilai kesihatan anda…" : "Assessing your health…"}
              </h2>
              <p style={{fontSize:"0.875rem",color:"#6B7280",marginBottom:"2rem",lineHeight:1.6}}>
                {lang==="bm"
                  ? "AI kami sedang memeriksa gejala anda, menyemak sejarah perubatan, dan mencari hospital yang sesuai berdekatan."
                  : "Our AI is reviewing your symptoms, checking your medical history, and finding the right care near you."}
              </p>
              {/* Friendly step list */}
              <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",textAlign:"left"}}>
                {AGENT_STEPS.map((agent) => {
                  const PATIENT_LABELS: Record<string, {en:string;bm:string}> = {
                    vision:  {en:"Reviewing your photo…",            bm:"Menyemak foto anda…"},
                    triage:  {en:"Checking your symptoms…",          bm:"Memeriksa gejala anda…"},
                    routing: {en:"Finding the nearest hospital…",    bm:"Mencari hospital terdekat…"},
                    assign:  {en:"Matching you with a specialist…",  bm:"Mencarikan pakar untuk anda…"},
                  };
                  const status    = activeAgents[agent.key] ?? "idle";
                  const isRunning = status === "running";
                  const isDone    = status === "done";
                  const label     = PATIENT_LABELS[agent.key]?.[lang] ?? agent.sublabel;
                  return (
                    <div key={agent.key} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.625rem 0.875rem",borderRadius:"0.625rem",background:isDone?"#F0FDF4":isRunning?"#EFF6FF":"#F9FAFB",transition:"background 0.3s"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"#059669":isRunning?"#1A56DB":"#E5E7EB",animation:isRunning?"spin 1.5s linear infinite":"none"}}>
                        {isDone ? <RiCheckLine size={14} color="#fff"/> : <agent.icon size={13} color={isRunning?"#fff":"#9CA3AF"}/>}
                      </div>
                      <span style={{fontSize:"0.875rem",fontWeight:isRunning?600:400,color:isDone?"#059669":isRunning?"#1A56DB":"#9CA3AF"}}>
                        {isDone ? label.replace("…","") + (lang==="bm"?" — selesai":" — done") : label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize:"0.75rem",color:"#9CA3AF",marginTop:"1.75rem"}}>
                {lang==="bm" ? "Ini mengambil masa 10–20 saat." : "This usually takes 10–20 seconds."}
              </p>
            </div>

            {/* Collapsible agent details for transparency / demo */}
            <AgentDetailPanel lang={lang} agentLogs={agentLogs} logRef={logRef} currentAgent={currentAgent} activeAgents={activeAgents}/>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div className="card" style={{textAlign:"center",padding:"2.5rem"}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}><RiCloseLine size={24} color="#E02424"/></div>
              <h2 className="font-heading" style={{color:"#E02424",marginBottom:"0.75rem"}}>Assessment Failed</h2>
              <p style={{fontSize:"0.875rem",color:"#374151",lineHeight:1.7,marginBottom:"1.5rem"}}>{triageError}</p>
              <button className="btn-primary" onClick={reset}>Try Again</button>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && result && pc && (() => {
          const crowd = result.recommended?.util_nonicu ?? null;
          const crowdPct = crowd !== null ? Math.round(crowd) : null;
          const crowdColor = crowd === null ? "#9CA3AF" : crowd < 60 ? "#059669" : crowd < 80 ? "#D97706" : "#E02424";
          const crowdLabel = crowd === null ? "Unknown" : crowd < 60 ? (lang==="bm"?"Tidak Sesak":"Not busy") : crowd < 80 ? (lang==="bm"?"Sederhana":"Moderate") : (lang==="bm"?"Sesak":"Busy");
          const hospitalPhone = result.recommended?.phone ?? null;

          return (
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

            {/* Surge warning */}
            {surgeWarning && (
              <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:"0.75rem",padding:"0.875rem 1.25rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                <RiShieldCrossLine size={18} color="#D97706"/>
                <div>
                  <div style={{fontSize:"0.78rem",fontWeight:700,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:"0.15rem"}}>{lang==="bm"?"Laluan Auto-Ubah":"Surge Auto-Rerouted"}</div>
                  <div style={{fontSize:"0.85rem",color:"#92400E"}}>{surgeWarning}</div>
                </div>
              </div>
            )}

            {/* Priority banner — no wait time */}
            <div style={{background:pc.bg,border:`1.5px solid ${pc.border}`,borderRadius:"0.875rem",padding:"1.25rem 1.5rem"}}>
              <span className="font-heading" style={{fontSize:"1.35rem",color:pc.color}}>
                {lang==="en" ? PRIORITY_LABEL_EN[result.priority] : PRIORITY_CONFIG[result.priority].label}
              </span>
              <p style={{fontSize:"0.875rem",color:"#374151",marginTop:"0.4rem",lineHeight:1.65}}>{result.summary}</p>
            </div>

            {/* Disease Prediction + Image Analysis row */}
            <div style={{display:"grid",gridTemplateColumns:result.vision_findings?"1fr 1fr":"1fr",gap:"1.25rem"}}>
              {/* Disease Prediction */}
              <div className="card">
                <div style={{display:"flex",alignItems:"center",gap:"0.625rem",marginBottom:"1rem"}}>
                  <div style={{width:36,height:36,borderRadius:"0.5rem",background:pc.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <RiVirusFill size={18} color={pc.color}/>
                  </div>
                  <div>
                    <div style={{fontSize:"0.68rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em"}}>{lang==="bm"?"Penyakit Dijangka":"Predicted Condition"}</div>
                    <div style={{fontWeight:700,fontSize:"1rem",color:"#111827",lineHeight:1.2}}>{result.predicted_disease ?? "Under assessment"}</div>
                  </div>
                </div>
                {result.department && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",background:pc.bg,color:pc.color,padding:"0.25rem 0.75rem",borderRadius:9999,fontSize:"0.78rem",fontWeight:600,marginBottom:"0.875rem"}}>
                    <RiHospitalLine size={13}/>
                    {result.department}
                  </div>
                )}
                {result.key_symptoms?.length>0 && (
                  <div>
                    <div style={{fontSize:"0.68rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.5rem"}}>{lang==="bm"?"Gejala Utama":"Key Symptoms"}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"0.375rem"}}>
                      {result.key_symptoms.map(s=><span key={s} style={{background:"#F3F4F6",color:"#374151",padding:"0.2rem 0.625rem",borderRadius:9999,fontSize:"0.78rem"}}>{s}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {result.vision_findings && (
                <div className="card">
                  <h3 style={{fontSize:"0.875rem",fontWeight:700,marginBottom:"0.75rem"}}>{lang==="bm"?"Analisis Imej":"Image Analysis"}</h3>
                  <p style={{fontSize:"0.875rem",color:"#374151",lineHeight:1.7}}>{result.vision_findings}</p>
                </div>
              )}
            </div>

            {/* Assigned Specialist card — redesigned */}
            {result.assigned_doctor && (
              <div className="card" style={{borderLeft:`4px solid ${pc.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem",flexWrap:"wrap"}}>
                  {/* Left: avatar + identity */}
                  <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:pc.bg,border:`2px solid ${pc.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <RiUserHeartLine size={28} color={pc.color}/>
                    </div>
                    <div>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.2rem"}}>{lang==="bm"?"Pakar Ditugaskan":"Assigned Specialist"}</div>
                      <div style={{fontWeight:700,fontSize:"1.05rem",color:"#111827"}}>{result.assigned_doctor.name}</div>
                      {/* Department badge */}
                      <div style={{display:"inline-flex",alignItems:"center",gap:"0.35rem",marginTop:"0.2rem",marginBottom:"0.3rem",background:pc.bg,color:pc.color,padding:"0.2rem 0.625rem",borderRadius:9999,fontSize:"0.75rem",fontWeight:700}}>
                        <RiStethoscopeLine size={12}/>
                        {result.department ?? result.assigned_doctor.specialty}
                      </div>
                      {/* Hospital with location pin */}
                      <div style={{display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.8rem",color:"#6B7280"}}>
                        <RiMapPinLine size={13} color="#1A56DB"/>
                        <span style={{color:"#374151",fontWeight:500}}>{result.assigned_doctor.hospital}</span>
                        <span style={{color:"#D1D5DB"}}>·</span>
                        <span>{result.assigned_doctor.state}</span>
                      </div>
                      <div style={{fontSize:"0.75rem",color:"#9CA3AF",marginTop:"0.25rem"}}>
                        {result.assigned_doctor.years_experience} {lang==="bm"?"thn pengalaman":"yrs experience"} &nbsp;·&nbsp; {result.assigned_doctor.languages.join(", ")}
                      </div>
                    </div>
                  </div>

                  {/* Right: Call + Book */}
                  <div style={{display:"flex",flexDirection:"column",gap:"0.625rem",alignItems:"flex-end",minWidth:180}}>
                    {/* Call button */}
                    {hospitalPhone ? (
                      <a href={`tel:${hospitalPhone}`}
                        style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#059669",color:"#fff",padding:"0.5rem 1rem",borderRadius:"0.5rem",textDecoration:"none",fontWeight:700,fontSize:"0.82rem"}}>
                        <RiPhoneLine size={15}/>
                        {lang==="bm"?"Hubungi Hospital":"Call Hospital"}
                      </a>
                    ) : (
                      <a href="tel:+60322999999"
                        style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#059669",color:"#fff",padding:"0.5rem 1rem",borderRadius:"0.5rem",textDecoration:"none",fontWeight:700,fontSize:"0.82rem"}}>
                        <RiPhoneLine size={15}/>
                        {lang==="bm"?"Hubungi Hospital":"Call Hospital"}
                      </a>
                    )}

                    {/* Book Appointment with crowd indicator */}
                    {bookingConfirmed ? (
                      <div style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:"0.5rem",padding:"0.5rem 1rem",fontSize:"0.82rem",fontWeight:700,color:"#059669"}}>
                        <RiCheckLine size={15}/>
                        {lang==="bm"?"Janji Temu Ditempah":"Appointment Booked!"}
                      </div>
                    ) : (
                      <button onClick={() => setBookingConfirmed(true)}
                        style={{display:"flex",alignItems:"center",gap:"0.5rem",background:"#1A56DB",color:"#fff",padding:"0.5rem 1rem",borderRadius:"0.5rem",border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>
                        <RiCalendarCheckLine size={15}/>
                        {lang==="bm"?"Buat Temujanji":"Book Appointment"}
                      </button>
                    )}

                    {/* Hospital crowd bar */}
                    {crowdPct !== null && (
                      <div style={{width:"100%",minWidth:180}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.25rem"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.7rem",color:"#6B7280",fontWeight:600}}>
                            <RiGroupLine size={12}/>
                            {lang==="bm"?"Kesesakan Hospital":"Hospital Crowd"}
                          </div>
                          <span style={{fontSize:"0.7rem",fontWeight:700,color:crowdColor}}>{crowdLabel} · {crowdPct}%</span>
                        </div>
                        <div style={{height:6,borderRadius:9999,background:"#F3F4F6",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${crowdPct}%`,background:crowdColor,borderRadius:9999,transition:"width 0.8s ease"}}/>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{marginTop:"1rem",background:pc.bg,borderRadius:"0.5rem",padding:"0.5rem 0.875rem",fontSize:"0.75rem",color:pc.color,fontWeight:500,display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <RiShieldCrossLine size={12}/>
                  {lang==="bm"
                    ? `${result.assigned_doctor.name} telah ditugaskan secara automatik berdasarkan keadaan, lokasi dan kepakaran anda.`
                    : `${result.assigned_doctor.name} has been automatically assigned based on your condition, location and specialist availability.`}
                </div>
              </div>
            )}

            {/* Recommended facility */}
            {result.recommended && (
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <h3 style={{fontSize:"0.875rem",fontWeight:700}}>
                    {lang==="bm"?"Fasiliti Disyorkan":"Recommended"} {result.recommended.facility_type==="hospital"?"Hospital":"Klinik Kesihatan"}
                  </h3>
                  <span style={{display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.75rem",color:CAPACITY_STYLE[result.recommended.capacity_status]?.color??"#6B7280",fontWeight:600}}>
                    {result.recommended.facility_type==="hospital"?<RiHospitalLine size={14}/>:<RiMedicineBottleLine size={14}/>}
                    {result.recommended.capacity_status}
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem",alignItems:"start"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:"1rem",color:"#111827",marginBottom:"0.2rem"}}>{result.recommended.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:"0.35rem",fontSize:"0.78rem",color:"#6B7280",marginBottom:"0.125rem"}}>
                      <RiMapPinLine size={13} color="#1A56DB"/>
                      {result.recommended.address}
                    </div>
                    <div style={{fontSize:"0.78rem",color:"#9CA3AF",marginBottom:"0.875rem",paddingLeft:"1.1rem"}}>{result.recommended.district}, {result.recommended.state}</div>
                    <div style={{display:"flex",gap:"1.5rem",marginBottom:"0.875rem"}}>
                      <div>
                        <div style={{fontSize:"0.68rem",color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em"}}>{lang==="bm"?"Jarak":"Distance"}</div>
                        <div style={{fontWeight:700,fontSize:"0.9rem",color:"#111827"}}>{result.recommended.distance_km} km</div>
                      </div>
                      {result.recommended.util_nonicu!==null && (
                        <div>
                          <div style={{fontSize:"0.68rem",color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em"}}>{lang==="bm"?"Penghunian":"Occupancy"}</div>
                          <div style={{fontWeight:700,fontSize:"0.9rem",color:CAPACITY_STYLE[result.recommended.capacity_status]?.color??"#111827"}}>{Math.round(result.recommended.util_nonicu!)}%</div>
                        </div>
                      )}
                    </div>
                    {result.recommended.phone && (
                      <a href={`tel:${result.recommended.phone}`} style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",color:"#1A56DB",fontWeight:600,fontSize:"0.85rem",textDecoration:"none"}}>
                        <RiPhoneLine size={15}/>{result.recommended.phone}
                      </a>
                    )}
                  </div>
                  <div style={{height:200,borderRadius:"0.5rem",overflow:"hidden"}}>
                    <FacilityMap facilities={[result.recommended,...(result.alternatives??[])]} center={[result.recommended.lat,result.recommended.lon]}/>
                  </div>
                </div>
              </div>
            )}

            {/* Alternatives */}
            {result.alternatives&&result.alternatives.length>0&&(
              <div className="card">
                <h3 style={{fontSize:"0.875rem",fontWeight:700,marginBottom:"0.875rem"}}>{lang==="bm"?"Pilihan Berdekatan Lain":"Other Nearby Options"}</h3>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {result.alternatives.map(f=>{const cs=CAPACITY_STYLE[f.capacity_status]??CAPACITY_STYLE.UNKNOWN;return(
                    <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem",background:"#F9FAFB",borderRadius:"0.5rem"}}>
                      <div>
                        <div style={{fontSize:"0.875rem",fontWeight:600,color:"#111827"}}>{f.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.75rem",color:"#6B7280",marginTop:"0.1rem"}}>
                          <RiMapPinLine size={11} color="#9CA3AF"/>{f.district}, {f.state}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"1rem",flexShrink:0}}>
                        <div style={{fontSize:"0.78rem",color:"#6B7280"}}>{f.distance_km} km</div>
                        <span style={{fontSize:"0.72rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:9999,background:cs.bg,color:cs.color}}>{f.util_nonicu!==null?`${Math.round(f.util_nonicu!)}%`:f.capacity_status}</span>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}

            <button className="btn-outline" onClick={reset} style={{width:"fit-content",display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <RiArrowLeftLine size={15}/> {lang==="bm"?"Penilaian Baru":"New Assessment"}
            </button>
          </div>
          );
        })()}
      </main>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
