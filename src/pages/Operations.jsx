import WorldMap from "../components/WorldMap";
import RightPanel from "../components/RightPanel";

export default function Operations() {
  return (
    <div className="flex-1 flex relative overflow-hidden">
      <div className="flex-1 relative">
        <WorldMap />
      </div>
      <RightPanel />
    </div>
  );
}
