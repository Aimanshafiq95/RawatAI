"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RiDashboardLine, RiAlertLine, RiHospitalLine,
  RiUserHeartLine, RiRefreshLine, RiRadarLine,
  RiCheckLine, RiArrowRightUpLine, RiTimeLine,
  RiGroupLine, RiShieldCrossLine, RiEditLine, RiCloseLine,
  RiSaveLine, RiErrorWarningLine,
} from "react-icons/ri";

interface CaseRecord {
  session_id: string;
  patient_name: string;
  priority: "P1" | "P2" | "P3";
  summary: string;
  symptoms: string;
  facility_id: string;
  facility_name: string;
  doctor_name: string;
  doctor_specialty: string;
  created_at: number;
  overridden?: boolean;
  override_department?: string;
  override_doctor?: string;
  override_priority?: "P1" | "P2" | "P3";
  override_notes?: string;
  overridden_at?: number;
}

interface SurgeEvent {
  facility_id: string;
  facility_name: string;
  detected_at: number;
  util_at_detection: number;
  rerouted_to: string;
}

interface CapacityEntry {
  id: string;
  name: string;
  delta: number;
  adjusted_util: number;
  status: "NORMAL" | "ELEVATED" | "SURGE" | "CRITICAL";
}

interface AdminData {
  cases: CaseRecord[];
  surge_events: SurgeEvent[];
  capacity_snapshot: CapacityEntry[];
  stats: { total: number; p1: number; p2: number; p3: number; surges: number };
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2", label: "P1 CRITICAL" },
  P2: { color: "#1A56DB", bg: "#DBEAFE", label: "P2 URGENT" },
  P3: { color: "#065F46", bg: "#D1FAE5", label: "P3 ROUTINE" },
};

const CAPACITY_STYLE: Record<string, { color: string; bg: string; bar: string }> = {
  NORMAL:   { color: "#065F46", bg: "#D1FAE5", bar: "#10B981" },
  ELEVATED: { color: "#92400E", bg: "#FEF3C7", bar: "#F59E0B" },
  SURGE:    { color: "#E02424", bg: "#FEE2E2", bar: "#E02424" },
  CRITICAL: { color: "#E02424", bg: "#FEE2E2", bar: "#E02424" },
};

const DEPARTMENTS = [
  "Emergency Medicine", "Internal Medicine", "Cardiology", "Neurology",
  "Orthopaedics", "Paediatrics", "Obstetrics & Gynaecology", "Psychiatry",
  "General Surgery", "Dermatology", "Ophthalmology", "ENT",
  "Respiratory Medicine", "Gastroenterology", "Nephrology", "Oncology",
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem" }}>
      <div style={{ width: 48, height: 48, borderRadius: "0.625rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, marginTop: "0.2rem" }}>{label}</div>
      </div>
    </div>
  );
}

// ── Override Modal ─────────────────────────────────────────────────────────────
function OverrideModal({ c, onClose, onSaved }: { c: CaseRecord; onClose: () => void; onSaved: () => void }) {
  const [department, setDepartment] = useState(c.override_department ?? c.doctor_specialty ?? "");
  const [doctor,     setDoctor]     = useState(c.override_doctor ?? c.doctor_name ?? "");
  const [priority,   setPriority]   = useState<"P1"|"P2"|"P3">(c.override_priority ?? c.priority);
  const [notes,      setNotes]      = useState(c.override_notes ?? "");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/cases/${c.session_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        override_department: department,
        override_doctor:     doctor,
        override_priority:   priority,
        override_notes:      notes,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSaved(); onClose(); }, 800);
  }

  const aiPriority  = PRIORITY_STYLE[c.priority];
  const newPriority = PRIORITY_STYLE[priority];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: "0.875rem", width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Modal header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RiEditLine size={18} color="#1A56DB" />
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>Doctor Override</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "0.2rem" }}>Patient: {c.patient_name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}>
            <RiCloseLine size={22} />
          </button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* AI vs Override comparison banner */}
          <div style={{ background: "#F9FAFB", borderRadius: "0.625rem", padding: "0.875rem 1rem", display: "flex", gap: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>AI Assessment</div>
              <span style={{ background: aiPriority.bg, color: aiPriority.color, padding: "0.2rem 0.6rem", borderRadius: 9999, fontSize: "0.72rem", fontWeight: 700 }}>{aiPriority.label}</span>
              <div style={{ fontSize: "0.78rem", color: "#374151", marginTop: "0.375rem" }}>{c.doctor_specialty} — {c.doctor_name}</div>
              <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.2rem", lineHeight: 1.5 }}>{c.summary}</div>
            </div>
            <div style={{ width: 1, background: "#E5E7EB", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1A56DB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>Doctor Override</div>
              <span style={{ background: newPriority.bg, color: newPriority.color, padding: "0.2rem 0.6rem", borderRadius: 9999, fontSize: "0.72rem", fontWeight: 700 }}>{newPriority.label}</span>
              <div style={{ fontSize: "0.78rem", color: "#374151", marginTop: "0.375rem" }}>{department || "—"} — {doctor || "—"}</div>
            </div>
          </div>

          {/* Priority override */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Override Priority</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["P1", "P2", "P3"] as const).map(p => {
                const ps = PRIORITY_STYLE[p];
                return (
                  <button key={p} onClick={() => setPriority(p)}
                    style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: `2px solid ${priority === p ? ps.color : "#E5E7EB"}`, background: priority === p ? ps.bg : "#fff", color: priority === p ? ps.color : "#6B7280", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s" }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Correct Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">— Select department —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Assign Doctor</label>
            <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="e.g. Dr. Ahmad Farouk" />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Override Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Reason for override — e.g. Patient history suggests cardiac involvement, reassigning to Cardiology." style={{ resize: "none" }} />
          </div>

          {/* Responsible AI notice */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "0.5rem", padding: "0.625rem 0.875rem" }}>
            <RiErrorWarningLine size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "0.72rem", color: "#92400E", lineHeight: 1.5, margin: 0 }}>
              This override will be logged with a timestamp and your identity for audit purposes. The AI assessment is preserved alongside your correction.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #F3F4F6", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || saved}
            className="btn-primary"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", opacity: saving ? 0.7 : 1 }}>
            {saved
              ? <><RiCheckLine size={15} /> Saved!</>
              : saving
              ? "Saving…"
              : <><RiSaveLine size={15} /> Save Override</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData]               = useState<AdminData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [newCaseIds, setNewCaseIds]   = useState<Set<string>>(new Set());
  const [overrideCase, setOverrideCase] = useState<CaseRecord | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res  = await fetch("/api/admin/cases");
      const json = await res.json() as AdminData;
      setData(prev => {
        if (prev) {
          const prevIds  = new Set(prev.cases.map(c => c.session_id));
          const incoming = new Set(json.cases.filter(c => !prevIds.has(c.session_id)).map(c => c.session_id));
          if (incoming.size > 0) {
            setNewCaseIds(incoming);
            setTimeout(() => setNewCaseIds(new Set()), 3000);
          }
        }
        return json;
      });
      setLastRefresh(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = data?.stats ?? { total: 0, p1: 0, p2: 0, p3: 0, surges: 0 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="RawatAI" style={{ height: 30, width: "auto", objectFit: "contain" }} />
            <span className="font-heading" style={{ fontSize: "1.1rem", color: "#1A56DB" }}>RawatAI</span>
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Console</div>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {[
            { icon: RiDashboardLine, label: "Live Case Feed",    active: true },
            { icon: RiRadarLine,     label: "Surge Events",      active: false },
            { icon: RiHospitalLine,  label: "Facility Capacity", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", background: active ? "#EFF6FF" : "transparent", color: active ? "#1A56DB" : "#374151", fontWeight: active ? 600 : 500, fontSize: "0.875rem", cursor: "pointer" }}>
              <Icon size={18} />{label}
            </div>
          ))}
        </nav>
        <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid #F3F4F6" }}>
          <Link href="/login" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#6B7280", fontWeight: 500 }}>
            ← Patient Portal
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: "2rem 2.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Operations Dashboard</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9999, padding: "0.2rem 0.625rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669" }}>LIVE</span>
              </div>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
              Auto-refreshes every 5 seconds · Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </p>
          </div>
          <button onClick={() => fetchData()} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
            <RiRefreshLine size={15} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
          <StatCard icon={RiGroupLine}  label="Total Cases"  value={stats.total}  color="#1A56DB" bg="#EFF6FF" />
          <StatCard icon={RiAlertLine}  label="P1 Critical"  value={stats.p1}     color="#E02424" bg="#FEE2E2" />
          <StatCard icon={RiTimeLine}   label="P2 Urgent"    value={stats.p2}     color="#1A56DB" bg="#DBEAFE" />
          <StatCard icon={RiCheckLine}  label="P3 Routine"   value={stats.p3}     color="#065F46" bg="#D1FAE5" />
          <StatCard icon={RiRadarLine}  label="Surge Events" value={stats.surges} color="#D97706" bg="#FEF3C7" />
        </div>

        {/* Two-column */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>

          {/* Case feed */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>Live Case Feed</h2>
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{stats.total} total</span>
            </div>

            {!data || data.cases.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <RiGroupLine size={36} color="#D1D5DB" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>No cases yet. Run a triage assessment to see live data.</p>
                <Link href="/patient/triage" style={{ display: "inline-block", marginTop: "1rem", padding: "0.5rem 1.25rem", background: "#1A56DB", color: "#fff", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                  Go to Triage →
                </Link>
              </div>
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Priority", "Patient", "Department / Doctor", "Facility", "Time", "Action"].map(h => (
                        <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.cases.map((c) => {
                      const effectivePriority = c.override_priority ?? c.priority;
                      const ps     = PRIORITY_STYLE[effectivePriority];
                      const aiPs   = PRIORITY_STYLE[c.priority];
                      const isNew  = newCaseIds.has(c.session_id);
                      const dept   = c.override_department ?? c.doctor_specialty;
                      const doc    = c.override_doctor ?? c.doctor_name;

                      return (
                        <tr key={c.session_id} style={{ borderBottom: "1px solid #F9FAFB", background: isNew ? "#F0FDF4" : "transparent", transition: "background 1s" }}>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{ display: "inline-block", background: ps.bg, color: ps.color, padding: "0.2rem 0.625rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700 }}>{ps.label}</span>
                            {c.overridden && c.override_priority && c.override_priority !== c.priority && (
                              <div style={{ fontSize: "0.62rem", color: "#9CA3AF", marginTop: "0.2rem", textDecoration: "line-through" }}>
                                was {aiPs.label}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontWeight: 600, fontSize: "0.85rem", color: "#111827", whiteSpace: "nowrap" }}>
                            {c.patient_name}
                            {isNew && (
                              <span style={{ marginLeft: "0.375rem", fontSize: "0.65rem", background: "#D1FAE5", color: "#059669", padding: "0.1rem 0.375rem", borderRadius: 9999, fontWeight: 700 }}>NEW</span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#374151" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <RiUserHeartLine size={12} color={c.overridden ? "#D97706" : "#059669"} />
                              <span>{dept || "—"}</span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.1rem" }}>{doc || "—"}</div>
                            {c.overridden && (
                              <span style={{ fontSize: "0.62rem", background: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.375rem", borderRadius: 9999, fontWeight: 700, marginTop: "0.2rem", display: "inline-block" }}>
                                ✎ DOCTOR OVERRIDE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#374151", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <RiHospitalLine size={12} color="#1A56DB" />
                              {c.facility_name || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>{timeAgo(c.created_at)}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <button onClick={() => setOverrideCase(c)}
                              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", borderRadius: "0.375rem", border: `1.5px solid ${c.overridden ? "#FCD34D" : "#E5E7EB"}`, background: c.overridden ? "#FEF9C3" : "#fff", color: c.overridden ? "#92400E" : "#374151", fontWeight: 600, fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                              <RiEditLine size={12} />
                              {c.overridden ? "Edit" : "Override"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Surge events */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <RiRadarLine size={16} color="#D97706" />
                <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>Surge Events</h2>
                {stats.surges > 0 && (
                  <span style={{ marginLeft: "auto", background: "#FEF3C7", color: "#92400E", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 9999 }}>{stats.surges}</span>
                )}
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {!data || data.surge_events.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center" }}>
                    <RiCheckLine size={24} color="#D1D5DB" style={{ margin: "0 auto 0.5rem" }} />
                    <p style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>No surges detected yet</p>
                  </div>
                ) : (
                  data.surge_events.map((e, i) => (
                    <div key={i} style={{ padding: "0.75rem 1.25rem", borderBottom: i < data.surge_events.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <RiShieldCrossLine size={14} color="#E02424" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>{e.facility_name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "0.1rem" }}>{e.util_at_detection}% occupancy · rerouted to</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", color: "#059669", fontWeight: 600, marginTop: "0.1rem" }}>
                            <RiArrowRightUpLine size={11} />{e.rerouted_to}
                          </div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(e.detected_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Capacity monitor */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <RiHospitalLine size={16} color="#1A56DB" />
                <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>Live Capacity Monitor</h2>
              </div>
              <div style={{ padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {!data || data.capacity_snapshot.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "#9CA3AF", textAlign: "center", padding: "0.75rem 0" }}>No capacity data yet</p>
                ) : (
                  data.capacity_snapshot.map((f) => {
                    const cs = CAPACITY_STYLE[f.status] ?? CAPACITY_STYLE.NORMAL;
                    return (
                      <div key={f.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{f.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cs.color, background: cs.bg, padding: "0.1rem 0.4rem", borderRadius: 9999 }}>{f.status}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: cs.color }}>{f.adjusted_util}%</span>
                          </div>
                        </div>
                        <div className="capacity-bar">
                          <div style={{ height: "100%", width: `${f.adjusted_util}%`, background: cs.bar, borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                        {f.delta > 0 && (
                          <div style={{ fontSize: "0.68rem", color: "#9CA3AF", marginTop: "0.2rem" }}>+{f.delta} pts from {Math.floor(f.delta / 10)} patient(s) routed</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Override modal */}
      {overrideCase && (
        <OverrideModal
          c={overrideCase}
          onClose={() => setOverrideCase(null)}
          onSaved={() => fetchData()}
        />
      )}

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
