// Optional pre-canned input for fast demos: when a patient logs in,
// the triage page reads `seed` and pre-fills the symptoms card so the
// demo person just clicks Continue without typing.
export interface DemoSeed {
  selectedSymptoms: string[];
  freeText: string;
  painScore: number;
  painLocation?: "chest" | "abdomen" | "head" | "back" | "limb" | "other" | "";
  /** Expected triage outcome — used for the login-page badge only, not enforced */
  expectedPriority: "P1" | "P2" | "P3";
}

export const DEMO_USERS = [
  // ── Manual demo accounts (Liyana types live for the jury) ─────────────────
  {
    id: "patient-001",
    name: "Ahmad Razif",
    phone: "0123456789",
    password: "demo123",
    role: "PATIENT",
    icNumber: "900101-10-1234",
    history: {
      blood_type: "O+",
      allergies: ["Penicillin"],
      chronic_conditions: ["Hypertension"],
      current_medications: ["Amlodipine 5mg"],
      recent_diagnoses: ["Upper respiratory tract infection", "Hypertension follow-up"],
    },
  },
  {
    id: "patient-002",
    name: "Siti Nurhaliza",
    phone: "0198765432",
    password: "demo123",
    role: "PATIENT",
    icNumber: "950215-14-5678",
    history: {
      blood_type: "A+",
      allergies: [],
      chronic_conditions: ["Type 2 Diabetes"],
      current_medications: ["Metformin 500mg"],
      recent_diagnoses: ["Diabetes follow-up"],
    },
  },

  // ── Pre-seeded demo accounts (one-click cases for populating doctor queue) ─
  // P1 — clear cardiac emergency. Pain 9 + chest → forced to P1 by pain rule.
  {
    id: "patient-demo-p1",
    name: "Encik Hassan",
    phone: "0111111111",
    password: "demo123",
    role: "PATIENT",
    icNumber: "680515-08-1122",
    history: {
      blood_type: "B+",
      allergies: [],
      chronic_conditions: ["Hypertension", "High cholesterol"],
      current_medications: ["Amlodipine 10mg", "Atorvastatin 20mg"],
      recent_diagnoses: ["Hypertension follow-up"],
    },
    seed: {
      selectedSymptoms: ["Chest Pain", "Difficulty Breathing", "Dizziness"],
      freeText: "Severe crushing chest pain that started 30 minutes ago, radiating down my left arm. Sweating heavily and feel short of breath.",
      painScore: 9,
      painLocation: "chest",
      expectedPriority: "P1",
    } as DemoSeed,
  },

  // P2 — fever >39°C lasting >2 days with chronic condition (forced P2 by duration + comorbidity)
  {
    id: "patient-demo-p2-a",
    name: "Puan Aishah",
    phone: "0122222222",
    password: "demo123",
    role: "PATIENT",
    icNumber: "780923-14-3344",
    history: {
      blood_type: "O+",
      allergies: ["Sulfa drugs"],
      chronic_conditions: ["Type 2 Diabetes"],
      current_medications: ["Metformin 850mg"],
      recent_diagnoses: ["Diabetes follow-up"],
    },
    seed: {
      selectedSymptoms: ["Fever", "Cough", "Body Aches", "Fatigue"],
      freeText: "Fever measured 39.2°C for the last 3 days. Persistent dry cough getting worse at night. Body aches all over and very tired.",
      painScore: 5,
      painLocation: "head",
      expectedPriority: "P2",
    } as DemoSeed,
  },

  // P2 — pain 7 in abdomen (forced P2 minimum by pain rule for abdominal complaints)
  {
    id: "patient-demo-p2-b",
    name: "Encik Faisal",
    phone: "0133333333",
    password: "demo123",
    role: "PATIENT",
    icNumber: "850612-10-5566",
    history: {
      blood_type: "AB+",
      allergies: [],
      chronic_conditions: [],
      current_medications: [],
      recent_diagnoses: [],
    },
    seed: {
      selectedSymptoms: ["Severe Abdominal Pain", "Nausea", "Vomiting"],
      freeText: "Sharp pain in my lower right abdomen since this morning. Vomited twice. Cannot eat. Pain gets much worse when I press on it.",
      painScore: 7,
      painLocation: "abdomen",
      expectedPriority: "P2",
    } as DemoSeed,
  },

  // P2 — LOW severity: persistent cough >1 week, mild fever (>2 days). Triages P2 by duration only.
  // Designed to land at the BOTTOM of the doctor's P2 queue once severity scoring is applied.
  {
    id: "patient-demo-p2-c",
    name: "Pak Ramli",
    phone: "0155555555",
    password: "demo123",
    role: "PATIENT",
    icNumber: "720430-08-9900",
    history: {
      blood_type: "O+",
      allergies: [],
      chronic_conditions: [],
      current_medications: [],
      recent_diagnoses: [],
    },
    seed: {
      selectedSymptoms: ["Cough", "Fatigue", "Sore Throat"],
      freeText: "Persistent dry cough for 8 days now. Low-grade fever around 38.6°C on and off. Feeling tired but still functional. No chest pain, no breathing problems.",
      painScore: 2,
      painLocation: "",
      expectedPriority: "P2",
    } as DemoSeed,
  },

  // P3 — mild cold, no red flags, mild pain
  {
    id: "patient-demo-p3",
    name: "Cik Maya",
    phone: "0144444444",
    password: "demo123",
    role: "PATIENT",
    icNumber: "990108-14-7788",
    history: {
      blood_type: "A+",
      allergies: [],
      chronic_conditions: [],
      current_medications: [],
      recent_diagnoses: [],
    },
    seed: {
      selectedSymptoms: ["Sore Throat", "Cough"],
      freeText: "Mild sore throat and slight cough for the past 2 days. No fever. Just feels like a normal cold.",
      painScore: 2,
      painLocation: "",
      expectedPriority: "P3",
    } as DemoSeed,
  },
];

export function findUser(phone: string, password: string) {
  return DEMO_USERS.find((u) => u.phone === phone && u.password === password) ?? null;
}

export type StaffRole = "DOCTOR" | "FRONTDESK" | "ADMIN";

export interface DemoStaff {
  id: string;
  name: string;
  staffId: string;
  password: string;
  role: StaffRole;
  department: string;
  hospital: string;
}

export const DEMO_STAFF: DemoStaff[] = [
  // ── DOCTOR — clinical authority, can override AI assessments ──
  {
    id: "doctor-001",
    name: "Dr. Tan Wei Ming",
    staffId: "MOH-D-2001",
    password: "doctor123",
    role: "DOCTOR",
    department: "Emergency Medicine",
    hospital: "Hospital Kuala Lumpur",
  },
  {
    id: "doctor-002",
    name: "Dr. Lim Mei Hua",
    staffId: "MOH-D-2002",
    password: "doctor123",
    role: "DOCTOR",
    department: "Cardiology",
    hospital: "Hospital Kajang",
  },
  // ── FRONT DESK — patient check-in / arrival tracking ──
  {
    id: "frontdesk-001",
    name: "Nurul Aina",
    staffId: "MOH-F-3001",
    password: "frontdesk123",
    role: "FRONTDESK",
    department: "Patient Registration",
    hospital: "Hospital Kuala Lumpur",
  },
  {
    id: "frontdesk-002",
    name: "Rahim Abdullah",
    staffId: "MOH-F-3002",
    password: "frontdesk123",
    role: "FRONTDESK",
    department: "Ward Reception",
    hospital: "Hospital Kajang",
  },
  // ── ADMIN — read-only ops oversight ──
  {
    id: "admin-001",
    name: "Farah Zulkifli",
    staffId: "MOH-A-1001",
    password: "admin123",
    role: "ADMIN",
    department: "Operations",
    hospital: "MOH Central",
  },
];

export function findStaff(staffId: string, password: string): DemoStaff | null {
  return DEMO_STAFF.find((s) => s.staffId === staffId && s.password === password) ?? null;
}
