import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RawatAI",
  description: "Malaysia Public Healthcare Agentic AI — Smart Triage & Hospital Routing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
