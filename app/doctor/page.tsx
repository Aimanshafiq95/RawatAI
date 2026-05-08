"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiStethoscopeLine, RiAlertLine, RiTimeLine, RiCheckLine,
  RiUserHeartLine, RiHospitalLine, RiRefreshLine,
  RiEditLine, RiLogoutBoxLine, RiShieldUserLine, RiUserSearchLine,
  RiAlarmWarningLine, RiFireLine,
} from "react-icons/ri";
import OverrideModal from "@/components/OverrideModal";
import type { DemoStaff } from "@/lib/demo-users";
import type { CaseRecord } from "@/lib/session-store";
import { REVIEW_SLA } from "@/lib/session-store";

// Compute review urgency from the time the case was created.
// Tight 5min/10min SLA — demo-friendly + clinically defensible for P2.
function reviewUrgency(createdAt: number, status?: string):
  { tier: "NORMAL" | "ESCALATED" | "CRITICAL"; mins: number; label: string; color: string; bg: string } {
  const mins = Math.floor((Date.now() - createdAt) / 60000);
  if (mins >= REVIEW_SLA.CRITICAL_AFTER_MIN) {
    return { tier: "CRITICAL",  mins, label: `CRITICAL · ${mins}m`,  color: "#FFFFFF", bg: "#E02424" };
  }
  if (mins >= REVIEW_SLA.ESCALATED_AFTER_MIN) {
    return { tier: "ESCALATED", mins, label: `ESCALATED · ${mins}m`, color: "#92400E", bg: "#FED7AA" };
  }
  return   { tier: "NORMAL",    mins, label: `${mins}m wait`,        color: "#1A56DB", bg: "#DBEAFE" };
}

// Clinical severity score — combines priority weight, pain, comorbidity load, and risky pain location.
// Used to sort the review queue so the most acute cases bubble to the top of the same priority bucket.
const HIGH_RISK_LOCATIONS = new Set(["chest", "abdomen", "head", "back"]);
function severityScore(c: CaseRecord & { pain_score?: number; pain_location?: string }): number {
  const priorityWeight = c.priority === "P1" ? 80 : c.priority === "P2" ? 40 : 10;
  const painComponent  = Math.min((c.pain_score ?? 0) * 3, 30); // cap at 30 (pain 10)
  const painBoost      = c.pain_location && HIGH_RISK_LOCATIONS.has(c.pain_location.toLowerCase()) ? 10 : 0;
  // Comorbidity proxy: doctor_specialty hints at chronic context (best signal we have at this layer)
  // For real signal, the case record would need to carry chronic_conditions; for demo this is fine.
  return priorityWeight + painComponent + painBoost;
}

function severityBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: "HIGH",     color: "#fff",    bg: "#E02424" };
  if (score >= 50) return { label: "ELEVATED", color: "#92400E", bg: "#FED7AA" };
  if (score >= 30) return { label: "MODERATE", color: "#1A56DB", bg: "#DBEAFE" };
  return              { label: "LOW",      color: "#065F46", bg: "#D1FAE5" };
}

interface AdminData {
  cases: CaseRecord[];
  surge_events: any[];
  capacity_snapshot: any[];
  stats: { total: number; p1: number; p2: number; p3: number; surges: number };
}

interface AuditEntry {
  id: string;
  case_session_id: string;
  patient_name: string;
  doctor_name: string;
  doctor_staff_id: string;
  action: "CONFIRMED" | "OVERRIDDEN";
  ai_priority: "P1" | "P2" | "P3";
  new_priority?: "P1" | "P2" | "P3";
  ai_department?: string;
  new_department?: string;
  ai_doctor?: string;
  new_doctor?: string;
  notes?: string;
  timestamp: number;
}

type View = "queue" | "emergency" | "audit";

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2", label: "P1 CRITICAL" },
  P2: { color: "#1A56DB", bg: "#DBEAFE", label: "P2 URGENT" },
  P3: { color: "#065F46", bg: "#D1FAE5", label: "P3 ROUTINE" },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor]           = useState<DemoStaff | null>(null);
  const [data, setData]               = useState<AdminData | null>(null);
  const [audit, setAudit]             = useState<AuditEntry[]>([]);
  const [view, setView]               = useState<View>("queue");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [overrideCase, setOverrideCase] = useState<CaseRecord | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [filter, setFilter]           = useState<"PENDING" | "ALL" | "P1" | "P2" | "P3" | "OVERRIDDEN">("PENDING");

  // Auth gate — must be DOCTOR
  useEffect(() => {
    const raw = localStorage.getItem("demo_staff");
    if (!raw) { router.replace("/staff/login"); return; }
    try {
      const s = JSON.parse(raw) as DemoStaff;
      if (s.role !== "DOCTOR") { router.replace("/staff/login"); return; }
      setDoctor(s);
    } catch { router.replace("/staff/login"); }
  }, [router]);

  function signOut() {
    localStorage.removeItem("demo_staff");
    router.replace("/staff/login");
  }

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [casesRes, auditRes] = await Promise.all([
        fetch("/api/admin/cases"),
        fetch("/api/audit"),
      ]);
      const json  = await casesRes.json() as AdminData;
      const adata = await auditRes.json() as { entries: AuditEntry[] };
      setData(json);
      setAudit(adata.entries ?? []);
      setLastRefresh(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!doctor) return;
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData, doctor]);

  async function confirmAI(c: CaseRecord) {
    if (!doctor) return;
    setConfirmingId(c.session_id);
    await fetch(`/api/doctor/review/${c.session_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_name:     doctor.name,
        doctor_staff_id: doctor.staffId,
        // No override fields → review endpoint records action=CONFIRMED
      }),
    });
    await fetchData(true);
    setConfirmingId(null);
  }

  if (!doctor) return null;

  const stats = data?.stats ?? { total: 0, p1: 0, p2: 0, p3: 0, surges: 0 };
  const overriddenCount  = data?.cases.filter(c => c.overridden).length ?? 0;
  const pendingCount     = data?.cases.filter(c => c.review_status === "PENDING_REVIEW").length ?? 0;
  const emergencyCount   = data?.cases.filter(c => c.review_status === "EMERGENCY_FOLLOWUP").length ?? 0;

  // P2 review queue — pending cases first, then sorted by clinical severity score
  // (descending), then by wait time as tiebreaker. Most acute cases bubble to the top.
  const filteredCases = (data?.cases ?? [])
    .filter(c => {
      if (filter === "PENDING")    return c.review_status === "PENDING_REVIEW";
      if (filter === "ALL")        return true;
      if (filter === "OVERRIDDEN") return c.overridden;
      return (c.override_priority ?? c.priority) === filter;
    })
    .sort((a, b) => {
      const aPending = a.review_status === "PENDING_REVIEW";
      const bPending = b.review_status === "PENDING_REVIEW";
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      const sa = severityScore(a);
      const sb = severityScore(b);
      if (sa !== sb) return sb - sa;          // higher severity first
      return a.created_at - b.created_at;     // tie → longest wait first
    });

  // P1 emergency follow-up queue — separate tab, optional review.
  const emergencyCases = (data?.cases ?? [])
    .filter(c => c.review_status === "EMERGENCY_FOLLOWUP")
    .sort((a, b) => a.created_at - b.created_at);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="RawatAI" style={{ height: 30, width: "auto", objectFit: "contain" }} />
            <span className="font-heading" style={{ fontSize: "1.1rem", color: "#1A56DB" }}>RawatAI</span>
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "#1A56DB", textTransform: "uppercase", letterSpacing: "0.08em" }}>Doctor Console</div>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {[
            { key: "queue"     as View, icon: RiStethoscopeLine, label: "Review Queue",       count: pendingCount },
            { key: "emergency" as View, icon: RiAlarmWarningLine,   label: "Emergency Follow-up", count: emergencyCount },
            { key: "audit"     as View, icon: RiShieldUserLine,  label: "Audit Log",          count: audit.length },
          ].map(({ key, icon: Icon, label, count }) => {
            const active = view === key;
            return (
              <button key={key} onClick={() => setView(key)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                  background: active ? "#EFF6FF" : "transparent", color: active ? "#1A56DB" : "#374151",
                  fontWeight: active ? 600 : 500, fontSize: "0.875rem", cursor: "pointer",
                  border: "none", textAlign: "left", width: "100%",
                  fontFamily: "Montserrat, sans-serif",
                }}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 9999, background: active ? "#1A56DB" : "#E5E7EB", color: active ? "#fff" : "#6B7280" }}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="font-heading" style={{ fontSize: "0.85rem", color: "#1A56DB" }}>{doctor.name[0]}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doctor.name}</div>
              <div style={{ fontSize: "0.66rem", color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doctor.department}</div>
            </div>
          </div>
          <button onClick={signOut} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            width: "100%", padding: "0.5rem 0.625rem", borderRadius: "0.5rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#E02424", fontWeight: 500, fontSize: "0.8rem",
            fontFamily: "Montserrat, sans-serif",
          }}>
            <RiLogoutBoxLine size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: "2rem 2.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Clinical Review</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9999, padding: "0.2rem 0.625rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669" }}>LIVE</span>
              </div>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
              Review and override AI triage decisions · Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </p>
          </div>
          <button onClick={() => fetchData()} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
            <RiRefreshLine size={15} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
          <StatCard icon={RiUserSearchLine} label="Awaiting Review" value={pendingCount}    color="#1A56DB" bg="#EFF6FF" />
          <StatCard icon={RiAlertLine}    label="P1 Critical"     value={stats.p1}        color="#E02424" bg="#FEE2E2" />
          <StatCard icon={RiTimeLine}     label="P2 Urgent"       value={stats.p2}        color="#1A56DB" bg="#DBEAFE" />
          <StatCard icon={RiEditLine}     label="My Overrides"    value={overriddenCount} color="#D97706" bg="#FEF3C7" />
        </div>

        {view === "queue" ? (
          <>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {([
                { key: "PENDING",    label: "Pending Review", count: pendingCount },
                { key: "ALL",        label: "All cases",      count: stats.total },
                { key: "P1",         label: "P1 Critical",    count: stats.p1 },
                { key: "P2",         label: "P2 Urgent",      count: stats.p2 },
                { key: "P3",         label: "P3 Routine",     count: stats.p3 },
                { key: "OVERRIDDEN", label: "Overridden",     count: overriddenCount },
              ] as const).map(f => {
                const active = filter === f.key;
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    style={{ padding: "0.4rem 0.875rem", borderRadius: 9999, border: `1.5px solid ${active ? "#1A56DB" : "#E5E7EB"}`, background: active ? "#EFF6FF" : "#fff", color: active ? "#1A56DB" : "#374151", fontWeight: active ? 700 : 500, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {f.label}
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.05rem 0.4rem", borderRadius: 9999, background: active ? "#1A56DB" : "#F3F4F6", color: active ? "#fff" : "#6B7280" }}>{f.count}</span>
                  </button>
                );
              })}
            </div>

        {/* Case list */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Cases requiring review</h2>
            <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{filteredCases.length} shown</span>
          </div>

          {filteredCases.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <RiCheckLine size={36} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>No cases match this filter.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {filteredCases.map(c => {
                const effectivePriority = c.override_priority ?? c.priority;
                const ps     = PRIORITY_STYLE[effectivePriority];
                const aiPs   = PRIORITY_STYLE[c.priority];
                const dept   = c.override_department ?? c.doctor_specialty;
                const doc    = c.override_doctor ?? c.doctor_name;

                return (
                  <div key={c.session_id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F9FAFB", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    {/* Priority pill */}
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ display: "inline-block", background: ps.bg, color: ps.color, padding: "0.3rem 0.75rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>{ps.label}</span>
                      {c.overridden && c.override_priority && c.override_priority !== c.priority && (
                        <div style={{ fontSize: "0.6rem", color: "#9CA3AF", marginTop: "0.25rem", textDecoration: "line-through", textAlign: "center" }}>
                          AI: {aiPs.label}
                        </div>
                      )}
                    </div>

                    {/* Case details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>{c.patient_name}</span>
                        <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>· {timeAgo(c.created_at)}</span>
                        {/* Clinical severity score badge — drives the queue ordering */}
                        {(() => {
                          const score = severityScore(c);
                          const band = severityBand(score);
                          return (
                            <span title={`Severity score ${score}/100 — combines priority, pain, and pain location`}
                              style={{ fontSize: "0.62rem", background: band.bg, color: band.color, padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              SEVERITY {score} · {band.label}
                            </span>
                          );
                        })()}
                        {c.review_status === "PENDING_REVIEW" && (() => {
                          const u = reviewUrgency(c.created_at, c.review_status);
                          return (
                            <span style={{ fontSize: "0.62rem", background: u.bg, color: u.color, padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              {u.tier === "CRITICAL" ? <RiFireLine size={10} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.color, animation: "pulse 1s ease-in-out infinite" }} />}
                              {u.tier === "NORMAL" ? `AWAITING · ${u.mins}m` : u.label}
                            </span>
                          );
                        })()}
                        {c.review_status === "REVIEWED" && !c.overridden && (
                          <span style={{ fontSize: "0.62rem", background: "#D1FAE5", color: "#059669", padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                            ✓ AI CONFIRMED
                          </span>
                        )}
                        {c.overridden && (
                          <span style={{ fontSize: "0.62rem", background: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                            ✎ OVERRIDDEN
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.55, marginBottom: "0.5rem" }}>{c.summary}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.75rem", color: "#6B7280" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <RiUserHeartLine size={12} color={c.overridden ? "#D97706" : "#059669"} />
                          {dept || "—"} · {doc || "—"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <RiHospitalLine size={12} color="#1A56DB" />
                          {c.facility_name || "—"}
                        </span>
                      </div>
                      {c.override_notes && (
                        <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "#FEF9C3", borderRadius: "0.375rem", fontSize: "0.75rem", color: "#92400E", lineHeight: 1.5 }}>
                          <strong>Override note:</strong> {c.override_notes}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 160 }}>
                      {c.review_status === "PENDING_REVIEW" && (
                        <button onClick={() => confirmAI(c)} disabled={confirmingId === c.session_id}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #059669", background: "#059669", color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap", opacity: confirmingId === c.session_id ? 0.6 : 1 }}>
                          <RiCheckLine size={13} />
                          {confirmingId === c.session_id ? "Confirming…" : "Confirm AI"}
                        </button>
                      )}
                      <button onClick={() => setOverrideCase(c)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: `1.5px solid ${c.overridden ? "#FCD34D" : "#1A56DB"}`, background: c.overridden ? "#FEF9C3" : c.review_status === "PENDING_REVIEW" ? "#fff" : "#1A56DB", color: c.overridden ? "#92400E" : c.review_status === "PENDING_REVIEW" ? "#1A56DB" : "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        <RiEditLine size={13} />
                        {c.overridden ? "Edit Override" : "Review & Override"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        ) : view === "emergency" ? (
          /* ── Emergency Follow-up view (P1 cases — optional review) ── */
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF2F2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <RiAlarmWarningLine size={20} color="#E02424" />
                <div>
                  <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Emergency Follow-up · P1 Cases</h2>
                  <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.15rem" }}>
                    Patients already routed to ambulance/ER · review is optional but recommended for oversight + audit
                  </p>
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{emergencyCases.length} active</span>
            </div>
            {emergencyCases.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <RiCheckLine size={36} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>No active P1 emergencies.</p>
              </div>
            ) : (
              <div style={{ maxHeight: 720, overflowY: "auto" }}>
                {emergencyCases.map(c => {
                  const dept = c.override_department ?? c.doctor_specialty;
                  const doc  = c.override_doctor     ?? c.doctor_name;
                  const u    = reviewUrgency(c.created_at, c.review_status);
                  return (
                    <div key={c.session_id} style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F9FAFB", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#FEE2E2", color: "#E02424", padding: "0.2rem 0.55rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700 }}>
                            <RiAlarmWarningLine size={11} /> P1 EMERGENCY
                          </span>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>{c.patient_name}</span>
                          <span style={{ fontSize: "0.62rem", background: u.bg, color: u.color, padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                            ROUTED · {u.mins}m ago
                          </span>
                          {c.reviewed_by && (
                            <span style={{ fontSize: "0.62rem", background: "#D1FAE5", color: "#059669", padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                              ✓ FOLLOWED UP by {c.reviewed_by}
                            </span>
                          )}
                          {c.overridden && (
                            <span style={{ fontSize: "0.62rem", background: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                              ✎ OVERRIDDEN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.55, marginBottom: "0.5rem" }}>{c.summary}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.75rem", color: "#6B7280" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <RiUserHeartLine size={12} color="#E02424" /> {dept || "—"} · {doc || "—"}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <RiHospitalLine size={12} color="#1A56DB" /> {c.facility_name || "—"}
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 160 }}>
                        {!c.reviewed_by && (
                          <button onClick={() => confirmAI(c)} disabled={confirmingId === c.session_id}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #059669", background: "#059669", color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap", opacity: confirmingId === c.session_id ? 0.6 : 1 }}>
                            <RiCheckLine size={13} />
                            {confirmingId === c.session_id ? "Following up…" : "Acknowledge"}
                          </button>
                        )}
                        <button onClick={() => setOverrideCase(c)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: `1.5px solid ${c.overridden ? "#FCD34D" : "#1A56DB"}`, background: c.overridden ? "#FEF9C3" : "#fff", color: c.overridden ? "#92400E" : "#1A56DB", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                          <RiEditLine size={13} />
                          {c.overridden ? "Edit Override" : "Override / Note"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Audit Log view ── */
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Doctor Action Audit Log</h2>
                <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.15rem" }}>Append-only · all confirmations & overrides logged</p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{audit.length} entries</span>
            </div>
            {audit.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <RiShieldUserLine size={36} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>No doctor actions logged yet.</p>
              </div>
            ) : (
              <div style={{ maxHeight: 600, overflowY: "auto" }}>
                {audit.map(e => {
                  const isOverride = e.action === "OVERRIDDEN";
                  return (
                    <div key={e.id} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F9FAFB", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isOverride ? "#FEF3C7" : "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isOverride ? <RiEditLine size={15} color="#92400E" /> : <RiCheckLine size={15} color="#059669" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.62rem", background: isOverride ? "#FEF3C7" : "#D1FAE5", color: isOverride ? "#92400E" : "#059669", padding: "0.1rem 0.45rem", borderRadius: 9999, fontWeight: 700 }}>
                            {isOverride ? "OVERRIDDEN" : "CONFIRMED"}
                          </span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>{e.doctor_name}</span>
                          <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>· {e.doctor_staff_id}</span>
                          <span style={{ fontSize: "0.72rem", color: "#9CA3AF", marginLeft: "auto" }}>{timeAgo(e.timestamp)}</span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#374151", marginBottom: "0.3rem" }}>
                          Patient: <strong>{e.patient_name}</strong> · Session: <code style={{ fontSize: "0.7rem", background: "#F3F4F6", padding: "0.05rem 0.3rem", borderRadius: 3 }}>{e.case_session_id.slice(0, 16)}…</code>
                        </div>
                        {isOverride ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", fontSize: "0.75rem" }}>
                            {e.new_priority && e.new_priority !== e.ai_priority && (
                              <span style={{ color: "#374151" }}>
                                Priority: <span style={{ textDecoration: "line-through", color: "#9CA3AF" }}>{e.ai_priority}</span> → <strong>{e.new_priority}</strong>
                              </span>
                            )}
                            {e.new_department && e.new_department !== e.ai_department && (
                              <span style={{ color: "#374151" }}>
                                Dept: <span style={{ textDecoration: "line-through", color: "#9CA3AF" }}>{e.ai_department}</span> → <strong>{e.new_department}</strong>
                              </span>
                            )}
                            {e.new_doctor && e.new_doctor !== e.ai_doctor && (
                              <span style={{ color: "#374151" }}>
                                Doctor: <span style={{ textDecoration: "line-through", color: "#9CA3AF" }}>{e.ai_doctor}</span> → <strong>{e.new_doctor}</strong>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                            AI assessment confirmed without changes ({e.ai_priority} · {e.ai_department})
                          </div>
                        )}
                        {e.notes && (
                          <div style={{ marginTop: "0.45rem", padding: "0.4rem 0.625rem", background: "#FEF9C3", borderRadius: "0.375rem", fontSize: "0.72rem", color: "#92400E", lineHeight: 1.5, fontStyle: "italic" }}>
                            “{e.notes}”
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {overrideCase && (
        <OverrideModal
          c={overrideCase}
          onClose={() => setOverrideCase(null)}
          onSaved={() => fetchData()}
          doctorName={doctor.name}
          doctorStaffId={doctor.staffId}
        />
      )}

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
