// Geçici demo verisi. İleride veritabanı / gerçek kaynaklarla değiştirilecek.

export const flights = [
  { code: "TK1985", route: "IST → FRA", status: "Uçuşta", delayMin: 150 },
  { code: "TK0011", route: "IST → JFK", status: "Uçuşta", delayMin: 0 },
  { code: "TK0080", route: "IST → NRT", status: "Uçuşta", delayMin: 60 },
  { code: "TK1822", route: "IST → LHR", status: "Kapıda", delayMin: 0 },
  { code: "TK0021", route: "IST → GRU", status: "Uçuşta", delayMin: 0 },
];

export const fleet = [
  { code: "TC-JJP", model: "Boeing 777-300ER", status: "Uçuşta", route: "IST → JFK", progress: 64 },
  { code: "TC-LJA", model: "Airbus A350-900", status: "Uçuşta", route: "IST → NRT", progress: 32 },
  { code: "TC-JNR", model: "Boeing 737 MAX", status: "Bakımda", route: "IST Hangar 3", progress: 0 },
  { code: "TC-LGB", model: "Airbus A321neo", status: "Kapıda", route: "IST → LHR", progress: 0 },
  { code: "TC-JOH", model: "Boeing 787-9", status: "Uçuşta", route: "IST → GRU", progress: 78 },
];

export const resources = {
  activeAircraft: 386,
  crewOnDuty: 1248,
  hotelRoomsFree: 412,
  inMaintenance: 14,
};
