"use client";
import { useState, useEffect } from "react";
import PatientNav from "@/components/PatientNav";
import { RiMapPinLine, RiCalendarLine, RiFileList3Line } from "react-icons/ri";

const MOCK_HISTORY = [
  { id: 1, date: "12 Apr 2026", facility: "Klinik Kesihatan Chow Kit", state: "W.P. Kuala Lumpur", diagnosis: "Upper Respiratory Tract Infection", priority: "P3", symptoms: "Sore throat, mild fever 37.8°C, runny nose", action: "Prescribed Paracetamol 500mg & rest for 3 days", doctor: "Dr. Farah Anis" },
  { id: 2, date: "01 Mar 2026", facility: "Hospital Kuala Lumpur", state: "W.P. Kuala Lumpur", diagnosis: "Hypertension follow-up", priority: "P2", symptoms: "Headache, BP 145/92, dizziness", action: "Amlodipine dosage adjusted to 10mg daily", doctor: "Dr. Lim Wei Jian" },
  { id: 3, date: "15 Jan 2026", facility: "Klinik Kesihatan Brickfields", state: "W.P. Kuala Lumpur", diagnosis: "Viral fever", priority: "P3", symptoms: "Fever 38.5°C, body aches, fatigue", action: "Supportive treatment, rest 3 days, increase fluid intake", doctor: "Dr. Siti Rohani" },
];

const PRIORITY_BADGE: Record<string, { color: string; bg: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2" },
  P2: { color: "#1A56DB", bg: "#DBEAFE" },
  P3: { color: "#065F46", bg: "#D1FAE5" },
};

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [selected, setSelected] = useState<(typeof MOCK_HISTORY)[0] | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("demo_user");
    if (!u) { window.location.href = "/login"; return; }
    setUser(JSON.parse(u));
  }, []);

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <PatientNav user={user} />
      <main style={{ marginLeft: 220, flex: 1, padding: "2rem 2.5rem" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Medical History</h1>
          <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>{MOCK_HISTORY.length} records on file</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {MOCK_HISTORY.map((visit) => {
              const badge = PRIORITY_BADGE[visit.priority];
              return (
                <div key={visit.id} className="card"
                  onClick={() => setSelected(selected?.id === visit.id ? null : visit)}
                  style={{ cursor: "pointer", borderColor: selected?.id === visit.id ? "#1A56DB" : "#E5E7EB", borderWidth: 1.5, borderLeft: `4px solid ${badge.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span className="font-heading" style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: 9999, background: badge.bg, color: badge.color }}>{visit.priority}</span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>{visit.diagnosis}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
                        <RiMapPinLine size={13} color="#9CA3AF" />
                        <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{visit.facility}</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{visit.action}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>
                      <RiCalendarLine size={13} />
                      {visit.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="card" style={{ borderTop: `3px solid ${PRIORITY_BADGE[selected.priority].color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>Visit Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "1.1rem" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "Date", val: selected.date },
                  { label: "Priority", val: <span className="font-heading" style={{ color: PRIORITY_BADGE[selected.priority].color }}>{selected.priority}</span> },
                  { label: "Diagnosis", val: selected.diagnosis },
                  { label: "Symptoms", val: selected.symptoms },
                  { label: "Treatment", val: selected.action },
                  { label: "Doctor", val: selected.doctor },
                  { label: "Facility", val: selected.facility },
                  { label: "State", val: selected.state },
                ].map((row) => (
                  <div key={row.label} style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "0.625rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{row.label}</div>
                    <div style={{ fontSize: "0.85rem", color: "#111827" }}>{row.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
