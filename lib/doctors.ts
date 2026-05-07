import { haversine } from "./routing";

export type Specialty =
  | "Emergency Medicine"
  | "Cardiology"
  | "Pulmonology"
  | "Orthopedics"
  | "Gastroenterology"
  | "Neurology"
  | "Endocrinology"
  | "General Medicine"
  | "General Practitioner";

export interface VirtualDoctor {
  id: string;
  name: string;
  specialty: Specialty;
  hospital: string;
  state: string;
  lat: number;
  lon: number;
  years_experience: number;
  languages: string[];
}

export const DOCTORS: VirtualDoctor[] = [
  // Kuala Lumpur
  { id: "d-001", name: "Dr. Amir Hamzah",    specialty: "Emergency Medicine",   hospital: "Hospital Kuala Lumpur",        state: "W.P. Kuala Lumpur", lat: 3.1478, lon: 101.6953, years_experience: 14, languages: ["Malay", "English"] },
  { id: "d-002", name: "Dr. Sarah Chen",     specialty: "Cardiology",            hospital: "Hospital Kuala Lumpur",        state: "W.P. Kuala Lumpur", lat: 3.1478, lon: 101.6953, years_experience: 11, languages: ["Malay", "English", "Mandarin"] },
  { id: "d-003", name: "Dr. Raj Kumar",      specialty: "General Medicine",      hospital: "Hospital Kuala Lumpur",        state: "W.P. Kuala Lumpur", lat: 3.1478, lon: 101.6953, years_experience: 8,  languages: ["Malay", "English", "Tamil"] },
  // Selangor
  { id: "d-004", name: "Dr. Priya Nair",     specialty: "Emergency Medicine",    hospital: "Hospital Ampang",              state: "Selangor",           lat: 3.1481, lon: 101.7626, years_experience: 9,  languages: ["Malay", "English", "Tamil"] },
  { id: "d-005", name: "Dr. Lee Wei Huat",   specialty: "Orthopedics",           hospital: "Hospital Ampang",              state: "Selangor",           lat: 3.1481, lon: 101.7626, years_experience: 12, languages: ["Malay", "English", "Mandarin"] },
  { id: "d-006", name: "Dr. Nurul Ain",      specialty: "General Practitioner",  hospital: "Klinik Kesihatan Pandan Jaya", state: "Selangor",           lat: 3.1120, lon: 101.7320, years_experience: 5,  languages: ["Malay", "English"] },
  // Penang
  { id: "d-007", name: "Dr. Fatimah Aziz",   specialty: "General Medicine",      hospital: "Hospital Pulau Pinang",        state: "Pulau Pinang",       lat: 5.4100, lon: 100.3264, years_experience: 10, languages: ["Malay", "English"] },
  { id: "d-008", name: "Dr. Marcus Lim",     specialty: "Pulmonology",           hospital: "Hospital Pulau Pinang",        state: "Pulau Pinang",       lat: 5.4100, lon: 100.3264, years_experience: 15, languages: ["Malay", "English", "Mandarin"] },
  // Johor
  { id: "d-009", name: "Dr. Suresh Pillai",  specialty: "Emergency Medicine",    hospital: "Hospital Sultan Ismail",       state: "Johor",              lat: 1.5014, lon: 103.7639, years_experience: 13, languages: ["Malay", "English", "Tamil"] },
  { id: "d-010", name: "Dr. Siti Hajar",     specialty: "Endocrinology",         hospital: "Hospital Sultan Ismail",       state: "Johor",              lat: 1.5014, lon: 103.7639, years_experience: 7,  languages: ["Malay", "English"] },
  // Perak
  { id: "d-011", name: "Dr. Tan Boon Keat",  specialty: "Gastroenterology",      hospital: "Hospital Raja Permaisuri Bainun", state: "Perak",          lat: 4.5870, lon: 101.0820, years_experience: 16, languages: ["Malay", "English", "Mandarin"] },
  { id: "d-012", name: "Dr. Zainab Mohd",    specialty: "General Practitioner",  hospital: "Klinik Kesihatan Ipoh Timur", state: "Perak",              lat: 4.5975, lon: 101.0901, years_experience: 6,  languages: ["Malay", "English"] },
  // Kelantan
  { id: "d-013", name: "Dr. Wan Azrul",      specialty: "Neurology",             hospital: "Hospital Raja Perempuan Zainab II", state: "Kelantan",     lat: 6.1200, lon: 102.2340, years_experience: 18, languages: ["Malay", "English"] },
  { id: "d-014", name: "Dr. Norzahra Ismail",specialty: "Emergency Medicine",    hospital: "Hospital Raja Perempuan Zainab II", state: "Kelantan",     lat: 6.1200, lon: 102.2340, years_experience: 9,  languages: ["Malay", "English"] },
  // Sarawak
  { id: "d-015", name: "Dr. James Bujang",   specialty: "General Medicine",      hospital: "Hospital Umum Sarawak",        state: "Sarawak",            lat: 1.5590, lon: 110.3464, years_experience: 11, languages: ["Malay", "English"] },
  // Sabah
  { id: "d-016", name: "Dr. Rosnani Omar",   specialty: "Emergency Medicine",    hospital: "Hospital Queen Elizabeth",     state: "Sabah",              lat: 5.9820, lon: 116.0760, years_experience: 10, languages: ["Malay", "English"] },
];

// Map triage priority + symptoms → required specialty
export function getRequiredSpecialty(
  priority: string,
  keySymptoms: string[],
  requiresIcu: boolean
): Specialty {
  if (priority === "P1" || requiresIcu) return "Emergency Medicine";

  const symptoms = keySymptoms.map((s) => s.toLowerCase()).join(" ");

  if (/chest|heart|cardiac|palpitat|blood pressure/.test(symptoms)) return "Cardiology";
  if (/breath|lung|asthma|respiratory|cough|wheez/.test(symptoms)) return "Pulmonology";
  if (/fracture|bone|joint|orthop|sprain|knee|hip|shoulder/.test(symptoms)) return "Orthopedics";
  if (/stomach|abdom|nausea|vomit|diarrhea|gastro|bowel/.test(symptoms)) return "Gastroenterology";
  if (/stroke|neuro|headache|dizziness|seizure|numbness|vision/.test(symptoms)) return "Neurology";
  if (/diabet|blood sugar|insulin|glucose|endocrin/.test(symptoms)) return "Endocrinology";
  if (priority === "P2") return "General Medicine";
  return "General Practitioner";
}

// Find the best available doctor for a given location and specialty
export function assignDoctor(
  lat: number,
  lon: number,
  specialty: Specialty,
  facilityState?: string
): VirtualDoctor {
  // 1st preference: matching specialty in same state
  const sameStateMatch = DOCTORS.filter(
    (d) => d.specialty === specialty && d.state === facilityState
  );
  if (sameStateMatch.length > 0) {
    return sameStateMatch.reduce((a, b) =>
      haversine(lat, lon, a.lat, a.lon) <= haversine(lat, lon, b.lat, b.lon) ? a : b
    );
  }

  // 2nd preference: matching specialty, nearest geographically
  const specialtyMatch = DOCTORS.filter((d) => d.specialty === specialty);
  if (specialtyMatch.length > 0) {
    return specialtyMatch.reduce((a, b) =>
      haversine(lat, lon, a.lat, a.lon) <= haversine(lat, lon, b.lat, b.lon) ? a : b
    );
  }

  // 3rd preference: Emergency Medicine fallback for P2, General for P3
  const fallbackSpecialty: Specialty = specialty === "General Practitioner" ? "General Medicine" : "Emergency Medicine";
  const fallback = DOCTORS.filter((d) => d.specialty === fallbackSpecialty);
  if (fallback.length > 0) {
    return fallback.reduce((a, b) =>
      haversine(lat, lon, a.lat, a.lon) <= haversine(lat, lon, b.lat, b.lon) ? a : b
    );
  }

  // Final fallback: nearest doctor of any specialty
  return DOCTORS.reduce((a, b) =>
    haversine(lat, lon, a.lat, a.lon) <= haversine(lat, lon, b.lat, b.lon) ? a : b
  );
}
