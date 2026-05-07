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
