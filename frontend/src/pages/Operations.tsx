import WorldMap from "../components/WorldMap";
import RightPanel from "../components/RightPanel";
import LiveFlights from "../components/LiveFlights";

export default function Operations() {
  return (
    <div className="flex-1 flex flex-col xl:flex-row relative overflow-y-auto xl:overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-[340px]">
          <WorldMap />
        </div>
        <div className="hidden xl:block p-4 max-h-[260px]">
          <LiveFlights />
        </div>
      </div>
      <RightPanel />
    </div>
  );
}
