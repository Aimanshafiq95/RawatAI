"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PatientNav from "@/components/PatientNav";
import {
  RiStethoscopeLine,
  RiHeartPulseLine,
  RiAlertLine,
  RiMedicineBottleLine,
  RiDropLine,
  RiVirusLine,
  RiShieldCrossLine,
  RiCalendarCheckLine,
  RiArrowRightSLine,
  RiFileList3Line,
  RiMapPinLine,
} from "react-icons/ri";

const MOCK_HISTORY = [
  { id: 1, date: "12 Apr 2026", facility: "Klinik Kesihatan Chow Kit", diagnosis: "Upper Respiratory Tract Infection", priority: "P3", action: "Prescribed Paracetamol & rest" },
  { id: 2, date: "01 Mar 2026", facility: "Hospital Kuala Lumpur", diagnosis: "Hypertension follow-up", priority: "P2", action: "Amlodipine dosage adjusted" },
  { id: 3, date: "15 Jan 2026", facility: "Klinik Kesihatan Brickfields", diagnosis: "Viral fever", priority: "P3", action: "Supportive treatment, rest 3 days" },
];

const PRIORITY_BADGE: Record<string, { color: string; bg: string }> = {
  P1: { color: "#E02424", bg: "#FEE2E2" },
  P2: { color: "#1A56DB", bg: "#DBEAFE" },
  P3: { color: "#065F46", bg: "#D1FAE5" },
};

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("demo_user");
    if (!u) { window.location.href = "/login"; return; }
    setUser(JSON.parse(u));
  }, []);

  if (!user) return null;

  const history = user.history ?? {};
  const lastVisit = MOCK_HISTORY[0];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <PatientNav user={user} />

      {/* Main content */}
      <main className="page-main">

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
            Here is your health summary and recent activity.
          </p>
        </div>

        {/* Top stat cards */}
        <div className="grid-stat-4">
          <StatCard
            icon={<RiCalendarCheckLine size={20} color="#1A56DB" />}
            label="Last Visit"
            value={lastVisit.date}
            bg="#EFF6FF"
          />
          <StatCard
            icon={<RiFileList3Line size={20} color="#065F46" />}
            label="Total Visits"
            value={`${MOCK_HISTORY.length} visits`}
            bg="#ECFDF5"
          />
          <StatCard
            icon={<RiDropLine size={20} color="#E02424" />}
            label="Blood Type"
            value={history.blood_type ?? "Unknown"}
            bg="#FEF2F2"
          />
          <StatCard
            icon={<RiHeartPulseLine size={20} color="#7C3AED" />}
            label="Active Conditions"
            value={`${(history.chronic_conditions ?? []).length} conditions`}
            bg="#F5F3FF"
          />
        </div>

        {/* Main grid */}
        <div className="grid-main-sidebar">

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Start assessment CTA */}
            <div style={{
              background: "#1A56DB", borderRadius: "0.75rem", padding: "1.5rem 2rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: "1rem",
            }}>
              <div>
                <div className="font-heading" style={{ fontSize: "1.15rem", color: "#fff", marginBottom: "0.4rem" }}>
                  Not feeling well?
                </div>
                <p style={{ fontSize: "0.875rem", color: "#BFDBFE", lineHeight: 1.6 }}>
                  Describe your symptoms and our AI agents will assess urgency and find the nearest available facility.
                </p>
              </div>
              <Link href="/patient/triage" style={{ textDecoration: "none", flexShrink: 0, marginLeft: "1.5rem" }}>
                <button style={{
                  background: "#fff", color: "#1A56DB", border: "none", borderRadius: "0.5rem",
                  padding: "0.75rem 1.25rem", fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap",
                }}>
                  <RiStethoscopeLine size={16} />
                  Start Assessment
                </button>
              </Link>
            </div>

            {/* Recent visits */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>Recent Visits</h2>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{MOCK_HISTORY.length} records</span>
              </div>
              {MOCK_HISTORY.map((visit, i) => (
                <div key={visit.id} style={{
                  padding: "1rem 1.5rem",
                  borderBottom: i < MOCK_HISTORY.length - 1 ? "1px solid #F9FAFB" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span className="font-heading" style={{
                        fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: 9999,
                        background: PRIORITY_BADGE[visit.priority].bg,
                        color: PRIORITY_BADGE[visit.priority].color,
                      }}>
                        {visit.priority}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{visit.diagnosis}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                      <RiMapPinLine size={13} color="#9CA3AF" />
                      <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{visit.facility}</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#6B7280" }}>{visit.action}</p>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{visit.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — medical profile */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div className="card">
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Medical Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                <ProfileRow
                  icon={<RiDropLine size={16} color="#E02424" />}
                  label="Blood Type"
                  value={history.blood_type ?? "Not recorded"}
                  color="#FEF2F2"
                />

                <ProfileRow
                  icon={<RiAlertLine size={16} color="#D97706" />}
                  label="Allergies"
                  value={(history.allergies ?? []).length > 0 ? history.allergies.join(", ") : "None reported"}
                  color="#FFFBEB"
                  highlight={(history.allergies ?? []).length > 0}
                />

                <ProfileRow
                  icon={<RiVirusLine size={16} color="#1A56DB" />}
                  label="Chronic Conditions"
                  value={(history.chronic_conditions ?? []).length > 0 ? history.chronic_conditions.join(", ") : "None"}
                  color="#EFF6FF"
                />

                <ProfileRow
                  icon={<RiMedicineBottleLine size={16} color="#7C3AED" />}
                  label="Current Medications"
                  value={(history.current_medications ?? []).length > 0 ? history.current_medications.join(", ") : "None"}
                  color="#F5F3FF"
                />

                <ProfileRow
                  icon={<RiShieldCrossLine size={16} color="#065F46" />}
                  label="Recent Diagnoses"
                  value={(history.recent_diagnoses ?? []).length > 0 ? history.recent_diagnoses.join(", ") : "None"}
                  color="#ECFDF5"
                />

              </div>
            </div>

            {/* Quick links */}
            <div className="card">
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>Quick Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { href: "/patient/triage", icon: <RiStethoscopeLine size={16} />, label: "New AI Assessment" },
                  { href: "/patient/history", icon: <RiFileList3Line size={16} />, label: "View Full History" },
                ].map((item) => (
                  <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                      border: "1px solid #E5E7EB", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>
                        {item.icon}
                        {item.label}
                      </div>
                      <RiArrowRightSLine size={16} color="#9CA3AF" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="card" style={{ padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ width: 34, height: 34, borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>{value}</div>
    </div>
  );
}

function ProfileRow({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: "0.375rem", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1rem" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.8rem", color: highlight ? "#D97706" : "#374151", fontWeight: highlight ? 600 : 400 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
