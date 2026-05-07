export const DEMO_USERS = [
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
