"use client";
import { useState } from "react";
import {
  RiEditLine, RiCloseLine, RiCheckLine, RiSaveLine, RiErrorWarningLine,
} from "react-icons/ri";
import type { CaseRecord } from "@/lib/session-store";

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2", label: "P1 CRITICAL" },
  P2: { color: "#1A56DB", bg: "#DBEAFE", label: "P2 URGENT" },
  P3: { color: "#065F46", bg: "#D1FAE5", label: "P3 ROUTINE" },
};

const DEPARTMENTS = [
  "Emergency Medicine", "Internal Medicine", "Cardiology", "Neurology",
  "Orthopaedics", "Paediatrics", "Obstetrics & Gynaecology", "Psychiatry",
  "General Surgery", "Dermatology", "Ophthalmology", "ENT",
  "Respiratory Medicine", "Gastroenterology", "Nephrology", "Oncology",
];

export default function OverrideModal({
  c, onClose, onSaved, doctorName, doctorStaffId,
}: {
  c: CaseRecord;
  onClose: () => void;
  onSaved: () => void;
  doctorName?: string;
  doctorStaffId?: string;
}) {
  const [department, setDepartment] = useState(c.override_department ?? c.doctor_specialty ?? "");
  const [doctor,     setDoctor]     = useState(c.override_doctor ?? c.doctor_name ?? "");
  const [priority,   setPriority]   = useState<"P1"|"P2"|"P3">(c.override_priority ?? c.priority);
  const [notes,      setNotes]      = useState(c.override_notes ?? "");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  async function handleSave() {
    setSaving(true);
    // Goes through the doctor review endpoint so it ends up in the audit log
    // AND marks the case as REVIEWED (lifts the patient's "awaiting review" gate).
    await fetch(`/api/doctor/review/${c.session_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_name:         doctorName ?? "Unknown Doctor",
        doctor_staff_id:     doctorStaffId ?? "",
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

          {/* AI's Top-3 differentials — click to populate the override fields */}
          {c.differentials && c.differentials.length > 0 && (
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>
                AI Differential Diagnoses · click to apply
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {c.differentials.map((d, i) => {
                  const ps = PRIORITY_STYLE[d.priority];
                  const matched = priority === d.priority && department === d.department;
                  return (
                    <button key={i} type="button"
                      onClick={() => {
                        setPriority(d.priority);
                        setDepartment(d.department);
                      }}
                      style={{
                        textAlign: "left", width: "100%",
                        background: matched ? ps.bg : "#F9FAFB",
                        border: `1.5px solid ${matched ? ps.color : "#E5E7EB"}`,
                        borderRadius: "0.5rem", padding: "0.625rem 0.75rem", cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: "Montserrat, sans-serif",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "0.6rem", background: ps.bg, color: ps.color, padding: "0.1rem 0.4rem", borderRadius: 9999, fontWeight: 700, flexShrink: 0 }}>{d.priority}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.condition}</span>
                          {i === 0 && (
                            <span style={{ fontSize: "0.55rem", background: "#1A56DB", color: "#fff", padding: "0.05rem 0.35rem", borderRadius: 9999, fontWeight: 700, flexShrink: 0 }}>AI PICK</span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", flexShrink: 0 }}>{d.confidence}%</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6B7280", marginBottom: "0.35rem" }}>{d.department}</div>
                      <div style={{ height: 4, borderRadius: 2, background: "#E5E7EB", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${d.confidence}%`, background: ps.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Correct Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">— Select department —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Assign Doctor</label>
            <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="e.g. Dr. Ahmad Farouk" />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "0.4rem" }}>Override Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Reason for override — e.g. Patient history suggests cardiac involvement, reassigning to Cardiology." style={{ resize: "none" }} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "0.5rem", padding: "0.625rem 0.875rem" }}>
            <RiErrorWarningLine size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "0.72rem", color: "#92400E", lineHeight: 1.5, margin: 0 }}>
              This override will be logged with a timestamp and your identity for audit purposes. The AI assessment is preserved alongside your correction.
            </p>
          </div>
        </div>

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
