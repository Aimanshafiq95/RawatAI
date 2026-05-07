"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiStethoscopeLine,
  RiFileList3Line,
  RiLogoutBoxLine,
} from "react-icons/ri";

const NAV_ITEMS = [
  { href: "/patient/dashboard", icon: RiDashboardLine, label: "Dashboard" },
  { href: "/patient/triage",    icon: RiStethoscopeLine, label: "Assessment" },
  { href: "/patient/history",   icon: RiFileList3Line,   label: "History" },
];

export default function PatientNav({ user }: { user: any }) {
  const pathname = usePathname();

  function signOut() {
    localStorage.removeItem("demo_user");
    window.location.href = "/login";
  }

  return (
    <>
      {/* ── Mobile-only top header bar ─────────────────────────────────── */}
      <div className="nav-mobile-topbar">
        {/* Left: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo.png" alt="Malaysia" style={{ height: 30, width: "auto", objectFit: "contain" }} />
          <span className="font-heading" style={{ fontSize: "1.15rem", color: "#1A56DB", letterSpacing: "0.03em" }}>
            RawatAI
          </span>
        </div>
        {/* Right: user badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ textAlign: "right", maxWidth: 110, overflow: "hidden" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name?.split(" ")[0] ?? "Patient"}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#6B7280" }}>Patient</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#1A56DB",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span className="font-heading" style={{ fontSize: "0.95rem", color: "#fff" }}>
              {user?.name?.[0] ?? "P"}
            </span>
          </div>
        </div>
      </div>

    <aside className="patient-nav">
      {/* Brand */}
      <div className="nav-brand">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo.png" alt="Malaysia" style={{ height: 30, width: "auto", objectFit: "contain", flexShrink: 0 }} />
          <span className="font-heading" style={{ fontSize: "1.1rem", color: "#1A56DB", letterSpacing: "0.03em" }}>
            RawatAI
          </span>
        </div>
      </div>

      {/* User info */}
      <div className="nav-user-info">
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: "#EFF6FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "0.625rem",
        }}>
          <span className="font-heading" style={{ fontSize: "1rem", color: "#1A56DB" }}>
            {user?.name?.[0] ?? "P"}
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{user?.name}</div>
        <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.15rem" }}>
          {user?.icNumber ?? "Patient"}
        </div>
      </div>

      {/* Nav links */}
      <nav className="nav-links">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: "none", display: "flex", flex: "1 1 0" }}>
              <div className="nav-link-item" style={{
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#1A56DB" : "#374151",
                fontWeight: active ? 600 : 500,
                fontFamily: "Montserrat, sans-serif",
              }}>
                <Icon size={18} />
                <span className="nav-link-label">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="nav-sign-out-wrap">
        <button onClick={signOut} className="nav-sign-out-btn" style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#E02424", fontFamily: "Montserrat, sans-serif",
        }}>
          <RiLogoutBoxLine size={18} />
          <span className="nav-sign-out-label">Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
