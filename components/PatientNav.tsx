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
  { href: "/patient/triage",    icon: RiStethoscopeLine, label: "New Assessment" },
  { href: "/patient/history",   icon: RiFileList3Line,   label: "History" },
];

export default function PatientNav({ user }: { user: any }) {
  const pathname = usePathname();

  function signOut() {
    localStorage.removeItem("demo_user");
    window.location.href = "/login";
  }

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "#fff",
      borderRight: "1px solid #E5E7EB", display: "flex",
      flexDirection: "column", padding: "0",
      position: "fixed", top: 0, left: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo.png" alt="Malaysia" style={{ height: 30, width: "auto", objectFit: "contain", flexShrink: 0 }} />
          <span className="font-heading" style={{ fontSize: "1.1rem", color: "#1A56DB", letterSpacing: "0.03em" }}>
            RawatAI
          </span>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: "1.25rem", borderBottom: "1px solid #F3F4F6" }}>
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
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#1A56DB" : "#374151",
                fontWeight: active ? 600 : 500,
                fontSize: "0.875rem", transition: "all 0.15s", cursor: "pointer",
              }}>
                <Icon size={18} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid #F3F4F6" }}>
        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem",
          background: "none", border: "none", cursor: "pointer",
          color: "#E02424", fontWeight: 500, fontSize: "0.875rem",
          fontFamily: "Montserrat, sans-serif",
        }}>
          <RiLogoutBoxLine size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
