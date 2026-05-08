"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      localStorage.setItem("demo_user", JSON.stringify(data.user));
      router.push("/patient/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 100%), url('https://1.bp.blogspot.com/-vbkZuQ50oq8/YEWFUMLAlhI/AAAAAAAA9Pg/a6JoelXoGM820d-rURkog9Xiu_f5yaqswCLcBGAsYHQ/s2048/PHKL%2BExterior%2BDay_01.jpg') center/cover no-repeat`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <Link href="/">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
          <img src="/logo.png" alt="Malaysia" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          <span className="font-heading" style={{ fontSize: "1.75rem", color: "#fff" }}>
            RawatAI
          </span>
        </div>
      </Link>
      <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", marginBottom: "2rem", textAlign: "center" }}>
        AI-powered public healthcare triage
      </p>

      <div className="card" style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>Patient Login</h2>
        <p style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "1.5rem" }}>
          Access your health records and AI triage
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0123456789"
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

        {/* Demo credentials — split into manual (typing demo) + pre-seeded (one-click) */}
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid #F3F4F6", paddingTop: "1.25rem" }}>

          {/* Manual demo accounts */}
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Manual Demo · type symptoms live
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
            {[
              { name: "Ahmad Razif",    phone: "0123456789", note: "Hypertension" },
              { name: "Siti Nurhaliza", phone: "0198765432", note: "Type 2 Diabetes" },
            ].map((u) => (
              <button
                key={u.phone}
                onClick={() => { setPhone(u.phone); setPassword("demo123"); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", cursor: "pointer", width: "100%" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>{u.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{u.note}</div>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#1A56DB", fontWeight: 600 }}>Use →</span>
              </button>
            ))}
          </div>

          {/* Pre-seeded demo accounts — populate the doctor queue fast */}
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Pre-seeded · for queue demo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[
              { name: "Encik Hassan",  phone: "0111111111", note: "Crushing chest pain · pain 9",     priority: "P1", color: "#E02424", bg: "#FEE2E2" },
              { name: "Encik Faisal",  phone: "0133333333", note: "Severe abdominal pain · pain 7",   priority: "P2", color: "#1A56DB", bg: "#DBEAFE" },
              { name: "Puan Aishah",   phone: "0122222222", note: "Fever 39°C, 3 days · pain 5",      priority: "P2", color: "#1A56DB", bg: "#DBEAFE" },
              { name: "Pak Ramli",     phone: "0155555555", note: "Persistent cough 1 week · pain 2", priority: "P2", color: "#1A56DB", bg: "#DBEAFE" },
              { name: "Cik Maya",      phone: "0144444444", note: "Mild sore throat",                  priority: "P3", color: "#065F46", bg: "#D1FAE5" },
            ].map((u) => (
              <button
                key={u.phone}
                onClick={() => { setPhone(u.phone); setPassword("demo123"); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", cursor: "pointer", width: "100%" }}>
                <div style={{ textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 9999, background: u.bg, color: u.color, letterSpacing: "0.04em" }}>{u.priority}</span>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>{u.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{u.note}</div>
                  </div>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#1A56DB", fontWeight: 600 }}>Use →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
