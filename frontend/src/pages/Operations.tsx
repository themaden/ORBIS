import WorldMap from "../components/WorldMap";
import RightPanel from "../components/RightPanel";

export default function Operations() {
  return (
    <div className="flex-1 flex flex-col xl:flex-row relative overflow-y-auto xl:overflow-hidden">
      <div className="relative flex-1 min-h-[340px] xl:min-h-0">
        <WorldMap />
      </div>
      <RightPanel />
    </div>
  );
}
