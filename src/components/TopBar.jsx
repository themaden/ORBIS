import { Search } from "lucide-react";

export default function TopBar({ title }) {
  return (
    <div className="flex items-center justify-between px-8 pt-6 pb-4 gap-6">
      <h1 className="text-[32px] font-bold tracking-tight whitespace-nowrap">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="glass rounded-full px-4 py-2 flex items-center gap-3 w-[300px]">
          <Search size={16} className="text-white/60" />
          <input
            placeholder="Uçuş, Yolcu veya Kaynak Ara"
            className="bg-transparent outline-none text-sm placeholder-white/50 flex-1"
          />
        </div>
        <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-thy opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-thy"></span>
          </span>
          <span className="text-sm font-medium">Canlı</span>
        </div>
      </div>
    </div>
  );
}
