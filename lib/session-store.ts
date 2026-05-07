// Shared in-memory store anchored to globalThis so it survives Next.js HMR hot reloads

export type CheckinStatus = "PENDING" | "ARRIVED" | "IN_TREATMENT" | "DISCHARGED";
export type ReviewStatus = "PENDING_REVIEW" | "REVIEWED" | "AUTO_APPROVED";

export interface Differential {
  condition: string;
  department: string;
  priority: "P1" | "P2" | "P3";
  confidence: number; // 0-100, three entries sum to 100
}

export interface CaseRecord {
  session_id: string;
  patient_name: string;
  priority: "P1" | "P2" | "P3";
  summary: string;
  symptoms: string;
  facility_id: string;
  facility_name: string;
  doctor_name: string;
  doctor_specialty: string;
  created_at: number;
  // Doctor override fields
  overridden?: boolean;
  override_department?: string;
  override_doctor?: string;
  override_priority?: "P1" | "P2" | "P3";
  override_notes?: string;
  overridden_at?: number;
  // Human-in-the-loop review
  review_status?: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: number;
  review_notes?: string;
  is_emergency?: boolean; // P1 — bypasses review, triggers call-999 + hospital pre-notify
  // Front desk check-in tracking
  checkin_status?: CheckinStatus;
  checkin_updated_at?: number;
  checkin_updated_by?: string;
  // AI differential diagnoses (Top-3 with confidence)
  differentials?: Differential[];
}

export interface AuditEntry {
  id: string;
  case_session_id: string;
  patient_name: string;
  doctor_name: string;
  doctor_staff_id: string;
  action: "CONFIRMED" | "OVERRIDDEN";
  ai_priority: "P1" | "P2" | "P3";
  new_priority?: "P1" | "P2" | "P3";
  ai_department?: string;
  new_department?: string;
  ai_doctor?: string;
  new_doctor?: string;
  notes?: string;
  timestamp: number;
}

export interface SurgeEvent {
  facility_id: string;
  facility_name: string;
  detected_at: number;
  util_at_detection: number;
  rerouted_to: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __rawat_cases: Map<string, CaseRecord> | undefined;
  // eslint-disable-next-line no-var
  var __rawat_capacity: Map<string, number> | undefined;
  // eslint-disable-next-line no-var
  var __rawat_surge_events: SurgeEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __rawat_demo_seeded: boolean | undefined;
  // eslint-disable-next-line no-var
  var __rawat_audit_log: AuditEntry[] | undefined;
}

globalThis.__rawat_cases        ??= new Map<string, CaseRecord>();
globalThis.__rawat_capacity     ??= new Map<string, number>();
globalThis.__rawat_surge_events ??= [];
globalThis.__rawat_audit_log    ??= [];

// Pre-seed realistic demo overlay so surge detection fires reliably during presentation.
// Hospital Kuala Lumpur (util 71%) + 20 → 91% SURGE
// Hospital Kajang (util 77%) + 15 → 92% SURGE
// Institut Perubatan Respiratori (util 60%) + 28 → 88% SURGE
if (!globalThis.__rawat_demo_seeded) {
  globalThis.__rawat_capacity.set("7a5f5dbb-337d-4605-b1c4-4d2e8fbc520b", 20); // Hospital Kuala Lumpur
  globalThis.__rawat_capacity.set("27dda5ae-2447-4fa8-ac40-94c864c9953a", 15); // Hospital Kajang
  globalThis.__rawat_capacity.set("89c7fa53-3f77-4251-89ad-022f56d4e68e", 28); // Institut Perubatan Respiratori
  globalThis.__rawat_demo_seeded = true;
}

export const cases           = globalThis.__rawat_cases;
export const capacityOverlay = globalThis.__rawat_capacity;
export const surgeEvents     = globalThis.__rawat_surge_events;
export const auditLog        = globalThis.__rawat_audit_log;
