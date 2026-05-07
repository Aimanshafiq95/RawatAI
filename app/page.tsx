"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  RiEyeLine,
  RiHeartPulseLine,
  RiRouteLine,
  RiUserHeartLine,
  RiFlashlightLine,
  RiMapPinLine,
  RiHospitalLine,
  RiMedicineBottleLine,
  RiCameraLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

const HERO_IMG  = "https://media.kpjhealth.com.my/media/hospital/hospital/1644999204_8f83742bf275c2d2687c.jpeg";
const ABOUT_IMG = "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80";

const NAV_LINKS = ["Features", "How It Works", "Coverage", "About"];

const AGENTS = [
  {
    step: "01",
    Icon: RiEyeLine,
    title: "Vision Agent",
    desc: "Analyses your uploaded photo — rash, wound or prescription — using multimodal AI to extract clinical findings instantly.",
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  {
    step: "02",
    Icon: RiHeartPulseLine,
    title: "Triage Agent",
    desc: "Scores urgency P1 Emergency / P2 Urgent / P3 Non-urgent using your symptoms, medical history, chronic conditions and medications.",
    color: "#1A56DB",
    bg: "#EFF6FF",
  },
  {
    step: "03",
    Icon: RiRouteLine,
    title: "Routing Agent",
    desc: "Scores 3,304 Malaysian public facilities by Haversine distance and live bed utilization to find the best available hospital right now.",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    step: "04",
    Icon: RiUserHeartLine,
    title: "Assignment Agent",
    desc: "Matches you to the nearest available specialist — Emergency, Cardiology, Orthopedics and more — based on your condition and location.",
    color: "#D97706",
    bg: "#FFFBEB",
  },
];

const FEATURES = [
  { Icon: RiFlashlightLine, title: "Results in Seconds",     desc: "Four AI agents run sequentially and return your priority level, hospital and assigned doctor in under 10 seconds." },
  { Icon: RiMapPinLine,     title: "29 Malaysian Cities",    desc: "Select your city or use GPS. Coverage spans all 16 states including Sabah and Sarawak." },
  { Icon: RiHospitalLine,   title: "Real MoH Data",          desc: "3,304 government facilities and 149 hospital bed utilization rates sourced directly from Malaysia's Ministry of Health." },
  { Icon: RiMedicineBottleLine,  title: "Medical History Aware",  desc: "Your chronic conditions and medications are factored in. Hypertension or diabetes elevates urgency automatically." },
  { Icon: RiCameraLine,     title: "Photo Diagnosis",        desc: "Upload a photo of a rash, wound or medicine label. Vision AI reads it and adds findings to your triage." },
  { Icon: RiShieldCheckLine,title: "Privacy First",          desc: "No data leaves your session. All processing is ephemeral — nothing is stored beyond your triage window." },
];

const TESTIMONIALS = [
  {
    name: "Ahmad Razif",
    role: "Patient · Hypertension",
    initials: "AR",
    color: "#1A56DB",
    quote: "I had a fever for 5 days and wasn't sure if it was serious. RawatAI flagged it P2 Urgent because of my hypertension and routed me to Hospital KL. The doctor was already assigned before I arrived.",
  },
  {
    name: "Siti Nurhaliza",
    role: "Patient · Type 2 Diabetes",
    initials: "SN",
    color: "#059669",
    quote: "I didn't know which clinic to go to. The city dropdown made it easy — I selected Ampang and within seconds I had the nearest Klinik Kesihatan with the shortest wait time.",
  },
  {
    name: "Dr. Raj Kumar",
    role: "General Medicine · Hospital KL",
    initials: "RK",
    color: "#D97706",
    quote: "The specialist assignment means patients arrive with a pre-assessed summary. I know their priority, symptoms, and history before they even reach my room. It changes everything.",
  },
];

const STATS = [
  { n: "3,304", label: "Govt Facilities",  sub: "Hospitals + Klinik Kesihatan" },
  { n: "< 10s", label: "Triage Time",      sub: "4 agents, fully autonomous"   },
  { n: "9",     label: "Specialties",       sub: "Auto-matched by AI"           },
  { n: "16",    label: "States Covered",   sub: "Including Sabah & Sarawak"    },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "Calibri, sans-serif" }}>

      {/* ── STICKY NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled || navOpen ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled || navOpen ? "blur(12px)" : "none",
        borderBottom: scrolled || navOpen ? "1px solid #E5E7EB" : "none",
        padding: "1rem 2rem",
        transition: "all 0.25s",
      }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <img src="/logo.png" alt="Malaysia Coat of Arms" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            <span className="font-heading" style={{ fontSize: "1.5rem", color: scrolled || navOpen ? "#1A56DB" : "#fff", letterSpacing: "0.05em", transition: "color 0.25s" }}>
              RawatAI
            </span>
          </div>

          {/* Desktop links */}
          <div className="home-nav-links" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              {NAV_LINKS.map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: "0.875rem", fontWeight: 500, color: scrolled ? "#374151" : "rgba(255,255,255,0.85)", textDecoration: "none", transition: "color 0.2s" }}>
                  {l}
                </a>
              ))}
            </div>
            <Link href="/login">
              <button style={{
                background: "#1A56DB", color: "#fff", border: "none", borderRadius: 9999,
                padding: "0.5rem 1.375rem", fontSize: "0.875rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem",
              }}>
                Start Triage <RiArrowRightLine size={15} />
              </button>
            </Link>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="home-hamburger" onClick={() => setNavOpen(!navOpen)} style={{
            display: "none", background: "none", border: "none", cursor: "pointer",
            padding: "0.25rem", color: scrolled || navOpen ? "#111827" : "#fff",
          }}>
            <div style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2, marginBottom: 5, transition: "all 0.2s", transform: navOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <div style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2, marginBottom: 5, transition: "all 0.2s", opacity: navOpen ? 0 : 1 }} />
            <div style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2, transition: "all 0.2s", transform: navOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div className="home-mobile-menu" style={{
            paddingTop: "1rem", paddingBottom: "0.5rem",
            display: "flex", flexDirection: "column", gap: "0.125rem",
          }}>
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setNavOpen(false)}
                style={{ fontSize: "0.95rem", fontWeight: 500, color: "#374151", textDecoration: "none", padding: "0.625rem 0.25rem", borderBottom: "1px solid #F3F4F6" }}>
                {l}
              </a>
            ))}
            <Link href="/login" onClick={() => setNavOpen(false)}>
              <button style={{
                marginTop: "0.75rem", width: "100%", background: "#1A56DB", color: "#fff",
                border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.95rem",
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "0.375rem",
              }}>
                Start Triage <RiArrowRightLine size={15} />
              </button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        background: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%), url('${HERO_IMG}') center/cover no-repeat`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "8rem 2rem 5rem", textAlign: "center",
      }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "0.35rem 1.1rem", borderRadius: 9999, fontSize: "0.8rem", fontWeight: 600, marginBottom: "1.75rem", letterSpacing: "0.04em" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
          Malaysia Public Healthcare Agentic AI
        </div>

        {/* Headline */}
        <h1 className="font-heading" style={{ fontSize: "clamp(2.5rem,6vw,4rem)", color: "#fff", lineHeight: 1.1, marginBottom: "1.5rem", maxWidth: 780 }}>
          Smart Triage.{" "}
          <span style={{ color: "#60A5FA" }}>Right Hospital.</span>
          <br />Zero Waiting Guesswork.
        </h1>

        <p style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.78)", maxWidth: 580, margin: "0 auto 2.75rem", lineHeight: 1.75 }}>
          Describe your symptoms, share your location — four AI agents assess urgency,
          scan 3,304 Malaysian facilities, and assign your nearest specialist in under 10 seconds.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <Link href="/login">
            <button style={{ background: "#fff", color: "#1A56DB", border: "none", borderRadius: 9999, padding: "0.875rem 2.25rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
              Find My Hospital <RiArrowRightLine size={18} />
            </button>
          </Link>
          <a href="#how-it-works">
            <button style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 9999, padding: "0.875rem 2.25rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              See How It Works
            </button>
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div style={{ display: "flex" }}>
            {["AR", "SN", "LW", "PK", "MR"].map((init, i) => (
              <div key={init} style={{ width: 36, height: 36, borderRadius: "50%", background: ["#1A56DB","#059669","#D97706","#6366F1","#E02424"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#fff", border: "2px solid #fff", marginLeft: i === 0 ? 0 : -10 }}>
                {init}
              </div>
            ))}
          </div>
          <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
            Trusted by patients across Malaysia
          </span>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <section style={{ background: "#0F172A", padding: "2.75rem 2rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1.5rem" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "0 1rem" }}>
              <div className="font-heading" style={{ fontSize: "2.25rem", color: "#60A5FA", lineHeight: 1.1 }}>{s.n}</div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem", margin: "0.3rem 0 0.2rem" }}>{s.label}</div>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "6rem 2rem", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1A56DB", padding: "0.3rem 1rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Agentic Pipeline
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "#111827", marginBottom: "1rem" }}>
              Four Agents. One Submission. Zero Guesswork.
            </h2>
            <p style={{ fontSize: "1rem", color: "#6B7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              No chatbot. No dashboard. A system that senses, decides, and acts autonomously from a single patient input.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1.5rem" }}>
            {AGENTS.map((a) => (
              <div key={a.step} style={{ background: "#fff", borderRadius: "1rem", padding: "1.75rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: `1.5px solid ${a.bg}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 12, right: 16, fontSize: "3.5rem", opacity: 0.06, fontFamily: "Montserrat, sans-serif", fontWeight: 900, color: a.color, lineHeight: 1 }}>{a.step}</div>
                <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <a.Icon size={24} color={a.color} />
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: a.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Step {a.step}</div>
                <h3 className="font-heading" style={{ fontSize: "1rem", color: "#111827", marginBottom: "0.625rem" }}>{a.title}</h3>
                <p style={{ fontSize: "0.835rem", color: "#6B7280", lineHeight: 1.65 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SPLIT ────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: "6rem 2rem", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }} className="grid-about">
          <div style={{ borderRadius: "1.25rem", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", aspectRatio: "4/3" }}>
            <img src={ABOUT_IMG} alt="Malaysian hospital" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1A56DB", padding: "0.3rem 1rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              About RawatAI
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", color: "#111827", lineHeight: 1.2, marginBottom: "1.25rem" }}>
              Malaysia's Public Healthcare,<br />
              <span style={{ color: "#1A56DB" }}>Made Intelligent.</span>
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.8, marginBottom: "1.25rem" }}>
              RawatAI is built on real Ministry of Health data — 3,304 government facilities, 149 hospital bed utilization records, and coverage across all 16 Malaysian states.
            </p>
            <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.8, marginBottom: "2rem" }}>
              Our agentic pipeline replaces guesswork with coordinated, data-driven decisions. Patients with hypertension, diabetes, or other chronic conditions receive elevated urgency scoring automatically — because the system knows their history.
            </p>
            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
              {["No manual triage — fully autonomous pipeline", "Real MoH facility & capacity data", "Specialist matched to your exact condition"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "#374151" }}>
                  <RiCheckboxCircleLine size={18} color="#059669" style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[["3,304", "Facilities"], ["16", "States"], ["9", "Specialties"]].map(([n, l]) => (
                <div key={l} style={{ background: "#F8FAFC", borderRadius: "0.75rem", padding: "0.875rem 1.25rem", textAlign: "center", minWidth: 90 }}>
                  <div className="font-heading" style={{ fontSize: "1.5rem", color: "#1A56DB" }}>{n}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "6rem 2rem", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1A56DB", padding: "0.3rem 1rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Features
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "#111827" }}>
              Everything You Need. Nothing You Don't.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.25rem" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "#fff", borderRadius: "1rem", padding: "1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <f.Icon size={22} color="#1A56DB" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: "0.4rem" }}>{f.title}</h3>
                  <p style={{ fontSize: "0.835rem", color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COVERAGE ───────────────────────────────────────────────────── */}
      <section id="coverage" style={{ background: "#1A56DB", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }} className="grid-coverage">
          <div>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.3rem 1rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              Coverage
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", color: "#fff", lineHeight: 1.2, marginBottom: "1.25rem" }}>
              From Perlis to Tawau.<br />We've Got Malaysia Covered.
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#BFDBFE", lineHeight: 1.8, marginBottom: "2rem" }}>
              Select from 29 cities across Peninsular Malaysia, Sabah and Sarawak. Or let GPS pinpoint your exact location for hyper-local routing.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {["W.P. Kuala Lumpur", "Pulau Pinang", "Johor Bahru", "Kuching, Sarawak", "Kota Kinabalu, Sabah", "Ipoh, Perak", "Kota Bharu, Kelantan", "+ 22 more cities"].map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.835rem" }}>
                  <RiMapPinLine size={13} color={c.startsWith("+") ? "#93C5FD" : "#BFDBFE"} style={{ flexShrink: 0 }} />
                  <span style={{ color: c.startsWith("+") ? "#93C5FD" : "#fff", fontWeight: c.startsWith("+") ? 600 : 400 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Peninsular", n: "2,890", color: "#60A5FA" },
              { label: "Sarawak",    n: "241",   color: "#34D399" },
              { label: "Sabah",      n: "153",   color: "#FBBF24" },
              { label: "Labuan",     n: "20",    color: "#F472B6" },
            ].map((r) => (
              <div key={r.label} style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "0.875rem", padding: "1.5rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="font-heading" style={{ fontSize: "2rem", color: r.color }}>{r.n}</div>
                <div style={{ fontSize: "0.8rem", color: "#BFDBFE", marginTop: "0.25rem", fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: "0.72rem", color: "#93C5FD" }}>facilities</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1A56DB", padding: "0.3rem 1rem", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Testimonials
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,3.5vw,2.25rem)", color: "#111827" }}>
              What Patients & Doctors Say
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem" }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#F8FAFC", borderRadius: "1rem", padding: "1.75rem", border: "1px solid #E5E7EB" }}>
                {/* Quote icon */}
                <div style={{ fontSize: "2.5rem", lineHeight: 1, color: "#BFDBFE", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>"</div>
                <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                  {t.quote}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{t.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)", padding: "6rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ width: 72, height: 72, borderRadius: "1.25rem", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <img src="/logo.png" alt="Malaysia" style={{ height: 52, width: "auto", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
          </div>
          <h2 className="font-heading" style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", color: "#fff", marginBottom: "1.25rem", lineHeight: 1.2 }}>
            Find the Right Care,<br />
            <span style={{ color: "#60A5FA" }}>Right Now.</span>
          </h2>
          <p style={{ fontSize: "1rem", color: "#94A3B8", lineHeight: 1.75, marginBottom: "2.5rem" }}>
            Don't guess. Don't wait. Let AI agents assess your urgency, scan real hospital capacity
            across Malaysia, and assign your nearest specialist in seconds.
          </p>
          <Link href="/login">
            <button style={{ background: "#fff", color: "#1A56DB", border: "none", borderRadius: 9999, padding: "1rem 2.75rem", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.25)", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Start AI Triage — It's Free <RiArrowRightLine size={18} />
            </button>
          </Link>
          <p style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "1rem" }}>
            No registration required for demo · Powered by Groq LLaMA
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0F172A", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="Malaysia" style={{ height: 28, width: "auto", objectFit: "contain", opacity: 0.85 }} />
            <div>
              <span className="font-heading" style={{ fontSize: "1.25rem", color: "#60A5FA" }}>RawatAI</span>
              <p style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "0.15rem" }}>Malaysia Public Healthcare Agentic AI · Adaptive Malaysia Hackathon 2026</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {["Ministry of Health Malaysia", "Groq API", "OpenStreetMap"].map((s) => (
              <span key={s} style={{ fontSize: "0.75rem", color: "#475569" }}>Data: {s}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
