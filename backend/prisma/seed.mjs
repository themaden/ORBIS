// ORBIS — IRROPS demo verisi tohumlama
// Çalıştır: npm run seed  (önce: npm run prisma:migrate)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];

// IST hub + destinasyonlar [iata, şehir, ülke, lat, lon]
const AIRPORTS = [
  ["IST", "İstanbul", "Türkiye", 41.26, 28.74, true],
  ["FRA", "Frankfurt", "Almanya", 50.03, 8.57, false],
  ["LHR", "Londra", "İngiltere", 51.47, -0.45, false],
  ["JFK", "New York", "ABD", 40.64, -73.78, false],
  ["CDG", "Paris", "Fransa", 49.0, 2.55, false],
  ["AMS", "Amsterdam", "Hollanda", 52.31, 4.76, false],
  ["DXB", "Dubai", "BAE", 25.25, 55.36, false],
  ["NRT", "Tokyo", "Japonya", 35.76, 140.39, false],
  ["SIN", "Singapur", "Singapur", 1.36, 103.99, false],
  ["GRU", "São Paulo", "Brezilya", -23.43, -46.47, false],
  ["MAD", "Madrid", "İspanya", 40.47, -3.56, false],
  ["SAW", "İstanbul SAW", "Türkiye", 40.9, 29.31, false],
];

const NAMES_F = ["Ahmet", "Mehmet", "Ayşe", "Zeynep", "Ali", "Elif", "Mustafa", "Selin", "Burak", "Deniz", "Can", "Ece", "Emre", "Cem", "Aslı", "Kaan", "Naz", "Onur", "Sema", "Tolga"];
const NAMES_L = ["Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Arslan", "Doğan", "Yıldız", "Aydın", "Öztürk", "Koç", "Kurt", "Özdemir", "Aksoy", "Polat"];

async function main() {
  console.log("Temizleniyor...");
  await prisma.auditLog.deleteMany();
  await prisma.rebookingProposal.deleteMany();
  await prisma.careAction.deleteMany();
  await prisma.disruption.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.costParam.deleteMany();
  await prisma.user.deleteMany();

  // Havalimanları
  const airports = {};
  for (const [iata, city, country, lat, lon, isHub] of AIRPORTS) {
    airports[iata] = await prisma.airport.create({
      data: { iata, city, country, lat, lon, isHub, mctMin: isHub ? 60 : 45 },
    });
  }

  // Uçaklar
  const models = [
    ["Boeing 777-300ER", 300, 49],
    ["Airbus A350-900", 280, 32],
    ["Boeing 787-9", 270, 30],
    ["Airbus A321neo", 180, 20],
    ["Boeing 737 MAX", 150, 16],
  ];
  const aircraft = [];
  for (let i = 0; i < 10; i++) {
    const [model, e, b] = pick(models);
    aircraft.push(
      await prisma.aircraft.create({
        data: { tail: `TC-J${String.fromCharCode(65 + i)}${rnd(9)}`, model, economySeats: e, businessSeats: b },
      })
    );
  }

  // Uçuşlar — bugün IST'ten çıkış/varış
  const today = new Date();
  today.setHours(6, 0, 0, 0);
  const dests = Object.keys(airports).filter((k) => k !== "IST" && k !== "SAW");
  const flights = [];
  let fno = 1900;
  for (let i = 0; i < 22; i++) {
    const ac = pick(aircraft);
    const outbound = i % 2 === 0;
    const other = pick(dests);
    const dep = outbound ? "IST" : other;
    const arr = outbound ? other : "IST";
    const scheduledDep = new Date(today.getTime() + i * 35 * 60000);
    const durMin = 90 + rnd(600);
    const scheduledArr = new Date(scheduledDep.getTime() + durMin * 60000);
    const economyCap = ac.economySeats;
    const businessCap = ac.businessSeats;
    flights.push(
      await prisma.flight.create({
        data: {
          flightNo: `TK${fno++}`,
          depAirportId: airports[dep].id,
          arrAirportId: airports[arr].id,
          scheduledDep,
          scheduledArr,
          status: "PLANNED",
          aircraftId: ac.id,
          economyCap,
          businessCap,
          economyBooked: Math.floor(economyCap * (0.55 + Math.random() * 0.4)),
          businessBooked: Math.floor(businessCap * (0.4 + Math.random() * 0.5)),
        },
      })
    );
  }

  // Yolcular + biletler
  const tiers = ["NONE", "CLASSIC", "CLASSIC", "ELITE", "ELITE_PLUS"];
  const needs = ["NONE", "NONE", "NONE", "NONE", "UM", "WCHR", "MEDICAL", "VIP"];
  const passengers = [];
  for (let i = 0; i < 140; i++) {
    const p = await prisma.passenger.create({
      data: {
        fullName: `${pick(NAMES_F)} ${pick(NAMES_L)}`,
        ticketClass: Math.random() < 0.18 ? "BUSINESS" : "ECONOMY",
        loyalty: pick(tiers),
        specialNeed: pick(needs),
        email: `yolcu${i}@example.com`,
      },
    });
    passengers.push(p);
    // ana segment
    const f = pick(flights);
    const pnr = `PNR${1000 + i}`;
    await prisma.booking.create({
      data: { pnr, passengerId: p.id, flightId: f.id, seat: `${1 + rnd(40)}${pick(["A", "B", "C", "D", "E", "F"])}`, segmentOrder: 1 },
    });
    // %35 bağlantılı: IST üzerinden 2. segment
    if (Math.random() < 0.35) {
      const conn = pick(flights.filter((x) => x.id !== f.id));
      await prisma.booking.create({
        data: {
          pnr,
          passengerId: p.id,
          flightId: conn.id,
          segmentOrder: 2,
          isConnection: true,
          actMin: 40 + rnd(120),
        },
      });
    }
  }

  // Maliyet parametreleri (kural bazlı skor)
  const costs = [
    ["hotel_unit", 80, "Gecelik otel maliyeti (USD)"],
    ["meal_unit", 15, "İkram maliyeti (USD)"],
    ["transfer_unit", 25, "Transfer maliyeti (USD)"],
    ["delay_penalty_per_min", 0.5, "Dakika başına gecikme cezası"],
    ["w_loyalty", 30, "Skor ağırlığı: sadakat"],
    ["w_class", 20, "Skor ağırlığı: bilet sınıfı"],
    ["w_connection", 30, "Skor ağırlığı: bağlantı riski"],
    ["w_special", 20, "Skor ağırlığı: özel ihtiyaç"],
  ];
  for (const [key, value, note] of costs) {
    await prisma.costParam.create({ data: { key, value, note } });
  }

  // Bir IRROPS olayı: ilk IST çıkışlı uçuşu iptal et
  const target = flights.find((f) => f.depAirportId === airports["IST"].id);
  await prisma.flight.update({
    where: { id: target.id },
    data: { status: "CANCELLED" },
  });
  await prisma.disruption.create({
    data: {
      flightId: target.id,
      type: "WEATHER",
      reason: "Hedef havalimanında yoğun fırtına nedeniyle iptal",
    },
  });

  // Demo kullanıcı (giriş)
  await prisma.user.create({
    data: {
      username: "ahmet",
      name: "Ahmet Yılmaz",
      sicil: "THY-04821",
      role: "IOCC",
      passwordHash: await bcrypt.hash("orbis123", 10),
    },
  });

  console.log(
    `Tamam ✓  ${Object.keys(airports).length} havalimanı, ${flights.length} uçuş, ${passengers.length} yolcu, 1 IRROPS olayı, 1 kullanıcı (ahmet / orbis123)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
