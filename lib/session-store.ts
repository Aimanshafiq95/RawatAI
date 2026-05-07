// Shared in-memory store anchored to globalThis so it survives Next.js HMR hot reloads

export interface CaseRecord {
  session_id: string;
  patient_name: string;
  priority: "P1" | "P2" | "P3";
  summary: string;
  symptoms: string;
  facility_name: string;
  doctor_name: string;
  doctor_specialty: string;
  created_at: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rawat_cases: Map<string, CaseRecord> | undefined;
  // eslint-disable-next-line no-var
  var __rawat_capacity: Map<string, number> | undefined;
}

globalThis.__rawat_cases    ??= new Map<string, CaseRecord>();
globalThis.__rawat_capacity ??= new Map<string, number>();

export const cases           = globalThis.__rawat_cases;
export const capacityOverlay = globalThis.__rawat_capacity;
