import { Card, Stat } from "../components/Card";
import { Plane, Users, Hotel, Wrench } from "lucide-react";

const fleet = [
  { code: "TC-JJP", model: "Boeing 777-300ER", status: "Uçuşta", route: "IST → JFK", progress: 64 },
  { code: "TC-LJA", model: "Airbus A350-900", status: "Uçuşta", route: "IST → NRT", progress: 32 },
  { code: "TC-JNR", model: "Boeing 737 MAX", status: "Bakımda", route: "IST Hangar 3", progress: 0 },
  { code: "TC-LGB", model: "Airbus A321neo", status: "Kapıda", route: "IST → LHR", progress: 0 },
  { code: "TC-JOH", model: "Boeing 787-9", status: "Uçuşta", route: "IST → GRU", progress: 78 },
];

const colorFor = (s) =>
  s === "Uçuşta" ? "text-emerald-400" :
  s === "Bakımda" ? "text-orange-400" : "text-cyan-400";

export default function Resources() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Aktif Uçak" value="386" hint="Filodaki toplam" />
        <Stat label="Görevdeki Mürettebat" value="1,248" hint="Pilot + Kabin" accent="text-cyan-400" />
        <Stat label="Boş Otel Odası" value="412" hint="Tüm üsler" accent="text-emerald-400" />
        <Stat label="Bakımda" value="14" hint="3 acil" accent="text-thy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Filo Durumu" className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="text-white/50 text-left text-xs uppercase">
              <tr>
                <th className="py-2">Kuyruk No</th>
                <th>Model</th>
                <th>Durum</th>
                <th>Rota</th>
                <th className="w-32">İlerleme</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((f) => (
                <tr key={f.code} className="border-t border-white/5">
                  <td className="py-3 font-medium">{f.code}</td>
                  <td className="text-white/70">{f.model}</td>
                  <td className={colorFor(f.status)}>{f.status}</td>
                  <td className="text-white/70">{f.route}</td>
                  <td>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div
                        className="h-full bg-thy rounded-full"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Kaynak Tahsisi">
          {[
            { icon: Plane, label: "Uçak kullanımı", v: 82 },
            { icon: Users, label: "Mürettebat", v: 76 },
            { icon: Hotel, label: "Otel kontenjanı", v: 58 },
            { icon: Wrench, label: "Bakım kapasitesi", v: 91 },
          ].map(({ icon: Icon, label, v }) => (
            <div key={label} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-white/85">
                  <Icon size={14} className="text-thy" /> {label}
                </span>
                <span className="text-white/70">{v}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full">
                <div className="h-full bg-gradient-to-r from-thy to-red-400 rounded-full" style={{ width: `${v}%` }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
