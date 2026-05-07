"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiUserSettingsLine, RiRefreshLine, RiTimeLine, RiCheckLine,
  RiHospitalLine, RiUserHeartLine, RiLogoutBoxLine, RiLoginBoxLine,
  RiUserAddLine, RiHeartPulseLine, RiCheckDoubleLine,
} from "react-icons/ri";
import type { DemoStaff } from "@/lib/demo-users";
import type { CaseRecord, CheckinStatus } from "@/lib/session-store";

interface AdminData {
  cases: CaseRecord[];
  surge_events: any[];
  capacity_snapshot: any[];
  stats: { total: number; p1: number; p2: number; p3: number; surges: number };
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2", label: "P1" },
  P2: { color: "#1A56DB", bg: "#DBEAFE", label: "P2" },
  P3: { color: "#065F46", bg: "#D1FAE5", label: "P3" },
};

const STATUS_COLUMNS: { key: CheckinStatus; label: string; icon: any; color: string; bg: string; next?: CheckinStatus; nextLabel?: string }[] = [
  { key: "PENDING",      label: "Expected",       icon: RiTimeLine,        color: "#92400E", bg: "#FEF3C7", next: "ARRIVED",      nextLabel: "Mark Arrived" },
  { key: "ARRIVED",      label: "Arrived",        icon: RiUserAddLine,     color: "#1A56DB", bg: "#DBEAFE", next: "IN_TREATMENT", nextLabel: "Send to Treatment" },
  { key: "IN_TREATMENT", label: "In Treatment",   icon: RiHeartPulseLine,  color: "#7C2D12", bg: "#FED7AA", next: "DISCHARGED",   nextLabel: "Mark Discharged" },
  { key: "DISCHARGED",   label: "Discharged",     icon: RiCheckDoubleLine, color: "#065F46", bg: "#D1FAE5" },
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function FrontDeskPage() {
  const router = useRouter();
  const [staff, setStaff]             = useState<DemoStaff | null>(null);
  const [data, setData]               = useState<AdminData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  // Auth gate — must be FRONTDESK
  useEffect(() => {
    const raw = localStorage.getItem("demo_staff");
    if (!raw) { router.replace("/staff/login"); return; }
    try {
      const s = JSON.parse(raw) as DemoStaff;
      if (s.role !== "FRONTDESK") { router.replace("/staff/login"); return; }
      setStaff(s);
    } catch { router.replace("/staff/login"); }
  }, [router]);

  function signOut() {
    localStorage.removeItem("demo_staff");
    router.replace("/staff/login");
  }

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res  = await fetch("/api/admin/cases");
      const json = await res.json() as AdminData;
      setData(json);
      setLastRefresh(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!staff) return;
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData, staff]);

  async function advanceStatus(c: CaseRecord, next: CheckinStatus) {
    setUpdatingId(c.session_id);
    await fetch(`/api/frontdesk/cases/${c.session_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkin_status: next, staff_name: staff?.name }),
    });
    await fetchData(true);
    setUpdatingId(null);
  }

  if (!staff) return null;

  // Group cases by checkin_status (default to PENDING if missing)
  const grouped: Record<CheckinStatus, CaseRecord[]> = {
    PENDING: [], ARRIVED: [], IN_TREATMENT: [], DISCHARGED: [],
  };
  (data?.cases ?? []).forEach(c => {
    const status = c.checkin_status ?? "PENDING";
    grouped[status].push(c);
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/logo.png" alt="RawatAI" style={{ height: 30, width: "auto", objectFit: "contain" }} />
            <span className="font-heading" style={{ fontSize: "1.1rem", color: "#1A56DB" }}>RawatAI</span>
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.08em" }}>Front Desk</div>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {STATUS_COLUMNS.map(s => {
            const Icon = s.icon;
            const count = grouped[s.key].length;
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", color: "#374151", fontSize: "0.8rem" }}>
                <Icon size={16} color={s.color} />
                <span style={{ flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 9999, background: s.bg, color: s.color }}>{count}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="font-heading" style={{ fontSize: "0.85rem", color: "#059669" }}>{staff.name[0]}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff.name}</div>
              <div style={{ fontSize: "0.66rem", color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff.department}</div>
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
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Patient Check-In</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 9999, padding: "0.2rem 0.625rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669" }}>LIVE</span>
              </div>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
              Track patients from arrival through discharge · Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </p>
          </div>
          <button onClick={() => fetchData()} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1.5px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>
            <RiRefreshLine size={15} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Kanban columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", alignItems: "start" }}>
          {STATUS_COLUMNS.map(col => {
            const Icon = col.icon;
            const items = grouped[col.key];
            return (
              <div key={col.key} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)" }}>
                <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.5rem", background: col.bg }}>
                  <Icon size={16} color={col.color} />
                  <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: col.color, letterSpacing: "0.04em" }}>{col.label.toUpperCase()}</h2>
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: col.color, background: "#fff", padding: "0.1rem 0.5rem", borderRadius: 9999 }}>{items.length}</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {items.length === 0 ? (
                    <div style={{ padding: "1.5rem 0.75rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.78rem" }}>
                      No patients
                    </div>
                  ) : (
                    items.map(c => {
                      const effectivePriority = c.override_priority ?? c.priority;
                      const ps = PRIORITY_STYLE[effectivePriority];
                      const isUpdating = updatingId === c.session_id;
                      return (
                        <div key={c.session_id} style={{ background: "#fff", border: c.overridden ? "1.5px solid #FCD34D" : "1px solid #E5E7EB", borderRadius: "0.625rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ display: "inline-block", background: ps.bg, color: ps.color, padding: "0.15rem 0.5rem", borderRadius: 9999, fontSize: "0.65rem", fontWeight: 700 }}>{ps.label}</span>
                            <span style={{ fontSize: "0.65rem", color: "#9CA3AF" }}>
                              {c.checkin_updated_at ? timeAgo(c.checkin_updated_at) : timeAgo(c.created_at)}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111827" }}>{c.patient_name}</div>

                          {/* Doctor override badge — alerts reception that the AI's original setup was changed */}
                          {c.overridden && (
                            <div style={{ background: "#FEF9C3", border: "1px solid #FCD34D", borderRadius: "0.4rem", padding: "0.4rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#92400E", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                ✎ DOCTOR UPDATED
                                {c.reviewed_by && <span style={{ fontWeight: 500, color: "#A16207" }}>by {c.reviewed_by}</span>}
                              </div>
                              {c.override_priority && c.override_priority !== c.priority && (
                                <div style={{ fontSize: "0.65rem", color: "#92400E" }}>
                                  Priority: <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{c.priority}</span> → <strong>{c.override_priority}</strong>
                                </div>
                              )}
                              {c.override_department && c.override_department !== c.doctor_specialty && (
                                <div style={{ fontSize: "0.65rem", color: "#92400E" }}>
                                  Dept: <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{c.doctor_specialty}</span> → <strong>{c.override_department}</strong>
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ fontSize: "0.72rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <RiUserHeartLine size={11} color={c.overridden ? "#D97706" : "#059669"} />
                            {c.override_department ?? c.doctor_specialty ?? "—"}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <RiHospitalLine size={11} color="#1A56DB" />
                            {c.facility_name || "—"}
                          </div>
                          {col.next && (
                            <button
                              onClick={() => advanceStatus(c, col.next!)}
                              disabled={isUpdating}
                              style={{
                                marginTop: "0.25rem", padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                                border: "none", background: col.color, color: "#fff",
                                fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                                opacity: isUpdating ? 0.6 : 1,
                              }}>
                              <RiLoginBoxLine size={12} />
                              {isUpdating ? "Saving…" : col.nextLabel}
                            </button>
                          )}
                          {!col.next && (
                            <div style={{ marginTop: "0.25rem", padding: "0.35rem", borderRadius: "0.4rem", background: "#F0FDF4", color: "#059669", fontSize: "0.7rem", fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                              <RiCheckLine size={12} /> Complete
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
