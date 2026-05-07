"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiStethoscopeLine, RiUserSettingsLine, RiShieldUserLine } from "react-icons/ri";

const ROLE_DESTINATION: Record<string, string> = {
  DOCTOR:    "/doctor",
  FRONTDESK: "/frontdesk",
  ADMIN:     "/admin",
};

const DEMO_BUTTONS = [
  { label: "Dr. Tan Wei Ming",  staffId: "MOH-D-2001", password: "doctor123",    role: "DOCTOR",    note: "Emergency · HKL",          icon: RiStethoscopeLine,   color: "#1A56DB" },
  { label: "Dr. Lim Mei Hua",   staffId: "MOH-D-2002", password: "doctor123",    role: "DOCTOR",    note: "Cardiology · Kajang",      icon: RiStethoscopeLine,   color: "#1A56DB" },
  { label: "Nurul Aina",        staffId: "MOH-F-3001", password: "frontdesk123", role: "FRONTDESK", note: "Front Desk · HKL",         icon: RiUserSettingsLine,  color: "#059669" },
  { label: "Rahim Abdullah",    staffId: "MOH-F-3002", password: "frontdesk123", role: "FRONTDESK", note: "Ward Reception · Kajang",  icon: RiUserSettingsLine,  color: "#059669" },
  { label: "Farah Zulkifli",    staffId: "MOH-A-1001", password: "admin123",     role: "ADMIN",     note: "Ops · MOH Central",        icon: RiShieldUserLine,    color: "#6B7280" },
];

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  DOCTOR:    { bg: "#DBEAFE", color: "#1A56DB", label: "DOCTOR" },
  FRONTDESK: { bg: "#D1FAE5", color: "#059669", label: "FRONT DESK" },
  ADMIN:     { bg: "#F3F4F6", color: "#6B7280", label: "ADMIN" },
};

export default function StaffLoginPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      localStorage.setItem("demo_staff", JSON.stringify(data.staff));
      router.push(ROLE_DESTINATION[data.staff.role] ?? "/admin");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(to bottom, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.62) 100%), url('https://1.bp.blogspot.com/-vbkZuQ50oq8/YEWFUMLAlhI/AAAAAAAA9Pg/a6JoelXoGM820d-rURkog9Xiu_f5yaqswCLcBGAsYHQ/s2048/PHKL%2BExterior%2BDay_01.jpg') center/cover no-repeat`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <Link href="/">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
          <img src="/logo.png" alt="Malaysia" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          <span className="font-heading" style={{ fontSize: "1.75rem", color: "#fff" }}>
            RawatAI
          </span>
        </div>
      </Link>
      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", marginBottom: "2rem", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
        Staff Portal
      </p>

      <div className="card" style={{ width: "100%", maxWidth: 460, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Hospital Staff Login</h2>
        <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1.5rem" }}>
          Doctors, front desk & operations
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
              Staff ID
            </label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. MOH-D-2001"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", color: "#E02424", padding: "0.625rem", borderRadius: "0.375rem", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Demo accounts grouped by role */}
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid #F3F4F6", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Demo Accounts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DEMO_BUTTONS.map((u) => {
              const Icon = u.icon;
              const badge = ROLE_BADGE[u.role];
              return (
                <button
                  key={u.staffId}
                  onClick={() => { setStaffId(u.staffId); setPassword(u.password); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.5rem", padding: "0.625rem 0.875rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${u.color}33` }}>
                    <Icon size={15} color={u.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {u.label}
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 9999, background: badge.bg, color: badge.color, letterSpacing: "0.04em" }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{u.note}</div>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#1A56DB", fontWeight: 600, flexShrink: 0 }}>Use →</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: "0.78rem", color: "#6B7280", textDecoration: "none" }}>
            ← Patient login
          </Link>
        </div>
      </div>
    </div>
  );
}
